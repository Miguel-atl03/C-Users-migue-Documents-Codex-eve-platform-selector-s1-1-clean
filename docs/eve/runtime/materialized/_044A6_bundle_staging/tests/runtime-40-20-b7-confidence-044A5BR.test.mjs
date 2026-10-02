/**
 * 044-A.5B-R — B7 Confidence without diagnostic contamination.
 * Epistemic confidence only. EVE pathology table must not score.
 */
import assert from "node:assert/strict";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
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
const B7_DIR = path.join(
  ROOT,
  "src/services/eve/runtime-40-20/b7-confidence",
);
const MATERIALIZED = path.join(ROOT, "docs/eve/runtime/materialized");
const RECTOR = path.join(
  B7_DIR,
  "EVE_Runtime_B7_Confidence_Governance_Rule_v1_0.json",
);

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
        if (specifier.startsWith("node:")) return require(specifier);
        return require(specifier);
      },
      console,
      process,
      Buffer,
    };
    vm.runInNewContext(outputText, context, { filename: fp });
    cache.set(fp, moduleObj.exports);
    return moduleObj.exports;
  }
  return loadTs(filePath);
}

const svc = loadTsModule(
  path.join(B7_DIR, "runtime-40-20-b7-confidence-service.ts"),
);

const baseEpistemicOk = {
  evidence_completeness_status: "complete",
  provenance_status: "closed",
  canonical_route_status: "closed",
  epistemic_ambiguity_status: "none",
  epistemic_contradiction_status: "none",
  microconfirmation_state: "not_required",
  required_signal_status: "present",
};

test("044A5BR-1: PM/PF inconsistency well evidenced → HIGH allowed", () => {
  const r = svc.evaluateB7Confidence({
    ...baseEpistemicOk,
    business_structural_inconsistency_observed: true,
    business_structural_inconsistency_refs: ["PM_vs_PF"],
  });
  assert.equal(r.confidence_level, "high");
  assert.equal(r.EVE_pathology_inputs_to_confidence, 0);
});

test("044A5BR-2: PF/OLC inconsistency well evidenced → HIGH allowed", () => {
  const r = svc.evaluateB7Confidence({
    ...baseEpistemicOk,
    business_structural_inconsistency_observed: true,
    business_structural_inconsistency_refs: ["PF_vs_OLC"],
  });
  assert.equal(r.confidence_level, "high");
});

test("044A5BR-3: workaround explícito no reduce confidence", () => {
  const r = svc.evaluateB7Confidence({
    ...baseEpistemicOk,
    business_structural_inconsistency_refs: ["workaround_used"],
    business_structural_inconsistency_observed: true,
    forbidden_feature_bag: { workaround_penalty: 1 },
  });
  assert.equal(r.confidence_level, "high");
  assert.ok(r.rejected_pathology_features.includes("workaround_penalty"));
});

test("044A5BR-4: human_sacrifice explícito no reduce confidence", () => {
  const r = svc.evaluateB7Confidence({
    ...baseEpistemicOk,
    business_structural_inconsistency_observed: true,
    business_structural_inconsistency_refs: ["human_sacrifice"],
    forbidden_feature_bag: { sacrifice_penalty: true },
  });
  assert.equal(r.confidence_level, "high");
});

test("044A5BR-5: deadlock real evidence complete → no pathology penalty", () => {
  const r = svc.evaluateB7Confidence({
    ...baseEpistemicOk,
    business_structural_inconsistency_observed: true,
    business_structural_inconsistency_refs: ["deadlock_risk"],
    forbidden_feature_bag: { deadlock_penalty: true },
  });
  assert.equal(r.confidence_level, "high");
});

test("044A5BR-6: epistemic contradiction same fact → MEDIUM", () => {
  const r = svc.evaluateB7Confidence({
    ...baseEpistemicOk,
    epistemic_contradiction_status: "epistemic_pending",
    microconfirmation_state: "pending",
  });
  assert.equal(r.confidence_level, "medium");
  assert.equal(r.epistemic_flags.epistemic_contradiction_detected, true);
});

test("044A5BR-6b: epistemic contradiction persists after microconfirmation → LOW", () => {
  const r = svc.evaluateB7Confidence({
    ...baseEpistemicOk,
    epistemic_contradiction_status: "epistemic_pending",
    microconfirmation_state: "unresolved_after_attempt",
  });
  assert.equal(r.confidence_level, "low");
});

test("044A5BR-7: missing canonical route → LOW", () => {
  const r = svc.evaluateB7Confidence({
    ...baseEpistemicOk,
    canonical_route_status: "missing_critical",
  });
  assert.equal(r.confidence_level, "low");
});

