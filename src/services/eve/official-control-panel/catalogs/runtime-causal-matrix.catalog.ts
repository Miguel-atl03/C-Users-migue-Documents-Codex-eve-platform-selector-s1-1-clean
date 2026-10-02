/**
 * Catálogo de presentación Matriz Causal 20 — complemento v1.1.
 * Orden C01→C20. Prioridad no altera el orden de filas.
 */

export type RuntimeCausalPriority = "P0" | "P1" | "P2" | "P3";

export type RuntimeCausalCatalogEntry = {
  id: string;
  priority: RuntimeCausalPriority;
  /** Llave compuesta P0-C05 … */
  priorityClassKey: string;
  classLabel: string;
  activationRule: string;
  mandatoryClosureRule: string;
  failureBlockRule: string;
  blocksFullReadiness: boolean;
};

function entry(
  id: string,
  priority: RuntimeCausalPriority,
  classLabel: string,
  activationRule: string,
  mandatoryClosureRule: string,
  failureBlockRule: string,
  blocksFullReadiness: boolean,
): RuntimeCausalCatalogEntry {
  return {
    id,
    priority,
    priorityClassKey: `${priority}-${id}`,
    classLabel,
    activationRule,
    mandatoryClosureRule,
    failureBlockRule,
    blocksFullReadiness,
  };
}

export const RUNTIME_CAUSAL_MATRIX_CATALOG: readonly RuntimeCausalCatalogEntry[] =
  [
    entry("C01", "P3", "P3 — anclaje", "B0-Q03 variable o B0-Q02/B0-Q04 actividad no estable.", "causa de variación y caso especial", "activity_variation_gap / reentry B0", false),
    entry("C02", "P1", "P1 — encuadre PM", "Beneficio/daño/hito ambiguo o asimétrico.", "distribución valor/daño e hito real", "scene_frame_readiness flag / reentry B0.5", false),
    entry("C03", "P1", "P1 — disparador PM/PF", "B1-Q09 ambigüedad o B1-Q11 excepción de inicio.", "señal dominante, excepción y primer síntoma", "trigger_silence_risk / reentry B1", false),
    entry("C04", "P1", "P1 — MoC/OLC→B5", "B2-Q12 mezcla dimensiones o B5 no puede medir capacidad.", "dimensión dominante y ranking si triple dimensión", "needs_reentry_to_block_2 / no medir B5", false),
    entry("C05", "P0", "P0 — ruta crítica CR-B2", "B2-Q17 activa transformation_exception_exists.", "transformation_exception_type + description", "transformation_exception_route_unresolved / blocked_by_missing_canonical_route", true),
    entry("C06", "P3", "P3 — MoC/OLC/PF", "B2-Q17 detecta hidden_changes.", "cambios ocultos, quién los hace y dónde", "hidden_change_gap / reentry B2", false),
    entry("C07", "P3", "P3 — OLC/PF", "B2-Q16 múltiples ciclos.", "conteo/régimen típico de ciclos", "transformation_iteration_gap", false),
    entry("C08", "P1", "P1 — handoff PF", "B3-Q21 sí o B3-Q22 correcciones/rechazos.", "delivery_exception_type + impact", "delivery_exception_gap / reentry B3", false),
    entry("C09", "P0", "P0 — ruta crítica CR-B3", "B3-Q21/B3-Q22 indican falla, ajuste o señal operativa.", "receiver_feedback_exists + receiver_feedback + gap flags", "receiver_feedback_route_missing / blocked_by_missing_canonical_route", true),
    entry("C10", "P3", "P3 — handoff/MoC", "B3-Q18/B3-Q19 múltiples usuarios/accesos/impactos.", "receptores secundarios o descarte de multiplicidad", "secondary_receiver_gap", false),
    entry("C11", "P0", "P0 — Process State/Timer", "B4-Q24 bloqueo, espera sin evento o deadlock.", "deadlock_resolution + awaited_event + release_condition + timer/timeout + resolver + exit_path", "deadlock_risk / Process State bloqueado / reentry B4", true),
    entry("C12", "P3", "P3 — flujo PF", "B4-Q25 repetición.", "iteration_batching_mode", "iteration_mode_gap", false),
    entry("C13", "P1", "P1 — estructural PF/OLC", "B4-Q26 rutas alternativas.", "cantidad de caminos y condición de cada ruta", "route_alternative_gap / no modelar gateway sin condición", false),
    entry("C14", "P1", "P1 — flujo real PF", "B4-Q27/B4-Q28 hidden_subprocess o cambio de secuencia.", "razón de pasos extra/cambio de orden y caso común", "real_vs_official_sequence_gap / reentry B4", false),
    entry("C15", "P1", "P1 — VSM/resource bargain", "B5-Q29 brecha o B5-Q33 no absorción/bargain bajo.", "destino de variedad residual y cambio requerido", "residual_variety_gap / ready_with_flags o reentry B5", false),
    entry("C16", "P2", "P2 — PF/OLC/AHE prep", "B6-Q35 = sí.", "qué regresa, cuándo ocurre y quién debía hacerlo bien", "rework_evidence_gap / AHE-PF débil", false),
    entry("C17", "P2", "P2 — VSM/AHE prep", "B6-Q36 falta información o regla informal.", "respuesta ante carencia y autoridad/regla informal", "missing_information_gap / informal_rule_gap", false),
    entry("C18", "P2", "P2 — AHE prep", "B6-Q37 sacrificio, desgaste o costo alto.", "duración, conocimiento organizacional y reconocimiento", "human_sacrifice/wear_gap / AHE insuficiente", false),
    entry("C19", "P2", "P2 — AHE/VSM prep", "B6-Q38 patrón repetitivo, variedad residual o compensación interpersonal.", "circunstancias, recurrencia, intentos, dueño esperado y efecto interpersonal", "repetitive_failure_gap / interpersonal_compensation_gap", false),
    entry("C20", "P0", "P0 — frontera CR-B7", "Baja confianza, señales cruzadas o necesidad de corrección.", "corrección o manual_review/reentry sin diagnóstico", "needs_manual_review / blocked_by_insufficient_evidence", true),
  ] as const;

export function getRuntimeCausalCatalogEntry(
  id: string,
): RuntimeCausalCatalogEntry | null {
  return RUNTIME_CAUSAL_MATRIX_CATALOG.find((row) => row.id === id) ?? null;
}
