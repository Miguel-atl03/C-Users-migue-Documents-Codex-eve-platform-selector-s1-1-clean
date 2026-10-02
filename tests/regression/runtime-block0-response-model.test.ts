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
const hookPath = join(tmpdir(), "eve-runtime-block0-response-model-hook.mjs");

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

const responseModelModule = await import("@/services/runtime-block0-response-model");

const { buildRuntimeBlock0ResponseBundle } = responseModelModule;

const DOMAIN_PATH = "src/domain/runtime-block0-response.ts";
const SERVICE_PATH = "src/services/runtime-block0-response-model.ts";

function readText(path: string) {
  assert.equal(existsSync(path), true, `Missing file: ${path}`);
  return readFileSync(path, "utf8");
}

function completeAnswers(overrides: Record<string, string> = {}) {
  return {
    "B0-Q01.action_verb": "Registro",
    "B0-Q01.input_or_object": "facturas recibidas",
    "B0-Q01.procedure_or_standard": "segun orden de compra",
    "B0-Q01.output_or_result": "factura registrada",
    "B0-Q01.user_correction_note": "",
    "B0-Q02": "Registro las facturas recibidas para dejarlas listas para pago.",
    "B0-Q03.frequency_base": "Diario",
    "B0-Q03.typical_context": "cuando llegan facturas de proveedores",
    "B0-Q03.primary_actor_scope": "yo directamente",
    "B0-Q04": "Empieza con factura recibida y termina con factura registrada.",
    "B0-Q04.input_transduction": "factura recibida",
    "B0-Q04.output_transduction": "factura registrada para pago",
    ...overrides,
  };
}

function buildBundle({
  answers = completeAnswers(),
  initialAnswers = {},
  confirmPrefillsOnSubmit = true,
}: {
  answers?: Record<string, string>;
  initialAnswers?: Partial<Record<string, string>>;
  confirmPrefillsOnSubmit?: boolean;
} = {}) {
  return buildRuntimeBlock0ResponseBundle({
    activityId: "act-1",
    activityLabel: "Registrar facturas",
    answers,
    initialAnswers,
    confirmPrefillsOnSubmit,
    createdAt: "2026-06-16T00:00:00.000Z",
  });
}

function getResponse(bundle: ReturnType<typeof buildBundle>, interactionId: string) {
  const response = bundle.responses.find(
    (item) => item.runtimeInteractionId === interactionId,
  );
  assert.ok(response, `Missing response ${interactionId}`);
  return response;
}

function getSubfield(
  bundle: ReturnType<typeof buildBundle>,
  interactionId: string,
  subfieldName: string,
) {
  const subfield = getResponse(bundle, interactionId).subfieldResponses.find(
    (item) => item.subfieldName === subfieldName,
  );
  assert.ok(subfield, `Missing subfield ${interactionId}.${subfieldName}`);
  return subfield;
}

test("builds the formal R1 bundle envelope in memory", () => {
  const bundle = buildBundle();

  assert.equal(bundle.version, "RUNTIME_BLOCK0_RESPONSE_R1");
  assert.equal(bundle.activityId, "act-1");
  assert.equal(bundle.activityLabel, "Registrar facturas");
  assert.equal(bundle.source, "significado_ui");
  assert.equal(bundle.createdAt, "2026-06-16T00:00:00.000Z");
  assert.equal(bundle.responses.length, 4);
});

test("emits exactly B0-Q01 through B0-Q04 response groups", () => {
  const bundle = buildBundle();

  assert.deepEqual(
    bundle.responses.map((response) => response.runtimeInteractionId),
    ["B0-Q01", "B0-Q02", "B0-Q03", "B0-Q04"],
  );
});

test("B0-Q01 keeps all semantic subfields separable", () => {
  const bundle = buildBundle();

  assert.deepEqual(
    getResponse(bundle, "B0-Q01").subfieldResponses.map((item) => item.subfieldName),
    [
      "action_verb",
      "input_or_object",
      "procedure_or_standard",
      "output_or_result",
      "user_correction_note",
    ],
  );
});

