import type {
  RuntimeAffectedCriticalRoute,
  RuntimeBlockedByContradictionDecisionCandidate,
  RuntimeBlockedByContradictionDecisionSourceInput,
  RuntimeBlockedByMissingCanonicalRouteDecisionCandidate,
  RuntimeBlockedByMissingCanonicalRouteDecisionSourceInput,
  RuntimeBlockedByMissingEvidenceDecisionCandidate,
  RuntimeBlockedByMissingEvidenceDecisionSourceInput,
  RuntimeBudgetReadinessAggregationCandidate,
  RuntimeBudgetReadinessAggregationSourceInput,
  RuntimeCriticalRouteReadinessAggregationCandidate,
  RuntimeCriticalRouteReadinessAggregationSourceInput,
  RuntimeManualReviewReason,
  RuntimeManualReviewRequiredDecisionCandidate,
  RuntimeManualReviewRequiredDecisionSourceInput,
  RuntimePhase10InputRevalidationDecision,
  RuntimePhase10ReadinessFoundationLocalInput,
  RuntimePhase10ReadinessFoundationLocalResult,
  RuntimePhase11ExportPreviewBoundary,
  RuntimePhase11ExportPreviewBoundarySourceInput,
  RuntimePhase12QABoundary,
  RuntimePhase12QABoundarySourceInput,
  RuntimeReentryBlockingReason,
  RuntimeReentryExecutionBoundary,
  RuntimeReentryExecutionBoundarySourceInput,
  RuntimeReentryInteractionCandidate,
  RuntimeReentryInteractionSourceInput,
  RuntimeReentryLocalStatus,
  RuntimeReentryPlanCandidate,
  RuntimeReentryPlanSourceInput,
  RuntimeReentryRequiredCandidate,
  RuntimeReentryRequiredSourceInput,
  RuntimeReadinessContradictionType,
  RuntimeReadinessDecisionBlockingReason,
  RuntimeReadinessDecisionCandidateStatus,
  RuntimeReadinessFlagCandidate,
  RuntimeReadinessFlagSourceInput,
  RuntimeReadinessFlagType,
  RuntimeReadinessEngineEvaluationCandidate,
  RuntimeReadinessEngineEvaluationSourceInput,
  RuntimeReadinessFoundationBlockingReason,
  RuntimeReadinessFoundationStatus,
  RuntimeReadinessRuleSourceContract,
  RuntimeReadinessRuleSourceInput,
  RuntimeReadinessStateCandidate,
  RuntimeReadinessStateModelCandidate,
  RuntimeReadinessStateModelInput,
  RuntimeReadyDecisionCandidate,
  RuntimeReadyDecisionSourceInput,
  RuntimeReadyWithFlagsDecisionCandidate,
  RuntimeReadyWithFlagsDecisionSourceInput,
  RuntimeReadinessAggregationBlockingReason,
  RuntimeReadinessAggregationStatus,
  RuntimeReadinessAuditAction,
  RuntimeReadinessAuditCandidate,
  RuntimeReadinessAuditSourceInput,
  RuntimeReadinessBoundaryBlockingReason,
  RuntimeReadinessBoundaryStatus,
  RuntimeReadinessDecisionRecordCandidate,
  RuntimeReadinessDecisionRecordSourceInput,
  RuntimeReadinessGapAggregationCandidate,
  RuntimeReadinessGapAggregationSourceInput,
  RuntimeReadinessPersistenceBoundary,
  RuntimeReadinessPersistenceBoundarySourceInput,
  RuntimeSemanticPSTReadinessAggregationCandidate,
  RuntimeSemanticPSTReadinessAggregationSourceInput,
  RuntimeReadinessSupersessionRecomputeBoundary,
  RuntimeReadinessSupersessionRecomputeBoundarySourceInput,
} from "./runtime-40-20-readiness-reentry-types";

export const Runtime40_20ReadinessReentryService = {
  revalidatePhase9InputForPhase10,
  buildReadinessEngineEvaluationCandidates,
  buildReadinessRuleSourceContracts,
  buildReadinessStateModelCandidates,
  buildPhase10ReadinessFoundationLocalResult,
  buildReadyDecisionCandidates,
  buildReadyWithFlagsDecisionCandidates,
  buildBlockedByMissingEvidenceDecisionCandidates,
  buildBlockedByContradictionDecisionCandidates,
  buildBlockedByMissingCanonicalRouteDecisionCandidates,
  buildManualReviewRequiredDecisionCandidates,
  buildPhase10ReadinessDecisionCandidatesLocalResult,
  buildReentryRequiredCandidates,
  buildReentryPlanCandidates,
  buildReentryExecutionBoundaries,
  buildPhase10ReentryPlanningExecutionBoundaryLocalResult,
  buildReadinessGapAggregationCandidates,
  buildCriticalRouteReadinessAggregationCandidates,
  buildSemanticPSTReadinessAggregationCandidates,
  buildBudgetReadinessAggregationCandidates,
  buildReadinessDecisionRecordCandidates,
  buildPhase10ReadinessAggregationDecisionRecordLocalResult,
  buildReadinessAuditCandidates,
  buildPhase11ExportPreviewBoundaries,
  buildPhase12QABoundaries,
  buildReadinessSupersessionRecomputeBoundaries,
  buildReadinessPersistenceBoundaries,
  buildPhase10AuditExportQaSupersessionPersistenceBoundaryLocalResult,
};

const ALLOWED_READINESS_STATES: RuntimeReadinessStateCandidate[] = [
  "ready",
  "ready_with_flags",
  "blocked_by_missing_evidence",
  "blocked_by_contradiction",
  "blocked_by_missing_canonical_route",
  "manual_review_required",
  "reentry_required",
];

const ALLOWED_FLAG_TYPES: RuntimeReadinessFlagType[] = [
  "evidence_low_confidence",
  "semantic_warning",
  "carry_forward_non_blocking",
  "budget_exhausted_non_blocking",
  "manual_review_recommended",
  "export_condition_warning",
];

const ALLOWED_CONTRADICTION_TYPES: RuntimeReadinessContradictionType[] = [
  "PM_vs_PF",
  "MoC_vs_PF",
  "PF_vs_OLC",
  "OLC_vs_MoC",
  "evidence_vs_variable",
  "route_status_conflict",
  "semantic_resolution_conflict",
];

const ALLOWED_CRITICAL_ROUTES: RuntimeAffectedCriticalRoute[] = ["B0", "B2", "B3", "B7"];

const ALLOWED_MANUAL_REVIEW_REASONS: RuntimeManualReviewReason[] = [
  "semantic_ambiguity",
  "route_missing",
  "contradiction",
  "B7_boundary_risk",
  "evidence_insufficient",
  "override_request",
];

const ALLOWED_AUDIT_ACTIONS: RuntimeReadinessAuditAction[] = [
  "readiness_evaluation_started",
  "readiness_state_assigned",
  "ready_candidate_created",
  "ready_with_flags_candidate_created",
  "blocked_candidate_created",
  "manual_review_required_candidate_created",
  "reentry_required_candidate_created",
  "gap_aggregation_completed",
  "critical_route_readiness_evaluated",
  "semantic_pst_readiness_evaluated",
  "budget_readiness_evaluated",
  "export_preview_blocked",
];

export function buildPhase10ReadinessFoundationLocalResult(
  input: RuntimePhase10ReadinessFoundationLocalInput,
): RuntimePhase10ReadinessFoundationLocalResult {
  const revalidation = revalidatePhase9InputForPhase10(input);

  if (!revalidation.phase9_closed_local) {
    return createResult("blocked_phase9_not_closed", revalidation);
  }
  if (!revalidation.ready_for_phase10_authorization) {
    return createResult("blocked_phase10_not_authorized", revalidation);
  }

  const engineCandidates = buildReadinessEngineEvaluationCandidates(
    input.case_id,
    input.readiness_engine_evaluation_sources ?? [],
    input.run_id,
    input.activity_runtime_run_id,
  );
  const ruleContracts = buildReadinessRuleSourceContracts(
    input.case_id,
    input.readiness_rule_source_inputs ?? [],
  );
  const stateModels = buildReadinessStateModelCandidates(
    input.case_id,
    input.readiness_state_model_inputs ?? [],
  );

  return createResult(
    resolveFoundationStatus(input, engineCandidates, ruleContracts, stateModels),
    revalidation,
    engineCandidates,
    ruleContracts,
    stateModels,
  );
}

export function buildPhase10ReadinessDecisionCandidatesLocalResult(
  input: RuntimePhase10ReadinessFoundationLocalInput,
): RuntimePhase10ReadinessFoundationLocalResult {
  const base = buildPhase10ReadinessFoundationLocalResult(input);
  if (
    base.status === "blocked_phase9_not_closed" ||
    base.status === "blocked_phase10_not_authorized"
  ) {
    return base;
  }

  const readyCandidates = buildReadyDecisionCandidates(
    input.case_id,
    input.ready_decision_sources ?? [],
  );
  const readyWithFlagsCandidates = buildReadyWithFlagsDecisionCandidates(
    input.case_id,
    input.ready_with_flags_decision_sources ?? [],
  );
  const missingEvidenceCandidates = buildBlockedByMissingEvidenceDecisionCandidates(
    input.case_id,
    input.blocked_by_missing_evidence_sources ?? [],
  );
  const contradictionCandidates = buildBlockedByContradictionDecisionCandidates(
    input.case_id,
    input.blocked_by_contradiction_sources ?? [],
  );
  const missingRouteCandidates = buildBlockedByMissingCanonicalRouteDecisionCandidates(
    input.case_id,
    input.blocked_by_missing_canonical_route_sources ?? [],
  );
  const manualReviewCandidates = buildManualReviewRequiredDecisionCandidates(
    input.case_id,
    input.manual_review_required_sources ?? [],
  );

  return {
    ...base,
    status: resolveDecisionCandidateStatus(
      readyCandidates,
      readyWithFlagsCandidates,
      missingEvidenceCandidates,
      contradictionCandidates,
      missingRouteCandidates,
      manualReviewCandidates,
    ),
    ready_decision_candidates: readyCandidates,
    ready_with_flags_decision_candidates: readyWithFlagsCandidates,
    blocked_by_missing_evidence_candidates: missingEvidenceCandidates,
    blocked_by_contradiction_candidates: contradictionCandidates,
    blocked_by_missing_canonical_route_candidates: missingRouteCandidates,
    manual_review_required_candidates: manualReviewCandidates,
    readiness_decision_record_real_created: false,
    ready_final_created: false,
    ready_with_flags_final_created: false,
    blocked_final_created: false,
    manual_review_request_real_created: false,
    export_preview_created: false,
    parallel_export_payload_created: false,
    produccion_paralela_started: false,
    supabase_touched: false,
    sql_executed: false,
    endpoint_created: false,
    phase11_started: false,
    phase10_closed_local: false,
    ready_for_phase11_authorization: false,
  };
}

