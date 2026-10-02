import type {
  CatalogCoreDependencyCheck,
  RuntimeExecutionCoreLiveDBApplicationDecisionCandidate,
  RuntimeExecutionCoreMigrationApplicationNoGoCheck,
  RuntimeExecutionCoreMigrationAuthorizationGateInput,
  RuntimeExecutionCoreMigrationAuthorizationGateResult,
  RuntimeExecutionCoreMigrationDecisionCandidate,
  RuntimeExecutionCoreMigrationPreconditionsCheck,
  RuntimeExecutionCoreMigrationSafetyChecklist,
  RuntimeExecutionCoreRLSOwnershipReadinessCheck,
  RuntimeExecutionCoreRollbackReadinessCheck,
  RuntimeExecutionCoreSupabaseExecutionBoundaryCheck,
} from "./runtime-40-20-execution-core-migration-authorization-gate-types";

const NO_GO: RuntimeExecutionCoreMigrationApplicationNoGoCheck = {
  no_go_check_id: "execution_core_migration_application_no_go",
  execution_core_migration_applied: false,
  catalog_activated: false,
  supabase_touched: false,
  env_read: false,
  service_role_used: false,
  sql_executed: false,
  endpoint_created: false,
  runtime_40_20_started: false,
  registry_live_db_created: false,
  ir_real_created: false,
  object_inventory_real_opened: false,
  f5c_real_opened: false,
  export_created: false,
  diagnosis_created: false,
  delivered_created: false,
  conformance_claimed: false,
  consistency_claimed: false,
};

export function runRuntimeExecutionCoreMigrationAuthorizationGate(
  input: RuntimeExecutionCoreMigrationAuthorizationGateInput,
): RuntimeExecutionCoreMigrationAuthorizationGateResult {
  const preconditionsCheck = createPreconditionsCheck(input);
  const catalogCoreDependencyCheck = createCatalogCoreDependencyCheck(input);
  const migrationSafetyChecklist = createMigrationSafetyChecklist(input);
  const supabaseExecutionBoundaryCheck = createSupabaseExecutionBoundaryCheck();
  const rlsOwnershipReadinessCheck = createRlsOwnershipReadinessCheck();
  const rollbackReadinessCheck = createRollbackReadinessCheck(
    catalogCoreDependencyCheck.catalog_schema_migration_applied,
  );
  const decisionCandidate = decide(catalogCoreDependencyCheck, preconditionsCheck);
  const liveDbApplicationDecisionCandidate =
    createLiveDbApplicationDecisionCandidate(decisionCandidate);
  const blockers = [
    ...preconditionsCheck.blockers,
    ...catalogCoreDependencyCheck.blockers,
  ];

  return {
    ok: true,
    case_id: input.case_id,
    preconditions_check: preconditionsCheck,
    catalog_core_dependency_check: catalogCoreDependencyCheck,
    migration_safety_checklist: migrationSafetyChecklist,
    supabase_execution_boundary_check: supabaseExecutionBoundaryCheck,
    rls_ownership_readiness_check: rlsOwnershipReadinessCheck,
    rollback_readiness_check: rollbackReadinessCheck,
    live_db_application_decision_candidate: liveDbApplicationDecisionCandidate,
    migration_application_no_go_check: NO_GO,
    blocked_reason:
      decisionCandidate === "blocked_until_catalog_schema_migration_applied"
        ? "catalog_schema_migration_not_applied"
        : blockers[0],
    no_go: NO_GO,
    materiality: {
      level: "runtime_40_20_execution_core_migration_application_authorization_gate",
      local_only: true,
      authorization_gate_only: true,
      execution_core_migration_applied: false,
      runtime_40_20_started: false,
      next_authorization_required: true,
    },
  };
}

function createPreconditionsCheck(
  input: RuntimeExecutionCoreMigrationAuthorizationGateInput,
): RuntimeExecutionCoreMigrationPreconditionsCheck {
  const trace = input.execution_core_schema_traceability;
  const blockers: string[] = [];

  if (!trace.schema_contract_created) blockers.push("schema_contract_not_created");
  if (!trace.migration_draft_created) blockers.push("migration_draft_not_created");
  if (trace.execution_core_tables_supported !== 15) {
    blockers.push("execution_core_table_count_not_15");
  }
  if (!trace.catalog_core_dependency_declared) {
    blockers.push("catalog_core_dependency_not_declared");
  }
  if (trace.catalog_migration_required_before_runtime_start !== true) {
    blockers.push("catalog_migration_requirement_missing");
  }
  if (trace.catalog_activation_required_before_runtime_start !== true) {
    blockers.push("catalog_activation_requirement_missing");
  }
  if (trace.migration_applied !== false) {
    blockers.push("execution_core_migration_already_applied");
  }
  if (trace.runtime_40_20_started !== false) {
    blockers.push("runtime_40_20_already_started");
  }
  if (trace.supabase_touched !== false) blockers.push("supabase_already_touched");
  if (trace.sql_executed !== false) blockers.push("sql_already_executed");
  if (trace.endpoint_created !== false) blockers.push("endpoint_already_created");
  if (trace.real_runtime_records_created !== false) {
    blockers.push("real_runtime_records_already_created");
  }
  if (trace.business_evidence_created !== false) {
    blockers.push("business_evidence_already_created");
  }

  return {
    check_id: "execution_core_migration_preconditions",
    execution_core_schema_contract_created: trace.schema_contract_created,
    execution_core_migration_draft_created: trace.migration_draft_created,
    execution_core_tables_supported: trace.execution_core_tables_supported,
    expected_execution_core_tables_supported: 15,
    catalog_core_dependency_declared: trace.catalog_core_dependency_declared,
    catalog_migration_required_before_runtime_start: true,
    catalog_activation_required_before_runtime_start: true,
    execution_core_migration_already_applied: false,
    runtime_40_20_already_started: false,
    supabase_already_touched: false,
    sql_already_executed: false,
    endpoint_already_created: false,
    ready_for_authorization_review: blockers.length === 0,
    blockers,
  };
}

