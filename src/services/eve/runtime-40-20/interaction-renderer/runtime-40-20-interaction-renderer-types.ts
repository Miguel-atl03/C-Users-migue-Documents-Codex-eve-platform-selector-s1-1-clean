import type {
  RuntimeCanonicalVariableMapCandidate,
  RuntimeInteractionDefinitionCandidate,
  RuntimeSubfieldSchemaCandidate,
} from "../catalog-canonicalization/runtime-40-20-catalog-canonicalization-types";
import type {
  ActivityRuntimeOrchestratorLocalResult,
  NextInteractionDecision,
} from "../orchestrator/runtime-40-20-activity-runtime-orchestrator-types";

export type RuntimeUIComponent =
  | "confirmation_card_with_correction"
  | "compound_card"
  | "single_choice"
  | "hybrid_choice_text"
  | "causal_probe_card"
  | "microconfirmation"
  | "review_gap_card";

export type RuntimeRendererStatus =
  | "render_model_ready"
  | "blocked_missing_visible_text"
  | "blocked_missing_ui_component"
  | "blocked_missing_source_traceability"
  | "blocked_missing_renderer_source"
  | "blocked_missing_choice_options"
  | "blocked_unknown_choice_option"
  | "blocked_missing_hybrid_choice_text_structure"
  | "blocked_causal_probe_missing_authorized_trigger"
  | "blocked_missing_microconfirmation_signal"
  | "blocked_missing_review_gap_source"
  | "blocked_missing_user_visible_copy"
  | "blocked_forbidden_user_language"
  | "blocked_causal_budget_exhausted"
  | "blocked_unauthorized_inference_detected"
  | "blocked_interaction_substitution_attempt"
  | "blocked_payload_preview_boundary_violation"
  | "blocked_payload_preview_contains_user_response"
  | "blocked_payload_preview_evidence_boundary_violation"
  | "manual_review_required_unknown_ui_component"
  | "manual_review_required_missing_budget_metadata"
  | "manual_review_required_missing_epistemic_policy";

export interface RuntimeSubfieldViewModel {
  name: string;
  label?: string;
  type?: string;
  required: boolean;
  value: null;
  source_trace?: {
    source_document: string;
    source_sheet: string;
    source_row_number: number;
  };
}

export interface RuntimeInteractionHelpContract {
  help_text?: string;
  help_source: "catalog" | "not_present";
}

export interface RuntimeInteractionBudgetViewContract {
  counts_as_visible: boolean;
  counts_as_causal: boolean;
  budget_bucket:
    | "base_40"
    | "causal_20"
    | "internal_no_count"
    | "reentry_counted"
    | "microconfirmation_counted";
  base_limit: 40;
  causal_limit: 20;
  budget_consumed_real: false;
}

export interface RuntimeInteractionEpistemicViewContract {
  allowed_epistemic_statuses: Array<
    | "captured_user_evidence"
    | "ai_inferred_unconfirmed"
    | "user_confirmed_suggestion"
    | "user_corrected_evidence"
    | "canonical_derivation"
    | "internal_calculated"
  >;
  explicit_policy_present: boolean;
  confirmation_policy?: string;
  must_not_infer: string[];
}

export interface RuntimeInteractionSourceTraceViewContract {
  source_document: string;
  source_sheet: string;
  source_row_number: number;
  raw_row: Record<string, unknown>;
  source_codes: string[];
  source_refs: string[];
}

export interface RuntimeCardComponentLocalContract {
  component: Extract<
    RuntimeUIComponent,
    "confirmation_card_with_correction" | "compound_card"
  >;
  local_actions: Array<"confirm" | "correct">;
  semantic_subfields_preserved: string[];
  multiple_subfields_preserved: boolean;
  subfields_collapsed_to_free_text: false;
  captured_user_evidence_created: false;
  runtime_subfield_response_real_created: false;
  response_persisted_real: false;
  evidence_item_real_created: false;
  canonical_variable_record_real_created: false;
}

export interface RuntimeChoiceOptionViewModel {
  option_id: string;
  option_label: string;
  normalized_code: string;
  selected: false;
  disabled: boolean;
  source_trace: {
    source_document: string;
    source_sheet: string;
    source_row_number: number;
  };
}

export interface RuntimeChoiceViewContract {
  options: RuntimeChoiceOptionViewModel[];
  selected_value: null;
  unknown_option_allowed: false;
  option_inferred: false;
}

export interface RuntimeHybridChoiceTextViewContract {
  choice_subfield_name: string;
  free_text_subfield_name: string;
  choice: RuntimeChoiceViewContract;
  free_text_value: null;
  choice_and_text_merged: false;
  canonical_variable_inferred_from_text: false;
  evidence_created_from_text: false;
}

