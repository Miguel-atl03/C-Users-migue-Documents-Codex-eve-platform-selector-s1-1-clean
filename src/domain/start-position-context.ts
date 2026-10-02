export type StartPositionContext = {
  participationPlace: string;
  participationPlaceOther: string;
  decisionProximity: string;
};

export const EMPTY_START_POSITION_CONTEXT: StartPositionContext = {
  participationPlace: "",
  participationPlaceOther: "",
  decisionProximity: "",
};

export const PARTICIPATION_PLACE_OPTIONS = [
  {
    id: "owner_general_management",
    label: "Soy dueño/a, socio/a o parte de la dirección general.",
  },
  {
    id: "area_leader",
    label: "Estoy a cargo o dirijo un área.",
  },
  {
    id: "supervisor",
    label: "Superviso o coordino el trabajo de otras personas.",
  },
  {
    id: "analyst",
    label: "Analizo información, datos o procesos de la empresa.",
  },
  {
    id: "support",
    label: "Apoyo en administración, ventas, producción, atención o soporte.",
  },
  {
    id: "external_advisor",
    label: "Participo como externo, asesor o proveedor.",
  },
  {
    id: "other",
    label: "Otro.",
  },
] as const;

export const DECISION_PROXIMITY_OPTIONS = [
  {
    id: "take_directly",
    label: "Las tomo directamente",
  },
  {
    id: "participate",
    label: "Participo en decidirlas",
  },
  {
    id: "propose_prepare",
    label: "Las propongo o las preparo",
  },
  {
    id: "execute_when_decided",
    label: "Las ejecuto cuando ya fueron decididas",
  },
  {
    id: "impact_only",
    label: "Las vivo como impacto, pero no participo mucho en decidirlas",
  },
] as const;

export function isStartPositionContextComplete(
  context: StartPositionContext,
): boolean {
  const hasParticipationPlace = Boolean(context.participationPlace);
  const hasOtherDetail =
    context.participationPlace !== "other" ||
    Boolean(context.participationPlaceOther.trim());

  return Boolean(
    hasParticipationPlace && hasOtherDetail && context.decisionProximity,
  );
}

export function normalizeStartPositionContext(
  value: unknown,
): StartPositionContext | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const candidate = value as Partial<StartPositionContext>;
  const participationPlace =
    typeof candidate.participationPlace === "string"
      ? candidate.participationPlace
      : "";
  const participationPlaceOther =
    typeof candidate.participationPlaceOther === "string"
      ? candidate.participationPlaceOther
      : "";
  const decisionProximity =
    typeof candidate.decisionProximity === "string"
      ? candidate.decisionProximity
      : "";

  if (!participationPlace && !decisionProximity) {
    return undefined;
  }

  return { participationPlace, participationPlaceOther, decisionProximity };
}
