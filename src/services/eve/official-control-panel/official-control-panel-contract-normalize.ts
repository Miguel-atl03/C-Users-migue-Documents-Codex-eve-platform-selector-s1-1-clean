/**
 * R1 — Canonical normalization for data availability, freshness, screen state, scope.
 * Option B: wire payloads stay domain-shaped; this layer is the typed boundary.
 *
 * buildEffectiveScope does NOT authorize. Callers must resolve belonging in BFF/repo
 * then validateCumulativeScopeChain before constructing EffectiveControlPanelScope.
 */

import type {
  EffectiveControlPanelScope,
  FreshnessVM,
  OfficialPanelEnvelope,
  OfficialPanelErrorVM,
  OfficialPanelScreenState,
  OfficialPanelUnauthorizedEnvelope,
  PanelDataAvailability,
  RequestedControlPanelSelectors,
  CapabilityVM,
} from "./official-control-panel-contract.types";

/** Map wire/domain status tokens onto PanelDataAvailability. */
export function mapWireToPanelDataAvailability(
  wire: string | null | undefined,
): PanelDataAvailability {
  if (wire == null || wire === "") return "unavailable";
  switch (wire) {
    case "available":
      return "available";
    case "empty":
      // Critical: complete evaluation with zero records is available, not unavailable.
      return "available";
    case "partial":
      return "partial";
    case "stale":
      return "stale";
    case "unavailable":
    case "not_evaluated":
      return "unavailable";
    case "error":
      return "error";
    default:
      return "unavailable";
  }
}

/**
 * Empty-record helper: never coerce empty arrays into unavailable/error.
 */
export function panelAvailabilityForCompleteQuery(input: {
  evaluated: boolean;
  technicalFailure?: boolean;
  secondaryFailure?: boolean;
  versionStale?: boolean;
  recordCount?: number;
}): PanelDataAvailability {
  if (input.technicalFailure) return "error";
  if (!input.evaluated) return "unavailable";
  if (input.versionStale) return "stale";
  if (input.secondaryFailure) return "partial";
  return "available";
}

export function buildFreshnessVM(input: {
  generatedAt: string;
  sourceObservedAt?: string | null;
  versionMismatch?: boolean;
  staleReasonCode?: string | null;
}): FreshnessVM {
  const sourceObservedAt =
    typeof input.sourceObservedAt === "string" &&
    input.sourceObservedAt.trim().length > 0
      ? input.sourceObservedAt
      : null;

  if (input.versionMismatch === true) {
    return {
      generatedAt: input.generatedAt,
      sourceObservedAt,
      status: "stale",
      reasonCode: input.staleReasonCode ?? "version_mismatch",
    };
  }

  if (!sourceObservedAt) {
    return {
      generatedAt: input.generatedAt,
      sourceObservedAt: null,
      status: "unknown",
      reasonCode: "source_timestamp_absent",
    };
  }

  // Never treat composition time as source observation.
  if (sourceObservedAt === input.generatedAt) {
    return {
      generatedAt: input.generatedAt,
      sourceObservedAt: null,
      status: "unknown",
      reasonCode: "source_equals_generated_rejected",
    };
  }

  return {
    generatedAt: input.generatedAt,
    sourceObservedAt,
    status: "current",
    reasonCode: null,
  };
}

export function isIsoTimestamp(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  const ms = Date.parse(value);
  return Number.isFinite(ms);
}

/**
 * Pick the latest ISO timestamp from candidate factual observations.
 * Ignores null/invalid values. Does not invent clocks.
 */
export function pickLatestFactualTimestamp(
  candidates: Array<string | null | undefined>,
): string | null {
  let best: string | null = null;
  let bestMs = Number.NEGATIVE_INFINITY;
  for (const raw of candidates) {
    if (typeof raw !== "string" || raw.trim().length === 0) continue;
    if (!isIsoTimestamp(raw)) continue;
    const ms = Date.parse(raw);
    if (ms > bestMs) {
      bestMs = ms;
      best = raw;
    }
  }
  return best;
}

/**
 * Normalize client selectors. engagementId is an alias of relationshipId.
 * Output remains untrusted until server validation.
 */
export function normalizeRequestedSelectors(
  raw: RequestedControlPanelSelectors,
): RequestedControlPanelSelectors {
  const relationshipId = raw.relationshipId ?? raw.engagementId;
  return {
    companyId: raw.companyId,
    relationshipId,
    caseId: raw.caseId,
    userId: raw.userId,
    roleRuntimeSessionId: raw.roleRuntimeSessionId,
    responsibilityId: raw.responsibilityId,
    activityId: raw.activityId,
    activityRuntimeRunId: raw.activityRuntimeRunId,
    processId: raw.processId,
    milestoneId: raw.milestoneId,
  };
}

