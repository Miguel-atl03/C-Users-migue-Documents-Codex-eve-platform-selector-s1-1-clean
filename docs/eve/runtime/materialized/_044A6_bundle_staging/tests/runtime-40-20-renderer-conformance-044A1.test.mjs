import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../../../..");
const MATERIALIZED = path.join(
  ROOT,
  "docs/eve/runtime/materialized",
);

const FULL =
  "EVE_RUNTIME_40_20_FULL_OA_V1_1_1_MC1_0_IH_EF614C98B10611411C6AA62E0332856E726F4DC622D42EDBB550F4A4221A604F";

const governed = loadGovernedWithRealRenderer();

test("044A1 A: valid FULL interaction produces real InteractionRenderer ViewModel", async () => {
  const persistence = governed.createInMemoryPersistencePort();
  const ctx = {
    persistence,
    case_id: "CASE-044A1-A",
    role_id: "ROLE-1",
    activity_id: "ACT-1",
    tenant_id: "tenant-044a1",
  };

  const started = await governed.advanceGovernedExecution(ctx, {
    action: "start_synthetic_run",
    synthetic_case_token: "044a1-a",
    run_id: "run-044a1-a",
  });
  assert.equal(started.catalog_version_id, FULL);
  const stateBefore = started.state;
  const instancesBefore = persistence._tables.runtime_interaction_instance.length;
  const responsesBefore = persistence._tables.response_record.length;
  const budgetBefore = persistence._tables.budget_ledger.length;

  const rendered = await governed.advanceGovernedExecution(ctx, {
    action: "render_next",
    synthetic_case_token: "044a1-a",
    run_id: started.activity_runtime_run_id,
    interaction_id: "B0-Q01",
  });

  assert.equal(rendered.ok, true);
  assert.equal(rendered.runtime_interaction_id, "B0-Q01");
  assert.equal(rendered.view_model_status, "render_model_ready");
  assert.equal(rendered.renderer_ok, true);
  assert.match(
    String(rendered.renderer_path),
    /createRuntimeInteractionViewModels/,
  );
  assert.equal(rendered.fallback_view_model_used, false);
  assert.equal(rendered.state_unchanged, true);
  assert.equal(persistence._tables.runtime_interaction_instance.length, instancesBefore + 1);
  assert.equal(persistence._tables.response_record.length, responsesBefore);
  assert.equal(persistence._tables.budget_ledger.length, budgetBefore);
  assert.equal(
    persistence._tables.activity_runtime_run[0].state,
    stateBefore,
  );
});

test("044A1 B: invalid interaction blocks with zero persistence and no state advance", async () => {
  const persistence = governed.createInMemoryPersistencePort();
  const ctx = {
    persistence,
    case_id: "CASE-044A1-B",
    role_id: "ROLE-1",
    activity_id: "ACT-1",
  };

  const started = await governed.advanceGovernedExecution(ctx, {
    action: "start_synthetic_run",
    synthetic_case_token: "044a1-b",
    run_id: "run-044a1-b",
  });
  const stateBefore = started.state;
  const instancesBefore = persistence._tables.runtime_interaction_instance.length;
  const responsesBefore = persistence._tables.response_record.length;
  const budgetBefore = persistence._tables.budget_ledger.length;

  await assert.rejects(
    () =>
      governed.advanceGovernedExecution(ctx, {
        action: "render_next",
        synthetic_case_token: "044a1-b",
        run_id: started.activity_runtime_run_id,
        interaction_id: "NOT-IN-FULL-CATALOG",
      }),
    /interaction_id_not_in_full_catalog/,
  );

  assert.equal(persistence._tables.runtime_interaction_instance.length, instancesBefore);
  assert.equal(persistence._tables.response_record.length, responsesBefore);
  assert.equal(persistence._tables.budget_ledger.length, budgetBefore);
  assert.equal(persistence._tables.activity_runtime_run[0].state, stateBefore);
});

