import type {
  RuntimeCriticalRouteGateResultCandidate,
  RuntimeGateAuditTrailCandidate,
  RuntimeGateControlPlaneBoundary,
  RuntimeGateObjectInventoryBoundary,
  RuntimeGateOutcomeReadinessBoundary,
  RuntimeGatePersistenceBoundary,
  RuntimeProcessStateTimerEventContractCandidate,
  RuntimeReadinessGapRecordCandidate,
  RuntimeSemanticResolutionEventContractCandidate,
} from "../critical-gates/runtime-40-20-critical-gates-types";

export type RuntimeReadinessFoundationStatus =
  | "phase10_input_revalidation_passed"
  | "readiness_engine_evaluation_candidate_created"
  | "readiness_rule_source_contract_created"
  | "readiness_state_model_candidate_created"
  | "blocked_phase9_not_closed"
  | "blocked_phase10_not_authorized"
  | "blocked_missing_source_trace"
  | "blocked_readiness_real_execution_attempt"
  | "blocked_export_preview_attempt"
  | "blocked_phase11_started_attempt";

export type RuntimeReadinessDecisionCandidateStatus =
  | "ready_decision_candidate_created"
  | "ready_with_flags_decision_candidate_created"
  | "blocked_by_missing_evidence_candidate_created"
  | "blocked_by_contradiction_candidate_created"
  | "blocked_by_missing_canonical_route_candidate_created"
  | "manual_review_required_candidate_created"
  | "blocked_missing_source_trace"
  | "blocked_blocking_gap_hidden_as_flag"
  | "blocked_readiness_real_creation_attempt"
  | "blocked_export_preview_attempt"
  | "blocked_free_text_route_closure_attempt";

export type RuntimeReadinessStateCandidate =
  | "ready"
  | "ready_with_flags"
  | "blocked_by_missing_evidence"
  | "blocked_by_contradiction"
  | "blocked_by_missing_canonical_route"
  | "manual_review_required"
  | "reentry_required";

export type RuntimeReadinessFlagType =
  | "evidence_low_confidence"
  | "semantic_warning"
  | "carry_forward_non_blocking"
  | "budget_exhausted_non_blocking"
  | "manual_review_recommended"
  | "export_condition_warning";

export type RuntimeReadinessContradictionType =
  | "PM_vs_PF"
  | "MoC_vs_PF"
  | "PF_vs_OLC"
  | "OLC_vs_MoC"
  | "evidence_vs_variable"
  | "route_status_conflict"
  | "semantic_resolution_conflict";

export type RuntimeAffectedCriticalRoute = "B0" | "B2" | "B3" | "B7";

export type RuntimeManualReviewReason =
  | "semantic_ambiguity"
  | "route_missing"
  | "contradiction"
  | "B7_boundary_risk"
  | "evidence_insufficient"
  | "override_request";

export type RuntimeReentryLocalStatus =
  | "reentry_required_candidate_created"
  | "reentry_plan_candidate_created"
  | "reentry_execution_boundary_created"
  | "blocked_missing_source_trace"
  | "blocked_reentry_without_blocking_gap"
  | "blocked_reentry_real_open_attempt"
  | "blocked_ui_render_attempt"
  | "blocked_response_ingest_attempt";

export type RuntimeReadinessAggregationStatus =
  | "readiness_gap_aggregation_candidate_created"
  | "critical_route_readiness_aggregation_candidate_created"
  | "semantic_pst_readiness_aggregation_candidate_created"
  | "budget_readiness_aggregation_candidate_created"
  | "readiness_decision_record_candidate_created"
  | "blocked_missing_source_trace"
  | "blocked_blocking_gap_hidden"
  | "blocked_free_text_route_closure_attempt"
  | "blocked_semantic_or_temporal_inference_attempt"
  | "blocked_readiness_decision_record_real_creation_attempt";

export type RuntimeReadinessBoundaryStatus =
  | "readiness_audit_candidate_created"
  | "phase11_export_preview_boundary_created"
  | "phase12_qa_boundary_created"
  | "readiness_supersession_recompute_boundary_created"
  | "readiness_persistence_boundary_created"
  | "blocked_missing_source_trace"
  | "blocked_export_preview_attempt"
  | "blocked_qa_real_start_attempt"
  | "blocked_global_recompute_attempt"
  | "blocked_readiness_persistence_attempt";

export type RuntimeReadinessAuditAction =
  | "readiness_evaluation_started"
  | "readiness_state_assigned"
  | "ready_candidate_created"
  | "ready_with_flags_candidate_created"
  | "blocked_candidate_created"
  | "manual_review_required_candidate_created"
  | "reentry_required_candidate_created"
  | "gap_aggregation_completed"
  | "critical_route_readiness_evaluated"
  | "semantic_pst_readiness_evaluated"
  | "budget_readiness_evaluated"
  | "export_preview_blocked";

export type RuntimeReadinessFoundationBlockingReason =
  | "phase9_not_closed"
  | "phase10_not_authorized"
  | "missing_source_trace"
  | "missing_readiness_rule"
  | "missing_readiness_state"
  | "invented_readiness_state"
  | "readiness_from_free_narrative_attempted"
  | "readiness_from_causal_score_only_attempted"
  | "readiness_from_b7_c20_preclassification_only_attempted"
  | "readiness_real_execution_attempted"
  | "readiness_decision_record_real_creation_attempted"
  | "ready_final_creation_attempted"
  | "ready_with_flags_final_creation_attempted"
  | "blocked_final_creation_attempted"
  | "manual_review_request_real_creation_attempted"
  | "reentry_interactions_real_creation_attempted"
  | "critical_gates_recalculation_attempted"
  | "phase9_modification_attempted"
  | "export_preview_creation_attempted"
  | "parallel_export_payload_creation_attempted"
  | "produccion_paralela_start_attempted"
  | "phase11_started_attempted"
  | "supabase_touch_attempted"
  | "sql_execution_attempted"
  | "endpoint_creation_attempted"
  | "service_role_client_violation";

export type RuntimeReadinessDecisionBlockingReason =
  | "missing_source_trace"
  | "blocking_gap_present"
  | "critical_route_missing"
  | "semantic_projection_block_present"
  | "pst_deadlock_gap_present"
  | "evidence_not_sufficient"
  | "canonical_route_not_closed"
  | "b0_not_closed"
  | "b2_not_closed"
  | "b3_not_closed"
  | "b7_boundary_not_respected"
  | "manual_review_required"
  | "reentry_required"
  | "blocking_gap_hidden_as_flag"
  | "b7_diagnosis_attempted"
  | "missing_flag_source_trace"
  | "invalid_flag_type"
  | "missing_evidence_gap_refs"
  | "missing_contradiction_gap_refs"
  | "invalid_contradiction_type"
  | "missing_route_gap_refs"
  | "invalid_affected_critical_route"
  | "invalid_manual_review_reason"
  | "contradiction_resolved_by_inference_attempted"
  | "route_closed_from_free_text_attempted"
  | "c09_closed_from_satisfaction_general_attempted"
  | "manual_review_request_real_creation_attempted"
  | "waiver_automatic_creation_attempted"
  | "override_automatic_creation_attempted"
  | "readiness_decision_record_real_creation_attempted"
  | "ready_final_creation_attempted"
  | "ready_with_flags_final_creation_attempted"
  | "blocked_final_creation_attempted"
  | "export_preview_creation_attempted"
  | "phase11_started_attempted"
  | "supabase_touch_attempted"
  | "sql_execution_attempted"
  | "endpoint_creation_attempted";

