import { NextResponse } from "next/server";

import { createServiceRoleServerSupabaseClient } from "@/lib/supabase-server";
import { replayAndPersistActivitySelection } from "@/services/eve/official-control-panel/official-control-panel-activity-selection-replay";

export const dynamic = "force-dynamic";

type ReplayRequest = {
  selectionResultId?: unknown;
};

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ status: "error", code, message }, { status });
}

function stringField(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function serviceKey() {
  return (
    process.env.STAGING_SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    ""
  );
}

export async function POST(request: Request) {
  const expected = serviceKey();
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!expected || !bearer || bearer !== expected) {
    return jsonError(401, "service_authorization_required", "Replay requiere autoridad server-side.");
  }

  const body = (await request.json().catch(() => ({}))) as ReplayRequest;
  const selectionResultId = stringField(body.selectionResultId);
  if (!selectionResultId) {
    return jsonError(400, "selection_result_id_required", "Falta selectionResultId.");
  }

  try {
    const result = await replayAndPersistActivitySelection({
      client: createServiceRoleServerSupabaseClient(),
      selectionResultId,
    });
    return NextResponse.json({
      status: "ok",
      selectionResultId: result.selectionResultId,
      replayStatus: result.replayStatus,
      replayedAt: result.replayedAt,
      replayHash: result.replayHash,
      recomputedResultHash: result.recomputedResultHash,
      persistedResultHash: result.persistedResultHash,
      diffCount: result.diffs.length,
      diffs: result.diffs,
    });
  } catch (error) {
    console.error("[activity-selection-replay] failed", {
      code: error instanceof Error ? error.message : "unknown",
    });
    return jsonError(500, "activity_selection_replay_failed", "No fue posible ejecutar el replay.");
  }
}
