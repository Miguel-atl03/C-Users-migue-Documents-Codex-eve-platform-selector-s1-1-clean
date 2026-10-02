import { NextResponse } from "next/server";
import {
  normalizeSessionMode,
  resolveSessionOwner,
  runWithOperationalServerSupabaseClient,
} from "@/lib/session-boundary";
import { bootstrapScenesFromLegacyActivities } from "@/services/scene-repository";

type SceneBootstrapPayload = {
  mode?: "commercial" | "demo";
  sessionId: string;
};

export async function POST(request: Request) {
  const payload = (await request.json()) as SceneBootstrapPayload;
  const mode = normalizeSessionMode(payload.mode);

  if (!payload.sessionId) {
    return NextResponse.json(
      { error: "Falta sessionId para inicializar escenas." },
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

  try {
    const result = await runWithOperationalServerSupabaseClient(
      request,
      mode,
      () => bootstrapScenesFromLegacyActivities(payload.sessionId),
    );

    return NextResponse.json({
      ...result,
      next: "scene_registry_ready",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron inicializar las escenas.",
      },
      { status: 500 },
    );
  }
}
