import type { LocalMaterialityChainClosureAuditResult } from "../local-materiality-closure/local-materiality-chain-closure-audit-types";

export type ControlledPromotionCapability =
  | "registry_real_minimal"
  | "ir_real_minimal"
  | "object_inventory_real_minimal"
  | "f5c_real_minimal"
  | "integration_membrane_real_minimal"
  | "runtime_40_20_real"
  | "parallel_production_real"
  | "export_real"
  | "diagnosis_delivery_real";

export type ControlledPromotionReadinessStatus =
  | "ready_for_authorization_review"
  | "ready_with_restrictions"
  | "blocked"
  | "manual_review_required";

export interface PromotionScopeMatrixEntry {
  capability: ControlledPromotionCapability;
  may_be_authorized_later: boolean;
  authorized_now: false;
  executed_now: false;
  recommended_order: number | null;
  prerequisite_capabilities: ControlledPromotionCapability[];
  blocked_until_authorized: true;
  reason: string;
}

export interface CapabilityPromotionSequenceStep {
  step_id: string;
  order: number;
  capability: ControlledPromotionCapability;
  promotion_type:
    | "minimal_real_capability"
    | "runtime_installation"
    | "delivery_capability";
  allowed_in_this_tramo: false;
  requires_explicit_next_authorization: true;
  rollback_required: boolean;
  reason: string;
}

export interface AuthorizationGateManifestItem {
  gate_id: string;
  capability: ControlledPromotionCapability;
  gate_type:
    | "structural_readiness"
    | "security_boundary"
    | "data_persistence"
    | "auditability"
    | "rollback"
    | "no_delivery"
    | "manual_authorization";
  gate_required: true;
  gate_passed_now: false;
  gate_execution_allowed_now: false;
}

export interface RiskBoundaryManifestItem {
  risk_id: string;
  capability: ControlledPromotionCapability;
  risk_type:
    | "overclaim"
    | "premature_delivery"
    | "runtime_on_simulation"
    | "uncontrolled_persistence"
    | "registry_without_conformance"
    | "export_before_diagnosis_authorization"
    | "diagnosis_before_runtime_evidence";
  severity: "medium" | "high" | "critical";
  mitigation_required: true;
}

export interface RollbackGuardManifestItem {
  rollback_guard_id: string;
  capability: ControlledPromotionCapability;
  rollback_required_before_promotion: true;
  rollback_defined_now: boolean;
  rollback_executed_now: false;
  reason: string;
}

export interface PromotionNoGoCheck {
  no_go_check_id: string;
  promotion_executed: false;
  automatic_promotion_allowed: false;
  runtime_40_20_started: false;
  registry_real_created: false;
  ir_real_created: false;
  object_inventory_real_opened: false;
  f5c_real_opened: false;
  export_created: false;
  diagnosis_created: false;
  delivered_created: false;
}

export interface ControlledPromotionReadinessPack {
  pack_id: string;
  case_id: string;
  readiness_status: ControlledPromotionReadinessStatus;
  local_chain_closed: boolean;
  real_capabilities_opened: false;
  promotion_executed: false;
  automatic_promotion_allowed: false;
  recommended_first_authorization:
    | "registry_real_minimal"
    | "manual_review_required"
    | "blocked";
  readiness_statement: string;
  restrictions: string[];
}

export interface ControlledCapabilityPromotionReadinessInput {
  case_id: string;
  local_closure_audit_result: LocalMaterialityChainClosureAuditResult;
  options?: {
    version?: string;
  };
}

export interface ControlledCapabilityPromotionReadinessResult {
  ok: boolean;
  case_id: string;
  readiness_pack: ControlledPromotionReadinessPack;
  promotion_scope_matrix: PromotionScopeMatrixEntry[];
  capability_promotion_sequence: CapabilityPromotionSequenceStep[];
  authorization_gate_manifest: AuthorizationGateManifestItem[];
  risk_boundary_manifest: RiskBoundaryManifestItem[];
  rollback_guard_manifest: RollbackGuardManifestItem[];
  promotion_no_go_check: PromotionNoGoCheck;
  blocked_reason?: string;
  no_go: {
    promotion_executed: false;
    automatic_promotion_allowed: false;
    runtime_40_20_started: false;
    registry_real_created: false;
    ir_real_created: false;
    object_inventory_real_opened: false;
    f5c_real_opened: false;
    integration_membrane_real_opened: false;
    production_parallel_real_opened: false;
    export_created: false;
    diagnosis_created: false;
    delivered_created: false;
    delivery_authorized: false;
    conformance_claimed: false;
    consistency_claimed: false;
    supabase_touched: false;
    sql_created: false;
    env_read: false;
  };
  materiality: {
    level: "controlled_capability_promotion_readiness_pack";
    local_only: true;
    promotion_executed: false;
    next_authorization_required: true;
  };
}
