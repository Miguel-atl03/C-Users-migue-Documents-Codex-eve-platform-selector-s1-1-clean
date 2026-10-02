import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const service = loadModule("runtime-40-20-readiness-reentry-service.ts", {
  "./runtime-40-20-readiness-reentry-types": {},
});

test("starts Phase 10 locally only when Phase 9 is closed local", () => {
  const result = run();

  assert.equal(result.phase10_input_revalidation.phase9_closed_local, true);
  assert.equal(result.phase10_input_revalidation.phase10_started_local, true);
});

test("blocks Phase 10 if phase9_closed_local=false", () => {
  const result = run({ phase9_closeout: { phase9_closed_local: false } });

  assert.equal(result.status, "blocked_phase9_not_closed");
  assert.equal(result.phase10_started_local, false);
});

test("blocks Phase 10 if ready_for_phase10_authorization=false", () => {
  const result = run({ phase9_closeout: { ready_for_phase10_authorization: false } });

  assert.equal(result.status, "blocked_phase10_not_authorized");
  assert.equal(result.phase10_started_local, false);
});

test("creates phase10_input_revalidation decision", () => {
  assert.equal(Boolean(run().phase10_input_revalidation), true);
});

test("consumes critical_route_gate_result candidates", () => {
  assert.equal(run().phase10_input_revalidation.critical_route_gate_result_candidates_available, true);
});

test("consumes semantic_resolution_event candidates", () => {
  assert.equal(run().phase10_input_revalidation.semantic_resolution_event_candidates_available, true);
});

test("consumes process_state_timer_event candidates", () => {
  assert.equal(run().phase10_input_revalidation.process_state_timer_event_candidates_available, true);
});

test("consumes readiness_gap_record candidates", () => {
  assert.equal(run().phase10_input_revalidation.readiness_gap_record_candidates_available, true);
});

test("consumes runtime_audit_trail gate candidates", () => {
  assert.equal(run().phase10_input_revalidation.runtime_audit_trail_gate_candidates_available, true);
});

test("consumes gate_outcome_readiness_boundary", () => {
  assert.equal(run().phase10_input_revalidation.gate_outcome_readiness_boundary_available, true);
});

test("consumes Object Inventory boundary", () => {
  assert.equal(run().phase10_input_revalidation.object_inventory_boundary_available, true);
});

test("consumes Integration Membrane / Control Plane boundary", () => {
  assert.equal(run().phase10_input_revalidation.integration_membrane_control_plane_boundary_available, true);
});

test("consumes persistence boundary", () => {
  assert.equal(run().phase10_input_revalidation.persistence_boundary_available, true);
});

test("does not recalculate critical gates", () => {
  assert.equal(run().phase10_input_revalidation.critical_gates_recalculated, false);
});

test("does not modify Phase 9", () => {
  assert.equal(run().phase10_input_revalidation.phase9_modified, false);
});

test("does not start Phase 11", () => {
  assert.equal(run().phase10_input_revalidation.phase11_started, false);
  assert.equal(run().phase11_started, false);
});

test("creates ReadinessEngine evaluation candidates", () => {
  assert.equal(run().readiness_engine_evaluation_candidates.length, 1);
});

test("ReadinessEngine evaluation requires source_trace", () => {
  const candidate = run({
    readiness_engine_evaluation_sources: [engineSource({ source_trace: {} })],
  }).readiness_engine_evaluation_candidates[0];

  assert.equal(candidate.candidate_allowed, false);
  assert.equal(candidate.blocking_reasons.includes("missing_source_trace"), true);
});

test("ReadinessEngine real executed remains false", () => {
  assert.equal(run().readiness_engine_real_executed, false);
  assert.equal(run().readiness_engine_evaluation_candidates[0].readiness_engine_real_executed, false);
});

test("readiness_decision_record real created remains false", () => {
  assert.equal(run().readiness_decision_record_real_created, false);
});

test("ready final created remains false", () => {
  assert.equal(run().ready_final_created, false);
});

test("ready_with_flags final created remains false", () => {
  assert.equal(run().ready_with_flags_final_created, false);
});

test("blocked final created remains false", () => {
  assert.equal(run().blocked_final_created, false);
});

test("manual_review_request real created remains false", () => {
  assert.equal(run().manual_review_request_real_created, false);
});

test("reentry_interactions real created remains false", () => {
  assert.equal(run().reentry_interactions_real_created, false);
});

test("export-preview created remains false", () => {
  assert.equal(run().export_preview_created, false);
});

test("Produccion Paralela started remains false", () => {
  assert.equal(run().produccion_paralela_started, false);
});

test("creates readiness rule source contracts", () => {
  assert.equal(run().readiness_rule_source_contracts.length, 1);
});

test("Rule source requires rule_id", () => {
  const contract = run({ readiness_rule_source_inputs: [ruleSource({ rule_id: "" })] })
    .readiness_rule_source_contracts[0];

  assert.equal(contract.rule_candidate_allowed, false);
  assert.equal(contract.blocking_reasons.includes("missing_readiness_rule"), true);
});

test("Rule source requires readiness_state", () => {
  const contract = run({ readiness_rule_source_inputs: [ruleSource({ readiness_state: "" })] })
    .readiness_rule_source_contracts[0];

  assert.equal(contract.blocking_reasons.includes("missing_readiness_state"), true);
});

test("Rule source requires source_trace", () => {
  const contract = run({ readiness_rule_source_inputs: [ruleSource({ source_trace: {} })] })
    .readiness_rule_source_contracts[0];

  assert.equal(contract.blocking_reasons.includes("missing_source_trace"), true);
});

test("Rule blocks readiness from free narrative", () => {
  const contract = run({
    readiness_rule_source_inputs: [ruleSource({ readiness_from_free_narrative_attempted: true })],
  }).readiness_rule_source_contracts[0];

  assert.equal(contract.readiness_from_free_narrative, false);
  assert.equal(contract.blocking_reasons.includes("readiness_from_free_narrative_attempted"), true);
});

test("Rule blocks readiness from causal score only", () => {
  const contract = run({
    readiness_rule_source_inputs: [ruleSource({ readiness_from_causal_score_only_attempted: true })],
  }).readiness_rule_source_contracts[0];

  assert.equal(contract.readiness_from_causal_score_only, false);
  assert.equal(contract.blocking_reasons.includes("readiness_from_causal_score_only_attempted"), true);
});

test("Rule blocks readiness from B7/C20 preclassification only", () => {
  const contract = run({
    readiness_rule_source_inputs: [
      ruleSource({ readiness_from_b7_c20_preclassification_only_attempted: true }),
    ],
  }).readiness_rule_source_contracts[0];

  assert.equal(contract.readiness_from_b7_c20_preclassification_only, false);
  assert.equal(
    contract.blocking_reasons.includes("readiness_from_b7_c20_preclassification_only_attempted"),
    true,
  );
});

test("Rule requires explicit rule", () => {
  assert.equal(run().readiness_rule_source_contracts[0].explicit_rule_required, true);
});

test("creates readiness state model candidates", () => {
  assert.equal(run().readiness_state_model_candidates.length, 1);
});

test("supports ready state", () => {
  assert.equal(run().readiness_state_model_candidates[0].allowed_states.includes("ready"), true);
});

test("supports ready_with_flags state", () => {
  assert.equal(run().readiness_state_model_candidates[0].allowed_states.includes("ready_with_flags"), true);
});

test("supports blocked_by_missing_evidence state", () => {
  assert.equal(
    run().readiness_state_model_candidates[0].allowed_states.includes("blocked_by_missing_evidence"),
    true,
  );
});

test("supports blocked_by_contradiction state", () => {
  assert.equal(
    run().readiness_state_model_candidates[0].allowed_states.includes("blocked_by_contradiction"),
    true,
  );
});

test("supports blocked_by_missing_canonical_route state", () => {
  assert.equal(
    run().readiness_state_model_candidates[0].allowed_states.includes("blocked_by_missing_canonical_route"),
    true,
  );
});

test("supports manual_review_required state", () => {
  assert.equal(
    run().readiness_state_model_candidates[0].allowed_states.includes("manual_review_required"),
    true,
  );
});

test("supports reentry_required state", () => {
  assert.equal(run().readiness_state_model_candidates[0].allowed_states.includes("reentry_required"), true);
});

test("blocks invented readiness state", () => {
  const model = run({
    readiness_state_model_inputs: [
      stateModelSource({ allowed_states: ["ready", "blocked"] }),
    ],
  }).readiness_state_model_candidates[0];

  assert.equal(model.readiness_state_candidate_allowed, false);
  assert.equal(model.blocking_reasons.includes("invented_readiness_state"), true);
});

test("does not normalize blocked_* to generic blocked in 10-A", () => {
  const states = run().readiness_state_model_candidates[0].allowed_states;

  assert.equal(states.includes("blocked_by_missing_evidence"), true);
  assert.equal(states.includes("blocked_by_contradiction"), true);
  assert.equal(states.includes("blocked_by_missing_canonical_route"), true);
  assert.equal(states.includes("blocked"), false);
});

test("does not mix manual_review_required with reentry_required", () => {
  const candidate = run().readiness_engine_evaluation_candidates[0];

  assert.equal(candidate.manual_review_required, true);
  assert.equal(candidate.reentry_required, false);
});

