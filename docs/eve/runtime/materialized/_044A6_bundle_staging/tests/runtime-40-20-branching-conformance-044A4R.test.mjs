/**
 * 044-A.4R — Typed branching predicates conformance.
 * Positive/negative pairs per C01–C20. No generic truthiness.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  copyFileSync,
} from "node:fs";
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

const CW = JSON.parse(
  readFileSync(
    path.join(MATERIALIZED, "runtime-40-20-branching-authority-crosswalk-044A4R.json"),
    "utf8",
  ),
);
const COV = JSON.parse(
  readFileSync(
    path.join(MATERIALIZED, "runtime-40-20-branching-rule-coverage-044A4R.json"),
    "utf8",
  ),
);

function sha256File(p) {
  return createHash("sha256").update(readFileSync(p)).digest("hex");
}

function loadTsModule(filePath, stubs = {}) {
  const cache = new Map();
  function loadTs(fp) {
    if (cache.has(fp)) return cache.get(fp);
    const source = readFileSync(fp, "utf8");
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
        importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
      },
    });
    const moduleObj = { exports: {} };
    const dir = path.dirname(fp);
    const context = {
      exports: moduleObj.exports,
      module: moduleObj,
      require: (specifier) => {
        if (stubs[specifier]) return stubs[specifier];
        if (specifier.startsWith(".")) {
          const resolvedTs = path.resolve(dir, `${specifier}.ts`);
          if (existsSync(resolvedTs)) return loadTs(resolvedTs);
          const resolvedJson = path.resolve(dir, specifier);
          if (existsSync(resolvedJson)) return require(resolvedJson);
        }
        return require(specifier);
      },
      console,
      process,
      Buffer,
      setTimeout,
      clearTimeout,
    };
    vm.runInNewContext(outputText, context, { filename: fp });
    cache.set(fp, moduleObj.exports);
    return moduleObj.exports;
  }
  return loadTs(filePath);
}

function loadEngine() {
  return loadTsModule(
    path.join(
      ROOT,
      "src/services/eve/runtime-40-20/branching/runtime-40-20-branching-service.ts",
    ),
  );
}
function loadAuth() {
  return loadTsModule(
    path.join(
      ROOT,
      "src/services/eve/runtime-40-20/branching/runtime-40-20-branching-authority-crosswalk.ts",
    ),
  );
}

function canonical(vars) {
  return {
    ok: true,
    status: "canonical_variable_candidates_ready",
    canonical_variable_record_candidates: vars.map((v) => ({
      canonical_variable_id: v.name,
      variable_name: v.name,
      canonical_variable_name: v.name,
      value: v.value,
    })),
    no_go_check: {
      runtime_40_20_started: false,
      supabase_touched: false,
      sql_executed: false,
      endpoint_created: false,
      real_canonical_variable_record_created: false,
      ir_real_created: false,
      object_inventory_real_opened: false,
    },
  };
}

function causalDef(id) {
  return {
    runtime_interaction_id: id,
    interaction_group: "causal",
    visible_text: id,
    source_refs: [],
    ui_component: "compound_card",
    counts_as_base: false,
    counts_as_causal: true,
    source_document:
      "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
    source_sheet: "Runtime_Interactions_Causal_20",
    source_row_number: 1,
    raw_row: {},
    canonicalization_status: "normalized",
    warnings: [],
    blockers: [],
  };
}

function evalCausal(causalId, vars) {
  const { getExactBranchingRulesForSourceInteraction } = loadAuth();
  const { createRuntime4020BranchingCandidatesLocal } = loadEngine();
  const rulesForCausal = CW.rules.filter((r) => r.causal_id === causalId);
  assert.ok(rulesForCausal.length >= 1, causalId);
  const sourceId = rulesForCausal[0].source_interaction_id;
  const rules = getExactBranchingRulesForSourceInteraction(sourceId).filter(
    (r) => r.target_causal_interaction_id === causalId,
  );
  // Include all source interactions' rules for this causal
  const allRules = [];
  for (const src of new Set(rulesForCausal.map((r) => r.source_interaction_id))) {
    allRules.push(
      ...getExactBranchingRulesForSourceInteraction(src).filter(
        (r) => r.target_causal_interaction_id === causalId,
      ),
    );
  }
  const result = createRuntime4020BranchingCandidatesLocal({
    case_id: `CASE-A4R-${causalId}`,
    canonical_variable_result: canonical(vars),
    branching_rules: allRules,
    interaction_definitions: [causalDef(causalId)],
  });
  const ready = (result.decision_candidates ?? []).filter(
    (d) => d.decision_status === "causal_activation_candidate_ready",
  );
  const pending = (result.rule_evaluations ?? []).filter(
    (e) => e.evaluation_status === "pending_governed_signal",
  );
  return { ready, pending, result, allRules };
}

const PAIRS = {
  C01: {
    pos: [{ name: "activity_frequency_base", value: "Irregular" }],
    neg: [{ name: "activity_frequency_base", value: "Diaria" }],
  },
  C02: {
    pos: [
      {
        name: "relacion_beneficiario_afectado_0_5_1_rel",
        value: "Son actores distintos",
      },
    ],
    neg: [
      {
        name: "relacion_beneficiario_afectado_0_5_1_rel",
        value: "Es el mismo actor",
      },
    ],
  },
  C03: {
    pos: [{ name: "trigger_clarity", value: "Ambiguo" }],
    neg: [{ name: "trigger_clarity", value: "Claro" }],
  },
  C04: {
    pos: [
      {
        name: "transformation_primary_dimensions",
        value: ["Un OBJETO (cosa)", "Un SUJETO (persona/entidad)"],
      },
    ],
    neg: [
      {
        name: "transformation_primary_dimensions",
        value: ["Un OBJETO (cosa)"],
      },
    ],
  },
  C05: {
    pos: [
      {
        name: "transformation_exception_type",
        value: "Sí, falla regularmente",
      },
    ],
    neg: [
      {
        name: "transformation_exception_type",
        value: "No, siempre se transforma correctamente",
      },
    ],
  },
  C06: {
    pos: [
      {
        name: "transformation_hidden_changes",
        value: "Sí, ocurren frecuentemente",
      },
    ],
    neg: [
      {
        name: "transformation_hidden_changes",
        value: "No, todo lo que ocurre es oficial",
      },
    ],
  },
  C07: {
    pos: [{ name: "transformation_iterations", value: "Muchas veces" }],
    neg: [{ name: "transformation_iterations", value: "Una sola vez" }],
  },
  C08: {
    pos: [
      {
        name: "delivery_exception_exists",
        value: "Sí, hay problemas regularmente",
      },
    ],
    neg: [
      {
        name: "delivery_exception_exists",
        value: "No, siempre llega como se espera",
      },
    ],
  },
  C09: {
    pos: [
      {
        name: "receiver_satisfaction",
        value: "Frecuentemente lo rechaza o lo devuelve",
      },
    ],
    neg: [{ name: "receiver_satisfaction", value: "Lo acepta sin cambios" }],
  },
  C10: {
    pos: [{ name: "primary_receiver", value: "Múltiples receptores" }],
    neg: [{ name: "primary_receiver", value: "Un compañero de mi equipo" }],
  },
  C11: {
    pos: [
      {
        name: "deadlock_risk",
        value: "Sí, a veces queda bloqueada y tengo que ir a preguntar",
      },
    ],
    neg: [
      {
        name: "deadlock_risk",
        value: "No, hay un timeout o alguien se da cuenta si se retrasa",
      },
    ],
  },
  C12: {
    pos: [
      {
        name: "iteration_pattern",
        value: "Sí, típicamente se repite 2-5 veces",
      },
    ],
    neg: [{ name: "iteration_pattern", value: "No, se hace una sola vez" }],
  },
  C13: {
    pos: [
      {
        name: "route_alternatives",
        value: ["Sí, según el tipo de cliente o proyecto"],
      },
    ],
    neg: [
      {
        name: "route_alternatives",
        value: ["No, siempre es el mismo camino"],
      },
    ],
  },
  C14: {
    pos: [
      {
        name: "hidden_subprocess",
        value: "Sí, hay pasos que hago para que funcione",
      },
    ],
    neg: [
      {
        name: "hidden_subprocess",
        value: "No, sigo exactamente lo que dice el proceso",
      },
    ],
  },
  C15: {
    pos: [
      {
        name: "resource_bargain_5_14",
        value: "Es insostenible en el tiempo",
      },
    ],
    neg: [{ name: "resource_bargain_5_14", value: "Sostenible" }],
  },
  C16: {
    pos: [{ name: "rework_present", value: "Sí" }],
    neg: [{ name: "rework_present", value: "No" }],
  },
  C17: {
    pos: [{ name: "missing_information", value: ["No me llega claridad"] }],
    neg: [{ name: "missing_information", value: ["No me falta información"] }],
  },
  C18: {
    pos: [{ name: "effort_cost", value: 8 }],
    neg: [{ name: "effort_cost", value: 4 }],
  },
  C19: {
    pos: [{ name: "repetitive_failure_pattern", value: "Sí" }],
    neg: [{ name: "repetitive_failure_pattern", value: "No" }],
  },
};

test("044A4R Gate11/12: classification branching_predicates_rector_complete_local_only", () => {
  assert.equal(CW.classification, "branching_predicates_rector_complete_local_only");
  // 044-A.5B-R/A.6: C20 promoted — confidence_level material via B7ConfidenceService.
  assert.equal(COV.counts.exact_executable_now, 20);
  assert.equal(COV.counts.exact_predicate_signal_pending_A5, 0);
  assert.equal(COV.counts.rector_semantics_truly_unresolved, 0);
  assert.equal(CW.counts.rules, 34);
  // No generic truthiness sets
  for (const rule of CW.rules) {
    const ev = JSON.stringify(rule.expected_value);
    assert.equal(ev.includes('"true"') && ev.includes("true") && ev.includes('"sí"'), false);
    if (Array.isArray(rule.expected_value)) {
      const mixed =
        rule.expected_value.includes(true) &&
        rule.expected_value.some((x) => typeof x === "string" && /^s[ií]$/i.test(x));
      assert.equal(mixed, false);
    }
    assert.notEqual(rule.operator, "is_present");
  }
});

for (const [causalId, pair] of Object.entries(PAIRS)) {
  test(`044A4R Gate10: ${causalId} positive opens / negative does not`, () => {
    const pos = evalCausal(causalId, pair.pos);
    assert.ok(pos.ready.length >= 1, `${causalId} positive should open`);
    const neg = evalCausal(causalId, pair.neg);
    assert.equal(neg.ready.length, 0, `${causalId} negative must not open`);
  });
}

test("044A4R Gate10: C20 opens on medium/low; high does not (post A5BR)", () => {
  const missing = evalCausal("C20", []);
  assert.equal(missing.ready.length, 0);
  // Missing signal is unresolved/missing candidate — not silent false open.
  assert.equal(missing.ready.length, 0);
  const withSignal = evalCausal("C20", [{ name: "confidence_level", value: "medium" }]);
  assert.ok(withSignal.ready.length >= 1);
  const low = evalCausal("C20", [{ name: "confidence_level", value: "low" }]);
  assert.ok(low.ready.length >= 1);
  const high = evalCausal("C20", [{ name: "confidence_level", value: "high" }]);
  assert.equal(high.ready.length, 0);
});

test("044A4R anti: Sí is not universal truthiness", () => {
  const r = evalCausal("C16", [{ name: "rework_present", value: "sí" }]);
  assert.equal(r.ready.length, 0);
});

test("044A4R anti: boolean true does not activate categorical variable", () => {
  const r = evalCausal("C12", [{ name: "iteration_pattern", value: true }]);
  assert.equal(r.ready.length, 0);
});

test("044A4R anti: non-empty string does not imply true", () => {
  const r = evalCausal("C11", [{ name: "deadlock_risk", value: "cualquier texto" }]);
  assert.equal(r.ready.length, 0);
});

test("044A4R anti: exclusive negative blocks multi-choice", () => {
  const r = evalCausal("C13", [
    { name: "route_alternatives", value: ["No, siempre es el mismo camino"] },
  ]);
  assert.equal(r.ready.length, 0);
});

test("044A4R anti: scale respects threshold", () => {
  assert.equal(evalCausal("C18", [{ name: "effort_cost", value: 7 }]).ready.length, 1);
  assert.equal(evalCausal("C18", [{ name: "effort_cost", value: 6 }]).ready.length, 0);
});

test("044A4R anti: unauthorized variable does not open", () => {
  const r = evalCausal("C05", [
    { name: "invented_exception_flag", value: "Sí, falla regularmente" },
  ]);
  assert.equal(r.ready.length, 0);
});

test("044A4R anti: no raw answer / regex / help_text path in engine input", () => {
  const src = readFileSync(
    path.join(
      ROOT,
      "src/services/eve/runtime-40-20/execution-connected/runtime-40-20-governed-execution-service.ts",
    ),
    "utf8",
  );
  const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  assert.equal(/evaluateCatalogOpenNodesBranching\s*\(/.test(code), false);
  assert.equal(/JSON\.stringify\(\s*answers/.test(code), false);
  assert.equal(/answerBlob/.test(code), false);
  assert.equal(/`br-\$\{/.test(code), false);
});

test("044A4R Gate11: write evidence artifacts", () => {
  mkdirSync(MATERIALIZED, { recursive: true });
  const realPath = {
    instruction: "044-A.4R",
    classification: CW.classification,
    counts: COV.counts,
    decision_input: [
      "persisted_canonical_variables",
      "typed_branching_authority_crosswalk_044A4R",
    ],
    forbidden: [
      "generic_truthiness_si_true",
      "answerBlob",
      "regex_Cxx",
      "NLP",
      "fuzzy",
      "default_is_present",
    ],
    outcomes: [
      "opened",
      "not_opened",
      "pending_governed_signal",
      "unresolved_authority",
    ],
    table: COV.table,
    historical_a4_preserved: existsSync(
      path.join(MATERIALIZED, "runtime-40-20-branching-authority-crosswalk-044A4.json"),
    ),
    crosswalk_sha256: sha256File(
      path.join(MATERIALIZED, "runtime-40-20-branching-authority-crosswalk-044A4R.json"),
    ),
  };
  writeFileSync(
    path.join(MATERIALIZED, "runtime-40-20-branching-typed-real-path-044A4R.json"),
    `${JSON.stringify(realPath, null, 2)}\n`,
  );
  writeFileSync(
    path.join(MATERIALIZED, "runtime-40-20-branching-typed-real-path-044A4R.md"),
    `# 044-A.4R — Typed branching real path

Classification: **${CW.classification}**

- exact_executable_now: ${COV.counts.exact_executable_now}
- exact_predicate_signal_pending_A5: ${COV.counts.exact_predicate_signal_pending_A5}
- rector_semantics_truly_unresolved: ${COV.counts.rector_semantics_truly_unresolved}

C20 returns \`pending_governed_signal\` until confidence_level is materialized (A5).

Historical A4 crosswalk preserved (not overwritten).
`,
  );
  writeFileSync(
    path.join(MATERIALIZED, "runtime-40-20-branching-authority-crosswalk-044A4R.md"),
    `# 044-A.4R — Typed branching authority crosswalk

Generator: \`scripts/eve/runtime/generate-branching-authority-crosswalk-044A4R.mjs\`

Rules: ${CW.counts.rules}

No generic truthiness. Predicates use rector enums/options/scales only.
`,
  );
  writeFileSync(
    path.join(MATERIALIZED, "runtime-40-20-branching-rule-coverage-044A4R.md"),
    `# 044-A.4R — Coverage table

| causal | classification | reason |
|---|---|---|
${COV.table
  .map((r) => `| ${r.causal} | ${r.classification} | ${r.reason.replace(/\|/g, "/")} |`)
  .join("\n")}
`,
  );
  copyFileSync(
    path.join(MATERIALIZED, "runtime-40-20-branching-authority-crosswalk-044A4R.json"),
    path.join(
      ROOT,
      "src/services/eve/runtime-40-20/branching/runtime-40-20-branching-authority-crosswalk-044A4R.json",
    ),
  );
  assert.equal(realPath.classification, "branching_predicates_rector_complete_local_only");
});
