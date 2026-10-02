import type {
  RuntimeCanonicalVariableServiceLocalResult,
} from "../canonical-variable/runtime-40-20-canonical-variable-types";

export type RuntimeBranchingStatus =
  | "branching_foundation_candidate_created"
  | "blocked_phase7_not_closed"
  | "blocked_phase8_not_authorized"
  | "blocked_missing_explicit_branching_rule"
  | "blocked_missing_source_trace"
  | "blocked_free_text_trigger"
  | "blocked_text_similarity_branching"
  | "blocked_visible_text_trigger"
  | "blocked_satisfaction_general_trigger"
  | "blocked_b7_diagnostic_trigger"
  | "blocked_missing_activation_signal"
  | "blocked_missing_trigger_condition"
  | "blocked_missing_causal_interaction_id"
  | "blocked_causal_opening_attempt_in_8A"
  | "causal_score_candidate_created"
  | "branching_decision_candidate_created"
  | "budget_state_candidate_created"
  | "budget_ledger_candidate_created"
  | "selection_under_budget_candidate_created"
  | "blocked_causal_score_missing_source_trace"
  | "blocked_causal_opening_attempt_in_8B"
  | "blocked_branching_decision_real_creation_attempt"
  | "blocked_budget_ledger_real_update_attempt"
  | "blocked_causal_budget_overflow"
  | "causal_interaction_opening_candidate_created"
  | "non_opening_decision_candidate_created"
  | "reentry_candidate_created"
  | "carry_forward_gap_candidate_created"
  | "budget_exhaustion_guard_created"
  | "blocked_runtime_interaction_instance_real_creation_attempt"
  | "blocked_ui_render_attempt_in_phase8c"
  | "blocked_reentry_without_blocking_gap"
  | "blocked_carry_forward_gap_hidden"
  | "blocked_silent_budget_overflow"
  | "branching_idempotency_replay_guard_created"
  | "branching_audit_candidates_created"
  | "phase9_boundary_created"
  | "phase10_boundary_created"
  | "branching_persistence_boundary_created"
  | "blocked_idempotency_replay_detected"
  | "blocked_duplicate_causal_opening"
  | "blocked_runtime_audit_trail_real_creation_attempt"
  | "blocked_phase9_execution_attempt"
  | "blocked_phase10_execution_attempt"
  | "blocked_branching_persistence_boundary_violation";

export type RuntimeBranchingSignalFamily =
  | "canonical_variable"
  | "route_status"
  | "gap_flag"
  | "c09_receiver_feedback"
  | "b0_weak_context"
  | "b2_transformation_route_missing"
  | "b3_receiver_feedback_rejection_return_block"
  | "b7_low_confidence_preclassification_only"
  | "sem_ambiguity"
  | "pst_wait_deadlock"
  | "object_state_missing"
  | "rework_recurrent"
  | "workaround_residual_variety_informal_rule"
  | "capacity_gap_resource_bargain"
  | "real_sequence_differs_from_official"
  | "low_semantic_confidence_interpersonal_tension";

export type RuntimeBranchingBlockingReason =
  | "phase7_not_closed"
  | "phase8_not_authorized"
  | "missing_explicit_branching_rule"
  | "missing_activation_signal"
  | "missing_trigger_condition"
  | "missing_causal_interaction_id"
  | "missing_source_node_ref"
  | "missing_source_trace"
  | "free_text_branching_detected"
  | "text_similarity_branching_detected"
  | "visible_text_branching_detected"
  | "satisfaction_general_branching_detected"
  | "b7_diagnostic_trigger_detected"
  | "causal_opening_attempted_in_8A"
  | "branching_decision_real_creation_attempted"
  | "budget_ledger_real_update_attempted"
  | "runtime_interaction_instance_real_creation_attempted";

