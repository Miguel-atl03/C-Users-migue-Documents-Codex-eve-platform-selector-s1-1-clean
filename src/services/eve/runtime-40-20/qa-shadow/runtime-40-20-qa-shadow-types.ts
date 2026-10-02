export type RuntimeQAFoundationStatus =
  | "phase12_input_revalidation_passed"
  | "qa_runtime_local_contract_created"
  | "qa_rule_source_contract_created"
  | "qa_import_runtime_base_results_created"
  | "qa_import_versioning_activation_results_created"
  | "qa_regression_typecheck_critical_results_created"
  | "security_scope_rls_candidates_created"
  | "no_write_boundary_candidates_created"
  | "shadow_pilot_scope_candidates_created"
  | "shadow_pilot_fixture_candidates_created"
  | "shadow_pilot_rehearsal_candidates_created"
  | "shadow_pilot_observability_candidates_created"
  | "qa_result_candidates_created"
  | "qa_green_gate_candidates_created"
  | "activation_readiness_boundary_candidates_created"
  | "rollback_abort_plan_qa_candidates_created"
  | "qa_audit_candidates_created"
  | "qa_persistence_boundary_candidates_created"
  | "blocked_phase11_not_closed"
  | "blocked_phase12_not_authorized"
  | "blocked_missing_source_trace"
  | "blocked_narrative_qa_without_expected_result"
  | "blocked_catalog_activation_on_qa_failure"
  | "blocked_b7_direct_projection_attempt"
  | "blocked_environment_blocked_critical"
  | "blocked_blocker_failure_detected"
  | "blocked_qa_green_real_creation_attempt"
  | "blocked_real_activation_attempt"
  | "blocked_supabase_touch_attempt"
  | "blocked_shadow_pilot_real_start_attempt"
  | "blocked_write_boundary_violation"
  | "blocked_production_mode_attempt"
  | "blocked_activation_attempt"
  | "blocked_qa_persistence_real_write_attempt"
  | "blocked_external_typecheck_debt_not_carried_forward";

export type RuntimeQASecurityShadowStatus =
  | "security_scope_rls_candidates_created"
  | "no_write_boundary_candidates_created"
  | "shadow_pilot_scope_candidates_created"
  | "shadow_pilot_fixture_candidates_created"
  | "shadow_pilot_rehearsal_candidates_created"
  | "shadow_pilot_observability_candidates_created"
  | "blocked_missing_source_trace"
  | "blocked_supabase_touch_attempt"
  | "blocked_shadow_pilot_real_start_attempt"
  | "blocked_write_boundary_violation"
  | "blocked_production_mode_attempt";

export type RuntimeQAResultGreenActivationStatus =
  | "qa_result_candidates_created"
  | "qa_green_gate_candidates_created"
  | "activation_readiness_boundary_candidates_created"
  | "rollback_abort_plan_qa_candidates_created"
  | "qa_audit_candidates_created"
  | "qa_persistence_boundary_candidates_created"
  | "blocked_missing_source_trace"
  | "blocked_qa_green_real_creation_attempt"
  | "blocked_activation_attempt"
  | "blocked_qa_persistence_real_write_attempt"
  | "blocked_external_typecheck_debt_not_carried_forward";

export type RuntimeQAScope =
  | "catalog_import"
  | "runtime_contracts"
  | "phase_6_to_11_regression"
  | "export_preview_boundary"
  | "security_scope"
  | "shadow_pilot_readiness"
  | "activation_readiness";

export type RuntimeQAStatus =
  | "draft_candidate"
  | "running_candidate"
  | "passed_candidate"
  | "failed_candidate"
  | "blocked_candidate";

export type RuntimeQABlockingLevel = "blocker" | "high" | "medium" | "advisory";

export type RuntimeQAPassFail = "pass" | "fail" | "blocked" | "environment_blocked" | "not_run";

export type RuntimeQAFoundationBlockingReason =
  | "phase11_not_closed"
  | "phase12_not_authorized"
  | "missing_source_trace"
  | "missing_expected_result"
  | "missing_pass_fail"
  | "missing_evidence_ref"
  | "narrative_qa_attempted"
  | "qa_rule_invented_attempted"
  | "blocker_failure_detected"
  | "environment_blocked_critical"
  | "real_activation_attempted"
  | "catalog_activation_attempted"
  | "b7_direct_projection_attempted"
  | "export_preview_recalculation_attempted"
  | "phase11_modification_attempted"
  | "runtime_real_start_attempted"
  | "qa_green_real_creation_attempted"
  | "shadow_pilot_real_start_attempted"
  | "supabase_touch_attempted"
  | "sql_execution_attempted"
  | "endpoint_creation_attempted"
  | "export_real_creation_attempted"
  | "parallel_export_payload_real_creation_attempted"
  | "produccion_paralela_start_attempted"
  | "registry_ir_diagnosis_creation_attempted"
  | "control_plane_real_creation_attempted"
  | "mba_write_attempted"
  | "scene_write_attempted"
  | "parallel_production_runtime_artifacts_write_attempted";

export type RuntimeQARegressionCriticalBlockingReason = RuntimeQAFoundationBlockingReason;

