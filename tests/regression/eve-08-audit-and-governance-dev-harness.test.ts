import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const pagePath = "src/app/dev/eve-08-audit-and-governance-shadow/page.tsx";
const harnessPath = "src/app/dev/eve-08-audit-and-governance-shadow/eve-08-audit-and-governance-shadow-harness.tsx";
const cssPath = "src/app/dev/eve-08-audit-and-governance-shadow/eve-08-audit-and-governance-shadow.css";
const createdFiles = [pagePath, harnessPath, cssPath];

const fixtureIds = [
  "resolve_audit_trail_state",
  "resolve_governance_rule_state",
  "resolve_system_state_evidence",
  "resolve_source_alias",
  "resolve_source_role",
  "validate_record_rule_source_qa",
  "validate_source_proof_satisfaction",
  "validate_system_state_evidence",
  "validate_internal_claim_boundary",
  "validate_no_circular_certification",
  "validate_d8_contextual_resolution",
  "validate_no_cableado",
  "validate_brain_connection_preconditions_blocked",
  "detect_governance_gap",
  "detect_alias_gap",
  "detect_unresolved_system_state",
  "detect_brain_connection_blocker",
  "summarize_governance_readiness",
];

test("EVE-08 dev harness visual files exist", () => {
  for (const file of createdFiles) {
    assert.equal(existsSync(file), true, file);
  }
});

test("page only renders the visual harness", () => {
  const page = readFileSync(pagePath, "utf8");

  assert.match(page, /eve-08-audit-and-governance-shadow\.css/);
  assert.match(page, /Eve08AuditAndGovernanceShadowHarness/);
  assert.doesNotMatch(page, /fetch\(/i);
  assert.doesNotMatch(page, /['"]use server['"]/i);
  assert.doesNotMatch(page, /route\.ts/i);
  assert.doesNotMatch(page, /api\//i);
  assert.doesNotMatch(page, /src\/services/i);
});

test("harness imports the pure audit and governance shadow evaluator", () => {
  const harness = readFileSync(harnessPath, "utf8");

  assert.match(harness, /evaluateAuditAndGovernanceShadow/);
  assert.match(harness, /@\/domain\/eve-audit-and-governance-shadow/);
});

test("harness fixture controls are interactive and update selected fixture state", () => {
  const harness = readFileSync(harnessPath, "utf8");

  assert.match(harness, /["']use client["']/);
  assert.match(harness, /useState/);
  assert.match(harness, /selectedFixtureId/);
  assert.match(harness, /setSelectedFixtureId/);
  assert.match(harness, /onClick=\{\(\) => setSelectedFixtureId\(fixtureId\)\}/);
  assert.match(harness, /data-fixture-id=\{fixtureId\}/);
  assert.match(harness, /aria-pressed=\{fixtureId === selectedFixtureId\}/);
  assert.match(harness, /data-selected=\{fixtureId === selectedFixtureId\}/);
  assert.match(harness, /data-selected-fixture-id=\{selectedFixtureId\}/);
  assert.match(harness, /selectedEvaluationResult/);
  assert.match(harness, /evaluateAuditAndGovernanceShadow\(selectedFixture\.input\)/);
});

test("harness exposes all 18 fixture ids", () => {
  const harness = readFileSync(harnessPath, "utf8");

  for (const fixtureId of fixtureIds) {
    assert.match(harness, new RegExp(fixtureId), fixtureId);
  }
});

test("harness includes mandatory visual click-selection cases", () => {
  const harness = readFileSync(harnessPath, "utf8");

  for (const fixtureId of [
    "resolve_audit_trail_state",
    "validate_no_circular_certification",
    "validate_d8_contextual_resolution",
    "validate_brain_connection_preconditions_blocked",
    "detect_brain_connection_blocker",
    "summarize_governance_readiness",
  ]) {
    assert.match(harness, new RegExp(fixtureId), fixtureId);
  }
});

test("harness exposes required visual safety, brain, circular and D8 fields", () => {
  const harness = readFileSync(harnessPath, "utf8");

  for (const required of [
    "runtimeAuthority",
    "canConnectEveBrain",
    "canWriteRegistry",
    "canTriggerExport",
    "canTriggerParallelProduction",
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
    "candidate not wired",
    "brainConnectionPreconditionsMet",
    "brain_connection_preconditions_blocked",
    "brain_connection_preconditions_met",
    "explicit_brain_wiring_authorization",
    "registry_write_contract",
    "rollback_plan",
    "no_cableado_release_gate",
    "human_approval",
    "connect_eve_brain",
    "blockedActions",
    "certification_report",
    "source_proof_matrix",
    "system_state_evidence_matrix",
    "circular_certification_prevented",
    "circular_certification_detected",
    "D8",
    "d8_contextual_resolved",
    "d8_contextual_unresolved",
    "d8ContextualGap",
  ]) {
    assert.match(harness, new RegExp(required), required);
  }
});

test("harness makes EVE brain connection status unequivocally blocked", () => {
  const harness = readFileSync(harnessPath, "utf8");

  assert.match(harness, /brainConnectionPreconditionsMet/);
  assert.match(harness, /brainConnectionPreconditions\.brainConnectionPreconditionsMet/);
  assert.match(harness, /canConnectEveBrain/);
  assert.match(harness, /AUDIT_GOVERNANCE_SAFETY_FLAGS\.canConnectEveBrain/);
  assert.match(harness, /brain_connection_preconditions_blocked/);
  assert.match(harness, /brain_connection_preconditions_met/);
  assert.match(harness, /connect_eve_brain/);
  assert.match(harness, /blockedActions/);
});

test("created visual files contain no productive wiring text", () => {
  const source = createdFiles.map((file) => readFileSync(file, "utf8")).join("\n");

  for (const forbidden of [
    /createClient/i,
    /@supabase/i,
    /\bsupabase\./i,
    /from\(/i,
    /insert\(/i,
    /update\(/i,
    /delete\(/i,
    /fetch\(/i,
    /route\.ts/i,
    /api\//i,
    /server action/i,
    /['"]use server['"]/i,
    /runtimeAuthority:\s*true/i,
    /canConnectEveBrain:\s*true/i,
    /canWriteRegistry:\s*true/i,
    /canTriggerExport:\s*true/i,
    /canTriggerParallelProduction:\s*true/i,
    /canExecuteSql:\s*true/i,
    /canWriteSupabase:\s*true/i,
    /registryWrite:\s*true/i,
    /productWiring:\s*true/i,
    /eveBrainConnection:\s*true/i,
    /final_export_enabled:\s*true/i,
    /parallel_production_enabled:\s*true/i,
    /diagnosis_enabled:\s*true/i,
    /sqlEnabled:\s*true/i,
    /supabaseWrite:\s*true/i,
    /\bwriteRegistry\s*\(/i,
    /\btriggerRuntime\s*\(/i,
    /\btriggerDiagnosis\s*\(/i,
    /\btriggerExport\s*\(/i,
    /\btriggerParallelProduction\s*\(/i,
    /\bexecuteSql\s*\(/i,
    /\bwriteSupabase\s*\(/i,
    /\bmutateWorkMap\s*\(/i,
    /\bmutateSignificado\s*\(/i,
    /\bSQL\b/,
  ]) {
    assert.doesNotMatch(source, forbidden);
  }
});
