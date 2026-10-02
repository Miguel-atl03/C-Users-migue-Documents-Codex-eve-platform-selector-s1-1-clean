import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

import {
  authenticateLocalConsultant,
  expectCompaniesHydrated,
  openOfficialPanelWithSession,
} from "./helpers/authenticate-local-consultant";

const CANONICAL_PATH =
  "/admin/official-consultant-control-panel?mode=client-company&view=monitoring" +
  "&company=5c08029f-15e9-4bbd-b13e-0ff4765e23b8" +
  "&relationship=7c499a1c-31c6-4fc9-8b20-2fd8cdc57043" +
  "&case=19fc9eff-4219-43f0-854c-e2b3350f23f2";

const P1 = "b1000000-0000-4000-8000-000000000001";
const P2 = "b1000000-0000-4000-8000-000000000002";
const PR1 = "b2000000-0000-4000-8000-000000000001";
const PR_B1 = "b2000000-0000-4000-8000-000000000011";
const PR_B2 = "b2000000-0000-4000-8000-000000000012";
const PR_PENDING = "b2000000-0000-4000-8000-000000000003";
const PR_MIXED = "b2000000-0000-4000-8000-000000000004";

const SHOT_DIR = resolve("reports/local/r2b/screenshots");

async function shot(page: Page, name: string) {
  mkdirSync(SHOT_DIR, { recursive: true });
  await page.screenshot({
    path: resolve(SHOT_DIR, name),
    fullPage: true,
  });
}

