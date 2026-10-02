import type {
  ClientCaseOption,
  ClientCompanyOption,
  ClientRelationshipOption,
} from "@/services/eve/official-control-panel/official-control-panel-context.types";
import type {
  ActivitySelectionStage,
  WorkMapActivityState,
  WorkMapProgressView,
} from "@/services/eve/official-control-panel/official-control-panel-workmap-progress.types";
import type { ActivitySelectionConformanceView } from "@/services/eve/official-control-panel/official-control-panel-activity-selection.types";
import type { CaseUserIndicatorMatrix } from "@/services/eve/official-control-panel/official-control-panel-user-indicator-matrix.types";
import type {
  CaseProcessStatus,
  CaseProcessStructureResponse,
} from "@/services/eve/official-control-panel/official-control-panel-process-structure.types";
import type {
  AggregatedProfileResolutionStatus,
  CaseParticipantSummary,
  FunctionalProfileSummary,
  ProfileResolutionStatusUi,
} from "@/services/eve/official-control-panel/official-control-panel-participants.types";
import type {
  SupportProcessAxisItem,
  SupportProcessAxisResponse,
} from "@/services/eve/official-control-panel/official-control-panel-support-process.types";
import { isSupportProcessAxisCode } from "@/services/eve/official-control-panel/catalogs/support-process-axis.catalog";
import { isCoreMilestoneCode } from "@/services/eve/official-control-panel/catalogs/core-milestone-axis.catalog";
import type {
  CoreMilestoneAxisItem,
  CoreMilestoneAxisResponse,
} from "@/services/eve/official-control-panel/official-control-panel-core-milestone-axis.types";

const CONTEXT_API_ROOT = "/api/eve/official-consultant-control-panel";

export class ContextAuthError extends Error {
  readonly status: 401 | 403;
  readonly requestId: string | null;

  constructor(status: 401 | 403, requestId: string | null = null) {
    super(status === 401 ? "context_auth_required" : "context_access_denied");
    this.name = "ContextAuthError";
    this.status = status;
    this.requestId = requestId;
  }
}

export class ContextNetworkError extends Error {
  constructor() {
    super("context_network_failed");
    this.name = "ContextNetworkError";
  }
}

/** Non-auth BFF failure that preserves the server requestId for fatal UI. */
export class ContextRequestError extends Error {
  readonly status: number;
  readonly requestId: string | null;
  readonly code: string | null;

  constructor(input: {
    status: number;
    message: string;
    requestId?: string | null;
    code?: string | null;
  }) {
    super(input.message);
    this.name = "ContextRequestError";
    this.status = input.status;
    this.requestId = input.requestId ?? null;
    this.code = input.code ?? null;
  }
}

export async function getAuthorizedClientCompanies(
  accessToken: string,
  signal?: AbortSignal,
): Promise<ClientCompanyOption[]> {
  const value = await getContextJson(
    `${CONTEXT_API_ROOT}/client-companies`,
    accessToken,
    signal,
  );
  return parseLabelOptions(value);
}

export async function getActiveRelationships(
  accessToken: string,
  companyId: string,
  signal?: AbortSignal,
): Promise<ClientRelationshipOption[]> {
  const value = await getContextJson(
    `${CONTEXT_API_ROOT}/client-companies/${encodeURIComponent(companyId)}/relationships`,
    accessToken,
    signal,
  );
  return parseLabelOptions(value);
}

export async function getCurrentCases(
  accessToken: string,
  relationshipId: string,
  signal?: AbortSignal,
): Promise<ClientCaseOption[]> {
  const value = await getContextJson(
    `${CONTEXT_API_ROOT}/relationships/${encodeURIComponent(relationshipId)}/cases`,
    accessToken,
    signal,
  );
  if (!Array.isArray(value)) throw new Error("invalid_context_response");

  return value.flatMap((item): ClientCaseOption[] => {
    if (
      !isRecord(item) ||
      !isNonEmptyString(item.id) ||
      !isNonEmptyString(item.label)
    ) {
      return [];
    }
    return [
      {
        id: item.id,
        label: item.label,
        statusLabel:
          typeof item.statusLabel === "string" ? item.statusLabel : null,
      },
    ];
  });
}

export async function getCaseProcessStructure(
  accessToken: string,
  caseId: string,
  signal?: AbortSignal,
): Promise<CaseProcessStructureResponse> {
  const value = await getContextJson(
    `${CONTEXT_API_ROOT}/cases/${encodeURIComponent(caseId)}/process-structure`,
    accessToken,
    signal,
  );
  return parseProcessStructureResponse(value);
}

export async function getCaseParticipants(
  accessToken: string,
  caseId: string,
  signal?: AbortSignal,
): Promise<CaseParticipantSummary[]> {
  const value = await getContextJson(
    `${CONTEXT_API_ROOT}/cases/${encodeURIComponent(caseId)}/participants`,
    accessToken,
    signal,
  );
  return parseParticipantsResponse(value);
}

export async function getCaseWorkMapProgress(
  accessToken: string,
  caseId: string,
  participantId?: string | null,
  userId?: string | null,
  profileId?: string | null,
  signal?: AbortSignal,
  options?: {
    page?: number;
    pageSize?: number;
    search?: string | null;
    status?: string | null;
    selectionStatus?: string | null;
  },
): Promise<WorkMapProgressView> {
  const params = new URLSearchParams();
  if (participantId) params.set("participant_id", participantId);
  if (userId) params.set("user_id", userId);
  if (profileId) params.set("profile_id", profileId);
  params.set("page", String(options?.page ?? 1));
  params.set("page_size", String(options?.pageSize ?? 100));
  if (options?.search) params.set("search", options.search);
  if (options?.status) params.set("status", options.status);
  if (options?.selectionStatus) {
    params.set("selection_status", options.selectionStatus);
  }
  const query = params.size > 0 ? `?${params.toString()}` : "";
  const value = await getContextJson(
    `${CONTEXT_API_ROOT}/cases/${encodeURIComponent(caseId)}/workmap-progress${query}`,
    accessToken,
    signal,
  );
  if (!isRecord(value) || !isRecord(value.progress)) {
    throw new Error("invalid_workmap_progress_response");
  }
  return parseWorkMapProgress(value.progress);
}

export async function getActivitySelectionConformance(
  accessToken: string,
  caseId: string,
  selectionResultId: string,
  itemId: string,
  signal?: AbortSignal,
): Promise<ActivitySelectionConformanceView> {
  const value = await getContextJson(
    `${CONTEXT_API_ROOT}/cases/${encodeURIComponent(caseId)}/activity-selection/${encodeURIComponent(selectionResultId)}/items/${encodeURIComponent(itemId)}/conformance`,
    accessToken,
    signal,
  );
  if (!isRecord(value) || !isRecord(value.conformance)) {
    throw new Error("invalid_activity_selection_conformance_response");
  }
  return value.conformance as ActivitySelectionConformanceView;
}

export async function getCaseUserIndicatorMatrix(
  accessToken: string,
  caseId: string,
  signal?: AbortSignal,
): Promise<CaseUserIndicatorMatrix> {
  const value = await getContextJson(
    `${CONTEXT_API_ROOT}/cases/${encodeURIComponent(caseId)}/user-indicator-matrix`,
    accessToken,
    signal,
  );
  if (!isRecord(value) || !isRecord(value.matrix)) {
    throw new Error("invalid_user_indicator_matrix_response");
  }
  return parseCaseUserIndicatorMatrix(value.matrix);
}

export async function getParticipantProfiles(
  accessToken: string,
  caseId: string,
  participantId: string,
  signal?: AbortSignal,
): Promise<FunctionalProfileSummary[]> {
  const value = await getContextJson(
    `${CONTEXT_API_ROOT}/cases/${encodeURIComponent(caseId)}/participants/${encodeURIComponent(participantId)}/profiles`,
    accessToken,
    signal,
  );
  return parseProfilesResponse(value);
}

