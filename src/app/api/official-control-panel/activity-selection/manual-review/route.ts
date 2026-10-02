import { NextResponse } from "next/server";

import { authenticateCommercialRequest } from "@/lib/session-boundary";
import { createServiceRoleServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type ManualReviewRequest = {
  itemId?: unknown;
  caseId?: unknown;
  state?: unknown;
  justification?: unknown;
  after?: unknown;
};

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ status: "error", code, message }, { status });
}

function stringField(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const auth = await authenticateCommercialRequest(request);
  if (!auth.user) {
    return jsonError(
      auth.status,
      "auth_required",
      auth.error ?? "Commercial mode requires an authenticated Supabase user.",
    );
  }

  const body = (await request.json().catch(() => ({}))) as ManualReviewRequest;
  const itemId = stringField(body.itemId);
  const caseId = stringField(body.caseId);
  const state = stringField(body.state);
  const justification = stringField(body.justification);

  if (!itemId || !caseId || !state || !justification) {
    return jsonError(400, "manual_review_payload_required", "Faltan datos para registrar la revision.");
  }

  const service = createServiceRoleServerSupabaseClient();
  const { data, error } = await service.rpc("register_activity_selection_manual_review", {
    p_item_id: itemId,
    p_new_state: state,
    p_actor_auth_user_id: auth.user.authUserId,
    p_actor_role: "consultant",
    p_case_id: caseId,
    p_justification: justification,
    p_after: body.after && typeof body.after === "object" ? body.after : {},
  });

  if (error) {
    return jsonError(403, "manual_review_rejected", error.message);
  }

  return NextResponse.json({
    status: "ok",
    itemId: data?.id ?? itemId,
    caseId,
    manualReviewState: data?.manual_review_state ?? state,
    reviewedAt: data?.reviewed_at ?? null,
  });
}
