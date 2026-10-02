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

const SELECT_CORE_MILESTONE_MESSAGE =
  "Seleccione un hito core para consultar su estado.";

const SHOT_DIR = resolve("reports/local/rector-points-8-9/screenshots");

async function shot(page: Page, name: string) {
  mkdirSync(SHOT_DIR, { recursive: true });
  await page.screenshot({
    path: resolve(SHOT_DIR, name),
    fullPage: false,
  });
}

/** Wait until axis is partial/ready: no initial loading, matrix rendered. */
async function waitAxisStable(page: Page) {
  await expect(page.getByText("Cargando hitos core…")).toHaveCount(0, {
    timeout: 45000,
  });
  await expect(page.locator('[data-xy-matrix="true"]')).toBeVisible({
    timeout: 45000,
  });
  await expect(page.locator('[data-milestone-code="H0"]')).toBeVisible({
    timeout: 45000,
  });
}

async function expectMilestoneDetailSynced(page: Page, code: string) {
  await expect(page).toHaveURL(new RegExp(`milestone=${code}`));
  await expect(
    page.locator(`[data-milestone-code="${code}"]`),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("region", { name: `Detalle del hito ${code}` }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: new RegExp(`^${code} —`) }),
  ).toBeVisible();
  await expect(page.getByText(SELECT_CORE_MILESTONE_MESSAGE)).toHaveCount(0);
  await expect(page.getByText("Cargando hitos core…")).toHaveCount(0);
}

async function expectIntersectionStable(page: Page) {
  await expect(page.getByText("Cargando hitos core…")).toHaveCount(0);
  await expect(
    page.locator("[data-milestone-detail]").or(
      page.getByRole("region", { name: /Detalle del hito/ }),
    ),
  ).toBeVisible();
  await expect(page.locator("#xy-intersection-heading")).toBeVisible();
  await expect(page.locator('[data-xy-matrix="true"]')).toBeVisible();
}

async function openAmber(page: Page) {
  await openOfficialPanelWithSession(page, AMBER_PATH);
  await expectCompaniesHydrated(page);
  await expect(page.locator("#client-company")).toHaveValue("Cervecería Amber", {
    timeout: 45000,
  });
  await expect(
    page.getByRole("heading", { name: "Hitos core del caso", exact: true }),
  ).toBeVisible({ timeout: 45000 });
  await waitAxisStable(page);
}

