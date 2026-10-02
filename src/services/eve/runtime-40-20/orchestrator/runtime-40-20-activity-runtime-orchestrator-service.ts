import type {
  ActivityRuntimeOrchestratorLocalInput,
  ActivityRuntimeOrchestratorLocalResult,
  ActivityRuntimeOrchestratorNoGoCheck,
  ActivityRuntimeOrchestratorReadinessPrecheck,
  ActivityRuntimeRunPlan,
  Budget4020LedgerPreview,
  NextInteractionDecision,
  PrimaryActivitySelectionPlan,
  RoleRuntimeSessionPlan,
  RuntimeInteractionQueuePlan,
} from "./runtime-40-20-activity-runtime-orchestrator-types";

export function createActivityRuntimeOrchestratorLocalPlan(
  input: ActivityRuntimeOrchestratorLocalInput,
): ActivityRuntimeOrchestratorLocalResult {
  const baseRefs = getInteractionRefs(input, "base");
  const causalRefs = getInteractionRefs(input, "causal");
  const blockers = createBlockers(input, baseRefs, causalRefs);
  const noGoCheck = createNoGoCheck(blockers);
  const readinessPrecheck = createReadinessPrecheck(input, baseRefs, causalRefs, blockers);
  const roleRuntimeSessionPlan = createRoleRuntimeSessionPlan(input);
  const primaryActivitySelectionPlan = createPrimaryActivitySelectionPlan(input);
  const ok = blockers.length === 0;
  const activityRuntimeRunPlans = ok ? input.primary_activities.map((activity) =>
    createActivityRuntimeRunPlan(input, activity),
  ) : [];
  const interactionQueuePlans = activityRuntimeRunPlans.map((runPlan) =>
    createInteractionQueuePlan(runPlan.run_plan_id, baseRefs, causalRefs),
  );
  const nextInteractionDecisions = activityRuntimeRunPlans.map((runPlan) =>
    createNextInteractionDecision(runPlan),
  );
  const budgetLedgerPreviews = activityRuntimeRunPlans.map((runPlan) =>
    createBudgetPreview(runPlan.run_plan_id),
  );

  return {
    ok,
    case_id: input.case_id,
    role_runtime_session_plan: roleRuntimeSessionPlan,
    primary_activity_selection_plan: primaryActivitySelectionPlan,
    activity_runtime_run_plans: activityRuntimeRunPlans,
    interaction_queue_plans: interactionQueuePlans,
    next_interaction_decisions: nextInteractionDecisions,
    budget_ledger_previews: budgetLedgerPreviews,
    readiness_precheck: readinessPrecheck,
    no_go_check: noGoCheck,
    blocked_reason: ok ? undefined : blockers[0],
    materiality: {
      level: "runtime_40_20_activity_runtime_orchestrator_local_contract",
      local_only: true,
      runtime_40_20_started: false,
      next_authorization_required: true,
    },
  };
}

function createBlockers(
  input: ActivityRuntimeOrchestratorLocalInput,
  baseRefs: string[],
  causalRefs: string[],
): string[] {
  const blockers: string[] = [];
  const canonicalization = input.catalog_canonicalization_result;

  if (!canonicalization.ok) blockers.push("catalog_canonicalization_result_not_ok");
  if (!input.state_machine_contract_ready) {
    blockers.push("state_machine_contract_not_ready");
  }
  if (canonicalization.canonical_model.interaction_definitions.length !== 60) {
    blockers.push("interaction_definition_count_not_60");
  }
  if (baseRefs.length !== 40) blockers.push("base_interaction_count_not_40");
  if (causalRefs.length !== 20) blockers.push("causal_interaction_count_not_20");
  if (input.primary_activities.length > 8) {
    blockers.push("primary_activity_limit_exceeded");
  }

  return blockers;
}

function createRoleRuntimeSessionPlan(
  input: ActivityRuntimeOrchestratorLocalInput,
): RoleRuntimeSessionPlan {
  const secondaryCount =
    (input.secondary_activities ?? []).length +
    (input.context_only_activities ?? []).length;

  return {
    session_plan_id: `${input.case_id}:${input.role_id}:role_runtime_session_plan`,
    case_id: input.case_id,
    role_id: input.role_id,
    catalog_version_ref: input.catalog_version_ref,
    primary_activity_limit: 8,
    selected_primary_activity_count: input.primary_activities.length,
    secondary_activity_count: secondaryCount,
    state: input.primary_activities.length > 0 ? "active" : "draft",
    runtime_40_20_started: false,
    metadata: {
      local_only: true,
      real_session_created: false,
    },
  };
}

