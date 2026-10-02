import { test, expect } from "@playwright/test";
import { resolve } from "node:path";
import { mkdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { authenticateLocalConsultant } from "./helpers/authenticate-local-consultant";

const SHOT_DIR = resolve("reports/local/rector-point-14/screenshots");
const MANIFEST = resolve("reports/local/rector-point-14/manifest.json");
const AMBER_CASE = "19fc9eff-4219-43f0-854c-e2b3350f23f2";
const AMBER_COMPANY = "5c08029f-15e9-4bbd-b13e-0ff4765e23b8";
const AMBER_REL = "7c499a1c-31c6-4fc9-8b20-2fd8cdc57043";

function loadManifest() {
  const r = spawnSync(
    "node",
    [
      "--env-file=.env.local",
      "scripts/eve/official-control-panel/seed-point14-parallel-production-test.mjs",
    ],
    { encoding: "utf8", shell: true },
  );
  if (r.status !== 0) {
    throw new Error(`seed_failed:${r.stderr || r.stdout}`);
  }
  return JSON.parse(readFileSync(MANIFEST, "utf8"));
}

test.describe("Rector Point 14 — Parallel Production & QA", () => {
  test.setTimeout(180_000);

  test.beforeAll(() => {
    mkdirSync(SHOT_DIR, { recursive: true });
    loadManifest();
  });

  test("Amber vacío + opval findings/satisfied + A/B + capturas", async ({
    page,
    context,
    request,
    browser,
  }) => {
    const manifest = loadManifest();

    await authenticateLocalConsultant(context, request);
    await page.goto(
      `/admin/official-consultant-control-panel?mode=client-company&view=monitoring` +
        `&company=${AMBER_COMPANY}&relationship=${AMBER_REL}&case=${AMBER_CASE}`,
    );
    await expect(page.getByTestId("parallel-production-panel")).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByTestId("parallel-production-empty")).toBeVisible();
    await page.screenshot({
      path: resolve(SHOT_DIR, "01-amber-produccion-paralela-vacia.png"),
      fullPage: true,
    });

    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    const authA = await authenticateLocalConsultant(ctxA, ctxA.request, {
      email: manifest.consultants.a.email,
    });

    await pageA.goto(manifest.monitoringFindingsUrl);
    await expect(pageA.getByTestId("parallel-production-panel")).toBeVisible({
      timeout: 60_000,
    });
    await expect(
      pageA.getByTestId(`parallel-package-${manifest.packageFindingsId}`),
    ).toHaveAttribute("data-package-status", "in_rework");
    await pageA.screenshot({
      path: resolve(SHOT_DIR, "02-paquete-en-proceso.png"),
      fullPage: true,
    });

    await pageA.getByTestId("parallel-layer-candidates").scrollIntoViewIfNeeded();
    await pageA.screenshot({
      path: resolve(SHOT_DIR, "03-candidatos-y-hechos.png"),
      fullPage: true,
    });
    await pageA.getByTestId("parallel-layer-registries").scrollIntoViewIfNeeded();
    await pageA.screenshot({
      path: resolve(SHOT_DIR, "04-registros-e-ir.png"),
      fullPage: true,
    });
    await pageA.getByTestId("parallel-production-qa").scrollIntoViewIfNeeded();
    await pageA.screenshot({
      path: resolve(SHOT_DIR, "05-conformance.png"),
      fullPage: true,
    });
    await pageA.screenshot({
      path: resolve(SHOT_DIR, "06-consistency.png"),
      fullPage: true,
    });
    await pageA.getByTestId("parallel-findings-open").scrollIntoViewIfNeeded();
    await pageA.screenshot({
      path: resolve(SHOT_DIR, "07-findings.png"),
      fullPage: true,
    });
    await expect(pageA.getByTestId("parallel-b3-check")).toContainText(
      "Excepción abierta",
    );
    await pageA.screenshot({
      path: resolve(SHOT_DIR, "08-b3-route-exception.png"),
      fullPage: true,
    });
    await expect(pageA.getByTestId("parallel-b7-check")).toContainText(
      "Violación abierta",
    );
    await pageA.screenshot({
      path: resolve(SHOT_DIR, "09-b7-boundary-violation.png"),
      fullPage: true,
    });
    await expect(pageA.getByTestId("parallel-rework-target")).toContainText(
      "P-SUP-06",
    );
    await pageA.screenshot({
      path: resolve(SHOT_DIR, "10-rework-p-sup-06.png"),
      fullPage: true,
    });
    await expect(
      pageA.getByTestId(`parallel-finding-${manifest.findingIds.rework}`),
    ).toHaveAttribute("data-finding-status", "resolved");
    await expect(pageA.getByTestId("parallel-export-blocked")).toBeVisible();
    await pageA.screenshot({
      path: resolve(SHOT_DIR, "13-export-bloqueada.png"),
      fullPage: true,
    });

    await pageA.goto(manifest.monitoringFindingsUrl, {
      waitUntil: "domcontentloaded",
    });
    await pageA.reload({ waitUntil: "domcontentloaded" });
    await expect(pageA.getByTestId("parallel-production-panel")).toBeVisible({
      timeout: 60_000,
    });
    await pageA.goBack({ waitUntil: "domcontentloaded" }).catch(() => undefined);
    await pageA.goForward({ waitUntil: "domcontentloaded" }).catch(() => undefined);
    await pageA.goto(manifest.monitoringFindingsUrl, {
      waitUntil: "domcontentloaded",
    });
    await expect(pageA.getByTestId("parallel-production-panel")).toBeVisible({
      timeout: 60_000,
    });

    await pageA.getByRole("button", { name: /Abrir panel contextual/i }).click();
    await expect(
      pageA.getByTestId("attention-pp-qa_with_findings"),
    ).toBeVisible();
    await pageA.getByRole("button", { name: /Cerrar/i }).click().catch(() => undefined);

    await pageA.goto(manifest.monitoringSatisfiedUrl);
    await expect(
      pageA.getByTestId(`parallel-package-${manifest.packageSatisfiedId}`),
    ).toHaveAttribute("data-aca-status", "Satisfied");
    await pageA.screenshot({
      path: resolve(SHOT_DIR, "11-qa-satisfied.png"),
      fullPage: true,
    });
    await expect(
      pageA.getByTestId("parallel-export-generator-unavailable"),
    ).toBeVisible();
    await pageA.screenshot({
      path: resolve(SHOT_DIR, "12-export-elegible.png"),
      fullPage: true,
    });

    await pageA.setViewportSize({ width: 1440, height: 900 });
    await pageA.screenshot({
      path: resolve(SHOT_DIR, "15-desktop.png"),
      fullPage: true,
    });
    await pageA.setViewportSize({ width: 834, height: 1112 });
    await pageA.screenshot({
      path: resolve(SHOT_DIR, "16-tablet.png"),
      fullPage: true,
    });
    await pageA.setViewportSize({ width: 390, height: 844 });
    await pageA.screenshot({
      path: resolve(SHOT_DIR, "17-mobile.png"),
      fullPage: true,
    });
    await ctxA.close();

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    const authB = await authenticateLocalConsultant(ctxB, ctxB.request, {
      email: manifest.consultants.b.email,
    });
    const bff = await ctxB.request.get(
      `/api/eve/official-consultant-control-panel/cases/${manifest.caseFindingsId}/parallel-production`,
      { headers: { Authorization: `Bearer ${authB.accessToken}` } },
    );
    expect(bff.status()).toBe(403);
    await pageB.goto(manifest.monitoringFindingsUrl);
    await expect(
      pageB.getByTestId(`parallel-package-${manifest.packageFindingsId}`),
    ).toHaveCount(0);
    await pageB.screenshot({
      path: resolve(SHOT_DIR, "14-consultor-b-denegado.png"),
      fullPage: true,
    });

    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
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
      `${url}/rest/v1/parallel_production_package?case_id=eq.${manifest.caseFindingsId}&select=id`,
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

    // authenticated cannot mutate
    const mut = await request.post(
      `${url}/rest/v1/rpc/eve_apply_parallel_production_transition`,
      {
        headers: {
          apikey: anon,
          Authorization: `Bearer ${authA.accessToken}`,
          "Content-Type": "application/json",
        },
        data: {
          p_package_id: manifest.packageFindingsId,
          p_after_status: "satisfied",
          p_actor_label: "attacker",
          p_event_type: "qa_satisfied",
        },
      },
    );
    expect(mut.ok()).toBeFalsy();
    await ctxB.close();
  });
});
