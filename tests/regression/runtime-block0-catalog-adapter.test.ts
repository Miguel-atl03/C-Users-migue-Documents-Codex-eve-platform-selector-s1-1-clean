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
const hookPath = join(tmpdir(), "eve-runtime-block0-catalog-adapter-hook.mjs");

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

const adapterModule = await import("@/services/runtime-block0-catalog-adapter");

const {
  getRuntimeBlock0InteractionById,
  getRuntimeBlock0InteractionViewModels,
} = adapterModule;

const DOMAIN_CONTRACT_PATH = "src/domain/runtime-interaction-view-model.ts";
const ADAPTER_PATH = "src/services/runtime-block0-catalog-adapter.ts";
const SNAPSHOT_PATH = "src/features/runtime/block0-catalog-snapshot.ts";

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

function readText(path: string) {
  assert.equal(existsSync(path), true, `Missing file: ${path}`);
  return readFileSync(path, "utf8");
}

test("returns exactly four Block0 interactions with exact ids", () => {
  const interactions = getRuntimeBlock0InteractionViewModels();

  assert.equal(interactions.length, 4);
  assert.deepEqual(
    interactions.map((interaction) => interaction.runtimeInteractionId),
    EXACT_BLOCK0_IDS,
  );
});

test("all interactions expose visible question text, ui component and source refs", () => {
  const interactions = getRuntimeBlock0InteractionViewModels();

  for (const interaction of interactions) {
    assert.ok(interaction.questionText.trim().length > 0);
    assert.ok(interaction.uiComponent.trim().length > 0);
    assert.ok(interaction.sourceSheetRefs.length > 0);
    assert.ok(
      interaction.sourceSheetRefs.every(
        (sourceSheetRef) => sourceSheetRef.sourceColumns.length > 0,
      ),
    );
  }
});

test("B0-Q01 and B0-Q03 keep separable subfields", () => {
  const q01 = getRuntimeBlock0InteractionById("B0-Q01");
  const q03 = getRuntimeBlock0InteractionById("B0-Q03");

  assert.ok(q01);
  assert.ok(q03);
  assert.deepEqual(
    q01.subfields.map((subfield) => subfield.id),
    [
      "action_verb",
      "input_or_object",
      "procedure_or_standard",
      "output_or_result",
      "user_correction_note",
    ],
  );
  assert.deepEqual(
    q03.subfields.map((subfield) => subfield.id),
    ["frequency_base", "typical_context", "primary_actor_scope"],
  );
});

test("function is not used as helpText for B0-Q02, B0-Q03 or B0-Q04", () => {
  const technicalLabelsById = new Map(
    getRuntimeBlock0InteractionViewModels().map((interaction) => [
      interaction.runtimeInteractionId,
      interaction.technicalLabel,
    ]),
  );

  for (const id of ["B0-Q02", "B0-Q03", "B0-Q04"]) {
    const interaction = getRuntimeBlock0InteractionById(id);
    assert.ok(interaction);
    assert.notEqual(interaction.helpText, technicalLabelsById.get(id));
    assert.equal(interaction.canonicalHelpStatus, "CANONICAL_HELP_MISSING");
    assert.equal(interaction.helpTextKind, "fallback_no_canonico");
  }
});

test("helpTextKind distinguishes canonical from fallback_no_canonico", () => {
  const interactions = getRuntimeBlock0InteractionViewModels();
  const helpKindsById = new Map(
    interactions.map((interaction) => [
      interaction.runtimeInteractionId,
      interaction.helpTextKind,
    ]),
  );

  assert.equal(helpKindsById.get("B0-Q01"), "canonical");
  assert.equal(helpKindsById.get("B0-Q02"), "fallback_no_canonico");
  assert.equal(helpKindsById.get("B0-Q03"), "fallback_no_canonico");
  assert.equal(helpKindsById.get("B0-Q04"), "fallback_no_canonico");
});

test("questionText and helpText do not expose internal terms", () => {
  for (const interaction of getRuntimeBlock0InteractionViewModels()) {
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

test("adapter keeps runtimeOrder ordering and does not mutate snapshot", () => {
  const firstRead = getRuntimeBlock0InteractionViewModels();
  firstRead[0].runtimeOrder = 99;
  firstRead[0].subfields[0].label = "MUTATED";

  const secondRead = getRuntimeBlock0InteractionViewModels();

  assert.deepEqual(
    secondRead.map((interaction) => interaction.runtimeOrder),
    [1, 2, 3, 4],
  );
  assert.equal(secondRead[0].subfields[0].label, "Qué haces");
});

test("adapter has no API, Supabase or database dependency", () => {
  const source = readText(ADAPTER_PATH);

  assert.equal(/supabase/i.test(source), false);
  assert.equal(/from ["']@\/app\/api/.test(source), false);
  assert.equal(/fetch\(/.test(source), false);
  assert.equal(/\bdb\b|database|sql/i.test(source), false);
});

test("critical runtime contract avoids loose any", () => {
  const contractSource = readText(DOMAIN_CONTRACT_PATH);
  const adapterSource = readText(ADAPTER_PATH);
  const snapshotSource = readText(SNAPSHOT_PATH);

  assert.equal(/\bany\b/.test(contractSource), false);
  assert.equal(/\bany\b/.test(adapterSource), false);
  assert.equal(/\bany\b/.test(snapshotSource), false);
});
