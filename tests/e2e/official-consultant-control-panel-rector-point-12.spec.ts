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

const SHOT_DIR = resolve("reports/local/rector-point-12/screenshots");

const FORBIDDEN = [
  "0/40",
  "0/20",
  "activity_runtime_run",
  "base_visible_count",
  "causal_visible_count",
  "readiness_state",
  "runtime_interaction_instance",
];

async function shot(page: Page, name: string) {
  mkdirSync(SHOT_DIR, { recursive: true });
  await page.screenshot({
    path: resolve(SHOT_DIR, name),
    fullPage: true,
  });
}

async function assertNoForbidden(page: Page) {
  const body = await page.locator("body").innerText();
  for (const token of FORBIDDEN) {
    expect(body, `must not show ${token}`).not.toContain(token);
  }
}

test.describe("§12-A Runtime estructura visual", () => {
  test.describe.configure({ timeout: 240000 });

  test.beforeEach(async ({ context, request }) => {
    await authenticateLocalConsultant(context, request);
  });

  test("Amber: Runtime estructural visible sin inventar datos", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1300 });
    await openOfficialPanelWithSession(page, AMBER_PATH);
    await expectCompaniesHydrated(page);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expectCompaniesHydrated(page);

    await expect(page.locator("#client-company")).toHaveValue("Cervecería Amber", {
      timeout: 45000,
    });
    await expect(
      page.getByRole("heading", { name: "Procesos de soporte", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Hitos core del caso", exact: true }),
    ).toBeVisible();
    await expect(page.locator('[data-xy-matrix="true"]')).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Usuarios del caso", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Cobertura de actividades", exact: true }),
    ).toBeVisible();

    const runtime = page.getByTestId("activity-runtime-panel");
    await expect(runtime).toBeVisible();
    await expect(runtime).toHaveAttribute("data-availability", "no-participant");
    await expect(
      page.getByRole("heading", { name: "Ejecución Runtime", exact: true }),
    ).toBeVisible();

    await expect(runtime.getByText("Estado de ejecución")).toBeVisible();
    await expect(runtime.getByText("Bloque actual")).toBeVisible();
    await expect(runtime.getByText("Base").first()).toBeVisible();
    await expect(runtime.getByText("Causales").first()).toBeVisible();
    await expect(runtime.getByText("Preparación")).toBeVisible();
    await expect(runtime.getByText("Brechas")).toBeVisible();
    await expect(runtime.getByText("Tiempo de espera")).toBeVisible();
    await expect(runtime.locator("dd").filter({ hasText: /^—$/ }).first()).toBeVisible();
    await expect(runtime.getByText("No disponible").first()).toBeVisible();

    for (const code of ["B0", "B0.5", "B1", "B2", "B3", "B4", "B5", "B6", "B7"]) {
      await expect(runtime.locator(`[data-block-code="${code}"]`)).toBeVisible();
    }
    await expect(runtime.getByText("Ruta crítica").first()).toBeVisible();
    await expect(
      runtime.getByText(/La ejecución Runtime estará disponible cuando exista una persona/),
    ).toBeVisible();

    await assertNoForbidden(page);
    await runtime.scrollIntoViewIfNeeded();
    await shot(page, "01-amber-runtime-estructura-visible.png");
    await shot(page, "02-resumen-runtime-sin-datos.png");
    await shot(page, "03-bloques-b0-b7-visibles.png");
    await shot(page, "08-desktop.png");

    await page.setViewportSize({ width: 900, height: 1100 });
    await shot(page, "09-tablet.png");

    await page.setViewportSize({ width: 390, height: 844 });
    await shot(page, "10-mobile.png");
  });

  test("Fixtures locales: precondiciones Runtime (04–07)", async ({ page }) => {
    test.skip(
      true,
      "local-ui-fixtures removed from App Router; covered by unit + operational E2E",
    );
    await page.setViewportSize({ width: 1100, height: 900 });

    await page.goto(
      "/admin/official-consultant-control-panel/local-ui-fixtures?fixture=no-session",
      { waitUntil: "domcontentloaded" },
    );
    const runtime = page.getByTestId("activity-runtime-panel");
    await expect(runtime).toBeVisible({ timeout: 30000 });
    await expect(runtime).toHaveAttribute("data-availability", "no-session");
    await expect(
      runtime.getByText("No hay una sesión funcional vinculada a este perfil."),
    ).toBeVisible();
    await shot(page, "04-perfil-sin-sesion.png");

    await page.goto(
      "/admin/official-consultant-control-panel/local-ui-fixtures?fixture=no-effective",
      { waitUntil: "domcontentloaded" },
    );
    await expect(page.getByTestId("activity-runtime-panel")).toHaveAttribute(
      "data-availability",
      "no-effective-selection",
    );
    await expect(
      page
        .getByTestId("activity-runtime-panel")
        .getByText(
          "No hay un resultado efectivo de selección para esta sesión funcional.",
        ),
    ).toBeVisible();
    await shot(page, "05-sesion-sin-seleccion-effective.png");

    await page.goto(
      "/admin/official-consultant-control-panel/local-ui-fixtures?fixture=no-run",
      { waitUntil: "domcontentloaded" },
    );
    await expect(page.getByTestId("activity-runtime-panel")).toHaveAttribute(
      "data-availability",
      "no-run",
    );
    await expect(
      page
        .getByTestId("activity-runtime-panel")
        .getByText(
          "Esta actividad primaria no tiene una ejecución Runtime registrada.",
        ),
    ).toBeVisible();
    await shot(page, "06-actividad-primaria-sin-run.png");

    await page.goto(
      "/admin/official-consultant-control-panel/local-ui-fixtures?fixture=run-no-ledger",
      { waitUntil: "domcontentloaded" },
    );
    await expect(page.getByTestId("activity-runtime-panel")).toHaveAttribute(
      "data-availability",
      "operational-data-unavailable",
    );
    await expect(
      page
        .getByTestId("activity-runtime-panel")
        .getByText(
          /Existe una ejecución registrada, pero el detalle Base y Causal/,
        ),
    ).toBeVisible();
    await assertNoForbidden(page);
    await shot(page, "07-run-sin-ledger.png");
  });
});
