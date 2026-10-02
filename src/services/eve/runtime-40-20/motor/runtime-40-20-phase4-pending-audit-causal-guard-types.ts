export type RuntimePhase4PendingGuardStatus =
  | "phase4_pending_guards_ready"
  | "blocked_primary_activity_limit_exceeded"
  | "blocked_b0_skip_attempt"
  | "blocked_causal_opening_without_trigger"
  | "blocked_budget_state_exceeded"
  | "blocked_runtime_boundary_violation";

export type RuntimePhase4PendingAuditAction =
  | "primary_activity_limit_attempt"
  | "state_transition_candidate"
  | "next_interaction_calculation_candidate"
  | "budget_state_evaluation_candidate"
  | "primary_activity_limit_exceeded"
  | "b0_skip_attempt_blocked"
  | "causal_opening_without_trigger_blocked";

export interface RuntimePhase4PendingAuditCandidate {
  audit_candidate_ref: string;
  action: RuntimePhase4PendingAuditAction;
  real_audit_trail_created: false;
  supabase_touched: false;
  sql_executed: false;
  endpoint_created: false;
  metadata: Record<string, unknown>;
}

export interface RuntimePhase4PrimaryActivityLimitGuardInput {
  selected_primary_activity_count: number;
  primary_activity_limit: 8;
  override_authorized: boolean;
}

export interface RuntimePhase4B0SkipGuardInput {
  current_state: string;
  requested_next_state: string;
  b0_confirmation_completed: boolean;
}

export interface RuntimePhase4CausalOpeningGuardInput {
  requested_interaction_group: "base" | "causal";
  explicit_trigger_authorized: boolean;
}

export interface RuntimePhase4BudgetStateGuardInput {
  base_visible_count: number;
  causal_visible_count: number;
  base_limit: 40;
  causal_limit: 20;
}

export interface RuntimePhase4PendingAuditCausalGuardLocalInput {
  case_id: string;
  primary_activity_guard: RuntimePhase4PrimaryActivityLimitGuardInput;
  b0_skip_guard: RuntimePhase4B0SkipGuardInput;
  causal_opening_guard: RuntimePhase4CausalOpeningGuardInput;
  budget_state_guard: RuntimePhase4BudgetStateGuardInput;
  state_machine_contract_ready: boolean;
  orchestrator_contract_ready: boolean;
}

export interface RuntimePhase4PendingAuditCausalGuardNoGoCheck {
  no_go_triggered: boolean;
  blockers: string[];
  phase4_closed_local: false;
  ready_for_phase5_authorization: false;
  phase5_started: false;
  runtime_40_20_started: false;
  catalog_activated: false;
  migration_applied: false;
  supabase_touched: false;
  sql_executed: false;
  endpoint_created: false;
  real_audit_trail_created: false;
  real_runtime_records_created: false;
  runtime_interaction_instance_real_created: false;
  branching_engine_consumed: false;
  readiness_engine_consumed: false;
  exporter_consumed: false;
}

export interface RuntimePhase4PendingAuditCausalGuardLocalResult {
  ok: boolean;
  case_id: string;
  guard_status: RuntimePhase4PendingGuardStatus;
  audit_candidates: RuntimePhase4PendingAuditCandidate[];
  implemented_pending_items: string[];
  no_go_check: RuntimePhase4PendingAuditCausalGuardNoGoCheck;
  blocked_reason?: string;
  materiality: {
    level: "runtime_40_20_phase4_pending_audit_causal_guard_local_contract";
    local_only: true;
    phase4_closed_local: false;
    ready_for_phase5_authorization: false;
    phase5_started: false;
    runtime_40_20_started: false;
    next_authorization_required: true;
  };
}

export interface RuntimePhase4PendingAuditCausalGuardPackagingHygiene {
  material_files_only: true;
  posix_paths_only: true;
  empty_directories_in_bundle: false;
  windows_path_entries_in_bundle: false;
  material_files: string[];
}
