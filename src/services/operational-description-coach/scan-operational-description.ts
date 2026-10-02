import { detectActivityParts } from "@/services/local-work-map-activity-validation";
import type {
  DimensionStatus,
  OperationalDescriptionScan,
  OperationalDimension,
  OperationalSufficiency,
  CoachTier,
} from "./types.ts";

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const TRIGGER_PATTERN =
  /\b(cuando|al recibir|al llegar|empiezo cuando|se activa cuando|una vez que|al detectar|si llega)\b/;
const HANDOFF_PATTERN =
  /\b(entrego|envio a|pasa a|para que|al area de|al departamento|al equipo de|queda listo para|estado validado|estado finalizado|mediante la plataforma)\b/;
const STANDARD_PATTERN =
  /\b(según|conforme a|bajo criterio|aplicando|de acuerdo con|siguiendo el|usando el catalogo|con base en)\b/;
const ATTENUATION_PATTERN =
  /\b(rechazo|descarto|filtro|priorizo|devuelvo|no cumple|descarto los|solo atiendo)\b/;
const ESCALATION_PATTERN =
  /\b(escalo|interrumpo|alerto|supera el|si supera|si no cumple|requiere intervencion)\b/;

function detectDimensionStatus(
  normalized: string,
  pattern: RegExp,
  minLength = 0,
): DimensionStatus {
  if (!normalized.trim()) {
    return "missing";
  }
  if (pattern.test(normalized)) {
    return "present";
  }
  if (normalized.length >= minLength) {
    return "weak";
  }
  return "missing";
}

function assessTransformationCore(
  parts: ReturnType<typeof detectActivityParts>,
): DimensionStatus {
  const coreCount = [
    parts.hasAction,
    parts.hasObject,
    parts.hasHow,
    parts.hasResult,
  ].filter(Boolean).length;

  if (coreCount >= 4) {
    return "present";
  }
  if (coreCount >= 2) {
    return "weak";
  }
  return "missing";
}

function resolveSufficiency(
  parts: ReturnType<typeof detectActivityParts>,
  dimensions: OperationalDescriptionScan["dimensions"],
): OperationalSufficiency {
  const hasCore =
    parts.hasAction && parts.hasObject && (parts.hasHow || parts.hasResult);

  if (!parts.hasAction && !parts.hasObject && !parts.hasHow && !parts.hasResult) {
    return "empty";
  }

  if (!hasCore) {
    return "insufficient";
  }

  const advancedPresent = [
    dimensions.trigger_input.status,
    dimensions.handoff_output.status,
    dimensions.standard_or_rule.status,
    dimensions.attenuation.status,
    dimensions.escalation.status,
  ].filter((status) => status === "present").length;

  if (advancedPresent >= 2) {
    return "mastery";
  }

  return "operational";
}

const GAP_PRIORITY: OperationalDimension[] = [
  "transformation_core",
  "trigger_input",
  "attenuation",
  "standard_or_rule",
  "handoff_output",
  "escalation",
];

function resolvePriorityGap(
  parts: ReturnType<typeof detectActivityParts>,
  dimensions: OperationalDescriptionScan["dimensions"],
  sufficiency: OperationalSufficiency,
): OperationalDimension | null {
  if (sufficiency === "empty" || sufficiency === "mastery") {
    return null;
  }

  if (sufficiency === "insufficient") {
    if (!parts.hasAction) {
      return "transformation_core";
    }
    if (!parts.hasObject) {
      return "transformation_core";
    }
    if (!parts.hasHow && !parts.hasResult) {
      return "transformation_core";
    }
    if (!parts.hasHow || !parts.hasResult) {
      return "transformation_core";
    }
    return "transformation_core";
  }

  for (const dimension of GAP_PRIORITY) {
    if (dimension === "transformation_core") {
      continue;
    }
    const status = dimensions[dimension].status;
    if (status === "missing" || status === "weak") {
      return dimension;
    }
  }

  return null;
}

function resolveCoachTier(
  sufficiency: OperationalSufficiency,
  priorityGap: OperationalDimension | null,
): CoachTier {
  if (!priorityGap || sufficiency === "empty" || sufficiency === "mastery") {
    return "silent";
  }
  if (sufficiency === "insufficient") {
    return "hint";
  }
  return "nudge";
}

export function scanOperationalDescription(text: string): OperationalDescriptionScan {
  const trimmed = text.trim();
  const normalized = normalizeText(trimmed);
  const structuralParts = detectActivityParts(trimmed);

  const dimensions: OperationalDescriptionScan["dimensions"] = {
    transformation_core: {
      status: assessTransformationCore(structuralParts),
    },
    trigger_input: {
      status: detectDimensionStatus(normalized, TRIGGER_PATTERN, 24),
    },
    handoff_output: {
      status: detectDimensionStatus(normalized, HANDOFF_PATTERN, 24),
    },
    standard_or_rule: {
      status: detectDimensionStatus(normalized, STANDARD_PATTERN, 20),
    },
    attenuation: {
      status: detectDimensionStatus(normalized, ATTENUATION_PATTERN, 28),
    },
    escalation: {
      status: detectDimensionStatus(normalized, ESCALATION_PATTERN, 28),
    },
  };

  const sufficiency = resolveSufficiency(structuralParts, dimensions);
  const priorityGap = resolvePriorityGap(structuralParts, dimensions, sufficiency);
  const coachTier = resolveCoachTier(sufficiency, priorityGap);

  return {
    structuralParts,
    dimensions,
    sufficiency,
    priorityGap,
    coachTier,
  };
}
