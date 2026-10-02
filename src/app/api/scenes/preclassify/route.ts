import { NextResponse } from "next/server";
import {
  normalizeSessionMode,
  resolveSceneOwner,
  runWithOperationalServerSupabaseClient,
} from "@/lib/session-boundary";
import { preclassifySceneLightly } from "@/services/scene-light-preclassification-engine";

type ScenePreclassifyPayload = {
  mode?: "commercial" | "demo";
  sessionId: string;
  sceneId: string;
};

export async function POST(request: Request) {
  const payload = (await request.json()) as ScenePreclassifyPayload;
  const mode = normalizeSessionMode(payload.mode);

  if (!payload.sessionId) {
    return NextResponse.json(
      { error: "Falta sessionId para preclasificar la escena." },
      { status: 400 },
    );
  }

  if (!payload.sceneId) {
    return NextResponse.json(
      { error: "Falta sceneId para preclasificar la escena." },
      { status: 400 },
    );
  }

  const sceneResult = await resolveSceneOwner(request, {
    sessionId: payload.sessionId,
    sceneId: payload.sceneId,
    mode,
  });

  if (!sceneResult.session || !sceneResult.scene) {
    return NextResponse.json(
      { error: sceneResult.error, mode },
      { status: sceneResult.status },
    );
  }

  try {
    const result = await runWithOperationalServerSupabaseClient(
      request,
      mode,
      () =>
        preclassifySceneLightly({
          sessionId: payload.sessionId,
          sceneId: payload.sceneId,
        }),
    );

    return NextResponse.json({
      ...result,
      next: "scene_light_preclassification_ready",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo generar la preclasificacion ligera de escena.",
      },
      { status: 500 },
    );
  }
}
