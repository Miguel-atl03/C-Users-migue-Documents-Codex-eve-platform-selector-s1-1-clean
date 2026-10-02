import type {
  F8LocalDesignReadinessAssessment,
  F8LocalMDSBHandoffCandidate,
  F8LocalNoGoParallelProductionCheck,
  F8LocalObjectCandidateLinkageCheck,
  F8LocalParallelProductionRehearsalInput,
  F8LocalParallelProductionRehearsalResult,
  F8LocalParallelProductionRehearsalRun,
  F8LocalReadinessOutcome,
  F8LocalRuntimeEvidenceBundleReference,
  F8LocalSGShadowParallelAuditNote,
} from "./f8-local-parallel-production-rehearsal-types";

const FORBIDDEN_CONSUMERS: F8LocalMDSBHandoffCandidate["forbidden_consumers"] = [
  "registry",
  "IR",
  "export",
  "diagnosis",
  "production_parallel_real",
];

const NO_GO: F8LocalParallelProductionRehearsalResult["no_go"] = {
  runtime_40_20_full_opened: false,
  production_parallel_real_opened: false,
  registry_created: false,
  ir_created: false,
  export_created: false,
  export_code_package_created: false,
  diagnosis_created: false,
  delivered_created: false,
  delivery_authorized: false,
  evidence_bundle_mutated: false,
  readiness_mutated: false,
  core_state_mutated: false,
  workflow_created: false,
  task_created: false,
  operation_blocked: false,
  mba_written: false,
  parallel_production_artifacts_written: false,
  supabase_touched: false,
  sql_created: false,
  env_read: false,
};

const MATERIALITY: F8LocalParallelProductionRehearsalResult["materiality"] = {
  level: "f8_local_parallel_production_rehearsal_readiness",
  local_only: true,
  report_only: true,
  production_integration: false,
  next_authorization_required: true,
};

export function runF8LocalParallelProductionRehearsal(
  input: F8LocalParallelProductionRehearsalInput,
): F8LocalParallelProductionRehearsalResult {
  const f6Accepted = isF6Accepted(input);
  const f7Accepted = isF7Accepted(input);
  const candidateAllowed = isCandidateAllowed(input);
  const restrictions = buildRestrictions(input, f6Accepted, f7Accepted);
  const outcome = decideOutcome(f6Accepted, f7Accepted, restrictions);
  const ok = f6Accepted && f7Accepted && candidateAllowed;
  const governanceIssueRefs = unique([
    ...input.f6_membrane_result.governance_issue_refs,
    ...input.f7_shadow_result.transition_findings.flatMap(
      (finding) => finding.governance_issue_refs,
    ),
    ...restrictions.map((restriction) => `F8_LOCAL_RESTRICTION:${restriction}`),
  ]);

  return {
    ok,
    case_id: input.case_id,
    rehearsal_run: buildRehearsalRun(input, ok),
    mdsb_handoff_candidate: buildCandidate(input, governanceIssueRefs),
    design_readiness_assessment: buildAssessment({
      input,
      outcome,
      restrictions,
      governanceIssueRefs,
    }),
    no_go_parallel_production_check: buildNoGoCheck(input.case_id, restrictions),
    object_candidate_linkage_check: buildLinkageCheck(input),
    runtime_evidence_bundle_reference: buildEvidenceReference(input),
    sg_shadow_parallel_audit_note: buildAuditNote(input),
    blocked_reason: ok ? undefined : firstRestriction(restrictions),
    governance_issue_refs: governanceIssueRefs,
    no_go: NO_GO,
    materiality: MATERIALITY,
  };
}

function isF6Accepted(input: F8LocalParallelProductionRehearsalInput): boolean {
  const f6 = input.f6_membrane_result;
  return (
    f6.ok === true &&
    f6.materiality.local_only === true &&
    f6.materiality.production_integration === false &&
    f6.no_go.integration_membrane_real_opened === false &&
    f6.no_go.production_integration_opened === false &&
    f6.export_boundary_check.export_allowed === false
  );
}

function isF7Accepted(input: F8LocalParallelProductionRehearsalInput): boolean {
  const f7 = input.f7_shadow_result;
  return (
    f7.ok === true &&
    f7.materiality.report_only === true &&
    f7.no_go.control_plane_real_opened === false &&
    f7.no_go.sg_shadow_real_opened === false &&
    f7.no_go.soft_governance_activated === false &&
    f7.no_go.enforcement_activated === false
  );
}

function isCandidateAllowed(
  input: F8LocalParallelProductionRehearsalInput,
): boolean {
  const decision = input.f6_membrane_result.handoff_boundary_decision.decision;
  return (
    input.f6_membrane_result.outbox.allowed_to_leave_membrane === true &&
    (decision === "local_handoff_ready" ||
      decision === "local_handoff_ready_with_restrictions")
  );
}

function buildRestrictions(
  input: F8LocalParallelProductionRehearsalInput,
  f6Accepted: boolean,
  f7Accepted: boolean,
): string[] {
  const restrictions = [
    "production_parallel_real_blocked",
    "registry_blocked",
    "ir_blocked",
    "export_blocked",
    "diagnosis_blocked",
  ];

  if (!f6Accepted) {
    restrictions.push("f6_membrane_not_local_safe");
  }
  if (!f7Accepted) {
    restrictions.push("f7_shadow_not_report_only_safe");
  }
  if (!isCandidateAllowed(input)) {
    restrictions.push("mdsb_handoff_candidate_not_allowed");
  }
  if (input.f6_membrane_result.snapshot.review_required_count > 0) {
    restrictions.push("review_required_refs_present");
  }

  return unique(restrictions);
}

