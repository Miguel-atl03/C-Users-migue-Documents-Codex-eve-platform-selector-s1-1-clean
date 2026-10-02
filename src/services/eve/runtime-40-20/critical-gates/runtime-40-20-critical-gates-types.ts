import type {
  RuntimeBranchingBudgetExhaustionGuard,
  RuntimeBranchingCarryForwardGapCandidate,
  RuntimeBranchingCausalScoreCandidate,
  RuntimeBranchingDecisionCandidate,
  RuntimeBranchingFoundationLocalResult,
  RuntimeBranchingReentryCandidate,
  RuntimeBranchingSignalCandidate,
  RuntimeBranchingTriggerEvaluationCandidate,
} from "../branching-budget/runtime-40-20-branching-budget-types";

export type RuntimeCriticalGateStatus =
  | "critical_gate_framework_candidate_created"
  | "b0_semantic_entry_gate_candidate_created"
  | "b2_transformation_exception_gate_candidate_created"
  | "b3_receiver_feedback_gate_candidate_created"
  | "b7_c20_non_diagnostic_gate_candidate_created"
  | "critical_route_gate_result_candidate_created"
  | "blocked_phase8_not_closed"
  | "blocked_phase9_not_authorized"
  | "blocked_missing_source_trace"
  | "blocked_readiness_final_creation_attempt"
  | "blocked_b7_projection_attempt"
  | "blocked_external_projection_attempt";

export type RuntimeSemanticGateStatus =
  | "semantic_resolution_gate_candidate_created"
  | "sem001_state_as_class_candidate_created"
  | "sem002_attribute_as_class_candidate_created"
  | "sem003_process_as_object_candidate_created"
  | "sem004_false_isa_candidate_created"
  | "sem005_alias_duplicate_candidate_created"
  | "sem006_role_phase_end_candidate_created"
  | "sem007_fused_marsupial_candidate_created"
  | "blocked_missing_source_trace"
  | "blocked_projection_despite_semantic_gate"
  | "blocked_semantic_resolution_event_real_creation_attempt"
  | "blocked_structural_projection_attempt";

export type RuntimePSTGateStatus =
  | "process_state_timer_gate_candidate_created"
  | "pst001_wait_without_awaited_event_candidate_created"
  | "pst002_missing_release_condition_candidate_created"
  | "pst003_missing_timer_or_timeout_candidate_created"
  | "pst004_missing_timeout_state_candidate_created"
  | "pst005_missing_resolver_owner_candidate_created"
  | "pst006_missing_exit_path_candidate_created"
  | "semantic_resolution_event_contract_candidate_created"
  | "process_state_timer_event_contract_candidate_created"
  | "blocked_missing_source_trace"
  | "blocked_invalid_process_state_accepted"
  | "blocked_process_state_timer_event_real_creation_attempt"
  | "blocked_olc_transition_without_timeout_state"
  | "blocked_incomplete_pf_projection_attempt";

export type RuntimeGapAuditBoundaryStatus =
  | "readiness_gap_record_candidate_created"
  | "runtime_audit_trail_candidate_created"
  | "gate_outcome_readiness_boundary_candidate_created"
  | "object_inventory_boundary_candidate_created"
  | "control_plane_boundary_candidate_created"
  | "persistence_boundary_candidate_created"
  | "blocked_missing_source_trace"
  | "blocked_readiness_real_creation_attempt"
  | "blocked_object_inventory_real_creation_attempt"
  | "blocked_control_plane_write_attempt"
  | "blocked_gate_persistence_boundary_violation";

export type RuntimeGateAuditAction =
  | "gate_evaluation_started"
  | "critical_route_gate_evaluated"
  | "semantic_resolution_event_candidate_created"
  | "process_state_timer_event_candidate_created"
  | "readiness_gap_candidate_created"
  | "gate_blocked_projection"
  | "gate_passed_candidate"
  | "manual_review_required"
  | "reentry_required_candidate"
  | "readiness_boundary_blocked"
  | "object_inventory_boundary_blocked"
  | "control_plane_projection_blocked"
  | "persistence_boundary_blocked";

export type RuntimeGapAuditBoundaryBlockingReason =
  | "missing_gap_type"
  | "missing_affected_gate"
  | "missing_source_gate_candidate_ref"
  | "missing_source_trace"
  | "missing_finding_code"
  | "missing_audit_action"
  | "unsupported_audit_action"
  | "missing_audit_reason"
  | "missing_source_gate_result_candidate_ref"
  | "missing_protected_object_hint"
  | "missing_future_object_family"
  | "readiness_gap_record_real_creation_attempted"
  | "runtime_audit_trail_real_creation_attempted"
  | "readiness_decision_record_real_creation_attempted"
  | "readiness_engine_execution_attempted"
  | "ready_creation_attempted"
  | "ready_with_flags_creation_attempted"
  | "blocked_final_creation_attempted"
  | "object_inventory_real_creation_attempted"
  | "eve_object_definition_creation_attempted"
  | "runtime_object_binding_real_creation_attempted"
  | "object_materialization_event_creation_attempted"
  | "live_object_materialization_attempted"
  | "f5c_real_open_attempted"
  | "control_plane_write_attempted"
  | "mba_event_ledger_write_attempted"
  | "mba_transition_findings_write_attempted"
  | "mba_compliance_reports_write_attempted"
  | "outbox_real_creation_attempted"
  | "handoff_boundary_real_creation_attempted"
  | "review_control_real_creation_attempted"
  | "parallel_production_start_attempted"
  | "db_write_attempted"
  | "gate_result_real_creation_attempted"
  | "semantic_resolution_event_real_creation_attempted"
  | "process_state_timer_event_real_creation_attempted"
  | "supabase_touch_attempted"
  | "sql_execution_attempted"
  | "endpoint_creation_attempted"
  | "service_role_use_attempted"
  | "service_role_client_use_attempted"
  | "scene_write_attempted"
  | "mba_write_attempted"
  | "parallel_production_runtime_artifacts_write_attempted"
  | "export_preview_creation_attempted"
  | "runtime_40_20_start_attempted"
  | "phase10_start_attempted";

export type RuntimePSTGateCode =
  | "PST-001"
  | "PST-002"
  | "PST-003"
  | "PST-004"
  | "PST-005"
  | "PST-006";

export type RuntimePSTGateBlockingReason =
  | "missing_pst_code"
  | "missing_process_state_candidate_ref"
  | "missing_source_trace"
  | "missing_awaited_event"
  | "missing_release_condition"
  | "missing_timer_or_timeout_rule"
  | "missing_timeout_state"
  | "missing_resolver_owner"
  | "missing_exit_path"
  | "invalid_process_state_accepted"
  | "pf_projection_attempted_despite_block"
  | "olc_transition_attempted_without_timeout_state"
  | "process_state_timer_event_real_creation_attempted"
  | "semantic_resolution_event_real_creation_attempted"
  | "readiness_gap_record_real_creation_attempted"
  | "runtime_audit_trail_real_creation_attempted"
  | "mba_projection_attempted"
  | "scene_projection_attempted"
  | "export_projection_attempted";

