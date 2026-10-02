import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const service = loadModule("runtime-40-20-canonical-variable-service.ts", {
  "./runtime-40-20-canonical-variable-types": {},
  "../catalog-canonicalization/runtime-40-20-catalog-canonicalization-types": {},
  "../response-ingest/runtime-40-20-response-ingest-types": {},
});

test("creates canonical variable candidates from valid ingest result and explicit mappings", () => {
  const result = run();

  assert.equal(result.ok, true);
  assert.equal(result.canonical_variable_record_candidates.length, 1);
  assert.equal(result.canonical_variable_record_candidates[0].canonical_variable_id, "CV-001");
});

test("preserves source_trace from subfield response candidate", () => {
  const candidate = run().canonical_variable_record_candidates[0];

  assert.equal(candidate.source_trace.source_document, "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx");
});

test("preserves mapping_source_trace from canonical mapping", () => {
  const candidate = run().canonical_variable_record_candidates[0];

  assert.equal(candidate.mapping_source_trace.source_sheet, "Canonical_Variables");
  assert.equal(candidate.mapping_source_trace.source_row_number, 20);
});

test("preserves epistemic_status", () => {
  assert.equal(
    run().canonical_variable_record_candidates[0].epistemic_status,
    "captured_user_evidence",
  );
});

test("preserves provenance_type", () => {
  assert.equal(run().canonical_variable_record_candidates[0].provenance_type, "user_answer");
});

test("associates evidence_item_candidate when evidence_candidate_allowed=true", () => {
  assert.equal(
    run().canonical_variable_record_candidates[0].source_evidence_item_ref,
    "EVID-001",
  );
});

test("creates evidence_backed=true for captured_user_evidence with valid evidence candidate", () => {
  assert.equal(run().canonical_variable_record_candidates[0].evidence_backed, true);
});

test("creates requires_user_confirmation=true for ai_inferred_unconfirmed", () => {
  const result = run({
    ingest_result: ingestResult({
      subfield_response_candidates: [
        subfieldCandidate({
          epistemic_status: "ai_inferred_unconfirmed",
          provenance_type: "ai_suggestion",
        }),
      ],
      evidence_item_candidates: [
        evidenceCandidate({
          epistemic_status: "ai_inferred_unconfirmed",
          provenance_type: "ai_suggestion",
          hard_evidence: false,
        }),
      ],
    }),
  });

  assert.equal(result.ok, true);
  assert.equal(result.canonical_variable_record_candidates[0].requires_user_confirmation, true);
});

test("keeps evidence_backed=false for ai_inferred_unconfirmed", () => {
  const result = run({
    ingest_result: ingestResult({
      subfield_response_candidates: [
        subfieldCandidate({
          epistemic_status: "ai_inferred_unconfirmed",
          provenance_type: "ai_suggestion",
        }),
      ],
      evidence_item_candidates: [
        evidenceCandidate({
          epistemic_status: "ai_inferred_unconfirmed",
          provenance_type: "ai_suggestion",
          hard_evidence: false,
        }),
      ],
    }),
  });

  assert.equal(result.canonical_variable_record_candidates[0].evidence_backed, false);
});

test("blocks missing canonical variable mapping", () => {
  const result = run({ canonical_variable_mappings: [] });

  assert.equal(result.ok, false);
  assert.equal(result.service_status, "blocked_missing_canonical_variable_mapping");
});

test("does not use fuzzy mapping", () => {
  const result = run({
    canonical_variable_mappings: [
      canonicalMapping({ subfield_name: "action_verb_extra" }),
    ],
  });

  assert.equal(result.ok, false);
  assert.equal(result.mapping_decisions[0].fuzzy_mapping_used, false);
});

test("does not use semantic fallback", () => {
  const result = run({
    canonical_variable_mappings: [
      canonicalMapping({ subfield_name: "accion_verbo" }),
    ],
  });

  assert.equal(result.ok, false);
  assert.equal(result.mapping_decisions[0].semantic_fallback_used, false);
});

test("blocks ingest_result.ok=false", () => {
  const result = run({ ingest_result: { ...ingestResult(), ok: false } });

  assert.equal(result.ok, false);
  assert.equal(result.service_status, "blocked_ingest_not_ready");
});

test("blocks empty canonical_variable_mappings", () => {
  const result = run({ canonical_variable_mappings: [] });

  assert.equal(result.ok, false);
  assert.equal(result.no_go_check.no_go_triggered, true);
});

