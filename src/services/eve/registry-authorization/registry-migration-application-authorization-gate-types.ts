export type MigrationApplicationDecisionCandidate =
  | "authorize_later_with_explicit_human_approval"
  | "manual_review_required"
  | "blocked";

export interface MigrationApplicationPreconditionsCheck {
  check_id: string;
  registry_package_created_in_code: boolean;
  sql_service_contract_aligned: boolean;
  registry_id_contract_uuid: boolean;
  created_by_required: boolean;
  migration_exists: boolean;
  migration_already_applied: false;
  supabase_already_touched: false;
  ready_for_authorization_review: boolean;
  blockers: string[];
}

export interface MigrationSafetyChecklist {
  checklist_id: string;
  migration_file_present: boolean;
  destructive_operations_detected: boolean;
  rls_review_required: true;
  backup_required_before_application: true;
  rollback_required_before_application: true;
  manual_operator_required: true;
  safe_to_apply_now: false;
  reason: string;
}

export interface SupabaseExecutionBoundaryCheck {
  boundary_check_id: string;
  supabase_touch_allowed_now: false;
  env_read_allowed_now: false;
  service_role_allowed_now: false;
  sql_execution_allowed_now: false;
  migration_application_allowed_now: false;
  endpoint_creation_allowed_now: false;
  reason: "authorization_gate_only_no_live_execution";
}

export interface RLSOwnershipReadinessCheck {
  rls_ownership_check_id: string;
  rls_required_before_production_use: true;
  ownership_required_before_production_use: true;
  security_review_required: true;
  rls_policy_created_now: false;
  ownership_policy_created_now: false;
  production_use_allowed_now: false;
  blockers: string[];
}

export interface MigrationRollbackReadinessCheck {
  rollback_check_id: string;
  rollback_plan_required: true;
  rollback_plan_present: boolean;
  rollback_script_created_now: false;
  rollback_executed_now: false;
  rollback_ready_for_review: boolean;
  blockers: string[];
}

export interface LiveDBApplicationDecisionCandidate {
  decision_id: string;
  decision_candidate: MigrationApplicationDecisionCandidate;
  migration_application_executed: false;
  live_db_created_now: false;
  requires_explicit_human_approval_next: true;
  reason: string;
}

export interface MigrationApplicationNoGoCheck {
  no_go_check_id: string;
  migration_applied: false;
  supabase_touched: false;
  env_read: false;
  service_role_used: false;
  sql_executed: false;
  endpoint_created: false;
  runtime_40_20_started: false;
  ir_real_created: false;
  object_inventory_real_opened: false;
  f5c_real_opened: false;
  export_created: false;
  diagnosis_created: false;
  delivered_created: false;
  conformance_claimed: false;
  consistency_claimed: false;
}

export interface RegistryMigrationApplicationAuthorizationGateInput {
  case_id: string;
  registry_controlled_promotion_traceability: {
    registry_real_minimal_created_in_code: boolean;
    registry_real_minimal_applied_to_live_db: false;
    migration_created: boolean;
    migration_applied: false;
    supabase_touched: false;
    env_read: false;
  };
  contract_alignment_traceability: {
    service_sql_contract_aligned: boolean;
    registry_id_contract: "uuid";
    created_by_required: boolean;
    migration_applied: false;
    supabase_touched: false;
    env_read: false;
  };
  options?: {
    version?: string;
  };
}

export interface RegistryMigrationApplicationAuthorizationGateResult {
  ok: boolean;
  case_id: string;
  preconditions_check: MigrationApplicationPreconditionsCheck;
  migration_safety_checklist: MigrationSafetyChecklist;
  supabase_execution_boundary_check: SupabaseExecutionBoundaryCheck;
  rls_ownership_readiness_check: RLSOwnershipReadinessCheck;
  migration_rollback_readiness_check: MigrationRollbackReadinessCheck;
  live_db_application_decision_candidate: LiveDBApplicationDecisionCandidate;
  migration_application_no_go_check: MigrationApplicationNoGoCheck;
  blocked_reason?: string;
  no_go: {
    migration_applied: false;
    supabase_touched: false;
    env_read: false;
    service_role_used: false;
    sql_executed: false;
    endpoint_created: false;
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
    level: "registry_real_minimal_migration_application_authorization_gate";
    local_only: true;
    authorization_gate_only: true;
    migration_applied: false;
    next_authorization_required: true;
  };
}
