import { createHash } from "node:crypto";

const V03_BASELINE = "Soft Governance Readiness Plan Consolidado V03.0";
const ACTIVATION_READINESS_PLAN_TITLE = "Scoped Soft Governance Activation Readiness Plan";
const ACTIVATION_READINESS_BASELINE =
  "Incremento 1.8A - Scoped Soft Governance Activation Readiness Plan Consolidado V01.1";
const ACTIVE_CANDIDATE_DEFINITION =
  "Dominio candidato para una futura activacion acotada; mientras el modo efectivo sea shadow_mode no produce efecto operativo.";

const ACTIVE_CANDIDATE_DOMAINS = Object.freeze(["P-SUP-06", "P-SUP-07/08", "P-SUP-09 frontera"]);
const READ_ONLY_REPORTING_DOMAINS = Object.freeze(["P-SUP-01", "P-SUP-02"]);
const EXCLUDED_DOMAINS = Object.freeze([
  "P-CORE-01",
  "P-CLIENT-01",
  "P-SUP-03",
  "P-SUP-04",
  "P-SUP-05",
]);

const REVIEW_DUE_POLICY_BY_SEVERITY = Object.freeze({
  Info: null,
  Low: null,
  Medium: "5-10 business days",
  High: "2-5 business days",
  CriticalCandidate: "2-5 business days",
});

const ALLOWED_REVIEW_STATES = Object.freeze([
  "Detected",
  "Classified",
  "Routed",
  "ReviewPending",
  "InReview",
  "ClosedNoAction",
  "ClosedWithRecommendation",
  "AcceptedRisk",
  "Superseded",
]);

const invariantFlags = Object.freeze({
  operation_blocking_allowed: false,
  readiness_mutation_allowed: false,
  core_state_mutation_allowed: false,
  export_promotion_allowed: false,
  enforcement_activation_allowed: false,
  soft_governance_activation_allowed: false,
  session_ready_for_transduction_target_state_allowed: false,
  mba_tables_as_operational_storage_allowed: false,
  parallel_production_can_diagnose: false,
  parallel_production_can_monetize: false,
  parallel_production_can_replace_evidence_bundle: false,
});

const findingMappings = Object.freeze({
  "MBA-WARN-ALGEDONIC-RISK-HUMAN-COMPENSATION": {
    finding_category: "AlgedonicSignal",
    finding_categories: ["AlgedonicSignal", "Warning"],
    severity: "High",
    routing_primary: "Canal Algedonico",
    routing_secondary: ["S3*", "S5", "S4", "S3"],
    vsm_primary_system: "Canal Algedonico",
    vsm_secondary_systems: ["S3*", "S5", "S4", "S3"],
    review_owner: "S3*",
    review_due_policy: "2-5 business days",
    review_task_candidate: true,
    hard_gate_candidate: false,
    algedonic_flag: true,
    variety_risk_level: "High",
    human_review_required: true,
    recommended_action:
      "Review human compensation evidence and determine whether variety is being absorbed structurally or by unsustainable human effort.",
    prohibited_actions: [
      "block_operation",
      "mutate_readiness",
      "mutate_core_state",
      "activate_enforcement",
      "diagnose_from_parallel_production",
    ],
  },
  "MBA-WARN-RESIDUAL-COORDINATION-VARIETY": {
    finding_category: "GovernanceRecommendation",
    finding_categories: ["GovernanceRecommendation", "Warning"],
    severity: "Medium",
    routing_primary: "S2",
    routing_secondary: ["S3", "S4"],
    vsm_primary_system: "S2",
    vsm_secondary_systems: ["S3", "S4"],
    review_owner: "S2",
    review_due_policy: "5-10 business days",
    review_task_candidate: true,
    hard_gate_candidate: false,
    algedonic_flag: false,
    variety_risk_level: "Medium",
    human_review_required: true,
    recommended_action:
      "Review residual coordination variety and decide whether S2 coordination adjustment is needed.",
    prohibited_actions: ["block_operation", "mutate_readiness", "mutate_core_state", "centralize_control_in_s3"],
  },
  "MBA-WARN-CANDIDATE-EXPORT-NOT-PROMOTED": {
    finding_category: "Warning",
    finding_categories: ["Warning"],
    severity: "Low",
    routing_primary: "P-SUP-06",
    routing_secondary: ["S3", "S4"],
    vsm_primary_system: "P-SUP-06",
    vsm_secondary_systems: ["S3", "S4"],
    review_owner: "P-SUP-06",
    review_due_policy: null,
    review_task_candidate: false,
    hard_gate_candidate: false,
    algedonic_flag: false,
    variety_risk_level: "Low",
    human_review_required: false,
    recommended_action:
      "Treat non-promotion as expected when export promotion is not allowed or export gates are not satisfied.",
    prohibited_actions: [
      "treat_as_automatic_error",
      "promote_export",
      "mutate_readiness",
      "mutate_core_state",
    ],
  },
  "ArchitectureConsistencyAssessment [WithFindings]": {
    finding_category: "ArchitectureConsistencyFinding",
    finding_categories: ["ArchitectureConsistencyFinding", "ReviewableFinding"],
    severity: "Medium",
    routing_primary: "P-SUP-06",
    routing_secondary: ["S2", "S3", "S3*", "S4", "S5"],
    vsm_primary_system: "P-SUP-06",
    vsm_secondary_systems: ["S2", "S3", "S3*", "S4", "S5"],
    review_owner: "P-SUP-06",
    review_due_policy: "5-10 business days",
    review_task_candidate: true,
    hard_gate_candidate: false,
    algedonic_flag: false,
    variety_risk_level: "Medium",
    human_review_required: true,
    recommended_action:
      "Classify architecture findings and return rework/QA signals to P-SUP-06; WithFindings is not Satisfied.",
    prohibited_actions: ["treat_with_findings_as_satisfied", "promote_export", "mutate_readiness", "mutate_core_state"],
  },
  "NC-05": {
    finding_category: "Nonconformance",
    finding_categories: ["Nonconformance", "HardGateCandidate"],
    severity: "High",
    routing_primary: "S3*",
    routing_secondary: ["S4", "S5", "S3"],
    vsm_primary_system: "S3*",
    vsm_secondary_systems: ["S4", "S5", "S3"],
    review_owner: "S3*",
    review_due_policy: "2-5 business days",
    review_task_candidate: true,
    hard_gate_candidate: true,
    algedonic_flag: false,
    variety_risk_level: "High",
    human_review_required: true,
    recommended_action:
      "Audit the Process State without timer and keep NC-05 as a future HardGateCandidate without repairing automatically.",
    prohibited_actions: ["block_operation", "auto_repair_timer", "mutate_readiness", "mutate_core_state"],
  },
});

