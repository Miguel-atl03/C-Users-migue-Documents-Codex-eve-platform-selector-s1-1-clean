import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const service = loadService();

test("creates persistence plan from valid import payload and schema contract", () => {
  assert.equal(run().ok, true);
});

test("creates dependency order with 14 steps", () => {
  assert.equal(run().persistence_plan.dependency_order.length, 14);
});

test("creates batch plan for all 14 tables", () => {
  assert.equal(run().persistence_plan.table_batch_plans.length, 14);
});

test("simulates in-memory dry run", () => {
  assert.equal(run().dry_run_adapter_contract.adapter_type, "in_memory_dry_run");
  assert.equal(run().dry_run_result.status, "passed");
});

test("simulates rollback", () => {
  assert.equal(run().dry_run_result.rollback_simulated, true);
});

test("creates referential integrity report", () => {
  assert.equal(run().referential_integrity_report.report_id.includes("runtime-40-20-import-integrity"), true);
});

test("confirms catalog_version_record present", () => {
  assert.equal(run().referential_integrity_report.catalog_version_record_present, true);
});

test("confirms 60 interaction definitions", () => {
  assert.equal(run().referential_integrity_report.interaction_def_count, 60);
});

test("confirms 40 base interactions", () => {
  assert.equal(run().referential_integrity_report.base_interaction_def_count, 40);
});

test("confirms 20 causal interactions", () => {
  assert.equal(run().referential_integrity_report.causal_interaction_def_count, 20);
});

test("checks mapping refs", () => {
  assert.equal(run().referential_integrity_report.mapping_refs_checked, true);
  assert.deepEqual(run().referential_integrity_report.unresolved_mapping_refs, []);
});

test("checks subfield refs", () => {
  assert.equal(run().referential_integrity_report.subfield_refs_checked, true);
  assert.deepEqual(run().referential_integrity_report.unresolved_subfield_refs, []);
});

test("checks canonical variable refs", () => {
  assert.equal(run().referential_integrity_report.canonical_variable_refs_checked, true);
  assert.deepEqual(run().referential_integrity_report.unresolved_canonical_variable_refs, []);
});

test("confirms SEM gates present", () => {
  assert.equal(run().referential_integrity_report.sem_gate_present, true);
});

test("confirms PST gates present", () => {
  assert.equal(run().referential_integrity_report.pst_gate_present, true);
});

test("confirms QA rules present", () => {
  assert.equal(run().referential_integrity_report.qa_rules_present, true);
});

test("blocks if import_payload_result.ok=false", () => {
  const input = validInput();
  input.import_payload_result.ok = false;

  assertBlocked(input, "import_payload_result_not_ok");
});

test("blocks if persistence_schema_result.ok=false", () => {
  const input = validInput();
  input.persistence_schema_result.ok = false;

  assertBlocked(input, "persistence_schema_result_not_ok");
});

test("blocks if ready_for_future_persistence=false", () => {
  const input = validInput();
  input.import_payload_result.import_payload.readiness_check.ready_for_future_persistence = false;

  assertBlocked(input, "payload_not_ready_for_future_persistence");
});

test("blocks if ready_for_catalog_activation=true", () => {
  const input = validInput();
  input.import_payload_result.import_payload.readiness_check.ready_for_catalog_activation = true;

  assertBlocked(input, "payload_ready_for_catalog_activation_forbidden");
});

test("blocks if ready_for_runtime_start=true", () => {
  const input = validInput();
  input.import_payload_result.import_payload.readiness_check.ready_for_runtime_start = true;

  assertBlocked(input, "payload_ready_for_runtime_start_forbidden");
});

test("blocks if interaction count is not 60", () => {
  const input = validInput();
  input.import_payload_result.import_payload.interaction_def_records.pop();

  assertBlocked(input, "interaction_def_count_not_60");
});

test("blocks unresolved mapping refs unless explicitly marked unresolved_mapping", () => {
  const input = validInput();
  input.import_payload_result.import_payload.interaction_mapping_records[0].metadata.source_node_ref = "MISSING";

  assertBlocked(input, "unresolved_mapping_refs");
});

test("keeps real_persistence_allowed=false", () => {
  assert.equal(run().persistence_plan.real_persistence_allowed, false);
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
  assert.deepEqual(Object.keys(service).sort(), ["runRuntime4020CatalogImportPersistenceDryRun"]);
});

function run(input = validInput()) {
  return service.runRuntime4020CatalogImportPersistenceDryRun(input);
}

function assertBlocked(input, blocker) {
  const result = run(input);

  assert.equal(result.ok, false);
  assert.equal(result.dry_run_result.status, "blocked");
  assert.ok(result.no_go_check.blockers.includes(blocker));
}

function validInput() {
  return {
    case_id: "CASE-001",
    import_payload_result: {
      ok: true,
      case_id: "CASE-001",
      import_payload: importPayload(),
      no_go_check: noGo(false, []),
      materiality: {
        level: "runtime_40_20_catalog_import_payload_builder_local",
        local_only: true,
        migration_applied: false,
        catalog_activated: false,
        runtime_40_20_started: false,
        next_authorization_required: true,
      },
    },
    persistence_schema_result: persistenceSchemaResult(),
  };
}

