import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const candidateDir = "docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate";
const activeJsonPath = "docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1/EVE_04_Runtime_Catalog_v0_1.json";

const strictJsonPath = `${candidateDir}/EVE_04_Runtime_Catalog_v0_1_1_candidate.json`;
const strictManifestPath = `${candidateDir}/EVE_04_Runtime_Catalog_v0_1_1_candidate.manifest.json`;
const strictXlsxPath = `${candidateDir}/EVE_04_Runtime_Catalog_v0_1_1_candidate.xlsx`;
const strictTsPath = `${candidateDir}/EVE_04_Runtime_Catalog_v0_1_1_candidate.ts`;
const strictMdPath = `${candidateDir}/EVE_04_Runtime_Catalog_v0_1_1_candidate.md`;

const aliasJsonPath = `${candidateDir}/EVE_04_Runtime_Catalog_v0_1.json`;
const aliasManifestPath = `${candidateDir}/EVE_04_Runtime_Catalog_v0_1.manifest.json`;

function findFlag(catalog: { flags?: Array<{ flag_id: string; status: string }> }, flagId: string) {
  return catalog.flags?.find((flag) => flag.flag_id === flagId);
}

test("candidate folder and strict filenames exist while aliases are preserved", () => {
  assert.equal(existsSync(candidateDir), true, "candidate folder must exist");
  assert.equal(existsSync(strictJsonPath), true, "strict JSON must exist");
  assert.equal(existsSync(strictManifestPath), true, "strict manifest must exist");
  assert.equal(existsSync(strictXlsxPath), true, "strict XLSX must exist");
  assert.equal(existsSync(strictTsPath), true, "strict TS must exist");
  assert.equal(existsSync(strictMdPath), true, "strict MD must exist");
  assert.equal(existsSync(aliasJsonPath), true, "alias JSON must remain");
  assert.equal(existsSync(aliasManifestPath), true, "alias manifest must remain");
});

test("strict JSON preserves the CCOV-001 candidate patch and open CVAR-001 state", () => {
  const catalog = JSON.parse(readFileSync(strictJsonPath, "utf8"));
  const serialized = JSON.stringify(catalog);
  const ccov = findFlag(catalog, "CCOV-001");
  const cvar = findFlag(catalog, "CVAR-001");

  assert.match(serialized, /B6-Q38/);
  assert.match(serialized, /B6_6_8/);
  assert.match(serialized, /trench_phrase/);
  assert.equal(ccov?.status, "RESOLVED_IN_CANDIDATE");
  assert.equal(cvar?.status, "OPEN_PENDING_SOURCE_GAP");
  assert.equal(catalog.certification_status, "NOT_CERTIFIED");
  assert.equal(catalog.status, "READY_WITH_FLAGS");
});

test("strict manifest remains candidate, not certified, and not product-touching", () => {
  const manifest = JSON.parse(readFileSync(strictManifestPath, "utf8"));
  const serialized = JSON.stringify(manifest);

  assert.match(serialized, /0\.1\.1-candidate|v0\.1\.1-candidate/);
  assert.match(serialized, /NOT_CERTIFIED/);
  assert.match(serialized, /READY_WITH_FLAGS/);
  assert.match(serialized, /OPEN_PENDING_SOURCE_GAP/);
  assert.equal(manifest.patch_metadata?.product_mutation, false);
  assert.equal(manifest.patch_metadata?.runtime_authority, false);
});

test("active v0.1 chip remains unpatched", () => {
  const active = JSON.parse(readFileSync(activeJsonPath, "utf8"));
  const activeB6q38 = active.modules.runtime_interactions_base_40.find(
    (row: { runtime_interaction_id: string }) => row.runtime_interaction_id === "B6-Q38"
  );
  const activeCcov = findFlag(active, "CCOV-001");

  assert.doesNotMatch(activeB6q38.source_nodes, /B6_6_8/);
  assert.equal(activeCcov?.status, "OPEN");
});

test("filename normalization does not carry product, runtime, or package mutations", () => {
  const manifest = JSON.parse(readFileSync(strictManifestPath, "utf8"));

  assert.equal(manifest.patch_metadata?.product_mutation, false);
  assert.equal(manifest.patch_metadata?.runtime_authority, false);
  assert.equal(manifest.patch_metadata?.registry_write_enabled, false);
  assert.equal(manifest.patch_metadata?.diagnosis_enabled, false);
  assert.equal(manifest.patch_metadata?.export_enabled, false);
});
