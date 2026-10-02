import { createServerClient } from "@supabase/ssr";
import { expect, type APIRequestContext, type BrowserContext, type Page } from "@playwright/test";

const LOCAL_CONSULTANT_EMAIL = "unit2b-consultant@example.invalid";

export type LocalConsultantAuth = {
  accessToken: string;
  refreshToken: string;
  storageKey: string;
  email: string;
};

export type AuthenticateLocalConsultantOptions = {
  email?: string;
  password?: string;
};

/**
 * Authenticates with a real Supabase password grant and installs the official
 * SSR cookie session (@supabase/ssr) into the Playwright browser context.
 * Also mirrors the session into localStorage for BFF Bearer bootstrap helpers.
 * Rejects any non-localhost Supabase URL.
 */
export async function authenticateLocalConsultant(
  context: BrowserContext,
  request: APIRequestContext,
  options: AuthenticateLocalConsultantOptions = {},
): Promise<LocalConsultantAuth> {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  const password = (
    options.password ??
    process.env.EVE_UNIT2B_TEST_PASSWORD ??
    ""
  ).trim();
  const email = (options.email ?? LOCAL_CONSULTANT_EMAIL).trim();

  if (!supabaseUrl || !anonKey || !password) {
    throw new Error("local_consultant_auth_environment_missing");
  }

  assertLocalSupabaseUrl(supabaseUrl);

  const authResponse = await request.post(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      headers: {
        apikey: anonKey,
        "Content-Type": "application/json",
      },
      data: {
        email,
        password,
      },
    },
  );

  if (!authResponse.ok()) {
    throw new Error("local_consultant_sign_in_failed");
  }

  const session = (await authResponse.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    expires_at?: number;
    token_type?: string;
    user?: unknown;
  };

  if (!session.access_token || !session.refresh_token) {
    throw new Error("local_consultant_session_incomplete");
  }

  session.expires_at ??=
    Math.floor(Date.now() / 1000) + Number(session.expires_in ?? 3600);

  const storageKey = supabaseAuthStorageKey(supabaseUrl);
  const cookies = await buildOfficialSessionCookies({
    supabaseUrl,
    anonKey,
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
  });

  await context.addCookies(cookies);

  await context.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, JSON.stringify(value));
    },
    { key: storageKey, value: session },
  );

  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    storageKey,
    email,
  };
}

async function buildOfficialSessionCookies(input: {
  supabaseUrl: string;
  anonKey: string;
  accessToken: string;
  refreshToken: string;
}) {
  const bag: { name: string; value: string; options?: Record<string, unknown> }[] =
    [];

  const client = createServerClient(input.supabaseUrl, input.anonKey, {
    cookies: {
      getAll() {
        return bag.map((item) => ({ name: item.name, value: item.value }));
      },
      setAll(cookiesToSet) {
        for (const cookie of cookiesToSet) {
          const index = bag.findIndex((item) => item.name === cookie.name);
          if (index >= 0) bag[index] = cookie;
          else bag.push(cookie);
        }
      },
    },
  });

  const { error } = await client.auth.setSession({
    access_token: input.accessToken,
    refresh_token: input.refreshToken,
  });
  if (error) {
    throw new Error(`official_session_cookie_seed_failed:${error.message}`);
  }

  const host = new URL(input.supabaseUrl).hostname;
  return bag.map((cookie) => {
    const options = cookie.options ?? {};
    const maxAge =
      typeof options.maxAge === "number" ? options.maxAge : undefined;
    const rawSameSite = options.sameSite;
    let sameSite: "Lax" | "Strict" | "None" = "Lax";
    if (typeof rawSameSite === "string") {
      const normalized =
        rawSameSite.charAt(0).toUpperCase() + rawSameSite.slice(1).toLowerCase();
      if (normalized === "Lax" || normalized === "Strict" || normalized === "None") {
        sameSite = normalized;
      }
    }
    return {
      name: cookie.name,
      value: cookie.value,
      domain: host,
      path: typeof options.path === "string" ? options.path : "/",
      httpOnly: Boolean(options.httpOnly),
      secure: Boolean(options.secure),
      sameSite,
      expires: maxAge
        ? Math.floor(Date.now() / 1000) + maxAge
        : undefined,
    };
  });
}

export async function clearOfficialSession(context: BrowserContext) {
  await context.clearCookies();
  await context.addInitScript(() => {
    try {
      window.localStorage.clear();
    } catch {
      /* ignore */
    }
  });
}

export async function openOfficialPanelWithSession(
  page: Page,
  path: string,
): Promise<void> {
  const companiesRequest = page.waitForRequest(
    (request) =>
      request.method() === "GET" &&
      /\/api\/eve\/official-consultant-control-panel\/client-companies\/?(\?|$)/.test(
        request.url(),
      ),
    { timeout: 60000 },
  );

  await page.goto(path, { waitUntil: "domcontentloaded" });
  const request = await companiesRequest;
  const authorization =
    (await request.headerValue("authorization")) ??
    request.headers()["authorization"] ??
    "";
  expect(authorization.startsWith("Bearer ")).toBeTruthy();
  expect(authorization.length).toBeGreaterThan("Bearer ".length + 20);
  expect(authorization.includes("Bearer null")).toBeFalsy();
}

export async function expectCompaniesHydrated(page: Page): Promise<void> {
  const company = page.locator("#client-company");
  await expect(company).toBeVisible({ timeout: 45000 });
  await expect(company).toBeEnabled({ timeout: 45000 });
  await expect(company).not.toHaveAttribute(
    "placeholder",
    "Cargando empresas…",
  );
}

export function assertLocalSupabaseUrl(url: string): void {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    throw new Error("local_supabase_url_invalid");
  }
  if (host !== "127.0.0.1" && host !== "localhost") {
    throw new Error("remote_supabase_url_rejected");
  }
}

export function supabaseAuthStorageKey(supabaseUrl: string): string {
  const hostname = new URL(supabaseUrl).hostname;
  return `sb-${hostname.split(".")[0]}-auth-token`;
}

export const LOCAL_CONSULTANT_EMAIL_ADDRESS = LOCAL_CONSULTANT_EMAIL;

export const ACCESS_IDENTITY_EMAILS = {
  consultantA: "unit2b-consultant@example.invalid",
  consultantB: "access-consultant-b@example.invalid",
  operative: "access-operative@example.invalid",
  noRole: "access-norole@example.invalid",
} as const;

export const ACCESS_COMPANY_A = "5c08029f-15e9-4bbd-b13e-0ff4765e23b8";
export const ACCESS_COMPANY_B = "a1200012-0000-4000-8000-000000000001";
