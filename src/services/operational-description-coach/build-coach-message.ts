import { BANNED_AMBIGUOUS_PHRASES } from "@/services/local-work-map-activity-validation";
import { buildCyberneticTrincheraFallbackMessage } from "./cybernetic-coach-fallback";
import {
  buildContextualFieldExample,
  buildFieldBasedNarrativeCoachMessage,
  exampleOverlapsActivitySource,
  hasEstablishedActivityContext,
  NARRATIVE_FIELD_LABELS,
} from "./narrative-coach-policy";
import type {
  OperationalDescriptionContext,
  OperationalDescriptionScan,
  OperationalDimension,
} from "./types";

function containsBannedPhrase(text: string) {
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return BANNED_AMBIGUOUS_PHRASES.some((phrase) => normalized.includes(phrase));
}

function pickContextLabel(context: OperationalDescriptionContext) {
  return (
    context.inputOrObject?.trim() ||
    context.activityTitle?.trim() ||
    "esta actividad"
  );
}

function pickResultLabel(context: OperationalDescriptionContext) {
  return context.outputOrResult?.trim() || "el resultado que dejas listo";
}

function pickActionLabel(
  context: OperationalDescriptionContext,
  scan: OperationalDescriptionScan,
) {
  return (
    context.actionVerb?.trim() ||
    scan.structuralParts.action?.trim() ||
    "haces"
  );
}

function buildStructuralTransformationMessage(
  context: OperationalDescriptionContext,
  scan: OperationalDescriptionScan,
): { message: string; exampleFragment: string | null } {
  const { structuralParts } = scan;
  const objectLabel = pickContextLabel(context);

  if (!structuralParts.hasAction) {
    return {
      message:
        "Empieza diciendo qué haces tú en esta actividad, con un verbo concreto.",
      exampleFragment: `Analizo ${objectLabel.replace(/^(la|el|los|las)\s+/i, "")}`,
    };
  }

  if (!structuralParts.hasObject) {
    return {
      message: "Falta dejar claro sobre qué trabajas o qué parte del trabajo tocas.",
      exampleFragment: `${pickActionLabel(context, scan)} ${objectLabel}`,
    };
  }

  if (!structuralParts.hasHow && !structuralParts.hasResult) {
    return {
      message:
        "Ya se entiende la acción y el objeto. Ahora falta cómo lo haces y qué queda listo al terminar.",
      exampleFragment: `${pickActionLabel(context, scan)} ${objectLabel} comparando la información clave para generar ${pickResultLabel(context)}`,
    };
  }

  if (!structuralParts.hasHow) {
    return {
      message: "Falta explicar cómo lo haces o bajo qué regla o criterio lo haces.",
      exampleFragment:
        context.procedureOrStandard?.trim() ||
        `${pickActionLabel(context, scan)} ${objectLabel} siguiendo el criterio que usas en el día a día`,
    };
  }

  return {
    message: "Falta dejar claro qué queda listo o entregado cuando terminas.",
    exampleFragment: `dejando listo ${pickResultLabel(context)}`,
  };
}

function buildTransformationCoreMessage(
  draftText: string,
  context: OperationalDescriptionContext,
  scan: OperationalDescriptionScan,
): { message: string; exampleFragment: string | null } {
  if (hasEstablishedActivityContext(context)) {
    return buildFieldBasedNarrativeCoachMessage(draftText, context, scan);
  }

  return buildStructuralTransformationMessage(context, scan);
}

function buildTriggerMessage(
  draftText: string,
  context: OperationalDescriptionContext,
  scan: OperationalDescriptionScan,
): { message: string; exampleFragment: string | null } {
  if (hasEstablishedActivityContext(context)) {
    return {
      message: `Si quieres afinar, precisa ${NARRATIVE_FIELD_LABELS.trigger}.`,
      exampleFragment: buildContextualFieldExample("trigger", context),
    };
  }

  const objectLabel = pickContextLabel(context);
  return {
    message:
      "Podrías aclarar qué evento o situación dispara esta actividad en tu día a día.",
    exampleFragment: `Cuando ya está disponible ${objectLabel}, ${pickActionLabel(context, scan).toLowerCase()} la revisión`,
  };
}

