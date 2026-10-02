import {
  OPERATIONAL_DESCRIPTION_PATH_STEPS,
  OPERATIONAL_DESCRIPTION_UI,
} from "@/features/significado/operational-description-canon";
import {
  shortenDeliverableLabel,
  truncateDraftSnippet,
} from "./narrative-coach-policy.ts";
import type {
  OperationalDescriptionContext,
  OperationalDescriptionExampleBeat,
  OperationalDescriptionIntroGuide,
} from "./types.ts";

const INTRO_PATH_STEPS = OPERATIONAL_DESCRIPTION_PATH_STEPS.map((step) => ({
  id: step.id,
  label: step.label,
  shortLabel: step.shortLabel,
  hint: step.hint,
}));

function combinedContextText(context: OperationalDescriptionContext) {
  return [
    context.activityTitle,
    context.inputOrObject,
    context.procedureOrStandard,
    context.outputOrResult,
  ]
    .filter(Boolean)
    .join(" ");
}

function lowercaseFirst(value: string) {
  if (!value) return value;
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function buildTriggerSentence(context: OperationalDescriptionContext) {
  const source = combinedContextText(context);

  if (/\boracle\b|\berp\b/i.test(source)) {
    return "Cuando ya está disponible el cierre mensual en Oracle";
  }

  if (/\bcorreo\b|\bsolicitud\b|\bpedido\b|\brequisicion\b/i.test(source)) {
    return "Cuando recibo la solicitud o el insumo que debo atender";
  }

  if (context.inputOrObject?.trim()) {
    const object = context.inputOrObject.trim().replace(/^(la|el|los|las)\s+/i, "");
    return `Cuando ya tengo disponible ${object}`;
  }

  return "Cuando ya tengo lo necesario para empezar este paso";
}

function buildTransformSentence(context: OperationalDescriptionContext) {
  const verb = context.actionVerb?.trim() || "Reviso";

  if (context.procedureOrStandard?.trim()) {
    return `${verb} y ${lowercaseFirst(context.procedureOrStandard.trim())}`;
  }

  if (context.inputOrObject?.trim()) {
    const object = context.inputOrObject.trim().replace(/^(la|el|los|las)\s+/i, "");
    return `${verb} ${object} para identificar lo que requiere seguimiento`;
  }

  return `${verb} la información clave de este paso`;
}

function normalizedContextToken(source: string) {
  return source
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function buildAttenuationSentence(context: OperationalDescriptionContext) {
  const source = normalizedContextToken(combinedContextText(context));

  if (/\bproyeccion\b|\berogacion\b|\bpresupuesto\b|\bdesviacion\b/i.test(source)) {
    return "Me centro en las variaciones que requieren explicación, no en cada diferencia menor";
  }

  if (/\breviso\b|\bvalido\b|\bapruebo\b/i.test(source)) {
    return "Priorizo lo que no cumple el criterio y dejo pasar lo que ya está conforme";
  }

  return "Priorizo lo que necesita seguimiento y dejo fuera el ruido que no cambia la decisión";
}

function buildOutputSentence(context: OperationalDescriptionContext) {
  const deliverable = shortenDeliverableLabel(context.outputOrResult);

  if (/\breporte\b|\banalisis\b|\bcausa raiz\b/i.test(deliverable)) {
    return `Preparo ${deliverable} con la explicación de lo que encontré`;
  }

  return `Dejo listo ${deliverable}`;
}

function buildHandoffSentence(context: OperationalDescriptionContext) {
  const source = combinedContextText(context);

  if (/\bdireccion\b|\bcomite\b|\btablero\b|\bgerencia\b/i.test(source)) {
    return "Lo dejo disponible para quien toma decisiones con esos números";
  }

  if (/\breporte\b|\bdesviacion\b|\bpresupuesto\b/i.test(source)) {
    return "Lo dejo listo para quien usa esos números en el siguiente control";
  }

  return "Lo dejo listo para quien lo necesita en el siguiente paso del proceso";
}

function buildExampleBeats(
  context: OperationalDescriptionContext,
): OperationalDescriptionExampleBeat[] {
  return [
    { stepId: "trigger", text: buildTriggerSentence(context) },
    { stepId: "transform", text: buildTransformSentence(context) },
    { stepId: "attenuation", text: buildAttenuationSentence(context) },
    { stepId: "output", text: buildOutputSentence(context) },
    { stepId: "handoff", text: buildHandoffSentence(context) },
  ];
}

function buildExampleNarrative(beats: OperationalDescriptionExampleBeat[]) {
  const [trigger, transform, attenuation, output, handoff] = beats.map(
    (beat) => beat.text,
  );

  return `${trigger}, ${lowercaseFirst(transform)}. ${attenuation}, ${lowercaseFirst(output)} ${handoff.replace(/^Lo /i, "y lo ")}.`;
}

export function buildOperationalDescriptionIntroGuide(
  context: OperationalDescriptionContext,
): OperationalDescriptionIntroGuide {
  const activityAnchorSnippet = truncateDraftSnippet(
    context.activityTitle?.trim() || "tu actividad",
    72,
  );
  const exampleBeats = buildExampleBeats(context);

  return {
    contrastLead: OPERATIONAL_DESCRIPTION_UI.introContrastLead,
    activityAnchorSnippet,
    pathSteps: INTRO_PATH_STEPS,
    exampleBeats,
    exampleLead: OPERATIONAL_DESCRIPTION_UI.exampleLead,
    exampleNarrative: buildExampleNarrative(exampleBeats),
  };
}

export function draftEchoesEstablishedActivity(
  draftText: string,
  context: OperationalDescriptionContext,
) {
  const trimmed = draftText.trim();
  if (!trimmed) {
    return false;
  }

  const activityTitle = context.activityTitle?.trim();
  if (!activityTitle) {
    return false;
  }

  const normalizedDraft = trimmed
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const normalizedActivity = activityTitle
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (normalizedDraft === normalizedActivity) {
    return true;
  }

  if (
    normalizedActivity.length >= 40 &&
    normalizedDraft.includes(normalizedActivity.slice(0, 40))
  ) {
    return true;
  }

  return (
    normalizedDraft.startsWith(normalizedActivity.slice(0, 24)) &&
    trimmed.length <= activityTitle.length * 1.1
  );
}

export function shouldShowOperationalDescriptionIntroGuide(input: {
  dismissed: boolean;
  draftText: string;
  context: OperationalDescriptionContext;
}) {
  if (input.dismissed) {
    return false;
  }

  return true;
}
