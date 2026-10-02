import type {
  RuntimeEvidenceItemCandidate,
  RuntimeResponseEpistemicStatus,
  RuntimeResponseIngestLocalResult,
  RuntimeResponseProvenanceType,
  RuntimeSubfieldResponseCandidate,
} from "../response-ingest/runtime-40-20-response-ingest-types";
import type { RuntimeCanonicalVariableMapCandidate } from "../catalog-canonicalization/runtime-40-20-catalog-canonicalization-types";

export type RuntimeCanonicalVariableServiceStatus =
  | "canonical_variable_candidates_ready"
  | "blocked_ingest_not_ready"
  | "blocked_missing_canonical_variable_mapping"
  | "blocked_missing_explicit_mapping"
  | "blocked_missing_source_trace"
  | "blocked_similarity_mapping"
  | "blocked_free_text_variable_mapping"
  | "blocked_receiver_feedback_from_satisfaction"
  | "blocked_missing_source_evidence"
  | "blocked_missing_source_node_ref"
  | "blocked_phase6_not_closed"
  | "blocked_phase7_not_authorized"
  | "blocked_variable_from_absent_response"
  | "blocked_variable_from_missing_subfield"
  | "blocked_pending_microconfirmation_as_variable"
  | "blocked_review_gap_as_variable"
  | "blocked_ai_inference_as_hard_canonical_variable"
  | "blocked_canonical_epistemic_violation"
  | "blocked_variable_value_type_mismatch"
  | "blocked_route_closed_without_canonical_evidence"
  | "blocked_gap_hidden_as_closed_variable"
  | "blocked_receiver_feedback_from_ambiguous_comment"
  | "blocked_b7_diagnostic_transduction"
  | "blocked_gate_execution_attempt"
  | "blocked_global_recomputation_attempt"
  | "blocked_untraced_variable_overwrite"
  | "blocked_object_materialization_attempt"
  | "blocked_canonical_persistence_boundary_violation"
  | "blocked_phase8_execution_attempt"
  | "blocked_unauthorized_inference_required"
  | "blocked_epistemic_violation"
  | "manual_review_required";

export type RuntimeCanonicalVariableStatus =
  | "canonical_variable_candidate_created"
  | "canonical_variable_derivation_candidate_created"
  | "blocked_phase6_not_closed"
  | "blocked_phase7_not_authorized"
  | "blocked_missing_explicit_mapping"
  | "blocked_missing_source_trace"
  | "blocked_similarity_mapping"
  | "blocked_free_text_variable_mapping"
  | "blocked_receiver_feedback_from_satisfaction"
  | "blocked_missing_source_evidence"
  | "blocked_missing_source_node_ref"
  | "blocked_variable_from_absent_response"
  | "blocked_variable_from_missing_subfield"
  | "blocked_pending_microconfirmation_as_variable"
  | "blocked_review_gap_as_variable"
  | "blocked_ai_inference_as_hard_canonical_variable"
  | "blocked_canonical_epistemic_violation"
  | "blocked_variable_value_type_mismatch"
  | "route_status_candidate_created"
  | "gap_flag_candidate_created"
  | "c09_receiver_feedback_boundary_created"
  | "critical_route_variable_family_candidate_created"
  | "b7_non_diagnostic_guard_created"
  | "blocked_route_closed_without_canonical_evidence"
  | "blocked_gap_hidden_as_closed_variable"
  | "blocked_receiver_feedback_from_ambiguous_comment"
  | "blocked_b7_diagnostic_transduction"
  | "blocked_gate_execution_attempt"
  | "blocked_global_recomputation_attempt"
  | "blocked_untraced_variable_overwrite"
  | "blocked_object_materialization_attempt"
  | "blocked_canonical_persistence_boundary_violation"
  | "blocked_phase8_execution_attempt";

