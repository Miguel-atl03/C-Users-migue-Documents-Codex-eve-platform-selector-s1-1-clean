import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Official browser Supabase client. Session is persisted in cookies so the
 * App Router Server Components and middleware share the same auth state.
 * Anon key only — never service_role.
 */
export const supabase = isSupabaseConfigured
  ? createBrowserClient(supabaseUrl!, supabaseAnonKey!, {
      isSingleton: true,
      auth: {
        // Password grant on the shared login form (not OAuth PKCE).
        flowType: "implicit",
        detectSessionInUrl: false,
      },
    })
  : null;
