#!/usr/bin/env node
/**
 * Create a local Supabase consultant session (replaces the removed
 * App Router POST /api/.../local-session product endpoint).
 *
 * Reads: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 *        EVE_UNIT2B_TEST_PASSWORD
 * Optional: --email <address> (default unit2b-consultant@example.invalid)
 *
 * Rejects non-localhost / 127.0.0.1 Supabase URLs.
 * Prints JSON session tokens to stdout. Exits non-zero on failure.
 */

const DEFAULT_EMAIL = "unit2b-consultant@example.invalid";

function parseEmailArg(argv) {
  const idx = argv.indexOf("--email");
  if (idx >= 0 && argv[idx + 1]) return String(argv[idx + 1]).trim();
  return DEFAULT_EMAIL;
}

function assertLocalSupabaseUrl(url) {
  let host;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    throw new Error("invalid_supabase_url");
  }
  if (host !== "127.0.0.1" && host !== "localhost") {
    throw new Error("remote_supabase_url_rejected");
  }
}

async function main() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  const password = (process.env.EVE_UNIT2B_TEST_PASSWORD ?? "").trim();
  const email = parseEmailArg(process.argv.slice(2));

  if (!url || !anonKey || !password) {
    throw new Error("local_session_environment_missing");
  }

  assertLocalSupabaseUrl(url);

  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`local_session_failed:${response.status}`);
  }

  const body = await response.json();
  if (!body?.access_token || !body?.refresh_token) {
    throw new Error("local_session_tokens_missing");
  }

  console.log(
    JSON.stringify({
      access_token: body.access_token,
      refresh_token: body.refresh_token,
      expires_at: body.expires_at,
      expires_in: body.expires_in,
      token_type: body.token_type ?? "bearer",
      user: body.user
        ? { id: body.user.id, email: body.user.email }
        : undefined,
    }),
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : "local_session_failed",
    }),
  );
  process.exit(1);
});
