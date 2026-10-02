import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const service = loadModule("runtime-40-20-export-preview-service.ts", {
  "./runtime-40-20-export-preview-types": {},
});

test("starts Phase 11 locally only when Phase 10 is closed local", () => {
  assert.equal(run().phase11_started_local, true);
});

test("blocks Phase 11 if phase10_closed_local=false", () => {
  const result = run({ phase10_closeout: { phase10_closed_local: false } });
  assert.equal(result.status, "blocked_candidate");
  assert.equal(result.phase11_started_local, false);
});

test("blocks Phase 11 if ready_for_phase11_authorization=false", () => {
  const result = run({ phase10_closeout: { ready_for_phase11_authorization: false } });
  assert.equal(result.status, "blocked_candidate");
  assert.equal(result.phase11_started_local, false);
});

test("creates phase11_input_revalidation decision", () => {
  assert.equal(Boolean(run().phase11_input_revalidation), true);
});

[
  ["consumes readiness_decision_record candidates", "readiness_decision_record_candidates_available"],
  ["consumes readiness_state candidate", "readiness_state_candidate_available"],
  ["consumes ready candidates", "ready_candidates_available"],
  ["consumes ready_with_flags candidates", "ready_with_flags_candidates_available"],
  ["consumes blocking_gap_refs", "blocking_gap_refs_available"],
  ["consumes non_blocking_gap_refs", "non_blocking_gap_refs_available"],
  ["consumes manual_review_refs", "manual_review_refs_available"],
  ["consumes reentry_refs", "reentry_refs_available"],
  ["consumes gate_result_refs", "gate_result_refs_available"],
  ["consumes semantic_event_refs", "semantic_event_refs_available"],
  ["consumes pst_event_refs", "pst_event_refs_available"],
  ["consumes carry_forward_gap_refs", "carry_forward_gap_refs_available"],
  ["consumes readiness audit candidates", "readiness_audit_candidates_available"],
  ["consumes Phase 11 boundary from Phase 10-E", "phase11_export_preview_boundary_from_phase10e_available"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(run().phase11_input_revalidation[field], true);
  });
});

test("does not recalculate readiness", () => {
  assert.equal(run().readiness_recalculated, false);
  assert.equal(run().phase11_input_revalidation.readiness_recalculated, false);
});

test("does not modify Phase 10", () => {
  assert.equal(run().phase10_modified, false);
  assert.equal(run().phase11_input_revalidation.phase10_modified, false);
});

test("does not start Phase 12", () => {
  assert.equal(run().phase12_started, false);
  assert.equal(run().phase11_input_revalidation.phase12_started, false);
});

test("creates ExportPreviewService candidates", () => {
  assert.equal(run().export_preview_service_candidates.length, 1);
});

test("ExportPreviewService requires source_trace", () => {
  const candidate = run({
    export_preview_service_sources: [exportPreviewSource({ source_trace: {} })],
  }).export_preview_service_candidates[0];
  assert.equal(candidate.blocking_reasons.includes("missing_source_trace"), true);
});

[
  ["export_preview_real_created remains false", "export_preview_real_created"],
  ["post_export_executed remains false", "post_export_executed"],
  ["payload_state_sent remains false", "payload_state_sent"],
  ["Produccion Paralela started remains false", "produccion_paralela_started"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(run().export_preview_service_candidates[0][field], false);
  });
});

test("creates export eligibility candidates", () => {
  assert.equal(run().export_eligibility_gate_candidates.length, 1);
});

test("ready allows preview candidate", () => {
  assert.equal(
    run({ export_eligibility_gate_sources: [eligibilitySource({ readiness_state: "ready" })] })
      .export_eligibility_gate_candidates[0].ready_allows_preview_candidate,
    true,
  );
});

test("ready_with_flags allows preview candidate with visible flags", () => {
  assert.equal(
    run({ export_eligibility_gate_sources: [eligibilitySource({ readiness_state: "ready_with_flags" })] })
      .export_eligibility_gate_candidates[0]
      .ready_with_flags_allows_preview_candidate_with_visible_flags,
    true,
  );
});

[
  ["blocked_by_missing_evidence blocks preview", "blocked_by_missing_evidence"],
  ["blocked_by_contradiction blocks preview", "blocked_by_contradiction"],
  ["blocked_by_missing_canonical_route blocks preview", "blocked_by_missing_canonical_route"],
].forEach(([name, state]) => {
  test(name, () => {
    assert.equal(
      run({ export_eligibility_gate_sources: [eligibilitySource({ readiness_state: state })] })
        .export_eligibility_gate_candidates[0].blocking_reasons.includes("readiness_state_blocks_preview"),
      true,
    );
  });
});

test("manual_review_required blocks preview", () => {
  assert.equal(
    run({ export_eligibility_gate_sources: [eligibilitySource({ readiness_state: "manual_review_required" })] })
      .export_eligibility_gate_candidates[0].manual_review_required_blocks_preview,
    true,
  );
});

test("reentry_required blocks preview", () => {
  assert.equal(
    run({ export_eligibility_gate_sources: [eligibilitySource({ readiness_state: "reentry_required" })] })
      .export_eligibility_gate_candidates[0].reentry_required_blocks_preview,
    true,
  );
});

test("blocking_gap_refs must be empty", () => {
  assert.equal(
    run({ export_eligibility_gate_sources: [eligibilitySource({ blocking_gap_refs: ["GAP-BLOCK"] })] })
      .export_eligibility_gate_candidates[0].blocking_reasons.includes("blocking_gap_refs_present"),
    true,
  );
});

test("non_blocking_gap_refs can travel as flags", () => {
  assert.equal(run().export_eligibility_gate_candidates[0].non_blocking_gap_refs_can_travel_as_flags, true);
});

test("blocked is not degraded to ready_with_flags", () => {
  const candidate = run({
    export_eligibility_gate_sources: [
      eligibilitySource({ blocked_degraded_to_ready_with_flags_attempted: true }),
    ],
  }).export_eligibility_gate_candidates[0];
  assert.equal(candidate.blocked_degraded_to_ready_with_flags, false);
  assert.equal(candidate.blocking_reasons.includes("blocked_degraded_to_ready_with_flags_attempted"), true);
});

test("blocking gap is not hidden as flag", () => {
  const candidate = run({
    export_eligibility_gate_sources: [eligibilitySource({ blocking_gap_hidden_as_flag_attempted: true })],
  }).export_eligibility_gate_candidates[0];
  assert.equal(candidate.blocking_gap_hidden_as_flag, false);
  assert.equal(candidate.blocking_reasons.includes("blocking_gap_hidden_as_flag_attempted"), true);
});

test("creates runtime_export_contract source candidates", () => {
  assert.equal(run().runtime_export_contract_source_candidates.length, 1);
});

for (const payloadType of ["scr_patch", "evidence_bundle_patch", "mdsb_patch", "combined_preview"]) {
  test(`supports ${payloadType} payload_type`, () => {
    assert.equal(
      run({ runtime_export_contract_sources: [contractSource({ payload_type: payloadType })] })
        .runtime_export_contract_source_candidates[0].payload_type,
      payloadType,
    );
  });
}

test("blocks invalid payload_type", () => {
  assert.equal(
    run({ runtime_export_contract_sources: [contractSource({ payload_type: "real_export" })] })
      .runtime_export_contract_source_candidates[0].blocking_reasons.includes("invalid_payload_type"),
    true,
  );
});

[
  ["requires required_payload_sections", "required_payload_sections", "missing_required_payload_sections"],
  ["requires provenance fields", "required_provenance_fields", "missing_required_provenance_fields"],
  ["requires readiness fields", "required_readiness_fields", "missing_required_readiness_fields"],
].forEach(([name, field, reason]) => {
  test(name, () => {
    assert.equal(
      run({ runtime_export_contract_sources: [contractSource({ [field]: [] })] })
        .runtime_export_contract_source_candidates[0].blocking_reasons.includes(reason),
      true,
    );
  });
});

test("blocks placeholder payload", () => {
  const candidate = run({
    runtime_export_contract_sources: [contractSource({ placeholder_payload_attempted: true })],
  }).runtime_export_contract_source_candidates[0];
  assert.equal(candidate.placeholder_payload_detected, false);
  assert.equal(candidate.blocking_reasons.includes("placeholder_payload_attempted"), true);
});

test("creates parallel_export_payload preview candidates", () => {
  assert.equal(run().parallel_export_payload_preview_candidates.length, 1);
});

test("parallel_export_payload real created remains false", () => {
  assert.equal(run().parallel_export_payload_preview_candidates[0].parallel_export_payload_real_created, false);
});

for (const payloadState of ["draft", "ready", "blocked", "superseded"]) {
  test(`supports payload_state ${payloadState}`, () => {
    assert.equal(
      run({ parallel_export_payload_preview_sources: [payloadSource({ payload_state: payloadState })] })
        .parallel_export_payload_preview_candidates[0].payload_state,
      payloadState,
    );
  });
}

test("blocks payload_state sent", () => {
  const candidate = run({
    parallel_export_payload_preview_sources: [payloadSource({ payload_state: "sent" })],
  }).parallel_export_payload_preview_candidates[0];
  assert.equal(candidate.payload_state_sent, false);
  assert.equal(candidate.blocking_reasons.includes("payload_state_sent_attempted"), true);
});

test("requires checksum", () => {
  assert.equal(
    run({ parallel_export_payload_preview_sources: [payloadSource({ checksum: "" })] })
      .parallel_export_payload_preview_candidates[0].blocking_reasons.includes("missing_checksum"),
    true,
  );
});

test("DB write remains false", () => {
  assert.equal(run().parallel_export_payload_preview_candidates[0].db_write_created, false);
});

test("POST export remains false", () => {
  assert.equal(run().parallel_export_payload_preview_candidates[0].post_export_executed, false);
});

test("creates payload state lifecycle candidates", () => {
  assert.equal(run().payload_state_lifecycle_candidates.length, 4);
});

[
  ["allows draft_to_ready only when eligibility passes", "draft_to_ready_supported_when_eligibility_passes"],
  ["allows draft_to_blocked when readiness blocks", "draft_to_blocked_supported_when_readiness_blocks"],
  ["allows ready_to_superseded when source revision changes", "ready_to_superseded_supported_when_source_revision_changes"],
  ["allows blocked_to_draft with explicit local revalidation", "blocked_to_draft_supported_with_explicit_local_revalidation"],
].forEach(([name, field], index) => {
  test(name, () => {
    assert.equal(run().payload_state_lifecycle_candidates[index][field], true);
  });
});

test("blocks invented lifecycle state", () => {
  assert.equal(
    run({ payload_state_lifecycle_sources: [lifecycleSource({ current_state: "invented" })] })
      .payload_state_lifecycle_candidates[0].blocking_reasons.includes("invalid_payload_state"),
    true,
  );
});

