import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

import {
  authenticateLocalConsultant,
  expectCompaniesHydrated,
  openOfficialPanelWithSession,
} from "./helpers/authenticate-local-consultant";

const COMPANY_ID = "5c08029f-15e9-4bbd-b13e-0ff4765e23b8";
const RELATIONSHIP_ID = "7c499a1c-31c6-4fc9-8b20-2fd8cdc57043";
const CASE_ID = "19fc9eff-4219-43f0-854c-e2b3350f23f2";

const AMBER_PATH =
  "/admin/official-consultant-control-panel?mode=client-company&view=monitoring" +
  `&company=${COMPANY_ID}` +
  `&relationship=${RELATIONSHIP_ID}` +
  `&case=${CASE_ID}`;

const SHOT_DIR = resolve("reports/local/rector-point-7/screenshots");

const CATALOG_CODES = [
  "P-SUP-01",
  "P-SUP-02",
  "P-SUP-03",
  "P-SUP-04",
  "P-SUP-05",
  "P-SUP-06",
  "P-SUP-07/08",
  "P-SUP-09",
] as const;

async function shot(page: Page, name: string) {
  mkdirSync(SHOT_DIR, { recursive: true });
  await page.screenshot({
    path: resolve(SHOT_DIR, name),
    fullPage: false,
  });
}

async function openAmberAxis(page: Page) {
  await openOfficialPanelWithSession(page, AMBER_PATH);
  await expectCompaniesHydrated(page);
  await expect(page.locator("#client-company")).toHaveValue("Cervecería Amber", {
    timeout: 45000,
  });
  await expect(page.locator("#current-case")).toContainText("INC16", {
    timeout: 45000,
  });
  await expect(page.getByTestId("support-process-axis")).toBeVisible({
    timeout: 45000,
  });
  await expect(
    page.getByRole("heading", { name: "Procesos de soporte", exact: true }),
  ).toBeVisible({ timeout: 45000 });
  await expect(page.locator('[data-process-code="P-SUP-01"]')).toBeVisible({
    timeout: 45000,
  });
}

