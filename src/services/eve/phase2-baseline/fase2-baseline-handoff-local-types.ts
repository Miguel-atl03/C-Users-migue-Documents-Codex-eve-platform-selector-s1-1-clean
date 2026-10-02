import type { F8LocalParallelProductionRehearsalResult } from "../parallel-production-rehearsal/f8-local-parallel-production-rehearsal-types";

export type Fase2LocalBaselineState =
  | "draft"
  | "sources_loaded"
  | "source_versions_validated"
  | "issues_reviewed"
  | "baseline_ready_local"
  | "partial_baseline_with_blocks"
  | "blocked_by_phase_gap"
  | "blocked_by_open_critical_issue"
  | "frozen_for_local_handoff"
  | "archived";

export type Fase2LocalHandoffDecision =
  | "local_handoff_ready"
  | "local_handoff_ready_with_restrictions"
  | "partial_handoff_with_blocks"
  | "handoff_blocked"
  | "manual_review_required";

export type Fase2LocalSourceObjectName =
  | "MDSBHandoffCandidate"
  | "DesignReadinessAssessment"
  | "NoGoParallelProductionCheck"
  | "ObjectCandidateLinkageCheck"
  | "RuntimeEvidenceBundleReference"
  | "SGShadowParallelAuditNote";

export type Fase2LocalAllowedDestination =
  | "qa_audit"
  | "control_plane_summary"
  | "future_phase3_candidate";

export type Fase2LocalBlockedDestination =
  | "registry"
  | "IR"
  | "export"
  | "diagnosis"
  | "phase3_real"
  | "production_parallel_real";

export interface Fase2LocalSourceObjectManifestItem {
  object_name: Fase2LocalSourceObjectName;
  source_ref: string;
  source_state: string;
  consumable_locally: boolean;
  consumable_productively: false;
  restrictions: string[];
}

export interface Fase2LocalBaselineRecord {
  baseline_id: string;
  case_id: string;
  state: Fase2LocalBaselineState;
  source_object_manifest: Fase2LocalSourceObjectManifestItem[];
  approved_object_set: string[];
  blocked_object_set: string[];
  issue_manifest: string[];
  version: string;
  local_only: true;
  audit_log: Array<Record<string, unknown>>;
}

export interface Fase2LocalHandoffDecisionRecord {
  handoff_decision_id: string;
  case_id: string;
  decision: Fase2LocalHandoffDecision;
  allowed_destinations: Fase2LocalAllowedDestination[];
  blocked_destinations: Fase2LocalBlockedDestination[];
  restrictions: string[];
  governance_issue_refs: string[];
}

export interface Fase2LocalHandoffMatrixEntry {
  source_object: string;
  destination: string;
  allowed: boolean;
  reason: string;
}

export interface Fase2LocalInventoryUpdateCandidate {
  inventory_update_candidate_id: string;
  case_id: string;
  candidate_only: true;
  updates_inventory_real: false;
  source_baseline_ref: string;
  objects_to_register_later: string[];
  restrictions: string[];
}

export interface Fase2LocalPhase3OpeningBoundaryCheck {
  phase3_boundary_check_id: string;
  case_id: string;
  phase3_real_opening_allowed: false;
  vsm_ahe_diagnosis_allowed: false;
  reason: "phase3_not_authorized_from_local_baseline";
  blockers: string[];
}

export interface Fase2BaselineHandoffLocalInput {
  case_id: string;
  f8_rehearsal_result: F8LocalParallelProductionRehearsalResult;
  options?: {
    version?: string;
  };
}

export interface Fase2BaselineHandoffLocalResult {
  ok: boolean;
  case_id: string;
  baseline_record: Fase2LocalBaselineRecord;
  handoff_decision: Fase2LocalHandoffDecisionRecord;
  handoff_matrix: Fase2LocalHandoffMatrixEntry[];
  inventory_update_candidate: Fase2LocalInventoryUpdateCandidate;
  phase3_opening_boundary_check: Fase2LocalPhase3OpeningBoundaryCheck;
  governance_issue_refs: string[];
  blocked_reason?: string;
  no_go: {
    production_parallel_real_opened: false;
    phase3_real_opened: false;
    registry_created: false;
    ir_created: false;
    export_created: false;
    export_code_package_created: false;
    diagnosis_created: false;
    delivered_created: false;
    delivery_authorized: false;
    inventory_real_updated: false;
    readiness_mutated: false;
    core_state_mutated: false;
    workflow_created: false;
    task_created: false;
    operation_blocked: false;
    mba_written: false;
    parallel_production_artifacts_written: false;
    supabase_touched: false;
    sql_created: false;
    env_read: false;
  };
  materiality: {
    level: "fase2_local_baseline_handoff_readiness";
    local_only: true;
    production_integration: false;
    next_authorization_required: true;
  };
}
