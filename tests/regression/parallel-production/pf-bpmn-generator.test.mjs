import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { generatePfBpmn } from "../../../scripts/parallel-production/generators/generate-pf-bpmn.mjs";

const root = process.cwd();
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
const base = () => ({
  irPackage: readJson("tests/fixtures/parallel-production/mmabp-ir-package.json"),
  diagramExport: readJson("tests/fixtures/parallel-production/diagram-code-generation-package.json").exports.find((item) => item.quadrant === "PF"),
});

test("PF generator emits BPMN candidate with process state and traceability", () => {
  const content = generatePfBpmn(base());

  assert.ok(content.includes("<bpmn:definitions"));
  assert.ok(content.includes("<bpmndi:BPMNDiagram"));
  assert.ok(content.includes("<bpmndi:BPMNEdge"));
  assert.ok(content.includes("<bpmn:intermediateCatchEvent"));
  assert.ok(content.includes("Aprobacion legal recibida"));
  assert.ok(content.includes("candidate_only"));
});

test("PF generator blocks process state without awaited event", () => {
  const context = base();
  context.irPackage.models.PF_IR.elements[0].awaited_events = [];

  assert.throws(() => generatePfBpmn(context), /awaited event/);
});
