/**
 * §14 Parallel Production & QA — panel technical observation types.
 * Not MBA Object[State]. Not EvidenceBundle.
 */

export const PP_PROCESS_CODES = ["P-SUP-06", "P-SUP-07/08", "P-SUP-09"] as const;
export type ParallelProductionProcessCode = (typeof PP_PROCESS_CODES)[number];

export const PP_PACKAGE_STATUSES = [
  "received",
  "validated",
  "processing",
  "with_findings",
  "in_rework",
  "satisfied",
  "blocked",
  "export_eligible",
  "export_not_eligible",
] as const;
export type ParallelProductionPackageStatus =
  (typeof PP_PACKAGE_STATUSES)[number];

export const PP_READINESS_STATUSES = [
  "ready",
  "ready_with_flags",
  "blocked_by_missing_evidence",
  "blocked_by_contradiction",
  "blocked_by_missing_canonical_route",
  "manual_review_required",
  "reentry_required",
] as const;
export type ParallelProductionReadinessStatus =
  (typeof PP_READINESS_STATUSES)[number];

export const PP_EVAL_STATUSES = [
  "not_evaluated",
  "passed",
  "failed",
  "blocked",
] as const;
export type ParallelProductionEvalStatus = (typeof PP_EVAL_STATUSES)[number];

export const PP_ACA_STATUSES = ["Satisfied", "WithFindings", "Blocked"] as const;
export type ParallelProductionAcaStatus = (typeof PP_ACA_STATUSES)[number];

export const PP_FINDING_TYPES = [
  "conformance",
  "factual_consistency",
  "temporal_consistency",
  "structural_consistency",
  "composite_consistency",
  "b3_route_exception",
  "b7_boundary_violation",
] as const;
export type ParallelProductionFindingType = (typeof PP_FINDING_TYPES)[number];

export const PP_FINDING_STATUSES = [
  "open",
  "rework_requested",
  "rework_started",
  "rework_submitted",
  "reevaluation_started",
  "reevaluation_completed",
  "resolved",
  "reopened",
] as const;
export type ParallelProductionFindingStatus =
  (typeof PP_FINDING_STATUSES)[number];

export const PP_EXPORT_ELIGIBILITY = [
  "not_evaluated",
  "eligible",
  "blocked",
] as const;
export type ParallelProductionExportEligibility =
  (typeof PP_EXPORT_ELIGIBILITY)[number];

export type ParallelProductionLayerKey =
  | "source_bundle"
  | "candidates"
  | "facts"
  | "registries"
  | "ir"
  | "inventory"
  | "qa"
  | "export";

export type ParallelProductionLayerDisplayStatus =
  | "empty"
  | "not_evaluated"
  | "incomplete"
  | "blocked"
  | "available"
  | "error";

export type ParallelProductionDataStatus =
  | "empty"
  | "partial"
  | "available"
  | "unavailable"
  | "error";

export type ParallelProductionAlertCode =
  | "qa_with_findings"
  | "b3_route_exception"
  | "b7_boundary_violation"
  | "rework_required"
  | "export_blocked"
  | "qa_pending"
  | "cp012_factual_producer_unavailable";

export type ParallelProductionAlertView = {
  code: ParallelProductionAlertCode;
  title: string;
  packageId: string;
  packageRef: string;
  detail: string;
  blocking: boolean;
};

export type ParallelProductionLayerView = {
  key: ParallelProductionLayerKey;
  label: string;
  displayStatus: ParallelProductionLayerDisplayStatus;
  message: string | null;
  ref: string | null;
};

export type ParallelProductionFindingView = {
  id: string;
  findingType: ParallelProductionFindingType;
  affectedModel: string | null;
  severity: string | null;
  evidenceRef: string;
  origin: string;
  findingStatus: ParallelProductionFindingStatus;
  reworkProcessCode: "P-SUP-06";
  blocking: boolean;
  resolutionRef: string | null;
  openedAt: string;
  resolvedAt: string | null;
};

export type ParallelProductionPackageEventView = {
  id: string;
  eventType: string;
  actorLabel: string;
  occurredAt: string;
  beforeStatus: string;
  afterStatus: string;
  reason: string | null;
  evidenceRef: string | null;
};

export type ParallelProductionPackageView = {
  id: string;
  packageRef: string;
  packageStatus: ParallelProductionPackageStatus;
  readinessStatus: ParallelProductionReadinessStatus | null;
  acaStatus: ParallelProductionAcaStatus | null;
  conformanceStatus: ParallelProductionEvalStatus;
  consistencyFactualStatus: ParallelProductionEvalStatus;
  consistencyTemporalStatus: ParallelProductionEvalStatus;
  consistencyStructuralStatus: ParallelProductionEvalStatus;
  consistencyCompositeStatus: ParallelProductionEvalStatus;
  b3RouteException: boolean;
  b7BoundaryViolation: boolean;
  exportEligibility: ParallelProductionExportEligibility;
  generatorAvailable: boolean;
  exportGenerationStatus: string;
  reworkProcessCode: "P-SUP-06" | null;
  layers: ParallelProductionLayerView[];
  findingsOpen: ParallelProductionFindingView[];
  findingsResolved: ParallelProductionFindingView[];
  timeline: ParallelProductionPackageEventView[];
  assessmentActions: {
    startConformance: boolean;
    completeConformance: boolean;
    startConsistency: boolean;
    completeConsistency: boolean;
  };
  assessmentBlockReason: string | null;
  version: number;
  lastEventAt: string | null;
};

export type ParallelProductionTrackingResponse = {
  caseId: string;
  companyId: string;
  dataStatus: ParallelProductionDataStatus;
  emptyMessage: string | null;
  package: ParallelProductionPackageView | null;
  alerts: ParallelProductionAlertView[];
  generatedAt: string;
};

/** Evaluation display order (rector §14.2): conformance before consistency. */
export const PP_QA_EVALUATION_ORDER = [
  "conformance",
  "consistency_factual",
  "consistency_temporal",
  "consistency_structural",
  "consistency_composite",
] as const;

export function isExportEligibleGate(input: {
  acaStatus: ParallelProductionAcaStatus | null;
  conformanceStatus: ParallelProductionEvalStatus;
  consistencyCompositeStatus: ParallelProductionEvalStatus;
  b3RouteException: boolean;
  b7BoundaryViolation: boolean;
  openBlockingFindings: number;
}): boolean {
  return (
    input.acaStatus === "Satisfied" &&
    input.conformanceStatus === "passed" &&
    input.consistencyCompositeStatus === "passed" &&
    !input.b3RouteException &&
    !input.b7BoundaryViolation &&
    input.openBlockingFindings === 0
  );
}

export function withFindingsIsNotSatisfied(
  aca: ParallelProductionAcaStatus | null,
): boolean {
  return aca !== "Satisfied";
}
