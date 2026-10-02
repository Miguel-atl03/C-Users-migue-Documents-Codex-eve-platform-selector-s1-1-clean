import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import { DIAGNOSTIC_ONTOLOGY_SHADOW_FIXTURES } from "../../src/features/dev/diagnostic-ontology-shadow-fixtures.ts";
import { evaluateDiagnosticOntologyShadow } from "../../src/services/diagnostic-ontology-shadow-evaluator.ts";

const routePath = "src/app/dev/diagnostic-ontology-shadow/page.tsx";
const fixturesPath = "src/features/dev/diagnostic-ontology-shadow-fixtures.ts";
const productionPagePath = "src/app/page.tsx";

const REQUIRED_FIXTURE_IDS = [
  "valid_pm_moc_to_esquizofrenia_ontologica",
  "blocked_conformance_unchecked",
  "blocked_consistency_unchecked",
  "blocked_missing_evidence_refs",
  "blocked_semantic_ambiguity_sem_gate_open",
  "manual_review_multiple_compartments_low_confidence",
  "blocked_final_diagnosis_request",
  "systemic_total_missing_four_views",
  "systemic_total_valid_four_views",
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
  assert.match(route, /evaluateDiagnosticOntologyShadow/);
  assert.match(route, /DIAGNOSTIC_ONTOLOGY_SHADOW_FIXTURES/);
});

test("fixtures export required fixtureIds and structured evaluation inputs", () => {
  const fixtures = source(fixturesPath);

  for (const fixtureId of REQUIRED_FIXTURE_IDS) {
    assert.match(fixtures, new RegExp(`fixtureId: "${fixtureId}"`));
  }

  assert.match(fixtures, /DiagnosticOntologyEvaluationInput/);
  assert.match(fixtures, /inconsistency_compartment/);
  assert.match(fixtures, /involved_models/);
  assert.match(fixtures, /conformance_status/);
  assert.match(fixtures, /consistency_status/);
  assert.match(fixtures, /evidence_refs/);
  assert.match(fixtures, /source_trace/);
  assert.match(fixtures, /expectedReadinessState: "diagnostic_preclassification_candidate"/);
  assert.match(fixtures, /expectedReadinessState: "blocked_by_conformance_unchecked"/);
  assert.match(fixtures, /expectedReadinessState: "blocked_by_consistency_unchecked"/);
  assert.match(fixtures, /expectedReadinessState: "blocked_by_missing_evidence"/);
  assert.match(fixtures, /expectedReadinessState: "blocked_by_semantic_ambiguity"/);
  assert.match(fixtures, /expectedReadinessState: "manual_review_required"/);
});

test("dev harness renders required labels and trace sections", () => {
  const route = source(routePath);

  for (const requiredText of [
    "DEV-ONLY HARNESS",
    "EVE 02 Diagnostic Ontology Shadow",
    "MATCH",
    "User blocking disabled",
    "Payload mutation disabled",
    "Registry write disabled",
    "Final diagnosis disabled",
    "IR trigger disabled",
    "Export trigger disabled",
    "Production trigger disabled",
    "Runtime authority disabled",
    "diagnostic_ontology_shadow",
    "pathologyCandidate",
    "source_trace",
    "methodKernelResult",
    "agentConstitutionDecision",
    "semanticGateStatus",
    "processStateTimerGateStatus",
    "Decision output",
    "Method trace",
    "Pathology trace",
    "Findings",
    "Audit events",
    "safetyFlags",
  ]) {
    assert.match(route, new RegExp(escapeRegExp(requiredText)));
  }
});

test("dev harness uses structured fixtures and does not import forbidden systems", () => {
  const route = source(routePath);
  const fixtures = source(fixturesPath);
  const combined = `${route}\n${fixtures}`;

  for (const forbidden of [
    /WorkMap/i,
    /Significado/i,
    /runtime-engine/i,
    /Supabase/i,
    /from\s+["']@\/services\/runtime-/i,
    /from\s+["']@\/services\/work-map/i,
    /from\s+["']@\/services\/significado/i,
    /from\s+["']@\/components/i,
    /from\s+["']@\/app\/page/i,
    /from\s+["']\.\.\/\.\.\/page/i,
  ]) {
    assert.doesNotMatch(combined, forbidden);
  }
});

test("production page is not modified to link dev harness", () => {
  const productionPage = source(productionPagePath);

  assert.doesNotMatch(productionPage, /diagnostic-ontology-shadow/);
});

test("dev harness has no registry write, runtime authority true, final diagnosis or production payload", () => {
  const route = source(routePath);
  const fixtures = source(fixturesPath);
  const combined = `${route}\n${fixtures}`;

  assert.doesNotMatch(combined, /writeRegistry|setRegistry|RECTOR_DOCS_REGISTRY/);
  assert.doesNotMatch(combined, /runtimeAuthority:\s*true/);
  assert.doesNotMatch(combined, /finalDiagnosis\s*:/);
  assert.doesNotMatch(combined, /productionPayload|production_real_payload/i);
  assert.doesNotMatch(combined, /triggerProduction\s*\(|triggerExport\s*\(|triggerIR\s*\(/);
});

test("all diagnostic ontology shadow fixtures evaluate with MATCH true", () => {
  for (const fixture of DIAGNOSTIC_ONTOLOGY_SHADOW_FIXTURES) {
    const result = evaluateDiagnosticOntologyShadow(fixture.input);
    const readinessMatch = fixture.expectedReadinessState === result.readinessState;
    const pathologyMatch =
      fixture.expectedPathologyCandidate === undefined ||
      fixture.expectedPathologyCandidate === result.pathologyCandidate;
    const compartmentMatch =
      fixture.expectedCompartmentId === undefined ||
      fixture.expectedCompartmentId === result.compartmentId;
    const blockedActionsMatch = (fixture.expectedBlockedActions ?? []).every((action) =>
      result.blockedActions.includes(action),
    );

    assert.equal(
      readinessMatch && pathologyMatch && compartmentMatch && blockedActionsMatch,
      true,
      fixture.fixtureId,
    );
  }
});
