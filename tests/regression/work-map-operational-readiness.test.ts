import { register } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../..").replace(/\\/g, "/");
const hookPath = join(tmpdir(), "eve-workmap-operational-readiness-path-hook.mjs");

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
const readinessModule = await import(
  "../../src/services/work-map-operational-readiness.ts"
);

const {
  ACCEPTED_WITH_WARNING_MESSAGE,
  activityFieldKey,
  responsibilityFieldKey,
} = domainModule;
type WorkMapData = import("../../src/domain/local-work-map.ts").WorkMapData;
const {
  OPERATIONAL_READINESS_MESSAGES,
  evaluateWorkMapOperationalReadiness,
} = readinessModule;

const VALID_RESPONSIBILITY_1 =
  "Yo defino el programa semanal de produccion segun los pedidos pendientes y la capacidad disponible para asegurar continuidad operativa.";
const VALID_RESPONSIBILITY_2 =
  "Yo verifico que los candidatos cumplan el perfil requerido y apruebo su ingreso cuando cubren las condiciones del puesto.";
const VALID_ACTIVITY_1 =
  "Registro las facturas de proveedores en el ERP siguiendo el catalogo de cuentas para generar el asiento contable de gasto.";
const VALID_ACTIVITY_2 =
  "Mido las dimensiones de la pieza producida utilizando el calibrador digital para verificar si cumple con la tolerancia aprobada.";
const INVALID_ACTIVITY =
  "Mido las dimensiones de la pieza producida no se que";

const FORBIDDEN_MESSAGE_SNIPPETS = [
  "Por ejemplo",
  "contra",
  "procedimiento acordado",
  "siguiente paso",
  "informacion necesaria",
  "needs_help",
  "fieldValidationState",
  "coverage:",
  "piezas mínimas",
  "redacciones pendientes",
  "Aún faltan piezas mínimas",
  "Hay redacciones pendientes",
  "Completa las piezas mínimas",
];

const FORBIDDEN_FUNCTION_NAMES = [
  "processWorkMapValidationOnSave",
  "evaluateSyntaxFieldOnSave",
  "evaluateFieldValidationEntry",
  "getActivityAssistMessage",
  "getResponsibilityAssistMessage",
  "buildStructuralActivityAssistMessage",
  "buildStructuralResponsibilityAssistMessage",
];

function buildReadyWorkMap(
  overrides: Partial<WorkMapData> = {},
  fieldValidationState: WorkMapData["fieldValidationState"] = {},
): WorkMapData {
  return {
    selectedAreas: ["Produccion"],
    customAreas: [],
    responsibilities: [
      {
        id: "resp-1",
        text: VALID_RESPONSIBILITY_1,
        activities: [
          { id: "act-1", text: VALID_ACTIVITY_1 },
          { id: "act-1b", text: VALID_ACTIVITY_2 },
        ],
      },
      {
        id: "resp-2",
        text: VALID_RESPONSIBILITY_2,
        activities: [
          { id: "act-2", text: VALID_ACTIVITY_1 },
          { id: "act-2b", text: VALID_ACTIVITY_2 },
        ],
      },
    ],
    guideSeen: { area: true, responsibility: true, activity: true, save: true, roleHelp: true },
    saveAttempts: 0,
    fieldValidationState,
    isSaved: false,
    isReviewMode: false,
    savedWithWarnings: false,
    ...overrides,
  };
}

function collectMessages(result: ReturnType<typeof evaluateWorkMapOperationalReadiness>) {
  return [
    result.globalMessage,
    result.globalDetailMessage,
    ...result.blockingReasons.map((reason) => reason.message),
  ].filter(Boolean);
}

