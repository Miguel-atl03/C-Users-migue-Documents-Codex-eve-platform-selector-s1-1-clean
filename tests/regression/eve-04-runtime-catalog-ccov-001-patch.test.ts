import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { inflateRawSync } from "node:zlib";
import test from "node:test";

const candidateDir = "docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate";
const originalDir = "docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1";

const candidateJsonPath = `${candidateDir}/EVE_04_Runtime_Catalog_v0_1.json`;
const candidateManifestPath = `${candidateDir}/EVE_04_Runtime_Catalog_v0_1.manifest.json`;
const candidateXlsxPath = `${candidateDir}/EVE_04_Runtime_Catalog_v0_1.xlsx`;
const candidateMdPath = `${candidateDir}/EVE_04_Runtime_Catalog_v0_1.md`;
const candidateTsPath = `${candidateDir}/EVE_04_Runtime_Catalog_v0_1.ts`;
const candidateDocxPath = `${candidateDir}/EVE_04_Runtime_Catalog_v0_1.docx`;

const originalJsonPath = `${originalDir}/EVE_04_Runtime_Catalog_v0_1.json`;
const auditPath = "docs/audits/EVE_RUNTIME_CATALOG_SURGICAL_PATCH_01_APPLY_CCOV.md";
const patchDiffPath = "docs/audits/_eve_runtime_catalog_surgical_patch_01_patch_diff.json";
const candidateAuditManifestPath = "docs/audits/_eve_runtime_catalog_surgical_patch_01_candidate_manifest.json";

function readZipEntry(path: string, entryName: string) {
  const buffer = readFileSync(path);
  let offset = 0;

  while (offset < buffer.length - 30) {
    if (buffer.readUInt32LE(offset) !== 0x04034b50) {
      offset += 1;
      continue;
    }

    const method = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const fileNameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const fileName = buffer.toString("utf8", offset + 30, offset + 30 + fileNameLength);
    const dataStart = offset + 30 + fileNameLength + extraLength;
    const dataEnd = dataStart + compressedSize;

    if (fileName === entryName) {
      const data = buffer.subarray(dataStart, dataEnd);
      return method === 0 ? data : inflateRawSync(data);
    }

    offset = dataEnd;
  }

  throw new Error(`${entryName} not found`);
}

function readWorksheetXml(path: string) {
  const buffer = readFileSync(path);
  const worksheets: string[] = [];
  let offset = 0;

  while (offset < buffer.length - 30) {
    if (buffer.readUInt32LE(offset) !== 0x04034b50) {
      offset += 1;
      continue;
    }

    const method = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const fileNameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const fileName = buffer.toString("utf8", offset + 30, offset + 30 + fileNameLength);
    const dataStart = offset + 30 + fileNameLength + extraLength;
    const dataEnd = dataStart + compressedSize;

    if (fileName.startsWith("xl/worksheets/sheet") && fileName.endsWith(".xml")) {
      const data = buffer.subarray(dataStart, dataEnd);
      worksheets.push((method === 0 ? data : inflateRawSync(data)).toString("utf8"));
    }

    offset = dataEnd;
  }

  return worksheets;
}

function xlsxText(path: string) {
  return [
    readZipEntry(path, "xl/workbook.xml").toString("utf8"),
    ...readWorksheetXml(path),
  ].join("\n");
}

test("candidate package was created with the expected package files only", () => {
  for (const path of [
    candidateDocxPath,
    candidateXlsxPath,
    candidateJsonPath,
    candidateManifestPath,
    candidateMdPath,
    candidateTsPath,
  ]) {
    assert.equal(existsSync(path), true, `${path} must exist`);
  }
});

