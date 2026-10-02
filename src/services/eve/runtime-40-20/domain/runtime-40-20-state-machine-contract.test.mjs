import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const guards = loadModule("runtime-40-20-state-machine-guards.ts", {
  "./runtime-40-20-domain-state-types": {},
});
const contract = loadModule("runtime-40-20-state-machine-contract.ts", {
  "./runtime-40-20-domain-state-types": {},
  "./runtime-40-20-state-machine-guards": guards,
});

test("creates state machine contract from execution_core_schema_ready=true", () => {
  assert.equal(run().ok, true);
});

test("includes all role runtime session states", () => {
  assert.deepEqual(list(run().role_runtime_session_states), [
    "draft",
    "active",
    "in_progress",
    "ready_with_flags",
    "completed",
    "blocked",
    "archived",
  ]);
});

test("includes all activity runtime run states", () => {
  assert.deepEqual(list(run().activity_runtime_run_states), [
    "initialized",
    "semantic_preload_loaded",
    "b0_confirmation_pending",
    "active_base_capture",
    "base_complete",
    "causal_evaluation_pending",
    "active_causal_capture",
    "readiness_evaluation",
    "ready",
    "ready_with_flags",
    "blocked",
    "reentry_required",
    "manual_review_required",
    "exported_to_parallel_production",
    "archived",
  ]);
});

test("includes all interaction instance states", () => {
  assert.deepEqual(list(run().runtime_interaction_instance_states), [
    "pending",
    "shown",
    "answered",
    "confirmed",
    "corrected",
    "inferred_unconfirmed",
    "skipped_by_rule",
    "closed_by_other",
    "blocked",
    "reopened",
  ]);
});

test("allows initialized -> semantic_preload_loaded", () => {
  assert.equal(
    guards.canTransitionActivityRun("initialized", "semantic_preload_loaded"),
    true,
  );
});

test("allows semantic_preload_loaded -> b0_confirmation_pending", () => {
  assert.equal(
    guards.canTransitionActivityRun("semantic_preload_loaded", "b0_confirmation_pending"),
    true,
  );
});

test("allows b0_confirmation_pending -> active_base_capture", () => {
  assert.equal(
    guards.canTransitionActivityRun("b0_confirmation_pending", "active_base_capture"),
    true,
  );
});

test("blocks archived -> active_base_capture", () => {
  assert.equal(
    guards.canTransitionActivityRun("archived", "active_base_capture"),
    false,
  );
});

test("allows pending -> shown", () => {
  assert.equal(guards.canTransitionInteractionInstance("pending", "shown"), true);
});

test("allows answered -> confirmed", () => {
  assert.equal(
    guards.canTransitionInteractionInstance("answered", "confirmed"),
    true,
  );
});

test("blocks confirmed -> pending", () => {
  assert.equal(
    guards.canTransitionInteractionInstance("confirmed", "pending"),
    false,
  );
});

test("validates base_visible_count <= 40", () => {
  assert.equal(
    guards.validateBudget4020({ base_visible_count: 40, causal_visible_count: 0 }).ok,
    true,
  );
});

test("blocks base_visible_count > 40", () => {
  const result = guards.validateBudget4020({
    base_visible_count: 41,
    causal_visible_count: 0,
  });

  assert.equal(result.ok, false);
  assert.ok(result.blockers.includes("base_visible_count_exceeds_40"));
});

test("validates causal_visible_count <= 20", () => {
  assert.equal(
    guards.validateBudget4020({ base_visible_count: 0, causal_visible_count: 20 }).ok,
    true,
  );
});

test("blocks causal_visible_count > 20", () => {
  const result = guards.validateBudget4020({
    base_visible_count: 0,
    causal_visible_count: 21,
  });

  assert.equal(result.ok, false);
  assert.ok(result.blockers.includes("causal_visible_count_exceeds_20"));
});

test("validates selected_primary_activity_count <= 8", () => {
  assert.equal(
    guards.validateBudget4020({
      base_visible_count: 0,
      causal_visible_count: 0,
      selected_primary_activity_count: 8,
    }).ok,
    true,
  );
});

test("blocks selected_primary_activity_count > 8", () => {
  const result = guards.validateBudget4020({
    base_visible_count: 0,
    causal_visible_count: 0,
    selected_primary_activity_count: 9,
  });

  assert.equal(result.ok, false);
  assert.ok(result.blockers.includes("selected_primary_activity_count_exceeds_8"));
});

test("includes all epistemic statuses", () => {
  assert.deepEqual(list(run().epistemic_statuses), [
    "captured_user_evidence",
    "ai_inferred_unconfirmed",
    "user_confirmed_suggestion",
    "user_corrected_evidence",
    "canonical_derivation",
    "internal_calculated",
  ]);
});

test("includes all route statuses", () => {
  assert.deepEqual(list(run().route_statuses), [
    "not_applicable",
    "open",
    "closed",
    "closed_with_flags",
    "blocked_by_missing_canonical_route",
    "route_missing",
    "superseded",
  ]);
});

test("includes all readiness states", () => {
  assert.deepEqual(list(run().readiness_states), [
    "ready",
    "ready_with_flags",
    "blocked_by_missing_evidence",
    "blocked_by_contradiction",
    "blocked_by_missing_canonical_route",
    "manual_review_required",
    "reentry_required",
  ]);
});

test("blocks if execution_core_schema_ready=false", () => {
  const result = run({ execution_core_schema_ready: false });

  assert.equal(result.ok, false);
  assert.match(result.blocked_reason, /execution_core_schema_not_ready/);
});

test("blocks if catalog_activated=true", () => {
  const result = run({ catalog_activated: true });

  assert.equal(result.ok, false);
  assert.match(result.blocked_reason, /catalog_activated_forbidden/);
});

test("blocks if runtime_40_20_started=true", () => {
  const result = run({ runtime_40_20_started: true });

  assert.equal(result.ok, false);
  assert.match(result.blocked_reason, /runtime_40_20_started_forbidden/);
});

test("keeps migration_applied=false", () => {
  assert.equal(run().no_go.migration_applied, false);
});

test("keeps catalog_activated=false", () => {
  assert.equal(run().no_go.catalog_activated, false);
});

test("keeps Runtime 40/20 not started", () => {
  assert.equal(run().no_go.runtime_40_20_started, false);
});

test("keeps Supabase/SQL/endpoint false", () => {
  const noGo = run().no_go;

  assert.equal(noGo.supabase_touched, false);
  assert.equal(noGo.sql_executed, false);
  assert.equal(noGo.endpoint_created, false);
});

test("keeps Registry/IR/Object Inventory/F5C/export/diagnosis/Delivered false", () => {
  const noGo = run().no_go;

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
  assert.equal(result.budget_contract.base_limit, 40);
  assert.equal(result.budget_contract.causal_limit, 20);
  assert.equal(result.budget_contract.primary_activity_limit, 8);
});

function run(overrides = {}) {
  return contract.createRuntime4020StateMachineContract({
    case_id: "CASE-001",
    execution_core_schema_ready: true,
    catalog_activated: false,
    runtime_40_20_started: false,
    ...overrides,
  });
}

function list(value) {
  return Array.from(value);
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

