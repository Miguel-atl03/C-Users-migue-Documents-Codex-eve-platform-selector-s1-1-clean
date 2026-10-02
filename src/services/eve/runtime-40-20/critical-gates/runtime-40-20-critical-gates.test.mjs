import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const service = loadModule("runtime-40-20-critical-gates-service.ts", {
  "./runtime-40-20-critical-gates-types": {},
});

test("1. Starts Phase 9 locally only when Phase 8 is closed local.", () => {
  const result = run();

  assert.equal(result.phase9_input_revalidation.phase8_closed_local, true);
  assert.equal(result.phase9_started_local, true);
});

test("2. Blocks Phase 9 if phase8_closed_local=false.", () => {
  const result = run({
    phase8_closeout: {
      phase8_closed_local: false,
      ready_for_phase9_authorization: true,
    },
  });

  assert.equal(result.status, "blocked_phase8_not_closed");
  assert.equal(result.phase9_started_local, false);
});

test("3. Blocks Phase 9 if ready_for_phase9_authorization=false.", () => {
  const result = run({
    phase8_closeout: {
      phase8_closed_local: true,
      ready_for_phase9_authorization: false,
    },
  });

  assert.equal(result.status, "blocked_phase9_not_authorized");
  assert.equal(result.phase9_started_local, false);
});

test("4. Creates phase9_input_revalidation decision.", () => {
  assert.equal(Boolean(run().phase9_input_revalidation), true);
});

test("5. Consumes branching_decision candidates.", () => {
  assert.equal(run().phase9_input_revalidation.branching_decision_candidates_available, true);
});

test("6. Consumes trigger_evaluation candidates.", () => {
  assert.equal(run().phase9_input_revalidation.trigger_evaluation_candidates_available, true);
});

test("7. Consumes causal_score candidates.", () => {
  assert.equal(run().phase9_input_revalidation.causal_score_candidates_available, true);
});

test("8. Consumes route_status candidates.", () => {
  assert.equal(run().phase9_input_revalidation.route_status_candidates_available, true);
});

test("9. Consumes gap_flag/gap_type candidates.", () => {
  assert.equal(run().phase9_input_revalidation.gap_flag_candidates_available, true);
});

test("10. Consumes carry_forward_gap candidates.", () => {
  assert.equal(run().phase9_input_revalidation.carry_forward_gap_candidates_available, true);
});

test("11. Consumes reentry candidates.", () => {
  assert.equal(run().phase9_input_revalidation.reentry_candidates_available, true);
});

test("12. Consumes budget_exhaustion guards.", () => {
  assert.equal(run().phase9_input_revalidation.budget_exhaustion_guards_available, true);
});

test("13. Does not recalculate branching.", () => {
  assert.equal(run().phase9_input_revalidation.branching_recalculated, false);
});

test("14. Does not modify Phase 8.", () => {
  assert.equal(run().phase9_input_revalidation.phase8_modified, false);
});

test("15. Does not start Phase 10.", () => {
  assert.equal(run().phase9_input_revalidation.phase10_started, false);
});

test("16. Creates gate framework candidates.", () => {
  assert.equal(run().gate_evaluation_candidates.length, 4);
});

test("17. Gate framework requires protected_route_id.", () => {
  const result = run({
    gate_evaluation_sources: [
      gateSource({
        protected_route_id: undefined,
      }),
    ],
    route_gate_result_sources: [],
  });

  assert.equal(
    result.gate_evaluation_candidates[0].blocking_reasons.includes("missing_protected_route_id"),
    true,
  );
});

test("18. Gate framework requires protected_object_hint.", () => {
  const result = run({
    gate_evaluation_sources: [
      gateSource({
        protected_object_hint: undefined,
      }),
    ],
    route_gate_result_sources: [],
  });

  assert.equal(
    result.gate_evaluation_candidates[0].blocking_reasons.includes("missing_protected_object_hint"),
    true,
  );
});

test("19. Gate framework requires source_trace.", () => {
  const result = run({
    gate_evaluation_sources: [
      gateSource({
        source_trace: undefined,
      }),
    ],
    route_gate_result_sources: [],
  });

  assert.equal(result.status, "blocked_missing_source_trace");
});

test("20. Gate framework requires finding_code.", () => {
  const result = run({
    gate_evaluation_sources: [
      gateSource({
        finding_code: undefined,
      }),
    ],
    route_gate_result_sources: [],
  });

  assert.equal(
    result.gate_evaluation_candidates[0].blocking_reasons.includes("missing_finding_code"),
    true,
  );
});

test("21. summary_ready remains true.", () => {
  assert.equal(run().gate_evaluation_candidates[0].summary_ready, true);
});

test("22. projected_to_mba remains false.", () => {
  assert.equal(run().gate_evaluation_candidates[0].projected_to_mba, false);
});

test("23. runtime_audit_trail real created remains false.", () => {
  assert.equal(run().gate_evaluation_candidates[0].runtime_audit_trail_real_created, false);
});

test("24. readiness final created remains false.", () => {
  assert.equal(run().gate_evaluation_candidates[0].readiness_final_created, false);
});

test("25. export-preview created remains false.", () => {
  assert.equal(run().gate_evaluation_candidates[0].export_preview_created, false);
});

test("26. Creates B0 semantic entry gate candidate.", () => {
  assert.equal(run().b0_semantic_entry_gate_candidates.length, 1);
});

test("27. B0 validates action_verb.", () => {
  assert.equal(run().b0_semantic_entry_gate_candidates[0].action_verb_present, true);
});

test("28. B0 validates input_or_object.", () => {
  assert.equal(run().b0_semantic_entry_gate_candidates[0].input_or_object_present, true);
});

test("29. B0 validates procedure_or_standard when required.", () => {
  assert.equal(run().b0_semantic_entry_gate_candidates[0].procedure_or_standard_present, true);
});

test("30. B0 validates output_or_result.", () => {
  assert.equal(run().b0_semantic_entry_gate_candidates[0].output_or_result_present, true);
});

test("31. B0 preserves user_correction_note.", () => {
  assert.equal(run().b0_semantic_entry_gate_candidates[0].user_correction_note_preserved, true);
});

test("32. B0 blocks unconfirmed preload.", () => {
  const candidate = run({
    b0_semantic_entry_sources: [
      b0Source({
        preload_confirmed: false,
      }),
    ],
  }).b0_semantic_entry_gate_candidates[0];

  assert.equal(candidate.blocking_reasons.includes("preload_not_confirmed"), true);
});

test("33. B0 blocks ambiguous activity text.", () => {
  const candidate = run({
    b0_semantic_entry_sources: [
      b0Source({
        ambiguous_activity_text: true,
      }),
    ],
  }).b0_semantic_entry_gate_candidates[0];

  assert.equal(candidate.ambiguous_activity_text_blocked, true);
});

test("34. B0 creates readiness_gap_record candidate when minimum structure missing.", () => {
  const candidate = run({
    b0_semantic_entry_sources: [
      b0Source({
        output_or_result: undefined,
      }),
    ],
  }).b0_semantic_entry_gate_candidates[0];

  assert.equal(candidate.readiness_gap_record_candidate_created, true);
});

test("35. B0 does not declare ready.", () => {
  assert.equal(run().b0_semantic_entry_gate_candidates[0].ready_declared, false);
});

test("36. B0 does not create SceneCanonicalRecord real.", () => {
  assert.equal(run().b0_semantic_entry_gate_candidates[0].scene_canonical_record_real_created, false);
});

test("37. Creates B2 transformation exception gate candidate.", () => {
  assert.equal(run().b2_transformation_exception_gate_candidates.length, 1);
});

test("38. B2 distinguishes exception exists/type/description/route_unresolved.", () => {
  const candidate = run().b2_transformation_exception_gate_candidates[0];

  assert.equal(candidate.transformation_exception_exists, true);
  assert.equal(candidate.transformation_exception_type, "route_unresolved");
  assert.equal(candidate.transformation_exception_description, "Exception text with unresolved canonical route.");
  assert.equal(candidate.transformation_exception_route_unresolved, true);
});

test("39. B2 blocks textual exception without closed route.", () => {
  assert.equal(
    run().b2_transformation_exception_gate_candidates[0].textual_exception_without_closed_route_blocked,
    true,
  );
});

test("40. B2 creates blocked_by_missing_canonical_route candidate.", () => {
  assert.equal(
    run().b2_transformation_exception_gate_candidates[0].blocked_by_missing_canonical_route_candidate_created,
    true,
  );
});

test("41. B2 creates route_gap candidate.", () => {
  assert.equal(run().b2_transformation_exception_gate_candidates[0].route_gap_candidate_created, true);
});

test("42. B2 does not create closed variable from free text.", () => {
  assert.equal(
    run().b2_transformation_exception_gate_candidates[0].closed_variable_from_free_text_created,
    false,
  );
});

test("43. B2 does not project to PF/OLC without closed route.", () => {
  assert.equal(run().b2_transformation_exception_gate_candidates[0].pf_olc_projection_without_closed_route, false);
});

