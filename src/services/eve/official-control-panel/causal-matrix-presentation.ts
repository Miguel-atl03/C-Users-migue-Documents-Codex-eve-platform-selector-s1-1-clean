/**
 * Adaptador de presentación — Matriz Causal 20.
 * Códigos técnicos → etiqueta operativa. Sin traducción autorizada → No disponible.
 */

const ABSENT = "No disponible";

/** Traducciones mínimas autorizadas (Entrega B corrección overlay). */
export const CAUSAL_TECHNICAL_CODE_LABELS: Readonly<Record<string, string>> = {
  receiver_feedback_route_missing:
    "Falta cerrar la ruta de retroalimentación del receptor",
  blocked_by_missing_canonical_route:
    "Falta completar la ruta de evidencia requerida",
  deadlock_risk: "Riesgo de espera sin salida definida",
  needs_reentry_to_block_2: "Requiere volver al bloque de transformación",
  scene_frame_readiness: "Encuadre operativo incompleto",
  trigger_silence_risk: "Disparador insuficientemente definido",
  needs_manual_review: "Requiere revisión especializada",
  blocked_by_missing_evidence: "Falta evidencia canónica requerida",
  blocked_by_insufficient_evidence: "Evidencia insuficiente para cerrar",
  activity_variation_gap: "Falta aclarar la variación de la actividad",
  transformation_exception_route_unresolved:
    "Excepción de transformación sin ruta canónica",
  delivery_exception_gap: "Falta cerrar la excepción de entrega",
  hidden_change_gap: "Cambios ocultos sin cierre canónico",
  transformation_iteration_gap: "Ciclos de transformación sin régimen tipificado",
  secondary_receiver_gap: "Receptores secundarios sin cierre",
  iteration_mode_gap: "Modo de iteración sin tipificar",
  route_alternative_gap: "Rutas alternativas sin condición",
  real_vs_official_sequence_gap: "Secuencia real distinta de la oficial",
  residual_variety_gap: "Variedad residual sin destino",
  rework_evidence_gap: "Retrabajo sin evidencia canónica",
  missing_information_gap: "Información faltante sin respuesta",
  informal_rule_gap: "Regla informal sin autoridad tipificada",
  repetitive_failure_gap: "Falla repetitiva sin dueño esperado",
  interpersonal_compensation_gap: "Compensación interpersonal sin cierre",
  human_sacrifice_wear_gap: "Costo humano sin trazabilidad",
  needs_microconfirmation: "Requiere microconfirmación",
  activity_anchor_gap_flag: "Anclaje de actividad incompleto",
};

/**
 * Traduce un código técnico aislado.
 * Sin entrada en el mapa → No disponible.
 */
export function presentCausalTechnicalCode(code: string | null | undefined): string {
  const key = code?.trim() ?? "";
  if (!key) return ABSENT;
  return CAUSAL_TECHNICAL_CODE_LABELS[key] ?? ABSENT;
}

/**
 * Traduce una regla de bloqueo que puede contener varios códigos separados por / o ,.
 * Conserva fragmentos no técnicos (texto ya operativo).
 */
export function presentCausalBlockingRuleLabel(
  rule: string | null | undefined,
): string {
  const raw = rule?.trim() ?? "";
  if (!raw) return ABSENT;

  const parts = raw
    .split(/\s*\/\s*|\s*,\s*/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) return ABSENT;

  const translated = parts.map((part) => {
    const token = part.split(/\s+/)[0] ?? part;
    const looksTechnical = /^[a-z][a-z0-9_]*(?:\/[a-z0-9_]+)?$/i.test(token);
    if (looksTechnical && CAUSAL_TECHNICAL_CODE_LABELS[token]) {
      return CAUSAL_TECHNICAL_CODE_LABELS[token];
    }
    if (looksTechnical && /^[a-z][a-z0-9_]+$/i.test(part)) {
      return presentCausalTechnicalCode(part);
    }
    // Texto mixto: sustituir códigos conocidos dentro del fragmento
    let out = part;
    for (const [code, label] of Object.entries(CAUSAL_TECHNICAL_CODE_LABELS)) {
      if (out.includes(code)) {
        out = out.split(code).join(label);
      }
    }
    // Si quedó un código técnico puro sin traducción
    if (/^[a-z][a-z0-9_]+$/i.test(out) && !CAUSAL_TECHNICAL_CODE_LABELS[out]) {
      return ABSENT;
    }
    return out;
  });

  const useful = translated.filter((t) => t !== ABSENT);
  if (useful.length === 0) return ABSENT;
  return useful.join(" · ");
}

export function presentCausalClosureResultLabel(input: {
  factualClosureState: string | null;
  dataStatus: string;
}): string {
  if (input.dataStatus === "unavailable") return ABSENT;
  if (input.dataStatus === "conflict" && !input.factualClosureState) {
    return "Conflicto";
  }
  if (!input.factualClosureState) {
    return "No evaluada";
  }
  const closed = new Set([
    "answered_closed",
    "closed_by_confirmed_negative",
    "closed_not_applicable",
    "not_triggered_with_evidence",
  ]);
  if (closed.has(input.factualClosureState)) return "Cerrada";
  return "Abierta";
}

export function presentSelectionReasonStatusLabel(
  status: "available" | "unavailable" | "conflict",
): string | null {
  if (status === "conflict") {
    return "Existen decisiones de apertura contradictorias";
  }
  return null;
}
