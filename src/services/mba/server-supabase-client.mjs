import { createClient } from "@supabase/supabase-js";

const SERVICE_ROLE_ENV_KEYS = ["MBA_SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_ROLE_KEY"];

export function resolveMbaServiceRoleConfig(env = process.env) {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL ?? null;
  const keyName = SERVICE_ROLE_ENV_KEYS.find((name) => Boolean(env[name]));
  const serviceRoleKey = keyName ? env[keyName] : null;

  if (!supabaseUrl) {
    return {
      ok: false,
      error_code: "MBA_SUPABASE_URL_MISSING",
      error_message: "NEXT_PUBLIC_SUPABASE_URL is not configured for server-side MBA persistence.",
      key_name: null,
    };
  }

  if (!serviceRoleKey) {
    return {
      ok: false,
      error_code: "MBA_SERVICE_ROLE_KEY_MISSING",
      error_message:
        "MBA service role key is missing. Set MBA_SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY.",
      key_name: null,
    };
  }

  return {
    ok: true,
    supabase_url: supabaseUrl,
    service_role_key: serviceRoleKey,
    key_name: keyName,
  };
}

export function createMbaServiceRoleSupabaseClient(env = process.env) {
  const config = resolveMbaServiceRoleConfig(env);
  if (!config.ok) {
    return {
      client: null,
      auth_mode: "unavailable",
      error_code: config.error_code,
      error_message: config.error_message,
      key_name: null,
    };
  }

  return {
    client: createClient(config.supabase_url, config.service_role_key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }),
    auth_mode: "service_role",
    error_code: null,
    error_message: null,
    key_name: config.key_name,
  };
}

