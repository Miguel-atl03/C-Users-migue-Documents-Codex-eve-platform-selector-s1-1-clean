export type RoleRuntimeSessionState =
  | "draft"
  | "active"
  | "in_progress"
  | "ready_with_flags"
  | "completed"
  | "blocked"
  | "archived";

export type ActivityRuntimeRunState =
  | "initialized"
  | "semantic_preload_loaded"
  | "b0_confirmation_pending"
  | "active_base_capture"
  | "base_complete"
  | "causal_evaluation_pending"
  | "active_causal_capture"
  | "readiness_evaluation"
  | "ready"
  | "ready_with_flags"
  | "blocked"
  | "reentry_required"
  | "manual_review_required"
  | "exported_to_parallel_production"
  | "archived";

export type RuntimeInteractionInstanceState =
  | "pending"
  | "shown"
  | "answered"
  | "confirmed"
  | "corrected"
  | "inferred_unconfirmed"
  | "skipped_by_rule"
  | "closed_by_other"
  | "blocked"
  | "reopened";

export type RuntimeEpistemicStatus =
  | "captured_user_evidence"
  | "ai_inferred_unconfirmed"
  | "user_confirmed_suggestion"
  | "user_corrected_evidence"
  | "canonical_derivation"
  | "internal_calculated";

export type RuntimeRouteStatus =
  | "not_applicable"
  | "open"
  | "closed"
  | "closed_with_flags"
  | "blocked_by_missing_canonical_route"
  | "route_missing"
  | "superseded";

export type RuntimeReadinessState =
  | "ready"
  | "ready_with_flags"
  | "blocked_by_missing_evidence"
  | "blocked_by_contradiction"
  | "blocked_by_missing_canonical_route"
  | "manual_review_required"
  | "reentry_required";

export interface RuntimeDomainNoGo {
  migration_applied: false;
  catalog_activated: false;
  runtime_40_20_started: false;
  supabase_touched: false;
  sql_executed: false;
  endpoint_created: false;
  real_runtime_records_created: false;
  business_evidence_created: false;
  registry_live_db_created: false;
  ir_real_created: false;
  object_inventory_real_opened: false;
  f5c_real_opened: false;
  export_created: false;
  diagnosis_created: false;
  delivered_created: false;
}

export interface Runtime4020StateMachineContractResult {
  ok: boolean;
  case_id: string;
  role_runtime_session_states: RoleRuntimeSessionState[];
  activity_runtime_run_states: ActivityRuntimeRunState[];
  runtime_interaction_instance_states: RuntimeInteractionInstanceState[];
  activity_run_allowed_transitions: Array<{
    from: ActivityRuntimeRunState;
    to: ActivityRuntimeRunState;
  }>;
  interaction_allowed_transitions: Array<{
    from: RuntimeInteractionInstanceState;
    to: RuntimeInteractionInstanceState;
  }>;
  budget_contract: {
    base_limit: 40;
    causal_limit: 20;
    primary_activity_limit: 8;
    rules: string[];
  };
  epistemic_statuses: RuntimeEpistemicStatus[];
  epistemic_status_rules: string[];
  route_statuses: RuntimeRouteStatus[];
  route_status_rules: string[];
  readiness_states: RuntimeReadinessState[];
  readiness_state_rules: string[];
  no_go: RuntimeDomainNoGo;
  blocked_reason?: string;
  materiality: {
    level: "runtime_40_20_state_machine_and_domain_contracts";
    local_only: true;
    runtime_40_20_started: false;
    next_authorization_required: true;
  };
}
