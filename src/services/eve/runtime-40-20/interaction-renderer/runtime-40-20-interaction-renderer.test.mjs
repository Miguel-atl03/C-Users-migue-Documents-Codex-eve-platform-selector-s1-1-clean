import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const service = loadModule("runtime-40-20-interaction-renderer-service.ts", {
  "./runtime-40-20-interaction-renderer-types": {},
  "../catalog-canonicalization/runtime-40-20-catalog-canonicalization-types": {},
  "../orchestrator/runtime-40-20-activity-runtime-orchestrator-types": {},
});

test("creates InteractionViewModel from valid orchestrator result", () => {
  const result = run();

  assert.equal(result.ok, true);
  assert.equal(result.interaction_view_models[0].renderer_status, "render_model_ready");
});

test("InteractionRenderer produces InteractionViewModel from authorized runtime_interaction_def", () => {
  const viewModel = run().interaction_view_models[0];

  assert.equal(viewModel.runtime_interaction_id, "B0-Q01");
  assert.equal(viewModel.source_trace.source_sheet, "Runtime_Interactions_Base_40");
});

test("renderer consumes UX_Subfield_Structure", () => {
  const subfield = run().interaction_view_models[0].subfields[0];

  assert.equal(subfield.name, "action_verb");
  assert.equal(subfield.source_trace.source_sheet, "UX_Subfield_Structure");
});

test("renderer consumes Epistemic_Policy", () => {
  const epistemic = run().interaction_view_models[0].epistemic_policy;

  assert.equal(epistemic.explicit_policy_present, true);
  assert.equal(epistemic.confirmation_policy, "requires_user_confirmation");
});

test("renderer consumes budget metadata", () => {
  const budget = run().interaction_view_models[0].budget;

  assert.equal(budget.counts_as_visible, true);
  assert.equal(budget.base_limit, 40);
  assert.equal(budget.causal_limit, 20);
});

test("renderer consumes source traceability", () => {
  const trace = run().interaction_view_models[0].source_trace;

  assert.equal(trace.source_document, "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx");
  assert.equal(trace.source_refs[0], "SRC-B0-Q01");
});

test("RuntimeInteractionViewModel includes required 5.2 fields", () => {
  const viewModel = run().interaction_view_models[0];

  assert.equal(viewModel.runtime_interaction_id, "B0-Q01");
  assert.equal(viewModel.interaction_instance_id_preview, "RUN-001:B0-Q01:preview");
  assert.equal(viewModel.group, "base");
  assert.equal(viewModel.block, "B0");
  assert.equal(viewModel.visible_text, "Visible text B0-Q01");
  assert.equal(viewModel.ui_component, "confirmation_card_with_correction");
  assert.ok(Array.isArray(viewModel.subfields));
  assert.equal(viewModel.help_text, "Help B0-Q01");
  assert.ok(viewModel.budget);
  assert.ok(viewModel.epistemic_policy);
  assert.equal(JSON.stringify(viewModel.source_codes), JSON.stringify(["SRC-B0-Q01", "B0-Q01"]));
  assert.ok(viewModel.source_trace);
  assert.equal(viewModel.renderer_status, "render_model_ready");
  assert.equal(viewModel.ui_rendered_real, false);
});

test("interaction_instance_id_preview is not a real persisted id", () => {
  const result = run();

  assert.equal(
    result.interaction_view_models[0].interaction_instance_id_preview.endsWith(":preview"),
    true,
  );
  assert.equal(result.no_go_check.real_interaction_instances_created, false);
});

test("preserves source traceability", () => {
  const sourceTrace = run().interaction_view_models[0].source_trace;

  assert.equal(sourceTrace.source_document, "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx");
  assert.equal(sourceTrace.source_sheet, "Runtime_Interactions_Base_40");
  assert.equal(sourceTrace.source_row_number, 2);
  assert.equal(sourceTrace.source_refs[0], "SRC-B0-Q01");
});

test("creates subfields from subfield schemas", () => {
  const subfields = run().interaction_view_models[0].subfields;

  assert.equal(subfields.length, 5);
  assert.equal(subfields[0].name, "action_verb");
  assert.equal(subfields[0].label, "action_verb");
  assert.equal(subfields[0].type, "text");
  assert.equal(subfields[0].required, true);
  assert.equal(subfields[0].value, null);
  assert.equal(subfields[0].source_trace.source_sheet, "UX_Subfield_Structure");
});

test("creates budget contract for base interaction", () => {
  const budget = run().interaction_view_models[0].budget;

  assert.equal(budget.counts_as_visible, true);
  assert.equal(budget.counts_as_causal, false);
  assert.equal(budget.budget_bucket, "base_40");
});

test("creates budget contract for causal interaction", () => {
  const result = run({
    orchestrator_result: orchestratorResult({
      next_interaction_hint: "C09",
    }),
  });
  const budget = result.interaction_view_models[0].budget;

  assert.equal(budget.counts_as_visible, true);
  assert.equal(budget.counts_as_causal, true);
  assert.equal(budget.budget_bucket, "causal_20");
});

test("creates epistemic view contract", () => {
  const epistemic = run().interaction_view_models[0].epistemic_policy;

  assert.equal(epistemic.explicit_policy_present, true);
  assert.equal(epistemic.confirmation_policy, "requires_user_confirmation");
  assert.ok(epistemic.allowed_epistemic_statuses.includes("captured_user_evidence"));
  assert.ok(epistemic.must_not_infer.includes("action_verb"));
});

test("allows confirmation_card_with_correction", () => {
  assert.equal(statusForComponent("confirmation_card_with_correction"), "render_model_ready");
});

test("confirmation_card_with_correction supports local confirm and correct actions", () => {
  const contract = run().interaction_view_models[0].card_component_contract;

  assert.equal(contract.component, "confirmation_card_with_correction");
  assert.equal(JSON.stringify(contract.local_actions), JSON.stringify(["confirm", "correct"]));
  assert.equal(contract.response_persisted_real, false);
});

test("confirmation_card_with_correction preserves B0-Q01 semantic subfields", () => {
  const preserved = run().interaction_view_models[0].card_component_contract
    .semantic_subfields_preserved;

  assert.ok(preserved.includes("action_verb"));
  assert.ok(preserved.includes("input_or_object"));
  assert.ok(preserved.includes("procedure_or_standard"));
  assert.ok(preserved.includes("output_or_result"));
  assert.ok(preserved.includes("user_correction_note"));
});

test("confirmation_card_with_correction does not create captured_user_evidence", () => {
  const result = run();

  assert.equal(result.interaction_view_models[0].card_component_contract.captured_user_evidence_created, false);
  assert.equal(result.no_go_check.captured_user_evidence_created, false);
});

test("allows compound_card", () => {
  assert.equal(statusForComponent("compound_card"), "render_model_ready");
});

test("single_choice is supported", () => {
  const result = run({ interaction_definitions: withChoiceComponent("single_choice") });

  assert.equal(result.interaction_view_models[0].renderer_status, "render_model_ready");
  assert.equal(result.interaction_view_models[0].choice_view.options.length, 2);
});

test("single_choice preserves option labels", () => {
  const option = run({ interaction_definitions: withChoiceComponent("single_choice") })
    .interaction_view_models[0].choice_view.options[0];

  assert.equal(option.option_label, "Option A");
});

test("single_choice preserves normalized codes", () => {
  const option = run({ interaction_definitions: withChoiceComponent("single_choice") })
    .interaction_view_models[0].choice_view.options[0];

  assert.equal(option.normalized_code, "OPT_A");
});

