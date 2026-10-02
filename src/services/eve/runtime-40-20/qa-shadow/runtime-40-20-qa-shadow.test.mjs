import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const service = loadModule("runtime-40-20-qa-shadow-service.ts", {
  "./runtime-40-20-qa-shadow-types": {},
});

test("Starts Phase 12 locally only when Phase 11 is closed local.", () => {
  assert.equal(run().phase12_started_local, true);
});

test("Blocks Phase 12 if phase11_closed_local=false.", () => {
  const result = run({ phase11_closeout: { phase11_closed_local: false } });
  assert.equal(result.status, "blocked_phase11_not_closed");
  assert.equal(result.phase12_started_local, false);
});

test("Blocks Phase 12 if ready_for_phase12_authorization=false.", () => {
  const result = run({ phase11_closeout: { ready_for_phase12_authorization: false } });
  assert.equal(result.status, "blocked_phase12_not_authorized");
  assert.equal(result.phase12_started_local, false);
});

test("Creates phase12 input revalidation decision.", () => {
  assert.equal(Boolean(run().phase12_input_revalidation), true);
});

[
  ["Consumes Phase 11 final closeout.", "phase11_final_closeout_available"],
  ["Consumes ExportPreviewService candidates.", "export_preview_service_candidates_available"],
  ["Consumes SCR preview candidates.", "scr_preview_candidates_available"],
  ["Consumes EvidenceBundle preview candidates.", "evidence_bundle_preview_candidates_available"],
  ["Consumes MDSB preview candidates.", "mdsb_preview_candidates_available"],
  ["Consumes combined preview candidates.", "combined_preview_candidates_available"],
  ["Consumes export blocking rules.", "export_blocking_rules_available"],
  ["Consumes export-preview audit candidates.", "export_preview_audit_candidates_available"],
  ["Consumes Phase 11 persistence boundary.", "phase11_persistence_boundary_available"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(run().phase12_input_revalidation[field], true);
  });
});

test("Does not recalculate export-preview.", () => {
  assert.equal(run().phase12_input_revalidation.export_preview_recalculated, false);
});

test("Does not modify Phase 11.", () => {
  assert.equal(run().phase12_input_revalidation.phase11_modified, false);
});

test("Does not activate runtime real.", () => {
  assert.equal(run().runtime_40_20_started, false);
  assert.equal(run().phase12_input_revalidation.runtime_real_started, false);
});

test("Creates QA run candidates.", () => {
  assert.equal(run().qa_run_candidates.length, 1);
});

[
  ["Supports catalog_import scope.", "catalog_import"],
  ["Supports runtime_contracts scope.", "runtime_contracts"],
  ["Supports phase_6_to_11_regression scope.", "phase_6_to_11_regression"],
  ["Supports export_preview_boundary scope.", "export_preview_boundary"],
  ["Supports security_scope.", "security_scope"],
  ["Supports shadow_pilot_readiness.", "shadow_pilot_readiness"],
  ["Supports activation_readiness.", "activation_readiness"],
].forEach(([name, scope]) => {
  test(name, () => {
    assert.equal(run().qa_run_candidates[0].qa_scope.includes(scope), true);
  });
});

[
  ["Supports draft_candidate status.", "draft_candidate"],
  ["Supports running_candidate status.", "running_candidate"],
  ["Supports passed_candidate status.", "passed_candidate"],
  ["Supports failed_candidate status.", "failed_candidate"],
  ["Supports blocked_candidate status.", "blocked_candidate"],
].forEach(([name, status]) => {
  test(name, () => {
    const candidate = service.Runtime40_20QAShadowService.buildQARunCandidates("case", [
      qaRunSource({ qa_status: status }),
    ])[0];
    assert.equal(candidate.qa_status, status);
  });
});

[
  ["runtime_qa_result real created remains false.", "runtime_qa_result_real_created"],
  ["QA green real created remains false.", "qa_green_real_created"],
  ["shadow pilot real started remains false.", "shadow_pilot_real_started"],
  ["runtime real started remains false.", "runtime_real_started"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(run().qa_run_candidates[0][field], false);
  });
});

test("Creates QA rule candidates.", () => {
  assert.equal(run().qa_rule_candidates.length, 1);
});

[
  ["QA rule requires qa_rule_id.", "qa_rule_id"],
  ["QA rule requires qa_test_code.", "qa_test_code"],
  ["QA rule requires qa_test_name.", "qa_test_name"],
  ["QA rule requires expected_result.", "expected_result"],
  ["QA rule requires blocking_level.", "blocking_level"],
].forEach(([name, field]) => {
  test(name, () => {
    const candidate = service.Runtime40_20QAShadowService.buildQARuleCandidates("case", [
      qaRuleSource({ [field]: undefined }),
    ])[0];
    assert.equal(candidate.candidate_allowed, false);
  });
});

test("QA rule requires source_trace.", () => {
  const candidate = service.Runtime40_20QAShadowService.buildQARuleCandidates("case", [
    qaRuleSource({ source_trace: {} }),
  ])[0];
  assert.equal(candidate.blocking_reasons.includes("missing_source_trace"), true);
});

test("QA rule blocks narrative-only QA.", () => {
  const candidate = service.Runtime40_20QAShadowService.buildQARuleCandidates("case", [
    qaRuleSource({ narrative_qa_only: true }),
  ])[0];
  assert.equal(candidate.blocking_reasons.includes("narrative_qa_attempted"), true);
  assert.equal(candidate.narrative_qa_only, false);
});

test("QA rule requires verifiable result.", () => {
  const candidate = service.Runtime40_20QAShadowService.buildQARuleCandidates("case", [
    qaRuleSource({ verifiable_result_required: false }),
  ])[0];
  assert.equal(candidate.blocking_reasons.includes("narrative_qa_attempted"), true);
  assert.equal(candidate.verifiable_result_required, true);
});

test("QA rule invented remains false.", () => {
  const candidate = service.Runtime40_20QAShadowService.buildQARuleCandidates("case", [
    qaRuleSource({ qa_rule_invented: true }),
  ])[0];
  assert.equal(candidate.blocking_reasons.includes("qa_rule_invented_attempted"), true);
  assert.equal(candidate.qa_rule_invented, false);
});

[
  ["Supports blocker level.", "blocker"],
  ["Supports high level.", "high"],
  ["Supports medium level.", "medium"],
  ["Supports advisory level.", "advisory"],
].forEach(([name, level]) => {
  test(name, () => {
    assert.equal(
      service.Runtime40_20QAShadowService.buildQARuleCandidates("case", [
        qaRuleSource({ blocking_level: level }),
      ])[0].blocking_level,
      level,
    );
  });
});

test("Creates T-001..T-012 result candidates.", () => {
  assert.equal(run().qa_import_runtime_base_result_candidates[0].results.length, 12);
});

