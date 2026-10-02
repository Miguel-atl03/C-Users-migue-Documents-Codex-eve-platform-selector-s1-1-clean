import { test, expect, type Page, type Locator } from "@playwright/test";
import { resolve } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { authenticateLocalConsultant } from "./helpers/authenticate-local-consultant";

const SHOT_DIR = resolve(
  "reports/local/experience-governance-correction/screenshots",
);
const REPORT_DIR = resolve("reports/local/experience-governance-correction");
const AMBER_CASE = "19fc9eff-4219-43f0-854c-e2b3350f23f2";
const AMBER_COMPANY = "5c08029f-15e9-4bbd-b13e-0ff4765e23b8";
const AMBER_REL = "7c499a1c-31c6-4fc9-8b20-2fd8cdc57043";

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "tablet", width: 1024, height: 1366 },
  { name: "mobile", width: 390, height: 844 },
] as const;

async function shot(page: Page, name: string) {
  await page.screenshot({
    path: resolve(SHOT_DIR, name),
    fullPage: true,
  });
}

async function waitExperienceReady(page: Page) {
  await expect(page.getByTestId("experience-governance-mode")).toBeVisible({
    timeout: 60_000,
  });
  await expect(page.getByText(/Cargando estado de experiencia/i)).toHaveCount(
    0,
    { timeout: 60_000 },
  );
}

async function openAmberExperience(
  page: Page,
  view: "journeys" | "support" | "screen_health",
) {
  await page.goto(
    `/admin/official-consultant-control-panel?mode=user-experience-governance&view=${view}` +
      `&company=${AMBER_COMPANY}&relationship=${AMBER_REL}&case=${AMBER_CASE}`,
    { waitUntil: "domcontentloaded" },
  );
  await waitExperienceReady(page);
}

async function assertNoInternalOverflow(locator: Locator) {
  const metrics = await locator.evaluate((el) => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
  }));
  expect(metrics.scrollWidth, "overflow-x").toBeLessThanOrEqual(
    metrics.clientWidth + 1,
  );
  expect(metrics.scrollHeight, "overflow-y").toBeLessThanOrEqual(
    metrics.clientHeight + 1,
  );
}

async function assertFullyInViewport(
  locator: Locator,
  viewport: { width: number; height: number },
) {
  await locator.scrollIntoViewIfNeeded();
  const metrics = await locator.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    };
  });
  expect(metrics.width).toBeGreaterThan(0);
  expect(metrics.height).toBeGreaterThan(0);
  expect(metrics.left).toBeGreaterThanOrEqual(0);
  expect(metrics.top).toBeGreaterThanOrEqual(0);
  expect(metrics.right).toBeLessThanOrEqual(viewport.width + 1);
  expect(metrics.bottom).toBeLessThanOrEqual(viewport.height + 1);
}

async function assertInsideRail(child: Locator, rail: Locator) {
  const boxes = await Promise.all([child.boundingBox(), rail.boundingBox()]);
  const [childBox, railBox] = boxes;
  expect(childBox).not.toBeNull();
  expect(railBox).not.toBeNull();
  if (!childBox || !railBox) return;
  expect(childBox.x).toBeGreaterThanOrEqual(railBox.x - 1);
  expect(childBox.y).toBeGreaterThanOrEqual(railBox.y - 1);
  expect(childBox.x + childBox.width).toBeLessThanOrEqual(
    railBox.x + railBox.width + 1,
  );
  expect(childBox.y + childBox.height).toBeLessThanOrEqual(
    railBox.y + railBox.height + 1,
  );
}

async function assertCollapsedRailHorizontal(
  page: Page,
  viewport: { name: string; width: number; height: number },
) {
  await page.setViewportSize({
    width: viewport.width,
    height: viewport.height,
  });

  const rail = page.getByTestId("attention-collapsed-rail");
  const label = page.getByTestId("attention-collapsed-label");
  const openButton = page.getByTestId("attention-open-drawer");
  const openLabel = page.getByTestId("attention-open-drawer-label");

  await expect(rail).toBeVisible();
  await expect(label).toBeVisible();
  await expect(openLabel).toBeVisible();
  await expect(openButton).toBeEnabled();
  await expect(openButton).toHaveAttribute(
    "aria-label",
    "Abrir panel contextual",
  );
  await expect(openButton).toHaveAttribute("aria-expanded", "false");

  for (const el of [label, openLabel]) {
    const styles = await el.evaluate((node) => {
      const computed = getComputedStyle(node);
      return {
        writingMode: computed.writingMode,
        textOrientation: computed.textOrientation,
      };
    });
    expect(
      styles.writingMode,
      `${viewport.name} writing-mode=${styles.writingMode}`,
    ).toBe("horizontal-tb");
    expect(styles.writingMode).not.toBe("vertical-rl");
  }

  await assertNoInternalOverflow(rail);
  await assertNoInternalOverflow(openButton);
  await assertFullyInViewport(openButton, viewport);
  await assertFullyInViewport(openLabel, viewport);
  await assertFullyInViewport(label, viewport);
  await assertInsideRail(openButton, rail);
  await assertInsideRail(openLabel, rail);
  await assertInsideRail(label, rail);

  return { rail, label, openButton, openLabel };
}

async function assertDrawerInteraction(page: Page, openButton: Locator) {
  await openButton.click();
  const closeButton = page.getByRole("button", {
    name: "Cerrar panel contextual",
  });
  await expect(closeButton).toBeVisible();
  await expect(closeButton).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByTestId("attention-governance-panel")).toHaveAttribute(
    "data-drawer-state",
    "expanded",
  );
  await expect(page.getByTestId("attention-collapsed-rail")).toHaveCount(0);

  await page.keyboard.press("Escape");
  await expect(openButton).toBeVisible();
  await expect(openButton).toHaveAttribute("aria-expanded", "false");
  await expect(openButton).toBeFocused();
  await expect(page.getByTestId("attention-governance-panel")).toHaveAttribute(
    "data-drawer-state",
    "collapsed",
  );
  await expect(page.getByTestId("attention-collapsed-rail")).toBeVisible();
}