export type RuntimeQASecurityShadowBlockingReason =
  | "missing_source_trace"
  | "service_role_client_violation"
  | "cross_case_read_detected"
  | "cross_case_write_detected"
  | "query_outside_case_or_tenant_detected"
  | "rls_real_migration_attempted"
  | "supabase_touch_attempted"
  | "sql_execution_attempted"
  | "endpoint_creation_attempted"
  | "scene_write_attempted"
  | "mba_write_attempted"
  | "parallel_production_runtime_artifacts_write_attempted"
  | "registry_write_attempted"
  | "ir_write_attempted"
  | "diagnosis_write_attempted"
  | "object_inventory_write_attempted"
  | "readiness_real_mutation_attempted"
  | "runtime_real_start_attempted"
  | "export_real_attempted"
  | "shadow_pilot_real_start_attempted"
  | "production_mode_attempted"
  | "eight_activities_scale_attempted"
  | "multi_role_scale_attempted"
  | "external_delivery_attempted"
  | "real_customer_data_without_authorization"
  | "runtime_audit_trail_real_creation_attempted"
  | "mba_event_ledger_real_creation_attempted"
  | "compliance_report_real_creation_attempted";

export type RuntimeQAResultGreenActivationBlockingReason =
  | "missing_source_trace"
  | "repo_wide_typecheck_debt_not_carried_forward"
  | "build_environment_blocked_not_carried_forward"
  | "qa_green_real_creation_attempted"
  | "activation_allowed_attempted"
  | "runtime_full_start_attempted"
  | "production_parallel_attempted"
  | "supabase_write_allowed_attempted"
  | "endpoint_activation_attempted"
  | "rollback_real_execution_attempted"
  | "abort_real_execution_attempted"
  | "data_deleted_without_trace_attempted"
  | "rollback_mutates_readiness_attempted"
  | "rollback_mutates_evidence_attempted"
  | "rollback_mutates_export_payload_attempted"
  | "rollback_creates_ghost_tasks_attempted"
  | "runtime_audit_trail_real_creation_attempted"
  | "qa_result_record_real_creation_attempted"
  | "shadow_pilot_run_real_creation_attempted"
  | "supabase_touch_attempted"
  | "sql_execution_attempted"
  | "endpoint_creation_attempted"
  | "service_role_client_violation"
  | "scene_write_attempted"
  | "mba_write_attempted"
  | "parallel_production_runtime_artifacts_write_attempted"
  | "export_real_attempted"
  | "runtime_real_start_attempted";

export type RuntimeQAAuditAction =
  | "qa_run_started"
  | "qa_rule_executed"
  | "qa_rule_passed"
  | "qa_rule_failed"
  | "qa_rule_blocked"
  | "regression_executed"
  | "shadow_pilot_rehearsal_started"
  | "shadow_pilot_rehearsal_completed"
  | "qa_green_candidate_created"
  | "activation_readiness_candidate_created"
  | "no_go_violation_detected"
  | "rollback_plan_verified"
  | "external_typecheck_debt_carried_forward"
  | "activation_real_blocked";

export type RuntimeQARegressionPhaseScope =
  | "phase6_response_ingest"
  | "phase7_canonical_variable"
  | "phase8_branching_budget"
  | "phase9_critical_gates"
  | "phase10_readiness_reentry"
  | "phase11_export_preview";

export type RuntimeQACriticalScenarioCode =
  | "CT-B0-001"
  | "CT-B2-001"
  | "CT-B3-001"
  | "CT-B3-002"
  | "CT-B4-001"
  | "CT-B6-001"
  | "CT-B7-001"
  | "CT-BUD-001";

export type RuntimeQACriticalRouteCode = "B0" | "B2" | "B3_C09" | "B7_C20";

export type RuntimeQASEMPSTGateCode =
  | "SEM-001"
  | "SEM-002"
  | "SEM-003"
  | "SEM-004"
  | "SEM-005"
  | "SEM-006"
  | "SEM-007"
  | "PST-001"
  | "PST-002"
  | "PST-003"
  | "PST-004"
  | "PST-005"
  | "PST-006";

export type RuntimeQAGateFamily = "SEM" | "PST";

export type RuntimeQAReadinessCase =
  | "ready_candidate"
  | "ready_with_flags_candidate"
  | "blocked_by_missing_evidence"
  | "blocked_by_contradiction"
  | "blocked_by_missing_canonical_route"
  | "manual_review_required"
  | "reentry_required"
  | "reentry_planning"
  | "reentry_execution_boundary"
  | "readiness_decision_record_candidate";

export type RuntimeQAExportPreviewCase =
  | "scr_preview"
  | "evidence_bundle_preview"
  | "mdsb_preview"
  | "combined_preview"
  | "export_blocking_rules"
  | "checksum_idempotency"
  | "payload_state_lifecycle"
  | "source_trace_envelope"
  | "supersession_stale_preview";

export interface RuntimeQASourceTrace {
  source_document: string;
  source_sheet: string;
  source_row_number: number;
  source_node_ref?: string;
  source_refs?: string[];
}

export interface RuntimePhase11FinalCloseoutForPhase12Input {
  phase11_closed_local?: boolean;
  ready_for_phase12_authorization?: boolean;
  phase12_started?: boolean;
  phase12_started_local?: boolean;
}

export interface RuntimePhase11ExportPreviewInputCandidates {
  phase11_final_closeout_available?: boolean;
  export_preview_service_candidates?: unknown[];
  scr_preview_candidates?: unknown[];
  evidence_bundle_preview_candidates?: unknown[];
  mdsb_preview_candidates?: unknown[];
  combined_preview_candidates?: unknown[];
  export_blocking_rules?: unknown[];
  export_preview_audit_candidates?: unknown[];
  phase11_persistence_boundaries?: unknown[];
}

