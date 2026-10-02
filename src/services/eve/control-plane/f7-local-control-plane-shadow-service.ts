import type {
  F7LocalComplianceReport,
  F7LocalControlPlaneShadowInput,
  F7LocalControlPlaneShadowResult,
  F7LocalEventLedgerEntry,
  F7LocalFindingSeverity,
  F7LocalNoGoDashboard,
  F7LocalSoftGovernanceShadowSignal,
  F7LocalTimerLedgerEntry,
  F7LocalTransitionFinding,
} from "./f7-local-control-plane-shadow-types";

const NO_GO: F7LocalControlPlaneShadowResult["no_go"] = {
  control_plane_real_opened: false,
  sg_shadow_real_opened: false,
  soft_governance_activated: false,
  enforcement_activated: false,
  workflow_created: false,
  task_created: false,
  operation_blocked: false,
  readiness_mutated: false,
  core_state_mutated: false,
  runtime_40_20_full_opened: false,
  production_integration_opened: false,
  diagnosis_created: false,
  registry_created: false,
  ir_created: false,
  export_created: false,
  delivered_created: false,
  delivery_authorized: false,
  mba_written: false,
  supabase_touched: false,
  sql_created: false,
  env_read: false,
};

const MATERIALITY: F7LocalControlPlaneShadowResult["materiality"] = {
  level: "f7_local_control_plane_shadow_readiness",
  local_only: true,
  report_only: true,
  production_integration: false,
  next_authorization_required: true,
};

export function runF7LocalControlPlaneShadow(
  input: F7LocalControlPlaneShadowInput,
): F7LocalControlPlaneShadowResult {
  const f6Safe = isF6LocalSafe(input);
  const eventLedger = buildEventLedger(input.case_id);
  const timerLedger = buildTimerLedger(input.case_id, eventLedger, input);
  const transitionFindings = buildTransitionFindings(input, f6Safe);
  const shadowSignals = buildShadowSignals(input, transitionFindings);
  const noGoDashboard = buildNoGoDashboard(input, transitionFindings);
  const complianceReport = buildComplianceReport({
    input,
    eventLedger,
    timerLedger,
    transitionFindings,
    noGoDashboard,
  });

  return {
    ok: f6Safe,
    case_id: input.case_id,
    event_ledger: eventLedger,
    timer_ledger: timerLedger,
    transition_findings: transitionFindings,
    compliance_report: complianceReport,
    soft_governance_shadow_signals: shadowSignals,
    no_go_dashboard: noGoDashboard,
    no_go: NO_GO,
    materiality: MATERIALITY,
  };
}

function isF6LocalSafe(input: F7LocalControlPlaneShadowInput): boolean {
  const f6 = input.f6_membrane_result;
  return (
    f6.ok === true &&
    f6.materiality.local_only === true &&
    f6.materiality.production_integration === false &&
    f6.no_go.integration_membrane_real_opened === false &&
    f6.no_go.production_integration_opened === false
  );
}

function buildEventLedger(caseId: string): F7LocalEventLedgerEntry[] {
  const eventTypes: F7LocalEventLedgerEntry["event_type"][] = [
    "membrane_outbox_observed",
    "snapshot_observed",
    "handoff_boundary_observed",
    "export_boundary_observed",
    "review_control_observed",
    "summary_projection_observed",
  ];

  return eventTypes.map((eventType, index) => ({
    event_id: `F7_LOCAL_EVENT:${caseId}:${index + 1}:${eventType}`,
    case_id: caseId,
    source: "F6_LOCAL_MEMBRANE",
    event_type: eventType,
    state: "recorded",
    report_only: true,
    audit_log: [
      {
        event: "f7_local_event_ledger_entry_created",
        report_only: true,
        persisted: false,
      },
    ],
  }));
}

function buildTimerLedger(
  caseId: string,
  events: F7LocalEventLedgerEntry[],
  input: F7LocalControlPlaneShadowInput,
): F7LocalTimerLedgerEntry[] {
  const timerTypes: F7LocalTimerLedgerEntry["timer_type"][] = [
    "review_control_timer",
    "handoff_boundary_timer",
    "export_boundary_timer",
    "no_go_review_timer",
  ];

  return timerTypes.map((timerType, index) => ({
    timer_id: `F7_LOCAL_TIMER:${caseId}:${index + 1}:${timerType}`,
    case_id: caseId,
    source_event_id: events[index]?.event_id ?? events[0].event_id,
    timer_type: timerType,
    state:
      timerType === "review_control_timer" &&
      !input.f6_membrane_result.review_control_record.review_required
        ? "not_required"
        : "observed",
    report_only: true,
    blocks_operation: false,
  }));
}

