import type { SupabaseClient } from "@supabase/supabase-js";

import { createAuthenticatedServerSupabaseClient } from "@/lib/supabase-server";
import { bearerTokenFromRequest } from "@/lib/session-boundary";

export type OfficialControlPanelConsultantAuthResult =
  | {
      ok: true;
      consultantUserId: string;
      client: SupabaseClient;
    }
  | {
      ok: false;
      status: 401;
      code: "consultant_auth_required";
      message: string;
    };

const AUTH_MESSAGE = "No fue posible abrir el contexto solicitado.";

export async function authenticateOfficialControlPanelConsultant(
  request: Request,
): Promise<OfficialControlPanelConsultantAuthResult> {
  const token = bearerTokenFromRequest(request);
  if (!token) return authDenied();

  const client = createAuthenticatedServerSupabaseClient(token);
  const { data, error } = await client.auth.getUser(token);

  if (error || !data.user?.id) return authDenied();

  return {
    ok: true,
    consultantUserId: data.user.id,
    client,
  };
}

function authDenied(): OfficialControlPanelConsultantAuthResult {
  return {
    ok: false,
    status: 401,
    code: "consultant_auth_required",
    message: AUTH_MESSAGE,
  };
}