test("A) readiness OK with areas, coverage and sufficient fields", () => {
  const workMap = buildReadyWorkMap({
    fieldValidationState: {
      [responsibilityFieldKey("resp-1")]: {
        attempts: 0,
        lastTextReviewed: VALID_RESPONSIBILITY_1,
        status: "valid",
      },
      [responsibilityFieldKey("resp-2")]: {
        attempts: 0,
        lastTextReviewed: VALID_RESPONSIBILITY_2,
        status: "valid",
      },
      [activityFieldKey("act-1")]: {
        attempts: 0,
        lastTextReviewed: VALID_ACTIVITY_1,
        status: "valid",
      },
      [activityFieldKey("act-1b")]: {
        attempts: 0,
        lastTextReviewed: VALID_ACTIVITY_2,
        status: "valid",
      },
      [activityFieldKey("act-2")]: {
        attempts: 0,
        lastTextReviewed: VALID_ACTIVITY_1,
        status: "valid",
      },
      [activityFieldKey("act-2b")]: {
        attempts: 0,
        lastTextReviewed: VALID_ACTIVITY_2,
        status: "valid",
      },
    },
  });

  const result = evaluateWorkMapOperationalReadiness({
    workMap,
    hasAreas: true,
  });

  assert.equal(result.canEnterReviewMode, true);
  assert.equal(result.savedWithWarnings, false);
  assert.equal(result.blockingReasons.length, 0);
});

test("H1-A) 1 resp + 2 activities blocks by responsibility count", () => {
  const workMap = buildReadyWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: VALID_RESPONSIBILITY_1,
        activities: [
          { id: "act-1", text: VALID_ACTIVITY_1 },
          { id: "act-1b", text: VALID_ACTIVITY_2 },
        ],
      },
      {
        id: "resp-2",
        text: "",
        activities: [{ id: "act-2", text: "" }],
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
    OPERATIONAL_READINESS_MESSAGES.responsibilityMissing,
  );
  assert.equal(
    result.globalDetailMessage,
    OPERATIONAL_READINESS_MESSAGES.responsibilityMissingDetail,
  );
});

test("H1-D) missing area blocks", () => {
  const workMap = buildReadyWorkMap({ selectedAreas: [], customAreas: [] });
  const result = evaluateWorkMapOperationalReadiness({
    workMap,
    hasAreas: false,
  });

  assert.equal(result.canEnterReviewMode, false);
  assert.equal(
    result.globalMessage,
    OPERATIONAL_READINESS_MESSAGES.areaMissing,
  );
  assert.equal(result.coverageBlocks.includes("areas"), true);
});

test("H1-C) 2 resp, one with 1 activity blocks with specific message", () => {
  const workMap = buildReadyWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: VALID_RESPONSIBILITY_1,
        activities: [{ id: "act-1", text: VALID_ACTIVITY_1 }],
      },
      {
        id: "resp-2",
        text: VALID_RESPONSIBILITY_2,
        activities: [
          { id: "act-2", text: VALID_ACTIVITY_1 },
          { id: "act-2b", text: VALID_ACTIVITY_2 },
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
    OPERATIONAL_READINESS_MESSAGES.activityMissing,
  );
  assert.equal(
    result.globalDetailMessage,
    OPERATIONAL_READINESS_MESSAGES.activityMissingDetail(1),
  );
  assert.equal(
    result.blockingReasons.some(
      (reason) => reason.targetKey === "coverage:activities:resp-1",
    ),
    true,
  );
});

test("H1-B) 2 resp + 2 activities each allows save with needs_help", () => {
  const workMap = buildReadyWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: VALID_RESPONSIBILITY_1,
        activities: [
          { id: "act-1", text: INVALID_ACTIVITY },
          { id: "act-1b", text: VALID_ACTIVITY_2 },
        ],
      },
      {
        id: "resp-2",
        text: VALID_RESPONSIBILITY_2,
        activities: [
          { id: "act-2", text: VALID_ACTIVITY_1 },
          { id: "act-2b", text: VALID_ACTIVITY_2 },
        ],
      },
    ],
    fieldValidationState: {
      [activityFieldKey("act-1")]: {
        attempts: 1,
        lastTextReviewed: INVALID_ACTIVITY,
        status: "needs_help",
        message: "Falta indicar como lo haces.",
        lastMessageType: "syntax",
      },
    },
  });

  const result = evaluateWorkMapOperationalReadiness({
    workMap,
    hasAreas: true,
  });

  assert.equal(result.canEnterReviewMode, true);
  assert.equal(result.savedWithWarnings, false);
  assert.equal(result.blockingReasons.length, 0);
});

