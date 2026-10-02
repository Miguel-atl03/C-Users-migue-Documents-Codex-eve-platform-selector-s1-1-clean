import { computeFieldTextHash } from "@/domain/local-work-map";
import { hasEstablishedActivityContext } from "./narrative-coach-policy.ts";
import type {
  OperationalDescriptionCoachResult,
  OperationalDescriptionContext,
} from "./types.ts";

export const OPERATIONAL_DESCRIPTION_COACH_EVENT_PREFIX =
  "SIGNIFICADO:B0-Q02_COACH_EVENT:";

export type OperationalDescriptionCoachEvent = {
  eventId: string;
  questionId: "B0-Q02";
  occurredAt: string;
  sessionId: string;
  workMapActivityId: string | null;
  legacyActivityId: string | null;
  draftTextHash: string;
  draftTextSnippet: string;
  coachSource: "deterministic" | "llm";
  coachMessage: string | null;
  exampleFragment: string | null;
  scan: {
    sufficiency: OperationalDescriptionCoachResult["scan"]["sufficiency"];
    priorityGap: OperationalDescriptionCoachResult["scan"]["priorityGap"];
    coachTier: OperationalDescriptionCoachResult["scan"]["coachTier"];
  };
  cyberneticEvaluation?: OperationalDescriptionCoachResult["cyberneticEvaluation"];
  contextSummary: {
    narrativeMode: boolean;
    actionVerb?: string;
    activityTitle?: string;
  };
};

export function buildOperationalDescriptionCoachEvent(input: {
  sessionId: string;
  draftText: string;
  context: OperationalDescriptionContext;
  result: OperationalDescriptionCoachResult;
  workMapActivityId?: string | null;
  legacyActivityId?: string | null;
  eventId?: string;
  occurredAt?: string;
}): OperationalDescriptionCoachEvent | null {
  if (!input.result.message?.trim()) {
    return null;
  }

  const draftText = input.draftText.trim();
  const snippet =
    draftText.length <= 120 ? draftText : `${draftText.slice(0, 119).trimEnd()}…`;

  return {
    eventId: input.eventId ?? crypto.randomUUID(),
    questionId: "B0-Q02",
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    sessionId: input.sessionId,
    workMapActivityId: input.workMapActivityId?.trim() || null,
    legacyActivityId: input.legacyActivityId ?? null,
    draftTextHash: computeFieldTextHash(draftText),
    draftTextSnippet: snippet,
    coachSource: input.result.coachSource ?? "deterministic",
    coachMessage: input.result.message,
    exampleFragment: input.result.exampleFragment,
    scan: {
      sufficiency: input.result.scan.sufficiency,
      priorityGap: input.result.scan.priorityGap,
      coachTier: input.result.scan.coachTier,
    },
    cyberneticEvaluation: input.result.cyberneticEvaluation,
    contextSummary: {
      narrativeMode: hasEstablishedActivityContext(input.context),
      actionVerb: input.context.actionVerb,
      activityTitle: input.context.activityTitle,
    },
  };
}

export function shouldPersistCoachEvent(
  candidate: OperationalDescriptionCoachEvent,
  previous: OperationalDescriptionCoachEvent | null,
) {
  if (!candidate.coachMessage?.trim()) {
    return false;
  }

  if (!previous) {
    return true;
  }

  return (
    previous.draftTextHash !== candidate.draftTextHash ||
    previous.coachMessage !== candidate.coachMessage ||
    previous.coachSource !== candidate.coachSource
  );
}

export function coachEventPreguntaId(eventId: string) {
  return `${OPERATIONAL_DESCRIPTION_COACH_EVENT_PREFIX}${eventId}`;
}

export function parseCoachEventFromRow(row: {
  pregunta_id: string;
  texto_libre: string | null;
  actividad_id?: string | null;
  created_at?: string;
}): OperationalDescriptionCoachEvent | null {
  if (!row.pregunta_id.startsWith(OPERATIONAL_DESCRIPTION_COACH_EVENT_PREFIX)) {
    return null;
  }

  if (!row.texto_libre?.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(row.texto_libre) as OperationalDescriptionCoachEvent;
    if (!parsed?.eventId) {
      return null;
    }
    return {
      ...parsed,
      legacyActivityId: parsed.legacyActivityId ?? row.actividad_id ?? null,
      occurredAt: parsed.occurredAt ?? row.created_at ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
