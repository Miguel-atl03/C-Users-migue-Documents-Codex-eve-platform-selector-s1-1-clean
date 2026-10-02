import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const service = loadService();

test("creates materialized bindings for L8 local outputs", () => {
  const result = bind();

  assertBinding(result, "ReceiverFeedbackObject");
  assertBinding(result, "OperationalExceptionEvidence");
  assertBinding(result, "PreclassificationRecord");
  assertBinding(result, "NoRenderZone");
  assertBinding(result, "EscenaEvidencial");
  assertBinding(result, "ActoObservable");
  assertBinding(result, "SceneSet");
  assertBinding(result, "AggregationIndex");
  assertBinding(result, "PeliculaCausalAgregada");
  assertBinding(result, "SynthesisCase");
  assertBinding(result, "DeliveryBoundary");
  assertBinding(result, "MaterialityMarkerEvaluation");
});

test("creates materialization events for materialized bindings", () => {
  const result = bind();
  const materializedCount = result.bindings.filter(
    (binding) => binding.binding_status === "materialized",
  ).length;

  assert.equal(result.materialization_events.length, materializedCount);
  assert.ok(
    result.materialization_events.every(
      (event) => event.event_type === "created_or_touched",
    ),
  );
});

test("blocks satisfaction_to_feedback contamination", () => {
  const result = bind({
    governance_issue_refs: ["RUNTIME_B3_SATISFACTION_TO_FEEDBACK_ATTEMPT"],
  });
  const block = result.binding_blocks.find(
    (binding) => binding.contamination_risk === "satisfaction_to_feedback",
  );

  assert.equal(result.ok, false);
  assert.equal(block.object_definition_ref, "ReceiverFeedbackObject");
  assert.equal(block.blocks_handoff, true);
});

test("blocks B7_to_diagnostic contamination", () => {
  const result = bind({
    governance_issue_refs: ["B7_BOUNDARY_CONTAMINATION_DIAGNOSIS"],
  });
  const block = result.binding_blocks.find(
    (binding) => binding.contamination_risk === "b7_to_diagnostic",
  );

  assert.equal(result.ok, false);
  assert.equal(block.object_definition_ref, "PreclassificationRecord");
  assert.equal(block.blocks_handoff, true);
});

test("blocks delivery_authorized boundary violation", () => {
  const bridge = bridgeResult();
  bridge.no_go.delivery_authorized = true;
  const result = service.runF5CLocalRuntimeObjectBinding({
    case_id: "case:f5c",
    runtime_bridge_result: bridge,
  });
  const block = result.binding_blocks.find(
    (binding) => binding.contamination_risk === "delivery_boundary_violation",
  );

  assert.equal(result.ok, false);
  assert.equal(block.object_definition_ref, "DeliveryBoundary");
  assert.equal(block.blocks_handoff, true);
});

test("supports deferred bindings and review_required", () => {
  const bridge = bridgeResult();
  bridge.handoffs = [
    {
      from: "RuntimeLikeEntity",
      to: "EvidenceBundle",
      source_runtime_entity_ids: [],
      allowed: false,
      blocked_reason: "missing_object_ref",
    },
  ];
  const result = service.runF5CLocalRuntimeObjectBinding({
    case_id: "case:f5c",
    runtime_bridge_result: bridge,
  });

  assert.ok(result.deferred_bindings.length >= 1);
  assert.ok(result.review_required.length >= 1);
});

test("keeps Object Inventory real, F5C real and Runtime 40/20 full closed", () => {
  const result = bind();

  assert.equal(result.no_go.object_inventory_real_opened, false);
  assert.equal(result.no_go.f5c_real_opened, false);
  assert.equal(result.no_go.runtime_40_20_full_opened, false);
  assert.equal(result.materiality.object_inventory_real_opened, false);
  assert.equal(result.materiality.f5c_real_opened, false);
});

test("keeps diagnosis, registry, IR, export and Delivered false", () => {
  const result = bind();

  assert.equal(result.no_go.diagnosis_created, false);
  assert.equal(result.no_go.registry_created, false);
  assert.equal(result.no_go.ir_created, false);
  assert.equal(result.no_go.export_created, false);
  assert.equal(result.no_go.delivered_created, false);
  assert.equal(result.no_go.delivery_authorized, false);
});

test("keeps Supabase, SQL and env false", () => {
  const result = bind();

  assert.equal(result.no_go.supabase_touched, false);
  assert.equal(result.no_go.sql_created, false);
  assert.equal(result.no_go.env_read, false);
});

test("does not modify existing services", () => {
  const result = bind();

  assert.equal(result.materiality.local_only, true);
  assert.equal(result.materiality.production_integration, false);
  assert.equal(result.materiality.next_authorization_required, true);
});