export type CumulativeScopeInput = {
  companyId?: string | null;
  relationshipId?: string | null;
  caseId?: string | null;
  userId?: string | null;
  roleRuntimeSessionId?: string | null;
  responsibilityId?: string | null;
  activityId?: string | null;
  activityRuntimeRunId?: string | null;
  processId?: string | null;
  milestoneId?: string | null;
};

export type CumulativeScopeValidation =
  | { ok: true; scope: EffectiveControlPanelScope }
  | { ok: false; code: string };

/**
 * Validates cumulative belonging chain then builds EffectiveControlPanelScope.
 * Does not resolve DB belonging — callers must supply already-resolved IDs.
 *
 * Rules:
 * - caseId requires companyId + relationshipId
 * - userId requires caseId
 * - roleRuntimeSessionId requires userId
 * - responsibilityId requires roleRuntimeSessionId
 * - activityId requires roleRuntimeSessionId
 * - activityRuntimeRunId requires activityId
 * - processId / milestoneId require caseId
 */
export function validateAndBuildEffectiveScope(
  input: CumulativeScopeInput,
): CumulativeScopeValidation {
  const companyId = input.companyId?.trim() || null;
  const relationshipId = input.relationshipId?.trim() || null;
  const caseId = input.caseId?.trim() || null;
  const userId = input.userId?.trim() || null;
  const roleRuntimeSessionId = input.roleRuntimeSessionId?.trim() || null;
  const responsibilityId = input.responsibilityId?.trim() || null;
  const activityId = input.activityId?.trim() || null;
  const activityRuntimeRunId = input.activityRuntimeRunId?.trim() || null;
  const processId = input.processId?.trim() || null;
  const milestoneId = input.milestoneId?.trim() || null;

  if (!companyId || !caseId) {
    return { ok: false, code: "scope_missing_company_or_case" };
  }
  if (!relationshipId) {
    return { ok: false, code: "scope_missing_relationship" };
  }

  if (userId && !caseId) {
    return { ok: false, code: "scope_user_requires_case" };
  }
  if (roleRuntimeSessionId && !userId) {
    return { ok: false, code: "scope_role_session_requires_user" };
  }
  if (responsibilityId && !roleRuntimeSessionId) {
    return { ok: false, code: "scope_responsibility_requires_role_session" };
  }
  if (activityId && !roleRuntimeSessionId) {
    return { ok: false, code: "scope_activity_requires_role_session" };
  }
  if (activityRuntimeRunId && !activityId) {
    return { ok: false, code: "scope_run_requires_activity" };
  }
  if ((processId || milestoneId) && !caseId) {
    return { ok: false, code: "scope_process_or_milestone_requires_case" };
  }

  return {
    ok: true,
    scope: {
      companyId,
      relationshipId,
      caseId,
      ...(userId ? { userId } : {}),
      ...(roleRuntimeSessionId ? { roleRuntimeSessionId } : {}),
      ...(responsibilityId ? { responsibilityId } : {}),
      ...(activityId ? { activityId } : {}),
      ...(activityRuntimeRunId ? { activityRuntimeRunId } : {}),
      ...(processId ? { processId } : {}),
      ...(milestoneId ? { milestoneId } : {}),
    },
  };
}

/**
 * @deprecated Prefer validateAndBuildEffectiveScope. Kept for call sites that
 * already validated belonging; still refuses incomplete case without relationship.
 */
export function buildEffectiveScope(input: {
  companyId: string;
  caseId: string;
  relationshipId?: string | null;
  userId?: string | null;
  roleRuntimeSessionId?: string | null;
  responsibilityId?: string | null;
  activityId?: string | null;
  activityRuntimeRunId?: string | null;
  processId?: string | null;
  milestoneId?: string | null;
}): EffectiveControlPanelScope {
  const validated = validateAndBuildEffectiveScope(input);
  if (!validated.ok) {
    throw new Error(`invalid_effective_scope:${validated.code}`);
  }
  return validated.scope;
}

/**
 * Single derivation for global screen state (R1 contract; R3 owns full visuals).
 */
/**
 * Canonical R3 screen-state derivation.
 * Priority: forbidden → not_found → fatal → stale → loading → refreshing → partial → ready
 *
 * Exception: during the first in-flight load (`!hasValidSnapshot && requestInFlight`),
 * `primaryDataStatus === "unavailable"` is not fatal — it maps to `loading`.
 *
 * Soft-refresh failure with a kept snapshot maps to `stale` via
 * `refreshFailedWithSnapshot` — never silently back to `ready`.
 */
