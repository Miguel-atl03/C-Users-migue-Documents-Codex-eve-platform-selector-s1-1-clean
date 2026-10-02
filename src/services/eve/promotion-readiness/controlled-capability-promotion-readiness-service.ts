import type {
  AuthorizationGateManifestItem,
  CapabilityPromotionSequenceStep,
  ControlledCapabilityPromotionReadinessInput,
  ControlledCapabilityPromotionReadinessResult,
  ControlledPromotionCapability,
  ControlledPromotionReadinessPack,
  PromotionNoGoCheck,
  PromotionScopeMatrixEntry,
  RiskBoundaryManifestItem,
  RollbackGuardManifestItem,
} from "./controlled-capability-promotion-readiness-types";

const CAPABILITY_SEQUENCE: ControlledPromotionCapability[] = [
  "registry_real_minimal",
  "ir_real_minimal",
  "object_inventory_real_minimal",
  "f5c_real_minimal",
  "integration_membrane_real_minimal",
  "runtime_40_20_real",
  "parallel_production_real",
  "export_real",
  "diagnosis_delivery_real",
];

const GATE_TYPES: AuthorizationGateManifestItem["gate_type"][] = [
  "structural_readiness",
  "security_boundary",
  "data_persistence",
  "auditability",
  "rollback",
  "no_delivery",
  "manual_authorization",
];

const NO_GO: ControlledCapabilityPromotionReadinessResult["no_go"] = {
  promotion_executed: false,
  automatic_promotion_allowed: false,
  runtime_40_20_started: false,
  registry_real_created: false,
  ir_real_created: false,
  object_inventory_real_opened: false,
  f5c_real_opened: false,
  integration_membrane_real_opened: false,
  production_parallel_real_opened: false,
  export_created: false,
  diagnosis_created: false,
  delivered_created: false,
  delivery_authorized: false,
  conformance_claimed: false,
  consistency_claimed: false,
  supabase_touched: false,
  sql_created: false,
  env_read: false,
};

const PROMOTION_NO_GO_CHECK: PromotionNoGoCheck = {
  no_go_check_id: "CONTROLLED_PROMOTION_NO_GO_CHECK",
  promotion_executed: false,
  automatic_promotion_allowed: false,
  runtime_40_20_started: false,
  registry_real_created: false,
  ir_real_created: false,
  object_inventory_real_opened: false,
  f5c_real_opened: false,
  export_created: false,
  diagnosis_created: false,
  delivered_created: false,
};

export function runControlledCapabilityPromotionReadiness(
  input: ControlledCapabilityPromotionReadinessInput,
): ControlledCapabilityPromotionReadinessResult {
  const validation = validateLocalClosure(input);
  const ok = validation.valid;

  return {
    ok,
    case_id: input.case_id,
    readiness_pack: buildReadinessPack(input, ok),
    promotion_scope_matrix: buildPromotionScopeMatrix(ok),
    capability_promotion_sequence: buildCapabilityPromotionSequence(),
    authorization_gate_manifest: buildAuthorizationGateManifest(),
    risk_boundary_manifest: buildRiskBoundaryManifest(),
    rollback_guard_manifest: buildRollbackGuardManifest(),
    promotion_no_go_check: {
      ...PROMOTION_NO_GO_CHECK,
      no_go_check_id: `CONTROLLED_PROMOTION_NO_GO_CHECK:${input.case_id}`,
    },
    blocked_reason: ok ? undefined : validation.reason,
    no_go: NO_GO,
    materiality: {
      level: "controlled_capability_promotion_readiness_pack",
      local_only: true,
      promotion_executed: false,
      next_authorization_required: true,
    },
  };
}

function validateLocalClosure(
  input: ControlledCapabilityPromotionReadinessInput,
): { valid: true } | { valid: false; reason: string } {
  const result = input.local_closure_audit_result;

  if (result.ok !== true) {
    return { valid: false, reason: "local_closure_audit_not_ok" };
  }
  if (result.materiality.chain_closed_local_only !== true) {
    return { valid: false, reason: "local_chain_not_closed" };
  }
  if (result.closure_readiness_summary.local_chain_closed !== true) {
    return { valid: false, reason: "closure_readiness_summary_not_closed" };
  }
  if (result.closure_readiness_summary.real_capabilities_opened !== false) {
    return { valid: false, reason: "real_capabilities_opened" };
  }
  if (
    result.next_authorization_boundary_check.automatic_promotion_allowed !== false
  ) {
    return { valid: false, reason: "automatic_promotion_not_blocked" };
  }

  return { valid: true };
}

