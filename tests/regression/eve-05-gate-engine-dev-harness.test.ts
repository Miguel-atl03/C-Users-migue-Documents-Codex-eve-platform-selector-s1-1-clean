import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const pagePath = "src/app/dev/eve-05-gate-engine-shadow/page.tsx";
const harnessPath =
  "src/app/dev/eve-05-gate-engine-shadow/eve-05-gate-engine-shadow-harness.tsx";
const cssPath = "src/app/dev/eve-05-gate-engine-shadow/eve-05-gate-engine-shadow.css";

const fixtureIds = [
  "resolve_existing_gate",
  "resolve_missing_gate",
  "resolve_existing_rule",
  "validate_critical_route_gate_valid",
  "validate_semantic_resolution_gate_valid",
  "validate_process_state_timer_gate_valid",
  "validate_mmabp_conformance_gate_valid",
  "validate_mmabp_consistency_gate_valid",
  "validate_failure_guard_valid",
  "validate_atomic_rule_source_proof",
  "validate_no_overreach_d1_vsm1_ahe1",
  "validate_no_runtime_authority",
] as const;

function read(path: string) {
  assert.equal(existsSync(path), true, `Missing ${path}`);
  return readFileSync(path, "utf8");
}

test("gate engine dev harness visual files exist", () => {
  assert.equal(existsSync(pagePath), true);
  assert.equal(existsSync(harnessPath), true);
  assert.equal(existsSync(cssPath), true);
});

test("page only renders the visual harness", () => {
  const source = read(pagePath);

  assert.match(source, /Eve05GateEngineShadowHarness/);
  assert.match(source, /eve-05-gate-engine-shadow\.css/);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /from ["']@\/services\//);
  assert.doesNotMatch(source, /export\s+(async\s+)?function\s+\w*Action/);
  assert.doesNotMatch(source, /dynamic\s*=/);
});

test("harness imports the pure gate engine shadow evaluator", () => {
  const source = read(harnessPath);

  assert.match(source, /evaluateGateEngineShadow/);
  assert.match(source, /@\/domain\/eve-gate-engine-shadow/);
});

test("harness exposes all 12 approved fixture ids", () => {
  const source = read(harnessPath);

  for (const fixtureId of fixtureIds) {
    assert.match(source, new RegExp(fixtureId));
  }
});

test("harness exposes required visual trace fields", () => {
  const source = read(harnessPath);

  for (const expected of [
    "EVE-05 Gate Engine Shadow Harness",
    "chipId",
    "gate_engine_shadow",
    "candidate not wired",
    "documentary satisfaction",
    "selectedFixture",
    "queryType",
    "gateId",
    "ruleId",
    "module",
    "sourceDocumentId",
    "evidenceRefs",
    "sourceTrace",
    "readinessState",
    "resolved",
    "resolvedEntity",
    "missingReferences",
    "gapFlags",
    "allowedActions",
    "blockedActions",
    "requiredInputs",
    "findings",
    "auditEvents",
    "safetyFlags",
    "documentarySatisfaction",
    "expectedReadinessState",
    "actualReadinessState",
    "expectedResolved",
    "actualResolved",
    "match:",
  ]) {
    assert.match(source, new RegExp(expected));
  }
});

test("harness exposes protected counters and safety rails", () => {
  const source = read(harnessPath);

  for (const expected of [
    "critical_route_gate",
    "semantic_resolution_gate",
    "process_state_timer_gate",
    "mmabp_conformance_gate",
    "mmabp_consistency_gate",
    "failure_guards",
    "atomic_rules_and_gate_definitions",
    "companion proofs",
    "atomic rules proof",
    "previous rejected rules repaired",
    "previous rejected records repaired",
    "mismatches",
    "missingInChip",
    "missingInSource",
    "pendingSourceProof",
    "overreachDetected",
    "runtimeAuthority",
    "canConnectEveBrain",
    "canWriteRegistry",
    "productWiring",
    "registryWrite",
    "eveBrainConnection",
    "canBlockUserFlow",
    "canModifyPayload",
    "canModifyCatalog",
    "canTriggerRuntime",
    "canTriggerDiagnosis",
    "canTriggerExport",
  ]) {
    assert.match(source, new RegExp(expected));
  }
});

test("created visual harness files contain no productive wiring text", () => {
  const combined = `${read(pagePath)}\n${read(harnessPath)}\n${read(cssPath)}`;

  for (const forbidden of [
    /createClient/,
    /supabase/i,
    /\bfrom\s*\(/,
    /\binsert\s*\(/,
    /\bupdate\s*\(/,
    /\bdelete\s*\(/,
    /\bfetch\s*\(/,
    /route\.ts/,
    /api\//,
    /server action/i,
    /'use server'/,
    /runtimeAuthority:\s*true/,
    /canConnectEveBrain:\s*true/,
    /canWriteRegistry:\s*true/,
    /registryWrite:\s*true/,
    /productWiring:\s*true/,
    /eveBrainConnection:\s*true/,
    /connectEveBrain/,
    /writeRegistry/,
    /triggerRuntime/,
    /triggerDiagnosis/,
    /triggerExport/,
    /mutateWorkMap/,
    /mutateSignificado/,
    /\bSQL\b/,
  ]) {
    assert.doesNotMatch(combined, forbidden);
  }
});
