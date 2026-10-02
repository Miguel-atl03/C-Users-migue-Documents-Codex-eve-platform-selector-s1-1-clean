import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const closeoutPath = "docs/audits/CLOSEOUT_EVE_07_PARALLEL_PRODUCTION_INTERFACE_RECORD_RULE_SOURCE_QA_V1_1.md";
const auditJsonPaths = [
  "docs/audits/_eve_07_parallel_production_interface_record_rule_source_qa_matrix_v1_1.json",
  "docs/audits/_eve_07_parallel_production_interface_documentary_satisfaction_matrix_v1_1.json",
  "docs/audits/_eve_07_parallel_production_interface_source_proof_satisfaction_matrix_v1_1.json",
  "docs/audits/_eve_07_parallel_production_interface_export_blocker_qa_v1_1.json",
  "docs/audits/_eve_07_parallel_production_interface_certification_claims_qa_v1_1.json",
  "docs/audits/_eve_07_parallel_production_interface_source_role_qa_v1_1.json",
  "docs/audits/_eve_07_parallel_production_interface_remaining_gaps_after_qa_v1_1.json",
  "docs/audits/_eve_07_parallel_production_interface_qa_file_reality_v1_1.json"
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

test("QA V1_1 artifacts exist and parse", () => {
  for (const path of auditJsonPaths) {
    assert.equal(existsSync(longPath(path)), true, `${path} must exist`);
    assert.doesNotThrow(() => readJson(path), `${path} must parse`);
  }
});

test("record-rule QA V1_1 dictamen is satisfactory", () => {
  const closeout = readFileSync(longPath(closeoutPath), "utf8");
  assert.match(closeout, /PARALLEL_PRODUCTION_INTERFACE_RECORD_RULE_QA_SATISFACTORY/);
});

test("documentary satisfaction matrix has no remaining QA gaps", () => {
  const qa = readJson("docs/audits/_eve_07_parallel_production_interface_record_rule_source_qa_matrix_v1_1.json");
  const sourceProof = readJson("docs/audits/_eve_07_parallel_production_interface_source_proof_satisfaction_matrix_v1_1.json");
  const exportBlockers = readJson("docs/audits/_eve_07_parallel_production_interface_export_blocker_qa_v1_1.json");
  const claims = readJson("docs/audits/_eve_07_parallel_production_interface_certification_claims_qa_v1_1.json");
  const sourceRole = readJson("docs/audits/_eve_07_parallel_production_interface_source_role_qa_v1_1.json");
  const remaining = readJson("docs/audits/_eve_07_parallel_production_interface_remaining_gaps_after_qa_v1_1.json");

  assert.equal(qa.dictamen, "PARALLEL_PRODUCTION_INTERFACE_RECORD_RULE_QA_SATISFACTORY");
  assert.equal(qa.summary.source_proof_matrix_rows_checked, "154/154");
  assert.equal(qa.summary.source_to_target_mappings_checked, "26/26");
  assert.equal(qa.summary.exb_blockers_checked, "34/34");
  assert.equal(qa.summary.exb_031_checked, true);
  assert.equal(qa.summary.package_export_blocker_vectors_checked, "6/6");
  assert.equal(qa.summary.certification_claims_checked, "16/16");
  assert.equal(qa.rows.length, 258);
  assert.equal(qa.summary.accepted, 258);
  assert.equal(qa.summary.rejected, 0);
  assert.equal(qa.summary.pending_source_proof, 0);
  assert.equal(qa.summary.pending_locator_precision, 0);
  assert.equal(qa.summary.source_role_mismatch, 0);
  assert.equal(qa.summary.target_missing, 0);
  assert.equal(qa.summary.source_missing, 0);
  assert.equal(qa.summary.overreach_detected, 0);
  assert.equal(qa.summary.wiring_risk_detected, 0);
  assert.equal(qa.summary.certification_claim_unverified, 0);
  assert.equal(qa.summary.materialDifference, false);

  assert.equal(sourceProof.summary.rows_checked, 154);
  assert.equal(sourceProof.summary.accepted, 154);
  assert.equal(sourceProof.summary.rejected, 0);
  assert.equal(sourceProof.summary.d1_primary_proof_rows, 0);
  assert.equal(exportBlockers.summary.exb_blockers_checked, "34/34");
  assert.equal(exportBlockers.summary.exb_031_checked, true);
  assert.equal(exportBlockers.summary.package_export_blocker_vectors_checked, "6/6");
  assert.equal(claims.summary.claims_checked, 16);
  assert.equal(claims.summary.certification_claim_unverified, 0);
  assert.equal(claims.summary.certification_report_accepted_as_final_proof, false);
  assert.equal(sourceRole.summary.source_role_mismatch, 0);
  assert.deepEqual(remaining.gaps, []);
});

test("V1 gaps remain closed in V1_1", () => {
  const qa = readJson("docs/audits/_eve_07_parallel_production_interface_record_rule_source_qa_matrix_v1_1.json");
  const remaining = readJson("docs/audits/_eve_07_parallel_production_interface_remaining_gaps_after_qa_v1_1.json");
  const claims = readJson("docs/audits/_eve_07_parallel_production_interface_certification_claims_qa_v1_1.json");
  const sourceProof = readJson("docs/audits/_eve_07_parallel_production_interface_source_proof_satisfaction_matrix_v1_1.json");
  const serialized = `${JSON.stringify(qa)}\n${JSON.stringify(remaining)}\n${JSON.stringify(claims)}\n${JSON.stringify(sourceProof)}`;

  assert.equal(qa.v1_gap_revalidation.pending_source_proof, "3 -> 0");
  assert.equal(qa.v1_gap_revalidation.pending_locator_precision, "27 -> 0");
  assert.equal(qa.v1_gap_revalidation.certification_claim_unverified, "16 -> 0");
  assert.equal(qa.v1_gap_revalidation.materialDifference, "true -> false");
  assert.equal(claims.summary.certification_report_accepted_as_final_proof, false);
  assert.equal(claims.summary.certification_claim_unverified, 0);
  assert.equal(sourceProof.summary.accepted, 154);
  assert.match(serialized, /source_proof_matrix|sourceProofMatrix/i);
  assert.match(serialized, /SHADOW_HARNESS_OUT_OF_SEQUENCE_NON_CERTIFYING|non_certifying/i);
});

test("no-overreach and no-cableado remain protected by QA artifacts", () => {
  const qa = readJson("docs/audits/_eve_07_parallel_production_interface_record_rule_source_qa_matrix_v1_1.json");
  const doc = readJson("docs/audits/_eve_07_parallel_production_interface_documentary_satisfaction_matrix_v1_1.json");
  const fileReality = readJson("docs/audits/_eve_07_parallel_production_interface_qa_file_reality_v1_1.json");
  const closeout = readFileSync(longPath(closeoutPath), "utf8");
  const serialized = `${JSON.stringify(qa)}\n${JSON.stringify(doc)}\n${JSON.stringify(fileReality)}\n${closeout}`;

  assert.match(serialized, /no Runtime productivo|active_runtime_authority/i);
  assert.match(serialized, /no WorkMap/i);
  assert.match(serialized, /no Significado/i);
  assert.match(serialized, /registry_write|registryWrite false|no registry/i);
  assert.match(serialized, /runtimeAuthority false|active_runtime_authority/i);
  assert.match(serialized, /no export|final_export_enabled/i);
  assert.match(serialized, /no Produccion Paralela real|parallel_production_enabled/i);
  assert.match(serialized, /no Supabase/i);
  assert.match(serialized, /no SQL/i);
  assert.match(serialized, /no package\.json/i);
  assert.match(serialized, /eveBrainConnection false|cerebro EVE/i);
  assert.doesNotMatch(serialized, /runtimeAuthority\s*[:=]\s*true/i);
  assert.doesNotMatch(serialized, /registryWrite\s*[:=]\s*true/i);
  assert.doesNotMatch(serialized, /productWiring\s*[:=]\s*true/i);
});
