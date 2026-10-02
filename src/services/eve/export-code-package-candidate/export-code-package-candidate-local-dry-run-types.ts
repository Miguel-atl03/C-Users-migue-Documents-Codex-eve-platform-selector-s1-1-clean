import type { DiagrammingExportCandidateLocalDryRunResult } from "../diagramming-export-candidate/diagramming-export-candidate-local-dry-run-types";

export type ExportCodePackageCandidateStatus =
  | "export_package_candidate_ready_local"
  | "export_package_candidate_ready_with_restrictions"
  | "export_package_candidate_blocked"
  | "not_enough_diagramming_candidate_evidence"
  | "manual_review_required";

export type ExportCandidateFormat =
  | "json_manifest_candidate"
  | "markdown_manifest_candidate"
  | "diagram_payload_candidate"
  | "traceability_payload_candidate";

export interface ExportCodePackageCandidateManifestItem {
  export_candidate_id: string;
  source_diagram_candidate_ref: string;
  candidate_status: ExportCodePackageCandidateStatus;
  candidate_format: ExportCandidateFormat;
  local_only: true;
  creates_export_code_package_real: false;
  creates_file_real: false;
  restrictions: string[];
  governance_issue_refs: string[];
}

export interface ExportCodePackageCandidateManifest {
  manifest_id: string;
  case_id: string;
  items: ExportCodePackageCandidateManifestItem[];
  local_only: true;
  export_code_package_real_created: false;
  export_real_created: false;
  audit_log: Array<Record<string, unknown>>;
}

export interface ExportPayloadShapeCandidateLocal {
  payload_shape_candidate_id: string;
  case_id: string;
  candidate_status: ExportCodePackageCandidateStatus;
  manifest_shape_present: boolean;
  traceability_shape_present: boolean;
  diagram_payload_shape_present: boolean;
  no_real_file_payload: true;
  creates_export_payload_real: false;
  restrictions: string[];
}

export interface ExportFileSetCandidateLocal {
  file_set_candidate_id: string;
  case_id: string;
  candidate_status: ExportCodePackageCandidateStatus;
  candidate_files_declared: Array<{
    virtual_filename: string;
    format: ExportCandidateFormat;
    would_be_generated_later: boolean;
    generated_now: false;
  }>;
  zip_created: false;
  files_created: false;
  creates_export_code_package_real: false;
  restrictions: string[];
}

export interface ExportTargetBoundaryCheckLocal {
  target_boundary_check_id: string;
  case_id: string;
  allowed_targets: Array<
    "qa_audit" | "control_plane_summary" | "future_export_candidate"
  >;
  blocked_targets: Array<
    | "download"
    | "client_delivery"
    | "production_export"
    | "registry_real"
    | "ir_real"
    | "diagnosis"
    | "delivered"
  >;
  production_export_allowed: false;
  client_delivery_allowed: false;
  download_allowed: false;
  reason: "export_target_candidate_only";
}

export interface ExportFormatReadinessCheckLocal {
  readiness_check_id: string;
  case_id: string;
  export_package_candidate_ready_local: boolean;
  export_code_package_real_ready: false;
  export_code_package_creation_allowed: false;
  format_checks: {
    json_manifest_candidate_present: boolean;
    markdown_manifest_candidate_present: boolean;
    diagram_payload_candidate_present: boolean;
    traceability_payload_candidate_present: boolean;
  };
  blocked_reasons: string[];
  warnings: string[];
}

export interface ExportNoGoBoundaryCheckLocal {
  boundary_check_id: string;
  case_id: string;
  export_code_package_creation_allowed: false;
  export_creation_allowed: false;
  diagramming_export_package_creation_allowed: false;
  ir_creation_allowed: false;
  registry_creation_allowed: false;
  diagnosis_creation_allowed: false;
  delivery_allowed: false;
  phase3_real_opening_allowed: false;
  reason: "export_code_package_candidate_dry_run_only";
}

export interface ExportAuditWarningManifestLocal {
  warning_manifest_id: string;
  case_id: string;
  conformance_claimed: false;
  consistency_claimed: false;
  diagramming_claimed: false;
  export_claimed: false;
  delivery_claimed: false;
  warnings: Array<{
    warning_id: string;
    warning_type:
      | "precheck_only"
      | "no_conformance_claim"
      | "no_consistency_claim"
      | "no_diagramming_claim"
      | "no_export_generation"
      | "no_file_generation"
      | "no_delivery"
      | "manual_review_required";
    severity: "info" | "low" | "medium" | "high";
    message: string;
  }>;
  rule: "export_code_package_candidate_only_no_file_no_export_no_delivery";
}

export interface ExportCodePackageCandidateLocalDryRunInput {
  case_id: string;
  diagramming_candidate_result: DiagrammingExportCandidateLocalDryRunResult;
  options?: {
    version?: string;
  };
}

export interface ExportCodePackageCandidateLocalDryRunResult {
  ok: boolean;
  case_id: string;
  export_code_package_candidate_manifest: ExportCodePackageCandidateManifest;
  export_payload_shape_candidate: ExportPayloadShapeCandidateLocal;
  export_file_set_candidate: ExportFileSetCandidateLocal;
  export_target_boundary_check: ExportTargetBoundaryCheckLocal;
  export_format_readiness_check: ExportFormatReadinessCheckLocal;
  export_no_go_boundary_check: ExportNoGoBoundaryCheckLocal;
  export_audit_warning_manifest: ExportAuditWarningManifestLocal;
  governance_issue_refs: string[];
  blocked_reason?: string;
  no_go: {
    export_code_package_real_created: false;
    export_created: false;
    export_file_created: false;
    zip_created: false;
    diagramming_export_package_real_created: false;
    diagram_file_created: false;
    mermaid_created: false;
    svg_created: false;
    png_created: false;
    drawio_created: false;
    bpmn_created: false;
    archimate_created: false;
    uml_created: false;
    ir_real_created: false;
    registry_real_created: false;
    diagnosis_created: false;
    delivered_created: false;
    delivery_authorized: false;
    client_delivery_created: false;
    download_created: false;
    phase3_real_opened: false;
    production_parallel_real_opened: false;
    conformance_claimed: false;
    consistency_claimed: false;
    diagramming_claimed: false;
    export_claimed: false;
    delivery_claimed: false;
    models_auto_corrected: false;
    readiness_mutated: false;
    core_state_mutated: false;
    mba_written: false;
    parallel_production_artifacts_written: false;
    supabase_touched: false;
    sql_created: false;
    env_read: false;
  };
  materiality: {
    level: "export_code_package_candidate_local_dry_run";
    local_only: true;
    production_integration: false;
    export_code_package_real_created: false;
    next_authorization_required: true;
  };
}