export async function getMonitoringRoleActivities(
  accessToken: string,
  caseId: string,
  profileId: string,
  signal?: AbortSignal,
  roleRuntimeSessionId?: string | null,
): Promise<{
  activities: Array<{
    activityId: string | null;
    runId: string;
    label: string;
    selectionReasonLabel: string;
    baseLabel: string;
    causalLabel: string;
    currentBlockLabel: string;
    readinessLabel: string;
    criticalRouteLabel: string;
    roleRuntimeSessionId: string;
    runStateLabel: string;
  }>;
  linkStatus:
    | "empty"
    | "no_runtime_session_link"
    | "linked"
    | "multiple_runtime_sessions"
    | "pending_review"
    | "unavailable"
    | "available";
  message: string | null;
  roleRuntimeSessionId: string | null;
}> {
  const query =
    roleRuntimeSessionId && roleRuntimeSessionId.trim()
      ? `?role_runtime_session_id=${encodeURIComponent(roleRuntimeSessionId.trim())}`
      : "";
  const value = await getContextJson(
    `${CONTEXT_API_ROOT}/cases/${encodeURIComponent(caseId)}/monitoring/roles/${encodeURIComponent(profileId)}/activities${query}`,
    accessToken,
    signal,
  );
  if (!isRecord(value) || !Array.isArray(value.activities)) {
    throw new Error("invalid_monitoring_activities_response");
  }
  const linkStatus =
    value.linkStatus === "available" ||
    value.linkStatus === "no_runtime_session_link" ||
    value.linkStatus === "empty" ||
    value.linkStatus === "linked" ||
    value.linkStatus === "multiple_runtime_sessions" ||
    value.linkStatus === "pending_review" ||
    value.linkStatus === "unavailable"
      ? value.linkStatus
      : "empty";
  return {
    activities: value.activities.flatMap((item) => {
      if (!isRecord(item) || typeof item.runId !== "string") return [];
      return [
        {
          activityId:
            typeof item.activityId === "string" ? item.activityId : null,
          runId: item.runId,
          label: typeof item.label === "string" ? item.label : "Nombre no disponible",
          selectionReasonLabel:
            typeof item.selectionReasonLabel === "string"
              ? item.selectionReasonLabel
              : "No disponible",
          baseLabel:
            typeof item.baseLabel === "string" ? item.baseLabel : "No disponible",
          causalLabel:
            typeof item.causalLabel === "string"
              ? item.causalLabel
              : "No disponible",
          currentBlockLabel:
            typeof item.currentBlockLabel === "string"
              ? item.currentBlockLabel
              : "No disponible",
          readinessLabel:
            typeof item.readinessLabel === "string"
              ? item.readinessLabel
              : "No disponible",
          criticalRouteLabel:
            typeof item.criticalRouteLabel === "string"
              ? item.criticalRouteLabel
              : "No disponible",
          roleRuntimeSessionId:
            typeof item.roleRuntimeSessionId === "string"
              ? item.roleRuntimeSessionId
              : "",
          runStateLabel:
            typeof item.runStateLabel === "string"
              ? item.runStateLabel
              : "No disponible",
        },
      ];
    }),
    linkStatus,
    message: typeof value.message === "string" ? value.message : null,
    roleRuntimeSessionId:
      typeof value.roleRuntimeSessionId === "string"
        ? value.roleRuntimeSessionId
        : null,
  };
}

export async function getMonitoringRoleSessions(
  accessToken: string,
  caseId: string,
  profileId: string,
  signal?: AbortSignal,
): Promise<
  Array<{
    id: string;
    label: string;
    stateLabel: string | null;
    linkStatus: "confirmed" | "pending_review";
  }>
> {
  const value = await getContextJson(
    `${CONTEXT_API_ROOT}/cases/${encodeURIComponent(caseId)}/monitoring/roles/${encodeURIComponent(profileId)}/sessions`,
    accessToken,
    signal,
  );
  if (!isRecord(value) || !Array.isArray(value.sessions)) {
    throw new Error("invalid_monitoring_sessions_response");
  }
  return value.sessions.flatMap((item) => {
    if (!isRecord(item) || !isNonEmptyString(item.id)) return [];
    return [
      {
        id: item.id,
        label: typeof item.label === "string" ? item.label : item.id,
        stateLabel:
          typeof item.stateLabel === "string" ? item.stateLabel : null,
        linkStatus:
          item.linkStatus === "pending_review" ? "pending_review" : "confirmed",
      },
    ];
  });
}

export async function getActivitySelectionCoverage(
  accessToken: string,
  caseId: string,
  participantId: string,
  profileId: string,
  sessionId: string,
  signal?: AbortSignal,
): Promise<import("@/services/eve/official-control-panel/official-control-panel-activity-selection.types").ActivitySelectionCoverageView> {
  const value = await getContextJson(
    `${CONTEXT_API_ROOT}/cases/${encodeURIComponent(caseId)}/participants/${encodeURIComponent(participantId)}/profiles/${encodeURIComponent(profileId)}/sessions/${encodeURIComponent(sessionId)}/activity-selection`,
    accessToken,
    signal,
  );
  if (!isRecord(value)) throw new Error("invalid_activity_selection_response");
  const mapItems = (raw: unknown) => {
    if (!Array.isArray(raw)) return [];
    return raw.flatMap((item) => {
      if (!isRecord(item) || !isNonEmptyString(item.activityId)) return [];
      const classification: import("@/services/eve/official-control-panel/official-control-panel-activity-selection.types").ActivitySelectionItemView["classification"] =
        item.classification === "primary" ||
        item.classification === "non-primary" ||
        item.classification === "pending" ||
        item.classification === "unavailable"
          ? item.classification
          : "unavailable";
      return [
        {
          activityId: item.activityId,
          label: typeof item.label === "string" ? item.label : item.activityId,
          classification,
          selectedSlot:
            typeof item.selectedSlot === "number" ? item.selectedSlot : null,
          selectionReasonLabel:
            typeof item.selectionReasonLabel === "string"
              ? item.selectionReasonLabel
              : null,
          promotionConditionLabel:
            typeof item.promotionConditionLabel === "string"
              ? item.promotionConditionLabel
              : null,
          eligibilityStatus:
            typeof item.eligibilityStatus === "string" ? item.eligibilityStatus : null,
          selectionStatus:
            typeof item.selectionStatus === "string" ? item.selectionStatus : null,
          selectionReasonText:
            typeof item.selectionReasonText === "string" ? item.selectionReasonText : null,
          nonPrimaryContextStatus:
            typeof item.nonPrimaryContextStatus === "string"
              ? item.nonPrimaryContextStatus
              : null,
          runtimeHandoffPriority:
            typeof item.runtimeHandoffPriority === "number"
              ? item.runtimeHandoffPriority
              : null,
          manualReviewRequired:
            typeof item.manualReviewRequired === "boolean"
              ? item.manualReviewRequired
              : false,
          score: isRecord(item.score) ? item.score : null,
          traceFlags: Array.isArray(item.traceFlags) ? item.traceFlags : [],
          ruleRefs: Array.isArray(item.ruleRefs) ? item.ruleRefs : [],
        },
      ];
    });
  };
  const selectionMode =
    value.selectionMode === "reentry-required" ||
    value.selectionMode === "non-competitive-inclusion" ||
    value.selectionMode === "competitive-selection" ||
    value.selectionMode === "manual-review-required" ||
    value.selectionMode === "unavailable"
      ? value.selectionMode
      : "unavailable";
  return {
    resultId: typeof value.resultId === "string" ? value.resultId : null,
    resultVersion:
      typeof value.resultVersion === "number" ? value.resultVersion : null,
    policyVersion:
      typeof value.policyVersion === "string" ? value.policyVersion : null,
    selectionMode,
    selectionModeLabel:
      typeof value.selectionModeLabel === "string"
        ? value.selectionModeLabel
        : null,
    eligibleCount:
      typeof value.eligibleCount === "number" ? value.eligibleCount : null,
    selectedCount:
      typeof value.selectedCount === "number" ? value.selectedCount : null,
    nonPrimaryContextCount:
      typeof value.nonPrimaryContextCount === "number"
        ? value.nonPrimaryContextCount
        : null,
    workmapCoverageGap:
      typeof value.workmapCoverageGap === "boolean"
        ? value.workmapCoverageGap
        : null,
    workmapCoverageGapLabel:
      typeof value.workmapCoverageGapLabel === "string"
        ? value.workmapCoverageGapLabel
        : null,
    promotionConditionLabel:
      typeof value.promotionConditionLabel === "string"
        ? value.promotionConditionLabel
        : null,
    primaryActivities: mapItems(value.primaryActivities),
    nonPrimaryActivities: mapItems(value.nonPrimaryActivities),
    pendingActivities: mapItems(value.pendingActivities),
    dataStatus:
      value.dataStatus === "partial" || value.dataStatus === "unavailable"
        ? value.dataStatus
        : "available",
    message: typeof value.message === "string" ? value.message : null,
    conformance: {
      policyManifestHash:
        isRecord(value.conformance) && typeof value.conformance.policyManifestHash === "string"
          ? value.conformance.policyManifestHash
          : null,
      selectorCodeVersion:
        isRecord(value.conformance) && typeof value.conformance.selectorCodeVersion === "string"
          ? value.conformance.selectorCodeVersion
          : null,
      selectionResultHash:
        isRecord(value.conformance) && typeof value.conformance.selectionResultHash === "string"
          ? value.conformance.selectionResultHash
          : null,
      traceCompletenessStatus:
        isRecord(value.conformance) && typeof value.conformance.traceCompletenessStatus === "string"
          ? value.conformance.traceCompletenessStatus
          : null,
      replayStatus:
        isRecord(value.conformance) && typeof value.conformance.replayStatus === "string"
          ? value.conformance.replayStatus
          : null,
    },
  };
}

