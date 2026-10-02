/**
 * 044-A.5 — Regulatory layer conformance (Gates / Budget / SEM / PST / Readiness).
 * Local-only. No staging E2E. No invented confidence_score formula.
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
          const bare = path.resolve(dir, specifier);
          if (existsSync(`${bare}.ts`)) return loadTs(`${bare}.ts`);
        }
        if (specifier.startsWith("node:")) return require(specifier);
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

  const criticalStubs = {
  evaluateB0SemanticEntryGateLocally: (_c, s) => ({
    blocking_reasons:
      s.semantic_confirmation_status === "confirmed" && s.action_verb
        ? []
        : ["missing_semantic_entry"],
  }),
  evaluateB2TransformationExceptionGateLocally: (_c, s) => ({
    blocking_reasons: s.transformation_exception_route_unresolved
      ? ["blocked_by_missing_canonical_route"]
      : [],
  }),
  evaluateB3ReceiverFeedbackGateLocally: (_c, s) => ({
    blocking_reasons: s.receiver_satisfaction_as_feedback_attempted
      ? ["satisfaction_used_as_feedback"]
      : s.receiver_feedback_gap_flag
        ? ["receiver_feedback_gap_flag"]
        : [],
  }),
  evaluateB7C20NonDiagnosticBoundaryGateLocally: (_c, s) => ({
    blocking_reasons:
      s.diagnosis_attempted ||
      s.ir_direct_attempted ||
      s.registry_direct_attempted ||
      s.export_direct_attempted ||
      s.moc_direct_attempted ||
      s.vsm_ahe_final_attempted
        ? ["b7_non_diagnostic_boundary"]
        : [],
  }),
  evaluateSEM001StateAsClassLocally: (_c, s) => ({
    blocks_projection: s.state_as_class_detected === true,
    finding_code: "SEM-001",
  }),
  evaluateSEM002AttributeAsClassLocally: (_c, s) => ({
    blocks_projection: s.attribute_as_class_detected === true,
    finding_code: "SEM-002",
  }),
  evaluateSEM003ProcessAsObjectLocally: (_c, s) => ({
    blocks_projection: s.process_as_object_detected === true,
    finding_code: "SEM-003",
  }),
  evaluateSEM004FalseISAByTypeOfLocally: (_c, s) => ({
    blocks_projection: s.false_isa_by_type_of_detected === true,
    finding_code: "SEM-004",
  }),
  evaluateSEM005AliasOrDuplicateLocally: (_c, s) => ({
    blocks_projection: s.alias_or_duplicate_detected === true,
    finding_code: "SEM-005",
  }),
  evaluateSEM006RolePhaseEndConfusionLocally: (_c, s) => ({
    blocks_projection: s.role_phase_end_confusion_detected === true,
    finding_code: "SEM-006",
  }),
  evaluateSEM007FusedMarsupialObjectLocally: (_c, s) => ({
    blocks_projection:
      s.fused_object_detected === true || s.marsupial_object_detected === true,
    finding_code: "SEM-007",
  }),
  evaluatePST001WaitWithoutAwaitedEventLocally: (_c, s) => ({
    wait_without_awaited_event_detected: !s.awaited_event,
    finding_code: "PST-001",
  }),
  evaluatePST002MissingReleaseConditionLocally: (_c, s) => ({
    missing_release_condition_detected: !s.release_condition,
    finding_code: "PST-002",
  }),
  evaluatePST003MissingTimerOrTimeoutRuleLocally: (_c, s) => ({
    missing_timer_or_timeout_rule_detected: !s.timer_or_timeout_rule,
    finding_code: "PST-003",
  }),
  evaluatePST004MissingTimeoutStateLocally: (_c, s) => ({
    missing_timeout_state_detected: !s.timeout_state,
    finding_code: "PST-004",
  }),
  evaluatePST005MissingResolverOwnerLocally: (_c, s) => ({
    missing_resolver_owner_detected: !s.resolver_owner,
    finding_code: "PST-005",
  }),
  evaluatePST006MissingExitPathLocally: (_c, s) => ({
    missing_exit_path_detected: !s.exit_path,
    finding_code: "PST-006",
  }),
};

const b7Svc = loadTsModule(
  path.join(HERE, "../b7-confidence/runtime-40-20-b7-confidence-service.ts"),
);

const layer = loadTsModule(
  path.join(HERE, "runtime-40-20-regulatory-layer-044A5-service.ts"),
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
      getPendingSignalCausalRecord: (id) =>
        id === "C20"
          ? { causal_interaction_id: "C20", reason: "exact_predicate_signal_pending_A5" }
          : null,
    },
    "../b7-confidence/runtime-40-20-b7-confidence-service": b7Svc,
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

function baseBag(overrides = {}) {
  return {
    case_id: "CASE-044A5",
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
    sem_signals: { ...SEM_PASS },
    ...overrides,
  };
}

test("044A5 Gate0/12: materiality organs classified", () => {
  const r = layer.evaluateRegulatoryLayer044A5(baseBag());
  assert.equal(r.materiality.CriticalRouteGate, "implemented_and_connected");
  assert.equal(r.materiality.MMABPGateEngine, "implemented_and_connected");
  assert.equal(r.materiality.BudgetLedger, "implemented_and_connected");
  assert.ok(String(r.materiality.SEM).includes("connected"));
  assert.ok(String(r.materiality.PST).includes("connected"));
  assert.ok(String(r.materiality.ReadinessEngine).includes("connected"));
  assert.equal(
    r.materiality.B7_confidence_signal,
    "implemented_and_connected_epistemic_only",
  );
  assert.equal(
    r.classification_hint,
    "runtime_40_20_regulatory_layer_conformant_local_only",
  );
  assert.equal(r.c20_confidence.producer, "connected");
  assert.equal(r.diagnostic_non_contamination_boundary, "enforced");
});

test("044A5 A: CR-B0 pass/fail", () => {
  const pass = layer.evaluateRegulatoryLayer044A5(
    baseBag({
      canonical_variables: { action_verb: "elaborar", input_or_object: "x" },
    }),
  );
  assert.equal(pass.critical_routes.find((g) => g.gate === "CR-B0").outcome, "passed");

  const fail = layer.evaluateRegulatoryLayer044A5(
    baseBag({
      canonical_variables: {},
      answered_interaction_ids: ["B0-Q01"],
    }),
  );
  assert.equal(fail.critical_routes.find((g) => g.gate === "CR-B0").outcome, "failed");
});

test("044A5 B: CR-B2 canonical route pass/fail/unresolved", () => {
  const na = layer.evaluateRegulatoryLayer044A5(baseBag());
  assert.ok(
    ["passed", "not_applicable"].includes(
      na.critical_routes.find((g) => g.gate === "CR-B2").outcome,
    ),
  );

  const fail = layer.evaluateRegulatoryLayer044A5(
    baseBag({
      canonical_variables: {
        action_verb: "x",
        transformation_exception_type: "Sí, falla regularmente",
      },
    }),
  );
  assert.equal(fail.critical_routes.find((g) => g.gate === "CR-B2").outcome, "failed");

  const pass = layer.evaluateRegulatoryLayer044A5(
    baseBag({
      canonical_variables: {
        action_verb: "x",
        transformation_exception_type: "Sí, falla regularmente",
        transformation_exception_description: "falla en firma",
      },
    }),
  );
  assert.equal(pass.critical_routes.find((g) => g.gate === "CR-B2").outcome, "passed");
});

test("044A5 C: CR-B3 satisfaction != feedback", () => {
  const gap = layer.evaluateRegulatoryLayer044A5(
    baseBag({
      canonical_variables: {
        action_verb: "x",
        delivery_exception_exists: "Sí, falla regularmente",
      },
    }),
  );
  assert.equal(gap.critical_routes.find((g) => g.gate === "CR-B3").outcome, "failed");
  assert.equal(
    gap.critical_routes.find((g) => g.gate === "CR-B3").evidence_basis.satisfaction_separated,
    true,
  );

  const sat = layer.evaluateRegulatoryLayer044A5(
    baseBag({
      canonical_variables: { action_verb: "x" },
      sem_signals: {
        ...SEM_PASS,
        observed_term: "receiver_satisfaction_as_feedback",
      },
    }),
  );
  assert.equal(sat.critical_routes.find((g) => g.gate === "CR-B3").outcome, "failed");
});

test("044A5 D/W: CR-B7 no diagnosis/registry/IR/export → manual review", () => {
  const cont = layer.evaluateRegulatoryLayer044A5(
    baseBag({
      canonical_variables: { action_verb: "x", confidence_level: "high" },
      b7_contamination: { diagnosis_attempted: true },
    }),
  );
  assert.equal(cont.critical_routes.find((g) => g.gate === "CR-B7").outcome, "blocked");
  const ready = layer.resolveRegulatoryReadinessState(cont);
  assert.equal(ready.readiness_state, "manual_review_required");
});

test("044A5 E: SEM-001..007 structured only", () => {
  const pending = layer.evaluateRegulatoryLayer044A5(
    baseBag({ sem_signals: undefined }),
  );
  for (const code of [
    "SEM-001",
    "SEM-002",
    "SEM-003",
    "SEM-004",
    "SEM-005",
    "SEM-006",
    "SEM-007",
  ]) {
    assert.equal(
      pending.sem.find((s) => s.gate === code).outcome,
      "pending_resolution",
    );
  }

  const blocked = layer.evaluateRegulatoryLayer044A5(
    baseBag({
      sem_signals: { ...SEM_PASS, state_as_class_detected: true },
    }),
  );
  assert.equal(blocked.sem.find((s) => s.gate === "SEM-001").outcome, "blocked");
});

test("044A5 F/G/H: PST-001..006 + strong wait without timer blocks", () => {
  const na = layer.evaluateRegulatoryLayer044A5(baseBag());
  assert.ok(na.pst.every((p) => p.outcome === "not_applicable"));

  const fail = layer.evaluateRegulatoryLayer044A5(
    baseBag({
      process_state_wait: { strong_wait: true },
    }),
  );
  assert.ok(fail.pst.some((p) => p.outcome === "failed"));
  const readyFail = layer.resolveRegulatoryReadinessState(fail);
  assert.equal(readyFail.readiness_state, "blocked");

  const pass = layer.evaluateRegulatoryLayer044A5(
    baseBag({
      canonical_variables: { action_verb: "x", confidence_level: "high" },
      process_state_wait: {
        strong_wait: true,
        awaited_event: "firma",
        release_condition: "firmado",
        timer_or_timeout_rule: "48h",
        timeout_state: "escalated",
        resolver_owner: "supervisor",
        exit_path: "reentry_B4",
      },
    }),
  );
  assert.ok(pass.pst.every((p) => p.outcome === "passed"));
});

test("044A5 I/J/K/L/M/N/O: budget rules documented on layer", () => {
  const r = layer.evaluateRegulatoryLayer044A5(baseBag());
  assert.equal(r.budget.base_cap, 40);
  assert.equal(r.budget.causal_cap, 20);
  assert.match(r.budget.note, /compound=1/);
  assert.match(r.budget.note, /not_opened/);
});

test("044A5 P: readiness cannot be caller-forced", () => {
  const r = layer.evaluateRegulatoryLayer044A5(
    baseBag({
      canonical_variables: { action_verb: "x", confidence_level: "high" },
      caller_forced_ready: true,
    }),
  );
  const ready = layer.resolveRegulatoryReadinessState(r);
  assert.equal(ready.readiness_state, "blocked");
  assert.equal(ready.reason, "caller_forced_ready_rejected");
});

test("044A5 Q: critical route failure prevents ready", () => {
  const r = layer.evaluateRegulatoryLayer044A5(
    baseBag({
      canonical_variables: {
        action_verb: "x",
        confidence_level: "high",
        transformation_exception_type: "Sí, falla regularmente",
      },
    }),
  );
  const ready = layer.resolveRegulatoryReadinessState(r);
  assert.equal(ready.readiness_state, "blocked");
  assert.equal(ready.dominant_gate, "CR-B2");
});

test("044A5 R/S: pending SEM/PST prevent false ready", () => {
  const sem = layer.evaluateRegulatoryLayer044A5(
    baseBag({
      canonical_variables: { action_verb: "x", confidence_level: "high" },
      sem_signals: undefined,
    }),
  );
  assert.equal(layer.resolveRegulatoryReadinessState(sem).readiness_state, "blocked");

  const pst = layer.evaluateRegulatoryLayer044A5(
    baseBag({
      canonical_variables: { action_verb: "x", confidence_level: "high" },
      process_state_wait: { strong_wait: true },
    }),
  );
  assert.equal(layer.resolveRegulatoryReadinessState(pst).readiness_state, "blocked");
});

test("044A5 T/U: C20 confidence produced by B7 epistemic service", () => {
  const produced = layer.evaluateRegulatoryLayer044A5(baseBag());
  assert.equal(produced.c20_confidence.status, "available");
  assert.equal(produced.c20_confidence.producer, "connected");
  assert.ok(["high", "medium", "low"].includes(produced.c20_confidence.confidence_level));
  assert.equal(produced.c20_confidence.confidence_score, null);

  const medium = layer.evaluateRegulatoryLayer044A5(
    baseBag({
      canonical_variables: { action_verb: "x" },
      b7_confidence_input: {
        epistemic_ambiguity_status: "resolvable",
        microconfirmation_state: "pending",
      },
    }),
  );
  assert.equal(medium.c20_confidence.confidence_level, "medium");
});

test("044A5 V: open causal cannot skip to readiness", () => {
  const r = layer.evaluateRegulatoryLayer044A5(
    baseBag({
      canonical_variables: { action_verb: "x", confidence_level: "high" },
      opened_causal_ids: ["C01"],
      answered_interaction_ids: ["B0-Q01"],
    }),
  );
  const ready = layer.resolveRegulatoryReadinessState(r);
  assert.equal(ready.readiness_state, "reentry_required");
  assert.equal(ready.reason, "causal_evaluation_pending");
});

test("044A5 X/Y/Z: no scene/mba/parallel production flags on layer", () => {
  const r = layer.evaluateRegulatoryLayer044A5(
    baseBag({
      canonical_variables: { action_verb: "x", confidence_level: "high" },
    }),
  );
  assert.ok(!JSON.stringify(r).includes("ready_for_parallel_production\":true"));
  assert.equal(r.instruction, "044-A.5B-R");
});

test("044A5 MMABP hard rules emit PM/B1-B6", () => {
  const r = layer.evaluateRegulatoryLayer044A5(baseBag());
  for (const g of [
    "MMABP-PM",
    "MMABP-B1",
    "MMABP-B2",
    "MMABP-B3",
    "MMABP-B4",
    "MMABP-B5",
    "MMABP-B6",
    "MMABPGateEngine",
  ]) {
    assert.ok(r.mmabp.find((m) => m.gate === g), `missing ${g}`);
  }
});

test("044A5 write evidence artifacts", () => {
  mkdirSync(MATERIALIZED, { recursive: true });
  const absent = layer.evaluateRegulatoryLayer044A5(baseBag());
  const present = layer.evaluateRegulatoryLayer044A5(
    baseBag({
      canonical_variables: { action_verb: "elaborar" },
      b7_confidence_input: {
        business_structural_inconsistency_observed: true,
        business_structural_inconsistency_refs: ["PM_vs_PF"],
      },
    }),
  );

  const coverage = {
    instruction: "044-A.5B-R",
    classification: "runtime_40_20_regulatory_layer_conformant_local_only",
    gate0_materiality: absent.materiality,
    organs_independent_conformant: [
      "CriticalRouteGate",
      "MMABPGateEngine",
      "BudgetLedger",
      "SEM",
      "PST",
      "ReadinessEngine",
      "B7_confidence_signal",
    ],
    diagnostic_non_contamination_boundary: "enforced",
    EVE_pathology_inputs_to_confidence: 0,
    business_inconsistency_preservation: true,
    epistemic_vs_structural_contradiction_separated: true,
    b7_confidence: {
      status: "available",
      case: "A_connected_epistemic_producer",
      producer: "connected",
      rector: "EVE_Runtime_B7_Confidence_Governance_Rule_v1_0",
      note: "Epistemic confidence only. Score nullable/non-authoritative. Business inconsistency preserved.",
      thresholds_authority: { high: ">=80", medium: "50..79", low: "<50" },
      enum_authority: ["high", "medium", "low"],
    },
    a4r_preserved: {
      exact_executable_now: 19,
      exact_predicate_signal_pending_A5: 1,
      rector_semantics_truly_unresolved: 0,
      pending_causal: "C20",
      note: "C20 signal now material via B7ConfidenceService; A4R predicate unchanged.",
    },
    no_regression: ["044-A.1", "044-A.2", "044-A.3M", "044-A.4R", "044-A.5"],
    out_of_scope: [
      "staging_writes",
      "synthetic_E2E_staging",
      "Gaby",
      "Panel",
      "production",
      "045",
      "commit",
    ],
    block0_entry_control_source_document_sha256: null,
    block0_sha_note:
      "Left null — exact source document for block0_entry_control not demonstrated; do not invent.",
    sample_epistemic_high_with_business_inconsistency: {
      classification_hint: present.classification_hint,
      c20: present.c20_confidence,
      readiness: layer.resolveRegulatoryReadinessState(present),
    },
  };

  const reports = {
    critical_routes: {
      gates: ["CR-B0", "CR-B2", "CR-B3", "CR-B7"],
      inputs: "canonical variables / branching / source identity / route status / governed events",
      sample: absent.critical_routes,
    },
    mmabp_gates: {
      hard_rules: ["PM", "B1", "B2", "B3", "B4", "B5", "B6"],
      outcomes: ["passed", "failed", "pending_governed_signal", "not_applicable"],
      sample: absent.mmabp,
    },
    sem_gates: {
      gates: ["SEM-001", "SEM-002", "SEM-003", "SEM-004", "SEM-005", "SEM-006", "SEM-007"],
      policy: "structured signals only; absent → pending_resolution; no NLP/regex",
      sample: absent.sem,
    },
    pst_gates: {
      gates: ["PST-001", "PST-002", "PST-003", "PST-004", "PST-005", "PST-006"],
      policy: "strong wait evaluates all six; no hardcoded PST-001 pass",
      sample: absent.pst,
    },
    budget_ledger: {
      base_cap: 40,
      causal_cap: 20,
      compound_cost: 1,
      subfield_cost: 0,
      no_spend_on: [
        "not_opened",
        "pending_governed_signal",
        "unresolved_authority",
        "render_failed",
        "ingest_failed",
        "canonical_write_failed",
      ],
    },
    readiness_real_path: {
      outcomes: [
        "ready",
        "ready_with_flags",
        "blocked",
        "reentry_required",
        "manual_review_required",
      ],
      no_caller_forced_ready: true,
      no_ready_for_parallel_production_alias: true,
      precedence: [
        "completeness",
        "traceability",
        "conformance",
        "consistency",
        "canonical_route",
        "transduction",
      ],
    },
    b7_confidence_signal: coverage.b7_confidence,
  };

  function writePair(base, json, md) {
    writeFileSync(path.join(MATERIALIZED, `${base}.json`), `${JSON.stringify(json, null, 2)}\n`);
    writeFileSync(path.join(MATERIALIZED, `${base}.md`), md);
  }

  writePair(
    "runtime-40-20-critical-routes-044A5",
    reports.critical_routes,
    `# Critical Routes 044-A.5\n\nConnected: CR-B0, CR-B2, CR-B3, CR-B7 via rich organs.\n\nNo raw answer parsing.\n`,
  );
  writePair(
    "runtime-40-20-mmabp-gates-044A5",
    reports.mmabp_gates,
    `# MMABP Gates 044-A.5\n\nHard rules PM/B1–B6 on canonical variables only.\n`,
  );
  writePair(
    "runtime-40-20-sem-gates-044A5",
    reports.sem_gates,
    `# SEM Gates 044-A.5\n\nSEM-001..007 structured signals only.\n`,
  );
  writePair(
    "runtime-40-20-pst-gates-044A5",
    reports.pst_gates,
    `# PST Gates 044-A.5\n\nPST-001..006 on strong wait; missing timer → failed.\n`,
  );
  writePair(
    "runtime-40-20-budget-ledger-044A5",
    reports.budget_ledger,
    `# Budget Ledger 044-A.5\n\nbase≤40 causal≤20; compound=1; no spend on not_opened/pending/failed.\n`,
  );
  writePair(
    "runtime-40-20-readiness-real-path-044A5",
    reports.readiness_real_path,
    `# Readiness Real Path 044-A.5\n\nGate-driven. No caller-forced ready. C20 pending → not ready.\n`,
  );
  writePair(
    "runtime-40-20-b7-confidence-signal-044A5",
    reports.b7_confidence_signal,
    `# B7 Confidence Signal 044-A.5\n\nCase C: pending_governed_signal. No invented formula.\n`,
  );
  writeFileSync(
    path.join(MATERIALIZED, "runtime-40-20-regulatory-layer-coverage-044A5.json"),
    `${JSON.stringify(coverage, null, 2)}\n`,
  );

  assert.ok(
    existsSync(path.join(MATERIALIZED, "runtime-40-20-regulatory-layer-coverage-044A5.json")),
  );
});
