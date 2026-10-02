import { NextResponse } from "next/server";

import { aggregateClientCausalOutputs } from "@/services/client-causal-aggregation-engine";
import {
  loadClientSessionCausalInputs,
  loadClientSessionCausalInputsBySessionIds,
  persistClientCausalAggregationOutput,
} from "@/services/client-causal-aggregation-repository";

type RequestBody = {
  empresaId?: string;
  sessionIds?: string[];
  persist?: boolean;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    if (!body.empresaId && (!body.sessionIds || body.sessionIds.length === 0)) {
      return NextResponse.json(
        { error: "empresaId or sessionIds are required." },
        { status: 400 },
      );
    }

    const inputs = body.empresaId
      ? await loadClientSessionCausalInputs({
          empresaId: body.empresaId,
          sessionIds: body.sessionIds,
        })
      : await loadClientSessionCausalInputsBySessionIds({
          sessionIds: body.sessionIds ?? [],
        });

    if (inputs.length === 0) {
      return NextResponse.json(
        {
          error:
            "No session_causal_outputs were found for this empresaId/sessionIds.",
        },
        { status: 404 },
      );
    }

    const output = aggregateClientCausalOutputs(inputs);
    const shouldPersist = body.persist === true;
    const persistence = shouldPersist
      ? await persistClientCausalAggregationOutput({ output })
      : {
          persisted: false,
          aggregation_run_id: null,
          client_causal_output_id: null,
          node_aggregation_count: 0,
          contradiction_count: 0,
        };

    return NextResponse.json({
      ok: true,
      output,
      persistence,
      next: output.needs_reentry_client
        ? "capa2_5_client_reentry_or_more_role_lenses_required"
        : "capa2_5_client_preliminary_aggregation_ready",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to run Capa 2.5 client aggregation.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