export type RuntimeReentryBlockingReason =
  | "missing_source_trace"
  | "missing_source_gap_ref"
  | "missing_source_gate_ref"
  | "missing_source_readiness_gap_ref"
  | "missing_reentry_target_block"
  | "missing_reentry_target_interaction_id"
  | "missing_reentry_reason"
  | "missing_blocking_gap"
  | "reentry_by_curiosity_attempted"
  | "reentry_real_open_attempted"
  | "runtime_interaction_instance_real_creation_attempted"
  | "ui_render_real_creation_attempted"
  | "shown_at_real_creation_attempted"
  | "answered_at_real_creation_attempted"
  | "response_ingest_execution_attempted"
  | "evidence_item_real_creation_attempted"
  | "canonical_variable_record_real_creation_attempted"
  | "branching_real_execution_attempted"
  | "gates_reexecution_attempted"
  | "readiness_final_after_reentry_candidate_attempted"
  | "endpoint_creation_attempted"
  | "supabase_touch_attempted"
  | "sql_execution_attempted"
  | "phase11_started_attempted";

export type RuntimeReadinessAggregationBlockingReason =
  | "missing_source_trace"
  | "invented_gap_attempted"
  | "blocking_gap_hidden_attempted"
  | "blocking_gap_downgraded_without_explicit_rule"
  | "critical_route_blocked"
  | "critical_route_missing"
  | "route_status_closed_from_satisfaction_attempted"
  | "route_status_closed_from_free_text_attempted"
  | "b7_diagnostic_boundary_violation"
  | "sem_blocks_projection_open"
  | "pst_blocking_gap_open"
  | "deadlock_risk_blocking"
  | "semantic_resolution_inferred_attempted"
  | "temporal_resolution_inferred_attempted"
  | "more_causals_opened_attempted"
  | "budget_override_automatic_creation_attempted"
  | "budget_hides_blocking_gap_attempted"
  | "budget_ledger_real_update_attempted"
  | "invalid_readiness_state"
  | "missing_readiness_reason"
  | "readiness_decision_record_real_creation_attempted"
  | "db_write_attempted"
  | "export_preview_creation_attempted"
  | "phase11_started_attempted"
  | "supabase_touch_attempted"
  | "sql_execution_attempted"
  | "endpoint_creation_attempted";

export type RuntimeReadinessBoundaryBlockingReason =
  | "missing_source_trace"
  | "missing_audit_reason"
  | "invalid_audit_action"
  | "runtime_audit_trail_real_creation_attempted"
  | "readiness_decision_record_real_creation_attempted"
  | "blocked_export_preview_authorization_attempted"
  | "manual_review_export_preview_authorization_attempted"
  | "reentry_export_preview_authorization_attempted"
  | "export_preview_creation_attempted"
  | "scr_preview_creation_attempted"
  | "evidence_bundle_preview_creation_attempted"
  | "mdsb_preview_creation_attempted"
  | "parallel_export_payload_creation_attempted"
  | "produccion_paralela_start_attempted"
  | "registry_creation_attempted"
  | "phase11_started_attempted"
  | "qa_green_declaration_attempted"
  | "shadow_pilot_start_attempted"
  | "full_runtime_authorization_attempted"
  | "production_real_start_attempted"
  | "phase12_definition_of_done_modification_attempted"
  | "phase12_started_attempted"
  | "global_recompute_automatic_execution_attempted"
  | "prior_readiness_deleted_without_trace_attempted"
  | "export_payload_superseded_real_attempted"
  | "persistence_real_creation_attempted"
  | "db_write_attempted"
  | "manual_review_request_real_creation_attempted"
  | "reentry_interactions_real_creation_attempted"
  | "supabase_touch_attempted"
  | "sql_execution_attempted"
  | "endpoint_creation_attempted"
  | "service_role_client_violation"
  | "scene_write_attempted"
  | "mba_write_attempted"
  | "parallel_production_runtime_artifacts_write_attempted"
  | "runtime_real_start_attempted";

export interface RuntimeReadinessFlagCandidate {
  flag_ref: string;
  flag_type: RuntimeReadinessFlagType;
  flag_reason: string;
  flag_source_trace: Record<string, unknown>;
  source_gap_ref?: string;
}

export interface RuntimeReadyDecisionCandidate {
  ready_decision_candidate_ref: string;
  readiness_state: "ready";
  all_critical_routes_closed: boolean;
  no_blocking_gap: boolean;
  no_semantic_projection_block: boolean;
  no_pst_deadlock_gap: boolean;
  evidence_sufficient: boolean;
  canonical_routes_closed: boolean;
  b0_closed: boolean;
  b2_closed: boolean;
  b3_closed: boolean;
  b7_non_diagnostic_boundary_respected: boolean;
  manual_review_required: false;
  reentry_required: false;
  source_trace: Record<string, unknown>;
  readiness_decision_record_candidate_created: boolean;
  readiness_decision_record_real_created: false;
  ready_final_created: false;
  export_preview_created: false;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeReadinessDecisionBlockingReason[];
}

export interface RuntimeReadyWithFlagsDecisionCandidate {
  ready_with_flags_decision_candidate_ref: string;
  readiness_state: "ready_with_flags";
  critical_routes_sufficient: boolean;
  non_blocking_gaps_exist: boolean;
  flags: RuntimeReadinessFlagCandidate[];
  no_open_blocking_gap: boolean;
  no_critical_route_missing: boolean;
  no_b7_diagnosis: boolean;
  blocking_gap_hidden_as_flag: false;
  source_trace: Record<string, unknown>;
  readiness_decision_record_candidate_created: boolean;
  readiness_decision_record_real_created: false;
  ready_with_flags_final_created: false;
  export_preview_created: false;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeReadinessDecisionBlockingReason[];
}

export interface RuntimeBlockedByMissingEvidenceDecisionCandidate {
  blocked_missing_evidence_candidate_ref: string;
  readiness_state: "blocked_by_missing_evidence";
  missing_evidence_gap_refs: string[];
  affected_route?: string;
  affected_gate?: string;
  affected_quadrant?: string;
  evidence_required?: string;
  evidence_missing_reason: string;
  source_trace: Record<string, unknown>;
  reentry_target?: string;
  manual_review_required: boolean;
  readiness_decision_record_candidate_created: boolean;
  readiness_decision_record_real_created: false;
  ready_final_created: false;
  ready_with_flags_final_created: false;
  export_preview_created: false;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeReadinessDecisionBlockingReason[];
}

