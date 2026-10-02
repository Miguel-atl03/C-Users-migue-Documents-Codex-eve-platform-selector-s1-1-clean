import { NextResponse } from "next/server";
import type { QuestionnaireAnswer } from "@/domain/questionnaire";
import {
  normalizeSessionMode,
  resolveSceneOwner,
  runWithOperationalServerSupabaseClient,
} from "@/lib/session-boundary";
import { saveSceneQuestionAnswers } from "@/services/scene-repository";

type SceneAnswersPayload = {
  mode?: "commercial" | "demo";
  sessionId: string;
  sceneId: string;
  answers: QuestionnaireAnswer[];
};

export async function POST(request: Request) {
  const payload = (await request.json()) as SceneAnswersPayload;
  const mode = normalizeSessionMode(payload.mode);

  if (!payload.sessionId) {
    return NextResponse.json(
      { error: "Falta sessionId para guardar respuestas de escena." },
      { status: 400 },
    );
  }

  if (!payload.sceneId) {
    return NextResponse.json(
      { error: "Falta sceneId para guardar respuestas de escena." },
      { status: 400 },
    );
  }

  if (!payload.answers?.length) {
    return NextResponse.json(
      { error: "No hay respuestas de escena para guardar." },
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
        saveSceneQuestionAnswers({
          sessionId: payload.sessionId,
          sceneId: payload.sceneId,
          answers: payload.answers,
        }),
    );

    return NextResponse.json({
      ...result,
      next: "scene_answers_saved",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron guardar las respuestas de escena.",
      },
      { status: 500 },
    );
  }
}