export function buildPhase10ReentryPlanningExecutionBoundaryLocalResult(
  input: RuntimePhase10ReadinessFoundationLocalInput,
): RuntimePhase10ReadinessFoundationLocalResult {
  const base = buildPhase10ReadinessDecisionCandidatesLocalResult(input);
  if (
    base.status === "blocked_phase9_not_closed" ||
    base.status === "blocked_phase10_not_authorized"
  ) {
    return base;
  }

  const reentryRequiredCandidates = buildReentryRequiredCandidates(
    input.case_id,
    input.reentry_required_sources ?? [],
  );
  const reentryPlanCandidates = buildReentryPlanCandidates(
    input.case_id,
    input.reentry_plan_sources ?? [],
  );
  const reentryExecutionBoundaries = buildReentryExecutionBoundaries(
    input.case_id,
    input.reentry_execution_boundary_sources ?? [],
  );

  return {
    ...base,
    status: resolveReentryStatus(
      reentryRequiredCandidates,
      reentryPlanCandidates,
      reentryExecutionBoundaries,
    ),
    reentry_required_candidates: reentryRequiredCandidates,
    reentry_plan_candidates: reentryPlanCandidates,
    reentry_execution_boundaries: reentryExecutionBoundaries,
    reentry_interactions_real_created: false,
    readiness_decision_record_real_created: false,
    ready_final_created: false,
    ready_with_flags_final_created: false,
    blocked_final_created: false,
    export_preview_created: false,
    parallel_export_payload_created: false,
    produccion_paralela_started: false,
    supabase_touched: false,
    sql_executed: false,
    endpoint_created: false,
    phase11_started: false,
    phase10_closed_local: false,
    ready_for_phase11_authorization: false,
  };
}

export function buildPhase10ReadinessAggregationDecisionRecordLocalResult(
  input: RuntimePhase10ReadinessFoundationLocalInput,
): RuntimePhase10ReadinessFoundationLocalResult {
  const base = buildPhase10ReentryPlanningExecutionBoundaryLocalResult(input);
  if (
    base.status === "blocked_phase9_not_closed" ||
    base.status === "blocked_phase10_not_authorized"
  ) {
    return base;
  }

  const gapAggregationCandidates = buildReadinessGapAggregationCandidates(
    input.case_id,
    input.readiness_gap_aggregation_sources ?? [],
  );
  const criticalRouteAggregationCandidates = buildCriticalRouteReadinessAggregationCandidates(
    input.case_id,
    input.critical_route_readiness_aggregation_sources ?? [],
  );
  const semanticPSTAggregationCandidates = buildSemanticPSTReadinessAggregationCandidates(
    input.case_id,
    input.semantic_pst_readiness_aggregation_sources ?? [],
  );
  const budgetAggregationCandidates = buildBudgetReadinessAggregationCandidates(
    input.case_id,
    input.budget_readiness_aggregation_sources ?? [],
  );
  const decisionRecordCandidates = buildReadinessDecisionRecordCandidates(
    input.case_id,
    input.readiness_decision_record_sources ?? [],
  );

  return {
    ...base,
    status: resolveAggregationStatus(
      gapAggregationCandidates,
      criticalRouteAggregationCandidates,
      semanticPSTAggregationCandidates,
      budgetAggregationCandidates,
      decisionRecordCandidates,
    ),
    readiness_gap_aggregation_candidates: gapAggregationCandidates,
    critical_route_readiness_aggregation_candidates: criticalRouteAggregationCandidates,
    semantic_pst_readiness_aggregation_candidates: semanticPSTAggregationCandidates,
    budget_readiness_aggregation_candidates: budgetAggregationCandidates,
    readiness_decision_record_candidates: decisionRecordCandidates,
    readiness_engine_real_executed: false,
    readiness_decision_record_real_created: false,
    ready_final_created: false,
    ready_with_flags_final_created: false,
    blocked_final_created: false,
    manual_review_request_real_created: false,
    reentry_interactions_real_created: false,
    budget_ledger_real_updated: false,
    export_preview_created: false,
    scr_preview_created: false,
    evidence_bundle_preview_created: false,
    mdsb_preview_created: false,
    parallel_export_payload_created: false,
    produccion_paralela_started: false,
    qa_green_declared: false,
    shadow_pilot_started: false,
    full_runtime_authorized: false,
    production_real_started: false,
    supabase_touched: false,
    sql_executed: false,
    endpoint_created: false,
    phase11_started: false,
    phase10_closed_local: false,
    ready_for_phase11_authorization: false,
  };
}

export function buildPhase10AuditExportQaSupersessionPersistenceBoundaryLocalResult(
  input: RuntimePhase10ReadinessFoundationLocalInput,
): RuntimePhase10ReadinessFoundationLocalResult {
  const base = buildPhase10ReadinessAggregationDecisionRecordLocalResult(input);
  if (
    base.status === "blocked_phase9_not_closed" ||
    base.status === "blocked_phase10_not_authorized"
  ) {
    return base;
  }

  const auditCandidates = buildReadinessAuditCandidates(
    input.case_id,
    input.readiness_audit_sources ?? [],
  );
  const phase11Boundaries = buildPhase11ExportPreviewBoundaries(
    input.case_id,
    input.phase11_export_preview_boundary_sources ?? [],
  );
  const phase12Boundaries = buildPhase12QABoundaries(
    input.case_id,
    input.phase12_qa_boundary_sources ?? [],
  );
  const supersessionBoundaries = buildReadinessSupersessionRecomputeBoundaries(
    input.case_id,
    input.readiness_supersession_recompute_boundary_sources ?? [],
  );
  const persistenceBoundaries = buildReadinessPersistenceBoundaries(
    input.case_id,
    input.readiness_persistence_boundary_sources ?? [],
  );

  return {
    ...base,
    status: resolveReadinessBoundaryStatus(
      auditCandidates,
      phase11Boundaries,
      phase12Boundaries,
      supersessionBoundaries,
      persistenceBoundaries,
    ),
    readiness_audit_candidates: auditCandidates,
    phase11_export_preview_boundaries: phase11Boundaries,
    phase12_qa_boundaries: phase12Boundaries,
    readiness_supersession_recompute_boundaries: supersessionBoundaries,
    readiness_persistence_boundaries: persistenceBoundaries,
    readiness_engine_real_executed: false,
    readiness_decision_record_real_created: false,
    ready_final_created: false,
    ready_with_flags_final_created: false,
    blocked_final_created: false,
    manual_review_request_real_created: false,
    reentry_interactions_real_created: false,
    export_preview_created: false,
    scr_preview_created: false,
    evidence_bundle_preview_created: false,
    mdsb_preview_created: false,
    parallel_export_payload_created: false,
    produccion_paralela_started: false,
    registry_created: false,
    qa_green_declared: false,
    shadow_pilot_started: false,
    full_runtime_authorized: false,
    production_real_started: false,
    runtime_40_20_started: false,
    supabase_touched: false,
    sql_executed: false,
    endpoint_created: false,
    phase11_started: false,
    phase12_started: false,
    phase10_closed_local: false,
    ready_for_phase11_authorization: false,
  };
}

export function revalidatePhase9InputForPhase10(
  input: RuntimePhase10ReadinessFoundationLocalInput,
): RuntimePhase10InputRevalidationDecision {
  const phase9Closed = input.phase9_closeout.phase9_closed_local === true;
  const phase10Authorized = input.phase9_closeout.ready_for_phase10_authorization === true;
  const phase9Candidates = input.phase9_candidates;

  return {
    phase9_closed_local: phase9Closed,
    ready_for_phase10_authorization: phase10Authorized,
    phase10_started_local: phase9Closed && phase10Authorized,
    phase10_closed_local: false,
    ready_for_phase11_authorization: false,
    critical_route_gate_result_candidates_available:
      (phase9Candidates.critical_route_gate_result_candidates?.length ?? 0) > 0,
    semantic_resolution_event_candidates_available:
      (phase9Candidates.semantic_resolution_event_candidates?.length ?? 0) > 0,
    process_state_timer_event_candidates_available:
      (phase9Candidates.process_state_timer_event_candidates?.length ?? 0) > 0,
    readiness_gap_record_candidates_available:
      (phase9Candidates.readiness_gap_record_candidates?.length ?? 0) > 0,
    runtime_audit_trail_gate_candidates_available:
      (phase9Candidates.runtime_audit_trail_gate_candidates?.length ?? 0) > 0,
    gate_outcome_readiness_boundary_available:
      (phase9Candidates.gate_outcome_readiness_boundaries?.length ?? 0) > 0,
    object_inventory_boundary_available:
      (phase9Candidates.object_inventory_boundaries?.length ?? 0) > 0,
    integration_membrane_control_plane_boundary_available:
      (phase9Candidates.integration_membrane_control_plane_boundaries?.length ?? 0) > 0,
    persistence_boundary_available: (phase9Candidates.persistence_boundaries?.length ?? 0) > 0,
    readiness_engine_previously_executed: false,
    readiness_decision_record_real_previously_created: false,
    ready_final_previously_created: false,
    ready_with_flags_final_previously_created: false,
    blocked_final_previously_created: false,
    export_preview_previously_created: false,
    critical_gates_recalculated: false,
    phase9_modified: false,
    phase11_started: false,
  };
}

