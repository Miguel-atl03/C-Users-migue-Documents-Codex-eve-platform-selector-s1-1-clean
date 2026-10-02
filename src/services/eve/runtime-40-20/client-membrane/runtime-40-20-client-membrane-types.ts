export type RuntimeClientVisibleState =
  | "session_ready"
  | "workmap_ready"
  | "primary_activity_selected"
  | "significado_ready"
  | "activity_runtime_ready"
  | "question_presented"
  | "answer_captured_candidate"
  | "evidence_candidate_created"
  | "review_required"
  | "result_in_review"
  | "blocked_safe";

export type RuntimeClientMembraneCardKind =
  | "confirmation_card_with_correction"
  | "compound_card"
  | "causal_probe_card"
  | "microconfirmation_card"
  | "review_gap_card"
  | "safe_status_card";

export type RuntimeClientHiddenInternalSurface =
  | "runtime_tables"
  | "runtime_interaction_instance"
  | "canonical_variable_record"
  | "evidence_item"
  | "branching_decision"
  | "budget_ledger"
  | "critical_route_gate_internal"
  | "mmabp_gate_internal"
  | "semantic_resolution_event"
  | "process_state_timer_event"
  | "readiness_gap_record"
  | "readiness_decision_record"
  | "chips_internal"
  | "vsm_internal"
  | "ahe_internal"
  | "mmabp_internal"
  | "object_inventory"
  | "integration_membrane"
  | "soft_governance"
  | "no_go_internal"
  | "registry"
  | "ir"
  | "diagnosis"
  | "parallel_production";

export type RuntimeClientMembraneBlockingReason =
  | "missing_source_trace"
  | "missing_case_scope"
  | "missing_role_scope"
  | "missing_activity_scope"
  | "missing_run_scope"
  | "internal_surface_exposure_attempted"
  | "diagnosis_exposure_attempted"
  | "export_exposure_attempted"
  | "registry_exposure_attempted"
  | "ir_exposure_attempted"
  | "runtime_table_exposure_attempted"
  | "chip_direct_invocation_attempted"
  | "gate_bypass_attempted"
  | "supabase_touch_attempted"
  | "sql_execution_attempted"
  | "endpoint_creation_attempted"
  | "runtime_real_start_attempted";

export interface RuntimeClientScopeRef {
  case_id?: string;
  tenant_id?: string;
  role_id?: string;
  activity_id?: string;
  run_id?: string;
  role_runtime_session_ref?: string;
  activity_runtime_run_ref?: string;
}

export interface RuntimeClientMembraneSourceTrace {
  source_document: string;
  source_section: string;
  source_element: string;
  extracted_for_platform_use: string;
  source_trace_ref?: string;
}

export interface RuntimeClientVisibleStateContractCandidate {
  client_visible_state_contract_ref: string;
  visible_states: RuntimeClientVisibleState[];
  allowed_card_kinds: RuntimeClientMembraneCardKind[];
  safe_client_copy_policy: {
    no_mmabp_jargon: true;
    no_vsm_jargon: true;
    no_ahe_jargon: true;
    no_gate_jargon: true;
    no_chip_jargon: true;
    no_diagnosis_final: true;
  };
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientMembraneBlockingReason[];
}

export interface RuntimeClientInternalSurfaceGuardCandidate {
  internal_surface_guard_ref: string;
  hidden_surfaces: RuntimeClientHiddenInternalSurface[];
  gate_greater_than_chip_enforced: true;
  client_can_call_chips_directly: false;
  client_can_bypass_gates: false;
  client_can_view_no_go_internal: false;
  client_can_view_runtime_tables: false;
  client_can_view_diagnosis_internal: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientMembraneBlockingReason[];
}

export interface RuntimeClientBFFContractCandidate {
  bff_contract_candidate_ref: string;
  scope_ref: RuntimeClientScopeRef;
  consumes_runtime_candidate_state: boolean;
  exposes_client_visible_state_only: true;
  exposes_internal_organs: false;
  endpoint_created: false;
  supabase_touched: false;
  sql_executed: false;
  runtime_real_started: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientMembraneBlockingReason[];
}

export interface RuntimeClientMembraneAuditCandidate {
  client_membrane_audit_candidate_ref: string;
  audit_action:
    | "client_membrane_contract_created"
    | "bff_contract_created"
    | "visible_state_contract_created"
    | "internal_surface_guard_created"
    | "scope_contract_created"
    | "no_diagnosis_boundary_created"
    | "no_export_boundary_created";
  audit_reason: string;
  runtime_audit_trail_real_created: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
}

export interface RuntimePhase9AClientMembraneLocalResult {
  phase9_started_local: true;
  phase9_closed_local: false;
  phase9a_completed_local: boolean;
  ready_for_phase9b_authorization: false;

  client_visible_state_contract_candidates: RuntimeClientVisibleStateContractCandidate[];
  internal_surface_guard_candidates: RuntimeClientInternalSurfaceGuardCandidate[];
  bff_contract_candidates: RuntimeClientBFFContractCandidate[];
  client_membrane_audit_candidates: RuntimeClientMembraneAuditCandidate[];

  runtime_40_20_started_real: false;
  qa_green_real_created: false;
  activation_allowed: false;
  supabase_touched: false;
  sql_executed: false;
  endpoint_created: false;
  export_real_created: false;
  produccion_paralela_started: false;
  registry_created: false;
  ir_created: false;
  diagnosis_created: false;
}

export interface RuntimeClientMembraneLocalInput {
  scope_ref?: RuntimeClientScopeRef;
  source_trace?: RuntimeClientMembraneSourceTrace[];
  attempted_internal_surfaces?: RuntimeClientHiddenInternalSurface[];
  diagnosis_exposure_attempted?: boolean;
  export_exposure_attempted?: boolean;
  registry_exposure_attempted?: boolean;
  ir_exposure_attempted?: boolean;
  chip_direct_invocation_attempted?: boolean;
  gate_bypass_attempted?: boolean;
  supabase_touch_attempted?: boolean;
  sql_execution_attempted?: boolean;
  endpoint_creation_attempted?: boolean;
  runtime_real_start_attempted?: boolean;
  public_production_route_attempted?: boolean;
  missing_safe_dto_attempted?: boolean;
  missing_bff_boundary_attempted?: boolean;
  runtime_direct_call_attempted?: boolean;
  internal_organ_render_attempted?: boolean;
  diagnosis_final_render_attempted?: boolean;
  export_status_internal_render_attempted?: boolean;
  mmabp_jargon_detected?: boolean;
  vsm_jargon_detected?: boolean;
  ahe_jargon_detected?: boolean;
  gate_jargon_detected?: boolean;
  chip_jargon_detected?: boolean;
  runtime_table_jargon_detected?: boolean;
  internal_import_detected?: boolean;
  api_route_creation_attempted?: boolean;
  middleware_creation_attempted?: boolean;
  real_client_access_attempted?: boolean;
  internal_surface_leak_attempted?: boolean;
  diagnosis_leak_attempted?: boolean;
  export_leak_attempted?: boolean;
  secondary_activity_auto_open_attempted?: boolean;
  selection_above_8_without_methodological_decision?: boolean;
  real_customer_data_attempted?: boolean;
  missing_activity_runtime_run_candidate_attempted?: boolean;
  missing_interaction_candidate_attempted?: boolean;
  missing_required_answer_attempted?: boolean;
  runtime_interaction_instance_real_creation_attempted?: boolean;
  runtime_state_mutation_attempted?: boolean;
  response_record_real_creation_attempted?: boolean;
  runtime_subfield_response_real_creation_attempted?: boolean;
  evidence_item_real_creation_attempted?: boolean;
  canonical_variable_record_real_creation_attempted?: boolean;
  readiness_gap_record_real_creation_attempted?: boolean;
  runtime_audit_trail_real_creation_attempted?: boolean;
  semantic_resolution_event_real_creation_attempted?: boolean;
  process_state_timer_event_real_creation_attempted?: boolean;
  critical_route_gate_real_execution_attempted?: boolean;
  readiness_decision_record_real_creation_attempted?: boolean;
  manual_review_real_creation_attempted?: boolean;
  reentry_interaction_real_creation_attempted?: boolean;
  diagnosis_final_creation_attempted?: boolean;
  diagnostic_label_creation_attempted?: boolean;
  pathology_classification_attempted?: boolean;
  export_real_creation_attempted?: boolean;
  parallel_export_payload_real_creation_attempted?: boolean;
  registry_creation_attempted?: boolean;
  ir_creation_attempted?: boolean;
  qa_green_real_creation_attempted?: boolean;
  public_route_creation_attempted?: boolean;
  phase9_close_attempted?: boolean;
  production_deployment_creation_attempted?: boolean;
  produccion_paralela_start_attempted?: boolean;
  missing_phase9a_traceability_attempted?: boolean;
  missing_phase9b_traceability_attempted?: boolean;
  missing_phase9c_traceability_attempted?: boolean;
  missing_phase9d_traceability_attempted?: boolean;
  missing_phase9e_traceability_attempted?: boolean;
  missing_phase9f_traceability_attempted?: boolean;
  missing_phase9g_traceability_attempted?: boolean;
  missing_phase9h_traceability_attempted?: boolean;
  cross_phase_inconsistency_attempted?: boolean;
  client_surface_leakage_attempted?: boolean;
  archived_plan_active_guide_attempted?: boolean;
  handoff_active_guide_attempted?: boolean;
  free_inference_attempted?: boolean;
  unauthorized_expansion_attempted?: boolean;
  chip_override_gate_attempted?: boolean;
  production_from_chip_attempted?: boolean;
  no_go_real_persistence_attempted?: boolean;
  activation_allowed_attempted?: boolean;
  missing_answer_capture_candidate_attempted?: boolean;
  missing_subfield_capture_candidate_attempted?: boolean;
  missing_evidence_candidate_attempted?: boolean;
  missing_canonical_variable_candidate_attempted?: boolean;
  derived_without_source_attempted?: boolean;
  text_similarity_only_attempted?: boolean;
  diagnostic_inference_attempted?: boolean;
  budget_ledger_real_update_attempted?: boolean;
  gate_real_execution_attempted?: boolean;
  internal_code_exposure_attempted?: boolean;
  readiness_gap_internal_exposure_attempted?: boolean;
  no_go_internal_exposure_attempted?: boolean;
}