export type RuntimeBranchingCausalScoreComponent =
  | "critical_route_unresolved_plus_5"
  | "b0_unresolved_plus_5"
  | "b2_unresolved_plus_5"
  | "b3_unresolved_plus_5"
  | "b7_unresolved_preclassification_plus_5"
  | "mmabp_contradiction_plus_5"
  | "pm_pf_contradiction_plus_5"
  | "moc_pf_contradiction_plus_5"
  | "pf_olc_contradiction_plus_5"
  | "olc_moc_contradiction_plus_5"
  | "missing_object_state_produced_state_plus_5"
  | "deadlock_wait_loop_rework_plus_4"
  | "receiver_feedback_rejection_return_block_plus_4"
  | "workaround_residual_variety_informal_rule_plus_4"
  | "capacity_gap_resource_bargain_low_plus_3"
  | "real_sequence_differs_from_official_plus_3"
  | "low_semantic_confidence_interpersonal_tension_plus_2"
  | "analytical_curiosity_without_structural_impact_plus_0";

export type RuntimeBranchingDecisionType =
  | "open_causal"
  | "skip_causal"
  | "no_action"
  | "close_by_other"
  | "open_reentry"
  | "carry_forward_gap"
  | "manual_review_required";

export type RuntimeBranchingBudgetBucket =
  | "base"
  | "causal"
  | "microconfirmation"
  | "internal"
  | "reentry";

export type RuntimeBranchingBudgetSelectionBlockingReason =
  | "missing_signal_candidate_ref"
  | "missing_score_source_trace"
  | "score_assigned_to_fabricated_signal"
  | "b7_diagnostic_score_attempted"
  | "curiosity_score_zero_selected"
  | "missing_rule_ref_for_selection"
  | "causal_budget_overflow"
  | "negative_remaining_causal_budget"
  | "budget_state_source_trace_missing"
  | "budget_ledger_real_update_attempted"
  | "branching_decision_real_creation_attempted"
  | "causal_opening_attempted_in_8B"
  | "runtime_interaction_instance_creation_attempted_in_8B"
  | "carry_forward_gap_formal_creation_attempted_in_8B"
  | "reentry_open_attempted_in_8B";

export type RuntimeBranchingOpeningBlockingReason =
  | "missing_selected_branching_decision_candidate"
  | "missing_causal_interaction_id"
  | "missing_budget_ledger_candidate_ref"
  | "runtime_interaction_instance_real_creation_attempted"
  | "shown_at_real_creation_attempted"
  | "answered_at_real_creation_attempted"
  | "ui_render_attempted_in_phase8c"
  | "endpoint_creation_attempted"
  | "hidden_opening_detected"
  | "close_by_other_missing_source"
  | "skip_missing_reason"
  | "no_action_missing_reason"
  | "non_opening_budget_cost_not_zero"
  | "close_by_satisfaction_general_attempted"
  | "close_by_b7_diagnostic_attempted"
  | "reentry_without_blocking_gap"
  | "reentry_missing_source_trace"
  | "reentry_missing_justification"
  | "reentry_by_curiosity_attempted"
  | "readiness_decision_real_creation_attempted"
  | "carry_forward_missing_source_trace"
  | "carry_forward_gap_hidden"
  | "carry_forward_missing_not_opened_candidate"
  | "readiness_gap_record_real_creation_attempted"
  | "silent_budget_overflow"
  | "causal_count_reset_attempted"
  | "budget_ledger_rewrite_attempted"
  | "budget_override_without_authorization";

export type RuntimeBranchingNonOpeningDecisionType =
  | "skip_causal"
  | "close_by_other"
  | "no_action";

export type RuntimeBranchingCarryForwardReason =
  | "budget_exhausted"
  | "lower_priority"
  | "route_not_critical"
  | "no_user_input_required"
  | "duplicate_or_resolved"
  | "manual_review_required";