export interface RuntimeBlockedByContradictionDecisionCandidate {
  blocked_contradiction_candidate_ref: string;
  readiness_state: "blocked_by_contradiction";
  contradiction_gap_refs: string[];
  contradiction_type: RuntimeReadinessContradictionType;
  source_gate_refs: string[];
  source_trace: Record<string, unknown>;
  reentry_target?: string;
  manual_review_required: boolean;
  contradiction_resolved_by_inference: false;
  readiness_decision_record_candidate_created: boolean;
  readiness_decision_record_real_created: false;
  ready_final_created: false;
  export_preview_created: false;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeReadinessDecisionBlockingReason[];
}

export interface RuntimeBlockedByMissingCanonicalRouteDecisionCandidate {
  blocked_missing_canonical_route_candidate_ref: string;
  readiness_state: "blocked_by_missing_canonical_route";
  missing_route_gap_refs: string[];
  affected_route?: string;
  affected_critical_route: RuntimeAffectedCriticalRoute;
  canonical_route_required?: string;
  route_missing_reason: string;
  source_trace: Record<string, unknown>;
  reentry_target?: string;
  manual_review_required: boolean;
  route_closed_from_free_text: false;
  c09_closed_from_satisfaction_general: false;
  readiness_decision_record_candidate_created: boolean;
  readiness_decision_record_real_created: false;
  ready_final_created: false;
  export_preview_created: false;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeReadinessDecisionBlockingReason[];
}

export interface RuntimeManualReviewRequiredDecisionCandidate {
  manual_review_required_candidate_ref: string;
  readiness_state: "manual_review_required";
  manual_review_reason: RuntimeManualReviewReason;
  affected_gate?: string;
  affected_route?: string;
  affected_object_hint?: string;
  reviewer_role_hint?: string;
  review_question_candidate?: string;
  source_trace: Record<string, unknown>;
  manual_review_request_candidate_created: boolean;
  manual_review_request_real_created: false;
  waiver_automatic_created: false;
  override_automatic_created: false;
  ready_final_created: false;
  export_preview_created: false;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeReadinessDecisionBlockingReason[];
}

export interface RuntimeReentryRequiredCandidate {
  reentry_required_candidate_ref: string;
  readiness_state: "reentry_required";
  source_gap_ref: string;
  source_gate_ref?: string;
  source_readiness_gap_ref?: string;
  reentry_target_block: string;
  reentry_target_interaction_id?: string;
  reentry_reason: string;
  justification_required: true;
  source_trace: Record<string, unknown>;
  reentry_budget_impact?: string | number;
  reentry_counts_as_visible: boolean;
  reentry_counts_as_causal: boolean;
  reentry_by_curiosity: false;
  blocking_gap_present: boolean;
  reentry_real_opened: false;
  readiness_final_created: false;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeReentryBlockingReason[];
}

export interface RuntimeReentryInteractionCandidate {
  reentry_interaction_candidate_ref: string;
  target_interaction_id?: string;
  target_block: string;
  target_gate?: string;
  prompt_ref?: string;
  expected_response_type?: string;
  expected_resolution?: string;
  visible_to_user_candidate: boolean;
  causal_candidate: boolean;
  source_trace: Record<string, unknown>;
}

export interface RuntimeReentryPlanCandidate {
  reentry_plan_candidate_ref: string;
  target_block: string;
  target_interaction_id?: string;
  target_gate?: string;
  target_route?: string;
  target_variable?: string;
  source_gap_type?: string;
  source_gap_reason: string;
  proposed_user_visible_prompt_ref?: string;
  expected_resolution?: string;
  reentry_budget_bucket?: string;
  reentry_budget_cost?: number;
  reentry_authorization_required: true;
  reentry_interactions_candidate: RuntimeReentryInteractionCandidate[];
  runtime_interaction_instance_real_created: false;
  ui_render_real_created: false;
  endpoint_created: false;
  supabase_touched: false;
  source_trace: Record<string, unknown>;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeReentryBlockingReason[];
}

export interface RuntimeReentryExecutionBoundary {
  reentry_execution_boundary_ref: string;
  future_interactions_prepared: boolean;
  future_phase5_payload_candidate_prepared: boolean;
  future_phase6_payload_candidate_prepared: boolean;
  budget_candidate_prepared: boolean;
  reentry_real_requires_explicit_authorization: true;
  runtime_interaction_instance_real_created: false;
  shown_at_real_created: false;
  answered_at_real_created: false;
  response_ingest_executed: false;
  evidence_item_real_created: false;
  canonical_variable_record_real_created: false;
  branching_real_executed: false;
  gates_reexecuted: false;
  readiness_final_after_reentry_candidate_created: false;
  source_trace: Record<string, unknown>;
  boundary_passed: boolean;
  blocking_reasons: RuntimeReentryBlockingReason[];
}

export interface RuntimeReadinessGapAggregationCandidate {
  aggregate_gap_candidate_ref: string;
  missing_evidence_gap_refs: string[];
  contradiction_gap_refs: string[];
  missing_canonical_route_gap_refs: string[];
  semantic_ambiguity_gap_refs: string[];
  process_state_without_timer_gap_refs: string[];
  budget_exhausted_gap_refs: string[];
  manual_review_gap_refs: string[];
  carry_forward_gap_refs: string[];
  duplicate_gaps_merged_by_source_trace: boolean;
  gap_severity_rollup?: string | number;
  blocking_gap_refs: string[];
  non_blocking_gap_refs: string[];
  source_trace: Record<string, unknown>;
  blocking_gap_hidden: false;
  invented_gap_created: false;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeReadinessAggregationBlockingReason[];
}

export interface RuntimeCriticalRouteReadinessAggregationCandidate {
  critical_route_readiness_candidate_ref: string;
  b0_status?: string;
  b2_status?: string;
  b3_status?: string;
  b7_status?: string;
  route_closed: boolean;
  route_missing: boolean;
  route_blocked: boolean;
  route_manual_review_required: boolean;
  route_reentry_required: boolean;
  route_source_trace: Record<string, unknown>;
  ready_allowed: boolean;
  ready_with_flags_allowed: boolean;
  route_status_closed_from_satisfaction_or_free_text: false;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeReadinessAggregationBlockingReason[];
}

export interface RuntimeSemanticPSTReadinessAggregationCandidate {
  semantic_pst_readiness_candidate_ref: string;
  sem_blockers_open_refs: string[];
  sem_blockers_resolved_candidate_refs: string[];
  pst_blockers_open_refs: string[];
  pst_blockers_resolved_candidate_refs: string[];
  process_state_without_timer_gap_refs: string[];
  semantic_ambiguity_gap_refs: string[];
  deadlock_risk: boolean;
  source_trace: Record<string, unknown>;
  ready_allowed: boolean;
  semantic_temporal_resolution_inferred: false;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeReadinessAggregationBlockingReason[];
}

