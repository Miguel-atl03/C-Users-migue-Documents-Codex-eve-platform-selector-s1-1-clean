import type { F6LocalIntegrationMembraneResult } from "../integration-membrane/f6-local-integration-membrane-types";
import type { F7LocalControlPlaneShadowResult } from "../control-plane/f7-local-control-plane-shadow-types";

export type F8LocalRehearsalState =
  | "draft"
  | "inputs_validated"
  | "handoff_candidate_created"
  | "readiness_assessed"
  | "no_go_checked"
  | "rehearsal_ready_local"
  | "rehearsal_blocked"
  | "archived";

export type F8LocalReadinessOutcome =
  | "ready_for_local_rehearsal"
  | "ready_with_restrictions"
  | "blocked"
  | "manual_review_required";

export interface F8LocalParallelProductionRehearsalRun {
  rehearsal_run_id: string;
  case_id: string;
  state: F8LocalRehearsalState;
  source_f6_ref: string;
  source_f7_ref: string;
  local_only: true;
  production_integration: false;
  audit_log: Array<Record<string, unknown>>;
}

export interface F8LocalMDSBHandoffCandidate {
  mdsb_handoff_candidate_id: string;
  case_id: string;
  source_outbox_ref: string;
  source_snapshot_ref: string;
  source_summary_projection_ref: string;
  candidate_only: true;
  allowed_consumers: Array<
    "future_mdsb_candidate" | "qa_audit" | "control_plane_summary"
  >;
  forbidden_consumers: Array<
    "registry" | "IR" | "export" | "diagnosis" | "production_parallel_real"
  >;
  governance_issue_refs: string[];
}

export interface F8LocalDesignReadinessAssessment {
  assessment_id: string;
  case_id: string;
  outcome: F8LocalReadinessOutcome;
  dominant_gate:
    | "traceability"
    | "object_linkage"
    | "handoff_boundary"
    | "no_go"
    | "export_boundary";
  ready_for_real_parallel_production: false;
  ready_for_registry: false;
  ready_for_ir: false;
  ready_for_export: false;
  restrictions: string[];
  governance_issue_refs: string[];
}

export interface F8LocalNoGoParallelProductionCheck {
  no_go_check_id: string;
  case_id: string;
  no_go_triggered: false;
  production_parallel_real_allowed: false;
  registry_allowed: false;
  ir_allowed: false;
  export_allowed: false;
  diagnosis_allowed: false;
  export_code_package_created: false;
  blockers_count: 0;
  warnings: string[];
}

export interface F8LocalObjectCandidateLinkageCheck {
  linkage_check_id: string;
  case_id: string;
  source_bindings_seen: number;
  materialization_events_seen: number;
  object_candidate_linkage_ok: boolean;
  unresolved_object_refs: string[];
  review_required_refs: string[];
  local_only: true;
}

export interface F8LocalRuntimeEvidenceBundleReference {
  runtime_evidence_bundle_reference_id: string;
  case_id: string;
  source_membrane_snapshot_ref: string;
  evidence_reference_only: true;
  mutates_evidence_bundle: false;
  mutates_readiness: false;
}

export interface F8LocalSGShadowParallelAuditNote {
  audit_note_id: string;
  case_id: string;
  source_compliance_report_ref: string;
  report_only: true;
  creates_workflow: false;
  creates_task: false;
  blocks_operation: false;
  note: string;
}

export interface F8LocalParallelProductionRehearsalInput {
  case_id: string;
  f6_membrane_result: F6LocalIntegrationMembraneResult;
  f7_shadow_result: F7LocalControlPlaneShadowResult;
  options?: {
    version?: string;
  };
}

export interface F8LocalParallelProductionRehearsalResult {
  ok: boolean;
  case_id: string;
  rehearsal_run: F8LocalParallelProductionRehearsalRun;
  mdsb_handoff_candidate: F8LocalMDSBHandoffCandidate;
  design_readiness_assessment: F8LocalDesignReadinessAssessment;
  no_go_parallel_production_check: F8LocalNoGoParallelProductionCheck;
  object_candidate_linkage_check: F8LocalObjectCandidateLinkageCheck;
  runtime_evidence_bundle_reference: F8LocalRuntimeEvidenceBundleReference;
  sg_shadow_parallel_audit_note: F8LocalSGShadowParallelAuditNote;
  blocked_reason?: string;
  governance_issue_refs: string[];
  no_go: {
    runtime_40_20_full_opened: false;
    production_parallel_real_opened: false;
    registry_created: false;
    ir_created: false;
    export_created: false;
    export_code_package_created: false;
    diagnosis_created: false;
    delivered_created: false;
    delivery_authorized: false;
    evidence_bundle_mutated: false;
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
    level: "f8_local_parallel_production_rehearsal_readiness";
    local_only: true;
    report_only: true;
    production_integration: false;
    next_authorization_required: true;
  };
}
