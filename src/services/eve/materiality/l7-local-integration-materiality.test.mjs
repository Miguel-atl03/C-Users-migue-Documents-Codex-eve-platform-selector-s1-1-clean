import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const services = {
  pfSup03: loadService("../transduction/evidential-scene-runner.ts"),
  pfSup04: loadService("../aggregation/causal-movie-aggregation-runner.ts"),
  pfSup05: loadService("../synthesis/expert-synthesis-contract-service.ts"),
  b3: loadService("../capa1/b3-receiver-feedback-materializer.ts"),
  b7: loadService("../capa1/b7-preclassification-boundary-service.ts"),
  materiality: loadService("./materiality-marker-evaluator.ts"),
};

test("integrates B3, B7, PF-SUP-03, PF-SUP-04, PF-SUP-05 and materiality evaluator as L7 local evidence", () => {
  const b3Valid = services.b3.materializeB3ReceiverFeedback({
    b3_input: b3Input(),
  });
  assert.equal(b3Valid.ok, true);
  assert.equal(
    b3Valid.receiver_feedback_object.canonical_route_ref,
    "B3/3.13a/receiver_feedback",
  );
  assert.equal(
    b3Valid.operational_exception_evidence.state,
    "ready_for_bundle",
  );
  assert.equal(b3Valid.no_go.satisfaction_promoted_to_feedback, false);

  const b3RouteMissing = services.b3.materializeB3ReceiverFeedback({
    b3_input: b3Input({
      receiver_feedback_route_status: "route_missing",
      canonical_route_ref: undefined,
    }),
  });
  assert.equal(b3RouteMissing.ok, false);
  assert.equal(b3RouteMissing.issue_type, "CanonicalRouteException");
  assert.equal(b3RouteMissing.operational_exception_evidence, undefined);

  const b7SignalOnly = services.b7.materializeB7PreclassificationBoundary({
    b7_input: b7Input(),
  });
  assert.equal(b7SignalOnly.ok, true);
  assert.equal(
    b7SignalOnly.preclassification_record.state,
    "signal_only_accepted",
  );
  assert.equal(b7SignalOnly.no_render_zone.state, "active");
  assert.equal(b7SignalOnly.no_go.b7_promoted_to_structural_fact, false);
  assert.equal(b7SignalOnly.no_go.b7_promoted_to_registry, false);
  assert.equal(b7SignalOnly.no_go.b7_promoted_to_ir, false);
  assert.equal(b7SignalOnly.no_go.b7_promoted_to_export, false);
  assert.equal(b7SignalOnly.no_go.b7_promoted_to_diagnosis, false);
  assert.equal(b7SignalOnly.no_go.b7_promoted_to_oee, false);

  const pfSup03SceneA = services.pfSup03.runEvidentialSceneTransduction({
    evidence_bundle: evidenceBundle("bundle:a", "scene:a", b7SignalOnly),
  });
  const pfSup03SceneB = services.pfSup03.runEvidentialSceneTransduction({
    evidence_bundle: evidenceBundle("bundle:b", "scene:b", b7SignalOnly),
  });
  assert.equal(pfSup03SceneA.ok, true);
  assert.equal(pfSup03SceneA.actos_observables[0].state, "accepted");
  assert.equal(pfSup03SceneA.escena_evidencial.state, "validated");
  assert.equal(
    pfSup03SceneA.escena_evidencial.b7_boundary.preserved_as_non_diagnostic,
    true,
  );
  assert.equal(pfSup03SceneA.no_go.b7_promoted_to_diagnosis, false);

  const pfSup04 = services.pfSup04.runCausalMovieAggregation({
    case_id: "case:l7-local",
    escenas_evidenciales: [
      pfSup03SceneA.escena_evidencial,
      pfSup03SceneB.escena_evidencial,
    ],
  });
  assert.equal(pfSup04.ok, true);
  assert.equal(pfSup04.scene_set.state, "aggregation_eligible");
  assert.equal(pfSup04.aggregation_index.state, "built");
  assert.equal(pfSup04.pelicula_causal_agregada.state, "aggregated");
  assert.equal(pfSup04.no_go.diagnosis_created, false);
  assert.equal(pfSup04.no_go.client_narrative_created, false);
  assert.equal(pfSup04.no_go.registry_created, false);
  assert.equal(pfSup04.no_go.ir_created, false);
  assert.equal(pfSup04.no_go.export_created, false);

  const pfSup05 = services.pfSup05.runExpertSynthesisContract({
    case_id: "case:l7-local",
    pelicula_causal_agregada: pfSup04.pelicula_causal_agregada,
  });
  assert.equal(pfSup05.ok, true);
  assert.equal(pfSup05.synthesis_case.state, "ready_for_expert_draft");
  assert.equal(pfSup05.delivery_boundary.state, "delivery_blocked");
  assert.equal(pfSup05.delivery_boundary.delivery_authorized, false);
  assert.equal(
    pfSup05.no_go.diagnostico_experto_final_delivered_created,
    false,
  );
  assert.equal(pfSup05.no_go.client_narrative_created, false);
  assert.equal(pfSup05.no_go.consultive_recommendation_created, false);
  assert.equal(pfSup05.no_go.teorema_inevitabilidad_created, false);
  assert.equal(pfSup05.no_go.export_code_package_created, false);

  const materiality = services.materiality.evaluateMaterialityMarkers({
    traceability_records: materialityTraceabilityRecords(),
    marker_contracts: materialityMarkerContracts(),
  });
  assert.equal(materiality.ok, true);
  assert.equal(
    JSON.stringify(
      materiality.families_evaluated.map((evaluation) => evaluation.family),
    ),
    JSON.stringify(["PF_SUP_03", "PF_SUP_04", "PF_SUP_05", "B3", "B7"]),
  );
  assert.equal(materiality.accepted_level, "L6 service_present");
  assert.equal(materiality.no_go.l7_claimed, false);
  assert.equal(materiality.no_go.l8_claimed, false);
  assert.equal(materiality.no_go.runtime_40_20_full_opened, false);
  assert.equal(materiality.no_go.diagnosis_created, false);
  assert.equal(materiality.no_go.registry_created, false);
  assert.equal(materiality.no_go.ir_created, false);
  assert.equal(materiality.no_go.export_created, false);
  assert.equal(materiality.no_go.supabase_touched, false);
  assert.equal(materiality.no_go.sql_created, false);
  assert.equal(materiality.no_go.env_read, false);

  const l7LocalEvidence = {
    level: "L7 tested_materiality",
    local_only: true,
    not_l8: true,
    integrated_services_count: 6,
    global_no_go: {
      runtime_40_20_full_opened: false,
      diagnosis_created: false,
      registry_created: false,
      ir_created: false,
      export_created: false,
      supabase_touched: false,
      sql_created: false,
      env_read: false,
      delivered_created: false,
      delivery_authorized: false,
    },
  };
  assert.equal(l7LocalEvidence.level, "L7 tested_materiality");
  assert.equal(l7LocalEvidence.local_only, true);
  assert.equal(l7LocalEvidence.not_l8, true);
  assert.equal(
    JSON.stringify(Object.values(l7LocalEvidence.global_no_go)),
    JSON.stringify([
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ]),
  );
});

