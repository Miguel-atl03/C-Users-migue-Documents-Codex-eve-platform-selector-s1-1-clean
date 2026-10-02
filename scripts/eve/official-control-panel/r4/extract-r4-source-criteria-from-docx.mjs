#!/usr/bin/env node
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";

const ROOT = resolve(process.cwd());
const SOURCE = resolve(
  ROOT,
  "docs/eve/panel-control/corpus/Diseno_Panel_Control_EVE_Empresa_Cliente_Matriz_XY_Gobernanza_Experiencia_v1_0.docx",
);
const AUTHORIZED_SHA256 =
  "8d18675cfbd0f370ddba5391313d2558703266ed9d67123319dc31ffb477dff2";
const SOURCE_OUT = resolve(ROOT, "reports/local/rector-r4-r5-final/source");
const GENERATED_OUT = resolve(
  ROOT,
  "reports/local/rector-r4-acceptance/generated/r4-criteria.generated.json",
);
const TS_OUT = resolve(ROOT, "tests/e2e/r4-criteria-definitions.ts");

function sha256Buffer(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function sha256File(path) {
  return sha256Buffer(readFileSync(path));
}

function sha256Text(text) {
  return createHash("sha256").update(text.normalize("NFC"), "utf8").digest("hex");
}

function xmlText(value) {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .normalize("NFC")
    .trim();
}

function extractDocx() {
  const temp = mkdtempSync(join(tmpdir(), "r4-docx-source-"));
  try {
    const zipPath = join(temp, "source.zip");
    const out = join(temp, "unzipped");
    cpSync(SOURCE, zipPath);
    const psZip = zipPath.replaceAll("'", "''");
    const psOut = out.replaceAll("'", "''");
    execFileSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        `Expand-Archive -LiteralPath '${psZip}' -DestinationPath '${psOut}' -Force`,
      ],
      { cwd: ROOT, stdio: "pipe" },
    );
    return {
      documentXml: readFileSync(join(out, "word/document.xml"), "utf8"),
      coreXml: existsSync(join(out, "docProps/core.xml"))
        ? readFileSync(join(out, "docProps/core.xml"), "utf8")
        : "",
    };
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

function tableRows(documentXml) {
  const tables = [...documentXml.matchAll(/<w:tbl[\s\S]*?<\/w:tbl>/g)].map((match) => match[0]);
  return tables.map((table, tableIndex) => ({
    tableIndex,
    rows: [...table.matchAll(/<w:tr[\s\S]*?<\/w:tr>/g)].map((rowMatch, rowIndex) => ({
      rowIndex,
      cells: [...rowMatch[0].matchAll(/<w:tc[\s\S]*?<\/w:tc>/g)].map((cellMatch) =>
        xmlText(
          [...cellMatch[0].matchAll(/<w:t[^>]*>[\s\S]*?<\/w:t>/g)]
            .map((textMatch) => textMatch[0])
            .join(""),
        ),
      ),
    })),
  }));
}

function extractTitle(coreXml) {
  const title = coreXml.match(/<dc:title[^>]*>([\s\S]*?)<\/dc:title>/);
  return title ? xmlText(title[1]) : null;
}

function extractCriteria(documentXml) {
  const table = tableRows(documentXml).find((candidate) => {
    const text = candidate.rows.flatMap((row) => row.cells).join("\n");
    return text.includes("CP-001") && text.includes("A11Y-001");
  });
  if (!table) throw new Error("RECTOR_22_1_TABLE_NOT_FOUND_IN_DOCX");

  const criteria = [];
  for (const row of table.rows) {
    const [criterionId, literalText] = row.cells;
    if (!/^(CP-\d{3}|UX-\d{3}|SEC-001|A11Y-001)$/.test(criterionId ?? "")) continue;
    criteria.push({
      criterionId,
      literalText,
      sourceDocumentSha256: AUTHORIZED_SHA256,
      sourceSection: "§22.1",
      sourceTableIndex: table.tableIndex,
      locator: `word/document.xml:table[${table.tableIndex}]:row[${row.rowIndex}]`,
      rowIndex: row.rowIndex,
      literalTextSha256: sha256Text(literalText),
    });
  }
  if (criteria.length !== 19) {
    throw new Error(`RECTOR_22_1_EXPECTED_19_CRITERIA_FOUND_${criteria.length}`);
  }
  return criteria;
}

function writeOutputs(criteria, sourceMeta) {
  mkdirSync(SOURCE_OUT, { recursive: true });
  mkdirSync(dirname(GENERATED_OUT), { recursive: true });

  writeFileSync(
    resolve(SOURCE_OUT, "RECTOR_SOURCE_MANIFEST.json"),
    JSON.stringify(sourceMeta, null, 2) + "\n",
  );
  writeFileSync(
    resolve(SOURCE_OUT, "RECTOR_22_1_CRITERIA_EXTRACT.json"),
    JSON.stringify({ source: sourceMeta, criteria }, null, 2) + "\n",
  );
  writeFileSync(
    resolve(SOURCE_OUT, "RECTOR_22_1_CRITERIA_EXTRACT.md"),
    [
      "# Extracto rector certificado §22.1",
      "",
      `- Ruta: ${sourceMeta.path}`,
      `- SHA-256: ${sourceMeta.sha256}`,
      `- Sección: §22.1`,
      "",
      "| ID | Texto literal | Localizador | SHA-256 literal |",
      "|---|---|---|---|",
      ...criteria.map(
        (row) =>
          `| ${row.criterionId} | ${row.literalText} | ${row.locator} | ${row.literalTextSha256} |`,
      ),
      "",
    ].join("\n"),
  );

  const generatedCriteria = criteria.map((row) => ({
    criterionId: row.criterionId,
    literalText: row.literalText,
    literalTextSha256: row.literalTextSha256,
    rectorSection: row.sourceSection,
    semanticObligations: semanticObligations(row.criterionId),
    relatedFixtureIds: relatedFixtures(row.criterionId),
    rectorSource: {
      documentSha256: row.sourceDocumentSha256,
      section: row.sourceSection,
      locator: row.locator,
      literalTextSha256: row.literalTextSha256,
    },
  }));
  writeFileSync(
    GENERATED_OUT,
    JSON.stringify(
      {
        source: sourceMeta.path,
        sourceDocumentSha256: sourceMeta.sha256,
        generatedAt: new Date().toISOString(),
        criteria: generatedCriteria,
      },
      null,
      2,
    ) + "\n",
  );

  const ids = generatedCriteria
    .map((criterion) => `  | ${JSON.stringify(criterion.criterionId)}`)
    .join("\n");
  const body = generatedCriteria
    .map(
      (criterion) =>
        `  ${JSON.stringify({
          id: criterion.criterionId,
          literalText: criterion.literalText,
          literalTextSha256: criterion.literalTextSha256,
          rectorSection: criterion.rectorSection,
          semanticObligations: criterion.semanticObligations,
          relatedFixtureIds: criterion.relatedFixtureIds,
        })},`,
    )
    .join("\n");
  writeFileSync(
    TS_OUT,
    `// Generated by scripts/eve/official-control-panel/r4/extract-r4-source-criteria-from-docx.mjs\n` +
      `// Source DOCX SHA-256: ${sourceMeta.sha256}\n` +
      `export type R4CriterionId =\n${ids};\n\n` +
      `export type R4CriterionDefinition = {\n` +
      `  id: R4CriterionId;\n` +
      `  literalText: string;\n` +
      `  literalTextSha256: string;\n` +
      `  rectorSection: string;\n` +
      `  semanticObligations: string[];\n` +
      `  relatedFixtureIds: string[];\n` +
      `};\n\n` +
      `export const R4_CRITERIA: R4CriterionDefinition[] = [\n${body}\n];\n`,
  );
}

function relatedFixtures(id) {
  const map = {
    "CP-001": ["FX-01"],
    "CP-002": ["FX-01"],
    "CP-003": ["FX-01"],
    "CP-004": ["FX-01"],
    "CP-005": ["FX-08"],
    "CP-006": ["FX-08"],
    "CP-007": ["FX-02"],
    "CP-008": ["FX-02"],
    "CP-009": ["FX-04"],
    "CP-010": ["FX-07"],
    "CP-011": ["FX-05"],
    "CP-012": ["FX-09"],
    "CP-013": ["FX-10"],
    "UX-001": ["FX-11"],
    "UX-002": ["FX-11"],
    "UX-003": ["FX-11"],
    "UX-004": ["FX-11"],
    "SEC-001": ["FX-01", "FX-11"],
    "A11Y-001": ["FX-01"],
  };
  return map[id] ?? [];
}

function semanticObligations(id) {
  const map = {
    "CP-002": [
      "Demostrar X visible y operativo aunque Y no sea evaluable",
      "Demostrar Y visible y operativo aunque X no sea evaluable",
      "Comprobar ausencia de fatal global en ambos sentidos",
    ],
    "CP-006": [
      "No marcar output manual como alcanzado sin aceptación auditada",
      "Vincular artefacto enviado y artefacto aceptado",
      "Conservar actor, auditRef e historial append-only",
    ],
    "CP-012": [
      "Completar conformance antes de iniciar consistency",
      "Bloquear consistency antes de conformance completada",
      "Conservar orden temporal en ledger",
    ],
    "SEC-001": [
      "Escanear fuente frontend sin service_role ni DB directa",
      "Escanear bundle cliente construido",
      "Validar red real sin llamadas directas a rest/rpc privilegiado",
      "Probar auditor contra fixture negativo aislado",
    ],
    "A11Y-001": [
      "Inventariar estados visibles",
      "Cada estado tiene texto no vacío",
      "Cada estado tiene icono o indicador independiente de color",
      "El auditor detecta fallas controladas",
    ],
  };
  return map[id] ?? [`Demostrar materialmente el criterio ${id} con prueba positiva y negativa`];
}

const actualSha = sha256File(SOURCE);
if (actualSha !== AUTHORIZED_SHA256) {
  process.stderr.write("FUENTE RECTORA DIVERGENTE — IMPLEMENTACIÓN DETENIDA\n");
  process.stderr.write(`expected=${AUTHORIZED_SHA256}\nactual=${actualSha}\n`);
  process.exit(2);
}

const { documentXml, coreXml } = extractDocx();
const criteria = extractCriteria(documentXml);
const stat = statSync(SOURCE);
writeOutputs(criteria, {
  path: SOURCE.replace(ROOT + "\\", "").replaceAll("\\", "/"),
  absolutePath: SOURCE,
  sizeBytes: stat.size,
  sha256: actualSha,
  modifiedAt: stat.mtime.toISOString(),
  internalTitle: extractTitle(coreXml),
  sourceSection: "§22.1",
  sectionLocator: criteria[0]?.locator?.replace(/:row\[\d+\]$/, "") ?? null,
  criteriaCount: criteria.length,
});

process.stdout.write(JSON.stringify({ ok: true, sha256: actualSha, criteria: criteria.length }) + "\n");
