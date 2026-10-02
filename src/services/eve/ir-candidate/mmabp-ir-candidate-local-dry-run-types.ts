import type { RegistryCandidateLocalDryRunResult } from "../registry-candidate/registry-candidate-local-dry-run-types";

export type MMABPIRCandidateModelKind = "PM" | "PF" | "MoC" | "OLC";

export type MMABPIRCandidateStatus =
  | "ir_candidate_ready_local"
  | "ir_candidate_ready_with_restrictions"
  | "ir_candidate_blocked"
  | "not_enough_registry_candidate_evidence"
  | "manual_review_required";

export interface MMABPIRCandidateManifestItem {
  ir_candidate_id: string;
  model_kind: MMABPIRCandidateModelKind;
  source_registry_candidate_ref: string;
  candidate_status: MMABPIRCandidateStatus;
  local_only: true;
  creates_ir_real: false;
  restrictions: string[];
  governance_issue_refs: string[];
}

export interface MMABPIRCandidateManifest {
  manifest_id: string;
  case_id: string;
  items: MMABPIRCandidateManifestItem[];
  local_only: true;
  ir_real_created: false;
  audit_log: Array<Record<string, unknown>>;
}

export interface PMIRProjectionCandidateLocal {
  pm_ir_candidate_id: string;
  case_id: string;
  source_pm_registry_candidate_ref: string;
  candidate_status: MMABPIRCandidateStatus;
  process_map_shape_candidate_present: boolean;
  process_intention_present: boolean;
  trigger_present: boolean;
  target_state_present: boolean;
  support_boundary_preserved: boolean;
  creates_ir_real: false;
  restrictions: string[];
}

export interface PFIRProjectionCandidateLocal {
  pf_ir_candidate_id: string;
  case_id: string;
  source_pf_registry_candidate_ref: string;
  candidate_status: MMABPIRCandidateStatus;
  process_flow_shape_candidate_present: boolean;
  sequence_present: boolean;
  process_state_present: boolean;
  timer_present: boolean;
  no_swimlane_contamination: boolean;
  creates_ir_real: false;
  restrictions: string[];
}

export interface MoCIRProjectionCandidateLocal {
  moc_ir_candidate_id: string;
  case_id: string;
  source_moc_registry_candidate_ref: string;
  candidate_status: MMABPIRCandidateStatus;
  model_of_concepts_shape_candidate_present: boolean;
  object_class_present: boolean;
  relationship_present: boolean;
  isa_boundary_preserved: boolean;
  no_database_reduction: boolean;
  creates_ir_real: false;
  restrictions: string[];
}

export interface OLCIRProjectionCandidateLocal {
  olc_ir_candidate_id: string;
  case_id: string;
  source_olc_registry_candidate_ref: string;
  candidate_status: MMABPIRCandidateStatus;
  object_life_cycle_shape_candidate_present: boolean;
  lifecycle_object_present: boolean;
  state_present: boolean;
  transition_present: boolean;
  external_stimulus_or_time_required: boolean;
  no_process_reduction: boolean;
  creates_ir_real: false;
  restrictions: string[];
}

export interface IRShapeReadinessCheckLocal {
  readiness_check_id: string;
  case_id: string;
  ir_candidate_ready_local: boolean;
  ir_real_ready: false;
  ir_creation_allowed: false;
  shape_checks: {
    pm_shape_candidate_present: boolean;
    pf_shape_candidate_present: boolean;
    moc_shape_candidate_present: boolean;
    olc_shape_candidate_present: boolean;
  };
  blocked_reasons: string[];
  warnings: string[];
}

export interface IRCrossModelTraceabilityPrecheckLocal {
  precheck_id: string;
  case_id: string;
  conformance_claimed: false;
  consistency_claimed: false;
  traceability_precheck_possible: boolean;
  pm_to_pf_link_candidate_present: boolean;
  pf_to_moc_link_candidate_present: boolean;
  pf_to_olc_link_candidate_present: boolean;
  moc_to_olc_link_candidate_present: boolean;
  unresolved_traceability_links: string[];
  rule: "ir_precheck_only_no_conformance_no_consistency_claim";
}

export interface IRNoGoBoundaryCheckLocal {
  boundary_check_id: string;
  case_id: string;
  ir_creation_allowed: false;
  registry_creation_allowed: false;
  export_creation_allowed: false;
  diagramming_export_package_allowed: false;
  export_code_package_allowed: false;
  diagnosis_creation_allowed: false;
  phase3_real_opening_allowed: false;
  reason: "ir_candidate_dry_run_only";
}

export interface MMABPIRCandidateLocalDryRunInput {
  case_id: string;
  registry_candidate_result: RegistryCandidateLocalDryRunResult;
  options?: {
    version?: string;
  };
}

export interface MMABPIRCandidateLocalDryRunResult {
  ok: boolean;
  case_id: string;
  ir_candidate_manifest: MMABPIRCandidateManifest;
  pm_ir_projection_candidate: PMIRProjectionCandidateLocal;
  pf_ir_projection_candidate: PFIRProjectionCandidateLocal;
  moc_ir_projection_candidate: MoCIRProjectionCandidateLocal;
  olc_ir_projection_candidate: OLCIRProjectionCandidateLocal;
  ir_shape_readiness_check: IRShapeReadinessCheckLocal;
  ir_cross_model_traceability_precheck: IRCrossModelTraceabilityPrecheckLocal;
  ir_no_go_boundary_check: IRNoGoBoundaryCheckLocal;
  governance_issue_refs: string[];
  blocked_reason?: string;
  no_go: {
    ir_real_created: false;
    registry_real_created: false;
    pm_registry_real_created: false;
    pf_registry_real_created: false;
    moc_registry_real_created: false;
    olc_registry_real_created: false;
    export_created: false;
    export_code_package_created: false;
    diagramming_export_package_created: false;
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
    level: "mmabp_ir_candidate_local_dry_run";
    local_only: true;
    production_integration: false;
    ir_real_created: false;
    next_authorization_required: true;
  };
}
