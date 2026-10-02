import { NextResponse } from "next/server";
import { runAssessment } from "@/services/parallel-production/runtime/index.mjs";
import {
  observeParallelProductionRuntimeShadow,
  runMbaShadowSafely,
} from "@/services/mba/shadow-observer";

type Payload = {
  session_id?: string;
  sessionId?: string;
  case_id?: string;
  caseId?: string;
  mmabp_ir_id?: string;
  mmabpIrId?: string;
  mode?: "shadow";
  run_id?: string;
};

export async function POST(request: Request) {
  const payload = (await request.json()) as Payload;
  const sessionId = payload.session_id ?? payload.sessionId;
  if (!sessionId) {
    return NextResponse.json(
      { error: "Falta session_id/sessionId para assessment run." },
      { status: 400 },
    );
  }

  try {
    const result = await runAssessment({ ...payload, session_id: sessionId });
    await runMbaShadowSafely(
      () =>
        observeParallelProductionRuntimeShadow({
          sessionId,
          caseId: payload.case_id ?? payload.caseId ?? sessionId,
          result: {
            assessment_id: result.assessment_id,
            assessment_status: result.assessment_status,
            findings: result.findings,
            conformance_warnings: result.conformance_warnings,
            consistency_warnings: result.consistency_warnings,
          },
          technicalActor: "parallel_production_assessment_run_route",
        }),
      "mba_shadow_parallel_production_assessment_run",
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo ejecutar el assessment de consistencia arquitectonica.",
      },
      { status: 500 },
    );
  }
}
