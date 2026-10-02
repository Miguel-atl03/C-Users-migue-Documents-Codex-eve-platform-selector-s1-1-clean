import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { validateDiagramCodeGenerationPackage } from "../../../scripts/validate-parallel-production.mjs";

const root = process.cwd();
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));

const artifacts = (includeIr = true) => ({
  handoffPackage: readJson("tests/fixtures/parallel-production/design-handoff-package.json"),
  irPackage: includeIr ? readJson("tests/fixtures/parallel-production/mmabp-ir-package.json") : undefined,
  conformanceReport: readJson("tests/fixtures/parallel-production/conformance-report-passed.json"),
  consistencyReport: readJson("tests/fixtures/parallel-production/consistency-report-passed.json"),
  designGaps: [
    readJson("tests/fixtures/parallel-production/design-gap-non-blocking.json"),
    readJson("tests/fixtures/parallel-production/design-gap-moc-support.json"),
  ],
});

test("draft_with_warnings valid fixture is exploratory and blocked downstream", () => {
  const draftPackage = readJson("tests/fixtures/parallel-production/diagram-code-generation-draft-with-warnings.json");
  const result = validateDiagramCodeGenerationPackage(draftPackage, artifacts(false));

  assert.equal(result.status, "passed", result.errors.join("\n"));
});

test("draft_with_warnings without source_registry_element_ids is blocked", () => {
  const draftPackage = readJson("tests/fixtures/parallel-production/diagram-code-generation-draft-with-warnings.json");
  draftPackage.exports[0].source_registry_element_ids = [];

  const result = validateDiagramCodeGenerationPackage(draftPackage, artifacts(false));

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("source_registry_element_ids")));
});

test("draft_with_warnings without design_gap when IR is missing is blocked", () => {
  const draftPackage = readJson("tests/fixtures/parallel-production/diagram-code-generation-draft-with-warnings.json");
  draftPackage.missing_ir_gap_ids = [];
  draftPackage.exports[0].gaps = [];

  const result = validateDiagramCodeGenerationPackage(draftPackage, artifacts(false));

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("missing_ir_gap_ids") || error.includes("associated design_gap")));
});

test("ready_with_warnings warning without downstream_effect is blocked", () => {
  const candidatePackage = readJson("tests/fixtures/parallel-production/diagram-code-generation-package.json");
  delete candidatePackage.exports[1].warnings[0].downstream_effect;

  const result = validateDiagramCodeGenerationPackage(candidatePackage, artifacts());

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("downstream_effect")));
});

test("ready_with_warnings with open blocking gap is blocked", () => {
  const candidatePackage = readJson("tests/fixtures/parallel-production/diagram-code-generation-package.json");
  const context = artifacts();
  const blockingGap = readJson("tests/fixtures/parallel-production/design-gap-non-blocking.json");
  blockingGap.gap_id = "DGAP_BLOCKING_WARNING_001";
  blockingGap.blocking_status = "blocking";
  context.designGaps.push(blockingGap);
  candidatePackage.exports[1].gaps.push("DGAP_BLOCKING_WARNING_001");

  const result = validateDiagramCodeGenerationPackage(candidatePackage, context);

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("open blocking design gaps")));
});

test("draft_with_warnings cannot mark semantic preservation as passed", () => {
  const draftPackage = readJson("tests/fixtures/parallel-production/diagram-code-generation-draft-with-warnings.json");
  draftPackage.exports[0].semantic_preservation_status = "passed";

  const result = validateDiagramCodeGenerationPackage(draftPackage, artifacts(false));

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("semantic_preservation_status passed")));
});

test("draft_with_warnings cannot produce final export", () => {
  const draftPackage = readJson("tests/fixtures/parallel-production/diagram-code-generation-draft-with-warnings.json");
  draftPackage.candidate_export_status = "final";

  const result = validateDiagramCodeGenerationPackage(draftPackage, artifacts(false));

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("final export")));
});

test("draft candidate export requires prohibited_uses", () => {
  const draftPackage = readJson("tests/fixtures/parallel-production/diagram-code-generation-draft-with-warnings.json");
  draftPackage.exports[0].prohibited_uses = [];

  const result = validateDiagramCodeGenerationPackage(draftPackage, artifacts(false));

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("prohibited_uses")));
});

test("ready_for_candidate_generation cannot coexist with draft_only semantic status", () => {
  const draftPackage = readJson("tests/fixtures/parallel-production/diagram-code-generation-draft-with-warnings.json");
  draftPackage.generation_mode = "candidate";
  draftPackage.generation_readiness = "ready_for_candidate_generation";

  const result = validateDiagramCodeGenerationPackage(draftPackage, artifacts(false));

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("draft_only")));
});
