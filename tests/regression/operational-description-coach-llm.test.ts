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
const hookPath = join(tmpdir(), "eve-operational-description-coach-llm-path-hook.mjs");

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

const { validateAndFormatLlmCoachResponse } = await import(
  "@/services/operational-description-coach/llm-coach-response"
);
const { resolveOperationalDescriptionCoach } = await import(
  "@/services/operational-description-coach/resolve-operational-description-coach"
);
const { resetOperationalDescriptionLlmRateLimitForTests } = await import(
  "@/services/operational-description-coach/llm-coach-rate-limit"
);
const { buildLlmCoachUserPrompt } = await import(
  "@/services/operational-description-coach/llm-coach-prompt"
);
const { scanOperationalDescription } = await import(
  "@/services/operational-description-coach/evaluate-operational-description-coach"
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

const COTEJO_DRAFT =
  "Al recibir el cierre mensual de costos del sistema Oracle, cotejo las erogaciones reales contra el presupuesto autorizado para identificar variaciones significativas.";

test("llm response validator rejects echo of confirmed activity", () => {
  const result = validateAndFormatLlmCoachResponse(
    {
      components_covered: ["input_transduction", "transformation_algorithm"],
      next_missing_component: "variety_attenuation",
      lead_message:
        "Analizo la proyección mensual de erogaciones comparando el gasto real contra Oracle para generar reportes.",
      confidence: "high",
    },
    FINANCE_CONTEXT,
  );

  assert.equal(result.message, null);
});

test("llm response validator accepts trinchera coaching without quoted examples", () => {
  const result = validateAndFormatLlmCoachResponse(
    {
      components_covered: ["input_transduction", "transformation_algorithm"],
      next_missing_component: "variety_attenuation",
      lead_message:
        "Ya quedó claro qué te dispara y qué haces con los números. Ahora cuenta qué dejas fuera o qué no atiendes para no saturarte.",
      confidence: "high",
    },
    FINANCE_CONTEXT,
  );

  assert.ok(result.message);
  assert.equal(result.exampleFragment, null);
  assert.equal(result.cyberneticEvaluation.nextMissingComponent, "variety_attenuation");
  assert.doesNotMatch(result.message, /[«»]/);
});

test("llm response validator rejects quoted copy-paste examples", () => {
  const result = validateAndFormatLlmCoachResponse(
    {
      components_covered: ["input_transduction"],
      next_missing_component: "transformation_algorithm",
      lead_message:
        'Falta el proceso. Por ejemplo: «cotejo las erogaciones contra el presupuesto».',
      confidence: "high",
    },
    FINANCE_CONTEXT,
  );

  assert.equal(result.message, null);
});

test("llm user prompt sends cybernetic components and draft only", () => {
  const scan = scanOperationalDescription(COTEJO_DRAFT);
  const prompt = buildLlmCoachUserPrompt({
    draftText: COTEJO_DRAFT,
    context: FINANCE_CONTEXT,
  });

  assert.match(prompt, /cybernetic_components/i);
  assert.match(prompt, /cotejo las erogaciones/i);
  assert.doesNotMatch(prompt, /priority_gap/i);
  assert.doesNotMatch(prompt, /sufficiency/i);
  assert.ok(scan);
});

test("resolve coach falls back to cybernetic trinchera when llm is not configured", async () => {
  resetOperationalDescriptionLlmRateLimitForTests();

  const result = await resolveOperationalDescriptionCoach(
    {
      sessionId: "session-test-1",
      draftText: COTEJO_DRAFT,
      context: FINANCE_CONTEXT,
    },
    { apiKey: "" },
  );

  assert.equal(result.coachSource, "deterministic");
  assert.ok(result.message);
  assert.equal(result.exampleFragment, null);
  assert.equal(result.cyberneticEvaluation?.nextMissingComponent, "variety_attenuation");
  assert.doesNotMatch(result.message, /[«»]/);
});

test("resolve coach uses mocked llm cybernetic evaluation", async () => {
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
                  components_covered: [
                    "input_transduction",
                    "transformation_algorithm",
                  ],
                  next_missing_component: "variety_attenuation",
                  lead_message:
                    "Ya quedó claro el arranque y el cotejo de números. Ahora menciona qué filtras o qué dejas fuera para concentrarte.",
                  confidence: "high",
                }),
              },
            },
          ],
        };
      },
    }) as Response;

  const result = await resolveOperationalDescriptionCoach(
    {
      sessionId: "session-test-2",
      draftText: COTEJO_DRAFT,
      context: FINANCE_CONTEXT,
    },
    {
      apiKey: "test-key",
      fetchImpl,
    },
  );

  assert.equal(result.coachSource, "llm");
  assert.ok(result.message);
  assert.match(result.message, /filtras|dejas fuera/i);
  assert.equal(result.cyberneticEvaluation?.nextMissingComponent, "variety_attenuation");
  assert.doesNotMatch(result.message, /Analizo la proyección mensual de erogaciones/i);
});

test("hook wires personalized coach API call without deterministic gate", async () => {
  const hookSource = await import("node:fs").then((fs) =>
    fs.readFileSync(
      join(projectRoot, "src/hooks/use-operational-description-coach.ts"),
      "utf8",
    ),
  );

  assert.match(hookSource, /\/api\/coach\/operational-description/);
  assert.match(hookSource, /sessionId/);
  assert.match(hookSource, /workMapActivityId/);
  assert.match(hookSource, /operational-description-canon/);
  assert.doesNotMatch(hookSource, /deterministicMessage/);
});
