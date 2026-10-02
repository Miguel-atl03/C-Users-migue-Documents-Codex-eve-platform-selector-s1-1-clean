import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { register } from "node:module";
import { writeFileSync } from "node:fs";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../../..");

const hookPath = join(tmpdir(), "eve-runtime-4020-ops-rules-path-hook.mjs");
writeFileSync(
  hookPath,
  `import { pathToFileURL, fileURLToPath } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";
import { existsSync } from "node:fs";
const projectRoot = ${JSON.stringify(projectRoot)};
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    let mappedPath = resolvePath(projectRoot, "src", specifier.slice(2));
    if (!/\\.(tsx?|jsx?|mjs|cjs)$/.test(mappedPath)) {
      mappedPath += ".ts";
    }
    return { shortCircuit: true, url: pathToFileURL(mappedPath).href };
  }
  if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    !/\\.(tsx?|jsx?|mjs|cjs|json)$/.test(specifier) &&
    context.parentURL
  ) {
    const parentDir = dirname(fileURLToPath(context.parentURL));
    const withTs = resolvePath(parentDir, specifier + ".ts");
    if (existsSync(withTs)) {
      return { shortCircuit: true, url: pathToFileURL(withTs).href };
    }
  }
  return nextResolve(specifier, context);
}
`,
);
register(pathToFileURL(hookPath).href, import.meta.url);

function readText(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), "utf8");
}

function assertExists(relativePath) {
  assert.equal(existsSync(resolve(projectRoot, relativePath)), true, `Missing ${relativePath}`);
}

const {
  BASE40_BASE_IDS,
  BASE40_OPERATIONAL_RULE,
} = await import(
  "../../../src/services/eve/runtime-40-20/operational-rules/base40-operational-rule.ts"
);
const {
  CAUSAL20_IDS,
  CAUSAL20_OPERATIONAL_RULE,
} = await import(
  "../../../src/services/eve/runtime-40-20/operational-rules/causal20-operational-rule.ts"
);
const { evaluateBaseResolutionGate } = await import(
  "../../../src/services/eve/runtime-40-20/operational-rules/base-resolution-gate.ts"
);
const { evaluateCausalClosureGate } = await import(
  "../../../src/services/eve/runtime-40-20/operational-rules/causal-closure-gate.ts"
);
const {
  evaluateRuntime4020ReadinessGuard,
  OPERATIONAL_RULES_MISSING_BLOCKS_READY,
  evaluateMissingOperationalRulesRunGuard,
  evaluateDeepCaptureOperationalRulesPresence,
} = await import(
  "../../../src/services/eve/runtime-40-20/operational-rules/runtime-40-20-readiness-guard.ts"
);
const { resolveReadinessEvaluation, resolveReadinessState } = await import(
  "../../../src/services/eve/runtime-40-20/gates-readiness/runtime-40-20-gates-readiness-service.ts"
);
const {
  buildAmbarBaseResolutionByRun,
  buildAmbarCausalClosureByRun,
} = await import(
  "../../../src/services/eve/consultant-control-panel/fixtures/ambar-runtime-4020-operational-ledgers.ts"
);

function fullBaseRecords(state = "captured_user_evidence") {
  return BASE40_BASE_IDS.map((base_id) => ({
    base_id,
    state,
    canonical_variable: `var_${base_id}`,
    provenance: `prov_${base_id}`,
    mmabp_or_readiness_output: `out_${base_id}`,
  }));
}

function fullCausalRecords(state = "not_triggered_with_evidence") {
  return CAUSAL20_IDS.map((causal_id) => ({
    causal_id,
    activation_state: state,
    condition_evidence: `evidence_${causal_id}`,
    produces_diagnosis_or_export: false,
  }));
}

