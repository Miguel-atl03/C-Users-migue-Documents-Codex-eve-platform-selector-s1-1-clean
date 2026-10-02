import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { validateMmabpIrPackage } from "../../../scripts/validate-parallel-production.mjs";

const root = process.cwd();
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
const context = () => ({
  registry: readJson("tests/fixtures/parallel-production/quadrant-registries.json"),
  ir: readJson("tests/fixtures/parallel-production/mmabp-ir-package.json"),
  reports: {
    conformanceReport: readJson("tests/fixtures/parallel-production/conformance-report-passed.json"),
    consistencyReport: readJson("tests/fixtures/parallel-production/consistency-report-passed.json"),
  },
  gaps: [
    readJson("tests/fixtures/parallel-production/design-gap-non-blocking.json"),
    readJson("tests/fixtures/parallel-production/design-gap-moc-support.json"),
  ],
});

test("PF task requires object and OLC state when ready", () => {
  const { registry, ir, reports, gaps } = context();
  ir.models.PF_IR.elements.push({
    ir_element_id: "PF_IR_TASK_BAD",
    ir_element_type: "task",
    label: "Revisar solicitud",
    source_registry_element_ids: ["PF_PSTATE_001"],
    source_fact_ids: ["FACT_000001"],
    conformance_status: "passed",
    consistency_status: "pending"
  });

  const result = validateMmabpIrPackage(ir, registry, reports, gaps);

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("object and OLC state")));
});

test("PF gateway requires decision evidence", () => {
  const { registry, ir, reports, gaps } = context();
  ir.models.PF_IR.elements.push({
    ir_element_id: "PF_IR_GATEWAY_BAD",
    ir_element_type: "gateway",
    label: "Aprobar?",
    source_registry_element_ids: ["PF_PSTATE_001"],
    source_fact_ids: ["FACT_000001"],
    conformance_status: "passed",
    consistency_status: "pending"
  });

  const result = validateMmabpIrPackage(ir, registry, reports, gaps);

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("criterion, authority")));
});

test("PF process state requires awaited event when ready", () => {
  const { registry, ir, reports, gaps } = context();
  ir.models.PF_IR.elements[0].conformance_status = "passed";
  ir.models.PF_IR.elements[0].awaited_events = [];

  const result = validateMmabpIrPackage(ir, registry, reports, gaps);

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("expected event")));
});

test("PF workaround preserves cause and affected object when ready", () => {
  const { registry, ir, reports, gaps } = context();
  ir.models.PF_IR.elements[1].conformance_status = "passed";

  const result = validateMmabpIrPackage(ir, registry, reports, gaps);

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("cause and affected object")));
});
