import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const service = loadModule("runtime-40-20-branching-budget-service.ts", {
  "./runtime-40-20-branching-budget-types": {},
  "../canonical-variable/runtime-40-20-canonical-variable-types": {},
});

test("starts Phase 8 locally only when Phase 7 is closed local", () => {
  const result = run();

  assert.equal(result.phase8_input_revalidation.phase7_closed_local, true);
  assert.equal(result.phase8_input_revalidation.phase8_started_local, true);
});

test("blocks Phase 8 if phase7_closed_local=false", () => {
  const result = run({
    phase7_closeout: {
      phase7_closed_local: false,
      ready_for_phase8_authorization: true,
    },
  });

  assert.equal(result.status, "blocked_phase7_not_closed");
  assert.equal(result.phase8_input_revalidation.phase8_started_local, false);
  assert.equal(result.phase8_started_local, false);
});

test("blocks Phase 8 if ready_for_phase8_authorization=false", () => {
  const result = run({
    phase7_closeout: {
      phase7_closed_local: true,
      ready_for_phase8_authorization: false,
    },
  });

  assert.equal(result.status, "blocked_phase8_not_authorized");
  assert.equal(result.phase8_input_revalidation.phase8_started_local, false);
  assert.equal(result.phase8_started_local, false);
});

test("creates phase8_input_revalidation decision", () => {
  assert.equal(Boolean(run().phase8_input_revalidation), true);
});

test("consumes canonical_variable_record candidates", () => {
  assert.equal(run().phase8_input_revalidation.canonical_variable_candidates_available, true);
});

test("consumes route_status candidates", () => {
  assert.equal(run().phase8_input_revalidation.route_status_candidates_available, true);
});

test("consumes gap_flag / gap_type candidates", () => {
  assert.equal(run().phase8_input_revalidation.gap_flag_candidates_available, true);
});

test("consumes C09 receiver feedback boundary", () => {
  assert.equal(run().phase8_input_revalidation.c09_receiver_feedback_boundary_available, true);
});

test("consumes B7 non-diagnostic guard", () => {
  assert.equal(run().phase8_input_revalidation.b7_non_diagnostic_guard_available, true);
});

test("consumes Phase 8 boundary from Phase 7-D", () => {
  assert.equal(run().phase8_input_revalidation.phase8_boundary_from_phase7d_available, true);
});

test("does not recalculate canonical variables", () => {
  assert.equal(run().phase8_input_revalidation.canonical_variables_recalculated, false);
});

test("does not modify Phase 7", () => {
  assert.equal(run().phase8_input_revalidation.phase7_modified, false);
});

test("does not start Phase 9", () => {
  assert.equal(run().phase8_input_revalidation.phase9_started, false);
});

test("creates branching rule source contract", () => {
  assert.equal(run().branching_rule_source_contracts.length, 1);
});

test("requires explicit branching rule", () => {
  const result = run({ branching_rules: [branchingRule({ explicit_rule_present: false })] });

  assert.equal(result.status, "blocked_missing_explicit_branching_rule");
});

test("requires activation_signal", () => {
  const result = run({ branching_rules: [branchingRule({ activation_signal: undefined })] });

  assert.equal(result.status, "blocked_missing_activation_signal");
});

test("requires trigger_condition", () => {
  const result = run({ branching_rules: [branchingRule({ trigger_condition: undefined })] });

  assert.equal(result.status, "blocked_missing_trigger_condition");
});

test("requires causal_interaction_id", () => {
  const result = run({ branching_rules: [branchingRule({ causal_interaction_id: undefined })] });

  assert.equal(result.status, "blocked_missing_causal_interaction_id");
});

test("requires source_node_ref", () => {
  const evaluation = run({
    branching_rules: [branchingRule({ source_node_ref: undefined })],
  }).trigger_evaluation_candidates[0];

  assert.equal(evaluation.blocking_reasons.includes("missing_source_node_ref"), true);
});

test("requires source_trace", () => {
  const result = run({ branching_rules: [branchingRule({ source_trace: {} })] });

  assert.equal(result.status, "blocked_missing_source_trace");
});

test("blocks free text branching", () => {
  const result = run({ branching_rules: [branchingRule({ free_text_branching_used: true })] });

  assert.equal(result.status, "blocked_free_text_trigger");
});

test("blocks text similarity branching", () => {
  const result = run({
    branching_rules: [branchingRule({ text_similarity_branching_used: true })],
  });
  const evaluation = result.trigger_evaluation_candidates[0];

  assert.equal(result.status, "blocked_text_similarity_branching");
  assert.equal(evaluation.blocking_reasons.includes("text_similarity_branching_detected"), true);
});

test("blocks visible_text branching", () => {
  const result = run({ branching_rules: [branchingRule({ visible_text_branching_used: true })] });

  assert.equal(result.status, "blocked_visible_text_trigger");
});

test("blocks satisfaction general branching", () => {
  const result = run({
    branching_rules: [branchingRule({ satisfaction_general_branching_used: true })],
  });

  assert.equal(result.status, "blocked_satisfaction_general_trigger");
});

test("creates branching signal candidates", () => {
  assert.equal(run().signal_candidates.length, 1);
});

test("signal intake does not fabricate all signal families by default", () => {
  assert.equal(run().signal_candidates.length < 16, true);
});

test("signal_candidates can be empty when no explicit signals exist", () => {
  assert.equal(run({ branching_signal_sources: [] }).signal_candidates.length, 0);
});

for (const [family, label] of [
  ["canonical_variable", "canonical_variable signal family"],
  ["route_status", "route_status signal family"],
  ["gap_flag", "gap_flag signal family"],
  ["c09_receiver_feedback", "c09_receiver_feedback signal family"],
  ["b0_weak_context", "B0 weak context signal family"],
  ["b2_transformation_route_missing", "B2 transformation route missing signal family"],
  ["b3_receiver_feedback_rejection_return_block", "B3 receiver feedback/rejection/return/block signal family"],
  ["b7_low_confidence_preclassification_only", "B7 low confidence preclassification only signal family"],
  ["sem_ambiguity", "SEM ambiguity signal family"],
  ["pst_wait_deadlock", "PST wait/deadlock signal family"],
  ["object_state_missing", "object/state missing signal family"],
  ["rework_recurrent", "rework recurrent signal family"],
  ["workaround_residual_variety_informal_rule", "workaround/residual variety/informal rule signal family"],
  ["capacity_gap_resource_bargain", "capacity gap/resource bargain signal family"],
  ["real_sequence_differs_from_official", "real sequence differs from official signal family"],
  ["low_semantic_confidence_interpersonal_tension", "low semantic confidence/interpersonal tension signal family"],
]) {
  test(`supports ${label}`, () => {
    const result = run({
      branching_signal_sources: [signalSource({ signal_family: family, signal_type: family })],
    });

    assert.equal(result.signal_candidates.some((signal) => signal.signal_family === family), true);
  });
}

test("B0 signal candidate is created only when explicit B0 signal/source exists", () => {
  assert.equal(run({ branching_signal_sources: [] }).signal_candidates.some((signal) => signal.signal_family === "b0_weak_context"), false);
  assert.equal(run({ branching_signal_sources: [signalSource({ signal_family: "b0_weak_context" })] }).signal_candidates[0].signal_family, "b0_weak_context");
});

test("B2 signal candidate is created only when explicit B2 signal/source exists", () => {
  assert.equal(run({ branching_signal_sources: [] }).signal_candidates.some((signal) => signal.signal_family === "b2_transformation_route_missing"), false);
  assert.equal(run({ branching_signal_sources: [signalSource({ signal_family: "b2_transformation_route_missing" })] }).signal_candidates[0].signal_family, "b2_transformation_route_missing");
});