export type RuntimeClientRouteKind =
  | "login"
  | "estado_inicial"
  | "workmap"
  | "significado"
  | "resultado_en_revision"
  | "blocked_safe";

export type RuntimeClientRouteState =
  | "session_ready"
  | "workmap_ready"
  | "primary_activity_selected"
  | "significado_ready"
  | "activity_runtime_candidate_ready"
  | "result_in_review"
  | "blocked_safe";

export type RuntimeClientBFFReadBlockingReason =
  | "missing_source_trace"
  | "missing_scope"
  | "missing_case_id"
  | "missing_tenant_id"
  | "missing_role_id"
  | "missing_activity_id"
  | "missing_run_id"
  | "endpoint_creation_attempted"
  | "supabase_touch_attempted"
  | "sql_execution_attempted"
  | "runtime_real_start_attempted"
  | "internal_organ_exposure_attempted"
  | "chip_direct_call_attempted"
  | "gate_direct_call_attempted"
  | "runtime_table_exposure_attempted"
  | "diagnosis_exposure_attempted"
  | "export_payload_exposure_attempted"
  | "secondary_activity_run_auto_open_attempted"
  | "bff_boundary_bypass_attempted";

export interface RuntimeClientBFFReadContractCandidate {
  bff_read_contract_candidate_ref: string;
  read_scope: RuntimeClientScopeRef;
  case_id?: string;
  tenant_id?: string;
  role_id?: string;
  activity_id?: string;
  run_id?: string;
  role_runtime_session_ref?: string;
  activity_runtime_run_ref?: string;
  allowed_client_route: RuntimeClientRouteKind;
  allowed_visible_states: RuntimeClientVisibleState[];
  safe_dto_contract_ref?: string;
  reads_runtime_candidate_state: true;
  creates_endpoint_real: false;
  supabase_touched: false;
  sql_executed: false;
  runtime_real_started: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientBFFReadBlockingReason[];
}

export interface RuntimeClientRouteCandidate {
  client_route_candidate_ref: string;
  route_kind: RuntimeClientRouteKind;
  route_label: string;
  route_purpose: string;
  allowed_entry_state: RuntimeClientRouteState;
  allowed_exit_state: RuntimeClientRouteState;
  requires_bff_read_contract: true;
  requires_scope: true;
  client_can_access_internal_organs: false;
  client_can_access_chips: false;
  client_can_access_gates: false;
  client_can_access_runtime_tables: false;
  client_can_access_diagnosis: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientBFFReadBlockingReason[];
}

export interface RuntimeClientUIAdapterBoundaryCandidate {
  ui_adapter_boundary_candidate_ref: string;
  ui_surface: "significado_de_tu_trabajo";
  adapter_mode: "candidate";
  consumes_bff_read_dto: true;
  consumes_runtime_directly: false;
  calls_chips_directly: false;
  calls_gates_directly: false;
  shows_internal_jargon: false;
  shows_final_diagnosis: false;
  shows_export_status_internal: false;
  safe_cards_supported: RuntimeClientMembraneCardKind[];
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientBFFReadBlockingReason[];
}

export interface RuntimeWorkMapToSignificadoHandoffCandidate {
  workmap_significado_handoff_candidate_ref: string;
  selected_primary_activity_ref?: string;
  role_runtime_session_ref?: string;
  activity_runtime_run_candidate_ref?: string;
  handoff_state:
    | "primary_activity_selected"
    | "significado_ready"
    | "activity_runtime_candidate_ready"
    | "blocked_safe";
  handoff_requires_scope: true;
  creates_activity_runtime_run_real: false;
  opens_secondary_activity_run_by_default: false;
  selection_above_8_requires_methodological_decision: true;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientBFFReadBlockingReason[];
}

export interface RuntimeStateReadFacadeCandidate {
  runtime_state_read_facade_candidate_ref: string;
  reads_role_runtime_session_candidate: boolean;
  reads_activity_runtime_run_candidate: boolean;
  reads_runtime_interaction_instance_candidate: boolean;
  reads_readiness_candidate: boolean;
  reads_gap_candidate: boolean;
  reads_gate_candidate_summary: boolean;
  reads_internal_details: false;
  writes_runtime_state: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientBFFReadBlockingReason[];
}

export interface RuntimeClientSafeDTOCandidate {
  safe_dto_candidate_ref: string;
  visible_state: RuntimeClientVisibleState;
  visible_progress?: Record<string, unknown>;
  visible_prompt?: Record<string, unknown>;
  visible_cards: RuntimeClientMembraneCardKind[];
  visible_next_action?: string;
  visible_result_state?: string;
  hidden_internal_surfaces: RuntimeClientHiddenInternalSurface[];
  diagnosis_final_included: false;
  registry_included: false;
  ir_included: false;
  export_payload_included: false;
  gate_internal_included: false;
  chip_internal_included: false;
  runtime_table_included: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientBFFReadBlockingReason[];
}

export interface RuntimeClientNoDirectInternalInvocationGuardCandidate {
  no_direct_internal_invocation_guard_ref: string;
  ui_direct_runtime_call_detected: false;
  ui_direct_chip_call_detected: false;
  ui_direct_gate_call_detected: false;
  ui_direct_supabase_call_detected: false;
  ui_direct_sql_call_detected: false;
  ui_direct_export_call_detected: false;
  bff_boundary_required: true;
  gate_greater_than_chip_enforced: true;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientBFFReadBlockingReason[];
}

export interface RuntimePhase9BClientBFFReadLocalResult extends RuntimePhase9AClientMembraneLocalResult {
  phase9_A_accepted: true;
  phase9_B_completed_local: boolean;
  ready_for_phase9C_authorization: false;
  bff_read_contract_candidates: RuntimeClientBFFReadContractCandidate[];
  client_route_candidates: RuntimeClientRouteCandidate[];
  ui_adapter_boundary_candidates: RuntimeClientUIAdapterBoundaryCandidate[];
  workmap_significado_handoff_candidates: RuntimeWorkMapToSignificadoHandoffCandidate[];
  runtime_state_read_facade_candidates: RuntimeStateReadFacadeCandidate[];
  safe_dto_candidates: RuntimeClientSafeDTOCandidate[];
  no_direct_internal_invocation_guard_candidates: RuntimeClientNoDirectInternalInvocationGuardCandidate[];
}

export type RuntimeClientShellBlockingReason =
  | "missing_source_trace"
  | "missing_safe_dto"
  | "missing_bff_boundary"
  | "public_production_route_attempted"
  | "endpoint_creation_attempted"
  | "supabase_touch_attempted"
  | "sql_execution_attempted"
  | "runtime_real_start_attempted"
  | "runtime_direct_call_attempted"
  | "chip_direct_call_attempted"
  | "gate_direct_call_attempted"
  | "internal_organ_render_attempted"
  | "diagnosis_final_render_attempted"
  | "export_status_internal_render_attempted"
  | "mmabp_jargon_detected"
  | "vsm_jargon_detected"
  | "ahe_jargon_detected"
  | "gate_jargon_detected"
  | "chip_jargon_detected"
  | "runtime_table_jargon_detected"
  | "internal_import_detected";

export interface RuntimeClientRouteShellCandidate {
  route_shell_candidate_ref: string;
  route_kind: RuntimeClientRouteKind;
  route_shell_label: string;
  route_shell_purpose: string;
  allowed_visible_state: RuntimeClientVisibleState;
  requires_safe_dto: true;
  requires_bff_boundary: true;
  route_is_public_production: false;
  next_route_file_created: false;
  endpoint_created: false;
  supabase_touched: false;
  sql_executed: false;
  runtime_real_started: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientShellBlockingReason[];
}

export interface RuntimeClientSafeUIViewModelCandidate {
  safe_ui_view_model_candidate_ref: string;
  visible_state: RuntimeClientVisibleState;
  visible_title: string;
  visible_description?: string;
  visible_progress_label?: string;
  visible_cards: RuntimeClientMembraneCardKind[];
  visible_primary_action_label?: string;
  visible_secondary_action_label?: string;
  visible_result_message?: string;
  hidden_internal_surfaces: RuntimeClientHiddenInternalSurface[];
  no_mmabp_jargon: true;
  no_vsm_jargon: true;
  no_ahe_jargon: true;
  no_gate_jargon: true;
  no_chip_jargon: true;
  no_runtime_table_jargon: true;
  diagnosis_final_included: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientShellBlockingReason[];
}

export interface RuntimeClientSafeCardRendererBoundaryCandidate {
  safe_card_renderer_boundary_ref: string;
  supported_card_kinds: RuntimeClientMembraneCardKind[];
  renders_confirmation_card_with_correction: boolean;
  renders_compound_card: boolean;
  renders_causal_probe_card: boolean;
  renders_microconfirmation_card: boolean;
  renders_review_gap_card: boolean;
  renders_safe_status_card: boolean;
  renders_internal_gate_state: false;
  renders_internal_chip_state: false;
  renders_runtime_table_state: false;
  renders_diagnosis_final: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientShellBlockingReason[];
}

export interface RuntimeSignificadoShellIntegrationCandidate {
  significado_shell_integration_candidate_ref: string;
  ui_surface: "significado_de_tu_trabajo";
  integration_mode: "candidate";
  consumes_safe_view_model: true;
  consumes_bff_read_dto: true;
  calls_runtime_directly: false;
  calls_chips_directly: false;
  calls_gates_directly: false;
  calls_supabase_directly: false;
  calls_sql_directly: false;
  shows_internal_organs: false;
  shows_final_diagnosis: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientShellBlockingReason[];
}

