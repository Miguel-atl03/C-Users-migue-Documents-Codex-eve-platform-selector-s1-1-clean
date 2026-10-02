import type {
  RuntimeExecutionCoreBoundaryCheck,
  RuntimeExecutionCoreBoundaryFlags,
} from "./runtime-40-20-execution-core-schema-types";

export const RUNTIME_40_20_EXECUTION_CORE_BOUNDARY_DEFAULTS: RuntimeExecutionCoreBoundaryFlags =
  {
    migration_applied: false,
    catalog_activated: false,
    runtime_40_20_started: false,
    supabase_touched: false,
    sql_executed: false,
    endpoint_created: false,
    real_runtime_records_created: false,
    business_evidence_created: false,
    registry_live_db_created: false,
    ir_real_created: false,
    object_inventory_real_opened: false,
    f5c_real_opened: false,
    export_created: false,
    diagnosis_created: false,
    delivered_created: false,
  };

export function assertRuntimeExecutionCoreSchemaBoundary(
  input: Partial<RuntimeExecutionCoreBoundaryFlags> = {},
): RuntimeExecutionCoreBoundaryCheck {
  const flags = {
    ...RUNTIME_40_20_EXECUTION_CORE_BOUNDARY_DEFAULTS,
    ...input,
  };
  const blockers = Object.entries(flags)
    .filter(([, value]) => value === true)
    .map(([key]) => `${key}_forbidden`);

  return {
    allowed: blockers.length === 0,
    blockers,
    flags,
  };
}
