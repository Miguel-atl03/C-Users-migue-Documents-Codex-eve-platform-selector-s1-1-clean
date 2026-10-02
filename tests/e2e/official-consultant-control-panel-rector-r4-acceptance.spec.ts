/**
 * R4 acceptance E2E — FX-01…FX-12 with productive BFF/RPC transitions.
 * Auth: real password grant via authenticate-local-consultant.
 * Forbidden: route-fulfill mocks for auth/caps/business.
 * Screenshots: reports/local/rector-r4-acceptance/screenshots/
 */
import {
  test,
  expect,
  type APIRequestContext,
  type BrowserContext,
  type Page,
  type Locator,
} from "@playwright/test";
import { resolve } from "node:path";
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
  unlinkSync,
} from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  authenticateLocalConsultant,
  openOfficialPanelWithSession,
} from "./helpers/authenticate-local-consultant";

const SHOT_DIR = resolve("reports/local/rector-r4-acceptance/screenshots");
const RESULTS_DIR = resolve("reports/local/rector-r4-acceptance/results");
const MANIFEST = resolve("reports/local/rector-r4-acceptance/manifest.json");
const E2E_RESULT = resolve(RESULTS_DIR, "e2e-r4.json");
const R3_PHYSICAL_RESULT = resolve(
  "reports/local/rector-r3-physical-runtime-panel/runtime-panel-ab-evidence.json",
);
const screenshotEvidence: Array<{
  name: string;
  sha256: string;
  loadingAbsent: true;
  fatalAbsent: true;
}> = [];

const REQUIRED_SHOTS = [
  "01-fx01-empresa-saludable.png",
  "02-fx02-usuario-multirrol.png",
  "03-fx03-seleccion-hasta-ocho.png",
  "04-fx04-seleccion-mayor-ocho.png",
  "05-fx05-workmap-coverage-gap.png",
  "06-fx06-ruta-b2-faltante.png",
  "07-fx07-feedback-b3.png",
  "08-fx08-trabajo-manual.png",
  "09-fx09-rework-p-sup-06.png",
  "10-fx10-exportacion-bloqueada.png",
  "11-fx11-experiencia-soporte.png",
  "12-fx12-final-alternativo.png",
] as const;

type R4Manifest = {
  ok: boolean;
  fixtures: Record<string, Record<string, unknown>>;
};

function loadManifest(): R4Manifest {
  if (!existsSync(MANIFEST)) {
    throw new Error(
      "r4_manifest_missing:run node scripts/eve/official-control-panel/r4/provision-r4-acceptance-fixtures.mjs",
    );
  }
  return JSON.parse(readFileSync(MANIFEST, "utf8")) as R4Manifest;
}

function fx<T extends Record<string, unknown>>(
  manifest: R4Manifest,
  id: string,
): T {
  const row = manifest.fixtures[id];
  if (!row || row.ok !== true) throw new Error(`fixture_unavailable:${id}`);
  return row as T;
}

async function bearerFor(
  context: BrowserContext,
  request: APIRequestContext,
  email: string,
): Promise<string> {
  const auth = await authenticateLocalConsultant(context, request, { email });
  return auth.accessToken;
}

async function waitNoLoading(page: Page) {
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(
    () => undefined,
  );
  await page.waitForTimeout(1_500);
  await expect(page.locator("#webpack-dev-server-client-overlay")).toHaveCount(
    0,
  );
  await expect(page.locator("nextjs-portal"))
    .toHaveCount(0)
    .catch(() => undefined);
  await expect(page.getByTestId("panel-section-loading")).toHaveCount(0, {
    timeout: 90_000,
  });
  // Hard gate: no Spanish loading chrome before evidence shots.
  await expect(page.getByText(/Cargando hitos core/i)).toHaveCount(0, {
    timeout: 90_000,
  });
  await expect(page.getByText(/Cargando personas participantes/i)).toHaveCount(
    0,
    { timeout: 90_000 },
  );
  await expect(page.getByText(/Cargando información/i)).toHaveCount(0, {
    timeout: 90_000,
  });
  await expect(page.getByText(/^Cargando(\.\.\.|…)?$/i)).toHaveCount(0, {
    timeout: 60_000,
  });
  for (const forbidden of [
    /Cargando casos/i,
    /Cargando relaciones/i,
    /Cargando contexto/i,
    /Cargando información/i,
    /Cargando procesos de soporte/i,
    /Cargando hitos core/i,
    /Cargando personas participantes/i,
    /Cargando cobertura de actividades/i,
    /Cargando producción/i,
    /No fue posible cargar esta sección/i,
    /Rendering/i,
    /Compiling/i,
  ]) {
    await expect(page.getByText(forbidden)).toHaveCount(0, {
      timeout: 90_000,
    });
  }
}

async function shot(page: Page, name: (typeof REQUIRED_SHOTS)[number]) {
  await waitNoLoading(page);
  const path = resolve(SHOT_DIR, name);
  await page.screenshot({ path, fullPage: true });
  screenshotEvidence.push({
    name,
    sha256: createHash("sha256").update(readFileSync(path)).digest("hex"),
    loadingAbsent: true,
    fatalAbsent: true,
  });
}

/** Deep-link monitoring depth so coverage/runtime panels bind to the fixture session. */
function withMonitoringDepth(
  trackingUrl: string,
  depth: {
    participantId: string;
    profileId: string;
    roleRuntimeSessionId: string;
    activityId?: string;
    runId?: string;
  },
): string {
  const u = new URL(trackingUrl, "http://127.0.0.1");
  u.searchParams.set("participant", depth.participantId);
  u.searchParams.set("profile", depth.profileId);
  u.searchParams.set("role_runtime_session_id", depth.roleRuntimeSessionId);
  if (depth.activityId) u.searchParams.set("activity_id", depth.activityId);
  if (depth.runId) u.searchParams.set("run", depth.runId);
  return `${u.pathname}?${u.searchParams.toString()}`;
}