export type RuntimeSemanticGateCode =
  | "SEM-001"
  | "SEM-002"
  | "SEM-003"
  | "SEM-004"
  | "SEM-005"
  | "SEM-006"
  | "SEM-007";

export type RuntimeSemanticAmbiguityType =
  | "state_as_class"
  | "attribute_as_class"
  | "process_as_object"
  | "false_isa_by_type_of"
  | "alias_or_duplicate"
  | "role_phase_end_confusion"
  | "fused_object"
  | "marsupial_object";

export type RuntimeSemanticGateBlockingReason =
  | "missing_sem_code"
  | "missing_target_term"
  | "missing_ambiguity_type"
  | "missing_source_trace"
  | "projection_attempted_despite_blocks_projection"
  | "concept_candidate_accepted_despite_state_as_class"
  | "moc_class_candidate_accepted_despite_attribute_as_class"
  | "object_state_candidate_accepted_despite_process_as_object"
  | "isa_candidate_accepted_despite_false_isa"
  | "duplicate_class_created_from_alias"
  | "static_moc_candidate_accepted_despite_role_phase_end"
  | "fused_olc_created"
  | "semantic_resolution_event_real_creation_attempted"
  | "readiness_gap_record_real_creation_attempted"
  | "runtime_audit_trail_real_creation_attempted"
  | "object_inventory_creation_attempted"
  | "mba_projection_attempted"
  | "scene_projection_attempted"
  | "export_projection_attempted";

export type RuntimePhase9CriticalGatesLocalStatus =
  | RuntimeCriticalGateStatus
  | RuntimeSemanticGateStatus
  | RuntimePSTGateStatus
  | RuntimeGapAuditBoundaryStatus;

export type RuntimeCriticalGateFamily =
  | "B0_semantic_entry"
  | "B2_transformation_exception"
  | "B3_receiver_feedback"
  | "B7_non_diagnostic_boundary";

export type RuntimeCriticalGateOutcome =
  | "passed_candidate"
  | "blocked_by_missing_evidence"
  | "blocked_by_missing_canonical_route"
  | "blocked_by_semantic_ambiguity"
  | "blocked_by_timer_gap"
  | "manual_review_required"
  | "reentry_required_candidate";

export type RuntimeCriticalGateBlockingReason =
  | "phase8_not_closed"
  | "phase9_not_authorized"
  | "missing_protected_route_id"
  | "missing_protected_object_hint"
  | "missing_source_trace"
  | "missing_finding_code"
  | "missing_required_b0_subfield"
  | "preload_not_confirmed"
  | "ambiguous_activity_text"
  | "textual_exception_without_closed_route"
  | "free_text_closed_variable_attempted"
  | "pf_olc_projection_without_closed_route"
  | "receiver_satisfaction_as_feedback_attempted"
  | "ambiguous_comment_as_receiver_feedback_attempted"
  | "c09_closed_by_wrong_route_attempted"
  | "b7_diagnostic_projection_attempted"
  | "b7_registry_projection_attempted"
  | "b7_ir_projection_attempted"
  | "b7_export_projection_attempted"
  | "readiness_final_creation_attempted"
  | "scene_canonical_record_real_creation_attempted"
  | "receiver_feedback_object_real_creation_attempted"
  | "external_projection_attempted";

export interface RuntimePhase9InputRevalidationDecision {
  phase8_closed_local: boolean;
  ready_for_phase9_authorization: boolean;
  phase9_started_local: boolean;
  phase9_closed_local: false;
  ready_for_phase10_authorization: false;
  branching_decision_candidates_available: boolean;
  trigger_evaluation_candidates_available: boolean;
  causal_score_candidates_available: boolean;
  route_status_candidates_available: boolean;
  gap_flag_candidates_available: boolean;
  carry_forward_gap_candidates_available: boolean;
  reentry_candidates_available: boolean;
  budget_exhaustion_guards_available: boolean;
  phase9_boundary_from_phase8d_available: boolean;
  critical_route_gate_previously_executed: false;
  mmabp_gate_engine_previously_executed: false;
  semantic_resolution_event_real_previously_created: false;
  process_state_timer_event_real_previously_created: false;
  readiness_decision_record_real_previously_created: false;
  branching_recalculated: false;
  phase8_modified: false;
  phase10_started: false;
}

export interface RuntimeCriticalGateEvaluationCandidate {
  gate_evaluation_candidate_ref: string;
  gate_id: string;
  gate_family: RuntimeCriticalGateFamily;
  protected_route_id: string;
  protected_object_hint: string;
  future_object_family?: string;
  source_variable_refs: string[];
  source_evidence_refs: string[];
  source_branching_decision_refs: string[];
  source_trace: Record<string, unknown>;
  gate_outcome: RuntimeCriticalGateOutcome;
  contamination_blocked: boolean;
  finding_code: string;
  summary_ready: true;
  projected_to_mba: false;
  runtime_audit_candidate_ref?: string;
  runtime_audit_trail_real_created: false;
  readiness_final_created: false;
  export_preview_created: false;
  gate_candidate_allowed: boolean;
  blocking_reasons: RuntimeCriticalGateBlockingReason[];
}

export interface RuntimeB0SemanticEntryGateCandidate {
  b0_gate_candidate_ref: string;
  b0_q01_protected: true;
  semantic_entry_route: string;
  protected_object_hint: string;
  action_verb_present: boolean;
  input_or_object_present: boolean;
  procedure_or_standard_present: boolean;
  output_or_result_present: boolean;
  user_correction_note_preserved: boolean;
  semantic_confirmation_status?: string;
  preload_confirmed: boolean;
  ambiguous_activity_text_blocked: boolean;
  minimum_structure_present: boolean;
  readiness_gap_record_candidate_created: boolean;
  reentry_required_candidate_created: boolean;
  finding_code: "b0_semantic_entry_blocked";
  ready_declared: false;
  scene_canonical_record_real_created: false;
  source_trace: Record<string, unknown>;
  blocking_reasons: RuntimeCriticalGateBlockingReason[];
}

export interface RuntimeB2TransformationExceptionGateCandidate {
  b2_gate_candidate_ref: string;
  transformation_exception_route: string;
  protected_object_hint: string;
  transformation_exception_exists?: boolean;
  transformation_exception_type?: string;
  transformation_exception_description?: string;
  transformation_exception_route_unresolved: boolean;
  textual_exception_separated_from_closed_route: boolean;
  textual_exception_without_closed_route_blocked: boolean;
  blocked_by_missing_canonical_route_candidate_created: boolean;
  route_gap_candidate_created: boolean;
  readiness_gap_record_candidate_created: boolean;
  finding_code: "transformation_exception_route_unresolved";
  closed_variable_from_free_text_created: false;
  pf_olc_projection_without_closed_route: false;
  source_trace: Record<string, unknown>;
  blocking_reasons: RuntimeCriticalGateBlockingReason[];
}

