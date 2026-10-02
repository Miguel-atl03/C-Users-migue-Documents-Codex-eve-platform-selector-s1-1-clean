export type BreachClosureStatus =
  | "closed"
  | "blocked"
  | "manual_review_required";

export type ControlledPromotionStatus =
  | "paused"
  | "authorized"
  | "executed"
  | "blocked";

export interface BreachClosureDecisionRecord {
  decision_id: string;
  case_id: string;
  breach_closure_status: BreachClosureStatus;
  local_materiality_chain_closed: boolean;
  registry_real_minimal_prepared_in_code: boolean;
  registry_sql_service_contract_aligned: boolean;
  migration_application_blocked_correctly: boolean;
  closure_reason: string;
}

export interface PromotionPauseDecisionRecord {
  pause_decision_id: string;
  case_id: string;
  controlled_promotion_status: ControlledPromotionStatus;
  registry_live_db_application_paused: true;
  migration_applied: false;
  supabase_touched: false;
  sql_executed: false;
  pause_reason:
    | "avoid_runtime_scope_constraint_from_partial_activation"
    | "operator_authorization_missing"
    | "await_runtime_40_20_full_blueprint";
  automatic_resume_allowed: false;
}

export interface Runtime40_20BlueprintHandoffRecord {
  handoff_id: string;
  case_id: string;
  runtime_40_20_status: "not_started";
  runtime_40_20_blueprint_required: true;
  runtime_40_20_scope_protected: true;
  activation_bundle_as_runtime_substitute: false;
  first_runtime_task_recommended:
    | "runtime_40_20_full_blueprint"
    | "manual_review_required";
  reason: string;
}

export interface RuntimeScopeProtectionManifest {
  manifest_id: string;
  case_id: string;
  protected_scope_items: Array<
    | "40_base_interactions"
    | "20_adaptive_interactions"
    | "canonical_variables"
    | "evidence_items"
    | "readiness_gaps"
    | "structural_candidates"
    | "object_inventory_records"
    | "f5c_bindings"
    | "gates"
    | "audit_trail"
    | "integration_membrane"
    | "control_shadow"
  >;
  prohibited_scope_reductions: Array<
    | "registry_only_runtime"
    | "activation_bundle_as_runtime"
    | "export_driven_runtime"
    | "diagnosis_driven_runtime"
    | "delivery_first_runtime"
  >;
}

export interface DeferredCapabilityPromotionManifest {
  manifest_id: string;
  case_id: string;
  deferred_capabilities: Array<
    | "registry_live_db_application"
    | "ir_real"
    | "object_inventory_real"
    | "f5c_real"
    | "integration_membrane_real"
    | "runtime_40_20_real"
    | "parallel_production_real"
    | "export_real"
    | "diagnosis_delivery_real"
  >;
  defer_reason: "await_runtime_40_20_full_blueprint";
}

export interface RuntimeImplementationEntryCriteria {
  criteria_id: string;
  case_id: string;
  required_before_runtime_implementation: Array<
    | "runtime_40_20_full_blueprint"
    | "runtime_object_model"
    | "runtime_interaction_model"
    | "runtime_state_model"
    | "runtime_gate_model"
    | "runtime_persistence_strategy"
    | "runtime_security_boundary"
    | "runtime_rollout_plan"
  >;
  registry_live_db_application_required_now: false;
  runtime_can_start_without_live_db_application: boolean;
  reason: string;
}

export interface BreachClosureRuntimeHandoffInput {
  case_id: string;
  local_materiality_chain_closed: boolean;
  registry_real_minimal_prepared_in_code: boolean;
  registry_sql_service_contract_aligned: boolean;
  migration_application_blocked_correctly: boolean;
  operator_authorization_flag_present: false;
  migration_applied: false;
  supabase_touched: false;
  sql_executed: false;
  runtime_40_20_started: false;
}

export interface BreachClosureRuntimeHandoffResult {
  ok: boolean;
  case_id: string;
  breach_closure_decision: BreachClosureDecisionRecord;
  promotion_pause_decision: PromotionPauseDecisionRecord;
  runtime_40_20_blueprint_handoff: Runtime40_20BlueprintHandoffRecord;
  runtime_scope_protection_manifest: RuntimeScopeProtectionManifest;
  deferred_capability_promotion_manifest: DeferredCapabilityPromotionManifest;
  runtime_implementation_entry_criteria: RuntimeImplementationEntryCriteria;
  no_go: {
    migration_applied: false;
    supabase_touched: false;
    sql_executed: false;
    runtime_40_20_started: false;
    registry_live_db_created: false;
    ir_real_created: false;
    object_inventory_real_opened: false;
    f5c_real_opened: false;
    export_created: false;
    diagnosis_created: false;
    delivered_created: false;
    conformance_claimed: false;
    consistency_claimed: false;
  };
  materiality: {
    level: "breach_closure_with_promotion_pause_and_runtime_handoff";
    breach_closure_status: BreachClosureStatus;
    controlled_promotion_status: ControlledPromotionStatus;
    runtime_40_20_status: "not_started";
    next_authorization_required: true;
  };
}