export async function getRuntimeBaseMatrix(
  accessToken: string,
  caseId: string,
  participantId: string,
  profileId: string,
  sessionId: string,
  activityId: string,
  runId: string,
  signal?: AbortSignal,
): Promise<
  import("@/services/eve/official-control-panel/official-control-panel-runtime-matrix.types").RuntimeBaseMatrixView
> {
  const value = await getContextJson(
    `${CONTEXT_API_ROOT}/cases/${encodeURIComponent(caseId)}/participants/${encodeURIComponent(participantId)}/profiles/${encodeURIComponent(profileId)}/sessions/${encodeURIComponent(sessionId)}/activities/${encodeURIComponent(activityId)}/runs/${encodeURIComponent(runId)}/runtime/base-matrix`,
    accessToken,
    signal,
  );
  if (!isRecord(value) || !Array.isArray(value.rows)) {
    throw new Error("invalid_runtime_base_matrix_response");
  }
  return value as import("@/services/eve/official-control-panel/official-control-panel-runtime-matrix.types").RuntimeBaseMatrixView;
}

export async function getRuntimeCausalMatrix(
  accessToken: string,
  caseId: string,
  participantId: string,
  profileId: string,
  sessionId: string,
  activityId: string,
  runId: string,
  signal?: AbortSignal,
): Promise<
  import("@/services/eve/official-control-panel/official-control-panel-runtime-matrix.types").RuntimeCausalMatrixView
> {
  const value = await getContextJson(
    `${CONTEXT_API_ROOT}/cases/${encodeURIComponent(caseId)}/participants/${encodeURIComponent(participantId)}/profiles/${encodeURIComponent(profileId)}/sessions/${encodeURIComponent(sessionId)}/activities/${encodeURIComponent(activityId)}/runs/${encodeURIComponent(runId)}/runtime/causal-matrix`,
    accessToken,
    signal,
  );
  if (!isRecord(value) || !Array.isArray(value.rows)) {
    throw new Error("invalid_runtime_causal_matrix_response");
  }
  return value as import("@/services/eve/official-control-panel/official-control-panel-runtime-matrix.types").RuntimeCausalMatrixView;
}

export async function getRuntimeControlState(
  accessToken: string,
  caseId: string,
  participantId: string,
  profileId: string,
  sessionId: string,
  activityId: string,
  runId: string,
  signal?: AbortSignal,
): Promise<
  import("@/services/eve/official-control-panel/official-control-panel-runtime-control.types").RuntimeControlStateView
> {
  const value = await getContextJson(
    `${CONTEXT_API_ROOT}/cases/${encodeURIComponent(caseId)}/participants/${encodeURIComponent(participantId)}/profiles/${encodeURIComponent(profileId)}/sessions/${encodeURIComponent(sessionId)}/activities/${encodeURIComponent(activityId)}/runs/${encodeURIComponent(runId)}/runtime/control-state`,
    accessToken,
    signal,
  );
  if (!isRecord(value) || !isRecord(value.readiness)) {
    throw new Error("invalid_runtime_control_state_response");
  }
  return value as import("@/services/eve/official-control-panel/official-control-panel-runtime-control.types").RuntimeControlStateView;
}

export async function getCaseSupportProcesses(
  accessToken: string,
  caseId: string,
  signal?: AbortSignal,
): Promise<SupportProcessAxisResponse> {
  const value = await getContextJson(
    `${CONTEXT_API_ROOT}/cases/${encodeURIComponent(caseId)}/support-processes`,
    accessToken,
    signal,
  );
  return parseSupportProcessAxisResponse(value);
}

export async function getCaseManualWork(
  accessToken: string,
  caseId: string,
  signal?: AbortSignal,
): Promise<
  import("@/services/eve/official-control-panel/official-control-panel-manual-work.types").ManualWorkTrackingResponse
> {
  const value = await getContextJson(
    `${CONTEXT_API_ROOT}/cases/${encodeURIComponent(caseId)}/manual-work`,
    accessToken,
    signal,
  );
  return parseManualWorkTrackingResponse(value);
}

export type PostCaseManualActionInput = {
  workItemId: string;
  action: string;
  expectedStatus: string;
  expectedVersion: number;
  idempotencyKey: string;
  reason?: string;
  artifactVersionId?: string | null;
  attachFilename?: string;
  attachContentType?: string;
  attachSha256?: string;
  attachContentBase64?: string;
};

export async function postCaseManualAction(
  accessToken: string,
  caseId: string,
  body: PostCaseManualActionInput,
  signal?: AbortSignal,
): Promise<{
  requestId?: string;
  tracking: import("@/services/eve/official-control-panel/official-control-panel-manual-work.types").ManualWorkTrackingResponse | null;
  actionResult: unknown;
}> {
  const response = await fetch(
    `${CONTEXT_API_ROOT}/cases/${encodeURIComponent(caseId)}/manual-actions`,
    {
      method: "POST",
      cache: "no-store",
      signal,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  const payload = (await response.json().catch(() => null)) as {
    requestId?: string;
    tracking?: unknown;
    actionResult?: unknown;
    message?: string;
    code?: string;
  } | null;
  if (!response.ok) {
    const err = new Error(
      payload?.message ?? "No fue posible ejecutar la acción manual.",
    ) as Error & { status?: number; code?: string };
    err.status = response.status;
    err.code = payload?.code;
    throw err;
  }
  return {
    requestId: payload?.requestId,
    tracking: payload?.tracking
      ? parseManualWorkTrackingResponse(payload.tracking)
      : null,
    actionResult: payload?.actionResult ?? null,
  };
}

export type PostCaseManualDownloadInput = {
  workItemId: string;
  artifactVersionId: string;
  expectedStatus: string;
  expectedVersion: number;
  idempotencyKey: string;
  reason?: string;
};

export async function postCaseManualArtifactDownload(
  accessToken: string,
  caseId: string,
  body: PostCaseManualDownloadInput,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(
    `${CONTEXT_API_ROOT}/cases/${encodeURIComponent(caseId)}/manual-artifacts/${encodeURIComponent(body.artifactVersionId)}/download`,
    {
      method: "POST",
      cache: "no-store",
      signal,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/octet-stream",
      },
      body: JSON.stringify({
        workItemId: body.workItemId,
        expectedStatus: body.expectedStatus,
        expectedVersion: body.expectedVersion,
        idempotencyKey: body.idempotencyKey,
        reason: body.reason,
      }),
    },
  );

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
      code?: string;
    } | null;
    const err = new Error(
      payload?.message ?? "No fue posible descargar el paquete.",
    ) as Error & { status?: number; code?: string };
    err.status = response.status;
    err.code = payload?.code;
    throw err;
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = /filename="([^"]+)"/.exec(disposition);
  const filename = match?.[1] ?? "paquete-fuente.bin";
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function getCaseParallelProduction(
  accessToken: string,
  caseId: string,
  signal?: AbortSignal,
): Promise<
  import("@/services/eve/official-control-panel/official-control-panel-parallel-production.types").ParallelProductionTrackingResponse
> {
  const value = await getContextJson(
    `${CONTEXT_API_ROOT}/cases/${encodeURIComponent(caseId)}/parallel-production`,
    accessToken,
    signal,
  );
  return parseParallelProductionTrackingResponse(value);
}

export async function getCaseExperienceState(
  accessToken: string,
  caseId: string,
  scope: {
    companyId: string;
    relationshipId: string;
  },
  selectors?: {
    userId?: string | null;
    roleRuntimeSessionId?: string | null;
    activityId?: string | null;
    screenKey?: string | null;
  },
  signal?: AbortSignal,
): Promise<
  import("@/services/eve/official-control-panel/official-control-panel-contract.types").OfficialPanelEnvelope<
    import("@/services/eve/official-control-panel/official-control-panel-experience.types").ExperienceStateResponse
  >