test("44. Creates B3 receiver feedback gate candidate.", () => {
  assert.equal(run().b3_receiver_feedback_gate_candidates.length, 1);
});

test("45. B3 preserves receiver_feedback_exists.", () => {
  assert.equal(run().b3_receiver_feedback_gate_candidates[0].receiver_feedback_exists, true);
});

test("46. B3 preserves receiver_feedback when explicit.", () => {
  assert.equal(run().b3_receiver_feedback_gate_candidates[0].receiver_feedback, "Receiver asked for correction.");
});

test("47. B3 separates receiver_satisfaction.", () => {
  assert.equal(run().b3_receiver_feedback_gate_candidates[0].receiver_satisfaction_separated, true);
});

test("48. B3 separates delivery_failure.", () => {
  assert.equal(run().b3_receiver_feedback_gate_candidates[0].delivery_failure_separated, true);
});

test("49. B3 blocks satisfaction general as feedback.", () => {
  const candidate = run({
    b3_receiver_feedback_sources: [
      b3Source({
        receiver_satisfaction_as_feedback_attempted: true,
      }),
    ],
  }).b3_receiver_feedback_gate_candidates[0];

  assert.equal(candidate.satisfaction_general_as_feedback_blocked, true);
});

test("50. B3 blocks ambiguous comment as feedback.", () => {
  const candidate = run({
    b3_receiver_feedback_sources: [
      b3Source({
        ambiguous_comment_as_receiver_feedback_attempted: true,
      }),
    ],
  }).b3_receiver_feedback_gate_candidates[0];

  assert.equal(candidate.ambiguous_comment_as_receiver_feedback_blocked, true);
});

test("51. B3 blocks C09 closed by wrong route.", () => {
  const candidate = run({
    b3_receiver_feedback_sources: [
      b3Source({
        c09_closed_by_wrong_route_attempted: true,
      }),
    ],
  }).b3_receiver_feedback_gate_candidates[0];

  assert.equal(candidate.blocking_reasons.includes("c09_closed_by_wrong_route_attempted"), true);
});

test("52. B3 preserves route_missing when no canonical route.", () => {
  assert.equal(
    run().b3_receiver_feedback_gate_candidates[0].route_missing_preserved_when_no_canonical_route,
    true,
  );
});

test("53. B3 does not create ReceiverFeedbackObject real.", () => {
  assert.equal(run().b3_receiver_feedback_gate_candidates[0].receiver_feedback_object_real_created, false);
});

test("54. Creates B7/C20 non-diagnostic gate candidate.", () => {
  assert.equal(run().b7_c20_non_diagnostic_boundary_gate_candidates.length, 1);
});

test("55. B7-Q39 boundary supported.", () => {
  assert.equal(run().b7_c20_non_diagnostic_boundary_gate_candidates[0].b7_q39_boundary_supported, true);
});

test("56. B7-Q40 boundary supported.", () => {
  assert.equal(run().b7_c20_non_diagnostic_boundary_gate_candidates[0].b7_q40_boundary_supported, true);
});

test("57. C20 boundary supported.", () => {
  assert.equal(run().b7_c20_non_diagnostic_boundary_gate_candidates[0].c20_boundary_supported, true);
});

test("58. B7 diagnostic_status remains non_diagnostic.", () => {
  assert.equal(run().b7_c20_non_diagnostic_boundary_gate_candidates[0].diagnostic_status_non_diagnostic, true);
});

test("59. B7 signal_status remains preclassification_only.", () => {
  assert.equal(run().b7_c20_non_diagnostic_boundary_gate_candidates[0].signal_status_preclassification_only, true);
});

test("60. B7 blocks direct MoC.", () => {
  assert.equal(run().b7_c20_non_diagnostic_boundary_gate_candidates[0].moc_direct_blocked, true);
});

test("61. B7 blocks direct registry.", () => {
  assert.equal(run().b7_c20_non_diagnostic_boundary_gate_candidates[0].registry_direct_blocked, true);
});

test("62. B7 blocks direct IR.", () => {
  assert.equal(run().b7_c20_non_diagnostic_boundary_gate_candidates[0].ir_direct_blocked, true);
});

test("63. B7 blocks direct export.", () => {
  assert.equal(run().b7_c20_non_diagnostic_boundary_gate_candidates[0].export_direct_blocked, true);
});

test("64. B7 blocks diagnosis/root cause/monetization/final narrative.", () => {
  const candidate = run().b7_c20_non_diagnostic_boundary_gate_candidates[0];

  assert.equal(candidate.diagnosis_blocked, true);
  assert.equal(candidate.root_cause_blocked, true);
  assert.equal(candidate.monetization_blocked, true);
  assert.equal(candidate.final_narrative_blocked, true);
});

test("65. B7 blocks VSM/AHE final.", () => {
  assert.equal(run().b7_c20_non_diagnostic_boundary_gate_candidates[0].vsm_ahe_final_blocked, true);
});

test("66. B7 allows only readiness/gap/preclassification candidate.", () => {
  const candidate = run({
    b7_c20_non_diagnostic_sources: [
      b7Source({
        moc_direct_attempted: true,
      }),
    ],
  }).b7_c20_non_diagnostic_boundary_gate_candidates[0];

  assert.equal(candidate.readiness_gap_record_candidate_created_if_elevation_attempted, true);
  assert.equal(candidate.diagnostic_status_non_diagnostic, true);
  assert.equal(candidate.signal_status_preclassification_only, true);
});

test("67. Creates critical route gate result candidates.", () => {
  assert.equal(run().critical_route_gate_result_candidates.length, 1);
});

test("68. Gate result real created remains false.", () => {
  assert.equal(run().critical_route_gate_result_candidates[0].gate_result_real_created, false);
});

test("69. Gate result preserves route_status_before.", () => {
  assert.equal(run().critical_route_gate_result_candidates[0].route_status_before, "open");
});

test("70. Gate result preserves route_status_after_candidate.", () => {
  assert.equal(run().critical_route_gate_result_candidates[0].route_status_after_candidate, "blocked_by_missing_evidence");
});

test("71. Gate result preserves manual_review_required.", () => {
  assert.equal(run().critical_route_gate_result_candidates[0].manual_review_required, true);
});

test("72. Gate result preserves reentry_target_candidate.", () => {
  assert.equal(run().critical_route_gate_result_candidates[0].reentry_target_candidate, "B0-Q01");
});

test("73. Gate result preserves source_trace.", () => {
  assert.equal(run().critical_route_gate_result_candidates[0].source_trace.source_sheet, "Critical_Routes");
});

test("74. readiness_gap_record real created remains false.", () => {
  assert.equal(run().readiness_gap_record_real_created, false);
});

test("75. readiness_decision_record real created remains false.", () => {
  assert.equal(run().readiness_decision_record_real_created, false);
});

test("76. semantic_resolution_event real created remains false.", () => {
  assert.equal(run().semantic_resolution_event_real_created, false);
});

test("77. process_state_timer_event real created remains false.", () => {
  assert.equal(run().process_state_timer_event_real_created, false);
});

test("78. critical_route_gate_executed_real remains false.", () => {
  assert.equal(run().critical_route_gate_executed_real, false);
});

test("79. MMABPGateEngine executed real remains false.", () => {
  assert.equal(run().mmabp_gate_engine_executed_real, false);
});

test("80. ReadinessEngine executed remains false.", () => {
  assert.equal(run().readiness_engine_executed, false);
});

test("81. Diagnosis/IR/registry remain false.", () => {
  const result = run();

  assert.equal(result.diagnosis_created, false);
  assert.equal(result.ir_created, false);
  assert.equal(result.registry_created, false);
});

test("82. Object Inventory created remains false.", () => {
  assert.equal(run().object_inventory_created, false);
});

test("83. Supabase/SQL/endpoint remain false.", () => {
  const result = run();

  assert.equal(result.supabase_touched, false);
  assert.equal(result.sql_executed, false);
  assert.equal(result.endpoint_created, false);
});

test("84. Phase 9 closed local remains false.", () => {
  assert.equal(run().phase9_closed_local, false);
});

test("85. Ready for Phase 10 authorization remains false.", () => {
  assert.equal(run().ready_for_phase10_authorization, false);
});

test("9-B 1. Creates semantic resolution gate candidates.", () => {
  assert.equal(runSemantic().semantic_resolution_gate_candidates.length, 7);
});

test("9-B 2. Supports SEM-001.", () => {
  assert.equal(runSemantic().semantic_resolution_gate_candidates[0].sem_code, "SEM-001");
});

test("9-B 3. Supports SEM-002.", () => {
  assert.equal(runSemantic().semantic_resolution_gate_candidates[1].sem_code, "SEM-002");
});

test("9-B 4. Supports SEM-003.", () => {
  assert.equal(runSemantic().semantic_resolution_gate_candidates[2].sem_code, "SEM-003");
});

test("9-B 5. Supports SEM-004.", () => {
  assert.equal(runSemantic().semantic_resolution_gate_candidates[3].sem_code, "SEM-004");
});

test("9-B 6. Supports SEM-005.", () => {
  assert.equal(runSemantic().semantic_resolution_gate_candidates[4].sem_code, "SEM-005");
});