export type RuntimeCanonicalPhase7DBoundaryBlockingReason =
  | "gate_execution_attempted"
  | "semantic_resolution_event_creation_attempted"
  | "process_state_timer_event_creation_attempted"
  | "reentry_open_attempted"
  | "readiness_decision_record_creation_attempted"
  | "global_recomputation_attempted"
  | "untraced_variable_overwrite_attempted"
  | "missing_explicit_supersession_ref"
  | "invalidated_at_without_reason"
  | "object_inventory_creation_attempted"
  | "object_materialization_attempted"
  | "eve_object_definition_modification_attempted"
  | "object_materialization_event_creation_attempted"
  | "canonical_persistence_boundary_violation"
  | "supabase_touch_attempted"
  | "sql_execution_attempted"
  | "endpoint_creation_attempted"
  | "service_role_client_attempted"
  | "scene_write_attempted"
  | "mba_write_attempted"
  | "parallel_production_runtime_artifacts_write_attempted"
  | "audit_trail_real_creation_attempted"
  | "phase8_execution_attempted"
  | "trigger_evaluation_attempted"
  | "causal_score_calculation_attempted"
  | "branching_decision_creation_attempted"
  | "budget_ledger_update_attempted"
  | "causal_activity_open_attempted";

export interface RuntimeCanonicalGatePrepBoundary {
  variables_prepared_for_critical_route_gate_future: boolean;
  variables_prepared_for_mmabp_gate_engine_future: boolean;
  route_status_prepared_for_readiness_future: boolean;
  gap_flag_prepared_for_readiness_future: boolean;
  critical_route_gate_executed: false;
  mmabp_gate_engine_executed: false;
  readiness_engine_executed: false;
  readiness_decision_record_created: false;
  semantic_resolution_event_created: false;
  process_state_timer_event_created: false;
  reentry_opened: false;
  gate_prep_candidate_allowed: boolean;
  blocking_reasons: RuntimeCanonicalPhase7DBoundaryBlockingReason[];
}

export interface RuntimeCanonicalSupersessionRevisionDecision {
  response_revision_number_inherited?: number;
  supersedes_response_ref_inherited?: string;
  supersedes_canonical_variable_ref?: string;
  previous_variable_ref_preserved?: string;
  invalidated_at?: string;
  invalidation_reason?: string;
  correction_dominates_prior_inference: boolean;
  previous_variable_deleted_without_trace: false;
  global_recomputation_executed: false;
  supersession_audit_candidate_created: boolean;
  revision_candidate_allowed: boolean;
  blocking_reasons: RuntimeCanonicalPhase7DBoundaryBlockingReason[];
}

export interface RuntimeCanonicalObjectBindingReferenceBoundary {
  object_binding_status?: string;
  runtime_object_binding_ref?: string;
  protected_object_hint?: string;
  candidate_object_ref?: string;
  object_inventory_created: false;
  live_object_materialized: false;
  eve_object_definition_modified: false;
  object_materialization_event_created: false;
  object_refs_preserved_for_future_phase: boolean;
  object_binding_candidate_allowed: boolean;
  blocking_reasons: RuntimeCanonicalPhase7DBoundaryBlockingReason[];
}

export interface RuntimeCanonicalPersistenceBoundary {
  local_canonical_variable_record_candidate_mode: true;
  db_write_authorized: false;
  canonical_variable_record_real_created: false;
  supabase_touch_authorized: false;
  sql_execution_authorized: false;
  endpoint_creation_authorized: false;
  service_role_used: false;
  service_role_used_in_client: false;
  scene_write_detected: false;
  mba_write_detected: false;
  parallel_production_runtime_artifacts_write_detected: false;
  export_preview_created: false;
  persistence_boundary_passed: boolean;
  blocking_reasons: RuntimeCanonicalPhase7DBoundaryBlockingReason[];
}

export type RuntimeCanonicalVariableAuditCandidateAction =
  | "canonical_variable_candidate_created"
  | "canonical_variable_candidate_blocked"
  | "explicit_mapping_verified"
  | "mapping_similarity_blocked"
  | "source_trace_missing_blocked"
  | "route_status_assigned"
  | "gap_flag_assigned"
  | "receiver_feedback_from_satisfaction_blocked"
  | "variable_superseded"
  | "variable_invalidated"
  | "canonical_derivation_registered"
  | "gate_execution_attempt_blocked"
  | "persistence_boundary_violation_blocked"
  | "phase8_execution_attempt_blocked";