export interface RuntimeClientCopyNoJargonCandidate {
  client_copy_no_jargon_candidate_ref: string;
  forbidden_terms: string[];
  allowed_client_terms: string[];
  mmabp_jargon_detected: false;
  vsm_jargon_detected: false;
  ahe_jargon_detected: false;
  gate_jargon_detected: false;
  chip_jargon_detected: false;
  runtime_table_jargon_detected: false;
  diagnosis_final_language_detected: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientShellBlockingReason[];
}

export interface RuntimeClientShellNoInternalImportsGuardCandidate {
  no_internal_imports_guard_ref: string;
  component_imports_runtime_services: false;
  component_imports_chips: false;
  component_imports_gates: false;
  component_imports_supabase: false;
  component_imports_sql: false;
  component_imports_registry: false;
  component_imports_diagnosis: false;
  component_imports_exporter: false;
  component_imports_parallel_production: false;
  bff_boundary_required: true;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientShellBlockingReason[];
}

export interface RuntimeClientShellLocalRenderEvidenceCandidate {
  local_render_evidence_candidate_ref: string;
  sample_visible_state: RuntimeClientVisibleState;
  sample_safe_dto_ref?: string;
  sample_view_model_ref?: string;
  render_candidate_created: boolean;
  rendered_internal_organs: false;
  rendered_final_diagnosis: false;
  rendered_export_status: false;
  rendered_gate_jargon: false;
  rendered_chip_jargon: false;
  rendered_runtime_table_jargon: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientShellBlockingReason[];
}

export interface RuntimePhase9CClientRouteShellSafeUILocalResult {
  phase9_started_local: true;
  phase9_A_accepted: true;
  phase9_B_accepted: true;
  phase9_C_completed_local: boolean;
  phase9_closed_local: false;
  ready_for_phase9D_authorization: false;

  route_shell_candidates: RuntimeClientRouteShellCandidate[];
  safe_ui_view_model_candidates: RuntimeClientSafeUIViewModelCandidate[];
  safe_card_renderer_boundary_candidates: RuntimeClientSafeCardRendererBoundaryCandidate[];
  significado_shell_integration_candidates: RuntimeSignificadoShellIntegrationCandidate[];
  client_copy_no_jargon_candidates: RuntimeClientCopyNoJargonCandidate[];
  no_internal_imports_guard_candidates: RuntimeClientShellNoInternalImportsGuardCandidate[];
  local_render_evidence_candidates: RuntimeClientShellLocalRenderEvidenceCandidate[];

  endpoint_created: false;
  supabase_touched: false;
  sql_executed: false;
  runtime_40_20_started_real: false;
  qa_green_real_created: false;
  activation_allowed: false;
  diagnosis_created: false;
  export_real_created: false;
  produccion_paralela_started: false;
}

export type RuntimeClientLocalWiringBlockingReason =
  | "missing_source_trace"
  | "missing_bff_read_contract"
  | "missing_safe_dto"
  | "missing_route_shell"
  | "missing_ui_shell"
  | "missing_fixture"
  | "endpoint_creation_attempted"
  | "api_route_creation_attempted"
  | "middleware_creation_attempted"
  | "public_production_route_attempted"
  | "real_client_access_attempted"
  | "supabase_touch_attempted"
  | "sql_execution_attempted"
  | "runtime_real_start_attempted"
  | "runtime_direct_call_attempted"
  | "chip_direct_call_attempted"
  | "gate_direct_call_attempted"
  | "internal_surface_leak_attempted"
  | "diagnosis_leak_attempted"
  | "export_leak_attempted"
  | "secondary_activity_auto_open_attempted"
  | "selection_above_8_without_methodological_decision"
  | "real_customer_data_attempted";

export interface RuntimeLocalBFFAdapterCandidate {
  local_bff_adapter_candidate_ref: string;
  adapter_mode: "local_candidate";
  consumes_bff_read_contract_candidate: true;
  consumes_safe_dto_candidate: true;
  consumes_runtime_state_read_facade_candidate: true;
  returns_client_visible_state_only: true;
  endpoint_created: false;
  api_route_created: false;
  supabase_touched: false;
  sql_executed: false;
  runtime_real_started: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientLocalWiringBlockingReason[];
}

export interface RuntimeSafeDTOResolverCandidate {
  safe_dto_resolver_candidate_ref: string;
  input_facade_candidate_ref?: string;
  input_route_shell_candidate_ref?: string;
  input_scope_ref?: RuntimeClientScopeRef;
  resolved_safe_dto_ref?: string;
  visible_state: RuntimeClientVisibleState;
  visible_cards: RuntimeClientMembraneCardKind[];
  visible_next_action?: string;
  visible_result_state?: string;
  internal_surface_removed: true;
  diagnosis_removed: true;
  registry_removed: true;
  ir_removed: true;
  export_payload_removed: true;
  gate_internal_removed: true;
  chip_internal_removed: true;
  runtime_table_removed: true;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientLocalWiringBlockingReason[];
}

export interface RuntimeControlledRouteWiringManifestCandidate {
  controlled_route_wiring_manifest_ref: string;
  route_kind: RuntimeClientRouteKind;
  route_shell_candidate_ref?: string;
  bff_adapter_candidate_ref?: string;
  safe_dto_resolver_candidate_ref?: string;
  ui_shell_candidate_ref?: string;
  route_public_production_enabled: false;
  next_page_created: false;
  api_route_created: false;
  middleware_created: false;
  client_real_access_enabled: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientLocalWiringBlockingReason[];
}

export interface RuntimeSignificadoShellLocalWiringCandidate {
  significado_shell_local_wiring_candidate_ref: string;
  ui_surface: "significado_de_tu_trabajo";
  uses_safe_view_model_candidate: true;
  uses_local_bff_adapter_candidate: true;
  uses_fixture_candidate: true;
  calls_runtime_directly: false;
  calls_chips_directly: false;
  calls_gates_directly: false;
  calls_supabase_directly: false;
  calls_sql_directly: false;
  public_route_enabled: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientLocalWiringBlockingReason[];
}

export interface RuntimeWorkMapPrimaryActivityLocalHandoffResolverCandidate {
  workmap_primary_activity_handoff_resolver_ref: string;
  selected_primary_activity_ref?: string;
  role_runtime_session_candidate_ref?: string;
  activity_runtime_run_candidate_ref?: string;
  handoff_resolved_to_significado: true;
  activity_is_primary: true;
  secondary_activity_auto_opened: false;
  selection_above_8_detected: false;
  selection_above_8_requires_methodological_decision: true;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientLocalWiringBlockingReason[];
}

export interface RuntimeClientMembraneFixtureCandidate {
  client_membrane_fixture_ref: string;
  fixture_scope_ref: RuntimeClientScopeRef;
  fixture_selected_primary_activity: Record<string, unknown>;
  fixture_role_runtime_session_candidate: Record<string, unknown>;
  fixture_activity_runtime_run_candidate: Record<string, unknown>;
  fixture_visible_state: RuntimeClientVisibleState;
  fixture_safe_cards: RuntimeClientMembraneCardKind[];
  fixture_expected_safe_dto: Record<string, unknown>;
  fixture_expected_no_internal_surfaces: true;
  fixture_expected_no_diagnosis: true;
  fixture_expected_no_export: true;
  deterministic_ids: true;
  real_customer_data_used: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientLocalWiringBlockingReason[];
}

export interface RuntimeClientLocalWiringEvidenceCandidate {
  local_wiring_evidence_candidate_ref: string;
  fixture_ref?: string;
  route_manifest_ref?: string;
  bff_adapter_ref?: string;
  safe_dto_ref?: string;
  ui_shell_ref?: string;
  render_evidence_created: true;
  expected_visible_state_rendered: RuntimeClientVisibleState;
  internal_organs_rendered: false;
  runtime_tables_rendered: false;
  gate_jargon_rendered: false;
  chip_jargon_rendered: false;
  diagnosis_rendered: false;
  export_status_rendered: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientLocalWiringBlockingReason[];
}

export interface RuntimeNoPublicExposureNoEndpointGuardCandidate {
  no_public_exposure_guard_ref: string;
  public_route_created: false;
  api_endpoint_created: false;
  middleware_created: false;
  real_client_access_enabled: false;
  supabase_touched: false;
  sql_executed: false;
  runtime_real_started: false;
  qa_green_real_created: false;
  activation_allowed: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientLocalWiringBlockingReason[];
}

export interface RuntimePhase9DControlledLocalClientRouteWiringLocalResult {
  phase9_started_local: true;
  phase9_A_accepted: true;
  phase9_B_accepted: true;
  phase9_C_accepted: true;
  phase9_D_completed_local: boolean;
  phase9_closed_local: false;
  ready_for_phase9E_authorization: false;

  local_bff_adapter_candidates: RuntimeLocalBFFAdapterCandidate[];
  safe_dto_resolver_candidates: RuntimeSafeDTOResolverCandidate[];
  controlled_route_wiring_manifest_candidates: RuntimeControlledRouteWiringManifestCandidate[];
  significado_shell_local_wiring_candidates: RuntimeSignificadoShellLocalWiringCandidate[];
  workmap_primary_activity_handoff_resolver_candidates: RuntimeWorkMapPrimaryActivityLocalHandoffResolverCandidate[];
  client_membrane_fixture_candidates: RuntimeClientMembraneFixtureCandidate[];
  local_wiring_evidence_candidates: RuntimeClientLocalWiringEvidenceCandidate[];
  no_public_exposure_guard_candidates: RuntimeNoPublicExposureNoEndpointGuardCandidate[];

  endpoint_created: false;
  api_route_created: false;
  public_route_created: false;
  supabase_touched: false;
  sql_executed: false;
  runtime_40_20_started_real: false;
  qa_green_real_created: false;
  activation_allowed: false;
  diagnosis_created: false;
  export_real_created: false;
  produccion_paralela_started: false;
}