function decideOutcome(
  f6Accepted: boolean,
  f7Accepted: boolean,
  restrictions: string[],
): F8LocalReadinessOutcome {
  if (!f6Accepted || !f7Accepted) {
    return "blocked";
  }
  if (
    restrictions.includes("review_required_refs_present") ||
    restrictions.includes("mdsb_handoff_candidate_not_allowed")
  ) {
    return "ready_with_restrictions";
  }
  return "ready_for_local_rehearsal";
}

function buildRehearsalRun(
  input: F8LocalParallelProductionRehearsalInput,
  ok: boolean,
): F8LocalParallelProductionRehearsalRun {
  return {
    rehearsal_run_id: `F8_LOCAL_REHEARSAL:${input.case_id}`,
    case_id: input.case_id,
    state: ok ? "rehearsal_ready_local" : "rehearsal_blocked",
    source_f6_ref: input.f6_membrane_result.outbox.outbox_id,
    source_f7_ref: input.f7_shadow_result.compliance_report.report_id,
    local_only: true,
    production_integration: false,
    audit_log: [
      {
        event: "f8_local_parallel_production_rehearsal_created",
        production_parallel_real_opened: false,
        persisted: false,
      },
    ],
  };
}

function buildCandidate(
  input: F8LocalParallelProductionRehearsalInput,
  governanceIssueRefs: string[],
): F8LocalMDSBHandoffCandidate {
  return {
    mdsb_handoff_candidate_id: `F8_LOCAL_MDSB_CANDIDATE:${input.case_id}`,
    case_id: input.case_id,
    source_outbox_ref: input.f6_membrane_result.outbox.outbox_id,
    source_snapshot_ref: input.f6_membrane_result.snapshot.snapshot_id,
    source_summary_projection_ref:
      input.f6_membrane_result.membrane_projection_summary.projection_summary_id,
    candidate_only: true,
    allowed_consumers: [
      "future_mdsb_candidate",
      "qa_audit",
      "control_plane_summary",
    ],
    forbidden_consumers: FORBIDDEN_CONSUMERS,
    governance_issue_refs: governanceIssueRefs,
  };
}

function buildAssessment(params: {
  input: F8LocalParallelProductionRehearsalInput;
  outcome: F8LocalReadinessOutcome;
  restrictions: string[];
  governanceIssueRefs: string[];
}): F8LocalDesignReadinessAssessment {
  return {
    assessment_id: `F8_LOCAL_DESIGN_READINESS:${params.input.case_id}`,
    case_id: params.input.case_id,
    outcome: params.outcome,
    dominant_gate: params.outcome === "blocked" ? "handoff_boundary" : "no_go",
    ready_for_real_parallel_production: false,
    ready_for_registry: false,
    ready_for_ir: false,
    ready_for_export: false,
    restrictions: params.restrictions,
    governance_issue_refs: params.governanceIssueRefs,
  };
}

function buildNoGoCheck(
  caseId: string,
  restrictions: string[],
): F8LocalNoGoParallelProductionCheck {
  return {
    no_go_check_id: `F8_LOCAL_NO_GO_PP:${caseId}`,
    case_id: caseId,
    no_go_triggered: false,
    production_parallel_real_allowed: false,
    registry_allowed: false,
    ir_allowed: false,
    export_allowed: false,
    diagnosis_allowed: false,
    export_code_package_created: false,
    blockers_count: 0,
    warnings: restrictions,
  };
}

function buildLinkageCheck(
  input: F8LocalParallelProductionRehearsalInput,
): F8LocalObjectCandidateLinkageCheck {
  const snapshot = input.f6_membrane_result.snapshot;
  const reviewRefs = input.f7_shadow_result.transition_findings
    .filter((finding) => finding.finding_type === "review_required")
    .map((finding) => finding.finding_id);

  return {
    linkage_check_id: `F8_LOCAL_OBJECT_LINKAGE:${input.case_id}`,
    case_id: input.case_id,
    source_bindings_seen: snapshot.bindings_count,
    materialization_events_seen: snapshot.materialization_events_count,
    object_candidate_linkage_ok:
      snapshot.bindings_count > 0 && snapshot.materialization_events_count > 0,
    unresolved_object_refs: [],
    review_required_refs: reviewRefs,
    local_only: true,
  };
}

function buildEvidenceReference(
  input: F8LocalParallelProductionRehearsalInput,
): F8LocalRuntimeEvidenceBundleReference {
  return {
    runtime_evidence_bundle_reference_id: `F8_LOCAL_EVIDENCE_REF:${input.case_id}`,
    case_id: input.case_id,
    source_membrane_snapshot_ref: input.f6_membrane_result.snapshot.snapshot_id,
    evidence_reference_only: true,
    mutates_evidence_bundle: false,
    mutates_readiness: false,
  };
}

function buildAuditNote(
  input: F8LocalParallelProductionRehearsalInput,
): F8LocalSGShadowParallelAuditNote {
  return {
    audit_note_id: `F8_LOCAL_SG_AUDIT_NOTE:${input.case_id}`,
    case_id: input.case_id,
    source_compliance_report_ref:
      input.f7_shadow_result.compliance_report.report_id,
    report_only: true,
    creates_workflow: false,
    creates_task: false,
    blocks_operation: false,
    note: "SG Shadow remains report-only for local parallel production rehearsal.",
  };
}

function firstRestriction(restrictions: string[]): string | undefined {
  return restrictions.find((restriction) =>
    [
      "f6_membrane_not_local_safe",
      "f7_shadow_not_report_only_safe",
      "mdsb_handoff_candidate_not_allowed",
    ].includes(restriction),
  );
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
