export type EveGate2ObservationMode =
  | "replay_only"
  | "offline_fixture"
  | "future_real_observable_candidate"
  | "production_observer_active"
  | "mutating_observer"
  | "diagnostic_observer"
  | "autonomous_observer";

export type EveGate2AdmissibilityStatus =
  | "PASS_REPLAY_ONLY"
  | "BLOCKED_MISSING_CONTEXT"
  | "BLOCKED_MISSING_TRACEABILITY"
  | "BLOCKED_MISSING_MBA_ANCHOR"
  | "BLOCKED_MUTATION_RISK"
  | "BLOCKED_SECURITY_BOUNDARY"
  | "BLOCKED_B3_B7_VIOLATION"
  | "BLOCKED_FIXTURE_AS_REAL"
  | "REQUIRES_PRODUCT_OWNER_EVIDENCE"
  | "REQUIRES_FUTURE_READ_ONLY_INVENTORY";

export type EveGate2NoGoCode =
  | "NG-001"
  | "NG-002"
  | "NG-003"
  | "NG-004"
  | "NG-005"
  | "NG-006"
  | "NG-007"
  | "NG-008"
  | "NG-009"
  | "NG-010"
  | "NG-011"
  | "NG-012"
  | "NG-013"
  | "NG-014"
  | "NG-015"
  | "NG-016"
  | "NG-017"
  | "NG-018"
  | "NG-019"
  | "NG-020"
  | "NG-021"
  | "NG-022"
  | "NG-023"
  | "NG-024"
  | "NG-025";

export type EveGate2Priority = "P0" | "P1" | "P2" | "P3" | "P4" | "P5" | "critical";

export type EveGate2EvidenceStatus = "required_not_collected" | "provided";

export type EveGate2ProofType =
  | "product_artifact_with_locator"
  | "audit_log_with_timestamp"
  | "runtime_inventory_readonly"
  | "versioned_configuration"
  | "source_trace_record"
  | "security_policy_or_rls_policy_with_locator"
  | "manual_review_record_with_owner"
  | "fixture"
  | "synthetic_field"
  | "test_only_payload"
  | "replay_only_output"
  | "verbal_confirmation_without_artifact";

export type EveGate2RuntimeContractConfig = {
  contractVersion: "GATE2_REAL_OBSERVABLE_SIGNAL_RUNTIME_CONTRACT_V1";
  allowedObservationModes: readonly EveGate2ObservationMode[];
  forbiddenObservationModes: readonly EveGate2ObservationMode[];
  requiredSignalSections: readonly string[];
  requiredMBAAnchorFields: readonly string[];
  requiredEvidenceFields: readonly string[];
  requiredNoMutationFields: readonly string[];
  requiredSecurityFields: readonly string[];
  requiredB3B7Fields: readonly string[];
  admissibilityStatuses: readonly EveGate2AdmissibilityStatus[];
  forbiddenAdmissibilityStatuses: readonly string[];
};

export type EveGate2SignalIdentity = {
  tenantId?: string;
  organizationId?: string;
  sessionId?: string;
  activityId?: string;
  actorId_or_userId?: string;
  caseId?: string;
};

export type EveGate2MBAAnchor = {
  pmProcessId?: string;
  pfEvent?: string;
  objectState?: string;
  objectStateInOLC?: boolean;
  mocClass?: string;
  mocOperation?: string;
  olcTransitionEvent?: string;
  pfTimerIfWaiting?: string;
};

export type EveGate2Traceability = {
  provenance?: string;
  sourceTrace?: string;
  sourceRef?: string;
  evidenceRef?: string;
  routeRef?: string;
  idempotencyKey?: string;
  correlationId?: string;
  officialFlowRef?: string;
  auditRef?: string;
};

export type EveGate2NoMutationBoundary = {
  uiTouchAllowed?: boolean;
  workMapMutationAllowed?: boolean;
  significadoMutationAllowed?: boolean;
  dbWriteAllowed?: boolean;
  supabaseWriteAllowed?: boolean;
  runtimeMutationAllowed?: boolean;
  registryWriteAllowed?: boolean;
  exportAllowed?: boolean;
  diagnosisAllowed?: boolean;
};

export type EveGate2SecurityBoundary = {
  authBoundaryRequired?: boolean;
  tenantIsolationRequired?: boolean;
  rlsReadBoundaryRequiredIfDB?: boolean;
  serviceRoleAllowed?: boolean;
  secretsAllowed?: boolean;
  tokenExposureAllowed?: boolean;
};

