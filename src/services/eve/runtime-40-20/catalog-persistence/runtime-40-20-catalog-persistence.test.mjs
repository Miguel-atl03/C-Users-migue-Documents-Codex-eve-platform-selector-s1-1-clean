import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const boundary = loadModule("runtime-40-20-catalog-persistence-boundary.ts", {
  "./runtime-40-20-catalog-persistence-types": {},
});
const service = loadModule("runtime-40-20-catalog-persistence-service.ts", {
  "./runtime-40-20-catalog-persistence-boundary": boundary,
  "./runtime-40-20-catalog-persistence-types": {},
});
const migrationSql = readFileSync(
  new URL("../../../../../supabase/migrations/20260702121000_eve_runtime_40_20_catalog_core.sql", import.meta.url),
  "utf8",
);

test("creates a schema contract from a valid canonicalization result", () => {
  assert.equal(run().ok, true);
});

test("consumes the canonicalization result without file reads or SQL execution", () => {
  const result = run();

  assert.equal(result.canonicalization_result_consumed, true);
  assert.equal(result.no_go_check.sql_executed, false);
});

test("supports exactly 14 runtime catalog tables", () => {
  assert.equal(run().schema_contract.runtime_catalog_tables_supported, 14);
});

test("authorizes only the expected catalog tables", () => {
  assert.deepEqual(run().schema_contract.authorized_tables, service.RUNTIME_40_20_CATALOG_TABLES);
});

test("does not include execution runtime tables", () => {
  const authorized = run().schema_contract.authorized_tables;

  for (const forbidden of service.FORBIDDEN_EXECUTION_RUNTIME_TABLES) {
    assert.equal(authorized.includes(forbidden), false);
  }
});

test("declares the exact migration draft path", () => {
  assert.equal(
    run().schema_contract.migration_file,
    "supabase/migrations/20260702121000_eve_runtime_40_20_catalog_core.sql",
  );
});

test("allows migration creation but forbids migration application", () => {
  const contract = run().schema_contract;

  assert.equal(contract.migration_creation_allowed, true);
  assert.equal(contract.migration_application_allowed, false);
});

test("keeps catalog activation blocked", () => {
  assert.equal(run().schema_contract.catalog_activation_allowed, false);
});

test("checksum contract uses runtime_spec_checksum", () => {
  const column = catalogVersionColumn("runtime_spec_checksum");

  assert.equal(run().schema_contract.checksum_contract.runtime_spec_checksum, "text not null");
  assert.equal(column.nullable, false);
});

test("checksum contract uses runtime_catalog_checksum", () => {
  const column = catalogVersionColumn("runtime_catalog_checksum");

  assert.equal(run().schema_contract.checksum_contract.runtime_catalog_checksum, "text not null");
  assert.equal(column.nullable, false);
});

test("checksum contract uses mother_catalog_checksum", () => {
  const column = catalogVersionColumn("mother_catalog_checksum");

  assert.equal(run().schema_contract.checksum_contract.mother_catalog_checksum, "text not null");
  assert.equal(column.nullable, false);
});

test("migration SQL contains runtime_spec_checksum text not null", () => {
  assert.match(migrationSql, /\bruntime_spec_checksum\s+text\s+not\s+null\b/i);
});

test("migration SQL contains runtime_catalog_checksum text not null", () => {
  assert.match(migrationSql, /\bruntime_catalog_checksum\s+text\s+not\s+null\b/i);
});

test("migration SQL contains mother_catalog_checksum text not null", () => {
  assert.match(migrationSql, /\bmother_catalog_checksum\s+text\s+not\s+null\b/i);
});

test("migration SQL does not contain checksum_runtime_spec", () => {
  assert.equal(migrationSql.includes("checksum_runtime_spec"), false);
});

test("migration SQL does not contain checksum_runtime_catalog", () => {
  assert.equal(migrationSql.includes("checksum_runtime_catalog"), false);
});

test("migration SQL does not contain checksum_mother_catalog", () => {
  assert.equal(migrationSql.includes("checksum_mother_catalog"), false);
});

