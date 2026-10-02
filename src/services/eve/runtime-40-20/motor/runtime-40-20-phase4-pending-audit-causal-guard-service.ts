import type {
  RuntimePhase4PendingAuditAction,
  RuntimePhase4PendingAuditCandidate,
  RuntimePhase4PendingAuditCausalGuardLocalInput,
  RuntimePhase4PendingAuditCausalGuardLocalResult,
  RuntimePhase4PendingAuditCausalGuardNoGoCheck,
  RuntimePhase4PendingAuditCausalGuardPackagingHygiene,
  RuntimePhase4PendingGuardStatus,
} from "./runtime-40-20-phase4-pending-audit-causal-guard-types";

export const RUNTIME_PHASE4_PENDING_IMPLEMENTED_ITEMS = [
  "audit_primary_activity_limit_attempt",
  "audit_state_transition_candidate",
  "audit_next_interaction_calculation_candidate",
  "audit_budget_state_evaluation_candidate",
  "audit_primary_activity_limit_exceeded",
  "audit_b0_skip_attempt_blocked",
  "guard_causal_opening_without_trigger_without_branching_engine",
];

export const RUNTIME_PHASE4_PENDING_AUDIT_ACTIONS: RuntimePhase4PendingAuditAction[] = [
  "primary_activity_limit_attempt",
  "state_transition_candidate",
  "next_interaction_calculation_candidate",
  "budget_state_evaluation_candidate",
  "primary_activity_limit_exceeded",
  "b0_skip_attempt_blocked",
  "causal_opening_without_trigger_blocked",
];

export const RUNTIME_PHASE4_PENDING_MATERIAL_FILES = [
  "src/services/eve/runtime-40-20/motor/runtime-40-20-phase4-pending-audit-causal-guard-types.ts",
  "src/services/eve/runtime-40-20/motor/runtime-40-20-phase4-pending-audit-causal-guard-service.ts",
  "src/services/eve/runtime-40-20/motor/runtime-40-20-phase4-pending-audit-causal-guard.test.mjs",
  "docs/implementation/runtime_40_20_phase4_pending_audit_causal_guard_closeout.md",
  "docs/implementation/runtime_40_20_phase4_pending_audit_causal_guard_traceability.json",
];

export const RUNTIME_PHASE4_PENDING_PACKAGING_HYGIENE: RuntimePhase4PendingAuditCausalGuardPackagingHygiene =
  {
    material_files_only: true,
    posix_paths_only: true,
    empty_directories_in_bundle: false,
    windows_path_entries_in_bundle: false,
    material_files: RUNTIME_PHASE4_PENDING_MATERIAL_FILES,
  };

export function createRuntime4020Phase4PendingAuditAndCausalGuardLocal(
  input: RuntimePhase4PendingAuditCausalGuardLocalInput,
): RuntimePhase4PendingAuditCausalGuardLocalResult {
  const blockers = createBlockers(input);
  const guardStatus = getGuardStatus(blockers);
  const auditCandidates = RUNTIME_PHASE4_PENDING_AUDIT_ACTIONS.map((action) =>
    createAuditCandidate(input.case_id, action, input),
  );
  const noGoCheck = createNoGoCheck(blockers);
  const ok = blockers.length === 0;

  return {
    ok,
    case_id: input.case_id,
    guard_status: guardStatus,
    audit_candidates: auditCandidates,
    implemented_pending_items: RUNTIME_PHASE4_PENDING_IMPLEMENTED_ITEMS,
    no_go_check: noGoCheck,
    blocked_reason: ok ? undefined : blockers[0],
    materiality: {
      level: "runtime_40_20_phase4_pending_audit_causal_guard_local_contract",
      local_only: true,
      phase4_closed_local: false,
      ready_for_phase5_authorization: false,
      phase5_started: false,
      runtime_40_20_started: false,
      next_authorization_required: true,
    },
  };
}

