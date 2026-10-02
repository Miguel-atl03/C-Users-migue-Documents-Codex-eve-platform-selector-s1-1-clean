export type RuntimeCatalogMigrationApplicationDecisionCandidate =
  | "authorize_later_with_explicit_human_approval"
  | "manual_review_required"
  | "blocked";

export interface RuntimeCatalogMigrationPreconditionsCheck {
  check_id: string;
  schema_contract_created: boolean;
  migration_draft_created: boolean;
  checksum_contract_aligned: boolean;
  incorrect_checksum_field_names_removed: boolean;
  runtime_catalog_tables_supported: number;
  expected_runtime_catalog_tables_supported: 14;
  execution_runtime_tables_created: false;
  business_evidence_created: false;
  migration_already_applied: false;
  catalog_already_activated: false;
  runtime_40_20_already_started: false;
  supabase_already_touched: false;
  sql_already_executed: false;
  endpoint_already_created: false;
  ready_for_authorization_review: boolean;
  blockers: string[];
}

export interface RuntimeCatalogMigrationSafetyChecklist {
  checklist_id: string;
  migration_file_present: boolean;
  expected_table_count: 14;
  checksum_fields_aligned: boolean;
  destructive_operations_detected: boolean;
  execution_runtime_tables_detected: boolean;
  business_evidence_tables_detected: boolean;
  rls_review_required: true;
  ownership_review_required: true;
  backup_required_before_application: true;
  rollback_required_before_application: true;
  manual_operator_required: true;
  safe_to_apply_now: false;
  reason: string;
}

export interface RuntimeCatalogSupabaseExecutionBoundaryCheck {
  boundary_check_id: string;
  supabase_touch_allowed_now: false;
  env_read_allowed_now: false;
  service_role_allowed_now: false;
  sql_execution_allowed_now: false;
  migration_application_allowed_now: false;
  catalog_activation_allowed_now: false;
  endpoint_creation_allowed_now: false;
  reason: "authorization_gate_only_no_live_execution";
}

export interface RuntimeCatalogRLSOwnershipReadinessCheck {
  rls_ownership_check_id: string;
  rls_required_before_production_use: true;
  ownership_required_before_production_use: true;
  security_review_required: true;
  rls_policy_created_now: false;
  ownership_policy_created_now: false;
  production_use_allowed_now: false;
  blockers: string[];
}

export interface RuntimeCatalogMigrationRollbackReadinessCheck {
  rollback_check_id: string;
  rollback_plan_required: true;
  rollback_plan_present: boolean;
  rollback_script_created_now: false;
  rollback_executed_now: false;
  rollback_ready_for_review: boolean;
  blockers: string[];
}

export interface RuntimeCatalogLiveDBApplicationDecisionCandidate {
  decision_id: string;
  decision_candidate: RuntimeCatalogMigrationApplicationDecisionCandidate;
  migration_application_executed: false;
  catalog_activated_now: false;
  live_db_created_now: false;
  requires_explicit_human_approval_next: true;
  reason: string;
}

export interface RuntimeCatalogMigrationApplicationNoGoCheck {
  no_go_check_id: string;
  migration_applied: false;
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

export interface RuntimeCatalogMigrationAuthorizationGateInput {
  case_id: string;
  schema_contract_traceability: {
    schema_contract_created: boolean;
    migration_draft_created: boolean;
    migration_applied: false;
    catalog_activated: false;
    runtime_40_20_started: false;
    supabase_touched: false;
    sql_executed: false;
    endpoint_created: false;
    runtime_catalog_tables_supported: number;
    execution_runtime_tables_created: false;
    business_evidence_created: false;
  };
  checksum_alignment_traceability: {
    checksum_contract_aligned: boolean;
    incorrect_field_names_removed: boolean;
    runtime_spec_checksum: "text not null";
    runtime_catalog_checksum: "text not null";
    mother_catalog_checksum: "text not null";
    migration_applied: false;
    catalog_activated: false;
    runtime_40_20_started: false;
    supabase_touched: false;
    sql_executed: false;
    endpoint_created: false;
  };
  options?: {
    version?: string;
  };
}

export interface RuntimeCatalogMigrationAuthorizationGateResult {
  ok: boolean;
  case_id: string;
  preconditions_check: RuntimeCatalogMigrationPreconditionsCheck;
  migration_safety_checklist: RuntimeCatalogMigrationSafetyChecklist;
  supabase_execution_boundary_check: RuntimeCatalogSupabaseExecutionBoundaryCheck;
  rls_ownership_readiness_check: RuntimeCatalogRLSOwnershipReadinessCheck;
  migration_rollback_readiness_check: RuntimeCatalogMigrationRollbackReadinessCheck;
  live_db_application_decision_candidate: RuntimeCatalogLiveDBApplicationDecisionCandidate;
  migration_application_no_go_check: RuntimeCatalogMigrationApplicationNoGoCheck;
  blocked_reason?: string;
  no_go: {
    migration_applied: false;
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
    level: "runtime_40_20_catalog_migration_application_authorization_gate";
    local_only: true;
    authorization_gate_only: true;
    migration_applied: false;
    catalog_activated: false;
    runtime_40_20_started: false;
    next_authorization_required: true;
  };
}