test("schema contract declares checksum_contract_aligned true", () => {
  assert.equal(run().schema_contract.checksum_contract.checksum_contract_aligned, true);
});

test("requires RLS and ownership policy before production use", () => {
  const contract = run().schema_contract;

  assert.equal(contract.rls_required_before_production_use, true);
  assert.equal(contract.ownership_policy_required_before_production_use, true);
});

test("all table contracts reject execution runtime state", () => {
  assert.equal(
    run().schema_contract.tables.every((table) => table.creates_execution_runtime_state === false),
    true,
  );
});

test("all table contracts reject business evidence", () => {
  assert.equal(
    run().schema_contract.tables.every((table) => table.creates_business_evidence === false),
    true,
  );
});

test("catalog version table includes catalog_activation_allowed false guard", () => {
  const contract = run().schema_contract;

  assert.ok(
    contract.constraints.some(
      (constraint) =>
        constraint.constraint_name === "eve_runtime_catalog_version_activation_blocked" &&
        constraint.expression === "catalog_activation_allowed = false",
    ),
  );
});

test("interaction table includes base and causal group constraints", () => {
  const names = run().schema_contract.constraints.map((constraint) => constraint.constraint_name);

  assert.ok(names.includes("eve_runtime_interaction_def_group_check"));
  assert.ok(names.includes("eve_runtime_interaction_def_base_check"));
  assert.ok(names.includes("eve_runtime_interaction_def_causal_check"));
});

test("table contracts include UUID primary identity columns", () => {
  for (const table of run().schema_contract.tables) {
    assert.equal(table.columns[0].column_kind, "uuid");
    assert.equal(table.columns[0].nullable, false);
  }
});

test("catalog row tables include source trace columns", () => {
  const traceTables = run().schema_contract.tables.filter(
    (table) => table.table_name !== "eve_runtime_catalog_version",
  );

  for (const table of traceTables) {
    const traceColumns = table.columns.filter((column) => column.source_trace_column);
    assert.ok(traceColumns.some((column) => column.column_name === "source_document"));
    assert.ok(traceColumns.some((column) => column.column_name === "source_sheet"));
    assert.ok(traceColumns.some((column) => column.column_name === "source_row_number"));
    assert.ok(traceColumns.some((column) => column.column_name === "raw_row"));
  }
});

test("index contract covers catalog_version_id", () => {
  assert.ok(
    run().schema_contract.indexes.some((index) => index.columns.includes("catalog_version_id")),
  );
});

test("index contract covers interaction_id", () => {
  assert.ok(
    run().schema_contract.indexes.some((index) => index.columns.includes("runtime_interaction_id")),
  );
});

test("index contract covers source_node_ref", () => {
  assert.ok(
    run().schema_contract.indexes.some((index) => index.columns.includes("source_node_ref")),
  );
});

test("index contract covers gate_id", () => {
  assert.ok(
    run().schema_contract.indexes.some((index) => index.columns.includes("gate_id")),
  );
});

test("index contract covers route_id", () => {
  assert.ok(
    run().schema_contract.indexes.some((index) => index.columns.includes("route_id")),
  );
});

test("blocks when canonicalization result is not ok", () => {
  const input = canonicalizationResult();
  input.ok = false;

  const result = service.createRuntimeCatalogPersistenceSchemaContract({
    case_id: "CASE-001",
    canonicalization_result: input,
  });

  assert.equal(result.ok, false);
  assert.ok(result.no_go_check.blockers.includes("canonicalization_result_not_ok"));
});

test("blocks if interaction count is not 60", () => {
  const input = canonicalizationResult();
  input.canonical_model.interaction_definitions.pop();

  const result = service.createRuntimeCatalogPersistenceSchemaContract({
    case_id: "CASE-001",
    canonicalization_result: input,
  });

  assert.ok(result.no_go_check.blockers.includes("interaction_definition_count_not_60"));
});

test("blocks if catalog activation appears allowed upstream", () => {
  const input = canonicalizationResult();
  input.canonicalization_report.catalog_activation_allowed = true;

  const result = service.createRuntimeCatalogPersistenceSchemaContract({
    case_id: "CASE-001",
    canonicalization_result: input,
  });

  assert.ok(result.no_go_check.blockers.includes("catalog_activation_not_blocked"));
});

