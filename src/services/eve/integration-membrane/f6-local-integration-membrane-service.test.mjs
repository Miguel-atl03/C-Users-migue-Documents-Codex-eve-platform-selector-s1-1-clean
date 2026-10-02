import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const service = loadService();

test("creates local outbox when L8 and F5C local results are valid", () => {
  const result = run();

  assert.equal(result.ok, true);
  assert.equal(result.outbox.allowed_to_leave_membrane, true);
  assert.equal(result.outbox.target_consumer, "future_parallel_production_candidate");
  assert.equal(result.outbox.state, "handoff_ready_local");
});

test("creates local snapshot with binding/materialization counts", () => {
  const result = run();

  assert.equal(result.snapshot.local_only, true);
  assert.equal(result.snapshot.bindings_count, 3);
  assert.equal(result.snapshot.materialization_events_count, 2);
  assert.equal(result.snapshot.binding_blocks_count, 0);
  assert.equal(result.snapshot.state, "created");
});

test("creates local handoff boundary decision", () => {
  const result = run();

  assert.equal(
    result.handoff_boundary_decision.decision,
    "local_handoff_ready",
  );
  assert.ok(
    result.handoff_boundary_decision.blocked_consumers.includes("export"),
  );
  assert.ok(
    result.handoff_boundary_decision.blocked_consumers.includes(
      "production_integration",
    ),
  );
});

test("creates export boundary check with export_allowed=false", () => {
  const result = run();

  assert.equal(result.export_boundary_check.export_allowed, false);
  assert.equal(result.export_boundary_check.export_code_package_created, false);
  assert.ok(
    result.export_boundary_check.blocked_targets.includes("ExportCodePackage"),
  );
});

test("creates review control record", () => {
  const result = run();

  assert.equal(result.review_control_record.review_required, false);
  assert.equal(result.review_control_record.state, "not_required");
});

test("creates summary-only projection", () => {
  const result = run();

  assert.equal(result.membrane_projection_summary.summary_only, true);
  assert.equal(
    result.membrane_projection_summary.l8_local_materiality_confirmed,
    true,
  );
  assert.equal(
    result.membrane_projection_summary.f5c_local_binding_confirmed,
    true,
  );
  assert.equal(result.membrane_projection_summary.export_allowed, false);
  assert.equal(result.membrane_projection_summary.diagnosis_allowed, false);
  assert.equal(
    result.membrane_projection_summary.production_integration_allowed,
    false,
  );
});

test("blocks handoff if L8 result is not ok", () => {
  const l8 = l8Result();
  l8.ok = false;
  const result = run({ l8_result: l8 });

  assert.equal(result.ok, false);
  assert.equal(result.outbox.allowed_to_leave_membrane, false);
  assert.equal(result.handoff_boundary_decision.decision, "handoff_blocked");
  assert.equal(result.blocked_reason, "l8_result_not_accepted");
});

test("blocks handoff if F5C result is not ok", () => {
  const f5c = f5cResult();
  f5c.ok = false;
  const result = run({ f5c_result: f5c });

  assert.equal(result.ok, false);
  assert.equal(result.outbox.allowed_to_leave_membrane, false);
  assert.equal(result.handoff_boundary_decision.decision, "handoff_blocked");
  assert.equal(result.blocked_reason, "f5c_result_not_accepted");
});

test("sets review_required=true when binding_blocks exist", () => {
  const f5c = f5cResult();
  f5c.binding_blocks = [
    {
      binding_id: "F5C_BLOCK:B7",
      source_stage: "B7",
      source_ref: "B7_DIAGNOSTIC_BLOCK",
      object_definition_ref: "PreclassificationRecord",
      object_state: "blocked",
      binding_status: "blocked",
      binding_authority: "review_control",
      binding_confidence: "high",
      blocks_handoff: true,
      allowed_consumers: ["none"],
      contamination_risk: "b7_to_diagnostic",
      reason: "blocked",
      governance_issue_refs: ["F5C_LOCAL_B7_TO_DIAGNOSTIC_BLOCK"],
    },
  ];
  const result = run({ f5c_result: f5c });

  assert.equal(result.ok, true);
  assert.equal(result.review_control_record.review_required, true);
  assert.equal(
    result.handoff_boundary_decision.decision,
    "local_handoff_ready_with_restrictions",
  );
});

