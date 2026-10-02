import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const service = loadService();

test("creates breach closure decision when all closure signals are valid", () => {
  const result = run();

  assert.equal(result.ok, true);
  assert.equal(result.breach_closure_decision.breach_closure_status, "closed");
});

test("creates promotion pause decision", () => {
  const result = run();

  assert.equal(result.promotion_pause_decision.controlled_promotion_status, "paused");
  assert.equal(result.promotion_pause_decision.registry_live_db_application_paused, true);
});

test("creates runtime blueprint handoff", () => {
  const result = run();

  assert.equal(result.runtime_40_20_blueprint_handoff.runtime_40_20_status, "not_started");
  assert.equal(result.runtime_40_20_blueprint_handoff.runtime_40_20_blueprint_required, true);
});

test("creates runtime scope protection manifest", () => {
  const result = run();

  assert.ok(
    result.runtime_scope_protection_manifest.protected_scope_items.includes(
      "40_base_interactions",
    ),
  );
});

test("creates deferred capability promotion manifest", () => {
  const result = run();

  assert.ok(
    result.deferred_capability_promotion_manifest.deferred_capabilities.includes(
      "registry_live_db_application",
    ),
  );
});

test("creates runtime implementation entry criteria", () => {
  const result = run();

  assert.ok(
    result.runtime_implementation_entry_criteria.required_before_runtime_implementation.includes(
      "runtime_40_20_full_blueprint",
    ),
  );
});

test("marks breach_closure_status=closed", () => {
  assert.equal(run().materiality.breach_closure_status, "closed");
});

test("marks controlled_promotion_status=paused", () => {
  assert.equal(run().materiality.controlled_promotion_status, "paused");
});

test("marks runtime_40_20_status=not_started", () => {
  assert.equal(run().materiality.runtime_40_20_status, "not_started");
});

test("blocks if local_materiality_chain_closed=false", () => {
  const result = run({ local_materiality_chain_closed: false });

  assert.equal(result.ok, false);
  assert.equal(result.breach_closure_decision.breach_closure_status, "blocked");
});

test("blocks if migration_applied=true", () => {
  const result = run({ migration_applied: true });

  assert.equal(result.ok, false);
  assert.equal(result.materiality.controlled_promotion_status, "blocked");
});

test("blocks if supabase_touched=true", () => {
  const result = run({ supabase_touched: true });

  assert.equal(result.ok, false);
});

test("blocks if sql_executed=true", () => {
  const result = run({ sql_executed: true });

  assert.equal(result.ok, false);
});

test("blocks if runtime_40_20_started=true", () => {
  const result = run({ runtime_40_20_started: true });

  assert.equal(result.ok, false);
});

test("ensures activation_bundle_as_runtime_substitute=false", () => {
  assert.equal(
    run().runtime_40_20_blueprint_handoff.activation_bundle_as_runtime_substitute,
    false,
  );
});

test("ensures runtime_40_20_scope_protected=true", () => {
  assert.equal(
    run().runtime_40_20_blueprint_handoff.runtime_40_20_scope_protected,
    true,
  );
});

test("keeps registry_live_db_created=false", () => {
  assert.equal(run().no_go.registry_live_db_created, false);
});

test("keeps IR Object Inventory F5C export diagnosis Delivered false", () => {
  const result = run();

  assert.equal(result.no_go.ir_real_created, false);
  assert.equal(result.no_go.object_inventory_real_opened, false);
  assert.equal(result.no_go.f5c_real_opened, false);
  assert.equal(result.no_go.export_created, false);
  assert.equal(result.no_go.diagnosis_created, false);
  assert.equal(result.no_go.delivered_created, false);
});

test("keeps conformance consistency claimed false", () => {
  const result = run();

  assert.equal(result.no_go.conformance_claimed, false);
  assert.equal(result.no_go.consistency_claimed, false);
});

test("does not modify existing services", () => {
  const result = run();

  assert.equal(result.runtime_implementation_entry_criteria.registry_live_db_application_required_now, false);
  assert.equal(result.materiality.next_authorization_required, true);
});

function run(overrides = {}) {
  return service.runBreachClosureRuntimeHandoff({
    case_id: "case:breach-closure-handoff",
    local_materiality_chain_closed: true,
    registry_real_minimal_prepared_in_code: true,
    registry_sql_service_contract_aligned: true,
    migration_application_blocked_correctly: true,
    operator_authorization_flag_present: false,
    migration_applied: false,
    supabase_touched: false,
    sql_executed: false,
    runtime_40_20_started: false,
    ...overrides,
  });
}

function loadService() {
  const source = readFileSync(
    new URL("./breach-closure-runtime-handoff-service.ts", import.meta.url),
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
      if (specifier === "./breach-closure-runtime-handoff-types") {
        return {};
      }
      throw new Error(`Unexpected require: ${specifier}`);
    },
  };

  vm.runInNewContext(transpiled, context, {
    filename: "breach-closure-runtime-handoff-service.ts",
  });

  return context.exports;
}