test("boundary blocks every forbidden true flag", () => {
  const check = boundary.assertRuntimeCatalogPersistenceBoundary({
    supabase_touched: true,
    migration_applied: true,
  });

  assert.equal(check.allowed, false);
  assert.ok(check.blockers.includes("supabase_touched_forbidden"));
  assert.ok(check.blockers.includes("migration_applied_forbidden"));
});

test("result materiality keeps all downstream activation flags false", () => {
  const result = run();

  assert.equal(result.materiality.migration_application_allowed, false);
  assert.equal(result.materiality.catalog_activation_allowed, false);
  assert.equal(result.materiality.runtime_40_20_started, false);
  assert.equal(result.materiality.next_authorization_required, true);
});

test("no-go boundary keeps migration, catalog, runtime, Supabase, SQL, and endpoint false", () => {
  const noGo = run().no_go_check;

  assert.equal(noGo.migration_applied, false);
  assert.equal(noGo.catalog_activated, false);
  assert.equal(noGo.runtime_40_20_started, false);
  assert.equal(noGo.supabase_touched, false);
  assert.equal(noGo.sql_executed, false);
  assert.equal(noGo.endpoint_created, false);
});

function run() {
  return service.createRuntimeCatalogPersistenceSchemaContract({
    case_id: "CASE-001",
    canonicalization_result: canonicalizationResult(),
  });
}

function catalogVersionColumn(columnName) {
  const table = run().schema_contract.tables.find(
    (contractTable) => contractTable.table_name === "eve_runtime_catalog_version",
  );

  return table.columns.find((column) => column.column_name === columnName);
}

function canonicalizationResult() {
  const interactions = Array.from({ length: 60 }, (_, index) => ({
    runtime_interaction_id: index < 40 ? `B${index + 1}` : `C${index - 39}`,
    interaction_group: index < 40 ? "base" : "causal",
    visible_text: "Pregunta de catalogo",
    source_refs: [`SRC-${index + 1}`],
    counts_as_base: index < 40,
    counts_as_causal: index >= 40,
    source_document: "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
    source_sheet: index < 40 ? "Runtime_Interactions_Base_40" : "Runtime_Interactions_Causal_20",
    source_row_number: index + 2,
    raw_row: { runtime_interaction_id: index + 1 },
    canonicalization_status: "normalized",
    warnings: [],
    blockers: [],
  }));

  return {
    ok: true,
    case_id: "CASE-001",
    canonical_model: {
      interaction_definitions: interactions,
      source_node_registry: [],
      interaction_source_mappings: [],
      subfield_schemas: [],
      canonical_variable_maps: [],
      branching_rules: [],
      critical_routes: [],
      semantic_gates: [],
      process_state_timer_gates: [],
      readiness_rules: [],
      qa_rules: [],
      implementation_dictionaries: [],
    },
    integrity_gate_results: [],
    canonicalization_report: {
      base_interaction_count: 40,
      causal_interaction_count: 20,
      source_node_count: 0,
      mapping_count: 0,
      subfield_schema_count: 0,
      canonical_variable_count: 0,
      critical_route_count: 0,
      semantic_gate_count: 0,
      process_state_timer_gate_count: 0,
      qa_rule_count: 0,
      blocking_gate_failure_count: 0,
      warning_count: 0,
      catalog_activation_allowed: false,
    },
    no_go_check: {
      no_go_triggered: false,
      blockers: [],
      runtime_40_20_started: false,
      catalog_activated: false,
      supabase_touched: false,
      sql_executed: false,
      endpoint_created: false,
      registry_live_db_created: false,
      ir_real_created: false,
      object_inventory_real_opened: false,
      f5c_real_opened: false,
      export_created: false,
      diagnosis_created: false,
      delivered_created: false,
    },
    materiality: {
      level: "runtime_40_20_catalog_canonicalization_and_integrity_qa",
      local_only: true,
      catalog_activation_allowed: false,
      runtime_40_20_started: false,
      next_authorization_required: true,
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
