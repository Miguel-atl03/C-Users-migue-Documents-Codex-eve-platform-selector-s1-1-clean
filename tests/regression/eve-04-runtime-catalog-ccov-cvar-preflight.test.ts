import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { inflateRawSync } from "node:zlib";
import test from "node:test";

const motherPath =
  "docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1/sources/EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx";
const runtimeXlsxPath = "docs/runtime/Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx";
const preflightPath = "docs/audits/EVE_RUNTIME_CATALOG_SURGICAL_PATCH_01_PREFLIGHT.md";
const cvarMatrixPath = "docs/audits/_eve_runtime_catalog_surgical_patch_01_cvar_matrix.json";
const sourceMatrixPath = "docs/audits/_eve_runtime_catalog_surgical_patch_01_source_matrix.json";
const ccovOptionsPath = "docs/audits/_eve_runtime_catalog_surgical_patch_01_ccov_mapping_options.json";
const candidateJsonPath =
  "docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1.json";
const candidateManifestPath =
  "docs/audits/_eve_runtime_catalog_surgical_patch_01_candidate_manifest.json";

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

function xlsxText(path: string) {
  const workbook = readZipEntry(path, "xl/workbook.xml").toString("utf8");
  const sharedStrings = (() => {
    try {
      return readZipEntry(path, "xl/sharedStrings.xml").toString("utf8");
    } catch {
      return "";
    }
  })();

  const worksheets = readWorksheetXml(path).join("\n");

  return `${workbook}\n${sharedStrings}\n${worksheets}`;
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

test("required source workbooks and preflight artifacts exist", () => {
  for (const path of [motherPath, runtimeXlsxPath, preflightPath, cvarMatrixPath, sourceMatrixPath, ccovOptionsPath]) {
    assert.equal(existsSync(path), true, `${path} must exist`);
  }
});

test("mother catalog contains B6_6_8 and trench_phrase evidence", () => {
  const text = xlsxText(motherPath);

  assert.match(text, /B6_6_8/);
  assert.match(text, /trench_phrase/);
});

test("preflight report and CVAR matrix parse and preserve expected counts", () => {
  const preflight = readFileSync(preflightPath, "utf8");
  const cvar = JSON.parse(readFileSync(cvarMatrixPath, "utf8")) as {
    count: number;
    expectedCount: number;
    matrix: Array<{ variable_name: string }>;
  };
  const ccov = JSON.parse(readFileSync(ccovOptionsPath, "utf8")) as { recommendedOption: string };

  assert.match(preflight, /PATCH_PREFLIGHT_READY/);
  assert.equal(cvar.count, 33);
  assert.equal(cvar.expectedCount, 33);
  assert.equal(cvar.matrix.length, 33);
  assert.equal(ccov.recommendedOption, "B");
});

test("audit-only patch does not declare product mutation", () => {
  const preflight = readFileSync(preflightPath, "utf8");

  assert.match(preflight, /No se modifico src\/app/);
  assert.match(preflight, /package\.json/);
  assert.doesNotMatch(preflight, /Produccion Paralela conectada|runtimeAuthority true|registry write/i);
});

test("CCOV-001 candidate exists without resolving CVAR-001", () => {
  assert.equal(existsSync(candidateJsonPath), true, `${candidateJsonPath} must exist`);
  assert.equal(existsSync(candidateManifestPath), true, `${candidateManifestPath} must exist`);

  const candidate = JSON.parse(readFileSync(candidateJsonPath, "utf8"));
  const manifest = JSON.parse(readFileSync(candidateManifestPath, "utf8"));
  const ccov = candidate.flags.find((row: { flag_id: string }) => row.flag_id === "CCOV-001");
  const cvar = candidate.flags.find((row: { flag_id: string }) => row.flag_id === "CVAR-001");

  assert.equal(candidate.version, "0.1.1-candidate");
  assert.equal(candidate.counts.source_nodes_mapped, 164);
  assert.equal(candidate.counts.source_nodes_unmapped, 0);
  assert.equal(ccov.status, "RESOLVED_IN_CANDIDATE");
  assert.equal(cvar.status, "OPEN_PENDING_SOURCE_GAP");
  assert.equal(candidate.counts.phase3_pending_variable_definitions, 33);
  assert.equal(manifest.dictamen, "PATCH_CCOV_001_READY_WITH_FLAGS");
});
