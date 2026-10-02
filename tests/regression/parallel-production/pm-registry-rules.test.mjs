import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { validateQuadrantRegistryPackage } from "../../../scripts/validate-parallel-production.mjs";

const root = process.cwd();
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
const context = () => ({
  inventory: readJson("tests/fixtures/parallel-production/client-mmabp-structural-facts.json"),
  readiness: readJson("tests/fixtures/parallel-production/inventory-readiness-ready.json"),
});

test("PM ready process requires trigger and target state", () => {
  const registry = readJson("tests/fixtures/parallel-production/quadrant-registries.json");
  const { inventory, readiness } = context();
  registry.registry_readiness.status = "registries_ready";
  registry.registries.PM.elements[0].trigger_events = [];
  registry.registries.PM.elements[0].target_states = [];
  registry.registries.PM.elements[0].conformance_status = "conformant";

  const result = validateQuadrantRegistryPackage(registry, inventory, readiness, []);

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("trigger_events and target_states")));
});

test("PM process must not represent org chart", () => {
  const registry = readJson("tests/fixtures/parallel-production/quadrant-registries.json");
  const { inventory, readiness } = context();
  registry.registries.PM.elements[0].represents_org_chart = true;

  const result = validateQuadrantRegistryPackage(registry, inventory, readiness, []);

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("org chart")));
});
