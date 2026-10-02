import { NextResponse } from "next/server";
import {
  normalizeSessionMode,
  resolveSessionOwner,
  runWithOperationalServerSupabaseClient,
} from "@/lib/session-boundary";
import { supabaseServer } from "@/lib/supabase-server";

type RestorePayload = {
  sessionId: string;
  mode?: "commercial" | "demo";
};

type ParticipantWorkMapSnapshotRow = {
  id: string;
  workmap_json: unknown;
  updated_at: string;
};

export async function POST(request: Request) {
  const payload = (await request.json()) as RestorePayload;
  const mode = normalizeSessionMode(payload.mode);

  if (!payload.sessionId) {
    return NextResponse.json(
      { error: "Falta el ID de sesion para recuperar el avance." },
      { status: 400 },
    );
  }

  const sessionResult = await resolveSessionOwner(
    request,
    payload.sessionId,
    mode,
  );

  if (!sessionResult.session) {
    return NextResponse.json(
      { error: sessionResult.error, mode },
      { status: sessionResult.status },
    );
  }

  const session = sessionResult.session;

  return await runWithOperationalServerSupabaseClient(request, mode, async () => {
  const participantContext =
    mode === "commercial" ? await resolveParticipantContextForRestore(payload.sessionId) : null;

  const { data: activities, error: activitiesError } = await supabaseServer
    .from("actividades")
    .select(
      "id, ancla_narrativa, origen, aceptada, es_critica, interconexion_score, created_at",
    )
    .eq("sesion_id", payload.sessionId)
    .order("created_at", { ascending: true });

  if (activitiesError) {
    return NextResponse.json(
      { error: activitiesError.message },
      { status: 500 },
    );
  }

  const { data: answers, error: answersError } = await supabaseServer
    .from("respuestas_estructuradas")
    .select("actividad_id, pregunta_id, valor_seleccionado, texto_libre")
    .eq("sesion_id", payload.sessionId);

  if (answersError) {
    return NextResponse.json({ error: answersError.message }, { status: 500 });
  }

  const activeWorkMapSnapshot = participantContext
    ? await resolveActiveParticipantWorkMapSnapshot({
        caseId: payload.sessionId,
        participantId: participantContext.participantId,
      })
    : null;

  const questionnaireAnswers = (answers ?? []).filter(
    (answer) =>
      typeof answer.pregunta_id === "string" &&
      answer.pregunta_id.startsWith("FULL_V03:"),
  );

  const resumeFlowState =
    activeWorkMapSnapshot && !(activities ?? []).length
      ? "intake_significado"
      : null;

  return NextResponse.json({
    session: {
      id: session.id,
      estado_actual: session.estado_actual,
      porcentaje_avance: session.porcentaje_avance,
      created_at: session.created_at,
      updated_at: session.updated_at,
    },
    activities: (activities ?? []).map((activity) => ({
      id: activity.id,
      title: activity.ancla_narrativa,
      narrativeAnchor: activity.ancla_narrativa,
      origin: activity.origen,
      accepted: activity.aceptada,
      critical: activity.es_critica,
      interconnectionScore: activity.interconexion_score,
    })),
    answers: answers ?? [],
    work_map: activeWorkMapSnapshot?.workmap_json ?? null,
    resume: activeWorkMapSnapshot
      ? {
          source: "participant_workmap_snapshot",
          flow_state: resumeFlowState,
          workmap_snapshot_id: activeWorkMapSnapshot.id,
          workmap_updated_at: activeWorkMapSnapshot.updated_at,
          has_questionnaire_answers: questionnaireAnswers.length > 0,
        }
      : null,
  });
  });
}

async function resolveParticipantContextForRestore(sessionId: string) {
  const { data: participant, error } = await supabaseServer
    .from("case_participants")
    .select("id")
    .eq("case_id", sessionId)
    .eq("status", "active")
    .maybeSingle<{ id: string }>();

  if (error || !participant) {
    return null;
  }

  return { participantId: participant.id };
}

async function resolveActiveParticipantWorkMapSnapshot(options: {
  caseId: string;
  participantId: string;
}) {
  const { data, error } = await supabaseServer
    .from("case_participant_workmap_snapshots")
    .select("id, workmap_json, updated_at")
    .eq("case_id", options.caseId)
    .eq("case_participant_id", options.participantId)
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<ParticipantWorkMapSnapshotRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
}
