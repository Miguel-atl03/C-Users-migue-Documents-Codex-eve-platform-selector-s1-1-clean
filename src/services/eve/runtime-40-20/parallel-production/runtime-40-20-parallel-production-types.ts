import type { EVEProductionReadinessState } from "../gates-readiness/runtime-40-20-gates-readiness-types";
import type { EVEConsultantReviewPacketDTO } from "../consultant-result/runtime-40-20-consultant-result-types";

export type EVEParallelProductionScope = {
  tenant_id: string;
  case_id: string;
  role_id: string;
  activity_id: string;
  run_id: string;
  consultant_user_id: string;
  correlation_id: string;
  idempotency_key: string;
};

export type EVEParallelProductionReadinessEligibility =
  | "export_preparation_allowed_local"
  | "export_preparation_allowed_with_flags_local"
  | "export_preparation_blocked"
  | "export_preparation_blocked_reentry_required"
  | "export_preparation_blocked_manual_review_required";

export interface EVEParallelProductionRequest {
  scope: EVEParallelProductionScope;
}

export interface EVESceneCanonicalRecordPatch {
  packet_ref: string;
  tenant_id: string;
  case_id: string;
  run_id: string;
  activity_ref: string;
  source_evidence_refs: string[];
  canonical_variable_refs: string[];
  readiness_state_snapshot: EVEProductionReadinessState;
  source_trace: Record<string, unknown>;
  created_local: true;
}

export interface EVEEvidenceBundlePatch {
  evidence_bundle_ref: string;
  evidence_items: Array<{
    evidence_item_id: string;
    evidence_type: string | null;
    source_ref: string | null;
    summary_internal: string | null;
  }>;
  answer_subfield_summaries: Array<{
    subfield_response_id: string;
    question_ref: string | null;
    subfield_ref: string | null;
  }>;
  canonical_variable_summaries: Array<{
    canonical_variable_record_id: string;
    variable_code: string | null;
  }>;
  readiness_gap_summaries: Array<{
    readiness_gap_record_id: string;
    gap_code: string | null;
    severity: string | null;
  }>;
  audit_refs: string[];
  source_trace: Record<string, unknown>;
  created_local: true;
}

export interface EVEMMABPDesignSourceBundlePatch {
  mdsb_patch_ref: string;
  source_objects_candidate_refs: string[];
  process_state_candidate_refs: string[];
  conformance_check_inputs: Record<string, unknown>;
  consistency_check_inputs: Record<string, unknown>;
  gates_summary_refs: string[];
  readiness_summary: {
    readiness_state: EVEProductionReadinessState;
    dominant_gate: string | null;
    manual_review_required: boolean;
    reentry_required: boolean;
  };
  source_trace: Record<string, unknown>;
  created_local: true;
}

export interface EVEParallelExportPayloadLocal {
  payload_ref: string;
  tenant_id: string;
  case_id: string;
  run_id: string;
  scr_patch: EVESceneCanonicalRecordPatch;
  evidence_bundle_patch: EVEEvidenceBundlePatch;
  mdsb_patch: EVEMMABPDesignSourceBundlePatch;
  readiness_state: EVEProductionReadinessState;
  requires_consultant_review: boolean;
  production_export_allowed: false;
  external_export_executed: false;
  source_trace: Record<string, unknown>;
}

export interface EVEParallelProductionRehearsalResult {
  rehearsal_ref: string;
  eligibility: EVEParallelProductionReadinessEligibility;
  export_preparation_allowed: boolean;
  scr_patch: EVESceneCanonicalRecordPatch;
  evidence_bundle_patch: EVEEvidenceBundlePatch;
  mdsb_patch: EVEMMABPDesignSourceBundlePatch;
  parallel_export_payload: EVEParallelExportPayloadLocal | null;
  rehearsal_blocked_result: {
    blocked: true;
    reason: string;
    readiness_state: EVEProductionReadinessState;
  } | null;
  requires_consultant_review: boolean;
  production_export_allowed: false;
  external_export_executed: false;
  produccion_paralela_started: false;
  activation_allowed: false;
  rehearsal_safe: true;
}