const hash = (value) => createHash("sha256").update(String(value)).digest("hex");

const stableStringify = (value) => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
};

const asArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);

const findingCode = (finding) => finding.finding_code ?? finding.rule_id ?? finding.code ?? null;

const sourceRuntimeFamily = (finding, event) =>
  finding.source_runtime_family ??
  finding.source_adapter ??
  event?.source_adapter ??
  (finding.object_type === "ExportCodePackage" || finding.object_type === "ArchitectureConsistencyAssessment"
    ? "parallel_production"
    : "mba_control_plane");

const sourceArtifactType = (finding, event) =>
  finding.source_artifact_type ??
  finding.object_type ??
  event?.object_type ??
  event?.payload?.source_artifact ??
  "unknown";

const sourceArtifactId = ({ finding, event, reportId }) => {
  if (finding.source_artifact_id) return { value: finding.source_artifact_id, fallback_used: "source_artifact_id" };
  if (finding.object_id) return { value: finding.object_id, fallback_used: "source_artifact_id" };
  if (event?.object_id) return { value: event.object_id, fallback_used: "source_artifact_id" };
  if (finding.event_id) return { value: finding.event_id, fallback_used: "event_id" };
  if (event?.event_id) return { value: event.event_id, fallback_used: "event_id" };
  const hashable = finding.detail ?? finding.description ?? event?.payload ?? null;
  if (hashable) return { value: hash(stableStringify(hashable)), fallback_used: "artifact_hash" };
  const canonicalReference = finding.canonical_source_reference ?? event?.payload?.source_artifact ?? null;
  if (canonicalReference) {
    return { value: canonicalReference, fallback_used: "canonical_source_reference" };
  }
  return { value: reportId, fallback_used: "report_id" };
};

const reviewDuePolicy = (severity, mappedPolicy) => {
  if (mappedPolicy) return mappedPolicy;
  return REVIEW_DUE_POLICY_BY_SEVERITY[severity] ?? null;
};

const severityFor = (mapping, finding) =>
  finding.severity === "CriticalCandidate" ? "CriticalCandidate" : mapping.severity;

const falsePositiveNonComputable = (finding) =>
  finding.false_positive_non_computable === true ||
  finding.false_positive === true ||
  finding.review_status === "ClosedNoAction" && finding.review_disposition === "false_positive";

const explicitV03HardGateCandidate = (mapping, finding) =>
  Boolean(mapping.hard_gate_candidate || finding.hard_gate_candidate === true || finding.prohibited_action_attempt === true);

const exportGateCandidateEvidence = (finding) => finding.export_gate_candidate_evidence ?? null;

const scopeFor = ({ finding, event, caseId, sessionId, sourceArtifactTypeValue, sourceArtifactIdValue }) => {
  if (finding.rule_id === "NC-05") {
    return {
      scope_type: "source_artifact",
      scope_id: `${sourceArtifactTypeValue}:${sourceArtifactIdValue}`,
    };
  }
  if (caseId) return { scope_type: "case", scope_id: caseId };
  if (sessionId) return { scope_type: "session", scope_id: sessionId };
  return {
    scope_type: "source_artifact",
    scope_id: `${event?.object_type ?? sourceArtifactTypeValue}:${sourceArtifactIdValue}`,
  };
};

const defaultReviewStatus = (hasRouting) => (hasRouting ? "Routed" : "Classified");

const makeDedupeKey = ({
  finding_code,
  case_id,
  session_id,
  source_artifact_type,
  source_artifact_id,
  source_runtime_family,
  routing_primary,
}) =>
  hash(
    [
      finding_code,
      case_id ?? "",
      session_id ?? "",
      source_artifact_type ?? "",
      source_artifact_id ?? "",
      source_runtime_family ?? "",
      routing_primary ?? "",
    ].join("|"),
  );

const makeRecurrenceKey = ({ finding_code, scope_type, scope_id, source_runtime_family }) =>
  hash([finding_code, scope_type ?? "", scope_id ?? "", source_runtime_family ?? ""].join("|"));

const eventById = (events) => new Map(events.map((event) => [event.event_id, event]));

const daysBetween = (later, earlier) => {
  const laterMs = Date.parse(later);
  const earlierMs = Date.parse(earlier);
  if (Number.isNaN(laterMs) || Number.isNaN(earlierMs)) return null;
  return Math.max(0, Math.floor((laterMs - earlierMs) / 86_400_000));
};

