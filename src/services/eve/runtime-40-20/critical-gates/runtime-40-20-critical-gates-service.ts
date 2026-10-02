import type {
  RuntimeB0SemanticEntryGateCandidate,
  RuntimeB0SemanticEntryGateInput,
  RuntimeB2TransformationExceptionGateCandidate,
  RuntimeB2TransformationExceptionGateInput,
  RuntimeB3ReceiverFeedbackGateCandidate,
  RuntimeB3ReceiverFeedbackGateInput,
  RuntimeB7C20NonDiagnosticBoundaryGateCandidate,
  RuntimeB7C20NonDiagnosticBoundaryGateInput,
  RuntimeCriticalGateBlockingReason,
  RuntimeCriticalGateEvaluationCandidate,
  RuntimeCriticalGateEvaluationSourceInput,
  RuntimeCriticalGateFrameworkLocalResult,
  RuntimeCriticalGateOutcome,
  RuntimeCriticalGatesLocalInput,
  RuntimeCriticalGateStatus,
  RuntimeCriticalRouteGateResultCandidate,
  RuntimeCriticalRouteGateResultInput,
  RuntimeGapAuditBoundaryBlockingReason,
  RuntimeGapAuditBoundaryStatus,
  RuntimeGateAuditAction,
  RuntimeGateAuditTrailCandidate,
  RuntimeGateAuditTrailInput,
  RuntimeGateControlPlaneBoundary,
  RuntimeGateControlPlaneBoundaryInput,
  RuntimeGateObjectInventoryBoundary,
  RuntimeGateObjectInventoryBoundaryInput,
  RuntimeGateOutcomeReadinessBoundary,
  RuntimeGateOutcomeReadinessBoundaryInput,
  RuntimeGatePersistenceBoundary,
  RuntimeGatePersistenceBoundaryInput,
  RuntimePhase9InputRevalidationDecision,
  RuntimeProcessStateTimerEventContractCandidate,
  RuntimeProcessStateTimerEventContractInput,
  RuntimeProcessStateTimerGateCandidate,
  RuntimeProcessStateTimerGateSourceInput,
  RuntimePST001WaitWithoutAwaitedEventCandidate,
  RuntimePST002MissingReleaseConditionCandidate,
  RuntimePST003MissingTimerOrTimeoutRuleCandidate,
  RuntimePST004MissingTimeoutStateCandidate,
  RuntimePST005MissingResolverOwnerCandidate,
  RuntimePST006MissingExitPathCandidate,
  RuntimePSTGateBlockingReason,
  RuntimePSTGateCode,
  RuntimePSTGateStatus,
  RuntimePSTSpecificGateInput,
  RuntimeReadinessGapRecordCandidate,
  RuntimeReadinessGapRecordInput,
  RuntimeSEM001StateAsClassGateCandidate,
  RuntimeSEM001StateAsClassGateInput,
  RuntimeSEM002AttributeAsClassGateCandidate,
  RuntimeSEM002AttributeAsClassGateInput,
  RuntimeSEM003ProcessAsObjectGateCandidate,
  RuntimeSEM003ProcessAsObjectGateInput,
  RuntimeSEM004FalseISAByTypeOfGateCandidate,
  RuntimeSEM004FalseISAByTypeOfGateInput,
  RuntimeSEM005AliasOrDuplicateGateCandidate,
  RuntimeSEM005AliasOrDuplicateGateInput,
  RuntimeSEM006RolePhaseEndConfusionGateCandidate,
  RuntimeSEM006RolePhaseEndConfusionGateInput,
  RuntimeSEM007FusedMarsupialObjectGateCandidate,
  RuntimeSEM007FusedMarsupialObjectGateInput,
  RuntimeSemanticAmbiguityType,
  RuntimeSemanticGateBlockingReason,
  RuntimeSemanticGateCode,
  RuntimeSemanticGateStatus,
  RuntimeSemanticResolutionEventContractCandidate,
  RuntimeSemanticResolutionEventContractInput,
  RuntimeSemanticResolutionGateCandidate,
  RuntimeSemanticResolutionGateSourceInput,
} from "./runtime-40-20-critical-gates-types";

export const Runtime40_20CriticalGatesService = {
  revalidatePhase8InputForPhase9,
  buildCriticalGateEvaluationCandidates,
  evaluateB0SemanticEntryGateLocally,
  evaluateB2TransformationExceptionGateLocally,
  evaluateB3ReceiverFeedbackGateLocally,
  evaluateB7C20NonDiagnosticBoundaryGateLocally,
  buildCriticalRouteGateResultCandidates,
  buildPhase9CriticalRouteGateFrameworkLocalResult,
  buildSemanticResolutionGateCandidates,
  evaluateSEM001StateAsClassLocally,
  evaluateSEM002AttributeAsClassLocally,
  evaluateSEM003ProcessAsObjectLocally,
  evaluateSEM004FalseISAByTypeOfLocally,
  evaluateSEM005AliasOrDuplicateLocally,
  evaluateSEM006RolePhaseEndConfusionLocally,
  evaluateSEM007FusedMarsupialObjectLocally,
  buildPhase9SemanticResolutionGatesLocalResult,
  buildProcessStateTimerGateCandidates,
  evaluatePST001WaitWithoutAwaitedEventLocally,
  evaluatePST002MissingReleaseConditionLocally,
  evaluatePST003MissingTimerOrTimeoutRuleLocally,
  evaluatePST004MissingTimeoutStateLocally,
  evaluatePST005MissingResolverOwnerLocally,
  evaluatePST006MissingExitPathLocally,
  buildSemanticResolutionEventContractCandidates,
  buildProcessStateTimerEventContractCandidates,
  buildPhase9PSTSemanticEventTimerEventLocalResult,
  buildReadinessGapRecordCandidates,
  buildGateAuditTrailCandidates,
  buildGateOutcomeReadinessBoundaries,
  buildGateObjectInventoryBoundaries,
  buildGateControlPlaneBoundaries,
  buildGatePersistenceBoundaries,
  buildPhase9GapAuditReadinessObjectMembranePersistenceBoundaryLocalResult,
};

export function buildPhase9CriticalRouteGateFrameworkLocalResult(
  input: RuntimeCriticalGatesLocalInput,
): RuntimeCriticalGateFrameworkLocalResult {
  const revalidation = revalidatePhase8InputForPhase9(input);

  if (!revalidation.phase8_closed_local) {
    return createResult(input, "blocked_phase8_not_closed", revalidation);
  }
  if (!revalidation.ready_for_phase9_authorization) {
    return createResult(input, "blocked_phase9_not_authorized", revalidation);
  }

  const gateEvaluationCandidates = buildCriticalGateEvaluationCandidates(
    input.case_id,
    input.gate_evaluation_sources ?? [],
  );
  const b0Candidates = (input.b0_semantic_entry_sources ?? []).map((source, index) =>
    evaluateB0SemanticEntryGateLocally(input.case_id, source, index),
  );
  const b2Candidates = (input.b2_transformation_exception_sources ?? []).map((source, index) =>
    evaluateB2TransformationExceptionGateLocally(input.case_id, source, index),
  );
  const b3Candidates = (input.b3_receiver_feedback_sources ?? []).map((source, index) =>
    evaluateB3ReceiverFeedbackGateLocally(input.case_id, source, index),
  );
  const b7Candidates = (input.b7_c20_non_diagnostic_sources ?? []).map((source, index) =>
    evaluateB7C20NonDiagnosticBoundaryGateLocally(input.case_id, source, index),
  );
  const routeGateResultCandidates = buildCriticalRouteGateResultCandidates(
    input.case_id,
    input.route_gate_result_sources ?? [],
    gateEvaluationCandidates,
  );

  return createResult(
    input,
    resolveStatus(
      gateEvaluationCandidates,
      b0Candidates,
      b2Candidates,
      b3Candidates,
      b7Candidates,
      routeGateResultCandidates,
    ),
    revalidation,
    gateEvaluationCandidates,
    b0Candidates,
    b2Candidates,
    b3Candidates,
    b7Candidates,
    routeGateResultCandidates,
  );
}

export function buildPhase9SemanticResolutionGatesLocalResult(
  input: RuntimeCriticalGatesLocalInput,
): RuntimeCriticalGateFrameworkLocalResult {
  const base = buildPhase9CriticalRouteGateFrameworkLocalResult(input);
  if (
    base.status === "blocked_phase8_not_closed" ||
    base.status === "blocked_phase9_not_authorized"
  ) {
    return base;
  }

  const semanticResolutionGateCandidates = buildSemanticResolutionGateCandidates(
    input.case_id,
    input.semantic_resolution_gate_sources ?? [],
  );
  const sem001Candidates = (input.sem001_state_as_class_sources ?? []).map((source, index) =>
    evaluateSEM001StateAsClassLocally(input.case_id, source, index),
  );
  const sem002Candidates = (input.sem002_attribute_as_class_sources ?? []).map((source, index) =>
    evaluateSEM002AttributeAsClassLocally(input.case_id, source, index),
  );
  const sem003Candidates = (input.sem003_process_as_object_sources ?? []).map((source, index) =>
    evaluateSEM003ProcessAsObjectLocally(input.case_id, source, index),
  );
  const sem004Candidates = (input.sem004_false_isa_sources ?? []).map((source, index) =>
    evaluateSEM004FalseISAByTypeOfLocally(input.case_id, source, index),
  );
  const sem005Candidates = (input.sem005_alias_duplicate_sources ?? []).map((source, index) =>
    evaluateSEM005AliasOrDuplicateLocally(input.case_id, source, index),
  );
  const sem006Candidates = (input.sem006_role_phase_end_sources ?? []).map((source, index) =>
    evaluateSEM006RolePhaseEndConfusionLocally(input.case_id, source, index),
  );
  const sem007Candidates = (input.sem007_fused_marsupial_sources ?? []).map((source, index) =>
    evaluateSEM007FusedMarsupialObjectLocally(input.case_id, source, index),
  );

  return {
    ...base,
    status: resolveSemanticStatus(
      semanticResolutionGateCandidates,
      sem001Candidates,
      sem002Candidates,
      sem003Candidates,
      sem004Candidates,
      sem005Candidates,
      sem006Candidates,
      sem007Candidates,
    ),
    semantic_resolution_gate_candidates: semanticResolutionGateCandidates,
    sem001_state_as_class_candidates: sem001Candidates,
    sem002_attribute_as_class_candidates: sem002Candidates,
    sem003_process_as_object_candidates: sem003Candidates,
    sem004_false_isa_candidates: sem004Candidates,
    sem005_alias_duplicate_candidates: sem005Candidates,
    sem006_role_phase_end_candidates: sem006Candidates,
    sem007_fused_marsupial_candidates: sem007Candidates,
    semantic_resolution_event_real_created: false,
    readiness_gap_record_real_created: false,
    runtime_audit_trail_real_created: false,
    object_inventory_created: false,
    moc_real_projection_created: false,
    pf_real_projection_created: false,
    olc_real_projection_created: false,
    export_preview_created: false,
    diagnosis_created: false,
    ir_created: false,
    registry_created: false,
    phase10_started: false,
  };
}

