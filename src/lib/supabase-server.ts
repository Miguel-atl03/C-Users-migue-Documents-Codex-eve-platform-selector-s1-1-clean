import { createClient } from "@supabase/supabase-js";
import { AsyncLocalStorage } from "node:async_hooks";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.STAGING_SUPABASE_SECRET_KEY ??
  process.env.NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

function requireSupabaseEnv(): { url: string; anonKey: string } {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  return { url: supabaseUrl, anonKey: supabaseAnonKey };
}

let supabaseAnonServerInstance: SupabaseClient | null = null;

function getSupabaseAnonServerInstance(): SupabaseClient {
  const { url, anonKey } = requireSupabaseEnv();

  if (!supabaseAnonServerInstance) {
    supabaseAnonServerInstance = createClient(url, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseAnonServerInstance;
}

export const supabaseAnonServer = new Proxy({} as SupabaseClient, {
  get(_target, property) {
    const client = getSupabaseAnonServerInstance();
    const value = (client as unknown as Record<PropertyKey, unknown>)[property];

    return typeof value === "function" ? value.bind(client) : value;
  },
});

const requestClientStorage = new AsyncLocalStorage<SupabaseClient>();

export function createAuthenticatedServerSupabaseClient(accessToken: string) {
  const { url, anonKey } = requireSupabaseEnv();

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

export function createServiceRoleServerSupabaseClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase private server environment variables are missing.");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function runWithServerSupabaseClient<T>(
  client: SupabaseClient,
  operation: () => T,
) {
  return requestClientStorage.run(client, operation);
}

const activeServerClient = () =>
  requestClientStorage.getStore() ?? getSupabaseAnonServerInstance();

export const supabaseServer = new Proxy({} as SupabaseClient, {
  get(_target, property) {
    const client = activeServerClient() as unknown as Record<PropertyKey, unknown>;
    const value = client[property];

    return typeof value === "function" ? value.bind(client) : value;
  },
}) as SupabaseClient;
