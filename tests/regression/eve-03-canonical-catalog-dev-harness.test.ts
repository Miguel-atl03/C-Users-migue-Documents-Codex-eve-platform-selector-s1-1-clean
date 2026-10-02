import { register } from "node:module";
import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import test from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../..");
const hookPath = join(tmpdir(), "eve-canonical-catalog-dev-harness-path-hook.mjs");

writeFileSync(
  hookPath,
  `import { pathToFileURL } from "node:url";
import { resolve as resolvePath } from "node:path";

const projectRoot = ${JSON.stringify(projectRoot)};

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    let mappedPath = resolvePath(projectRoot, "src", specifier.slice(2));
    if (!/\\.(tsx?|jsx?|mjs|cjs)$/.test(mappedPath)) {
      mappedPath += ".ts";
    }
    return {
      shortCircuit: true,
      url: pathToFileURL(mappedPath).href,
    };
  }
  return nextResolve(specifier, context);
}
`,
);

register(pathToFileURL(hookPath).href, import.meta.url);

const routePath = "src/app/dev/canonical-catalog-shadow/page.tsx";
const fixturesPath = "src/features/dev/canonical-catalog-shadow-fixtures.ts";
const productionPagePath = "src/app/page.tsx";

const REQUIRED_FIXTURE_IDS = [
  "resolve_existing_node",
  "resolve_missing_node",
  "resolve_existing_canonical_variable",
  "referenced_canonical_variable_not_defined",
  "validate_node_variable_map_valid",
  "validate_node_variable_map_missing_variable",
  "validate_existing_critical_route",
  "validate_missing_critical_route",
  "epistemic_policy_allows_confirmed_evidence",
  "epistemic_policy_blocks_unconfirmed_ai_as_hard_evidence",
  "vsm_guard_lookup",
] as const;

function source(path: string) {
  return readFileSync(path, "utf8");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("dev harness route and fixtures helper exist", () => {
  assert.equal(existsSync(routePath), true);
  assert.equal(existsSync(fixturesPath), true);
  assert.match(source(routePath), /buildCanonicalCatalogShadowHarness/);
  assert.match(source(fixturesPath), /buildFixtureDefinitionsFromSnapshot/);
});

test("dev harness renders required labels, counters and fixture ids", () => {
  const route = source(routePath);
  const fixtures = source(fixturesPath);

  for (const requiredText of [
    "EVE-03 Canonical Catalog Shadow",
    "DEV HARNESS ONLY",
    "NOT PRODUCTIVE UI",
    "runtimeAuthority",
    "registryWrite",
    "productWiring",
    "expectedReadinessState",
    "actualReadinessState",
    "MATCH",
    "safetyFlags",
    "sourceTrace",
    "gapFlags",
    "Living gap",
    "No-cableado",
    "total nodes",
    "total source codes",
    "total canonical variables",
    "total node-variable mappings",
    "total critical routes",
    "CANONICAL_VARIABLES_REFERENCED_NOT_DEFINED",
  ]) {
    assert.match(route, new RegExp(escapeRegExp(requiredText)));
  }

  assert.match(fixtures, /still_open_non_blocking/);
  assert.match(fixtures, /totalNodes: 164/);
  assert.match(fixtures, /totalSourceCodes: 164/);
  assert.match(fixtures, /totalCanonicalVariables: 257/);
  assert.match(fixtures, /totalNodeVariableMappings: 213/);
  assert.match(fixtures, /totalCriticalRoutes: 4/);
  assert.match(fixtures, /referencedNotDefined: 33/);

  for (const fixtureId of REQUIRED_FIXTURE_IDS) {
    assert.match(fixtures, new RegExp(`fixtureId: "${fixtureId}"`));
  }

  assert.match(route, /fixture\.fixtureId/);
  assert.match(route, /CANONICAL_CATALOG_SHADOW_FIXTURE_IDS/);
});

test("dev harness does not import forbidden systems or side effects", () => {
  const route = source(routePath);
  const fixtures = source(fixturesPath);

  for (const forbidden of [
    /from\s+["']@supabase/i,
    /from\s+["'].*supabase/i,
    /createClient\s*\(/i,
    /fetch\s*\(/i,
    /\bPOST\b/,
    /registry\.write/i,
    /from\s+["']@\/components/i,
    /from\s+["']@\/services\/work-map/i,
    /from\s+["']@\/services\/significado/i,
  ]) {
    assert.doesNotMatch(fixtures, forbidden);
    assert.doesNotMatch(route, forbidden);
  }
});

test("production page is not modified to link dev harness", () => {
  const productionPage = source(productionPagePath);
  assert.doesNotMatch(productionPage, /canonical-catalog-shadow/);
});

test("dev harness keeps safety flags and authority disabled in source", () => {
  const route = source(routePath);
  const fixtures = source(fixturesPath);
  const combined = `${route}\n${fixtures}`;

  assert.doesNotMatch(combined, /runtimeAuthority:\s*true/);
  assert.doesNotMatch(combined, /canWriteRegistry:\s*true/);
  assert.doesNotMatch(combined, /canModifyPayload:\s*true/);
  assert.doesNotMatch(combined, /canModifyCatalog:\s*true/);
  assert.doesNotMatch(combined, /canTriggerRuntime:\s*true/);
  assert.doesNotMatch(combined, /canTriggerDiagnosis:\s*true/);
  assert.doesNotMatch(combined, /canTriggerExport:\s*true/);
});

test("harness fixtures evaluate with MATCH against real catalog snapshot", async () => {
  const { buildCanonicalCatalogShadowHarness } = await import(
    "@/features/dev/canonical-catalog-shadow-fixtures"
  );

  const harness = buildCanonicalCatalogShadowHarness();

  assert.equal(harness.fixtures.length, 11);
  assert.equal(harness.allFixturesMatch, true);
  assert.equal(harness.counters.totalNodes, 164);
  assert.equal(harness.counters.totalSourceCodes, 164);
  assert.equal(harness.counters.totalCanonicalVariables, 257);
  assert.equal(harness.counters.totalNodeVariableMappings, 213);
  assert.equal(harness.counters.totalCriticalRoutes, 4);
  assert.equal(harness.counters.referencedNotDefined, 33);
  assert.equal(harness.runtimeAuthority, false);
  assert.equal(harness.registryWrite, false);
  assert.equal(harness.productWiring, false);

  for (const fixture of harness.fixtures) {
    assert.equal(fixture.match, true, fixture.fixtureId);
    assert.equal(fixture.result.safetyFlags.canBlockUserFlow, false);
  }
});
