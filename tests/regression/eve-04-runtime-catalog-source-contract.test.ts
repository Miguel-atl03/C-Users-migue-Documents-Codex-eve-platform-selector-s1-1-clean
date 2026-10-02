import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { inflateRawSync } from "node:zlib";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const d6Path = "docs/runtime/Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx";
const d5Path = "docs/runtime/Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.docx";
const d7Path = "docs/runtime/Arquitectura_Runtime_40_20_EVE_MMABP.docx";
const d8Path =
  "docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1/sources/EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx";
const phase3Path =
  "docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1/EVE_03_Canonical_Catalog_v0_1.json";
const d4Path = "docs/runtime/EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx";
const d3Path = "docs/runtime/EVE_Runtime_40_20_Capa_1_0_Produccion_Paralela_Conexion_Operativa_v2.docx";
const d1Path =
  "docs/chips/method-kernel/EVE_00_Method_Kernel_v0_2/sources/Fundamentals of Business Architecture Modeling.pdf";
const vsm1Path =
  "docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1/sources/Organizational Systems Managing Complexity with the Viable System model.pdf";
const upstreamDir = "docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_2/sources/upstream";
const preflightPath = "docs/audits/_eve_04_runtime_catalog_rector_sources_preflight_v0_1.json";

const expectedSourceHashes: Record<string, string> = {
  D6: "5be7bd2ed510c5f54ab0490535d11685f0ae981505575fdec38de8e4cdd3b2e0",
  D5: "fcda44fc8990ef0d19379c3425afb4a69186f6961a6f99d541d170826da1e318",
  D7: "bee5478d5ef059641707a1e513f1977fbb3f25785754f1fa4eef93ddf9d774a2",
  D8: "09531a66fde4c8f17e88d591ae523992a6c42d448965ef52012c2c2de7d948a2",
  Phase3Current: "d34e9fc6fbc226641996da98fb42cc69efdd98158460bf2b7db123917d0226f7",
  D4: "b95256c7e32e14da82c4b623ae6b08d972cf1171ab5046564fed2ff9e6f24dd8",
  D3: "8b96eaa29282c042a714bbce80f0251e676425be91b766785e77c97f0c8bc31a",
  D1: "3dd3485afa518244cb600b4c479cad0ea11f242e88e4204b9422739ddf843147",
  VSM1: "00bd8009333bedf9bc5dbbd2d2ff3f295bb874066b319796744b1ef019fca418"
};

