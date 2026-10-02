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
const hookPath = join(tmpdir(), "eve-operational-description-intro-example-path-hook.mjs");

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

const { validateLlmIntroExampleResponse } = await import(
  "@/services/operational-description-coach/llm-intro-example-response"
);
const { resolveOperationalDescriptionIntroExample } = await import(
  "@/services/operational-description-coach/resolve-operational-description-intro-example"
);
const { buildLocalDemoIntroExamplePayload } = await import(
  "@/services/operational-description-coach/local-demo-intro-example"
);
const { resetOperationalDescriptionLlmRateLimitForTests } = await import(
  "@/services/operational-description-coach/llm-coach-rate-limit"
);

const FINANCE_CONTEXT = {
  activityTitle:
    "Analizo la proyección mensual de erogaciones comparando el gasto real contra Oracle para generar reportes de desviaciones con análisis de causa raíz.",
  actionVerb: "Analizo",
  inputOrObject:
    "la proyección mensual de erogaciones y el gasto real registrado en Oracle",
  procedureOrStandard:
    "comparo el gasto real contra la proyección para identificar desviaciones",
  outputOrResult: "reporte de desviaciones con análisis de causa raíz",
};

const FALLBACK =
  "Cuando ya está disponible el cierre mensual en Oracle, analizo y comparo el gasto real contra la proyección. Me centro en las variaciones que requieren explicación y preparo el reporte con causa raíz, y lo dejo listo para quien usa esos números en el siguiente control.";

test("llm intro example validator rejects echo of activity title", () => {
  const result = validateLlmIntroExampleResponse(
    {
      example_narrative:
        "Analizo la proyección mensual de erogaciones comparando el gasto real contra Oracle para generar reportes.",
      confidence: "high",
    },
    FINANCE_CONTEXT,
  );

  assert.equal(result, null);
});

test("llm intro example validator accepts pedagogical narrative", () => {
  const result = validateLlmIntroExampleResponse(
    {
      example_narrative:
        "Cuando cierra el mes en Oracle, comparo erogaciones reales contra presupuesto, priorizo variaciones relevantes y dejo el reporte con causas listo para el comité.",
      confidence: "high",
    },
    FINANCE_CONTEXT,
  );

  assert.ok(result);
  assert.doesNotMatch(result, /Analizo la proyección mensual de erogaciones/i);
});

test("resolve intro example falls back without llm configured", async () => {
  resetOperationalDescriptionLlmRateLimitForTests();

  const result = await resolveOperationalDescriptionIntroExample(
    {
      sessionId: "session-intro-1",
      context: FINANCE_CONTEXT,
      deterministicFallback: FALLBACK,
    },
    { apiKey: "" },
  );

  assert.equal(result.exampleSource, "deterministic");
  assert.equal(result.exampleNarrative, FALLBACK);
});

test("local demo intro example payload preserves UI contract without Supabase", () => {
  const result = buildLocalDemoIntroExamplePayload(FALLBACK);

  assert.equal(result.exampleNarrative, FALLBACK);
  assert.equal(result.exampleSource, "deterministic");
  assert.equal(result.source, "local_demo_synthetic");
  assert.equal(result.mode, "local_ui_exercise");
  assert.equal(result.usesSupabase, false);
  assert.equal(result.usesProduction, false);
  assert.equal(result.llmConfigured, false);
});

test("resolve intro example can enhance with mocked llm response", async () => {
  resetOperationalDescriptionLlmRateLimitForTests();

  const fetchImpl = async () =>
    ({
      ok: true,
      async json() {
        return {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  example_narrative:
                    "Al tener el cierre en Oracle, comparo gasto real vs proyección, filtro ruido menor y dejo el reporte con causas para quien revisa el comité.",
                  confidence: "high",
                }),
              },
            },
          ],
        };
      },
    }) as Response;

  const result = await resolveOperationalDescriptionIntroExample(
    {
      sessionId: "session-intro-2",
      context: FINANCE_CONTEXT,
      deterministicFallback: FALLBACK,
    },
    {
      apiKey: "test-key",
      fetchImpl,
    },
  );

  assert.equal(result.exampleSource, "llm");
  assert.match(result.exampleNarrative, /Oracle/i);
});

test("intro guide hook wires llm example API", async () => {
  const hookSource = await import("node:fs").then((fs) =>
    fs.readFileSync(
      join(projectRoot, "src/hooks/use-operational-description-intro-guide.ts"),
      "utf8",
    ),
  );

  assert.match(hookSource, /intro-example/);
  assert.match(hookSource, /sessionId/);
});
