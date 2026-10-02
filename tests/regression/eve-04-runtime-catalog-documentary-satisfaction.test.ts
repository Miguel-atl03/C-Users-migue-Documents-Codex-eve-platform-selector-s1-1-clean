import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const qaCloseoutPath = "docs/audits/CLOSEOUT_EVE_04_RUNTIME_CATALOG_RECORD_FIELD_SOURCE_QA_V1.md";
const auditJsonPaths = [
  "docs/audits/_eve_04_runtime_catalog_record_field_d6_matrix_v1.json",
  "docs/audits/_eve_04_runtime_catalog_ccov_001_trace_v1.json",
  "docs/audits/_eve_04_runtime_catalog_cvar_001_33_definitions_matrix_v1.json",
  "docs/audits/_eve_04_runtime_catalog_d8_phase3_coverage_v1.json",
  "docs/audits/_eve_04_runtime_catalog_governance_guardrails_v1.json",
  "docs/audits/_eve_04_runtime_catalog_record_field_remaining_gaps_v1.json",
  "docs/audits/_eve_04_runtime_catalog_documentary_satisfaction_matrix_v1.json"
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

test("QA artifacts exist and parse", () => {
  for (const path of auditJsonPaths) {
    assert.equal(existsSync(longPath(path)), true, `${path} must exist`);
    assert.doesNotThrow(() => readJson(path), `${path} must parse`);
  }
});

test("record-field QA dictamen is satisfactory", () => {
  const closeout = readFileSync(longPath(qaCloseoutPath), "utf8");
  assert.match(closeout, /RUNTIME_CATALOG_RECORD_FIELD_QA_SATISFACTORY/);
});

test("documentary satisfaction matrix has no fidelity gaps", () => {
  const matrix = readJson(
    "docs/audits/_eve_04_runtime_catalog_documentary_satisfaction_matrix_v1.json"
  );
  const remaining = readJson("docs/audits/_eve_04_runtime_catalog_record_field_remaining_gaps_v1.json");

  assert.equal(matrix.globalSatisfactionStatus, "satisfactory");
  assert.equal(matrix.totals.mismatches, 0);
  assert.equal(matrix.totals.missingInChip, 0);
  assert.equal(matrix.totals.missingInSource, 0);
  assert.equal(matrix.totals.pendingSourceProof, 0);
  assert.equal(matrix.totals.unsatisfactory, 0);
  assert.equal(
    matrix.documentarySatisfactionMatrix.every(
      (item: { satisfactionStatus: string }) => item.satisfactionStatus === "satisfactory"
    ),
    true
  );
  assert.deepEqual(remaining.material_fidelity_gaps, []);
});

test("CCOV-001 remains a proved controlled source coverage correction", () => {
  const ccov = readJson("docs/audits/_eve_04_runtime_catalog_ccov_001_trace_v1.json");

  assert.equal(ccov.status, "satisfactory");
  assert.equal(ccov.classification, "controlled_source_coverage_correction");
  assert.equal(ccov.source_node_exact, "B6_6_8");
  assert.equal(ccov.source_code_exact, "6.8");
  assert.equal(ccov.runtime_interaction_exact, "B6-Q38");
  assert.match(ccov.upstream_source_exact, /Bloque_6/);
  assert.equal(ccov.evidence.phase3_contains_B6_6_8, true);
  assert.equal(ccov.evidence.phase3_contains_trench_phrase, true);
  assert.equal(ccov.evidence.upstream_UP_B6_contains_6_8, true);
  assert.equal(ccov.evidence.upstream_UP_B6_contains_trench_phrase, true);
  assert.equal(ccov.evidence.d6_base_not_mutated, true);
});

test("CVAR-001 protects all 33 resolved definitions", () => {
  const cvar = readJson("docs/audits/_eve_04_runtime_catalog_cvar_001_33_definitions_matrix_v1.json");

  assert.equal(cvar.status, "satisfactory");
  assert.equal(cvar.resolved_definition_count, 33);
  assert.equal(cvar.definitions.length, 33);
  assert.equal(cvar.mismatch, 0);
  assert.equal(cvar.missing, 0);
  assert.equal(cvar.pending_source_proof, 0);
  assert.equal(
    cvar.definitions.every((item: { classification: string }) =>
      ["transduced_exact", "transduced_structured", "transduced_with_normalized_names"].includes(
        item.classification
      )
    ),
    true
  );
});

test("D8 and Phase3 coverage remains complete", () => {
  const coverage = readJson("docs/audits/_eve_04_runtime_catalog_d8_phase3_coverage_v1.json");

  assert.equal(coverage.status, "satisfactory");
  assert.equal(coverage.source_nodes_runtime_unique, 164);
  assert.equal(coverage.source_codes_runtime_unique, 164);
  assert.equal(coverage.source_nodes_covered, 164);
  assert.equal(coverage.source_codes_covered, 164);
  assert.equal(coverage.pending_source_node, 0);
  assert.equal(coverage.pending_source_code, 0);
  assert.equal(coverage.invented_source_reference, 0);
});

test("governance and methodological guardrails remain bounded", () => {
  const guardrails = readJson("docs/audits/_eve_04_runtime_catalog_governance_guardrails_v1.json");

  assert.equal(guardrails.status, "satisfactory");
  assert.equal(guardrails.D7.reduction_164_to_40_20_supported, true);
  assert.equal(guardrails.D5.no_direct_registry, true);
  assert.equal(guardrails.D5.no_IR, true);
  assert.equal(guardrails.D5.no_final_export, true);
  assert.equal(guardrails.D4.does_not_redesign_catalog, true);
  assert.equal(guardrails.D3.does_not_define_runtime_rows, true);
  assert.equal(guardrails.D1.does_not_replace_D6, true);
  assert.equal(guardrails.VSM1.no_VSM_diagnostic, true);
  assert.equal(guardrails.VSM1.no_one_to_one_S1_S5_to_MMABP_equivalence, true);
  assert.equal(guardrails.VSM1.no_closed_VSM_AHE_transduction_in_layer_1, true);
});
