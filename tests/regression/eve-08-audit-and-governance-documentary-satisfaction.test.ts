import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const closeoutPath = "docs/audits/CLOSEOUT_EVE_08_AUDIT_AND_GOVERNANCE_RECORD_RULE_SOURCE_QA_V1_1.md";
const summaryPath = "docs/audits/_eve_08_audit_and_governance_record_rule_source_qa_summary_v1_1.json";
const auditJsonPaths = [
  "docs/audits/_eve_08_audit_and_governance_record_rule_source_qa_matrix_v1_1.json",
  "docs/audits/_eve_08_audit_and_governance_source_proof_satisfaction_matrix_v1_1.json",
  "docs/audits/_eve_08_audit_and_governance_system_state_evidence_qa_v1_1.json",
  "docs/audits/_eve_08_audit_and_governance_source_to_target_qa_v1_1.json",
  "docs/audits/_eve_08_audit_and_governance_internal_claims_qa_v1_1.json",
  "docs/audits/_eve_08_audit_and_governance_d8_contextual_gap_qa_v1_1.json",
  "docs/audits/_eve_08_audit_and_governance_source_alias_resolution_qa_v1_1.json",
  "docs/audits/_eve_08_audit_and_governance_source_role_qa_v1_1.json",
  "docs/audits/_eve_08_audit_and_governance_no_cableado_qa_v1_1.json",
  "docs/audits/_eve_08_audit_and_governance_remaining_gaps_after_qa_v1_1.json",
  "docs/audits/_eve_08_audit_and_governance_record_rule_source_qa_file_reality_v1_1.json"
];

function longPath(path: string) {
  const fullPath = resolve(path);
  return process.platform === "win32" && !fullPath.startsWith("\\\\?\\")
    ? `\\\\?\\${fullPath}`
    : fullPath;
}

function readJson(path: string) {
  return JSON.parse(readFileSync(longPath(path), "utf8"));
}

test("QA V1_1 closeout declares documentary satisfaction", () => {
  const closeout = readFileSync(longPath(closeoutPath), "utf8");
  assert.match(closeout, /AUDIT_AND_GOVERNANCE_RECORD_RULE_QA_SATISFACTORY/);
});

test("QA V1_1 summary has no remaining record-rule gaps", () => {
  const summary = readJson(summaryPath);

  assert.equal(summary.targetUnitsChecked, 250);
  assert.equal(summary.modulesChecked, 6);
  assert.equal(summary.atomicRulesChecked, 200);
  assert.equal(summary.sourceToTargetRowsChecked, 288);
  assert.equal(summary.sourceProofRowsChecked, 244);
  assert.equal(summary.systemStateEvidenceRowsChecked, 24);
  assert.equal(summary.packageDeclaredMappingsChecked, 20);
  assert.equal(summary.materialComparisonRowsChecked, 250);
  assert.equal(summary.accepted, 250);
  assert.equal(summary.rejected, 0);
  assert.equal(summary.pendingSourceProof, 0);
  assert.equal(summary.pendingLocatorPrecision, 0);
  assert.equal(summary.sourceRoleMismatch, 0);
  assert.equal(summary.sourceMissing, 0);
  assert.equal(summary.sourceUnreadable, 0);
  assert.equal(summary.hashMismatch, 0);
  assert.equal(summary.internalClaimUnverified, 0);
  assert.equal(summary.certificationClaimUnverified, 0);
  assert.equal(summary.d8ContextualGap, 0);
  assert.equal(summary.noCableadoViolation, 0);
  assert.equal(summary.materialDifference, false);
  assert.equal(summary.aliasesResolved, 50);
});

test("QA V1_1 matrices exist and parse", () => {
  for (const path of auditJsonPaths) {
    assert.equal(existsSync(longPath(path)), true, `${path} must exist`);
    assert.doesNotThrow(() => readJson(path), `${path} must parse`);
  }
});

test("matrix-level satisfaction counts are locked", () => {
  const qa = readJson("docs/audits/_eve_08_audit_and_governance_record_rule_source_qa_matrix_v1_1.json");
  const sourceProof = readJson("docs/audits/_eve_08_audit_and_governance_source_proof_satisfaction_matrix_v1_1.json");
  const systemState = readJson("docs/audits/_eve_08_audit_and_governance_system_state_evidence_qa_v1_1.json");
  const sourceToTarget = readJson("docs/audits/_eve_08_audit_and_governance_source_to_target_qa_v1_1.json");
  const internalClaims = readJson("docs/audits/_eve_08_audit_and_governance_internal_claims_qa_v1_1.json");
  const aliases = readJson("docs/audits/_eve_08_audit_and_governance_source_alias_resolution_qa_v1_1.json");
  const noCableado = readJson("docs/audits/_eve_08_audit_and_governance_no_cableado_qa_v1_1.json");
  const remaining = readJson("docs/audits/_eve_08_audit_and_governance_remaining_gaps_after_qa_v1_1.json");

  assert.equal(qa.counts.total, 250);
  assert.equal(qa.counts.accepted, 250);
  assert.equal(sourceProof.counts.total, 244);
  assert.equal(sourceProof.counts.accepted, 244);
  assert.equal(systemState.counts.total, 24);
  assert.equal(systemState.counts.accepted, 24);
  assert.equal(sourceToTarget.counts.total, 20);
  assert.equal(sourceToTarget.counts.accepted, 20);
  assert.equal(internalClaims.counts.total, 6);
  assert.equal(internalClaims.counts.verified, 6);
  assert.equal(aliases.counts.total, 50);
  assert.equal(aliases.counts.accepted, 50);
  assert.equal(noCableado.counts.noCableadoViolation, 0);
  assert.equal(remaining.blockingGaps.length, 0);
});

test("no-cableado evidence remains visible in QA artifacts", () => {
  const noCableado = readJson("docs/audits/_eve_08_audit_and_governance_no_cableado_qa_v1_1.json");
  const closeout = readFileSync(longPath(closeoutPath), "utf8");
  const serialized = `${JSON.stringify(noCableado)}\n${closeout}`;

  assert.match(serialized, /no Runtime productivo|runtimeAuthority/i);
  assert.match(serialized, /no WorkMap/i);
  assert.match(serialized, /no Significado/i);
  assert.match(serialized, /no registry|registryWrite/i);
  assert.match(serialized, /no export|finalExportEnabled/i);
  assert.match(serialized, /no Produccion Paralela real|parallelProductionEnabled/i);
  assert.match(serialized, /no Supabase|supabaseWrite/i);
  assert.match(serialized, /no SQL|sqlEnabled/i);
  assert.match(serialized, /no conexion cerebro EVE|eveBrainConnection/i);
  assert.doesNotMatch(serialized, /runtimeAuthority\s*[:=]\s*true/i);
  assert.doesNotMatch(serialized, /registryWrite\s*[:=]\s*true/i);
  assert.doesNotMatch(serialized, /productWiring\s*[:=]\s*true/i);
});
