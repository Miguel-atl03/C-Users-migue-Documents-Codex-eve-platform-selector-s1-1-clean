import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const service = loadService();

test("creates registry authorization dossier from valid promotion readiness pack", () => {
  const result = run();

  assert.equal(result.ok, true);
  assert.equal(result.authorization_dossier.capability, "registry_real_minimal");
  assert.equal(result.authorization_dossier.registry_created_now, false);
});

test("creates registry scope candidate with PM PF MoC OLC", () => {
  const result = run();

  assertJsonEqual(result.registry_scope_candidate.included_registry_families, [
    "PM",
    "PF",
    "MoC",
    "OLC",
  ]);
  assert.equal(result.registry_scope_candidate.minimal_only, true);
});

test("excludes IR Object Inventory F5C Runtime Parallel Production Export Diagnosis", () => {
  const result = run();

  assertJsonEqual(result.registry_scope_candidate.excluded_capabilities, [
    "IR_real",
    "Object_Inventory_real",
    "F5C_real",
    "Runtime_40_20_real",
    "Parallel_Production_real",
    "Export_real",
    "Diagnosis_Delivery_real",
  ]);
});

test("creates registry preconditions check", () => {
  const result = run();

  assert.equal(result.registry_preconditions_check.local_chain_closed, true);
  assert.equal(
    result.registry_preconditions_check.ready_for_authorization_review,
    true,
  );
  assertJsonEqual(result.registry_preconditions_check.blockers, []);
});

test("creates registry security boundary check", () => {
  const result = run();

  assert.equal(result.registry_security_boundary_check.rls_required_before_real_registry, true);
  assert.equal(result.registry_security_boundary_check.service_role_used, false);
  assert.equal(result.registry_security_boundary_check.endpoint_created, false);
});

test("creates persistence plan candidate without executing persistence", () => {
  const result = run();

  assert.equal(
    result.registry_persistence_plan_candidate.persistence_plan_created,
    true,
  );
  assert.equal(result.registry_persistence_plan_candidate.persistence_executed, false);
  assert.equal(result.registry_persistence_plan_candidate.tables_created, false);
});

test("creates rollback plan candidate", () => {
  const result = run();

  assert.equal(
    result.registry_rollback_plan_candidate.rollback_required_before_execution,
    true,
  );
  assert.equal(result.registry_rollback_plan_candidate.rollback_defined_now, true);
  assert.equal(result.registry_rollback_plan_candidate.rollback_executed_now, false);
});

test("creates registry authorization decision candidate", () => {
  const result = run();

  assert.equal(
    result.registry_authorization_decision_candidate.requires_explicit_human_approval_next,
    true,
  );
  assert.equal(
    result.registry_authorization_decision_candidate.registry_created_now,
    false,
  );
});

test("creates registry authorization No-Go check", () => {
  const result = run();

  assert.equal(
    result.registry_authorization_no_go_check.authorization_executed,
    false,
  );
  assert.equal(
    result.registry_authorization_no_go_check.registry_real_created,
    false,
  );
});

test("recommends authorize_later_with_explicit_human_approval", () => {
  const result = run();

  assert.equal(
    result.registry_authorization_decision_candidate.decision_candidate,
    "authorize_later_with_explicit_human_approval",
  );
});

test("keeps authorization_executed=false", () => {
  const result = run();

  assert.equal(result.authorization_dossier.authorization_executed, false);
  assert.equal(result.no_go.authorization_executed, false);
});

test("keeps registry_real_created=false", () => {
  const result = run();

  assert.equal(result.no_go.registry_real_created, false);
  assert.equal(result.materiality.registry_real_created, false);
});

test("keeps PM PF MoC OLC registry real created=false", () => {
  const result = run();

  assert.equal(result.no_go.pm_registry_real_created, false);
  assert.equal(result.no_go.pf_registry_real_created, false);
  assert.equal(result.no_go.moc_registry_real_created, false);
  assert.equal(result.no_go.olc_registry_real_created, false);
});

test("keeps SQL migration Supabase env false", () => {
  const result = run();

  assert.equal(result.no_go.sql_created, false);
  assert.equal(result.no_go.migration_created, false);
  assert.equal(result.no_go.supabase_touched, false);
  assert.equal(result.no_go.env_read, false);
});

test("blocks if recommended_first_authorization is not registry_real_minimal", () => {
  const readiness = promotionReadinessResult();
  readiness.readiness_pack.recommended_first_authorization = "manual_review_required";
  const result = run({ promotion_readiness_result: readiness });

  assert.equal(result.ok, false);
  assert.equal(
    result.registry_authorization_decision_candidate.decision_candidate,
    "blocked",
  );
});