export interface RuntimeCanonicalVariableAuditActionCandidate {
  audit_candidate_ref: string;
  audit_action: RuntimeCanonicalVariableAuditCandidateAction;
  case_id: string;
  canonical_variable_candidate_ref?: string;
  runtime_interaction_id?: string;
  source_trace?: Record<string, unknown>;
  blocking_reasons: RuntimeCanonicalPhase7DBoundaryBlockingReason[];
  created_at_preview: string;
  real_runtime_audit_trail_created: false;
  supabase_touched: false;
  sql_executed: false;
  endpoint_created: false;
}

export interface RuntimeCanonicalPhase8Boundary {
  variables_ready_for_future_branching: boolean;
  gaps_ready_for_future_branching: boolean;
  route_status_ready_for_future_triggers: boolean;
  triggers_evaluated: false;
  causal_score_calculated: false;
  reentry_opened: false;
  branching_decision_created: false;
  budget_ledger_updated: false;
  branching_engine_executed: false;
  causal_activities_opened: false;
  causal_budget_exceeded: false;
  phase8_started: false;
  phase8_boundary_passed: boolean;
  blocking_reasons: RuntimeCanonicalPhase7DBoundaryBlockingReason[];
}

export type RuntimeCanonicalRouteStatus =
  | "not_applicable"
  | "open"
  | "closed"
  | "closed_with_flags"
  | "unresolved"
  | "blocked_by_missing_evidence"
  | "blocked_by_missing_canonical_route"
  | "route_missing"
  | "requires_reentry"
  | "manual_review_required"
  | "superseded";

export type RuntimeCanonicalGapType =
  | "none"
  | "missing_evidence"
  | "missing_canonical_route"
  | "contradiction"
  | "semantic_ambiguity"
  | "route_gap"
  | "manual_review"
  | "budget_exhausted"
  | "process_state_without_timer";

export type RuntimeCanonicalCriticalRouteFamilyId =
  | "B0_semantic_entry"
  | "B2_transformation_exception"
  | "B3_receiver_feedback"
  | "B7_preclassification_boundary";

export type RuntimeCanonicalRouteGapBlockingReason =
  | "route_closed_without_canonical_evidence"
  | "route_status_reason_missing"
  | "route_status_source_trace_missing"
  | "gap_hidden_as_closed_variable"
  | "gap_type_missing"
  | "gap_source_trace_missing"
  | "missing_canonical_route_closed_incorrectly"
  | "receiver_feedback_from_satisfaction_detected"
  | "receiver_feedback_from_ambiguous_comment_detected"
  | "c09_closed_by_wrong_route"
  | "b7_diagnostic_transduction_attempted"
  | "source_trace_missing_for_critical_family"
  | "gate_execution_attempted";

export interface RuntimeCanonicalRouteStatusDecision {
  route_id?: string;
  critical_route_ref?: string;
  route_status: RuntimeCanonicalRouteStatus;
  route_status_reason?: string;
  route_status_source_trace?: Record<string, unknown>;
  canonical_evidence_present: boolean;
  route_closed_without_canonical_evidence: false;
  critical_route_gate_executed: false;
  mmabp_gate_engine_executed: false;
  readiness_engine_executed: false;
  route_status_candidate_allowed: boolean;
  blocking_reasons: RuntimeCanonicalRouteGapBlockingReason[];
}

export interface RuntimeCanonicalGapFlagDecision {
  gap_flag: boolean;
  gap_type: RuntimeCanonicalGapType;
  gap_reason?: string;
  gap_source_trace?: Record<string, unknown>;
  gap_carried_forward_allowed: boolean;
  gap_hidden_as_closed_variable: false;
  readiness_engine_executed: false;
  readiness_decision_record_created: false;
  gap_candidate_allowed: boolean;
  blocking_reasons: RuntimeCanonicalRouteGapBlockingReason[];
}