test("does not convert ready_with_flags into ready", () => {
  const candidate = run({
    readiness_engine_evaluation_sources: [engineSource({ readiness_state_candidate: "ready_with_flags" })],
  }).readiness_engine_evaluation_candidates[0];

  assert.equal(candidate.readiness_state_candidate, "ready_with_flags");
});

test("does not convert blocked into flag", () => {
  const candidate = run({
    readiness_engine_evaluation_sources: [
      engineSource({
        readiness_state_candidate: "blocked_by_missing_evidence",
        readiness_flags: [],
      }),
    ],
  }).readiness_engine_evaluation_candidates[0];

  assert.equal(candidate.readiness_state_candidate, "blocked_by_missing_evidence");
  assert.deepEqual(candidate.readiness_flags, []);
});

test("Supabase touched remains false", () => {
  assert.equal(run().supabase_touched, false);
});

test("SQL executed remains false", () => {
  assert.equal(run().sql_executed, false);
});

test("Endpoint created remains false", () => {
  assert.equal(run().endpoint_created, false);
});

test("service_role used remains false", () => {
  assert.equal(run().service_role_used, false);
});

test("Object Inventory created remains false", () => {
  assert.equal(run().object_inventory_created, false);
});

test("mba_* write detected remains false", () => {
  assert.equal(run().mba_write_detected, false);
});

test("scene_* write detected remains false", () => {
  assert.equal(run().scene_write_detected, false);
});

test("parallel_production_runtime_artifacts write detected remains false", () => {
  assert.equal(run().parallel_production_runtime_artifacts_write_detected, false);
});

test("Diagnosis / IR / registry remain false", () => {
  const result = run();

  assert.equal(result.diagnosis_created, false);
  assert.equal(result.ir_created, false);
  assert.equal(result.registry_created, false);
});

test("Phase 10 closed local remains false", () => {
  assert.equal(run().phase10_closed_local, false);
});

test("Ready for Phase 11 authorization remains false", () => {
  assert.equal(run().ready_for_phase11_authorization, false);
});

test("creates ready decision candidates", () => {
  assert.equal(run().ready_decision_candidates.length, 1);
});

test("Ready candidate requires all critical routes closed", () => {
  assert.equal(
    run({ ready_decision_sources: [readySource({ all_critical_routes_closed: false })] })
      .ready_decision_candidates[0].blocking_reasons.includes("critical_route_missing"),
    true,
  );
});

test("Ready candidate requires no blocking gap", () => {
  assert.equal(
    run({ ready_decision_sources: [readySource({ no_blocking_gap: false })] })
      .ready_decision_candidates[0].blocking_reasons.includes("blocking_gap_present"),
    true,
  );
});

test("Ready candidate requires no semantic projection block", () => {
  assert.equal(
    run({ ready_decision_sources: [readySource({ no_semantic_projection_block: false })] })
      .ready_decision_candidates[0].blocking_reasons.includes("semantic_projection_block_present"),
    true,
  );
});

test("Ready candidate requires no PST deadlock gap", () => {
  assert.equal(
    run({ ready_decision_sources: [readySource({ no_pst_deadlock_gap: false })] })
      .ready_decision_candidates[0].blocking_reasons.includes("pst_deadlock_gap_present"),
    true,
  );
});

test("Ready candidate requires evidence sufficient", () => {
  assert.equal(
    run({ ready_decision_sources: [readySource({ evidence_sufficient: false })] })
      .ready_decision_candidates[0].blocking_reasons.includes("evidence_not_sufficient"),
    true,
  );
});

test("Ready candidate requires canonical routes closed", () => {
  assert.equal(
    run({ ready_decision_sources: [readySource({ canonical_routes_closed: false })] })
      .ready_decision_candidates[0].blocking_reasons.includes("canonical_route_not_closed"),
    true,
  );
});

test("Ready candidate requires B0 closed", () => {
  assert.equal(
    run({ ready_decision_sources: [readySource({ b0_closed: false })] })
      .ready_decision_candidates[0].blocking_reasons.includes("b0_not_closed"),
    true,
  );
});

test("Ready candidate requires B2 closed", () => {
  assert.equal(
    run({ ready_decision_sources: [readySource({ b2_closed: false })] })
      .ready_decision_candidates[0].blocking_reasons.includes("b2_not_closed"),
    true,
  );
});

test("Ready candidate requires B3 closed", () => {
  assert.equal(
    run({ ready_decision_sources: [readySource({ b3_closed: false })] })
      .ready_decision_candidates[0].blocking_reasons.includes("b3_not_closed"),
    true,
  );
});

test("Ready candidate requires B7 non-diagnostic boundary respected", () => {
  assert.equal(
    run({ ready_decision_sources: [readySource({ b7_non_diagnostic_boundary_respected: false })] })
      .ready_decision_candidates[0].blocking_reasons.includes("b7_boundary_not_respected"),
    true,
  );
});

test("Ready candidate blocks manual_review_required", () => {
  assert.equal(
    run({ ready_decision_sources: [readySource({ manual_review_required: true })] })
      .ready_decision_candidates[0].blocking_reasons.includes("manual_review_required"),
    true,
  );
});

test("Ready candidate blocks reentry_required", () => {
  assert.equal(
    run({ ready_decision_sources: [readySource({ reentry_required: true })] })
      .ready_decision_candidates[0].blocking_reasons.includes("reentry_required"),
    true,
  );
});

test("Ready candidate requires source_trace", () => {
  assert.equal(
    run({ ready_decision_sources: [readySource({ source_trace: {} })] })
      .ready_decision_candidates[0].blocking_reasons.includes("missing_source_trace"),
    true,
  );
});

test("Ready candidate does not create ready final", () => {
  assert.equal(run().ready_decision_candidates[0].ready_final_created, false);
});

test("Ready candidate does not create readiness_decision_record real", () => {
  assert.equal(run().ready_decision_candidates[0].readiness_decision_record_real_created, false);
});

test("Ready candidate does not create export-preview", () => {
  assert.equal(run().ready_decision_candidates[0].export_preview_created, false);
});

test("creates ready_with_flags decision candidates", () => {
  assert.equal(run().ready_with_flags_decision_candidates.length, 1);
});

test("ready_with_flags requires critical routes sufficient", () => {
  assert.equal(
    run({
      ready_with_flags_decision_sources: [
        readyWithFlagsSource({ critical_routes_sufficient: false }),
      ],
    }).ready_with_flags_decision_candidates[0].blocking_reasons.includes("critical_route_missing"),
    true,
  );
});

test("ready_with_flags supports non_blocking_gaps", () => {
  assert.equal(run().ready_with_flags_decision_candidates[0].non_blocking_gaps_exist, true);
});

for (const flagType of [
  "evidence_low_confidence",
  "semantic_warning",
  "carry_forward_non_blocking",
  "budget_exhausted_non_blocking",
  "manual_review_recommended",
  "export_condition_warning",
]) {
  test(`ready_with_flags supports ${flagType} flag`, () => {
    const candidate = run({
      ready_with_flags_decision_sources: [
        readyWithFlagsSource({ flags: [flagSource({ flag_type: flagType })] }),
      ],
    }).ready_with_flags_decision_candidates[0];

    assert.equal(candidate.flags[0].flag_type, flagType);
  });
}

test("ready_with_flags requires flag_source_trace", () => {
  assert.equal(
    run({
      ready_with_flags_decision_sources: [
        readyWithFlagsSource({ flags: [flagSource({ flag_source_trace: {} })] }),
      ],
    }).ready_with_flags_decision_candidates[0].blocking_reasons.includes("missing_flag_source_trace"),
    true,
  );
});

test("ready_with_flags blocks open blocking_gap", () => {
  assert.equal(
    run({ ready_with_flags_decision_sources: [readyWithFlagsSource({ no_open_blocking_gap: false })] })
      .ready_with_flags_decision_candidates[0].blocking_reasons.includes("blocking_gap_present"),
    true,
  );
});

test("ready_with_flags blocks critical route missing", () => {
  assert.equal(
    run({ ready_with_flags_decision_sources: [readyWithFlagsSource({ no_critical_route_missing: false })] })
      .ready_with_flags_decision_candidates[0].blocking_reasons.includes("critical_route_missing"),
    true,
  );
});

test("ready_with_flags blocks B7 diagnosis", () => {
  assert.equal(
    run({ ready_with_flags_decision_sources: [readyWithFlagsSource({ no_b7_diagnosis: false })] })
      .ready_with_flags_decision_candidates[0].blocking_reasons.includes("b7_diagnosis_attempted"),
    true,
  );
});

test("ready_with_flags does not hide blocking gap as flag", () => {
  const candidate = run({
    ready_with_flags_decision_sources: [
      readyWithFlagsSource({ flags: [flagSource({ source_gap_is_blocking: true })] }),
    ],
  }).ready_with_flags_decision_candidates[0];

  assert.equal(candidate.blocking_gap_hidden_as_flag, false);
  assert.equal(candidate.blocking_reasons.includes("blocking_gap_hidden_as_flag"), true);
});

test("ready_with_flags does not create export-preview", () => {
  assert.equal(run().ready_with_flags_decision_candidates[0].export_preview_created, false);
});

test("creates blocked_by_missing_evidence candidates", () => {
  assert.equal(run().blocked_by_missing_evidence_candidates.length, 1);
});

test("missing evidence blocks ready", () => {
  assert.equal(run().blocked_by_missing_evidence_candidates[0].ready_final_created, false);
});

