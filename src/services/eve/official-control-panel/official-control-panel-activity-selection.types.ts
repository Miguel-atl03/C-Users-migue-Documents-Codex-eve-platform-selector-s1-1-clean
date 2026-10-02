/**
 * §11 — Resultado factual de selección de actividades (lectura panel).
 */

export type ActivitySelectionLifecycleState =
  | "computed"
  | "validated"
  | "effective"
  | "superseded"
  | "revoked";

export type ActivitySelectionModePersisted =
  | "reentry_required"
  | "non_competitive_inclusion"
  | "competitive_selection"
  | "manual_review_required";

export type ActivitySelectionClassification =
  | "primary"
  | "non_primary"
  | "pending"
  | "unavailable";

export type ActivitySelectionResultRecord = {
  id: string;
  caseId: string;
  participantId: string;
  profileId: string;
  roleRuntimeSessionId: string;
  policyCode: string;
  policyVersion: string;
  sourceSnapshotReference: string;
  sourceSnapshotHash: string;
  resultVersion: number;
  lifecycleState: ActivitySelectionLifecycleState;
  selectionMode: ActivitySelectionModePersisted;
  eligibleCount: number;
  selectedCount: number;
  nonPrimaryContextCount: number;
  workmapCoverageGap: boolean | null;
  promotionConditionCode: string | null;
  computedAt: string;
  effectiveFrom: string | null;
  policyManifestHash: string | null;
  selectorCodeVersion: string | null;
  selectionResultHash: string | null;
  traceCompletenessStatus: string | null;
  replayStatus: string | null;
};

export type ActivitySelectionResultItemRecord = {
  id: string;
  resultId: string;
  activityId: string;
  displayLabel: string;
  classification: ActivitySelectionClassification;
  selectedSlot: number | null;
  selectionReasonCode: string | null;
  sourceReference: string | null;
  promotionConditionCode: string | null;
  eligibilityStatus: string | null;
  selectionStatus: string | null;
  selectionReasonText: string | null;
  nonPrimaryContextStatus: string | null;
  runtimeHandoffPriority: number | null;
  manualReviewRequired: boolean;
  score: Record<string, unknown> | null;
  penalties: Record<string, unknown> | null;
  traceFlags: unknown[];
  ruleRefs: unknown[];
  decisionTrace: Record<string, unknown> | null;
};

export type ActivitySelectionCoverageUiMode =
  | "reentry-required"
  | "non-competitive-inclusion"
  | "competitive-selection"
  | "manual-review-required"
  | "unavailable";

export type ActivitySelectionItemView = {
  activityId: string;
  label: string;
  classification: "primary" | "non-primary" | "pending" | "unavailable";
  selectedSlot: number | null;
  selectionReasonLabel: string | null;
  promotionConditionLabel: string | null;
  eligibilityStatus: string | null;
  selectionStatus: string | null;
  selectionReasonText: string | null;
  nonPrimaryContextStatus: string | null;
  runtimeHandoffPriority: number | null;
  manualReviewRequired: boolean;
  score: Record<string, unknown> | null;
  traceFlags: unknown[];
  ruleRefs: unknown[];
};

export type ActivitySelectionCoverageView = {
  resultId: string | null;
  resultVersion: number | null;
  policyVersion: string | null;
  selectionMode: ActivitySelectionCoverageUiMode;
  selectionModeLabel: string | null;
  eligibleCount: number | null;
  selectedCount: number | null;
  nonPrimaryContextCount: number | null;
  workmapCoverageGap: boolean | null;
  workmapCoverageGapLabel: string | null;
  promotionConditionLabel: string | null;
  primaryActivities: ActivitySelectionItemView[];
  nonPrimaryActivities: ActivitySelectionItemView[];
  pendingActivities: ActivitySelectionItemView[];
  dataStatus: "available" | "partial" | "unavailable";
  message: string | null;
  conformance: {
    policyManifestHash: string | null;
    selectorCodeVersion: string | null;
    selectionResultHash: string | null;
    traceCompletenessStatus: string | null;
    replayStatus: string | null;
  };
};

export type ActivitySelectionConformanceValue =
  | string
  | number
  | boolean
  | null
  | Record<string, unknown>
  | unknown[];

export type ActivitySelectionConformanceEntry = {
  key: string;
  label: string;
  value: ActivitySelectionConformanceValue;
  status: "persisted" | "not_persisted" | "not_applicable" | "unverifiable";
};

