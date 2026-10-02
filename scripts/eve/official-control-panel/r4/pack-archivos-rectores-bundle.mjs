import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const corpusDir = join(root, "docs/eve/panel-control/corpus");
const destName = "archivos_rectores_panel_control_corpus_bundle.zip";
const dest = join(process.env.USERPROFILE || process.env.HOME || root, "Downloads", destName);
const staging = join(process.env.TEMP || "/tmp", "archivos_rectores_corpus_staging");

const skip = new Set([
  "Diseno_Panel_Control_EVE_Empresa_Cliente_Matriz_XY_Gobernanza_Experiencia_v1_0.docx.tmp.zip",
]);

const files = [];
for (const name of readdirSync(corpusDir)) {
  if (skip.has(name)) continue;
  const full = join(corpusDir, name);
  try {
    if (statSync(full).isFile() && statSync(full).size > 0) {
      files.push({ abs: full, rel: `corpus/${name}` });
    }
  } catch {
    /* ignore unreadable */
  }
}

// Autoridades metodológicas adicionales referenciadas por CORPUS_MANIFEST (CP-012)
const extras = [
  {
    abs: join(
      root,
      "docs/chips/method-kernel/EVE_00_Method_Kernel_v0_2/sources/Fundamentals of Business Architecture Modeling.pdf",
    ),
    rel: "method-kernel/Fundamentals of Business Architecture Modeling.pdf",
  },
  {
    abs: join(root, "AGENTS.md"),
    rel: "repo/AGENTS.md",
  },
  {
    abs: join(root, "docs/eve/panel-control/RECTOR_R4_ACCEPTANCE_BASELINE.md"),
    rel: "rector-r4/RECTOR_R4_ACCEPTANCE_BASELINE.md",
  },
];

for (const item of extras) {
  if (existsSync(item.abs) && statSync(item.abs).size > 0) {
    files.push(item);
  }
}

if (files.length === 0) {
  console.error(JSON.stringify({ error: "no_rector_files_found" }));
  process.exit(1);
}

rmSync(staging, { recursive: true, force: true });
mkdirSync(join(staging, "corpus"), { recursive: true });
mkdirSync(join(staging, "method-kernel"), { recursive: true });
mkdirSync(join(staging, "repo"), { recursive: true });
mkdirSync(join(staging, "rector-r4"), { recursive: true });

const inventory = [];
for (const item of files) {
  const out = join(staging, item.rel);
  mkdirSync(join(out, ".."), { recursive: true });
  copyFileSync(item.abs, out);
  inventory.push({
    path: item.rel,
    bytes: statSync(item.abs).size,
    source: item.abs,
  });
}

writeFileSync(
  join(staging, "README_BUNDLE.md"),
  [
    "# Bundle — Archivos rectores usados para las instrucciones del Panel de Control EVE",
    "",
    "Contiene copia del corpus canónico en `docs/eve/panel-control/corpus/`,",
    "más autoridades metodológicas referenciadas (CP-012) y el baseline R4.",
    "",
    "Documento canónico principal del panel:",
    "`corpus/Diseno_Panel_Control_EVE_Empresa_Cliente_Matriz_XY_Gobernanza_Experiencia_v1_0.docx`",
    "",
    `Generado: ${new Date().toISOString()}`,
    `Archivos: ${inventory.length}`,
    "",
  ].join("\n"),
  "utf8",
);
writeFileSync(join(staging, "INVENTARIO.json"), JSON.stringify({ count: inventory.length, files: inventory }, null, 2) + "\n");

if (existsSync(dest)) unlinkSync(dest);
const ps = spawnSync(
  "powershell",
  [
    "-NoProfile",
    "-Command",
    `Compress-Archive -Path '${staging}\\*' -DestinationPath '${dest}' -Force`,
  ],
  { encoding: "utf8" },
);
if (ps.status !== 0) {
  console.error(ps.stdout || ps.stderr || "compress_failed");
  process.exit(ps.status || 1);
}

const st = statSync(dest);
console.log(
  JSON.stringify(
    {
      zip: dest,
      name: basename(dest),
      bytes: st.size,
      count: inventory.length + 2,
      corpusFiles: inventory.length,
    },
    null,
    2,
  ),
);