export function buildPhase9PSTSemanticEventTimerEventLocalResult(
  input: RuntimeCriticalGatesLocalInput,
): RuntimeCriticalGateFrameworkLocalResult {
  const base = buildPhase9SemanticResolutionGatesLocalResult(input);
  if (
    base.status === "blocked_phase8_not_closed" ||
    base.status === "blocked_phase9_not_authorized"
  ) {
    return base;
  }

  const pstGateCandidates = buildProcessStateTimerGateCandidates(
    input.case_id,
    input.process_state_timer_gate_sources ?? [],
  );
  const pst001Candidates = (input.pst001_wait_without_awaited_event_sources ?? []).map((source, index) =>
    evaluatePST001WaitWithoutAwaitedEventLocally(input.case_id, source, index),
  );
  const pst002Candidates = (input.pst002_missing_release_condition_sources ?? []).map((source, index) =>
    evaluatePST002MissingReleaseConditionLocally(input.case_id, source, index),
  );
  const pst003Candidates = (input.pst003_missing_timer_or_timeout_sources ?? []).map((source, index) =>
    evaluatePST003MissingTimerOrTimeoutRuleLocally(input.case_id, source, index),
  );
  const pst004Candidates = (input.pst004_missing_timeout_state_sources ?? []).map((source, index) =>
    evaluatePST004MissingTimeoutStateLocally(input.case_id, source, index),
  );
  const pst005Candidates = (input.pst005_missing_resolver_owner_sources ?? []).map((source, index) =>
    evaluatePST005MissingResolverOwnerLocally(input.case_id, source, index),
  );
  const pst006Candidates = (input.pst006_missing_exit_path_sources ?? []).map((source, index) =>
    evaluatePST006MissingExitPathLocally(input.case_id, source, index),
  );
  const semanticEventCandidates = buildSemanticResolutionEventContractCandidates(
    input.case_id,
    input.semantic_resolution_event_contract_sources ?? [],
  );
  const pstEventCandidates = buildProcessStateTimerEventContractCandidates(
    input.case_id,
    input.process_state_timer_event_contract_sources ?? [],
  );

  return {
    ...base,
    status: resolvePSTStatus(
      pstGateCandidates,
      pst001Candidates,
      pst002Candidates,
      pst003Candidates,
      pst004Candidates,
      pst005Candidates,
      pst006Candidates,
      semanticEventCandidates,
      pstEventCandidates,
    ),
    process_state_timer_gate_candidates: pstGateCandidates,
    pst001_wait_without_awaited_event_candidates: pst001Candidates,
    pst002_missing_release_condition_candidates: pst002Candidates,
    pst003_missing_timer_or_timeout_candidates: pst003Candidates,
    pst004_missing_timeout_state_candidates: pst004Candidates,
    pst005_missing_resolver_owner_candidates: pst005Candidates,
    pst006_missing_exit_path_candidates: pst006Candidates,
    semantic_resolution_event_contract_candidates: semanticEventCandidates,
    process_state_timer_event_contract_candidates: pstEventCandidates,
    semantic_resolution_event_real_created: false,
    process_state_timer_event_real_created: false,
    readiness_gap_record_real_created: false,
    runtime_audit_trail_real_created: false,
    pf_real_projection_created: false,
    olc_real_transition_created: false,
    readiness_decision_record_real_created: false,
    readiness_engine_executed: false,
    export_preview_created: false,
    diagnosis_created: false,
    ir_created: false,
    registry_created: false,
    phase10_started: false,
  };
}

export function buildPhase9GapAuditReadinessObjectMembranePersistenceBoundaryLocalResult(
  input: RuntimeCriticalGatesLocalInput,
): RuntimeCriticalGateFrameworkLocalResult {
  const base = buildPhase9PSTSemanticEventTimerEventLocalResult(input);
  if (
    base.status === "blocked_phase8_not_closed" ||
    base.status === "blocked_phase9_not_authorized"
  ) {
    return base;
  }

  const readinessGapCandidates = buildReadinessGapRecordCandidates(
    input.case_id,
    input.readiness_gap_record_sources ?? [],
  );
  const auditCandidates = buildGateAuditTrailCandidates(
    input.case_id,
    input.gate_audit_trail_sources ?? [],
  );
  const readinessBoundaries = buildGateOutcomeReadinessBoundaries(
    input.case_id,
    input.gate_outcome_readiness_boundary_sources ?? [],
  );
  const objectBoundaries = buildGateObjectInventoryBoundaries(
    input.case_id,
    input.gate_object_inventory_boundary_sources ?? [],
  );
  const controlPlaneBoundaries = buildGateControlPlaneBoundaries(
    input.case_id,
    input.gate_control_plane_boundary_sources ?? [],
  );
  const persistenceBoundaries = buildGatePersistenceBoundaries(
    input.case_id,
    input.gate_persistence_boundary_sources ?? [],
  );

  return {
    ...base,
    status: resolveGapAuditBoundaryStatus(
      readinessGapCandidates,
      auditCandidates,
      readinessBoundaries,
      objectBoundaries,
      controlPlaneBoundaries,
      persistenceBoundaries,
    ),
    readiness_gap_record_candidates: readinessGapCandidates,
    gate_audit_trail_candidates: auditCandidates,
    gate_outcome_readiness_boundaries: readinessBoundaries,
    gate_object_inventory_boundaries: objectBoundaries,
    gate_control_plane_boundaries: controlPlaneBoundaries,
    gate_persistence_boundaries: persistenceBoundaries,
    readiness_gap_record_real_created: false,
    runtime_audit_trail_real_created: false,
    readiness_decision_record_real_created: false,
    readiness_engine_executed: false,
    object_inventory_created: false,
    semantic_resolution_event_real_created: false,
    process_state_timer_event_real_created: false,
    export_preview_created: false,
    diagnosis_created: false,
    ir_created: false,
    registry_created: false,
    phase10_started: false,
    ready_for_phase10_authorization: false,
    phase9_closed_local: false,
  };
}

export function revalidatePhase8InputForPhase9(
  input: RuntimeCriticalGatesLocalInput,
): RuntimePhase9InputRevalidationDecision {
  const phase8Candidates = input.phase8_candidates;
  const signalCandidates = phase8Candidates.signal_candidates ?? [];

  return {
    phase8_closed_local: input.phase8_closeout.phase8_closed_local === true,
    ready_for_phase9_authorization:
      input.phase8_closeout.ready_for_phase9_authorization === true,
    phase9_started_local:
      input.phase8_closeout.phase8_closed_local === true &&
      input.phase8_closeout.ready_for_phase9_authorization === true,
    phase9_closed_local: false,
    ready_for_phase10_authorization: false,
    branching_decision_candidates_available:
      (phase8Candidates.branching_decision_candidates?.length ?? 0) > 0,
    trigger_evaluation_candidates_available:
      (phase8Candidates.trigger_evaluation_candidates?.length ?? 0) > 0,
    causal_score_candidates_available:
      (phase8Candidates.causal_score_candidates?.length ?? 0) > 0,
    route_status_candidates_available: signalCandidates.some(
      (candidate) => candidate.source_route_status !== undefined,
    ),
    gap_flag_candidates_available: signalCandidates.some(
      (candidate) => candidate.source_gap_flag !== undefined,
    ),
    carry_forward_gap_candidates_available:
      (phase8Candidates.carry_forward_gap_candidates?.length ?? 0) > 0,
    reentry_candidates_available: (phase8Candidates.reentry_candidates?.length ?? 0) > 0,
    budget_exhaustion_guards_available:
      (phase8Candidates.budget_exhaustion_guards?.length ?? 0) > 0,
    phase9_boundary_from_phase8d_available:
      (phase8Candidates.phase9_boundaries?.length ?? 0) > 0,
    critical_route_gate_previously_executed: false,
    mmabp_gate_engine_previously_executed: false,
    semantic_resolution_event_real_previously_created: false,
    process_state_timer_event_real_previously_created: false,
    readiness_decision_record_real_previously_created: false,
    branching_recalculated: false,
    phase8_modified: false,
    phase10_started: false,
  };
}

