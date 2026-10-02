import type {
  RuntimeInteractionSourceTraceViewContract,
  RuntimeInteractionViewModel,
} from "../interaction-renderer/runtime-40-20-interaction-renderer-types";

export type RuntimeResponseIngestStatus =
  | "ingest_candidate_ready"
  | "blocked_renderer_not_ready"
  | "blocked_missing_response_payload_source"
  | "blocked_missing_response_source"
  | "blocked_cross_phase_dependency_detected"
  | "blocked_missing_source_traceability"
  | "blocked_missing_epistemic_policy"
  | "blocked_missing_idempotency_key"
  | "blocked_missing_revision_number"
  | "blocked_unknown_subfield"
  | "blocked_missing_subfield_structure"
  | "blocked_subfield_collapse_detected"
  | "blocked_missing_b0q01_required_subfield"
  | "blocked_epistemic_violation"
  | "blocked_missing_provenance"
  | "blocked_missing_confirmation_or_correction_reference"
  | "blocked_evidence_from_absence"
  | "blocked_ai_inference_as_hard_evidence"
  | "blocked_c09_route_missing"
  | "blocked_receiver_feedback_inference"
  | "blocked_validation_contract_incomplete"
  | "blocked_audit_trail_real_creation_attempt"
  | "blocked_value_type_mismatch"
  | "blocked_persistence_boundary_violation"
  | "blocked_service_role_boundary_violation"
  | "blocked_missing_supersedes_reference"
  | "manual_review_required";

export type RuntimeResponseConfirmationStatus =
  | "pending_confirmation"
  | "confirmed"
  | "corrected"
  | "not_applicable";

export type RuntimeResponseCorrectionStatus =
  | "no_correction"
  | "correction_pending"
  | "correction_applied";

export type RuntimeResponseProvenanceType =
  | "user_answer"
  | "user_confirmation"
  | "user_correction"
  | "ai_suggestion"
  | "canonical_derivation"
  | "internal_calculation";

export type RuntimeResponseEpistemicStatus =
  | "captured_user_evidence"
  | "ai_inferred_unconfirmed"
  | "user_confirmed_suggestion"
  | "user_corrected_evidence"
  | "canonical_derivation"
  | "internal_calculated";

export type RuntimeResponseValidationBlockingReason =
  | "missing_idempotency_key"
  | "missing_response_revision_number"
  | "unknown_subfield"
  | "invalid_epistemic_status"
  | "invalid_provenance_type"
  | "confirmation_missing_confirmation_reference"
  | "correction_missing_supersedes_or_correction_reference"
  | "missing_source_trace"
  | "value_incompatible_with_expected_type";

export type RuntimeExpectedValueType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "enum"
  | "array"
  | "object"
  | "unknown";

export interface RuntimeResponseValidationBlockingDecision {
  validation_passed: boolean;
  blocking_reasons: RuntimeResponseValidationBlockingReason[];
  blocked_before_candidate_creation: boolean;
  blocked_before_evidence_candidate_creation: boolean;
  real_response_persisted: false;
  real_subfield_response_created: false;
  real_evidence_item_created: false;
}

export type RuntimeResponseAuditAction =
  | "response_ingest_candidate_created"
  | "response_ingest_blocked"
  | "subfield_response_candidate_created"
  | "evidence_item_candidate_created"
  | "response_revision_registered"
  | "correction_supersedes_previous"
  | "epistemic_violation_blocked"
  | "idempotency_replay_detected"
  | "validation_blocked"
  | "value_type_mismatch_blocked"
  | "missing_source_trace_blocked";

export interface RuntimeResponseAuditTrailCandidate {
  audit_candidate_ref: string;
  audit_action: RuntimeResponseAuditAction;
  case_id: string;
  runtime_interaction_id?: string;
  interaction_instance_id_preview?: string;
  idempotency_key?: string;
  response_revision_number?: number;
  blocking_reasons: RuntimeResponseValidationBlockingReason[];
  source_trace?: Record<string, unknown>;
  real_audit_trail_created: false;
  supabase_touched: false;
  sql_executed: false;
  endpoint_created: false;
}

