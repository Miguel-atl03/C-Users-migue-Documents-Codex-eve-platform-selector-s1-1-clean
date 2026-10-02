export interface EVEProductionRuntimeScope {
  tenant_id: string;
  case_id: string;
  role_id: string;
  activity_id: string;
  run_id: string;
  client_session_id: string;
  correlation_id: string;
  idempotency_key: string;
}

export interface EVEProductionRuntimeSessionRequest {
  scope: EVEProductionRuntimeScope;
  catalog_version_id: string;
  state?: "draft" | "active" | "in_progress";
  created_by?: string | null;
}

export interface EVEProductionRuntimeRunRequest {
  scope: EVEProductionRuntimeScope;
  role_runtime_session_id: string;
  catalog_version_id: string;
  state?: "initialized" | "active_base_capture";
  created_by?: string | null;
}

export interface EVEProductionRuntimeInteractionRequest {
  scope: EVEProductionRuntimeScope;
  runtime_interaction_id: string;
  state?: "shown" | "answered";
  created_by?: string | null;
}

export interface EVEProductionRuntimeAnswerSubfield {
  subfield_name: string;
  value: unknown;
  epistemic_status:
    | "captured_user_evidence"
    | "ai_inferred_unconfirmed"
    | "user_confirmed_suggestion"
    | "user_corrected_evidence"
    | "canonical_derivation"
    | "internal_calculated";
  provenance_type: string;
  confidence?: number | null;
}

export interface EVEProductionRuntimeAnswerIngestRequest {
  scope: EVEProductionRuntimeScope;
  interaction_instance_id: string;
  subfields: EVEProductionRuntimeAnswerSubfield[];
  created_by?: string | null;
}

export interface EVEProductionRuntimeEvidenceResult {
  evidence_item_created: boolean;
  evidence_item_id: string | null;
}

export interface EVEProductionRuntimeCanonicalVariableResult {
  canonical_variable_record_created: boolean;
  canonical_variable_record_id: string | null;
}

export interface EVEProductionRuntimeGapResult {
  readiness_gap_record_created: boolean;
  readiness_gap_record_id: string | null;
}

export interface EVEProductionRuntimeAuditResult {
  runtime_audit_trail_created: boolean;
  runtime_audit_trail_id: string | null;
}

export interface EVEProductionRuntimeLocalSmokeResult {
  role_runtime_session_created: boolean;
  activity_runtime_run_created: boolean;
  runtime_interaction_instance_created: boolean;
  runtime_subfield_response_created: boolean;
  evidence_item_created: boolean;
  canonical_variable_record_created: boolean;
  readiness_gap_record_created: boolean;
  runtime_audit_trail_created: boolean;
  readiness_decision_record_created: false;
  gates_real_executed: false;
  diagnosis_created: false;
  export_real_created: false;
  produccion_paralela_started: false;
  activation_allowed: false;
}

export type EVEProductionRuntimeScopeBlockingReason =
  | "missing_tenant_id"
  | "missing_case_id"
  | "missing_role_id"
  | "missing_activity_id"
  | "missing_run_id"
  | "missing_client_session_id"
  | "missing_correlation_id"
  | "missing_idempotency_key";

export interface EVEProductionRuntimeScopeValidationResult {
  valid: boolean;
  scope: EVEProductionRuntimeScope;
  blocking_reasons: EVEProductionRuntimeScopeBlockingReason[];
}
