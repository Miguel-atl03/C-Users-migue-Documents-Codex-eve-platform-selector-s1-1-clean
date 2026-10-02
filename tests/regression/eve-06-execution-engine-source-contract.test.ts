import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { inflateRawSync } from "node:zlib";
import test from "node:test";

type SourceDef = {
  id: string;
  role: "direct_rule_source" | "contextual_dependency";
  path: string;
  sha256?: string;
  kind: "docx" | "xlsx" | "pdf" | "chip";
};

const packageJsonPath =
  "docs/chips/execution-engine/EVE_06_Execution_Engine_v0_1/EVE_06_Execution_Engine_v0_1.json";
const sourceRoleQaPath = "docs/audits/_eve_06_execution_engine_source_role_qa_v1_1.json";

const d8Sheets = [
  "Version_Control",
  "Corpus_Documental",
  "Resumen_por_Bloque",
  "Catalogo_Madre_Nodos",
  "Source_Question_Registry",
  "Runtime_Classification",
  "UX_Copy_View",
  "Epistemic_Governance",
  "MMABP_Mapping",
  "Canonical_Variables",
  "Critical_Routes",
  "Trigger_Branching_Rules",
  "Readiness_Reentry_Gaps",
  "VSM_AHE_Prep",
  "Variables_Canonicas_Source",
  "Implementation_Dictionaries",
  "Audit_Issues"
];