> {
  const { adaptExperienceStateToEnvelope } = await import(
    "@/services/eve/official-control-panel/official-control-panel-contract-adapt"
  );
  const { createOfficialPanelRequestId } = await import(
    "@/services/eve/official-control-panel/official-control-panel-observability"
  );

  const qs = new URLSearchParams();
  if (selectors?.userId) qs.set("userId", selectors.userId);
  if (selectors?.roleRuntimeSessionId) {
    qs.set("roleRuntimeSessionId", selectors.roleRuntimeSessionId);
  }
  if (selectors?.activityId) qs.set("activityId", selectors.activityId);
  if (selectors?.screenKey) qs.set("screenKey", selectors.screenKey);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const value = await getContextJson(
    `${CONTEXT_API_ROOT}/cases/${encodeURIComponent(caseId)}/experience-state${suffix}`,
    accessToken,
    signal,
  );
  const wire = parseExperienceStateResponse(value);
  const requestId =
    typeof (value as { requestId?: unknown }).requestId === "string"
      ? (value as { requestId: string }).requestId
      : createOfficialPanelRequestId();

  return adaptExperienceStateToEnvelope(wire, {
    requestId,
    companyId: scope.companyId,
    relationshipId: scope.relationshipId,
    caseId,
  });
}

export async function getMonitoringUsers(
  accessToken: string,
  caseId: string,
  signal?: AbortSignal,
): Promise<
  import("@/services/eve/official-control-panel/official-control-panel-monitoring.types").MonitoringUsersResponse
> {
  const value = await getContextJson(
    `${CONTEXT_API_ROOT}/cases/${encodeURIComponent(caseId)}/monitoring/users`,
    accessToken,
    signal,
  );
  return parseMonitoringUsersResponse(value);
}

export async function postCaseExperienceAction(
  accessToken: string,
  caseId: string,
  body: {
    userId: string;
    screenKey: string;
    actionType: string;
    reasonCode: string;
    beforeState: string;
    expectedEffect: string;
    auditRef: string;
    roleRuntimeSessionId?: string | null;
    activityId?: string | null;
    idempotencyKey: string;
  },
): Promise<{
  ok: true;
  action: unknown;
  requestId: string;
  actionId: string | null;
}> {
  const {
    capabilityForAction,
    isExperienceActionType,
  } = await import(
    "@/services/eve/official-control-panel/official-control-panel-experience.types"
  );
  if (!isExperienceActionType(body.actionType)) {
    throw new Error("invalid_experience_action");
  }
  if (!body.idempotencyKey?.trim()) {
    throw new Error("experience_idempotency_required");
  }
  const response = await fetch(
    `${CONTEXT_API_ROOT}/cases/${encodeURIComponent(caseId)}/experience-actions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: body.userId,
        screenKey: body.screenKey,
        actionType: body.actionType,
        reasonCode: body.reasonCode,
        beforeState: body.beforeState,
        expectedEffect: body.expectedEffect,
        roleRuntimeSessionId: body.roleRuntimeSessionId ?? null,
        activityId: body.activityId ?? null,
        idempotencyKey: body.idempotencyKey,
        capability: capabilityForAction(body.actionType),
      }),
    },
  );
  if (response.status === 401 || response.status === 403) {
    throw new ContextAuthError(response.status === 401 ? 401 : 403);
  }
  if (!response.ok) {
    throw new Error("experience_action_failed");
  }
  return response.json() as Promise<{
    ok: true;
    action: unknown;
    requestId: string;
    actionId: string | null;
  }>;
}

export async function postCaseExperienceEvent(
  accessToken: string,
  caseId: string,
  body: {
    screenKey: string;
    eventType: string;
    sessionReference?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<{ ok: true; deduped?: boolean; event?: unknown; eventId?: string | null }> {
  const { isExperienceEventType, isExperienceScreenKey } = await import(
    "@/services/eve/official-control-panel/official-control-panel-experience.types"
  );
  if (
    !isExperienceScreenKey(body.screenKey) ||
    !isExperienceEventType(body.eventType)
  ) {
    throw new Error("invalid_experience_event");
  }
  const token = accessToken.trim();
  if (!token) throw new ContextAuthError(401);

  let response: Response;
  try {
    response = await fetch(
      `${CONTEXT_API_ROOT}/cases/${encodeURIComponent(caseId)}/experience-events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          screenKey: body.screenKey,
          eventType: body.eventType,
          sessionReference: body.sessionReference,
          metadata: body.metadata ?? {},
        }),
        cache: "no-store",
      },
    );
  } catch {
    throw new ContextNetworkError();
  }

  if (response.status === 401 || response.status === 403) {
    throw new ContextAuthError(response.status === 401 ? 401 : 403);
  }
  if (!response.ok) {
    throw new Error("experience_event_failed");
  }
  return response.json() as Promise<{
    ok: true;
    deduped?: boolean;
    event?: unknown;
    eventId?: string | null;
  }>;
}

function parseExperienceStateResponse(
  value: unknown,
): import("@/services/eve/official-control-panel/official-control-panel-experience.types").ExperienceStateResponse {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.caseId) ||
    !isNonEmptyString(value.companyId) ||
    !isNonEmptyString(value.dataStatus) ||
    !isNonEmptyString(value.generatedAt) ||
    !Array.isArray(value.users) ||
    !Array.isArray(value.trajectory) ||
    !Array.isArray(value.screensHealth) ||
    !Array.isArray(value.supportQueue) ||
    !isRecord(value.companyState)
  ) {
    throw new Error("invalid_experience_state_response");
  }
  return value as import("@/services/eve/official-control-panel/official-control-panel-experience.types").ExperienceStateResponse;
}

function parseMonitoringUsersResponse(
  value: unknown,
): import("@/services/eve/official-control-panel/official-control-panel-monitoring.types").MonitoringUsersResponse {
  if (!isRecord(value) || !Array.isArray(value.users)) {
    throw new Error("invalid_monitoring_users_response");
  }
  const users: import("@/services/eve/official-control-panel/official-control-panel-monitoring.types").MonitoringUserRow[] =
    value.users.flatMap((item) => {
    if (
      !isRecord(item) ||
      !isNonEmptyString(item.participantId) ||
      !isNonEmptyString(item.userId) ||
      !isNonEmptyString(item.label)
    ) {
      return [];
    }
    const profileResolutionStatus =
      item.profileResolutionStatus === "resolved" ||
      item.profileResolutionStatus === "partial" ||
      item.profileResolutionStatus === "unresolved" ||
      item.profileResolutionStatus === "unavailable"
        ? item.profileResolutionStatus
        : ("unavailable" as const);
    return [
      {
        participantId: item.participantId,
        userId: item.userId,
        label: item.label,
        engagementLabel:
          typeof item.engagementLabel === "string"
            ? item.engagementLabel
            : "No disponible",
        rolesCount:
          typeof item.rolesCount === "number" ? item.rolesCount : 0,
        rolesCountLabel:
          typeof item.rolesCountLabel === "string"
            ? item.rolesCountLabel
            : "0",
        activitiesLabel:
          typeof item.activitiesLabel === "string"
            ? item.activitiesLabel
            : "No disponible",
        journeyStageLabel:
          typeof item.journeyStageLabel === "string"
            ? item.journeyStageLabel
            : "No disponible",
        readinessLabel:
          typeof item.readinessLabel === "string"
            ? item.readinessLabel
            : "No disponible",
        attentionLabel:
          typeof item.attentionLabel === "string"
            ? item.attentionLabel
            : "No disponible",
        participationStatusLabel:
          typeof item.participationStatusLabel === "string"
            ? item.participationStatusLabel
            : null,
        profileResolutionStatus,
      },
    ];
  });
  return {
    users,
    caseRoleSessionCount:
      typeof value.caseRoleSessionCount === "number"
        ? value.caseRoleSessionCount
        : null,
    caseActivityRunCount:
      typeof value.caseActivityRunCount === "number"
        ? value.caseActivityRunCount
        : null,
  };
}

function parseParallelProductionTrackingResponse(
  value: unknown,
): import("@/services/eve/official-control-panel/official-control-panel-parallel-production.types").ParallelProductionTrackingResponse {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.caseId) ||
    !isNonEmptyString(value.companyId) ||
    !Array.isArray(value.alerts) ||
    !isNonEmptyString(value.generatedAt) ||
    !isNonEmptyString(value.dataStatus)
  ) {
    throw new Error("invalid_parallel_production_response");
  }
  return value as import("@/services/eve/official-control-panel/official-control-panel-parallel-production.types").ParallelProductionTrackingResponse;
}

function parseManualWorkTrackingResponse(
  value: unknown,
): import("@/services/eve/official-control-panel/official-control-panel-manual-work.types").ManualWorkTrackingResponse {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.caseId) ||
    !isNonEmptyString(value.companyId) ||
    !Array.isArray(value.processes) ||
    !Array.isArray(value.overdueAlerts) ||
    !isNonEmptyString(value.generatedAt)
  ) {
    throw new Error("invalid_manual_work_response");
  }
  return value as import("@/services/eve/official-control-panel/official-control-panel-manual-work.types").ManualWorkTrackingResponse;
}

