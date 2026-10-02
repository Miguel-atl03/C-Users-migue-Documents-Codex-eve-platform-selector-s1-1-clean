import { test, expect, type Page } from "@playwright/test";
import { resolve } from "node:path";
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { authenticateLocalConsultant } from "./helpers/authenticate-local-consultant";

const SHOT_DIR = resolve("reports/local/rector-points-15-17/screenshots");
const MANIFEST = resolve("reports/local/rector-points-15-17/manifest.json");
const AMBER_CASE = "19fc9eff-4219-43f0-854c-e2b3350f23f2";
const AMBER_COMPANY = "5c08029f-15e9-4bbd-b13e-0ff4765e23b8";
const AMBER_REL = "7c499a1c-31c6-4fc9-8b20-2fd8cdc57043";

type Manifest = {
  companyId: string;
  relationshipId: string;
  caseNormalId: string;
  caseBlockedId: string;
  participantUserId: string;
  consultants: { a: { email: string }; b: { email: string } };
  experienceJourneysUrl: string;
  experienceSupportUrl: string;
  experienceHealthUrl: string;
  experienceBlockedUrl: string;
  amberExperienceUrl: string;
};

function seedManifest(): Manifest {
  // Prefer process env (ephemeral password + local supabase); do not require .env.local.
  const r = spawnSync(
    "node",
    ["scripts/eve/official-control-panel/seed-point15-17-experience-test.mjs"],
    {
      encoding: "utf8",
      shell: true,
      env: { ...process.env },
    },
  );
  if (r.status !== 0) {
    throw new Error(`seed_failed:${r.stderr || r.stdout}`);
  }
  return JSON.parse(readFileSync(MANIFEST, "utf8")) as Manifest;
}

async function shot(page: Page, name: string) {
  await page.screenshot({
    path: resolve(SHOT_DIR, name),
    fullPage: true,
  });
}

async function waitExperienceReady(page: Page) {
  // Tolerate one HMR/compile glitch on cold routes.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await expect(page.getByTestId("experience-governance-mode")).toBeVisible({
        timeout: 45_000,
      });
      await expect(page.getByText(/Cargando estado de experiencia/i)).toHaveCount(
        0,
        { timeout: 45_000 },
      );
      await expect(
        page
          .getByTestId("experience-journey-empty")
          .or(page.getByTestId("user-journey-matrix"))
          .or(page.getByTestId("support-queue"))
          .or(page.getByTestId("experience-support-empty"))
          .or(page.getByTestId("screen-health-panel"))
          .or(page.getByTestId("experience-health-empty")),
      ).toBeVisible({ timeout: 45_000 });
      return;
    } catch (error) {
      if (attempt === 2) throw error;
      await page.reload({ waitUntil: "domcontentloaded" });
    }
  }
}

async function openSupportDrawer(page: Page) {
  const url = new URL(page.url());
  url.searchParams.set("mode", "user-experience-governance");
  url.searchParams.set("view", "support");
  await page.goto(`${url.pathname}?${url.searchParams.toString()}`);
  const root = page.getByTestId("experience-governance-mode");
  await expect(root).toBeVisible({ timeout: 60_000 });
  await expect(page).toHaveURL(/view=support/);
  await expect(root.getByTestId("experience-tab-support")).toHaveAttribute(
    "aria-selected",
    "true",
  );
  const retry = root.getByRole("button", { name: "Reintentar" });
  if (await retry.isVisible().catch(() => false)) {
    await retry.click();
  }
  await expect(root.getByTestId("support-queue")).toBeVisible({
    timeout: 60_000,
  });
  const actionBtn = root
    .getByTestId("support-queue")
    .locator("li")
    .filter({ hasText: /Soporte solicitado|WorkMap/i })
    .getByRole("button", { name: "Acción gobernada" })
    .first();
  await actionBtn.scrollIntoViewIfNeeded();
  await actionBtn.evaluate((el) => (el as HTMLButtonElement).click());
  await expect(page.getByTestId("support-action-drawer")).toBeVisible({
    timeout: 30_000,
  });
}