test("9-B 7. Supports SEM-006.", () => {
  assert.equal(runSemantic().semantic_resolution_gate_candidates[5].sem_code, "SEM-006");
});

test("9-B 8. Supports SEM-007.", () => {
  assert.equal(runSemantic().semantic_resolution_gate_candidates[6].sem_code, "SEM-007");
});

test("9-B 9. Requires sem_code.", () => {
  const result = runSemantic({
    semantic_resolution_gate_sources: [semanticGateSource({ sem_code: undefined })],
  });

  assert.equal(
    result.semantic_resolution_gate_candidates[0].blocking_reasons.includes("missing_sem_code"),
    true,
  );
});

test("9-B 10. Requires target_term.", () => {
  const result = runSemantic({
    semantic_resolution_gate_sources: [semanticGateSource({ target_term: undefined })],
  });

  assert.equal(
    result.semantic_resolution_gate_candidates[0].blocking_reasons.includes("missing_target_term"),
    true,
  );
});

test("9-B 11. Requires ambiguity_type.", () => {
  const result = runSemantic({
    semantic_resolution_gate_sources: [semanticGateSource({ ambiguity_type: undefined })],
  });

  assert.equal(
    result.semantic_resolution_gate_candidates[0].blocking_reasons.includes("missing_ambiguity_type"),
    true,
  );
});

test("9-B 12. Requires source_trace.", () => {
  const result = runSemantic({
    semantic_resolution_gate_sources: [semanticGateSource({ source_trace: undefined })],
  });

  assert.equal(result.status, "blocked_missing_source_trace");
});

test("9-B 13. Blocks projection when blocks_projection=true.", () => {
  const result = runSemantic({
    semantic_resolution_gate_sources: [
      semanticGateSource({
        blocks_projection: true,
        accepted_structural_candidate_creation_attempted: true,
      }),
    ],
  });

  assert.equal(result.status, "blocked_projection_despite_semantic_gate");
});

test("9-B 14. Does not create semantic_resolution_event real.", () => {
  assert.equal(runSemantic().semantic_resolution_gate_candidates[0].semantic_resolution_event_real_created, false);
});

test("9-B 15. Does not create readiness_gap_record real.", () => {
  assert.equal(runSemantic().semantic_resolution_gate_candidates[0].readiness_gap_record_real_created, false);
});

test("9-B 16. Does not create runtime_audit_trail real.", () => {
  assert.equal(runSemantic().semantic_resolution_gate_candidates[0].runtime_audit_trail_real_created, false);
});

test("9-B 17. SEM-001 detects state_as_class.", () => {
  assert.equal(runSemantic().sem001_state_as_class_candidates[0].state_as_class_detected, true);
});

test("9-B 18. SEM-001 blocks MoC class projection.", () => {
  assert.equal(runSemantic().sem001_state_as_class_candidates[0].moc_class_projection_blocked, true);
});

test("9-B 19. SEM-001 does not create accepted ConceptCandidate.", () => {
  assert.equal(runSemantic().sem001_state_as_class_candidates[0].concept_candidate_accepted, false);
});

test("9-B 20. SEM-002 detects attribute_as_class.", () => {
  assert.equal(runSemantic().sem002_attribute_as_class_candidates[0].attribute_as_class_detected, true);
});

test("9-B 21. SEM-002 blocks separate class projection.", () => {
  assert.equal(runSemantic().sem002_attribute_as_class_candidates[0].separate_class_projection_blocked, true);
});

test("9-B 22. SEM-002 does not create accepted MoC class candidate.", () => {
  assert.equal(runSemantic().sem002_attribute_as_class_candidates[0].moc_class_candidate_accepted, false);
});

test("9-B 23. SEM-003 detects process_as_object.", () => {
  assert.equal(runSemantic().sem003_process_as_object_candidates[0].process_as_object_detected, true);
});

test("9-B 24. SEM-003 blocks object projection.", () => {
  assert.equal(runSemantic().sem003_process_as_object_candidates[0].object_projection_blocked, true);
});

test("9-B 25. SEM-003 does not create accepted ObjectStateCandidate.", () => {
  assert.equal(runSemantic().sem003_process_as_object_candidates[0].object_state_candidate_accepted, false);
});

test("9-B 26. SEM-004 detects false ISA by tipo de.", () => {
  assert.equal(runSemantic().sem004_false_isa_candidates[0].false_isa_by_type_of_detected, true);
});

test("9-B 27. SEM-004 blocks ISA projection.", () => {
  assert.equal(runSemantic().sem004_false_isa_candidates[0].isa_projection_blocked, true);
});

test("9-B 28. SEM-004 requires attribute vs specialization resolution.", () => {
  assert.equal(
    runSemantic().sem004_false_isa_candidates[0].attribute_vs_specialization_resolution_required,
    true,
  );
});

test("9-B 29. SEM-004 does not create accepted ISA candidate.", () => {
  assert.equal(runSemantic().sem004_false_isa_candidates[0].isa_candidate_accepted, false);
});

test("9-B 30. SEM-005 detects alias or duplicate.", () => {
  assert.equal(runSemantic().sem005_alias_duplicate_candidates[0].alias_or_duplicate_detected, true);
});

test("9-B 31. SEM-005 preserves alias without duplicate class.", () => {
  assert.equal(
    runSemantic().sem005_alias_duplicate_candidates[0].alias_preserved_without_duplicate_class,
    true,
  );
});

test("9-B 32. SEM-005 blocks duplicate class.", () => {
  assert.equal(runSemantic().sem005_alias_duplicate_candidates[0].duplicate_class_blocked, true);
});

test("9-B 33. SEM-006 detects role/phase/end confusion.", () => {
  assert.equal(runSemantic().sem006_role_phase_end_candidates[0].role_phase_end_confusion_detected, true);
});

test("9-B 34. SEM-006 blocks role as static class.", () => {
  assert.equal(runSemantic().sem006_role_phase_end_candidates[0].role_as_static_class_blocked, true);
});

test("9-B 35. SEM-006 blocks phase as static class.", () => {
  assert.equal(runSemantic().sem006_role_phase_end_candidates[0].phase_as_static_class_blocked, true);
});

test("9-B 36. SEM-006 blocks end as static class.", () => {
  assert.equal(runSemantic().sem006_role_phase_end_candidates[0].end_as_static_class_blocked, true);
});

test("9-B 37. SEM-006 requires dynamic resolution.", () => {
  assert.equal(runSemantic().sem006_role_phase_end_candidates[0].dynamic_resolution_required, true);
});

test("9-B 38. SEM-007 detects fused object.", () => {
  assert.equal(runSemantic().sem007_fused_marsupial_candidates[0].fused_object_detected, true);
});

test("9-B 39. SEM-007 detects marsupial object.", () => {
  assert.equal(runSemantic().sem007_fused_marsupial_candidates[0].marsupial_object_detected, true);
});

test("9-B 40. SEM-007 blocks fused OLC.", () => {
  assert.equal(runSemantic().sem007_fused_marsupial_candidates[0].fused_olc_blocked, true);
});

test("9-B 41. SEM-007 requires object separation.", () => {
  assert.equal(runSemantic().sem007_fused_marsupial_candidates[0].object_separation_required, true);
});

test("9-B 42. SEM-007 does not create fused OLC.", () => {
  assert.equal(runSemantic().sem007_fused_marsupial_candidates[0].olc_fused_created, false);
});

test("9-B 43. No MoC real projection created.", () => {
  assert.equal(runSemantic().moc_real_projection_created, false);
});

test("9-B 44. No PF real projection created.", () => {
  assert.equal(runSemantic().pf_real_projection_created, false);
});

test("9-B 45. No OLC real projection created.", () => {
  assert.equal(runSemantic().olc_real_projection_created, false);
});

test("9-B 46. Object Inventory created remains false.", () => {
  assert.equal(runSemantic().object_inventory_created, false);
});

test("9-B 47. Supabase/SQL/endpoint remain false.", () => {
  const result = runSemantic();

  assert.equal(result.supabase_touched, false);
  assert.equal(result.sql_executed, false);
  assert.equal(result.endpoint_created, false);
});

test("9-B 48. Phase 9 closed local remains false.", () => {
  assert.equal(runSemantic().phase9_closed_local, false);
});

test("9-B 49. Ready for Phase 10 authorization remains false.", () => {
  assert.equal(runSemantic().ready_for_phase10_authorization, false);
});

test("9-C 1. Creates Process State / Timer Gate candidates.", () => {
  assert.equal(runPST().process_state_timer_gate_candidates.length, 6);
});

test("9-C 2. Supports PST-001.", () => {
  assert.equal(runPST().process_state_timer_gate_candidates[0].pst_code, "PST-001");
});

test("9-C 3. Supports PST-002.", () => {
  assert.equal(runPST().process_state_timer_gate_candidates[1].pst_code, "PST-002");
});

test("9-C 4. Supports PST-003.", () => {
  assert.equal(runPST().process_state_timer_gate_candidates[2].pst_code, "PST-003");
});

