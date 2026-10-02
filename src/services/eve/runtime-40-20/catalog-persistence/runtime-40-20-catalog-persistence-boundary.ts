import type {
  RuntimeCatalogPersistenceBoundaryCheck,
  RuntimeCatalogPersistenceBoundaryFlags,
} from "./runtime-40-20-catalog-persistence-types";

export const DEFAULT_RUNTIME_CATALOG_PERSISTENCE_BOUNDARY_FLAGS: RuntimeCatalogPersistenceBoundaryFlags = {
  runtime_40_20_started: false,
  catalog_activated: false,
  migration_applied: false,
  supabase_touched: false,
  sql_executed: false,
  endpoint_created: false,
  registry_live_db_created: false,
  ir_real_created: false,
  object_inventory_real_opened: false,
  f5c_real_opened: false,
  export_created: false,
  diagnosis_created: false,
  delivered_created: false,
  execution_runtime_tables_created: false,
  business_evidence_created: false,
};

export function assertRuntimeCatalogPersistenceBoundary(
  flags: Partial<RuntimeCatalogPersistenceBoundaryFlags> = {},
): RuntimeCatalogPersistenceBoundaryCheck {
  const merged = {
    ...DEFAULT_RUNTIME_CATALOG_PERSISTENCE_BOUNDARY_FLAGS,
    ...flags,
  };
  const blockers = Object.entries(merged)
    .filter(([, value]) => value === true)
    .map(([key]) => `${key}_forbidden`);

  return {
    allowed: blockers.length === 0,
    blockers,
    flags: merged,
  };
}

