import { NextResponse } from "next/server";
import {
  normalizeSessionMode,
  resolveSceneOwner,
  runWithOperationalServerSupabaseClient,
} from "@/lib/session-boundary";
import { runSceneConsistencyCheck } from "@/services/scene-consistency-engine";

type SceneConsistencyPayload = {
  mode?: "commercial" | "demo";
  sessionId: string;
  sceneId: string;
};

export async function POST(request: Request) {
  const payload = (await request.json()) as SceneConsistencyPayload;
  const mode = normalizeSessionMode(payload.mode);

  if (!payload.sessionId) {
    return NextResponse.json(
      { error: "Falta sessionId para revisar consistencia de escena." },
      { status: 400 },
    );
  }

  if (!payload.sceneId) {
    return NextResponse.json(
      { error: "Falta sceneId para revisar consistencia de escena." },
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
        runSceneConsistencyCheck({
          sessionId: payload.sessionId,
          sceneId: payload.sceneId,
        }),
    );

    return NextResponse.json({
      ...result,
      next: "scene_consistency_ready",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo revisar la consistencia de escena.",
      },
      { status: 500 },
    );
  }
}