test("9-C 5. Supports PST-004.", () => {
  assert.equal(runPST().process_state_timer_gate_candidates[3].pst_code, "PST-004");
});

test("9-C 6. Supports PST-005.", () => {
  assert.equal(runPST().process_state_timer_gate_candidates[4].pst_code, "PST-005");
});

test("9-C 7. Supports PST-006.", () => {
  assert.equal(runPST().process_state_timer_gate_candidates[5].pst_code, "PST-006");
});

test("9-C 8. Requires pst_code.", () => {
  const result = runPST({
    process_state_timer_gate_sources: [pstGateSource({ pst_code: undefined })],
  });

  assert.equal(
    result.process_state_timer_gate_candidates[0].blocking_reasons.includes("missing_pst_code"),
    true,
  );
});

test("9-C 9. Requires process_state_candidate_ref.", () => {
  const result = runPST({
    process_state_timer_gate_sources: [
      pstGateSource({ process_state_candidate_ref: undefined }),
    ],
  });

  assert.equal(
    result.process_state_timer_gate_candidates[0].blocking_reasons.includes("missing_process_state_candidate_ref"),
    true,
  );
});

test("9-C 10. Requires source_trace.", () => {
  const result = runPST({
    process_state_timer_gate_sources: [pstGateSource({ source_trace: undefined })],
  });

  assert.equal(result.status, "blocked_missing_source_trace");
});

test("9-C 11. Creates readiness_gap_record candidate only.", () => {
  assert.equal(runPST().process_state_timer_gate_candidates[0].readiness_gap_record_candidate_created, true);
});

test("9-C 12. Does not create readiness_gap_record real.", () => {
  assert.equal(runPST().process_state_timer_gate_candidates[0].readiness_gap_record_real_created, false);
});

test("9-C 13. Does not create process_state_timer_event real.", () => {
  assert.equal(runPST().process_state_timer_gate_candidates[0].process_state_timer_event_real_created, false);
});

test("9-C 14. Does not create runtime_audit_trail real.", () => {
  assert.equal(runPST().process_state_timer_gate_candidates[0].runtime_audit_trail_real_created, false);
});

test("9-C 15. PST-001 detects wait without awaited_event.", () => {
  assert.equal(runPST().pst001_wait_without_awaited_event_candidates[0].wait_without_awaited_event_detected, true);
});

test("9-C 16. PST-001 blocks Process State.", () => {
  assert.equal(runPST().pst001_wait_without_awaited_event_candidates[0].process_state_blocked, true);
});

test("9-C 17. PST-001 does not advance PF as valid Process State.", () => {
  assert.equal(runPST().pst001_wait_without_awaited_event_candidates[0].pf_process_state_valid, false);
});

test("9-C 18. PST-002 detects missing release_condition.", () => {
  assert.equal(runPST().pst002_missing_release_condition_candidates[0].missing_release_condition_detected, true);
});

test("9-C 19. PST-002 blocks exit.", () => {
  assert.equal(runPST().pst002_missing_release_condition_candidates[0].exit_blocked, true);
});

test("9-C 20. PST-002 marks deadlock_risk.", () => {
  assert.equal(runPST().pst002_missing_release_condition_candidates[0].deadlock_risk, true);
});

test("9-C 21. PST-002 does not close state.", () => {
  assert.equal(runPST().pst002_missing_release_condition_candidates[0].state_closed, false);
});

test("9-C 22. PST-003 detects missing timer_or_timeout_rule.", () => {
  assert.equal(runPST().pst003_missing_timer_or_timeout_candidates[0].missing_timer_or_timeout_rule_detected, true);
});

test("9-C 23. PST-003 blocks strong wait without timer.", () => {
  assert.equal(runPST().pst003_missing_timer_or_timeout_candidates[0].strong_wait_without_timer_blocked, true);
});

test("9-C 24. PST-003 does not create valid Process State.", () => {
  assert.equal(runPST().pst003_missing_timer_or_timeout_candidates[0].process_state_valid, false);
});

test("9-C 25. PST-004 detects missing timeout_state.", () => {
  assert.equal(runPST().pst004_missing_timeout_state_candidates[0].missing_timeout_state_detected, true);
});

test("9-C 26. PST-004 blocks OLC transition.", () => {
  assert.equal(runPST().pst004_missing_timeout_state_candidates[0].olc_transition_blocked, true);
});

test("9-C 27. PST-004 does not create closed causal transition.", () => {
  assert.equal(runPST().pst004_missing_timeout_state_candidates[0].closed_causal_transition_created, false);
});

test("9-C 28. PST-005 detects missing resolver_owner.", () => {
  assert.equal(runPST().pst005_missing_resolver_owner_candidates[0].missing_resolver_owner_detected, true);
});

test("9-C 29. PST-005 marks deadlock_risk.", () => {
  assert.equal(runPST().pst005_missing_resolver_owner_candidates[0].deadlock_risk, true);
});

test("9-C 30. PST-005 does not close wait as governed.", () => {
  assert.equal(runPST().pst005_missing_resolver_owner_candidates[0].wait_closed_as_governed, false);
});

test("9-C 31. PST-006 detects missing exit_path.", () => {
  assert.equal(runPST().pst006_missing_exit_path_candidates[0].missing_exit_path_detected, true);
});

test("9-C 32. PST-006 blocks incomplete PF.", () => {
  assert.equal(runPST().pst006_missing_exit_path_candidates[0].incomplete_pf_blocked, true);
});

test("9-C 33. PST-006 does not advance as valid Process State.", () => {
  assert.equal(runPST().pst006_missing_exit_path_candidates[0].pf_process_state_valid, false);
});

test("9-C 34. Creates semantic_resolution_event contract candidates.", () => {
  assert.equal(runPST().semantic_resolution_event_contract_candidates.length, 1);
});

test("9-C 35. semantic_resolution_event real created remains false.", () => {
  assert.equal(runPST().semantic_resolution_event_contract_candidates[0].semantic_resolution_event_real_created, false);
});

test("9-C 36. semantic_resolution_event contract projected_to_mba remains false.", () => {
  assert.equal(runPST().semantic_resolution_event_contract_candidates[0].projected_to_mba, false);
});

test("9-C 37. blocks_projection prevents accepted structural candidate.", () => {
  assert.equal(
    runPST().semantic_resolution_event_contract_candidates[0].accepted_structural_candidate_created,
    false,
  );
});

test("9-C 38. Creates process_state_timer_event contract candidates.", () => {
  assert.equal(runPST().process_state_timer_event_contract_candidates.length, 1);
});

test("9-C 39. process_state_timer_event real created remains false.", () => {
  assert.equal(runPST().process_state_timer_event_contract_candidates[0].process_state_timer_event_real_created, false);
});

test("9-C 40. PST event contract projected_to_mba remains false.", () => {
  assert.equal(runPST().process_state_timer_event_contract_candidates[0].projected_to_mba, false);
});

test("9-C 41. PST event contract does not accept incomplete PF.", () => {
  assert.equal(runPST().process_state_timer_event_contract_candidates[0].pf_incomplete, true);
});

test("9-C 42. PF real projection created remains false.", () => {
  assert.equal(runPST().pf_real_projection_created, false);
});

test("9-C 43. OLC real transition created remains false.", () => {
  assert.equal(runPST().olc_real_transition_created, false);
});

test("9-C 44. ReadinessEngine executed remains false.", () => {
  assert.equal(runPST().readiness_engine_executed, false);
});

test("9-C 45. readiness_decision_record real created remains false.", () => {
  assert.equal(runPST().readiness_decision_record_real_created, false);
});

test("9-C 46. Phase 10 started remains false.", () => {
  assert.equal(runPST().phase10_started, false);
});

test("9-C 47. Supabase/SQL/endpoint remain false.", () => {
  const result = runPST();

  assert.equal(result.supabase_touched, false);
  assert.equal(result.sql_executed, false);
  assert.equal(result.endpoint_created, false);
});

test("9-C 48. Phase 9 closed local remains false.", () => {
  assert.equal(runPST().phase9_closed_local, false);
});

test("9-C 49. Ready for Phase 10 authorization remains false.", () => {
  assert.equal(runPST().ready_for_phase10_authorization, false);
});

test("9-D 1. Creates readiness_gap_record candidates.", () => {
  assert.equal(runGapAudit().readiness_gap_record_candidates.length, 1);
});

test("9-D 2. readiness_gap_record real created remains false.", () => {
  assert.equal(runGapAudit().readiness_gap_record_candidates[0].readiness_gap_record_real_created, false);
});

test("9-D 3. readiness_gap candidate requires affected_gate.", () => {
  const result = runGapAudit({
    readiness_gap_record_sources: [readinessGapSource({ affected_gate: undefined })],
  });
  assert.equal(result.readiness_gap_record_candidates[0].blocking_reasons.includes("missing_affected_gate"), true);
});

test("9-D 4. readiness_gap candidate requires source_trace.", () => {
  const result = runGapAudit({
    readiness_gap_record_sources: [readinessGapSource({ source_trace: undefined })],
  });
  assert.equal(result.status, "blocked_missing_source_trace");
});

