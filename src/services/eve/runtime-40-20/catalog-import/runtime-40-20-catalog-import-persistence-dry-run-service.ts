import type {
  RuntimeCatalogDryRunPayload,
  RuntimeCatalogImportDependencyOrderStep,
  RuntimeCatalogImportDryRunAdapterContract,
  RuntimeCatalogImportInMemoryDryRunResult,
  RuntimeCatalogImportPersistenceDryRunInput,
  RuntimeCatalogImportPersistenceDryRunResult,
  RuntimeCatalogImportPersistenceNoGoCheck,
  RuntimeCatalogImportPersistencePlan,
  RuntimeCatalogImportPersistenceReadinessCheck,
  RuntimeCatalogImportReferentialIntegrityReport,
  RuntimeCatalogImportTableBatchPlan,
  RuntimeCatalogTableName,
} from "./runtime-40-20-catalog-import-persistence-dry-run-types";

const TARGET_TABLE_ORDER: RuntimeCatalogTableName[] = [
  "eve_runtime_catalog_version",
  "eve_runtime_source_node_ref",
  "eve_runtime_interaction_def",
  "eve_runtime_interaction_mapping",
  "eve_runtime_subfield_schema",
  "eve_runtime_canonical_variable_map",
  "eve_runtime_branching_rule",
  "eve_runtime_critical_route",
  "eve_runtime_semantic_gate",
  "eve_runtime_process_state_timer_gate",
  "eve_runtime_readiness_rule",
  "eve_runtime_qa_rule",
  "eve_runtime_implementation_dictionary",
  "eve_runtime_catalog_import_audit",
];

const MATERIALITY: RuntimeCatalogImportPersistenceDryRunResult["materiality"] = {
  level: "runtime_40_20_catalog_import_persistence_dry_run_adapter",
  local_only: true,
  real_persistence_allowed: false,
  migration_applied: false,
  catalog_activated: false,
  runtime_40_20_started: false,
  next_authorization_required: true,
};

export function runRuntime4020CatalogImportPersistenceDryRun(
  input: RuntimeCatalogImportPersistenceDryRunInput,
): RuntimeCatalogImportPersistenceDryRunResult {
  const plan = persistencePlan(input);
  const integrityReport = referentialIntegrityReport(input);
  const blockers = unique([
    ...preflightBlockers(input),
    ...integrityReport.blockers,
    ...(plan.target_tables_count === 14 ? [] : ["target_table_count_not_14"]),
  ]);
  const ok = blockers.length === 0;
  const dryRunResult = inMemoryDryRunResult(input, plan, ok, integrityReport);

  return {
    ok,
    case_id: input.case_id,
    persistence_plan: plan,
    dry_run_adapter_contract: adapterContract(),
    dry_run_result: dryRunResult,
    referential_integrity_report: integrityReport,
    readiness_check: readinessCheck(input, ok, blockers),
    no_go_check: noGoCheck(blockers),
    blocked_reason: ok ? undefined : blockers[0],
    materiality: MATERIALITY,
  };
}

function preflightBlockers(input: RuntimeCatalogImportPersistenceDryRunInput): string[] {
  const blockers: string[] = [];
  const payload = input.import_payload_result.import_payload;

  if (input.import_payload_result.ok !== true) blockers.push("import_payload_result_not_ok");
  if (input.persistence_schema_result.ok !== true) blockers.push("persistence_schema_result_not_ok");
  if (payload.readiness_check.ready_for_future_persistence !== true) {
    blockers.push("payload_not_ready_for_future_persistence");
  }
  if (payload.readiness_check.ready_for_catalog_activation !== false) {
    blockers.push("payload_ready_for_catalog_activation_forbidden");
  }
  if (payload.readiness_check.ready_for_runtime_start !== false) {
    blockers.push("payload_ready_for_runtime_start_forbidden");
  }

  return blockers;
}

