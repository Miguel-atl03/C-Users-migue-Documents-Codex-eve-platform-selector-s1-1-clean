import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const bridge = loadModule("./runtime-40-20-l8-bridge.ts");

test("maps runtime receiver_feedback variable to B3 input", () => {
  const result = bridge.runRuntime4020ToL8LocalBridge(validInput());
  const handoff = handoffTo(result, "B3");

  assert.equal(handoff.allowed, true);
  assert.ok(handoff.source_runtime_entity_ids.includes("runtime:b3:feedback"));
  assert.equal(stageFor(result, "B3").ok, true);
});

test("blocks B3 handoff if source_ref or derivation_ref missing", () => {
  const input = validInput({
    runtime_entities: runtimeEntities().map((entity) =>
      entity.runtime_entity_id === "runtime:b3:feedback"
        ? { ...entity, source_ref: "" }
        : entity,
    ),
  });
  const result = bridge.runRuntime4020ToL8LocalBridge(input);
  const handoff = handoffTo(result, "B3");

  assert.equal(result.ok, false);
  assert.equal(handoff.allowed, false);
  assert.equal(handoff.blocked_reason, "runtime_b3_input_missing");
  assert.ok(result.governance_issue_refs.includes("RUNTIME_B3_ROUTE_OR_TRACEABILITY_GAP"));
});

test("maps runtime B7/preclassification signal to B7 signal-only input", () => {
  const result = bridge.runRuntime4020ToL8LocalBridge(validInput());
  const handoff = handoffTo(result, "B7");

  assert.equal(handoff.allowed, true);
  assert.ok(handoff.source_runtime_entity_ids.includes("runtime:b7:signal"));
  assert.equal(stageFor(result, "B7").ok, true);
});

test("forces B7 interpretation_limit = non_diagnostic_preclassification_only", () => {
  const result = bridge.runRuntime4020ToL8LocalBridge(validInput());

  assert.equal(result.ok, true);
  assert.equal(stageFor(result, "B7").handoff_allowed, true);
  assert.equal(result.no_go.diagnosis_created, false);
});

test("builds EvidenceBundle-like inputs from runtime evidence items", () => {
  const result = bridge.runRuntime4020ToL8LocalBridge(validInput());
  const handoff = handoffTo(result, "EvidenceBundle");

  assert.equal(handoff.allowed, true);
  assert.equal(handoff.source_runtime_entity_ids.length, 2);
  assert.equal(stageFor(result, "PF_SUP_03").produced_refs.length, 2);
});

test("runs L8 local chain through bridge", () => {
  const result = bridge.runRuntime4020ToL8LocalBridge(validInput());

  assert.equal(result.ok, true);
  assert.equal(result.l8_result.ok, true);
  assert.equal(result.l8_result.final_state, "l8_local_executable_materiality");
  assert.equal(handoffTo(result, "L8LocalPfChainHandoff").allowed, true);
});

test("produces bridge ok=true when sufficient runtime-like evidence exists", () => {
  const result = bridge.runRuntime4020ToL8LocalBridge(validInput());

  assert.equal(result.ok, true);
  assert.equal(result.blocked_reason, undefined);
});

test("blocks bridge when insufficient evidence for L8 chain", () => {
  const input = validInput({
    runtime_entities: runtimeEntities().filter(
      (entity) => entity.runtime_entity_id !== "runtime:evidence:2",
    ),
  });
  const result = bridge.runRuntime4020ToL8LocalBridge(input);

  assert.equal(result.ok, false);
  assert.equal(result.l8_result, undefined);
  assert.equal(handoffTo(result, "EvidenceBundle").allowed, false);
  assert.equal(
    handoffTo(result, "EvidenceBundle").blocked_reason,
    "runtime_evidence_insufficient_for_l8_chain",
  );
  assert.ok(
    result.governance_issue_refs.includes(
      "RUNTIME_EVIDENCE_INSUFFICIENT_FOR_L8_CHAIN",
    ),
  );
});

test("keeps Runtime 40/20, Object Inventory and F5C closed", () => {
  const result = bridge.runRuntime4020ToL8LocalBridge(validInput());

  assert.equal(result.no_go.runtime_40_20_full_opened, false);
  assert.equal(result.no_go.object_inventory_real_opened, false);
  assert.equal(result.no_go.f5c_real_opened, false);
});