test("single_choice preserves option source trace", () => {
  const option = run({ interaction_definitions: withChoiceComponent("single_choice") })
    .interaction_view_models[0].choice_view.options[0];

  assert.equal(option.source_trace.source_sheet, "Implementation_Dictionaries");
  assert.equal(option.source_trace.source_row_number, 501);
});

test("single_choice keeps selected_value=null before ResponseIngest", () => {
  const choice = run({ interaction_definitions: withChoiceComponent("single_choice") })
    .interaction_view_models[0].choice_view;

  assert.equal(choice.selected_value, null);
  assert.equal(choice.unknown_option_allowed, false);
});

test("single_choice does not infer option", () => {
  const choice = run({ interaction_definitions: withChoiceComponent("single_choice") })
    .interaction_view_models[0].choice_view;

  assert.equal(choice.option_inferred, false);
});

test("single_choice blocks when options are missing", () => {
  const result = run({ interaction_definitions: withFirstComponent("single_choice") });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "blocked_missing_choice_options");
});

test("single_choice blocks unknown option if provided in fixture", () => {
  const result = run({ interaction_definitions: withUnknownSelectedChoice("single_choice") });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "blocked_unknown_choice_option");
});

test("hybrid_choice_text is supported", () => {
  const result = run({
    interaction_definitions: withChoiceComponent("hybrid_choice_text"),
    subfield_schemas: hybridChoiceTextSubfields(),
  });

  assert.equal(result.interaction_view_models[0].renderer_status, "render_model_ready");
  assert.ok(result.interaction_view_models[0].hybrid_choice_text_view);
});

test("hybrid_choice_text separates choice_subfield and free_text_subfield", () => {
  const hybrid = run({
    interaction_definitions: withChoiceComponent("hybrid_choice_text"),
    subfield_schemas: hybridChoiceTextSubfields(),
  }).interaction_view_models[0].hybrid_choice_text_view;

  assert.equal(hybrid.choice_subfield_name, "closed_choice");
  assert.equal(hybrid.free_text_subfield_name, "open_explanation");
});

test("hybrid_choice_text keeps free_text_value=null before ResponseIngest", () => {
  const hybrid = run({
    interaction_definitions: withChoiceComponent("hybrid_choice_text"),
    subfield_schemas: hybridChoiceTextSubfields(),
  }).interaction_view_models[0].hybrid_choice_text_view;

  assert.equal(hybrid.free_text_value, null);
});

test("hybrid_choice_text does not merge choice and text", () => {
  const hybrid = run({
    interaction_definitions: withChoiceComponent("hybrid_choice_text"),
    subfield_schemas: hybridChoiceTextSubfields(),
  }).interaction_view_models[0].hybrid_choice_text_view;

  assert.equal(hybrid.choice_and_text_merged, false);
});

test("hybrid_choice_text does not infer canonical variable from text", () => {
  const hybrid = run({
    interaction_definitions: withChoiceComponent("hybrid_choice_text"),
    subfield_schemas: hybridChoiceTextSubfields(),
  }).interaction_view_models[0].hybrid_choice_text_view;

  assert.equal(hybrid.canonical_variable_inferred_from_text, false);
  assert.equal(hybrid.evidence_created_from_text, false);
});

test("hybrid_choice_text blocks when separated structure is missing", () => {
  const result = run({ interaction_definitions: withChoiceComponent("hybrid_choice_text") });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "blocked_missing_hybrid_choice_text_structure");
});

test("compound_card preserves multiple subfields", () => {
  const result = run({ interaction_definitions: withFirstComponent("compound_card") });
  const contract = result.interaction_view_models[0].card_component_contract;

  assert.equal(contract.component, "compound_card");
  assert.equal(contract.multiple_subfields_preserved, true);
  assert.equal(result.interaction_view_models[0].subfields.length, 5);
});

test("compound_card does not collapse subfields into one free text", () => {
  const contract = run({ interaction_definitions: withFirstComponent("compound_card") })
    .interaction_view_models[0].card_component_contract;

  assert.equal(contract.subfields_collapsed_to_free_text, false);
});

test("compound_card keeps value=null before ResponseIngest", () => {
  const subfields = run({ interaction_definitions: withFirstComponent("compound_card") })
    .interaction_view_models[0].subfields;

  assert.ok(subfields.every((subfield) => subfield.value === null));
});

test("allows causal_probe_card", () => {
  assert.equal(run({ interaction_definitions: withCausalProbe() })
    .interaction_view_models[0].renderer_status, "render_model_ready");
});

test("causal_probe_card requires explicit_trigger_authorized=true", () => {
  const result = run({ interaction_definitions: withCausalProbe({ explicit_trigger_authorized: false }) });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "blocked_causal_probe_missing_authorized_trigger");
});

test("causal_probe_card blocks without authorized trigger", () => {
  const result = run({ interaction_definitions: withFirstComponent("causal_probe_card") });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "blocked_causal_probe_missing_authorized_trigger");
});

test("causal_probe_card preserves authorized_trigger_ref", () => {
  const causal = run({ interaction_definitions: withCausalProbe() })
    .interaction_view_models[0].causal_probe_view;

  assert.equal(causal.authorized_trigger_ref, "TRIGGER-C09");
});

test("causal_probe_card preserves trigger_source_trace", () => {
  const causal = run({ interaction_definitions: withCausalProbe() })
    .interaction_view_models[0].causal_probe_view;

  assert.equal(causal.trigger_source_trace.source_sheet, "Semantic_Resolution_Gates");
  assert.equal(causal.trigger_source_trace.source_row_number, 701);
});

test("causal_probe_card preserves target_causal_interaction_id", () => {
  const causal = run({ interaction_definitions: withCausalProbe() })
    .interaction_view_models[0].causal_probe_view;

  assert.equal(causal.target_causal_interaction_id, "C09");
});

test("causal_probe_card does not execute BranchingEngine", () => {
  const result = run({ interaction_definitions: withCausalProbe() });

  assert.equal(result.interaction_view_models[0].causal_probe_view.branching_engine_consumed, false);
  assert.equal(result.no_go_check.branching_engine_consumed, false);
});

test("causal_probe_card does not use fuzzy match", () => {
  assert.equal(run({ interaction_definitions: withCausalProbe() })
    .interaction_view_models[0].causal_probe_view.fuzzy_match_used, false);
});

test("causal_probe_card does not use semantic fallback", () => {
  assert.equal(run({ interaction_definitions: withCausalProbe() })
    .interaction_view_models[0].causal_probe_view.semantic_fallback_used, false);
});

test("causal_probe_card does not consume budget real", () => {
  const causal = run({ interaction_definitions: withCausalProbe() })
    .interaction_view_models[0].causal_probe_view;

  assert.equal(causal.budget_consumed_real, false);
  assert.equal(causal.counts_as_causal, true);
  assert.equal(causal.budget_bucket, "causal_20");
});

test("allows microconfirmation", () => {
  assert.equal(run({ interaction_definitions: withMicroconfirmation() })
    .interaction_view_models[0].renderer_status, "render_model_ready");
});

test("microconfirmation requires explicit microconfirmation_signal_ref", () => {
  const result = run({ interaction_definitions: withFirstComponent("microconfirmation") });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "blocked_missing_microconfirmation_signal");
});

test("microconfirmation blocks without signal source", () => {
  const result = run({ interaction_definitions: withMicroconfirmation({ signal_source_document: undefined }) });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "blocked_missing_microconfirmation_signal");
});

test("microconfirmation preserves confidence_level", () => {
  const micro = run({ interaction_definitions: withMicroconfirmation() })
    .interaction_view_models[0].microconfirmation_view;

  assert.equal(micro.confidence_level, "low");
});