export type RuntimeBranchingPhase8DBoundaryBlockingReason =
  | "idempotency_replay_detected"
  | "duplicate_causal_opening_detected"
  | "duplicate_budget_ledger_candidate_detected"
  | "obsolete_decision_without_revision_trace"
  | "runtime_audit_trail_real_creation_attempted"
  | "audit_reason_fabricated"
  | "audit_source_trace_missing"
  | "phase9_execution_attempted"
  | "phase10_execution_attempted"
  | "critical_route_gate_execution_attempted"
  | "mmabp_gate_engine_execution_attempted"
  | "semantic_resolution_event_real_creation_attempted"
  | "process_state_timer_event_real_creation_attempted"
  | "route_pass_fail_gap_definitive_creation_attempted"
  | "readiness_engine_execution_attempted"
  | "readiness_decision_record_creation_attempted"
  | "ready_final_creation_attempted"
  | "ready_with_flags_creation_attempted"
  | "blocked_final_creation_attempted"
  | "branching_persistence_boundary_violation"
  | "branching_decision_real_creation_attempted"
  | "budget_ledger_real_update_attempted"
  | "runtime_interaction_instance_real_creation_attempted"
  | "supabase_touch_attempted"
  | "sql_execution_attempted"
  | "endpoint_creation_attempted"
  | "service_role_client_violation"
  | "scene_write_attempted"
  | "mba_write_attempted"
  | "parallel_production_runtime_artifacts_write_attempted"
  | "runtime_real_start_attempted";

export type RuntimeBranchingAuditAction =
  | "branching_evaluation_started"
  | "trigger_evaluated"
  | "trigger_blocked"
  | "causal_score_assigned"
  | "causal_opening_selected"
  | "causal_opening_blocked_by_budget"
  | "causal_skipped_by_rule"
  | "causal_closed_by_other"
  | "reentry_candidate_created"
  | "carry_forward_gap_created"
  | "budget_ledger_candidate_created"
  | "duplicate_opening_blocked"
  | "budget_overflow_blocked"
  | "phase9_execution_blocked"
  | "phase10_execution_blocked"
  | "persistence_boundary_violation_blocked";

export interface RuntimeBranchingCausalScoreCandidate {
  causal_score_candidate_ref: string;
  signal_candidate_ref: string;
  causal_interaction_id: string;
  score_total: number;
  score_components: RuntimeBranchingCausalScoreComponent[];
  severity?: number | string;
  route_criticality?: number | string;
  requires_user_input: boolean;
  score_source_trace: Record<string, unknown>;
  score_candidate_allowed: boolean;
  blocking_reasons: RuntimeBranchingBudgetSelectionBlockingReason[];
}

export interface RuntimeBranchingDecisionCandidate {
  branching_decision_candidate_ref: string;
  branching_decision_real_created: false;
  run_id?: string;
  activity_runtime_run_id?: string;
  source_runtime_interaction_id?: string;
  causal_interaction_id: string;
  decision_type: RuntimeBranchingDecisionType;
  reason: string;
  source_signal_candidate_ref: string;
  causal_score_candidate_ref?: string;
  causal_score?: number;
  budget_bucket?: RuntimeBranchingBudgetBucket;
  source_trace: Record<string, unknown>;
  opened_interaction_id_preview?: string;
  audit_candidate_ref?: string;
  decision_candidate_allowed: boolean;
  blocking_reasons: RuntimeBranchingBudgetSelectionBlockingReason[];
}

export interface RuntimeBranchingBudgetStateCandidate {
  budget_state_candidate_ref: string;
  base_visible_count: number;
  causal_visible_count: number;
  microconfirmation_count: number;
  internal_derivation_count: number;
  reentry_count: number;
  base_limit: 40;
  causal_limit: 20;
  remaining_base_budget: number;
  remaining_causal_budget: number;
  budget_exhausted: boolean;
  budget_bucket: RuntimeBranchingBudgetBucket;
  budget_state_source_trace: Record<string, unknown>;
  budget_state_candidate_allowed: boolean;
  blocking_reasons: RuntimeBranchingBudgetSelectionBlockingReason[];
}

export interface RuntimeBranchingBudgetLedgerCandidate {
  budget_ledger_candidate_ref: string;
  budget_ledger_real_updated: false;
  run_id?: string;
  interaction_id?: string;
  interaction_group?: string;
  bucket: RuntimeBranchingBudgetBucket;
  cost: number;
  count_as_visible: boolean;
  count_as_causal: boolean;
  count_as_reentry: boolean;
  count_as_microconfirmation: boolean;
  budget_before: Record<string, unknown>;
  budget_after: Record<string, unknown>;
  budget_delta: Record<string, unknown>;
  source_branching_decision_ref: string;
  source_trace: Record<string, unknown>;
  ledger_candidate_allowed: boolean;
  blocking_reasons: RuntimeBranchingBudgetSelectionBlockingReason[];
}