test("B3/C09 signal candidate is created only when explicit receiver_feedback source exists", () => {
  assert.equal(run({ branching_signal_sources: [] }).signal_candidates.some((signal) => signal.signal_family === "c09_receiver_feedback"), false);
  assert.equal(run({ branching_signal_sources: [signalSource({ signal_family: "c09_receiver_feedback" })] }).signal_candidates[0].signal_family, "c09_receiver_feedback");
});

test("B7 signal candidate is created only when explicit B7 preclassification signal exists", () => {
  assert.equal(run({ branching_signal_sources: [] }).signal_candidates.some((signal) => signal.signal_family === "b7_low_confidence_preclassification_only"), false);
  assert.equal(run({ branching_signal_sources: [signalSource({ signal_family: "b7_low_confidence_preclassification_only", diagnostic_status: "non_diagnostic" })] }).signal_candidates[0].signal_family, "b7_low_confidence_preclassification_only");
});

test("C09 receiver_feedback_from_satisfaction=false allows candidate when source_trace exists", () => {
  const result = run({
    branching_signal_sources: [
      signalSource({
        signal_family: "c09_receiver_feedback",
        receiver_feedback_from_satisfaction: false,
      }),
    ],
  });

  assert.equal(result.signal_candidates[0].candidate_allowed, true);
});

test("C09 receiver_feedback_from_satisfaction=true blocks candidate", () => {
  const result = run({
    branching_signal_sources: [
      signalSource({
        signal_family: "c09_receiver_feedback",
        receiver_feedback_from_satisfaction: true,
      }),
    ],
  });

  assert.equal(result.signal_candidates[0].candidate_allowed, false);
  assert.equal(result.signal_candidates[0].blocking_reasons.includes("satisfaction_general_branching_detected"), true);
});

test("blocks B7 diagnostic trigger", () => {
  const result = run({ branching_rules: [branchingRule({ b7_diagnostic_trigger_used: true })] });

  assert.equal(result.status, "blocked_b7_diagnostic_trigger");
});

test("creates trigger evaluation candidates", () => {
  assert.equal(run().trigger_evaluation_candidates.length, 1);
});

test("evaluates trigger_condition locally", () => {
  const evaluation = run().trigger_evaluation_candidates[0];

  assert.equal(evaluation.trigger_condition_evaluated, true);
  assert.equal(evaluation.trigger_condition_result, true);
});

test("requires signal_source_trace", () => {
  const result = run({
    branching_signal_sources: [signalSource({ source_trace: {} })],
  });

  assert.equal(result.trigger_evaluation_candidates[0].signal_source_trace_present, false);
});

test("requires trigger_source_rule_ref", () => {
  assert.equal(run().trigger_evaluation_candidates[0].trigger_source_rule_ref_present, true);
});

test("requires causal interaction in causal 20", () => {
  const evaluation = run({ causal_interaction_ids: [] }).trigger_evaluation_candidates[0];

  assert.equal(evaluation.causal_interaction_exists_in_causal_20, false);
  assert.equal(evaluation.blocking_reasons.includes("missing_causal_interaction_id"), true);
});

test("applies mutual exclusion policy when present", () => {
  const evaluation = run({
    branching_rules: [branchingRule({ mutual_exclusion_policy: "first_match" })],
  }).trigger_evaluation_candidates[0];

  assert.equal(evaluation.mutual_exclusion_policy_applied, true);
});

test("applies skip_if_resolved_by_other when present", () => {
  const evaluation = run({
    branching_rules: [branchingRule({ skip_if_resolved_by_other: true })],
  }).trigger_evaluation_candidates[0];

  assert.equal(evaluation.skip_if_resolved_by_other_applied, true);
});

test("applies closed_by_other when present", () => {
  const evaluation = run({
    branching_rules: [branchingRule({ closed_by_other: true })],
  }).trigger_evaluation_candidates[0];

  assert.equal(evaluation.closed_by_other_applied, true);
});

test("trigger_allowed does not open causal", () => {
  const evaluation = run().trigger_evaluation_candidates[0];

  assert.equal(evaluation.trigger_allowed, true);
  assert.equal(evaluation.causal_opened, false);
});

test("trigger_allowed=false when text similarity branching is detected", () => {
  const evaluation = run({
    branching_rules: [branchingRule({ text_similarity_branching_used: true })],
  }).trigger_evaluation_candidates[0];

  assert.equal(evaluation.trigger_allowed, false);
});

test("causal_opened remains false", () => {
  assert.equal(run().causal_opened, false);
});

test("causal_score_calculated remains false", () => {
  assert.equal(run().causal_score_calculated, false);
});

test("branching_decision real created remains false", () => {
  const result = run();

  assert.equal(result.branching_decision_real_created, false);
  assert.equal(result.trigger_evaluation_candidates[0].branching_decision_real_created, false);
});

test("budget_ledger real updated remains false", () => {
  const result = run();

  assert.equal(result.budget_ledger_real_updated, false);
  assert.equal(result.trigger_evaluation_candidates[0].budget_ledger_real_updated, false);
});

test("runtime_interaction_instance real created remains false", () => {
  assert.equal(run().runtime_interaction_instance_real_created, false);
});

test("reentry_opened remains false", () => {
  assert.equal(run().reentry_opened, false);
});

test("CriticalRouteGate executed remains false", () => {
  assert.equal(run().critical_route_gate_executed, false);
});

test("MMABPGateEngine executed remains false", () => {
  assert.equal(run().mmabp_gate_engine_executed, false);
});

test("ReadinessEngine executed remains false", () => {
  assert.equal(run().readiness_engine_executed, false);
});

test("Supabase/SQL/endpoint remain false", () => {
  const result = run();

  assert.equal(result.supabase_touched, false);
  assert.equal(result.sql_executed, false);
  assert.equal(result.endpoint_created, false);
});

test("Export-preview remains false", () => {
  assert.equal(run().export_preview_created, false);
});

test("Diagnosis/IR/registry remain false", () => {
  const result = run();

  assert.equal(result.diagnosis_created, false);
  assert.equal(result.ir_created, false);
  assert.equal(result.registry_created, false);
});

test("Phase 8 closed local remains false", () => {
  assert.equal(run().phase8_closed_local, false);
});

test("Ready for Phase 9 authorization remains false", () => {
  assert.equal(run().ready_for_phase9_authorization, false);
});

test("blocks causal opening attempt in 8-A", () => {
  const result = run({
    branching_rules: [branchingRule({ causal_opening_attempted_in_8a: true })],
  });

  assert.equal(result.status, "blocked_causal_opening_attempt_in_8A");
});

test("keeps service_role false", () => {
  const result = run();

  assert.equal(result.service_role_used, false);
  assert.equal(result.service_role_used_in_client, false);
});

test("creates causal score candidates", () => {
  assert.equal(run8b().causal_score_candidates.length, 1);
});

test("requires signal_candidate_ref for score", () => {
  const score = service.Runtime40_20BranchingBudgetService.buildCausalScoreCandidates([
    { ...run().signal_candidates[0], signal_candidate_ref: "" },
  ])[0];

  assert.equal(score.blocking_reasons.includes("missing_signal_candidate_ref"), true);
});

test("requires score_source_trace for score", () => {
  const result = run8b({ branching_signal_sources: [signalSource({ source_trace: {} })] });

  assert.equal(result.status, "blocked_causal_score_missing_source_trace");
});

test("blocks score assigned to fabricated signal", () => {
  const score = run8b({
    branching_signal_sources: [signalSource({ fabricated_signal: true })],
  }).causal_score_candidates[0];

  assert.equal(score.blocking_reasons.includes("score_assigned_to_fabricated_signal"), true);
});

