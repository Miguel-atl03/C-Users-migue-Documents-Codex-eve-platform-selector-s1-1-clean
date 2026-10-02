import { supabaseServer } from "@/lib/supabase-server";
import {
  buildOperationalDescriptionCoachEvent,
  coachEventPreguntaId,
  parseCoachEventFromRow,
  shouldPersistCoachEvent,
  type OperationalDescriptionCoachEvent,
} from "./coach-event.ts";
import type {
  OperationalDescriptionCoachResult,
  OperationalDescriptionContext,
} from "./types.ts";

function normalizeComparableText(text: string) {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export async function resolveLegacyActivityIdForCoachEvent(input: {
  sessionId: string;
  activityTitle?: string;
}) {
  const activityTitle = input.activityTitle?.trim();
  if (!activityTitle) {
    return null;
  }

  const { data, error } = await supabaseServer
    .from("actividades")
    .select("id, ancla_narrativa")
    .eq("sesion_id", input.sessionId);

  if (error || !data?.length) {
    return null;
  }

  const target = normalizeComparableText(activityTitle);
  const match = data.find(
    (row) => normalizeComparableText(row.ancla_narrativa ?? "") === target,
  );

  return match?.id ?? null;
}

export async function getLatestOperationalDescriptionCoachEvent(input: {
  sessionId: string;
  workMapActivityId?: string | null;
}): Promise<OperationalDescriptionCoachEvent | null> {
  const { data, error } = await supabaseServer
    .from("respuestas_estructuradas")
    .select("pregunta_id, texto_libre, actividad_id, created_at")
    .eq("sesion_id", input.sessionId)
    .like("pregunta_id", "SIGNIFICADO:B0-Q02_COACH_EVENT:%")
    .order("created_at", { ascending: false })
    .limit(12);

  if (error || !data?.length) {
    return null;
  }

  const workMapActivityId = input.workMapActivityId?.trim() || null;
  for (const row of data) {
    const event = parseCoachEventFromRow(row);
    if (!event) {
      continue;
    }
    if (
      workMapActivityId &&
      event.workMapActivityId &&
      event.workMapActivityId !== workMapActivityId
    ) {
      continue;
    }
    return event;
  }

  return null;
}

export async function listOperationalDescriptionCoachEvents(input: {
  sessionId: string;
  workMapActivityId?: string | null;
  limit?: number;
}): Promise<OperationalDescriptionCoachEvent[]> {
  const { data, error } = await supabaseServer
    .from("respuestas_estructuradas")
    .select("pregunta_id, texto_libre, actividad_id, created_at")
    .eq("sesion_id", input.sessionId)
    .like("pregunta_id", "SIGNIFICADO:B0-Q02_COACH_EVENT:%")
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 50);

  if (error || !data?.length) {
    return [];
  }

  const workMapActivityId = input.workMapActivityId?.trim() || null;
  return data
    .map((row) => parseCoachEventFromRow(row))
    .filter((event): event is OperationalDescriptionCoachEvent => {
      if (!event) {
        return false;
      }
      if (
        workMapActivityId &&
        event.workMapActivityId &&
        event.workMapActivityId !== workMapActivityId
      ) {
        return false;
      }
      return true;
    });
}

export async function persistOperationalDescriptionCoachTrace(input: {
  sessionId: string;
  draftText: string;
  context: OperationalDescriptionContext;
  result: OperationalDescriptionCoachResult;
  workMapActivityId?: string | null;
}): Promise<OperationalDescriptionCoachEvent | null> {
  const candidate = buildOperationalDescriptionCoachEvent({
    sessionId: input.sessionId,
    draftText: input.draftText,
    context: input.context,
    result: input.result,
    workMapActivityId: input.workMapActivityId,
    legacyActivityId: await resolveLegacyActivityIdForCoachEvent({
      sessionId: input.sessionId,
      activityTitle: input.context.activityTitle,
    }),
  });

  if (!candidate) {
    return null;
  }

  const previous = await getLatestOperationalDescriptionCoachEvent({
    sessionId: input.sessionId,
    workMapActivityId: input.workMapActivityId,
  });

  if (!shouldPersistCoachEvent(candidate, previous)) {
    return null;
  }

  const { error } = await supabaseServer.from("respuestas_estructuradas").insert({
    sesion_id: input.sessionId,
    actividad_id: candidate.legacyActivityId,
    pregunta_id: coachEventPreguntaId(candidate.eventId),
    texto_libre: JSON.stringify(candidate),
    updated_at: candidate.occurredAt,
  });

  if (error) {
    throw new Error(error.message);
  }

  return candidate;
}
