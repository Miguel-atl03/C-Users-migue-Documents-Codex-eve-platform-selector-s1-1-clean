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

test("generated file validator rejects hash mismatch", () => {
  const packageJson = readJson("tests/fixtures/parallel-production/candidate-export-package.json");
  packageJson.exports[0].content_hash = "0".repeat(64);

  const result = validateGeneratedCandidateFiles({ root, candidateExportPackage: packageJson, designGaps: designGaps() });

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("content_hash")));
});

test("generated file validator rejects BPMN without traceable documentation", () => {
  const packageJson = readJson("tests/fixtures/parallel-production/candidate-export-package.json");
  const tempPath = "tests/fixtures/parallel-production/generated-candidate-files/tmp-invalid-no-trace.bpmn";
  fs.writeFileSync(path.join(root, tempPath), [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL">',
    '<bpmn:process id="BAD"><bpmn:task id="BAD_TASK" name="Sin traza"></bpmn:task></bpmn:process>',
    '</bpmn:definitions>',
    "",
  ].join("\n"));
  try {
    packageJson.exports[0].file_path = tempPath;
    packageJson.exports[0].content_hash = "0".repeat(64);
    const result = validateGeneratedCandidateFiles({ root, candidateExportPackage: packageJson, designGaps: designGaps() });

    assert.equal(result.status, "failed");
    assert.ok(result.errors.some((error) => error.includes("source_ir_element_ids") || error.includes("candidate_only")));
  } finally {
    fs.unlinkSync(path.join(root, tempPath));
  }
});
