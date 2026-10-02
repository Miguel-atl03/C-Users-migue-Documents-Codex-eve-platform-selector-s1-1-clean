import type {
  RuntimeCatalogCanonicalizationResult,
} from "../catalog-canonicalization/runtime-40-20-catalog-canonicalization-types";

export type RuntimeCatalogPersistenceTableName =
  | "eve_runtime_catalog_version"
  | "eve_runtime_source_node_ref"
  | "eve_runtime_interaction_def"
  | "eve_runtime_interaction_mapping"
  | "eve_runtime_subfield_schema"
  | "eve_runtime_canonical_variable_map"
  | "eve_runtime_branching_rule"
  | "eve_runtime_critical_route"
  | "eve_runtime_semantic_gate"
  | "eve_runtime_process_state_timer_gate"
  | "eve_runtime_readiness_rule"
  | "eve_runtime_qa_rule"
  | "eve_runtime_implementation_dictionary"
  | "eve_runtime_catalog_import_audit";

export type RuntimeCatalogPersistenceRole =
  | "catalog_version"
  | "source_node_ref"
  | "interaction_definition"
  | "interaction_mapping"
  | "subfield_schema"
  | "canonical_variable_map"
  | "branching_rule"
  | "critical_route"
  | "semantic_gate"
  | "process_state_timer_gate"
  | "readiness_rule"
  | "qa_rule"
  | "implementation_dictionary"
  | "import_audit";

export type RuntimeCatalogPersistenceColumnKind =
  | "uuid"
  | "text"
  | "integer"
  | "boolean"
  | "text_array"
  | "jsonb"
  | "timestamptz";

export type RuntimeCatalogPersistenceConstraintKind =
  | "primary_key"
  | "foreign_key"
  | "unique"
  | "not_null"
  | "check";

export interface RuntimeCatalogPersistenceColumnContract {
  column_name: string;
  column_kind: RuntimeCatalogPersistenceColumnKind;
  nullable: boolean;
  source_trace_column: boolean;
  default_expression?: string;
}

export interface RuntimeCatalogPersistenceTableContract {
  table_name: RuntimeCatalogPersistenceTableName;
  table_role: RuntimeCatalogPersistenceRole;
  description: string;
  columns: RuntimeCatalogPersistenceColumnContract[];
  creates_execution_runtime_state: false;
  creates_business_evidence: false;
}

export interface RuntimeCatalogPersistenceIndexContract {
  index_name: string;
  table_name: RuntimeCatalogPersistenceTableName;
  columns: string[];
}

export interface RuntimeCatalogPersistenceConstraintContract {
  constraint_name: string;
  table_name: RuntimeCatalogPersistenceTableName;
  constraint_kind: RuntimeCatalogPersistenceConstraintKind;
  expression: string;
}

export interface RuntimeCatalogChecksumContract {
  runtime_spec_checksum: string;
  runtime_catalog_checksum: string;
  mother_catalog_checksum: string;
  checksum_contract_aligned: boolean;
}

export interface RuntimeCatalogPersistenceBoundaryFlags {
  runtime_40_20_started: boolean;
  catalog_activated: boolean;
  migration_applied: boolean;
  supabase_touched: boolean;
  sql_executed: boolean;
  endpoint_created: boolean;
  registry_live_db_created: boolean;
  ir_real_created: boolean;
  object_inventory_real_opened: boolean;
  f5c_real_opened: boolean;
  export_created: boolean;
  diagnosis_created: boolean;
  delivered_created: boolean;
  execution_runtime_tables_created: boolean;
  business_evidence_created: boolean;
}

export interface RuntimeCatalogPersistenceBoundaryCheck {
  allowed: boolean;
  blockers: string[];
  flags: RuntimeCatalogPersistenceBoundaryFlags;
}

export interface RuntimeCatalogPersistenceSchemaContract {
  migration_file: "supabase/migrations/20260702121000_eve_runtime_40_20_catalog_core.sql";
  migration_creation_allowed: true;
  migration_application_allowed: false;
  catalog_activation_allowed: false;
  runtime_catalog_tables_supported: number;
  authorized_tables: RuntimeCatalogPersistenceTableName[];
  forbidden_execution_tables: string[];
  checksum_contract: RuntimeCatalogChecksumContract;
  tables: RuntimeCatalogPersistenceTableContract[];
  indexes: RuntimeCatalogPersistenceIndexContract[];
  constraints: RuntimeCatalogPersistenceConstraintContract[];
  rls_required_before_production_use: true;
  ownership_policy_required_before_production_use: true;
}

export interface RuntimeCatalogPersistenceInput {
  case_id: string;
  canonicalization_result: RuntimeCatalogCanonicalizationResult;
  boundary_flags?: Partial<RuntimeCatalogPersistenceBoundaryFlags>;
}

export interface RuntimeCatalogPersistenceNoGoCheck extends RuntimeCatalogPersistenceBoundaryFlags {
  no_go_triggered: boolean;
  blockers: string[];
}

export interface RuntimeCatalogPersistenceResult {
  ok: boolean;
  case_id: string;
  canonicalization_result_consumed: boolean;
  schema_contract: RuntimeCatalogPersistenceSchemaContract;
  no_go_check: RuntimeCatalogPersistenceNoGoCheck;
  blocked_reason?: string;
  materiality: {
    level: "runtime_40_20_catalog_persistence_schema_contract";
    local_only: true;
    migration_creation_allowed: true;
    migration_application_allowed: false;
    catalog_activation_allowed: false;
    runtime_40_20_started: false;
    next_authorization_required: true;
  };
}
