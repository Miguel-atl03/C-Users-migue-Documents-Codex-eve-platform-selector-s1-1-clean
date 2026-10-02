import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const legacyCatalogName = ["question", "catalog", "v2", "1"].join("-") + ".json";
const legacyCatalogPath = path.join(root, "src", "rules", legacyCatalogName);
const retiredCatalogPath = path.join(
  root,
  "archive",
  "legacy-runtime",
  ["question", "catalog", "v2", "1.NO_RUNTIME_SOURCE"].join("-") + ".json",
);

const scanRoots = ["src", "scripts", "tests"].map((part) => path.join(root, part));
const allowedFiles = new Set([
  path.join(root, "src", "runtime-vsm", "runtime-vsm.ts"),
  path.join(root, "scripts", "check-no-legacy-runtime-catalog.mjs"),
  path.join(root, "scripts", "runtime-vsm-rules.test.mjs"),
  path.join(root, "tests", "regression", "consultant-control-panel", "legacy-question-catalog-v2-1-freeze.test.mjs"),
]);

function listSourceFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") return [];
      return listSourceFiles(fullPath);
    }
    return /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name) ? [fullPath] : [];
  });
}

test("legacy Capa 1 v2.1 catalog is absent from runtime source and has no productive consumers", () => {
  assert.equal(fs.existsSync(legacyCatalogPath), false);
  assert.equal(fs.existsSync(retiredCatalogPath), true);

  const activeConsumers = scanRoots
    .flatMap(listSourceFiles)
    .filter((filePath) => !allowedFiles.has(filePath))
    .filter((filePath) => fs.readFileSync(filePath, "utf8").includes(legacyCatalogName));

  assert.deepEqual(activeConsumers, []);
});
