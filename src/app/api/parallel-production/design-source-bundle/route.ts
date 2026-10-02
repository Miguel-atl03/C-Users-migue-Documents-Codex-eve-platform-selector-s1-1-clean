import { NextResponse } from "next/server";
import { buildMmabpDesignSourceBundle } from "@/services/parallel-production-design-source-bundle";
import { persistDesignSourceBundleRuntime } from "@/services/parallel-production/runtime/index.mjs";
import {
  observeParallelProductionShadow,
  runMbaShadowSafely,
} from "@/services/mba/shadow-observer";

type DesignSourceBundlePayload = {
  sessionId?: string;
};

export async function POST(request: Request) {
  const payload = (await request.json()) as DesignSourceBundlePayload;

  if (!payload.sessionId) {
    return NextResponse.json(
      { error: "Falta sessionId para generar el handoff lateral MMABP." },
      { status: 400 },
    );
  }

  try {
    const result = await buildMmabpDesignSourceBundle({
      sessionId: payload.sessionId,
    });
    const runtimePersistence = await persistDesignSourceBundleRuntime({
      session_id: payload.sessionId,
      case_id: payload.sessionId,
      bundle: result.bundle,
    });

    await runMbaShadowSafely(
      () =>
        observeParallelProductionShadow({
          sessionId: payload.sessionId,
          result,
        }),
      "mba_shadow_parallel_production",
    );

    return NextResponse.json({
      ...result,
      runtime_persistence: runtimePersistence.persistence,
      next: "mmabp_design_source_bundle_ready",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo generar el bundle lateral MMABP.",
      },
      { status: 500 },
    );
  }
}
