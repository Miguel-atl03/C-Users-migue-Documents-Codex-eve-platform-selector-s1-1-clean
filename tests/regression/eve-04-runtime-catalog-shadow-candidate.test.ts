import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const ACTIVE_DIR = "docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1";
const CANDIDATE_DIR =
  "docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate";

const ACTIVE_MANIFEST = `${ACTIVE_DIR}/EVE_04_Runtime_Catalog_v0_1.manifest.json`;
const ACTIVE_JSON = `${ACTIVE_DIR}/EVE_04_Runtime_Catalog_v0_1.json`;

const CANDIDATE_MANIFEST_STRICT = `${CANDIDATE_DIR}/EVE_04_Runtime_Catalog_v0_1_1_candidate.manifest.json`;
const CANDIDATE_JSON_STRICT = `${CANDIDATE_DIR}/EVE_04_Runtime_Catalog_v0_1_1_candidate.json`;
const CANDIDATE_MANIFEST_ALIAS = `${CANDIDATE_DIR}/EVE_04_Runtime_Catalog_v0_1.manifest.json`;
const CANDIDATE_JSON_ALIAS = `${CANDIDATE_DIR}/EVE_04_Runtime_Catalog_v0_1.json`;

const APPLY_CCOV = "docs/audits/EVE_RUNTIME_CATALOG_SURGICAL_PATCH_01_APPLY_CCOV.md";
const PATCH_DIFF = "docs/audits/_eve_runtime_catalog_surgical_patch_01_patch_diff.json";

const ACTIVE_JSON_SHA256 =
  "df4674d5156d3747b6baf5906233c5b3d54378abd099870a5c0325f102c26dc0";

function readText(path: string) {
  return readFileSync(path, "utf8");
}

function readJson(path: string) {
  return JSON.parse(readText(path)) as Record<string, unknown>;
}

function sha256File(path: string) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

test("mandatory audit sources exist", () => {
  for (const path of [ACTIVE_MANIFEST, APPLY_CCOV, PATCH_DIFF]) {
    assert.equal(existsSync(path), true, `Missing ${path}`);
  }
});

test("strict candidate filenames from shadow connect spec", () => {
  assert.equal(
    existsSync(CANDIDATE_MANIFEST_STRICT),
    true,
    "Strict manifest filename must exist after filename normalization",
  );
  assert.equal(
    existsSync(CANDIDATE_JSON_STRICT),
    true,
    "Strict json filename must exist after filename normalization",
  );
  assert.equal(existsSync(CANDIDATE_MANIFEST_ALIAS), true);
  assert.equal(existsSync(CANDIDATE_JSON_ALIAS), true);
});

test("active chip v0.1 exists and candidate chip v0.1.1 folder exists", () => {
  assert.equal(existsSync(ACTIVE_DIR), true);
  assert.equal(existsSync(ACTIVE_JSON), true);
  assert.equal(existsSync(CANDIDATE_DIR), true);
  assert.equal(existsSync(CANDIDATE_JSON_ALIAS), true);
  assert.equal(existsSync(CANDIDATE_MANIFEST_ALIAS), true);
});

test("candidate contains CCOV-001 evidence: B6-Q38, B6_6_8, trench_phrase", () => {
  const candidate = readJson(CANDIDATE_JSON_STRICT);
  const serialized = JSON.stringify(candidate);

  assert.match(serialized, /B6-Q38/);
  assert.match(serialized, /B6_6_8/);
  assert.match(serialized, /trench_phrase/);
});

test("candidate manifest states NOT_CERTIFIED, READY_WITH_FLAGS and CVAR-001 open", () => {
  const manifest = readJson(CANDIDATE_MANIFEST_STRICT);

  assert.equal(manifest.certification_status, "NOT_CERTIFIED");
  assert.equal(manifest.status, "READY_WITH_FLAGS");

  const flags = manifest.flags as Array<Record<string, unknown>>;
  const cvar = flags.find((flag) => flag.flag_id === "CVAR-001");
  assert.ok(cvar);
  assert.match(String(cvar?.status), /OPEN/);

  const patchMetadata = manifest.patch_metadata as Record<string, unknown>;
  assert.equal(patchMetadata.certification_status, "NOT_CERTIFIED");
  assert.equal(patchMetadata.readiness_status, "READY_WITH_FLAGS");
  assert.match(String(patchMetadata.cvar_001_status), /OPEN/);
});

test("active chip v0.1 json hash unchanged from packaged manifest", () => {
  assert.equal(sha256File(ACTIVE_JSON), ACTIVE_JSON_SHA256);
});

test("no product promotion or forbidden wiring in src/app", () => {
  const page = readText("src/app/page.tsx");
  assert.doesNotMatch(page, /EVE_04_Runtime_Catalog_v0_1_1_candidate/);
  assert.doesNotMatch(page, /shadow_runtime_catalog_candidate/);
});

test("no API promotion of candidate catalog", () => {
  const catalogRoute = readText("src/app/api/questionnaire/catalog/route.ts");
  assert.doesNotMatch(catalogRoute, /EVE_04_Runtime_Catalog/);
  assert.doesNotMatch(catalogRoute, /v0_1_1_candidate/);
});

test("package.json and docs/runtime not modified by this preflight task", () => {
  const pkg = readText("package.json");
  assert.doesNotMatch(pkg, /EVE_04_Runtime_Catalog_v0_1_1_candidate/);

  const runtimeManifest = readText("src/runtime/capa1-runtime-manifest.ts");
  assert.doesNotMatch(runtimeManifest, /EVE_04_Runtime_Catalog_v0_1_1_candidate/);
});

test("rector registry has no EVE04 shadow candidate authority", async () => {
  const registry = readText("src/config/rector-docs-registry.ts");
  assert.doesNotMatch(registry, /EVE_04_Runtime_Catalog/);
  assert.doesNotMatch(registry, /v0_1_1_candidate/);
  assert.doesNotMatch(registry, /shadow_runtime_catalog_candidate/);
});

test("no productive promotion flags in candidate manifest", () => {
  const manifest = readJson(CANDIDATE_MANIFEST_STRICT);
  const patchMetadata = manifest.patch_metadata as Record<string, unknown>;

  assert.equal(patchMetadata.product_mutation, false);
  assert.equal(patchMetadata.runtime_authority, false);
  assert.equal(patchMetadata.diagnosis_enabled, false);
  assert.equal(patchMetadata.export_enabled, false);
  assert.equal(patchMetadata.registry_write_enabled, false);
});
