export type GateEngineShadowMode = "gate_engine_shadow";

export type GateEngineQueryType =
  | "resolve_gate"
  | "resolve_rule"
  | "validate_critical_route_gate"
  | "validate_semantic_resolution_gate"
  | "validate_process_state_timer_gate"
  | "validate_mmabp_conformance_gate"
  | "validate_mmabp_consistency_gate"
  | "validate_failure_guard"
  | "validate_atomic_rule"
  | "validate_documentary_satisfaction"
  | "validate_no_overreach"
  | "validate_no_runtime_authority"
  | "detect_gate_engine_gap";

export type GateEngineReadinessState =
  | "gate_engine_lookup_ready"
  | "gate_engine_lookup_not_found"
  | "gate_engine_reference_valid"
  | "gate_engine_reference_missing"
  | "gate_engine_gap_detected"
  | "gate_condition_valid"
  | "gate_condition_missing_source"
  | "gate_action_valid"
  | "gate_action_missing_source"
  | "gate_severity_valid"
  | "gate_severity_missing_source"
  | "documentary_satisfaction_confirmed"
  | "documentary_satisfaction_broken"
  | "no_overreach_confirmed"
  | "no_overreach_broken"
  | "manual_review_required"
  | "reentry_required";

export type GateEngineEvaluationInput = {
  mode: GateEngineShadowMode;
  queryType: GateEngineQueryType;
  gateId?: string;
  ruleId?: string;
  module?: string;
  sourceDocumentId?: string;
  condition?: string;
  action?: string;
  severity?: string;
  evidenceRefs?: string[];
  sourceTrace?: string[];
  requestedOutputType?: string;
  context?: Record<string, unknown>;
};

export type GateEngineSafetyFlags = {
  canBlockUserFlow: boolean;
  canModifyPayload: boolean;
  canWriteRegistry: boolean;
  canModifyCatalog: boolean;
  canTriggerRuntime: boolean;
  canTriggerDiagnosis: boolean;
  canTriggerExport: boolean;
  canConnectEveBrain: boolean;
  runtimeAuthority: boolean;
};

export type GateEngineDocumentarySatisfaction = {
  status: "satisfactory" | "unsatisfactory";
  companionProofsAccepted: number;
  companionProofsExpected: number;
  atomicRulesAccepted: number;
  atomicRulesExpected: number;
  mismatches: number;
  missingInChip: number;
  missingInSource: number;
  pendingSourceProof: number;
  overreachDetected: boolean;
  previousRejectedUniqueRulesRepaired: string;
  previousRejectedRecordsRepaired: string;
};

export type GateEngineResolvedEntity = {
  entityKind: string;
  id: string;
  module?: string;
  gateId?: string;
  ruleId?: string;
  sourceDocuments?: string[];
  sourceTrace?: string[];
  evidenceRefs?: string[];
  notes?: string[];
};

export type GateEngineEvaluationResult = {
  version: string;
  mode: GateEngineShadowMode;
  chipId: string;
  queryType: GateEngineQueryType;
  readinessState: GateEngineReadinessState;
  resolved: boolean;
  resolvedEntity: GateEngineResolvedEntity | null;
  missingReferences: string[];
  gapFlags: string[];
  sourceTrace: string[];
  evidenceRefs: string[];
  allowedActions: string[];
  blockedActions: string[];
  requiredInputs: string[];
  findings: string[];
  auditEvents: string[];
  safetyFlags: GateEngineSafetyFlags;
  documentarySatisfaction: GateEngineDocumentarySatisfaction;
};

export type GateEngineFixture = {
  fixtureId: string;
  input: GateEngineEvaluationInput;
  expectedReadinessState: GateEngineReadinessState;
  expectedResolved: boolean;
  expectedEntityKind: string;
  expectedGapFlags: string[];
  expectedRuleIds?: string[];
  sourceTrace?: string[];
};
