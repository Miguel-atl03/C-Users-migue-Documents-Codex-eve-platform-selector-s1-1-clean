import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const cleanedCandidates = [
  path.join(process.env.TEMP || "", "eve_docx_v11_2", "cleaned.txt"),
  path.join(process.env.TEMP || "", "eve_docx_v11_3", "cleaned.txt"),
];
const cleaned = cleanedCandidates.find((p) => fs.existsSync(p));
if (!cleaned) {
  console.error("cleaned.txt not found");
  process.exit(1);
}

const lines = fs
  .readFileSync(cleaned, "utf8")
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter(Boolean);

const BASE_IDS = [
  "B0-Q01",
  "B0-Q02",
  "B0-Q03",
  "B0-Q04",
  "B05-Q05",
  "B05-Q06",
  "B05-Q07",
  "B1-Q08",
  "B1-Q09",
  "B1-Q10",
  "B1-Q11",
  "B2-Q12",
  "B2-Q13",
  "B2-Q14",
  "B2-Q15",
  "B2-Q16",
  "B2-Q17",
  "B3-Q18",
  "B3-Q19",
  "B3-Q20",
  "B3-Q21",
  "B3-Q22",
  "B4-Q23",
  "B4-Q24",
  "B4-Q25",
  "B4-Q26",
  "B4-Q27",
  "B4-Q28",
  "B5-Q29",
  "B5-Q30",
  "B5-Q31",
  "B5-Q32",
  "B5-Q33",
  "B6-Q34",
  "B6-Q35",
  "B6-Q36",
  "B6-Q37",
  "B6-Q38",
  "B7-Q39",
  "B7-Q40",
];

const CAUSAL_IDS = Array.from(
  { length: 20 },
  (_, i) => `C${String(i + 1).padStart(2, "0")}`,
);

