import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const service = loadModule("runtime-40-20-phase4-pending-audit-causal-guard-service.ts", {
  "./runtime-40-20-phase4-pending-audit-causal-guard-types": {},
});

test("creates local audit candidates for all seven pending Phase 4 items", () => {
  const result = run();

  assert.equal(result.audit_candidates.length, 7);
  assert.equal(
    JSON.stringify(result.audit_candidates.map((candidate) => candidate.action)),
    JSON.stringify([
      "primary_activity_limit_attempt",
      "state_transition_candidate",
      "next_interaction_calculation_candidate",
      "budget_state_evaluation_candidate",
      "primary_activity_limit_exceeded",
      "b0_skip_attempt_blocked",
      "causal_opening_without_trigger_blocked",
    ]),
  );
});

test("blocks primary activity count > 8 without override", () => {
  const result = run({
    primary_activity_guard: {
      selected_primary_activity_count: 9,
      primary_activity_limit: 8,
      override_authorized: false,
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.guard_status, "blocked_primary_activity_limit_exceeded");
});

test("allows primary activity count = 8", () => {
  assert.equal(run().ok, true);
});

test("blocks B0 skip attempt to active_base_capture without confirmation", () => {
  const result = run({
    b0_skip_guard: {
      current_state: "semantic_preload_loaded",
      requested_next_state: "active_base_capture",
      b0_confirmation_completed: false,
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.guard_status, "blocked_b0_skip_attempt");
});

test("allows active_base_capture when B0 confirmation completed", () => {
  const result = run({
    b0_skip_guard: {
      current_state: "b0_confirmation_pending",
      requested_next_state: "active_base_capture",
      b0_confirmation_completed: true,
    },
  });

  assert.equal(result.ok, true);
});

test("blocks causal interaction opening without explicit trigger", () => {
  const result = run({
    causal_opening_guard: {
      requested_interaction_group: "causal",
      explicit_trigger_authorized: false,
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.guard_status, "blocked_causal_opening_without_trigger");
});

test("allows causal interaction opening only when explicit_trigger_authorized=true", () => {
  const result = run({
    causal_opening_guard: {
      requested_interaction_group: "causal",
      explicit_trigger_authorized: true,
    },
  });

  assert.equal(result.ok, true);
});

test("blocks base_visible_count > 40", () => {
  const result = run({
    budget_state_guard: {
      base_visible_count: 41,
      causal_visible_count: 20,
      base_limit: 40,
      causal_limit: 20,
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.guard_status, "blocked_budget_state_exceeded");
});

test("blocks causal_visible_count > 20", () => {
  const result = run({
    budget_state_guard: {
      base_visible_count: 40,
      causal_visible_count: 21,
      base_limit: 40,
      causal_limit: 20,
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.guard_status, "blocked_budget_state_exceeded");
});

test("keeps real_audit_trail_created=false", () => {
  const result = run();

  assert.equal(result.no_go_check.real_audit_trail_created, false);
  assert.ok(result.audit_candidates.every((candidate) => !candidate.real_audit_trail_created));
});

test("keeps runtime_40_20_started=false", () => {
  assert.equal(run().no_go_check.runtime_40_20_started, false);
});

test("keeps phase4_closed_local=false", () => {
  assert.equal(run().materiality.phase4_closed_local, false);
});

test("keeps ready_for_phase5_authorization=false", () => {
  assert.equal(run().materiality.ready_for_phase5_authorization, false);
});

test("keeps phase5_started=false", () => {
  assert.equal(run().materiality.phase5_started, false);
});

test("keeps Supabase/SQL/endpoint false", () => {
  const result = run();

  assert.equal(result.no_go_check.supabase_touched, false);
  assert.equal(result.no_go_check.sql_executed, false);
  assert.equal(result.no_go_check.endpoint_created, false);
});

test("does not consume BranchingEngine", () => {
  assert.equal(run().no_go_check.branching_engine_consumed, false);
});

test("does not consume ReadinessEngine", () => {
  assert.equal(run().no_go_check.readiness_engine_consumed, false);
});

test("does not consume Exporter", () => {
  assert.equal(run().no_go_check.exporter_consumed, false);
});

test("packaging hygiene: material files only", () => {
  assert.equal(service.RUNTIME_PHASE4_PENDING_PACKAGING_HYGIENE.material_files_only, true);
  assert.equal(service.RUNTIME_PHASE4_PENDING_PACKAGING_HYGIENE.material_files.length, 5);
});

test("packaging hygiene: POSIX paths only", () => {
  const files = service.RUNTIME_PHASE4_PENDING_PACKAGING_HYGIENE.material_files;

  assert.equal(service.RUNTIME_PHASE4_PENDING_PACKAGING_HYGIENE.posix_paths_only, true);
  assert.ok(files.every((file) => !file.includes("\\")));
  assert.ok(files.every((file) => !/^[A-Za-z]:/.test(file)));
});

function run(overrides = {}) {
  return service.createRuntime4020Phase4PendingAuditAndCausalGuardLocal({
    case_id: "CASE-001",
    primary_activity_guard: {
      selected_primary_activity_count: 8,
      primary_activity_limit: 8,
      override_authorized: false,
    },
    b0_skip_guard: {
      current_state: "b0_confirmation_pending",
      requested_next_state: "active_base_capture",
      b0_confirmation_completed: true,
    },
    causal_opening_guard: {
      requested_interaction_group: "base",
      explicit_trigger_authorized: false,
    },
    budget_state_guard: {
      base_visible_count: 40,
      causal_visible_count: 20,
      base_limit: 40,
      causal_limit: 20,
    },
    state_machine_contract_ready: true,
    orchestrator_contract_ready: true,
    ...overrides,
  });
}

function loadModule(filename, mocks = {}) {
  const source = readFileSync(new URL(filename, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  });
  const module = { exports: {} };
  const context = {
    exports: module.exports,
    module,
    require: (specifier) => {
      if (specifier in mocks) return mocks[specifier];
      throw new Error(`Unexpected require: ${specifier}`);
    },
  };

  vm.runInNewContext(outputText, context, { filename });
  return module.exports;
}
