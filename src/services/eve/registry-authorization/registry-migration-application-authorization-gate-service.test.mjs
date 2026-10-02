import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const service = loadService();

test("creates migration application authorization gate from valid traceability inputs", () => {
  const result = run();

  assert.equal(result.ok, true);
  assert.equal(result.materiality.authorization_gate_only, true);
  assert.equal(result.materiality.migration_applied, false);
});

test("creates preconditions check", () => {
  const result = run();

  assert.equal(result.preconditions_check.ready_for_authorization_review, true);
  assert.equal(result.preconditions_check.sql_service_contract_aligned, true);
});

test("creates migration safety checklist", () => {
  const result = run();

  assert.equal(result.migration_safety_checklist.migration_file_present, true);
  assert.equal(result.migration_safety_checklist.safe_to_apply_now, false);
});

test("creates Supabase execution boundary check", () => {
  const result = run();

  assert.equal(
    result.supabase_execution_boundary_check.supabase_touch_allowed_now,
    false,
  );
  assert.equal(
    result.supabase_execution_boundary_check.sql_execution_allowed_now,
    false,
  );
});

test("creates RLS ownership readiness check", () => {
  const result = run();

  assert.equal(
    result.rls_ownership_readiness_check.rls_required_before_production_use,
    true,
  );
  assert.equal(result.rls_ownership_readiness_check.rls_policy_created_now, false);
});

test("creates migration rollback readiness check", () => {
  const result = run();

  assert.equal(result.migration_rollback_readiness_check.rollback_plan_required, true);
  assert.equal(result.migration_rollback_readiness_check.rollback_executed_now, false);
});

test("creates live DB application decision candidate", () => {
  const result = run();

  assert.equal(
    result.live_db_application_decision_candidate.live_db_created_now,
    false,
  );
});

test("creates migration application No-Go check", () => {
  const result = run();

  assert.equal(result.migration_application_no_go_check.migration_applied, false);
  assert.equal(result.migration_application_no_go_check.sql_executed, false);
});

test("recommends authorize_later_with_explicit_human_approval", () => {
  const result = run();

  assert.equal(
    result.live_db_application_decision_candidate.decision_candidate,
    "authorize_later_with_explicit_human_approval",
  );
});

test("keeps migration_applied=false", () => {
  const result = run();

  assert.equal(result.no_go.migration_applied, false);
});

test("keeps supabase_touched=false", () => {
  const result = run();

  assert.equal(result.no_go.supabase_touched, false);
});

test("keeps env_read=false", () => {
  const result = run();

  assert.equal(result.no_go.env_read, false);
});

test("keeps service_role_used=false", () => {
  const result = run();

  assert.equal(result.no_go.service_role_used, false);
});

test("keeps sql_executed=false", () => {
  const result = run();

  assert.equal(result.no_go.sql_executed, false);
});

test("keeps endpoint_created=false", () => {
  const result = run();

  assert.equal(result.no_go.endpoint_created, false);
});

test("blocks if service_sql_contract_aligned=false", () => {
  const input = validInput();
  input.contract_alignment_traceability.service_sql_contract_aligned = false;
  const result = run(input);

  assert.equal(result.ok, false);
  assert.match(result.blocked_reason, /service_sql_contract_not_aligned/);
});

test("blocks if migration_applied=true", () => {
  const input = validInput();
  input.registry_controlled_promotion_traceability.migration_applied = true;
  const result = run(input);

  assert.equal(result.ok, false);
  assert.match(result.blocked_reason, /migration_already_applied/);
});

test("blocks if supabase_touched=true", () => {
  const input = validInput();
  input.contract_alignment_traceability.supabase_touched = true;
  const result = run(input);

  assert.equal(result.ok, false);
  assert.match(result.blocked_reason, /supabase_already_touched/);
});

test("blocks if registry_id_contract is not uuid", () => {
  const input = validInput();
  input.contract_alignment_traceability.registry_id_contract = "deterministic";
  const result = run(input);

  assert.equal(result.ok, false);
  assert.match(result.blocked_reason, /registry_id_contract_not_uuid/);
});

test("keeps Runtime IR Object Inventory F5C export diagnosis Delivered false", () => {
  const result = run();

  assert.equal(result.no_go.runtime_40_20_started, false);
  assert.equal(result.no_go.ir_real_created, false);
  assert.equal(result.no_go.object_inventory_real_opened, false);
  assert.equal(result.no_go.f5c_real_opened, false);
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
  assert.equal(result.materiality.next_authorization_required, true);
});

function run(input = validInput()) {
  return service.runRegistryMigrationApplicationAuthorizationGate(input);
}

function validInput() {
  return {
    case_id: "case:registry-migration-gate",
    registry_controlled_promotion_traceability: {
      registry_real_minimal_created_in_code: true,
      registry_real_minimal_applied_to_live_db: false,
      migration_created: true,
      migration_applied: false,
      supabase_touched: false,
      env_read: false,
    },
    contract_alignment_traceability: {
      service_sql_contract_aligned: true,
      registry_id_contract: "uuid",
      created_by_required: true,
      migration_applied: false,
      supabase_touched: false,
      env_read: false,
    },
  };
}

function loadService() {
  const source = readFileSync(
    new URL("./registry-migration-application-authorization-gate-service.ts", import.meta.url),
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
      if (
        specifier ===
        "./registry-migration-application-authorization-gate-types"
      ) {
        return {};
      }
      throw new Error(`Unexpected require: ${specifier}`);
    },
  };

  vm.runInNewContext(transpiled, context, {
    filename: "registry-migration-application-authorization-gate-service.ts",
  });

  return context.exports;
}