test("operational rule source docs exist", () => {
  assertExists("docs/runtime-operational-rules/Regla_Operativa_40_Preguntas_Base_EVE_MMABP_Ajustada.docx");
  assertExists("docs/runtime-operational-rules/Regla_Operativa_20_Preguntas_Causales_EVE_MMABP_Ajustada.docx");
  assertExists("docs/runtime-operational-rules/base40_operational_rule.json");
  assertExists("docs/runtime-operational-rules/base40_operational_rule.md");
  assertExists("docs/runtime-operational-rules/causal20_operational_rule.json");
  assertExists("docs/runtime-operational-rules/causal20_operational_rule.md");
});

test("BASE-40 creates 40 states per run", () => {
  assert.equal(BASE40_BASE_IDS.length, 40);
  assert.equal(BASE40_OPERATIONAL_RULE.base_interactions_required, 40);
  const gate = evaluateBaseResolutionGate({ base_resolutions: fullBaseRecords() });
  assert.equal(gate.total_required, 40);
  assert.equal(gate.resolved_count, 40);
  assert.equal(gate.passed_for_ready_full, true);
});

test("skipped_silently blocks ready", () => {
  const records = fullBaseRecords();
  records[0].state = "skipped_silently";
  const gate = evaluateBaseResolutionGate({ base_resolutions: records });
  assert.equal(gate.skipped_silently_count, 1);
  assert.equal(gate.passed_for_ready_full, false);
  const guard = evaluateRuntime4020ReadinessGuard({
    base_resolutions: records,
    causal_closures: fullCausalRecords(),
  });
  assert.equal(guard.ready_full_allowed, false);
  assert.equal(guard.handoff_to_evidence_bundle_allowed, false);
});

test("inferred_unconfirmed does not allow ready full", () => {
  const records = fullBaseRecords();
  records[1].state = "inferred_unconfirmed";
  const gate = evaluateBaseResolutionGate({ base_resolutions: records });
  assert.equal(gate.inferred_unconfirmed_count, 1);
  assert.equal(gate.passed_for_ready_full, false);
});

test("all 40 resolved allows advance", () => {
  const gate = evaluateBaseResolutionGate({ base_resolutions: fullBaseRecords() });
  assert.equal(gate.allowed_next_state, "ready");
  assert.equal(gate.handoff_to_evidence_bundle_mdsb_allowed, true);
});

test("CAUSAL-20 evaluates C01-C20 per run", () => {
  assert.equal(CAUSAL20_IDS.length, 20);
  assert.equal(CAUSAL20_OPERATIONAL_RULE.causals_evaluated_always, true);
  const gate = evaluateCausalClosureGate({ causal_closures: fullCausalRecords() });
  assert.equal(gate.total_required_evaluations, 20);
  assert.equal(gate.evaluated_count, 20);
  assert.equal(gate.passed_for_ready_full, true);
});

test("activation_unknown blocks ready full", () => {
  const records = fullCausalRecords();
  records[0].activation_state = "activation_unknown";
  const gate = evaluateCausalClosureGate({ causal_closures: records });
  assert.equal(gate.activation_unknown_count, 1);
  assert.equal(gate.passed_for_ready_full, false);
});

test("triggered_unanswered blocks ready full", () => {
  const records = fullCausalRecords();
  records[4].activation_state = "triggered_unanswered";
  const gate = evaluateCausalClosureGate({ causal_closures: records });
  assert.equal(gate.triggered_unanswered_count, 1);
  assert.equal(gate.passed_for_ready_full, false);
});

test("P0 blockers C05/C09/C11/C20 open block ready full", () => {
  for (const p0 of ["C05", "C09", "C11", "C20"]) {
    const records = fullCausalRecords();
    const idx = CAUSAL20_IDS.indexOf(p0);
    records[idx].activation_state = "triggered_unanswered";
    const gate = evaluateCausalClosureGate({ causal_closures: records });
    assert.ok(gate.p0_blockers.includes(p0), `expected ${p0} in p0_blockers`);
    assert.equal(gate.passed_for_ready_full, false);
  }
});

