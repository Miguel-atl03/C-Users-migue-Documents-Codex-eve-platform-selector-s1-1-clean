import type {
  EveOrganismCapabilityState,
  EveOrganismCandidateInput,
  EveOrganismClientIntent,
  EveOrganismEvidenceInput,
  EveOrganismForbiddenSideEffectRequest,
  EveOrganismShadowBlocker,
  EveOrganismShadowCommand,
  EveOrganismShadowResult,
} from "./eve-organism-composition-root.ts";

export type EveOrganismShadowE2EObservationMode =
  | "fixture"
  | "replay"
  | "read_only_observation";

export type EveOrganismShadowE2ESignalKind =
  | "workmap_activity"
  | "significado_intent"
  | "runtime_like_response"
  | "evidence_capture"
  | "candidate_generation"
  | "official_flow_result"
  | "gate_bypass_signal"
  | "evidence_corruption_signal"
  | "registry_export_attempt"
  | "tenant_leak_signal";

export type EveOrganismShadowE2ESideEffectPolicy = {
  noDbWrite: boolean;
  noRegistryWrite: boolean;
  noExport: boolean;
  noUiTouch: boolean;
  noDiagnosis: boolean;
  noRuntimeMutation: boolean;
  noSupabaseRequired: boolean;
};

export type EveOrganismShadowE2EProvenance = {
  sourceId: string;
  sourcePath?: string;
  sourceLine?: number;
  observedBy?: EveOrganismShadowE2EObservationMode | "fixture_adapter";
};

export type EveOrganismShadowE2EOfficialFlowRef = {
  flowId: string;
  tenantId?: string;
  organizationId?: string;
  sessionId?: string;
  activityId?: string;
  outcomeRef?: string;
  outcomeStatus?: string;
  mutatedByShadow?: false;
};

export type EveOrganismShadowE2EObservedSignal = {
  observedSignalId: string;
  observedAt: string;
  sourceSystem: string;
  sourcePath: string;
  tenantId?: string;
  organizationId?: string;
  sessionId?: string;
  activityId?: string;
  actorId?: string;
  signalKind: EveOrganismShadowE2ESignalKind;
  clientIntent: string | EveOrganismClientIntent;
  rawObservedPayload: unknown;
  evidenceInputs: EveOrganismEvidenceInput[];
  candidateInputs: EveOrganismCandidateInput[];
  provenance?: EveOrganismShadowE2EProvenance;
  idempotencyKey?: string;
  correlationId?: string;
  officialFlowRef?: EveOrganismShadowE2EOfficialFlowRef;
  observationMode: EveOrganismShadowE2EObservationMode;
  sideEffectPolicy: EveOrganismShadowE2ESideEffectPolicy;
  requestedCapability?: string;
  requestedState?: EveOrganismCapabilityState | string;
  overrideRequested?: boolean;
  overrideAudited?: boolean;
};

export type EveOrganismShadowE2EDivergenceType =
  | "none"
  | "missing_context"
  | "provenance_gap"
  | "semantic_gate_difference"
  | "candidate_difference"
  | "no_go_triggered"
  | "false_blocker_candidate"
  | "latency_or_replay_issue"
  | "tenant_boundary_risk"
  | "unknown";

export type EveOrganismShadowE2EDivergenceSeverity =
  | "none"
  | "info"
  | "low"
  | "medium"
  | "high"
  | "critical";

export type EveOrganismShadowE2EComparison = {
  comparisonId: string;
  officialFlowRef?: EveOrganismShadowE2EOfficialFlowRef;
  shadowTraceRef: string;
  sameOutcome: boolean | "unknown";
  divergenceType: EveOrganismShadowE2EDivergenceType;
  divergenceSeverity: EveOrganismShadowE2EDivergenceSeverity;
  blockers: EveOrganismShadowBlocker[];
  explanation: string;
  reproducible: boolean;
  requiresHumanReview: boolean;
};

export type EveOrganismShadowE2ENoCableadoAttestation = {
  registry_write_allowed: false;
  final_export_allowed: false;
  diagnosis_allowed: false;
  db_write_allowed: false;
  ui_touch_allowed: false;
  production_authority_allowed: false;
  runtime_mutation_allowed: false;
  supabase_required: false;
  officialFlowUntouched: true;
};

export type EveOrganismShadowE2EResult = {
  accepted: boolean;
  observedSignalId: string;
  shadowCommand: EveOrganismShadowCommand;
  shadowResult: EveOrganismShadowResult;
  comparison: EveOrganismShadowE2EComparison;
  noCableadoAttestation: EveOrganismShadowE2ENoCableadoAttestation;
  officialFlowUntouched: true;
  warnings: string[];
  blockers: EveOrganismShadowBlocker[];
};

export type EveOrganismShadowE2EReplayOptions = {
  clock?: {
    nowIso: () => string;
  };
};

export type EveOrganismShadowE2ESideEffectDerivation = {
  forbiddenSideEffects: EveOrganismForbiddenSideEffectRequest;
  warnings: string[];
};