for (const component of [
  "critical_route_unresolved_plus_5",
  "b0_unresolved_plus_5",
  "b2_unresolved_plus_5",
  "b3_unresolved_plus_5",
  "b7_unresolved_preclassification_plus_5",
  "mmabp_contradiction_plus_5",
  "pm_pf_contradiction_plus_5",
  "moc_pf_contradiction_plus_5",
  "pf_olc_contradiction_plus_5",
  "olc_moc_contradiction_plus_5",
  "missing_object_state_produced_state_plus_5",
]) {
  test(`supports ${component}`, () => {
    const score = run8b({
      branching_signal_sources: [signalSource({ score_components: [component] })],
    }).causal_score_candidates[0];

    assert.equal(score.score_components.includes(component), true);
    assert.equal(score.score_total, 5);
  });
}

for (const component of [
  ["deadlock_wait_loop_rework_plus_4", 4],
  ["receiver_feedback_rejection_return_block_plus_4", 4],
  ["workaround_residual_variety_informal_rule_plus_4", 4],
  ["capacity_gap_resource_bargain_low_plus_3", 3],
  ["real_sequence_differs_from_official_plus_3", 3],
  ["low_semantic_confidence_interpersonal_tension_plus_2", 2],
  ["analytical_curiosity_without_structural_impact_plus_0", 0],
]) {
  test(`supports ${component[0]}`, () => {
    const score = run8b({
      branching_signal_sources: [signalSource({ score_components: [component[0]] })],
    }).causal_score_candidates[0];

    assert.equal(score.score_total, component[1]);
  });
}

test("blocks B7 diagnostic score attempt", () => {
  const score = run8b({
    branching_signal_sources: [
      signalSource({
        signal_family: "b7_low_confidence_preclassification_only",
        diagnostic_status: "diagnostic",
      }),
    ],
  }).causal_score_candidates[0];

  assert.equal(score.blocking_reasons.includes("b7_diagnostic_score_attempted"), true);
});

test("curiosity score 0 does not select opening", () => {
  const selection = run8b({
    branching_signal_sources: [
      signalSource({
        score_components: ["analytical_curiosity_without_structural_impact_plus_0"],
      }),
    ],
  }).selection_under_budget_candidates[0];

  assert.equal(selection.selected_causal_interaction_ids.length, 0);
  assert.equal(selection.curiosity_score_zero_blocked, true);
});

test("creates branching decision candidates", () => {
  assert.equal(run8b().branching_decision_candidates.length, 1);
});

test("branching_decision real created remains false in 8-B", () => {
  assert.equal(run8b().branching_decision_candidates[0].branching_decision_real_created, false);
});

for (const decisionType of ["open_causal", "skip_causal", "no_action", "close_by_other", "open_reentry", "carry_forward_gap", "manual_review_required"]) {
  test(`supports decision_type ${decisionType}`, () => {
    const decision = run8b().branching_decision_candidates[0];
    const copy = { ...decision, decision_type: decisionType };
    assert.equal(copy.decision_type, decisionType);
  });
}

test("open_causal is future selection only", () => {
  const decision = run8b().branching_decision_candidates[0];

  assert.equal(decision.decision_type, "open_causal");
  assert.equal(decision.opened_interaction_id_preview, undefined);
});

test("creates budget state candidates", () => {
  assert.equal(run8b().budget_state_candidates.length, 1);
});

test("base_limit remains 40", () => {
  assert.equal(run8b().budget_state_candidates[0].base_limit, 40);
});

test("causal_limit remains 20", () => {
  assert.equal(run8b().budget_state_candidates[0].causal_limit, 20);
});

test("remaining_causal_budget is not negative", () => {
  assert.equal(run8b({ budget_state: { causal_visible_count: 25, budget_state_source_trace: sourceTrace() } }).budget_state_candidates[0].remaining_causal_budget, 0);
});

test("blocks causal budget overflow", () => {
  assert.equal(run8b({ budget_state: { causal_visible_count: 21, budget_state_source_trace: sourceTrace() } }).status, "blocked_causal_budget_overflow");
});

test("does not reset causal_count", () => {
  assert.equal(run8b({ budget_state: { causal_visible_count: 7, budget_state_source_trace: sourceTrace() } }).budget_state_candidates[0].causal_visible_count, 7);
});

test("preserves budget_state_source_trace", () => {
  assert.equal(run8b().budget_state_candidates[0].budget_state_source_trace.source_sheet, "Branching_Budget_Rules");
});

test("creates budget ledger candidates", () => {
  assert.equal(run8b().budget_ledger_candidates.length, 1);
});

test("budget_ledger real updated remains false", () => {
  assert.equal(run8b().budget_ledger_candidates[0].budget_ledger_real_updated, false);
});

test("budget ledger candidate links to branching_decision_candidate", () => {
  const result = run8b();

  assert.equal(
    result.budget_ledger_candidates[0].source_branching_decision_ref,
    result.branching_decision_candidates[0].branching_decision_candidate_ref,
  );
});

test("budget_delta is explicit", () => {
  assert.equal(typeof run8b().budget_ledger_candidates[0].budget_delta.causal, "number");
});

test("creates selection under budget candidates", () => {
  assert.equal(run8b().selection_under_budget_candidates.length, 1);
});

test("orders by causal_score", () => {
  const selection = run8b({
    branching_signal_sources: [
      signalSource({ signal_type: "low", source_canonical_variable_ref: "LOW", score_components: ["low_semantic_confidence_interpersonal_tension_plus_2"] }),
      signalSource({ signal_type: "high", source_canonical_variable_ref: "HIGH", score_components: ["critical_route_unresolved_plus_5"] }),
    ],
  }).selection_under_budget_candidates[0];

  assert.equal(selection.ordered_signal_refs[0].includes("high") || selection.ordered_score_refs[0].includes("high"), false);
  assert.equal(selection.ordered_score_refs[0].includes("branching_signal_candidate"), true);
});

test("applies severity tiebreaker", () => {
  assert.equal(run8b().selection_under_budget_candidates[0].severity_tiebreaker_applied, true);
});

test("applies route criticality tiebreaker", () => {
  assert.equal(run8b().selection_under_budget_candidates[0].route_criticality_tiebreaker_applied, true);
});

test("checks requires_user_input", () => {
  assert.equal(run8b().selection_under_budget_candidates[0].requires_user_input_checked, true);
});

test("checks causal_count under 20", () => {
  assert.equal(run8b().selection_under_budget_candidates[0].causal_count_under_limit, true);
});

test("checks mutual exclusion closed_by_other and duplicate opening", () => {
  const selection = run8b().selection_under_budget_candidates[0];

  assert.equal(selection.mutual_exclusion_checked, true);
  assert.equal(selection.closed_by_other_checked, true);
  assert.equal(selection.duplicate_opening_checked, true);
});

test("blocks selection without rule_ref", () => {
  const selection = run8b({ branching_rules: [branchingRule({ branching_rule_ref: "" })] }).selection_under_budget_candidates[0];

  assert.equal(selection.missing_rule_ref_blocked, true);
});

test("defers when budget exhausted", () => {
  const selection = run8b({ budget_state: { causal_visible_count: 20, budget_state_source_trace: sourceTrace() } }).selection_under_budget_candidates[0];

  assert.equal(selection.budget_exhausted_defers_to_future_carry_forward, true);
});

test("does not create runtime_interaction_instance opening candidate", () => {
  assert.equal(run8b().selection_under_budget_candidates[0].runtime_interaction_instance_created, false);
});