export interface RuntimeBudgetReadinessAggregationCandidate {
  budget_readiness_candidate_ref: string;
  base_budget_state?: string;
  causal_budget_state?: string;
  reentry_budget_state?: string;
  budget_exhausted_gap_refs: string[];
  budget_exhausted_non_blocking: boolean;
  budget_exhausted_blocking: boolean;
  carry_forward_gap_refs: string[];
  source_trace: Record<string, unknown>;
  more_causals_opened: false;
  budget_override_automatic_created: false;
  export_allowed_when_budget_hides_blocking_gap: false;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeReadinessAggregationBlockingReason[];
}

export interface RuntimeReadinessDecisionRecordCandidate {
  readiness_decision_candidate_ref: string;
  readiness_decision_record_real_created: false;
  run_id?: string;
  readiness_state: RuntimeReadinessStateCandidate;
  readiness_reason: string;
  blocking_gap_refs: string[];
  non_blocking_gap_refs: string[];
  manual_review_refs: string[];
  reentry_refs: string[];
  gate_result_refs: string[];
  semantic_event_refs: string[];
  pst_event_refs: string[];
  carry_forward_gap_refs: string[];
  source_trace: Record<string, unknown>;
  decision_timestamp_preview?: string;
  audit_candidate_ref?: string;
  db_write_created: false;
  export_preview_created: false;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeReadinessAggregationBlockingReason[];
}

export interface RuntimeReadinessAuditCandidate {
  readiness_audit_candidate_ref: string;
  audit_action: RuntimeReadinessAuditAction;
  audit_reason: string;
  source_readiness_candidate_ref?: string;
  source_readiness_decision_candidate_ref?: string;
  source_gap_aggregation_ref?: string;
  source_trace: Record<string, unknown>;
  readiness_decision_record_real_created: false;
  runtime_audit_trail_real_created: false;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeReadinessBoundaryBlockingReason[];
}

export interface RuntimePhase11ExportPreviewBoundary {
  phase11_export_boundary_ref: string;
  source_readiness_state?: RuntimeReadinessStateCandidate;
  source_readiness_decision_candidate_ref?: string;
  ready_can_prepare_future_export_preview: boolean;
  ready_with_flags_can_prepare_future_export_preview_with_visible_flags: boolean;
  blocked_export_preview_authorized: false;
  manual_review_export_preview_authorized: false;
  reentry_export_preview_authorized: false;
  export_preview_created: false;
  scr_preview_created: false;
  evidence_bundle_preview_created: false;
  mdsb_preview_created: false;
  parallel_export_payload_created: false;
  produccion_paralela_started: false;
  registry_created: false;
  ready_for_phase11_authorization: false;
  phase11_started: false;
  source_trace: Record<string, unknown>;
  boundary_passed: boolean;
  blocking_reasons: RuntimeReadinessBoundaryBlockingReason[];
}

export interface RuntimePhase12QABoundary {
  phase12_qa_boundary_ref: string;
  readiness_output_can_feed_future_qa: boolean;
  gaps_can_feed_future_qa: boolean;
  reentry_decisions_can_feed_future_qa: boolean;
  manual_review_required_can_feed_future_qa: boolean;
  qa_green_declared: false;
  shadow_pilot_started: false;
  full_runtime_authorized: false;
  production_real_started: false;
  phase12_definition_of_done_modified: false;
  phase12_started: false;
  source_trace: Record<string, unknown>;
  boundary_passed: boolean;
  blocking_reasons: RuntimeReadinessBoundaryBlockingReason[];
}

export interface RuntimeReadinessSupersessionRecomputeBoundary {
  readiness_supersession_boundary_ref: string;
  response_revision_impact_can_mark_stale_candidate: boolean;
  gate_result_revision_impact_can_mark_stale_candidate: boolean;
  branching_revision_impact_can_mark_stale_candidate: boolean;
  prior_readiness_candidate_ref?: string;
  supersedes_readiness_candidate_ref?: string;
  stale_reason?: string;
  recompute_required_candidate: boolean;
  global_recompute_automatic_executed: false;
  prior_readiness_deleted_without_trace: false;
  export_payload_superseded_real: false;
  export_payload_supersession_boundary_candidate_created: boolean;
  persistence_real_created: false;
  source_trace: Record<string, unknown>;
  boundary_passed: boolean;
  blocking_reasons: RuntimeReadinessBoundaryBlockingReason[];
}

export interface RuntimeReadinessPersistenceBoundary {
  readiness_persistence_boundary_ref: string;
  local_readiness_decision_candidate_mode: true;
  local_readiness_gap_aggregation_candidate_mode: true;
  local_reentry_plan_candidate_mode: true;
  local_manual_review_candidate_mode: true;
  local_readiness_audit_candidate_mode: true;
  db_write_authorized: false;
  readiness_decision_record_real_created: false;
  manual_review_request_real_created: false;
  reentry_interactions_real_created: false;
  supabase_touch_authorized: false;
  sql_execution_authorized: false;
  endpoint_creation_authorized: false;
  service_role_used: false;
  service_role_used_in_client: false;
  scene_write_detected: false;
  mba_write_detected: false;
  parallel_production_runtime_artifacts_write_detected: false;
  export_preview_created: false;
  runtime_40_20_started: false;
  source_trace: Record<string, unknown>;
  persistence_boundary_passed: boolean;
  blocking_reasons: RuntimeReadinessBoundaryBlockingReason[];
}

export interface RuntimePhase10InputRevalidationDecision {
  phase9_closed_local: boolean;
  ready_for_phase10_authorization: boolean;
  phase10_started_local: boolean;
  phase10_closed_local: false;
  ready_for_phase11_authorization: false;

  critical_route_gate_result_candidates_available: boolean;
  semantic_resolution_event_candidates_available: boolean;
  process_state_timer_event_candidates_available: boolean;
  readiness_gap_record_candidates_available: boolean;
  runtime_audit_trail_gate_candidates_available: boolean;
  gate_outcome_readiness_boundary_available: boolean;
  object_inventory_boundary_available: boolean;
  integration_membrane_control_plane_boundary_available: boolean;
  persistence_boundary_available: boolean;

  readiness_engine_previously_executed: false;
  readiness_decision_record_real_previously_created: false;
  ready_final_previously_created: false;
  ready_with_flags_final_previously_created: false;
  blocked_final_previously_created: false;
  export_preview_previously_created: false;

  critical_gates_recalculated: false;
  phase9_modified: false;
  phase11_started: false;
}

export interface RuntimeReadinessEngineEvaluationCandidate {
  readiness_engine_evaluation_candidate_ref: string;
  run_id: string;
  activity_runtime_run_id: string;
  source_gate_result_refs: string[];
  source_readiness_gap_refs: string[];
  source_semantic_event_refs: string[];
  source_pst_event_refs: string[];
  source_canonical_variable_refs: string[];
  source_branching_decision_refs: string[];
  source_budget_state_refs: string[];
  source_trace: Record<string, unknown>;
  readiness_state_candidate: RuntimeReadinessStateCandidate;
  readiness_reason: string;
  manual_review_required: boolean;
  reentry_required: boolean;
  blocking_gap_refs: string[];
  carry_forward_gap_refs: string[];
  readiness_flags: string[];
  readiness_decision_record_real_created: false;
  export_preview_created: false;
  produccion_paralela_started: false;
  readiness_engine_real_executed: false;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeReadinessFoundationBlockingReason[];
}

