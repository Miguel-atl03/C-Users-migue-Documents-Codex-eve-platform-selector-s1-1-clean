import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

import {
  authenticateLocalConsultant,
  openOfficialPanelWithSession,
} from "./helpers/authenticate-local-consultant";

const CANONICAL_PATH =
  "/admin/official-consultant-control-panel?mode=client-company&view=monitoring" +
  "&company=5c08029f-15e9-4bbd-b13e-0ff4765e23b8" +
  "&relationship=7c499a1c-31c6-4fc9-8b20-2fd8cdc57043" +
  "&case=19fc9eff-4219-43f0-854c-e2b3350f23f2";

const AMBER_CASE = "19fc9eff-4219-43f0-854c-e2b3350f23f2";
const PROCESS_ID = "a1000000-0000-4000-8000-000000000001";
const M1 = "a2000000-0000-4000-8000-000000000001";
const M2 = "a2000000-0000-4000-8000-000000000002";
const M3 = "a2000000-0000-4000-8000-000000000003";

const SHOT_DIR = resolve("reports/local/unit3/screenshots");

async function shot(page: Page, name: string) {
  mkdirSync(SHOT_DIR, { recursive: true });
  await page.screenshot({
    path: resolve(SHOT_DIR, name),
    fullPage: true,
  });
}