function importPayload() {
  const catalogVersionRef = "runtime-40-20:CASE-001:v1.0.1:v1.1.1:1.0";
  const interactions = Array.from({ length: 60 }, (_, index) => interactionRecord(catalogVersionRef, index));

  return {
    payload_id: "runtime-40-20-import-payload:CASE-001",
    case_id: "CASE-001",
    status: "draft_import_payload",
    catalog_version_record: {
      catalog_version_ref: catalogVersionRef,
      runtime_spec_version: "v1.0.1",
      runtime_catalog_version: "v1.1.1",
      mother_catalog_version: "1.0",
      runtime_spec_checksum: "spec-sha",
      runtime_catalog_checksum: "runtime-sha",
      mother_catalog_checksum: "mother-sha",
      qa_passed: true,
      catalog_activation_allowed: false,
      status: "draft_import_payload",
      metadata: {},
    },
    interaction_def_records: interactions,
    source_node_ref_records: [genericRecord("eve_runtime_source_node_ref", catalogVersionRef, 1, { source_node_ref: "SRC-1" })],
    interaction_mapping_records: [
      genericRecord("eve_runtime_interaction_mapping", catalogVersionRef, 1, {
        runtime_interaction_id: "B-1",
        source_node_ref: "SRC-1",
      }),
    ],
    subfield_schema_records: [
      genericRecord("eve_runtime_subfield_schema", catalogVersionRef, 1, {
        runtime_interaction_id: "B-1",
        subfield_name: "action_verb",
      }),
    ],
    canonical_variable_map_records: [
      genericRecord("eve_runtime_canonical_variable_map", catalogVersionRef, 1, {
        runtime_interaction_id: "B-1",
        variable_name: "activity_object",
      }),
    ],
    branching_rule_records: [genericRecord("eve_runtime_branching_rule", catalogVersionRef, 1, { runtime_interaction_id: "B-1" })],
    critical_route_records: [genericRecord("eve_runtime_critical_route", catalogVersionRef, 1, { route_id: "CR-B0" })],
    semantic_gate_records: [genericRecord("eve_runtime_semantic_gate", catalogVersionRef, 1, { gate_id: "SEM-001" })],
    process_state_timer_gate_records: [genericRecord("eve_runtime_process_state_timer_gate", catalogVersionRef, 1, { gate_id: "PST-001" })],
    readiness_rule_records: [genericRecord("eve_runtime_readiness_rule", catalogVersionRef, 1, { readiness_rule_id: "RR-1" })],
    qa_rule_records: [genericRecord("eve_runtime_qa_rule", catalogVersionRef, 1, { qa_id: "QA-1" })],
    implementation_dictionary_records: [genericRecord("eve_runtime_implementation_dictionary", catalogVersionRef, 1, { key: "k" })],
    import_audit_record: {
      audit_ref: "runtime-40-20-import-audit:CASE-001",
      catalog_version_ref: catalogVersionRef,
      action: "catalog_import_payload_built",
      source_documents_referenced: [
        "EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx",
        "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
        "EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx",
      ],
      runtime_40_20_started: false,
      catalog_activated: false,
      migration_applied: false,
      metadata: {},
    },
    readiness_check: {
      canonical_model_consumed: true,
      schema_contract_consumed: true,
      checksum_contract_aligned: true,
      migration_applied: false,
      catalog_activated: false,
      ready_for_future_persistence: true,
      ready_for_catalog_activation: false,
      ready_for_runtime_start: false,
      blockers: [],
    },
  };
}

function interactionRecord(catalogVersionRef, index) {
  const group = index < 40 ? "base" : "causal";

  return {
    ...trace(index + 1),
    target_table: "eve_runtime_interaction_def",
    record_ref: `eve_runtime_interaction_def:${String(index + 1).padStart(4, "0")}`,
    catalog_version_ref: catalogVersionRef,
    active: true,
    metadata: {},
    runtime_interaction_id: index < 40 ? `B-${index + 1}` : `C-${index - 39}`,
    interaction_group: group,
    visible_text: `Pregunta ${index + 1}`,
    counts_as_base: group === "base",
    counts_as_causal: group === "causal",
    catalog_activation_allowed: false,
  };
}

function genericRecord(targetTable, catalogVersionRef, index, metadata) {
  return {
    ...trace(index),
    target_table: targetTable,
    record_ref: `${targetTable}:${String(index).padStart(4, "0")}`,
    catalog_version_ref: catalogVersionRef,
    active: true,
    metadata,
  };
}

function trace(row) {
  return {
    source_document: "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
    source_sheet: "Runtime_Interactions_Base_40",
    source_row_number: row,
    raw_row: { row },
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
    no_go_check: noGo(false, []),
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

function noGo(noGoTriggered, blockers) {
  return {
    no_go_triggered: noGoTriggered,
    blockers,
    migration_applied: false,
    catalog_activated: false,
    runtime_40_20_started: false,
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
  };
}

function loadService() {
  const source = readFileSync(
    new URL("runtime-40-20-catalog-import-persistence-dry-run-service.ts", import.meta.url),
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
      if (id === "./runtime-40-20-catalog-import-persistence-dry-run-types") {
        return {};
      }
      throw new Error(`Unexpected require: ${id}`);
    },
  };

  vm.runInNewContext(outputText, context, {
    filename: "runtime-40-20-catalog-import-persistence-dry-run-service.ts",
  });
  return module.exports;
}