[
  ["T-001 validates base count 40.", "T-001"],
  ["T-002 validates causal count 20.", "T-002"],
  ["T-003 validates source refs non-empty.", "T-003"],
  ["T-004 validates required fields complete.", "T-004"],
  ["T-005 validates B7 no IR.", "T-005"],
  ["T-006 validates B0-Q01 subfields complete.", "T-006"],
  ["T-007 validates C09 route_missing conditional.", "T-007"],
  ["T-008 validates B3-Q22 clean.", "T-008"],
  ["T-009 validates C09 variables present no duplicate.", "T-009"],
  ["T-010 validates PST-001..PST-006 present connected.", "T-010"],
  ["T-011 validates SEM-001..SEM-007 present.", "T-011"],
  ["T-012 validates VSM/AHE B7/C20 no registry/IR/export direct.", "T-012"],
].forEach(([name, code]) => {
  test(name, () => {
    assert.equal(hasResult(run().qa_import_runtime_base_result_candidates[0].results, code), true);
  });
});

test("Every T-001..T-012 result has pass_fail.", () => {
  assert.equal(run().qa_import_runtime_base_result_candidates[0].results.every((r) => r.pass_fail), true);
});

test("Every T-001..T-012 result has evidence_ref.", () => {
  assert.equal(run().qa_import_runtime_base_result_candidates[0].results.every((r) => r.evidence_ref), true);
});

test("Every T-001..T-012 result has source_trace.", () => {
  assert.equal(
    run().qa_import_runtime_base_result_candidates[0].results.every((r) => r.source_trace.source_document),
    true,
  );
});

test("Blocker failure blocks activation.", () => {
  const candidate = service.Runtime40_20QAShadowService.buildQAImportRuntimeBaseResultCandidates(
    "case",
    [testSource("T-001", { pass_fail: "fail", blocking_level: "blocker" })],
  )[0];
  assert.equal(candidate.activation_allowed, false);
  assert.equal(candidate.blocking_reasons.includes("blocker_failure_detected"), true);
});

test("Creates T-013..T-020 result candidates.", () => {
  assert.equal(run().qa_import_versioning_activation_result_candidates[0].results.length, 8);
});

[
  ["T-013 validates metadata_version_alignment.", "T-013"],
  ["T-014 validates required_sheets_present.", "T-014"],
  ["T-015 validates required_columns_present.", "T-015"],
  ["T-016 validates checksum_registered.", "T-016"],
  ["T-017 validates no_deprecated_version_labels.", "T-017"],
  ["T-018 validates catalog_activation_blocked_on_qa_failure.", "T-018"],
  ["T-019 validates source_node_integrity.", "T-019"],
  ["T-020 validates B7_no_direct_projection.", "T-020"],
].forEach(([name, code]) => {
  test(name, () => {
    assert.equal(
      hasResult(run().qa_import_versioning_activation_result_candidates[0].results, code),
      true,
    );
  });
});

[
  ["version_label aligned supported.", "version_label_aligned_supported"],
  ["DOCX/XLSX checksum non-null supported.", "docx_xlsx_checksum_non_null_supported"],
  ["orphan source code unjustified detection supported.", "orphan_source_code_unjustified_detection_supported"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(run().qa_import_versioning_activation_result_candidates[0][field], true);
  });
});

test("catalog_activation_allowed remains false.", () => {
  assert.equal(run().qa_import_versioning_activation_result_candidates[0].catalog_activation_allowed, false);
});

test("B7 direct projection detected remains false.", () => {
  assert.equal(run().qa_import_versioning_activation_result_candidates[0].b7_direct_projection_detected, false);
});

[
  ["Supabase touched remains false.", "supabase_touched"],
  ["SQL executed remains false.", "sql_executed"],
  ["Endpoint created remains false.", "endpoint_created"],
  ["export real created remains false.", "export_real_created"],
  ["parallel_export_payload real created remains false.", "parallel_export_payload_real_created"],
  ["Produccion Paralela started remains false.", "produccion_paralela_started"],
  ["phase12_closed_local remains false.", "phase12_closed_local"],
  ["ready_for_real_activation_authorization remains false.", "ready_for_real_activation_authorization"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(run()[field], false);
  });
});

test("registry/IR/diagnosis remain false.", () => {
  const result = run();
  assert.equal(result.registry_created, false);
  assert.equal(result.ir_created, false);
  assert.equal(result.diagnosis_created, false);
});

test("Creates regression QA candidates.", () => {
  assert.equal(runRegression().qa_regression_result_candidates.length, 6);
});

[
  ["Supports Phase 6 ResponseIngest regression.", "phase6_response_ingest"],
  ["Supports Phase 7 CanonicalVariable regression.", "phase7_canonical_variable"],
  ["Supports Phase 8 Branching Budget regression.", "phase8_branching_budget"],
  ["Supports Phase 9 Critical Gates regression.", "phase9_critical_gates"],
  ["Supports Phase 10 Readiness Reentry regression.", "phase10_readiness_reentry"],
  ["Supports Phase 11 Export Preview regression.", "phase11_export_preview"],
].forEach(([name, phaseScope]) => {
  test(name, () => {
    assert.equal(hasCandidate(runRegression().qa_regression_result_candidates, "phase_scope", phaseScope), true);
  });
});

[
  ["Regression captures test_command.", "test_command"],
  ["Regression captures test_status.", "test_status"],
  ["Regression captures test_count.", "test_count"],
  ["Regression captures failed_tests.", "failed_tests"],
  ["Regression captures environment_blocked reason.", "environment_blocked_reason"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.notEqual(runRegression().qa_regression_result_candidates[0][field], undefined);
  });
});

test("environment_blocked critical does not pass.", () => {
  const candidate = service.Runtime40_20QAShadowService.buildQARegressionResultCandidates("case", [
    regressionSource({ environment_blocked: true, environment_blocked_reason: "dependency unavailable" }),
  ])[0];
  assert.equal(candidate.test_status, "environment_blocked");
  assert.equal(candidate.candidate_allowed, false);
});

test("blocker failure blocks activation.", () => {
  const candidate = service.Runtime40_20QAShadowService.buildQARegressionResultCandidates("case", [
    regressionSource({ failed_count: 1, failed_tests: ["one blocker"], test_status: "fail" }),
  ])[0];
  assert.equal(candidate.blocking_reasons.includes("blocker_failure_detected"), true);
});

test("QA green real remains false.", () => {
  assert.equal(runRegression().qa_regression_result_candidates[0].qa_green_real_created, false);
});

test("Creates typecheck/build candidates.", () => {
  assert.equal(runRegression().qa_typecheck_build_candidates.length, 1);
});

[
  ["TypeScript availability is checked.", "typescript_available"],
  ["typecheck_status supported.", "typecheck_status"],
  ["build_status supported.", "build_status"],
  ["module import integrity supported.", "module_import_integrity"],
  ["unresolved import detected supported.", "unresolved_import_detected"],
  ["missing type export detected supported.", "missing_type_export_detected"],
  ["duplicate incompatible type detected supported.", "duplicate_type_incompatible_detected"],
  ["implicit Supabase runtime dependency detected supported.", "implicit_supabase_runtime_dependency_detected"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.notEqual(runRegression().qa_typecheck_build_candidates[0][field], undefined);
  });
});