export interface RuntimeReadinessRuleSourceContract {
  runtime_readiness_rule_ref: string;
  readiness_gaps_reentry_source_ref: string;
  rule_id: string;
  readiness_state: RuntimeReadinessStateCandidate;
  required_gate_status?: string;
  required_route_status?: string;
  allowed_gap_type?: string;
  blocking_gap_type?: string;
  manual_review_condition?: string;
  reentry_condition?: string;
  reentry_target?: string;
  waiver_or_override_policy?: string;
  source_node_ref?: string;
  source_trace: Record<string, unknown>;
  readiness_from_free_narrative: false;
  readiness_from_causal_score_only: false;
  readiness_from_b7_c20_preclassification_only: false;
  explicit_rule_required: true;
  rule_candidate_allowed: boolean;
  blocking_reasons: RuntimeReadinessFoundationBlockingReason[];
}

export interface RuntimeReadinessStateModelCandidate {
  readiness_state_model_candidate_ref: string;
  allowed_states: RuntimeReadinessStateCandidate[];
  readiness_state_source_trace: Record<string, unknown>;
  readiness_state_reason?: string;
  readiness_state_candidate_allowed: boolean;
  invented_state_detected: false;
  blocking_reasons: RuntimeReadinessFoundationBlockingReason[];
}

export interface RuntimePhase9CloseoutForReadinessInput {
  phase9_closed_local: boolean;
  ready_for_phase10_authorization: boolean;
}

export interface RuntimePhase9ReadinessCandidateInput {
  critical_route_gate_result_candidates?: RuntimeCriticalRouteGateResultCandidate[];
  semantic_resolution_event_candidates?: RuntimeSemanticResolutionEventContractCandidate[];
  process_state_timer_event_candidates?: RuntimeProcessStateTimerEventContractCandidate[];
  readiness_gap_record_candidates?: RuntimeReadinessGapRecordCandidate[];
  runtime_audit_trail_gate_candidates?: RuntimeGateAuditTrailCandidate[];
  gate_outcome_readiness_boundaries?: RuntimeGateOutcomeReadinessBoundary[];
  object_inventory_boundaries?: RuntimeGateObjectInventoryBoundary[];
  integration_membrane_control_plane_boundaries?: RuntimeGateControlPlaneBoundary[];
  persistence_boundaries?: RuntimeGatePersistenceBoundary[];
}

export interface RuntimeReadinessEngineEvaluationSourceInput {
  readiness_engine_evaluation_candidate_ref?: string;
  run_id?: string;
  activity_runtime_run_id?: string;
  source_gate_result_refs?: string[];
  source_readiness_gap_refs?: string[];
  source_semantic_event_refs?: string[];
  source_pst_event_refs?: string[];
  source_canonical_variable_refs?: string[];
  source_branching_decision_refs?: string[];
  source_budget_state_refs?: string[];
  source_trace?: Record<string, unknown>;
  readiness_state_candidate?: RuntimeReadinessStateCandidate | string;
  readiness_reason?: string;
  manual_review_required?: boolean;
  reentry_required?: boolean;
  blocking_gap_refs?: string[];
  carry_forward_gap_refs?: string[];
  readiness_flags?: string[];
  readiness_engine_real_execution_attempted?: boolean;
  readiness_decision_record_real_creation_attempted?: boolean;
  ready_final_creation_attempted?: boolean;
  ready_with_flags_final_creation_attempted?: boolean;
  blocked_final_creation_attempted?: boolean;
  manual_review_request_real_creation_attempted?: boolean;
  reentry_interactions_real_creation_attempted?: boolean;
  export_preview_creation_attempted?: boolean;
  parallel_export_payload_creation_attempted?: boolean;
  produccion_paralela_start_attempted?: boolean;
  phase11_started_attempted?: boolean;
}

export interface RuntimeReadinessRuleSourceInput {
  runtime_readiness_rule_ref?: string;
  readiness_gaps_reentry_source_ref?: string;
  rule_id?: string;
  readiness_state?: RuntimeReadinessStateCandidate | string;
  required_gate_status?: string;
  required_route_status?: string;
  allowed_gap_type?: string;
  blocking_gap_type?: string;
  manual_review_condition?: string;
  reentry_condition?: string;
  reentry_target?: string;
  waiver_or_override_policy?: string;
  source_node_ref?: string;
  source_trace?: Record<string, unknown>;
  readiness_from_free_narrative_attempted?: boolean;
  readiness_from_causal_score_only_attempted?: boolean;
  readiness_from_b7_c20_preclassification_only_attempted?: boolean;
  explicit_rule_required?: boolean;
}

export interface RuntimeReadinessStateModelInput {
  readiness_state_model_candidate_ref?: string;
  allowed_states?: string[];
  readiness_state_source_trace?: Record<string, unknown>;
  readiness_state_reason?: string;
}

export interface RuntimeReadinessBoundaryGuardInput {
  critical_gates_recalculation_attempted?: boolean;
  phase9_modification_attempted?: boolean;
  supabase_touch_attempted?: boolean;
  sql_execution_attempted?: boolean;
  endpoint_creation_attempted?: boolean;
  service_role_client_use_attempted?: boolean;
}

export interface RuntimeReadinessDecisionAttemptBoundaryInput {
  readiness_decision_record_real_creation_attempted?: boolean;
  ready_final_creation_attempted?: boolean;
  ready_with_flags_final_creation_attempted?: boolean;
  blocked_final_creation_attempted?: boolean;
  manual_review_request_real_creation_attempted?: boolean;
  waiver_automatic_creation_attempted?: boolean;
  override_automatic_creation_attempted?: boolean;
  export_preview_creation_attempted?: boolean;
  phase11_started_attempted?: boolean;
  supabase_touch_attempted?: boolean;
  sql_execution_attempted?: boolean;
  endpoint_creation_attempted?: boolean;
}

export interface RuntimeReadyDecisionSourceInput extends RuntimeReadinessDecisionAttemptBoundaryInput {
  ready_decision_candidate_ref?: string;
  all_critical_routes_closed?: boolean;
  no_blocking_gap?: boolean;
  no_semantic_projection_block?: boolean;
  no_pst_deadlock_gap?: boolean;
  evidence_sufficient?: boolean;
  canonical_routes_closed?: boolean;
  b0_closed?: boolean;
  b2_closed?: boolean;
  b3_closed?: boolean;
  b7_non_diagnostic_boundary_respected?: boolean;
  manual_review_required?: boolean;
  reentry_required?: boolean;
  source_trace?: Record<string, unknown>;
}