test("microconfirmation allows correction locally", () => {
  assert.equal(run({ interaction_definitions: withMicroconfirmation() })
    .interaction_view_models[0].microconfirmation_view.correction_allowed, true);
});

test("microconfirmation does not create diagnosis", () => {
  assert.equal(run({ interaction_definitions: withMicroconfirmation() })
    .interaction_view_models[0].microconfirmation_view.diagnosis_created, false);
});

test("microconfirmation does not create IR", () => {
  assert.equal(run({ interaction_definitions: withMicroconfirmation() })
    .interaction_view_models[0].microconfirmation_view.ir_created, false);
});

test("microconfirmation does not create registry", () => {
  assert.equal(run({ interaction_definitions: withMicroconfirmation() })
    .interaction_view_models[0].microconfirmation_view.registry_created, false);
});

test("allows review_gap_card", () => {
  assert.equal(run({ interaction_definitions: withReviewGap() })
    .interaction_view_models[0].renderer_status, "render_model_ready");
});

test("review_gap_card requires gap_ref and gap_source_trace", () => {
  const gap = run({ interaction_definitions: withReviewGap() })
    .interaction_view_models[0].review_gap_view;

  assert.equal(gap.gap_ref, "GAP-001");
  assert.equal(gap.gap_source_trace.source_sheet, "Readiness_Gaps_Reentry");
});

test("review_gap_card blocks without explicit gap", () => {
  const result = run({ interaction_definitions: withFirstComponent("review_gap_card") });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "blocked_missing_review_gap_source");
});

test("review_gap_card preserves required_user_action", () => {
  assert.equal(run({ interaction_definitions: withReviewGap() })
    .interaction_view_models[0].review_gap_view.required_user_action, "clarify_missing_context");
});

test("review_gap_card does not resolve manual_review", () => {
  assert.equal(run({ interaction_definitions: withReviewGap() })
    .interaction_view_models[0].review_gap_view.manual_review_resolved, false);
});

test("review_gap_card does not create readiness_decision real", () => {
  assert.equal(run({ interaction_definitions: withReviewGap() })
    .interaction_view_models[0].review_gap_view.readiness_decision_real_created, false);
  assert.equal(run().no_go_check.readiness_engine_consumed, false);
});

test("review_gap_card does not create export-preview", () => {
  assert.equal(run({ interaction_definitions: withReviewGap() })
    .interaction_view_models[0].review_gap_view.export_preview_created, false);
});

test("user_visible_copy is created from authorized fields", () => {
  const copy = run({ interaction_definitions: withUserVisibleCopy() })
    .interaction_view_models[0].user_visible_copy;

  assert.equal(copy.activity_label, "Actividad de captura");
  assert.equal(copy.help_text, "Ayuda operativa autorizada");
});

test("user_visible_copy preserves activity_label when provided", () => {
  const copy = run({ interaction_definitions: withUserVisibleCopy() })
    .interaction_view_models[0].user_visible_copy;

  assert.equal(copy.activity_label, "Actividad de captura");
});

test("user_visible_copy preserves object_or_input_label when provided", () => {
  const copy = run({ interaction_definitions: withUserVisibleCopy() })
    .interaction_view_models[0].user_visible_copy;

  assert.equal(copy.object_or_input_label, "Insumo recibido");
});

test("user_visible_copy preserves procedure_or_rule_label when provided", () => {
  const copy = run({ interaction_definitions: withUserVisibleCopy() })
    .interaction_view_models[0].user_visible_copy;

  assert.equal(copy.procedure_or_rule_label, "Regla de captura");
});

test("source_trace is preserved internally but hidden from user_visible_copy", () => {
  const viewModel = run({ interaction_definitions: withUserVisibleCopy() })
    .interaction_view_models[0];

  assert.ok(viewModel.source_trace);
  assert.equal(viewModel.user_visible_copy.source_trace_hidden_from_user, true);
  assert.equal("source_trace" in viewModel.user_visible_copy, false);
  assert.equal("raw_row" in viewModel.user_visible_copy, false);
});

test("MMABP in visible_text blocks rendering", () => {
  const result = run({ interaction_definitions: withFirstDefinition({ visible_text: "MMABP visible" }) });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "blocked_forbidden_user_language");
});

test("VSM in help_text blocks rendering", () => {
  const result = run({ interaction_definitions: withFirstRawOverrides({ help_text: "VSM visible" }) });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "blocked_forbidden_user_language");
});

test("AHE in confirmation_prompt_text blocks rendering", () => {
  const result = run({
    interaction_definitions: withFirstRawOverrides({ confirmation_prompt_text: "AHE visible" }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "blocked_forbidden_user_language");
});

test("MoC/PF/PM/OLC in visible fields blocks rendering", () => {
  const terms = ["MoC", "PF", "PM", "OLC"];

  for (const term of terms) {
    const result = run({ interaction_definitions: withFirstDefinition({ visible_text: `${term} visible` }) });
    assert.equal(result.ok, false);
    assert.equal(result.blocked_reason, "blocked_forbidden_user_language");
  }
});

test("diagnostico in visible fields blocks rendering", () => {
  const result = run({ interaction_definitions: withFirstRawOverrides({ help_text: "diagnostico visible" }) });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "blocked_forbidden_user_language");
});

test("preclasificacion final as final truth blocks rendering", () => {
  const result = run({
    interaction_definitions: withFirstDefinition({ visible_text: "preclasificacion final visible" }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "blocked_forbidden_user_language");
});

test("microconfirmation without explicit confirmation_prompt_text blocks", () => {
  const result = run({
    interaction_definitions: withMicroconfirmation({ confirmation_prompt_text: undefined }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "blocked_missing_user_visible_copy");
});

test("microconfirmation does not fallback to visible_text for prompt", () => {
  const result = run({
    interaction_definitions: withMicroconfirmation({
      confirmation_prompt_text: undefined,
      visible_text: "Visible text cannot be prompt",
    }),
  });

  assert.equal(result.interaction_view_models[0].microconfirmation_view, undefined);
  assert.equal(result.blocked_reason, "blocked_missing_user_visible_copy");
});

test("review_gap_card without gap_label blocks", () => {
  const result = run({ interaction_definitions: withReviewGap({ gap_label: undefined }) });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "blocked_missing_user_visible_copy");
});

test("review_gap_card without gap_explanation blocks", () => {
  const result = run({ interaction_definitions: withReviewGap({ gap_explanation: undefined }) });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "blocked_missing_user_visible_copy");
});

test("review_gap_card without required_user_action blocks", () => {
  const result = run({ interaction_definitions: withReviewGap({ required_user_action: undefined }) });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "blocked_missing_user_visible_copy");
});

test("valid review_gap_card preserves required_user_action", () => {
  const gap = run({ interaction_definitions: withReviewGap() })
    .interaction_view_models[0].review_gap_view;

  assert.equal(gap.required_user_action, "clarify_missing_context");
});

test("forbidden terms in internal metadata do not block if not visible", () => {
  const result = run({
    interaction_definitions: withFirstRawOverrides({
      source_node_ref: "MMABP VSM AHE MoC PF PM OLC diagnostico",
    }),
  });

  assert.equal(result.ok, true);
  assert.equal(result.interaction_view_models[0].renderer_status, "render_model_ready");
});

test("user visible copy hides methodology terms", () => {
  const copy = run({ interaction_definitions: withUserVisibleCopy() })
    .interaction_view_models[0].user_visible_copy;

  assert.equal(copy.methodology_terms_hidden, true);
});

test("blocks MMABP in activity_label", () => {
  const result = run({ interaction_definitions: withFirstRawOverrides({ activity_label: "MMABP visible" }) });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "blocked_forbidden_user_language");
});

test("blocks VSM in object_or_input_label", () => {
  const result = run({ interaction_definitions: withFirstRawOverrides({ object_or_input_label: "VSM visible" }) });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "blocked_forbidden_user_language");
});

