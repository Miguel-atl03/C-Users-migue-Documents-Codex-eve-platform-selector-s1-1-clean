export type Gate2CapabilityId =
  | "clientAccess"
  | "tenantContext"
  | "runtimeCapture"
  | "gateAdvisory"
  | "gateEnforcement"
  | "objectBinding"
  | "membraneOutbox"
  | "governanceObserve"
  | "governanceEnforce"
  | "candidateGeneration"
  | "humanRelease"
  | "registryWrite"
  | "finalExport"
  | "parallelExecution"
  | "externalLLMAssistance";

export type Gate2CapabilityState =
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

export type Gate2CapabilityTransitionResultCode =
  | "PASS_OFFLINE_ONLY"
  | "BLOCKED_CAPABILITY_TRANSITION"
  | "BLOCKED_LEDGER_REQUIRED"
  | "BLOCKED_MANUAL_REVIEW_REQUIRED"
  | "BLOCKED_B3_B7_AUTHORITY"
  | "REQUIRES_FUTURE_IMPLEMENTATION";

export type Gate2SideEffectClass =
  | "NONE"
  | "LOCAL_MEMORY_ONLY"
  | "LOCAL_AUDIT_RECORD"
  | "LOCAL_SHADOW_OUTBOX_RECORD"
  | "READ_ONLY_PRODUCT_INSPECTION"
  | "PRODUCT_STATE_WRITE"
  | "DATABASE_WRITE"
  | "REGISTRY_WRITE"
  | "EXPORT_GENERATION"
  | "DIAGNOSIS_EMISSION"
  | "UI_EXPOSURE"
  | "NETWORK_CALL"
  | "PARALLEL_EXECUTION"
  | "HUMAN_RELEASE";

export type Gate2SideEffectDecision =
  | "ALLOW_OFFLINE_LOCAL"
  | "DENY"
  | "REQUIRE_MANUAL_REVIEW"
  | "DEGRADE_CAPABILITY"
  | "QUARANTINE_CAPABILITY"
  | "REQUEST_ROLLBACK";

export type Gate2TenantAuthResultCode =
  | "PASS_OFFLINE_ONLY"
  | "BLOCKED_TENANT_CONTEXT"
  | "BLOCKED_AUTH_BOUNDARY"
  | "REQUIRES_REAL_PRODUCT_EVIDENCE";

export type Gate2AlgedonicSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type Gate2AlgedonicAction =
  | "NONE"
  | "REVIEW"
  | "REENTRY"
  | "DEGRADE"
  | "QUARANTINE"
  | "ROLLBACK"
  | "BLOCK";

export type Gate2AuthorityLedgerRecordType =
  | "TRANSITION_REQUEST"
  | "TRANSITION_DECISION"
  | "SIDE_EFFECT_DECISION"
  | "TENANT_AUTH_DECISION"
  | "ALGEDONIC_ESCALATION"
  | "OVERRIDE_REQUEST"
  | "OVERRIDE_DECISION"
  | "ROLLBACK_REQUEST"
  | "ROLLBACK_DECISION";

export type Gate2AuthorityNoGoId =
  | "AG-NG-011"
  | "AG-NG-012"
  | "AG-NG-013"
  | "AG-NG-014"
  | "AG-NG-016"
  | "AG-NG-022"
  | "AG-NG-024"
  | "AG-NG-025"
  | "AG-NG-027"
  | "AG-NG-029";

export type Gate2AuthorityGuardrailResultCode =
  | "PASS_OFFLINE_ONLY"
  | "BLOCKED_CAPABILITY_TRANSITION"
  | "BLOCKED_SIDE_EFFECT"
  | "BLOCKED_TENANT_CONTEXT"
  | "BLOCKED_AUTH_BOUNDARY"
  | "BLOCKED_ALGEDONIC_TRIGGER"
  | "BLOCKED_LEDGER_REQUIRED"
  | "BLOCKED_MANUAL_REVIEW_REQUIRED"
  | "BLOCKED_B3_B7_AUTHORITY"
  | "REQUIRES_REAL_PRODUCT_EVIDENCE"
  | "REQUIRES_FUTURE_IMPLEMENTATION"
  | "NOT_READY_FOR_GATE3";

export type Gate2CapabilityAuthority = {
  capabilityId: Gate2CapabilityId;
  currentState: Gate2CapabilityState;
  currentGate2Authorized: boolean;
  implementedOfflineControlled: boolean;
  productConnected: false;
  observerAuthorized: false;
  blocksProductAuthority: boolean;
  requiresRealEvidenceForPromotion: boolean;
};

export type Gate2CapabilityTransitionInput = {
  capabilityId: Gate2CapabilityId;
  fromState: Gate2CapabilityState;
  toState: Gate2CapabilityState;
  hasLedgerEntry?: boolean;
  hasManualReview?: boolean;
  b3RouteRefPresent?: boolean;
  b7BoundaryCleared?: boolean;
  offlineOnly?: boolean;
};

export type Gate2CapabilityTransitionResult = {
  allowed: boolean;
  resultCode: Gate2CapabilityTransitionResultCode;
  capabilityId: Gate2CapabilityId;
  fromState: Gate2CapabilityState;
  toState: Gate2CapabilityState;
  requiresLedger: boolean;
  requiresManualReview: boolean;
  gate3Ready: false;
  observerAuthorized: false;
  reason: string;
};