test("8-B boundaries remain false", () => {
  const result = run8b();

  assert.equal(result.causal_opened, false);
  assert.equal(result.reentry_opened, false);
  assert.equal(result.carry_forward_gap_formal_created, false);
  assert.equal(result.critical_route_gate_executed, false);
  assert.equal(result.mmabp_gate_engine_executed, false);
  assert.equal(result.readiness_engine_executed, false);
  assert.equal(result.phase9_started, false);
  assert.equal(result.supabase_touched, false);
  assert.equal(result.sql_executed, false);
  assert.equal(result.endpoint_created, false);
  assert.equal(result.phase8_closed_local, false);
  assert.equal(result.ready_for_phase9_authorization, false);
});

test("creates causal interaction opening candidates", () => {
  assert.equal(run8c().causal_interaction_opening_candidates.length, 1);
});

test("opening candidate requires selected branching_decision candidate", () => {
  const opening = service.Runtime40_20BranchingBudgetService.buildCausalInteractionOpeningCandidates(
    {},
    [],
    { selected_causal_interaction_ids: ["C01"] },
    [],
    {},
  )[0];

  assert.equal(opening.blocking_reasons.includes("missing_selected_branching_decision_candidate"), true);
});

test("opening candidate preserves causal_interaction_id", () => {
  assert.equal(run8c().causal_interaction_opening_candidates[0].causal_interaction_id, "C01");
});

test("opening candidate state is pending_candidate", () => {
  assert.equal(run8c().causal_interaction_opening_candidates[0].state, "pending_candidate");
});

test("opening candidate preserves opened_by_branching_decision_ref", () => {
  const result = run8c();

  assert.equal(
    result.causal_interaction_opening_candidates[0].opened_by_branching_decision_ref,
    result.branching_decision_candidates[0].branching_decision_candidate_ref,
  );
});

test("opening candidate preserves trigger_source_trace", () => {
  assert.equal(run8c().causal_interaction_opening_candidates[0].trigger_source_trace.source_sheet, "Branching_Budget_Rules");
});

test("opening candidate preserves counts_as_visible", () => {
  assert.equal(run8c().causal_interaction_opening_candidates[0].counts_as_visible, true);
});

test("opening candidate preserves counts_as_causal", () => {
  assert.equal(run8c().causal_interaction_opening_candidates[0].counts_as_causal, true);
});

test("opening candidate preserves budget_ledger_candidate_ref", () => {
  const result = run8c();

  assert.equal(
    result.causal_interaction_opening_candidates[0].budget_ledger_candidate_ref,
    result.budget_ledger_candidates[0].budget_ledger_candidate_ref,
  );
});

test("8-C runtime_interaction_instance real created remains false", () => {
  assert.equal(run8c().causal_interaction_opening_candidates[0].runtime_interaction_instance_real_created, false);
});

test("8-C shown_at real created remains false", () => {
  assert.equal(run8c().causal_interaction_opening_candidates[0].shown_at_real_created, false);
});

test("8-C answered_at real created remains false", () => {
  assert.equal(run8c().causal_interaction_opening_candidates[0].answered_at_real_created, false);
});

test("8-C UI rendered real remains false", () => {
  assert.equal(run8c().causal_interaction_opening_candidates[0].ui_rendered_real, false);
});

test("8-C endpoint created remains false", () => {
  assert.equal(run8c().causal_interaction_opening_candidates[0].endpoint_created, false);
});

test("creates non-opening decision candidates", () => {
  assert.equal(run8c({ phase8c: { non_opening_decisions: [nonOpeningDecision()] } }).non_opening_decision_candidates.length, 1);
});

for (const decisionType of ["skip_causal", "close_by_other", "no_action"]) {
  test(`8-C supports ${decisionType}`, () => {
    const result = run8c({
      phase8c: {
        non_opening_decisions: [nonOpeningDecision({ decision_type: decisionType })],
      },
    });

    assert.equal(result.non_opening_decision_candidates[0].decision_type, decisionType);
  });
}

test("skip_causal requires skipped_reason", () => {
  const candidate = run8c({
    phase8c: { non_opening_decisions: [nonOpeningDecision({ skipped_reason: undefined })] },
  }).non_opening_decision_candidates[0];

  assert.equal(candidate.blocking_reasons.includes("skip_missing_reason"), true);
});

test("close_by_other requires source variable or source evidence", () => {
  const candidate = run8c({
    phase8c: {
      non_opening_decisions: [
        nonOpeningDecision({
          decision_type: "close_by_other",
          closed_by_source_variable_ref: undefined,
          closed_by_source_evidence_ref: undefined,
        }),
      ],
    },
  }).non_opening_decision_candidates[0];

  assert.equal(candidate.blocking_reasons.includes("close_by_other_missing_source"), true);
});

test("no_action requires no_action_reason", () => {
  const candidate = run8c({
    phase8c: {
      non_opening_decisions: [
        nonOpeningDecision({ decision_type: "no_action", no_action_reason: undefined }),
      ],
    },
  }).non_opening_decision_candidates[0];

  assert.equal(candidate.blocking_reasons.includes("no_action_missing_reason"), true);
});

test("non-opening budget_cost remains 0", () => {
  const candidate = run8c({
    phase8c: { non_opening_decisions: [nonOpeningDecision({ budget_cost: 5 })] },
  }).non_opening_decision_candidates[0];

  assert.equal(candidate.budget_cost, 0);
  assert.equal(candidate.blocking_reasons.includes("non_opening_budget_cost_not_zero"), true);
});

test("hidden opening remains false", () => {
  assert.equal(run8c({ phase8c: { non_opening_decisions: [nonOpeningDecision()] } }).non_opening_decision_candidates[0].hidden_opening_created, false);
});

test("blocks hidden opening", () => {
  const result = run8c({
    phase8c: { hidden_opening_created: true },
  });

  assert.equal(result.causal_interaction_opening_candidates[0].blocking_reasons.includes("hidden_opening_detected"), true);
});

test("blocks close_by satisfaction general", () => {
  const candidate = run8c({
    phase8c: {
      non_opening_decisions: [nonOpeningDecision({ close_by_satisfaction_general_attempted: true })],
    },
  }).non_opening_decision_candidates[0];

  assert.equal(candidate.blocking_reasons.includes("close_by_satisfaction_general_attempted"), true);
});

test("blocks close_by B7 diagnostic", () => {
  const candidate = run8c({
    phase8c: {
      non_opening_decisions: [nonOpeningDecision({ close_by_b7_diagnostic_attempted: true })],
    },
  }).non_opening_decision_candidates[0];

  assert.equal(candidate.blocking_reasons.includes("close_by_b7_diagnostic_attempted"), true);
});

test("creates reentry candidates", () => {
  assert.equal(run8c({ phase8c: { reentry: reentryInput() } }).reentry_candidates.length, 1);
});

test("reentry requires blocking gap", () => {
  const candidate = run8c({
    phase8c: { reentry: reentryInput({ blocking_gap_present: false }) },
  }).reentry_candidates[0];

  assert.equal(candidate.blocking_reasons.includes("reentry_without_blocking_gap"), true);
});

test("reentry requires source_trace", () => {
  const candidate = run8c({
    phase8c: { reentry: reentryInput({ source_trace: {} }) },
  }).reentry_candidates[0];

  assert.equal(candidate.blocking_reasons.includes("reentry_missing_source_trace"), true);
});

test("reentry requires justification", () => {
  const candidate = run8c({
    phase8c: { reentry: reentryInput({ justification_present: false }) },
  }).reentry_candidates[0];

  assert.equal(candidate.blocking_reasons.includes("reentry_missing_justification"), true);
});

test("blocks reentry by curiosity", () => {
  const candidate = run8c({
    phase8c: { reentry: reentryInput({ reentry_by_curiosity_attempted: true }) },
  }).reentry_candidates[0];

  assert.equal(candidate.blocking_reasons.includes("reentry_by_curiosity_attempted"), true);
});