test("044A5BR-8: unresolved microconfirmation → LOW", () => {
  const r = svc.evaluateB7Confidence({
    ...baseEpistemicOk,
    microconfirmation_state: "unresolved_after_attempt",
  });
  assert.equal(r.confidence_level, "low");
});

test("044A5BR-9: EVE pathology name injected → ignored/rejected", () => {
  const r = svc.evaluateB7Confidence({
    ...baseEpistemicOk,
    injected_pathology_names: ["Esquizofrenia Organizacional", "Ceguera Ontológica"],
  });
  assert.equal(r.confidence_level, "high");
  assert.ok(r.rejected_pathology_features.includes("Esquizofrenia Organizacional"));
  assert.equal(r.EVE_pathology_inputs_to_confidence, 0);
});

test("044A5BR-10: diagnostic candidate exists → no effect on level", () => {
  const r = svc.evaluateB7Confidence({
    ...baseEpistemicOk,
    diagnostic_candidate_refs: ["diagnostic_candidate:PM_PF_mismatch"],
  });
  assert.equal(r.confidence_level, "high");
});

test("044A5BR-11: business inconsistency + complete evidence → HIGH válido", () => {
  const r = svc.evaluateB7Confidence({
    ...baseEpistemicOk,
    business_structural_inconsistency_observed: true,
    business_structural_inconsistency_refs: ["official_seq_vs_real_seq"],
  });
  assert.equal(r.confidence_level, "high");
  assert.equal(r.business_inconsistency_preservation, true);
  assert.equal(r.confidence_score, null);
});

test("044A5BR-12: Tabla EVE never imported by B7ConfidenceService", () => {
  const src = readFileSync(
    path.join(B7_DIR, "runtime-40-20-b7-confidence-service.ts"),
    "utf8",
  );
  assert.equal(src.includes("diagnostic-ontology"), false);
  assert.equal(src.includes("scene-light-preclassification"), false);
  assert.equal(src.includes("Esquizofrenia Ontológica"), false);
  assert.equal(src.includes("pathology_map"), false);
  const rector = JSON.parse(readFileSync(RECTOR, "utf8"));
  assert.equal(rector.rector_id, "EVE_Runtime_B7_Confidence_Governance_Rule_v1_0");
  assert.equal(
    rector.diagnostic_non_contamination_boundary.EVE_inconsistency_table.classification,
    "diagnostic_only",
  );
});

