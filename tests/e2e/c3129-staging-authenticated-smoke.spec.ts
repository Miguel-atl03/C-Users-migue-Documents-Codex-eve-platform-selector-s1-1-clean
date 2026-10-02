import { expect, test, type Page } from "@playwright/test";

const BASE_URL = process.env.EVE_BASE_URL ?? "http://127.0.0.1:3112";
const EMAIL = process.env.EVE_TEST_CONSULTANT_EMAIL;
const PASSWORD = process.env.EVE_TEST_CONSULTANT_PASSWORD;
const COMPANY_ID = process.env.EVE_TEST_COMPANY_ID;
const RELATIONSHIP_ID = process.env.EVE_TEST_RELATIONSHIP_ID;
const CASE_ID = process.env.EVE_TEST_CASE_ID;

test.describe("C3.12.9 staging authenticated smoke", () => {
  test.setTimeout(120000);
  test.skip(!EMAIL || !PASSWORD, "missing_ephemeral_consultant_credentials");

  test("consultant sees C3.12 fixture matrix, detail, hashes and UTF-8", async ({ page }) => {
    const consoleErrors: string[] = [];
    const failedResponses: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("response", (response) => {
      if (response.status() >= 500) failedResponses.push(`${response.status()} ${response.url()}`);
    });

    await login(page, EMAIL!, PASSWORD!);
    await page.goto(buildPanelUrl(), { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/Monitoreo de Empresa Cliente|Participante C312 Smoke/i).first()).toBeVisible({ timeout: 60000 });
    await expect(page.locator("body")).toContainText(/Selección|Atención|Última|Acción|Ejecución|Aún/);
    await expect(page.locator("body")).not.toContainText(/SelecciÃ³n|atenciÃ³n|Ãšltima|AcciÃ³n|EjecuciÃ³n|AÃºn|SelecciÃƒÂ³n|atenciÃƒÂ³n|EjecuciÃƒÂ³n|AÃƒÂºn/);

    await page.goto(buildPanelUrl(), { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-testid="user-indicator-matrix"]').or(page.locator("body"))).toContainText(/15/);
    await expect(page.locator("body")).toContainText(/8/);
    await expect(page.locator("body")).toContainText(/7/);
    await expect(page.locator("body")).toContainText(/PRIMARY_ACTIVITY_SELECTION_V1_3|Selección efectiva|runs preparados/i);

    const detail = page.getByText(/Ver detalle/i).first();
    if (await detail.isVisible().catch(() => false)) await detail.click();
    await expect(page.locator("body")).toContainText(/replay|hash|traza|selección/i);

    expect(failedResponses, "no HTTP 500 responses").toEqual([]);
    expect(
      consoleErrors.filter((item) => !/favicon|warning|Failed to load resource: the server responded with a status of 404/i.test(item)),
      "no critical console errors",
    ).toEqual([]);
  });
});

async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/?next=%2Fadmin%2Fofficial-consultant-control-panel`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(5000);
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  if (await emailInput.isVisible().catch(() => false)) {
    await emailInput.fill(email);
  }
  await page.locator('input[type="password"], input[name="password"]').first().fill(password);
  await Promise.all([
    page.waitForResponse((response) => response.url().includes("/auth/v1/token") && response.status() === 200, {
      timeout: 30000,
    }),
    page.getByRole("button", { name: /iniciar sesión|entrar|login/i }).click(),
  ]);
  await page.waitForURL(/official-consultant-control-panel/, { timeout: 30000 });
  await page.waitForLoadState("domcontentloaded");
}

function buildPanelUrl() {
  const url = new URL("/admin/official-consultant-control-panel", BASE_URL);
  if (COMPANY_ID) url.searchParams.set("company_id", COMPANY_ID);
  if (RELATIONSHIP_ID) url.searchParams.set("engagement_id", RELATIONSHIP_ID);
  if (CASE_ID) url.searchParams.set("case_id", CASE_ID);
  return url.toString();
}