test("C20 non-diagnostic boundary enforced", () => {
  const records = fullCausalRecords();
  const c20 = records.find((record) => record.causal_id === "C20");
  c20.produces_diagnosis_or_export = true;
  const gate = evaluateCausalClosureGate({ causal_closures: records });
  assert.equal(gate.c20_non_diagnostic_boundary_respected, false);
  assert.equal(gate.passed_for_ready_full, false);
});

test("ready_with_flags only with explicit flags", () => {
  const bases = fullBaseRecords();
  bases[2].state = "ready_with_flag";
  const causals = fullCausalRecords();
  causals[1].activation_state = "triggered_required";
  causals[1].condition_evidence = "gap_explicit: frame ambiguity";
  const withoutFlags = evaluateRuntime4020ReadinessGuard({
    base_resolutions: bases,
    causal_closures: causals,
  });
  assert.equal(withoutFlags.ready_with_flags_allowed, false);
  const withFlags = evaluateRuntime4020ReadinessGuard({
    base_resolutions: bases,
    causal_closures: causals,
    explicit_flags: ["scene_frame_gap"],
  });
  assert.equal(withFlags.ready_full_allowed, false);
  assert.equal(withFlags.ready_with_flags_allowed, true);
  assert.equal(withFlags.readiness_state, "ready_with_flags");
});

test("fixture Ámbar has 40 base and 20 causal evaluations per run", () => {
  const bases = buildAmbarBaseResolutionByRun();
  const causals = buildAmbarCausalClosureByRun();
  assert.equal(bases.length, 3);
  assert.equal(causals.length, 3);
  for (const run of bases) {
    assert.equal(run.records.length, 40);
    assert.equal(run.skipped_silently_count, 0);
  }
  for (const run of causals) {
    assert.equal(run.records.length, 20);
  }
});

test("panel Area 3 shows Base Resolution Gate and Causal Closure Gate", () => {
  const area3 = readText(
    "src/components/consultant/control-panel/EveOperationalTracePanel.tsx",
  );
  assert.match(area3, /Base Resolution Gate/);
  assert.match(area3, /Causal Closure Gate/);
  assert.match(
    area3,
    /40\/20 no significa consumo opcional reducido\. Significa 40 base obligatorias por resolución/,
  );
  assert.match(
    area3,
    /Una interacción puede no mostrarse al usuario, pero no puede desaparecer/,
  );
  assert.match(
    area3,
    /Reglas operativas 40\/20 ausentes — readiness bloqueado/,
  );
});

test("readiness proposed ready + missing operational_rules_run => blocked", () => {
  const result = resolveReadinessEvaluation({
    scope: {
      tenant_id: "t",
      case_id: "c",
      role_id: "r",
      activity_id: "a",
      run_id: "run",
      correlation_id: "corr",
      idempotency_key: "idem",
    },
    dominant_gate_code: "B2",
    critical_route_results: [],
    missing_critical_evidence: false,
    b3_incomplete: false,
    b7_boundary_blocked: false,
    manual_review_required: false,
    reentry_required: false,
  });
  assert.equal(result.readiness_state, "blocked");
  assert.equal(result.blocking_reason, "missing_runtime_40_20_operational_rules_run");
  assert.equal(result.readiness_gap?.gap_type, "missing_runtime_40_20_operational_rules_run");
  assert.equal(result.readiness_gap?.severity, "high");
  assert.equal(
    result.readiness_gap?.reentry_target,
    "BaseResolutionGate/CausalClosureGate",
  );
});

test("readiness proposed ready_with_flags + missing operational_rules_run => blocked", () => {
  const state = resolveReadinessState({
    scope: {
      tenant_id: "t",
      case_id: "c",
      role_id: "r",
      activity_id: "a",
      run_id: "run",
      correlation_id: "corr",
      idempotency_key: "idem",
    },
    dominant_gate_code: "B2",
    critical_route_results: [],
    missing_critical_evidence: true,
    b3_incomplete: false,
    b7_boundary_blocked: false,
    manual_review_required: false,
    reentry_required: false,
  });
  assert.equal(state, "blocked");
});