export type RuntimeClientInteractionCursorBlockingReason =
  | "missing_source_trace"
  | "missing_activity_runtime_run_candidate"
  | "missing_interaction_candidate"
  | "missing_required_answer"
  | "runtime_interaction_instance_real_creation_attempted"
  | "runtime_state_mutation_attempted"
  | "response_record_real_creation_attempted"
  | "runtime_subfield_response_real_creation_attempted"
  | "evidence_item_real_creation_attempted"
  | "budget_ledger_real_update_attempted"
  | "gate_real_execution_attempted"
  | "internal_code_exposure_attempted"
  | "mmabp_jargon_exposure_attempted"
  | "vsm_jargon_exposure_attempted"
  | "ahe_jargon_exposure_attempted"
  | "gate_jargon_exposure_attempted"
  | "chip_jargon_exposure_attempted"
  | "readiness_gap_internal_exposure_attempted"
  | "no_go_internal_exposure_attempted";

export type RuntimeClientAnswerStateCandidate =
  | "draft"
  | "answered_candidate"
  | "confirmed_candidate"
  | "corrected_candidate"
  | "blocked_safe";

export type RuntimeClientInteractionStateCandidate =
  | "pending"
  | "shown"
  | "answered"
  | "confirmed"
  | "corrected"
  | "blocked"
  | "reopened"
  | "skipped_by_rule"
  | "closed_by_other";

export interface RuntimeClientLocalInteractionCursorCandidate {
  local_interaction_cursor_candidate_ref: string;
  activity_runtime_run_candidate_ref?: string;
  current_interaction_candidate_ref?: string;
  current_position: number;
  total_visible_interactions_candidate: number;
  current_card_kind: RuntimeClientMembraneCardKind;
  current_visible_state: RuntimeClientVisibleState;
  can_move_next: boolean;
  can_move_previous: boolean;
  requires_answer_before_next: boolean;
  runtime_interaction_instance_real_created: false;
  runtime_state_mutated: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientInteractionCursorBlockingReason[];
}

export interface RuntimeClientVisibleProgressCandidate {
  visible_progress_candidate_ref: string;
  activity_runtime_run_candidate_ref?: string;
  visible_completed_count: number;
  visible_total_count: number;
  visible_base_budget_max: 40;
  visible_causal_budget_max: 20;
  visible_microconfirmation_included: boolean;
  visible_progress_label: string;
  visible_progress_percent_candidate: number;
  budget_ledger_real_created: false;
  readiness_final_created: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientInteractionCursorBlockingReason[];
}

export interface RuntimeClientQuestionPresentationCandidate {
  question_presentation_candidate_ref: string;
  interaction_candidate_ref?: string;
  source_node_ref?: string;
  runtime_interaction_def_ref?: string;
  card_kind: RuntimeClientMembraneCardKind;
  visible_prompt: string;
  visible_help_text?: string;
  visible_required_fields: string[];
  visible_optional_fields: string[];
  client_copy_safe: true;
  internal_codes_hidden: true;
  mmabp_vsm_ahe_jargon_hidden: true;
  gate_chip_jargon_hidden: true;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientInteractionCursorBlockingReason[];
}

export interface RuntimeClientAnswerCaptureCandidate {
  answer_capture_candidate_ref: string;
  interaction_candidate_ref?: string;
  captured_answer_candidate?: Record<string, unknown>;
  answer_state_candidate: RuntimeClientAnswerStateCandidate;
  requires_confirmation: boolean;
  can_correct: boolean;
  response_record_real_created: false;
  runtime_subfield_response_real_created: false;
  evidence_item_real_created: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientInteractionCursorBlockingReason[];
}

export interface RuntimeClientSubfieldCaptureCandidate {
  subfield_capture_candidate_ref: string;
  interaction_candidate_ref?: string;
  subfield_key: string;
  subfield_label: string;
  subfield_value_candidate?: unknown;
  subfield_required: boolean;
  subfield_visible_to_client: boolean;
  runtime_subfield_response_real_created: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientInteractionCursorBlockingReason[];
}

export interface RuntimeClientInteractionTransitionCandidate {
  interaction_transition_candidate_ref: string;
  from_state: RuntimeClientInteractionStateCandidate;
  to_state: RuntimeClientInteractionStateCandidate;
  transition_reason: string;
  requires_external_feedback: boolean;
  requires_confirmation: boolean;
  blocked_by_gate_candidate: boolean;
  blocked_by_missing_required_answer: boolean;
  blocked_by_no_go: boolean;
  runtime_state_mutated: false;
  gate_real_executed: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientInteractionCursorBlockingReason[];
}

export interface RuntimeClientBudgetVisibilityCandidate {
  budget_visibility_candidate_ref: string;
  base_interaction_limit: 40;
  causal_interaction_limit: 20;
  base_interaction_visible_count: number;
  causal_interaction_visible_count: number;
  microconfirmations_counted_according_to_rule: boolean;
  derived_internal_interactions_visible: false;
  budget_ledger_real_updated: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientInteractionCursorBlockingReason[];
}

export interface RuntimeClientSafeBlockedReviewStateCandidate {
  safe_blocked_review_state_candidate_ref: string;
  blocked_reason_client_safe: string;
  review_required: boolean;
  manual_review_required_candidate: boolean;
  reentry_required_candidate: boolean;
  visible_message: string;
  internal_no_go_hidden: true;
  gate_internal_hidden: true;
  readiness_gap_internal_hidden: true;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientInteractionCursorBlockingReason[];
}

export interface RuntimePhase9ELocalInteractionCursorVisibleProgressLocalResult {
  phase9_started_local: true;
  phase9_A_accepted: true;
  phase9_B_accepted: true;
  phase9_C_accepted: true;
  phase9_D_accepted: true;
  phase9_E_completed_local: boolean;
  phase9_closed_local: false;
  ready_for_phase9F_authorization: false;

  local_interaction_cursor_candidates: RuntimeClientLocalInteractionCursorCandidate[];
  visible_progress_candidates: RuntimeClientVisibleProgressCandidate[];
  question_presentation_candidates: RuntimeClientQuestionPresentationCandidate[];
  answer_capture_candidates: RuntimeClientAnswerCaptureCandidate[];
  subfield_capture_candidates: RuntimeClientSubfieldCaptureCandidate[];
  interaction_transition_candidates: RuntimeClientInteractionTransitionCandidate[];
  budget_visibility_candidates: RuntimeClientBudgetVisibilityCandidate[];
  safe_blocked_review_state_candidates: RuntimeClientSafeBlockedReviewStateCandidate[];

  runtime_interaction_instance_real_created: false;
  response_record_real_created: false;
  runtime_subfield_response_real_created: false;
  evidence_item_real_created: false;
  budget_ledger_real_updated: false;
  readiness_final_created: false;
  gate_real_executed: false;
  endpoint_created: false;
  supabase_touched: false;
  sql_executed: false;
  runtime_40_20_started_real: false;
  qa_green_real_created: false;
  activation_allowed: false;
  diagnosis_created: false;
  export_real_created: false;
  produccion_paralela_started: false;
}

export type RuntimeClientEvidenceHandoffBlockingReason =
  | "missing_source_trace"
  | "missing_answer_capture_candidate"
  | "missing_subfield_capture_candidate"
  | "missing_evidence_candidate"
  | "missing_canonical_variable_candidate"
  | "derived_without_source_attempted"
  | "text_similarity_only_attempted"
  | "diagnostic_inference_attempted"
  | "evidence_item_real_creation_attempted"
  | "canonical_variable_record_real_creation_attempted"
  | "readiness_gap_record_real_creation_attempted"
  | "runtime_audit_trail_real_creation_attempted"
  | "semantic_resolution_event_real_creation_attempted"
  | "process_state_timer_event_real_creation_attempted"
  | "gate_real_execution_attempted"
  | "supabase_touch_attempted"
  | "sql_execution_attempted"
  | "endpoint_creation_attempted"
  | "runtime_real_start_attempted";

export type RuntimeClientEvidenceKind =
  | "operational_description"
  | "confirmation"
  | "correction"
  | "frequency_context"
  | "role_context"
  | "start_condition"
  | "end_condition"
  | "exception_signal"
  | "receiver_feedback_signal"
  | "client_safe_review_note";

export type RuntimeClientCanonicalVariableDerivationMode =
  | "direct_user_answer"
  | "confirmed_user_correction"
  | "subfield_mapping"
  | "runtime_catalog_mapping"
  | "explicit_gate_input_mapping"
  | "insufficient_for_variable";

export type RuntimeClientExplicitGapType =
  | "missing_required_answer"
  | "missing_required_subfield"
  | "ambiguous_answer"
  | "contradictory_answer"
  | "insufficient_evidence_for_variable"
  | "blocked_by_gate_candidate"
  | "manual_review_candidate"
  | "reentry_candidate";

export type RuntimeClientGateInputFamily =
  | "critical_route"
  | "semantic_resolution"
  | "process_state_timer"
  | "mmabp_conformance_consistency"
  | "qa_activation"
  | "export_production";

export type RuntimeClientSafeEvidenceVisibleStatus =
  | "respuesta_registrada"
  | "informacion_en_revision"
  | "necesitamos_aclarar_algo"
  | "puedes_corregir"
  | "bloqueado_seguro";

export interface RuntimeClientEvidenceCandidateHandoff {
  evidence_candidate_handoff_ref: string;
  source_answer_capture_candidate_ref?: string;
  source_subfield_capture_candidate_refs: string[];
  source_interaction_candidate_ref?: string;
  source_activity_runtime_run_candidate_ref?: string;
  evidence_candidate_ref: string;
  evidence_kind: RuntimeClientEvidenceKind;
  evidence_summary_client_safe: string;
  evidence_summary_internal_candidate?: string;
  evidence_item_real_created: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientEvidenceHandoffBlockingReason[];
}