test("endpoint required for local candidate mode remains false.", () => {
  assert.equal(
    runRegression().qa_typecheck_build_candidates[0].endpoint_required_for_local_candidate_mode,
    false,
  );
});

test("Creates CT critical scenario candidates.", () => {
  assert.equal(runRegression().qa_critical_scenario_result_candidates.length, 8);
});

[
  ["CT-B0-001 supported.", "CT-B0-001"],
  ["CT-B2-001 supported.", "CT-B2-001"],
  ["CT-B3-001 supported.", "CT-B3-001"],
  ["CT-B3-002 supported.", "CT-B3-002"],
  ["CT-B4-001 supported.", "CT-B4-001"],
  ["CT-B6-001 supported.", "CT-B6-001"],
  ["CT-B7-001 supported.", "CT-B7-001"],
  ["CT-BUD-001 supported.", "CT-BUD-001"],
].forEach(([name, code]) => {
  test(name, () => {
    assert.equal(hasCandidate(runRegression().qa_critical_scenario_result_candidates, "ct_code", code), true);
  });
});

test("CT requires expected gate/gap/readiness/export result.", () => {
  const candidate = service.Runtime40_20QAShadowService.buildQACriticalScenarioResultCandidates("case", [
    criticalScenarioSource({ expected_gate_result: undefined }),
  ])[0];
  assert.equal(candidate.blocking_reasons.includes("missing_expected_result"), true);
});

test("CT narrative pass remains false.", () => {
  assert.equal(runRegression().qa_critical_scenario_result_candidates[0].narrative_pass_used, false);
});

test("Creates B0/B2/B3/B7 critical route QA candidates.", () => {
  assert.equal(runRegression().qa_critical_route_result_candidates.length, 4);
});

[
  ["B0 route QA supported.", "B0"],
  ["B2 route QA supported.", "B2"],
  ["B3/C09 route QA supported.", "B3_C09"],
  ["B7/C20 route QA supported.", "B7_C20"],
].forEach(([name, code]) => {
  test(name, () => {
    assert.equal(hasCandidate(runRegression().qa_critical_route_result_candidates, "route_code", code), true);
  });
});

[
  ["route close from free text remains false.", "route_closed_from_free_text"],
  ["receiver_feedback from satisfaction general remains false.", "receiver_feedback_from_satisfaction_general"],
  ["B7 diagnosis remains false.", "b7_diagnosis_created"],
  ["B7/C20 direct export or registry remains false.", "b7_c20_direct_export_or_registry_created"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(runRegression().qa_critical_route_result_candidates[0][field], false);
  });
});

test("Creates SEM/PST gate QA candidates.", () => {
  assert.equal(runRegression().qa_sem_pst_gate_result_candidates.length, 13);
});

test("SEM-001 through SEM-007 supported.", () => {
  const codes = runRegression().qa_sem_pst_gate_result_candidates.map((candidate) => candidate.gate_code);
  assert.equal(["SEM-001", "SEM-002", "SEM-003", "SEM-004", "SEM-005", "SEM-006", "SEM-007"].every((code) => codes.includes(code)), true);
});

test("PST-001 through PST-006 supported.", () => {
  const codes = runRegression().qa_sem_pst_gate_result_candidates.map((candidate) => candidate.gate_code);
  assert.equal(["PST-001", "PST-002", "PST-003", "PST-004", "PST-005", "PST-006"].every((code) => codes.includes(code)), true);
});

test("MoC/PF/OLC projection when blocked remains false.", () => {
  assert.equal(runRegression().qa_sem_pst_gate_result_candidates[0].moc_pf_olc_projection_when_blocked, false);
});

test("timer/process state inferred remains false.", () => {
  assert.equal(runRegression().qa_sem_pst_gate_result_candidates[0].timer_or_process_state_inferred, false);
});

test("Creates Readiness/Reentry QA candidates.", () => {
  assert.equal(runRegression().qa_readiness_reentry_result_candidates.length, 10);
});

[
  ["ready candidate QA supported.", "ready_candidate"],
  ["ready_with_flags candidate QA supported.", "ready_with_flags_candidate"],
  ["blocked_by_missing_evidence QA supported.", "blocked_by_missing_evidence"],
  ["blocked_by_contradiction QA supported.", "blocked_by_contradiction"],
  ["blocked_by_missing_canonical_route QA supported.", "blocked_by_missing_canonical_route"],
  ["manual_review_required QA supported.", "manual_review_required"],
  ["reentry_required QA supported.", "reentry_required"],
  ["reentry planning QA supported.", "reentry_planning"],
  ["reentry execution boundary QA supported.", "reentry_execution_boundary"],
  ["readiness decision record candidate QA supported.", "readiness_decision_record_candidate"],
].forEach(([name, readinessCase]) => {
  test(name, () => {
    assert.equal(
      hasCandidate(runRegression().qa_readiness_reentry_result_candidates, "readiness_case", readinessCase),
      true,
    );
  });
});

[
  ["readiness_decision_record real created remains false.", "readiness_decision_record_real_created"],
  ["manual_review_request real created remains false.", "manual_review_request_real_created"],
  ["reentry_interactions real created remains false.", "reentry_interactions_real_created"],
  ["export-preview when blocked/manual/reentry remains false.", "export_preview_when_blocked_manual_review_reentry_created"],
  ["readiness final mutation remains false.", "readiness_final_mutation_created"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(runRegression().qa_readiness_reentry_result_candidates[0][field], false);
  });
});

test("Creates Export-preview QA candidates.", () => {
  assert.equal(runRegression().qa_export_preview_result_candidates.length, 9);
});

[
  ["SCR preview QA supported.", "scr_preview"],
  ["EvidenceBundle preview QA supported.", "evidence_bundle_preview"],
  ["MDSB preview QA supported.", "mdsb_preview"],
  ["combined preview QA supported.", "combined_preview"],
  ["export blocking rules QA supported.", "export_blocking_rules"],
  ["checksum/idempotency QA supported.", "checksum_idempotency"],
  ["payload state lifecycle QA supported.", "payload_state_lifecycle"],
  ["source trace envelope QA supported.", "source_trace_envelope"],
  ["supersession stale preview QA supported.", "supersession_stale_preview"],
].forEach(([name, exportPreviewCase]) => {
  test(name, () => {
    assert.equal(
      hasCandidate(runRegression().qa_export_preview_result_candidates, "export_preview_case", exportPreviewCase),
      true,
    );
  });
});

[
  ["placeholders remain false.", "placeholder_payload_detected"],
  ["payload_state sent remains false.", "payload_state_sent"],
  ["POST export executed remains false.", "post_export_executed"],
  ["parallel_export_payload real created remains false.", "parallel_export_payload_real_created"],
  ["Produccion Paralela started remains false.", "produccion_paralela_started"],
  ["registry/IR/diagnosis created remains false.", "registry_ir_diagnosis_created"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(runRegression().qa_export_preview_result_candidates[0][field], false);
  });
});