export interface RuntimeCanonicalC09ReceiverFeedbackBoundary {
  receiver_feedback_exists: boolean;
  receiver_feedback?: string;
  receiver_feedback_gap_flag: boolean;
  receiver_feedback_route_missing: boolean;
  receiver_satisfaction_separated: true;
  delivery_failure_separated: true;
  cr_b3_r9_route_status?: RuntimeCanonicalRouteStatus;
  required_if_condition?: string;
  feedback_source_trace?: Record<string, unknown>;
  receiver_feedback_from_satisfaction: false;
  receiver_feedback_from_ambiguous_comment: false;
  c09_closed_by_wrong_route: false;
  route_missing_preserved_when_no_canonical_route: boolean;
  canonical_variable_candidate_allowed: boolean;
  blocking_reasons: RuntimeCanonicalRouteGapBlockingReason[];
}

export interface RuntimeCanonicalCriticalRouteVariableFamily {
  family_id: RuntimeCanonicalCriticalRouteFamilyId;
  family_name: string;
  critical_route_ref?: string;
  supported_variable_names: string[];
  source_trace_required: true;
  diagnostic_status: "non_diagnostic";
  gate_executed: false;
  canonical_variable_record_real_created: false;
  family_candidate_allowed: boolean;
  blocking_reasons: RuntimeCanonicalRouteGapBlockingReason[];
}

export interface RuntimeCanonicalB7NonDiagnosticGuard {
  b7_q39_non_diagnostic: true;
  b7_q40_non_diagnostic: true;
  c20_non_diagnostic: true;
  signal_status: "preclassification_only";
  diagnostic_status: "non_diagnostic";
  manual_review_required_if_elevation_attempted: boolean;
  transduction_blocker_active: boolean;
  vsm_ahe_final_created: false;
  moc_direct_created: false;
  ir_direct_created: false;
  registry_created: false;
  export_created: false;
  diagnosis_created: false;
  b7_diagnostic_transduction_blocked: true;
  blocking_reasons: RuntimeCanonicalRouteGapBlockingReason[];
}

export type RuntimeCanonicalVariableDerivationBlockingReason =
  | "missing_governed_evidence_or_subfield_candidate"
  | "absent_response_detected"
  | "missing_required_subfield"
  | "pending_microconfirmation_detected"
  | "review_gap_detected"
  | "missing_source_trace"
  | "epistemic_status_not_allowed_for_canonical_variable"
  | "provenance_type_mismatch"
  | "ai_inference_hardening_detected"
  | "missing_derived_from_refs"
  | "missing_derivation_rule_ref"
  | "internal_calculated_used_as_user_answer"
  | "variable_value_type_mismatch"
  | "enum_value_not_allowed"
  | "unauthorized_type_conversion_detected"
  | "unauthorized_date_parse_detected"
  | "object_or_array_collapsed_to_text"
  | "missing_value_inferred";

export type RuntimeCanonicalExpectedValueType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "enum"
  | "array"
  | "object"
  | "unknown";

export interface RuntimeCanonicalEvidenceSubfieldDerivationDecision {
  evidence_item_candidate_used: boolean;
  runtime_subfield_response_candidate_used: boolean;
  literal_answer_preserved: boolean;
  normalized_value_preserved_when_present: boolean;
  epistemic_status_preserved: boolean;
  provenance_type_preserved: boolean;
  confidence_preserved_when_present: boolean;
  source_ref_preserved: boolean;
  source_trace_preserved: boolean;
  derived_from_response_ids_preserved: boolean;
  derived_from_subfield_response_ids_preserved: boolean;
  source_evidence_item_ids_preserved: boolean;
  absent_response_used_as_variable: false;
  missing_subfield_used_as_variable: false;
  pending_microconfirmation_used_as_variable: false;
  review_gap_used_as_variable: false;
  ai_inference_hardened: false;
  canonical_variable_candidate_allowed: boolean;
  blocking_reasons: RuntimeCanonicalVariableDerivationBlockingReason[];
}

