import { test, expect } from "@playwright/test";

const PANEL_PATH = "/admin/official-consultant-control-panel?mode=client-company&view=monitoring";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TEST_PASSWORD = process.env.EVE_UNIT2B_TEST_PASSWORD;

const FORBIDDEN_TEXT = [
  "P-SUP-01",
  "Caso abierto",
  "SCR consolidado",
  "ReadyForTransduction",
  "ROLE_ASSIGNMENT_GAP",
  "Cervecería",
  "Diseño",
  "0 / 7",
  "0 confirmados",
  "Experto",
  "Operador interno",
  "Supervisor",
  "Auditor",
];

test.describe("Official Consultant Control Panel — Unit 1 closure", () => {
  test.beforeEach(async ({ context, request }) => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !TEST_PASSWORD) {
      throw new Error("official_panel_e2e_environment_missing");
    }
    const authResponse = await request.post(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
        },
        data: {
          email: "unit2b-consultant@example.invalid",
          password: TEST_PASSWORD,
        },
      },
    );
    expect(authResponse.ok()).toBe(true);
    const session = await authResponse.json();
    session.expires_at ??=
      Math.floor(Date.now() / 1000) + Number(session.expires_in ?? 3600);
    const storageKey = `sb-${new URL(SUPABASE_URL).hostname.split(".")[0]}-auth-token`;
    await context.addInitScript(
      ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
      { key: storageKey, value: session },
    );
    await context.addCookies([
      {
        name: "eve_consultant_role",
        value: "consultant",
        domain: "127.0.0.1",
        path: "/",
      },
    ]);
  });

  test("renders official panel with auth and context selectors", async ({ page }) => {
    await page.goto(PANEL_PATH);

    const header = page.getByRole("banner", { name: "Panel de Control EVE" });

    await expect(header.getByLabel("EVE")).toBeVisible();
    await expect(header.getByText("Enterprise Viability Engine™")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Panel de Control EVE" })).toBeVisible();
    await expect(header.getByLabel("Empresa cliente", { exact: true })).toBeVisible();
    await expect(header.getByLabel("Relación activa", { exact: true })).toBeDisabled();
    await expect(header.getByLabel("Caso en curso", { exact: true })).toBeDisabled();
    await expect(header.getByText("Participación", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("Rol: Consultor")).toBeVisible();

    const body = await page.locator("body").innerText();
    for (const forbiddenRole of ["Experto", "Operador interno", "Supervisor", "Auditor"]) {
      expect(body).not.toContain(forbiddenRole);
    }
  });

  test("renders five KPI cells: situational + metric shells", async ({ page }) => {
    await page.goto(PANEL_PATH);

    const kpiLabels = [
      "Estado actual",
      "Próximo paso",
      "Atención requerida",
      "Hitos core alcanzados",
      "Alertas de experiencia",
    ];

    for (const label of kpiLabels) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }

    for (const retired of [
      "Participación",
      "Usuarios",
      "Roles funcionales",
      "Actividades primarias",
      "Procesos manuales",
      "Findings / rework",
    ]) {
      await expect(page.getByText(retired, { exact: true })).toHaveCount(0);
    }

    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/\b0\s*\/\s*\d+/);
  });

  test("keeps support process axis without inventing ops state", async ({ page }) => {
    await page.goto(PANEL_PATH);

    await expect(page.getByLabel("Procesos de soporte", { exact: true })).toBeVisible();
    await expect(page.getByText("Resumen auxiliar del caso")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Hitos auxiliares del caso" })).toBeVisible();
    await expect(page.getByText("P-CORE-01")).toHaveCount(0);
    await expect(page.getByText("PF-CORE-01")).toHaveCount(0);

    const body = await page.locator("body").innerText();
    for (const forbidden of FORBIDDEN_TEXT) {
      expect(body).not.toContain(forbidden);
    }
  });

  test("context drawer starts collapsed and opens/closes accessibly", async ({ page }) => {
    await page.goto(PANEL_PATH);

    const openButton = page.getByRole("button", { name: "Abrir panel contextual" });
    await expect(openButton).toBeVisible();
    await expect(openButton).toHaveAttribute("aria-expanded", "false");

    await openButton.click();
    await expect(page.getByRole("button", { name: "Cerrar panel contextual" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Cerrar panel contextual" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect(
      page.getByText(
        "Seleccione una empresa cliente, una relación activa y un caso en curso para consultar atención requerida.",
      ),
    ).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(openButton).toBeFocused();
    await expect(openButton).toHaveAttribute("aria-expanded", "false");
  });

  test("subview tabs push history and back/forward works", async ({ page }) => {
    await page.goto(PANEL_PATH);

    await page.getByRole("tab", { name: "Seguimiento", exact: true }).click();
    await expect(page).toHaveURL(/view=tracking/);

    await page.locator("#official-panel-view-governance").click();
    await expect(page).toHaveURL(/view=governance/);

    await page.goBack();
    await expect(page).toHaveURL(/view=tracking/);
    await expect(page.locator("#official-panel-view-tracking")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await page.goBack();
    await expect(page).toHaveURL(/view=monitoring/);
    await expect(page.locator("#official-panel-view-monitoring")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await page.goForward();
    await expect(page).toHaveURL(/view=tracking/);
  });

  test("shell loading and error states render without remote data", async ({ page }) => {
    await page.goto(`${PANEL_PATH}&shellState=loading`);
    await expect(page.getByText("Cargando panel de control oficial…")).toBeAttached();

    await page.goto(`${PANEL_PATH}&shellState=error`);
    await expect(page.getByText("No fue posible preparar el panel.")).toBeVisible();
    await page.getByRole("button", { name: "Reintentar" }).click();
    await expect(page).toHaveURL(/view=monitoring/);
    await expect(page).not.toHaveURL(/shellState=error/);
  });

  test("structural accessibility landmarks and tab selection", async ({ page }) => {
    await page.goto(PANEL_PATH);

    await expect(page.getByRole("banner", { name: "Panel de Control EVE" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Indicadores del caso" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Monitoreo", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#official-panel-view-governance")).toHaveAttribute(
      "aria-selected",
      "false",
    );
    await expect(page.getByRole("tab", { name: "Diseño", exact: true })).toHaveCount(0);
  });

  test("keyboard tab order and visible focus follow the interactive shell", async ({ page }) => {
    await page.goto(PANEL_PATH);
    await expect(page.locator("#client-company")).toBeEnabled();

    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

    const expectedOrder = [
      page.getByRole("combobox", { name: "Empresa cliente" }),
      page.getByRole("tab", { name: "Empresa Cliente", exact: true }),
      page.getByRole("tab", { name: "Monitoreo", exact: true }),
      page.getByRole("tab", { name: "Seguimiento", exact: true }),
      page.getByRole("tab", { name: "Gobernanza", exact: true }),
      page.getByRole("button", { name: "Abrir panel contextual" }),
    ];

    for (const control of expectedOrder) {
      await page.keyboard.press("Tab");
      await expect(control).toBeFocused();
    }

    await page.keyboard.press("Shift+Tab");
    const governanceTab = page.getByRole("tab", { name: "Gobernanza", exact: true });
    await expect(governanceTab).toBeFocused();
    await expect
      .poll(() =>
        governanceTab.evaluate((element) => getComputedStyle(element).boxShadow),
      )
      .not.toBe("none");
  });

  test("ready-empty keeps normal shell contrast and only disables future governance", async ({
    page,
  }) => {
    await page.goto(PANEL_PATH);

    const shell = page.locator("main");
    const appShell = page.locator("main > div");
    const mainColumn = page.locator("main > div > div");

    for (const container of [shell, appShell, mainColumn]) {
      await expect(container).toHaveCSS("opacity", "1");
      await expect(container).toHaveCSS("filter", "none");
      await expect(container).toHaveCSS("pointer-events", "auto");
    }

    const workspace = page
      .getByRole("heading", { name: "Monitoreo de Empresa Cliente" })
      .locator("..");
    await expect(workspace).not.toHaveAttribute("aria-disabled", "true");
    await expect(workspace).toHaveCSS("opacity", "1");

    for (const tabName of ["Monitoreo", "Seguimiento", "Gobernanza"]) {
      await expect(page.getByRole("tab", { name: tabName, exact: true })).toBeEnabled();
    }

    const futureGovernance = page.getByRole("tab", {
      name: /Gobernanza de Experiencia/,
    });
    await expect(futureGovernance).toBeDisabled();
    await expect(futureGovernance).toHaveAttribute("aria-disabled", "true");

    const drawerButton = page.getByRole("button", {
      name: "Abrir panel contextual",
    });
    await expect(drawerButton).toBeEnabled();
    await expect(drawerButton).toHaveAttribute("aria-expanded", "false");
  });
});
