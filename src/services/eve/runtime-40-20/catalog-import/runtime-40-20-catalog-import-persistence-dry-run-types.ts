import type {
  RuntimeCatalogImportPayload,
  RuntimeCatalogImportPayloadBuilderResult,
} from "./runtime-40-20-catalog-import-payload-types";
import type {
  RuntimeCatalogPersistenceResult,
  RuntimeCatalogPersistenceTableName as RuntimeCatalogTableName,
} from "../catalog-persistence/runtime-40-20-catalog-persistence-types";

export type { RuntimeCatalogTableName };

export type RuntimeCatalogImportDryRunStatus =
  | "passed"
  | "blocked"
  | "manual_review_required";

export interface RuntimeCatalogImportDependencyOrderStep {
  order: number;
  table_name: RuntimeCatalogTableName;
  reason: string;
}

export interface RuntimeCatalogImportTableBatchPlan {
  table_name: RuntimeCatalogTableName;
  record_count: number;
  dry_run_insert_allowed: true;
  real_insert_allowed: false;
  dependencies: RuntimeCatalogTableName[];
}

export interface RuntimeCatalogImportPersistencePlan {
  plan_id: string;
  case_id: string;
  target_tables_count: 14;
  dependency_order: RuntimeCatalogImportDependencyOrderStep[];
  table_batch_plans: RuntimeCatalogImportTableBatchPlan[];
  real_persistence_allowed: false;
  migration_required_before_real_persistence: true;
}

export interface RuntimeCatalogImportDryRunAdapterContract {
  adapter_id: string;
  adapter_type: "in_memory_dry_run";
  supports_batch_insert_simulation: true;
  supports_dependency_validation: true;
  supports_rollback_simulation: true;
  touches_database: false;
  touches_supabase: false;
  executes_sql: false;
}

export interface RuntimeCatalogImportInMemoryDryRunResult {
  dry_run_id: string;
  status: RuntimeCatalogImportDryRunStatus;
  simulated_tables: RuntimeCatalogTableName[];
  simulated_record_count: number;
  blocked_records: Array<{
    table_name: RuntimeCatalogTableName;
    record_ref: string;
    reason: string;
  }>;
  rollback_simulated: boolean;
  real_records_inserted: false;
}

export interface RuntimeCatalogImportReferentialIntegrityReport {
  report_id: string;
  catalog_version_record_present: boolean;
  interaction_def_count: number;
  base_interaction_def_count: number;
  causal_interaction_def_count: number;
  mapping_refs_checked: boolean;
  unresolved_mapping_refs: string[];
  subfield_refs_checked: boolean;
  unresolved_subfield_refs: string[];
  canonical_variable_refs_checked: boolean;
  unresolved_canonical_variable_refs: string[];
  sem_gate_present: boolean;
  pst_gate_present: boolean;
  qa_rules_present: boolean;
  integrity_passed: boolean;
  blockers: string[];
}

export interface RuntimeCatalogImportPersistenceReadinessCheck {
  readiness_check_id: string;
  import_payload_consumed: boolean;
  schema_contract_consumed: boolean;
  dependency_order_created: boolean;
  dry_run_passed: boolean;
  ready_for_future_persistence: boolean;
  ready_for_catalog_activation: false;
  ready_for_runtime_start: false;
  migration_applied: false;
  catalog_activated: false;
  blockers: string[];
}

export interface RuntimeCatalogImportPersistenceNoGoCheck {
  no_go_triggered: boolean;
  blockers: string[];
  migration_applied: false;
  catalog_activated: false;
  runtime_40_20_started: false;
  supabase_touched: false;
  sql_executed: false;
  endpoint_created: false;
  registry_live_db_created: false;
  ir_real_created: false;
  object_inventory_real_opened: false;
  f5c_real_opened: false;
  export_created: false;
  diagnosis_created: false;
  delivered_created: false;
}

export interface RuntimeCatalogImportPersistenceDryRunInput {
  case_id: string;
  import_payload_result: RuntimeCatalogImportPayloadBuilderResult;
  persistence_schema_result: RuntimeCatalogPersistenceResult;
  options?: {
    version?: string;
  };
}

export interface RuntimeCatalogImportPersistenceDryRunResult {
  ok: boolean;
  case_id: string;
  persistence_plan: RuntimeCatalogImportPersistencePlan;
  dry_run_adapter_contract: RuntimeCatalogImportDryRunAdapterContract;
  dry_run_result: RuntimeCatalogImportInMemoryDryRunResult;
  referential_integrity_report: RuntimeCatalogImportReferentialIntegrityReport;
  readiness_check: RuntimeCatalogImportPersistenceReadinessCheck;
  no_go_check: RuntimeCatalogImportPersistenceNoGoCheck;
  blocked_reason?: string;
  materiality: {
    level: "runtime_40_20_catalog_import_persistence_dry_run_adapter";
    local_only: true;
    real_persistence_allowed: false;
    migration_applied: false;
    catalog_activated: false;
    runtime_40_20_started: false;
    next_authorization_required: true;
  };
}

export type RuntimeCatalogDryRunPayload = RuntimeCatalogImportPayload;

