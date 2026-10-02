import { expect, test, type APIRequestContext, type BrowserContext, type Page } from "@playwright/test";
import { createServerClient } from "@supabase/ssr";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const APP_BASE = process.env.EVE_BASE_URL ?? "http://127.0.0.1:3112";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const PANEL_EMAIL = process.env.EVE_TEST_CONSULTANT_EMAIL ?? process.env.NEXT_PUBLIC_EVE_PANEL_ACCESS_EMAIL;
const PANEL_PASSWORD = process.env.EVE_TEST_CONSULTANT_PASSWORD ?? process.env.EVE_UNIT2B_TEST_PASSWORD;
const PARTICIPANT_EMAIL = process.env.EVE_TEST_PARTICIPANT_EMAIL ?? "gaby.johnson@example.test";
const PARTICIPANT_PASSWORD = process.env.EVE_TEST_PARTICIPANT_PASSWORD ?? "Eve-Gaby-Temp-2026!";
const OUTPUT_DIR = resolve(".tmp", "p142-conformance-monitoring");

type JsonRecord = Record<string, unknown>;

const SELECTOR_TEMPLATE_V1_3_FIELDS = [
  "activity_id",
  "responsibility_id",
  "responsibility_title",
  "activity_index",
  "activity_title",
  "activity_description",
  "eligibility_status",
  "exclusion_reason",
  "pmSignalPotential",
  "mocSignalPotential",
  "pfSignalPotential",
  "olcSignalPotential",
  "architecturalSignalPotential",
  "operationalCentrality",
  "transformationObjectSignal",
  "handoffDependencySignal",
  "timerWaitSignal",
  "synchronizationGovernanceSignal",
  "frictionExceptionSignal",
  "pfOlcRiskSignal",
  "coverageDiversityValue",
  "duplicatePenalty",
  "tooMacroPenalty",
  "tooMicroPenalty",
  "overlySpecificToolPenalty",
  "lateralContextPenalty",
  "responsibilityBalanceAdjustment",
  "finalSelectionScore",
  "preferredSlotCandidate",
  "selectedSlot",
  "selectionStatus",
  "selectionReasonCode",
  "selectionReasonText",
  "nonPrimaryContextStatus",
  "runtimeHandoffPriority",
  "traceFlags",
  "manualReviewRequired",
  "notes",
] as const;