test("missing evidence blocks ready_with_flags", () => {
  assert.equal(run().blocked_by_missing_evidence_candidates[0].ready_with_flags_final_created, false);
});

test("missing evidence supports affected_route", () => {
  assert.equal(run().blocked_by_missing_evidence_candidates[0].affected_route, "B0");
});

test("missing evidence supports affected_gate", () => {
  assert.equal(run().blocked_by_missing_evidence_candidates[0].affected_gate, "B0-Q01");
});

test("missing evidence supports affected_quadrant", () => {
  assert.equal(run().blocked_by_missing_evidence_candidates[0].affected_quadrant, "B0");
});

test("missing evidence supports evidence_required", () => {
  assert.equal(run().blocked_by_missing_evidence_candidates[0].evidence_required, "source evidence");
});

test("missing evidence supports reentry_target candidate", () => {
  assert.equal(run().blocked_by_missing_evidence_candidates[0].reentry_target, "B0-Q01");
});

test("missing evidence supports manual_review_required candidate", () => {
  assert.equal(run().blocked_by_missing_evidence_candidates[0].manual_review_required, true);
});

test("missing evidence does not create export-preview", () => {
  assert.equal(run().blocked_by_missing_evidence_candidates[0].export_preview_created, false);
});

test("creates blocked_by_contradiction candidates", () => {
  assert.equal(run().blocked_by_contradiction_candidates.length, 1);
});

for (const contradictionType of [
  "PM_vs_PF",
  "MoC_vs_PF",
  "PF_vs_OLC",
  "OLC_vs_MoC",
  "evidence_vs_variable",
  "route_status_conflict",
  "semantic_resolution_conflict",
]) {
  test(`contradiction supports ${contradictionType}`, () => {
    assert.equal(
      run({
        blocked_by_contradiction_sources: [
          contradictionSource({ contradiction_type: contradictionType }),
        ],
      }).blocked_by_contradiction_candidates[0].contradiction_type,
      contradictionType,
    );
  });
}

test("contradiction does not resolve by inference", () => {
  assert.equal(run().blocked_by_contradiction_candidates[0].contradiction_resolved_by_inference, false);
});

test("contradiction blocks ready", () => {
  assert.equal(run().blocked_by_contradiction_candidates[0].ready_final_created, false);
});

test("contradiction does not create export-preview", () => {
  assert.equal(run().blocked_by_contradiction_candidates[0].export_preview_created, false);
});

test("creates blocked_by_missing_canonical_route candidates", () => {
  assert.equal(run().blocked_by_missing_canonical_route_candidates.length, 1);
});

for (const route of ["B0", "B2", "B3", "B7"]) {
  test(`missing route supports ${route}`, () => {
    assert.equal(
      run({
        blocked_by_missing_canonical_route_sources: [
          missingRouteSource({ affected_critical_route: route }),
        ],
      }).blocked_by_missing_canonical_route_candidates[0].affected_critical_route,
      route,
    );
  });
}

test("missing route blocks closure from free text", () => {
  const candidate = run({
    blocked_by_missing_canonical_route_sources: [
      missingRouteSource({ route_closed_from_free_text_attempted: true }),
    ],
  }).blocked_by_missing_canonical_route_candidates[0];

  assert.equal(candidate.route_closed_from_free_text, false);
  assert.equal(candidate.blocking_reasons.includes("route_closed_from_free_text_attempted"), true);
});

test("missing route blocks C09 closure from satisfaction general", () => {
  const candidate = run({
    blocked_by_missing_canonical_route_sources: [
      missingRouteSource({ c09_closed_from_satisfaction_general_attempted: true }),
    ],
  }).blocked_by_missing_canonical_route_candidates[0];

  assert.equal(candidate.c09_closed_from_satisfaction_general, false);
  assert.equal(candidate.blocking_reasons.includes("c09_closed_from_satisfaction_general_attempted"), true);
});

test("missing route blocks ready", () => {
  assert.equal(run().blocked_by_missing_canonical_route_candidates[0].ready_final_created, false);
});

test("missing route does not create export-preview", () => {
  assert.equal(run().blocked_by_missing_canonical_route_candidates[0].export_preview_created, false);
});

test("creates manual_review_required candidates", () => {
  assert.equal(run().manual_review_required_candidates.length, 1);
});

for (const reason of [
  "semantic_ambiguity",
  "route_missing",
  "contradiction",
  "B7_boundary_risk",
  "evidence_insufficient",
  "override_request",
]) {
  test(`manual review supports ${reason}`, () => {
    assert.equal(
      run({ manual_review_required_sources: [manualReviewSource({ manual_review_reason: reason })] })
        .manual_review_required_candidates[0].manual_review_reason,
      reason,
    );
  });
}

test("manual review creates request candidate only", () => {
  assert.equal(run().manual_review_required_candidates[0].manual_review_request_candidate_created, true);
});

test("manual review request real created remains false", () => {
  assert.equal(run().manual_review_required_candidates[0].manual_review_request_real_created, false);
});

test("manual review does not create automatic waiver", () => {
  assert.equal(run().manual_review_required_candidates[0].waiver_automatic_created, false);
});

test("manual review does not create automatic override", () => {
  assert.equal(run().manual_review_required_candidates[0].override_automatic_created, false);
});

test("manual review blocks ready", () => {
  assert.equal(run().manual_review_required_candidates[0].ready_final_created, false);
});

test("manual review does not create export-preview", () => {
  assert.equal(run().manual_review_required_candidates[0].export_preview_created, false);
});

test("readiness_decision_record real created remains false for decision candidates", () => {
  assert.equal(run().readiness_decision_record_real_created, false);
});

test("ready final created remains false for decision candidates", () => {
  assert.equal(run().ready_final_created, false);
});

test("ready_with_flags final created remains false for decision candidates", () => {
  assert.equal(run().ready_with_flags_final_created, false);
});

test("blocked final created remains false for decision candidates", () => {
  assert.equal(run().blocked_final_created, false);
});

test("Phase 11 started remains false for decision candidates", () => {
  assert.equal(run().phase11_started, false);
});

test("Supabase touched remains false for decision candidates", () => {
  assert.equal(run().supabase_touched, false);
});

test("SQL executed remains false for decision candidates", () => {
  assert.equal(run().sql_executed, false);
});

test("Endpoint created remains false for decision candidates", () => {
  assert.equal(run().endpoint_created, false);
});

test("Phase 10 closed local remains false for decision candidates", () => {
  assert.equal(run().phase10_closed_local, false);
});

test("Ready for Phase 11 authorization remains false for decision candidates", () => {
  assert.equal(run().ready_for_phase11_authorization, false);
});

test("creates reentry_required candidates", () => {
  assert.equal(run().reentry_required_candidates.length, 1);
});

test("reentry_required uses readiness_state reentry_required", () => {
  assert.equal(run().reentry_required_candidates[0].readiness_state, "reentry_required");
});

test("reentry_required requires source_gap_ref", () => {
  assert.equal(
    run({ reentry_required_sources: [reentryRequiredSource({ source_gap_ref: "" })] })
      .reentry_required_candidates[0].blocking_reasons.includes("missing_source_gap_ref"),
    true,
  );
});

test("reentry_required requires source_trace", () => {
  assert.equal(
    run({ reentry_required_sources: [reentryRequiredSource({ source_trace: {} })] })
      .reentry_required_candidates[0].blocking_reasons.includes("missing_source_trace"),
    true,
  );
});

test("reentry_required requires reentry_target_block", () => {
  assert.equal(
    run({ reentry_required_sources: [reentryRequiredSource({ reentry_target_block: "" })] })
      .reentry_required_candidates[0].blocking_reasons.includes("missing_reentry_target_block"),
    true,
  );
});

test("reentry_required requires reentry_reason", () => {
  assert.equal(
    run({ reentry_required_sources: [reentryRequiredSource({ reentry_reason: "" })] })
      .reentry_required_candidates[0].blocking_reasons.includes("missing_reentry_reason"),
    true,
  );
});

test("reentry_required requires justification", () => {
  assert.equal(run().reentry_required_candidates[0].justification_required, true);
});

test("reentry_required requires blocking_gap_present", () => {
  assert.equal(
    run({ reentry_required_sources: [reentryRequiredSource({ blocking_gap_present: false })] })
      .reentry_required_candidates[0].blocking_reasons.includes("missing_blocking_gap"),
    true,
  );
});

test("reentry_required blocks curiosity reentry", () => {
  const candidate = run({
    reentry_required_sources: [reentryRequiredSource({ reentry_by_curiosity_attempted: true })],
  }).reentry_required_candidates[0];

  assert.equal(candidate.reentry_by_curiosity, false);
  assert.equal(candidate.blocking_reasons.includes("reentry_by_curiosity_attempted"), true);
});

test("reentry_required does not open reentry real", () => {
  assert.equal(run().reentry_required_candidates[0].reentry_real_opened, false);
});

test("reentry_required does not create readiness final", () => {
  assert.equal(run().reentry_required_candidates[0].readiness_final_created, false);
});

test("creates reentry plan candidates", () => {
  assert.equal(run().reentry_plan_candidates.length, 1);
});

test("reentry plan supports target_block", () => {
  assert.equal(run().reentry_plan_candidates[0].target_block, "B0");
});

test("reentry plan supports target_interaction_id", () => {
  assert.equal(run().reentry_plan_candidates[0].target_interaction_id, "B0-Q01");
});

