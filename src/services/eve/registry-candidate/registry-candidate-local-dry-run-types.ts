import type { Fase2BaselineHandoffLocalResult } from "../phase2-baseline/fase2-baseline-handoff-local-types";

export type RegistryCandidateModelKind = "PM" | "PF" | "MoC" | "OLC";

export type RegistryCandidateStatus =
  | "candidate_ready_local"
  | "candidate_ready_with_restrictions"
  | "candidate_blocked"
  | "not_enough_evidence"
  | "manual_review_required";

export interface RegistryCandidateManifestItem {
  candidate_id: string;
  model_kind: RegistryCandidateModelKind;
  source_object_refs: string[];
  candidate_status: RegistryCandidateStatus;
  local_only: true;
  creates_registry_real: false;
  restrictions: string[];
  governance_issue_refs: string[];
}

export interface RegistryCandidateManifest {
  manifest_id: string;
  case_id: string;
  items: RegistryCandidateManifestItem[];
  local_only: true;
  registry_real_created: false;
  audit_log: Array<Record<string, unknown>>;
}

export interface PMRegistryCandidateLocal {
  pm_candidate_id: string;
  case_id: string;
  candidate_status: RegistryCandidateStatus;
  process_intention_candidate: string;
  trigger_candidate_present: boolean;
  target_state_candidate_present: boolean;
  support_process_boundary_preserved: boolean;
  creates_pm_registry_real: false;
  restrictions: string[];
}

export interface PFRegistryCandidateLocal {
  pf_candidate_id: string;
  case_id: string;
  candidate_status: RegistryCandidateStatus;
  sequence_candidate_present: boolean;
  process_state_candidate_present: boolean;
  timer_candidate_present: boolean;
  no_swimlane_contamination: boolean;
  creates_pf_registry_real: false;
  restrictions: string[];
}

export interface MoCRegistryCandidateLocal {
  moc_candidate_id: string;
  case_id: string;
  candidate_status: RegistryCandidateStatus;
  object_class_candidate_present: boolean;
  relationship_candidate_present: boolean;
  isa_boundary_preserved: boolean;
  no_database_reduction: boolean;
  creates_moc_registry_real: false;
  restrictions: string[];
}

export interface OLCRegistryCandidateLocal {
  olc_candidate_id: string;
  case_id: string;
  candidate_status: RegistryCandidateStatus;
  lifecycle_object_candidate_present: boolean;
  state_candidate_present: boolean;
  transition_candidate_present: boolean;
  external_stimulus_or_time_required: boolean;
  no_process_reduction: boolean;
  creates_olc_registry_real: false;
  restrictions: string[];
}

export interface RegistryReadinessCheckLocal {
  readiness_check_id: string;
  case_id: string;
  registry_candidate_ready_local: boolean;
  registry_real_ready: false;
  registry_creation_allowed: false;
  blocked_reasons: string[];
  warnings: string[];
}

export interface CrossModelConsistencyPrecheckLocal {
  precheck_id: string;
  case_id: string;
  conformance_claimed: false;
  consistency_claimed: false;
  factual_precheck_possible: boolean;
  temporal_precheck_possible: boolean;
  structural_precheck_possible: boolean;
  composite_precheck_possible: boolean;
  unresolved_model_links: string[];
  rule: "precheck_only_return_to_reality_for_actual_correction";
}

export interface RegistryNoGoBoundaryCheckLocal {
  boundary_check_id: string;
  case_id: string;
  registry_creation_allowed: false;
  ir_creation_allowed: false;
  export_creation_allowed: false;
  diagnosis_creation_allowed: false;
  phase3_real_opening_allowed: false;
  reason: "registry_candidate_dry_run_only";
}

export interface RegistryCandidateLocalDryRunInput {
  case_id: string;
  fase2_baseline_result: Fase2BaselineHandoffLocalResult;
  options?: {
    version?: string;
  };
}

export interface RegistryCandidateLocalDryRunResult {
  ok: boolean;
  case_id: string;
  registry_candidate_manifest: RegistryCandidateManifest;
  pm_registry_candidate: PMRegistryCandidateLocal;
  pf_registry_candidate: PFRegistryCandidateLocal;
  moc_registry_candidate: MoCRegistryCandidateLocal;
  olc_registry_candidate: OLCRegistryCandidateLocal;
  registry_readiness_check: RegistryReadinessCheckLocal;
  cross_model_consistency_precheck: CrossModelConsistencyPrecheckLocal;
  registry_no_go_boundary_check: RegistryNoGoBoundaryCheckLocal;
  governance_issue_refs: string[];
  blocked_reason?: string;
  no_go: {
    registry_real_created: false;
    pm_registry_real_created: false;
    pf_registry_real_created: false;
    moc_registry_real_created: false;
    olc_registry_real_created: false;
    ir_created: false;
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
    level: "registry_candidate_local_dry_run";
    local_only: true;
    production_integration: false;
    registry_real_created: false;
    next_authorization_required: true;
  };
}
