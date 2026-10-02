import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const service = loadModule("runtime-40-20-response-ingest-service.ts", {
  "./runtime-40-20-response-ingest-types": {},
});

test("creates ingest result from valid InteractionViewModel and user answer", () => {
  const result = run();

  assert.equal(result.ok, true);
  assert.equal(result.ingest_status, "ingest_candidate_ready");
});

test("promotes ResponseIngest as Phase 6 artifact after Phase 5 closeout", () => {
  const result = run();

  assert.equal(result.materiality.local_only, true);
  assert.equal(result.materiality.runtime_40_20_started, false);
  assert.equal(result.response_payload_contract.runtime_interaction_id, "B0-Q01");
});

test("response payload includes runtime_interaction_id", () => {
  assert.equal(run().response_payload_contract.runtime_interaction_id, "B0-Q01");
});

test("response payload includes interaction_instance_id_preview", () => {
  assert.equal(
    run().response_payload_contract.interaction_instance_id_preview,
    "RUN-001:B0-Q01:preview",
  );
});

test("response payload includes case_id", () => {
  assert.equal(run().response_payload_contract.case_id, "CASE-001");
});

test("response payload supports optional run_id", () => {
  assert.equal(
    run({ response_payload: responsePayload({ run_id: "RUN-001" }) })
      .response_payload_contract.run_id,
    "RUN-001",
  );
});

test("response payload exposes answers and subfield_answers", () => {
  const payload = run().response_payload_contract;

  assert.equal(payload.answers.length, 5);
  assert.equal(payload.subfield_answers.length, 5);
  assert.equal(payload.answers[0], payload.subfield_answers[0]);
});

test("response payload includes confirmation_status", () => {
  assert.equal(run().response_payload_contract.confirmation_status, "confirmed");
});

test("response payload includes correction_status", () => {
  assert.equal(run().response_payload_contract.correction_status, "no_correction");
});

test("response payload preserves source_trace from InteractionViewModel", () => {
  const result = run();

  assert.equal(
    result.response_payload_contract.answers[0].source_trace,
    result.subfield_response_candidates[0].source_trace,
  );
});

test("creates subfield response candidates", () => {
  const candidates = run().subfield_response_candidates;

  assert.equal(candidates.length, 5);
  assert.equal(candidates[0].subfield_name, "action_verb");
  assert.equal(candidates[0].real_subfield_response_created, false);
});

test("subfield answers preserve subfield_name", () => {
  assert.equal(run().response_payload_contract.answers[0].subfield_name, "action_verb");
});

test("subfield answers preserve value from payload only", () => {
  assert.equal(run().response_payload_contract.answers[0].value, "Elaborar reporte operativo");
});

test("subfield answers preserve expected_type", () => {
  assert.equal(run().response_payload_contract.answers[0].expected_type, "text");
});

test("subfield answers preserve required flag", () => {
  assert.equal(run().response_payload_contract.answers[0].required, true);
});

test("subfield answers preserve epistemic_status", () => {
  assert.equal(run().response_payload_contract.answers[0].epistemic_status, "captured_user_evidence");
});

test("subfield answers preserve provenance_type", () => {
  assert.equal(run().response_payload_contract.answers[0].provenance_type, "user_answer");
});

test("subfield answers preserve source_trace", () => {
  assert.equal(
    run().response_payload_contract.answers[0].source_trace.source_sheet,
    "UX_Subfield_Structure",
  );
});

test("creates evidence item candidate for captured_user_evidence + user_answer", () => {
  const evidence = run().evidence_item_candidates[0];

  assert.equal(evidence.epistemic_status, "captured_user_evidence");
  assert.equal(evidence.provenance_type, "user_answer");
  assert.equal(evidence.hard_evidence, true);
});

test("creates evidence item candidates locally", () => {
  assert.equal(run().evidence_item_candidates.length, 4);
});

test("evidence candidate preserves literal_answer", () => {
  assert.equal(run().evidence_item_candidates[0].literal_answer, "Elaborar reporte operativo");
});

test("evidence candidate preserves normalized_value when provided", () => {
  const result = run({
    response_payload: responsePayload({
      answers: b0Answers({ normalized_value: "elaborar_reporte_operativo" }),
    }),
  });

  assert.equal(result.evidence_item_candidates[0].normalized_value, "elaborar_reporte_operativo");
});

test("evidence candidate preserves provenance_type", () => {
  assert.equal(run().evidence_item_candidates[0].provenance_type, "user_answer");
});

test("evidence candidate preserves epistemic_status", () => {
  assert.equal(run().evidence_item_candidates[0].epistemic_status, "captured_user_evidence");
});

test("evidence candidate preserves confidence when provided", () => {
  const result = run({
    response_payload: responsePayload({
      answers: b0Answers({ confidence: 0.91 }),
    }),
  });

  assert.equal(result.evidence_item_candidates[0].confidence, 0.91);
});

test("evidence candidate preserves source_ref and source_trace", () => {
  const evidence = run({
    response_payload: responsePayload({
      answers: b0Answers({ source_ref: "SRC-B0-Q01-ACTION" }),
    }),
  }).evidence_item_candidates[0];

  assert.equal(evidence.source_ref, "SRC-B0-Q01-ACTION");
  assert.equal(evidence.source_trace.source_sheet, "UX_Subfield_Structure");
});

test("evidence_item real created remains false", () => {
  assert.equal(run().evidence_item_candidates[0].real_evidence_item_created, false);
});

