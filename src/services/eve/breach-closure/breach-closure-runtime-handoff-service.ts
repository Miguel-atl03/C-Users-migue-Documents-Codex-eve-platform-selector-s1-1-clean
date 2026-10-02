import type {
  BreachClosureRuntimeHandoffInput,
  BreachClosureRuntimeHandoffResult,
  RuntimeImplementationEntryCriteria,
  RuntimeScopeProtectionManifest,
} from "./breach-closure-runtime-handoff-types";

const NO_GO: BreachClosureRuntimeHandoffResult["no_go"] = {
  migration_applied: false,
  supabase_touched: false,
  sql_executed: false,
  runtime_40_20_started: false,
  registry_live_db_created: false,
  ir_real_created: false,
  object_inventory_real_opened: false,
  f5c_real_opened: false,
  export_created: false,
  diagnosis_created: false,
  delivered_created: false,
  conformance_claimed: false,
  consistency_claimed: false,
};

export function runBreachClosureRuntimeHandoff(
  input: BreachClosureRuntimeHandoffInput,
): BreachClosureRuntimeHandoffResult {
  const blockers = validateInput(input);
  const ok = blockers.length === 0;
  const breachClosureStatus = ok ? "closed" : "blocked";
  const controlledPromotionStatus = ok ? "paused" : "blocked";

  return {
    ok,
    case_id: input.case_id,
    breach_closure_decision: {
      decision_id: `BREACH_CLOSURE_DECISION:${input.case_id}`,
      case_id: input.case_id,
      breach_closure_status: breachClosureStatus,
      local_materiality_chain_closed: input.local_materiality_chain_closed,
      registry_real_minimal_prepared_in_code:
        input.registry_real_minimal_prepared_in_code,
      registry_sql_service_contract_aligned:
        input.registry_sql_service_contract_aligned,
      migration_application_blocked_correctly:
        input.migration_application_blocked_correctly,
      closure_reason: ok
        ? "La brecha fue cerrada en materialidad local; promover capacidades reales antes del blueprint completo del Runtime 40/20 puede acotar indebidamente el alcance del Runtime."
        : `Breach closure blocked: ${blockers.join(";")}`,
    },
    promotion_pause_decision: {
      pause_decision_id: `PROMOTION_PAUSE_DECISION:${input.case_id}`,
      case_id: input.case_id,
      controlled_promotion_status: controlledPromotionStatus,
      registry_live_db_application_paused: true,
      migration_applied: false,
      supabase_touched: false,
      sql_executed: false,
      pause_reason: "avoid_runtime_scope_constraint_from_partial_activation",
      automatic_resume_allowed: false,
    },
    runtime_40_20_blueprint_handoff: {
      handoff_id: `RUNTIME_40_20_BLUEPRINT_HANDOFF:${input.case_id}`,
      case_id: input.case_id,
      runtime_40_20_status: "not_started",
      runtime_40_20_blueprint_required: true,
      runtime_40_20_scope_protected: true,
      activation_bundle_as_runtime_substitute: false,
      first_runtime_task_recommended: ok
        ? "runtime_40_20_full_blueprint"
        : "manual_review_required",
      reason:
        "Runtime 40/20 must start from a full blueprint and must not be reduced to registry activation or an activation bundle.",
    },
    runtime_scope_protection_manifest: buildScopeProtection(input.case_id),
    deferred_capability_promotion_manifest: {
      manifest_id: `DEFERRED_CAPABILITY_PROMOTION:${input.case_id}`,
      case_id: input.case_id,
      deferred_capabilities: [
        "registry_live_db_application",
        "ir_real",
        "object_inventory_real",
        "f5c_real",
        "integration_membrane_real",
        "runtime_40_20_real",
        "parallel_production_real",
        "export_real",
        "diagnosis_delivery_real",
      ],
      defer_reason: "await_runtime_40_20_full_blueprint",
    },
    runtime_implementation_entry_criteria: buildEntryCriteria(input.case_id),
    no_go: NO_GO,
    materiality: {
      level: "breach_closure_with_promotion_pause_and_runtime_handoff",
      breach_closure_status: breachClosureStatus,
      controlled_promotion_status: controlledPromotionStatus,
      runtime_40_20_status: "not_started",
      next_authorization_required: true,
    },
  };
}

function validateInput(input: BreachClosureRuntimeHandoffInput): string[] {
  const blockers: string[] = [];

  if (input.local_materiality_chain_closed !== true) {
    blockers.push("local_materiality_chain_not_closed");
  }
  if (input.registry_real_minimal_prepared_in_code !== true) {
    blockers.push("registry_real_minimal_not_prepared_in_code");
  }
  if (input.registry_sql_service_contract_aligned !== true) {
    blockers.push("registry_sql_service_contract_not_aligned");
  }
  if (input.migration_application_blocked_correctly !== true) {
    blockers.push("migration_application_not_blocked_correctly");
  }
  if (input.migration_applied !== false) {
    blockers.push("migration_applied");
  }
  if (input.supabase_touched !== false) {
    blockers.push("supabase_touched");
  }
  if (input.sql_executed !== false) {
    blockers.push("sql_executed");
  }
  if (input.runtime_40_20_started !== false) {
    blockers.push("runtime_40_20_started");
  }

  return blockers;
}

function buildScopeProtection(caseId: string): RuntimeScopeProtectionManifest {
  return {
    manifest_id: `RUNTIME_SCOPE_PROTECTION:${caseId}`,
    case_id: caseId,
    protected_scope_items: [
      "40_base_interactions",
      "20_adaptive_interactions",
      "canonical_variables",
      "evidence_items",
      "readiness_gaps",
      "structural_candidates",
      "object_inventory_records",
      "f5c_bindings",
      "gates",
      "audit_trail",
      "integration_membrane",
      "control_shadow",
    ],
    prohibited_scope_reductions: [
      "registry_only_runtime",
      "activation_bundle_as_runtime",
      "export_driven_runtime",
      "diagnosis_driven_runtime",
      "delivery_first_runtime",
    ],
  };
}

function buildEntryCriteria(caseId: string): RuntimeImplementationEntryCriteria {
  return {
    criteria_id: `RUNTIME_IMPLEMENTATION_ENTRY_CRITERIA:${caseId}`,
    case_id: caseId,
    required_before_runtime_implementation: [
      "runtime_40_20_full_blueprint",
      "runtime_object_model",
      "runtime_interaction_model",
      "runtime_state_model",
      "runtime_gate_model",
      "runtime_persistence_strategy",
      "runtime_security_boundary",
      "runtime_rollout_plan",
    ],
    registry_live_db_application_required_now: false,
    runtime_can_start_without_live_db_application: true,
    reason:
      "Runtime 40/20 implementation can begin from a full blueprint without applying registry live DB first.",
  };
}
