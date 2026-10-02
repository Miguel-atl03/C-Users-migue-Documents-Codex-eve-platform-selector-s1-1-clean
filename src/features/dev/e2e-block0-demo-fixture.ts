import type { StartPositionContext } from "@/domain/start-position-context";
import { initialGuideSeenState, type WorkMapData } from "@/domain/local-work-map";

export const E2E_BLOCK0_DEMO_SESSION_ID = "dev-e2e-block0";

export const E2E_BLOCK0_DEMO_EXPECTED_ACTIVITY_COUNT = 17;
export const E2E_BLOCK0_DEMO_EXPECTED_PRIMARY_COUNT = 8;

export const E2E_FINANCIAL_FIXTURE_AREAS = ["Finanzas", "Control de gestion"] as const;

/** Activity with verb + object + rule + output for Block 0 prefill review. */
export const E2E_FINANCIAL_EXAMPLE_ACTIVITY_LITERAL =
  "Analizo la proyeccion mensual de erogaciones comparando el gasto real contra Oracle para generar reportes de desviaciones con analisis de causa raiz.";

export function createE2eDemoStartPositionContext(): StartPositionContext {
  return {
    participationPlace: "analyst",
    participationPlaceOther: "",
    decisionProximity: "propose_prepare",
  };
}

function buildActivities(prefix: string, literals: string[]) {
  return literals.map((text, index) => ({
    id: `${prefix}-${index + 1}`,
    text,
  }));
}

const E2E_RESPONSIBILITY_1_ACTIVITIES = [
  E2E_FINANCIAL_EXAMPLE_ACTIVITY_LITERAL,
  "Concilio saldos de cuentas contables con el auxiliar de proveedores siguiendo la matriz de cuentas para entregar el balance de comprobacion.",
  "Valido ajustes de provision con la politica de gasto vigente antes de cerrar el mes contable.",
  "Consolido comentarios de variacion por centro de costo usando la plantilla corporativa para generar el informe ejecutivo.",
  "Reviso partidas pendientes de conciliacion bancaria con el extracto oficial para cerrar la cuenta puente.",
  "Actualizo el forecast trimestral de erogaciones cruzando escenarios con finanzas para entregar la proyeccion revisada.",
];

const E2E_RESPONSIBILITY_2_ACTIVITIES = [
  "Coordino el cierre mensual con las areas operativas mediante reuniones de seguimiento para alinear fechas de entrega.",
  "Recopilo evidencia de soporte de gastos extraordinarios con los responsables de area para documentar la variacion.",
  "Verifico la aplicacion de tipos de cambio en partidas en moneda extranjera usando el tablero oficial para validar conversiones.",
  "Preparo el paquete de cierre para auditoria interna siguiendo el checklist de control para entregar el expediente mensual.",
  "Analizo desviaciones de headcount contra presupuesto por unidad de negocio para generar alertas tempranas.",
  "Consolido indicadores de productividad financiera con datos de operaciones para entregar el tablero de gestion.",
];

const E2E_RESPONSIBILITY_3_ACTIVITIES = [
  "Elaboro el documento de criterios vigentes para el equipo de presupuestos siguiendo la politica corporativa para entregar lineamientos de captura.",
  "Actualizo el catalogo de centros de costo con las areas usuarias usando la estructura aprobada para mantener la clasificacion operativa.",
  "Reviso solicitudes de alta de proveedores con el expediente fiscal completo para autorizar el registro en ERP.",
  "Monitoreo cumplimiento de fechas limite de cierre con los lideres funcionales para escalar riesgos de retraso.",
  "Documento hallazgos de control en gastos viaje comparando comprobantes contra politica para generar recomendaciones correctivas.",
];

export function listWorkMapSelectedAreas(workMap: WorkMapData): string[] {
  return [...workMap.selectedAreas, ...workMap.customAreas]
    .map((area) => area.trim())
    .filter(Boolean);
}

export function workMapSelectedAreasMatch(left: WorkMapData, right: WorkMapData): boolean {
  const normalize = (workMap: WorkMapData) =>
    listWorkMapSelectedAreas(workMap)
      .slice()
      .sort((a, b) => a.localeCompare(b, "es"))
      .join("|");

  return normalize(left) === normalize(right);
}

