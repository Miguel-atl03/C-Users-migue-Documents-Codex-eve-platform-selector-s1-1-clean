import type { SupabaseClient, Session } from "@supabase/supabase-js";

import { OFFICIAL_PANEL_AUTH_COOKIE_NAME } from "@/lib/official-panel-auth-config";

export type AuthReadiness =
  | "checking"
  | "authenticated"
  | "unauthenticated"
  | "error";

/**
 * Shared across React Strict Mode remounts so concurrent getSession/setSession
 * do not contend on the Supabase auth lock and leave the UI stuck in "checking".
 */
let sharedBootstrapPromise: Promise<string | null> | null = null;

export function resetConsultantBootstrapCache(): void {
  sharedBootstrapPromise = null;
}

/** @deprecated Prefer resetConsultantBootstrapCache */
export const resetLocalConsultantBootstrapCache = resetConsultantBootstrapCache;

/**
 * Resolves a real Supabase access token for the official panel.
 *
 * Order:
 * 1. JWT already present in localStorage (Playwright / prior setSession).
 * 2. Existing browser session (getSession), with timeout.
 *
 * Never treats role cookies as JWT. Never uses service role on the client.
 */
export async function ensureConsultantAccessToken(
  client: SupabaseClient,
): Promise<string | null> {
  if (!sharedBootstrapPromise) {
    sharedBootstrapPromise = resolveConsultantAccessToken(client)
      .then((token) => {
        // Do not cache a failed bootstrap forever — remount/retry must retry.
        if (!token) {
          sharedBootstrapPromise = null;
        }
        return token;
      })
      .catch(() => {
        sharedBootstrapPromise = null;
        return null;
      });
  }
  return sharedBootstrapPromise;
}

/** @deprecated Prefer ensureConsultantAccessToken */
export const ensureLocalConsultantAccessToken = ensureConsultantAccessToken;

const AUTH_CALL_TIMEOUT_MS = 5000;

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), ms);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

function tokenFromUnknownSession(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const direct = record.access_token;
  if (typeof direct === "string" && direct.trim().length > 20) {
    return direct.trim();
  }
  const nested = record.currentSession;
  if (nested && typeof nested === "object") {
    const nestedToken = (nested as Record<string, unknown>).access_token;
    if (typeof nestedToken === "string" && nestedToken.trim().length > 20) {
      return nestedToken.trim();
    }
  }
  return null;
}

/**
 * Fast path: read JWT planted by Playwright initScript or a prior setSession
 * without waiting on GoTrue navigator.locks.
 */
export function readAccessTokenFromLocalStorage(): string | null {
  if (typeof window === "undefined") return null;
  const hostname =
    (typeof process !== "undefined" &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (() => {
        try {
          return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
        } catch {
          return "";
        }
      })()) ||
    "";
  const derived =
    hostname.length > 0
      ? `sb-${hostname.split(".")[0]}-auth-token`
      : "sb-127-auth-token";
  const keys = [
    OFFICIAL_PANEL_AUTH_COOKIE_NAME,
    derived,
    "sb-127-auth-token",
    "sb-127.0.0.1-auth-token",
    "sb-localhost-auth-token",
  ];
  for (const key of keys) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const token = tokenFromUnknownSession(JSON.parse(raw));
      if (token) return token;
    } catch {
      // ignore malformed entries
    }
  }
  return null;
}

async function resolveConsultantAccessToken(
  client: SupabaseClient,
): Promise<string | null> {
  const fromStorage = readAccessTokenFromLocalStorage();
  if (fromStorage) return fromStorage;

  const existing = await withTimeout(
    readAccessToken(client),
    AUTH_CALL_TIMEOUT_MS,
  );
  if (existing) return existing;

  return null;
}

export async function readAccessToken(
  client: SupabaseClient,
): Promise<string | null> {
  const { data, error } = await client.auth.getSession();
  if (error) return null;
  return data.session?.access_token ?? null;
}

export function accessTokenFromSession(session: Session | null): string | null {
  const token = session?.access_token?.trim() ?? "";
  return token.length > 0 ? token : null;
}
