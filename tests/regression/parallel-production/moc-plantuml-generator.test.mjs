import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { generateMocPlantUml } from "../../../scripts/parallel-production/generators/generate-moc-plantuml.mjs";

const root = process.cwd();
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
const base = () => ({
  irPackage: readJson("tests/fixtures/parallel-production/mmabp-ir-package.json"),
  diagramExport: readJson("tests/fixtures/parallel-production/diagram-code-generation-package.json").exports.find((item) => item.quadrant === "MoC"),
});

test("MoC generator emits PlantUML class from explicit business concept", () => {
  const content = generateMocPlantUml(base());

  assert.ok(content.includes("@startuml"));
  assert.ok(content.includes('class "Solicitud"'));
  assert.ok(content.includes("source_fact_ids"));
  assert.ok(content.includes("candidate_only: true"));
});

test("MoC generator blocks technical class without business concept", () => {
  const context = base();
  context.irPackage.models.MoC_IR.elements[0].label = "TblSolicitudEntity";
  context.irPackage.models.MoC_IR.elements[0].business_concept = "";

  assert.throws(() => generateMocPlantUml(context), /business concept/);
});
