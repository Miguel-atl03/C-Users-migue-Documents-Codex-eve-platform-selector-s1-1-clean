import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const forbiddenRuntimeFile = path.join(root, "src", "rules", "question-catalog-v2-1.json");
const allowedArchiveFile = path.join(root, "archive", "legacy-runtime", "question-catalog-v2-1.NO_RUNTIME_SOURCE.json");
const scannedRoots = ["src", "scripts", "tests"].map((item) => path.join(root, item));
const allowedFiles = new Set([
  path.join(root, "src", "runtime-vsm", "runtime-vsm.ts"),
  path.join(root, "scripts", "check-no-legacy-runtime-catalog.mjs"),
  path.join(root, "scripts", "runtime-vsm-rules.test.mjs"),
]);
const forbiddenPatterns = [
  /question-catalog-v2-1\.json/g,
  /@\/rules\/question-catalog-v2-1\.json/g,
  /rules[\\/]question-catalog-v2-1\.json/g,
];
const failures = [];

if (fs.existsSync(forbiddenRuntimeFile)) {
  failures.push(`Forbidden runtime catalog still exists: ${path.relative(root, forbiddenRuntimeFile)}`);
}

if (!fs.existsSync(allowedArchiveFile)) {
  failures.push(`Retired catalog archive is missing: ${path.relative(root, allowedArchiveFile)}`);
}

function visit(directory) {
  if (!fs.existsSync(directory)) return [];
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      files.push(...visit(fullPath));
    } else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

for (const filePath of scannedRoots.flatMap(visit)) {
  if (allowedFiles.has(filePath)) continue;
  const source = fs.readFileSync(filePath, "utf8");
  for (const pattern of forbiddenPatterns) {
    pattern.lastIndex = 0;
    if (pattern.test(source)) {
      failures.push(`Forbidden legacy catalog reference in ${path.relative(root, filePath)}`);
      break;
    }
  }
}

if (failures.length) {
  console.error(JSON.stringify({ status: "failed", failures }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    status: "passed",
    retiredCatalog: path.relative(root, allowedArchiveFile),
    activeReferences: 0,
  }, null, 2));
}