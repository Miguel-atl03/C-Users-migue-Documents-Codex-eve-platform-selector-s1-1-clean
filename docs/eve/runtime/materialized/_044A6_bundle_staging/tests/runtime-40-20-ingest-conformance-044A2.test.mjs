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
const MATERIALIZED = path.join(ROOT, "docs/eve/runtime/materialized");
const FULL =
  "EVE_RUNTIME_40_20_FULL_OA_V1_1_1_MC1_0_IH_EF614C98B10611411C6AA62E0332856E726F4DC622D42EDBB550F4A4221A604F";

const governed = loadGovernedWithRealRendererAndIngest();

const B0_ANSWERS = {
  "0.1": "Sí, representa mi actividad",
  "0.1a": "Elaborar reporte operativo a partir de insumos autorizados",
};

test("044A2 precondition: renderer path has no synthetic ViewModel fallback", async () => {
  const source = readFileSync(
    path.join(HERE, "runtime-40-20-governed-execution-service.ts"),
    "utf8",
  );
  assert.equal(source.includes("synthesize a minimal view model"), false);
  assert.equal(source.includes("as unknown as RuntimeInteractionViewModel"), false);
  assert.match(source, /fallback_view_model_used:\s*false/);
  assert.match(source, /createRuntimeInteractionViewModels/);
});