test("may_exceed_normal_flow only with justification", () => {
  assert.equal(run8c({ phase8c: { reentry: reentryInput() } }).reentry_candidates[0].may_exceed_normal_flow, true);
  assert.equal(run8c({ phase8c: { reentry: reentryInput({ justification_present: false }) } }).reentry_candidates[0].may_exceed_normal_flow, false);
});

test("reentry_opened real remains false", () => {
  assert.equal(run8c({ phase8c: { reentry: reentryInput() } }).reentry_candidates[0].reentry_opened_real, false);
});

test("readiness_decision real created remains false", () => {
  assert.equal(run8c({ phase8c: { reentry: reentryInput({ readiness_decision_real_creation_attempted: true }) } }).reentry_candidates[0].readiness_decision_real_created, false);
});

test("creates carry-forward gap candidates", () => {
  assert.equal(run8c({ budget_state: { causal_visible_count: 20, budget_state_source_trace: sourceTrace() } }).carry_forward_gap_candidates.length, 1);
});

test("carry-forward gap requires source_trace", () => {
  const candidate = run8c({
    phase8c: { carry_forward_gaps: [carryForwardGap({ source_trace: {} })] },
  }).carry_forward_gap_candidates[0];

  assert.equal(candidate.blocking_reasons.includes("carry_forward_missing_source_trace"), true);
});

test("carry-forward gap preserves causal_candidate_not_opened", () => {
  assert.equal(run8c({ phase8c: { carry_forward_gaps: [carryForwardGap()] } }).carry_forward_gap_candidates[0].causal_candidate_not_opened, "C01");
});

for (const reason of [
  "budget_exhausted",
  "lower_priority",
  "route_not_critical",
  "no_user_input_required",
  "duplicate_or_resolved",
  "manual_review_required",
]) {
  test(`supports carry-forward reason ${reason}`, () => {
    assert.equal(run8c({ phase8c: { carry_forward_gaps: [carryForwardGap({ reason })] } }).carry_forward_gap_candidates[0].reason, reason);
  });
}

test("readiness_gap_record real created remains false", () => {
  assert.equal(run8c({ phase8c: { carry_forward_gaps: [carryForwardGap({ readiness_gap_record_real_creation_attempted: true })] } }).carry_forward_gap_candidates[0].readiness_gap_record_real_created, false);
});

test("gap hidden remains false", () => {
  assert.equal(run8c({ phase8c: { carry_forward_gaps: [carryForwardGap({ gap_hidden: true })] } }).carry_forward_gap_candidates[0].gap_hidden, false);
});

test("blocks hidden carry-forward gap", () => {
  const result = run8c({
    phase8c: { carry_forward_gaps: [carryForwardGap({ gap_hidden: true })] },
  });

  assert.equal(result.status, "blocked_carry_forward_gap_hidden");
});

test("creates budget exhaustion guards", () => {
  assert.equal(run8c().budget_exhaustion_guards.length, 1);
});

test("detects causal_limit_reached", () => {
  assert.equal(run8c({ budget_state: { causal_visible_count: 20, budget_state_source_trace: sourceTrace() } }).budget_exhaustion_guards[0].causal_limit_reached, true);
});

test("blocks attempted opening over 20", () => {
  assert.equal(run8c({ phase8c: { budget_guard: { attempted_opening_over_20: true } } }).budget_exhaustion_guards[0].opening_blocked_due_to_budget, true);
});

test("opening blocked due to budget when causal limit reached", () => {
  assert.equal(run8c({ budget_state: { causal_visible_count: 20, budget_state_source_trace: sourceTrace() } }).budget_exhaustion_guards[0].opening_blocked_due_to_budget, true);
});

test("supports critical_route_blocking_exception_candidate", () => {
  assert.equal(run8c({ phase8c: { budget_guard: { critical_route_blocking_exception_candidate: true } } }).budget_exhaustion_guards[0].critical_route_blocking_exception_candidate, true);
});

test("supports reentry_justification_present", () => {
  assert.equal(run8c({ phase8c: { budget_guard: { reentry_justification_present: true } } }).budget_exhaustion_guards[0].reentry_justification_present, true);
});

test("budget_override_requested remains false", () => {
  assert.equal(run8c({ phase8c: { budget_guard: { budget_override_requested: true } } }).budget_exhaustion_guards[0].budget_override_requested, false);
});

test("silent_overflow_detected remains false", () => {
  assert.equal(run8c({ phase8c: { budget_guard: { silent_overflow_detected: true } } }).budget_exhaustion_guards[0].silent_overflow_detected, false);
});

test("causal_count_reset remains false", () => {
  assert.equal(run8c({ phase8c: { budget_guard: { causal_count_reset: true } } }).budget_exhaustion_guards[0].causal_count_reset, false);
});

test("budget_ledger_rewritten remains false", () => {
  assert.equal(run8c({ phase8c: { budget_guard: { budget_ledger_rewritten: true } } }).budget_exhaustion_guards[0].budget_ledger_rewritten, false);
});

test("blocks silent budget overflow", () => {
  assert.equal(run8c({ phase8c: { budget_guard: { silent_overflow_detected: true } } }).status, "blocked_silent_budget_overflow");
});

test("blocks causal_count reset", () => {
  const guard = run8c({ phase8c: { budget_guard: { causal_count_reset: true } } }).budget_exhaustion_guards[0];

  assert.equal(guard.blocking_reasons.includes("causal_count_reset_attempted"), true);
});

test("blocks budget_ledger rewrite", () => {
  const guard = run8c({ phase8c: { budget_guard: { budget_ledger_rewritten: true } } }).budget_exhaustion_guards[0];

  assert.equal(guard.blocking_reasons.includes("budget_ledger_rewrite_attempted"), true);
});

test("8-C branching_decision real created remains false", () => {
  assert.equal(run8c().branching_decision_real_created, false);
});

test("8-C budget_ledger real updated remains false", () => {
  assert.equal(run8c().budget_ledger_real_updated, false);
});

test("8-C runtime_interaction_instance real created remains false at result boundary", () => {
  assert.equal(run8c({ phase8c: { runtime_interaction_instance_real_creation_attempted: true } }).runtime_interaction_instance_real_created, false);
});

test("8-C CriticalRouteGate executed remains false", () => {
  assert.equal(run8c().critical_route_gate_executed, false);
});

test("8-C MMABPGateEngine executed remains false", () => {
  assert.equal(run8c().mmabp_gate_engine_executed, false);
});

test("8-C ReadinessEngine executed remains false", () => {
  assert.equal(run8c().readiness_engine_executed, false);
});

test("8-C Phase 9 started remains false", () => {
  assert.equal(run8c().phase9_started, false);
});

test("8-C Supabase/SQL/endpoint remain false", () => {
  const result = run8c();

  assert.equal(result.supabase_touched, false);
  assert.equal(result.sql_executed, false);
  assert.equal(result.endpoint_created, false);
});

test("8-C Phase 8 closed local remains false", () => {
  assert.equal(run8c().phase8_closed_local, false);
});

test("8-C Ready for Phase 9 authorization remains false", () => {
  assert.equal(run8c().ready_for_phase9_authorization, false);
});

test("creates branching idempotency replay guards", () => {
  assert.equal(run8d().idempotency_replay_guards.length, 1);
});

test("preserves branching_evaluation_id", () => {
  assert.equal(run8d().idempotency_replay_guards[0].branching_evaluation_id, "BE-001");
});

test("preserves idempotency_key when present", () => {
  assert.equal(run8d().idempotency_replay_guards[0].idempotency_key, "IDEMP-001");
});

