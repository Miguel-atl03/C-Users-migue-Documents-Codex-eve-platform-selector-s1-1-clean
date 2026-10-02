import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const closeoutPath = "docs/audits/CLOSEOUT_EVE_06_EXECUTION_ENGINE_RECORD_RULE_SOURCE_QA_V1_1.md";
const auditJsonPaths = [
  "docs/audits/_eve_06_execution_engine_record_rule_source_qa_matrix_v1_1.json",
  "docs/audits/_eve_06_execution_engine_documentary_satisfaction_matrix_v1_1.json",
  "docs/audits/_eve_06_execution_engine_atomic_rules_satisfaction_matrix_v1_1.json",
  "docs/audits/_eve_06_execution_engine_source_role_qa_v1_1.json",
  "docs/audits/_eve_06_execution_engine_remaining_gaps_after_qa_v1_1.json",
  "docs/audits/_eve_06_execution_engine_qa_file_reality_v1_1.json"
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
  assert.match(closeout, /EXECUTION_ENGINE_RECORD_RULE_QA_SATISFACTORY/);
});

test("documentary satisfaction matrix has no remaining fidelity gaps", () => {
  const qa = readJson("docs/audits/_eve_06_execution_engine_record_rule_source_qa_matrix_v1_1.json");
  const doc = readJson("docs/audits/_eve_06_execution_engine_documentary_satisfaction_matrix_v1_1.json");
  const atomic = readJson("docs/audits/_eve_06_execution_engine_atomic_rules_satisfaction_matrix_v1_1.json");
  const sourceRole = readJson("docs/audits/_eve_06_execution_engine_source_role_qa_v1_1.json");
  const remaining = readJson("docs/audits/_eve_06_execution_engine_remaining_gaps_after_qa_v1_1.json");

  assert.equal(qa.dictamen, "EXECUTION_ENGINE_RECORD_RULE_QA_SATISFACTORY");
  assert.equal(doc.dictamen, "EXECUTION_ENGINE_RECORD_RULE_QA_SATISFACTORY");
  assert.equal(doc.coverageStatus, "satisfactory");
  assert.equal(qa.coverage.modules_checked, 6);
  assert.equal(qa.coverage.atomic_rules_checked, 135);
  assert.equal(qa.coverage.failure_guards_checked, 18);
  assert.equal(qa.coverage.integration_rules_checked, 14);
  assert.equal(qa.coverage.source_to_target_mappings_checked, 20);
  assert.equal(qa.coverage.qa_controls_checked, 22);
  assert.equal(qa.coverage.schema_fields_checked, 54);
  assert.equal(qa.result.accepted, 310);
  assert.equal(qa.result.rejected, 0);
  assert.equal(qa.result.pending_source_proof, 0);
  assert.equal(qa.result.pending_locator_precision, 0);
  assert.equal(qa.result.source_role_mismatch, 0);
  assert.equal(qa.result.source_missing, 0);
  assert.equal(qa.result.wiring_risk_detected, 0);
  assert.equal(qa.result.materialDifference, false);

  assert.equal(atomic.atomic_rules_checked, 135);
  assert.equal(atomic.summary.accepted, 135);
  assert.equal(atomic.summary.rejected, 0);
  assert.equal(sourceRole.D1.directProofForSCR, false);
  assert.equal(sourceRole.D8.presentForSCR, true);
  assert.deepEqual(sourceRole.violations, []);
  assert.equal(remaining.noMaterialFidelityGaps, true);
  assert.deepEqual(remaining.gaps, []);
});

test("V1 gaps remain closed in V1_1", () => {
  const qa = readJson("docs/audits/_eve_06_execution_engine_record_rule_source_qa_matrix_v1_1.json");
  const remaining = readJson("docs/audits/_eve_06_execution_engine_remaining_gaps_after_qa_v1_1.json");

  assert.equal(qa.v1Revalidation.pending_source_proof, "76 -> 0");
  assert.equal(qa.v1Revalidation.pending_locator_precision, "180 -> 0");
  assert.equal(qa.v1Revalidation.source_role_mismatch, "7 -> 0");
  assert.equal(qa.v1Revalidation.source_missing, "1 -> 0");
  assert.equal(qa.v1Revalidation.materialDifference, "true -> false");
  assert.match(qa.v1Revalidation.D1_SCR, /D1 removed as direct proof/i);
  assert.match(qa.v1Revalidation.D8_SCR, /D8 present in SCR/i);
  assert.match(qa.v1Revalidation.STM6_016, /evidence_item/);
  assert.match(qa.v1Revalidation.STM6_016, /canonical_variable_record/);
  assert.match(qa.v1Revalidation.STM6_016, /structural_candidate_record/);
  assert.equal(remaining.currentGapCounts.pending_source_proof, 0);
  assert.equal(remaining.currentGapCounts.pending_locator_precision, 0);
  assert.equal(remaining.currentGapCounts.source_role_mismatch, 0);
  assert.equal(remaining.currentGapCounts.source_missing, 0);
  assert.equal(remaining.currentGapCounts.materialDifference, false);
});

test("no-overreach and no-cableado remain protected by QA artifacts", () => {
  const qa = readJson("docs/audits/_eve_06_execution_engine_record_rule_source_qa_matrix_v1_1.json");
  const doc = readJson("docs/audits/_eve_06_execution_engine_documentary_satisfaction_matrix_v1_1.json");
  const fileReality = readJson("docs/audits/_eve_06_execution_engine_qa_file_reality_v1_1.json");
  const closeout = readFileSync(longPath(closeoutPath), "utf8");
  const serialized = `${JSON.stringify(qa)}\n${JSON.stringify(doc)}\n${JSON.stringify(fileReality)}\n${closeout}`;

  assert.match(serialized, /no Runtime productivo|noRuntimeProductivo/i);
  assert.match(serialized, /no WorkMap|noWorkMap/i);
  assert.match(serialized, /no Significado|noSignificado/i);
  assert.match(serialized, /registryWrite false|registry_write/i);
  assert.match(serialized, /runtimeAuthority false|active_runtime_authority/i);
  assert.match(serialized, /no Supabase|noSupabase/i);
  assert.match(serialized, /no SQL|noSQL/i);
  assert.match(serialized, /no package\.json|noPackageJsonTouched/i);
  assert.match(serialized, /eveBrainConnection false|no conexion cerebro EVE/i);
  assert.doesNotMatch(serialized, /runtimeAuthority\s*[:=]\s*true/i);
  assert.doesNotMatch(serialized, /registryWrite\s*[:=]\s*true/i);
  assert.doesNotMatch(serialized, /productWiring\s*[:=]\s*true/i);
});