export function buildReadinessEngineEvaluationCandidates(
  caseId: string,
  sources: RuntimeReadinessEngineEvaluationSourceInput[],
  defaultRunId = "",
  defaultActivityRuntimeRunId = "",
): RuntimeReadinessEngineEvaluationCandidate[] {
  return sources.map((source, index) => {
    const blockingReasons = getEngineBlockingReasons(source);
    return {
      readiness_engine_evaluation_candidate_ref:
        source.readiness_engine_evaluation_candidate_ref ??
        `${caseId}:readiness_engine_evaluation:${index + 1}`,
      run_id: source.run_id ?? defaultRunId,
      activity_runtime_run_id: source.activity_runtime_run_id ?? defaultActivityRuntimeRunId,
      source_gate_result_refs: source.source_gate_result_refs ?? [],
      source_readiness_gap_refs: source.source_readiness_gap_refs ?? [],
      source_semantic_event_refs: source.source_semantic_event_refs ?? [],
      source_pst_event_refs: source.source_pst_event_refs ?? [],
      source_canonical_variable_refs: source.source_canonical_variable_refs ?? [],
      source_branching_decision_refs: source.source_branching_decision_refs ?? [],
      source_budget_state_refs: source.source_budget_state_refs ?? [],
      source_trace: source.source_trace ?? {},
      readiness_state_candidate: toReadinessState(source.readiness_state_candidate),
      readiness_reason: source.readiness_reason ?? "",
      manual_review_required: source.manual_review_required === true,
      reentry_required: source.reentry_required === true,
      blocking_gap_refs: source.blocking_gap_refs ?? [],
      carry_forward_gap_refs: source.carry_forward_gap_refs ?? [],
      readiness_flags: source.readiness_flags ?? [],
      readiness_decision_record_real_created: false,
      export_preview_created: false,
      produccion_paralela_started: false,
      readiness_engine_real_executed: false,
      candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildReadinessRuleSourceContracts(
  caseId: string,
  sources: RuntimeReadinessRuleSourceInput[],
): RuntimeReadinessRuleSourceContract[] {
  return sources.map((source, index) => {
    const blockingReasons = getRuleBlockingReasons(source);
    return {
      runtime_readiness_rule_ref:
        source.runtime_readiness_rule_ref ?? `${caseId}:runtime_readiness_rule:${index + 1}`,
      readiness_gaps_reentry_source_ref: source.readiness_gaps_reentry_source_ref ?? "",
      rule_id: source.rule_id ?? "",
      readiness_state: toReadinessState(source.readiness_state),
      required_gate_status: source.required_gate_status,
      required_route_status: source.required_route_status,
      allowed_gap_type: source.allowed_gap_type,
      blocking_gap_type: source.blocking_gap_type,
      manual_review_condition: source.manual_review_condition,
      reentry_condition: source.reentry_condition,
      reentry_target: source.reentry_target,
      waiver_or_override_policy: source.waiver_or_override_policy,
      source_node_ref: source.source_node_ref,
      source_trace: source.source_trace ?? {},
      readiness_from_free_narrative: false,
      readiness_from_causal_score_only: false,
      readiness_from_b7_c20_preclassification_only: false,
      explicit_rule_required: true,
      rule_candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildReadinessStateModelCandidates(
  caseId: string,
  sources: RuntimeReadinessStateModelInput[],
): RuntimeReadinessStateModelCandidate[] {
  return sources.map((source, index) => {
    const allowedStates = source.allowed_states ?? ALLOWED_READINESS_STATES;
    const inventedState = allowedStates.some((state) => !isReadinessState(state));
    const blockingReasons: RuntimeReadinessFoundationBlockingReason[] = [];
    if (!hasSourceTrace(source.readiness_state_source_trace)) {
      blockingReasons.push("missing_source_trace");
    }
    if (inventedState) blockingReasons.push("invented_readiness_state");

    return {
      readiness_state_model_candidate_ref:
        source.readiness_state_model_candidate_ref ??
        `${caseId}:readiness_state_model:${index + 1}`,
      allowed_states: allowedStates.filter(isReadinessState),
      readiness_state_source_trace: source.readiness_state_source_trace ?? {},
      readiness_state_reason: source.readiness_state_reason,
      readiness_state_candidate_allowed: blockingReasons.length === 0,
      invented_state_detected: false,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildReadyDecisionCandidates(
  caseId: string,
  sources: RuntimeReadyDecisionSourceInput[],
): RuntimeReadyDecisionCandidate[] {
  return sources.map((source, index) => {
    const blockingReasons = getReadyDecisionBlockingReasons(source);
    return {
      ready_decision_candidate_ref:
        source.ready_decision_candidate_ref ?? `${caseId}:ready_decision:${index + 1}`,
      readiness_state: "ready",
      all_critical_routes_closed: source.all_critical_routes_closed === true,
      no_blocking_gap: source.no_blocking_gap === true,
      no_semantic_projection_block: source.no_semantic_projection_block === true,
      no_pst_deadlock_gap: source.no_pst_deadlock_gap === true,
      evidence_sufficient: source.evidence_sufficient === true,
      canonical_routes_closed: source.canonical_routes_closed === true,
      b0_closed: source.b0_closed === true,
      b2_closed: source.b2_closed === true,
      b3_closed: source.b3_closed === true,
      b7_non_diagnostic_boundary_respected:
        source.b7_non_diagnostic_boundary_respected === true,
      manual_review_required: false,
      reentry_required: false,
      source_trace: source.source_trace ?? {},
      readiness_decision_record_candidate_created: true,
      readiness_decision_record_real_created: false,
      ready_final_created: false,
      export_preview_created: false,
      candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildReadyWithFlagsDecisionCandidates(
  caseId: string,
  sources: RuntimeReadyWithFlagsDecisionSourceInput[],
): RuntimeReadyWithFlagsDecisionCandidate[] {
  return sources.map((source, index) => {
    const flags = buildReadinessFlagCandidates(
      `${caseId}:ready_with_flags:${index + 1}`,
      source.flags ?? [],
    );
    const blockingReasons = [
      ...getReadyWithFlagsBlockingReasons(source),
      ...getFlagBlockingReasons(source.flags ?? []),
    ];
    return {
      ready_with_flags_decision_candidate_ref:
        source.ready_with_flags_decision_candidate_ref ??
        `${caseId}:ready_with_flags_decision:${index + 1}`,
      readiness_state: "ready_with_flags",
      critical_routes_sufficient: source.critical_routes_sufficient === true,
      non_blocking_gaps_exist: source.non_blocking_gaps_exist === true,
      flags,
      no_open_blocking_gap: source.no_open_blocking_gap === true,
      no_critical_route_missing: source.no_critical_route_missing === true,
      no_b7_diagnosis: source.no_b7_diagnosis === true,
      blocking_gap_hidden_as_flag: false,
      source_trace: source.source_trace ?? {},
      readiness_decision_record_candidate_created: true,
      readiness_decision_record_real_created: false,
      ready_with_flags_final_created: false,
      export_preview_created: false,
      candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: [...new Set(blockingReasons)],
    };
  });
}

export function buildBlockedByMissingEvidenceDecisionCandidates(
  caseId: string,
  sources: RuntimeBlockedByMissingEvidenceDecisionSourceInput[],
): RuntimeBlockedByMissingEvidenceDecisionCandidate[] {
  return sources.map((source, index) => {
    const blockingReasons = getMissingEvidenceBlockingReasons(source);
    return {
      blocked_missing_evidence_candidate_ref:
        source.blocked_missing_evidence_candidate_ref ??
        `${caseId}:blocked_missing_evidence:${index + 1}`,
      readiness_state: "blocked_by_missing_evidence",
      missing_evidence_gap_refs: source.missing_evidence_gap_refs ?? [],
      affected_route: source.affected_route,
      affected_gate: source.affected_gate,
      affected_quadrant: source.affected_quadrant,
      evidence_required: source.evidence_required,
      evidence_missing_reason: source.evidence_missing_reason ?? "",
      source_trace: source.source_trace ?? {},
      reentry_target: source.reentry_target,
      manual_review_required: source.manual_review_required === true,
      readiness_decision_record_candidate_created: true,
      readiness_decision_record_real_created: false,
      ready_final_created: false,
      ready_with_flags_final_created: false,
      export_preview_created: false,
      candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildBlockedByContradictionDecisionCandidates(
  caseId: string,
  sources: RuntimeBlockedByContradictionDecisionSourceInput[],
): RuntimeBlockedByContradictionDecisionCandidate[] {
  return sources.map((source, index) => {
    const blockingReasons = getContradictionBlockingReasons(source);
    return {
      blocked_contradiction_candidate_ref:
        source.blocked_contradiction_candidate_ref ?? `${caseId}:blocked_contradiction:${index + 1}`,
      readiness_state: "blocked_by_contradiction",
      contradiction_gap_refs: source.contradiction_gap_refs ?? [],
      contradiction_type: toContradictionType(source.contradiction_type),
      source_gate_refs: source.source_gate_refs ?? [],
      source_trace: source.source_trace ?? {},
      reentry_target: source.reentry_target,
      manual_review_required: source.manual_review_required === true,
      contradiction_resolved_by_inference: false,
      readiness_decision_record_candidate_created: true,
      readiness_decision_record_real_created: false,
      ready_final_created: false,
      export_preview_created: false,
      candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildBlockedByMissingCanonicalRouteDecisionCandidates(
  caseId: string,
  sources: RuntimeBlockedByMissingCanonicalRouteDecisionSourceInput[],
): RuntimeBlockedByMissingCanonicalRouteDecisionCandidate[] {
  return sources.map((source, index) => {
    const blockingReasons = getMissingRouteBlockingReasons(source);
    return {
      blocked_missing_canonical_route_candidate_ref:
        source.blocked_missing_canonical_route_candidate_ref ??
        `${caseId}:blocked_missing_canonical_route:${index + 1}`,
      readiness_state: "blocked_by_missing_canonical_route",
      missing_route_gap_refs: source.missing_route_gap_refs ?? [],
      affected_route: source.affected_route,
      affected_critical_route: toAffectedCriticalRoute(source.affected_critical_route),
      canonical_route_required: source.canonical_route_required,
      route_missing_reason: source.route_missing_reason ?? "",
      source_trace: source.source_trace ?? {},
      reentry_target: source.reentry_target,
      manual_review_required: source.manual_review_required === true,
      route_closed_from_free_text: false,
      c09_closed_from_satisfaction_general: false,
      readiness_decision_record_candidate_created: true,
      readiness_decision_record_real_created: false,
      ready_final_created: false,
      export_preview_created: false,
      candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildManualReviewRequiredDecisionCandidates(
  caseId: string,
  sources: RuntimeManualReviewRequiredDecisionSourceInput[],
): RuntimeManualReviewRequiredDecisionCandidate[] {
  return sources.map((source, index) => {
    const blockingReasons = getManualReviewBlockingReasons(source);
    return {
      manual_review_required_candidate_ref:
        source.manual_review_required_candidate_ref ?? `${caseId}:manual_review_required:${index + 1}`,
      readiness_state: "manual_review_required",
      manual_review_reason: toManualReviewReason(source.manual_review_reason),
      affected_gate: source.affected_gate,
      affected_route: source.affected_route,
      affected_object_hint: source.affected_object_hint,
      reviewer_role_hint: source.reviewer_role_hint,
      review_question_candidate: source.review_question_candidate,
      source_trace: source.source_trace ?? {},
      manual_review_request_candidate_created: true,
      manual_review_request_real_created: false,
      waiver_automatic_created: false,
      override_automatic_created: false,
      ready_final_created: false,
      export_preview_created: false,
      candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildReentryRequiredCandidates(
  caseId: string,
  sources: RuntimeReentryRequiredSourceInput[],
): RuntimeReentryRequiredCandidate[] {
  return sources.map((source, index) => {
    const blockingReasons = getReentryRequiredBlockingReasons(source);
    return {
      reentry_required_candidate_ref:
        source.reentry_required_candidate_ref ?? `${caseId}:reentry_required:${index + 1}`,
      readiness_state: "reentry_required",
      source_gap_ref: source.source_gap_ref ?? "",
      source_gate_ref: source.source_gate_ref,
      source_readiness_gap_ref: source.source_readiness_gap_ref,
      reentry_target_block: source.reentry_target_block ?? "",
      reentry_target_interaction_id: source.reentry_target_interaction_id,
      reentry_reason: source.reentry_reason ?? "",
      justification_required: true,
      source_trace: source.source_trace ?? {},
      reentry_budget_impact: source.reentry_budget_impact,
      reentry_counts_as_visible: source.reentry_counts_as_visible === true,
      reentry_counts_as_causal: source.reentry_counts_as_causal === true,
      reentry_by_curiosity: false,
      blocking_gap_present: source.blocking_gap_present === true,
      reentry_real_opened: false,
      readiness_final_created: false,
      candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildReentryPlanCandidates(
  caseId: string,
  sources: RuntimeReentryPlanSourceInput[],
): RuntimeReentryPlanCandidate[] {
  return sources.map((source, index) => {
    const interactions = buildReentryInteractionCandidates(
      `${caseId}:reentry_plan:${index + 1}`,
      source.reentry_interactions_candidate ?? [],
    );
    const blockingReasons = [
      ...getReentryPlanBlockingReasons(source),
      ...interactions.flatMap((interaction) =>
        hasSourceTrace(interaction.source_trace) ? [] : ["missing_source_trace" as RuntimeReentryBlockingReason],
      ),
    ];
    return {
      reentry_plan_candidate_ref:
        source.reentry_plan_candidate_ref ?? `${caseId}:reentry_plan:${index + 1}`,
      target_block: source.target_block ?? "",
      target_interaction_id: source.target_interaction_id,
      target_gate: source.target_gate,
      target_route: source.target_route,
      target_variable: source.target_variable,
      source_gap_type: source.source_gap_type,
      source_gap_reason: source.source_gap_reason ?? "",
      proposed_user_visible_prompt_ref: source.proposed_user_visible_prompt_ref,
      expected_resolution: source.expected_resolution,
      reentry_budget_bucket: source.reentry_budget_bucket,
      reentry_budget_cost: source.reentry_budget_cost,
      reentry_authorization_required: true,
      reentry_interactions_candidate: interactions,
      runtime_interaction_instance_real_created: false,
      ui_render_real_created: false,
      endpoint_created: false,
      supabase_touched: false,
      source_trace: source.source_trace ?? {},
      candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: [...new Set(blockingReasons)],
    };
  });
}

export function buildReentryExecutionBoundaries(
  caseId: string,
  sources: RuntimeReentryExecutionBoundarySourceInput[],
): RuntimeReentryExecutionBoundary[] {
  return sources.map((source, index) => {
    const blockingReasons = getReentryExecutionBoundaryBlockingReasons(source);
    return {
      reentry_execution_boundary_ref:
        source.reentry_execution_boundary_ref ?? `${caseId}:reentry_execution_boundary:${index + 1}`,
      future_interactions_prepared: source.future_interactions_prepared === true,
      future_phase5_payload_candidate_prepared:
        source.future_phase5_payload_candidate_prepared === true,
      future_phase6_payload_candidate_prepared:
        source.future_phase6_payload_candidate_prepared === true,
      budget_candidate_prepared: source.budget_candidate_prepared === true,
      reentry_real_requires_explicit_authorization: true,
      runtime_interaction_instance_real_created: false,
      shown_at_real_created: false,
      answered_at_real_created: false,
      response_ingest_executed: false,
      evidence_item_real_created: false,
      canonical_variable_record_real_created: false,
      branching_real_executed: false,
      gates_reexecuted: false,
      readiness_final_after_reentry_candidate_created: false,
      source_trace: source.source_trace ?? {},
      boundary_passed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildReadinessGapAggregationCandidates(
  caseId: string,
  sources: RuntimeReadinessGapAggregationSourceInput[],
): RuntimeReadinessGapAggregationCandidate[] {
  return sources.map((source, index) => {
    const blockingReasons = getGapAggregationBlockingReasons(source);
    return {
      aggregate_gap_candidate_ref:
        source.aggregate_gap_candidate_ref ?? `${caseId}:readiness_gap_aggregation:${index + 1}`,
      missing_evidence_gap_refs: source.missing_evidence_gap_refs ?? [],
      contradiction_gap_refs: source.contradiction_gap_refs ?? [],
      missing_canonical_route_gap_refs: source.missing_canonical_route_gap_refs ?? [],
      semantic_ambiguity_gap_refs: source.semantic_ambiguity_gap_refs ?? [],
      process_state_without_timer_gap_refs: source.process_state_without_timer_gap_refs ?? [],
      budget_exhausted_gap_refs: source.budget_exhausted_gap_refs ?? [],
      manual_review_gap_refs: source.manual_review_gap_refs ?? [],
      carry_forward_gap_refs: source.carry_forward_gap_refs ?? [],
      duplicate_gaps_merged_by_source_trace:
        source.duplicate_gaps_merged_by_source_trace === true,
      gap_severity_rollup: source.gap_severity_rollup,
      blocking_gap_refs: source.blocking_gap_refs ?? [],
      non_blocking_gap_refs: source.non_blocking_gap_refs ?? [],
      source_trace: source.source_trace ?? {},
      blocking_gap_hidden: false,
      invented_gap_created: false,
      candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildCriticalRouteReadinessAggregationCandidates(
  caseId: string,
  sources: RuntimeCriticalRouteReadinessAggregationSourceInput[],
): RuntimeCriticalRouteReadinessAggregationCandidate[] {
  return sources.map((source, index) => {
    const blockingReasons = getCriticalRouteAggregationBlockingReasons(source);
    return {
      critical_route_readiness_candidate_ref:
        source.critical_route_readiness_candidate_ref ??
        `${caseId}:critical_route_readiness_aggregation:${index + 1}`,
      b0_status: source.b0_status,
      b2_status: source.b2_status,
      b3_status: source.b3_status,
      b7_status: source.b7_status,
      route_closed: source.route_closed === true,
      route_missing: source.route_missing === true,
      route_blocked: source.route_blocked === true,
      route_manual_review_required: source.route_manual_review_required === true,
      route_reentry_required: source.route_reentry_required === true,
      route_source_trace: source.route_source_trace ?? {},
      ready_allowed:
        source.ready_allowed === true &&
        source.route_blocked !== true &&
        source.route_missing !== true,
      ready_with_flags_allowed:
        source.ready_with_flags_allowed === true && source.route_missing !== true,
      route_status_closed_from_satisfaction_or_free_text: false,
      candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildSemanticPSTReadinessAggregationCandidates(
  caseId: string,
  sources: RuntimeSemanticPSTReadinessAggregationSourceInput[],
): RuntimeSemanticPSTReadinessAggregationCandidate[] {
  return sources.map((source, index) => {
    const blockingReasons = getSemanticPSTAggregationBlockingReasons(source);
    return {
      semantic_pst_readiness_candidate_ref:
        source.semantic_pst_readiness_candidate_ref ??
        `${caseId}:semantic_pst_readiness_aggregation:${index + 1}`,
      sem_blockers_open_refs: source.sem_blockers_open_refs ?? [],
      sem_blockers_resolved_candidate_refs: source.sem_blockers_resolved_candidate_refs ?? [],
      pst_blockers_open_refs: source.pst_blockers_open_refs ?? [],
      pst_blockers_resolved_candidate_refs: source.pst_blockers_resolved_candidate_refs ?? [],
      process_state_without_timer_gap_refs: source.process_state_without_timer_gap_refs ?? [],
      semantic_ambiguity_gap_refs: source.semantic_ambiguity_gap_refs ?? [],
      deadlock_risk: source.deadlock_risk === true,
      source_trace: source.source_trace ?? {},
      ready_allowed:
        source.ready_allowed === true &&
        (source.sem_blockers_open_refs?.length ?? 0) === 0 &&
        (source.pst_blockers_open_refs?.length ?? 0) === 0 &&
        source.deadlock_risk !== true,
      semantic_temporal_resolution_inferred: false,
      candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildBudgetReadinessAggregationCandidates(
  caseId: string,
  sources: RuntimeBudgetReadinessAggregationSourceInput[],
): RuntimeBudgetReadinessAggregationCandidate[] {
  return sources.map((source, index) => {
    const blockingReasons = getBudgetAggregationBlockingReasons(source);
    return {
      budget_readiness_candidate_ref:
        source.budget_readiness_candidate_ref ?? `${caseId}:budget_readiness_aggregation:${index + 1}`,
      base_budget_state: source.base_budget_state,
      causal_budget_state: source.causal_budget_state,
      reentry_budget_state: source.reentry_budget_state,
      budget_exhausted_gap_refs: source.budget_exhausted_gap_refs ?? [],
      budget_exhausted_non_blocking: source.budget_exhausted_non_blocking === true,
      budget_exhausted_blocking: source.budget_exhausted_blocking === true,
      carry_forward_gap_refs: source.carry_forward_gap_refs ?? [],
      source_trace: source.source_trace ?? {},
      more_causals_opened: false,
      budget_override_automatic_created: false,
      export_allowed_when_budget_hides_blocking_gap: false,
      candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildReadinessDecisionRecordCandidates(
  caseId: string,
  sources: RuntimeReadinessDecisionRecordSourceInput[],
): RuntimeReadinessDecisionRecordCandidate[] {
  return sources.map((source, index) => {
    const blockingReasons = getDecisionRecordCandidateBlockingReasons(source);
    return {
      readiness_decision_candidate_ref:
        source.readiness_decision_candidate_ref ??
        `${caseId}:readiness_decision_record_candidate:${index + 1}`,
      readiness_decision_record_real_created: false,
      run_id: source.run_id,
      readiness_state: toReadinessState(source.readiness_state),
      readiness_reason: source.readiness_reason ?? "",
      blocking_gap_refs: source.blocking_gap_refs ?? [],
      non_blocking_gap_refs: source.non_blocking_gap_refs ?? [],
      manual_review_refs: source.manual_review_refs ?? [],
      reentry_refs: source.reentry_refs ?? [],
      gate_result_refs: source.gate_result_refs ?? [],
      semantic_event_refs: source.semantic_event_refs ?? [],
      pst_event_refs: source.pst_event_refs ?? [],
      carry_forward_gap_refs: source.carry_forward_gap_refs ?? [],
      source_trace: source.source_trace ?? {},
      decision_timestamp_preview: source.decision_timestamp_preview,
      audit_candidate_ref: source.audit_candidate_ref,
      db_write_created: false,
      export_preview_created: false,
      candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildReadinessAuditCandidates(
  caseId: string,
  sources: RuntimeReadinessAuditSourceInput[],
): RuntimeReadinessAuditCandidate[] {
  return sources.map((source, index) => {
    const blockingReasons = getReadinessAuditBlockingReasons(source);
    return {
      readiness_audit_candidate_ref:
        source.readiness_audit_candidate_ref ?? `${caseId}:readiness_audit:${index + 1}`,
      audit_action: toAuditAction(source.audit_action),
      audit_reason: source.audit_reason ?? "",
      source_readiness_candidate_ref: source.source_readiness_candidate_ref,
      source_readiness_decision_candidate_ref: source.source_readiness_decision_candidate_ref,
      source_gap_aggregation_ref: source.source_gap_aggregation_ref,
      source_trace: source.source_trace ?? {},
      readiness_decision_record_real_created: false,
      runtime_audit_trail_real_created: false,
      candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildPhase11ExportPreviewBoundaries(
  caseId: string,
  sources: RuntimePhase11ExportPreviewBoundarySourceInput[],
): RuntimePhase11ExportPreviewBoundary[] {
  return sources.map((source, index) => {
    const sourceState = isReadinessState(source.source_readiness_state)
      ? source.source_readiness_state
      : undefined;
    const blockingReasons = getPhase11BoundaryBlockingReasons(source);
    return {
      phase11_export_boundary_ref:
        source.phase11_export_boundary_ref ?? `${caseId}:phase11_export_boundary:${index + 1}`,
      source_readiness_state: sourceState,
      source_readiness_decision_candidate_ref: source.source_readiness_decision_candidate_ref,
      ready_can_prepare_future_export_preview: sourceState === "ready",
      ready_with_flags_can_prepare_future_export_preview_with_visible_flags:
        sourceState === "ready_with_flags",
      blocked_export_preview_authorized: false,
      manual_review_export_preview_authorized: false,
      reentry_export_preview_authorized: false,
      export_preview_created: false,
      scr_preview_created: false,
      evidence_bundle_preview_created: false,
      mdsb_preview_created: false,
      parallel_export_payload_created: false,
      produccion_paralela_started: false,
      registry_created: false,
      ready_for_phase11_authorization: false,
      phase11_started: false,
      source_trace: source.source_trace ?? {},
      boundary_passed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildPhase12QABoundaries(
  caseId: string,
  sources: RuntimePhase12QABoundarySourceInput[],
): RuntimePhase12QABoundary[] {
  return sources.map((source, index) => {
    const blockingReasons = getPhase12QABoundaryBlockingReasons(source);
    return {
      phase12_qa_boundary_ref:
        source.phase12_qa_boundary_ref ?? `${caseId}:phase12_qa_boundary:${index + 1}`,
      readiness_output_can_feed_future_qa: source.readiness_output_can_feed_future_qa === true,
      gaps_can_feed_future_qa: source.gaps_can_feed_future_qa === true,
      reentry_decisions_can_feed_future_qa: source.reentry_decisions_can_feed_future_qa === true,
      manual_review_required_can_feed_future_qa:
        source.manual_review_required_can_feed_future_qa === true,
      qa_green_declared: false,
      shadow_pilot_started: false,
      full_runtime_authorized: false,
      production_real_started: false,
      phase12_definition_of_done_modified: false,
      phase12_started: false,
      source_trace: source.source_trace ?? {},
      boundary_passed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildReadinessSupersessionRecomputeBoundaries(
  caseId: string,
  sources: RuntimeReadinessSupersessionRecomputeBoundarySourceInput[],
): RuntimeReadinessSupersessionRecomputeBoundary[] {
  return sources.map((source, index) => {
    const blockingReasons = getSupersessionRecomputeBlockingReasons(source);
    return {
      readiness_supersession_boundary_ref:
        source.readiness_supersession_boundary_ref ??
        `${caseId}:readiness_supersession_recompute_boundary:${index + 1}`,
      response_revision_impact_can_mark_stale_candidate:
        source.response_revision_impact_can_mark_stale_candidate === true,
      gate_result_revision_impact_can_mark_stale_candidate:
        source.gate_result_revision_impact_can_mark_stale_candidate === true,
      branching_revision_impact_can_mark_stale_candidate:
        source.branching_revision_impact_can_mark_stale_candidate === true,
      prior_readiness_candidate_ref: source.prior_readiness_candidate_ref,
      supersedes_readiness_candidate_ref: source.supersedes_readiness_candidate_ref,
      stale_reason: source.stale_reason,
      recompute_required_candidate: source.recompute_required_candidate === true,
      global_recompute_automatic_executed: false,
      prior_readiness_deleted_without_trace: false,
      export_payload_superseded_real: false,
      export_payload_supersession_boundary_candidate_created:
        source.export_payload_supersession_boundary_candidate_created === true,
      persistence_real_created: false,
      source_trace: source.source_trace ?? {},
      boundary_passed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildReadinessPersistenceBoundaries(
  caseId: string,
  sources: RuntimeReadinessPersistenceBoundarySourceInput[],
): RuntimeReadinessPersistenceBoundary[] {
  return sources.map((source, index) => {
    const blockingReasons = getPersistenceBoundaryBlockingReasons(source);
    return {
      readiness_persistence_boundary_ref:
        source.readiness_persistence_boundary_ref ??
        `${caseId}:readiness_persistence_boundary:${index + 1}`,
      local_readiness_decision_candidate_mode: true,
      local_readiness_gap_aggregation_candidate_mode: true,
      local_reentry_plan_candidate_mode: true,
      local_manual_review_candidate_mode: true,
      local_readiness_audit_candidate_mode: true,
      db_write_authorized: false,
      readiness_decision_record_real_created: false,
      manual_review_request_real_created: false,
      reentry_interactions_real_created: false,
      supabase_touch_authorized: false,
      sql_execution_authorized: false,
      endpoint_creation_authorized: false,
      service_role_used: false,
      service_role_used_in_client: false,
      scene_write_detected: false,
      mba_write_detected: false,
      parallel_production_runtime_artifacts_write_detected: false,
      export_preview_created: false,
      runtime_40_20_started: false,
      source_trace: source.source_trace ?? {},
      persistence_boundary_passed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

function resolveReadinessBoundaryStatus(
  auditCandidates: RuntimeReadinessAuditCandidate[],
  phase11Boundaries: RuntimePhase11ExportPreviewBoundary[],
  phase12Boundaries: RuntimePhase12QABoundary[],
  supersessionBoundaries: RuntimeReadinessSupersessionRecomputeBoundary[],
  persistenceBoundaries: RuntimeReadinessPersistenceBoundary[],
): RuntimeReadinessBoundaryStatus {
  const allReasons = [
    ...auditCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...phase11Boundaries.flatMap((boundary) => boundary.blocking_reasons),
    ...phase12Boundaries.flatMap((boundary) => boundary.blocking_reasons),
    ...supersessionBoundaries.flatMap((boundary) => boundary.blocking_reasons),
    ...persistenceBoundaries.flatMap((boundary) => boundary.blocking_reasons),
  ];

  if (hasAnyBoundaryReason(allReasons, EXPORT_PREVIEW_BLOCKING_REASONS)) {
    return "blocked_export_preview_attempt";
  }
  if (hasAnyBoundaryReason(allReasons, QA_REAL_BLOCKING_REASONS)) {
    return "blocked_qa_real_start_attempt";
  }
  if (hasAnyBoundaryReason(allReasons, GLOBAL_RECOMPUTE_BLOCKING_REASONS)) {
    return "blocked_global_recompute_attempt";
  }
  if (hasAnyBoundaryReason(allReasons, PERSISTENCE_BLOCKING_REASONS)) {
    return "blocked_readiness_persistence_attempt";
  }
  if (allReasons.includes("missing_source_trace")) return "blocked_missing_source_trace";
  if (persistenceBoundaries.length > 0) return "readiness_persistence_boundary_created";
  if (supersessionBoundaries.length > 0) {
    return "readiness_supersession_recompute_boundary_created";
  }
  if (phase12Boundaries.length > 0) return "phase12_qa_boundary_created";
  if (phase11Boundaries.length > 0) return "phase11_export_preview_boundary_created";
  return "readiness_audit_candidate_created";
}

const EXPORT_PREVIEW_BLOCKING_REASONS: RuntimeReadinessBoundaryBlockingReason[] = [
  "blocked_export_preview_authorization_attempted",
  "manual_review_export_preview_authorization_attempted",
  "reentry_export_preview_authorization_attempted",
  "export_preview_creation_attempted",
  "scr_preview_creation_attempted",
  "evidence_bundle_preview_creation_attempted",
  "mdsb_preview_creation_attempted",
  "parallel_export_payload_creation_attempted",
  "produccion_paralela_start_attempted",
  "registry_creation_attempted",
  "phase11_started_attempted",
];

const QA_REAL_BLOCKING_REASONS: RuntimeReadinessBoundaryBlockingReason[] = [
  "qa_green_declaration_attempted",
  "shadow_pilot_start_attempted",
  "full_runtime_authorization_attempted",
  "production_real_start_attempted",
  "phase12_definition_of_done_modification_attempted",
  "phase12_started_attempted",
];

const GLOBAL_RECOMPUTE_BLOCKING_REASONS: RuntimeReadinessBoundaryBlockingReason[] = [
  "global_recompute_automatic_execution_attempted",
  "prior_readiness_deleted_without_trace_attempted",
  "export_payload_superseded_real_attempted",
];

const PERSISTENCE_BLOCKING_REASONS: RuntimeReadinessBoundaryBlockingReason[] = [
  "runtime_audit_trail_real_creation_attempted",
  "readiness_decision_record_real_creation_attempted",
  "persistence_real_creation_attempted",
  "db_write_attempted",
  "manual_review_request_real_creation_attempted",
  "reentry_interactions_real_creation_attempted",
  "supabase_touch_attempted",
  "sql_execution_attempted",
  "endpoint_creation_attempted",
  "service_role_client_violation",
  "scene_write_attempted",
  "mba_write_attempted",
  "parallel_production_runtime_artifacts_write_attempted",
  "runtime_real_start_attempted",
];

function getReadinessAuditBlockingReasons(
  source: RuntimeReadinessAuditSourceInput,
): RuntimeReadinessBoundaryBlockingReason[] {
  const reasons = getBoundaryAttemptBlockingReasons(source);
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (!hasText(source.audit_reason)) reasons.push("missing_audit_reason");
  if (!isAuditAction(source.audit_action)) reasons.push("invalid_audit_action");
  return [...new Set(reasons)];
}

function getPhase11BoundaryBlockingReasons(
  source: RuntimePhase11ExportPreviewBoundarySourceInput,
): RuntimeReadinessBoundaryBlockingReason[] {
  const reasons = getBoundaryAttemptBlockingReasons(source);
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  return [...new Set(reasons)];
}

function getPhase12QABoundaryBlockingReasons(
  source: RuntimePhase12QABoundarySourceInput,
): RuntimeReadinessBoundaryBlockingReason[] {
  const reasons = getBoundaryAttemptBlockingReasons(source);
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  return [...new Set(reasons)];
}

function getSupersessionRecomputeBlockingReasons(
  source: RuntimeReadinessSupersessionRecomputeBoundarySourceInput,
): RuntimeReadinessBoundaryBlockingReason[] {
  const reasons = getBoundaryAttemptBlockingReasons(source);
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  return [...new Set(reasons)];
}

function getPersistenceBoundaryBlockingReasons(
  source: RuntimeReadinessPersistenceBoundarySourceInput,
): RuntimeReadinessBoundaryBlockingReason[] {
  const reasons = getBoundaryAttemptBlockingReasons(source);
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  return [...new Set(reasons)];
}

function getBoundaryAttemptBlockingReasons(
  source: RuntimeReadinessBoundaryAttemptShape,
): RuntimeReadinessBoundaryBlockingReason[] {
  const reasons: RuntimeReadinessBoundaryBlockingReason[] = [];
  if (source.runtime_audit_trail_real_creation_attempted === true) {
    reasons.push("runtime_audit_trail_real_creation_attempted");
  }
  if (source.readiness_decision_record_real_creation_attempted === true) {
    reasons.push("readiness_decision_record_real_creation_attempted");
  }
  if (source.blocked_export_preview_authorization_attempted === true) {
    reasons.push("blocked_export_preview_authorization_attempted");
  }
  if (source.manual_review_export_preview_authorization_attempted === true) {
    reasons.push("manual_review_export_preview_authorization_attempted");
  }
  if (source.reentry_export_preview_authorization_attempted === true) {
    reasons.push("reentry_export_preview_authorization_attempted");
  }
  if (source.export_preview_creation_attempted === true) reasons.push("export_preview_creation_attempted");
  if (source.scr_preview_creation_attempted === true) reasons.push("scr_preview_creation_attempted");
  if (source.evidence_bundle_preview_creation_attempted === true) {
    reasons.push("evidence_bundle_preview_creation_attempted");
  }
  if (source.mdsb_preview_creation_attempted === true) reasons.push("mdsb_preview_creation_attempted");
  if (source.parallel_export_payload_creation_attempted === true) {
    reasons.push("parallel_export_payload_creation_attempted");
  }
  if (source.produccion_paralela_start_attempted === true) {
    reasons.push("produccion_paralela_start_attempted");
  }
  if (source.registry_creation_attempted === true) reasons.push("registry_creation_attempted");
  if (source.phase11_started_attempted === true) reasons.push("phase11_started_attempted");
  if (source.qa_green_declaration_attempted === true) reasons.push("qa_green_declaration_attempted");
  if (source.shadow_pilot_start_attempted === true) reasons.push("shadow_pilot_start_attempted");
  if (source.full_runtime_authorization_attempted === true) {
    reasons.push("full_runtime_authorization_attempted");
  }
  if (source.production_real_start_attempted === true) reasons.push("production_real_start_attempted");
  if (source.phase12_definition_of_done_modification_attempted === true) {
    reasons.push("phase12_definition_of_done_modification_attempted");
  }
  if (source.phase12_started_attempted === true) reasons.push("phase12_started_attempted");
  if (source.global_recompute_automatic_execution_attempted === true) {
    reasons.push("global_recompute_automatic_execution_attempted");
  }
  if (source.prior_readiness_deleted_without_trace_attempted === true) {
    reasons.push("prior_readiness_deleted_without_trace_attempted");
  }
  if (source.export_payload_superseded_real_attempted === true) {
    reasons.push("export_payload_superseded_real_attempted");
  }
  if (source.persistence_real_creation_attempted === true) reasons.push("persistence_real_creation_attempted");
  if (source.db_write_attempted === true) reasons.push("db_write_attempted");
  if (source.manual_review_request_real_creation_attempted === true) {
    reasons.push("manual_review_request_real_creation_attempted");
  }
  if (source.reentry_interactions_real_creation_attempted === true) {
    reasons.push("reentry_interactions_real_creation_attempted");
  }
  if (source.supabase_touch_attempted === true) reasons.push("supabase_touch_attempted");
  if (source.sql_execution_attempted === true) reasons.push("sql_execution_attempted");
  if (source.endpoint_creation_attempted === true) reasons.push("endpoint_creation_attempted");
  if (source.service_role_client_use_attempted === true) reasons.push("service_role_client_violation");
  if (source.scene_write_attempted === true) reasons.push("scene_write_attempted");
  if (source.mba_write_attempted === true) reasons.push("mba_write_attempted");
  if (source.parallel_production_runtime_artifacts_write_attempted === true) {
    reasons.push("parallel_production_runtime_artifacts_write_attempted");
  }
  if (source.runtime_real_start_attempted === true) reasons.push("runtime_real_start_attempted");
  return reasons;
}

type RuntimeReadinessBoundaryAttemptShape = Partial<
  Record<
    | "runtime_audit_trail_real_creation_attempted"
    | "readiness_decision_record_real_creation_attempted"
    | "blocked_export_preview_authorization_attempted"
    | "manual_review_export_preview_authorization_attempted"
    | "reentry_export_preview_authorization_attempted"
    | "export_preview_creation_attempted"
    | "scr_preview_creation_attempted"
    | "evidence_bundle_preview_creation_attempted"
    | "mdsb_preview_creation_attempted"
    | "parallel_export_payload_creation_attempted"
    | "produccion_paralela_start_attempted"
    | "registry_creation_attempted"
    | "phase11_started_attempted"
    | "qa_green_declaration_attempted"
    | "shadow_pilot_start_attempted"
    | "full_runtime_authorization_attempted"
    | "production_real_start_attempted"
    | "phase12_definition_of_done_modification_attempted"
    | "phase12_started_attempted"
    | "global_recompute_automatic_execution_attempted"
    | "prior_readiness_deleted_without_trace_attempted"
    | "export_payload_superseded_real_attempted"
    | "persistence_real_creation_attempted"
    | "db_write_attempted"
    | "manual_review_request_real_creation_attempted"
    | "reentry_interactions_real_creation_attempted"
    | "supabase_touch_attempted"
    | "sql_execution_attempted"
    | "endpoint_creation_attempted"
    | "service_role_client_use_attempted"
    | "scene_write_attempted"
    | "mba_write_attempted"
    | "parallel_production_runtime_artifacts_write_attempted"
    | "runtime_real_start_attempted",
    boolean
  >
>;

function hasAnyBoundaryReason(
  reasons: RuntimeReadinessBoundaryBlockingReason[],
  candidates: RuntimeReadinessBoundaryBlockingReason[],
): boolean {
  return candidates.some((reason) => reasons.includes(reason));
}

function resolveAggregationStatus(
  gapCandidates: RuntimeReadinessGapAggregationCandidate[],
  criticalRouteCandidates: RuntimeCriticalRouteReadinessAggregationCandidate[],
  semanticPSTCandidates: RuntimeSemanticPSTReadinessAggregationCandidate[],
  budgetCandidates: RuntimeBudgetReadinessAggregationCandidate[],
  decisionRecordCandidates: RuntimeReadinessDecisionRecordCandidate[],
): RuntimeReadinessAggregationStatus {
  const allReasons = [
    ...gapCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...criticalRouteCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...semanticPSTCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...budgetCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...decisionRecordCandidates.flatMap((candidate) => candidate.blocking_reasons),
  ];

  if (
    allReasons.includes("readiness_decision_record_real_creation_attempted") ||
    allReasons.includes("db_write_attempted")
  ) {
    return "blocked_readiness_decision_record_real_creation_attempt";
  }
  if (
    allReasons.includes("blocking_gap_hidden_attempted") ||
    allReasons.includes("blocking_gap_downgraded_without_explicit_rule") ||
    allReasons.includes("budget_hides_blocking_gap_attempted")
  ) {
    return "blocked_blocking_gap_hidden";
  }
  if (
    allReasons.includes("route_status_closed_from_satisfaction_attempted") ||
    allReasons.includes("route_status_closed_from_free_text_attempted")
  ) {
    return "blocked_free_text_route_closure_attempt";
  }
  if (
    allReasons.includes("semantic_resolution_inferred_attempted") ||
    allReasons.includes("temporal_resolution_inferred_attempted")
  ) {
    return "blocked_semantic_or_temporal_inference_attempt";
  }
  if (allReasons.includes("missing_source_trace")) return "blocked_missing_source_trace";
  if (decisionRecordCandidates.length > 0) return "readiness_decision_record_candidate_created";
  if (budgetCandidates.length > 0) return "budget_readiness_aggregation_candidate_created";
  if (semanticPSTCandidates.length > 0) {
    return "semantic_pst_readiness_aggregation_candidate_created";
  }
  if (criticalRouteCandidates.length > 0) {
    return "critical_route_readiness_aggregation_candidate_created";
  }
  return "readiness_gap_aggregation_candidate_created";
}

function getGapAggregationBlockingReasons(
  source: RuntimeReadinessGapAggregationSourceInput,
): RuntimeReadinessAggregationBlockingReason[] {
  const reasons = getAggregationAttemptBlockingReasons(source);
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (source.invented_gap_attempted === true) reasons.push("invented_gap_attempted");
  if (source.blocking_gap_hidden_attempted === true) {
    reasons.push("blocking_gap_hidden_attempted");
  }
  if (source.blocking_gap_downgraded_without_explicit_rule_attempted === true) {
    reasons.push("blocking_gap_downgraded_without_explicit_rule");
  }
  return [...new Set(reasons)];
}

function getCriticalRouteAggregationBlockingReasons(
  source: RuntimeCriticalRouteReadinessAggregationSourceInput,
): RuntimeReadinessAggregationBlockingReason[] {
  const reasons = getAggregationAttemptBlockingReasons(source);
  if (!hasSourceTrace(source.route_source_trace)) reasons.push("missing_source_trace");
  if (source.route_blocked === true) reasons.push("critical_route_blocked");
  if (source.route_missing === true) reasons.push("critical_route_missing");
  if (source.route_status_closed_from_satisfaction_attempted === true) {
    reasons.push("route_status_closed_from_satisfaction_attempted");
  }
  if (source.route_status_closed_from_free_text_attempted === true) {
    reasons.push("route_status_closed_from_free_text_attempted");
  }
  if (source.b7_diagnostic_boundary_violation_attempted === true) {
    reasons.push("b7_diagnostic_boundary_violation");
  }
  return [...new Set(reasons)];
}

function getSemanticPSTAggregationBlockingReasons(
  source: RuntimeSemanticPSTReadinessAggregationSourceInput,
): RuntimeReadinessAggregationBlockingReason[] {
  const reasons = getAggregationAttemptBlockingReasons(source);
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if ((source.sem_blockers_open_refs?.length ?? 0) > 0) reasons.push("sem_blocks_projection_open");
  if ((source.pst_blockers_open_refs?.length ?? 0) > 0) reasons.push("pst_blocking_gap_open");
  if (source.deadlock_risk === true) reasons.push("deadlock_risk_blocking");
  if (source.semantic_resolution_inferred_attempted === true) {
    reasons.push("semantic_resolution_inferred_attempted");
  }
  if (source.temporal_resolution_inferred_attempted === true) {
    reasons.push("temporal_resolution_inferred_attempted");
  }
  return [...new Set(reasons)];
}

function getBudgetAggregationBlockingReasons(
  source: RuntimeBudgetReadinessAggregationSourceInput,
): RuntimeReadinessAggregationBlockingReason[] {
  const reasons = getAggregationAttemptBlockingReasons(source);
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (source.more_causals_opened_attempted === true) reasons.push("more_causals_opened_attempted");
  if (source.budget_override_automatic_creation_attempted === true) {
    reasons.push("budget_override_automatic_creation_attempted");
  }
  if (source.budget_hides_blocking_gap_attempted === true) {
    reasons.push("budget_hides_blocking_gap_attempted");
  }
  if (source.budget_ledger_real_update_attempted === true) {
    reasons.push("budget_ledger_real_update_attempted");
  }
  return [...new Set(reasons)];
}

function getDecisionRecordCandidateBlockingReasons(
  source: RuntimeReadinessDecisionRecordSourceInput,
): RuntimeReadinessAggregationBlockingReason[] {
  const reasons = getAggregationAttemptBlockingReasons(source);
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (!isReadinessState(source.readiness_state)) reasons.push("invalid_readiness_state");
  if (!hasText(source.readiness_reason)) reasons.push("missing_readiness_reason");
  return [...new Set(reasons)];
}

function getAggregationAttemptBlockingReasons(source: {
  readiness_decision_record_real_creation_attempted?: boolean;
  db_write_attempted?: boolean;
  export_preview_creation_attempted?: boolean;
  phase11_started_attempted?: boolean;
  supabase_touch_attempted?: boolean;
  sql_execution_attempted?: boolean;
  endpoint_creation_attempted?: boolean;
}): RuntimeReadinessAggregationBlockingReason[] {
  const reasons: RuntimeReadinessAggregationBlockingReason[] = [];
  if (source.readiness_decision_record_real_creation_attempted === true) {
    reasons.push("readiness_decision_record_real_creation_attempted");
  }
  if (source.db_write_attempted === true) reasons.push("db_write_attempted");
  if (source.export_preview_creation_attempted === true) {
    reasons.push("export_preview_creation_attempted");
  }
  if (source.phase11_started_attempted === true) reasons.push("phase11_started_attempted");
  if (source.supabase_touch_attempted === true) reasons.push("supabase_touch_attempted");
  if (source.sql_execution_attempted === true) reasons.push("sql_execution_attempted");
  if (source.endpoint_creation_attempted === true) reasons.push("endpoint_creation_attempted");
  return reasons;
}

function resolveDecisionCandidateStatus(
  readyCandidates: RuntimeReadyDecisionCandidate[],
  readyWithFlagsCandidates: RuntimeReadyWithFlagsDecisionCandidate[],
  missingEvidenceCandidates: RuntimeBlockedByMissingEvidenceDecisionCandidate[],
  contradictionCandidates: RuntimeBlockedByContradictionDecisionCandidate[],
  missingRouteCandidates: RuntimeBlockedByMissingCanonicalRouteDecisionCandidate[],
  manualReviewCandidates: RuntimeManualReviewRequiredDecisionCandidate[],
): RuntimeReadinessDecisionCandidateStatus {
  const allReasons = [
    ...readyCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...readyWithFlagsCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...missingEvidenceCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...contradictionCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...missingRouteCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...manualReviewCandidates.flatMap((candidate) => candidate.blocking_reasons),
  ];

  if (allReasons.includes("blocking_gap_hidden_as_flag")) {
    return "blocked_blocking_gap_hidden_as_flag";
  }
  if (
    allReasons.includes("readiness_decision_record_real_creation_attempted") ||
    allReasons.includes("ready_final_creation_attempted") ||
    allReasons.includes("ready_with_flags_final_creation_attempted") ||
    allReasons.includes("blocked_final_creation_attempted") ||
    allReasons.includes("manual_review_request_real_creation_attempted") ||
    allReasons.includes("waiver_automatic_creation_attempted") ||
    allReasons.includes("override_automatic_creation_attempted")
  ) {
    return "blocked_readiness_real_creation_attempt";
  }
  if (allReasons.includes("export_preview_creation_attempted")) {
    return "blocked_export_preview_attempt";
  }
  if (
    allReasons.includes("route_closed_from_free_text_attempted") ||
    allReasons.includes("c09_closed_from_satisfaction_general_attempted")
  ) {
    return "blocked_free_text_route_closure_attempt";
  }
  if (allReasons.includes("missing_source_trace")) return "blocked_missing_source_trace";
  if (manualReviewCandidates.length > 0) return "manual_review_required_candidate_created";
  if (missingRouteCandidates.length > 0) return "blocked_by_missing_canonical_route_candidate_created";
  if (contradictionCandidates.length > 0) return "blocked_by_contradiction_candidate_created";
  if (missingEvidenceCandidates.length > 0) return "blocked_by_missing_evidence_candidate_created";
  if (readyWithFlagsCandidates.length > 0) return "ready_with_flags_decision_candidate_created";
  return "ready_decision_candidate_created";
}

function resolveReentryStatus(
  requiredCandidates: RuntimeReentryRequiredCandidate[],
  planCandidates: RuntimeReentryPlanCandidate[],
  boundaries: RuntimeReentryExecutionBoundary[],
): RuntimeReentryLocalStatus {
  const allReasons = [
    ...requiredCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...planCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...boundaries.flatMap((boundary) => boundary.blocking_reasons),
  ];

  if (
    allReasons.includes("reentry_real_open_attempted") ||
    allReasons.includes("runtime_interaction_instance_real_creation_attempted")
  ) {
    return "blocked_reentry_real_open_attempt";
  }
  if (allReasons.includes("ui_render_real_creation_attempted")) {
    return "blocked_ui_render_attempt";
  }
  if (allReasons.includes("response_ingest_execution_attempted")) {
    return "blocked_response_ingest_attempt";
  }
  if (allReasons.includes("missing_blocking_gap")) {
    return "blocked_reentry_without_blocking_gap";
  }
  if (allReasons.includes("missing_source_trace")) return "blocked_missing_source_trace";
  if (boundaries.length > 0) return "reentry_execution_boundary_created";
  if (planCandidates.length > 0) return "reentry_plan_candidate_created";
  return "reentry_required_candidate_created";
}

function buildReentryInteractionCandidates(
  refPrefix: string,
  sources: RuntimeReentryInteractionSourceInput[],
): RuntimeReentryInteractionCandidate[] {
  return sources.map((source, index) => ({
    reentry_interaction_candidate_ref:
      source.reentry_interaction_candidate_ref ?? `${refPrefix}:interaction:${index + 1}`,
    target_interaction_id: source.target_interaction_id,
    target_block: source.target_block ?? "",
    target_gate: source.target_gate,
    prompt_ref: source.prompt_ref,
    expected_response_type: source.expected_response_type,
    expected_resolution: source.expected_resolution,
    visible_to_user_candidate: source.visible_to_user_candidate === true,
    causal_candidate: source.causal_candidate === true,
    source_trace: source.source_trace ?? {},
  }));
}

function getReentryRequiredBlockingReasons(
  source: RuntimeReentryRequiredSourceInput,
): RuntimeReentryBlockingReason[] {
  const reasons = getReentryAttemptBlockingReasons(source);
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (!hasText(source.source_gap_ref)) reasons.push("missing_source_gap_ref");
  if (!hasText(source.source_gate_ref)) reasons.push("missing_source_gate_ref");
  if (!hasText(source.source_readiness_gap_ref)) {
    reasons.push("missing_source_readiness_gap_ref");
  }
  if (!hasText(source.reentry_target_block)) reasons.push("missing_reentry_target_block");
  if (!hasText(source.reentry_target_interaction_id)) {
    reasons.push("missing_reentry_target_interaction_id");
  }
  if (!hasText(source.reentry_reason)) reasons.push("missing_reentry_reason");
  if (source.blocking_gap_present !== true) reasons.push("missing_blocking_gap");
  if (source.reentry_by_curiosity_attempted === true) {
    reasons.push("reentry_by_curiosity_attempted");
  }
  return [...new Set(reasons)];
}

function getReentryPlanBlockingReasons(
  source: RuntimeReentryPlanSourceInput,
): RuntimeReentryBlockingReason[] {
  const reasons = getReentryAttemptBlockingReasons(source);
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (!hasText(source.target_block)) reasons.push("missing_reentry_target_block");
  if (!hasText(source.target_interaction_id)) {
    reasons.push("missing_reentry_target_interaction_id");
  }
  if (!hasText(source.source_gap_reason)) reasons.push("missing_reentry_reason");
  return [...new Set(reasons)];
}

function getReentryExecutionBoundaryBlockingReasons(
  source: RuntimeReentryExecutionBoundarySourceInput,
): RuntimeReentryBlockingReason[] {
  const reasons = getReentryAttemptBlockingReasons(source);
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  return [...new Set(reasons)];
}

function getReentryAttemptBlockingReasons(source: {
  reentry_real_open_attempted?: boolean;
  runtime_interaction_instance_real_creation_attempted?: boolean;
  ui_render_real_creation_attempted?: boolean;
  shown_at_real_creation_attempted?: boolean;
  answered_at_real_creation_attempted?: boolean;
  response_ingest_execution_attempted?: boolean;
  evidence_item_real_creation_attempted?: boolean;
  canonical_variable_record_real_creation_attempted?: boolean;
  branching_real_execution_attempted?: boolean;
  gates_reexecution_attempted?: boolean;
  readiness_final_after_reentry_candidate_attempted?: boolean;
  endpoint_creation_attempted?: boolean;
  supabase_touch_attempted?: boolean;
  sql_execution_attempted?: boolean;
  phase11_started_attempted?: boolean;
}): RuntimeReentryBlockingReason[] {
  const reasons: RuntimeReentryBlockingReason[] = [];
  if (source.reentry_real_open_attempted === true) reasons.push("reentry_real_open_attempted");
  if (source.runtime_interaction_instance_real_creation_attempted === true) {
    reasons.push("runtime_interaction_instance_real_creation_attempted");
  }
  if (source.ui_render_real_creation_attempted === true) {
    reasons.push("ui_render_real_creation_attempted");
  }
  if (source.shown_at_real_creation_attempted === true) {
    reasons.push("shown_at_real_creation_attempted");
  }
  if (source.answered_at_real_creation_attempted === true) {
    reasons.push("answered_at_real_creation_attempted");
  }
  if (source.response_ingest_execution_attempted === true) {
    reasons.push("response_ingest_execution_attempted");
  }
  if (source.evidence_item_real_creation_attempted === true) {
    reasons.push("evidence_item_real_creation_attempted");
  }
  if (source.canonical_variable_record_real_creation_attempted === true) {
    reasons.push("canonical_variable_record_real_creation_attempted");
  }
  if (source.branching_real_execution_attempted === true) {
    reasons.push("branching_real_execution_attempted");
  }
  if (source.gates_reexecution_attempted === true) {
    reasons.push("gates_reexecution_attempted");
  }
  if (source.readiness_final_after_reentry_candidate_attempted === true) {
    reasons.push("readiness_final_after_reentry_candidate_attempted");
  }
  if (source.endpoint_creation_attempted === true) reasons.push("endpoint_creation_attempted");
  if (source.supabase_touch_attempted === true) reasons.push("supabase_touch_attempted");
  if (source.sql_execution_attempted === true) reasons.push("sql_execution_attempted");
  if (source.phase11_started_attempted === true) reasons.push("phase11_started_attempted");
  return reasons;
}

function buildReadinessFlagCandidates(
  refPrefix: string,
  sources: RuntimeReadinessFlagSourceInput[],
): RuntimeReadinessFlagCandidate[] {
  return sources.map((source, index) => ({
    flag_ref: source.flag_ref ?? `${refPrefix}:flag:${index + 1}`,
    flag_type: toFlagType(source.flag_type),
    flag_reason: source.flag_reason ?? "",
    flag_source_trace: source.flag_source_trace ?? {},
    source_gap_ref: source.source_gap_ref,
  }));
}

function getReadyDecisionBlockingReasons(
  source: RuntimeReadyDecisionSourceInput,
): RuntimeReadinessDecisionBlockingReason[] {
  const reasons = getDecisionAttemptBlockingReasons(source);
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (source.all_critical_routes_closed !== true) reasons.push("critical_route_missing");
  if (source.no_blocking_gap !== true) reasons.push("blocking_gap_present");
  if (source.no_semantic_projection_block !== true) {
    reasons.push("semantic_projection_block_present");
  }
  if (source.no_pst_deadlock_gap !== true) reasons.push("pst_deadlock_gap_present");
  if (source.evidence_sufficient !== true) reasons.push("evidence_not_sufficient");
  if (source.canonical_routes_closed !== true) reasons.push("canonical_route_not_closed");
  if (source.b0_closed !== true) reasons.push("b0_not_closed");
  if (source.b2_closed !== true) reasons.push("b2_not_closed");
  if (source.b3_closed !== true) reasons.push("b3_not_closed");
  if (source.b7_non_diagnostic_boundary_respected !== true) {
    reasons.push("b7_boundary_not_respected");
  }
  if (source.manual_review_required === true) reasons.push("manual_review_required");
  if (source.reentry_required === true) reasons.push("reentry_required");
  return [...new Set(reasons)];
}

function getReadyWithFlagsBlockingReasons(
  source: RuntimeReadyWithFlagsDecisionSourceInput,
): RuntimeReadinessDecisionBlockingReason[] {
  const reasons = getDecisionAttemptBlockingReasons(source);
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (source.critical_routes_sufficient !== true) reasons.push("critical_route_missing");
  if (source.no_open_blocking_gap !== true) reasons.push("blocking_gap_present");
  if (source.no_critical_route_missing !== true) reasons.push("critical_route_missing");
  if (source.no_b7_diagnosis !== true) reasons.push("b7_diagnosis_attempted");
  if (source.blocking_gap_hidden_as_flag_attempted === true) {
    reasons.push("blocking_gap_hidden_as_flag");
  }
  return [...new Set(reasons)];
}

function getFlagBlockingReasons(
  sources: RuntimeReadinessFlagSourceInput[],
): RuntimeReadinessDecisionBlockingReason[] {
  const reasons: RuntimeReadinessDecisionBlockingReason[] = [];
  for (const source of sources) {
    if (!isFlagType(source.flag_type)) reasons.push("invalid_flag_type");
    if (!hasSourceTrace(source.flag_source_trace)) reasons.push("missing_flag_source_trace");
    if (source.source_gap_is_blocking === true) reasons.push("blocking_gap_hidden_as_flag");
  }
  return [...new Set(reasons)];
}

function getMissingEvidenceBlockingReasons(
  source: RuntimeBlockedByMissingEvidenceDecisionSourceInput,
): RuntimeReadinessDecisionBlockingReason[] {
  const reasons = getDecisionAttemptBlockingReasons(source);
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if ((source.missing_evidence_gap_refs?.length ?? 0) === 0) {
    reasons.push("missing_evidence_gap_refs");
  }
  return [...new Set(reasons)];
}

function getContradictionBlockingReasons(
  source: RuntimeBlockedByContradictionDecisionSourceInput,
): RuntimeReadinessDecisionBlockingReason[] {
  const reasons = getDecisionAttemptBlockingReasons(source);
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if ((source.contradiction_gap_refs?.length ?? 0) === 0) {
    reasons.push("missing_contradiction_gap_refs");
  }
  if (!isContradictionType(source.contradiction_type)) {
    reasons.push("invalid_contradiction_type");
  }
  if (source.contradiction_resolved_by_inference_attempted === true) {
    reasons.push("contradiction_resolved_by_inference_attempted");
  }
  return [...new Set(reasons)];
}

function getMissingRouteBlockingReasons(
  source: RuntimeBlockedByMissingCanonicalRouteDecisionSourceInput,
): RuntimeReadinessDecisionBlockingReason[] {
  const reasons = getDecisionAttemptBlockingReasons(source);
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if ((source.missing_route_gap_refs?.length ?? 0) === 0) {
    reasons.push("missing_route_gap_refs");
  }
  if (!isAffectedCriticalRoute(source.affected_critical_route)) {
    reasons.push("invalid_affected_critical_route");
  }
  if (source.route_closed_from_free_text_attempted === true) {
    reasons.push("route_closed_from_free_text_attempted");
  }
  if (source.c09_closed_from_satisfaction_general_attempted === true) {
    reasons.push("c09_closed_from_satisfaction_general_attempted");
  }
  return [...new Set(reasons)];
}

function getManualReviewBlockingReasons(
  source: RuntimeManualReviewRequiredDecisionSourceInput,
): RuntimeReadinessDecisionBlockingReason[] {
  const reasons = getDecisionAttemptBlockingReasons(source);
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (!isManualReviewReason(source.manual_review_reason)) {
    reasons.push("invalid_manual_review_reason");
  }
  if (source.manual_review_request_real_creation_attempted === true) {
    reasons.push("manual_review_request_real_creation_attempted");
  }
  if (source.waiver_automatic_creation_attempted === true) {
    reasons.push("waiver_automatic_creation_attempted");
  }
  if (source.override_automatic_creation_attempted === true) {
    reasons.push("override_automatic_creation_attempted");
  }
  return [...new Set(reasons)];
}

function getDecisionAttemptBlockingReasons(source: {
  readiness_decision_record_real_creation_attempted?: boolean;
  ready_final_creation_attempted?: boolean;
  ready_with_flags_final_creation_attempted?: boolean;
  blocked_final_creation_attempted?: boolean;
  export_preview_creation_attempted?: boolean;
  phase11_started_attempted?: boolean;
  supabase_touch_attempted?: boolean;
  sql_execution_attempted?: boolean;
  endpoint_creation_attempted?: boolean;
}): RuntimeReadinessDecisionBlockingReason[] {
  const reasons: RuntimeReadinessDecisionBlockingReason[] = [];
  if (source.readiness_decision_record_real_creation_attempted === true) {
    reasons.push("readiness_decision_record_real_creation_attempted");
  }
  if (source.ready_final_creation_attempted === true) {
    reasons.push("ready_final_creation_attempted");
  }
  if (source.ready_with_flags_final_creation_attempted === true) {
    reasons.push("ready_with_flags_final_creation_attempted");
  }
  if (source.blocked_final_creation_attempted === true) {
    reasons.push("blocked_final_creation_attempted");
  }
  if (source.export_preview_creation_attempted === true) {
    reasons.push("export_preview_creation_attempted");
  }
  if (source.phase11_started_attempted === true) reasons.push("phase11_started_attempted");
  if (source.supabase_touch_attempted === true) reasons.push("supabase_touch_attempted");
  if (source.sql_execution_attempted === true) reasons.push("sql_execution_attempted");
  if (source.endpoint_creation_attempted === true) reasons.push("endpoint_creation_attempted");
  return reasons;
}

function resolveFoundationStatus(
  input: RuntimePhase10ReadinessFoundationLocalInput,
  engineCandidates: RuntimeReadinessEngineEvaluationCandidate[],
  ruleContracts: RuntimeReadinessRuleSourceContract[],
  stateModels: RuntimeReadinessStateModelCandidate[],
): RuntimeReadinessFoundationStatus {
  const allReasons = [
    ...engineCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...ruleContracts.flatMap((contract) => contract.blocking_reasons),
    ...stateModels.flatMap((model) => model.blocking_reasons),
    ...getBoundaryGuardBlockingReasons(input),
  ];

  if (allReasons.includes("phase11_started_attempted")) return "blocked_phase11_started_attempt";
  if (
    allReasons.includes("readiness_real_execution_attempted") ||
    allReasons.includes("readiness_decision_record_real_creation_attempted") ||
    allReasons.includes("ready_final_creation_attempted") ||
    allReasons.includes("ready_with_flags_final_creation_attempted") ||
    allReasons.includes("blocked_final_creation_attempted") ||
    allReasons.includes("manual_review_request_real_creation_attempted") ||
    allReasons.includes("reentry_interactions_real_creation_attempted")
  ) {
    return "blocked_readiness_real_execution_attempt";
  }
  if (
    allReasons.includes("export_preview_creation_attempted") ||
    allReasons.includes("parallel_export_payload_creation_attempted") ||
    allReasons.includes("produccion_paralela_start_attempted")
  ) {
    return "blocked_export_preview_attempt";
  }
  if (allReasons.includes("missing_source_trace")) return "blocked_missing_source_trace";
  if (stateModels.length > 0) return "readiness_state_model_candidate_created";
  if (ruleContracts.length > 0) return "readiness_rule_source_contract_created";
  if (engineCandidates.length > 0) return "readiness_engine_evaluation_candidate_created";
  return "phase10_input_revalidation_passed";
}

function getEngineBlockingReasons(
  source: RuntimeReadinessEngineEvaluationSourceInput,
): RuntimeReadinessFoundationBlockingReason[] {
  const reasons: RuntimeReadinessFoundationBlockingReason[] = [];
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (!isReadinessState(source.readiness_state_candidate)) {
    reasons.push("missing_readiness_state");
  }
  if (source.readiness_engine_real_execution_attempted === true) {
    reasons.push("readiness_real_execution_attempted");
  }
  if (source.readiness_decision_record_real_creation_attempted === true) {
    reasons.push("readiness_decision_record_real_creation_attempted");
  }
  if (source.ready_final_creation_attempted === true) {
    reasons.push("ready_final_creation_attempted");
  }
  if (source.ready_with_flags_final_creation_attempted === true) {
    reasons.push("ready_with_flags_final_creation_attempted");
  }
  if (source.blocked_final_creation_attempted === true) {
    reasons.push("blocked_final_creation_attempted");
  }
  if (source.manual_review_request_real_creation_attempted === true) {
    reasons.push("manual_review_request_real_creation_attempted");
  }
  if (source.reentry_interactions_real_creation_attempted === true) {
    reasons.push("reentry_interactions_real_creation_attempted");
  }
  if (source.export_preview_creation_attempted === true) {
    reasons.push("export_preview_creation_attempted");
  }
  if (source.parallel_export_payload_creation_attempted === true) {
    reasons.push("parallel_export_payload_creation_attempted");
  }
  if (source.produccion_paralela_start_attempted === true) {
    reasons.push("produccion_paralela_start_attempted");
  }
  if (source.phase11_started_attempted === true) reasons.push("phase11_started_attempted");
  return reasons;
}

function getRuleBlockingReasons(
  source: RuntimeReadinessRuleSourceInput,
): RuntimeReadinessFoundationBlockingReason[] {
  const reasons: RuntimeReadinessFoundationBlockingReason[] = [];
  if (!hasText(source.rule_id)) reasons.push("missing_readiness_rule");
  if (!isReadinessState(source.readiness_state)) reasons.push("missing_readiness_state");
  if (hasText(source.readiness_state) && !isReadinessState(source.readiness_state)) {
    reasons.push("invented_readiness_state");
  }
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (source.readiness_from_free_narrative_attempted === true) {
    reasons.push("readiness_from_free_narrative_attempted");
  }
  if (source.readiness_from_causal_score_only_attempted === true) {
    reasons.push("readiness_from_causal_score_only_attempted");
  }
  if (source.readiness_from_b7_c20_preclassification_only_attempted === true) {
    reasons.push("readiness_from_b7_c20_preclassification_only_attempted");
  }
  if (source.explicit_rule_required === false) reasons.push("missing_readiness_rule");
  return reasons;
}

function getBoundaryGuardBlockingReasons(
  input: RuntimePhase10ReadinessFoundationLocalInput,
): RuntimeReadinessFoundationBlockingReason[] {
  const guard = input.boundary_guard ?? {};
  const reasons: RuntimeReadinessFoundationBlockingReason[] = [];
  if (guard.critical_gates_recalculation_attempted === true) {
    reasons.push("critical_gates_recalculation_attempted");
  }
  if (guard.phase9_modification_attempted === true) {
    reasons.push("phase9_modification_attempted");
  }
  if (guard.supabase_touch_attempted === true) reasons.push("supabase_touch_attempted");
  if (guard.sql_execution_attempted === true) reasons.push("sql_execution_attempted");
  if (guard.endpoint_creation_attempted === true) reasons.push("endpoint_creation_attempted");
  if (guard.service_role_client_use_attempted === true) {
    reasons.push("service_role_client_violation");
  }
  return reasons;
}

function createResult(
  status: RuntimeReadinessFoundationStatus,
  revalidation: RuntimePhase10InputRevalidationDecision,
  engineCandidates: RuntimeReadinessEngineEvaluationCandidate[] = [],
  ruleContracts: RuntimeReadinessRuleSourceContract[] = [],
  stateModels: RuntimeReadinessStateModelCandidate[] = [],
): RuntimePhase10ReadinessFoundationLocalResult {
  return {
    status,
    phase10_input_revalidation: revalidation,
    readiness_engine_evaluation_candidates: engineCandidates,
    readiness_rule_source_contracts: ruleContracts,
    readiness_state_model_candidates: stateModels,
    phase10_started_local: revalidation.phase10_started_local,
    phase10_closed_local: false,
    ready_for_phase11_authorization: false,
    readiness_engine_real_executed: false,
    readiness_decision_record_real_created: false,
    ready_final_created: false,
    ready_with_flags_final_created: false,
    blocked_final_created: false,
    manual_review_request_real_created: false,
    reentry_interactions_real_created: false,
    budget_ledger_real_updated: false,
    export_preview_created: false,
    parallel_export_payload_created: false,
    produccion_paralela_started: false,
    runtime_40_20_started: false,
    catalog_activated: false,
    migration_applied: false,
    supabase_touched: false,
    sql_executed: false,
    endpoint_created: false,
    service_role_used: false,
    service_role_used_in_client: false,
    object_inventory_created: false,
    mba_write_detected: false,
    scene_write_detected: false,
    parallel_production_runtime_artifacts_write_detected: false,
    diagnosis_created: false,
    ir_created: false,
    registry_created: false,
    phase11_started: false,
    phase12_started: false,
  };
}

function toReadinessState(value: unknown): RuntimeReadinessStateCandidate {
  return isReadinessState(value) ? value : "blocked_by_missing_evidence";
}

function toFlagType(value: unknown): RuntimeReadinessFlagType {
  return isFlagType(value) ? value : "evidence_low_confidence";
}

function toContradictionType(value: unknown): RuntimeReadinessContradictionType {
  return isContradictionType(value) ? value : "evidence_vs_variable";
}

function toAffectedCriticalRoute(value: unknown): RuntimeAffectedCriticalRoute {
  return isAffectedCriticalRoute(value) ? value : "B0";
}

function toManualReviewReason(value: unknown): RuntimeManualReviewReason {
  return isManualReviewReason(value) ? value : "evidence_insufficient";
}

function toAuditAction(value: unknown): RuntimeReadinessAuditAction {
  return isAuditAction(value) ? value : "readiness_evaluation_started";
}

function isReadinessState(value: unknown): value is RuntimeReadinessStateCandidate {
  return typeof value === "string" && ALLOWED_READINESS_STATES.includes(value as RuntimeReadinessStateCandidate);
}

function isFlagType(value: unknown): value is RuntimeReadinessFlagType {
  return typeof value === "string" && ALLOWED_FLAG_TYPES.includes(value as RuntimeReadinessFlagType);
}

function isContradictionType(value: unknown): value is RuntimeReadinessContradictionType {
  return (
    typeof value === "string" &&
    ALLOWED_CONTRADICTION_TYPES.includes(value as RuntimeReadinessContradictionType)
  );
}

function isAffectedCriticalRoute(value: unknown): value is RuntimeAffectedCriticalRoute {
  return (
    typeof value === "string" &&
    ALLOWED_CRITICAL_ROUTES.includes(value as RuntimeAffectedCriticalRoute)
  );
}

function isManualReviewReason(value: unknown): value is RuntimeManualReviewReason {
  return (
    typeof value === "string" &&
    ALLOWED_MANUAL_REVIEW_REASONS.includes(value as RuntimeManualReviewReason)
  );
}

function isAuditAction(value: unknown): value is RuntimeReadinessAuditAction {
  return typeof value === "string" && ALLOWED_AUDIT_ACTIONS.includes(value as RuntimeReadinessAuditAction);
}

function hasSourceTrace(value: unknown): boolean {
  const sourceTrace = value as Record<string, unknown> | undefined;
  return (
    typeof sourceTrace?.source_document === "string" &&
    typeof sourceTrace?.source_sheet === "string" &&
    typeof sourceTrace?.source_row_number === "number"
  );
}

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