export interface RuntimeBranchingSelectionUnderBudgetCandidate {
  selection_candidate_ref: string;
  ordered_signal_refs: string[];
  ordered_score_refs: string[];
  selected_causal_interaction_ids: string[];
  deferred_causal_interaction_ids: string[];
  selection_sort_policy: string;
  severity_tiebreaker_applied: boolean;
  route_criticality_tiebreaker_applied: boolean;
  requires_user_input_checked: boolean;
  causal_count_under_limit: boolean;
  mutual_exclusion_checked: boolean;
  closed_by_other_checked: boolean;
  duplicate_opening_checked: boolean;
  curiosity_score_zero_blocked: boolean;
  missing_rule_ref_blocked: boolean;
  budget_exhausted_defers_to_future_carry_forward: boolean;
  causal_opened: false;
  runtime_interaction_instance_created: false;
  selection_candidate_allowed: boolean;
  blocking_reasons: RuntimeBranchingBudgetSelectionBlockingReason[];
}

export interface RuntimeBranchingCausalInteractionOpeningCandidate {
  opening_candidate_ref: string;
  runtime_interaction_instance_candidate_ref: string;
  runtime_interaction_instance_real_created: false;
  causal_interaction_id: string;
  state: "pending_candidate";
  opened_by_branching_decision_ref: string;
  trigger_source_signal?: string;
  trigger_source_trace: Record<string, unknown>;
  counts_as_visible: boolean;
  counts_as_causal: boolean;
  budget_ledger_candidate_ref?: string;
  user_input_required: boolean;
  shown_at_real_created: false;
  answered_at_real_created: false;
  ui_rendered_real: false;
  endpoint_created: false;
  opening_candidate_allowed: boolean;
  blocking_reasons: RuntimeBranchingOpeningBlockingReason[];
}

export interface RuntimeBranchingNonOpeningDecisionCandidate {
  non_opening_candidate_ref: string;
  decision_type: RuntimeBranchingNonOpeningDecisionType;
  causal_interaction_id?: string;
  skipped_reason?: string;
  closed_by_source_variable_ref?: string;
  closed_by_source_evidence_ref?: string;
  no_action_reason?: string;
  source_trace: Record<string, unknown>;
  budget_cost: 0;
  hidden_opening_created: false;
  audit_candidate_ref?: string;
  non_opening_candidate_allowed: boolean;
  blocking_reasons: RuntimeBranchingOpeningBlockingReason[];
}

export interface RuntimeBranchingReentryCandidate {
  reentry_candidate_ref: string;
  reentry_target: string;
  gap_candidate_ref: string;
  affected_route?: string;
  affected_block?: string;
  reason: string;
  justification_required: true;
  justification_present: boolean;
  route_blocking_status?: string;
  source_trace: Record<string, unknown>;
  counts_as_visible: boolean;
  counts_as_causal: boolean;
  may_exceed_normal_flow: boolean;
  reentry_opened_real: false;
  readiness_decision_real_created: false;
  reentry_candidate_allowed: boolean;
  blocking_reasons: RuntimeBranchingOpeningBlockingReason[];
}

export interface RuntimeBranchingCarryForwardGapCandidate {
  carry_forward_gap_candidate_ref: string;
  budget_exhausted_source: boolean;
  causal_candidate_not_opened: string;
  reason: RuntimeBranchingCarryForwardReason;
  affected_route?: string;
  affected_variable?: string;
  source_signal?: string;
  source_trace: Record<string, unknown>;
  readiness_gap_record_real_created: false;
  gap_hidden: false;
  carry_forward_candidate_allowed: boolean;
  blocking_reasons: RuntimeBranchingOpeningBlockingReason[];
}

