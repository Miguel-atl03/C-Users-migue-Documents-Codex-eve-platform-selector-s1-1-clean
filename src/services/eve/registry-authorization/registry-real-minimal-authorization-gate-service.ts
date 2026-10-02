import type {
  RegistryAuthorizationDecisionCandidate,
  RegistryAuthorizationDecisionCandidateRecord,
  RegistryAuthorizationDossier,
  RegistryAuthorizationNoGoCheck,
  RegistryExcludedCapability,
  RegistryFamily,
  RegistryPersistencePlanCandidate,
  RegistryPreconditionsCheck,
  RegistryRealMinimalAuthorizationGateInput,
  RegistryRealMinimalAuthorizationGateResult,
  RegistryRollbackPlanCandidate,
  RegistryScopeCandidate,
  RegistrySecurityBoundaryCheck,
} from "./registry-real-minimal-authorization-gate-types";

const REGISTRY_FAMILIES: RegistryFamily[] = ["PM", "PF", "MoC", "OLC"];

const EXCLUDED_CAPABILITIES: RegistryExcludedCapability[] = [
  "IR_real",
  "Object_Inventory_real",
  "F5C_real",
  "Runtime_40_20_real",
  "Parallel_Production_real",
  "Export_real",
  "Diagnosis_Delivery_real",
];

const NO_GO: RegistryRealMinimalAuthorizationGateResult["no_go"] = {
  authorization_executed: false,
  registry_real_created: false,
  pm_registry_real_created: false,
  pf_registry_real_created: false,
  moc_registry_real_created: false,
  olc_registry_real_created: false,
  ir_real_created: false,
  object_inventory_real_opened: false,
  f5c_real_opened: false,
  runtime_40_20_started: false,
  production_parallel_real_opened: false,
  control_plane_real_opened: false,
  sg_shadow_real_opened: false,
  export_created: false,
  diagnosis_created: false,
  delivered_created: false,
  delivery_authorized: false,
  conformance_claimed: false,
  consistency_claimed: false,
  supabase_touched: false,
  sql_created: false,
  migration_created: false,
  endpoint_created: false,
  env_read: false,
};

const REGISTRY_NO_GO_CHECK: RegistryAuthorizationNoGoCheck = {
  no_go_check_id: "REGISTRY_REAL_MINIMAL_AUTHORIZATION_NO_GO_CHECK",
  authorization_executed: false,
  registry_real_created: false,
  sql_created: false,
  migration_created: false,
  supabase_touched: false,
  endpoint_created: false,
  runtime_40_20_started: false,
  ir_real_created: false,
  object_inventory_real_opened: false,
  f5c_real_opened: false,
  export_created: false,
  diagnosis_created: false,
  delivered_created: false,
  conformance_claimed: false,
  consistency_claimed: false,
};

export function runRegistryRealMinimalAuthorizationGate(
  input: RegistryRealMinimalAuthorizationGateInput,
): RegistryRealMinimalAuthorizationGateResult {
  const blockers = validatePromotionReadiness(input);
  const ok = blockers.length === 0;
  const decisionCandidate: RegistryAuthorizationDecisionCandidate = ok
    ? "authorize_later_with_explicit_human_approval"
    : "blocked";

  return {
    ok,
    case_id: input.case_id,
    authorization_dossier: buildAuthorizationDossier(
      input,
      decisionCandidate,
      ok,
    ),
    registry_scope_candidate: buildRegistryScopeCandidate(input),
    registry_preconditions_check: buildPreconditionsCheck(input, ok, blockers),
    registry_security_boundary_check: buildSecurityBoundaryCheck(input),
    registry_persistence_plan_candidate: buildPersistencePlanCandidate(input),
    registry_rollback_plan_candidate: buildRollbackPlanCandidate(input),
    registry_authorization_decision_candidate:
      buildAuthorizationDecisionCandidate(input, decisionCandidate, ok),
    registry_authorization_no_go_check: {
      ...REGISTRY_NO_GO_CHECK,
      no_go_check_id: `REGISTRY_REAL_MINIMAL_AUTHORIZATION_NO_GO_CHECK:${input.case_id}`,
    },
    blocked_reason: ok ? undefined : blockers.join(";"),
    no_go: NO_GO,
    materiality: {
      level: "registry_real_minimal_authorization_gate_dossier",
      local_only: true,
      authorization_executed: false,
      registry_real_created: false,
      next_authorization_required: true,
    },
  };
}

