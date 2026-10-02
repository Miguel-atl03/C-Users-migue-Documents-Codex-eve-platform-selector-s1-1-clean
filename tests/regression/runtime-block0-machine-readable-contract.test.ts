import { register } from "node:module";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../..");
const hookPath = join(tmpdir(), "eve-runtime-block0-machine-readable-hook.mjs");

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

const validatorModule = await import("@/features/runtime/block0/block0.catalog.validator");
const { validateBlock0Catalog } = validatorModule;

const CATALOG_PATH = "src/features/runtime/block0/block0.catalog.json";
const MANIFEST_PATH = "src/features/runtime/catalog/runtime-40-20.manifest.json";
const EXACT_BLOCK0_IDS = ["B0-Q01", "B0-Q02", "B0-Q03", "B0-Q04"];
const PROHIBITED_VISIBLE_PATTERNS = [
  /Bloque 0/i,
  /\bruntime\b/i,
  /\bMMABP\b/i,
  /\bVSM\b/i,
  /\bpayload\b/i,
  /\bgates\b/i,
  /\bscore\b/i,
];

type CatalogInteraction = {
  runtimeInteractionId: string;
  questionText: string;
  helpText: string;
  technicalLabel?: string;
  subfields: unknown[];
  sourceSheetRefs: Array<{ sourceSheet?: string; sourceColumns?: unknown[] }>;
};

function readJson(path: string): unknown {
  assert.equal(existsSync(path), true, `Missing file: ${path}`);
  return JSON.parse(readFileSync(path, "utf8"));
}

function readCatalog(): { interactions: CatalogInteraction[] } {
  const catalog = readJson(CATALOG_PATH) as { interactions: CatalogInteraction[] };
  assert.ok(Array.isArray(catalog.interactions));
  return catalog;
}

test("block0 catalog json exists", () => {
  assert.equal(existsSync(CATALOG_PATH), true);
});

test("catalog contains exactly B0-Q01 through B0-Q04", () => {
  const catalog = readCatalog();

  assert.deepEqual(
    catalog.interactions.map((interaction) => interaction.runtimeInteractionId),
    EXACT_BLOCK0_IDS,
  );
});

test("validateBlock0Catalog passes", () => {
  const result = validateBlock0Catalog(readJson(CATALOG_PATH));

  assert.equal(result.valid, true, result.errors.join("\n"));
});

test("B0-Q01 and B0-Q03 have subfields", () => {
  const interactions = new Map(
    readCatalog().interactions.map((interaction) => [
      interaction.runtimeInteractionId,
      interaction,
    ]),
  );

  assert.ok((interactions.get("B0-Q01")?.subfields.length ?? 0) > 0);
  assert.ok((interactions.get("B0-Q03")?.subfields.length ?? 0) > 0);
});

test("technicalLabel is not used as helpText", () => {
  for (const interaction of readCatalog().interactions) {
    assert.notEqual(interaction.helpText, interaction.technicalLabel);
  }
});

test("questionText and helpText avoid internal terms", () => {
  for (const interaction of readCatalog().interactions) {
    const visibleCopy = `${interaction.questionText}\n${interaction.helpText}`;

    for (const pattern of PROHIBITED_VISIBLE_PATTERNS) {
      assert.equal(
        pattern.test(visibleCopy),
        false,
        `${interaction.runtimeInteractionId} leaks ${pattern}`,
      );
    }
  }
});

test("source refs exist", () => {
  for (const interaction of readCatalog().interactions) {
    assert.ok(interaction.sourceSheetRefs.length > 0);
    assert.ok(
      interaction.sourceSheetRefs.every(
        (sourceRef) =>
          typeof sourceRef.sourceSheet === "string" &&
          Array.isArray(sourceRef.sourceColumns) &&
          sourceRef.sourceColumns.length > 0,
      ),
    );
  }
});

test("manifest references block0 catalog and marks full runtime as partial", () => {
  const manifest = readJson(MANIFEST_PATH) as {
    blocks: Array<{ blockId: string; catalogJson: string; status: string }>;
    fullRuntimeCatalogStatus: string;
    notYetMachineReadable: string[];
  };
  const block0 = manifest.blocks.find((block) => block.blockId === "B0");

  assert.ok(block0);
  assert.equal(block0.catalogJson, CATALOG_PATH);
  assert.equal(block0.status, "machine_readable_partial");
  assert.equal(manifest.fullRuntimeCatalogStatus, "machine_readable_partial");
  assert.ok(manifest.notYetMachineReadable.includes("B0.5"));
});