test("E) allowed_with_warning allows save with savedWithWarnings true", () => {
  const workMap = buildReadyWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: VALID_RESPONSIBILITY_1,
        activities: [
          { id: "act-1", text: INVALID_ACTIVITY },
          { id: "act-1b", text: VALID_ACTIVITY_2 },
        ],
      },
      {
        id: "resp-2",
        text: VALID_RESPONSIBILITY_2,
        activities: [
          { id: "act-2", text: VALID_ACTIVITY_1 },
          { id: "act-2b", text: VALID_ACTIVITY_2 },
        ],
      },
    ],
    fieldValidationState: {
      [responsibilityFieldKey("resp-1")]: {
        attempts: 0,
        lastTextReviewed: VALID_RESPONSIBILITY_1,
        status: "valid",
      },
      [responsibilityFieldKey("resp-2")]: {
        attempts: 0,
        lastTextReviewed: VALID_RESPONSIBILITY_2,
        status: "valid",
      },
      [activityFieldKey("act-1")]: {
        attempts: 3,
        lastTextReviewed: INVALID_ACTIVITY,
        status: "allowed_with_warning",
        message: ACCEPTED_WITH_WARNING_MESSAGE,
        lastMessageType: "syntax",
      },
      [activityFieldKey("act-1b")]: {
        attempts: 0,
        lastTextReviewed: VALID_ACTIVITY_2,
        status: "valid",
      },
      [activityFieldKey("act-2")]: {
        attempts: 0,
        lastTextReviewed: VALID_ACTIVITY_1,
        status: "valid",
      },
      [activityFieldKey("act-2b")]: {
        attempts: 0,
        lastTextReviewed: VALID_ACTIVITY_2,
        status: "valid",
      },
    },
  });

  const result = evaluateWorkMapOperationalReadiness({
    workMap,
    hasAreas: true,
  });

  assert.equal(result.canEnterReviewMode, true);
  assert.equal(result.savedWithWarnings, true);
});

test("H1-E) readiness does not block by needs_help if coverage complete", () => {
  const workMap = buildReadyWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: VALID_RESPONSIBILITY_1,
        activities: [
          { id: "act-1", text: INVALID_ACTIVITY },
          { id: "act-1b", text: VALID_ACTIVITY_2 },
        ],
      },
      {
        id: "resp-2",
        text: VALID_RESPONSIBILITY_2,
        activities: [
          { id: "act-2", text: VALID_ACTIVITY_1 },
          { id: "act-2b", text: VALID_ACTIVITY_2 },
        ],
      },
    ],
    fieldValidationState: {
      [activityFieldKey("act-1")]: {
        attempts: 1,
        lastTextReviewed: INVALID_ACTIVITY,
        status: "needs_help",
        message: "Falta indicar como lo haces.",
        lastMessageType: "syntax",
      },
    },
  });

  const result = evaluateWorkMapOperationalReadiness({
    workMap,
    hasAreas: true,
  });

  assert.equal(result.canEnterReviewMode, true);
  assert.equal(result.fieldBlocks.length, 0);
});

test("G) evaluateWorkMapOperationalReadiness does not mutate input workMap", () => {
  const workMap = buildReadyWorkMap({
    fieldValidationState: {
      [activityFieldKey("act-1")]: {
        attempts: 1,
        lastTextReviewed: INVALID_ACTIVITY,
        status: "needs_help",
        message: "Falta indicar como lo haces.",
        lastMessageType: "syntax",
      },
    },
  });
  const before = JSON.stringify(workMap);

  evaluateWorkMapOperationalReadiness({ workMap, hasAreas: true });

  assert.equal(JSON.stringify(workMap), before);
});

