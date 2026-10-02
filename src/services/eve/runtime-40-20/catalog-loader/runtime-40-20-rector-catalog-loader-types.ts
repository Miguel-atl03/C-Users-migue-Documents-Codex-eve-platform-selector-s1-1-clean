export type RuntimeRectorDocumentName =
  | "EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx"
  | "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx"
  | "EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx";

export interface RuntimeRectorDocumentPathSet {
  runtime_spec_path: string;
  runtime_catalog_path: string;
  mother_catalog_path: string;
}

export interface SourceRowTrace {
  source_document: RuntimeRectorDocumentName;
  source_sheet: string;
  source_row_number: number;
  raw_row: Record<string, unknown>;
}

export interface RuntimeBaseInteractionExtract extends SourceRowTrace {
  interaction_group: "base";
  runtime_interaction_id?: string;
  visible_text?: string;
  source_codes?: string[];
}

export interface RuntimeCausalInteractionExtract extends SourceRowTrace {
  interaction_group: "causal";
  runtime_interaction_id?: string;
  visible_text?: string;
  trigger_condition?: string;
  source_codes?: string[];
}

export interface RuntimeGenericSheetExtract extends SourceRowTrace {
  extract_kind:
    | "version_control"
    | "required_field"
    | "ux_subfield"
    | "epistemic_policy"
    | "mmabp_output_map"
    | "canonical_variable"
    | "branching_rule"
    | "critical_route"
    | "semantic_gate"
    | "process_state_timer_gate"
    | "readiness_rule"
    | "parallel_production_contract"
    | "qa_rule"
    | "implementation_dictionary";
}

export interface MotherGenericSheetExtract extends SourceRowTrace {
  extract_kind:
    | "version_control"
    | "mother_node"
    | "source_question"
    | "runtime_classification"
    | "ux_copy"
    | "epistemic_governance"
    | "mmabp_mapping"
    | "canonical_variable"
    | "critical_route"
    | "trigger_branching_rule"
    | "readiness_reentry_gap"
    | "vsm_ahe_prep"
    | "variable_canonica_source"
    | "implementation_dictionary"
    | "audit_issue";
}

export interface RuntimeTechnicalSpecExtract {
  source_document: "EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx";
  detected_version: string | "not_found";
  title_detected: string | "not_found";
  mentions_runtime_40_20: boolean;
  mentions_runtime_catalog_v1_1_1: boolean;
  mentions_mother_catalog_v1_0: boolean;
  section_headings_detected: string[];
}

export interface RuntimeCatalogLoaderExtractionReport {
  case_id: string;
  runtime_spec_extract: RuntimeTechnicalSpecExtract;
  runtime_base_interactions: RuntimeBaseInteractionExtract[];
  runtime_causal_interactions: RuntimeCausalInteractionExtract[];
  runtime_generic_extracts: RuntimeGenericSheetExtract[];
  mother_generic_extracts: MotherGenericSheetExtract[];
  runtime_catalog_sheets_detected: string[];
  mother_catalog_sheets_detected: string[];
  base_count: number;
  causal_count: number;
}

export interface RuntimeCatalogLoaderNoGoCheck {
  no_go_triggered: boolean;
  blockers: string[];
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

export interface RuntimeCatalogLoaderInput {
  case_id: string;
  document_paths: RuntimeRectorDocumentPathSet;
  options?: {
    version?: string;
    allow_file_read?: boolean;
  };
}

export interface RuntimeCatalogLoaderResult {
  ok: boolean;
  case_id: string;
  extraction_report: RuntimeCatalogLoaderExtractionReport;
  no_go_check: RuntimeCatalogLoaderNoGoCheck;
  blocked_reason?: string;
  materiality: {
    level: "runtime_40_20_rector_catalog_loader_local_extraction";
    local_only: true;
    runtime_40_20_started: false;
    next_authorization_required: true;
  };
}