export function buildCriticalGateEvaluationCandidates(
  caseId: string,
  sources: RuntimeCriticalGateEvaluationSourceInput[],
): RuntimeCriticalGateEvaluationCandidate[] {
  return sources.map((source, index) => {
    const blockingReasons = getGateFrameworkBlockingReasons(source);
    return {
      gate_evaluation_candidate_ref: `${caseId}:${source.gate_family}:${index + 1}:gate_evaluation_candidate`,
      gate_id: source.gate_id,
      gate_family: source.gate_family,
      protected_route_id: source.protected_route_id ?? "",
      protected_object_hint: source.protected_object_hint ?? "",
      future_object_family: source.future_object_family,
      source_variable_refs: source.source_variable_refs ?? [],
      source_evidence_refs: source.source_evidence_refs ?? [],
      source_branching_decision_refs: source.source_branching_decision_refs ?? [],
      source_trace: source.source_trace ?? {},
      gate_outcome: source.gate_outcome ?? gateOutcomeFromBlockingReasons(blockingReasons),
      contamination_blocked: source.contamination_blocked !== false,
      finding_code: source.finding_code ?? "",
      summary_ready: true,
      projected_to_mba: false,
      runtime_audit_candidate_ref: source.runtime_audit_candidate_ref,
      runtime_audit_trail_real_created: false,
      readiness_final_created: false,
      export_preview_created: false,
      gate_candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function evaluateB0SemanticEntryGateLocally(
  caseId: string,
  source: RuntimeB0SemanticEntryGateInput,
  index = 0,
): RuntimeB0SemanticEntryGateCandidate {
  const actionVerbPresent = hasText(source.action_verb);
  const inputOrObjectPresent = hasText(source.input_or_object);
  const outputOrResultPresent = hasText(source.output_or_result);
  const procedureOrStandardPresent =
    source.procedure_or_standard_required === true ? hasText(source.procedure_or_standard) : true;
  const minimumStructurePresent =
    actionVerbPresent &&
    inputOrObjectPresent &&
    outputOrResultPresent &&
    procedureOrStandardPresent;
  const blockingReasons: RuntimeCriticalGateBlockingReason[] = [];

  if (!minimumStructurePresent) blockingReasons.push("missing_required_b0_subfield");
  if (source.preload_confirmed !== true) blockingReasons.push("preload_not_confirmed");
  if (source.ambiguous_activity_text === true) blockingReasons.push("ambiguous_activity_text");
  if (!hasSourceTrace(source.source_trace)) blockingReasons.push("missing_source_trace");
  if (source.scene_canonical_record_real_creation_attempted === true) {
    blockingReasons.push("scene_canonical_record_real_creation_attempted");
  }

  return {
    b0_gate_candidate_ref:
      source.b0_gate_candidate_ref ?? `${caseId}:B0:${index + 1}:semantic_entry_gate_candidate`,
    b0_q01_protected: true,
    semantic_entry_route: source.semantic_entry_route ?? "B0-Q01",
    protected_object_hint: source.protected_object_hint ?? "ActivitySemanticEntry / SceneCanonicalRecord readiness",
    action_verb_present: actionVerbPresent,
    input_or_object_present: inputOrObjectPresent,
    procedure_or_standard_present: procedureOrStandardPresent,
    output_or_result_present: outputOrResultPresent,
    user_correction_note_preserved: hasText(source.user_correction_note),
    semantic_confirmation_status: source.semantic_confirmation_status,
    preload_confirmed: source.preload_confirmed === true,
    ambiguous_activity_text_blocked: source.ambiguous_activity_text === true,
    minimum_structure_present: minimumStructurePresent,
    readiness_gap_record_candidate_created: !minimumStructurePresent,
    reentry_required_candidate_created: !minimumStructurePresent,
    finding_code: "b0_semantic_entry_blocked",
    ready_declared: false,
    scene_canonical_record_real_created: false,
    source_trace: source.source_trace ?? {},
    blocking_reasons: blockingReasons,
  };
}

export function evaluateB2TransformationExceptionGateLocally(
  caseId: string,
  source: RuntimeB2TransformationExceptionGateInput,
  index = 0,
): RuntimeB2TransformationExceptionGateCandidate {
  const textualWithoutClosedRoute =
    source.transformation_exception_exists === true &&
    hasText(source.transformation_exception_description) &&
    (source.transformation_exception_route_unresolved === true ||
      source.canonical_route_closed !== true);
  const blockingReasons: RuntimeCriticalGateBlockingReason[] = [];

  if (textualWithoutClosedRoute) blockingReasons.push("textual_exception_without_closed_route");
  if (source.closed_variable_from_free_text_attempted === true) {
    blockingReasons.push("free_text_closed_variable_attempted");
  }
  if (source.pf_olc_projection_without_closed_route_attempted === true) {
    blockingReasons.push("pf_olc_projection_without_closed_route");
  }
  if (!hasSourceTrace(source.source_trace)) blockingReasons.push("missing_source_trace");

  return {
    b2_gate_candidate_ref:
      source.b2_gate_candidate_ref ??
      `${caseId}:B2:${index + 1}:transformation_exception_gate_candidate`,
    transformation_exception_route: source.transformation_exception_route ?? "CR-B2",
    protected_object_hint:
      source.protected_object_hint ?? "TransformationExceptionEvidence / CanonicalRouteException",
    transformation_exception_exists: source.transformation_exception_exists,
    transformation_exception_type: source.transformation_exception_type,
    transformation_exception_description: source.transformation_exception_description,
    transformation_exception_route_unresolved:
      source.transformation_exception_route_unresolved === true,
    textual_exception_separated_from_closed_route: true,
    textual_exception_without_closed_route_blocked: textualWithoutClosedRoute,
    blocked_by_missing_canonical_route_candidate_created: textualWithoutClosedRoute,
    route_gap_candidate_created: textualWithoutClosedRoute,
    readiness_gap_record_candidate_created: textualWithoutClosedRoute,
    finding_code: "transformation_exception_route_unresolved",
    closed_variable_from_free_text_created: false,
    pf_olc_projection_without_closed_route: false,
    source_trace: source.source_trace ?? {},
    blocking_reasons: blockingReasons,
  };
}

export function evaluateB3ReceiverFeedbackGateLocally(
  caseId: string,
  source: RuntimeB3ReceiverFeedbackGateInput,
  index = 0,
): RuntimeB3ReceiverFeedbackGateCandidate {
  const routeMissing =
    source.receiver_feedback_route_missing === true || source.canonical_route_closed !== true;
  const blockingReasons: RuntimeCriticalGateBlockingReason[] = [];

  if (source.receiver_satisfaction_as_feedback_attempted === true) {
    blockingReasons.push("receiver_satisfaction_as_feedback_attempted");
  }
  if (source.ambiguous_comment_as_receiver_feedback_attempted === true) {
    blockingReasons.push("ambiguous_comment_as_receiver_feedback_attempted");
  }
  if (source.c09_closed_by_wrong_route_attempted === true) {
    blockingReasons.push("c09_closed_by_wrong_route_attempted");
  }
  if (source.receiver_feedback_object_real_creation_attempted === true) {
    blockingReasons.push("receiver_feedback_object_real_creation_attempted");
  }
  if (!hasSourceTrace(source.source_trace)) blockingReasons.push("missing_source_trace");

  return {
    b3_gate_candidate_ref:
      source.b3_gate_candidate_ref ?? `${caseId}:B3:${index + 1}:receiver_feedback_gate_candidate`,
    cr_b3_r9_c09_route: source.cr_b3_r9_c09_route ?? "CR-B3-R9 / C09",
    protected_object_hint:
      source.protected_object_hint ?? "ReceiverFeedbackObject / OperationalExceptionEvidence",
    receiver_feedback_exists: source.receiver_feedback_exists === true,
    receiver_feedback: source.receiver_feedback,
    receiver_feedback_gap_flag: source.receiver_feedback_gap_flag === true,
    receiver_feedback_route_missing: routeMissing,
    receiver_satisfaction_separated: true,
    delivery_failure_separated: true,
    satisfaction_general_as_feedback_blocked:
      source.receiver_satisfaction_as_feedback_attempted === true,
    ambiguous_comment_as_receiver_feedback_blocked:
      source.ambiguous_comment_as_receiver_feedback_attempted === true,
    c09_closed_by_wrong_route: false,
    route_missing_preserved_when_no_canonical_route: routeMissing,
    readiness_gap_record_candidate_created: routeMissing,
    finding_code: "receiver_feedback_route_missing",
    handoff_feedback_closed_without_canonical_route: false,
    receiver_feedback_object_real_created: false,
    source_trace: source.source_trace ?? {},
    blocking_reasons: blockingReasons,
  };
}

export function evaluateB7C20NonDiagnosticBoundaryGateLocally(
  caseId: string,
  source: RuntimeB7C20NonDiagnosticBoundaryGateInput,
  index = 0,
): RuntimeB7C20NonDiagnosticBoundaryGateCandidate {
  const elevationAttempted =
    source.moc_direct_attempted === true ||
    source.registry_direct_attempted === true ||
    source.ir_direct_attempted === true ||
    source.export_direct_attempted === true ||
    source.diagnosis_attempted === true ||
    source.root_cause_attempted === true ||
    source.monetization_attempted === true ||
    source.final_narrative_attempted === true ||
    source.vsm_ahe_final_attempted === true;
  const blockingReasons = getB7BlockingReasons(source);
  if (!hasSourceTrace(source.source_trace)) blockingReasons.push("missing_source_trace");

  return {
    b7_gate_candidate_ref:
      source.b7_gate_candidate_ref ??
      `${caseId}:B7:${index + 1}:non_diagnostic_boundary_gate_candidate`,
    b7_q39_boundary_supported: source.b7_q39_boundary_supported !== false,
    b7_q40_boundary_supported: source.b7_q40_boundary_supported !== false,
    c20_boundary_supported: source.c20_boundary_supported !== false,
    protected_object_hint: source.protected_object_hint ?? "PreclassificationRecord / NonDiagnosticBoundary",
    diagnostic_status_non_diagnostic: true,
    signal_status_preclassification_only: true,
    confidence_supported: source.confidence_supported !== false,
    uncertainty_supported: source.uncertainty_supported !== false,
    microconfirmation_refs_supported: source.microconfirmation_refs_supported !== false,
    moc_direct_blocked: true,
    registry_direct_blocked: true,
    ir_direct_blocked: true,
    export_direct_blocked: true,
    diagnosis_blocked: true,
    root_cause_blocked: true,
    monetization_blocked: true,
    final_narrative_blocked: true,
    vsm_ahe_final_blocked: true,
    readiness_gap_record_candidate_created_if_elevation_attempted: elevationAttempted,
    finding_code: "b7_non_diagnostic_boundary_violation",
    export_preview_created: false,
    source_trace: source.source_trace ?? {},
    blocking_reasons: blockingReasons,
  };
}

export function buildCriticalRouteGateResultCandidates(
  caseId: string,
  sources: RuntimeCriticalRouteGateResultInput[],
  gateEvaluationCandidates: RuntimeCriticalGateEvaluationCandidate[] = [],
): RuntimeCriticalRouteGateResultCandidate[] {
  const explicitCandidates = sources.map((source, index) =>
    createRouteGateResultCandidate(caseId, source, index),
  );
  if (explicitCandidates.length > 0) return explicitCandidates;

  return gateEvaluationCandidates.map((candidate, index) =>
    createRouteGateResultCandidate(
      caseId,
      {
        gate_family: candidate.gate_family,
        route_id: candidate.protected_route_id,
        route_status_before: "candidate_input",
        route_status_after_candidate: candidate.gate_outcome,
        protected_route_id: candidate.protected_route_id,
        protected_object_hint: candidate.protected_object_hint,
        evidence_sufficient: candidate.gate_outcome === "passed_candidate",
        canonical_route_closed: candidate.gate_outcome === "passed_candidate",
        route_missing: candidate.gate_outcome === "blocked_by_missing_canonical_route",
        gap_flag: candidate.gate_outcome !== "passed_candidate",
        manual_review_required: candidate.gate_outcome === "manual_review_required",
        finding_code: candidate.finding_code,
        source_trace: candidate.source_trace,
      },
      index,
    ),
  );
}

export function buildSemanticResolutionGateCandidates(
  caseId: string,
  sources: RuntimeSemanticResolutionGateSourceInput[],
): RuntimeSemanticResolutionGateCandidate[] {
  return sources.map((source, index) => {
    const blockingReasons = getSemanticGateBlockingReasons(source);
    const blocksProjection = source.blocks_projection === true;
    const projectionAttempted = source.accepted_structural_candidate_creation_attempted === true;

    return {
      semantic_gate_candidate_ref:
        source.semantic_gate_candidate_ref ??
        `${caseId}:${source.sem_code ?? "SEM"}:${index + 1}:semantic_resolution_gate_candidate`,
      runtime_semantic_gate_ref: source.runtime_semantic_gate_ref,
      sem_code: (source.sem_code ?? "") as RuntimeSemanticGateCode,
      target_term: source.target_term ?? "",
      ambiguity_type: (source.ambiguity_type ?? "") as RuntimeSemanticAmbiguityType,
      protected_object_hint: source.protected_object_hint,
      blocks_projection: blocksProjection,
      action: source.action,
      source_variable_refs: source.source_variable_refs ?? [],
      source_evidence_refs: source.source_evidence_refs ?? [],
      source_trace: source.source_trace ?? {},
      readiness_gap_record_candidate_created: blocksProjection,
      runtime_audit_candidate_ref: source.runtime_audit_candidate_ref,
      semantic_resolution_event_real_created: false,
      readiness_gap_record_real_created: false,
      runtime_audit_trail_real_created: false,
      accepted_structural_candidate_created: false,
      gate_candidate_allowed:
        blockingReasons.length === 0 && !(blocksProjection && projectionAttempted),
      blocking_reasons: blockingReasons,
    };
  });
}

export function evaluateSEM001StateAsClassLocally(
  caseId: string,
  source: RuntimeSEM001StateAsClassGateInput,
  index = 0,
): RuntimeSEM001StateAsClassGateCandidate {
  const detected = source.state_as_class_detected !== false;
  return {
    sem001_candidate_ref:
      source.sem001_candidate_ref ?? `${caseId}:SEM-001:${index + 1}:state_as_class_candidate`,
    target_term: source.target_term ?? "",
    source_variable_ref: source.source_variable_ref,
    source_trace: source.source_trace ?? {},
    state_as_class_detected: detected,
    moc_class_projection_blocked: detected,
    blocks_projection: detected,
    readiness_gap_record_candidate_created: detected,
    finding_code: "semantic_resolution_blocked",
    concept_candidate_accepted: false,
    semantic_resolution_event_real_created: false,
    blocking_reasons: getSpecificSemanticBlockingReasons(
      source,
      detected,
      "concept_candidate_accepted_despite_state_as_class",
      source.concept_candidate_accepted_attempted,
    ),
  };
}

export function evaluateSEM002AttributeAsClassLocally(
  caseId: string,
  source: RuntimeSEM002AttributeAsClassGateInput,
  index = 0,
): RuntimeSEM002AttributeAsClassGateCandidate {
  const detected = source.attribute_as_class_detected !== false;
  return {
    sem002_candidate_ref:
      source.sem002_candidate_ref ??
      `${caseId}:SEM-002:${index + 1}:attribute_as_class_candidate`,
    target_term: source.target_term ?? "",
    source_variable_ref: source.source_variable_ref,
    source_trace: source.source_trace ?? {},
    attribute_as_class_detected: detected,
    separate_class_projection_blocked: detected,
    blocks_projection: detected,
    readiness_gap_record_candidate_created: detected,
    finding_code: "semantic_resolution_blocked",
    moc_class_candidate_accepted: false,
    semantic_resolution_event_real_created: false,
    blocking_reasons: getSpecificSemanticBlockingReasons(
      source,
      detected,
      "moc_class_candidate_accepted_despite_attribute_as_class",
      source.moc_class_candidate_accepted_attempted,
    ),
  };
}

export function evaluateSEM003ProcessAsObjectLocally(
  caseId: string,
  source: RuntimeSEM003ProcessAsObjectGateInput,
  index = 0,
): RuntimeSEM003ProcessAsObjectGateCandidate {
  const detected = source.process_as_object_detected !== false;
  return {
    sem003_candidate_ref:
      source.sem003_candidate_ref ?? `${caseId}:SEM-003:${index + 1}:process_as_object_candidate`,
    target_term: source.target_term ?? "",
    source_variable_ref: source.source_variable_ref,
    source_trace: source.source_trace ?? {},
    process_as_object_detected: detected,
    object_projection_blocked: detected,
    blocks_projection: detected,
    readiness_gap_record_candidate_created: detected,
    finding_code: "semantic_resolution_blocked",
    object_state_candidate_accepted: false,
    semantic_resolution_event_real_created: false,
    blocking_reasons: getSpecificSemanticBlockingReasons(
      source,
      detected,
      "object_state_candidate_accepted_despite_process_as_object",
      source.object_state_candidate_accepted_attempted,
    ),
  };
}

export function evaluateSEM004FalseISAByTypeOfLocally(
  caseId: string,
  source: RuntimeSEM004FalseISAByTypeOfGateInput,
  index = 0,
): RuntimeSEM004FalseISAByTypeOfGateCandidate {
  const detected = source.false_isa_by_type_of_detected !== false;
  return {
    sem004_candidate_ref:
      source.sem004_candidate_ref ?? `${caseId}:SEM-004:${index + 1}:false_isa_candidate`,
    target_term: source.target_term ?? "",
    source_variable_ref: source.source_variable_ref,
    source_trace: source.source_trace ?? {},
    false_isa_by_type_of_detected: detected,
    isa_projection_blocked: detected,
    attribute_vs_specialization_resolution_required: detected,
    blocks_projection: detected,
    readiness_gap_record_candidate_created: detected,
    finding_code: "semantic_resolution_blocked",
    isa_candidate_accepted: false,
    semantic_resolution_event_real_created: false,
    blocking_reasons: getSpecificSemanticBlockingReasons(
      source,
      detected,
      "isa_candidate_accepted_despite_false_isa",
      source.isa_candidate_accepted_attempted,
    ),
  };
}

export function evaluateSEM005AliasOrDuplicateLocally(
  caseId: string,
  source: RuntimeSEM005AliasOrDuplicateGateInput,
  index = 0,
): RuntimeSEM005AliasOrDuplicateGateCandidate {
  const detected = source.alias_or_duplicate_detected !== false;
  return {
    sem005_candidate_ref:
      source.sem005_candidate_ref ??
      `${caseId}:SEM-005:${index + 1}:alias_duplicate_candidate`,
    target_term: source.target_term ?? "",
    alias_target_candidate: source.alias_target_candidate,
    source_trace: source.source_trace ?? {},
    alias_or_duplicate_detected: detected,
    alias_preserved_without_duplicate_class: detected,
    duplicate_class_blocked: detected,
    blocks_projection: detected,
    readiness_gap_record_candidate_created: detected,
    finding_code: "semantic_resolution_blocked",
    duplicate_class_created: false,
    semantic_resolution_event_real_created: false,
    blocking_reasons: getSpecificSemanticBlockingReasons(
      source,
      detected,
      "duplicate_class_created_from_alias",
      source.duplicate_class_created_attempted,
    ),
  };
}

export function evaluateSEM006RolePhaseEndConfusionLocally(
  caseId: string,
  source: RuntimeSEM006RolePhaseEndConfusionGateInput,
  index = 0,
): RuntimeSEM006RolePhaseEndConfusionGateCandidate {
  const detected = source.role_phase_end_confusion_detected !== false;
  return {
    sem006_candidate_ref:
      source.sem006_candidate_ref ?? `${caseId}:SEM-006:${index + 1}:role_phase_end_candidate`,
    target_term: source.target_term ?? "",
    source_variable_ref: source.source_variable_ref,
    source_trace: source.source_trace ?? {},
    role_phase_end_confusion_detected: detected,
    role_as_static_class_blocked: detected,
    phase_as_static_class_blocked: detected,
    end_as_static_class_blocked: detected,
    dynamic_resolution_required: detected,
    blocks_projection: detected,
    readiness_gap_record_candidate_created: detected,
    finding_code: "semantic_resolution_blocked",
    static_moc_candidate_accepted: false,
    semantic_resolution_event_real_created: false,
    blocking_reasons: getSpecificSemanticBlockingReasons(
      source,
      detected,
      "static_moc_candidate_accepted_despite_role_phase_end",
      source.static_moc_candidate_accepted_attempted,
    ),
  };
}

export function evaluateSEM007FusedMarsupialObjectLocally(
  caseId: string,
  source: RuntimeSEM007FusedMarsupialObjectGateInput,
  index = 0,
): RuntimeSEM007FusedMarsupialObjectGateCandidate {
  const fusedDetected = source.fused_object_detected !== false;
  const marsupialDetected = source.marsupial_object_detected !== false;
  const blocksProjection = fusedDetected || marsupialDetected;
  return {
    sem007_candidate_ref:
      source.sem007_candidate_ref ??
      `${caseId}:SEM-007:${index + 1}:fused_marsupial_candidate`,
    target_term: source.target_term ?? "",
    object_candidate_refs: source.object_candidate_refs ?? [],
    source_trace: source.source_trace ?? {},
    fused_object_detected: fusedDetected,
    marsupial_object_detected: marsupialDetected,
    fused_olc_blocked: blocksProjection,
    object_separation_required: blocksProjection,
    blocks_projection: blocksProjection,
    readiness_gap_record_candidate_created: blocksProjection,
    finding_code: "semantic_resolution_blocked",
    olc_fused_created: false,
    semantic_resolution_event_real_created: false,
    blocking_reasons: getSpecificSemanticBlockingReasons(
      source,
      blocksProjection,
      "fused_olc_created",
      source.olc_fused_created_attempted,
    ),
  };
}

export function buildProcessStateTimerGateCandidates(
  caseId: string,
  sources: RuntimeProcessStateTimerGateSourceInput[],
): RuntimeProcessStateTimerGateCandidate[] {
  return sources.map((source, index) => {
    const blockingReasons = getPSTGateBlockingReasons(source);
    const hasBlockingGap = hasPSTBlockingGap(source);
    return {
      pst_gate_candidate_ref:
        source.pst_gate_candidate_ref ??
        `${caseId}:${source.pst_code ?? "PST"}:${index + 1}:process_state_timer_gate_candidate`,
      runtime_pst_gate_ref: source.runtime_pst_gate_ref,
      pst_code: (source.pst_code ?? "") as RuntimePSTGateCode,
      process_state_candidate_ref: source.process_state_candidate_ref ?? "",
      awaited_event: source.awaited_event,
      release_condition: source.release_condition,
      timer_or_timeout_rule: source.timer_or_timeout_rule,
      timeout_state: source.timeout_state,
      resolver_owner: source.resolver_owner,
      exit_path: source.exit_path,
      deadlock_risk:
        source.deadlock_risk === true ||
        !hasText(source.release_condition) ||
        !hasText(source.resolver_owner),
      source_trace: source.source_trace ?? {},
      readiness_gap_record_candidate_created: hasBlockingGap,
      runtime_audit_candidate_ref: source.runtime_audit_candidate_ref,
      process_state_timer_event_real_created: false,
      readiness_gap_record_real_created: false,
      runtime_audit_trail_real_created: false,
      pf_projection_accepted: false,
      olc_transition_accepted: false,
      gate_candidate_allowed: blockingReasons.length === 0 && !hasBlockingGap,
      blocking_reasons: blockingReasons,
    };
  });
}

export function evaluatePST001WaitWithoutAwaitedEventLocally(
  caseId: string,
  source: RuntimePSTSpecificGateInput,
  index = 0,
): RuntimePST001WaitWithoutAwaitedEventCandidate {
  const awaitedEventPresent = hasText(source.awaited_event);
  const detected = !awaitedEventPresent;
  return {
    pst001_candidate_ref:
      source.candidate_ref ?? `${caseId}:PST-001:${index + 1}:wait_without_awaited_event_candidate`,
    process_state_candidate_ref: source.process_state_candidate_ref ?? "",
    wait_without_awaited_event_detected: detected,
    awaited_event_present: awaitedEventPresent,
    source_trace: source.source_trace ?? {},
    process_state_blocked: detected,
    readiness_gap_record_candidate_created: detected,
    finding_code: "process_state_without_timer_or_exit",
    pf_process_state_valid: false,
    process_state_timer_event_real_created: false,
    blocking_reasons: getPSTSpecificBlockingReasons(source, detected, "missing_awaited_event"),
  };
}

export function evaluatePST002MissingReleaseConditionLocally(
  caseId: string,
  source: RuntimePSTSpecificGateInput,
  index = 0,
): RuntimePST002MissingReleaseConditionCandidate {
  const releaseConditionPresent = hasText(source.release_condition);
  const detected = !releaseConditionPresent;
  return {
    pst002_candidate_ref:
      source.candidate_ref ?? `${caseId}:PST-002:${index + 1}:missing_release_condition_candidate`,
    process_state_candidate_ref: source.process_state_candidate_ref ?? "",
    missing_release_condition_detected: detected,
    release_condition_present: releaseConditionPresent,
    source_trace: source.source_trace ?? {},
    exit_blocked: detected,
    deadlock_risk: detected,
    readiness_gap_record_candidate_created: detected,
    state_closed: false,
    process_state_timer_event_real_created: false,
    blocking_reasons: getPSTSpecificBlockingReasons(source, detected, "missing_release_condition"),
  };
}

export function evaluatePST003MissingTimerOrTimeoutRuleLocally(
  caseId: string,
  source: RuntimePSTSpecificGateInput,
  index = 0,
): RuntimePST003MissingTimerOrTimeoutRuleCandidate {
  const timerPresent = hasText(source.timer_or_timeout_rule);
  const detected = !timerPresent;
  return {
    pst003_candidate_ref:
      source.candidate_ref ?? `${caseId}:PST-003:${index + 1}:missing_timer_or_timeout_candidate`,
    process_state_candidate_ref: source.process_state_candidate_ref ?? "",
    missing_timer_or_timeout_rule_detected: detected,
    timer_or_timeout_rule_present: timerPresent,
    source_trace: source.source_trace ?? {},
    strong_wait_without_timer_blocked: detected,
    readiness_gap_record_candidate_created: detected,
    process_state_valid: false,
    process_state_timer_event_real_created: false,
    blocking_reasons: getPSTSpecificBlockingReasons(source, detected, "missing_timer_or_timeout_rule"),
  };
}

export function evaluatePST004MissingTimeoutStateLocally(
  caseId: string,
  source: RuntimePSTSpecificGateInput,
  index = 0,
): RuntimePST004MissingTimeoutStateCandidate {
  const timeoutStatePresent = hasText(source.timeout_state);
  const detected = !timeoutStatePresent;
  return {
    pst004_candidate_ref:
      source.candidate_ref ?? `${caseId}:PST-004:${index + 1}:missing_timeout_state_candidate`,
    process_state_candidate_ref: source.process_state_candidate_ref ?? "",
    missing_timeout_state_detected: detected,
    timeout_state_present: timeoutStatePresent,
    source_trace: source.source_trace ?? {},
    olc_transition_blocked: detected,
    readiness_gap_record_candidate_created: detected,
    closed_causal_transition_created: false,
    process_state_timer_event_real_created: false,
    blocking_reasons: getPSTSpecificBlockingReasons(source, detected, "missing_timeout_state"),
  };
}

export function evaluatePST005MissingResolverOwnerLocally(
  caseId: string,
  source: RuntimePSTSpecificGateInput,
  index = 0,
): RuntimePST005MissingResolverOwnerCandidate {
  const resolverOwnerPresent = hasText(source.resolver_owner);
  const detected = !resolverOwnerPresent;
  return {
    pst005_candidate_ref:
      source.candidate_ref ?? `${caseId}:PST-005:${index + 1}:missing_resolver_owner_candidate`,
    process_state_candidate_ref: source.process_state_candidate_ref ?? "",
    missing_resolver_owner_detected: detected,
    resolver_owner_present: resolverOwnerPresent,
    source_trace: source.source_trace ?? {},
    deadlock_risk: detected,
    readiness_gap_record_candidate_created: detected,
    wait_closed_as_governed: false,
    process_state_timer_event_real_created: false,
    blocking_reasons: getPSTSpecificBlockingReasons(source, detected, "missing_resolver_owner"),
  };
}

export function evaluatePST006MissingExitPathLocally(
  caseId: string,
  source: RuntimePSTSpecificGateInput,
  index = 0,
): RuntimePST006MissingExitPathCandidate {
  const exitPathPresent = hasText(source.exit_path);
  const detected = !exitPathPresent;
  return {
    pst006_candidate_ref:
      source.candidate_ref ?? `${caseId}:PST-006:${index + 1}:missing_exit_path_candidate`,
    process_state_candidate_ref: source.process_state_candidate_ref ?? "",
    missing_exit_path_detected: detected,
    exit_path_present: exitPathPresent,
    source_trace: source.source_trace ?? {},
    incomplete_pf_blocked: detected,
    readiness_gap_record_candidate_created: detected,
    pf_process_state_valid: false,
    process_state_timer_event_real_created: false,
    blocking_reasons: getPSTSpecificBlockingReasons(source, detected, "missing_exit_path"),
  };
}

export function buildSemanticResolutionEventContractCandidates(
  caseId: string,
  sources: RuntimeSemanticResolutionEventContractInput[],
): RuntimeSemanticResolutionEventContractCandidate[] {
  return sources.map((source, index) => {
    const blockingReasons = getSemanticEventContractBlockingReasons(source);
    return {
      semantic_event_candidate_ref:
        source.semantic_event_candidate_ref ??
        `${caseId}:${source.gate_id ?? "semantic"}:${index + 1}:semantic_resolution_event_candidate`,
      semantic_resolution_event_real_created: false,
      run_id: source.run_id,
      gate_id: source.gate_id ?? "",
      target_term: source.target_term ?? "",
      ambiguity_type: source.ambiguity_type ?? "",
      outcome: source.outcome ?? "",
      action: source.action,
      blocks_projection: source.blocks_projection === true,
      protected_object_hint: source.protected_object_hint,
      source_variable_refs: source.source_variable_refs ?? [],
      source_evidence_refs: source.source_evidence_refs ?? [],
      source_trace: source.source_trace ?? {},
      finding_code: source.finding_code ?? "",
      projected_to_mba: false,
      accepted_structural_candidate_created: false,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildProcessStateTimerEventContractCandidates(
  caseId: string,
  sources: RuntimeProcessStateTimerEventContractInput[],
): RuntimeProcessStateTimerEventContractCandidate[] {
  return sources.map((source, index) => {
    const blockingReasons = getPSTEventContractBlockingReasons(source);
    const pfIncomplete = source.pf_incomplete === true || !hasText(source.exit_path);
    return {
      pst_event_candidate_ref:
        source.pst_event_candidate_ref ??
        `${caseId}:${source.gate_id ?? "pst"}:${index + 1}:process_state_timer_event_candidate`,
      process_state_timer_event_real_created: false,
      run_id: source.run_id,
      gate_id: source.gate_id ?? "",
      process_state_candidate_ref: source.process_state_candidate_ref ?? "",
      awaited_event: source.awaited_event,
      release_condition: source.release_condition,
      timer_rule: source.timer_rule,
      timeout_state: source.timeout_state,
      resolver_owner: source.resolver_owner,
      exit_path: source.exit_path,
      deadlock_risk: source.deadlock_risk === true,
      source_trace: source.source_trace ?? {},
      finding_code: source.finding_code ?? "",
      projected_to_mba: false,
      pf_incomplete: pfIncomplete,
      blocking_reasons: blockingReasons,
    };
  });
}

function createRouteGateResultCandidate(
  caseId: string,
  source: RuntimeCriticalRouteGateResultInput,
  index: number,
): RuntimeCriticalRouteGateResultCandidate {
  const blockingReasons: RuntimeCriticalGateBlockingReason[] = [];
  if (!source.protected_route_id) blockingReasons.push("missing_protected_route_id");
  if (!source.protected_object_hint) blockingReasons.push("missing_protected_object_hint");
  if (!source.finding_code) blockingReasons.push("missing_finding_code");
  if (!hasSourceTrace(source.source_trace)) blockingReasons.push("missing_source_trace");
  if (source.gate_result_real_creation_attempted === true) {
    blockingReasons.push("external_projection_attempted");
  }
  if (source.readiness_final_creation_attempted === true) {
    blockingReasons.push("readiness_final_creation_attempted");
  }

  return {
    critical_route_gate_result_candidate_ref:
      source.critical_route_gate_result_candidate_ref ??
      `${caseId}:${source.gate_family}:${index + 1}:critical_route_gate_result_candidate`,
    gate_family: source.gate_family,
    route_id: source.route_id ?? source.protected_route_id ?? "",
    route_status_before: source.route_status_before,
    route_status_after_candidate: source.route_status_after_candidate,
    protected_route_id: source.protected_route_id ?? "",
    protected_object_hint: source.protected_object_hint ?? "",
    evidence_sufficient: source.evidence_sufficient === true,
    canonical_route_closed: source.canonical_route_closed === true,
    route_missing: source.route_missing === true,
    gap_flag: source.gap_flag === true,
    gap_type: source.gap_type,
    manual_review_required: source.manual_review_required === true,
    reentry_target_candidate: source.reentry_target_candidate,
    finding_code: source.finding_code ?? "",
    source_trace: source.source_trace ?? {},
    gate_result_real_created: false,
    readiness_final_created: false,
    phase10_started: false,
    blocking_reasons: blockingReasons,
  };
}

export function buildReadinessGapRecordCandidates(
  caseId: string,
  sources: RuntimeReadinessGapRecordInput[],
): RuntimeReadinessGapRecordCandidate[] {
  return sources.map((source, index) => {
    const blockingReasons = getReadinessGapBlockingReasons(source);
    return {
      readiness_gap_candidate_ref:
        source.readiness_gap_candidate_ref ?? `${caseId}:readiness_gap:${index + 1}:candidate`,
      readiness_gap_record_real_created: false,
      run_id: source.run_id,
      gap_type: source.gap_type ?? "",
      affected_route: source.affected_route,
      affected_quadrant: source.affected_quadrant,
      affected_gate: source.affected_gate ?? "",
      severity: source.severity,
      reentry_target: source.reentry_target,
      manual_review_required: source.manual_review_required === true,
      source_gate_candidate_ref: source.source_gate_candidate_ref ?? "",
      source_trace: source.source_trace ?? {},
      gap_reason: source.gap_reason,
      finding_code: source.finding_code ?? "",
      summary_ready: true,
      projected_to_mba: false,
      readiness_final_created: false,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildGateAuditTrailCandidates(
  caseId: string,
  sources: RuntimeGateAuditTrailInput[],
): RuntimeGateAuditTrailCandidate[] {
  return sources.map((source, index) => {
    const blockingReasons = getGateAuditBlockingReasons(source);
    return {
      runtime_audit_candidate_ref:
        source.runtime_audit_candidate_ref ?? `${caseId}:gate_audit:${index + 1}:candidate`,
      runtime_audit_trail_real_created: false,
      audit_action: isGateAuditAction(source.audit_action)
        ? source.audit_action
        : "gate_evaluation_started",
      run_id: source.run_id,
      gate_id: source.gate_id,
      source_gate_candidate_ref: source.source_gate_candidate_ref,
      source_gap_candidate_ref: source.source_gap_candidate_ref,
      source_trace: source.source_trace ?? {},
      audit_reason: source.audit_reason ?? "",
      created_at_preview: source.created_at_preview,
      supabase_touched: false,
      sql_executed: false,
      endpoint_created: false,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildGateOutcomeReadinessBoundaries(
  caseId: string,
  sources: RuntimeGateOutcomeReadinessBoundaryInput[],
): RuntimeGateOutcomeReadinessBoundary[] {
  return sources.map((source, index) => {
    const blockingReasons = getGateOutcomeReadinessBlockingReasons(source);
    return {
      readiness_input_candidate_ref:
        source.readiness_input_candidate_ref ?? `${caseId}:readiness_input:${index + 1}:candidate`,
      source_gate_result_candidate_ref: source.source_gate_result_candidate_ref ?? "",
      source_readiness_gap_candidate_refs: source.source_readiness_gap_candidate_refs ?? [],
      manual_review_required: source.manual_review_required === true,
      reentry_required_candidate: source.reentry_required_candidate === true,
      carry_forward_gap_refs: source.carry_forward_gap_refs ?? [],
      blocked_by_missing_route: source.blocked_by_missing_route === true,
      blocked_by_semantic_gate: source.blocked_by_semantic_gate === true,
      blocked_by_pst_gate: source.blocked_by_pst_gate === true,
      readiness_engine_executed: false,
      readiness_decision_record_real_created: false,
      ready_created: false,
      ready_with_flags_created: false,
      blocked_final_created: false,
      export_preview_created: false,
      phase10_started: false,
      boundary_passed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildGateObjectInventoryBoundaries(
  caseId: string,
  sources: RuntimeGateObjectInventoryBoundaryInput[],
): RuntimeGateObjectInventoryBoundary[] {
  return sources.map((source, index) => {
    const blockingReasons = getObjectInventoryBoundaryBlockingReasons(source);
    return {
      object_inventory_boundary_candidate_ref:
        source.object_inventory_boundary_candidate_ref ??
        `${caseId}:object_inventory_boundary:${index + 1}:candidate`,
      gate_id: source.gate_id,
      protected_object_hint: source.protected_object_hint ?? "",
      future_object_family: source.future_object_family ?? "",
      object_binding_status: source.object_binding_status ?? "pending_candidate",
      runtime_object_binding_ref: source.runtime_object_binding_ref,
      object_inventory_created: false,
      eve_object_definition_created: false,
      runtime_object_binding_real_created: false,
      object_materialization_event_created: false,
      live_object_materialized: false,
      f5c_real_opened: false,
      object_boundary_passed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildGateControlPlaneBoundaries(
  caseId: string,
  sources: RuntimeGateControlPlaneBoundaryInput[],
): RuntimeGateControlPlaneBoundary[] {
  return sources.map((source, index) => {
    const blockingReasons = getControlPlaneBoundaryBlockingReasons(source);
    return {
      control_plane_boundary_candidate_ref:
        source.control_plane_boundary_candidate_ref ??
        `${caseId}:control_plane_boundary:${index + 1}:candidate`,
      finding_code: source.finding_code ?? "",
      summary_ready: true,
      projected_to_mba: false,
      mba_event_ledger_written: false,
      mba_transition_findings_written: false,
      mba_compliance_reports_written: false,
      outbox_real_created: false,
      handoff_boundary_real_created: false,
      review_control_real_created: false,
      parallel_production_started: false,
      source_trace: source.source_trace ?? {},
      control_plane_boundary_passed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildGatePersistenceBoundaries(
  caseId: string,
  sources: RuntimeGatePersistenceBoundaryInput[],
): RuntimeGatePersistenceBoundary[] {
  return sources.map((source, index) => {
    const blockingReasons = getPersistenceBoundaryBlockingReasons(source);
    return {
      persistence_boundary_candidate_ref:
        source.persistence_boundary_candidate_ref ??
        `${caseId}:persistence_boundary:${index + 1}:candidate`,
      local_gate_evaluation_candidate_mode: true,
      local_readiness_gap_record_candidate_mode: true,
      local_semantic_resolution_event_candidate_mode: true,
      local_process_state_timer_event_candidate_mode: true,
      local_runtime_audit_trail_candidate_mode: true,
      db_write_authorized: false,
      gate_result_real_created: false,
      readiness_gap_record_real_created: false,
      semantic_resolution_event_real_created: false,
      process_state_timer_event_real_created: false,
      runtime_audit_trail_real_created: false,
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
      persistence_boundary_passed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

function resolveStatus(
  gates: RuntimeCriticalGateEvaluationCandidate[],
  b0Candidates: RuntimeB0SemanticEntryGateCandidate[],
  b2Candidates: RuntimeB2TransformationExceptionGateCandidate[],
  b3Candidates: RuntimeB3ReceiverFeedbackGateCandidate[],
  b7Candidates: RuntimeB7C20NonDiagnosticBoundaryGateCandidate[],
  results: RuntimeCriticalRouteGateResultCandidate[],
): RuntimeCriticalGateStatus {
  const reasons = [
    ...gates.flatMap((candidate) => candidate.blocking_reasons),
    ...b0Candidates.flatMap((candidate) => candidate.blocking_reasons),
    ...b2Candidates.flatMap((candidate) => candidate.blocking_reasons),
    ...b3Candidates.flatMap((candidate) => candidate.blocking_reasons),
    ...b7Candidates.flatMap((candidate) => candidate.blocking_reasons),
    ...results.flatMap((candidate) => candidate.blocking_reasons),
  ];

  if (reasons.includes("readiness_final_creation_attempted")) {
    return "blocked_readiness_final_creation_attempt";
  }
  if (
    reasons.includes("b7_diagnostic_projection_attempted") ||
    reasons.includes("b7_registry_projection_attempted") ||
    reasons.includes("b7_ir_projection_attempted") ||
    reasons.includes("b7_export_projection_attempted")
  ) {
    return "blocked_b7_projection_attempt";
  }
  if (
    reasons.includes("external_projection_attempted") ||
    reasons.includes("scene_canonical_record_real_creation_attempted") ||
    reasons.includes("receiver_feedback_object_real_creation_attempted")
  ) {
    return "blocked_external_projection_attempt";
  }
  if (reasons.includes("missing_source_trace")) return "blocked_missing_source_trace";
  if (results.length > 0) return "critical_route_gate_result_candidate_created";
  if (b7Candidates.length > 0) return "b7_c20_non_diagnostic_gate_candidate_created";
  if (b3Candidates.length > 0) return "b3_receiver_feedback_gate_candidate_created";
  if (b2Candidates.length > 0) return "b2_transformation_exception_gate_candidate_created";
  if (b0Candidates.length > 0) return "b0_semantic_entry_gate_candidate_created";
  return "critical_gate_framework_candidate_created";
}

function resolveSemanticStatus(
  semanticCandidates: RuntimeSemanticResolutionGateCandidate[],
  sem001Candidates: RuntimeSEM001StateAsClassGateCandidate[],
  sem002Candidates: RuntimeSEM002AttributeAsClassGateCandidate[],
  sem003Candidates: RuntimeSEM003ProcessAsObjectGateCandidate[],
  sem004Candidates: RuntimeSEM004FalseISAByTypeOfGateCandidate[],
  sem005Candidates: RuntimeSEM005AliasOrDuplicateGateCandidate[],
  sem006Candidates: RuntimeSEM006RolePhaseEndConfusionGateCandidate[],
  sem007Candidates: RuntimeSEM007FusedMarsupialObjectGateCandidate[],
): RuntimeSemanticGateStatus {
  const reasons = [
    ...semanticCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...sem001Candidates.flatMap((candidate) => candidate.blocking_reasons),
    ...sem002Candidates.flatMap((candidate) => candidate.blocking_reasons),
    ...sem003Candidates.flatMap((candidate) => candidate.blocking_reasons),
    ...sem004Candidates.flatMap((candidate) => candidate.blocking_reasons),
    ...sem005Candidates.flatMap((candidate) => candidate.blocking_reasons),
    ...sem006Candidates.flatMap((candidate) => candidate.blocking_reasons),
    ...sem007Candidates.flatMap((candidate) => candidate.blocking_reasons),
  ];

  if (reasons.includes("semantic_resolution_event_real_creation_attempted")) {
    return "blocked_semantic_resolution_event_real_creation_attempt";
  }
  if (
    reasons.includes("projection_attempted_despite_blocks_projection") ||
    reasons.includes("concept_candidate_accepted_despite_state_as_class") ||
    reasons.includes("moc_class_candidate_accepted_despite_attribute_as_class") ||
    reasons.includes("object_state_candidate_accepted_despite_process_as_object") ||
    reasons.includes("isa_candidate_accepted_despite_false_isa") ||
    reasons.includes("duplicate_class_created_from_alias") ||
    reasons.includes("static_moc_candidate_accepted_despite_role_phase_end") ||
    reasons.includes("fused_olc_created")
  ) {
    return "blocked_projection_despite_semantic_gate";
  }
  if (
    reasons.includes("object_inventory_creation_attempted") ||
    reasons.includes("mba_projection_attempted") ||
    reasons.includes("scene_projection_attempted") ||
    reasons.includes("export_projection_attempted")
  ) {
    return "blocked_structural_projection_attempt";
  }
  if (reasons.includes("missing_source_trace")) return "blocked_missing_source_trace";
  if (sem007Candidates.length > 0) return "sem007_fused_marsupial_candidate_created";
  if (sem006Candidates.length > 0) return "sem006_role_phase_end_candidate_created";
  if (sem005Candidates.length > 0) return "sem005_alias_duplicate_candidate_created";
  if (sem004Candidates.length > 0) return "sem004_false_isa_candidate_created";
  if (sem003Candidates.length > 0) return "sem003_process_as_object_candidate_created";
  if (sem002Candidates.length > 0) return "sem002_attribute_as_class_candidate_created";
  if (sem001Candidates.length > 0) return "sem001_state_as_class_candidate_created";
  return "semantic_resolution_gate_candidate_created";
}

function resolvePSTStatus(
  pstGateCandidates: RuntimeProcessStateTimerGateCandidate[],
  pst001Candidates: RuntimePST001WaitWithoutAwaitedEventCandidate[],
  pst002Candidates: RuntimePST002MissingReleaseConditionCandidate[],
  pst003Candidates: RuntimePST003MissingTimerOrTimeoutRuleCandidate[],
  pst004Candidates: RuntimePST004MissingTimeoutStateCandidate[],
  pst005Candidates: RuntimePST005MissingResolverOwnerCandidate[],
  pst006Candidates: RuntimePST006MissingExitPathCandidate[],
  semanticEventCandidates: RuntimeSemanticResolutionEventContractCandidate[],
  pstEventCandidates: RuntimeProcessStateTimerEventContractCandidate[],
): RuntimePSTGateStatus {
  const reasons = [
    ...pstGateCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...pst001Candidates.flatMap((candidate) => candidate.blocking_reasons),
    ...pst002Candidates.flatMap((candidate) => candidate.blocking_reasons),
    ...pst003Candidates.flatMap((candidate) => candidate.blocking_reasons),
    ...pst004Candidates.flatMap((candidate) => candidate.blocking_reasons),
    ...pst005Candidates.flatMap((candidate) => candidate.blocking_reasons),
    ...pst006Candidates.flatMap((candidate) => candidate.blocking_reasons),
    ...semanticEventCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...pstEventCandidates.flatMap((candidate) => candidate.blocking_reasons),
  ];

  if (reasons.includes("process_state_timer_event_real_creation_attempted")) {
    return "blocked_process_state_timer_event_real_creation_attempt";
  }
  if (reasons.includes("missing_source_trace")) return "blocked_missing_source_trace";
  if (reasons.includes("olc_transition_attempted_without_timeout_state")) {
    return "blocked_olc_transition_without_timeout_state";
  }
  if (reasons.includes("pf_projection_attempted_despite_block")) {
    return "blocked_incomplete_pf_projection_attempt";
  }
  if (reasons.includes("invalid_process_state_accepted")) {
    return "blocked_invalid_process_state_accepted";
  }
  if (pstEventCandidates.length > 0) return "process_state_timer_event_contract_candidate_created";
  if (semanticEventCandidates.length > 0) return "semantic_resolution_event_contract_candidate_created";
  if (pst006Candidates.length > 0) return "pst006_missing_exit_path_candidate_created";
  if (pst005Candidates.length > 0) return "pst005_missing_resolver_owner_candidate_created";
  if (pst004Candidates.length > 0) return "pst004_missing_timeout_state_candidate_created";
  if (pst003Candidates.length > 0) return "pst003_missing_timer_or_timeout_candidate_created";
  if (pst002Candidates.length > 0) return "pst002_missing_release_condition_candidate_created";
  if (pst001Candidates.length > 0) return "pst001_wait_without_awaited_event_candidate_created";
  return "process_state_timer_gate_candidate_created";
}

function resolveGapAuditBoundaryStatus(
  gapCandidates: RuntimeReadinessGapRecordCandidate[],
  auditCandidates: RuntimeGateAuditTrailCandidate[],
  readinessBoundaries: RuntimeGateOutcomeReadinessBoundary[],
  objectBoundaries: RuntimeGateObjectInventoryBoundary[],
  controlPlaneBoundaries: RuntimeGateControlPlaneBoundary[],
  persistenceBoundaries: RuntimeGatePersistenceBoundary[],
): RuntimeGapAuditBoundaryStatus {
  const reasons = [
    ...gapCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...auditCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...readinessBoundaries.flatMap((candidate) => candidate.blocking_reasons),
    ...objectBoundaries.flatMap((candidate) => candidate.blocking_reasons),
    ...controlPlaneBoundaries.flatMap((candidate) => candidate.blocking_reasons),
    ...persistenceBoundaries.flatMap((candidate) => candidate.blocking_reasons),
  ];

  if (
    reasons.includes("readiness_gap_record_real_creation_attempted") ||
    reasons.includes("readiness_decision_record_real_creation_attempted") ||
    reasons.includes("readiness_engine_execution_attempted") ||
    reasons.includes("ready_creation_attempted") ||
    reasons.includes("ready_with_flags_creation_attempted") ||
    reasons.includes("blocked_final_creation_attempted")
  ) {
    return "blocked_readiness_real_creation_attempt";
  }
  if (
    reasons.includes("object_inventory_real_creation_attempted") ||
    reasons.includes("eve_object_definition_creation_attempted") ||
    reasons.includes("runtime_object_binding_real_creation_attempted") ||
    reasons.includes("object_materialization_event_creation_attempted") ||
    reasons.includes("live_object_materialization_attempted") ||
    reasons.includes("f5c_real_open_attempted")
  ) {
    return "blocked_object_inventory_real_creation_attempt";
  }
  if (
    reasons.includes("control_plane_write_attempted") ||
    reasons.includes("mba_event_ledger_write_attempted") ||
    reasons.includes("mba_transition_findings_write_attempted") ||
    reasons.includes("mba_compliance_reports_write_attempted") ||
    reasons.includes("outbox_real_creation_attempted") ||
    reasons.includes("handoff_boundary_real_creation_attempted") ||
    reasons.includes("review_control_real_creation_attempted") ||
    reasons.includes("parallel_production_start_attempted") ||
    reasons.includes("mba_write_attempted") ||
    reasons.includes("parallel_production_runtime_artifacts_write_attempted")
  ) {
    return "blocked_control_plane_write_attempt";
  }
  if (
    reasons.includes("db_write_attempted") ||
    reasons.includes("gate_result_real_creation_attempted") ||
    reasons.includes("semantic_resolution_event_real_creation_attempted") ||
    reasons.includes("process_state_timer_event_real_creation_attempted") ||
    reasons.includes("runtime_audit_trail_real_creation_attempted") ||
    reasons.includes("supabase_touch_attempted") ||
    reasons.includes("sql_execution_attempted") ||
    reasons.includes("endpoint_creation_attempted") ||
    reasons.includes("service_role_use_attempted") ||
    reasons.includes("service_role_client_use_attempted") ||
    reasons.includes("scene_write_attempted") ||
    reasons.includes("export_preview_creation_attempted") ||
    reasons.includes("runtime_40_20_start_attempted") ||
    reasons.includes("phase10_start_attempted")
  ) {
    return "blocked_gate_persistence_boundary_violation";
  }
  if (reasons.includes("missing_source_trace")) return "blocked_missing_source_trace";
  if (persistenceBoundaries.length > 0) return "persistence_boundary_candidate_created";
  if (controlPlaneBoundaries.length > 0) return "control_plane_boundary_candidate_created";
  if (objectBoundaries.length > 0) return "object_inventory_boundary_candidate_created";
  if (readinessBoundaries.length > 0) return "gate_outcome_readiness_boundary_candidate_created";
  if (auditCandidates.length > 0) return "runtime_audit_trail_candidate_created";
  return "readiness_gap_record_candidate_created";
}

function getReadinessGapBlockingReasons(
  source: RuntimeReadinessGapRecordInput,
): RuntimeGapAuditBoundaryBlockingReason[] {
  const reasons: RuntimeGapAuditBoundaryBlockingReason[] = [];
  if (!hasText(source.gap_type)) reasons.push("missing_gap_type");
  if (!hasText(source.affected_gate)) reasons.push("missing_affected_gate");
  if (!hasText(source.source_gate_candidate_ref)) {
    reasons.push("missing_source_gate_candidate_ref");
  }
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (!hasText(source.finding_code)) reasons.push("missing_finding_code");
  if (source.readiness_gap_record_real_creation_attempted === true) {
    reasons.push("readiness_gap_record_real_creation_attempted");
  }
  if (source.readiness_final_creation_attempted === true) {
    reasons.push("ready_creation_attempted");
  }
  if (source.mba_projection_attempted === true) reasons.push("mba_write_attempted");
  return reasons;
}

function getGateAuditBlockingReasons(
  source: RuntimeGateAuditTrailInput,
): RuntimeGapAuditBoundaryBlockingReason[] {
  const reasons: RuntimeGapAuditBoundaryBlockingReason[] = [];
  if (!hasText(source.audit_action)) reasons.push("missing_audit_action");
  if (hasText(source.audit_action) && !isGateAuditAction(source.audit_action)) {
    reasons.push("unsupported_audit_action");
  }
  if (!hasText(source.audit_reason)) reasons.push("missing_audit_reason");
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (source.runtime_audit_trail_real_creation_attempted === true) {
    reasons.push("runtime_audit_trail_real_creation_attempted");
  }
  if (source.supabase_touch_attempted === true) reasons.push("supabase_touch_attempted");
  if (source.sql_execution_attempted === true) reasons.push("sql_execution_attempted");
  if (source.endpoint_creation_attempted === true) reasons.push("endpoint_creation_attempted");
  return reasons;
}

function getGateOutcomeReadinessBlockingReasons(
  source: RuntimeGateOutcomeReadinessBoundaryInput,
): RuntimeGapAuditBoundaryBlockingReason[] {
  const reasons: RuntimeGapAuditBoundaryBlockingReason[] = [];
  if (!hasText(source.source_gate_result_candidate_ref)) {
    reasons.push("missing_source_gate_result_candidate_ref");
  }
  if (source.readiness_engine_execution_attempted === true) {
    reasons.push("readiness_engine_execution_attempted");
  }
  if (source.readiness_decision_record_real_creation_attempted === true) {
    reasons.push("readiness_decision_record_real_creation_attempted");
  }
  if (source.ready_creation_attempted === true) reasons.push("ready_creation_attempted");
  if (source.ready_with_flags_creation_attempted === true) {
    reasons.push("ready_with_flags_creation_attempted");
  }
  if (source.blocked_final_creation_attempted === true) {
    reasons.push("blocked_final_creation_attempted");
  }
  if (source.export_preview_creation_attempted === true) {
    reasons.push("export_preview_creation_attempted");
  }
  if (source.phase10_start_attempted === true) reasons.push("phase10_start_attempted");
  return reasons;
}

function getObjectInventoryBoundaryBlockingReasons(
  source: RuntimeGateObjectInventoryBoundaryInput,
): RuntimeGapAuditBoundaryBlockingReason[] {
  const reasons: RuntimeGapAuditBoundaryBlockingReason[] = [];
  if (!hasText(source.protected_object_hint)) reasons.push("missing_protected_object_hint");
  if (!hasText(source.future_object_family)) reasons.push("missing_future_object_family");
  if (source.object_inventory_creation_attempted === true) {
    reasons.push("object_inventory_real_creation_attempted");
  }
  if (source.eve_object_definition_creation_attempted === true) {
    reasons.push("eve_object_definition_creation_attempted");
  }
  if (source.runtime_object_binding_real_creation_attempted === true) {
    reasons.push("runtime_object_binding_real_creation_attempted");
  }
  if (source.object_materialization_event_creation_attempted === true) {
    reasons.push("object_materialization_event_creation_attempted");
  }
  if (source.live_object_materialization_attempted === true) {
    reasons.push("live_object_materialization_attempted");
  }
  if (source.f5c_real_open_attempted === true) reasons.push("f5c_real_open_attempted");
  return reasons;
}

function getControlPlaneBoundaryBlockingReasons(
  source: RuntimeGateControlPlaneBoundaryInput,
): RuntimeGapAuditBoundaryBlockingReason[] {
  const reasons: RuntimeGapAuditBoundaryBlockingReason[] = [];
  if (!hasText(source.finding_code)) reasons.push("missing_finding_code");
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (source.control_plane_write_attempted === true) reasons.push("control_plane_write_attempted");
  if (source.mba_event_ledger_write_attempted === true) {
    reasons.push("mba_event_ledger_write_attempted");
  }
  if (source.mba_transition_findings_write_attempted === true) {
    reasons.push("mba_transition_findings_write_attempted");
  }
  if (source.mba_compliance_reports_write_attempted === true) {
    reasons.push("mba_compliance_reports_write_attempted");
  }
  if (source.outbox_real_creation_attempted === true) reasons.push("outbox_real_creation_attempted");
  if (source.handoff_boundary_real_creation_attempted === true) {
    reasons.push("handoff_boundary_real_creation_attempted");
  }
  if (source.review_control_real_creation_attempted === true) {
    reasons.push("review_control_real_creation_attempted");
  }
  if (source.parallel_production_start_attempted === true) {
    reasons.push("parallel_production_start_attempted");
  }
  return reasons;
}

function getPersistenceBoundaryBlockingReasons(
  source: RuntimeGatePersistenceBoundaryInput,
): RuntimeGapAuditBoundaryBlockingReason[] {
  const reasons: RuntimeGapAuditBoundaryBlockingReason[] = [];
  if (source.db_write_attempted === true) reasons.push("db_write_attempted");
  if (source.gate_result_real_creation_attempted === true) {
    reasons.push("gate_result_real_creation_attempted");
  }
  if (source.readiness_gap_record_real_creation_attempted === true) {
    reasons.push("readiness_gap_record_real_creation_attempted");
  }
  if (source.semantic_resolution_event_real_creation_attempted === true) {
    reasons.push("semantic_resolution_event_real_creation_attempted");
  }
  if (source.process_state_timer_event_real_creation_attempted === true) {
    reasons.push("process_state_timer_event_real_creation_attempted");
  }
  if (source.runtime_audit_trail_real_creation_attempted === true) {
    reasons.push("runtime_audit_trail_real_creation_attempted");
  }
  if (source.supabase_touch_attempted === true) reasons.push("supabase_touch_attempted");
  if (source.sql_execution_attempted === true) reasons.push("sql_execution_attempted");
  if (source.endpoint_creation_attempted === true) reasons.push("endpoint_creation_attempted");
  if (source.service_role_use_attempted === true) reasons.push("service_role_use_attempted");
  if (source.service_role_client_use_attempted === true) {
    reasons.push("service_role_client_use_attempted");
  }
  if (source.scene_write_attempted === true) reasons.push("scene_write_attempted");
  if (source.mba_write_attempted === true) reasons.push("mba_write_attempted");
  if (source.parallel_production_runtime_artifacts_write_attempted === true) {
    reasons.push("parallel_production_runtime_artifacts_write_attempted");
  }
  if (source.export_preview_creation_attempted === true) {
    reasons.push("export_preview_creation_attempted");
  }
  if (source.runtime_40_20_start_attempted === true) {
    reasons.push("runtime_40_20_start_attempted");
  }
  return reasons;
}

function isGateAuditAction(value: unknown): value is RuntimeGateAuditAction {
  return (
    value === "gate_evaluation_started" ||
    value === "critical_route_gate_evaluated" ||
    value === "semantic_resolution_event_candidate_created" ||
    value === "process_state_timer_event_candidate_created" ||
    value === "readiness_gap_candidate_created" ||
    value === "gate_blocked_projection" ||
    value === "gate_passed_candidate" ||
    value === "manual_review_required" ||
    value === "reentry_required_candidate" ||
    value === "readiness_boundary_blocked" ||
    value === "object_inventory_boundary_blocked" ||
    value === "control_plane_projection_blocked" ||
    value === "persistence_boundary_blocked"
  );
}

function getPSTGateBlockingReasons(
  source: RuntimeProcessStateTimerGateSourceInput,
): RuntimePSTGateBlockingReason[] {
  const reasons: RuntimePSTGateBlockingReason[] = [];
  if (!source.pst_code) reasons.push("missing_pst_code");
  if (!hasText(source.process_state_candidate_ref)) {
    reasons.push("missing_process_state_candidate_ref");
  }
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (!hasText(source.awaited_event)) reasons.push("missing_awaited_event");
  if (!hasText(source.release_condition)) reasons.push("missing_release_condition");
  if (!hasText(source.timer_or_timeout_rule)) reasons.push("missing_timer_or_timeout_rule");
  if (!hasText(source.timeout_state)) reasons.push("missing_timeout_state");
  if (!hasText(source.resolver_owner)) reasons.push("missing_resolver_owner");
  if (!hasText(source.exit_path)) reasons.push("missing_exit_path");
  appendPSTAttemptBlockers(source, reasons);
  return reasons;
}

function getPSTSpecificBlockingReasons(
  source: RuntimePSTSpecificGateInput,
  detected: boolean,
  missingReason: RuntimePSTGateBlockingReason,
): RuntimePSTGateBlockingReason[] {
  const reasons: RuntimePSTGateBlockingReason[] = [];
  if (!hasText(source.process_state_candidate_ref)) {
    reasons.push("missing_process_state_candidate_ref");
  }
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (detected) reasons.push(missingReason);
  if (source.process_state_timer_event_real_creation_attempted === true) {
    reasons.push("process_state_timer_event_real_creation_attempted");
  }
  if (source.invalid_process_state_accepted_attempted === true) {
    reasons.push("invalid_process_state_accepted");
  }
  if (source.pf_projection_attempted_despite_block === true) {
    reasons.push("pf_projection_attempted_despite_block");
  }
  if (source.olc_transition_attempted_without_timeout_state === true) {
    reasons.push("olc_transition_attempted_without_timeout_state");
  }
  return reasons;
}

function getSemanticEventContractBlockingReasons(
  source: RuntimeSemanticResolutionEventContractInput,
): RuntimePSTGateBlockingReason[] {
  const reasons: RuntimePSTGateBlockingReason[] = [];
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (source.semantic_resolution_event_real_creation_attempted === true) {
    reasons.push("semantic_resolution_event_real_creation_attempted");
  }
  if (source.blocks_projection === true && source.accepted_structural_candidate_creation_attempted === true) {
    reasons.push("invalid_process_state_accepted");
  }
  if (source.mba_projection_attempted === true) reasons.push("mba_projection_attempted");
  return reasons;
}

function getPSTEventContractBlockingReasons(
  source: RuntimeProcessStateTimerEventContractInput,
): RuntimePSTGateBlockingReason[] {
  const reasons: RuntimePSTGateBlockingReason[] = [];
  if (!hasText(source.process_state_candidate_ref)) {
    reasons.push("missing_process_state_candidate_ref");
  }
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (source.process_state_timer_event_real_creation_attempted === true) {
    reasons.push("process_state_timer_event_real_creation_attempted");
  }
  if (source.pf_incomplete === true || !hasText(source.exit_path)) {
    reasons.push("pf_projection_attempted_despite_block");
  }
  if (!hasText(source.timeout_state)) {
    reasons.push("olc_transition_attempted_without_timeout_state");
  }
  if (source.mba_projection_attempted === true) reasons.push("mba_projection_attempted");
  return reasons;
}

function appendPSTAttemptBlockers(
  source: RuntimeProcessStateTimerGateSourceInput,
  reasons: RuntimePSTGateBlockingReason[],
): void {
  if (source.invalid_process_state_accepted_attempted === true) {
    reasons.push("invalid_process_state_accepted");
  }
  if (source.pf_projection_attempted_despite_block === true) {
    reasons.push("pf_projection_attempted_despite_block");
  }
  if (source.olc_transition_attempted_without_timeout_state === true) {
    reasons.push("olc_transition_attempted_without_timeout_state");
  }
  if (source.process_state_timer_event_real_creation_attempted === true) {
    reasons.push("process_state_timer_event_real_creation_attempted");
  }
  if (source.readiness_gap_record_real_creation_attempted === true) {
    reasons.push("readiness_gap_record_real_creation_attempted");
  }
  if (source.runtime_audit_trail_real_creation_attempted === true) {
    reasons.push("runtime_audit_trail_real_creation_attempted");
  }
  if (source.mba_projection_attempted === true) reasons.push("mba_projection_attempted");
  if (source.scene_projection_attempted === true) reasons.push("scene_projection_attempted");
  if (source.export_projection_attempted === true) reasons.push("export_projection_attempted");
}

function hasPSTBlockingGap(source: RuntimeProcessStateTimerGateSourceInput): boolean {
  return (
    !hasText(source.awaited_event) ||
    !hasText(source.release_condition) ||
    !hasText(source.timer_or_timeout_rule) ||
    !hasText(source.timeout_state) ||
    !hasText(source.resolver_owner) ||
    !hasText(source.exit_path)
  );
}

function getSemanticGateBlockingReasons(
  source: RuntimeSemanticResolutionGateSourceInput,
): RuntimeSemanticGateBlockingReason[] {
  const reasons: RuntimeSemanticGateBlockingReason[] = [];
  if (!source.sem_code) reasons.push("missing_sem_code");
  if (!hasText(source.target_term)) reasons.push("missing_target_term");
  if (!source.ambiguity_type) reasons.push("missing_ambiguity_type");
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (
    source.blocks_projection === true &&
    source.accepted_structural_candidate_creation_attempted === true
  ) {
    reasons.push("projection_attempted_despite_blocks_projection");
  }
  appendRealSemanticCreationBlockers(source, reasons);
  return reasons;
}

function getSpecificSemanticBlockingReasons(
  source: {
    target_term?: string;
    source_trace?: Record<string, unknown>;
    semantic_resolution_event_real_creation_attempted?: boolean;
  },
  blocksProjection: boolean,
  projectionReason: RuntimeSemanticGateBlockingReason,
  projectionAttempted?: boolean,
): RuntimeSemanticGateBlockingReason[] {
  const reasons: RuntimeSemanticGateBlockingReason[] = [];
  if (!hasText(source.target_term)) reasons.push("missing_target_term");
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (blocksProjection && projectionAttempted === true) reasons.push(projectionReason);
  if (source.semantic_resolution_event_real_creation_attempted === true) {
    reasons.push("semantic_resolution_event_real_creation_attempted");
  }
  return reasons;
}

function appendRealSemanticCreationBlockers(
  source: RuntimeSemanticResolutionGateSourceInput,
  reasons: RuntimeSemanticGateBlockingReason[],
): void {
  if (source.semantic_resolution_event_real_creation_attempted === true) {
    reasons.push("semantic_resolution_event_real_creation_attempted");
  }
  if (source.readiness_gap_record_real_creation_attempted === true) {
    reasons.push("readiness_gap_record_real_creation_attempted");
  }
  if (source.runtime_audit_trail_real_creation_attempted === true) {
    reasons.push("runtime_audit_trail_real_creation_attempted");
  }
  if (source.object_inventory_creation_attempted === true) {
    reasons.push("object_inventory_creation_attempted");
  }
  if (source.mba_projection_attempted === true) reasons.push("mba_projection_attempted");
  if (source.scene_projection_attempted === true) reasons.push("scene_projection_attempted");
  if (source.export_projection_attempted === true) reasons.push("export_projection_attempted");
}

function getGateFrameworkBlockingReasons(
  source: RuntimeCriticalGateEvaluationSourceInput,
): RuntimeCriticalGateBlockingReason[] {
  const reasons: RuntimeCriticalGateBlockingReason[] = [];
  if (!source.protected_route_id) reasons.push("missing_protected_route_id");
  if (!source.protected_object_hint) reasons.push("missing_protected_object_hint");
  if (!source.finding_code) reasons.push("missing_finding_code");
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (source.readiness_final_creation_attempted === true) {
    reasons.push("readiness_final_creation_attempted");
  }
  if (source.external_projection_attempted === true) {
    reasons.push("external_projection_attempted");
  }
  return reasons;
}

function getB7BlockingReasons(
  source: RuntimeB7C20NonDiagnosticBoundaryGateInput,
): RuntimeCriticalGateBlockingReason[] {
  const reasons: RuntimeCriticalGateBlockingReason[] = [];
  if (source.moc_direct_attempted === true || source.diagnosis_attempted === true) {
    reasons.push("b7_diagnostic_projection_attempted");
  }
  if (source.registry_direct_attempted === true) reasons.push("b7_registry_projection_attempted");
  if (source.ir_direct_attempted === true) reasons.push("b7_ir_projection_attempted");
  if (source.export_direct_attempted === true) reasons.push("b7_export_projection_attempted");
  if (
    source.root_cause_attempted === true ||
    source.monetization_attempted === true ||
    source.final_narrative_attempted === true ||
    source.vsm_ahe_final_attempted === true
  ) {
    reasons.push("b7_diagnostic_projection_attempted");
  }
  return [...new Set(reasons)];
}

function gateOutcomeFromBlockingReasons(
  reasons: RuntimeCriticalGateBlockingReason[],
): RuntimeCriticalGateOutcome {
  if (reasons.includes("missing_source_trace")) return "blocked_by_missing_evidence";
  if (reasons.includes("missing_protected_route_id")) return "blocked_by_missing_canonical_route";
  if (reasons.length > 0) return "manual_review_required";
  return "passed_candidate";
}

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function hasSourceTrace(value: unknown): boolean {
  const sourceTrace = value as Record<string, unknown> | undefined;
  return (
    typeof sourceTrace?.source_document === "string" &&
    typeof sourceTrace?.source_sheet === "string" &&
    typeof sourceTrace?.source_row_number === "number"
  );
}

function createResult(
  input: RuntimeCriticalGatesLocalInput,
  status: RuntimeCriticalGateStatus,
  revalidation: RuntimePhase9InputRevalidationDecision,
  gateEvaluationCandidates: RuntimeCriticalGateEvaluationCandidate[] = [],
  b0Candidates: RuntimeB0SemanticEntryGateCandidate[] = [],
  b2Candidates: RuntimeB2TransformationExceptionGateCandidate[] = [],
  b3Candidates: RuntimeB3ReceiverFeedbackGateCandidate[] = [],
  b7Candidates: RuntimeB7C20NonDiagnosticBoundaryGateCandidate[] = [],
  routeGateResultCandidates: RuntimeCriticalRouteGateResultCandidate[] = [],
): RuntimeCriticalGateFrameworkLocalResult {
  return {
    status,
    phase9_input_revalidation: revalidation,
    gate_evaluation_candidates: gateEvaluationCandidates,
    b0_semantic_entry_gate_candidates: b0Candidates,
    b2_transformation_exception_gate_candidates: b2Candidates,
    b3_receiver_feedback_gate_candidates: b3Candidates,
    b7_c20_non_diagnostic_boundary_gate_candidates: b7Candidates,
    critical_route_gate_result_candidates: routeGateResultCandidates,
    phase9_started_local: revalidation.phase9_started_local,
    phase9_closed_local: false,
    ready_for_phase10_authorization: false,
    runtime_40_20_started: false,
    catalog_activated: false,
    migration_applied: false,
    supabase_touched: false,
    sql_executed: false,
    endpoint_created: false,
    readiness_gap_record_real_created: false,
    readiness_decision_record_real_created: false,
    semantic_resolution_event_real_created: false,
    process_state_timer_event_real_created: false,
    runtime_audit_trail_real_created: false,
    critical_route_gate_executed_real: false,
    mmabp_gate_engine_executed_real: false,
    readiness_engine_executed: false,
    export_preview_created: false,
    diagnosis_created: false,
    ir_created: false,
    registry_created: false,
    object_inventory_created: false,
    moc_real_projection_created: false,
    pf_real_projection_created: false,
    olc_real_projection_created: false,
    phase10_started: false,
  };
}