test("H1-F) no internal messages in operational readiness output", () => {
  const scenarios = [
    evaluateWorkMapOperationalReadiness({
      workMap: buildReadyWorkMap({ selectedAreas: [], customAreas: [] }),
      hasAreas: false,
    }),
    evaluateWorkMapOperationalReadiness({
      workMap: buildReadyWorkMap({
        responsibilities: [
          {
            id: "resp-1",
            text: VALID_RESPONSIBILITY_1,
            activities: [{ id: "act-1", text: VALID_ACTIVITY_1 }],
          },
          {
            id: "resp-2",
            text: "",
            activities: [{ id: "act-2", text: "" }],
          },
        ],
      }),
      hasAreas: true,
    }),
    evaluateWorkMapOperationalReadiness({
      workMap: buildReadyWorkMap({
        responsibilities: [
          {
            id: "resp-1",
            text: VALID_RESPONSIBILITY_1,
            activities: [
              { id: "act-1", text: INVALID_ACTIVITY },
              { id: "act-1b", text: VALID_ACTIVITY_2 },
            ],
          },
          {
            id: "resp-2",
            text: VALID_RESPONSIBILITY_2,
            activities: [
              { id: "act-2", text: VALID_ACTIVITY_1 },
              { id: "act-2b", text: VALID_ACTIVITY_2 },
            ],
          },
        ],
        fieldValidationState: {
          [activityFieldKey("act-1")]: {
            attempts: 1,
            lastTextReviewed: INVALID_ACTIVITY,
            status: "needs_help",
            message: "Falta indicar como lo haces.",
            lastMessageType: "syntax",
          },
        },
      }),
      hasAreas: true,
    }),
  ];

  for (const result of scenarios) {
    for (const message of collectMessages(result)) {
      for (const forbidden of FORBIDDEN_MESSAGE_SNIPPETS) {
        assert.equal(
          message.toLowerCase().includes(forbidden.toLowerCase()),
          false,
          `forbidden snippet "${forbidden}" in "${message}"`,
        );
      }
    }
  }
});

test("H2-A) 1 resp + 1 activity blocks with responsibility top notice", () => {
  const workMap = buildReadyWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: VALID_RESPONSIBILITY_1,
        activities: [{ id: "act-1", text: VALID_ACTIVITY_1 }],
      },
      {
        id: "resp-2",
        text: "",
        activities: [{ id: "act-2", text: "" }],
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
    OPERATIONAL_READINESS_MESSAGES.responsibilityMissing,
  );
  assert.equal(
    result.globalDetailMessage,
    OPERATIONAL_READINESS_MESSAGES.responsibilityMissingDetail,
  );
});

test("H2-B) activity coverage block uses activity top notice not field blocks", () => {
  const workMap = buildReadyWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: VALID_RESPONSIBILITY_1,
        activities: [{ id: "act-1", text: VALID_ACTIVITY_1 }],
      },
      {
        id: "resp-2",
        text: VALID_RESPONSIBILITY_2,
        activities: [
          { id: "act-2", text: VALID_ACTIVITY_1 },
          { id: "act-2b", text: VALID_ACTIVITY_2 },
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
    OPERATIONAL_READINESS_MESSAGES.activityMissing,
  );
  assert.equal(
    result.globalDetailMessage,
    OPERATIONAL_READINESS_MESSAGES.activityMissingDetail(1),
  );
  assert.equal(result.fieldBlocks.length, 0);
});

test("H2-C) 2 resp + 2 activities each allows save with needs_help states", () => {
  const workMap = buildReadyWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: VALID_RESPONSIBILITY_1,
        activities: [
          { id: "act-1", text: INVALID_ACTIVITY },
          { id: "act-1b", text: VALID_ACTIVITY_2 },
        ],
      },
      {
        id: "resp-2",
        text: VALID_RESPONSIBILITY_2,
        activities: [
          { id: "act-2", text: VALID_ACTIVITY_1 },
          { id: "act-2b", text: VALID_ACTIVITY_2 },
        ],
      },
    ],
    fieldValidationState: {
      [activityFieldKey("act-1")]: {
        attempts: 1,
        lastTextReviewed: INVALID_ACTIVITY,
        status: "needs_help",
        message: "Falta indicar como lo haces.",
        lastMessageType: "syntax",
      },
    },
  });

  const result = evaluateWorkMapOperationalReadiness({
    workMap,
    hasAreas: true,
  });

  assert.equal(result.canEnterReviewMode, true);
  assert.equal(result.blockingReasons.length, 0);
});

test("I) operational-readiness source avoids forbidden function names", () => {
  const source = readFileSync(
    resolve(projectRoot, "src/services/work-map-operational-readiness.ts"),
    "utf8",
  );

  for (const forbidden of FORBIDDEN_FUNCTION_NAMES) {
    assert.equal(
      source.includes(forbidden),
      false,
      `forbidden function name "${forbidden}" found in operational-readiness source`,
    );
  }
});