export function isWorkMapStructurallyEqualToFinancialFixture(workMap: WorkMapData): boolean {
  const fixture = createE2eFinancialExampleWorkMap();
  if (!workMapSelectedAreasMatch(workMap, fixture)) {
    return false;
  }

  if (countWorkMapResponsibilities(workMap) !== countWorkMapResponsibilities(fixture)) {
    return false;
  }

  if (countFilledWorkMapActivities(workMap) !== countFilledWorkMapActivities(fixture)) {
    return false;
  }

  const fixtureLiterals = listE2eFinancialFixtureActivityLiterals().slice().sort();
  const savedLiterals = workMap.responsibilities
    .flatMap((responsibility) => responsibility.activities)
    .map((activity) => activity.text.trim())
    .filter(Boolean)
    .slice()
    .sort();

  return fixtureLiterals.join("\u0000") === savedLiterals.join("\u0000");
}

/**
 * Manual recorrido B fixture: 1 area, 2 responsibilities, 2 activities each (4 total).
 */
export function createE2eManualMinimalWorkMap(
  startPositionContext?: StartPositionContext,
): WorkMapData {
  return {
    selectedAreas: ["Construccion"],
    customAreas: [],
    responsibilities: [
      {
        id: "resp-manual-1",
        text: "Yo coordino avance de obra y seguimiento de frentes activos.",
        activities: [
          {
            id: "act-manual-1",
            text: "Reviso avance diario del frente con el supervisor de obra para actualizar el tablero de control.",
          },
          {
            id: "act-manual-2",
            text: "Valido materiales recibidos en sitio contra la orden de compra para autorizar su uso.",
          },
        ],
      },
      {
        id: "resp-manual-2",
        text: "Yo preparo reportes semanales de productividad para el jefe de proyecto.",
        activities: [
          {
            id: "act-manual-3",
            text: "Consolido productividad por cuadrilla usando la plantilla semanal para entregar el reporte.",
          },
          {
            id: "act-manual-4",
            text: "Documento retrasos por clima con evidencia fotografica para escalar riesgos de cronograma.",
          },
        ],
      },
    ],
    guideSeen: initialGuideSeenState(),
    saveAttempts: 0,
    fieldValidationState: {},
    isSaved: false,
    isReviewMode: false,
    savedWithWarnings: false,
    ...(startPositionContext ? { startPositionContext } : {}),
  };
}

export const E2E_MANUAL_MINIMAL_EXPECTED_ACTIVITY_COUNT = 4;
export const E2E_MANUAL_MINIMAL_EXPECTED_PRIMARY_COUNT = 4;

/**
 * Populates WorkMap with a finance example sized for primary selection (17 → 8).
 * Still requires the user to Guardar and Continuar — not pre-saved.
 */
export function createE2eFinancialExampleWorkMap(
  startPositionContext?: StartPositionContext,
): WorkMapData {
  return {
    selectedAreas: ["Finanzas", "Control de gestion"],
    customAreas: [],
    responsibilities: [
      {
        id: "resp-e2e-1",
        text: "Yo analizo desviaciones presupuestales y preparo reportes de control de gasto.",
        activities: buildActivities("act-e2e-r1", E2E_RESPONSIBILITY_1_ACTIVITIES),
      },
      {
        id: "resp-e2e-2",
        text: "Yo coordino el cierre mensual con las areas operativas.",
        activities: buildActivities("act-e2e-r2", E2E_RESPONSIBILITY_2_ACTIVITIES),
      },
      {
        id: "resp-e2e-3",
        text: "Yo mantengo criterios contables y soporte operativo para presupuestos.",
        activities: buildActivities("act-e2e-r3", E2E_RESPONSIBILITY_3_ACTIVITIES),
      },
    ],
    guideSeen: initialGuideSeenState(),
    saveAttempts: 0,
    fieldValidationState: {},
    isSaved: false,
    isReviewMode: false,
    savedWithWarnings: false,
    ...(startPositionContext ? { startPositionContext } : {}),
  };
}

export function countFilledWorkMapActivities(workMap: WorkMapData): number {
  return workMap.responsibilities
    .flatMap((responsibility) => responsibility.activities)
    .filter((activity) => activity.text.trim().length > 0).length;
}

export function countWorkMapResponsibilities(workMap: WorkMapData): number {
  return workMap.responsibilities.filter((responsibility) =>
    responsibility.activities.some((activity) => activity.text.trim().length > 0),
  ).length;
}

export function isE2eFinancialFixtureWorkMap(workMap: WorkMapData): boolean {
  return workMap.responsibilities.some((responsibility) =>
    responsibility.activities.some((activity) => activity.id.startsWith("act-e2e-")),
  );
}

export function listE2eFinancialFixtureActivityLiterals(): string[] {
  return [
    ...E2E_RESPONSIBILITY_1_ACTIVITIES,
    ...E2E_RESPONSIBILITY_2_ACTIVITIES,
    ...E2E_RESPONSIBILITY_3_ACTIVITIES,
  ];
}