test("reentry plan supports target_gate", () => {
  assert.equal(run().reentry_plan_candidates[0].target_gate, "B0");
});

test("reentry plan supports target_route", () => {
  assert.equal(run().reentry_plan_candidates[0].target_route, "CR-B0");
});

test("reentry plan supports target_variable", () => {
  assert.equal(run().reentry_plan_candidates[0].target_variable, "activity_description");
});

test("reentry plan supports source_gap_type", () => {
  assert.equal(run().reentry_plan_candidates[0].source_gap_type, "missing_evidence");
});

test("reentry plan supports source_gap_reason", () => {
  assert.equal(run().reentry_plan_candidates[0].source_gap_reason, "blocking evidence gap");
});

test("reentry plan supports proposed_user_visible_prompt_ref", () => {
  assert.equal(run().reentry_plan_candidates[0].proposed_user_visible_prompt_ref, "PROMPT-B0-Q01");
});

test("reentry plan supports expected_resolution", () => {
  assert.equal(run().reentry_plan_candidates[0].expected_resolution, "close missing evidence");
});

test("reentry plan supports reentry_budget_bucket", () => {
  assert.equal(run().reentry_plan_candidates[0].reentry_budget_bucket, "visible");
});

test("reentry plan supports reentry_budget_cost", () => {
  assert.equal(run().reentry_plan_candidates[0].reentry_budget_cost, 1);
});

test("reentry plan requires authorization", () => {
  assert.equal(run().reentry_plan_candidates[0].reentry_authorization_required, true);
});

test("reentry plan creates interaction candidates only", () => {
  assert.equal(run().reentry_plan_candidates[0].reentry_interactions_candidate.length, 1);
  assert.equal(run().reentry_plan_candidates[0].runtime_interaction_instance_real_created, false);
});

test("reentry interaction candidate requires source_trace", () => {
  assert.equal(
    run({
      reentry_plan_sources: [
        reentryPlanSource({
          reentry_interactions_candidate: [reentryInteractionSource({ source_trace: {} })],
        }),
      ],
    }).reentry_plan_candidates[0].blocking_reasons.includes("missing_source_trace"),
    true,
  );
});

test("reentry plan does not create runtime_interaction_instance real", () => {
  assert.equal(run().reentry_plan_candidates[0].runtime_interaction_instance_real_created, false);
});

test("reentry plan does not render UI real", () => {
  assert.equal(run().reentry_plan_candidates[0].ui_render_real_created, false);
});

test("reentry plan does not create endpoint", () => {
  assert.equal(run().reentry_plan_candidates[0].endpoint_created, false);
});

test("reentry plan does not touch Supabase", () => {
  assert.equal(run().reentry_plan_candidates[0].supabase_touched, false);
});

test("creates reentry execution boundary", () => {
  assert.equal(run().reentry_execution_boundaries.length, 1);
});

test("boundary prepares future interactions only", () => {
  assert.equal(run().reentry_execution_boundaries[0].future_interactions_prepared, true);
});

test("boundary prepares future Phase 5 payload candidate", () => {
  assert.equal(run().reentry_execution_boundaries[0].future_phase5_payload_candidate_prepared, true);
});

test("boundary prepares future Phase 6 payload candidate", () => {
  assert.equal(run().reentry_execution_boundaries[0].future_phase6_payload_candidate_prepared, true);
});

test("boundary prepares budget candidate", () => {
  assert.equal(run().reentry_execution_boundaries[0].budget_candidate_prepared, true);
});

test("boundary requires explicit authorization for real reentry", () => {
  assert.equal(run().reentry_execution_boundaries[0].reentry_real_requires_explicit_authorization, true);
});

test("boundary does not create runtime_interaction_instance real", () => {
  assert.equal(run().reentry_execution_boundaries[0].runtime_interaction_instance_real_created, false);
});

test("boundary does not create shown_at real", () => {
  assert.equal(run().reentry_execution_boundaries[0].shown_at_real_created, false);
});

test("boundary does not create answered_at real", () => {
  assert.equal(run().reentry_execution_boundaries[0].answered_at_real_created, false);
});

test("boundary does not execute ResponseIngest", () => {
  assert.equal(run().reentry_execution_boundaries[0].response_ingest_executed, false);
});

test("boundary does not create evidence_item real", () => {
  assert.equal(run().reentry_execution_boundaries[0].evidence_item_real_created, false);
});

test("boundary does not create canonical_variable_record real", () => {
  assert.equal(run().reentry_execution_boundaries[0].canonical_variable_record_real_created, false);
});

test("boundary does not execute branching real", () => {
  assert.equal(run().reentry_execution_boundaries[0].branching_real_executed, false);
});

test("boundary does not reexecute gates", () => {
  assert.equal(run().reentry_execution_boundaries[0].gates_reexecuted, false);
});

test("boundary does not create readiness final after reentry candidate", () => {
  assert.equal(run().reentry_execution_boundaries[0].readiness_final_after_reentry_candidate_created, false);
});

test("readiness_decision_record real created remains false for reentry", () => {
  assert.equal(run().readiness_decision_record_real_created, false);
});

test("export-preview created remains false for reentry", () => {
  assert.equal(run().export_preview_created, false);
});

test("parallel_export_payload created remains false for reentry", () => {
  assert.equal(run().parallel_export_payload_created, false);
});

test("Produccion Paralela started remains false for reentry", () => {
  assert.equal(run().produccion_paralela_started, false);
});

test("Supabase touched remains false for reentry", () => {
  assert.equal(run().supabase_touched, false);
});

test("SQL executed remains false for reentry", () => {
  assert.equal(run().sql_executed, false);
});

test("Endpoint created remains false for reentry", () => {
  assert.equal(run().endpoint_created, false);
});

test("Phase 11 started remains false for reentry", () => {
  assert.equal(run().phase11_started, false);
});

test("Phase 10 closed local remains false for reentry", () => {
  assert.equal(run().phase10_closed_local, false);
});

test("Ready for Phase 11 authorization remains false for reentry", () => {
  assert.equal(run().ready_for_phase11_authorization, false);
});

test("creates readiness gap aggregation candidates", () => {
  assert.equal(run().readiness_gap_aggregation_candidates.length, 1);
});

[
  ["aggregates missing evidence gaps", "missing_evidence_gap_refs", "GAP-MISSING-EVIDENCE-001"],
  ["aggregates contradiction gaps", "contradiction_gap_refs", "GAP-CONTRADICTION-001"],
  ["aggregates missing canonical route gaps", "missing_canonical_route_gap_refs", "GAP-MISSING-ROUTE-001"],
  ["aggregates semantic ambiguity gaps", "semantic_ambiguity_gap_refs", "GAP-SEM-001"],
  ["aggregates process_state_without_timer gaps", "process_state_without_timer_gap_refs", "GAP-PST-001"],
  ["aggregates budget exhausted gaps", "budget_exhausted_gap_refs", "GAP-BUDGET-001"],
  ["aggregates manual review gaps", "manual_review_gap_refs", "GAP-MANUAL-001"],
  ["aggregates carry forward gaps", "carry_forward_gap_refs", "GAP-CARRY-001"],
].forEach(([name, field, value]) => {
  test(name, () => {
    assert.equal(run().readiness_gap_aggregation_candidates[0][field].includes(value), true);
  });
});

test("merges duplicate gaps by source_trace", () => {
  assert.equal(run().readiness_gap_aggregation_candidates[0].duplicate_gaps_merged_by_source_trace, true);
});

test("supports gap severity rollup", () => {
  assert.equal(run().readiness_gap_aggregation_candidates[0].gap_severity_rollup, "high");
});

test("classifies blocking gaps", () => {
  assert.equal(run().readiness_gap_aggregation_candidates[0].blocking_gap_refs.includes("GAP-BLOCK-001"), true);
});

test("classifies non-blocking gaps", () => {
  assert.equal(run().readiness_gap_aggregation_candidates[0].non_blocking_gap_refs.includes("GAP-NONBLOCK-001"), true);
});

test("preserves source_trace in readiness gap aggregation", () => {
  assert.equal(run().readiness_gap_aggregation_candidates[0].source_trace.source_sheet, "Readiness_Gaps_Reentry");
});

test("does not hide blocking gap", () => {
  assert.equal(run().readiness_gap_aggregation_candidates[0].blocking_gap_hidden, false);
});

test("does not invent non-emitted gap", () => {
  assert.equal(run().readiness_gap_aggregation_candidates[0].invented_gap_created, false);
});

test("creates critical route readiness aggregation candidates", () => {
  assert.equal(run().critical_route_readiness_aggregation_candidates.length, 1);
});

[
  ["supports B0 status", "b0_status", "closed"],
  ["supports B2 status", "b2_status", "closed"],
  ["supports B3 status", "b3_status", "closed"],
  ["supports B7 status", "b7_status", "non_diagnostic_boundary_respected"],
].forEach(([name, field, value]) => {
  test(name, () => {
    assert.equal(run().critical_route_readiness_aggregation_candidates[0][field], value);
  });
});

test("blocks ready when critical route blocked", () => {
  assert.equal(
    run({
      critical_route_readiness_aggregation_sources: [criticalRouteAggregationSource({ route_blocked: true })],
    }).critical_route_readiness_aggregation_candidates[0].ready_allowed,
    false,
  );
});

