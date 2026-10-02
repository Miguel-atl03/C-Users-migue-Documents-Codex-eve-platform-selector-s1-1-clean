import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const orchestrator = loadModule("./l8-local-pf-chain-handoff-orchestrator.ts");

test("executes full local PF chain as L8 local executable materiality", () => {
  const result = orchestrator.runL8LocalPfChainHandoff(validInput());

  assert.equal(result.ok, true);
  assert.equal(result.final_state, "l8_local_executable_materiality");
  assert.equal(result.materiality.after, "L8 executable_materiality");
  assert.equal(result.materiality.local_only, true);
  assert.equal(result.materiality.production_integration, false);
  assert.equal(result.materiality.runtime_40_20_full_opened, false);
  assert.equal(
    JSON.stringify(result.stages.map((stage) => stage.stage)),
    JSON.stringify([
      "B3",
      "B7",
      "PF_SUP_03",
      "PF_SUP_04",
      "PF_SUP_05",
      "MATERIALITY_EVALUATOR",
    ]),
  );
  assert.ok(
    result.handoff_chain.some(
      (handoff) =>
        handoff.from_stage === "PF_SUP_03" &&
        handoff.to_stage === "PF_SUP_04" &&
        handoff.allowed,
    ),
  );
  assert.ok(
    result.handoff_chain.some(
      (handoff) =>
        handoff.from_stage === "PF_SUP_04" &&
        handoff.to_stage === "PF_SUP_05" &&
        handoff.allowed,
    ),
  );
});

test("produces validated EscenaEvidencial before PF-SUP-04 handoff", () => {
  const result = orchestrator.runL8LocalPfChainHandoff(validInput());
  const stage = stageFor(result, "PF_SUP_03");

  assert.equal(stage.ok, true);
  assert.equal(stage.handoff_allowed, true);
  assert.equal(stage.produced_refs.length, 2);
  assert.ok(stage.produced_refs.every((ref) => ref.startsWith("ESCENA_EVIDENCIAL:")));
});

test("produces aggregated PeliculaCausalAgregada before PF-SUP-05 handoff", () => {
  const result = orchestrator.runL8LocalPfChainHandoff(validInput());
  const stage = stageFor(result, "PF_SUP_04");

  assert.equal(stage.ok, true);
  assert.equal(stage.handoff_allowed, true);
  assert.ok(stage.produced_refs[0].startsWith("PELICULA_CAUSAL_AGREGADA:"));
});

test("produces SynthesisCase ready_for_expert_draft with DeliveryBoundary delivery_blocked", () => {
  const result = orchestrator.runL8LocalPfChainHandoff(validInput());
  const stage = stageFor(result, "PF_SUP_05");

  assert.equal(stage.ok, true);
  assert.equal(stage.handoff_allowed, true);
  assert.ok(stage.produced_refs[0].startsWith("SYNTHESIS_CASE:"));
  assert.equal(result.no_go.delivery_authorized, false);
  assert.equal(result.no_go.delivered_created, false);
});

test("preserves B3 and B7 boundaries", () => {
  const result = orchestrator.runL8LocalPfChainHandoff(validInput());

  assert.equal(result.no_go.diagnosis_created, false);
  assert.equal(result.no_go.registry_created, false);
  assert.equal(result.no_go.ir_created, false);
  assert.equal(result.no_go.export_created, false);
  assert.equal(result.no_go.delivered_created, false);
  assert.equal(result.no_go.delivery_authorized, false);
  assert.equal(stageFor(result, "B3").ok, true);
  assert.equal(stageFor(result, "B7").ok, true);
});

test("blocks handoff if PF-SUP-03 has no validated scene", () => {
  const input = validInput({
    evidence_bundles: [evidenceBundle("bundle:draft", "scene:draft", "draft")],
    options: { minimum_validated_scenes: 1 },
  });
  const result = orchestrator.runL8LocalPfChainHandoff(input);
  const stage = stageFor(result, "PF_SUP_03");

  assert.equal(result.ok, false);
  assert.equal(result.final_state, "blocked_by_stage_failure");
  assert.equal(stage.ok, false);
  assert.equal(stage.handoff_allowed, false);
  assert.equal(stage.blocked_reason, "pf_sup_03_no_validated_scene_handoff");
});