export interface RuntimeCanonicalEpistemicEnforcementDecision {
  epistemic_status: string;
  provenance_type: string;
  epistemic_basis?: string;
  derivation_rule_ref?: string;
  confirmation_reference_present: boolean;
  correction_reference_present: boolean;
  derived_from_refs_present: boolean;
  captured_user_evidence_allowed: boolean;
  user_confirmed_suggestion_allowed: boolean;
  user_corrected_evidence_allowed: boolean;
  canonical_derivation_allowed: boolean;
  internal_calculated_allowed_as_user_answer: false;
  ai_inferred_unconfirmed_hard_evidence: false;
  canonical_variable_epistemic_allowed: boolean;
  blocking_reasons: RuntimeCanonicalVariableDerivationBlockingReason[];
}

export interface RuntimeCanonicalVariableValueTypeBoundary {
  variable_value_present: boolean;
  literal_value_preserved: boolean;
  normalized_value_used_when_authorized: boolean;
  variable_type: string;
  expected_type: RuntimeCanonicalExpectedValueType;
  enum_options_present: boolean;
  value_type_compatible: boolean;
  string_to_number_auto_conversion_used: false;
  date_auto_parse_used: false;
  object_collapsed_to_text: false;
  array_collapsed_to_text: false;
  missing_value_inferred: false;
  type_boundary_passed: boolean;
  blocking_reasons: RuntimeCanonicalVariableDerivationBlockingReason[];
}

export type RuntimeCanonicalMappingBlockingReason =
  | "missing_explicit_mapping"
  | "missing_source_node_ref"
  | "missing_runtime_interaction_id"
  | "missing_subfield_name"
  | "missing_canonical_variable_name"
  | "missing_mapping_role"
  | "missing_source_trace"
  | "missing_source_evidence"
  | "similarity_mapping_detected"
  | "name_similarity_mapping_detected"
  | "free_text_mapping_detected"
  | "receiver_feedback_from_satisfaction_detected";

export interface RuntimePhase7InputRevalidationDecision {
  phase6_closed_local: boolean;
  ready_for_phase7_authorization: boolean;
  phase7_started_local: boolean;
  phase7_closed_local: false;
  response_ingest_candidates_available: boolean;
  runtime_subfield_response_candidates_available: boolean;
  evidence_item_candidates_available: boolean;
  provenance_epistemic_status_available: boolean;
  source_trace_available: boolean;
  idempotency_contract_verified: boolean;
  response_revision_contract_verified: boolean;
  c09_phase6_boundary_verified: boolean;
  evidence_recalculated: false;
  new_response_created: false;
  evidence_item_real_created: false;
  phase8_started: false;
}

export interface RuntimeCanonicalVariableSourceContract {
  canonical_variable_source_ref: string;
  runtime_variable_map_ref?: string;
  runtime_interaction_mapping_ref?: string;
  source_node_ref: string;
  runtime_interaction_id: string;
  subfield_name?: string;
  canonical_variable_name: string;
  variable_type: string;
  mapping_role?: string;
  required_status?: "required" | "optional" | "derived";
  route_id?: string;
  critical_route_ref?: string;
  expected_source_evidence_refs: string[];
  expected_response_refs: string[];
  explicit_mapping_present: boolean;
  free_text_mapping_used: false;
  similarity_mapping_used: false;
  name_similarity_mapping_used: false;
}

export interface RuntimeCanonicalExplicitMappingDecision {
  explicit_mapping_required: true;
  explicit_mapping_present: boolean;
  source_node_ref_present: boolean;
  runtime_interaction_id_present: boolean;
  subfield_name_required: boolean;
  subfield_name_present: boolean;
  canonical_variable_name_present: boolean;
  mapping_role_present_when_required: boolean;
  source_trace_present: boolean;
  source_evidence_present: boolean;
  similarity_mapping_blocked: true;
  name_similarity_mapping_blocked: true;
  free_text_mapping_blocked: true;
  receiver_feedback_from_satisfaction_blocked: true;
  mapping_violation_candidate_created: boolean;
  canonical_variable_candidate_allowed: boolean;
  blocking_reasons: RuntimeCanonicalMappingBlockingReason[];
}

