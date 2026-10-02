import type {
  ActivityRuntimeRunState,
  RoleRuntimeSessionState,
  Runtime4020StateMachineContractResult,
  RuntimeEpistemicStatus,
  RuntimeInteractionInstanceState,
  RuntimeReadinessState,
  RuntimeRouteStatus,
} from "./runtime-40-20-domain-state-types";
import {
  ACTIVITY_RUN_ALLOWED_TRANSITIONS,
  INTERACTION_INSTANCE_ALLOWED_TRANSITIONS,
  assertRuntimeDomainNoGoBoundary,
} from "./runtime-40-20-state-machine-guards";

export const ROLE_RUNTIME_SESSION_STATES: RoleRuntimeSessionState[] = [
  "draft",
  "active",
  "in_progress",
  "ready_with_flags",
  "completed",
  "blocked",
  "archived",
];

export const ACTIVITY_RUNTIME_RUN_STATES: ActivityRuntimeRunState[] = [
  "initialized",
  "semantic_preload_loaded",
  "b0_confirmation_pending",
  "active_base_capture",
  "base_complete",
  "causal_evaluation_pending",
  "active_causal_capture",
  "readiness_evaluation",
  "ready",
  "ready_with_flags",
  "blocked",
  "reentry_required",
  "manual_review_required",
  "exported_to_parallel_production",
  "archived",
];

export const RUNTIME_INTERACTION_INSTANCE_STATES: RuntimeInteractionInstanceState[] =
  [
    "pending",
    "shown",
    "answered",
    "confirmed",
    "corrected",
    "inferred_unconfirmed",
    "skipped_by_rule",
    "closed_by_other",
    "blocked",
    "reopened",
  ];

export const RUNTIME_EPISTEMIC_STATUSES: RuntimeEpistemicStatus[] = [
  "captured_user_evidence",
  "ai_inferred_unconfirmed",
  "user_confirmed_suggestion",
  "user_corrected_evidence",
  "canonical_derivation",
  "internal_calculated",
];

export const RUNTIME_ROUTE_STATUSES: RuntimeRouteStatus[] = [
  "not_applicable",
  "open",
  "closed",
  "closed_with_flags",
  "blocked_by_missing_canonical_route",
  "route_missing",
  "superseded",
];

export const RUNTIME_READINESS_STATES: RuntimeReadinessState[] = [
  "ready",
  "ready_with_flags",
  "blocked_by_missing_evidence",
  "blocked_by_contradiction",
  "blocked_by_missing_canonical_route",
  "manual_review_required",
  "reentry_required",
];

export function createRuntime4020StateMachineContract(input: {
  case_id: string;
  execution_core_schema_ready: boolean;
  catalog_activated: false;
  runtime_40_20_started: false;
}): Runtime4020StateMachineContractResult {
  const boundary = assertRuntimeDomainNoGoBoundary({
    catalog_activated: input.catalog_activated,
    runtime_40_20_started: input.runtime_40_20_started,
  });
  const blockers = [...boundary.blockers];

  if (!input.execution_core_schema_ready) {
    blockers.push("execution_core_schema_not_ready");
  }

  return {
    ok: blockers.length === 0,
    case_id: input.case_id,
    role_runtime_session_states: ROLE_RUNTIME_SESSION_STATES,
    activity_runtime_run_states: ACTIVITY_RUNTIME_RUN_STATES,
    runtime_interaction_instance_states: RUNTIME_INTERACTION_INSTANCE_STATES,
    activity_run_allowed_transitions: ACTIVITY_RUN_ALLOWED_TRANSITIONS,
    interaction_allowed_transitions: INTERACTION_INSTANCE_ALLOWED_TRANSITIONS,
    budget_contract: {
      base_limit: 40,
      causal_limit: 20,
      primary_activity_limit: 8,
      rules: [
        "base_visible_interaction_counts_against_base_bucket",
        "causal_visible_interaction_counts_against_causal_bucket",
        "internal_derivation_does_not_count_against_visible_budget",
        "reentry_counting_declared_only_not_executed_in_this_tramo",
        "microconfirmation_counts_against_declared_bucket",
      ],
    },
    epistemic_statuses: RUNTIME_EPISTEMIC_STATUSES,
    epistemic_status_rules: [
      "captured_user_evidence_requires_user_input",
      "ai_inferred_unconfirmed_requires_confirmation_before_hard_evidence",
      "user_corrected_evidence_supersedes_prior_evidence",
      "canonical_derivation_must_declare_source",
      "internal_calculated_cannot_be_used_as_user_response",
    ],
    route_statuses: RUNTIME_ROUTE_STATUSES,
    route_status_rules: [
      "route_missing_is_not_closed",
      "blocked_by_missing_canonical_route_must_carry_gap",
      "superseded_requires_future_audit_trail",
      "closed_with_flags_does_not_equal_ready_without_readiness_engine",
    ],
    readiness_states: RUNTIME_READINESS_STATES,
    readiness_state_rules: [
      "ready_cannot_emit_with_blocked_critical_route",
      "ready_with_flags_cannot_hide_gaps",
      "manual_review_required_cannot_resolve_automatically",
      "reentry_required_must_declare_future_target",
    ],
    no_go: {
      migration_applied: false,
      catalog_activated: false,
      runtime_40_20_started: false,
      supabase_touched: false,
      sql_executed: false,
      endpoint_created: false,
      real_runtime_records_created: false,
      business_evidence_created: false,
      registry_live_db_created: false,
      ir_real_created: false,
      object_inventory_real_opened: false,
      f5c_real_opened: false,
      export_created: false,
      diagnosis_created: false,
      delivered_created: false,
    },
    blocked_reason: blockers.length > 0 ? blockers.join("; ") : undefined,
    materiality: {
      level: "runtime_40_20_state_machine_and_domain_contracts",
      local_only: true,
      runtime_40_20_started: false,
      next_authorization_required: true,
    },
  };
}
