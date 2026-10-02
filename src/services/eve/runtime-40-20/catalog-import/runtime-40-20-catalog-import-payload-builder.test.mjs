import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const service = loadService();

test("builds import payload from valid canonicalization and schema contract results", () => {
  assert.equal(run().ok, true);
});

test("creates catalog version record with runtime_spec_checksum", () => {
  assert.equal(run().import_payload.catalog_version_record.runtime_spec_checksum, "spec-sha");
});

test("creates catalog version record with runtime_catalog_checksum", () => {
  assert.equal(run().import_payload.catalog_version_record.runtime_catalog_checksum, "runtime-sha");
});

test("creates catalog version record with mother_catalog_checksum", () => {
  assert.equal(run().import_payload.catalog_version_record.mother_catalog_checksum, "mother-sha");
});

test("does not use incorrect checksum field names", () => {
  const record = run().import_payload.catalog_version_record;

  assert.equal("checksum_runtime_spec" in record, false);
  assert.equal("checksum_runtime_catalog" in record, false);
  assert.equal("checksum_mother_catalog" in record, false);
});

test("creates 60 interaction def records", () => {
  assert.equal(run().import_payload.interaction_def_records.length, 60);
});

test("creates 40 base interaction def records", () => {
  assert.equal(
    run().import_payload.interaction_def_records.filter((record) => record.interaction_group === "base").length,
    40,
  );
});

test("creates 20 causal interaction def records", () => {
  assert.equal(
    run().import_payload.interaction_def_records.filter((record) => record.interaction_group === "causal").length,
    20,
  );
});

test("preserves source traceability on every record candidate", () => {
  for (const record of allRecordCandidates(run().import_payload)) {
    assert.equal(typeof record.source_document, "string");
    assert.equal(typeof record.source_sheet, "string");
    assert.equal(typeof record.source_row_number, "number");
    assert.equal(typeof record.raw_row, "object");
  }
});

test("creates source node ref record candidates", () => {
  assert.ok(run().import_payload.source_node_ref_records.length > 0);
});

test("creates interaction mapping record candidates", () => {
  assert.ok(run().import_payload.interaction_mapping_records.length > 0);
});

test("creates subfield schema record candidates", () => {
  assert.ok(run().import_payload.subfield_schema_records.length > 0);
});

test("creates canonical variable map record candidates", () => {
  assert.ok(run().import_payload.canonical_variable_map_records.length > 0);
});

test("creates branching rule record candidates", () => {
  assert.ok(run().import_payload.branching_rule_records.length > 0);
});

test("creates critical route record candidates", () => {
  assert.ok(run().import_payload.critical_route_records.length > 0);
});

test("creates semantic gate record candidates", () => {
  assert.ok(run().import_payload.semantic_gate_records.length > 0);
});

test("creates process state timer gate record candidates", () => {
  assert.ok(run().import_payload.process_state_timer_gate_records.length > 0);
});

test("creates readiness rule record candidates", () => {
  assert.ok(run().import_payload.readiness_rule_records.length > 0);
});

test("creates QA rule record candidates", () => {
  assert.ok(run().import_payload.qa_rule_records.length > 0);
});

test("creates implementation dictionary record candidates", () => {
  assert.ok(run().import_payload.implementation_dictionary_records.length > 0);
});

test("creates import audit record", () => {
  assert.equal(run().import_payload.import_audit_record.action, "catalog_import_payload_built");
});

test("creates readiness check with ready_for_future_persistence=true", () => {
  assert.equal(run().import_payload.readiness_check.ready_for_future_persistence, true);
});

test("keeps ready_for_catalog_activation=false", () => {
  assert.equal(run().import_payload.readiness_check.ready_for_catalog_activation, false);
});

test("keeps ready_for_runtime_start=false", () => {
  assert.equal(run().import_payload.readiness_check.ready_for_runtime_start, false);
});

test("blocks if checksum missing", () => {
  const input = validInput();
  input.checksums.runtime_spec_checksum = "";

  assertBlocked(input, "runtime_spec_checksum_missing");
});

test("blocks if interaction count is not 60", () => {
  const input = validInput();
  input.canonicalization_result.canonical_model.interaction_definitions.pop();

  assertBlocked(input, "interaction_definition_count_not_60");
});

test("blocks if base count is not 40", () => {
  const input = validInput();
  input.canonicalization_result.canonicalization_report.base_interaction_count = 39;

  assertBlocked(input, "base_interaction_count_not_40");
});

test("blocks if causal count is not 20", () => {
  const input = validInput();
  input.canonicalization_result.canonicalization_report.causal_interaction_count = 19;

  assertBlocked(input, "causal_interaction_count_not_20");
});

test("blocks if schema contract is not ok", () => {
  const input = validInput();
  input.persistence_schema_result.ok = false;

  assertBlocked(input, "persistence_schema_result_not_ok");
});

test("keeps migration_applied=false", () => {
  assert.equal(run().no_go_check.migration_applied, false);
});

test("keeps catalog_activated=false", () => {
  assert.equal(run().no_go_check.catalog_activated, false);
});

test("keeps Runtime 40/20 not started", () => {
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
  assert.deepEqual(Object.keys(service).sort(), ["buildRuntime4020CatalogImportPayload"]);
});

function run(input = validInput()) {
  return service.buildRuntime4020CatalogImportPayload(input);
}

function assertBlocked(input, blocker) {
  const result = run(input);

  assert.equal(result.ok, false);
  assert.ok(result.no_go_check.blockers.includes(blocker));
}