function parseBase() {
  const start = lines.findIndex((l) => /Anexo A\. Matriz Base/i.test(l));
  const rows = [];
  for (let i = 0; i < BASE_IDS.length; i++) {
    const id = BASE_IDS[i];
    const idx = lines.findIndex((l, j) => j > start && l === id);
    if (idx < 0) throw new Error(`missing base ${id}`);
    const nextId = BASE_IDS[i + 1];
    let end = nextId
      ? lines.findIndex((l, j) => j > idx && l === nextId)
      : lines.length;
    if (end < 0) end = Math.min(idx + 8, lines.length);
    const chunk = lines.slice(idx + 1, end);
    rows.push({
      id,
      sourceNodes: (chunk[0] || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      catalogSelectionReason: chunk[2] || null,
      mandatoryClosureRule: chunk[3] || null,
      failureBlockRule: chunk[4] || null,
      reviewActionLabel: chunk[5] || null,
      functionLabel: chunk[6] || id,
    });
  }
  return rows;
}

function priorityFromGroup(text) {
  if (/^P0/i.test(text)) return "P0";
  if (/^P1/i.test(text)) return "P1";
  if (/^P2/i.test(text)) return "P2";
  if (/^P3/i.test(text)) return "P3";
  return "P3";
}

function parseCausal() {
  const start = lines.findIndex((l) => l === "C01");
  if (start < 0) throw new Error("C01 not found");
  const rows = [];
  for (let i = 0; i < CAUSAL_IDS.length; i++) {
    const id = CAUSAL_IDS[i];
    const idx = lines.findIndex((l, j) => j >= start && l === id);
    if (idx < 0) throw new Error(`missing causal ${id}`);
    const nextId = CAUSAL_IDS[i + 1];
    let end = nextId
      ? lines.findIndex((l, j) => j > idx && l === nextId)
      : Math.min(idx + 10, lines.length);
    if (end < 0) end = Math.min(idx + 8, lines.length);
    const chunk = lines.slice(idx + 1, end);
    // Typical: priorityGroup, activationCondition, catalogReason, closureTarget, failure, blocksReady
    const priorityGroup = chunk[0] || "";
    const blocksRaw = (chunk[5] || chunk[chunk.length - 1] || "").toLowerCase();
    rows.push({
      id,
      priority: priorityFromGroup(priorityGroup),
      classLabel: priorityGroup,
      activationRule: chunk[1] || null,
      catalogSelectionReason: chunk[2] || null,
      mandatoryClosureRule: chunk[3] || null,
      failureBlockRule: chunk[4] || null,
      blocksFullReadiness:
        blocksRaw.includes("sí") ||
        blocksRaw.includes("si ") ||
        blocksRaw.startsWith("sí") ||
        blocksRaw === "sí" ||
        /^s[ií]/i.test(blocksRaw.trim()),
    });
  }
  return rows;
}

const base = parseBase();
const causal = parseCausal();
console.log("base", base.length, "causal", causal.length);
console.log("C05", causal.find((r) => r.id === "C05"));

const outDir = path.join(
  root,
  "src/services/eve/official-control-panel/catalogs",
);
fs.mkdirSync(outDir, { recursive: true });

function esc(s) {
  if (s == null) return "null";
  return JSON.stringify(s);
}

const baseTs = `/**
 * Catálogo de presentación Matriz Base 40 — complemento v1.1 Anexo A.
 * IDs canónicos alineados con BASE40_BASE_IDS. Sin columna Bloque.
 */

export type RuntimeBaseCatalogEntry = {
  id: string;
  displayId: string;
  sourceNodes: readonly string[];
  catalogSelectionReason: string | null;
  mandatoryClosureRule: string | null;
  failureBlockRule: string | null;
  reviewActionLabel: string | null;
  functionLabel: string;
};

function displayIdFor(id: string): string {
  if (id.startsWith("B05-")) return id.replace(/^B05-/, "B0.5-");
  return id;
}

export const RUNTIME_BASE_MATRIX_CATALOG: readonly RuntimeBaseCatalogEntry[] = [
${base
  .map(
    (r) => `  {
    id: ${esc(r.id)},
    displayId: displayIdFor(${esc(r.id)}),
    sourceNodes: ${JSON.stringify(r.sourceNodes)} as const,
    catalogSelectionReason: ${esc(r.catalogSelectionReason)},
    mandatoryClosureRule: ${esc(r.mandatoryClosureRule)},
    failureBlockRule: ${esc(r.failureBlockRule)},
    reviewActionLabel: ${esc(r.reviewActionLabel)},
    functionLabel: ${esc(r.functionLabel)},
  }`,
  )
  .join(",\n")}
] as const;

export function getRuntimeBaseCatalogEntry(id: string): RuntimeBaseCatalogEntry | null {
  return RUNTIME_BASE_MATRIX_CATALOG.find((row) => row.id === id) ?? null;
}
`;

const causalTs = `/**
 * Catálogo de presentación Matriz Causal 20 — complemento v1.1.
 * IDs canónicos alineados con CAUSAL20_IDS.
 */

export type RuntimeCausalPriority = "P0" | "P1" | "P2" | "P3";

export type RuntimeCausalCatalogEntry = {
  id: string;
  priority: RuntimeCausalPriority;
  classLabel: string;
  activationRule: string | null;
  catalogSelectionReason: string | null;
  mandatoryClosureRule: string | null;
  failureBlockRule: string | null;
  blocksFullReadiness: boolean;
};

export const RUNTIME_CAUSAL_MATRIX_CATALOG: readonly RuntimeCausalCatalogEntry[] = [
${causal
  .map(
    (r) => `  {
    id: ${esc(r.id)},
    priority: ${esc(r.priority)},
    classLabel: ${esc(r.classLabel)},
    activationRule: ${esc(r.activationRule)},
    catalogSelectionReason: ${esc(r.catalogSelectionReason)},
    mandatoryClosureRule: ${esc(r.mandatoryClosureRule)},
    failureBlockRule: ${esc(r.failureBlockRule)},
    blocksFullReadiness: ${r.blocksFullReadiness},
  }`,
  )
  .join(",\n")}
] as const;

export function getRuntimeCausalCatalogEntry(
  id: string,
): RuntimeCausalCatalogEntry | null {
  return RUNTIME_CAUSAL_MATRIX_CATALOG.find((row) => row.id === id) ?? null;
}
`;

fs.writeFileSync(path.join(outDir, "runtime-base-matrix.catalog.ts"), baseTs);
fs.writeFileSync(path.join(outDir, "runtime-causal-matrix.catalog.ts"), causalTs);
console.log("wrote catalogs to", outDir);