function createPrimaryActivitySelectionPlan(
  input: ActivityRuntimeOrchestratorLocalInput,
): PrimaryActivitySelectionPlan {
  return {
    primary_activities: input.primary_activities,
    secondary_activities: input.secondary_activities ?? [],
    context_only_activities: input.context_only_activities ?? [],
    primary_activity_limit_exceeded: input.primary_activities.length > 8,
    preserved_non_primary_context: true,
  };
}

function createActivityRuntimeRunPlan(
  input: ActivityRuntimeOrchestratorLocalInput,
  activity: ActivityRuntimeOrchestratorLocalInput["primary_activities"][number],
): ActivityRuntimeRunPlan {
  return {
    run_plan_id: `${input.case_id}:${activity.activity_id}:activity_runtime_run_plan`,
    case_id: input.case_id,
    role_id: activity.role_id,
    activity_id: activity.activity_id,
    activity_label: activity.activity_label,
    initial_state: "initialized",
    allowed_first_transition: {
      from: "initialized",
      to: "semantic_preload_loaded",
    },
    semantic_preload_present: activity.semantic_preload_present,
    runtime_run_created_real: false,
  };
}

function createInteractionQueuePlan(
  runPlanId: string,
  baseRefs: string[],
  causalRefs: string[],
): RuntimeInteractionQueuePlan {
  return {
    run_plan_id: runPlanId,
    base_interaction_count: 40,
    causal_interaction_count: 20,
    base_queue_state: "pending",
    causal_queue_state: "pending_by_rule",
    base_interaction_refs: baseRefs,
    causal_interaction_refs: causalRefs,
    branching_evaluated: false,
    real_interaction_instances_created: false,
  };
}

function createNextInteractionDecision(
  runPlan: ActivityRuntimeRunPlan,
): NextInteractionDecision {
  if (runPlan.semantic_preload_present) {
    return {
      run_plan_id: runPlan.run_plan_id,
      activity_id: runPlan.activity_id,
      decision_type: "semantic_preload_ready",
      next_state_hint: "semantic_preload_loaded",
      next_interaction_hint: "B0_confirmation",
      ui_rendered: false,
    };
  }

  return {
    run_plan_id: runPlan.run_plan_id,
    activity_id: runPlan.activity_id,
    decision_type: "requires_semantic_preload",
    next_state_hint: "initialized",
    next_interaction_hint: "requires_semantic_preload",
    ui_rendered: false,
  };
}

function createBudgetPreview(runPlanId: string): Budget4020LedgerPreview {
  return {
    run_plan_id: runPlanId,
    base_limit: 40,
    causal_limit: 20,
    base_planned_count: 40,
    causal_planned_count: 20,
    base_consumed: 0,
    causal_consumed: 0,
    budget_consumed_real: false,
  };
}

function createReadinessPrecheck(
  input: ActivityRuntimeOrchestratorLocalInput,
  baseRefs: string[],
  causalRefs: string[],
  blockers: string[],
): ActivityRuntimeOrchestratorReadinessPrecheck {
  return {
    catalog_canonicalization_consumed: input.catalog_canonicalization_result.ok,
    state_machine_contract_consumed: input.state_machine_contract_ready,
    interaction_definition_count:
      input.catalog_canonicalization_result.canonical_model.interaction_definitions.length,
    base_interaction_count: baseRefs.length,
    causal_interaction_count: causalRefs.length,
    primary_activity_limit_valid: input.primary_activities.length <= 8,
    ready_for_local_orchestration: blockers.length === 0,
    ready_for_runtime_start: false,
    blockers,
  };
}

function createNoGoCheck(blockers: string[]): ActivityRuntimeOrchestratorNoGoCheck {
  return {
    no_go_triggered: blockers.length > 0,
    blockers,
    runtime_40_20_started: false,
    catalog_activated: false,
    migration_applied: false,
    supabase_touched: false,
    sql_executed: false,
    endpoint_created: false,
    real_runtime_records_created: false,
    real_interaction_instances_created: false,
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

function getInteractionRefs(
  input: ActivityRuntimeOrchestratorLocalInput,
  group: "base" | "causal",
): string[] {
  return input.catalog_canonicalization_result.canonical_model.interaction_definitions
    .filter((interaction) => interaction.interaction_group === group)
    .map((interaction) => interaction.runtime_interaction_id);
}