export interface RuntimePhase6Phase5InputBoundary {
  interaction_view_model_consumed: boolean;
  phase6_payload_preview_consumed: boolean;
  interaction_instance_id_preview_used_as_preview_only: boolean;
  interaction_instance_id_real_created: false;
  preview_converted_to_authorized_payload: boolean;
  renderer_modified: false;
  ui_modified: false;
  visible_text_reinterpreted_as_answer: false;
  user_visible_copy_reinterpreted_as_answer: false;
  response_invented_from_copy: false;
}

export interface RuntimePhase6Phase7Boundary {
  canonical_variable_record_real_created: false;
  canonical_variable_service_executed: false;
  branching_engine_executed: false;
  critical_route_gate_executed: false;
  readiness_engine_executed: false;
  evidence_subfield_ready_for_future_phase: boolean;
  mapping_refs_preserved_when_present: boolean;
  canonical_variable_outside_phase6_closeout: true;
}

export interface RuntimePhase6PersistenceBoundary {
  local_candidate_mode: true;
  db_write_authorized: false;
  real_response_record_created: false;
  runtime_subfield_response_real_created: false;
  evidence_item_real_created: false;
  supabase_touch_authorized: false;
  sql_execution_authorized: false;
  endpoint_creation_authorized: false;
  service_role_used: false;
  service_role_used_in_client: false;
}

export interface RuntimeSubfieldAnswerPayload {
  subfield_name: string;
  value: unknown;
  expected_type?: string;
  required?: boolean;
  epistemic_status: RuntimeResponseEpistemicStatus;
  provenance_type: RuntimeResponseProvenanceType;
  confirmation_reference?: string;
  correction_reference?: string;
  derived_from_refs?: string[];
  normalized_value?: unknown;
  confidence?: number | string;
  source_ref?: string;
  evidence_candidate_requested?: boolean;
  hard_evidence_requested?: boolean;
  pending_microconfirmation?: boolean;
  review_gap?: boolean;
  source_trace?: Record<string, unknown>;
}

export interface RuntimeEvidenceBoundaryDecision {
  response_absent_is_not_evidence: true;
  ai_inference_unconfirmed_is_not_hard_evidence: true;
  missing_subfield_is_not_inferable_value: true;
  pending_microconfirmation_is_not_evidence: true;
  review_gap_is_not_evidence: true;
  b7_c20_no_diagnosis: true;
  b7_c20_no_ir: true;
  b7_c20_no_registry: true;
  b7_c20_signal_non_diagnostic_only: true;
}

export interface RuntimeC09ReceiverFeedbackBoundary {
  receiver_feedback_exists: boolean;
  receiver_feedback?: string;
  gap_flag: boolean;
  route_missing: boolean;
  feedback_source_trace?: Record<string, unknown>;
  receiver_feedback_inferred_from_satisfaction: false;
  receiver_feedback_inferred_from_ambiguous_comment: false;
  route_missing_preserved_when_no_canonical_route: boolean;
  readiness_gap_record_real_created: false;
  critical_route_gate_executed: false;
  readiness_engine_executed: false;
}

export interface RuntimeB0Q01SubfieldPersistenceContract {
  action_verb_present: boolean;
  input_or_object_present: boolean;
  procedure_or_standard_present: boolean;
  output_or_result_present: boolean;
  user_correction_note_present: boolean;
  subfields_persisted_separately_as_candidates: boolean;
  single_textbox_used: false;
  missing_subfield_inferred: false;
  captured_user_evidence_created_without_confirmation: false;
}

export interface RuntimeConfirmationCorrectionIntakeDecision {
  confirmation_reference_required: boolean;
  confirmation_reference_present: boolean;
  correction_reference_required: boolean;
  correction_reference_present: boolean;
  supersedes_response_ref_present: boolean;
  user_confirmation_accepted: boolean;
  user_correction_accepted: boolean;
  ai_inferred_unconfirmed_remains_unconfirmed: boolean;
  correction_overrides_previous_inference_locally: boolean;
  previous_reference_preserved: boolean;
  evidence_item_real_created: false;
}

