import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { validateGeneratedCandidateFiles } from "../../../scripts/parallel-production/generators/validate-generated-candidate-files.mjs";

const root = process.cwd();
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));

test("ready_with_warnings candidate export is still candidate-only and not final export", () => {
  const packageJson = readJson("tests/fixtures/parallel-production/candidate-export-package.json");

  assert.equal(packageJson.generation_mode, "candidate");
  assert.equal(packageJson.export_readiness, "ready_with_warnings");
  assert.equal(packageJson.boundaries.candidate_only, true);
  assert.equal(packageJson.boundaries.generated_files_are_not_evidence, true);
  assert.ok(packageJson.prohibited_uses.includes("final_export"));
  assert.ok(packageJson.prohibited_uses.includes("capa2_readiness_input"));
});

test("candidate export generation_mode cannot reuse readiness vocabulary", () => {
  const packageJson = readJson("tests/fixtures/parallel-production/candidate-export-package.json");

  assert.notEqual(packageJson.generation_mode, "ready_with_warnings");
  assert.ok(["candidate", "draft_with_warnings", "blocked"].includes(packageJson.generation_mode));
});

test("candidate export is blocked when a referenced warning gap becomes blocking", () => {
  const packageJson = readJson("tests/fixtures/parallel-production/candidate-export-package.json");
  const timerGap = readJson("tests/fixtures/parallel-production/design-gap-non-blocking.json");
  const mocGap = readJson("tests/fixtures/parallel-production/design-gap-moc-support.json");
  timerGap.blocking_status = "blocking";

  const result = validateGeneratedCandidateFiles({
    root,
    candidateExportPackage: packageJson,
    designGaps: [timerGap, mocGap],
  });

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("open blocking design gap")));
});