function validatePromotionReadiness(
  input: RegistryRealMinimalAuthorizationGateInput,
): string[] {
  const result = input.promotion_readiness_result;
  const blockers: string[] = [];

  if (result.ok !== true) {
    blockers.push("promotion_readiness_result_not_ok");
  }
  if (
    result.readiness_pack.recommended_first_authorization !==
    "registry_real_minimal"
  ) {
    blockers.push("recommended_first_authorization_not_registry_real_minimal");
  }
  if (result.no_go.promotion_executed !== false) {
    blockers.push("promotion_executed");
  }
  if (result.no_go.automatic_promotion_allowed !== false) {
    blockers.push("automatic_promotion_allowed");
  }
  if (result.no_go.runtime_40_20_started !== false) {
    blockers.push("runtime_40_20_started");
  }
  if (result.no_go.registry_real_created !== false) {
    blockers.push("registry_real_created");
  }
  if (result.no_go.ir_real_created !== false) {
    blockers.push("ir_real_created");
  }
  if (result.no_go.object_inventory_real_opened !== false) {
    blockers.push("object_inventory_real_opened");
  }
  if (result.no_go.f5c_real_opened !== false) {
    blockers.push("f5c_real_opened");
  }
  if (result.no_go.export_created !== false) {
    blockers.push("export_created");
  }
  if (result.no_go.diagnosis_created !== false) {
    blockers.push("diagnosis_created");
  }
  if (result.no_go.delivered_created !== false) {
    blockers.push("delivered_created");
  }
  if (result.no_go.conformance_claimed !== false) {
    blockers.push("conformance_claimed");
  }
  if (result.no_go.consistency_claimed !== false) {
    blockers.push("consistency_claimed");
  }

  return blockers;
}

function buildAuthorizationDossier(
  input: RegistryRealMinimalAuthorizationGateInput,
  decisionCandidate: RegistryAuthorizationDecisionCandidate,
  ok: boolean,
): RegistryAuthorizationDossier {
  const readinessRestrictions =
    input.promotion_readiness_result.readiness_pack.restrictions;

  return {
    dossier_id: `REGISTRY_REAL_MINIMAL_AUTHORIZATION_DOSSIER:${input.case_id}`,
    case_id: input.case_id,
    capability: "registry_real_minimal",
    decision_candidate: decisionCandidate,
    authorization_executed: false,
    registry_created_now: false,
    readiness_statement: ok
      ? "registry_real_minimal is ready for authorization review only; no authorization was executed and no registry was created."
      : "registry_real_minimal authorization dossier is blocked because promotion readiness preconditions were not met.",
    restrictions: unique([
      ...readinessRestrictions,
      "authorization_execution_blocked_in_this_tramo",
      "registry_real_creation_blocked_in_this_tramo",
      "explicit_human_approval_required_next",
    ]),
  };
}

function buildRegistryScopeCandidate(
  input: RegistryRealMinimalAuthorizationGateInput,
): RegistryScopeCandidate {
  return {
    scope_id: `REGISTRY_REAL_MINIMAL_SCOPE_CANDIDATE:${input.case_id}`,
    capability: "registry_real_minimal",
    included_registry_families: REGISTRY_FAMILIES,
    excluded_capabilities: EXCLUDED_CAPABILITIES,
    minimal_only: true,
    creates_registry_now: false,
    reason:
      "The candidate scope is limited to PM, PF, MoC, and OLC registry families for later authorization review; all other real capabilities remain excluded.",
  };
}