test("blocks AHE in output_or_result_label", () => {
  const result = run({ interaction_definitions: withFirstRawOverrides({ output_or_result_label: "AHE visible" }) });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "blocked_forbidden_user_language");
});

test("blocks MoC in procedure_or_rule_label", () => {
  const result = run({ interaction_definitions: withFirstRawOverrides({ procedure_or_rule_label: "MoC visible" }) });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "blocked_forbidden_user_language");
});

test("blocks PF in context_note", () => {
  const result = run({ interaction_definitions: withFirstRawOverrides({ context_note: "PF visible" }) });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "blocked_forbidden_user_language");
});

test("blocks PM in confirmation_prompt_text", () => {
  const result = run({ interaction_definitions: withFirstRawOverrides({ confirmation_prompt_text: "PM visible" }) });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "blocked_forbidden_user_language");
});

test("blocks OLC in correction_prompt_text", () => {
  const result = run({ interaction_definitions: withFirstRawOverrides({ correction_prompt_text: "OLC visible" }) });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "blocked_forbidden_user_language");
});

test("blocks diagnostico in required_user_action", () => {
  const result = run({ interaction_definitions: withReviewGap({ required_user_action: "diagnostico visible" }) });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "blocked_forbidden_user_language");
});

test("blocks recursividad in gap_label", () => {
  const result = run({ interaction_definitions: withReviewGap({ gap_label: "recursividad visible" }) });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "blocked_forbidden_user_language");
});

test("blocks variedad in gap_explanation", () => {
  const result = run({ interaction_definitions: withReviewGap({ gap_explanation: "variedad visible" }) });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "blocked_forbidden_user_language");
});

test("blocks verdad final in visible_text", () => {
  const result = run({ interaction_definitions: withFirstDefinition({ visible_text: "verdad final visible" }) });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "blocked_forbidden_user_language");
});

test("blocks preclasificacion final in help_text", () => {
  const result = run({ interaction_definitions: withFirstRawOverrides({ help_text: "preclasificacion final visible" }) });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "blocked_forbidden_user_language");
});

test("does not block forbidden terms in source_trace", () => {
  const defs = interactionDefinitions();
  defs[0] = {
    ...defs[0],
    source_document: "MMABP_VSM_AHE_MoC_PF_PM_OLC_diagnostico.xlsx",
    source_sheet: "recursividad_variedad_verdad_final",
    source_refs: ["preclasificacion final"],
  };

  const result = run({ interaction_definitions: defs });

  assert.equal(result.ok, true);
  assert.equal(result.interaction_view_models[0].renderer_status, "render_model_ready");
});

test("does not block forbidden terms in raw_row", () => {
  const result = run({
    interaction_definitions: withFirstRawOverrides({
      internal_traceability_note: "MMABP VSM AHE MoC PF PM OLC recursividad variedad verdad final",
    }),
  });

  assert.equal(result.ok, true);
  assert.equal(result.interaction_view_models[0].renderer_status, "render_model_ready");
});

test("does not block forbidden terms in internal metadata", () => {
  const result = run({
    interaction_definitions: withFirstRawOverrides({
      internal_methodology_terms: ["MMABP", "VSM", "AHE", "MoC", "PF", "PM", "OLC"],
    }),
  });

  assert.equal(result.ok, true);
  assert.equal(result.interaction_view_models[0].renderer_status, "render_model_ready");
});

test("full coverage preserves methodology_terms_hidden=true", () => {
  const copy = run({ interaction_definitions: withUserVisibleCopy() })
    .interaction_view_models[0].user_visible_copy;

  assert.equal(copy.methodology_terms_hidden, true);
});

test("full coverage preserves source_trace_hidden_from_user=true", () => {
  const copy = run({ interaction_definitions: withUserVisibleCopy() })
    .interaction_view_models[0].user_visible_copy;

  assert.equal(copy.source_trace_hidden_from_user, true);
});

test("blocks if orchestrator_result.ok=false", () => {
  const result = run({ orchestrator_result: { ...orchestratorResult(), ok: false } });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "orchestrator_result_not_ok");
});

test("blocks if interaction_definitions.length is not 60", () => {
  const defs = interactionDefinitions();
  defs.pop();

  const result = run({ interaction_definitions: defs });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "interaction_definition_count_not_60");
});

test("blocks if interaction definition is missing", () => {
  const defs = interactionDefinitions().filter(
    (definition) => definition.runtime_interaction_id !== "B0-Q01",
  );
  defs.push(interactionDefinition("B99", "base", "compound_card"));

  const result = run({ interaction_definitions: defs });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "missing_required_interaction_definition");
  assert.equal(result.renderer_decisions[0].renderer_status, "blocked_missing_renderer_source");
});

test("blocks B0-Q01 when exact interaction definition is missing", () => {
  const defs = interactionDefinitions().filter(
    (definition) => definition.runtime_interaction_id !== "B0-Q01",
  );
  defs.push(interactionDefinition("B99", "base", "compound_card"));

  const result = run({ interaction_definitions: defs });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "missing_required_interaction_definition");
});

test("does not fallback from B0-Q01 to B0", () => {
  const defs = interactionDefinitions().filter(
    (definition) => definition.runtime_interaction_id !== "B0-Q01",
  );
  defs.push(interactionDefinition("B0", "base", "compound_card"));

  const result = run({ interaction_definitions: defs });

  assert.equal(result.ok, false);
  assert.equal(result.renderer_decisions[0].runtime_interaction_id, "missing");
  assert.equal(result.renderer_decisions[0].fallback_interaction_used, false);
});

test("does not fallback from B0-Q01 to B1", () => {
  const defs = interactionDefinitions().filter(
    (definition) => definition.runtime_interaction_id !== "B0-Q01",
  );
  defs.push(interactionDefinition("B1", "base", "compound_card"));

  const result = run({ interaction_definitions: defs });

  assert.equal(result.ok, false);
  assert.equal(result.renderer_decisions[0].runtime_interaction_id, "missing");
  assert.equal(result.renderer_decisions[0].fallback_interaction_used, false);
});

test("blocks if visible_text missing", () => {
  const defs = interactionDefinitions();
  defs[0] = { ...defs[0], visible_text: "" };

  const result = run({ interaction_definitions: defs });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "blocked_missing_visible_text");
});

test("blocks if source trace missing", () => {
  const defs = interactionDefinitions();
  delete defs[0].source_document;

  const result = run({ interaction_definitions: defs });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "blocked_missing_source_traceability");
});

test("marks unknown ui_component as manual_review_required_unknown_ui_component", () => {
  const defs = interactionDefinitions();
  defs[0] = { ...defs[0], ui_component: "unknown_component" };

  const result = run({ interaction_definitions: defs });

  assert.equal(result.ok, true);
  assert.equal(
    result.interaction_view_models[0].renderer_status,
    "manual_review_required_unknown_ui_component",
  );
});

test("renderer decision has fallback_interaction_used=false", () => {
  assert.equal(run().renderer_decisions[0].fallback_interaction_used, false);
});

test("renderer decision has free_inference_used=false", () => {
  assert.equal(run().renderer_decisions[0].free_inference_used, false);
});

test("renderer decision has epistemic_policy_inferred=false", () => {
  assert.equal(run().renderer_decisions[0].epistemic_policy_inferred, false);
});

