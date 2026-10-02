import type {
  RuntimeCanonicalVariableRecordCandidate,
  RuntimeCanonicalVariableServiceLocalResult,
} from "../canonical-variable/runtime-40-20-canonical-variable-types";
import type { RuntimeInteractionDefinitionCandidate } from "../catalog-canonicalization/runtime-40-20-catalog-canonicalization-types";
import type {
  RuntimeBranchingAuditCandidate,
  RuntimeBranchingBudgetPreview,
  RuntimeBranchingDecisionCandidate,
  RuntimeBranchingEngineLocalInput,
  RuntimeBranchingEngineLocalResult,
  RuntimeBranchingEngineStatus,
  RuntimeBranchingNoGoCheck,
  RuntimeBranchingRuleEvaluation,
  RuntimeBranchingRuleInput,
  RuntimeBranchingRuleOperator,
  RuntimeCausalInteractionActivationCandidate,
} from "./runtime-40-20-branching-types";

const ALLOWED_OPERATORS: RuntimeBranchingRuleOperator[] = [
  "equals",
  "not_equals",
  "is_present",
  "is_absent",
  "contains_exact",
  "greater_than",
  "less_than",
  "in_set",
];

export function createRuntime4020BranchingCandidatesLocal(
  input: RuntimeBranchingEngineLocalInput,
): RuntimeBranchingEngineLocalResult {
  const canonicalBlocker = getCanonicalVariableBlocker(
    input.canonical_variable_result,
  );
  if (canonicalBlocker) {
    return createResult(input, canonicalBlocker, [], [], []);
  }

  if (input.branching_rules.length === 0) {
    return createResult(input, "blocked_missing_explicit_branching_rule", [], [], []);
  }

  const ruleEvaluations: RuntimeBranchingRuleEvaluation[] = [];
  const provisionalDecisions: RuntimeBranchingDecisionCandidate[] = [];
  let branchingStatus: RuntimeBranchingEngineStatus = "branching_candidates_ready";

  for (const rule of input.branching_rules) {
    if (!isExplicitRule(rule)) {
      branchingStatus = firstBlockingStatus(
        branchingStatus,
        "blocked_missing_explicit_branching_rule",
      );
      continue;
    }

    const variableCandidate = findVariableCandidate(
      input.canonical_variable_result.canonical_variable_record_candidates,
      rule.trigger_canonical_variable_id,
    );
    const evaluation = createRuleEvaluation(input, rule, variableCandidate);
    ruleEvaluations.push(evaluation);

    if (evaluation.evaluation_status === "manual_review_required_unknown_operator") {
      branchingStatus = firstBlockingStatus(
        branchingStatus,
        "manual_review_required_unknown_operator",
      );
      continue;
    }
    if (evaluation.evaluation_status === "blocked_missing_variable_candidate") {
      branchingStatus = firstBlockingStatus(
        branchingStatus,
        "blocked_missing_explicit_branching_rule",
      );
      continue;
    }
    if (!evaluation.matched) continue;

    const targetDefinition = findTargetCausalInteraction(
      input.interaction_definitions,
      rule.target_causal_interaction_id,
    );
    if (!targetDefinition) {
      branchingStatus = firstBlockingStatus(
        branchingStatus,
        "blocked_missing_target_causal_interaction",
      );
      provisionalDecisions.push(
        createDecisionCandidate(rule, evaluation, "blocked_missing_target_causal_interaction"),
      );
      continue;
    }

    provisionalDecisions.push(
      createDecisionCandidate(rule, evaluation, "causal_activation_candidate_ready"),
    );
  }

  const readyDecisions = provisionalDecisions.filter(
    (decision) => decision.decision_status === "causal_activation_candidate_ready",
  );
  const matchedReadyDecisionCount = readyDecisions.length;
  const budgetExceeded =
    getCausalAlreadyPlanned(input) + matchedReadyDecisionCount > 20;
  const decisionCandidates = budgetExceeded
    ? provisionalDecisions.map((decision) =>
        decision.decision_status === "causal_activation_candidate_ready"
          ? { ...decision, decision_status: "blocked_causal_budget_exceeded" as const }
          : decision,
      )
    : provisionalDecisions;
  const activationCandidates = budgetExceeded
    ? []
    : readyDecisions.map(createActivationCandidate);

  if (budgetExceeded) {
    branchingStatus = firstBlockingStatus(
      branchingStatus,
      "blocked_causal_budget_exceeded",
    );
  }

  return createResult(
    input,
    branchingStatus,
    ruleEvaluations,
    decisionCandidates,
    activationCandidates,
    matchedReadyDecisionCount,
  );
}

