import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

import {
  authenticateLocalConsultant,
  expectCompaniesHydrated,
  openOfficialPanelWithSession,
} from "./helpers/authenticate-local-consultant";

const MANIFEST_PATH = resolve(
  "reports/local/rector-point-12-operational-validation/manifest.json",
);
const SHOT_DIR = resolve(
  "reports/local/rector-point-12-operational-validation/screenshots",
);

type Manifest = {
  companyId: string;
  relationshipId: string;
  caseId: string;
  participantId: string;
  profileId: string;
  sessionId: string;
  consultantA: { email: string };
  consultantB: { email: string };
  runs: {
    ready: { runId: string; activityId: string };
    ready_with_restrictions: { runId: string; activityId: string };
    blocked: { runId: string; activityId: string };
    not_evaluable: { runId: string; activityId: string };
  };
};

function loadManifest(): Manifest {
  if (!existsSync(MANIFEST_PATH)) {
    throw new Error(
      "opval_manifest_missing: run prepare-point12-runtime-operational-validation.mjs first",
    );
  }
  return JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as Manifest;
}

function runPath(m: Manifest, activityId: string, runId: string): string {
  return (
    "/admin/official-consultant-control-panel?mode=client-company&view=monitoring" +
    `&company=${m.companyId}` +
    `&relationship=${m.relationshipId}` +
    `&case=${m.caseId}` +
    `&participant=${m.participantId}` +
    `&profile=${m.profileId}` +
    `&role_runtime_session_id=${m.sessionId}` +
    `&activity_id=${activityId}` +
    `&run=${runId}`
  );
}

async function shot(page: Page, name: string) {
  mkdirSync(SHOT_DIR, { recursive: true });
  await page.screenshot({ path: resolve(SHOT_DIR, name), fullPage: true });
}

async function openAttention(page: Page) {
  const panel = page.getByTestId("attention-governance-panel");
  await expect(panel).toBeVisible({ timeout: 30000 });
  if ((await panel.getAttribute("data-drawer-state")) !== "expanded") {
    await page.getByRole("button", { name: "Abrir panel contextual" }).click();
  }
  await expect(panel).toHaveAttribute("data-drawer-state", "expanded");
  await expect(page.getByTestId("attention-runtime-control")).toBeVisible({
    timeout: 15000,
  });
}

async function expectAdvance(page: Page, state: string, label: string) {
  const footer = page.getByTestId("runtime-advance-footer");
  await expect(footer).toBeVisible({ timeout: 45000 });
  await expect(footer).toHaveAttribute("data-advance", state, {
    timeout: 60000,
  });
  await expect(footer.getByText(label, { exact: true })).toBeVisible();
}

async function openRun(
  page: Page,
  m: Manifest,
  activityId: string,
  runId: string,
) {
  const controlStateWait = page.waitForResponse(
    (response) =>
      response.url().includes(`/runs/${runId}/runtime/control-state`) &&
      response.request().method() === "GET",
    { timeout: 90000 },
  );

  await openOfficialPanelWithSession(page, runPath(m, activityId, runId));
  await expectCompaniesHydrated(page);

  await expect(page.getByText("Participante OpVal").first()).toBeVisible({
    timeout: 45000,
  });
  await expect(page.getByText("Perfil funcional OpVal").first()).toBeVisible({
    timeout: 45000,
  });
  await expect(page.getByTestId("activity-runtime-panel")).toHaveAttribute(
    "data-has-run",
    "true",
    { timeout: 60000 },
  );
  await expect(page.getByTestId("runtime-activity-matrix-panel")).toBeVisible({
    timeout: 45000,
  });

  const controlResponse = await controlStateWait;
  expect(controlResponse.ok()).toBeTruthy();
}