test("044A5BR regulatory layer: separation + classification conformant", () => {
  const criticalStubs = {
    evaluateB0SemanticEntryGateLocally: () => ({ blocking_reasons: [] }),
    evaluateB2TransformationExceptionGateLocally: () => ({ blocking_reasons: [] }),
    evaluateB3ReceiverFeedbackGateLocally: () => ({ blocking_reasons: [] }),
    evaluateB7C20NonDiagnosticBoundaryGateLocally: () => ({ blocking_reasons: [] }),
    evaluateSEM001StateAsClassLocally: () => ({
      blocks_projection: false,
      finding_code: "SEM-001",
    }),
    evaluateSEM002AttributeAsClassLocally: () => ({
      blocks_projection: false,
      finding_code: "SEM-002",
    }),
    evaluateSEM003ProcessAsObjectLocally: () => ({
      blocks_projection: false,
      finding_code: "SEM-003",
    }),
    evaluateSEM004FalseISAByTypeOfLocally: () => ({
      blocks_projection: false,
      finding_code: "SEM-004",
    }),
    evaluateSEM005AliasOrDuplicateLocally: () => ({
      blocks_projection: false,
      finding_code: "SEM-005",
    }),
    evaluateSEM006RolePhaseEndConfusionLocally: () => ({
      blocks_projection: false,
      finding_code: "SEM-006",
    }),
    evaluateSEM007FusedMarsupialObjectLocally: () => ({
      blocks_projection: false,
      finding_code: "SEM-007",
    }),
    evaluatePST001WaitWithoutAwaitedEventLocally: () => ({
      wait_without_awaited_event_detected: false,
    }),
    evaluatePST002MissingReleaseConditionLocally: () => ({
      missing_release_condition_detected: false,
    }),
    evaluatePST003MissingTimerOrTimeoutRuleLocally: () => ({
      missing_timer_or_timeout_rule_detected: false,
    }),
    evaluatePST004MissingTimeoutStateLocally: () => ({
      missing_timeout_state_detected: false,
    }),
    evaluatePST005MissingResolverOwnerLocally: () => ({
      missing_resolver_owner_detected: false,
    }),
    evaluatePST006MissingExitPathLocally: () => ({
      missing_exit_path_detected: false,
    }),
  };

  const layerMod = loadTsModule(
    path.join(
      ROOT,
      "src/services/eve/runtime-40-20/execution-connected/runtime-40-20-regulatory-layer-044A5-service.ts",
    ),
    {
      "../critical-gates/runtime-40-20-critical-gates-service": criticalStubs,
      "../mmabp-gate/runtime-40-20-mmabp-gate-engine-service": {
        evaluateMMABPGateEngine: () => ({
          ok: true,
          decision: "pass",
          evidence_summary: "ok",
          missing_signal_interaction_ids: [],
        }),
      },
      "../branching/runtime-40-20-branching-authority-crosswalk": {
        getPendingSignalCausalRecord: () => ({
          causal_interaction_id: "C20",
          reason: "historical_a4r_marker",
        }),
      },
      "../b7-confidence/runtime-40-20-b7-confidence-service": svc,
    },
  );

  const SEM_PASS = {
    state_as_class_detected: false,
    attribute_as_class_detected: false,
    process_as_object_detected: false,
    false_isa_by_type_of_detected: false,
    alias_or_duplicate_detected: false,
    role_phase_end_confusion_detected: false,
    fused_marsupial_object_detected: false,
  };

  const layer = layerMod.evaluateRegulatoryLayer044A5({
    case_id: "CASE-044A5BR",
    canonical_variables: { action_verb: "elaborar" },
    answered_interaction_ids: ["B0-Q01"],
    opened_causal_ids: [],
    answered_interaction_defs: [
      {
        runtime_interaction_id: "B0-Q01",
        pm_output: "PM",
        moc_output: "MoC",
        pf_output: "PF",
        olc_output: "OLC",
        readiness_effect: "readiness",
      },
    ],
    sem_signals: SEM_PASS,
    b7_confidence_input: {
      business_structural_inconsistency_observed: true,
      business_structural_inconsistency_refs: ["PM_vs_PF"],
    },
  });

  assert.equal(
    layer.classification_hint,
    "runtime_40_20_regulatory_layer_conformant_local_only",
  );
  assert.equal(layer.c20_confidence.producer, "connected");
  assert.equal(layer.c20_confidence.confidence_level, "high");
  assert.equal(layer.c20_confidence.confidence_score, null);
  assert.equal(layer.diagnostic_non_contamination_boundary, "enforced");
  assert.equal(layer.EVE_pathology_inputs_to_confidence, 0);
  assert.equal(layer.business_inconsistency_preservation, true);
  assert.equal(layer.epistemic_vs_structural_contradiction_separated, true);

  const ready = layerMod.resolveRegulatoryReadinessState(layer);
  assert.equal(ready.readiness_state, "ready_with_flags");
  assert.equal(ready.reason, "business_structural_inconsistency_observed");

  mkdirSync(MATERIALIZED, { recursive: true });
  const coverage = {
    instruction: "044-A.5B-R",
    classification: "runtime_40_20_regulatory_layer_conformant_local_only",
    diagnostic_non_contamination_boundary: "enforced",
    EVE_pathology_inputs_to_confidence: 0,
    business_inconsistency_preservation: true,
    epistemic_vs_structural_contradiction_separated: true,
    rector: "EVE_Runtime_B7_Confidence_Governance_Rule_v1_0",
    c20: layer.c20_confidence,
    materiality: layer.materiality,
    next: "044-A.6 synthetic E2E staging completo",
  };
  writeFileSync(
    path.join(MATERIALIZED, "runtime-40-20-b7-confidence-044A5BR.json"),
    `${JSON.stringify(coverage, null, 2)}\n`,
  );
  writeFileSync(
    path.join(MATERIALIZED, "runtime-40-20-b7-confidence-044A5BR.md"),
    `# B7 Confidence 044-A.5B-R\n\nEpistemic only. Diagnostic non-contamination enforced.\n\nClassification: \`${coverage.classification}\`\n`,
  );
  writeFileSync(
    path.join(
      MATERIALIZED,
      "EVE_Runtime_B7_Confidence_Governance_Rule_v1_0.json",
    ),
    readFileSync(RECTOR, "utf8"),
  );
  writeFileSync(
    path.join(MATERIALIZED, "runtime-40-20-regulatory-layer-coverage-044A5BR.json"),
    `${JSON.stringify(coverage, null, 2)}\n`,
  );
});