test("candidate JSON resolves CCOV-001 by mapping B6_6_8 to B6-Q38", () => {
  const candidate = JSON.parse(readFileSync(candidateJsonPath, "utf8"));
  const b6q38 = candidate.modules.runtime_interactions_base_40.find(
    (row: { runtime_interaction_id: string }) => row.runtime_interaction_id === "B6-Q38"
  );
  const coverage = candidate.support.source_node_coverage.find(
    (row: { source_node_ref_id: string }) => row.source_node_ref_id === "B6_6_8"
  );
  const ccov = candidate.flags.find((row: { flag_id: string }) => row.flag_id === "CCOV-001");
  const cvar = candidate.flags.find((row: { flag_id: string }) => row.flag_id === "CVAR-001");

  assert.equal(candidate.version, "0.1.1-candidate");
  assert.equal(candidate.status, "READY_WITH_FLAGS");
  assert.equal(candidate.certification_status, "NOT_CERTIFIED");
  assert.match(b6q38.source_nodes, /B6_6_8/);
  assert.match(b6q38.source_codes, /6\.8/);
  assert.match(b6q38.subfield_structure, /trench_phrase/);
  assert.match(b6q38.canonical_variables, /trench_phrase/);
  assert.equal(coverage.mapped_interaction_ids, "B6-Q38");
  assert.equal(coverage.mapping_count, 1);
  assert.equal(coverage.coverage_status, "mapped_by_surgical_patch_ccov_001");
  assert.equal(ccov.status, "RESOLVED_IN_CANDIDATE");
  assert.equal(cvar.status, "OPEN_PENDING_SOURCE_GAP");
  assert.equal(candidate.counts.source_nodes_mapped, 164);
  assert.equal(candidate.counts.source_nodes_unmapped, 0);
  assert.equal(candidate.counts.phase3_pending_variable_definitions, 33);
});

test("candidate XLSX carries the same CCOV-001 mapping and keeps CVAR-001 open", () => {
  const text = xlsxText(candidateXlsxPath);

  assert.match(text, /B6_6_9, B6_6_10, B6_6_11, B6_6_8/);
  assert.match(text, /6\.9, 6\.10, 6\.11, 6\.8/);
  assert.match(text, /repetitive_failure_pattern; extra_work_absorbed; compensation_primary_mechanism; trench_phrase/);
  assert.match(text, /repetitive_failure_pattern; residual_variety_absorption; compensation_primary_mechanism; trench_phrase/);
  assert.match(text, /mapped_by_surgical_patch_ccov_001/);
  assert.match(text, /RESOLVED_IN_CANDIDATE/);
  assert.match(text, /OPEN_PENDING_SOURCE_GAP/);
  assert.match(text, /164\/164; B6_6_8 mapped to B6-Q38 by CCOV-001 candidate patch\./);
});

test("candidate manifest and audit artifacts declare not wired and not certified", () => {
  const manifest = JSON.parse(readFileSync(candidateManifestPath, "utf8"));
  const patchDiff = JSON.parse(readFileSync(patchDiffPath, "utf8"));
  const auditManifest = JSON.parse(readFileSync(candidateAuditManifestPath, "utf8"));
  const audit = readFileSync(auditPath, "utf8");

  assert.equal(manifest.version, "0.1.1-candidate");
  assert.equal(manifest.certification_status, "NOT_CERTIFIED");
  assert.equal(manifest.patch_metadata.ccov_001_status, "RESOLVED_IN_CANDIDATE");
  assert.equal(manifest.patch_metadata.cvar_001_status, "OPEN_PENDING_SOURCE_GAP");
  assert.equal(patchDiff.dictamen, "PATCH_CCOV_001_READY_WITH_FLAGS");
  assert.equal(patchDiff.non_contamination.src_modified_by_patch, false);
  assert.equal(patchDiff.non_contamination.runtimeAuthority_registered, false);
  assert.equal(auditManifest.runtimeAuthority, false);
  assert.match(audit, /PATCH_CCOV_001_READY_WITH_FLAGS/);
  assert.match(audit, /CVAR-001 no fue resuelto/);
});

test("original v0.1 runtime catalog remains unpatched", () => {
  const original = JSON.parse(readFileSync(originalJsonPath, "utf8"));
  const originalB6q38 = original.modules.runtime_interactions_base_40.find(
    (row: { runtime_interaction_id: string }) => row.runtime_interaction_id === "B6-Q38"
  );
  const originalCoverage = original.support.source_node_coverage.find(
    (row: { source_node_ref_id: string }) => row.source_node_ref_id === "B6_6_8"
  );
  const originalCcov = original.flags.find((row: { flag_id: string }) => row.flag_id === "CCOV-001");

  assert.doesNotMatch(originalB6q38.source_nodes, /B6_6_8/);
  assert.doesNotMatch(originalB6q38.canonical_variables, /trench_phrase/);
  assert.equal(originalCoverage.mapping_count, 0);
  assert.equal(originalCoverage.coverage_status, "unmapped_requires_source_decision");
  assert.equal(originalCcov.status, "OPEN");
});
