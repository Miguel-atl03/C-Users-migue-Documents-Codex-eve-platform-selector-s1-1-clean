import { supabaseServer } from "@/lib/supabase-server";
import type { SignificadoBlock0Answers } from "@/domain/significado-de-trabajo";
import { resolveLegacyActivityIdForCoachEvent } from "@/services/operational-description-coach/operational-description-coach-repository";
import {
  isSignificadoBlock0AnswerPreguntaId,
  parseSignificadoBlock0QuestionKey,
  significadoBlock0PreguntaId,
} from "@/services/export/significado-export-mappers";

function isNonNull<T>(value: T | null): value is T {
  return value !== null;
}

export type SignificadoBlock0AnswerRecord = {
  id: string;
  activityId: string | null;
  questionKey: string;
  questionCode: string;
  subfieldId: string | null;
  answerText: string;
  capturedAt: string | null;
};

export async function listSignificadoBlock0Answers(
  sessionId: string,
): Promise<SignificadoBlock0AnswerRecord[]> {
  const { data, error } = await supabaseServer
    .from("respuestas_estructuradas")
    .select("id, actividad_id, pregunta_id, texto_libre, updated_at")
    .eq("sesion_id", sessionId)
    .like("pregunta_id", "SIGNIFICADO:%")
    .order("updated_at", { ascending: false });

  if (error || !data?.length) {
    return [];
  }

  return data
    .map((row) => {
      if (!isSignificadoBlock0AnswerPreguntaId(row.pregunta_id)) {
        return null;
      }

      const parsed = parseSignificadoBlock0QuestionKey(row.pregunta_id);
      const answerText = row.texto_libre?.trim() ?? "";
      if (!parsed || !answerText) {
        return null;
      }

      return {
        id: row.id,
        activityId: row.actividad_id ?? null,
        questionKey: parsed.questionKey,
        questionCode: parsed.questionCode,
        subfieldId: parsed.subfieldId,
        answerText,
        capturedAt: row.updated_at,
      };
    })
    .filter(isNonNull)
    .sort((left, right) => left.questionKey.localeCompare(right.questionKey));
}

export async function persistSignificadoBlock0Answers(input: {
  sessionId: string;
  answers: SignificadoBlock0Answers;
  activityTitle?: string;
  legacyActivityId?: string | null;
}) {
  const capturedAt = new Date().toISOString();
  const legacyActivityId =
    input.legacyActivityId ??
    (await resolveLegacyActivityIdForCoachEvent({
      sessionId: input.sessionId,
      activityTitle: input.activityTitle,
    }));

  const rows = Object.entries(input.answers)
    .map(([questionKey, rawValue]) => {
      const answerText = rawValue?.trim() ?? "";
      if (!answerText) {
        return null;
      }

      return {
        sesion_id: input.sessionId,
        actividad_id: legacyActivityId,
        pregunta_id: significadoBlock0PreguntaId(questionKey),
        texto_libre: answerText,
        updated_at: capturedAt,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  if (!rows.length) {
    return { persistedCount: 0 };
  }

  const { error } = await supabaseServer.from("respuestas_estructuradas").upsert(rows, {
    onConflict: "sesion_id,actividad_id,pregunta_id",
  });

  if (error) {
    throw new Error(error.message);
  }

  return { persistedCount: rows.length };
}
