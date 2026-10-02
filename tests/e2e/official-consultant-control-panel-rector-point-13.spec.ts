import { test, expect } from "@playwright/test";
import { resolve } from "node:path";
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { authenticateLocalConsultant } from "./helpers/authenticate-local-consultant";

const SHOT_DIR = resolve("reports/local/rector-point-13/screenshots");
const MANIFEST = resolve("reports/local/rector-point-13/manifest.json");
const AMBER_CASE = "19fc9eff-4219-43f0-854c-e2b3350f23f2";
const AMBER_COMPANY = "5c08029f-15e9-4bbd-b13e-0ff4765e23b8";
const AMBER_REL = "7c499a1c-31c6-4fc9-8b20-2fd8cdc57043";

function loadManifest() {
  const r = spawnSync(
    "node",
    [
      "--env-file=.env.local",
      "scripts/eve/official-control-panel/seed-point13-manual-work-test.mjs",
    ],
    { encoding: "utf8", shell: true },
  );
  if (r.status !== 0) {
    throw new Error(`seed_failed:${r.stderr || r.stdout}`);
  }
  return JSON.parse(readFileSync(MANIFEST, "utf8"));
}

function resolveServiceRoleKey(): string {
  const fromEnv = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (fromEnv) return fromEnv;
  const status = spawnSync("npx", ["supabase", "status", "-o", "env"], {
    encoding: "utf8",
    shell: true,
  });
  const m = /SERVICE_ROLE_KEY=(.+)/.exec(
    `${status.stdout || ""}\n${status.stderr || ""}`,
  );
  if (!m) throw new Error("missing_service_role_key");
  return m[1].trim().replace(/^"|"$/g, "");
}