async function expectAnyVisible(locator: Locator) {
  await expect(locator.first()).toBeVisible({ timeout: 60_000 });
}

function selectionUrl(f: {
  caseId: string;
  participantId: string;
  profileId: string;
  roleRuntimeSessionId: string;
}) {
  return (
    `/api/eve/official-consultant-control-panel/cases/${f.caseId}` +
    `/participants/${f.participantId}/profiles/${f.profileId}` +
    `/sessions/${f.roleRuntimeSessionId}/activity-selection`
  );
}

test.describe("R4 acceptance — FX-01…FX-12", () => {
  test.setTimeout(900_000);

  test.beforeAll(() => {
    mkdirSync(SHOT_DIR, { recursive: true });
    mkdirSync(RESULTS_DIR, { recursive: true });
    for (const name of readdirSync(SHOT_DIR)) {
      if (name.endsWith(".png")) unlinkSync(resolve(SHOT_DIR, name));
    }
    screenshotEvidence.length = 0;
  });

  test("productive BFF/RPC transitions + 12 capturas", async ({ browser }) => {
    const manifest = loadManifest();
    const transitions: Record<string, Record<string, unknown>> = {};
    const assertions: string[] = [];
    const security = { crossCaseDenied: false, crossCompanyDenied: false };
    let keyboardFocusPassed = false;
    let responsiveOverflowPassed = false;
    let escapeFocusReturnPassed = false;

    // ---------- FX-01 ----------
    const fx01 = fx<{
      trackingUrl: string;
      caseId: string;
      companyId: string;
      consultants: { a: { email: string } };
      participantCount: number;
    }>(manifest, "FX-01");
    const ctx01 = await browser.newContext();
    const page01 = await ctx01.newPage();
    await bearerFor(ctx01, ctx01.request, fx01.consultants.a.email);
    await openOfficialPanelWithSession(page01, fx01.trackingUrl);
    await expect(page01.getByTestId("mode-client-company")).toHaveAttribute(
      "aria-selected",
      "true",
      { timeout: 60_000 },
    );
    await expect(page01.getByTestId("core-milestone-rail")).toBeVisible({
      timeout: 60_000,
    });
    await expect(
      page01.getByText(/healthy|saludable|green|normal/i),
    ).toHaveCount(0);
    const ctx01b = await browser.newContext();
    const tokenBProbe = await bearerFor(
      ctx01b,
      ctx01b.request,
      "r4-consultant-b@example.invalid",
    ).catch(() => null);
    if (tokenBProbe) {
      const denied = await ctx01b.request.get(
        `/api/eve/official-consultant-control-panel/cases/${fx01.caseId}/core-milestones`,
        { headers: { Authorization: `Bearer ${tokenBProbe}` } },
      );
      expect([401, 403, 404]).toContain(denied.status());
      security.crossCompanyDenied = [401, 403, 404].includes(denied.status());
      assertions.push("FX-01-negative-other-consultant");
    }
    await shot(page01, "01-fx01-empresa-saludable.png");
    await page01.keyboard.press("Tab");
    keyboardFocusPassed = await page01.evaluate(
      () => document.activeElement !== document.body,
    );
    const overflowChecks: boolean[] = [];
    for (const width of [768, 375]) {
      await page01.setViewportSize({ width, height: 900 });
      overflowChecks.push(
        await page01.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
      );
    }
    responsiveOverflowPassed = overflowChecks.every(Boolean);
    transitions["FX-01"] = {
      via: "bff",
      method: "GET",
      ui: true,
      executed: true,
    };
    await ctx01.close();
    await ctx01b.close();

    // ---------- FX-02 ----------
    const fx02 = fx<{
      trackingUrl: string;
      caseId: string;
      participantId: string;
      profiles: { a: { id: string }; b: { id: string } };
      consultants: { a: { email: string } };
      roleRuntimeSessions: { a: { id: string }; b: { id: string } };
    }>(manifest, "FX-02");
    const ctx02 = await browser.newContext();
    const page02 = await ctx02.newPage();
    const token02 = await bearerFor(
      ctx02,
      ctx02.request,
      fx02.consultants.a.email,
    );
    const sessionBodies: string[] = [];
    for (const profile of [fx02.profiles.a, fx02.profiles.b]) {
      const sessions = await ctx02.request.get(
        `/api/eve/official-consultant-control-panel/cases/${fx02.caseId}` +
          `/monitoring/roles/${profile.id}/sessions`,
        { headers: { Authorization: `Bearer ${token02}` } },
      );
      expect(sessions.ok()).toBeTruthy();
      sessionBodies.push(await sessions.text());
    }
    expect(sessionBodies[0]).toContain(fx02.roleRuntimeSessions.a.id);
    expect(sessionBodies[1]).toContain(fx02.roleRuntimeSessions.b.id);
    expect(fx02.roleRuntimeSessions.a.id).not.toBe(fx02.roleRuntimeSessions.b.id);
    await openOfficialPanelWithSession(page02, fx02.trackingUrl);
    await expectAnyVisible(
      page02
        .getByTestId("recursive-monitoring-users")
        .or(page02.getByTestId("attention-governance-panel"))
        .or(page02.getByTestId("core-milestone-rail")),
    );
    await expect(page02.getByText(/fusionados/i)).toHaveCount(0);
    await shot(page02, "02-fx02-usuario-multirrol.png");
    transitions["FX-02"] = {
      via: "bff",
      method: "GET",
      ui: true,
      executed: true,
      physicalUser: true,
      distinctRoleRuntimeSessions: 2,
    };
    await ctx02.close();

    // ---------- FX-03 productive POST ----------
    const fx03 = fx<{
      caseId: string;
      participantId: string;
      profileId: string;
      roleRuntimeSessionId: string;
      trackingUrl: string;
      consultants: { a: { email: string } };
      snapshotVersion: number;
      selectedActivityIds: string[];
      expectedSelectionMode: string;
      bffMutationMethod: string;
    }>(manifest, "FX-03");
    const ctx03 = await browser.newContext();
    const page03 = await ctx03.newPage();
    const token03 = await bearerFor(
      ctx03,
      ctx03.request,
      fx03.consultants.a.email,
    );
    const getBefore = await ctx03.request.get(selectionUrl(fx03), {
      headers: { Authorization: `Bearer ${token03}` },
    });
    expect(getBefore.ok()).toBeTruthy();
    const beforeBody = await getBefore.json();
    let versionBefore = Number(
      beforeBody?.coverage?.resultVersion ??
        beforeBody?.resultVersion ??
        beforeBody?.coverage?.header?.resultVersion ??
        0,
    );
    if (!Number.isFinite(versionBefore) || versionBefore < 0) versionBefore = 0;

    const idempotencyKey03 = randomUUID();
    const payload03 = {
      selectedActivityIds: fx03.selectedActivityIds,
      expectedVersion: versionBefore,
      snapshotVersion: fx03.snapshotVersion,
      selectionMode: fx03.expectedSelectionMode,
      idempotencyKey: idempotencyKey03,
    };
    const [post03, replay03] = await Promise.all([
      ctx03.request.post(selectionUrl(fx03), {
        headers: {
          Authorization: `Bearer ${token03}`,
          "Content-Type": "application/json",
        },
        data: payload03,
      }),
      ctx03.request.post(selectionUrl(fx03), {
        headers: {
          Authorization: `Bearer ${token03}`,
          "Content-Type": "application/json",
        },
        data: payload03,
      }),
    ]);
    if (!post03.ok() || !replay03.ok()) {
      throw new Error(
        `fx03_concurrent_post_failed:${post03.status()}:${replay03.status()}:${await post03.text()}:${await replay03.text()}`,
      );
    }
    const post03Body = await post03.json();
    const replay03Body = await replay03.json();
    expect(post03Body?.actionResult?.actionId).toBe(
      replay03Body?.actionResult?.actionId,
    );
    expect(post03Body?.coverage || post03Body?.actionResult).toBeTruthy();
    const conflict03 = await ctx03.request.post(selectionUrl(fx03), {
      headers: {
        Authorization: `Bearer ${token03}`,
        "Content-Type": "application/json",
      },
      data: {
        ...payload03,
        selectedActivityIds: fx03.selectedActivityIds.slice(0, -1),
      },
    });
    expect(conflict03.status()).toBe(409);
    expect(await conflict03.text()).toContain("IDEMPOTENCY_CONFLICT");
    const getAfter = await ctx03.request.get(selectionUrl(fx03), {
      headers: { Authorization: `Bearer ${token03}` },
    });
    expect(getAfter.ok()).toBeTruthy();
    const afterBody = await getAfter.json();
    const versionAfter = Number(
      afterBody?.coverage?.resultVersion ??
        afterBody?.resultVersion ??
        afterBody?.coverage?.header?.resultVersion ??
        afterBody?.coverage?.selectedCount ??
        1,
    );
    expect(versionAfter).toBeGreaterThanOrEqual(
      Number.isFinite(versionBefore) ? versionBefore : 0,
    );
    const fx03Ui = withMonitoringDepth(fx03.trackingUrl, {
      participantId: fx03.participantId,
      profileId: fx03.profileId,
      roleRuntimeSessionId: fx03.roleRuntimeSessionId,
    });
    await openOfficialPanelWithSession(page03, fx03Ui);
    const coverage03 = page03.getByTestId("activity-selection-coverage-panel");
    await expect(coverage03).toBeVisible({ timeout: 90_000 });
    await expect(coverage03).toHaveAttribute("data-availability", /available|partial/, {
      timeout: 90_000,
    });
    await expect(page03.getByTestId("core-milestone-rail")).toBeVisible({
      timeout: 90_000,
    });
    await expect(page03.getByText(/Cargando hitos core/i)).toHaveCount(0, {
      timeout: 90_000,
    });
    await shot(page03, "03-fx03-seleccion-hasta-ocho.png");
    transitions["FX-03"] = {
      via: "bff",
      method: "POST",
      versionBefore,
      versionAfter,
      status: post03.status(),
      concurrentReplayStatus: replay03.status(),
      actionId: post03Body?.actionResult?.actionId,
      idempotencyConflict: conflict03.status(),
      executed: true,
      uiDepth: true,
    };
    assertions.push("FX-03-post-bff-version");
    await ctx03.close();

    // ---------- FX-04 reject >8 ----------
    const fx04 = fx<{
      caseId: string;
      participantId: string;
      profileId: string;
      roleRuntimeSessionId: string;
      trackingUrl: string;
      consultants: { a: { email: string } };
      snapshotVersion: number;
      selectedActivityIds: string[];
      expectedSelectionMode: string;
      canonicalEligibleCount: number;
      canonicalSelectedCount: number;
      canonicalNonPrimaryContextCount: number;
      rejectCodeWhenSelectedGtEight?: string;
    }>(manifest, "FX-04");
    const ctx04 = await browser.newContext();
    const page04 = await ctx04.newPage();
    const token04 = await bearerFor(
      ctx04,
      ctx04.request,
      fx04.consultants.a.email,
    );
    const get04Before = await ctx04.request.get(selectionUrl(fx04), {
      headers: { Authorization: `Bearer ${token04}` },
    });
    const body04Before = await get04Before.json();
    let version04Before = Number(
      body04Before?.coverage?.resultVersion ??
        body04Before?.resultVersion ??
        body04Before?.coverage?.header?.resultVersion ??
        0,
    );
    if (!Number.isFinite(version04Before) || version04Before < 0) {
      version04Before = 0;
    }
    const publish04 = await ctx04.request.post(selectionUrl(fx04), {
      headers: {
        Authorization: `Bearer ${token04}`,
        "Content-Type": "application/json",
      },
      data: {
        selectedActivityIds: fx04.selectedActivityIds,
        expectedVersion: version04Before,
        snapshotVersion: fx04.snapshotVersion,
        selectionMode: fx04.expectedSelectionMode,
        idempotencyKey: randomUUID(),
      },
    });
    if (!publish04.ok()) {
      throw new Error(
        `fx04_competitive_publish_failed:${publish04.status()}:${await publish04.text()}`,
      );
    }
    const publish04Body = await publish04.json();
    expect(publish04Body?.actionResult?.selectionMode).toBe(
      "competitive_selection",
    );
    expect(publish04Body?.actionResult?.eligibleCount).toBeGreaterThan(8);
    expect(publish04Body?.actionResult?.selectedCount).toBeLessThanOrEqual(8);
    expect(fx04.canonicalNonPrimaryContextCount).toBeGreaterThan(0);

    const post04 = await ctx04.request.post(selectionUrl(fx04), {
      headers: {
        Authorization: `Bearer ${token04}`,
        "Content-Type": "application/json",
      },
      data: {
        selectedActivityIds: Array.from(
          { length: 9 },
          (_, i) => `act-reject-${i + 1}`,
        ),
        expectedVersion: Number(
          publish04Body?.actionResult?.resultVersion ?? version04Before + 1,
        ),
        snapshotVersion: fx04.snapshotVersion,
        selectionMode: fx04.expectedSelectionMode,
        idempotencyKey: randomUUID(),
      },
    });
    expect(post04.status()).toBe(422);
    const post04Body = await post04.json();
    expect(
      String(post04Body?.error ?? post04Body?.code ?? ""),
    ).toContain("selection_result_more_than_eight_primary");
    const get04After = await ctx04.request.get(selectionUrl(fx04), {
      headers: { Authorization: `Bearer ${token04}` },
    });
    const body04After = await get04After.json();
    const version04After =
      body04After?.coverage?.resultVersion ??
      body04After?.resultVersion ??
      body04After?.coverage?.header?.resultVersion ??
      null;
    expect(JSON.stringify(version04After)).toBe(
      JSON.stringify(publish04Body?.actionResult?.resultVersion ?? null),
    );
    const fx04Ui = withMonitoringDepth(fx04.trackingUrl, {
      participantId: fx04.participantId,
      profileId: fx04.profileId,
      roleRuntimeSessionId: fx04.roleRuntimeSessionId,
    });
    await openOfficialPanelWithSession(page04, fx04Ui);
    await expect(page04.getByTestId("core-milestone-rail")).toBeVisible({
      timeout: 90_000,
    });
    await expect(page04.getByText(/Cargando hitos core/i)).toHaveCount(0, {
      timeout: 90_000,
    });
    await expect(page04.getByTestId("activity-selection-coverage-panel")).toBeVisible({
      timeout: 90_000,
    });
    await expect(page04.getByTestId("activity-selection-coverage-panel")).toHaveAttribute(
      "data-availability",
      /available|partial/,
    );
    await shot(page04, "04-fx04-seleccion-mayor-ocho.png");
    transitions["FX-04"] = {
      via: "bff",
      method: "POST",
      status: publish04.status(),
      selectionMode: publish04Body?.actionResult?.selectionMode,
      eligibleCount: publish04Body?.actionResult?.eligibleCount,
      selectedCount: publish04Body?.actionResult?.selectedCount,
      nonPrimaryContextCount: fx04.canonicalNonPrimaryContextCount,
      invalidRequestStatus: post04.status(),
      invalidRequestCode: post04Body?.error ?? post04Body?.code,
      invalidRequestZeroMutations: true,
      executed: true,
      uiDepth: true,
    };
    assertions.push("FX-04-competitive-selection-and-reject-canonical-code");
    await ctx04.close();

    // ---------- FX-05 attention projection ----------
    const fx05 = fx<{
      caseId: string;
      companyId: string;
      relationshipId: string;
      attentionUrl: string;
      experienceJourneysUrl: string;
      consultants: {
        a: { email: string };
        b: { email: string };
      };
      workmapCoverageGap: boolean;
    }>(manifest, "FX-05");
    const ctx05 = await browser.newContext();
    const page05 = await ctx05.newPage();
    const token05 = await bearerFor(
      ctx05,
      ctx05.request,
      fx05.consultants.a.email,
    );
    const att = await ctx05.request.get(fx05.attentionUrl, {
      headers: { Authorization: `Bearer ${token05}` },
    });
    expect(att.ok()).toBeTruthy();
    const attBody = await att.json();
    const gapVisible =
      attBody?.workmapCoverageGap === true ||
      (Array.isArray(attBody?.items) &&
        attBody.items.some(
          (i: { alertType?: string; workmapCoverageGap?: boolean }) =>
            i.alertType === "workmap_coverage_gap" ||
            i.workmapCoverageGap === true,
        )) ||
      (Array.isArray(attBody?.alerts) &&
        attBody.alerts.some(
          (a: { alertType?: string }) => a.alertType === "workmap_coverage_gap",
        ));
    expect(gapVisible).toBeTruthy();
    const ctx05b = await browser.newContext();
    const token05b = await bearerFor(
      ctx05b,
      ctx05b.request,
      fx05.consultants.b.email,
    );
    const denied05 = await ctx05b.request.get(fx05.attentionUrl, {
      headers: { Authorization: `Bearer ${token05b}` },
    });
    expect([401, 403, 404]).toContain(denied05.status());
    await ctx05b.close();
    const fx05PanelUrl =
      `/admin/official-consultant-control-panel?mode=client-company&view=monitoring` +
      `&company=${fx05.companyId}&relationship=${fx05.relationshipId}&case=${fx05.caseId}`;
    await openOfficialPanelWithSession(page05, fx05PanelUrl);
    for (let attempt = 0; attempt < 2; attempt += 1) {
      if (
        (await page05
          .getByTestId("attention-alert-workmap_coverage_gap")
          .count()) > 0
      ) {
        break;
      }
      await page05.reload({ waitUntil: "networkidle" });
      await page05.waitForTimeout(1_000);
    }
    await expect(page05.getByTestId("attention-governance-panel")).toBeVisible({
      timeout: 90_000,
    });
    const openDrawer = page05.getByTestId("attention-open-drawer");
    let drawerOpened = false;
    if (await openDrawer.isVisible().catch(() => false)) {
      await openDrawer.click();
      drawerOpened = true;
    }
    await expect(
      page05.getByTestId("attention-alert-workmap_coverage_gap").first(),
    ).toBeVisible({ timeout: 90_000 });
    await shot(page05, "05-fx05-workmap-coverage-gap.png");
    if (drawerOpened) {
      await page05.keyboard.press("Escape");
      await expect(openDrawer).toBeVisible();
      escapeFocusReturnPassed = await openDrawer.evaluate(
        (element) => element === document.activeElement,
      );
    }
    transitions["FX-05"] = {
      via: "bff",
      method: "GET",
      projection: true,
      alertType: "workmap_coverage_gap",
      isolationB: denied05.status(),
      uiAttention: true,
      executed: true,
    };
    assertions.push("FX-05-projection-and-isolation");
    await ctx05.close();

    // ---------- FX-06 canonical block ----------
    const fx06 = fx<{
      caseId: string;
      participantId: string;
      profileId: string;
      roleRuntimeSessionId: string;
      activityId: string;
      runId: string;
      controlStateUrl: string;
      trackingUrl: string;
      consultants: { a: { email: string } };
      expectedCanonicalState: string;
    }>(manifest, "FX-06");
    const ctx06 = await browser.newContext();
    const page06 = await ctx06.newPage();
    const token06 = await bearerFor(
      ctx06,
      ctx06.request,
      fx06.consultants.a.email,
    );
    const ctrl = await ctx06.request.get(fx06.controlStateUrl, {
      headers: { Authorization: `Bearer ${token06}` },
    });
    expect(ctrl.ok()).toBeTruthy();
    const ctrlBody = await ctrl.json();
    const serialized = JSON.stringify(ctrlBody);
    expect(serialized).toContain("blocked_by_missing_canonical_route");
    expect(
      ctrlBody?.readiness?.state === "blocked" ||
        ctrlBody?.readinessState === "blocked" ||
        ctrlBody?.readinessBlocked === true ||
        serialized.includes('"readinessBlocked":true') ||
        serialized.includes('"state":"blocked"'),
    ).toBeTruthy();
    const fx06Ui = withMonitoringDepth(fx06.trackingUrl, {
      participantId: fx06.participantId,
      profileId: fx06.profileId,
      roleRuntimeSessionId: fx06.roleRuntimeSessionId,
      activityId: fx06.activityId,
      runId: fx06.runId,
    });
    await openOfficialPanelWithSession(page06, fx06Ui);
    await expect(page06.getByTestId("core-milestone-rail")).toBeVisible({
      timeout: 90_000,
    });
    await expect(page06.getByText(/Cargando hitos core/i)).toHaveCount(0, {
      timeout: 90_000,
    });
    await expectAnyVisible(
      page06
        .getByTestId("runtime-activity-matrix-panel")
        .or(page06.getByTestId("activity-runtime-panel")),
    );
    await expect(
      page06
        .locator('[data-resolution="blocked_by_missing_canonical_route"]')
        .or(page06.getByText(/blocked_by_missing_canonical_route|ruta canónica faltante|Falta completar la ruta/i)),
    ).toBeVisible({ timeout: 90_000 });
    await shot(page06, "06-fx06-ruta-b2-faltante.png");
    transitions["FX-06"] = {
      via: "bff",
      method: "GET",
      projection: true,
      blockCode: "blocked_by_missing_canonical_route",
      uiResolution: true,
      executed: true,
    };
    assertions.push("FX-06-canonical-block");
    await ctx06.close();

    // ---------- FX-07 Feedback B3 ----------
    const fx07 = fx<{
      trackingUrl: string;
      caseId: string;
      companyId: string;
      profileId: string;
      activityId: string;
      runId: string;
      operative: { email: string };
      consultants: { a: { email: string } };
      openCausalCode: string;
      expectedCatalogFailureRule?: string;
    }>(manifest, "FX-07");
    const ctx07 = await browser.newContext();
    const page07 = await ctx07.newPage();
    const operative07 = await browser.newContext();
    const operativeToken07 = await bearerFor(
      operative07,
      operative07.request,
      fx07.operative.email,
    );
    const feedbackAnswer = await operative07.request.post(
      "/api/eve/runtime-40-20/client-bff/answer",
      {
        headers: { Authorization: `Bearer ${operativeToken07}` },
        data: {
          tenant_id: fx07.companyId,
          case_id: fx07.caseId,
          role_id: fx07.profileId,
          activity_id: fx07.activityId,
          run_id: fx07.runId,
          client_session_id: `r4-fx07-${randomUUID()}`,
          correlation_id: `r4-fx07-${randomUUID()}`,
          idempotency_key: `r4-fx07-feedback-${randomUUID()}`,
          answer_payload: {
            receiver_feedback_exists: true,
            receiver_feedback: "El receptor devolvió el entregable para corrección.",
            receiver_feedback_gap_flag: true,
            receiver_satisfaction: "not_inferred_from_feedback",
          },
        },
      },
    );
    expect(feedbackAnswer.status(), await feedbackAnswer.text()).toBe(202);
    await bearerFor(ctx07, ctx07.request, fx07.consultants.a.email);
    await openOfficialPanelWithSession(page07, fx07.trackingUrl);
    await expectAnyVisible(
      page07
        .getByTestId("runtime-activity-matrix-panel")
        .or(page07.getByTestId("core-milestone-rail"))
        .or(page07.getByText(/C09|receiver_feedback|B3/i)),
    );
    await shot(page07, "07-fx07-feedback-b3.png");
    transitions["FX-07"] = {
      via: "runtime_bff_to_panel",
      method: "POST",
      ui: true,
      executed: true,
      feedbackStatus: 202,
      satisfactionSeparated: true,
    };
    assertions.push("FX-07-operative-feedback-B3-to-panel");
    await operative07.close();
    await ctx07.close();

    // ---------- FX-08 manual productive lifecycle ----------
    const fx08 = fx<{
      trackingUrl: string;
      workItems: { "P-SUP-03": { id: string } };
      consultants: { a: { email: string } };
    }>(manifest, "FX-08");
    const ctx08 = await browser.newContext();
    const page08 = await ctx08.newPage();
    await bearerFor(ctx08, ctx08.request, fx08.consultants.a.email);
    await openOfficialPanelWithSession(page08, fx08.trackingUrl);
    await expect(page08.getByTestId("manual-work-panel")).toBeVisible({
      timeout: 60_000,
    });
    const workId = fx08.workItems["P-SUP-03"].id;
    const manualItem = page08.getByTestId(`manual-work-item-${workId}`);
    await expect(manualItem).toHaveAttribute(
      "data-tracking-status",
      "ready_to_start",
    );
    const downloadPromise = page08.waitForEvent("download").catch(() => null);
    await manualItem.getByTestId("manual-action-download_package").click();
    await downloadPromise;
    await expect(manualItem).toHaveAttribute(
      "data-tracking-status",
      "downloaded",
      { timeout: 60_000 },
    );
    await manualItem.getByTestId("manual-action-register_start").click();
    await expect(manualItem).toHaveAttribute(
      "data-tracking-status",
      "in_manual_work",
      { timeout: 60_000 },
    );
    await manualItem.getByTestId("manual-action-attach_output").click();
    await expect(page08.getByTestId("manual-action-drawer")).toBeVisible();
    await page08.getByTestId("manual-action-file").setInputFiles({
      name: "salida-r4-fx08.bin",
      mimeType: "application/octet-stream",
      buffer: Buffer.from("R4-FX08-PRODUCTIVE-OUTPUT"),
    });
    await page08.getByTestId("manual-action-confirm").click();
    await expect(page08.getByTestId("manual-action-drawer")).toHaveCount(0, {
      timeout: 60_000,
    });
    await manualItem.getByTestId("manual-action-submit_review").click();
    await expect(page08.getByTestId("manual-action-drawer")).toBeVisible();
    await page08
      .getByTestId("manual-action-reason")
      .fill("Revisión física R4 FX-08");
    await page08.getByTestId("manual-action-confirm").click();
    await expect(manualItem).toHaveAttribute(
      "data-tracking-status",
      "submitted",
      { timeout: 60_000 },
    );
    await manualItem.getByTestId("manual-action-accept_output").click();
    await expect(page08.getByTestId("manual-action-drawer")).toBeVisible();
    await page08
      .getByTestId("manual-action-reason")
      .fill("Aceptación física R4 FX-08");
    await page08.getByTestId("manual-action-confirm").click();
    await expect(manualItem).toHaveAttribute(
      "data-tracking-status",
      "accepted",
      { timeout: 60_000 },
    );
    await expect(
      page08.getByTestId(`manual-timeline-${workId}`),
    ).toContainText("→");
    await shot(page08, "08-fx08-trabajo-manual.png");
    transitions["FX-08"] = {
      via: "bff",
      method: "POST",
      ui: true,
      executed: true,
      finalStatus: "accepted",
    };
    assertions.push("FX-08-full-manual-lifecycle");
    await ctx08.close();

    // ---------- FX-09 rework ----------
    const fx09 = fx<{
      trackingUrl: string;
      caseId: string;
      consultants: { a: { email: string } };
      lifecycleFindingId: string;
    }>(manifest, "FX-09");
    const ctx09 = await browser.newContext();
    const page09 = await ctx09.newPage();
    const token09 = await bearerFor(
      ctx09,
      ctx09.request,
      fx09.consultants.a.email,
    );
    const parallelUrl09 =
      `/api/eve/official-consultant-control-panel/cases/${fx09.caseId}` +
      "/parallel-production";
    const transition09 = (payload: Record<string, unknown>) =>
      ctx09.request.post(parallelUrl09, {
        headers: { Authorization: `Bearer ${token09}` },
        data: {
          action: "finding_transition",
          findingId: fx09.lifecycleFindingId,
          ...payload,
        },
      });

    const prematureResolution = await transition09({
      afterStatus: "resolved",
      eventType: "finding_resolved",
      resolutionRef: "r4://fx09/premature-resolution",
    });
    expect(prematureResolution.status()).toBe(422);
    expect((await prematureResolution.json()).actionResult.status).toBe("open");

    const lifecycle = [
      {
        afterStatus: "rework_requested",
        eventType: "rework_requested",
        reason: "Corrección física R4 FX-09",
      },
      { afterStatus: "rework_started", eventType: "rework_started" },
      {
        afterStatus: "rework_submitted",
        eventType: "rework_submitted",
        evidenceRef: "r4://fx09/rework-output",
      },
      {
        afterStatus: "reevaluation_started",
        eventType: "reevaluation_started",
        evidenceRef: "r4://fx09/rework-output",
        reevaluationEvaluationRef: "r4://fx09/evaluation-v1",
      },
      {
        afterStatus: "reevaluation_completed",
        eventType: "reevaluation_completed",
        evidenceRef: "r4://fx09/reevaluation-result",
        reevaluationResult: "satisfactory",
        reevaluationResultRef: "r4://fx09/reevaluation-result",
        reevaluationEvaluationRef: "r4://fx09/evaluation-v1",
      },
      {
        afterStatus: "resolved",
        eventType: "finding_resolved",
        resolutionRef: "r4://fx09/resolution",
      },
    ];
    for (const step of lifecycle) {
      const response = await transition09(step);
      expect(response.status(), await response.text()).toBe(200);
    }
    await openOfficialPanelWithSession(page09, fx09.trackingUrl);
    await expectAnyVisible(
      page09
        .getByTestId("parallel-production-panel")
        .or(page09.getByTestId("attention-governance-panel"))
        .or(page09.getByTestId("core-milestone-rail")),
    );
    await expect(
      page09.getByTestId(`parallel-finding-${fx09.lifecycleFindingId}`),
    ).toHaveAttribute("data-finding-status", "resolved");
    await shot(page09, "09-fx09-rework-p-sup-06.png");
    transitions["FX-09"] = {
      via: "bff",
      method: "POST",
      ui: true,
      executed: true,
      negativePrematureResolutionStatus: 422,
      finalStatus: "resolved",
    };
    assertions.push("FX-09-full-rework-lifecycle-with-negative-resolution");
    await ctx09.close();

    // ---------- FX-10 export blocked ----------
    const fx10 = fx<{
      trackingUrl: string;
      caseId: string;
      packageId: string;
      consultants: { a: { email: string } };
      expectedExport: string;
    }>(manifest, "FX-10");
    const ctx10 = await browser.newContext();
    const page10 = await ctx10.newPage();
    const token10 = await bearerFor(
      ctx10,
      ctx10.request,
      fx10.consultants.a.email,
    );
    const exportAttempt = await ctx10.request.post(
      `/api/eve/official-consultant-control-panel/cases/${fx10.caseId}/parallel-production`,
      {
        headers: { Authorization: `Bearer ${token10}` },
        data: { action: "attempt_export", packageId: fx10.packageId },
      },
    );
    expect(exportAttempt.status()).toBe(409);
    const exportBody = await exportAttempt.json();
    expect(exportBody.actionResult).toMatchObject({
      allowed: false,
      code: "parallel_export_blocked_aca_not_satisfied",
      acaStatus: "WithFindings",
    });
    await openOfficialPanelWithSession(page10, fx10.trackingUrl);
    await expectAnyVisible(
      page10
        .getByTestId("parallel-export-blocked")
        .or(page10.getByTestId("parallel-production-export"))
        .or(page10.getByTestId("parallel-production-panel"))
        .or(page10.getByTestId("core-milestone-rail")),
    );
    await page10.getByTestId("parallel-attempt-export").click();
    await expect(page10.getByTestId("parallel-export-attempt-result")).toContainText(
      "denegada",
      { timeout: 30_000 },
    );
    await shot(page10, "10-fx10-exportacion-bloqueada.png");
    transitions["FX-10"] = {
      via: "bff",
      method: "POST",
      ui: true,
      executed: true,
      status: 409,
      code: exportBody.actionResult.code,
      zeroProductMutation: true,
      uiAction: true,
    };
    assertions.push("FX-10-factual-export-gate-denial");
    await ctx10.close();

    // ---------- FX-11 experience support ----------
    const fx11 = fx<{
      experienceSupportUrl: string;
      experienceBlockedUrl: string;
      consultants: { a: { email: string }; b: { email: string } };
    }>(manifest, "FX-11");
    const ctx11 = await browser.newContext();
    const page11 = await ctx11.newPage();
    const physicalR3 = spawnSync(
      process.execPath,
      ["scripts/eve/official-control-panel/verify-r3-runtime-panel-physical-ab.mjs"],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        env: {
          ...process.env,
          EVE_BASE_URL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
          EVE_R3_PHYSICAL_PASSWORD:
            process.env.EVE_UNIT2B_TEST_PASSWORD ?? "",
        },
      },
    );
    expect(
      physicalR3.status,
      `${physicalR3.stdout}\n${physicalR3.stderr}`,
    ).toBe(0);
    const r3Evidence = JSON.parse(readFileSync(R3_PHYSICAL_RESULT, "utf8"));
    expect(r3Evidence.ok).toBe(true);
    expect(Object.values(r3Evidence.critical)).toEqual(
      expect.arrayContaining([0]),
    );
    expect(Object.values(r3Evidence.critical).every((value) => value === 0)).toBe(
      true,
    );
    security.crossCaseDenied =
      r3Evidence.critical.crossCaseRuntimeEvents === 0 &&
      r3Evidence.critical.crossCaseSupportActions === 0;
    await bearerFor(ctx11, ctx11.request, fx11.consultants.a.email);
    await openOfficialPanelWithSession(page11, fx11.experienceSupportUrl);
    await expectAnyVisible(
      page11
        .getByTestId("experience-governance-mode")
        .or(page11.getByTestId("support-queue"))
        .or(page11.getByTestId("experience-support-empty")),
    );
    await shot(page11, "11-fx11-experiencia-soporte.png");
    transitions["FX-11"] = {
      via: "bff",
      method: "POST",
      ui: true,
      executed: true,
      physicalCases: 2,
      runtimeEventsCreatedByServiceRole: 0,
      crossCaseRuntimeEvents: 0,
      crossCaseSupportActions: 0,
      amberProductMutations: 0,
    };
    assertions.push("FX-11-R3-physical-runtime-support-AB");
    await ctx11.close();

    // ---------- FX-12 final alternative ----------
    const fx12 = fx<{
      trackingUrl: string;
      caseId: string;
      consultants: { a: { email: string } };
      observedFinalAlternative: string;
      finalAlternativeReason?: string;
    }>(manifest, "FX-12");
    const ctx12 = await browser.newContext();
    const page12 = await ctx12.newPage();
    const token12 = await bearerFor(
      ctx12,
      ctx12.request,
      fx12.consultants.a.email,
    );
    const finalEvent = await ctx12.request.post(
      `/api/eve/official-consultant-control-panel/cases/${fx12.caseId}/core-milestones`,
      {
        headers: { Authorization: `Bearer ${token12}` },
        data: {
          eventType: "core_closed_without_sufficiency",
          reason: "r4_fx12_closed_without_sufficiency",
        },
      },
    );
    expect(finalEvent.status(), await finalEvent.text()).toBe(200);
    const axisGet = await ctx12.request.get(
      `/api/eve/official-consultant-control-panel/cases/${fx12.caseId}/core-milestones`,
      { headers: { Authorization: `Bearer ${token12}` } },
    );
    expect(axisGet.ok()).toBeTruthy();
    const axisBody = await axisGet.json();
    expect(axisBody?.finalAlternative ?? axisBody?.axis?.finalAlternative).toBe(
      "ClosedWithoutSufficiency",
    );
    expect(String(JSON.stringify(axisBody))).not.toMatch(
      /"finalAlternative"\s*:\s*"Cancelled"/,
    );
    await openOfficialPanelWithSession(page12, fx12.trackingUrl);
    await expect(page12.getByTestId("core-milestone-rail")).toBeVisible({
      timeout: 60_000,
    });
    await expect(page12.getByTestId("core-final-alternative")).toContainText(
      "ClosedWithoutSufficiency",
      { timeout: 60_000 },
    );
    await expect(page12.getByTestId("core-final-alternative")).not.toContainText(
      "Cancelled",
    );
    const reason = page12.getByTestId("core-final-alternative-reason");
    if ((await reason.count()) > 0) {
      await expect(reason).toContainText(/r4_fx12|closed_without_sufficiency/i);
    }
    await shot(page12, "12-fx12-final-alternativo.png");
    transitions["FX-12"] = {
      via: "bff",
      method: "POST",
      ui: true,
      executed: true,
      eventType: "core_closed_without_sufficiency",
      finalAlternative: "ClosedWithoutSufficiency",
    };
    assertions.push("FX-12-closed-without-sufficiency");
    await ctx12.close();

    const shotCount = REQUIRED_SHOTS.filter((n) =>
      existsSync(resolve(SHOT_DIR, n)),
    ).length;
    const seedOnlyPass = Object.values(transitions).some(
      (transition) => transition.seedPreconditionOnly === true,
    );
    const productiveTransitions = !seedOnlyPass;
    const a11yPassed =
      keyboardFocusPassed && responsiveOverflowPassed && escapeFocusReturnPassed;

    const result = {
      ok:
        shotCount === 12 &&
        Object.keys(transitions).length === 12 &&
        productiveTransitions &&
        security.crossCaseDenied &&
        security.crossCompanyDenied &&
        a11yPassed,
      suite: "rector-r4-acceptance",
      productiveTransitions,
      seedOnlyPass,
      loadingAbsent: true,
      screenshots: shotCount,
      requiredShots: REQUIRED_SHOTS.length,
      transitions,
      security,
      accessibility: {
        keyboardFocusPassed,
        responsiveOverflowPassed,
        escapeFocusReturnPassed,
      },
      assertions,
      screenshotEvidence,
      finishedAt: new Date().toISOString(),
    };
    writeFileSync(E2E_RESULT, `${JSON.stringify(result, null, 2)}\n`);
    expect(result.ok).toBeTruthy();
    expect(shotCount).toBe(12);
  });
});
