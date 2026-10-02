export type RuntimeCatalogMigrationApplicationExecutionStatus =
  | "executed"
  | "blocked"
  | "not_run"
  | "failed";

export interface RuntimeCatalogMigrationApplicationExecutionInput {
  case_id: string;
  operator_authorization_flag: boolean;
  operator_flag_status?: RuntimeCatalogMigrationOperatorFlagStatus;
  migration_ref: "20260702121000_eve_runtime_40_20_catalog_core.sql";
  command_used?: string;
  dry_run?: boolean;
  boundary: {
    catalog_activated: false;
    runtime_40_20_started: false;
    registry_live_db_created: false;
    ir_real_created: false;
    object_inventory_real_opened: false;
    f5c_real_opened: false;
    production_parallel_real_opened: false;
    export_created: false;
    diagnosis_created: false;
    delivered_created: false;
    conformance_claimed: false;
    consistency_claimed: false;
  };
}

export interface RuntimeCatalogMigrationOperatorFlagStatus {
  operator_authorization_flag_checked: boolean;
  operator_authorization_flag_present: boolean;
  process_env_flag_read: boolean;
  env_file_read: false;
  secret_env_read: false;
  service_role_used: false;
}

export interface RuntimeCatalogMigrationApplicationExecutionResult {
  ok: boolean;
  case_id: string;
  status: RuntimeCatalogMigrationApplicationExecutionStatus;
  migration_ref: "20260702121000_eve_runtime_40_20_catalog_core.sql";
  operator_authorization_flag_checked: boolean;
  operator_authorization_flag_present: boolean;
  process_env_flag_read: boolean;
  env_file_read: false;
  secret_env_read: false;
  service_role_used: false;
  migration_application_executed: boolean;
  migration_applied: boolean;
  catalog_activated: false;
  live_db_created_now: boolean;
  command_used?: string;
  blocked_reason?: string;
  verification_required: true;
  rollback_plan_required: true;
  no_go: {
    catalog_activated: false;
    runtime_40_20_started: false;
    registry_live_db_created: false;
    ir_real_created: false;
    object_inventory_real_opened: false;
    f5c_real_opened: false;
    production_parallel_real_opened: false;
    export_created: false;
    diagnosis_created: false;
    delivered_created: false;
    conformance_claimed: false;
    consistency_claimed: false;
    env_file_read: false;
    secret_env_read: false;
    process_env_flag_read_allowed: true;
  };
  materiality: {
    level: "runtime_40_20_catalog_migration_application_execution";
    catalog_schema_application_attempted: boolean;
    catalog_schema_applied: boolean;
    catalog_activated: false;
    runtime_40_20_started: false;
    next_authorization_required: true;
  };
}
