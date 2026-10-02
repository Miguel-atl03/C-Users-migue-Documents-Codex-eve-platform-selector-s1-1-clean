import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const packageDir = "docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1";
const manifestPath = `${packageDir}/EVE_03_Canonical_Catalog_v0_1.manifest.json`;
const d8Path = `${packageDir}/sources/EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx`;
const d7Path = "docs/runtime/Arquitectura_Runtime_40_20_EVE_MMABP.docx";
const d5Path = "docs/runtime/Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.docx";
const d6Path = "docs/runtime/Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx";
const vsm1Path = `${packageDir}/sources/Organizational Systems Managing Complexity with the Viable System model.pdf`;
const auditJsonPaths = [
  "docs/audits/_eve_03_canonical_catalog_package_staging_inventory_v0.json",
  "docs/audits/_eve_03_canonical_catalog_rector_sources_preflight_v0_1.json",
  "docs/audits/_eve_03_canonical_catalog_package_inventory_v1.json",
  "docs/audits/_eve_03_canonical_catalog_source_existence_v1.json",
  "docs/audits/_eve_03_canonical_catalog_source_units_inventory_v1.json",
  "docs/audits/_eve_03_canonical_catalog_internal_json_inventory_v1.json",
  "docs/audits/_eve_03_canonical_catalog_source_to_target_mapping_v1.json",
  "docs/audits/_eve_03_canonical_catalog_internal_consistency_v1.json",
  "docs/audits/_eve_03_canonical_catalog_remaining_gaps_v1.json",
  "docs/audits/_eve_03_canonical_catalog_sha_consistency_v1.json",
  "docs/audits/_eve_03_canonical_catalog_source_units_exhaustive_inventory_v1.json",
  "docs/audits/_eve_03_canonical_catalog_record_field_source_matrix_v1.json",
  "docs/audits/_eve_03_canonical_catalog_package_xlsx_vs_d8_diff_v1.json",
  "docs/audits/_eve_03_canonical_catalog_root_json_vs_internal_json_diff_v1.json",
  "docs/audits/_eve_03_canonical_catalog_semantic_overreach_report_v1.json",
  "docs/audits/_eve_03_canonical_catalog_record_sheet_qa_remaining_gaps_v1.json",
  "docs/audits/_eve_03_canonical_catalog_package_correction_v1.json",
  "docs/audits/_eve_03_canonical_catalog_identity_consistency_after_correction_v1.json",
  "docs/audits/_eve_03_canonical_catalog_root_json_vs_internal_json_diff_after_correction_v1.json",
  "docs/audits/_eve_03_canonical_catalog_remaining_gaps_v2.json",
  "docs/audits/_eve_03_canonical_catalog_sha_consistency_after_correction_v1.json",
  "docs/audits/_eve_03_canonical_catalog_file_reality_after_correction_v1.json"
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

function sha256(path: string) {
  return createHash("sha256").update(readFileSync(longPath(path))).digest("hex");
}

function sourceFromManifest(sourceId: string) {
  const manifest = readJson(manifestPath);
  const source = manifest.source_documents.find(
    (item: { source_id: string }) => item.source_id === sourceId
  );
  assert.ok(source, `${sourceId} must exist in manifest source_documents`);
  return source;
}

function sourceFromAudit(sourceId: string) {
  const audit = readJson("docs/audits/_eve_03_canonical_catalog_source_existence_v1.json");
  const source = audit.sources.find((item: { sourceId: string }) => item.sourceId === sourceId);
  assert.ok(source, `${sourceId} must exist in source existence audit`);
  return source;
}

test("rector source files D8, D7, D5, D6 and VSM1 physically exist", () => {
  for (const path of [d8Path, d7Path, d5Path, d6Path, vsm1Path]) {
    assert.equal(existsSync(longPath(path)), true, `${path} must exist`);
    assert.ok(statSync(longPath(path)).size > 0, `${path} must not be empty`);
  }
});

test("source checksums match manifest or audit authority", () => {
  assert.equal(sha256(d8Path), sourceFromManifest("D8").sha256);
  assert.equal(sha256(d7Path), sourceFromManifest("D7").sha256);
  assert.equal(sha256(d5Path), sourceFromManifest("D5").sha256);
  assert.equal(sha256(d6Path), sourceFromManifest("D6").sha256);

  assert.equal(sourceFromManifest("VSM1").sha256, null);
  assert.equal(sha256(vsm1Path), sourceFromAudit("VSM1").sha256);
});

test("audit artifacts exist and parse", () => {
  for (const path of auditJsonPaths) {
    assert.equal(existsSync(longPath(path)), true, `${path} must exist`);
    assert.doesNotThrow(() => readJson(path), `${path} must parse`);
  }
});

test("QA and correction dictamens are protected", () => {
  const qaGaps = readJson(
    "docs/audits/_eve_03_canonical_catalog_record_sheet_qa_remaining_gaps_v1.json"
  );
  const correction = readJson("docs/audits/_eve_03_canonical_catalog_package_correction_v1.json");
  const identity = readJson(
    "docs/audits/_eve_03_canonical_catalog_identity_consistency_after_correction_v1.json"
  );
  const rootDiff = readJson(
    "docs/audits/_eve_03_canonical_catalog_root_json_vs_internal_json_diff_after_correction_v1.json"
  );
  const remaining = readJson("docs/audits/_eve_03_canonical_catalog_remaining_gaps_v2.json");

  assert.equal(qaGaps.dictamen, "CANONICAL_CATALOG_RECORD_SHEET_QA_REQUIRES_PACKAGE_CORRECTION");
  assert.equal(correction.dictamen, "CANONICAL_CATALOG_PACKAGE_CORRECTED_READY_FOR_STATIC_TESTS");
  assert.equal(identity.not_a_prompt_top_level, true);
  assert.equal(identity.package_id_homogeneous, true);
  assert.equal(rootDiff.deepEqual, true);
  assert.ok(remaining.resolvedGaps.includes("NOT_A_PROMPT_TOP_LEVEL_MISSING"));
  assert.ok(remaining.resolvedGaps.includes("PACKAGE_ID_MINOR_MISMATCH"));
  assert.ok(remaining.resolvedGaps.includes("VSM_PREP_GUARD_DICTIONARY_KEY_MISMATCH"));
  assert.deepEqual(remaining.remainingGaps, [
    {
      gapId: "CANONICAL_VARIABLES_REFERENCED_NOT_DEFINED",
      status: "still_open_non_blocking",
      count: 33,
      correctionRequiredInThisTask: false
    }
  ]);
});

test("semantic overreach and unsafe wiring remain blocked", () => {
  const overreach = readJson(
    "docs/audits/_eve_03_canonical_catalog_semantic_overreach_report_v1.json"
  );
  const correction = readJson("docs/audits/_eve_03_canonical_catalog_package_correction_v1.json");

  assert.equal(overreach.overreachDetected, false);
  assert.equal(overreach.runtimeAuthorityDetected, false);
  assert.equal(overreach.productWiringDetected, false);
  assert.equal(overreach.vsm1OverreachDetected, false);
  assert.equal(correction.runtimeAuthority, false);
  assert.equal(correction.productWiring, false);
  assert.equal(correction.validations.no_registry_write_exact, true);
});

test("source fidelity clause remains true after correction", () => {
  const intake = readJson("docs/audits/_eve_03_canonical_catalog_source_existence_v1.json");
  const sourceUnits = readJson(
    "docs/audits/_eve_03_canonical_catalog_source_units_exhaustive_inventory_v1.json"
  );
  const mapping = readJson("docs/audits/_eve_03_canonical_catalog_record_field_source_matrix_v1.json");
  const closeout = readFileSync(
    longPath("docs/audits/CLOSEOUT_EVE_03_CANONICAL_CATALOG_PACKAGE_CORRECTION_V1.md"),
    "utf8"
  );
  const correctionGaps = readJson("docs/audits/_eve_03_canonical_catalog_remaining_gaps_v2.json");

  assert.equal(intake.sources.every((source: { exists: boolean }) => source.exists), true);
  assert.equal(
    intake.sources.every((source: { readInThisTask: boolean }) => source.readInThisTask),
    true
  );
  assert.equal(sourceUnits.inventoryLevel, "sheet_section_field");
  assert.equal(mapping.sourceToTargetMappingCreated, true);
  assert.match(closeout, /canMiguelCompareAgainstOriginal: true/);
  assert.doesNotMatch(closeout, /\bCOMPLETE\b|\bCERTIFIED\b/);
  assert.equal(correctionGaps.coverageStatus, "corrected_ready_for_static_tests");
});
