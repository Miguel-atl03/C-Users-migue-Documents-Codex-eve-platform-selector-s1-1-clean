import { NextResponse } from "next/server";

import type { CausalPersistenceResult } from "@/domain/causal";
import { persistCausalDiagnosticOutput } from "@/services/causal-output-repository";
import { runCausalTransductionMvp } from "@/services/causal-transduction-engine";

const CAUSAL_ROUTE_RELOAD_MARKER = "n03_symptom_root_calibration_v1";

type RequestBody = {
  sessionId?: string;
  persist?: boolean;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    if (!body.sessionId) {
      return NextResponse.json(
        { error: "sessionId is required." },
        { status: 400 },
      );
    }

    const output = await runCausalTransductionMvp(body.sessionId);
    const shouldPersist = body.persist !== false;
    const persistence: CausalPersistenceResult = shouldPersist
      ? await persistCausalDiagnosticOutput({ output })
      : {
          persisted: false,
          session_causal_output_id: null,
          scene_causal_activation_count: 0,
          causal_rule_execution_count: 0,
        };

    return NextResponse.json({
      ok: true,
      marker: CAUSAL_ROUTE_RELOAD_MARKER,
      output,
      persistence,
      next: output.needs_reentry
        ? "capa2_reentry_or_expert_review_required"
        : "capa2_preliminary_diagnostic_ready",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to run Capa 2 diagnostic.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