export async function getCaseCoreMilestones(
  accessToken: string,
  caseId: string,
  signal?: AbortSignal,
): Promise<CoreMilestoneAxisResponse> {
  const value = await getContextJson(
    `${CONTEXT_API_ROOT}/cases/${encodeURIComponent(caseId)}/core-milestones`,
    accessToken,
    signal,
  );
  return parseCoreMilestoneAxisResponse(value);
}

function parseCoreMilestoneAxisResponse(
  value: unknown,
): CoreMilestoneAxisResponse {
  if (!isRecord(value) || !Array.isArray(value.items) || !isRecord(value.progress)) {
    throw new Error("invalid_core_milestone_response");
  }

  const progressStatus = value.progress.status;
  if (
    progressStatus !== "available" &&
    progressStatus !== "partial" &&
    progressStatus !== "unavailable"
  ) {
    throw new Error("invalid_core_milestone_response");
  }

  const items = value.items.flatMap((item): CoreMilestoneAxisItem[] => {
    if (
      !isRecord(item) ||
      !isNonEmptyString(item.code) ||
      !isCoreMilestoneCode(item.code) ||
      !isNonEmptyString(item.label) ||
      typeof item.sequence !== "number" ||
      !isNonEmptyString(item.objectStateLabel) ||
      !isNonEmptyString(item.uiStateLabel) ||
      (item.dataStatus !== "available" && item.dataStatus !== "unavailable")
    ) {
      return [];
    }

    const uiState =
      item.uiState === "reached" ||
      item.uiState === "current_wait" ||
      item.uiState === "manual_pending" ||
      item.uiState === "blocked" ||
      item.uiState === "not_reached"
        ? item.uiState
        : null;

    return [
      {
        code: item.code,
        label: item.label,
        sequence: item.sequence,
        objectStateLabel: item.objectStateLabel,
        expectedNextEventLabel:
          typeof item.expectedNextEventLabel === "string"
            ? item.expectedNextEventLabel
            : null,
        timerPolicyName:
          typeof item.timerPolicyName === "string"
            ? item.timerPolicyName
            : null,
        responsibleProcessCode:
          typeof item.responsibleProcessCode === "string"
            ? item.responsibleProcessCode
            : null,
        responsibleProcessManual: Boolean(item.responsibleProcessManual),
        modalityLabel:
          typeof item.modalityLabel === "string" ? item.modalityLabel : null,
        reached: typeof item.reached === "boolean" ? item.reached : null,
        uiState,
        uiStateLabel: item.uiStateLabel,
        dataStatus: item.dataStatus,
      },
    ];
  });

  const finalAlternative =
    value.finalAlternative === "ClosedWithoutSufficiency" ||
    value.finalAlternative === "Cancelled"
      ? value.finalAlternative
      : null;
  const finalAlternativeReason =
    typeof value.finalAlternativeReason === "string" &&
    value.finalAlternativeReason.trim()
      ? value.finalAlternativeReason.trim()
      : null;

  return {
    items,
    progress: {
      achieved: numberOrZero(value.progress.achieved),
      total: numberOrZero(value.progress.total),
      status: progressStatus,
    },
    finalAlternative,
    finalAlternativeReason,
    operationalDataBlocked: Boolean(value.operationalDataBlocked),
  };
}

function numberOrZero(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function parseSupportProcessAxisResponse(
  value: unknown,
): SupportProcessAxisResponse {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    throw new Error("invalid_support_process_response");
  }

  const items = value.items.flatMap((item): SupportProcessAxisItem[] => {
    if (
      !isRecord(item) ||
      !isNonEmptyString(item.code) ||
      !isSupportProcessAxisCode(item.code) ||
      !isNonEmptyString(item.label) ||
      typeof item.sequence !== "number" ||
      !isNonEmptyString(item.modalityLabel) ||
      (item.executionMode !== null &&
        item.executionMode !== "platform" &&
        item.executionMode !== "manual") ||
      (item.dataStatus !== "available" &&
        item.dataStatus !== "partial" &&
        item.dataStatus !== "unavailable")
    ) {
      return [];
    }

    return [
      {
        code: item.code,
        label: item.label,
        sequence: item.sequence,
        executionMode: item.executionMode,
        modalityLabel: item.modalityLabel,
        targetObjectLabel:
          typeof item.targetObjectLabel === "string"
            ? item.targetObjectLabel
            : null,
        targetStateLabel:
          typeof item.targetStateLabel === "string"
            ? item.targetStateLabel
            : null,
        triggerLabel:
          typeof item.triggerLabel === "string" ? item.triggerLabel : null,
        nextEventLabel:
          typeof item.nextEventLabel === "string" ? item.nextEventLabel : null,
        dependencyLabel:
          typeof item.dependencyLabel === "string"
            ? item.dependencyLabel
            : null,
        operationalStatusLabel:
          typeof item.operationalStatusLabel === "string"
            ? item.operationalStatusLabel
            : null,
        attentionCount:
          typeof item.attentionCount === "number" &&
          Number.isFinite(item.attentionCount)
            ? item.attentionCount
            : null,
        dataStatus: item.dataStatus,
      },
    ];
  });

  if (items.length === 0) {
    throw new Error("invalid_support_process_response");
  }

  return {
    items,
    operationalDataBlocked: value.operationalDataBlocked === true,
  };
}

function parseParticipantsResponse(value: unknown): CaseParticipantSummary[] {
  if (!isRecord(value) || !Array.isArray(value.participants)) {
    throw new Error("invalid_participants_response");
  }
  return value.participants.flatMap((item) => {
    if (
      !isRecord(item) ||
      !isNonEmptyString(item.id) ||
      !isNonEmptyString(item.label) ||
      typeof item.profileCount !== "number" ||
      !isAggregatedProfileResolution(item.profileResolutionStatus)
    ) {
      return [];
    }
    return [
      {
        id: item.id,
        label: item.label,
        userId: optionalString(item.userId),
        authUserId: optionalString(item.authUserId),
        email: optionalString(item.email),
        declaredPosition: optionalString(item.declaredPosition),
        profileCount: item.profileCount,
        participationStatusLabel:
          typeof item.participationStatusLabel === "string"
            ? item.participationStatusLabel
            : null,
        profileResolutionStatus: item.profileResolutionStatus,
      },
    ];
  });
}