function buildPreconditionsCheck(
  input: RegistryRealMinimalAuthorizationGateInput,
  ok: boolean,
  blockers: string[],
): RegistryPreconditionsCheck {
  const result = input.promotion_readiness_result;

  return {
    check_id: `REGISTRY_REAL_MINIMAL_PRECONDITIONS:${input.case_id}`,
    local_chain_closed: result.readiness_pack.local_chain_closed,
    promotion_readiness_pack_present: result.ok === true,
    recommended_first_authorization_is_registry:
      result.readiness_pack.recommended_first_authorization ===
      "registry_real_minimal",
    registry_candidate_present: ok,
    promotion_executed: false,
    automatic_promotion_allowed: false,
    runtime_40_20_started: false,
    registry_real_created: false,
    ir_real_created: false,
    object_inventory_real_opened: false,
    f5c_real_opened: false,
    conformance_claimed: false,
    consistency_claimed: false,
    ready_for_authorization_review: ok,
    blockers,
  };
}

function buildSecurityBoundaryCheck(
  input: RegistryRealMinimalAuthorizationGateInput,
): RegistrySecurityBoundaryCheck {
  return {
    check_id: `REGISTRY_REAL_MINIMAL_SECURITY_BOUNDARY:${input.case_id}`,
    supabase_touched: false,
    sql_created: false,
    migration_created: false,
    env_read: false,
    endpoint_created: false,
    service_role_used: false,
    rls_required_before_real_registry: true,
    ownership_required_before_real_registry: true,
    security_review_required: true,
    reason:
      "Real registry creation requires explicit future security review, RLS definition, ownership, and authorization before any persistence.",
  };
}

function buildPersistencePlanCandidate(
  input: RegistryRealMinimalAuthorizationGateInput,
): RegistryPersistencePlanCandidate {
  return {
    plan_id: `REGISTRY_REAL_MINIMAL_PERSISTENCE_PLAN_CANDIDATE:${input.case_id}`,
    persistence_plan_created: true,
    persistence_executed: false,
    migration_created: false,
    tables_created: false,
    recommended_future_tables: [
      "pm_registry",
      "pf_registry",
      "moc_registry",
      "olc_registry",
      "registry_audit_log",
      "registry_authorization_log",
    ],
    requires_next_authorization: true,
    reason:
      "Persistence is described only as a future candidate plan; no SQL, migration, table, or registry row is created now.",
  };
}

function buildRollbackPlanCandidate(
  input: RegistryRealMinimalAuthorizationGateInput,
): RegistryRollbackPlanCandidate {
  return {
    rollback_plan_id: `REGISTRY_REAL_MINIMAL_ROLLBACK_PLAN_CANDIDATE:${input.case_id}`,
    rollback_required_before_execution: true,
    rollback_defined_now: true,
    rollback_executed_now: false,
    rollback_scope: [
      "registry_tables",
      "registry_rows",
      "registry_audit_log",
      "registry_service_activation",
      "registry_authorization_log",
    ],
    reason:
      "Rollback is defined as a required future guard before execution; no rollback is executed because no registry execution occurs.",
  };
}

function buildAuthorizationDecisionCandidate(
  input: RegistryRealMinimalAuthorizationGateInput,
  decisionCandidate: RegistryAuthorizationDecisionCandidate,
  ok: boolean,
): RegistryAuthorizationDecisionCandidateRecord {
  return {
    decision_id: `REGISTRY_REAL_MINIMAL_AUTHORIZATION_DECISION_CANDIDATE:${input.case_id}`,
    decision_candidate: decisionCandidate,
    authorization_executed: false,
    registry_created_now: false,
    requires_explicit_human_approval_next: true,
    reason: ok
      ? "All local preconditions support a future explicit human authorization review; no authorization is executed now."
      : "One or more promotion readiness preconditions block the registry authorization dossier.",
  };
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