const severityRank = Object.freeze({
  Info: 0,
  Low: 1,
  Medium: 2,
  High: 3,
  CriticalCandidate: 4,
});

const isMediumPlus = (finding) => (severityRank[finding.severity] ?? -1) >= severityRank.Medium;

const countBy = (items, selector) =>
  items.reduce((accumulator, item) => {
    const key = selector(item) ?? "unknown";
    accumulator[key] = (accumulator[key] ?? 0) + 1;
    return accumulator;
  }, {});

const buildAgingSummary = ({ findings, generatedAt }) => {
  const entries = findings.map((finding) => {
    const detectedAt = finding.detected_at ?? null;
    const ageDays = detectedAt ? daysBetween(generatedAt, detectedAt) : null;
    return {
      finding_code: finding.finding_code,
      dedupe_key: finding.dedupe_key,
      severity: finding.severity,
      review_due_policy: finding.review_due_policy,
      detected_at: detectedAt,
      age_days: ageDays,
      aging_status: ageDays === null ? "unknown_missing_detected_at" : "reported",
    };
  });

  return {
    report_only: true,
    generated_at: generatedAt,
    thresholds: {
      Medium: "10 business days",
      High: "5 business days",
      CriticalCandidate: "2 business days",
    },
    entries,
    missing_detected_at_count: entries.filter((entry) => entry.age_days === null).length,
  };
};

const buildRoutingSummary = (findings) => ({
  report_only: true,
  by_routing_primary: countBy(findings, (finding) => finding.routing_primary),
  by_review_owner: countBy(findings, (finding) => finding.review_owner),
  p_sup_06_routed_count: findings.filter((finding) => finding.routing_primary === "P-SUP-06").length,
  algedonic_without_stable_owner_count: findings.filter(
    (finding) => finding.routing_primary === "Canal Algedonico" && finding.review_owner !== "Canal Algedonico",
  ).length,
  canal_algedonico_as_review_owner_count: findings.filter(
    (finding) => finding.review_owner === "Canal Algedonico",
  ).length,
});

const buildFalsePositiveSummary = ({ findings, readinessControls }) => {
  const explicitSummary = readinessControls.false_positive_summary ?? null;
  if (explicitSummary) {
    const mediumPlusTotal = explicitSummary.medium_plus_total ?? 0;
    const falsePositiveCount = explicitSummary.medium_plus_false_positive_count ?? 0;
    const rate = mediumPlusTotal > 0 ? falsePositiveCount / mediumPlusTotal : null;
    return {
      report_only: true,
      status: explicitSummary.status ?? (mediumPlusTotal > 0 ? "measured" : "insufficient_data"),
      window_days: explicitSummary.window_days ?? 30,
      objective_rate: 0.1,
      maximum_rate: 0.15,
      medium_plus_total: mediumPlusTotal,
      medium_plus_false_positive_count: falsePositiveCount,
      false_positive_medium_plus_rate_30d: rate,
      threshold_passed: rate !== null ? rate <= 0.15 : false,
      source: "readiness_controls_input",
    };
  }

  const mediumPlus = findings.filter(isMediumPlus);
  const falsePositiveMediumPlus = mediumPlus.filter((finding) => finding.false_positive_non_computable);
  const hasMeasuredWindow = readinessControls.false_positive_window_measured === true;
  const rate = mediumPlus.length > 0 ? falsePositiveMediumPlus.length / mediumPlus.length : null;

  return {
    report_only: true,
    status: hasMeasuredWindow ? "measured" : "insufficient_data",
    window_days: 30,
    objective_rate: 0.1,
    maximum_rate: 0.15,
    medium_plus_total: mediumPlus.length,
    medium_plus_false_positive_count: falsePositiveMediumPlus.length,
    false_positive_medium_plus_rate_30d: hasMeasuredWindow ? rate : null,
    threshold_passed: hasMeasuredWindow && rate !== null ? rate <= 0.15 : false,
    source: hasMeasuredWindow ? "normalized_findings" : "missing_measured_30d_window",
  };
};

const buildActivationCandidateScope = () => ({
  report_only: true,
  plan_title: ACTIVATION_READINESS_PLAN_TITLE,
  baseline: ACTIVATION_READINESS_BASELINE,
  active_candidate_definition: ACTIVE_CANDIDATE_DEFINITION,
  active_candidate_has_operational_effect: false,
  active_candidate_domains: [...ACTIVE_CANDIDATE_DOMAINS],
  read_only_reporting_domains: [...READ_ONLY_REPORTING_DOMAINS],
  excluded_domains: [...EXCLUDED_DOMAINS],
  scope_limited_to_allowed_domains: true,
  expands_to_global_mba: false,
});

const buildApprovalGate18ATo18B = () => ({
  report_only: true,
  approval_of_1_8a_authorizes_1_8b_implementation: false,
  separate_technical_prompt_required: true,
  human_review_required: true,
  no_go_rules_confirmation_required: true,
  no_activation_authorized: true,
});

const explicitEvidenceValue = (readinessControls, key) => {
  const evidence = readinessControls.minimum_evidence_for_1_8B ?? {};
  if (Object.hasOwn(evidence, key)) return evidence[key];
  return undefined;
};

