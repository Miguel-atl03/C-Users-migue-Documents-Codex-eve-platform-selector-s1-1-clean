export type RegistryMigrationApplicationExecutionStatus =
  | "executed"
  | "blocked"
  | "not_run"
  | "failed";

export interface RegistryMigrationApplicationExecutionInput {
  case_id: string;
  operator_authorization_flag: boolean;
  migration_ref: "20260702120000_eve_registry_real_minimal.sql";
  command_used?: string;
  dry_run?: boolean;
  boundary: {
    runtime_40_20_started: false;
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

export interface RegistryMigrationApplicationExecutionResult {
  ok: boolean;
  case_id: string;
  status: RegistryMigrationApplicationExecutionStatus;
  migration_ref: "20260702120000_eve_registry_real_minimal.sql";
  migration_application_executed: boolean;
  live_db_created_now: boolean;
  command_used?: string;
  blocked_reason?: string;
  verification_required: true;
  rollback_plan_required: true;
  no_go: {
    runtime_40_20_started: false;
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
  materiality: {
    level: "registry_real_minimal_migration_application_execution";
    registry_live_db_application_attempted: boolean;
    registry_live_db_created: boolean;
    runtime_40_20_started: false;
    next_authorization_required: true;
  };
}
