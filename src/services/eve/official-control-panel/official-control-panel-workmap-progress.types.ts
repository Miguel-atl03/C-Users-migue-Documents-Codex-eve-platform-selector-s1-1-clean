export type WorkMapProgressStatus = "ready" | "partial" | "stale";

export type ActivitySelectionStage =
  | "not_started"
  | "awaiting_profile_confirmation"
  | "eligibility_pending"
  | "eligibility_computed"
  | "awaiting_primary_selection"
  | "selection_saved"
  | "selection_rejected"
  | "effective"
  | "blocked";

export type PanelProjectionMeta = {
  scopeResolved: boolean;
  projectionStatus:
    | "ready"
    | "partial"
    | "stale"
    | "forbidden"
    | "not_found"
    | "fatal";
  missingSources: string[];
  generatedAt: string;
  sourceMaxUpdatedAt: string | null;
  staleThresholdMs: number;
  refreshStartedAt: string | null;
  refreshCompletedAt: string | null;
};

export type WorkMapActivityState =
  | "captured"
  | "eligible"
  | "selected_primary"
  | "selected_non_primary"
  | "not_selected"
  | "awaiting_effective_selection"
  | "runtime_prepared"
  | "runtime_not_started";

export type WorkMapFinding = {
  findingId: string;
  code: string;
  severity: "info" | "warning" | "critical";
  scope: "case" | "participant" | "workmap" | "experience" | "runtime";
  source: string;
  detectedAt: string;
  status: "active" | "resolved";
  recommendedNextAction: string;
  title: string;
  detail: string;
};

export type WorkMapProgressActivity = {
  id: string;
  label: string;
  state?: WorkMapActivityState;
  classification?: "primary" | "non-primary" | "pending" | "unavailable";
  selectedSlot: number | null;
  sourceReference?: string | null;
  sourceWorkmapRecordId?: string | null;
  selectionResultId?: string | null;
  selectionResultItemId?: string | null;
  eligible?: boolean | null;
  selectedPrimary?: boolean;
  selectedNonPrimary?: boolean;
  effectiveSelection?: boolean;
  functionalProfileId?: string | null;
  roleRuntimeSessionId?: string | null;
  runtimeRunId?: string | null;
  runtimeRunState?: string | null;
  runtimeRunReadinessState?: string | null;
};

export type WorkMapProgressView = {
  caseId: string;
  company: { id: string | null; label: string | null };
  engagement?: { id: string | null; label: string | null; status: string | null };
  diagnosticCase: { id: string; label: string | null; statusLabel: string | null };
  user: { id: string | null; label: string | null; matchedGaby: boolean };
  role: { id: string | null; label: string | null };
  participant?: {
    id: string | null;
    userId: string | null;
    authUserId: string | null;
    label: string | null;
    status: string | null;
    declaredPosition: string | null;
  };
  functionalProfile?: {
    id: string | null;
    label: string | null;
    status: "materialized" | "pending_materialization";
  };
  profileTrace?: {
    profileStatus:
      | "candidate"
      | "awaiting_confirmation"
      | "confirmed"
      | "blocked";
    sourceWorkmapId: string | null;
    workmapVersion: string | number | null;
    responsibilitiesCount: number | null;
    activitiesCount: number | null;
    confirmationStatus: string | null;
  };
  selection?: {
    stage: ActivitySelectionStage;
    stageLabel: string;
    policyVersion: string | null;
    selectionMode: string | null;
    maxPrimaryAllowed: number | null;
    eligibleCount: number | null;
    selectedPrimaryCount: number | null;
    nonPrimaryContextCount: number | null;
    traceCompletenessStatus: string | null;
    replayStatus: string | null;
    producerStatus: "available" | "pending" | "missing_remote_tables";
    blockingReason: string | null;
    nextProducerRequired: string | null;
  };
  functionalSession?: {
    id: string | null;
    status: "active" | "not_started";
  };
  runtime?: {
    runId: string | null;
    status: "prepared" | "active" | "not_started";
    reason: string | null;
    preparedRunCount?: number;
    startedRunCount?: number;
  };
  workmap: {
    status: WorkMapProgressStatus;
    stateLabel: string;
    source: "case_participant_workmap_snapshots" | "activity_selection_workmap_snapshot" | "absent";
    snapshotId: string | null;
    version: string | number | null;
    hash: string | null;
    lastUpdatedAt: string | null;
    responsibilitiesCount: number | null;
    activitiesCount: number | null;
    created?: boolean;
    saved?: boolean;
    submitted?: boolean;
    accepted?: boolean;
  };
  coverage: {
    eligibleCount: number | null;
    selectedCount: number | null;
    nonPrimaryContextCount: number | null;
    workmapCoverageGap: boolean | null;
    coverageLabel: string;
  };
  activities: WorkMapProgressActivity[];
  activitiesPage?: {
    page: number;
    pageSize: number;
    total: number;
    rendered: number;
    search: string | null;
    status: string | null;
    selectionStatus: string | null;
  };
  gaps: string[];
  findings?: WorkMapFinding[];
  lastScreen: {
    screenKey: string | null;
    status: string | null;
    occurredAt: string | null;
  };
  lastInteractionAt?: string | null;
  nextStep?: string | null;
  lastUpdatedAt: string | null;
  generatedAt: string;
  meta?: PanelProjectionMeta;
};