test.describe("P1.4.4 selector template activity detail drawer", () => {
  test.setTimeout(180000);
  test.skip(
    !SUPABASE_URL || !SUPABASE_ANON_KEY || !PANEL_EMAIL || !PANEL_PASSWORD,
    "staging_panel_environment_missing",
  );

  test("consultant validates Gaby legacy and C3.12 fixture activity details", async ({
    context,
    page,
    request,
  }) => {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    const session = await signInPanelConsultant(context, request);
    const api = (path: string) =>
      requestJson(request, `${APP_BASE}${path}`, session.accessToken);
    const telemetry = attachNetworkTelemetry(page);

    const organimuebles = await resolveCase(api, /Organimuebles/i, /Organimuebles|Pedido mixto/i);
    const gaby = await resolveParticipant(api, organimuebles.caseId, /Gaby Johnson/i);
    const gabyActivities = await resolveActivities(api, organimuebles.caseId);
    const gabyPrimary = gabyActivities.find((activity) => activity.classification === "primary");
    const gabyContextual = gabyActivities.find((activity) => activity.classification === "non-primary");
    expect(gabyPrimary, "Gaby has a primary activity").toBeTruthy();
    expect(gabyContextual, "Gaby has a contextual activity").toBeTruthy();

    await openPanel(page, {
      companyId: organimuebles.companyId,
      relationshipId: organimuebles.relationshipId,
      caseId: organimuebles.caseId,
      participantId: String(gaby.participantId),
      profileId: String(gaby.functionalProfileId),
    });
    await expectCompactTableRemainsOperational(page);

    const gabyPrimaryButton = await openActivityDetailBySelection(page, /Primaria/);
    const drawer = page.locator('[data-testid="activity-conformance-drawer"]');
    await expectFloatingConformanceDrawer(page, drawer);
    await expect(drawer).toContainText(
      /Esta selección fue ejecutada antes de la trazabilidad exhaustiva C3\.12\. El resultado de 15\/8\/7 se conserva, pero los componentes no persistidos no pueden reconstruirse\./,
      { timeout: 30000 },
    );
    await expect(drawer).toContainText(/Runtime preparado|Runtime activo|Runtime bloqueado|Runtime completado/, {
      timeout: 30000,
    });
    await expectInitialSummaryTabOnly(drawer);
    await expect(drawer).toContainText(/Perfil funcional\s*Venta/);
    await expect(drawer).toContainText(/Actividad|Responsabilidad fuente|Perfil funcional|Resumen/);
    await expect(drawer).not.toContainText(/activity_id|pmSignalPotential|source_workmap_id/);
    await page.screenshot({
      path: resolve(OUTPUT_DIR, "gaby-legacy-summary-tab.png"),
      fullPage: true,
    });
    await drawer.getByRole("tab", { name: "Resumen" }).focus();
    await page.keyboard.press("ArrowRight");
    const templateTab = drawer.getByRole("tab", { name: "Plantilla completa" });
    await expect(templateTab).toHaveAttribute("aria-selected", "true");
    await expect(templateTab).toBeFocused();
    await expectSelectorTemplateFields(drawer);
    await expect(drawer).toContainText(/Extensión C3\.12|promotionConditionCode|replay_status|QA status/);
    await expectDrawerHasInternalScroll(drawer);
    await page.screenshot({
      path: resolve(OUTPUT_DIR, "gaby-legacy-template-tab.png"),
      fullPage: true,
    });
    await templateTab.press("End");
    await expect(drawer.getByRole("tab", { name: "Procedencia técnica" })).toHaveAttribute("aria-selected", "true");
    await expect(drawer).toContainText(/source_workmap_id|source_workmap_version_id|profile_binding|workmap_snapshot_hash/);
    await expect(drawer).toContainText(/case label\s*case_label\s*Caso E2E Organimuebles.*Pedido mixto/);
    await expect(drawer).toContainText(/policy_version|selector_code_version|policy_manifest_hash|selection_result_hash/);
    await expect(drawer.getByRole("button", { name: /^Copiar$/ }).first()).toBeVisible();
    await drawer.getByRole("button", { name: /^Copiar$/ }).first().click();
    await expect(drawer).toContainText(/Copiado/);
    await expect(drawer).toContainText(/No persistido|No verificable|No aplicable/);
    await expectSingleWorkMapVersion(drawer);
    await page.screenshot({
      path: resolve(OUTPUT_DIR, "gaby-legacy-provenance-tab.png"),
      fullPage: true,
    });
    await selectConformanceTab(drawer, "Resumen");
    await expect(drawer).not.toContainText(/activity_id|pmSignalPotential|source_workmap_id/);
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden({ timeout: 10000 });
    await expect(gabyPrimaryButton).toBeFocused();

    await openActivityDetailBySelection(page, /Contexto no primario/);
    await expectFloatingConformanceDrawer(page, drawer);
    await expect(drawer).toContainText(/No aplica — no genera Runtime/, { timeout: 30000 });
    await expect(drawer).toContainText(
      /Esta selección fue ejecutada antes de la trazabilidad exhaustiva C3\.12\./,
      { timeout: 30000 },
    );
    const contextualText = await drawer.innerText();
    expect(countMatches(contextualText, "No aplica — no genera Runtime")).toBeGreaterThanOrEqual(1);
    await selectConformanceTab(drawer, "Plantilla completa");
    const contextualTemplateText = await drawer.innerText();
    expect(countMatches(contextualTemplateText, "No aplica — no genera Runtime")).toBeGreaterThanOrEqual(1);
    await expect(drawer).toContainText(/Conservada como contexto|Contexto no primario/, { timeout: 30000 });
    await expect(drawer).toContainText(/promotionCondition|promotionConditionCode|reviewCondition/, {
      timeout: 30000,
    });
    await selectConformanceTab(drawer, "Procedencia técnica");
    await expect(drawer).toContainText(/profile label\s*profile_label\s*Venta/);
    await expect(drawer).toContainText(/case label\s*case_label\s*Caso E2E Organimuebles.*Pedido mixto/);
    await expectSingleWorkMapVersion(drawer);
    await expect(drawer).not.toContainText(/source_workmap_version_idprofile/);
    await page.screenshot({
      path: resolve(OUTPUT_DIR, "gaby-legacy-contextual-detail.png"),
      fullPage: true,
    });
    await closeDrawer(page);

    const fixture = await resolveCase(api, /C312 Smoke Conformance Company/i, /C312 Smoke Case/i);
    const fixtureParticipant = await resolveParticipant(api, fixture.caseId, /Participante C312 Smoke/i);
    await openPanel(page, {
      companyId: fixture.companyId,
      relationshipId: fixture.relationshipId,
      caseId: fixture.caseId,
      participantId: String(fixtureParticipant.participantId),
      profileId: String(fixtureParticipant.functionalProfileId),
    });
    await openActivityDetailBySelection(page, /Primaria/);
    await expectFloatingConformanceDrawer(page, drawer);
    await expect(drawer).toContainText(/Conformidad C3\.12/, { timeout: 30000 });
    await expectInitialSummaryTabOnly(drawer);
    await expect(drawer).toContainText(/Perfil funcional\s*Venta/);
    await selectConformanceTab(drawer, "Plantilla completa");
    await expect(drawer).toContainText(/PRIMARY_ACTIVITY_SELECTION_V1_3/, { timeout: 30000 });
    await expectSelectorTemplateFields(drawer);
    await expect(drawer).toContainText(/pass|review|unknown|Dato desconocido/, { timeout: 30000 });
    await expect(drawer).toContainText(/Señales|architecturalSignalPotential|operationalCentrality/, {
      timeout: 30000,
    });
    await expect(drawer).toContainText(/transformationObjectSignal|handoffDependencySignal|timerWaitSignal/);
    await expect(drawer).toContainText(/Penalizaciones|responsibilityBalanceAdjustment|finalSelectionScore/);
    await expect(drawer).toContainText(/preferredSlotCandidate|selectedSlot|selectionReasonCode|runtimeHandoffPriority/);
    await expect(drawer).toContainText(/traceFlags|manualReviewRequired|replay_status|match|Extensión C3\.12/);
    await page.screenshot({
      path: resolve(OUTPUT_DIR, "fixture-c312-template-tab.png"),
      fullPage: true,
    });
    await selectConformanceTab(drawer, "Procedencia técnica");
    await expect(drawer).toContainText(/case label\s*case_label\s*C312 Smoke Case/);
    await expect(drawer).toContainText(/workmap_snapshot_hash|policy_manifest_hash|selection_result_hash/);
    await expectSingleWorkMapVersion(drawer);
    await page.screenshot({
      path: resolve(OUTPUT_DIR, "fixture-c312-provenance-tab.png"),
      fullPage: true,
    });
    await closeDrawer(page);

    const participantSession = await signInParticipant(request);
    const unauthorized = await request.get(
      `${APP_BASE}/api/eve/official-consultant-control-panel/cases/${fixture.caseId}/activity-selection/${String(
        fixtureParticipant.selectionResultId,
      )}/items/${String(fixtureParticipant.selectionResultItemId)}/conformance`,
      { headers: { Authorization: `Bearer ${participantSession.accessToken}` } },
    );
    expect([401, 403]).toContain(unauthorized.status());

    writeFileSync(
      resolve(OUTPUT_DIR, "conformance-responses.masked.json"),
      JSON.stringify(maskSensitive(telemetry.conformanceResponses), null, 2),
      "utf8",
    );
    writeFileSync(
      resolve(OUTPUT_DIR, "network-summary.masked.json"),
      JSON.stringify(
        maskSensitive({
          serverErrors: telemetry.serverErrors,
          clientErrors: telemetry.clientErrors,
          directInternalTableRequests: telemetry.directInternalTableRequests,
          unauthorizedStatus: unauthorized.status(),
        }),
        null,
        2,
      ),
      "utf8",
    );

    expect(telemetry.serverErrors, "no HTTP 500 responses").toEqual([]);
    expect(telemetry.directInternalTableRequests, "no direct browser SELECT to internal tables").toEqual([]);
    expect(
      telemetry.consoleErrors.filter((item) => !/favicon|warning|Failed to load resource.*(?:400|401|403|404)/i.test(item)),
      "no critical console errors",
    ).toEqual([]);
  });
});