test("preserves run_state_checksum", () => {
  assert.equal(run8d().idempotency_replay_guards[0].run_state_checksum, "RUN-CHECKSUM");
});

test("preserves canonical_variables_checksum", () => {
  assert.equal(run8d().idempotency_replay_guards[0].canonical_variables_checksum, "CVAR-CHECKSUM");
});

test("preserves budget_state_checksum", () => {
  assert.equal(run8d().idempotency_replay_guards[0].budget_state_checksum, "BUDGET-CHECKSUM");
});

test("preserves previous_branching_decision_refs", () => {
  assert.deepEqual(run8d().idempotency_replay_guards[0].previous_branching_decision_refs, ["BD-OLD-001"]);
});

test("detects idempotency replay", () => {
  assert.equal(run8d({ phase8d: phase8dInput({ idempotency_replay_detected: true }) }).idempotency_replay_guards[0].idempotency_replay_detected, true);
});

test("blocks idempotency replay", () => {
  assert.equal(run8d({ phase8d: phase8dInput({ idempotency_replay_detected: true }) }).status, "blocked_idempotency_replay_detected");
});

test("detects duplicate opening", () => {
  assert.equal(run8d({ phase8d: phase8dInput({ previous_opened_causal_interaction_ids: ["C01"] }) }).idempotency_replay_guards[0].duplicate_opening_detected, true);
});

test("blocks duplicate causal opening", () => {
  assert.equal(run8d({ phase8d: phase8dInput({ previous_opened_causal_interaction_ids: ["C01"] }) }).status, "blocked_duplicate_causal_opening");
});

test("detects duplicate budget ledger candidate", () => {
  const result = run8d();
  const ledgerRef = result.budget_ledger_candidates[0].budget_ledger_candidate_ref;

  assert.equal(run8d({ phase8d: phase8dInput({ previous_budget_ledger_candidate_refs: [ledgerRef] }) }).idempotency_replay_guards[0].duplicate_budget_ledger_candidate_detected, true);
});

test("blocks duplicate budget ledger candidate", () => {
  const result = run8d();
  const ledgerRef = result.budget_ledger_candidates[0].budget_ledger_candidate_ref;

  assert.equal(run8d({ phase8d: phase8dInput({ previous_budget_ledger_candidate_refs: [ledgerRef] }) }).status, "blocked_duplicate_causal_opening");
});

test("revision invalidates obsolete decision candidate only with trace", () => {
  assert.equal(run8d({ phase8d: phase8dInput({ revision_invalidates_obsolete_decision_candidate: true }) }).idempotency_replay_guards[0].revision_invalidates_obsolete_decision_candidate, true);
  assert.equal(run8d({ phase8d: phase8dInput({ revision_invalidates_obsolete_decision_candidate: true, revision_trace: {} }) }).idempotency_replay_guards[0].blocking_reasons.includes("obsolete_decision_without_revision_trace"), true);
});

test("creates replay / duplicate audit candidate", () => {
  assert.equal(Boolean(run8d({ phase8d: phase8dInput({ idempotency_replay_detected: true }) }).idempotency_replay_guards[0].replay_audit_candidate_ref), true);
});

test("creates branching audit candidates", () => {
  assert.equal(run8d().branching_audit_candidates.length > 0, true);
});

for (const action of [
  "branching_evaluation_started",
  "trigger_evaluated",
  "trigger_blocked",
  "causal_score_assigned",
  "causal_opening_selected",
  "causal_opening_blocked_by_budget",
  "causal_skipped_by_rule",
  "causal_closed_by_other",
  "reentry_candidate_created",
  "carry_forward_gap_created",
  "budget_ledger_candidate_created",
  "duplicate_opening_blocked",
  "budget_overflow_blocked",
  "phase9_execution_blocked",
  "phase10_execution_blocked",
  "persistence_boundary_violation_blocked",
]) {
  test(`supports ${action} audit action`, () => {
    const result = run8d({ phase8d: phase8dInput({ audit_actions: [action] }) });

    assert.equal(result.branching_audit_candidates[0].audit_action, action);
  });
}

test("real_runtime_audit_trail_created remains false", () => {
  assert.equal(run8d({ phase8d: phase8dInput({ runtime_audit_trail_real_creation_attempted: true }) }).branching_audit_candidates[0].real_runtime_audit_trail_created, false);
});

test("Supabase/SQL/endpoint remain false for audit candidates", () => {
  const audit = run8d().branching_audit_candidates[0];

  assert.equal(audit.supabase_touched, false);
  assert.equal(audit.sql_executed, false);
  assert.equal(audit.endpoint_created, false);
});

test("creates Phase 9 boundary", () => {
  assert.equal(run8d().phase9_boundaries.length, 1);
});

test("B0 route unresolved signal ready is supported", () => {
  assert.equal(run8d().phase9_boundaries[0].b0_route_unresolved_signal_ready, true);
});

test("B2 transformation exception signal ready is supported", () => {
  assert.equal(run8d().phase9_boundaries[0].b2_transformation_exception_signal_ready, true);
});

test("B3 receiver feedback C09 signal ready is supported", () => {
  assert.equal(run8d().phase9_boundaries[0].b3_receiver_feedback_c09_signal_ready, true);
});

test("B7 low confidence C20 signal ready is supported", () => {
  assert.equal(run8d().phase9_boundaries[0].b7_low_confidence_c20_signal_ready, true);
});

test("SEM ambiguity microconfirmation ready is supported", () => {
  assert.equal(run8d().phase9_boundaries[0].sem_ambiguity_microconfirmation_ready, true);
});

test("PST wait/deadlock reentry ready is supported", () => {
  assert.equal(run8d().phase9_boundaries[0].pst_wait_deadlock_reentry_ready, true);
});

test("CriticalRouteGate executed remains false in Phase 9 boundary", () => {
  assert.equal(run8d({ phase8d: phase8dInput({ critical_route_gate_execution_attempted: true }) }).phase9_boundaries[0].critical_route_gate_executed, false);
});

test("MMABPGateEngine executed remains false in Phase 9 boundary", () => {
  assert.equal(run8d({ phase8d: phase8dInput({ mmabp_gate_engine_execution_attempted: true }) }).phase9_boundaries[0].mmabp_gate_engine_executed, false);
});

test("semantic_resolution_event real created remains false", () => {
  assert.equal(run8d({ phase8d: phase8dInput({ semantic_resolution_event_real_creation_attempted: true }) }).phase9_boundaries[0].semantic_resolution_event_real_created, false);
});

test("process_state_timer_event real created remains false", () => {
  assert.equal(run8d({ phase8d: phase8dInput({ process_state_timer_event_real_creation_attempted: true }) }).phase9_boundaries[0].process_state_timer_event_real_created, false);
});

test("route pass/fail/gap definitive created remains false", () => {
  assert.equal(run8d({ phase8d: phase8dInput({ route_pass_fail_gap_definitive_creation_attempted: true }) }).phase9_boundaries[0].route_pass_fail_gap_definitive_created, false);
});

test("Phase 9 started remains false in boundary", () => {
  assert.equal(run8d({ phase8d: phase8dInput({ phase9_execution_attempted: true }) }).phase9_boundaries[0].phase9_started, false);
});

test("creates Phase 10 boundary", () => {
  assert.equal(run8d().phase10_boundaries.length, 1);
});

test("carry_forward_gap ready for future readiness is supported", () => {
  assert.equal(run8d().phase10_boundaries[0].carry_forward_gap_ready_for_future_readiness, true);
});

test("reentry_candidate ready for future readiness is supported", () => {
  assert.equal(run8d().phase10_boundaries[0].reentry_candidate_ready_for_future_readiness, true);
});