export interface RuntimePhase12BoundaryGuardInput {
  export_real_previously_created?: boolean;
  parallel_export_payload_real_previously_created?: boolean;
  payload_state_sent_previously_detected?: boolean;
  produccion_paralela_previously_started?: boolean;
  supabase_previously_touched?: boolean;
  sql_previously_executed?: boolean;
  endpoint_previously_created?: boolean;
  export_preview_recalculation_attempted?: boolean;
  phase11_modification_attempted?: boolean;
  runtime_real_start_attempted?: boolean;
  runtime_qa_result_real_creation_attempted?: boolean;
  qa_green_real_creation_attempted?: boolean;
  shadow_pilot_real_start_attempted?: boolean;
  catalog_activation_attempted?: boolean;
  migration_application_attempted?: boolean;
  registry_ir_diagnosis_creation_attempted?: boolean;
  control_plane_real_creation_attempted?: boolean;
  mba_write_attempted?: boolean;
  scene_write_attempted?: boolean;
  parallel_production_runtime_artifacts_write_attempted?: boolean;
}

export interface RuntimeQARegressionResultSourceInput extends RuntimePhase12BoundaryGuardInput {
  regression_result_candidate_ref?: string;
  phase_scope: RuntimeQARegressionPhaseScope | string;
  module_name?: string;
  test_command?: string;
  test_status?: RuntimeQAPassFail | string;
  test_count?: number;
  passed_count?: number;
  failed_count?: number;
  failed_tests?: string[];
  environment_blocked?: boolean;
  environment_blocked_reason?: string;
  blocker_failure_detected?: boolean;
  qa_green_real_creation_attempted?: boolean;
  source_trace?: RuntimeQASourceTrace | Record<string, unknown>;
}

export interface RuntimeQARegressionResultCandidate {
  regression_result_candidate_ref: string;
  phase_scope?: RuntimeQARegressionPhaseScope;
  module_name?: string;
  test_command?: string;
  test_status: RuntimeQAPassFail;
  test_count: number;
  passed_count: number;
  failed_count: number;
  failed_tests: string[];
  environment_blocked: boolean;
  environment_blocked_reason: string;
  qa_integral_before_real_activation_required: true;
  blocker_failure_detected: boolean;
  qa_green_real_created: false;
  source_trace: RuntimeQASourceTrace | Record<string, unknown>;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeQARegressionCriticalBlockingReason[];
}

export interface RuntimeQATypecheckBuildSourceInput extends RuntimePhase12BoundaryGuardInput {
  typecheck_build_candidate_ref?: string;
  typescript_available?: boolean;
  typecheck_command?: string;
  typecheck_status?: RuntimeQAPassFail | string;
  build_command?: string;
  build_status?: RuntimeQAPassFail | string;
  module_import_integrity?: boolean;
  unresolved_import_detected?: boolean;
  missing_type_export_detected?: boolean;
  duplicate_type_incompatible_detected?: boolean;
  implicit_supabase_runtime_dependency_detected?: boolean;
  endpoint_required_for_local_candidate_mode?: boolean;
  environment_blocked?: boolean;
  environment_blocked_reason?: string;
  activation_blocked_if_failed?: boolean;
  source_trace?: RuntimeQASourceTrace | Record<string, unknown>;
}

export interface RuntimeQATypecheckBuildCandidate {
  typecheck_build_candidate_ref: string;
  typescript_available: boolean;
  typecheck_command?: string;
  typecheck_status: RuntimeQAPassFail;
  build_command?: string;
  build_status: RuntimeQAPassFail;
  module_import_integrity: boolean;
  unresolved_import_detected: boolean;
  missing_type_export_detected: boolean;
  duplicate_type_incompatible_detected: boolean;
  implicit_supabase_runtime_dependency_detected: boolean;
  endpoint_required_for_local_candidate_mode: false;
  environment_blocked: boolean;
  environment_blocked_reason: string;
  activation_blocked_if_failed: boolean;
  source_trace: RuntimeQASourceTrace | Record<string, unknown>;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeQARegressionCriticalBlockingReason[];
}

export interface RuntimeQACriticalScenarioSourceInput extends RuntimePhase12BoundaryGuardInput {
  critical_scenario_result_candidate_ref?: string;
  ct_code: RuntimeQACriticalScenarioCode | string;
  ct_name?: string;
  expected_gate_result?: string;
  expected_gap_result?: string;
  expected_readiness_result?: string;
  expected_export_block_result?: string;
  actual_gate_result?: string;
  actual_gap_result?: string;
  actual_readiness_result?: string;
  actual_export_block_result?: string;
  pass_fail?: RuntimeQAPassFail | string;
  blocking_level?: RuntimeQABlockingLevel | string;
  narrative_pass_used?: boolean;
  source_trace?: RuntimeQASourceTrace | Record<string, unknown>;
}

export interface RuntimeQACriticalScenarioResultCandidate {
  critical_scenario_result_candidate_ref: string;
  ct_code?: RuntimeQACriticalScenarioCode;
  ct_name?: string;
  expected_gate_result?: string;
  expected_gap_result?: string;
  expected_readiness_result?: string;
  expected_export_block_result?: string;
  actual_gate_result?: string;
  actual_gap_result?: string;
  actual_readiness_result?: string;
  actual_export_block_result?: string;
  pass_fail: RuntimeQAPassFail;
  blocking_level: RuntimeQABlockingLevel;
  narrative_pass_used: false;
  source_trace: RuntimeQASourceTrace | Record<string, unknown>;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeQARegressionCriticalBlockingReason[];
}

export interface RuntimeQACriticalRouteSourceInput extends RuntimePhase12BoundaryGuardInput {
  critical_route_qa_candidate_ref?: string;
  route_code: RuntimeQACriticalRouteCode | string;
  route_name?: string;
  expected_route_status?: string;
  actual_route_status?: string;
  expected_gap?: string;
  actual_gap?: string;
  expected_manual_review_required?: boolean;
  actual_manual_review_required?: boolean;
  expected_reentry_required?: boolean;
  actual_reentry_required?: boolean;
  route_closed_from_free_text?: boolean;
  receiver_feedback_from_satisfaction_general?: boolean;
  b7_diagnosis_created?: boolean;
  b7_c20_direct_export_or_registry_created?: boolean;
  pass_fail?: RuntimeQAPassFail | string;
  source_trace?: RuntimeQASourceTrace | Record<string, unknown>;
}