export interface RuntimeBranchingBudgetExhaustionGuard {
  causal_limit_reached: boolean;
  attempted_opening_over_20: boolean;
  opening_blocked_due_to_budget: boolean;
  critical_route_blocking_exception_candidate?: boolean;
  reentry_justification_present: boolean;
  budget_override_requested: false;
  silent_overflow_detected: false;
  causal_count_reset: false;
  budget_ledger_rewritten: false;
  budget_exhaustion_audit_candidate_ref?: string;
  budget_exhaustion_guard_passed: boolean;
  blocking_reasons: RuntimeBranchingOpeningBlockingReason[];
}

export interface RuntimeBranchingIdempotencyReplayGuard {
  branching_evaluation_id: string;
  idempotency_key?: string;
  run_state_checksum?: string;
  canonical_variables_checksum?: string;
  budget_state_checksum?: string;
  previous_branching_decision_refs: string[];
  duplicate_opening_detected: boolean;
  idempotency_replay_detected: boolean;
  same_signal_duplicate_causal_blocked: boolean;
  revision_invalidates_obsolete_decision_candidate: boolean;
  duplicate_budget_ledger_candidate_detected: boolean;
  replay_audit_candidate_ref?: string;
  idempotency_guard_passed: boolean;
  blocking_reasons: RuntimeBranchingPhase8DBoundaryBlockingReason[];
}

export interface RuntimeBranchingAuditCandidate {
  audit_candidate_ref: string;
  audit_action: RuntimeBranchingAuditAction;
  case_id?: string;
  run_id?: string;
  branching_evaluation_id?: string;
  source_signal_ref?: string;
  source_branching_decision_ref?: string;
  source_budget_ledger_candidate_ref?: string;
  blocking_reasons: RuntimeBranchingPhase8DBoundaryBlockingReason[];
  source_trace?: Record<string, unknown>;
  created_at_preview?: string;
  real_runtime_audit_trail_created: false;
  supabase_touched: false;
  sql_executed: false;
  endpoint_created: false;
}

export interface RuntimeBranchingPhase9Boundary {
  b0_route_unresolved_signal_ready: boolean;
  b2_transformation_exception_signal_ready: boolean;
  b3_receiver_feedback_c09_signal_ready: boolean;
  b7_low_confidence_c20_signal_ready: boolean;
  sem_ambiguity_microconfirmation_ready: boolean;
  pst_wait_deadlock_reentry_ready: boolean;
  critical_route_gate_executed: false;
  mmabp_gate_engine_executed: false;
  semantic_resolution_event_real_created: false;
  process_state_timer_event_real_created: false;
  route_pass_fail_gap_definitive_created: false;
  readiness_final_created: false;
  phase9_started: false;
  phase9_boundary_passed: boolean;
  blocking_reasons: RuntimeBranchingPhase8DBoundaryBlockingReason[];
}

export interface RuntimeBranchingPhase10Boundary {
  carry_forward_gap_ready_for_future_readiness: boolean;
  reentry_candidate_ready_for_future_readiness: boolean;
  budget_exhausted_ready_for_future_readiness: boolean;
  manual_review_required_candidate: boolean;
  blocked_by_budget_candidate: boolean;
  blocked_by_missing_route_candidate: boolean;
  readiness_engine_executed: false;
  readiness_decision_record_created: false;
  ready_created: false;
  ready_with_flags_created: false;
  blocked_final_created: false;
  export_preview_created: false;
  phase10_started: false;
  phase10_boundary_passed: boolean;
  blocking_reasons: RuntimeBranchingPhase8DBoundaryBlockingReason[];
}

export interface RuntimeBranchingPersistenceBoundary {
  local_branching_decision_candidate_mode: true;
  local_budget_ledger_candidate_mode: true;
  local_runtime_interaction_instance_opening_candidate_mode: true;
  db_write_authorized: false;
  branching_decision_real_created: false;
  budget_ledger_real_updated: false;
  runtime_interaction_instance_real_created: false;
  runtime_audit_trail_real_created: false;
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
  persistence_boundary_passed: boolean;
  blocking_reasons: RuntimeBranchingPhase8DBoundaryBlockingReason[];
}

