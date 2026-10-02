import { isSupabaseConfigured } from "@/lib/supabase-server";
import type { OperationalDescriptionCoachEvent } from "@/services/operational-description-coach/coach-event";
import type { SignificadoBlock0AnswerRecord } from "@/services/significado-block0-repository";

type SessionSummary = {
  id: string;
  estadoActual: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type SignificadoConsultantTraceStatus = "loaded" | "supabase_missing_env";

export type SignificadoConsultantTrace = {
  status: SignificadoConsultantTraceStatus;
  sessionId: string;
  generatedAt: string;
  session: SessionSummary | null;
  coachEvents: OperationalDescriptionCoachEvent[];
  block0Answers: SignificadoBlock0AnswerRecord[];
  operationalDescriptionFinal: string | null;
};

function buildMissingEnvTrace(sessionId: string): SignificadoConsultantTrace {
  return {
    status: "supabase_missing_env",
    sessionId,
    generatedAt: new Date().toISOString(),
    session: null,
    coachEvents: [],
    block0Answers: [],
    operationalDescriptionFinal: null,
  };
}

export async function buildSignificadoConsultantTrace(
  sessionId: string,
): Promise<SignificadoConsultantTrace> {
  if (!isSupabaseConfigured) {
    return buildMissingEnvTrace(sessionId);
  }

  const { supabaseServer } = await import("@/lib/supabase-server");
  const { listOperationalDescriptionCoachEvents } = await import(
    "@/services/operational-description-coach/operational-description-coach-repository"
  );
  const { listSignificadoBlock0Answers } = await import(
    "@/services/significado-block0-repository"
  );

  const { data: sessionRow } = await supabaseServer
    .from("sesiones_llenado")
    .select("id, estado_actual, created_at, updated_at")
    .eq("id", sessionId)
    .maybeSingle<{
      id: string;
      estado_actual: string | null;
      created_at: string | null;
      updated_at: string | null;
    }>();

  const [coachEvents, block0Answers] = await Promise.all([
    listOperationalDescriptionCoachEvents({ sessionId, limit: 100 }),
    listSignificadoBlock0Answers(sessionId),
  ]);

  return {
    status: "loaded",
    sessionId,
    generatedAt: new Date().toISOString(),
    session: sessionRow
      ? {
          id: sessionRow.id,
          estadoActual: sessionRow.estado_actual,
          createdAt: sessionRow.created_at,
          updatedAt: sessionRow.updated_at,
        }
      : null,
    coachEvents,
    block0Answers,
    operationalDescriptionFinal:
      block0Answers.find((answer) => answer.questionKey === "B0-Q02")?.answerText ??
      null,
  };
}
