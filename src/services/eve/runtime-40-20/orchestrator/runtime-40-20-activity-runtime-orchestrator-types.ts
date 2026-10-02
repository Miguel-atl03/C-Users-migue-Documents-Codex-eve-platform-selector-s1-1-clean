import type {
  ActivityRuntimeRunState,
  RoleRuntimeSessionState,
  RuntimeInteractionInstanceState,
} from "../domain/runtime-40-20-domain-state-types";
import type {
  RuntimeCatalogCanonicalizationResult,
  RuntimeInteractionDefinitionCandidate,
} from "../catalog-canonicalization/runtime-40-20-catalog-canonicalization-types";

export type RuntimeOrchestratorInteractionDefinition =
  RuntimeInteractionDefinitionCandidate;

export interface RuntimePrimaryActivityInput {
  activity_id: string;
  activity_label: string;
  role_id: string;
  semantic_preload_present: boolean;
  metadata?: Record<string, unknown>;
}

export interface RuntimeSecondaryActivityInput {
  activity_id: string;
  activity_label: string;
  reason_not_primary: string;
  metadata?: Record<string, unknown>;
}

export interface RoleRuntimeSessionPlan {
  session_plan_id: string;
  case_id: string;
  role_id: string;
  catalog_version_ref: string;
  primary_activity_limit: 8;
  selected_primary_activity_count: number;
  secondary_activity_count: number;
  state: Extract<RoleRuntimeSessionState, "draft" | "active">;
  runtime_40_20_started: false;
  metadata: Record<string, unknown>;
}

export interface PrimaryActivitySelectionPlan {
  primary_activities: RuntimePrimaryActivityInput[];
  secondary_activities: RuntimeSecondaryActivityInput[];
  context_only_activities: RuntimeSecondaryActivityInput[];
  primary_activity_limit_exceeded: boolean;
  preserved_non_primary_context: boolean;
}

export interface ActivityRuntimeRunPlan {
  run_plan_id: string;
  case_id: string;
  role_id: string;
  activity_id: string;
  activity_label: string;
  initial_state: Extract<ActivityRuntimeRunState, "initialized">;
  allowed_first_transition: {
    from: "initialized";
    to: "semantic_preload_loaded";
  };
  semantic_preload_present: boolean;
  runtime_run_created_real: false;
}

export interface RuntimeInteractionQueuePlan {
  run_plan_id: string;
  base_interaction_count: 40;
  causal_interaction_count: 20;
  base_queue_state: Extract<RuntimeInteractionInstanceState, "pending">;
  causal_queue_state: "pending_by_rule";
  base_interaction_refs: string[];
  causal_interaction_refs: string[];
  branching_evaluated: false;
  real_interaction_instances_created: false;
}

export interface NextInteractionDecision {
  run_plan_id: string;
  activity_id: string;
  decision_type:
    | "semantic_preload_ready"
    | "requires_semantic_preload"
    | "blocked";
  next_state_hint:
    | "semantic_preload_loaded"
    | "initialized"
    | "blocked";
  next_interaction_hint:
    | "B0_confirmation"
    | "requires_semantic_preload"
    | "none";
  ui_rendered: false;
}

export interface Budget4020LedgerPreview {
  run_plan_id: string;
  base_limit: 40;
  causal_limit: 20;
  base_planned_count: 40;
  causal_planned_count: 20;
  base_consumed: 0;
  causal_consumed: 0;
  budget_consumed_real: false;
}

export interface ActivityRuntimeOrchestratorReadinessPrecheck {
  catalog_canonicalization_consumed: boolean;
  state_machine_contract_consumed: boolean;
  interaction_definition_count: number;
  base_interaction_count: number;
  causal_interaction_count: number;
  primary_activity_limit_valid: boolean;
  ready_for_local_orchestration: boolean;
  ready_for_runtime_start: false;
  blockers: string[];
}

export interface ActivityRuntimeOrchestratorNoGoCheck {
  no_go_triggered: boolean;
  blockers: string[];
  runtime_40_20_started: false;
  catalog_activated: false;
  migration_applied: false;
  supabase_touched: false;
  sql_executed: false;
  endpoint_created: false;
  real_runtime_records_created: false;
  real_interaction_instances_created: false;
  business_evidence_created: false;
  registry_live_db_created: false;
  ir_real_created: false;
  object_inventory_real_opened: false;
  f5c_real_opened: false;
  export_created: false;
  diagnosis_created: false;
  delivered_created: false;
}

export interface ActivityRuntimeOrchestratorLocalInput {
  case_id: string;
  role_id: string;
  catalog_version_ref: string;
  catalog_canonicalization_result: RuntimeCatalogCanonicalizationResult;
  primary_activities: RuntimePrimaryActivityInput[];
  secondary_activities?: RuntimeSecondaryActivityInput[];
  context_only_activities?: RuntimeSecondaryActivityInput[];
  state_machine_contract_ready: boolean;
  options?: {
    version?: string;
  };
}

export interface ActivityRuntimeOrchestratorLocalResult {
  ok: boolean;
  case_id: string;
  role_runtime_session_plan: RoleRuntimeSessionPlan;
  primary_activity_selection_plan: PrimaryActivitySelectionPlan;
  activity_runtime_run_plans: ActivityRuntimeRunPlan[];
  interaction_queue_plans: RuntimeInteractionQueuePlan[];
  next_interaction_decisions: NextInteractionDecision[];
  budget_ledger_previews: Budget4020LedgerPreview[];
  readiness_precheck: ActivityRuntimeOrchestratorReadinessPrecheck;
  no_go_check: ActivityRuntimeOrchestratorNoGoCheck;
  blocked_reason?: string;
  materiality: {
    level: "runtime_40_20_activity_runtime_orchestrator_local_contract";
    local_only: true;
    runtime_40_20_started: false;
    next_authorization_required: true;
  };
}