test("requires audit candidate for transition", () => {
  assert.equal(
    run({ payload_state_lifecycle_sources: [lifecycleSource({ audit_candidate_ref: "" })] })
      .payload_state_lifecycle_candidates[0].blocking_reasons.includes("missing_audit_candidate"),
    true,
  );
});

test("creates checksum/idempotency candidates", () => {
  assert.equal(run().checksum_idempotency_candidates.length, 1);
});

[
  ["requires checksum_source", "checksum_source", "missing_checksum_source"],
  ["requires checksum_algorithm", "checksum_algorithm", "missing_checksum_algorithm"],
  ["requires source_payload_hash", "source_payload_hash", "missing_source_payload_hash"],
].forEach(([name, field, reason]) => {
  test(name, () => {
    assert.equal(
      run({ checksum_idempotency_sources: [checksumSource({ [field]: "" })] })
        .checksum_idempotency_candidates[0].blocking_reasons.includes(reason),
      true,
    );
  });
});

test("supports source_readiness_hash", () => {
  assert.equal(run().checksum_idempotency_candidates[0].source_readiness_hash, "HASH-READY");
});

test("supports source_evidence_hash", () => {
  assert.equal(run().checksum_idempotency_candidates[0].source_evidence_hash, "HASH-EVIDENCE");
});

test("supports source_variable_hash", () => {
  assert.equal(run().checksum_idempotency_candidates[0].source_variable_hash, "HASH-VARIABLE");
});

test("supports idempotency_key", () => {
  assert.equal(run().checksum_idempotency_candidates[0].idempotency_key, "RUN-001:HASH-PAYLOAD");
});

test("detects duplicate preview", () => {
  assert.equal(
    run({ checksum_idempotency_sources: [checksumSource({ duplicate_preview_detected: true })] })
      .checksum_idempotency_candidates[0].duplicate_preview_detected,
    true,
  );
});

test("blocks duplicate preview for same run/source hash", () => {
  assert.equal(
    run({ checksum_idempotency_sources: [checksumSource({ duplicate_preview_detected: true })] })
      .checksum_idempotency_candidates[0].duplicate_preview_blocked,
    true,
  );
});

test("supports supersedes_payload_candidate_ref", () => {
  assert.equal(run().checksum_idempotency_candidates[0].supersedes_payload_candidate_ref, "PAYLOAD-000");
});

test("does not replace preview without trace", () => {
  const candidate = run({
    checksum_idempotency_sources: [checksumSource({ preview_replaced_without_trace_attempted: true })],
  }).checksum_idempotency_candidates[0];
  assert.equal(candidate.preview_replaced_without_trace, false);
  assert.equal(candidate.blocking_reasons.includes("preview_replaced_without_trace_attempted"), true);
});

test("creates source trace envelope candidates", () => {
  assert.equal(run().source_trace_envelope_candidates.length, 1);
});

[
  ["envelope supports source_document", "source_document", "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx"],
  ["envelope supports source_sheet", "source_sheet", "MMABP_Output_Map"],
  ["envelope supports source_row_number", "source_row_number", 2],
  ["envelope supports raw_row_internal", "raw_row_internal", undefined],
].forEach(([name, field, value]) => {
  test(name, () => {
    const actual = run().source_trace_envelope_candidates[0][field];
    if (field === "raw_row_internal") assert.equal(Boolean(actual), true);
    else assert.equal(actual, value);
  });
});

[
  ["envelope supports source_codes", "source_codes"],
  ["envelope supports source_refs", "source_refs"],
  ["envelope supports source_gate_refs", "source_gate_refs"],
  ["envelope supports source_gap_refs", "source_gap_refs"],
  ["envelope supports source_evidence_refs", "source_evidence_refs"],
  ["envelope supports source_variable_refs", "source_variable_refs"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(run().source_trace_envelope_candidates[0][field].length > 0, true);
  });
});

test("blocks missing source_trace", () => {
  assert.equal(
    run({ source_trace_envelope_sources: [envelopeSource({ source_trace: {} })] })
      .source_trace_envelope_candidates[0].blocking_reasons.includes("missing_source_trace"),
    true,
  );
});

test("blocks fabricated provenance", () => {
  const candidate = run({
    source_trace_envelope_sources: [envelopeSource({ provenance_fabricated_attempted: true })],
  }).source_trace_envelope_candidates[0];
  assert.equal(candidate.provenance_fabricated, false);
  assert.equal(candidate.blocking_reasons.includes("fabricated_provenance_attempted"), true);
});

test("blocks payload without source", () => {
  const candidate = run({
    source_trace_envelope_sources: [envelopeSource({ payload_without_source_attempted: true })],
  }).source_trace_envelope_candidates[0];
  assert.equal(candidate.payload_without_source, false);
  assert.equal(candidate.blocking_reasons.includes("payload_without_source_attempted"), true);
});

[
  ["Supabase touched remains false", "supabase_touched"],
  ["SQL executed remains false", "sql_executed"],
  ["Endpoint created remains false", "endpoint_created"],
  ["service_role used remains false", "service_role_used"],
  ["service_role used in client remains false", "service_role_used_in_client"],
  ["registry remains false", "registry_created"],
  ["IR remains false", "ir_created"],
  ["diagnosis remains false", "diagnosis_created"],
  ["Control Plane real remains false", "control_plane_real_created"],
  ["mba write remains false", "mba_write_detected"],
  ["scene write remains false", "scene_write_detected"],
  ["parallel production runtime artifacts write remains false", "parallel_production_runtime_artifacts_write_detected"],
  ["Phase 11 closed local remains false", "phase11_closed_local"],
  ["Ready for Phase 12 authorization remains false", "ready_for_phase12_authorization"],
  ["QA green declared remains false", "qa_green_declared"],
  ["shadow pilot started remains false", "shadow_pilot_started"],
  ["full runtime authorized remains false", "full_runtime_authorized"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(run()[field], false);
  });
});

[
  ["boundary blocks export real attempts", "export_preview_real_creation_attempted", "blocked_export_real_attempt"],
  ["boundary blocks parallel payload real attempts", "parallel_export_payload_real_creation_attempted", "blocked_export_real_attempt"],
  ["boundary blocks POST export attempts", "post_export_execution_attempted", "blocked_export_real_attempt"],
  ["boundary blocks payload_state sent attempts", "payload_state_sent_attempted", "blocked_payload_state_sent_attempt"],
  ["boundary blocks Produccion Paralela attempts", "produccion_paralela_start_attempted", "blocked_candidate"],
  ["boundary blocks registry attempts", "registry_creation_attempted", "blocked_candidate"],
  ["boundary blocks IR attempts", "ir_creation_attempted", "blocked_candidate"],
  ["boundary blocks diagnosis attempts", "diagnosis_creation_attempted", "blocked_candidate"],
  ["boundary blocks Supabase attempts", "supabase_touch_attempted", "blocked_candidate"],
  ["boundary blocks SQL attempts", "sql_execution_attempted", "blocked_candidate"],
  ["boundary blocks endpoint attempts", "endpoint_creation_attempted", "blocked_candidate"],
  ["boundary blocks Phase 12 attempts", "phase12_started_attempted", "blocked_candidate"],
].forEach(([name, field, status]) => {
  test(name, () => {
    assert.equal(run({ boundary_guard: { [field]: true } }).status, status);
  });
});

test("creates SCR preview candidates", () => {
  assert.equal(runSCR().scr_preview_candidates.length, 1);
});

test("SCR preview uses payload_type scr_patch", () => {
  assert.equal(runSCR().scr_preview_candidates[0].payload_type, "scr_patch");
});

[
  ["SCR preview creates scene_canonical_record_patch candidate", "scene_canonical_record_patch"],
  ["SCR preview includes activity_anchor", "activity_anchor"],
  ["SCR preview includes block_outputs", "block_outputs"],
  ["SCR preview includes gaps", "gaps"],
  ["SCR preview includes route_status", "route_status"],
  ["SCR preview includes readiness", "readiness"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(Boolean(runSCR().scr_preview_candidates[0][field]), true);
  });
});

test("SCR preview requires checksum_source", () => {
  assert.equal(
    runSCR({ scr_preview_sources: [scrPreviewSource({ checksum_source: "" })] })
      .scr_preview_candidates[0].blocking_reasons.includes("missing_checksum_source"),
    true,
  );
});

test("SCR preview requires source_trace", () => {
  assert.equal(
    runSCR({ scr_preview_sources: [scrPreviewSource({ source_trace: {} })] })
      .scr_preview_candidates[0].blocking_reasons.includes("missing_source_trace"),
    true,
  );
});

[
  ["SCR preview real created remains false", "scr_preview_real_created"],
  ["SceneCanonicalRecord real created remains false", "scene_canonical_record_real_created"],
  ["scene_* write detected remains false", "scene_write_detected"],
  ["Object Inventory created remains false", "object_inventory_created"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(runSCR().scr_preview_candidates[0][field], false);
  });
});

test("creates SCR activity anchor candidates", () => {
  assert.equal(runSCR().scr_activity_anchor_candidates.length, 1);
});

[
  ["activity anchor supports activity_id", "activity_id", "ACT-001"],
  ["activity anchor supports catalog_version_id", "catalog_version_id", "CAT-V1"],
  ["activity anchor supports activity_name_user_confirmed", "activity_name_user_confirmed", "Prepare invoice"],
  ["activity anchor supports action_verb", "activity_semantic_action_verb", "prepare"],
  ["activity anchor supports input_object", "activity_semantic_input_object", "purchase order"],
  ["activity anchor supports procedure_standard", "activity_semantic_procedure_standard", "billing procedure"],
  ["activity anchor supports output_product", "activity_semantic_output_product", "invoice draft"],
  ["activity anchor supports block0_entry_mode", "block0_entry_mode", "confirmed"],
  ["activity anchor supports semantic_confirmation_status", "semantic_confirmation_status", "confirmed"],
].forEach(([name, field, value]) => {
  test(name, () => {
    assert.equal(runSCR().scr_activity_anchor_candidates[0][field], value);
  });
});

test("B0-Q01 subfields preserved", () => {
  assert.equal(runSCR().scr_activity_anchor_candidates[0].b0_q01_subfields_preserved, true);
});

test("blocks activity anchor from unconfirmed free text", () => {
  const candidate = runSCR({
    scr_activity_anchor_sources: [
      scrAnchorSource({ activity_anchor_from_unconfirmed_free_text_attempted: true }),
    ],
  }).scr_activity_anchor_candidates[0];
  assert.equal(candidate.activity_anchor_from_unconfirmed_free_text, false);
  assert.equal(candidate.blocking_reasons.includes("activity_anchor_from_unconfirmed_free_text"), true);
});

test("blocks missing subfield inference", () => {
  const candidate = runSCR({
    scr_activity_anchor_sources: [scrAnchorSource({ missing_subfield_inferred_attempted: true })],
  }).scr_activity_anchor_candidates[0];
  assert.equal(candidate.missing_subfield_inferred, false);
  assert.equal(candidate.blocking_reasons.includes("missing_subfield_inferred_attempted"), true);
});