test("missing epistemic_policy produces manual_review_required_missing_epistemic_policy", () => {
  const result = run({ subfield_schemas: subfieldSchemasWithoutPolicy() });

  assert.equal(result.ok, true);
  assert.equal(
    result.interaction_view_models[0].renderer_status,
    "manual_review_required_missing_epistemic_policy",
  );
});

test("missing epistemic_policy produces manual_review even when subfields are empty", () => {
  const result = run({ subfield_schemas: [] });

  assert.equal(result.ok, true);
  assert.equal(
    result.interaction_view_models[0].renderer_status,
    "manual_review_required_missing_epistemic_policy",
  );
  assert.equal(result.interaction_view_models[0].epistemic_policy.explicit_policy_present, false);
});

test("missing epistemic_policy does not create default confirmation_policy", () => {
  const epistemic = run({ subfield_schemas: subfieldSchemasWithoutPolicy() })
    .interaction_view_models[0].epistemic_policy;

  assert.equal(epistemic.explicit_policy_present, false);
  assert.equal(epistemic.confirmation_policy, undefined);
});

test("missing epistemic_policy does not infer must_not_infer=[] as policy", () => {
  const epistemic = run({ subfield_schemas: subfieldSchemasWithoutPolicy() })
    .interaction_view_models[0].epistemic_policy;

  assert.equal(epistemic.explicit_policy_present, false);
  assert.equal(epistemic.must_not_infer.length, 0);
});

test("allowed_epistemic_statuses remains vocabulary only", () => {
  const epistemic = run({ subfield_schemas: subfieldSchemasWithoutPolicy() })
    .interaction_view_models[0].epistemic_policy;

  assert.ok(epistemic.allowed_epistemic_statuses.includes("captured_user_evidence"));
  assert.equal(epistemic.explicit_policy_present, false);
});

test("valid explicit epistemic policy produces render_model_ready", () => {
  assert.equal(run().interaction_view_models[0].renderer_status, "render_model_ready");
});

test("epistemic_ux contract is created from explicit policy", () => {
  const epistemic = run().interaction_view_models[0].epistemic_ux;

  assert.equal(epistemic.explicit_policy_present, true);
  assert.equal(epistemic.confirmation_policy, "requires_user_confirmation");
  assert.ok(epistemic.must_not_infer.includes("action_verb"));
  assert.equal(epistemic.must_not_infer_explicit, true);
});

test("epistemic_ux allowed_epistemic_statuses remains vocabulary only", () => {
  const epistemic = run().interaction_view_models[0].epistemic_ux;

  assert.equal(epistemic.allowed_epistemic_statuses_vocabulary_only, true);
  assert.ok(epistemic.allowed_epistemic_statuses.includes("ai_inferred_unconfirmed"));
});

test("epistemic_ux missing explicit policy routes to manual review", () => {
  const result = run({ subfield_schemas: subfieldSchemasWithoutPolicy() });

  assert.equal(result.interaction_view_models[0].renderer_status, "manual_review_required_missing_epistemic_policy");
  assert.equal(result.interaction_view_models[0].epistemic_ux.explicit_policy_present, false);
});

test("ai_inferred_unconfirmed requires confirmation", () => {
  assert.equal(
    run().interaction_view_models[0].epistemic_ux.ai_inferred_unconfirmed_requires_confirmation,
    true,
  );
});

test("user_corrected_evidence overrides previous inference locally", () => {
  assert.equal(
    run().interaction_view_models[0].epistemic_ux.user_corrected_evidence_overrides_previous_inference,
    true,
  );
});

test("captured_user_evidence_created_from_ui remains false", () => {
  assert.equal(run().interaction_view_models[0].epistemic_ux.captured_user_evidence_created_from_ui, false);
});

test("epistemic_ux default policy is not fabricated", () => {
  const epistemic = run({ subfield_schemas: subfieldSchemasWithoutPolicy() })
    .interaction_view_models[0].epistemic_ux;

  assert.equal(epistemic.default_policy_fabricated, false);
  assert.equal(epistemic.confirmation_policy, undefined);
});

test("must_not_infer is read only from explicit epistemic policy", () => {
  const epistemic = run().interaction_view_models[0].epistemic_ux;

  assert.equal(epistemic.must_not_infer_explicit, true);
  assert.ok(epistemic.must_not_infer.includes("action_verb"));
});

test("required subfields are not converted into must_not_infer", () => {
  const epistemic = run({ subfield_schemas: subfieldSchemasWithoutMustNotInferSource() })
    .interaction_view_models[0].epistemic_ux;

  assert.equal(epistemic.required_subfields_used_as_must_not_infer, false);
  assert.equal(epistemic.must_not_infer.includes("action_verb"), false);
});

test("missing must_not_infer explicit policy routes to manual review", () => {
  const result = run({ subfield_schemas: subfieldSchemasWithoutMustNotInferSource() });

  assert.equal(result.ok, true);
  assert.equal(
    result.interaction_view_models[0].renderer_status,
    "manual_review_required_missing_epistemic_policy",
  );
  assert.equal(result.interaction_view_models[0].epistemic_ux.must_not_infer_explicit, false);
});

test("explicit must_not_infer produces render_model_ready when other requirements are valid", () => {
  assert.equal(run().interaction_view_models[0].renderer_status, "render_model_ready");
});

test("empty must_not_infer without explicit source does not pass as policy", () => {
  const result = run({ subfield_schemas: subfieldSchemasWithEmptyMustNotInfer() });

  assert.equal(
    result.interaction_view_models[0].renderer_status,
    "manual_review_required_missing_epistemic_policy",
  );
  assert.equal(result.interaction_view_models[0].epistemic_ux.must_not_infer_explicit, false);
});

test("epistemic_ux default_must_not_infer_fabricated=false", () => {
  assert.equal(run().interaction_view_models[0].epistemic_ux.default_must_not_infer_fabricated, false);
});

test("epistemic_ux required_subfields_used_as_must_not_infer=false", () => {
  assert.equal(run().interaction_view_models[0].epistemic_ux.required_subfields_used_as_must_not_infer, false);
});

test("budget_ux contract is created", () => {
  const budget = run().interaction_view_models[0].budget_ux;

  assert.equal(budget.base_limit, 40);
  assert.equal(budget.causal_limit, 20);
});

test("budget_ux base interaction uses base_40", () => {
  const budget = run().interaction_view_models[0].budget_ux;

  assert.equal(budget.counts_as_visible, true);
  assert.equal(budget.counts_as_causal, false);
  assert.equal(budget.budget_bucket, "base_40");
});

test("budget_ux causal interaction uses causal_20", () => {
  const budget = run({
    orchestrator_result: orchestratorResult({ next_interaction_hint: "C09" }),
  }).interaction_view_models[0].budget_ux;

  assert.equal(budget.counts_as_visible, true);
  assert.equal(budget.counts_as_causal, true);
  assert.equal(budget.budget_bucket, "causal_20");
});

test("budget_ux internal derivation uses internal_no_count", () => {
  const budget = run({
    interaction_definitions: withFirstRawOverrides({ budget_bucket: "internal_no_count" }),
  }).interaction_view_models[0].budget_ux;

  assert.equal(budget.counts_as_visible, false);
  assert.equal(budget.counts_as_causal, false);
  assert.equal(budget.budget_bucket, "internal_no_count");
});

test("budget_ux microconfirmation can use microconfirmation_counted", () => {
  const budget = run({ interaction_definitions: withMicroconfirmation() })
    .interaction_view_models[0].budget_ux;

  assert.equal(budget.budget_bucket, "microconfirmation_counted");
});

test("budget_ux budget_consumed_real remains false", () => {
  assert.equal(run().interaction_view_models[0].budget_ux.budget_consumed_real, false);
});

