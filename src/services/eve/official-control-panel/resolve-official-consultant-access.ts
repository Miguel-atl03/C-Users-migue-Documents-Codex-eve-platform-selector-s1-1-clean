import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { OFFICIAL_PANEL_AUTH_COOKIE_NAME } from "@/lib/official-panel-auth-config";

export type OfficialConsultantAccess =
  | { status: "anonymous" }
  | { status: "forbidden"; userId: string }
  | {
      status: "authorized";
      userId: string;
      companyIds: string[];
    };

function requirePublicSupabaseEnv(): { url: string; anonKey: string } {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  if (!url || !anonKey) {
    throw new Error("supabase_public_environment_missing");
  }
  return { url, anonKey };
}

/**
 * Cookie-backed Supabase server client (anon key only). Never service_role.
 */
export async function createOfficialSupabaseServerClient() {
  const { url, anonKey } = requirePublicSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookieOptions: {
      name: OFFICIAL_PANEL_AUTH_COOKIE_NAME,
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot always mutate cookies; middleware refreshes.
        }
      },
    },
  });
}

/**
 * Server-only consultant capability resolution from SSR session + assignments.
 * Uses the authenticated user JWT under RLS — never service_role.
 */
export async function resolveOfficialConsultantAccess(): Promise<OfficialConsultantAccess> {
  const client = await createOfficialSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user?.id) {
    return { status: "anonymous" };
  }

  const now = new Date().toISOString();
  const { data, error: assignmentError } = await client
    .from("consultant_company_assignments")
    .select("client_company_id")
    .eq("consultant_user_id", user.id)
    .eq("status", "enabled")
    .lte("valid_from", now)
    .or(`valid_until.is.null,valid_until.gte.${now}`);

  if (assignmentError) {
    return { status: "forbidden", userId: user.id };
  }

  const companyIds = [
    ...new Set(
      (data ?? [])
        .map((row) =>
          row?.client_company_id ? String(row.client_company_id) : "",
        )
        .filter((id) => id.length > 0),
    ),
  ];

  if (companyIds.length === 0) {
    return { status: "forbidden", userId: user.id };
  }

  return {
    status: "authorized",
    userId: user.id,
    companyIds,
  };
}
