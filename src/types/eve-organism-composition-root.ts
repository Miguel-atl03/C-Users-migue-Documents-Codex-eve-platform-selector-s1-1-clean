export type EveOrganismCapability =
  | "runtimeCapture"
  | "gateAdvisory"
  | "gateEnforcement"
  | "objectBinding"
  | "outboxPublish"
  | "governanceObserve"
  | "candidateGeneration"
  | "humanRelease"
  | "registryWrite"
  | "finalExport"
  | "parallelExecution"
  | "diagnosis"
  | "productiveRuntimeAuthority"
  | "uiExposure"
  | "databaseWrite";

export type EveOrganismCapabilityState =
  | "OFF"
  | "VALIDATED"
  | "SHADOW"
  | "SUPERVISED"
  | "CONTROLLED_ACTIVE"
  | "ACTIVE"
  | "DEGRADED"
  | "QUARANTINED"
  | "ROLLBACK_IN_PROGRESS"
  | "REVOKED";

export type EveOrganismShadowStatus =
  | "SHADOW_ACCEPTED"
  | "SHADOW_BLOCKED"
  | "SHADOW_DEGRADED"
  | "SHADOW_QUARANTINED";

export type EveOrganismShadowBlockerId =
  | "OCR-BLK-001"
  | "OCR-BLK-002"
  | "OCR-BLK-003"
  | "OCR-BLK-004"
  | "OCR-BLK-005"
  | "OCR-BLK-006"
  | "OCR-BLK-007"
  | "OCR-BLK-008"
  | "OCR-BLK-009"
  | "OCR-BLK-010"
  | "OCR-BLK-011"
  | "OCR-BLK-012"
  | "OCR-BLK-013"
  | "OCR-BLK-014"
  | "OCR-BLK-015";

export type EveOrganismShadowBlockerSeverity = "warning" | "critical";

export type EveOrganismClientIntent = {
  intentId: string;
  label: string;
  requestedAction: string;
};

export type EveOrganismEvidenceInput = {
  evidenceId: string;
  kind: string;
  summary: string;
  provenance?: {
    sourceId: string;
    sourcePath?: string;
    sourceLine?: number;
  };
};

export type EveOrganismCandidateInput = {
  candidateId: string;
  kind: string;
  summary: string;
  sourceTrace?: string[];
};

export type EveOrganismForbiddenSideEffectRequest = {
  registryWrite?: boolean;
  finalExport?: boolean;
  diagnosis?: boolean;
  productiveRuntimeAuthority?: boolean;
  databaseWrite?: boolean;
  uiExposure?: boolean;
  parallelExecution?: boolean;
  humanRelease?: boolean;
  unauditedOverride?: boolean;
};

export type EveOrganismShadowCommand = {
  commandId: string;
  tenantId: string;
  organizationId: string;
  sessionId: string;
  activityId: string;
  actorId: string;
  requestedCapability: EveOrganismCapability | string;
  requestedState: EveOrganismCapabilityState;
  clientIntent: EveOrganismClientIntent;
  evidenceInputs: EveOrganismEvidenceInput[];
  candidateInputs: EveOrganismCandidateInput[];
  overrideRequested: boolean;
  overrideAudited: boolean;
  idempotencyKey: string;
  correlationId: string;
  dryRun: true;
  currentState?: EveOrganismCapabilityState;
  forbiddenSideEffects?: EveOrganismForbiddenSideEffectRequest;
};

export type EveOrganismShadowBlocker = {
  id: EveOrganismShadowBlockerId;
  severity: EveOrganismShadowBlockerSeverity;
  message: string;
  evidenceRef?: string;
};

export type EveOrganismShadowWarning = {
  id: string;
  message: string;
  evidenceRef?: string;
};

export type EveOrganismShadowTraceEvent = {
  traceId: string;
  sequence: number;
  phase: string;
  component: string;
  decision: string;
  reason: string;
  inputRef: string;
  outputRef: string;
  blockerIds: EveOrganismShadowBlockerId[];
  timestamp: string;
  correlationId: string;
};

export type EveOrganismProducedCandidate = {
  candidateId: string;
  kind:
    | "RuntimeCommand"
    | "ActivityRuntimeRun"
    | "EvidenceItem"
    | "CanonicalVariableRecord"
    | "GateDecision"
    | "StructuralCandidateRecord"
    | "ReadinessDecision"
    | "ParallelCandidate";
  sourceRefs: string[];
  shadowOnly: true;
};

export type EveOrganismNoCableadoAttestation = {
  runtimeConnected: false;
  shadowActivated: false;
  registryWritten: false;
  exportProduced: false;
  diagnosisEnabled: false;
  dbWritten: false;
  uiTouched: false;
  productionAuthorityGranted: false;
};

export type EveOrganismCapabilityPolicy = {
  capability: EveOrganismCapability;
  mode: "shadow_advisory" | "blocked";
  productiveAuthority: false;
  reason: string;
};

export type EveOrganismCapabilityStateDecision = {
  requestedCapability: string;
  requestedState: EveOrganismCapabilityState;
  currentState: EveOrganismCapabilityState;
  effectiveState: EveOrganismCapabilityState;
  capabilityMode: "shadow_advisory" | "blocked" | "unknown";
  recommendation: EveOrganismCapabilityState | "NO_GO";
  productiveActivationGranted: false;
  reason: string;
};

export type EveOrganismAuditShadowRecord = {
  auditId: string;
  commandId: string;
  tenantId: string;
  organizationId: string;
  sessionId: string;
  activityId: string;
  actorId: string;
  accepted: boolean;
  status: EveOrganismShadowStatus;
  blockerIds: EveOrganismShadowBlockerId[];
  producedCandidateIds: string[];
  correlationId: string;
  idempotencyKey: string;
  timestamp: string;
  noCableadoAttestation: EveOrganismNoCableadoAttestation;
};

export type EveOrganismShadowResult = {
  accepted: boolean;
  status: EveOrganismShadowStatus;
  blockers: EveOrganismShadowBlocker[];
  warnings: EveOrganismShadowWarning[];
  trace: EveOrganismShadowTraceEvent[];
  producedCandidates: EveOrganismProducedCandidate[];
  auditRecord: EveOrganismAuditShadowRecord;
  noCableadoAttestation: EveOrganismNoCableadoAttestation;
  capabilityStateDecision: EveOrganismCapabilityStateDecision;
  nextRecommendedGate: "retain_shadow" | "confirm_supervision_preconditions" | "fix_blockers" | "quarantine_review";
};

export type EveOrganismShadowClock = {
  nowIso: () => string;
};

export type EveOrganismCompositionRootShadowOptions = {
  clock?: EveOrganismShadowClock;
};