export function deriveOfficialPanelScreenState(input: {
  hasValidSnapshot: boolean;
  requestInFlight: boolean;
  refreshFailedWithSnapshot?: boolean;
  httpStatus?: number | null;
  primaryDataStatus: PanelDataAvailability;
  secondaryDataStatuses?: PanelDataAvailability[];
  secondaryFailure?: boolean;
  versionStale?: boolean;
}): OfficialPanelScreenState {
  const status = input.httpStatus ?? null;
  if (status === 401 || status === 403) return "forbidden";
  if (status === 404) return "not_found";

  const secondaryFailure =
    input.secondaryFailure === true ||
    (input.secondaryDataStatuses?.some(
      (s) => s === "error" || s === "unavailable",
    ) ??
      false);

  const primaryHardFail =
    input.primaryDataStatus === "error" ||
    input.primaryDataStatus === "unavailable" ||
    (status != null && status >= 500);

  if (primaryHardFail) {
    if (!input.hasValidSnapshot && input.requestInFlight) {
      return "loading";
    }
    // Soft-refresh primary failure with snapshot → stale (not fatal, not ready).
    if (input.hasValidSnapshot && input.refreshFailedWithSnapshot) {
      return "stale";
    }
    if (!input.hasValidSnapshot) {
      return "fatal";
    }
    // Snapshot present but primary marked error without refreshFailure flag:
    // still stale when refreshFailedWithSnapshot was intended; otherwise fatal.
    return input.refreshFailedWithSnapshot ? "stale" : "fatal";
  }

  if (
    input.refreshFailedWithSnapshot ||
    input.versionStale ||
    input.primaryDataStatus === "stale"
  ) {
    return "stale";
  }

  if (!input.hasValidSnapshot && input.requestInFlight) return "loading";
  if (input.hasValidSnapshot && input.requestInFlight) return "refreshing";

  if (!input.hasValidSnapshot) return "loading";

  if (secondaryFailure || input.primaryDataStatus === "partial") {
    return "partial";
  }
  if (input.primaryDataStatus === "available") return "ready";
  return "fatal";
}

export function buildOfficialPanelEnvelope<T>(input: {
  requestId: string;
  generatedAt: string;
  effectiveScope: EffectiveControlPanelScope;
  dataStatus: PanelDataAvailability;
  freshness: FreshnessVM;
  capabilities: CapabilityVM[];
  data: T | null;
  errors?: OfficialPanelErrorVM[];
}): OfficialPanelEnvelope<T> {
  return {
    requestId: input.requestId,
    generatedAt: input.generatedAt,
    effectiveScope: input.effectiveScope,
    dataStatus: input.dataStatus,
    freshness: input.freshness,
    capabilities: input.capabilities,
    data: input.data,
    errors: input.errors ?? [],
  };
}

export function buildUnauthorizedPanelEnvelope(input: {
  requestId: string;
  generatedAt?: string;
  dataStatus: PanelDataAvailability;
  errors: OfficialPanelErrorVM[];
  capabilities?: CapabilityVM[];
}): OfficialPanelUnauthorizedEnvelope {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  return {
    requestId: input.requestId,
    generatedAt,
    effectiveScope: null,
    dataStatus: input.dataStatus,
    freshness: buildFreshnessVM({ generatedAt }),
    capabilities: input.capabilities ?? [],
    data: null,
    errors: input.errors,
  };
}

/** Map HTTP status to error semantics (no existence leak messaging here). */
export function classifyHttpError(status: number): {
  code: string;
  retryable: boolean;
  screenHint: OfficialPanelScreenState;
} {
  if (status === 401) {
    return {
      code: "session_invalid",
      retryable: false,
      screenHint: "forbidden",
    };
  }
  if (status === 403) {
    return {
      code: "forbidden",
      retryable: false,
      screenHint: "forbidden",
    };
  }
  if (status === 404) {
    return {
      code: "not_found",
      retryable: false,
      screenHint: "not_found",
    };
  }
  if (status === 409) {
    return {
      code: "stale_or_conflict",
      retryable: true,
      screenHint: "stale",
    };
  }
  if (status === 422) {
    return {
      code: "precondition_failed",
      retryable: false,
      screenHint: "partial",
    };
  }
  if (status === 500 || status === 503) {
    return {
      code: "source_failure",
      retryable: true,
      screenHint: "fatal",
    };
  }
  return {
    code: "request_failed",
    retryable: status >= 500,
    screenHint: "fatal",
  };
}

export function buildOfficialPanelErrorVM(input: {
  code: string;
  requestId: string;
  retryable: boolean;
  source?: string;
  message?: string;
}): OfficialPanelErrorVM {
  return {
    code: input.code,
    requestId: input.requestId,
    retryable: input.retryable,
    ...(input.source ? { source: input.source } : {}),
    ...(input.message ? { message: input.message } : {}),
  };
}

/**
 * Safe error body for BFF responses. Never includes stacks, SQL, tokens, policies.
 */
export function buildSafeOfficialPanelErrorBody(input: {
  code: string;
  requestId: string;
  message: string;
  retryable?: boolean;
  dataStatus?: PanelDataAvailability;
}): Record<string, unknown> {
  return {
    error: input.code,
    message: input.message,
    requestId: input.requestId,
    retryable: input.retryable ?? false,
    ...(input.dataStatus ? { dataStatus: input.dataStatus } : {}),
  };
}