test("blocks SCR if B0 not closed or confirmed", () => {
  assert.equal(
    runSCR({ scr_activity_anchor_sources: [scrAnchorSource({ b0_closed_or_confirmed: false })] })
      .scr_activity_anchor_candidates[0].blocking_reasons.includes("b0_not_closed_or_confirmed"),
    true,
  );
});

test("creates SCR block outputs candidates", () => {
  assert.equal(runSCR().scr_block_outputs_candidates.length, 1);
});

[
  ["supports B0 output readiness", "b0_output_readiness"],
  ["supports B05 scene context", "b05_scene_context"],
  ["supports B1 trigger source/channel", "b1_trigger_source_channel"],
  ["supports B2 transformation initial state", "b2_transformation_state_initial"],
  ["supports B2 transformation final state", "b2_transformation_state_final"],
  ["supports B3 output object/receiver", "b3_output_object_receiver"],
  ["supports B4 deadlock risk", "b4_deadlock_risk"],
  ["supports B5 capacity gap", "b5_capacity_gap"],
  ["supports B6 rework/workaround/residual variety", "b6_rework_workaround_residual_variety"],
  ["supports B7 preclassification readiness", "b7_preclassification_readiness"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(Boolean(runSCR().scr_block_outputs_candidates[0][field]), true);
  });
});

test("block outputs require variables/evidence/gates source refs", () => {
  assert.equal(
    runSCR({ scr_block_outputs_sources: [scrBlockOutputsSource({ block_outputs_source_refs: [] })] })
      .scr_block_outputs_candidates[0].blocking_reasons.includes("missing_source_trace"),
    true,
  );
});

test("blocks invented block output", () => {
  const candidate = runSCR({
    scr_block_outputs_sources: [scrBlockOutputsSource({ block_output_invented_attempted: true })],
  }).scr_block_outputs_candidates[0];
  assert.equal(candidate.block_output_invented, false);
  assert.equal(candidate.blocking_reasons.includes("block_output_invented_attempted"), true);
});

test("blocks diagnosis from B7", () => {
  const candidate = runSCR({
    scr_block_outputs_sources: [scrBlockOutputsSource({ b7_diagnosis_attempted: true })],
  }).scr_block_outputs_candidates[0];
  assert.equal(candidate.b7_diagnosis_created, false);
  assert.equal(candidate.blocking_reasons.includes("b7_diagnosis_attempted"), true);
});

test("creates SCR gap/readiness/route transport candidates", () => {
  assert.equal(runSCR().scr_gap_readiness_route_transport_candidates.length, 1);
});

[
  ["transports gap_id", "gap_id", "GAP-001"],
  ["transports gap_type", "gap_type", "missing_evidence"],
  ["transports gap_severity", "gap_severity", "high"],
  ["transports affected_route", "affected_route", "B0"],
  ["transports affected_gate", "affected_gate", "B0-Q01"],
].forEach(([name, field, value]) => {
  test(name, () => {
    assert.equal(runSCR().scr_gap_readiness_route_transport_candidates[0].gaps[0][field], value);
  });
});

test("transports carry_forward", () => {
  assert.equal(runSCR().scr_gap_readiness_route_transport_candidates[0].gaps[0].carry_forward, true);
});

test("transports manual_review_required", () => {
  assert.equal(runSCR().scr_gap_readiness_route_transport_candidates[0].gaps[0].manual_review_required, false);
});

test("transports reentry_required", () => {
  assert.equal(runSCR().scr_gap_readiness_route_transport_candidates[0].gaps[0].reentry_required, false);
});

test("transports readiness_state", () => {
  assert.equal(runSCR().scr_gap_readiness_route_transport_candidates[0].readiness_state, "ready_with_flags");
});

test("transports readiness_flags", () => {
  assert.equal(runSCR().scr_gap_readiness_route_transport_candidates[0].readiness_flags.length > 0, true);
});

test("transports critical_route_status", () => {
  assert.equal(runSCR().scr_gap_readiness_route_transport_candidates[0].critical_route_status.B0, "closed");
});

test("does not hide blocking gap", () => {
  const candidate = runSCR({
    scr_gap_readiness_route_transport_sources: [
      scrGapTransportSource({ blocking_gap_hidden_attempted: true }),
    ],
  }).scr_gap_readiness_route_transport_candidates[0];
  assert.equal(candidate.blocking_gap_hidden, false);
  assert.equal(candidate.blocking_reasons.includes("blocking_gap_hidden_attempted"), true);
});

test("does not close gaps in SCR", () => {
  const candidate = runSCR({
    scr_gap_readiness_route_transport_sources: [
      scrGapTransportSource({ gaps_closed_in_scr_attempted: true }),
    ],
  }).scr_gap_readiness_route_transport_candidates[0];
  assert.equal(candidate.gaps_closed_in_scr, false);
  assert.equal(candidate.blocking_reasons.includes("gaps_closed_in_scr_attempted"), true);
});

test("blocks SCR export when readiness blocked", () => {
  assert.equal(
    runSCR({
      scr_gap_readiness_route_transport_sources: [
        scrGapTransportSource({ readiness_state: "blocked_by_missing_evidence" }),
      ],
    }).scr_gap_readiness_route_transport_candidates[0].blocking_reasons.includes("blocked_readiness_state"),
    true,
  );
});

test("blocks SCR export when manual_review_required", () => {
  assert.equal(
    runSCR({
      scr_gap_readiness_route_transport_sources: [
        scrGapTransportSource({ readiness_state: "manual_review_required" }),
      ],
    }).scr_gap_readiness_route_transport_candidates[0].blocking_reasons.includes("manual_review_required"),
    true,
  );
});

test("blocks SCR export when reentry_required", () => {
  assert.equal(
    runSCR({
      scr_gap_readiness_route_transport_sources: [
        scrGapTransportSource({ readiness_state: "reentry_required" }),
      ],
    }).scr_gap_readiness_route_transport_candidates[0].blocking_reasons.includes("reentry_required"),
    true,
  );
});

test("does not recalculate critical_route_status", () => {
  assert.equal(
    runSCR({
      scr_gap_readiness_route_transport_sources: [
        scrGapTransportSource({ critical_route_status_recalculated_attempted: true }),
      ],
    }).scr_gap_readiness_route_transport_candidates[0].critical_route_status.B0,
    "closed",
  );
});

[
  ["export_preview_real_created remains false for SCR", "export_preview_real_created"],
  ["parallel_export_payload real created remains false for SCR", "parallel_export_payload_real_created"],
  ["payload_state_sent remains false for SCR", "payload_state_sent"],
  ["POST export executed remains false for SCR", "post_export_executed"],
  ["Supabase touched remains false for SCR", "supabase_touched"],
  ["SQL executed remains false for SCR", "sql_executed"],
  ["Endpoint created remains false for SCR", "endpoint_created"],
  ["Phase 11 closed local remains false for SCR", "phase11_closed_local"],
  ["Ready for Phase 12 authorization remains false for SCR", "ready_for_phase12_authorization"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(runSCR()[field], false);
  });
});

test("creates EvidenceBundle preview candidates", () => {
  assert.equal(runEvidenceBundle().evidence_bundle_preview_candidates.length, 1);
});

test("EvidenceBundle preview uses payload_type evidence_bundle_patch", () => {
  assert.equal(runEvidenceBundle().evidence_bundle_preview_candidates[0].payload_type, "evidence_bundle_patch");
});

test("EvidenceBundle preview includes evidence_items", () => {
  assert.equal(runEvidenceBundle().evidence_bundle_preview_candidates[0].evidence_items.length > 0, true);
});

test("EvidenceBundle preview includes canonical_variables", () => {
  assert.equal(runEvidenceBundle().evidence_bundle_preview_candidates[0].canonical_variables.length > 0, true);
});

test("EvidenceBundle preview includes route_status", () => {
  assert.equal(Boolean(runEvidenceBundle().evidence_bundle_preview_candidates[0].route_status), true);
});

test("EvidenceBundle preview includes readiness", () => {
  assert.equal(Boolean(runEvidenceBundle().evidence_bundle_preview_candidates[0].readiness), true);
});

test("EvidenceBundle preview requires source_trace", () => {
  assert.equal(
    runEvidenceBundle({ evidence_bundle_preview_sources: [evidenceBundlePreviewSource({ source_trace: {} })] })
      .evidence_bundle_preview_candidates[0].blocking_reasons.includes("missing_source_trace"),
    true,
  );
});

[
  ["EvidenceBundle preview real created remains false", "evidence_bundle_preview_real_created"],
  ["EvidenceBundle real created remains false", "evidence_bundle_real_created"],
  ["Registry created remains false on preview candidate", "registry_created"],
  ["Hard evidence fabricated remains false", "hard_evidence_fabricated"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(runEvidenceBundle().evidence_bundle_preview_candidates[0][field], false);
  });
});

test("creates EvidenceBundle evidence item candidates", () => {
  assert.equal(runEvidenceBundle().evidence_bundle_evidence_item_candidates.length, 1);
});

[
  ["evidence item supports literal_value", "literal_value", "User said the invoice is prepared"],
  ["evidence item supports normalized_value", "normalized_value", "invoice_prepared"],
  ["evidence item supports epistemic_status", "epistemic_status", "captured_user_evidence"],
  ["evidence item supports provenance_type", "provenance_type", "direct_user_answer"],
  ["evidence item supports confidence", "confidence", 0.91],
  ["evidence item supports source_ref", "source_ref", "B0-Q01"],
  ["evidence item supports response_revision_number", "response_revision_number", 2],
  ["evidence item supports supersedes_evidence_ref", "supersedes_evidence_ref", "EVID-000"],
].forEach(([name, field, value]) => {
  test(name, () => {
    assert.equal(runEvidenceBundle().evidence_bundle_evidence_item_candidates[0][field], value);
  });
});

test("evidence item preserves source_trace", () => {
  assert.equal(
    runEvidenceBundle().evidence_bundle_evidence_item_candidates[0].source_trace.source_sheet,
    "UX_Subfield_Structure",
  );
});

[
  ["captured_user_evidence can be hard evidence when sourced", "captured_user_evidence"],
  ["user_confirmed_suggestion can be hard evidence when sourced", "user_confirmed_suggestion"],
  ["user_corrected_evidence can be hard evidence when sourced", "user_corrected_evidence"],
].forEach(([name, epistemic_status]) => {
  test(name, () => {
    assert.equal(
      runEvidenceBundle({
        evidence_bundle_evidence_item_sources: [
          evidenceItemSource({ epistemic_status, hard_evidence_requested: true }),
        ],
      }).evidence_bundle_evidence_item_candidates[0].hard_evidence,
      true,
    );
  });
});

test("ai_inferred_unconfirmed hard_evidence remains false", () => {
  assert.equal(
    runEvidenceBundle({
      evidence_bundle_evidence_item_sources: [
        evidenceItemSource({ epistemic_status: "ai_inferred_unconfirmed", hard_evidence_requested: true }),
      ],
    }).evidence_bundle_evidence_item_candidates[0].hard_evidence,
    false,
  );
});