[
  ["Supabase touched remains false.", "supabase_touched"],
  ["SQL executed remains false.", "sql_executed"],
  ["Endpoint created remains false.", "endpoint_created"],
  ["phase12_closed_local remains false.", "phase12_closed_local"],
  ["ready_for_real_activation_authorization remains false.", "ready_for_real_activation_authorization"],
].forEach(([name, field]) => {
  test(`12-B ${name}`, () => {
    assert.equal(runRegression()[field], false);
  });
});

test("Creates security/scope/RLS QA candidates.", () => {
  assert.equal(runSecurity().security_scope_rls_candidates.length, 1);
});

[
  ["Security QA supports case_id scope.", "case_id_scope_verified"],
  ["Security QA supports role_id scope.", "role_id_scope_verified"],
  ["Security QA supports activity_id scope.", "activity_id_scope_verified"],
  ["Security QA supports run_id scope.", "run_id_scope_verified"],
  ["Security QA verifies tenant isolation.", "tenant_isolation_verified"],
  ["Security QA blocks anon.", "anon_blocked"],
  ["service_role not exposed.", "service_role_not_exposed"],
  ["audit trail required for override.", "audit_trail_required_for_override"],
  ["manual review actor authorization supported.", "manual_review_actor_authorized"],
  ["export actor/system authorization supported.", "export_actor_system_authorized"],
  ["security failure blocks activation.", "activation_blocked_if_security_fails"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(runSecurity().security_scope_rls_candidates[0][field], true);
  });
});

[
  ["service_role used in client remains false.", "service_role_used_in_client"],
  ["cross-case read remains false.", "cross_case_read_detected"],
  ["cross-case write remains false.", "cross_case_write_detected"],
  ["query outside case/tenant remains false.", "query_outside_case_or_tenant_detected"],
  ["RLS real migration remains false.", "rls_real_migration_created"],
  ["Security QA Supabase touched remains false.", "supabase_touched"],
  ["Security QA SQL executed remains false.", "sql_executed"],
  ["Security QA Endpoint created remains false.", "endpoint_created"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(runSecurity().security_scope_rls_candidates[0][field], false);
  });
});

test("Creates no-write boundary QA candidates.", () => {
  assert.equal(runSecurity().no_write_boundary_candidates.length, 1);
});

[
  ["scene_* write remains false.", "scene_write_detected"],
  ["mba_* write remains false.", "mba_write_detected"],
  ["parallel_production_runtime_artifacts write remains false.", "parallel_production_runtime_artifacts_write_detected"],
  ["registry write remains false.", "registry_write_detected"],
  ["IR write remains false.", "ir_write_detected"],
  ["diagnosis write remains false.", "diagnosis_write_detected"],
  ["Object Inventory write remains false.", "object_inventory_write_detected"],
  ["readiness real mutation remains false.", "readiness_real_mutation_detected"],
  ["runtime real start remains false.", "runtime_real_start_detected"],
  ["export real remains false.", "export_real_detected"],
  ["endpoint creation remains false.", "endpoint_creation_detected"],
  ["SQL execution remains false.", "sql_execution_detected"],
  ["Supabase touch remains false.", "supabase_touch_detected"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(runSecurity().no_write_boundary_candidates[0][field], false);
  });
});

test("write detection blocks activation.", () => {
  assert.equal(runSecurity().no_write_boundary_candidates[0].activation_blocked_if_write_detected, true);
});

test("Creates shadow pilot scope candidates.", () => {
  assert.equal(runSecurity().shadow_pilot_scope_candidates.length, 1);
});

[
  ["one_role_only supported.", "one_role_only"],
  ["one_primary_activity_only supported.", "one_primary_activity_only"],
  ["explicit human authorization required.", "explicit_human_authorization_required"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(runSecurity().shadow_pilot_scope_candidates[0][field], true);
  });
});

[
  ["selected_role_id supported.", "selected_role_id"],
  ["selected_activity_id supported.", "selected_activity_id"],
  ["selected_case_id supported.", "selected_case_id"],
  ["activity_runtime_run_candidate_ref supported.", "activity_runtime_run_candidate_ref"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(typeof runSecurity().shadow_pilot_scope_candidates[0][field], "string");
  });
});

[
  ["shadow_mode remains true.", "shadow_mode", true],
  ["production_mode remains false.", "production_mode", false],
  ["full runtime remains false.", "full_runtime_started", false],
  ["8 activities scale remains false.", "eight_activities_scale_started", false],
  ["multi-role scale remains false.", "multi_role_scale_started", false],
  ["external delivery remains false.", "external_delivery_created", false],
].forEach(([name, field, expected]) => {
  test(name, () => {
    assert.equal(runSecurity().shadow_pilot_scope_candidates[0][field], expected);
  });
});

test("Creates shadow pilot fixture candidates.", () => {
  assert.equal(runSecurity().shadow_pilot_fixture_candidates.length, 1);
});

[
  ["fixture_case supported.", "fixture_case"],
  ["fixture_role supported.", "fixture_role"],
  ["fixture_activity supported.", "fixture_activity"],
  ["fixture_responses supported.", "fixture_responses"],
  ["fixture_expected_variables supported.", "fixture_expected_variables"],
  ["fixture_expected_gates supported.", "fixture_expected_gates"],
  ["fixture_expected_readiness supported.", "fixture_expected_readiness"],
  ["fixture_expected_export_preview supported.", "fixture_expected_export_preview"],
  ["fixture_expected_no_go supported.", "fixture_expected_no_go"],
  ["fixture_expected_no_writes supported.", "fixture_expected_no_writes"],
  ["fixture checksum required.", "fixture_checksum"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.notEqual(runSecurity().shadow_pilot_fixture_candidates[0][field], undefined);
  });
});

[
  ["deterministic ids supported.", "deterministic_ids", true],
  ["sanitized user data supported.", "sanitized_user_data", true],
  ["real customer data used remains false.", "real_customer_data_used", false],
].forEach(([name, field, expected]) => {
  test(name, () => {
    assert.equal(runSecurity().shadow_pilot_fixture_candidates[0][field], expected);
  });
});

test("Creates shadow pilot rehearsal candidates.", () => {
  assert.equal(runSecurity().shadow_pilot_rehearsal_candidates.length, 1);
});

[
  ["shadow run candidate created.", "shadow_run_candidate_created"],
  ["fixture responses loaded.", "fixture_responses_loaded"],
  ["Phase 6 ResponseIngest candidate supported.", "phase6_response_ingest_candidate_executed"],
  ["Phase 7 CanonicalVariable candidate supported.", "phase7_canonical_variable_candidate_executed"],
  ["Phase 8 Branching/Budget candidate supported.", "phase8_branching_budget_candidate_executed"],
  ["Phase 9 Gates candidate supported.", "phase9_gates_candidate_executed"],
  ["Phase 10 Readiness candidate supported.", "phase10_readiness_candidate_executed"],
  ["Phase 11 Export-preview candidate supported.", "phase11_export_preview_candidate_executed"],
  ["expected vs actual comparison completed.", "expected_actual_comparison_completed"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(runSecurity().shadow_pilot_rehearsal_candidates[0][field], true);
  });
});