export interface RuntimeReadinessFlagSourceInput {
  flag_ref?: string;
  flag_type?: RuntimeReadinessFlagType | string;
  flag_reason?: string;
  flag_source_trace?: Record<string, unknown>;
  source_gap_ref?: string;
  source_gap_is_blocking?: boolean;
}

export interface RuntimeReadyWithFlagsDecisionSourceInput
  extends RuntimeReadinessDecisionAttemptBoundaryInput {
  ready_with_flags_decision_candidate_ref?: string;
  critical_routes_sufficient?: boolean;
  non_blocking_gaps_exist?: boolean;
  flags?: RuntimeReadinessFlagSourceInput[];
  no_open_blocking_gap?: boolean;
  no_critical_route_missing?: boolean;
  no_b7_diagnosis?: boolean;
  blocking_gap_hidden_as_flag_attempted?: boolean;
  source_trace?: Record<string, unknown>;
}

export interface RuntimeBlockedByMissingEvidenceDecisionSourceInput
  extends RuntimeReadinessDecisionAttemptBoundaryInput {
  blocked_missing_evidence_candidate_ref?: string;
  missing_evidence_gap_refs?: string[];
  affected_route?: string;
  affected_gate?: string;
  affected_quadrant?: string;
  evidence_required?: string;
  evidence_missing_reason?: string;
  source_trace?: Record<string, unknown>;
  reentry_target?: string;
  manual_review_required?: boolean;
}

export interface RuntimeBlockedByContradictionDecisionSourceInput
  extends RuntimeReadinessDecisionAttemptBoundaryInput {
  blocked_contradiction_candidate_ref?: string;
  contradiction_gap_refs?: string[];
  contradiction_type?: RuntimeReadinessContradictionType | string;
  source_gate_refs?: string[];
  source_trace?: Record<string, unknown>;
  reentry_target?: string;
  manual_review_required?: boolean;
  contradiction_resolved_by_inference_attempted?: boolean;
}

export interface RuntimeBlockedByMissingCanonicalRouteDecisionSourceInput
  extends RuntimeReadinessDecisionAttemptBoundaryInput {
  blocked_missing_canonical_route_candidate_ref?: string;
  missing_route_gap_refs?: string[];
  affected_route?: string;
  affected_critical_route?: RuntimeAffectedCriticalRoute | string;
  canonical_route_required?: string;
  route_missing_reason?: string;
  source_trace?: Record<string, unknown>;
  reentry_target?: string;
  manual_review_required?: boolean;
  route_closed_from_free_text_attempted?: boolean;
  c09_closed_from_satisfaction_general_attempted?: boolean;
}

export interface RuntimeManualReviewRequiredDecisionSourceInput
  extends RuntimeReadinessDecisionAttemptBoundaryInput {
  manual_review_required_candidate_ref?: string;
  manual_review_reason?: RuntimeManualReviewReason | string;
  affected_gate?: string;
  affected_route?: string;
  affected_object_hint?: string;
  reviewer_role_hint?: string;
  review_question_candidate?: string;
  source_trace?: Record<string, unknown>;
}

export interface RuntimeReentryAttemptBoundaryInput {
  reentry_real_open_attempted?: boolean;
  runtime_interaction_instance_real_creation_attempted?: boolean;
  ui_render_real_creation_attempted?: boolean;
  shown_at_real_creation_attempted?: boolean;
  answered_at_real_creation_attempted?: boolean;
  response_ingest_execution_attempted?: boolean;
  evidence_item_real_creation_attempted?: boolean;
  canonical_variable_record_real_creation_attempted?: boolean;
  branching_real_execution_attempted?: boolean;
  gates_reexecution_attempted?: boolean;
  readiness_final_after_reentry_candidate_attempted?: boolean;
  endpoint_creation_attempted?: boolean;
  supabase_touch_attempted?: boolean;
  sql_execution_attempted?: boolean;
  phase11_started_attempted?: boolean;
}

export interface RuntimeReentryRequiredSourceInput extends RuntimeReentryAttemptBoundaryInput {
  reentry_required_candidate_ref?: string;
  source_gap_ref?: string;
  source_gate_ref?: string;
  source_readiness_gap_ref?: string;
  reentry_target_block?: string;
  reentry_target_interaction_id?: string;
  reentry_reason?: string;
  source_trace?: Record<string, unknown>;
  reentry_budget_impact?: string | number;
  reentry_counts_as_visible?: boolean;
  reentry_counts_as_causal?: boolean;
  reentry_by_curiosity_attempted?: boolean;
  blocking_gap_present?: boolean;
}

export interface RuntimeReentryInteractionSourceInput {
  reentry_interaction_candidate_ref?: string;
  target_interaction_id?: string;
  target_block?: string;
  target_gate?: string;
  prompt_ref?: string;
  expected_response_type?: string;
  expected_resolution?: string;
  visible_to_user_candidate?: boolean;
  causal_candidate?: boolean;
  source_trace?: Record<string, unknown>;
}

export interface RuntimeReentryPlanSourceInput extends RuntimeReentryAttemptBoundaryInput {
  reentry_plan_candidate_ref?: string;
  target_block?: string;
  target_interaction_id?: string;
  target_gate?: string;
  target_route?: string;
  target_variable?: string;
  source_gap_type?: string;
  source_gap_reason?: string;
  proposed_user_visible_prompt_ref?: string;
  expected_resolution?: string;
  reentry_budget_bucket?: string;
  reentry_budget_cost?: number;
  reentry_interactions_candidate?: RuntimeReentryInteractionSourceInput[];
  source_trace?: Record<string, unknown>;
}

export interface RuntimeReentryExecutionBoundarySourceInput extends RuntimeReentryAttemptBoundaryInput {
  reentry_execution_boundary_ref?: string;
  future_interactions_prepared?: boolean;
  future_phase5_payload_candidate_prepared?: boolean;
  future_phase6_payload_candidate_prepared?: boolean;
  budget_candidate_prepared?: boolean;
  source_trace?: Record<string, unknown>;
}

export interface RuntimeReadinessAggregationAttemptBoundaryInput {
  readiness_decision_record_real_creation_attempted?: boolean;
  db_write_attempted?: boolean;
  export_preview_creation_attempted?: boolean;
  phase11_started_attempted?: boolean;
  supabase_touch_attempted?: boolean;
  sql_execution_attempted?: boolean;
  endpoint_creation_attempted?: boolean;
}

export interface RuntimeReadinessGapAggregationSourceInput
  extends RuntimeReadinessAggregationAttemptBoundaryInput {
  aggregate_gap_candidate_ref?: string;
  missing_evidence_gap_refs?: string[];
  contradiction_gap_refs?: string[];
  missing_canonical_route_gap_refs?: string[];
  semantic_ambiguity_gap_refs?: string[];
  process_state_without_timer_gap_refs?: string[];
  budget_exhausted_gap_refs?: string[];
  manual_review_gap_refs?: string[];
  carry_forward_gap_refs?: string[];
  duplicate_gaps_merged_by_source_trace?: boolean;
  gap_severity_rollup?: string | number;
  blocking_gap_refs?: string[];
  non_blocking_gap_refs?: string[];
  source_trace?: Record<string, unknown>;
  blocking_gap_hidden_attempted?: boolean;
  invented_gap_attempted?: boolean;
  blocking_gap_downgraded_without_explicit_rule_attempted?: boolean;
}

