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

const pushOlc = (ir, element) => {
  ir.models.OLC_IR.elements.push({
    source_registry_element_ids: ["OLC_STATE_001"],
    source_fact_ids: ["FACT_000001"],
    consistency_status: "pending",
    ...element,
  });
};

test("OLC state must not represent a process task", () => {
  const { registry, ir, reports, gaps } = base();
  ir.models.OLC_IR.elements[0].represents_task = true;

  const result = validateMmabpIrPackage(ir, registry, reports, gaps);

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("process task")));
});

test("OLC transition requires reason", () => {
  const { registry, ir, reports, gaps } = base();
  pushOlc(ir, {
    ir_element_id: "OLC_IR_TRANSITION_BAD",
    ir_element_type: "transition",
    label: "Pendiente -> Aprobada",
    conformance_status: "passed"
  });

  const result = validateMmabpIrPackage(ir, registry, reports, gaps);

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("transition reason")));
});

test("OLC undesired recurrent final requires gap or warning", () => {
  const { registry, ir, reports, gaps } = base();
  pushOlc(ir, {
    ir_element_id: "OLC_IR_FINAL_BAD",
    ir_element_type: "final_state",
    label: "Solicitud abandonada",
    undesired_recurrent: true,
    conformance_status: "passed"
  });

  const result = validateMmabpIrPackage(ir, registry, reports, gaps);

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("requires gap or warning")));
});

test("OLC operation requires MoC operation or supporting fact", () => {
  const { registry, ir, reports, gaps } = base();
  pushOlc(ir, {
    ir_element_id: "OLC_IR_OPERATION_BAD",
    ir_element_type: "operation",
    label: "Actualizar estado",
    source_fact_ids: [],
    conformance_status: "passed"
  });

  const result = validateMmabpIrPackage(ir, registry, reports, gaps);

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("MoC operation or supporting fact")));
});

test("OLC self-loop must not create false state", () => {
  const { registry, ir, reports, gaps } = base();
  pushOlc(ir, {
    ir_element_id: "OLC_IR_LOOP_BAD",
    ir_element_type: "self_loop",
    label: "Pendiente sigue pendiente",
    creates_false_state: true,
    conformance_status: "passed"
  });

  const result = validateMmabpIrPackage(ir, registry, reports, gaps);

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("false state")));
});
