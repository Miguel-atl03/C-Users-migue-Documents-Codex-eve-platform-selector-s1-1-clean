import type {
  ActivityRuntimeRunState,
  RuntimeInteractionInstanceState,
} from "./runtime-40-20-domain-state-types";

export const ACTIVITY_RUN_ALLOWED_TRANSITIONS: Array<{
  from: ActivityRuntimeRunState;
  to: ActivityRuntimeRunState;
}> = [
  transition("initialized", "semantic_preload_loaded"),
  transition("semantic_preload_loaded", "b0_confirmation_pending"),
  transition("b0_confirmation_pending", "active_base_capture"),
  transition("b0_confirmation_pending", "blocked"),
  transition("active_base_capture", "base_complete"),
  transition("active_base_capture", "reentry_required"),
  transition("active_base_capture", "manual_review_required"),
  transition("base_complete", "causal_evaluation_pending"),
  transition("causal_evaluation_pending", "active_causal_capture"),
  transition("causal_evaluation_pending", "readiness_evaluation"),
  transition("active_causal_capture", "causal_evaluation_pending"),
  transition("active_causal_capture", "readiness_evaluation"),
  transition("readiness_evaluation", "ready"),
  transition("readiness_evaluation", "ready_with_flags"),
  transition("readiness_evaluation", "blocked"),
  transition("readiness_evaluation", "reentry_required"),
  transition("readiness_evaluation", "manual_review_required"),
  transition("ready", "exported_to_parallel_production"),
  transition("ready_with_flags", "exported_to_parallel_production"),
  transition("ready_with_flags", "manual_review_required"),
  transition("blocked", "reentry_required"),
  transition("blocked", "manual_review_required"),
  transition("manual_review_required", "active_base_capture"),
  transition("manual_review_required", "active_causal_capture"),
  transition("manual_review_required", "archived"),
  transition("exported_to_parallel_production", "archived"),
];

export const INTERACTION_INSTANCE_ALLOWED_TRANSITIONS: Array<{
  from: RuntimeInteractionInstanceState;
  to: RuntimeInteractionInstanceState;
}> = [
  interactionTransition("pending", "shown"),
  interactionTransition("pending", "skipped_by_rule"),
  interactionTransition("pending", "closed_by_other"),
  interactionTransition("shown", "answered"),
  interactionTransition("shown", "blocked"),
  interactionTransition("answered", "confirmed"),
  interactionTransition("answered", "corrected"),
  interactionTransition("answered", "inferred_unconfirmed"),
  interactionTransition("confirmed", "closed_by_other"),
  interactionTransition("confirmed", "reopened"),
  interactionTransition("corrected", "reopened"),
  interactionTransition("corrected", "closed_by_other"),
  interactionTransition("inferred_unconfirmed", "confirmed"),
  interactionTransition("inferred_unconfirmed", "corrected"),
  interactionTransition("inferred_unconfirmed", "blocked"),
  interactionTransition("blocked", "reopened"),
  interactionTransition("reopened", "shown"),
];

export function canTransitionActivityRun(
  from: ActivityRuntimeRunState,
  to: ActivityRuntimeRunState,
): boolean {
  return ACTIVITY_RUN_ALLOWED_TRANSITIONS.some(
    (transitionItem) => transitionItem.from === from && transitionItem.to === to,
  );
}

export function canTransitionInteractionInstance(
  from: RuntimeInteractionInstanceState,
  to: RuntimeInteractionInstanceState,
): boolean {
  return INTERACTION_INSTANCE_ALLOWED_TRANSITIONS.some(
    (transitionItem) => transitionItem.from === from && transitionItem.to === to,
  );
}

export function validateBudget4020(input: {
  base_visible_count: number;
  causal_visible_count: number;
  selected_primary_activity_count?: number;
}): {
  ok: boolean;
  blockers: string[];
} {
  const blockers: string[] = [];

  if (input.base_visible_count > 40) blockers.push("base_visible_count_exceeds_40");
  if (input.causal_visible_count > 20) {
    blockers.push("causal_visible_count_exceeds_20");
  }
  if (
    input.selected_primary_activity_count !== undefined &&
    input.selected_primary_activity_count > 8
  ) {
    blockers.push("selected_primary_activity_count_exceeds_8");
  }

  return {
    ok: blockers.length === 0,
    blockers,
  };
}

export function assertRuntimeDomainNoGoBoundary(input: {
  migration_applied?: boolean;
  catalog_activated?: boolean;
  runtime_40_20_started?: boolean;
  supabase_touched?: boolean;
  sql_executed?: boolean;
  endpoint_created?: boolean;
  real_runtime_records_created?: boolean;
  business_evidence_created?: boolean;
  registry_live_db_created?: boolean;
  ir_real_created?: boolean;
  object_inventory_real_opened?: boolean;
  f5c_real_opened?: boolean;
  export_created?: boolean;
  diagnosis_created?: boolean;
  delivered_created?: boolean;
}): {
  ok: boolean;
  blockers: string[];
} {
  const blockers = Object.entries(input)
    .filter(([, value]) => value === true)
    .map(([key]) => `${key}_forbidden`);

  return {
    ok: blockers.length === 0,
    blockers,
  };
}

function transition(
  from: ActivityRuntimeRunState,
  to: ActivityRuntimeRunState,
): { from: ActivityRuntimeRunState; to: ActivityRuntimeRunState } {
  return { from, to };
}

function interactionTransition(
  from: RuntimeInteractionInstanceState,
  to: RuntimeInteractionInstanceState,
): {
  from: RuntimeInteractionInstanceState;
  to: RuntimeInteractionInstanceState;
} {
  return { from, to };
}