export type Gate2SideEffectGuardInput = {
  sideEffectClass: Gate2SideEffectClass;
  hasAcaSatisfied?: boolean;
  hasAggregatedCausalMovie?: boolean;
  objectInsideOlc?: boolean;
  layer1DiagnosisAttempt?: boolean;
  qaReworkToCore?: boolean;
  offlineOnly?: boolean;
};

export type Gate2SideEffectGuardResult = {
  allowed: boolean;
  decision: Gate2SideEffectDecision;
  resultCode: Gate2AuthorityGuardrailResultCode;
  sideEffectClass: Gate2SideEffectClass;
  localOnly: boolean;
  quarantine: boolean;
  productConnected: false;
  reason: string;
};

export type Gate2TenantAuthContext = {
  tenantId?: string;
  organizationId?: string;
  expectedTenantId?: string;
  observedTenantId?: string;
  actorAuthority?: "human" | "service_role" | "anonymous" | "fixture" | "offline_test";
  tenantIsolationEvidencePresent?: boolean;
  authBoundaryEvidencePresent?: boolean;
  rlsBoundaryEvidencePresent?: boolean;
};

export type Gate2TenantAuthIsolationResult = {
  allowed: boolean;
  resultCode: Gate2TenantAuthResultCode;
  tenantIsolationProven: false;
  authBoundaryProven: false;
  rlsBoundaryProven: false;
  crossTenantResult: "BLOCKED_CROSS_TENANT" | "NOT_APPLICABLE";
  requiresRealProductEvidence: boolean;
  reason: string;
};

export type Gate2AlgedonicInput = {
  trigger:
    | "NONE"
    | "TENANT_LEAK"
    | "B3_ROUTE_MISSING"
    | "B7_BOUNDARY_VIOLATION"
    | "UNAUTHENTICATED_OR_SERVICE_ROLE_ACCESS"
    | "UNAUDITED_OVERRIDE"
    | "STATE_LEDGER_DIVERGENCE"
    | "ROLLBACK_FAILURE"
    | "AUDITOR_EXECUTOR_COLLAPSE"
    | "FIXTURE_CLAIMED_AS_REAL";
  b7RulePreference?: "AG-NG-012" | "AG-NG-013";
};

export type Gate2AlgedonicResult = {
  triggered: boolean;
  resultCode: Gate2AuthorityGuardrailResultCode;
  sourceRule: Gate2AuthorityNoGoId | null;
  severity: Gate2AlgedonicSeverity;
  action: Gate2AlgedonicAction;
  producesCandidate: boolean;
  diagnosticUseAllowed: false;
  sourceRuleVerifiedAgainstNoGoMatrix: boolean;
  reason: string;
};

export type Gate2AuthorityLedgerEntry = {
  sequence: number;
  recordType: Gate2AuthorityLedgerRecordType;
  actorId: string;
  auditorId?: string;
  capabilityId?: Gate2CapabilityId;
  decision: string;
  previousEntryChecksum?: string;
  entryChecksum?: string;
  grantsAuthority?: false;
};

export type Gate2AuthorityLedger = {
  entries: Gate2AuthorityLedgerEntry[];
  appendOnly: true;
  checksumChain: true;
  grantsAuthority: false;
};

export type Gate2AuthorityLedgerAppendResult = {
  accepted: boolean;
  resultCode: Gate2AuthorityGuardrailResultCode;
  ledger: Gate2AuthorityLedger;
  appendedEntry?: Gate2AuthorityLedgerEntry;
  grantsAuthority: false;
  reason: string;
};

export type Gate2AuthorityGuardrailsInput = {
  capabilityTransition?: Gate2CapabilityTransitionInput;
  sideEffect?: Gate2SideEffectGuardInput;
  tenantAuth?: Gate2TenantAuthContext;
  algedonic?: Gate2AlgedonicInput;
  ledger?: Gate2AuthorityLedger;
  ledgerEntry?: Gate2AuthorityLedgerEntry;
  realProductEvidenceProvided?: boolean;
};

export type Gate2AuthorityGuardrailsResult = {
  resultCode: Gate2AuthorityGuardrailResultCode;
  passed: boolean;
  offlineOnly: true;
  gate3Ready: false;
  observerAuthorized: false;
  productionReady: false;
  diagnosisReady: false;
  findings: string[];
};

export type Gate2AuthorityPromotionStatus = {
  gate3Ready: false;
  supervisedOperationAuthorized: false;
  controlledActiveAuthorized: false;
  activeAuthorized: false;
  observerAuthorized: false;
  realObservationAuthorized: false;
  readOnlyObserverDesignAuthorized: false;
  registryExportAllowed: false;
  diagnosisEnabled: false;
  blockersClosedByAuthorityGuardrails: 0;
  exitConditionsClosedByAuthorityGuardrails: 0;
  reason: "authority_guardrails_offline_only_real_evidence_required";
  lanes: {
    capabilityStates: "implemented_offline_controlled";
    sideEffectGuard: "implemented_offline_controlled";
    tenantAuthIsolationGuard: "implemented_offline_controlled";
    algedonicChannel: "implemented_offline_controlled";
    auditLedger: "implemented_offline_controlled";
  };
};

export type Gate2ManualReviewPolicy = {
  requiredForCriticalTransition: true;
  executorAuditorSeparated: true;
  automaticAuthorityGranted: false;
};

export type Gate2OverridePolicy = {
  overrideRequestRecordType: "OVERRIDE_REQUEST";
  overrideDecisionRecordType: "OVERRIDE_DECISION";
  unauditedOverrideBlockedBy: "AG-NG-022";
  automaticAuthorityGranted: false;
};
