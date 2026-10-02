import type {
  RuntimeCatalogLiveDBApplicationDecisionCandidate,
  RuntimeCatalogMigrationApplicationNoGoCheck,
  RuntimeCatalogMigrationAuthorizationGateInput,
  RuntimeCatalogMigrationAuthorizationGateResult,
  RuntimeCatalogMigrationPreconditionsCheck,
  RuntimeCatalogMigrationRollbackReadinessCheck,
  RuntimeCatalogMigrationSafetyChecklist,
  RuntimeCatalogRLSOwnershipReadinessCheck,
  RuntimeCatalogSupabaseExecutionBoundaryCheck,
} from "./runtime-40-20-catalog-migration-authorization-gate-types";

const EXPECTED_RUNTIME_CATALOG_TABLE_COUNT = 14;

const NO_GO: RuntimeCatalogMigrationApplicationNoGoCheck = {
  no_go_check_id: "runtime_40_20_catalog_migration_application_no_go",
  migration_applied: false,
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

export function runRuntimeCatalogMigrationAuthorizationGate(
  input: RuntimeCatalogMigrationAuthorizationGateInput,
): RuntimeCatalogMigrationAuthorizationGateResult {
  const blockers = preconditionBlockers(input);
  const ok = blockers.length === 0;
  const preconditionsCheck = preconditionsCheckFor(input, blockers);

  return {
    ok,
    case_id: input.case_id,
    preconditions_check: preconditionsCheck,
    migration_safety_checklist: migrationSafetyChecklistFor(input),
    supabase_execution_boundary_check: supabaseExecutionBoundaryCheck(),
    rls_ownership_readiness_check: rlsOwnershipReadinessCheck(),
    migration_rollback_readiness_check: migrationRollbackReadinessCheck(),
    live_db_application_decision_candidate: liveDbDecisionCandidate(ok),
    migration_application_no_go_check: NO_GO,
    blocked_reason: ok ? undefined : blockers[0],
    no_go: noGoProjection(),
    materiality: {
      level: "runtime_40_20_catalog_migration_application_authorization_gate",
      local_only: true,
      authorization_gate_only: true,
      migration_applied: false,
      catalog_activated: false,
      runtime_40_20_started: false,
      next_authorization_required: true,
    },
  };
}

function preconditionBlockers(
  input: RuntimeCatalogMigrationAuthorizationGateInput,
): string[] {
  const schema = input.schema_contract_traceability;
  const checksum = input.checksum_alignment_traceability;
  const blockers: string[] = [];

  if (schema.schema_contract_created !== true) blockers.push("schema_contract_not_created");
  if (schema.migration_draft_created !== true) blockers.push("migration_draft_not_created");
  if (schema.runtime_catalog_tables_supported !== EXPECTED_RUNTIME_CATALOG_TABLE_COUNT) {
    blockers.push("runtime_catalog_table_count_not_14");
  }
  if (schema.execution_runtime_tables_created !== false) {
    blockers.push("execution_runtime_tables_created_forbidden");
  }
  if (schema.business_evidence_created !== false) {
    blockers.push("business_evidence_created_forbidden");
  }
  if (checksum.checksum_contract_aligned !== true) blockers.push("checksum_contract_not_aligned");
  if (checksum.incorrect_field_names_removed !== true) {
    blockers.push("incorrect_checksum_field_names_not_removed");
  }
  if (checksum.runtime_spec_checksum !== "text not null") blockers.push("runtime_spec_checksum_not_text_not_null");
  if (checksum.runtime_catalog_checksum !== "text not null") blockers.push("runtime_catalog_checksum_not_text_not_null");
  if (checksum.mother_catalog_checksum !== "text not null") blockers.push("mother_catalog_checksum_not_text_not_null");
  if (schema.migration_applied !== false || checksum.migration_applied !== false) {
    blockers.push("migration_already_applied_forbidden");
  }
  if (schema.catalog_activated !== false || checksum.catalog_activated !== false) {
    blockers.push("catalog_already_activated_forbidden");
  }
  if (schema.runtime_40_20_started !== false || checksum.runtime_40_20_started !== false) {
    blockers.push("runtime_40_20_already_started_forbidden");
  }
  if (schema.supabase_touched !== false || checksum.supabase_touched !== false) {
    blockers.push("supabase_already_touched_forbidden");
  }
  if (schema.sql_executed !== false || checksum.sql_executed !== false) {
    blockers.push("sql_already_executed_forbidden");
  }
  if (schema.endpoint_created !== false || checksum.endpoint_created !== false) {
    blockers.push("endpoint_already_created_forbidden");
  }

  return blockers;
}

function preconditionsCheckFor(
  input: RuntimeCatalogMigrationAuthorizationGateInput,
  blockers: string[],
): RuntimeCatalogMigrationPreconditionsCheck {
  const schema = input.schema_contract_traceability;
  const checksum = input.checksum_alignment_traceability;

  return {
    check_id: "runtime_40_20_catalog_migration_preconditions",
    schema_contract_created: schema.schema_contract_created,
    migration_draft_created: schema.migration_draft_created,
    checksum_contract_aligned: checksum.checksum_contract_aligned,
    incorrect_checksum_field_names_removed: checksum.incorrect_field_names_removed,
    runtime_catalog_tables_supported: schema.runtime_catalog_tables_supported,
    expected_runtime_catalog_tables_supported: EXPECTED_RUNTIME_CATALOG_TABLE_COUNT,
    execution_runtime_tables_created: false,
    business_evidence_created: false,
    migration_already_applied: false,
    catalog_already_activated: false,
    runtime_40_20_already_started: false,
    supabase_already_touched: false,
    sql_already_executed: false,
    endpoint_already_created: false,
    ready_for_authorization_review: blockers.length === 0,
    blockers,
  };
}

function migrationSafetyChecklistFor(
  input: RuntimeCatalogMigrationAuthorizationGateInput,
): RuntimeCatalogMigrationSafetyChecklist {
  const checksum = input.checksum_alignment_traceability;

  return {
    checklist_id: "runtime_40_20_catalog_migration_safety",
    migration_file_present: input.schema_contract_traceability.migration_draft_created === true,
    expected_table_count: EXPECTED_RUNTIME_CATALOG_TABLE_COUNT,
    checksum_fields_aligned:
      checksum.checksum_contract_aligned === true &&
      checksum.runtime_spec_checksum === "text not null" &&
      checksum.runtime_catalog_checksum === "text not null" &&
      checksum.mother_catalog_checksum === "text not null",
    destructive_operations_detected: false,
    execution_runtime_tables_detected: false,
    business_evidence_tables_detected: false,
    rls_review_required: true,
    ownership_review_required: true,
    backup_required_before_application: true,
    rollback_required_before_application: true,
    manual_operator_required: true,
    safe_to_apply_now: false,
    reason: "Gate only prepares later human authorization; it does not apply the migration.",
  };
}

function supabaseExecutionBoundaryCheck(): RuntimeCatalogSupabaseExecutionBoundaryCheck {
  return {
    boundary_check_id: "runtime_40_20_catalog_supabase_execution_boundary",
    supabase_touch_allowed_now: false,
    env_read_allowed_now: false,
    service_role_allowed_now: false,
    sql_execution_allowed_now: false,
    migration_application_allowed_now: false,
    catalog_activation_allowed_now: false,
    endpoint_creation_allowed_now: false,
    reason: "authorization_gate_only_no_live_execution",
  };
}

function rlsOwnershipReadinessCheck(): RuntimeCatalogRLSOwnershipReadinessCheck {
  return {
    rls_ownership_check_id: "runtime_40_20_catalog_rls_ownership_readiness",
    rls_required_before_production_use: true,
    ownership_required_before_production_use: true,
    security_review_required: true,
    rls_policy_created_now: false,
    ownership_policy_created_now: false,
    production_use_allowed_now: false,
    blockers: [],
  };
}

function migrationRollbackReadinessCheck(): RuntimeCatalogMigrationRollbackReadinessCheck {
  return {
    rollback_check_id: "runtime_40_20_catalog_migration_rollback_readiness",
    rollback_plan_required: true,
    rollback_plan_present: false,
    rollback_script_created_now: false,
    rollback_executed_now: false,
    rollback_ready_for_review: false,
    blockers: [],
  };
}

function liveDbDecisionCandidate(
  ok: boolean,
): RuntimeCatalogLiveDBApplicationDecisionCandidate {
  return {
    decision_id: "runtime_40_20_catalog_live_db_application_decision_candidate",
    decision_candidate: ok ? "authorize_later_with_explicit_human_approval" : "blocked",
    migration_application_executed: false,
    catalog_activated_now: false,
    live_db_created_now: false,
    requires_explicit_human_approval_next: true,
    reason: ok
      ? "Preconditions allow a later explicit human authorization review; no live execution is allowed now."
      : "Preconditions are incomplete or a forbidden boundary was crossed.",
  };
}

function noGoProjection(): RuntimeCatalogMigrationAuthorizationGateResult["no_go"] {
  return {
    migration_applied: false,
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
}