test("blocks ready_with_flags when blocking critical route missing", () => {
  assert.equal(
    run({
      critical_route_readiness_aggregation_sources: [criticalRouteAggregationSource({ route_missing: true })],
    }).critical_route_readiness_aggregation_candidates[0].ready_with_flags_allowed,
    false,
  );
});

test("does not close route_status from satisfaction", () => {
  const candidate = run({
    critical_route_readiness_aggregation_sources: [
      criticalRouteAggregationSource({ route_status_closed_from_satisfaction_attempted: true }),
    ],
  }).critical_route_readiness_aggregation_candidates[0];
  assert.equal(candidate.route_status_closed_from_satisfaction_or_free_text, false);
  assert.equal(candidate.blocking_reasons.includes("route_status_closed_from_satisfaction_attempted"), true);
});

test("does not close route_status from free text", () => {
  const candidate = run({
    critical_route_readiness_aggregation_sources: [
      criticalRouteAggregationSource({ route_status_closed_from_free_text_attempted: true }),
    ],
  }).critical_route_readiness_aggregation_candidates[0];
  assert.equal(candidate.route_status_closed_from_satisfaction_or_free_text, false);
  assert.equal(candidate.blocking_reasons.includes("route_status_closed_from_free_text_attempted"), true);
});

test("creates semantic/PST readiness aggregation candidates", () => {
  assert.equal(run().semantic_pst_readiness_aggregation_candidates.length, 1);
});

[
  ["supports open SEM blockers", "sem_blockers_open_refs", "SEM-BLOCK-001"],
  ["supports resolved SEM blocker candidates", "sem_blockers_resolved_candidate_refs", "SEM-RES-CAND-001"],
  ["supports open PST blockers", "pst_blockers_open_refs", "PST-BLOCK-001"],
  ["supports resolved PST blocker candidates", "pst_blockers_resolved_candidate_refs", "PST-RES-CAND-001"],
  ["propagates process_state_without_timer gaps", "process_state_without_timer_gap_refs", "GAP-PST-001"],
  ["propagates semantic_ambiguity gaps", "semantic_ambiguity_gap_refs", "GAP-SEM-001"],
].forEach(([name, field, value]) => {
  test(name, () => {
    assert.equal(run().semantic_pst_readiness_aggregation_candidates[0][field].includes(value), true);
  });
});

test("propagates deadlock_risk", () => {
  assert.equal(run().semantic_pst_readiness_aggregation_candidates[0].deadlock_risk, true);
});

test("blocks ready when SEM blocks_projection=true", () => {
  assert.equal(run().semantic_pst_readiness_aggregation_candidates[0].ready_allowed, false);
  assert.equal(
    run().semantic_pst_readiness_aggregation_candidates[0].blocking_reasons.includes("sem_blocks_projection_open"),
    true,
  );
});

test("blocks ready when PST blocking gap open", () => {
  assert.equal(
    run().semantic_pst_readiness_aggregation_candidates[0].blocking_reasons.includes("pst_blocking_gap_open"),
    true,
  );
});

test("does not infer semantic resolution", () => {
  const candidate = run({
    semantic_pst_readiness_aggregation_sources: [
      semanticPSTAggregationSource({ semantic_resolution_inferred_attempted: true }),
    ],
  }).semantic_pst_readiness_aggregation_candidates[0];
  assert.equal(candidate.semantic_temporal_resolution_inferred, false);
  assert.equal(candidate.blocking_reasons.includes("semantic_resolution_inferred_attempted"), true);
});

test("does not infer temporal resolution", () => {
  const candidate = run({
    semantic_pst_readiness_aggregation_sources: [
      semanticPSTAggregationSource({ temporal_resolution_inferred_attempted: true }),
    ],
  }).semantic_pst_readiness_aggregation_candidates[0];
  assert.equal(candidate.semantic_temporal_resolution_inferred, false);
  assert.equal(candidate.blocking_reasons.includes("temporal_resolution_inferred_attempted"), true);
});

test("creates budget readiness aggregation candidates", () => {
  assert.equal(run().budget_readiness_aggregation_candidates.length, 1);
});

[
  ["supports base budget state", "base_budget_state", "base_exhausted"],
  ["supports causal budget state", "causal_budget_state", "causal_available"],
  ["supports reentry budget state", "reentry_budget_state", "reentry_reserved"],
].forEach(([name, field, value]) => {
  test(name, () => {
    assert.equal(run().budget_readiness_aggregation_candidates[0][field], value);
  });
});

test("supports budget exhausted gaps", () => {
  assert.equal(run().budget_readiness_aggregation_candidates[0].budget_exhausted_gap_refs.includes("GAP-BUDGET-001"), true);
});

test("supports budget_exhausted_non_blocking", () => {
  assert.equal(run().budget_readiness_aggregation_candidates[0].budget_exhausted_non_blocking, true);
});

test("supports budget_exhausted_blocking", () => {
  assert.equal(run().budget_readiness_aggregation_candidates[0].budget_exhausted_blocking, true);
});

test("supports carry_forward_gap_refs in budget aggregation", () => {
  assert.equal(run().budget_readiness_aggregation_candidates[0].carry_forward_gap_refs.includes("GAP-CARRY-001"), true);
});

test("does not open more causals", () => {
  assert.equal(run().budget_readiness_aggregation_candidates[0].more_causals_opened, false);
});

test("does not create budget override automatic", () => {
  assert.equal(run().budget_readiness_aggregation_candidates[0].budget_override_automatic_created, false);
});

test("does not allow export when budget hides blocking gap", () => {
  assert.equal(run().budget_readiness_aggregation_candidates[0].export_allowed_when_budget_hides_blocking_gap, false);
});

test("creates readiness decision record candidates", () => {
  assert.equal(run().readiness_decision_record_candidates.length, 1);
});

test("readiness_decision_record real created remains false for decision candidate", () => {
  assert.equal(run().readiness_decision_record_candidates[0].readiness_decision_record_real_created, false);
});

[
  ["supports run_id", "run_id", "RUN-001"],
  ["supports readiness_state", "readiness_state", "manual_review_required"],
].forEach(([name, field, value]) => {
  test(name, () => {
    assert.equal(run().readiness_decision_record_candidates[0][field], value);
  });
});

test("requires readiness_reason", () => {
  assert.equal(
    run({ readiness_decision_record_sources: [decisionRecordSource({ readiness_reason: "" })] })
      .readiness_decision_record_candidates[0].blocking_reasons.includes("missing_readiness_reason"),
    true,
  );
});

[
  ["supports blocking_gap_refs", "blocking_gap_refs", "GAP-BLOCK-001"],
  ["supports non_blocking_gap_refs", "non_blocking_gap_refs", "GAP-NONBLOCK-001"],
  ["supports manual_review_refs", "manual_review_refs", "MANUAL-REVIEW-CAND-001"],
  ["supports reentry_refs", "reentry_refs", "REENTRY-REQ-CAND-001"],
  ["supports gate_result_refs", "gate_result_refs", "CRG-001"],
  ["supports semantic_event_refs", "semantic_event_refs", "SEM-EVENT-001"],
  ["supports pst_event_refs", "pst_event_refs", "PST-EVENT-001"],
  ["supports carry_forward_gap_refs in decision record", "carry_forward_gap_refs", "GAP-CARRY-001"],
].forEach(([name, field, value]) => {
  test(name, () => {
    assert.equal(run().readiness_decision_record_candidates[0][field].includes(value), true);
  });
});

test("preserves source_trace in decision record candidate", () => {
  assert.equal(run().readiness_decision_record_candidates[0].source_trace.source_sheet, "Readiness_Gaps_Reentry");
});

test("supports decision_timestamp_preview", () => {
  assert.equal(run().readiness_decision_record_candidates[0].decision_timestamp_preview, "2026-07-05T00:00:00.000Z");
});

test("supports audit_candidate_ref", () => {
  assert.equal(run().readiness_decision_record_candidates[0].audit_candidate_ref, "AUD-CAND-001");
});

test("does not create DB write", () => {
  assert.equal(run().readiness_decision_record_candidates[0].db_write_created, false);
});

test("does not create export-preview in decision record candidate", () => {
  assert.equal(run().readiness_decision_record_candidates[0].export_preview_created, false);
});

[
  ["ReadinessEngine real executed remains false for aggregation", "readiness_engine_real_executed"],
  ["ready final created remains false for aggregation", "ready_final_created"],
  ["ready_with_flags final created remains false for aggregation", "ready_with_flags_final_created"],
  ["blocked final created remains false for aggregation", "blocked_final_created"],
  ["Supabase touched remains false for aggregation", "supabase_touched"],
  ["SQL executed remains false for aggregation", "sql_executed"],
  ["Endpoint created remains false for aggregation", "endpoint_created"],
  ["Phase 11 started remains false for aggregation", "phase11_started"],
  ["Phase 10 closed local remains false for aggregation", "phase10_closed_local"],
  ["Ready for Phase 11 authorization remains false for aggregation", "ready_for_phase11_authorization"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(run()[field], false);
  });
});

test("creates readiness audit candidates", () => {
  assert.equal(run().readiness_audit_candidates.length, 12);
});

