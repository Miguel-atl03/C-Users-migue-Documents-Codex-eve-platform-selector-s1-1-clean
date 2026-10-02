import type { MMABPIRCandidateLocalDryRunResult } from "../ir-candidate/mmabp-ir-candidate-local-dry-run-types";

export type DiagrammingCandidateModelKind = "PM" | "PF" | "MoC" | "OLC";

export type DiagrammingCandidateStatus =
  | "diagram_candidate_ready_local"
  | "diagram_candidate_ready_with_restrictions"
  | "diagram_candidate_blocked"
  | "not_enough_ir_candidate_evidence"
  | "manual_review_required";

export interface DiagrammingExportCandidateManifestItem {
  diagram_candidate_id: string;
  model_kind: DiagrammingCandidateModelKind;
  source_ir_candidate_ref: string;
  candidate_status: DiagrammingCandidateStatus;
  local_only: true;
  creates_diagramming_export_package_real: false;
  restrictions: string[];
  governance_issue_refs: string[];
}

export interface DiagrammingExportCandidateManifest {
  manifest_id: string;
  case_id: string;
  items: DiagrammingExportCandidateManifestItem[];
  local_only: true;
  diagramming_export_package_real_created: false;
  audit_log: Array<Record<string, unknown>>;
}

export interface PMDiagramCandidateLocal {
  pm_diagram_candidate_id: string;
  case_id: string;
  source_pm_ir_candidate_ref: string;
  candidate_status: DiagrammingCandidateStatus;
  diagram_kind: "process_map_candidate";
  intention_visible: boolean;
  trigger_visible: boolean;
  target_state_visible: boolean;
  support_boundary_visible: boolean;
  creates_diagram_real: false;
  restrictions: string[];
}

export interface PFDiagramCandidateLocal {
  pf_diagram_candidate_id: string;
  case_id: string;
  source_pf_ir_candidate_ref: string;
  candidate_status: DiagrammingCandidateStatus;
  diagram_kind: "process_flow_candidate";
  sequence_visible: boolean;
  process_state_visible: boolean;
  timer_visible: boolean;
  no_swimlanes: true;
  creates_diagram_real: false;
  restrictions: string[];
}

export interface MoCDiagramCandidateLocal {
  moc_diagram_candidate_id: string;
  case_id: string;
  source_moc_ir_candidate_ref: string;
  candidate_status: DiagrammingCandidateStatus;
  diagram_kind: "model_of_concepts_candidate";
  object_classes_visible: boolean;
  relationships_visible: boolean;
  isa_boundary_visible: boolean;
  no_database_reduction: true;
  creates_diagram_real: false;
  restrictions: string[];
}

export interface OLCDiagramCandidateLocal {
  olc_diagram_candidate_id: string;
  case_id: string;
  source_olc_ir_candidate_ref: string;
  candidate_status: DiagrammingCandidateStatus;
  diagram_kind: "object_life_cycle_candidate";
  lifecycle_object_visible: boolean;
  states_visible: boolean;
  transitions_visible: boolean;
  stimulus_or_time_visible: boolean;
  no_process_reduction: true;
  creates_diagram_real: false;
  restrictions: string[];
}

export interface DiagramShapeReadinessCheckLocal {
  readiness_check_id: string;
  case_id: string;
  diagram_candidate_ready_local: boolean;
  diagramming_export_package_real_ready: false;
  diagramming_export_package_creation_allowed: false;
  shape_checks: {
    pm_diagram_candidate_present: boolean;
    pf_diagram_candidate_present: boolean;
    moc_diagram_candidate_present: boolean;
    olc_diagram_candidate_present: boolean;
  };
  blocked_reasons: string[];
  warnings: string[];
}

export interface DiagramConsistencyWarningManifestLocal {
  warning_manifest_id: string;
  case_id: string;
  conformance_claimed: false;
  consistency_claimed: false;
  diagramming_claimed: false;
  warnings: Array<{
    warning_id: string;
    model_kind: DiagrammingCandidateModelKind | "CROSS_MODEL";
    warning_type:
      | "precheck_only"
      | "no_conformance_claim"
      | "no_consistency_claim"
      | "no_model_autocorrection"
      | "no_export_generation"
      | "manual_review_required";
    severity: "info" | "low" | "medium" | "high";
    message: string;
  }>;
  rule: "diagram_candidate_only_no_export_no_conformance_no_consistency_claim";
}

export interface DiagramExportBoundaryCheckLocal {
  boundary_check_id: string;
  case_id: string;
  diagramming_export_package_creation_allowed: false;
  export_code_package_allowed: false;
  export_creation_allowed: false;
  ir_creation_allowed: false;
  registry_creation_allowed: false;
  diagnosis_creation_allowed: false;
  phase3_real_opening_allowed: false;
  reason: "diagramming_export_candidate_dry_run_only";
}

export interface DiagrammingExportCandidateLocalDryRunInput {
  case_id: string;
  ir_candidate_result: MMABPIRCandidateLocalDryRunResult;
  options?: {
    version?: string;
  };
}

export interface DiagrammingExportCandidateLocalDryRunResult {
  ok: boolean;
  case_id: string;
  diagramming_export_candidate_manifest: DiagrammingExportCandidateManifest;
  pm_diagram_candidate: PMDiagramCandidateLocal;
  pf_diagram_candidate: PFDiagramCandidateLocal;
  moc_diagram_candidate: MoCDiagramCandidateLocal;
  olc_diagram_candidate: OLCDiagramCandidateLocal;
  diagram_shape_readiness_check: DiagramShapeReadinessCheckLocal;
  diagram_consistency_warning_manifest: DiagramConsistencyWarningManifestLocal;
  diagram_export_boundary_check: DiagramExportBoundaryCheckLocal;
  governance_issue_refs: string[];
  blocked_reason?: string;
  no_go: {
    diagramming_export_package_real_created: false;
    export_code_package_created: false;
    export_created: false;
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
    phase3_real_opened: false;
    production_parallel_real_opened: false;
    conformance_claimed: false;
    consistency_claimed: false;
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
    level: "diagramming_export_candidate_local_dry_run";
    local_only: true;
    production_integration: false;
    diagramming_export_package_real_created: false;
    next_authorization_required: true;
  };
}
