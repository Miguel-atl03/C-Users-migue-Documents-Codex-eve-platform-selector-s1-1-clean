import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import type { MissionOptionId, QuestionnaireAnswer } from "@/domain/questionnaire";
import { inferMissionForActivity } from "@/services/mission-inference";

type QuestionnairePayload = {
  sessionId: string;
  answers: QuestionnaireAnswer[];
};

export async function POST(request: Request) {
  const payload = (await request.json()) as QuestionnairePayload;

  if (!payload.sessionId) {
    return NextResponse.json(
      { error: "Falta la sesion para guardar el cuestionario." },
      { status: 400 },
    );
  }

  if (!payload.answers?.length) {
    return NextResponse.json(
      { error: "No hay respuestas para guardar." },
      { status: 400 },
    );
  }

  const missionOverrides = new Map<
    string,
    { status: "confirmed" | "corrected"; value: MissionOptionId }
  >();
  const questionnaireAnswers = payload.answers.filter((answer) => {
    if (answer.questionCode !== "MISSION_USER_OVERRIDE") return true;

    if (
      answer.selectedValue === "1" ||
      answer.selectedValue === "2" ||
      answer.selectedValue === "3" ||
      answer.selectedValue === "4" ||
      answer.selectedValue === "5" ||
      answer.selectedValue === "6" ||
      answer.selectedValue === "7" ||
      answer.selectedValue === "8" ||
      answer.selectedValue === "9"
    ) {
      missionOverrides.set(answer.activityId, {
        status: answer.freeText === "confirmed" ? "confirmed" : "corrected",
        value: answer.selectedValue,
      });
    }

    return false;
  });

  const rows = questionnaireAnswers.map((answer) => ({
    sesion_id: payload.sessionId,
    actividad_id: answer.activityId,
    pregunta_id: `FULL_V03:${answer.questionCode}`,
    valor_seleccionado: answer.selectedValue,
    texto_libre: answer.freeText,
    updated_at: new Date().toISOString(),
  }));
  const activityIds = Array.from(
    new Set(questionnaireAnswers.map((answer) => answer.activityId)),
  );
  const missionRows = activityIds.flatMap((activityId) => {
    const override = missionOverrides.get(activityId);
    const inference = inferMissionForActivity({
      activityId,
      answers: questionnaireAnswers,
      missionUserOverride: override?.value ?? null,
      missionUserConfirmationStatus: override?.status,
    });

    return [
      {
        sesion_id: payload.sessionId,
        actividad_id: activityId,
        pregunta_id: "MISSION:mission_final",
        valor_seleccionado: inference.mission_final,
        texto_libre: inference.mission_inferred_by_ai,
        updated_at: new Date().toISOString(),
      },
      {
        sesion_id: payload.sessionId,
        actividad_id: activityId,
        pregunta_id: "MISSION:mission_confidence",
        valor_seleccionado: inference.mission_confidence,
        texto_libre: inference.mission_confidence_reason,
        updated_at: new Date().toISOString(),
      },
      {
        sesion_id: payload.sessionId,
        actividad_id: activityId,
        pregunta_id: "MISSION:mission_evidence",
        valor_seleccionado: inference.mission_user_confirmation_status,
        texto_libre: JSON.stringify({
          mission_score_by_option: inference.mission_score_by_option,
          mission_conflict_flags: inference.mission_conflict_flags,
          mission_evidence: inference.mission_evidence,
          mission_user_override: inference.mission_user_override,
        }),
        updated_at: new Date().toISOString(),
      },
    ];
  });
  const allRows = [...rows, ...missionRows];

  const { error: upsertError } = await supabaseServer
    .from("respuestas_estructuradas")
    .upsert(allRows, {
      onConflict: "sesion_id,actividad_id,pregunta_id",
    });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  const { error: sessionError } = await supabaseServer
    .from("sesiones_llenado")
    .update({
      estado_actual: "capa_2_5_s2",
      porcentaje_avance: 45,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.sessionId);

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }

  await supabaseServer.from("metricas_por_capa").upsert(
    {
      sesion_id: payload.sessionId,
      capa: "cuestionario_full_v03",
      timestamp_entrada: new Date().toISOString(),
    },
    { onConflict: "sesion_id,capa" },
  );

  return NextResponse.json({
    savedRows: allRows.length,
    nextLayer: "capa_2_5_s2",
  });
}