function parseWorkMapProgress(value: unknown): WorkMapProgressView {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.caseId) ||
    !isRecord(value.company) ||
    !isRecord(value.diagnosticCase) ||
    !isRecord(value.user) ||
    !isRecord(value.role) ||
    !isRecord(value.workmap) ||
    !isRecord(value.coverage) ||
    !Array.isArray(value.activities) ||
    !Array.isArray(value.gaps) ||
    !isRecord(value.lastScreen) ||
    !isNonEmptyString(value.generatedAt)
  ) {
    throw new Error("invalid_workmap_progress_response");
  }

  const status =
    value.workmap.status === "ready" ||
    value.workmap.status === "partial" ||
    value.workmap.status === "stale"
      ? value.workmap.status
      : "partial";
  const source =
    value.workmap.source === "case_participant_workmap_snapshots" ||
    value.workmap.source === "activity_selection_workmap_snapshot" ||
    value.workmap.source === "absent"
      ? value.workmap.source
      : "absent";

  return {
    caseId: value.caseId,
    company: {
      id: optionalString(value.company.id),
      label: optionalString(value.company.label),
    },
    diagnosticCase: {
      id: isNonEmptyString(value.diagnosticCase.id)
        ? value.diagnosticCase.id
        : value.caseId,
      label: optionalString(value.diagnosticCase.label),
      statusLabel: optionalString(value.diagnosticCase.statusLabel),
    },
    engagement: isRecord(value.engagement)
      ? {
          id: optionalString(value.engagement.id),
          label: optionalString(value.engagement.label),
          status: optionalString(value.engagement.status),
        }
      : undefined,
    user: {
      id: optionalString(value.user.id),
      label: optionalString(value.user.label),
      matchedGaby: value.user.matchedGaby === true,
    },
    role: {
      id: optionalString(value.role.id),
      label: optionalString(value.role.label),
    },
    participant: isRecord(value.participant)
      ? {
          id: optionalString(value.participant.id),
          userId: optionalString(value.participant.userId),
          authUserId: optionalString(value.participant.authUserId),
          label: optionalString(value.participant.label),
          status: optionalString(value.participant.status),
          declaredPosition: optionalString(value.participant.declaredPosition),
        }
      : undefined,
    functionalProfile: isRecord(value.functionalProfile)
      ? {
          id: optionalString(value.functionalProfile.id),
          label: optionalString(value.functionalProfile.label),
          status:
            value.functionalProfile.status === "materialized"
              ? "materialized"
              : "pending_materialization",
        }
      : undefined,
    profileTrace: isRecord(value.profileTrace)
      ? {
          profileStatus:
            value.profileTrace.profileStatus === "confirmed" ||
            value.profileTrace.profileStatus === "blocked" ||
            value.profileTrace.profileStatus === "awaiting_confirmation"
              ? value.profileTrace.profileStatus
              : "candidate",
          sourceWorkmapId: optionalString(value.profileTrace.sourceWorkmapId),
          workmapVersion:
            typeof value.profileTrace.workmapVersion === "string" ||
            typeof value.profileTrace.workmapVersion === "number"
              ? value.profileTrace.workmapVersion
              : null,
          responsibilitiesCount: optionalNumber(
            value.profileTrace.responsibilitiesCount,
          ),
          activitiesCount: optionalNumber(value.profileTrace.activitiesCount),
          confirmationStatus: optionalString(
            value.profileTrace.confirmationStatus,
          ),
        }
      : undefined,
    selection: isRecord(value.selection)
      ? {
          stage: isActivitySelectionStage(value.selection.stage)
            ? value.selection.stage
            : "not_started",
          stageLabel:
            typeof value.selection.stageLabel === "string"
              ? value.selection.stageLabel
              : "No iniciada",
          policyVersion: optionalString(value.selection.policyVersion),
          selectionMode: optionalString(value.selection.selectionMode),
          maxPrimaryAllowed: optionalNumber(value.selection.maxPrimaryAllowed),
          eligibleCount: optionalNumber(value.selection.eligibleCount),
          selectedPrimaryCount: optionalNumber(
            value.selection.selectedPrimaryCount,
          ),
          nonPrimaryContextCount: optionalNumber(
            value.selection.nonPrimaryContextCount,
          ),
          traceCompletenessStatus: optionalString(
            value.selection.traceCompletenessStatus,
          ),
          replayStatus: optionalString(value.selection.replayStatus),
          producerStatus:
            value.selection.producerStatus === "available" ||
            value.selection.producerStatus === "missing_remote_tables"
              ? value.selection.producerStatus
              : "pending",
          blockingReason: optionalString(value.selection.blockingReason),
          nextProducerRequired: optionalString(
            value.selection.nextProducerRequired,
          ),
        }
      : undefined,
    functionalSession: isRecord(value.functionalSession)
      ? {
          id: optionalString(value.functionalSession.id),
          status:
            value.functionalSession.status === "active"
              ? "active"
              : "not_started",
        }
      : undefined,
    runtime: isRecord(value.runtime)
      ? {
          runId: optionalString(value.runtime.runId),
          status:
            value.runtime.status === "active" ||
            value.runtime.status === "prepared"
              ? value.runtime.status
              : "not_started",
          reason: optionalString(value.runtime.reason),
          preparedRunCount:
            optionalNumber(value.runtime.preparedRunCount) ?? undefined,
          startedRunCount:
            optionalNumber(value.runtime.startedRunCount) ?? undefined,
        }
      : undefined,
    workmap: {
      status,
      stateLabel:
        typeof value.workmap.stateLabel === "string"
          ? value.workmap.stateLabel
          : status,
      source,
      snapshotId: optionalString(value.workmap.snapshotId),
      version:
        typeof value.workmap.version === "string" ||
        typeof value.workmap.version === "number"
          ? value.workmap.version
          : null,
      hash: optionalString(value.workmap.hash),
      lastUpdatedAt: optionalString(value.workmap.lastUpdatedAt),
      responsibilitiesCount: optionalNumber(value.workmap.responsibilitiesCount),
      activitiesCount: optionalNumber(value.workmap.activitiesCount),
      created: value.workmap.created === true,
      saved: value.workmap.saved === true,
      submitted: value.workmap.submitted === true,
      accepted: value.workmap.accepted === true,
    },
    coverage: {
      eligibleCount: optionalNumber(value.coverage.eligibleCount),
      selectedCount: optionalNumber(value.coverage.selectedCount),
      nonPrimaryContextCount: optionalNumber(
        value.coverage.nonPrimaryContextCount,
      ),
      workmapCoverageGap:
        typeof value.coverage.workmapCoverageGap === "boolean"
          ? value.coverage.workmapCoverageGap
          : null,
      coverageLabel:
        typeof value.coverage.coverageLabel === "string"
          ? value.coverage.coverageLabel
          : "Cobertura parcial",
    },
    activities: value.activities.flatMap((raw) => {
      if (!isRecord(raw) || !isNonEmptyString(raw.id)) return [];
      const classification =
        raw.classification === "primary" ||
        raw.classification === "non-primary" ||
        raw.classification === "pending" ||
        raw.classification === "unavailable"
          ? raw.classification
          : "unavailable";
      return [
        {
          id: raw.id,
          label: typeof raw.label === "string" ? raw.label : raw.id,
          classification,
          selectedSlot: optionalNumber(raw.selectedSlot),
          sourceReference: optionalString(raw.sourceReference),
          selectionResultId: optionalString(raw.selectionResultId),
          selectionResultItemId: optionalString(raw.selectionResultItemId),
          state: isWorkMapActivityState(raw.state)
            ? raw.state
            : "awaiting_effective_selection",
          sourceWorkmapRecordId: optionalString(raw.sourceWorkmapRecordId),
          eligible:
            typeof raw.eligible === "boolean" ? raw.eligible : null,
          selectedPrimary: raw.selectedPrimary === true,
          selectedNonPrimary: raw.selectedNonPrimary === true,
          effectiveSelection: raw.effectiveSelection === true,
          functionalProfileId: optionalString(raw.functionalProfileId),
          roleRuntimeSessionId: optionalString(raw.roleRuntimeSessionId),
          runtimeRunId: optionalString(raw.runtimeRunId),
          runtimeRunState: optionalString(raw.runtimeRunState),
          runtimeRunReadinessState: optionalString(raw.runtimeRunReadinessState),
        },
      ];
    }),
    activitiesPage: isRecord(value.activitiesPage)
      ? {
          page: optionalNumber(value.activitiesPage.page) ?? 1,
          pageSize: optionalNumber(value.activitiesPage.pageSize) ?? 10,
          total: optionalNumber(value.activitiesPage.total) ?? value.activities.length,
          rendered:
            optionalNumber(value.activitiesPage.rendered) ??
            value.activities.length,
          search: optionalString(value.activitiesPage.search),
          status: optionalString(value.activitiesPage.status),
          selectionStatus: optionalString(value.activitiesPage.selectionStatus),
        }
      : undefined,
    gaps: value.gaps.flatMap((gap) =>
      typeof gap === "string" && gap.trim() ? [gap] : [],
    ),
    findings: Array.isArray(value.findings)
      ? value.findings.flatMap((raw) => {
          if (!isRecord(raw) || !isNonEmptyString(raw.findingId)) return [];
          return [
            {
              findingId: raw.findingId,
              code: optionalString(raw.code) ?? "unknown",
              severity:
                raw.severity === "critical" ||
                raw.severity === "warning" ||
                raw.severity === "info"
                  ? raw.severity
                  : "info",
              scope:
                raw.scope === "case" ||
                raw.scope === "participant" ||
                raw.scope === "workmap" ||
                raw.scope === "experience" ||
                raw.scope === "runtime"
                  ? raw.scope
                  : "case",
              source: optionalString(raw.source) ?? "unknown",
              detectedAt:
                optionalString(raw.detectedAt) ??
                (typeof value.generatedAt === "string"
                  ? value.generatedAt
                  : new Date(0).toISOString()),
              status: raw.status === "resolved" ? "resolved" : "active",
              recommendedNextAction:
                optionalString(raw.recommendedNextAction) ?? "",
              title: optionalString(raw.title) ?? "Finding",
              detail: optionalString(raw.detail) ?? "",
            },
          ];
        })
      : undefined,
    lastScreen: {
      screenKey: optionalString(value.lastScreen.screenKey),
      status: optionalString(value.lastScreen.status),
      occurredAt: optionalString(value.lastScreen.occurredAt),
    },
    lastInteractionAt: optionalString(value.lastInteractionAt),
    nextStep: optionalString(value.nextStep),
    lastUpdatedAt: optionalString(value.lastUpdatedAt),
    generatedAt: value.generatedAt,
    meta: isRecord(value.meta)
      ? {
          scopeResolved: value.meta.scopeResolved === true,
          projectionStatus:
            value.meta.projectionStatus === "ready" ||
            value.meta.projectionStatus === "stale" ||
            value.meta.projectionStatus === "forbidden" ||
            value.meta.projectionStatus === "not_found" ||
            value.meta.projectionStatus === "fatal"
              ? value.meta.projectionStatus
              : "partial",
          missingSources: Array.isArray(value.meta.missingSources)
            ? value.meta.missingSources.flatMap((item) =>
                typeof item === "string" ? [item] : [],
              )
            : [],
          generatedAt: optionalString(value.meta.generatedAt) ?? value.generatedAt,
          sourceMaxUpdatedAt: optionalString(value.meta.sourceMaxUpdatedAt),
          staleThresholdMs: optionalNumber(value.meta.staleThresholdMs) ?? 0,
          refreshStartedAt: optionalString(value.meta.refreshStartedAt),
          refreshCompletedAt: optionalString(value.meta.refreshCompletedAt),
        }
      : undefined,
  };
}

