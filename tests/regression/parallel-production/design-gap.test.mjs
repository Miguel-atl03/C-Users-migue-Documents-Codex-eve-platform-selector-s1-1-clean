import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  validateDesignGap,
  validateDesignHandoffPackage,
} from "../../../scripts/validate-parallel-production.mjs";

const root = process.cwd();
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));

test("design_gap valid fixture is accepted as referencable gap", () => {
  const gap = readJson("tests/fixtures/parallel-production/design-gap-non-blocking.json");
  const result = validateDesignGap(gap);

  assert.equal(result.status, "passed", result.errors.join("\n"));
});

test("missing_evidence gaps require required_evidence", () => {
  const gap = readJson("tests/fixtures/parallel-production/design-gap-non-blocking.json");
  gap.gap_type = "missing_evidence";
  gap.required_evidence = [];

  const result = validateDesignGap(gap);

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("required_evidence")));
});

test("handoff ready state is blocked by open blocking design gaps", () => {
  const bundle = readJson("tests/fixtures/parallel-production/valid-mmabp-design-source-bundle.json");
  const inventory = readJson("tests/fixtures/parallel-production/client-mmabp-structural-facts.json");
  const registryPackage = readJson("tests/fixtures/parallel-production/quadrant-registries.json");
  const irPackage = readJson("tests/fixtures/parallel-production/mmabp-ir-package.json");
  const handoffPackage = readJson("tests/fixtures/parallel-production/design-handoff-package.json");
  const blockingGap = readJson("tests/fixtures/parallel-production/design-gap-non-blocking.json");
  blockingGap.gap_id = "DGAP_BLOCKING_001";
  blockingGap.blocking_status = "blocking";
  handoffPackage.design_gap_ids = ["DGAP_BLOCKING_001"];

  const result = validateDesignHandoffPackage(handoffPackage, {
    bundle,
    inventory,
    registryPackage,
    irPackage,
    designGaps: [blockingGap],
  });

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("open blocking design gaps")));
});