async function bffControlState(
  request: APIRequestContext,
  token: string,
  m: Manifest,
  activityId: string,
  runId: string,
) {
  return request.get(
    `/api/eve/official-consultant-control-panel/cases/${m.caseId}` +
      `/participants/${m.participantId}/profiles/${m.profileId}` +
      `/sessions/${m.sessionId}/activities/${activityId}/runs/${runId}/runtime/control-state`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
}

test.describe("§12 Point 12 — validación operacional E2E", () => {
  test.describe.configure({ timeout: 300000 });

  test("Consultor A: cuatro escenarios + matrices + Atención + viewport", async ({
    page,
    context,
    request,
  }) => {
    const m = loadManifest();
    const auth = await authenticateLocalConsultant(context, request, {
      email: m.consultantA.email,
    });
    await page.setViewportSize({ width: 1440, height: 1400 });

    // Escenario A — ready
    await openRun(page, m, m.runs.ready.activityId, m.runs.ready.runId);
    await expectAdvance(page, "ready", "Puede avanzar");
    await page.getByTestId("runtime-matrix-tab-base").click();
    await expect(page.getByTestId("base-resolution-matrix")).toBeVisible();
    await page.getByTestId("runtime-matrix-tab-causal").click();
    await expect(page.getByTestId("causal-closure-matrix")).toBeVisible();
    await expect(
      page.getByTestId("causal-closure-matrix").getByText("Filas visibles: 20"),
    ).toBeVisible();
    await expect(
      page
        .getByTestId("causal-closure-matrix")
        .getByText("No activada con evidencia")
        .first(),
    ).toBeVisible();
    await shot(page, "01-ready.png");
    await shot(page, "09-matriz-causal-cierre-real.png");

    // Refresh + history between real OpVal runs.
    await page.reload({ waitUntil: "domcontentloaded" });
    await expectCompaniesHydrated(page);
    await expect(page.getByTestId("activity-runtime-panel")).toHaveAttribute(
      "data-has-run",
      "true",
      { timeout: 60000 },
    );
    await expectAdvance(page, "ready", "Puede avanzar");

    await openRun(
      page,
      m,
      m.runs.blocked.activityId,
      m.runs.blocked.runId,
    );
    await expectAdvance(page, "blocked", "Bloqueado");
    await page.goBack({ waitUntil: "domcontentloaded" });
    // bfcache/SPA restore can leave context mid-load; force a clean rehydrate.
    await page.reload({ waitUntil: "domcontentloaded" });
    await expectCompaniesHydrated(page);
    await expect(page.getByTestId("activity-runtime-panel")).toHaveAttribute(
      "data-has-run",
      "true",
      { timeout: 60000 },
    );
    await expectAdvance(page, "ready", "Puede avanzar");
    await page.goForward({ waitUntil: "domcontentloaded" });
    await page.reload({ waitUntil: "domcontentloaded" });
    await expectCompaniesHydrated(page);
    await expectAdvance(page, "blocked", "Bloqueado");

    // Escenario B — ready_with_restrictions + P3 signals
    await openRun(
      page,
      m,
      m.runs.ready_with_restrictions.activityId,
      m.runs.ready_with_restrictions.runId,
    );
    await expectAdvance(
      page,
      "ready-with-restrictions",
      "Puede avanzar con restricciones",
    );
    await shot(page, "02-ready-con-restricciones.png");
    await openAttention(page);
    await expect(page.getByTestId("attention-active-gaps")).toBeVisible();
    await expect(
      page.getByTestId("attention-active-gaps").getByText(/P1|C02|residual/i),
    ).toBeVisible();
    await shot(page, "05-gap-activo.png");
    await expect(page.getByTestId("attention-timers")).toBeVisible();
    await expect(
      page.getByTestId("attention-timers").getByText(/overdue/i),
    ).toBeVisible();
    await shot(page, "06-timer-vencido.png");
    await expect(page.getByTestId("attention-reentries")).toBeVisible();
    await expect(
      page.getByTestId("attention-reentries").locator("li").first(),
    ).toBeVisible();
    await shot(page, "07-reentry.png");
    await expect(page.getByTestId("attention-manual-reviews")).toBeVisible();
    await expect(
      page.getByTestId("attention-manual-reviews").locator("li").first(),
    ).toBeVisible();
    await shot(page, "08-revision-manual.png");

    // Escenario C — blocked P0 (already visited during history check; re-open for shot)
    await openRun(page, m, m.runs.blocked.activityId, m.runs.blocked.runId);
    await expectAdvance(page, "blocked", "Bloqueado");
    await shot(page, "03-bloqueado-p0.png");

    // Escenario D — not_evaluable
    await openRun(
      page,
      m,
      m.runs.not_evaluable.activityId,
      m.runs.not_evaluable.runId,
    );
    await expectAdvance(page, "not-evaluable", "No evaluable");
    await shot(page, "04-no-evaluable.png");

    // BFF A can read control-state
    const okRes = await bffControlState(
      request,
      auth.accessToken,
      m,
      m.runs.ready.activityId,
      m.runs.ready.runId,
    );
    expect(okRes.ok()).toBeTruthy();
    const okBody = (await okRes.json()) as {
      readiness?: { state?: string };
    };
    expect(okBody.readiness?.state).toBe("ready");

    await page.setViewportSize({ width: 1440, height: 1400 });
    await openRun(page, m, m.runs.ready.activityId, m.runs.ready.runId);
    await shot(page, "11-desktop.png");
    await page.setViewportSize({ width: 900, height: 1200 });
    await shot(page, "12-tablet.png");
    await page.setViewportSize({ width: 390, height: 844 });
    await shot(page, "13-mobile.png");
  });

  test("Consultor B: aislamiento BFF y panel sin fuga", async ({
    page,
    context,
    request,
  }) => {
    const m = loadManifest();
    const auth = await authenticateLocalConsultant(context, request, {
      email: m.consultantB.email,
    });
    await page.setViewportSize({ width: 1440, height: 1200 });

    const denied = await bffControlState(
      request,
      auth.accessToken,
      m,
      m.runs.ready.activityId,
      m.runs.ready.runId,
    );
    expect(denied.status()).toBeGreaterThanOrEqual(400);
    const deniedBody = (await denied.json()) as {
      error?: string;
      message?: string;
      readiness?: unknown;
    };
    expect(deniedBody.readiness).toBeUndefined();
    expect(JSON.stringify(deniedBody)).not.toContain(m.runs.ready.runId);
    expect(String(deniedBody.message ?? "")).not.toMatch(/a1200012/i);

    await page.goto(runPath(m, m.runs.ready.activityId, m.runs.ready.runId), {
      waitUntil: "domcontentloaded",
    });
    // Company select should not expose OpVal for unauthorized consultant.
    const company = page.locator("#client-company");
    await expect(company).toBeVisible({ timeout: 45000 });
    await expect(company).toBeEnabled({ timeout: 45000 });
    const companyText = await company.inputValue().catch(() => "");
    expect(companyText).not.toContain("Point12 OpVal");
    await expect(page.getByText("Empresa Point12 OpVal")).toHaveCount(0);
    await shot(page, "10-consultor-b-denegado.png");
  });

  test("Amber permanece No evaluable (sin inventar datos)", async ({
    page,
    context,
    request,
  }) => {
    await authenticateLocalConsultant(context, request);
    await page.setViewportSize({ width: 1440, height: 1200 });
    const amber =
      "/admin/official-consultant-control-panel?mode=client-company&view=monitoring" +
      "&company=5c08029f-15e9-4bbd-b13e-0ff4765e23b8" +
      "&relationship=7c499a1c-31c6-4fc9-8b20-2fd8cdc57043" +
      "&case=19fc9eff-4219-43f0-854c-e2b3350f23f2";
    await openOfficialPanelWithSession(page, amber);
    await expectCompaniesHydrated(page);
    await expect(page.getByTestId("runtime-advance-footer")).toHaveAttribute(
      "data-advance",
      "not-evaluable",
      { timeout: 45000 },
    );
    await expect(page.getByText("Puede avanzar", { exact: true })).toHaveCount(
      0,
    );
  });
});