test.describe("Rector Point 13 — corrected manual tracking", () => {
  test.setTimeout(180_000);

  test.beforeAll(() => {
    mkdirSync(SHOT_DIR, { recursive: true });
    loadManifest();
  });

  test("Amber vacío + opval escenarios + A/B + capturas", async ({
    page,
    context,
    request,
    browser,
  }) => {
    const manifest = loadManifest();

    // Amber empty
    await authenticateLocalConsultant(context, request);
    await page.goto(
      `/admin/official-consultant-control-panel?mode=client-company&view=tracking` +
        `&company=${AMBER_COMPANY}&relationship=${AMBER_REL}&case=${AMBER_CASE}`,
    );
    await expect(page.getByTestId("manual-work-panel")).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByTestId("manual-process-P-SUP-03")).toContainText(
      "Sin registros",
    );
    await page.screenshot({
      path: resolve(SHOT_DIR, "01-amber-seguimiento-vacio.png"),
      fullPage: true,
    });

    // Operational case as Consultant A
    await context.clearCookies();
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    const reqA = ctxA.request;
    await authenticateLocalConsultant(ctxA, reqA, {
      email: manifest.consultants.a.email,
    });
    await pageA.goto(manifest.trackingUrl);
    await expect(pageA.getByTestId("manual-work-panel")).toBeVisible({
      timeout: 60_000,
    });
    await expect(pageA.getByTestId("manual-process-P-SUP-03")).toBeVisible();
    await expect(pageA.getByTestId("manual-process-P-SUP-04")).toBeVisible();
    await expect(pageA.getByTestId("manual-process-P-SUP-05")).toBeVisible();
    await pageA.screenshot({
      path: resolve(SHOT_DIR, "02-procesos-manuales-p-sup-03-05.png"),
      fullPage: true,
    });

    const item03 = pageA.getByTestId(
      `manual-work-item-${manifest.workItems["P-SUP-03"]}`,
    );
    await expect(item03).toHaveAttribute("data-tracking-status", "in_manual_work");
    await item03.scrollIntoViewIfNeeded();
    await pageA.screenshot({
      path: resolve(SHOT_DIR, "03-work-item-en-curso.png"),
      fullPage: true,
    });

    const item04 = pageA.getByTestId(
      `manual-work-item-${manifest.workItems["P-SUP-04"]}`,
    );
    await expect(item04).toHaveAttribute("data-handoff-status", "pending");
    await item04.scrollIntoViewIfNeeded();
    await pageA.screenshot({
      path: resolve(SHOT_DIR, "04-handoff-pendiente.png"),
      fullPage: true,
    });

    const item05 = pageA.getByTestId(
      `manual-work-item-${manifest.workItems["P-SUP-05"]}`,
    );
    await expect(item05.getByTestId("manual-handoff-overdue")).toBeVisible();
    await item05.scrollIntoViewIfNeeded();
    await pageA.screenshot({
      path: resolve(SHOT_DIR, "05-handoff-vencido.png"),
      fullPage: true,
    });

    await expect(
      pageA.getByTestId(`manual-timeline-${manifest.workItems["P-SUP-03"]}`),
    ).toContainText("→");
    await pageA
      .getByTestId(`manual-timeline-${manifest.workItems["P-SUP-03"]}`)
      .scrollIntoViewIfNeeded();
    await pageA.screenshot({
      path: resolve(SHOT_DIR, "06-linea-temporal.png"),
      fullPage: true,
    });

    await pageA.getByRole("button", { name: /Abrir panel contextual/i }).click();
    await expect(
      pageA.getByTestId("attention-manual-handoff-overdue"),
    ).toContainText("P-SUP-05");
    await pageA.screenshot({
      path: resolve(SHOT_DIR, "07-atencion-contextual.png"),
      fullPage: true,
    });

    // Accept handoff on P-SUP-05 via producer RPC → alerta desaparece
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = resolveServiceRoleKey();
    const adminClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: acceptErr } = await adminClient.rpc(
      "eve_apply_manual_work_transition",
      {
        p_work_item_id: manifest.workItems["P-SUP-05"],
        p_after_status: "accepted",
        p_actor_label: "point13_e2e_producer",
        p_event_type: "output_accepted",
        p_acceptance_result_ref: "result://p-sup-05/accepted",
        p_after_handoff_status: "accepted",
        p_artifact_ref: "artifact://p-sup-05/v1",
      },
    );
    expect(acceptErr).toBeNull();
    await pageA.reload();
    await expect(pageA.getByTestId("manual-work-panel")).toBeVisible({
      timeout: 60_000,
    });
    await expect(
      pageA
        .getByTestId(`manual-work-item-${manifest.workItems["P-SUP-05"]}`)
        .getByTestId("manual-handoff-overdue"),
    ).toHaveCount(0);
    await pageA.screenshot({
      path: resolve(SHOT_DIR, "12-handoff-aceptado-sin-alerta.png"),
      fullPage: true,
    });

    // Invalid id normalized
    await pageA.goto(`${manifest.trackingUrl}&manual_work_item=not-a-uuid`);
    await expect(pageA).not.toHaveURL(/manual_work_item=not-a-uuid/);

    // Refresh / back-forward
    await pageA.goto(manifest.trackingUrl, { waitUntil: "domcontentloaded" });
    await pageA.reload({ waitUntil: "domcontentloaded" });
    await expect(pageA.getByTestId("manual-work-panel")).toBeVisible({
      timeout: 60_000,
    });
    await pageA.goBack({ waitUntil: "domcontentloaded" }).catch(() => undefined);
    await pageA.goForward({ waitUntil: "domcontentloaded" }).catch(() => undefined);
    await expect(pageA.getByTestId("manual-work-panel")).toBeVisible({
      timeout: 60_000,
    });

    await pageA.setViewportSize({ width: 1440, height: 900 });
    await pageA.screenshot({
      path: resolve(SHOT_DIR, "09-desktop.png"),
      fullPage: true,
    });
    await pageA.setViewportSize({ width: 834, height: 1112 });
    await pageA.screenshot({
      path: resolve(SHOT_DIR, "10-tablet.png"),
      fullPage: true,
    });
    await pageA.setViewportSize({ width: 390, height: 844 });
    await pageA.screenshot({
      path: resolve(SHOT_DIR, "11-mobile.png"),
      fullPage: true,
    });
    await ctxA.close();

    // Consultant B denied (authenticated; not an anonymous 401 substitute)
    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    const authB = await authenticateLocalConsultant(ctxB, ctxB.request, {
      email: manifest.consultants.b.email,
    });
    const bff = await ctxB.request.get(
      `/api/eve/official-consultant-control-panel/cases/${manifest.caseId}/manual-work`,
      {
        headers: { Authorization: `Bearer ${authB.accessToken}` },
      },
    );
    expect(bff.status()).toBe(403);
    const bffBody = await bff.json();
    expect(JSON.stringify(bffBody)).not.toContain(manifest.workItems["P-SUP-03"]);
    await pageB.goto(manifest.trackingUrl);
    // Should not expose work items of A
    await expect(
      pageB.getByTestId(`manual-work-item-${manifest.workItems["P-SUP-03"]}`),
    ).toHaveCount(0);
    await pageB.screenshot({
      path: resolve(SHOT_DIR, "08-consultor-b-denegado.png"),
      fullPage: true,
    });

    // PostgREST isolation for B
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const loginB = await request.post(
      `${url}/auth/v1/token?grant_type=password`,
      {
        headers: { apikey: anon, "Content-Type": "application/json" },
        data: {
          email: manifest.consultants.b.email,
          password: process.env.EVE_UNIT2B_TEST_PASSWORD,
        },
      },
    );
    expect(loginB.ok()).toBeTruthy();
    const sessionB = await loginB.json();
    const rest = await request.get(
      `${url}/rest/v1/manual_process_work_item?case_id=eq.${manifest.caseId}&select=id`,
      {
        headers: {
          apikey: anon,
          Authorization: `Bearer ${sessionB.access_token}`,
        },
      },
    );
    expect(rest.ok()).toBeTruthy();
    const rows = await rest.json();
    expect(Array.isArray(rows) && rows.length === 0).toBeTruthy();
    await ctxB.close();
  });
});
