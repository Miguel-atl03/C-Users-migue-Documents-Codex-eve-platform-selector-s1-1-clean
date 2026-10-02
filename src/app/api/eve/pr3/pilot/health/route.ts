import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createPr3Repository } from "@/services/eve/pr3/repository";
import { probePr3RuntimeBoundary } from "@/services/eve/pr3/execution-service";
import { PR3_PROJECT_REF, validatePr3DatabaseTarget } from "@/services/eve/pr3/target";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.EVE_PR3_ACTION_TOKEN_SECRET;
  const supplied = request.headers.get("x-eve-pr3-health-proof") ?? "";
  const expected = secret ? createHmac("sha256", secret).update("EVE_PR3_P4_HEALTH_V1").digest("hex") : "";
  if (!expected || !/^[a-f0-9]{64}$/.test(supplied) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) {
    return NextResponse.json({ error: "pr3_health_auth_required" }, { status: 401 });
  }

  let wrongTargetRejected = false;
  try {
    validatePr3DatabaseTarget("postgresql://postgres@wrong.invalid/postgres", process.env.EVE_PR3_EXPECTED_PROJECT_REF);
  } catch (error) {
    wrongTargetRejected = error instanceof Error && error.message === "pr3_clean_database_target_mismatch";
  }
  const runtime = probePr3RuntimeBoundary();
  const database = process.env.EVE_PR3_PERSISTENCE_MODE === "postgres"
    ? await createPr3Repository().health()
    : { ok: false, target: "postgres", detail: "pr3_persistence_mode_not_configured" };
  const code = database.ok ? "OK" : database.detail === "pr3_clean_database_not_configured"
    ? "CLEAN_PR3_DATABASE_SECRET_UNAVAILABLE_TO_EXECUTION_CONTEXT" : "PR3_DATABASE_HEALTH_FAILED";
  return NextResponse.json({
    target_ref: PR3_PROJECT_REF,
    database: { ok: database.ok, code },
    wrong_target_guard: wrongTargetRejected,
    runtime,
    deployed_sha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
  }, {
    status: database.ok && wrongTargetRejected && runtime.fail_closed ? 200 : 503,
    headers: { "Cache-Control": "private, no-store" },
  });
}