export interface RuntimeQACriticalRouteResultCandidate {
  critical_route_qa_candidate_ref: string;
  route_code?: RuntimeQACriticalRouteCode;
  route_name?: string;
  expected_route_status?: string;
  actual_route_status?: string;
  expected_gap?: string;
  actual_gap?: string;
  expected_manual_review_required: boolean;
  actual_manual_review_required: boolean;
  expected_reentry_required: boolean;
  actual_reentry_required: boolean;
  route_closed_from_free_text: false;
  receiver_feedback_from_satisfaction_general: false;
  b7_diagnosis_created: false;
  b7_c20_direct_export_or_registry_created: false;
  pass_fail: RuntimeQAPassFail;
  source_trace: RuntimeQASourceTrace | Record<string, unknown>;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeQARegressionCriticalBlockingReason[];
}

export interface RuntimeQASEMPSTGateSourceInput extends RuntimePhase12BoundaryGuardInput {
  sem_pst_qa_candidate_ref?: string;
  gate_code: RuntimeQASEMPSTGateCode | string;
  gate_family?: RuntimeQAGateFamily | string;
  expected_blocker?: boolean;
  actual_blocker?: boolean;
  expected_readiness_gap?: string;
  actual_readiness_gap?: string;
  moc_pf_olc_projection_when_blocked?: boolean;
  timer_or_process_state_inferred?: boolean;
  pass_fail?: RuntimeQAPassFail | string;
  source_trace?: RuntimeQASourceTrace | Record<string, unknown>;
}

export interface RuntimeQASEMPSTGateResultCandidate {
  sem_pst_qa_candidate_ref: string;
  gate_code?: RuntimeQASEMPSTGateCode;
  gate_family?: RuntimeQAGateFamily;
  expected_blocker: boolean;
  actual_blocker: boolean;
  expected_readiness_gap?: string;
  actual_readiness_gap?: string;
  moc_pf_olc_projection_when_blocked: false;
  timer_or_process_state_inferred: false;
  pass_fail: RuntimeQAPassFail;
  source_trace: RuntimeQASourceTrace | Record<string, unknown>;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeQARegressionCriticalBlockingReason[];
}

export interface RuntimeQAReadinessReentrySourceInput extends RuntimePhase12BoundaryGuardInput {
  readiness_reentry_qa_candidate_ref?: string;
  readiness_case: RuntimeQAReadinessCase | string;
  expected_readiness_state?: string;
  actual_readiness_state?: string;
  expected_reentry?: boolean;
  actual_reentry?: boolean;
  expected_manual_review?: boolean;
  actual_manual_review?: boolean;
  readiness_decision_record_real_created?: boolean;
  manual_review_request_real_created?: boolean;
  reentry_interactions_real_created?: boolean;
  export_preview_when_blocked_manual_review_reentry_created?: boolean;
  readiness_final_mutation_created?: boolean;
  pass_fail?: RuntimeQAPassFail | string;
  source_trace?: RuntimeQASourceTrace | Record<string, unknown>;
}

export interface RuntimeQAReadinessReentryResultCandidate {
  readiness_reentry_qa_candidate_ref: string;
  readiness_case?: RuntimeQAReadinessCase;
  expected_readiness_state?: string;
  actual_readiness_state?: string;
  expected_reentry: boolean;
  actual_reentry: boolean;
  expected_manual_review: boolean;
  actual_manual_review: boolean;
  readiness_decision_record_real_created: false;
  manual_review_request_real_created: false;
  reentry_interactions_real_created: false;
  export_preview_when_blocked_manual_review_reentry_created: false;
  readiness_final_mutation_created: false;
  pass_fail: RuntimeQAPassFail;
  source_trace: RuntimeQASourceTrace | Record<string, unknown>;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeQARegressionCriticalBlockingReason[];
}

export interface RuntimeQAExportPreviewSourceInput extends RuntimePhase12BoundaryGuardInput {
  export_preview_qa_candidate_ref?: string;
  export_preview_case: RuntimeQAExportPreviewCase | string;
  expected_payload_state?: string;
  actual_payload_state?: string;
  expected_blocking_rule?: string;
  actual_blocking_rule?: string;
  placeholder_payload_detected?: boolean;
  payload_state_sent?: boolean;
  post_export_executed?: boolean;
  parallel_export_payload_real_created?: boolean;
  produccion_paralela_started?: boolean;
  registry_ir_diagnosis_created?: boolean;
  pass_fail?: RuntimeQAPassFail | string;
  source_trace?: RuntimeQASourceTrace | Record<string, unknown>;
}

export interface RuntimeQAExportPreviewResultCandidate {
  export_preview_qa_candidate_ref: string;
  export_preview_case?: RuntimeQAExportPreviewCase;
  expected_payload_state?: string;
  actual_payload_state?: string;
  expected_blocking_rule?: string;
  actual_blocking_rule?: string;
  placeholder_payload_detected: false;
  payload_state_sent: false;
  post_export_executed: false;
  parallel_export_payload_real_created: false;
  produccion_paralela_started: false;
  registry_ir_diagnosis_created: false;
  pass_fail: RuntimeQAPassFail;
  source_trace: RuntimeQASourceTrace | Record<string, unknown>;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeQARegressionCriticalBlockingReason[];
}