function persistencePlan(
  input: RuntimeCatalogImportPersistenceDryRunInput,
): RuntimeCatalogImportPersistencePlan {
  return {
    plan_id: `runtime-40-20-import-dry-run-plan:${input.case_id}`,
    case_id: input.case_id,
    target_tables_count: 14,
    dependency_order: dependencyOrder(),
    table_batch_plans: TARGET_TABLE_ORDER.map((tableName) => ({
      table_name: tableName,
      record_count: recordCountFor(input.import_payload_result.import_payload, tableName),
      dry_run_insert_allowed: true,
      real_insert_allowed: false,
      dependencies: dependenciesFor(tableName),
    })),
    real_persistence_allowed: false,
    migration_required_before_real_persistence: true,
  };
}

function dependencyOrder(): RuntimeCatalogImportDependencyOrderStep[] {
  return TARGET_TABLE_ORDER.map((tableName, index) => ({
    order: index + 1,
    table_name: tableName,
    reason: reasonFor(tableName),
  }));
}

function adapterContract(): RuntimeCatalogImportDryRunAdapterContract {
  return {
    adapter_id: "runtime_40_20_catalog_import_in_memory_dry_run_adapter",
    adapter_type: "in_memory_dry_run",
    supports_batch_insert_simulation: true,
    supports_dependency_validation: true,
    supports_rollback_simulation: true,
    touches_database: false,
    touches_supabase: false,
    executes_sql: false,
  };
}

function inMemoryDryRunResult(
  input: RuntimeCatalogImportPersistenceDryRunInput,
  plan: RuntimeCatalogImportPersistencePlan,
  ok: boolean,
  integrityReport: RuntimeCatalogImportReferentialIntegrityReport,
): RuntimeCatalogImportInMemoryDryRunResult {
  return {
    dry_run_id: `runtime-40-20-import-dry-run:${input.case_id}`,
    status: ok ? "passed" : "blocked",
    simulated_tables: plan.dependency_order.map((step) => step.table_name),
    simulated_record_count: plan.table_batch_plans.reduce((total, batch) => total + batch.record_count, 0),
    blocked_records: blockedRecordsFrom(integrityReport),
    rollback_simulated: true,
    real_records_inserted: false,
  };
}

