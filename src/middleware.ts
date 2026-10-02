import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  buildOfficialPanelLoginRedirect,
  isSafeOfficialPanelReturnPath,
  OFFICIAL_PANEL_PATH_PREFIX,
} from "@/features/official-consultant-control-panel/state/official-panel-login-redirect";
import { OFFICIAL_PANEL_AUTH_COOKIE_NAME } from "@/lib/official-panel-auth-config";

/**
 * Refreshes the official Supabase cookie session and enforces the Panel gate
 * with real HTTP redirects before any shell HTML is emitted.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  if (!url || !anonKey) {
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookieOptions: {
      name: OFFICIAL_PANEL_AUTH_COOKIE_NAME,
    },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPanel =
    pathname === OFFICIAL_PANEL_PATH_PREFIX ||
    pathname.startsWith(`${OFFICIAL_PANEL_PATH_PREFIX}/`);

  if (isPanel) {
    const returnPath = `${pathname}${request.nextUrl.search}`;
    const safeReturn = isSafeOfficialPanelReturnPath(returnPath)
      ? returnPath
      : OFFICIAL_PANEL_PATH_PREFIX;

    if (!user?.id) {
      const loginPath = buildOfficialPanelLoginRedirect(safeReturn);
      return NextResponse.redirect(new URL(loginPath, request.url));
    }

    const now = new Date().toISOString();
    const { data: assignments, error } = await supabase
      .from("consultant_company_assignments")
      .select("client_company_id")
      .eq("consultant_user_id", user.id)
      .eq("status", "enabled")
      .lte("valid_from", now)
      .or(`valid_until.is.null,valid_until.gte.${now}`)
      .limit(1);

    if (error || !assignments || assignments.length === 0) {
      return NextResponse.redirect(new URL("/access-denied", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/access-denied",
    "/admin/official-consultant-control-panel",
    "/admin/official-consultant-control-panel/:path*",
  ],
};