export interface RuntimePhase8InputRevalidationDecision {
  phase7_closed_local: boolean;
  ready_for_phase8_authorization: boolean;
  phase8_started_local: boolean;
  phase8_closed_local: false;
  ready_for_phase9_authorization: false;
  canonical_variable_candidates_available: boolean;
  route_status_candidates_available: boolean;
  gap_flag_candidates_available: boolean;
  c09_receiver_feedback_boundary_available: boolean;
  b7_non_diagnostic_guard_available: boolean;
  phase8_boundary_from_phase7d_available: boolean;
  branching_engine_previously_executed: false;
  triggers_previously_evaluated: false;
  causal_score_previously_calculated: false;
  branching_decision_real_created: false;
  canonical_variables_recalculated: false;
  phase7_modified: false;
  phase9_started: false;
}

export interface RuntimeBranchingRuleSourceContract {
  branching_rule_ref: string;
  runtime_branching_rule_ref?: string;
  branching_budget_rule_ref?: string;
  activation_signal: string;
  trigger_condition: string;
  reentry_target?: string;
  budget_impact?: string | number | Record<string, unknown>;
  causal_interaction_id: string;
  source_node_ref: string;
  runtime_interaction_mapping_ref?: string;
  critical_route_ref?: string;
  route_status_dependency?: string;
  gap_flag_dependency?: string;
  mapping_checksum?: string;
  explicit_rule_present: boolean;
  source_trace: Record<string, unknown>;
  free_text_branching_used: false;
  text_similarity_branching_used: false;
  visible_text_branching_used: false;
  satisfaction_general_branching_used: false;
}

export interface RuntimeBranchingSignalCandidate {
  signal_candidate_ref: string;
  signal_type: string;
  signal_value?: unknown;
  source_canonical_variable_ref?: string;
  source_route_status?: string;
  source_gap_flag?: boolean;
  source_gap_type?: string;
  source_critical_route_ref?: string;
  source_block_ref?: string;
  source_trace: Record<string, unknown>;
  signal_family: RuntimeBranchingSignalFamily;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeBranchingBlockingReason[];
}

export interface RuntimeBranchingTriggerEvaluationCandidate {
  trigger_evaluation_candidate_ref: string;
  branching_rule_ref: string;
  signal_candidate_ref: string;
  activation_signal_present: boolean;
  trigger_condition_present: boolean;
  trigger_condition_evaluated: boolean;
  trigger_condition_result: boolean;
  signal_source_trace_present: boolean;
  trigger_source_rule_ref_present: boolean;
  causal_interaction_id_present: boolean;
  causal_interaction_exists_in_causal_20: boolean;
  mutual_exclusion_policy_applied: boolean;
  skip_if_resolved_by_other_applied: boolean;
  closed_by_other_applied: boolean;
  trigger_allowed: boolean;
  causal_opened: false;
  branching_decision_real_created: false;
  budget_ledger_real_updated: false;
  blocking_reasons: RuntimeBranchingBlockingReason[];
}

export interface RuntimeBranchingRuleInput {
  branching_rule_ref: string;
  runtime_branching_rule_ref?: string;
  branching_budget_rule_ref?: string;
  activation_signal?: string;
  trigger_condition?: string;
  reentry_target?: string;
  budget_impact?: string | number | Record<string, unknown>;
  causal_interaction_id?: string;
  source_node_ref?: string;
  runtime_interaction_mapping_ref?: string;
  critical_route_ref?: string;
  route_status_dependency?: string;
  gap_flag_dependency?: string;
  mapping_checksum?: string;
  explicit_rule_present?: boolean;
  source_trace?: Record<string, unknown>;
  free_text_branching_used?: boolean;
  text_similarity_branching_used?: boolean;
  visible_text_branching_used?: boolean;
  satisfaction_general_branching_used?: boolean;
  b7_diagnostic_trigger_used?: boolean;
  causal_opening_attempted_in_8a?: boolean;
  mutual_exclusion_policy?: string;
  skip_if_resolved_by_other?: boolean;
  closed_by_other?: boolean;
}

