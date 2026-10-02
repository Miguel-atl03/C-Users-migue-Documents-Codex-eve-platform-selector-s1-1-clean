import { readFileSync, mkdirSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { tmpdir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const canonDir = join(root, "docs/significado/canon");
const docx = readdirSync(canonDir).find((f) => f.toLowerCase().endsWith(".docx"));

if (!docx) {
  console.error("No .docx found in docs/significado/canon");
  process.exit(1);
}

const src = join(canonDir, docx);
const dest = join(tmpdir(), "eve-docx-extract");
mkdirSync(dest, { recursive: true });
const zip = join(dest, "doc.zip");
writeFileSync(zip, readFileSync(src));

execSync(
  `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${zip.replace(/'/g, "''")}' -DestinationPath '${dest.replace(/'/g, "''")}' -Force"`,
  { stdio: "inherit" },
);

const xml = readFileSync(join(dest, "word/document.xml"), "utf8");
const text = xml
  .replace(/<w:tab[^/]*\/>/g, "\t")
  .replace(/<w:br[^/]*\/>/g, "\n")
  .replace(/<\/w:p>/g, "\n")
  .replace(/<[^>]+>/g, "")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&amp;/g, "&")
  .replace(/\n{3,}/g, "\n\n")
  .trim();

console.log(`FILE: ${docx}`);
console.log("---");
console.log(text);