export interface RuntimePhase12InputRevalidationDecision {
  phase11_closed_local: boolean;
  ready_for_phase12_authorization: boolean;
  phase12_started_local: boolean;
  phase12_closed_local: false;
  ready_for_real_activation_authorization: false;
  phase11_final_closeout_available: boolean;
  export_preview_service_candidates_available: boolean;
  scr_preview_candidates_available: boolean;
  evidence_bundle_preview_candidates_available: boolean;
  mdsb_preview_candidates_available: boolean;
  combined_preview_candidates_available: boolean;
  export_blocking_rules_available: boolean;
  export_preview_audit_candidates_available: boolean;
  phase11_persistence_boundary_available: boolean;
  export_real_previously_created: false;
  parallel_export_payload_real_previously_created: false;
  payload_state_sent_previously_detected: false;
  produccion_paralela_previously_started: false;
  supabase_previously_touched: false;
  sql_previously_executed: false;
  endpoint_previously_created: false;
  export_preview_recalculated: false;
  phase11_modified: false;
  runtime_real_started: false;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeQAFoundationBlockingReason[];
}

export interface RuntimeQASecurityShadowSourceInput extends RuntimePhase12BoundaryGuardInput {
  source_trace?: RuntimeQASourceTrace | Record<string, unknown>;
  service_role_used_in_client?: boolean;
  cross_case_read_detected?: boolean;
  cross_case_write_detected?: boolean;
  query_outside_case_or_tenant_detected?: boolean;
  rls_real_migration_created?: boolean;
  registry_write_attempted?: boolean;
  ir_write_attempted?: boolean;
  diagnosis_write_attempted?: boolean;
  object_inventory_write_attempted?: boolean;
  readiness_real_mutation_attempted?: boolean;
  export_real_attempted?: boolean;
  production_mode_attempted?: boolean;
  eight_activities_scale_attempted?: boolean;
  multi_role_scale_attempted?: boolean;
  external_delivery_attempted?: boolean;
  real_customer_data_used?: boolean;
  real_customer_data_authorized?: boolean;
  runtime_audit_trail_real_creation_attempted?: boolean;
  mba_event_ledger_real_creation_attempted?: boolean;
  compliance_report_real_creation_attempted?: boolean;
}

export interface RuntimeQASecurityScopeRLSCandidate {
  security_scope_rls_candidate_ref: string;
  case_id_scope_verified: boolean;
  role_id_scope_verified: boolean;
  activity_id_scope_verified: boolean;
  run_id_scope_verified: boolean;
  tenant_isolation_verified: boolean;
  anon_blocked: boolean;
  service_role_not_exposed: boolean;
  service_role_used_in_client: false;
  cross_case_read_detected: false;
  cross_case_write_detected: false;
  audit_trail_required_for_override: boolean;
  manual_review_actor_authorized: boolean;
  export_actor_system_authorized: boolean;
  query_outside_case_or_tenant_detected: false;
  activation_blocked_if_security_fails: true;
  rls_real_migration_created: false;
  supabase_touched: false;
  sql_executed: false;
  endpoint_created: false;
  source_trace: RuntimeQASourceTrace | Record<string, unknown>;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeQASecurityShadowBlockingReason[];
}

export interface RuntimeQANoWriteBoundaryCandidate {
  no_write_boundary_candidate_ref: string;
  scene_write_detected: false;
  mba_write_detected: false;
  parallel_production_runtime_artifacts_write_detected: false;
  registry_write_detected: false;
  ir_write_detected: false;
  diagnosis_write_detected: false;
  object_inventory_write_detected: false;
  readiness_real_mutation_detected: false;
  runtime_real_start_detected: false;
  export_real_detected: false;
  endpoint_creation_detected: false;
  sql_execution_detected: false;
  supabase_touch_detected: false;
  activation_blocked_if_write_detected: true;
  source_trace: RuntimeQASourceTrace | Record<string, unknown>;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeQASecurityShadowBlockingReason[];
}

export interface RuntimeQAShadowPilotScopeCandidate {
  shadow_pilot_candidate_ref: string;
  one_role_only: boolean;
  one_primary_activity_only: boolean;
  selected_role_id: string;
  selected_activity_id: string;
  selected_case_id: string;
  activity_runtime_run_candidate_ref: string;
  shadow_mode: true;
  production_mode: false;
  full_runtime_started: false;
  eight_activities_scale_started: false;
  multi_role_scale_started: false;
  external_delivery_created: false;
  explicit_human_authorization_required: true;
  source_trace: RuntimeQASourceTrace | Record<string, unknown>;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeQASecurityShadowBlockingReason[];
}

export interface RuntimeQAShadowPilotFixtureCandidate {
  shadow_fixture_candidate_ref: string;
  fixture_case: Record<string, unknown>;
  fixture_role: Record<string, unknown>;
  fixture_activity: Record<string, unknown>;
  fixture_responses: Record<string, unknown>[];
  fixture_expected_variables: Record<string, unknown>[];
  fixture_expected_gates: Record<string, unknown>[];
  fixture_expected_readiness: Record<string, unknown>;
  fixture_expected_export_preview: Record<string, unknown>;
  fixture_expected_no_go: Record<string, unknown>;
  fixture_expected_no_writes: Record<string, unknown>;
  deterministic_ids: boolean;
  sanitized_user_data: boolean;
  real_customer_data_used: false;
  real_customer_data_authorized: false;
  fixture_checksum: string;
  source_trace: RuntimeQASourceTrace | Record<string, unknown>;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeQASecurityShadowBlockingReason[];
}

