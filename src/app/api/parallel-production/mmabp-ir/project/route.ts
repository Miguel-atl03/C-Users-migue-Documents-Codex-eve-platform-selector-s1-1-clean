import { NextResponse } from "next/server";
import { runMmabpIrProject } from "@/services/parallel-production/runtime/index.mjs";
import {
  observeParallelProductionRuntimeShadow,
  runMbaShadowSafely,
} from "@/services/mba/shadow-observer";

type Payload = {
  session_id?: string;
  sessionId?: string;
  case_id?: string;
  caseId?: string;
  inventory_id?: string;
  inventoryId?: string;
  mode?: "shadow";
  run_id?: string;
};

export async function POST(request: Request) {
  const payload = (await request.json()) as Payload;
  const sessionId = payload.session_id ?? payload.sessionId;
  if (!sessionId) {
    return NextResponse.json(
      { error: "Falta session_id/sessionId para proyectar MMABP-IR." },
      { status: 400 },
    );
  }

  try {
    const result = await runMmabpIrProject({ ...payload, session_id: sessionId });
    await runMbaShadowSafely(
      () =>
        observeParallelProductionRuntimeShadow({
          sessionId,
          caseId: payload.case_id ?? payload.caseId ?? sessionId,
          result: {
            mmabp_ir_id: result.mmabp_ir_id,
            registry_candidates: result.registry_candidates,
            ir_warnings: result.ir_warnings,
            gaps: result.gaps,
          },
          technicalActor: "parallel_production_mmabp_ir_project_route",
        }),
      "mba_shadow_parallel_production_mmabp_ir_project",
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo proyectar MMABP-IR.",
      },
      { status: 500 },
    );
  }
}
