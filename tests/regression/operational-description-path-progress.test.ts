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
const hookPath = join(tmpdir(), "eve-operational-description-path-progress-hook.mjs");

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

const { resolveOperationalPathProgress } = await import(
  "@/services/operational-description-coach/operational-description-path-progress"
);
const { OPERATIONAL_DESCRIPTION_UI } = await import(
  "@/features/significado/operational-description-canon"
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

test("empty draft keeps trigger active and the rest pending", () => {
  const progress = resolveOperationalPathProgress("", FINANCE_CONTEXT);

  assert.equal(progress.stepStates.trigger, "active");
  assert.equal(progress.stepStates.transform, "pending");
  assert.equal(progress.isComplete, false);
});

test("trigger-only draft marks input covered and transform active", () => {
  const progress = resolveOperationalPathProgress(
    "Al recibir el cierre mensual de costos del sistema Oracle",
    FINANCE_CONTEXT,
  );

  assert.equal(progress.stepStates.trigger, "covered");
  assert.equal(progress.stepStates.transform, "active");
  assert.equal(progress.stepStates.handoff, "pending");
});

test("complete finance draft marks all chips covered", () => {
  const draft =
    "Al recibir el cierre mensual de costos del sistema Oracle, cotejo las erogaciones reales contra el presupuesto autorizado para identificar variaciones significativas. Filtro las desviaciones menores al 3% para centrar mi capacidad en las anomalías críticas, y transformo estos datos en un reporte de 'Análisis de Causa Raíz' donde explico el origen técnico de cada sobrecosto. Entrego el reporte a la Dirección General mediante el tablero de control estratégico para el seguimiento mensual.";

  const progress = resolveOperationalPathProgress(draft, FINANCE_CONTEXT);

  assert.equal(progress.isComplete, true);
  assert.equal(progress.stepStates.trigger, "covered");
  assert.equal(progress.stepStates.transform, "covered");
  assert.equal(progress.stepStates.attenuation, "covered");
  assert.equal(progress.stepStates.output, "covered");
  assert.equal(progress.stepStates.handoff, "covered");
});

test("canon exposes textarea placeholder and completion copy", () => {
  assert.equal(OPERATIONAL_DESCRIPTION_UI.textareaPlaceholder, "Escribe aquí");
  assert.match(OPERATIONAL_DESCRIPTION_UI.pathCompleteMessage, /Relato operativo completo/i);
});

test("example aside renders contrast lead", async () => {
  const source = await import("node:fs").then((fs) =>
    fs.readFileSync(
      join(
        projectRoot,
        "src/components/significado/OperationalDescriptionExampleAside.tsx",
      ),
      "utf8",
    ),
  );

  assert.match(source, /contrastLead|introContrastLead/);
  assert.match(source, /operationalExampleContrastLead/);
});

test("prompt copy renders chip states", async () => {
  const source = await import("node:fs").then((fs) =>
    fs.readFileSync(
      join(
        projectRoot,
        "src/components/significado/OperationalDescriptionPromptCopy.tsx",
      ),
      "utf8",
    ),
  );

  assert.match(source, /stepStates/);
  assert.match(source, /operationalPromptFieldActive/);
  assert.match(source, /operationalPromptFieldCovered/);
});
