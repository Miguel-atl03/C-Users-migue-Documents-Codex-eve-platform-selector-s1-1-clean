import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { generatePmBpmn } from "../../../scripts/parallel-production/generators/generate-pm-bpmn.mjs";

const root = process.cwd();
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
const base = () => ({
  irPackage: readJson("tests/fixtures/parallel-production/mmabp-ir-package.json"),
  diagramExport: readJson("tests/fixtures/parallel-production/diagram-code-generation-package.json").exports.find((item) => item.quadrant === "PM"),
});

test("PM generator emits BPMN candidate with traceability and no invented trigger", () => {
  const content = generatePmBpmn(base());

  assert.ok(content.includes("<bpmn:definitions"));
  assert.ok(content.includes("<bpmndi:BPMNDiagram"));
  assert.ok(content.includes("<bpmndi:BPMNShape"));
  assert.ok(content.includes("candidate_only"));
  assert.ok(content.includes("source_ir_element_ids"));
  assert.ok(!content.includes("<bpmn:startEvent"), "PM fixture has no trigger, so generator must not invent one");
});

test("PM generator blocks organizational chart projection", () => {
  const context = base();
  context.irPackage.models.PM_IR.elements[0].represents_organizational_chart = true;

  assert.throws(() => generatePmBpmn(context), /organizational chart/);
});