function parseCaseUserIndicatorMatrix(value: unknown): CaseUserIndicatorMatrix {
  if (
    !isRecord(value) ||
    !Array.isArray(value.users) ||
    !isRecord(value.workMapsSaved) ||
    !isRecord(value.primarySelections) ||
    !isRecord(value.runtimesStarted) ||
    !isRecord(value.participantsWithAttention) ||
    !isNonEmptyString(value.generatedAt)
  ) {
    throw new Error("invalid_user_indicator_matrix_response");
  }

  const users: CaseUserIndicatorMatrix["users"] = value.users.flatMap((raw) => {
    if (
      !isRecord(raw) ||
      !isNonEmptyString(raw.participantId) ||
      !isNonEmptyString(raw.displayName)
    ) {
      return [];
    }
    return [
      {
        participantId: raw.participantId,
        displayName: raw.displayName,
        declaredPosition: optionalString(raw.declaredPosition),
        declaredArea: optionalString(raw.declaredArea),
        functionalProfileId: optionalString(raw.functionalProfileId),
        functionalProfileLabel: optionalString(raw.functionalProfileLabel),
        functionalProfileStatus: (
          raw.functionalProfileStatus === "materialized"
            ? "materialized"
            : "pending_materialization"
        ) as CaseUserIndicatorMatrix["users"][number]["functionalProfileStatus"],
        confirmationStatus: optionalString(raw.confirmationStatus),
        sourceWorkmapId: optionalString(raw.sourceWorkmapId),
        sourceWorkmapVersionId:
          optionalString(raw.sourceWorkmapVersionId) ??
          optionalNumber(raw.sourceWorkmapVersionId),
        responsibilityCount: optionalNumber(raw.responsibilityCount),
        activityCount: optionalNumber(raw.activityCount),
        eligibleActivityCount: optionalNumber(raw.eligibleActivityCount),
        selectedPrimaryCount: optionalNumber(raw.selectedPrimaryCount),
        nonPrimaryContextCount: optionalNumber(raw.nonPrimaryContextCount),
        selectionPolicyVersion: optionalString(raw.selectionPolicyVersion),
        selectionEffectiveFrom: optionalString(raw.selectionEffectiveFrom),
        preparedRuntimeSessionCount:
          optionalNumber(raw.preparedRuntimeSessionCount) ?? 0,
        preparedRuntimeRunCount:
          optionalNumber(raw.preparedRuntimeRunCount) ?? 0,
        startedRuntimeRunCount:
          optionalNumber(raw.startedRuntimeRunCount) ?? 0,
        currentRuntimeActivityOrdinal: optionalNumber(
          raw.currentRuntimeActivityOrdinal,
        ),
        currentRuntimeActivityTotal: optionalNumber(
          raw.currentRuntimeActivityTotal,
        ),
        currentRuntimeRunState: optionalString(raw.currentRuntimeRunState),
        currentRuntimeBlockLabel: optionalString(raw.currentRuntimeBlockLabel),
        b0InteractionCount: optionalNumber(raw.b0InteractionCount),
        b0ConfirmedInteractionCount: optionalNumber(
          raw.b0ConfirmedInteractionCount,
        ),
        b0ResponseCount: optionalNumber(raw.b0ResponseCount),
        b0SubfieldCount: optionalNumber(raw.b0SubfieldCount),
        b0EvidenceCount: optionalNumber(raw.b0EvidenceCount),
        b0CanonicalVariableCount: optionalNumber(raw.b0CanonicalVariableCount),
        selectionStage: (
          raw.selectionStage === "effective" ||
          raw.selectionStage === "eligibility_pending" ||
          raw.selectionStage === "not_started"
            ? raw.selectionStage
            : "not_started"
        ) as CaseUserIndicatorMatrix["users"][number]["selectionStage"],
        selectionStageLabel:
          optionalString(raw.selectionStageLabel) ?? "No iniciado",
        attentionLabel: optionalString(raw.attentionLabel) ?? "Sin atención abierta",
        functionalSessionStatus: (
          raw.functionalSessionStatus === "active" ? "active" : "not_started"
        ) as CaseUserIndicatorMatrix["users"][number]["functionalSessionStatus"],
        functionalSessionLabel:
          optionalString(raw.functionalSessionLabel) ?? "Aún no iniciada",
        lastScreenLabel:
          optionalString(raw.lastScreenLabel) ??
          "Instrumentación de pantalla pendiente",
      },
    ];
  });

  return {
    users,
    totalParticipants: optionalNumber(value.totalParticipants) ?? users.length,
    workMapsSaved: parseBooleanMetric(value.workMapsSaved, users),
    primarySelections: parsePrimarySelectionMetric(
      value.primarySelections,
      users,
    ),
    runtimesStarted: parseBooleanMetric(value.runtimesStarted, users),
    runtimesPrepared: isRecord(value.runtimesPrepared)
      ? parsePreparedRuntimeMetric(value.runtimesPrepared, users)
      : {
          totalSessions: 0,
          totalRuns: 0,
          sessionsByParticipant: Object.fromEntries(
            users.map((user) => [user.participantId, null]),
          ),
          runsByParticipant: Object.fromEntries(
            users.map((user) => [user.participantId, null]),
          ),
        },
    participantsWithAttention: parseBooleanMetric(
      value.participantsWithAttention,
      users,
    ),
    generatedAt: value.generatedAt,
    sourceMaxUpdatedAt: optionalString(value.sourceMaxUpdatedAt),
  };
}

function parsePrimarySelectionMetric(
  value: Record<string, unknown>,
  users: CaseUserIndicatorMatrix["users"],
) {
  const base = parseNumberMetric(value, users);
  return {
    ...base,
    eligibleByParticipant: parseNumberByParticipant(
      value.eligibleByParticipant,
      users,
    ),
    nonPrimaryByParticipant: parseNumberByParticipant(
      value.nonPrimaryByParticipant,
      users,
    ),
  };
}

function parsePreparedRuntimeMetric(
  value: Record<string, unknown>,
  users: CaseUserIndicatorMatrix["users"],
) {
  return {
    totalSessions: optionalNumber(value.totalSessions) ?? 0,
    totalRuns: optionalNumber(value.totalRuns) ?? 0,
    sessionsByParticipant: parseNumberByParticipant(
      value.sessionsByParticipant,
      users,
    ),
    runsByParticipant: parseNumberByParticipant(value.runsByParticipant, users),
  };
}

function parseNumberByParticipant(
  rawValue: unknown,
  users: CaseUserIndicatorMatrix["users"],
) {
  const rawByParticipant = isRecord(rawValue) ? rawValue : {};
  return Object.fromEntries(
    users.map((user) => [
      user.participantId,
      optionalNumber(rawByParticipant[user.participantId]),
    ]),
  );
}

function parseBooleanMetric(
  value: Record<string, unknown>,
  users: CaseUserIndicatorMatrix["users"],
) {
  const rawByParticipant = isRecord(value.byParticipant)
    ? value.byParticipant
    : {};
  return {
    total: optionalNumber(value.total) ?? 0,
    byParticipant: Object.fromEntries(
      users.map((user) => {
        const raw = rawByParticipant[user.participantId];
        return [
          user.participantId,
          typeof raw === "boolean" ? raw : raw === null ? null : null,
        ];
      }),
    ),
  };
}

function parseNumberMetric(
  value: Record<string, unknown>,
  users: CaseUserIndicatorMatrix["users"],
) {
  const rawByParticipant = isRecord(value.byParticipant)
    ? value.byParticipant
    : {};
  return {
    total: optionalNumber(value.total),
    byParticipant: Object.fromEntries(
      users.map((user) => [
        user.participantId,
        optionalNumber(rawByParticipant[user.participantId]),
      ]),
    ),
  };
}