async function mockParticipants(page: Page, body: unknown) {
  await page.route(/\/cases\/[^/]+\/participants(?:\?.*)?$/, async (route) => {
    if (route.request().url().includes("/profiles")) {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
}

async function mockProfiles(
  page: Page,
  byParticipant: Record<string, unknown>,
) {
  await page.route(
    /\/cases\/[^/]+\/participants\/[^/]+\/profiles(?:\?.*)?$/,
    async (route) => {
      const match = route
        .request()
        .url()
        .match(/\/participants\/([^/]+)\/profiles/);
      const participantId = match?.[1] ?? "";
      const body = byParticipant[participantId] ?? { profiles: [] };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    },
  );
}

test.describe("Official Consultant Control Panel — Tramo R2B", () => {
  test.beforeEach(async ({ context, request }) => {
    await authenticateLocalConsultant(context, request);
  });

  test("Amber contexto activo sin Cargando empresas permanente", async ({
    page,
  }) => {
    await openOfficialPanelWithSession(page, CANONICAL_PATH);
    await expectCompaniesHydrated(page);

    await expect(page.locator("#client-company")).toHaveValue("Cervecería Amber");
    await expect(page.locator("#active-relationship")).toHaveValue(
      "7c499a1c-31c6-4fc9-8b20-2fd8cdc57043",
    );
    await expect(page.locator("#current-case")).toHaveValue(
      "19fc9eff-4219-43f0-854c-e2b3350f23f2",
    );
    await expect(
      page.getByRole("heading", { name: "Monitoreo de Empresa Cliente" }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.locator("#current-case option:checked"),
    ).toHaveText("Caso INC16 Cervecería Amber Ancestral");

    await expect(page.getByText("Cargando empresas…")).toHaveCount(0);

    await shot(page, "09-amber-contexto-activo.png");

    const participantsRegion = page.getByRole("region", {
      name: "Usuarios del caso",
    });
    await expect(
      page.getByRole("heading", { name: "Usuarios del caso" }),
    ).toBeVisible();
    await expect(
      participantsRegion.getByText(
        "Este caso no tiene personas participantes registradas.",
        { exact: true },
      ),
    ).toBeVisible();
    await shot(page, "10-amber-personas-vacio-visible.png");
  });

  test("Amber sin participantes muestra vacío factual", async ({ page }) => {
    await openOfficialPanelWithSession(page, CANONICAL_PATH);
    const participantsRegion = page.getByRole("region", {
      name: "Usuarios del caso",
    });
    await expect(
      page.getByRole("heading", { name: "Usuarios del caso" }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      participantsRegion.getByText(
        "Este caso no tiene personas participantes registradas.",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(participantsRegion.getByRole("alert")).toHaveCount(0);
    await expect(page.getByText("Ventas", { exact: true })).toHaveCount(0);
    await shot(page, "01-amber-sin-participantes.png");
    await page.setViewportSize({ width: 1280, height: 900 });
    await shot(page, "06-desktop.png");
    await shot(page, "13-desktop-completo.png");
    await page.setViewportSize({ width: 768, height: 1024 });
    await shot(page, "07-tablet.png");
    await shot(page, "14-tablet.png");
    await page.setViewportSize({ width: 390, height: 844 });
    await shot(page, "08-mobile.png");
    await shot(page, "15-mobile.png");
  });

  test("participante con un perfil y multiperfil (test-only mocks)", async ({
    page,
  }) => {
    await mockParticipants(page, {
      participants: [
        {
          id: P1,
          label: "Persona test A",
          profileCount: 1,
          participationStatusLabel: "Activa",
          profileResolutionStatus: "resolved",
        },
        {
          id: P2,
          label: "Persona test B",
          profileCount: 2,
          participationStatusLabel: "Activa",
          profileResolutionStatus: "resolved",
        },
      ],
    });
    await mockProfiles(page, {
      [P1]: {
        profiles: [
          { id: PR1, label: "Perfil operativo A", resolutionStatus: "resolved" },
        ],
      },
      [P2]: {
        profiles: [
          { id: PR_B1, label: "Perfil operativo B1", resolutionStatus: "resolved" },
          { id: PR_B2, label: "Perfil operativo B2", resolutionStatus: "resolved" },
        ],
      },
    });

    const responsePromise = page.waitForResponse(
      (response) =>
        /\/participants(?:\?|$)/.test(response.url()) &&
        !response.url().includes("/profiles") &&
        response.ok(),
      { timeout: 30_000 },
    );
    await openOfficialPanelWithSession(page, CANONICAL_PATH);
    await responsePromise;

    await expect(page.getByText("Persona test A")).toBeVisible();
    await page.getByRole("button", { name: /Persona test A/ }).click();
    await expect(page.getByText("Perfil operativo A")).toBeVisible();
    await expect(page.getByText("Confirmado").first()).toBeVisible();
    await shot(page, "02-participante-un-perfil.png");
    await shot(page, "11-participante-expandido.png");

    await page
      .getByRole("button", { name: /Rol funcional.*Perfil operativo A/ })
      .click();
    await expect(page).toHaveURL(new RegExp(`profile=${PR1}`));
    await shot(page, "12-perfil-seleccionado.png");

    const profilesResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/participants/${P2}/profiles`) &&
        response.ok(),
      { timeout: 15_000 },
    );
    await page.getByRole("button", { name: /Persona test B/ }).click();
    await profilesResponse;
    await expect(page.getByText("Perfil operativo B1")).toBeVisible();
    await expect(page.getByText("Perfil operativo B2")).toBeVisible();
    await shot(page, "03-participante-multiperfil.png");
  });

  test("estados pendientes y mixed-unresolved", async ({ page }) => {
    await mockParticipants(page, {
      participants: [
        {
          id: P1,
          label: "Persona pendiente",
          profileCount: 1,
          participationStatusLabel: "Asignación pendiente",
          profileResolutionStatus: "partial",
        },
        {
          id: P2,
          label: "Persona mixed",
          profileCount: 1,
          participationStatusLabel: "Activa",
          profileResolutionStatus: "unresolved",
        },
      ],
    });
    await mockProfiles(page, {
      [P1]: {
        profiles: [
          {
            id: PR_PENDING,
            label: "Perfil sugerido",
            resolutionStatus: "unavailable",
          },
        ],
      },
      [P2]: {
        profiles: [
          {
            id: PR_MIXED,
            label: "Perfil ambiguo",
            resolutionStatus: "mixed-unresolved",
          },
        ],
      },
    });

    await openOfficialPanelWithSession(page, CANONICAL_PATH);
    await expect(
      page.getByText("Existen participantes con asignación funcional incompleta."),
    ).toBeVisible({ timeout: 30_000 });

    await page.getByRole("button", { name: /Persona pendiente/ }).click();
    await expect(page.getByText("No disponible").first()).toBeVisible();
    await shot(page, "04-asignacion-pendiente.png");

    await page.getByRole("button", { name: /Persona mixed/ }).click();
    await expect(page.getByText("Asignación no resuelta").first()).toBeVisible();
    await shot(page, "05-mixed-unresolved.png");
  });

  test("URL participant/profile y KPI permanecen inactivos", async ({
    page,
  }) => {
    await mockParticipants(page, {
      participants: [
        {
          id: P1,
          label: "Persona URL",
          profileCount: 1,
          participationStatusLabel: "Activa",
          profileResolutionStatus: "resolved",
        },
      ],
    });
    await mockProfiles(page, {
      [P1]: {
        profiles: [
          { id: PR1, label: "Perfil URL", resolutionStatus: "resolved" },
        ],
      },
    });

    await openOfficialPanelWithSession(
      page,
      `${CANONICAL_PATH}&participant=${P1}&profile=${PR1}`,
    );
    await expect(
      page.getByRole("button", { name: /Rol funcional.*Perfil URL/ }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page).toHaveURL(new RegExp(`participant=${P1}`));
    await expect(page).toHaveURL(new RegExp(`profile=${PR1}`));

    await expect(page.getByLabel("Hitos core alcanzados: Sin datos")).toHaveText("—");
    await expect(page.getByLabel("Alertas de experiencia: Sin datos")).toHaveText(
      "—",
    );
  });
});