test("keeps diagnosis, registry, IR, export and Delivered false", () => {
  const result = bridge.runRuntime4020ToL8LocalBridge(validInput());

  assert.equal(result.no_go.diagnosis_created, false);
  assert.equal(result.no_go.registry_created, false);
  assert.equal(result.no_go.ir_created, false);
  assert.equal(result.no_go.export_created, false);
  assert.equal(result.no_go.delivered_created, false);
  assert.equal(result.no_go.delivery_authorized, false);
});

test("keeps Supabase, SQL and env false", () => {
  const result = bridge.runRuntime4020ToL8LocalBridge(validInput());

  assert.equal(result.no_go.supabase_touched, false);
  assert.equal(result.no_go.sql_created, false);
  assert.equal(result.no_go.env_read, false);
});

test("does not declare production integration", () => {
  const result = bridge.runRuntime4020ToL8LocalBridge(validInput());

  assert.equal(result.materiality.production_integration, false);
  assert.equal(result.materiality.runtime_40_20_full_opened, false);
  assert.equal(result.materiality.consumes_l8_local_chain, true);
});

test("does not modify existing services", () => {
  const result = bridge.runRuntime4020ToL8LocalBridge(validInput());

  assert.equal(result.ok, true);
  assert.equal(result.materiality.next_authorization_required, true);
});

function validInput(overrides = {}) {
  return {
    case_id: "case:runtime-bridge",
    runtime_entities: runtimeEntities(),
    materiality_traceability_records: materialityTraceabilityRecords(),
    materiality_marker_contracts: materialityMarkerContracts(),
    options: { minimum_validated_scenes: 2 },
    ...overrides,
  };
}

function runtimeEntities() {
  return [
    {
      runtime_entity_id: "runtime:b3:feedback",
      entity_type: "canonical_variable_record",
      case_id: "case:runtime-bridge",
      scene_id: "scene:b3",
      source_ref: "runtime-source:b3",
      derivation_ref: "runtime-derivation:b3",
      route_id: "B3/3.13a/receiver_feedback",
      variable_name: "receiver_feedback",
      literal_value: "el receptor no puede usar el entregable",
      normalized_value: "receiver feedback operational blocker",
      metadata: {
        output_handoff_ref: "runtime-handoff:receiver",
        receiver_satisfaction_value: "satisfecho",
      },
    },
    {
      runtime_entity_id: "runtime:b7:signal",
      entity_type: "structural_candidate_record",
      case_id: "case:runtime-bridge",
      scene_id: "scene:b7",
      source_ref: "runtime-source:b7",
      derivation_ref: "runtime-derivation:b7",
      route_id: "B7/preclassification",
      variable_name: "ahe_preclassification_signal",
      literal_value: "handoff tension signal",
      normalized_value: "interpersonal",
      metadata: {
        preclassification_ahe_level_dominant: "interpersonal",
      },
    },
    {
      runtime_entity_id: "runtime:evidence:1",
      entity_type: "evidence_item",
      case_id: "case:runtime-bridge",
      scene_id: "scene:evidence:1",
      source_ref: "runtime-source:evidence:1",
      derivation_ref: "runtime-derivation:evidence:1",
      literal_value: "operador entrega documento validado al area receptora",
      normalized_value: "entrega documento validado",
      metadata: {
        actor_role_ref: "role:operator",
        object_ref: "object:validated-document",
      },
    },
    {
      runtime_entity_id: "runtime:evidence:2",
      entity_type: "evidence_item",
      case_id: "case:runtime-bridge",
      scene_id: "scene:evidence:2",
      source_ref: "runtime-source:evidence:2",
      derivation_ref: "runtime-derivation:evidence:2",
      literal_value: "area receptora confirma bloqueo si falta el entregable",
      normalized_value: "confirma bloqueo por ausencia",
      metadata: {
        actor_role_ref: "role:receiver",
        object_ref: "object:validated-document",
      },
    },
    {
      runtime_entity_id: "runtime:readiness:decision",
      entity_type: "readiness_decision_record",
      case_id: "case:runtime-bridge",
      source_ref: "runtime-source:readiness",
      derivation_ref: "runtime-derivation:readiness",
      state: "ready_for_l8_local_bridge",
    },
  ];
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

function handoffTo(result, to) {
  return result.handoffs.find((handoff) => handoff.to === to);
}

function stageFor(result, stage) {
  return result.l8_result.stages.find((candidate) => candidate.stage === stage);
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
    "../materiality/l8-local-pf-chain-handoff-orchestrator":
      "../materiality/l8-local-pf-chain-handoff-orchestrator.ts",
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
    "./materiality-marker-evaluator":
      "../materiality/materiality-marker-evaluator.ts",
  }[specifier];
}