export interface RuntimeCanonicalSourceTraceContract {
  source_ref?: string;
  source_document?: string;
  source_sheet?: string;
  source_row_number?: number;
  raw_row?: Record<string, unknown>;
  raw_row_preserved_internally: true;
  source_node_id?: string;
  source_code?: string;
  source_block?: string;
  runtime_interaction_id: string;
  runtime_interaction_mapping_ref?: string;
  response_ref?: string;
  subfield_response_ref?: string;
  evidence_item_ref?: string;
  mapping_checksum?: string;
  source_trace_fabricated: false;
}

export type RuntimeCanonicalVariableMappingStatus =
  | "mapping_ready"
  | "blocked_missing_canonical_variable_mapping"
  | "blocked_unauthorized_inference_required"
  | "blocked_epistemic_violation";

export interface RuntimeCanonicalVariableMappingDecision {
  decision_id: string;
  runtime_interaction_id: string;
  subfield_name: string;
  mapping_status: RuntimeCanonicalVariableMappingStatus;
  canonical_variable_id?: string;
  canonical_variable_name?: string;
  canonical_variable_path?: string;
  mapping_source_trace?: Record<string, unknown>;
  exact_mapping_used: boolean;
  fuzzy_mapping_used: false;
  semantic_fallback_used: false;
  free_inference_used: false;
  unauthorized_expansion_used: false;
}

export interface RuntimeCanonicalVariableRecordCandidate {
  canonical_variable_candidate_ref: string;
  canonical_variable_record_real_created: false;
  canonical_variable_record_ref: string;
  canonical_variable_id: string;
  canonical_variable_name: string;
  canonical_variable_path?: string;
  runtime_interaction_id: string;
  interaction_instance_id_preview: string;
  subfield_name: string;
  value: unknown;
  literal_value?: unknown;
  normalized_value?: unknown;
  epistemic_status: RuntimeResponseEpistemicStatus;
  provenance_type: RuntimeResponseProvenanceType;
  source_subfield_response_ref: string;
  source_evidence_item_ref?: string;
  evidence_backed: boolean;
  requires_user_confirmation: boolean;
  internal_calculation: boolean;
  source_trace: Record<string, unknown>;
  activity_runtime_run_id?: string;
  role_runtime_session_id?: string;
  case_id?: string;
  session_id?: string;
  scene_id?: string;
  variable_name?: string;
  variable_value?: unknown;
  variable_type?: string;
  route_id?: string;
  route_status?: string;
  source_evidence_item_ids?: string[];
  derived_from_response_ids?: string[];
  derived_from_subfield_response_ids?: string[];
  required_if_condition?: string;
  gap_flag?: boolean;
  gap_type?: string;
  confidence?: number | string;
  epistemic_basis?: string;
  derivation_rule_ref?: string;
  diagnostic_status?: "non_diagnostic";
  object_binding_status?: string;
  invalidated_at?: string;
  invalidation_reason?: string;
  mapping_source_trace: Record<string, unknown>;
  real_canonical_variable_record_created: false;
  real_evidence_item_created: false;
  ir_real_created: false;
  object_inventory_real_opened: false;
}

export interface RuntimeCanonicalVariableAuditCandidate {
  canonical_variable_audit_ref: string;
  action:
    | "canonical_variable_candidates_created"
    | "canonical_variable_mapping_blocked";
  candidates_created: number;
  mappings_blocked: number;
  real_audit_record_created: false;
  metadata: Record<string, unknown>;
}

export interface RuntimeCanonicalVariableNoGoCheck {
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
  real_canonical_variable_record_created: false;
  real_audit_record_created: false;
  real_runtime_records_created: false;
  business_evidence_created: false;
  registry_live_db_created: false;
  ir_real_created: false;
  object_inventory_real_opened: false;
  f5c_real_opened: false;
  export_created: false;
  diagnosis_created: false;
  delivered_created: false;
}

