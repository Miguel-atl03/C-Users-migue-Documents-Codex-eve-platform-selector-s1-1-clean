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
  "reports/local/rector-point-12-delivery-c/screenshots",
);

async function shot(page: Page, name: string) {
  mkdirSync(SHOT_DIR, { recursive: true });
  await page.screenshot({ path: resolve(SHOT_DIR, name), fullPage: true });
}

test.describe("§12 Entrega C — control Runtime", () => {
  test.describe.configure({ timeout: 240000 });

  test("Amber: Estado de avance No evaluable sin inventar datos", async ({
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

    await expect(page.getByTestId("runtime-activity-matrix-panel")).toBeVisible({
      timeout: 45000,
    });
    const footer = page.getByTestId("runtime-advance-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveAttribute("data-advance", "not-evaluable");
    await expect(
      footer.locator("[class*='runtimeAdvanceFooterValue']"),
    ).toHaveText("No evaluable");
    await expect(page.getByText("0/20")).toHaveCount(0);

    await shot(page, "01-amber-no-evaluable.png");
    await shot(page, "10-desktop.png");
    await page.setViewportSize({ width: 900, height: 1200 });
    await shot(page, "11-tablet.png");
    await page.setViewportSize({ width: 390, height: 844 });
    await shot(page, "12-mobile.png");
  });

  test("Fixtures control: ready, restricciones, P0, gaps, timer, reentry, review", async ({
    page,
  }) => {
    test.skip(
      true,
      "local-ui-fixtures removed from App Router; covered by unit + operational E2E",
    );
    await page.setViewportSize({ width: 1440, height: 1200 });

    const FIXTURE_ROOT =
      "/admin/official-consultant-control-panel/local-ui-fixtures?fixture=";

    async function openFixture(name: string) {
      await page.goto(`${FIXTURE_ROOT}${name}`, {
        waitUntil: "domcontentloaded",
      });
      await expect(page.getByTestId("runtime-advance-footer")).toBeVisible({
        timeout: 30000,
      });
    }

    await openFixture("control-ready");
    await expect(page.getByTestId("runtime-advance-footer")).toHaveAttribute(
      "data-advance",
      "ready",
    );
    await expect(page.getByText("Puede avanzar").first()).toBeVisible();
    await shot(page, "02-ready.png");

    await openFixture("control-ready-restrictions");
    await expect(page.getByTestId("runtime-advance-footer")).toHaveAttribute(
      "data-advance",
      "ready-with-restrictions",
    );
    await shot(page, "03-ready-con-restricciones.png");

    await openFixture("control-blocked-p0");
    await expect(page.getByTestId("runtime-advance-footer")).toHaveAttribute(
      "data-advance",
      "blocked",
    );
    await shot(page, "04-bloqueado-p0.png");

    await openFixture("control-gap-active");
    await expect(page.getByText("Brecha").first()).toBeVisible();
    await shot(page, "05-gaps-activos.png");

    await openFixture("control-timer-overdue");
    await expect(page.getByText("Timer").first()).toBeVisible();
    await shot(page, "06-timer-vencido.png");

    await openFixture("control-reentry");
    await expect(page.getByText("Reentry").first()).toBeVisible();
    await shot(page, "07-reentry.png");

    await openFixture("control-manual-review");
    await expect(page.getByText("Revisión").first()).toBeVisible();
    await shot(page, "08-revision-manual.png");

    await openFixture("control-ready-restrictions");
    await expect(page.getByTestId("attention-governance-panel")).toBeVisible();
    await expect(page.getByTestId("attention-runtime-control")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByTestId("attention-active-gaps")).toBeVisible();
    await shot(page, "09-contextual-panel.png");
  });
});