function createBlockers(
  input: RuntimePhase4PendingAuditCausalGuardLocalInput,
): string[] {
  const blockers: string[] = [];

  if (!input.state_machine_contract_ready) {
    blockers.push("state_machine_contract_not_ready");
  }
  if (!input.orchestrator_contract_ready) {
    blockers.push("orchestrator_contract_not_ready");
  }
  if (
    input.primary_activity_guard.selected_primary_activity_count >
      input.primary_activity_guard.primary_activity_limit &&
    !input.primary_activity_guard.override_authorized
  ) {
    blockers.push("blocked_primary_activity_limit_exceeded");
  }
  if (
    input.b0_skip_guard.requested_next_state === "active_base_capture" &&
    !input.b0_skip_guard.b0_confirmation_completed
  ) {
    blockers.push("blocked_b0_skip_attempt");
  }
  if (
    input.causal_opening_guard.requested_interaction_group === "causal" &&
    !input.causal_opening_guard.explicit_trigger_authorized
  ) {
    blockers.push("blocked_causal_opening_without_trigger");
  }
  if (
    input.budget_state_guard.base_visible_count >
      input.budget_state_guard.base_limit ||
    input.budget_state_guard.causal_visible_count >
      input.budget_state_guard.causal_limit
  ) {
    blockers.push("blocked_budget_state_exceeded");
  }

  return blockers;
}

function getGuardStatus(blockers: string[]): RuntimePhase4PendingGuardStatus {
  const firstGuardBlocker = blockers.find((blocker) =>
    blocker.startsWith("blocked_"),
  );

  return (firstGuardBlocker as RuntimePhase4PendingGuardStatus | undefined) ??
    (blockers.length > 0
      ? "blocked_runtime_boundary_violation"
      : "phase4_pending_guards_ready");
}

function createAuditCandidate(
  caseId: string,
  action: RuntimePhase4PendingAuditAction,
  input: RuntimePhase4PendingAuditCausalGuardLocalInput,
): RuntimePhase4PendingAuditCandidate {
  return {
    audit_candidate_ref: `${caseId}:phase4:${action}`,
    action,
    real_audit_trail_created: false,
    supabase_touched: false,
    sql_executed: false,
    endpoint_created: false,
    metadata: createMetadata(action, input),
  };
}

function createMetadata(
  action: RuntimePhase4PendingAuditAction,
  input: RuntimePhase4PendingAuditCausalGuardLocalInput,
): Record<string, unknown> {
  const common = {
    local_only: true,
    phase4_closed_local: false,
    ready_for_phase5_authorization: false,
    phase5_started: false,
  };

  if (
    action === "primary_activity_limit_attempt" ||
    action === "primary_activity_limit_exceeded"
  ) {
    return {
      ...common,
      selected_primary_activity_count:
        input.primary_activity_guard.selected_primary_activity_count,
      primary_activity_limit: input.primary_activity_guard.primary_activity_limit,
      override_authorized: input.primary_activity_guard.override_authorized,
    };
  }
  if (
    action === "state_transition_candidate" ||
    action === "b0_skip_attempt_blocked"
  ) {
    return {
      ...common,
      current_state: input.b0_skip_guard.current_state,
      requested_next_state: input.b0_skip_guard.requested_next_state,
      b0_confirmation_completed:
        input.b0_skip_guard.b0_confirmation_completed,
    };
  }
  if (action === "next_interaction_calculation_candidate") {
    return {
      ...common,
      requested_interaction_group:
        input.causal_opening_guard.requested_interaction_group,
      explicit_trigger_authorized:
        input.causal_opening_guard.explicit_trigger_authorized,
      ui_rendered: false,
    };
  }
  if (action === "budget_state_evaluation_candidate") {
    return {
      ...common,
      base_visible_count: input.budget_state_guard.base_visible_count,
      causal_visible_count: input.budget_state_guard.causal_visible_count,
      base_limit: input.budget_state_guard.base_limit,
      causal_limit: input.budget_state_guard.causal_limit,
      budget_ledger_real_created: false,
      budget_consumed_real: false,
    };
  }

  return {
    ...common,
    requested_interaction_group:
      input.causal_opening_guard.requested_interaction_group,
    explicit_trigger_authorized:
      input.causal_opening_guard.explicit_trigger_authorized,
    branching_engine_consumed: false,
    activation_candidate_created: false,
    runtime_interaction_instance_real_created: false,
  };
}

function createNoGoCheck(
  blockers: string[],
): RuntimePhase4PendingAuditCausalGuardNoGoCheck {
  return {
    no_go_triggered: blockers.length > 0,
    blockers,
    phase4_closed_local: false,
    ready_for_phase5_authorization: false,
    phase5_started: false,
    runtime_40_20_started: false,
    catalog_activated: false,
    migration_applied: false,
    supabase_touched: false,
    sql_executed: false,
    endpoint_created: false,
    real_audit_trail_created: false,
    real_runtime_records_created: false,
    runtime_interaction_instance_real_created: false,
    branching_engine_consumed: false,
    readiness_engine_consumed: false,
    exporter_consumed: false,
  };
}