test("budget_ux budget_ledger_real_created remains false", () => {
  assert.equal(run().interaction_view_models[0].budget_ux.budget_ledger_real_created, false);
});

test("blocked_causal_budget_exhausted when causal budget is exhausted", () => {
  const result = run({ interaction_definitions: withCausalProbe({ causal_budget_exhausted: true }) });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "blocked_causal_budget_exhausted");
});

test("source_traceability_ux contract is created", () => {
  const trace = run().interaction_view_models[0].source_traceability_ux;

  assert.equal(trace.source_trace_hidden_from_user, true);
});

test("source_traceability_ux preserves source document sheet and row", () => {
  const trace = run().interaction_view_models[0].source_traceability_ux;

  assert.equal(trace.source_document, "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx");
  assert.equal(trace.source_sheet, "Runtime_Interactions_Base_40");
  assert.equal(trace.source_row_number, 2);
});

test("source_traceability_ux preserves raw_row internally", () => {
  const trace = run().interaction_view_models[0].source_traceability_ux;

  assert.equal(trace.raw_row.source_question_code, "B0-Q01");
});

test("source_traceability_ux hides source_trace from user", () => {
  assert.equal(run().interaction_view_models[0].source_traceability_ux.source_trace_hidden_from_user, true);
});

test("source_traceability_ux missing source_trace blocks", () => {
  const defs = interactionDefinitions();
  delete defs[0].source_document;

  const result = run({ interaction_definitions: defs });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "blocked_missing_source_traceability");
});

test("source_traceability_ux interaction_substitution_used=false", () => {
  assert.equal(run().interaction_view_models[0].source_traceability_ux.interaction_substitution_used, false);
});

test("source_traceability_ux fuzzy_source_match_used=false", () => {
  assert.equal(run().interaction_view_models[0].source_traceability_ux.fuzzy_source_match_used, false);
});

test("source_traceability_ux semantic_fallback_used=false", () => {
  assert.equal(run().interaction_view_models[0].source_traceability_ux.semantic_fallback_used, false);
});

test("source_traceability_ux preserves source codes and refs", () => {
  const trace = run().interaction_view_models[0].source_traceability_ux;

  assert.equal(JSON.stringify(trace.source_codes), JSON.stringify(["SRC-B0-Q01", "B0-Q01"]));
  assert.equal(JSON.stringify(trace.source_refs), JSON.stringify(["SRC-B0-Q01"]));
});

test("source_traceability_ux preserves source_node_ref when available", () => {
  const trace = run({
    interaction_definitions: withFirstRawOverrides({ source_node_ref: "NODE-B0-Q01" }),
  }).interaction_view_models[0].source_traceability_ux;

  assert.equal(trace.source_node_ref, "NODE-B0-Q01");
});

test("validates B0-Q01 required subfields when present", () => {
  const viewModel = run().interaction_view_models[0];

  assert.equal(viewModel.runtime_interaction_id, "B0-Q01");
  assert.equal(viewModel.warnings.length, 0);
});

test("validates C09 required subfields when present", () => {
  const result = run({
    orchestrator_result: orchestratorResult({ next_interaction_hint: "C09" }),
  });

  assert.equal(result.interaction_view_models[0].runtime_interaction_id, "C09");
  assert.equal(result.interaction_view_models[0].warnings.length, 0);
});

test("keeps ui_rendered_real=false", () => {
  assert.equal(run().interaction_view_models[0].ui_rendered_real, false);
  assert.equal(run().no_go_check.ui_rendered_real, false);
});

test("keeps response_ingest_executed=false", () => {
  assert.equal(run().no_go_check.response_ingest_executed, false);
});

test("keeps runtime_subfield_response real not created", () => {
  assert.equal(run().no_go_check.runtime_subfield_response_real_created, false);
});

test("keeps captured_user_evidence_created=false", () => {
  assert.equal(run().no_go_check.captured_user_evidence_created, false);
});

test("keeps response/evidence/canonical/branching/readiness/export real boundaries false", () => {
  const noGo = run().no_go_check;

  assert.equal(noGo.response_persisted_real, false);
  assert.equal(noGo.evidence_item_real_created, false);
  assert.equal(noGo.canonical_variable_record_real_created, false);
  assert.equal(noGo.branching_real_created, false);
  assert.equal(noGo.readiness_real_created, false);
  assert.equal(noGo.export_real_created, false);
});

test("keeps runtime_40_20_started=false", () => {
  assert.equal(run().no_go_check.runtime_40_20_started, false);
});

test("keeps catalog_activated=false", () => {
  assert.equal(run().no_go_check.catalog_activated, false);
});

test("keeps migration_applied=false", () => {
  assert.equal(run().no_go_check.migration_applied, false);
});

test("keeps Supabase/SQL/endpoint false", () => {
  const noGo = run().no_go_check;

  assert.equal(noGo.supabase_touched, false);
  assert.equal(noGo.sql_executed, false);
  assert.equal(noGo.endpoint_created, false);
});

test("keeps real_runtime_records_created=false", () => {
  assert.equal(run().no_go_check.real_runtime_records_created, false);
});

test("keeps real_interaction_instances_created=false", () => {
  assert.equal(run().no_go_check.real_interaction_instances_created, false);
});

test("keeps business_evidence_created=false", () => {
  assert.equal(run().no_go_check.business_evidence_created, false);
});

test("keeps Registry/IR/Object Inventory/F5C/export/diagnosis/Delivered false", () => {
  const noGo = run().no_go_check;

  assert.equal(noGo.registry_live_db_created, false);
  assert.equal(noGo.ir_real_created, false);
  assert.equal(noGo.object_inventory_real_opened, false);
  assert.equal(noGo.f5c_real_opened, false);
  assert.equal(noGo.export_created, false);
  assert.equal(noGo.diagnosis_created, false);
  assert.equal(noGo.delivered_created, false);
});

test("does not modify existing services", () => {
  const result = run();

  assert.equal(result.materiality.local_only, true);
  assert.equal(result.materiality.ui_rendered_real, false);
  assert.equal(result.renderer_decisions[0].free_inference_used, false);
});

test("keeps no unauthorized expansion", () => {
  const decision = run().renderer_decisions[0];

  assert.equal(decision.free_inference_used, false);
  assert.equal(decision.fallback_interaction_used, false);
  assert.equal(decision.epistemic_policy_inferred, false);
});

test("no_inference_boundary is present", () => {
  assert.ok(run().interaction_view_models[0].no_inference_boundary);
});

test("no_inference_boundary b0q01_fallback_to_b0_used=false", () => {
  assert.equal(run().interaction_view_models[0].no_inference_boundary.b0q01_fallback_to_b0_used, false);
});

test("no_inference_boundary b0q01_fallback_to_b1_used=false", () => {
  assert.equal(run().interaction_view_models[0].no_inference_boundary.b0q01_fallback_to_b1_used, false);
});

test("no_inference_boundary interaction_substitution_used=false", () => {
  assert.equal(run().interaction_view_models[0].no_inference_boundary.interaction_substitution_used, false);
});

test("no_inference_boundary visible_text_fabricated=false", () => {
  assert.equal(run().interaction_view_models[0].no_inference_boundary.visible_text_fabricated, false);
});

test("no_inference_boundary ui_component_fabricated=false", () => {
  assert.equal(run().interaction_view_models[0].no_inference_boundary.ui_component_fabricated, false);
});

test("no_inference_boundary subfields_fabricated=false", () => {
  assert.equal(run().interaction_view_models[0].no_inference_boundary.subfields_fabricated, false);
});

