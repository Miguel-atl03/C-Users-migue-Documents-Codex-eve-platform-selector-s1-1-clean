import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { validateMmabpIrPackage } from "../../../scripts/validate-parallel-production.mjs";

const root = process.cwd();
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
const base = () => ({
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

test("PF task that transforms object must trace to existing OLC state", () => {
  const { registry, ir, reports, gaps } = base();
  ir.models.PF_IR.elements.push({
    ir_element_id: "PF_IR_TASK_BAD_OLC_REF",
    ir_element_type: "task",
    label: "Transformar solicitud",
    object_class: "Solicitud",
    olc_state_ref: "Estado inexistente",
    source_registry_element_ids: ["PF_PSTATE_001"],
    source_fact_ids: ["FACT_000001"],
    conformance_status: "passed",
    consistency_status: "pending"
  });

  const result = validateMmabpIrPackage(ir, registry, reports, gaps);

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("missing OLC state")));
});

test("PF final must map to PM target state, OLC state, or declared gap", () => {
  const { registry, ir, reports, gaps } = base();
  ir.models.PF_IR.elements.push({
    ir_element_id: "PF_IR_FINAL_BAD",
    ir_element_type: "task",
    label: "Cerrar caso",
    object_class: "Solicitud",
    olc_state_ref: "Pendiente de aprobacion legal",
    final_state: "Final inventado",
    source_registry_element_ids: ["PF_PSTATE_001"],
    source_fact_ids: ["FACT_000001"],
    conformance_status: "pending",
    consistency_status: "pending"
  });

  const result = validateMmabpIrPackage(ir, registry, reports, gaps);

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("PM target state")));
});

test("OLC state using missing MoC class must declare design gap", () => {
  const { registry, ir, reports, gaps } = base();
  ir.models.MoC_IR.elements = [];
  ir.models.OLC_IR.elements[0].design_gap_ids = [];

  const result = validateMmabpIrPackage(ir, registry, reports, gaps);

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("without MoC registry/IR support or gap")));
});
