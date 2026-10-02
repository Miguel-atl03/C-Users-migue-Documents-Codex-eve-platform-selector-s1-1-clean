export type ParallelProductionInterfaceShadowMode = "parallel_production_interface_shadow";

export type ParallelProductionInterfaceQueryType =
  | "resolve_scr_payload"
  | "resolve_evidence_bundle_payload"
  | "resolve_mdsb_payload"
  | "resolve_mmabp_ir_candidate"
  | "resolve_registry_candidate"
  | "resolve_export_blockers"
  | "validate_payload_schema"
  | "validate_source_proof"
  | "validate_export_blocker"
  | "validate_exb_031"
  | "validate_registry_candidate_boundary"
  | "validate_ir_candidate_boundary"
  | "validate_no_export"
  | "validate_no_registry_write"
  | "validate_no_parallel_production"
  | "validate_no_runtime_authority"
  | "validate_documentary_satisfaction"
  | "detect_parallel_production_interface_gap";

export type ParallelProductionInterfaceReadinessState =
  | "ppi_lookup_ready"
  | "ppi_lookup_not_found"
  | "ppi_reference_valid"
  | "ppi_reference_missing"
  | "ppi_gap_detected"
  | "payload_schema_valid"
  | "payload_schema_missing_source"
  | "source_proof_valid"
  | "source_proof_missing"
  | "export_blocker_valid"
  | "export_blocker_missing"
  | "exb_031_valid"
  | "exb_031_violation_detected"
  | "registry_candidate_boundary_confirmed"
  | "registry_candidate_boundary_broken"
  | "ir_candidate_boundary_confirmed"
  | "ir_candidate_boundary_broken"
  | "no_export_confirmed"
  | "no_registry_write_confirmed"
  | "no_parallel_production_confirmed"
  | "no_runtime_authority_confirmed"
  | "documentary_satisfaction_confirmed"
  | "documentary_satisfaction_broken"
  | "manual_review_required"
  | "reentry_required";

export type ParallelProductionInterfaceEvaluationInput = {
  mode: ParallelProductionInterfaceShadowMode;
  queryType: ParallelProductionInterfaceQueryType;
  module?: string;
  payloadType?: string;
  payloadId?: string;
  ruleId?: string;
  blockerCode?: string;
  fieldName?: string;
  sourceDocumentId?: string;
  sourceTrace?: string[];
  evidenceRefs?: string[];
  requestedOutputType?: string;
  context?: Record<string, unknown>;
};

export type ParallelProductionInterfaceSafetyFlags = {
  canBlockProductiveUserFlow: boolean;
  canModifyPayload: boolean;
  canWriteRegistry: boolean;
  canTriggerExport: boolean;
  canTriggerParallelProduction: boolean;
  canTriggerRuntime: boolean;
  canTriggerDiagnosis: boolean;
  canExecuteSql: boolean;
  canWriteSupabase: boolean;
  canConnectEveBrain: boolean;
  runtimeAuthority: boolean;
};

export type ParallelProductionInterfaceDocumentarySatisfaction = {
  status: "satisfactory" | "unsatisfactory";
  sourceProofMatrixRowsChecked: number;
  sourceProofMatrixRowsExpected: number;
  sourceToTargetMappingsChecked: number;
  sourceToTargetMappingsExpected: number;
  exbBlockersChecked: number;
  exbBlockersExpected: number;
  exb031Checked: boolean;
  exportBlockerVectorsChecked: number;
  exportBlockerVectorsExpected: number;
  certificationClaimsChecked: number;
  certificationClaimsExpected: number;
  qaRows: number;
  accepted: number;
  rejected: number;
  pendingSourceProof: number;
  pendingLocatorPrecision: number;
  certificationClaimUnverified: number;
  materialDifference: boolean;
};

export type ParallelProductionInterfaceBlockerEvaluation = {
  blockerCode?: string;
  conditionMatched: boolean;
  blocked: boolean;
  reason?: string;
  evaluatedAsShadowOnly: boolean;
};

export type ParallelProductionInterfaceResolvedEntity = {
  entityKind: string;
  id: string;
  module?: string;
  payloadType?: string;
  payloadId?: string;
  ruleId?: string;
  blockerCode?: string;
  sourceDocuments?: string[];
  sourceTrace?: string[];
  evidenceRefs?: string[];
  notes?: string[];
};

export type ParallelProductionInterfaceEvaluationResult = {
  version: string;
  mode: ParallelProductionInterfaceShadowMode;
  chipId: string;
  queryType: ParallelProductionInterfaceQueryType;
  readinessState: ParallelProductionInterfaceReadinessState;
  resolved: boolean;
  resolvedEntity: ParallelProductionInterfaceResolvedEntity | null;
  missingReferences: string[];
  gapFlags: string[];
  sourceTrace: string[];
  evidenceRefs: string[];
  allowedActions: string[];
  blockedActions: string[];
  requiredInputs: string[];
  findings: string[];
  auditEvents: string[];
  safetyFlags: ParallelProductionInterfaceSafetyFlags;
  documentarySatisfaction: ParallelProductionInterfaceDocumentarySatisfaction;
  blockerEvaluation: ParallelProductionInterfaceBlockerEvaluation;
};

export type ParallelProductionInterfaceFixture = {
  fixtureId: string;
  input: ParallelProductionInterfaceEvaluationInput;
  expectedReadinessState: ParallelProductionInterfaceReadinessState;
  expectedResolved: boolean;
  expectedEntityKind: string;
  expectedGapFlags: string[];
  expectedBlockedActions: string[];
};
