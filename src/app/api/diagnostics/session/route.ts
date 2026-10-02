import { NextResponse } from "next/server";
import type { ActivityStructuralScore } from "@/domain/activity";
import type { QuestionnaireAnswer } from "@/domain/questionnaire";
import { supabaseServer } from "@/lib/supabase-server";
import { buildSessionDiagnostic } from "@/services/diagnostic-engine";
import { buildSessionFinalOutput } from "@/services/session-closure-engine";
import { selectSupportActivitiesForRecursiveClosure } from "@/services/support-activity-selector";

type DiagnosticPayload = {
  sessionId: string;
  primaryActivityIds?: string[];
  supportCandidates?: ActivityStructuralScore[];
};

const fullQuestionPrefix = "FULL_V03:";

export async function POST(request: Request) {
  const payload = (await request.json()) as DiagnosticPayload;

  if (!payload.sessionId) {
    return NextResponse.json(
      { error: "Falta sessionId para generar diagnostico." },
      { status: 400 },
    );
  }

  const { data: session, error: sessionError } = await supabaseServer
    .from("sesiones_llenado")
    .select("id")
    .eq("id", payload.sessionId)
    .maybeSingle();

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json(
      { error: "No encontre la sesion solicitada." },
      { status: 404 },
    );
  }

  const { data: activities, error: activitiesError } = await supabaseServer
    .from("actividades")
    .select("id, ancla_narrativa, created_at")
    .eq("sesion_id", payload.sessionId)
    .order("created_at", { ascending: true });

  if (activitiesError) {
    return NextResponse.json(
      { error: activitiesError.message },
      { status: 500 },
    );
  }

  const { data: answerRows, error: answersError } = await supabaseServer
    .from("respuestas_estructuradas")
    .select("actividad_id, pregunta_id, valor_seleccionado, texto_libre")
    .eq("sesion_id", payload.sessionId)
    .like("pregunta_id", `${fullQuestionPrefix}%`);

  if (answersError) {
    return NextResponse.json({ error: answersError.message }, { status: 500 });
  }

  const answers: QuestionnaireAnswer[] = (answerRows ?? []).map((answer) => ({
    activityId: answer.actividad_id,
    questionCode: answer.pregunta_id.replace(fullQuestionPrefix, ""),
    blockId: "restored",
    selectedValue: answer.valor_seleccionado,
    freeText: answer.texto_libre,
  }));

  const diagnostic = buildSessionDiagnostic({
    sessionId: payload.sessionId,
    activities: activities ?? [],
    answers,
  });
  const primaryIds = new Set(payload.primaryActivityIds ?? []);
  const primaryDiagnostics = primaryIds.size
    ? diagnostic.activities.filter((activity) => primaryIds.has(activity.activityId))
    : diagnostic.activities;
  const answeredSupportActivityIds = (payload.supportCandidates ?? [])
    .filter((candidate) =>
      answers.some((answer) => answer.activityId === candidate.activityId),
    )
    .map((candidate) => candidate.activityId);
  const supportSelections = selectSupportActivitiesForRecursiveClosure({
    primaryDiagnostics,
    supportCandidates: payload.supportCandidates ?? [],
    answeredSupportActivityIds,
  });
  const finalOutput = buildSessionFinalOutput({
    diagnostic,
    primaryActivityIds: payload.primaryActivityIds ?? [],
    supportCandidates: payload.supportCandidates ?? [],
    answeredSupportActivityIds,
    supportSelections,
  });

  return NextResponse.json({
    ...diagnostic,
    supportSelections,
    finalOutput,
  });
}
