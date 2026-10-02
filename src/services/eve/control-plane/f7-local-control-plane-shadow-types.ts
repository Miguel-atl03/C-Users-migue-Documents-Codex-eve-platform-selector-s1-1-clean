import type { F6LocalIntegrationMembraneResult } from "../integration-membrane/f6-local-integration-membrane-types";

export type F7LocalFindingSeverity =
  | "info"
  | "low"
  | "medium"
  | "high"
  | "critical_candidate";

export type F7LocalShadowMode = "report_only" | "shadow_mode";

export interface F7LocalEventLedgerEntry {
  event_id: string;
  case_id: string;
  source: "F6_LOCAL_MEMBRANE";
  event_type:
    | "membrane_outbox_observed"
    | "snapshot_observed"
    | "handoff_boundary_observed"
    | "export_boundary_observed"
    | "review_control_observed"
    | "summary_projection_observed";
  state: "recorded";
  report_only: true;
  audit_log: Array<Record<string, unknown>>;
}

export interface F7LocalTimerLedgerEntry {
  timer_id: string;
  case_id: string;
  source_event_id: string;
  timer_type:
    | "review_control_timer"
    | "handoff_boundary_timer"
    | "export_boundary_timer"
    | "no_go_review_timer";
  state: "observed" | "not_required";
  report_only: true;
  blocks_operation: false;
}

export interface F7LocalTransitionFinding {
  finding_id: string;
  case_id: string;
  source: "F6_LOCAL_MEMBRANE";
  finding_type:
    | "handoff_ready_with_restrictions"
    | "handoff_blocked"
    | "export_blocked"
    | "review_required"
    | "summary_only_projection"
    | "no_go_boundary_preserved";
  severity: F7LocalFindingSeverity;
  route_to: "P-SUP-06_candidate" | "control_plane_summary" | "none";
  report_only: true;
  operation_blocking_allowed: false;
  readiness_mutation_allowed: false;
  core_state_mutation_allowed: false;
  governance_issue_refs: string[];
}

export interface F7LocalComplianceReport {
  report_id: string;
  case_id: string;
  mode: F7LocalShadowMode;
  report_only: true;
  event_ledger_count: number;
  timer_ledger_count: number;
  findings_count: number;
  no_go_count: number;
  soft_governance_activated: false;
  enforcement_activated: false;
  workflow_created: false;
  readiness_mutation_allowed: false;
  core_state_mutation_allowed: false;
  export_promotion_allowed: false;
}

export interface F7LocalSoftGovernanceShadowSignal {
  signal_id: string;
  case_id: string;
  signal_type:
    | "review_candidate"
    | "routing_candidate"
    | "export_block_candidate"
    | "no_go_candidate"
    | "none";
  report_only: true;
  creates_workflow: false;
  creates_task: false;
  blocks_operation: false;
}

export interface F7LocalNoGoDashboard {
  dashboard_id: string;
  case_id: string;
  no_go_triggered: false;
  checks: Record<string, false>;
  blockers_count: 0;
  warnings_count: number;
  report_only: true;
}

export interface F7LocalControlPlaneShadowInput {
  case_id: string;
  f6_membrane_result: F6LocalIntegrationMembraneResult;
  options?: {
    version?: string;
  };
}

export interface F7LocalControlPlaneShadowResult {
  ok: boolean;
  case_id: string;
  event_ledger: F7LocalEventLedgerEntry[];
  timer_ledger: F7LocalTimerLedgerEntry[];
  transition_findings: F7LocalTransitionFinding[];
  compliance_report: F7LocalComplianceReport;
  soft_governance_shadow_signals: F7LocalSoftGovernanceShadowSignal[];
  no_go_dashboard: F7LocalNoGoDashboard;
  no_go: {
    control_plane_real_opened: false;
    sg_shadow_real_opened: false;
    soft_governance_activated: false;
    enforcement_activated: false;
    workflow_created: false;
    task_created: false;
    operation_blocked: false;
    readiness_mutated: false;
    core_state_mutated: false;
    runtime_40_20_full_opened: false;
    production_integration_opened: false;
    diagnosis_created: false;
    registry_created: false;
    ir_created: false;
    export_created: false;
    delivered_created: false;
    delivery_authorized: false;
    mba_written: false;
    supabase_touched: false;
    sql_created: false;
    env_read: false;
  };
  materiality: {
    level: "f7_local_control_plane_shadow_readiness";
    local_only: true;
    report_only: true;
    production_integration: false;
    next_authorization_required: true;
  };
}
