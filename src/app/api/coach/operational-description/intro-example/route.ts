import { NextResponse } from "next/server";
import {
  normalizeSessionMode,
  resolveSessionOwner,
  runWithOperationalServerSupabaseClient,
} from "@/lib/session-boundary";
import { buildLocalDemoIntroExamplePayload } from "@/services/operational-description-coach/local-demo-intro-example";
import { resolveOperationalDescriptionIntroExample } from "@/services/operational-description-coach/resolve-operational-description-intro-example";
import type { OperationalDescriptionContext } from "@/services/operational-description-coach/types";

type IntroExamplePayload = {
  mode?: "commercial" | "demo";
  sessionId?: string;
  context?: OperationalDescriptionContext;
  deterministicFallback?: string;
};

async function readIntroExamplePayload(request: Request) {
  try {
    return (await request.json()) as IntroExamplePayload;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const payload = await readIntroExamplePayload(request);
  if (!payload) {
    return NextResponse.json(
      { error: "Payload invalido para generar el ejemplo." },
      { status: 400 },
    );
  }

  const mode = normalizeSessionMode(payload.mode);

  if (!payload.sessionId?.trim()) {
    return NextResponse.json(
      { error: "Falta sessionId para generar el ejemplo pedagógico." },
      { status: 400 },
    );
  }

  if (!payload.deterministicFallback?.trim()) {
    return NextResponse.json(
      { error: "Falta deterministicFallback para generar el ejemplo." },
      { status: 400 },
    );
  }

  const sessionId = payload.sessionId.trim();

  if (mode === "demo") {
    return NextResponse.json(
      buildLocalDemoIntroExamplePayload(payload.deterministicFallback),
    );
  }

  const sessionResult = await resolveSessionOwner(request, sessionId, mode);
  if (!sessionResult.session) {
    return NextResponse.json(
      { error: sessionResult.error, mode },
      { status: sessionResult.status },
    );
  }

  try {
    await runWithOperationalServerSupabaseClient(request, mode, async () => null);

    const result = await resolveOperationalDescriptionIntroExample({
      sessionId,
      context: payload.context ?? {},
      deterministicFallback: payload.deterministicFallback,
    });

    return NextResponse.json({
      exampleNarrative: result.exampleNarrative,
      exampleSource: result.exampleSource,
      llmConfigured: Boolean(process.env.OPENAI_API_KEY?.trim()),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo generar el ejemplo pedagógico.",
      },
      { status: 500 },
    );
  }
}
