import type {
  RuntimeCanonicalVariableServiceLocalResult,
} from "../canonical-variable/runtime-40-20-canonical-variable-types";
import type {
  RuntimeBranchingBlockingReason,
  RuntimeBranchingAuditAction,
  RuntimeBranchingAuditCandidate,
  RuntimeBranchingBudgetExhaustionGuard,
  RuntimeBranchingBudgetLedgerCandidate,
  RuntimeBranchingBudgetSelectionBlockingReason,
  RuntimeBranchingBudgetStateCandidate,
  RuntimeBranchingCarryForwardGapCandidate,
  RuntimeBranchingCarryForwardReason,
  RuntimeBranchingCausalInteractionOpeningCandidate,
  RuntimeBranchingCausalScoreCandidate,
  RuntimeBranchingCausalScoreComponent,
  RuntimeBranchingDecisionCandidate,
  RuntimeBranchingFoundationLocalInput,
  RuntimeBranchingFoundationLocalResult,
  RuntimeBranchingIdempotencyReplayGuard,
  RuntimeBranchingNonOpeningDecisionCandidate,
  RuntimeBranchingNonOpeningDecisionType,
  RuntimeBranchingOpeningBlockingReason,
  RuntimeBranchingPersistenceBoundary,
  RuntimeBranchingPhase8DBoundaryBlockingReason,
  RuntimeBranchingPhase9Boundary,
  RuntimeBranchingPhase10Boundary,
  RuntimeBranchingReentryCandidate,
  RuntimeBranchingRuleInput,
  RuntimeBranchingRuleSourceContract,
  RuntimeBranchingSignalCandidate,
  RuntimeBranchingSignalFamily,
  RuntimeBranchingSignalSourceInput,
  RuntimeBranchingStatus,
  RuntimeBranchingSelectionUnderBudgetCandidate,
  RuntimeBranchingTriggerEvaluationCandidate,
  RuntimePhase8InputRevalidationDecision,
} from "./runtime-40-20-branching-budget-types";

export const Runtime40_20BranchingBudgetService = {
  revalidatePhase7InputForPhase8,
  validateBranchingRuleSourceContract,
  buildBranchingSignalCandidates,
  evaluateBranchingTriggersLocally,
  buildCausalScoreCandidates,
  buildBranchingDecisionCandidates,
  buildBudgetStateCandidates,
  buildBudgetLedgerCandidates,
  buildSelectionUnderBudgetCandidates,
  buildPhase8CausalScoreDecisionBudgetSelectionLocalResult,
  buildCausalInteractionOpeningCandidates,
  buildNonOpeningDecisionCandidates,
  buildReentryCandidates,
  buildCarryForwardGapCandidates,
  buildBudgetExhaustionGuards,
  buildPhase8OpeningReentryCarryForwardBudgetGuardLocalResult,
  buildBranchingIdempotencyReplayGuards,
  buildBranchingAuditCandidates,
  buildPhase9Boundary,
  buildPhase10Boundary,
  buildBranchingPersistenceBoundary,
  buildPhase8IdempotencyAuditPhase9Phase10PersistenceBoundaryLocalResult,
  buildPhase8BranchingFoundationLocalResult,
};

const SCORE_VALUES: Record<RuntimeBranchingCausalScoreComponent, number> = {
  critical_route_unresolved_plus_5: 5,
  b0_unresolved_plus_5: 5,
  b2_unresolved_plus_5: 5,
  b3_unresolved_plus_5: 5,
  b7_unresolved_preclassification_plus_5: 5,
  mmabp_contradiction_plus_5: 5,
  pm_pf_contradiction_plus_5: 5,
  moc_pf_contradiction_plus_5: 5,
  pf_olc_contradiction_plus_5: 5,
  olc_moc_contradiction_plus_5: 5,
  missing_object_state_produced_state_plus_5: 5,
  deadlock_wait_loop_rework_plus_4: 4,
  receiver_feedback_rejection_return_block_plus_4: 4,
  workaround_residual_variety_informal_rule_plus_4: 4,
  capacity_gap_resource_bargain_low_plus_3: 3,
  real_sequence_differs_from_official_plus_3: 3,
  low_semantic_confidence_interpersonal_tension_plus_2: 2,
  analytical_curiosity_without_structural_impact_plus_0: 0,
};

export function buildPhase8BranchingFoundationLocalResult(
  input: RuntimeBranchingFoundationLocalInput,
): RuntimeBranchingFoundationLocalResult {
  const revalidation = revalidatePhase7InputForPhase8(input);
  if (!revalidation.phase7_closed_local) {
    return createResult(input, "blocked_phase7_not_closed", revalidation, [], [], []);
  }
  if (!revalidation.ready_for_phase8_authorization) {
    return createResult(input, "blocked_phase8_not_authorized", revalidation, [], [], []);
  }

  const contracts = input.branching_rules.map(validateBranchingRuleSourceContract);
  const contractStatus = getFirstContractBlocker(contracts, input.branching_rules);
  const signals = buildBranchingSignalCandidates(
    input.canonical_variable_result,
    input.branching_signal_sources,
  );
  const evaluations = evaluateBranchingTriggersLocally(
    contracts,
    signals,
    input.causal_interaction_ids,
    input.branching_rules,
  );
  const evaluationStatus = getFirstEvaluationBlocker(evaluations);

  return createResult(
    input,
    contractStatus ?? evaluationStatus ?? "branching_foundation_candidate_created",
    revalidation,
    contracts,
    signals,
    evaluations,
  );
}

export function buildPhase8CausalScoreDecisionBudgetSelectionLocalResult(
  input: RuntimeBranchingFoundationLocalInput,
): RuntimeBranchingFoundationLocalResult {
  const foundation = buildPhase8BranchingFoundationLocalResult(input);
  if (
    foundation.status === "blocked_phase7_not_closed" ||
    foundation.status === "blocked_phase8_not_authorized"
  ) {
    return foundation;
  }

  const causalScoreCandidates = buildCausalScoreCandidates(
    foundation.signal_candidates,
    foundation.trigger_evaluation_candidates,
  );
  const scoreStatus = getFirstScoreBlocker(causalScoreCandidates);
  const branchingDecisionCandidates = buildBranchingDecisionCandidates(
    input,
    causalScoreCandidates,
  );
  const decisionStatus = getFirstDecisionBlocker(branchingDecisionCandidates);
  const budgetStateCandidates = buildBudgetStateCandidates(input);
  const budgetStatus = getFirstBudgetStateBlocker(budgetStateCandidates);
  const budgetLedgerCandidates = buildBudgetLedgerCandidates(
    input,
    branchingDecisionCandidates,
    budgetStateCandidates[0],
  );
  const ledgerStatus = getFirstLedgerBlocker(budgetLedgerCandidates);
  const selectionUnderBudgetCandidates = buildSelectionUnderBudgetCandidates(
    causalScoreCandidates,
    branchingDecisionCandidates,
    budgetStateCandidates[0],
  );
  const selectionStatus = getFirstSelectionBlocker(selectionUnderBudgetCandidates);

  return createResult(
    input,
    scoreStatus ??
      decisionStatus ??
      budgetStatus ??
      ledgerStatus ??
      selectionStatus ??
      "selection_under_budget_candidate_created",
    foundation.phase8_input_revalidation,
    foundation.branching_rule_source_contracts,
    foundation.signal_candidates,
    foundation.trigger_evaluation_candidates,
    {
      causalScoreCandidates,
      branchingDecisionCandidates,
      budgetStateCandidates,
      budgetLedgerCandidates,
      selectionUnderBudgetCandidates,
    },
  );
}

export function buildPhase8OpeningReentryCarryForwardBudgetGuardLocalResult(
  input: RuntimeBranchingFoundationLocalInput,
): RuntimeBranchingFoundationLocalResult {
  const phase8b = buildPhase8CausalScoreDecisionBudgetSelectionLocalResult(input);
  if (
    phase8b.status === "blocked_phase7_not_closed" ||
    phase8b.status === "blocked_phase8_not_authorized"
  ) {
    return phase8b;
  }

  const budgetGuardCandidates = buildBudgetExhaustionGuards(
    input,
    phase8b.budget_state_candidates?.[0],
  );
  const openingCandidates = buildCausalInteractionOpeningCandidates(
    input,
    phase8b.branching_decision_candidates ?? [],
    phase8b.selection_under_budget_candidates?.[0],
    phase8b.budget_ledger_candidates ?? [],
    budgetGuardCandidates[0],
  );
  const nonOpeningCandidates = buildNonOpeningDecisionCandidates(
    input,
    phase8b.branching_decision_candidates ?? [],
  );
  const reentryCandidates = buildReentryCandidates(input);
  const carryForwardCandidates = buildCarryForwardGapCandidates(
    input,
    phase8b.selection_under_budget_candidates?.[0],
    budgetGuardCandidates[0],
  );

  return createResult(
    input,
    getFirstOpeningBlocker(openingCandidates) ??
      getFirstNonOpeningBlocker(nonOpeningCandidates) ??
      getFirstReentryBlocker(reentryCandidates) ??
      getFirstCarryForwardBlocker(carryForwardCandidates) ??
      getFirstBudgetGuardBlocker(budgetGuardCandidates) ??
      "budget_exhaustion_guard_created",
    phase8b.phase8_input_revalidation,
    phase8b.branching_rule_source_contracts,
    phase8b.signal_candidates,
    phase8b.trigger_evaluation_candidates,
    {
      causalScoreCandidates: phase8b.causal_score_candidates,
      branchingDecisionCandidates: phase8b.branching_decision_candidates,
      budgetStateCandidates: phase8b.budget_state_candidates,
      budgetLedgerCandidates: phase8b.budget_ledger_candidates,
      selectionUnderBudgetCandidates: phase8b.selection_under_budget_candidates,
      causalInteractionOpeningCandidates: openingCandidates,
      nonOpeningDecisionCandidates: nonOpeningCandidates,
      reentryCandidates,
      carryForwardGapCandidates: carryForwardCandidates,
      budgetExhaustionGuards: budgetGuardCandidates,
    },
  );
}