async function mockProcessStructure(
  page: Page,
  body: unknown,
) {
  await page.route(/\/cases\/[^/]+\/process-structure(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
}

async function openWithProcessStructure(
  page: Page,
  path: string,
  body: unknown,
) {
  await mockProcessStructure(page, body);
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/process-structure") && response.ok(),
    { timeout: 30_000 },
  );
  await openOfficialPanelWithSession(page, path);
  await responsePromise;
  await expect(
    page.getByRole("navigation", { name: "Hitos del caso" }),
  ).toBeVisible({ timeout: 15_000 });
}

test.describe("Official Consultant Control Panel — Unit 3B", () => {
  test.beforeEach(async ({ context, request }) => {
    await authenticateLocalConsultant(context, request);
  });

  test("Amber sin proceso muestra vacío factual honesto", async ({ page }) => {
    await openOfficialPanelWithSession(page, CANONICAL_PATH);
    await expect(
      page.getByRole("status").filter({
        hasText: "Proceso principal: No disponible para este caso",
      }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByText("No hay una estructura de proceso disponible.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText("Estructura de proceso no disponible.", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("No fue posible abrir la estructura")).toHaveCount(
      0,
    );
    await expect(page.getByText("P-CORE-01")).toHaveCount(0);
    await expect(page.getByText("PF-CORE-01")).toHaveCount(0);
    await expect(page.getByText("—").first()).toBeVisible();
    await shot(page, "01-amber-sin-proceso.png");

    const unit4Dir = resolve("reports/local/unit4/screenshots");
    mkdirSync(unit4Dir, { recursive: true });
    await page.screenshot({
      path: resolve(unit4Dir, "02-amber-structure-recovered.png"),
      fullPage: true,
    });

    await page.setViewportSize({ width: 1280, height: 900 });
    await shot(page, "07-desktop.png");
    await page.setViewportSize({ width: 820, height: 1024 });
    await shot(page, "08-tablet.png");
    await page.setViewportSize({ width: 390, height: 844 });
    await shot(page, "09-mobile.png");
  });

  test("proceso sin hitos (fixture test-only)", async ({ page }) => {
    await openWithProcessStructure(page, CANONICAL_PATH, {
      mainProcess: {
        id: PROCESS_ID,
        label: "Proceso test-only sin hitos",
        status: "not_started",
        statusLabel: "No iniciado",
        currentMilestoneId: null,
        nextEventLabel: null,
        timerLabel: null,
      },
      milestones: [],
    });
    await expect(
      page.getByRole("status").filter({
        hasText: "Proceso principal: Proceso test-only sin hitos",
      }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByText("El proceso todavía no tiene hitos registrados.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText("Todavía no hay hitos registrados para este caso.", {
        exact: true,
      }),
    ).toBeVisible();
    await shot(page, "02-proceso-sin-hitos.png");
  });

  test("proceso parcial sin hito actual", async ({ page }) => {
    await openWithProcessStructure(page, CANONICAL_PATH, {
      mainProcess: {
        id: PROCESS_ID,
        label: "Proceso test-only parcial",
        status: "available",
        statusLabel: "Disponible",
        currentMilestoneId: null,
        nextEventLabel: null,
        timerLabel: null,
      },
      milestones: [
        {
          id: M1,
          label: "Apertura test-only",
          sequence: 1,
          status: "available",
          statusLabel: "Disponible",
          expectedEventLabel: null,
          timerLabel: null,
          supportProcessLabel: null,
        },
        {
          id: M2,
          label: "Cierre test-only",
          sequence: 2,
          status: "not_started",
          statusLabel: "No iniciado",
          expectedEventLabel: null,
          timerLabel: null,
          supportProcessLabel: null,
        },
      ],
    });
    await expect(
      page.getByRole("button", { name: /Apertura test-only/ }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByLabel("Hitos del caso").getByText("Hito actual: No disponible"),
    ).toBeVisible();
    await expect(
      page.getByText("Seleccione un hito para consultar su estado."),
    ).toBeVisible();
    await shot(page, "03-proceso-parcial.png");
  });

  test("hito actual explícito y selección por URL", async ({ page }) => {
    await openWithProcessStructure(page, `${CANONICAL_PATH}&milestone=${M2}`, {
      mainProcess: {
        id: PROCESS_ID,
        label: "Proceso test-only activo",
        status: "available",
        statusLabel: "Disponible",
        currentMilestoneId: M2,
        nextEventLabel: "SCR recibido",
        timerLabel: "2026-08-01T12:00:00.000Z",
      },
      milestones: [
        {
          id: M1,
          label: "Apertura",
          sequence: 1,
          status: "completed",
          statusLabel: "Completado",
          expectedEventLabel: null,
          timerLabel: null,
          supportProcessLabel: null,
        },
        {
          id: M2,
          label: "Registrar SCR",
          sequence: 2,
          status: "current",
          statusLabel: "Actual",
          expectedEventLabel: "SCR recibido",
          timerLabel: "2026-08-01T12:00:00.000Z",
          supportProcessLabel: "Soporte calidad",
        },
      ],
    });
    await expect(
      page.getByRole("button", { name: /Registrar SCR/ }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByLabel("Hitos del caso").getByText("Hito actual: Registrar SCR"),
    ).toBeVisible();
    await expect(
      page.getByLabel("Detalle del hito").getByText("SCR recibido"),
    ).toBeVisible();
    await expect(
      page.getByLabel("Detalle del hito").getByText("Soporte calidad"),
    ).toBeVisible();
    await shot(page, "04-hito-actual.png");

    await page.locator(`[data-milestone-id="${M1}"]`).click();
    await expect(
      page.getByLabel("Detalle del hito").getByText("Apertura"),
    ).toBeVisible();
  });

  test("espera completa e incompleta", async ({ page }) => {
    await openWithProcessStructure(page, `${CANONICAL_PATH}&milestone=${M1}`, {
      mainProcess: {
        id: PROCESS_ID,
        label: "Proceso waits",
        status: "waiting",
        statusLabel: "En espera",
        currentMilestoneId: M1,
        nextEventLabel: "EB listo",
        timerLabel: "2026-09-01T00:00:00.000Z",
      },
      milestones: [
        {
          id: M1,
          label: "Espera completa test",
          sequence: 1,
          status: "waiting",
          statusLabel: "En espera",
          expectedEventLabel: "EB listo",
          timerLabel: "2026-09-01T00:00:00.000Z",
          supportProcessLabel: null,
        },
        {
          id: M3,
          label: "Espera incompleta test",
          sequence: 2,
          status: "waiting",
          statusLabel: "En espera",
          expectedEventLabel: "Falta timer",
          timerLabel: null,
          supportProcessLabel: null,
        },
      ],
    });
    await expect(
      page.getByRole("button", { name: /Espera completa test/ }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByRole("button", { name: /En espera \(completa\)/ }),
    ).toBeVisible();
    await shot(page, "05-hito-en-espera-completa.png");

    await page.locator(`[data-milestone-id="${M3}"]`).click();
    await expect(
      page.getByLabel("Detalle del hito").getByText(
        "Espera incompleta. Falta evento esperado o límite temporal.",
      ),
    ).toBeVisible();
    await shot(page, "06-hito-en-espera-incompleta.png");
  });

  test("milestone inválido se elimina de la URL", async ({ page }) => {
    await openWithProcessStructure(
      page,
      `${CANONICAL_PATH}&milestone=bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb`,
      {
        mainProcess: {
          id: PROCESS_ID,
          label: "Proceso",
          status: "available",
          statusLabel: "Disponible",
          currentMilestoneId: M1,
          nextEventLabel: null,
          timerLabel: null,
        },
        milestones: [
          {
            id: M1,
            label: "Único",
            sequence: 1,
            status: "current",
            statusLabel: "Actual",
            expectedEventLabel: null,
            timerLabel: null,
            supportProcessLabel: null,
          },
        ],
      },
    );
    await expect(
      page.getByRole("button", { name: /Único/ }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page).not.toHaveURL(/milestone=bbbbbbbb/);
  });
});
