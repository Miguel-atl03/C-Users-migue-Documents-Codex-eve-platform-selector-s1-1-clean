import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const service = loadModule("runtime-40-20-branching-service.ts", {
  "./runtime-40-20-branching-types": {},
  "../canonical-variable/runtime-40-20-canonical-variable-types": {},
  "../catalog-canonicalization/runtime-40-20-catalog-canonicalization-types": {},
});

test("creates branching candidates from valid canonical variables and explicit rule", () => {
  const result = run();

  assert.equal(result.ok, true);
  assert.equal(result.decision_candidates.length, 1);
  assert.equal(result.activation_candidates.length, 1);
});

test("evaluates equals operator", () => {
  assert.equal(run().rule_evaluations[0].matched, true);
});

test("evaluates not_equals operator", () => {
  const result = run({ branching_rules: [branchingRule({ trigger_operator: "not_equals", trigger_value: "otra" })] });

  assert.equal(result.rule_evaluations[0].matched, true);
});

test("evaluates is_present operator", () => {
  const result = run({ branching_rules: [branchingRule({ trigger_operator: "is_present", trigger_value: undefined })] });

  assert.equal(result.rule_evaluations[0].matched, true);
});

test("evaluates is_absent operator", () => {
  const result = run({
    canonical_variable_result: canonicalVariableResult({
      canonical_variable_record_candidates: [canonicalVariableCandidate({ value: "" })],
    }),
    branching_rules: [branchingRule({ trigger_operator: "is_absent", trigger_value: undefined })],
  });

  assert.equal(result.rule_evaluations[0].matched, true);
});

test("evaluates contains_exact operator", () => {
  const result = run({
    canonical_variable_result: canonicalVariableResult({
      canonical_variable_record_candidates: [canonicalVariableCandidate({ value: ["urgente", "riesgo"] })],
    }),
    branching_rules: [branchingRule({ trigger_operator: "contains_exact", trigger_value: "riesgo" })],
  });

  assert.equal(result.rule_evaluations[0].matched, true);
});

test("evaluates greater_than operator", () => {
  const result = run({
    canonical_variable_result: canonicalVariableResult({
      canonical_variable_record_candidates: [canonicalVariableCandidate({ value: 7 })],
    }),
    branching_rules: [branchingRule({ trigger_operator: "greater_than", trigger_value: 5 })],
  });

  assert.equal(result.rule_evaluations[0].matched, true);
});

test("evaluates less_than operator", () => {
  const result = run({
    canonical_variable_result: canonicalVariableResult({
      canonical_variable_record_candidates: [canonicalVariableCandidate({ value: 3 })],
    }),
    branching_rules: [branchingRule({ trigger_operator: "less_than", trigger_value: 5 })],
  });

  assert.equal(result.rule_evaluations[0].matched, true);
});

test("evaluates in_set operator", () => {
  const result = run({ branching_rules: [branchingRule({ trigger_operator: "in_set", trigger_value: ["revisar", "elaborar"] })] });

  assert.equal(result.rule_evaluations[0].matched, true);
});

test("blocks unknown operator with manual_review_required_unknown_operator", () => {
  const result = run({ branching_rules: [branchingRule({ trigger_operator: "semantic_guess" })] });

  assert.equal(result.ok, false);
  assert.equal(result.branching_status, "manual_review_required_unknown_operator");
});

test("blocks canonical_variable_result.ok=false", () => {
  const result = run({ canonical_variable_result: { ...canonicalVariableResult(), ok: false } });

  assert.equal(result.ok, false);
  assert.equal(result.branching_status, "blocked_canonical_variables_not_ready");
});

test("blocks empty branching_rules", () => {
  const result = run({ branching_rules: [] });

  assert.equal(result.ok, false);
  assert.equal(result.branching_status, "blocked_missing_explicit_branching_rule");
});