[
  "readiness_evaluation_started",
  "readiness_state_assigned",
  "ready_candidate_created",
  "ready_with_flags_candidate_created",
  "blocked_candidate_created",
  "manual_review_required_candidate_created",
  "reentry_required_candidate_created",
  "gap_aggregation_completed",
  "critical_route_readiness_evaluated",
  "semantic_pst_readiness_evaluated",
  "budget_readiness_evaluated",
  "export_preview_blocked",
].forEach((action) => {
  test(`supports ${action} audit action`, () => {
    assert.equal(run().readiness_audit_candidates.some((candidate) => candidate.audit_action === action), true);
  });
});

test("audit candidate requires source_trace", () => {
  assert.equal(
    run({ readiness_audit_sources: [readinessAuditSource({ source_trace: {} })] })
      .readiness_audit_candidates[0].blocking_reasons.includes("missing_source_trace"),
    true,
  );
});

test("audit candidate requires audit_reason", () => {
  assert.equal(
    run({ readiness_audit_sources: [readinessAuditSource({ audit_reason: "" })] })
      .readiness_audit_candidates[0].blocking_reasons.includes("missing_audit_reason"),
    true,
  );
});

test("runtime_audit_trail real created remains false", () => {
  assert.equal(run().readiness_audit_candidates[0].runtime_audit_trail_real_created, false);
});

test("readiness_decision_record real created remains false for audit", () => {
  assert.equal(run().readiness_audit_candidates[0].readiness_decision_record_real_created, false);
});

test("creates Phase 11 export-preview boundaries", () => {
  assert.equal(run().phase11_export_preview_boundaries.length, 3);
});

test("ready can prepare future export-preview authorization candidate", () => {
  assert.equal(run().phase11_export_preview_boundaries[0].ready_can_prepare_future_export_preview, true);
});

test("ready_with_flags can prepare future export-preview authorization candidate with visible flags", () => {
  assert.equal(
    run().phase11_export_preview_boundaries[1]
      .ready_with_flags_can_prepare_future_export_preview_with_visible_flags,
    true,
  );
});

test("blocked never authorizes export-preview", () => {
  assert.equal(run().phase11_export_preview_boundaries[2].blocked_export_preview_authorized, false);
});

test("manual_review_required never authorizes export-preview", () => {
  assert.equal(
    run({ phase11_export_preview_boundary_sources: [phase11BoundarySource({ source_readiness_state: "manual_review_required" })] })
      .phase11_export_preview_boundaries[0].manual_review_export_preview_authorized,
    false,
  );
});

test("reentry_required never authorizes export-preview", () => {
  assert.equal(
    run({ phase11_export_preview_boundary_sources: [phase11BoundarySource({ source_readiness_state: "reentry_required" })] })
      .phase11_export_preview_boundaries[0].reentry_export_preview_authorized,
    false,
  );
});

[
  ["export-preview created remains false", "export_preview_created"],
  ["SCR preview created remains false", "scr_preview_created"],
  ["EvidenceBundle preview created remains false", "evidence_bundle_preview_created"],
  ["MDSB preview created remains false", "mdsb_preview_created"],
  ["parallel_export_payload created remains false for Phase 11 boundary", "parallel_export_payload_created"],
  ["Produccion Paralela started remains false for Phase 11 boundary", "produccion_paralela_started"],
  ["registry created remains false", "registry_created"],
  ["ready_for_phase11_authorization remains false for Phase 11 boundary", "ready_for_phase11_authorization"],
  ["Phase 11 started remains false for Phase 11 boundary", "phase11_started"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(run().phase11_export_preview_boundaries[0][field], false);
  });
});

test("creates Phase 12 QA boundaries", () => {
  assert.equal(run().phase12_qa_boundaries.length, 1);
});

[
  ["readiness output can feed future QA", "readiness_output_can_feed_future_qa"],
  ["gaps can feed future QA", "gaps_can_feed_future_qa"],
  ["reentry decisions can feed future QA", "reentry_decisions_can_feed_future_qa"],
  ["manual_review_required can feed future QA", "manual_review_required_can_feed_future_qa"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(run().phase12_qa_boundaries[0][field], true);
  });
});

[
  ["QA green declared remains false", "qa_green_declared"],
  ["shadow pilot started remains false", "shadow_pilot_started"],
  ["full runtime authorized remains false", "full_runtime_authorized"],
  ["production real started remains false", "production_real_started"],
  ["Phase 12 Definition of Done modified remains false", "phase12_definition_of_done_modified"],
  ["Phase 12 started remains false", "phase12_started"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(run().phase12_qa_boundaries[0][field], false);
  });
});

test("creates supersession/recompute boundaries", () => {
  assert.equal(run().readiness_supersession_recompute_boundaries.length, 1);
});

[
  ["response revision can mark readiness stale candidate", "response_revision_impact_can_mark_stale_candidate"],
  ["gate result revision can mark readiness stale candidate", "gate_result_revision_impact_can_mark_stale_candidate"],
  ["branching revision can mark readiness stale candidate", "branching_revision_impact_can_mark_stale_candidate"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(run().readiness_supersession_recompute_boundaries[0][field], true);
  });
});

[
  ["prior_readiness_candidate_ref supported", "prior_readiness_candidate_ref", "READY-DECISION-RECORD-CAND-001"],
  ["supersedes_readiness_candidate_ref supported", "supersedes_readiness_candidate_ref", "READY-DECISION-RECORD-CAND-000"],
  ["stale_reason supported", "stale_reason", "response revision affects readiness candidate"],
].forEach(([name, field, value]) => {
  test(name, () => {
    assert.equal(run().readiness_supersession_recompute_boundaries[0][field], value);
  });
});

test("recompute_required candidate supported", () => {
  assert.equal(run().readiness_supersession_recompute_boundaries[0].recompute_required_candidate, true);
});

[
  ["global recompute automatic executed remains false", "global_recompute_automatic_executed"],
  ["prior readiness deleted without trace remains false", "prior_readiness_deleted_without_trace"],
  ["export payload superseded real remains false", "export_payload_superseded_real"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(run().readiness_supersession_recompute_boundaries[0][field], false);
  });
});

test("export payload supersession boundary candidate supported", () => {
  assert.equal(
    run().readiness_supersession_recompute_boundaries[0]
      .export_payload_supersession_boundary_candidate_created,
    true,
  );
});

test("persistence real created remains false", () => {
  assert.equal(run().readiness_supersession_recompute_boundaries[0].persistence_real_created, false);
});

test("creates readiness persistence boundaries", () => {
  assert.equal(run().readiness_persistence_boundaries.length, 1);
});

[
  ["local readiness decision candidate mode remains true", "local_readiness_decision_candidate_mode"],
  ["local readiness gap aggregation candidate mode remains true", "local_readiness_gap_aggregation_candidate_mode"],
  ["local reentry plan candidate mode remains true", "local_reentry_plan_candidate_mode"],
  ["local manual review candidate mode remains true", "local_manual_review_candidate_mode"],
  ["local readiness audit candidate mode remains true", "local_readiness_audit_candidate_mode"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(run().readiness_persistence_boundaries[0][field], true);
  });
});

[
  ["DB write authorized remains false", "db_write_authorized"],
  ["readiness_decision_record real created remains false for persistence", "readiness_decision_record_real_created"],
  ["manual_review_request real created remains false for persistence", "manual_review_request_real_created"],
  ["reentry_interactions real created remains false for persistence", "reentry_interactions_real_created"],
  ["Supabase touch authorized remains false", "supabase_touch_authorized"],
  ["SQL execution authorized remains false", "sql_execution_authorized"],
  ["endpoint creation authorized remains false", "endpoint_creation_authorized"],
  ["service_role used remains false for persistence", "service_role_used"],
  ["service_role used in client remains false for persistence", "service_role_used_in_client"],
  ["scene write detected remains false", "scene_write_detected"],
  ["mba write detected remains false", "mba_write_detected"],
  ["parallel_production_runtime_artifacts write detected remains false", "parallel_production_runtime_artifacts_write_detected"],
  ["Runtime 40/20 started remains false for persistence", "runtime_40_20_started"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(run().readiness_persistence_boundaries[0][field], false);
  });
});

test("Phase 10 closed local remains false for boundary", () => {
  assert.equal(run().phase10_closed_local, false);
});

test("Ready for Phase 11 authorization remains false for boundary", () => {
  assert.equal(run().ready_for_phase11_authorization, false);
});

function run(overrides = {}) {
  return service.buildPhase10AuditExportQaSupersessionPersistenceBoundaryLocalResult(deepMerge(baseInput(), overrides));
}