[
  ["divergence records supported.", "divergence_records"],
  ["false positive count supported.", "false_positive_count"],
  ["false negative count supported.", "false_negative_count"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.notEqual(runSecurity().shadow_pilot_rehearsal_candidates[0][field], undefined);
  });
});

[
  ["persistence real created remains false.", "persistence_real_created"],
  ["rehearsal production mode remains false.", "production_mode"],
  ["rehearsal external delivery remains false.", "external_delivery_created"],
  ["rehearsal runtime real started remains false.", "runtime_real_started"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(runSecurity().shadow_pilot_rehearsal_candidates[0][field], false);
  });
});

test("Creates shadow pilot observability candidates.", () => {
  assert.equal(runSecurity().shadow_pilot_observability_candidates.length, 1);
});

[
  ["shadow_event_log candidate created.", "shadow_event_log_candidate_created"],
  ["qa_event_log candidate created.", "qa_event_log_candidate_created"],
  ["divergence_report candidate created.", "divergence_report_candidate_created"],
  ["no_go_dashboard candidate created.", "no_go_dashboard_candidate_created"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(runSecurity().shadow_pilot_observability_candidates[0][field], true);
  });
});

[
  ["observability false positive count supported.", "false_positive_count"],
  ["observability false negative count supported.", "false_negative_count"],
  ["blocker_count supported.", "blocker_count"],
  ["warning_count supported.", "warning_count"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.notEqual(runSecurity().shadow_pilot_observability_candidates[0][field], undefined);
  });
});

[
  ["runtime_audit_trail real created remains false.", "runtime_audit_trail_real_created"],
  ["mba_event_ledger real created remains false.", "mba_event_ledger_real_created"],
  ["compliance_report real created remains false.", "compliance_report_real_created"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(runSecurity().shadow_pilot_observability_candidates[0][field], false);
  });
});

[
  ["12-C QA green real remains false.", "qa_green_real_created"],
  ["12-C shadow pilot real started remains false.", "shadow_pilot_real_started"],
  ["12-C Runtime 40/20 real started remains false.", "runtime_40_20_started"],
  ["12-C catalog activated remains false.", "catalog_activated"],
  ["12-C export real created remains false.", "export_real_created"],
  ["12-C parallel_export_payload real created remains false.", "parallel_export_payload_real_created"],
  ["12-C Produccion Paralela started remains false.", "produccion_paralela_started"],
  ["12-C phase12_closed_local remains false.", "phase12_closed_local"],
  ["12-C ready_for_real_activation_authorization remains false.", "ready_for_real_activation_authorization"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(runSecurity()[field], false);
  });
});

test("external typecheck debt remains registered before real activation.", () => {
  assert.equal(runSecurity().ready_for_real_activation_authorization, false);
});

test("Creates QA result candidates.", () => {
  assert.equal(runActivation().qa_result_candidates.length, 1);
});

[
  ["QA result includes qa_rule_results.", "qa_rule_results"],
  ["QA result includes CT results.", "ct_results"],
  ["QA result includes regression results.", "regression_results"],
  ["QA result includes typecheck result.", "typecheck_result"],
  ["QA result includes build result.", "build_result"],
  ["QA result includes security result.", "security_result"],
  ["QA result includes no-write result.", "no_write_result"],
  ["QA result includes shadow pilot result.", "shadow_pilot_result"],
  ["QA result supports pass_count.", "pass_count"],
  ["QA result supports fail_count.", "fail_count"],
  ["QA result supports blocked_count.", "blocked_count"],
  ["QA result supports environment_blocked_count.", "environment_blocked_count"],
  ["QA green candidate supported.", "qa_green_candidate"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.notEqual(runActivation().qa_result_candidates[0][field], undefined);
  });
});

test("12-D QA green real created remains false.", () => {
  assert.equal(runActivation().qa_result_candidates[0].qa_green_real_created, false);
});

test("Creates QA green gate candidates.", () => {
  assert.equal(runActivation().qa_green_gate_candidates.length, 1);
});

[
  ["all_blocking_tests_passed supported.", "all_blocking_tests_passed"],
  ["no_environment_blocked_critical supported.", "no_environment_blocked_critical"],
  ["no_security_blocker supported.", "no_security_blocker"],
  ["no_write_blocker supported.", "no_write_blocker"],
  ["shadow_pilot_passed_candidate supported.", "shadow_pilot_passed_candidate"],
  ["S5/delegated authorization supported.", "s5_delegated_authorization_required"],
  ["qa_green_candidate_created supported.", "qa_green_candidate_created"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.notEqual(runActivation().qa_green_gate_candidates[0][field], undefined);
  });
});

[
  ["no_export_real_detected supported.", "no_export_real_detected"],
  ["no_runtime_real_start supported.", "no_runtime_real_start"],
  ["external typecheck debt carried forward.", "external_typecheck_debt_registered"],
  ["repo-wide typecheck required before real activation.", "repo_wide_typecheck_required_before_real_activation"],
  ["build environment blocked carried forward.", "build_environment_blocked_non_code_path_length"],
  ["human authorization required.", "human_authorization_required"],
  ["operator authorization required.", "operator_authorization_required"],
  ["rollback plan required.", "rollback_plan_required"],
  ["abort path required.", "abort_path_required"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(runActivation().qa_green_gate_candidates[0][field], true);
  });
});

test("QA green gate qa_green_real_created remains false.", () => {
  assert.equal(runActivation().qa_green_gate_candidates[0].qa_green_real_created, false);
});

test("QA green gate activation_allowed remains false.", () => {
  assert.equal(runActivation().qa_green_gate_candidates[0].activation_allowed, false);
});

test("Creates activation readiness boundary candidates.", () => {
  assert.equal(runActivation().activation_readiness_boundary_candidates.length, 1);
});

[
  ["qa_green_candidate_ref supported.", "qa_green_candidate_ref"],
  ["shadow_pilot_candidate_ref supported.", "shadow_pilot_candidate_ref"],
  ["no_go_status supported.", "no_go_status"],
  ["rollback_plan_ref supported.", "rollback_plan_ref"],
  ["abort_authority_ref supported.", "abort_authority_ref"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(typeof runActivation().activation_readiness_boundary_candidates[0][field], "string");
  });
});

[
  ["security_scope_verified supported.", "security_scope_verified"],
  ["export_scope_verified supported.", "export_scope_verified"],
  ["runtime_scope_verified supported.", "runtime_scope_verified"],
  ["external typecheck debt carried to activation boundary.", "repo_wide_typecheck_debt_registered"],
  ["activation authorization required.", "activation_authorization_required"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(runActivation().activation_readiness_boundary_candidates[0][field], true);
  });
});