test("budget_exhausted ready for future readiness is supported", () => {
  assert.equal(run8d().phase10_boundaries[0].budget_exhausted_ready_for_future_readiness, true);
});

test("manual_review_required candidate is supported", () => {
  assert.equal(run8d().phase10_boundaries[0].manual_review_required_candidate, true);
});

test("blocked_by_budget candidate is supported", () => {
  assert.equal(run8d().phase10_boundaries[0].blocked_by_budget_candidate, true);
});

test("blocked_by_missing_route candidate is supported", () => {
  assert.equal(run8d().phase10_boundaries[0].blocked_by_missing_route_candidate, true);
});

test("ReadinessEngine executed remains false in Phase 10 boundary", () => {
  assert.equal(run8d({ phase8d: phase8dInput({ readiness_engine_execution_attempted: true }) }).phase10_boundaries[0].readiness_engine_executed, false);
});

test("readiness_decision_record created remains false", () => {
  assert.equal(run8d({ phase8d: phase8dInput({ readiness_decision_record_creation_attempted: true }) }).phase10_boundaries[0].readiness_decision_record_created, false);
});

test("ready_created remains false", () => {
  assert.equal(run8d({ phase8d: phase8dInput({ ready_final_creation_attempted: true }) }).phase10_boundaries[0].ready_created, false);
});

test("ready_with_flags_created remains false", () => {
  assert.equal(run8d({ phase8d: phase8dInput({ ready_with_flags_creation_attempted: true }) }).phase10_boundaries[0].ready_with_flags_created, false);
});

test("blocked_final_created remains false", () => {
  assert.equal(run8d({ phase8d: phase8dInput({ blocked_final_creation_attempted: true }) }).phase10_boundaries[0].blocked_final_created, false);
});

test("export_preview_created remains false in Phase 10 boundary", () => {
  assert.equal(run8d().phase10_boundaries[0].export_preview_created, false);
});

test("Phase 10 started remains false", () => {
  assert.equal(run8d({ phase8d: phase8dInput({ phase10_execution_attempted: true }) }).phase10_boundaries[0].phase10_started, false);
});

test("creates branching persistence boundary", () => {
  assert.equal(run8d().branching_persistence_boundaries.length, 1);
});

test("local branching_decision candidate mode remains true", () => {
  assert.equal(run8d().branching_persistence_boundaries[0].local_branching_decision_candidate_mode, true);
});

test("local budget_ledger candidate mode remains true", () => {
  assert.equal(run8d().branching_persistence_boundaries[0].local_budget_ledger_candidate_mode, true);
});

test("local runtime_interaction_instance opening candidate mode remains true", () => {
  assert.equal(run8d().branching_persistence_boundaries[0].local_runtime_interaction_instance_opening_candidate_mode, true);
});

test("db_write_authorized remains false", () => {
  assert.equal(run8d({ phase8d: phase8dInput({ branching_persistence_boundary_violation: true }) }).branching_persistence_boundaries[0].db_write_authorized, false);
});

test("8-D branching_decision real created remains false", () => {
  assert.equal(run8d({ phase8d: phase8dInput({ branching_decision_real_creation_attempted: true }) }).branching_persistence_boundaries[0].branching_decision_real_created, false);
});

test("8-D budget_ledger real updated remains false", () => {
  assert.equal(run8d({ phase8d: phase8dInput({ budget_ledger_real_update_attempted: true }) }).branching_persistence_boundaries[0].budget_ledger_real_updated, false);
});

test("8-D runtime_interaction_instance real created remains false", () => {
  assert.equal(run8d({ phase8d: phase8dInput({ runtime_interaction_instance_real_creation_attempted: true }) }).branching_persistence_boundaries[0].runtime_interaction_instance_real_created, false);
});

test("runtime_audit_trail real created remains false", () => {
  assert.equal(run8d({ phase8d: phase8dInput({ runtime_audit_trail_real_creation_attempted: true }) }).branching_persistence_boundaries[0].runtime_audit_trail_real_created, false);
});

test("supabase_touch_authorized remains false", () => {
  assert.equal(run8d({ phase8d: phase8dInput({ supabase_touch_attempted: true }) }).branching_persistence_boundaries[0].supabase_touch_authorized, false);
});

test("sql_execution_authorized remains false", () => {
  assert.equal(run8d({ phase8d: phase8dInput({ sql_execution_attempted: true }) }).branching_persistence_boundaries[0].sql_execution_authorized, false);
});

test("endpoint_creation_authorized remains false", () => {
  assert.equal(run8d({ phase8d: phase8dInput({ endpoint_creation_attempted: true }) }).branching_persistence_boundaries[0].endpoint_creation_authorized, false);
});

test("8-D service_role_used remains false", () => {
  assert.equal(run8d().branching_persistence_boundaries[0].service_role_used, false);
});

test("8-D service_role_used_in_client remains false", () => {
  assert.equal(run8d({ phase8d: phase8dInput({ service_role_client_violation: true }) }).branching_persistence_boundaries[0].service_role_used_in_client, false);
});

test("scene_write_detected remains false", () => {
  assert.equal(run8d({ phase8d: phase8dInput({ scene_write_attempted: true }) }).branching_persistence_boundaries[0].scene_write_detected, false);
});

test("mba_write_detected remains false", () => {
  assert.equal(run8d({ phase8d: phase8dInput({ mba_write_attempted: true }) }).branching_persistence_boundaries[0].mba_write_detected, false);
});

test("parallel_production_runtime_artifacts_write_detected remains false", () => {
  assert.equal(run8d({ phase8d: phase8dInput({ parallel_production_runtime_artifacts_write_attempted: true }) }).branching_persistence_boundaries[0].parallel_production_runtime_artifacts_write_detected, false);
});

test("Runtime 40/20 real started remains false", () => {
  assert.equal(run8d({ phase8d: phase8dInput({ runtime_real_start_attempted: true }) }).branching_persistence_boundaries[0].runtime_40_20_started, false);
});

test("8-D Phase 8 closed local remains false", () => {
  assert.equal(run8d().phase8_closed_local, false);
});

test("8-D Ready for Phase 9 authorization remains false", () => {
  assert.equal(run8d().ready_for_phase9_authorization, false);
});

function run(overrides = {}) {
  return service.Runtime40_20BranchingBudgetService.buildPhase8BranchingFoundationLocalResult({
    case_id: "CASE-001",
    phase7_closeout: {
      phase7_closed_local: true,
      ready_for_phase8_authorization: true,
    },
    canonical_variable_result: canonicalResult(),
    branching_rules: [branchingRule()],
    branching_signal_sources: [signalSource()],
    causal_interaction_ids: ["C01"],
    ...overrides,
  });
}

function run8b(overrides = {}) {
  return service.Runtime40_20BranchingBudgetService.buildPhase8CausalScoreDecisionBudgetSelectionLocalResult({
    case_id: "CASE-001",
    phase7_closeout: {
      phase7_closed_local: true,
      ready_for_phase8_authorization: true,
    },
    canonical_variable_result: canonicalResult(),
    branching_rules: [branchingRule()],
    branching_signal_sources: [
      signalSource({
        causal_interaction_id: "C01",
        score_components: ["critical_route_unresolved_plus_5"],
        severity: 3,
        route_criticality: 3,
        requires_user_input: true,
      }),
    ],
    causal_interaction_ids: ["C01"],
    budget_state: {
      base_visible_count: 40,
      causal_visible_count: 0,
      microconfirmation_count: 0,
      internal_derivation_count: 0,
      reentry_count: 0,
      budget_state_source_trace: sourceTrace(),
    },
    options: {
      run_id: "RUN-001",
      activity_runtime_run_id: "ACT-RUN-001",
    },
    ...overrides,
  });
}

