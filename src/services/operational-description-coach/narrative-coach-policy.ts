import { OPERATIONAL_DESCRIPTION_NARRATIVE_FIELD_LABELS } from "@/features/significado/operational-description-canon";
import type {
  OperationalDescriptionContext,
  OperationalDescriptionScan,
} from "./types.ts";

export function normalizeComparableText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string) {
  return normalizeComparableText(text)
    .split(" ")
    .filter((token) => token.length > 2);
}

export function hasEstablishedActivityContext(
  context: OperationalDescriptionContext,
): boolean {
  const hasConfirmedStructure = Boolean(
    context.actionVerb?.trim() &&
      context.inputOrObject?.trim() &&
      context.outputOrResult?.trim(),
  );
  const hasRichActivityTitle = (context.activityTitle?.trim().length ?? 0) >= 48;
  return hasConfirmedStructure || hasRichActivityTitle;
}

export function truncateDraftSnippet(draft: string, maxLength = 52) {
  const trimmed = draft.trim().replace(/\s+/g, " ");
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}

export function shortenDeliverableLabel(label: string | undefined) {
  const trimmed = label?.trim();
  if (!trimmed) {
    return "el entregable listo";
  }

  const withoutTail = trimmed.split(/\s+con\s+/i)[0]?.trim() ?? trimmed;
  if (withoutTail.length <= 42) {
    return withoutTail;
  }

  return `${withoutTail.slice(0, 41).trimEnd()}…`;
}

export function exampleOverlapsActivitySource(
  example: string,
  context: OperationalDescriptionContext,
): boolean {
  const exampleTokens = new Set(tokenize(example));
  if (!exampleTokens.size) {
    return false;
  }

  const sourceTexts = [
    context.activityTitle,
    context.inputOrObject,
    context.procedureOrStandard,
    context.outputOrResult,
  ].filter(Boolean) as string[];

  for (const source of sourceTexts) {
    const sourceTokens = tokenize(source);
    if (!sourceTokens.length) {
      continue;
    }

    const overlap = sourceTokens.filter((token) => exampleTokens.has(token)).length;
    const overlapRatio = overlap / sourceTokens.length;
    if (overlapRatio >= 0.55 && overlap >= 4) {
      return true;
    }
  }

  return false;
}

export type NarrativeTailGap = "how" | "result" | "how_and_result";

export type NarrativeFieldGap =
  | "trigger"
  | "transform"
  | "transform_and_output"
  | "output"
  | "attenuation"
  | "handoff";

export const NARRATIVE_FIELD_LABELS = OPERATIONAL_DESCRIPTION_NARRATIVE_FIELD_LABELS;

