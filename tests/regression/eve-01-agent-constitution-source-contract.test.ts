import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

const d1Path =
  "docs/chips/method-kernel/EVE_00_Method_Kernel_v0_2/sources/Fundamentals of Business Architecture Modeling.pdf";
const d2SourcesDir = "docs/chips/agent-constitution/EVE_01_Agent_Constitution_v0_1/sources";
const d3Path = "docs/runtime/EVE_Runtime_40_20_Capa_1_0_Produccion_Paralela_Conexion_Operativa_v2.docx";
const d4Path = "docs/runtime/EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx";
const d5Path = "docs/runtime/Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.docx";
const auditJsonPaths = [
  "docs/audits/_eve_01_agent_constitution_package_inventory_v1.json",
  "docs/audits/_eve_01_agent_constitution_source_existence_v1.json",
  "docs/audits/_eve_01_agent_constitution_source_to_target_mapping_v1.json",
  "docs/audits/_eve_01_agent_constitution_internal_consistency_v1.json",
  "docs/audits/_eve_01_agent_constitution_remaining_gaps_v1.json"
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

function statSize(path: string) {
  return statSync(longPath(path)).size;
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

function mappingFor(sourceId: string) {
  const mapping = readJson("docs/audits/_eve_01_agent_constitution_source_to_target_mapping_v1.json");
  return mapping.mappings.find((item: { sourceId: string }) => item.sourceId === sourceId);
}

test("rector source files D1-D5 physically exist", () => {
  const d2 = resolveD2Candidate();

  for (const path of [d1Path, d2.path, d3Path, d4Path, d5Path]) {
    assert.equal(existsSync(longPath(path)), true, `${path} must exist`);
    assert.ok(statSize(path) > 0, `${path} must not be empty`);
  }
});

test("D2 resolves flexibly but remains fixed inside sources folder", () => {
  const d2 = resolveD2Candidate();

  assert.equal(d2.path.replaceAll("\\", "/").startsWith(d2SourcesDir), true);
  for (const token of ["tabla", "diagnostico", "inconsistencias", "estructurales", "eve"]) {
    assert.ok(d2.normalizedName.includes(token), `${d2.fileName} must include ${token}`);
  }
});

test("source-to-target audit artifacts exist and parse", () => {
  for (const path of auditJsonPaths) {
    assert.equal(existsSync(path), true, `${path} must exist`);
    assert.doesNotThrow(() => readJson(path));
  }
});

test("minimum source-to-target mapping is protected", () => {
  const d1 = JSON.stringify(mappingFor("D1"));
  const d2 = JSON.stringify(mappingFor("D2"));
  const d3 = JSON.stringify(mappingFor("D3"));
  const d4 = JSON.stringify(mappingFor("D4"));
  const d5 = JSON.stringify(mappingFor("D5"));

  assert.match(d1, /SRC-001/);
  assert.match(d1, /MMG/);
  assert.match(d2, /SRC-002/);
  assert.match(d2, /diagnostic_boundary_rules/);
  assert.match(d3, /SRC-005/);
  assert.match(d3, /parallel_production_boundary_rules/);
  assert.match(d4, /SRC-004/);
  assert.match(d4, /evidence_epistemology_rules/);
  assert.match(d4, /runtime_behavior_rules/);
  assert.match(d4, /audit_authority_rules/);
  assert.match(d5, /SRC-003/);
  assert.match(d5, /runtime_behavior_rules/);
  assert.match(d5, /gates|QA|B7|C20|C09|Capa 1/i);
});

test("expected non-blocking gaps remain documented", () => {
  const gaps = readJson("docs/audits/_eve_01_agent_constitution_remaining_gaps_v1.json");
  const gapIds = gaps.gaps.map((gap: { gapId: string }) => gap.gapId);

  assert.ok(gapIds.includes("FULL_76_RULE_SOURCE_PROOF_MATRIX_NOT_CREATED"));
  assert.ok(gapIds.includes("MANIFEST_TOP_LEVEL_CHIP_ID_ABSENT"));
  assert.equal(gaps.noGoSignals.runtimeAuthority, false);
  assert.equal(gaps.noGoSignals.productWiring, false);
});