export interface RuntimeClientCanonicalVariableCandidateHandoff {
  canonical_variable_candidate_handoff_ref: string;
  source_evidence_candidate_ref?: string;
  source_answer_capture_candidate_ref?: string;
  candidate_variable_ref: string;
  canonical_variable_name: string;
  candidate_value?: unknown;
  candidate_value_type: string;
  derivation_mode: RuntimeClientCanonicalVariableDerivationMode;
  source_trace_required: true;
  canonical_variable_record_real_created: false;
  derived_without_source: false;
  text_similarity_only: false;
  diagnostic_inference_used: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientEvidenceHandoffBlockingReason[];
}

export interface RuntimeClientExplicitGapCandidate {
  explicit_gap_candidate_ref: string;
  source_interaction_candidate_ref?: string;
  source_answer_capture_candidate_ref?: string;
  gap_type: RuntimeClientExplicitGapType;
  gap_reason: string;
  client_safe_message: string;
  requires_review: boolean;
  requires_reentry_candidate: boolean;
  readiness_gap_record_real_created: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientEvidenceHandoffBlockingReason[];
}

export interface RuntimeClientGateInputCandidate {
  gate_input_candidate_ref: string;
  source_evidence_candidate_ref?: string;
  source_canonical_variable_candidate_ref?: string;
  gate_family: RuntimeClientGateInputFamily;
  gate_code: string;
  gate_input_summary: string;
  gate_real_executed: false;
  critical_route_gate_real_executed: false;
  mmabp_gate_real_executed: false;
  semantic_resolution_event_real_created: false;
  process_state_timer_event_real_created: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientEvidenceHandoffBlockingReason[];
}

export interface RuntimeClientEvidenceProvenanceEnvelopeCandidate {
  provenance_envelope_candidate_ref: string;
  source_document_refs: string[];
  source_section_refs: string[];
  source_candidate_refs: string[];
  case_scope_ref?: string;
  role_scope_ref?: string;
  activity_scope_ref?: string;
  run_scope_ref?: string;
  correlation_candidate_ref?: string;
  idempotency_candidate_ref?: string;
  source_trace_complete: boolean;
  provenance_real_persisted: false;
  runtime_audit_trail_real_created: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientEvidenceHandoffBlockingReason[];
}

export interface RuntimeClientSafeEvidenceSummaryCandidate {
  client_safe_evidence_summary_candidate_ref: string;
  source_evidence_candidate_ref?: string;
  visible_summary: string;
  visible_status: RuntimeClientSafeEvidenceVisibleStatus;
  visible_next_action?: string;
  internal_summary_hidden: true;
  gate_internal_hidden: true;
  chip_internal_hidden: true;
  runtime_table_hidden: true;
  diagnosis_hidden: true;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientEvidenceHandoffBlockingReason[];
}

export interface RuntimeClientNoDiagnosticInferenceGuardCandidate {
  no_diagnostic_inference_guard_ref: string;
  diagnosis_created: false;
  diagnostic_label_created: false;
  pathology_classification_created: false;
  ahe_diagnostic_output_created: false;
  vsm_diagnostic_output_created: false;
  mmabp_final_assessment_created: false;
  client_final_diagnosis_visible: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientEvidenceHandoffBlockingReason[];
}

export interface RuntimeClientNoRealPersistenceGuardCandidate {
  no_real_persistence_guard_ref: string;
  evidence_item_real_created: false;
  canonical_variable_record_real_created: false;
  readiness_gap_record_real_created: false;
  runtime_audit_trail_real_created: false;
  semantic_resolution_event_real_created: false;
  process_state_timer_event_real_created: false;
  supabase_touched: false;
  sql_executed: false;
  endpoint_created: false;
  runtime_real_started: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientEvidenceHandoffBlockingReason[];
}

export interface RuntimePhase9FLocalEvidenceCanonicalVariableHandoffLocalResult {
  phase9_started_local: true;
  phase9_A_accepted: true;
  phase9_B_accepted: true;
  phase9_C_accepted: true;
  phase9_D_accepted: true;
  phase9_E_accepted: true;
  phase9_F_completed_local: boolean;
  phase9_closed_local: false;
  ready_for_phase9G_authorization: false;

  evidence_candidate_handoffs: RuntimeClientEvidenceCandidateHandoff[];
  canonical_variable_candidate_handoffs: RuntimeClientCanonicalVariableCandidateHandoff[];
  explicit_gap_candidates: RuntimeClientExplicitGapCandidate[];
  gate_input_candidates: RuntimeClientGateInputCandidate[];
  provenance_envelope_candidates: RuntimeClientEvidenceProvenanceEnvelopeCandidate[];
  client_safe_evidence_summary_candidates: RuntimeClientSafeEvidenceSummaryCandidate[];
  no_diagnostic_inference_guard_candidates: RuntimeClientNoDiagnosticInferenceGuardCandidate[];
  no_real_persistence_guard_candidates: RuntimeClientNoRealPersistenceGuardCandidate[];

  evidence_item_real_created: false;
  canonical_variable_record_real_created: false;
  readiness_gap_record_real_created: false;
  runtime_audit_trail_real_created: false;
  semantic_resolution_event_real_created: false;
  process_state_timer_event_real_created: false;
  gate_real_executed: false;
  endpoint_created: false;
  supabase_touched: false;
  sql_executed: false;
  runtime_40_20_started_real: false;
  qa_green_real_created: false;
  activation_allowed: false;
  diagnosis_created: false;
  export_real_created: false;
  produccion_paralela_started: false;
}

export type RuntimeClientGateReadinessBlockingReason =
  | "missing_source_trace"
  | "missing_gate_input_candidate"
  | "missing_evidence_candidate"
  | "missing_canonical_variable_candidate"
  | "missing_gap_candidate"
  | "gate_real_execution_attempted"
  | "critical_route_gate_real_execution_attempted"
  | "semantic_resolution_event_real_creation_attempted"
  | "process_state_timer_event_real_creation_attempted"
  | "readiness_decision_record_real_creation_attempted"
  | "readiness_gap_record_real_creation_attempted"
  | "manual_review_real_creation_attempted"
  | "reentry_interaction_real_creation_attempted"
  | "runtime_interaction_instance_real_creation_attempted"
  | "runtime_audit_trail_real_creation_attempted"
  | "diagnosis_final_creation_attempted"
  | "chip_override_gate_attempted"
  | "production_from_chip_attempted"
  | "no_go_real_persistence_attempted"
  | "activation_allowed_attempted";

export type RuntimeClientCriticalRouteGateCode =
  | "B0"
  | "B2"
  | "B3_C09"
  | "B7_C20";

export type RuntimeClientSEMPSTGateCode =
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

export type RuntimeClientReadinessStateCandidateValue =
  | "ready_candidate"
  | "ready_with_flags_candidate"
  | "blocked_candidate"
  | "manual_review_required_candidate"
  | "reentry_required_candidate"
  | "insufficient_information_candidate";

export type RuntimeClientVisibleReviewResultState =
  | "resultado_en_revision"
  | "necesitamos_aclarar_algo"
  | "informacion_suficiente_para_revision"
  | "bloqueado_seguro"
  | "reingreso_requerido";

export type RuntimeClientGateReadinessAuditAction =
  | "critical_route_gate_summary_created"
  | "sem_pst_gate_summary_created"
  | "readiness_state_candidate_created"
  | "manual_review_candidate_created"
  | "reentry_candidate_created"
  | "safe_review_result_candidate_created"
  | "no_go_candidate_created"
  | "gate_greater_than_chip_enforced";

export interface RuntimeClientCriticalRouteGateSummaryCandidate {
  critical_route_gate_summary_candidate_ref: string;
  source_gate_input_candidate_ref?: string;
  gate_code: RuntimeClientCriticalRouteGateCode;
  gate_family: "critical_route";
  gate_summary_client_safe: string;
  gate_summary_internal_candidate?: string;
  gate_real_executed: false;
  critical_route_gate_real_executed: false;
  runtime_audit_trail_real_created: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientGateReadinessBlockingReason[];
}

export interface RuntimeClientSEMPSTGateSummaryCandidate {
  sem_pst_gate_summary_candidate_ref: string;
  source_gate_input_candidate_ref?: string;
  gate_code: RuntimeClientSEMPSTGateCode;
  gate_family: "semantic_resolution" | "process_state_timer";
  gate_summary_client_safe: string;
  gate_summary_internal_candidate?: string;
  gate_real_executed: false;
  semantic_resolution_event_real_created: false;
  process_state_timer_event_real_created: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientGateReadinessBlockingReason[];
}

export interface RuntimeClientReadinessStateCandidate {
  readiness_state_candidate_ref: string;
  source_evidence_candidate_refs: string[];
  source_canonical_variable_candidate_refs: string[];
  source_gap_candidate_refs: string[];
  source_gate_summary_candidate_refs: string[];
  readiness_state: RuntimeClientReadinessStateCandidateValue;
  client_safe_state_label: string;
  client_safe_state_message: string;
  readiness_decision_record_real_created: false;
  readiness_gap_record_real_created: false;
  readiness_final_created: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientGateReadinessBlockingReason[];
}

export interface RuntimeClientManualReviewCandidate {
  manual_review_candidate_ref: string;
  source_readiness_state_candidate_ref?: string;
  source_gap_candidate_refs: string[];
  review_reason_client_safe: string;
  review_reason_internal_candidate?: string;
  manual_review_required_candidate: boolean;
  manual_review_real_created: false;
  manual_review_actor_assigned_real: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientGateReadinessBlockingReason[];
}

export interface RuntimeClientReentryCandidate {
  reentry_candidate_ref: string;
  source_readiness_state_candidate_ref?: string;
  source_gap_candidate_refs: string[];
  reentry_reason_client_safe: string;
  reentry_prompt_candidate?: string;
  reentry_required_candidate: boolean;
  reentry_interaction_real_created: false;
  runtime_interaction_instance_real_created: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientGateReadinessBlockingReason[];
}