test("blocks handoff if PF-SUP-04 has insufficient scenes", () => {
  const input = validInput({
    evidence_bundles: [evidenceBundle("bundle:one", "scene:one")],
  });
  const result = orchestrator.runL8LocalPfChainHandoff(input);
  const stage = stageFor(result, "PF_SUP_04");

  assert.equal(result.ok, false);
  assert.equal(result.final_state, "blocked_by_stage_failure");
  assert.equal(stage.ok, false);
  assert.equal(stage.handoff_allowed, false);
  assert.equal(stage.blocked_reason, "insufficient_scenes_rework_to_pf_sup_03");
});

test("blocks final state if PF-SUP-05 receives non-aggregated movie", () => {
  const input = validInput({
    options: {
      minimum_validated_scenes: 2,
      force_non_aggregated_movie_for_local_test: true,
    },
  });
  const result = orchestrator.runL8LocalPfChainHandoff(input);
  const stage = stageFor(result, "PF_SUP_05");

  assert.equal(result.ok, false);
  assert.equal(result.final_state, "blocked_by_stage_failure");
  assert.equal(stage.ok, false);
  assert.equal(stage.handoff_allowed, false);
  assert.equal(stage.blocked_reason, "non_aggregated_movie");
});

test("keeps global No-Go false", () => {
  const result = orchestrator.runL8LocalPfChainHandoff(validInput());

  assert.equal(result.no_go.runtime_40_20_full_opened, false);
  assert.equal(result.no_go.diagnosis_created, false);
  assert.equal(result.no_go.registry_created, false);
  assert.equal(result.no_go.ir_created, false);
  assert.equal(result.no_go.export_created, false);
  assert.equal(result.no_go.delivered_created, false);
  assert.equal(result.no_go.delivery_authorized, false);
  assert.equal(result.no_go.supabase_touched, false);
  assert.equal(result.no_go.sql_created, false);
  assert.equal(result.no_go.env_read, false);
});

test("declares not production integration and does not modify existing services", () => {
  const result = orchestrator.runL8LocalPfChainHandoff(validInput());

  assert.equal(result.materiality.production_integration, false);
  assert.equal(result.next_authorization_required, true);
  assert.equal(result.handoff_chain.length, 5);
});

function validInput(overrides = {}) {
  return {
    case_id: "case:l8-local",
    b3_inputs: [b3Input()],
    b7_inputs: [b7Input()],
    evidence_bundles: [
      evidenceBundle("bundle:a", "scene:a"),
      evidenceBundle("bundle:b", "scene:b"),
    ],
    materiality_traceability_records: materialityTraceabilityRecords(),
    materiality_marker_contracts: materialityMarkerContracts(),
    options: { minimum_validated_scenes: 2 },
    ...overrides,
  };
}

function b3Input(overrides = {}) {
  return {
    case_id: "case:l8-local",
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
    case_id: "case:l8-local",
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

function evidenceBundle(bundleId, sceneId, state = "ready_for_transduction") {
  return {
    bundle_id: bundleId,
    case_id: "case:l8-local",
    state,
    source_ref: `source:${bundleId}`,
    derivation_ref: `derivation:${bundleId}`,
    readiness_decision_ref: `LOCAL_READINESS_DECISION:case:l8-local:${bundleId}`,
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
        source_ref: "source:b7",
        derivation_ref: "derivation:b7",
        signal: "handoff tension",
        interpretation_limit: "non_diagnostic_preclassification_only",
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

function stageFor(result, stage) {
  return result.stages.find((candidate) => candidate.stage === stage);
}

function loadModule(relativePath) {
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
      const dependency = dependencyPath(specifier);
      return dependency ? loadModule(dependency) : {};
    },
  };

  vm.runInNewContext(transpiled, context, { filename: relativePath });
  return context.exports;
}

function dependencyPath(specifier) {
  return {
    "../capa1/b3-receiver-feedback-materializer":
      "../capa1/b3-receiver-feedback-materializer.ts",
    "../capa1/b7-preclassification-boundary-service":
      "../capa1/b7-preclassification-boundary-service.ts",
    "../aggregation/causal-movie-aggregation-runner":
      "../aggregation/causal-movie-aggregation-runner.ts",
    "../synthesis/expert-synthesis-contract-service":
      "../synthesis/expert-synthesis-contract-service.ts",
    "../transduction/evidential-scene-runner":
      "../transduction/evidential-scene-runner.ts",
    "./materiality-marker-evaluator": "./materiality-marker-evaluator.ts",
  }[specifier];
}