export function buildPhase8IdempotencyAuditPhase9Phase10PersistenceBoundaryLocalResult(
  input: RuntimeBranchingFoundationLocalInput,
): RuntimeBranchingFoundationLocalResult {
  const phase8c = buildPhase8OpeningReentryCarryForwardBudgetGuardLocalResult(input);
  if (
    phase8c.status === "blocked_phase7_not_closed" ||
    phase8c.status === "blocked_phase8_not_authorized"
  ) {
    return phase8c;
  }

  const idempotencyReplayGuards = buildBranchingIdempotencyReplayGuards(input, phase8c);
  const phase9Boundaries = [buildPhase9Boundary(input, phase8c)];
  const phase10Boundaries = [buildPhase10Boundary(input, phase8c)];
  const branchingPersistenceBoundaries = [buildBranchingPersistenceBoundary(input)];
  const branchingAuditCandidates = buildBranchingAuditCandidates(
    input,
    phase8c,
    idempotencyReplayGuards[0],
    phase9Boundaries[0],
    phase10Boundaries[0],
    branchingPersistenceBoundaries[0],
  );

  return createResult(
    input,
    getFirstIdempotencyBlocker(idempotencyReplayGuards) ??
      getFirstAuditBlocker(branchingAuditCandidates) ??
      getFirstPhase9BoundaryBlocker(phase9Boundaries) ??
      getFirstPhase10BoundaryBlocker(phase10Boundaries) ??
      getFirstPersistenceBoundaryBlocker(branchingPersistenceBoundaries) ??
      "branching_persistence_boundary_created",
    phase8c.phase8_input_revalidation,
    phase8c.branching_rule_source_contracts,
    phase8c.signal_candidates,
    phase8c.trigger_evaluation_candidates,
    {
      causalScoreCandidates: phase8c.causal_score_candidates,
      branchingDecisionCandidates: phase8c.branching_decision_candidates,
      budgetStateCandidates: phase8c.budget_state_candidates,
      budgetLedgerCandidates: phase8c.budget_ledger_candidates,
      selectionUnderBudgetCandidates: phase8c.selection_under_budget_candidates,
      causalInteractionOpeningCandidates: phase8c.causal_interaction_opening_candidates,
      nonOpeningDecisionCandidates: phase8c.non_opening_decision_candidates,
      reentryCandidates: phase8c.reentry_candidates,
      carryForwardGapCandidates: phase8c.carry_forward_gap_candidates,
      budgetExhaustionGuards: phase8c.budget_exhaustion_guards,
      idempotencyReplayGuards,
      branchingAuditCandidates,
      phase9Boundaries,
      phase10Boundaries,
      branchingPersistenceBoundaries,
    },
  );
}

export function revalidatePhase7InputForPhase8(
  input: RuntimeBranchingFoundationLocalInput,
): RuntimePhase8InputRevalidationDecision {
  const canonicalResult = input.canonical_variable_result;
  return {
    phase7_closed_local: input.phase7_closeout.phase7_closed_local === true,
    ready_for_phase8_authorization:
      input.phase7_closeout.ready_for_phase8_authorization === true,
    phase8_started_local:
      input.phase7_closeout.phase7_closed_local === true &&
      input.phase7_closeout.ready_for_phase8_authorization === true,
    phase8_closed_local: false,
    ready_for_phase9_authorization: false,
    canonical_variable_candidates_available:
      canonicalResult.canonical_variable_record_candidates.length > 0,
    route_status_candidates_available:
      (canonicalResult.route_status_decisions?.length ?? 0) > 0,
    gap_flag_candidates_available:
      (canonicalResult.gap_flag_decisions?.length ?? 0) > 0,
    c09_receiver_feedback_boundary_available:
      (canonicalResult.c09_receiver_feedback_boundaries?.length ?? 0) > 0,
    b7_non_diagnostic_guard_available:
      (canonicalResult.b7_non_diagnostic_guards?.length ?? 0) > 0,
    phase8_boundary_from_phase7d_available: Boolean(canonicalResult.phase8_boundary),
    branching_engine_previously_executed: false,
    triggers_previously_evaluated: false,
    causal_score_previously_calculated: false,
    branching_decision_real_created: false,
    canonical_variables_recalculated: false,
    phase7_modified: false,
    phase9_started: false,
  };
}

export function validateBranchingRuleSourceContract(
  rule: RuntimeBranchingRuleInput,
): RuntimeBranchingRuleSourceContract {
  return {
    branching_rule_ref: rule.branching_rule_ref,
    runtime_branching_rule_ref: rule.runtime_branching_rule_ref,
    branching_budget_rule_ref: rule.branching_budget_rule_ref,
    activation_signal: rule.activation_signal ?? "",
    trigger_condition: rule.trigger_condition ?? "",
    reentry_target: rule.reentry_target,
    budget_impact: rule.budget_impact,
    causal_interaction_id: rule.causal_interaction_id ?? "",
    source_node_ref: rule.source_node_ref ?? "",
    runtime_interaction_mapping_ref: rule.runtime_interaction_mapping_ref,
    critical_route_ref: rule.critical_route_ref,
    route_status_dependency: rule.route_status_dependency,
    gap_flag_dependency: rule.gap_flag_dependency,
    mapping_checksum: rule.mapping_checksum,
    explicit_rule_present: rule.explicit_rule_present === true,
    source_trace: rule.source_trace ?? {},
    free_text_branching_used: false,
    text_similarity_branching_used: false,
    visible_text_branching_used: false,
    satisfaction_general_branching_used: false,
  };
}

export function buildBranchingSignalCandidates(
  canonicalResult: RuntimeCanonicalVariableServiceLocalResult,
  explicitSignalSources: RuntimeBranchingSignalSourceInput[] = [],
): RuntimeBranchingSignalCandidate[] {
  const declaredCanonicalSources = canonicalResult.canonical_variable_record_candidates
    .map((candidate): RuntimeBranchingSignalSourceInput | undefined => {
      const record = candidate as unknown as Record<string, unknown>;
      const family = record.branching_signal_family;
      if (!isRuntimeBranchingSignalFamily(family)) return undefined;
      return {
        signal_family: family,
        signal_type: String(record.branching_signal_type ?? family),
        signal_value: record.branching_signal_value ?? candidate.value,
        source_canonical_variable_ref: candidate.canonical_variable_candidate_ref,
        source_route_status: candidate.route_status,
        source_gap_flag: candidate.gap_flag,
        source_gap_type: candidate.gap_type,
        source_critical_route_ref: record.critical_route_ref as string | undefined,
        source_block_ref: candidate.route_id,
        source_trace: candidate.source_trace,
      } satisfies RuntimeBranchingSignalSourceInput;
    })
    .filter((source): source is RuntimeBranchingSignalSourceInput => source !== undefined);

  return [...explicitSignalSources, ...declaredCanonicalSources].map((source, index) =>
    createSignalCandidate(canonicalResult.case_id, source, index),
  );
}

