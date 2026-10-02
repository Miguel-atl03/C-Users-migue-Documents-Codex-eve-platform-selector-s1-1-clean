import type {
  RuntimeCatalogCanonicalizationResult,
  RuntimeCanonicalTrace,
} from "../catalog-canonicalization/runtime-40-20-catalog-canonicalization-types";
import type {
  RuntimeCatalogPersistenceResult,
  RuntimeCatalogPersistenceTableName,
} from "../catalog-persistence/runtime-40-20-catalog-persistence-types";

export type RuntimeCatalogTableName = RuntimeCatalogPersistenceTableName;

export type RuntimeCatalogImportPayloadStatus =
  | "draft_import_payload"
  | "blocked"
  | "manual_review_required";

export interface RuntimeCatalogRecordTrace {
  source_document: string;
  source_sheet: string;
  source_row_number: number;
  raw_row: Record<string, unknown>;
}

export interface RuntimeCatalogVersionRecordCandidate {
  catalog_version_ref: string;
  runtime_spec_version: "v1.0.1";
  runtime_catalog_version: "v1.1.1";
  mother_catalog_version: "1.0";
  runtime_spec_checksum: string;
  runtime_catalog_checksum: string;
  mother_catalog_checksum: string;
  qa_passed: true;
  catalog_activation_allowed: false;
  status: "draft_import_payload";
  metadata: Record<string, unknown>;
}

export interface RuntimeCatalogGenericRecordCandidate extends RuntimeCatalogRecordTrace {
  target_table: RuntimeCatalogTableName;
  record_ref: string;
  catalog_version_ref: string;
  active: boolean;
  metadata: Record<string, unknown>;
}

export interface RuntimeInteractionDefRecordCandidate extends RuntimeCatalogGenericRecordCandidate {
  target_table: "eve_runtime_interaction_def";
  runtime_interaction_id: string;
  interaction_group: "base" | "causal";
  visible_text: string;
  counts_as_base: boolean;
  counts_as_causal: boolean;
  catalog_activation_allowed: false;
}

export interface RuntimeCatalogImportAuditRecordCandidate {
  audit_ref: string;
  catalog_version_ref: string;
  action: "catalog_import_payload_built";
  source_documents_referenced: [
    "EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx",
    "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
    "EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx",
  ];
  runtime_40_20_started: false;
  catalog_activated: false;
  migration_applied: false;
  metadata: Record<string, unknown>;
}

export interface RuntimeCatalogImportReadinessCheck {
  canonical_model_consumed: boolean;
  schema_contract_consumed: boolean;
  checksum_contract_aligned: boolean;
  migration_applied: false;
  catalog_activated: false;
  ready_for_future_persistence: boolean;
  ready_for_catalog_activation: false;
  ready_for_runtime_start: false;
  blockers: string[];
}

export interface RuntimeCatalogImportNoGoCheck {
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

export interface RuntimeCatalogImportPayload {
  payload_id: string;
  case_id: string;
  status: RuntimeCatalogImportPayloadStatus;
  catalog_version_record: RuntimeCatalogVersionRecordCandidate;
  interaction_def_records: RuntimeInteractionDefRecordCandidate[];
  source_node_ref_records: RuntimeCatalogGenericRecordCandidate[];
  interaction_mapping_records: RuntimeCatalogGenericRecordCandidate[];
  subfield_schema_records: RuntimeCatalogGenericRecordCandidate[];
  canonical_variable_map_records: RuntimeCatalogGenericRecordCandidate[];
  branching_rule_records: RuntimeCatalogGenericRecordCandidate[];
  critical_route_records: RuntimeCatalogGenericRecordCandidate[];
  semantic_gate_records: RuntimeCatalogGenericRecordCandidate[];
  process_state_timer_gate_records: RuntimeCatalogGenericRecordCandidate[];
  readiness_rule_records: RuntimeCatalogGenericRecordCandidate[];
  qa_rule_records: RuntimeCatalogGenericRecordCandidate[];
  implementation_dictionary_records: RuntimeCatalogGenericRecordCandidate[];
  import_audit_record: RuntimeCatalogImportAuditRecordCandidate;
  readiness_check: RuntimeCatalogImportReadinessCheck;
}

export interface RuntimeCatalogImportPayloadBuilderInput {
  case_id: string;
  canonicalization_result: RuntimeCatalogCanonicalizationResult;
  persistence_schema_result: RuntimeCatalogPersistenceResult;
  checksums: {
    runtime_spec_checksum: string;
    runtime_catalog_checksum: string;
    mother_catalog_checksum: string;
  };
  options?: {
    version?: string;
  };
}

export interface RuntimeCatalogImportPayloadBuilderResult {
  ok: boolean;
  case_id: string;
  import_payload: RuntimeCatalogImportPayload;
  no_go_check: RuntimeCatalogImportNoGoCheck;
  blocked_reason?: string;
  materiality: {
    level: "runtime_40_20_catalog_import_payload_builder_local";
    local_only: true;
    migration_applied: false;
    catalog_activated: false;
    runtime_40_20_started: false;
    next_authorization_required: true;
  };
}

export type RuntimeTraceableCanonicalCandidate = RuntimeCanonicalTrace & Record<string, unknown>;

