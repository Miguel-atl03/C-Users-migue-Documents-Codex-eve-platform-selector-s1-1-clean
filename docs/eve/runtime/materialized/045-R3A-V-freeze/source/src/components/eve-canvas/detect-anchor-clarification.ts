/**
 * Detección de micro-aclaraciones del punto 04 (Significado / Bloque 0).
 * UX: franja de precisión con formato trinchera.
 * Señales: heurísticas locales + scan del coach de descripción operativa (Día a día).
 *
 * Mapeo informacional al anexo:
 * - genericidad ≈ 0.A
 * - frontera ≈ 0.B
 * - escala ≈ 0.C
 * - estructura ≈ 0.D
 */

import { BANNED_AMBIGUOUS_PHRASES } from "@/services/work-map-activity-validation";
import { scanOperationalDescription } from "@/services/operational-description-coach/scan-operational-description";

export type AnchorClarificationKind =
  | "genericidad"
  | "frontera"
  | "escala"
  | "estructura"
  | null;

export type AnchorClarificationFields = {
  actionVerb: string;
  objectText: string;
  criterion: string;
  outputText: string;
  summary: string;
  startHint: string;
  endHint: string;
};

const GENERIC_ACTION_HINTS = [
  "gestionar",
  "apoyar",
  "apoyo",
  "revisar",
  "coordinar",
  "dar seguimiento",
  "seguimiento",
  "administrar",
  "manejar",
  "soportar",
  "ayudar",
];

const WEAK_CRITERION_HINTS = [
  "criterio habitual",
  "como siempre",
  "normal",
  "lo de siempre",
  "segun corresponda",
  "según corresponda",
  "estandar",
  "estándar",
];

const WEAK_OUTPUT_HINTS = [
  "el resultado",
  "resultado listo",
  "queda listo",
  "lo necesario",
  "el entregable",
];

const MACRO_SCALE_HINTS = [
  "todo el proceso",
  "toda la operacion",
  "toda la operación",
  "varios procesos",
  "multiples areas",
  "múltiples áreas",
  "y tambien",
  "y también",
  "ademas de",
  "además de",
  "gestionar el area",
  "gestionar el área",
  "de punta a punta la empresa",
];

const MICRO_SCALE_HINTS = [
  "doy clic",
  "doy click",
  "abro el excel",
  "lleno el campo",
  "marco el check",
  "solo doy enter",
];

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function looksGenericAction(actionVerb: string) {
  const action = normalize(actionVerb);
  if (!action) return false;

  return GENERIC_ACTION_HINTS.some(
    (hint) => action === normalize(hint) || action.startsWith(`${normalize(hint)} `),
  );
}

function looksAmbiguousPhrase(actionVerb: string, objectText: string) {
  const blob = normalize(`${actionVerb} ${objectText}`);
  return BANNED_AMBIGUOUS_PHRASES.some((phrase) => blob.includes(normalize(phrase)));
}

function looksWeakStructure(fields: AnchorClarificationFields) {
  const object = normalize(fields.objectText);
  const criterion = normalize(fields.criterion);
  const output = normalize(fields.outputText);

  const objectTooThin = object.length > 0 && object.split(" ").length <= 2 && object.length < 18;
  const criterionWeak =
    criterion.length > 0 &&
    (criterion.split(" ").length <= 3 ||
      WEAK_CRITERION_HINTS.some((hint) => criterion.includes(normalize(hint))));
  const outputWeak =
    output.length > 0 &&
    WEAK_OUTPUT_HINTS.some((hint) => output === normalize(hint) || output.includes(normalize(hint)));

  if (objectTooThin && (criterionWeak || outputWeak)) {
    return true;
  }

  if (criterionWeak && outputWeak) {
    return true;
  }

  // Solo usar el scan de Día a día si el detalle ya viene débil;
  // un resumen macro/micro no debe colapsar a 0.D (eso es escala).
  const summary = fields.summary.trim();
  if (
    summary.length >= 24 &&
    (objectTooThin || criterionWeak || outputWeak)
  ) {
    const scan = scanOperationalDescription(summary);
    if (
      scan.sufficiency === "insufficient" &&
      (!scan.structuralParts.hasObject || !scan.structuralParts.hasResult)
    ) {
      return true;
    }
  }

  return false;
}

function looksBrokenBoundary(startHint: string, endHint: string) {
  const start = normalize(startHint);
  const end = normalize(endHint);
  if (!start || !end) return false;

  if (start === end) return true;

  // Misma raíz semántica: uno contiene al otro con poca diferencia
  if (start.length >= 12 && end.length >= 12) {
    if (start.includes(end) || end.includes(start)) {
      return true;
    }
  }

  const startHasTrigger = /\b(cuando|al |una vez|si |llega|recibo|tengo)\b/.test(start);
  const endHasClosure = /\b(queda|listo|termino|entrego|envio|dejo|cierro|marco)\b/.test(end);
  if (!startHasTrigger && !endHasClosure && start.split(" ").length <= 4 && end.split(" ").length <= 4) {
    return true;
  }

  return false;
}

function looksScaleProblem(fields: AnchorClarificationFields) {
  const summary = normalize(fields.summary);
  const object = normalize(fields.objectText);
  const blob = `${summary} ${object} ${normalize(fields.actionVerb)}`;

  if (MACRO_SCALE_HINTS.some((hint) => blob.includes(normalize(hint)))) {
    return true;
  }

  if (MICRO_SCALE_HINTS.some((hint) => blob.includes(normalize(hint)))) {
    return true;
  }

  // Macro por acumulación: muchos "y" en un resumen corto de verbo genérico
  const andCount = (summary.match(/\by\b/g) ?? []).length;
  if (summary.length > 40 && andCount >= 3 && looksGenericAction(fields.actionVerb)) {
    return true;
  }

  // Micro: resumen demasiado corto frente a un objeto amplio
  if (
    summary.length > 0 &&
    summary.length < 36 &&
    object.split(" ").length >= 6 &&
    !looksGenericAction(fields.actionVerb)
  ) {
    return true;
  }

  return false;
}

/**
 * Prioridad (una sola tensión):
 * 1. estructura (0.D) — piezas débiles
 * 2. frontera (0.B) — inicio/cierre mezclados
 * 3. genericidad (0.A) — actividad amplia / verbo genérico
 * 4. escala (0.C) — demasiado grande o chica
 */
export function detectAnchorClarification(
  fields: AnchorClarificationFields,
): AnchorClarificationKind {
  if (looksWeakStructure(fields)) {
    return "estructura";
  }

  if (looksBrokenBoundary(fields.startHint, fields.endHint)) {
    return "frontera";
  }

  if (looksGenericAction(fields.actionVerb) || looksAmbiguousPhrase(fields.actionVerb, fields.objectText)) {
    return "genericidad";
  }

  if (looksScaleProblem(fields)) {
    return "escala";
  }

  return null;
}