export interface RuntimeCriticalRouteReadinessAggregationSourceInput
  extends RuntimeReadinessAggregationAttemptBoundaryInput {
  critical_route_readiness_candidate_ref?: string;
  b0_status?: string;
  b2_status?: string;
  b3_status?: string;
  b7_status?: string;
  route_closed?: boolean;
  route_missing?: boolean;
  route_blocked?: boolean;
  route_manual_review_required?: boolean;
  route_reentry_required?: boolean;
  route_source_trace?: Record<string, unknown>;
  ready_allowed?: boolean;
  ready_with_flags_allowed?: boolean;
  route_status_closed_from_satisfaction_attempted?: boolean;
  route_status_closed_from_free_text_attempted?: boolean;
  b7_diagnostic_boundary_violation_attempted?: boolean;
}

export interface RuntimeSemanticPSTReadinessAggregationSourceInput
  extends RuntimeReadinessAggregationAttemptBoundaryInput {
  semantic_pst_readiness_candidate_ref?: string;
  sem_blockers_open_refs?: string[];
  sem_blockers_resolved_candidate_refs?: string[];
  pst_blockers_open_refs?: string[];
  pst_blockers_resolved_candidate_refs?: string[];
  process_state_without_timer_gap_refs?: string[];
  semantic_ambiguity_gap_refs?: string[];
  deadlock_risk?: boolean;
  source_trace?: Record<string, unknown>;
  ready_allowed?: boolean;
  semantic_resolution_inferred_attempted?: boolean;
  temporal_resolution_inferred_attempted?: boolean;
}

export interface RuntimeBudgetReadinessAggregationSourceInput
  extends RuntimeReadinessAggregationAttemptBoundaryInput {
  budget_readiness_candidate_ref?: string;
  base_budget_state?: string;
  causal_budget_state?: string;
  reentry_budget_state?: string;
  budget_exhausted_gap_refs?: string[];
  budget_exhausted_non_blocking?: boolean;
  budget_exhausted_blocking?: boolean;
  carry_forward_gap_refs?: string[];
  source_trace?: Record<string, unknown>;
  more_causals_opened_attempted?: boolean;
  budget_override_automatic_creation_attempted?: boolean;
  budget_hides_blocking_gap_attempted?: boolean;
  budget_ledger_real_update_attempted?: boolean;
}

export interface RuntimeReadinessDecisionRecordSourceInput
  extends RuntimeReadinessAggregationAttemptBoundaryInput {
  readiness_decision_candidate_ref?: string;
  run_id?: string;
  readiness_state?: RuntimeReadinessStateCandidate | string;
  readiness_reason?: string;
  blocking_gap_refs?: string[];
  non_blocking_gap_refs?: string[];
  manual_review_refs?: string[];
  reentry_refs?: string[];
  gate_result_refs?: string[];
  semantic_event_refs?: string[];
  pst_event_refs?: string[];
  carry_forward_gap_refs?: string[];
  source_trace?: Record<string, unknown>;
  decision_timestamp_preview?: string;
  audit_candidate_ref?: string;
}

export interface RuntimeReadinessBoundaryAttemptInput {
  runtime_audit_trail_real_creation_attempted?: boolean;
  readiness_decision_record_real_creation_attempted?: boolean;
  blocked_export_preview_authorization_attempted?: boolean;
  manual_review_export_preview_authorization_attempted?: boolean;
  reentry_export_preview_authorization_attempted?: boolean;
  export_preview_creation_attempted?: boolean;
  scr_preview_creation_attempted?: boolean;
  evidence_bundle_preview_creation_attempted?: boolean;
  mdsb_preview_creation_attempted?: boolean;
  parallel_export_payload_creation_attempted?: boolean;
  produccion_paralela_start_attempted?: boolean;
  registry_creation_attempted?: boolean;
  phase11_started_attempted?: boolean;
  qa_green_declaration_attempted?: boolean;
  shadow_pilot_start_attempted?: boolean;
  full_runtime_authorization_attempted?: boolean;
  production_real_start_attempted?: boolean;
  phase12_definition_of_done_modification_attempted?: boolean;
  phase12_started_attempted?: boolean;
  global_recompute_automatic_execution_attempted?: boolean;
  prior_readiness_deleted_without_trace_attempted?: boolean;
  export_payload_superseded_real_attempted?: boolean;
  persistence_real_creation_attempted?: boolean;
  db_write_attempted?: boolean;
  manual_review_request_real_creation_attempted?: boolean;
  reentry_interactions_real_creation_attempted?: boolean;
  supabase_touch_attempted?: boolean;
  sql_execution_attempted?: boolean;
  endpoint_creation_attempted?: boolean;
  service_role_client_use_attempted?: boolean;
  scene_write_attempted?: boolean;
  mba_write_attempted?: boolean;
  parallel_production_runtime_artifacts_write_attempted?: boolean;
  runtime_real_start_attempted?: boolean;
}

export interface RuntimeReadinessAuditSourceInput extends RuntimeReadinessBoundaryAttemptInput {
  readiness_audit_candidate_ref?: string;
  audit_action?: RuntimeReadinessAuditAction | string;
  audit_reason?: string;
  source_readiness_candidate_ref?: string;
  source_readiness_decision_candidate_ref?: string;
  source_gap_aggregation_ref?: string;
  source_trace?: Record<string, unknown>;
}

export interface RuntimePhase11ExportPreviewBoundarySourceInput
  extends RuntimeReadinessBoundaryAttemptInput {
  phase11_export_boundary_ref?: string;
  source_readiness_state?: RuntimeReadinessStateCandidate | string;
  source_readiness_decision_candidate_ref?: string;
  source_trace?: Record<string, unknown>;
}

export interface RuntimePhase12QABoundarySourceInput extends RuntimeReadinessBoundaryAttemptInput {
  phase12_qa_boundary_ref?: string;
  readiness_output_can_feed_future_qa?: boolean;
  gaps_can_feed_future_qa?: boolean;
  reentry_decisions_can_feed_future_qa?: boolean;
  manual_review_required_can_feed_future_qa?: boolean;
  source_trace?: Record<string, unknown>;
}

export interface RuntimeReadinessSupersessionRecomputeBoundarySourceInput
  extends RuntimeReadinessBoundaryAttemptInput {
  readiness_supersession_boundary_ref?: string;
  response_revision_impact_can_mark_stale_candidate?: boolean;
  gate_result_revision_impact_can_mark_stale_candidate?: boolean;
  branching_revision_impact_can_mark_stale_candidate?: boolean;
  prior_readiness_candidate_ref?: string;
  supersedes_readiness_candidate_ref?: string;
  stale_reason?: string;
  recompute_required_candidate?: boolean;
  export_payload_supersession_boundary_candidate_created?: boolean;
  source_trace?: Record<string, unknown>;
}

