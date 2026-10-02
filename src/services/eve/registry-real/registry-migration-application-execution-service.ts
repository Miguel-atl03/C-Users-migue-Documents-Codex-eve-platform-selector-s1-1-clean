import { assertRegistryMigrationApplicationExecutionBoundary } from "./registry-migration-application-execution-boundary";
import type {
  RegistryMigrationApplicationExecutionInput,
  RegistryMigrationApplicationExecutionResult,
  RegistryMigrationApplicationExecutionStatus,
} from "./registry-migration-application-execution-types";

const NO_GO: RegistryMigrationApplicationExecutionResult["no_go"] = {
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

export function createRegistryMigrationApplicationExecutionReport(
  input: RegistryMigrationApplicationExecutionInput,
): RegistryMigrationApplicationExecutionResult {
  const boundary = assertRegistryMigrationApplicationExecutionBoundary({
    operator_authorization_flag: input.operator_authorization_flag,
    ...input.boundary,
  });

  if (!boundary.ok) {
    return buildResult({
      input,
      ok: false,
      status: "blocked",
      migrationApplicationExecuted: false,
      liveDbCreatedNow: false,
      blockedReason: boundary.blockers.join(";"),
    });
  }

  if (input.dry_run === true || !input.command_used) {
    return buildResult({
      input,
      ok: true,
      status: "not_run",
      migrationApplicationExecuted: false,
      liveDbCreatedNow: false,
    });
  }

  return buildResult({
    input,
    ok: true,
    status: "executed",
    migrationApplicationExecuted: true,
    liveDbCreatedNow: true,
  });
}

function buildResult(params: {
  input: RegistryMigrationApplicationExecutionInput;
  ok: boolean;
  status: RegistryMigrationApplicationExecutionStatus;
  migrationApplicationExecuted: boolean;
  liveDbCreatedNow: boolean;
  blockedReason?: string;
}): RegistryMigrationApplicationExecutionResult {
  return {
    ok: params.ok,
    case_id: params.input.case_id,
    status: params.status,
    migration_ref: params.input.migration_ref,
    migration_application_executed: params.migrationApplicationExecuted,
    live_db_created_now: params.liveDbCreatedNow,
    command_used: params.input.command_used,
    blocked_reason: params.blockedReason,
    verification_required: true,
    rollback_plan_required: true,
    no_go: NO_GO,
    materiality: {
      level: "registry_real_minimal_migration_application_execution",
      registry_live_db_application_attempted: params.migrationApplicationExecuted,
      registry_live_db_created: params.liveDbCreatedNow,
      runtime_40_20_started: false,
      next_authorization_required: true,
    },
  };
}
