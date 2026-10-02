import { expect, test, type APIRequestContext } from "@playwright/test";
import { createServerClient } from "@supabase/ssr";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const APP_BASE = process.env.EVE_BASE_URL ?? "http://127.0.0.1:3103";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const PANEL_EMAIL = process.env.NEXT_PUBLIC_EVE_PANEL_ACCESS_EMAIL;
const PANEL_PASSWORD = process.env.EVE_UNIT2B_TEST_PASSWORD;
const OUTPUT_DIR = resolve(".tmp", "c3103-panel-render");
const OFFICIAL_PANEL_AUTH_COOKIE_NAME = "eve-official-panel-auth-token";

type JsonRecord = Record<string, unknown>;

test.describe("C3.10.3 panel canonical render", () => {
  test.setTimeout(120000);

  test.skip(
    !SUPABASE_URL || !SUPABASE_ANON_KEY || !PANEL_EMAIL || !PANEL_PASSWORD,
    "staging_panel_environment_missing",
  );

  test("renders Gaby canonical selection and prepared runtime without rerunning WorkMap", async ({
    context,
    page,
    request,
  }) => {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    const session = await signInPanelConsultant(request);
    await context.addCookies(await buildOfficialPanelCookies(session));
    await context.addInitScript(
      ({ key, value }) => {
        window.localStorage.setItem(key, JSON.stringify(value));
        window.localStorage.setItem(
          "eve-official-panel-auth-token",
          JSON.stringify(value),
        );
      },
      {
        key: supabaseAuthStorageKey(SUPABASE_URL!),
        value: session,
      },
    );

    const api = (path: string) =>
      requestJson(request, `${APP_BASE}${path}`, session.access_token);

    const { companyId, relationshipId, caseId } = await resolveOrganimueblesCase(api);
    const matrixBody = await api(
      `/api/eve/official-consultant-control-panel/cases/${caseId}/user-indicator-matrix`,
    );
    const progressBody = await api(
      `/api/eve/official-consultant-control-panel/cases/${caseId}/workmap-progress`,
    );
    const matrix = asRecord(matrixBody.matrix ?? matrixBody);
    const progress = asRecord(progressBody.progress ?? progressBody);
    const users = asArray(matrix.users);
    const gaby = users.find((user) =>
      /Gaby Johnson/i.test(String(asRecord(user).displayName ?? "")),
    );
    expect(gaby, "Gaby row is present in user-indicator-matrix").toBeTruthy();
    const gabyRow = asRecord(gaby);

    expect(gabyRow.eligibleActivityCount).toBe(15);
    expect(gabyRow.selectedPrimaryCount).toBe(8);
    expect(gabyRow.nonPrimaryContextCount).toBe(7);
    expect(gabyRow.selectionPolicyVersion).toBe(
      "PRIMARY_ACTIVITY_SELECTION_V1_3",
    );
    expect(gabyRow.preparedRuntimeSessionCount).toBe(1);
    expect(gabyRow.preparedRuntimeRunCount).toBe(8);
    expect(gabyRow.startedRuntimeRunCount).toBe(0);

    const activities = asArray(progress.activities);
    const primaryActivities = activities
      .map(asRecord)
      .filter((activity) => activity.classification === "primary");
    const nonPrimaryActivities = activities
      .map(asRecord)
      .filter((activity) => activity.classification === "non-primary");

    expect(primaryActivities).toHaveLength(8);
    expect(nonPrimaryActivities).toHaveLength(7);
    for (const activity of primaryActivities) {
      expect(activity.state).toBe("runtime_prepared");
      expect(activity.runtimeRunId).toBeTruthy();
      expect(activity.effectiveSelection).toBe(true);
    }
    for (const activity of nonPrimaryActivities) {
      expect(activity.state).toBe("selected_non_primary");
      expect(activity.runtimeRunId ?? null).toBeNull();
    }
    expect(JSON.stringify(progress)).not.toMatch(
      /Esperando selección efectiva|Elegibilidad pendiente|Selección pendiente/,
    );

    writeFileSync(
      resolve(OUTPUT_DIR, "user-indicator-matrix.masked.json"),
      JSON.stringify(maskSensitive(matrixBody), null, 2),
      "utf8",
    );
    writeFileSync(
      resolve(OUTPUT_DIR, "workmap-progress.masked.json"),
      JSON.stringify(maskSensitive(progressBody), null, 2),
      "utf8",
    );

    const participantId = String(gabyRow.participantId);
    const profileId = String(gabyRow.functionalProfileId);
    const panelPath =
      `/admin/official-consultant-control-panel?mode=client-company&view=monitoring` +
      `&company=${companyId}&relationship=${relationshipId}&case=${caseId}` +
      `&participant_id=${participantId}&profile_id=${profileId}`;
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.goto(panelPath, { waitUntil: "domcontentloaded" });

    await expect(page.locator('[data-testid="user-indicator-matrix"]')).toBeVisible({
      timeout: 60000,
    });
    await expect(page.locator('[data-testid="participants-monitoring-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="workmap-activity-drilldown"]')).toBeVisible({
      timeout: 60000,
    });

    const matrixPanel = page.locator('[data-testid="user-indicator-matrix"]');
    await expect(matrixPanel).toContainText("Elegibles");
    await expect(matrixPanel).toContainText("Primarias");
    await expect(matrixPanel).toContainText("No primarias");
    await expect(matrixPanel).toContainText("15");
    await expect(matrixPanel).toContainText("8");
    await expect(matrixPanel).toContainText("7");
    await expect(matrixPanel).toContainText("Sesiones Runtime preparadas");
    await expect(matrixPanel).toContainText("Runs preparados");
    await expect(matrixPanel).toContainText("Runtime en ejecución");

    const participantsTable = page.locator(
      '[data-testid="participants-monitoring-table"]',
    );
    await expect(participantsTable).toContainText("Gaby Johnson");
    await expect(participantsTable).toContainText("Elegibles");
    await expect(participantsTable).toContainText("Primarias");
    await expect(participantsTable).toContainText("No primarias");
    await expect(participantsTable).toContainText("Selección efectiva");
    await expect(participantsTable).toContainText("PRIMARY_ACTIVITY_SELECTION_V1_3");

    const drilldown = page.locator('[data-testid="workmap-activity-drilldown"]');
    await expect(drilldown).toContainText("Elegible");
    await expect(drilldown).toContainText("Runtime preparado");
    await expect(drilldown).toContainText("Contexto no primario");
    await expect(drilldown).not.toContainText("Esperando selección efectiva");
    await expect(drilldown).not.toContainText(/\btrue\b/);

    await page.screenshot({
      path: resolve(OUTPUT_DIR, "panel-canonical-render.png"),
      fullPage: true,
    });
  });
});

