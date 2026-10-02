import { NextResponse } from "next/server";
import {
  normalizeSessionMode,
  resolveSessionOwner,
  runWithOperationalServerSupabaseClient,
} from "@/lib/session-boundary";
import { buildSessionIntermediateOutput } from "@/services/session-intermediate-output-builder";
import {
  observeSessionIntermediateOutputShadow,
  runMbaShadowSafely,
} from "@/services/mba/shadow-observer";

type SessionIntermediateOutputPayload = {
  mode?: "commercial" | "demo";
  sessionId: string;
};

export async function POST(request: Request) {
  const payload = (await request.json()) as SessionIntermediateOutputPayload;
  const mode = normalizeSessionMode(payload.mode);

  if (!payload.sessionId) {
    return NextResponse.json(
      { error: "Falta sessionId para generar salida intermedia." },
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
      () =>
        buildSessionIntermediateOutput({
          sessionId: payload.sessionId,
        }),
    );

    await runMbaShadowSafely(
      () =>
        observeSessionIntermediateOutputShadow({
          sessionId: payload.sessionId,
          result,
        }),
      "mba_shadow_session_intermediate_output",
    );

    return NextResponse.json({
      ...result,
      next: "session_intermediate_output_ready",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo generar la salida intermedia de sesion.",
      },
      { status: 500 },
    );
  }
}
