/**
 * Matriz fija de interacción X/Y (rector §9).
 * No se infiere por adyacencia visual. No inventa causalidad en celdas "-".
 *
 * P-CLIENT-01 aparece en §9 como fila de frontera (no es P-SUP ni chip del Eje X).
 */

import {
  CORE_MILESTONE_CODES,
  type CoreMilestoneCode,
} from "./core-milestone-axis.catalog";
import {
  SUPPORT_PROCESS_CODES,
  type SupportProcessCode,
} from "./support-process-axis.catalog";

export const XY_INTERACTION_MATRIX_SOURCE_REFERENCE =
  "Diseno_Panel_Control_EVE_Empresa_Cliente_Matriz_XY_Gobernanza_Experiencia_v1_0.docx §9";

export type XyRelationCode = "D" | "M" | "P" | "P*" | "-";

/** Filas seleccionables del Eje X (P-SUP). */
export type XySupportMatrixRowKey = SupportProcessCode;

/**
 * Fila de referencia del rector §9: "P-CLIENT-01 (frontera)".
 * No forma parte del Eje X ni es seleccionable como proceso de soporte.
 */
export type XyBorderMatrixRowKey = "P-CLIENT-01";

export type XyMatrixRowKey = XySupportMatrixRowKey | XyBorderMatrixRowKey;

export type XyMatrixRowDefinition = {
  code: XyMatrixRowKey;
  label: string;
  kind: "support" | "client_border";
};

const SUPPORT_MATRIX: Record<
  XySupportMatrixRowKey,
  Record<CoreMilestoneCode, XyRelationCode>
> = {
  "P-SUP-01": {
    H0: "-",
    H1: "D",
    H2: "-",
    H3: "-",
    H4: "-",
    H5: "-",
    H6: "-",
  },
  "P-SUP-02": {
    H0: "-",
    H1: "-",
    H2: "D",
    H3: "-",
    H4: "-",
    H5: "-",
    H6: "-",
  },
  "P-SUP-03": {
    H0: "-",
    H1: "-",
    H2: "-",
    H3: "M",
    H4: "-",
    H5: "-",
    H6: "-",
  },
  "P-SUP-04": {
    H0: "-",
    H1: "-",
    H2: "-",
    H3: "-",
    H4: "M",
    H5: "-",
    H6: "-",
  },
  "P-SUP-05": {
    H0: "-",
    H1: "-",
    H2: "-",
    H3: "-",
    H4: "-",
    H5: "M",
    H6: "-",
  },
  "P-SUP-06": {
    H0: "-",
    H1: "P",
    H2: "P",
    H3: "P",
    H4: "P",
    H5: "P",
    H6: "P",
  },
  "P-SUP-07/08": {
    H0: "-",
    H1: "P*",
    H2: "P*",
    H3: "P*",
    H4: "P*",
    H5: "P*",
    H6: "P*",
  },
  "P-SUP-09": {
    H0: "-",
    H1: "-",
    H2: "P*",
    H3: "P*",
    H4: "P*",
    H5: "P*",
    H6: "P*",
  },
};

/** Fuente: §9 tabla — fila "P-CLIENT-01 (frontera)" D - - - - D D */
const CLIENT_BORDER_MATRIX: Record<CoreMilestoneCode, XyRelationCode> = {
  H0: "D",
  H1: "-",
  H2: "-",
  H3: "-",
  H4: "-",
  H5: "D",
  H6: "D",
};

export const XY_SUPPORT_MATRIX_ROWS: readonly XyMatrixRowDefinition[] =
  SUPPORT_PROCESS_CODES.map((code) => ({
    code,
    label: code,
    kind: "support" as const,
  }));

export const XY_CLIENT_BORDER_ROW: XyMatrixRowDefinition = {
  code: "P-CLIENT-01",
  label: "Proceso del cliente (frontera)",
  kind: "client_border",
};

export const XY_MATRIX_MILESTONE_COLUMNS: readonly CoreMilestoneCode[] =
  CORE_MILESTONE_CODES;

export const XY_RELATION_LEGEND: readonly {
  code: XyRelationCode;
  label: string;
}[] = [
  { code: "D", label: "Relación directa" },
  { code: "M", label: "Handoff manual" },
  { code: "P", label: "Línea paralela" },
  { code: "P*", label: "Paralelo condicionado" },
  { code: "-", label: "Sin relación causal directa" },
];

export function getXyRelationCode(
  processCode: string,
  milestoneCode: CoreMilestoneCode,
): XyRelationCode | null {
  if (processCode === "P-CLIENT-01") {
    return CLIENT_BORDER_MATRIX[milestoneCode] ?? null;
  }
  const row = SUPPORT_MATRIX[processCode as XySupportMatrixRowKey];
  if (!row) return null;
  return row[milestoneCode] ?? null;
}

export function formatXyRelationLabel(code: XyRelationCode): string {
  switch (code) {
    case "D":
      return "Relación directa";
    case "M":
      return "Handoff manual";
    case "P":
      return "Línea paralela";
    case "P*":
      return "Paralelo condicionado";
    case "-":
      return "Sin relación causal directa";
  }
}

/**
 * Mensajes §9.1 — arquitectura definida, no ejecución del caso.
 */
export function presentXyIntersectionMessage(code: XyRelationCode): string {
  switch (code) {
    case "D":
      return "Relación arquitectónica definida: el proceso produce el hito. No afirma que esa relación se haya ejecutado en el caso.";
    case "M":
      return "Relación arquitectónica definida: handoff manual. La salida debe registrarse con aceptación auditada; no se marca alcanzada sin evidencia.";
    case "P":
      return "Relación arquitectónica definida: línea paralela. Puede avanzar en paralelo; no produce ni habilita el hito core.";
    case "P*":
      return "Relación arquitectónica definida: paralelo condicionado por prerrequisitos propios. No afirma que habilite el hito core.";
    case "-":
      return "Sin relación causal directa según el diseño rector. Consulte el proceso o el hito por separado.";
  }
}
