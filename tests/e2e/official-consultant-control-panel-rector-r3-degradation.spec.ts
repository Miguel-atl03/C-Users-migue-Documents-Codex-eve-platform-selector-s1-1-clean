import { test, expect, type Page, type APIRequestContext, type BrowserContext } from "@playwright/test";
import { resolve } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { authenticateLocalConsultant } from "./helpers/authenticate-local-consultant";

const SHOT_DIR = resolve("reports/local/rector-r3-degradation/screenshots");
const RESULTS = resolve("reports/local/rector-r3-degradation/results");
const FX08_MANIFEST = resolve("reports/local/rector-r2-fx08/manifest.json");
const AMBER_CASE = "19fc9eff-4219-43f0-854c-e2b3350f23f2";
const AMBER_COMPANY = "5c08029f-15e9-4bbd-b13e-0ff4765e23b8";
const AMBER_REL = "7c499a1c-31c6-4fc9-8b20-2fd8cdc57043";

type Fx08Manifest = {
  caseId: string;
  companyFx08Id: string;
  trackingUrl: string;
  workItems: {
    "P-SUP-03": { id: string; inputPackageArtifactId: string };
  };
  consultants: {
    a: { email: string };
    b: { email: string };
  };
};

async function shot(page: Page, name: string) {
  await page.screenshot({ path: resolve(SHOT_DIR, name), fullPage: true });
}

async function assertNoDevChrome(page: Page) {
  await expect(page.locator("nextjs-portal")).toHaveCount(0);
  await expect(page.locator("[data-nextjs-toast]")).toHaveCount(0);
  await expect(page.getByText(/Rendering…|Compiling…/i)).toHaveCount(0);
}

async function assertNoGlobalOverflow(page: Page) {
  const metrics = await page.evaluate(() => {
    const vw = window.innerWidth;
    const docW = document.documentElement.scrollWidth;
    const bodyW = document.body.scrollWidth;
    const selectors = [
      "[data-testid='mode-client-company']",
      "[data-testid='mode-experience-governance']",
      "[data-testid='kpi-current-status']",
      "[data-testid='attention-governance-panel']",
      "[data-testid='attention-open-drawer']",
    ];
    const controls = selectors.map((sel) => {
      const el = document.querySelector(sel);
      if (!el) return { sel, missing: true as const };
      const r = el.getBoundingClientRect();
      return {
        sel,
        missing: false as const,
        left: r.left,
        right: r.right,
      };
    });
    return { vw, docW, bodyW, controls };
  });
  expect(metrics.docW).toBeLessThanOrEqual(metrics.vw);
  expect(metrics.bodyW).toBeLessThanOrEqual(metrics.vw);
  for (const control of metrics.controls) {
    if (control.missing) continue;
    expect(control.left, control.sel).toBeGreaterThanOrEqual(0);
    expect(control.right, control.sel).toBeLessThanOrEqual(metrics.vw + 1);
  }
}

async function gotoStable(page: Page, url: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
      return;
    } catch (error) {
      if (attempt === 2) throw error;
      await page.waitForTimeout(1000);
    }
  }
}

function sha256File(name: string): string {
  const buf = readFileSync(resolve(SHOT_DIR, name));
  return createHash("sha256").update(buf).digest("hex");
}

function seedFx08(): Fx08Manifest {
  const r = spawnSync(
    "node",
    [
      "--env-file=.env.local",
      "scripts/eve/official-control-panel/seed-fx08-manual-actions-test.mjs",
    ],
    { encoding: "utf8", shell: true },
  );
  if (r.status !== 0) {
    throw new Error(`fx08_seed_failed:${r.stderr || r.stdout}`);
  }
  return JSON.parse(readFileSync(FX08_MANIFEST, "utf8")) as Fx08Manifest;
}

async function bearerFor(
  context: BrowserContext,
  request: APIRequestContext,
  email: string,
): Promise<string> {
  const auth = await authenticateLocalConsultant(context, request, { email });
  return auth.accessToken;
}