export interface RuntimeCanonicalVariableServiceLocalInput {
  case_id: string;
  ingest_result: RuntimeResponseIngestLocalResult;
  canonical_variable_mappings: RuntimeCanonicalVariableMapCandidate[];
  phase6_closeout?: {
    phase6_closed_local: boolean;
    ready_for_phase7_authorization: boolean;
  };
  options?: {
    version?: string;
    activity_runtime_run_id?: string;
    role_runtime_session_id?: string;
    session_id?: string;
    scene_id?: string;
  };
}

export interface RuntimeCanonicalVariableServiceLocalResult {
  ok: boolean;
  case_id: string;
  status?: RuntimeCanonicalVariableStatus;
  service_status: RuntimeCanonicalVariableServiceStatus;
  phase7_input_revalidation?: RuntimePhase7InputRevalidationDecision;
  source_contracts?: RuntimeCanonicalVariableSourceContract[];
  explicit_mapping_decisions?: RuntimeCanonicalExplicitMappingDecision[];
  source_trace_contracts?: RuntimeCanonicalSourceTraceContract[];
  evidence_subfield_derivation_decisions?: RuntimeCanonicalEvidenceSubfieldDerivationDecision[];
  canonical_epistemic_enforcement_decisions?: RuntimeCanonicalEpistemicEnforcementDecision[];
  variable_value_type_boundaries?: RuntimeCanonicalVariableValueTypeBoundary[];
  route_status_decisions?: RuntimeCanonicalRouteStatusDecision[];
  gap_flag_decisions?: RuntimeCanonicalGapFlagDecision[];
  c09_receiver_feedback_boundaries?: RuntimeCanonicalC09ReceiverFeedbackBoundary[];
  critical_route_variable_families?: RuntimeCanonicalCriticalRouteVariableFamily[];
  b7_non_diagnostic_guards?: RuntimeCanonicalB7NonDiagnosticGuard[];
  gate_prep_boundary?: RuntimeCanonicalGatePrepBoundary;
  supersession_revision_decisions?: RuntimeCanonicalSupersessionRevisionDecision[];
  object_binding_reference_boundaries?: RuntimeCanonicalObjectBindingReferenceBoundary[];
  persistence_boundary?: RuntimeCanonicalPersistenceBoundary;
  canonical_variable_audit_candidates?: RuntimeCanonicalVariableAuditActionCandidate[];
  phase8_boundary?: RuntimeCanonicalPhase8Boundary;
  mapping_decisions: RuntimeCanonicalVariableMappingDecision[];
  canonical_variable_record_candidates: RuntimeCanonicalVariableRecordCandidate[];
  audit_candidate: RuntimeCanonicalVariableAuditCandidate;
  no_go_check: RuntimeCanonicalVariableNoGoCheck;
  blocked_reason?: string;
  phase7_started_local?: true;
  phase7_closed_local?: false;
  ready_for_phase8_authorization?: false;
  runtime_40_20_started?: false;
  supabase_touched?: false;
  sql_executed?: false;
  endpoint_created?: false;
  canonical_variable_record_real_created?: false;
  branching_engine_executed?: false;
  critical_route_gate_executed?: false;
  mmabp_gate_engine_executed?: false;
  readiness_engine_executed?: false;
  readiness_decision_record_created?: false;
  export_preview_created?: false;
  semantic_resolution_event_created?: false;
  process_state_timer_event_created?: false;
  reentry_opened?: false;
  branching_decision_created?: false;
  budget_ledger_updated?: false;
  causal_activities_opened?: false;
  causal_budget_exceeded?: false;
  phase8_started?: false;
  materiality: {
    level: "runtime_40_20_canonical_variable_service_local_contract";
    local_only: true;
    real_canonical_variable_created: false;
    real_evidence_created: false;
    ir_real_created: false;
    object_inventory_real_opened: false;
    runtime_40_20_started: false;
    next_authorization_required: true;
  };
}

export type RuntimeCanonicalVariableMappingInput = {
  subfield_response_candidate: RuntimeSubfieldResponseCandidate;
  evidence_item_candidate?: RuntimeEvidenceItemCandidate;
  canonical_variable_mapping: RuntimeCanonicalVariableMapCandidate;
};