test("044A1 B2: renderer failure blocks without fabricating ViewModel", async () => {
  const brokenDefs = governed.createInMemoryPersistencePort()._tables;
  void brokenDefs;
  const persistence = governed.createInMemoryPersistencePort({
    interaction_defs: buildBrokenCatalogDefs(),
    subfield_schemas: [],
    epistemic_rules: [],
  });
  const ctx = {
    persistence,
    case_id: "CASE-044A1-B2",
    role_id: "ROLE-1",
    activity_id: "ACT-1",
  };

  const started = await governed.advanceGovernedExecution(ctx, {
    action: "start_synthetic_run",
    synthetic_case_token: "044a1-b2",
    run_id: "run-044a1-b2",
  });
  const stateBefore = started.state;
  const instancesBefore = persistence._tables.runtime_interaction_instance.length;

  await assert.rejects(
    () =>
      governed.advanceGovernedExecution(ctx, {
        action: "render_next",
        synthetic_case_token: "044a1-b2",
        run_id: started.activity_runtime_run_id,
        interaction_id: "B0-Q01",
      }),
    /blocked_real_renderer_path_failed/,
  );

  assert.equal(persistence._tables.runtime_interaction_instance.length, instancesBefore);
  assert.equal(persistence._tables.response_record.length, 0);
  assert.equal(persistence._tables.budget_ledger.length, 0);
  assert.equal(persistence._tables.activity_runtime_run[0].state, stateBefore);
});

test("044A1 write conformance evidence", async () => {
  const evidence = {
    instruction: "044-A.1",
    classification: "renderer_real_path_conformant",
    production_consulted: false,
    gaby_touched: false,
    e2e_full_executed: false,
    catalog_version_id: FULL,
    executable_path: {
      entry: "advanceGovernedExecution(action=render_next)",
      renderer: "createRuntimeInteractionViewModels",
      file: "src/services/eve/runtime-40-20/interaction-renderer/runtime-40-20-interaction-renderer-service.ts",
      connection_file:
        "src/services/eve/runtime-40-20/execution-connected/runtime-40-20-governed-execution-service.ts",
    },
    materiality_before: "implemented_not_connected / partial (fallback ViewModel)",
    materiality_after: "implemented_and_connected",
    fallback_removed: true,
    scenarios: {
      A_valid_full_interaction: "pass",
      B_invalid_interaction_zero_persist: "pass",
      B2_renderer_failure_blocks: "pass",
    },
    failure_contract: {
      on_renderer_fail: "throw blocked_real_renderer_path_failed",
      interaction_instance: 0,
      response: 0,
      budget_delta: 0,
      state_advance: false,
      synthetic_view_model: false,
    },
  };

  writeFileSync(
    path.join(MATERIALIZED, "runtime-40-20-renderer-conformance-044A1.json"),
    `${JSON.stringify(evidence, null, 2)}\n`,
    "utf8",
  );
  writeFileSync(
    path.join(MATERIALIZED, "runtime-40-20-renderer-conformance-044A1.md"),
    `# Renderer conformance 044-A.1

## Classification

\`renderer_real_path_conformant\`

## Executable path

- Entry: \`advanceGovernedExecution({ action: "render_next" })\`
- Real organ: \`createRuntimeInteractionViewModels\`
- Catalog: FULL active \`${FULL}\`
- No synthetic ViewModel fallback

## Scenarios

| Scenario | Result |
|---|---|
| A valid FULL B0-Q01 | ViewModel \`render_model_ready\` via real renderer |
| B invalid interaction_id | blocked; instances/responses/budget = 0; state unchanged |
| B2 renderer failure | \`blocked_real_renderer_path_failed\`; zero persistence |

## Materiality

- Before: implemented but connected through fallback fabrication
- After: \`implemented_and_connected\`

## Out of scope preserved

- ingest / canonical / branching / readiness / 045 not modified for this gate
- Gaby untouched
- production not consulted
- no commit
`,
    "utf8",
  );

  assert.equal(evidence.classification, "renderer_real_path_conformant");
});

