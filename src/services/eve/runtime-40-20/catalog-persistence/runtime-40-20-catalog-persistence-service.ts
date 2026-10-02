import type {
  RuntimeCatalogPersistenceColumnContract,
  RuntimeCatalogPersistenceConstraintContract,
  RuntimeCatalogPersistenceIndexContract,
  RuntimeCatalogPersistenceInput,
  RuntimeCatalogPersistenceResult,
  RuntimeCatalogPersistenceSchemaContract,
  RuntimeCatalogPersistenceTableContract,
  RuntimeCatalogPersistenceTableName,
} from "./runtime-40-20-catalog-persistence-types";
import {
  assertRuntimeCatalogPersistenceBoundary,
} from "./runtime-40-20-catalog-persistence-boundary";

export const RUNTIME_40_20_CATALOG_TABLES: RuntimeCatalogPersistenceTableName[] = [
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

export const FORBIDDEN_EXECUTION_RUNTIME_TABLES = [
  "role_runtime_session",
  "activity_runtime_run",
  "runtime_interaction_instance",
  "runtime_subfield_response",
  "evidence_item",
  "canonical_variable_record",
  "branching_decision_runtime",
  "budget_ledger",
  "semantic_resolution_event",
  "process_state_timer_event",
  "structural_candidate_record",
  "readiness_gap_record",
  "readiness_decision_record",
  "parallel_export_payload",
  "runtime_audit_trail",
];

const MATERIALITY: RuntimeCatalogPersistenceResult["materiality"] = {
  level: "runtime_40_20_catalog_persistence_schema_contract",
  local_only: true,
  migration_creation_allowed: true,
  migration_application_allowed: false,
  catalog_activation_allowed: false,
  runtime_40_20_started: false,
  next_authorization_required: true,
};

export function createRuntimeCatalogPersistenceSchemaContract(
  input: RuntimeCatalogPersistenceInput,
): RuntimeCatalogPersistenceResult {
  const boundary = assertRuntimeCatalogPersistenceBoundary(input.boundary_flags);
  const blockers = [...preflightBlockersFor(input), ...boundary.blockers];
  const ok = blockers.length === 0;

  return {
    ok,
    case_id: input.case_id,
    canonicalization_result_consumed: input.canonicalization_result.ok === true,
    schema_contract: buildSchemaContract(),
    no_go_check: {
      no_go_triggered: !ok,
      blockers,
      ...boundary.flags,
    },
    blocked_reason: ok ? undefined : blockers[0],
    materiality: MATERIALITY,
  };
}

function preflightBlockersFor(input: RuntimeCatalogPersistenceInput): string[] {
  const result = input.canonicalization_result;
  const report = result.canonicalization_report;
  const model = result.canonical_model;
  const blockers: string[] = [];

  if (result.ok !== true) blockers.push("canonicalization_result_not_ok");
  if (report.base_interaction_count !== 40) blockers.push("base_interaction_count_not_40");
  if (report.causal_interaction_count !== 20) blockers.push("causal_interaction_count_not_20");
  if (model.interaction_definitions.length !== 60) blockers.push("interaction_definition_count_not_60");
  if (report.catalog_activation_allowed !== false) blockers.push("catalog_activation_not_blocked");

  return blockers;
}

function buildSchemaContract(): RuntimeCatalogPersistenceSchemaContract {
  return {
    migration_file: "supabase/migrations/20260702121000_eve_runtime_40_20_catalog_core.sql",
    migration_creation_allowed: true,
    migration_application_allowed: false,
    catalog_activation_allowed: false,
    runtime_catalog_tables_supported: RUNTIME_40_20_CATALOG_TABLES.length,
    authorized_tables: RUNTIME_40_20_CATALOG_TABLES,
    forbidden_execution_tables: FORBIDDEN_EXECUTION_RUNTIME_TABLES,
    checksum_contract: {
      runtime_spec_checksum: "text not null",
      runtime_catalog_checksum: "text not null",
      mother_catalog_checksum: "text not null",
      checksum_contract_aligned: true,
    },
    tables: tableContracts(),
    indexes: indexContracts(),
    constraints: constraintContracts(),
    rls_required_before_production_use: true,
    ownership_policy_required_before_production_use: true,
  };
}

function tableContracts(): RuntimeCatalogPersistenceTableContract[] {
  return [
    table("eve_runtime_catalog_version", "catalog_version", "Runtime 40/20 catalog version and activation guard.", [
      uuid("catalog_version_id"),
      text("catalog_name"),
      text("runtime_spec_version"),
      text("runtime_catalog_version"),
      text("mother_catalog_version"),
      text("catalog_status", false, "'draft'"),
      text("runtime_spec_checksum"),
      text("runtime_catalog_checksum"),
      text("mother_catalog_checksum"),
      bool("qa_passed", false, "false"),
      bool("catalog_activation_allowed", false, "false"),
      ...auditColumns(),
    ]),
    table("eve_runtime_source_node_ref", "source_node_ref", "Canonical source node references from rector catalogs.", [
      uuid("source_node_ref_id"),
      text("source_node_ref"),
      text("source_code", true),
      text("source_block", true),
      text("source_question_code", true),
      text("node_label", true),
      text("source_document_version", true),
      ...catalogTraceColumns(),
    ]),
    table("eve_runtime_interaction_def", "interaction_definition", "Base and causal Runtime 40/20 interactions.", [
      uuid("interaction_def_id"),
      text("runtime_interaction_id"),
      text("interaction_group"),
      text("visible_text"),
      text("trigger_condition", true),
      text("ui_component", true),
      bool("counts_as_base", false, "false"),
      bool("counts_as_causal", false, "false"),
      ...catalogTraceColumns(),
    ]),
    table("eve_runtime_interaction_mapping", "interaction_mapping", "Interaction to source node traceability mapping.", [
      uuid("interaction_mapping_id"),
      text("runtime_interaction_id"),
      text("source_node_ref"),
      text("mapping_role"),
      ...catalogTraceColumns(),
    ]),
    table("eve_runtime_subfield_schema", "subfield_schema", "UX subfield structure per interaction.", [
      uuid("subfield_schema_id"),
      text("runtime_interaction_id"),
      text("subfield_name"),
      bool("required", false, "true"),
      text("epistemic_policy", true),
      ...catalogTraceColumns(),
    ]),
    table("eve_runtime_canonical_variable_map", "canonical_variable_map", "Canonical variable links by interaction and route.", [
      uuid("canonical_variable_map_id"),
      text("runtime_interaction_id", true),
      text("variable_name"),
      text("route_id", true),
      bool("required", false, "false"),
      bool("derived", false, "false"),
      ...catalogTraceColumns(),
    ]),
    table("eve_runtime_branching_rule", "branching_rule", "Catalog branching and reentry rules.", [
      uuid("branching_rule_id"),
      text("rule_id", true),
      text("runtime_interaction_id", true),
      text("trigger_signal", true),
      text("reentry_target", true),
      text("budget_effect", true),
      ...catalogTraceColumns(),
    ]),
    table("eve_runtime_critical_route", "critical_route", "Critical route definitions.", [
      uuid("critical_route_pk"),
      text("route_id"),
      text("route_family"),
      textArray("required_variables", false, "array[]::text[]"),
      ...catalogTraceColumns(),
    ]),
    table("eve_runtime_semantic_gate", "semantic_gate", "Semantic resolution gate catalog.", [
      uuid("semantic_gate_pk"),
      text("gate_id"),
      text("gate_family", false, "'SEM'"),
      text("target_term", true),
      ...catalogTraceColumns(),
    ]),
    table("eve_runtime_process_state_timer_gate", "process_state_timer_gate", "Process state timer gate catalog.", [
      uuid("process_state_timer_gate_pk"),
      text("gate_id"),
      text("gate_family", false, "'PST'"),
      text("awaited_event", true),
      text("release_condition", true),
      text("timer_rule", true),
      ...catalogTraceColumns(),
    ]),
    table("eve_runtime_readiness_rule", "readiness_rule", "Readiness gap and reentry catalog rules.", [
      uuid("readiness_rule_pk"),
      text("readiness_rule_id", true),
      text("readiness_state", true),
      text("reentry_target", true),
      bool("manual_review_required", false, "false"),
      ...catalogTraceColumns(),
    ]),
    table("eve_runtime_qa_rule", "qa_rule", "Runtime catalog QA checklist rules.", [
      uuid("qa_rule_pk"),
      text("qa_id", true),
      text("qa_name", true),
      bool("blocking", false, "false"),
      ...catalogTraceColumns(),
    ]),
    table("eve_runtime_implementation_dictionary", "implementation_dictionary", "Implementation dictionary entries.", [
      uuid("implementation_dictionary_pk"),
      text("dictionary_name", true),
      text("key", true),
      text("value", true),
      ...catalogTraceColumns(),
    ]),
    table("eve_runtime_catalog_import_audit", "import_audit", "Contract audit record; not a live import execution log.", [
      uuid("catalog_import_audit_id"),
      uuid("catalog_version_id", true),
      text("import_status", false, "'contract_created'"),
      bool("canonicalization_result_consumed", false, "false"),
      bool("migration_applied", false, "false"),
      bool("catalog_activated", false, "false"),
      bool("runtime_40_20_started", false, "false"),
      bool("supabase_touched", false, "false"),
      bool("sql_executed", false, "false"),
      bool("endpoint_created", false, "false"),
      bool("execution_runtime_tables_created", false, "false"),
      bool("business_evidence_created", false, "false"),
      bool("no_go_triggered", false, "false"),
      textArray("blockers", false, "array[]::text[]"),
      text("source_document", true, undefined, true),
      text("source_sheet", true, undefined, true),
      integer("source_row_number", true, undefined, true),
      jsonb("raw_row", false, "'{}'::jsonb", true),
      ...auditColumns(),
    ]),
  ];
}

function catalogTraceColumns(): RuntimeCatalogPersistenceColumnContract[] {
  return [
    uuid("catalog_version_id"),
    text("source_document", false, undefined, true),
    text("source_sheet", false, undefined, true),
    integer("source_row_number", false, undefined, true),
    jsonb("raw_row", false, "'{}'::jsonb", true),
    ...auditColumns(),
  ];
}

function auditColumns(): RuntimeCatalogPersistenceColumnContract[] {
  return [
    timestamp("created_at", false, "now()"),
    timestamp("updated_at", false, "now()"),
    bool("active", false, "true"),
    jsonb("metadata", false, "'{}'::jsonb"),
  ];
}

function indexContracts(): RuntimeCatalogPersistenceIndexContract[] {
  const indexes: RuntimeCatalogPersistenceIndexContract[] = [];
  for (const tableName of RUNTIME_40_20_CATALOG_TABLES) {
    if (tableName !== "eve_runtime_catalog_version") {
      indexes.push(index(tableName, "catalog_version_id"));
    }
  }

  return [
    ...indexes,
    index("eve_runtime_source_node_ref", "source_node_ref"),
    index("eve_runtime_interaction_def", "runtime_interaction_id"),
    index("eve_runtime_interaction_def", "interaction_group"),
    index("eve_runtime_interaction_mapping", "runtime_interaction_id"),
    index("eve_runtime_interaction_mapping", "source_node_ref"),
    index("eve_runtime_subfield_schema", "runtime_interaction_id"),
    index("eve_runtime_canonical_variable_map", "runtime_interaction_id"),
    index("eve_runtime_canonical_variable_map", "route_id"),
    index("eve_runtime_branching_rule", "runtime_interaction_id"),
    index("eve_runtime_critical_route", "route_id"),
    index("eve_runtime_semantic_gate", "gate_id"),
    index("eve_runtime_process_state_timer_gate", "gate_id"),
    index("eve_runtime_readiness_rule", "reentry_target"),
    index("eve_runtime_qa_rule", "qa_id"),
    index("eve_runtime_implementation_dictionary", "key"),
    index("eve_runtime_catalog_import_audit", "import_status"),
  ];
}

function constraintContracts(): RuntimeCatalogPersistenceConstraintContract[] {
  return [
    constraint("eve_runtime_catalog_version_activation_blocked", "eve_runtime_catalog_version", "check", "catalog_activation_allowed = false"),
    constraint("eve_runtime_catalog_version_status_check", "eve_runtime_catalog_version", "check", "catalog_status in ('draft', 'qa_contract', 'blocked', 'retired')"),
    constraint("eve_runtime_interaction_def_group_check", "eve_runtime_interaction_def", "check", "interaction_group in ('base', 'causal')"),
    constraint("eve_runtime_interaction_def_base_check", "eve_runtime_interaction_def", "check", "base rows count only as base"),
    constraint("eve_runtime_interaction_def_causal_check", "eve_runtime_interaction_def", "check", "causal rows count only as causal"),
    constraint("eve_runtime_source_node_ref_unique", "eve_runtime_source_node_ref", "unique", "catalog_version_id, source_node_ref"),
    constraint("eve_runtime_interaction_def_unique", "eve_runtime_interaction_def", "unique", "catalog_version_id, runtime_interaction_id"),
    constraint("eve_runtime_interaction_mapping_unique", "eve_runtime_interaction_mapping", "unique", "catalog_version_id, runtime_interaction_id, source_node_ref, mapping_role"),
    constraint("eve_runtime_subfield_schema_unique", "eve_runtime_subfield_schema", "unique", "catalog_version_id, runtime_interaction_id, subfield_name"),
    constraint("eve_runtime_critical_route_unique", "eve_runtime_critical_route", "unique", "catalog_version_id, route_id"),
    constraint("eve_runtime_semantic_gate_unique", "eve_runtime_semantic_gate", "unique", "catalog_version_id, gate_id"),
    constraint("eve_runtime_process_state_timer_gate_unique", "eve_runtime_process_state_timer_gate", "unique", "catalog_version_id, gate_id"),
    constraint("eve_runtime_catalog_import_audit_migration_blocked", "eve_runtime_catalog_import_audit", "check", "migration_applied = false"),
    constraint("eve_runtime_catalog_import_audit_runtime_blocked", "eve_runtime_catalog_import_audit", "check", "runtime_40_20_started = false"),
    constraint("eve_runtime_catalog_import_audit_sql_blocked", "eve_runtime_catalog_import_audit", "check", "sql_executed = false"),
  ];
}

function table(
  tableName: RuntimeCatalogPersistenceTableName,
  tableRole: RuntimeCatalogPersistenceTableContract["table_role"],
  description: string,
  columns: RuntimeCatalogPersistenceColumnContract[],
): RuntimeCatalogPersistenceTableContract {
  return {
    table_name: tableName,
    table_role: tableRole,
    description,
    columns,
    creates_execution_runtime_state: false,
    creates_business_evidence: false,
  };
}

function index(
  tableName: RuntimeCatalogPersistenceTableName,
  columnName: string,
): RuntimeCatalogPersistenceIndexContract {
  return {
    index_name: `${tableName}_${columnName}_idx`,
    table_name: tableName,
    columns: [columnName],
  };
}

function constraint(
  constraintName: string,
  tableName: RuntimeCatalogPersistenceTableName,
  constraintKind: RuntimeCatalogPersistenceConstraintContract["constraint_kind"],
  expression: string,
): RuntimeCatalogPersistenceConstraintContract {
  return {
    constraint_name: constraintName,
    table_name: tableName,
    constraint_kind: constraintKind,
    expression,
  };
}

function uuid(
  columnName: string,
  nullable = false,
): RuntimeCatalogPersistenceColumnContract {
  return column(columnName, "uuid", nullable, false, columnName.endsWith("_id") || columnName.endsWith("_pk") ? "gen_random_uuid()" : undefined);
}

function text(
  columnName: string,
  nullable = false,
  defaultExpression?: string,
  sourceTrace = false,
): RuntimeCatalogPersistenceColumnContract {
  return column(columnName, "text", nullable, sourceTrace, defaultExpression);
}

function integer(
  columnName: string,
  nullable = false,
  defaultExpression?: string,
  sourceTrace = false,
): RuntimeCatalogPersistenceColumnContract {
  return column(columnName, "integer", nullable, sourceTrace, defaultExpression);
}

function bool(
  columnName: string,
  nullable = false,
  defaultExpression?: string,
): RuntimeCatalogPersistenceColumnContract {
  return column(columnName, "boolean", nullable, false, defaultExpression);
}

function textArray(
  columnName: string,
  nullable = false,
  defaultExpression?: string,
): RuntimeCatalogPersistenceColumnContract {
  return column(columnName, "text_array", nullable, false, defaultExpression);
}

function jsonb(
  columnName: string,
  nullable = false,
  defaultExpression?: string,
  sourceTrace = false,
): RuntimeCatalogPersistenceColumnContract {
  return column(columnName, "jsonb", nullable, sourceTrace, defaultExpression);
}

function timestamp(
  columnName: string,
  nullable = false,
  defaultExpression?: string,
): RuntimeCatalogPersistenceColumnContract {
  return column(columnName, "timestamptz", nullable, false, defaultExpression);
}

function column(
  columnName: string,
  columnKind: RuntimeCatalogPersistenceColumnContract["column_kind"],
  nullable: boolean,
  sourceTraceColumn: boolean,
  defaultExpression?: string,
): RuntimeCatalogPersistenceColumnContract {
  return {
    column_name: columnName,
    column_kind: columnKind,
    nullable,
    source_trace_column: sourceTraceColumn,
    default_expression: defaultExpression,
  };
}
