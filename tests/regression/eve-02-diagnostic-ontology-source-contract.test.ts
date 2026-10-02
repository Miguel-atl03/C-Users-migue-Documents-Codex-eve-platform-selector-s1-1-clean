import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

const packageDir = "docs/chips/diagnostic-ontology/EVE_02_Diagnostic_Ontology_v0_1";
const manifestPath = `${packageDir}/EVE_02_Diagnostic_Ontology_v0_1.manifest.json`;
const d1Path =
  "docs/chips/method-kernel/EVE_00_Method_Kernel_v0_2/sources/Fundamentals of Business Architecture Modeling.pdf";
const d2SourcesDir = "docs/chips/agent-constitution/EVE_01_Agent_Constitution_v0_1/sources";
const d4Path = "docs/runtime/EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx";
const d5Path = "docs/runtime/Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.docx";
const auditJsonPaths = [
  "docs/audits/_eve_02_diagnostic_ontology_package_inventory_v1.json",
  "docs/audits/_eve_02_diagnostic_ontology_source_existence_v1.json",
  "docs/audits/_eve_02_diagnostic_ontology_source_to_target_mapping_v1.json",
  "docs/audits/_eve_02_diagnostic_ontology_internal_consistency_v1.json",
  "docs/audits/_eve_02_diagnostic_ontology_remaining_gaps_v1.json",
  "docs/audits/_eve_02_diagnostic_ontology_compartment_inventory_v1.json",
  "docs/audits/_eve_02_diagnostic_ontology_rule_inventory_v1.json",
  "docs/audits/_eve_02_diagnostic_ontology_compartment_source_proof_matrix_v1.json",
  "docs/audits/_eve_02_diagnostic_ontology_45_rule_source_proof_matrix_v1.json",
  "docs/audits/_eve_02_diagnostic_ontology_semantic_overreach_report_v1.json",
  "docs/audits/_eve_02_diagnostic_ontology_content_qa_remaining_gaps_v1.json",
  "docs/audits/_eve_02_diagnostic_ontology_input_contract_correction_v1.json",
  "docs/audits/_eve_02_diagnostic_ontology_remaining_gaps_v2.json",
  "docs/audits/_eve_02_diagnostic_ontology_package_consistency_after_input_contract_v1.json"
];

function readJson(path: string) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function longPath(path: string) {
  const fullPath = resolve(path);
  return process.platform === "win32" && !fullPath.startsWith("\\\\?\\")
    ? `\\\\?\\${fullPath}`
    : fullPath;
}

function readPath(path: string) {
  try {
    statSync(longPath(path));
    return longPath(path);
  } catch {
    return longPath(join(d2SourcesDir, "TABLAD~1.DOC"));
  }
}

function statSize(path: string) {
  return statSync(readPath(path)).size;
}

function sha256(path: string) {
  return createHash("sha256").update(readFileSync(readPath(path))).digest("hex");
}

function resolveD2Candidate() {
  const candidates = readdirSync(longPath(d2SourcesDir))
    .filter((fileName) => fileName.toLowerCase().endsWith(".docx"))
    .map((fileName) => ({
      fileName,
      normalizedName: normalizeName(fileName),
      path: join(d2SourcesDir, fileName)
    }))
    .filter(({ normalizedName }) =>
      ["tabla", "diagnostico", "inconsistencias", "estructurales", "eve"].every((token) =>
        normalizedName.includes(token)
      )
    );

  assert.equal(candidates.length, 1, "D2 must resolve to exactly one compatible DOCX");
  return candidates[0];
}

test("rector source files D1, D2, D4 and D5 physically exist", () => {
  const d2 = resolveD2Candidate();

  for (const path of [d1Path, d2.path, d4Path, d5Path]) {
    assert.equal(existsSync(readPath(path)), true, `${path} must exist`);
    assert.ok(statSize(path) > 0, `${path} must not be empty`);
  }
});

test("D3 is not required for EVE-02 diagnostic ontology stage", () => {
  const manifest = readJson(manifestPath);

  assert.ok(manifest.compiled_sources.not_used_in_this_stage.includes("D3"));
  assert.equal(manifest.compiled_sources.primary.includes("D3"), false);
});

test("source checksums match package manifest", () => {
  const d2 = resolveD2Candidate();
  const manifest = readJson(manifestPath);

  assert.equal(sha256(d1Path), manifest.source_checksums.D1.sha256);
  assert.equal(sha256(d2.path), manifest.source_checksums.D2.sha256);
  assert.equal(sha256(d4Path), manifest.source_checksums.D4.sha256);
  assert.equal(sha256(d5Path), manifest.source_checksums.D5.sha256);
});

test("audit artifacts exist and parse", () => {
  for (const path of auditJsonPaths) {
    assert.equal(existsSync(path), true, `${path} must exist`);
    assert.doesNotThrow(() => readJson(path), `${path} must parse`);
  }
});

test("content QA artifacts protect compartment and rule coverage", () => {
  const compartmentMatrix = readJson(
    "docs/audits/_eve_02_diagnostic_ontology_compartment_source_proof_matrix_v1.json"
  );
  const ruleMatrix = readJson(
    "docs/audits/_eve_02_diagnostic_ontology_45_rule_source_proof_matrix_v1.json"
  );

  assert.equal(compartmentMatrix.summary.totalCompartments, 13);
  assert.equal(compartmentMatrix.summary.supported, 13);
  assert.equal(compartmentMatrix.summary.partial, 0);
  assert.equal(compartmentMatrix.summary.unsupported, 0);
  assert.equal(ruleMatrix.summary.totalRules, 45);
  assert.equal(ruleMatrix.summary.sourceSupportsRule_yes, 45);
  assert.equal(ruleMatrix.summary.sourceSupportsRule_partial, 0);
  assert.equal(ruleMatrix.summary.sourceSupportsRule_no, 0);
  assert.equal(ruleMatrix.summary.missingSourceRefDetected, false);
  assert.equal(ruleMatrix.summary.overreachDetected, false);
});

test("semantic overreach report keeps diagnostic boundaries closed", () => {
  const report = readJson(
    "docs/audits/_eve_02_diagnostic_ontology_semantic_overreach_report_v1.json"
  );

  assert.equal(report.diagnosticBoundaryBroken, false);
  assert.equal(report.inventedPathologyDetected, false);
  assert.equal(report.rawTextExportAllowed, false);
  assert.equal(report.registryExportProductionRealAllowed, false);
  assert.equal(report.d2MisusedForMmabpRules, false);
  assert.equal(report.d4d5UsedToRelaxD1, false);
});

test("expected living gaps are resolved after explicit input contract correction", () => {
  const gaps = readJson(
    "docs/audits/_eve_02_diagnostic_ontology_remaining_gaps_v2.json"
  );
  const resolvedGapIds = gaps.resolvedGaps.map((gap: { gapId: string }) => gap.gapId);

  assert.deepEqual(gaps.livingGaps, []);
  assert.ok(resolvedGapIds.includes("FUNCTIONAL_INPUT_CONTRACT_NAMES_NOT_EXPLICIT"));
  assert.ok(resolvedGapIds.includes("FULL_45_RULE_SOURCE_PROOF_MATRIX_NOT_CREATED"));
});
