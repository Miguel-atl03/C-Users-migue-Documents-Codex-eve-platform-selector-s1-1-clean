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
const hookPath = join(tmpdir(), "eve-activity-boundary-hook.mjs");

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

const {
  B0_Q04_INPUT_KEY,
  B0_Q04_INPUT_STATUS_KEY,
  B0_Q04_OUTPUT_KEY,
  B0_Q04_OUTPUT_STATUS_KEY,
  buildFormattedBoundaryAnswer,
  getBoundarySectionDraftValue,
  getBoundarySectionValue,
  inferActivityBoundaryReview,
  isActivityBoundaryQuestionComplete,
} = await import(
  "@/services/operational-description-coach/infer-activity-boundary"
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

const COMPLETE_DRAFT =
  "Al recibir el cierre mensual de costos del sistema Oracle, cotejo las erogaciones reales contra el presupuesto autorizado para identificar variaciones significativas. Filtro las desviaciones menores al 3% para centrar mi capacidad en las anomalías críticas, y transformo estos datos en un reporte de 'Análisis de Causa Raíz' donde explico el origen técnico de cada sobrecosto. Una vez finalizado, entrego el reporte en estado [Analizado y Validado] a la Dirección General mediante el tablero de control estratégico para que se tomen decisiones de ajuste al flujo de caja.";

test("complete operational description infers short entry and exit snippets per section", () => {
  const review = inferActivityBoundaryReview(COMPLETE_DRAFT, FINANCE_CONTEXT);
  const entry = review.sections.find((section) => section.id === "input_transduction");
  const exit = review.sections.find((section) => section.id === "output_transduction");

  assert.equal(entry?.isSufficient, true);
  assert.equal(exit?.isSufficient, true);
  assert.equal(
    entry?.inferredSnippet,
    "Al recibir el cierre mensual de costos del sistema Oracle",
  );
  assert.match(exit?.inferredSnippet ?? "", /una vez finalizado, entrego el reporte/i);
  assert.doesNotMatch(entry?.inferredSnippet ?? "", /cotejo/i);
});

test("incomplete operational description opens manual capture for missing sections", () => {
  const review = inferActivityBoundaryReview(
    "Al recibir el cierre mensual de costos del sistema Oracle",
    FINANCE_CONTEXT,
  );
  const entry = review.sections.find((section) => section.id === "input_transduction");
  const exit = review.sections.find((section) => section.id === "output_transduction");

  assert.equal(entry?.isSufficient, true);
  assert.equal(exit?.isSufficient, false);
  assert.match(entry?.confirmPrompt ?? "", /¿Va bien\?/);
  assert.match(exit?.manualPrompt ?? "", /Escribe qué queda listo/i);
});

test("boundary question completes only after both sections are resolved", () => {
  assert.equal(
    isActivityBoundaryQuestionComplete({
      "B0-Q04": "",
    }),
    false,
  );

  assert.equal(
    isActivityBoundaryQuestionComplete({
      [B0_Q04_INPUT_KEY]: "Al recibir el cierre mensual de costos del sistema Oracle",
      [B0_Q04_INPUT_STATUS_KEY]: "confirmed",
      [B0_Q04_OUTPUT_KEY]: "",
      [B0_Q04_OUTPUT_STATUS_KEY]: "pending",
      "B0-Q04": "",
    }),
    false,
  );

  assert.equal(
    isActivityBoundaryQuestionComplete({
      [B0_Q04_INPUT_KEY]: "Al recibir el cierre mensual de costos del sistema Oracle",
      [B0_Q04_INPUT_STATUS_KEY]: "confirmed",
      [B0_Q04_OUTPUT_KEY]:
        "Una vez finalizado, entrego el reporte a la Dirección General mediante el tablero",
      [B0_Q04_OUTPUT_STATUS_KEY]: "manual",
      "B0-Q04": buildFormattedBoundaryAnswer({
        entryValue: "Al recibir el cierre mensual de costos del sistema Oracle",
        exitValue:
          "Una vez finalizado, entrego el reporte a la Dirección General mediante el tablero",
      }),
    }),
    true,
  );
});

test("boundary draft value preserves trailing spaces while editing", () => {
  const answers = {
    [B0_Q04_INPUT_KEY]: "Al recibir el cierre mensual de costos del sistema Oracle ",
    [B0_Q04_INPUT_STATUS_KEY]: "pending",
  };

  assert.equal(
    getBoundarySectionDraftValue(answers, "input_transduction"),
    "Al recibir el cierre mensual de costos del sistema Oracle ",
  );
  assert.equal(
    getBoundarySectionValue(answers, "input_transduction"),
    "Al recibir el cierre mensual de costos del sistema Oracle",
  );
});

test("Significado wires section-based boundary confirmation panel for B0-Q04", async () => {
  const componentSource = await import("node:fs").then((fs) =>
    fs.readFileSync(
      join(projectRoot, "src/components/significado/SignificadoDeTuTrabajo.tsx"),
      "utf8",
    ),
  );

  assert.match(componentSource, /ActivityBoundaryConfirmationPanel/);
  assert.match(componentSource, /inferActivityBoundaryReview/);
  assert.match(componentSource, /handleActivityBoundarySectionConfirm/);
  assert.match(componentSource, /onSectionConfirm/);
  assert.match(componentSource, /isActivityBoundary && activityBoundary/);
  assert.match(componentSource, /getBoundarySectionDraftValue/);
});
