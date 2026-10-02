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
  "reports/local/rector-point-12-causal-matrix/screenshots",
);

async function shot(page: Page, name: string) {
  mkdirSync(SHOT_DIR, { recursive: true });
  await page.screenshot({ path: resolve(SHOT_DIR, name), fullPage: true });
}

test.describe("§12 Entrega B — Matriz Causal 20", () => {
  test.describe.configure({ timeout: 240000 });

  test("Amber: Causal visible sin run; tabs Base/Causal; sin 0/20 ni footer", async ({
    page,
    context,
    request,
  }) => {
    await authenticateLocalConsultant(context, request);
    await page.setViewportSize({ width: 1440, height: 1400 });
    await openOfficialPanelWithSession(page, AMBER_PATH);
    await expectCompaniesHydrated(page);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expectCompaniesHydrated(page);

    await expect(page.getByTestId("activity-runtime-panel")).toBeVisible({
      timeout: 45000,
    });
    await expect(page.getByTestId("runtime-structural-blocks")).toBeVisible();
    await expect(page.getByTestId("runtime-activity-matrix-panel")).toBeVisible();
    await expect(page.getByTestId("runtime-matrix-tab-base")).toBeVisible();
    await expect(page.getByTestId("runtime-matrix-tab-causal")).toBeVisible();

    await page.getByTestId("runtime-matrix-tab-causal").click();
    await expect(page.getByTestId("causal-closure-matrix")).toBeVisible();
    await expect(page.getByTestId("causal-matrix-no-run-banner")).toBeVisible();
    await expect(
      page.getByText("Matriz Causal 20 sin evaluación"),
    ).toBeVisible();
    await expect(
      page.getByTestId("causal-closure-matrix").getByText("Filas visibles: 20"),
    ).toBeVisible();

    for (const col of [
      "Prioridad/clase",
      "Activación documental",
      "Razón de selección",
      "Cierre satisfactorio",
      "Bloqueo si falla",
      "Bloquea ready pleno",
    ]) {
      await expect(
        page
          .getByTestId("causal-closure-matrix")
          .getByRole("columnheader", { name: col, exact: true }),
      ).toBeVisible();
    }
    await expect(
      page
        .getByTestId("causal-closure-matrix")
        .getByRole("columnheader", { name: "ID", exact: true }),
    ).toBeVisible();

    await expect(page.getByText("P0-C05").first()).toBeVisible();
    await expect(page.getByText("0/20")).toHaveCount(0);
    // Entrega C: footer operativo presente; Amber sin run = No evaluable.
    await expect(page.getByTestId("runtime-advance-footer")).toBeVisible();
    await expect(page.getByTestId("runtime-advance-footer")).toHaveAttribute(
      "data-advance",
      "not-evaluable",
    );

    await shot(page, "01-amber-causal-visible-sin-run.png");
    await shot(page, "02-causal-20-catalogo.png");
    await shot(page, "03-prioridad-clase.png");
    await shot(page, "10-base-causal-tabs.png");
    await shot(page, "11-desktop.png");

    await page.setViewportSize({ width: 900, height: 1200 });
    await shot(page, "12-tablet.png");
    await page.setViewportSize({ width: 390, height: 844 });
    await shot(page, "13-mobile.png");
  });

  test("Fixtures causal-partial: activación, razón, P0, filtros, drawer", async ({
    page,
  }) => {
    test.skip(
      true,
      "local-ui-fixtures removed from App Router; covered by unit + operational E2E",
    );
    await page.setViewportSize({ width: 1440, height: 1200 });
    await page.goto(
      "/admin/official-consultant-control-panel/local-ui-fixtures?fixture=causal-partial&runtime_matrix=causal",
      { waitUntil: "networkidle" },
    );

    await expect(page.getByTestId("runtime-activity-matrix-panel")).toBeVisible({
      timeout: 30000,
    });
    await page.getByTestId("runtime-matrix-tab-causal").click();
    await expect(page.getByTestId("causal-closure-matrix")).toBeVisible({
      timeout: 30000,
    });
    await expect(
      page
        .getByTestId("causal-closure-matrix")
        .getByText("Excepción de transformación activada por señal B2-Q17"),
    ).toBeVisible();
    await shot(page, "04-activacion-y-razon.png");

    await expect(
      page.getByTestId("causal-closure-matrix").getByText("Cerrada").first(),
    ).toBeVisible();
    await expect(
      page.getByTestId("causal-closure-matrix").getByText("answered_closed"),
    ).toHaveCount(0);
    await shot(page, "05-cierre-causal.png");

    await expect(
      page.getByTestId("causal-closure-matrix").getByText("Bloquea").first(),
    ).toBeVisible();
    await shot(page, "06-bloqueo-p0.png");

    await expect(
      page
        .getByTestId("causal-closure-matrix")
        .getByText("No activada con evidencia")
        .first(),
    ).toBeVisible();
    await shot(page, "07-no-activada-con-evidencia.png");

    await page.getByTestId("causal-matrix-filter").selectOption("P0");
    await expect(
      page.getByTestId("causal-closure-matrix").getByText("Filas visibles: 4"),
    ).toBeVisible();
    await shot(page, "08-filtros-causales.png");

    await page.getByTestId("causal-matrix-filter").selectOption("all");
    await page
      .getByTestId("causal-closure-matrix")
      .getByRole("button", { name: "C05" })
      .click();
    await expect(page.getByTestId("runtime-evidence-drawer")).toBeVisible();
    await shot(page, "09-detalle-causal.png");
  });

  test("Fixtures: conflict branching + evidencia parcial no cierra", async ({
    page,
  }) => {
    test.skip(
      true,
      "local-ui-fixtures removed from App Router; covered by unit + operational E2E",
    );
    await page.setViewportSize({ width: 1440, height: 1200 });
    await page.goto(
      "/admin/official-consultant-control-panel/local-ui-fixtures?fixture=causal-branching-conflict&runtime_matrix=causal",
      { waitUntil: "networkidle" },
    );
    await page.getByTestId("runtime-matrix-tab-causal").click();
    await expect(page.getByTestId("causal-closure-matrix")).toBeVisible({
      timeout: 30000,
    });
    await expect(
      page.getByText("Existen decisiones de apertura contradictorias").first(),
    ).toBeVisible();
    await shot(page, "14-decisiones-branching-en-conflicto.png");

    await page.goto(
      "/admin/official-consultant-control-panel/local-ui-fixtures?fixture=causal-partial-evidence&runtime_matrix=causal",
      { waitUntil: "networkidle" },
    );
    await page.getByTestId("runtime-matrix-tab-causal").click();
    await expect(page.getByTestId("causal-closure-matrix")).toBeVisible({
      timeout: 30000,
    });
    const c05 = page
      .getByTestId("causal-closure-matrix")
      .locator('[data-row-id="C05"]');
    await expect(c05.getByText("No evaluada").first()).toBeVisible();
    await expect(c05.getByText("Cerrada")).toHaveCount(0);
    await shot(page, "15-evidencia-parcial-no-cierra-causal.png");
  });
});