test("blocks evidence from absence", () => {
  const candidate = runEvidenceBundle({
    evidence_bundle_evidence_item_sources: [evidenceItemSource({ evidence_from_absence_attempted: true })],
  }).evidence_bundle_evidence_item_candidates[0];
  assert.equal(candidate.evidence_from_absence, false);
  assert.equal(candidate.blocking_reasons.includes("evidence_from_absence_attempted"), true);
});

test("blocks hard evidence from unconfirmed inference", () => {
  assert.equal(
    runEvidenceBundle({
      evidence_bundle_evidence_item_sources: [
        evidenceItemSource({ epistemic_status: "ai_inferred_unconfirmed", hard_evidence_requested: true }),
      ],
    }).evidence_bundle_evidence_item_candidates[0].blocking_reasons.includes(
      "hard_evidence_from_unconfirmed_inference_attempted",
    ),
    true,
  );
});

test("blocks evidence from pending microconfirmation", () => {
  const candidate = runEvidenceBundle({
    evidence_bundle_evidence_item_sources: [
      evidenceItemSource({ pending_microconfirmation_evidence_attempted: true }),
    ],
  }).evidence_bundle_evidence_item_candidates[0];
  assert.equal(candidate.pending_microconfirmation_evidence, false);
  assert.equal(candidate.blocking_reasons.includes("pending_microconfirmation_evidence_attempted"), true);
});

test("does not inflate confidence", () => {
  const candidate = runEvidenceBundle({
    evidence_bundle_evidence_item_sources: [evidenceItemSource({ confidence_inflation_attempted: true })],
  }).evidence_bundle_evidence_item_candidates[0];
  assert.equal(candidate.confidence_inflated, false);
  assert.equal(candidate.blocking_reasons.includes("confidence_inflation_attempted"), true);
});

test("does not supersede without trace", () => {
  const candidate = runEvidenceBundle({
    evidence_bundle_evidence_item_sources: [
      evidenceItemSource({ supersession_without_trace_attempted: true }),
    ],
  }).evidence_bundle_evidence_item_candidates[0];
  assert.equal(candidate.supersession_without_trace, false);
  assert.equal(candidate.blocking_reasons.includes("supersession_without_trace_attempted"), true);
});

test("creates canonical variables / route status candidates", () => {
  assert.equal(runEvidenceBundle().evidence_bundle_canonical_variable_route_status_candidates.length, 1);
});

[
  ["canonical_variable_refs supported", "canonical_variable_refs", undefined],
  ["variable_name supported", "variable_name", "activity_output_object"],
  ["variable_value supported", "variable_value", "invoice draft"],
  ["variable epistemic_status supported", "variable_epistemic_status", "canonical_derivation"],
  ["variable provenance_type supported", "variable_provenance_type", "derived_from_evidence"],
  ["CR-B0 route status supported", "cr_b0_route_status", "closed"],
  ["CR-B2 route status supported", "cr_b2_route_status", "closed"],
  ["CR-B3/C09 route status supported", "cr_b3_c09_route_status", "ready_with_flags"],
  ["CR-B7 route status supported", "cr_b7_route_status", "not_started"],
].forEach(([name, field, value]) => {
  test(name, () => {
    const actual = runEvidenceBundle().evidence_bundle_canonical_variable_route_status_candidates[0][field];
    if (field === "canonical_variable_refs") assert.equal(actual.length > 0, true);
    else assert.equal(actual, value);
  });
});

test("route_status from satisfaction general remains false", () => {
  const candidate = runEvidenceBundle({
    evidence_bundle_canonical_variable_route_status_sources: [
      variableRouteStatusSource({ route_status_source: "satisfaction_general" }),
    ],
  }).evidence_bundle_canonical_variable_route_status_candidates[0];
  assert.equal(candidate.route_status_from_satisfaction_general, false);
  assert.equal(candidate.blocking_reasons.includes("route_status_from_satisfaction_general_attempted"), true);
});

test("variable from text similarity remains false", () => {
  const candidate = runEvidenceBundle({
    evidence_bundle_canonical_variable_route_status_sources: [
      variableRouteStatusSource({ variable_from_text_similarity_attempted: true }),
    ],
  }).evidence_bundle_canonical_variable_route_status_candidates[0];
  assert.equal(candidate.variable_from_text_similarity, false);
  assert.equal(candidate.blocking_reasons.includes("variable_from_text_similarity_attempted"), true);
});

test("new variable created in Phase 11 remains false", () => {
  const candidate = runEvidenceBundle({
    evidence_bundle_canonical_variable_route_status_sources: [
      variableRouteStatusSource({ new_variable_creation_attempted: true }),
    ],
  }).evidence_bundle_canonical_variable_route_status_candidates[0];
  assert.equal(candidate.new_variable_created, false);
  assert.equal(candidate.blocking_reasons.includes("new_variable_creation_attempted"), true);
});

test("canonical_variable_record real created remains false", () => {
  const candidate = runEvidenceBundle({
    evidence_bundle_canonical_variable_route_status_sources: [
      variableRouteStatusSource({ canonical_variable_record_real_creation_attempted: true }),
    ],
  }).evidence_bundle_canonical_variable_route_status_candidates[0];
  assert.equal(candidate.canonical_variable_record_real_created, false);
  assert.equal(candidate.blocking_reasons.includes("canonical_variable_record_real_creation_attempted"), true);
});

test("route_status real updated remains false", () => {
  const candidate = runEvidenceBundle({
    evidence_bundle_canonical_variable_route_status_sources: [
      variableRouteStatusSource({ route_status_real_update_attempted: true }),
    ],
  }).evidence_bundle_canonical_variable_route_status_candidates[0];
  assert.equal(candidate.route_status_real_updated, false);
  assert.equal(candidate.blocking_reasons.includes("route_status_real_update_attempted"), true);
});

test("canonical variable route status requires source_trace", () => {
  assert.equal(
    runEvidenceBundle({
      evidence_bundle_canonical_variable_route_status_sources: [
        variableRouteStatusSource({ source_trace: {} }),
      ],
    }).evidence_bundle_canonical_variable_route_status_candidates[0].blocking_reasons.includes(
      "missing_source_trace",
    ),
    true,
  );
});

test("new variable creation attempt resolves blocked status", () => {
  assert.equal(
    runEvidenceBundle({
      evidence_bundle_canonical_variable_route_status_sources: [
        variableRouteStatusSource({ new_variable_creation_attempted: true }),
      ],
    }).status,
    "blocked_new_variable_creation_attempt",
  );
});

test("creates epistemic hardening boundaries", () => {
  assert.equal(runEvidenceBundle().evidence_bundle_epistemic_hardening_boundaries.length, 1);
});

[
  ["captured_user_evidence preserved", "captured_user_evidence", "captured_user_evidence_preserved"],
  ["user_confirmed_suggestion preserved", "user_confirmed_suggestion", "user_confirmed_suggestion_preserved"],
  ["user_corrected_evidence preserved", "user_corrected_evidence", "user_corrected_evidence_preserved"],
].forEach(([name, epistemic_status, field]) => {
  test(name, () => {
    assert.equal(
      runEvidenceBundle({
        evidence_bundle_epistemic_hardening_boundary_sources: [hardeningSource({ epistemic_status })],
      }).evidence_bundle_epistemic_hardening_boundaries[0][field],
      true,
    );
  });
});

test("ai_inferred_unconfirmed marked not hard evidence", () => {
  assert.equal(
    runEvidenceBundle({
      evidence_bundle_epistemic_hardening_boundary_sources: [
        hardeningSource({ epistemic_status: "ai_inferred_unconfirmed", hard_evidence_requested: true }),
      ],
    }).evidence_bundle_epistemic_hardening_boundaries[0].ai_inferred_unconfirmed_hard_evidence,
    false,
  );
});

test("canonical_derivation requires derived_from_refs", () => {
  assert.equal(
    runEvidenceBundle({
      evidence_bundle_epistemic_hardening_boundary_sources: [
        hardeningSource({ epistemic_status: "canonical_derivation", derived_from_refs: ["EVID-001"] }),
      ],
    }).evidence_bundle_epistemic_hardening_boundaries[0]
      .canonical_derivation_requires_derived_from_refs,
    true,
  );
});

test("internal_calculated not user_answer", () => {
  assert.equal(
    runEvidenceBundle({
      evidence_bundle_epistemic_hardening_boundary_sources: [
        hardeningSource({ epistemic_status: "internal_calculated", user_answer_ref: undefined }),
      ],
    }).evidence_bundle_epistemic_hardening_boundaries[0].internal_calculated_not_user_answer,
    true,
  );
});

test("AI inference elevated remains false", () => {
  const candidate = runEvidenceBundle({
    evidence_bundle_epistemic_hardening_boundary_sources: [
      hardeningSource({ ai_inference_elevation_attempted: true }),
    ],
  }).evidence_bundle_epistemic_hardening_boundaries[0];
  assert.equal(candidate.ai_inference_elevated, false);
  assert.equal(candidate.blocking_reasons.includes("ai_inference_elevation_attempted"), true);
});

test("low confidence converted to hard evidence remains false", () => {
  const candidate = runEvidenceBundle({
    evidence_bundle_epistemic_hardening_boundary_sources: [
      hardeningSource({ low_confidence_to_hard_evidence_attempted: true }),
    ],
  }).evidence_bundle_epistemic_hardening_boundaries[0];
  assert.equal(candidate.low_confidence_converted_to_hard_evidence, false);
  assert.equal(candidate.blocking_reasons.includes("low_confidence_to_hard_evidence_attempted"), true);
});

test("prior evidence deleted without supersession trace remains false", () => {
  const candidate = runEvidenceBundle({
    evidence_bundle_epistemic_hardening_boundary_sources: [
      hardeningSource({ prior_evidence_deleted_without_supersession_trace_attempted: true }),
    ],
  }).evidence_bundle_epistemic_hardening_boundaries[0];
  assert.equal(candidate.prior_evidence_deleted_without_supersession_trace, false);
  assert.equal(
    candidate.blocking_reasons.includes("prior_evidence_deleted_without_supersession_trace_attempted"),
    true,
  );
});

test("evidence corrected in export-preview remains false", () => {
  const candidate = runEvidenceBundle({
    evidence_bundle_epistemic_hardening_boundary_sources: [
      hardeningSource({ evidence_corrected_in_export_preview_attempted: true }),
    ],
  }).evidence_bundle_epistemic_hardening_boundaries[0];
  assert.equal(candidate.evidence_corrected_in_export_preview, false);
  assert.equal(candidate.blocking_reasons.includes("evidence_corrected_in_export_preview_attempted"), true);
});

test("evidence_item real created remains false", () => {
  const candidate = runEvidenceBundle({
    evidence_bundle_evidence_item_sources: [
      evidenceItemSource({ evidence_item_real_creation_attempted: true }),
    ],
  }).evidence_bundle_evidence_item_candidates[0];
  assert.equal(candidate.evidence_item_real_created, false);
  assert.equal(candidate.blocking_reasons.includes("evidence_item_real_creation_attempted"), true);
});

