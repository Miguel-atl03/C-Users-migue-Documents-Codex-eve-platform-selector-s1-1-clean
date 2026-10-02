import type { WorkMapData } from "./local-work-map.ts";
import type {
  ActivitySelectionSignals,
  SelectionReasonCode,
} from "./primary-activity-selection-policy.v1.3.ts";

export const PRIMARY_ACTIVITY_SELECTION_VERSION =
  "PRIMARY_ACTIVITY_SELECTION_V1_3" as const;

export type PrimaryActivitySelectionMode =
  | "reentry_required"
  | "non_competitive_inclusion"
  | "competitive_selection"
  | "manual_review_required";

export type PrimaryActivityCandidate = {
  id: string;
  areaId: string | null;
  areaLabel: string | null;
  responsibilityId: string;
  responsibilityLiteral: string;
  activityId: string;
  activityLiteral: string;
  activityDescription?: string | null;
  sourcePath: string;
  sourceOrder: number;
  provenance: "workmap_user_literal";
  savedWithWarnings: boolean;
};

export type SelectionGateName =
  | "workmap_trace_ok"
  | "is_work_activity"
  | "granularity_status"
  | "duplicate_or_alias_status"
  | "semantic_sufficiency"
  | "runtime_feasibility"
  | "workmap_warning_present";

export type SelectionGateStatus = "pass" | "warning" | "block";

export type SelectionGateResult = {
  candidateId: string;
  gate: SelectionGateName;
  status: SelectionGateStatus;
  reason: string;
};

export type SelectionScoreBreakdown = {
  candidateId: string;
  pmSignalPotential: number;
  mocSignalPotential: number;
  pfSignalPotential: number;
  olcSignalPotential: number;
  architecturalSignalPotential: number;
  operationalCentrality: number;
  transformationObjectSignal: number;
  handoffDependencySignal: number;
  timerWaitSignal: number;
  synchronizationGovernanceSignal: number;
  frictionExceptionSignal: number;
  pfOlcRiskSignal: number;
  coverageDiversityValue: number;
  responsibilityBalanceAdjustment: number;
  duplicatePenalty: number;
  tooMacroPenalty: number;
  tooMicroPenalty: number;
  overlySpecificToolPenalty: number;
  lateralContextPenalty: number;
  finalSelectionScore: number;
  penalties: {
    duplicatePenalty: number;
    tooMacroPenalty: number;
    tooMicroPenalty: number;
    overlySpecificToolPenalty: number;
    lateralContextPenalty: number;
  };
  responsibilityBalanceAffectedResult: boolean;
  selectedSlot?: number;
  preferredSlotCandidate?: string;
  mmabpPotential: number;
  frictionVariety: number;
  coverage: number;
  evidenceFeasibility: number;
  boost: number;
  burdenPenalty: number;
  selectorScore: number;
  detectedSignals: string[];
  rationale: string[];
};

export type SelectedPrimaryActivity = PrimaryActivityCandidate & {
  selectionStatus: "selected_for_runtime";
  runtimeOrder: number;
  selectionReason: string;
  selectionReasonCode: SelectionReasonCode;
  selectionReasonText: string;
  selectedSlot: number;
  finalSelectionScore: number;
  scoreBreakdown: ActivitySelectionSignals;
  penalties: SelectionScoreBreakdown["penalties"];
  responsibilityBalanceAffectedResult: boolean;
  score: SelectionScoreBreakdown;
};

export type NonPrimaryContextStatus =
  | "not_selected_competitive"
  | "context_only_duplicate_or_alias"
  | "context_only_too_micro"
  | "needs_reentry_too_macro"
  | "needs_reentry_generic_responsibility"
  | "backlog"
  | "context_only";

export type ContextActivity = PrimaryActivityCandidate & {
  contextStatus: "context_only" | "backlog" | "not_selected_competitive";
  nonPrimaryContextStatus: NonPrimaryContextStatus;
  contextReason: string;
  activityTitle: string;
  responsibilityTitle: string;
  scores?: SelectionScoreBreakdown;
  promotionCondition: string;
  score?: SelectionScoreBreakdown;
};

export type ExcludedActivity = PrimaryActivityCandidate & {
  exclusionReason:
    | "missing_workmap_trace"
    | "not_work_activity"
    | "duplicate_or_alias"
    | "insufficient_semantics"
    | "runtime_not_feasible"
    | "granularity_review";
  gate: SelectionGateName;
};

export type SelectionRunLog = {
  version: typeof PRIMARY_ACTIVITY_SELECTION_VERSION;
  rawActivityCount: number;
  eligibleActivityCount: number;
  selectedActivityCount: number;
  excludedActivityCount: number;
  mode: PrimaryActivitySelectionMode;
  maxPrimaryActivities: 8;
  selectorVersion: "v1.3";
  notes: string[];
};

export type PrimaryActivitySelectionResult = {
  version: typeof PRIMARY_ACTIVITY_SELECTION_VERSION;
  mode: PrimaryActivitySelectionMode;
  selectedPrimaryActivities: SelectedPrimaryActivity[];
  nonPrimaryContextActivities: ContextActivity[];
  excludedActivities: ExcludedActivity[];
  gates: SelectionGateResult[];
  scoring: SelectionScoreBreakdown[];
  selectionGovernance: "eve_policy";
  userSelectedActivities: false;
  primaryActivitySelectionResolvedByUser: false;
  maxPrimaryActivities: 8;
  workMapContextPreserved: true;
  runtimeBudget: {
    baseInteractionsPerPrimaryActivity: 40;
    maxCausalInteractionsPerPrimaryActivity: 20;
  };
  runLog: SelectionRunLog;
  workMapSnapshot: WorkMapData;
};