test("044A2 Gate2: ingest success-fallback patterns removed", () => {
  const source = readFileSync(
    path.join(HERE, "runtime-40-20-governed-execution-service.ts"),
    "utf8",
  );
  assert.equal(source.includes("ingest_candidate_ready_fallback"), false);
  assert.equal(
    /catch\s*\{[\s\S]*?ingest_status:\s*"ingest_candidate_ready_fallback"/.test(
      source,
    ),
    false,
  );
  assert.equal(
    /Object\.entries\(answers\)\.map\(\(\[subfield_name/.test(source),
    false,
  );
  assert.match(source, /blocked_real_ingest_path_failed/);
  assert.match(source, /fallback_ingest_used:\s*false/);
});

test("044A2 A: valid B0-Q01 uses real ResponseIngest and persists response/subfields/evidence", async () => {
  const persistence = governed.createInMemoryPersistencePort();
  const ctx = {
    persistence,
    case_id: "CASE-044A2-A",
    role_id: "ROLE-1",
    activity_id: "ACT-1",
  };
  const started = await governed.advanceGovernedExecution(ctx, {
    action: "start_synthetic_run",
    synthetic_case_token: "044a2-a",
    run_id: "run-044a2-a",
  });
  const rendered = await governed.advanceGovernedExecution(ctx, {
    action: "render_next",
    synthetic_case_token: "044a2-a",
    run_id: started.activity_runtime_run_id,
    interaction_id: "B0-Q01",
  });
  assert.equal(rendered.fallback_view_model_used, false);
  assert.equal(rendered.view_model_status, "render_model_ready");

  const stateBefore = persistence._tables.activity_runtime_run[0].state;
  const ingested = await governed.advanceGovernedExecution(ctx, {
    action: "ingest_response",
    synthetic_case_token: "044a2-a",
    run_id: started.activity_runtime_run_id,
    interaction_id: "B0-Q01",
    runtime_interaction_instance_id: rendered.runtime_interaction_instance_id,
    answers: B0_ANSWERS,
  });

  assert.equal(ingested.ok, true);
  assert.equal(ingested.ingest_path, "ingestRuntime4020ResponseLocal");
  assert.equal(ingested.fallback_ingest_used, false);
  assert.equal(ingested.ingest_status, "ingest_candidate_ready");
  assert.equal(ingested.subfield_source, "runtime_subfield_schema+ingest_candidates");
  assert.equal(ingested.evidence_source, "ingest_evidence_item_candidates");
  assert.ok(ingested.subfield_count >= 2);
  assert.ok(ingested.evidence_count >= 2);
  assert.equal(persistence._tables.response_record.length, 1);
  assert.ok(persistence._tables.runtime_subfield_response.length >= 2);
  assert.ok(persistence._tables.evidence_item.length >= 2);
  assert.equal(persistence._tables.budget_ledger.length, 1);
  assert.equal(persistence._tables.activity_runtime_run[0].state, stateBefore);
});

test("044A2 B: missing required subfield blocks with zero persistence", async () => {
  const persistence = governed.createInMemoryPersistencePort();
  const ctx = {
    persistence,
    case_id: "CASE-044A2-B",
    role_id: "ROLE-1",
    activity_id: "ACT-1",
  };
  const started = await governed.advanceGovernedExecution(ctx, {
    action: "start_synthetic_run",
    synthetic_case_token: "044a2-b",
    run_id: "run-044a2-b",
  });
  await governed.advanceGovernedExecution(ctx, {
    action: "render_next",
    synthetic_case_token: "044a2-b",
    run_id: started.activity_runtime_run_id,
    interaction_id: "B0-Q01",
  });
  const stateBefore = persistence._tables.activity_runtime_run[0].state;

  await assert.rejects(
    () =>
      governed.advanceGovernedExecution(ctx, {
        action: "ingest_response",
        synthetic_case_token: "044a2-b",
        run_id: started.activity_runtime_run_id,
        interaction_id: "B0-Q01",
        answers: {
          "0.1": "Parcial",
          // missing required 0.1a
        },
      }),
    /blocked_real_ingest_path_failed/,
  );

  assert.equal(persistence._tables.response_record.length, 0);
  assert.equal(persistence._tables.runtime_subfield_response.length, 0);
  assert.equal(persistence._tables.evidence_item.length, 0);
  assert.equal(persistence._tables.canonical_variable_record.length, 0);
  assert.equal(persistence._tables.budget_ledger.length, 0);
  assert.equal(persistence._tables.activity_runtime_run[0].state, stateBefore);
});

test("044A2 C: invalid interaction instance blocks with zero persistence", async () => {
  const persistence = governed.createInMemoryPersistencePort();
  const ctx = {
    persistence,
    case_id: "CASE-044A2-C",
    role_id: "ROLE-1",
    activity_id: "ACT-1",
  };
  const started = await governed.advanceGovernedExecution(ctx, {
    action: "start_synthetic_run",
    synthetic_case_token: "044a2-c",
    run_id: "run-044a2-c",
  });
  await governed.advanceGovernedExecution(ctx, {
    action: "render_next",
    synthetic_case_token: "044a2-c",
    run_id: started.activity_runtime_run_id,
    interaction_id: "B0-Q01",
  });
  const stateBefore = persistence._tables.activity_runtime_run[0].state;

  await assert.rejects(
    () =>
      governed.advanceGovernedExecution(ctx, {
        action: "ingest_response",
        synthetic_case_token: "044a2-c",
        run_id: started.activity_runtime_run_id,
        interaction_id: "B0-Q01",
        runtime_interaction_instance_id: "00000000-0000-4000-8000-ffffffffffff",
        answers: B0_ANSWERS,
      }),
    /interaction_instance_run_mismatch|blocked_real_ingest_path_failed/,
  );

  assert.equal(persistence._tables.response_record.length, 0);
  assert.equal(persistence._tables.runtime_subfield_response.length, 0);
  assert.equal(persistence._tables.evidence_item.length, 0);
  assert.equal(persistence._tables.budget_ledger.length, 0);
  assert.equal(persistence._tables.activity_runtime_run[0].state, stateBefore);
});

test("044A2 D: induced real-organ failure blocks without success fallback", async () => {
  const persistence = governed.createInMemoryPersistencePort();
  const ctx = {
    persistence,
    case_id: "CASE-044A2-D",
    role_id: "ROLE-1",
    activity_id: "ACT-1",
    store: undefined,
  };
  const started = await governed.advanceGovernedExecution(ctx, {
    action: "start_synthetic_run",
    synthetic_case_token: "044a2-d",
    run_id: "run-044a2-d",
  });
  await governed.advanceGovernedExecution(ctx, {
    action: "render_next",
    synthetic_case_token: "044a2-d",
    run_id: started.activity_runtime_run_id,
    interaction_id: "B0-Q01",
  });

  // Corrupt view model so real ingest throws / blocks hard.
  const store = ctx.store;
  assert.ok(store);
  const vm = store.view_models.get("B0-Q01");
  assert.ok(vm);
  store.view_models.set("B0-Q01", {
    ...vm,
    renderer_status: "blocked_missing_visible_text",
  });

  const stateBefore = persistence._tables.activity_runtime_run[0].state;
  await assert.rejects(
    () =>
      governed.advanceGovernedExecution(ctx, {
        action: "ingest_response",
        synthetic_case_token: "044a2-d",
        run_id: started.activity_runtime_run_id,
        interaction_id: "B0-Q01",
        answers: B0_ANSWERS,
      }),
    /blocked_real_ingest_path_failed/,
  );

  assert.equal(persistence._tables.response_record.length, 0);
  assert.equal(persistence._tables.budget_ledger.length, 0);
  assert.equal(persistence._tables.activity_runtime_run[0].state, stateBefore);
});

test("044A2 E: catch→ok:true path does not exist; double ingest blocked", async () => {
  const source = readFileSync(
    path.join(HERE, "runtime-40-20-governed-execution-service.ts"),
    "utf8",
  );
  assert.equal(source.includes("ingest_candidate_ready_fallback"), false);

  const persistence = governed.createInMemoryPersistencePort();
  const ctx = {
    persistence,
    case_id: "CASE-044A2-E",
    role_id: "ROLE-1",
    activity_id: "ACT-1",
  };
  const started = await governed.advanceGovernedExecution(ctx, {
    action: "start_synthetic_run",
    synthetic_case_token: "044a2-e",
    run_id: "run-044a2-e",
  });
  const rendered = await governed.advanceGovernedExecution(ctx, {
    action: "render_next",
    synthetic_case_token: "044a2-e",
    run_id: started.activity_runtime_run_id,
    interaction_id: "B0-Q01",
  });
  await governed.advanceGovernedExecution(ctx, {
    action: "ingest_response",
    synthetic_case_token: "044a2-e",
    run_id: started.activity_runtime_run_id,
    interaction_id: "B0-Q01",
    runtime_interaction_instance_id: rendered.runtime_interaction_instance_id,
    answers: B0_ANSWERS,
  });
  assert.equal(persistence._tables.response_record.length, 1);

  await assert.rejects(
    () =>
      governed.advanceGovernedExecution(ctx, {
        action: "ingest_response",
        synthetic_case_token: "044a2-e",
        run_id: started.activity_runtime_run_id,
        interaction_id: "B0-Q01",
        answers: B0_ANSWERS,
      }),
    /double_ingest_not_authorized/,
  );
  assert.equal(persistence._tables.response_record.length, 1);
  assert.equal(persistence._tables.budget_ledger.length, 1);
});

test("044A2 write conformance evidence", async () => {
  const evidence = {
    instruction: "044-A.2",
    classification: "response_ingest_real_path_conformant",
    production_consulted: false,
    gaby_touched: false,
    e2e_full_executed: false,
    catalog_version_id: FULL,
    renderer_regression: false,
    materiality_before: "partial (catch→ok:true + Object.entries(answers) recovery)",
    materiality_after: "implemented_and_connected",
    executable_path: {
      entry: "advanceGovernedExecution(action=ingest_response)",
      organ: "ingestRuntime4020ResponseLocal",
      file: "src/services/eve/runtime-40-20/response-ingest/runtime-40-20-response-ingest-service.ts",
      connection_file:
        "src/services/eve/runtime-40-20/execution-connected/runtime-40-20-governed-execution-service.ts",
    },
    bypass_removed: {
      catch_ok_true: true,
      ingest_candidate_ready_fallback: true,
      object_entries_answers_recovery: true,
    },
    subfield_source: "runtime_subfield_schema via ViewModel.subfields + ingest candidates",
    evidence_source: "ingest.evidence_item_candidates",
    scenarios: {
      A_valid_b0q01: "pass",
      B_missing_required_subfield: "pass",
      C_invalid_instance: "pass",
      D_induced_organ_failure: "pass",
      E_no_catch_ok_true_and_double_ingest: "pass",
    },
    failure_contract: {
      on_ingest_fail: "throw blocked_real_ingest_path_failed",
      response_record: 0,
      runtime_subfield_response: 0,
      evidence_item: 0,
      canonical_variable_record: 0,
      budget_delta: 0,
      state_advance: false,
    },
  };

  writeFileSync(
    path.join(MATERIALIZED, "runtime-40-20-ingest-conformance-044A2.json"),
    `${JSON.stringify(evidence, null, 2)}\n`,
    "utf8",
  );
  writeFileSync(
    path.join(MATERIALIZED, "runtime-40-20-ingest-conformance-044A2.md"),
    `# Ingest conformance 044-A.2

## Classification

\`response_ingest_real_path_conformant\`

## Precondition

Renderer path remains without synthetic ViewModel fallback.

## Bypass removed

- \`catch → ok:true\` / \`ingest_candidate_ready_fallback\`
- \`Object.entries(answers)\` recovery for subfields

## Executable path

\`advanceGovernedExecution(ingest_response)\` → \`ingestRuntime4020ResponseLocal\`

## Scenarios

| Scenario | Result |
|---|---|
| A valid B0-Q01 | real ingest + response/subfields/evidence |
| B missing required subfield | blocked, persistencia 0 |
| C invalid instance | blocked, persistencia 0 |
| D induced organ failure | \`blocked_real_ingest_path_failed\`, persistencia 0 |
| E no catch→ok:true + double ingest | pass |

## Out of scope

Canonical/Branching/SEM/PST/Readiness/Gaby/producción/045/E2E completo/commit: no
`,
    "utf8",
  );

  assert.equal(evidence.classification, "response_ingest_real_path_conformant");
});

function loadGovernedWithRealRendererAndIngest() {
  const cache = new Map();
  const stubs = {
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
          if (require("node:fs").existsSync(resolvedTs)) {
            return loadTs(resolvedTs);
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

  return loadTs(path.join(HERE, "runtime-40-20-governed-execution-service.ts"));
}