test("blocks canonical_derivation without valid derivation support", () => {
  const result = run({
    ingest_result: ingestResult({
      subfield_response_candidates: [
        subfieldCandidate({
          epistemic_status: "canonical_derivation",
          provenance_type: "canonical_derivation",
        }),
      ],
    }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.service_status, "blocked_canonical_epistemic_violation");
});

test("blocks epistemic violation", () => {
  const result = run({
    ingest_result: ingestResult({
      subfield_response_candidates: [
        subfieldCandidate({
          epistemic_status: "captured_user_evidence",
          provenance_type: "ai_suggestion",
        }),
      ],
    }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.service_status, "blocked_canonical_epistemic_violation");
});

test("creates audit candidate", () => {
  const audit = run().audit_candidate;

  assert.equal(audit.action, "canonical_variable_candidates_created");
  assert.equal(audit.real_audit_record_created, false);
});

test("creates mapping decisions", () => {
  const decision = run().mapping_decisions[0];

  assert.equal(decision.mapping_status, "mapping_ready");
  assert.equal(decision.exact_mapping_used, true);
});

test("keeps free_inference_used=false", () => {
  assert.equal(run().mapping_decisions[0].free_inference_used, false);
});

test("keeps unauthorized_expansion_used=false", () => {
  assert.equal(run().mapping_decisions[0].unauthorized_expansion_used, false);
});

test("keeps real_canonical_variable_record_created=false", () => {
  assert.equal(
    run().canonical_variable_record_candidates[0].real_canonical_variable_record_created,
    false,
  );
});

test("keeps real_evidence_item_created=false", () => {
  const result = run();

  assert.equal(result.canonical_variable_record_candidates[0].real_evidence_item_created, false);
  assert.equal(result.no_go_check.real_evidence_item_created, false);
});

test("keeps ir_real_created=false", () => {
  const result = run();

  assert.equal(result.canonical_variable_record_candidates[0].ir_real_created, false);
  assert.equal(result.no_go_check.ir_real_created, false);
});

test("keeps object_inventory_real_opened=false", () => {
  const result = run();

  assert.equal(result.canonical_variable_record_candidates[0].object_inventory_real_opened, false);
  assert.equal(result.no_go_check.object_inventory_real_opened, false);
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
  assert.equal(result.materiality.real_canonical_variable_created, false);
  assert.equal(result.materiality.real_evidence_created, false);
});

test("starts Phase 7 locally only after Phase 6 closure and authorization", () => {
  const result = run();

  assert.equal(result.phase7_input_revalidation.phase6_closed_local, true);
  assert.equal(result.phase7_input_revalidation.ready_for_phase7_authorization, true);
  assert.equal(result.phase7_input_revalidation.phase7_started_local, true);
});

test("blocks Phase 7 when Phase 6 is not closed locally", () => {
  const result = run({
    phase6_closeout: {
      phase6_closed_local: false,
      ready_for_phase7_authorization: true,
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.service_status, "blocked_phase6_not_closed");
  assert.equal(result.phase7_input_revalidation.phase7_started_local, false);
});

test("blocks Phase 7 when Phase 7 authorization is missing", () => {
  const result = run({
    phase6_closeout: {
      phase6_closed_local: true,
      ready_for_phase7_authorization: false,
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.service_status, "blocked_phase7_not_authorized");
  assert.equal(result.phase7_input_revalidation.phase7_started_local, false);
});

test("revalidates Phase 6 input contracts for Phase 7 foundation", () => {
  const revalidation = run().phase7_input_revalidation;

  assert.equal(revalidation.response_ingest_candidates_available, true);
  assert.equal(revalidation.runtime_subfield_response_candidates_available, true);
  assert.equal(revalidation.evidence_item_candidates_available, true);
  assert.equal(revalidation.provenance_epistemic_status_available, true);
  assert.equal(revalidation.source_trace_available, true);
});

test("revalidates idempotency, revision and C09 Phase 6 boundary", () => {
  const revalidation = run().phase7_input_revalidation;

  assert.equal(revalidation.idempotency_contract_verified, true);
  assert.equal(revalidation.response_revision_contract_verified, true);
  assert.equal(revalidation.c09_phase6_boundary_verified, true);
});

test("does not recalculate evidence or create new response during Phase 7 foundation", () => {
  const revalidation = run().phase7_input_revalidation;

  assert.equal(revalidation.evidence_recalculated, false);
  assert.equal(revalidation.new_response_created, false);
  assert.equal(revalidation.evidence_item_real_created, false);
  assert.equal(revalidation.phase8_started, false);
});

test("creates canonical variable source contract from explicit mapping", () => {
  const sourceContract = run().source_contracts[0];

  assert.equal(sourceContract.source_node_ref, "SRC-B0-Q01");
  assert.equal(sourceContract.runtime_interaction_id, "B0-Q01");
  assert.equal(sourceContract.subfield_name, "action_verb");
  assert.equal(sourceContract.canonical_variable_name, "activity_action_verb");
  assert.equal(sourceContract.variable_type, "string");
});

test("blocks missing explicit mapping in explicit mapping decision", () => {
  const result = run({
    canonical_variable_mappings: [
      canonicalMapping({
        source_node_ref: undefined,
        explicit_mapping_present: false,
        raw_row: {
          runtime_interaction_id: "B0-Q01",
          subfield_name: "action_verb",
          canonical_variable_id: "CV-001",
          canonical_variable_name: "activity_action_verb",
        },
      }),
    ],
  });

  assert.equal(result.ok, false);
  assert.equal(
    result.explicit_mapping_decisions[0].blocking_reasons.includes("missing_explicit_mapping"),
    true,
  );
});

test("blocks missing source_node_ref", () => {
  const result = run({
    canonical_variable_mappings: [
      canonicalMapping({
        source_node_ref: undefined,
        explicit_mapping_present: true,
        raw_row: {
          runtime_interaction_id: "B0-Q01",
          subfield_name: "action_verb",
          canonical_variable_id: "CV-001",
          canonical_variable_name: "activity_action_verb",
          explicit_mapping_present: true,
        },
      }),
    ],
  });

  assert.equal(result.ok, false);
  assert.equal(result.service_status, "blocked_missing_source_node_ref");
});

test("requires runtime_interaction_id in explicit mapping contract", () => {
  const decision = service.Runtime40_20CanonicalVariableService.enforceExplicitMapping(
    canonicalMapping({
      runtime_interaction_id: undefined,
      raw_row: {
        subfield_name: "action_verb",
        source_node_ref: "SRC-B0-Q01",
        canonical_variable_id: "CV-001",
        canonical_variable_name: "activity_action_verb",
        explicit_mapping_present: true,
      },
    }),
    subfieldCandidate(),
    evidenceCandidate(),
  );

  assert.equal(decision.runtime_interaction_id_present, false);
  assert.equal(decision.blocking_reasons.includes("missing_runtime_interaction_id"), true);
});

test("requires subfield_name when the source is a subfield", () => {
  const decision = service.Runtime40_20CanonicalVariableService.enforceExplicitMapping(
    canonicalMapping({
      subfield_name: undefined,
      raw_row: {
        runtime_interaction_id: "B0-Q01",
        source_node_ref: "SRC-B0-Q01",
        canonical_variable_id: "CV-001",
        canonical_variable_name: "activity_action_verb",
        explicit_mapping_present: true,
      },
    }),
    subfieldCandidate(),
    evidenceCandidate(),
  );

  assert.equal(decision.subfield_name_required, true);
  assert.equal(decision.subfield_name_present, false);
  assert.equal(decision.blocking_reasons.includes("missing_subfield_name"), true);
});

test("requires canonical_variable_name in explicit mapping contract", () => {
  const decision = service.Runtime40_20CanonicalVariableService.enforceExplicitMapping(
    canonicalMapping({
      canonical_variable_name: undefined,
      variable_name: undefined,
      raw_row: {
        runtime_interaction_id: "B0-Q01",
        subfield_name: "action_verb",
        source_node_ref: "SRC-B0-Q01",
        canonical_variable_id: "CV-001",
        explicit_mapping_present: true,
      },
    }),
    subfieldCandidate(),
    evidenceCandidate(),
  );

  assert.equal(decision.canonical_variable_name_present, false);
  assert.equal(decision.blocking_reasons.includes("missing_canonical_variable_name"), true);
});

test("blocks similarity mapping", () => {
  const result = run({
    canonical_variable_mappings: [canonicalMapping({ similarity_mapping_used: true })],
  });

  assert.equal(result.ok, false);
  assert.equal(result.service_status, "blocked_similarity_mapping");
});

test("blocks name similarity mapping", () => {
  const result = run({
    canonical_variable_mappings: [canonicalMapping({ name_similarity_mapping_used: true })],
  });

  assert.equal(result.ok, false);
  assert.equal(result.service_status, "blocked_similarity_mapping");
});

test("blocks free text variable mapping", () => {
  const result = run({
    canonical_variable_mappings: [canonicalMapping({ free_text_mapping_used: true })],
  });

  assert.equal(result.ok, false);
  assert.equal(result.service_status, "blocked_free_text_variable_mapping");
});

test("blocks receiver feedback derived from satisfaction", () => {
  const result = run({
    canonical_variable_mappings: [
      canonicalMapping({ receiver_feedback_from_satisfaction: true }),
    ],
  });

  assert.equal(result.ok, false);
  assert.equal(result.service_status, "blocked_receiver_feedback_from_satisfaction");
});

test("blocks canonical variable without source_trace", () => {
  const result = run({
    ingest_result: ingestResult({
      subfield_response_candidates: [subfieldCandidate({ source_trace: {} })],
    }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.service_status, "blocked_missing_source_trace");
});

test("blocks canonical variable without source evidence", () => {
  const result = run({
    ingest_result: ingestResult({ evidence_item_candidates: [] }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.service_status, "blocked_missing_source_evidence");
});

test("preserves source trace contract fields and raw row internally", () => {
  const sourceTrace = run().source_trace_contracts[0];

  assert.equal(sourceTrace.source_document, "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx");
  assert.equal(sourceTrace.source_sheet, "Canonical_Variables");
  assert.equal(sourceTrace.source_row_number, 20);
  assert.equal(sourceTrace.raw_row.source_node_ref, "SRC-B0-Q01");
  assert.equal(sourceTrace.raw_row_preserved_internally, true);
  assert.equal(sourceTrace.source_trace_fabricated, false);
});

test("creates canonical_variable_record candidate but not real record", () => {
  const candidate = run().canonical_variable_record_candidates[0];

  assert.equal(candidate.canonical_variable_candidate_ref.includes("canonical_variable_candidate"), true);
  assert.equal(candidate.canonical_variable_record_real_created, false);
  assert.equal(candidate.diagnostic_status, "non_diagnostic");
});

test("keeps Phase 7 foundation boundaries closed against engines and exports", () => {
  const result = run();

  assert.equal(result.branching_engine_executed, false);
  assert.equal(result.critical_route_gate_executed, false);
  assert.equal(result.readiness_engine_executed, false);
  assert.equal(result.export_preview_created, false);
});

test("keeps persistence and runtime boundaries false in Phase 7 foundation", () => {
  const result = run();

  assert.equal(result.runtime_40_20_started, false);
  assert.equal(result.supabase_touched, false);
  assert.equal(result.sql_executed, false);
  assert.equal(result.endpoint_created, false);
  assert.equal(result.phase7_closed_local, false);
  assert.equal(result.ready_for_phase8_authorization, false);
});

test("creates evidence/subfield derivation decision", () => {
  const decision = run().evidence_subfield_derivation_decisions[0];

  assert.equal(decision.canonical_variable_candidate_allowed, true);
});

test("uses governed evidence_item candidate", () => {
  assert.equal(run().evidence_subfield_derivation_decisions[0].evidence_item_candidate_used, true);
});

test("uses governed runtime_subfield_response candidate", () => {
  assert.equal(run().evidence_subfield_derivation_decisions[0].runtime_subfield_response_candidate_used, true);
});

test("preserves literal_answer", () => {
  const result = run({
    ingest_result: ingestResult({
      evidence_item_candidates: [evidenceCandidate({ literal_answer: "Elaborar reporte operativo" })],
    }),
  });

  assert.equal(result.evidence_subfield_derivation_decisions[0].literal_answer_preserved, true);
  assert.equal(result.canonical_variable_record_candidates[0].literal_value, "Elaborar reporte operativo");
});

test("preserves normalized_value when present", () => {
  const result = run({
    ingest_result: ingestResult({
      evidence_item_candidates: [evidenceCandidate({ normalized_value: "elaborar reporte operativo" })],
    }),
  });

  assert.equal(result.evidence_subfield_derivation_decisions[0].normalized_value_preserved_when_present, true);
  assert.equal(result.canonical_variable_record_candidates[0].normalized_value, "elaborar reporte operativo");
});

test("preserves epistemic_status in derivation decision", () => {
  assert.equal(run().evidence_subfield_derivation_decisions[0].epistemic_status_preserved, true);
});

test("preserves provenance_type in derivation decision", () => {
  assert.equal(run().evidence_subfield_derivation_decisions[0].provenance_type_preserved, true);
});

test("preserves confidence when present", () => {
  const result = run({
    ingest_result: ingestResult({
      evidence_item_candidates: [evidenceCandidate({ confidence: 0.91 })],
    }),
  });

  assert.equal(result.evidence_subfield_derivation_decisions[0].confidence_preserved_when_present, true);
});

test("preserves source_ref", () => {
  const result = run({
    ingest_result: ingestResult({
      evidence_item_candidates: [evidenceCandidate({ source_ref: "SRC-B0-Q01" })],
    }),
  });

  assert.equal(result.evidence_subfield_derivation_decisions[0].source_ref_preserved, true);
});

test("preserves source_trace in derivation decision", () => {
  assert.equal(run().evidence_subfield_derivation_decisions[0].source_trace_preserved, true);
});

test("preserves derived_from_response_ids", () => {
  assert.deepEqual(run().canonical_variable_record_candidates[0].derived_from_response_ids, ["RESP-001"]);
});

test("preserves derived_from_subfield_response_ids", () => {
  assert.deepEqual(
    Array.from(run().canonical_variable_record_candidates[0].derived_from_subfield_response_ids),
    ["SUBFIELD-001"],
  );
});

test("preserves source_evidence_item_ids", () => {
  assert.deepEqual(
    Array.from(run().canonical_variable_record_candidates[0].source_evidence_item_ids),
    ["EVID-001"],
  );
});

test("blocks variable from absent response", () => {
  const result = run({
    ingest_result: ingestResult({
      subfield_response_candidates: [subfieldCandidate({ value: undefined })],
      evidence_item_candidates: [evidenceCandidate({ literal_value: undefined })],
    }),
  });

  assert.equal(result.service_status, "blocked_variable_from_absent_response");
});

test("blocks variable from missing required subfield", () => {
  const decision = service.Runtime40_20CanonicalVariableService.deriveCanonicalVariableFromEvidenceOrSubfieldCandidate(
    evidenceCandidate(),
    subfieldCandidate({ subfield_name: "" }),
    canonicalMapping({ required: true }),
  );

  assert.equal(decision.blocking_reasons.includes("missing_required_subfield"), true);
});

test("blocks pending microconfirmation as variable", () => {
  const result = run({
    ingest_result: ingestResult({
      subfield_response_candidates: [subfieldCandidate({ pending_microconfirmation: true })],
    }),
  });

  assert.equal(result.service_status, "blocked_pending_microconfirmation_as_variable");
});

test("blocks review_gap as variable", () => {
  const result = run({
    ingest_result: ingestResult({
      subfield_response_candidates: [subfieldCandidate({ review_gap: true })],
    }),
  });

  assert.equal(result.service_status, "blocked_review_gap_as_variable");
});

test("does not harden ai_inferred_unconfirmed", () => {
  const result = run({
    ingest_result: ingestResult({
      subfield_response_candidates: [
        subfieldCandidate({
          epistemic_status: "ai_inferred_unconfirmed",
          provenance_type: "ai_suggestion",
        }),
      ],
      evidence_item_candidates: [
        evidenceCandidate({
          epistemic_status: "ai_inferred_unconfirmed",
          provenance_type: "ai_suggestion",
          hard_evidence: true,
        }),
      ],
    }),
  });

  assert.equal(result.service_status, "blocked_ai_inference_as_hard_canonical_variable");
  assert.equal(result.canonical_epistemic_enforcement_decisions[0].ai_inferred_unconfirmed_hard_evidence, false);
});

test("creates canonical epistemic enforcement decision", () => {
  assert.equal(run().canonical_epistemic_enforcement_decisions[0].canonical_variable_epistemic_allowed, true);
});

test("allows captured_user_evidence only with user_answer provenance", () => {
  const result = run({
    ingest_result: ingestResult({
      subfield_response_candidates: [
        subfieldCandidate({
          epistemic_status: "captured_user_evidence",
          provenance_type: "ai_suggestion",
        }),
      ],
    }),
  });

  assert.equal(result.service_status, "blocked_canonical_epistemic_violation");
});

test("allows user_confirmed_suggestion only with confirmation_reference", () => {
  const result = run({
    ingest_result: ingestResult({
      subfield_response_candidates: [
        subfieldCandidate({
          epistemic_status: "user_confirmed_suggestion",
          provenance_type: "user_confirmation",
          confirmation_reference: "CONF-001",
        }),
      ],
    }),
  });

  assert.equal(result.canonical_epistemic_enforcement_decisions[0].user_confirmed_suggestion_allowed, true);
});

test("allows user_corrected_evidence only with correction_reference or supersedes_response_ref", () => {
  const result = run({
    ingest_result: ingestResult({
      subfield_response_candidates: [
        subfieldCandidate({
          epistemic_status: "user_corrected_evidence",
          provenance_type: "user_correction",
          correction_reference: "CORR-001",
        }),
      ],
    }),
  });

  assert.equal(result.canonical_epistemic_enforcement_decisions[0].user_corrected_evidence_allowed, true);
});

test("blocks canonical_derivation without derived_from_refs", () => {
  const result = run({
    ingest_result: ingestResult({
      subfield_response_candidates: [
        subfieldCandidate({
          epistemic_status: "canonical_derivation",
          provenance_type: "canonical_derivation",
        }),
      ],
    }),
    canonical_variable_mappings: [canonicalMapping({ derivation_rule_ref: "DRV-001" })],
  });

  assert.equal(result.service_status, "blocked_canonical_epistemic_violation");
});

test("blocks canonical_derivation without derivation_rule_ref", () => {
  const result = run({
    ingest_result: ingestResult({
      subfield_response_candidates: [
        subfieldCandidate({
          epistemic_status: "canonical_derivation",
          provenance_type: "canonical_derivation",
          source_trace: {
            ...subfieldCandidate().source_trace,
            raw_row: { derived_from_refs: ["SUBFIELD-001"] },
          },
        }),
      ],
    }),
  });

  assert.equal(result.service_status, "blocked_canonical_epistemic_violation");
});

test("blocks internal_calculated as user answer", () => {
  const decision = service.Runtime40_20CanonicalVariableService.enforceCanonicalVariableEpistemicStatus(
    subfieldCandidate({
      epistemic_status: "internal_calculated",
      provenance_type: "user_answer",
    }),
    evidenceCandidate(),
    canonicalMapping(),
  );

  assert.equal(decision.blocking_reasons.includes("internal_calculated_used_as_user_answer"), true);
});

test("creates variable value/type boundary", () => {
  assert.equal(run().variable_value_type_boundaries[0].type_boundary_passed, true);
});

test("allows expected_type=unknown", () => {
  const result = run({
    canonical_variable_mappings: [canonicalMapping({ expected_type: "unknown", variable_type: "unknown" })],
  });

  assert.equal(result.variable_value_type_boundaries[0].expected_type, "unknown");
  assert.equal(result.variable_value_type_boundaries[0].type_boundary_passed, true);
});

test("blocks string value when expected_type=number", () => {
  const result = run({
    canonical_variable_mappings: [canonicalMapping({ expected_type: "number", variable_type: "number" })],
  });

  assert.equal(result.service_status, "blocked_variable_value_type_mismatch");
});

test("blocks number value when expected_type=string", () => {
  const result = run({
    ingest_result: ingestResult({
      subfield_response_candidates: [subfieldCandidate({ value: 123 })],
      evidence_item_candidates: [evidenceCandidate({ literal_value: 123 })],
    }),
  });

  assert.equal(result.service_status, "blocked_variable_value_type_mismatch");
});

test("blocks enum value outside authorized options", () => {
  const result = run({
    canonical_variable_mappings: [
      canonicalMapping({ expected_type: "enum", variable_type: "enum", enum_options: ["A", "B"] }),
    ],
  });

  assert.equal(result.service_status, "blocked_variable_value_type_mismatch");
});

test("does not auto-convert string to number", () => {
  const boundary = run({
    canonical_variable_mappings: [canonicalMapping({ expected_type: "number", variable_type: "number" })],
  }).variable_value_type_boundaries[0];

  assert.equal(boundary.string_to_number_auto_conversion_used, false);
  assert.equal(boundary.blocking_reasons.includes("unauthorized_type_conversion_detected"), true);
});

test("does not auto-parse date", () => {
  const boundary = run({
    canonical_variable_mappings: [canonicalMapping({ expected_type: "date", variable_type: "date" })],
  }).variable_value_type_boundaries[0];

  assert.equal(boundary.date_auto_parse_used, false);
  assert.equal(boundary.blocking_reasons.includes("unauthorized_date_parse_detected"), true);
});

test("does not collapse object to text", () => {
  const result = run({
    ingest_result: ingestResult({
      subfield_response_candidates: [subfieldCandidate({ value: { action: "elaborar" } })],
      evidence_item_candidates: [evidenceCandidate({ literal_value: { action: "elaborar" } })],
    }),
    canonical_variable_mappings: [canonicalMapping({ expected_type: "object", variable_type: "object" })],
  });

  assert.equal(result.variable_value_type_boundaries[0].object_collapsed_to_text, false);
  assert.equal(result.ok, true);
});

test("does not collapse array to text", () => {
  const result = run({
    ingest_result: ingestResult({
      subfield_response_candidates: [subfieldCandidate({ value: ["elaborar"] })],
      evidence_item_candidates: [evidenceCandidate({ literal_value: ["elaborar"] })],
    }),
    canonical_variable_mappings: [canonicalMapping({ expected_type: "array", variable_type: "array" })],
  });

  assert.equal(result.variable_value_type_boundaries[0].array_collapsed_to_text, false);
  assert.equal(result.ok, true);
});

test("does not infer missing value", () => {
  const boundary = run({
    ingest_result: ingestResult({
      subfield_response_candidates: [subfieldCandidate({ value: undefined })],
      evidence_item_candidates: [evidenceCandidate({ literal_value: undefined })],
    }),
  }).variable_value_type_boundaries[0];

  assert.equal(boundary.missing_value_inferred, false);
  assert.equal(boundary.blocking_reasons.includes("missing_value_inferred"), true);
});

test("canonical_variable_record_real_created remains false after 7-B", () => {
  assert.equal(run().canonical_variable_record_real_created, false);
});

test("BranchingEngine executed remains false after 7-B", () => {
  assert.equal(run().branching_engine_executed, false);
});

test("CriticalRouteGate executed remains false after 7-B", () => {
  assert.equal(run().critical_route_gate_executed, false);
});

test("ReadinessEngine executed remains false after 7-B", () => {
  assert.equal(run().readiness_engine_executed, false);
});

test("Supabase/SQL/endpoint remain false after 7-B", () => {
  const result = run();

  assert.equal(result.supabase_touched, false);
  assert.equal(result.sql_executed, false);
  assert.equal(result.endpoint_created, false);
});

test("Phase 7 closed local remains false after 7-B", () => {
  assert.equal(run().phase7_closed_local, false);
});

test("Ready for Phase 8 authorization remains false after 7-B", () => {
  assert.equal(run().ready_for_phase8_authorization, false);
});

test("creates route_status decisions", () => {
  assert.equal(run().route_status_decisions.length, 1);
});

for (const status of [
  "not_applicable",
  "open",
  "closed",
  "closed_with_flags",
  "unresolved",
  "blocked_by_missing_evidence",
  "blocked_by_missing_canonical_route",
  "route_missing",
  "requires_reentry",
  "manual_review_required",
  "superseded",
]) {
  test(`supports route_status ${status}`, () => {
    const decision = service.Runtime40_20CanonicalVariableService.buildCanonicalRouteStatusDecision(
      canonicalMapping({ route_status: status }),
      evidenceCandidate(),
    );

    assert.equal(decision.route_status, status);
  });
}

test("blocks closed route without canonical evidence", () => {
  const decision = service.Runtime40_20CanonicalVariableService.buildCanonicalRouteStatusDecision(
    canonicalMapping({ route_status: "closed" }),
    undefined,
  );

  assert.equal(decision.route_status_candidate_allowed, false);
  assert.equal(decision.blocking_reasons.includes("route_closed_without_canonical_evidence"), true);
});

test("preserves route_status_reason", () => {
  assert.equal(
    service.Runtime40_20CanonicalVariableService.buildCanonicalRouteStatusDecision(
      canonicalMapping({ route_status_reason: "explicit reason" }),
      evidenceCandidate(),
    ).route_status_reason,
    "explicit reason",
  );
});

test("preserves route_status_source_trace", () => {
  const sourceTrace = { source_document: "doc", source_sheet: "sheet", source_row_number: 1 };
  const decision = service.Runtime40_20CanonicalVariableService.buildCanonicalRouteStatusDecision(
    canonicalMapping({ route_status_source_trace: sourceTrace }),
    evidenceCandidate(),
  );

  assert.equal(decision.route_status_source_trace.source_document, "doc");
});

test("does not execute CriticalRouteGate in route_status model", () => {
  assert.equal(run().route_status_decisions[0].critical_route_gate_executed, false);
});

test("does not execute MMABPGateEngine in route_status model", () => {
  assert.equal(run().route_status_decisions[0].mmabp_gate_engine_executed, false);
});

test("creates gap_flag decisions", () => {
  assert.equal(run().gap_flag_decisions.length, 1);
});

for (const gapType of [
  "missing_evidence",
  "missing_canonical_route",
  "contradiction",
  "semantic_ambiguity",
  "route_gap",
  "manual_review",
  "budget_exhausted",
  "process_state_without_timer",
]) {
  test(`supports gap_type ${gapType}`, () => {
    const decision = service.Runtime40_20CanonicalVariableService.buildCanonicalGapFlagDecision(
      canonicalMapping({ gap_flag: true, gap_type: gapType }),
    );

    assert.equal(decision.gap_type, gapType);
  });
}

test("supports inherited budget_exhausted only when explicit", () => {
  const decision = service.Runtime40_20CanonicalVariableService.buildCanonicalGapFlagDecision(
    canonicalMapping({ gap_flag: true, gap_type: "budget_exhausted" }),
  );

  assert.equal(decision.gap_type, "budget_exhausted");
});

test("supports inherited process_state_without_timer only when explicit", () => {
  const decision = service.Runtime40_20CanonicalVariableService.buildCanonicalGapFlagDecision(
    canonicalMapping({ gap_flag: true, gap_type: "process_state_without_timer" }),
  );

  assert.equal(decision.gap_type, "process_state_without_timer");
});

test("blocks gap hidden as closed variable", () => {
  const decision = service.Runtime40_20CanonicalVariableService.buildCanonicalGapFlagDecision(
    canonicalMapping({ gap_hidden_as_closed_variable: true }),
  );

  assert.equal(decision.gap_candidate_allowed, false);
  assert.equal(decision.blocking_reasons.includes("gap_hidden_as_closed_variable"), true);
});

test("preserves gap_reason", () => {
  const decision = service.Runtime40_20CanonicalVariableService.buildCanonicalGapFlagDecision(
    canonicalMapping({ gap_reason: "explicit gap reason" }),
  );

  assert.equal(decision.gap_reason, "explicit gap reason");
});

test("preserves gap_source_trace", () => {
  const decision = service.Runtime40_20CanonicalVariableService.buildCanonicalGapFlagDecision(
    canonicalMapping({ gap_source_trace: { source_document: "doc" } }),
  );

  assert.equal(decision.gap_source_trace.source_document, "doc");
});

test("does not execute ReadinessEngine in gap model", () => {
  assert.equal(run().gap_flag_decisions[0].readiness_engine_executed, false);
});

test("does not create readiness_decision_record", () => {
  assert.equal(run().gap_flag_decisions[0].readiness_decision_record_created, false);
});

test("creates C09 receiver feedback canonical boundary", () => {
  assert.equal(run().c09_receiver_feedback_boundaries.length, 1);
});

test("preserves receiver_feedback_exists", () => {
  const result = run({
    ingest_result: ingestResult({
      c09_receiver_feedback_boundary: {
        ...ingestResult().c09_receiver_feedback_boundary,
        receiver_feedback_exists: true,
      },
    }),
  });

  assert.equal(result.c09_receiver_feedback_boundaries[0].receiver_feedback_exists, true);
});

test("preserves explicit receiver_feedback", () => {
  const result = run({
    ingest_result: ingestResult({
      c09_receiver_feedback_boundary: {
        ...ingestResult().c09_receiver_feedback_boundary,
        receiver_feedback_exists: true,
        receiver_feedback: "El receptor pidio corregir el entregable",
      },
    }),
  });

  assert.equal(result.c09_receiver_feedback_boundaries[0].receiver_feedback, "El receptor pidio corregir el entregable");
});

test("keeps receiver_satisfaction separated", () => {
  assert.equal(run().c09_receiver_feedback_boundaries[0].receiver_satisfaction_separated, true);
});

test("keeps delivery_failure separated", () => {
  assert.equal(run().c09_receiver_feedback_boundaries[0].delivery_failure_separated, true);
});

test("blocks receiver_feedback from satisfaction in C09 boundary", () => {
  const boundary = service.Runtime40_20CanonicalVariableService.enforceC09ReceiverFeedbackCanonicalBoundary(
    ingestResult().c09_receiver_feedback_boundary,
    canonicalMapping({ receiver_feedback_from_satisfaction: true }),
  );

  assert.equal(boundary.canonical_variable_candidate_allowed, false);
  assert.equal(boundary.blocking_reasons.includes("receiver_feedback_from_satisfaction_detected"), true);
});

test("blocks receiver_feedback from ambiguous comment", () => {
  const boundary = service.Runtime40_20CanonicalVariableService.enforceC09ReceiverFeedbackCanonicalBoundary(
    ingestResult().c09_receiver_feedback_boundary,
    canonicalMapping({ receiver_feedback_from_ambiguous_comment: true }),
  );

  assert.equal(boundary.canonical_variable_candidate_allowed, false);
  assert.equal(boundary.blocking_reasons.includes("receiver_feedback_from_ambiguous_comment_detected"), true);
});

test("blocks C09 closed by wrong route", () => {
  const boundary = service.Runtime40_20CanonicalVariableService.enforceC09ReceiverFeedbackCanonicalBoundary(
    ingestResult().c09_receiver_feedback_boundary,
    canonicalMapping({ c09_closed_by_wrong_route: true }),
  );

  assert.equal(boundary.canonical_variable_candidate_allowed, false);
  assert.equal(boundary.blocking_reasons.includes("c09_closed_by_wrong_route"), true);
});

test("preserves route_missing when no canonical route", () => {
  const result = run({
    ingest_result: ingestResult({
      c09_receiver_feedback_boundary: {
        ...ingestResult().c09_receiver_feedback_boundary,
        route_missing: true,
        route_missing_preserved_when_no_canonical_route: true,
      },
    }),
  });

  assert.equal(result.c09_receiver_feedback_boundaries[0].route_missing_preserved_when_no_canonical_route, true);
});

test("creates B0 critical route variable family", () => {
  assert.equal(run().critical_route_variable_families.some((family) => family.family_id === "B0_semantic_entry"), true);
});

test("creates B2 critical route variable family", () => {
  assert.equal(run().critical_route_variable_families.some((family) => family.family_id === "B2_transformation_exception"), true);
});

test("creates B3 critical route variable family", () => {
  assert.equal(run().critical_route_variable_families.some((family) => family.family_id === "B3_receiver_feedback"), true);
});

test("creates B7 critical route variable family", () => {
  assert.equal(run().critical_route_variable_families.some((family) => family.family_id === "B7_preclassification_boundary"), true);
});

test("critical route families do not execute gates", () => {
  assert.equal(run().critical_route_variable_families.every((family) => family.gate_executed === false), true);
});

test("B0 family supports action_verb/input_or_object/procedure_or_standard/output_or_result", () => {
  const family = run().critical_route_variable_families.find((item) => item.family_id === "B0_semantic_entry");

  assert.equal(family.supported_variable_names.includes("action_verb"), true);
  assert.equal(family.supported_variable_names.includes("input_or_object"), true);
  assert.equal(family.supported_variable_names.includes("procedure_or_standard"), true);
  assert.equal(family.supported_variable_names.includes("output_or_result"), true);
});

test("B2 family supports transformation exception variables", () => {
  const family = run().critical_route_variable_families.find((item) => item.family_id === "B2_transformation_exception");

  assert.equal(family.supported_variable_names.includes("transformation_exception_type"), true);
  assert.equal(family.supported_variable_names.includes("transformation_exception_route_unresolved"), true);
});

test("B3 family supports receiver feedback variables", () => {
  const family = run().critical_route_variable_families.find((item) => item.family_id === "B3_receiver_feedback");

  assert.equal(family.supported_variable_names.includes("receiver_feedback"), true);
  assert.equal(family.supported_variable_names.includes("receiver_feedback_route_missing"), true);
});

test("B7 family supports preclassification boundary variables", () => {
  const family = run().critical_route_variable_families.find((item) => item.family_id === "B7_preclassification_boundary");

  assert.equal(family.supported_variable_names.includes("preclassification_signal"), true);
  assert.equal(family.supported_variable_names.includes("non_diagnostic_boundary"), true);
});

test("creates B7 non-diagnostic guard", () => {
  assert.equal(run().b7_non_diagnostic_guards.length, 1);
});

test("B7-Q39 remains non_diagnostic", () => {
  assert.equal(run().b7_non_diagnostic_guards[0].b7_q39_non_diagnostic, true);
});

test("B7-Q40 remains non_diagnostic", () => {
  assert.equal(run().b7_non_diagnostic_guards[0].b7_q40_non_diagnostic, true);
});

test("C20 remains non_diagnostic", () => {
  assert.equal(run().b7_non_diagnostic_guards[0].c20_non_diagnostic, true);
});

test("B7 signal_status remains preclassification_only", () => {
  assert.equal(run().b7_non_diagnostic_guards[0].signal_status, "preclassification_only");
});

test("blocks B7 diagnostic transduction", () => {
  const guard = service.Runtime40_20CanonicalVariableService.enforceB7NonDiagnosticGuard({
    elevation_attempted: true,
  });

  assert.equal(guard.b7_diagnostic_transduction_blocked, true);
  assert.equal(guard.blocking_reasons.includes("b7_diagnostic_transduction_attempted"), true);
});

test("does not create VSM/AHE final", () => {
  assert.equal(run().b7_non_diagnostic_guards[0].vsm_ahe_final_created, false);
});

test("does not create direct MoC", () => {
  assert.equal(run().b7_non_diagnostic_guards[0].moc_direct_created, false);
});

test("does not create IR from B7", () => {
  assert.equal(run().b7_non_diagnostic_guards[0].ir_direct_created, false);
});

test("does not create registry from B7", () => {
  assert.equal(run().b7_non_diagnostic_guards[0].registry_created, false);
});

test("does not create export from B7", () => {
  assert.equal(run().b7_non_diagnostic_guards[0].export_created, false);
});

test("does not create diagnosis from B7", () => {
  assert.equal(run().b7_non_diagnostic_guards[0].diagnosis_created, false);
});

test("canonical_variable_record real created remains false after 7-C", () => {
  assert.equal(run().canonical_variable_record_real_created, false);
});

test("BranchingEngine executed remains false after 7-C", () => {
  assert.equal(run().branching_engine_executed, false);
});

test("Supabase/SQL/endpoint remain false after 7-C", () => {
  const result = run();

  assert.equal(result.supabase_touched, false);
  assert.equal(result.sql_executed, false);
  assert.equal(result.endpoint_created, false);
});

test("Phase 7 closed local remains false after 7-C", () => {
  assert.equal(run().phase7_closed_local, false);
});

test("Ready for Phase 8 authorization remains false after 7-C", () => {
  assert.equal(run().ready_for_phase8_authorization, false);
});

test("creates gate-prep boundary", () => {
  assert.equal(Boolean(run().gate_prep_boundary), true);
});

test("prepares variables for future CriticalRouteGate", () => {
  assert.equal(run().gate_prep_boundary.variables_prepared_for_critical_route_gate_future, true);
});

test("prepares variables for future MMABPGateEngine", () => {
  assert.equal(run().gate_prep_boundary.variables_prepared_for_mmabp_gate_engine_future, true);
});

test("prepares route_status for future readiness", () => {
  assert.equal(run().gate_prep_boundary.route_status_prepared_for_readiness_future, true);
});

test("prepares gap_flag for future readiness", () => {
  assert.equal(run().gate_prep_boundary.gap_flag_prepared_for_readiness_future, true);
});

test("does not execute CriticalRouteGate in gate-prep boundary", () => {
  assert.equal(run().gate_prep_boundary.critical_route_gate_executed, false);
});

test("does not execute MMABPGateEngine in gate-prep boundary", () => {
  assert.equal(run().gate_prep_boundary.mmabp_gate_engine_executed, false);
});

test("does not execute ReadinessEngine in gate-prep boundary", () => {
  assert.equal(run().gate_prep_boundary.readiness_engine_executed, false);
});

test("does not create readiness_decision_record in gate-prep boundary", () => {
  assert.equal(run().gate_prep_boundary.readiness_decision_record_created, false);
});

test("does not create semantic_resolution_event", () => {
  assert.equal(run().semantic_resolution_event_created, false);
  assert.equal(run().gate_prep_boundary.semantic_resolution_event_created, false);
});

test("does not create process_state_timer_event", () => {
  assert.equal(run().process_state_timer_event_created, false);
  assert.equal(run().gate_prep_boundary.process_state_timer_event_created, false);
});

test("does not open reentry", () => {
  assert.equal(run().reentry_opened, false);
  assert.equal(run().gate_prep_boundary.reentry_opened, false);
});

test("blocks explicit gate execution attempt", () => {
  const boundary = service.Runtime40_20CanonicalVariableService.buildGatePrepBoundary({
    gate_execution_attempted: true,
  });

  assert.equal(boundary.gate_prep_candidate_allowed, false);
  assert.equal(boundary.blocking_reasons.includes("gate_execution_attempted"), true);
});

test("creates supersession/revision decision", () => {
  assert.equal(run().supersession_revision_decisions.length, 1);
});

test("inherits response_revision_number when present", () => {
  assert.equal(run().supersession_revision_decisions[0].response_revision_number_inherited, 1);
});

test("inherits supersedes_response_ref when present", () => {
  const result = run({
    ingest_result: ingestResult({
      revision_decision: {
        ...ingestResult().revision_decision,
        supersedes_response_ref: "RESP-000",
      },
    }),
  });

  assert.equal(result.supersession_revision_decisions[0].supersedes_response_ref_inherited, "RESP-000");
});

test("preserves supersedes_canonical_variable_ref only when explicit", () => {
  const result = run({
    canonical_variable_mappings: [
      canonicalMapping({ supersedes_canonical_variable_ref: "CVAR-000" }),
    ],
  });

  assert.equal(result.supersession_revision_decisions[0].supersedes_canonical_variable_ref, "CVAR-000");
});

test("does not invent supersedes_canonical_variable_ref", () => {
  assert.equal(run().supersession_revision_decisions[0].supersedes_canonical_variable_ref, undefined);
});

test("preserves previous_variable_ref", () => {
  const result = run({
    canonical_variable_mappings: [
      canonicalMapping({ previous_variable_ref: "CVAR-PREV" }),
    ],
  });

  assert.equal(result.supersession_revision_decisions[0].previous_variable_ref_preserved, "CVAR-PREV");
});

test("preserves invalidated_at only when explicit", () => {
  const result = run({
    canonical_variable_mappings: [
      canonicalMapping({ invalidated_at: "2026-07-03T00:00:00.000Z", invalidation_reason: "explicit correction" }),
    ],
  });

  assert.equal(result.supersession_revision_decisions[0].invalidated_at, "2026-07-03T00:00:00.000Z");
  assert.equal(run().supersession_revision_decisions[0].invalidated_at, undefined);
});

test("requires invalidation_reason when invalidated_at exists", () => {
  const result = run({
    canonical_variable_mappings: [
      canonicalMapping({ invalidated_at: "2026-07-03T00:00:00.000Z" }),
    ],
  });

  assert.equal(result.ok, false);
  assert.equal(result.service_status, "blocked_untraced_variable_overwrite");
});

test("correction dominates prior inference", () => {
  assert.equal(run().supersession_revision_decisions[0].correction_dominates_prior_inference, true);
});

test("does not delete previous variable without trace", () => {
  assert.equal(run().supersession_revision_decisions[0].previous_variable_deleted_without_trace, false);
});

test("does not execute global recomputation", () => {
  assert.equal(run().supersession_revision_decisions[0].global_recomputation_executed, false);
});

test("blocks global recomputation attempt", () => {
  const result = run({
    canonical_variable_mappings: [
      canonicalMapping({ global_recomputation_attempted: true }),
    ],
  });

  assert.equal(result.service_status, "blocked_global_recomputation_attempt");
});

test("creates supersession audit candidate", () => {
  const result = run({
    canonical_variable_mappings: [
      canonicalMapping({ previous_variable_ref: "CVAR-PREV" }),
    ],
  });

  assert.equal(result.supersession_revision_decisions[0].supersession_audit_candidate_created, true);
});

test("creates object binding reference boundary", () => {
  assert.equal(run().object_binding_reference_boundaries.length, 1);
});

test("preserves object_binding_status when present", () => {
  const result = run({
    canonical_variable_mappings: [
      canonicalMapping({ object_binding_status: "candidate_bound" }),
    ],
  });

  assert.equal(result.object_binding_reference_boundaries[0].object_binding_status, "candidate_bound");
});

test("preserves runtime_object_binding_ref when present", () => {
  const result = run({
    canonical_variable_mappings: [
      canonicalMapping({ runtime_object_binding_ref: "OBJ-BIND-001" }),
    ],
  });

  assert.equal(result.object_binding_reference_boundaries[0].runtime_object_binding_ref, "OBJ-BIND-001");
});

test("preserves protected_object_hint when present", () => {
  const result = run({
    canonical_variable_mappings: [
      canonicalMapping({ protected_object_hint: "entregable protegido" }),
    ],
  });

  assert.equal(result.object_binding_reference_boundaries[0].protected_object_hint, "entregable protegido");
});

test("preserves candidate_object_ref when present", () => {
  const result = run({
    canonical_variable_mappings: [
      canonicalMapping({ candidate_object_ref: "OBJ-CAND-001" }),
    ],
  });

  assert.equal(result.object_binding_reference_boundaries[0].candidate_object_ref, "OBJ-CAND-001");
});

test("does not create Object Inventory", () => {
  assert.equal(run().object_binding_reference_boundaries[0].object_inventory_created, false);
});

test("does not materialize live object", () => {
  assert.equal(run().object_binding_reference_boundaries[0].live_object_materialized, false);
});

test("does not modify eve_object_definition", () => {
  assert.equal(run().object_binding_reference_boundaries[0].eve_object_definition_modified, false);
});

test("does not create object_materialization_event", () => {
  assert.equal(run().object_binding_reference_boundaries[0].object_materialization_event_created, false);
});

test("blocks object materialization attempt", () => {
  const result = run({
    canonical_variable_mappings: [
      canonicalMapping({ object_materialization_attempted: true }),
    ],
  });

  assert.equal(result.service_status, "blocked_object_materialization_attempt");
});

test("preserves object refs for future phase when present", () => {
  const result = run({
    canonical_variable_mappings: [
      canonicalMapping({ runtime_object_binding_ref: "OBJ-BIND-001" }),
    ],
  });

  assert.equal(result.object_binding_reference_boundaries[0].object_refs_preserved_for_future_phase, true);
});

test("creates canonical persistence boundary", () => {
  assert.equal(Boolean(run().persistence_boundary), true);
});

test("local canonical variable candidate mode remains true", () => {
  assert.equal(run().persistence_boundary.local_canonical_variable_record_candidate_mode, true);
});

test("db_write_authorized remains false", () => {
  assert.equal(run().persistence_boundary.db_write_authorized, false);
});

test("canonical_variable_record real created remains false in persistence boundary", () => {
  assert.equal(run().persistence_boundary.canonical_variable_record_real_created, false);
});

test("Supabase touch authorized remains false", () => {
  assert.equal(run().persistence_boundary.supabase_touch_authorized, false);
});

test("SQL execution authorized remains false", () => {
  assert.equal(run().persistence_boundary.sql_execution_authorized, false);
});

test("Endpoint creation authorized remains false", () => {
  assert.equal(run().persistence_boundary.endpoint_creation_authorized, false);
});

test("service_role_used remains false", () => {
  assert.equal(run().persistence_boundary.service_role_used, false);
});

test("service_role_used_in_client remains false", () => {
  assert.equal(run().persistence_boundary.service_role_used_in_client, false);
});

test("scene_write_detected remains false", () => {
  assert.equal(run().persistence_boundary.scene_write_detected, false);
});

test("mba_write_detected remains false", () => {
  assert.equal(run().persistence_boundary.mba_write_detected, false);
});

test("parallel_production_runtime_artifacts_write_detected remains false", () => {
  assert.equal(run().persistence_boundary.parallel_production_runtime_artifacts_write_detected, false);
});

test("export_preview_created remains false in persistence boundary", () => {
  assert.equal(run().persistence_boundary.export_preview_created, false);
});

test("blocks persistence boundary violation", () => {
  const result = run({
    canonical_variable_mappings: [
      canonicalMapping({ canonical_persistence_boundary_violation: true }),
    ],
  });

  assert.equal(result.service_status, "blocked_canonical_persistence_boundary_violation");
});

test("creates canonical variable audit candidates", () => {
  assert.equal(run().canonical_variable_audit_candidates.length, 14);
});

for (const action of [
  "canonical_variable_candidate_created",
  "canonical_variable_candidate_blocked",
  "explicit_mapping_verified",
  "mapping_similarity_blocked",
  "source_trace_missing_blocked",
  "route_status_assigned",
  "gap_flag_assigned",
  "receiver_feedback_from_satisfaction_blocked",
  "variable_superseded",
  "variable_invalidated",
  "canonical_derivation_registered",
  "gate_execution_attempt_blocked",
  "persistence_boundary_violation_blocked",
  "phase8_execution_attempt_blocked",
]) {
  test(`supports ${action} audit action`, () => {
    assert.equal(run().canonical_variable_audit_candidates.some((candidate) => candidate.audit_action === action), true);
  });
}

test("real runtime_audit_trail remains false for audit candidates", () => {
  assert.equal(
    run().canonical_variable_audit_candidates.every((candidate) => candidate.real_runtime_audit_trail_created === false),
    true,
  );
});

test("audit candidates do not touch Supabase SQL or endpoints", () => {
  assert.equal(
    run().canonical_variable_audit_candidates.every(
      (candidate) =>
        candidate.supabase_touched === false &&
        candidate.sql_executed === false &&
        candidate.endpoint_created === false,
    ),
    true,
  );
});

test("creates Phase 8 boundary", () => {
  assert.equal(Boolean(run().phase8_boundary), true);
});

test("variables ready for future branching", () => {
  assert.equal(run().phase8_boundary.variables_ready_for_future_branching, true);
});

test("gaps ready for future branching", () => {
  assert.equal(run().phase8_boundary.gaps_ready_for_future_branching, true);
});

test("route_status ready for future triggers", () => {
  assert.equal(run().phase8_boundary.route_status_ready_for_future_triggers, true);
});

test("triggers_evaluated remains false", () => {
  assert.equal(run().phase8_boundary.triggers_evaluated, false);
});

test("causal_score_calculated remains false", () => {
  assert.equal(run().phase8_boundary.causal_score_calculated, false);
});

test("branching_decision_created remains false", () => {
  assert.equal(run().phase8_boundary.branching_decision_created, false);
});

test("budget_ledger_updated remains false", () => {
  assert.equal(run().phase8_boundary.budget_ledger_updated, false);
});

test("BranchingEngine executed remains false in Phase 8 boundary", () => {
  assert.equal(run().phase8_boundary.branching_engine_executed, false);
});

test("causal_activities_opened remains false", () => {
  assert.equal(run().phase8_boundary.causal_activities_opened, false);
});

test("causal_budget_exceeded remains false", () => {
  assert.equal(run().phase8_boundary.causal_budget_exceeded, false);
});

test("phase8_started remains false", () => {
  assert.equal(run().phase8_boundary.phase8_started, false);
  assert.equal(run().phase8_started, false);
});

test("blocks Phase 8 execution attempt", () => {
  const result = run({
    canonical_variable_mappings: [
      canonicalMapping({ phase8_execution_attempted: true }),
    ],
  });

  assert.equal(result.service_status, "blocked_phase8_execution_attempt");
});

test("canonical_variable_record real created remains false after 7-D", () => {
  assert.equal(run().canonical_variable_record_real_created, false);
});

test("Runtime 40/20 real started remains false after 7-D", () => {
  assert.equal(run().runtime_40_20_started, false);
});

test("Supabase SQL and endpoint remain false after 7-D", () => {
  const result = run();

  assert.equal(result.supabase_touched, false);
  assert.equal(result.sql_executed, false);
  assert.equal(result.endpoint_created, false);
});

test("Phase 7 closed local remains false after 7-D", () => {
  assert.equal(run().phase7_closed_local, false);
});

test("Ready for Phase 8 authorization remains false after 7-D", () => {
  assert.equal(run().ready_for_phase8_authorization, false);
});

function run(overrides = {}) {
  return service.createRuntime4020CanonicalVariableCandidatesLocal({
    case_id: "CASE-001",
    ingest_result: ingestResult(),
    canonical_variable_mappings: [canonicalMapping()],
    phase6_closeout: {
      phase6_closed_local: true,
      ready_for_phase7_authorization: true,
    },
    ...overrides,
  });
}

function ingestResult(overrides = {}) {
  return {
    ok: true,
    case_id: "CASE-001",
    ingest_status: "ingest_candidate_ready",
    subfield_response_candidates: [subfieldCandidate()],
    evidence_item_candidates: [evidenceCandidate()],
    response_revision_candidate: {},
    ingest_audit_candidate: {},
    ingest_decision: {
      real_response_persisted: false,
    },
    idempotency_decision: {
      idempotency_key: "IDEMP-001",
      idempotency_key_present: true,
      idempotency_replay_detected: false,
      duplicate_response_created: false,
      real_idempotency_record_created: false,
    },
    revision_decision: {
      response_revision_number: 1,
      revision_number_present: true,
      supersedes_response_ref_required: false,
      supersedes_response_ref_present: false,
      correction_reference_preserved: true,
      previous_evidence_deleted_without_trace: false,
      advanced_recomputation_deferred: true,
    },
    c09_receiver_feedback_boundary: {
      receiver_feedback_exists: false,
      gap_flag: false,
      route_missing: false,
      receiver_feedback_inferred_from_satisfaction: false,
      receiver_feedback_inferred_from_ambiguous_comment: false,
      route_missing_preserved_when_no_canonical_route: false,
      readiness_gap_record_real_created: false,
      critical_route_gate_executed: false,
      readiness_engine_executed: false,
    },
    no_go_check: noGo(),
    materiality: {
      level: "runtime_40_20_response_ingest_local_contract",
      local_only: true,
      real_response_persisted: false,
      real_evidence_created: false,
      runtime_40_20_started: false,
      next_authorization_required: true,
    },
    ...overrides,
  };
}

function subfieldCandidate(overrides = {}) {
  return {
    subfield_response_ref: "SUBFIELD-001",
    runtime_interaction_id: "B0-Q01",
    interaction_instance_id_preview: "RUN-001:B0-Q01:preview",
    subfield_name: "action_verb",
    value: "Elaborar reporte operativo",
    epistemic_status: "captured_user_evidence",
    provenance_type: "user_answer",
    response_revision_number: 1,
    idempotency_key: "IDEMP-001",
    source_trace: {
      source_document: "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
      source_sheet: "Runtime_Interactions_Base_40",
      source_row_number: 2,
      raw_row: {
        source_code: "SRC-B0-Q01",
      },
      source_codes: ["SRC-B0-Q01"],
      source_refs: ["SRC-B0-Q01"],
    },
    real_subfield_response_created: false,
    ...overrides,
  };
}

function evidenceCandidate(overrides = {}) {
  return {
    evidence_item_ref: "EVID-001",
    runtime_interaction_id: "B0-Q01",
    interaction_instance_id_preview: "RUN-001:B0-Q01:preview",
    subfield_name: "action_verb",
    literal_value: "Elaborar reporte operativo",
    epistemic_status: "captured_user_evidence",
    provenance_type: "user_answer",
    evidence_candidate_allowed: true,
    hard_evidence: true,
    source_trace: subfieldCandidate().source_trace,
    real_evidence_item_created: false,
    ...overrides,
  };
}

function canonicalMapping(overrides = {}) {
  return {
    runtime_interaction_id: "B0-Q01",
    subfield_name: "action_verb",
    source_node_ref: "SRC-B0-Q01",
    source_node_id: "SRC-B0-Q01",
    source_code: "SRC-B0-Q01",
    source_block: "B0",
    runtime_variable_map_ref: "RVM-B0-Q01-action_verb",
    runtime_interaction_mapping_ref: "RIM-B0-Q01-action_verb",
    canonical_variable_id: "CV-001",
    canonical_variable_name: "activity_action_verb",
    canonical_variable_path: "activity.identity.action_verb",
    variable_name: "activity_action_verb",
    variable_type: "string",
    mapping_role: "primary",
    explicit_mapping_present: true,
    expected_source_evidence_refs: ["EVID-001"],
    expected_response_refs: ["RESP-001"],
    mapping_checksum: "checksum-b0q01-action",
    route_id: "B0",
    required: true,
    derived: false,
    source_document: "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
    source_sheet: "Canonical_Variables",
    source_row_number: 20,
    raw_row: {
      runtime_interaction_id: "B0-Q01",
      subfield_name: "action_verb",
      source_node_ref: "SRC-B0-Q01",
      source_node_id: "SRC-B0-Q01",
      source_code: "SRC-B0-Q01",
      source_block: "B0",
      runtime_variable_map_ref: "RVM-B0-Q01-action_verb",
      runtime_interaction_mapping_ref: "RIM-B0-Q01-action_verb",
      canonical_variable_id: "CV-001",
      canonical_variable_name: "activity_action_verb",
      canonical_variable_path: "activity.identity.action_verb",
      variable_type: "string",
      mapping_role: "primary",
      explicit_mapping_present: true,
      expected_source_evidence_refs: ["EVID-001"],
      expected_response_refs: ["RESP-001"],
      mapping_checksum: "checksum-b0q01-action",
    },
    canonicalization_status: "normalized",
    warnings: [],
    blockers: [],
    ...overrides,
  };
}

function noGo(overrides = {}) {
  return {
    no_go_triggered: false,
    blockers: [],
    runtime_40_20_started: false,
    catalog_activated: false,
    migration_applied: false,
    supabase_touched: false,
    sql_executed: false,
    endpoint_created: false,
    real_response_persisted: false,
    real_subfield_response_created: false,
    real_evidence_item_created: false,
    real_audit_record_created: false,
    real_runtime_records_created: false,
    business_evidence_created: false,
    registry_live_db_created: false,
    ir_real_created: false,
    object_inventory_real_opened: false,
    f5c_real_opened: false,
    export_created: false,
    diagnosis_created: false,
    delivered_created: false,
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
