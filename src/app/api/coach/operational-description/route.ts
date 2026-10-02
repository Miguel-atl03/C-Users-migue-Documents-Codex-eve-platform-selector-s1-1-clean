import { NextResponse } from "next/server";
import {
  normalizeSessionMode,
  resolveSessionOwner,
  runWithOperationalServerSupabaseClient,
} from "@/lib/session-boundary";
import {
  listOperationalDescriptionCoachEvents,
  persistOperationalDescriptionCoachTrace,
} from "@/services/operational-description-coach/operational-description-coach-repository";
import { resolveOperationalDescriptionCoach } from "@/services/operational-description-coach/resolve-operational-description-coach";
import type { OperationalDescriptionContext } from "@/services/operational-description-coach/types";

type OperationalDescriptionCoachPayload = {
  mode?: "commercial" | "demo";
  sessionId?: string;
  draftText?: string;
  context?: OperationalDescriptionContext;
  workMapActivityId?: string | null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId")?.trim();
  const workMapActivityId = searchParams.get("workMapActivityId")?.trim() || null;
  const mode = normalizeSessionMode(searchParams.get("mode"));

  if (!sessionId) {
    return NextResponse.json(
      { error: "Falta sessionId para consultar la trazabilidad del coach." },
      { status: 400 },
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
    const events = await runWithOperationalServerSupabaseClient(
      request,
      mode,
      () =>
        listOperationalDescriptionCoachEvents({
          sessionId,
          workMapActivityId,
        }),
    );

    return NextResponse.json({
      events,
      sessionId,
      workMapActivityId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo consultar la trazabilidad del coach.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const payload = (await request.json()) as OperationalDescriptionCoachPayload;
  const mode = normalizeSessionMode(payload.mode);

  if (!payload.sessionId?.trim()) {
    return NextResponse.json(
      { error: "Falta sessionId para asistir la descripción operativa." },
      { status: 400 },
    );
  }

  if (typeof payload.draftText !== "string") {
    return NextResponse.json(
      { error: "Falta draftText para asistir la descripción operativa." },
      { status: 400 },
    );
  }

  const sessionId = payload.sessionId.trim();
  const draftText = payload.draftText;
  const sessionResult = await resolveSessionOwner(request, sessionId, mode);
  if (!sessionResult.session) {
    return NextResponse.json(
      { error: sessionResult.error, mode },
      { status: sessionResult.status },
    );
  }

  try {
    const result = await resolveOperationalDescriptionCoach({
      sessionId,
      draftText,
      context: payload.context ?? {},
    });

    const persistedEvent = await runWithOperationalServerSupabaseClient(
      request,
      mode,
      () =>
        persistOperationalDescriptionCoachTrace({
          sessionId,
          draftText,
          context: payload.context ?? {},
          result,
          workMapActivityId: payload.workMapActivityId,
        }),
    );

    return NextResponse.json({
      coachSource: result.coachSource ?? "deterministic",
      exampleFragment: result.exampleFragment,
      llmConfigured: Boolean(process.env.OPENAI_API_KEY?.trim()),
      message: result.message,
      persistedEventId: persistedEvent?.eventId ?? null,
      cyberneticEvaluation: result.cyberneticEvaluation ?? null,
      scan: {
        coachTier: result.scan.coachTier,
        priorityGap: result.scan.priorityGap,
        sufficiency: result.scan.sufficiency,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo generar la asistencia de descripción operativa.",
      },
      { status: 500 },
    );
  }
}
