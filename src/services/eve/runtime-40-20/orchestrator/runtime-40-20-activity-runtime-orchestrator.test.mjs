import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const service = loadModule("runtime-40-20-activity-runtime-orchestrator-service.ts", {
  "./runtime-40-20-activity-runtime-orchestrator-types": {},
});

test("creates orchestrator local plan from valid canonicalization result", () => {
  assert.equal(run().ok, true);
});

test("creates role runtime session plan", () => {
  const plan = run().role_runtime_session_plan;

  assert.equal(plan.case_id, "CASE-001");
  assert.equal(plan.role_id, "ROLE-001");
  assert.equal(plan.runtime_40_20_started, false);
});

test("enforces primary_activity_limit=8", () => {
  assert.equal(run().role_runtime_session_plan.primary_activity_limit, 8);
});

test("blocks if more than 8 primary activities", () => {
  const result = run({ primary_activities: activities(9) });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "primary_activity_limit_exceeded");
  assert.equal(result.primary_activity_selection_plan.primary_activity_limit_exceeded, true);
});

test("preserves secondary activities as non-primary context", () => {
  const result = run();

  assert.equal(result.primary_activity_selection_plan.secondary_activities.length, 1);
  assert.equal(result.primary_activity_selection_plan.context_only_activities.length, 1);
  assert.equal(result.primary_activity_selection_plan.preserved_non_primary_context, true);
});

test("creates one activity runtime run plan per primary activity", () => {
  assert.equal(run().activity_runtime_run_plans.length, 2);
});

test("sets run initial_state=initialized", () => {
  assert.equal(run().activity_runtime_run_plans[0].initial_state, "initialized");
});

test("sets allowed_first_transition initialized->semantic_preload_loaded", () => {
  const transition = run().activity_runtime_run_plans[0].allowed_first_transition;

  assert.equal(transition.from, "initialized");
  assert.equal(transition.to, "semantic_preload_loaded");
});

test("creates interaction queue plan with 40 base and 20 causal refs", () => {
  const queue = run().interaction_queue_plans[0];

  assert.equal(queue.base_interaction_count, 40);
  assert.equal(queue.causal_interaction_count, 20);
  assert.equal(queue.base_interaction_refs.length, 40);
  assert.equal(queue.causal_interaction_refs.length, 20);
});

test("keeps causal queue pending_by_rule", () => {
  assert.equal(run().interaction_queue_plans[0].causal_queue_state, "pending_by_rule");
});

test("creates next decision semantic_preload_ready when semantic_preload_present=true", () => {
  const decision = run().next_interaction_decisions[0];

  assert.equal(decision.decision_type, "semantic_preload_ready");
  assert.equal(decision.next_state_hint, "semantic_preload_loaded");
  assert.equal(decision.next_interaction_hint, "B0_confirmation");
});

test("creates next decision requires_semantic_preload when semantic_preload_present=false", () => {
  const decision = run().next_interaction_decisions[1];

  assert.equal(decision.decision_type, "requires_semantic_preload");
  assert.equal(decision.next_state_hint, "initialized");
  assert.equal(decision.next_interaction_hint, "requires_semantic_preload");
});

test("creates budget preview with base_limit=40 and causal_limit=20", () => {
  const budget = run().budget_ledger_previews[0];

  assert.equal(budget.base_limit, 40);
  assert.equal(budget.causal_limit, 20);
});

test("keeps base_consumed=0", () => {
  assert.equal(run().budget_ledger_previews[0].base_consumed, 0);
});

test("keeps causal_consumed=0", () => {
  assert.equal(run().budget_ledger_previews[0].causal_consumed, 0);
});

test("blocks if catalog_canonicalization_result.ok=false", () => {
  const result = run({ catalog_canonicalization_result: canonicalizationResult({ ok: false }) });

  assert.equal(result.ok, false);
  assert.ok(result.no_go_check.blockers.includes("catalog_canonicalization_result_not_ok"));
});

test("blocks if state_machine_contract_ready=false", () => {
  const result = run({ state_machine_contract_ready: false });

  assert.equal(result.ok, false);
  assert.ok(result.no_go_check.blockers.includes("state_machine_contract_not_ready"));
});

test("blocks if interaction count is not 60", () => {
  const canonicalization = canonicalizationResult();
  canonicalization.canonical_model.interaction_definitions.pop();

  const result = run({ catalog_canonicalization_result: canonicalization });

  assert.equal(result.ok, false);
  assert.ok(result.no_go_check.blockers.includes("interaction_definition_count_not_60"));
});

test("keeps runtime_40_20_started=false", () => {
  assert.equal(run().no_go_check.runtime_40_20_started, false);
});

test("keeps catalog_activated=false", () => {
  assert.equal(run().no_go_check.catalog_activated, false);
});

test("keeps migration_applied=false", () => {
  assert.equal(run().no_go_check.migration_applied, false);
});

test("keeps Supabase/SQL/endpoint false", () => {
  const noGo = run().no_go_check;

  assert.equal(noGo.supabase_touched, false);
  assert.equal(noGo.sql_executed, false);
  assert.equal(noGo.endpoint_created, false);
});