test("9-D 5. readiness_gap candidate requires finding_code.", () => {
  const result = runGapAudit({
    readiness_gap_record_sources: [readinessGapSource({ finding_code: undefined })],
  });
  assert.equal(result.readiness_gap_record_candidates[0].blocking_reasons.includes("missing_finding_code"), true);
});

test("9-D 6. summary_ready remains true.", () => {
  assert.equal(runGapAudit().readiness_gap_record_candidates[0].summary_ready, true);
});

test("9-D 7. projected_to_mba remains false.", () => {
  assert.equal(runGapAudit().readiness_gap_record_candidates[0].projected_to_mba, false);
});

test("9-D 8. readiness_final_created remains false.", () => {
  assert.equal(runGapAudit().readiness_gap_record_candidates[0].readiness_final_created, false);
});

test("9-D 9. Creates gate audit trail candidates.", () => {
  assert.equal(runGapAudit().gate_audit_trail_candidates.length, 9);
});

[
  ["9-D 10. Supports gate_evaluation_started audit action.", "gate_evaluation_started"],
  ["9-D 11. Supports critical_route_gate_evaluated audit action.", "critical_route_gate_evaluated"],
  ["9-D 12. Supports semantic_resolution_event_candidate_created audit action.", "semantic_resolution_event_candidate_created"],
  ["9-D 13. Supports process_state_timer_event_candidate_created audit action.", "process_state_timer_event_candidate_created"],
  ["9-D 14. Supports readiness_gap_candidate_created audit action.", "readiness_gap_candidate_created"],
  ["9-D 15. Supports gate_blocked_projection audit action.", "gate_blocked_projection"],
  ["9-D 16. Supports gate_passed_candidate audit action.", "gate_passed_candidate"],
  ["9-D 17. Supports manual_review_required audit action.", "manual_review_required"],
  ["9-D 18. Supports reentry_required_candidate audit action.", "reentry_required_candidate"],
].forEach(([name, action]) => {
  test(name, () => {
    assert.equal(
      runGapAudit().gate_audit_trail_candidates.some((candidate) => candidate.audit_action === action),
      true,
    );
  });
});

test("9-D 19. runtime_audit_trail real created remains false.", () => {
  assert.equal(runGapAudit().gate_audit_trail_candidates[0].runtime_audit_trail_real_created, false);
});

test("9-D 20. audit candidate requires source_trace.", () => {
  const result = runGapAudit({
    gate_audit_trail_sources: [gateAuditSource({ source_trace: undefined })],
  });
  assert.equal(result.status, "blocked_missing_source_trace");
});

test("9-D 21. audit candidate requires audit_reason.", () => {
  const result = runGapAudit({
    gate_audit_trail_sources: [gateAuditSource({ audit_reason: undefined })],
  });
  assert.equal(result.gate_audit_trail_candidates[0].blocking_reasons.includes("missing_audit_reason"), true);
});

test("9-D 22. Creates Gate outcome to readiness boundary.", () => {
  assert.equal(runGapAudit().gate_outcome_readiness_boundaries.length, 1);
});

test("9-D 23. readiness input candidate is created.", () => {
  assert.equal(Boolean(runGapAudit().gate_outcome_readiness_boundaries[0].readiness_input_candidate_ref), true);
});

test("9-D 24. readiness gap can feed future Phase 10.", () => {
  assert.equal(runGapAudit().gate_outcome_readiness_boundaries[0].source_readiness_gap_candidate_refs.length, 1);
});

test("9-D 25. manual_review_required can feed future Phase 10.", () => {
  assert.equal(runGapAudit().gate_outcome_readiness_boundaries[0].manual_review_required, true);
});

test("9-D 26. reentry_required_candidate can feed future Phase 10.", () => {
  assert.equal(runGapAudit().gate_outcome_readiness_boundaries[0].reentry_required_candidate, true);
});

test("9-D 27. ReadinessEngine executed remains false.", () => {
  assert.equal(runGapAudit().gate_outcome_readiness_boundaries[0].readiness_engine_executed, false);
});

test("9-D 28. readiness_decision_record real created remains false.", () => {
  assert.equal(runGapAudit().gate_outcome_readiness_boundaries[0].readiness_decision_record_real_created, false);
});

test("9-D 29. ready_created remains false.", () => {
  assert.equal(runGapAudit().gate_outcome_readiness_boundaries[0].ready_created, false);
});

test("9-D 30. ready_with_flags_created remains false.", () => {
  assert.equal(runGapAudit().gate_outcome_readiness_boundaries[0].ready_with_flags_created, false);
});

test("9-D 31. blocked_final_created remains false.", () => {
  assert.equal(runGapAudit().gate_outcome_readiness_boundaries[0].blocked_final_created, false);
});

test("9-D 32. export-preview created remains false.", () => {
  assert.equal(runGapAudit().gate_outcome_readiness_boundaries[0].export_preview_created, false);
});

test("9-D 33. Phase 10 started remains false.", () => {
  assert.equal(runGapAudit().gate_outcome_readiness_boundaries[0].phase10_started, false);
});

test("9-D 34. Creates Object Inventory boundary.", () => {
  assert.equal(runGapAudit().gate_object_inventory_boundaries.length, 1);
});

test("9-D 35. protected_object_hint is supported.", () => {
  assert.equal(runGapAudit().gate_object_inventory_boundaries[0].protected_object_hint, "ActivitySemanticEntry");
});

test("9-D 36. future_object_family is supported.", () => {
  assert.equal(runGapAudit().gate_object_inventory_boundaries[0].future_object_family, "SceneCanonicalRecord");
});

test("9-D 37. object_binding_status pending candidate is supported.", () => {
  assert.equal(runGapAudit().gate_object_inventory_boundaries[0].object_binding_status, "pending_candidate");
});

test("9-D 38. Object Inventory created remains false.", () => {
  assert.equal(runGapAudit().gate_object_inventory_boundaries[0].object_inventory_created, false);
});

test("9-D 39. eve_object_definition created remains false.", () => {
  assert.equal(runGapAudit().gate_object_inventory_boundaries[0].eve_object_definition_created, false);
});

test("9-D 40. runtime_object_binding real created remains false.", () => {
  assert.equal(runGapAudit().gate_object_inventory_boundaries[0].runtime_object_binding_real_created, false);
});

test("9-D 41. object_materialization_event created remains false.", () => {
  assert.equal(runGapAudit().gate_object_inventory_boundaries[0].object_materialization_event_created, false);
});

test("9-D 42. live object materialized remains false.", () => {
  assert.equal(runGapAudit().gate_object_inventory_boundaries[0].live_object_materialized, false);
});

test("9-D 43. F5C real opened remains false.", () => {
  assert.equal(runGapAudit().gate_object_inventory_boundaries[0].f5c_real_opened, false);
});

test("9-D 44. Creates Control Plane boundary.", () => {
  assert.equal(runGapAudit().gate_control_plane_boundaries.length, 1);
});

test("9-D 45. finding_code required for control plane boundary.", () => {
  const result = runGapAudit({
    gate_control_plane_boundary_sources: [controlPlaneBoundarySource({ finding_code: undefined })],
  });
  assert.equal(result.gate_control_plane_boundaries[0].blocking_reasons.includes("missing_finding_code"), true);
});

test("9-D 46. summary_ready remains true.", () => {
  assert.equal(runGapAudit().gate_control_plane_boundaries[0].summary_ready, true);
});

test("9-D 47. projected_to_mba remains false.", () => {
  assert.equal(runGapAudit().gate_control_plane_boundaries[0].projected_to_mba, false);
});

test("9-D 48. mba_event_ledger written remains false.", () => {
  assert.equal(runGapAudit().gate_control_plane_boundaries[0].mba_event_ledger_written, false);
});

test("9-D 49. mba_transition_findings written remains false.", () => {
  assert.equal(runGapAudit().gate_control_plane_boundaries[0].mba_transition_findings_written, false);
});

test("9-D 50. mba_compliance_reports written remains false.", () => {
  assert.equal(runGapAudit().gate_control_plane_boundaries[0].mba_compliance_reports_written, false);
});

test("9-D 51. outbox real created remains false.", () => {
  assert.equal(runGapAudit().gate_control_plane_boundaries[0].outbox_real_created, false);
});

test("9-D 52. handoff boundary real created remains false.", () => {
  assert.equal(runGapAudit().gate_control_plane_boundaries[0].handoff_boundary_real_created, false);
});

test("9-D 53. review control real created remains false.", () => {
  assert.equal(runGapAudit().gate_control_plane_boundaries[0].review_control_real_created, false);
});

test("9-D 54. parallel production started remains false.", () => {
  assert.equal(runGapAudit().gate_control_plane_boundaries[0].parallel_production_started, false);
});

test("9-D 55. Creates gate persistence boundary.", () => {
  assert.equal(runGapAudit().gate_persistence_boundaries.length, 1);
});

test("9-D 56. local gate evaluation candidate mode remains true.", () => {
  assert.equal(runGapAudit().gate_persistence_boundaries[0].local_gate_evaluation_candidate_mode, true);
});