export interface RuntimeB3ReceiverFeedbackGateCandidate {
  b3_gate_candidate_ref: string;
  cr_b3_r9_c09_route: string;
  protected_object_hint: string;
  receiver_feedback_exists: boolean;
  receiver_feedback?: string;
  receiver_feedback_gap_flag: boolean;
  receiver_feedback_route_missing: boolean;
  receiver_satisfaction_separated: true;
  delivery_failure_separated: true;
  satisfaction_general_as_feedback_blocked: boolean;
  ambiguous_comment_as_receiver_feedback_blocked: boolean;
  c09_closed_by_wrong_route: false;
  route_missing_preserved_when_no_canonical_route: boolean;
  readiness_gap_record_candidate_created: boolean;
  finding_code: "receiver_feedback_route_missing";
  handoff_feedback_closed_without_canonical_route: false;
  receiver_feedback_object_real_created: false;
  source_trace: Record<string, unknown>;
  blocking_reasons: RuntimeCriticalGateBlockingReason[];
}

export interface RuntimeB7C20NonDiagnosticBoundaryGateCandidate {
  b7_gate_candidate_ref: string;
  b7_q39_boundary_supported: boolean;
  b7_q40_boundary_supported: boolean;
  c20_boundary_supported: boolean;
  protected_object_hint: string;
  diagnostic_status_non_diagnostic: true;
  signal_status_preclassification_only: true;
  confidence_supported: boolean;
  uncertainty_supported: boolean;
  microconfirmation_refs_supported: boolean;
  moc_direct_blocked: boolean;
  registry_direct_blocked: boolean;
  ir_direct_blocked: boolean;
  export_direct_blocked: boolean;
  diagnosis_blocked: boolean;
  root_cause_blocked: boolean;
  monetization_blocked: boolean;
  final_narrative_blocked: boolean;
  vsm_ahe_final_blocked: boolean;
  readiness_gap_record_candidate_created_if_elevation_attempted: boolean;
  finding_code: "b7_non_diagnostic_boundary_violation";
  export_preview_created: false;
  source_trace: Record<string, unknown>;
  blocking_reasons: RuntimeCriticalGateBlockingReason[];
}

export interface RuntimeCriticalRouteGateResultCandidate {
  critical_route_gate_result_candidate_ref: string;
  gate_family: RuntimeCriticalGateFamily;
  route_id: string;
  route_status_before?: string;
  route_status_after_candidate?: string;
  protected_route_id: string;
  protected_object_hint: string;
  evidence_sufficient: boolean;
  canonical_route_closed: boolean;
  route_missing: boolean;
  gap_flag: boolean;
  gap_type?: string;
  manual_review_required: boolean;
  reentry_target_candidate?: string;
  finding_code: string;
  source_trace: Record<string, unknown>;
  gate_result_real_created: false;
  readiness_final_created: false;
  phase10_started: false;
  blocking_reasons: RuntimeCriticalGateBlockingReason[];
}

export interface RuntimeSemanticResolutionGateCandidate {
  semantic_gate_candidate_ref: string;
  runtime_semantic_gate_ref?: string;
  sem_code: RuntimeSemanticGateCode;
  target_term: string;
  ambiguity_type: RuntimeSemanticAmbiguityType;
  protected_object_hint?: string;
  blocks_projection: boolean;
  action?: string;
  source_variable_refs: string[];
  source_evidence_refs: string[];
  source_trace: Record<string, unknown>;
  readiness_gap_record_candidate_created: boolean;
  runtime_audit_candidate_ref?: string;
  semantic_resolution_event_real_created: false;
  readiness_gap_record_real_created: false;
  runtime_audit_trail_real_created: false;
  accepted_structural_candidate_created: false;
  gate_candidate_allowed: boolean;
  blocking_reasons: RuntimeSemanticGateBlockingReason[];
}

export interface RuntimeSEM001StateAsClassGateCandidate {
  sem001_candidate_ref: string;
  target_term: string;
  source_variable_ref?: string;
  source_trace: Record<string, unknown>;
  state_as_class_detected: boolean;
  moc_class_projection_blocked: boolean;
  blocks_projection: boolean;
  readiness_gap_record_candidate_created: boolean;
  finding_code: "semantic_resolution_blocked";
  concept_candidate_accepted: false;
  semantic_resolution_event_real_created: false;
  blocking_reasons: RuntimeSemanticGateBlockingReason[];
}

export interface RuntimeSEM002AttributeAsClassGateCandidate {
  sem002_candidate_ref: string;
  target_term: string;
  source_variable_ref?: string;
  source_trace: Record<string, unknown>;
  attribute_as_class_detected: boolean;
  separate_class_projection_blocked: boolean;
  blocks_projection: boolean;
  readiness_gap_record_candidate_created: boolean;
  finding_code: "semantic_resolution_blocked";
  moc_class_candidate_accepted: false;
  semantic_resolution_event_real_created: false;
  blocking_reasons: RuntimeSemanticGateBlockingReason[];
}

export interface RuntimeSEM003ProcessAsObjectGateCandidate {
  sem003_candidate_ref: string;
  target_term: string;
  source_variable_ref?: string;
  source_trace: Record<string, unknown>;
  process_as_object_detected: boolean;
  object_projection_blocked: boolean;
  blocks_projection: boolean;
  readiness_gap_record_candidate_created: boolean;
  finding_code: "semantic_resolution_blocked";
  object_state_candidate_accepted: false;
  semantic_resolution_event_real_created: false;
  blocking_reasons: RuntimeSemanticGateBlockingReason[];
}

export interface RuntimeSEM004FalseISAByTypeOfGateCandidate {
  sem004_candidate_ref: string;
  target_term: string;
  source_variable_ref?: string;
  source_trace: Record<string, unknown>;
  false_isa_by_type_of_detected: boolean;
  isa_projection_blocked: boolean;
  attribute_vs_specialization_resolution_required: boolean;
  blocks_projection: boolean;
  readiness_gap_record_candidate_created: boolean;
  finding_code: "semantic_resolution_blocked";
  isa_candidate_accepted: false;
  semantic_resolution_event_real_created: false;
  blocking_reasons: RuntimeSemanticGateBlockingReason[];
}