export type EveGate2B3B7Boundary = {
  receiverSatisfactionAllowedAsFeedback?: boolean;
  receiverFeedbackRequiresRouteRef?: boolean;
  receiverFeedbackPresent?: boolean;
  b7DiagnosticUseAllowed?: boolean;
  b7StructuralFactAllowed?: boolean;
  b3b7AlignmentDeltaRequiredWhenApplicable?: boolean;
};

export type EveGate2EvidenceClaim = {
  field?: string;
  proofType?: EveGate2ProofType;
  claimedAsRealEvidence?: boolean;
};

export type EveGate2SignalCandidate = {
  signalId: string;
  observationMode: EveGate2ObservationMode;
  identity?: EveGate2SignalIdentity;
  mba_anchor?: EveGate2MBAAnchor;
  traceability?: EveGate2Traceability;
  no_mutation_boundary?: EveGate2NoMutationBoundary;
  security_boundary?: EveGate2SecurityBoundary;
  b3_b7_boundary?: EveGate2B3B7Boundary;
  evidence?: EveGate2EvidenceClaim[];
  futureReadOnlyInventoryComplete?: boolean;
  productOwnerEvidenceComplete?: boolean;
};

export type EveGate2NoGoRule = {
  noGoId: EveGate2NoGoCode;
  name: string;
  condition: string;
  checkedContractField: string;
  severity: EveGate2Priority;
  resultCode: EveGate2AdmissibilityStatus;
  blockingResult: EveGate2AdmissibilityStatus;
  affectedBlocker: string;
  affectedExitCondition: string;
  requiredCorrection: string;
  canBeOverridden: false;
};

export type EveGate2TriggeredNoGo = EveGate2NoGoRule & {
  signalId: string;
};

export type EveGate2EvidenceFieldRegistryEntry = {
  fieldId: string;
  contractField: string;
  evidenceCategory: string;
  priority: EveGate2Priority;
  requiredOwner: "product_owner" | "technical_inventory" | "manual_review" | "audit_log";
  requiredLocator: boolean;
  requiredTimestampOrVersion: boolean;
  requiredSourceSystem: boolean;
  requiredProofType: boolean;
  whyNotFixtureRequired: boolean;
  acceptableProofTypes: readonly EveGate2ProofType[];
  rejectedProofTypes: readonly EveGate2ProofType[];
  relatedBlocker: string;
  relatedExitCondition: string;
  currentStatus: EveGate2EvidenceStatus;
};

export type EveGate2PromotionChecklistItem = {
  checklistItemId: string;
  requirement: string;
  currentStatus: EveGate2EvidenceStatus;
  canPassNow: boolean;
};

export type EveGate2ValidationResult = {
  signalId: string;
  accepted: boolean;
  status: EveGate2AdmissibilityStatus;
  statuses: EveGate2AdmissibilityStatus[];
  triggeredNoGos: EveGate2TriggeredNoGo[];
  gate3Ready: false;
  gate3Result: "NOT_READY_FOR_GATE3";
  replayOnlyContinues: true;
  observerAuthorized: false;
  realObservationAuthorized: false;
  readOnlyObserverDesignAuthorized: false;
  registryExportAllowed: false;
  diagnosisEnabled: false;
};

export type EveGate2PromotionEvaluation = {
  gate3Ready: false;
  gate3Result: "NOT_READY_FOR_GATE3";
  items: EveGate2PromotionChecklistItem[];
  blockersClosed: 0;
  exitConditionsClosed: 0;
  reason: string;
};

export type Gate2ObservationMode = EveGate2ObservationMode;

export type Gate2SignalStatus = EveGate2AdmissibilityStatus;

export type Gate2ValidatorResultCode = EveGate2AdmissibilityStatus;

export type Gate2NoGoCode = EveGate2NoGoCode;

export type Gate2GuardrailAuthority = {
  replayOnlyContinues: true;
  observerAuthorized: false;
  realObservationAuthorized: false;
  readOnlyObserverDesignAuthorized: false;
  registryExportAllowed: false;
  diagnosisEnabled: false;
  gate3Ready: false;
};

export type Gate2RuntimeSignalContract = EveGate2RuntimeContractConfig;

export type Gate2SignalInput = EveGate2SignalCandidate;

export type Gate2ValidationFinding = EveGate2TriggeredNoGo;

export type Gate2ValidationResult = EveGate2ValidationResult;

export type Gate2NoGoRule = EveGate2NoGoRule;

export type Gate2EvidenceFieldRequirement = EveGate2EvidenceFieldRegistryEntry;

export type Gate2PromotionChecklistItem = EveGate2PromotionChecklistItem;

export type Gate2PromotionChecklistResult = EveGate2PromotionEvaluation;
