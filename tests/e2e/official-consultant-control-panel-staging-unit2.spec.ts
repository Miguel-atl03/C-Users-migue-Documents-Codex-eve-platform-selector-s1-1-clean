import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Staging-only validation for Unit 2 promotion gate.
 * Requires EVE_STAGING_BASE_URL and staging Supabase credentials.
 */
const STAGING_BASE = process.env.EVE_STAGING_BASE_URL;
const SUPABASE_URL = process.env.EVE_STAGING_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EVE_STAGING_SUPABASE_ANON_KEY;
const CONSULTANT_A_EMAIL = process.env.EVE_STAGING_CONSULTANT_A_EMAIL;
const CONSULTANT_A_PASSWORD = process.env.EVE_STAGING_CONSULTANT_A_PASSWORD;
const AMBER_LABEL =
  process.env.EVE_STAGING_AMBER_COMPANY_LABEL ?? "Cerveceria Ambar Ancestral";

const PANEL_PATH =
  "/admin/official-consultant-control-panel?mode=client-company&view=monitoring";

test.describe("Official Panel — Staging Unit 2 gate", () => {
  test.skip(
    !STAGING_BASE || !SUPABASE_URL || !SUPABASE_ANON_KEY,
    "staging_e2e_environment_missing",
  );

  test("local-session endpoint is absent (404) on staging host", async ({
    request,
  }) => {
    const response = await request.post(
      `${STAGING_BASE}/api/eve/official-consultant-control-panel/local-session`,
    );
    expect(response.status()).toBe(404);
  });

  test("cookie-only consultant role does not load companies without JWT", async ({
    context,
    page,
  }) => {
    await context.addCookies([
      {
        name: "eve_consultant_role",
        value: "consultant",
        domain: new URL(STAGING_BASE!).hostname,
        path: "/",
      },
    ]);
    await page.goto(`${STAGING_BASE}${PANEL_PATH}`);
    await expect(
      page.getByText("No fue posible cargar el contexto.", { exact: true }),
    ).toBeVisible({ timeout: 15000 });
  });

  test.describe("authenticated consultant flow", () => {
    test.skip(
      !CONSULTANT_A_EMAIL || !CONSULTANT_A_PASSWORD,
      "staging_consultant_credentials_missing",
    );

    test.beforeEach(async ({ context, request }) => {
      const authResponse = await request.post(
        `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY!,
            "Content-Type": "application/json",
          },
          data: {
            email: CONSULTANT_A_EMAIL,
            password: CONSULTANT_A_PASSWORD,
          },
        },
      );
      expect(authResponse.ok()).toBe(true);
      const session = await authResponse.json();
      session.expires_at ??=
        Math.floor(Date.now() / 1000) + Number(session.expires_in ?? 3600);
      const storageKey = `sb-${new URL(SUPABASE_URL!).hostname.split(".")[0]}-auth-token`;
      await context.addInitScript(
        ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
        { key: storageKey, value: session },
      );
    });

    test("Cervecería Amber cascade and staging screenshots", async ({ page }) => {
      const outputDir = resolve("reports/staging/unit2/screenshots");
      mkdirSync(outputDir, { recursive: true });
      const capture = (name: string) =>
        page.screenshot({
          path: resolve(outputDir, name),
          fullPage: true,
        });

      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(`${STAGING_BASE}${PANEL_PATH}`);
      await expect(page.locator("#client-company")).toBeEnabled();
      await capture("02-sin-empresa.png");

      const input = page.locator("#client-company");
      await input.click();
      await input.fill(AMBER_LABEL.split(" ")[0]);
      await page.getByRole("option", { name: AMBER_LABEL }).first().click();
      await expect(page.getByText("Contexto activo.")).toBeVisible({
        timeout: 15000,
      });
      await capture("03-cerveceria-amber.png");
      await capture("05-caso-activo.png");
      await capture("06-desktop.png");

      await page.setViewportSize({ width: 820, height: 1180 });
      await capture("07-tablet.png");
      await page.setViewportSize({ width: 390, height: 844 });
      await capture("08-mobile.png");
    });
  });
});