function baseInput() {
  return {
    case_id: "CASE-001",
    run_id: "RUN-001",
    activity_runtime_run_id: "ACT-RUN-001",
    phase9_closeout: {
      phase9_closed_local: true,
      ready_for_phase10_authorization: true,
    },
    phase9_candidates: {
      critical_route_gate_result_candidates: [{ critical_route_gate_result_candidate_ref: "CRG-001" }],
      semantic_resolution_event_candidates: [{ semantic_event_candidate_ref: "SEM-EVENT-001" }],
      process_state_timer_event_candidates: [{ pst_event_candidate_ref: "PST-EVENT-001" }],
      readiness_gap_record_candidates: [{ readiness_gap_candidate_ref: "GAP-001" }],
      runtime_audit_trail_gate_candidates: [{ runtime_audit_candidate_ref: "AUD-001" }],
      gate_outcome_readiness_boundaries: [{ readiness_input_candidate_ref: "READY-IN-001" }],
      object_inventory_boundaries: [{ object_inventory_boundary_candidate_ref: "OBJ-BOUND-001" }],
      integration_membrane_control_plane_boundaries: [{ control_plane_boundary_candidate_ref: "CP-BOUND-001" }],
      persistence_boundaries: [{ persistence_boundary_candidate_ref: "PERSIST-BOUND-001" }],
    },
    readiness_engine_evaluation_sources: [engineSource()],
    readiness_rule_source_inputs: [ruleSource()],
    readiness_state_model_inputs: [stateModelSource()],
    ready_decision_sources: [readySource()],
    ready_with_flags_decision_sources: [readyWithFlagsSource()],
    blocked_by_missing_evidence_sources: [missingEvidenceSource()],
    blocked_by_contradiction_sources: [contradictionSource()],
    blocked_by_missing_canonical_route_sources: [missingRouteSource()],
    manual_review_required_sources: [manualReviewSource()],
    reentry_required_sources: [reentryRequiredSource()],
    reentry_plan_sources: [reentryPlanSource()],
    reentry_execution_boundary_sources: [reentryExecutionBoundarySource()],
    readiness_gap_aggregation_sources: [readinessGapAggregationSource()],
    critical_route_readiness_aggregation_sources: [criticalRouteAggregationSource()],
    semantic_pst_readiness_aggregation_sources: [semanticPSTAggregationSource()],
    budget_readiness_aggregation_sources: [budgetAggregationSource()],
    readiness_decision_record_sources: [decisionRecordSource()],
    readiness_audit_sources: readinessAuditSources(),
    phase11_export_preview_boundary_sources: [
      phase11BoundarySource({ source_readiness_state: "ready" }),
      phase11BoundarySource({ source_readiness_state: "ready_with_flags" }),
      phase11BoundarySource({ source_readiness_state: "blocked_by_missing_evidence" }),
    ],
    phase12_qa_boundary_sources: [phase12QABoundarySource()],
    readiness_supersession_recompute_boundary_sources: [supersessionRecomputeSource()],
    readiness_persistence_boundary_sources: [persistenceBoundarySource()],
  };
}

function readinessAuditSources() {
  return [
    "readiness_evaluation_started",
    "readiness_state_assigned",
    "ready_candidate_created",
    "ready_with_flags_candidate_created",
    "blocked_candidate_created",
    "manual_review_required_candidate_created",
    "reentry_required_candidate_created",
    "gap_aggregation_completed",
    "critical_route_readiness_evaluated",
    "semantic_pst_readiness_evaluated",
    "budget_readiness_evaluated",
    "export_preview_blocked",
  ].map((audit_action, index) =>
    readinessAuditSource({
      readiness_audit_candidate_ref: `READINESS-AUDIT-CAND-${String(index + 1).padStart(3, "0")}`,
      audit_action,
    }),
  );
}

function readinessAuditSource(overrides = {}) {
  return {
    readiness_audit_candidate_ref: "READINESS-AUDIT-CAND-001",
    audit_action: "readiness_evaluation_started",
    audit_reason: "local readiness boundary candidate audited",
    source_readiness_candidate_ref: "READY-CAND-001",
    source_readiness_decision_candidate_ref: "READY-DECISION-RECORD-CAND-001",
    source_gap_aggregation_ref: "GAP-AGG-CAND-001",
    source_trace: sourceTrace({ source_sheet: "QA_Checklist" }),
    ...overrides,
  };
}

function phase11BoundarySource(overrides = {}) {
  return {
    phase11_export_boundary_ref: "PHASE11-EXPORT-BOUNDARY-001",
    source_readiness_state: "ready",
    source_readiness_decision_candidate_ref: "READY-DECISION-RECORD-CAND-001",
    source_trace: sourceTrace({ source_sheet: "MMABP_Output_Map" }),
    ...overrides,
  };
}

function phase12QABoundarySource(overrides = {}) {
  return {
    phase12_qa_boundary_ref: "PHASE12-QA-BOUNDARY-001",
    readiness_output_can_feed_future_qa: true,
    gaps_can_feed_future_qa: true,
    reentry_decisions_can_feed_future_qa: true,
    manual_review_required_can_feed_future_qa: true,
    source_trace: sourceTrace({ source_sheet: "QA_Checklist" }),
    ...overrides,
  };
}

function supersessionRecomputeSource(overrides = {}) {
  return {
    readiness_supersession_boundary_ref: "READINESS-SUPERSESSION-BOUNDARY-001",
    response_revision_impact_can_mark_stale_candidate: true,
    gate_result_revision_impact_can_mark_stale_candidate: true,
    branching_revision_impact_can_mark_stale_candidate: true,
    prior_readiness_candidate_ref: "READY-DECISION-RECORD-CAND-001",
    supersedes_readiness_candidate_ref: "READY-DECISION-RECORD-CAND-000",
    stale_reason: "response revision affects readiness candidate",
    recompute_required_candidate: true,
    export_payload_supersession_boundary_candidate_created: true,
    source_trace: sourceTrace({ source_sheet: "Version_Control" }),
    ...overrides,
  };
}

function persistenceBoundarySource(overrides = {}) {
  return {
    readiness_persistence_boundary_ref: "READINESS-PERSISTENCE-BOUNDARY-001",
    source_trace: sourceTrace({ source_sheet: "Parallel_Production_Contract" }),
    ...overrides,
  };
}

function readinessGapAggregationSource(overrides = {}) {
  return {
    aggregate_gap_candidate_ref: "GAP-AGG-CAND-001",
    missing_evidence_gap_refs: ["GAP-MISSING-EVIDENCE-001"],
    contradiction_gap_refs: ["GAP-CONTRADICTION-001"],
    missing_canonical_route_gap_refs: ["GAP-MISSING-ROUTE-001"],
    semantic_ambiguity_gap_refs: ["GAP-SEM-001"],
    process_state_without_timer_gap_refs: ["GAP-PST-001"],
    budget_exhausted_gap_refs: ["GAP-BUDGET-001"],
    manual_review_gap_refs: ["GAP-MANUAL-001"],
    carry_forward_gap_refs: ["GAP-CARRY-001"],
    duplicate_gaps_merged_by_source_trace: true,
    gap_severity_rollup: "high",
    blocking_gap_refs: ["GAP-BLOCK-001"],
    non_blocking_gap_refs: ["GAP-NONBLOCK-001"],
    source_trace: sourceTrace({ source_sheet: "Readiness_Gaps_Reentry" }),
    ...overrides,
  };
}

function criticalRouteAggregationSource(overrides = {}) {
  return {
    critical_route_readiness_candidate_ref: "CR-READY-CAND-001",
    b0_status: "closed",
    b2_status: "closed",
    b3_status: "closed",
    b7_status: "non_diagnostic_boundary_respected",
    route_closed: true,
    route_missing: false,
    route_blocked: false,
    route_manual_review_required: true,
    route_reentry_required: true,
    route_source_trace: sourceTrace({ source_sheet: "Critical_Routes" }),
    ready_allowed: true,
    ready_with_flags_allowed: true,
    ...overrides,
  };
}

function semanticPSTAggregationSource(overrides = {}) {
  return {
    semantic_pst_readiness_candidate_ref: "SEM-PST-READY-CAND-001",
    sem_blockers_open_refs: ["SEM-BLOCK-001"],
    sem_blockers_resolved_candidate_refs: ["SEM-RES-CAND-001"],
    pst_blockers_open_refs: ["PST-BLOCK-001"],
    pst_blockers_resolved_candidate_refs: ["PST-RES-CAND-001"],
    process_state_without_timer_gap_refs: ["GAP-PST-001"],
    semantic_ambiguity_gap_refs: ["GAP-SEM-001"],
    deadlock_risk: true,
    source_trace: sourceTrace({ source_sheet: "Semantic_Resolution_Gates" }),
    ready_allowed: true,
    ...overrides,
  };
}

function budgetAggregationSource(overrides = {}) {
  return {
    budget_readiness_candidate_ref: "BUDGET-READY-CAND-001",
    base_budget_state: "base_exhausted",
    causal_budget_state: "causal_available",
    reentry_budget_state: "reentry_reserved",
    budget_exhausted_gap_refs: ["GAP-BUDGET-001"],
    budget_exhausted_non_blocking: true,
    budget_exhausted_blocking: true,
    carry_forward_gap_refs: ["GAP-CARRY-001"],
    source_trace: sourceTrace({ source_sheet: "Branching_Budget_Rules" }),
    ...overrides,
  };
}

function decisionRecordSource(overrides = {}) {
  return {
    readiness_decision_candidate_ref: "READY-DECISION-RECORD-CAND-001",
    run_id: "RUN-001",
    readiness_state: "manual_review_required",
    readiness_reason: "aggregation candidate requires manual review",
    blocking_gap_refs: ["GAP-BLOCK-001"],
    non_blocking_gap_refs: ["GAP-NONBLOCK-001"],
    manual_review_refs: ["MANUAL-REVIEW-CAND-001"],
    reentry_refs: ["REENTRY-REQ-CAND-001"],
    gate_result_refs: ["CRG-001"],
    semantic_event_refs: ["SEM-EVENT-001"],
    pst_event_refs: ["PST-EVENT-001"],
    carry_forward_gap_refs: ["GAP-CARRY-001"],
    source_trace: sourceTrace({ source_sheet: "Readiness_Gaps_Reentry" }),
    decision_timestamp_preview: "2026-07-05T00:00:00.000Z",
    audit_candidate_ref: "AUD-CAND-001",
    ...overrides,
  };
}