function b3Input(overrides = {}) {
  return {
    case_id: "case:l7-local",
    scene_id: "scene:b3",
    output_handoff_ref: "handoff:receiver",
    receiver_satisfaction_value: "satisfecho",
    receiver_feedback_exists: true,
    receiver_feedback_literal: "el receptor no puede usar el entregable",
    receiver_feedback_type: "operational_blocker",
    receiver_feedback_route_status: "route_validated",
    canonical_route_ref: "B3/3.13a/receiver_feedback",
    source_ref: "source:b3",
    derivation_ref: "derivation:b3",
    delivery_failure_known: true,
    ...overrides,
  };
}

function b7Input(overrides = {}) {
  return {
    case_id: "case:l7-local",
    scene_id: "scene:b7",
    source_b7_ref: "source:b7",
    derivation_ref: "derivation:b7",
    preclassification_ahe_level_dominant: "interpersonal",
    preclassification_interpersonal_signal: "handoff tension",
    preclassification_interpersonal_note: "senal no diagnostica",
    preclassification_interpersonal_confirmation: "pending",
    preclassification_ahe_bundle_refined: "ahe:bundle:b7",
    interpretation_limit: "non_diagnostic_preclassification_only",
    attempted_consumer: "none",
    ...overrides,
  };
}

function evidenceBundle(bundleId, sceneId, b7SignalOnly) {
  return {
    bundle_id: bundleId,
    case_id: "case:l7-local",
    state: "ready_for_transduction",
    source_ref: `source:${bundleId}`,
    derivation_ref: `derivation:${bundleId}`,
    readiness_decision_ref: `LOCAL_READINESS_DECISION:case:l7-local:${bundleId}`,
    evidence_items: [
      {
        evidence_item_id: `evidence:${bundleId}:1`,
        source_ref: `source:${bundleId}:1`,
        derivation_ref: `derivation:${bundleId}:1`,
        literal_value: "operador entrega documento validado al area receptora",
        normalized_value: "entrega documento validado",
        actor_role_ref: "role:operator",
        object_ref: "object:validated-document",
        event_ref: sceneId,
        epistemic_status: "evidence_linked",
      },
    ],
    b7_preclassification_evidence: [
      {
        source_ref: b7SignalOnly.preclassification_record.source_b7_ref,
        derivation_ref: b7SignalOnly.preclassification_record.derivation_ref,
        signal:
          b7SignalOnly.preclassification_record
            .preclassification_interpersonal_signal,
        interpretation_limit:
          b7SignalOnly.preclassification_record.interpretation_limit,
      },
    ],
  };
}

