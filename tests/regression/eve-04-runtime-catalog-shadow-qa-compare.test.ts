import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  compareEve04RuntimeCatalogActiveVsCandidate,
  loadEve04RuntimeCatalogActive,
  loadEve04RuntimeCatalogCandidate,
  validateEve04RuntimeCatalogCandidateShadow,
} from "../../src/services/eve-04-runtime-catalog-shadow-service.ts";

const servicePath = "src/services/eve-04-runtime-catalog-shadow-service.ts";
const serviceTestPath = "tests/regression/eve-04-runtime-catalog-shadow-service.test.ts";
const activeCatalogPath =
  "docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1/EVE_04_Runtime_Catalog_v0_1.json";
const activeManifestPath =
  "docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1/EVE_04_Runtime_Catalog_v0_1.manifest.json";
const candidateCatalogPath =
  "docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1_1_candidate.json";
const candidateManifestPath =
  "docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1_1_candidate.manifest.json";

const activeCatalogSha256 =
  "df4674d5156d3747b6baf5906233c5b3d54378abd099870a5c0325f102c26dc0";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const gitRoot = resolve(appRoot, "../..");
const workspacePrefix = "external-consumers/eve-platform";

function appPath(relativePath: string) {
  return resolve(appRoot, relativePath);
}

function gitPath(relativePath: string) {
  return `${workspacePrefix}/${relativePath}`;
}

function readJson(path: string) {
  return JSON.parse(readFileSync(appPath(path), "utf8")) as Record<string, unknown>;
}

function sha256(path: string) {
  return createHash("sha256").update(readFileSync(appPath(path))).digest("hex");
}

function recordArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    : [];
}

function b6q38(catalog: Record<string, unknown>) {
  const modules = catalog.modules as Record<string, unknown>;
  return recordArray(modules.runtime_interactions_base_40).find(
    (item) => item.runtime_interaction_id === "B6-Q38",
  );
}

function uxB6q38(catalog: Record<string, unknown>) {
  const modules = catalog.modules as Record<string, unknown>;
  return recordArray(modules.ux_subfield_structure).find(
    (item) => item.runtime_interaction_id === "B6-Q38",
  );
}

function flag(catalog: Record<string, unknown>, flagId: string) {
  return recordArray(catalog.flags).find((item) => item.flag_id === flagId);
}

function gitDiffNameOnly(paths: string[]) {
  try {
    return execSync(`git -C "${gitRoot}" diff --name-only -- ${paths.map((item) => `"${gitPath(item)}"`).join(" ")}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })
      .split(/\r?\n/)
      .map((line) => line.trim())
      .map((line) => (line.startsWith(`${workspacePrefix}/`) ? line.slice(workspacePrefix.length + 1) : line))
      .filter(Boolean);
  } catch (error) {
    const message = String(error);
    if (message.includes("dubious ownership")) {
      return null;
    }
    throw error;
  }
}

test("mandatory QA compare sources exist", () => {
  for (const path of [
    servicePath,
    serviceTestPath,
    activeCatalogPath,
    activeManifestPath,
    candidateCatalogPath,
    candidateManifestPath,
    "docs/audits/EVE04_SHADOW_CONNECTION_SERVICE_ONLY.md",
    "docs/audits/_eve04_shadow_connection_service_only.json",
  ]) {
    assert.equal(existsSync(appPath(path)), true, `Missing ${path}`);
  }
});

test("shadow service avoids forbidden productive imports and writes", () => {
  const source = readFileSync(appPath(servicePath), "utf8");

  for (const forbidden of [
    /from\s+["']@\/app/,
    /from\s+["'][^"']*src\/app/,
    /from\s+["'][^"']*src\/app\/api/,
    /supabase/i,
    /capa1-runtime-manifest/,
    /rector-docs-registry/,
    /questionnaire\/catalog/,
    /writeFile/,
    /appendFile/,
    /mkdir/,
    /rmSync/,
    /unlink/,
  ]) {
    assert.doesNotMatch(source, forbidden);
  }
});

test("active and candidate load from distinct routes", () => {
  const active = loadEve04RuntimeCatalogActive({ repoRoot: appRoot });
  const candidate = loadEve04RuntimeCatalogCandidate({ repoRoot: appRoot });

  assert.equal(active.catalogPath, activeCatalogPath);
  assert.equal(active.manifestPath, activeManifestPath);
  assert.equal(candidate.catalogPath, candidateCatalogPath);
  assert.equal(candidate.manifestPath, candidateManifestPath);
  assert.notEqual(active.catalogPath, candidate.catalogPath);
  assert.notEqual(active.manifestPath, candidate.manifestPath);
});

test("candidate contains the CCOV-001 delta and active does not", () => {
  const active = readJson(activeCatalogPath);
  const candidate = readJson(candidateCatalogPath);
  const activeB6Q38 = b6q38(active);
  const candidateB6Q38 = b6q38(candidate);
  const candidateUx = uxB6q38(candidate);

  assert.equal(sha256(activeCatalogPath), activeCatalogSha256);
  assert.doesNotMatch(String(activeB6Q38?.source_nodes ?? ""), /B6_6_8/);
  assert.match(String(candidateB6Q38?.source_nodes ?? ""), /B6_6_8/);
  assert.match(String(candidateB6Q38?.source_codes ?? ""), /6\.8/);
  assert.match(String(candidateB6Q38?.canonical_variables ?? ""), /trench_phrase/);
  assert.match(String(candidateB6Q38?.subfield_structure ?? ""), /trench_phrase/);
  assert.match(String(candidateUx?.subfield_structure ?? ""), /trench_phrase/);
});

test("candidate remains not certified, ready with flags, and CVAR open", () => {
  const candidate = readJson(candidateCatalogPath);
  const manifest = readJson(candidateManifestPath);
  const validation = validateEve04RuntimeCatalogCandidateShadow({ repoRoot: appRoot });
  const comparison = compareEve04RuntimeCatalogActiveVsCandidate({ repoRoot: appRoot });

  assert.equal(flag(candidate, "CCOV-001")?.status, "RESOLVED_IN_CANDIDATE");
  assert.equal(flag(candidate, "CVAR-001")?.status, "OPEN_PENDING_SOURCE_GAP");
  assert.equal(candidate.certification_status, "NOT_CERTIFIED");
  assert.equal(candidate.status, "READY_WITH_FLAGS");
  assert.equal(manifest.certification_status, "NOT_CERTIFIED");
  assert.equal(manifest.status, "READY_WITH_FLAGS");
  assert.equal(validation.runtimeAuthority, false);
  assert.equal(validation.productionPromotion, false);
  assert.equal(validation.diagnosisEnabled, false);
  assert.equal(validation.exportEnabled, false);
  assert.equal(validation.transductionEnabled, false);
  assert.equal(validation.registryEnabled, false);
  assert.equal(validation.parallelProductionEnabled, false);
  assert.equal(comparison.activeIntact, true);
  assert.equal(comparison.candidateAddsB6_6_8ToB6Q38, true);
  assert.equal(comparison.candidateAddsTrenchPhraseToB6Q38, true);
});

test("QA compare did not modify forbidden tracked product paths", (t) => {
  const changed = gitDiffNameOnly([
    "src/app",
    "src/app/api",
    "docs/runtime",
    "package.json",
    activeCatalogPath,
    activeManifestPath,
    candidateCatalogPath,
    candidateManifestPath,
  ]);

  if (changed === null) {
    t.skip("GIT_CONTEXT_BLOCKED");
    return;
  }

  assert.deepEqual(changed, [], "Forbidden tracked product paths must be clean.");
});