export interface RuntimeSEM005AliasOrDuplicateGateCandidate {
  sem005_candidate_ref: string;
  target_term: string;
  alias_target_candidate?: string;
  source_trace: Record<string, unknown>;
  alias_or_duplicate_detected: boolean;
  alias_preserved_without_duplicate_class: boolean;
  duplicate_class_blocked: boolean;
  blocks_projection: boolean;
  readiness_gap_record_candidate_created: boolean;
  finding_code: "semantic_resolution_blocked";
  duplicate_class_created: false;
  semantic_resolution_event_real_created: false;
  blocking_reasons: RuntimeSemanticGateBlockingReason[];
}

export interface RuntimeSEM006RolePhaseEndConfusionGateCandidate {
  sem006_candidate_ref: string;
  target_term: string;
  source_variable_ref?: string;
  source_trace: Record<string, unknown>;
  role_phase_end_confusion_detected: boolean;
  role_as_static_class_blocked: boolean;
  phase_as_static_class_blocked: boolean;
  end_as_static_class_blocked: boolean;
  dynamic_resolution_required: boolean;
  blocks_projection: boolean;
  readiness_gap_record_candidate_created: boolean;
  finding_code: "semantic_resolution_blocked";
  static_moc_candidate_accepted: false;
  semantic_resolution_event_real_created: false;
  blocking_reasons: RuntimeSemanticGateBlockingReason[];
}

export interface RuntimeSEM007FusedMarsupialObjectGateCandidate {
  sem007_candidate_ref: string;
  target_term: string;
  object_candidate_refs: string[];
  source_trace: Record<string, unknown>;
  fused_object_detected: boolean;
  marsupial_object_detected: boolean;
  fused_olc_blocked: boolean;
  object_separation_required: boolean;
  blocks_projection: boolean;
  readiness_gap_record_candidate_created: boolean;
  finding_code: "semantic_resolution_blocked";
  olc_fused_created: false;
  semantic_resolution_event_real_created: false;
  blocking_reasons: RuntimeSemanticGateBlockingReason[];
}

export interface RuntimeProcessStateTimerGateCandidate {
  pst_gate_candidate_ref: string;
  runtime_pst_gate_ref?: string;
  pst_code: RuntimePSTGateCode;
  process_state_candidate_ref: string;
  awaited_event?: string;
  release_condition?: string;
  timer_or_timeout_rule?: string;
  timeout_state?: string;
  resolver_owner?: string;
  exit_path?: string;
  deadlock_risk: boolean;
  source_trace: Record<string, unknown>;
  readiness_gap_record_candidate_created: boolean;
  runtime_audit_candidate_ref?: string;
  process_state_timer_event_real_created: false;
  readiness_gap_record_real_created: false;
  runtime_audit_trail_real_created: false;
  pf_projection_accepted: false;
  olc_transition_accepted: false;
  gate_candidate_allowed: boolean;
  blocking_reasons: RuntimePSTGateBlockingReason[];
}

export interface RuntimePST001WaitWithoutAwaitedEventCandidate {
  pst001_candidate_ref: string;
  process_state_candidate_ref: string;
  wait_without_awaited_event_detected: boolean;
  awaited_event_present: boolean;
  source_trace: Record<string, unknown>;
  process_state_blocked: boolean;
  readiness_gap_record_candidate_created: boolean;
  finding_code: "process_state_without_timer_or_exit";
  pf_process_state_valid: false;
  process_state_timer_event_real_created: false;
  blocking_reasons: RuntimePSTGateBlockingReason[];
}

export interface RuntimePST002MissingReleaseConditionCandidate {
  pst002_candidate_ref: string;
  process_state_candidate_ref: string;
  missing_release_condition_detected: boolean;
  release_condition_present: boolean;
  source_trace: Record<string, unknown>;
  exit_blocked: boolean;
  deadlock_risk: boolean;
  readiness_gap_record_candidate_created: boolean;
  state_closed: false;
  process_state_timer_event_real_created: false;
  blocking_reasons: RuntimePSTGateBlockingReason[];
}

export interface RuntimePST003MissingTimerOrTimeoutRuleCandidate {
  pst003_candidate_ref: string;
  process_state_candidate_ref: string;
  missing_timer_or_timeout_rule_detected: boolean;
  timer_or_timeout_rule_present: boolean;
  source_trace: Record<string, unknown>;
  strong_wait_without_timer_blocked: boolean;
  readiness_gap_record_candidate_created: boolean;
  process_state_valid: false;
  process_state_timer_event_real_created: false;
  blocking_reasons: RuntimePSTGateBlockingReason[];
}

export interface RuntimePST004MissingTimeoutStateCandidate {
  pst004_candidate_ref: string;
  process_state_candidate_ref: string;
  missing_timeout_state_detected: boolean;
  timeout_state_present: boolean;
  source_trace: Record<string, unknown>;
  olc_transition_blocked: boolean;
  readiness_gap_record_candidate_created: boolean;
  closed_causal_transition_created: false;
  process_state_timer_event_real_created: false;
  blocking_reasons: RuntimePSTGateBlockingReason[];
}

export interface RuntimePST005MissingResolverOwnerCandidate {
  pst005_candidate_ref: string;
  process_state_candidate_ref: string;
  missing_resolver_owner_detected: boolean;
  resolver_owner_present: boolean;
  source_trace: Record<string, unknown>;
  deadlock_risk: boolean;
  readiness_gap_record_candidate_created: boolean;
  wait_closed_as_governed: false;
  process_state_timer_event_real_created: false;
  blocking_reasons: RuntimePSTGateBlockingReason[];
}

export interface RuntimePST006MissingExitPathCandidate {
  pst006_candidate_ref: string;
  process_state_candidate_ref: string;
  missing_exit_path_detected: boolean;
  exit_path_present: boolean;
  source_trace: Record<string, unknown>;
  incomplete_pf_blocked: boolean;
  readiness_gap_record_candidate_created: boolean;
  pf_process_state_valid: false;
  process_state_timer_event_real_created: false;
  blocking_reasons: RuntimePSTGateBlockingReason[];
}

export interface RuntimeSemanticResolutionEventContractCandidate {
  semantic_event_candidate_ref: string;
  semantic_resolution_event_real_created: false;
  run_id?: string;
  gate_id: string;
  target_term: string;
  ambiguity_type: string;
  outcome: string;
  action?: string;
  blocks_projection: boolean;
  protected_object_hint?: string;
  source_variable_refs: string[];
  source_evidence_refs: string[];
  source_trace: Record<string, unknown>;
  finding_code: string;
  projected_to_mba: false;
  accepted_structural_candidate_created: false;
  blocking_reasons: RuntimePSTGateBlockingReason[];
}

export interface RuntimeProcessStateTimerEventContractCandidate {
  pst_event_candidate_ref: string;
  process_state_timer_event_real_created: false;
  run_id?: string;
  gate_id: string;
  process_state_candidate_ref: string;
  awaited_event?: string;
  release_condition?: string;
  timer_rule?: string;
  timeout_state?: string;
  resolver_owner?: string;
  exit_path?: string;
  deadlock_risk: boolean;
  source_trace: Record<string, unknown>;
  finding_code: string;
  projected_to_mba: false;
  pf_incomplete: boolean;
  blocking_reasons: RuntimePSTGateBlockingReason[];
}

