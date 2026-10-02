/**
 * Catálogo canónico del Eje X — Procesos de soporte (rector §7).
 *
 * Autoridad: Diseno_Panel_Control_EVE_Empresa_Cliente_Matriz_XY_Gobernanza_Experiencia_v1_0.docx §7.
 * No define estado operacional por caso. Trigger / siguiente evento / dependencia
 * no aparecen en la tabla §7 → null ("No definido por el diseño rector").
 */

export const SUPPORT_PROCESS_AXIS_SOURCE_REFERENCE =
  "Diseno_Panel_Control_EVE_Empresa_Cliente_Matriz_XY_Gobernanza_Experiencia_v1_0.docx §7";

export type SupportProcessCode =
  | "P-SUP-01"
  | "P-SUP-02"
  | "P-SUP-03"
  | "P-SUP-04"
  | "P-SUP-05"
  | "P-SUP-06"
  | "P-SUP-07/08"
  | "P-SUP-09";

export type SupportProcessAxisCode = SupportProcessCode;

export type SupportProcessExecutionMode = "platform" | "manual";

export type SupportProcessDefinition = {
  code: SupportProcessCode;
  label: string;
  sequence: number;
  executionMode: SupportProcessExecutionMode;
  targetObjectLabel: string | null;
  targetStateLabel: string | null;
  triggerLabel: string | null;
  nextEventLabel: string | null;
  dependencyLabel: string | null;
  sourceReference: string;
};

/**
 * Vista agregada histórica (retirada del Eje X visual).
 * Conservada solo como referencia; no se incluye en buildSupportProcessAxisItems.
 */
export const SUPPORT_PROCESS_TODOS = {
  code: "Todos" as const,
  label: "Vista agregada de todas las líneas.",
  sequence: 0,
  modalityLabel: "Vista global",
  targetNote: "Sin selección específica.",
  sourceReference: SUPPORT_PROCESS_AXIS_SOURCE_REFERENCE,
  retiredFromAxis: true as const,
};

const NOT_DEFINED_BY_RECTOR = null;

export const SUPPORT_PROCESS_DEFINITIONS: readonly SupportProcessDefinition[] =
  [
    {
      code: "P-SUP-01",
      label: "Consolidar escena operativa regulada.",
      sequence: 1,
      executionMode: "platform",
      targetObjectLabel: "SceneCanonicalRecord",
      targetStateLabel: "Consolidated",
      triggerLabel: NOT_DEFINED_BY_RECTOR,
      nextEventLabel: NOT_DEFINED_BY_RECTOR,
      dependencyLabel: NOT_DEFINED_BY_RECTOR,
      sourceReference: SUPPORT_PROCESS_AXIS_SOURCE_REFERENCE,
    },
    {
      code: "P-SUP-02",
      label: "Preparar EvidenceBundle para transducción.",
      sequence: 2,
      executionMode: "platform",
      targetObjectLabel: "EvidenceBundle",
      targetStateLabel: "ReadyForTransduction",
      triggerLabel: NOT_DEFINED_BY_RECTOR,
      nextEventLabel: NOT_DEFINED_BY_RECTOR,
      dependencyLabel: NOT_DEFINED_BY_RECTOR,
      sourceReference: SUPPORT_PROCESS_AXIS_SOURCE_REFERENCE,
    },
    {
      code: "P-SUP-03",
      label: "Transducir evidencia por rol funcional.",
      sequence: 3,
      executionMode: "manual",
      targetObjectLabel: "EscenaEvidencial",
      targetStateLabel: "Validated",
      triggerLabel: NOT_DEFINED_BY_RECTOR,
      nextEventLabel: NOT_DEFINED_BY_RECTOR,
      dependencyLabel: NOT_DEFINED_BY_RECTOR,
      sourceReference: SUPPORT_PROCESS_AXIS_SOURCE_REFERENCE,
    },
    {
      code: "P-SUP-04",
      label: "Agregar causalidad empresarial.",
      sequence: 4,
      executionMode: "manual",
      targetObjectLabel: "PeliculaCausalAgregada",
      targetStateLabel: "Aggregated",
      triggerLabel: NOT_DEFINED_BY_RECTOR,
      nextEventLabel: NOT_DEFINED_BY_RECTOR,
      dependencyLabel: NOT_DEFINED_BY_RECTOR,
      sourceReference: SUPPORT_PROCESS_AXIS_SOURCE_REFERENCE,
    },
    {
      code: "P-SUP-05",
      label: "Componer síntesis experta.",
      sequence: 5,
      executionMode: "manual",
      targetObjectLabel: "DiagnosticoExpertoFinal",
      targetStateLabel: "Delivered",
      triggerLabel: NOT_DEFINED_BY_RECTOR,
      nextEventLabel: NOT_DEFINED_BY_RECTOR,
      dependencyLabel: NOT_DEFINED_BY_RECTOR,
      sourceReference: SUPPORT_PROCESS_AXIS_SOURCE_REFERENCE,
    },
    {
      code: "P-SUP-06",
      label: "Producir inventario MMABP y diagramación.",
      sequence: 6,
      executionMode: "platform",
      targetObjectLabel: "InventarioMMABP",
      targetStateLabel: "Resolved",
      triggerLabel: NOT_DEFINED_BY_RECTOR,
      nextEventLabel: NOT_DEFINED_BY_RECTOR,
      dependencyLabel: NOT_DEFINED_BY_RECTOR,
      sourceReference: SUPPORT_PROCESS_AXIS_SOURCE_REFERENCE,
    },
    {
      code: "P-SUP-07/08",
      label: "Resolver gaps y validar conformance/consistency.",
      sequence: 7,
      executionMode: "platform",
      targetObjectLabel: "ArchitectureConsistencyAssessment",
      targetStateLabel: "Satisfied",
      triggerLabel: NOT_DEFINED_BY_RECTOR,
      nextEventLabel: NOT_DEFINED_BY_RECTOR,
      dependencyLabel: NOT_DEFINED_BY_RECTOR,
      sourceReference: SUPPORT_PROCESS_AXIS_SOURCE_REFERENCE,
    },
    {
      code: "P-SUP-09",
      label: "Generar código exportable.",
      sequence: 8,
      executionMode: "platform",
      targetObjectLabel: "ExportCodePackage",
      targetStateLabel: "Generated",
      triggerLabel: NOT_DEFINED_BY_RECTOR,
      nextEventLabel: NOT_DEFINED_BY_RECTOR,
      dependencyLabel: NOT_DEFINED_BY_RECTOR,
      sourceReference: SUPPORT_PROCESS_AXIS_SOURCE_REFERENCE,
    },
  ] as const;