export interface RuntimeEpistemicStatusEnforcementDecision {
  epistemic_status: RuntimeResponseEpistemicStatus;
  provenance_type: RuntimeResponseProvenanceType;
  epistemic_status_allowed: boolean;
  provenance_matches_epistemic_status: boolean;
  ai_inference_elevated_to_hard_evidence: false;
  captured_user_evidence_created_without_user_answer: false;
  canonical_derivation_has_derived_from_refs: boolean;
  internal_calculated_used_as_user_answer: false;
  enforcement_status:
    | "epistemic_enforcement_passed"
    | "blocked_epistemic_violation";
}

export interface RuntimeResponseProvenanceContract {
  provenance_type: RuntimeResponseProvenanceType;
  source_ref?: string;
  source_document: string;
  source_sheet: string;
  source_row_number: number;
  raw_row: Record<string, unknown>;
  raw_row_preserved_internally: true;
  provenance_fabricated: false;
  source_trace_fabricated: false;
}

export interface RuntimeResponsePayload {
  runtime_interaction_id: string;
  interaction_instance_id_preview: string;
  case_id: string;
  run_id?: string;
  idempotency_key: string;
  response_revision_number: number;
  supersedes_response_ref?: string;
  answers: RuntimeSubfieldAnswerPayload[];
  subfield_answers: RuntimeSubfieldAnswerPayload[];
  confirmation_status: RuntimeResponseConfirmationStatus;
  correction_status: RuntimeResponseCorrectionStatus;
  source_trace: Record<string, unknown>;
  c09_receiver_feedback_boundary?: {
    receiver_feedback_exists?: boolean;
    receiver_feedback?: string;
    gap_flag?: boolean;
    route_missing?: boolean;
    has_canonical_route?: boolean;
    feedback_source_trace?: Record<string, unknown>;
    receiver_feedback_inferred_from_satisfaction?: boolean;
    receiver_feedback_inferred_from_ambiguous_comment?: boolean;
  };
}

export type RuntimeResponsePayloadContract = RuntimeResponsePayload;

export interface RuntimeResponseIdempotencyDecision {
  idempotency_key: string;
  idempotency_key_present: boolean;
  idempotency_replay_detected: boolean;
  duplicate_response_created: false;
  real_idempotency_record_created: false;
}

export interface RuntimeResponseRevisionDecision {
  response_revision_number: number;
  revision_number_present: boolean;
  supersedes_response_ref_required: boolean;
  supersedes_response_ref_present: boolean;
  correction_reference_preserved: boolean;
  previous_evidence_deleted_without_trace: false;
  advanced_recomputation_deferred: true;
}

export interface RuntimeSubfieldResponseCandidate {
  subfield_response_ref: string;
  runtime_interaction_id: string;
  interaction_instance_id_preview: string;
  subfield_name: string;
  value: unknown;
  expected_type?: string;
  required?: boolean;
  epistemic_status: RuntimeResponseEpistemicStatus;
  provenance_type: RuntimeResponseProvenanceType;
  response_revision_number: number;
  idempotency_key: string;
  source_trace: RuntimeInteractionSourceTraceViewContract;
  real_subfield_response_created: false;
  canonical_variable_record_real_created?: false;
  evidence_item_real_created?: false;
}

export interface RuntimeEvidenceItemCandidate {
  evidence_item_ref: string;
  runtime_interaction_id: string;
  interaction_instance_id_preview: string;
  subfield_name: string;
  literal_answer?: unknown;
  literal_value: unknown;
  normalized_value?: unknown;
  epistemic_status: RuntimeResponseEpistemicStatus;
  provenance_type: RuntimeResponseProvenanceType;
  confidence?: number | string;
  source_ref?: string;
  timestamp?: string;
  evidence_candidate_allowed: boolean;
  hard_evidence: boolean;
  source_trace: RuntimeInteractionSourceTraceViewContract;
  real_evidence_item_created: false;
}