const buildMinimumEvidenceFor18B = ({ logicalFindings, events, readinessControls }) => {
  const evidence = {
    baseline_shadow_clean:
      explicitEvidenceValue(readinessControls, "baseline_shadow_clean") ??
      (readinessControls.mode_effective ? readinessControls.mode_effective === "shadow_mode" : true),
    incremento_1_6_last_run_validated:
      explicitEvidenceValue(readinessControls, "incremento_1_6_last_run_validated") ?? "unknown",
    candidate_export_package_ready_with_warnings_observed:
      explicitEvidenceValue(readinessControls, "candidate_export_package_ready_with_warnings_observed") ??
      logicalFindings.some((finding) => finding.finding_code === "MBA-WARN-CANDIDATE-EXPORT-NOT-PROMOTED"),
    architecture_consistency_assessment_with_findings_to_p_sup_06:
      explicitEvidenceValue(readinessControls, "architecture_consistency_assessment_with_findings_to_p_sup_06") ??
      logicalFindings.some(
        (finding) =>
          finding.finding_code === "ArchitectureConsistencyAssessment [WithFindings]" &&
          finding.routing_primary === "P-SUP-06",
      ),
    export_code_package_generated_not_emitted:
      explicitEvidenceValue(readinessControls, "export_code_package_generated_not_emitted") ??
      !events.some(
        (event) => event.object_type === "ExportCodePackage" && event.target_state === "Generated",
      ),
    rls_anon_write_probe_42501:
      explicitEvidenceValue(readinessControls, "rls_anon_write_probe_42501") ??
      readinessControls.rls_anon_write_probe_42501 ??
      "unknown",
    repo_clean_before_changes:
      explicitEvidenceValue(readinessControls, "repo_clean_before_changes") ?? "unknown",
  };
  const missingOrUnknown = Object.entries(evidence)
    .filter(([, value]) => value !== true)
    .map(([key, value]) => ({ key, value }));

  return {
    report_only: true,
    required: evidence,
    satisfied: missingOrUnknown.length === 0,
    missing_or_unknown: missingOrUnknown,
  warnings: missingOrUnknown.map((item) => `${item.key}:${item.value}`),
  };
};

const rollbackAuthority = (readinessControls) => ({
  framework_authority: readinessControls.rollback_authority?.framework_authority ?? "S5",
  execution_authority: readinessControls.rollback_authority?.execution_authority ?? "S3",
  audit_authority: readinessControls.rollback_authority?.audit_authority ?? "S3*",
  human_operator_approval:
    readinessControls.rollback_authority?.human_operator_approval ?? "placeholder/report-only",
  creates_workflow: false,
});

const cleanActivationFlags = Object.freeze({
  soft_governance_mode_activated: false,
  enforcement_mode_activated: false,
});

const rollbackReviewTaskStatusIsSafe = (status) =>
  ["suspended_conceptual_only", "deferred_conceptual_only", "suspended/deferred_conceptually"].includes(status);

const buildRollbackSimulation = ({ logicalFindings, readinessControls, activationCandidateScope }) => {
  const simulation = readinessControls.rollback_simulation ?? {};
  const activationFlagsBefore = simulation.activation_flags_before ?? cleanActivationFlags;
  const activationFlagsAfter = simulation.activation_flags_after ?? cleanActivationFlags;
  const reviewTaskStatus =
    simulation.review_task_candidates_status_after_rollback ??
    (simulation.simulated_rollback_completed === true ? "deferred_conceptual_only" : "not_simulated");
  const resultChecks = [
    {
      key: "simulated_activation_not_started",
      failed: simulation.simulated_activation_started !== true,
    },
    {
      key: "simulated_rollback_not_requested",
      failed: simulation.simulated_rollback_requested !== true,
    },
    {
      key: "simulated_rollback_not_completed",
      failed: simulation.simulated_rollback_completed !== true,
    },
    {
      key: "effective_mode_before_not_shadow_mode",
      failed: (simulation.effective_mode_before ?? "shadow_mode") !== "shadow_mode",
    },
    {
      key: "effective_mode_after_not_shadow_mode",
      failed: (simulation.effective_mode_after ?? "shadow_mode") !== "shadow_mode",
    },
    {
      key: "activation_flags_before_not_false",
      failed:
        activationFlagsBefore.soft_governance_mode_activated !== false ||
        activationFlagsBefore.enforcement_mode_activated !== false,
    },
    {
      key: "activation_flags_after_not_false",
      failed:
        activationFlagsAfter.soft_governance_mode_activated !== false ||
        activationFlagsAfter.enforcement_mode_activated !== false,
    },
    {
      key: "readiness_mutation_detected",
      failed: simulation.readiness_mutation_detected === true,
    },
    {
      key: "core_state_mutation_detected",
      failed: simulation.core_state_mutation_detected === true,
    },
    {
      key: "export_promotion_detected",
      failed: simulation.export_promotion_detected === true,
    },
    {
      key: "findings_history_not_preserved",
      failed: simulation.findings_history_preserved !== true,
    },
    {
      key: "reports_history_not_preserved",
      failed: simulation.reports_history_preserved !== true,
    },
    {
      key: "review_task_candidates_not_suspended_or_deferred",
      failed: !rollbackReviewTaskStatusIsSafe(reviewTaskStatus),
    },
  ];
  const blockers = resultChecks.filter((check) => check.failed).map((check) => check.key);

  return {
    report_only: true,
    simulated_only: true,
    simulated_activation_started: simulation.simulated_activation_started === true,
    simulated_activation_scope: simulation.simulated_activation_scope ?? activationCandidateScope.active_candidate_domains,
    simulated_rollback_requested: simulation.simulated_rollback_requested === true,
    simulated_rollback_completed: simulation.simulated_rollback_completed === true,
    effective_mode_before: simulation.effective_mode_before ?? "shadow_mode",
    effective_mode_after: simulation.effective_mode_after ?? "shadow_mode",
    activation_flags_before: activationFlagsBefore,
    activation_flags_after: activationFlagsAfter,
    readiness_mutation_detected: simulation.readiness_mutation_detected === true,
    core_state_mutation_detected: simulation.core_state_mutation_detected === true,
    export_promotion_detected: simulation.export_promotion_detected === true,
    findings_history_preserved: simulation.findings_history_preserved === true,
    reports_history_preserved: simulation.reports_history_preserved === true,
    review_task_candidates_status_after_rollback: reviewTaskStatus,
    rollback_authority: rollbackAuthority(readinessControls),
    audit_trail_summary: {
      report_only: true,
      findings_count_before: logicalFindings.length,
      findings_count_after: logicalFindings.length,
      findings_history_action: "preserve",
      reports_history_action: "preserve",
      ledgers_history_action: "preserve",
      operational_rollback_executed: false,
    },
    no_go_trigger_simulated: simulation.no_go_trigger_simulated ?? null,
    blockers,
    result: blockers.length === 0 ? "pass" : "fail",
  };
};