[
  ["activation_allowed remains false.", "activation_allowed"],
  ["runtime_full_start_allowed remains false.", "runtime_full_start_allowed"],
  ["production_parallel_allowed remains false.", "production_parallel_allowed"],
  ["supabase_write_allowed remains false.", "supabase_write_allowed"],
  ["endpoint_activation_allowed remains false.", "endpoint_activation_allowed"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(runActivation().activation_readiness_boundary_candidates[0][field], false);
  });
});

test("Creates rollback/abort plan QA candidates.", () => {
  assert.equal(runActivation().rollback_abort_plan_qa_candidates.length, 1);
});

[
  ["rollback_plan_candidate supported.", "rollback_plan_candidate"],
  ["rollback_trigger supported.", "rollback_trigger"],
  ["rollback_scope supported.", "rollback_scope"],
  ["rollback_owner supported.", "rollback_owner"],
  ["rollback_steps supported.", "rollback_steps"],
  ["rollback_test_result supported.", "rollback_test_result"],
  ["abort_path_candidate supported.", "abort_path_candidate"],
  ["abort_authority supported.", "abort_authority"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.notEqual(runActivation().rollback_abort_plan_qa_candidates[0][field], undefined);
  });
});

[
  ["data deleted without trace remains false.", "data_deleted_without_trace"],
  ["rollback mutates readiness remains false.", "rollback_mutates_readiness"],
  ["rollback mutates evidence remains false.", "rollback_mutates_evidence"],
  ["rollback mutates export payload remains false.", "rollback_mutates_export_payload"],
  ["rollback creates ghost tasks remains false.", "rollback_creates_ghost_tasks"],
  ["rollback real executed remains false.", "rollback_real_executed"],
  ["abort real executed remains false.", "abort_real_executed"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(runActivation().rollback_abort_plan_qa_candidates[0][field], false);
  });
});

test("rollback required before activation.", () => {
  assert.equal(runActivation().rollback_abort_plan_qa_candidates[0].rollback_required_before_activation, true);
});

test("Creates QA audit candidates.", () => {
  assert.equal(runActivation().qa_audit_candidates.length, 14);
});

[
  "qa_run_started",
  "qa_rule_executed",
  "qa_rule_passed",
  "qa_rule_failed",
  "qa_rule_blocked",
  "regression_executed",
  "shadow_pilot_rehearsal_started",
  "shadow_pilot_rehearsal_completed",
  "qa_green_candidate_created",
  "activation_readiness_candidate_created",
  "no_go_violation_detected",
  "rollback_plan_verified",
  "external_typecheck_debt_carried_forward",
  "activation_real_blocked",
].forEach((action) => {
  test(`${action} audit action supported.`, () => {
    assert.equal(hasCandidate(runActivation().qa_audit_candidates, "qa_audit_action", action), true);
  });
});

test("runtime_audit_trail real created remains false.", () => {
  assert.equal(
    runActivation().qa_audit_candidates.every((candidate) => candidate.runtime_audit_trail_real_created === false),
    true,
  );
});

test("Creates QA persistence boundary candidates.", () => {
  assert.equal(runActivation().qa_persistence_boundary_candidates.length, 1);
});

[
  ["local QA result candidate mode remains true.", "local_qa_result_candidate_mode"],
  ["local QA audit candidate mode remains true.", "local_qa_audit_candidate_mode"],
  ["local shadow pilot candidate mode remains true.", "local_shadow_pilot_candidate_mode"],
  ["local no-go dashboard candidate mode remains true.", "local_no_go_dashboard_candidate_mode"],
  ["local activation readiness candidate mode remains true.", "local_activation_readiness_candidate_mode"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(runActivation().qa_persistence_boundary_candidates[0][field], true);
  });
});

[
  ["real QA result record created remains false.", "real_qa_result_record_created"],
  ["real shadow pilot run created remains false.", "real_shadow_pilot_run_created"],
  ["real audit trail created remains false.", "real_audit_trail_created"],
  ["Supabase touched remains false.", "supabase_touched"],
  ["SQL executed remains false.", "sql_executed"],
  ["Endpoint created remains false.", "endpoint_created"],
  ["service_role used remains false.", "service_role_used"],
  ["service_role used in client remains false.", "service_role_used_in_client"],
  ["scene_* write detected remains false.", "scene_write_detected"],
  ["mba_* write detected remains false.", "mba_write_detected"],
  ["parallel_production_runtime_artifacts write detected remains false.", "parallel_production_runtime_artifacts_write_detected"],
  ["export real created remains false.", "export_real_created"],
  ["Runtime 40/20 real started remains false.", "runtime_40_20_started"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(runActivation().qa_persistence_boundary_candidates[0][field], false);
  });
});

test("12-D phase12_closed_local remains false.", () => {
  assert.equal(runActivation().phase12_closed_local, false);
});

test("12-D ready_for_real_activation_authorization remains false.", () => {
  assert.equal(runActivation().ready_for_real_activation_authorization, false);
});

function run(overrides = {}) {
  return service.Runtime40_20QAShadowService.buildPhase12QAFoundationLocalResult({
    case_id: "phase12-foundation",
    phase11_closeout: {
      phase11_closed_local: true,
      ready_for_phase12_authorization: true,
      phase12_started: false,
      ...(overrides.phase11_closeout ?? {}),
    },
    phase11_candidates: {
      phase11_final_closeout_available: true,
      export_preview_service_candidates: [{}],
      scr_preview_candidates: [{}],
      evidence_bundle_preview_candidates: [{}],
      mdsb_preview_candidates: [{}],
      combined_preview_candidates: [{}],
      export_blocking_rules: [{}],
      export_preview_audit_candidates: [{}],
      phase11_persistence_boundaries: [{}],
      ...(overrides.phase11_candidates ?? {}),
    },
    qa_run_sources: [qaRunSource()],
    qa_rule_sources: [qaRuleSource()],
    qa_import_runtime_base_sources: [],
    qa_import_versioning_activation_sources: [],
    boundary_guard: {},
    qa_run_sources: overrides.qa_run_sources ?? [qaRunSource()],
    qa_rule_sources: overrides.qa_rule_sources ?? [qaRuleSource()],
    qa_import_runtime_base_sources: overrides.qa_import_runtime_base_sources ?? [],
    qa_import_versioning_activation_sources:
      overrides.qa_import_versioning_activation_sources ?? [],
    boundary_guard: overrides.boundary_guard ?? {},
  });
}