export interface RuntimeQAShadowPilotRehearsalCandidate {
  shadow_rehearsal_candidate_ref: string;
  shadow_run_candidate_created: boolean;
  fixture_responses_loaded: boolean;
  phase6_response_ingest_candidate_executed: boolean;
  phase7_canonical_variable_candidate_executed: boolean;
  phase8_branching_budget_candidate_executed: boolean;
  phase9_gates_candidate_executed: boolean;
  phase10_readiness_candidate_executed: boolean;
  phase11_export_preview_candidate_executed: boolean;
  expected_actual_comparison_completed: boolean;
  divergence_records: Record<string, unknown>[];
  false_positive_count: number;
  false_negative_count: number;
  persistence_real_created: false;
  production_mode: false;
  external_delivery_created: false;
  runtime_real_started: false;
  source_trace: RuntimeQASourceTrace | Record<string, unknown>;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeQASecurityShadowBlockingReason[];
}

export interface RuntimeQAShadowPilotObservabilityCandidate {
  shadow_observability_candidate_ref: string;
  shadow_event_log_candidate_created: boolean;
  qa_event_log_candidate_created: boolean;
  divergence_report_candidate_created: boolean;
  no_go_dashboard_candidate_created: boolean;
  false_positive_count: number;
  false_negative_count: number;
  blocker_count: number;
  warning_count: number;
  runtime_audit_trail_real_created: false;
  mba_event_ledger_real_created: false;
  compliance_report_real_created: false;
  source_trace: RuntimeQASourceTrace | Record<string, unknown>;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeQASecurityShadowBlockingReason[];
}

export interface RuntimeQAResultGreenActivationSourceInput extends RuntimePhase12BoundaryGuardInput {
  source_trace?: RuntimeQASourceTrace | Record<string, unknown>;
  repo_wide_typecheck_debt_registered?: boolean;
  repo_wide_typecheck_required_before_real_activation?: boolean;
  build_environment_blocked_non_code_path_length?: boolean;
  qa_green_real_creation_attempted?: boolean;
  activation_allowed_attempted?: boolean;
  runtime_full_start_attempted?: boolean;
  production_parallel_attempted?: boolean;
  supabase_write_allowed_attempted?: boolean;
  endpoint_activation_attempted?: boolean;
  rollback_real_execution_attempted?: boolean;
  abort_real_execution_attempted?: boolean;
  data_deleted_without_trace_attempted?: boolean;
  rollback_mutates_readiness_attempted?: boolean;
  rollback_mutates_evidence_attempted?: boolean;
  rollback_mutates_export_payload_attempted?: boolean;
  rollback_creates_ghost_tasks_attempted?: boolean;
  runtime_audit_trail_real_creation_attempted?: boolean;
  qa_result_record_real_creation_attempted?: boolean;
  shadow_pilot_run_real_creation_attempted?: boolean;
  service_role_used_in_client?: boolean;
  export_real_attempted?: boolean;
}

export interface RuntimeQAResultCandidate {
  qa_result_candidate_ref: string;
  qa_rule_results: RuntimeQARuleCandidate[];
  ct_results: RuntimeQACriticalScenarioResultCandidate[];
  regression_results: RuntimeQARegressionResultCandidate[];
  typecheck_result: Record<string, unknown>;
  build_result: Record<string, unknown>;
  security_result: RuntimeQASecurityScopeRLSCandidate | Record<string, never>;
  no_write_result: RuntimeQANoWriteBoundaryCandidate | Record<string, never>;
  shadow_pilot_result: RuntimeQAShadowPilotRehearsalCandidate | Record<string, never>;
  pass_count: number;
  fail_count: number;
  blocked_count: number;
  environment_blocked_count: number;
  qa_green_candidate: boolean;
  qa_green_real_created: false;
  source_trace: RuntimeQASourceTrace | Record<string, unknown>;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeQAResultGreenActivationBlockingReason[];
}

export interface RuntimeQAGreenGateCandidate {
  qa_green_gate_candidate_ref: string;
  all_blocking_tests_passed: boolean;
  no_environment_blocked_critical: boolean;
  no_security_blocker: boolean;
  no_write_blocker: boolean;
  no_export_real_detected: boolean;
  no_runtime_real_start: boolean;
  shadow_pilot_passed_candidate: boolean;
  external_typecheck_debt_registered: boolean;
  repo_wide_typecheck_required_before_real_activation: true;
  build_environment_blocked_non_code_path_length: boolean;
  human_authorization_required: true;
  s5_delegated_authorization_required: boolean;
  operator_authorization_required: true;
  rollback_plan_required: true;
  abort_path_required: true;
  qa_green_candidate_created: boolean;
  qa_green_real_created: false;
  activation_allowed: false;
  source_trace: RuntimeQASourceTrace | Record<string, unknown>;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeQAResultGreenActivationBlockingReason[];
}

export interface RuntimeActivationReadinessBoundaryCandidate {
  activation_readiness_candidate_ref: string;
  qa_green_candidate_ref?: string;
  shadow_pilot_candidate_ref?: string;
  no_go_status: string;
  rollback_plan_ref?: string;
  abort_authority_ref?: string;
  security_scope_verified: boolean;
  export_scope_verified: boolean;
  runtime_scope_verified: boolean;
  repo_wide_typecheck_debt_registered: boolean;
  repo_wide_typecheck_required_before_real_activation: true;
  build_environment_blocked_non_code_path_length: boolean;
  activation_authorization_required: true;
  activation_allowed: false;
  runtime_full_start_allowed: false;
  production_parallel_allowed: false;
  supabase_write_allowed: false;
  endpoint_activation_allowed: false;
  source_trace: RuntimeQASourceTrace | Record<string, unknown>;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeQAResultGreenActivationBlockingReason[];
}