test.describe("Official Consultant Control Panel — Rector points 8-9 sync", () => {
  test.describe.configure({ timeout: 240000 });

  test.beforeEach(async ({ context, request }) => {
    await authenticateLocalConsultant(context, request);
  });

  test("D1 detalle H2 sincronizado + captura 02", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await openAmber(page);

    await page.locator('[data-milestone-code="H2"]').click();
    await expectMilestoneDetailSynced(page, "H2");
    await expect(
      page.getByRole("region", { name: "Detalle del hito H2" }),
    ).toContainText("No disponible");
    await expect(
      page.getByRole("heading", { name: "H2 — Listo para transducción" }),
    ).toBeVisible();
    await shot(page, "02-hito-seleccionado-detalle-inmediato.png");
  });

  test("Amber screenshots estables 01–14 + matriz + intersecciones", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await openAmber(page);

    await expect(page.getByLabel("Hitos core alcanzados: Sin datos")).toHaveText(
      "—",
    );
    await shot(page, "01-amber-eje-y-no-disponible.png");
    await shot(page, "09-kpi-no-evaluable.png");
    await shot(page, "10-desktop.png");

    await page.locator('[data-milestone-code="H2"]').click();
    await expectMilestoneDetailSynced(page, "H2");
    await shot(page, "02-hito-seleccionado-detalle-inmediato.png");

    // D3 matriz: 9 filas (8 P-SUP + frontera), 7 columnas, leyenda
    const matrix = page.locator('[data-xy-matrix="true"]');
    await expect(matrix.locator("tbody tr")).toHaveCount(9);
    await expect(matrix.locator("thead th")).toHaveCount(8); // label + H0–H6
    await expect(
      page.getByRole("list", { name: "Leyenda de relaciones" }),
    ).toBeVisible();
    await expect(matrix.locator('td[data-selected-column="true"]')).toHaveCount(
      9,
    );
    await shot(page, "03-matriz-xy-completa.png");

    async function openIntersection(
      process: string,
      milestone: string,
      shotName: string,
      relation: string,
    ) {
      const processParam =
        process === "P-SUP-07/08"
          ? encodeURIComponent(process)
          : process;
      await page.goto(
        `${AMBER_PATH}&process=${processParam}&milestone=${milestone}`,
        { waitUntil: "domcontentloaded" },
      );
      await expectCompaniesHydrated(page);
      await waitAxisStable(page);
      await expectMilestoneDetailSynced(page, milestone);
      await expect(
        page.locator(`[data-process-code="${process}"]`),
      ).toHaveAttribute("aria-pressed", "true");
      await expectIntersectionStable(page);
      await expect(
        matrix.locator('tr[data-selected-row="true"]'),
      ).toHaveCount(1);
      await expect(
        matrix.locator('td[data-selected-column="true"]'),
      ).toHaveCount(9);
      await expect(
        matrix.locator('td[data-selected-cell="true"]'),
      ).toHaveCount(1);
      await expect(
        matrix.locator('td[data-selected-cell="true"]'),
      ).toHaveAttribute("data-relation", relation);
      await shot(page, shotName);
    }

    await openIntersection("P-SUP-01", "H1", "04-interseccion-d.png", "D");
    await openIntersection("P-SUP-03", "H3", "05-interseccion-m.png", "M");
    await openIntersection("P-SUP-06", "H2", "06-interseccion-p.png", "P");
    await openIntersection(
      "P-SUP-07/08",
      "H1",
      "07-interseccion-p-condicionado.png",
      "P*",
    );
    await openIntersection("P-SUP-01", "H0", "08-interseccion-sin-relacion.png", "-");

    await page.setViewportSize({ width: 900, height: 1000 });
    await waitAxisStable(page);
    await expect(page.getByText("Cargando hitos core…")).toHaveCount(0);
    await shot(page, "11-tablet.png");

    await page.setViewportSize({ width: 390, height: 844 });
    await waitAxisStable(page);
    await expect(page.getByText("Cargando hitos core…")).toHaveCount(0);
    await shot(page, "12-mobile.png");
  });

  test("D4 back/forward restaura selección y detalle", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await openAmber(page);

    await page.locator('[data-process-code="P-SUP-01"]').click();
    await expect(page).toHaveURL(/process=P-SUP-01/);

    await page.locator('[data-milestone-code="H1"]').click();
    await expectMilestoneDetailSynced(page, "H1");

    await page.locator('[data-milestone-code="H2"]').click();
    await expectMilestoneDetailSynced(page, "H2");

    await page.goBack();
    await expectMilestoneDetailSynced(page, "H1");
    await expect(
      page.locator('[data-milestone-code="H1"]'),
    ).toHaveAttribute("aria-pressed", "true");

    await page.goForward();
    await expectMilestoneDetailSynced(page, "H2");
    await expect(
      page.locator('[data-milestone-code="H2"]'),
    ).toHaveAttribute("aria-pressed", "true");

    await shot(page, "13-back-forward.png");
  });

  test("D5 parámetros inválidos limpian selección", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(AMBER_PATH + "&process=INVALID&milestone=HX", {
      waitUntil: "domcontentloaded",
    });
    await expectCompaniesHydrated(page);
    await waitAxisStable(page);

    await expect
      .poll(() => new URL(page.url()).searchParams.get("process"))
      .toBe(null);
    await expect
      .poll(() => new URL(page.url()).searchParams.get("milestone"))
      .toBe(null);

    await expect(
      page.locator('[data-process-code][aria-pressed="true"]'),
    ).toHaveCount(0);
    await expect(
      page.locator('[data-milestone-code][aria-pressed="true"]'),
    ).toHaveCount(0);
    await expect(
      page.locator('[data-xy-matrix="true"] [data-selected-row]'),
    ).toHaveCount(0);
    await expect(
      page.locator('[data-xy-matrix="true"] [data-selected-column]'),
    ).toHaveCount(0);
    await expect(page.getByText(SELECT_CORE_MILESTONE_MESSAGE)).toBeVisible();
    await expect(page.locator("#xy-intersection-heading")).toHaveCount(0);

    await shot(page, "14-parametro-invalido.png");
  });

  test("D6 teclado: foco, Enter/Space, URL y detalle", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await openAmber(page);

    await page.locator('[data-milestone-code="H0"]').focus();
    await expect(page.locator('[data-milestone-code="H0"]')).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator('[data-milestone-code="H1"]')).toBeFocused();

    await page.keyboard.press("Enter");
    await expectMilestoneDetailSynced(page, "H1");

    await page.keyboard.press("End");
    await expect(page.locator('[data-milestone-code="H6"]')).toBeFocused();
    // End solo mueve foco; todavía H1 seleccionado
    await expect(
      page.locator('[data-milestone-code="H1"]'),
    ).toHaveAttribute("aria-pressed", "true");

    await page.keyboard.press("Space");
    await expectMilestoneDetailSynced(page, "H6");

    await page.keyboard.press("Home");
    await expect(page.locator('[data-milestone-code="H0"]')).toBeFocused();
    await page.keyboard.press("Enter");
    await expectMilestoneDetailSynced(page, "H0");
  });
});