export interface RuntimeReadinessPersistenceBoundarySourceInput
  extends RuntimeReadinessBoundaryAttemptInput {
  readiness_persistence_boundary_ref?: string;
  source_trace?: Record<string, unknown>;
}

export interface RuntimePhase10ReadinessFoundationLocalInput {
  case_id: string;
  run_id?: string;
  activity_runtime_run_id?: string;
  phase9_closeout: RuntimePhase9CloseoutForReadinessInput;
  phase9_candidates: RuntimePhase9ReadinessCandidateInput;
  readiness_engine_evaluation_sources?: RuntimeReadinessEngineEvaluationSourceInput[];
  readiness_rule_source_inputs?: RuntimeReadinessRuleSourceInput[];
  readiness_state_model_inputs?: RuntimeReadinessStateModelInput[];
  ready_decision_sources?: RuntimeReadyDecisionSourceInput[];
  ready_with_flags_decision_sources?: RuntimeReadyWithFlagsDecisionSourceInput[];
  blocked_by_missing_evidence_sources?: RuntimeBlockedByMissingEvidenceDecisionSourceInput[];
  blocked_by_contradiction_sources?: RuntimeBlockedByContradictionDecisionSourceInput[];
  blocked_by_missing_canonical_route_sources?: RuntimeBlockedByMissingCanonicalRouteDecisionSourceInput[];
  manual_review_required_sources?: RuntimeManualReviewRequiredDecisionSourceInput[];
  reentry_required_sources?: RuntimeReentryRequiredSourceInput[];
  reentry_plan_sources?: RuntimeReentryPlanSourceInput[];
  reentry_execution_boundary_sources?: RuntimeReentryExecutionBoundarySourceInput[];
  readiness_gap_aggregation_sources?: RuntimeReadinessGapAggregationSourceInput[];
  critical_route_readiness_aggregation_sources?: RuntimeCriticalRouteReadinessAggregationSourceInput[];
  semantic_pst_readiness_aggregation_sources?: RuntimeSemanticPSTReadinessAggregationSourceInput[];
  budget_readiness_aggregation_sources?: RuntimeBudgetReadinessAggregationSourceInput[];
  readiness_decision_record_sources?: RuntimeReadinessDecisionRecordSourceInput[];
  readiness_audit_sources?: RuntimeReadinessAuditSourceInput[];
  phase11_export_preview_boundary_sources?: RuntimePhase11ExportPreviewBoundarySourceInput[];
  phase12_qa_boundary_sources?: RuntimePhase12QABoundarySourceInput[];
  readiness_supersession_recompute_boundary_sources?: RuntimeReadinessSupersessionRecomputeBoundarySourceInput[];
  readiness_persistence_boundary_sources?: RuntimeReadinessPersistenceBoundarySourceInput[];
  boundary_guard?: RuntimeReadinessBoundaryGuardInput;
}

export interface RuntimePhase10ReadinessFoundationLocalResult {
  status:
    | RuntimeReadinessFoundationStatus
    | RuntimeReadinessDecisionCandidateStatus
    | RuntimeReentryLocalStatus
    | RuntimeReadinessAggregationStatus
    | RuntimeReadinessBoundaryStatus;
  phase10_input_revalidation: RuntimePhase10InputRevalidationDecision;
  readiness_engine_evaluation_candidates: RuntimeReadinessEngineEvaluationCandidate[];
  readiness_rule_source_contracts: RuntimeReadinessRuleSourceContract[];
  readiness_state_model_candidates: RuntimeReadinessStateModelCandidate[];
  ready_decision_candidates?: RuntimeReadyDecisionCandidate[];
  ready_with_flags_decision_candidates?: RuntimeReadyWithFlagsDecisionCandidate[];
  blocked_by_missing_evidence_candidates?: RuntimeBlockedByMissingEvidenceDecisionCandidate[];
  blocked_by_contradiction_candidates?: RuntimeBlockedByContradictionDecisionCandidate[];
  blocked_by_missing_canonical_route_candidates?: RuntimeBlockedByMissingCanonicalRouteDecisionCandidate[];
  manual_review_required_candidates?: RuntimeManualReviewRequiredDecisionCandidate[];
  reentry_required_candidates?: RuntimeReentryRequiredCandidate[];
  reentry_plan_candidates?: RuntimeReentryPlanCandidate[];
  reentry_execution_boundaries?: RuntimeReentryExecutionBoundary[];
  readiness_gap_aggregation_candidates?: RuntimeReadinessGapAggregationCandidate[];
  critical_route_readiness_aggregation_candidates?: RuntimeCriticalRouteReadinessAggregationCandidate[];
  semantic_pst_readiness_aggregation_candidates?: RuntimeSemanticPSTReadinessAggregationCandidate[];
  budget_readiness_aggregation_candidates?: RuntimeBudgetReadinessAggregationCandidate[];
  readiness_decision_record_candidates?: RuntimeReadinessDecisionRecordCandidate[];
  readiness_audit_candidates?: RuntimeReadinessAuditCandidate[];
  phase11_export_preview_boundaries?: RuntimePhase11ExportPreviewBoundary[];
  phase12_qa_boundaries?: RuntimePhase12QABoundary[];
  readiness_supersession_recompute_boundaries?: RuntimeReadinessSupersessionRecomputeBoundary[];
  readiness_persistence_boundaries?: RuntimeReadinessPersistenceBoundary[];

  phase10_started_local: boolean;
  phase10_closed_local: false;
  ready_for_phase11_authorization: false;

  readiness_engine_real_executed: false;
  readiness_decision_record_real_created: false;
  ready_final_created: false;
  ready_with_flags_final_created: false;
  blocked_final_created: false;
  manual_review_request_real_created: false;
  reentry_interactions_real_created: false;
  budget_ledger_real_updated?: false;

  export_preview_created: false;
  scr_preview_created?: false;
  evidence_bundle_preview_created?: false;
  mdsb_preview_created?: false;
  parallel_export_payload_created: false;
  produccion_paralela_started: false;
  qa_green_declared?: false;
  shadow_pilot_started?: false;
  full_runtime_authorized?: false;
  production_real_started?: false;

  runtime_40_20_started: false;
  catalog_activated: false;
  migration_applied: false;
  supabase_touched: false;
  sql_executed: false;
  endpoint_created: false;
  service_role_used: false;
  service_role_used_in_client: false;

  object_inventory_created: false;
  mba_write_detected: false;
  scene_write_detected: false;
  parallel_production_runtime_artifacts_write_detected: false;

  diagnosis_created: false;
  ir_created: false;
  registry_created: false;
  phase11_started: false;
  phase12_started?: false;
}