export interface RuntimeCausalProbeViewContract {
  authorized_trigger_ref: string;
  trigger_source_trace: {
    source_document: string;
    source_sheet: string;
    source_row_number: number;
  };
  target_causal_interaction_id: string;
  explicit_trigger_authorized: boolean;
  counts_as_causal: true;
  budget_bucket: "causal_20";
  budget_consumed_real: false;
  branching_engine_consumed: false;
  fuzzy_match_used: false;
  semantic_fallback_used: false;
}

export interface RuntimeMicroconfirmationViewContract {
  microconfirmation_signal_ref: string;
  signal_type: string;
  signal_source_trace: {
    source_document: string;
    source_sheet: string;
    source_row_number: number;
  };
  confidence_level: "low" | "medium" | "high";
  confirmation_prompt_text: string;
  correction_allowed: true;
  diagnosis_created: false;
  ir_created: false;
  registry_created: false;
  evidence_item_real_created: false;
  response_ingest_executed: false;
}

export interface RuntimeReviewGapViewContract {
  gap_ref: string;
  gap_type: string;
  gap_label: string;
  gap_explanation: string;
  required_user_action: string;
  gap_source_trace: {
    source_document: string;
    source_sheet: string;
    source_row_number: number;
  };
  manual_review_resolved: false;
  readiness_decision_real_created: false;
  export_preview_created: false;
}

export interface RuntimeUserVisibleCopyContract {
  activity_label?: string;
  object_or_input_label?: string;
  output_or_result_label?: string;
  procedure_or_rule_label?: string;
  context_note?: string;
  confirmation_prompt_text?: string;
  correction_prompt_text?: string;
  help_text?: string;
  required_user_action?: string;
  methodology_terms_hidden: true;
  source_trace_hidden_from_user: true;
}

export interface RuntimeForbiddenUserLanguageCheck {
  forbidden_terms_checked: true;
  forbidden_terms_detected: string[];
  user_visible_copy_allowed: boolean;
}

export interface RuntimeEpistemicUXContract {
  explicit_policy_present: boolean;
  confirmation_policy?: string;
  must_not_infer: string[];
  allowed_epistemic_statuses: Array<
    | "captured_user_evidence"
    | "ai_inferred_unconfirmed"
    | "user_confirmed_suggestion"
    | "user_corrected_evidence"
    | "canonical_derivation"
    | "internal_calculated"
  >;
  must_not_infer_explicit: boolean;
  default_must_not_infer_fabricated: false;
  required_subfields_used_as_must_not_infer: false;
  allowed_epistemic_statuses_vocabulary_only: true;
  ai_inferred_unconfirmed_requires_confirmation: true;
  user_corrected_evidence_overrides_previous_inference: true;
  captured_user_evidence_created_from_ui: false;
  default_policy_fabricated: false;
}

export interface RuntimeBudgetUXContract {
  counts_as_visible: boolean;
  counts_as_causal: boolean;
  budget_bucket:
    | "base_40"
    | "causal_20"
    | "internal_no_count"
    | "reentry_counted"
    | "microconfirmation_counted";
  base_limit: 40;
  causal_limit: 20;
  budget_consumed_real: false;
  budget_ledger_real_created: false;
  causal_budget_exhausted?: boolean;
}

export interface RuntimeSourceTraceabilityUXContract {
  source_document: string;
  source_sheet: string;
  source_row_number: number;
  raw_row: Record<string, unknown>;
  source_codes: string[];
  source_refs: string[];
  source_node_ref?: string;
  source_trace_hidden_from_user: true;
  interaction_substitution_used: false;
  fuzzy_source_match_used: false;
  semantic_fallback_used: false;
}

export interface RuntimeRendererNoInferenceBoundary {
  b0q01_fallback_to_b0_used: false;
  b0q01_fallback_to_b1_used: false;
  interaction_substitution_used: false;
  visible_text_fabricated: false;
  ui_component_fabricated: false;
  subfields_fabricated: false;
  epistemic_policy_fabricated: false;
  must_not_infer_fabricated: false;
  confirmation_policy_fabricated: false;
  choice_options_fabricated: false;
  causal_trigger_fabricated: false;
  review_gap_fabricated: false;
  microconfirmation_signal_fabricated: false;
  free_inference_used: false;
  semantic_fallback_used: false;
  fuzzy_match_used: false;
}

export type RuntimePayloadPreviewConfirmationStatus =
  | "pending_confirmation"
  | "pending_correction"
  | "not_applicable";

export interface RuntimeSubfieldAnswerPreview {
  subfield_name: string;
  expected_type?: string;
  required: boolean;
  value: null;
  response_persisted_real: false;
}