export interface RuntimeReadinessGapRecordCandidate {
  readiness_gap_candidate_ref: string;
  readiness_gap_record_real_created: false;
  run_id?: string;
  gap_type: string;
  affected_route?: string;
  affected_quadrant?: string;
  affected_gate: string;
  severity?: string;
  reentry_target?: string;
  manual_review_required: boolean;
  source_gate_candidate_ref: string;
  source_trace: Record<string, unknown>;
  gap_reason?: string;
  finding_code: string;
  summary_ready: true;
  projected_to_mba: false;
  readiness_final_created: false;
  blocking_reasons: RuntimeGapAuditBoundaryBlockingReason[];
}

export interface RuntimeGateAuditTrailCandidate {
  runtime_audit_candidate_ref: string;
  runtime_audit_trail_real_created: false;
  audit_action: RuntimeGateAuditAction;
  run_id?: string;
  gate_id?: string;
  source_gate_candidate_ref?: string;
  source_gap_candidate_ref?: string;
  source_trace: Record<string, unknown>;
  audit_reason: string;
  created_at_preview?: string;
  supabase_touched: false;
  sql_executed: false;
  endpoint_created: false;
  blocking_reasons: RuntimeGapAuditBoundaryBlockingReason[];
}

export interface RuntimeGateOutcomeReadinessBoundary {
  readiness_input_candidate_ref: string;
  source_gate_result_candidate_ref: string;
  source_readiness_gap_candidate_refs: string[];
  manual_review_required: boolean;
  reentry_required_candidate: boolean;
  carry_forward_gap_refs: string[];
  blocked_by_missing_route: boolean;
  blocked_by_semantic_gate: boolean;
  blocked_by_pst_gate: boolean;
  readiness_engine_executed: false;
  readiness_decision_record_real_created: false;
  ready_created: false;
  ready_with_flags_created: false;
  blocked_final_created: false;
  export_preview_created: false;
  phase10_started: false;
  boundary_passed: boolean;
  blocking_reasons: RuntimeGapAuditBoundaryBlockingReason[];
}

export interface RuntimeGateObjectInventoryBoundary {
  object_inventory_boundary_candidate_ref: string;
  gate_id?: string;
  protected_object_hint: string;
  future_object_family: string;
  object_binding_status: "pending_candidate" | "not_applicable";
  runtime_object_binding_ref?: string;
  object_inventory_created: false;
  eve_object_definition_created: false;
  runtime_object_binding_real_created: false;
  object_materialization_event_created: false;
  live_object_materialized: false;
  f5c_real_opened: false;
  object_boundary_passed: boolean;
  blocking_reasons: RuntimeGapAuditBoundaryBlockingReason[];
}

export interface RuntimeGateControlPlaneBoundary {
  control_plane_boundary_candidate_ref: string;
  finding_code: string;
  summary_ready: true;
  projected_to_mba: false;
  mba_event_ledger_written: false;
  mba_transition_findings_written: false;
  mba_compliance_reports_written: false;
  outbox_real_created: false;
  handoff_boundary_real_created: false;
  review_control_real_created: false;
  parallel_production_started: false;
  source_trace: Record<string, unknown>;
  control_plane_boundary_passed: boolean;
  blocking_reasons: RuntimeGapAuditBoundaryBlockingReason[];
}

export interface RuntimeGatePersistenceBoundary {
  persistence_boundary_candidate_ref: string;
  local_gate_evaluation_candidate_mode: true;
  local_readiness_gap_record_candidate_mode: true;
  local_semantic_resolution_event_candidate_mode: true;
  local_process_state_timer_event_candidate_mode: true;
  local_runtime_audit_trail_candidate_mode: true;
  db_write_authorized: false;
  gate_result_real_created: false;
  readiness_gap_record_real_created: false;
  semantic_resolution_event_real_created: false;
  process_state_timer_event_real_created: false;
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
  blocking_reasons: RuntimeGapAuditBoundaryBlockingReason[];
}

export interface RuntimeCriticalGateEvaluationSourceInput {
  gate_id: string;
  gate_family: RuntimeCriticalGateFamily;
  protected_route_id?: string;
  protected_object_hint?: string;
  future_object_family?: string;
  source_variable_refs?: string[];
  source_evidence_refs?: string[];
  source_branching_decision_refs?: string[];
  source_trace?: Record<string, unknown>;
  gate_outcome?: RuntimeCriticalGateOutcome;
  contamination_blocked?: boolean;
  finding_code?: string;
  runtime_audit_candidate_ref?: string;
  readiness_final_creation_attempted?: boolean;
  external_projection_attempted?: boolean;
}

export interface RuntimeB0SemanticEntryGateInput {
  b0_gate_candidate_ref?: string;
  semantic_entry_route?: string;
  protected_object_hint?: string;
  action_verb?: string;
  input_or_object?: string;
  procedure_or_standard?: string;
  procedure_or_standard_required?: boolean;
  output_or_result?: string;
  user_correction_note?: string;
  semantic_confirmation_status?: string;
  preload_confirmed?: boolean;
  ambiguous_activity_text?: boolean;
  source_trace?: Record<string, unknown>;
  scene_canonical_record_real_creation_attempted?: boolean;
}

export interface RuntimeB2TransformationExceptionGateInput {
  b2_gate_candidate_ref?: string;
  transformation_exception_route?: string;
  protected_object_hint?: string;
  transformation_exception_exists?: boolean;
  transformation_exception_type?: string;
  transformation_exception_description?: string;
  transformation_exception_route_unresolved?: boolean;
  canonical_route_closed?: boolean;
  closed_variable_from_free_text_attempted?: boolean;
  pf_olc_projection_without_closed_route_attempted?: boolean;
  source_trace?: Record<string, unknown>;
}

export interface RuntimeB3ReceiverFeedbackGateInput {
  b3_gate_candidate_ref?: string;
  cr_b3_r9_c09_route?: string;
  protected_object_hint?: string;
  receiver_feedback_exists?: boolean;
  receiver_feedback?: string;
  receiver_feedback_gap_flag?: boolean;
  receiver_feedback_route_missing?: boolean;
  receiver_satisfaction_as_feedback_attempted?: boolean;
  ambiguous_comment_as_receiver_feedback_attempted?: boolean;
  c09_closed_by_wrong_route_attempted?: boolean;
  canonical_route_closed?: boolean;
  source_trace?: Record<string, unknown>;
  receiver_feedback_object_real_creation_attempted?: boolean;
}

