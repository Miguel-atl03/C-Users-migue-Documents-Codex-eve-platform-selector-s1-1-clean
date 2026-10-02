import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  validateInventoryReadiness,
  validateQuadrantRegistryPackage,
} from "../../../scripts/validate-parallel-production.mjs";

const root = process.cwd();
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));

test("inventory_readiness valid fixture allows registry projection", () => {
  const bundle = readJson("tests/fixtures/parallel-production/valid-mmabp-design-source-bundle.json");
  const inventory = readJson("tests/fixtures/parallel-production/client-mmabp-structural-facts.json");
  const readiness = readJson("tests/fixtures/parallel-production/inventory-readiness-ready.json");
  const gaps = [
    readJson("tests/fixtures/parallel-production/design-gap-non-blocking.json"),
    readJson("tests/fixtures/parallel-production/design-gap-moc-support.json"),
  ];

  const result = validateInventoryReadiness(readiness, inventory, bundle, gaps);

  assert.equal(result.status, "passed", result.errors.join("\n"));
});

test("quadrant registry is blocked when inventory_readiness is blocked", () => {
  const inventory = readJson("tests/fixtures/parallel-production/client-mmabp-structural-facts.json");
  const readiness = readJson("tests/fixtures/parallel-production/inventory-readiness-ready.json");
  const registryPackage = readJson("tests/fixtures/parallel-production/quadrant-registries.json");
  readiness.inventory_readiness = "blocked_by_semantic_conflict";
  readiness.blocking_gaps = [];

  const result = validateQuadrantRegistryPackage(registryPackage, inventory, readiness, []);

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("blocked by inventory_readiness")));
});
