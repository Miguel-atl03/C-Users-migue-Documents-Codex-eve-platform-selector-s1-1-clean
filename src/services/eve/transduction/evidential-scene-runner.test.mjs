import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const runner = loadRunner();

test("rejects EvidenceBundle not ready/frozen", () => {
  const result = runner.runEvidentialSceneTransduction({
    evidence_bundle: buildBundle({ state: "draft" }),
  });

  assert.equal(result.ok, false);
  assert.equal(
    result.blocked_reason,
    "evidence_bundle_state_draft_not_accepted",
  );
  assert.equal(
    result.escena_evidencial.state,
    "blocked_by_insufficient_causality",
  );
  assert.ok(
    result.governance_issue_refs.includes(
      "PF_SUP_03_BUNDLE_NOT_READY_FOR_TRANSDUCTION",
    ),
  );
});

test("creates ActoObservable with source_ref and derivation_ref", () => {
  const result = runner.runEvidentialSceneTransduction({
    evidence_bundle: buildBundle(),
  });

  assert.equal(result.actos_observables.length, 1);
  assert.equal(result.actos_observables[0].state, "accepted");
  assert.equal(result.actos_observables[0].material_trace, "src:1:drv:1");
});

test("blocks if observable act lacks evidence", () => {
  const result = runner.runEvidentialSceneTransduction({
    evidence_bundle: buildBundle({
      evidence_items: [
        {
          evidence_item_id: "evidence:1",
          source_ref: "",
          derivation_ref: "drv:1",
          literal_value: "elabora orden",
        },
      ],
    }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.actos_observables[0].state, "rejected");
  assert.ok(
    result.governance_issue_refs.includes("PF_SUP_03_MISSING_SOURCE_REF"),
  );
});

test("creates EscenaEvidencial validated only with traceability", () => {
  const result = runner.runEvidentialSceneTransduction({
    evidence_bundle: buildBundle(),
  });

  assert.equal(result.ok, true);
  assert.equal(result.escena_evidencial.state, "validated");
  assert.equal(
    result.escena_evidencial.readiness_decision_ref,
    "readiness:1",
  );
  assert.deepEqual(result.escena_evidencial.observable_act_refs, [
    "ACTO_OBSERVABLE:bundle:1:1",
  ]);
});

test("routes insufficient causality to GovernanceIssue", () => {
  const result = runner.runEvidentialSceneTransduction({
    evidence_bundle: buildBundle(),
    options: { minimum_observable_acts: 2 },
  });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "insufficient_causality");
  assert.ok(
    result.governance_issue_refs.includes("PF_SUP_03_INSUFFICIENT_CAUSALITY"),
  );
});

test("preserves B7 as non-diagnostic only", () => {
  const result = runner.runEvidentialSceneTransduction({
    evidence_bundle: buildBundle({
      b7_preclassification_evidence: [
        {
          source_ref: "b7:src",
          derivation_ref: "b7:drv",
          signal: "tension interpersonal",
          interpretation_limit: "non_diagnostic_preclassification_only",
        },
      ],
    }),
  });

  assert.equal(result.ok, true);
  assert.equal(
    result.escena_evidencial.b7_boundary.preserved_as_non_diagnostic,
    true,
  );
  assert.equal(result.escena_evidencial.b7_boundary.signals_count, 1);
  assert.equal(result.no_go.b7_promoted_to_diagnosis, false);
});

test("does not create diagnosis", () => {
  const result = runner.runEvidentialSceneTransduction({
    evidence_bundle: buildBundle(),
  });

  assert.equal(result.no_go.diagnosis_created, false);
});

test("does not create registry", () => {
  const result = runner.runEvidentialSceneTransduction({
    evidence_bundle: buildBundle(),
  });

  assert.equal(result.no_go.registry_created, false);
});

test("does not create IR", () => {
  const result = runner.runEvidentialSceneTransduction({
    evidence_bundle: buildBundle(),
  });

  assert.equal(result.no_go.ir_created, false);
});

test("does not create export", () => {
  const result = runner.runEvidentialSceneTransduction({
    evidence_bundle: buildBundle(),
  });

  assert.equal(result.no_go.export_created, false);
});

test("returns materiality level L6 service_present", () => {
  const result = runner.runEvidentialSceneTransduction({
    evidence_bundle: buildBundle(),
  });

  assert.equal(result.materiality.level, "L6 service_present");
  assert.equal(
    result.materiality.marker_candidate,
    "PF_SUP_03_MATERIALITY_MARKER",
  );
  assert.equal(result.materiality.implementation_scope, "local_pure_service_only");
});

function buildBundle(overrides = {}) {
  return {
    bundle_id: "bundle:1",
    case_id: "case:1",
    state: "ready_for_transduction",
    source_ref: "bundle:source",
    derivation_ref: "bundle:derivation",
    readiness_decision_ref: "readiness:1",
    evidence_items: [
      {
        evidence_item_id: "evidence:1",
        source_ref: "src:1",
        derivation_ref: "drv:1",
        literal_value: "elabora orden",
        normalized_value: "elabora orden",
        actor_role_ref: "actor:operador",
        object_ref: "obj:orden",
        event_ref: "scene:1",
        epistemic_status: "observed",
      },
    ],
    ...overrides,
  };
}

function loadRunner() {
  const source = readFileSync(
    new URL("./evidential-scene-runner.ts", import.meta.url),
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
      if (specifier === "./evidential-scene-types") {
        return {};
      }
      throw new Error(`Unexpected require: ${specifier}`);
    },
  };

  vm.runInNewContext(transpiled, context, {
    filename: "evidential-scene-runner.ts",
  });

  return context.exports;
}

