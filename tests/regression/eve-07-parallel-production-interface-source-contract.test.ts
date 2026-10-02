import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { inflateRawSync } from "node:zlib";
import test from "node:test";

type SourceDef = {
  id: string;
  role: "direct_source_contract" | "contextual_dependency" | "methodological_guard";
  path: string;
  sha256?: string;
  kind: "docx" | "xlsx" | "pdf" | "chip";
  chipJson?: string;
};

const packageJsonPath =
  "docs/chips/parallel-production-interface/EVE_07_Parallel_Production_Interface_v0_1_2_candidate/EVE_07_Parallel_Production_Interface_v0_1_2_candidate.json";
const sourceProofPath =
  "docs/chips/parallel-production-interface/EVE_07_Parallel_Production_Interface_v0_1_2_candidate/EVE_07_Parallel_Production_Interface_v0_1_2_candidate.source_proof_matrix.json";

const expectedD8Sheets = [
  "Catalogo_Madre_Nodos",
  "Source_Question_Registry",
  "Canonical_Variables",
  "Critical_Routes",
  "Readiness_Reentry_Gaps",
  "MMABP_Mapping",
  "Variables_Canonicas_Source",
  "Implementation_Dictionaries",
  "Audit_Issues"
];

const sources: SourceDef[] = [
  {
    id: "D3",
    role: "direct_source_contract",
    path: "docs/runtime/EVE_Runtime_40_20_Capa_1_0_Produccion_Paralela_Conexion_Operativa_v2.docx",
    kind: "docx"
  },
  {
    id: "D4",
    role: "direct_source_contract",
    path: "docs/runtime/EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx",
    kind: "docx"
  },
  {
    id: "D5",
    role: "direct_source_contract",
    path: "docs/runtime/Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.docx",
    kind: "docx"
  },
  {
    id: "D6",
    role: "direct_source_contract",
    path: "docs/runtime/Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
    kind: "xlsx"
  },
  {
    id: "D8",
    role: "direct_source_contract",
    path: "docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1/sources/EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx",
    sha256: "09531a66fde4c8f17e88d591ae523992a6c42d448965ef52012c2c2de7d948a2",
    kind: "xlsx"
  },
  {
    id: "EVE06",
    role: "direct_source_contract",
    path: "docs/chips/execution-engine/EVE_06_Execution_Engine_v0_1",
    chipJson: "EVE_06_Execution_Engine_v0_1.json",
    kind: "chip"
  },
  {
    id: "EVE05",
    role: "direct_source_contract",
    path: "docs/chips/gate-engine/EVE_05_Gate_Engine_v0_1",
    chipJson: "EVE_05_Gate_Engine_v0_1.json",
    kind: "chip"
  },
  {
    id: "EVE04",
    role: "direct_source_contract",
    path: "docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_2",
    chipJson: "EVE_04_Runtime_Catalog_v0_2.json",
    kind: "chip"
  },
  {
    id: "EVE03",
    role: "contextual_dependency",
    path: "docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1",
    chipJson: "EVE_03_Canonical_Catalog_v0_1.json",
    kind: "chip"
  },
  {
    id: "D7",
    role: "contextual_dependency",
    path: "docs/runtime/Arquitectura_Runtime_40_20_EVE_MMABP.docx",
    kind: "docx"
  },
  {
    id: "D1",
    role: "methodological_guard",
    path: "docs/chips/method-kernel/EVE_00_Method_Kernel_v0_2/sources/Fundamentals of Business Architecture Modeling.pdf",
    kind: "pdf"
  }
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

function workbookSheetNames(path: string) {
  const xml = readZipEntry(path, "xl/workbook.xml").toString("utf8");
  return [...xml.matchAll(/<(?:\w+:)?sheet\b[^>]*\bname="([^"]+)"/g)].map((match) => match[1]);
}

function chipJsonPath(source: SourceDef) {
  return `${source.path}/${source.chipJson}`;
}

test("rector sources physically exist and are minimally readable", () => {
  for (const source of sources) {
    assert.equal(existsSync(longPath(source.path)), true, `${source.id} must exist`);

    if (source.kind === "chip") {
      assert.ok(source.chipJson);
      assert.equal(existsSync(longPath(chipJsonPath(source))), true, `${source.id} root JSON must exist`);
      assert.doesNotThrow(() => readJson(chipJsonPath(source)));
      continue;
    }

    assert.ok(statSync(longPath(source.path)).size > 0, `${source.id} must not be empty`);

    if (source.kind === "pdf") {
      const buffer = readFileSync(longPath(source.path));
      const latin = buffer.toString("latin1");
      assert.match(buffer.subarray(0, 8).toString("ascii"), /^%PDF-/);
      assert.match(latin, /startxref/);
      assert.match(latin, /%%EOF/);
    } else if (source.kind === "docx") {
      assert.ok(extractDocxText(source.path).length > 0, `${source.id} must extract DOCX text`);
    } else {
      assert.ok(workbookSheetNames(source.path).length > 0, `${source.id} workbook must open`);
    }
  }
});

test("D8 checksum and canonical workbook sheets are stable", () => {
  const d8 = sources.find((source) => source.id === "D8");
  assert.ok(d8);
  assert.equal(sha256(d8.path), d8.sha256);

  const sheetNames = workbookSheetNames(d8.path);
  for (const sheet of expectedD8Sheets) {
    assert.equal(sheetNames.includes(sheet), true, `D8 must include ${sheet}`);
  }
});

test("source role policy remains bounded", () => {
  const pkg = readJson(packageJsonPath);
  const sourceProof = readJson(sourceProofPath);
  const policy = pkg.source_role_policy;
  const direct = new Set(sources.filter((source) => source.role === "direct_source_contract").map((source) => source.id));
  const contextual = new Set(sources.filter((source) => source.role === "contextual_dependency").map((source) => source.id));
  const guard = new Set(sources.filter((source) => source.role === "methodological_guard").map((source) => source.id));

  assert.deepEqual(policy.direct_source_contract_sources, ["D3", "D4", "D5", "D6", "D8", "EVE06", "EVE05", "EVE04"]);
  assert.deepEqual(policy.contextual_dependency_sources, ["EVE03", "D7"]);
  assert.deepEqual(policy.methodological_guard_only, ["D1"]);
  assert.equal(policy.D1_direct_proof_allowed, false);

  for (const sourceId of policy.direct_source_contract_sources) assert.equal(direct.has(sourceId), true);
  for (const sourceId of policy.contextual_dependency_sources) assert.equal(contextual.has(sourceId), true);
  for (const sourceId of policy.methodological_guard_only) assert.equal(guard.has(sourceId), true);

  const d1PrimaryProofRows = sourceProof.rows.filter((row: any) => row.primary_proof?.source_id === "D1");
  assert.deepEqual(d1PrimaryProofRows, []);
});

test("repaired source roles prevent D1/EVE03 from replacing operational proof", () => {
  const sourceProof = readJson(sourceProofPath);
  const rows = new Map(sourceProof.rows.map((row: { rule_id: string }) => [row.rule_id, row]));
  const regc006: any = rows.get("REGC-006");
  const regc011: any = rows.get("REGC-011");
  const exbe013: any = rows.get("EXBE-013");

  assert.equal(regc006.primary_proof.source_id, "D5");
  assert.equal(regc011.primary_proof.source_id, "D5");
  assert.equal(exbe013.primary_proof.source_id, "EVE05");
  assert.equal(regc006.contextual_guards?.[0]?.source_id, "D1");
  assert.equal(regc011.contextual_guards?.[0]?.source_id, "D1");
  assert.equal(exbe013.contextual_guards?.[0]?.source_id, "D1");
  assert.equal(regc006.contextual_guards?.[0]?.source_role, "methodological_guard_only");
  assert.equal(regc011.contextual_guards?.[0]?.source_role, "methodological_guard_only");
  assert.equal(exbe013.contextual_guards?.[0]?.source_role, "methodological_guard_only");

  assert.match(JSON.stringify(sourceProof), /EVE_Catalogo_Madre|D8/);
  assert.doesNotMatch(JSON.stringify([regc006, regc011, exbe013]), /EVE03.*primary_proof/i);
});

test("dependency chips are packages, not active runtime authorities", () => {
  const eve06 = readJson("docs/chips/execution-engine/EVE_06_Execution_Engine_v0_1/EVE_06_Execution_Engine_v0_1.json");
  const eve05 = readJson("docs/chips/gate-engine/EVE_05_Gate_Engine_v0_1/EVE_05_Gate_Engine_v0_1.json");
  const eve04 = readJson("docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_2/EVE_04_Runtime_Catalog_v0_2.json");

  for (const pkg of [eve06, eve05, eve04]) {
    const serialized = JSON.stringify(pkg);
    assert.equal(pkg.installation_status, "NOT_INSTALLED");
    assert.doesNotMatch(serialized, /"active_runtime_authority"\s*:\s*true|"runtimeAuthority"\s*:\s*true/i);
    assert.doesNotMatch(serialized, /"registry_write"\s*:\s*true|"registryWrite"\s*:\s*true/i);
    assert.doesNotMatch(serialized, /"product_wiring"\s*:\s*true|"productWiring"\s*:\s*true/i);
  }
});
