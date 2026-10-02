import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const boundary = loadModule("runtime-40-20-execution-core-schema-boundary.ts", {
  "./runtime-40-20-execution-core-schema-types": {},
});
const service = loadModule("runtime-40-20-execution-core-schema-service.ts", {
  "./runtime-40-20-execution-core-schema-boundary": boundary,
  "./runtime-40-20-execution-core-schema-types": {},
});
const migrationSql = readFileSync(
  new URL("../../../../../supabase/migrations/20260702122000_eve_runtime_40_20_execution_core.sql", import.meta.url),
  "utf8",
);

test("creates execution core schema contract from valid input", () => {
  assert.equal(run().ok, true);
});

test("creates table manifest with all 15 execution core tables", () => {
  assert.deepEqual(run().schema_contract.authorized_tables, service.RUNTIME_40_20_EXECUTION_CORE_TABLES);
  assert.equal(run().schema_contract.tables.length, 15);
});

test("does not include catalog core tables", () => {
  const authorized = run().schema_contract.authorized_tables;

  for (const table of service.FORBIDDEN_RUNTIME_40_20_CATALOG_CORE_TABLES) {
    assert.equal(authorized.includes(table), false);
    assert.equal(migrationSql.includes(`create table if not exists ${table}`), false);
  }
});

test("creates role_runtime_session table manifest", () => {
  assert.ok(table("eve_role_runtime_session"));
});

test("creates activity_runtime_run table manifest", () => {
  assert.ok(table("eve_activity_runtime_run"));
});

test("creates runtime_interaction_instance table manifest", () => {
  assert.ok(table("eve_runtime_interaction_instance"));
});

test("creates runtime_subfield_response table manifest", () => {
  assert.ok(table("eve_runtime_subfield_response"));
});

test("creates evidence_item table manifest", () => {
  assert.ok(table("eve_evidence_item"));
});

test("creates canonical_variable_record table manifest", () => {
  assert.ok(table("eve_canonical_variable_record"));
});

test("creates branching/budget/gate/readiness/payload/audit table manifests", () => {
  for (const tableName of [
    "eve_runtime_branching_decision",
    "eve_runtime_budget_ledger",
    "eve_semantic_resolution_event",
    "eve_process_state_timer_event",
    "eve_readiness_gap_record",
    "eve_readiness_decision_record",
    "eve_parallel_export_payload",
    "eve_runtime_audit_trail",
  ]) {
    assert.ok(table(tableName), tableName);
  }
});

test("creates column manifest with case_id on all execution tables", () => {
  for (const tableName of service.RUNTIME_40_20_EXECUTION_CORE_TABLES) {
    assert.ok(column(tableName, "case_id"), tableName);
  }
});

test("creates constraints for max 8 activities", () => {
  assert.ok(constraint("eve_role_runtime_session_primary_limit_check"));
  assert.match(migrationSql, /primary_activity_limit\s+integer\s+not\s+null\s+default\s+8/i);
});

test("creates constraints for base <= 40", () => {
  assert.ok(constraint("eve_activity_runtime_run_base_count_check"));
  assert.ok(constraint("eve_runtime_budget_ledger_base_count_check"));
});

test("creates constraints for causal <= 20", () => {
  assert.ok(constraint("eve_activity_runtime_run_causal_count_check"));
  assert.ok(constraint("eve_runtime_budget_ledger_causal_count_check"));
});

test("creates state constraints for activity_runtime_run", () => {
  const check = constraint("eve_activity_runtime_run_state_check");

  assert.match(check.expression, /semantic_preload_loaded/);
  assert.match(check.expression, /exported_to_parallel_production/);
});

test("creates epistemic_status constraints", () => {
  assert.ok(constraint("eve_runtime_subfield_response_epistemic_status_check"));
  assert.ok(constraint("eve_evidence_item_epistemic_status_check"));
});

test("creates route_status constraints", () => {
  assert.ok(constraint("eve_canonical_variable_record_route_status_check"));
});

test("creates index manifest", () => {
  assert.ok(run().schema_contract.indexes.length >= 15);
});

test("creates constraint manifest", () => {
  assert.ok(run().schema_contract.constraints.length >= 15);
});

test("blocks if catalog_import_dry_run_ready=false", () => {
  const result = run({ catalog_import_dry_run_ready: false });

  assert.equal(result.ok, false);
  assert.ok(result.no_go_check.blockers.includes("catalog_import_dry_run_not_ready"));
});

test("blocks if catalog_migration_applied=true", () => {
  const result = run({ catalog_migration_applied: true });

  assert.equal(result.ok, false);
  assert.ok(result.no_go_check.blockers.includes("catalog_migration_already_applied_forbidden_in_this_tramo"));
});

test("blocks if catalog_activated=true", () => {
  const result = run({ catalog_activated: true });

  assert.equal(result.ok, false);
  assert.ok(result.no_go_check.blockers.includes("catalog_activated_forbidden"));
});

test("blocks if runtime_40_20_started=true", () => {
  const result = run({ runtime_40_20_started: true });

  assert.equal(result.ok, false);
  assert.ok(result.no_go_check.blockers.includes("runtime_40_20_started_forbidden"));
});

test("boundary blocks if migration_applied=true", () => {
  const check = boundary.assertRuntimeExecutionCoreSchemaBoundary({ migration_applied: true });

  assert.equal(check.allowed, false);
  assert.ok(check.blockers.includes("migration_applied_forbidden"));
});

test("boundary blocks if real_runtime_records_created=true", () => {
  const check = boundary.assertRuntimeExecutionCoreSchemaBoundary({ real_runtime_records_created: true });

  assert.equal(check.allowed, false);
  assert.ok(check.blockers.includes("real_runtime_records_created_forbidden"));
});

test("boundary blocks if business_evidence_created=true", () => {
  const check = boundary.assertRuntimeExecutionCoreSchemaBoundary({ business_evidence_created: true });

  assert.equal(check.allowed, false);
  assert.ok(check.blockers.includes("business_evidence_created_forbidden"));
});

test("keeps migration_applied=false", () => {
  assert.equal(run().schema_contract.migration_applied, false);
  assert.equal(run().no_go_check.migration_applied, false);
});

test("keeps catalog_activated=false", () => {
  assert.equal(run().schema_contract.catalog_activation_allowed, false);
  assert.equal(run().no_go_check.catalog_activated, false);
});

test("keeps Runtime 40/20 not started", () => {
  assert.equal(run().schema_contract.runtime_40_20_start_allowed, false);
  assert.equal(run().no_go_check.runtime_40_20_started, false);
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
  assert.equal(run().schema_contract.catalog_core_dependency_declared, true);
  assert.equal(run().schema_contract.catalog_migration_required_before_runtime_start, true);
  assert.equal(run().schema_contract.catalog_activation_required_before_runtime_start, true);
});

function run(overrides = {}) {
  return service.createRuntimeExecutionCoreSchemaContract({
    case_id: "CASE-001",
    catalog_import_dry_run_ready: true,
    catalog_migration_applied: false,
    catalog_activated: false,
    runtime_40_20_started: false,
    ...overrides,
  });
}

function table(tableName) {
  return run().schema_contract.tables.find((item) => item.table_name === tableName);
}

function column(tableName, columnName) {
  return run().schema_contract.columns.find(
    (item) => item.table_name === tableName && item.column_name === columnName,
  );
}

function constraint(constraintName) {
  return run().schema_contract.constraints.find(
    (item) => item.constraint_name === constraintName,
  );
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