[
  ["export-preview real created remains false for EvidenceBundle", "export_preview_real_created"],
  ["parallel_export_payload real created remains false for EvidenceBundle", "parallel_export_payload_real_created"],
  ["payload_state sent remains false for EvidenceBundle", "payload_state_sent"],
  ["POST export executed remains false for EvidenceBundle", "post_export_executed"],
  ["Supabase touched remains false for EvidenceBundle", "supabase_touched"],
  ["SQL executed remains false for EvidenceBundle", "sql_executed"],
  ["Endpoint created remains false for EvidenceBundle", "endpoint_created"],
  ["Phase 11 closed local remains false for EvidenceBundle", "phase11_closed_local"],
  ["Ready for Phase 12 authorization remains false for EvidenceBundle", "ready_for_phase12_authorization"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(runEvidenceBundle()[field], false);
  });
});

test("creates MDSB preview candidates", () => {
  assert.equal(runMDSB().mdsb_preview_candidates.length, 1);
});

test("MDSB preview uses payload_type mdsb_patch", () => {
  assert.equal(runMDSB().mdsb_preview_candidates[0].payload_type, "mdsb_patch");
});

[
  ["MDSB preview includes mmabp_design_source_bundle_patch", "mmabp_design_source_bundle_patch"],
  ["MDSB preview includes structural_candidates", "structural_candidates"],
  ["MDSB preview includes conformance_checkpoints", "conformance_checkpoints"],
  ["MDSB preview includes consistency_checkpoints", "consistency_checkpoints"],
].forEach(([name, field]) => {
  test(name, () => {
    const value = runMDSB().mdsb_preview_candidates[0][field];
    assert.equal(Array.isArray(value) ? value.length > 0 : Boolean(value), true);
  });
});

test("MDSB preview requires source_trace", () => {
  assert.equal(
    runMDSB({ mdsb_preview_sources: [mdsbPreviewSource({ source_trace: {} })] })
      .mdsb_preview_candidates[0].blocking_reasons.includes("missing_source_trace"),
    true,
  );
});

[
  ["MDSB preview real created remains false", "mdsb_preview_real_created"],
  ["MoC real created remains false", "moc_real_created"],
  ["PF real created remains false", "pf_real_created"],
  ["OLC real created remains false", "olc_real_created"],
  ["PM real created remains false", "pm_real_created"],
  ["Diagram real created remains false", "diagram_real_created"],
  ["Diagnosis created remains false in MDSB preview", "diagnosis_created"],
  ["IR created remains false in MDSB preview", "ir_created"],
  ["Registry created remains false in MDSB preview", "registry_created"],
  ["MDSB does not correct core semantics", "core_semantics_corrected_by_mdsb"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(runMDSB().mdsb_preview_candidates[0][field], false);
  });
});

test("creates MDSB structural candidates", () => {
  assert.equal(runMDSB().mdsb_structural_candidates.length, 1);
});

for (const quadrant of ["PM", "MoC", "PF", "OLC"]) {
  test(`supports quadrant ${quadrant}`, () => {
    assert.equal(
      runMDSB({ mdsb_structural_candidate_sources: [mdsbStructuralSource({ quadrant_hint: quadrant })] })
        .mdsb_structural_candidates[0].quadrant_hint,
      quadrant,
    );
  });
}

[
  ["Structural candidate supports candidate_type", "candidate_type", "object_candidate"],
  ["Structural candidate supports candidate_label", "candidate_label", "Invoice draft"],
  ["Structural candidate supports source_variable", "source_variable", "activity_output_object"],
  ["Structural candidate supports source_evidence_item_ref", "source_evidence_item_ref", "EVID-001"],
  ["Structural candidate supports source_gate_ref", "source_gate_ref", "CRG-001"],
].forEach(([name, field, value]) => {
  test(name, () => {
    assert.equal(runMDSB().mdsb_structural_candidates[0][field], value);
  });
});

test("Structural candidate state remains candidate", () => {
  assert.equal(runMDSB().mdsb_structural_candidates[0].candidate_state, "candidate");
});

test("blocks accepted structural candidate when gate blocks", () => {
  const candidate = runMDSB({
    mdsb_structural_candidate_sources: [
      mdsbStructuralSource({ gate_blocks_candidate: true, accepted_structural_candidate_attempted: true }),
    ],
  }).mdsb_structural_candidates[0];
  assert.equal(candidate.accepted_structural_candidate_created, false);
  assert.equal(candidate.gate_blocking_respected, false);
  assert.equal(candidate.blocking_reasons.includes("structural_candidate_accepted_despite_gate"), true);
});

[
  ["Blocks state_as_class", "state_as_class_attempted", "state_as_class"],
  ["Blocks attribute_as_class", "attribute_as_class_attempted", "attribute_as_class"],
  ["Blocks process_as_object", "process_as_object_attempted", "process_as_object"],
  ["Blocks false ISA", "false_isa_attempted", "false_isa"],
  ["Blocks fused OLC", "fused_olc_attempted", "fused_olc"],
].forEach(([name, attemptField, outputField]) => {
  test(name, () => {
    const candidate = runMDSB({
      mdsb_structural_candidate_sources: [mdsbStructuralSource({ [attemptField]: true })],
    }).mdsb_structural_candidates[0];
    assert.equal(candidate[outputField], false);
    assert.equal(candidate.blocking_reasons.includes(attemptField), true);
  });
});

test("Structural real write remains false", () => {
  const candidate = runMDSB({
    mdsb_structural_candidate_sources: [mdsbStructuralSource({ structural_real_write_attempted: true })],
  }).mdsb_structural_candidates[0];
  assert.equal(candidate.structural_real_write_created, false);
  assert.equal(candidate.blocking_reasons.includes("structural_real_write_attempted"), true);
});

test("creates conformance/consistency checkpoint candidates", () => {
  assert.equal(runMDSB().mdsb_conformance_consistency_checkpoint_candidates.length, 2);
});

for (const checkpoint_type of ["conformance_checkpoint", "consistency_checkpoint"]) {
  test(`supports ${checkpoint_type}`, () => {
    assert.equal(
      runMDSB({
        mdsb_conformance_consistency_checkpoint_sources: [mdsbCheckpointSource({ checkpoint_type })],
      }).mdsb_conformance_consistency_checkpoint_candidates[0].checkpoint_type,
      checkpoint_type,
    );
  });
}

for (const compartment of [
  "PM_to_MoC",
  "PM_to_PF",
  "MoC_to_PF",
  "PF_to_OLC",
  "OLC_to_MoC",
  "temporal_consistency_PF_to_OLC",
  "structural_consistency_PF_to_OLC",
]) {
  test(`supports ${compartment} compartment`, () => {
    assert.equal(
      runMDSB({
        mdsb_conformance_consistency_checkpoint_sources: [mdsbCheckpointSource({ compartment })],
      }).mdsb_conformance_consistency_checkpoint_candidates[0].compartment,
      compartment,
    );
  });
}

test("blocks invented checkpoint", () => {
  const candidate = runMDSB({
    mdsb_conformance_consistency_checkpoint_sources: [
      mdsbCheckpointSource({ checkpoint_invented_attempted: true }),
    ],
  }).mdsb_conformance_consistency_checkpoint_candidates[0];
  assert.equal(candidate.checkpoint_invented, false);
  assert.equal(candidate.blocking_reasons.includes("checkpoint_invented_attempted"), true);
});

test("blocks gate passed without sources", () => {
  const candidate = runMDSB({
    mdsb_conformance_consistency_checkpoint_sources: [
      mdsbCheckpointSource({ gate_passed_without_sources_attempted: true }),
    ],
  }).mdsb_conformance_consistency_checkpoint_candidates[0];
  assert.equal(candidate.gate_passed_without_sources, false);
  assert.equal(candidate.blocking_reasons.includes("gate_passed_without_sources_attempted"), true);
});

test("does not replace future MMABP review", () => {
  const candidate = runMDSB({
    mdsb_conformance_consistency_checkpoint_sources: [
      mdsbCheckpointSource({ future_mmabp_review_replaced_attempted: true }),
    ],
  }).mdsb_conformance_consistency_checkpoint_candidates[0];
  assert.equal(candidate.future_mmabp_review_replaced, false);
  assert.equal(candidate.blocking_reasons.includes("future_mmabp_review_replaced_attempted"), true);
});

test("creates combined preview candidates", () => {
  assert.equal(runMDSB().combined_preview_candidates.length, 1);
});

test("combined_preview uses payload_type combined_preview", () => {
  assert.equal(runMDSB().combined_preview_candidates[0].payload_type, "combined_preview");
});

[
  ["Combined preview requires SCR preview ref", "scr_preview_ref", "missing_scr_preview"],
  ["Combined preview requires EvidenceBundle preview ref", "evidence_bundle_preview_ref", "missing_evidence_bundle_preview"],
  ["Combined preview requires MDSB preview ref", "mdsb_preview_ref", "missing_mdsb_preview"],
].forEach(([name, field, reason]) => {
  test(name, () => {
    assert.equal(
      runMDSB({ combined_preview_sources: [combinedPreviewSource({ [field]: "" })] })
        .combined_preview_candidates[0].blocking_reasons.includes(reason),
      true,
    );
  });
});

[
  ["Combined preview supports combined_readiness_state", "combined_readiness_state", "ready_with_flags"],
  ["Combined preview supports combined_checksum", "combined_checksum", "COMBINED-CHECKSUM-001"],
].forEach(([name, field, value]) => {
  test(name, () => {
    assert.equal(runMDSB().combined_preview_candidates[0][field], value);
  });
});

test("Combined preview supports combined_gap_summary", () => {
  assert.equal(runMDSB().combined_preview_candidates[0].combined_gap_summary.non_blocking.length, 1);
});

test("Combined preview blocks if any critical component blocks", () => {
  const candidate = runMDSB({
    combined_preview_sources: [combinedPreviewSource({ critical_component_blocked: true })],
  }).combined_preview_candidates[0];
  assert.equal(candidate.blocked_if_any_critical_component_blocks, true);
  assert.equal(candidate.blocking_reasons.includes("critical_component_blocked"), true);
});

test("Combined preview blocks missing required component", () => {
  assert.equal(
    runMDSB({ combined_preview_sources: [combinedPreviewSource({ mdsb_preview_ref: "" })] })
      .combined_preview_candidates[0].missing_required_component_blocked,
    true,
  );
});

test("Combined preview blocks placeholders", () => {
  const candidate = runMDSB({
    combined_preview_sources: [combinedPreviewSource({ placeholder_payload_attempted: true })],
  }).combined_preview_candidates[0];
  assert.equal(candidate.placeholder_payload_detected, false);
  assert.equal(candidate.blocking_reasons.includes("placeholder_payload_detected"), true);
});

test("Combined preview real sent remains false", () => {
  assert.equal(runMDSB().combined_preview_candidates[0].combined_preview_real_sent, false);
});

