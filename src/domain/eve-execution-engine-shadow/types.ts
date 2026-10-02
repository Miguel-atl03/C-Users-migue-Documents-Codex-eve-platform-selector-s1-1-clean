export type ExecutionEngineShadowMode = "execution_engine_shadow";

export type ExecutionEngineQueryType =
  | "resolve_activity_runtime_run"
  | "resolve_interaction_instance"
  | "resolve_response_ingest"
  | "resolve_evidence_item"
  | "resolve_canonical_variable_record"
  | "resolve_structural_candidate_record"
  | "validate_record_schema"
  | "validate_required_fields"
  | "validate_lifecycle"
  | "validate_source_role"
  | "validate_evidence_trace"
  | "validate_canonical_variable_dependency"
  | "validate_structural_candidate_dependency"
  | "validate_gate_dependency"
  | "validate_documentary_satisfaction"
  | "validate_no_runtime_authority"
  | "validate_no_registry_write"
  | "validate_no_diagnosis"
  | "validate_no_export"
  | "detect_execution_engine_gap";

export type ExecutionEngineReadinessState =
  | "execution_engine_lookup_ready"
  | "execution_engine_lookup_not_found"
  | "execution_engine_reference_valid"
  | "execution_engine_reference_missing"
  | "execution_engine_gap_detected"
  | "record_schema_valid"
  | "record_schema_missing_source"
  | "required_fields_valid"
  | "required_fields_missing_source"
  | "lifecycle_valid"
  | "lifecycle_missing_source"
  | "source_role_valid"
  | "source_role_mismatch"
  | "evidence_trace_valid"
  | "evidence_trace_missing"
  | "canonical_variable_dependency_valid"
  | "canonical_variable_dependency_missing"
  | "structural_candidate_dependency_valid"
  | "structural_candidate_dependency_missing"
  | "gate_dependency_valid"
  | "gate_dependency_missing"
  | "documentary_satisfaction_confirmed"
  | "documentary_satisfaction_broken"
  | "no_runtime_authority_confirmed"
  | "no_registry_write_confirmed"
  | "no_diagnosis_confirmed"
  | "no_export_confirmed"
  | "manual_review_required"
  | "reentry_required";

export type ExecutionEngineEvaluationInput = {
  mode: ExecutionEngineShadowMode;
  queryType: ExecutionEngineQueryType;
  module?: string;
  recordType?: string;
  recordId?: string;
  ruleId?: string;
  fieldName?: string;
  sourceDocumentId?: string;
  sourceTrace?: string[];
  evidenceRefs?: string[];
  requestedOutputType?: string;
  context?: Record<string, unknown>;
};

export type ExecutionEngineSafetyFlags = {
  canBlockUserFlow: boolean;
  canModifyPayload: boolean;
  canWriteRegistry: boolean;
  canModifyCatalog: boolean;
  canTriggerRuntime: boolean;
  canTriggerDiagnosis: boolean;
  canTriggerExport: boolean;
  canExecuteSql: boolean;
  canWriteSupabase: boolean;
  canConnectEveBrain: boolean;
  runtimeAuthority: boolean;
};

export type ExecutionEngineDocumentarySatisfaction = {
  status: "satisfactory" | "unsatisfactory";
  modulesChecked: number;
  modulesExpected: number;
  atomicRulesChecked: number;
  atomicRulesExpected: number;
  failureGuardsChecked: number;
  failureGuardsExpected: number;
  integrationRulesChecked: number;
  integrationRulesExpected: number;
  sourceToTargetMappingsChecked: number;
  sourceToTargetMappingsExpected: number;
  qaControlsChecked: number;
  qaControlsExpected: number;
  schemaFieldsChecked: number;
  schemaFieldsExpected: number;
  accepted: number;
  rejected: number;
  pendingSourceProof: number;
  pendingLocatorPrecision: number;
  sourceRoleMismatch: number;
  sourceMissing: number;
  wiringRiskDetected: number;
  materialDifference: boolean;
  d1DirectProofScr: boolean;
  d8PresentForScr: boolean;
  stm6016Covers: string[];
};

export type ExecutionEngineResolvedEntity = {
  entityKind: string;
  id: string;
  module?: string;
  recordType?: string;
  recordId?: string;
  ruleId?: string;
  fieldName?: string;
  sourceDocuments?: string[];
  sourceTrace?: string[];
  evidenceRefs?: string[];
  notes?: string[];
};

export type ExecutionEngineEvaluationResult = {
  version: string;
  mode: ExecutionEngineShadowMode;
  chipId: string;
  queryType: ExecutionEngineQueryType;
  readinessState: ExecutionEngineReadinessState;
  resolved: boolean;
  resolvedEntity: ExecutionEngineResolvedEntity | null;
  missingReferences: string[];
  gapFlags: string[];
  sourceTrace: string[];
  evidenceRefs: string[];
  allowedActions: string[];
  blockedActions: string[];
  requiredInputs: string[];
  findings: string[];
  auditEvents: string[];
  safetyFlags: ExecutionEngineSafetyFlags;
  documentarySatisfaction: ExecutionEngineDocumentarySatisfaction;
};

export type ExecutionEngineFixture = {
  fixtureId: string;
  input: ExecutionEngineEvaluationInput;
  expectedReadinessState: ExecutionEngineReadinessState;
  expectedResolved: boolean;
  expectedEntityKind: string;
  expectedGapFlags: string[];
  expectedRuleIdsOrSourceTrace?: string[];
};