function parseProfilesResponse(value: unknown): FunctionalProfileSummary[] {
  if (!isRecord(value) || !Array.isArray(value.profiles)) {
    throw new Error("invalid_profiles_response");
  }
  return value.profiles.flatMap((item) => {
    if (
      !isRecord(item) ||
      !isNonEmptyString(item.id) ||
      !isNonEmptyString(item.label) ||
      !isProfileResolutionUi(item.resolutionStatus)
    ) {
      return [];
    }
    return [
      {
        id: item.id,
        label: item.label,
        resolutionStatus: item.resolutionStatus,
      },
    ];
  });
}

function isAggregatedProfileResolution(
  value: unknown,
): value is AggregatedProfileResolutionStatus {
  return (
    value === "resolved" ||
    value === "partial" ||
    value === "unresolved" ||
    value === "unavailable"
  );
}

function isProfileResolutionUi(
  value: unknown,
): value is ProfileResolutionStatusUi {
  return (
    value === "resolved" ||
    value === "mixed-unresolved" ||
    value === "reentry-required" ||
    value === "manual-review-required" ||
    value === "unavailable"
  );
}

function parseProcessStructureResponse(
  value: unknown,
): CaseProcessStructureResponse {
  if (!isRecord(value) || !Array.isArray(value.milestones)) {
    throw new Error("invalid_process_structure_response");
  }

  const milestones = value.milestones.flatMap((item) => {
    if (
      !isRecord(item) ||
      !isNonEmptyString(item.id) ||
      !isNonEmptyString(item.label) ||
      !isProcessStatus(item.status)
    ) {
      return [];
    }
    return [
      {
        id: item.id,
        label: item.label,
        sequence:
          typeof item.sequence === "number" && Number.isFinite(item.sequence)
            ? item.sequence
            : null,
        status: item.status,
        statusLabel:
          typeof item.statusLabel === "string" ? item.statusLabel : null,
        expectedEventLabel:
          typeof item.expectedEventLabel === "string"
            ? item.expectedEventLabel
            : null,
        timerLabel:
          typeof item.timerLabel === "string" ? item.timerLabel : null,
        supportProcessLabel:
          typeof item.supportProcessLabel === "string"
            ? item.supportProcessLabel
            : null,
      },
    ];
  });

  const coreMilestoneProgress = parseCoreMilestoneProgress(
    value.coreMilestoneProgress,
  );

  if (value.mainProcess == null) {
    return { mainProcess: null, milestones, coreMilestoneProgress };
  }

  if (
    !isRecord(value.mainProcess) ||
    !isNonEmptyString(value.mainProcess.id) ||
    !isNonEmptyString(value.mainProcess.label) ||
    !isProcessStatus(value.mainProcess.status)
  ) {
    throw new Error("invalid_process_structure_response");
  }

  return {
    mainProcess: {
      id: value.mainProcess.id,
      label: value.mainProcess.label,
      status: value.mainProcess.status,
      statusLabel:
        typeof value.mainProcess.statusLabel === "string"
          ? value.mainProcess.statusLabel
          : null,
      currentMilestoneId:
        typeof value.mainProcess.currentMilestoneId === "string"
          ? value.mainProcess.currentMilestoneId
          : null,
      nextEventLabel:
        typeof value.mainProcess.nextEventLabel === "string"
          ? value.mainProcess.nextEventLabel
          : null,
      timerLabel:
        typeof value.mainProcess.timerLabel === "string"
          ? value.mainProcess.timerLabel
          : null,
    },
    milestones,
    coreMilestoneProgress,
  };
}

function parseCoreMilestoneProgress(value: unknown): {
  achieved: number;
  total: number;
  status: "available" | "partial" | "unavailable";
} {
  if (
    isRecord(value) &&
    typeof value.achieved === "number" &&
    typeof value.total === "number" &&
    (value.status === "available" ||
      value.status === "partial" ||
      value.status === "unavailable")
  ) {
    return {
      achieved: value.achieved,
      total: value.total,
      status: value.status,
    };
  }
  // Fail closed: absence of aggregate = unavailable (no invented 0 de 7).
  return { achieved: 0, total: 0, status: "unavailable" };
}

function isProcessStatus(value: unknown): value is CaseProcessStatus {
  return (
    value === "not_started" ||
    value === "available" ||
    value === "current" ||
    value === "waiting" ||
    value === "completed" ||
    value === "blocked" ||
    value === "unknown"
  );
}

async function getContextJson(
  path: string,
  accessToken: string,
  signal?: AbortSignal,
): Promise<unknown> {
  const token = accessToken.trim();
  if (!token) throw new ContextAuthError(401);

  let response: Response;
  try {
    response = await fetch(path, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal,
    });
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw new ContextNetworkError();
  }

  if (response.status === 401 || response.status === 403) {
    const body = (await response.json().catch(() => null)) as {
      requestId?: unknown;
    } | null;
    const requestId =
      typeof body?.requestId === "string" ? body.requestId : null;
    throw new ContextAuthError(
      response.status === 401 ? 401 : 403,
      requestId,
    );
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      requestId?: unknown;
      message?: unknown;
      error?: unknown;
      code?: unknown;
    } | null;
    throw new ContextRequestError({
      status: response.status,
      message:
        typeof body?.message === "string"
          ? body.message
          : "No fue posible cargar esta sección.",
      requestId:
        typeof body?.requestId === "string" ? body.requestId : null,
      code:
        typeof body?.error === "string"
          ? body.error
          : typeof body?.code === "string"
            ? body.code
            : null,
    });
  }
  return response.json();
}

function parseLabelOptions(
  value: unknown,
): Array<{ id: string; label: string }> {
  if (!Array.isArray(value)) throw new Error("invalid_context_response");
  return value.flatMap((item) =>
    isRecord(item) &&
    isNonEmptyString(item.id) &&
    isNonEmptyString(item.label)
      ? [{ id: item.id, label: item.label }]
      : [],
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function optionalNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isActivitySelectionStage(
  value: unknown,
): value is ActivitySelectionStage {
  return (
    value === "not_started" ||
    value === "awaiting_profile_confirmation" ||
    value === "eligibility_pending" ||
    value === "eligibility_computed" ||
    value === "awaiting_primary_selection" ||
    value === "selection_saved" ||
    value === "selection_rejected" ||
    value === "effective" ||
    value === "blocked"
  );
}

function isWorkMapActivityState(value: unknown): value is WorkMapActivityState {
  return (
    value === "captured" ||
    value === "eligible" ||
    value === "selected_primary" ||
    value === "selected_non_primary" ||
    value === "not_selected" ||
    value === "awaiting_effective_selection" ||
    value === "runtime_prepared" ||
    value === "runtime_not_started"
  );
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export async function attemptParallelProductionExport(input: {
  caseId: string;
  accessToken: string;
  packageId: string;
}): Promise<{ allowed: boolean; code: string | null }> {
  const response = await fetch(
    `/api/eve/official-consultant-control-panel/cases/${encodeURIComponent(input.caseId)}/parallel-production`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "attempt_export",
        packageId: input.packageId,
      }),
    },
  );
  const body = (await response.json().catch(() => null)) as
    | { actionResult?: { allowed?: boolean; code?: string } }
    | null;
  return {
    allowed: body?.actionResult?.allowed === true,
    code:
      typeof body?.actionResult?.code === "string"
        ? body.actionResult.code
        : null,
  };
}

export async function applyParallelProductionAssessmentAction(input: {
  caseId: string;
  accessToken: string;
  packageId: string;
  assessmentAction:
    | "start_conformance"
    | "complete_conformance"
    | "start_consistency"
    | "complete_consistency";
  expectedPackageVersion: number;
  expectedAssessmentVersion?: number | null;
  idempotencyKey: string;
}): Promise<{ allowed: boolean; code: string | null }> {
  const response = await fetch(
    `/api/eve/official-consultant-control-panel/cases/${encodeURIComponent(input.caseId)}/parallel-production`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "assessment_transition",
        packageId: input.packageId,
        assessmentAction: input.assessmentAction,
        expectedPackageVersion: input.expectedPackageVersion,
        expectedAssessmentVersion: input.expectedAssessmentVersion ?? null,
        idempotencyKey: input.idempotencyKey,
      }),
    },
  );
  const body = (await response.json().catch(() => null)) as
    | { actionResult?: { allowed?: boolean; code?: string } }
    | null;
  if (!response.ok) {
    return {
      allowed: false,
      code:
        typeof body?.actionResult?.code === "string"
          ? body.actionResult.code
          : `http_${response.status}`,
    };
  }
  return {
    allowed: body?.actionResult?.allowed === true,
    code:
      typeof body?.actionResult?.code === "string"
        ? body.actionResult.code
        : null,
  };
}