function getCanonicalVariableBlocker(
  canonicalVariableResult: RuntimeCanonicalVariableServiceLocalResult,
): RuntimeBranchingEngineStatus | undefined {
  if (!canonicalVariableResult.ok) return "blocked_canonical_variables_not_ready";
  if (canonicalVariableResult.no_go_check.runtime_40_20_started !== false) {
    return "blocked_canonical_variables_not_ready";
  }
  if (canonicalVariableResult.no_go_check.supabase_touched !== false) {
    return "blocked_canonical_variables_not_ready";
  }
  if (canonicalVariableResult.no_go_check.sql_executed !== false) {
    return "blocked_canonical_variables_not_ready";
  }
  if (canonicalVariableResult.no_go_check.endpoint_created !== false) {
    return "blocked_canonical_variables_not_ready";
  }
  if (
    canonicalVariableResult.no_go_check.real_canonical_variable_record_created !== false
  ) {
    return "blocked_canonical_variables_not_ready";
  }
  if (canonicalVariableResult.no_go_check.ir_real_created !== false) {
    return "blocked_canonical_variables_not_ready";
  }
  if (canonicalVariableResult.no_go_check.object_inventory_real_opened !== false) {
    return "blocked_canonical_variables_not_ready";
  }

  return undefined;
}

function isExplicitRule(rule: RuntimeBranchingRuleInput): boolean {
  return Boolean(
    rule.branching_rule_id &&
      rule.source_node_ref &&
      rule.source_document &&
      rule.source_sheet &&
      typeof rule.source_row_number === "number" &&
      rule.trigger_canonical_variable_id &&
      rule.trigger_operator &&
      rule.target_causal_interaction_id &&
      rule.budget_bucket === "causal_20",
  );
}

function createRuleEvaluation(
  input: RuntimeBranchingEngineLocalInput,
  rule: RuntimeBranchingRuleInput,
  variableCandidate: RuntimeCanonicalVariableRecordCandidate | undefined,
): RuntimeBranchingRuleEvaluation {
  const operatorAllowed = ALLOWED_OPERATORS.some(
    (operator) => operator === rule.trigger_operator,
  );
  const evaluationId = `${input.case_id}:${rule.branching_rule_id}:branching_rule_evaluation`;

  if (!operatorAllowed) {
    return {
      evaluation_id: evaluationId,
      branching_rule_id: rule.branching_rule_id,
      trigger_canonical_variable_id: rule.trigger_canonical_variable_id,
      trigger_operator: rule.trigger_operator,
      evaluated: false,
      matched: false,
      evaluation_status: "manual_review_required_unknown_operator",
      source_trace: createRuleSourceTrace(rule),
      free_inference_used: false,
      semantic_fallback_used: false,
      fuzzy_match_used: false,
    };
  }

  if (!variableCandidate) {
    return {
      evaluation_id: evaluationId,
      branching_rule_id: rule.branching_rule_id,
      trigger_canonical_variable_id: rule.trigger_canonical_variable_id,
      trigger_operator: rule.trigger_operator,
      evaluated: false,
      matched: false,
      evaluation_status: "blocked_missing_variable_candidate",
      source_trace: createRuleSourceTrace(rule),
      free_inference_used: false,
      semantic_fallback_used: false,
      fuzzy_match_used: false,
    };
  }

  return {
    evaluation_id: evaluationId,
    branching_rule_id: rule.branching_rule_id,
    trigger_canonical_variable_id: rule.trigger_canonical_variable_id,
    trigger_operator: rule.trigger_operator,
    evaluated: true,
    matched: evaluateRuleValue(
      variableCandidate.value,
      rule.trigger_operator as RuntimeBranchingRuleOperator,
      rule.trigger_value,
    ),
    evaluation_status: "evaluation_ready",
    source_trace: createRuleSourceTrace(rule),
    free_inference_used: false,
    semantic_fallback_used: false,
    fuzzy_match_used: false,
  };
}