async function signInPanelConsultant(request: APIRequestContext) {
  const response = await request.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY!,
        "Content-Type": "application/json",
      },
      data: {
        email: PANEL_EMAIL,
        password: PANEL_PASSWORD,
      },
    },
  );
  expect(response.ok(), "panel consultant auth succeeds").toBe(true);
  const session = (await response.json()) as JsonRecord;
  session.expires_at ??=
    Math.floor(Date.now() / 1000) + Number(session.expires_in ?? 3600);
  return session as JsonRecord & { access_token: string };
}

async function buildOfficialPanelCookies(
  session: JsonRecord & { access_token: string },
) {
  const bag: {
    name: string;
    value: string;
    options?: Record<string, unknown>;
  }[] = [];
  const client = createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookieOptions: {
      name: OFFICIAL_PANEL_AUTH_COOKIE_NAME,
    },
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
    refresh_token: String(session.refresh_token ?? ""),
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

async function requestJson(
  request: APIRequestContext,
  url: string,
  accessToken: string,
) {
  const response = await request.get(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  expect(response.ok(), `${url} returns OK`).toBe(true);
  return (await response.json()) as JsonRecord;
}

async function resolveOrganimueblesCase(
  api: (path: string) => Promise<JsonRecord>,
) {
  const companiesBody = await api(
    "/api/eve/official-consultant-control-panel/client-companies",
  );
  const companies = asArray(companiesBody.companies ?? companiesBody.items ?? companiesBody);
  const company = companies.map(asRecord).find((item) =>
    /Organimuebles/i.test(labelOf(item)),
  );
  expect(company, "Organimuebles company is visible").toBeTruthy();
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
  const targetCase =
    cases.map(asRecord).find((item) =>
      /Organimuebles|Pedido mixto/i.test(labelOf(item)),
    ) ?? asRecord(cases[0]);
  expect(targetCase, "Organimuebles case is visible").toBeTruthy();
  const caseId = String(targetCase.id ?? targetCase.caseId);
  return { companyId, relationshipId, caseId };
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
  if (!value || typeof value !== "object") {
    if (typeof value === "string") return maskString(value);
    return value;
  }
  return Object.fromEntries(
    Object.entries(value as JsonRecord).map(([key, child]) => {
      if (/token|secret|password|key/i.test(key)) return [key, "[masked]"];
      return [key, maskSensitive(child)];
    }),
  );
}

function maskString(value: string) {
  return value.replace(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
    (match) => `${match.slice(0, 4)}...${match.slice(-4)}`,
  );
}
