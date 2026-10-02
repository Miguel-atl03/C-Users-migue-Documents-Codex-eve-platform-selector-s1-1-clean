import type { CaseProcessStructureResponse } from "./official-control-panel-process-structure.types";

export type CoreMilestoneProgressStatus =
  | "available"
  | "partial"
  | "unavailable";

/** Internal calculation (not all fields are returned by BFF). */
export type CoreMilestoneProgress = {
  achieved: number;
  total: number;
  status: CoreMilestoneProgressStatus;
  missingDefinitions: string[];
  missingCaseLinks: string[];
  contradictoryEvidence: boolean;
};

/** BFF-exposed aggregate only. */
export type CoreMilestoneProgressResponse = {
  achieved: number;
  total: number;
  status: CoreMilestoneProgressStatus;
};

export type CaseProcessStructureResponseWithCore = CaseProcessStructureResponse & {
  coreMilestoneProgress: CoreMilestoneProgressResponse;
};

export type CoreMilestoneDefinitionRecord = {
  id: string;
  code: string;
  label: string;
  sequence: number;
  expectedObjectName: string;
  expectedObjectState: string;
  enabled: boolean;
};

export type CaseCoreMilestoneLinkRecord = {
  id: string;
  caseId: string;
  mainProcessId: string;
  definitionId: string;
  operationalMilestoneId: string | null;
  applicabilityStatus: string;
  enabled: boolean;
};

export type CoreMilestoneAchievementRecord = {
  id: string;
  caseCoreMilestoneId: string;
  objectName: string;
  objectState: string;
  achievedAt: string;
  revokedAt: string | null;
};

/**
 * Corpus rule (§8.1): reached iff Object[State] evidence matches definition
 * and is not revoked. Never uses case_milestones.status=completed.
 */
export function isCoreMilestoneReached(
  definition: Pick<
    CoreMilestoneDefinitionRecord,
    "enabled" | "expectedObjectName" | "expectedObjectState"
  >,
  link: Pick<CaseCoreMilestoneLinkRecord, "enabled" | "applicabilityStatus"> | null,
  evidence: Pick<
    CoreMilestoneAchievementRecord,
    "objectName" | "objectState" | "revokedAt"
  > | null,
): boolean {
  if (!definition.enabled) return false;
  if (!link || !link.enabled || link.applicabilityStatus !== "applicable") {
    return false;
  }
  if (!evidence || evidence.revokedAt) return false;
  return (
    evidence.objectName === definition.expectedObjectName &&
    evidence.objectState === definition.expectedObjectState
  );
}

export function toCoreMilestoneProgressResponse(
  progress: CoreMilestoneProgress,
): CoreMilestoneProgressResponse {
  return {
    achieved: progress.achieved,
    total: progress.total,
    status: progress.status,
  };
}

export function unavailableCoreMilestoneProgress(): CoreMilestoneProgress {
  return {
    achieved: 0,
    total: 0,
    status: "unavailable",
    missingDefinitions: [],
    missingCaseLinks: [],
    contradictoryEvidence: false,
  };
}

export function presentCoreMilestoneProgressFromRpc(
  value: unknown,
): CoreMilestoneProgress {
  if (!value || typeof value !== "object") {
    return unavailableCoreMilestoneProgress();
  }
  const row = value as Record<string, unknown>;
  const status = row.status;
  const normalizedStatus: CoreMilestoneProgressStatus =
    status === "available" || status === "partial" || status === "unavailable"
      ? status
      : "unavailable";

  return {
    achieved: numberOrZero(row.achieved),
    total: numberOrZero(row.total),
    status: normalizedStatus,
    missingDefinitions: stringArray(row.missingDefinitions),
    missingCaseLinks: stringArray(row.missingCaseLinks),
    contradictoryEvidence: Boolean(row.contradictoryEvidence),
  };
}

function numberOrZero(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}
