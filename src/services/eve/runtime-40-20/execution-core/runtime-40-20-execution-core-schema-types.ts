export type RuntimeExecutionCoreSchemaStatus = "ready" | "blocked";

export type RuntimeExecutionCoreTableName =
  | "eve_role_runtime_session"
  | "eve_activity_runtime_run"
  | "eve_runtime_interaction_instance"
  | "eve_runtime_subfield_response"
  | "eve_evidence_item"
  | "eve_canonical_variable_record"
  | "eve_runtime_branching_decision"
  | "eve_runtime_budget_ledger"
  | "eve_semantic_resolution_event"
  | "eve_process_state_timer_event"
  | "eve_structural_candidate_record"
  | "eve_readiness_gap_record"
  | "eve_readiness_decision_record"
  | "eve_parallel_export_payload"
  | "eve_runtime_audit_trail";

export interface RuntimeExecutionCoreTableManifestItem {
  table_name: RuntimeExecutionCoreTableName;
  purpose: string;
  creates_catalog_core_table: false;
  creates_real_runtime_record: false;
  creates_business_evidence: false;
}

export interface RuntimeExecutionCoreColumnManifestItem {
  table_name: RuntimeExecutionCoreTableName;
  column_name: string;
  column_type: string;
  nullable: boolean;
  default_expression?: string;
}

export interface RuntimeExecutionCoreIndexManifestItem {
  index_name: string;
  table_name: RuntimeExecutionCoreTableName;
  columns: string[];
}

export interface RuntimeExecutionCoreConstraintManifestItem {
  constraint_name: string;
  table_name: RuntimeExecutionCoreTableName;
  expression: string;
}

export interface RuntimeExecutionCoreBoundaryFlags {
  migration_applied: boolean;
  catalog_activated: boolean;
  runtime_40_20_started: boolean;
  supabase_touched: boolean;
  sql_executed: boolean;
  endpoint_created: boolean;
  real_runtime_records_created: boolean;
  business_evidence_created: boolean;
  registry_live_db_created: boolean;
  ir_real_created: boolean;
  object_inventory_real_opened: boolean;
  f5c_real_opened: boolean;
  export_created: boolean;
  diagnosis_created: boolean;
  delivered_created: boolean;
}

export interface RuntimeExecutionCoreBoundaryCheck {
  allowed: boolean;
  blockers: string[];
  flags: RuntimeExecutionCoreBoundaryFlags;
}

export interface RuntimeExecutionCoreNoGoCheck
  extends RuntimeExecutionCoreBoundaryFlags {
  no_go_triggered: boolean;
  blockers: string[];
}

export interface RuntimeExecutionCoreSchemaContract {
  migration_file: "supabase/migrations/20260702122000_eve_runtime_40_20_execution_core.sql";
  migration_created: true;
  migration_applied: false;
  migration_creation_allowed: true;
  migration_application_allowed: false;
  catalog_core_dependency_declared: true;
  catalog_migration_required_before_runtime_start: true;
  catalog_activation_required_before_runtime_start: true;
  catalog_activation_allowed: false;
  runtime_40_20_start_allowed: false;
  execution_core_tables_supported: 15;
  authorized_tables: RuntimeExecutionCoreTableName[];
  forbidden_catalog_core_tables: string[];
  tables: RuntimeExecutionCoreTableManifestItem[];
  columns: RuntimeExecutionCoreColumnManifestItem[];
  indexes: RuntimeExecutionCoreIndexManifestItem[];
  constraints: RuntimeExecutionCoreConstraintManifestItem[];
  rls_required_before_production_use: true;
  ownership_policy_required_before_production_use: true;
}

export interface RuntimeExecutionCoreSchemaInput {
  case_id: string;
  catalog_import_dry_run_ready: boolean;
  catalog_migration_applied: boolean;
  catalog_activated: boolean;
  runtime_40_20_started: boolean;
  boundary_flags?: Partial<RuntimeExecutionCoreBoundaryFlags>;
}

export interface RuntimeExecutionCoreSchemaResult {
  ok: boolean;
  case_id: string;
  status: RuntimeExecutionCoreSchemaStatus;
  schema_contract: RuntimeExecutionCoreSchemaContract;
  no_go_check: RuntimeExecutionCoreNoGoCheck;
  blocked_reason?: string;
  materiality: {
    level: "runtime_40_20_execution_core_schema_contract";
    local_only: true;
    migration_creation_allowed: true;
    migration_application_allowed: false;
    catalog_activation_allowed: false;
    runtime_40_20_started: false;
    next_authorization_required: true;
  };
}
