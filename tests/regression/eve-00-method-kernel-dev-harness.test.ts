import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const routePath = "src/app/dev/method-kernel-shadow/page.tsx";
const fixturesPath = "src/features/dev/method-kernel-shadow-fixtures.ts";
const productionPagePath = "src/app/page.tsx";

function source(path: string) {
  return readFileSync(path, "utf8");
}

test("dev harness route exists and imports shadow evaluator", () => {
  const route = source(routePath);

  assert.equal(existsSync(routePath), true);
  assert.match(route, /evaluateMethodKernelShadow/);
  assert.match(route, /METHOD_KERNEL_SHADOW_FIXTURES/);
});

test("dev harness uses structured fixtures and does not import forbidden systems", () => {
  const route = source(routePath);
  const fixtures = source(fixturesPath);
  const combined = `${route}\n${fixtures}`;

  assert.match(fixtures, /completeMethodKernelFixture/);
  assert.match(fixtures, /partialMethodKernelFixture/);
  assert.match(fixtures, /missingEvidenceMethodKernelFixture/);
  assert.match(fixtures, /candidates/);
  assert.match(fixtures, /evidenceItems/);
  assert.match(fixtures, /sourceRefs/);
  assert.match(fixtures, /epistemicStatus/);

  for (const forbidden of [
    /WorkMap(?! draft crudo)/,
    /Significado/,
    /runtime-engine/,
    /Supabase/,
    /from\s+["']@\/services\/runtime-block0/,
    /from\s+["']@\/services\/work-map/,
    /from\s+["']@\/services\/significado/,
  ]) {
    assert.doesNotMatch(combined, forbidden);
  }
});

test("production page is not modified to link dev harness", () => {
  const productionPage = source(productionPagePath);

  assert.doesNotMatch(productionPage, /method-kernel-shadow/);
});

test("dev harness renders required labels and safety flags", () => {
  const route = source(routePath);

  for (const requiredText of [
    "Method Kernel Shadow",
    "DEV-ONLY HARNESS",
    "Package status",
    "Mode",
    "Runtime authority",
    "Can block user flow",
    "Can modify payload",
    "Can write registry",
    "Can trigger diagnosis",
    "User blocking disabled",
    "Payload mutation disabled",
    "Registry write disabled",
    "Diagnosis disabled",
    "Runtime gate disabled",
    "Production UI integration disabled",
    "MATCH",
    "Input trace · candidates",
    "Input trace · evidenceItems",
    "Output trace · findings",
    "Output trace · auditEvents",
    "Output trace · readinessState and safety",
    "Safety trace",
    "Esta pantalla permite revisar cómo el Method Kernel evalúa candidatos estructurales en shadow mode. No afecta al usuario final.",
  ]) {
    assert.match(route, new RegExp(requiredText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("fixtures cover complete, partial and missing evidence cases", () => {
  const fixtures = source(fixturesPath);

  assert.match(fixtures, /id: "complete"/);
  assert.match(fixtures, /expectedReadinessState: "ready"/);
  assert.match(fixtures, /label: "Caso completo válido"/);
  assert.match(fixtures, /id: "partial"/);
  assert.match(fixtures, /expectedReadinessState: "ready_with_flags"/);
  assert.match(fixtures, /label: "Caso parcial"/);
  assert.match(fixtures, /id: "missing_evidence"/);
  assert.match(fixtures, /expectedReadinessState: "blocked_by_missing_evidence"/);
  assert.match(fixtures, /label: "Caso evidencia insuficiente"/);
});

test("dev harness has no registry write or diagnosis trigger", () => {
  const combined = `${source(routePath)}\n${source(fixturesPath)}`;

  assert.doesNotMatch(combined, /writeRegistry|setRegistry|RECTOR_DOCS_REGISTRY/);
  assert.doesNotMatch(combined, /triggerDiagnosis|diagnoseEve|diagnosticPayload/);
  assert.doesNotMatch(combined, /runtimeAuthority:\s*true/);
});