test.describe("R3 — degradation / loading / accessibility (factual)", () => {
  test.setTimeout(600_000);

  test.beforeAll(() => {
    mkdirSync(SHOT_DIR, { recursive: true });
    mkdirSync(RESULTS, { recursive: true });
  });

  test("estados de degradación factuales + Amber + responsive", async ({
    page,
    context,
    request,
    browser,
  }) => {
    const manifest = seedFx08();
    const experienceUrl = `/admin/official-consultant-control-panel?mode=user-experience-governance&view=journeys&company=${manifest.companyFx08Id}&relationship=a2080008-0000-4000-8000-000000000002&case=${manifest.caseId}`;
    const monitoringUrl = `/admin/official-consultant-control-panel?mode=client-company&view=monitoring&company=${manifest.companyFx08Id}&relationship=a2080008-0000-4000-8000-000000000002&case=${manifest.caseId}`;

    await authenticateLocalConsultant(context, request, {
      email: manifest.consultants.a.email,
    });

    // --- 01 loading (delay experience-state, no fake values) ---
    await page.unrouteAll({ behavior: "ignoreErrors" });
    let releaseLoading = false;
    await page.route("**/experience-state**", async (route) => {
      const started = Date.now();
      while (!releaseLoading && Date.now() - started < 20_000) {
        await new Promise((r) => setTimeout(r, 50));
      }
      try {
        const response = await route.fetch();
        await route.fulfill({ response });
      } catch {
        try {
          await route.continue();
        } catch {
          /* ignore */
        }
      }
    });
    await gotoStable(page, experienceUrl);
    await expect(page.getByTestId("panel-section-loading")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("kpi-experience-alerts")).not.toHaveText(
      /^0$/,
    );
    await shot(page, "01-loading.png");
    releaseLoading = true;
    await expect(page.getByTestId("experience-governance-mode")).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByTestId("experience-governance-mode")).toHaveAttribute(
      "data-screen-state",
      "ready",
      { timeout: 60_000 },
    );
    await page.unrouteAll({ behavior: "ignoreErrors" });
    await expect(page.getByTestId("panel-soft-refresh")).toHaveCount(1);

    // --- 02 refreshing: soft delay while content conserved (no reload) ---
    await page.route("**/experience-state**", async (route) => {
      await new Promise((r) => setTimeout(r, 8000));
      try {
        await route.continue();
      } catch {
        /* aborted after unroute */
      }
    });
    await page.getByTestId("panel-soft-refresh").evaluate((el: HTMLElement) => {
      el.click();
    });
    await expect(page.getByTestId("panel-refresh-notice")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("experience-governance-mode")).toHaveAttribute(
      "data-screen-state",
      "refreshing",
    );
    await expect(page.getByTestId("panel-section-loading")).toHaveCount(0);
    await expect(page.getByTestId("experience-company-state")).toBeVisible();
    await assertNoDevChrome(page);
    await shot(page, "02-refreshing.png");
    // End the delayed interceptor; remount cleanly for subsequent scenarios.
    await page.unrouteAll({ behavior: "ignoreErrors" });
    await gotoStable(page, experienceUrl);
    await expect(page.getByTestId("experience-governance-mode")).toHaveAttribute(
      "data-screen-state",
      "ready",
      { timeout: 60_000 },
    );
    await expect(page.getByTestId("panel-refresh-notice")).toHaveCount(0);

    // Soft-refresh primary failure with snapshot → stale (not silent ready)
    await page.route("**/experience-state**", async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          error: "experience_unavailable",
          message: "No fue posible cargar esta sección.",
          requestId: "ocp_r3_soft_fail_stale",
          retryable: true,
        }),
      });
    });
    await page.getByTestId("panel-soft-refresh").evaluate((el: HTMLElement) => {
      el.click();
    });
    await expect(page.getByTestId("experience-governance-mode")).toHaveAttribute(
      "data-screen-state",
      "stale",
      { timeout: 60_000 },
    );
    await expect(page.getByTestId("panel-stale-notice")).toBeVisible();
    await expect(page.getByTestId("experience-company-state")).toBeVisible();
    await page.unrouteAll({ behavior: "ignoreErrors" });
    await page.getByTestId("panel-stale-retry").click();
    await expect(page.getByTestId("experience-governance-mode")).toHaveAttribute(
      "data-screen-state",
      "ready",
      { timeout: 60_000 },
    );

    // --- 03 partial: all primary sources strictly ready, then only experience 503 ---
    await page.unrouteAll({ behavior: "ignoreErrors" });
    await gotoStable(page, monitoringUrl);

    // Contexto Empresa–Relación–Caso ready (no loading banners).
    await expect(page.getByText(/Cargando empresas/i)).toHaveCount(0, {
      timeout: 60_000,
    });
    await expect(page.getByText(/Cargando casos/i)).toHaveCount(0);
    await expect(page.getByText(/Cargando contexto/i)).toHaveCount(0);
    await expect(page.getByTestId("client-matrix-layout")).toBeVisible({
      timeout: 60_000,
    });

    // Manual work + parallel must be evaluated (attentionComplete requires them).
    // Strict ready — never accept ready|partial as precondition.
    await expect(page.getByTestId("support-process-axis")).toHaveAttribute(
      "data-screen-state",
      "ready",
      { timeout: 60_000 },
    );
    await expect(page.getByTestId("core-milestone-rail")).toHaveAttribute(
      "data-screen-state",
      "ready",
      { timeout: 60_000 },
    );
    await expect(page.getByTestId("recursive-monitoring-users")).toHaveAttribute(
      "data-screen-state",
      "ready",
      { timeout: 60_000 },
    );
    await expect(page.getByTestId("parallel-production-panel")).toHaveAttribute(
      "data-screen-state",
      "ready",
      { timeout: 60_000 },
    );
    await expect(page.getByTestId("panel-section-loading")).toHaveCount(0);
    await expect(page.getByTestId("panel-fatal-state")).toHaveCount(0);
    // Experience + manual + parallel evaluated → attention complete before failure.
    await expect(page.getByTestId("kpi-experience-alerts")).not.toHaveText("—", {
      timeout: 60_000,
    });
    await expect(page.getByTestId("attention-governance-panel")).toHaveAttribute(
      "data-attention-complete",
      "true",
      { timeout: 60_000 },
    );

    // Provoke transport failure only on experience. 503 controlled — no domain payload.
    await page.route("**/experience-state**", async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "service_unavailable" }),
      });
    });
    await page.reload({ waitUntil: "domcontentloaded" });

    // Primary axes remain ready; only experience secondary degrades.
    await expect(page.getByTestId("support-process-axis")).toHaveAttribute(
      "data-screen-state",
      "ready",
      { timeout: 60_000 },
    );
    await expect(page.getByTestId("core-milestone-rail")).toHaveAttribute(
      "data-screen-state",
      "ready",
      { timeout: 60_000 },
    );
    await expect(page.getByTestId("parallel-production-panel")).toHaveAttribute(
      "data-screen-state",
      "ready",
      { timeout: 60_000 },
    );
    await expect(page.getByText(/Cargando casos/i)).toHaveCount(0);
    await expect(page.getByText(/Cargando contexto/i)).toHaveCount(0);
    await expect(page.getByText(/Procesos de soporte.*degradad/i)).toHaveCount(0);
    await expect(page.getByText(/No fue posible cargar esta sección/i)).toHaveCount(
      0,
    );
    await expect(page.getByTestId("panel-section-loading")).toHaveCount(0);
    await expect(page.getByTestId("panel-fatal-state")).toHaveCount(0);

    await expect(page.getByTestId("kpi-current-status")).toBeVisible();
    await expect(page.getByTestId("kpi-current-status")).toHaveText(
      /No disponible/i,
    );
    await expect(page.getByTestId("kpi-next-step")).toBeVisible();
    await expect(page.getByTestId("kpi-next-step")).not.toHaveText("—", {
      timeout: 30_000,
    });
    await expect(page.getByTestId("kpi-experience-alerts")).toHaveText("—", {
      timeout: 60_000,
    });
    await expect(page.getByTestId("attention-governance-panel")).toHaveAttribute(
      "data-attention-complete",
      "false",
    );

    await page.getByTestId("attention-open-drawer").click();
    await expect(page.getByTestId("attention-partial-notice")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("attention-company-alerts")).toContainText(
      /No disponible|—/i,
      { timeout: 30_000 },
    );
    await expect(page.getByText("Sin alertas")).toHaveCount(0);
    await expect(
      page.getByTestId("attention-company-alerts").getByTestId("panel-partial-notice"),
    ).toBeVisible({ timeout: 30_000 });

    // Capture guards: only secondary degradation visible.
    await expect(page.getByText(/Cargando casos/i)).toHaveCount(0);
    await expect(page.getByText(/Cargando contexto/i)).toHaveCount(0);
    await expect(page.getByText(/Procesos de soporte.*degradad/i)).toHaveCount(0);
    await expect(page.getByText(/No fue posible cargar esta sección/i)).toHaveCount(
      0,
    );
    await assertNoDevChrome(page);
    await shot(page, "03-partial.png");
    await page.unrouteAll({ behavior: "ignoreErrors" });

    // --- 04 stale factual: 409 STALE_MANUAL_WORK_ITEM ---
    await gotoStable(page, manifest.trackingUrl);
    await expect(page.getByTestId("manual-work-panel")).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByTestId("manual-work-panel")).toHaveAttribute(
      "data-screen-state",
      "ready",
      { timeout: 60_000 },
    );
    const workId = manifest.workItems["P-SUP-03"].id;
    const inputArt = manifest.workItems["P-SUP-03"].inputPackageArtifactId;
    const item = page.getByTestId(`manual-work-item-${workId}`);
    await expect(item).toBeVisible({ timeout: 60_000 });
    await expect(item).toHaveAttribute("data-tracking-status", "ready_to_start", {
      timeout: 60_000,
    });
    const downloadBtn = item.getByTestId("manual-action-download_package");
    await expect(downloadBtn).toBeEnabled({ timeout: 30_000 });
    await expect(downloadBtn).toHaveAttribute("data-allowed", "true");

    // Hold soft GETs so the UI keeps the v1 snapshot while a peer advances.
    let holdManualRefresh = true;
    await page.route("**/manual-work**", async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }
      const started = Date.now();
      while (holdManualRefresh && Date.now() - started < 45_000) {
        await new Promise((r) => setTimeout(r, 50));
      }
      try {
        await route.continue();
      } catch {
        /* unrouted */
      }
    });

    // Advance version via parallel authorized session (UI snapshot stays at v1)
    const ctxPeer = await browser.newContext();
    const tokenPeer = await bearerFor(
      ctxPeer,
      ctxPeer.request,
      manifest.consultants.a.email,
    );
    const dl = await ctxPeer.request.post(
      `/api/eve/official-consultant-control-panel/cases/${manifest.caseId}/manual-artifacts/${inputArt}/download`,
      {
        headers: {
          Authorization: `Bearer ${tokenPeer}`,
          "Content-Type": "application/json",
        },
        data: {
          workItemId: workId,
          expectedStatus: "ready_to_start",
          expectedVersion: 1,
          idempotencyKey: randomUUID(),
        },
      },
    );
    expect(dl.ok(), await dl.text()).toBeTruthy();
    await ctxPeer.close();

    // Click with conserved snapshot → real 409 → stale (not a silent ready refresh)
    await expect(downloadBtn).toBeEnabled();
    await downloadBtn.click();
    await expect(page.getByTestId("manual-work-panel")).toHaveAttribute(
      "data-screen-state",
      "stale",
      { timeout: 60_000 },
    );
    await expect(page.getByTestId("panel-stale-notice")).toBeVisible();
    await expect(downloadBtn).toBeDisabled({ timeout: 30_000 });
    await shot(page, "04-stale-mutaciones-bloqueadas.png");
    holdManualRefresh = false;
    await page.unrouteAll({ behavior: "ignoreErrors" });

    // --- 05 forbidden: Consultor B real → caso A; denegación final ---
    await context.clearCookies();
    const authB = await authenticateLocalConsultant(context, request, {
      email: manifest.consultants.b.email,
    });
    const denied = await request.get(
      `/api/eve/official-consultant-control-panel/cases/${manifest.caseId}/experience-state`,
      { headers: { Authorization: `Bearer ${authB.accessToken}` } },
    );
    expect([403, 404]).toContain(denied.status());
    await gotoStable(
      page,
      `/admin/official-consultant-control-panel?mode=user-experience-governance&view=journeys&company=${manifest.companyFx08Id}&relationship=a2080008-0000-4000-8000-000000000002&case=${manifest.caseId}`,
    );
    await expect(page.getByText("Cargando contexto autorizado…")).toHaveCount(
      0,
      { timeout: 60_000 },
    );
    await expect(page.getByTestId("panel-section-loading")).toHaveCount(0);
    // Final denial: forbidden surface (or access-denied). Never loading.
    const deniedUrl = page.url();
    if (/access-denied/.test(deniedUrl)) {
      await expect(page).toHaveURL(/access-denied/);
    } else {
      await expect(page.getByTestId("panel-forbidden-state")).toBeVisible({
        timeout: 60_000,
      });
      await expect(page.getByText("Acceso no disponible")).toBeVisible();
    }
    await expect(page.getByText(manifest.caseId)).toHaveCount(0);
    await expect(page.getByText(manifest.companyFx08Id)).toHaveCount(0);
    await expect(page.getByText(/Empresa FX-08/i)).toHaveCount(0);
    await expect(page.getByText(/a2080008/i)).toHaveCount(0);
    await expect(page.getByText("Cargando contexto autorizado…")).toHaveCount(0);
    await shot(page, "05-forbidden-sin-filtracion.png");

    // --- 06 not_found: recurso hijo inexistente dentro de caso A autorizado ---
    await context.clearCookies();
    const authA = await authenticateLocalConsultant(context, request, {
      email: manifest.consultants.a.email,
    });
    const missingUserId = "00000000-0000-4000-8000-0000000000f1";
    // Scope base authorized first (case A without child filter).
    const scopedOk = await request.get(
      `/api/eve/official-consultant-control-panel/cases/${manifest.caseId}/experience-state`,
      { headers: { Authorization: `Bearer ${authA.accessToken}` } },
    );
    expect(scopedOk.status()).toBe(200);
    const notFoundApi = await request.get(
      `/api/eve/official-consultant-control-panel/cases/${manifest.caseId}/experience-state?userId=${missingUserId}`,
      { headers: { Authorization: `Bearer ${authA.accessToken}` } },
    );
    expect(notFoundApi.status()).toBe(404);
    const notFoundBody = await notFoundApi.json();
    expect(String(notFoundBody.error ?? "")).toMatch(/not_found/i);

    await gotoStable(
      page,
      `${experienceUrl}&userId=${missingUserId}`,
    );
    await expect(page.getByText("Cargando contexto autorizado…")).toHaveCount(
      0,
      { timeout: 60_000 },
    );
    await expect(page.getByTestId("experience-governance-mode")).toHaveAttribute(
      "data-screen-state",
      "not_found",
      { timeout: 60_000 },
    );
    await expect(page.getByTestId("panel-not-found-state")).toBeVisible();
    await expect(page.getByTestId("panel-not-found-state")).toContainText(
      /No se encontró información para la selección actual|Sin información/i,
    );
    await expect(page.getByTestId("panel-fatal-state")).toHaveCount(0);
    await expect(page.getByText(/Empresa FX-08 R2 Case B/i)).toHaveCount(0);
    await shot(page, "06-not-found.png");

    // --- 07 fatal + request reference (transport 503 once) ---
    await page.unrouteAll({ behavior: "ignoreErrors" });
    let failOnce = true;
    await page.route("**/experience-state**", async (route) => {
      if (failOnce) {
        failOnce = false;
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({
            error: "experience_unavailable",
            message: "No fue posible cargar esta sección.",
            requestId: "ocp_r3_fatal_ref_001",
            retryable: true,
          }),
        });
        return;
      }
      try {
        const response = await route.fetch();
        await route.fulfill({ response });
      } catch {
        try {
          await route.continue();
        } catch {
          /* ignore */
        }
      }
    });
    await gotoStable(page, experienceUrl);
    await expect(page.getByTestId("panel-fatal-state")).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByTestId("panel-fatal-request-ref")).toContainText(
      "ocp_r3_fatal_ref_001",
      { timeout: 15_000 },
    );
    await shot(page, "07-fatal-request-reference.png");

    // --- 08 retry recovery → ready with factual content ---
    await page.getByTestId("panel-fatal-retry").click();
    await expect(page.getByTestId("panel-fatal-state")).toHaveCount(0, {
      timeout: 60_000,
    });
    await expect(page.getByTestId("experience-governance-mode")).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByTestId("experience-governance-mode")).toHaveAttribute(
      "data-screen-state",
      "ready",
      { timeout: 60_000 },
    );
    await expect(page.getByTestId("panel-section-loading")).toHaveCount(0);
    await expect(page.getByTestId("experience-company-state")).toBeVisible({
      timeout: 60_000,
    });
    await assertNoDevChrome(page);
    await shot(page, "08-retry-recuperado.png");
    await page.unrouteAll({ behavior: "ignoreErrors" });

    const hash01 = sha256File("01-loading.png");
    const hash08 = sha256File("08-retry-recuperado.png");
    expect(hash01).not.toEqual(hash08);
    writeFileSync(
      resolve(RESULTS, "screenshot-hashes.json"),
      JSON.stringify(
        { "01-loading": hash01, "08-retry-recuperado": hash08 },
        null,
        2,
      ),
    );

    // --- 09 Amber factual empties (unit2b) ---
    await context.clearCookies();
    await authenticateLocalConsultant(context, request);
    await gotoStable(
      page,
      `/admin/official-consultant-control-panel?mode=user-experience-governance&view=journeys&company=${AMBER_COMPANY}&relationship=${AMBER_REL}&case=${AMBER_CASE}`,
    );
    await expect(page.getByTestId("experience-governance-mode")).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByTestId("experience-journey-empty")).toBeVisible({
      timeout: 60_000,
    });
    await shot(page, "09-vacio-valido-amber.png");

    // --- 10 mobile ---
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoStable(
      page,
      `/admin/official-consultant-control-panel?mode=user-experience-governance&view=journeys&company=${AMBER_COMPANY}&relationship=${AMBER_REL}&case=${AMBER_CASE}`,
    );
    await expect(page.getByTestId("experience-governance-mode")).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByTestId("experience-governance-mode")).toHaveAttribute(
      "data-screen-state",
      /^(ready|partial|stale)$/,
      { timeout: 60_000 },
    );
    await expect(page.getByTestId("panel-section-loading")).toHaveCount(0);
    await expect(page.getByText(/Cargando contexto/i)).toHaveCount(0);
    await expect(page.getByTestId("mode-experience-governance")).toBeVisible();
    await expect(page.getByTestId("attention-open-drawer")).toBeVisible();
    await assertNoGlobalOverflow(page);
    await assertNoDevChrome(page);
    await shot(page, "10-mobile-degradacion.png");

    // --- 11 rail horizontal restaurado (desktop, parity Hitos Core) ---
    await page.setViewportSize({ width: 1440, height: 1000 });
    await gotoStable(
      page,
      `/admin/official-consultant-control-panel?mode=user-experience-governance&view=journeys&company=${AMBER_COMPANY}&relationship=${AMBER_REL}&case=${AMBER_CASE}`,
    );
    await expect(page.getByTestId("attention-collapsed-rail")).toBeVisible({
      timeout: 60_000,
    });
    const railWritingMode = await page
      .getByTestId("attention-collapsed-label")
      .evaluate((node) => getComputedStyle(node).writingMode);
    expect(railWritingMode).toBe("horizontal-tb");
    await expect(
      page.getByText(
        "Las alertas y la gobernanza se habilitarán en las siguientes unidades.",
      ),
    ).toHaveCount(0);
    await assertNoDevChrome(page);
    await shot(page, "11-rail-horizontal-restaurado.png");

    // --- 12 atención vacía factual (Amber drawer) ---
    await page.getByTestId("attention-open-drawer").click();
    await expect(page.getByTestId("attention-governance-panel")).toHaveAttribute(
      "data-drawer-state",
      "expanded",
    );
    await expect(page.getByTestId("attention-empty-factual")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("attention-governance-panel")).toHaveAttribute(
      "data-attention-complete",
      "true",
    );
    await expect(page.getByTestId("attention-empty-factual")).toHaveText(
      "Sin alertas activas para el caso.",
    );
    await expect(
      page.getByText(
        "Las alertas y la gobernanza se habilitarán en las siguientes unidades.",
      ),
    ).toHaveCount(0);
    await assertNoDevChrome(page);
    await shot(page, "12-atencion-vacia-factual.png");
    await page.getByRole("button", { name: "Cerrar panel contextual" }).click();
    await expect(page.getByTestId("attention-collapsed-rail")).toBeVisible();
    const railAfterClose = await page
      .getByTestId("attention-collapsed-label")
      .evaluate((node) => getComputedStyle(node).writingMode);
    expect(railAfterClose).toBe("horizontal-tb");

    // --- 13 acción soporte con capability auditada (fixture §§15–17) ---
    const seed1517 = spawnSync(
      "node",
      ["scripts/eve/official-control-panel/seed-point15-17-experience-test.mjs"],
      { encoding: "utf8", shell: true, env: { ...process.env } },
    );
    if (seed1517.status !== 0) {
      throw new Error(`seed_15_17_failed:${seed1517.stderr || seed1517.stdout}`);
    }
    const manifest1517 = JSON.parse(
      readFileSync(resolve("reports/local/rector-points-15-17/manifest.json"), "utf8"),
    ) as {
      caseNormalId: string;
      companyId: string;
      relationshipId: string;
      consultants: { a: { email: string } };
      experienceSupportUrl: string;
    };
    await context.clearCookies();
    const auth1517A = await authenticateLocalConsultant(context, request, {
      email: manifest1517.consultants.a.email,
    });
    const stateRes = await request.get(
      `/api/eve/official-consultant-control-panel/cases/${manifest1517.caseNormalId}/experience-state`,
      { headers: { Authorization: `Bearer ${auth1517A.accessToken}` } },
    );
    expect(stateRes.ok()).toBeTruthy();
    const stateJson = await stateRes.json();
    const caps = stateJson.capabilities ?? stateJson.data?.capabilities ?? [];
    const sendCap = Array.isArray(caps)
      ? caps.find((c: { key?: string }) => c?.key === "send_support_message")
      : null;
    expect(sendCap?.allowed).toBe(true);

    await gotoStable(page, manifest1517.experienceSupportUrl);
    await expect(page.getByTestId("experience-governance-mode")).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByTestId("support-queue")).toBeVisible({
      timeout: 60_000,
    });
    const actionBtn = page
      .getByTestId("support-queue")
      .locator("li")
      .filter({ hasText: /Soporte solicitado|WorkMap/i })
      .getByRole("button", { name: "Acción gobernada" })
      .first();
    await expect(actionBtn).toBeVisible();
    await actionBtn.click();
    await expect(page.getByTestId("support-action-drawer")).toBeVisible({
      timeout: 30_000,
    });
    await page.getByTestId("support-action-type").selectOption("send_message");
    await page.getByTestId("support-action-reason").fill("help_orientation");
    await page
      .getByTestId("support-action-effect")
      .fill("Orientación sin cambio de evidencia");
    const postPromise = page.waitForResponse(
      (res) =>
        res.url().includes("/experience-actions") &&
        res.request().method() === "POST",
      { timeout: 45_000 },
    );
    await page.getByTestId("support-action-submit").click();
    const postRes = await postPromise;
    expect(postRes.status()).toBeGreaterThanOrEqual(200);
    expect(postRes.status()).toBeLessThan(300);
    const postBody = await postRes.json();
    expect(postBody.ok).toBe(true);
    expect(postBody.actionId || postBody.action?.id).toBeTruthy();
    await expect(page.getByTestId("support-action-drawer")).toHaveCount(0, {
      timeout: 45_000,
    });
    await expect(
      page.getByText("No fue posible registrar la acción de soporte."),
    ).toHaveCount(0);
    await expect(page.getByTestId("attention-collapsed-rail")).toBeVisible();
    const railAfterAction = await page
      .getByTestId("attention-collapsed-label")
      .evaluate((node) => getComputedStyle(node).writingMode);
    expect(railAfterAction).toBe("horizontal-tb");
    await assertNoDevChrome(page);
    await shot(page, "13-accion-soporte-capability-auditada.png");

    expect(existsSync(resolve(SHOT_DIR, "02-refreshing.png"))).toBeTruthy();
    expect(existsSync(resolve(SHOT_DIR, "03-partial.png"))).toBeTruthy();
    for (const name of [
      "02-refreshing.png",
      "03-partial.png",
      "08-retry-recuperado.png",
      "10-mobile-degradacion.png",
      "11-rail-horizontal-restaurado.png",
      "12-atencion-vacia-factual.png",
      "13-accion-soporte-capability-auditada.png",
    ]) {
      const buf = readFileSync(resolve(SHOT_DIR, name));
      expect(buf.byteLength, name).toBeGreaterThan(0);
    }
    const hashes = {
      "02-refreshing": sha256File("02-refreshing.png"),
      "03-partial": sha256File("03-partial.png"),
      "08-retry-recuperado": sha256File("08-retry-recuperado.png"),
      "10-mobile-degradacion": sha256File("10-mobile-degradacion.png"),
      "11-rail-vertical": sha256File("11-rail-vertical-restaurado.png"),
      "12-atencion-vacia": sha256File("12-atencion-vacia-factual.png"),
      "13-accion-auditada": sha256File("13-accion-soporte-capability-auditada.png"),
    };
    expect(hashes["02-refreshing"]).not.toEqual(hashes["03-partial"]);
    expect(hashes["03-partial"]).not.toEqual(hashes["08-retry-recuperado"]);
    expect(hashes["08-retry-recuperado"]).not.toEqual(
      hashes["10-mobile-degradacion"],
    );
    expect(hashes["11-rail-vertical"]).not.toEqual(hashes["12-atencion-vacia"]);
    expect(hashes["12-atencion-vacia"]).not.toEqual(hashes["13-accion-auditada"]);
    writeFileSync(
      resolve(RESULTS, "screenshot-hashes-r3-final.json"),
      JSON.stringify(hashes, null, 2),
    );
  });
});
