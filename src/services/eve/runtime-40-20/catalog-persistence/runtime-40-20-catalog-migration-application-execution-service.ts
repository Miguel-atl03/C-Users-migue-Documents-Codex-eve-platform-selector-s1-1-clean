import type {
  RuntimeCatalogMigrationApplicationExecutionInput,
  RuntimeCatalogMigrationApplicationExecutionResult,
  RuntimeCatalogMigrationOperatorFlagStatus,
} from "./runtime-40-20-catalog-migration-application-execution-types";
import {
  assertRuntimeCatalogMigrationApplicationExecutionBoundary,
} from "./runtime-40-20-catalog-migration-application-execution-boundary";

const MIGRATION_REF = "20260702121000_eve_runtime_40_20_catalog_core.sql";

export function readRuntimeCatalogMigrationOperatorFlag(): RuntimeCatalogMigrationOperatorFlagStatus {
  const value = process.env.EVE_ALLOW_RUNTIME_CATALOG_MIGRATION_APPLICATION;

  return {
    operator_authorization_flag_checked: true,
    operator_authorization_flag_present: value === "true",
    process_env_flag_read: true,
    env_file_read: false,
    secret_env_read: false,
    service_role_used: false,
  };
}

export function createRuntimeCatalogMigrationApplicationExecutionReport(
  input: RuntimeCatalogMigrationApplicationExecutionInput,
): RuntimeCatalogMigrationApplicationExecutionResult {
  const operatorFlagStatus = input.operator_flag_status ?? {
    operator_authorization_flag_checked: true,
    operator_authorization_flag_present: input.operator_authorization_flag === true,
    process_env_flag_read: false,
    env_file_read: false,
    secret_env_read: false,
    service_role_used: false,
  };
  const effectiveOperatorFlagStatus = {
    ...operatorFlagStatus,
    operator_authorization_flag_present:
      input.operator_authorization_flag === true &&
      operatorFlagStatus.operator_authorization_flag_present === true,
  };
  const boundaryCheck = assertRuntimeCatalogMigrationApplicationExecutionBoundary({
    operator_authorization_flag: input.operator_authorization_flag,
    ...effectiveOperatorFlagStatus,
    ...input.boundary,
  });
  const blockedReason = boundaryCheck.blockers[0];
  const dryRun = input.dry_run === true;
  const commandDocumented = typeof input.command_used === "string" && input.command_used.trim().length > 0;
  const executed = boundaryCheck.ok && !dryRun && commandDocumented;
  const status = statusFor(boundaryCheck.ok, dryRun, commandDocumented);

  return {
    ok: boundaryCheck.ok,
    case_id: input.case_id,
    status,
    migration_ref: input.migration_ref,
    operator_authorization_flag_checked: effectiveOperatorFlagStatus.operator_authorization_flag_checked,
    operator_authorization_flag_present: effectiveOperatorFlagStatus.operator_authorization_flag_present,
    process_env_flag_read: effectiveOperatorFlagStatus.process_env_flag_read,
    env_file_read: false,
    secret_env_read: false,
    service_role_used: false,
    migration_application_executed: executed,
    migration_applied: executed,
    catalog_activated: false,
    live_db_created_now: executed,
    command_used: input.command_used,
    blocked_reason: boundaryCheck.ok ? undefined : blockedReason,
    verification_required: true,
    rollback_plan_required: true,
    no_go: noGo(),
    materiality: {
      level: "runtime_40_20_catalog_migration_application_execution",
      catalog_schema_application_attempted: executed,
      catalog_schema_applied: executed,
      catalog_activated: false,
      runtime_40_20_started: false,
      next_authorization_required: true,
    },
  };
}

export function runtimeCatalogMigrationExecutionInputForCurrentEnvironment(caseId: string): RuntimeCatalogMigrationApplicationExecutionInput {
  const operatorFlagStatus = readRuntimeCatalogMigrationOperatorFlag();

  return {
    case_id: caseId,
    operator_authorization_flag: operatorFlagStatus.operator_authorization_flag_present,
    operator_flag_status: operatorFlagStatus,
    migration_ref: MIGRATION_REF,
    dry_run: true,
    boundary: noGo(),
  };
}

function statusFor(
  boundaryOk: boolean,
  dryRun: boolean,
  commandDocumented: boolean,
): RuntimeCatalogMigrationApplicationExecutionResult["status"] {
  if (!boundaryOk) return "blocked";
  if (dryRun) return "not_run";
  if (commandDocumented) return "executed";
  return "not_run";
}

function noGo(): RuntimeCatalogMigrationApplicationExecutionResult["no_go"] {
  return {
    catalog_activated: false,
    runtime_40_20_started: false,
    registry_live_db_created: false,
    ir_real_created: false,
    object_inventory_real_opened: false,
    f5c_real_opened: false,
    production_parallel_real_opened: false,
    export_created: false,
    diagnosis_created: false,
    delivered_created: false,
    conformance_claimed: false,
    consistency_claimed: false,
    env_file_read: false,
    secret_env_read: false,
    process_env_flag_read_allowed: true,
  };
}
