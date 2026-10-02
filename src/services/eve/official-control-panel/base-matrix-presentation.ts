/**
 * Adaptador de presentación — Matriz Base 40.
 * Códigos técnicos → etiqueta operativa. Sin traducción → No disponible.
 * No usar snake_case como fallback visible.
 */

const ABSENT = "No disponible";

export const BASE_TECHNICAL_CODE_LABELS: Readonly<Record<string, string>> = {
  activity_name_user_confirmed: "Nombre de la actividad confirmado",
  semantic_confirmation_status: "Significado de la actividad confirmado",
  ai_inferred_unconfirmed: "Inferencia pendiente de confirmación",
  blocked_by_missing_evidence: "Bloqueo por falta de evidencia",
  blocked_by_missing_canonical_route: "Falta completar la ruta de evidencia requerida",
  blocked_by_insufficient_evidence: "Evidencia insuficiente para cerrar",
  activity_summary_literal: "Resumen literal de la actividad",
  actor_scope: "Alcance del actor",
  start_condition_hint: "Condición de inicio",
  end_result_hint: "Resultado de cierre",
  scene_macro_process: "Proceso contenedor de la escena",
  trigger_source: "Origen del disparador",
  trigger_channel: "Canal del disparador",
  trigger_type: "Tipo de disparador",
  trigger_clarity: "Claridad del disparador",
  trigger_frequency: "Frecuencia del disparador",
  trigger_pattern: "Patrón del disparador",
  trigger_preconditions: "Precondiciones del disparador",
  trigger_exception_exists: "Excepción de disparador",
  transformation_primary_dimensions: "Dimensiones principales de transformación",
  transformation_causality_action: "Acción causal de transformación",
  transformation_causality_trigger: "Disparador causal de transformación",
  transformation_state_initial: "Estado inicial",
  transformation_state_final: "Estado final",
  transformation_exception_exists: "Excepción de transformación",
  hidden_changes: "Cambios ocultos",
  output_object: "Objeto de salida",
  primary_receiver: "Receptor principal",
  receiver_type: "Tipo de receptor",
  quality_criteria: "Criterios de calidad",
  delivery_mechanism: "Mecanismo de entrega",
  delivery_exception_exists: "Excepción de entrega",
  skipped_silently: "Omitida en silencio (violación)",
  answered: "Respondida",
  open: "Abierta",
  closed: "Cerrada",
  reentry_required: "Requiere reentrada",
  manual_review_required: "Requiere revisión manual",
  route_missing: "Ruta canónica incompleta",
  contradiction_flag: "Contradicción detectada",
  needs_microconfirmation: "Requiere microconfirmación",
  deadlock_risk: "Riesgo de espera sin salida definida",
};

const TECHNICAL_TOKEN = /\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b/g;

/**
 * Traduce un código técnico aislado. Sin mapa → No disponible.
 */
export function presentBaseTechnicalCode(code: string | null | undefined): string {
  const key = code?.trim() ?? "";
  if (!key) return ABSENT;
  return BASE_TECHNICAL_CODE_LABELS[key] ?? ABSENT;
}

/**
 * Reescribe una frase de catálogo sustituyendo tokens snake_case
 * por etiquetas operativas autorizadas. Tokens sin mapa → No disponible.
 */
export function presentBaseCatalogPhrase(
  phrase: string | null | undefined,
): string {
  const raw = phrase?.trim() ?? "";
  if (!raw) return ABSENT;
  return raw.replace(TECHNICAL_TOKEN, (token) => {
    if (BASE_TECHNICAL_CODE_LABELS[token]) {
      return BASE_TECHNICAL_CODE_LABELS[token];
    }
    // Códigos causales tipo C01 no son snake_case técnico de variable.
    if (/^C\d{2}$/i.test(token)) return token;
    return ABSENT;
  });
}

export function presentBaseResolutionStateLabel(
  state: string | null | undefined,
  dataStatus: string,
): string {
  if (dataStatus === "unavailable") return ABSENT;
  if (!state) return "No evaluada";
  if (state === "skipped_silently") {
    return "Omitida en silencio (violación)";
  }
  return presentBaseTechnicalCode(state) !== ABSENT
    ? presentBaseTechnicalCode(state)
    : presentBaseCatalogPhrase(state);
}

/**
 * Detecta si un texto de UI aún expone identificadores técnicos dominantes.
 * Usado por pruebas de regresión.
 */
export function containsDominantTechnicalIdentifier(text: string): boolean {
  const matches = text.match(TECHNICAL_TOKEN) ?? [];
  return matches.some(
    (token) =>
      !BASE_TECHNICAL_CODE_LABELS[token] &&
      !/^C\d{2}$/i.test(token) &&
      !/^B\d/i.test(token),
  );
}
