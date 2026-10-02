/**
 * R1 — Wire → canonical envelope adapter for experience-state (and similar) responses.
 * Keeps HTTP body domain-shaped; consumers normalize at the service/client boundary.
 */

import {
  buildCapabilityMatrix,
} from "./official-control-panel-capability-catalog.ts";
import {
  buildFreshnessVM,
  buildOfficialPanelEnvelope,
  buildOfficialPanelErrorVM,
  buildUnauthorizedPanelEnvelope,
  classifyHttpError,
  mapWireToPanelDataAvailability,
  pickLatestFactualTimestamp,
  validateAndBuildEffectiveScope,
} from "./official-control-panel-contract-normalize.ts";
import type {
  OfficialPanelEnvelope,
  OfficialPanelResultEnvelope,
  PanelDataAvailability,
} from "./official-control-panel-contract.types";
import type {
  ExperienceStateResponse,
  ExperienceStateView,
} from "./official-control-panel-experience.types";

export type ExperienceStateWire = ExperienceStateResponse & {
  requestId?: string;
};

/**
 * Derive sourceObservedAt from factual event timestamps in experience payload.
 * Never uses generatedAt.
 */
export function deriveExperienceSourceObservedAt(
  experience: Pick<
    ExperienceStateView,
    "trajectory" | "supportQueue" | "screensHealth" | "users"
  >,
): string | null {
  const candidates: Array<string | null | undefined> = [];

  for (const event of experience.trajectory ?? []) {
    candidates.push(event.occurredAt);
  }
  for (const item of experience.supportQueue ?? []) {
    candidates.push(item.createdAt);
  }
  for (const screen of experience.screensHealth ?? []) {
    // No dedicated observation timestamp on health rows; skip inventing.
    void screen;
  }
  for (const user of experience.users ?? []) {
    candidates.push(user.lastActivityAt);
  }

  return pickLatestFactualTimestamp(candidates);
}

/**
 * Normalize experience-state wire into OfficialPanelEnvelope.
 * dataStatus "empty" → available (empty payload preserved in data).
 */
export function adaptExperienceStateToEnvelope(
  wire: ExperienceStateWire,
  input: {
    requestId: string;
    companyId: string;
    relationshipId: string;
    caseId: string;
    /** Composition clock — distinct from factual source observation. */
    composedAt?: string;
  },
): OfficialPanelEnvelope<ExperienceStateWire> {
  const generatedAt = input.composedAt ?? new Date().toISOString();
  const sourceObservedAt = deriveExperienceSourceObservedAt(wire);

  const scopeResult = validateAndBuildEffectiveScope({
    companyId: input.companyId,
    relationshipId: input.relationshipId,
    caseId: input.caseId,
  });
  if (!scopeResult.ok) {
    throw new Error(`invalid_effective_scope:${scopeResult.code}`);
  }

  const dataStatus = mapWireToPanelDataAvailability(wire.dataStatus);
  const wireCaps = wire.capabilities ?? [];
  const capabilities =
    wireCaps.length > 0
      ? wireCaps
      : buildCapabilityMatrix({
          allowed: ["view_company_state", "view_experience_state"],
        });

  const freshness = buildFreshnessVM({
    generatedAt,
    sourceObservedAt,
  });

  const errors =
    dataStatus === "error"
      ? [
          buildOfficialPanelErrorVM({
            code: "experience_data_error",
            requestId: input.requestId,
            retryable: true,
            source: "experience-state",
          }),
        ]
      : [];

  return buildOfficialPanelEnvelope({
    requestId: input.requestId,
    generatedAt,
    effectiveScope: scopeResult.scope,
    dataStatus,
    freshness,
    capabilities,
    data: wire,
    errors,
  });
}

/** Map secondary-source failure onto partial/unavailable without inventing records. */
export function resolveSecondarySourceImpact(input: {
  primary: PanelDataAvailability;
  secondaryFailed: boolean;
  secondaryUnevaluable: boolean;
}): PanelDataAvailability {
  if (input.primary === "error" || input.primary === "unavailable") {
    return input.primary;
  }
  if (input.secondaryFailed) return "partial";
  if (input.secondaryUnevaluable && input.primary === "available") {
    return "partial";
  }
  return input.primary;
}

export function adaptHttpFailureToEnvelope(input: {
  requestId: string;
  status: number;
  companyId?: string;
  caseId?: string;
  relationshipId?: string | null;
  message?: string;
}): OfficialPanelResultEnvelope<null> {
  const classified = classifyHttpError(input.status);
  const dataStatus: PanelDataAvailability =
    classified.screenHint === "stale"
      ? "stale"
      : classified.screenHint === "fatal"
        ? "error"
        : "unavailable";

  const generatedAt = new Date().toISOString();
  const errors = [
    buildOfficialPanelErrorVM({
      code: classified.code,
      requestId: input.requestId,
      retryable: classified.retryable,
      message: input.message,
    }),
  ];

  const scopeResult =
    input.companyId && input.caseId && input.relationshipId
      ? validateAndBuildEffectiveScope({
          companyId: input.companyId,
          caseId: input.caseId,
          relationshipId: input.relationshipId,
        })
      : { ok: false as const, code: "scope_unvalidated" };

  if (!scopeResult.ok) {
    return buildUnauthorizedPanelEnvelope({
      requestId: input.requestId,
      generatedAt,
      dataStatus,
      errors,
      capabilities: buildCapabilityMatrix({ allowed: [] }),
    });
  }

  return buildOfficialPanelEnvelope({
    requestId: input.requestId,
    generatedAt,
    effectiveScope: scopeResult.scope,
    dataStatus,
    freshness: buildFreshnessVM({ generatedAt }),
    capabilities: buildCapabilityMatrix({ allowed: [] }),
    data: null,
    errors,
  });
}