test("keeps real_runtime_records_created=false", () => {
  assert.equal(run().no_go_check.real_runtime_records_created, false);
});

test("keeps real_interaction_instances_created=false", () => {
  assert.equal(run().no_go_check.real_interaction_instances_created, false);
  assert.equal(run().interaction_queue_plans[0].real_interaction_instances_created, false);
});

test("keeps business_evidence_created=false", () => {
  assert.equal(run().no_go_check.business_evidence_created, false);
});

test("keeps Registry/IR/Object Inventory/F5C/export/diagnosis/Delivered false", () => {
  const noGo = run().no_go_check;

  assert.equal(noGo.registry_live_db_created, false);
  assert.equal(noGo.ir_real_created, false);
  assert.equal(noGo.object_inventory_real_opened, false);
  assert.equal(noGo.f5c_real_opened, false);
  assert.equal(noGo.export_created, false);
  assert.equal(noGo.diagnosis_created, false);
  assert.equal(noGo.delivered_created, false);
});

test("does not modify existing services", () => {
  const result = run();

  assert.equal(result.materiality.local_only, true);
  assert.equal(result.readiness_precheck.ready_for_runtime_start, false);
  assert.equal(result.role_runtime_session_plan.metadata.real_session_created, false);
});

function run(overrides = {}) {
  return service.createActivityRuntimeOrchestratorLocalPlan({
    case_id: "CASE-001",
    role_id: "ROLE-001",
    catalog_version_ref: "runtime-40-20-v1.1.1",
    catalog_canonicalization_result: canonicalizationResult(),
    primary_activities: activities(2),
    secondary_activities: [
      {
        activity_id: "S-001",
        activity_label: "Actividad secundaria",
        reason_not_primary: "secondary_context_only",
      },
    ],
    context_only_activities: [
      {
        activity_id: "C-001",
        activity_label: "Actividad de contexto",
        reason_not_primary: "context_only",
      },
    ],
    state_machine_contract_ready: true,
    ...overrides,
  });
}

function activities(count) {
  return Array.from({ length: count }, (_, index) => ({
    activity_id: `A-${String(index + 1).padStart(3, "0")}`,
    activity_label: `Actividad primaria ${index + 1}`,
    role_id: "ROLE-001",
    semantic_preload_present: index % 2 === 0,
  }));
}

function canonicalizationResult(overrides = {}) {
  const interactions = Array.from({ length: 60 }, (_, index) => ({
    runtime_interaction_id: index < 40 ? `B${index + 1}` : `C${index - 39}`,
    interaction_group: index < 40 ? "base" : "causal",
    visible_text: "Pregunta canonica",
    source_refs: [`SRC-${index + 1}`],
    counts_as_base: index < 40,
    counts_as_causal: index >= 40,
    source_document: "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
    source_sheet: index < 40 ? "Runtime_Interactions_Base_40" : "Runtime_Interactions_Causal_20",
    source_row_number: index + 2,
    raw_row: { runtime_interaction_id: index + 1 },
    canonicalization_status: "normalized",
    warnings: [],
    blockers: [],
  }));

  return {
    ok: true,
    case_id: "CASE-001",
    canonical_model: {
      interaction_definitions: interactions,
      source_node_registry: [],
      interaction_source_mappings: [],
      subfield_schemas: [],
      canonical_variable_maps: [],
      branching_rules: [],
      critical_routes: [],
      semantic_gates: [],
      process_state_timer_gates: [],
      readiness_rules: [],
      qa_rules: [],
      implementation_dictionaries: [],
    },
    integrity_gate_results: [],
    canonicalization_report: {
      base_interaction_count: 40,
      causal_interaction_count: 20,
      source_node_count: 0,
      mapping_count: 0,
      subfield_schema_count: 0,
      canonical_variable_count: 0,
      critical_route_count: 0,
      semantic_gate_count: 0,
      process_state_timer_gate_count: 0,
      qa_rule_count: 0,
      blocking_gate_failure_count: 0,
      warning_count: 0,
      catalog_activation_allowed: false,
    },
    no_go_check: {
      no_go_triggered: false,
      blockers: [],
      runtime_40_20_started: false,
      catalog_activated: false,
      supabase_touched: false,
      sql_executed: false,
      endpoint_created: false,
      registry_live_db_created: false,
      ir_real_created: false,
      object_inventory_real_opened: false,
      f5c_real_opened: false,
      export_created: false,
      diagnosis_created: false,
      delivered_created: false,
    },
    materiality: {
      level: "runtime_40_20_catalog_canonicalization_and_integrity_qa",
      local_only: true,
      catalog_activation_allowed: false,
      runtime_40_20_started: false,
      next_authorization_required: true,
    },
    ...overrides,
  };
}

function loadModule(fileName, requireMap) {
  const source = readFileSync(new URL(fileName, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
    },
  });
  const module = { exports: {} };
  const context = {
    exports: module.exports,
    module,
    require: (id) => {
      if (id in requireMap) return requireMap[id];
      throw new Error(`Unexpected require: ${id}`);
    },
  };

  vm.runInNewContext(outputText, context, { filename: fileName });
  return module.exports;
}