async function signInPanelConsultant(context: BrowserContext, request: APIRequestContext) {
  const response = await request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    headers: {
      apikey: SUPABASE_ANON_KEY!,
      "Content-Type": "application/json",
    },
    data: {
      email: PANEL_EMAIL,
      password: PANEL_PASSWORD,
    },
  });
  expect(response.ok(), "panel consultant auth succeeds").toBe(true);
  const session = (await response.json()) as JsonRecord & {
    access_token: string;
    refresh_token: string;
    expires_in?: number;
    expires_at?: number;
  };
  session.expires_at ??= Math.floor(Date.now() / 1000) + Number(session.expires_in ?? 3600);

  await context.addCookies(await buildOfficialPanelCookies(session));
  await context.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, JSON.stringify(value));
      window.localStorage.setItem("eve-official-panel-auth-token", JSON.stringify(value));
    },
    {
      key: supabaseAuthStorageKey(SUPABASE_URL!),
      value: session,
    },
  );
  return { accessToken: session.access_token };
}

async function signInParticipant(request: APIRequestContext) {
  const response = await request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    headers: {
      apikey: SUPABASE_ANON_KEY!,
      "Content-Type": "application/json",
    },
    data: {
      email: PARTICIPANT_EMAIL,
      password: PARTICIPANT_PASSWORD,
    },
  });
  expect(response.ok(), "participant auth succeeds").toBe(true);
  const session = (await response.json()) as { access_token: string };
  return { accessToken: session.access_token };
}