function referentialIntegrityReport(
  input: RuntimeCatalogImportPersistenceDryRunInput,
): RuntimeCatalogImportReferentialIntegrityReport {
  const payload = input.import_payload_result.import_payload;
  const interactionIds = new Set(payload.interaction_def_records.map((record) => record.runtime_interaction_id));
  const sourceRefs = new Set(
    payload.source_node_ref_records
      .map((record) => stringFrom(record.metadata.source_node_ref))
      .filter(Boolean),
  );
  const unresolvedMappingRefs = payload.interaction_mapping_records
    .filter((record) => {
      const interactionId = stringFrom(record.metadata.runtime_interaction_id);
      const sourceNodeRef = stringFrom(record.metadata.source_node_ref);
      const explicitlyUnresolved = record.metadata.mapping_status === "unresolved_mapping";
      return !interactionIds.has(interactionId) || (!sourceRefs.has(sourceNodeRef) && !explicitlyUnresolved);
    })
    .map((record) => record.record_ref);
  const unresolvedSubfieldRefs = payload.subfield_schema_records
    .filter((record) => !interactionIds.has(stringFrom(record.metadata.runtime_interaction_id)))
    .map((record) => record.record_ref);
  const unresolvedCanonicalVariableRefs = payload.canonical_variable_map_records
    .filter((record) => {
      const interactionId = stringFrom(record.metadata.runtime_interaction_id);
      return interactionId.length > 0 && !interactionIds.has(interactionId);
    })
    .map((record) => record.record_ref);
  const semGatePresent = payload.semantic_gate_records.length > 0;
  const pstGatePresent = payload.process_state_timer_gate_records.length > 0;
  const qaRulesPresent = payload.qa_rule_records.length > 0;
  const blockers = unique([
    ...(payload.catalog_version_record ? [] : ["catalog_version_record_missing"]),
    ...(payload.catalog_version_record.runtime_spec_checksum ? [] : ["runtime_spec_checksum_missing"]),
    ...(payload.catalog_version_record.runtime_catalog_checksum ? [] : ["runtime_catalog_checksum_missing"]),
    ...(payload.catalog_version_record.mother_catalog_checksum ? [] : ["mother_catalog_checksum_missing"]),
    ...(incorrectChecksumNamesUsed(payload.catalog_version_record as unknown as Record<string, unknown>) ? ["incorrect_checksum_field_names_used"] : []),
    ...(payload.interaction_def_records.length === 60 ? [] : ["interaction_def_count_not_60"]),
    ...(baseInteractionCount(payload) === 40 ? [] : ["base_interaction_def_count_not_40"]),
    ...(causalInteractionCount(payload) === 20 ? [] : ["causal_interaction_def_count_not_20"]),
    ...traceabilityBlockers(payload),
    ...(unresolvedMappingRefs.length === 0 ? [] : ["unresolved_mapping_refs"]),
    ...(unresolvedSubfieldRefs.length === 0 ? [] : ["unresolved_subfield_refs"]),
    ...(unresolvedCanonicalVariableRefs.length === 0 ? [] : ["unresolved_canonical_variable_refs"]),
    ...(semGatePresent ? [] : ["sem_gate_missing"]),
    ...(pstGatePresent ? [] : ["pst_gate_missing"]),
    ...(qaRulesPresent ? [] : ["qa_rules_missing"]),
    ...(payload.import_audit_record ? [] : ["import_audit_record_missing"]),
    ...(payload.readiness_check.ready_for_future_persistence === true ? [] : ["payload_not_ready_for_future_persistence"]),
    ...(payload.readiness_check.ready_for_catalog_activation === false ? [] : ["payload_ready_for_catalog_activation_forbidden"]),
    ...(payload.readiness_check.ready_for_runtime_start === false ? [] : ["payload_ready_for_runtime_start_forbidden"]),
  ]);

  return {
    report_id: `runtime-40-20-import-integrity:${input.case_id}`,
    catalog_version_record_present: Boolean(payload.catalog_version_record),
    interaction_def_count: payload.interaction_def_records.length,
    base_interaction_def_count: baseInteractionCount(payload),
    causal_interaction_def_count: causalInteractionCount(payload),
    mapping_refs_checked: true,
    unresolved_mapping_refs: unresolvedMappingRefs,
    subfield_refs_checked: true,
    unresolved_subfield_refs: unresolvedSubfieldRefs,
    canonical_variable_refs_checked: true,
    unresolved_canonical_variable_refs: unresolvedCanonicalVariableRefs,
    sem_gate_present: semGatePresent,
    pst_gate_present: pstGatePresent,
    qa_rules_present: qaRulesPresent,
    integrity_passed: blockers.length === 0,
    blockers,
  };
}

function readinessCheck(
  input: RuntimeCatalogImportPersistenceDryRunInput,
  ok: boolean,
  blockers: string[],
): RuntimeCatalogImportPersistenceReadinessCheck {
  return {
    readiness_check_id: `runtime-40-20-import-persistence-readiness:${input.case_id}`,
    import_payload_consumed: input.import_payload_result.ok === true,
    schema_contract_consumed: input.persistence_schema_result.ok === true,
    dependency_order_created: true,
    dry_run_passed: ok,
    ready_for_future_persistence: ok,
    ready_for_catalog_activation: false,
    ready_for_runtime_start: false,
    migration_applied: false,
    catalog_activated: false,
    blockers,
  };
}