function buildHandoffMessage(
  context: OperationalDescriptionContext,
): { message: string; exampleFragment: string | null } {
  if (hasEstablishedActivityContext(context)) {
    return {
      message: `Para cerrar el recorrido, indica ${NARRATIVE_FIELD_LABELS.handoff}.`,
      exampleFragment: buildContextualFieldExample("handoff", context),
    };
  }

  const resultLabel = pickResultLabel(context);
  return {
    message:
      "Ayuda contar quién recibe el resultado y en qué estado queda cuando terminas.",
    exampleFragment: `Entrego ${resultLabel} al área que lo necesita para continuar el proceso`,
  };
}

function buildStandardMessage(
  context: OperationalDescriptionContext,
): { message: string; exampleFragment: string | null } {
  if (hasEstablishedActivityContext(context)) {
    return {
      message:
        "Si hay una regla o criterio que guía este paso, puedes mencionarlo brevemente en tus palabras.",
      exampleFragment: "siguiendo el criterio que usamos para validar la información",
    };
  }

  return {
    message:
      "Si aplicas una regla, criterio o estándar concreto, conviene mencionarlo en tus palabras.",
    exampleFragment:
      context.procedureOrStandard?.trim() ||
      "siguiendo el criterio que usas para validar la información",
  };
}

function buildAttenuationMessage(
  context: OperationalDescriptionContext,
): { message: string; exampleFragment: string | null } {
  if (hasEstablishedActivityContext(context)) {
    return {
      message: `Si aplica en tu caso, menciona ${NARRATIVE_FIELD_LABELS.attenuation}.`,
      exampleFragment: buildContextualFieldExample("attenuation", context),
    };
  }

  const objectLabel = pickContextLabel(context);
  return {
    message:
      "Si descartas, devuelves o filtras algo antes de seguir, eso también forma parte de cómo ocurre la actividad.",
    exampleFragment: `Si ${objectLabel} no cumple lo necesario, lo devuelvo para corrección antes de seguir`,
  };
}

function buildEscalationMessage(): { message: string; exampleFragment: string | null } {
  return {
    message:
      "Si hay un punto en el que ya no decides tú y necesitas escalar o alertar, también vale la pena mencionarlo.",
    exampleFragment:
      "Si la desviación supera el umbral que manejamos, interrumpo y aviso al responsable",
  };
}

function buildMessageForGap(
  gap: OperationalDimension,
  draftText: string,
  context: OperationalDescriptionContext,
  scan: OperationalDescriptionScan,
): { message: string; exampleFragment: string | null } {
  switch (gap) {
    case "transformation_core":
      return buildTransformationCoreMessage(draftText, context, scan);
    case "trigger_input":
      return buildTriggerMessage(draftText, context, scan);
    case "handoff_output":
      return buildHandoffMessage(context);
    case "standard_or_rule":
      return buildStandardMessage(context);
    case "attenuation":
      return buildAttenuationMessage(context);
    case "escalation":
      return buildEscalationMessage();
    default:
      return { message: "", exampleFragment: null };
  }
}

function overlapContext(context: OperationalDescriptionContext) {
  if (hasEstablishedActivityContext(context)) {
    return { activityTitle: context.activityTitle };
  }
  return context;
}

function formatCoachOutput(
  message: string,
  exampleFragment: string | null,
  context: OperationalDescriptionContext,
): string {
  if (!exampleFragment?.trim() || containsBannedPhrase(exampleFragment)) {
    return message;
  }

  if (exampleOverlapsActivitySource(exampleFragment, overlapContext(context))) {
    return message;
  }

  return `${message} Por ejemplo: «${exampleFragment.trim()}».`;
}

export function formatOperationalCoachOutput(
  message: string,
  exampleFragment: string | null,
  context: OperationalDescriptionContext,
): string {
  return formatCoachOutput(message, exampleFragment, context);
}

export function buildOperationalDescriptionCoachMessage(
  scan: OperationalDescriptionScan,
  context: OperationalDescriptionContext = {},
  draftText = "",
): { message: string | null; exampleFragment: string | null } {
  if (hasEstablishedActivityContext(context)) {
    const fallback = buildCyberneticTrincheraFallbackMessage(scan, draftText);
    return {
      message: fallback.message,
      exampleFragment: null,
    };
  }

  if (scan.coachTier === "silent") {
    return { message: null, exampleFragment: null };
  }

  if (!scan.priorityGap) {
    return { message: null, exampleFragment: null };
  }

  const { message, exampleFragment } = buildMessageForGap(
    scan.priorityGap,
    draftText,
    context,
    scan,
  );

  if (!message.trim()) {
    return { message: null, exampleFragment: null };
  }

  return {
    message: formatCoachOutput(message, exampleFragment, context),
    exampleFragment,
  };
}