test("9-D 57. local readiness gap candidate mode remains true.", () => {
  assert.equal(runGapAudit().gate_persistence_boundaries[0].local_readiness_gap_record_candidate_mode, true);
});

test("9-D 58. local semantic event candidate mode remains true.", () => {
  assert.equal(runGapAudit().gate_persistence_boundaries[0].local_semantic_resolution_event_candidate_mode, true);
});

test("9-D 59. local PST event candidate mode remains true.", () => {
  assert.equal(runGapAudit().gate_persistence_boundaries[0].local_process_state_timer_event_candidate_mode, true);
});

test("9-D 60. local audit trail candidate mode remains true.", () => {
  assert.equal(runGapAudit().gate_persistence_boundaries[0].local_runtime_audit_trail_candidate_mode, true);
});

test("9-D 61. db_write_authorized remains false.", () => {
  assert.equal(runGapAudit().gate_persistence_boundaries[0].db_write_authorized, false);
});

test("9-D 62. gate_result real created remains false.", () => {
  assert.equal(runGapAudit().gate_persistence_boundaries[0].gate_result_real_created, false);
});

test("9-D 63. semantic_resolution_event real created remains false.", () => {
  assert.equal(runGapAudit().gate_persistence_boundaries[0].semantic_resolution_event_real_created, false);
});

test("9-D 64. process_state_timer_event real created remains false.", () => {
  assert.equal(runGapAudit().gate_persistence_boundaries[0].process_state_timer_event_real_created, false);
});

test("9-D 65. Supabase touch authorized remains false.", () => {
  assert.equal(runGapAudit().gate_persistence_boundaries[0].supabase_touch_authorized, false);
});

test("9-D 66. SQL execution authorized remains false.", () => {
  assert.equal(runGapAudit().gate_persistence_boundaries[0].sql_execution_authorized, false);
});

test("9-D 67. endpoint creation authorized remains false.", () => {
  assert.equal(runGapAudit().gate_persistence_boundaries[0].endpoint_creation_authorized, false);
});

test("9-D 68. service_role used remains false.", () => {
  assert.equal(runGapAudit().gate_persistence_boundaries[0].service_role_used, false);
});

test("9-D 69. service_role used in client remains false.", () => {
  assert.equal(runGapAudit().gate_persistence_boundaries[0].service_role_used_in_client, false);
});

test("9-D 70. scene write detected remains false.", () => {
  assert.equal(runGapAudit().gate_persistence_boundaries[0].scene_write_detected, false);
});

test("9-D 71. mba write detected remains false.", () => {
  assert.equal(runGapAudit().gate_persistence_boundaries[0].mba_write_detected, false);
});

test("9-D 72. parallel production runtime artifacts write detected remains false.", () => {
  assert.equal(runGapAudit().gate_persistence_boundaries[0].parallel_production_runtime_artifacts_write_detected, false);
});

test("9-D 73. runtime_40_20 started remains false.", () => {
  assert.equal(runGapAudit().gate_persistence_boundaries[0].runtime_40_20_started, false);
});

test("9-D 74. Phase 9 closed local remains false.", () => {
  assert.equal(runGapAudit().phase9_closed_local, false);
});

test("9-D 75. Ready for Phase 10 authorization remains false.", () => {
  assert.equal(runGapAudit().ready_for_phase10_authorization, false);
});

function run(overrides = {}) {
  return service.Runtime40_20CriticalGatesService.buildPhase9CriticalRouteGateFrameworkLocalResult(
    deepMerge(baseInput(), overrides),
  );
}

function runSemantic(overrides = {}) {
  return service.Runtime40_20CriticalGatesService.buildPhase9SemanticResolutionGatesLocalResult(
    deepMerge(baseInput(), deepMerge(semanticInput(), overrides)),
  );
}

function runPST(overrides = {}) {
  return service.Runtime40_20CriticalGatesService.buildPhase9PSTSemanticEventTimerEventLocalResult(
    deepMerge(baseInput(), deepMerge(semanticInput(), deepMerge(pstInput(), overrides))),
  );
}

function runGapAudit(overrides = {}) {
  return service.Runtime40_20CriticalGatesService.buildPhase9GapAuditReadinessObjectMembranePersistenceBoundaryLocalResult(
    deepMerge(baseInput(), deepMerge(semanticInput(), deepMerge(pstInput(), deepMerge(gapAuditInput(), overrides)))),
  );
}

function baseInput() {
  return {
    case_id: "CASE-001",
    phase8_closeout: {
      phase8_closed_local: true,
      ready_for_phase9_authorization: true,
    },
    phase8_candidates: phase8Candidates(),
    gate_evaluation_sources: [
      gateSource({
        gate_id: "B0-Q01",
        gate_family: "B0_semantic_entry",
        protected_route_id: "B0-Q01",
        protected_object_hint: "ActivitySemanticEntry / SceneCanonicalRecord readiness",
        finding_code: "b0_semantic_entry_blocked",
      }),
      gateSource({
        gate_id: "CR-B2",
        gate_family: "B2_transformation_exception",
        protected_route_id: "CR-B2",
        protected_object_hint: "TransformationExceptionEvidence / CanonicalRouteException",
        finding_code: "transformation_exception_route_unresolved",
      }),
      gateSource({
        gate_id: "CR-B3-R9-C09",
        gate_family: "B3_receiver_feedback",
        protected_route_id: "CR-B3-R9 / C09",
        protected_object_hint: "ReceiverFeedbackObject / OperationalExceptionEvidence",
        finding_code: "receiver_feedback_route_missing",
      }),
      gateSource({
        gate_id: "B7-Q39-Q40-C20",
        gate_family: "B7_non_diagnostic_boundary",
        protected_route_id: "B7-Q39 / B7-Q40 / C20",
        protected_object_hint: "PreclassificationRecord / NonDiagnosticBoundary",
        finding_code: "b7_non_diagnostic_boundary_violation",
      }),
    ],
    b0_semantic_entry_sources: [b0Source()],
    b2_transformation_exception_sources: [b2Source()],
    b3_receiver_feedback_sources: [b3Source()],
    b7_c20_non_diagnostic_sources: [b7Source()],
    route_gate_result_sources: [routeResultSource()],
  };
}

function phase8Candidates() {
  return {
    branching_decision_candidates: [
      {
        branching_decision_candidate_ref: "BDC-001",
        branching_decision_real_created: false,
        causal_interaction_id: "C01",
        decision_type: "manual_review_required",
        reason: "critical route unresolved",
        source_signal_candidate_ref: "SIG-001",
        source_trace: sourceTrace({ source_sheet: "Branching_Budget_Rules" }),
        decision_candidate_allowed: true,
        blocking_reasons: [],
      },
    ],
    trigger_evaluation_candidates: [
      {
        trigger_evaluation_candidate_ref: "TRG-001",
        branching_rule_ref: "BR-001",
        signal_candidate_ref: "SIG-001",
        activation_signal_present: true,
        trigger_condition_present: true,
        trigger_condition_evaluated: true,
        trigger_condition_result: true,
        signal_source_trace_present: true,
        trigger_source_rule_ref_present: true,
        causal_interaction_id_present: true,
        causal_interaction_exists_in_causal_20: true,
        mutual_exclusion_policy_applied: true,
        skip_if_resolved_by_other_applied: false,
        closed_by_other_applied: false,
        trigger_allowed: true,
        causal_opened: false,
        branching_decision_real_created: false,
        budget_ledger_real_updated: false,
        blocking_reasons: [],
      },
    ],
    causal_score_candidates: [
      {
        causal_score_candidate_ref: "SCORE-001",
        signal_candidate_ref: "SIG-001",
        causal_interaction_id: "C01",
        score_total: 5,
        score_components: ["critical_route_unresolved_plus_5"],
        requires_user_input: true,
        score_source_trace: sourceTrace({ source_sheet: "Branching_Budget_Rules" }),
        score_candidate_allowed: true,
        blocking_reasons: [],
      },
    ],
    signal_candidates: [
      {
        signal_candidate_ref: "SIG-001",
        signal_type: "critical_route_unresolved",
        source_route_status: "open",
        source_gap_flag: true,
        source_gap_type: "route_gap",
        source_critical_route_ref: "B0-Q01",
        source_trace: sourceTrace({ source_sheet: "Critical_Routes" }),
        signal_family: "route_status",
        candidate_allowed: true,
        blocking_reasons: [],
      },
    ],
    carry_forward_gap_candidates: [
      {
        carry_forward_gap_candidate_ref: "CFG-001",
        budget_exhausted_source: false,
        causal_candidate_not_opened: "C01",
        reason: "manual_review_required",
        affected_route: "B0-Q01",
        source_trace: sourceTrace({ source_sheet: "Readiness_Gaps_Reentry" }),
        readiness_gap_record_real_created: false,
        gap_hidden: false,
        carry_forward_candidate_allowed: true,
        blocking_reasons: [],
      },
    ],
    reentry_candidates: [
      {
        reentry_candidate_ref: "REN-001",
        reentry_target: "B0-Q01",
        gap_candidate_ref: "CFG-001",
        reason: "route gap",
        justification_required: true,
        justification_present: true,
        source_trace: sourceTrace({ source_sheet: "Readiness_Gaps_Reentry" }),
        counts_as_visible: true,
        counts_as_causal: false,
        may_exceed_normal_flow: false,
        reentry_opened_real: false,
        readiness_decision_real_created: false,
        reentry_candidate_allowed: true,
        blocking_reasons: [],
      },
    ],
    budget_exhaustion_guards: [
      {
        causal_limit_reached: false,
        attempted_opening_over_20: false,
        opening_blocked_due_to_budget: false,
        reentry_justification_present: true,
        budget_override_requested: false,
        silent_overflow_detected: false,
        causal_count_reset: false,
        budget_ledger_rewritten: false,
        budget_exhaustion_guard_passed: true,
        blocking_reasons: [],
      },
    ],
    phase9_boundaries: [
      {
        b0_route_unresolved_signal_ready: true,
        b2_transformation_exception_signal_ready: true,
        b3_receiver_feedback_c09_signal_ready: true,
        b7_low_confidence_c20_signal_ready: true,
        sem_ambiguity_microconfirmation_ready: true,
        pst_wait_deadlock_reentry_ready: true,
        critical_route_gate_executed: false,
        mmabp_gate_engine_executed: false,
        semantic_resolution_event_real_created: false,
        process_state_timer_event_real_created: false,
        route_pass_fail_gap_definitive_created: false,
        readiness_final_created: false,
        phase9_started: false,
        phase9_boundary_passed: true,
        blocking_reasons: [],
      },
    ],
  };
}