export interface RuntimeBranchingSignalSourceInput {
  signal_family: RuntimeBranchingSignalFamily;
  signal_type: string;
  signal_value?: unknown;
  source_canonical_variable_ref?: string;
  source_route_status?: string;
  source_gap_flag?: boolean;
  source_gap_type?: string;
  source_critical_route_ref?: string;
  source_block_ref?: string;
  source_trace: Record<string, unknown>;
  receiver_feedback_from_satisfaction?: boolean;
  diagnostic_status?: "non_diagnostic" | "diagnostic";
  causal_interaction_id?: string;
  score_components?: RuntimeBranchingCausalScoreComponent[];
  severity?: number | string;
  route_criticality?: number | string;
  requires_user_input?: boolean;
  explicit_rule_ref?: string;
  fabricated_signal?: boolean;
}

export interface RuntimeBranchingFoundationLocalInput {
  case_id: string;
  phase7_closeout: {
    phase7_closed_local: boolean;
    ready_for_phase8_authorization: boolean;
  };
  canonical_variable_result: RuntimeCanonicalVariableServiceLocalResult;
  branching_rules: RuntimeBranchingRuleInput[];
  branching_signal_sources?: RuntimeBranchingSignalSourceInput[];
  causal_interaction_ids: string[];
  budget_state?: {
    base_visible_count?: number;
    causal_visible_count?: number;
    microconfirmation_count?: number;
    internal_derivation_count?: number;
    reentry_count?: number;
    budget_state_source_trace?: Record<string, unknown>;
  };
  options?: {
    run_id?: string;
    activity_runtime_run_id?: string;
  };
  phase8c?: {
    runtime_interaction_instance_real_creation_attempted?: boolean;
    shown_at_real_creation_attempted?: boolean;
    answered_at_real_creation_attempted?: boolean;
    ui_render_attempted_in_phase8c?: boolean;
    endpoint_creation_attempted?: boolean;
    hidden_opening_created?: boolean;
    non_opening_decisions?: Array<{
      decision_type: RuntimeBranchingNonOpeningDecisionType;
      causal_interaction_id?: string;
      skipped_reason?: string;
      closed_by_source_variable_ref?: string;
      closed_by_source_evidence_ref?: string;
      no_action_reason?: string;
      source_trace?: Record<string, unknown>;
      budget_cost?: number;
      hidden_opening_created?: boolean;
      close_by_satisfaction_general_attempted?: boolean;
      close_by_b7_diagnostic_attempted?: boolean;
    }>;
    reentry?: {
      reentry_target?: string;
      gap_candidate_ref?: string;
      affected_route?: string;
      affected_block?: string;
      reason?: string;
      justification_present?: boolean;
      route_blocking_status?: string;
      source_trace?: Record<string, unknown>;
      counts_as_visible?: boolean;
      counts_as_causal?: boolean;
      blocking_gap_present?: boolean;
      reentry_by_curiosity_attempted?: boolean;
      readiness_decision_real_creation_attempted?: boolean;
    };
    carry_forward_gaps?: Array<{
      budget_exhausted_source?: boolean;
      causal_candidate_not_opened?: string;
      reason?: RuntimeBranchingCarryForwardReason;
      affected_route?: string;
      affected_variable?: string;
      source_signal?: string;
      source_trace?: Record<string, unknown>;
      readiness_gap_record_real_creation_attempted?: boolean;
      gap_hidden?: boolean;
    }>;
    budget_guard?: {
      attempted_opening_over_20?: boolean;
      critical_route_blocking_exception_candidate?: boolean;
      reentry_justification_present?: boolean;
      budget_override_requested?: boolean;
      silent_overflow_detected?: boolean;
      causal_count_reset?: boolean;
      budget_ledger_rewritten?: boolean;
    };
  };
  phase8d?: {
    branching_evaluation_id?: string;
    idempotency_key?: string;
    run_state_checksum?: string;
    canonical_variables_checksum?: string;
    budget_state_checksum?: string;
    previous_branching_decision_refs?: string[];
    previous_opened_causal_interaction_ids?: string[];
    previous_budget_ledger_candidate_refs?: string[];
    idempotency_replay_detected?: boolean;
    revision_invalidates_obsolete_decision_candidate?: boolean;
    revision_trace?: Record<string, unknown>;
    audit_actions?: RuntimeBranchingAuditAction[];
    audit_source_trace?: Record<string, unknown>;
    runtime_audit_trail_real_creation_attempted?: boolean;
    audit_reason_fabricated?: boolean;
    phase9_execution_attempted?: boolean;
    phase10_execution_attempted?: boolean;
    critical_route_gate_execution_attempted?: boolean;
    mmabp_gate_engine_execution_attempted?: boolean;
    semantic_resolution_event_real_creation_attempted?: boolean;
    process_state_timer_event_real_creation_attempted?: boolean;
    route_pass_fail_gap_definitive_creation_attempted?: boolean;
    readiness_engine_execution_attempted?: boolean;
    readiness_decision_record_creation_attempted?: boolean;
    ready_final_creation_attempted?: boolean;
    ready_with_flags_creation_attempted?: boolean;
    blocked_final_creation_attempted?: boolean;
    branching_persistence_boundary_violation?: boolean;
    branching_decision_real_creation_attempted?: boolean;
    budget_ledger_real_update_attempted?: boolean;
    runtime_interaction_instance_real_creation_attempted?: boolean;
    supabase_touch_attempted?: boolean;
    sql_execution_attempted?: boolean;
    endpoint_creation_attempted?: boolean;
    service_role_client_violation?: boolean;
    scene_write_attempted?: boolean;
    mba_write_attempted?: boolean;
    parallel_production_runtime_artifacts_write_attempted?: boolean;
    runtime_real_start_attempted?: boolean;
  };
}