test("blocks evidence from absent response", () => {
  const result = run({
    response_payload: responsePayload({
      answers: b0Answers({ value: null, evidence_candidate_requested: true }),
    }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.ingest_status, "blocked_evidence_from_absence");
});

test("does not create hard evidence for ai_inferred_unconfirmed", () => {
  const result = run({
    response_payload: responsePayload({
      answers: b0Answers({
        epistemic_status: "ai_inferred_unconfirmed",
        provenance_type: "ai_suggestion",
      }),
    }),
  });

  assert.equal(result.ok, true);
  assert.equal(result.evidence_item_candidates.length, 0);
});

test("blocks ai_inferred_unconfirmed as hard evidence", () => {
  const result = run({
    response_payload: responsePayload({
      answers: b0Answers({
        epistemic_status: "ai_inferred_unconfirmed",
        provenance_type: "ai_suggestion",
        hard_evidence_requested: true,
      }),
    }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.ingest_status, "blocked_ai_inference_as_hard_evidence");
});

test("missing subfield is not inferable value", () => {
  assert.equal(run().evidence_boundary_decision.missing_subfield_is_not_inferable_value, true);
});

test("pending microconfirmation is not evidence", () => {
  const result = run({
    response_payload: responsePayload({
      answers: b0Answers({ pending_microconfirmation: true }),
    }),
  });

  assert.equal(result.evidence_boundary_decision.pending_microconfirmation_is_not_evidence, true);
  assert.equal(result.evidence_item_candidates.length, 0);
});

test("review_gap is not evidence", () => {
  const result = run({
    response_payload: responsePayload({
      answers: b0Answers({ review_gap: true }),
    }),
  });

  assert.equal(result.evidence_boundary_decision.review_gap_is_not_evidence, true);
  assert.equal(result.evidence_item_candidates.length, 0);
});

test("B7/C20 creates no diagnosis", () => {
  assert.equal(run().evidence_boundary_decision.b7_c20_no_diagnosis, true);
  assert.equal(run().no_go_check.diagnosis_created, false);
});

test("B7/C20 creates no IR", () => {
  assert.equal(run().evidence_boundary_decision.b7_c20_no_ir, true);
  assert.equal(run().no_go_check.ir_real_created, false);
});

test("B7/C20 creates no registry", () => {
  assert.equal(run().evidence_boundary_decision.b7_c20_no_registry, true);
  assert.equal(run().no_go_check.registry_live_db_created, false);
});

test("B7/C20 signal remains non diagnostic only", () => {
  assert.equal(run().evidence_boundary_decision.b7_c20_signal_non_diagnostic_only, true);
});

test("creates evidence candidate for user_confirmed_suggestion with confirmation_reference", () => {
  const result = run({
    response_payload: responsePayload({
      answers: b0Answers({
          epistemic_status: "user_confirmed_suggestion",
          provenance_type: "user_confirmation",
          confirmation_reference: "CONF-001",
      }),
    }),
  });

  assert.equal(result.evidence_item_candidates.length, 4);
  assert.equal(result.evidence_item_candidates[0].hard_evidence, true);
});

test("blocks user_confirmed_suggestion without confirmation_reference", () => {
  const result = run({
    response_payload: responsePayload({
      answers: b0Answers({
          epistemic_status: "user_confirmed_suggestion",
          provenance_type: "user_confirmation",
          confirmation_reference: undefined,
      }),
    }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.ingest_status, "blocked_missing_confirmation_or_correction_reference");
});

test("user_confirmed_suggestion creates confirmation intake decision", () => {
  const result = run({
    response_payload: responsePayload({
      answers: b0Answers({
        epistemic_status: "user_confirmed_suggestion",
        provenance_type: "user_confirmation",
        confirmation_reference: "CONF-001",
      }),
    }),
  });
  const decision = result.confirmation_correction_intake_decisions[0];

  assert.equal(decision.confirmation_reference_required, true);
  assert.equal(decision.confirmation_reference_present, true);
  assert.equal(decision.user_confirmation_accepted, true);
});

test("creates correction candidate for user_corrected_evidence with supersedes_response_ref", () => {
  const result = run({
    response_payload: responsePayload({
      response_revision_number: 2,
      supersedes_response_ref: "RESP-001",
      answers: b0Answers({
          epistemic_status: "user_corrected_evidence",
          provenance_type: "user_correction",
      }),
    }),
  });

  assert.equal(result.ok, true);
  assert.equal(result.evidence_item_candidates.length, 4);
});

test("blocks correction without supersedes_response_ref", () => {
  const result = run({
    response_payload: responsePayload({
      answers: b0Answers({
          epistemic_status: "user_corrected_evidence",
          provenance_type: "user_correction",
      }),
    }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.ingest_status, "blocked_missing_confirmation_or_correction_reference");
});

test("user_corrected_evidence passes with correction_reference", () => {
  const result = run({
    response_payload: responsePayload({
      response_revision_number: 2,
      supersedes_response_ref: "RESP-001",
      answers: b0Answers({
        epistemic_status: "user_corrected_evidence",
        provenance_type: "user_correction",
        correction_reference: "RESP-001",
      }),
    }),
  });
  const decision = result.confirmation_correction_intake_decisions[0];

  assert.equal(result.ok, true);
  assert.equal(decision.correction_reference_required, true);
  assert.equal(decision.correction_reference_present, true);
  assert.equal(decision.user_correction_accepted, true);
});

test("blocks canonical_derivation without derived_from_refs", () => {
  const result = run({
    response_payload: responsePayload({
      answers: b0Answers({
          epistemic_status: "canonical_derivation",
          provenance_type: "canonical_derivation",
      }),
    }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.ingest_status, "blocked_epistemic_violation");
});

test("blocks internal_calculated as user_answer", () => {
  const result = run({
    response_payload: responsePayload({
      answers: b0Answers({
          epistemic_status: "internal_calculated",
          provenance_type: "user_answer",
      }),
    }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.ingest_status, "blocked_epistemic_violation");
});

test("ai_inferred_unconfirmed remains unconfirmed", () => {
  const result = run({
    response_payload: responsePayload({
      answers: b0Answers({
        epistemic_status: "ai_inferred_unconfirmed",
        provenance_type: "ai_suggestion",
      }),
    }),
  });

  assert.equal(
    result.confirmation_correction_intake_decisions[0].ai_inferred_unconfirmed_remains_unconfirmed,
    true,
  );
  assert.equal(result.epistemic_enforcement_decisions[0].ai_inference_elevated_to_hard_evidence, false);
});

test("captured_user_evidence requires provenance_type=user_answer", () => {
  const result = run({
    response_payload: responsePayload({
      answers: b0Answers({ provenance_type: "ai_suggestion" }),
    }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.ingest_status, "blocked_epistemic_violation");
});

test("provenance_type is required", () => {
  const result = run({
    response_payload: responsePayload({
      answers: b0Answers({ provenance_type: undefined }),
    }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.ingest_status, "blocked_missing_provenance");
});

test("blocks if renderer_status is not render_model_ready", () => {
  const result = run({
    interaction_view_model: viewModel({ renderer_status: "blocked_missing_visible_text" }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.ingest_status, "blocked_renderer_not_ready");
});

test("blocks if ui_rendered_real=true", () => {
  const result = run({
    interaction_view_model: viewModel({ ui_rendered_real: true }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.ingest_status, "blocked_renderer_not_ready");
});

test("blocks if source_trace missing", () => {
  const model = viewModel();
  delete model.source_trace;

  const result = run({ interaction_view_model: model });

  assert.equal(result.ok, false);
  assert.equal(result.ingest_status, "blocked_missing_source_traceability");
});

test("blocks if explicit_policy_present=false", () => {
  const result = run({
    interaction_view_model: viewModel({
      epistemic_policy: {
        ...viewModel().epistemic_policy,
        explicit_policy_present: false,
      },
    }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.ingest_status, "blocked_missing_epistemic_policy");
});

test("blocks missing idempotency_key", () => {
  const result = run({ response_payload: responsePayload({ idempotency_key: "" }) });

  assert.equal(result.ok, false);
  assert.equal(result.ingest_status, "blocked_missing_idempotency_key");
});

test("creates validation_blocking_decision", () => {
  const decision = run().validation_blocking_decision;

  assert.equal(decision.validation_passed, true);
  assert.equal(decision.blocking_reasons.length, 0);
  assert.equal(decision.real_response_persisted, false);
});

test("creates idempotency_decision", () => {
  const decision = run().idempotency_decision;

  assert.equal(decision.idempotency_key, "IDEMP-001");
  assert.equal(decision.idempotency_key_present, true);
  assert.equal(decision.real_idempotency_record_created, false);
});

test("detects idempotency replay without duplicate response candidate", () => {
  const result = run({ options: { prior_idempotency_keys: ["IDEMP-001"] } });

  assert.equal(result.ok, true);
  assert.equal(result.idempotency_decision.idempotency_replay_detected, true);
  assert.equal(result.idempotency_decision.duplicate_response_created, false);
  assert.equal(result.subfield_response_candidates.length, 0);
  assert.equal(result.evidence_item_candidates.length, 0);
});

test("blocks missing response_revision_number", () => {
  const payload = responsePayload();
  delete payload.response_revision_number;

  const result = run({ response_payload: payload });

  assert.equal(result.ok, false);
  assert.equal(result.ingest_status, "blocked_missing_revision_number");
  assert.equal(
    result.validation_blocking_decision.blocking_reasons.includes(
      "missing_response_revision_number",
    ),
    true,
  );
});

test("allows response_revision_number = 1 without supersedes_response_ref", () => {
  const result = run({ response_payload: responsePayload({ response_revision_number: 1 }) });

  assert.equal(result.ok, true);
  assert.equal(result.revision_decision.supersedes_response_ref_required, false);
});

test("blocks revision > 1 without supersedes_response_ref", () => {
  const result = run({
    response_payload: responsePayload({ response_revision_number: 2 }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.ingest_status, "blocked_missing_supersedes_reference");
});

test("preserves supersedes_response_ref when revision > 1", () => {
  const result = run({
    response_payload: responsePayload({
      response_revision_number: 2,
      supersedes_response_ref: "RESP-001",
    }),
  });

  assert.equal(result.revision_decision.supersedes_response_ref_required, true);
  assert.equal(result.revision_decision.supersedes_response_ref_present, true);
  assert.equal(result.response_revision_candidate.supersedes_response_ref, "RESP-001");
});

test("correction preserves replaced reference", () => {
  const result = run({
    response_payload: responsePayload({
      response_revision_number: 2,
      supersedes_response_ref: "RESP-001",
      answers: b0Answers({
          epistemic_status: "user_corrected_evidence",
          provenance_type: "user_correction",
          correction_reference: "RESP-001",
      }),
    }),
  });

  assert.equal(result.revision_decision.correction_reference_preserved, true);
  assert.equal(result.confirmation_correction_intake_decisions[0].previous_reference_preserved, true);
  assert.equal(
    result.confirmation_correction_intake_decisions[0].correction_overrides_previous_inference_locally,
    true,
  );
});

test("previous evidence is not deleted without trace", () => {
  assert.equal(run().revision_decision.previous_evidence_deleted_without_trace, false);
});

test("advanced recomputation is deferred", () => {
  assert.equal(run().revision_decision.advanced_recomputation_deferred, true);
});

test("blocks unknown subfield", () => {
  const result = run({
    response_payload: responsePayload({
      answers: [...b0Answers(), answer({ subfield_name: "unknown_subfield" })],
    }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.ingest_status, "blocked_unknown_subfield");
});

test("blocks invalid epistemic_status", () => {
  const result = run({
    response_payload: responsePayload({
      answers: b0Answers({ epistemic_status: "invalid_status" }),
    }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.ingest_status, "blocked_epistemic_violation");
  assert.equal(
    result.validation_blocking_decision.blocking_reasons.includes("invalid_epistemic_status"),
    true,
  );
});

test("blocks invalid provenance_type", () => {
  const result = run({
    response_payload: responsePayload({
      answers: b0Answers({ provenance_type: "invalid_provenance" }),
    }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.ingest_status, "blocked_epistemic_violation");
  assert.equal(
    result.validation_blocking_decision.blocking_reasons.includes("invalid_provenance_type"),
    true,
  );
});

test("does not infer response from visible_text", () => {
  const result = run({ response_payload: responsePayload({ answers: [] }) });

  assert.equal(result.ok, false);
  assert.equal(result.ingest_status, "blocked_missing_b0q01_required_subfield");
  assert.equal(result.subfield_response_candidates.length, 0);
  assert.equal(result.ingest_decision.free_inference_used, false);
});

test("blocks missing required subfield", () => {
  const model = viewModel({
    runtime_interaction_id: "C09",
    interaction_instance_id_preview: "RUN-001:C09:preview",
    subfields: [
      subfield("feedback_signal_type"),
      subfield("feedback_content"),
    ],
  });
  const result = run({
    interaction_view_model: model,
    response_payload: responsePayload(
      {
        runtime_interaction_id: "C09",
        interaction_instance_id_preview: "RUN-001:C09:preview",
        answers: [answer({ subfield_name: "feedback_signal_type" })],
      },
      model,
    ),
  });

  assert.equal(result.ok, false);
  assert.equal(result.ingest_status, "blocked_missing_subfield_structure");
});

test("blocks value incompatible with expected_type", () => {
  const model = viewModel({
    subfields: [
      subfield("action_verb", { type: "number" }),
      subfield("input_or_object"),
      subfield("procedure_or_standard"),
      subfield("output_or_result"),
      subfield("user_correction_note"),
    ],
  });
  const result = run({
    interaction_view_model: model,
    response_payload: responsePayload({}, model),
  });

  assert.equal(result.ok, false);
  assert.equal(result.ingest_status, "blocked_value_type_mismatch");
});

test("allows expected_type=unknown", () => {
  const model = viewModel({
    subfields: [
      subfield("action_verb", { type: "unknown" }),
      subfield("input_or_object"),
      subfield("procedure_or_standard"),
      subfield("output_or_result"),
      subfield("user_correction_note"),
    ],
  });
  const result = run({
    interaction_view_model: model,
    response_payload: responsePayload({}, model),
  });

  assert.equal(result.ok, true);
});

test("blocks enum value outside authorized options", () => {
  const model = viewModel({
    subfields: [
      subfield("action_verb", { type: "enum", options: ["Validar", "Revisar"] }),
      subfield("input_or_object"),
      subfield("procedure_or_standard"),
      subfield("output_or_result"),
      subfield("user_correction_note"),
    ],
  });
  const result = run({
    interaction_view_model: model,
    response_payload: responsePayload({}, model),
  });

  assert.equal(result.ok, false);
  assert.equal(result.ingest_status, "blocked_value_type_mismatch");
});

test("does not auto-convert string to number", () => {
  const model = viewModel({
    subfields: [
      subfield("action_verb", { type: "number" }),
      subfield("input_or_object"),
      subfield("procedure_or_standard"),
      subfield("output_or_result"),
      subfield("user_correction_note"),
    ],
  });
  const result = run({
    interaction_view_model: model,
    response_payload: responsePayload({}, model),
  });

  assert.equal(result.ingest_status, "blocked_value_type_mismatch");
  assert.equal(result.evidence_item_candidates.length, 0);
});

test("does not auto-parse date", () => {
  const model = viewModel({
    subfields: [
      subfield("action_verb", { type: "date" }),
      subfield("input_or_object"),
      subfield("procedure_or_standard"),
      subfield("output_or_result"),
      subfield("user_correction_note"),
    ],
  });
  const result = run({
    interaction_view_model: model,
    response_payload: responsePayload({}, model),
  });

  assert.equal(result.ingest_status, "blocked_value_type_mismatch");
});

test("blocks before subfield candidates when validation fails", () => {
  const result = run({ response_payload: responsePayload({ idempotency_key: "" }) });

  assert.equal(result.validation_blocking_decision.blocked_before_candidate_creation, true);
  assert.equal(result.subfield_response_candidates.length, 0);
});

test("blocks before evidence candidates when validation fails", () => {
  const result = run({ response_payload: responsePayload({ idempotency_key: "" }) });

  assert.equal(
    result.validation_blocking_decision.blocked_before_evidence_candidate_creation,
    true,
  );
  assert.equal(result.evidence_item_candidates.length, 0);
});

test("blocks subfield collapse into single_textbox", () => {
  const result = run({
    response_payload: responsePayload({
      answers: [answer({ subfield_name: "single_textbox" })],
    }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.ingest_status, "blocked_subfield_collapse_detected");
});

test("creates response revision candidate for revision > 1", () => {
  const result = run({
    response_payload: responsePayload({
      response_revision_number: 2,
      supersedes_response_ref: "RESP-001",
    }),
  });

  assert.equal(result.response_revision_candidate.revision_valid, true);
  assert.equal(result.response_revision_candidate.supersedes_response_ref, "RESP-001");
});

test("creates ingest audit candidate", () => {
  const audit = run().ingest_audit_candidate;

  assert.equal(audit.action, "response_ingest_candidate_created");
  assert.equal(audit.real_audit_record_created, false);
});

test("creates response_ingest_candidate_created audit candidate when ok", () => {
  assert.equal(auditActions(run()).includes("response_ingest_candidate_created"), true);
});

test("creates response_ingest_blocked audit candidate when blocked", () => {
  const result = run({ response_payload: responsePayload({ idempotency_key: "" }) });

  assert.equal(auditActions(result).includes("response_ingest_blocked"), true);
});

test("creates subfield_response_candidate_created audit candidate when applicable", () => {
  assert.equal(auditActions(run()).includes("subfield_response_candidate_created"), true);
});

test("creates evidence_item_candidate_created audit candidate when applicable", () => {
  assert.equal(auditActions(run()).includes("evidence_item_candidate_created"), true);
});

test("creates response_revision_registered audit candidate", () => {
  assert.equal(auditActions(run()).includes("response_revision_registered"), true);
});

test("creates correction_supersedes_previous audit candidate", () => {
  const result = run({
    response_payload: responsePayload({
      response_revision_number: 2,
      supersedes_response_ref: "RESP-001",
    }),
  });

  assert.equal(auditActions(result).includes("correction_supersedes_previous"), true);
});

test("creates epistemic_violation_blocked audit candidate", () => {
  const result = run({
    response_payload: responsePayload({
      answers: b0Answers({ provenance_type: "invalid_provenance" }),
    }),
  });

  assert.equal(auditActions(result).includes("epistemic_violation_blocked"), true);
});

test("creates idempotency_replay_detected audit candidate", () => {
  const result = run({ options: { prior_idempotency_keys: ["IDEMP-001"] } });

  assert.equal(auditActions(result).includes("idempotency_replay_detected"), true);
});

test("real_audit_trail_created remains false", () => {
  assert.equal(
    run().response_audit_trail_candidates.every(
      (candidate) => candidate.real_audit_trail_created === false,
    ),
    true,
  );
});

test("audit candidates keep Supabase SQL and endpoint false", () => {
  assert.equal(
    run().response_audit_trail_candidates.every(
      (candidate) =>
        candidate.supabase_touched === false &&
        candidate.sql_executed === false &&
        candidate.endpoint_created === false,
    ),
    true,
  );
});

test("keeps free_inference_used=false", () => {
  assert.equal(run().ingest_decision.free_inference_used, false);
});

test("keeps unauthorized_expansion_used=false", () => {
  assert.equal(run().ingest_decision.unauthorized_expansion_used, false);
});

test("keeps real_response_persisted=false", () => {
  const result = run();

  assert.equal(result.ingest_decision.real_response_persisted, false);
  assert.equal(result.no_go_check.real_response_persisted, false);
});

test("keeps real_subfield_response_created=false", () => {
  assert.equal(run().no_go_check.real_subfield_response_created, false);
});

test("runtime subfield response candidate keeps real flags false", () => {
  const candidate = run().subfield_response_candidates[0];

  assert.equal(candidate.real_subfield_response_created, false);
  assert.equal(candidate.evidence_item_real_created, false);
  assert.equal(candidate.canonical_variable_record_real_created, false);
});

test("keeps real_evidence_item_created=false", () => {
  assert.equal(run().no_go_check.real_evidence_item_created, false);
});

test("does not create canonical_variable_record", () => {
  assert.equal(run().no_go_check.real_canonical_variable_record_created, false);
});

test("does not execute CanonicalVariableService", () => {
  assert.equal(run().no_go_check.canonical_variable_service_executed, false);
});

test("does not execute BranchingEngine", () => {
  assert.equal(run().no_go_check.branching_engine_executed, false);
});

test("does not execute ReadinessEngine", () => {
  assert.equal(run().no_go_check.readiness_engine_executed, false);
});

test("C09 receiver_feedback_exists is preserved", () => {
  const result = runC09({
    c09_receiver_feedback_boundary: {
      receiver_feedback_exists: true,
      gap_flag: false,
      route_missing: false,
      has_canonical_route: true,
    },
  });

  assert.equal(result.c09_receiver_feedback_boundary.receiver_feedback_exists, true);
});

test("C09 receiver_feedback is preserved when explicit", () => {
  const result = runC09({
    c09_receiver_feedback_boundary: {
      receiver_feedback_exists: true,
      receiver_feedback: "El receptor pidio corregir el formato",
      gap_flag: true,
      route_missing: false,
      has_canonical_route: true,
      feedback_source_trace: sourceTrace(220),
    },
  });

  assert.equal(
    result.c09_receiver_feedback_boundary.receiver_feedback,
    "El receptor pidio corregir el formato",
  );
  assert.equal(
    result.c09_receiver_feedback_boundary.feedback_source_trace.source_row_number,
    220,
  );
});

test("C09 gap_flag is preserved", () => {
  const result = runC09({
    c09_receiver_feedback_boundary: {
      receiver_feedback_exists: true,
      receiver_feedback: "Falto una validacion",
      gap_flag: true,
      route_missing: false,
      has_canonical_route: true,
    },
  });

  assert.equal(result.c09_receiver_feedback_boundary.gap_flag, true);
});

test("C09 route_missing is preserved when no canonical route", () => {
  const result = runC09({
    c09_receiver_feedback_boundary: {
      receiver_feedback_exists: false,
      gap_flag: true,
      route_missing: true,
      has_canonical_route: false,
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.ingest_status, "blocked_c09_route_missing");
  assert.equal(result.c09_receiver_feedback_boundary.route_missing, true);
  assert.equal(
    result.c09_receiver_feedback_boundary.route_missing_preserved_when_no_canonical_route,
    true,
  );
});

test("blocks receiver_feedback inferred from satisfaction", () => {
  const result = runC09({
    c09_receiver_feedback_boundary: {
      receiver_feedback_exists: true,
      receiver_feedback: "Satisfecho",
      gap_flag: false,
      route_missing: false,
      has_canonical_route: true,
      receiver_feedback_inferred_from_satisfaction: true,
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.ingest_status, "blocked_receiver_feedback_inference");
});

test("blocks receiver_feedback inferred from ambiguous comment", () => {
  const result = runC09({
    c09_receiver_feedback_boundary: {
      receiver_feedback_exists: true,
      receiver_feedback: "Todo bien",
      gap_flag: false,
      route_missing: false,
      has_canonical_route: true,
      receiver_feedback_inferred_from_ambiguous_comment: true,
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.ingest_status, "blocked_receiver_feedback_inference");
});

test("does not execute CriticalRouteGate", () => {
  assert.equal(runC09().c09_receiver_feedback_boundary.critical_route_gate_executed, false);
  assert.equal(runC09().no_go_check.critical_route_gate_executed, false);
});

test("readiness_gap_record real created remains false", () => {
  assert.equal(runC09().c09_receiver_feedback_boundary.readiness_gap_record_real_created, false);
  assert.equal(runC09().no_go_check.readiness_gap_record_real_created, false);
});

test("epistemic enforcement decision is created", () => {
  const decision = run().epistemic_enforcement_decisions[0];

  assert.equal(decision.epistemic_status, "captured_user_evidence");
  assert.equal(decision.provenance_type, "user_answer");
  assert.equal(decision.epistemic_status_allowed, true);
  assert.equal(decision.provenance_matches_epistemic_status, true);
  assert.equal(decision.enforcement_status, "epistemic_enforcement_passed");
});

test("canonical_derivation with derived_from_refs passes enforcement", () => {
  const result = run({
    response_payload: responsePayload({
      answers: b0Answers({
        epistemic_status: "canonical_derivation",
        provenance_type: "canonical_derivation",
        derived_from_refs: ["DER-001"],
      }),
    }),
  });

  assert.equal(result.ok, true);
  assert.equal(result.epistemic_enforcement_decisions[0].canonical_derivation_has_derived_from_refs, true);
});

test("internal_calculated with internal_calculation passes enforcement", () => {
  const result = run({
    response_payload: responsePayload({
      answers: b0Answers({
        epistemic_status: "internal_calculated",
        provenance_type: "internal_calculation",
      }),
    }),
  });

  assert.equal(result.ok, true);
  assert.equal(result.epistemic_enforcement_decisions[0].internal_calculated_used_as_user_answer, false);
});

test("provenance contract is created", () => {
  assert.equal(run().provenance_contracts.length, 5);
});

test("source_document is preserved", () => {
  assert.equal(
    run().provenance_contracts[0].source_document,
    "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
  );
});

test("source_sheet is preserved", () => {
  assert.equal(run().provenance_contracts[0].source_sheet, "UX_Subfield_Structure");
});

test("source_row_number is preserved", () => {
  assert.equal(run().provenance_contracts[0].source_row_number, 100);
});

test("raw_row is preserved internally", () => {
  assert.equal(run().provenance_contracts[0].raw_row.source_question_code, "B0-Q01");
  assert.equal(run().provenance_contracts[0].raw_row_preserved_internally, true);
});

test("provenance is not fabricated", () => {
  assert.equal(run().provenance_contracts[0].provenance_fabricated, false);
});

test("source trace is not fabricated", () => {
  assert.equal(run().provenance_contracts[0].source_trace_fabricated, false);
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

test("B0-Q01 preserves action_verb", () => {
  assert.equal(run().b0q01_subfield_persistence_contract.action_verb_present, true);
});

test("B0-Q01 preserves input_or_object", () => {
  assert.equal(run().b0q01_subfield_persistence_contract.input_or_object_present, true);
});

test("B0-Q01 preserves procedure_or_standard", () => {
  assert.equal(run().b0q01_subfield_persistence_contract.procedure_or_standard_present, true);
});

test("B0-Q01 preserves output_or_result", () => {
  assert.equal(run().b0q01_subfield_persistence_contract.output_or_result_present, true);
});

test("B0-Q01 preserves user_correction_note field", () => {
  assert.equal(run().b0q01_subfield_persistence_contract.user_correction_note_present, true);
});

test("B0-Q01 blocks missing action_verb", () => {
  assert.equal(statusWithoutB0Subfield("action_verb"), "blocked_missing_b0q01_required_subfield");
});

test("B0-Q01 blocks missing input_or_object", () => {
  assert.equal(statusWithoutB0Subfield("input_or_object"), "blocked_missing_b0q01_required_subfield");
});

test("B0-Q01 blocks missing procedure_or_standard", () => {
  assert.equal(statusWithoutB0Subfield("procedure_or_standard"), "blocked_missing_b0q01_required_subfield");
});

test("B0-Q01 blocks missing output_or_result", () => {
  assert.equal(statusWithoutB0Subfield("output_or_result"), "blocked_missing_b0q01_required_subfield");
});

test("B0-Q01 blocks missing user_correction_note field", () => {
  assert.equal(statusWithoutB0Subfield("user_correction_note"), "blocked_missing_b0q01_required_subfield");
});

test("B0-Q01 does not use single_textbox", () => {
  assert.equal(run().b0q01_subfield_persistence_contract.single_textbox_used, false);
});

test("B0-Q01 does not infer missing subfield", () => {
  assert.equal(run().b0q01_subfield_persistence_contract.missing_subfield_inferred, false);
});

test("B0-Q01 does not create captured_user_evidence without confirmation", () => {
  assert.equal(
    run().b0q01_subfield_persistence_contract.captured_user_evidence_created_without_confirmation,
    false,
  );
});

test("B0-Q01 persists subfields separately as candidates", () => {
  assert.equal(
    run().b0q01_subfield_persistence_contract.subfields_persisted_separately_as_candidates,
    true,
  );
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
  assert.equal(result.materiality.real_response_persisted, false);
  assert.equal(result.materiality.real_evidence_created, false);
});

test("creates phase5_input_boundary", () => {
  assert.equal(typeof run().phase5_input_boundary, "object");
});

test("consumes InteractionViewModel as input boundary", () => {
  assert.equal(run().phase5_input_boundary.interaction_view_model_consumed, true);
});

test("consumes phase6_payload_preview as input boundary", () => {
  assert.equal(run().phase5_input_boundary.phase6_payload_preview_consumed, true);
});

test("keeps interaction_instance_id_preview as preview only", () => {
  assert.equal(
    run().phase5_input_boundary.interaction_instance_id_preview_used_as_preview_only,
    true,
  );
});

test("does not create real interaction_instance_id", () => {
  assert.equal(run().phase5_input_boundary.interaction_instance_id_real_created, false);
});

test("converts preview to authorized payload structure", () => {
  assert.equal(run().phase5_input_boundary.preview_converted_to_authorized_payload, true);
});

test("does not modify renderer", () => {
  assert.equal(run().phase5_input_boundary.renderer_modified, false);
});

test("does not modify UI", () => {
  assert.equal(run().phase5_input_boundary.ui_modified, false);
});

test("does not reinterpret visible_text as answer", () => {
  assert.equal(run().phase5_input_boundary.visible_text_reinterpreted_as_answer, false);
});

test("does not reinterpret user_visible_copy as answer", () => {
  assert.equal(run().phase5_input_boundary.user_visible_copy_reinterpreted_as_answer, false);
});

test("does not invent response from copy", () => {
  assert.equal(run().phase5_input_boundary.response_invented_from_copy, false);
});

test("creates phase7_boundary", () => {
  assert.equal(typeof run().phase7_boundary, "object");
});

test("keeps canonical_variable_record_real_created=false", () => {
  assert.equal(run().phase7_boundary.canonical_variable_record_real_created, false);
});

test("keeps CanonicalVariableService executed=false", () => {
  assert.equal(run().phase7_boundary.canonical_variable_service_executed, false);
});

test("keeps BranchingEngine executed=false in phase7 boundary", () => {
  assert.equal(run().phase7_boundary.branching_engine_executed, false);
});

test("keeps CriticalRouteGate executed=false in phase7 boundary", () => {
  assert.equal(run().phase7_boundary.critical_route_gate_executed, false);
});

test("keeps ReadinessEngine executed=false in phase7 boundary", () => {
  assert.equal(run().phase7_boundary.readiness_engine_executed, false);
});

test("keeps evidence and subfield ready for future phase", () => {
  assert.equal(run().phase7_boundary.evidence_subfield_ready_for_future_phase, true);
});

test("preserves mapping refs when present", () => {
  assert.equal(run().phase7_boundary.mapping_refs_preserved_when_present, true);
});

test("canonical_variable remains outside Phase 6 closeout", () => {
  assert.equal(run().phase7_boundary.canonical_variable_outside_phase6_closeout, true);
});

test("creates persistence_boundary", () => {
  assert.equal(typeof run().persistence_boundary, "object");
});

test("local_candidate_mode=true", () => {
  assert.equal(run().persistence_boundary.local_candidate_mode, true);
});

test("db_write_authorized=false", () => {
  assert.equal(run().persistence_boundary.db_write_authorized, false);
});

test("real_response_record_created=false", () => {
  assert.equal(run().persistence_boundary.real_response_record_created, false);
});

test("runtime_subfield_response_real_created=false in persistence boundary", () => {
  assert.equal(run().persistence_boundary.runtime_subfield_response_real_created, false);
});

test("evidence_item_real_created=false in persistence boundary", () => {
  assert.equal(run().persistence_boundary.evidence_item_real_created, false);
});

test("supabase_touch_authorized=false", () => {
  assert.equal(run().persistence_boundary.supabase_touch_authorized, false);
});

test("sql_execution_authorized=false", () => {
  assert.equal(run().persistence_boundary.sql_execution_authorized, false);
});

test("endpoint_creation_authorized=false", () => {
  assert.equal(run().persistence_boundary.endpoint_creation_authorized, false);
});

test("service_role_used=false", () => {
  assert.equal(run().persistence_boundary.service_role_used, false);
});

test("service_role_used_in_client=false", () => {
  assert.equal(run().persistence_boundary.service_role_used_in_client, false);
});

test("blocks persistence boundary violation", () => {
  const result = run({
    response_payload: responsePayload({
      source_trace: {
        ...viewModel().source_trace,
        response_persisted_real: true,
      },
    }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.ingest_status, "blocked_persistence_boundary_violation");
});

test("blocks service_role boundary violation", () => {
  const result = run({
    response_payload: responsePayload({
      source_trace: {
        ...viewModel().source_trace,
        service_role_used_in_client: true,
      },
    }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.ingest_status, "blocked_service_role_boundary_violation");
});

function run(overrides = {}) {
  const defaultViewModel = overrides.interaction_view_model ?? viewModel();

  return service.ingestRuntime4020ResponseLocal({
    case_id: "CASE-001",
    interaction_view_model: defaultViewModel,
    response_payload: overrides.response_payload ?? responsePayload({}, defaultViewModel),
    ...overrides,
  });
}

function runC09(c09Overrides = {}) {
  const model = viewModel({
    runtime_interaction_id: "C09",
    interaction_instance_id_preview: "RUN-001:C09:preview",
    subfields: [
      subfield("receiver_feedback_exists"),
      subfield("receiver_feedback", { required: false }),
      subfield("gap_flag"),
      subfield("route_missing"),
    ],
    source_trace: {
      ...viewModel().source_trace,
      source_row_number: 209,
      raw_row: {
        source_code: "SRC-C09",
        source_question_code: "C09",
      },
      source_codes: ["SRC-C09"],
      source_refs: ["SRC-C09"],
    },
  });

  return run({
    interaction_view_model: model,
    response_payload: responsePayload(
      {
        runtime_interaction_id: "C09",
        interaction_instance_id_preview: "RUN-001:C09:preview",
        answers: [
          answer({ subfield_name: "receiver_feedback_exists", value: true, source_ref: "SRC-C09" }),
          answer({ subfield_name: "receiver_feedback", value: "Feedback explicito", source_ref: "SRC-C09" }),
          answer({ subfield_name: "gap_flag", value: false, source_ref: "SRC-C09" }),
          answer({ subfield_name: "route_missing", value: false, source_ref: "SRC-C09" }),
        ],
        c09_receiver_feedback_boundary: {
          receiver_feedback_exists: true,
          receiver_feedback: "Feedback explicito",
          gap_flag: false,
          route_missing: false,
          has_canonical_route: true,
          feedback_source_trace: sourceTrace(209),
          ...c09Overrides.c09_receiver_feedback_boundary,
        },
      },
      model,
    ),
  });
}

function responsePayload(overrides = {}, model = viewModel()) {
  const answers = overrides.answers ?? b0Answers();

  return {
    runtime_interaction_id: "B0-Q01",
    interaction_instance_id_preview: "RUN-001:B0-Q01:preview",
    case_id: "CASE-001",
    idempotency_key: "IDEMP-001",
    response_revision_number: 1,
    answers,
    subfield_answers: overrides.subfield_answers ?? answers,
    confirmation_status: "confirmed",
    correction_status: "no_correction",
    source_trace: model.source_trace,
    ...overrides,
  };
}

function answer(overrides = {}) {
  return {
    subfield_name: "action_verb",
    value: "Elaborar reporte operativo",
    epistemic_status: "captured_user_evidence",
    provenance_type: "user_answer",
    confirmation_reference: "CONF-001",
    ...overrides,
  };
}

function b0Answers(firstOverrides = {}) {
  return [
    answer({ ...firstOverrides, subfield_name: "action_verb", value: "Elaborar reporte operativo" }),
    answer({ ...firstOverrides, subfield_name: "input_or_object", value: "Insumo operativo" }),
    answer({ ...firstOverrides, subfield_name: "procedure_or_standard", value: "Procedimiento autorizado" }),
    answer({ ...firstOverrides, subfield_name: "output_or_result", value: "Reporte operativo" }),
    answer({ ...firstOverrides, subfield_name: "user_correction_note", value: null }),
  ];
}

function statusWithoutB0Subfield(subfieldName) {
  const answers = b0Answers().filter((candidate) => candidate.subfield_name !== subfieldName);

  return run({ response_payload: responsePayload({ answers }) }).ingest_status;
}

function auditActions(result) {
  return result.response_audit_trail_candidates.map((candidate) => candidate.audit_action);
}

function subfield(name, overrides = {}) {
  return {
    name,
    label: name,
    type: "text",
    required: true,
    value: null,
    source_trace: sourceTrace(100),
    ...overrides,
  };
}

function sourceTrace(rowNumber) {
  return {
    source_document: "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
    source_sheet: "UX_Subfield_Structure",
    source_row_number: rowNumber,
  };
}

function viewModel(overrides = {}) {
  return {
    runtime_interaction_id: "B0-Q01",
    interaction_instance_id_preview: "RUN-001:B0-Q01:preview",
    group: "base",
    block: "B0",
    visible_text: "Confirma la actividad",
    ui_component: "confirmation_card_with_correction",
    subfields: [
      subfield("action_verb"),
      subfield("input_or_object", { source_trace: { ...subfield("input_or_object").source_trace, source_row_number: 101 } }),
      subfield("procedure_or_standard", { source_trace: { ...subfield("procedure_or_standard").source_trace, source_row_number: 102 } }),
      subfield("output_or_result", { source_trace: { ...subfield("output_or_result").source_trace, source_row_number: 103 } }),
      subfield("user_correction_note", { source_trace: { ...subfield("user_correction_note").source_trace, source_row_number: 104 } }),
    ],
    help_text: "Help B0-Q01",
    help: {
      help_text: "Help B0-Q01",
      help_source: "catalog",
    },
    budget: {
      counts_as_visible: true,
      counts_as_causal: false,
      budget_bucket: "base_40",
      base_limit: 40,
      causal_limit: 20,
      budget_consumed_real: false,
    },
    epistemic_policy: {
      allowed_epistemic_statuses: [
        "captured_user_evidence",
        "ai_inferred_unconfirmed",
        "user_confirmed_suggestion",
        "user_corrected_evidence",
        "canonical_derivation",
        "internal_calculated",
      ],
      explicit_policy_present: true,
      confirmation_policy: "requires_user_confirmation",
      must_not_infer: ["action_verb"],
    },
    source_trace: {
      source_document: "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
      source_sheet: "Runtime_Interactions_Base_40",
      source_row_number: 2,
      raw_row: {
        source_code: "SRC-B0-Q01",
        source_question_code: "B0-Q01",
      },
      source_codes: ["SRC-B0-Q01"],
      source_refs: ["SRC-B0-Q01"],
    },
    phase6_payload_preview: {
      interaction_id: "B0-Q01",
      interaction_instance_id_preview: "RUN-001:B0-Q01:preview",
      answers_preview: [
        { subfield_name: "action_verb", expected_type: "text", required: true, value: null, response_persisted_real: false },
        { subfield_name: "input_or_object", expected_type: "text", required: true, value: null, response_persisted_real: false },
        { subfield_name: "procedure_or_standard", expected_type: "text", required: true, value: null, response_persisted_real: false },
        { subfield_name: "output_or_result", expected_type: "text", required: true, value: null, response_persisted_real: false },
        { subfield_name: "user_correction_note", expected_type: "text", required: true, value: null, response_persisted_real: false },
      ],
      subfield_answers_preview: [
        { subfield_name: "action_verb", expected_type: "text", required: true, value: null, response_persisted_real: false },
        { subfield_name: "input_or_object", expected_type: "text", required: true, value: null, response_persisted_real: false },
        { subfield_name: "procedure_or_standard", expected_type: "text", required: true, value: null, response_persisted_real: false },
        { subfield_name: "output_or_result", expected_type: "text", required: true, value: null, response_persisted_real: false },
        { subfield_name: "user_correction_note", expected_type: "text", required: true, value: null, response_persisted_real: false },
      ],
      confirmation_status_preview: "pending_confirmation",
      idempotency_key_preview: "IDEMP-001",
      payload_preview_created: true,
      response_ingest_executed: false,
      response_persisted_real: false,
      runtime_subfield_response_real_created: false,
      evidence_item_real_created: false,
      canonical_variable_record_real_created: false,
    },
    renderer_status: "render_model_ready",
    warnings: [],
    ui_rendered_real: false,
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
