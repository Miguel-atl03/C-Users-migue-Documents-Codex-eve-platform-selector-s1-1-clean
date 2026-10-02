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
  "reports/local/rector-point-11-visibility-language/screenshots",
);

const TECHNICAL_FORBIDDEN = [
  "CasoDiagnosticoEVE",
  "SceneCanonicalRecord",
  "EvidenceBundle",
  "ReadyForTransduction",
  "max_tiempo_",
];

async function shot(page: Page, name: string) {
  mkdirSync(SHOT_DIR, { recursive: true });
  await page.screenshot({
    path: resolve(SHOT_DIR, name),
    fullPage: true,
  });
}

async function assertNoTechnicalLeak(page: Page) {
  const body = await page.locator("body").innerText();
  for (const token of TECHNICAL_FORBIDDEN) {
    expect(body, `UI must not expose ${token}`).not.toContain(token);
  }
}

test.describe("§11 visible + lenguaje operativo §§7–9", () => {
  test.describe.configure({ timeout: 240000 });

  test.beforeEach(async ({ context, request }) => {
    await authenticateLocalConsultant(context, request);
  });

  test("Amber: cobertura visible sin participantes; ejes y lenguaje", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1200 });
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
      page.getByText("Este caso no tiene personas participantes registradas."),
    ).toBeVisible();

    const coverage = page.getByTestId("activity-selection-coverage-panel");
    await expect(coverage).toBeVisible();
    await expect(coverage).toHaveAttribute("data-availability", "no-participant");
    await expect(
      page.getByRole("heading", { name: "Cobertura de actividades", exact: true }),
    ).toBeVisible();
    await expect(coverage.getByText("Modo de selección")).toBeVisible();
    await expect(coverage.getByText("Actividades elegibles")).toBeVisible();
    await expect(coverage.getByText("Actividades primarias").first()).toBeVisible();
    await expect(coverage.getByText("Contexto no primario").first()).toBeVisible();
    await expect(coverage.getByText("Brecha de cobertura")).toBeVisible();
    await expect(coverage.getByText("Condición de promoción")).toBeVisible();
    await expect(coverage.getByText("Versión de política")).toBeVisible();
    await expect(coverage.getByText("No disponible").first()).toBeVisible();
    await expect(coverage.locator("dd").filter({ hasText: /^—$/ }).first()).toBeVisible();
    await expect(
      coverage.getByText(/No hay personas participantes registradas para este caso/),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Ejecución Runtime", exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId("activity-runtime-panel")).toHaveAttribute(
      "data-availability",
      "no-participant",
    );

    // Hito H0 — lenguaje operativo
    await page.locator('[data-milestone-code="H0"]').click();
    await expect(page.locator('[data-milestone-detail="H0"]')).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByText("Condición esperada del caso")).toBeVisible();
    await expect(page.getByText("Caso en producción diagnóstica")).toBeVisible();
    await expect(page.getByText("Límite de espera")).toBeVisible();
    await expect(
      page.getByText("Tiempo máximo para consolidar la escena"),
    ).toBeVisible();
    await assertNoTechnicalLeak(page);
    await shot(page, "05-hito-lenguaje-operativo.png");

    // Proceso P-SUP-01 — Resultado esperado operativo
    await page.locator('[data-process-code="P-SUP-01"]').click();
    const processSummary = page.locator("#support-process-workspace-summary");
    await expect(processSummary.getByText("Resultado esperado")).toBeVisible({
      timeout: 30000,
    });
    await expect(
      processSummary.getByText("Escena operativa consolidada"),
    ).toBeVisible();
    await expect(page.getByText("Objeto y estado objetivo")).toHaveCount(0);
    await assertNoTechnicalLeak(page);
    await shot(page, "06-proceso-lenguaje-operativo.png");

    // Scroll users + coverage into view for principal Amber shot
    await coverage.scrollIntoViewIfNeeded();
    await shot(page, "01-amber-sin-participantes-cobertura-visible.png");
    await shot(page, "07-desktop.png");

    await page.setViewportSize({ width: 900, height: 1100 });
    await shot(page, "08-tablet.png");

    await page.setViewportSize({ width: 390, height: 844 });
    await shot(page, "09-mobile.png");
  });

  test("Fixtures locales: precondiciones §11 (02–04)", async ({ page }) => {
    test.skip(
      true,
      "local-ui-fixtures removed from App Router; covered by unit + operational E2E",
    );
    await page.setViewportSize({ width: 1100, height: 900 });

    await page.goto(
      "/admin/official-consultant-control-panel/local-ui-fixtures?fixture=no-session",
      { waitUntil: "domcontentloaded" },
    );
    await expect(page.getByTestId("activity-selection-coverage-panel")).toBeVisible();
    await expect(
      page.getByText("No hay una sesión funcional vinculada a este perfil."),
    ).toBeVisible();
    await expect(page.getByText("Modo de selección")).toBeVisible();
    await shot(page, "02-perfil-sin-sesion-cobertura-visible.png");

    await page.goto(
      "/admin/official-consultant-control-panel/local-ui-fixtures?fixture=no-effective",
      { waitUntil: "domcontentloaded" },
    );
    await expect(
      page.getByText(
        "No hay un resultado de selección registrado para esta sesión funcional.",
      ),
    ).toBeVisible();
    await shot(page, "03-sesion-sin-resultado.png");

    await page.goto(
      "/admin/official-consultant-control-panel/local-ui-fixtures?fixture=available",
      { waitUntil: "domcontentloaded" },
    );
    await expect(page.getByText("Selección competitiva")).toBeVisible();
    await expect(page.getByText("policy-v1-fixture")).toBeVisible();
    await expect(page.getByText("Actividad primaria de fixture")).toBeVisible();
    await shot(page, "04-resultado-effective.png");

    await page.goto(
      "/admin/official-consultant-control-panel/local-ui-fixtures?fixture=no-profile",
      { waitUntil: "domcontentloaded" },
    );
    await expect(
      page.getByText(
        "Seleccione un perfil funcional para consultar la cobertura de actividades.",
      ),
    ).toBeVisible();
  });
});
