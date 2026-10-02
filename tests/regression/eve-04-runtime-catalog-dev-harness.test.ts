import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const pagePath = "src/app/dev/runtime-catalog-shadow/page.tsx";
const helperPath = "src/features/dev/runtime-catalog-shadow-fixtures.ts";

const fixtureIds = [
  "resolve_existing_base_interaction",
  "resolve_missing_runtime_interaction",
  "resolve_existing_causal_interaction",
  "validate_ux_subfield_structure_valid",
  "validate_b6_q38_trench_phrase_ccov",
  "validate_cvar_001_33_definitions",
  "validate_branching_rule_structural_evidence",
  "validate_branching_rule_curiosity_blocked",
  "validate_causal_budget_available",
  "validate_causal_budget_exhausted",
  "validate_readiness_reentry_state",
  "validate_no_runtime_authority",
] as const;

function read(path: string) {
  assert.equal(existsSync(path), true, `Missing ${path}`);
  return readFileSync(path, "utf8");
}

test("runtime catalog shadow dev harness files exist", () => {
  assert.equal(existsSync(pagePath), true);
  assert.equal(existsSync(helperPath), true);
});

test("page renders explicit dev-only and not productive labels", () => {
  const source = read(pagePath);

  assert.match(source, /EVE-04 Runtime Catalog Shadow/);
  assert.match(source, /DEV HARNESS ONLY/);
  assert.match(source, /NOT PRODUCTIVE UI/);
  assert.match(source, /runtimeAuthority/);
  assert.match(source, /registryWrite/);
  assert.match(source, /productWiring/);
  assert.match(source, /eveBrainConnection/);
});

test("helper exposes the 12 approved fixture IDs through trace data", () => {
  const trace = read("docs/audits/_eve_04_runtime_catalog_shadow_mode_pure_domain_trace_v1.json");

  for (const fixtureId of fixtureIds) {
    assert.match(trace, new RegExp(fixtureId));
  }
});

test("page exposes expected actual match and trace fields", () => {
  const source = read(pagePath);

  for (const label of [
    "expectedReadinessState",
    "actualReadinessState",
    "MATCH",
    "resolvedEntity",
    "missingReferences",
    "gapFlags",
    "sourceTrace",
    "evidenceRefs",
    "allowedActions",
    "blockedActions",
    "requiredInputs",
    "findings",
    "auditEvents count",
    "safetyFlags",
    "documentarySatisfaction",
  ]) {
    assert.match(source, new RegExp(label));
  }
});

test("helper protects runtime counters and documentary satisfaction", () => {
  const helper = read(helperPath);
  const trace = read("docs/audits/_eve_04_runtime_catalog_shadow_mode_pure_domain_trace_v1.json");
  const requirements = read(
    "docs/audits/_eve_04_runtime_catalog_future_ui_trace_requirements_v1.json",
  );

  for (const expected of [
    "baseInteractions",
    "causalInteractions",
    "uxSubfields",
    "branchingRules",
    "branchingScores",
    "readinessStates",
    "sourceNodesCoverage",
    "sourceCodesCoverage",
    "ccov001",
    "cvar001",
  ]) {
    assert.match(helper, new RegExp(expected));
  }

  for (const expected of ["40", "20", "17", "10", "11", "7", "164/164", "33/33"]) {
    assert.match(requirements, new RegExp(expected.replace("/", "\\/")));
  }

  assert.match(trace, /"status": "satisfactory"/);
  assert.match(trace, /"mismatches": 0/);
  assert.match(trace, /"missingInChip": 0/);
  assert.match(trace, /"missingInSource": 0/);
  assert.match(trace, /"pendingSourceProof": 0/);
});

test("source contains no productive wiring or forbidden authority", () => {
  const combined = `${read(pagePath)}\n${read(helperPath)}`;

  for (const forbidden of [
    /runtimeAuthority:\s*true/,
    /canWriteRegistry:\s*true/,
    /canModifyPayload:\s*true/,
    /canModifyCatalog:\s*true/,
    /canTriggerRuntime:\s*true/,
    /canTriggerDiagnosis:\s*true/,
    /canTriggerExport:\s*true/,
    /canConnectEveBrain:\s*true/,
    /supabase/i,
    /createClient/i,
    /\bfetch\s*\(/,
    /\bPOST\b/,
    /registry\.write/i,
  ]) {
    assert.doesNotMatch(combined, forbidden);
  }
});
