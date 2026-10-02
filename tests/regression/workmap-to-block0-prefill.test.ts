import { register } from "node:module";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../..");
const hookPath = join(tmpdir(), "eve-workmap-block0-prefill-path-hook.mjs");

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

const prefillModule = await import("@/services/workmap-to-block0-prefill");
const runtimeBlock0Module = await import("@/features/significado/runtime-block0-canonical");
const boundaryModule = await import(
  "@/services/operational-description-coach/infer-activity-boundary"
);
const devFixtureModule = await import("@/features/significado/significado-dev-fixture");
const primarySelectorModule = await import("@/services/primary-activity-selector");

const {
  assertWorkMapPrefillEpistemicContract,
  buildInitialBlock0VisualDraftFromWorkMap,
} = prefillModule;
const { buildBlock0AnswerKey, createEmptyBlock0Answers } = runtimeBlock0Module;
const { isActivityBoundaryQuestionComplete } = boundaryModule;
const { createSignificadoDevWorkMap } = devFixtureModule;
const { selectPrimaryActivitiesFromWorkMap } = primarySelectorModule;

const FULL_ACTIVITY_LITERAL =
  "Mido las dimensiones de la pieza producida con el calibrador digital para validar tolerancia.";

function buildPrefillInput(
  activityLiteral = FULL_ACTIVITY_LITERAL,
  overrides: Partial<Parameters<typeof buildInitialBlock0VisualDraftFromWorkMap>[0]> = {},
) {
  const workMap = createSignificadoDevWorkMap();
  const selection = selectPrimaryActivitiesFromWorkMap(workMap);
  const primaryActivity = {
    ...selection.selectedPrimaryActivities[0],
    activityLiteral,
  };

  return buildInitialBlock0VisualDraftFromWorkMap({
    workMap,
    primaryActivity,
    ...overrides,
  });
}

test("structured activity produces B0-Q01 subfields", () => {
  const result = buildPrefillInput();

  assert.ok(result.visualDraft[buildBlock0AnswerKey("B0-Q01", "action_verb")]?.trim());
  assert.ok(result.visualDraft[buildBlock0AnswerKey("B0-Q01", "input_or_object")]?.trim());
  assert.ok(
    result.visualDraft[buildBlock0AnswerKey("B0-Q01", "procedure_or_standard")]?.trim(),
  );
  assert.ok(result.visualDraft[buildBlock0AnswerKey("B0-Q01", "output_or_result")]?.trim());
});

test("verb is inferred_from_workmap", () => {
  const result = buildPrefillInput();
  assert.equal(
    result.epistemicByAnswerKey[buildBlock0AnswerKey("B0-Q01", "action_verb")],
    "inferred_from_workmap",
  );
});

test("object is inferred_from_workmap", () => {
  const result = buildPrefillInput();
  assert.equal(
    result.epistemicByAnswerKey[buildBlock0AnswerKey("B0-Q01", "input_or_object")],
    "inferred_from_workmap",
  );
});

test("rule is context_from_workmap", () => {
  const result = buildPrefillInput();
  assert.equal(
    result.epistemicByAnswerKey[buildBlock0AnswerKey("B0-Q01", "procedure_or_standard")],
    "context_from_workmap",
  );
});

test("output is inferred_from_workmap", () => {
  const result = buildPrefillInput();
  assert.equal(
    result.epistemicByAnswerKey[buildBlock0AnswerKey("B0-Q01", "output_or_result")],
    "inferred_from_workmap",
  );
});

test("prefill does not emit captured_user_evidence", () => {
  const result = buildPrefillInput();
  assert.doesNotThrow(() => assertWorkMapPrefillEpistemicContract(result.epistemicByAnswerKey));
  assert.equal(
    Object.values(result.epistemicByAnswerKey).includes("captured_user_evidence" as never),
    false,
  );
});

test("prefill does not emit user_confirmed_suggestion before confirmation", () => {
  const result = buildPrefillInput();
  assert.equal(
    Object.values(result.epistemicByAnswerKey).includes("user_confirmed_suggestion" as never),
    false,
  );
});

test("frequency is not inferred without explicit WorkMap field", () => {
  const result = buildPrefillInput();
  assert.equal(result.visualDraft[buildBlock0AnswerKey("B0-Q03", "frequency_base")] ?? "", "");
});

test("variation context is not inferred", () => {
  const result = buildPrefillInput();
  assert.equal(result.visualDraft[buildBlock0AnswerKey("B0-Q03", "typical_context")] ?? "", "");
});

test("functional role is not used as confirmed immediate actor", () => {
  const result = buildPrefillInput();
  assert.equal(
    result.visualDraft[buildBlock0AnswerKey("B0-Q03", "primary_actor_scope")] ?? "",
    "",
  );
});

test("WorkMap activity literal is not copied into B0-Q02", () => {
  const result = buildPrefillInput();
  assert.equal(result.visualDraft[buildBlock0AnswerKey("B0-Q02")] ?? "", "");
});

test("B0-Q04 is not confirmed by WorkMap prefill", () => {
  const result = buildPrefillInput();
  const merged = {
    ...createEmptyBlock0Answers(),
    ...result.visualDraft,
  };

  assert.equal(isActivityBoundaryQuestionComplete(merged), false);
  assert.equal(result.visualDraft[buildBlock0AnswerKey("B0-Q04")] ?? "", "");
});

test("output presentation removes leading purpose connectors", () => {
  const { normalizeWorkMapOutputPresentation } = prefillModule;
  assert.equal(
    normalizeWorkMapOutputPresentation(
      "para entregar un documento de criterios vigentes al equipo de presupuestos",
    ),
    "documento de criterios vigentes para el equipo de presupuestos",
  );
  assert.equal(
    normalizeWorkMapOutputPresentation("para validar tolerancia"),
    "tolerancia",
  );
});

test("builder tolerates poor activity without breaking output shape", () => {
  const result = buildPrefillInput("Reviso expedientes");

  assert.doesNotThrow(() => assertWorkMapPrefillEpistemicContract(result.epistemicByAnswerKey));
  assert.equal(typeof result.visualDraft, "object");
  assert.equal(result.visualDraft[buildBlock0AnswerKey("B0-Q02")] ?? "", "");
});

test("block0 dev fixture prefill fills B0-Q01 only", async () => {
  const { buildSignificadoBlock0DevPrefill } = await import(
    "@/features/significado/significado-dev-fixture"
  );

  const result = buildSignificadoBlock0DevPrefill();

  assert.ok(result.visualDraft[buildBlock0AnswerKey("B0-Q01", "action_verb")]?.trim());
  assert.ok(result.visualDraft[buildBlock0AnswerKey("B0-Q01", "input_or_object")]?.trim());
  assert.ok(
    result.visualDraft[buildBlock0AnswerKey("B0-Q01", "procedure_or_standard")]?.trim(),
  );
  assert.ok(result.visualDraft[buildBlock0AnswerKey("B0-Q01", "output_or_result")]?.trim());
  assert.equal(result.visualDraft[buildBlock0AnswerKey("B0-Q02")] ?? "", "");
  assert.equal(result.visualDraft[buildBlock0AnswerKey("B0-Q03", "frequency_base")] ?? "", "");
  assert.equal(result.visualDraft[buildBlock0AnswerKey("B0-Q03", "typical_context")] ?? "", "");
  assert.equal(
    result.visualDraft[buildBlock0AnswerKey("B0-Q03", "primary_actor_scope")] ?? "",
    "",
  );
});
