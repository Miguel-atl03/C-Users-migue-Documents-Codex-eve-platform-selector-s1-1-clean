import { NextResponse } from "next/server";
import {
  normalizeSessionMode,
  resolveSceneOwner,
  runWithOperationalServerSupabaseClient,
} from "@/lib/session-boundary";
import { deriveSceneBlockDerivations } from "@/services/scene-derivation-engine";

type SceneDerivationPayload = {
  mode?: "commercial" | "demo";
  sessionId: string;
  sceneId: string;
};

export async function POST(request: Request) {
  const payload = (await request.json()) as SceneDerivationPayload;
  const mode = normalizeSessionMode(payload.mode);

  if (!payload.sessionId) {
    return NextResponse.json(
      { error: "Falta sessionId para derivar variables canonicas." },
      { status: 400 },
    );
  }

  if (!payload.sceneId) {
    return NextResponse.json(
      { error: "Falta sceneId para derivar variables canonicas." },
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
        deriveSceneBlockDerivations({
          sessionId: payload.sessionId,
          sceneId: payload.sceneId,
        }),
    );

    return NextResponse.json({
      ...result,
      next: "scene_block_derivations_ready",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron derivar las variables canonicas de escena.",
      },
      { status: 500 },
    );
  }
}