function runRegression(overrides = {}) {
  return service.Runtime40_20QAShadowService.buildPhase12RegressionCriticalQALocalResult({
    case_id: "phase12-regression-critical",
    phase11_closeout: {
      phase11_closed_local: true,
      ready_for_phase12_authorization: true,
      phase12_started: false,
      ...(overrides.phase11_closeout ?? {}),
    },
    phase11_candidates: {
      phase11_final_closeout_available: true,
      export_preview_service_candidates: [{}],
      scr_preview_candidates: [{}],
      evidence_bundle_preview_candidates: [{}],
      mdsb_preview_candidates: [{}],
      combined_preview_candidates: [{}],
      export_blocking_rules: [{}],
      export_preview_audit_candidates: [{}],
      phase11_persistence_boundaries: [{}],
      ...(overrides.phase11_candidates ?? {}),
    },
    qa_run_sources: overrides.qa_run_sources ?? [qaRunSource()],
    qa_rule_sources: overrides.qa_rule_sources ?? [qaRuleSource()],
    qa_import_runtime_base_sources: overrides.qa_import_runtime_base_sources ?? [],
    qa_import_versioning_activation_sources:
      overrides.qa_import_versioning_activation_sources ?? [],
    qa_regression_sources: overrides.qa_regression_sources ?? [],
    qa_typecheck_build_sources: overrides.qa_typecheck_build_sources ?? [typecheckBuildSource()],
    qa_critical_scenario_sources: overrides.qa_critical_scenario_sources ?? [],
    qa_critical_route_sources: overrides.qa_critical_route_sources ?? [],
    qa_sem_pst_gate_sources: overrides.qa_sem_pst_gate_sources ?? [],
    qa_readiness_reentry_sources: overrides.qa_readiness_reentry_sources ?? [],
    qa_export_preview_sources: overrides.qa_export_preview_sources ?? [],
    boundary_guard: overrides.boundary_guard ?? {},
  });
}

function runSecurity(overrides = {}) {
  return service.Runtime40_20QAShadowService.buildPhase12SecurityNoWriteShadowRehearsalObservabilityLocalResult({
    case_id: "phase12-security-shadow",
    phase11_closeout: {
      phase11_closed_local: true,
      ready_for_phase12_authorization: true,
      phase12_started: false,
      ...(overrides.phase11_closeout ?? {}),
    },
    phase11_candidates: {
      phase11_final_closeout_available: true,
      export_preview_service_candidates: [{}],
      scr_preview_candidates: [{}],
      evidence_bundle_preview_candidates: [{}],
      mdsb_preview_candidates: [{}],
      combined_preview_candidates: [{}],
      export_blocking_rules: [{}],
      export_preview_audit_candidates: [{}],
      phase11_persistence_boundaries: [{}],
      ...(overrides.phase11_candidates ?? {}),
    },
    qa_run_sources: overrides.qa_run_sources ?? [qaRunSource()],
    qa_rule_sources: overrides.qa_rule_sources ?? [qaRuleSource()],
    qa_import_runtime_base_sources: overrides.qa_import_runtime_base_sources ?? [],
    qa_import_versioning_activation_sources:
      overrides.qa_import_versioning_activation_sources ?? [],
    qa_regression_sources: overrides.qa_regression_sources ?? [],
    qa_typecheck_build_sources: overrides.qa_typecheck_build_sources ?? [typecheckBuildSource()],
    qa_critical_scenario_sources: overrides.qa_critical_scenario_sources ?? [],
    qa_critical_route_sources: overrides.qa_critical_route_sources ?? [],
    qa_sem_pst_gate_sources: overrides.qa_sem_pst_gate_sources ?? [],
    qa_readiness_reentry_sources: overrides.qa_readiness_reentry_sources ?? [],
    qa_export_preview_sources: overrides.qa_export_preview_sources ?? [],
    qa_security_scope_rls_sources: overrides.qa_security_scope_rls_sources ?? [securityShadowSource()],
    qa_no_write_boundary_sources: overrides.qa_no_write_boundary_sources ?? [securityShadowSource()],
    qa_shadow_pilot_scope_sources: overrides.qa_shadow_pilot_scope_sources ?? [securityShadowSource()],
    qa_shadow_pilot_fixture_sources: overrides.qa_shadow_pilot_fixture_sources ?? [securityShadowSource()],
    qa_shadow_pilot_rehearsal_sources:
      overrides.qa_shadow_pilot_rehearsal_sources ?? [securityShadowSource()],
    qa_shadow_pilot_observability_sources:
      overrides.qa_shadow_pilot_observability_sources ?? [securityShadowSource()],
    boundary_guard: overrides.boundary_guard ?? {},
  });
}

function runActivation(overrides = {}) {
  return service.Runtime40_20QAShadowService.buildPhase12QAResultGreenActivationRollbackAuditPersistenceLocalResult({
    case_id: "phase12-result-green-activation",
    phase11_closeout: {
      phase11_closed_local: true,
      ready_for_phase12_authorization: true,
      phase12_started: false,
      ...(overrides.phase11_closeout ?? {}),
    },
    phase11_candidates: {
      phase11_final_closeout_available: true,
      export_preview_service_candidates: [{}],
      scr_preview_candidates: [{}],
      evidence_bundle_preview_candidates: [{}],
      mdsb_preview_candidates: [{}],
      combined_preview_candidates: [{}],
      export_blocking_rules: [{}],
      export_preview_audit_candidates: [{}],
      phase11_persistence_boundaries: [{}],
      ...(overrides.phase11_candidates ?? {}),
    },
    qa_run_sources: overrides.qa_run_sources ?? [qaRunSource()],
    qa_rule_sources: overrides.qa_rule_sources ?? [qaRuleSource()],
    qa_import_runtime_base_sources: overrides.qa_import_runtime_base_sources ?? [],
    qa_import_versioning_activation_sources:
      overrides.qa_import_versioning_activation_sources ?? [],
    qa_regression_sources: overrides.qa_regression_sources ?? [],
    qa_typecheck_build_sources: overrides.qa_typecheck_build_sources ?? [typecheckBuildSource()],
    qa_critical_scenario_sources: overrides.qa_critical_scenario_sources ?? [],
    qa_critical_route_sources: overrides.qa_critical_route_sources ?? [],
    qa_sem_pst_gate_sources: overrides.qa_sem_pst_gate_sources ?? [],
    qa_readiness_reentry_sources: overrides.qa_readiness_reentry_sources ?? [],
    qa_export_preview_sources: overrides.qa_export_preview_sources ?? [],
    qa_security_scope_rls_sources: overrides.qa_security_scope_rls_sources ?? [securityShadowSource()],
    qa_no_write_boundary_sources: overrides.qa_no_write_boundary_sources ?? [securityShadowSource()],
    qa_shadow_pilot_scope_sources: overrides.qa_shadow_pilot_scope_sources ?? [securityShadowSource()],
    qa_shadow_pilot_fixture_sources: overrides.qa_shadow_pilot_fixture_sources ?? [securityShadowSource()],
    qa_shadow_pilot_rehearsal_sources:
      overrides.qa_shadow_pilot_rehearsal_sources ?? [securityShadowSource()],
    qa_shadow_pilot_observability_sources:
      overrides.qa_shadow_pilot_observability_sources ?? [securityShadowSource()],
    qa_result_green_activation_sources:
      overrides.qa_result_green_activation_sources ?? [resultGreenActivationSource()],
    boundary_guard: overrides.boundary_guard ?? {},
  });
}