test("keeps export_code_package_created=false", () => {
  const result = run();

  assert.equal(result.export_boundary_check.export_code_package_created, false);
});

test("keeps diagnosis, registry, IR, export and Delivered false", () => {
  const result = run();

  assert.equal(result.no_go.diagnosis_created, false);
  assert.equal(result.no_go.registry_created, false);
  assert.equal(result.no_go.ir_created, false);
  assert.equal(result.no_go.export_created, false);
  assert.equal(result.no_go.delivered_created, false);
  assert.equal(result.no_go.delivery_authorized, false);
});

test("keeps Runtime, Object Inventory, F5C, Membrane, Production, Control Plane and SG Shadow real closed", () => {
  const result = run();

  assert.equal(result.no_go.runtime_40_20_full_opened, false);
  assert.equal(result.no_go.object_inventory_real_opened, false);
  assert.equal(result.no_go.f5c_real_opened, false);
  assert.equal(result.no_go.integration_membrane_real_opened, false);
  assert.equal(result.no_go.production_integration_opened, false);
  assert.equal(result.no_go.control_plane_real_opened, false);
  assert.equal(result.no_go.sg_shadow_real_opened, false);
});

test("keeps Supabase, SQL and env false", () => {
  const result = run();

  assert.equal(result.no_go.supabase_touched, false);
  assert.equal(result.no_go.sql_created, false);
  assert.equal(result.no_go.env_read, false);
});

test("does not modify existing services", () => {
  const result = run();

  assert.equal(result.materiality.local_only, true);
  assert.equal(result.materiality.production_integration, false);
  assert.equal(result.materiality.next_authorization_required, true);
});

function run(overrides = {}) {
  return service.runF6LocalIntegrationMembrane({
    case_id: "case:f6",
    l8_result: l8Result(),
    f5c_result: f5cResult(),
    ...overrides,
  });
}

function l8Result() {
  return {
    ok: true,
    case_id: "case:f6",
    stages: [
      {
        stage: "PF_SUP_05",
        ok: true,
        handoff_allowed: true,
        produced_refs: ["SYNTHESIS_CASE:case:f6"],
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
  };
}

function f5cResult() {
  return {
    ok: true,
    case_id: "case:f6",
    bindings: [
      binding("B3_BINDING", "ReceiverFeedbackObject"),
      binding("B7_BINDING", "PreclassificationRecord"),
      binding("PF05_BINDING", "SynthesisCase"),
    ],
    materialization_events: [
      event("B3_BINDING", "ReceiverFeedbackObject"),
      event("PF05_BINDING", "SynthesisCase"),
    ],
    binding_blocks: [],
    deferred_bindings: [],
    review_required: [],
    governance_issue_refs: [],
    no_go: {
      object_inventory_real_opened: false,
      f5c_real_opened: false,
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
    materiality: {
      level: "f5c_local_binding_readiness",
      local_only: true,
      production_integration: false,
      object_inventory_real_opened: false,
      f5c_real_opened: false,
      next_authorization_required: true,
    },
  };
}

function binding(id, objectDefinitionRef) {
  return {
    binding_id: id,
    source_stage: "PF_SUP_05",
    source_ref: id,
    object_definition_ref: objectDefinitionRef,
    object_state: "materialized",
    binding_status: "materialized",
    binding_authority: "local_binding_service",
    binding_confidence: "high",
    blocks_handoff: false,
    allowed_consumers: ["control_plane_summary"],
    contamination_risk: "none",
    reason: "fixture",
    governance_issue_refs: [],
  };
}

function event(bindingId, objectDefinitionRef) {
  return {
    materialization_event_id: `EVENT:${bindingId}`,
    binding_id: bindingId,
    object_definition_ref: objectDefinitionRef,
    event_type: "created_or_touched",
    source_stage: "PF_SUP_05",
    audit_log: [],
  };
}

function loadService() {
  const source = readFileSync(
    new URL("./f6-local-integration-membrane-service.ts", import.meta.url),
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
      if (specifier === "./f6-local-integration-membrane-types") {
        return {};
      }
      throw new Error(`Unexpected require: ${specifier}`);
    },
  };

  vm.runInNewContext(transpiled, context, {
    filename: "f6-local-integration-membrane-service.ts",
  });

  return context.exports;
}