function gateSource(overrides = {}) {
  return {
    gate_id: "B0-Q01",
    gate_family: "B0_semantic_entry",
    protected_route_id: "B0-Q01",
    protected_object_hint: "ActivitySemanticEntry / SceneCanonicalRecord readiness",
    future_object_family: "SceneCanonicalRecord",
    source_variable_refs: ["CVAR-CAND-001"],
    source_evidence_refs: ["EVID-001"],
    source_branching_decision_refs: ["BDC-001"],
    source_trace: sourceTrace({ source_sheet: "Critical_Routes" }),
    gate_outcome: "passed_candidate",
    contamination_blocked: true,
    finding_code: "b0_semantic_entry_blocked",
    runtime_audit_candidate_ref: "AUD-CAND-001",
    ...overrides,
  };
}

function b0Source(overrides = {}) {
  return {
    semantic_entry_route: "B0-Q01",
    protected_object_hint: "ActivitySemanticEntry / SceneCanonicalRecord readiness",
    action_verb: "elaborar",
    input_or_object: "reporte operativo",
    procedure_or_standard: "procedimiento interno",
    procedure_or_standard_required: true,
    output_or_result: "reporte enviado",
    user_correction_note: "usuario corrigio verbo",
    semantic_confirmation_status: "confirmed",
    preload_confirmed: true,
    ambiguous_activity_text: false,
    source_trace: sourceTrace({ source_sheet: "Critical_Routes" }),
    ...overrides,
  };
}

function b2Source(overrides = {}) {
  return {
    transformation_exception_route: "CR-B2",
    protected_object_hint: "TransformationExceptionEvidence / CanonicalRouteException",
    transformation_exception_exists: true,
    transformation_exception_type: "route_unresolved",
    transformation_exception_description: "Exception text with unresolved canonical route.",
    transformation_exception_route_unresolved: true,
    canonical_route_closed: false,
    source_trace: sourceTrace({ source_sheet: "Critical_Routes" }),
    ...overrides,
  };
}

function b3Source(overrides = {}) {
  return {
    cr_b3_r9_c09_route: "CR-B3-R9 / C09",
    protected_object_hint: "ReceiverFeedbackObject / OperationalExceptionEvidence",
    receiver_feedback_exists: true,
    receiver_feedback: "Receiver asked for correction.",
    receiver_feedback_gap_flag: true,
    receiver_feedback_route_missing: true,
    canonical_route_closed: false,
    source_trace: sourceTrace({ source_sheet: "Critical_Routes" }),
    ...overrides,
  };
}

function b7Source(overrides = {}) {
  return {
    b7_q39_boundary_supported: true,
    b7_q40_boundary_supported: true,
    c20_boundary_supported: true,
    protected_object_hint: "PreclassificationRecord / NonDiagnosticBoundary",
    confidence_supported: true,
    uncertainty_supported: true,
    microconfirmation_refs_supported: true,
    source_trace: sourceTrace({ source_sheet: "Critical_Routes" }),
    ...overrides,
  };
}

function routeResultSource(overrides = {}) {
  return {
    critical_route_gate_result_candidate_ref: "CRG-RESULT-001",
    gate_family: "B0_semantic_entry",
    route_id: "B0-Q01",
    route_status_before: "open",
    route_status_after_candidate: "blocked_by_missing_evidence",
    protected_route_id: "B0-Q01",
    protected_object_hint: "ActivitySemanticEntry / SceneCanonicalRecord readiness",
    evidence_sufficient: false,
    canonical_route_closed: false,
    route_missing: false,
    gap_flag: true,
    gap_type: "semantic_entry_gap",
    manual_review_required: true,
    reentry_target_candidate: "B0-Q01",
    finding_code: "b0_semantic_entry_blocked",
    source_trace: sourceTrace({ source_sheet: "Critical_Routes" }),
    ...overrides,
  };
}

function semanticInput(overrides = {}) {
  return {
    semantic_resolution_gate_sources: [
      semanticGateSource({
        sem_code: "SEM-001",
        ambiguity_type: "state_as_class",
        target_term: "aprobado",
      }),
      semanticGateSource({
        sem_code: "SEM-002",
        ambiguity_type: "attribute_as_class",
        target_term: "urgente",
      }),
      semanticGateSource({
        sem_code: "SEM-003",
        ambiguity_type: "process_as_object",
        target_term: "validar pedido",
      }),
      semanticGateSource({
        sem_code: "SEM-004",
        ambiguity_type: "false_isa_by_type_of",
        target_term: "tipo de reporte",
      }),
      semanticGateSource({
        sem_code: "SEM-005",
        ambiguity_type: "alias_or_duplicate",
        target_term: "orden",
      }),
      semanticGateSource({
        sem_code: "SEM-006",
        ambiguity_type: "role_phase_end_confusion",
        target_term: "revisor",
      }),
      semanticGateSource({
        sem_code: "SEM-007",
        ambiguity_type: "fused_object",
        target_term: "pedido-factura",
      }),
    ],
    sem001_state_as_class_sources: [sem001Source()],
    sem002_attribute_as_class_sources: [sem002Source()],
    sem003_process_as_object_sources: [sem003Source()],
    sem004_false_isa_sources: [sem004Source()],
    sem005_alias_duplicate_sources: [sem005Source()],
    sem006_role_phase_end_sources: [sem006Source()],
    sem007_fused_marsupial_sources: [sem007Source()],
    ...overrides,
  };
}

function semanticGateSource(overrides = {}) {
  return {
    runtime_semantic_gate_ref: "RUNTIME-SEM-GATE-001",
    sem_code: "SEM-001",
    target_term: "aprobado",
    ambiguity_type: "state_as_class",
    protected_object_hint: "ConceptCandidate / ObjectStateCandidate / AliasCandidate",
    blocks_projection: true,
    action: "block_projection_and_create_local_candidate",
    source_variable_refs: ["CVAR-CAND-001"],
    source_evidence_refs: ["EVID-SEM-001"],
    source_trace: sourceTrace({ source_sheet: "Semantic_Resolution_Gates" }),
    runtime_audit_candidate_ref: "AUD-SEM-001",
    ...overrides,
  };
}

function sem001Source(overrides = {}) {
  return {
    target_term: "aprobado",
    source_variable_ref: "CVAR-STATE-001",
    source_trace: sourceTrace({ source_sheet: "Semantic_Resolution_Gates" }),
    state_as_class_detected: true,
    ...overrides,
  };
}

function sem002Source(overrides = {}) {
  return {
    target_term: "urgente",
    source_variable_ref: "CVAR-ATTR-001",
    source_trace: sourceTrace({ source_sheet: "Semantic_Resolution_Gates" }),
    attribute_as_class_detected: true,
    ...overrides,
  };
}

function sem003Source(overrides = {}) {
  return {
    target_term: "validar pedido",
    source_variable_ref: "CVAR-PROC-001",
    source_trace: sourceTrace({ source_sheet: "Semantic_Resolution_Gates" }),
    process_as_object_detected: true,
    ...overrides,
  };
}

function sem004Source(overrides = {}) {
  return {
    target_term: "tipo de reporte",
    source_variable_ref: "CVAR-ISA-001",
    source_trace: sourceTrace({ source_sheet: "Semantic_Resolution_Gates" }),
    false_isa_by_type_of_detected: true,
    ...overrides,
  };
}

