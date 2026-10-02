/**
 * Catálogo canónico del Eje Y — Hitos H0–H6 de PF-CORE-01 (rector §8).
 *
 * Autoridad: Diseno_Panel_Control_EVE_Empresa_Cliente_Matriz_XY_Gobernanza_Experiencia_v1_0.docx §8.
 * reached / current_wait / blocked no se inventan aquí: los aporta el BFF con evidencia Object[State].
 */

import type { SupportProcessCode } from "./support-process-axis.catalog";

export const CORE_MILESTONE_AXIS_SOURCE_REFERENCE =
  "Diseno_Panel_Control_EVE_Empresa_Cliente_Matriz_XY_Gobernanza_Experiencia_v1_0.docx §8";

export type CoreMilestoneCode =
  | "H0"
  | "H1"
  | "H2"
  | "H3"
  | "H4"
  | "H5"
  | "H6";

/** Estados UI §8.1 (rail). Alternativas finales no son pasos del rail. */
export type CoreMilestoneUiState =
  | "reached"
  | "current_wait"
  | "manual_pending"
  | "blocked"
  | "not_reached";

export type CoreMilestoneFinalAlternative =
  | "ClosedWithoutSufficiency"
  | "Cancelled";

export type CoreMilestoneDefinition = {
  code: CoreMilestoneCode;
  label: string;
  sequence: number;
  expectedObjectName: "CasoDiagnosticoEVE";
  expectedObjectState: string;
  /** Evento que habilita el siguiente hito (tabla §8). */
  expectedNextEventLabel: string | null;
  timerPolicyName: string | null;
  /** Proceso que produce o registra el siguiente avance. */
  responsibleProcessCode: SupportProcessCode | "P-CLIENT-01" | null;
  responsibleProcessManual: boolean;
  sourceReference: string;
};

export const CORE_MILESTONE_DEFINITIONS: readonly CoreMilestoneDefinition[] = [
  {
    code: "H0",
    label: "Caso abierto",
    sequence: 0,
    expectedObjectName: "CasoDiagnosticoEVE",
    expectedObjectState: "InDiagnosticProduction",
    expectedNextEventLabel: "SceneCanonicalRecord [Consolidated]",
    timerPolicyName: "max_tiempo_scene_record_consolidated",
    responsibleProcessCode: "P-SUP-01",
    responsibleProcessManual: false,
    sourceReference: CORE_MILESTONE_AXIS_SOURCE_REFERENCE,
  },
  {
    code: "H1",
    label: "Escena operativa consolidada",
    sequence: 1,
    expectedObjectName: "CasoDiagnosticoEVE",
    expectedObjectState: "WithSceneCanonicalRecord",
    expectedNextEventLabel: "EvidenceBundle [ReadyForTransduction]",
    timerPolicyName: "max_tiempo_evidence_bundle_ready",
    responsibleProcessCode: "P-SUP-02",
    responsibleProcessManual: false,
    sourceReference: CORE_MILESTONE_AXIS_SOURCE_REFERENCE,
  },
  {
    code: "H2",
    label: "Listo para transducción",
    sequence: 2,
    expectedObjectName: "CasoDiagnosticoEVE",
    expectedObjectState: "ReadyForTransduction",
    expectedNextEventLabel: "EscenaEvidencial [Validated]",
    timerPolicyName: "max_tiempo_escena_evidencial_validated",
    responsibleProcessCode: "P-SUP-03",
    responsibleProcessManual: true,
    sourceReference: CORE_MILESTONE_AXIS_SOURCE_REFERENCE,
  },
  {
    code: "H3",
    label: "Escenas evidenciales validadas",
    sequence: 3,
    expectedObjectName: "CasoDiagnosticoEVE",
    expectedObjectState: "WithValidatedEvidentialScenes",
    expectedNextEventLabel: "PeliculaCausalAgregada [Aggregated]",
    timerPolicyName: "max_tiempo_pelicula_causal_aggregated",
    responsibleProcessCode: "P-SUP-04",
    responsibleProcessManual: true,
    sourceReference: CORE_MILESTONE_AXIS_SOURCE_REFERENCE,
  },
  {
    code: "H4",
    label: "Película causal agregada",
    sequence: 4,
    expectedObjectName: "CasoDiagnosticoEVE",
    expectedObjectState: "WithAggregatedCausalMovie",
    expectedNextEventLabel: "DiagnosticoExpertoFinal [Delivered]",
    timerPolicyName: "max_tiempo_diagnostico_final_delivered",
    responsibleProcessCode: "P-SUP-05",
    responsibleProcessManual: true,
    sourceReference: CORE_MILESTONE_AXIS_SOURCE_REFERENCE,
  },
  {
    code: "H5",
    label: "Diagnóstico experto recibido",
    sequence: 5,
    expectedObjectName: "CasoDiagnosticoEVE",
    expectedObjectState: "WithDeliveredExpertDiagnosis",
    expectedNextEventLabel: "Confirmación de entrega/cierre",
    timerPolicyName: "max_tiempo_confirmacion_cierre",
    responsibleProcessCode: "P-CLIENT-01",
    responsibleProcessManual: false,
    sourceReference: CORE_MILESTONE_AXIS_SOURCE_REFERENCE,
  },
  {
    code: "H6",
    label: "Caso entregado y cerrado",
    sequence: 6,
    expectedObjectName: "CasoDiagnosticoEVE",
    expectedObjectState: "Delivered",
    expectedNextEventLabel: null,
    timerPolicyName: null,
    responsibleProcessCode: null,
    responsibleProcessManual: false,
    sourceReference: CORE_MILESTONE_AXIS_SOURCE_REFERENCE,
  },
] as const;