export interface RuntimeRollbackAbortPlanQACandidate {
  rollback_abort_candidate_ref: string;
  rollback_plan_candidate: Record<string, unknown>;
  rollback_trigger: string;
  rollback_scope: string;
  rollback_owner: string;
  rollback_steps: string[];
  rollback_test_result: string;
  abort_path_candidate: Record<string, unknown>;
  abort_authority: string;
  data_deleted_without_trace: false;
  rollback_mutates_readiness: false;
  rollback_mutates_evidence: false;
  rollback_mutates_export_payload: false;
  rollback_creates_ghost_tasks: false;
  rollback_required_before_activation: true;
  rollback_real_executed: false;
  abort_real_executed: false;
  source_trace: RuntimeQASourceTrace | Record<string, unknown>;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeQAResultGreenActivationBlockingReason[];
}

export interface RuntimeQAAuditCandidate {
  qa_audit_candidate_ref: string;
  qa_audit_action: RuntimeQAAuditAction;
  qa_audit_reason: string;
  source_qa_result_candidate_ref?: string;
  source_qa_green_gate_candidate_ref?: string;
  source_activation_readiness_candidate_ref?: string;
  source_trace: RuntimeQASourceTrace | Record<string, unknown>;
  runtime_audit_trail_real_created: false;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeQAResultGreenActivationBlockingReason[];
}

export interface RuntimeQAPersistenceBoundaryCandidate {
  qa_persistence_boundary_candidate_ref: string;
  local_qa_result_candidate_mode: true;
  local_qa_audit_candidate_mode: true;
  local_shadow_pilot_candidate_mode: true;
  local_no_go_dashboard_candidate_mode: true;
  local_activation_readiness_candidate_mode: true;
  real_qa_result_record_created: false;
  real_shadow_pilot_run_created: false;
  real_audit_trail_created: false;
  supabase_touched: false;
  sql_executed: false;
  endpoint_created: false;
  service_role_used: false;
  service_role_used_in_client: false;
  scene_write_detected: false;
  mba_write_detected: false;
  parallel_production_runtime_artifacts_write_detected: false;
  export_real_created: false;
  runtime_40_20_started: false;
  source_trace: RuntimeQASourceTrace | Record<string, unknown>;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeQAResultGreenActivationBlockingReason[];
}

export interface RuntimeQARunSourceInput extends RuntimePhase12BoundaryGuardInput {
  qa_run_candidate_ref?: string;
  run_id?: string;
  catalog_version_id?: string;
  source_trace?: RuntimeQASourceTrace | Record<string, unknown>;
  qa_scope?: (RuntimeQAScope | string)[];
  qa_status?: RuntimeQAStatus | string;
}

export interface RuntimeQARunCandidate {
  qa_run_candidate_ref: string;
  run_id?: string;
  catalog_version_id?: string;
  source_trace: RuntimeQASourceTrace | Record<string, unknown>;
  qa_scope: RuntimeQAScope[];
  qa_status: RuntimeQAStatus;
  runtime_qa_result_real_created: false;
  qa_green_real_created: false;
  shadow_pilot_real_started: false;
  runtime_real_started: false;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeQAFoundationBlockingReason[];
}

export interface RuntimeQARuleSourceInput extends RuntimePhase12BoundaryGuardInput {
  qa_rule_candidate_ref?: string;
  qa_checklist_ref?: string;
  runtime_qa_rule_ref?: string;
  qa_rule_id?: string;
  qa_rule_group?: string;
  qa_test_code?: string;
  qa_test_name?: string;
  expected_result?: string;
  blocking_level?: RuntimeQABlockingLevel | string;
  pass_fail_required?: boolean;
  source_node_ref?: string;
  source_trace?: RuntimeQASourceTrace | Record<string, unknown>;
  narrative_qa_only?: boolean;
  verifiable_result_required?: boolean;
  qa_rule_invented?: boolean;
}

export interface RuntimeQARuleCandidate {
  qa_rule_candidate_ref: string;
  qa_checklist_ref?: string;
  runtime_qa_rule_ref?: string;
  qa_rule_id?: string;
  qa_rule_group?: string;
  qa_test_code?: string;
  qa_test_name?: string;
  expected_result?: string;
  blocking_level?: RuntimeQABlockingLevel;
  pass_fail_required: true;
  source_node_ref?: string;
  source_trace: RuntimeQASourceTrace | Record<string, unknown>;
  narrative_qa_only: false;
  verifiable_result_required: true;
  qa_rule_invented: false;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeQAFoundationBlockingReason[];
}

export interface RuntimeQATestResultSourceInput extends RuntimePhase12BoundaryGuardInput {
  qa_test_code: string;
  qa_test_name?: string;
  expected_result?: string;
  actual_result?: string;
  pass_fail?: RuntimeQAPassFail | string;
  blocking_level?: RuntimeQABlockingLevel | string;
  evidence_ref?: string;
  source_trace?: RuntimeQASourceTrace | Record<string, unknown>;
  failure_reason?: string;
  activation_blocked_if_failed?: boolean;
  catalog_activation_allowed?: boolean;
  b7_direct_projection_detected?: boolean;
}

export interface RuntimeQATestResultCandidate {
  qa_test_code: string;
  qa_test_name: string;
  expected_result: string;
  actual_result: string;
  pass_fail: RuntimeQAPassFail;
  blocking_level: RuntimeQABlockingLevel;
  evidence_ref: string;
  source_trace: RuntimeQASourceTrace | Record<string, unknown>;
  failure_reason: string;
  activation_blocked_if_failed: boolean;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeQAFoundationBlockingReason[];
}

export interface RuntimeQAImportRuntimeBaseResultCandidate {
  qa_import_runtime_base_result_candidate_ref: string;
  results: RuntimeQATestResultCandidate[];
  activation_allowed: false;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeQAFoundationBlockingReason[];
}

