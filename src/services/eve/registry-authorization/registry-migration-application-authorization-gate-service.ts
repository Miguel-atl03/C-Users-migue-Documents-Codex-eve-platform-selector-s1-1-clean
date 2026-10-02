import type {
  LiveDBApplicationDecisionCandidate,
  MigrationApplicationNoGoCheck,
  MigrationApplicationPreconditionsCheck,
  MigrationApplicationDecisionCandidate,
  MigrationRollbackReadinessCheck,
  MigrationSafetyChecklist,
  RegistryMigrationApplicationAuthorizationGateInput,
  RegistryMigrationApplicationAuthorizationGateResult,
  RLSOwnershipReadinessCheck,
  SupabaseExecutionBoundaryCheck,
} from "./registry-migration-application-authorization-gate-types";

const NO_GO: RegistryMigrationApplicationAuthorizationGateResult["no_go"] = {
  migration_applied: false,
  supabase_touched: false,
  env_read: false,
  service_role_used: false,
  sql_executed: false,
  endpoint_created: false,
  runtime_40_20_started: false,
  ir_real_created: false,
  object_inventory_real_opened: false,
  f5c_real_opened: false,
  production_parallel_real_opened: false,
  export_created: false,
  diagnosis_created: false,
  delivered_created: false,
  conformance_claimed: false,
  consistency_claimed: false,
};

export function runRegistryMigrationApplicationAuthorizationGate(
  input: RegistryMigrationApplicationAuthorizationGateInput,
): RegistryMigrationApplicationAuthorizationGateResult {
  const blockers = validateInput(input);
  const ok = blockers.length === 0;
  const decisionCandidate: MigrationApplicationDecisionCandidate = ok
    ? "authorize_later_with_explicit_human_approval"
    : "blocked";

  return {
    ok,
    case_id: input.case_id,
    preconditions_check: buildPreconditionsCheck(input, ok, blockers),
    migration_safety_checklist: buildMigrationSafetyChecklist(input),
    supabase_execution_boundary_check: buildSupabaseBoundaryCheck(input),
    rls_ownership_readiness_check: buildRlsOwnershipCheck(input),
    migration_rollback_readiness_check: buildRollbackReadinessCheck(input, ok),
    live_db_application_decision_candidate: buildDecisionCandidate(
      input,
      decisionCandidate,
      ok,
    ),
    migration_application_no_go_check: buildNoGoCheck(input),
    blocked_reason: ok ? undefined : blockers.join(";"),
    no_go: NO_GO,
    materiality: {
      level: "registry_real_minimal_migration_application_authorization_gate",
      local_only: true,
      authorization_gate_only: true,
      migration_applied: false,
      next_authorization_required: true,
    },
  };
}

function validateInput(
  input: RegistryMigrationApplicationAuthorizationGateInput,
): string[] {
  const promotion = input.registry_controlled_promotion_traceability;
  const contract = input.contract_alignment_traceability;
  const blockers: string[] = [];

  if (promotion.registry_real_minimal_created_in_code !== true) {
    blockers.push("registry_real_minimal_not_created_in_code");
  }
  if (promotion.registry_real_minimal_applied_to_live_db !== false) {
    blockers.push("registry_real_minimal_already_applied_to_live_db");
  }
  if (promotion.migration_created !== true) {
    blockers.push("migration_not_created");
  }
  if (promotion.migration_applied !== false || contract.migration_applied !== false) {
    blockers.push("migration_already_applied");
  }
  if (promotion.supabase_touched !== false || contract.supabase_touched !== false) {
    blockers.push("supabase_already_touched");
  }
  if (promotion.env_read !== false || contract.env_read !== false) {
    blockers.push("env_already_read");
  }
  if (contract.service_sql_contract_aligned !== true) {
    blockers.push("service_sql_contract_not_aligned");
  }
  if (contract.registry_id_contract !== "uuid") {
    blockers.push("registry_id_contract_not_uuid");
  }
  if (contract.created_by_required !== true) {
    blockers.push("created_by_not_required");
  }

  return blockers;
}