export type ActivitySelectionConformanceGate = {
  key: string;
  label: string;
  status: string;
  detail: string | null;
};

export type ActivitySelectionConformanceView = {
  resultId: string;
  itemId: string;
  activityId: string;
  label: string;
  globalStatus:
    | "conformant"
    | "conformant_with_traceability_gaps"
    | "manual_review_required"
    | "unverifiable"
    | "mismatch";
  legacyTraceMessage: string | null;
  summary: {
    evaluatedCount: number | null;
    selectedPrimaryCount: number | null;
    nonPrimaryContextCount: number | null;
  };
  provenance: {
    caseId: string;
    caseLabel: string | null;
    profileId: string;
    profileLabel: string | null;
    activityLabel: string;
    responsibilityLabel: string | null;
    sourceReference: string | null;
    lineage: string | null;
    sourceWorkmapId: string | null;
    sourceWorkmapVersionId: string | number | null;
    profileBinding: string | null;
    workmapSnapshotHash: string | null;
  };
  identity: {
    caseId: string;
    participantId: string;
    profileId: string;
    roleRuntimeSessionId: string | null;
    sourceSnapshotReference: string | null;
    sourceSnapshotHash: string | null;
    policyVersion: string | null;
    selectorCodeVersion: string | null;
    policyManifestHash: string | null;
    selectionResultHash: string | null;
  };
  item: {
    itemId: string;
    activityId: string;
    responsibilityId: string | null;
    activityIndex: number | null;
    activityDescription: string | null;
    activityDescriptionSource: string | null;
    notes: ActivitySelectionConformanceValue;
  };
  runtime: {
    roleRuntimeSessionId: string | null;
    activityRuntimeRunId: string | null;
  };
  eligibility: {
    status: string | null;
    exclusionReason: string | null;
    evidence: ActivitySelectionConformanceValue;
    gates: ActivitySelectionConformanceGate[];
    ruleRefs: unknown[];
  };
  signals: ActivitySelectionConformanceEntry[];
  penalties: ActivitySelectionConformanceEntry[];
  decision: {
    classification: "primary" | "non-primary" | "pending" | "unavailable";
    selectionStatus: string | null;
    selectedSlot: number | null;
    finalSelectionScore: ActivitySelectionConformanceValue;
    preferredSlotCandidate: ActivitySelectionConformanceValue;
    selectionReasonCode: string | null;
    selectionReasonText: string | null;
    runtimeHandoffPriority: number | null;
  };
  nonPrimaryContext: {
    status: string | null;
    promotionConditionCode: string | null;
    promotionCondition: ActivitySelectionConformanceValue;
    reviewCondition: ActivitySelectionConformanceValue;
  };
  governance: {
    traceCompletenessStatus: string | null;
    replayStatus: string | null;
    replayedAt: string | null;
    replayHash: string | null;
    replayDiffs: ActivitySelectionConformanceValue;
    manualReviewRequired: boolean;
    manualReviewState: string | null;
    manualReviewJustification: string | null;
    manualReviewActor: string | null;
    manualReviewReviewedAt: string | null;
    traceFlags: unknown[];
    qa: ActivitySelectionConformanceValue;
  };
};

export const ACTIVITY_SELECTION_EMPTY_MESSAGE =
  "No hay un resultado de selección registrado para esta sesión funcional.";
export const ACTIVITY_SELECTION_PARTIAL_MESSAGE =
  "El resultado de selección está incompleto. No se puede confirmar todavía la cobertura del rol.";
export const ACTIVITY_SELECTION_ERROR_MESSAGE =
  "No fue posible cargar la cobertura de actividades.";

export const SELECTION_MODE_LABELS: Record<
  Exclude<ActivitySelectionCoverageUiMode, "unavailable">,
  string
> = {
  "reentry-required": "Requiere revisar el mapa de trabajo",
  "non-competitive-inclusion": "Inclusión directa",
  "competitive-selection": "Selección por cobertura",
  "manual-review-required": "Revisión necesaria",
};

export function toUiSelectionMode(
  mode: ActivitySelectionModePersisted | null,
): ActivitySelectionCoverageUiMode {
  if (mode === "reentry_required") return "reentry-required";
  if (mode === "non_competitive_inclusion") return "non-competitive-inclusion";
  if (mode === "competitive_selection") return "competitive-selection";
  if (mode === "manual_review_required") return "manual-review-required";
  return "unavailable";
}