const upstreamSources = [
  ["UP_B0", "Bloque_0_Documento_Madre_Capa1_v2_1_EVE_rev4_redisenado_robusto.docx", "09705631f85c35bb58b1cb491e132eb289ac47beadccbf568dafbbc025f939db"],
  ["UP_B0_5", "Bloque_0_5_Documento_Madre_Capa1_v2_1_EVE.docx", "d8d4ee2bbf35d603e5237cd90b811ff196c9f2f48e4a51ea652f1a2161862199"],
  ["UP_B1", "Bloque_1_Documento_Madre_Capa1_v2_1_EVE.docx", "d5d92a1d38a1f1030d64a9762e59a225baed0d4293cf25a43f47a37b6b2d8319"],
  ["UP_B2", "Bloque_2_Documento_Madre_Capa1_v2_1_EVE.docx", "0e134ee7e73dbb4b5b54a833712e2d15b5f03bcaf84219a50b21ab0e7ccd38cc"],
  ["UP_B3", "Bloque_3_Documento_Madre_Capa1_v2_1_EVE_rev3_alineado.docx", "1a89cff41291ec47ff29852a4f074dd1b4095fdc3772a8b98f568dc7de921b8e"],
  ["UP_B4", "Bloque_4_Documento_Madre_Capa1_v2_1_EVE.docx", "b4dab985a18b32383fc8bb968cc41cab2781bbb50f9d53af834cb40d182d87c6"],
  ["UP_B5", "Bloque_5_Documento_Madre_Capa1_v2_1_EVE_rev3.docx", "43c1d19ec3fd4e50f769dbd60d06685176c946a6364e3010b417cffff4266488"],
  ["UP_B6", "Bloque_6_Documento_Madre_Capa1_v2_1_EVE_rev4_reconstruido.docx", "32120139abad0348c007c31b16ee38e7e18954d85a6dca8054c48c4a96732b2d"],
  ["UP_B7", "Bloque_7_Documento_Madre_Capa1_v2_1_EVE_rev4_alineado.docx", "2a81e6eaa3d7ca9c11245d1010633fb233087e22a7d05bfd678350728820b399"]
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

function readZipEntry(path: string, entryName: string) {
  const buffer = readFileSync(longPath(path));
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
  throw new Error(`${entryName} not found in ${path}`);
}

function extractDocxText(path: string) {
  const xml = readZipEntry(path, "word/document.xml").toString("utf8");
  return xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function assertXlsxOpens(path: string) {
  assert.match(readZipEntry(path, "xl/workbook.xml").toString("utf8"), /<[^>]*sheet\b/);
}

test("rector source files physically exist and are readable", () => {
  for (const path of [d6Path, d8Path]) assertXlsxOpens(path);
  for (const path of [d5Path, d7Path, d4Path, d3Path]) {
    assert.ok(extractDocxText(path).length > 0, `${path} must extract text`);
  }
  assert.doesNotThrow(() => readJson(phase3Path));

  for (const path of [d1Path, vsm1Path]) {
    assert.equal(existsSync(longPath(path)), true);
    assert.ok(statSync(longPath(path)).size > 0);
    assert.match(readFileSync(longPath(path)).subarray(0, 8).toString("ascii"), /^%PDF-/);
  }

  for (const [, fileName] of upstreamSources) {
    const path = `${upstreamDir}/${fileName}`;
    assert.ok(extractDocxText(path).length > 0, `${path} must extract text`);
  }
});

test("source checksums match declared or reconciled authority", () => {
  assert.equal(sha256(d6Path), expectedSourceHashes.D6);
  assert.equal(sha256(d5Path), expectedSourceHashes.D5);
  assert.equal(sha256(d7Path), expectedSourceHashes.D7);
  assert.equal(sha256(d8Path), expectedSourceHashes.D8);
  assert.equal(sha256(d4Path), expectedSourceHashes.D4);
  assert.equal(sha256(d3Path), expectedSourceHashes.D3);
  assert.equal(sha256(d1Path), expectedSourceHashes.D1);
  assert.equal(sha256(vsm1Path), expectedSourceHashes.VSM1);

  const preflight = readJson(preflightPath);
  assert.equal(preflight.phase3_reconciliation.phase3CurrentHashAcceptedForPreflight, true);
  assert.equal(
    preflight.phase3_reconciliation.phase3ChecksumStatus,
    "declared_hash_superseded_by_approved_phase3_correction"
  );
  assert.equal(sha256(phase3Path), expectedSourceHashes.Phase3Current);

  for (const [, fileName, hash] of upstreamSources) {
    assert.equal(sha256(`${upstreamDir}/${fileName}`), hash);
  }
});

test("source roles remain protected", () => {
  const sourceMapping = readJson(
    "docs/audits/_eve_04_runtime_catalog_source_to_target_mapping_v1.json"
  );
  const mappings = JSON.stringify(sourceMapping.mappings);

  assert.match(mappings, /D6!Runtime_Interactions_Base_40/);
  assert.match(mappings, /D6!Runtime_Interactions_Causal_20/);
  assert.match(mappings, /D6!UX_Subfield_Structure/);
  assert.match(mappings, /D6!Branching_Budget_Rules/);
  assert.match(mappings, /D6!Readiness_Gaps_Reentry/);
  assert.match(mappings, /D5 \+ D7/);
  assert.match(mappings, /D8 \+ Phase3/);
  assert.match(mappings, /D4/);
  assert.match(mappings, /D3/);
  assert.match(mappings, /D1/);
  assert.match(mappings, /VSM1/);
  assert.match(mappings, /UP_B0\.\.UP_B7/);
});
