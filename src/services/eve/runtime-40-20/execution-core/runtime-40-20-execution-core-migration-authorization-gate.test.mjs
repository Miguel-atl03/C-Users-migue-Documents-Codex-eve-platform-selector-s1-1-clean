import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const service = loadModule(
  "runtime-40-20-execution-core-migration-authorization-gate-service.ts",
  {
    "./runtime-40-20-execution-core-migration-authorization-gate-types": {},
  },
);

test("creates authorization gate from valid execution core schema traceability", () => {
  assert.equal(run().ok, true);
});

test("creates preconditions check", () => {
  assert.equal(
    run().preconditions_check.check_id,
    "execution_core_migration_preconditions",
  );
});

test("creates catalog core dependency check", () => {
  assert.equal(
    run().catalog_core_dependency_check.check_id,
    "catalog_core_dependency",
  );
});

test("creates migration safety checklist", () => {
  assert.equal(
    run().migration_safety_checklist.checklist_id,
    "execution_core_migration_safety",
  );
});

test("creates Supabase execution boundary check", () => {
  assert.equal(
    run().supabase_execution_boundary_check.reason,
    "authorization_gate_only_no_live_execution",
  );
});

test("creates RLS ownership readiness check", () => {
  const check = run().rls_ownership_readiness_check;

  assert.equal(check.rls_required_before_production_use, true);
  assert.equal(check.ownership_required_before_production_use, true);
});

test("creates rollback readiness check", () => {
  assert.equal(run().rollback_readiness_check.rollback_plan_required, true);
});

test("creates live DB application decision candidate", () => {
  assert.equal(
    run().live_db_application_decision_candidate.live_db_created_now,
    false,
  );
});

test("creates migration application No-Go check", () => {
  assert.equal(
    run().migration_application_no_go_check.no_go_check_id,
    "execution_core_migration_application_no_go",
  );
});

test("returns blocked_until_catalog_schema_migration_applied when catalog_schema_migration_applied=false", () => {
  const result = run();

  assert.equal(
    result.live_db_application_decision_candidate.decision_candidate,
    "blocked_until_catalog_schema_migration_applied",
  );
  assert.equal(result.blocked_reason, "catalog_schema_migration_not_applied");
});

test("returns authorize_later_with_explicit_human_approval when catalog_schema_migration_applied=true", () => {
  const result = run({
    catalog_dependency_traceability: {
      catalog_schema_migration_applied: true,
      catalog_activated: false,
    },
  });

  assert.equal(
    result.live_db_application_decision_candidate.decision_candidate,
    "authorize_later_with_explicit_human_approval",
  );
  assert.equal(result.materiality.runtime_40_20_started, false);
});

test("keeps execution_core_migration_applied=false", () => {
  assert.equal(run().no_go.execution_core_migration_applied, false);
});

test("keeps runtime_40_20_started=false", () => {
  assert.equal(run().no_go.runtime_40_20_started, false);
});

test("keeps catalog_activated=false", () => {
  assert.equal(run().no_go.catalog_activated, false);
});

test("keeps supabase_touched=false", () => {
  assert.equal(run().no_go.supabase_touched, false);
});

test("keeps sql_executed=false", () => {
  assert.equal(run().no_go.sql_executed, false);
});

test("keeps endpoint_created=false", () => {
  assert.equal(run().no_go.endpoint_created, false);
});

test("blocks if schema_contract_created=false", () => {
  const result = run({
    execution_core_schema_traceability: { schema_contract_created: false },
  });

  assert.equal(
    result.preconditions_check.blockers.includes("schema_contract_not_created"),
    true,
  );
  assert.equal(
    result.live_db_application_decision_candidate.decision_candidate,
    "blocked",
  );
});

test("blocks if migration_draft_created=false", () => {
  const result = run({
    execution_core_schema_traceability: { migration_draft_created: false },
  });

  assert.equal(
    result.preconditions_check.blockers.includes("migration_draft_not_created"),
    true,
  );
});

test("blocks if execution_core_tables_supported is not 15", () => {
  const result = run({
    execution_core_schema_traceability: { execution_core_tables_supported: 14 },
  });

  assert.equal(
    result.preconditions_check.blockers.includes("execution_core_table_count_not_15"),
    true,
  );
});

test("blocks if runtime_40_20_started=true", () => {
  const result = run({
    execution_core_schema_traceability: { runtime_40_20_started: true },
  });

  assert.equal(
    result.preconditions_check.blockers.includes("runtime_40_20_already_started"),
    true,
  );
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

test("keeps conformance/consistency claimed false", () => {
  const noGo = run().no_go;

  assert.equal(noGo.conformance_claimed, false);
  assert.equal(noGo.consistency_claimed, false);
});

test("does not modify existing services", () => {
  const result = run();

  assert.equal(result.materiality.authorization_gate_only, true);
  assert.equal(result.supabase_execution_boundary_check.env_read_allowed_now, false);
  assert.equal(result.supabase_execution_boundary_check.sql_execution_allowed_now, false);
});

function run(overrides = {}) {
  return service.runRuntimeExecutionCoreMigrationAuthorizationGate(
    mergeInput(baseInput(), overrides),
  );
}

function baseInput() {
  return {
    case_id: "CASE-001",
    execution_core_schema_traceability: {
      schema_contract_created: true,
      migration_draft_created: true,
      execution_core_tables_supported: 15,
      catalog_core_dependency_declared: true,
      catalog_migration_required_before_runtime_start: true,
      catalog_activation_required_before_runtime_start: true,
      migration_applied: false,
      catalog_activated: false,
      runtime_40_20_started: false,
      supabase_touched: false,
      sql_executed: false,
      endpoint_created: false,
      real_runtime_records_created: false,
      business_evidence_created: false,
    },
    catalog_dependency_traceability: {
      catalog_import_dry_run_ready: true,
      catalog_schema_migration_applied: false,
      catalog_activated: false,
      supabase_touched: false,
      sql_executed: false,
    },
  };
}

function mergeInput(input, overrides) {
  return {
    ...input,
    ...overrides,
    execution_core_schema_traceability: {
      ...input.execution_core_schema_traceability,
      ...overrides.execution_core_schema_traceability,
    },
    catalog_dependency_traceability: {
      ...input.catalog_dependency_traceability,
      ...overrides.catalog_dependency_traceability,
    },
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