export interface RuntimePhase6PayloadPreview {
  interaction_id: string;
  interaction_instance_id_preview: string;
  answers_preview: RuntimeSubfieldAnswerPreview[];
  subfield_answers_preview: RuntimeSubfieldAnswerPreview[];
  confirmation_status_preview: RuntimePayloadPreviewConfirmationStatus;
  idempotency_key_preview?: string;
  payload_preview_created: true;
  response_ingest_executed: false;
  response_persisted_real: false;
  runtime_subfield_response_real_created: false;
  evidence_item_real_created: false;
  canonical_variable_record_real_created: false;
}

export interface RuntimeInteractionViewModel {
  runtime_interaction_id: string;
  interaction_instance_id_preview: string;
  group: "base" | "causal";
  block?: string;
  visible_text: string;
  ui_component: RuntimeUIComponent;
  subfields: RuntimeSubfieldViewModel[];
  help_text?: string;
  help?: RuntimeInteractionHelpContract;
  budget: RuntimeInteractionBudgetViewContract;
  epistemic_policy: RuntimeInteractionEpistemicViewContract;
  source_codes: string[];
  source_trace: RuntimeInteractionSourceTraceViewContract;
  card_component_contract?: RuntimeCardComponentLocalContract;
  choice_view?: RuntimeChoiceViewContract;
  hybrid_choice_text_view?: RuntimeHybridChoiceTextViewContract;
  causal_probe_view?: RuntimeCausalProbeViewContract;
  microconfirmation_view?: RuntimeMicroconfirmationViewContract;
  review_gap_view?: RuntimeReviewGapViewContract;
  user_visible_copy?: RuntimeUserVisibleCopyContract;
  forbidden_user_language_check?: RuntimeForbiddenUserLanguageCheck;
  epistemic_ux?: RuntimeEpistemicUXContract;
  budget_ux?: RuntimeBudgetUXContract;
  source_traceability_ux?: RuntimeSourceTraceabilityUXContract;
  no_inference_boundary?: RuntimeRendererNoInferenceBoundary;
  phase6_payload_preview?: RuntimePhase6PayloadPreview;
  renderer_status: RuntimeRendererStatus;
  warnings: string[];
  ui_rendered_real: false;
}

export interface RuntimeRendererDecision {
  decision_id: string;
  run_plan_id: string;
  runtime_interaction_id: string;
  renderer_status: RuntimeRendererStatus;
  next_interaction_hint: string;
  source_traceability_preserved: boolean;
  free_inference_used: false;
  fallback_interaction_used: false;
  epistemic_policy_inferred: false;
  ui_rendered_real: false;
}

export interface RuntimeRendererNoGoCheck {
  no_go_triggered: boolean;
  blockers: string[];
  runtime_40_20_started: false;
  catalog_activated: false;
  migration_applied: false;
  supabase_touched: false;
  sql_executed: false;
  endpoint_created: false;
  ui_rendered_real: false;
  response_ingest_executed: false;
  runtime_subfield_response_real_created: false;
  captured_user_evidence_created: false;
  response_persisted_real: false;
  evidence_item_real_created: false;
  canonical_variable_record_real_created: false;
  branching_engine_consumed: false;
  readiness_engine_consumed: false;
  branching_real_created: false;
  readiness_real_created: false;
  export_real_created: false;
  real_runtime_records_created: false;
  real_interaction_instances_created: false;
  business_evidence_created: false;
  registry_live_db_created: false;
  ir_real_created: false;
  object_inventory_real_opened: false;
  f5c_real_opened: false;
  export_created: false;
  diagnosis_created: false;
  delivered_created: false;
}

export interface RuntimeInteractionRendererLocalInput {
  case_id: string;
  orchestrator_result: ActivityRuntimeOrchestratorLocalResult;
  interaction_definitions: RuntimeInteractionDefinitionCandidate[];
  subfield_schemas: RuntimeSubfieldSchemaCandidate[];
  canonical_variable_maps?: RuntimeCanonicalVariableMapCandidate[];
  options?: {
    version?: string;
  };
}

export interface RuntimeInteractionRendererLocalResult {
  ok: boolean;
  case_id: string;
  interaction_view_models: RuntimeInteractionViewModel[];
  renderer_decisions: RuntimeRendererDecision[];
  no_go_check: RuntimeRendererNoGoCheck;
  blocked_reason?: string;
  materiality: {
    level: "runtime_40_20_interaction_renderer_view_model_local_contract";
    local_only: true;
    ui_rendered_real: false;
    runtime_40_20_started: false;
    next_authorization_required: true;
  };
}

export type RuntimeRendererNextInteractionDecision = NextInteractionDecision;
