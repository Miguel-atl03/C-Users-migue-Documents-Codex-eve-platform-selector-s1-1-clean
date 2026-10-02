import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  validateConformanceReport,
  validateConsistencyReport,
  validateDiagramCodeGenerationPackage,
  validateMmabpIrPackage,
} from "../../../scripts/validate-parallel-production.mjs";

const root = process.cwd();
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));

const designGaps = () => [
  readJson("tests/fixtures/parallel-production/design-gap-non-blocking.json"),
  readJson("tests/fixtures/parallel-production/design-gap-moc-support.json"),
];

test("conformance and consistency reports pass against sourced IR", () => {
  const registryPackage = readJson("tests/fixtures/parallel-production/quadrant-registries.json");
  const irPackage = readJson("tests/fixtures/parallel-production/mmabp-ir-package.json");
  const conformanceReport = readJson("tests/fixtures/parallel-production/conformance-report-passed.json");
  const consistencyReport = readJson("tests/fixtures/parallel-production/consistency-report-passed.json");

  assert.equal(validateConformanceReport(conformanceReport, { irPackage }, designGaps()).status, "passed");
  assert.equal(validateConsistencyReport(consistencyReport, { registryPackage, irPackage }, designGaps()).status, "passed");
});

test("IR marked passed is rejected without conformance report", () => {
  const registryPackage = readJson("tests/fixtures/parallel-production/quadrant-registries.json");
  const irPackage = readJson("tests/fixtures/parallel-production/mmabp-ir-package.json");
  const consistencyReport = readJson("tests/fixtures/parallel-production/consistency-report-passed.json");

  const result = validateMmabpIrPackage(irPackage, registryPackage, { consistencyReport }, designGaps());

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("conformance_report")));
});

test("IR marked passed is rejected without consistency report", () => {
  const registryPackage = readJson("tests/fixtures/parallel-production/quadrant-registries.json");
  const irPackage = readJson("tests/fixtures/parallel-production/mmabp-ir-package.json");
  const conformanceReport = readJson("tests/fixtures/parallel-production/conformance-report-passed.json");

  const result = validateMmabpIrPackage(irPackage, registryPackage, { conformanceReport }, designGaps());

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("consistency_report")));
});

test("diagram readiness cannot be final-ready with partial conformance", () => {
  const handoffPackage = readJson("tests/fixtures/parallel-production/design-handoff-package.json");
  const irPackage = readJson("tests/fixtures/parallel-production/mmabp-ir-package.json");
  const diagramPackage = readJson("tests/fixtures/parallel-production/diagram-code-generation-package.json");
  const conformanceReport = readJson("tests/fixtures/parallel-production/conformance-report-passed.json");
  const consistencyReport = readJson("tests/fixtures/parallel-production/consistency-report-passed.json");
  diagramPackage.generation_readiness = "ready_for_candidate_generation";
  conformanceReport.conformance_status = "partial";

  const result = validateDiagramCodeGenerationPackage(diagramPackage, {
    handoffPackage,
    irPackage,
    conformanceReport,
    consistencyReport,
    designGaps: designGaps(),
  });

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("conformance")));
});