test.describe("Official Consultant Control Panel — Rector point 7 Eje X", () => {
  test.describe.configure({ timeout: 180000 });

  test.beforeEach(async ({ context, request }) => {
    await authenticateLocalConsultant(context, request);
  });

  test("Amber: franja KPI situacional + shells, sin Todos ni resumen auxiliar", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await openAmberAxis(page);

    await expect(page.getByText("Estado actual", { exact: true })).toBeVisible();
    await expect(page.getByText("Próximo paso", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Atención requerida", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Hitos core alcanzados")).toBeVisible();
    await expect(page.getByText("Alertas de experiencia")).toBeVisible();
    await expect(page.getByText("Participación", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Usuarios", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Roles funcionales")).toHaveCount(0);
    await expect(page.getByText("Actividades primarias")).toHaveCount(0);
    await expect(page.getByText("Procesos manuales")).toHaveCount(0);
    await expect(page.getByText("Findings / rework")).toHaveCount(0);
    await expect(page.getByText("Resumen auxiliar del caso")).toHaveCount(0);
    await expect(page.locator('[data-process-code="Todos"]')).toHaveCount(0);

    for (const code of CATALOG_CODES) {
      await expect(page.locator(`[data-process-code="${code}"]`)).toBeVisible();
    }

    await expect(page).not.toHaveURL(/process=/);
    await expect(
      page.getByText("Seleccione un proceso de soporte para consultar su contexto."),
    ).toBeVisible();
    await expect(page.getByLabel("Hitos core alcanzados: Sin datos")).toHaveText(
      "—",
    );
    await expect(
      page.getByLabel("Alertas de experiencia: Sin datos"),
    ).toHaveText("—");

    await shot(page, "01-amber-eje-x-todos.png");
    await shot(page, "06-desktop-sin-scroll-vertical.png");
  });

  test("selección, detalle, teclado, back/forward e inválido limpia process", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await openAmberAxis(page);

    await page.locator('[data-process-code="P-SUP-01"]').click();
    await expect(page).toHaveURL(/process=P-SUP-01/);
    await expect(
      page.locator('[data-process-code="P-SUP-01"][aria-pressed="true"]'),
    ).toBeVisible();
    const detail = page.locator("#support-process-workspace-summary");
    await expect(
      page.getByRole("heading", { name: "Detalle del proceso seleccionado" }),
    ).toBeVisible();
    await expect(detail.locator("dt", { hasText: "Proceso seleccionado" })).toBeVisible();
    await expect(detail.locator("dt", { hasText: "Estado operativo" })).toBeVisible();
    await shot(page, "02-amber-p-sup-01-seleccionado.png");
    await shot(page, "05-estado-operativo-no-disponible.png");

    await page.locator('[data-process-code="P-SUP-01"]').click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get("process"), {
        timeout: 10000,
      })
      .toBe(null);
    await expect(
      page.locator('[data-process-code="P-SUP-01"][aria-pressed="true"]'),
    ).toHaveCount(0);
    await expect(detail).toHaveAttribute("data-collapsed", "true");
    await expect(detail.locator("dt")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Detalle del proceso seleccionado" }),
    ).toBeVisible();
    await page.locator('[data-process-code="P-SUP-01"]').click();
    await expect(page).toHaveURL(/process=P-SUP-01/);
    await expect(detail.locator("dt", { hasText: "Proceso seleccionado" })).toBeVisible();

    await page.locator('[data-process-code="P-SUP-01"]').focus();
    await expect(
      page.locator("#support-process-tooltip-P-SUP-01"),
    ).toContainText("PLATAFORMA");
    await shot(page, "03-proceso-plataforma-tooltip.png");

    await page.locator('[data-process-code="P-SUP-03"]').focus();
    await expect(
      page.locator("#support-process-tooltip-P-SUP-03"),
    ).toContainText("MANUAL");
    await shot(page, "04-proceso-manual-tooltip.png");

    await page.locator('[data-process-code="P-SUP-01"]').focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator('[data-process-code="P-SUP-02"]')).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/process=P-SUP-02/);
    await shot(page, "12-teclado-foco-visible.png");

    await page.goto(AMBER_PATH + "&process=P-SUP-01", {
      waitUntil: "domcontentloaded",
    });
    await expectCompaniesHydrated(page);
    await expect(
      page.locator('[data-process-code="P-SUP-01"][aria-pressed="true"]'),
    ).toBeVisible({ timeout: 45000 });
    await page.locator('[data-process-code="P-SUP-06"]').click();
    await expect(page).toHaveURL(/process=P-SUP-06/);
    await page.goBack();
    await expect
      .poll(() => new URL(page.url()).searchParams.get("process"), {
        timeout: 10000,
      })
      .toBe("P-SUP-01");
    await page.goForward();
    await expect
      .poll(() => new URL(page.url()).searchParams.get("process"), {
        timeout: 10000,
      })
      .toBe("P-SUP-06");
    await shot(page, "10-back-forward.png");

    await page.goto(AMBER_PATH + "&process=INVALID_PROCESS&milestone=keep-me", {
      waitUntil: "domcontentloaded",
    });
    await expectCompaniesHydrated(page);
    await expect(page.getByTestId("support-process-axis")).toBeVisible({
      timeout: 45000,
    });
    await expect
      .poll(() => new URL(page.url()).searchParams.get("process"), {
        timeout: 15000,
      })
      .toBeNull();
    await expect(page).toHaveURL(/milestone=keep-me/);
    await expect(
      page.getByText("Seleccione un proceso de soporte para consultar su contexto."),
    ).toBeVisible();
    await shot(page, "09-parametro-invalido-normalizado.png");
  });

  test("cambio de empresa limpia process; responsive horizontal", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await openAmberAxis(page);
    await page.locator('[data-process-code="P-SUP-04"]').click();
    await expect(page).toHaveURL(/process=P-SUP-04/);

    await page.getByRole("button", { name: "Limpiar empresa cliente" }).click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get("process"), {
        timeout: 15000,
      })
      .toBeNull();
    await expect(page).not.toHaveURL(new RegExp(CASE_ID));
    await shot(page, "11-cambio-caso-limpia-proceso.png");

    await page.goto(AMBER_PATH, { waitUntil: "domcontentloaded" });
    await expectCompaniesHydrated(page);
    await expect(page.locator('[data-process-code="P-SUP-01"]')).toBeVisible({
      timeout: 45000,
    });
    await expect(page.locator('[data-process-code="Todos"]')).toHaveCount(0);

    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByTestId("support-process-axis")).toBeVisible();
    await expect(page.locator('[data-process-code="P-SUP-09"]')).toBeVisible();
    await shot(page, "07-tablet-scroll-horizontal.png");

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByTestId("support-process-axis")).toBeVisible();
    await expect(
      page.getByRole("toolbar", { name: "Procesos de soporte" }),
    ).toBeVisible();
    await shot(page, "08-mobile-scroll-horizontal.png");
  });
});
