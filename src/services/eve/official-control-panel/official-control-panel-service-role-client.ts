import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SERVICE_ROLE_KEYS = [
  "EVE_SUPABASE_LOCAL_SERVICE_ROLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

/**
 * Server-only service-role client for governed RPCs (§16 experience-actions).
 * Never expose this client or key to the browser.
 * Fail closed: requires an env service-role key (no loopback JWT fallback).
 */
export function createOfficialControlPanelServiceRoleClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) {
    throw new Error("supabase_url_missing");
  }
  let key: string | null = null;
  for (const name of SERVICE_ROLE_KEYS) {
    const value = process.env[name]?.trim();
    if (value) {
      key = value;
      break;
    }
  }
  if (!key) {
    throw new Error("supabase_service_role_missing");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