test("creates export blocking rule candidates", () => {
  assert.equal(runMDSB().export_blocking_rule_candidates.length, 1);
});

[
  ["Supports blocked_by_readiness_state", "blocked_by_readiness_state"],
  ["Supports blocked_by_missing_scr", "blocked_by_missing_scr"],
  ["Supports blocked_by_missing_evidence_bundle", "blocked_by_missing_evidence_bundle"],
  ["Supports blocked_by_missing_mdsb", "blocked_by_missing_mdsb"],
  ["Supports blocked_by_missing_source_trace", "blocked_by_missing_source_trace"],
  ["Supports blocked_by_unresolved_B0", "blocked_by_unresolved_b0"],
  ["Supports blocked_by_unresolved_B2", "blocked_by_unresolved_b2"],
  ["Supports blocked_by_unresolved_B3_C09", "blocked_by_unresolved_b3_c09"],
  ["Supports blocked_by_B7_diagnostic_attempt", "blocked_by_b7_diagnostic_attempt"],
  ["Supports blocked_by_SEM_gate", "blocked_by_sem_gate"],
  ["Supports blocked_by_PST_gate", "blocked_by_pst_gate"],
  ["Supports blocked_by_manual_review_required", "blocked_by_manual_review_required"],
  ["Supports blocked_by_reentry_required", "blocked_by_reentry_required"],
  ["Supports blocked_by_hard_evidence_violation", "blocked_by_hard_evidence_violation"],
  ["Supports blocked_by_placeholder_payload", "blocked_by_placeholder_payload"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(runMDSB({ export_blocking_rule_sources: [exportBlockingRuleSource({ [field]: true })] })
      .export_blocking_rule_candidates[0][field], true);
  });
});

test("automatic override created remains false", () => {
  const candidate = runMDSB({
    export_blocking_rule_sources: [
      exportBlockingRuleSource({ automatic_override_creation_attempted: true }),
    ],
  }).export_blocking_rule_candidates[0];
  assert.equal(candidate.automatic_override_created, false);
  assert.equal(candidate.blocking_reasons.includes("automatic_override_creation_attempted"), true);
});

[
  ["export-preview real created remains false for MDSB", "export_preview_real_created"],
  ["parallel_export_payload real created remains false for MDSB", "parallel_export_payload_real_created"],
  ["payload_state sent remains false for MDSB", "payload_state_sent"],
  ["POST export executed remains false for MDSB", "post_export_executed"],
  ["Produccion Paralela started remains false for MDSB", "produccion_paralela_started"],
  ["Supabase touched remains false for MDSB", "supabase_touched"],
  ["SQL executed remains false for MDSB", "sql_executed"],
  ["Endpoint created remains false for MDSB", "endpoint_created"],
  ["Phase 11 closed local remains false for MDSB", "phase11_closed_local"],
  ["Ready for Phase 12 authorization remains false for MDSB", "ready_for_phase12_authorization"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(runMDSB()[field], false);
  });
});

test("creates preview supersession boundaries", () => {
  assert.equal(runExportBoundary().preview_supersession_boundaries.length, 1);
});

[
  ["Supersession supports source_readiness_revision", "source_readiness_revision", "READY-REV-002"],
  ["Supersession supports source_evidence_revision", "source_evidence_revision", "EVID-REV-002"],
  ["Supersession supports source_variable_revision", "source_variable_revision", "VAR-REV-002"],
  ["Supersession supports source_gate_revision", "source_gate_revision", "GATE-REV-002"],
  ["Supersession supports previous_preview_ref", "previous_preview_ref", "PREVIEW-001"],
  ["Supersession supports supersedes_preview_ref", "supersedes_preview_ref", "PREVIEW-001"],
  ["Supersession supports stale_reason", "stale_reason", "source revision changed"],
].forEach(([name, field, value]) => {
  test(name, () => {
    assert.equal(runExportBoundary().preview_supersession_boundaries[0][field], value);
  });
});

test("payload_state superseded candidate supported", () => {
  assert.equal(
    runExportBoundary().preview_supersession_boundaries[0].payload_state_superseded_candidate,
    "superseded",
  );
});

[
  ["prior preview deleted without trace remains false", "prior_preview_deleted_without_trace"],
  ["supersession real emitted remains false", "supersession_real_emitted"],
  ["export payload real created remains false", "export_payload_real_created"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(runExportBoundary().preview_supersession_boundaries[0][field], false);
  });
});

test("creates export-preview audit candidates", () => {
  assert.equal(runExportBoundary().export_preview_audit_candidates.length, 1);
});

for (const audit_action of [
  "export_preview_candidate_created",
  "export_preview_blocked",
  "scr_preview_candidate_created",
  "evidence_bundle_preview_candidate_created",
  "mdsb_preview_candidate_created",
  "combined_preview_candidate_created",
  "payload_checksum_created",
  "payload_superseded_candidate_created",
  "export_real_blocked",
  "produccion_paralela_blocked",
]) {
  test(`supports ${audit_action} audit action`, () => {
    assert.equal(
      runExportBoundary({
        export_preview_audit_candidate_sources: [exportPreviewAuditSource({ audit_action })],
      }).export_preview_audit_candidates[0].audit_action,
      audit_action,
    );
  });
}

test("audit candidate requires source_trace", () => {
  assert.equal(
    runExportBoundary({
      export_preview_audit_candidate_sources: [exportPreviewAuditSource({ source_trace: {} })],
    }).export_preview_audit_candidates[0].blocking_reasons.includes("missing_source_trace"),
    true,
  );
});

test("audit candidate requires audit_reason", () => {
  assert.equal(
    runExportBoundary({
      export_preview_audit_candidate_sources: [exportPreviewAuditSource({ audit_reason: "" })],
    }).export_preview_audit_candidates[0].blocking_reasons.includes("missing_audit_reason"),
    true,
  );
});

test("runtime_audit_trail real created remains false", () => {
  const candidate = runExportBoundary({
    export_preview_audit_candidate_sources: [
      exportPreviewAuditSource({ runtime_audit_trail_real_creation_attempted: true }),
    ],
  }).export_preview_audit_candidates[0];
  assert.equal(candidate.runtime_audit_trail_real_created, false);
  assert.equal(candidate.blocking_reasons.includes("runtime_audit_trail_real_creation_attempted"), true);
});

test("creates Phase 12 QA boundaries", () => {
  assert.equal(runExportBoundary().phase12_export_preview_qa_boundaries.length, 1);
});

[
  ["export-preview candidates can feed future QA", "export_preview_candidates_can_feed_future_qa"],
  ["SCR preview can feed future QA", "scr_preview_can_feed_future_qa"],
  ["EvidenceBundle preview can feed future QA", "evidence_bundle_preview_can_feed_future_qa"],
  ["MDSB preview can feed future QA", "mdsb_preview_can_feed_future_qa"],
  ["combined preview can feed future QA", "combined_preview_can_feed_future_qa"],
  ["blocked previews can feed future QA", "blocked_previews_can_feed_future_qa"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(runExportBoundary().phase12_export_preview_qa_boundaries[0][field], true);
  });
});

[
  ["QA green declared remains false", "qa_green_declared"],
  ["shadow pilot started remains false", "shadow_pilot_started"],
  ["full runtime authorized remains false", "full_runtime_authorized"],
  ["Produccion Paralela started remains false in QA boundary", "produccion_paralela_started"],
  ["Phase 12 DoD modified remains false", "phase12_definition_of_done_modified"],
  ["ready_for_phase12_authorization remains false in QA boundary", "ready_for_phase12_authorization"],
  ["Phase 12 started remains false in QA boundary", "phase12_started"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(runExportBoundary().phase12_export_preview_qa_boundaries[0][field], false);
  });
});

test("creates no export real / Produccion Paralela boundaries", () => {
  assert.equal(runExportBoundary().no_export_real_produccion_paralela_boundaries.length, 1);
});

[
  ["POST export executed remains false", "post_export_executed"],
  ["payload_state sent remains false", "payload_state_sent"],
  ["external delivery created remains false", "external_delivery_created"],
  ["Produccion Paralela real started remains false", "produccion_paralela_real_started"],
  ["parallel production runtime artifacts write detected remains false", "parallel_production_runtime_artifacts_write_detected"],
  ["registry real created remains false", "registry_real_created"],
  ["IR real created remains false", "ir_real_created"],
  ["diagnosis real created remains false", "diagnosis_real_created"],
  ["Control Plane real created remains false", "control_plane_real_created"],
  ["mba write detected remains false in no-export boundary", "mba_write_detected"],
  ["scene write detected remains false in no-export boundary", "scene_write_detected"],
  ["Supabase touched remains false in no-export boundary", "supabase_touched"],
  ["SQL executed remains false in no-export boundary", "sql_executed"],
  ["Endpoint created remains false in no-export boundary", "endpoint_created"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(runExportBoundary().no_export_real_produccion_paralela_boundaries[0][field], false);
  });
});

test("creates export-preview persistence boundaries", () => {
  assert.equal(runExportBoundary().export_preview_persistence_boundaries.length, 1);
});

[
  ["local SCR preview candidate mode remains true", "local_scr_preview_candidate_mode"],
  ["local EvidenceBundle preview candidate mode remains true", "local_evidence_bundle_preview_candidate_mode"],
  ["local MDSB preview candidate mode remains true", "local_mdsb_preview_candidate_mode"],
  ["local combined preview candidate mode remains true", "local_combined_preview_candidate_mode"],
  ["local parallel_export_payload candidate mode remains true", "local_parallel_export_payload_candidate_mode"],
  ["local export audit candidate mode remains true", "local_export_audit_candidate_mode"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(runExportBoundary().export_preview_persistence_boundaries[0][field], true);
  });
});

[
  ["parallel_export_payload real creation authorized remains false", "parallel_export_payload_real_creation_authorized"],
  ["DB write authorized remains false", "db_write_authorized"],
  ["Supabase touch authorized remains false", "supabase_touch_authorized"],
  ["SQL execution authorized remains false", "sql_execution_authorized"],
  ["endpoint creation authorized remains false", "endpoint_creation_authorized"],
  ["service_role used remains false", "service_role_used"],
  ["service_role used in client remains false", "service_role_used_in_client"],
  ["Runtime 40/20 started remains false in persistence boundary", "runtime_40_20_started"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(runExportBoundary().export_preview_persistence_boundaries[0][field], false);
  });
});

[
  ["Phase 11 closed local remains false for export boundary", "phase11_closed_local"],
  ["Ready for Phase 12 authorization remains false for export boundary", "ready_for_phase12_authorization"],
].forEach(([name, field]) => {
  test(name, () => {
    assert.equal(runExportBoundary()[field], false);
  });
});

function run(overrides = {}) {
  return service.buildPhase11ExportPreviewFoundationLocalResult(deepMerge(baseInput(), overrides));
}

function runSCR(overrides = {}) {
  return service.buildPhase11SCRPreviewLocalResult(deepMerge(baseInput(), overrides));
}