export interface RuntimeClientSafeReviewResultCandidate {
  safe_review_result_candidate_ref: string;
  source_readiness_state_candidate_ref?: string;
  visible_result_state: RuntimeClientVisibleReviewResultState;
  visible_message: string;
  visible_next_action?: string;
  diagnosis_final_included: false;
  internal_gate_state_hidden: true;
  internal_readiness_gap_hidden: true;
  internal_no_go_hidden: true;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientGateReadinessBlockingReason[];
}

export interface RuntimeClientNoGoCandidate {
  no_go_candidate_ref: string;
  source_gate_summary_refs: string[];
  source_readiness_state_candidate_ref?: string;
  no_go_triggered_candidate: boolean;
  no_go_reason_internal_candidate?: string;
  client_safe_message: string;
  no_go_real_persisted: false;
  runtime_audit_trail_real_created: false;
  activation_allowed: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientGateReadinessBlockingReason[];
}

export interface RuntimeClientGateGreaterThanChipEnforcementCandidate {
  gate_greater_than_chip_enforcement_candidate_ref: string;
  chip_output_used_as_input_only: boolean;
  chip_output_can_override_gate: false;
  gate_blocker_prevalence: true;
  diagnosis_from_chip_without_gate: false;
  production_from_chip_without_gate: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientGateReadinessBlockingReason[];
}

export interface RuntimeClientGateReadinessAuditCandidate {
  gate_readiness_audit_candidate_ref: string;
  audit_action: RuntimeClientGateReadinessAuditAction;
  audit_reason: string;
  source_candidate_ref?: string;
  runtime_audit_trail_real_created: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientGateReadinessBlockingReason[];
}

export interface RuntimePhase9GLocalGateReadinessReviewStateLocalResult {
  phase9_started_local: true;
  phase9_A_accepted: true;
  phase9_B_accepted: true;
  phase9_C_accepted: true;
  phase9_D_accepted: true;
  phase9_E_accepted: true;
  phase9_F_accepted: true;
  phase9_G_completed_local: boolean;
  phase9_closed_local: false;
  ready_for_phase9H_authorization: false;

  critical_route_gate_summary_candidates: RuntimeClientCriticalRouteGateSummaryCandidate[];
  sem_pst_gate_summary_candidates: RuntimeClientSEMPSTGateSummaryCandidate[];
  readiness_state_candidates: RuntimeClientReadinessStateCandidate[];
  manual_review_candidates: RuntimeClientManualReviewCandidate[];
  reentry_candidates: RuntimeClientReentryCandidate[];
  safe_review_result_candidates: RuntimeClientSafeReviewResultCandidate[];
  no_go_candidates: RuntimeClientNoGoCandidate[];
  gate_greater_than_chip_enforcement_candidates: RuntimeClientGateGreaterThanChipEnforcementCandidate[];
  gate_readiness_audit_candidates: RuntimeClientGateReadinessAuditCandidate[];

  gate_real_executed: false;
  critical_route_gate_real_executed: false;
  semantic_resolution_event_real_created: false;
  process_state_timer_event_real_created: false;
  readiness_decision_record_real_created: false;
  readiness_gap_record_real_created: false;
  runtime_audit_trail_real_created: false;
  manual_review_real_created: false;
  reentry_interaction_real_created: false;
  diagnosis_created: false;
  activation_allowed: false;
  endpoint_created: false;
  supabase_touched: false;
  sql_executed: false;
  runtime_40_20_started_real: false;
  qa_green_real_created: false;
  export_real_created: false;
  produccion_paralela_started: false;
}

export type RuntimeClientOutcomeCloseoutBlockingReason =
  | "missing_source_trace"
  | "missing_readiness_state_candidate"
  | "missing_safe_review_result_candidate"
  | "missing_client_outcome_candidate"
  | "missing_review_closeout_candidate"
  | "diagnosis_final_creation_attempted"
  | "diagnostic_label_creation_attempted"
  | "pathology_classification_attempted"
  | "readiness_decision_record_real_creation_attempted"
  | "manual_review_real_creation_attempted"
  | "reentry_interaction_real_creation_attempted"
  | "runtime_interaction_instance_real_creation_attempted"
  | "response_record_real_creation_attempted"
  | "runtime_subfield_response_real_creation_attempted"
  | "export_real_creation_attempted"
  | "parallel_export_payload_real_creation_attempted"
  | "registry_creation_attempted"
  | "ir_creation_attempted"
  | "activation_allowed_attempted"
  | "qa_green_real_creation_attempted"
  | "runtime_real_start_attempted"
  | "endpoint_creation_attempted"
  | "public_route_creation_attempted"
  | "supabase_touch_attempted"
  | "sql_execution_attempted"
  | "phase9_close_attempted";

export type RuntimeClientOutcomeStateCandidate =
  | "resultado_en_revision_candidate"
  | "informacion_suficiente_para_revision_candidate"
  | "necesitamos_aclarar_algo_candidate"
  | "reingreso_requerido_candidate"
  | "bloqueado_seguro_candidate";

export type RuntimeClientReviewCloseoutStateCandidate =
  | "review_pending_candidate"
  | "manual_review_required_candidate"
  | "reentry_required_candidate"
  | "blocked_safe_candidate"
  | "local_candidate_complete_for_review";

export type RuntimeClientNextActionKindCandidate =
  | "esperar_revision"
  | "corregir_respuesta"
  | "aclarar_informacion"
  | "continuar_interaccion"
  | "contactar_revision"
  | "bloqueado_seguro_sin_accion";

export type RuntimeClientSafeCloseoutVisibleStatus =
  | "en_revision"
  | "requiere_aclaracion"
  | "requiere_correccion"
  | "bloqueado_seguro"
  | "listo_para_revision";

export type RuntimeClientCorrectionReentryHandoffKind =
  | "correction_candidate"
  | "reentry_candidate"
  | "clarification_candidate"
  | "no_handoff_required";

export type RuntimeClientLocalCloseoutSnapshotKind =
  | "client_visible_review_snapshot"
  | "blocked_safe_snapshot"
  | "reentry_required_snapshot"
  | "manual_review_required_snapshot"
  | "local_candidate_complete_snapshot";

export type RuntimeClientOutcomeCloseoutAuditAction =
  | "client_outcome_candidate_created"
  | "client_review_closeout_candidate_created"
  | "client_next_action_candidate_created"
  | "client_safe_closeout_summary_candidate_created"
  | "correction_reentry_handoff_candidate_created"
  | "local_closeout_snapshot_candidate_created"
  | "no_diagnosis_no_export_guard_enforced"
  | "no_activation_no_phase_close_guard_enforced";

export interface RuntimeClientOutcomeCandidate {
  client_outcome_candidate_ref: string;
  source_readiness_state_candidate_ref?: string;
  source_safe_review_result_candidate_ref?: string;
  source_no_go_candidate_ref?: string;
  outcome_state: RuntimeClientOutcomeStateCandidate;
  visible_outcome_label: string;
  visible_outcome_message: string;
  visible_confidence_language?: string;
  diagnosis_final_included: false;
  readiness_decision_record_real_created: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientOutcomeCloseoutBlockingReason[];
}

export interface RuntimeClientReviewCloseoutCandidate {
  client_review_closeout_candidate_ref: string;
  source_client_outcome_candidate_ref?: string;
  source_manual_review_candidate_ref?: string;
  source_reentry_candidate_ref?: string;
  review_closeout_state: RuntimeClientReviewCloseoutStateCandidate;
  client_visible_closeout_message: string;
  review_pending_candidate: boolean;
  manual_review_required_candidate: boolean;
  reentry_required_candidate: boolean;
  closeout_real_persisted: false;
  manual_review_real_created: false;
  reentry_interaction_real_created: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientOutcomeCloseoutBlockingReason[];
}

export interface RuntimeClientNextActionCandidate {
  client_next_action_candidate_ref: string;
  source_client_outcome_candidate_ref?: string;
  source_review_closeout_candidate_ref?: string;
  next_action_kind: RuntimeClientNextActionKindCandidate;
  next_action_label: string;
  next_action_description?: string;
  action_enabled_candidate: boolean;
  requires_user_correction_candidate: boolean;
  requires_manual_review_candidate: boolean;
  requires_reentry_candidate: boolean;
  starts_real_workflow: false;
  creates_endpoint_call: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientOutcomeCloseoutBlockingReason[];
}

export interface RuntimeClientSafeCloseoutSummaryCandidate {
  client_safe_closeout_summary_candidate_ref: string;
  source_client_outcome_candidate_ref?: string;
  source_safe_evidence_summary_refs: string[];
  source_safe_review_result_candidate_ref?: string;
  visible_summary_title: string;
  visible_summary_body: string;
  visible_status: RuntimeClientSafeCloseoutVisibleStatus;
  visible_next_action_label?: string;
  internal_evidence_hidden: true;
  internal_gate_state_hidden: true;
  internal_chip_state_hidden: true;
  runtime_table_hidden: true;
  diagnosis_hidden: true;
  export_hidden: true;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientOutcomeCloseoutBlockingReason[];
}

export interface RuntimeClientCorrectionReentryHandoffCandidate {
  correction_reentry_handoff_candidate_ref: string;
  source_next_action_candidate_ref?: string;
  source_reentry_candidate_ref?: string;
  target_interaction_candidate_ref?: string;
  target_subfield_candidate_refs: string[];
  handoff_kind: RuntimeClientCorrectionReentryHandoffKind;
  client_safe_prompt: string;
  runtime_interaction_instance_real_created: false;
  response_record_real_created: false;
  runtime_subfield_response_real_created: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientOutcomeCloseoutBlockingReason[];
}

