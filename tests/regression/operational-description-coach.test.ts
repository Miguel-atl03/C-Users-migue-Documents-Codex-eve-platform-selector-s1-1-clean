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
const hookPath = join(tmpdir(), "eve-operational-description-coach-path-hook.mjs");

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
  evaluateOperationalDescriptionCoach,
  scanOperationalDescription,
} = await import(
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

const COMPLETE_B0_Q02 =
  "Comparo la proyección mensual de erogaciones con el gasto real en Oracle, identifico desviaciones y preparo el reporte con explicación preliminar de causas.";

test("empty operational description stays silent", () => {
  const result = evaluateOperationalDescriptionCoach("", FINANCE_CONTEXT);
  assert.equal(result.message, null);
  assert.equal(result.scan.sufficiency, "empty");
});

test("very short draft stays silent until minimum length", () => {
  const result = evaluateOperationalDescriptionCoach("Analizo", FINANCE_CONTEXT);
  assert.equal(result.message, null);
  assert.equal(result.scan.sufficiency, "insufficient");
});

test("incomplete draft surfaces narrative coach without repeating activity title", () => {
  const result = evaluateOperationalDescriptionCoach(
    "Analizo la proyección mensual",
    FINANCE_CONTEXT,
  );

  assert.ok(result.message);
  assert.match(result.message, /priorizas|dejas fuera|dispara|técnicamente|información/i);
  assert.doesNotMatch(result.message, /Analizo la proyección mensual de erogaciones/i);
  assert.doesNotMatch(result.message, /[«»]/);
});

test("erp trigger draft keeps guide visible and coaches next cybernetic component", () => {
  const erpDraft =
    "Empiezo la actividad cuando tengo acceso a la información de cierre de mes en mi cuenta de ERP.";

  const result = evaluateOperationalDescriptionCoach(erpDraft, FINANCE_CONTEXT);

  assert.ok(result.message);
  assert.match(result.message, /priorizas|dejas fuera|técnicamente|dispara|información/i);
  assert.doesNotMatch(result.message, /[«»]/);
});

test("trigger-only draft asks for transformation algorithm next", () => {
  const draft = "Al recibir el cierre mensual de costos del sistema Oracle";

  const result = evaluateOperationalDescriptionCoach(draft, FINANCE_CONTEXT);

  assert.ok(result.message);
  assert.match(
    result.message,
    /técnicamente|haces con esa información|cambiar su estado|arranque/i,
  );
  assert.doesNotMatch(result.message, /priorizas|dejas fuera|saturarte/i);
});

test("partial operational draft coaches variety attenuation before handoff", () => {
  const draft =
    "Al recibir el cierre mensual de costos del sistema Oracle, cotejo las erogaciones reales contra el presupuesto autorizado para identificar variaciones significativas.";

  const result = evaluateOperationalDescriptionCoach(draft, FINANCE_CONTEXT);

  assert.ok(result.message);
  assert.match(result.message, /priorizas|dejas fuera|no atiendes|saturarte|filtras/i);
  assert.doesNotMatch(result.message, /[«»]/);
  assert.doesNotMatch(result.message, /quién lo usa después/i);
});

test("partial draft matching screenshot avoids echoing the work map activity", () => {
  const result = evaluateOperationalDescriptionCoach(
    "Comparo la proyeccion",
    FINANCE_CONTEXT,
  );

  assert.ok(result.message);
  assert.match(result.message, /dispara|técnicamente|priorizas|dejas fuera/i);
  assert.doesNotMatch(result.message, /Analizo la proyección mensual de erogaciones/i);
});

test("complete finance draft reaches operational sufficiency", () => {
  const scan = scanOperationalDescription(COMPLETE_B0_Q02);
  assert.equal(scan.sufficiency, "operational");
  assert.equal(scan.structuralParts.hasAction, true);
  assert.equal(scan.structuralParts.hasObject, true);
});

test("operational draft can nudge missing trigger or handoff without blocking tone", () => {
  const result = evaluateOperationalDescriptionCoach(
    COMPLETE_B0_Q02,
    FINANCE_CONTEXT,
  );

  if (result.message) {
    assert.equal(result.scan.coachTier, "nudge");
    assert.match(result.message, /cuándo empiezas|qué priorizas|quién lo usa|handoff|attenuation/i);
  }
});

test("draft with all five cybernetic components stays silent", () => {
  const text =
    "Cuando ya está el cierre en Oracle, comparo erogaciones reales contra presupuesto, priorizo variaciones que requieren explicación, dejo el reporte con causa raíz listo y entrego el reporte al controller para el comité mensual.";
  const result = evaluateOperationalDescriptionCoach(text, FINANCE_CONTEXT);

  assert.equal(result.scan.sufficiency, "mastery");
  assert.equal(result.message, null);
});

test("draft with input transform and attenuation still coaches impact amplification", () => {
  const draft =
    "Al recibir el cierre mensual de costos del sistema Oracle, cotejo las erogaciones reales contra el presupuesto autorizado para identificar variaciones significativas. Filtro las desviaciones menores al 3% para centrar mi capacidad en las anomalías críticas.";

  const result = evaluateOperationalDescriptionCoach(draft, FINANCE_CONTEXT);

  assert.ok(result.message);
  assert.match(result.message, /entregable|estado final|valor aporta/i);
  assert.doesNotMatch(result.message, /quién recibe|handoff|siguiente eslabón/i);
});

test("partial handoff keeps coaching until recipient channel or purpose is clear", () => {
  const draft =
    "Al recibir el cierre mensual de costos del sistema Oracle, cotejo las erogaciones reales contra el presupuesto autorizado para identificar variaciones significativas. Filtro las desviaciones menores al 3% para centrar mi capacidad en las anomalías críticas, y transformo estos datos en un reporte de 'Análisis de Causa Raíz' donde explico el origen técnico de cada sobrecosto. Una vez finalizado, entrego el reporte";

  const result = evaluateOperationalDescriptionCoach(draft, FINANCE_CONTEXT);

  assert.ok(result.message);
  assert.match(result.message, /quién recibe|canal|siguiente control|precisa/i);
});

test("complete handoff with recipient stays silent", () => {
  const draft =
    "Al recibir el cierre mensual de costos del sistema Oracle, cotejo las erogaciones reales contra el presupuesto autorizado para identificar variaciones significativas. Filtro las desviaciones menores al 3% para centrar mi capacidad en las anomalías críticas, y transformo estos datos en un reporte de 'Análisis de Causa Raíz' donde explico el origen técnico de cada sobrecosto. Entrego el reporte a la Dirección General mediante el tablero de control estratégico para el seguimiento mensual.";

  const result = evaluateOperationalDescriptionCoach(draft, FINANCE_CONTEXT);

  assert.equal(result.message, null);
});

test("Significado component wires operational description coach for B0-Q02", async () => {
  const componentSource = await import("node:fs").then((fs) =>
    fs.readFileSync(
      join(projectRoot, "src/components/significado/SignificadoDeTuTrabajo.tsx"),
      "utf8",
    ),
  );

  assert.match(componentSource, /useOperationalDescriptionCoach/);
  assert.match(componentSource, /useOperationalDescriptionIntroGuide/);
  assert.match(componentSource, /OperationalDescriptionExampleAside/);
  assert.match(componentSource, /OperationalDescriptionPromptCopy/);
  assert.match(componentSource, /showLeftExample/);
  assert.match(componentSource, /operationalCoachHint/);
  assert.match(componentSource, /operationalCoachComplete/);
  assert.match(componentSource, /pathStepStates/);
  assert.match(componentSource, /statusHint/);
  assert.match(componentSource, /B0-Q02/);
  assert.doesNotMatch(
    componentSource,
    /getActivityAssistMessage|handleSyntaxFieldBlur/,
  );
});