const buildRollbackStatus = ({ readinessControls, rollbackSimulation }) => ({
  report_only: true,
  status: rollbackSimulation.result === "pass" ? "ready" : "blocked",
  ready: rollbackSimulation.result === "pass",
  mode_effective: "shadow_mode",
  simulated_only: true,
  rollback_tested:
    rollbackSimulation.simulated_activation_started === true &&
    rollbackSimulation.simulated_rollback_requested === true &&
    rollbackSimulation.simulated_rollback_completed === true,
  rollback_test_type: "report_only_simulation",
  last_simulation_result: rollbackSimulation.result,
  blockers: rollbackSimulation.blockers,
  warnings:
    rollbackSimulation.result === "pass"
      ? []
      : ["rollback_simulation_not_ready_for_activation_candidate"],
  tested_end_to_end: rollbackSimulation.result === "pass",
  executes_real_rollback: false,
  authorized_by: rollbackSimulation.rollback_authority.framework_authority,
  executed_by: rollbackSimulation.rollback_authority.execution_authority,
  audited_by: rollbackSimulation.rollback_authority.audit_authority,
  evidence_reference: readinessControls.rollback_status?.evidence_reference ?? null,
});

const buildScopedDomains = ({ logicalFindings, readinessControls }) => [
  ...ACTIVE_CANDIDATE_DOMAINS.map((domain) => ({
    domain,
    participation: "active_candidate",
    readiness: readinessControls.scoped_domain_readiness?.[domain] ?? "report_only_not_activated",
    finding_count: logicalFindings.filter(
      (finding) => finding.routing_primary === domain || finding.vsm_primary_system === domain,
    ).length,
  })),
  ...READ_ONLY_REPORTING_DOMAINS.map((domain) => ({
    domain,
    participation: "read_only_reporting",
    readiness: readinessControls.scoped_domain_readiness?.[domain] ?? "read_only_reported",
    finding_count: logicalFindings.filter(
      (finding) => finding.routing_primary === domain || finding.vsm_primary_system === domain,
    ).length,
    can_mutate_readiness: false,
    can_mutate_core_state: false,
  })),
];

const buildReadinessControls = ({ readinessControls, summariesPresent, invariantsPreserved }) => ({
  report_only: true,
  no_activation: true,
  no_enforcement: true,
  no_workflow_real: true,
  rls_security_current: readinessControls.rls_security_current === true,
  summaries_present: summariesPresent,
  invariants_preserved: invariantsPreserved,
});

const buildNoGoDashboard = ({
  activationScope,
  rollbackStatus,
  falsePositiveSummary,
  minimumEvidenceStatus,
  routingSummary,
  readinessControls,
  summariesPresent,
}) => {
  const checks = [
    {
      no_go: "scope_expanded_beyond_1_8a",
      active: activationScope.scope_limited_to_allowed_domains !== true,
      evidence: activationScope.scope_limited_to_allowed_domains,
    },
    {
      no_go: "rollback_not_ready",
      active: rollbackStatus.ready !== true || rollbackStatus.tested_end_to_end !== true,
      evidence: rollbackStatus,
    },
    {
      no_go: "false_positive_threshold_missing_or_failed",
      active:
        falsePositiveSummary.status !== "measured" ||
        falsePositiveSummary.false_positive_medium_plus_rate_30d === null ||
        falsePositiveSummary.false_positive_medium_plus_rate_30d > falsePositiveSummary.maximum_rate,
      evidence: falsePositiveSummary,
    },
    {
      no_go: "reporting_missing",
      active: summariesPresent !== true,
      evidence: { summaries_present: summariesPresent },
    },
    {
      no_go: "rls_security_not_current",
      active: readinessControls.rls_security_current !== true,
      evidence: { rls_security_current: readinessControls.rls_security_current === true },
    },
    {
      no_go: "minimum_evidence_for_1_8b_missing",
      active: minimumEvidenceStatus.satisfied !== true,
      evidence: minimumEvidenceStatus,
    },
    {
      no_go: "canal_algedonico_as_stable_owner",
      active: routingSummary.canal_algedonico_as_review_owner_count > 0,
      evidence: { count: routingSummary.canal_algedonico_as_review_owner_count },
    },
    {
      no_go: "operation_blocking_detected",
      active: false,
      evidence: { operation_blocking_allowed: false },
    },
    {
      no_go: "readiness_core_or_export_mutation_detected",
      active: false,
      evidence: {
        readiness_mutation_allowed: false,
        core_state_mutation_allowed: false,
        export_promotion_allowed: false,
      },
    },
    {
      no_go: "activation_mode_detected",
      active: false,
      evidence: {
        soft_governance_mode_activated: false,
        enforcement_mode_activated: false,
      },
    },
  ];

  return {
    report_only: true,
    no_go_checklist_version: "1.8B-report-only-v1",
    blockers: checks.filter((check) => check.active),
    checks,
    blocks_operation: false,
    activates_enforcement: false,
  };
};