function reentryRequiredSource(overrides = {}) {
  return {
    reentry_required_candidate_ref: "REENTRY-REQ-CAND-001",
    source_gap_ref: "GAP-MISSING-EVIDENCE-001",
    source_gate_ref: "B0-GATE-001",
    source_readiness_gap_ref: "READY-GAP-001",
    reentry_target_block: "B0",
    reentry_target_interaction_id: "B0-Q01",
    reentry_reason: "blocking evidence gap requires reentry",
    source_trace: sourceTrace({ source_sheet: "Readiness_Gaps_Reentry" }),
    reentry_budget_impact: "visible_1",
    reentry_counts_as_visible: true,
    reentry_counts_as_causal: true,
    blocking_gap_present: true,
    ...overrides,
  };
}

function reentryPlanSource(overrides = {}) {
  return {
    reentry_plan_candidate_ref: "REENTRY-PLAN-CAND-001",
    target_block: "B0",
    target_interaction_id: "B0-Q01",
    target_gate: "B0",
    target_route: "CR-B0",
    target_variable: "activity_description",
    source_gap_type: "missing_evidence",
    source_gap_reason: "blocking evidence gap",
    proposed_user_visible_prompt_ref: "PROMPT-B0-Q01",
    expected_resolution: "close missing evidence",
    reentry_budget_bucket: "visible",
    reentry_budget_cost: 1,
    reentry_interactions_candidate: [reentryInteractionSource()],
    source_trace: sourceTrace({ source_sheet: "Readiness_Gaps_Reentry" }),
    ...overrides,
  };
}

function reentryInteractionSource(overrides = {}) {
  return {
    reentry_interaction_candidate_ref: "REENTRY-INTERACTION-CAND-001",
    target_interaction_id: "B0-Q01",
    target_block: "B0",
    target_gate: "B0",
    prompt_ref: "PROMPT-B0-Q01",
    expected_response_type: "text",
    expected_resolution: "close missing evidence",
    visible_to_user_candidate: true,
    causal_candidate: true,
    source_trace: sourceTrace({ source_sheet: "Readiness_Gaps_Reentry" }),
    ...overrides,
  };
}

function reentryExecutionBoundarySource(overrides = {}) {
  return {
    reentry_execution_boundary_ref: "REENTRY-EXEC-BOUNDARY-001",
    future_interactions_prepared: true,
    future_phase5_payload_candidate_prepared: true,
    future_phase6_payload_candidate_prepared: true,
    budget_candidate_prepared: true,
    source_trace: sourceTrace({ source_sheet: "Readiness_Gaps_Reentry" }),
    ...overrides,
  };
}

function readySource(overrides = {}) {
  return {
    ready_decision_candidate_ref: "READY-CAND-001",
    all_critical_routes_closed: true,
    no_blocking_gap: true,
    no_semantic_projection_block: true,
    no_pst_deadlock_gap: true,
    evidence_sufficient: true,
    canonical_routes_closed: true,
    b0_closed: true,
    b2_closed: true,
    b3_closed: true,
    b7_non_diagnostic_boundary_respected: true,
    manual_review_required: false,
    reentry_required: false,
    source_trace: sourceTrace({ source_sheet: "Readiness_Gaps_Reentry" }),
    ...overrides,
  };
}

function readyWithFlagsSource(overrides = {}) {
  return {
    ready_with_flags_decision_candidate_ref: "READY-FLAGS-CAND-001",
    critical_routes_sufficient: true,
    non_blocking_gaps_exist: true,
    flags: [flagSource()],
    no_open_blocking_gap: true,
    no_critical_route_missing: true,
    no_b7_diagnosis: true,
    source_trace: sourceTrace({ source_sheet: "Readiness_Gaps_Reentry" }),
    ...overrides,
  };
}

function flagSource(overrides = {}) {
  return {
    flag_ref: "READY-FLAG-001",
    flag_type: "evidence_low_confidence",
    flag_reason: "non-blocking evidence confidence warning",
    flag_source_trace: sourceTrace({ source_sheet: "Readiness_Gaps_Reentry" }),
    source_gap_ref: "GAP-001",
    ...overrides,
  };
}

function missingEvidenceSource(overrides = {}) {
  return {
    blocked_missing_evidence_candidate_ref: "BLOCK-MISSING-EVIDENCE-001",
    missing_evidence_gap_refs: ["GAP-MISSING-EVIDENCE-001"],
    affected_route: "B0",
    affected_gate: "B0-Q01",
    affected_quadrant: "B0",
    evidence_required: "source evidence",
    evidence_missing_reason: "source evidence is required before readiness",
    source_trace: sourceTrace({ source_sheet: "Readiness_Gaps_Reentry" }),
    reentry_target: "B0-Q01",
    manual_review_required: true,
    ...overrides,
  };
}

function contradictionSource(overrides = {}) {
  return {
    blocked_contradiction_candidate_ref: "BLOCK-CONTRADICTION-001",
    contradiction_gap_refs: ["GAP-CONTRADICTION-001"],
    contradiction_type: "PM_vs_PF",
    source_gate_refs: ["CRG-001"],
    source_trace: sourceTrace({ source_sheet: "Readiness_Gaps_Reentry" }),
    reentry_target: "B2-Q01",
    manual_review_required: true,
    ...overrides,
  };
}

function missingRouteSource(overrides = {}) {
  return {
    blocked_missing_canonical_route_candidate_ref: "BLOCK-MISSING-ROUTE-001",
    missing_route_gap_refs: ["GAP-MISSING-ROUTE-001"],
    affected_route: "CR-B0",
    affected_critical_route: "B0",
    canonical_route_required: "B0 semantic entry route",
    route_missing_reason: "canonical route must be closed before readiness",
    source_trace: sourceTrace({ source_sheet: "Readiness_Gaps_Reentry" }),
    reentry_target: "B0-Q01",
    manual_review_required: true,
    ...overrides,
  };
}

function manualReviewSource(overrides = {}) {
  return {
    manual_review_required_candidate_ref: "MANUAL-REVIEW-CAND-001",
    manual_review_reason: "semantic_ambiguity",
    affected_gate: "SEM-001",
    affected_route: "CR-B0",
    affected_object_hint: "ActivitySemanticEntry",
    reviewer_role_hint: "runtime reviewer",
    review_question_candidate: "Review the unresolved semantic ambiguity before readiness.",
    source_trace: sourceTrace({ source_sheet: "Readiness_Gaps_Reentry" }),
    ...overrides,
  };
}

function engineSource(overrides = {}) {
  return {
    readiness_engine_evaluation_candidate_ref: "READY-ENGINE-CAND-001",
    run_id: "RUN-001",
    activity_runtime_run_id: "ACT-RUN-001",
    source_gate_result_refs: ["CRG-001"],
    source_readiness_gap_refs: ["GAP-001"],
    source_semantic_event_refs: ["SEM-EVENT-001"],
    source_pst_event_refs: ["PST-EVENT-001"],
    source_canonical_variable_refs: ["CVAR-001"],
    source_branching_decision_refs: ["BRANCH-001"],
    source_budget_state_refs: ["BUDGET-001"],
    source_trace: sourceTrace({ source_sheet: "Readiness_Gaps_Reentry" }),
    readiness_state_candidate: "manual_review_required",
    readiness_reason: "explicit local readiness candidate from Phase 10-A rule contract",
    manual_review_required: true,
    reentry_required: false,
    blocking_gap_refs: ["GAP-001"],
    carry_forward_gap_refs: ["CFG-001"],
    readiness_flags: ["manual_review_condition"],
    ...overrides,
  };
}

function ruleSource(overrides = {}) {
  return {
    runtime_readiness_rule_ref: "RUNTIME-READINESS-RULE-001",
    readiness_gaps_reentry_source_ref: "Readiness_Gaps_Reentry:2",
    rule_id: "RR-001",
    readiness_state: "manual_review_required",
    required_gate_status: "candidate_created",
    required_route_status: "route_missing",
    allowed_gap_type: "semantic_gap",
    blocking_gap_type: "missing_source_trace",
    manual_review_condition: "manual review condition is explicit",
    reentry_condition: "reentry condition is explicit",
    reentry_target: "B0-Q01",
    waiver_or_override_policy: "not_authorized_in_10A",
    source_node_ref: "RR-SRC-001",
    source_trace: sourceTrace({ source_sheet: "Readiness_Gaps_Reentry" }),
    ...overrides,
  };
}

function stateModelSource(overrides = {}) {
  return {
    readiness_state_model_candidate_ref: "READY-STATE-MODEL-001",
    readiness_state_source_trace: sourceTrace({ source_sheet: "Readiness_Gaps_Reentry" }),
    readiness_state_reason: "10-A supports only enumerated readiness state candidates.",
    ...overrides,
  };
}

function sourceTrace(overrides = {}) {
  return {
    source_document: "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
    source_sheet: "Critical_Routes",
    source_row_number: 2,
    raw_row: {
      source_node_ref: "PHASE10-SRC-001",
    },
    ...overrides,
  };
}

function deepMerge(base, overrides) {
  if (Array.isArray(base) || Array.isArray(overrides)) return overrides ?? base;
  if (!isObject(base) || !isObject(overrides)) return overrides ?? base;

  const merged = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    merged[key] = deepMerge(base[key], value);
  }
  return merged;
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
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
