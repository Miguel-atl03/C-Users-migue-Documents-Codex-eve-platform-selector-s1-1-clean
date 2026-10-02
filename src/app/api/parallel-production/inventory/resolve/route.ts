import { NextResponse } from "next/server";
import { runInventoryResolve } from "@/services/parallel-production/runtime/index.mjs";
import {
  observeParallelProductionRuntimeShadow,
  runMbaShadowSafely,
} from "@/services/mba/shadow-observer";

type Payload = {
  session_id?: string;
  sessionId?: string;
  case_id?: string;
  caseId?: string;
  design_source_bundle_id?: string;
  designSourceBundleId?: string;
  mode?: "shadow";
  run_id?: string;
};

export async function POST(request: Request) {
  const payload = (await request.json()) as Payload;
  const sessionId = payload.session_id ?? payload.sessionId;
  if (!sessionId) {
    return NextResponse.json(
      { error: "Falta session_id/sessionId para inventory resolve." },
      { status: 400 },
    );
  }

  try {
    const result = await runInventoryResolve({ ...payload, session_id: sessionId });
    await runMbaShadowSafely(
      () =>
        observeParallelProductionRuntimeShadow({
          sessionId,
          caseId: payload.case_id ?? payload.caseId ?? sessionId,
          result: {
            inventory_id: result.inventory_id,
            structural_facts: result.structural_facts,
            semantic_warnings: result.semantic_warnings,
            gaps: result.gaps,
          },
          technicalActor: "parallel_production_inventory_resolve_route",
        }),
      "mba_shadow_parallel_production_inventory_resolve",
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo resolver el inventario estructural MMABP.",
      },
      { status: 500 },
    );
  }
}
