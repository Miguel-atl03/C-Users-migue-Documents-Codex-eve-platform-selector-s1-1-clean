import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8").replace(/^\uFEFF/, "");
const thresholds = JSON.parse(read("src/runtime-vsm/runtime-vsm-thresholds.json"));
const service = read("src/runtime-vsm/runtime-vsm.ts");
const page = read("src/app/admin/runtime-vsm/page.tsx");

test("runtime VSM thresholds preserve semantic and temporal guardrails", () => {
  assert.equal(thresholds.baselineSince, "2026-05-19T17:23:00.000Z");
  assert.equal(thresholds.bundleCompletenessMinimum, 0.95);
  assert.equal(thresholds.block7CompletenessMinimum, 0.95);
  assert.equal(thresholds.intermediateOutputMinimum, 0.95);
  assert.equal(thresholds.provenancePresenceMinimum, 0.95);
  assert.equal(thresholds.maxMicroconfirmationsPerScene, 3);
  assert.equal(thresholds.confidenceScoreMin, 0);
  assert.equal(thresholds.confidenceScoreMax, 100);
  assert.equal(thresholds.consecutiveDeteriorationPeriods, 2);
  assert.equal(thresholds.confidenceAverageDropWarning, 5);
  assert.equal(thresholds.confidenceAverageDropMajor, 10);
});

test("dashboard models all required VSM systems and keeps S3 star separate", () => {
  for (const id of ["S1", "S2", "S3", "S3*", "S4", "S5"]) {
    assert.match(service + page, new RegExp(id.replace("*", "\\\\*")));
  }
  assert.match(service, /Auditoria independiente/);
  assert.match(service, /Control interno/);
  assert.notEqual(service.indexOf("Auditoria independiente"), service.indexOf("Control interno"));
});

test("algedonic rules cover drift, bundles, Block 7, confidence and local canon references", () => {
  for (const signal of [
    "Manifest drift",
    "Contract validation failed",
    "Bundle completeness below threshold",
    "Block 7 incomplete",
    "Invalid confidence score",
    "Local canon reference active",
    "Microconfirmation cap breached",
    "Diagnostic boundary breach",
    "Temporal drift",
  ]) {
    assert.match(service, new RegExp(signal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("dashboard exposes weekly and monthly temporal series", () => {
  assert.match(service, /trends: \{ byDay: dailySeries, weekly: weeklySeries, monthly: monthlySeries, driftSignals \}/);
  assert.match(service, /function detectTemporalDrift/);
  assert.match(page, /Weekly series/);
  assert.match(page, /Monthly series/);
  assert.match(page, /Riesgos emergentes/);
});

test("legacy v2.1 runtime catalog is retired and guarded", () => {
  assert.equal(fs.existsSync(path.join(root, "src/rules/question-catalog-v2-1.json")), false);
  assert.equal(fs.existsSync(path.join(root, "archive/legacy-runtime/question-catalog-v2-1.NO_RUNTIME_SOURCE.json")), true);
  const route = read("src/app/api/questionnaire/catalog/route.ts");
  assert.match(route, /runtimeQuestionCatalog/);
  assert.doesNotMatch(route, /question-catalog-v2-1\.json/);
  const packageJson = JSON.parse(read("package.json"));
  assert.match(packageJson.scripts["test:runtime-vsm"], /check:no-legacy-runtime-catalog/);
});

test("dashboard exposes durable audit artifacts and transducers", () => {
  const script = read("scripts/runtime-vsm-audit.mjs");
  assert.match(script, /runtime-vsm-dashboard-report\.json/);
  assert.match(script, /runtime-vsm-alerts\.json/);
  assert.match(script, /driftSignals/);
  for (const transducer of [
    "runtime manifest compilado",
    "platform consumption contract",
    "manifest loader estricto",
    "guardia anti-catalogo legacy",
    "validate-platform-against-manifest",
    "runtime-observability-audit",
    "endpoint de observabilidad",
    "series temporales VSM",
    "release ledger",
    "promotion policy",
    "runtime session repository",
    "baseline temporal post-remediacion",
  ]) {
    assert.match(service, new RegExp(transducer));
  }
});