import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

import {
  authenticateLocalConsultant,
  expectCompaniesHydrated,
  openOfficialPanelWithSession,
} from "./helpers/authenticate-local-consultant";

const PANEL_PATH =
  "/admin/official-consultant-control-panel?mode=client-company&view=monitoring";
const CANONICAL_PATH =
  `${PANEL_PATH}&company=5c08029f-15e9-4bbd-b13e-0ff4765e23b8` +
  `&relationship=7c499a1c-31c6-4fc9-8b20-2fd8cdc57043` +
  `&case=19fc9eff-4219-43f0-854c-e2b3350f23f2`;

const AMBER_COMPANY = "Cervecería Amber";
const AMBER_COMPANY_ID = "5c08029f-15e9-4bbd-b13e-0ff4765e23b8";
const AMBER_RELATIONSHIP_ID = "7c499a1c-31c6-4fc9-8b20-2fd8cdc57043";
const AMBER_CASE_ID = "19fc9eff-4219-43f0-854c-e2b3350f23f2";
const AMBER_CASE_LABEL = "Caso INC16 Cervecería Amber Ancestral";
const AMBER_RELATIONSHIP_LABEL = "Relación activa de Cervecería Amber";

async function selectCompany(page: Page, label: string) {
  const input = page.locator("#client-company");
  await expect(input).toBeEnabled();
  await input.click();
  await input.fill(label);
  await page
    .getByRole("listbox", { name: "Empresas cliente autorizadas" })
    .getByRole("option", { name: label, exact: true })
    .first()
    .click();
}