test("no_inference_boundary epistemic_policy_fabricated=false", () => {
  assert.equal(run().interaction_view_models[0].no_inference_boundary.epistemic_policy_fabricated, false);
});

test("no_inference_boundary must_not_infer_fabricated=false", () => {
  assert.equal(run().interaction_view_models[0].no_inference_boundary.must_not_infer_fabricated, false);
});

test("no_inference_boundary confirmation_policy_fabricated=false", () => {
  assert.equal(run().interaction_view_models[0].no_inference_boundary.confirmation_policy_fabricated, false);
});

test("no_inference_boundary choice_options_fabricated=false", () => {
  assert.equal(run().interaction_view_models[0].no_inference_boundary.choice_options_fabricated, false);
});

test("no_inference_boundary causal_trigger_fabricated=false", () => {
  assert.equal(run().interaction_view_models[0].no_inference_boundary.causal_trigger_fabricated, false);
});

test("no_inference_boundary review_gap_fabricated=false", () => {
  assert.equal(run().interaction_view_models[0].no_inference_boundary.review_gap_fabricated, false);
});

test("no_inference_boundary microconfirmation_signal_fabricated=false", () => {
  assert.equal(run().interaction_view_models[0].no_inference_boundary.microconfirmation_signal_fabricated, false);
});

test("no_inference_boundary free_inference_used=false", () => {
  assert.equal(run().interaction_view_models[0].no_inference_boundary.free_inference_used, false);
});

test("no_inference_boundary semantic_fallback_used=false", () => {
  assert.equal(run().interaction_view_models[0].no_inference_boundary.semantic_fallback_used, false);
});

test("no_inference_boundary fuzzy_match_used=false", () => {
  assert.equal(run().interaction_view_models[0].no_inference_boundary.fuzzy_match_used, false);
});

