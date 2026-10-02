/**
 * Adaptador de presentación §§7–9: nombres técnicos → lenguaje operativo de panel.
 * Los contratos internos / catálogos conservan los identificadores crudos.
 */

export const OPERATIONAL_UNAVAILABLE_LABEL = "No disponible";

/** Compuestos Object [State] o nombres de objeto/estado sueltos. */
const OPERATIONAL_OBJECT_STATE_LABELS: Readonly<Record<string, string>> = {
  "CasoDiagnosticoEVE [InDiagnosticProduction]":
    "Caso en producción diagnóstica",
  "CasoDiagnosticoEVE [WithSceneCanonicalRecord]":
    "Caso con escena operativa consolidada",
  "SceneCanonicalRecord [Consolidated]": "Escena operativa consolidada",
  "EvidenceBundle [ReadyForTransduction]":
    "Evidencia preparada para análisis causal",
  "EscenaEvidencial [Validated]": "Escena evidencial validada",
  "PeliculaCausalAgregada [Aggregated]": "Película causal integrada",
  "DiagnosticoExpertoFinal [Delivered]": "Diagnóstico experto entregado",
};

const OPERATIONAL_TIMER_POLICY_LABELS: Readonly<Record<string, string>> = {
  max_tiempo_scene_record_consolidated:
    "Tiempo máximo para consolidar la escena",
  max_tiempo_evidence_bundle_ready:
    "Tiempo máximo para preparar la evidencia",
  max_tiempo_escena_evidencial_validated:
    "Tiempo máximo para validar la escena evidencial",
  max_tiempo_pelicula_causal_aggregated:
    "Tiempo máximo para integrar la película causal",
  max_tiempo_diagnostico_final_delivered:
    "Tiempo máximo para entregar el diagnóstico experto",
  max_tiempo_confirmacion_cierre: "Tiempo máximo para confirmar el cierre",
};

const TECHNICAL_OBJECT_PREFIX =
  /^(CasoDiagnosticoEVE|SceneCanonicalRecord|EvidenceBundle|EscenaEvidencial|PeliculaCausalAgregada|DiagnosticoExpertoFinal|InventarioMMABP|ArchitectureConsistencyAssessment|ExportCodePackage)\b/;

function normalizeCompoundKey(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function looksTechnicalCompound(value: string): boolean {
  return (
    TECHNICAL_OBJECT_PREFIX.test(value) ||
    /\[[A-Za-z0-9_*]+\]/.test(value) ||
    value.startsWith("max_tiempo_")
  );
}

/**
 * Traduce un compuesto técnico `Object [State]` o un evento esperado.
 * Sin traducción autorizada de un término técnico → "No disponible" (nunca el crudo).
 * Texto ya operativo (sin patrón técnico) se conserva.
 */
export function presentOperationalCompoundLabel(
  technical: string | null | undefined,
): string {
  if (technical == null || technical.trim() === "") {
    return OPERATIONAL_UNAVAILABLE_LABEL;
  }
  const key = normalizeCompoundKey(technical);
  if (OPERATIONAL_OBJECT_STATE_LABELS[key]) {
    return OPERATIONAL_OBJECT_STATE_LABELS[key];
  }
  if (looksTechnicalCompound(key)) {
    return OPERATIONAL_UNAVAILABLE_LABEL;
  }
  return key;
}

/**
 * Traduce objeto + estado de proceso de soporte a etiqueta operativa.
 */
export function presentOperationalTargetObjectState(
  objectLabel: string | null | undefined,
  stateLabel: string | null | undefined,
): string {
  if (!objectLabel && !stateLabel) {
    return OPERATIONAL_UNAVAILABLE_LABEL;
  }
  if (objectLabel && stateLabel) {
    return presentOperationalCompoundLabel(`${objectLabel} [${stateLabel}]`);
  }
  return OPERATIONAL_UNAVAILABLE_LABEL;
}

/**
 * Traduce códigos de timer (`max_tiempo_*`) a límite de espera operativo.
 */
export function presentOperationalTimerPolicyLabel(
  timerPolicyName: string | null | undefined,
): string {
  if (timerPolicyName == null || timerPolicyName.trim() === "") {
    return OPERATIONAL_UNAVAILABLE_LABEL;
  }
  const key = timerPolicyName.trim();
  return OPERATIONAL_TIMER_POLICY_LABELS[key] ?? OPERATIONAL_UNAVAILABLE_LABEL;
}

/** Sustituciones de tokens técnicos que aparecen embebidos en prosa de panel. */
const OPERATIONAL_TOKEN_REPLACEMENTS: ReadonlyArray<readonly [RegExp, string]> =
  [
    [/CasoDiagnosticoEVE/g, "caso"],
    [/SceneCanonicalRecord/g, "escena operativa"],
    [/EvidenceBundle/g, "evidencia"],
    [/EscenaEvidencial/g, "escena evidencial"],
    [/PeliculaCausalAgregada/g, "película causal"],
    [/DiagnosticoExpertoFinal/g, "diagnóstico experto"],
    [/ReadyForTransduction/g, "lista para análisis causal"],
    [/InventarioMMABP/g, "inventario operativo"],
    [/ArchitectureConsistencyAssessment/g, "evaluación de consistencia"],
    [/ExportCodePackage/g, "paquete de exportación"],
    [/max_tiempo_[a-z0-9_]+/g, OPERATIONAL_UNAVAILABLE_LABEL],
  ];

/**
 * Sanitiza prosa visible (p. ej. etiquetas de proceso) sin alterar catálogos.
 * Nunca deja tokens técnicos listados como fallback.
 */
export function presentOperationalVisibleProse(
  text: string | null | undefined,
): string {
  if (text == null || text.trim() === "") {
    return OPERATIONAL_UNAVAILABLE_LABEL;
  }
  let out = text;
  for (const [tech, operational] of Object.entries(
    OPERATIONAL_OBJECT_STATE_LABELS,
  )) {
    out = out.split(tech).join(operational);
  }
  for (const [pattern, replacement] of OPERATIONAL_TOKEN_REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}
