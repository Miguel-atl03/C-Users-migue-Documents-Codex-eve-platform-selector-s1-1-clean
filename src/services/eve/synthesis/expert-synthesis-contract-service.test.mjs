import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const runner = loadRunner();

test("creates SynthesisCase from aggregated movie only", () => {
  const result = validSynthesis();

  assert.equal(result.ok, true);
  assert.equal(result.synthesis_case.state, "ready_for_expert_draft");
  assert.equal(result.synthesis_case.expert_review_required, true);
});

test("rejects non-aggregated movie", () => {
  const result = runner.runExpertSynthesisContract({
    case_id: "case:1",
    pelicula_causal_agregada: buildMovie({ state: "blocked_by_insufficient_scenes" }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.synthesis_case.state, "blocked_by_weak_traceability");
  assert.ok(
    result.governance_issue_refs.includes("PF_SUP_05_NON_AGGREGATED_MOVIE"),
  );
});

test("blocks if traceability is weak", () => {
  const result = runner.runExpertSynthesisContract({
    case_id: "case:1",
    pelicula_causal_agregada: buildMovie({ scene_set_ref: "" }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "weak_traceability");
  assert.ok(result.synthesis_case.weak_traceability_flags.includes("missing_scene_set_ref"));
  assert.ok(result.governance_issue_refs.includes("PF_SUP_05_WEAK_TRACEABILITY"));
});

test("creates DeliveryBoundary as delivery_blocked", () => {
  const result = validSynthesis();

  assert.equal(result.delivery_boundary.state, "delivery_blocked");
  assert.equal(
    result.delivery_boundary.delivery_block_reason,
    "delivery_not_authorized_in_this_tramo",
  );
});

test("keeps delivery_authorized unreachable", () => {
  const result = validSynthesis();

  assert.equal(result.delivery_boundary.delivery_authorized, false);
  assert.notEqual(result.delivery_boundary.state, "delivery_authorized");
});

test("does not create DiagnosticoExpertoFinal Delivered", () => {
  assert.equal(
    validSynthesis().no_go.diagnostico_experto_final_delivered_created,
    false,
  );
});

test("does not generate client narrative", () => {
  assert.equal(validSynthesis().no_go.client_narrative_created, false);
});

test("does not generate consultive recommendation", () => {
  assert.equal(validSynthesis().no_go.consultive_recommendation_created, false);
});

test("does not generate TeoremaInevitabilidad", () => {
  assert.equal(validSynthesis().no_go.teorema_inevitabilidad_created, false);
});

test("does not emit ExportCodePackage", () => {
  assert.equal(validSynthesis().no_go.export_code_package_created, false);
});

test("does not create registry", () => {
  assert.equal(validSynthesis().no_go.registry_created, false);
});

test("does not create IR", () => {
  assert.equal(validSynthesis().no_go.ir_created, false);
});

test("does not open Runtime 40/20 full", () => {
  assert.equal(validSynthesis().no_go.runtime_40_20_full_opened, false);
});

test("marks final diagnosis as authorization_blocked / delivery_blocked", () => {
  const result = validSynthesis();

  assert.equal(result.delivery_boundary.state, "delivery_blocked");
  assert.ok(
    result.delivery_boundary.forbidden_outputs.includes(
      "diagnostico_experto_final_delivered",
    ),
  );
});

test("records GovernanceIssue if delivery would be attempted", () => {
  const result = validSynthesis();

  assert.ok(
    result.delivery_boundary.governance_issue_refs.includes(
      "PF_SUP_05_DELIVERY_BLOCKED_IN_THIS_TRAMO",
    ),
  );
});

test("returns materiality level L6 service_present", () => {
  const result = validSynthesis();

  assert.equal(result.materiality.level, "L6 service_present");
  assert.equal(
    result.materiality.marker_candidate,
    "PF_SUP_05_MATERIALITY_MARKER",
  );
});

function validSynthesis(movie = buildMovie()) {
  return runner.runExpertSynthesisContract({
    case_id: "case:1",
    pelicula_causal_agregada: movie,
  });
}

function buildMovie(overrides = {}) {
  return {
    pelicula_id: "movie:1",
    case_id: "case:1",
    scene_set_ref: "scene-set:1",
    aggregation_index_ref: "aggregation-index:1",
    pattern_refs: ["pattern:1"],
    monetizable_signal_refs: ["monetizable:candidate:1"],
    loss_estimate_refs: ["loss:candidate:1"],
    ahe_blockage_refs: ["ahe:boundary:1"],
    governance_issue_refs: [],
    readiness_decision_ref: "readiness:pf04",
    state: "aggregated",
    version: "test",
    audit_log: [{ event: "test_movie" }],
    b7_boundary: {
      preserved_as_non_diagnostic: true,
      no_diagnostic_outputs_created: false,
    },
    ...overrides,
  };
}

function loadRunner() {
  const source = readFileSync(
    new URL("./expert-synthesis-contract-service.ts", import.meta.url),
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
        specifier === "./expert-synthesis-types" ||
        specifier === "../aggregation/causal-movie-types"
      ) {
        return {};
      }
      throw new Error(`Unexpected require: ${specifier}`);
    },
  };

  vm.runInNewContext(transpiled, context, {
    filename: "expert-synthesis-contract-service.ts",
  });

  return context.exports;
}