export interface RuntimeResponseRevisionCandidate {
  response_revision_ref: string;
  response_revision_number: number;
  supersedes_response_ref?: string;
  revision_valid: boolean;
  reason: string;
}

export interface RuntimeIngestAuditCandidate {
  ingest_audit_ref: string;
  action: "response_ingest_candidate_created" | "response_ingest_blocked";
  idempotency_key?: string;
  response_revision_number?: number;
  runtime_interaction_id: string;
  real_audit_record_created: false;
  metadata: Record<string, unknown>;
}

export interface RuntimeResponseIngestDecision {
  decision_id: string;
  runtime_interaction_id: string;
  ingest_status: RuntimeResponseIngestStatus;
  subfield_candidates_created: number;
  evidence_candidates_created: number;
  free_inference_used: false;
  unauthorized_expansion_used: false;
  real_response_persisted: false;
}

export interface RuntimeResponseIngestNoGoCheck {
  no_go_triggered: boolean;
  blockers: string[];
  runtime_40_20_started: false;
  catalog_activated: false;
  migration_applied: false;
  supabase_touched: false;
  sql_executed: false;
  endpoint_created: false;
  real_response_persisted: false;
  real_subfield_response_created: false;
  real_evidence_item_created: false;
  real_audit_record_created: false;
  real_canonical_variable_record_created: false;
  canonical_variable_service_executed: false;
  branching_engine_executed: false;
  readiness_engine_executed: false;
  real_runtime_records_created: false;
  business_evidence_created: false;
  registry_live_db_created: false;
  ir_real_created: false;
  critical_route_gate_executed?: false;
  readiness_gap_record_real_created?: false;
  object_inventory_real_opened: false;
  f5c_real_opened: false;
  export_created: false;
  diagnosis_created: false;
  delivered_created: false;
}

export interface RuntimeResponseIngestLocalInput {
  case_id: string;
  interaction_view_model: RuntimeInteractionViewModel;
  response_payload: RuntimeResponsePayload;
  options?: {
    version?: string;
    prior_idempotency_keys?: string[];
  };
}

export interface RuntimeResponseIngestLocalResult {
  ok: boolean;
  case_id: string;
  ingest_status: RuntimeResponseIngestStatus;
  subfield_response_candidates: RuntimeSubfieldResponseCandidate[];
  evidence_item_candidates: RuntimeEvidenceItemCandidate[];
  response_revision_candidate: RuntimeResponseRevisionCandidate;
  ingest_audit_candidate: RuntimeIngestAuditCandidate;
  ingest_decision: RuntimeResponseIngestDecision;
  response_payload_contract?: RuntimeResponsePayloadContract;
  idempotency_decision?: RuntimeResponseIdempotencyDecision;
  revision_decision?: RuntimeResponseRevisionDecision;
  b0q01_subfield_persistence_contract?: RuntimeB0Q01SubfieldPersistenceContract;
  confirmation_correction_intake_decisions?: RuntimeConfirmationCorrectionIntakeDecision[];
  epistemic_enforcement_decisions?: RuntimeEpistemicStatusEnforcementDecision[];
  provenance_contracts?: RuntimeResponseProvenanceContract[];
  evidence_boundary_decision?: RuntimeEvidenceBoundaryDecision;
  c09_receiver_feedback_boundary?: RuntimeC09ReceiverFeedbackBoundary;
  validation_blocking_decision?: RuntimeResponseValidationBlockingDecision;
  response_audit_trail_candidates?: RuntimeResponseAuditTrailCandidate[];
  phase5_input_boundary?: RuntimePhase6Phase5InputBoundary;
  phase7_boundary?: RuntimePhase6Phase7Boundary;
  persistence_boundary?: RuntimePhase6PersistenceBoundary;
  no_go_check: RuntimeResponseIngestNoGoCheck;
  blocked_reason?: string;
  materiality: {
    level: "runtime_40_20_response_ingest_local_contract";
    local_only: true;
    real_response_persisted: false;
    real_evidence_created: false;
    runtime_40_20_started: false;
    next_authorization_required: true;
  };
}