const withFindingsEvents = (events) =>
  events
    .filter(
      (event) =>
        event.object_type === "ArchitectureConsistencyAssessment" &&
        event.target_state === "WithFindings",
    )
    .map((event) => ({
      rule_id: "ArchitectureConsistencyAssessment [WithFindings]",
      description: "ArchitectureConsistencyAssessment was observed as WithFindings.",
      action: "Return classified findings to P-SUP-06.",
      detail: "WithFindings is not Satisfied; no generated export is allowed.",
      case_id: event.case_id,
      session_id: event.session_id,
      object_type: event.object_type,
      object_id: event.object_id,
      event_id: event.event_id,
      status: "open",
      source_adapter: event.source_adapter,
      source_runtime_family: "parallel_production",
    }));

const hardGateFindings = (hardGateCandidates) =>
  hardGateCandidates
    .filter((candidate) => candidate?.object_type === "ExportCodePackage")
    .map((candidate) => ({
      rule_id: "MBA-WARN-CANDIDATE-EXPORT-NOT-PROMOTED",
      description: "candidate_export_package was observed but not promoted.",
      action: "Keep candidate export as candidate-only unless MBA export gates are satisfied.",
      detail: candidate.reason ?? "candidate_export_package is not ExportCodePackage [Generated].",
      case_id: candidate.case_id ?? null,
      session_id: candidate.session_id ?? null,
      object_type: "ExportCodePackage",
      object_id: candidate.object_id,
      event_id: null,
      status: "open",
      source_runtime_family: "parallel_production",
      prohibited_action_attempt: candidate.prohibited_action_attempt === true,
      export_gate_candidate_evidence: {
        source: "historical_export_gate_candidate",
        gate_id: candidate.gate_id ?? null,
        reason: candidate.reason ?? null,
        object_type: candidate.object_type,
        object_id: candidate.object_id,
        operation_blocking_allowed: false,
        readiness_mutation_allowed: false,
        core_state_mutation_allowed: false,
        export_promotion_allowed: false,
        enforcement_activation_allowed: false,
      },
    }));