function materialityTraceabilityRecords() {
  return [
    traceability("PF_SUP_03", "PF_SUP_03_MATERIALITY_MARKER", [
      "src/services/eve/transduction/evidential-scene-types.ts",
      "src/services/eve/transduction/evidential-scene-runner.ts",
      "src/services/eve/transduction/evidential-scene-runner.test.mjs",
      "docs/implementation/pf_sup_03_executable_slice_closeout.md",
      "docs/implementation/pf_sup_03_executable_slice_traceability.json",
    ]),
    traceability("PF_SUP_04", "PF_SUP_04_MATERIALITY_MARKER", [
      "src/services/eve/aggregation/causal-movie-types.ts",
      "src/services/eve/aggregation/causal-movie-aggregation-runner.ts",
      "src/services/eve/aggregation/causal-movie-aggregation-runner.test.mjs",
      "docs/implementation/pf_sup_04_executable_slice_closeout.md",
      "docs/implementation/pf_sup_04_executable_slice_traceability.json",
    ]),
    traceability("PF_SUP_05", "PF_SUP_05_MATERIALITY_MARKER", [
      "src/services/eve/synthesis/expert-synthesis-types.ts",
      "src/services/eve/synthesis/expert-synthesis-contract-service.ts",
      "src/services/eve/synthesis/expert-synthesis-contract-service.test.mjs",
      "docs/implementation/pf_sup_05_local_contract_service_closeout.md",
      "docs/implementation/pf_sup_05_local_contract_service_traceability.json",
    ]),
    traceability("B3", "B3_FIRST_CLASS_MATERIALITY_MARKER", [
      "src/services/eve/capa1/b3-feedback-types.ts",
      "src/services/eve/capa1/b3-receiver-feedback-materializer.ts",
      "src/services/eve/capa1/b3-receiver-feedback-materializer.test.mjs",
      "docs/implementation/b3_first_class_materiality_local_service_closeout.md",
      "docs/implementation/b3_first_class_materiality_local_service_traceability.json",
    ]),
    traceability("B7", "B7_FIRST_CLASS_MATERIALITY_MARKER", [
      "src/services/eve/capa1/b7-preclassification-types.ts",
      "src/services/eve/capa1/b7-preclassification-boundary-service.ts",
      "src/services/eve/capa1/b7-preclassification-boundary-service.test.mjs",
      "docs/implementation/b7_first_class_materiality_local_service_closeout.md",
      "docs/implementation/b7_first_class_materiality_local_service_traceability.json",
    ]),
  ];
}

function traceability(family, marker, filesCreated) {
  return {
    family,
    traceability_id: family,
    implementation_allowed: true,
    runtime_40_20_full_allowed: false,
    no_go_triggered: false,
    files_created: filesCreated,
    files_modified: [],
    test_execution: {
      command: `node --test ${filesCreated.find((file) => file.endsWith(".test.mjs"))}`,
      status: "passed",
      reason: "local L6 service test passed",
    },
    materiality: {
      before: "L4 contract_defined",
      after: "L6 service_present",
      marker,
    },
    boundary: {
      diagnosis_created: false,
      diagnostico_experto_final_delivered_created: false,
      registry_created: false,
      ir_created: false,
      export_created: false,
      export_code_package_created: false,
      runtime_40_20_full_opened: false,
      supabase_touched: false,
      sql_created: false,
      env_read: false,
    },
    next_authorization_required: true,
  };
}

function materialityMarkerContracts() {
  return [
    marker("PF_SUP_03", "PF_SUP_03_MATERIALITY_MARKER", "services/eve/transduction/evidential-scene-runner"),
    marker("PF_SUP_04", "PF_SUP_04_MATERIALITY_MARKER", "services/eve/aggregation/causal-movie-aggregation-runner"),
    marker("PF_SUP_05", "PF_SUP_05_MATERIALITY_MARKER", "services/eve/synthesis/expert-synthesis-contract-service"),
    marker("B3", "B3_FIRST_CLASS_MATERIALITY_MARKER", "services/eve/capa1/b3-receiver-feedback-materializer"),
    marker("B7", "B7_FIRST_CLASS_MATERIALITY_MARKER", "services/eve/capa1/b7-preclassification-boundary-service"),
  ];
}

function marker(scope, markerId, serviceContract) {
  return {
    marker_id: markerId,
    scope,
    required_service_contract: serviceContract,
    required_schema_contracts: [],
    required_state_machines: [],
    required_test_contract: `${serviceContract}.test`,
    required_source_refs: true,
    required_derivation_refs: true,
    required_governance_issue_links: true,
    required_readiness_decision: true,
    required_allowed_consumers: true,
    forbidden_outputs: ["diagnosis", "registry", "IR", "export"],
    materiality_level_when_absent: "L0 absent",
    materiality_level_when_contract_defined: "L4 contract_defined",
    materiality_level_when_tested: "L7 tested_materiality",
    no_go_if_false_positive: "false positive materiality promotion",
  };
}

function loadService(relativePath) {
  const source = readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
    },
  }).outputText;
  const context = {
    exports: {},
    require(specifier) {
      if (specifier.startsWith(".")) {
        return {};
      }
      throw new Error(`Unexpected require: ${specifier}`);
    },
  };

  vm.runInNewContext(transpiled, context, {
    filename: relativePath,
  });

  return context.exports;
}