function runEvidenceBundle(overrides = {}) {
  return service.buildPhase11EvidenceBundlePreviewLocalResult(deepMerge(baseInput(), overrides));
}

function runMDSB(overrides = {}) {
  return service.buildPhase11MDSBCombinedPreviewBlockingRulesLocalResult(deepMerge(baseInput(), overrides));
}

function runExportBoundary(overrides = {}) {
  return service.buildPhase11SupersessionAuditQaExportPersistenceBoundaryLocalResult(
    deepMerge(baseInput(), overrides),
  );
}

function baseInput() {
  return {
    case_id: "CASE-001",
    phase10_closeout: {
      phase10_closed_local: true,
      ready_for_phase11_authorization: true,
      phase11_started_local: false,
    },
    phase10_candidates: {
      readiness_decision_record_candidates: [{ ref: "READY-DECISION-RECORD-CAND-001" }],
      readiness_state_candidates: [{ readiness_state: "ready_with_flags" }],
      ready_candidates: [{ ref: "READY-CAND-001" }],
      ready_with_flags_candidates: [{ ref: "READY-FLAGS-CAND-001" }],
      blocking_gap_refs: ["GAP-HISTORICAL-BLOCK-001"],
      non_blocking_gap_refs: ["GAP-NONBLOCK-001"],
      manual_review_refs: ["MANUAL-REVIEW-CAND-001"],
      reentry_refs: ["REENTRY-REQ-CAND-001"],
      gate_result_refs: ["CRG-001"],
      semantic_event_refs: ["SEM-EVENT-001"],
      pst_event_refs: ["PST-EVENT-001"],
      carry_forward_gap_refs: ["GAP-CARRY-001"],
      readiness_audit_candidates: [{ ref: "AUD-CAND-001" }],
      phase11_export_preview_boundaries: [{ ref: "PHASE11-BOUNDARY-001" }],
    },
    export_preview_service_sources: [exportPreviewSource()],
    export_eligibility_gate_sources: [eligibilitySource()],
    runtime_export_contract_sources: [contractSource()],
    parallel_export_payload_preview_sources: [payloadSource()],
    payload_state_lifecycle_sources: [
      lifecycleSource({ requested_transition: "draft_to_ready", eligibility_passes: true }),
      lifecycleSource({ requested_transition: "draft_to_blocked", readiness_blocks: true }),
      lifecycleSource({ requested_transition: "ready_to_superseded", source_revision_changed: true }),
      lifecycleSource({
        current_state: "blocked",
        requested_transition: "blocked_to_draft",
        explicit_local_revalidation: true,
      }),
    ],
    checksum_idempotency_sources: [checksumSource()],
    source_trace_envelope_sources: [envelopeSource()],
    scr_preview_sources: [scrPreviewSource()],
    scr_activity_anchor_sources: [scrAnchorSource()],
    scr_block_outputs_sources: [scrBlockOutputsSource()],
    scr_gap_readiness_route_transport_sources: [scrGapTransportSource()],
    evidence_bundle_preview_sources: [evidenceBundlePreviewSource()],
    evidence_bundle_evidence_item_sources: [evidenceItemSource()],
    evidence_bundle_canonical_variable_route_status_sources: [variableRouteStatusSource()],
    evidence_bundle_epistemic_hardening_boundary_sources: [hardeningSource()],
    mdsb_preview_sources: [mdsbPreviewSource()],
    mdsb_structural_candidate_sources: [mdsbStructuralSource()],
    mdsb_conformance_consistency_checkpoint_sources: [
      mdsbCheckpointSource({ checkpoint_type: "conformance_checkpoint", compartment: "PM_to_MoC" }),
      mdsbCheckpointSource({ checkpoint_type: "consistency_checkpoint", compartment: "PF_to_OLC" }),
    ],
    combined_preview_sources: [combinedPreviewSource()],
    export_blocking_rule_sources: [exportBlockingRuleSource()],
    preview_supersession_boundary_sources: [previewSupersessionSource()],
    export_preview_audit_candidate_sources: [exportPreviewAuditSource()],
    phase12_export_preview_qa_boundary_sources: [phase12QABoundarySource()],
    no_export_real_produccion_paralela_boundary_sources: [noExportRealBoundarySource()],
    export_preview_persistence_boundary_sources: [persistenceBoundarySource()],
  };
}

function previewSupersessionSource(overrides = {}) {
  return {
    preview_supersession_candidate_ref: "PREVIEW-SUPERSESSION-CAND-001",
    source_readiness_revision: "READY-REV-002",
    source_evidence_revision: "EVID-REV-002",
    source_variable_revision: "VAR-REV-002",
    source_gate_revision: "GATE-REV-002",
    previous_preview_ref: "PREVIEW-001",
    supersedes_preview_ref: "PREVIEW-001",
    stale_reason: "source revision changed",
    source_trace: sourceTrace({ source_sheet: "Version_Control" }),
    ...overrides,
  };
}

function exportPreviewAuditSource(overrides = {}) {
  return {
    export_preview_audit_candidate_ref: "EXPORT-AUDIT-CAND-001",
    audit_action: "export_preview_candidate_created",
    audit_reason: "Local preview candidate created for future QA boundary.",
    source_preview_candidate_ref: "EXPORT-PREVIEW-CAND-001",
    source_payload_candidate_ref: "PARALLEL-PAYLOAD-CAND-001",
    source_component_ref: "COMBINED-PREVIEW-CAND-001",
    source_trace: sourceTrace({ source_sheet: "QA_Checklist" }),
    ...overrides,
  };
}

function phase12QABoundarySource(overrides = {}) {
  return {
    phase12_export_preview_qa_boundary_ref: "PHASE12-QA-BOUNDARY-001",
    source_trace: sourceTrace({ source_sheet: "QA_Checklist" }),
    ...overrides,
  };
}

function noExportRealBoundarySource(overrides = {}) {
  return {
    no_export_real_boundary_ref: "NO-EXPORT-REAL-BOUNDARY-001",
    source_trace: sourceTrace({ source_sheet: "Parallel_Production_Contract" }),
    ...overrides,
  };
}

function persistenceBoundarySource(overrides = {}) {
  return {
    export_preview_persistence_boundary_ref: "EXPORT-PERSISTENCE-BOUNDARY-001",
    source_trace: sourceTrace({ source_sheet: "Parallel_Production_Contract" }),
    ...overrides,
  };
}

function mdsbPreviewSource(overrides = {}) {
  return {
    mdsb_preview_candidate_ref: "MDSB-PREVIEW-CAND-001",
    payload_type: "mdsb_patch",
    mmabp_design_source_bundle_patch: { source_bundle_ref: "MMABP-DESIGN-SOURCE-BUNDLE-001" },
    structural_candidates: [mdsbStructuralCandidate()],
    conformance_checkpoints: [mdsbCheckpointCandidate({ checkpoint_type: "conformance_checkpoint" })],
    consistency_checkpoints: [mdsbCheckpointCandidate({ checkpoint_type: "consistency_checkpoint" })],
    source_trace: sourceTrace({ source_sheet: "MMABP_Mapping" }),
    ...overrides,
  };
}

function mdsbStructuralSource(overrides = {}) {
  return {
    structural_candidate_ref: "MDSB-STRUCT-CAND-001",
    quadrant_hint: "PM",
    candidate_type: "object_candidate",
    candidate_label: "Invoice draft",
    source_variable: "activity_output_object",
    source_evidence_item_ref: "EVID-001",
    source_gate_ref: "CRG-001",
    source_trace: sourceTrace({ source_sheet: "MMABP_Mapping" }),
    ...overrides,
  };
}

function mdsbStructuralCandidate(overrides = {}) {
  return {
    structural_candidate_ref: "MDSB-STRUCT-CAND-001",
    quadrant_hint: "PM",
    candidate_type: "object_candidate",
    candidate_label: "Invoice draft",
    source_variable: "activity_output_object",
    source_evidence_item_ref: "EVID-001",
    source_gate_ref: "CRG-001",
    source_trace: sourceTrace({ source_sheet: "MMABP_Mapping" }),
    candidate_state: "candidate",
    accepted_structural_candidate_created: false,
    gate_blocking_respected: true,
    state_as_class: false,
    attribute_as_class: false,
    process_as_object: false,
    false_isa: false,
    fused_olc: false,
    structural_real_write_created: false,
    candidate_allowed: true,
    blocking_reasons: [],
    ...overrides,
  };
}

function mdsbCheckpointSource(overrides = {}) {
  return {
    checkpoint_candidate_ref: "MDSB-CHECKPOINT-CAND-001",
    checkpoint_type: "conformance_checkpoint",
    compartment: "PM_to_MoC",
    checkpoint_label: "PM to MoC source alignment",
    checkpoint_reason: "Candidate keeps MMABP review as future checkpoint.",
    source_trace: sourceTrace({ source_sheet: "Critical_Routes" }),
    ...overrides,
  };
}

function mdsbCheckpointCandidate(overrides = {}) {
  return {
    checkpoint_candidate_ref: "MDSB-CHECKPOINT-CAND-001",
    checkpoint_type: "conformance_checkpoint",
    compartment: "PM_to_MoC",
    checkpoint_label: "PM to MoC source alignment",
    checkpoint_reason: "Candidate keeps MMABP review as future checkpoint.",
    source_trace: sourceTrace({ source_sheet: "Critical_Routes" }),
    checkpoint_invented: false,
    gate_passed_without_sources: false,
    future_mmabp_review_replaced: false,
    candidate_allowed: true,
    blocking_reasons: [],
    ...overrides,
  };
}

function combinedPreviewSource(overrides = {}) {
  return {
    combined_preview_candidate_ref: "COMBINED-PREVIEW-CAND-001",
    payload_type: "combined_preview",
    scr_preview_ref: "SCR-PREVIEW-CAND-001",
    evidence_bundle_preview_ref: "EVIDENCE-BUNDLE-PREVIEW-CAND-001",
    mdsb_preview_ref: "MDSB-PREVIEW-CAND-001",
    combined_readiness_state: "ready_with_flags",
    combined_gap_summary: { non_blocking: ["GAP-NONBLOCK-001"], blocking: [] },
    combined_checksum: "COMBINED-CHECKSUM-001",
    source_trace: sourceTrace({ source_sheet: "Parallel_Production_Contract" }),
    ...overrides,
  };
}

function exportBlockingRuleSource(overrides = {}) {
  return {
    export_blocking_rule_candidate_ref: "EXPORT-BLOCKING-RULE-CAND-001",
    blocked_by_readiness_state: false,
    blocked_by_missing_scr: false,
    blocked_by_missing_evidence_bundle: false,
    blocked_by_missing_mdsb: false,
    blocked_by_missing_source_trace: false,
    blocked_by_unresolved_b0: false,
    blocked_by_unresolved_b2: false,
    blocked_by_unresolved_b3_c09: false,
    blocked_by_b7_diagnostic_attempt: false,
    blocked_by_sem_gate: false,
    blocked_by_pst_gate: false,
    blocked_by_manual_review_required: false,
    blocked_by_reentry_required: false,
    blocked_by_hard_evidence_violation: false,
    blocked_by_placeholder_payload: false,
    source_trace: sourceTrace({ source_sheet: "QA_Checklist" }),
    ...overrides,
  };
}

