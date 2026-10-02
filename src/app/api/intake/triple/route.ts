import { NextResponse } from "next/server";
import {
  normalizeSessionMode,
  resolveSessionOwner,
  runWithOperationalServerSupabaseClient,
} from "@/lib/session-boundary";
import { resolveAuthenticatedParticipantContext } from "@/lib/participant-context";
import { supabaseServer } from "@/lib/supabase-server";
import type { Activity, RelatoAnswer, RelatoType } from "@/lib/types";

type IntakePayload = {
  mode?: "commercial" | "demo";
  sessionId: string;
  phase?: "save" | "continue";
  activities?: Activity[];
  relatos?: Record<RelatoType, RelatoAnswer[]>;
  workMap?: unknown;
};


async function persistParticipantWorkMap(options: {
  participantContext: Awaited<ReturnType<typeof resolveAuthenticatedParticipantContext>> | null;
  sessionId: string;
  workMap: unknown;
}) {
  const { participantContext, sessionId, workMap } = options;
  if (participantContext?.status !== "ready" || !workMap) {
    return null;
  }

  const { data: snapshotRows, error: snapshotError } = await supabaseServer.rpc(
    "upsert_participant_workmap_snapshot",
    {
      p_case_id: sessionId,
      p_workmap: workMap,
      p_workmap_version: "workmap.v1",
    },
  );

  if (snapshotError) {
    throw new Error(snapshotError.message);
  }

  const { data: materializedRows, error: materializedError } =
    await supabaseServer.rpc(
      "materialize_case_participant_profiles_from_workmap",
      {
        p_case_id: sessionId,
      },
    );

  if (materializedError) {
    throw new Error(materializedError.message);
  }

  return {
    snapshot: Array.isArray(snapshotRows) ? snapshotRows[0] ?? null : null,
    materializedProfiles: Array.isArray(materializedRows)
      ? materializedRows
      : [],
  };
}

