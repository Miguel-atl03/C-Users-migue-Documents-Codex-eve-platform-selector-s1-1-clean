import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { validateGeneratedCandidateFiles } from "../../../scripts/parallel-production/generators/validate-generated-candidate-files.mjs";

const root = process.cwd();
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
const designGaps = () => [
  readJson("tests/fixtures/parallel-production/design-gap-non-blocking.json"),
  readJson("tests/fixtures/parallel-production/design-gap-moc-support.json"),
];

test("candidate_export_package validates generated files, hashes and prohibited uses", () => {
  const result = validateGeneratedCandidateFiles({ root, designGaps: designGaps() });

  assert.equal(result.status, "passed", result.errors.join("\n"));
  assert.equal(result.summary.generated_candidate_files_count, 4);
  assert.equal(result.summary.candidate_only_confirmed, true);
  assert.equal(result.summary.prohibited_uses_confirmed, true);
});

test("candidate_export_package cannot pass with missing prohibited uses", () => {
  const packageJson = readJson("tests/fixtures/parallel-production/candidate-export-package.json");
  packageJson.prohibited_uses = [];

  const result = validateGeneratedCandidateFiles({
    root,
    candidateExportPackage: packageJson,
    designGaps: designGaps(),
  });

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("prohibited use")));
});