export interface EVEParallelProductionAuditResult {
  audit_ref: string;
  scope_ref: {
    tenant_id: string;
    case_id: string;
    run_id: string;
  };
  eligibility: EVEParallelProductionReadinessEligibility;
  patches_created: {
    scr_patch: boolean;
    evidence_bundle_patch: boolean;
    mdsb_patch: boolean;
    parallel_export_payload: boolean;
  };
  boundary_flags: EVEParallelProductionBoundaryFlags;
  created_at: string;
}

export interface EVEParallelProductionBoundaryFlags {
  diagnosis_final_created: false;
  diagnostic_label_created: false;
  pathology_classification_created: false;
  ahe_vsm_diagnostic_output_created: false;
  mmabp_final_assessment_auto_created: false;
  registry_final_created: false;
  ir_final_created: false;
  diagram_export_created: false;
  export_real_created: false;
  produccion_paralela_started: false;
  qa_green_real_created: false;
  activation_allowed: false;
  production_supabase_touched: false;
}

export interface EVEParallelProductionDependencyBlockedResponse {
  status: "dependency_blocked";
  dependency_blocked: true;
  consultant_safe_message: string;
  correlation_id: string;
  scope_ref: {
    tenant_id: string;
    case_id: string;
    run_id: string;
  };
  prepared_only: true;
}

export interface EVEParallelProductionLocalAdapterStatus {
  enabled: boolean;
  dependency_blocked: boolean;
  local_runtime_flag_required: true;
  local_gates_readiness_flag_required: true;
  local_client_safe_result_flag_required: true;
  local_consultant_review_packet_flag_required: true;
  local_parallel_production_flag_required: true;
  local_target_available: boolean;
  blocked_reason: string | null;
}

export interface EVEParallelProductionSmokeResult {
  dictamen: "EVE_PRODUCTION_ACTIVATION_P8_CONTROLLED_PARALLEL_PRODUCTION_LOCAL_V1";
  generated_at: string;
  scope: EVEParallelProductionScope;
  scr_patch_created: boolean;
  evidence_bundle_patch_created: boolean;
  mdsb_patch_created: boolean;
  parallel_export_payload_local_created: boolean;
  readiness_state: EVEProductionReadinessState | null;
  requires_consultant_review: boolean;
  production_export_allowed: false;
  external_export_executed: false;
  diagnosis_final_created: false;
  registry_final_created: false;
  ir_final_created: false;
  export_real_created: false;
  produccion_paralela_started: false;
  qa_green_real_created: false;
  activation_allowed: false;
  production_supabase_touched: false;
}

export type EVEParallelProductionScopeBlockingReason =
  | "missing_tenant_id"
  | "missing_case_id"
  | "missing_role_id"
  | "missing_activity_id"
  | "missing_run_id"
  | "missing_consultant_user_id"
  | "missing_correlation_id"
  | "missing_idempotency_key";

export interface EVEParallelProductionScopeValidationResult {
  valid: boolean;
  scope: EVEParallelProductionScope;
  blocking_reasons: EVEParallelProductionScopeBlockingReason[];
}

export interface EVEParallelProductionBuildInput {
  scope: EVEParallelProductionScope;
  consultant_packet: EVEConsultantReviewPacketDTO;
  readiness_state: EVEProductionReadinessState;
}

export const EVE_PARALLEL_PRODUCTION_FORBIDDEN_FIELDS = [
  "diagnosis_final",
  "diagnostic_label",
  "pathology_classification",
  "ahe_diagnostic_output",
  "vsm_diagnostic_output",
  "mmabp_final_assessment",
  "registry_final",
  "ir_final",
  "diagram_export",
  "export_payload_real",
  "production_activation_allowed",
  "qa_green_real",
] as const;