export interface RuntimeB7C20NonDiagnosticBoundaryGateInput {
  b7_gate_candidate_ref?: string;
  b7_q39_boundary_supported?: boolean;
  b7_q40_boundary_supported?: boolean;
  c20_boundary_supported?: boolean;
  protected_object_hint?: string;
  confidence_supported?: boolean;
  uncertainty_supported?: boolean;
  microconfirmation_refs_supported?: boolean;
  moc_direct_attempted?: boolean;
  registry_direct_attempted?: boolean;
  ir_direct_attempted?: boolean;
  export_direct_attempted?: boolean;
  diagnosis_attempted?: boolean;
  root_cause_attempted?: boolean;
  monetization_attempted?: boolean;
  final_narrative_attempted?: boolean;
  vsm_ahe_final_attempted?: boolean;
  source_trace?: Record<string, unknown>;
}

export interface RuntimeCriticalRouteGateResultInput {
  critical_route_gate_result_candidate_ref?: string;
  gate_family: RuntimeCriticalGateFamily;
  route_id?: string;
  route_status_before?: string;
  route_status_after_candidate?: string;
  protected_route_id?: string;
  protected_object_hint?: string;
  evidence_sufficient?: boolean;
  canonical_route_closed?: boolean;
  route_missing?: boolean;
  gap_flag?: boolean;
  gap_type?: string;
  manual_review_required?: boolean;
  reentry_target_candidate?: string;
  finding_code?: string;
  source_trace?: Record<string, unknown>;
  gate_result_real_creation_attempted?: boolean;
  readiness_final_creation_attempted?: boolean;
}

export interface RuntimeSemanticResolutionGateSourceInput {
  semantic_gate_candidate_ref?: string;
  runtime_semantic_gate_ref?: string;
  sem_code?: RuntimeSemanticGateCode;
  target_term?: string;
  ambiguity_type?: RuntimeSemanticAmbiguityType;
  protected_object_hint?: string;
  blocks_projection?: boolean;
  action?: string;
  source_variable_refs?: string[];
  source_evidence_refs?: string[];
  source_trace?: Record<string, unknown>;
  runtime_audit_candidate_ref?: string;
  accepted_structural_candidate_creation_attempted?: boolean;
  semantic_resolution_event_real_creation_attempted?: boolean;
  readiness_gap_record_real_creation_attempted?: boolean;
  runtime_audit_trail_real_creation_attempted?: boolean;
  object_inventory_creation_attempted?: boolean;
  mba_projection_attempted?: boolean;
  scene_projection_attempted?: boolean;
  export_projection_attempted?: boolean;
}

export interface RuntimeSEM001StateAsClassGateInput {
  sem001_candidate_ref?: string;
  target_term?: string;
  source_variable_ref?: string;
  source_trace?: Record<string, unknown>;
  state_as_class_detected?: boolean;
  concept_candidate_accepted_attempted?: boolean;
  semantic_resolution_event_real_creation_attempted?: boolean;
}

export interface RuntimeSEM002AttributeAsClassGateInput {
  sem002_candidate_ref?: string;
  target_term?: string;
  source_variable_ref?: string;
  source_trace?: Record<string, unknown>;
  attribute_as_class_detected?: boolean;
  moc_class_candidate_accepted_attempted?: boolean;
  semantic_resolution_event_real_creation_attempted?: boolean;
}

export interface RuntimeSEM003ProcessAsObjectGateInput {
  sem003_candidate_ref?: string;
  target_term?: string;
  source_variable_ref?: string;
  source_trace?: Record<string, unknown>;
  process_as_object_detected?: boolean;
  object_state_candidate_accepted_attempted?: boolean;
  semantic_resolution_event_real_creation_attempted?: boolean;
}

export interface RuntimeSEM004FalseISAByTypeOfGateInput {
  sem004_candidate_ref?: string;
  target_term?: string;
  source_variable_ref?: string;
  source_trace?: Record<string, unknown>;
  false_isa_by_type_of_detected?: boolean;
  isa_candidate_accepted_attempted?: boolean;
  semantic_resolution_event_real_creation_attempted?: boolean;
}

export interface RuntimeSEM005AliasOrDuplicateGateInput {
  sem005_candidate_ref?: string;
  target_term?: string;
  alias_target_candidate?: string;
  source_trace?: Record<string, unknown>;
  alias_or_duplicate_detected?: boolean;
  duplicate_class_created_attempted?: boolean;
  semantic_resolution_event_real_creation_attempted?: boolean;
}

export interface RuntimeSEM006RolePhaseEndConfusionGateInput {
  sem006_candidate_ref?: string;
  target_term?: string;
  source_variable_ref?: string;
  source_trace?: Record<string, unknown>;
  role_phase_end_confusion_detected?: boolean;
  static_moc_candidate_accepted_attempted?: boolean;
  semantic_resolution_event_real_creation_attempted?: boolean;
}

export interface RuntimeSEM007FusedMarsupialObjectGateInput {
  sem007_candidate_ref?: string;
  target_term?: string;
  object_candidate_refs?: string[];
  source_trace?: Record<string, unknown>;
  fused_object_detected?: boolean;
  marsupial_object_detected?: boolean;
  olc_fused_created_attempted?: boolean;
  semantic_resolution_event_real_creation_attempted?: boolean;
}

export interface RuntimeProcessStateTimerGateSourceInput {
  pst_gate_candidate_ref?: string;
  runtime_pst_gate_ref?: string;
  pst_code?: RuntimePSTGateCode;
  process_state_candidate_ref?: string;
  awaited_event?: string;
  release_condition?: string;
  timer_or_timeout_rule?: string;
  timeout_state?: string;
  resolver_owner?: string;
  exit_path?: string;
  deadlock_risk?: boolean;
  source_trace?: Record<string, unknown>;
  runtime_audit_candidate_ref?: string;
  invalid_process_state_accepted_attempted?: boolean;
  pf_projection_attempted_despite_block?: boolean;
  olc_transition_attempted_without_timeout_state?: boolean;
  process_state_timer_event_real_creation_attempted?: boolean;
  readiness_gap_record_real_creation_attempted?: boolean;
  runtime_audit_trail_real_creation_attempted?: boolean;
  mba_projection_attempted?: boolean;
  scene_projection_attempted?: boolean;
  export_projection_attempted?: boolean;
}

export interface RuntimePSTSpecificGateInput {
  candidate_ref?: string;
  process_state_candidate_ref?: string;
  awaited_event?: string;
  release_condition?: string;
  timer_or_timeout_rule?: string;
  timeout_state?: string;
  resolver_owner?: string;
  exit_path?: string;
  source_trace?: Record<string, unknown>;
  process_state_timer_event_real_creation_attempted?: boolean;
  invalid_process_state_accepted_attempted?: boolean;
  pf_projection_attempted_despite_block?: boolean;
  olc_transition_attempted_without_timeout_state?: boolean;
}

