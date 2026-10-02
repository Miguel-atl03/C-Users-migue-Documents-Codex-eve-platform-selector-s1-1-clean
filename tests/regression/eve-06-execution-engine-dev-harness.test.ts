import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const pagePath = "src/app/dev/eve-06-execution-engine-shadow/page.tsx";
const harnessPath =
  "src/app/dev/eve-06-execution-engine-shadow/eve-06-execution-engine-shadow-harness.tsx";
const cssPath =
  "src/app/dev/eve-06-execution-engine-shadow/eve-06-execution-engine-shadow.css";

const fixtureIds = [
  "resolve_activity_runtime_run",
  "resolve_interaction_instance",
  "resolve_response_ingest",
  "resolve_evidence_item",
  "resolve_canonical_variable_record",
  "resolve_structural_candidate_record",
  "validate_record_schema_valid",
  "validate_required_fields_valid",
  "validate_lifecycle_valid",
  "validate_source_role_valid",
  "validate_evidence_trace_valid",
  "validate_structural_candidate_dependency_d8_gate",
  "validate_no_runtime_authority",
  "validate_no_registry_write_no_diagnosis_no_export",
  "detect_missing_record",
  "detect_missing_source_trace",
] as const;

function read(path: string) {
  assert.equal(existsSync(path), true, `Missing ${path}`);
  return readFileSync(path, "utf8");
}

test("execution engine dev harness visual files exist", () => {
  assert.equal(existsSync(pagePath), true);
  assert.equal(existsSync(harnessPath), true);
  assert.equal(existsSync(cssPath), true);
});

test("page only renders the visual harness", () => {
  const source = read(pagePath);

  assert.match(source, /Eve06ExecutionEngineShadowHarness/);
  assert.match(source, /eve-06-execution-engine-shadow\.css/);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /from ["']@\/services\//);
  assert.doesNotMatch(source, /export\s+(async\s+)?function\s+\w*Action/);
  assert.doesNotMatch(source, /dynamic\s*=/);
});

test("harness imports the pure execution engine shadow evaluator", () => {
  const source = read(harnessPath);

  assert.match(source, /evaluateExecutionEngineShadow/);
  assert.match(source, /@\/domain\/eve-execution-engine-shadow/);
});

test("harness exposes all 16 approved fixture ids", () => {
  const source = read(harnessPath);

  for (const fixtureId of fixtureIds) {
    assert.match(source, new RegExp(fixtureId));
  }
});

test("harness exposes required visual trace fields", () => {
  const source = read(harnessPath);

  for (const expected of [
    "EVE-06 Execution Engine Shadow Harness",
    "chipId",
    "execution_engine_shadow",
    "candidate not wired",
    "documentary satisfaction",
    "selectedFixture",
    "queryType",
    "module",
    "recordType",
    "recordId",
    "ruleId",
    "fieldName",
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
    "modules",
    "atomic rules",
    "failure guards",
    "integration rules",
    "source_to_target mappings",
    "QA controls",
    "schema fields",
    "accepted",
    "rejected",
    "pending_source_proof",
    "pending_locator_precision",
    "source_role_mismatch",
    "source_missing",
    "wiring_risk_detected",
    "materialDifference",
    "D1 direct proof SCR",
    "D8 present for SCR",
    "STM6-016 covers",
    "runtimeAuthority",
    "canConnectEveBrain",
    "canWriteRegistry",
    "canExecuteSql",
    "canWriteSupabase",
    "productWiring",
    "registryWrite",
    "eveBrainConnection",
    "diagnosisEnabled",
    "exportEnabled",
    "sqlEnabled",
    "supabaseWrite",
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
    /\bsupabase\b/,
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
    /canExecuteSql:\s*true/,
    /canWriteSupabase:\s*true/,
    /registryWrite:\s*true/,
    /productWiring:\s*true/,
    /eveBrainConnection:\s*true/,
    /diagnosisEnabled:\s*true/,
    /exportEnabled:\s*true/,
    /sqlEnabled:\s*true/,
    /supabaseWrite:\s*true/,
    /connectEveBrain/,
    /writeRegistry/,
    /triggerRuntime/,
    /triggerDiagnosis/,
    /triggerExport/,
    /executeSql/,
    /writeSupabase/,
    /mutateWorkMap/,
    /mutateSignificado/,
    /\bSQL\b/,
  ]) {
    assert.doesNotMatch(combined, forbidden);
  }
});
