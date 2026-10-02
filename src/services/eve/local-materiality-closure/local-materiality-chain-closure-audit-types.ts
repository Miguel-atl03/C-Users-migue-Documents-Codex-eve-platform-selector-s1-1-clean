import type { ExportCodePackageCandidateLocalDryRunResult } from "../export-code-package-candidate/export-code-package-candidate-local-dry-run-types";

export type LocalMaterialityStage =
  | "f5c_local_binding"
  | "f6_local_membrane"
  | "f7_local_control_shadow"
  | "f8_local_parallel_rehearsal"
  | "fase2_local_baseline"
  | "registry_candidate_local_dry_run"
  | "ir_candidate_local_dry_run"
  | "diagramming_candidate_local_dry_run"
  | "export_code_package_candidate_local_dry_run";

export type LocalClosureStatus =
  | "closed_local_only"
  | "closed_with_restrictions"
  | "blocked_by_boundary_violation"
  | "blocked_by_overclaim"
  | "manual_review_required";

export interface LocalMaterialityStageLedgerEntry {
  stage: LocalMaterialityStage;
  local_artifact_present: boolean;
  real_artifact_created: false;
  production_integration: false;
  next_authorization_required: boolean;
  claims_allowed: Array<
    "candidate" | "local_readiness" | "report_only" | "precheck_only"
  >;
  claims_forbidden: Array<
    | "real"
    | "productive"
    | "conformance"
    | "consistency"
    | "export"
    | "delivery"
    | "diagnosis"
  >;
  restrictions: string[];
}

export interface E2ENoGoMatrixEntry {
  no_go_key: string;
  expected_value: false;
  observed_value: boolean;
  passed: boolean;
  boundary_family:
    | "runtime"
    | "object_inventory"
    | "control_plane"
    | "parallel_production"
    | "registry"
    | "ir"
    | "diagramming"
    | "export"
    | "diagnosis"
    | "delivery"
    | "security"
    | "model_claim";
}

export interface BoundaryViolationScan {
  scan_id: string;
  case_id: string;
  violations_found: boolean;
  violation_count: number;
  scanned_boundaries: string[];
  boundary_violations: string[];
}

export interface OverclaimDetectionReport {
  report_id: string;
  case_id: string;
  overclaim_detected: boolean;
  overclaim_count: number;
  forbidden_claims_checked: Array<
    | "conformance_claimed"
    | "consistency_claimed"
    | "diagramming_claimed"
    | "export_claimed"
    | "delivery_claimed"
    | "diagnosis_created"
    | "delivered_created"
    | "models_auto_corrected"
  >;
  overclaims: string[];
  rule: "no_real_capability_claim_without_authorized_real_artifact";
}

export interface NextAuthorizationBoundaryCheck {
  authorization_check_id: string;
  case_id: string;
  next_authorization_required: true;
  allowed_next_authorization_topics: Array<
    | "real_registry_authorization"
    | "real_ir_authorization"
    | "real_export_authorization"
    | "phase3_authorization"
    | "diagnosis_delivery_authorization"
    | "production_integration_authorization"
  >;
  automatic_promotion_allowed: false;
  reason: "local_chain_closed_but_real_capabilities_remain_unauthorized";
}

export interface ClosureReadinessSummary {
  summary_id: string;
  case_id: string;
  closure_status: LocalClosureStatus;
  local_chain_closed: boolean;
  real_capabilities_opened: false;
  production_integration_opened: false;
  export_ready_real: false;
  diagnosis_ready_real: false;
  delivery_ready_real: false;
  readiness_statement: string;
  restrictions: string[];
}

export interface LocalMaterialityChainClosureAudit {
  audit_id: string;
  case_id: string;
  closure_status: LocalClosureStatus;
  local_only: true;
  production_integration: false;
  stage_ledger: LocalMaterialityStageLedgerEntry[];
  audit_log: Array<Record<string, unknown>>;
}

export interface LocalMaterialityChainClosureAuditInput {
  case_id: string;
  export_code_package_candidate_result: ExportCodePackageCandidateLocalDryRunResult;
  options?: {
    version?: string;
  };
}

export interface LocalMaterialityChainClosureAuditResult {
  ok: boolean;
  case_id: string;
  closure_audit: LocalMaterialityChainClosureAudit;
  e2e_no_go_matrix: E2ENoGoMatrixEntry[];
  materiality_stage_ledger: LocalMaterialityStageLedgerEntry[];
  boundary_violation_scan: BoundaryViolationScan;
  overclaim_detection_report: OverclaimDetectionReport;
  next_authorization_boundary_check: NextAuthorizationBoundaryCheck;
  closure_readiness_summary: ClosureReadinessSummary;
  governance_issue_refs: string[];
  blocked_reason?: string;
  no_go: {
    runtime_40_20_full_opened: false;
    object_inventory_real_opened: false;
    f5c_real_opened: false;
    integration_membrane_real_opened: false;
    control_plane_real_opened: false;
    sg_shadow_real_opened: false;
    soft_governance_activated: false;
    enforcement_activated: false;
    production_parallel_real_opened: false;
    phase3_real_opened: false;
    registry_real_created: false;
    pm_registry_real_created: false;
    pf_registry_real_created: false;
    moc_registry_real_created: false;
    olc_registry_real_created: false;
    ir_real_created: false;
    diagramming_export_package_real_created: false;
    export_code_package_real_created: false;
    export_created: false;
    export_file_created: false;
    zip_created: false;
    diagram_file_created: false;
    diagnosis_created: false;
    delivered_created: false;
    delivery_authorized: false;
    client_delivery_created: false;
    download_created: false;
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
    level: "local_materiality_chain_closure_audit";
    local_only: true;
    production_integration: false;
    chain_closed_local_only: boolean;
    next_authorization_required: true;
  };
}