function buildPreconditionsCheck(
  input: RegistryMigrationApplicationAuthorizationGateInput,
  ok: boolean,
  blockers: string[],
): MigrationApplicationPreconditionsCheck {
  const promotion = input.registry_controlled_promotion_traceability;
  const contract = input.contract_alignment_traceability;

  return {
    check_id: `REGISTRY_MIGRATION_APPLICATION_PRECONDITIONS:${input.case_id}`,
    registry_package_created_in_code:
      promotion.registry_real_minimal_created_in_code,
    sql_service_contract_aligned: contract.service_sql_contract_aligned,
    registry_id_contract_uuid: contract.registry_id_contract === "uuid",
    created_by_required: contract.created_by_required,
    migration_exists: promotion.migration_created,
    migration_already_applied: false,
    supabase_already_touched: false,
    ready_for_authorization_review: ok,
    blockers,
  };
}

function buildMigrationSafetyChecklist(
  input: RegistryMigrationApplicationAuthorizationGateInput,
): MigrationSafetyChecklist {
  return {
    checklist_id: `REGISTRY_MIGRATION_SAFETY_CHECKLIST:${input.case_id}`,
    migration_file_present:
      input.registry_controlled_promotion_traceability.migration_created,
    destructive_operations_detected: false,
    rls_review_required: true,
    backup_required_before_application: true,
    rollback_required_before_application: true,
    manual_operator_required: true,
    safe_to_apply_now: false,
    reason:
      "Authorization gate only: migration requires explicit human approval, backup, rollback review, and RLS/ownership review before any live application.",
  };
}

function buildSupabaseBoundaryCheck(
  input: RegistryMigrationApplicationAuthorizationGateInput,
): SupabaseExecutionBoundaryCheck {
  return {
    boundary_check_id: `REGISTRY_MIGRATION_SUPABASE_BOUNDARY:${input.case_id}`,
    supabase_touch_allowed_now: false,
    env_read_allowed_now: false,
    service_role_allowed_now: false,
    sql_execution_allowed_now: false,
    migration_application_allowed_now: false,
    endpoint_creation_allowed_now: false,
    reason: "authorization_gate_only_no_live_execution",
  };
}

function buildRlsOwnershipCheck(
  input: RegistryMigrationApplicationAuthorizationGateInput,
): RLSOwnershipReadinessCheck {
  return {
    rls_ownership_check_id: `REGISTRY_MIGRATION_RLS_OWNERSHIP:${input.case_id}`,
    rls_required_before_production_use: true,
    ownership_required_before_production_use: true,
    security_review_required: true,
    rls_policy_created_now: false,
    ownership_policy_created_now: false,
    production_use_allowed_now: false,
    blockers: ["rls_policy_not_created_now", "ownership_policy_not_created_now"],
  };
}

function buildRollbackReadinessCheck(
  input: RegistryMigrationApplicationAuthorizationGateInput,
  ok: boolean,
): MigrationRollbackReadinessCheck {
  return {
    rollback_check_id: `REGISTRY_MIGRATION_ROLLBACK_READINESS:${input.case_id}`,
    rollback_plan_required: true,
    rollback_plan_present: ok,
    rollback_script_created_now: false,
    rollback_executed_now: false,
    rollback_ready_for_review: ok,
    blockers: ok ? [] : ["preconditions_not_met"],
  };
}

function buildDecisionCandidate(
  input: RegistryMigrationApplicationAuthorizationGateInput,
  decisionCandidate: MigrationApplicationDecisionCandidate,
  ok: boolean,
): LiveDBApplicationDecisionCandidate {
  return {
    decision_id: `REGISTRY_MIGRATION_LIVE_DB_DECISION:${input.case_id}`,
    decision_candidate: decisionCandidate,
    migration_application_executed: false,
    live_db_created_now: false,
    requires_explicit_human_approval_next: true,
    reason: ok
      ? "Migration application may be reviewed later with explicit human approval; no live execution is allowed in this gate."
      : "Migration application authorization gate is blocked by failed preconditions.",
  };
}

function buildNoGoCheck(
  input: RegistryMigrationApplicationAuthorizationGateInput,
): MigrationApplicationNoGoCheck {
  return {
    no_go_check_id: `REGISTRY_MIGRATION_APPLICATION_NO_GO:${input.case_id}`,
    migration_applied: false,
    supabase_touched: false,
    env_read: false,
    service_role_used: false,
    sql_executed: false,
    endpoint_created: false,
    runtime_40_20_started: false,
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