function buildReadinessPack(
  input: ControlledCapabilityPromotionReadinessInput,
  ok: boolean,
): ControlledPromotionReadinessPack {
  const closureSummary = input.local_closure_audit_result.closure_readiness_summary;
  const restrictions = unique([
    ...closureSummary.restrictions,
    "promotion_execution_blocked_in_this_tramo",
    "automatic_promotion_blocked",
    "runtime_40_20_requires_explicit_next_authorization",
    "registry_real_minimal_is_first_authorization_candidate",
  ]);

  return {
    pack_id: `CONTROLLED_PROMOTION_READINESS_PACK:${input.case_id}`,
    case_id: input.case_id,
    readiness_status: ok ? "ready_for_authorization_review" : "blocked",
    local_chain_closed: ok,
    real_capabilities_opened: false,
    promotion_executed: false,
    automatic_promotion_allowed: false,
    recommended_first_authorization: ok ? "registry_real_minimal" : "blocked",
    readiness_statement: ok
      ? "Local materiality chain is closed for authorization review only; controlled real capability promotion remains blocked until explicit next authorization."
      : "Controlled promotion readiness is blocked because the accepted local closure audit conditions were not met.",
    restrictions,
  };
}

function buildPromotionScopeMatrix(
  localClosureAccepted: boolean,
): PromotionScopeMatrixEntry[] {
  return CAPABILITY_SEQUENCE.map((capability, index) => ({
    capability,
    may_be_authorized_later: localClosureAccepted,
    authorized_now: false,
    executed_now: false,
    recommended_order: localClosureAccepted ? index + 1 : null,
    prerequisite_capabilities: CAPABILITY_SEQUENCE.slice(0, index),
    blocked_until_authorized: true,
    reason: `${capability} may be reviewed only after explicit authorization; it is not authorized or executed in this tramo.`,
  }));
}

function buildCapabilityPromotionSequence(): CapabilityPromotionSequenceStep[] {
  return CAPABILITY_SEQUENCE.map((capability, index) => ({
    step_id: `CONTROLLED_PROMOTION_SEQUENCE:${index + 1}:${capability}`,
    order: index + 1,
    capability,
    promotion_type: promotionTypeFor(capability),
    allowed_in_this_tramo: false,
    requires_explicit_next_authorization: true,
    rollback_required: true,
    reason:
      capability === "runtime_40_20_real"
        ? "Runtime 40/20 real can only be considered after minimal real capabilities are explicitly authorized."
        : `${capability} remains a future authorization candidate and is not executed now.`,
  }));
}

function buildAuthorizationGateManifest(): AuthorizationGateManifestItem[] {
  return CAPABILITY_SEQUENCE.flatMap((capability) =>
    GATE_TYPES.map((gateType) => ({
      gate_id: `AUTHORIZATION_GATE:${capability}:${gateType}`,
      capability,
      gate_type: gateType,
      gate_required: true,
      gate_passed_now: false,
      gate_execution_allowed_now: false,
    })),
  );
}

function buildRiskBoundaryManifest(): RiskBoundaryManifestItem[] {
  return CAPABILITY_SEQUENCE.map((capability) => ({
    risk_id: `RISK_BOUNDARY:${capability}`,
    capability,
    risk_type: riskTypeFor(capability),
    severity: riskSeverityFor(capability),
    mitigation_required: true,
  }));
}

function buildRollbackGuardManifest(): RollbackGuardManifestItem[] {
  return CAPABILITY_SEQUENCE.map((capability) => ({
    rollback_guard_id: `ROLLBACK_GUARD:${capability}`,
    capability,
    rollback_required_before_promotion: true,
    rollback_defined_now: true,
    rollback_executed_now: false,
    reason: `${capability} requires rollback definition before any later authorization; no rollback is executed now.`,
  }));
}

function promotionTypeFor(
  capability: ControlledPromotionCapability,
): CapabilityPromotionSequenceStep["promotion_type"] {
  if (capability === "runtime_40_20_real") {
    return "runtime_installation";
  }
  if (capability === "export_real" || capability === "diagnosis_delivery_real") {
    return "delivery_capability";
  }
  return "minimal_real_capability";
}

function riskTypeFor(
  capability: ControlledPromotionCapability,
): RiskBoundaryManifestItem["risk_type"] {
  if (capability === "registry_real_minimal") {
    return "registry_without_conformance";
  }
  if (capability === "runtime_40_20_real") {
    return "runtime_on_simulation";
  }
  if (capability === "export_real") {
    return "export_before_diagnosis_authorization";
  }
  if (capability === "diagnosis_delivery_real") {
    return "diagnosis_before_runtime_evidence";
  }
  if (capability === "parallel_production_real") {
    return "premature_delivery";
  }
  return "uncontrolled_persistence";
}

function riskSeverityFor(
  capability: ControlledPromotionCapability,
): RiskBoundaryManifestItem["severity"] {
  if (
    capability === "runtime_40_20_real" ||
    capability === "diagnosis_delivery_real"
  ) {
    return "critical";
  }
  if (
    capability === "registry_real_minimal" ||
    capability === "parallel_production_real" ||
    capability === "export_real"
  ) {
    return "high";
  }
  return "medium";
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