export interface RuntimeQAImportVersioningActivationResultCandidate {
  qa_import_versioning_activation_result_candidate_ref: string;
  results: RuntimeQATestResultCandidate[];
  version_label_aligned_supported: boolean;
  docx_xlsx_checksum_non_null_supported: boolean;
  catalog_activation_allowed: false;
  orphan_source_code_unjustified_detection_supported: boolean;
  b7_direct_projection_detected: false;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeQAFoundationBlockingReason[];
}

export interface RuntimePhase12QAFoundationLocalInput {
  case_id: string;
  phase11_closeout: RuntimePhase11FinalCloseoutForPhase12Input;
  phase11_candidates: RuntimePhase11ExportPreviewInputCandidates;
  qa_run_sources?: RuntimeQARunSourceInput[];
  qa_rule_sources?: RuntimeQARuleSourceInput[];
  qa_import_runtime_base_sources?: RuntimeQATestResultSourceInput[];
  qa_import_versioning_activation_sources?: RuntimeQATestResultSourceInput[];
  qa_regression_sources?: RuntimeQARegressionResultSourceInput[];
  qa_typecheck_build_sources?: RuntimeQATypecheckBuildSourceInput[];
  qa_critical_scenario_sources?: RuntimeQACriticalScenarioSourceInput[];
  qa_critical_route_sources?: RuntimeQACriticalRouteSourceInput[];
  qa_sem_pst_gate_sources?: RuntimeQASEMPSTGateSourceInput[];
  qa_readiness_reentry_sources?: RuntimeQAReadinessReentrySourceInput[];
  qa_export_preview_sources?: RuntimeQAExportPreviewSourceInput[];
  qa_security_scope_rls_sources?: RuntimeQASecurityShadowSourceInput[];
  qa_no_write_boundary_sources?: RuntimeQASecurityShadowSourceInput[];
  qa_shadow_pilot_scope_sources?: RuntimeQASecurityShadowSourceInput[];
  qa_shadow_pilot_fixture_sources?: RuntimeQASecurityShadowSourceInput[];
  qa_shadow_pilot_rehearsal_sources?: RuntimeQASecurityShadowSourceInput[];
  qa_shadow_pilot_observability_sources?: RuntimeQASecurityShadowSourceInput[];
  qa_result_green_activation_sources?: RuntimeQAResultGreenActivationSourceInput[];
  boundary_guard?: RuntimePhase12BoundaryGuardInput;
}

export interface RuntimePhase12QAFoundationLocalResult {
  status: RuntimeQAFoundationStatus;
  phase12_input_revalidation: RuntimePhase12InputRevalidationDecision;
  qa_run_candidates: RuntimeQARunCandidate[];
  qa_rule_candidates: RuntimeQARuleCandidate[];
  qa_import_runtime_base_result_candidates: RuntimeQAImportRuntimeBaseResultCandidate[];
  qa_import_versioning_activation_result_candidates: RuntimeQAImportVersioningActivationResultCandidate[];
  qa_regression_result_candidates?: RuntimeQARegressionResultCandidate[];
  qa_typecheck_build_candidates?: RuntimeQATypecheckBuildCandidate[];
  qa_critical_scenario_result_candidates?: RuntimeQACriticalScenarioResultCandidate[];
  qa_critical_route_result_candidates?: RuntimeQACriticalRouteResultCandidate[];
  qa_sem_pst_gate_result_candidates?: RuntimeQASEMPSTGateResultCandidate[];
  qa_readiness_reentry_result_candidates?: RuntimeQAReadinessReentryResultCandidate[];
  qa_export_preview_result_candidates?: RuntimeQAExportPreviewResultCandidate[];
  security_scope_rls_candidates?: RuntimeQASecurityScopeRLSCandidate[];
  no_write_boundary_candidates?: RuntimeQANoWriteBoundaryCandidate[];
  shadow_pilot_scope_candidates?: RuntimeQAShadowPilotScopeCandidate[];
  shadow_pilot_fixture_candidates?: RuntimeQAShadowPilotFixtureCandidate[];
  shadow_pilot_rehearsal_candidates?: RuntimeQAShadowPilotRehearsalCandidate[];
  shadow_pilot_observability_candidates?: RuntimeQAShadowPilotObservabilityCandidate[];
  qa_result_candidates?: RuntimeQAResultCandidate[];
  qa_green_gate_candidates?: RuntimeQAGreenGateCandidate[];
  activation_readiness_boundary_candidates?: RuntimeActivationReadinessBoundaryCandidate[];
  rollback_abort_plan_qa_candidates?: RuntimeRollbackAbortPlanQACandidate[];
  qa_audit_candidates?: RuntimeQAAuditCandidate[];
  qa_persistence_boundary_candidates?: RuntimeQAPersistenceBoundaryCandidate[];
  phase12_started_local: boolean;
  phase12_closed_local: false;
  ready_for_real_activation_authorization: false;
  runtime_40_20_started: false;
  catalog_activated: false;
  migration_applied: false;
  runtime_qa_result_real_created: false;
  qa_green_real_created: false;
  shadow_pilot_real_started: false;
  full_runtime_authorized: false;
  production_real_started: false;
  export_real_created: false;
  parallel_export_payload_real_created: false;
  produccion_paralela_started: false;
  registry_created: false;
  ir_created: false;
  diagnosis_created: false;
  control_plane_real_created: false;
  mba_write_detected: false;
  scene_write_detected: false;
  parallel_production_runtime_artifacts_write_detected: false;
  supabase_touched: false;
  sql_executed: false;
  endpoint_created: false;
  service_role_used: false;
  service_role_used_in_client: false;
}
