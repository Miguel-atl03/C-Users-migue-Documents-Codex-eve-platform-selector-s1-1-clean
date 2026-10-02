export type RectorDocumentKind =
  | "runtime_technical_spec"
  | "runtime_catalog"
  | "mother_catalog";

export type RectorDocumentStatus =
  | "found_readable"
  | "missing"
  | "unreadable"
  | "version_mismatch"
  | "blocked";

export interface RectorDocumentRef {
  kind: RectorDocumentKind;
  filename: string;
  expected_path: string;
  detected_path: string;
  expected_version: string;
  detected_version: string | "not_found";
  readable: boolean;
  checksum?: string;
  status: RectorDocumentStatus;
}

export interface RuntimeCatalogSheetManifest {
  workbook_filename: "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx";
  sheets_detected: string[];
  required_sheets: Array<{
    sheet_name: string;
    present: boolean;
  }>;
  base_interaction_count?: number;
  causal_interaction_count?: number;
}

export interface MotherCatalogSheetManifest {
  workbook_filename: "EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx";
  sheets_detected: string[];
  inspected: boolean;
}

export interface RectorDocumentVersionMatrix {
  runtime_spec_version: "v1.0.1" | "not_found" | string;
  runtime_catalog_version: "v1.1.1" | "not_found" | string;
  mother_catalog_version: "1.0" | "not_found" | string;
  version_alignment_ok: boolean;
}

export type RuntimeSourceBaselineGateId =
  | "T-001"
  | "T-002"
  | "T-014"
  | "T-016"
  | "T-017"
  | "T-019"
  | "T-020";

export interface RuntimeSourceBaselineGateResult {
  gate_id: RuntimeSourceBaselineGateId;
  gate_name: string;
  passed: boolean;
  severity: "blocking" | "warning";
  reason: string;
}

export interface SourceDocumentChecksumManifest {
  runtime_spec_checksum?: string;
  runtime_catalog_checksum?: string;
  mother_catalog_checksum?: string;
  checksum_registered: boolean;
}

export interface RuntimeImplementationNoGoCheck {
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

export interface RuntimeRectorSourceBaselineInput {
  case_id: string;
  rector_documents: RectorDocumentRef[];
  runtime_catalog_sheet_manifest: RuntimeCatalogSheetManifest;
  mother_catalog_sheet_manifest: MotherCatalogSheetManifest;
  version_matrix: RectorDocumentVersionMatrix;
  checksum_manifest: SourceDocumentChecksumManifest;
  options?: {
    version?: string;
  };
}

export interface RuntimeRectorSourceBaselineResult {
  ok: boolean;
  case_id: string;
  rector_documents: RectorDocumentRef[];
  runtime_catalog_sheet_manifest: RuntimeCatalogSheetManifest;
  mother_catalog_sheet_manifest: MotherCatalogSheetManifest;
  version_matrix: RectorDocumentVersionMatrix;
  checksum_manifest: SourceDocumentChecksumManifest;
  gate_results: RuntimeSourceBaselineGateResult[];
  no_go_check: RuntimeImplementationNoGoCheck;
  blocked_reason?: string;
  materiality: {
    level: "runtime_40_20_rector_source_baseline_and_qa_gate";
    local_only: true;
    runtime_40_20_started: false;
    next_authorization_required: true;
  };
}