function lowercaseFirst(value: string) {
  if (!value) return value;
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function combinedContextSource(context: OperationalDescriptionContext) {
  return [context.activityTitle, context.inputOrObject, context.procedureOrStandard]
    .filter(Boolean)
    .join(" ");
}

export function resolveNarrativeFieldGap(
  scan: OperationalDescriptionScan,
): NarrativeFieldGap {
  const { structuralParts, dimensions, sufficiency } = scan;

  if (sufficiency === "insufficient") {
    if (dimensions.trigger_input.status === "missing") {
      return "trigger";
    }
    if (!structuralParts.hasHow && !structuralParts.hasResult) {
      return "transform_and_output";
    }
    if (!structuralParts.hasHow) {
      return "transform";
    }
    if (!structuralParts.hasResult) {
      return "output";
    }
    return "transform_and_output";
  }

  if (
    dimensions.attenuation.status === "missing" ||
    dimensions.attenuation.status === "weak"
  ) {
    return "attenuation";
  }
  if (!structuralParts.hasResult) {
    return "output";
  }
  if (
    dimensions.handoff_output.status === "missing" ||
    dimensions.handoff_output.status === "weak"
  ) {
    return "handoff";
  }
  if (dimensions.trigger_input.status === "weak") {
    return "trigger";
  }

  return "handoff";
}

export function buildContextualFieldExample(
  gap: NarrativeFieldGap,
  context: OperationalDescriptionContext,
) {
  const deliverable = shortenDeliverableLabel(context.outputOrResult);
  const procedure = context.procedureOrStandard?.trim();
  const input =
    context.inputOrObject?.trim().replace(/^(la|el|los|las)\s+/i, "") ??
    "la información";
  const verb = context.actionVerb?.trim() || "Reviso";
  const source = combinedContextSource(context);
  const normalizedSource = normalizeComparableText(source);

  switch (gap) {
    case "trigger":
      if (/\boracle\b|\berp\b/.test(normalizedSource)) {
        return "cuando ya está disponible el cierre mensual en Oracle o en el ERP";
      }
      return "cuando ya tengo lo necesario para empezar este paso";
    case "transform":
      if (procedure) {
        return lowercaseFirst(procedure);
      }
      return `${verb.toLowerCase()} ${input}`;
    case "transform_and_output":
      if (procedure) {
        return `${lowercaseFirst(procedure)} y preparo ${deliverable}`;
      }
      return `${verb.toLowerCase()} ${input} y dejo listo ${deliverable}`;
    case "output":
      return `dejo listo ${deliverable}`;
    case "attenuation":
      if (/\bdesviacion\b|\bproyeccion\b|\bpresupuesto\b/.test(normalizedSource)) {
        return "priorizo las variaciones que requieren explicación y dejo fuera el ruido menor";
      }
      return "priorizo lo que necesita seguimiento y dejo fuera lo que no cambia la decisión";
    case "handoff":
      if (/\bdireccion\b|\bcomite\b|\bcontroller\b/.test(normalizedSource)) {
        return "y lo dejo listo para quien revisa esos números en el comité o control mensual";
      }
      return "y lo dejo listo para quien usa esos números en el siguiente control";
  }
}

export function buildFieldBasedNarrativeCoachMessage(
  draftText: string,
  context: OperationalDescriptionContext,
  scan: OperationalDescriptionScan,
): { message: string; exampleFragment: string | null } {
  const draftSnippet = truncateDraftSnippet(draftText.trim());
  const gap = resolveNarrativeFieldGap(scan);
  const exampleFragment = buildContextualFieldExample(gap, context);
  const hasTrigger = scan.dimensions.trigger_input.status !== "missing";

  switch (gap) {
    case "trigger":
      return {
        message: draftSnippet
          ? `Con «${draftSnippet}» vas encaminada. Falta dejar más claro ${NARRATIVE_FIELD_LABELS.trigger}.`
          : `Empieza contando ${NARRATIVE_FIELD_LABELS.trigger}.`,
        exampleFragment,
      };
    case "transform_and_output":
      if (hasTrigger && draftSnippet) {
        return {
          message: `Ya quedó claro ${NARRATIVE_FIELD_LABELS.trigger}. Sigue con ${NARRATIVE_FIELD_LABELS.transform} y ${NARRATIVE_FIELD_LABELS.output}.`,
          exampleFragment,
        };
      }
      return {
        message: draftSnippet
          ? `Con «${draftSnippet}», falta contar ${NARRATIVE_FIELD_LABELS.transform} y ${NARRATIVE_FIELD_LABELS.output}.`
          : `Cuéntanos ${NARRATIVE_FIELD_LABELS.transform} y ${NARRATIVE_FIELD_LABELS.output}.`,
        exampleFragment,
      };
    case "transform":
      return {
        message: draftSnippet
          ? `Con «${draftSnippet}» ya se entiende el inicio. Falta ${NARRATIVE_FIELD_LABELS.transform}.`
          : `Falta contar ${NARRATIVE_FIELD_LABELS.transform}.`,
        exampleFragment,
      };
    case "output":
      return {
        message: draftSnippet
          ? `Con «${draftSnippet}» ya se entiende el proceso. Falta ${NARRATIVE_FIELD_LABELS.output}.`
          : `Falta dejar claro ${NARRATIVE_FIELD_LABELS.output}.`,
        exampleFragment,
      };
    case "attenuation":
      return {
        message: `Si aplica en tu caso, menciona ${NARRATIVE_FIELD_LABELS.attenuation}.`,
        exampleFragment,
      };
    case "handoff":
      return {
        message: `Para cerrar el recorrido, indica ${NARRATIVE_FIELD_LABELS.handoff}.`,
        exampleFragment,
      };
  }
}

export function buildNarrativeTailExample(
  gap: NarrativeTailGap,
  context: OperationalDescriptionContext,
) {
  const deliverable = shortenDeliverableLabel(context.outputOrResult);

  switch (gap) {
    case "how":
      return "reviso los números con el criterio que usas y veo si cuadran";
    case "result":
      return `y al terminar dejo listo ${deliverable}`;
    case "how_and_result":
    default:
      return `reviso las diferencias y dejo listo ${deliverable}`;
  }
}
