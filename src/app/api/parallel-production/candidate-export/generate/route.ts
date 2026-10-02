import { NextResponse } from "next/server";
import { runCandidateExport } from "@/services/parallel-production/runtime/index.mjs";
import {
  observeParallelProductionRuntimeShadow,
  runMbaShadowSafely,
} from "@/services/mba/shadow-observer";

type Payload = {
  session_id?: string;
  sessionId?: string;
  case_id?: string;
  caseId?: string;
  assessment_id?: string;
  assessmentId?: string;
  mode?: "shadow";
  run_id?: string;
};

export async function POST(request: Request) {
  const payload = (await request.json()) as Payload;
  const sessionId = payload.session_id ?? payload.sessionId;
  if (!sessionId) {
    return NextResponse.json(
      { error: "Falta session_id/sessionId para candidate export generate." },
      { status: 400 },
    );
  }

  try {
    const result = await runCandidateExport({ ...payload, session_id: sessionId });
    await runMbaShadowSafely(
      () =>
        observeParallelProductionRuntimeShadow({
          sessionId,
          caseId: payload.case_id ?? payload.caseId ?? sessionId,
          result: {
            candidate_export_package: result.candidate_export_package,
            allow_export_promotion: false,
            syntax_validation_passed: false,
          },
          technicalActor: "parallel_production_candidate_export_generate_route",
        }),
      "mba_shadow_parallel_production_candidate_export_generate",
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo generar candidate_export_package.",
      },
      { status: 500 },
    );
  }
}
