import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { validateDiagramCodeGenerationPackage } from "../../../scripts/validate-parallel-production.mjs";

const root = process.cwd();
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
const artifacts = () => ({
  handoffPackage: readJson("tests/fixtures/parallel-production/design-handoff-package.json"),
  irPackage: readJson("tests/fixtures/parallel-production/mmabp-ir-package.json"),
  conformanceReport: readJson("tests/fixtures/parallel-production/conformance-report-passed.json"),
  consistencyReport: readJson("tests/fixtures/parallel-production/consistency-report-passed.json"),
  designGaps: [
    readJson("tests/fixtures/parallel-production/design-gap-non-blocking.json"),
    readJson("tests/fixtures/parallel-production/design-gap-moc-support.json"),
  ],
});

test("diagram code generation candidate package is valid and traced", () => {
  const diagramPackage = readJson("tests/fixtures/parallel-production/diagram-code-generation-package.json");
  const result = validateDiagramCodeGenerationPackage(diagramPackage, artifacts());

  assert.equal(result.status, "passed", result.errors.join("\n"));
});

test("diagram export element without source IR element is blocked", () => {
  const diagramPackage = readJson("tests/fixtures/parallel-production/diagram-code-generation-package.json");
  diagramPackage.exports[0].source_ir_element_ids = [];

  const result = validateDiagramCodeGenerationPackage(diagramPackage, artifacts());

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("source IR element")));
});

test("diagram generation ready state is blocked by open blocking gap", () => {
  const diagramPackage = readJson("tests/fixtures/parallel-production/diagram-code-generation-package.json");
  const context = artifacts();
  const blockingGap = readJson("tests/fixtures/parallel-production/design-gap-non-blocking.json");
  blockingGap.gap_id = "DGAP_BLOCKING_001";
  blockingGap.blocking_status = "blocking";
  context.designGaps.push(blockingGap);
  diagramPackage.generation_readiness = "ready_for_candidate_generation";
  diagramPackage.design_gap_ids = ["DGAP_BLOCKING_001"];

  const result = validateDiagramCodeGenerationPackage(diagramPackage, context);

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("open blocking design gaps")));
});

test("diagram export cannot invent registry or fact references outside IR", () => {
  const diagramPackage = readJson("tests/fixtures/parallel-production/diagram-code-generation-package.json");
  diagramPackage.exports[0].source_registry_element_ids = ["UNKNOWN_REGISTRY_ELEMENT"];
  diagramPackage.exports[0].source_fact_ids = ["UNKNOWN_FACT"];

  const result = validateDiagramCodeGenerationPackage(diagramPackage, artifacts());

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("not supported by source IR")));
});