export const CORE_MILESTONE_CODES: readonly CoreMilestoneCode[] =
  CORE_MILESTONE_DEFINITIONS.map((item) => item.code);

export const CORE_MILESTONE_TOTAL = CORE_MILESTONE_CODES.length;

export function isCoreMilestoneCode(value: string): value is CoreMilestoneCode {
  return (CORE_MILESTONE_CODES as readonly string[]).includes(value);
}

export function getCoreMilestoneDefinition(
  code: CoreMilestoneCode,
): CoreMilestoneDefinition {
  const found = CORE_MILESTONE_DEFINITIONS.find((item) => item.code === code);
  if (!found) {
    throw new Error(`unknown_core_milestone_code:${code}`);
  }
  return found;
}

export function formatCoreMilestoneObjectState(
  definition: Pick<
    CoreMilestoneDefinition,
    "expectedObjectName" | "expectedObjectState"
  >,
): string {
  return `${definition.expectedObjectName} [${definition.expectedObjectState}]`;
}

export function formatCoreMilestoneUiStateLabel(
  state: CoreMilestoneUiState | null,
): string {
  switch (state) {
    case "reached":
      return "Alcanzado";
    case "current_wait":
      return "Espera actual";
    case "manual_pending":
      return "Pendiente manual";
    case "blocked":
      return "Bloqueado";
    case "not_reached":
      return "No alcanzado";
    default:
      return "No disponible";
  }
}

export type CoreMilestoneEvaluation = {
  code: CoreMilestoneCode;
  linkPresent: boolean;
  linkApplicable: boolean;
  reached: boolean;
};

/**
 * Estados UI factuales (§8.1 operacionalizado).
 * No infiere current_wait / manual_pending / blocked por secuencia.
 * blocked permanece en el catálogo rector pero no se produce sin fuente explícita.
 */
export function resolveCoreMilestoneUiState(input: {
  progressStatus: "available" | "partial" | "unavailable";
  linkPresent: boolean;
  linkApplicable: boolean;
  reached: boolean;
}): CoreMilestoneUiState | null {
  if (input.progressStatus === "unavailable") {
    return null;
  }

  if (!input.linkPresent || !input.linkApplicable) {
    return null;
  }

  if (input.reached) {
    return "reached";
  }

  // not_reached solo con evaluación completa (available).
  if (input.progressStatus === "available") {
    return "not_reached";
  }

  // partial + sin logro positivo → No disponible (no not_reached).
  return null;
}
