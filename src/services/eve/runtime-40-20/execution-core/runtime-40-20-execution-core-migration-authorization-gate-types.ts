export type RuntimeExecutionCoreMigrationDecisionCandidate =
  | "authorize_later_with_explicit_human_approval"
  | "blocked_until_catalog_schema_migration_applied"
  | "manual_review_required"
  | "blocked";

export interface RuntimeExecutionCoreMigrationPreconditionsCheck {
  check_id: string;
  execution_core_schema_contract_created: boolean;
  execution_core_migration_draft_created: boolean;
  execution_core_tables_supported: number;
  expected_execution_core_tables_supported: 15;
  catalog_core_dependency_declared: boolean;
  catalog_migration_required_before_runtime_start: true;
  catalog_activation_required_before_runtime_start: true;
  execution_core_migration_already_applied: false;
  runtime_40_20_already_started: false;
  supabase_already_touched: false;
  sql_already_executed: false;
  endpoint_already_created: false;
  ready_for_authorization_review: boolean;
  blockers: string[];
}

export interface CatalogCoreDependencyCheck {
  check_id: string;
  catalog_schema_migration_applied: boolean;
  catalog_activated: boolean;
  catalog_import_dry_run_ready: boolean;
  catalog_dependency_satisfied_for_execution_schema_application: boolean;
  catalog_dependency_satisfied_for_runtime_start: boolean;
  blockers: string[];
}

export interface RuntimeExecutionCoreMigrationSafetyChecklist {
  checklist_id: string;
  migration_file_present: boolean;
  expected_table_count: 15;
  catalog_core_tables_detected: false;
  registry_ir_object_inventory_f5c_tables_detected: false;
  destructive_operations_detected: boolean;
  real_runtime_records_created: false;
  business_evidence_created: false;
  rls_review_required: true;
  ownership_review_required: true;
  backup_required_before_application: true;
  rollback_required_before_application: true;
  manual_operator_required: true;
  safe_to_apply_now: false;
  reason: string;
}

export interface RuntimeExecutionCoreSupabaseExecutionBoundaryCheck {
  boundary_check_id: string;
  supabase_touch_allowed_now: false;
  env_read_allowed_now: false;
  service_role_allowed_now: false;
  sql_execution_allowed_now: false;
  migration_application_allowed_now: false;
  runtime_40_20_start_allowed_now: false;
  endpoint_creation_allowed_now: false;
  reason: "authorization_gate_only_no_live_execution";
}

export interface RuntimeExecutionCoreRLSOwnershipReadinessCheck {
  rls_ownership_check_id: string;
  rls_required_before_production_use: true;
  ownership_required_before_production_use: true;
  security_review_required: true;
  rls_policy_created_now: false;
  ownership_policy_created_now: false;
  production_use_allowed_now: false;
  blockers: string[];
}

export interface RuntimeExecutionCoreRollbackReadinessCheck {
  rollback_check_id: string;
  rollback_plan_required: true;
  rollback_plan_present: boolean;
  rollback_script_created_now: false;
  rollback_executed_now: false;
  rollback_ready_for_review: boolean;
  blockers: string[];
}

export interface RuntimeExecutionCoreLiveDBApplicationDecisionCandidate {
  decision_id: string;
  decision_candidate: RuntimeExecutionCoreMigrationDecisionCandidate;
  migration_application_executed: false;
  execution_core_migration_applied_now: false;
  live_db_created_now: false;
  requires_explicit_human_approval_next: true;
  reason: string;
}

export interface RuntimeExecutionCoreMigrationApplicationNoGoCheck {
  no_go_check_id: string;
  execution_core_migration_applied: false;
  catalog_activated: false;
  supabase_touched: false;
  env_read: false;
  service_role_used: false;
  sql_executed: false;
  endpoint_created: false;
  runtime_40_20_started: false;
  registry_live_db_created: false;
  ir_real_created: false;
  object_inventory_real_opened: false;
  f5c_real_opened: false;
  export_created: false;
  diagnosis_created: false;
  delivered_created: false;
  conformance_claimed: false;
  consistency_claimed: false;
}

export interface RuntimeExecutionCoreMigrationAuthorizationGateInput {
  case_id: string;
  execution_core_schema_traceability: {
    schema_contract_created: boolean;
    migration_draft_created: boolean;
    execution_core_tables_supported: number;
    catalog_core_dependency_declared: boolean;
    catalog_migration_required_before_runtime_start: true;
    catalog_activation_required_before_runtime_start: true;
    migration_applied: false;
    catalog_activated: false;
    runtime_40_20_started: false;
    supabase_touched: false;
    sql_executed: false;
    endpoint_created: false;
    real_runtime_records_created: false;
    business_evidence_created: false;
  };
  catalog_dependency_traceability: {
    catalog_import_dry_run_ready: boolean;
    catalog_schema_migration_applied: boolean;
    catalog_activated: boolean;
    supabase_touched: boolean;
    sql_executed: boolean;
  };
  options?: {
    version?: string;
  };
}

export interface RuntimeExecutionCoreMigrationAuthorizationGateResult {
  ok: boolean;
  case_id: string;
  preconditions_check: RuntimeExecutionCoreMigrationPreconditionsCheck;
  catalog_core_dependency_check: CatalogCoreDependencyCheck;
  migration_safety_checklist: RuntimeExecutionCoreMigrationSafetyChecklist;
  supabase_execution_boundary_check: RuntimeExecutionCoreSupabaseExecutionBoundaryCheck;
  rls_ownership_readiness_check: RuntimeExecutionCoreRLSOwnershipReadinessCheck;
  rollback_readiness_check: RuntimeExecutionCoreRollbackReadinessCheck;
  live_db_application_decision_candidate: RuntimeExecutionCoreLiveDBApplicationDecisionCandidate;
  migration_application_no_go_check: RuntimeExecutionCoreMigrationApplicationNoGoCheck;
  blocked_reason?: string;
  no_go: {
    execution_core_migration_applied: false;
    catalog_activated: false;
    supabase_touched: false;
    env_read: false;
    service_role_used: false;
    sql_executed: false;
    endpoint_created: false;
    runtime_40_20_started: false;
    registry_live_db_created: false;
    ir_real_created: false;
    object_inventory_real_opened: false;
    f5c_real_opened: false;
    export_created: false;
    diagnosis_created: false;
    delivered_created: false;
    conformance_claimed: false;
    consistency_claimed: false;
  };
  materiality: {
    level: "runtime_40_20_execution_core_migration_application_authorization_gate";
    local_only: true;
    authorization_gate_only: true;
    execution_core_migration_applied: false;
    runtime_40_20_started: false;
    next_authorization_required: true;
  };
}