async function buildOfficialPanelCookies(
  session: JsonRecord & { access_token: string; refresh_token: string },
) {
  const bag: { name: string; value: string; options?: Record<string, unknown> }[] = [];
  const client = createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookieOptions: { name: "eve-official-panel-auth-token" },
    cookies: {
      getAll() {
        return bag.map((item) => ({ name: item.name, value: item.value }));
      },
      setAll(cookiesToSet) {
        for (const cookie of cookiesToSet) {
          const index = bag.findIndex((item) => item.name === cookie.name);
          if (index >= 0) bag[index] = cookie;
          else bag.push(cookie);
        }
      },
    },
  });
  const { error } = await client.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
  expect(error, "official panel SSR session cookie builds").toBeNull();
  return bag.map((cookie) => ({
    name: cookie.name,
    value: cookie.value,
    url: APP_BASE,
    httpOnly: Boolean(cookie.options?.httpOnly),
    secure: Boolean(cookie.options?.secure),
    sameSite: "Lax" as const,
  }));
}

async function requestJson(request: APIRequestContext, url: string, accessToken: string) {
  const response = await request.get(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  expect(response.ok(), `${url} returns OK`).toBe(true);
  return (await response.json()) as JsonRecord;
}

async function resolveCase(
  api: (path: string) => Promise<JsonRecord>,
  companyPattern: RegExp,
  casePattern: RegExp,
) {
  const companiesBody = await api("/api/eve/official-consultant-control-panel/client-companies");
  const companies = asArray(companiesBody.companies ?? companiesBody.items ?? companiesBody);
  const company = companies.map(asRecord).find((item) => companyPattern.test(labelOf(item)));
  expect(company, `${companyPattern} company is visible`).toBeTruthy();
  const companyId = String(company!.id ?? company!.companyId);

  const relationshipsBody = await api(
    `/api/eve/official-consultant-control-panel/client-companies/${companyId}/relationships`,
  );
  const relationships = asArray(
    relationshipsBody.relationships ?? relationshipsBody.items ?? relationshipsBody,
  );
  const relationship = asRecord(relationships[0]);
  const relationshipId = String(relationship.id ?? relationship.relationshipId);

  const casesBody = await api(
    `/api/eve/official-consultant-control-panel/relationships/${relationshipId}/cases`,
  );
  const cases = asArray(casesBody.cases ?? casesBody.items ?? casesBody);
  const targetCase = cases.map(asRecord).find((item) => casePattern.test(labelOf(item)));
  expect(targetCase, `${casePattern} case is visible`).toBeTruthy();
  const caseId = String(targetCase!.id ?? targetCase!.caseId);
  return { companyId, relationshipId, caseId };
}

async function resolveParticipant(
  api: (path: string) => Promise<JsonRecord>,
  caseId: string,
  participantPattern: RegExp,
) {
  const matrixBody = await api(
    `/api/eve/official-consultant-control-panel/cases/${caseId}/user-indicator-matrix`,
  );
  const matrix = asRecord(matrixBody.matrix ?? matrixBody);
  const users = asArray(matrix.users).map(asRecord);
  const participant = users.find((user) =>
    participantPattern.test(String(user.displayName ?? user.name ?? "")),
  );
  expect(participant, `${participantPattern} row is present`).toBeTruthy();
  expect(participant!.eligibleActivityCount).toBe(15);
  expect(participant!.selectedPrimaryCount).toBe(8);
  expect(participant!.nonPrimaryContextCount).toBe(7);
  return participant!;
}

async function resolveActivities(api: (path: string) => Promise<JsonRecord>, caseId: string) {
  const progressBody = await api(
    `/api/eve/official-consultant-control-panel/cases/${caseId}/workmap-progress`,
  );
  const progress = asRecord(progressBody.progress ?? progressBody);
  return asArray(progress.activities).map(asRecord);
}

async function openPanel(
  page: Page,
  input: {
    companyId: string;
    relationshipId: string;
    caseId: string;
    participantId: string;
    profileId: string;
  },
) {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(buildPanelUrl(input), { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-testid="workmap-activity-drilldown"]')).toBeVisible({
    timeout: 60000,
  });
}