function evaluateRuleValue(
  candidateValue: unknown,
  operator: RuntimeBranchingRuleOperator,
  triggerValue: unknown,
): boolean {
  if (operator === "equals") return candidateValue === triggerValue;
  if (operator === "not_equals") return candidateValue !== triggerValue;
  if (operator === "is_present") return isPresent(candidateValue);
  if (operator === "is_absent") return !isPresent(candidateValue);
  if (operator === "contains_exact") {
    return Array.isArray(candidateValue)
      ? candidateValue.some((value) => value === triggerValue)
      : candidateValue === triggerValue;
  }
  if (operator === "greater_than") {
    return typeof candidateValue === "number" && typeof triggerValue === "number"
      ? candidateValue > triggerValue
      : false;
  }
  if (operator === "less_than") {
    return typeof candidateValue === "number" && typeof triggerValue === "number"
      ? candidateValue < triggerValue
      : false;
  }
  if (operator === "in_set") {
    return Array.isArray(triggerValue)
      ? triggerValue.some((value) => value === candidateValue)
      : false;
  }

  return false;
}

function isPresent(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;

  return true;
}

function findVariableCandidate(
  candidates: RuntimeCanonicalVariableRecordCandidate[],
  canonicalVariableId: string,
): RuntimeCanonicalVariableRecordCandidate | undefined {
  return candidates.find(
    (candidate) => candidate.canonical_variable_id === canonicalVariableId,
  );
}

function findTargetCausalInteraction(
  definitions: RuntimeInteractionDefinitionCandidate[],
  targetCausalInteractionId: string,
): RuntimeInteractionDefinitionCandidate | undefined {
  return definitions.find(
    (definition) =>
      definition.runtime_interaction_id === targetCausalInteractionId &&
      definition.interaction_group === "causal",
  );
}

function createDecisionCandidate(
  rule: RuntimeBranchingRuleInput,
  evaluation: RuntimeBranchingRuleEvaluation,
  decisionStatus: RuntimeBranchingDecisionCandidate["decision_status"],
): RuntimeBranchingDecisionCandidate {
  return {
    branching_decision_ref: `${evaluation.evaluation_id}:${rule.target_causal_interaction_id}:branching_decision_candidate`,
    branching_rule_id: rule.branching_rule_id,
    trigger_canonical_variable_id: rule.trigger_canonical_variable_id,
    target_causal_interaction_id: rule.target_causal_interaction_id,
    decision_status: decisionStatus,
    rule_evaluation_ref: evaluation.evaluation_id,
    exact_rule_used: true,
    free_inference_used: false,
    semantic_fallback_used: false,
    fuzzy_match_used: false,
    real_branching_decision_created: false,
  };
}

function createActivationCandidate(
  decision: RuntimeBranchingDecisionCandidate,
): RuntimeCausalInteractionActivationCandidate {
  return {
    activation_candidate_ref: `${decision.branching_decision_ref}:activation_candidate`,
    target_causal_interaction_id: decision.target_causal_interaction_id,
    source_branching_decision_ref: decision.branching_decision_ref,
    source_branching_rule_id: decision.branching_rule_id,
    activation_status: "activation_candidate_ready",
    runtime_interaction_instance_real_created: false,
    budget_consumed_real: false,
  };
}

function createResult(
  input: RuntimeBranchingEngineLocalInput,
  branchingStatus: RuntimeBranchingEngineStatus,
  ruleEvaluations: RuntimeBranchingRuleEvaluation[],
  decisionCandidates: RuntimeBranchingDecisionCandidate[],
  activationCandidates: RuntimeCausalInteractionActivationCandidate[],
  causalActivationAttempted = 0,
): RuntimeBranchingEngineLocalResult {
  const blockers =
    branchingStatus === "branching_candidates_ready" ? [] : [branchingStatus];
  const budgetPreview = createBudgetPreview(
    input,
    causalActivationAttempted,
    activationCandidates.length,
  );
  const ok = blockers.length === 0;

  return {
    ok,
    case_id: input.case_id,
    branching_status: branchingStatus,
    rule_evaluations: ruleEvaluations,
    decision_candidates: decisionCandidates,
    activation_candidates: activationCandidates,
    budget_preview: budgetPreview,
    audit_candidate: createAuditCandidate(
      input,
      ruleEvaluations.length,
      decisionCandidates.length,
      activationCandidates.length,
      ok,
    ),
    no_go_check: createNoGoCheck(blockers),
    blocked_reason: ok ? undefined : branchingStatus,
    packaging_hygiene: {
      empty_windows_path_entries_removed_or_absent: true,
      material_files_only_required_for_next_bundle: true,
      posix_paths_required_for_next_bundle: true,
    },
    materiality: {
      level: "runtime_40_20_branching_engine_local_contract",
      local_only: true,
      real_branching_decision_created: false,
      real_budget_ledger_created: false,
      real_interaction_instance_created: false,
      runtime_40_20_started: false,
      next_authorization_required: true,
    },
  };
}

