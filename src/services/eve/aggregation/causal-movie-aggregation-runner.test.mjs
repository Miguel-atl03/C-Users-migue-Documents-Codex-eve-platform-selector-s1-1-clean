import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const runner = loadRunner();

test("rejects scenes not validated", () => {
  const result = runner.runCausalMovieAggregation({
    case_id: "case:1",
    escenas_evidenciales: [buildScene("scene:1", { state: "manual_review_required" })],
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.scene_set.escena_evidencial_refs, []);
  assert.deepEqual(result.scene_set.excluded_scene_refs, ["scene:1"]);
});

test("blocks if SceneSet below minimum", () => {
  const result = runner.runCausalMovieAggregation({
    case_id: "case:1",
    escenas_evidenciales: [buildScene("scene:1")],
  });

  assert.equal(result.ok, false);
  assert.equal(result.scene_set.state, "blocked_by_insufficient_scenes");
  assert.equal(result.aggregation_index, undefined);
  assert.equal(result.pelicula_causal_agregada, undefined);
});

test("creates SceneSet with traceability", () => {
  const result = validAggregation();

  assert.equal(result.scene_set.state, "aggregation_eligible");
  assert.deepEqual(result.scene_set.escena_evidencial_refs, ["scene:1", "scene:2"]);
  assert.equal(result.scene_set.inclusion_rule, "state == validated");
});

test("creates AggregationIndex from scenes, not summaries", () => {
  const result = validAggregation();

  assert.equal(result.aggregation_index.state, "built");
  assert.equal(result.aggregation_index.object_index["mmabp:scene:1"].length, 1);
  assert.equal(result.aggregation_index.object_index["mmabp:scene:1"][0], "scene:1");
  assert.equal(
    result.aggregation_index.audit_log[0].source,
    "validated_escena_evidencial_structured_fields",
  );
});

test("creates PeliculaCausalAgregada aggregated only from validated scenes", () => {
  const result = runner.runCausalMovieAggregation({
    case_id: "case:1",
    escenas_evidenciales: [
      buildScene("scene:1"),
      buildScene("scene:2"),
      buildScene("scene:blocked", { state: "blocked_by_insufficient_causality" }),
    ],
  });

  assert.equal(result.ok, true);
  assert.equal(result.pelicula_causal_agregada.state, "aggregated");
  assert.deepEqual(result.scene_set.excluded_scene_refs, ["scene:blocked"]);
});

test("keeps monetizable signal as candidate, not diagnosis/final output", () => {
  const result = validAggregation();

  assert.match(
    result.pelicula_causal_agregada.monetizable_signal_refs[0],
    /^MONETIZABLE_SIGNAL_CANDIDATE:/,
  );
  assert.equal(result.no_go.monetizable_signal_promoted_to_final, false);
  assert.equal(result.no_go.diagnosis_created, false);
});

test("keeps AHE blockage boundary-limited", () => {
  const result = validAggregation();

  assert.match(
    result.pelicula_causal_agregada.ahe_blockage_refs[0],
    /^AHE_BLOCKAGE_BOUNDARY:/,
  );
});

test("routes insufficient scenes to GovernanceIssue", () => {
  const result = runner.runCausalMovieAggregation({
    case_id: "case:1",
    escenas_evidenciales: [buildScene("scene:1")],
  });

  assert.ok(
    result.governance_issue_refs.includes("PF_SUP_04_INSUFFICIENT_SCENES"),
  );
});

test("creates rework route to PF-SUP-03 through issue reason", () => {
  const result = runner.runCausalMovieAggregation({
    case_id: "case:1",
    escenas_evidenciales: [buildScene("scene:1")],
  });

  assert.equal(result.blocked_reason, "insufficient_scenes_rework_to_pf_sup_03");
  assert.ok(
    result.governance_issue_refs.includes("PF_SUP_04_REWORK_TO_PF_SUP_03_REQUIRED"),
  );
});

test("preserves B7 as non-diagnostic only", () => {
  const result = validAggregation([
    buildScene("scene:1", { b7Signals: 1 }),
    buildScene("scene:2"),
  ]);

  assert.equal(
    result.pelicula_causal_agregada.b7_boundary.preserved_as_non_diagnostic,
    true,
  );
  assert.equal(result.no_go.b7_promoted_to_diagnosis, false);
});

test("does not create diagnosis", () => {
  assert.equal(validAggregation().no_go.diagnosis_created, false);
});

test("does not create client narrative", () => {
  assert.equal(validAggregation().no_go.client_narrative_created, false);
});

test("does not create registry", () => {
  assert.equal(validAggregation().no_go.registry_created, false);
});

test("does not create IR", () => {
  assert.equal(validAggregation().no_go.ir_created, false);
});

test("does not create export", () => {
  assert.equal(validAggregation().no_go.export_created, false);
});

test("returns materiality level L6 service_present", () => {
  const result = validAggregation();

  assert.equal(result.materiality.level, "L6 service_present");
  assert.equal(
    result.materiality.marker_candidate,
    "PF_SUP_04_MATERIALITY_MARKER",
  );
});

function validAggregation(scenes = [buildScene("scene:1"), buildScene("scene:2")]) {
  return runner.runCausalMovieAggregation({
    case_id: "case:1",
    escenas_evidenciales: scenes,
  });
}

function buildScene(id, overrides = {}) {
  const b7Signals = overrides.b7Signals ?? 0;
  return {
    escena_evidencial_id: id,
    case_id: "case:1",
    evidence_bundle_id: `bundle:${id}`,
    source_scene_refs: [`source:${id}`],
    observable_act_refs: [`acto:${id}`],
    mmabp_element_refs: [`mmabp:${id}`],
    vsm_hypothesis_primary_refs: [`vsm:${id}`],
    mmabp_inconsistency_refs: [`inconsistency:${id}`],
    eve_local_node_refs: [`node:${id}`],
    ahe_translation_refs: [`ahe:${id}`],
    governance_issue_refs: [],
    readiness_decision_ref: `readiness:${id}`,
    state: overrides.state ?? "validated",
    version: "test",
    audit_log: [{ event: "test_scene" }],
    b7_boundary: {
      preserved_as_non_diagnostic: true,
      signals_count: b7Signals,
      forbidden_outputs_created: false,
    },
  };
}

function loadRunner() {
  const source = readFileSync(
    new URL("./causal-movie-aggregation-runner.ts", import.meta.url),
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
        specifier === "./causal-movie-types" ||
        specifier === "../transduction/evidential-scene-types"
      ) {
        return {};
      }
      throw new Error(`Unexpected require: ${specifier}`);
    },
  };

  vm.runInNewContext(transpiled, context, {
    filename: "causal-movie-aggregation-runner.ts",
  });

  return context.exports;
}