test("blocks interaction substitution attempts", () => {
  const result = run({
    interaction_definitions: withFirstRawOverrides({ b0q01_fallback_to_b0_used: true }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "blocked_interaction_substitution_attempt");
});

test("blocks unauthorized inference attempts", () => {
  const result = run({
    interaction_definitions: withFirstRawOverrides({ visible_text_fabricated: true }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "blocked_unauthorized_inference_detected");
});

test("phase6_payload_preview is present", () => {
  assert.ok(run().interaction_view_models[0].phase6_payload_preview);
});

test("phase6_payload_preview uses interaction_id", () => {
  const preview = run().interaction_view_models[0].phase6_payload_preview;

  assert.equal(preview.interaction_id, "B0-Q01");
});

test("phase6_payload_preview uses interaction_instance_id_preview", () => {
  const viewModel = run().interaction_view_models[0];

  assert.equal(
    viewModel.phase6_payload_preview.interaction_instance_id_preview,
    viewModel.interaction_instance_id_preview,
  );
});

test("answers_preview values are null", () => {
  const preview = run().interaction_view_models[0].phase6_payload_preview;

  assert.ok(preview.answers_preview.length > 0);
  assert.equal(preview.answers_preview.every((answer) => answer.value === null), true);
});

test("subfield_answers_preview values are null", () => {
  const preview = run().interaction_view_models[0].phase6_payload_preview;

  assert.ok(preview.subfield_answers_preview.length > 0);
  assert.equal(preview.subfield_answers_preview.every((answer) => answer.value === null), true);
});

test("confirmation_status_preview is valid", () => {
  const preview = run().interaction_view_models[0].phase6_payload_preview;

  assert.ok([
    "pending_confirmation",
    "pending_correction",
    "not_applicable",
  ].includes(preview.confirmation_status_preview));
});

test("idempotency_key_preview is not persisted", () => {
  const preview = run().interaction_view_models[0].phase6_payload_preview;

  assert.equal(preview.idempotency_key_preview, "RUN-001:B0-Q01:payload_preview");
  assert.equal(preview.response_persisted_real, false);
});

test("payload_preview_created=true", () => {
  assert.equal(run().interaction_view_models[0].phase6_payload_preview.payload_preview_created, true);
});

test("phase6 payload preview keeps response_ingest_executed=false", () => {
  assert.equal(run().interaction_view_models[0].phase6_payload_preview.response_ingest_executed, false);
});

test("phase6 payload preview keeps response_persisted_real=false", () => {
  assert.equal(run().interaction_view_models[0].phase6_payload_preview.response_persisted_real, false);
});

test("phase6 payload preview keeps runtime_subfield_response_real_created=false", () => {
  assert.equal(
    run().interaction_view_models[0].phase6_payload_preview.runtime_subfield_response_real_created,
    false,
  );
});

test("phase6 payload preview keeps evidence_item_real_created=false", () => {
  assert.equal(run().interaction_view_models[0].phase6_payload_preview.evidence_item_real_created, false);
});

test("phase6 payload preview keeps canonical_variable_record_real_created=false", () => {
  assert.equal(
    run().interaction_view_models[0].phase6_payload_preview.canonical_variable_record_real_created,
    false,
  );
});

test("payload preview blocks if user value is present", () => {
  const result = run({
    interaction_definitions: withFirstRawOverrides({
      payload_preview_contains_user_response: true,
    }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "blocked_payload_preview_contains_user_response");
});

test("payload preview blocks if boundary violation is present", () => {
  const result = run({
    interaction_definitions: withFirstRawOverrides({
      payload_preview_boundary_violation: true,
    }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "blocked_payload_preview_boundary_violation");
});

test("payload preview blocks if evidence boundary is violated", () => {
  const result = run({
    interaction_definitions: withFirstRawOverrides({
      payload_preview_evidence_boundary_violation: true,
    }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "blocked_payload_preview_evidence_boundary_violation");
});

function run(overrides = {}) {
  return service.createRuntimeInteractionViewModels({
    case_id: "CASE-001",
    orchestrator_result: orchestratorResult(),
    interaction_definitions: interactionDefinitions(),
    subfield_schemas: subfieldSchemas(),
    canonical_variable_maps: [],
    ...overrides,
  });
}

function statusForComponent(uiComponent) {
  return run({ interaction_definitions: withFirstComponent(uiComponent) })
    .interaction_view_models[0].renderer_status;
}

function withFirstComponent(uiComponent) {
  const defs = interactionDefinitions();
  defs[0] = { ...defs[0], ui_component: uiComponent };

  return defs;
}

function withFirstDefinition(overrides = {}) {
  const defs = interactionDefinitions();
  defs[0] = { ...defs[0], ...overrides };

  return defs;
}

function withFirstRawOverrides(overrides = {}) {
  const defs = interactionDefinitions();
  defs[0] = {
    ...defs[0],
    raw_row: {
      ...defs[0].raw_row,
      ...overrides,
    },
  };

  return defs;
}

function withUserVisibleCopy() {
  return withFirstRawOverrides({
    activity_label: "Actividad de captura",
    object_or_input_label: "Insumo recibido",
    output_or_result_label: "Salida preparada",
    procedure_or_rule_label: "Regla de captura",
    context_note: "Contexto autorizado",
    correction_prompt_text: "Corrige el dato si hace falta.",
    help_text: "Ayuda operativa autorizada",
  });
}

function withChoiceComponent(uiComponent) {
  const defs = withFirstComponent(uiComponent);
  defs[0] = {
    ...defs[0],
    raw_row: {
      ...defs[0].raw_row,
      choice_options: choiceOptions(),
    },
  };

  return defs;
}

function withUnknownSelectedChoice(uiComponent) {
  const defs = withChoiceComponent(uiComponent);
  defs[0] = {
    ...defs[0],
    raw_row: {
      ...defs[0].raw_row,
      selected_value: "UNKNOWN",
    },
  };

  return defs;
}

function withCausalProbe(overrides = {}) {
  const defs = withFirstComponent("causal_probe_card");
  defs[0] = {
    ...defs[0],
    raw_row: {
      ...defs[0].raw_row,
      explicit_trigger_authorized: true,
      authorized_trigger_ref: "TRIGGER-C09",
      target_causal_interaction_id: "C09",
      trigger_source_document: "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
      trigger_source_sheet: "Semantic_Resolution_Gates",
      trigger_source_row_number: 701,
      ...overrides,
    },
  };

  return defs;
}

function withMicroconfirmation(overrides = {}) {
  const defs = withFirstComponent("microconfirmation");
  defs[0] = {
    ...defs[0],
    raw_row: {
      ...defs[0].raw_row,
      microconfirmation_signal_ref: "SIGNAL-B7",
      signal_type: "low_confidence",
      signal_source_document: "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
      signal_source_sheet: "Semantic_Resolution_Gates",
      signal_source_row_number: 801,
      confidence_level: "low",
      confirmation_prompt_text: "Please confirm this weak signal.",
      ...overrides,
    },
  };

  return defs;
}

function withReviewGap(overrides = {}) {
  const defs = withFirstComponent("review_gap_card");
  defs[0] = {
    ...defs[0],
    raw_row: {
      ...defs[0].raw_row,
      gap_ref: "GAP-001",
      gap_type: "manual_review",
      gap_label: "Missing context",
      gap_explanation: "A required source detail is missing.",
      required_user_action: "clarify_missing_context",
      gap_source_document: "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
      gap_source_sheet: "Readiness_Gaps_Reentry",
      gap_source_row_number: 901,
      ...overrides,
    },
  };

  return defs;
}

function orchestratorResult(overrides = {}) {
  const nextHint = overrides.next_interaction_hint ?? "B0_confirmation";

  return {
    ok: true,
    case_id: "CASE-001",
    role_runtime_session_plan: {},
    primary_activity_selection_plan: {},
    activity_runtime_run_plans: [],
    interaction_queue_plans: [],
    next_interaction_decisions: [
      {
        run_plan_id: "RUN-001",
        activity_id: "A-001",
        decision_type:
          nextHint === "B0_confirmation"
            ? "semantic_preload_ready"
            : "semantic_preload_ready",
        next_state_hint: "semantic_preload_loaded",
        next_interaction_hint: nextHint,
        ui_rendered: false,
      },
    ],
    budget_ledger_previews: [],
    readiness_precheck: {},
    no_go_check: {
      no_go_triggered: false,
      blockers: [],
      runtime_40_20_started: false,
      catalog_activated: false,
      migration_applied: false,
      supabase_touched: false,
      sql_executed: false,
      endpoint_created: false,
      real_runtime_records_created: false,
      real_interaction_instances_created: false,
      business_evidence_created: false,
      registry_live_db_created: false,
      ir_real_created: false,
      object_inventory_real_opened: false,
      f5c_real_opened: false,
      export_created: false,
      diagnosis_created: false,
      delivered_created: false,
    },
    materiality: {
      level: "runtime_40_20_activity_runtime_orchestrator_local_contract",
      local_only: true,
      runtime_40_20_started: false,
      next_authorization_required: true,
    },
    ...overrides,
  };
}

function interactionDefinitions() {
  const definitions = [
    interactionDefinition("B0-Q01", "base", "confirmation_card_with_correction"),
  ];

  for (let index = 2; index <= 40; index += 1) {
    definitions.push(interactionDefinition(`B${index}`, "base", "compound_card", index));
  }
  for (let index = 1; index <= 20; index += 1) {
    definitions.push(
      interactionDefinition(
        index === 9 ? "C09" : `C${String(index).padStart(2, "0")}`,
        "causal",
        "causal_probe_card",
        40 + index,
      ),
    );
  }

  return definitions;
}

function interactionDefinition(id, group, uiComponent, row = 2) {
  return {
    runtime_interaction_id: id,
    interaction_group: group,
    visible_text: `Visible text ${id}`,
    source_refs: [`SRC-${id}`],
    ui_component: uiComponent,
    counts_as_base: group === "base",
    counts_as_causal: group === "causal",
    source_document: "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
    source_sheet:
      group === "base" ? "Runtime_Interactions_Base_40" : "Runtime_Interactions_Causal_20",
    source_row_number: row,
    raw_row: {
      source_code: `SRC-${id}`,
      source_question_code: id,
      block: group === "base" ? "B0" : "Causal",
      help_text: `Help ${id}`,
    },
    canonicalization_status: "normalized",
    warnings: [],
    blockers: [],
  };
}

function subfieldSchemas() {
  return [
    ...requiredSubfields("B0-Q01", [
      "action_verb",
      "input_or_object",
      "procedure_or_standard",
      "output_or_result",
      "user_correction_note",
    ]),
    ...requiredSubfields("C09", [
      "feedback_signal_type",
      "feedback_content",
      "operational_effect",
      "route_gap_flag",
    ]),
  ];
}

function subfieldSchemasWithoutPolicy() {
  return subfieldSchemas().map((subfield) => {
    const copy = { ...subfield };
    delete copy.epistemic_policy;
    return copy;
  });
}

function subfieldSchemasWithoutMustNotInferSource() {
  return subfieldSchemas().map((subfield) => ({
    ...subfield,
    raw_row: Object.fromEntries(
      Object.entries(subfield.raw_row).filter(([key]) => key !== "must_not_infer"),
    ),
  }));
}

function subfieldSchemasWithEmptyMustNotInfer() {
  return subfieldSchemas().map((subfield) => ({
    ...subfield,
    raw_row: {
      ...subfield.raw_row,
      must_not_infer: [],
    },
  }));
}

function hybridChoiceTextSubfields() {
  return [
    requiredSubfield("B0-Q01", "closed_choice", 201, {
      hybrid_part: "choice",
      choice_options: choiceOptions(),
    }),
    requiredSubfield("B0-Q01", "open_explanation", 202, {
      hybrid_part: "free_text",
    }),
  ];
}

function requiredSubfields(runtimeInteractionId, names) {
  return names.map((name, index) =>
    requiredSubfield(runtimeInteractionId, name, 100 + index),
  );
}

function requiredSubfield(runtimeInteractionId, name, row, rawExtras = {}) {
  return {
    runtime_interaction_id: runtimeInteractionId,
    subfield_name: name,
    required: true,
    epistemic_policy: "requires_user_confirmation",
    source_document: "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
    source_sheet: "UX_Subfield_Structure",
    source_row_number: row,
    raw_row: {
      label: name,
      type: "text",
      must_not_infer: [name],
      ...rawExtras,
    },
    canonicalization_status: "normalized",
    warnings: [],
    blockers: [],
  };
}

function choiceOptions() {
  return [
    {
      option_id: "A",
      option_label: "Option A",
      normalized_code: "OPT_A",
      source_document: "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
      source_sheet: "Implementation_Dictionaries",
      source_row_number: 501,
    },
    {
      option_id: "B",
      option_label: "Option B",
      normalized_code: "OPT_B",
      source_document: "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
      source_sheet: "Implementation_Dictionaries",
      source_row_number: 502,
    },
  ];
}

function loadModule(fileName, requireMap) {
  const source = readFileSync(new URL(fileName, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
    },
  });
  const module = { exports: {} };
  const context = {
    exports: module.exports,
    module,
    require: (id) => {
      if (id in requireMap) return requireMap[id];
      throw new Error(`Unexpected require: ${id}`);
    },
  };

  vm.runInNewContext(outputText, context, { filename: fileName });
  return module.exports;
}
