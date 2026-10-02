import type { WorkMapData } from "@/domain/local-work-map";
import type { PrimaryActivitySelectionResult } from "@/domain/primary-activity-selection-policy";
import { selectPrimaryActivitiesFromWorkMap } from "@/services/primary-activity-selector";
import {
  buildInitialBlock0VisualDraftFromWorkMap,
  type WorkMapBlock0PrefillResult,
} from "@/services/workmap-to-block0-prefill";

export const SIGNIFICADO_DEV_SESSION_ID = "dev-significado-slice";

/** Literal with verb + object + rule + output for Block 0 prefill visual review. */
export const SIGNIFICADO_BLOCK0_DEV_ACTIVITY_LITERAL =
  "Analizo la proyección mensual de erogaciones comparando el gasto real contra Oracle para generar reportes de desviaciones con análisis de causa raíz.";

export function createSignificadoDevWorkMap(): WorkMapData {
  return {
    selectedAreas: ["Produccion", "Calidad"],
    customAreas: [],
    responsibilities: [
      {
        id: "resp-dev-1",
        text: "Yo defino el programa semanal de produccion segun los pedidos pendientes.",
        activities: [
          {
            id: "act-dev-1",
            text: "Registro las facturas de proveedores en el ERP para generar el asiento contable.",
          },
          {
            id: "act-dev-2",
            text: "Mido las dimensiones de la pieza producida con el calibrador digital.",
          },
        ],
      },
      {
        id: "resp-dev-2",
        text: "Yo verifico que los candidatos cumplan el perfil requerido.",
        activities: [
          {
            id: "act-dev-3",
            text: "Reviso expedientes de candidatos antes de la entrevista inicial.",
          },
        ],
      },
    ],
    guideSeen: { area: true, responsibility: true, activity: true, save: true, roleHelp: true },
    saveAttempts: 1,
    fieldValidationState: {},
    isSaved: true,
    isReviewMode: true,
    savedWithWarnings: false,
  };
}

export function createSignificadoDevWorkMapWithWarnings(): WorkMapData {
  return {
    ...createSignificadoDevWorkMap(),
    savedWithWarnings: true,
  };
}

/** WorkMap fixture for /dev/significado Block 0 prefill review (finanzas, 4-part activity). */
export function createSignificadoBlock0DevWorkMap(): WorkMapData {
  return {
    selectedAreas: ["Finanzas", "Control de gestión"],
    customAreas: [],
    responsibilities: [
      {
        id: "resp-dev-1",
        text: "Yo analizo desviaciones presupuestales y preparo reportes de control de gasto.",
        activities: [
          {
            id: "act-dev-1",
            text: SIGNIFICADO_BLOCK0_DEV_ACTIVITY_LITERAL,
          },
          {
            id: "act-dev-2",
            text: "Concilio saldos de cuentas contables con el auxiliar de proveedores.",
          },
        ],
      },
      {
        id: "resp-dev-2",
        text: "Yo coordino el cierre mensual con las áreas operativas.",
        activities: [
          {
            id: "act-dev-3",
            text: "Consolido comentarios de variación por centro de costo.",
          },
        ],
      },
    ],
    guideSeen: { area: true, responsibility: true, activity: true, save: true, roleHelp: true },
    saveAttempts: 1,
    fieldValidationState: {},
    isSaved: true,
    isReviewMode: true,
    savedWithWarnings: false,
  };
}

export function resolveSignificadoBlock0DevPrimarySelection(
  workMap: WorkMapData = createSignificadoBlock0DevWorkMap(),
): PrimaryActivitySelectionResult {
  return selectPrimaryActivitiesFromWorkMap(workMap);
}

export function buildSignificadoBlock0DevPrefill(
  workMap: WorkMapData = createSignificadoBlock0DevWorkMap(),
  primaryActivitySelectionResult: PrimaryActivitySelectionResult = resolveSignificadoBlock0DevPrimarySelection(
    workMap,
  ),
): WorkMapBlock0PrefillResult {
  return buildInitialBlock0VisualDraftFromWorkMap({
    workMap,
    primaryActivity:
      primaryActivitySelectionResult.selectedPrimaryActivities[0] ?? null,
  });
}