function sem005Source(overrides = {}) {
  return {
    target_term: "orden",
    alias_target_candidate: "pedido",
    source_trace: sourceTrace({ source_sheet: "Semantic_Resolution_Gates" }),
    alias_or_duplicate_detected: true,
    ...overrides,
  };
}

function sem006Source(overrides = {}) {
  return {
    target_term: "revisor",
    source_variable_ref: "CVAR-ROLE-001",
    source_trace: sourceTrace({ source_sheet: "Semantic_Resolution_Gates" }),
    role_phase_end_confusion_detected: true,
    ...overrides,
  };
}

function sem007Source(overrides = {}) {
  return {
    target_term: "pedido-factura",
    object_candidate_refs: ["OBJ-CAND-001", "OBJ-CAND-002"],
    source_trace: sourceTrace({ source_sheet: "Semantic_Resolution_Gates" }),
    fused_object_detected: true,
    marsupial_object_detected: true,
    ...overrides,
  };
}

function pstInput(overrides = {}) {
  return {
    process_state_timer_gate_sources: [
      pstGateSource({
        pst_code: "PST-001",
        awaited_event: undefined,
      }),
      pstGateSource({
        pst_code: "PST-002",
        release_condition: undefined,
      }),
      pstGateSource({
        pst_code: "PST-003",
        timer_or_timeout_rule: undefined,
      }),
      pstGateSource({
        pst_code: "PST-004",
        timeout_state: undefined,
      }),
      pstGateSource({
        pst_code: "PST-005",
        resolver_owner: undefined,
      }),
      pstGateSource({
        pst_code: "PST-006",
        exit_path: undefined,
      }),
    ],
    pst001_wait_without_awaited_event_sources: [
      pstSpecificSource({
        awaited_event: undefined,
      }),
    ],
    pst002_missing_release_condition_sources: [
      pstSpecificSource({
        release_condition: undefined,
      }),
    ],
    pst003_missing_timer_or_timeout_sources: [
      pstSpecificSource({
        timer_or_timeout_rule: undefined,
      }),
    ],
    pst004_missing_timeout_state_sources: [
      pstSpecificSource({
        timeout_state: undefined,
      }),
    ],
    pst005_missing_resolver_owner_sources: [
      pstSpecificSource({
        resolver_owner: undefined,
      }),
    ],
    pst006_missing_exit_path_sources: [
      pstSpecificSource({
        exit_path: undefined,
      }),
    ],
    semantic_resolution_event_contract_sources: [semanticEventContractSource()],
    process_state_timer_event_contract_sources: [pstEventContractSource()],
    ...overrides,
  };
}

function pstGateSource(overrides = {}) {
  return {
    runtime_pst_gate_ref: "RUNTIME-PST-GATE-001",
    pst_code: "PST-001",
    process_state_candidate_ref: "PST-CAND-001",
    awaited_event: "receiver_response",
    release_condition: "receiver_response_received",
    timer_or_timeout_rule: "wait_48_hours",
    timeout_state: "timed_out",
    resolver_owner: "operations_owner",
    exit_path: "continue_or_reenter",
    deadlock_risk: false,
    source_trace: sourceTrace({ source_sheet: "Process_State_Timer_Gates" }),
    runtime_audit_candidate_ref: "AUD-PST-001",
    ...overrides,
  };
}

function pstSpecificSource(overrides = {}) {
  return {
    process_state_candidate_ref: "PST-CAND-001",
    awaited_event: "receiver_response",
    release_condition: "receiver_response_received",
    timer_or_timeout_rule: "wait_48_hours",
    timeout_state: "timed_out",
    resolver_owner: "operations_owner",
    exit_path: "continue_or_reenter",
    source_trace: sourceTrace({ source_sheet: "Process_State_Timer_Gates" }),
    ...overrides,
  };
}

function semanticEventContractSource(overrides = {}) {
  return {
    run_id: "RUN-001",
    gate_id: "SEM-001",
    target_term: "aprobado",
    ambiguity_type: "state_as_class",
    outcome: "blocked_candidate",
    action: "block_projection",
    blocks_projection: true,
    protected_object_hint: "ConceptCandidate / ObjectStateCandidate / AliasCandidate",
    source_variable_refs: ["CVAR-STATE-001"],
    source_evidence_refs: ["EVID-SEM-001"],
    source_trace: sourceTrace({ source_sheet: "Semantic_Resolution_Gates" }),
    finding_code: "semantic_resolution_blocked",
    ...overrides,
  };
}

function pstEventContractSource(overrides = {}) {
  return {
    run_id: "RUN-001",
    gate_id: "PST-006",
    process_state_candidate_ref: "PST-CAND-001",
    awaited_event: "receiver_response",
    release_condition: "receiver_response_received",
    timer_rule: "wait_48_hours",
    timeout_state: "timed_out",
    resolver_owner: "operations_owner",
    exit_path: undefined,
    deadlock_risk: true,
    source_trace: sourceTrace({ source_sheet: "Process_State_Timer_Gates" }),
    finding_code: "process_state_without_timer_or_exit",
    pf_incomplete: true,
    ...overrides,
  };
}

function gapAuditInput(overrides = {}) {
  return {
    readiness_gap_record_sources: [readinessGapSource()],
    gate_audit_trail_sources: [
      gateAuditSource({ audit_action: "gate_evaluation_started" }),
      gateAuditSource({ audit_action: "critical_route_gate_evaluated" }),
      gateAuditSource({ audit_action: "semantic_resolution_event_candidate_created" }),
      gateAuditSource({ audit_action: "process_state_timer_event_candidate_created" }),
      gateAuditSource({ audit_action: "readiness_gap_candidate_created" }),
      gateAuditSource({ audit_action: "gate_blocked_projection" }),
      gateAuditSource({ audit_action: "gate_passed_candidate" }),
      gateAuditSource({ audit_action: "manual_review_required" }),
      gateAuditSource({ audit_action: "reentry_required_candidate" }),
    ],
    gate_outcome_readiness_boundary_sources: [readinessBoundarySource()],
    gate_object_inventory_boundary_sources: [objectInventoryBoundarySource()],
    gate_control_plane_boundary_sources: [controlPlaneBoundarySource()],
    gate_persistence_boundary_sources: [persistenceBoundarySource()],
    ...overrides,
  };
}

function readinessGapSource(overrides = {}) {
  return {
    run_id: "RUN-001",
    gap_type: "semantic_entry_gap",
    affected_route: "B0-Q01",
    affected_quadrant: "B0",
    affected_gate: "B0-Q01",
    severity: "medium",
    reentry_target: "B0-Q01",
    manual_review_required: true,
    source_gate_candidate_ref: "CRG-RESULT-001",
    source_trace: sourceTrace({ source_sheet: "Readiness_Gaps_Reentry" }),
    gap_reason: "gate outcome requires future readiness handling",
    finding_code: "b0_semantic_entry_blocked",
    ...overrides,
  };
}

function gateAuditSource(overrides = {}) {
  return {
    run_id: "RUN-001",
    audit_action: "gate_evaluation_started",
    gate_id: "B0-Q01",
    source_gate_candidate_ref: "CRG-RESULT-001",
    source_gap_candidate_ref: "GAP-CAND-001",
    source_trace: sourceTrace({ source_sheet: "Critical_Routes" }),
    audit_reason: "local gate candidate transition recorded",
    created_at_preview: "2026-07-05T00:00:00.000Z",
    ...overrides,
  };
}

function readinessBoundarySource(overrides = {}) {
  return {
    readiness_input_candidate_ref: "READY-IN-CAND-001",
    source_gate_result_candidate_ref: "CRG-RESULT-001",
    source_readiness_gap_candidate_refs: ["GAP-CAND-001"],
    manual_review_required: true,
    reentry_required_candidate: true,
    carry_forward_gap_refs: ["CFG-001"],
    blocked_by_missing_route: true,
    blocked_by_semantic_gate: true,
    blocked_by_pst_gate: true,
    ...overrides,
  };
}

function objectInventoryBoundarySource(overrides = {}) {
  return {
    object_inventory_boundary_candidate_ref: "OBJ-BOUNDARY-CAND-001",
    gate_id: "B0-Q01",
    protected_object_hint: "ActivitySemanticEntry",
    future_object_family: "SceneCanonicalRecord",
    object_binding_status: "pending_candidate",
    runtime_object_binding_ref: "ROB-CAND-001",
    ...overrides,
  };
}

function controlPlaneBoundarySource(overrides = {}) {
  return {
    control_plane_boundary_candidate_ref: "CP-BOUNDARY-CAND-001",
    finding_code: "b0_semantic_entry_blocked",
    source_trace: sourceTrace({ source_sheet: "Critical_Routes" }),
    ...overrides,
  };
}

function persistenceBoundarySource(overrides = {}) {
  return {
    persistence_boundary_candidate_ref: "PERSIST-BOUNDARY-CAND-001",
    ...overrides,
  };
}

function sourceTrace(overrides = {}) {
  return {
    source_document: "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
    source_sheet: "Critical_Routes",
    source_row_number: 2,
    raw_row: {
      source_node_ref: "CR-B0",
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