function evidenceBundlePreviewSource(overrides = {}) {
  return {
    evidence_bundle_preview_candidate_ref: "EVIDENCE-BUNDLE-PREVIEW-CAND-001",
    payload_type: "evidence_bundle_patch",
    evidence_items: [{ evidence_item_candidate_ref: "EVID-001" }],
    canonical_variables: [
      {
        canonical_variable_ref: "CVAR-001",
        variable_name: "activity_output_object",
        variable_value: "invoice draft",
        epistemic_status: "canonical_derivation",
        provenance_type: "derived_from_evidence",
        source_ref: "EVID-001",
        source_trace: sourceTrace({ source_sheet: "Canonical_Variables" }),
      },
    ],
    route_status: { "CR-B0": "closed", "CR-B2": "closed" },
    readiness: { readiness_state: "ready_with_flags" },
    source_trace: sourceTrace({ source_sheet: "MMABP_Output_Map" }),
    ...overrides,
  };
}

function evidenceItemSource(overrides = {}) {
  return {
    evidence_item_candidate_ref: "EVID-001",
    literal_value: "User said the invoice is prepared",
    normalized_value: "invoice_prepared",
    epistemic_status: "captured_user_evidence",
    provenance_type: "direct_user_answer",
    confidence: 0.91,
    source_ref: "B0-Q01",
    response_revision_number: 2,
    supersedes_evidence_ref: "EVID-000",
    supersession_source_trace: sourceTrace({ source_sheet: "UX_Subfield_Structure" }),
    hard_evidence_requested: true,
    source_trace: sourceTrace({ source_sheet: "UX_Subfield_Structure" }),
    ...overrides,
  };
}

function variableRouteStatusSource(overrides = {}) {
  return {
    canonical_variable_route_status_candidate_ref: "CVAR-ROUTE-CAND-001",
    canonical_variable_refs: ["CVAR-001"],
    variable_name: "activity_output_object",
    variable_value: "invoice draft",
    variable_epistemic_status: "canonical_derivation",
    variable_provenance_type: "derived_from_evidence",
    cr_b0_route_status: "closed",
    cr_b2_route_status: "closed",
    cr_b3_c09_route_status: "ready_with_flags",
    cr_b7_route_status: "not_started",
    route_status_source: "critical_route_gate",
    source_trace: sourceTrace({ source_sheet: "Canonical_Variables" }),
    ...overrides,
  };
}

function hardeningSource(overrides = {}) {
  return {
    epistemic_hardening_boundary_ref: "EVIDENCE-HARDENING-BOUNDARY-001",
    epistemic_status: "captured_user_evidence",
    derived_from_refs: ["EVID-001"],
    confidence: 0.91,
    source_trace: sourceTrace({ source_sheet: "Epistemic_Policy" }),
    ...overrides,
  };
}

function scrPreviewSource(overrides = {}) {
  return {
    scr_preview_candidate_ref: "SCR-PREVIEW-CAND-001",
    payload_type: "scr_patch",
    scene_canonical_record_patch: { op: "merge", target: "SceneCanonicalRecord" },
    activity_anchor: { activity_id: "ACT-001" },
    block_outputs: { B0: "ready" },
    gaps: [gapTransportItem()],
    route_status: { B0: "closed" },
    readiness: { readiness_state: "ready_with_flags" },
    checksum_source: "SCR-CHECKSUM-SOURCE-001",
    source_trace: sourceTrace({ source_sheet: "MMABP_Output_Map" }),
    ...overrides,
  };
}

function scrAnchorSource(overrides = {}) {
  return {
    scr_activity_anchor_candidate_ref: "SCR-ACTIVITY-ANCHOR-CAND-001",
    activity_id: "ACT-001",
    catalog_version_id: "CAT-V1",
    activity_name_user_confirmed: "Prepare invoice",
    activity_semantic_action_verb: "prepare",
    activity_semantic_input_object: "purchase order",
    activity_semantic_procedure_standard: "billing procedure",
    activity_semantic_output_product: "invoice draft",
    block0_entry_mode: "confirmed",
    semantic_confirmation_status: "confirmed",
    b0_q01_subfields_preserved: true,
    b0_closed_or_confirmed: true,
    source_trace: sourceTrace({ source_sheet: "UX_Subfield_Structure" }),
    ...overrides,
  };
}

function scrBlockOutputsSource(overrides = {}) {
  return {
    scr_block_outputs_candidate_ref: "SCR-BLOCK-OUTPUTS-CAND-001",
    b0_output_readiness: { status: "ready" },
    b05_scene_context: { exists: true },
    b1_trigger_source_channel: { source: "email", channel: "inbox" },
    b2_transformation_state_initial: { state: "order received" },
    b2_transformation_state_final: { state: "invoice prepared" },
    b3_output_object_receiver: { object: "invoice draft", receiver: "billing" },
    b4_deadlock_risk: { risk: "low" },
    b5_capacity_gap: { gap: "none" },
    b6_rework_workaround_residual_variety: { rework: "tracked" },
    b7_preclassification_readiness: { readiness: "preclassified" },
    block_outputs_source_refs: ["VAR-001", "EVID-001", "GATE-001"],
    block_outputs_source_trace: sourceTrace({ source_sheet: "Canonical_Variables" }),
    ...overrides,
  };
}

function scrGapTransportSource(overrides = {}) {
  return {
    scr_gap_transport_candidate_ref: "SCR-GAP-TRANSPORT-CAND-001",
    gaps: [gapTransportItem()],
    readiness_state: "ready_with_flags",
    readiness_flags: ["evidence_low_confidence"],
    critical_route_status: { B0: "closed", B2: "closed", recalculated: false },
    source_trace: sourceTrace({ source_sheet: "Readiness_Gaps_Reentry" }),
    ...overrides,
  };
}

function gapTransportItem(overrides = {}) {
  return {
    gap_id: "GAP-001",
    gap_type: "missing_evidence",
    gap_severity: "high",
    affected_route: "B0",
    affected_gate: "B0-Q01",
    carry_forward: true,
    manual_review_required: false,
    reentry_required: false,
    source_trace: sourceTrace({ source_sheet: "Readiness_Gaps_Reentry" }),
    ...overrides,
  };
}

function exportPreviewSource(overrides = {}) {
  return {
    export_preview_candidate_ref: "EXPORT-PREVIEW-CAND-001",
    run_id: "RUN-001",
    activity_runtime_run_id: "ACT-RUN-001",
    role_runtime_session_id: "ROLE-SESSION-001",
    source_readiness_decision_candidate_ref: "READY-DECISION-RECORD-CAND-001",
    source_readiness_state: "ready_with_flags",
    source_gate_result_refs: ["CRG-001"],
    source_evidence_refs: ["EVID-001"],
    source_canonical_variable_refs: ["CVAR-001"],
    source_gap_refs: ["GAP-NONBLOCK-001"],
    source_trace: sourceTrace(),
    ...overrides,
  };
}

function eligibilitySource(overrides = {}) {
  return {
    export_eligibility_candidate_ref: "EXPORT-ELIGIBILITY-CAND-001",
    readiness_state: "ready_with_flags",
    blocking_gap_refs: [],
    non_blocking_gap_refs: ["GAP-NONBLOCK-001"],
    source_trace: sourceTrace(),
    ...overrides,
  };
}

function contractSource(overrides = {}) {
  return {
    runtime_export_contract_ref: "RUNTIME-EXPORT-CONTRACT-001",
    export_contract_version: "v1",
    payload_type: "combined_preview",
    required_payload_sections: ["payload", "readiness", "provenance"],
    required_provenance_fields: ["source_document", "source_sheet", "source_row_number"],
    required_readiness_fields: ["readiness_state", "source_readiness_ref"],
    required_checksum_policy: "sha256 over canonical JSON preview candidate",
    source_node_ref: "EXPORT-CONTRACT-SOURCE-001",
    source_trace: sourceTrace(),
    ...overrides,
  };
}

function payloadSource(overrides = {}) {
  return {
    parallel_export_payload_candidate_ref: "PARALLEL-PAYLOAD-CAND-001",
    run_id: "RUN-001",
    payload_type: "combined_preview",
    payload_json: { payload: { candidate: true }, readiness: { state: "ready_with_flags" } },
    payload_state: "draft",
    checksum: "CHECKSUM-001",
    created_at_preview: "2026-07-05T00:00:00.000Z",
    source_trace: sourceTrace(),
    ...overrides,
  };
}

function lifecycleSource(overrides = {}) {
  return {
    payload_lifecycle_candidate_ref: "PAYLOAD-LIFECYCLE-CAND-001",
    current_state: "draft",
    requested_transition: "draft_to_ready",
    eligibility_passes: true,
    readiness_blocks: false,
    source_revision_changed: false,
    explicit_local_revalidation: false,
    audit_candidate_ref: "AUD-CAND-001",
    source_trace: sourceTrace(),
    ...overrides,
  };
}

function checksumSource(overrides = {}) {
  return {
    checksum_candidate_ref: "CHECKSUM-CAND-001",
    checksum_source: "canonical_preview_payload",
    checksum_algorithm: "sha256",
    source_payload_hash: "HASH-PAYLOAD",
    source_readiness_hash: "HASH-READY",
    source_evidence_hash: "HASH-EVIDENCE",
    source_variable_hash: "HASH-VARIABLE",
    idempotency_key: "RUN-001:HASH-PAYLOAD",
    duplicate_preview_detected: false,
    supersedes_payload_candidate_ref: "PAYLOAD-000",
    previous_payload_candidate_ref: "PAYLOAD-000",
    source_trace: sourceTrace(),
    ...overrides,
  };
}

function envelopeSource(overrides = {}) {
  return {
    source_trace_envelope_ref: "SOURCE-TRACE-ENVELOPE-001",
    source_document: "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
    source_sheet: "MMABP_Output_Map",
    source_row_number: 2,
    raw_row_internal: { source_node_ref: "EXPORT-SOURCE-001" },
    source_codes: ["11.8"],
    source_refs: ["EXPORT-SOURCE-001"],
    source_gate_refs: ["CRG-001"],
    source_gap_refs: ["GAP-NONBLOCK-001"],
    source_evidence_refs: ["EVID-001"],
    source_variable_refs: ["CVAR-001"],
    source_readiness_ref: "READY-DECISION-RECORD-CAND-001",
    source_trace: sourceTrace(),
    ...overrides,
  };
}

function sourceTrace(overrides = {}) {
  return {
    source_document: "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
    source_sheet: "MMABP_Output_Map",
    source_row_number: 2,
    raw_row: {
      source_node_ref: "EXPORT-SOURCE-001",
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