export interface RuntimeBranchingFoundationLocalResult {
  status: RuntimeBranchingStatus;
  phase8_input_revalidation: RuntimePhase8InputRevalidationDecision;
  branching_rule_source_contracts: RuntimeBranchingRuleSourceContract[];
  signal_candidates: RuntimeBranchingSignalCandidate[];
  trigger_evaluation_candidates: RuntimeBranchingTriggerEvaluationCandidate[];
  causal_score_candidates?: RuntimeBranchingCausalScoreCandidate[];
  branching_decision_candidates?: RuntimeBranchingDecisionCandidate[];
  budget_state_candidates?: RuntimeBranchingBudgetStateCandidate[];
  budget_ledger_candidates?: RuntimeBranchingBudgetLedgerCandidate[];
  selection_under_budget_candidates?: RuntimeBranchingSelectionUnderBudgetCandidate[];
  causal_interaction_opening_candidates?: RuntimeBranchingCausalInteractionOpeningCandidate[];
  non_opening_decision_candidates?: RuntimeBranchingNonOpeningDecisionCandidate[];
  reentry_candidates?: RuntimeBranchingReentryCandidate[];
  carry_forward_gap_candidates?: RuntimeBranchingCarryForwardGapCandidate[];
  budget_exhaustion_guards?: RuntimeBranchingBudgetExhaustionGuard[];
  idempotency_replay_guards?: RuntimeBranchingIdempotencyReplayGuard[];
  branching_audit_candidates?: RuntimeBranchingAuditCandidate[];
  phase9_boundaries?: RuntimeBranchingPhase9Boundary[];
  phase10_boundaries?: RuntimeBranchingPhase10Boundary[];
  branching_persistence_boundaries?: RuntimeBranchingPersistenceBoundary[];
  phase8_started_local: boolean;
  phase8_closed_local: false;
  ready_for_phase9_authorization: false;
  runtime_40_20_started: false;
  catalog_activated: false;
  migration_applied: false;
  supabase_touched: false;
  sql_executed: false;
  endpoint_created: false;
  branching_decision_real_created: false;
  budget_ledger_real_updated: false;
  runtime_interaction_instance_real_created: false;
  causal_score_calculated: false;
  causal_opened: false;
  reentry_opened: false;
  carry_forward_gap_formal_created?: false;
  critical_route_gate_executed: false;
  mmabp_gate_engine_executed: false;
  readiness_engine_executed: false;
  export_preview_created: false;
  diagnosis_created: false;
  ir_created: false;
  registry_created: false;
  phase9_started: false;
  service_role_used: false;
  service_role_used_in_client: false;
}