function bind(overrides = {}) {
  return service.runF5CLocalRuntimeObjectBinding({
    case_id: "case:f5c",
    runtime_bridge_result: {
      ...bridgeResult(),
      ...overrides,
    },
  });
}

function assertBinding(result, objectDefinitionRef) {
  const binding = result.bindings.find(
    (candidate) =>
      candidate.object_definition_ref === objectDefinitionRef &&
      candidate.binding_status === "materialized",
  );

  assert.ok(binding, `Missing materialized binding ${objectDefinitionRef}`);
  assert.equal(binding.blocks_handoff, false);
  assert.equal(binding.contamination_risk, "none");
}

function bridgeResult() {
  return {
    ok: true,
    case_id: "case:f5c",
    handoffs: [
      {
        from: "RuntimeLikeEntity",
        to: "B3",
        source_runtime_entity_ids: ["runtime:b3"],
        allowed: true,
      },
      {
        from: "RuntimeLikeEntity",
        to: "B7",
        source_runtime_entity_ids: ["runtime:b7"],
        allowed: true,
      },
      {
        from: "RuntimeLikeEntity",
        to: "EvidenceBundle",
        source_runtime_entity_ids: ["runtime:evidence:1", "runtime:evidence:2"],
        allowed: true,
      },
      {
        from: "RuntimeLikeEntity",
        to: "L8LocalPfChainHandoff",
        source_runtime_entity_ids: ["runtime:b3", "runtime:b7"],
        allowed: true,
      },
    ],
    l8_result: {
      ok: true,
      case_id: "case:f5c",
      stages: [
        {
          stage: "B3",
          ok: true,
          handoff_allowed: true,
          produced_refs: ["B3_RECEIVER_FEEDBACK:case:f5c:scene:b3"],
          governance_issue_refs: [],
        },
        {
          stage: "B7",
          ok: true,
          handoff_allowed: true,
          produced_refs: ["B7_PRECLASSIFICATION:case:f5c:scene:b7"],
          governance_issue_refs: [],
        },
        {
          stage: "PF_SUP_03",
          ok: true,
          handoff_allowed: true,
          produced_refs: [
            "ESCENA_EVIDENCIAL:RUNTIME_BRIDGE_BUNDLE:runtime:evidence:1",
            "ESCENA_EVIDENCIAL:RUNTIME_BRIDGE_BUNDLE:runtime:evidence:2",
          ],
          governance_issue_refs: [],
        },
        {
          stage: "PF_SUP_04",
          ok: true,
          handoff_allowed: true,
          produced_refs: ["PELICULA_CAUSAL_AGREGADA:case:f5c"],
          governance_issue_refs: [],
        },
        {
          stage: "PF_SUP_05",
          ok: true,
          handoff_allowed: true,
          produced_refs: [
            "SYNTHESIS_CASE:PELICULA_CAUSAL_AGREGADA:case:f5c",
          ],
          governance_issue_refs: [],
        },
        {
          stage: "MATERIALITY_EVALUATOR",
          ok: true,
          handoff_allowed: true,
          produced_refs: ["MATERIALITY_EVALUATOR:case:f5c"],
          governance_issue_refs: [],
        },
      ],
      handoff_chain: [],
      final_state: "l8_local_executable_materiality",
      materiality: {
        before: "L7 tested_materiality",
        after: "L8 executable_materiality",
        local_only: true,
        runtime_40_20_full_opened: false,
        production_integration: false,
      },
      no_go: {
        runtime_40_20_full_opened: false,
        diagnosis_created: false,
        registry_created: false,
        ir_created: false,
        export_created: false,
        delivered_created: false,
        delivery_authorized: false,
        supabase_touched: false,
        sql_created: false,
        env_read: false,
      },
      next_authorization_required: true,
    },
    governance_issue_refs: [],
    no_go: {
      runtime_40_20_full_opened: false,
      object_inventory_real_opened: false,
      f5c_real_opened: false,
      diagnosis_created: false,
      registry_created: false,
      ir_created: false,
      export_created: false,
      delivered_created: false,
      delivery_authorized: false,
      supabase_touched: false,
      sql_created: false,
      env_read: false,
    },
    materiality: {
      level: "runtime_bridge_local_readiness",
      consumes_l8_local_chain: true,
      production_integration: false,
      runtime_40_20_full_opened: false,
      next_authorization_required: true,
    },
  };
}

function loadService() {
  const source = readFileSync(
    new URL("./f5c-local-runtime-object-binding-service.ts", import.meta.url),
    "utf8",
  );
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
      if (specifier === "./f5c-local-binding-types") {
        return {};
      }
      throw new Error(`Unexpected require: ${specifier}`);
    },
  };

  vm.runInNewContext(transpiled, context, {
    filename: "f5c-local-runtime-object-binding-service.ts",
  });

  return context.exports;
}
