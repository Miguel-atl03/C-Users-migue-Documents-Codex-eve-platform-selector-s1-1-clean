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

const SHOT_DIR = resolve(
  "reports/local/rollback-points-11-12/screenshots",
);

async function shot(page: Page, name: string) {
  mkdirSync(SHOT_DIR, { recursive: true });
  await page.screenshot({
    path: resolve(SHOT_DIR, name),
    fullPage: true,
  });
}

test.describe("Rollback §§11–12 — Amber §10 checkpoint", () => {
  test.describe.configure({ timeout: 240000 });

  test.beforeEach(async ({ context, request }) => {
    await authenticateLocalConsultant(context, request);
  });

  test("Amber: ejes + matriz + monitoreo §10 sin selección/runtime", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1100 });
    await openOfficialPanelWithSession(page, AMBER_PATH);
    await expectCompaniesHydrated(page);

    await expect(page.locator("#client-company")).toHaveValue("Cervecería Amber", {
      timeout: 45000,
    });
    await expect(
      page.getByText("No fue posible validar la sesión del Consultor."),
    ).toHaveCount(0);
    await expect(
      page.getByText("No fue posible abrir el contexto solicitado."),
    ).toHaveCount(0);

    await expect(
      page.getByRole("heading", { name: "Procesos de soporte", exact: true }),
    ).toBeVisible({ timeout: 45000 });
    await expect(
      page.getByRole("heading", { name: "Hitos core del caso", exact: true }),
    ).toBeVisible({ timeout: 45000 });
    await expect(page.locator('[data-xy-matrix="true"]')).toBeVisible({
      timeout: 45000,
    });

    await expect(
      page.getByRole("heading", { name: "Usuarios del caso", exact: true }),
    ).toBeVisible({ timeout: 45000 });
    await expect(page.getByTestId("recursive-monitoring-users")).toBeVisible();
    // Amber canónicamente sin participantes: vacío factual §10; §11/§12-A estructurales visibles.
    await expect(
      page.getByText("Este caso no tiene personas participantes registradas."),
    ).toBeVisible();

    await expect(
      page.getByTestId("activity-selection-coverage-panel"),
    ).toBeVisible();
    await expect(page.getByTestId("activity-runtime-panel")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Cobertura de actividades", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Ejecución Runtime", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("0/40")).toHaveCount(0);
    await expect(page.getByText("0/20")).toHaveCount(0);
    await expect(page.getByText("Bloques individuales", { exact: true })).toBeVisible();

    await shot(page, "01-amber-checkpoint-point10-no-11-12.png");
  });
});
