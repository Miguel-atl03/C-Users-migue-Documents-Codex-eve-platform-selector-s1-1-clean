import { NextResponse } from "next/server";
import {
  normalizeSessionMode,
  resolveSessionOwner,
  runWithOperationalServerSupabaseClient,
} from "@/lib/session-boundary";
import type { SignificadoBlock0Answers } from "@/domain/significado-de-trabajo";
import { persistSignificadoBlock0Answers } from "@/services/significado-block0-repository";
import { persistCanonicalSignificadoBlock0 } from "@/services/significado-runtime-block0-repository";

type SignificadoBlock0Payload = {
  mode?: "commercial" | "demo";
  sessionId?: string;
  answers?: SignificadoBlock0Answers;
  activityTitle?: string;
  legacyActivityId?: string | null;
};

export async function POST(request: Request) {
  const payload = (await request.json()) as SignificadoBlock0Payload;
  const mode = normalizeSessionMode(payload.mode);

  if (!payload.answers || !Object.keys(payload.answers).length) {
    return NextResponse.json(
      { error: "No hay respuestas Block 0 para guardar." },
      { status: 400 },
    );
  }

  if (mode === "commercial") {
    try {
      const canonical = await persistCanonicalSignificadoBlock0(request, {
        answers: payload.answers,
      });

      if (!canonical.ok) {
        return NextResponse.json(
          { error: canonical.error, mode },
          { status: canonical.status },
        );
      }

      return NextResponse.json({
        mode,
        persistedCount: canonical.result.subfieldResponseCount,
        runtime: canonical.result,
      });
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "No se pudieron guardar las respuestas Block 0 en Runtime.",
        },
        { status: 500 },
      );
    }
  }

  if (!payload.sessionId?.trim()) {
    return NextResponse.json(
      { error: "Falta sessionId para guardar Block 0 de Significado." },
      { status: 400 },
    );
  }

  const sessionResult = await resolveSessionOwner(request, payload.sessionId, mode);
  if (!sessionResult.session) {
    return NextResponse.json(
      { error: sessionResult.error, mode },
      { status: sessionResult.status },
    );
  }

  try {
    const result = await runWithOperationalServerSupabaseClient(request, mode, () =>
      persistSignificadoBlock0Answers({
        sessionId: payload.sessionId!.trim(),
        answers: payload.answers!,
        activityTitle: payload.activityTitle,
        legacyActivityId: payload.legacyActivityId,
      }),
    );

    return NextResponse.json({
      sessionId: payload.sessionId,
      persistedCount: result.persistedCount,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron guardar las respuestas Block 0.",
      },
      { status: 500 },
    );
  }
}