export interface RuntimeClientLocalCloseoutSnapshotCandidate {
  local_closeout_snapshot_candidate_ref: string;
  source_activity_runtime_run_candidate_ref?: string;
  source_client_outcome_candidate_ref?: string;
  source_review_closeout_candidate_ref?: string;
  source_next_action_candidate_ref?: string;
  snapshot_kind: RuntimeClientLocalCloseoutSnapshotKind;
  snapshot_created_local: true;
  snapshot_real_persisted: false;
  export_payload_real_created: false;
  registry_real_created: false;
  ir_real_created: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientOutcomeCloseoutBlockingReason[];
}

export interface RuntimeClientNoDiagnosisNoExportCloseoutGuardCandidate {
  no_diagnosis_no_export_closeout_guard_ref: string;
  diagnosis_created: false;
  diagnostic_label_created: false;
  pathology_classification_created: false;
  client_final_diagnosis_visible: false;
  export_real_created: false;
  parallel_export_payload_real_created: false;
  registry_created: false;
  ir_created: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientOutcomeCloseoutBlockingReason[];
}

export interface RuntimeClientNoActivationNoPhaseCloseGuardCandidate {
  no_activation_no_phase_close_guard_ref: string;
  activation_allowed: false;
  qa_green_real_created: false;
  runtime_40_20_started_real: false;
  endpoint_created: false;
  public_route_created: false;
  supabase_touched: false;
  sql_executed: false;
  phase9_closed_local: false;
  ready_for_phase9I_authorization: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientOutcomeCloseoutBlockingReason[];
}

export interface RuntimeClientOutcomeCloseoutAuditCandidate {
  outcome_closeout_audit_candidate_ref: string;
  audit_action: RuntimeClientOutcomeCloseoutAuditAction;
  audit_reason: string;
  source_candidate_ref?: string;
  runtime_audit_trail_real_created: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimeClientOutcomeCloseoutBlockingReason[];
}

export interface RuntimePhase9HLocalClientOutcomeReviewCloseoutLocalResult {
  phase9_started_local: true;
  phase9_A_accepted: true;
  phase9_B_accepted: true;
  phase9_C_accepted: true;
  phase9_D_accepted: true;
  phase9_E_accepted: true;
  phase9_F_accepted: true;
  phase9_G_accepted: true;
  phase9_H_completed_local: boolean;
  phase9_closed_local: false;
  ready_for_phase9I_authorization: false;

  client_outcome_candidates: RuntimeClientOutcomeCandidate[];
  client_review_closeout_candidates: RuntimeClientReviewCloseoutCandidate[];
  client_next_action_candidates: RuntimeClientNextActionCandidate[];
  client_safe_closeout_summary_candidates: RuntimeClientSafeCloseoutSummaryCandidate[];
  correction_reentry_handoff_candidates: RuntimeClientCorrectionReentryHandoffCandidate[];
  local_closeout_snapshot_candidates: RuntimeClientLocalCloseoutSnapshotCandidate[];
  no_diagnosis_no_export_closeout_guard_candidates: RuntimeClientNoDiagnosisNoExportCloseoutGuardCandidate[];
  no_activation_no_phase_close_guard_candidates: RuntimeClientNoActivationNoPhaseCloseGuardCandidate[];
  outcome_closeout_audit_candidates: RuntimeClientOutcomeCloseoutAuditCandidate[];

  diagnosis_created: false;
  diagnostic_label_created: false;
  pathology_classification_created: false;
  client_final_diagnosis_visible: false;
  readiness_decision_record_real_created: false;
  manual_review_real_created: false;
  reentry_interaction_real_created: false;
  runtime_interaction_instance_real_created: false;
  response_record_real_created: false;
  runtime_subfield_response_real_created: false;
  runtime_audit_trail_real_created: false;
  export_real_created: false;
  parallel_export_payload_real_created: false;
  registry_created: false;
  ir_created: false;
  activation_allowed: false;
  qa_green_real_created: false;
  endpoint_created: false;
  public_route_created: false;
  supabase_touched: false;
  sql_executed: false;
  runtime_40_20_started_real: false;
  produccion_paralela_started: false;
}

export type RuntimePhase9AggregateValidationBlockingReason =
  | "missing_source_trace"
  | "missing_phase9a_traceability"
  | "missing_phase9b_traceability"
  | "missing_phase9c_traceability"
  | "missing_phase9d_traceability"
  | "missing_phase9e_traceability"
  | "missing_phase9f_traceability"
  | "missing_phase9g_traceability"
  | "missing_phase9h_traceability"
  | "cross_phase_inconsistency_detected"
  | "boundary_violation_detected"
  | "client_surface_leakage_detected"
  | "archived_plan_used_as_active_guide"
  | "handoff_used_as_active_guide"
  | "free_inference_detected"
  | "unauthorized_expansion_detected"
  | "endpoint_creation_attempted"
  | "api_route_creation_attempted"
  | "public_route_creation_attempted"
  | "supabase_touch_attempted"
  | "sql_execution_attempted"
  | "runtime_real_start_attempted"
  | "qa_green_real_creation_attempted"
  | "activation_allowed_attempted"
  | "diagnosis_creation_attempted"
  | "export_real_creation_attempted"
  | "produccion_paralela_start_attempted"
  | "phase9_close_attempted";

export type RuntimePhase9ClosureReadinessStateCandidate =
  | "ready_for_closure_review_candidate"
  | "blocked_by_missing_tramo_candidate"
  | "blocked_by_inconsistency_candidate"
  | "blocked_by_boundary_violation_candidate"
  | "blocked_by_source_trace_gap_candidate"
  | "blocked_by_client_surface_leakage_candidate";

export type RuntimePhase9LocalReadinessAuditAction =
  | "aggregate_coverage_validated"
  | "cross_phase_consistency_validated"
  | "boundary_integrity_validated"
  | "client_surface_leakage_scan_completed"
  | "no_real_activation_guard_validated"
  | "source_trace_completeness_validated"
  | "closure_readiness_candidate_created"
  | "no_phase_close_guard_enforced";

export interface RuntimePhase9AggregateCoverageCandidate {
  aggregate_coverage_candidate_ref: string;
  phase9_A_covered: boolean;
  phase9_B_covered: boolean;
  phase9_C_covered: boolean;
  phase9_D_covered: boolean;
  phase9_E_covered: boolean;
  phase9_F_covered: boolean;
  phase9_G_covered: boolean;
  phase9_H_covered: boolean;
  all_required_tramos_covered_candidate: boolean;
  missing_tramos: string[];
  coverage_real_certification_created: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimePhase9AggregateValidationBlockingReason[];
}

export interface RuntimePhase9CrossPhaseConsistencyCandidate {
  cross_phase_consistency_candidate_ref: string;
  client_membrane_to_bff_consistent: boolean;
  bff_to_route_shell_consistent: boolean;
  route_shell_to_local_wiring_consistent: boolean;
  local_wiring_to_interaction_cursor_consistent: boolean;
  interaction_cursor_to_evidence_handoff_consistent: boolean;
  evidence_handoff_to_gate_readiness_consistent: boolean;
  gate_readiness_to_client_outcome_consistent: boolean;
  client_visible_language_consistent: boolean;
  no_contradiction_detected: boolean;
  consistency_real_certification_created: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimePhase9AggregateValidationBlockingReason[];
}

export interface RuntimePhase9BoundaryIntegrityCandidate {
  boundary_integrity_candidate_ref: string;
  endpoint_created: false;
  api_route_created: false;
  public_route_created: false;
  supabase_touched: false;
  sql_executed: false;
  runtime_40_20_started_real: false;
  qa_green_real_created: false;
  activation_allowed: false;
  diagnosis_created: false;
  export_real_created: false;
  produccion_paralela_started: false;
  registry_created: false;
  ir_created: false;
  boundary_integrity_candidate_passed: boolean;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimePhase9AggregateValidationBlockingReason[];
}

export interface RuntimePhase9ClientSurfaceLeakageScanCandidate {
  client_surface_leakage_scan_candidate_ref: string;
  mmabp_jargon_exposed: false;
  vsm_jargon_exposed: false;
  ahe_jargon_exposed: false;
  gate_jargon_exposed: false;
  chip_jargon_exposed: false;
  runtime_table_jargon_exposed: false;
  registry_jargon_exposed: false;
  diagnosis_jargon_exposed: false;
  export_jargon_exposed: false;
  internal_organs_exposed: false;
  client_surface_scan_passed: boolean;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimePhase9AggregateValidationBlockingReason[];
}

export interface RuntimePhase9NoRealActivationAggregateGuardCandidate {
  no_real_activation_aggregate_guard_ref: string;
  endpoint_created: false;
  api_route_created: false;
  public_route_created: false;
  supabase_touched: false;
  sql_executed: false;
  runtime_40_20_started_real: false;
  qa_green_real_created: false;
  activation_allowed: false;
  real_customer_data_used: false;
  real_client_access_enabled: false;
  production_deployment_created: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimePhase9AggregateValidationBlockingReason[];
}

export interface RuntimePhase9SourceTraceCompletenessCandidate {
  source_trace_completeness_candidate_ref: string;
  phase9_A_source_trace_present: boolean;
  phase9_B_source_trace_present: boolean;
  phase9_C_source_trace_present: boolean;
  phase9_D_source_trace_present: boolean;
  phase9_E_source_trace_present: boolean;
  phase9_F_source_trace_present: boolean;
  phase9_G_source_trace_present: boolean;
  phase9_H_source_trace_present: boolean;
  source_sections_declared: boolean;
  content_traceable_to_source_documents: boolean;
  archived_plan_used_as_active_guide: false;
  handoff_used_as_active_guide: false;
  free_inference_detected: false;
  unauthorized_expansion_detected: false;
  source_trace_complete_candidate: boolean;
  source_trace_real_certification_created: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimePhase9AggregateValidationBlockingReason[];
}