test("blocks if promotion_executed=true", () => {
  const readiness = promotionReadinessResult();
  readiness.no_go.promotion_executed = true;
  const result = run({ promotion_readiness_result: readiness });

  assert.equal(result.ok, false);
  assert.match(result.blocked_reason, /promotion_executed/);
});

test("blocks if automatic_promotion_allowed=true", () => {
  const readiness = promotionReadinessResult();
  readiness.no_go.automatic_promotion_allowed = true;
  const result = run({ promotion_readiness_result: readiness });

  assert.equal(result.ok, false);
  assert.match(result.blocked_reason, /automatic_promotion_allowed/);
});

test("blocks if registry_real_created=true", () => {
  const readiness = promotionReadinessResult();
  readiness.no_go.registry_real_created = true;
  const result = run({ promotion_readiness_result: readiness });

  assert.equal(result.ok, false);
  assert.match(result.blocked_reason, /registry_real_created/);
});

test("blocks if runtime_40_20_started=true", () => {
  const readiness = promotionReadinessResult();
  readiness.no_go.runtime_40_20_started = true;
  const result = run({ promotion_readiness_result: readiness });

  assert.equal(result.ok, false);
  assert.match(result.blocked_reason, /runtime_40_20_started/);
});

test("keeps IR Object Inventory F5C real false", () => {
  const result = run();

  assert.equal(result.no_go.ir_real_created, false);
  assert.equal(result.no_go.object_inventory_real_opened, false);
  assert.equal(result.no_go.f5c_real_opened, false);
});

test("keeps export diagnosis Delivered false", () => {
  const result = run();

  assert.equal(result.no_go.export_created, false);
  assert.equal(result.no_go.diagnosis_created, false);
  assert.equal(result.no_go.delivered_created, false);
});

test("keeps conformance consistency claimed false", () => {
  const result = run();

  assert.equal(result.no_go.conformance_claimed, false);
  assert.equal(result.no_go.consistency_claimed, false);
});

test("does not modify existing services", () => {
  const result = run();

  assert.equal(result.materiality.local_only, true);
  assert.equal(result.materiality.authorization_executed, false);
  assert.equal(result.materiality.next_authorization_required, true);
});

function run(overrides = {}) {
  return service.runRegistryRealMinimalAuthorizationGate({
    case_id: "case:registry-auth",
    promotion_readiness_result: promotionReadinessResult(),
    ...overrides,
  });
}

function assertJsonEqual(actual, expected) {
  assert.equal(JSON.stringify(actual), JSON.stringify(expected));
}

function promotionReadinessResult() {
  return {
    ok: true,
    case_id: "case:registry-auth",
    readiness_pack: {
      pack_id: "CONTROLLED_PROMOTION_READINESS_PACK:case:registry-auth",
      case_id: "case:registry-auth",
      readiness_status: "ready_for_authorization_review",
      local_chain_closed: true,
      real_capabilities_opened: false,
      promotion_executed: false,
      automatic_promotion_allowed: false,
      recommended_first_authorization: "registry_real_minimal",
      readiness_statement:
        "Local materiality chain is closed for authorization review only.",
      restrictions: [
        "promotion_execution_blocked_in_this_tramo",
        "automatic_promotion_blocked",
      ],
    },
    promotion_scope_matrix: [],
    capability_promotion_sequence: [],
    authorization_gate_manifest: [],
    risk_boundary_manifest: [],
    rollback_guard_manifest: [],
    promotion_no_go_check: {
      no_go_check_id: "CONTROLLED_PROMOTION_NO_GO_CHECK:case:registry-auth",
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
    },
    no_go: {
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
    },
    materiality: {
      level: "controlled_capability_promotion_readiness_pack",
      local_only: true,
      promotion_executed: false,
      next_authorization_required: true,
    },
  };
}

function loadService() {
  const source = readFileSync(
    new URL("./registry-real-minimal-authorization-gate-service.ts", import.meta.url),
    "utf8",
  );
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
    },
  }).outputText;
  const context = {
    exports: {},
    require(specifier) {
      if (specifier === "./registry-real-minimal-authorization-gate-types") {
        return {};
      }
      throw new Error(`Unexpected require: ${specifier}`);
    },
  };

  vm.runInNewContext(transpiled, context, {
    filename: "registry-real-minimal-authorization-gate-service.ts",
  });

  return context.exports;
}