test("blocks missing variable candidate", () => {
  const result = run({
    canonical_variable_result: canonicalVariableResult({ canonical_variable_record_candidates: [] }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.rule_evaluations[0].evaluation_status, "blocked_missing_variable_candidate");
});

test("blocks missing target causal interaction", () => {
  const result = run({ interaction_definitions: [interactionDefinition("C99", "causal")] });

  assert.equal(result.ok, false);
  assert.equal(result.branching_status, "blocked_missing_target_causal_interaction");
});

test("blocks causal budget exceeded", () => {
  const result = run({ causal_already_planned: 20 });

  assert.equal(result.ok, false);
  assert.equal(result.branching_status, "blocked_causal_budget_exceeded");
});

test("budget preview preserves attempted causal activation when budget exceeded", () => {
  const result = run({ causal_already_planned: 20 });

  assert.equal(result.branching_status, "blocked_causal_budget_exceeded");
  assert.equal(result.budget_preview.causal_activation_attempted, 1);
  assert.equal(result.budget_preview.causal_newly_activated, 1);
  assert.equal(result.budget_preview.causal_budget_exceeded, true);
  assert.equal(result.budget_preview.causal_remaining, 0);
  assert.equal(result.activation_candidates.length, 0);
  assert.equal(result.budget_preview.budget_ledger_real_created, false);
  assert.equal(result.budget_preview.budget_consumed_real, false);
});

test("budget preview allows one matched rule at causal_already_planned=19", () => {
  const result = run({ causal_already_planned: 19 });

  assert.equal(result.branching_status, "branching_candidates_ready");
  assert.equal(result.budget_preview.causal_activation_attempted, 1);
  assert.equal(result.budget_preview.causal_newly_activated, 1);
  assert.equal(result.budget_preview.causal_budget_exceeded, false);
  assert.equal(result.budget_preview.causal_remaining, 0);
  assert.equal(result.activation_candidates.length, 1);
});

test("budget preview blocks two matched rules at causal_already_planned=19", () => {
  const result = run({
    causal_already_planned: 19,
    branching_rules: [
      branchingRule(),
      branchingRule({
        branching_rule_id: "BR-002",
        source_node_ref: "SRC-C10",
        target_causal_interaction_id: "C10",
      }),
    ],
    interaction_definitions: [
      interactionDefinition("C09", "causal"),
      interactionDefinition("C10", "causal"),
    ],
  });

  assert.equal(result.branching_status, "blocked_causal_budget_exceeded");
  assert.equal(result.budget_preview.causal_activation_attempted, 2);
  assert.equal(result.budget_preview.causal_newly_activated, 2);
  assert.equal(result.budget_preview.causal_budget_exceeded, true);
  assert.equal(result.activation_candidates.length, 0);
});

test("creates causal activation candidate only after explicit matched rule", () => {
  const result = run({
    branching_rules: [branchingRule({ trigger_value: "no-match" })],
  });

  assert.equal(result.ok, true);
  assert.equal(result.activation_candidates.length, 0);
});

test("does not use fuzzy matching", () => {
  assert.equal(run().rule_evaluations[0].fuzzy_match_used, false);
  assert.equal(run().decision_candidates[0].fuzzy_match_used, false);
});

test("does not use semantic fallback", () => {
  assert.equal(run().rule_evaluations[0].semantic_fallback_used, false);
  assert.equal(run().decision_candidates[0].semantic_fallback_used, false);
});

test("keeps free_inference_used=false", () => {
  assert.equal(run().rule_evaluations[0].free_inference_used, false);
  assert.equal(run().decision_candidates[0].free_inference_used, false);
});

test("creates budget preview with causal_limit=20", () => {
  assert.equal(run().budget_preview.causal_limit, 20);
});

test("keeps budget_ledger_real_created=false", () => {
  assert.equal(run().budget_preview.budget_ledger_real_created, false);
});

test("keeps budget_consumed_real=false", () => {
  assert.equal(run().budget_preview.budget_consumed_real, false);
});

test("creates audit candidate", () => {
  const audit = run().audit_candidate;

  assert.equal(audit.action, "branching_candidates_created");
  assert.equal(audit.real_audit_record_created, false);
});

test("keeps real_branching_decision_created=false", () => {
  assert.equal(run().decision_candidates[0].real_branching_decision_created, false);
  assert.equal(run().no_go_check.real_branching_decision_created, false);
});

test("keeps real_interaction_instance_created=false", () => {
  assert.equal(run().activation_candidates[0].runtime_interaction_instance_real_created, false);
  assert.equal(run().no_go_check.real_interaction_instance_created, false);
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

test("packaging hygiene requires material files only", () => {
  assert.equal(run().packaging_hygiene.material_files_only_required_for_next_bundle, true);
});

test("packaging hygiene requires POSIX paths", () => {
  assert.equal(run().packaging_hygiene.posix_paths_required_for_next_bundle, true);
});

function run(overrides = {}) {
  return service.createRuntime4020BranchingCandidatesLocal({
    case_id: "CASE-001",
    canonical_variable_result: canonicalVariableResult(),
    branching_rules: [branchingRule()],
    interaction_definitions: [interactionDefinition("C09", "causal")],
    causal_already_planned: 0,
    ...overrides,
  });
}

function canonicalVariableResult(overrides = {}) {
  return {
    ok: true,
    case_id: "CASE-001",
    service_status: "canonical_variable_candidates_ready",
    mapping_decisions: [],
    canonical_variable_record_candidates: [canonicalVariableCandidate()],
    audit_candidate: {},
    no_go_check: noGo(),
    materiality: {
      level: "runtime_40_20_canonical_variable_service_local_contract",
      local_only: true,
      real_canonical_variable_created: false,
      real_evidence_created: false,
      ir_real_created: false,
      object_inventory_real_opened: false,
      runtime_40_20_started: false,
      next_authorization_required: true,
    },
    ...overrides,
  };
}

function canonicalVariableCandidate(overrides = {}) {
  return {
    canonical_variable_record_ref: "CVR-001",
    canonical_variable_id: "CV-001",
    canonical_variable_name: "activity_action_verb",
    canonical_variable_path: "activity.identity.action_verb",
    runtime_interaction_id: "B0-Q01",
    interaction_instance_id_preview: "RUN-001:B0-Q01:preview",
    subfield_name: "action_verb",
    value: "elaborar",
    epistemic_status: "captured_user_evidence",
    provenance_type: "user_answer",
    source_subfield_response_ref: "SUBFIELD-001",
    source_evidence_item_ref: "EVID-001",
    evidence_backed: true,
    requires_user_confirmation: false,
    internal_calculation: false,
    source_trace: {
      source_document: "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
      source_sheet: "Runtime_Interactions_Base_40",
      source_row_number: 2,
      raw_row: {},
    },
    mapping_source_trace: {
      source_document: "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
      source_sheet: "Canonical_Variables",
      source_row_number: 20,
      raw_row: {},
    },
    real_canonical_variable_record_created: false,
    real_evidence_item_created: false,
    ir_real_created: false,
    object_inventory_real_opened: false,
    ...overrides,
  };
}

function branchingRule(overrides = {}) {
  return {
    branching_rule_id: "BR-001",
    source_node_ref: "SRC-C09",
    source_document: "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
    source_sheet: "Trigger_Branching_Rules",
    source_row_number: 30,
    raw_row: {
      branching_rule_id: "BR-001",
    },
    trigger_canonical_variable_id: "CV-001",
    trigger_operator: "equals",
    trigger_value: "elaborar",
    target_causal_interaction_id: "C09",
    budget_bucket: "causal_20",
    ...overrides,
  };
}

function interactionDefinition(id, group) {
  return {
    runtime_interaction_id: id,
    interaction_group: group,
    visible_text: `Visible text ${id}`,
    source_refs: [`SRC-${id}`],
    ui_component: "causal_probe_card",
    counts_as_base: group === "base",
    counts_as_causal: group === "causal",
    source_document: "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
    source_sheet:
      group === "causal" ? "Runtime_Interactions_Causal_20" : "Runtime_Interactions_Base_40",
    source_row_number: 30,
    raw_row: {},
    canonicalization_status: "normalized",
    warnings: [],
    blockers: [],
  };
}

function noGo(overrides = {}) {
  return {
    no_go_triggered: false,
    blockers: [],
    runtime_40_20_started: false,
    catalog_activated: false,
    migration_applied: false,
    supabase_touched: false,
    sql_executed: false,
    endpoint_created: false,
    real_response_persisted: false,
    real_subfield_response_created: false,
    real_evidence_item_created: false,
    real_canonical_variable_record_created: false,
    real_audit_record_created: false,
    real_runtime_records_created: false,
    business_evidence_created: false,
    registry_live_db_created: false,
    ir_real_created: false,
    object_inventory_real_opened: false,
    f5c_real_opened: false,
    export_created: false,
    diagnosis_created: false,
    delivered_created: false,
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
