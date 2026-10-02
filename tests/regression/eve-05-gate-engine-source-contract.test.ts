import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { inflateRawSync } from "node:zlib";
import test from "node:test";

type SourceDef = {
  id: string;
  role: RegExp;
  candidates: string[];
  sha256: string;
  kind: "docx" | "xlsx" | "pdf";
};

const sources: SourceDef[] = [
  {
    id: "D1",
    role: /MMABP PM\/MoC\/PF\/OLC|D1 debe validarse contra reglas MMABP/i,
    candidates: [
      "docs/chips/method-kernel/EVE_00_Method_Kernel_v0_2/sources/Fundamentals of Business Architecture Modeling.pdf"
    ],
    sha256: "3dd3485afa518244cb600b4c479cad0ea11f242e88e4204b9422739ddf843147",
    kind: "pdf"
  },
  {
    id: "D2",
    role: /inconsistency compartments|diagnostic ontology/i,
    candidates: [
      "docs/chips/agent-constitution/EVE_01_Agent_Constitution_v0_1/sources/Tabla de Diagnostico de Inconsistencias Estructurales EVE.docx",
      "docs/chips/agent-constitution/EVE_01_Agent_Constitution_v0_1/sources/TABLAD~1.DOC"
    ],
    sha256: "3e5f5278872c5790b81931c6c765b4633139a348c0489d26599885997b12f0ca",
    kind: "docx"
  },
  {
    id: "D3",
    role: /frontera downstream/i,
    candidates: ["docs/runtime/EVE_Runtime_40_20_Capa_1_0_Produccion_Paralela_Conexion_Operativa_v2.docx"],
    sha256: "8b96eaa29282c042a714bbce80f0251e676425be91b766785e77c97f0c8bc31a",
    kind: "docx"
  },
  {
    id: "D4",
    role: /technical gate contract|contrato tecnico/i,
    candidates: ["docs/runtime/EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx"],
    sha256: "b95256c7e32e14da82c4b623ae6b08d972cf1171ab5046564fed2ff9e6f24dd8",
    kind: "docx"
  },
  {
    id: "D5",
    role: /runtime governance|gates|fronteras/i,
    candidates: ["docs/runtime/Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.docx"],
    sha256: "fcda44fc8990ef0d19379c3425afb4a69186f6961a6f99d541d170826da1e318",
    kind: "docx"
  },
  {
    id: "D6",
    role: /Critical_Routes|Semantic_Resolution_Gates|Process_State_Timer_Gates/i,
    candidates: ["docs/runtime/Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx"],
    sha256: "5be7bd2ed510c5f54ab0490535d11685f0ae981505575fdec38de8e4cdd3b2e0",
    kind: "xlsx"
  },
  {
    id: "D7",
    role: /architecture 40\+20|Arquitectura_Runtime/i,
    candidates: ["docs/runtime/Arquitectura_Runtime_40_20_EVE_MMABP.docx"],
    sha256: "bee5478d5ef059641707a1e513f1977fbb3f25785754f1fa4eef93ddf9d774a2",
    kind: "docx"
  },
  {
    id: "D8",
    role: /canonical genealogy|Catalogo_Madre_Nodos|MMABP_Mapping/i,
    candidates: [
      "docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1/sources/EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx",
      "docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1/sources/EVE_CA~1.XLS"
    ],
    sha256: "09531a66fde4c8f17e88d591ae523992a6c42d448965ef52012c2c2de7d948a2",
    kind: "xlsx"
  },
  {
    id: "VSM1",
    role: /methodological_guard_vsm|VSM1.*guardia metodologica|VSM identity/i,
    candidates: [
      "docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1/sources/Organizational Systems Managing Complexity with the Viable System model.pdf",
      "docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1/sources/ORGANI~1.PDF"
    ],
    sha256: "00bd8009333bedf9bc5dbbd2d2ff3f295bb874066b319796744b1ef019fca418",
    kind: "pdf"
  },
  {
    id: "AHE1",
    role: /interpretive_guard_ahe|AHE1.*guardia interpretativa|AHE observation/i,
    candidates: [
      "docs/chips/gate-engine/EVE_05_Gate_Engine_v0_1/sources/Marco de Interpretacion y Observacion Explicativo Arquitectura Humana Empresarial_(AHE).docx",
      "docs/chips/gate-engine/EVE_05_Gate_Engine_v0_1/sources/MARCOD~1.DOC"
    ],
    sha256: "8f7e729d77429c6179403220dd1dd111f85a615ff8b9ffbafb675e702744cb7e",
    kind: "docx"
  }
];

function longPath(path: string) {
  const fullPath = resolve(path);
  return process.platform === "win32" && !fullPath.startsWith("\\\\?\\")
    ? `\\\\?\\${fullPath}`
    : fullPath;
}

function resolveExistingPath(candidates: string[]) {
  const found = candidates.find((candidate) => existsSync(longPath(candidate)));
  assert.ok(found, `one of these source paths must exist: ${candidates.join(", ")}`);
  return found;
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
  for (const source of sources) {
    const path = resolveExistingPath(source.candidates);
    assert.ok(statSync(longPath(path)).size > 0, `${source.id} must not be empty`);

    if (source.kind === "pdf") {
      assert.match(readFileSync(longPath(path)).subarray(0, 8).toString("ascii"), /^%PDF-/);
    } else if (source.kind === "docx") {
      assert.ok(extractDocxText(path).length > 0, `${source.id} must extract DOCX text`);
    } else {
      assertXlsxOpens(path);
    }
  }
});

test("source checksums match rector preflight V0_1 declarations", () => {
  for (const source of sources) {
    const path = resolveExistingPath(source.candidates);
    assert.equal(sha256(path), source.sha256, `${source.id} checksum must remain stable`);
  }
});

test("source roles remain protected", () => {
  const sourceToTarget = readFileSync(
    longPath("docs/audits/_eve_05_gate_engine_source_to_target_mapping_v1.json"),
    "utf8"
  );
  const closeout = readFileSync(
    longPath("docs/audits/CLOSEOUT_EVE_05_GATE_ENGINE_PACKAGE_INTAKE_SOURCE_AUDIT_V1.md"),
    "utf8"
  );
  const roleText = `${sourceToTarget}\n${closeout}`;

  for (const source of sources) {
    assert.match(roleText, new RegExp(`\\b${source.id}\\b`, "i"));
    assert.match(roleText, source.role, `${source.id} role must remain bounded`);
  }
});