export interface RuntimeSemanticResolutionEventContractInput {
  semantic_event_candidate_ref?: string;
  run_id?: string;
  gate_id?: string;
  target_term?: string;
  ambiguity_type?: string;
  outcome?: string;
  action?: string;
  blocks_projection?: boolean;
  protected_object_hint?: string;
  source_variable_refs?: string[];
  source_evidence_refs?: string[];
  source_trace?: Record<string, unknown>;
  finding_code?: string;
  semantic_resolution_event_real_creation_attempted?: boolean;
  accepted_structural_candidate_creation_attempted?: boolean;
  mba_projection_attempted?: boolean;
}

export interface RuntimeProcessStateTimerEventContractInput {
  pst_event_candidate_ref?: string;
  run_id?: string;
  gate_id?: string;
  process_state_candidate_ref?: string;
  awaited_event?: string;
  release_condition?: string;
  timer_rule?: string;
  timeout_state?: string;
  resolver_owner?: string;
  exit_path?: string;
  deadlock_risk?: boolean;
  source_trace?: Record<string, unknown>;
  finding_code?: string;
  process_state_timer_event_real_creation_attempted?: boolean;
  pf_incomplete?: boolean;
  mba_projection_attempted?: boolean;
}

export interface RuntimeReadinessGapRecordInput {
  readiness_gap_candidate_ref?: string;
  run_id?: string;
  gap_type?: string;
  affected_route?: string;
  affected_quadrant?: string;
  affected_gate?: string;
  severity?: string;
  reentry_target?: string;
  manual_review_required?: boolean;
  source_gate_candidate_ref?: string;
  source_trace?: Record<string, unknown>;
  gap_reason?: string;
  finding_code?: string;
  readiness_gap_record_real_creation_attempted?: boolean;
  readiness_final_creation_attempted?: boolean;
  mba_projection_attempted?: boolean;
}

export interface RuntimeGateAuditTrailInput {
  runtime_audit_candidate_ref?: string;
  audit_action?: RuntimeGateAuditAction | string;
  run_id?: string;
  gate_id?: string;
  source_gate_candidate_ref?: string;
  source_gap_candidate_ref?: string;
  source_trace?: Record<string, unknown>;
  audit_reason?: string;
  created_at_preview?: string;
  runtime_audit_trail_real_creation_attempted?: boolean;
  supabase_touch_attempted?: boolean;
  sql_execution_attempted?: boolean;
  endpoint_creation_attempted?: boolean;
}

export interface RuntimeGateOutcomeReadinessBoundaryInput {
  readiness_input_candidate_ref?: string;
  source_gate_result_candidate_ref?: string;
  source_readiness_gap_candidate_refs?: string[];
  manual_review_required?: boolean;
  reentry_required_candidate?: boolean;
  carry_forward_gap_refs?: string[];
  blocked_by_missing_route?: boolean;
  blocked_by_semantic_gate?: boolean;
  blocked_by_pst_gate?: boolean;
  readiness_engine_execution_attempted?: boolean;
  readiness_decision_record_real_creation_attempted?: boolean;
  ready_creation_attempted?: boolean;
  ready_with_flags_creation_attempted?: boolean;
  blocked_final_creation_attempted?: boolean;
  export_preview_creation_attempted?: boolean;
  phase10_start_attempted?: boolean;
}

export interface RuntimeGateObjectInventoryBoundaryInput {
  object_inventory_boundary_candidate_ref?: string;
  gate_id?: string;
  protected_object_hint?: string;
  future_object_family?: string;
  object_binding_status?: "pending_candidate" | "not_applicable";
  runtime_object_binding_ref?: string;
  object_inventory_creation_attempted?: boolean;
  eve_object_definition_creation_attempted?: boolean;
  runtime_object_binding_real_creation_attempted?: boolean;
  object_materialization_event_creation_attempted?: boolean;
  live_object_materialization_attempted?: boolean;
  f5c_real_open_attempted?: boolean;
}

export interface RuntimeGateControlPlaneBoundaryInput {
  control_plane_boundary_candidate_ref?: string;
  finding_code?: string;
  source_trace?: Record<string, unknown>;
  mba_event_ledger_write_attempted?: boolean;
  mba_transition_findings_write_attempted?: boolean;
  mba_compliance_reports_write_attempted?: boolean;
  outbox_real_creation_attempted?: boolean;
  handoff_boundary_real_creation_attempted?: boolean;
  review_control_real_creation_attempted?: boolean;
  parallel_production_start_attempted?: boolean;
  control_plane_write_attempted?: boolean;
}

export interface RuntimeGatePersistenceBoundaryInput {
  persistence_boundary_candidate_ref?: string;
  db_write_attempted?: boolean;
  gate_result_real_creation_attempted?: boolean;
  readiness_gap_record_real_creation_attempted?: boolean;
  semantic_resolution_event_real_creation_attempted?: boolean;
  process_state_timer_event_real_creation_attempted?: boolean;
  runtime_audit_trail_real_creation_attempted?: boolean;
  supabase_touch_attempted?: boolean;
  sql_execution_attempted?: boolean;
  endpoint_creation_attempted?: boolean;
  service_role_use_attempted?: boolean;
  service_role_client_use_attempted?: boolean;
  scene_write_attempted?: boolean;
  mba_write_attempted?: boolean;
  parallel_production_runtime_artifacts_write_attempted?: boolean;
  export_preview_creation_attempted?: boolean;
  runtime_40_20_start_attempted?: boolean;
}

export interface RuntimeCriticalGatesPhase8CloseoutInput {
  phase8_closed_local: boolean;
  ready_for_phase9_authorization: boolean;
}

export interface RuntimeCriticalGatesPhase8CandidateInput {
  branching_decision_candidates?: RuntimeBranchingDecisionCandidate[];
  trigger_evaluation_candidates?: RuntimeBranchingTriggerEvaluationCandidate[];
  causal_score_candidates?: RuntimeBranchingCausalScoreCandidate[];
  signal_candidates?: RuntimeBranchingSignalCandidate[];
  carry_forward_gap_candidates?: RuntimeBranchingCarryForwardGapCandidate[];
  reentry_candidates?: RuntimeBranchingReentryCandidate[];
  budget_exhaustion_guards?: RuntimeBranchingBudgetExhaustionGuard[];
  phase9_boundaries?: RuntimeBranchingFoundationLocalResult["phase9_boundaries"];
}

