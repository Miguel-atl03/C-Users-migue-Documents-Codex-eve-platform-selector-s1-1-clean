import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import type { Pr3Principal } from "./contracts";
import { PR3_PROJECT_REF, PR3_SUPABASE_URL } from "./target";

export class Pr3AuthError extends Error { constructor(public status = 401, message = "pr3_auth_required") { super(message); } }

function bearer(request: NextRequest) {
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

export async function resolvePr3Principal(request: NextRequest): Promise<Pr3Principal> {
  const mode = process.env.EVE_PR3_PILOT_AUTH_MODE ?? "disabled";
  if (mode === "supabase_user") {
    const token = bearer(request);
    if (!token) throw new Pr3AuthError();
    const url = process.env.NEXT_PUBLIC_EVE_PR3_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_EVE_PR3_SUPABASE_PUBLISHABLE_KEY;
    if (url !== PR3_SUPABASE_URL || !key?.startsWith("sb_publishable_") ||
        process.env.EVE_PR3_EXPECTED_PROJECT_REF !== PR3_PROJECT_REF) {
      throw new Pr3AuthError(503, "pr3_clean_auth_not_configured");
    }
    // Unverified claims may reject a token, but only the clean Auth server can accept it.
    try {
      const claims = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
      if (claims.iss !== `${PR3_SUPABASE_URL}/auth/v1` || claims.role !== "authenticated") {
        throw new Pr3AuthError(401, "pr3_clean_auth_token_rejected");
      }
    } catch { throw new Pr3AuthError(401, "pr3_clean_auth_token_rejected"); }
    const auth = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(10_000) }) },
    });
    let userId: string;
    try {
      const { data, error } = await auth.auth.getUser(token);
      if (error || !data.user || data.user.is_anonymous) throw new Pr3AuthError(401, "pr3_clean_auth_token_rejected");
      userId = data.user.id;
    } catch (error) {
      if (error instanceof Pr3AuthError) throw error;
      throw new Pr3AuthError(503, "pr3_clean_auth_unavailable");
    }
    const scope_ref = process.env.EVE_PR3_PILOT_SCOPE_REF?.trim();
    const activity_ref = process.env.EVE_PR3_PILOT_ACTIVITY_REF?.trim();
    if (!scope_ref || !activity_ref) throw new Pr3AuthError(503, "pr3_clean_auth_scope_not_configured");
    return { principal_ref: `supabase:${PR3_PROJECT_REF}:${userId}`, scope_ref, activity_ref, auth_mode: "supabase_user" };
  }
  if (mode === "local_test") {
    if (process.env.NODE_ENV === "production") throw new Pr3AuthError(503, "pr3_local_test_auth_forbidden_in_production");
    const principal_ref = request.headers.get("x-eve-pr3-principal-ref")?.trim() || "local-pr3-operator";
    const scope_ref = request.headers.get("x-eve-pr3-scope-ref")?.trim() || "CASE-LOCAL-PR3";
    const activity_ref = request.headers.get("x-eve-pr3-activity-ref")?.trim() || "ACT-LOCAL-PR3";
    return { principal_ref, scope_ref, activity_ref, auth_mode: "local_test" };
  }
  if (mode === "static_bearer") {
    if (process.env.NODE_ENV === "production") throw new Pr3AuthError(503, "pr3_static_bearer_forbidden_in_production");
    const expected = process.env.EVE_PR3_PILOT_BEARER_TOKEN ?? "";
    if (!expected || bearer(request) !== expected) throw new Pr3AuthError();
    const principal_ref = process.env.EVE_PR3_PILOT_PRINCIPAL_REF ?? "";
    const scope_ref = process.env.EVE_PR3_PILOT_SCOPE_REF ?? "";
    const activity_ref = process.env.EVE_PR3_PILOT_ACTIVITY_REF ?? "";
    if (!principal_ref || !scope_ref || !activity_ref) throw new Pr3AuthError(503, "pr3_static_bearer_scope_not_configured");
    return { principal_ref, scope_ref, activity_ref, auth_mode: "static_bearer" };
  }
  throw new Pr3AuthError(503, "pr3_clean_auth_not_configured");
}
