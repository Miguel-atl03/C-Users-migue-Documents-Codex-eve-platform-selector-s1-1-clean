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
const hookPath = join(tmpdir(), "eve-operational-description-intro-guide-path-hook.mjs");

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
  buildOperationalDescriptionIntroGuide,
  draftEchoesEstablishedActivity,
  shouldShowOperationalDescriptionIntroGuide,
} = await import(
  "@/services/operational-description-coach/build-operational-description-intro-guide"
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

test("finance intro guide teaches path without repeating activity title", () => {
  const guide = buildOperationalDescriptionIntroGuide(FINANCE_CONTEXT);

  assert.match(guide.contrastLead, /recorrido/i);
  assert.equal(guide.pathSteps.length, 5);
  assert.equal(guide.exampleBeats.length, 5);
  assert.match(guide.exampleBeats[0]?.text ?? "", /Oracle/i);
  assert.match(guide.exampleNarrative, /Oracle/i);
  assert.match(guide.exampleNarrative, /variaciones|desviacion|explicacion/i);
  assert.doesNotMatch(
    guide.exampleNarrative,
    /Analizo la proyección mensual de erogaciones comparando el gasto real contra Oracle/i,
  );
});

test("intro guide stays visible until all five pedagogical fields are covered", () => {
  const partialOperationalDraft =
    "Al recibir el cierre mensual de costos del sistema Oracle, cotejo las erogaciones reales contra el presupuesto autorizado para identificar variaciones significativas.";

  assert.equal(
    shouldShowOperationalDescriptionIntroGuide({
      dismissed: false,
      draftText: partialOperationalDraft,
      context: FINANCE_CONTEXT,
    }),
    true,
    "guide should remain while attenuation, output and handoff are still open",
  );

  const draftWithAttenuationOnly =
    "Al recibir el cierre mensual de costos del sistema Oracle, cotejo las erogaciones reales contra el presupuesto autorizado para identificar variaciones significativas. Filtro las desviaciones menores al 3% para centrar mi capacidad en las anomalías críticas.";

  assert.equal(
    shouldShowOperationalDescriptionIntroGuide({
      dismissed: false,
      draftText: draftWithAttenuationOnly,
      context: FINANCE_CONTEXT,
    }),
    true,
    "guide should remain while deliverable and handoff are still open",
  );

  assert.equal(
    shouldShowOperationalDescriptionIntroGuide({
      dismissed: false,
      draftText:
        "Cuando ya está el cierre en Oracle, comparo erogaciones reales contra presupuesto, priorizo variaciones que requieren explicación, dejo el reporte con causa raíz listo y entrego el reporte al controller para el comité mensual.",
      context: FINANCE_CONTEXT,
    }),
    true,
    "left example stays visible for comparison even when the draft is complete",
  );
});

test("draft echo detector flags pasted activity", () => {
  assert.equal(
    draftEchoesEstablishedActivity(FINANCE_CONTEXT.activityTitle!, FINANCE_CONTEXT),
    true,
  );
  assert.equal(
    draftEchoesEstablishedActivity(
      "Cuando llega el cierre, comparo y preparo el reporte con causas.",
      FINANCE_CONTEXT,
    ),
    false,
  );
});

test("Significado wires practical B0-Q02 layout with left example and prompt copy", async () => {
  const componentSource = await import("node:fs").then((fs) =>
    fs.readFileSync(
      join(projectRoot, "src/components/significado/SignificadoDeTuTrabajo.tsx"),
      "utf8",
    ),
  );

  assert.match(componentSource, /OperationalDescriptionExampleAside/);
  assert.match(componentSource, /OperationalDescriptionPromptCopy/);
  assert.match(componentSource, /pathStepStates/);
  assert.match(componentSource, /showLeftExample/);
  assert.match(componentSource, /sessionId/);
  assert.match(componentSource, /operationalDescriptionRow/);
  assert.doesNotMatch(componentSource, /OperationalDescriptionCompositionWorkspace/);
  assert.doesNotMatch(componentSource, /operationalExampleOverlay/);
});