function allRecordCandidates(payload) {
  return [
    ...payload.interaction_def_records,
    ...payload.source_node_ref_records,
    ...payload.interaction_mapping_records,
    ...payload.subfield_schema_records,
    ...payload.canonical_variable_map_records,
    ...payload.branching_rule_records,
    ...payload.critical_route_records,
    ...payload.semantic_gate_records,
    ...payload.process_state_timer_gate_records,
    ...payload.readiness_rule_records,
    ...payload.qa_rule_records,
    ...payload.implementation_dictionary_records,
  ];
}

function validInput() {
  return {
    case_id: "CASE-001",
    canonicalization_result: canonicalizationResult(),
    persistence_schema_result: persistenceSchemaResult(),
    checksums: {
      runtime_spec_checksum: "spec-sha",
      runtime_catalog_checksum: "runtime-sha",
      mother_catalog_checksum: "mother-sha",
    },
  };
}

function canonicalizationResult() {
  const interactions = Array.from({ length: 60 }, (_, index) => ({
    ...trace(index < 40 ? "Runtime_Interactions_Base_40" : "Runtime_Interactions_Causal_20", index + 2),
    canonicalization_status: "normalized",
    warnings: [],
    blockers: [],
    runtime_interaction_id: index < 40 ? `B-${index + 1}` : `C-${index - 39}`,
    interaction_group: index < 40 ? "base" : "causal",
    visible_text: `Pregunta ${index + 1}`,
    source_refs: [`SRC-${index + 1}`],
    counts_as_base: index < 40,
    counts_as_causal: index >= 40,
  }));

  return {
    ok: true,
    case_id: "CASE-001",
    canonical_model: {
      interaction_definitions: interactions,
      source_node_registry: [candidate("Catalogo_Madre_Nodos", 2, { source_node_ref: "SRC-1" })],
      interaction_source_mappings: [candidate("Runtime_Interactions_Base_40", 2, { runtime_interaction_id: "B-1", source_node_ref: "SRC-1" })],
      subfield_schemas: [candidate("UX_Subfield_Structure", 2, { runtime_interaction_id: "B-1", subfield_name: "action_verb" })],
      canonical_variable_maps: [candidate("Canonical_Variables", 2, { variable_name: "activity_object" })],
      branching_rules: [candidate("Branching_Budget_Rules", 2, { rule_id: "BR-1" })],
      critical_routes: [candidate("Critical_Routes", 2, { route_id: "CR-B0", route_family: "B0" })],
      semantic_gates: [candidate("Semantic_Resolution_Gates", 2, { gate_id: "SEM-001", gate_family: "SEM" })],
      process_state_timer_gates: [candidate("Process_State_Timer_Gates", 2, { gate_id: "PST-001", gate_family: "PST" })],
      readiness_rules: [candidate("Readiness_Gaps_Reentry", 2, { readiness_rule_id: "RR-1" })],
      qa_rules: [candidate("QA_Checklist", 2, { qa_id: "QA-1", blocking: true })],
      implementation_dictionaries: [candidate("Implementation_Dictionaries", 2, { key: "k", value: "v" })],
    },
    integrity_gate_results: [],
    canonicalization_report: {
      base_interaction_count: 40,
      causal_interaction_count: 20,
      source_node_count: 1,
      mapping_count: 1,
      subfield_schema_count: 1,
      canonical_variable_count: 1,
      critical_route_count: 1,
      semantic_gate_count: 1,
      process_state_timer_gate_count: 1,
      qa_rule_count: 1,
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

function persistenceSchemaResult() {
  return {
    ok: true,
    case_id: "CASE-001",
    canonicalization_result_consumed: true,
    schema_contract: {
      migration_file: "supabase/migrations/20260702121000_eve_runtime_40_20_catalog_core.sql",
      migration_creation_allowed: true,
      migration_application_allowed: false,
      catalog_activation_allowed: false,
      runtime_catalog_tables_supported: 14,
      authorized_tables: [],
      forbidden_execution_tables: [],
      checksum_contract: {
        runtime_spec_checksum: "text not null",
        runtime_catalog_checksum: "text not null",
        mother_catalog_checksum: "text not null",
        checksum_contract_aligned: true,
      },
      tables: [],
      indexes: [],
      constraints: [],
      rls_required_before_production_use: true,
      ownership_policy_required_before_production_use: true,
    },
    no_go_check: {
      no_go_triggered: false,
      blockers: [],
      runtime_40_20_started: false,
      catalog_activated: false,
      migration_applied: false,
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
      execution_runtime_tables_created: false,
      business_evidence_created: false,
    },
    materiality: {
      level: "runtime_40_20_catalog_persistence_schema_contract",
      local_only: true,
      migration_creation_allowed: true,
      migration_application_allowed: false,
      catalog_activation_allowed: false,
      runtime_40_20_started: false,
      next_authorization_required: true,
    },
  };
}

function candidate(sheet, row, extra) {
  return {
    ...trace(sheet, row),
    canonicalization_status: "normalized",
    warnings: [],
    blockers: [],
    ...extra,
  };
}

function trace(sheet, row) {
  return {
    source_document: "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
    source_sheet: sheet,
    source_row_number: row,
    raw_row: { sheet, row },
  };
}

function loadService() {
  const source = readFileSync(
    new URL("runtime-40-20-catalog-import-payload-builder-service.ts", import.meta.url),
    "utf8",
  );
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
      if (id === "./runtime-40-20-catalog-import-payload-types") {
        return {};
      }
      throw new Error(`Unexpected require: ${id}`);
    },
  };

  vm.runInNewContext(outputText, context, {
    filename: "runtime-40-20-catalog-import-payload-builder-service.ts",
  });
  return module.exports;
}

