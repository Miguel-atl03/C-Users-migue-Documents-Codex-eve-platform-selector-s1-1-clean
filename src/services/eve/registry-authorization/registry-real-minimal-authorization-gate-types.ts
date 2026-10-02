import type { ControlledCapabilityPromotionReadinessResult } from "../promotion-readiness/controlled-capability-promotion-readiness-types";

export type RegistryAuthorizationDecisionCandidate =
  | "authorize_later_with_explicit_human_approval"
  | "manual_review_required"
  | "blocked";

export type RegistryFamily = "PM" | "PF" | "MoC" | "OLC";

export type RegistryExcludedCapability =
  | "IR_real"
  | "Object_Inventory_real"
  | "F5C_real"
  | "Runtime_40_20_real"
  | "Parallel_Production_real"
  | "Export_real"
  | "Diagnosis_Delivery_real";

export interface RegistryScopeCandidate {
  scope_id: string;
  capability: "registry_real_minimal";
  included_registry_families: RegistryFamily[];
  excluded_capabilities: RegistryExcludedCapability[];
  minimal_only: true;
  creates_registry_now: false;
  reason: string;
}

export interface RegistryPreconditionsCheck {
  check_id: string;
  local_chain_closed: boolean;
  promotion_readiness_pack_present: boolean;
  recommended_first_authorization_is_registry: boolean;
  registry_candidate_present: boolean;
  promotion_executed: false;
  automatic_promotion_allowed: false;
  runtime_40_20_started: false;
  registry_real_created: false;
  ir_real_created: false;
  object_inventory_real_opened: false;
  f5c_real_opened: false;
  conformance_claimed: false;
  consistency_claimed: false;
  ready_for_authorization_review: boolean;
  blockers: string[];
}

export interface RegistrySecurityBoundaryCheck {
  check_id: string;
  supabase_touched: false;
  sql_created: false;
  migration_created: false;
  env_read: false;
  endpoint_created: false;
  service_role_used: false;
  rls_required_before_real_registry: true;
  ownership_required_before_real_registry: true;
  security_review_required: true;
  reason: string;
}

export interface RegistryPersistencePlanCandidate {
  plan_id: string;
  persistence_plan_created: true;
  persistence_executed: false;
  migration_created: false;
  tables_created: false;
  recommended_future_tables: Array<
    | "pm_registry"
    | "pf_registry"
    | "moc_registry"
    | "olc_registry"
    | "registry_audit_log"
    | "registry_authorization_log"
  >;
  requires_next_authorization: true;
  reason: string;
}

export interface RegistryRollbackPlanCandidate {
  rollback_plan_id: string;
  rollback_required_before_execution: true;
  rollback_defined_now: true;
  rollback_executed_now: false;
  rollback_scope: Array<
    | "registry_tables"
    | "registry_rows"
    | "registry_audit_log"
    | "registry_service_activation"
    | "registry_authorization_log"
  >;
  reason: string;
}

export interface RegistryAuthorizationDecisionCandidateRecord {
  decision_id: string;
  decision_candidate: RegistryAuthorizationDecisionCandidate;
  authorization_executed: false;
  registry_created_now: false;
  requires_explicit_human_approval_next: true;
  reason: string;
}

export interface RegistryAuthorizationNoGoCheck {
  no_go_check_id: string;
  authorization_executed: false;
  registry_real_created: false;
  sql_created: false;
  migration_created: false;
  supabase_touched: false;
  endpoint_created: false;
  runtime_40_20_started: false;
  ir_real_created: false;
  object_inventory_real_opened: false;
  f5c_real_opened: false;
  export_created: false;
  diagnosis_created: false;
  delivered_created: false;
  conformance_claimed: false;
  consistency_claimed: false;
}

export interface RegistryAuthorizationDossier {
  dossier_id: string;
  case_id: string;
  capability: "registry_real_minimal";
  decision_candidate: RegistryAuthorizationDecisionCandidate;
  authorization_executed: false;
  registry_created_now: false;
  readiness_statement: string;
  restrictions: string[];
}

export interface RegistryRealMinimalAuthorizationGateInput {
  case_id: string;
  promotion_readiness_result: ControlledCapabilityPromotionReadinessResult;
  options?: {
    version?: string;
  };
}

export interface RegistryRealMinimalAuthorizationGateResult {
  ok: boolean;
  case_id: string;
  authorization_dossier: RegistryAuthorizationDossier;
  registry_scope_candidate: RegistryScopeCandidate;
  registry_preconditions_check: RegistryPreconditionsCheck;
  registry_security_boundary_check: RegistrySecurityBoundaryCheck;
  registry_persistence_plan_candidate: RegistryPersistencePlanCandidate;
  registry_rollback_plan_candidate: RegistryRollbackPlanCandidate;
  registry_authorization_decision_candidate: RegistryAuthorizationDecisionCandidateRecord;
  registry_authorization_no_go_check: RegistryAuthorizationNoGoCheck;
  blocked_reason?: string;
  no_go: {
    authorization_executed: false;
    registry_real_created: false;
    pm_registry_real_created: false;
    pf_registry_real_created: false;
    moc_registry_real_created: false;
    olc_registry_real_created: false;
    ir_real_created: false;
    object_inventory_real_opened: false;
    f5c_real_opened: false;
    runtime_40_20_started: false;
    production_parallel_real_opened: false;
    control_plane_real_opened: false;
    sg_shadow_real_opened: false;
    export_created: false;
    diagnosis_created: false;
    delivered_created: false;
    delivery_authorized: false;
    conformance_claimed: false;
    consistency_claimed: false;
    supabase_touched: false;
    sql_created: false;
    migration_created: false;
    endpoint_created: false;
    env_read: false;
  };
  materiality: {
    level: "registry_real_minimal_authorization_gate_dossier";
    local_only: true;
    authorization_executed: false;
    registry_real_created: false;
    next_authorization_required: true;
  };
}