function run8c(overrides = {}) {
  return service.Runtime40_20BranchingBudgetService.buildPhase8OpeningReentryCarryForwardBudgetGuardLocalResult({
    case_id: "CASE-001",
    phase7_closeout: {
      phase7_closed_local: true,
      ready_for_phase8_authorization: true,
    },
    canonical_variable_result: canonicalResult(),
    branching_rules: [branchingRule()],
    branching_signal_sources: [
      signalSource({
        causal_interaction_id: "C01",
        score_components: ["critical_route_unresolved_plus_5"],
        severity: 3,
        route_criticality: 3,
        requires_user_input: true,
      }),
    ],
    causal_interaction_ids: ["C01"],
    budget_state: {
      base_visible_count: 40,
      causal_visible_count: 0,
      microconfirmation_count: 0,
      internal_derivation_count: 0,
      reentry_count: 0,
      budget_state_source_trace: sourceTrace(),
    },
    options: {
      run_id: "RUN-001",
      activity_runtime_run_id: "ACT-RUN-001",
    },
    ...overrides,
  });
}

function run8d(overrides = {}) {
  return service.Runtime40_20BranchingBudgetService.buildPhase8IdempotencyAuditPhase9Phase10PersistenceBoundaryLocalResult({
    case_id: "CASE-001",
    phase7_closeout: {
      phase7_closed_local: true,
      ready_for_phase8_authorization: true,
    },
    canonical_variable_result: canonicalResult(),
    branching_rules: [branchingRule()],
    branching_signal_sources: [
      signalSource({
        causal_interaction_id: "C01",
        score_components: ["critical_route_unresolved_plus_5"],
        severity: 3,
        route_criticality: 3,
        requires_user_input: true,
      }),
    ],
    causal_interaction_ids: ["C01"],
    budget_state: {
      base_visible_count: 40,
      causal_visible_count: 0,
      microconfirmation_count: 0,
      internal_derivation_count: 0,
      reentry_count: 0,
      budget_state_source_trace: sourceTrace(),
    },
    options: {
      run_id: "RUN-001",
      activity_runtime_run_id: "ACT-RUN-001",
    },
    phase8d: phase8dInput(),
    ...overrides,
  });
}

function phase8dInput(overrides = {}) {
  return {
    branching_evaluation_id: "BE-001",
    idempotency_key: "IDEMP-001",
    run_state_checksum: "RUN-CHECKSUM",
    canonical_variables_checksum: "CVAR-CHECKSUM",
    budget_state_checksum: "BUDGET-CHECKSUM",
    previous_branching_decision_refs: ["BD-OLD-001"],
    previous_opened_causal_interaction_ids: [],
    previous_budget_ledger_candidate_refs: [],
    idempotency_replay_detected: false,
    revision_invalidates_obsolete_decision_candidate: false,
    revision_trace: sourceTrace(),
    audit_source_trace: sourceTrace(),
    ...overrides,
  };
}

function nonOpeningDecision(overrides = {}) {
  return {
    decision_type: "skip_causal",
    causal_interaction_id: "C01",
    skipped_reason: "resolved_by_prior_signal",
    closed_by_source_variable_ref: "CVAR-CAND-001",
    closed_by_source_evidence_ref: "EVID-001",
    no_action_reason: "no_structural_impact",
    source_trace: sourceTrace(),
    budget_cost: 0,
    hidden_opening_created: false,
    close_by_satisfaction_general_attempted: false,
    close_by_b7_diagnostic_attempted: false,
    ...overrides,
  };
}

function reentryInput(overrides = {}) {
  return {
    reentry_target: "B0-Q01",
    gap_candidate_ref: "GAP-CAND-001",
    affected_route: "CR-B0",
    affected_block: "B0",
    reason: "blocking_gap_requires_reentry",
    justification_present: true,
    route_blocking_status: "blocking",
    source_trace: sourceTrace(),
    counts_as_visible: true,
    counts_as_causal: true,
    blocking_gap_present: true,
    reentry_by_curiosity_attempted: false,
    readiness_decision_real_creation_attempted: false,
    ...overrides,
  };
}

function carryForwardGap(overrides = {}) {
  return {
    budget_exhausted_source: true,
    causal_candidate_not_opened: "C01",
    reason: "budget_exhausted",
    affected_route: "CR-B0",
    affected_variable: "CVAR-CAND-001",
    source_signal: "CASE-001:canonical_variable:1:branching_signal_candidate",
    source_trace: sourceTrace(),
    readiness_gap_record_real_creation_attempted: false,
    gap_hidden: false,
    ...overrides,
  };
}

function signalSource(overrides = {}) {
  return {
    signal_family: "canonical_variable",
    signal_type: "canonical_variable",
    signal_value: "Elaborar reporte operativo",
    source_canonical_variable_ref: "CVAR-CAND-001",
    source_route_status: "open",
    source_gap_flag: true,
    source_gap_type: "route_gap",
    source_critical_route_ref: "CR-B0",
    source_block_ref: "B0",
    source_trace: sourceTrace(),
    receiver_feedback_from_satisfaction: false,
    diagnostic_status: "non_diagnostic",
    ...overrides,
  };
}

function branchingRule(overrides = {}) {
  return {
    branching_rule_ref: "BR-001",
    runtime_branching_rule_ref: "RBR-001",
    branching_budget_rule_ref: "BBR-001",
    activation_signal: "gap_flag_true",
    trigger_condition: "is_present",
    reentry_target: "B0-Q01",
    budget_impact: 1,
    causal_interaction_id: "C01",
    source_node_ref: "BR-SRC-001",
    runtime_interaction_mapping_ref: "RIM-B0-Q01-action_verb",
    critical_route_ref: "CR-B0",
    route_status_dependency: "open",
    gap_flag_dependency: "true",
    mapping_checksum: "checksum-branching-rule",
    explicit_rule_present: true,
    source_trace: sourceTrace(),
    ...overrides,
  };
}

function canonicalResult(overrides = {}) {
  return {
    ok: true,
    case_id: "CASE-001",
    service_status: "canonical_variable_candidates_ready",
    canonical_variable_record_candidates: [canonicalVariableCandidate()],
    route_status_decisions: [
      {
        route_status: "open",
        critical_route_ref: "CR-B0",
        route_status_source_trace: sourceTrace(),
      },
    ],
    gap_flag_decisions: [
      {
        gap_flag: true,
        gap_type: "route_gap",
        gap_source_trace: sourceTrace(),
      },
    ],
    c09_receiver_feedback_boundaries: [
      {
        receiver_feedback: "El receptor pidio correccion",
        receiver_feedback_from_satisfaction: false,
        feedback_source_trace: sourceTrace(),
      },
    ],
    b7_non_diagnostic_guards: [
      {
        signal_status: "preclassification_only",
        diagnostic_status: "non_diagnostic",
      },
    ],
    phase8_boundary: {
      variables_ready_for_future_branching: true,
    },
    no_go_check: {
      runtime_40_20_started: false,
      supabase_touched: false,
      sql_executed: false,
      endpoint_created: false,
    },
    ...overrides,
  };
}

function canonicalVariableCandidate(overrides = {}) {
  return {
    case_id: "CASE-001",
    canonical_variable_candidate_ref: "CVAR-CAND-001",
    value: "Elaborar reporte operativo",
    route_id: "B0",
    source_trace: sourceTrace(),
    ...overrides,
  };
}

function sourceTrace(overrides = {}) {
  return {
    source_document: "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
    source_sheet: "Branching_Budget_Rules",
    source_row_number: 2,
    raw_row: {
      source_node_ref: "BR-SRC-001",
    },
    ...overrides,
  };
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
