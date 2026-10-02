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

const pushMoc = (ir, element) => {
  ir.models.MoC_IR.elements.push({
    source_registry_element_ids: [],
    source_fact_ids: [],
    consistency_status: "pending",
    ...element,
  });
};

test("MoC class must represent business concept", () => {
  const { registry, ir, reports, gaps } = base();
  pushMoc(ir, {
    ir_element_id: "MOC_IR_CLASS_BAD",
    ir_element_type: "class",
    label: "TblSolicitudEntity",
    conformance_status: "passed"
  });

  const result = validateMmabpIrPackage(ir, registry, reports, gaps);

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("business concept")));
});

test("MoC operation requires object and causal precondition", () => {
  const { registry, ir, reports, gaps } = base();
  pushMoc(ir, {
    ir_element_id: "MOC_IR_OP_BAD",
    ir_element_type: "operation",
    label: "Aprobar",
    conformance_status: "passed"
  });

  const result = validateMmabpIrPackage(ir, registry, reports, gaps);

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("causal precondition")));
});

test("MoC relationship requires cardinality or semantic reason", () => {
  const { registry, ir, reports, gaps } = base();
  pushMoc(ir, {
    ir_element_id: "MOC_IR_REL_BAD",
    ir_element_type: "relationship",
    label: "Solicitud-Legal",
    conformance_status: "passed"
  });

  const result = validateMmabpIrPackage(ir, registry, reports, gaps);

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("cardinality or semantic reason")));
});

test("MoC role must not become organizational area", () => {
  const { registry, ir, reports, gaps } = base();
  pushMoc(ir, {
    ir_element_id: "MOC_IR_ROLE_BAD",
    ir_element_type: "role",
    label: "Legal",
    organizational_area: true,
    conformance_status: "passed"
  });

  const result = validateMmabpIrPackage(ir, registry, reports, gaps);

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("organizational area")));
});