async function openActivityDetailBySelection(page: Page, selectionLabel: RegExp) {
  const drilldown = page.locator('[data-testid="workmap-activity-drilldown"]');
  const row = drilldown.locator("tbody tr").filter({ hasText: selectionLabel }).first();
  const detailButton = row.getByRole("button", { name: /Ver detalle/i });
  await expect(detailButton).toHaveAttribute("type", "button");
  await detailButton.click();
  const drawer = page.locator('[data-testid="activity-conformance-drawer"]');
  await expect(drawer).toBeVisible({ timeout: 30000 });
  await expect(drawer).toHaveAttribute("role", "dialog");
  await expect(drawer).toHaveAttribute("aria-modal", "true");
  await expect(drawer).toContainText(/Cargando detalle|Conformidad C3\.12|Detalle no verificable/);
  return detailButton;
}

async function expectFloatingConformanceDrawer(page: Page, drawer: ReturnType<Page["locator"]>) {
  await expect(page.getByRole("button", { name: "Cerrar detalle de actividad" })).toBeVisible();
  await expect(drawer.getByRole("button", { name: "Cerrar" })).toBeFocused();
  const isFloating = await drawer.evaluate((element) => {
    const drawerStyle = window.getComputedStyle(element);
    const overlay = element.parentElement;
    const overlayStyle = overlay ? window.getComputedStyle(overlay) : null;
    const rect = element.getBoundingClientRect();
    return {
      drawerPosition: drawerStyle.position,
      overlayPosition: overlayStyle?.position ?? null,
      bodyOverflow: document.body.style.overflow,
      documentOverflow: document.documentElement.style.overflow,
      rightGap: Math.round(window.innerWidth - rect.right),
      height: Math.round(rect.height),
      viewportHeight: window.innerHeight,
      width: Math.round(rect.width),
      viewportWidth: window.innerWidth,
    };
  });
  expect(isFloating.overlayPosition).toBe("fixed");
  expect(isFloating.drawerPosition).toBe("absolute");
  expect(isFloating.bodyOverflow).toBe("hidden");
  expect(isFloating.documentOverflow).toBe("hidden");
  expect(isFloating.rightGap).toBeLessThanOrEqual(1);
  expect(isFloating.height).toBeGreaterThanOrEqual(isFloating.viewportHeight - 1);
  expect(isFloating.width).toBeGreaterThan(isFloating.viewportWidth * 0.5);
}

async function expectDrawerHasInternalScroll(drawer: ReturnType<Page["locator"]>) {
  const scrollState = await drawer.locator('[data-testid="activity-conformance-drawer-body"]').evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
    overflowY: window.getComputedStyle(element).overflowY,
  }));
  expect(scrollState.overflowY).toMatch(/auto|scroll/);
  expect(scrollState.scrollHeight).toBeGreaterThanOrEqual(scrollState.clientHeight);
}

async function expectInitialSummaryTabOnly(drawer: ReturnType<Page["locator"]>) {
  await expect(drawer.getByRole("tab", { name: "Resumen" })).toHaveAttribute("aria-selected", "true");
  await expect(drawer.getByRole("tab", { name: "Plantilla completa" })).toHaveAttribute("aria-selected", "false");
  await expect(drawer.getByRole("tab", { name: "Procedencia técnica" })).toHaveAttribute("aria-selected", "false");
  await expect(drawer.getByRole("tabpanel")).toContainText(/Resumen/);
  await expect(drawer).not.toContainText(/Selector_Template_v1_3/);
  await expect(drawer).not.toContainText(/activity_id|pmSignalPotential|source_workmap_id/);
}

