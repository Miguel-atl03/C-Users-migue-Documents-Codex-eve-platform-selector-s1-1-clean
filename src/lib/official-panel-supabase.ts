import { createBrowserClient } from "@supabase/ssr";

import { OFFICIAL_PANEL_AUTH_COOKIE_NAME } from "@/lib/official-panel-auth-config";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isOfficialPanelSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey,
);

/**
 * Browser client dedicated to the Consultant Panel. It uses a separate auth
 * cookie/storage key so the operative user session can remain active on the
 * same origin in another tab.
 */
export const officialPanelSupabase = isOfficialPanelSupabaseConfigured
  ? createBrowserClient(supabaseUrl!, supabaseAnonKey!, {
      isSingleton: true,
      cookieOptions: {
        name: OFFICIAL_PANEL_AUTH_COOKIE_NAME,
      },
      auth: {
        flowType: "implicit",
        detectSessionInUrl: false,
      },
    })
  : null;
