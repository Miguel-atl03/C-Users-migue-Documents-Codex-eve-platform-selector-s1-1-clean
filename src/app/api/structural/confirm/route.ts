import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import type { StructuralAnswer } from "@/lib/types";

type StructuralPayload = {
  sessionId: string;
  answers: StructuralAnswer[];
};

const answerToRows = (sessionId: string, answer: StructuralAnswer) => [
  {
    sesion_id: sessionId,
    actividad_id: answer.activityId,
    pregunta_id: "contexto_confirmado",
    valor_seleccionado: answer.contextConfirmed ? "si" : "no",
    texto_libre: null,
  },
  {
    sesion_id: sessionId,
    actividad_id: answer.activityId,
    pregunta_id: "nivel_autonomia",
    valor_seleccionado: answer.autonomyLevel,
    texto_libre: null,
  },
  {
    sesion_id: sessionId,
    actividad_id: answer.activityId,
    pregunta_id: "nivel_dependencia",
    valor_seleccionado: answer.dependencyLevel,
    texto_libre: null,
  },
  {
    sesion_id: sessionId,
    actividad_id: answer.activityId,
    pregunta_id: "impacto_calidad",
    valor_seleccionado: answer.qualityImpact,
    texto_libre: null,
  },
];

export async function POST(request: Request) {
  const payload = (await request.json()) as StructuralPayload;

  if (!payload.sessionId) {
    return NextResponse.json(
      { error: "Falta sessionId para guardar Capa 2." },
      { status: 400 },
    );
  }

  if (!payload.answers?.length) {
    return NextResponse.json(
      { error: "No hay respuestas estructurales para guardar." },
      { status: 400 },
    );
  }

  const rows = payload.answers.flatMap((answer) =>
    answerToRows(payload.sessionId, answer),
  );

  const { error: upsertError } = await supabaseServer
    .from("respuestas_estructuradas")
    .upsert(rows, {
      onConflict: "sesion_id,actividad_id,pregunta_id",
    });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  const { error: sessionError } = await supabaseServer
    .from("sesiones_llenado")
    .update({
      estado_actual: "capa_2_5_s2",
      porcentaje_avance: 40,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.sessionId);

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }

  await supabaseServer.from("metricas_por_capa").upsert(
    {
      sesion_id: payload.sessionId,
      capa: "capa_2_5_s2",
      timestamp_entrada: new Date().toISOString(),
    },
    { onConflict: "sesion_id,capa" },
  );

  return NextResponse.json({
    savedRows: rows.length,
    nextLayer: "capa_2_5_s2",
  });
}