const sources: SourceDef[] = [
  {
    id: "D4",
    role: "direct_rule_source",
    path: "docs/runtime/EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx",
    sha256: "b95256c7e32e14da82c4b623ae6b08d972cf1171ab5046564fed2ff9e6f24dd8",
    kind: "docx"
  },
  {
    id: "D6",
    role: "direct_rule_source",
    path: "docs/runtime/Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
    sha256: "5be7bd2ed510c5f54ab0490535d11685f0ae981505575fdec38de8e4cdd3b2e0",
    kind: "xlsx"
  },
  {
    id: "D5",
    role: "direct_rule_source",
    path: "docs/runtime/Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.docx",
    sha256: "fcda44fc8990ef0d19379c3425afb4a69186f6961a6f99d541d170826da1e318",
    kind: "docx"
  },
  {
    id: "D8",
    role: "direct_rule_source",
    path: "docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1/sources/EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx",
    sha256: "09531a66fde4c8f17e88d591ae523992a6c42d448965ef52012c2c2de7d948a2",
    kind: "xlsx"
  },
  {
    id: "EVE04",
    role: "direct_rule_source",
    path: "docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_2",
    kind: "chip"
  },
  {
    id: "EVE05",
    role: "direct_rule_source",
    path: "docs/chips/gate-engine/EVE_05_Gate_Engine_v0_1",
    kind: "chip"
  },
  {
    id: "EVE03",
    role: "contextual_dependency",
    path: "docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1",
    kind: "chip"
  },
  {
    id: "D7",
    role: "contextual_dependency",
    path: "docs/runtime/Arquitectura_Runtime_40_20_EVE_MMABP.docx",
    sha256: "bee5478d5ef059641707a1e513f1977fbb3f25785754f1fa4eef93ddf9d774a2",
    kind: "docx"
  },
  {
    id: "D3",
    role: "contextual_dependency",
    path: "docs/runtime/EVE_Runtime_40_20_Capa_1_0_Produccion_Paralela_Conexion_Operativa_v2.docx",
    sha256: "8b96eaa29282c042a714bbce80f0251e676425be91b766785e77c97f0c8bc31a",
    kind: "docx"
  },
  {
    id: "D1",
    role: "contextual_dependency",
    path: "docs/chips/method-kernel/EVE_00_Method_Kernel_v0_2/sources/Fundamentals of Business Architecture Modeling.pdf",
    sha256: "3dd3485afa518244cb600b4c479cad0ea11f242e88e4204b9422739ddf843147",
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

function workbookXml(path: string) {
  return readZipEntry(path, "xl/workbook.xml").toString("utf8");
}

function workbookSheetNames(path: string) {
  const xml = workbookXml(path);
  return [...xml.matchAll(/<(?:\w+:)?sheet\b[^>]*\bname="([^"]+)"/g)].map((match) => match[1]);
}

function chipJsonPath(source: SourceDef) {
  const fileNameById: Record<string, string> = {
    EVE03: "EVE_03_Canonical_Catalog_v0_1.json",
    EVE04: "EVE_04_Runtime_Catalog_v0_2.json",
    EVE05: "EVE_05_Gate_Engine_v0_1.json"
  };
  return `${source.path}/${fileNameById[source.id]}`;
}

test("rector source files physically exist and are minimally readable", () => {
  for (const source of sources) {
    assert.equal(existsSync(longPath(source.path)), true, `${source.id} must exist`);

    if (source.kind === "chip") {
      assert.equal(existsSync(longPath(chipJsonPath(source))), true, `${source.id} root JSON must exist`);
      assert.doesNotThrow(() => readJson(chipJsonPath(source)));
      continue;
    }

    assert.ok(statSync(longPath(source.path)).size > 0, `${source.id} must not be empty`);

    if (source.kind === "pdf") {
      const buffer = readFileSync(longPath(source.path));
      assert.match(buffer.subarray(0, 8).toString("ascii"), /^%PDF-/);
      assert.match(buffer.toString("latin1"), /startxref/);
      assert.match(buffer.toString("latin1"), /%%EOF\s*$/);
    } else if (source.kind === "docx") {
      assert.ok(extractDocxText(source.path).length > 0, `${source.id} must extract DOCX text`);
    } else {
      assert.match(workbookXml(source.path), /<[^>]*sheet\b/);
    }
  }
});

test("direct source checksums and D8 workbook shape are stable", () => {
  const d8 = sources.find((source) => source.id === "D8");
  assert.ok(d8);

  for (const source of sources.filter((candidate) => candidate.sha256)) {
    assert.equal(sha256(source.path), source.sha256, `${source.id} checksum must remain stable`);
  }

  const sheetNames = workbookSheetNames(d8.path);
  assert.equal(sheetNames.length, 17);
  assert.deepEqual(sheetNames, d8Sheets);
});

test("source roles remain bounded and repaired for SCR", () => {
  const pkg = readJson(packageJsonPath);
  const sourceRoleQa = readJson(sourceRoleQaPath);
  const directSources = new Set(sources.filter((source) => source.role === "direct_rule_source").map((source) => source.id));
  const contextualSources = new Set(
    sources.filter((source) => source.role === "contextual_dependency").map((source) => source.id)
  );
  const scrRefs = pkg.modules.structural_candidate_record.rules.flatMap(
    (rule: { source_refs: string[] }) => rule.source_refs
  );
  const scrRefText = scrRefs.join("\n");

  for (const source of sourceRoleQa.direct_rule_sources) {
    assert.equal(directSources.has(source.sourceId), true, `${source.sourceId} must be a direct source`);
    assert.equal(source.qaStatus, "accepted");
  }

  for (const source of sourceRoleQa.contextual_dependency_sources) {
    assert.equal(contextualSources.has(source.sourceId), true, `${source.sourceId} must be contextual`);
    assert.equal(source.qaStatus, "accepted");
  }

  assert.doesNotMatch(scrRefText, /\bD1\b/);
  assert.match(scrRefText, /\bD8!/);
  assert.equal(sourceRoleQa.D1.directProofForSCR, false);
  assert.equal(sourceRoleQa.D8.presentForSCR, true);
});

test("EVE04 and EVE05 remain candidate packages, not runtime authorities", () => {
  const eve04 = readJson("docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_2/EVE_04_Runtime_Catalog_v0_2.json");
  const eve05 = readJson("docs/chips/gate-engine/EVE_05_Gate_Engine_v0_1/EVE_05_Gate_Engine_v0_1.json");

  for (const pkg of [eve04, eve05]) {
    const serialized = JSON.stringify(pkg);
    const guardSource = pkg.installation_contract;

    assert.equal(pkg.installation_status, "NOT_INSTALLED");
    assert.doesNotMatch(serialized, /"active_runtime_authority"\s*:\s*true|"runtimeAuthority"\s*:\s*true/i);
    assert.doesNotMatch(serialized, /"registry_write"\s*:\s*true|"registryWrite"\s*:\s*true/i);
    assert.doesNotMatch(serialized, /"product_wiring"\s*:\s*true|"productWiring"\s*:\s*true/i);

    if (guardSource) {
      assert.equal(guardSource.active_runtime_authority, false);
      assert.equal(guardSource.registry_write, false);
      assert.equal(guardSource.product_wiring, false);
    }
  }
});