test.describe("Rector Points 15–17 — Experience governance E2E", () => {
  test.setTimeout(600_000);

  let manifest: Manifest;

  test.beforeAll(() => {
    mkdirSync(SHOT_DIR, { recursive: true });
    manifest = seedManifest();
  });

  test("19 capturas oficiales + aserciones factuales", async ({
    page,
    context,
    request,
    browser,
  }) => {
    // Amber: consultor con acceso real a Cervecería Amber (no inventar datos).
    await authenticateLocalConsultant(context, request);

    // --- 01 Amber vacío ---
    await page.goto(
      `/admin/official-consultant-control-panel?mode=user-experience-governance&view=journeys` +
        `&company=${AMBER_COMPANY}&relationship=${AMBER_REL}&case=${AMBER_CASE}`,
    );
    await waitExperienceReady(page);
    await expect(page).toHaveURL(/mode=user-experience-governance/);
    await expect(page.getByTestId("mode-experience-governance")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByTestId("experience-journey-empty")).toBeVisible();
    // Consulta completa + cero alertas factuales → "0" (no "—" de consulta incompleta).
    await expect(page.getByTestId("kpi-experience-alerts")).toHaveText("0");
    await expect(page.getByText("Próximamente")).toHaveCount(0);
    await shot(page, "01-amber-experiencia-vacia.png");
    await page.close();

    // OpVal: Consultor A
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    const authA = await authenticateLocalConsultant(ctxA, ctxA.request, {
      email: manifest.consultants.a.email,
    });

    // --- OpVal journeys ---
    await pageA.goto(manifest.experienceJourneysUrl);
    await waitExperienceReady(pageA);
    await expect(pageA.getByTestId("user-journey-matrix")).toBeVisible();
    await expect(
      pageA.getByTestId(
        `experience-user-row-${manifest.participantUserId}`,
      ),
    ).toBeVisible();
    await shot(pageA, "02-trayectoria-usuario.png");

    await expect(
      pageA.getByTestId(
        `experience-cell-${manifest.participantUserId}-workmap`,
      ),
    ).toHaveAttribute("data-status", /blocked|support_requested|active/);
    await shot(pageA, "03-matriz-usuario-pantalla.png");

    // --- Support tab (goto estable; no depender de click+race de URL) ---
    await pageA.goto(manifest.experienceSupportUrl);
    await waitExperienceReady(pageA);
    await expect(pageA).toHaveURL(/view=support/);
    await expect(
      pageA
        .getByTestId("experience-governance-mode")
        .getByTestId("experience-tab-support"),
    ).toHaveAttribute("aria-selected", "true");
    await expect(pageA.getByTestId("support-queue")).toBeVisible({
      timeout: 60_000,
    });
    await expect(pageA.getByTestId("support-queue")).toContainText("WorkMap");
    await shot(pageA, "04-soporte-solicitado.png");

    // --- Health / recurrent errors ---
    await pageA.goto(manifest.experienceHealthUrl);
    await waitExperienceReady(pageA);
    await expect(pageA).toHaveURL(/view=screen_health/);
    await expect(pageA.getByTestId("screen-health-panel")).toBeVisible({
      timeout: 60_000,
    });
    const workmapHealth = pageA.getByTestId("screen-health-workmap");
    await expect(workmapHealth).toBeVisible();
    await expect(workmapHealth.getByText("Errores")).toBeVisible();
    await shot(pageA, "05-error-recurrente.png");
    await shot(pageA, "06-salud-pantallas.png");

    // --- Actions 07–11: capability explícita requerida antes de habilitar ---
    const stateProbe = await ctxA.request.get(
      `/api/eve/official-consultant-control-panel/cases/${manifest.caseNormalId}/experience-state`,
      {
        headers: { Authorization: `Bearer ${authA.accessToken}` },
      },
    );
    expect(stateProbe.ok()).toBeTruthy();
    const stateBody = await stateProbe.json();
    const caps = stateBody.capabilities ?? stateBody.data?.capabilities ?? [];
    const sendCap = Array.isArray(caps)
      ? caps.find((c: { key?: string }) => c?.key === "send_support_message")
      : null;
    expect(sendCap, "canonical GET capabilities.send_support_message").toBeTruthy();
    expect(sendCap.allowed).toBe(true);

    await openSupportDrawer(pageA);
    await pageA.getByTestId("support-action-type").selectOption("send_message");
    await pageA.getByTestId("support-action-reason").fill("help_orientation");
    await pageA
      .getByTestId("support-action-effect")
      .fill("Orientación sin cambio de evidencia");
    await shot(pageA, "07-mensaje-ayuda.png");
    const postMsg = pageA.waitForResponse(
      (res) =>
        res.url().includes("/experience-actions") &&
        res.request().method() === "POST",
      { timeout: 45_000 },
    );
    await pageA.getByTestId("support-action-submit").click();
    const postMsgRes = await postMsg;
    expect(postMsgRes.status()).toBeGreaterThanOrEqual(200);
    expect(postMsgRes.status()).toBeLessThan(300);
    const postMsgBody = await postMsgRes.json();
    expect(postMsgBody.ok).toBe(true);
    expect(postMsgBody.actionId || postMsgBody.action?.id).toBeTruthy();
    await expect(pageA.getByTestId("support-action-drawer")).toHaveCount(0, {
      timeout: 45_000,
    });
    await expect(
      pageA.getByText("No fue posible registrar la acción de soporte."),
    ).toHaveCount(0);
    await expect(pageA.getByTestId("attention-collapsed-rail")).toBeVisible();
    const railMode = await pageA
      .getByTestId("attention-collapsed-label")
      .evaluate((node) => getComputedStyle(node).writingMode);
    expect(railMode).toBe("horizontal-tb");

    await openSupportDrawer(pageA);
    await pageA.getByTestId("support-action-type").selectOption("resume_link");
    await pageA.getByTestId("support-action-reason").fill("return_link");
    await pageA
      .getByTestId("support-action-effect")
      .fill("Retomar la misma pantalla");
    await shot(pageA, "08-enlace-retorno.png");
    await pageA.getByTestId("support-action-submit").click();
    await expect(pageA.getByTestId("support-action-drawer")).toHaveCount(0, {
      timeout: 45_000,
    });

    await openSupportDrawer(pageA);
    await pageA
      .getByTestId("support-action-type")
      .selectOption("request_reentry");
    await pageA.getByTestId("support-action-reason").fill("authorized_reentry");
    await pageA
      .getByTestId("support-action-effect")
      .fill("Reentry autorizado");
    await shot(pageA, "09-reentry-autorizado.png");
    await pageA.getByTestId("support-action-submit").click();
    await expect(pageA.getByTestId("support-action-drawer")).toHaveCount(0, {
      timeout: 45_000,
    });

    await openSupportDrawer(pageA);
    await pageA
      .getByTestId("support-action-type")
      .selectOption("mark_manual_review");
    await pageA.getByTestId("support-action-reason").fill("needs_review");
    await pageA
      .getByTestId("support-action-effect")
      .fill("Encolar revisión manual");
    await shot(pageA, "10-revision-manual.png");
    await pageA.getByTestId("support-action-submit").click();
    await expect(pageA.getByTestId("support-action-drawer")).toHaveCount(0, {
      timeout: 45_000,
    });

    await openSupportDrawer(pageA);
    const options = await pageA
      .getByTestId("support-action-type")
      .locator("option")
      .allTextContents();
    expect(options.join(" ")).not.toMatch(/reabrir|reset/i);
    await expect(pageA.getByTestId("support-action-prohibited")).toBeVisible();
    await shot(pageA, "11-accion-prohibida.png");

    const prohibited = await ctxA.request.post(
      `/api/eve/official-consultant-control-panel/cases/${manifest.caseNormalId}/experience-actions`,
      {
        headers: {
          Authorization: `Bearer ${authA.accessToken}`,
          "Content-Type": "application/json",
        },
        data: {
          companyId: manifest.companyId,
          userId: manifest.participantUserId,
          screenKey: "workmap",
          actionType: "fix",
          reasonCode: "nope",
          beforeState: "blocked",
          expectedEffect: "force",
          auditRef: "audit://e2e/prohibited",
        },
      },
    );
    expect(prohibited.status()).toBeGreaterThanOrEqual(400);

    // --- Attention drawer alerts ---
    await pageA.getByTestId("experience-governance-mode").getByTestId("experience-tab-journeys").click();
    await pageA.getByRole("button", { name: "Abrir panel contextual" }).click();
    await expect(pageA.getByTestId("attention-company-alerts")).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      pageA.getByTestId("attention-alert-experience_support_requested").first(),
    ).toBeVisible();
    await shot(pageA, "12-drawer-alertas.png");

    // --- Company state Bloqueado / Atención ---
    await pageA.goto(manifest.experienceBlockedUrl);
    await waitExperienceReady(pageA);
    await expect(pageA.getByTestId("experience-company-state")).toContainText(
      "Bloqueado",
    );
    await shot(pageA, "13-estado-empresa-bloqueado.png");

    await pageA.goto(manifest.experienceJourneysUrl);
    await waitExperienceReady(pageA);
    await expect(pageA.getByTestId("experience-company-state")).toContainText(
      "Atención",
    );
    await shot(pageA, "14-estado-empresa-atencion.png");

    await expect(pageA.getByTestId("kpi-experience-alerts")).not.toHaveText("—");
    await shot(pageA, "15-kpi-alertas-experiencia.png");

    // Refresh + back/forward (historial real entre journeys ↔ support)
    await pageA.goto(manifest.experienceJourneysUrl);
    await waitExperienceReady(pageA);
    await pageA.reload();
    await waitExperienceReady(pageA);
    await expect(pageA).toHaveURL(/mode=user-experience-governance/);
    await pageA.goto(manifest.experienceSupportUrl);
    await expect(pageA).toHaveURL(/view=support/);
    await expect(
      pageA
        .getByTestId("experience-governance-mode")
        .getByTestId("experience-tab-support"),
    ).toHaveAttribute("aria-selected", "true", { timeout: 30_000 });
    await pageA.goBack();
    await expect(pageA).toHaveURL(/view=journeys/);
    await waitExperienceReady(pageA);
    await pageA.goForward();
    await expect(pageA).toHaveURL(/view=support/);
    await expect(
      pageA
        .getByTestId("experience-governance-mode")
        .getByTestId("experience-tab-support"),
    ).toHaveAttribute("aria-selected", "true", { timeout: 30_000 });

    // --- Consultor B ---
    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    const authB = await authenticateLocalConsultant(ctxB, ctxB.request, {
      email: manifest.consultants.b.email,
    });
    const bff = await ctxB.request.get(
      `/api/eve/official-consultant-control-panel/cases/${manifest.caseNormalId}/experience-state`,
      { headers: { Authorization: `Bearer ${authB.accessToken}` } },
    );
    expect([401, 403]).toContain(bff.status());
    await pageB.goto(manifest.experienceJourneysUrl);
    await pageB.waitForTimeout(2000);
    await shot(pageB, "16-consultor-b-denegado.png");
    await ctxB.close();

    // --- Responsive (assert auth/context/BFF/data before capture; no bare timeout) ---
    async function assertResponsiveCaptureReady(target: Page) {
      await waitExperienceReady(target);
      await expect(target).toHaveURL(/mode=user-experience-governance/);
      await expect(
        target.getByTestId("mode-experience-governance"),
      ).toHaveAttribute("aria-selected", "true");
      await expect(
        target
          .getByTestId("experience-governance-mode")
          .getByTestId("experience-tab-journeys"),
      ).toHaveAttribute("aria-selected", "true");
      await expect(target.getByTestId("user-journey-matrix")).toBeVisible();
      await expect(
        target.getByTestId(
          `experience-user-row-${manifest.participantUserId}`,
        ),
      ).toBeVisible();
      await expect(target.getByText(/Cargando/i)).toHaveCount(0);
      await expect(target.locator("[aria-busy='true']")).toHaveCount(0);
      await expect(target.getByTestId("kpi-experience-alerts")).not.toHaveText(
        "—",
      );
    }

    await pageA.setViewportSize({ width: 1440, height: 1000 });
    await pageA.goto(manifest.experienceJourneysUrl);
    await assertResponsiveCaptureReady(pageA);
    await shot(pageA, "17-desktop.png");

    await pageA.setViewportSize({ width: 1024, height: 1366 });
    await pageA.goto(manifest.experienceJourneysUrl);
    await assertResponsiveCaptureReady(pageA);
    await expect(pageA.getByTestId("experience-tabs")).toBeVisible();
    await shot(pageA, "18-tablet.png");

    await pageA.setViewportSize({ width: 390, height: 844 });
    await pageA.goto(manifest.experienceJourneysUrl);
    await assertResponsiveCaptureReady(pageA);
    await expect(pageA.getByTestId("mode-experience-governance")).toBeVisible();
    await shot(pageA, "19-mobile.png");

    await ctxA.close();

    const required = [
      "01-amber-experiencia-vacia.png",
      "02-trayectoria-usuario.png",
      "03-matriz-usuario-pantalla.png",
      "04-soporte-solicitado.png",
      "05-error-recurrente.png",
      "06-salud-pantallas.png",
      "07-mensaje-ayuda.png",
      "08-enlace-retorno.png",
      "09-reentry-autorizado.png",
      "10-revision-manual.png",
      "11-accion-prohibida.png",
      "12-drawer-alertas.png",
      "13-estado-empresa-bloqueado.png",
      "14-estado-empresa-atencion.png",
      "15-kpi-alertas-experiencia.png",
      "16-consultor-b-denegado.png",
      "17-desktop.png",
      "18-tablet.png",
      "19-mobile.png",
    ];
    for (const file of required) {
      expect(
        existsSync(resolve(SHOT_DIR, file)),
        `missing_screenshot:${file}`,
      ).toBe(true);
    }
  });
});