test.describe("Official Consultant Control Panel — Unit 2B", () => {
  test.beforeEach(async ({ context, request }) => {
    await authenticateLocalConsultant(context, request);
  });

  test("carga solo empresas autorizadas y conserva estado vacío", async ({
    page,
  }) => {
    await openOfficialPanelWithSession(page, PANEL_PATH);
    await expectCompaniesHydrated(page);
    const company = page.locator("#client-company");
    await company.click();
    await expect(
      page
        .getByRole("listbox", { name: "Empresas cliente autorizadas" })
        .getByRole("option"),
    ).toHaveCount(3);
    await expect(
      page.getByText("Seleccione una empresa cliente.", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Estado actual", { exact: true })).toBeVisible();
    await expect(page.getByText("P-CORE-01")).toHaveCount(0);
    await expect(page.getByText("PF-CORE-01")).toHaveCount(0);
  });

  test("cascada Cervecería Amber autoselecciona relación y caso únicos", async ({
    page,
  }) => {
    await openOfficialPanelWithSession(page, PANEL_PATH);
    await expectCompaniesHydrated(page);
    await selectCompany(page, AMBER_COMPANY);

    await expect(page).toHaveURL(new RegExp(`company=${AMBER_COMPANY_ID}`));
    await expect(page).toHaveURL(
      new RegExp(`relationship=${AMBER_RELATIONSHIP_ID}`),
    );
    await expect(page).toHaveURL(new RegExp(`case=${AMBER_CASE_ID}`));
    await expect(page.locator("#active-relationship")).toHaveValue(
      AMBER_RELATIONSHIP_ID,
    );
    await expect(page.locator("#current-case")).toHaveValue(AMBER_CASE_ID);
    await expect(page.getByText("No disponible", { exact: true }).first()).toBeVisible();
    await expect(
      page.locator("#current-case option:checked"),
    ).toContainText(AMBER_CASE_LABEL);
    await expect(page.getByText("Contexto activo.")).toBeVisible();
  });

  test("URL canónica activa Cervecería Amber", async ({ page }) => {
    await openOfficialPanelWithSession(page, CANONICAL_PATH);
    await expect(page.getByText("Contexto activo.")).toBeVisible();
    await expect(page.locator("#client-company")).toBeVisible();
    await expect(page.locator("#client-company")).toHaveValue(AMBER_COMPANY);
    await expect(page.locator("#active-relationship")).toBeVisible();
    await expect(page.locator("#active-relationship")).toHaveValue(
      AMBER_RELATIONSHIP_ID,
    );
    await expect(page.locator("#current-case")).toBeVisible();
    await expect(page.locator("#current-case")).toHaveValue(AMBER_CASE_ID);
    await expect(
      page.locator("#active-relationship option:checked"),
    ).toContainText(AMBER_RELATIONSHIP_LABEL);
    await expect(
      page.locator("#current-case option:checked"),
    ).toContainText(AMBER_CASE_LABEL);
    await expect(
      page.getByRole("definition").filter({ hasText: "No disponible" }).first(),
    ).toBeVisible();
    await expect(
      page.getByLabel("Estado del contexto"),
    ).toContainText(AMBER_CASE_LABEL);
    await expect(page.getByText("Contexto no disponible")).toHaveCount(0);
    await expect(
      page.getByText("No fue posible abrir el contexto solicitado."),
    ).toHaveCount(0);
    await expect(
      page.getByText("No fue posible validar la sesión del Consultor."),
    ).toHaveCount(0);
    await expect(
      page.getByText("Las vistas operativas se habilitarán en las siguientes unidades."),
    ).toBeVisible();
  });

  test("refresh y atrás/adelante conservan sesión y contexto", async ({
    page,
  }) => {
    await openOfficialPanelWithSession(page, CANONICAL_PATH);
    await expect(page.getByText("Contexto activo.")).toBeVisible();

    await page.reload();
    await expect(page.getByText("Contexto activo.")).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`case=${AMBER_CASE_ID}`));

    await page.goto(PANEL_PATH);
    await expectCompaniesHydrated(page);
    await selectCompany(page, "Empresa Múltiple");
    await page
      .locator("#active-relationship")
      .selectOption({ label: "Relación con Casos" });
    await page.locator("#current-case").selectOption({ label: "Caso Alfa" });
    await expect(page).toHaveURL(/case=42000000-0000-4000-8000-000000000002/);

    await page.goBack();
    await expect(page).not.toHaveURL(/case=42000000-0000-4000-8000-000000000002/);
    await page.goForward();
    await expect(page).toHaveURL(/case=42000000-0000-4000-8000-000000000002/);
  });

  test("selección múltiple limpia dependencias", async ({ page }) => {
    await openOfficialPanelWithSession(page, PANEL_PATH);
    await expectCompaniesHydrated(page);
    await selectCompany(page, "Empresa Múltiple");
    await expect(page.locator("#active-relationship")).toBeFocused();
    await expect(page.locator("#active-relationship option")).toHaveCount(3);
    await expect(page).not.toHaveURL(/relationship=/);

    await page
      .locator("#active-relationship")
      .selectOption({ label: "Relación con Casos" });
    await expect(page.locator("#current-case")).toBeFocused();
    await expect(page.locator("#current-case option")).toHaveCount(3);

    await page.locator("#current-case").selectOption({ label: "Caso Alfa" });
    await expect(page).toHaveURL(/case=42000000-0000-4000-8000-000000000002/);

    await page
      .locator("#active-relationship")
      .selectOption({ label: "Relación Sin Caso" });
    await expect(page).not.toHaveURL(/case=/);
    await expect(
      page.getByText("No hay un caso disponible para esta relación."),
    ).toBeVisible();
  });

  test("empresa sin relación e IDs manipulados se normalizan sin fuga", async ({
    page,
  }) => {
    await openOfficialPanelWithSession(
      page,
      `${PANEL_PATH}&company=12000000-0000-4000-8000-000000000003`,
    );
    await expect(
      page.getByText("Esta empresa no tiene una relación activa disponible."),
    ).toBeVisible();

    await page.goto(`${PANEL_PATH}&company=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa`);
    await expect(page).not.toHaveURL(/company=/);
    await expect(
      page.getByText("No fue posible abrir el contexto solicitado."),
    ).toBeVisible();
    await expect(page.locator("body")).not.toContainText(
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    );
  });

  test("error de carga es dominante y no mezcla Sin contexto activo", async ({
    page,
  }) => {
    await page.route("**/client-companies", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "unavailable" }),
      }),
    );
    await page.goto(PANEL_PATH);
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "No fue posible cargar el contexto." }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Reintentar" })).toBeVisible();
    await expect(page.getByText("Sin contexto activo")).toHaveCount(0);
    await expect(
      page.getByText("No fue posible validar la sesión del Consultor."),
    ).toHaveCount(0);
    // Network failure keeps selectors (auth is valid); session failure hides them.
    await expect(page.locator("#client-company")).toBeVisible();
  });

  test("mantiene franja KPI (5) y Eje X sin inventar estado operativo", async ({ page }) => {
    await openOfficialPanelWithSession(page, CANONICAL_PATH);
    await expect(page.getByText("Contexto activo.")).toBeVisible();

    await expect(page.getByText("Estado actual", { exact: true })).toBeVisible();
    await expect(page.getByText("Hitos core alcanzados")).toBeVisible();
    await expect(page.getByLabel("Hitos core alcanzados: Sin datos")).toHaveText("—");
    await expect(page.getByLabel("Alertas de experiencia: Sin datos")).toHaveText("—");
    await expect(page.getByText("Usuarios", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Resumen auxiliar del caso")).toHaveCount(0);
    await expect(
      page.getByLabel("Procesos de soporte", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Seleccione un proceso de soporte para consultar su contexto."),
    ).toBeVisible();
    await expect(page.getByText("Hitos auxiliares del caso", { exact: true })).toBeVisible();
  });

  test("genera capturas finales Amber activa", async ({ page }) => {
    const outputDir = resolve("reports/local/amber-recovery/screenshots");
    mkdirSync(outputDir, { recursive: true });
    const capture = (name: string) =>
      page.screenshot({
        path: resolve(outputDir, name),
        fullPage: true,
        caret: "initial",
      });

    await page.setViewportSize({ width: 1440, height: 1000 });
    await openOfficialPanelWithSession(page, PANEL_PATH);
    await expectCompaniesHydrated(page);
    await capture("01-login-local.png");

    await page.goto(CANONICAL_PATH);
    await expect(page.getByText("Contexto activo.")).toBeVisible();
    await capture("02-amber-activa.png");
    await capture("03-url-canonica.png");

    await page.reload();
    await expect(page.getByText("Contexto activo.")).toBeVisible();
    await capture("04-refresh.png");
    await capture("05-desktop.png");

    await page.setViewportSize({ width: 820, height: 1180 });
    await capture("06-tablet.png");

    await page.setViewportSize({ width: 390, height: 844 });
    await capture("07-mobile.png");

    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(CANONICAL_PATH);
    await expect(page.getByText("Contexto activo.")).toBeVisible();
    await expect(page.locator("#client-company")).toBeVisible();
    await expect(
      page.getByLabel("Estado del contexto"),
    ).toContainText(AMBER_CASE_LABEL);
    await expect(page.getByText("Contexto no disponible")).toHaveCount(0);
    await capture("08-amber-panel-final.png");
  });
});

test.describe("Official Consultant Control Panel — sesión ausente", () => {
  test("sin JWT no queda en Cargando empresas", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
    await page.goto(PANEL_PATH);
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "No fue posible validar la sesión del Consultor." }),
    ).toBeVisible();
    await expect(page.getByPlaceholder("Cargando empresas…")).toHaveCount(0);
    await expect(page.locator("#client-company")).toHaveCount(0);
  });
});