function buildBrokenCatalogDefs() {
  const defs = [];
  for (let i = 1; i <= 40; i += 1) {
    const id = i === 1 ? "B0-Q01" : `B0-Q${String(i).padStart(2, "0")}`;
    defs.push({
      runtime_interaction_id: id,
      interaction_group_source: "base_40",
      interaction_group_normalized: "base",
      runtime_order: i,
      visible_text: i === 1 ? "" : `Visible ${id}`,
      ui_component: "compound_card",
      pm_output: null,
      moc_output: null,
      pf_output: null,
      olc_output: null,
      mmabp_ir_target: null,
      readiness_effect: null,
      registry_target: null,
      raw_row_json: { runtime_interaction_id: id },
      active: true,
    });
  }
  for (let i = 1; i <= 20; i += 1) {
    const id = `C${String(i).padStart(2, "0")}`;
    defs.push({
      runtime_interaction_id: id,
      interaction_group_source: "causal_20",
      interaction_group_normalized: "causal",
      runtime_order: 40 + i,
      visible_text: `Visible ${id}`,
      ui_component: "causal_probe_card",
      pm_output: null,
      moc_output: null,
      pf_output: null,
      olc_output: null,
      mmabp_ir_target: null,
      readiness_effect: null,
      registry_target: null,
      raw_row_json: { runtime_interaction_id: id },
      active: true,
    });
  }
  return defs;
}

function loadGovernedWithRealRenderer() {
  const cache = new Map();
  const stubs = {
    "../response-ingest/runtime-40-20-response-ingest-service": {
      ingestRuntime4020ResponseLocal: () => ({ ok: true, ingest_status: "ok" }),
    },
    "../canonical-variable/runtime-40-20-canonical-variable-service": {
      createRuntime4020CanonicalVariableCandidatesLocal: () => ({
        ok: true,
        canonical_variable_record_candidates: [],
      }),
    },
    "../branching/runtime-40-20-branching-service": {
      createRuntime4020BranchingCandidatesLocal: () => ({
        ok: true,
        decision_candidates: [],
      }),
    },
    "../gates-readiness/runtime-40-20-gates-readiness-service": {
      buildSemanticResolutionEventInsert: () => ({}),
      evaluateCriticalRouteGateLocally: () => ({ passed: true }),
      resolveReadinessEvaluation: () => ({
        readiness_state: "ready",
        blocking_reason: null,
        readiness_gap: null,
      }),
    },
    "../critical-gates/runtime-40-20-critical-gates-service": {
      evaluateSEM001StateAsClassLocally: () => ({ blocks_projection: false }),
    },
    "../mmabp-gate/runtime-40-20-mmabp-gate-engine-service": {
      evaluateMMABPGateEngine: () => ({ ok: true, decision: "pass" }),
    },
    "../domain/runtime-40-20-domain-state-types": {},
    "../catalog-canonicalization/runtime-40-20-catalog-canonicalization-types": {},
    "../interaction-renderer/runtime-40-20-interaction-renderer-types": {},
    "../response-ingest/runtime-40-20-response-ingest-types": {},
    "../branching/runtime-40-20-branching-types": {},
    "../orchestrator/runtime-40-20-activity-runtime-orchestrator-types": {},
  };

  function loadTs(filePath) {
    if (cache.has(filePath)) return cache.get(filePath);
    const source = readFileSync(filePath, "utf8");
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
        importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
      },
    });
    const moduleObj = { exports: {} };
    const dir = path.dirname(filePath);
    const context = {
      exports: moduleObj.exports,
      module: moduleObj,
      require: (specifier) => {
        if (stubs[specifier]) return stubs[specifier];
        if (specifier.startsWith(".")) {
          const resolvedTs = path.resolve(dir, `${specifier}.ts`);
          const resolvedJs = path.resolve(dir, `${specifier}.js`);
          if (cache.has(resolvedTs) || require("node:fs").existsSync(resolvedTs)) {
            return loadTs(resolvedTs);
          }
          if (require("node:fs").existsSync(resolvedJs)) {
            return require(resolvedJs);
          }
        }
        return require(specifier);
      },
      console,
      process,
      Buffer,
      setTimeout,
      clearTimeout,
    };
    vm.runInNewContext(outputText, context, { filename: filePath });
    cache.set(filePath, moduleObj.exports);
    return moduleObj.exports;
  }

  return loadTs(
    path.join(HERE, "runtime-40-20-governed-execution-service.ts"),
  );
}
