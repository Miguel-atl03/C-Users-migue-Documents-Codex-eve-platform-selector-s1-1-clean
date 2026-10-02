import type { EVEProductionReadinessState } from "../gates-readiness/runtime-40-20-gates-readiness-types";
import type { EVEClientSafeResultDTO } from "../client-result/runtime-40-20-client-result-types";

export type EVEConsultantReviewPacketScope = {
  tenant_id: string;
  case_id: string;
  role_id: string;
  activity_id: string;
  run_id: string;
  consultant_user_id: string;
  correlation_id: string;
  idempotency_key: string;
};

export type EVEConsultantReviewState =
  | "ready_for_consultant_review"
  | "consultant_review_required_with_flags"
  | "blocked_requires_review"
  | "reentry_required_before_consultant_close"
  | "manual_review_required";

export interface EVEConsultantReviewPacketRequest {
  scope: EVEConsultantReviewPacketScope;
}

export interface EVEConsultantSessionSummary {
  tenant_id: string;
  case_id: string;
  role_id: string;
  role_runtime_session_id: string | null;
  session_status: string | null;
  correlation_id: string;
}

export interface EVEConsultantActivitySummary {
  activity_id: string;
  run_id: string;
  activity_runtime_run_id: string | null;
  run_status: string | null;
  primary_activity: boolean;
}

export interface EVEConsultantAnswerSubfieldSummary {
  interaction_instance_id: string;
  subfield_response_id: string;
  question_ref: string | null;
  subfield_ref: string | null;
  captured_value: unknown;
  provenance: string | null;
}

export interface EVEConsultantEvidenceSummary {
  evidence_item_id: string;
  evidence_type: string | null;
  source_ref: string | null;
  summary_internal: string | null;
  linked_variable_refs: string[];
}

export interface EVEConsultantCanonicalVariableSummary {
  canonical_variable_record_id: string;
  variable_code: string | null;
  variable_value: unknown;
  provenance: string | null;
  confidence: string | null;
}

export interface EVEConsultantReadinessGapSummary {
  readiness_gap_record_id: string;
  gap_code: string | null;
  status: string | null;
  severity: string | null;
  summary_internal: string | null;
}

export interface EVEConsultantGateSummary {
  gate_code: string;
  gate_kind: "critical_route" | "semantic" | "process_state_timer";
  status: string;
  summary_internal: string | null;
  event_id: string | null;
}

export interface EVEConsultantReadinessDecisionSummary {
  readiness_decision_record_id: string;
  readiness_state: EVEProductionReadinessState;
  consultant_review_state: EVEConsultantReviewState;
  dominant_gate: string | null;
  manual_review_required: boolean;
  reentry_required: boolean;
  reason: string | null;
}

export interface EVEConsultantManualReviewSummary {
  manual_review_required: boolean;
  ready_with_flags: boolean;
}

export interface EVEConsultantReentrySummary {
  reentry_required: boolean;
  reentry_target: string | null;
}

export interface EVEConsultantAuditTrailSummary {
  audit_trail_id: string;
  object_type: string | null;
  object_id: string | null;
  action: string | null;
  actor_type: string | null;
  created_at: string | null;
}

export interface EVEConsultantActionSummary {
  action_kind: "review_packet_assembled" | "await_consultant_close";
  label: string;
  enabled: boolean;
}

export interface EVEConsultantReviewPacketDTO {
  packet_ref: string;
  session_summary: EVEConsultantSessionSummary;
  activity_summary: EVEConsultantActivitySummary;
  answers_and_subfields: EVEConsultantAnswerSubfieldSummary[];
  evidence_items: EVEConsultantEvidenceSummary[];
  canonical_variables: EVEConsultantCanonicalVariableSummary[];
  readiness_gaps: EVEConsultantReadinessGapSummary[];
  gate_summaries: EVEConsultantGateSummary[];
  readiness_decision: EVEConsultantReadinessDecisionSummary;
  manual_review: EVEConsultantManualReviewSummary;
  reentry: EVEConsultantReentrySummary;
  client_safe_result: EVEClientSafeResultDTO | Record<string, never>;
  audit_trail: EVEConsultantAuditTrailSummary[];
  consultant_actions: EVEConsultantActionSummary[];
  packet_safe: true;
}

export interface EVEConsultantReviewPacketDependencyBlockedResponse {
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

export interface EVEConsultantReviewPacketLocalAdapterStatus {
  enabled: boolean;
  dependency_blocked: boolean;
  local_runtime_flag_required: true;
  local_gates_readiness_flag_required: true;
  local_client_safe_result_flag_required: true;
  local_consultant_review_packet_flag_required: true;
  local_target_available: boolean;
  blocked_reason: string | null;
}

export interface EVEConsultantReviewPacketSmokeResult {
  dictamen: "EVE_PRODUCTION_ACTIVATION_P7_CONSULTANT_REVIEW_PACKET_LOCAL_V1";
  generated_at: string;
  scope: EVEConsultantReviewPacketScope;
  consultant_review_packet_created: boolean;
  session_summary_present: boolean;
  activity_summary_present: boolean;
  evidence_present: boolean;
  canonical_variables_present: boolean;
  readiness_decision_present: boolean;
  audit_trail_present: boolean;
  diagnosis_final_auto_created: false;
  export_real_created: false;
  produccion_paralela_started: false;
  qa_green_real_created: false;
  activation_allowed: false;
  production_supabase_touched: false;
}

export type EVEConsultantReviewPacketScopeBlockingReason =
  | "missing_tenant_id"
  | "missing_case_id"
  | "missing_role_id"
  | "missing_activity_id"
  | "missing_run_id"
  | "missing_consultant_user_id"
  | "missing_correlation_id"
  | "missing_idempotency_key";

export interface EVEConsultantReviewPacketScopeValidationResult {
  valid: boolean;
  scope: EVEConsultantReviewPacketScope;
  blocking_reasons: EVEConsultantReviewPacketScopeBlockingReason[];
}

export const EVE_CONSULTANT_REVIEW_PACKET_FORBIDDEN_FIELDS = [
  "diagnosis_final",
  "diagnostic_label",
  "pathology_classification",
  "ahe_diagnostic_output",
  "vsm_diagnostic_output",
  "mmabp_final_assessment",
  "registry_final",
  "ir_final",
  "export_payload_real",
  "parallel_production_started",
  "production_activation_allowed",
  "qa_green_real",
] as const;
