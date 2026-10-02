import { register } from "node:module";
import { existsSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { test } from "node:test";
import type { RectorDocRegistryEntry } from "../../src/config/rector-docs-registry.ts";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../..");
const hookPath = join(tmpdir(), "eve-rector-docs-registry-hook.mjs");

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

const registryModule = await import("@/config/rector-docs-registry");
const { RECTOR_DOCS_REGISTRY, getRectorDocRegistryEntry } = registryModule;

test("rector docs registry exists", () => {
  assert.equal(existsSync("src/config/rector-docs-registry.ts"), true);
  assert.ok(RECTOR_DOCS_REGISTRY.length >= 5);
});

test("primary activity selection v1.3 is runtime authority", () => {
  const entry = getRectorDocRegistryEntry("primary_activity_selection_v1_3");

  assert.ok(entry);
  assert.equal(entry.runtimeAuthority, true);
  assert.equal(
    entry.executableTs,
    "src/domain/primary-activity-selection-policy.v1.3.ts",
  );
  assert.ok(entry.tests.includes("tests/regression/primary-activity-selection-policy.test.ts"));
});

test("XLSX v1.2 is not executable runtime authority", () => {
  const entry = getRectorDocRegistryEntry("primary_activity_selection_v1_3");

  assert.ok(entry);
  assert.equal(/v1_2.*\.xlsx/i.test(entry.executableTs ?? ""), false);
  assert.ok(
    entry.notes?.includes("deprecated editorial antecedent"),
    "v1.2 should be documented only as deprecated editorial antecedent",
  );
});

test("runtime authority entries have tests and a machine-readable counterpart", () => {
  for (const entry of RECTOR_DOCS_REGISTRY) {
    if (!entry.runtimeAuthority) {
      continue;
    }

    assert.ok(entry.tests.length > 0, `${entry.id} must list tests`);
    assert.ok(
      (entry as RectorDocRegistryEntry).executableTs ||
        (entry as RectorDocRegistryEntry).machineReadableJson,
      `${entry.id} needs .ts or .json counterpart`,
    );
  }
});

test("runtime 40/20 full catalog is not marked complete", () => {
  const entry = getRectorDocRegistryEntry("runtime_40_20_full_catalog");

  assert.ok(entry);
  assert.equal(entry.runtimeAuthority, false);
  assert.equal(entry.status, "machine_readable_partial");
  assert.match(entry.notes ?? "", /not yet fully materialized/i);
});

test("docx or xlsx entries cannot be runtime authority without ts or json", () => {
  for (const entry of RECTOR_DOCS_REGISTRY) {
    const hasEditorialOfficeSource = entry.editorialSources.some((source) =>
      /\.(docx|xlsx)$/i.test(source),
    );

    if (hasEditorialOfficeSource && entry.runtimeAuthority) {
      assert.ok(
        (entry as RectorDocRegistryEntry).executableTs ||
          (entry as RectorDocRegistryEntry).machineReadableJson,
        `${entry.id} cannot rely on DOCX/XLSX alone`,
      );
    }
  }
});