export const SUPPORT_PROCESS_CODES: readonly SupportProcessCode[] =
  SUPPORT_PROCESS_DEFINITIONS.map((item) => item.code);

export function isSupportProcessCode(
  value: string,
): value is SupportProcessCode {
  return (SUPPORT_PROCESS_CODES as readonly string[]).includes(value);
}

export function isSupportProcessAxisCode(
  value: string,
): value is SupportProcessAxisCode {
  return isSupportProcessCode(value);
}

export function getSupportProcessDefinition(
  code: SupportProcessCode,
): SupportProcessDefinition {
  const found = SUPPORT_PROCESS_DEFINITIONS.find((item) => item.code === code);
  if (!found) {
    throw new Error(`unknown_support_process_code:${code}`);
  }
  return found;
}

export function buildSupportProcessAxisItems(): {
  items: Array<{
    code: SupportProcessAxisCode;
    label: string;
    sequence: number;
    executionMode: SupportProcessExecutionMode | null;
    modalityLabel: string;
    targetObjectLabel: string | null;
    targetStateLabel: string | null;
    triggerLabel: string | null;
    nextEventLabel: string | null;
    dependencyLabel: string | null;
    operationalStatusLabel: null;
    attentionCount: null;
    dataStatus: "unavailable";
  }>;
  operationalDataBlocked: true;
} {
  const processItems = SUPPORT_PROCESS_DEFINITIONS.map((definition) => ({
    code: definition.code,
    label: definition.label,
    sequence: definition.sequence,
    executionMode: definition.executionMode as SupportProcessExecutionMode | null,
    modalityLabel:
      definition.executionMode === "manual" ? "MANUAL" : "PLATAFORMA",
    targetObjectLabel: definition.targetObjectLabel,
    targetStateLabel: definition.targetStateLabel,
    triggerLabel: definition.triggerLabel,
    nextEventLabel: definition.nextEventLabel,
    dependencyLabel: definition.dependencyLabel,
    operationalStatusLabel: null,
    attentionCount: null,
    dataStatus: "unavailable" as const,
  }));

  return {
    items: processItems,
    operationalDataBlocked: true,
  };
}
