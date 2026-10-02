import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const routePath = "src/app/dev/agent-constitution-shadow/page.tsx";
const fixturesPath = "src/features/dev/agent-constitution-shadow-fixtures.ts";
const productionPagePath = "src/app/page.tsx";

const REQUIRED_FIXTURE_IDS = [
  "capture_allowed_traced_evidence",
  "missing_source_trace",
  "scope_blocked_final_diagnosis",
  "diagnostic_preclassification_candidate",
  "parallel_preview_blocked_missing_readiness",
  "audit_required_incomplete_source_trace",
] as const;

function source(path: string) {
  return readFileSync(path, "utf8");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("dev harness route exists and imports shadow evaluator", () => {
  const route = source(routePath);

  assert.equal(existsSync(routePath), true);
  assert.match(route, /evaluateAgentConstitutionShadow/);
  assert.match(route, /AGENT_CONSTITUTION_SHADOW_FIXTURES/);
});

test("fixtures export required fixtureIds and evaluation inputs", () => {
  const fixtures = source(fixturesPath);

  for (const fixtureId of REQUIRED_FIXTURE_IDS) {
    assert.match(fixtures, new RegExp(`fixtureId: "${fixtureId}"`));
  }

  assert.match(fixtures, /sourceTrace/);
  assert.match(fixtures, /evidenceItems/);
  assert.match(fixtures, /provenanceType/);
  assert.match(fixtures, /epistemicStatus/);
  assert.match(fixtures, /expectedReadinessState: "capture_allowed"/);
  assert.match(fixtures, /expectedReadinessState: "audit_required"/);
  assert.match(fixtures, /expectedReadinessState: "blocked_by_scope"/);
  assert.match(
    fixtures,
    /expectedReadinessState: "ready_for_diagnostic_preclassification"/,
  );
  assert.match(fixtures, /expectedReadinessState: "export_blocked"/);
});

test("dev harness uses structured fixtures and does not import forbidden systems", () => {
  const route = source(routePath);
  const fixtures = source(fixturesPath);
  const combined = `${route}\n${fixtures}`;

  for (const forbidden of [
    /WorkMap(?! draft crudo)/i,
    /Significado/i,
    /runtime-engine/i,
    /Supabase/i,
    /from\s+["']@\/services\/runtime-block0/i,
    /from\s+["']@\/services\/work-map/i,
    /from\s+["']@\/services\/significado/i,
    /from\s+["']@\/components/i,
  ]) {
    assert.doesNotMatch(combined, forbidden);
  }
});

test("production page is not modified to link dev harness", () => {
  const productionPage = source(productionPagePath);

  assert.doesNotMatch(productionPage, /agent-constitution-shadow/);
});

test("dev harness renders required labels and safety flags", () => {
  const route = source(routePath);

  for (const requiredText of [
    "DEV-ONLY HARNESS",
    "EVE 01 Agent Constitution Shadow",
    "MATCH",
    "chipId",
    "AGENT_CONSTITUTION_STATIC_TESTS_READY",
    "AGENT_CONSTITUTION_SHADOW_MODE_READY",
    "requestedAction",
    "inputClassification",
    "targetBoundary",
    "Evidence trace",
    "Source trace",
    "Method Kernel trace",
    "methodKernelResult",
    "allowedActions",
    "blockedActions",
    "requiredInputs",
    "User blocking disabled",
    "Payload mutation disabled",
    "Registry write disabled",
    "Final diagnosis disabled",
    "Production trigger disabled",
    "Runtime authority disabled",
    "safetyFlags",
  ]) {
    assert.match(route, new RegExp(escapeRegExp(requiredText)));
  }
});

test("dev harness has no registry write, runtime authority or forbidden outputs", () => {
  const route = source(routePath);
  const fixtures = source(fixturesPath);

  assert.doesNotMatch(fixtures, /writeRegistry|setRegistry|RECTOR_DOCS_REGISTRY/);
  assert.doesNotMatch(route, /runtimeAuthority:\s*true/);
  assert.doesNotMatch(fixtures, /finalDiagnosis/);
  assert.doesNotMatch(fixtures, /Producci[oó]n Paralela/i);
  assert.doesNotMatch(route, /triggerDiagnosis|diagnoseEve|diagnosticPayload/);
});