test("B0-Q03 keeps frequency, context and actor as separate subfields", () => {
  const bundle = buildBundle();

  assert.deepEqual(
    getResponse(bundle, "B0-Q03").subfieldResponses.map((item) => item.subfieldName),
    ["frequency_base", "typical_context", "primary_actor_scope"],
  );
});

test("B0-Q04 preserves start and end boundaries as separate subfields", () => {
  const bundle = buildBundle();
  const b0q04 = getResponse(bundle, "B0-Q04");

  assert.equal(b0q04.responseKind, "compound_subfields");
  assert.deepEqual(
    b0q04.subfieldResponses.map((item) => item.subfieldName),
    ["input_transduction", "output_transduction"],
  );
});

test("unchanged prefilled values become user confirmed suggestions on submit", () => {
  const initialAnswers = { "B0-Q01.action_verb": "Registro" };
  const bundle = buildBundle({ initialAnswers });
  const response = getSubfield(bundle, "B0-Q01", "action_verb");

  assert.equal(response.epistemicStatus, "user_confirmed_suggestion");
  assert.equal(response.provenanceType, "user_confirmed");
  assert.equal(response.sourceWorkMapPath, "initialVisualDraft.B0-Q01.action_verb");
});

test("modified prefilled values become user corrected evidence", () => {
  const bundle = buildBundle({
    initialAnswers: { "B0-Q01.action_verb": "Capturo" },
  });
  const response = getSubfield(bundle, "B0-Q01", "action_verb");

  assert.equal(response.value, "Registro");
  assert.equal(response.epistemicStatus, "user_corrected_evidence");
  assert.equal(response.provenanceType, "user_corrected");
});

test("new values in empty fields become captured user evidence", () => {
  const response = getSubfield(buildBundle(), "B0-Q02", "single_answer");

  assert.equal(response.epistemicStatus, "captured_user_evidence");
  assert.equal(response.provenanceType, "user_answer");
});

test("unconfirmed prefilled values are not converted to captured evidence", () => {
  const bundle = buildBundle({
    initialAnswers: { "B0-Q01.input_or_object": "facturas recibidas" },
    confirmPrefillsOnSubmit: false,
  });
  const response = getSubfield(bundle, "B0-Q01", "input_or_object");

  assert.equal(response.epistemicStatus, "inferred_from_workmap");
  assert.equal(response.provenanceType, "workmap_prefill");
});

test("evidenceReadyForRuntime is true only when current screen minimums are complete", () => {
  assert.equal(buildBundle().evidenceReadyForRuntime, true);
  assert.equal(
    buildBundle({
      answers: completeAnswers({ "B0-Q04.output_transduction": "" }),
    }).evidenceReadyForRuntime,
    false,
  );
});

test("subfield responses retain source ids and canonical variables", () => {
  const response = getSubfield(buildBundle(), "B0-Q03", "frequency_base");

  assert.equal(response.runtimeInteractionId, "B0-Q03");
  assert.equal(response.sourceRuntimeInteractionId, "B0-Q03");
  assert.equal(
    response.sourceCanonicalVariable,
    "activity_frequency_base / scene_frequency_base",
  );
});

test("response model has no API, Supabase, runtime engine or loose any dependency", () => {
  const domainSource = readText(DOMAIN_PATH);
  const serviceSource = readText(SERVICE_PATH);
  const combinedSource = `${domainSource}\n${serviceSource}`;

  assert.equal(/\bany\b/.test(combinedSource), false);
  assert.equal(/supabase/i.test(combinedSource), false);
  assert.equal(/from ["']@\/app\/api/.test(combinedSource), false);
  assert.equal(/runtime-engine/i.test(combinedSource), false);
  assert.equal(/fetch\(/.test(combinedSource), false);
});