function createCatalogCoreDependencyCheck(
  input: RuntimeExecutionCoreMigrationAuthorizationGateInput,
): CatalogCoreDependencyCheck {
  const trace = input.catalog_dependency_traceability;
  const blockers: string[] = [];

  if (!trace.catalog_import_dry_run_ready) {
    blockers.push("catalog_import_dry_run_not_ready");
  }
  if (!trace.catalog_schema_migration_applied) {
    blockers.push("catalog_schema_migration_not_applied");
  }
  if (trace.supabase_touched) blockers.push("catalog_dependency_supabase_touched");
  if (trace.sql_executed) blockers.push("catalog_dependency_sql_executed");

  return {
    check_id: "catalog_core_dependency",
    catalog_schema_migration_applied: trace.catalog_schema_migration_applied,
    catalog_activated: trace.catalog_activated,
    catalog_import_dry_run_ready: trace.catalog_import_dry_run_ready,
    catalog_dependency_satisfied_for_execution_schema_application:
      trace.catalog_schema_migration_applied,
    catalog_dependency_satisfied_for_runtime_start:
      trace.catalog_schema_migration_applied && trace.catalog_activated,
    blockers,
  };
}

function createMigrationSafetyChecklist(
  input: RuntimeExecutionCoreMigrationAuthorizationGateInput,
): RuntimeExecutionCoreMigrationSafetyChecklist {
  const catalogApplied =
    input.catalog_dependency_traceability.catalog_schema_migration_applied;

  return {
    checklist_id: "execution_core_migration_safety",
    migration_file_present: input.execution_core_schema_traceability.migration_draft_created,
    expected_table_count: 15,
    catalog_core_tables_detected: false,
    registry_ir_object_inventory_f5c_tables_detected: false,
    destructive_operations_detected: false,
    real_runtime_records_created: false,
    business_evidence_created: false,
    rls_review_required: true,
    ownership_review_required: true,
    backup_required_before_application: true,
    rollback_required_before_application: true,
    manual_operator_required: true,
    safe_to_apply_now: false,
    reason: catalogApplied
      ? "Authorization gate only: explicit human approval, RLS/ownership review, backup, and rollback remain required."
      : "Catalog Core schema migration must be applied before reviewing Execution Core schema application.",
  };
}

function createSupabaseExecutionBoundaryCheck(): RuntimeExecutionCoreSupabaseExecutionBoundaryCheck {
  return {
    boundary_check_id: "execution_core_supabase_execution_boundary",
    supabase_touch_allowed_now: false,
    env_read_allowed_now: false,
    service_role_allowed_now: false,
    sql_execution_allowed_now: false,
    migration_application_allowed_now: false,
    runtime_40_20_start_allowed_now: false,
    endpoint_creation_allowed_now: false,
    reason: "authorization_gate_only_no_live_execution",
  };
}

function createRlsOwnershipReadinessCheck(): RuntimeExecutionCoreRLSOwnershipReadinessCheck {
  return {
    rls_ownership_check_id: "execution_core_rls_ownership_readiness",
    rls_required_before_production_use: true,
    ownership_required_before_production_use: true,
    security_review_required: true,
    rls_policy_created_now: false,
    ownership_policy_created_now: false,
    production_use_allowed_now: false,
    blockers: ["rls_review_required", "ownership_review_required"],
  };
}

function createRollbackReadinessCheck(
  catalogApplied: boolean,
): RuntimeExecutionCoreRollbackReadinessCheck {
  return {
    rollback_check_id: "execution_core_rollback_readiness",
    rollback_plan_required: true,
    rollback_plan_present: false,
    rollback_script_created_now: false,
    rollback_executed_now: false,
    rollback_ready_for_review: false,
    blockers: catalogApplied
      ? ["rollback_plan_required_before_application"]
      : [
          "catalog_schema_migration_not_applied",
          "rollback_plan_required_before_application",
        ],
  };
}

function decide(
  catalogCheck: CatalogCoreDependencyCheck,
  preconditions: RuntimeExecutionCoreMigrationPreconditionsCheck,
): RuntimeExecutionCoreMigrationDecisionCandidate {
  if (preconditions.blockers.length > 0) return "blocked";
  if (!catalogCheck.catalog_schema_migration_applied) {
    return "blocked_until_catalog_schema_migration_applied";
  }
  return "authorize_later_with_explicit_human_approval";
}

function createLiveDbApplicationDecisionCandidate(
  decisionCandidate: RuntimeExecutionCoreMigrationDecisionCandidate,
): RuntimeExecutionCoreLiveDBApplicationDecisionCandidate {
  return {
    decision_id: "execution_core_live_db_application_decision_candidate",
    decision_candidate: decisionCandidate,
    migration_application_executed: false,
    execution_core_migration_applied_now: false,
    live_db_created_now: false,
    requires_explicit_human_approval_next: true,
    reason:
      decisionCandidate === "blocked_until_catalog_schema_migration_applied"
        ? "Catalog Core schema migration is not applied, so Execution Core migration cannot be authorized yet."
        : "This tramo only creates the local authorization gate; live execution still requires explicit human approval.",
  };
}