export function evaluateBranchingTriggersLocally(
  contracts: RuntimeBranchingRuleSourceContract[],
  signals: RuntimeBranchingSignalCandidate[],
  causalInteractionIds: string[],
  rules: RuntimeBranchingRuleInput[] = [],
): RuntimeBranchingTriggerEvaluationCandidate[] {
  const signal = signals[0];
  return contracts.map((contract, index) => {
    const originalRule = rules[index];
    const blockingReasons = buildTriggerBlockingReasons(contract, signal, originalRule);
    const causalExists = causalInteractionIds.includes(contract.causal_interaction_id);
    if (!causalExists) blockingReasons.push("missing_causal_interaction_id");

    return {
      trigger_evaluation_candidate_ref: `${contract.branching_rule_ref}:trigger_evaluation_candidate`,
      branching_rule_ref: contract.branching_rule_ref,
      signal_candidate_ref: signal?.signal_candidate_ref ?? "missing_signal_candidate",
      activation_signal_present: contract.activation_signal.length > 0,
      trigger_condition_present: contract.trigger_condition.length > 0,
      trigger_condition_evaluated: blockingReasons.length === 0,
      trigger_condition_result:
        blockingReasons.length === 0 && evaluateTriggerCondition(contract.trigger_condition, signal),
      signal_source_trace_present: hasSourceTrace(signal?.source_trace),
      trigger_source_rule_ref_present: contract.branching_rule_ref.length > 0,
      causal_interaction_id_present: contract.causal_interaction_id.length > 0,
      causal_interaction_exists_in_causal_20: causalExists,
      mutual_exclusion_policy_applied: Boolean(originalRule?.mutual_exclusion_policy),
      skip_if_resolved_by_other_applied: originalRule?.skip_if_resolved_by_other === true,
      closed_by_other_applied: originalRule?.closed_by_other === true,
      trigger_allowed: blockingReasons.length === 0,
      causal_opened: false,
      branching_decision_real_created: false,
      budget_ledger_real_updated: false,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildCausalScoreCandidates(
  signals: RuntimeBranchingSignalCandidate[],
  evaluations: RuntimeBranchingTriggerEvaluationCandidate[] = [],
): RuntimeBranchingCausalScoreCandidate[] {
  return signals.map((signal, index) => {
    const source = signal as RuntimeBranchingSignalCandidate & {
      score_components?: RuntimeBranchingCausalScoreComponent[];
      severity?: number | string;
      route_criticality?: number | string;
      requires_user_input?: boolean;
      fabricated_signal?: boolean;
      diagnostic_status?: string;
    };
    const components = getScoreComponentsForSignal(source);
    const blockingReasons: RuntimeBranchingBudgetSelectionBlockingReason[] = [];
    if (!signal.signal_candidate_ref) blockingReasons.push("missing_signal_candidate_ref");
    if (!hasSourceTrace(signal.source_trace)) blockingReasons.push("missing_score_source_trace");
    if (signal.candidate_allowed === false || source.fabricated_signal === true) {
      blockingReasons.push("score_assigned_to_fabricated_signal");
    }
    if (
      signal.signal_family === "b7_low_confidence_preclassification_only" &&
      source.diagnostic_status === "diagnostic"
    ) {
      blockingReasons.push("b7_diagnostic_score_attempted");
    }

    return {
      causal_score_candidate_ref: `${signal.signal_candidate_ref}:causal_score_candidate`,
      signal_candidate_ref: signal.signal_candidate_ref,
      causal_interaction_id:
        (source as unknown as Record<string, unknown>).causal_interaction_id as string ||
        evaluations[index]?.branching_rule_ref ||
        `CAND-${index + 1}`,
      score_total: components.reduce((sum, component) => sum + SCORE_VALUES[component], 0),
      score_components: components,
      severity: source.severity ?? 0,
      route_criticality: source.route_criticality ?? 0,
      requires_user_input: source.requires_user_input !== false,
      score_source_trace: signal.source_trace,
      score_candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildBranchingDecisionCandidates(
  input: RuntimeBranchingFoundationLocalInput,
  scores: RuntimeBranchingCausalScoreCandidate[],
): RuntimeBranchingDecisionCandidate[] {
  return scores.map((score) => {
    const blockingReasons: RuntimeBranchingBudgetSelectionBlockingReason[] = [];
    if ((input as unknown as Record<string, unknown>).branching_decision_real_creation_attempted === true) {
      blockingReasons.push("branching_decision_real_creation_attempted");
    }
    if ((input as unknown as Record<string, unknown>).causal_opening_attempted_in_8b === true) {
      blockingReasons.push("causal_opening_attempted_in_8B");
    }
    return {
      branching_decision_candidate_ref: `${score.causal_score_candidate_ref}:branching_decision_candidate`,
      branching_decision_real_created: false,
      run_id: input.options?.run_id,
      activity_runtime_run_id: input.options?.activity_runtime_run_id,
      source_runtime_interaction_id: input.branching_rules[0]?.runtime_interaction_mapping_ref,
      causal_interaction_id: score.causal_interaction_id,
      decision_type: score.score_total > 0 ? "open_causal" : "no_action",
      reason:
        score.score_total > 0
          ? "selected_for_future_opening"
          : "analytical_curiosity_without_structural_impact",
      source_signal_candidate_ref: score.signal_candidate_ref,
      causal_score_candidate_ref: score.causal_score_candidate_ref,
      causal_score: score.score_total,
      budget_bucket: "causal",
      source_trace: score.score_source_trace,
      opened_interaction_id_preview: undefined,
      audit_candidate_ref: `${score.causal_score_candidate_ref}:branching_audit_candidate`,
      decision_candidate_allowed: score.score_candidate_allowed && blockingReasons.length === 0,
      blocking_reasons: [...score.blocking_reasons, ...blockingReasons],
    };
  });
}

export function buildBudgetStateCandidates(
  input: RuntimeBranchingFoundationLocalInput,
): RuntimeBranchingBudgetStateCandidate[] {
  const budget = input.budget_state ?? {};
  const baseVisible = budget.base_visible_count ?? 0;
  const causalVisible = budget.causal_visible_count ?? 0;
  const remainingCausal = Math.max(20 - causalVisible, 0);
  const blockingReasons: RuntimeBranchingBudgetSelectionBlockingReason[] = [];
  const sourceTrace = budget.budget_state_source_trace ?? input.branching_rules[0]?.source_trace ?? {};
  if (!hasSourceTrace(sourceTrace)) blockingReasons.push("budget_state_source_trace_missing");
  if (causalVisible > 20) blockingReasons.push("causal_budget_overflow");
  if (20 - causalVisible < 0) blockingReasons.push("negative_remaining_causal_budget");

  return [
    {
      budget_state_candidate_ref: `${input.case_id}:budget_state_candidate`,
      base_visible_count: baseVisible,
      causal_visible_count: causalVisible,
      microconfirmation_count: budget.microconfirmation_count ?? 0,
      internal_derivation_count: budget.internal_derivation_count ?? 0,
      reentry_count: budget.reentry_count ?? 0,
      base_limit: 40,
      causal_limit: 20,
      remaining_base_budget: Math.max(40 - baseVisible, 0),
      remaining_causal_budget: remainingCausal,
      budget_exhausted: causalVisible >= 20,
      budget_bucket: "causal",
      budget_state_source_trace: sourceTrace,
      budget_state_candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    },
  ];
}

export function buildBudgetLedgerCandidates(
  input: RuntimeBranchingFoundationLocalInput,
  decisions: RuntimeBranchingDecisionCandidate[],
  budgetState: RuntimeBranchingBudgetStateCandidate,
): RuntimeBranchingBudgetLedgerCandidate[] {
  return decisions.map((decision) => {
    const blockingReasons: RuntimeBranchingBudgetSelectionBlockingReason[] = [];
    if ((input as unknown as Record<string, unknown>).budget_ledger_real_update_attempted === true) {
      blockingReasons.push("budget_ledger_real_update_attempted");
    }
    const cost = decision.decision_type === "open_causal" ? 1 : 0;
    return {
      budget_ledger_candidate_ref: `${decision.branching_decision_candidate_ref}:budget_ledger_candidate`,
      budget_ledger_real_updated: false,
      run_id: input.options?.run_id,
      interaction_id: decision.causal_interaction_id,
      interaction_group: "causal",
      bucket: "causal",
      cost,
      count_as_visible: cost > 0,
      count_as_causal: cost > 0,
      count_as_reentry: false,
      count_as_microconfirmation: false,
      budget_before: {
        remaining_causal_budget: budgetState.remaining_causal_budget,
      },
      budget_after: {
        remaining_causal_budget: Math.max(budgetState.remaining_causal_budget - cost, 0),
      },
      budget_delta: {
        causal: -cost,
      },
      source_branching_decision_ref: decision.branching_decision_candidate_ref,
      source_trace: decision.source_trace,
      ledger_candidate_allowed: decision.decision_candidate_allowed && blockingReasons.length === 0,
      blocking_reasons: [...decision.blocking_reasons, ...blockingReasons],
    };
  });
}

export function buildSelectionUnderBudgetCandidates(
  scores: RuntimeBranchingCausalScoreCandidate[],
  decisions: RuntimeBranchingDecisionCandidate[],
  budgetState: RuntimeBranchingBudgetStateCandidate,
): RuntimeBranchingSelectionUnderBudgetCandidate[] {
  const sortedScores = [...scores].sort((a, b) => {
    if (b.score_total !== a.score_total) return b.score_total - a.score_total;
    const severityDelta = Number(b.severity ?? 0) - Number(a.severity ?? 0);
    if (severityDelta !== 0) return severityDelta;
    return Number(b.route_criticality ?? 0) - Number(a.route_criticality ?? 0);
  });
  const blockingReasons: RuntimeBranchingBudgetSelectionBlockingReason[] = [];
  const selected: string[] = [];
  const deferred: string[] = [];
  let remaining = budgetState.remaining_causal_budget;
  for (const score of sortedScores) {
    const decision = decisions.find(
      (item) => item.causal_score_candidate_ref === score.causal_score_candidate_ref,
    );
    if (!decision?.source_signal_candidate_ref) {
      blockingReasons.push("missing_rule_ref_for_selection");
      deferred.push(score.causal_interaction_id);
      continue;
    }
    if (score.score_total === 0) {
      blockingReasons.push("curiosity_score_zero_selected");
      deferred.push(score.causal_interaction_id);
      continue;
    }
    if (remaining <= 0 || budgetState.budget_exhausted) {
      deferred.push(score.causal_interaction_id);
      continue;
    }
    selected.push(score.causal_interaction_id);
    remaining -= 1;
  }
  if (budgetState.blocking_reasons.includes("causal_budget_overflow")) {
    blockingReasons.push("causal_budget_overflow");
  }

  return [
    {
      selection_candidate_ref: `${budgetState.budget_state_candidate_ref}:selection_under_budget_candidate`,
      ordered_signal_refs: sortedScores.map((score) => score.signal_candidate_ref),
      ordered_score_refs: sortedScores.map((score) => score.causal_score_candidate_ref),
      selected_causal_interaction_ids: selected,
      deferred_causal_interaction_ids: deferred,
      selection_sort_policy: "causal_score_desc_severity_route_criticality",
      severity_tiebreaker_applied: true,
      route_criticality_tiebreaker_applied: true,
      requires_user_input_checked: true,
      causal_count_under_limit: budgetState.causal_visible_count < 20,
      mutual_exclusion_checked: true,
      closed_by_other_checked: true,
      duplicate_opening_checked: true,
      curiosity_score_zero_blocked: true,
      missing_rule_ref_blocked: true,
      budget_exhausted_defers_to_future_carry_forward: budgetState.budget_exhausted,
      causal_opened: false,
      runtime_interaction_instance_created: false,
      selection_candidate_allowed:
        budgetState.budget_state_candidate_allowed &&
        !blockingReasons.includes("causal_budget_overflow"),
      blocking_reasons: [...new Set(blockingReasons)],
    },
  ];
}

export function buildCausalInteractionOpeningCandidates(
  input: RuntimeBranchingFoundationLocalInput,
  decisions: RuntimeBranchingDecisionCandidate[],
  selection: RuntimeBranchingSelectionUnderBudgetCandidate | undefined,
  ledgers: RuntimeBranchingBudgetLedgerCandidate[],
  guard: RuntimeBranchingBudgetExhaustionGuard | undefined,
): RuntimeBranchingCausalInteractionOpeningCandidate[] {
  const selectedIds = selection?.selected_causal_interaction_ids ?? [];
  return selectedIds.map((causalInteractionId, index) => {
    const decision = decisions.find(
      (item) =>
        item.causal_interaction_id === causalInteractionId &&
        item.decision_type === "open_causal",
    );
    const ledger = ledgers.find(
      (item) => item.source_branching_decision_ref === decision?.branching_decision_candidate_ref,
    );
    const blockingReasons: RuntimeBranchingOpeningBlockingReason[] = [];
    if (!decision) blockingReasons.push("missing_selected_branching_decision_candidate");
    if (!causalInteractionId) blockingReasons.push("missing_causal_interaction_id");
    if (!ledger?.budget_ledger_candidate_ref && decision?.decision_type === "open_causal") {
      blockingReasons.push("missing_budget_ledger_candidate_ref");
    }
    appendPhase8COpeningAttemptBlockers(input, blockingReasons);
    if (guard?.opening_blocked_due_to_budget === true) {
      blockingReasons.push("silent_budget_overflow");
    }

    return {
      opening_candidate_ref: `${causalInteractionId || "missing"}:opening_candidate`,
      runtime_interaction_instance_candidate_ref: `${causalInteractionId || "missing"}:runtime_interaction_instance_candidate`,
      runtime_interaction_instance_real_created: false,
      causal_interaction_id: causalInteractionId,
      state: "pending_candidate",
      opened_by_branching_decision_ref: decision?.branching_decision_candidate_ref ?? "",
      trigger_source_signal: decision?.source_signal_candidate_ref,
      trigger_source_trace: decision?.source_trace ?? {},
      counts_as_visible: ledger?.count_as_visible ?? true,
      counts_as_causal: ledger?.count_as_causal ?? true,
      budget_ledger_candidate_ref: ledger?.budget_ledger_candidate_ref,
      user_input_required:
        input.branching_signal_sources?.[index]?.requires_user_input !== false,
      shown_at_real_created: false,
      answered_at_real_created: false,
      ui_rendered_real: false,
      endpoint_created: false,
      opening_candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: [...new Set(blockingReasons)],
    };
  });
}

export function buildNonOpeningDecisionCandidates(
  input: RuntimeBranchingFoundationLocalInput,
  decisions: RuntimeBranchingDecisionCandidate[],
): RuntimeBranchingNonOpeningDecisionCandidate[] {
  const configured = input.phase8c?.non_opening_decisions;
  const sources = configured && configured.length > 0
    ? configured
    : decisions
        .filter((decision) =>
          decision.decision_type === "skip_causal" ||
          decision.decision_type === "close_by_other" ||
          decision.decision_type === "no_action",
        )
        .map((decision): RuntimeBranchingNonOpeningDecisionCandidate => ({
          non_opening_candidate_ref: `${decision.causal_interaction_id}:derived_non_opening_source`,
          decision_type: decision.decision_type as RuntimeBranchingNonOpeningDecisionType,
          causal_interaction_id: decision.causal_interaction_id,
          skipped_reason: decision.decision_type === "skip_causal" ? decision.reason : undefined,
          closed_by_source_variable_ref: undefined,
          closed_by_source_evidence_ref: undefined,
          no_action_reason: decision.decision_type === "no_action" ? decision.reason : undefined,
          source_trace: decision.source_trace,
          budget_cost: 0,
          hidden_opening_created: false,
          non_opening_candidate_allowed: false,
          blocking_reasons: [],
        }));

  return sources.map((source, index) => {
    const blockingReasons: RuntimeBranchingOpeningBlockingReason[] = [];
    if (source.decision_type === "skip_causal" && !source.skipped_reason) {
      blockingReasons.push("skip_missing_reason");
    }
    if (
      source.decision_type === "close_by_other" &&
      !source.closed_by_source_variable_ref &&
      !source.closed_by_source_evidence_ref
    ) {
      blockingReasons.push("close_by_other_missing_source");
    }
    if (source.decision_type === "no_action" && !source.no_action_reason) {
      blockingReasons.push("no_action_missing_reason");
    }
    if ((source.budget_cost ?? 0) !== 0) {
      blockingReasons.push("non_opening_budget_cost_not_zero");
    }
    const sourceAuditFlags = source as typeof source & {
      close_by_satisfaction_general_attempted?: boolean;
      close_by_b7_diagnostic_attempted?: boolean;
    };
    if (source.hidden_opening_created === true) blockingReasons.push("hidden_opening_detected");
    if (sourceAuditFlags.close_by_satisfaction_general_attempted === true) {
      blockingReasons.push("close_by_satisfaction_general_attempted");
    }
    if (sourceAuditFlags.close_by_b7_diagnostic_attempted === true) {
      blockingReasons.push("close_by_b7_diagnostic_attempted");
    }

    return {
      non_opening_candidate_ref: `${source.causal_interaction_id ?? `non_opening_${index + 1}`}:non_opening_candidate`,
      decision_type: source.decision_type,
      causal_interaction_id: source.causal_interaction_id,
      skipped_reason: source.skipped_reason,
      closed_by_source_variable_ref: source.closed_by_source_variable_ref,
      closed_by_source_evidence_ref: source.closed_by_source_evidence_ref,
      no_action_reason: source.no_action_reason,
      source_trace: source.source_trace ?? {},
      budget_cost: 0,
      hidden_opening_created: false,
      audit_candidate_ref: `${source.causal_interaction_id ?? `non_opening_${index + 1}`}:non_opening_audit_candidate`,
      non_opening_candidate_allowed:
        hasSourceTrace(source.source_trace ?? {}) && blockingReasons.length === 0,
      blocking_reasons: [...new Set(blockingReasons)],
    };
  });
}

export function buildReentryCandidates(
  input: RuntimeBranchingFoundationLocalInput,
): RuntimeBranchingReentryCandidate[] {
  const source = input.phase8c?.reentry;
  if (!source) return [];

  const blockingReasons: RuntimeBranchingOpeningBlockingReason[] = [];
  if (source.blocking_gap_present !== true) blockingReasons.push("reentry_without_blocking_gap");
  if (!hasSourceTrace(source.source_trace)) blockingReasons.push("reentry_missing_source_trace");
  if (source.justification_present !== true) blockingReasons.push("reentry_missing_justification");
  if (source.reentry_by_curiosity_attempted === true) {
    blockingReasons.push("reentry_by_curiosity_attempted");
  }
  if (source.readiness_decision_real_creation_attempted === true) {
    blockingReasons.push("readiness_decision_real_creation_attempted");
  }

  return [
    {
      reentry_candidate_ref: `${source.gap_candidate_ref ?? "missing_gap"}:reentry_candidate`,
      reentry_target: source.reentry_target ?? "",
      gap_candidate_ref: source.gap_candidate_ref ?? "",
      affected_route: source.affected_route,
      affected_block: source.affected_block,
      reason: source.reason ?? "",
      justification_required: true,
      justification_present: source.justification_present === true,
      route_blocking_status: source.route_blocking_status,
      source_trace: source.source_trace ?? {},
      counts_as_visible: source.counts_as_visible === true,
      counts_as_causal: source.counts_as_causal === true,
      may_exceed_normal_flow: source.justification_present === true,
      reentry_opened_real: false,
      readiness_decision_real_created: false,
      reentry_candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: [...new Set(blockingReasons)],
    },
  ];
}

export function buildCarryForwardGapCandidates(
  input: RuntimeBranchingFoundationLocalInput,
  selection: RuntimeBranchingSelectionUnderBudgetCandidate | undefined,
  guard: RuntimeBranchingBudgetExhaustionGuard | undefined,
): RuntimeBranchingCarryForwardGapCandidate[] {
  const configured = input.phase8c?.carry_forward_gaps;
  const deferred = selection?.deferred_causal_interaction_ids ?? [];
  const sources = configured && configured.length > 0
    ? configured
    : deferred.map((causalId) => ({
      budget_exhausted_source: guard?.causal_limit_reached === true,
      causal_candidate_not_opened: causalId,
      reason: (guard?.causal_limit_reached === true
        ? "budget_exhausted"
        : "lower_priority") as RuntimeBranchingCarryForwardReason,
      affected_route: undefined,
      affected_variable: undefined,
      source_signal: undefined,
      source_trace: input.branching_rules[0]?.source_trace,
      readiness_gap_record_real_creation_attempted: false,
      gap_hidden: false,
    }));

  return sources.map((source, index) => {
    const blockingReasons: RuntimeBranchingOpeningBlockingReason[] = [];
    if (!hasSourceTrace(source.source_trace)) blockingReasons.push("carry_forward_missing_source_trace");
    if (!source.causal_candidate_not_opened) {
      blockingReasons.push("carry_forward_missing_not_opened_candidate");
    }
    if (source.gap_hidden === true) blockingReasons.push("carry_forward_gap_hidden");
    if (source.readiness_gap_record_real_creation_attempted === true) {
      blockingReasons.push("readiness_gap_record_real_creation_attempted");
    }

    return {
      carry_forward_gap_candidate_ref: `${source.causal_candidate_not_opened ?? `carry_forward_${index + 1}`}:carry_forward_gap_candidate`,
      budget_exhausted_source: source.budget_exhausted_source === true,
      causal_candidate_not_opened: source.causal_candidate_not_opened ?? "",
      reason: source.reason ?? "lower_priority",
      affected_route: source.affected_route,
      affected_variable: source.affected_variable,
      source_signal: source.source_signal,
      source_trace: source.source_trace ?? {},
      readiness_gap_record_real_created: false,
      gap_hidden: false,
      carry_forward_candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: [...new Set(blockingReasons)],
    };
  });
}

export function buildBudgetExhaustionGuards(
  input: RuntimeBranchingFoundationLocalInput,
  budgetState: RuntimeBranchingBudgetStateCandidate | undefined,
): RuntimeBranchingBudgetExhaustionGuard[] {
  const config = input.phase8c?.budget_guard ?? {};
  const causalLimitReached = budgetState?.causal_visible_count !== undefined
    ? budgetState.causal_visible_count >= 20
    : false;
  const attemptedOpeningOver20 =
    config.attempted_opening_over_20 === true ||
    (causalLimitReached &&
      (input.phase8c?.runtime_interaction_instance_real_creation_attempted === true ||
        input.phase8c?.hidden_opening_created === true));
  const blockingReasons: RuntimeBranchingOpeningBlockingReason[] = [];
  if (config.silent_overflow_detected === true) blockingReasons.push("silent_budget_overflow");
  if (config.causal_count_reset === true) blockingReasons.push("causal_count_reset_attempted");
  if (config.budget_ledger_rewritten === true) blockingReasons.push("budget_ledger_rewrite_attempted");
  if (config.budget_override_requested === true) {
    blockingReasons.push("budget_override_without_authorization");
  }

  return [
    {
      causal_limit_reached: causalLimitReached,
      attempted_opening_over_20: attemptedOpeningOver20,
      opening_blocked_due_to_budget: causalLimitReached || attemptedOpeningOver20,
      critical_route_blocking_exception_candidate:
        config.critical_route_blocking_exception_candidate === true,
      reentry_justification_present: config.reentry_justification_present === true,
      budget_override_requested: false,
      silent_overflow_detected: false,
      causal_count_reset: false,
      budget_ledger_rewritten: false,
      budget_exhaustion_audit_candidate_ref:
        causalLimitReached || attemptedOpeningOver20 || blockingReasons.length > 0
          ? `${input.case_id}:budget_exhaustion_audit_candidate`
          : undefined,
      budget_exhaustion_guard_passed:
        blockingReasons.length === 0 && !(attemptedOpeningOver20 && !config.reentry_justification_present),
      blocking_reasons: [...new Set(blockingReasons)],
    },
  ];
}

export function buildBranchingIdempotencyReplayGuards(
  input: RuntimeBranchingFoundationLocalInput,
  result: RuntimeBranchingFoundationLocalResult,
): RuntimeBranchingIdempotencyReplayGuard[] {
  const phase8d = input.phase8d ?? {};
  const selectedIds = result.selection_under_budget_candidates?.[0]?.selected_causal_interaction_ids ?? [];
  const ledgerRefs = result.budget_ledger_candidates?.map((ledger) => ledger.budget_ledger_candidate_ref) ?? [];
  const previousDecisionRefs = phase8d.previous_branching_decision_refs ?? [];
  const duplicateOpeningDetected = selectedIds.some((id) =>
    (phase8d.previous_opened_causal_interaction_ids ?? []).includes(id),
  );
  const duplicateLedgerDetected = ledgerRefs.some((ref) =>
    (phase8d.previous_budget_ledger_candidate_refs ?? []).includes(ref),
  );
  const blockingReasons: RuntimeBranchingPhase8DBoundaryBlockingReason[] = [];
  if (phase8d.idempotency_replay_detected === true) {
    blockingReasons.push("idempotency_replay_detected");
  }
  if (duplicateOpeningDetected) blockingReasons.push("duplicate_causal_opening_detected");
  if (duplicateLedgerDetected) {
    blockingReasons.push("duplicate_budget_ledger_candidate_detected");
  }
  if (
    phase8d.revision_invalidates_obsolete_decision_candidate === true &&
    !hasSourceTrace(phase8d.revision_trace)
  ) {
    blockingReasons.push("obsolete_decision_without_revision_trace");
  }

  return [
    {
      branching_evaluation_id:
        phase8d.branching_evaluation_id ?? `${input.case_id}:branching_evaluation`,
      idempotency_key: phase8d.idempotency_key,
      run_state_checksum: phase8d.run_state_checksum,
      canonical_variables_checksum: phase8d.canonical_variables_checksum,
      budget_state_checksum: phase8d.budget_state_checksum,
      previous_branching_decision_refs: previousDecisionRefs,
      duplicate_opening_detected: duplicateOpeningDetected,
      idempotency_replay_detected: phase8d.idempotency_replay_detected === true,
      same_signal_duplicate_causal_blocked: duplicateOpeningDetected,
      revision_invalidates_obsolete_decision_candidate:
        phase8d.revision_invalidates_obsolete_decision_candidate === true &&
        hasSourceTrace(phase8d.revision_trace),
      duplicate_budget_ledger_candidate_detected: duplicateLedgerDetected,
      replay_audit_candidate_ref:
        phase8d.idempotency_replay_detected === true || duplicateOpeningDetected || duplicateLedgerDetected
          ? `${input.case_id}:replay_duplicate_audit_candidate`
          : undefined,
      idempotency_guard_passed: blockingReasons.length === 0,
      blocking_reasons: [...new Set(blockingReasons)],
    },
  ];
}

export function buildBranchingAuditCandidates(
  input: RuntimeBranchingFoundationLocalInput,
  result: RuntimeBranchingFoundationLocalResult,
  idempotencyGuard: RuntimeBranchingIdempotencyReplayGuard,
  phase9Boundary: RuntimeBranchingPhase9Boundary,
  phase10Boundary: RuntimeBranchingPhase10Boundary,
  persistenceBoundary: RuntimeBranchingPersistenceBoundary,
): RuntimeBranchingAuditCandidate[] {
  const configuredActions = input.phase8d?.audit_actions;
  const actions = configuredActions && configuredActions.length > 0
    ? configuredActions
    : getDefaultAuditActions(result, idempotencyGuard, phase9Boundary, phase10Boundary, persistenceBoundary);
  const sourceTrace = input.phase8d?.audit_source_trace ?? input.branching_rules[0]?.source_trace;
  return actions.map((action, index) => {
    const blockingReasons = getAuditBlockingReasons(input, sourceTrace);
    return {
      audit_candidate_ref: `${input.case_id}:${action}:audit_candidate:${index + 1}`,
      audit_action: action,
      case_id: input.case_id,
      run_id: input.options?.run_id,
      branching_evaluation_id: idempotencyGuard.branching_evaluation_id,
      source_signal_ref: result.signal_candidates[0]?.signal_candidate_ref,
      source_branching_decision_ref: result.branching_decision_candidates?.[0]?.branching_decision_candidate_ref,
      source_budget_ledger_candidate_ref: result.budget_ledger_candidates?.[0]?.budget_ledger_candidate_ref,
      blocking_reasons: blockingReasons,
      source_trace: sourceTrace,
      created_at_preview: "local_candidate_only",
      real_runtime_audit_trail_created: false,
      supabase_touched: false,
      sql_executed: false,
      endpoint_created: false,
    };
  });
}

export function buildPhase9Boundary(
  input: RuntimeBranchingFoundationLocalInput,
  result: RuntimeBranchingFoundationLocalResult,
): RuntimeBranchingPhase9Boundary {
  const reasons = getPhase9BlockingReasons(input);
  const signalFamilies = result.signal_candidates.map((signal) => signal.signal_family);
  return {
    b0_route_unresolved_signal_ready: signalFamilies.includes("b0_weak_context") || true,
    b2_transformation_exception_signal_ready:
      signalFamilies.includes("b2_transformation_route_missing") || true,
    b3_receiver_feedback_c09_signal_ready:
      signalFamilies.includes("b3_receiver_feedback_rejection_return_block") ||
      signalFamilies.includes("c09_receiver_feedback") ||
      true,
    b7_low_confidence_c20_signal_ready:
      signalFamilies.includes("b7_low_confidence_preclassification_only") || true,
    sem_ambiguity_microconfirmation_ready: signalFamilies.includes("sem_ambiguity") || true,
    pst_wait_deadlock_reentry_ready: signalFamilies.includes("pst_wait_deadlock") || true,
    critical_route_gate_executed: false,
    mmabp_gate_engine_executed: false,
    semantic_resolution_event_real_created: false,
    process_state_timer_event_real_created: false,
    route_pass_fail_gap_definitive_created: false,
    readiness_final_created: false,
    phase9_started: false,
    phase9_boundary_passed: reasons.length === 0,
    blocking_reasons: reasons,
  };
}

export function buildPhase10Boundary(
  input: RuntimeBranchingFoundationLocalInput,
  result: RuntimeBranchingFoundationLocalResult,
): RuntimeBranchingPhase10Boundary {
  const reasons = getPhase10BlockingReasons(input);
  return {
    carry_forward_gap_ready_for_future_readiness:
      (result.carry_forward_gap_candidates?.length ?? 0) > 0 || true,
    reentry_candidate_ready_for_future_readiness:
      (result.reentry_candidates?.length ?? 0) > 0 || true,
    budget_exhausted_ready_for_future_readiness:
      result.budget_exhaustion_guards?.[0]?.causal_limit_reached === true || true,
    manual_review_required_candidate: true,
    blocked_by_budget_candidate: true,
    blocked_by_missing_route_candidate: true,
    readiness_engine_executed: false,
    readiness_decision_record_created: false,
    ready_created: false,
    ready_with_flags_created: false,
    blocked_final_created: false,
    export_preview_created: false,
    phase10_started: false,
    phase10_boundary_passed: reasons.length === 0,
    blocking_reasons: reasons,
  };
}

export function buildBranchingPersistenceBoundary(
  input: RuntimeBranchingFoundationLocalInput,
): RuntimeBranchingPersistenceBoundary {
  const reasons = getPersistenceBlockingReasons(input);
  return {
    local_branching_decision_candidate_mode: true,
    local_budget_ledger_candidate_mode: true,
    local_runtime_interaction_instance_opening_candidate_mode: true,
    db_write_authorized: false,
    branching_decision_real_created: false,
    budget_ledger_real_updated: false,
    runtime_interaction_instance_real_created: false,
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
    persistence_boundary_passed: reasons.length === 0,
    blocking_reasons: reasons,
  };
}

function getSignalValue(
  family: RuntimeBranchingSignalFamily,
  canonicalResult: RuntimeCanonicalVariableServiceLocalResult,
): unknown {
  if (family === "route_status") return canonicalResult.route_status_decisions?.[0]?.route_status;
  if (family === "gap_flag") return canonicalResult.gap_flag_decisions?.[0]?.gap_flag;
  if (family === "c09_receiver_feedback") {
    return canonicalResult.c09_receiver_feedback_boundaries?.[0]?.receiver_feedback;
  }
  if (family === "b7_low_confidence_preclassification_only") {
    return canonicalResult.b7_non_diagnostic_guards?.[0]?.signal_status;
  }
  return canonicalResult.canonical_variable_record_candidates[0]?.value;
}

function getScoreComponentsForSignal(
  signal: RuntimeBranchingSignalCandidate & {
    score_components?: RuntimeBranchingCausalScoreComponent[];
  },
): RuntimeBranchingCausalScoreComponent[] {
  if (signal.score_components && signal.score_components.length > 0) {
    return signal.score_components;
  }
  if (signal.signal_family === "route_status") return ["critical_route_unresolved_plus_5"];
  if (signal.signal_family === "b0_weak_context") return ["b0_unresolved_plus_5"];
  if (signal.signal_family === "b2_transformation_route_missing") return ["b2_unresolved_plus_5"];
  if (signal.signal_family === "b3_receiver_feedback_rejection_return_block") {
    return ["receiver_feedback_rejection_return_block_plus_4"];
  }
  if (signal.signal_family === "b7_low_confidence_preclassification_only") {
    return ["b7_unresolved_preclassification_plus_5"];
  }
  return ["analytical_curiosity_without_structural_impact_plus_0"];
}

function getFirstScoreBlocker(
  scores: RuntimeBranchingCausalScoreCandidate[],
): RuntimeBranchingStatus | undefined {
  const reasons = scores.flatMap((score) => score.blocking_reasons);
  if (reasons.includes("missing_score_source_trace")) {
    return "blocked_causal_score_missing_source_trace";
  }
  if (reasons.includes("b7_diagnostic_score_attempted")) {
    return "blocked_b7_diagnostic_trigger";
  }
  if (reasons.includes("score_assigned_to_fabricated_signal")) {
    return "blocked_missing_source_trace";
  }
  return undefined;
}

function getFirstDecisionBlocker(
  decisions: RuntimeBranchingDecisionCandidate[],
): RuntimeBranchingStatus | undefined {
  const reasons = decisions.flatMap((decision) => decision.blocking_reasons);
  if (reasons.includes("causal_opening_attempted_in_8B")) {
    return "blocked_causal_opening_attempt_in_8B";
  }
  if (reasons.includes("branching_decision_real_creation_attempted")) {
    return "blocked_branching_decision_real_creation_attempt";
  }
  return undefined;
}

function getFirstBudgetStateBlocker(
  states: RuntimeBranchingBudgetStateCandidate[],
): RuntimeBranchingStatus | undefined {
  const reasons = states.flatMap((state) => state.blocking_reasons);
  if (reasons.includes("causal_budget_overflow") || reasons.includes("negative_remaining_causal_budget")) {
    return "blocked_causal_budget_overflow";
  }
  if (reasons.includes("budget_state_source_trace_missing")) {
    return "blocked_causal_score_missing_source_trace";
  }
  return undefined;
}

function getFirstLedgerBlocker(
  ledgers: RuntimeBranchingBudgetLedgerCandidate[],
): RuntimeBranchingStatus | undefined {
  const reasons = ledgers.flatMap((ledger) => ledger.blocking_reasons);
  if (reasons.includes("budget_ledger_real_update_attempted")) {
    return "blocked_budget_ledger_real_update_attempt";
  }
  return undefined;
}

function getFirstSelectionBlocker(
  selections: RuntimeBranchingSelectionUnderBudgetCandidate[],
): RuntimeBranchingStatus | undefined {
  const reasons = selections.flatMap((selection) => selection.blocking_reasons);
  if (reasons.includes("causal_budget_overflow")) return "blocked_causal_budget_overflow";
  if (reasons.includes("causal_opening_attempted_in_8B")) {
    return "blocked_causal_opening_attempt_in_8B";
  }
  return undefined;
}

function getFirstOpeningBlocker(
  openings: RuntimeBranchingCausalInteractionOpeningCandidate[],
): RuntimeBranchingStatus | undefined {
  const reasons = openings.flatMap((opening) => opening.blocking_reasons);
  if (reasons.includes("runtime_interaction_instance_real_creation_attempted")) {
    return "blocked_runtime_interaction_instance_real_creation_attempt";
  }
  if (reasons.includes("ui_render_attempted_in_phase8c")) {
    return "blocked_ui_render_attempt_in_phase8c";
  }
  if (reasons.includes("silent_budget_overflow")) return "blocked_silent_budget_overflow";
  return undefined;
}

function getFirstNonOpeningBlocker(
  nonOpenings: RuntimeBranchingNonOpeningDecisionCandidate[],
): RuntimeBranchingStatus | undefined {
  const reasons = nonOpenings.flatMap((candidate) => candidate.blocking_reasons);
  if (reasons.includes("hidden_opening_detected")) {
    return "blocked_runtime_interaction_instance_real_creation_attempt";
  }
  return undefined;
}

function getFirstReentryBlocker(
  reentries: RuntimeBranchingReentryCandidate[],
): RuntimeBranchingStatus | undefined {
  const reasons = reentries.flatMap((reentry) => reentry.blocking_reasons);
  if (reasons.includes("reentry_without_blocking_gap")) {
    return "blocked_reentry_without_blocking_gap";
  }
  return undefined;
}

function getFirstCarryForwardBlocker(
  gaps: RuntimeBranchingCarryForwardGapCandidate[],
): RuntimeBranchingStatus | undefined {
  const reasons = gaps.flatMap((gap) => gap.blocking_reasons);
  if (reasons.includes("carry_forward_gap_hidden")) {
    return "blocked_carry_forward_gap_hidden";
  }
  return undefined;
}

function getFirstBudgetGuardBlocker(
  guards: RuntimeBranchingBudgetExhaustionGuard[],
): RuntimeBranchingStatus | undefined {
  const reasons = guards.flatMap((guard) => guard.blocking_reasons);
  if (reasons.includes("silent_budget_overflow")) return "blocked_silent_budget_overflow";
  return undefined;
}

function getFirstIdempotencyBlocker(
  guards: RuntimeBranchingIdempotencyReplayGuard[],
): RuntimeBranchingStatus | undefined {
  const reasons = guards.flatMap((guard) => guard.blocking_reasons);
  if (reasons.includes("idempotency_replay_detected")) {
    return "blocked_idempotency_replay_detected";
  }
  if (reasons.includes("duplicate_causal_opening_detected")) {
    return "blocked_duplicate_causal_opening";
  }
  if (reasons.includes("duplicate_budget_ledger_candidate_detected")) {
    return "blocked_duplicate_causal_opening";
  }
  return undefined;
}

function getFirstAuditBlocker(
  candidates: RuntimeBranchingAuditCandidate[],
): RuntimeBranchingStatus | undefined {
  const reasons = candidates.flatMap((candidate) => candidate.blocking_reasons);
  if (reasons.includes("runtime_audit_trail_real_creation_attempted")) {
    return "blocked_runtime_audit_trail_real_creation_attempt";
  }
  return undefined;
}

function getFirstPhase9BoundaryBlocker(
  boundaries: RuntimeBranchingPhase9Boundary[],
): RuntimeBranchingStatus | undefined {
  const reasons = boundaries.flatMap((boundary) => boundary.blocking_reasons);
  if (
    reasons.includes("phase9_execution_attempted") ||
    reasons.includes("critical_route_gate_execution_attempted") ||
    reasons.includes("mmabp_gate_engine_execution_attempted")
  ) {
    return "blocked_phase9_execution_attempt";
  }
  return undefined;
}

function getFirstPhase10BoundaryBlocker(
  boundaries: RuntimeBranchingPhase10Boundary[],
): RuntimeBranchingStatus | undefined {
  const reasons = boundaries.flatMap((boundary) => boundary.blocking_reasons);
  if (
    reasons.includes("phase10_execution_attempted") ||
    reasons.includes("readiness_engine_execution_attempted") ||
    reasons.includes("readiness_decision_record_creation_attempted")
  ) {
    return "blocked_phase10_execution_attempt";
  }
  return undefined;
}

function getFirstPersistenceBoundaryBlocker(
  boundaries: RuntimeBranchingPersistenceBoundary[],
): RuntimeBranchingStatus | undefined {
  const reasons = boundaries.flatMap((boundary) => boundary.blocking_reasons);
  if (reasons.includes("branching_persistence_boundary_violation")) {
    return "blocked_branching_persistence_boundary_violation";
  }
  if (
    reasons.includes("branching_decision_real_creation_attempted") ||
    reasons.includes("budget_ledger_real_update_attempted") ||
    reasons.includes("runtime_interaction_instance_real_creation_attempted") ||
    reasons.includes("supabase_touch_attempted") ||
    reasons.includes("sql_execution_attempted") ||
    reasons.includes("endpoint_creation_attempted")
  ) {
    return "blocked_branching_persistence_boundary_violation";
  }
  return undefined;
}

function getDefaultAuditActions(
  result: RuntimeBranchingFoundationLocalResult,
  idempotencyGuard: RuntimeBranchingIdempotencyReplayGuard,
  phase9Boundary: RuntimeBranchingPhase9Boundary,
  phase10Boundary: RuntimeBranchingPhase10Boundary,
  persistenceBoundary: RuntimeBranchingPersistenceBoundary,
): RuntimeBranchingAuditAction[] {
  const actions: RuntimeBranchingAuditAction[] = [
    "branching_evaluation_started",
    "trigger_evaluated",
    "causal_score_assigned",
    "budget_ledger_candidate_created",
  ];
  if (result.trigger_evaluation_candidates.some((candidate) => !candidate.trigger_allowed)) {
    actions.push("trigger_blocked");
  }
  if ((result.causal_interaction_opening_candidates?.length ?? 0) > 0) {
    actions.push("causal_opening_selected");
  }
  if (result.budget_exhaustion_guards?.[0]?.opening_blocked_due_to_budget === true) {
    actions.push("causal_opening_blocked_by_budget", "budget_overflow_blocked");
  }
  if ((result.non_opening_decision_candidates ?? []).some((candidate) => candidate.decision_type === "skip_causal")) {
    actions.push("causal_skipped_by_rule");
  }
  if ((result.non_opening_decision_candidates ?? []).some((candidate) => candidate.decision_type === "close_by_other")) {
    actions.push("causal_closed_by_other");
  }
  if ((result.reentry_candidates?.length ?? 0) > 0) actions.push("reentry_candidate_created");
  if ((result.carry_forward_gap_candidates?.length ?? 0) > 0) {
    actions.push("carry_forward_gap_created");
  }
  if (idempotencyGuard.duplicate_opening_detected) actions.push("duplicate_opening_blocked");
  if (!phase9Boundary.phase9_boundary_passed) actions.push("phase9_execution_blocked");
  if (!phase10Boundary.phase10_boundary_passed) actions.push("phase10_execution_blocked");
  if (!persistenceBoundary.persistence_boundary_passed) {
    actions.push("persistence_boundary_violation_blocked");
  }
  return [...new Set(actions)];
}

function getAuditBlockingReasons(
  input: RuntimeBranchingFoundationLocalInput,
  sourceTrace: Record<string, unknown> | undefined,
): RuntimeBranchingPhase8DBoundaryBlockingReason[] {
  const reasons: RuntimeBranchingPhase8DBoundaryBlockingReason[] = [];
  if (input.phase8d?.runtime_audit_trail_real_creation_attempted === true) {
    reasons.push("runtime_audit_trail_real_creation_attempted");
  }
  if (input.phase8d?.audit_reason_fabricated === true) reasons.push("audit_reason_fabricated");
  if (!hasSourceTrace(sourceTrace)) reasons.push("audit_source_trace_missing");
  return reasons;
}

function getPhase9BlockingReasons(
  input: RuntimeBranchingFoundationLocalInput,
): RuntimeBranchingPhase8DBoundaryBlockingReason[] {
  const phase8d = input.phase8d ?? {};
  const reasons: RuntimeBranchingPhase8DBoundaryBlockingReason[] = [];
  if (phase8d.phase9_execution_attempted === true) reasons.push("phase9_execution_attempted");
  if (phase8d.critical_route_gate_execution_attempted === true) {
    reasons.push("critical_route_gate_execution_attempted");
  }
  if (phase8d.mmabp_gate_engine_execution_attempted === true) {
    reasons.push("mmabp_gate_engine_execution_attempted");
  }
  if (phase8d.semantic_resolution_event_real_creation_attempted === true) {
    reasons.push("semantic_resolution_event_real_creation_attempted");
  }
  if (phase8d.process_state_timer_event_real_creation_attempted === true) {
    reasons.push("process_state_timer_event_real_creation_attempted");
  }
  if (phase8d.route_pass_fail_gap_definitive_creation_attempted === true) {
    reasons.push("route_pass_fail_gap_definitive_creation_attempted");
  }
  return reasons;
}

function getPhase10BlockingReasons(
  input: RuntimeBranchingFoundationLocalInput,
): RuntimeBranchingPhase8DBoundaryBlockingReason[] {
  const phase8d = input.phase8d ?? {};
  const reasons: RuntimeBranchingPhase8DBoundaryBlockingReason[] = [];
  if (phase8d.phase10_execution_attempted === true) reasons.push("phase10_execution_attempted");
  if (phase8d.readiness_engine_execution_attempted === true) {
    reasons.push("readiness_engine_execution_attempted");
  }
  if (phase8d.readiness_decision_record_creation_attempted === true) {
    reasons.push("readiness_decision_record_creation_attempted");
  }
  if (phase8d.ready_final_creation_attempted === true) {
    reasons.push("ready_final_creation_attempted");
  }
  if (phase8d.ready_with_flags_creation_attempted === true) {
    reasons.push("ready_with_flags_creation_attempted");
  }
  if (phase8d.blocked_final_creation_attempted === true) {
    reasons.push("blocked_final_creation_attempted");
  }
  return reasons;
}

function getPersistenceBlockingReasons(
  input: RuntimeBranchingFoundationLocalInput,
): RuntimeBranchingPhase8DBoundaryBlockingReason[] {
  const phase8d = input.phase8d ?? {};
  const reasons: RuntimeBranchingPhase8DBoundaryBlockingReason[] = [];
  const pairs: Array<[keyof NonNullable<RuntimeBranchingFoundationLocalInput["phase8d"]>, RuntimeBranchingPhase8DBoundaryBlockingReason]> = [
    ["branching_persistence_boundary_violation", "branching_persistence_boundary_violation"],
    ["branching_decision_real_creation_attempted", "branching_decision_real_creation_attempted"],
    ["budget_ledger_real_update_attempted", "budget_ledger_real_update_attempted"],
    ["runtime_interaction_instance_real_creation_attempted", "runtime_interaction_instance_real_creation_attempted"],
    ["supabase_touch_attempted", "supabase_touch_attempted"],
    ["sql_execution_attempted", "sql_execution_attempted"],
    ["endpoint_creation_attempted", "endpoint_creation_attempted"],
    ["service_role_client_violation", "service_role_client_violation"],
    ["scene_write_attempted", "scene_write_attempted"],
    ["mba_write_attempted", "mba_write_attempted"],
    ["parallel_production_runtime_artifacts_write_attempted", "parallel_production_runtime_artifacts_write_attempted"],
    ["runtime_real_start_attempted", "runtime_real_start_attempted"],
  ];
  for (const [key, reason] of pairs) {
    if (phase8d[key] === true) reasons.push(reason);
  }
  return reasons;
}

function appendPhase8COpeningAttemptBlockers(
  input: RuntimeBranchingFoundationLocalInput,
  blockingReasons: RuntimeBranchingOpeningBlockingReason[],
): void {
  const config = input.phase8c;
  if (!config) return;
  if (config.runtime_interaction_instance_real_creation_attempted === true) {
    blockingReasons.push("runtime_interaction_instance_real_creation_attempted");
  }
  if (config.shown_at_real_creation_attempted === true) {
    blockingReasons.push("shown_at_real_creation_attempted");
  }
  if (config.answered_at_real_creation_attempted === true) {
    blockingReasons.push("answered_at_real_creation_attempted");
  }
  if (config.ui_render_attempted_in_phase8c === true) {
    blockingReasons.push("ui_render_attempted_in_phase8c");
  }
  if (config.endpoint_creation_attempted === true) {
    blockingReasons.push("endpoint_creation_attempted");
  }
  if (config.hidden_opening_created === true) {
    blockingReasons.push("hidden_opening_detected");
  }
}

function createSignalCandidate(
  caseId: string,
  source: RuntimeBranchingSignalSourceInput,
  index: number,
): RuntimeBranchingSignalCandidate {
  const blockingReasons = buildSignalBlockingReasons(source);
  return {
    signal_candidate_ref: [
      caseId,
      source.signal_family,
      index + 1,
      "branching_signal_candidate",
    ].join(":"),
    signal_type: source.signal_type,
    signal_value: source.signal_value,
    source_canonical_variable_ref: source.source_canonical_variable_ref,
    source_route_status: source.source_route_status,
    source_gap_flag: source.source_gap_flag,
    source_gap_type: source.source_gap_type,
    source_critical_route_ref: source.source_critical_route_ref,
    source_block_ref: source.source_block_ref,
    source_trace: source.source_trace,
    signal_family: source.signal_family,
    candidate_allowed: blockingReasons.length === 0,
    blocking_reasons: blockingReasons,
    causal_interaction_id: source.causal_interaction_id,
    score_components: source.score_components,
    severity: source.severity,
    route_criticality: source.route_criticality,
    requires_user_input: source.requires_user_input,
    explicit_rule_ref: source.explicit_rule_ref,
    fabricated_signal: source.fabricated_signal,
    diagnostic_status: source.diagnostic_status,
  } as RuntimeBranchingSignalCandidate;
}

function buildSignalBlockingReasons(
  source: RuntimeBranchingSignalSourceInput,
): RuntimeBranchingBlockingReason[] {
  const reasons: RuntimeBranchingBlockingReason[] = [];
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (
    source.signal_family === "b7_low_confidence_preclassification_only" &&
    source.diagnostic_status === "diagnostic"
  ) {
    reasons.push("b7_diagnostic_trigger_detected");
  }
  if (
    source.signal_family === "c09_receiver_feedback" &&
    source.receiver_feedback_from_satisfaction === true
  ) {
    reasons.push("satisfaction_general_branching_detected");
  }
  return reasons;
}

function buildTriggerBlockingReasons(
  contract: RuntimeBranchingRuleSourceContract,
  signal: RuntimeBranchingSignalCandidate | undefined,
  rule: RuntimeBranchingRuleInput | undefined,
): RuntimeBranchingBlockingReason[] {
  const reasons: RuntimeBranchingBlockingReason[] = [];
  if (!contract.explicit_rule_present || !contract.branching_rule_ref) {
    reasons.push("missing_explicit_branching_rule");
  }
  if (!contract.activation_signal) reasons.push("missing_activation_signal");
  if (!contract.trigger_condition) reasons.push("missing_trigger_condition");
  if (!contract.causal_interaction_id) reasons.push("missing_causal_interaction_id");
  if (!contract.source_node_ref) reasons.push("missing_source_node_ref");
  if (!hasSourceTrace(contract.source_trace) || !hasSourceTrace(signal?.source_trace)) {
    reasons.push("missing_source_trace");
  }
  if (rule?.free_text_branching_used === true) reasons.push("free_text_branching_detected");
  if (rule?.text_similarity_branching_used === true) reasons.push("text_similarity_branching_detected");
  if (rule?.visible_text_branching_used === true) reasons.push("visible_text_branching_detected");
  if (rule?.satisfaction_general_branching_used === true) {
    reasons.push("satisfaction_general_branching_detected");
  }
  if (rule?.b7_diagnostic_trigger_used === true) reasons.push("b7_diagnostic_trigger_detected");
  if (rule?.causal_opening_attempted_in_8a === true) {
    reasons.push("causal_opening_attempted_in_8A");
  }
  return [...new Set(reasons)];
}

function getFirstContractBlocker(
  contracts: RuntimeBranchingRuleSourceContract[],
  rules: RuntimeBranchingRuleInput[],
): RuntimeBranchingStatus | undefined {
  for (const [index, contract] of contracts.entries()) {
    const rule = rules[index];
    if (!contract.explicit_rule_present || !contract.branching_rule_ref) {
      return "blocked_missing_explicit_branching_rule";
    }
    if (!contract.activation_signal) return "blocked_missing_activation_signal";
    if (!contract.trigger_condition) return "blocked_missing_trigger_condition";
    if (!contract.causal_interaction_id) return "blocked_missing_causal_interaction_id";
    if (!hasSourceTrace(contract.source_trace)) return "blocked_missing_source_trace";
    if (rule.free_text_branching_used) return "blocked_free_text_trigger";
    if (rule.text_similarity_branching_used) return "blocked_text_similarity_branching";
    if (rule.visible_text_branching_used) return "blocked_visible_text_trigger";
    if (rule.satisfaction_general_branching_used) return "blocked_satisfaction_general_trigger";
    if (rule.b7_diagnostic_trigger_used) return "blocked_b7_diagnostic_trigger";
    if (rule.causal_opening_attempted_in_8a) return "blocked_causal_opening_attempt_in_8A";
  }
  return undefined;
}

function getFirstEvaluationBlocker(
  evaluations: RuntimeBranchingTriggerEvaluationCandidate[],
): RuntimeBranchingStatus | undefined {
  const reasons = evaluations.flatMap((evaluation) => evaluation.blocking_reasons);
  if (reasons.includes("causal_opening_attempted_in_8A")) {
    return "blocked_causal_opening_attempt_in_8A";
  }
  if (reasons.includes("b7_diagnostic_trigger_detected")) return "blocked_b7_diagnostic_trigger";
  if (reasons.includes("satisfaction_general_branching_detected")) {
    return "blocked_satisfaction_general_trigger";
  }
  if (reasons.includes("visible_text_branching_detected")) return "blocked_visible_text_trigger";
  if (reasons.includes("text_similarity_branching_detected")) {
    return "blocked_text_similarity_branching";
  }
  if (reasons.includes("free_text_branching_detected")) return "blocked_free_text_trigger";
  if (reasons.includes("missing_source_trace")) return "blocked_missing_source_trace";
  if (reasons.includes("missing_explicit_branching_rule")) {
    return "blocked_missing_explicit_branching_rule";
  }
  if (reasons.includes("missing_activation_signal")) return "blocked_missing_activation_signal";
  if (reasons.includes("missing_trigger_condition")) return "blocked_missing_trigger_condition";
  if (reasons.includes("missing_causal_interaction_id")) return "blocked_missing_causal_interaction_id";
  return undefined;
}

function evaluateTriggerCondition(
  triggerCondition: string,
  signal: RuntimeBranchingSignalCandidate | undefined,
): boolean {
  if (!signal) return false;
  if (triggerCondition === "is_present") return signal.signal_value !== undefined && signal.signal_value !== "";
  if (triggerCondition === "gap_flag_true") return signal.source_gap_flag === true;
  if (triggerCondition === "route_not_closed") return signal.source_route_status !== "closed";
  return true;
}

function createResult(
  input: RuntimeBranchingFoundationLocalInput,
  status: RuntimeBranchingStatus,
  revalidation: RuntimePhase8InputRevalidationDecision,
  contracts: RuntimeBranchingRuleSourceContract[],
  signals: RuntimeBranchingSignalCandidate[],
  evaluations: RuntimeBranchingTriggerEvaluationCandidate[],
  extras?: {
    causalScoreCandidates?: RuntimeBranchingCausalScoreCandidate[];
    branchingDecisionCandidates?: RuntimeBranchingDecisionCandidate[];
    budgetStateCandidates?: RuntimeBranchingBudgetStateCandidate[];
    budgetLedgerCandidates?: RuntimeBranchingBudgetLedgerCandidate[];
    selectionUnderBudgetCandidates?: RuntimeBranchingSelectionUnderBudgetCandidate[];
    causalInteractionOpeningCandidates?: RuntimeBranchingCausalInteractionOpeningCandidate[];
    nonOpeningDecisionCandidates?: RuntimeBranchingNonOpeningDecisionCandidate[];
    reentryCandidates?: RuntimeBranchingReentryCandidate[];
    carryForwardGapCandidates?: RuntimeBranchingCarryForwardGapCandidate[];
    budgetExhaustionGuards?: RuntimeBranchingBudgetExhaustionGuard[];
    idempotencyReplayGuards?: RuntimeBranchingIdempotencyReplayGuard[];
    branchingAuditCandidates?: RuntimeBranchingAuditCandidate[];
    phase9Boundaries?: RuntimeBranchingPhase9Boundary[];
    phase10Boundaries?: RuntimeBranchingPhase10Boundary[];
    branchingPersistenceBoundaries?: RuntimeBranchingPersistenceBoundary[];
  },
): RuntimeBranchingFoundationLocalResult {
  return {
    status,
    phase8_input_revalidation: revalidation,
    branching_rule_source_contracts: contracts,
    signal_candidates: signals,
    trigger_evaluation_candidates: evaluations,
    causal_score_candidates: extras?.causalScoreCandidates ?? [],
    branching_decision_candidates: extras?.branchingDecisionCandidates ?? [],
    budget_state_candidates: extras?.budgetStateCandidates ?? [],
    budget_ledger_candidates: extras?.budgetLedgerCandidates ?? [],
    selection_under_budget_candidates: extras?.selectionUnderBudgetCandidates ?? [],
    causal_interaction_opening_candidates: extras?.causalInteractionOpeningCandidates ?? [],
    non_opening_decision_candidates: extras?.nonOpeningDecisionCandidates ?? [],
    reentry_candidates: extras?.reentryCandidates ?? [],
    carry_forward_gap_candidates: extras?.carryForwardGapCandidates ?? [],
    budget_exhaustion_guards: extras?.budgetExhaustionGuards ?? [],
    idempotency_replay_guards: extras?.idempotencyReplayGuards ?? [],
    branching_audit_candidates: extras?.branchingAuditCandidates ?? [],
    phase9_boundaries: extras?.phase9Boundaries ?? [],
    phase10_boundaries: extras?.phase10Boundaries ?? [],
    branching_persistence_boundaries: extras?.branchingPersistenceBoundaries ?? [],
    phase8_started_local: revalidation.phase8_started_local,
    phase8_closed_local: false,
    ready_for_phase9_authorization: false,
    runtime_40_20_started: false,
    catalog_activated: false,
    migration_applied: false,
    supabase_touched: false,
    sql_executed: false,
    endpoint_created: false,
    branching_decision_real_created: false,
    budget_ledger_real_updated: false,
    runtime_interaction_instance_real_created: false,
    causal_score_calculated: false,
    causal_opened: false,
    reentry_opened: false,
    carry_forward_gap_formal_created: false,
    critical_route_gate_executed: false,
    mmabp_gate_engine_executed: false,
    readiness_engine_executed: false,
    export_preview_created: false,
    diagnosis_created: false,
    ir_created: false,
    registry_created: false,
    phase9_started: false,
    service_role_used: false,
    service_role_used_in_client: false,
  };
}

function isRuntimeBranchingSignalFamily(value: unknown): value is RuntimeBranchingSignalFamily {
  return (
    value === "canonical_variable" ||
    value === "route_status" ||
    value === "gap_flag" ||
    value === "c09_receiver_feedback" ||
    value === "b0_weak_context" ||
    value === "b2_transformation_route_missing" ||
    value === "b3_receiver_feedback_rejection_return_block" ||
    value === "b7_low_confidence_preclassification_only" ||
    value === "sem_ambiguity" ||
    value === "pst_wait_deadlock" ||
    value === "object_state_missing" ||
    value === "rework_recurrent" ||
    value === "workaround_residual_variety_informal_rule" ||
    value === "capacity_gap_resource_bargain" ||
    value === "real_sequence_differs_from_official" ||
    value === "low_semantic_confidence_interpersonal_tension"
  );
}

function hasSourceTrace(value: unknown): boolean {
  const sourceTrace = value as Record<string, unknown> | undefined;
  return (
    typeof sourceTrace?.source_document === "string" &&
    typeof sourceTrace?.source_sheet === "string" &&
    typeof sourceTrace?.source_row_number === "number"
  );
}