function buildTransitionFindings(
  input: F7LocalControlPlaneShadowInput,
  f6Safe: boolean,
): F7LocalTransitionFinding[] {
  const f6 = input.f6_membrane_result;
  const findings: F7LocalTransitionFinding[] = [];

  if (!f6Safe || f6.handoff_boundary_decision.decision === "handoff_blocked") {
    findings.push(
      finding({
        caseId: input.case_id,
        type: "handoff_blocked",
        severity: "medium",
        routeTo: "control_plane_summary",
        governanceIssueRefs: f6.governance_issue_refs,
      }),
    );
  } else if (
    f6.handoff_boundary_decision.decision ===
    "local_handoff_ready_with_restrictions"
  ) {
    findings.push(
      finding({
        caseId: input.case_id,
        type: "handoff_ready_with_restrictions",
        severity: "low",
        routeTo: "P-SUP-06_candidate",
        governanceIssueRefs: f6.governance_issue_refs,
      }),
    );
  }

  findings.push(
    finding({
      caseId: input.case_id,
      type: "export_blocked",
      severity: "info",
      routeTo: "control_plane_summary",
      governanceIssueRefs: f6.export_boundary_check.governance_issue_refs,
    }),
  );

  if (f6.review_control_record.review_required) {
    findings.push(
      finding({
        caseId: input.case_id,
        type: "review_required",
        severity: "medium",
        routeTo: "control_plane_summary",
        governanceIssueRefs: f6.governance_issue_refs,
      }),
    );
  }

  findings.push(
    finding({
      caseId: input.case_id,
      type: "summary_only_projection",
      severity: "info",
      routeTo: "control_plane_summary",
      governanceIssueRefs: [],
    }),
    finding({
      caseId: input.case_id,
      type: "no_go_boundary_preserved",
      severity: "info",
      routeTo: "control_plane_summary",
      governanceIssueRefs: [],
    }),
  );

  return findings;
}

function finding(params: {
  caseId: string;
  type: F7LocalTransitionFinding["finding_type"];
  severity: F7LocalFindingSeverity;
  routeTo: F7LocalTransitionFinding["route_to"];
  governanceIssueRefs: string[];
}): F7LocalTransitionFinding {
  return {
    finding_id: `F7_LOCAL_FINDING:${params.caseId}:${params.type}`,
    case_id: params.caseId,
    source: "F6_LOCAL_MEMBRANE",
    finding_type: params.type,
    severity: params.severity,
    route_to: params.routeTo,
    report_only: true,
    operation_blocking_allowed: false,
    readiness_mutation_allowed: false,
    core_state_mutation_allowed: false,
    governance_issue_refs: unique(params.governanceIssueRefs),
  };
}

function buildComplianceReport(params: {
  input: F7LocalControlPlaneShadowInput;
  eventLedger: F7LocalEventLedgerEntry[];
  timerLedger: F7LocalTimerLedgerEntry[];
  transitionFindings: F7LocalTransitionFinding[];
  noGoDashboard: F7LocalNoGoDashboard;
}): F7LocalComplianceReport {
  return {
    report_id: `F7_LOCAL_COMPLIANCE_REPORT:${params.input.case_id}`,
    case_id: params.input.case_id,
    mode: "report_only",
    report_only: true,
    event_ledger_count: params.eventLedger.length,
    timer_ledger_count: params.timerLedger.length,
    findings_count: params.transitionFindings.length,
    no_go_count: params.noGoDashboard.warnings_count,
    soft_governance_activated: false,
    enforcement_activated: false,
    workflow_created: false,
    readiness_mutation_allowed: false,
    core_state_mutation_allowed: false,
    export_promotion_allowed: false,
  };
}

function buildShadowSignals(
  input: F7LocalControlPlaneShadowInput,
  findings: F7LocalTransitionFinding[],
): F7LocalSoftGovernanceShadowSignal[] {
  const signalTypes = new Set<F7LocalSoftGovernanceShadowSignal["signal_type"]>();

  if (input.f6_membrane_result.review_control_record.review_required) {
    signalTypes.add("review_candidate");
  }
  if (
    input.f6_membrane_result.handoff_boundary_decision.decision !==
    "handoff_blocked"
  ) {
    signalTypes.add("routing_candidate");
  }
  if (findings.some((findingItem) => findingItem.finding_type === "export_blocked")) {
    signalTypes.add("export_block_candidate");
  }
  if (
    findings.some(
      (findingItem) =>
        findingItem.finding_type === "no_go_boundary_preserved",
    )
  ) {
    signalTypes.add("no_go_candidate");
  }
  if (signalTypes.size === 0) {
    signalTypes.add("none");
  }

  return Array.from(signalTypes).map((signalType) => ({
    signal_id: `F7_LOCAL_SG_SHADOW_SIGNAL:${input.case_id}:${signalType}`,
    case_id: input.case_id,
    signal_type: signalType,
    report_only: true,
    creates_workflow: false,
    creates_task: false,
    blocks_operation: false,
  }));
}

function buildNoGoDashboard(
  input: F7LocalControlPlaneShadowInput,
  findings: F7LocalTransitionFinding[],
): F7LocalNoGoDashboard {
  const checks: Record<string, false> = {
    control_plane_real_opened: false,
    sg_shadow_real_opened: false,
    soft_governance_activated: false,
    enforcement_activated: false,
    workflow_created: false,
    task_created: false,
    operation_blocked: false,
    readiness_mutated: false,
    core_state_mutated: false,
    runtime_40_20_full_opened: false,
    production_integration_opened: false,
    diagnosis_created: false,
    registry_created: false,
    ir_created: false,
    export_created: false,
    delivered_created: false,
    delivery_authorized: false,
    mba_written: false,
    supabase_touched: false,
    sql_created: false,
    env_read: false,
  };

  return {
    dashboard_id: `F7_LOCAL_NO_GO_DASHBOARD:${input.case_id}`,
    case_id: input.case_id,
    no_go_triggered: false,
    checks,
    blockers_count: 0,
    warnings_count: findings.length,
    report_only: true,
  };
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