async function selectConformanceTab(
  drawer: ReturnType<Page["locator"]>,
  tabName: "Resumen" | "Plantilla completa" | "Procedencia técnica",
) {
  await drawer.getByRole("tab", { name: tabName }).click();
  await expect(drawer.getByRole("tab", { name: tabName })).toHaveAttribute("aria-selected", "true");
}

async function expectCompactTableRemainsOperational(page: Page) {
  const drilldown = page.locator('[data-testid="workmap-activity-drilldown"]');
  const headerText = await drilldown.locator("thead").innerText();
  for (const expected of ["Actividad", "Estado", "Elegibilidad", "Selección", "Finding", "Acción"]) {
    expect(headerText).toContain(expected);
  }
  for (const forbidden of SELECTOR_TEMPLATE_V1_3_FIELDS.slice(8)) {
    expect(headerText).not.toContain(forbidden);
  }
}

async function expectSelectorTemplateFields(drawer: ReturnType<Page["locator"]>) {
  await expect(drawer).toContainText(/Plantilla completa/);
  const text = await drawer.innerText();
  for (const field of SELECTOR_TEMPLATE_V1_3_FIELDS) {
    expect(text, `Selector_Template_v1_3 field ${field} is visible`).toContain(field);
  }
}

async function closeDrawer(page: Page) {
  const drawer = page.locator('[data-testid="activity-conformance-drawer"]');
  await drawer.getByRole("button", { name: "Cerrar" }).click();
  await expect(drawer).toBeHidden({ timeout: 10000 });
}

async function expectSingleWorkMapVersion(drawer: ReturnType<Page["locator"]>) {
  const text = await drawer.innerText();
  expect(countMatches(text, "source_workmap_version_id")).toBe(1);
  expect(text).toContain("profile_binding");
}

function countMatches(value: string, needle: string) {
  return value.split(needle).length - 1;
}

function attachNetworkTelemetry(page: Page) {
  const telemetry = {
    serverErrors: [] as string[],
    clientErrors: [] as string[],
    consoleErrors: [] as string[],
    directInternalTableRequests: [] as string[],
    conformanceResponses: [] as { status: number; url: string; body: unknown }[],
  };
  page.on("console", (message) => {
    if (message.type() === "error") telemetry.consoleErrors.push(message.text());
  });
  page.on("response", async (response) => {
    const url = response.url();
    if (response.status() >= 500) telemetry.serverErrors.push(`${response.status()} ${maskIds(url)}`);
    else if (response.status() >= 400) telemetry.clientErrors.push(`${response.status()} ${maskIds(url)}`);
    if (url.includes("/rest/v1/activity_selection_")) {
      telemetry.directInternalTableRequests.push(maskIds(url));
    }
    if (url.includes("/activity-selection/") && url.includes("/conformance")) {
      telemetry.conformanceResponses.push({
        status: response.status(),
        url: maskIds(url),
        body: maskSensitive(await response.json().catch(() => ({}))),
      });
    }
  });
  return telemetry;
}

function buildPanelUrl(input: {
  companyId: string;
  relationshipId: string;
  caseId: string;
  participantId: string;
  profileId: string;
}) {
  const url = new URL("/admin/official-consultant-control-panel", APP_BASE);
  url.searchParams.set("mode", "client-company");
  url.searchParams.set("view", "monitoring");
  url.searchParams.set("company", input.companyId);
  url.searchParams.set("relationship", input.relationshipId);
  url.searchParams.set("case", input.caseId);
  url.searchParams.set("participant_id", input.participantId);
  url.searchParams.set("profile_id", input.profileId);
  return url.toString();
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" ? (value as JsonRecord) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function labelOf(value: JsonRecord) {
  return String(value.name ?? value.label ?? value.displayName ?? value.title ?? "");
}

function supabaseAuthStorageKey(supabaseUrl: string): string {
  const hostname = new URL(supabaseUrl).hostname;
  return `sb-${hostname.split(".")[0]}-auth-token`;
}

function maskSensitive(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(maskSensitive);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as JsonRecord).map(([key, child]) => {
      if (/token|secret|password|key/i.test(key)) return [key, "[masked]"];
      if (typeof child === "string") return [key, maskIds(child)];
      return [key, maskSensitive(child)];
    }),
  );
}

function maskIds(value: string) {
  return value.replace(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
    (match) => `${match.slice(0, 4)}...${match.slice(-4)}`,
  );
}