export interface RuntimeCriticalGatesLocalInput {
  case_id: string;
  phase8_closeout: RuntimeCriticalGatesPhase8CloseoutInput;
  phase8_candidates: RuntimeCriticalGatesPhase8CandidateInput;
  gate_evaluation_sources?: RuntimeCriticalGateEvaluationSourceInput[];
  b0_semantic_entry_sources?: RuntimeB0SemanticEntryGateInput[];
  b2_transformation_exception_sources?: RuntimeB2TransformationExceptionGateInput[];
  b3_receiver_feedback_sources?: RuntimeB3ReceiverFeedbackGateInput[];
  b7_c20_non_diagnostic_sources?: RuntimeB7C20NonDiagnosticBoundaryGateInput[];
  route_gate_result_sources?: RuntimeCriticalRouteGateResultInput[];
  semantic_resolution_gate_sources?: RuntimeSemanticResolutionGateSourceInput[];
  sem001_state_as_class_sources?: RuntimeSEM001StateAsClassGateInput[];
  sem002_attribute_as_class_sources?: RuntimeSEM002AttributeAsClassGateInput[];
  sem003_process_as_object_sources?: RuntimeSEM003ProcessAsObjectGateInput[];
  sem004_false_isa_sources?: RuntimeSEM004FalseISAByTypeOfGateInput[];
  sem005_alias_duplicate_sources?: RuntimeSEM005AliasOrDuplicateGateInput[];
  sem006_role_phase_end_sources?: RuntimeSEM006RolePhaseEndConfusionGateInput[];
  sem007_fused_marsupial_sources?: RuntimeSEM007FusedMarsupialObjectGateInput[];
  process_state_timer_gate_sources?: RuntimeProcessStateTimerGateSourceInput[];
  pst001_wait_without_awaited_event_sources?: RuntimePSTSpecificGateInput[];
  pst002_missing_release_condition_sources?: RuntimePSTSpecificGateInput[];
  pst003_missing_timer_or_timeout_sources?: RuntimePSTSpecificGateInput[];
  pst004_missing_timeout_state_sources?: RuntimePSTSpecificGateInput[];
  pst005_missing_resolver_owner_sources?: RuntimePSTSpecificGateInput[];
  pst006_missing_exit_path_sources?: RuntimePSTSpecificGateInput[];
  semantic_resolution_event_contract_sources?: RuntimeSemanticResolutionEventContractInput[];
  process_state_timer_event_contract_sources?: RuntimeProcessStateTimerEventContractInput[];
  readiness_gap_record_sources?: RuntimeReadinessGapRecordInput[];
  gate_audit_trail_sources?: RuntimeGateAuditTrailInput[];
  gate_outcome_readiness_boundary_sources?: RuntimeGateOutcomeReadinessBoundaryInput[];
  gate_object_inventory_boundary_sources?: RuntimeGateObjectInventoryBoundaryInput[];
  gate_control_plane_boundary_sources?: RuntimeGateControlPlaneBoundaryInput[];
  gate_persistence_boundary_sources?: RuntimeGatePersistenceBoundaryInput[];
}

export interface RuntimeCriticalGateFrameworkLocalResult {
  status: RuntimePhase9CriticalGatesLocalStatus;
  phase9_input_revalidation: RuntimePhase9InputRevalidationDecision;
  gate_evaluation_candidates: RuntimeCriticalGateEvaluationCandidate[];
  b0_semantic_entry_gate_candidates: RuntimeB0SemanticEntryGateCandidate[];
  b2_transformation_exception_gate_candidates: RuntimeB2TransformationExceptionGateCandidate[];
  b3_receiver_feedback_gate_candidates: RuntimeB3ReceiverFeedbackGateCandidate[];
  b7_c20_non_diagnostic_boundary_gate_candidates: RuntimeB7C20NonDiagnosticBoundaryGateCandidate[];
  critical_route_gate_result_candidates: RuntimeCriticalRouteGateResultCandidate[];
  semantic_resolution_gate_candidates?: RuntimeSemanticResolutionGateCandidate[];
  sem001_state_as_class_candidates?: RuntimeSEM001StateAsClassGateCandidate[];
  sem002_attribute_as_class_candidates?: RuntimeSEM002AttributeAsClassGateCandidate[];
  sem003_process_as_object_candidates?: RuntimeSEM003ProcessAsObjectGateCandidate[];
  sem004_false_isa_candidates?: RuntimeSEM004FalseISAByTypeOfGateCandidate[];
  sem005_alias_duplicate_candidates?: RuntimeSEM005AliasOrDuplicateGateCandidate[];
  sem006_role_phase_end_candidates?: RuntimeSEM006RolePhaseEndConfusionGateCandidate[];
  sem007_fused_marsupial_candidates?: RuntimeSEM007FusedMarsupialObjectGateCandidate[];
  process_state_timer_gate_candidates?: RuntimeProcessStateTimerGateCandidate[];
  pst001_wait_without_awaited_event_candidates?: RuntimePST001WaitWithoutAwaitedEventCandidate[];
  pst002_missing_release_condition_candidates?: RuntimePST002MissingReleaseConditionCandidate[];
  pst003_missing_timer_or_timeout_candidates?: RuntimePST003MissingTimerOrTimeoutRuleCandidate[];
  pst004_missing_timeout_state_candidates?: RuntimePST004MissingTimeoutStateCandidate[];
  pst005_missing_resolver_owner_candidates?: RuntimePST005MissingResolverOwnerCandidate[];
  pst006_missing_exit_path_candidates?: RuntimePST006MissingExitPathCandidate[];
  semantic_resolution_event_contract_candidates?: RuntimeSemanticResolutionEventContractCandidate[];
  process_state_timer_event_contract_candidates?: RuntimeProcessStateTimerEventContractCandidate[];
  readiness_gap_record_candidates?: RuntimeReadinessGapRecordCandidate[];
  gate_audit_trail_candidates?: RuntimeGateAuditTrailCandidate[];
  gate_outcome_readiness_boundaries?: RuntimeGateOutcomeReadinessBoundary[];
  gate_object_inventory_boundaries?: RuntimeGateObjectInventoryBoundary[];
  gate_control_plane_boundaries?: RuntimeGateControlPlaneBoundary[];
  gate_persistence_boundaries?: RuntimeGatePersistenceBoundary[];
  phase9_started_local: boolean;
  phase9_closed_local: false;
  ready_for_phase10_authorization: false;
  runtime_40_20_started: false;
  catalog_activated: false;
  migration_applied: false;
  supabase_touched: false;
  sql_executed: false;
  endpoint_created: false;
  readiness_gap_record_real_created: false;
  readiness_decision_record_real_created: false;
  semantic_resolution_event_real_created: false;
  process_state_timer_event_real_created: false;
  runtime_audit_trail_real_created: false;
  critical_route_gate_executed_real: false;
  mmabp_gate_engine_executed_real: false;
  readiness_engine_executed: false;
  export_preview_created: false;
  diagnosis_created: false;
  ir_created: false;
  registry_created: false;
  object_inventory_created: false;
  moc_real_projection_created?: false;
  pf_real_projection_created?: false;
  olc_real_projection_created?: false;
  olc_real_transition_created?: false;
  phase10_started: false;
}
