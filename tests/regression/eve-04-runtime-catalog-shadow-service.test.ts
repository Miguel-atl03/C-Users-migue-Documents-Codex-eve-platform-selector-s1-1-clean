import assert from "node:assert/strict";
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

const SERVICE_PATH = "src/services/eve-04-runtime-catalog-shadow-service.ts";
const TEST_PATH = "tests/regression/eve-04-runtime-catalog-shadow-service.test.ts";

const ACTIVE_CATALOG_PATH =
  "docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1/EVE_04_Runtime_Catalog_v0_1.json";
const ACTIVE_MANIFEST_PATH =
  "docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1/EVE_04_Runtime_Catalog_v0_1.manifest.json";
const CANDIDATE_CATALOG_PATH =
  "docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1_1_candidate.json";
const CANDIDATE_MANIFEST_PATH =
  "docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1_1_candidate.manifest.json";

const ACTIVE_CATALOG_SHA256 =
  "df4674d5156d3747b6baf5906233c5b3d54378abd099870a5c0325f102c26dc0";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function readText(path: string) {
  assert.equal(existsSync(path), true, `Missing ${path}`);
  return readFileSync(path, "utf8");
}

function gitLines(command: string): string[] | null {
  const repoRoot = resolve(projectRoot, "../..");

  try {
    return execSync(`git -C "${repoRoot}" ${command}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch (error) {
    const message = String(error);
    if (
      message.includes("dubious ownership") ||
      message.includes("not a git repository") ||
      message.includes("Not a git repository")
    ) {
      return null;
    }
    throw error;
  }
}

test("shadow service file exists", () => {
  assert.equal(existsSync(SERVICE_PATH), true);
});

test("shadow service exports required loaders and validators", () => {
  assert.equal(typeof loadEve04RuntimeCatalogActive, "function");
  assert.equal(typeof loadEve04RuntimeCatalogCandidate, "function");
  assert.equal(typeof validateEve04RuntimeCatalogCandidateShadow, "function");
  assert.equal(typeof compareEve04RuntimeCatalogActiveVsCandidate, "function");
});

test("active loads from v0.1 paths", () => {
  const active = loadEve04RuntimeCatalogActive({ repoRoot: projectRoot });

  assert.equal(active.catalogPath, ACTIVE_CATALOG_PATH);
  assert.equal(active.manifestPath, ACTIVE_MANIFEST_PATH);
  assert.equal(active.catalogSha256, ACTIVE_CATALOG_SHA256);
});

test("candidate loads from v0.1.1_candidate paths", () => {
  const candidate = loadEve04RuntimeCatalogCandidate({ repoRoot: projectRoot });

  assert.equal(candidate.catalogPath, CANDIDATE_CATALOG_PATH);
  assert.equal(candidate.manifestPath, CANDIDATE_MANIFEST_PATH);
});

test("active and candidate paths are distinct", () => {
  const active = loadEve04RuntimeCatalogActive({ repoRoot: projectRoot });
  const candidate = loadEve04RuntimeCatalogCandidate({ repoRoot: projectRoot });

  assert.notEqual(active.catalogPath, candidate.catalogPath);
  assert.notEqual(active.manifestPath, candidate.manifestPath);
});

test("candidate contains B6-Q38, B6_6_8 and trench_phrase", () => {
  const candidate = loadEve04RuntimeCatalogCandidate({ repoRoot: projectRoot });
  const serialized = JSON.stringify(candidate.catalog);

  assert.match(serialized, /B6-Q38/);
  assert.match(serialized, /B6_6_8/);
  assert.match(serialized, /trench_phrase/);
});

test("validateEve04RuntimeCatalogCandidateShadow reports shadow safety envelope", () => {
  const validation = validateEve04RuntimeCatalogCandidateShadow({
    repoRoot: projectRoot,
  });

  assert.equal(validation.shadowMode, true);
  assert.equal(validation.runtimeAuthority, false);
  assert.equal(validation.productionPromotion, false);
  assert.equal(validation.activeExists, true);
  assert.equal(validation.candidateExists, true);
  assert.equal(validation.activeReplaced, false);
  assert.equal(validation.candidateContainsB6Q38, true);
  assert.equal(validation.candidateContainsB6_6_8, true);
  assert.equal(validation.candidateContainsTrenchPhrase, true);
  assert.equal(validation.ccov001Status, "RESOLVED_IN_CANDIDATE");
  assert.equal(validation.cvar001Status, "OPEN_PENDING_SOURCE_GAP");
  assert.equal(validation.readinessStatus, "READY_WITH_FLAGS");
  assert.equal(validation.certificationStatus, "NOT_CERTIFIED");
  assert.equal(validation.diagnosisEnabled, false);
  assert.equal(validation.exportEnabled, false);
  assert.equal(validation.transductionEnabled, false);
  assert.equal(validation.registryEnabled, false);
  assert.equal(validation.parallelProductionEnabled, false);
});

test("compareEve04RuntimeCatalogActiveVsCandidate reports candidate delta without replacing active", () => {
  const comparison = compareEve04RuntimeCatalogActiveVsCandidate({
    repoRoot: projectRoot,
  });

  assert.equal(comparison.pathsDistinct, true);
  assert.equal(comparison.candidateAddsB6_6_8ToB6Q38, true);
  assert.equal(comparison.candidateAddsTrenchPhraseToB6Q38, true);
  assert.equal(comparison.activeIntact, true);
  assert.equal(comparison.activeCatalogSha256, ACTIVE_CATALOG_SHA256);
  assert.equal(comparison.candidateNotCertified, true);
  assert.equal(comparison.cvar001Open, true);
  assert.equal(comparison.ccov001ResolvedInCandidate, true);
  assert.equal(comparison.certificationStatus, "NOT_CERTIFIED");
  assert.equal(comparison.readinessStatus, "READY_WITH_FLAGS");
  assert.equal(comparison.cvar001Status, "OPEN_PENDING_SOURCE_GAP");
  assert.equal(comparison.ccov001Status, "RESOLVED_IN_CANDIDATE");
});

test("shadow service avoids forbidden productive imports", () => {
  const source = readText(SERVICE_PATH);

  for (const forbidden of [
    /from\s+["']@\/app/,
    /from\s+["'][^"']*src\/app/,
    /from\s+["'][^"']*src\/app\/api/,
    /Supabase/,
    /capa1-runtime-manifest/,
    /rector-docs-registry/,
    /questionnaire\/catalog/,
    /\bfetch\s*\(/,
    /writeFile/,
    /appendFile/,
  ]) {
    assert.doesNotMatch(source, forbidden);
  }
});

test("git diff stays within shadow service allowlist", (t) => {
  const changed = gitLines("diff --name-only");
  const untracked = gitLines("ls-files --others --exclude-standard");

  if (changed === null || untracked === null) {
    t.skip("GIT_CONTEXT_BLOCKED: git status unavailable in this environment");
    return;
  }
  const touched = [...changed, ...untracked];

  const allowed = new Set([
    SERVICE_PATH,
    TEST_PATH,
    "docs/audits/EVE04_SHADOW_CONNECTION_SERVICE_ONLY.md",
    "docs/audits/_eve04_shadow_connection_service_only.json",
  ]);

  const prefix = "external-consumers/eve-platform/";

  for (const path of touched) {
    const normalized = path.startsWith(prefix) ? path.slice(prefix.length) : path;
    assert.ok(
      allowed.has(normalized),
      `Scope violation: ${path} is outside the shadow service allowlist`,
    );
  }

  for (const forbiddenPath of [
    "package.json",
    "src/app/page.tsx",
    ACTIVE_CATALOG_PATH,
    CANDIDATE_CATALOG_PATH,
  ]) {
    const forbiddenMatches = touched.some(
      (path) =>
        path === forbiddenPath ||
        path.endsWith(`/${forbiddenPath}`) ||
        path.endsWith(`\\${forbiddenPath}`),
    );
    assert.ok(!forbiddenMatches, `${forbiddenPath} must not be touched`);
  }

  const docsRuntimeTouched = touched.some((path) => path.startsWith("docs/runtime/"));
  assert.equal(docsRuntimeTouched, false, "docs/runtime must not appear in git diff");

  const apiTouched = touched.some((path) => path.startsWith("src/app/api/"));
  assert.equal(apiTouched, false, "APIs must not appear in git diff");
});
