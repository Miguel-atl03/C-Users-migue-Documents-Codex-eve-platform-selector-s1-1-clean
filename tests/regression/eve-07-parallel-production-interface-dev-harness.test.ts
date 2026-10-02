import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const pagePath = "src/app/dev/eve-07-parallel-production-interface-shadow/page.tsx";
const harnessPath =
  "src/app/dev/eve-07-parallel-production-interface-shadow/eve-07-parallel-production-interface-shadow-harness.tsx";
const cssPath =
  "src/app/dev/eve-07-parallel-production-interface-shadow/eve-07-parallel-production-interface-shadow.css";

const fixtureIds = [
  "resolve_scr_payload",
  "resolve_evidence_bundle_payload",
  "resolve_mdsb_payload",
  "resolve_mmabp_ir_candidate",
  "resolve_registry_candidate",
  "resolve_export_blockers",
  "validate_payload_schema_valid",
  "validate_source_proof_valid",
  "validate_export_blocker_valid",
  "validate_exb_031_override_requested_not_audited",
  "validate_exb_031_override_audited",
  "validate_no_export_no_registry_no_parallel_production",
  "validate_documentary_satisfaction",
  "detect_missing_source_proof",
  "detect_missing_payload",
  "validate_registry_candidate_boundary",
] as const;

function read(path: string) {
  assert.equal(existsSync(path), true, `Missing ${path}`);
  return readFileSync(path, "utf8");
}

test("PPI dev harness visual files exist", () => {
  assert.equal(existsSync(pagePath), true);
  assert.equal(existsSync(harnessPath), true);
  assert.equal(existsSync(cssPath), true);
});

test("page only renders the visual harness", () => {
  const source = read(pagePath);

  assert.match(source, /Eve07ParallelProductionInterfaceShadowHarness/);
  assert.match(source, /eve-07-parallel-production-interface-shadow\.css/);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /from ["']@\/services\//);
  assert.doesNotMatch(source, /export\s+(async\s+)?function\s+\w*Action/);
  assert.doesNotMatch(source, /dynamic\s*=/);
});

test("harness imports the pure PPI shadow evaluator", () => {
  const source = read(harnessPath);

  assert.match(source, /evaluateParallelProductionInterfaceShadow/);
  assert.match(source, /@\/domain\/eve-parallel-production-interface-shadow/);
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
    "EVE-07 Parallel Production Interface Shadow Harness",
    "chipId",
    "parallel_production_interface_shadow",
    "candidate not wired",
    "documentary satisfaction",
    "selectedFixture",
    "queryType",
    "module",
    "payloadType",
    "payloadId",
    "ruleId",
    "blockerCode",
    "fieldName",
    "sourceDocumentId",
    "evidenceRefs",
    "sourceTrace",
    "context",
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
    "blockerEvaluation",
    "expectedReadinessState",
    "actualReadinessState",
    "expectedResolved",
    "actualResolved",
    "match:",
  ]) {
    assert.match(source, new RegExp(expected));
  }
});

test("harness exposes protected counters, safety rails and EXB-031", () => {
  const source = read(harnessPath);

  for (const expected of [
    "source_proof_matrix rows",
    "source_to_target mappings",
    "EXB blockers",
    "EXB-031",
    "export blocker vectors",
    "certification claims",
    "QA rows",
    "accepted",
    "rejected",
    "pending_source_proof",
    "pending_locator_precision",
    "certification_claim_unverified",
    "materialDifference",
    "runtimeAuthority",
    "canBlockProductiveUserFlow",
    "canModifyPayload",
    "canConnectEveBrain",
    "canWriteRegistry",
    "canTriggerExport",
    "canTriggerParallelProduction",
    "canTriggerRuntime",
    "canTriggerDiagnosis",
    "canExecuteSql",
    "canWriteSupabase",
    "productWiring",
    "registryWrite",
    "eveBrainConnection",
    "final_export_enabled",
    "parallel_production_enabled",
    "diagnosis_enabled",
    "sqlEnabled",
    "supabaseWrite",
    "overrideRequested",
    "overrideAudited",
    "blocked",
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
    /canTriggerExport:\s*true/,
    /canTriggerParallelProduction:\s*true/,
    /canExecuteSql:\s*true/,
    /canWriteSupabase:\s*true/,
    /registryWrite:\s*true/,
    /productWiring:\s*true/,
    /eveBrainConnection:\s*true/,
    /final_export_enabled:\s*true/,
    /parallel_production_enabled:\s*true/,
    /diagnosis_enabled:\s*true/,
    /sqlEnabled:\s*true/,
    /supabaseWrite:\s*true/,
    /connectEveBrain/,
    /writeRegistry/,
    /triggerRuntime/,
    /triggerDiagnosis/,
    /triggerExport/,
    /triggerParallelProduction/,
    /executeSql/,
    /writeSupabase/,
    /mutateWorkMap/,
    /mutateSignificado/,
    /\bSQL\b/,
  ]) {
    assert.doesNotMatch(combined, forbidden);
  }
});
