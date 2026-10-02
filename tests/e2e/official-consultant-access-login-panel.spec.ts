import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

import {
  ACCESS_COMPANY_A,
  ACCESS_COMPANY_B,
  ACCESS_IDENTITY_EMAILS,
  authenticateLocalConsultant,
  clearOfficialSession,
  expectCompaniesHydrated,
  openOfficialPanelWithSession,
} from "./helpers/authenticate-local-consultant";

const PANEL_PATH = "/admin/official-consultant-control-panel";
const EVIDENCE_DIR = resolve(
  process.cwd(),
  "reports/local/official-consultant-access",
);

const SHELL_MARKERS = [
  "Panel de Control EVE",
  "client-company",
  "Estado actual",
  "Alertas de experiencia",
  "OfficialControlPanelShell",
];

function evidencePath(name: string) {
  mkdirSync(EVIDENCE_DIR, { recursive: true });
  return resolve(EVIDENCE_DIR, name);
}

test.describe("Acceso oficial del Consultor (SSR + identidades reales)", () => {
  test("anónimo: redirect server-side al login; HTML sin shell", async ({
    page,
    request,
  }) => {
    const response = await request.get(PANEL_PATH, { maxRedirects: 0 });
    expect([302, 303, 307, 308]).toContain(response.status());
    const location = response.headers().location ?? "";
    expect(location).toMatch(/[?&]next=/);
    expect(location).toMatch(/official-consultant-control-panel/);

    const body = (await response.text()) ?? "";
    for (const marker of SHELL_MARKERS) {
      expect(body.includes(marker), `shell leak: ${marker}`).toBeFalsy();
    }

    await page.goto(PANEL_PATH, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/[?&]next=/);
    // passwordOnlyAccess (returnTo panel) uses "Acceso al Panel".
    await expect(
      page.getByRole("heading", { name: /Acceso al Panel|Acceso a la plataforma/ }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: "Demo controlada" })).toHaveCount(
      0,
    );
    await page.screenshot({
      path: evidencePath("01-login-oficial.png"),
      fullPage: true,
    });
  });

  test("Consultor A: login oficial (cookies SSR) → Panel directo sin Runtime", async ({
    page,
    context,
    request,
  }) => {
    test.setTimeout(90_000);
    const password = (process.env.EVE_UNIT2B_TEST_PASSWORD ?? "").trim();
    test.skip(!password, "EVE_UNIT2B_TEST_PASSWORD required");

    // Official entry: Panel → login returnTo (no shell).
    await page.goto(PANEL_PATH, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/[?&]next=/);
    await expect(
      page.getByRole("heading", { name: /Acceso al Panel|Acceso a la plataforma/ }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: "Demo controlada" })).toHaveCount(
      0,
    );
    await expect(page.getByRole("button", { name: /Entrar como Consultor/i })).toHaveCount(
      0,
    );

    // Real password grant + official @supabase/ssr cookies (same session the
    // Server Component / middleware read). No mocks.
    await authenticateLocalConsultant(context, request, {
      email: ACCESS_IDENTITY_EMAILS.consultantA,
      password,
    });
    const cookies = await context.cookies();
    expect(
      cookies.some((cookie) => /auth-token/i.test(cookie.name)),
      "official SSR auth cookie missing",
    ).toBeTruthy();

    await page.goto(PANEL_PATH, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(new RegExp(PANEL_PATH.replace(/\//g, "\\/")), {
      timeout: 45_000,
    });
    await expect(
      page.getByText("Preparando tu nuevo levantamiento", { exact: false }),
    ).toHaveCount(0);
    await expectCompaniesHydrated(page);
    await page.screenshot({
      path: evidencePath("02-consultor-panel-directo.png"),
      fullPage: true,
    });

    const company = page.locator("#client-company");
    await company.click();
    await expect(
      page
        .getByRole("listbox", { name: "Empresas cliente autorizadas" })
        .getByRole("option")
        .first(),
    ).toBeVisible();
    await page.screenshot({
      path: evidencePath("03-consultor-casos-autorizados.png"),
      fullPage: true,
    });
  });

  test("usuario operativo: Panel → redirect server-side access-denied", async ({
    page,
    context,
    request,
  }) => {
    test.setTimeout(90_000);
    const password = (process.env.EVE_UNIT2B_TEST_PASSWORD ?? "").trim();
    test.skip(!password, "EVE_UNIT2B_TEST_PASSWORD required");

    await authenticateLocalConsultant(context, request, {
      email: ACCESS_IDENTITY_EMAILS.operative,
      password,
    });

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes(PANEL_PATH) &&
        response.request().isNavigationRequest(),
      { timeout: 30_000 },
    );
    await page.goto(PANEL_PATH, { waitUntil: "domcontentloaded" });
    const navigation = await responsePromise.catch(() => null);
    if (navigation) {
      expect([302, 303, 307, 308, 200]).toContain(navigation.status());
    }
    await expect(page).toHaveURL(/access-denied/, { timeout: 30_000 });
    await expect(
      page.getByRole("heading", { name: "Acceso no autorizado" }),
    ).toBeVisible();
    await expect(page.locator("#client-company")).toHaveCount(0);
    const html = await page.content();
    for (const marker of ["client-company", "OfficialControlPanelShell"]) {
      expect(html.includes(marker), `shell leak: ${marker}`).toBeFalsy();
    }
    await page.screenshot({
      path: evidencePath("04-usuario-operativo-panel-denegado.png"),
      fullPage: true,
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Acceso no autorizado")).toHaveCount(0);
  });

  test("usuario sin rol: Panel denegado; client-companies vacío real", async ({
    page,
    context,
    request,
  }) => {
    test.setTimeout(90_000);
    const password = (process.env.EVE_UNIT2B_TEST_PASSWORD ?? "").trim();
    test.skip(!password, "EVE_UNIT2B_TEST_PASSWORD required");

    const auth = await authenticateLocalConsultant(context, request, {
      email: ACCESS_IDENTITY_EMAILS.noRole,
      password,
    });

    const companies = await request.get(
      "/api/eve/official-consultant-control-panel/client-companies",
      {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      },
    );
    expect([200, 403]).toContain(companies.status());
    if (companies.status() === 200) {
      const payload = (await companies.json()) as unknown;
      expect(Array.isArray(payload) ? payload.length : -1).toBe(0);
    }

    await page.goto(PANEL_PATH, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/access-denied/, { timeout: 30_000 });
    await expect(page.locator("#client-company")).toHaveCount(0);
  });

  test("Consultor B aislado: sin empresa A; URL manipulada denegada por BFF", async ({
    page,
    context,
    request,
  }) => {
    test.setTimeout(90_000);
    const password = (process.env.EVE_UNIT2B_TEST_PASSWORD ?? "").trim();
    test.skip(!password, "EVE_UNIT2B_TEST_PASSWORD required");

    const auth = await authenticateLocalConsultant(context, request, {
      email: ACCESS_IDENTITY_EMAILS.consultantB,
      password,
    });

    await openOfficialPanelWithSession(page, PANEL_PATH);
    await expectCompaniesHydrated(page);

    const company = page.locator("#client-company");
    await company.click();
    await expect(
      page
        .getByRole("listbox", { name: "Empresas cliente autorizadas" })
        .getByRole("option", { name: "Cervecería Amber", exact: true }),
    ).toHaveCount(0);

    const foreign = await request.get(
      `/api/eve/official-consultant-control-panel/client-companies/${ACCESS_COMPANY_A}/relationships`,
      {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      },
    );
    expect(foreign.status()).toBeGreaterThanOrEqual(400);

    await page.goto(
      `${PANEL_PATH}?mode=client-company&view=monitoring&company=${ACCESS_COMPANY_A}`,
      { waitUntil: "domcontentloaded" },
    );
    // Server allows authorized Consultor B into shell; scoped BFF must deny A.
    await expect(page.locator("#client-company")).toBeVisible({ timeout: 45_000 });
    await expect(page.getByText("Cervecería Amber", { exact: true })).toHaveCount(0);
    await page.screenshot({
      path: evidencePath("05-consultor-b-aislado.png"),
      fullPage: true,
    });
  });

  test("sesión invalidada: cookies limpiadas → redirect login; sin shell", async ({
    page,
    context,
    request,
  }) => {
    test.setTimeout(90_000);
    await authenticateLocalConsultant(context, request, {
      email: ACCESS_IDENTITY_EMAILS.consultantA,
    });
    const cookiesBefore = await context.cookies();
    expect(
      cookiesBefore.some((cookie) => /auth-token/i.test(cookie.name)),
    ).toBeTruthy();

    // Prove the session was accepted by the server gate before invalidation.
    await page.goto(PANEL_PATH, { waitUntil: "domcontentloaded" });
    await expect(page).not.toHaveURL(/access-denied|[?&]next=/);
    await expectCompaniesHydrated(page);

    await clearOfficialSession(context);
    await context.clearCookies();

    const response = await request.get(PANEL_PATH, { maxRedirects: 0 });
    expect([302, 303, 307, 308]).toContain(response.status());
    const location = response.headers().location ?? "";
    expect(location).toMatch(/[?&]next=/);
    const body = (await response.text()) ?? "";
    for (const marker of SHELL_MARKERS) {
      expect(body.includes(marker), `shell leak: ${marker}`).toBeFalsy();
    }

    await page.goto(PANEL_PATH, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/[?&]next=/, { timeout: 30_000 });
    await expect(
      page.getByRole("heading", { name: /Acceso al Panel|Acceso a la plataforma/ }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.locator("#client-company")).toHaveCount(0);
    await page.screenshot({
      path: evidencePath("06-sesion-vencida-redireccion.png"),
      fullPage: true,
    });
  });
});