function noGoCheck(blockers: string[]): RuntimeCatalogImportPersistenceNoGoCheck {
  return {
    no_go_triggered: blockers.length > 0,
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

function recordCountFor(payload: RuntimeCatalogDryRunPayload, tableName: RuntimeCatalogTableName): number {
  switch (tableName) {
    case "eve_runtime_catalog_version":
      return payload.catalog_version_record ? 1 : 0;
    case "eve_runtime_source_node_ref":
      return payload.source_node_ref_records.length;
    case "eve_runtime_interaction_def":
      return payload.interaction_def_records.length;
    case "eve_runtime_interaction_mapping":
      return payload.interaction_mapping_records.length;
    case "eve_runtime_subfield_schema":
      return payload.subfield_schema_records.length;
    case "eve_runtime_canonical_variable_map":
      return payload.canonical_variable_map_records.length;
    case "eve_runtime_branching_rule":
      return payload.branching_rule_records.length;
    case "eve_runtime_critical_route":
      return payload.critical_route_records.length;
    case "eve_runtime_semantic_gate":
      return payload.semantic_gate_records.length;
    case "eve_runtime_process_state_timer_gate":
      return payload.process_state_timer_gate_records.length;
    case "eve_runtime_readiness_rule":
      return payload.readiness_rule_records.length;
    case "eve_runtime_qa_rule":
      return payload.qa_rule_records.length;
    case "eve_runtime_implementation_dictionary":
      return payload.implementation_dictionary_records.length;
    case "eve_runtime_catalog_import_audit":
      return payload.import_audit_record ? 1 : 0;
  }
}

function dependenciesFor(tableName: RuntimeCatalogTableName): RuntimeCatalogTableName[] {
  if (tableName === "eve_runtime_catalog_version") return [];
  if (tableName === "eve_runtime_interaction_mapping") {
    return ["eve_runtime_catalog_version", "eve_runtime_source_node_ref", "eve_runtime_interaction_def"];
  }
  if (["eve_runtime_subfield_schema", "eve_runtime_canonical_variable_map", "eve_runtime_branching_rule"].includes(tableName)) {
    return ["eve_runtime_catalog_version", "eve_runtime_interaction_def"];
  }
  if (tableName === "eve_runtime_catalog_import_audit") {
    return TARGET_TABLE_ORDER.filter((targetTable) => targetTable !== "eve_runtime_catalog_import_audit");
  }
  return ["eve_runtime_catalog_version"];
}

function reasonFor(tableName: RuntimeCatalogTableName): string {
  if (tableName === "eve_runtime_catalog_version") return "Catalog version must exist before dependent catalog rows.";
  if (tableName === "eve_runtime_interaction_mapping") return "Mappings require source nodes and interaction definitions first.";
  if (tableName === "eve_runtime_catalog_import_audit") return "Audit closes the dry-run after every catalog batch is simulated.";
  return "Catalog rows depend on catalog_version_ref.";
}

function blockedRecordsFrom(report: RuntimeCatalogImportReferentialIntegrityReport) {
  return [
    ...report.unresolved_mapping_refs.map((recordRef) => ({
      table_name: "eve_runtime_interaction_mapping" as RuntimeCatalogTableName,
      record_ref: recordRef,
      reason: "unresolved_mapping_refs",
    })),
    ...report.unresolved_subfield_refs.map((recordRef) => ({
      table_name: "eve_runtime_subfield_schema" as RuntimeCatalogTableName,
      record_ref: recordRef,
      reason: "unresolved_subfield_refs",
    })),
    ...report.unresolved_canonical_variable_refs.map((recordRef) => ({
      table_name: "eve_runtime_canonical_variable_map" as RuntimeCatalogTableName,
      record_ref: recordRef,
      reason: "unresolved_canonical_variable_refs",
    })),
  ];
}

function allRecordCandidates(payload: RuntimeCatalogDryRunPayload) {
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

function traceabilityBlockers(payload: RuntimeCatalogDryRunPayload): string[] {
  return allRecordCandidates(payload).some((record) => !record.source_document || !record.source_sheet || typeof record.source_row_number !== "number" || !record.raw_row)
    ? ["missing_source_traceability"]
    : [];
}

function incorrectChecksumNamesUsed(record: Record<string, unknown>): boolean {
  return "checksum_runtime_spec" in record || "checksum_runtime_catalog" in record || "checksum_mother_catalog" in record;
}

function baseInteractionCount(payload: RuntimeCatalogDryRunPayload): number {
  return payload.interaction_def_records.filter((record) => record.interaction_group === "base").length;
}

function causalInteractionCount(payload: RuntimeCatalogDryRunPayload): number {
  return payload.interaction_def_records.filter((record) => record.interaction_group === "causal").length;
}

function stringFrom(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