function createBudgetPreview(
  input: RuntimeBranchingEngineLocalInput,
  causalActivationAttempted: number,
  causalNewlyActivated: number,
): RuntimeBranchingBudgetPreview {
  const causalAlreadyPlanned = getCausalAlreadyPlanned(input);
  const causalTotalAttempted = causalAlreadyPlanned + causalActivationAttempted;
  const causalBudgetExceeded = causalTotalAttempted > 20;

  return {
    causal_limit: 20,
    causal_already_planned: causalAlreadyPlanned,
    causal_newly_activated: causalBudgetExceeded
      ? causalActivationAttempted
      : causalNewlyActivated,
    causal_activation_attempted: causalActivationAttempted,
    causal_remaining: Math.max(20 - causalTotalAttempted, 0),
    causal_budget_exceeded: causalBudgetExceeded,
    budget_ledger_real_created: false,
    budget_consumed_real: false,
  };
}

function getCausalAlreadyPlanned(input: RuntimeBranchingEngineLocalInput): number {
  return typeof input.causal_already_planned === "number"
    ? input.causal_already_planned
    : 0;
}

function createAuditCandidate(
  input: RuntimeBranchingEngineLocalInput,
  ruleEvaluationsCreated: number,
  decisionCandidatesCreated: number,
  activationCandidatesCreated: number,
  ok: boolean,
): RuntimeBranchingAuditCandidate {
  return {
    branching_audit_ref: `${input.case_id}:branching_audit_candidate`,
    action: ok ? "branching_candidates_created" : "branching_blocked",
    rule_evaluations_created: ruleEvaluationsCreated,
    decision_candidates_created: decisionCandidatesCreated,
    activation_candidates_created: activationCandidatesCreated,
    real_audit_record_created: false,
    metadata: {
      explicit_rule_required: true,
      exact_variable_match_required: true,
      exact_target_interaction_match_required: true,
      causal_limit: 20,
      local_only: true,
    },
  };
}

function createNoGoCheck(blockers: string[]): RuntimeBranchingNoGoCheck {
  return {
    no_go_triggered: blockers.length > 0,
    blockers,
    runtime_40_20_started: false,
    catalog_activated: false,
    migration_applied: false,
    supabase_touched: false,
    sql_executed: false,
    endpoint_created: false,
    real_branching_decision_created: false,
    real_budget_ledger_created: false,
    real_interaction_instance_created: false,
    real_response_persisted: false,
    real_subfield_response_created: false,
    real_evidence_item_created: false,
    real_canonical_variable_record_created: false,
    real_audit_record_created: false,
    real_runtime_records_created: false,
    business_evidence_created: false,
    registry_live_db_created: false,
    ir_real_created: false,
    object_inventory_real_opened: false,
    f5c_real_opened: false,
    export_created: false,
    diagnosis_created: false,
    delivered_created: false,
  };
}

function firstBlockingStatus(
  current: RuntimeBranchingEngineStatus,
  next: RuntimeBranchingEngineStatus,
): RuntimeBranchingEngineStatus {
  return current === "branching_candidates_ready" ? next : current;
}

function createRuleSourceTrace(rule: RuntimeBranchingRuleInput) {
  return {
    source_node_ref: rule.source_node_ref,
    source_document: rule.source_document,
    source_sheet: rule.source_sheet,
    source_row_number: rule.source_row_number,
    raw_row: rule.raw_row,
  };
}