test.describe("Gobernanza de Experiencia — corrección visual Amber", () => {
  test.setTimeout(300_000);

  test.beforeAll(() => {
    mkdirSync(SHOT_DIR, { recursive: true });
    mkdirSync(REPORT_DIR, { recursive: true });
    // Identities are expected to already exist from local panel setup.
    // Prefer process env (ephemeral password + service_role); do not require .env.local.
    const nodeArgs = [
      "scripts/eve/official-control-panel/provision-official-consultant.mjs",
      "--access-identities",
    ];
    const provision = spawnSync("node", nodeArgs, {
      encoding: "utf8",
      shell: true,
      env: {
        ...process.env,
        EVE_PROVISION_CONFIRM: "UNIT2A_ADMIN",
      },
    });
    if (provision.status !== 0) {
      const detail = `${provision.stderr || ""}${provision.stdout || ""}`;
      // Soft-skip when admin env is unavailable but local identities already exist.
      if (!/confirm_required|supabase_admin_environment_missing|missing_env/.test(detail)) {
        throw new Error(`provision_failed:${detail}`);
      }
    }
  });

  test("estado unificado, vacíos factuales y sin códigos técnicos", async ({
    page,
    context,
  }) => {
    await authenticateLocalConsultant(context, context.request);

    await openAmberExperience(page, "journeys");
    await expect(page.getByTestId("kpi-current-status")).toHaveText(
      "No disponible",
    );
    await expect(page.getByTestId("kpi-next-step")).toHaveText("No disponible");
    await expect(page.getByTestId("experience-company-state")).toHaveText(
      /Estado Empresa Cliente: No disponible/,
    );
    await expect(page.getByText("En curso", { exact: true })).toHaveCount(0);
    await expect(page.getByTestId("experience-journey-empty")).toHaveText(
      "Sin eventos de experiencia registrados.",
    );
    await expect(page.getByText("effective_scope")).toHaveCount(0);
    await expect(page.getByText("ready-empty")).toHaveCount(0);
    await expect(page.getByText("unit-1-shell")).toHaveCount(0);
    await expect(
      page.getByText("Subvistas en el workspace de experiencia"),
    ).toHaveCount(0);
    await expect(page.getByTestId("kpi-experience-alerts")).toHaveText("0");
    await expect(page.locator("#client-company")).toHaveValue("Cervecería Amber");
    await shot(page, "01-trayectorias-corregida.png");

    await openAmberExperience(page, "support");
    await expect(page.getByTestId("experience-support-empty")).toHaveText(
      "Sin solicitudes de soporte.",
    );
    await expect(page.getByTestId("kpi-current-status")).toHaveText(
      "No disponible",
    );
    await expect(page.getByTestId("experience-company-state")).toHaveText(
      /Estado Empresa Cliente: No disponible/,
    );
    await shot(page, "02-soporte-corregido.png");

    await openAmberExperience(page, "screen_health");
    await expect(page.getByTestId("experience-health-empty")).toHaveText(
      "Sin información disponible.",
    );
    await expect(page.getByTestId("kpi-current-status")).toHaveText(
      "No disponible",
    );
    await shot(page, "03-salud-pantallas-corregida.png");

    await page
      .getByRole("button", { name: "Abrir panel contextual" })
      .click();
    await expect(page.getByTestId("attention-company-state")).toHaveText(
      /Estado Empresa Cliente: No disponible/,
    );
    await expect(page.getByTestId("attention-empty-factual")).toBeVisible();
    await expect(page.getByTestId("attention-empty-factual")).toContainText(
      /Sin alertas activas para el caso|Parte de la información de atención no pudo evaluarse/,
    );
    await expect(
      page.getByText(
        "Las alertas y la gobernanza se habilitarán en las siguientes unidades.",
      ),
    ).toHaveCount(0);

    await page
      .getByRole("button", { name: "Cerrar panel contextual" })
      .click();
  });

  test("rail colapsado horizontal como Hitos Core (1440/1024/390) + captura 04", async ({
    page,
    context,
  }) => {
    await authenticateLocalConsultant(context, context.request);
    await openAmberExperience(page, "journeys");

    const results: Array<{
      viewport: string;
      horizontal: "PASS";
      overflow: 0;
      drawerFocus: "PASS";
    }> = [];

    for (const viewport of VIEWPORTS) {
      const { openButton } = await assertCollapsedRailHorizontal(page, viewport);

      if (viewport.name === "desktop") {
        await shot(page, "04-rail-atencion-gobernanza-corregido.png");
      }

      await assertDrawerInteraction(page, openButton);

      // After close, rail must remain horizontal (parity with Hitos Core).
      const labelMode = await page
        .getByTestId("attention-collapsed-label")
        .evaluate((node) => getComputedStyle(node).writingMode);
      expect(labelMode).toBe("horizontal-tb");

      results.push({
        viewport: viewport.name,
        horizontal: "PASS",
        overflow: 0,
        drawerFocus: "PASS",
      });
    }

    writeFileSync(
      resolve(REPORT_DIR, "rail-responsive-e2e-result.json"),
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          desktop_horizontal: "PASS",
          tablet_horizontal: "PASS",
          mobile_horizontal: "PASS",
          overflow: 0,
          drawer_foco: "PASS",
          pattern: "writing-mode:horizontal-tb (parity with Hitos Core)",
          results,
        },
        null,
        2,
      ),
      "utf8",
    );
  });
});