export interface RuntimePhase9ClosureReadinessCandidate {
  closure_readiness_candidate_ref: string;
  aggregate_coverage_candidate_ref?: string;
  cross_phase_consistency_candidate_ref?: string;
  boundary_integrity_candidate_ref?: string;
  client_surface_leakage_scan_candidate_ref?: string;
  source_trace_completeness_candidate_ref?: string;
  closure_readiness_state: RuntimePhase9ClosureReadinessStateCandidate;
  closure_readiness_message: string;
  ready_for_phase9J_authorization: false;
  phase9_closed_local: false;
  closure_real_created: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimePhase9AggregateValidationBlockingReason[];
}

export interface RuntimePhase9LocalReadinessAuditCandidate {
  phase9_local_readiness_audit_candidate_ref: string;
  audit_action: RuntimePhase9LocalReadinessAuditAction;
  audit_reason: string;
  source_candidate_ref?: string;
  runtime_audit_trail_real_created: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimePhase9AggregateValidationBlockingReason[];
}

export interface RuntimePhase9NoPhaseCloseGuardCandidate {
  no_phase_close_guard_ref: string;
  phase9_closed_local: false;
  phase9_real_closure_created: false;
  qa_green_real_created: false;
  activation_allowed: false;
  ready_for_phase9J_authorization: false;
  closure_authorization_required: true;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimePhase9AggregateValidationBlockingReason[];
}

export interface RuntimePhase9ILocalAggregateValidationClosureReadinessLocalResult {
  phase9_started_local: true;
  phase9_A_accepted: true;
  phase9_B_accepted: true;
  phase9_C_accepted: true;
  phase9_D_accepted: true;
  phase9_E_accepted: true;
  phase9_F_accepted: true;
  phase9_G_accepted: true;
  phase9_H_accepted: true;
  phase9_I_completed_local: boolean;
  phase9_closed_local: false;
  ready_for_phase9J_authorization: false;

  aggregate_coverage_candidates: RuntimePhase9AggregateCoverageCandidate[];
  cross_phase_consistency_candidates: RuntimePhase9CrossPhaseConsistencyCandidate[];
  boundary_integrity_candidates: RuntimePhase9BoundaryIntegrityCandidate[];
  client_surface_leakage_scan_candidates: RuntimePhase9ClientSurfaceLeakageScanCandidate[];
  no_real_activation_aggregate_guard_candidates: RuntimePhase9NoRealActivationAggregateGuardCandidate[];
  source_trace_completeness_candidates: RuntimePhase9SourceTraceCompletenessCandidate[];
  closure_readiness_candidates: RuntimePhase9ClosureReadinessCandidate[];
  phase9_local_readiness_audit_candidates: RuntimePhase9LocalReadinessAuditCandidate[];
  no_phase_close_guard_candidates: RuntimePhase9NoPhaseCloseGuardCandidate[];

  endpoint_created: false;
  api_route_created: false;
  public_route_created: false;
  supabase_touched: false;
  sql_executed: false;
  runtime_40_20_started_real: false;
  qa_green_real_created: false;
  activation_allowed: false;
  diagnosis_created: false;
  export_real_created: false;
  produccion_paralela_started: false;
  registry_created: false;
  ir_created: false;
  phase9_real_closure_created: false;
}

export type RuntimePhase9ClosurePackageAuditAction =
  | "closure_package_candidate_created"
  | "evidence_index_candidate_created"
  | "boundary_ledger_candidate_created"
  | "source_trace_index_candidate_created"
  | "test_evidence_rollup_candidate_created"
  | "unresolved_blocker_register_candidate_created"
  | "no_activation_closure_guard_enforced"
  | "final_local_package_readiness_candidate_created";

export interface RuntimePhase9ClosurePackageCandidate {
  phase9_closure_package_candidate_ref: string;
  phase9_A_included: boolean;
  phase9_B_included: boolean;
  phase9_C_included: boolean;
  phase9_D_included: boolean;
  phase9_E_included: boolean;
  phase9_F_included: boolean;
  phase9_G_included: boolean;
  phase9_H_included: boolean;
  phase9_I_included: boolean;
  closure_package_created_local: true;
  phase9_closed_local: false;
  ready_for_real_activation_authorization: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimePhase9AggregateValidationBlockingReason[];
}

export interface RuntimePhase9EvidenceIndexCandidate {
  phase9_evidence_index_candidate_ref: string;
  indexed_phase_refs: string[];
  evidence_index_created_local: true;
  evidence_audit_real_persisted: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimePhase9AggregateValidationBlockingReason[];
}

export interface RuntimePhase9BoundaryLedgerCandidate {
  phase9_boundary_ledger_candidate_ref: string;
  endpoint_created: false;
  api_route_created: false;
  public_route_created: false;
  supabase_touched: false;
  sql_executed: false;
  runtime_40_20_started_real: false;
  qa_green_real_created: false;
  activation_allowed: false;
  diagnosis_created: false;
  export_real_created: false;
  produccion_paralela_started: false;
  registry_created: false;
  ir_created: false;
  real_client_access_enabled: false;
  boundary_ledger_candidate_passed: boolean;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimePhase9AggregateValidationBlockingReason[];
}

export interface RuntimePhase9SourceTraceIndexCandidate {
  phase9_source_trace_index_candidate_ref: string;
  source_trace_index_created_local: true;
  phase9_A_source_trace_indexed: boolean;
  phase9_B_source_trace_indexed: boolean;
  phase9_C_source_trace_indexed: boolean;
  phase9_D_source_trace_indexed: boolean;
  phase9_E_source_trace_indexed: boolean;
  phase9_F_source_trace_indexed: boolean;
  phase9_G_source_trace_indexed: boolean;
  phase9_H_source_trace_indexed: boolean;
  phase9_I_source_trace_indexed: boolean;
  source_trace_index_complete_candidate: boolean;
  source_trace_index_real_persisted: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimePhase9AggregateValidationBlockingReason[];
}

export interface RuntimePhase9TestEvidenceRollupCandidate {
  phase9_test_evidence_rollup_candidate_ref: string;
  test_command: string;
  test_status: "passed" | "failed" | "not_run";
  test_count: number;
  failed_count: number;
  test_rollup_created_local: true;
  productive_certification_created: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimePhase9AggregateValidationBlockingReason[];
}

export interface RuntimePhase9UnresolvedBlockerRegisterCandidate {
  phase9_unresolved_blocker_register_candidate_ref: string;
  unresolved_blockers: string[];
  unresolved_blocker_register_created_local: true;
  blocker_register_real_persisted: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimePhase9AggregateValidationBlockingReason[];
}

export interface RuntimePhase9NoActivationClosureGuardCandidate {
  phase9_no_activation_closure_guard_ref: string;
  endpoint_created: false;
  api_route_created: false;
  public_route_created: false;
  supabase_touched: false;
  sql_executed: false;
  runtime_40_20_started_real: false;
  qa_green_real_created: false;
  activation_allowed: false;
  diagnosis_created: false;
  export_real_created: false;
  produccion_paralela_started: false;
  registry_created: false;
  ir_created: false;
  real_client_access_enabled: false;
  closure_guard_passed: boolean;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimePhase9AggregateValidationBlockingReason[];
}

export interface RuntimePhase9ClosurePackageAuditCandidate {
  phase9_closure_package_audit_candidate_ref: string;
  audit_action: RuntimePhase9ClosurePackageAuditAction;
  audit_reason: string;
  source_candidate_ref?: string;
  runtime_audit_trail_real_created: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimePhase9AggregateValidationBlockingReason[];
}

export interface RuntimePhase9FinalLocalPackageReadinessCandidate {
  phase9_final_local_package_readiness_candidate_ref: string;
  closure_package_candidate_ref?: string;
  evidence_index_candidate_ref?: string;
  boundary_ledger_candidate_ref?: string;
  source_trace_index_candidate_ref?: string;
  test_evidence_rollup_candidate_ref?: string;
  no_activation_closure_guard_ref?: string;
  final_local_package_ready_candidate: boolean;
  ready_for_real_activation_authorization: false;
  activation_allowed: false;
  qa_green_real_created: false;
  runtime_40_20_started_real: false;
  real_client_access_enabled: false;
  phase9_closed_local: false;
  source_trace: RuntimeClientMembraneSourceTrace[];
  candidate_allowed: boolean;
  blocking_reasons: RuntimePhase9AggregateValidationBlockingReason[];
}

export interface RuntimePhase9JLocalClosurePackageNoActivationLocalResult {
  phase9_started_local: true;
  phase9_A_accepted: true;
  phase9_B_accepted: true;
  phase9_C_accepted: true;
  phase9_D_accepted: true;
  phase9_E_accepted: true;
  phase9_F_accepted: true;
  phase9_G_accepted: true;
  phase9_H_accepted: true;
  phase9_I_accepted: true;
  phase9_J_completed_local: boolean;
  phase9_closed_local: false;
  ready_for_real_activation_authorization: false;

  closure_package_candidates: RuntimePhase9ClosurePackageCandidate[];
  evidence_index_candidates: RuntimePhase9EvidenceIndexCandidate[];
  boundary_ledger_candidates: RuntimePhase9BoundaryLedgerCandidate[];
  source_trace_index_candidates: RuntimePhase9SourceTraceIndexCandidate[];
  test_evidence_rollup_candidates: RuntimePhase9TestEvidenceRollupCandidate[];
  unresolved_blocker_register_candidates: RuntimePhase9UnresolvedBlockerRegisterCandidate[];
  no_activation_closure_guard_candidates: RuntimePhase9NoActivationClosureGuardCandidate[];
  closure_package_audit_candidates: RuntimePhase9ClosurePackageAuditCandidate[];
  final_local_package_readiness_candidates: RuntimePhase9FinalLocalPackageReadinessCandidate[];

  endpoint_created: false;
  api_route_created: false;
  public_route_created: false;
  supabase_touched: false;
  sql_executed: false;
  runtime_40_20_started_real: false;
  qa_green_real_created: false;
  activation_allowed: false;
  diagnosis_created: false;
  export_real_created: false;
  produccion_paralela_started: false;
  registry_created: false;
  ir_created: false;
  real_client_access_enabled: false;
}