test("missing operational_rules_run no permite EvidenceBundle handoff", () => {
  assert.equal(OPERATIONAL_RULES_MISSING_BLOCKS_READY, true);
  const guard = evaluateMissingOperationalRulesRunGuard();
  assert.equal(guard.handoff_to_evidence_bundle_allowed, false);
  assert.equal(guard.ready_full_allowed, false);
  assert.equal(guard.ready_with_flags_allowed, false);
  assert.ok(
    guard.blocking_reasons.includes("missing_runtime_40_20_operational_rules_run"),
  );
});

test("missing operational_rules_run no permite MDSB handoff", () => {
  const guard = evaluateRuntime4020ReadinessGuard({
    base_resolutions: [],
    causal_closures: [],
    operational_rules_run_present: false,
  });
  assert.equal(guard.handoff_to_mdsb_allowed, false);
  assert.equal(guard.readiness_state, "blocked");
});

test("runtime_deep_capture_required=false permite bypass solo si se documenta explícitamente como no Runtime profundo", () => {
  const presence = evaluateDeepCaptureOperationalRulesPresence({
    operational_rules_run_present: false,
    runtime_deep_capture_required: false,
  });
  assert.equal(presence, null);
  const state = resolveReadinessState({
    scope: {
      tenant_id: "t",
      case_id: "c",
      role_id: "r",
      activity_id: "a",
      run_id: "run",
      correlation_id: "corr",
      idempotency_key: "idem",
    },
    dominant_gate_code: "B2",
    critical_route_results: [],
    missing_critical_evidence: false,
    b3_incomplete: false,
    b7_boundary_blocked: false,
    manual_review_required: false,
    reentry_required: false,
    // Explicit non-Runtime-deep path documentation.
    runtime_deep_capture_required: false,
  });
  assert.equal(state, "ready");
});

test("activity_runtime_run profundo siempre exige BASE-40 y CAUSAL-20", () => {
  const incomplete = evaluateRuntime4020ReadinessGuard({
    base_resolutions: fullBaseRecords().slice(0, 10),
    causal_closures: fullCausalRecords().slice(0, 5),
    operational_rules_run_present: true,
    runtime_deep_capture_required: true,
  });
  assert.equal(incomplete.ready_full_allowed, false);
  assert.equal(incomplete.handoff_to_evidence_bundle_allowed, false);
  assert.equal(incomplete.handoff_to_mdsb_allowed, false);

  const complete = evaluateRuntime4020ReadinessGuard({
    base_resolutions: fullBaseRecords(),
    causal_closures: fullCausalRecords(),
    operational_rules_run_present: true,
    runtime_deep_capture_required: true,
  });
  assert.equal(complete.base_resolution_gate.total_required, 40);
  assert.equal(complete.causal_closure_gate.total_required_evaluations, 20);
  assert.equal(complete.ready_full_allowed, true);
});

test("downloads and controls remain disabled; no auto diagnosis or productive export", () => {
  const downloads = readText(
    "docs/consultant-control-panel/consultant_control_panel_downloads_policy.json",
  );
  const manual = readText(
    "docs/consultant-control-panel/consultant_control_panel_manual_actions_policy.json",
  );
  const ledger = readText(
    "docs/runtime-operational-rules/runtime_40_20_boundary_ledger.json",
  );
  assert.match(downloads, /disabled_with_reason/);
  assert.match(manual, /disabled|requires_audited|enabled/i);
  assert.match(ledger, /"downloads_activated": false/);
  assert.match(ledger, /"manual_controls_activated": false/);
  assert.match(ledger, /"diagnosis_final_automatic_created": false/);
  assert.match(ledger, /"productive_export_executed": false/);
});
