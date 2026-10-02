import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { generateOlcPlantUml } from "../../../scripts/parallel-production/generators/generate-olc-plantuml.mjs";

const root = process.cwd();
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
const base = () => ({
  irPackage: readJson("tests/fixtures/parallel-production/mmabp-ir-package.json"),
  diagramExport: readJson("tests/fixtures/parallel-production/diagram-code-generation-package.json").exports.find((item) => item.quadrant === "OLC"),
});

test("OLC generator emits PlantUML state machine candidate with traceability", () => {
  const content = generateOlcPlantUml(base());

  assert.ok(content.includes("@startuml"));
  assert.ok(content.includes('state "Pendiente de aprobacion legal"'));
  assert.ok(content.includes("source_ir_element_ids"));
  assert.ok(content.includes("candidate_only: true"));
});

test("OLC generator blocks state that represents a PF task", () => {
  const context = base();
  context.irPackage.models.OLC_IR.elements[0].represents_task = true;

  assert.throws(() => generateOlcPlantUml(context), /process task/);
});
