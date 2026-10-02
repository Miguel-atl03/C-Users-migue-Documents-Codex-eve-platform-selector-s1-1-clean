import { register } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const hookPath = join(tmpdir(), "eve-workmap-test-path-hook.mjs");

writeFileSync(
  hookPath,
  `import { pathToFileURL } from "node:url";
import { resolve as resolvePath } from "node:path";

const projectRoot = ${JSON.stringify(resolve(testDir, "../.."))};

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

const domainModule = await import("../../src/domain/local-work-map.ts");
const saveValidationModule = await import(
  "../../src/services/local-work-map-save-validation.ts"
);
const responsibilityModule = await import(
  "../../src/services/local-work-map-responsibility-validation.ts"
);
const activityModule = await import(
  "../../src/services/local-work-map-activity-validation.ts"
);

const {
  ACCEPTED_WITH_WARNING_MESSAGE,
  activityCoverageFieldKey,
  activityFieldKey,
  applyFieldTextChangeToValidationState,
  evaluateCoverageFieldEntry,
  evaluateFieldValidationEntry,
  evaluateInlineFieldValidationEntry,
  getFieldReviewLabel,
  responsibilityFieldKey,
  shouldEmitRedactionAssistance,
  shouldShowFieldAssist,
  shouldShowInlineFieldHint,
} = domainModule;
type WorkMapData = import("../../src/domain/local-work-map.ts").WorkMapData;
const {
  COVERAGE_MESSAGES,
  GLOBAL_BANNER_MESSAGES,
  buildActivityRedactionObject,
  buildResponsibilityRedactionObject,
  createSaveValidationTransaction,
  getActivityCoverageMessage,
  getResponsibilityActivitiesCoverageMessage,
  getSaveGlobalBannerMessage,
  hasCoverageGaps,
  processWorkMapValidationOnSave,
} = saveValidationModule;
const {
  classifyResponsibilitySufficiency,
  detectResponsibilityParts,
  getResponsibilityAssistMessage,
  isResponsibilityPerfectible,
  validateResponsibility,
  classifyResponsibilitySemantics,
} = responsibilityModule;
const {
  BANNED_AMBIGUOUS_PHRASES,
  classifyActivitySufficiency,
  detectActivityParts,
  getActivityAssistMessage,
  validateActivity,
} = activityModule;

const EROGACIONES_RESPONSIBILITY =
  "Yo verifico y regulo el ciclo de erogaciones y la validación de pagos para prevenir desviaciones presupuestales y asegurar el cumplimiento de los compromisos financieros.";

const MIGUEL_RESPONSIBILITY =
  "Yo defino y autorizo las normas de costeo y la estructura de identidad de los proyectos en el ERP para asegurar la integridad de la base de datos y la visibilidad financiera institucional.";

const CRITERION_LIMIT_MESSAGE = "Agrega cual es el limite o criterio";
const OBJECT_CLARITY_RESPONSIBILITY_MESSAGE =
  "Falta indicar con mas claridad sobre que respondes.";
const STRUCTURE_INSUFFICIENT_MESSAGE =
  "La estructura de algunas responsabilidades o actividades sigue siendo insuficiente";

const invalidActivityText =
  "Mido las dimensiones de la pieza producida no se que";

const COMPLETE_ACTIVITY_1 =
  "Actualizo el Manual de Normas de Costeo basándome en los cambios fiscales y precios de insumos para entregar un documento de criterios vigentes al equipo de presupuestos.";

const COMPLETE_ACTIVITY_2 =
  "Concilio el inventario de activos fijos siguiendo el calendario trimestral para actualizar los atributos de depreciación y ubicación en el sistema central.";

function assertNoChecklistArtifacts(assist: string) {
  assert.doesNotMatch(assist, /Ya tienes:/i);
  assert.doesNotMatch(assist, /Ahora completa:/i);
  assert.doesNotMatch(assist, /✓/);
  assert.doesNotMatch(assist, /○/);
  assert.doesNotMatch(assist, /Acción:/i);
  assert.doesNotMatch(assist, /Sobre qué trabajas:/i);
}

function assertCognitiveChecklistBase(assist: string) {
  assertNoChecklistArtifacts(assist);
  assert.match(
    assist,
    /Para completar esta actividad|La actividad ya indica qué haces/i,
  );
}

function assertCognitiveMissingHowAndResult(assist: string) {
  assert.match(assist, /agrega cómo/i);
  assert.match(assist, /qué queda (?:listo|formalizado) al terminar/i);
}

function assertSemanticImprovesWithResult(assist: string) {
  assert.match(assist, /Para dejarla más completa/i);
  assert.match(assist, /qué queda listo al terminar/i);
}

function assertSemanticImprovesWithHow(assist: string) {
  assert.match(assist, /Para dejarla más completa/i);
  assert.match(assist, /cómo la realizas|criterio|estándar|procedimiento/i);
}

function buildWorkMap(
  overrides: Partial<WorkMapData> = {},
  fieldValidationState: WorkMapData["fieldValidationState"] = {},
): WorkMapData {
  return {
    selectedAreas: ["Produccion"],
    customAreas: [],
    responsibilities: [
      {
        id: "resp-1",
        text: "Yo verifico la calidad de las piezas producidas segun el estandar definido para asegurar conformidad.",
        activities: [{ id: "act-1", text: invalidActivityText }],
      },
      {
        id: "resp-2",
        text: "",
        activities: [{ id: "act-2", text: "" }],
      },
    ],
    guideSeen: { roleHelp: true, area: true, responsibility: true, activity: true, save: true },
    saveAttempts: 0,
    fieldValidationState,
    isSaved: false,
    isReviewMode: false,
    savedWithWarnings: false,
    ...overrides,
  };
}

function buildSyntaxAttemptWorkMap(
  fieldValidationState: WorkMapData["fieldValidationState"] = {},
): WorkMapData {
  return buildWorkMap(
    {
      responsibilities: [
        {
          id: "resp-1",
          text: MIGUEL_RESPONSIBILITY,
          activities: [
            { id: "act-1", text: invalidActivityText },
            { id: "act-1b", text: COMPLETE_ACTIVITY_1 },
          ],
        },
        {
          id: "resp-2",
          text: "Yo coordino la trazabilidad financiera de proyectos especiales para mantener informacion confiable dentro del cierre mensual.",
          activities: [
            { id: "act-2", text: COMPLETE_ACTIVITY_2 },
            { id: "act-2b", text: COMPLETE_ACTIVITY_1 },
          ],
        },
      ],
    },
    fieldValidationState,
  );
}

test("A) Miguel responsibility without activities has no syntax warning and global mentions coverage", () => {
  const result = validateResponsibility(MIGUEL_RESPONSIBILITY);
  const assist = getResponsibilityAssistMessage(MIGUEL_RESPONSIBILITY);

  assert.equal(result.valid, true);
  assert.equal(
    result.messages.some((message) =>
      message.includes(OBJECT_CLARITY_RESPONSIBILITY_MESSAGE),
    ),
    false,
  );
  assert.equal(
    result.messages.some((message) => message.includes(CRITERION_LIMIT_MESSAGE)),
    false,
  );
  assert.equal(assist.includes(CRITERION_LIMIT_MESSAGE), false);

  const workMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: MIGUEL_RESPONSIBILITY,
        activities: [{ id: "act-1", text: "" }],
      },
      {
        id: "resp-2",
        text: "",
        activities: [{ id: "act-2", text: "" }],
      },
    ],
  });

  const saveResult = processWorkMapValidationOnSave(workMap, true);
  assert.equal(saveResult.hasCoverageGaps, true);
  assert.equal(saveResult.hasSyntaxGaps, false);
  assert.match(
    saveResult.globalBannerMessage ?? "",
    /necesita más contenido/i,
  );
  assert.match(
    saveResult.globalBannerMessage ?? "",
    /actividades por responsabilidad/i,
  );
  const coverageEntry =
    saveResult.fieldValidationState[activityCoverageFieldKey("resp-1")];
  assert.equal(
    coverageEntry?.message?.includes(COVERAGE_MESSAGES.needTwoActivities),
    true,
  );
  assert.equal(coverageEntry?.lastMessageType, "coverage");
  assert.doesNotMatch(coverageEntry?.message ?? "", /estructura/i);
  assert.equal(
    saveResult.fieldValidationState[activityFieldKey("act-1")]?.message,
    undefined,
  );
});

test("B) empty activities report missing coverage not syntax", () => {
  const workMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: MIGUEL_RESPONSIBILITY,
        activities: [
          { id: "act-1", text: "" },
          { id: "act-1b", text: "" },
        ],
      },
      {
        id: "resp-2",
        text: "Yo coordino la trazabilidad financiera de proyectos especiales para mantener informacion confiable dentro del cierre mensual.",
        activities: [
          { id: "act-2", text: "" },
          { id: "act-2b", text: "" },
        ],
      },
    ],
  });

  const emptyActivityValidation = validateActivity("");
  assert.equal(emptyActivityValidation.valid, true);
  assert.equal(emptyActivityValidation.messages.length, 0);

  const saveResult = processWorkMapValidationOnSave(workMap, true);
  assert.equal(saveResult.hasSyntaxGaps, false);
  assert.match(
    saveResult.fieldValidationState[activityCoverageFieldKey("resp-1")]
      ?.message ?? "",
    /actividades/i,
  );
  assert.doesNotMatch(
    saveResult.fieldValidationState[activityFieldKey("act-1")]?.message ?? "",
    /verbo de accion/i,
  );
});

test("C) minimum coverage with one responsibility and zero activities reports missing activities and second responsibility", () => {
  const workMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: MIGUEL_RESPONSIBILITY,
        activities: [{ id: "act-1", text: "" }],
      },
      {
        id: "resp-2",
        text: "",
        activities: [{ id: "act-2", text: "" }],
      },
    ],
  });

  assert.equal(hasCoverageGaps(workMap), true);
  const saveResult = processWorkMapValidationOnSave(workMap, true);
  assert.match(
    saveResult.fieldValidationState["responsibility:resp-2"]?.message ?? "",
    /responsabilidad más/i,
  );
  assert.match(
    saveResult.fieldValidationState[activityCoverageFieldKey("resp-1")]
      ?.message ?? "",
    /actividades/i,
  );
  assert.doesNotMatch(
    saveResult.globalBannerMessage ?? "",
    new RegExp(STRUCTURE_INSUFFICIENT_MESSAGE, "i"),
  );
});

test("D) minimum coverage met with two responsibilities and two activities each has no coverage banner", () => {
  const workMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: MIGUEL_RESPONSIBILITY,
        activities: [
          {
            id: "act-1",
            text: "Actualizo el Manual de Normas de Costeo con los cambios aprobados para mantener criterios consistentes en los proyectos.",
          },
          {
            id: "act-1b",
            text: "Reviso la estructura de identidad de proyectos en el ERP siguiendo el protocolo institucional para mantener trazabilidad financiera.",
          },
        ],
      },
      {
        id: "resp-2",
        text: "Yo coordino la trazabilidad financiera de proyectos especiales para mantener informacion confiable dentro del cierre mensual.",
        activities: [
          {
            id: "act-2",
            text: "Concilio cuentas corporativas en el ERP con los comprobantes aprobados para cerrar el periodo contable.",
          },
          {
            id: "act-2b",
            text: "Documento incidencias de cierre en la plataforma siguiendo el protocolo institucional para mantener trazabilidad financiera.",
          },
        ],
      },
    ],
  });

  assert.equal(hasCoverageGaps(workMap), false);
  const banner = getSaveGlobalBannerMessage(workMap, true);
  assert.notEqual(banner, GLOBAL_BANNER_MESSAGES.coverageOnly);
  assert.notEqual(banner, GLOBAL_BANNER_MESSAGES.both);
});

test("E) complete activity passes without syntax warning", () => {
  const text =
    "Actualizo el Manual de Normas de Costeo con los cambios aprobados para mantener criterios consistentes en los proyectos.";
  const result = validateActivity(text);
  const assist = getActivityAssistMessage(text);

  assert.equal(result.valid, true);
  assert.equal(assist, "");
});

test("E2) partial activity generates structural assistance", () => {
  const text = "Actualizo el Manual de Normas de Costeo.";
  const result = validateActivity(text);
  const assist = getActivityAssistMessage(text);

  assert.equal(result.valid, false);
  assertCognitiveChecklistBase(assist);
  assertCognitiveMissingHowAndResult(assist);
  assert.doesNotMatch(assist, /Por ejemplo:/i);
});

test("C2) responsibility without object asks sobre qué responde", () => {
  const text = "Yo coordino para mejorar resultados.";
  const result = validateResponsibility(text);
  const assist = getResponsibilityAssistMessage(text);

  assert.equal(result.valid, false);
  assert.match(assist, /sobre qu[eé] respondes/i);
  assert.doesNotMatch(assist, /Por ejemplo:/i);
});

test("C3) short activities with only action and vague object are rejected", () => {
  for (const text of [
    "Actualizo reportes.",
    "Reviso facturas.",
    "Doy seguimiento.",
  ]) {
    const result = validateActivity(text);
    assert.equal(result.valid, false, `expected invalid: ${text}`);
  }
});

test("F) empty activity is coverage not syntax", () => {
  const responsibility = {
    id: "resp-1",
    text: MIGUEL_RESPONSIBILITY,
    activities: [{ id: "act-1", text: "" }],
  };

  const coverageMessage = getActivityCoverageMessage(responsibility, 0);
  assert.equal(coverageMessage, COVERAGE_MESSAGES.needTwoActivities);

  const validation = validateActivity("");
  assert.equal(validation.valid, true);

  const saveResult = processWorkMapValidationOnSave(
    buildWorkMap({
      responsibilities: [responsibility, buildWorkMap().responsibilities[1]],
    }),
    true,
  );
  assert.match(
    saveResult.fieldValidationState[activityCoverageFieldKey("resp-1")]
      ?.message ?? "",
    /actividades/i,
  );
  assert.doesNotMatch(
    saveResult.fieldValidationState[activityFieldKey("act-1")]?.message ?? "",
    /verbo de accion/i,
  );
});

test("G) partial responsibility generates structural assistance without examples", () => {
  const text = "Yo defino y autorizo las normas de costeo.";
  const result = validateResponsibility(text);
  const assist = getResponsibilityAssistMessage(text);

  assert.equal(result.valid, false);
  assert.match(assist, /Ya indicas qué decisión ejerces y sobre qué trabajas/i);
  assert.doesNotMatch(assist, /quién responde/i);
  assert.match(assist, /Falta indicar para qué sirve esta responsabilidad/i);
  assert.doesNotMatch(assist, /Por ejemplo:/i);

  const coordText = "Yo coordino la atención de clientes.";
  const coordAssist = getResponsibilityAssistMessage(coordText);
  assert.match(
    coordAssist,
    /Ya indicas qué decisión ejerces y sobre qué trabajas/i,
  );
  assert.doesNotMatch(coordAssist, /quién responde/i);
  assert.match(coordAssist, /Falta indicar para qué sirve esta responsabilidad/i);
  assert.doesNotMatch(coordAssist, /Por ejemplo:/i);
});

test("H) complete responsibility with en el ERP and purpose has no semantic warning", () => {
  const text =
    "Yo defino las normas de costeo en el ERP para asegurar la integridad de la base de datos.";
  const result = validateResponsibility(text);
  const assist = getResponsibilityAssistMessage(text);

  assert.equal(result.valid, true);
  assert.equal(assist, "");
  assert.equal(
    result.messages.some((message) => message.includes(CRITERION_LIMIT_MESSAGE)),
    false,
  );
});

test("I) revision label advances to Revisión 1/2 on first invalid save", () => {
  const invalidResponsibility =
    "Yo defino el programa semanal segun la maestra";

  const entry = evaluateFieldValidationEntry(invalidResponsibility, false);
  assert.equal(getFieldReviewLabel(entry), "Revisión 1/2");
});

test("J) revision label advances to Revisión 2/2 on second invalid save", () => {
  const invalidResponsibility =
    "Yo defino el programa semanal segun la maestra";

  let entry = evaluateFieldValidationEntry(invalidResponsibility, false);
  entry = evaluateFieldValidationEntry(invalidResponsibility, false, entry);
  assert.equal(getFieldReviewLabel(entry), "Revisión 2/2");
});

test("K) allowed_with_warning unlocks after third save attempt", () => {
  let fieldValidationState: WorkMapData["fieldValidationState"] = {};

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const result = processWorkMapValidationOnSave(
      buildSyntaxAttemptWorkMap(fieldValidationState),
      true,
    );
    fieldValidationState = result.fieldValidationState;

    if (attempt < 3) {
      assert.equal(result.canEnterReviewMode, false);
      assert.equal(result.savedWithWarnings, false);
    } else {
      assert.equal(result.canEnterReviewMode, true);
      assert.equal(result.savedWithWarnings, true);
      assert.deepEqual(result.fieldWarnings, []);
      assert.equal(
        result.fieldValidationState["activity:act-1"]?.status,
        "allowed_with_warning",
      );
    }
  }
});

test("C7-A) complete activity 1 has no assistance", () => {
  const result = validateActivity(COMPLETE_ACTIVITY_1);
  const assist = getActivityAssistMessage(COMPLETE_ACTIVITY_1);
  const parts = detectActivityParts(COMPLETE_ACTIVITY_1);

  assert.equal(result.valid, true);
  assert.equal(assist, "");
  assert.equal(parts.hasAction, true);
  assert.equal(parts.hasObject, true);
  assert.equal(parts.hasHow, true);
  assert.equal(parts.hasResult, true);
});

test("C7-B) complete activity 2 has no assistance", () => {
  const result = validateActivity(COMPLETE_ACTIVITY_2);
  const assist = getActivityAssistMessage(COMPLETE_ACTIVITY_2);
  const parts = detectActivityParts(COMPLETE_ACTIVITY_2);

  assert.equal(result.valid, true);
  assert.equal(assist, "");
  assert.equal(parts.hasAction, true);
  assert.equal(parts.hasObject, true);
  assert.equal(parts.hasHow, true);
  assert.equal(parts.hasResult, true);
});

test("C7-C) solicito activity recognizes verb and asks como and resultado", () => {
  const text = "Solicito los códigos de Unidad de Negocio";
  const result = validateActivity(text);
  const assist = getActivityAssistMessage(text);
  const parts = detectActivityParts(text);

  assert.equal(result.valid, false);
  assert.equal(parts.hasAction, true);
  assert.equal(parts.hasObject, true);
  assert.doesNotMatch(assist, /verbo de accion/i);
  assertCognitiveChecklistBase(assist);
  assertCognitiveMissingHowAndResult(assist);
  assert.doesNotMatch(assist, /Por ejemplo:/i);
});

test("C7-D) habilito activity recognizes verb and asks como and resultado", () => {
  const text = "Habilito el módulo de proyectos en Oracle";
  const result = validateActivity(text);
  const assist = getActivityAssistMessage(text);
  const parts = detectActivityParts(text);

  assert.equal(result.valid, false);
  assert.equal(parts.hasAction, true);
  assert.equal(parts.hasObject, true);
  assert.doesNotMatch(assist, /verbo de accion/i);
  assertCognitiveChecklistBase(assist);
  assertCognitiveMissingHowAndResult(assist);
  assert.doesNotMatch(assist, /Por ejemplo:/i);
});

test("C7-E) actualizo reportes remains incomplete with como and resultado guidance", () => {
  const text = "Actualizo reportes.";
  const result = validateActivity(text);
  const assist = getActivityAssistMessage(text);

  assert.equal(result.valid, false);
  assert.doesNotMatch(assist, /verbo de accion/i);
  assertCognitiveChecklistBase(assist);
  assertCognitiveMissingHowAndResult(assist);
});

test("C7-F) doy seguimiento remains incomplete with weak object", () => {
  const text = "Doy seguimiento.";
  const result = validateActivity(text);
  const assist = getActivityAssistMessage(text);
  const parts = detectActivityParts(text);

  assert.equal(result.valid, false);
  assert.equal(parts.hasObject, false);
  assert.match(assist, /precisa sobre qué trabajas/i);
});

test("C7-G) miguel responsibility preserved without syntax warning", () => {
  const result = validateResponsibility(MIGUEL_RESPONSIBILITY);
  const assist = getResponsibilityAssistMessage(MIGUEL_RESPONSIBILITY);

  assert.equal(result.valid, true);
  assert.equal(assist, "");
  assert.equal(
    result.messages.some((message) =>
      message.includes(CRITERION_LIMIT_MESSAGE),
    ),
    false,
  );
});

test("C7-H) revision labels and allowed_with_warning preserved", () => {
  const invalidResponsibility =
    "Yo defino el programa semanal segun la maestra";

  let entry = evaluateFieldValidationEntry(invalidResponsibility, false);
  assert.equal(getFieldReviewLabel(entry), "Revisión 1/2");

  entry = evaluateFieldValidationEntry(invalidResponsibility, false, entry);
  assert.equal(getFieldReviewLabel(entry), "Revisión 2/2");

  let fieldValidationState: WorkMapData["fieldValidationState"] = {};
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const result = processWorkMapValidationOnSave(
      buildSyntaxAttemptWorkMap(fieldValidationState),
      true,
    );
    fieldValidationState = result.fieldValidationState;

    if (attempt === 3) {
      assert.equal(result.canEnterReviewMode, true);
      assert.equal(result.savedWithWarnings, true);
      assert.equal(
        result.fieldValidationState["activity:act-1"]?.status,
        "allowed_with_warning",
      );
    }
  }
});

test("C8-A) solicito structural assistance without invented example", () => {
  const text = "Solicito los códigos de Unidad de Negocio";
  const assist = getActivityAssistMessage(text);

  assert.doesNotMatch(assist, /verbo de accion/i);
  assertCognitiveChecklistBase(assist);
  assertCognitiveMissingHowAndResult(assist);
  assert.doesNotMatch(assist, /Por ejemplo:/i);
  assert.doesNotMatch(assist, /área responsable/i);
});

test("C8-B) habilito structural assistance without invented example", () => {
  const text = "Habilito el módulo de proyectos en Oracle";
  const assist = getActivityAssistMessage(text);

  assert.doesNotMatch(assist, /verbo de accion/i);
  assertCognitiveChecklistBase(assist);
  assertCognitiveMissingHowAndResult(assist);
  assert.doesNotMatch(assist, /Por ejemplo:/i);
  assert.doesNotMatch(assist, /procedimiento de configuración aprobado/i);
});

test("C8-C) manual de normas partial structural assistance", () => {
  const text = "Actualizo el Manual de Normas de Costeo.";
  const assist = getActivityAssistMessage(text);

  assertCognitiveChecklistBase(assist);
  assertCognitiveMissingHowAndResult(assist);
  assert.doesNotMatch(assist, /Por ejemplo:/i);
});

test("C8-D) complete activities still receive no assistance", () => {
  for (const text of [COMPLETE_ACTIVITY_1, COMPLETE_ACTIVITY_2]) {
    assert.equal(validateActivity(text).valid, true);
    assert.equal(getActivityAssistMessage(text), "");
  }
});

test("C8-E) miguel responsibility preserved without syntax warning", () => {
  const result = validateResponsibility(MIGUEL_RESPONSIBILITY);
  const assist = getResponsibilityAssistMessage(MIGUEL_RESPONSIBILITY);

  assert.equal(result.valid, true);
  assert.equal(assist, "");
});

test("C8-F) allowed_with_warning flow preserved", () => {
  let fieldValidationState: WorkMapData["fieldValidationState"] = {};

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const result = processWorkMapValidationOnSave(
      buildSyntaxAttemptWorkMap(fieldValidationState),
      true,
    );
    fieldValidationState = result.fieldValidationState;

    if (attempt === 3) {
      assert.equal(result.canEnterReviewMode, true);
      assert.equal(result.savedWithWarnings, true);
      assert.equal(
        result.fieldValidationState["activity:act-1"]?.status,
        "allowed_with_warning",
      );
    }
  }
});

test("C9-A) gerundio como como - habilito configurando is sufficient", () => {
  const text =
    "Habilito el módulo de proyectos en Oracle configurando los permisos de visibilidad";
  const result = validateActivity(text);
  const assist = getActivityAssistMessage(text);
  const parts = detectActivityParts(text);

  assert.equal(result.valid, true);
  assert.equal(parts.hasAction, true);
  assert.equal(parts.hasObject, true);
  assert.equal(parts.hasHow, true);
  assert.equal(parts.hasResult, false);
  assertSemanticImprovesWithResult(assist);
});

test("C9-B) habilito para dejar is sufficient with result", () => {
  const text =
    "Habilito el módulo de proyectos en Oracle para dejar disponible el registro de proyectos y costos.";
  const result = validateActivity(text);
  const assist = getActivityAssistMessage(text);
  const parts = detectActivityParts(text);

  assert.equal(result.valid, true);
  assert.equal(parts.hasAction, true);
  assert.equal(parts.hasObject, true);
  assert.equal(parts.hasHow, false);
  assert.equal(parts.hasResult, true);
  assertSemanticImprovesWithHow(assist);
});

test("C9-C) actividad completa con gerundio has no assistance", () => {
  const text =
    "Habilito el módulo de proyectos en Oracle configurando los permisos de visibilidad para dejar disponible el registro de proyectos y costos.";
  const result = validateActivity(text);
  const assist = getActivityAssistMessage(text);
  const parts = detectActivityParts(text);

  assert.equal(result.valid, true);
  assert.equal(assist, "");
  assert.equal(parts.hasAction, true);
  assert.equal(parts.hasObject, true);
  assert.equal(parts.hasHow, true);
  assert.equal(parts.hasResult, true);
});

test("C9-D) solicito still asks how and result together", () => {
  const text = "Solicito los códigos de Unidad de Negocio";
  const result = validateActivity(text);
  const assist = getActivityAssistMessage(text);

  assert.equal(result.valid, false);
  assertCognitiveChecklistBase(assist);
  assertCognitiveMissingHowAndResult(assist);
  assert.doesNotMatch(assist, /Por ejemplo:/i);
});

test("C9-E) C7 complete activities still have no assistance", () => {
  for (const text of [COMPLETE_ACTIVITY_1, COMPLETE_ACTIVITY_2]) {
    assert.equal(validateActivity(text).valid, true);
    assert.equal(getActivityAssistMessage(text), "");
  }
});

test("C9-F) miguel responsibility preserved without syntax warning", () => {
  const result = validateResponsibility(MIGUEL_RESPONSIBILITY);
  const assist = getResponsibilityAssistMessage(MIGUEL_RESPONSIBILITY);

  assert.equal(result.valid, true);
  assert.equal(assist, "");
});

test("C9-G) allowed_with_warning flow preserved", () => {
  let fieldValidationState: WorkMapData["fieldValidationState"] = {};

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const result = processWorkMapValidationOnSave(
      buildSyntaxAttemptWorkMap(fieldValidationState),
      true,
    );
    fieldValidationState = result.fieldValidationState;

    if (attempt === 3) {
      assert.equal(result.canEnterReviewMode, true);
      assert.equal(result.savedWithWarnings, true);
      assert.equal(
        result.fieldValidationState["activity:act-1"]?.status,
        "allowed_with_warning",
      );
    }
  }
});

test("C10-A) layer detection keeps object separate from how and result", () => {
  const parts = detectActivityParts(COMPLETE_ACTIVITY_1);

  assert.equal(parts.hasAction, true);
  assert.equal(parts.hasObject, true);
  assert.equal(parts.hasHow, true);
  assert.equal(parts.hasResult, true);
  assert.match(parts.object ?? "", /Manual de Normas de Costeo/i);
  assert.doesNotMatch(parts.object ?? "", /bas[aá]ndome/i);
  assert.match(parts.how ?? "", /bas[aá]ndome en/i);
  assert.match(parts.result ?? "", /para entregar/i);
});

test("C10-B) gerund how does not bleed into object phrase", () => {
  const text =
    "Habilito el módulo de proyectos en Oracle configurando los permisos de visibilidad";
  const parts = detectActivityParts(text);

  assert.equal(parts.hasHow, true);
  assert.equal(parts.hasResult, false);
  assert.match(parts.object ?? "", /modulo de proyectos en oracle/i);
  assert.doesNotMatch(parts.object ?? "", /configurando/i);
  assert.match(parts.how ?? "", /configurando los permisos de visibilidad/i);
});

test("C10-C) non-canonical order still detects all four layers", () => {
  const text =
    "Configurando los permisos de visibilidad, habilito el módulo de proyectos en Oracle para dejar disponible el registro.";
  const parts = detectActivityParts(text);
  const assist = getActivityAssistMessage(text);

  assert.equal(validateActivity(text).valid, true);
  assert.equal(assist, "");
  assert.equal(parts.hasAction, true);
  assert.equal(parts.hasObject, true);
  assert.equal(parts.hasHow, true);
  assert.equal(parts.hasResult, true);
  assert.match(parts.action ?? "", /habilito/i);
  assert.match(parts.how ?? "", /configurando los permisos de visibilidad/i);
  assert.doesNotMatch(parts.how ?? "", /habilito/i);
});

test("C10-D) gerund at start counts as how not action", () => {
  const text =
    "Configurando permisos, habilito el módulo de proyectos en Oracle para dejar disponible el registro.";
  const parts = detectActivityParts(text);

  assert.equal(parts.hasAction, true);
  assert.equal(parts.hasHow, true);
  assert.match(parts.action ?? "", /habilito/i);
  assert.doesNotMatch(parts.action ?? "", /configurando/i);
});

test("C10-E) noun-first activity prompts for leading action verb", () => {
  const text = "Inventario de documentos";
  const result = validateActivity(text);
  const assist = getActivityAssistMessage(text);
  const parts = detectActivityParts(text);

  assert.equal(result.valid, false);
  assert.equal(parts.hasAction, false);
  assert.match(assist, /Empieza con un verbo de accion concreta/i);
  assert.match(assist, /Inventario/i);
  assert.match(assist, /describe un objeto, no la accion que realizas/i);
  assert.doesNotMatch(assist, /Ya tienes:/i);
});

test("C10-F) partial facturas structural assistance without invented example", () => {
  const text = "Actualizo facturas.";
  const assist = getActivityAssistMessage(text);

  assertCognitiveChecklistBase(assist);
  assertCognitiveMissingHowAndResult(assist);
  assert.doesNotMatch(assist, /contra los comprobantes/i);
  assert.doesNotMatch(assist, /Por ejemplo:/i);
  assertNoBannedAmbiguousPhrases(assist);
});

test("C12-A) two invalid activities both start at Revisión 1/2 on first save", () => {
  const workMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: MIGUEL_RESPONSIBILITY,
        activities: [
          { id: "act-1", text: invalidActivityText },
          { id: "act-1b", text: "Actualizo reportes." },
        ],
      },
      {
        id: "resp-2",
        text: "Yo coordino la trazabilidad financiera de proyectos especiales para mantener informacion confiable dentro del cierre mensual.",
        activities: [
          { id: "act-2", text: COMPLETE_ACTIVITY_2 },
          { id: "act-2b", text: COMPLETE_ACTIVITY_1 },
        ],
      },
    ],
  });

  const saveResult = processWorkMapValidationOnSave(workMap, true);
  const act1 = saveResult.fieldValidationState[activityFieldKey("act-1")];
  const act1b = saveResult.fieldValidationState[activityFieldKey("act-1b")];

  assert.equal(act1?.attempts, 1);
  assert.equal(act1b?.attempts, 1);
  assert.equal(getFieldReviewLabel(act1), "Revisión 1/2");
  assert.equal(getFieldReviewLabel(act1b), "Revisión 1/2");
  assert.notEqual(getFieldReviewLabel(act1), "Revisión 2/2");
  assert.notEqual(getFieldReviewLabel(act1b), "Revisión 2/2");
});

test("C12-B) activity at second attempt does not consume another activity counter", () => {
  let fieldValidationState: WorkMapData["fieldValidationState"] = {};
  let workMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: MIGUEL_RESPONSIBILITY,
        activities: [{ id: "act-1", text: invalidActivityText }],
      },
      {
        id: "resp-2",
        text: "Yo coordino la trazabilidad financiera de proyectos especiales para mantener informacion confiable dentro del cierre mensual.",
        activities: [
          { id: "act-2", text: COMPLETE_ACTIVITY_2 },
          { id: "act-2b", text: COMPLETE_ACTIVITY_1 },
        ],
      },
    ],
  });

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const result = processWorkMapValidationOnSave(
      { ...workMap, fieldValidationState },
      true,
    );
    fieldValidationState = result.fieldValidationState;
  }

  const act1 = fieldValidationState[activityFieldKey("act-1")];
  assert.equal(getFieldReviewLabel(act1), "Revisión 2/2");
  assert.equal(act1?.attempts, 2);

  workMap = {
    ...workMap,
    responsibilities: workMap.responsibilities.map((responsibility) =>
      responsibility.id === "resp-1"
        ? {
            ...responsibility,
            activities: [
              ...responsibility.activities,
              { id: "act-1b", text: "Actualizo reportes." },
            ],
          }
        : responsibility,
    ),
  };

  const result = processWorkMapValidationOnSave(
    { ...workMap, fieldValidationState },
    true,
  );
  const act1b = result.fieldValidationState[activityFieldKey("act-1b")];

  assert.equal(getFieldReviewLabel(act1b), "Revisión 1/2");
  assert.equal(act1b?.attempts, 1);
});

test("C12-C) new activity starts at Revisión 1/2 after prior saves on another", () => {
  let fieldValidationState: WorkMapData["fieldValidationState"] = {};
  let workMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: MIGUEL_RESPONSIBILITY,
        activities: [{ id: "act-1", text: invalidActivityText }],
      },
      {
        id: "resp-2",
        text: "Yo coordino la trazabilidad financiera de proyectos especiales para mantener informacion confiable dentro del cierre mensual.",
        activities: [
          { id: "act-2", text: COMPLETE_ACTIVITY_2 },
          { id: "act-2b", text: COMPLETE_ACTIVITY_1 },
        ],
      },
    ],
  });

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const result = processWorkMapValidationOnSave(
      { ...workMap, fieldValidationState },
      true,
    );
    fieldValidationState = result.fieldValidationState;
  }

  workMap = {
    ...workMap,
    responsibilities: workMap.responsibilities.map((responsibility) =>
      responsibility.id === "resp-1"
        ? {
            ...responsibility,
            activities: [
              ...responsibility.activities,
              { id: "act-new", text: "Actualizo reportes." },
            ],
          }
        : responsibility,
    ),
  };

  const result = processWorkMapValidationOnSave(
    { ...workMap, fieldValidationState },
    true,
  );
  const newAct = result.fieldValidationState[activityFieldKey("act-new")];

  assert.equal(newAct?.attempts, 1);
  assert.equal(getFieldReviewLabel(newAct), "Revisión 1/2");
  assert.notEqual(newAct?.status, "allowed_with_warning");
});

test("C12-D) empty activity reports coverage without consuming attempts", () => {
  let fieldValidationState: WorkMapData["fieldValidationState"] = {};
  const workMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: MIGUEL_RESPONSIBILITY,
        activities: [{ id: "act-1", text: "" }],
      },
      {
        id: "resp-2",
        text: "",
        activities: [{ id: "act-2", text: "" }],
      },
    ],
  });

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const result = processWorkMapValidationOnSave(
      { ...workMap, fieldValidationState },
      true,
    );
    fieldValidationState = result.fieldValidationState;
    const coverageEntry =
      result.fieldValidationState[activityCoverageFieldKey("resp-1")];
    assert.equal(coverageEntry?.attempts ?? 0, 0);
    assert.match(coverageEntry?.message ?? "", /actividades/i);
    assert.equal(coverageEntry?.lastMessageType, "coverage");
    assert.doesNotMatch(coverageEntry?.message ?? "", /verbo de accion/i);
    assert.equal(
      getFieldReviewLabel(coverageEntry),
      null,
    );
  }
});

test("C12-E) deleting an activity does not alter other activity counters", () => {
  let fieldValidationState: WorkMapData["fieldValidationState"] = {};
  let workMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: MIGUEL_RESPONSIBILITY,
        activities: [{ id: "act-1", text: invalidActivityText }],
      },
      {
        id: "resp-2",
        text: "Yo coordino la trazabilidad financiera de proyectos especiales para mantener informacion confiable dentro del cierre mensual.",
        activities: [
          { id: "act-2", text: COMPLETE_ACTIVITY_2 },
          { id: "act-2b", text: COMPLETE_ACTIVITY_1 },
        ],
      },
    ],
  });

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const result = processWorkMapValidationOnSave(
      { ...workMap, fieldValidationState },
      true,
    );
    fieldValidationState = result.fieldValidationState;
  }

  workMap = {
    ...workMap,
    responsibilities: workMap.responsibilities.map((responsibility) =>
      responsibility.id === "resp-1"
        ? {
            ...responsibility,
            activities: [
              ...responsibility.activities,
              { id: "act-1b", text: "Actualizo reportes." },
            ],
          }
        : responsibility,
    ),
  };

  const beforeDelete = processWorkMapValidationOnSave(
    { ...workMap, fieldValidationState },
    true,
  );
  fieldValidationState = beforeDelete.fieldValidationState;
  const act1bBefore = fieldValidationState[activityFieldKey("act-1b")];
  assert.equal(getFieldReviewLabel(act1bBefore), "Revisión 1/2");

  workMap = {
    ...workMap,
    responsibilities: workMap.responsibilities.map((responsibility) =>
      responsibility.id === "resp-1"
        ? {
            ...responsibility,
            activities: responsibility.activities.filter(
              (activity) => activity.id !== "act-1",
            ),
          }
        : responsibility,
    ),
  };

  const result = processWorkMapValidationOnSave(
    { ...workMap, fieldValidationState },
    true,
  );

  assert.equal(
    result.fieldValidationState[activityFieldKey("act-1")],
    undefined,
  );
  const act1bAfter = result.fieldValidationState[activityFieldKey("act-1b")];
  assert.equal(act1bAfter?.attempts, (act1bBefore?.attempts ?? 0) + 1);
  assert.equal(getFieldReviewLabel(act1bAfter), "Revisión 2/2");
  assert.notEqual(act1bAfter?.status, "unchecked");
});

test("C12-F) responsibility and activity counters are independent", () => {
  const invalidResponsibility = "Yo defino el programa semanal segun la maestra";
  const workMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: invalidResponsibility,
        activities: [{ id: "act-1", text: invalidActivityText }],
      },
      {
        id: "resp-2",
        text: "Yo coordino la trazabilidad financiera de proyectos especiales para mantener informacion confiable dentro del cierre mensual.",
        activities: [
          { id: "act-2", text: COMPLETE_ACTIVITY_2 },
          { id: "act-2b", text: COMPLETE_ACTIVITY_1 },
        ],
      },
    ],
  });

  const result = processWorkMapValidationOnSave(workMap, true);
  const respEntry =
    result.fieldValidationState[responsibilityFieldKey("resp-1")];
  const actEntry = result.fieldValidationState[activityFieldKey("act-1")];

  assert.equal(respEntry?.attempts, 1);
  assert.equal(actEntry?.attempts, 1);
  assert.equal(getFieldReviewLabel(respEntry), "Revisión 1/2");
  assert.equal(getFieldReviewLabel(actEntry), "Revisión 1/2");
});

test("C12-G) substantial text change advances attempt cycle without reset", () => {
  let fieldValidationState: WorkMapData["fieldValidationState"] = {};
  let workMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: MIGUEL_RESPONSIBILITY,
        activities: [{ id: "act-1", text: invalidActivityText }],
      },
      {
        id: "resp-2",
        text: "Yo coordino la trazabilidad financiera de proyectos especiales para mantener informacion confiable dentro del cierre mensual.",
        activities: [
          { id: "act-2", text: COMPLETE_ACTIVITY_2 },
          { id: "act-2b", text: COMPLETE_ACTIVITY_1 },
        ],
      },
    ],
  });

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const result = processWorkMapValidationOnSave(
      { ...workMap, fieldValidationState },
      true,
    );
    fieldValidationState = result.fieldValidationState;
  }

  assert.equal(
    getFieldReviewLabel(fieldValidationState[activityFieldKey("act-1")]),
    "Revisión 2/2",
  );

  workMap = {
    ...workMap,
    responsibilities: workMap.responsibilities.map((responsibility) =>
      responsibility.id === "resp-1"
        ? {
            ...responsibility,
            activities: responsibility.activities.map((activity) =>
              activity.id === "act-1"
                ? {
                    ...activity,
                    text: "Mido las dimensiones de la pieza y registro desviaciones sin criterio.",
                  }
                : activity,
            ),
          }
        : responsibility,
    ),
  };

  const result = processWorkMapValidationOnSave(
    { ...workMap, fieldValidationState },
    true,
  );
  const act1 = result.fieldValidationState[activityFieldKey("act-1")];

  assert.equal(act1?.attempts, 3);
  assert.equal(act1?.status, "allowed_with_warning");
  assert.equal(act1?.message, ACCEPTED_WITH_WARNING_MESSAGE);
  assert.equal(
    getFieldReviewLabel(act1),
    "Revisión completada con advertencia",
  );
});

test("C12-H) same invalid text increments same unit from 1/2 to 2/2", () => {
  let fieldValidationState: WorkMapData["fieldValidationState"] = {};
  const workMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: MIGUEL_RESPONSIBILITY,
        activities: [{ id: "act-1", text: invalidActivityText }],
      },
      {
        id: "resp-2",
        text: "Yo coordino la trazabilidad financiera de proyectos especiales para mantener informacion confiable dentro del cierre mensual.",
        activities: [
          { id: "act-2", text: COMPLETE_ACTIVITY_2 },
          { id: "act-2b", text: COMPLETE_ACTIVITY_1 },
        ],
      },
    ],
  });

  const first = processWorkMapValidationOnSave(
    { ...workMap, fieldValidationState },
    true,
  );
  fieldValidationState = first.fieldValidationState;
  assert.equal(
    getFieldReviewLabel(fieldValidationState[activityFieldKey("act-1")]),
    "Revisión 1/2",
  );

  const second = processWorkMapValidationOnSave(
    { ...workMap, fieldValidationState },
    true,
  );
  assert.equal(
    getFieldReviewLabel(second.fieldValidationState[activityFieldKey("act-1")]),
    "Revisión 2/2",
  );
});

test("C12-I) allowed_with_warning applies per unit without stealing other assistance", () => {
  let fieldValidationState: WorkMapData["fieldValidationState"] = {};
  let workMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: MIGUEL_RESPONSIBILITY,
        activities: [
          { id: "act-1", text: invalidActivityText },
          { id: "act-1b", text: COMPLETE_ACTIVITY_1 },
        ],
      },
      {
        id: "resp-2",
        text: "Yo coordino la trazabilidad financiera de proyectos especiales para mantener informacion confiable dentro del cierre mensual.",
        activities: [
          { id: "act-2", text: COMPLETE_ACTIVITY_2 },
          { id: "act-2b", text: COMPLETE_ACTIVITY_1 },
        ],
      },
    ],
  });

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const result = processWorkMapValidationOnSave(
      { ...workMap, fieldValidationState },
      true,
    );
    fieldValidationState = result.fieldValidationState;
    if (attempt === 3) {
      assert.equal(
        result.fieldValidationState[activityFieldKey("act-1")]?.status,
        "allowed_with_warning",
      );
      assert.equal(result.savedWithWarnings, true);
      assert.equal(result.canEnterReviewMode, true);
    }
  }

  workMap = {
    ...workMap,
    responsibilities: workMap.responsibilities.map((responsibility) =>
      responsibility.id === "resp-1"
        ? {
            ...responsibility,
            activities: [
              ...responsibility.activities,
              { id: "act-1c", text: "Actualizo reportes." },
            ],
          }
        : responsibility,
    ),
  };

  const result = processWorkMapValidationOnSave(
    { ...workMap, fieldValidationState },
    true,
  );
  const act1 = result.fieldValidationState[activityFieldKey("act-1")];
  const act1c = result.fieldValidationState[activityFieldKey("act-1c")];

  assert.equal(act1?.status, "allowed_with_warning");
  assert.equal(getFieldReviewLabel(act1c), "Revisión 1/2");
  assert.equal(act1c?.attempts, 1);
  assert.equal(result.canEnterReviewMode, false);
  assert.ok(act1c?.message && act1c.message.length > 0);
});

test("C12-J) coverage gaps do not consume syntax attempts on empty fields", () => {
  let fieldValidationState: WorkMapData["fieldValidationState"] = {};
  const workMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: MIGUEL_RESPONSIBILITY,
        activities: [{ id: "act-1", text: "" }],
      },
      {
        id: "resp-2",
        text: "",
        activities: [{ id: "act-2", text: "" }],
      },
    ],
  });

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const result = processWorkMapValidationOnSave(
      { ...workMap, fieldValidationState },
      true,
    );
    fieldValidationState = result.fieldValidationState;

    for (const key of Object.keys(result.fieldValidationState)) {
      assert.equal(result.fieldValidationState[key]?.attempts ?? 0, 0);
      assert.notEqual(
        result.fieldValidationState[key]?.lastMessageType,
        "syntax",
      );
    }
    assert.match(
      result.fieldValidationState[activityCoverageFieldKey("resp-1")]
        ?.message ?? "",
      /actividades/i,
    );
    assert.match(
      result.fieldValidationState["responsibility:resp-2"]?.message ?? "",
      /responsabilidad más/i,
    );
  }
});

test("C12-K) approved assistance regression preserved", () => {
  assert.equal(validateResponsibility(MIGUEL_RESPONSIBILITY).valid, true);
  assert.equal(getResponsibilityAssistMessage(MIGUEL_RESPONSIBILITY), "");
  assert.equal(validateActivity(COMPLETE_ACTIVITY_1).valid, true);
  assert.equal(getActivityAssistMessage(COMPLETE_ACTIVITY_1), "");

  const solicitoAssist = getActivityAssistMessage(
    "Solicito los códigos de Unidad de Negocio",
  );
  assertCognitiveChecklistBase(solicitoAssist);
  assertCognitiveMissingHowAndResult(solicitoAssist);
  assert.doesNotMatch(solicitoAssist, /Por ejemplo:/i);

  const habilitoAssist = getActivityAssistMessage(
    "Habilito el módulo de proyectos en Oracle",
  );
  assertCognitiveChecklistBase(habilitoAssist);
  assertCognitiveMissingHowAndResult(habilitoAssist);
  assert.doesNotMatch(habilitoAssist, /Por ejemplo:/i);

  let fieldValidationState: WorkMapData["fieldValidationState"] = {};
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const result = processWorkMapValidationOnSave(
      buildSyntaxAttemptWorkMap(fieldValidationState),
      true,
    );
    fieldValidationState = result.fieldValidationState;
    if (attempt === 3) {
      assert.equal(result.canEnterReviewMode, true);
      assert.equal(result.savedWithWarnings, true);
      assert.equal(
        result.fieldValidationState["activity:act-1"]?.status,
        "allowed_with_warning",
      );
    }
  }
});

test("C15-A) complete valid map unlocks review mode on save", () => {
  const workMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: MIGUEL_RESPONSIBILITY,
        activities: [
          { id: "act-1", text: COMPLETE_ACTIVITY_1 },
          { id: "act-1b", text: COMPLETE_ACTIVITY_2 },
        ],
      },
      {
        id: "resp-2",
        text: "Yo coordino la trazabilidad financiera de proyectos especiales para mantener informacion confiable dentro del cierre mensual.",
        activities: [
          { id: "act-2", text: COMPLETE_ACTIVITY_2 },
          { id: "act-2b", text: COMPLETE_ACTIVITY_1 },
        ],
      },
    ],
  });

  const saveResult = processWorkMapValidationOnSave(workMap, true);
  assert.equal(saveResult.canEnterReviewMode, true);
  assert.equal(saveResult.savedWithWarnings, false);
  assert.equal(saveResult.hasCoverageGaps, false);
  assert.equal(saveResult.hasSyntaxGaps, false);
});

test("L) save orchestration uses operational readiness in WorkMapIntake", () => {
  const intakePath = resolve(testDir, "../../src/components/WorkMapIntake.tsx");
  const source = readFileSync(intakePath, "utf8");

  assert.match(source, /evaluateWorkMapOperationalReadiness/);
  assert.doesNotMatch(source, /processWorkMapValidationOnSave/);
  assert.doesNotMatch(
    source,
    /validateResponsibility\([^)]*\)\.valid\s*&&\s*set/,
  );
  assert.doesNotMatch(source, /onChange=\{[^}]*validateResponsibility/);
});

const COMPARANDO_ACTIVITY_1 =
  "Analizo la proyección mensual de erogaciones comparando el gasto real contra Oracle para generar reportes de desviaciones con análisis de causa raíz.";

const COMPARANDO_ACTIVITY_2 =
  "Verifico la carga del presupuesto en Oracle comparando el sistema contra el documento firmado para habilitar el control presupuestal automático.";

test("C17-A) comparando activity 1 passes valid without assistance", () => {
  const result = validateActivity(COMPARANDO_ACTIVITY_1);
  const assist = getActivityAssistMessage(COMPARANDO_ACTIVITY_1);
  const parts = detectActivityParts(COMPARANDO_ACTIVITY_1);

  assert.equal(result.valid, true);
  assert.equal(assist, "");
  assert.equal(parts.hasAction, true);
  assert.equal(parts.hasObject, true);
  assert.equal(parts.hasHow, true);
  assert.equal(parts.hasResult, true);
  assert.match(parts.action ?? "", /Analizo/i);
  assert.match(parts.object ?? "", /proyeccion mensual de erogaciones/i);
  assert.match(parts.how ?? "", /comparando el gasto real contra oracle/i);
  assert.match(parts.result ?? "", /para generar reportes/i);
});

test("C17-B) comparando activity 2 passes valid without assistance", () => {
  const result = validateActivity(COMPARANDO_ACTIVITY_2);
  const assist = getActivityAssistMessage(COMPARANDO_ACTIVITY_2);
  const parts = detectActivityParts(COMPARANDO_ACTIVITY_2);

  assert.equal(result.valid, true);
  assert.equal(assist, "");
  assert.equal(parts.hasAction, true);
  assert.equal(parts.hasObject, true);
  assert.equal(parts.hasHow, true);
  assert.equal(parts.hasResult, true);
  assert.match(parts.action ?? "", /Verifico/i);
  assert.match(parts.object ?? "", /carga del presupuesto en oracle/i);
  assert.match(parts.how ?? "", /comparando el sistema contra el documento firmado/i);
  assert.match(parts.result ?? "", /para habilitar el control presupuestal/i);
});

test("C17-C) para inside comparando is not detected as result connector", () => {
  const parts = detectActivityParts(COMPARANDO_ACTIVITY_1);

  assert.equal(parts.hasHow, true);
  assert.doesNotMatch(parts.how ?? "", /^com$/i);
  assert.doesNotMatch(parts.result ?? "", /^parando/i);
  assert.match(parts.how ?? "", /comparando/i);
  assert.match(parts.result ?? "", /para generar/i);
});

test("C17-D) para generar and para habilitar still detected as result", () => {
  const actualizoParts = detectActivityParts(
    "Actualizo reportes con datos aprobados para entregar información al equipo.",
  );
  assert.equal(actualizoParts.hasResult, true);
  assert.match(actualizoParts.result ?? "", /para entregar/i);

  for (const text of [
    "Habilito el módulo de proyectos en Oracle configurando permisos para dejar disponible el registro de proyectos.",
    "Concilio el inventario siguiendo el calendario trimestral para actualizar los atributos de depreciación.",
  ]) {
    const parts = detectActivityParts(text);
    assert.equal(parts.hasResult, true, `expected hasResult for: ${text}`);
    assert.match(parts.result ?? "", /para /i, `expected para result for: ${text}`);
    assert.equal(validateActivity(text).valid, true, `expected valid: ${text}`);
    assert.equal(getActivityAssistMessage(text), "", `expected no assist: ${text}`);
  }
});

test("C17-E) preparando with para entregar not broken by para inside preparando", () => {
  const text =
    "Preparo el paquete de cierre preparando la documentación soporte para entregar el expediente al área de auditoría.";
  const parts = detectActivityParts(text);
  const result = validateActivity(text);
  const assist = getActivityAssistMessage(text);

  assert.equal(result.valid, true);
  assert.equal(assist, "");
  assert.equal(parts.hasHow, true);
  assert.equal(parts.hasResult, true);
  assert.match(parts.how ?? "", /preparando la documentacion soporte/i);
  assert.match(parts.result ?? "", /para entregar el expediente/i);
  assert.doesNotMatch(parts.result ?? "", /^rando/i);
});

test("C17-F) miguel responsibility preserved without syntax warning", () => {
  const result = validateResponsibility(MIGUEL_RESPONSIBILITY);
  const assist = getResponsibilityAssistMessage(MIGUEL_RESPONSIBILITY);

  assert.equal(result.valid, true);
  assert.equal(assist, "");
  assert.equal(
    result.messages.some((message) => message.includes(CRITERION_LIMIT_MESSAGE)),
    false,
  );
});

test("C17-G) C8 C9 solicito and habilito structural assistance preserved", () => {
  const solicitoText = "Solicito los códigos de Unidad de Negocio";
  const solicitoAssist = getActivityAssistMessage(solicitoText);
  assert.equal(validateActivity(solicitoText).valid, false);
  assertCognitiveChecklistBase(solicitoAssist);
  assertCognitiveMissingHowAndResult(solicitoAssist);
  assert.doesNotMatch(solicitoAssist, /Por ejemplo:/i);

  const habilitoText = "Habilito el módulo de proyectos en Oracle";
  const habilitoAssist = getActivityAssistMessage(habilitoText);
  assert.equal(validateActivity(habilitoText).valid, false);
  assertCognitiveChecklistBase(habilitoAssist);
  assertCognitiveMissingHowAndResult(habilitoAssist);
  assert.doesNotMatch(habilitoAssist, /Por ejemplo:/i);

  const habilitoGerundText =
    "Habilito el módulo de proyectos en Oracle configurando los permisos de visibilidad para dejar disponible el registro de proyectos y costos.";
  assert.equal(validateActivity(habilitoGerundText).valid, true);
  assert.equal(getActivityAssistMessage(habilitoGerundText), "");
});

test("C17-H) allowed_with_warning and counter per-unit preserved", () => {
  let fieldValidationState: WorkMapData["fieldValidationState"] = {};

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const result = processWorkMapValidationOnSave(
      buildSyntaxAttemptWorkMap(fieldValidationState),
      true,
    );
    fieldValidationState = result.fieldValidationState;

    if (attempt === 3) {
      assert.equal(result.canEnterReviewMode, true);
      assert.equal(result.savedWithWarnings, true);
      assert.equal(
        result.fieldValidationState["activity:act-1"]?.status,
        "allowed_with_warning",
      );
    }
  }

  const workMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: MIGUEL_RESPONSIBILITY,
        activities: [
          { id: "act-1", text: invalidActivityText },
          { id: "act-1b", text: "Actualizo reportes." },
        ],
      },
      {
        id: "resp-2",
        text: "Yo coordino la trazabilidad financiera de proyectos especiales para mantener informacion confiable dentro del cierre mensual.",
        activities: [
          { id: "act-2", text: COMPLETE_ACTIVITY_2 },
          { id: "act-2b", text: COMPLETE_ACTIVITY_1 },
        ],
      },
    ],
  });

  const saveResult = processWorkMapValidationOnSave(workMap, true);
  const act1 = saveResult.fieldValidationState[activityFieldKey("act-1")];
  const act1b = saveResult.fieldValidationState[activityFieldKey("act-1b")];

  assert.equal(act1?.attempts, 1);
  assert.equal(act1b?.attempts, 1);
  assert.equal(getFieldReviewLabel(act1), "Revisión 1/2");
  assert.equal(getFieldReviewLabel(act1b), "Revisión 1/2");
});

test("C18-A) one non-empty activity uses block coverage without syntax assist", () => {
  const workMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: MIGUEL_RESPONSIBILITY,
        activities: [
          {
            id: "act-1",
            text: COMPLETE_ACTIVITY_1,
          },
        ],
      },
      {
        id: "resp-2",
        text: "Yo coordino la trazabilidad financiera de proyectos especiales para mantener informacion confiable dentro del cierre mensual.",
        activities: [
          { id: "act-2", text: COMPLETE_ACTIVITY_2 },
          { id: "act-2b", text: COMPLETE_ACTIVITY_1 },
        ],
      },
    ],
  });

  const result = processWorkMapValidationOnSave(workMap, true);
  const coverageEntry =
    result.fieldValidationState[activityCoverageFieldKey("resp-1")];
  const activityEntry = result.fieldValidationState[activityFieldKey("act-1")];

  assert.equal(
    coverageEntry?.message,
    COVERAGE_MESSAGES.needOneMoreActivity,
  );
  assert.equal(coverageEntry?.lastMessageType, "coverage");
  assert.equal(coverageEntry?.attempts ?? 0, 0);
  assert.equal(getFieldReviewLabel(coverageEntry), null);
  assert.equal(shouldShowFieldAssist(coverageEntry, true, true), false);
  assert.notEqual(activityEntry?.lastMessageType, "syntax");
  assert.equal(activityEntry?.message, undefined);
  assert.equal(shouldShowFieldAssist(activityEntry, true, true), false);
});

test("C18-B) two non-empty activities clear coverage state", () => {
  const fieldValidationState: WorkMapData["fieldValidationState"] = {
    [activityCoverageFieldKey("resp-1")]: {
      attempts: 0,
      lastTextReviewed: "",
      lastMessageType: "coverage",
      status: "needs_help",
      message: COVERAGE_MESSAGES.needOneMoreActivity,
    },
    [activityFieldKey("act-1")]: {
      attempts: 0,
      lastTextReviewed: COMPLETE_ACTIVITY_1,
      lastMessageType: "coverage",
      status: "needs_help",
      message: COVERAGE_MESSAGES.needOneMoreActivity,
    },
  };

  const workMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: MIGUEL_RESPONSIBILITY,
        activities: [
          { id: "act-1", text: COMPLETE_ACTIVITY_1 },
          { id: "act-1b", text: COMPLETE_ACTIVITY_2 },
        ],
      },
      {
        id: "resp-2",
        text: "Yo coordino la trazabilidad financiera de proyectos especiales para mantener informacion confiable dentro del cierre mensual.",
        activities: [
          { id: "act-2", text: COMPLETE_ACTIVITY_2 },
          { id: "act-2b", text: COMPLETE_ACTIVITY_1 },
        ],
      },
    ],
    fieldValidationState,
  });

  const result = processWorkMapValidationOnSave(workMap, true);

  assert.equal(
    result.fieldValidationState[activityCoverageFieldKey("resp-1")],
    undefined,
  );
  const act1 = result.fieldValidationState[activityFieldKey("act-1")];
  assert.notEqual(act1?.lastMessageType, "coverage");
  assert.equal(act1?.message, undefined);
  assert.equal(
    getResponsibilityActivitiesCoverageMessage(workMap.responsibilities[0]),
    undefined,
  );
});

test("C18-C) stale one-activity coverage clears after adding second valid activity", () => {
  let fieldValidationState: WorkMapData["fieldValidationState"] = {};
  let workMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: MIGUEL_RESPONSIBILITY,
        activities: [{ id: "act-1", text: COMPLETE_ACTIVITY_1 }],
      },
      {
        id: "resp-2",
        text: "Yo coordino la trazabilidad financiera de proyectos especiales para mantener informacion confiable dentro del cierre mensual.",
        activities: [
          { id: "act-2", text: COMPLETE_ACTIVITY_2 },
          { id: "act-2b", text: COMPLETE_ACTIVITY_1 },
        ],
      },
    ],
  });

  const firstSave = processWorkMapValidationOnSave(workMap, true);
  fieldValidationState = firstSave.fieldValidationState;
  assert.equal(
    firstSave.fieldValidationState[activityCoverageFieldKey("resp-1")]
      ?.message,
    COVERAGE_MESSAGES.needOneMoreActivity,
  );

  workMap = {
    ...workMap,
    responsibilities: workMap.responsibilities.map((responsibility) =>
      responsibility.id === "resp-1"
        ? {
            ...responsibility,
            activities: [
              ...responsibility.activities,
              { id: "act-1b", text: COMPLETE_ACTIVITY_2 },
            ],
          }
        : responsibility,
    ),
    fieldValidationState,
  };

  const secondSave = processWorkMapValidationOnSave(workMap, true);
  assert.equal(
    secondSave.fieldValidationState[activityCoverageFieldKey("resp-1")],
    undefined,
  );
  assert.equal(
    secondSave.fieldValidationState[activityFieldKey("act-1")]?.message,
    undefined,
  );
});

test("C18-D) weak syntax activity keeps FieldAssistCard revision labels", () => {
  const workMap = buildSyntaxAttemptWorkMap();
  const result = processWorkMapValidationOnSave(workMap, true);
  const act1 = result.fieldValidationState[activityFieldKey("act-1")];

  assert.equal(act1?.lastMessageType, "syntax");
  assert.equal(act1?.attempts, 1);
  assert.equal(getFieldReviewLabel(act1), "Revisión 1/2");
  assert.equal(shouldShowFieldAssist(act1, true, true), true);
  assert.ok(act1?.message && act1.message.length > 0);
});

test("C18-E) empty activity coverage does not consume syntax attempts", () => {
  let fieldValidationState: WorkMapData["fieldValidationState"] = {};
  const workMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: MIGUEL_RESPONSIBILITY,
        activities: [{ id: "act-1", text: "" }],
      },
      {
        id: "resp-2",
        text: "Yo coordino la trazabilidad financiera de proyectos especiales para mantener informacion confiable dentro del cierre mensual.",
        activities: [
          { id: "act-2", text: COMPLETE_ACTIVITY_2 },
          { id: "act-2b", text: COMPLETE_ACTIVITY_1 },
        ],
      },
    ],
  });

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const result = processWorkMapValidationOnSave(
      { ...workMap, fieldValidationState },
      true,
    );
    fieldValidationState = result.fieldValidationState;
    const coverageEntry =
      result.fieldValidationState[activityCoverageFieldKey("resp-1")];
    const activityEntry =
      result.fieldValidationState[activityFieldKey("act-1")];

    assert.equal(coverageEntry?.attempts ?? 0, 0);
    assert.equal(coverageEntry?.lastMessageType, "coverage");
    assert.equal(getFieldReviewLabel(coverageEntry), null);
    assert.notEqual(activityEntry?.lastMessageType, "syntax");
    assert.equal(activityEntry?.attempts ?? 0, 0);
  }
});

test("C18-F) two valid activities plus one weak activity has no quantity coverage", () => {
  const workMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: MIGUEL_RESPONSIBILITY,
        activities: [
          { id: "act-1", text: COMPLETE_ACTIVITY_1 },
          { id: "act-1b", text: COMPLETE_ACTIVITY_2 },
          { id: "act-1c", text: invalidActivityText },
        ],
      },
      {
        id: "resp-2",
        text: "Yo coordino la trazabilidad financiera de proyectos especiales para mantener informacion confiable dentro del cierre mensual.",
        activities: [
          { id: "act-2", text: COMPLETE_ACTIVITY_2 },
          { id: "act-2b", text: COMPLETE_ACTIVITY_1 },
        ],
      },
    ],
  });

  const result = processWorkMapValidationOnSave(workMap, true);

  assert.equal(
    result.fieldValidationState[activityCoverageFieldKey("resp-1")],
    undefined,
  );
  const weakActivity =
    result.fieldValidationState[activityFieldKey("act-1c")];
  assert.equal(weakActivity?.lastMessageType, "syntax");
  assert.equal(getFieldReviewLabel(weakActivity), "Revisión 1/2");
});

test("C18-G) comparando activities still pass without assistance", () => {
  const workMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: MIGUEL_RESPONSIBILITY,
        activities: [
          { id: "act-1", text: COMPARANDO_ACTIVITY_1 },
          { id: "act-1b", text: COMPARANDO_ACTIVITY_2 },
        ],
      },
      {
        id: "resp-2",
        text: "Yo coordino la trazabilidad financiera de proyectos especiales para mantener informacion confiable dentro del cierre mensual.",
        activities: [
          { id: "act-2", text: COMPLETE_ACTIVITY_2 },
          { id: "act-2b", text: COMPLETE_ACTIVITY_1 },
        ],
      },
    ],
  });

  const result = processWorkMapValidationOnSave(workMap, true);

  assert.equal(
    result.fieldValidationState[activityCoverageFieldKey("resp-1")],
    undefined,
  );
  assert.equal(
    result.fieldValidationState[activityFieldKey("act-1")]?.status,
    "valid",
  );
  assert.equal(
    result.fieldValidationState[activityFieldKey("act-1b")]?.status,
    "valid",
  );
  assert.equal(result.hasSyntaxGaps, false);
});

test("C21-A) inline blur assist does not increment formal attempts", () => {
  const invalidResponsibility =
    "Yo defino el programa semanal segun la maestra";

  const entry = evaluateInlineFieldValidationEntry(
    invalidResponsibility,
    false,
    undefined,
    getResponsibilityAssistMessage(invalidResponsibility),
  );

  assert.equal(entry.attempts, 0);
  assert.equal(entry.status, "inline_assisted");
  assert.equal(entry.lastMessageType, "inline");
  assert.equal(entry.inlineAssistShown, true);
  assert.equal(getFieldReviewLabel(entry), null);
  assert.equal(shouldShowInlineFieldHint(entry, false), true);
  assert.equal(shouldShowFieldAssist(entry, false, true), false);
});

test("C21-B) empty field inline evaluation skips syntax and attempts", () => {
  const entry = evaluateInlineFieldValidationEntry("", true, {
    attempts: 2,
    lastTextReviewed: "prev",
    lastTextHash: "prev",
    lastMessageType: "syntax",
    status: "needs_help",
    message: "old",
  });

  assert.equal(entry.attempts, 2);
  assert.equal(entry.lastMessageType, "none");
  assert.equal(entry.inlineAssistShown, false);
  assert.equal(getFieldReviewLabel(entry), "Revisión 2/2");
});

test("C21-C) formal save increments attempts only for non-empty invalid syntax", () => {
  const workMap = buildSyntaxAttemptWorkMap();
  const saveResult = processWorkMapValidationOnSave(workMap, true);
  const act1 = saveResult.fieldValidationState[activityFieldKey("act-1")];

  assert.equal(act1?.attempts, 1);
  assert.equal(act1?.lastMessageType, "syntax");
  assert.equal(getFieldReviewLabel(act1), "Revisión 1/2");
  assert.equal(shouldShowFieldAssist(act1, true, true), true);
});

test("C21-D) coverage messages do not increment attempts or show revision", () => {
  const workMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: MIGUEL_RESPONSIBILITY,
        activities: [{ id: "act-1", text: "" }],
      },
      {
        id: "resp-2",
        text: "",
        activities: [{ id: "act-2", text: "" }],
      },
    ],
  });

  const saveResult = processWorkMapValidationOnSave(workMap, true);
  const coverageEntry =
    saveResult.fieldValidationState[activityCoverageFieldKey("resp-1")];
  const resp2Entry =
    saveResult.fieldValidationState[responsibilityFieldKey("resp-2")];

  assert.equal(coverageEntry?.attempts ?? 0, 0);
  assert.equal(coverageEntry?.lastMessageType, "coverage");
  assert.equal(getFieldReviewLabel(coverageEntry), null);
  assert.equal(shouldShowFieldAssist(coverageEntry, true, true), false);
  assert.equal(resp2Entry?.lastMessageType, "coverage");
  assert.equal(resp2Entry?.attempts ?? 0, 0);
});

test("C21-E) blur inline then formal save counts one syntax attempt", () => {
  const invalidActivity = "Actualizo reportes.";
  const fieldKey = activityFieldKey("act-1");
  const inlineEntry = evaluateInlineFieldValidationEntry(
    invalidActivity,
    false,
    undefined,
    getActivityAssistMessage(invalidActivity),
  );

  assert.equal(inlineEntry.attempts, 0);

  const workMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: MIGUEL_RESPONSIBILITY,
        activities: [{ id: "act-1", text: invalidActivity }],
      },
      {
        id: "resp-2",
        text: "Yo coordino la trazabilidad financiera de proyectos especiales para mantener informacion confiable dentro del cierre mensual.",
        activities: [
          { id: "act-2", text: COMPLETE_ACTIVITY_2 },
          { id: "act-2b", text: COMPLETE_ACTIVITY_1 },
        ],
      },
    ],
    fieldValidationState: {
      [fieldKey]: inlineEntry,
    },
  });

  const transaction = createSaveValidationTransaction();
  const saveResult = processWorkMapValidationOnSave(workMap, true, transaction);
  const act1 = saveResult.fieldValidationState[fieldKey];

  assert.equal(act1?.attempts, 1);
  assert.equal(act1?.lastMessageType, "syntax");
  assert.equal(act1?.inlineAssistShown, false);
  assert.equal(getFieldReviewLabel(act1), "Revisión 1/2");

  const duplicateSave = processWorkMapValidationOnSave(
    { ...workMap, fieldValidationState: saveResult.fieldValidationState },
    true,
    transaction,
  );
  assert.equal(
    duplicateSave.fieldValidationState[fieldKey]?.attempts,
    1,
  );
});

test("C21-F) text change after inline assist preserves formal counter while still insufficient", () => {
  const invalidActivity = "Actualizo reportes.";
  const fieldKey = activityFieldKey("act-1");
  let state = {
    [fieldKey]: evaluateInlineFieldValidationEntry(
      invalidActivity,
      false,
      undefined,
      getActivityAssistMessage(invalidActivity),
    ),
  };

  const firstSave = processWorkMapValidationOnSave(
    buildWorkMap({
      responsibilities: [
        {
          id: "resp-1",
          text: MIGUEL_RESPONSIBILITY,
          activities: [{ id: "act-1", text: invalidActivity }],
        },
        buildWorkMap().responsibilities[1],
      ],
      fieldValidationState: state,
    }),
    true,
  );
  state = firstSave.fieldValidationState;
  assert.equal(state[fieldKey]?.attempts, 1);

  const revisedText = "Actualizo reportes trimestrales.";
  state = applyFieldTextChangeToValidationState(state, fieldKey, revisedText);
  assert.equal(state[fieldKey]?.attempts, 1);
  assert.equal(state[fieldKey]?.inlineAssistShown, false);

  const secondSave = processWorkMapValidationOnSave(
    buildWorkMap({
      responsibilities: [
        {
          id: "resp-1",
          text: MIGUEL_RESPONSIBILITY,
          activities: [{ id: "act-1", text: revisedText }],
        },
        buildWorkMap().responsibilities[1],
      ],
      fieldValidationState: state,
    }),
    true,
  );
  assert.equal(secondSave.fieldValidationState[fieldKey]?.attempts, 2);
});

test("C21-G) lastMessageType distinguishes inline syntax and coverage", () => {
  const inline = evaluateInlineFieldValidationEntry(
    "Actualizo reportes.",
    false,
    undefined,
    getActivityAssistMessage("Actualizo reportes."),
  );
  const formal = evaluateFieldValidationEntry(
    "Actualizo reportes.",
    false,
    undefined,
    getActivityAssistMessage("Actualizo reportes."),
  );
  const coverage = evaluateCoverageFieldEntry(
    "",
    undefined,
    COVERAGE_MESSAGES.needTwoActivities,
  );

  assert.equal(inline.lastMessageType, "inline");
  assert.equal(formal.lastMessageType, "syntax");
  assert.equal(coverage.lastMessageType, "coverage");
});

test("C21-H) WorkMapIntake removes global SAVE_ASSIST_LEAD insufficiency banner", () => {
  const intakePath = resolve(testDir, "../../src/components/WorkMapIntake.tsx");
  const source = readFileSync(intakePath, "utf8");

  assert.doesNotMatch(
    source,
    /SAVE_ASSIST_LEAD/,
  );
  assert.doesNotMatch(
    source,
    /validationAssistLead/,
  );
  assert.match(source, /shouldShowInlineFieldHint/);
  assert.match(source, /handleSyntaxFieldBlur/);
  assert.match(source, /isSavingRef/);
});

test("C21-I) save to review mode transition preserved", () => {
  const workMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: MIGUEL_RESPONSIBILITY,
        activities: [
          { id: "act-1", text: COMPLETE_ACTIVITY_1 },
          { id: "act-1b", text: COMPLETE_ACTIVITY_2 },
        ],
      },
      {
        id: "resp-2",
        text: "Yo coordino la trazabilidad financiera de proyectos especiales para mantener informacion confiable dentro del cierre mensual.",
        activities: [
          { id: "act-2", text: COMPLETE_ACTIVITY_2 },
          { id: "act-2b", text: COMPLETE_ACTIVITY_1 },
        ],
      },
    ],
  });

  const saveResult = processWorkMapValidationOnSave(workMap, true);
  assert.equal(saveResult.canEnterReviewMode, true);
  assert.equal(saveResult.savedWithWarnings, false);

  const intakePath = resolve(testDir, "../../src/components/WorkMapIntake.tsx");
  const source = readFileSync(intakePath, "utf8");
  assert.match(source, /isReviewMode: true/);
  assert.match(source, /isSaved: true/);
});

test("C21-J) allowed_with_warning preserved after third formal save", () => {
  let fieldValidationState: WorkMapData["fieldValidationState"] = {};

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const result = processWorkMapValidationOnSave(
      buildSyntaxAttemptWorkMap(fieldValidationState),
      true,
    );
    fieldValidationState = result.fieldValidationState;

    if (attempt === 3) {
      assert.equal(result.canEnterReviewMode, true);
      assert.equal(result.savedWithWarnings, true);
      assert.equal(
        result.fieldValidationState["activity:act-1"]?.status,
        "allowed_with_warning",
      );
      assert.equal(
        getFieldReviewLabel(result.fieldValidationState["activity:act-1"]),
        "Revisión completada con advertencia",
      );
    }
  }
});

test("C18-H) counter per-unit preserved without coverage regression", () => {
  let fieldValidationState: WorkMapData["fieldValidationState"] = {};
  const workMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: MIGUEL_RESPONSIBILITY,
        activities: [
          { id: "act-1", text: invalidActivityText },
          { id: "act-1b", text: COMPLETE_ACTIVITY_1 },
        ],
      },
      {
        id: "resp-2",
        text: "Yo coordino la trazabilidad financiera de proyectos especiales para mantener informacion confiable dentro del cierre mensual.",
        activities: [
          { id: "act-2", text: COMPLETE_ACTIVITY_2 },
          { id: "act-2b", text: COMPLETE_ACTIVITY_1 },
        ],
      },
    ],
  });

  const first = processWorkMapValidationOnSave(
    { ...workMap, fieldValidationState },
    true,
  );
  fieldValidationState = first.fieldValidationState;

  const coverageEntry =
    first.fieldValidationState[activityCoverageFieldKey("resp-1")];
  const weakActivity = first.fieldValidationState[activityFieldKey("act-1")];

  assert.equal(coverageEntry, undefined);
  assert.equal(weakActivity?.attempts, 1);
  assert.equal(getFieldReviewLabel(weakActivity), "Revisión 1/2");

  const second = processWorkMapValidationOnSave(
    { ...workMap, fieldValidationState },
    true,
  );

  assert.equal(
    second.fieldValidationState[activityFieldKey("act-1")]?.attempts,
    2,
  );
  assert.equal(
    getFieldReviewLabel(second.fieldValidationState[activityFieldKey("act-1")]),
    "Revisión 2/2",
  );
  assert.equal(
    second.fieldValidationState[activityFieldKey("act-1b")]?.attempts ?? 0,
    0,
  );
});

const BANNED_AMBIGUOUS_ASSIST_PHRASES = [
  "procedimiento acordado",
  "siguiente paso",
  "información necesaria",
  "todo funcione",
  "área responsable",
  "proceso correspondiente",
  "sistema correspondiente",
  "documentos necesarios",
  "según lo establecido",
  "de forma adecuada",
  "oportunamente",
];

function assertNoBannedAmbiguousPhrases(assist: string) {
  for (const phrase of BANNED_AMBIGUOUS_ASSIST_PHRASES) {
    assert.doesNotMatch(
      assist,
      new RegExp(phrase, "i"),
      `assist must not include banned phrase: ${phrase}`,
    );
  }
}

test("C24-A) erogaciones responsibility is sufficient without assist", () => {
  const result = validateResponsibility(EROGACIONES_RESPONSIBILITY);
  const assist = getResponsibilityAssistMessage(EROGACIONES_RESPONSIBILITY);

  assert.equal(result.valid, true);
  assert.equal(assist, "");
  assert.equal(classifyResponsibilitySemantics(EROGACIONES_RESPONSIBILITY), "sufficient");
  assert.equal(
    result.messages.some((message) => message.includes(CRITERION_LIMIT_MESSAGE)),
    false,
  );

  const workMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: EROGACIONES_RESPONSIBILITY,
        activities: [
          { id: "act-1", text: COMPLETE_ACTIVITY_1 },
          { id: "act-1b", text: COMPLETE_ACTIVITY_2 },
        ],
      },
      {
        id: "resp-2",
        text: "Yo coordino la trazabilidad financiera de proyectos especiales para mantener informacion confiable dentro del cierre mensual.",
        activities: [
          { id: "act-2", text: COMPLETE_ACTIVITY_2 },
          { id: "act-2b", text: COMPLETE_ACTIVITY_1 },
        ],
      },
    ],
  });

  const saveResult = processWorkMapValidationOnSave(workMap, true);
  const respEntry =
    saveResult.fieldValidationState[responsibilityFieldKey("resp-1")];
  assert.equal(respEntry?.status, "valid");
  assert.equal(respEntry?.attempts ?? 0, 0);
  assert.equal(getFieldReviewLabel(respEntry), null);
  assert.equal(shouldShowFieldAssist(respEntry, true, true), false);
  assert.doesNotMatch(assist, /politica comercial/i);
  assert.doesNotMatch(assist, /vender mas/i);
  assert.doesNotMatch(assist, /margen permitido/i);
});

test("C24-B) costeo responsibility remains sufficient without assist", () => {
  const result = validateResponsibility(MIGUEL_RESPONSIBILITY);
  const assist = getResponsibilityAssistMessage(MIGUEL_RESPONSIBILITY);

  assert.equal(result.valid, true);
  assert.equal(assist, "");
  assert.equal(classifyResponsibilitySemantics(MIGUEL_RESPONSIBILITY), "sufficient");
  assert.equal(
    result.messages.some((message) => message.includes(CRITERION_LIMIT_MESSAGE)),
    false,
  );
  assert.equal(
    result.messages.some((message) =>
      message.includes(OBJECT_CLARITY_RESPONSIBILITY_MESSAGE),
    ),
    false,
  );
});

test("C24-C) open commercial authorization still asks criterion", () => {
  const text = "Yo autorizo descuentos comerciales para vender más.";
  const result = validateResponsibility(text);
  const assist = getResponsibilityAssistMessage(text);

  assert.equal(result.valid, false);
  assert.equal(classifyResponsibilitySemantics(text), "insufficient");
  assert.match(assist, /l[ií]mite o criterio/i);
});

test("C24-D) generic responsibility still asks object or context", () => {
  const text = "Yo reviso cosas para que todo funcione.";
  const result = validateResponsibility(text);
  const assist = getResponsibilityAssistMessage(text);

  assert.equal(result.valid, false);
  assert.equal(classifyResponsibilitySemantics(text), "insufficient");
  assert.match(assist, /sobre qué respondes/i);
  assert.match(assist, /decisión, validación o criterio/i);
  assert.doesNotMatch(assist, /Por ejemplo:/i);
});

test("C24-E) perfectible responsibility does not trigger formal review", () => {
  const workMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: EROGACIONES_RESPONSIBILITY,
        activities: [
          { id: "act-1", text: COMPLETE_ACTIVITY_1 },
          { id: "act-1b", text: COMPLETE_ACTIVITY_2 },
        ],
      },
      {
        id: "resp-2",
        text: "Yo coordino la trazabilidad financiera de proyectos especiales para mantener informacion confiable dentro del cierre mensual.",
        activities: [
          { id: "act-2", text: COMPLETE_ACTIVITY_2 },
          { id: "act-2b", text: COMPLETE_ACTIVITY_1 },
        ],
      },
    ],
  });

  const saveResult = processWorkMapValidationOnSave(workMap, true);
  const respEntry =
    saveResult.fieldValidationState[responsibilityFieldKey("resp-1")];

  assert.equal(respEntry?.status, "valid");
  assert.equal(respEntry?.attempts ?? 0, 0);
  assert.equal(getFieldReviewLabel(respEntry), null);
  assert.equal(shouldShowFieldAssist(respEntry, true, true), false);
  assert.equal(saveResult.hasSyntaxGaps, false);
  assert.equal(saveResult.canEnterReviewMode, true);
});

test("C24-F) analizo proyeccion activity bans ambiguous generated phrases", () => {
  const text = "Analizo la proyección mensual.";
  const assist = getActivityAssistMessage(text);

  assert.equal(validateActivity(text).valid, false);
  assertNoBannedAmbiguousPhrases(assist);
  assert.ok(assist.length > 0);
});

test("C24-G) analizo proyeccion activity gets structural guidance", () => {
  const text = "Analizo la proyección mensual.";
  const assist = getActivityAssistMessage(text);

  assertCognitiveChecklistBase(assist);
  assertCognitiveMissingHowAndResult(assist);
  assert.doesNotMatch(assist, /contra/i);
  assert.doesNotMatch(assist, /Por ejemplo:/i);
});

test("C24-H) C21 inline blur does not increment formal attempts", () => {
  const invalidActivity = "Analizo la proyección mensual.";
  const fieldKey = activityFieldKey("act-1");
  const inlineEntry = evaluateInlineFieldValidationEntry(
    invalidActivity,
    false,
    undefined,
    getActivityAssistMessage(invalidActivity),
  );

  assert.equal(inlineEntry.attempts, 0);
  assert.equal(getFieldReviewLabel(inlineEntry), null);

  const workMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: MIGUEL_RESPONSIBILITY,
        activities: [{ id: "act-1", text: invalidActivity }],
      },
      {
        id: "resp-2",
        text: "Yo coordino la trazabilidad financiera de proyectos especiales para mantener informacion confiable dentro del cierre mensual.",
        activities: [
          { id: "act-2", text: COMPLETE_ACTIVITY_2 },
          { id: "act-2b", text: COMPLETE_ACTIVITY_1 },
        ],
      },
    ],
    fieldValidationState: {
      [fieldKey]: inlineEntry,
    },
  });

  const saveResult = processWorkMapValidationOnSave(workMap, true);
  const act1 = saveResult.fieldValidationState[fieldKey];

  assert.equal(act1?.attempts, 1);
  assert.equal(act1?.lastMessageType, "syntax");
  assert.equal(getFieldReviewLabel(act1), "Revisión 1/2");
});

test("C24-I) C17 comparando activities preserved", () => {
  for (const text of [COMPARANDO_ACTIVITY_1, COMPARANDO_ACTIVITY_2]) {
    assert.equal(validateActivity(text).valid, true);
    assert.equal(getActivityAssistMessage(text), "");
  }
});

test("C24-J) C18 coverage preserved for one activity block", () => {
  const workMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: MIGUEL_RESPONSIBILITY,
        activities: [{ id: "act-1", text: COMPLETE_ACTIVITY_1 }],
      },
      {
        id: "resp-2",
        text: "Yo coordino la trazabilidad financiera de proyectos especiales para mantener informacion confiable dentro del cierre mensual.",
        activities: [
          { id: "act-2", text: COMPLETE_ACTIVITY_2 },
          { id: "act-2b", text: COMPLETE_ACTIVITY_1 },
        ],
      },
    ],
  });

  const result = processWorkMapValidationOnSave(workMap, true);
  const coverageEntry =
    result.fieldValidationState[activityCoverageFieldKey("resp-1")];

  assert.equal(coverageEntry?.message, COVERAGE_MESSAGES.needOneMoreActivity);
  assert.equal(coverageEntry?.lastMessageType, "coverage");
  assert.equal(coverageEntry?.attempts ?? 0, 0);
});

test("C24-K) C15 save-to-review preserved for complete valid map", () => {
  const workMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: EROGACIONES_RESPONSIBILITY,
        activities: [
          { id: "act-1", text: COMPLETE_ACTIVITY_1 },
          { id: "act-1b", text: COMPLETE_ACTIVITY_2 },
        ],
      },
      {
        id: "resp-2",
        text: MIGUEL_RESPONSIBILITY,
        activities: [
          { id: "act-2", text: COMPLETE_ACTIVITY_2 },
          { id: "act-2b", text: COMPLETE_ACTIVITY_1 },
        ],
      },
    ],
  });

  const saveResult = processWorkMapValidationOnSave(workMap, true);
  assert.equal(saveResult.canEnterReviewMode, true);
  assert.equal(saveResult.savedWithWarnings, false);
  assert.equal(saveResult.hasSyntaxGaps, false);
});

test("C24-support) banned ambiguous phrases exported for regression", () => {
  assert.ok(Array.isArray(BANNED_AMBIGUOUS_PHRASES));
  assert.ok(BANNED_AMBIGUOUS_PHRASES.includes("procedimiento acordado"));
  assert.ok(BANNED_AMBIGUOUS_PHRASES.includes("siguiente paso"));
});

test("C27-A) erogaciones sufficient object", () => {
  const result = validateResponsibility(EROGACIONES_RESPONSIBILITY);
  const assist = getResponsibilityAssistMessage(EROGACIONES_RESPONSIBILITY);
  const status = classifyResponsibilitySufficiency(EROGACIONES_RESPONSIBILITY);
  const redaction = buildResponsibilityRedactionObject(
    "resp-1",
    EROGACIONES_RESPONSIBILITY,
  );

  assert.equal(result.valid, true);
  assert.equal(assist, "");
  assert.equal(status, "sufficient");
  assert.equal(redaction.sufficiencyStatus, "sufficient");
  assert.equal(redaction.meaningfulAttemptCount, 0);
  assert.equal(shouldEmitRedactionAssistance(status), false);

  const saveResult = processWorkMapValidationOnSave(
    buildWorkMap({
      responsibilities: [
        {
          id: "resp-1",
          text: EROGACIONES_RESPONSIBILITY,
          activities: [
            { id: "act-1", text: COMPLETE_ACTIVITY_1 },
            { id: "act-1b", text: COMPLETE_ACTIVITY_2 },
          ],
        },
        {
          id: "resp-2",
          text: MIGUEL_RESPONSIBILITY,
          activities: [
            { id: "act-2", text: COMPLETE_ACTIVITY_2 },
            { id: "act-2b", text: COMPLETE_ACTIVITY_1 },
          ],
        },
      ],
    }),
    true,
  );
  const entry =
    saveResult.fieldValidationState[responsibilityFieldKey("resp-1")];
  assert.equal(entry?.attempts ?? 0, 0);
  assert.equal(getFieldReviewLabel(entry), null);
});

test("C27-B) costeo sufficient object", () => {
  const result = validateResponsibility(MIGUEL_RESPONSIBILITY);
  const assist = getResponsibilityAssistMessage(MIGUEL_RESPONSIBILITY);
  const status = classifyResponsibilitySufficiency(MIGUEL_RESPONSIBILITY);

  assert.equal(result.valid, true);
  assert.equal(assist, "");
  assert.equal(status, "sufficient");
  assert.equal(
    result.messages.some((message) =>
      message.includes(OBJECT_CLARITY_RESPONSIBILITY_MESSAGE),
    ),
    false,
  );
  assert.equal(
    result.messages.some((message) => message.includes(CRITERION_LIMIT_MESSAGE)),
    false,
  );
});

test("C27-C) perfectible not warning", () => {
  assert.equal(
    classifyResponsibilitySufficiency(EROGACIONES_RESPONSIBILITY),
    "sufficient",
  );
  assert.equal(isResponsibilityPerfectible(EROGACIONES_RESPONSIBILITY), true);
  assert.equal(
    classifyResponsibilitySemantics(EROGACIONES_RESPONSIBILITY),
    "sufficient",
  );

  const saveResult = processWorkMapValidationOnSave(
    buildWorkMap({
      responsibilities: [
        {
          id: "resp-1",
          text: EROGACIONES_RESPONSIBILITY,
          activities: [
            { id: "act-1", text: COMPLETE_ACTIVITY_1 },
            { id: "act-1b", text: COMPLETE_ACTIVITY_2 },
          ],
        },
        {
          id: "resp-2",
          text: MIGUEL_RESPONSIBILITY,
          activities: [
            { id: "act-2", text: COMPLETE_ACTIVITY_2 },
            { id: "act-2b", text: COMPLETE_ACTIVITY_1 },
          ],
        },
      ],
    }),
    true,
  );
  const entry =
    saveResult.fieldValidationState[responsibilityFieldKey("resp-1")];
  assert.equal(entry?.status, "valid");
  assert.equal(entry?.attempts ?? 0, 0);
  assert.equal(shouldShowFieldAssist(entry, true, true), false);
});

test("C27-D) open responsibility still insufficient", () => {
  const text = "Yo autorizo descuentos comerciales para vender más.";
  const assist = getResponsibilityAssistMessage(text);
  const status = classifyResponsibilitySufficiency(text);

  assert.equal(validateResponsibility(text).valid, false);
  assert.equal(status, "insufficient");
  assert.match(assist, /l[ií]mite o criterio/i);
  assert.equal(shouldEmitRedactionAssistance(status), true);
});

test("C27-E) generic responsibility still insufficient", () => {
  const text = "Yo reviso cosas para que todo funcione.";
  const assist = getResponsibilityAssistMessage(text);
  const status = classifyResponsibilitySufficiency(text);

  assert.equal(validateResponsibility(text).valid, false);
  assert.equal(status, "insufficient");
  assert.match(assist, /sobre qué respondes/i);
  assert.doesNotMatch(assist, /Por ejemplo:/i);
});

test("C27-F) activity sufficient object", () => {
  const result = validateActivity(COMPARANDO_ACTIVITY_1);
  const assist = getActivityAssistMessage(COMPARANDO_ACTIVITY_1);
  const status = classifyActivitySufficiency(COMPARANDO_ACTIVITY_1);
  const parts = detectActivityParts(COMPARANDO_ACTIVITY_1);
  const redaction = buildActivityRedactionObject("act-1", COMPARANDO_ACTIVITY_1);

  assert.equal(result.valid, true);
  assert.equal(assist, "");
  assert.equal(status, "sufficient");
  assert.equal(redaction.sufficiencyStatus, "sufficient");
  assert.equal(parts.hasAction, true);
  assert.equal(parts.hasObject, true);
  assert.equal(parts.hasHow, true);
  assert.equal(parts.hasResult, true);
  assert.match(parts.action ?? "", /Analizo/i);
  assert.match(parts.object ?? "", /proyeccion mensual de erogaciones/i);
  assert.match(parts.how ?? "", /comparando el gasto real contra oracle/i);
  assert.match(parts.result ?? "", /para generar reportes/i);
});

test("C27-G) activity insufficient object", () => {
  const text = "Analizo la proyección mensual.";
  const assist = getActivityAssistMessage(text);
  const status = classifyActivitySufficiency(text);

  assert.equal(validateActivity(text).valid, false);
  assert.equal(status, "insufficient");
  assertNoBannedAmbiguousPhrases(assist);
  assertCognitiveChecklistBase(assist);
  assertCognitiveMissingHowAndResult(assist);
  assert.doesNotMatch(assist, /contra/i);
});

test("C27-H) banned phrases not generated", () => {
  for (const text of [
    "Analizo la proyección mensual.",
    "Actualizo facturas.",
    "Solicito los códigos de Unidad de Negocio",
  ]) {
    assertNoBannedAmbiguousPhrases(getActivityAssistMessage(text));
  }
});

test("C27-I) third attempt accepted_with_warning", () => {
  let fieldValidationState: WorkMapData["fieldValidationState"] = {};

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const result = processWorkMapValidationOnSave(
      buildSyntaxAttemptWorkMap(fieldValidationState),
      true,
    );
    fieldValidationState = result.fieldValidationState;

    if (attempt === 3) {
      const act1 = result.fieldValidationState[activityFieldKey("act-1")];
      assert.equal(act1?.status, "allowed_with_warning");
      assert.equal(act1?.message, ACCEPTED_WITH_WARNING_MESSAGE);
      assert.equal(
        getFieldReviewLabel(act1),
        "Revisión completada con advertencia",
      );
      const redaction = buildActivityRedactionObject(
        "act-1",
        invalidActivityText,
        act1,
      );
      assert.equal(redaction.sufficiencyStatus, "accepted_with_warning");
    }
  }
});

test("C27-J) sufficient does not increment attempts", () => {
  const saveResult = processWorkMapValidationOnSave(
    buildWorkMap({
      responsibilities: [
        {
          id: "resp-1",
          text: EROGACIONES_RESPONSIBILITY,
          activities: [
            { id: "act-1", text: COMPARANDO_ACTIVITY_1 },
            { id: "act-1b", text: COMPARANDO_ACTIVITY_2 },
          ],
        },
        {
          id: "resp-2",
          text: MIGUEL_RESPONSIBILITY,
          activities: [
            { id: "act-2", text: COMPLETE_ACTIVITY_2 },
            { id: "act-2b", text: COMPLETE_ACTIVITY_1 },
          ],
        },
      ],
    }),
    true,
  );

  assert.equal(
    saveResult.fieldValidationState[responsibilityFieldKey("resp-1")]?.attempts ??
      0,
    0,
  );
  assert.equal(
    saveResult.fieldValidationState[activityFieldKey("act-1")]?.attempts ?? 0,
    0,
  );
});

test("C27-K) perfectible does not increment attempts", () => {
  assert.equal(isResponsibilityPerfectible(EROGACIONES_RESPONSIBILITY), true);

  const saveResult = processWorkMapValidationOnSave(
    buildWorkMap({
      responsibilities: [
        {
          id: "resp-1",
          text: EROGACIONES_RESPONSIBILITY,
          activities: [
            { id: "act-1", text: COMPLETE_ACTIVITY_1 },
            { id: "act-1b", text: COMPLETE_ACTIVITY_2 },
          ],
        },
        {
          id: "resp-2",
          text: MIGUEL_RESPONSIBILITY,
          activities: [
            { id: "act-2", text: COMPLETE_ACTIVITY_2 },
            { id: "act-2b", text: COMPLETE_ACTIVITY_1 },
          ],
        },
      ],
    }),
    true,
  );

  assert.equal(
    saveResult.fieldValidationState[responsibilityFieldKey("resp-1")]?.attempts ??
      0,
    0,
  );
  assert.equal(
    saveResult.fieldValidationState[responsibilityFieldKey("resp-1")]?.status,
    "valid",
  );
});

test("C27-L) coverage does not increment attempts", () => {
  let fieldValidationState: WorkMapData["fieldValidationState"] = {};
  const workMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: MIGUEL_RESPONSIBILITY,
        activities: [{ id: "act-1", text: "" }],
      },
      {
        id: "resp-2",
        text: "",
        activities: [{ id: "act-2", text: "" }],
      },
    ],
  });

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const result = processWorkMapValidationOnSave(
      { ...workMap, fieldValidationState },
      true,
    );
    fieldValidationState = result.fieldValidationState;

    for (const key of Object.keys(result.fieldValidationState)) {
      assert.equal(result.fieldValidationState[key]?.attempts ?? 0, 0);
    }
    assert.equal(result.canEnterReviewMode, false);
  }
});

test("C27-M) save freezes when coverage OK and objects sufficient or accepted", () => {
  const completeMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: EROGACIONES_RESPONSIBILITY,
        activities: [
          { id: "act-1", text: COMPLETE_ACTIVITY_1 },
          { id: "act-1b", text: COMPLETE_ACTIVITY_2 },
        ],
      },
      {
        id: "resp-2",
        text: MIGUEL_RESPONSIBILITY,
        activities: [
          { id: "act-2", text: COMPLETE_ACTIVITY_2 },
          { id: "act-2b", text: COMPLETE_ACTIVITY_1 },
        ],
      },
    ],
  });
  const completeSave = processWorkMapValidationOnSave(completeMap, true);
  assert.equal(completeSave.canEnterReviewMode, true);
  assert.equal(completeSave.savedWithWarnings, false);

  let fieldValidationState: WorkMapData["fieldValidationState"] = {};
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const result = processWorkMapValidationOnSave(
      buildSyntaxAttemptWorkMap(fieldValidationState),
      true,
    );
    fieldValidationState = result.fieldValidationState;
    if (attempt === 3) {
      assert.equal(result.canEnterReviewMode, true);
      assert.equal(result.savedWithWarnings, true);
    }
  }
});

test("C27-N) save does not freeze when coverage missing", () => {
  const workMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: MIGUEL_RESPONSIBILITY,
        activities: [{ id: "act-1", text: "" }],
      },
      {
        id: "resp-2",
        text: "",
        activities: [{ id: "act-2", text: "" }],
      },
    ],
  });

  const saveResult = processWorkMapValidationOnSave(workMap, true);
  assert.equal(saveResult.canEnterReviewMode, false);
  assert.equal(saveResult.hasCoverageGaps, true);
});

test("C27-O) C17 comparando preserved", () => {
  for (const text of [COMPARANDO_ACTIVITY_1, COMPARANDO_ACTIVITY_2]) {
    assert.equal(validateActivity(text).valid, true);
    assert.equal(getActivityAssistMessage(text), "");
    assert.equal(classifyActivitySufficiency(text), "sufficient");
  }
});

test("C27-P) C21 blur save preserved", () => {
  const invalidActivity = "Actualizo reportes.";
  const fieldKey = activityFieldKey("act-1");
  const inlineEntry = evaluateInlineFieldValidationEntry(
    invalidActivity,
    false,
    undefined,
    getActivityAssistMessage(invalidActivity),
  );

  assert.equal(inlineEntry.attempts, 0);
  assert.equal(getFieldReviewLabel(inlineEntry), null);

  const workMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: MIGUEL_RESPONSIBILITY,
        activities: [{ id: "act-1", text: invalidActivity }],
      },
      {
        id: "resp-2",
        text: "Yo coordino la trazabilidad financiera de proyectos especiales para mantener informacion confiable dentro del cierre mensual.",
        activities: [
          { id: "act-2", text: COMPLETE_ACTIVITY_2 },
          { id: "act-2b", text: COMPLETE_ACTIVITY_1 },
        ],
      },
    ],
    fieldValidationState: {
      [fieldKey]: inlineEntry,
    },
  });

  const transaction = createSaveValidationTransaction();
  const saveResult = processWorkMapValidationOnSave(workMap, true, transaction);
  assert.equal(saveResult.fieldValidationState[fieldKey]?.attempts, 1);

  const duplicateSave = processWorkMapValidationOnSave(
    { ...workMap, fieldValidationState: saveResult.fieldValidationState },
    true,
    transaction,
  );
  assert.equal(duplicateSave.fieldValidationState[fieldKey]?.attempts, 1);
});

const PRESENTO_ACTIVITY =
  "Presento el presupuesto final ante la Dirección General";

const VALIDO_ESTIMACIONES_ACTIVITY = "Valido las estimaciones de obra";

const ELABORO_ORDENES_PARTIAL_ACTIVITY =
  "Elaboro las órdenes de compra vinculando la cotización negociada no se que mas no";

function buildElaboroCycleWorkMap(
  activityText: string,
  fieldValidationState: WorkMapData["fieldValidationState"] = {},
): WorkMapData {
  return buildWorkMap(
    {
      responsibilities: [
        {
          id: "resp-1",
          text: MIGUEL_RESPONSIBILITY,
          activities: [
            { id: "act-1", text: activityText },
            { id: "act-1b", text: COMPLETE_ACTIVITY_1 },
          ],
        },
        {
          id: "resp-2",
          text: "Yo coordino la trazabilidad financiera de proyectos especiales para mantener informacion confiable dentro del cierre mensual.",
          activities: [
            { id: "act-2", text: COMPLETE_ACTIVITY_2 },
            { id: "act-2b", text: COMPLETE_ACTIVITY_1 },
          ],
        },
      ],
    },
    fieldValidationState,
  );
}

test("C29-A) Presento no pide comparar", () => {
  const assist = getActivityAssistMessage(PRESENTO_ACTIVITY);
  assertCognitiveChecklistBase(assist);
  assertCognitiveMissingHowAndResult(assist);
  assert.match(assist, /canal o reunión donde la presentas cuando aplique/i);
  assert.doesNotMatch(assist, /contra qué comparas/i);
});

test("C29-B) Presento sin ejemplo generado", () => {
  const assist = getActivityAssistMessage(PRESENTO_ACTIVITY);
  assertCognitiveChecklistBase(assist);
  assertCognitiveMissingHowAndResult(assist);
  assert.match(assist, /canal o reunión donde la presentas cuando aplique/i);
  assert.doesNotMatch(assist, /qué fuente usas/i);
  assert.doesNotMatch(assist, /Por ejemplo:/i);
  assert.doesNotMatch(assist, /protocolo de revisión/i);
});

test("C29-C) Valido asistencia estructural sin contra", () => {
  const assist = getActivityAssistMessage(VALIDO_ESTIMACIONES_ACTIVITY);
  assertCognitiveChecklistBase(assist);
  assertCognitiveMissingHowAndResult(assist);
  assert.doesNotMatch(assist, /contra qué/i);
  assert.doesNotMatch(assist, /Por ejemplo:/i);
});

test("C29-D) Elaboro reconoce cómo parcial", () => {
  const assist = getActivityAssistMessage(ELABORO_ORDENES_PARTIAL_ACTIVITY);
  const result = validateActivity(ELABORO_ORDENES_PARTIAL_ACTIVITY);
  const parts = detectActivityParts(ELABORO_ORDENES_PARTIAL_ACTIVITY);

  assert.equal(result.valid, true);
  assert.equal(parts.hasAction, true);
  assert.equal(parts.hasObject, true);
  assert.equal(parts.hasHow, true);
  assert.equal(parts.hasResult, false);
  assertSemanticImprovesWithResult(assist);
});

test("C29-E) attempt cycle increments across edited insufficient text", () => {
  const fieldKey = activityFieldKey("act-1");
  const texts = [
    "Elaboro las órdenes de compra",
    "Elaboro las órdenes de compra vinculando la cotización negociada",
    ELABORO_ORDENES_PARTIAL_ACTIVITY,
  ];

  let fieldValidationState: WorkMapData["fieldValidationState"] = {};
  let lastResult;

  for (let index = 0; index < texts.length; index += 1) {
    if (index > 0) {
      fieldValidationState = applyFieldTextChangeToValidationState(
        fieldValidationState,
        fieldKey,
        texts[index],
      );
    }

    lastResult = processWorkMapValidationOnSave(
      buildElaboroCycleWorkMap(texts[index], fieldValidationState),
      true,
    );
    fieldValidationState = lastResult.fieldValidationState;
  }

  const entry = lastResult?.fieldValidationState[fieldKey];
  assert.equal(entry?.attempts ?? 0, 0);
  assert.notEqual(entry?.status, "allowed_with_warning");
  assert.notEqual(entry?.message, ACCEPTED_WITH_WARNING_MESSAGE);
});

test("C29-F) sufficient text resets or clears attempt issue", () => {
  const fieldKey = activityFieldKey("act-1");
  let fieldValidationState: WorkMapData["fieldValidationState"] = {};

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const result = processWorkMapValidationOnSave(
      buildSyntaxAttemptWorkMap(fieldValidationState),
      true,
    );
    fieldValidationState = result.fieldValidationState;
  }

  assert.equal(
    fieldValidationState[fieldKey]?.status,
    "allowed_with_warning",
  );

  fieldValidationState = applyFieldTextChangeToValidationState(
    fieldValidationState,
    fieldKey,
    COMPLETE_ACTIVITY_1,
  );

  const saveResult = processWorkMapValidationOnSave(
    buildWorkMap(
      {
        responsibilities: [
          {
            id: "resp-1",
            text: MIGUEL_RESPONSIBILITY,
            activities: [
              { id: "act-1", text: COMPLETE_ACTIVITY_1 },
              { id: "act-1b", text: COMPLETE_ACTIVITY_2 },
            ],
          },
          buildWorkMap().responsibilities[1],
        ],
      },
      fieldValidationState,
    ),
    true,
  );

  const entry = saveResult.fieldValidationState[fieldKey];
  assert.equal(entry?.status, "valid");
  assert.equal(entry?.attempts, 0);
  assert.notEqual(entry?.status, "allowed_with_warning");
});

test("C29-G) empty resets as coverage", () => {
  const fieldKey = activityFieldKey("act-1");
  let fieldValidationState: WorkMapData["fieldValidationState"] = {};
  const firstSave = processWorkMapValidationOnSave(
    buildSyntaxAttemptWorkMap(fieldValidationState),
    true,
  );
  fieldValidationState = firstSave.fieldValidationState;
  assert.equal(fieldValidationState[fieldKey]?.status, "needs_help");

  fieldValidationState = applyFieldTextChangeToValidationState(
    fieldValidationState,
    fieldKey,
    "",
  );

  const saveResult = processWorkMapValidationOnSave(
    buildWorkMap(
      {
        responsibilities: [
          {
            id: "resp-1",
            text: MIGUEL_RESPONSIBILITY,
            activities: [
              { id: "act-1", text: "" },
              { id: "act-1b", text: COMPLETE_ACTIVITY_1 },
            ],
          },
          buildWorkMap().responsibilities[1],
        ],
      },
      fieldValidationState,
    ),
    true,
  );

  const entry = saveResult.fieldValidationState[fieldKey];
  assert.equal(entry?.attempts, 0);
  assert.equal(entry?.lastMessageType, "coverage");
  assert.notEqual(entry?.status, "needs_help");
});

test("C29-H) Responsibility erogaciones preserved", () => {
  const assist = getResponsibilityAssistMessage(EROGACIONES_RESPONSIBILITY);
  const result = validateResponsibility(EROGACIONES_RESPONSIBILITY);
  const status = classifyResponsibilitySufficiency(EROGACIONES_RESPONSIBILITY);

  assert.equal(result.valid, true);
  assert.equal(assist, "");
  assert.equal(status, "sufficient");
});

test("C29-I) C17 comparando preserved", () => {
  for (const text of [COMPARANDO_ACTIVITY_1, COMPARANDO_ACTIVITY_2]) {
    assert.equal(validateActivity(text).valid, true);
    assert.equal(getActivityAssistMessage(text), "");
    assert.equal(classifyActivitySufficiency(text), "sufficient");
  }
});

test("C29-J) C18 coverage preserved", () => {
  const workMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: MIGUEL_RESPONSIBILITY,
        activities: [{ id: "act-1", text: COMPLETE_ACTIVITY_1 }],
      },
      {
        id: "resp-2",
        text: "Yo coordino la trazabilidad financiera de proyectos especiales para mantener informacion confiable dentro del cierre mensual.",
        activities: [
          { id: "act-2", text: COMPLETE_ACTIVITY_2 },
          { id: "act-2b", text: COMPLETE_ACTIVITY_1 },
        ],
      },
    ],
  });

  const saveResult = processWorkMapValidationOnSave(workMap, true);
  const coverageEntry =
    saveResult.fieldValidationState[activityCoverageFieldKey("resp-1")];

  assert.equal(
    coverageEntry?.message,
    COVERAGE_MESSAGES.needOneMoreActivity,
  );
  assert.equal(coverageEntry?.lastMessageType, "coverage");
  assert.equal(coverageEntry?.attempts ?? 0, 0);
});

test("C29-K) C21 blur save preserved", () => {
  const invalidActivity = "Actualizo reportes.";
  const fieldKey = activityFieldKey("act-1");
  const inlineEntry = evaluateInlineFieldValidationEntry(
    invalidActivity,
    false,
    undefined,
    getActivityAssistMessage(invalidActivity),
  );

  assert.equal(inlineEntry.attempts, 0);
  assert.equal(getFieldReviewLabel(inlineEntry), null);

  const saveResult = processWorkMapValidationOnSave(
    buildWorkMap({
      responsibilities: [
        {
          id: "resp-1",
          text: MIGUEL_RESPONSIBILITY,
          activities: [{ id: "act-1", text: invalidActivity }],
        },
        buildWorkMap().responsibilities[1],
      ],
      fieldValidationState: {
        [fieldKey]: inlineEntry,
      },
    }),
    true,
  );

  assert.equal(saveResult.fieldValidationState[fieldKey]?.attempts, 1);
});

const CUANTIFICO_PARTIAL_ACTIVITY =
  "Cuantifico los materiales del proyecto arquitectónico final aplicando criterios técnicos de volumetría";

const CUANTIFICO_COMPLETE_ACTIVITY =
  "Cuantifico los materiales del proyecto arquitectónico final aplicando criterios técnicos de volumetría para dejar listo el listado de materiales base del presupuesto.";

test("C31-A) Cuantifico con cómo parcial pide resultado de cuantificación", () => {
  const assist = getActivityAssistMessage(CUANTIFICO_PARTIAL_ACTIVITY);
  const result = validateActivity(CUANTIFICO_PARTIAL_ACTIVITY);
  const parts = detectActivityParts(CUANTIFICO_PARTIAL_ACTIVITY);

  assert.equal(result.valid, true);
  assert.equal(parts.hasAction, true);
  assert.equal(parts.hasObject, true);
  assert.equal(parts.hasHow, true);
  assert.equal(parts.hasResult, false);
  assertSemanticImprovesWithResult(assist);
});

test("C31-B) Cuantificación sin ejemplo inventado", () => {
  const assist = getActivityAssistMessage(CUANTIFICO_PARTIAL_ACTIVITY);

  assertSemanticImprovesWithResult(assist);
  assert.doesNotMatch(assist, /listado de materiales base del presupuesto/i);
  assert.doesNotMatch(assist, /Por ejemplo:/i);
});

test("C31-C) No usar frases ambiguas prohibidas", () => {
  const assist = getActivityAssistMessage(CUANTIFICO_PARTIAL_ACTIVITY);

  for (const phrase of BANNED_AMBIGUOUS_PHRASES) {
    assert.doesNotMatch(assist, new RegExp(phrase, "i"));
  }
});

test("C31-D) Actividad completa de cuantificación pasa", () => {
  const result = validateActivity(CUANTIFICO_COMPLETE_ACTIVITY);
  const assist = getActivityAssistMessage(CUANTIFICO_COMPLETE_ACTIVITY);
  const status = classifyActivitySufficiency(CUANTIFICO_COMPLETE_ACTIVITY);

  assert.equal(result.valid, true);
  assert.equal(assist, "");
  assert.equal(status, "sufficient");
});

test("C31-E) Presento preservado", () => {
  const assist = getActivityAssistMessage(PRESENTO_ACTIVITY);

  assertCognitiveChecklistBase(assist);
  assertCognitiveMissingHowAndResult(assist);
  assert.match(assist, /cómo presentas el presupuesto final/i);
  assert.doesNotMatch(assist, /contra qué comparas/i);
});

test("C31-F) Valido estructural preservado", () => {
  const assist = getActivityAssistMessage(VALIDO_ESTIMACIONES_ACTIVITY);

  assertCognitiveChecklistBase(assist);
  assertCognitiveMissingHowAndResult(assist);
  assert.doesNotMatch(assist, /contra qué/i);
  assert.doesNotMatch(assist, /Por ejemplo:/i);
});

test("C31-G) Elaboro estructural preservado", () => {
  const assist = getActivityAssistMessage(ELABORO_ORDENES_PARTIAL_ACTIVITY);
  const result = validateActivity(ELABORO_ORDENES_PARTIAL_ACTIVITY);

  assert.equal(result.valid, true);
  assertSemanticImprovesWithResult(assist);
});

test("C31-H) C29 attempt cycle preserved", () => {
  const fieldKey = activityFieldKey("act-1");
  let fieldValidationState: WorkMapData["fieldValidationState"] = {};
  let lastResult;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    lastResult = processWorkMapValidationOnSave(
      buildSyntaxAttemptWorkMap(fieldValidationState),
      true,
    );
    fieldValidationState = lastResult.fieldValidationState;
  }

  const entry = lastResult?.fieldValidationState[fieldKey];
  assert.equal(entry?.attempts, 3);
  assert.equal(entry?.status, "allowed_with_warning");
  assert.equal(entry?.message, ACCEPTED_WITH_WARNING_MESSAGE);
});

test("C31-I) C17 comparando preserved", () => {
  for (const text of [COMPARANDO_ACTIVITY_1, COMPARANDO_ACTIVITY_2]) {
    assert.equal(validateActivity(text).valid, true);
    assert.equal(getActivityAssistMessage(text), "");
    assert.equal(classifyActivitySufficiency(text), "sufficient");
  }
});

const VALIDO_CRONOGRAMA_ACTIVITY = "Valido el cronograma de suministros";

const ANALIZO_PROYECCION_ACTIVITY = "Analizo la proyección mensual";

const GENERIC_RESPONSIBILITY_INSUFFICIENT =
  "Yo reviso cosas para que todo funcione.";

function assertNoPorEjemplo(assist: string) {
  assert.doesNotMatch(assist, /Por ejemplo:/i);
  assert.doesNotMatch(assist, /por ejemplo:/i);
}

function assertNoAutoContra(assist: string) {
  assert.doesNotMatch(assist, /contra qué/i);
  assert.doesNotMatch(assist, /\bcontra\b/i);
}

test("C34-A) Valido sin contra — asistencia estructural", () => {
  const assist = getActivityAssistMessage(VALIDO_CRONOGRAMA_ACTIVITY);

  assertCognitiveChecklistBase(assist);
  assertCognitiveMissingHowAndResult(assist);
  assert.match(assist, /cómo validas.*cronograma de suministros/i);
  assert.match(assist, /método|fuente|criterio|revisión/i);
  assertNoPorEjemplo(assist);
  assertNoAutoContra(assist);
});

test("C34-B) Presento sin ejemplo — asistencia estructural", () => {
  const assist = getActivityAssistMessage(PRESENTO_ACTIVITY);

  assertCognitiveChecklistBase(assist);
  assertCognitiveMissingHowAndResult(assist);
  assert.match(assist, /canal o reunión donde la presentas cuando aplique/i);
  assertNoPorEjemplo(assist);
  assertNoAutoContra(assist);
});

test("C34-C) Cuantifico sin ejemplo — asistencia estructural", () => {
  const assist = getActivityAssistMessage(CUANTIFICO_PARTIAL_ACTIVITY);
  const result = validateActivity(CUANTIFICO_PARTIAL_ACTIVITY);

  assert.equal(result.valid, true);
  assertSemanticImprovesWithResult(assist);
  assertNoPorEjemplo(assist);
  assert.doesNotMatch(assist, /listado de materiales base del presupuesto/i);
});

test("C34-D) Analizo sin ejemplo — asistencia estructural", () => {
  const assist = getActivityAssistMessage(ANALIZO_PROYECCION_ACTIVITY);

  assertCognitiveChecklistBase(assist);
  assertCognitiveMissingHowAndResult(assist);
  assert.match(assist, /menciona la manera en que revisas la información/i);
  assert.match(assist, /qué criterio usas cuando aplique/i);
  assert.doesNotMatch(assist, /qué fuente usas/i);
  assert.doesNotMatch(assist, /método o referencia comparas/i);
  assertNoPorEjemplo(assist);
  assertNoAutoContra(assist);
  assertNoBannedAmbiguousPhrases(assist);
});

test("G2) partial responsibility with object but no purpose omits quién responde", () => {
  const text = "Yo apruebo y regulo la integración técnica";
  const assist = getResponsibilityAssistMessage(text);
  const parts = detectResponsibilityParts(text);

  assert.equal(parts.purpose, false);
  assert.equal(parts.object, true);
  assert.equal(
    assist,
    "Ya indicas qué decisión ejerces y sobre qué trabajas. Falta indicar para qué sirve esta responsabilidad y, si lo tienes claro, cuál es el límite de esta responsabilidad.",
  );
  assert.doesNotMatch(assist, /quién responde/i);
});

test("C34-E) Responsabilidad insuficiente — asistencia estructural", () => {
  const assist = getResponsibilityAssistMessage(GENERIC_RESPONSIBILITY_INSUFFICIENT);

  assert.equal(
    assist,
    "Ya indicas una intención general. Falta aclarar sobre qué respondes y qué decisión, validación o criterio ejerces.",
  );
  assertNoPorEjemplo(assist);
});

test("C34-F) Responsabilidad suficiente — silencio", () => {
  for (const text of [EROGACIONES_RESPONSIBILITY, MIGUEL_RESPONSIBILITY]) {
    assert.equal(validateResponsibility(text).valid, true);
    assert.equal(getResponsibilityAssistMessage(text), "");
    assert.equal(classifyResponsibilitySufficiency(text), "sufficient");
  }
});

test("C34-G) Actividad suficiente — silencio", () => {
  for (const text of [
    COMPLETE_ACTIVITY_1,
    COMPLETE_ACTIVITY_2,
    CUANTIFICO_COMPLETE_ACTIVITY,
    COMPARANDO_ACTIVITY_1,
  ]) {
    assert.equal(validateActivity(text).valid, true);
    assert.equal(getActivityAssistMessage(text), "");
    assert.equal(classifyActivitySufficiency(text), "sufficient");
  }
});

test("C34-H) Tercer intento accepted_with_warning preservado", () => {
  let fieldValidationState: WorkMapData["fieldValidationState"] = {};

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const result = processWorkMapValidationOnSave(
      buildSyntaxAttemptWorkMap(fieldValidationState),
      true,
    );
    fieldValidationState = result.fieldValidationState;

    if (attempt === 3) {
      const act1 = result.fieldValidationState[activityFieldKey("act-1")];
      assert.equal(act1?.status, "allowed_with_warning");
      assert.equal(act1?.message, ACCEPTED_WITH_WARNING_MESSAGE);
      const redaction = buildActivityRedactionObject(
        "act-1",
        invalidActivityText,
        act1,
      );
      assert.equal(redaction.sufficiencyStatus, "accepted_with_warning");
    }
  }
});

test("C34-I) C31 cuantificación estructural preservada", () => {
  const assist = getActivityAssistMessage(CUANTIFICO_PARTIAL_ACTIVITY);
  const result = validateActivity(CUANTIFICO_PARTIAL_ACTIVITY);
  const parts = detectActivityParts(CUANTIFICO_PARTIAL_ACTIVITY);

  assert.equal(result.valid, true);
  assert.equal(parts.hasHow, true);
  assert.equal(parts.hasResult, false);
  assertSemanticImprovesWithResult(assist);
  assert.doesNotMatch(assist, /terminar los materiales/i);
  assertNoPorEjemplo(assist);
});

test("C34-J) C29 ciclo de intentos preservado", () => {
  const fieldKey = activityFieldKey("act-1");
  let fieldValidationState: WorkMapData["fieldValidationState"] = {};
  let lastResult;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    lastResult = processWorkMapValidationOnSave(
      buildSyntaxAttemptWorkMap(fieldValidationState),
      true,
    );
    fieldValidationState = lastResult.fieldValidationState;
  }

  const entry = lastResult?.fieldValidationState[fieldKey];
  assert.equal(entry?.attempts, 3);
  assert.equal(entry?.status, "allowed_with_warning");
  assert.equal(entry?.message, ACCEPTED_WITH_WARNING_MESSAGE);
});

test("C34-K) C21/C18/C15 preservados", () => {
  const invalidActivity = "Analizo la proyección mensual.";
  const fieldKey = activityFieldKey("act-1");
  const inlineEntry = evaluateInlineFieldValidationEntry(
    invalidActivity,
    false,
    undefined,
    getActivityAssistMessage(invalidActivity),
  );
  assert.equal(inlineEntry.attempts, 0);

  const saveResult = processWorkMapValidationOnSave(
    buildWorkMap({
      responsibilities: [
        {
          id: "resp-1",
          text: MIGUEL_RESPONSIBILITY,
          activities: [{ id: "act-1", text: invalidActivity }],
        },
        buildWorkMap().responsibilities[1],
      ],
      fieldValidationState: { [fieldKey]: inlineEntry },
    }),
    true,
  );
  assert.equal(saveResult.fieldValidationState[fieldKey]?.attempts, 1);

  const coverageWorkMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: MIGUEL_RESPONSIBILITY,
        activities: [{ id: "act-1", text: COMPLETE_ACTIVITY_1 }],
      },
      buildWorkMap().responsibilities[1],
    ],
  });
  const coverageSave = processWorkMapValidationOnSave(coverageWorkMap, true);
  assert.equal(
    coverageSave.fieldValidationState[activityCoverageFieldKey("resp-1")]?.message,
    COVERAGE_MESSAGES.needOneMoreActivity,
  );

  const completeWorkMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: MIGUEL_RESPONSIBILITY,
        activities: [
          { id: "act-1", text: COMPLETE_ACTIVITY_1 },
          { id: "act-1b", text: COMPLETE_ACTIVITY_2 },
        ],
      },
      {
        id: "resp-2",
        text: "Yo coordino la trazabilidad financiera de proyectos especiales para mantener informacion confiable dentro del cierre mensual.",
        activities: [
          { id: "act-2", text: COMPLETE_ACTIVITY_2 },
          { id: "act-2b", text: COMPLETE_ACTIVITY_1 },
        ],
      },
    ],
  });
  const reviewSave = processWorkMapValidationOnSave(completeWorkMap, true);
  assert.equal(reviewSave.canEnterReviewMode, true);
  assert.equal(reviewSave.hasSyntaxGaps, false);
});

const ANALIZO_SUFFICIENT_WITH_CRITERIA_ACTIVITY =
  "Analizo la proyección mensual aplicando criterios de variación presupuestal para emitir alertas de desviación.";

const REGISTRO_ERP_SUFFICIENT_ACTIVITY =
  "Registro facturas de proveedores en el ERP usando el catálogo de cuentas para generar el asiento contable de gasto.";

test("C36-A) Valido incluye riqueza no obligatoria en cómo", () => {
  const assist = getActivityAssistMessage(VALIDO_CRONOGRAMA_ACTIVITY);

  assertCognitiveChecklistBase(assist);
  assertCognitiveMissingHowAndResult(assist);
  assert.match(assist, /método|sistema|fuente|criterio|reunión/i);
  assertNoPorEjemplo(assist);
  assertNoAutoContra(assist);
});

test("C36-B) Presento incluye riqueza contextual sin ejemplo", () => {
  const assist = getActivityAssistMessage(PRESENTO_ACTIVITY);

  assertCognitiveChecklistBase(assist);
  assertCognitiveMissingHowAndResult(assist);
  assert.match(assist, /fuente|criterio|reunión/i);
  assertNoPorEjemplo(assist);
});

test("C36-C) Analizo incluye método/herramienta/fuente/criterio", () => {
  const assist = getActivityAssistMessage(ANALIZO_PROYECCION_ACTIVITY);

  assertCognitiveChecklistBase(assist);
  assertCognitiveMissingHowAndResult(assist);
  assert.match(assist, /método|sistema|fuente|criterio|reunión/i);
  assertNoPorEjemplo(assist);
  assertNoBannedAmbiguousPhrases(assist);
});

test("C36-D) Cuantifico con cómo ya existente no pide herramienta/lugar", () => {
  const assist = getActivityAssistMessage(CUANTIFICO_PARTIAL_ACTIVITY);
  const result = validateActivity(CUANTIFICO_PARTIAL_ACTIVITY);
  const parts = detectActivityParts(CUANTIFICO_PARTIAL_ACTIVITY);

  assert.equal(result.valid, true);
  assert.equal(parts.hasHow, true);
  assertSemanticImprovesWithResult(assist);
  assert.doesNotMatch(assist, /herramienta/i);
  assert.doesNotMatch(assist, /lugar/i);
  assertNoPorEjemplo(assist);
});

test("C36-E) Actividad suficiente sin herramienta ni lugar sigue pasando", () => {
  assert.equal(validateActivity(ANALIZO_SUFFICIENT_WITH_CRITERIA_ACTIVITY).valid, true);
  assert.equal(getActivityAssistMessage(ANALIZO_SUFFICIENT_WITH_CRITERIA_ACTIVITY), "");
  assert.equal(
    classifyActivitySufficiency(ANALIZO_SUFFICIENT_WITH_CRITERIA_ACTIVITY),
    "sufficient",
  );
});

test("C36-F) Actividad suficiente con herramienta también pasa", () => {
  assert.equal(validateActivity(REGISTRO_ERP_SUFFICIENT_ACTIVITY).valid, true);
  assert.equal(getActivityAssistMessage(REGISTRO_ERP_SUFFICIENT_ACTIVITY), "");
  assert.equal(
    classifyActivitySufficiency(REGISTRO_ERP_SUFFICIENT_ACTIVITY),
    "sufficient",
  );
});

test("C36-G) C34 structural policy preserved", () => {
  const samples = [
    VALIDO_CRONOGRAMA_ACTIVITY,
    PRESENTO_ACTIVITY,
    ANALIZO_PROYECCION_ACTIVITY,
    CUANTIFICO_PARTIAL_ACTIVITY,
    GENERIC_RESPONSIBILITY_INSUFFICIENT,
  ];

  for (const text of samples) {
    const assist = text.includes("Yo ")
      ? getResponsibilityAssistMessage(text)
      : getActivityAssistMessage(text);
    assertNoPorEjemplo(assist);
    if (!text.includes("Yo ")) {
      assertNoAutoContra(assist);
    }
  }
});

test("C36-H) Tercer intento preserved", () => {
  let fieldValidationState: WorkMapData["fieldValidationState"] = {};

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const result = processWorkMapValidationOnSave(
      buildSyntaxAttemptWorkMap(fieldValidationState),
      true,
    );
    fieldValidationState = result.fieldValidationState;

    if (attempt === 3) {
      const act1 = result.fieldValidationState[activityFieldKey("act-1")];
      assert.equal(act1?.status, "allowed_with_warning");
      assert.equal(act1?.message, ACCEPTED_WITH_WARNING_MESSAGE);
    }
  }
});

test("C36-I) Save-to-review / coverage preserved", () => {
  const coverageWorkMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: MIGUEL_RESPONSIBILITY,
        activities: [{ id: "act-1", text: COMPLETE_ACTIVITY_1 }],
      },
      buildWorkMap().responsibilities[1],
    ],
  });
  const coverageSave = processWorkMapValidationOnSave(coverageWorkMap, true);
  assert.equal(
    coverageSave.fieldValidationState[activityCoverageFieldKey("resp-1")]?.message,
    COVERAGE_MESSAGES.needOneMoreActivity,
  );

  const completeWorkMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: MIGUEL_RESPONSIBILITY,
        activities: [
          { id: "act-1", text: COMPLETE_ACTIVITY_1 },
          { id: "act-1b", text: COMPLETE_ACTIVITY_2 },
        ],
      },
      {
        id: "resp-2",
        text: "Yo coordino la trazabilidad financiera de proyectos especiales para mantener informacion confiable dentro del cierre mensual.",
        activities: [
          { id: "act-2", text: COMPLETE_ACTIVITY_2 },
          { id: "act-2b", text: COMPLETE_ACTIVITY_1 },
        ],
      },
    ],
  });
  const reviewSave = processWorkMapValidationOnSave(completeWorkMap, true);
  assert.equal(reviewSave.canEnterReviewMode, true);
});

test("H1-G) WorkMapIntake save does not call processWorkMapValidationOnSave", () => {
  const intakePath = resolve(testDir, "../../src/components/WorkMapIntake.tsx");
  const source = readFileSync(intakePath, "utf8");

  assert.match(source, /evaluateWorkMapOperationalReadiness/);
  assert.doesNotMatch(source, /processWorkMapValidationOnSave/);
});

test("H2-A) 1 resp + 1 activity readiness uses activity top notice when two written", async () => {
  const readinessModule = await import(
    "../../src/services/work-map-operational-readiness.ts"
  );
  const { evaluateWorkMapOperationalReadiness } = readinessModule;

  const workMap = buildWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: MIGUEL_RESPONSIBILITY,
        activities: [{ id: "act-1", text: COMPLETE_ACTIVITY_1 }],
      },
      {
        id: "resp-2",
        text: EROGACIONES_RESPONSIBILITY,
        activities: [
          { id: "act-2", text: COMPLETE_ACTIVITY_1 },
          { id: "act-2b", text: COMPLETE_ACTIVITY_2 },
        ],
      },
    ],
  });

  const result = evaluateWorkMapOperationalReadiness({
    workMap,
    hasAreas: true,
  });

  assert.equal(result.canEnterReviewMode, false);
  assert.equal(
    result.globalMessage,
    "Para guardar, agrega un mínimo de información.",
  );
  assert.equal(
    result.globalDetailMessage,
    "Redacta, por lo menos, 2 responsabilidades y 2 actividades en cada una.",
  );
});

test("H2-B) handleSave does not map coverage blocks to fieldWarnings", () => {
  const intakePath = resolve(testDir, "../../src/components/WorkMapIntake.tsx");
  const source = readFileSync(intakePath, "utf8");
  const handleSaveMatch = /const handleSave = async \(\) => \{([\s\S]*?)\n  \};/m.exec(
    source,
  );
  assert.ok(handleSaveMatch, "handleSave not found");
  const handleSaveBody = handleSaveMatch[1];

  assert.doesNotMatch(
    handleSaveBody,
    /setFieldWarnings\([\s\S]*coverageBlocks/,
  );
  assert.doesNotMatch(
    source,
    /Cada responsabilidad redactada necesita al menos dos actividades para guardar el mapa\./,
  );
});

test("H2-C) handleSave uses latestWorkMapRef snapshot outside setWorkMap", () => {
  const intakePath = resolve(testDir, "../../src/components/WorkMapIntake.tsx");
  const source = readFileSync(intakePath, "utf8");
  const handleSaveMatch = /const handleSave = async \(\) => \{([\s\S]*?)\n  \};/m.exec(
    source,
  );
  assert.ok(handleSaveMatch, "handleSave not found");
  const handleSaveBody = handleSaveMatch[1];

  assert.match(source, /latestWorkMapRef/);
  assert.match(handleSaveBody, /latestWorkMapRef\.current/);
  assert.doesNotMatch(
    handleSaveBody,
    /setWorkMap\(\(current\) => \{[\s\S]*evaluateWorkMapOperationalReadiness/,
  );
});

test("H2-D) handleSave does not compute savedPayload inside setWorkMap", () => {
  const intakePath = resolve(testDir, "../../src/components/WorkMapIntake.tsx");
  const source = readFileSync(intakePath, "utf8");
  const handleSaveMatch = /const handleSave = async \(\) => \{([\s\S]*?)\n  \};/m.exec(
    source,
  );
  assert.ok(handleSaveMatch, "handleSave not found");
  const handleSaveBody = handleSaveMatch[1];

  assert.doesNotMatch(
    handleSaveBody,
    /setWorkMap\(\(current\) => \{[\s\S]*savedPayload/,
  );
  assert.match(handleSaveBody, /const savedPayload/);
});

test("H1-H) operational readiness does not block on pending redaction", async () => {
  const readinessModule = await import(
    "../../src/services/work-map-operational-readiness.ts"
  );
  const { evaluateWorkMapOperationalReadiness, OPERATIONAL_READINESS_MESSAGES } =
    readinessModule;

  const workMap = buildSyntaxAttemptWorkMap({
    [activityFieldKey("act-1")]: {
      attempts: 1,
      lastTextReviewed: invalidActivityText,
      status: "needs_help",
      message: "Falta indicar como lo haces.",
      lastMessageType: "syntax",
    },
  });

  const result = evaluateWorkMapOperationalReadiness({
    workMap,
    hasAreas: true,
  });

  assert.equal(result.canEnterReviewMode, true);
  assert.doesNotMatch(
    result.globalMessage,
    /redacciones pendientes|piezas mínimas/i,
  );
  assert.notEqual(
    result.globalMessage,
    OPERATIONAL_READINESS_MESSAGES.saveFailed,
  );
});

test("H1-I) C34-C39 structural assistance preserved", () => {
  const validoAssist = getActivityAssistMessage(VALIDO_CRONOGRAMA_ACTIVITY);
  const cuantificoAssist = getActivityAssistMessage(CUANTIFICO_PARTIAL_ACTIVITY);
  const responsabilidadAssist = getResponsibilityAssistMessage(
    GENERIC_RESPONSIBILITY_INSUFFICIENT,
  );

  assertNoChecklistArtifacts(validoAssist);
  assert.match(validoAssist, /Para completar esta actividad|ya indica qué haces/i);
  assertNoPorEjemplo(validoAssist);
  assertNoAutoContra(validoAssist);
  assertSemanticImprovesWithResult(cuantificoAssist);

  assert.match(
    responsabilidadAssist,
    /sobre qué respondes|decisión|validación|criterio/i,
  );
  assertNoPorEjemplo(responsabilidadAssist);
});

test("H1-J) Valido cronograma cognitive paragraph", () => {
  const assist = getActivityAssistMessage(VALIDO_CRONOGRAMA_ACTIVITY);

  assertCognitiveChecklistBase(assist);
  assertCognitiveMissingHowAndResult(assist);
  assert.match(assist, /cómo validas.*cronograma de suministros/i);
  assert.match(assist, /método|fuente|criterio|revisión/i);
  assertNoPorEjemplo(assist);
  assertNoAutoContra(assist);
  assert.doesNotMatch(assist, /herramienta/i);
  assert.doesNotMatch(assist, /\blugar\b/i);
});

test("H1-K) Cuantifico with how only is sufficient", () => {
  const assist = getActivityAssistMessage(CUANTIFICO_PARTIAL_ACTIVITY);
  const parts = detectActivityParts(CUANTIFICO_PARTIAL_ACTIVITY);

  assert.equal(parts.hasHow, true);
  assert.equal(parts.hasResult, false);
  assertSemanticImprovesWithResult(assist);
  assert.doesNotMatch(assist, /herramienta/i);
  assert.doesNotMatch(assist, /\blugar\b/i);
  assertNoPorEjemplo(assist);
});

const VERIFICO_ORACLE_ACTIVITY =
  "Verifico la carga del presupuesto en Oracle";

const ANALIZO_PRESENTO_PROYECCION_ACTIVITY =
  "Analizo y presento la proyección mensual";

const GESTIONO_SIN_OBJETO_ACTIVITY = "Gestiono";

test("H3-A) Verifico Oracle usa párrafo natural", () => {
  const assist = getActivityAssistMessage(VERIFICO_ORACLE_ACTIVITY);

  assert.match(assist, /Para completar esta actividad/);
  assert.match(assist, /cómo verificas la carga del presupuesto en Oracle/i);
  assert.match(assist, /menciona la manera en que lo revisas dentro del sistema/i);
  assert.match(assist, /qué queda listo al terminar/i);
  assertNoChecklistArtifacts(assist);
  assertNoPorEjemplo(assist);
  assertNoAutoContra(assist);
  assert.doesNotMatch(assist, /qué sistema usas/i);
});

test("H3-B) Analizo y presento usa acciones detectadas", () => {
  const assist = getActivityAssistMessage(ANALIZO_PRESENTO_PROYECCION_ACTIVITY);

  assert.match(assist, /cómo analizas y presentas la proyección mensual/i);
  assert.match(assist, /menciona la manera en que revisas la información/i);
  assert.match(assist, /canal o reunión donde la presentas cuando aplique/i);
  assert.match(assist, /qué queda listo al terminar/i);
  assertNoChecklistArtifacts(assist);
  assertNoPorEjemplo(assist);
});

test("H3-C) Cuantifico con cómo existente queda completo", () => {
  const assist = getActivityAssistMessage(CUANTIFICO_PARTIAL_ACTIVITY);

  assertSemanticImprovesWithResult(assist);
  assert.doesNotMatch(assist, /herramienta/i);
  assert.doesNotMatch(assist, /\blugar\b/i);
  assert.doesNotMatch(assist, /\bsistema\b/i);
  assertNoPorEjemplo(assist);
});

test("H3-D) Gestiono sin objeto pide objeto/cómo/resultado de forma humana", () => {
  const assist = getActivityAssistMessage(GESTIONO_SIN_OBJETO_ACTIVITY);

  assert.match(assist, /precisa sobre qué trabajas/i);
  assert.match(assist, /cómo lo realizas/i);
  assert.match(assist, /qué queda listo/i);
  assertNoChecklistArtifacts(assist);
  assertNoPorEjemplo(assist);
});

const INTEGRO_PAQUETES_LICITACION_ACTIVITY =
  "Integro los paquetes de licitación técnica";

const REGISTRO_FACTURAS_PROVEEDORES_ACTIVITY =
  "Registro facturas de proveedores";

test("H4-A) Verifico Oracle usa dimensiones contextuales IT", () => {
  const assist = getActivityAssistMessage(VERIFICO_ORACLE_ACTIVITY);

  assert.match(
    assist,
    /Para completar esta actividad, agrega cómo verificas la carga del presupuesto en Oracle/i,
  );
  assert.match(assist, /menciona la manera en que lo revisas dentro del sistema/i);
  assert.match(assist, /qué queda listo al terminar/i);
  assert.doesNotMatch(assist, /qué sistema usas/i);
  assert.doesNotMatch(assist, /método/i);
  assertNoChecklistArtifacts(assist);
  assertNoPorEjemplo(assist);
  assertNoAutoContra(assist);
});

test("H4-B) Integro paquetes licitación conjuga acción y evita sistema", () => {
  const assist = getActivityAssistMessage(INTEGRO_PAQUETES_LICITACION_ACTIVITY);

  assert.match(
    assist,
    /cómo integras los paquetes de licitación técnica/i,
  );
  assert.doesNotMatch(assist, /cómo realizas los paquetes/i);
  assert.match(assist, /menciona la manera en que lo haces/i);
  assert.match(assist, /qué queda listo al terminar/i);
  assert.doesNotMatch(assist, /qué sistema usas/i);
  assert.doesNotMatch(assist, /información técnica o comercial/i);
  assertNoChecklistArtifacts(assist);
  assertNoPorEjemplo(assist);
  assertNoAutoContra(assist);
});

test("H4-C) Analizo y presento usa dimensiones contextuales de análisis", () => {
  const assist = getActivityAssistMessage(ANALIZO_PRESENTO_PROYECCION_ACTIVITY);

  assert.match(
    assist,
    /Para completar esta actividad, agrega cómo analizas y presentas la proyección mensual/i,
  );
  assert.match(assist, /menciona la manera en que revisas la información/i);
  assert.match(assist, /canal o reunión donde la presentas cuando aplique/i);
  assert.match(assist, /qué queda listo al terminar/i);
  assert.doesNotMatch(assist, /método/i);
  assertNoChecklistArtifacts(assist);
  assertNoPorEjemplo(assist);
  assertNoAutoContra(assist);
});

test("H4-D) Registro facturas menciona sistema solo cuando aplica", () => {
  const assist = getActivityAssistMessage(REGISTRO_FACTURAS_PROVEEDORES_ACTIVITY);

  assert.match(
    assist,
    /Para completar esta actividad, agrega cómo registras (las )?facturas de proveedores/i,
  );
  assert.match(assist, /qué sistema usas cuando aplique/i);
  assert.match(assist, /qué criterio de captura sigues/i);
  assert.match(assist, /qué queda listo al terminar/i);
  assertNoChecklistArtifacts(assist);
  assertNoPorEjemplo(assist);
  assertNoAutoContra(assist);
});

test("H4-E) Cuantifico con cómo existente queda completo", () => {
  const assist = getActivityAssistMessage(CUANTIFICO_PARTIAL_ACTIVITY);

  assertSemanticImprovesWithResult(assist);
  assert.doesNotMatch(assist, /método/i);
  assert.doesNotMatch(assist, /qué sistema usas/i);
  assertNoChecklistArtifacts(assist);
  assertNoPorEjemplo(assist);
  assertNoAutoContra(assist);
});

test("H4-F) Gestiono sin objeto pide precisión contextual", () => {
  const assist = getActivityAssistMessage(GESTIONO_SIN_OBJETO_ACTIVITY);

  assert.match(
    assist,
    /Para poder entender la actividad, precisa sobre qué trabajas/i,
  );
  assert.match(assist, /cómo lo realizas/i);
  assert.match(assist, /qué queda listo/i);
  assert.match(
    assist,
    /documento, solicitud, sistema, cliente, proveedor, presupuesto, material o actividad concreta/i,
  );
  assertNoChecklistArtifacts(assist);
  assertNoPorEjemplo(assist);
  assertNoAutoContra(assist);
});

test("H5-A) Analizo proyección usa expansión aditiva de manera y criterio", () => {
  const assist = getActivityAssistMessage(ANALIZO_PROYECCION_ACTIVITY);

  assert.match(
    assist,
    /Para completar esta actividad, agrega cómo analizas la proyección mensual:/i,
  );
  assert.match(assist, /menciona la manera en que revisas la información/i);
  assert.match(assist, /qué criterio usas cuando aplique/i);
  assert.match(assist, /qué queda listo al terminar/i);
  assert.doesNotMatch(assist, /qué fuente usas/i);
  assert.doesNotMatch(assist, /método o referencia comparas/i);
  assertNoChecklistArtifacts(assist);
  assertNoPorEjemplo(assist);
  assertNoAutoContra(assist);
});

test("H5-B) Verifico Oracle usa revisión o criterio dentro del sistema", () => {
  const assist = getActivityAssistMessage(VERIFICO_ORACLE_ACTIVITY);

  assert.match(
    assist,
    /Para completar esta actividad, agrega cómo verificas la carga del presupuesto en Oracle/i,
  );
  assert.match(assist, /menciona la manera en que lo revisas dentro del sistema/i);
  assert.match(assist, /qué queda listo al terminar/i);
  assert.doesNotMatch(assist, /qué sistema usas/i);
  assert.doesNotMatch(assist, /\bcontra\b/i);
  assertNoChecklistArtifacts(assist);
  assertNoPorEjemplo(assist);
  assertNoAutoContra(assist);
});

test("H5-C) Integro licitación usa dimensión técnica o comercial", () => {
  const assist = getActivityAssistMessage(INTEGRO_PAQUETES_LICITACION_ACTIVITY);

  assert.match(
    assist,
    /Para completar esta actividad, agrega cómo integras los paquetes de licitación técnica/i,
  );
  assert.match(assist, /menciona la manera en que lo haces/i);
  assert.match(assist, /qué queda listo al terminar/i);
  assert.doesNotMatch(assist, /qué sistema usas/i);
  assert.doesNotMatch(assist, /información técnica o comercial/i);
  assert.doesNotMatch(assist, /cómo realizas los paquetes/i);
  assertNoChecklistArtifacts(assist);
  assertNoPorEjemplo(assist);
  assertNoAutoContra(assist);
});

test("H5-D) Analizo y presento combina manera y canal o reunión", () => {
  const assist = getActivityAssistMessage(ANALIZO_PRESENTO_PROYECCION_ACTIVITY);

  assert.match(
    assist,
    /Para completar esta actividad, agrega cómo analizas y presentas la proyección mensual/i,
  );
  assert.match(assist, /menciona la manera en que revisas la información/i);
  assert.match(
    assist,
    /el canal o reunión donde la presentas cuando aplique/i,
  );
  assert.match(assist, /qué queda listo al terminar/i);
  assertNoChecklistArtifacts(assist);
  assertNoPorEjemplo(assist);
  assertNoAutoContra(assist);
});

test("H5-E) Registro facturas menciona sistema y criterio de captura", () => {
  const assist = getActivityAssistMessage(REGISTRO_FACTURAS_PROVEEDORES_ACTIVITY);

  assert.match(
    assist,
    /Para completar esta actividad, agrega cómo registras (las )?facturas de proveedores/i,
  );
  assert.match(assist, /qué sistema usas cuando aplique/i);
  assert.match(assist, /qué criterio de captura sigues/i);
  assert.match(assist, /qué queda listo al terminar/i);
  assertNoChecklistArtifacts(assist);
  assertNoPorEjemplo(assist);
  assertNoAutoContra(assist);
});

test("H5-F) Cuantifico con cómo existente queda completo", () => {
  const assist = getActivityAssistMessage(CUANTIFICO_PARTIAL_ACTIVITY);

  assertSemanticImprovesWithResult(assist);
  assertNoChecklistArtifacts(assist);
  assertNoPorEjemplo(assist);
  assertNoAutoContra(assist);
});

test("H5-G) Gestiono sin objeto pide precisión aditiva", () => {
  const assist = getActivityAssistMessage(GESTIONO_SIN_OBJETO_ACTIVITY);

  assert.match(
    assist,
    /Para poder entender la actividad, precisa sobre qué trabajas/i,
  );
  assert.match(assist, /cómo lo realizas/i);
  assert.match(assist, /qué queda listo/i);
  assert.match(
    assist,
    /documento, solicitud, sistema, cliente, proveedor, presupuesto, material o actividad concreta/i,
  );
  assertNoChecklistArtifacts(assist);
  assertNoPorEjemplo(assist);
  assertNoAutoContra(assist);
});

const MATRICES_APU_ACTIVITY =
  "Integro las matrices de precios unitarios (APU)";

const MANUAL_NORMAS_COSTEO_ACTIVITY =
  "Actualizo el Manual de Normas de Costeo";

const PX_SITE_DEVELOPMENT_ACTIVITY =
  "Elaboro el Px para el Site Development Proposal";

test("H6-A) Matrices APU uses safe fallback", () => {
  const assist = getActivityAssistMessage(MATRICES_APU_ACTIVITY);

  assert.match(
    assist,
    /Para completar esta actividad, agrega cómo integras las matrices de precios unitarios \(APU\)/i,
  );
  assert.match(assist, /menciona la manera en que lo haces/i);
  assert.match(assist, /qué queda listo al terminar/i);
  assert.doesNotMatch(assist, /\bsistema\b/i);
  assert.doesNotMatch(assist, /\bfuente\b/i);
  assert.doesNotMatch(assist, /\bcriterio\b/i);
  assert.doesNotMatch(assist, /información técnica o comercial/i);
  assert.doesNotMatch(assist, /\breunión\b/i);
  assert.doesNotMatch(assist, /\bcanal\b/i);
  assertNoChecklistArtifacts(assist);
  assertNoPorEjemplo(assist);
  assertNoAutoContra(assist);
});

test("H6-B) Manual de Normas doesn't ask sistema nor captura", () => {
  const assist = getActivityAssistMessage(MANUAL_NORMAS_COSTEO_ACTIVITY);

  assert.match(
    assist,
    /Para completar esta actividad, agrega cómo actualizas el Manual de Normas de Costeo/i,
  );
  assert.match(assist, /menciona la manera en que lo haces/i);
  assert.match(assist, /qué queda listo al terminar/i);
  assert.doesNotMatch(assist, /qué sistema usas/i);
  assert.doesNotMatch(assist, /criterio de captura/i);
  assert.doesNotMatch(assist, /\bfuente\b/i);
  assert.doesNotMatch(assist, /\bcontra\b/i);
  assertNoChecklistArtifacts(assist);
  assertNoPorEjemplo(assist);
  assertNoAutoContra(assist);
});

test("H6-C) Px Site Development Proposal doesn't fall to missing-object generic", () => {
  const assist = getActivityAssistMessage(PX_SITE_DEVELOPMENT_ACTIVITY);

  assert.match(
    assist,
    /Para completar esta actividad, agrega cómo elaboras el Px para el Site Development Proposal/i,
  );
  assert.match(assist, /menciona la manera en que lo haces/i);
  assert.match(assist, /qué queda listo al terminar/i);
  assert.doesNotMatch(assist, /precisa sobre qué trabajas/i);
  assertNoChecklistArtifacts(assist);
  assertNoPorEjemplo(assist);
  assertNoAutoContra(assist);
});

test("H6-D) Registro facturas CAN ask sistema", () => {
  const assist = getActivityAssistMessage(REGISTRO_FACTURAS_PROVEEDORES_ACTIVITY);

  assert.match(
    assist,
    /Para completar esta actividad, agrega cómo registras (las )?facturas de proveedores/i,
  );
  assert.match(assist, /qué sistema usas cuando aplique/i);
  assert.match(assist, /qué criterio de captura sigues/i);
  assert.match(assist, /qué queda listo al terminar/i);
  assertNoChecklistArtifacts(assist);
  assertNoPorEjemplo(assist);
  assertNoAutoContra(assist);
});

test("H6-E) Oracle doesn't ask sistema", () => {
  const assist = getActivityAssistMessage(VERIFICO_ORACLE_ACTIVITY);

  assert.match(
    assist,
    /Para completar esta actividad, agrega cómo verificas la carga del presupuesto en Oracle/i,
  );
  assert.match(assist, /menciona la manera en que lo revisas dentro del sistema/i);
  assert.match(assist, /qué queda listo al terminar/i);
  assert.doesNotMatch(assist, /qué sistema usas/i);
  assertNoChecklistArtifacts(assist);
  assertNoPorEjemplo(assist);
  assertNoAutoContra(assist);
});

test("H6-F) Licitación can use safe fallback without forcing fuente/criterio", () => {
  const assist = getActivityAssistMessage(INTEGRO_PAQUETES_LICITACION_ACTIVITY);

  assert.match(
    assist,
    /Para completar esta actividad, agrega cómo integras los paquetes de licitación técnica/i,
  );
  assert.match(assist, /menciona la manera en que lo haces/i);
  assert.match(assist, /qué queda listo al terminar/i);
  assert.doesNotMatch(assist, /\bfuente\b/i);
  assert.doesNotMatch(assist, /\bcriterio\b/i);
  assert.doesNotMatch(assist, /información técnica o comercial/i);
  assert.doesNotMatch(assist, /qué sistema usas/i);
  assertNoChecklistArtifacts(assist);
  assertNoPorEjemplo(assist);
  assertNoAutoContra(assist);
});

test("H6-G) No examples/no Por ejemplo/no contra/no checklist", () => {
  const samples = [
    MATRICES_APU_ACTIVITY,
    MANUAL_NORMAS_COSTEO_ACTIVITY,
    PX_SITE_DEVELOPMENT_ACTIVITY,
    REGISTRO_FACTURAS_PROVEEDORES_ACTIVITY,
    VERIFICO_ORACLE_ACTIVITY,
    INTEGRO_PAQUETES_LICITACION_ACTIVITY,
  ];

  for (const text of samples) {
    const assist = getActivityAssistMessage(text);
    assertNoChecklistArtifacts(assist);
    assertNoPorEjemplo(assist);
    assertNoAutoContra(assist);
  }
});

const PROTOCOLIZO_PRESUPUESTO_ACTIVITY = "Protocolizo el presupuesto";

const CONCILIO_INVENTARIO_ACTIVOS_ACTIVITY =
  "Concilio el inventario de activos fijos";

const CUADROS_COMPARATIVOS_ACTIVITY = "Elaboro los cuadros comparativos";

test("H7-A) Protocolizo uses natural conjugation protocolizas", () => {
  const assist = getActivityAssistMessage(PROTOCOLIZO_PRESUPUESTO_ACTIVITY);

  assert.match(
    assist,
    /Para completar esta actividad, agrega cómo protocolizas el presupuesto/i,
  );
  assert.match(assist, /menciona la manera en que lo haces/i);
  assert.match(assist, /qué queda listo al terminar/i);
  assert.doesNotMatch(assist, /cómo realizas esta actividad/i);
  assert.doesNotMatch(assist, /Por ejemplo:/i);
  assert.doesNotMatch(assist, /\bcontra\b/i);
  assert.doesNotMatch(assist, /\bfuente\b/i);
  assert.doesNotMatch(assist, /\bcriterio\b/i);
  assert.doesNotMatch(assist, /\bsistema\b/i);
  assertNoChecklistArtifacts(assist);
  assertNoPorEjemplo(assist);
  assertNoAutoContra(assist);
});

test("H7-B) Concilio inventario uses revisas o comparas los registros", () => {
  const assist = getActivityAssistMessage(CONCILIO_INVENTARIO_ACTIVOS_ACTIVITY);

  assert.match(
    assist,
    /Para completar esta actividad, agrega cómo concilias el inventario de activos fijos/i,
  );
  assert.match(assist, /revisas o comparas los registros/i);
  assert.match(assist, /qué queda listo al terminar/i);
  assert.doesNotMatch(assist, /\bcontra\b/i);
  assert.doesNotMatch(assist, /qué sistema usas/i);
  assert.doesNotMatch(assist, /Por ejemplo:/i);
  assert.doesNotMatch(assist, /\bfuente\b/i);
  assert.doesNotMatch(assist, /\bcriterio\b/i);
  assertNoChecklistArtifacts(assist);
  assertNoPorEjemplo(assist);
  assertNoAutoContra(assist);
});

test("H7-C) Cuadros comparativos uses elaboras la comparación", () => {
  const assist = getActivityAssistMessage(CUADROS_COMPARATIVOS_ACTIVITY);

  assert.match(
    assist,
    /Para completar esta actividad, agrega cómo elaboras los cuadros comparativos/i,
  );
  assert.match(assist, /manera en que elaboras la comparación/i);
  assert.match(assist, /qué queda listo al terminar/i);
  assert.doesNotMatch(assist, /\bcontra\b/i);
  assert.doesNotMatch(assist, /qué sistema usas/i);
  assert.doesNotMatch(assist, /Por ejemplo:/i);
  assertNoChecklistArtifacts(assist);
  assertNoPorEjemplo(assist);
  assertNoAutoContra(assist);
});

test("H7-D) H6 APU safe fallback preserved", () => {
  const assist = getActivityAssistMessage(MATRICES_APU_ACTIVITY);

  assert.match(
    assist,
    /Para completar esta actividad, agrega cómo integras las matrices de precios unitarios \(APU\)/i,
  );
  assert.match(assist, /menciona la manera en que lo haces/i);
  assert.match(assist, /qué queda listo al terminar/i);
  assert.doesNotMatch(assist, /\bsistema\b/i);
  assert.doesNotMatch(assist, /\bfuente\b/i);
  assert.doesNotMatch(assist, /\bcriterio\b/i);
  assertNoChecklistArtifacts(assist);
  assertNoPorEjemplo(assist);
  assertNoAutoContra(assist);
});

test("H7-E) H6 Px safe fallback preserved", () => {
  const assist = getActivityAssistMessage(PX_SITE_DEVELOPMENT_ACTIVITY);

  assert.match(
    assist,
    /Para completar esta actividad, agrega cómo elaboras el Px para el Site Development Proposal/i,
  );
  assert.match(assist, /menciona la manera en que lo haces/i);
  assert.match(assist, /qué queda listo al terminar/i);
  assert.doesNotMatch(assist, /precisa sobre qué trabajas/i);
  assertNoChecklistArtifacts(assist);
  assertNoPorEjemplo(assist);
  assertNoAutoContra(assist);
});

test("H7-F) H6 Manual safe fallback preserved", () => {
  const assist = getActivityAssistMessage(MANUAL_NORMAS_COSTEO_ACTIVITY);

  assert.match(
    assist,
    /Para completar esta actividad, agrega cómo actualizas el Manual de Normas de Costeo/i,
  );
  assert.match(assist, /menciona la manera en que lo haces/i);
  assert.match(assist, /qué queda listo al terminar/i);
  assert.doesNotMatch(assist, /qué sistema usas/i);
  assert.doesNotMatch(assist, /criterio de captura/i);
  assert.doesNotMatch(assist, /\bfuente\b/i);
  assertNoChecklistArtifacts(assist);
  assertNoPorEjemplo(assist);
  assertNoAutoContra(assist);
});

test("H7-G) H6 Registro facturas sistema preserved", () => {
  const assist = getActivityAssistMessage(REGISTRO_FACTURAS_PROVEEDORES_ACTIVITY);

  assert.match(
    assist,
    /Para completar esta actividad, agrega cómo registras (las )?facturas de proveedores/i,
  );
  assert.match(assist, /qué sistema usas cuando aplique/i);
  assert.match(assist, /qué criterio de captura sigues/i);
  assert.match(assist, /qué queda listo al terminar/i);
  assertNoChecklistArtifacts(assist);
  assertNoPorEjemplo(assist);
  assertNoAutoContra(assist);
});

test("H7-H) H6 Oracle and H7 samples no Por ejemplo nor contra", () => {
  const samples = [
    PROTOCOLIZO_PRESUPUESTO_ACTIVITY,
    CONCILIO_INVENTARIO_ACTIVOS_ACTIVITY,
    CUADROS_COMPARATIVOS_ACTIVITY,
    MATRICES_APU_ACTIVITY,
    PX_SITE_DEVELOPMENT_ACTIVITY,
    MANUAL_NORMAS_COSTEO_ACTIVITY,
    REGISTRO_FACTURAS_PROVEEDORES_ACTIVITY,
    VERIFICO_ORACLE_ACTIVITY,
  ];

  for (const text of samples) {
    const assist = getActivityAssistMessage(text);
    assertNoChecklistArtifacts(assist);
    assertNoPorEjemplo(assist);
    assertNoAutoContra(assist);
  }

  const oracleAssist = getActivityAssistMessage(VERIFICO_ORACLE_ACTIVITY);
  assert.match(
    oracleAssist,
    /Para completar esta actividad, agrega cómo verificas la carga del presupuesto en Oracle/i,
  );
  assert.match(oracleAssist, /menciona la manera en que lo revisas dentro del sistema/i);
  assert.doesNotMatch(oracleAssist, /qué sistema usas/i);
});

test("C41-A) procedural connector at start is how, not action", () => {
  const text =
    "mediante una lectura al inicio de la jornada y una clasificación por cliente, urgencia, fecha prometida y siguiente acción";
  const parts = detectActivityParts(text);
  const result = validateActivity(text);
  const assist = getActivityAssistMessage(text);

  assert.equal(parts.hasAction, false);
  assert.equal(parts.hasHow, true);
  assert.equal(result.valid, false);
  assert.match(assist, /Indica qué haces concretamente/i);
  assert.doesNotMatch(assist, /ya indica qué haces/i);
  assert.doesNotMatch(assist, /qué queda listo/i);
});

test("C41-B) generar treats complement as output candidate, not work object", () => {
  const text =
    "generar un Contacto Comercial calificado o una Venta de Exhibición atendida.";
  const parts = detectActivityParts(text);
  const result = validateActivity(text);
  const assist = getActivityAssistMessage(text);

  assert.equal(parts.hasAction, true);
  assert.equal(parts.hasResult, true);
  assert.equal(parts.hasObject, false);
  assert.match(parts.result ?? "", /Contacto Comercial calificado/i);
  assert.equal(result.valid, false);
  assert.match(assist, /sobre qué trabajas/i);
  assert.match(assist, /cómo la realizas|criterio|estándar|procedimiento/i);
  assert.doesNotMatch(assist, /qué queda listo/i);
});

test("C41-C) action object how is sufficient without output", () => {
  const text = "Reviso las solicitudes de clientes usando el CRM";
  const parts = detectActivityParts(text);

  assert.equal(parts.hasAction, true);
  assert.equal(parts.hasObject, true);
  assert.equal(parts.hasHow, true);
  assert.equal(parts.hasResult, false);
  assert.equal(validateActivity(text).valid, true);
  assertSemanticImprovesWithResult(getActivityAssistMessage(text));
});

test("C41-D) action object result is sufficient without how", () => {
  const text = "Reviso las solicitudes de clientes y dejo la prioridad registrada";
  const parts = detectActivityParts(text);

  assert.equal(parts.hasAction, true);
  assert.equal(parts.hasObject, true);
  assert.equal(parts.hasHow, false);
  assert.equal(parts.hasResult, true);
  assert.equal(validateActivity(text).valid, true);
  assertSemanticImprovesWithHow(getActivityAssistMessage(text));
});

test("C41-E) mediante el CRM is only how", () => {
  const text = "mediante el CRM";
  const parts = detectActivityParts(text);

  assert.equal(parts.hasAction, false);
  assert.equal(parts.hasHow, true);
  assert.equal(validateActivity(text).valid, false);
  assert.match(getActivityAssistMessage(text), /falta la acción principal/i);
});

test("C41-F) repeated tokens do not fabricate complete structure", () => {
  const text = "registro registro registro";
  const parts = detectActivityParts(text);

  assert.equal(parts.hasAction, true);
  assert.equal(parts.hasObject, false);
  assert.equal(parts.hasHow, false);
  assert.equal(parts.hasResult, false);
  assert.equal(validateActivity(text).valid, false);
  assert.notEqual(getActivityAssistMessage(text), "");
});

test("C42-A) leading procedural block does not promote nominal registro to main action", () => {
  const text =
    "mediante la recepción del visitante, preguntas sobre su necesidad demostración de productos y registro de sus datos de contacto generar un Contacto Comercial calificado o una Venta de Exhibición atendida.";
  const parts = detectActivityParts(text);

  assert.equal(parts.action, "generar");
  assert.equal(parts.hasAction, true);
  assert.equal(parts.hasObject, false);
  assert.equal(parts.hasHow, true);
  assert.equal(parts.hasResult, true);
  assert.match(parts.how ?? "", /registro de sus datos de contacto/i);
  assert.match(parts.result ?? "", /Contacto Comercial calificado/i);
  assert.doesNotMatch(parts.object ?? "", /Contacto Comercial/i);
  assert.deepEqual(
    Object.entries({
      action: !parts.hasAction,
      object: !parts.hasObject,
      how: !parts.hasHow,
      result: !parts.hasResult,
    })
      .filter(([, missing]) => missing)
      .map(([key]) => key),
    ["object"],
  );
  assert.equal(validateActivity(text).valid, false);
  assert.doesNotMatch(getActivityAssistMessage(text), /qué queda listo/i);
});

test("C42-B) mediante el CRM genero detects how action and result", () => {
  const text = "mediante el CRM genero una cotización aprobada";
  const parts = detectActivityParts(text);

  assert.equal(parts.action, "genero");
  assert.equal(parts.hasAction, true);
  assert.equal(parts.hasHow, true);
  assert.equal(parts.hasResult, true);
  assert.match(parts.how ?? "", /mediante el CRM/i);
  assert.match(parts.result ?? "", /cotizacion aprobada/i);
});

test("C42-C) mediante revision and registro does not fabricate action", () => {
  const text = "mediante revisión de solicitudes y registro de datos";
  const parts = detectActivityParts(text);

  assert.equal(parts.hasAction, false);
  assert.equal(parts.hasHow, true);
  assert.equal(parts.hasResult, false);
  assert.match(parts.how ?? "", /registro de datos/i);
  assert.match(getActivityAssistMessage(text), /falta la acción principal/i);
});

test("C42-D) normal action with how and result stays complete", () => {
  const text = "reviso solicitudes mediante el CRM y dejo la prioridad registrada";
  const parts = detectActivityParts(text);

  assert.equal(parts.action, "reviso");
  assert.equal(parts.hasAction, true);
  assert.equal(parts.hasObject, true);
  assert.equal(parts.hasHow, true);
  assert.equal(parts.hasResult, true);
  assert.equal(validateActivity(text).valid, true);
  assert.equal(classifyActivitySufficiency(text), "sufficient");
  assert.equal(getActivityAssistMessage(text), "");
});

test("C42-E) registro can be main action when not inside procedural prefix", () => {
  const text = "registro las solicitudes recibidas y dejo un expediente actualizado";
  const parts = detectActivityParts(text);

  assert.equal(parts.action, "registro");
  assert.equal(parts.hasAction, true);
  assert.equal(parts.hasObject, true);
  assert.equal(parts.hasResult, true);
  assert.equal(validateActivity(text).valid, true);
});

test("C42-F) mediante registro manual keeps registro as how and genero as action", () => {
  const text = "mediante registro manual genero informe final";
  const parts = detectActivityParts(text);

  assert.equal(parts.action, "genero");
  assert.equal(parts.hasAction, true);
  assert.equal(parts.hasObject, false);
  assert.equal(parts.hasHow, true);
  assert.equal(parts.hasResult, true);
  assert.match(parts.how ?? "", /mediante registro manual/i);
  assert.match(parts.result ?? "", /informe final/i);
});

test("C42-G) attempts do not change ActivityParts or missing components", () => {
  const text =
    "mediante la recepción del visitante, preguntas sobre su necesidad demostración de productos y registro de sus datos de contacto generar un Contacto Comercial calificado o una Venta de Exhibición atendida.";
  const expectedParts = detectActivityParts(text);
  const expectedMissing = {
    action: !expectedParts.hasAction,
    object: !expectedParts.hasObject,
    how: !expectedParts.hasHow,
    result: !expectedParts.hasResult,
  };

  for (const attempts of [0, 1, 2, 3]) {
    const parts = detectActivityParts(text);
    const missing = {
      action: !parts.hasAction,
      object: !parts.hasObject,
      how: !parts.hasHow,
      result: !parts.hasResult,
    };
    const sufficiency = classifyActivitySufficiency(text);
    const isValid =
      sufficiency === "sufficient" || sufficiency === "perfectible";
    const assistMessage = shouldEmitRedactionAssistance(sufficiency)
      ? getActivityAssistMessage(text)
      : undefined;
    evaluateFieldValidationEntry(
      text,
      isValid,
      {
        attempts,
        lastTextReviewed: text,
        lastTextHash: text.toLowerCase(),
        lastMessageType: "syntax",
        status:
          attempts >= 3
            ? "allowed_with_warning"
            : attempts > 0
              ? "needs_help"
              : "unchecked",
      },
      assistMessage,
    );

    assert.deepEqual(
      {
        action: parts.action,
        object: parts.object,
        how: parts.how,
        result: parts.result,
        hasAction: parts.hasAction,
        hasObject: parts.hasObject,
        hasHow: parts.hasHow,
        hasResult: parts.hasResult,
      },
      {
        action: expectedParts.action,
        object: expectedParts.object,
        how: expectedParts.how,
        result: expectedParts.result,
        hasAction: expectedParts.hasAction,
        hasObject: expectedParts.hasObject,
        hasHow: expectedParts.hasHow,
        hasResult: expectedParts.hasResult,
      },
    );
    assert.deepEqual(missing, expectedMissing);
  }
});
