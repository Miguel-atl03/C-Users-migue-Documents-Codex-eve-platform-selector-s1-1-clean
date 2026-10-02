import { NextResponse } from "next/server";
import {
  normalizeSessionMode,
  resolveSceneOwner,
  runWithOperationalServerSupabaseClient,
} from "@/lib/session-boundary";
import { buildSceneCanonicalRecord } from "@/services/scene-canonical-record-builder";
import {
  observeSceneCanonicalizationShadow,
  runMbaShadowSafely,
} from "@/services/mba/shadow-observer";

type SceneCanonicalizePayload = {
  mode?: "commercial" | "demo";
  sessionId: string;
  sceneId: string;
};

export async function POST(request: Request) {
  const payload = (await request.json()) as SceneCanonicalizePayload;
  const mode = normalizeSessionMode(payload.mode);

  if (!payload.sessionId) {
    return NextResponse.json(
      { error: "Falta sessionId para consolidar la escena." },
      { status: 400 },
    );
  }

  if (!payload.sceneId) {
    return NextResponse.json(
      { error: "Falta sceneId para consolidar la escena." },
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
        buildSceneCanonicalRecord({
          sessionId: payload.sessionId,
          sceneId: payload.sceneId,
        }),
    );

    await runMbaShadowSafely(
      () =>
        observeSceneCanonicalizationShadow({
          sessionId: payload.sessionId,
          sceneId: payload.sceneId,
          result,
        }),
      "mba_shadow_scene_canonicalize",
    );

    return NextResponse.json({
      ...result,
      next: "scene_canonical_record_ready",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo consolidar la escena canonica.",
      },
      { status: 500 },
    );
  }
}