function qaRunSource(overrides = {}) {
  return {
    qa_run_candidate_ref: "qa-run-candidate-1",
    run_id: "run-1",
    catalog_version_id: "runtime-40-20-v1.1.1",
    qa_scope: [
      "catalog_import",
      "runtime_contracts",
      "phase_6_to_11_regression",
      "export_preview_boundary",
      "security_scope",
      "shadow_pilot_readiness",
      "activation_readiness",
    ],
    qa_status: "draft_candidate",
    source_trace: sourceTrace("QA-RUN"),
    ...overrides,
  };
}

function qaRuleSource(overrides = {}) {
  return {
    qa_rule_candidate_ref: "qa-rule-candidate-1",
    qa_checklist_ref: "QA_Checklist",
    runtime_qa_rule_ref: "runtime_qa_rule:T-001",
    qa_rule_id: "T-001",
    qa_rule_group: "import_runtime_base",
    qa_test_code: "T-001",
    qa_test_name: "base_count_40",
    expected_result: "Base interactions count equals 40.",
    blocking_level: "blocker",
    pass_fail_required: true,
    source_node_ref: "QA_Checklist:T-001",
    source_trace: sourceTrace("T-001"),
    narrative_qa_only: false,
    verifiable_result_required: true,
    qa_rule_invented: false,
    ...overrides,
  };
}

function testSource(code, overrides = {}) {
  return {
    qa_test_code: code,
    qa_test_name: `${code}_name`,
    expected_result: `${code} expected result`,
    actual_result: `${code} actual result`,
    pass_fail: "pass",
    blocking_level: "blocker",
    evidence_ref: `${code}:evidence`,
    source_trace: sourceTrace(code),
    activation_blocked_if_failed: true,
    ...overrides,
  };
}

function regressionSource(overrides = {}) {
  return {
    phase_scope: "phase6_response_ingest",
    module_name: "ResponseIngest",
    test_command: "node --test src/services/eve/runtime-40-20/response-ingest/runtime-40-20-response-ingest.test.mjs",
    test_status: "pass",
    test_count: 169,
    passed_count: 169,
    failed_count: 0,
    failed_tests: [],
    environment_blocked: false,
    environment_blocked_reason: "",
    source_trace: sourceTrace("phase6_response_ingest"),
    ...overrides,
  };
}

function typecheckBuildSource(overrides = {}) {
  return {
    typescript_available: true,
    typecheck_command: "npx.cmd tsc --noEmit --pretty false",
    typecheck_status: "fail",
    build_command: "npm run build",
    build_status: "environment_blocked",
    module_import_integrity: true,
    unresolved_import_detected: false,
    missing_type_export_detected: false,
    duplicate_type_incompatible_detected: false,
    implicit_supabase_runtime_dependency_detected: false,
    endpoint_required_for_local_candidate_mode: false,
    environment_blocked: true,
    environment_blocked_reason: "npm build blocked by Windows path length in Turbopack; tsc reports pre-existing canonical catalog syntax errors.",
    source_trace: sourceTrace("typecheck_build"),
    ...overrides,
  };
}

function securityShadowSource(overrides = {}) {
  return {
    source_trace: sourceTrace("12-C-security-shadow"),
    service_role_used_in_client: false,
    cross_case_read_detected: false,
    cross_case_write_detected: false,
    query_outside_case_or_tenant_detected: false,
    rls_real_migration_created: false,
    supabase_previously_touched: false,
    sql_previously_executed: false,
    endpoint_previously_created: false,
    scene_write_attempted: false,
    mba_write_attempted: false,
    parallel_production_runtime_artifacts_write_attempted: false,
    registry_write_attempted: false,
    ir_write_attempted: false,
    diagnosis_write_attempted: false,
    object_inventory_write_attempted: false,
    readiness_real_mutation_attempted: false,
    runtime_real_start_attempted: false,
    export_real_attempted: false,
    shadow_pilot_real_start_attempted: false,
    production_mode_attempted: false,
    eight_activities_scale_attempted: false,
    multi_role_scale_attempted: false,
    external_delivery_attempted: false,
    real_customer_data_used: false,
    real_customer_data_authorized: false,
    runtime_audit_trail_real_creation_attempted: false,
    mba_event_ledger_real_creation_attempted: false,
    compliance_report_real_creation_attempted: false,
    ...overrides,
  };
}

function resultGreenActivationSource(overrides = {}) {
  return {
    source_trace: sourceTrace("12-D-result-green-activation"),
    repo_wide_typecheck_debt_registered: true,
    repo_wide_typecheck_required_before_real_activation: true,
    build_environment_blocked_non_code_path_length: true,
    qa_green_real_creation_attempted: false,
    activation_allowed_attempted: false,
    runtime_full_start_attempted: false,
    production_parallel_attempted: false,
    supabase_write_allowed_attempted: false,
    endpoint_activation_attempted: false,
    rollback_real_execution_attempted: false,
    abort_real_execution_attempted: false,
    data_deleted_without_trace_attempted: false,
    rollback_mutates_readiness_attempted: false,
    rollback_mutates_evidence_attempted: false,
    rollback_mutates_export_payload_attempted: false,
    rollback_creates_ghost_tasks_attempted: false,
    runtime_audit_trail_real_creation_attempted: false,
    qa_result_record_real_creation_attempted: false,
    shadow_pilot_run_real_creation_attempted: false,
    supabase_previously_touched: false,
    sql_previously_executed: false,
    endpoint_previously_created: false,
    service_role_used_in_client: false,
    scene_write_attempted: false,
    mba_write_attempted: false,
    parallel_production_runtime_artifacts_write_attempted: false,
    export_real_attempted: false,
    runtime_real_start_attempted: false,
    ...overrides,
  };
}

function criticalScenarioSource(overrides = {}) {
  return {
    ct_code: "CT-B0-001",
    ct_name: "partial activity without output",
    expected_gate_result: "gate blocks",
    expected_gap_result: "gap created",
    expected_readiness_result: "readiness blocked",
    expected_export_block_result: "export blocked",
    actual_gate_result: "gate blocks",
    actual_gap_result: "gap created",
    actual_readiness_result: "readiness blocked",
    actual_export_block_result: "export blocked",
    pass_fail: "pass",
    blocking_level: "blocker",
    source_trace: sourceTrace("CT-B0-001"),
    ...overrides,
  };
}

function sourceTrace(sourceNodeRef) {
  return {
    source_document: "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
    source_sheet: "QA_Checklist",
    source_row_number: 1,
    source_node_ref: sourceNodeRef,
  };
}

function hasResult(results, code) {
  return results.some((result) => result.qa_test_code === code && result.pass_fail === "pass");
}

function hasCandidate(candidates, field, value) {
  return candidates.some((candidate) => candidate[field] === value);
}

function loadModule(filename, mocks = {}) {
  const fullPath = new URL(filename, import.meta.url);
  const source = readFileSync(fullPath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const exports = {};
  const module = { exports };
  const require = (specifier) => {
    if (specifier in mocks) return mocks[specifier];
    throw new Error(`Unexpected import: ${specifier}`);
  };
  vm.runInNewContext(transpiled, { exports, module, require }, { filename });
  return module.exports;
}