export async function POST(request: Request) {
  const payload = (await request.json()) as IntakePayload;
  const mode = normalizeSessionMode(payload.mode);

  if (!payload.sessionId) {
    return NextResponse.json(
      { error: "Falta sessionId para guardar la Capa 1." },
      { status: 400 },
    );
  }

  const participantContext =
    mode === "commercial"
      ? await resolveAuthenticatedParticipantContext(request)
      : null;

  if (participantContext?.status === "ready" && payload.sessionId !== participantContext.case.id) {
    return NextResponse.json(
      {
        error: "participant_context_session_mismatch",
        mode,
      },
      { status: 403 },
    );
  }

  if (
    participantContext?.status === "case_selection_required" ||
    participantContext?.status === "profile_selection_required"
  ) {
    return NextResponse.json(
      {
        error: participantContext.status,
        mode,
      },
      { status: 409 },
    );
  }

  if (payload.phase === "save" && participantContext?.status !== "ready") {
    return NextResponse.json(
      {
        error: "active_participant_context_required",
        mode,
      },
      { status: 409 },
    );
  }

  const activities = payload.activities ?? [];
  const relatos = payload.relatos ?? {
    ultimo_incendio: [],
    lo_que_no_deberia_pasar: [],
  };

  if (payload.phase !== "save" && !activities.length) {
    return NextResponse.json(
      { error: "Agrega al menos una actividad para continuar." },
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
    if (payload.phase === "save") {
      let workMapPersistence = null;
      try {
        workMapPersistence = await persistParticipantWorkMap({
          participantContext,
          sessionId: payload.sessionId,
          workMap: payload.workMap,
        });
      } catch (error) {
        return NextResponse.json(
          {
            error:
              error instanceof Error
                ? error.message
                : "No pude guardar el WorkMap del participante.",
          },
          { status: 500 },
        );
      }

      if (participantContext?.status !== "ready") {
        const { error: updateSessionError } = await supabaseServer
          .from("sesiones_llenado")
          .update({
            updated_at: new Date().toISOString(),
          })
          .eq("id", payload.sessionId);

        if (updateSessionError) {
          return NextResponse.json(
            { error: updateSessionError.message },
            { status: 500 },
          );
        }
      }

      return NextResponse.json({
        saved: true,
        binding:
          participantContext?.status === "ready"
            ? {
                case_id: participantContext.case.id,
                case_participant_id: participantContext.participant.id,
                case_participant_profile_ids:
                  workMapPersistence?.materializedProfiles.map(
                    (profile) => profile.profile_id,
                  ) ?? participantContext.functionalProfiles.map((profile) => profile.id),
              }
            : null,
        workMapPersistence,
      });
    }

    const { error: deleteRelatosError } = await supabaseServer
      .from("respuestas_relatos")
      .delete()
      .eq("sesion_id", payload.sessionId);

    if (deleteRelatosError) {
      return NextResponse.json(
        { error: deleteRelatosError.message },
        { status: 500 },
      );
    }

    const { error: deleteActivitiesError } = await supabaseServer
      .from("actividades")
      .delete()
      .eq("sesion_id", payload.sessionId);

    if (deleteActivitiesError) {
      return NextResponse.json(
        { error: deleteActivitiesError.message },
        { status: 500 },
      );
    }

    const { data: insertedActivities, error: activitiesError } =
      await supabaseServer
        .from("actividades")
        .insert(
          activities.map((activity) => ({
            sesion_id: payload.sessionId,
            ancla_narrativa: activity.narrativeAnchor || activity.title,
            origen: activity.origin,
            aceptada: activity.accepted,
            es_critica: activity.critical,
            interconexion_score: activity.interconnectionScore,
            impacto_score: activity.critical ? 4 : 2,
            variabilidad_score: activity.origin === "ia_inferida" ? 4 : 2,
          })),
        )
        .select(
          "id, ancla_narrativa, origen, aceptada, es_critica, interconexion_score",
        );

    if (activitiesError || !insertedActivities) {
      return NextResponse.json(
        { error: activitiesError?.message ?? "No pude guardar actividades." },
        { status: 500 },
      );
    }

    const titleToActivityId = new Map<string, string>();

    activities.forEach((activity, index) => {
      const inserted = insertedActivities[index];
      if (inserted) {
        titleToActivityId.set(activity.title, inserted.id);
      }
    });

    const relatoRows = Object.entries(relatos).flatMap(
      ([tipoRelato, answers]) =>
        answers.map((answer, index) => ({
          sesion_id: payload.sessionId,
          tipo_relato: tipoRelato as RelatoType,
          numero_pregunta: index + 1,
          respuesta_texto: index === 0 ? null : answer.answer,
          respuesta_seleccionada: index === 0 ? answer.answer : null,
          actividad_id_seleccionada:
            index === 0 ? titleToActivityId.get(answer.answer) ?? null : null,
          version_herramienta_id: session.version_herramienta_id,
        })),
    );

    if (relatoRows.length) {
      const { error: relatosError } = await supabaseServer
        .from("respuestas_relatos")
        .insert(relatoRows);

      if (relatosError) {
        return NextResponse.json(
          { error: relatosError.message },
          { status: 500 },
        );
      }
    }

    const { error: updateSessionError } = await supabaseServer
      .from("sesiones_llenado")
      .update({
        estado_actual: "capa_2_estructural",
        porcentaje_avance: 25,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.sessionId);

    if (updateSessionError) {
      return NextResponse.json(
        { error: updateSessionError.message },
        { status: 500 },
      );
    }

    await supabaseServer.from("metricas_por_capa").upsert(
      {
        sesion_id: payload.sessionId,
        capa: "capa_2_estructural",
        timestamp_entrada: new Date().toISOString(),
      },
      { onConflict: "sesion_id,capa" },
    );

    let workMapPersistence = null;
    try {
      workMapPersistence = await persistParticipantWorkMap({
        participantContext,
        sessionId: payload.sessionId,
        workMap: payload.workMap,
      });
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "No pude materializar perfiles desde WorkMap.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      activities: insertedActivities.map((activity, index) => ({
        id: activity.id,
        title: activities[index]?.title ?? activity.ancla_narrativa,
        narrativeAnchor: activity.ancla_narrativa,
        origin: activity.origen,
        accepted: activity.aceptada,
        critical: activity.es_critica,
        interconnectionScore: activity.interconexion_score,
      })),
      nextLayer: "capa_2_estructural",
      binding:
        participantContext?.status === "ready"
          ? {
            case_id: participantContext.case.id,
            case_participant_id: participantContext.participant.id,
            case_participant_profile_ids:
              workMapPersistence?.materializedProfiles.map(
                (profile) => profile.profile_id,
              ) ?? participantContext.functionalProfiles.map((profile) => profile.id),
          }
        : null,
      workMapPersistence,
    });
  });
}