export function normalizeGovernanceFindingsV03({
  report_id,
  case_id,
  session_id,
  findings = [],
  events = [],
  hard_gate_candidates = [],
  readiness_controls = {},
} = {}) {
  const generatedAt = readiness_controls.generated_at ?? new Date().toISOString();
  const eventsById = eventById(events);
  const candidateFindings = [
    ...asArray(findings),
    ...withFindingsEvents(events),
    ...hardGateFindings(hard_gate_candidates),
  ];

  const normalized = [];
  const unsupported = [];

  for (const finding of candidateFindings) {
    const code = findingCode(finding);
    const mapping = findingMappings[code];
    if (!mapping) {
      unsupported.push({
        finding_code: code,
        reason: "no_v03_mapping_for_1_7c",
        rule_id: finding.rule_id ?? null,
      });
      continue;
    }

    const event = finding.event_id ? eventsById.get(finding.event_id) : null;
    const resolvedCaseId = finding.case_id ?? event?.case_id ?? case_id ?? null;
    const resolvedSessionId = finding.session_id ?? event?.session_id ?? session_id ?? null;
    const runtimeFamily = sourceRuntimeFamily(finding, event);
    const artifactType = sourceArtifactType(finding, event);
    const artifact = sourceArtifactId({ finding, event, reportId: report_id });
    const scope = scopeFor({
      finding,
      event,
      caseId: resolvedCaseId,
      sessionId: resolvedSessionId,
      sourceArtifactTypeValue: artifactType,
      sourceArtifactIdValue: artifact.value,
    });
    const severity = severityFor(mapping, finding);
    const nonComputable = falsePositiveNonComputable(finding);
    const exportGateEvidence = exportGateCandidateEvidence(finding);
    const dedupeKey = makeDedupeKey({
      finding_code: code,
      case_id: resolvedCaseId,
      session_id: resolvedSessionId,
      source_artifact_type: artifactType,
      source_artifact_id: artifact.value,
      source_runtime_family: runtimeFamily,
      routing_primary: mapping.routing_primary,
    });
    const recurrenceKey = makeRecurrenceKey({
      finding_code: code,
      scope_type: scope.scope_type,
      scope_id: scope.scope_id,
      source_runtime_family: runtimeFamily,
    });

    normalized.push({
      finding_code: code,
      finding_source: finding.source_adapter ?? event?.source_adapter ?? "mba_control_plane",
      finding_category: mapping.finding_category,
      finding_categories: mapping.finding_categories,
      severity,
      routing_primary: mapping.routing_primary,
      routing_secondary: mapping.routing_secondary,
      vsm_primary_system: mapping.vsm_primary_system,
      vsm_secondary_systems: mapping.vsm_secondary_systems,
      case_id: resolvedCaseId,
      session_id: resolvedSessionId,
      source_artifact_type: artifactType,
      source_artifact_id: artifact.value,
      source_artifact_fallback_used: artifact.fallback_used,
      source_runtime_family: runtimeFamily,
      detected_at: finding.detected_at ?? event?.occurred_at ?? null,
      created_in_mode: "shadow_mode",
      recommended_action: mapping.recommended_action,
      prohibited_actions: mapping.prohibited_actions,
      review_status: defaultReviewStatus(Boolean(mapping.routing_primary)),
      review_owner: mapping.review_owner,
      review_due_policy: reviewDuePolicy(severity, mapping.review_due_policy),
      hard_gate_candidate: explicitV03HardGateCandidate(mapping, finding),
      export_gate_candidate_evidence: exportGateEvidence,
      algedonic_flag: mapping.algedonic_flag,
      variety_risk_level: mapping.variety_risk_level,
      recurrence_scope: scope.scope_type,
      recurrence_scope_id: scope.scope_id,
      recurrence_count: 1,
      dedupe_key: dedupeKey,
      recurrence_key: recurrenceKey,
      readiness_mutation_allowed: false,
      operation_blocking_allowed: false,
      core_state_mutation_allowed: false,
      export_promotion_allowed: false,
      human_review_required: mapping.human_review_required,
      false_positive: Boolean(finding.false_positive),
      false_positive_non_computable: nonComputable,
      review_task_candidate: {
        candidate: Boolean(mapping.review_task_candidate),
        conceptual_only: true,
        creates_operational_task: false,
        owner: mapping.review_owner,
        review_due_policy: reviewDuePolicy(severity, mapping.review_due_policy),
      },
      ledger_reference: finding.event_id ?? event?.event_id ?? report_id,
      raw_finding_summary: {
        rule_id: finding.rule_id ?? null,
        status: finding.status ?? "open",
        severity: finding.severity ?? null,
        detail: finding.detail ?? null,
      },
    });
  }

  const byDedupe = new Map();
  for (const finding of normalized) {
    const existing = byDedupe.get(finding.dedupe_key);
    if (!existing) {
      byDedupe.set(finding.dedupe_key, {
        ...finding,
        duplicate_count: 0,
        logical_occurrence_count: 1,
      });
      continue;
    }
    existing.duplicate_count += 1;
    existing.logical_occurrence_count += 1;
    if (!finding.false_positive_non_computable) {
      existing.recurrence_count += 1;
    }
    existing.human_review_required = existing.human_review_required || finding.human_review_required;
    existing.hard_gate_candidate = existing.hard_gate_candidate || finding.hard_gate_candidate;
    existing.export_gate_candidate_evidence =
      existing.export_gate_candidate_evidence ?? finding.export_gate_candidate_evidence;
    existing.false_positive_non_computable =
      existing.false_positive_non_computable && finding.false_positive_non_computable;
  }

  const logicalFindings = [...byDedupe.values()];
  const recurrenceCounts = new Map();
  for (const finding of normalized) {
    if (finding.false_positive_non_computable) continue;
    recurrenceCounts.set(finding.recurrence_key, (recurrenceCounts.get(finding.recurrence_key) ?? 0) + 1);
  }
  for (const finding of logicalFindings) {
    finding.recurrence_count = recurrenceCounts.get(finding.recurrence_key) ?? finding.recurrence_count;
  }

  const reviewable = logicalFindings.filter(
    (finding) => finding.human_review_required || finding.review_task_candidate.candidate,
  );
  const activationCandidateScope = buildActivationCandidateScope();
  const scopedDomains = buildScopedDomains({ logicalFindings, readinessControls: readiness_controls });
  const agingSummary = buildAgingSummary({ findings: logicalFindings, generatedAt });
  const routingSummary = buildRoutingSummary(logicalFindings);
  const falsePositiveSummary = buildFalsePositiveSummary({
    findings: logicalFindings,
    readinessControls: readiness_controls,
  });
  const rollbackSimulation = buildRollbackSimulation({
    logicalFindings,
    readinessControls: readiness_controls,
    activationCandidateScope,
  });
  const rollbackStatus = buildRollbackStatus({
    readinessControls: readiness_controls,
    rollbackSimulation,
  });
  const approvalGate18ATo18B = buildApprovalGate18ATo18B();
  const minimumEvidenceFor18B = buildMinimumEvidenceFor18B({
    logicalFindings,
    events,
    readinessControls: readiness_controls,
  });
  const summariesPresent = Boolean(agingSummary && routingSummary && recurrenceCounts);
  const readinessControlsSummary = buildReadinessControls({
    readinessControls: readiness_controls,
    summariesPresent,
    invariantsPreserved: true,
  });
  const noGoDashboard = buildNoGoDashboard({
    activationScope: activationCandidateScope,
    rollbackStatus,
    falsePositiveSummary,
    minimumEvidenceStatus: minimumEvidenceFor18B,
    routingSummary,
    readinessControls: readiness_controls,
    summariesPresent,
  });
  const activationCandidateBlockers = noGoDashboard.blockers.map((blocker) => blocker.no_go);
  const activationCandidateWarnings = [
    ...(agingSummary.missing_detected_at_count > 0 ? ["aging_missing_detected_at"] : []),
    ...(logicalFindings.length === 0 ? ["no_normalized_findings_in_report"] : []),
  ];
  const activationCandidateReady =
    activationCandidateScope.scope_limited_to_allowed_domains === true &&
    rollbackStatus.ready === true &&
    rollbackStatus.tested_end_to_end === true &&
    falsePositiveSummary.status === "measured" &&
    falsePositiveSummary.false_positive_medium_plus_rate_30d !== null &&
    falsePositiveSummary.false_positive_medium_plus_rate_30d <= falsePositiveSummary.maximum_rate &&
    readinessControlsSummary.rls_security_current === true &&
    minimumEvidenceFor18B.satisfied === true &&
    summariesPresent === true &&
    activationCandidateBlockers.length === 0;
  const softReadyChecks = {
    has_real_shadow_observation: logicalFindings.length > 0 || events.length > 0,
    has_v03_mapped_findings: logicalFindings.length > 0,
    has_dedupe_keys: logicalFindings.every((finding) => Boolean(finding.dedupe_key)),
    has_recurrence_keys: logicalFindings.every((finding) => Boolean(finding.recurrence_key)),
    invariants_preserved: true,
    has_routing: logicalFindings.every((finding) => Boolean(finding.routing_primary)),
    has_conceptual_owner_for_routed: logicalFindings.every((finding) =>
      finding.review_status === "Routed" ? Boolean(finding.review_owner) : true,
    ),
    has_reportability: logicalFindings.every(
      (finding) =>
        Boolean(finding.finding_code) &&
        Boolean(finding.severity) &&
        Boolean(finding.routing_primary) &&
        Boolean(finding.source_artifact_type) &&
        Boolean(finding.ledger_reference),
    ),
  };

  return {
    baseline: V03_BASELINE,
    plan_title: ACTIVATION_READINESS_PLAN_TITLE,
    dry_run: true,
    mode: "shadow_mode",
    mode_effective: "shadow_mode",
    generated_in_mode: "shadow_mode",
    active_candidate_definition: ACTIVE_CANDIDATE_DEFINITION,
    active_candidate_has_operational_effect: false,
    approval_gate_1_8A_to_1_8B: approvalGate18ATo18B,
    minimum_evidence_for_1_8B: minimumEvidenceFor18B.required,
    minimum_evidence_status: minimumEvidenceFor18B,
    activation: {
      soft_governance_mode_activated: false,
      enforcement_mode_activated: false,
    },
    invariants: invariantFlags,
    allowed_review_states: ALLOWED_REVIEW_STATES,
    normalized_findings: logicalFindings,
    unsupported_findings: unsupported,
    activation_candidate_scope: activationCandidateScope,
    scoped_domains: scopedDomains,
    excluded_domains: [...EXCLUDED_DOMAINS],
    readiness_controls: readinessControlsSummary,
    aging_summary: agingSummary,
    routing_summary: routingSummary,
    dedupe_summary: {
      source: "report_json_dry_run",
      duplicate_open_findings_collapsed: normalized.length - logicalFindings.length,
      dedupe_keys: logicalFindings.map((finding) => finding.dedupe_key),
      anti_noise_rule_applied: true,
      nc05_hidden_by_dedupe: false,
      prohibited_action_attempt_hidden_by_dedupe: false,
      false_positive_history_preserved: normalized.some((finding) => finding.false_positive_non_computable),
    },
    recurrence_summary: {
      source: "report_json_dry_run",
      recurrence_keys: [...recurrenceCounts.entries()].map(([recurrence_key, count]) => ({
        recurrence_key,
        count,
      })),
      recurrence_can_block_operation: false,
      false_positive_non_computable_count: normalized.filter((finding) => finding.false_positive_non_computable).length,
      recurrence_windows_reported_only: ["7d", "14d", "30d"],
      by_scope: countBy(logicalFindings, (finding) => finding.recurrence_scope),
      max_recurrence_count: logicalFindings.reduce(
        (max, finding) => Math.max(max, finding.recurrence_count ?? 0),
        0,
      ),
    },
    false_positive_summary: falsePositiveSummary,
    false_positive_medium_plus_rate_30d: falsePositiveSummary.false_positive_medium_plus_rate_30d,
    false_positive_threshold: {
      objective_rate: falsePositiveSummary.objective_rate,
      maximum_rate: falsePositiveSummary.maximum_rate,
      status: falsePositiveSummary.status,
      threshold_passed: falsePositiveSummary.threshold_passed,
    },
    rollback_status: rollbackStatus,
    rollback_simulation: rollbackSimulation,
    no_go_dashboard: noGoDashboard,
    activation_candidate_ready: activationCandidateReady,
    activation_candidate_blockers: activationCandidateBlockers,
    activation_candidate_warnings: activationCandidateWarnings,
    review_task_candidates: reviewable.map((finding) => ({
      finding_code: finding.finding_code,
      dedupe_key: finding.dedupe_key,
      review_owner: finding.review_owner,
      review_due_policy: finding.review_due_policy,
      conceptual_only: true,
      creates_operational_task: false,
    })),
    hard_gate_candidates: logicalFindings
      .filter((finding) => finding.hard_gate_candidate)
      .map((finding) => ({
        finding_code: finding.finding_code,
        dedupe_key: finding.dedupe_key,
        future_candidate_only: true,
        operation_blocking_allowed: false,
      })),
    export_gate_candidate_evidence: logicalFindings
      .filter((finding) => finding.export_gate_candidate_evidence)
      .map((finding) => ({
        finding_code: finding.finding_code,
        dedupe_key: finding.dedupe_key,
        evidence: finding.export_gate_candidate_evidence,
        hard_gate_candidate: finding.hard_gate_candidate,
        operation_blocking_allowed: false,
        readiness_mutation_allowed: false,
        core_state_mutation_allowed: false,
        export_promotion_allowed: false,
        enforcement_activation_allowed: false,
      })),
    soft_ready_evaluation: {
      soft_ready: Object.values(softReadyChecks).every(Boolean),
      activates_soft_governance_mode: false,
      checks: softReadyChecks,
    },
  };
}

export const GOVERNANCE_FINDING_V03_MAPPINGS = findingMappings;
