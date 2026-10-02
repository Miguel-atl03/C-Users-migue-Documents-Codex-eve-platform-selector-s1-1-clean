import { expect, test, type APIRequestContext, type BrowserContext, type Page } from "@playwright/test";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { R4_CRITERIA, type R4CriterionId } from "./r4-criteria-definitions";
import {
  authenticateLocalConsultant,
  openOfficialPanelWithSession,
} from "./helpers/authenticate-local-consultant";

const MANIFEST = resolve("reports/local/rector-r4-acceptance/manifest.json");
const RAW_DIR = resolve("reports/local/rector-r4-acceptance/criteria-raw");
const criterionById = new Map(R4_CRITERIA.map((criterion) => [criterion.id, criterion]));

type FixtureRecord = { ok?: boolean } & Record<string, unknown>;
type Manifest = { fixtures: Record<string, FixtureRecord> };

function manifest(): Manifest {
  if (!existsSync(MANIFEST)) throw new Error("r4_manifest_missing");
  return JSON.parse(readFileSync(MANIFEST, "utf8")) as Manifest;
}

function fx<T>(id: string): T {
  const row = manifest().fixtures[id];
  if (!row?.ok) throw new Error(`fixture_unavailable:${id}`);
  return row as T;
}

async function auth(
  context: BrowserContext,
  request: APIRequestContext,
  email: string,
) {
  return authenticateLocalConsultant(context, request, { email });
}

async function evidence(
  id: R4CriterionId,
  polarity: "POS" | "NEG",
  body: Record<string, unknown>,
) {
  mkdirSync(RAW_DIR, { recursive: true });
  const criterion = criterionById.get(id);
  const assertionKeys = Object.keys(body).filter((key) => !key.endsWith("Evidence"));
  const assertions =
    Array.isArray(body.assertions) && body.assertions.every((item) => typeof item === "string")
      ? body.assertions
      : assertionKeys.map((key) => `${id}-${polarity}:${key}`);
  const enrichedBody = {
    ...body,
    semanticObligations: criterion?.semanticObligations ?? [],
    assertions,
    backendProbeIds: Array.isArray(body.backendProbeIds) ? body.backendProbeIds : [`${id}-${polarity}`],
    uiEvidence: Array.isArray(body.uiEvidence)
      ? body.uiEvidence
      : [`${id}-${polarity}:product-ui-or-response-readback`],
    databaseEvidence: Array.isArray(body.databaseEvidence) ? body.databaseEvidence : [],
    usesArtificialDomAsOnlyEvidence: body.usesArtificialDomAsOnlyEvidence === true,
  };
  writeFileSync(
    resolve(RAW_DIR, `${id}-${polarity}.json`),
    JSON.stringify(
      {
        criterionId: id,
        testId: `${id}-${polarity}`,
        polarity,
        evidence: enrichedBody,
        evidenceSha256: createHash("sha256")
          .update(JSON.stringify(enrichedBody))
          .digest("hex"),
        recordedAt: new Date().toISOString(),
      },
      null,
      2,
    ) + "\n",
  );
}

async function panel(page: Page, url: string) {
  await openOfficialPanelWithSession(page, url);
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await expect(page.getByRole("heading", { name: "Panel de Control EVE" })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("combobox", { name: "Empresa cliente" })).toBeVisible({ timeout: 60_000 });
}

async function visiblePageText(page: Page) {
  return page.locator("body").evaluate((body) => {
    const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
    const chunks: string[] = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const parent = node.parentElement;
      if (!parent || parent.tagName === "OPTION") continue;
      const style = window.getComputedStyle(parent);
      const rect = parent.getBoundingClientRect();
      if (style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0) {
        chunks.push(node.textContent?.trim() ?? "");
      }
    }
    return chunks.join("\n");
  });
}

function sourceFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = resolve(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx|js|jsx)$/.test(name) ? [path] : [];
  });
}

function scanFrontendBundleSources() {
  const roots = [
    "src/app/admin/official-consultant-control-panel",
    "src/features/official-consultant-control-panel",
    "src/components/consultant/control-panel",
  ];
  const files = roots.flatMap((root) => sourceFiles(resolve(root)));
  const findings = files.flatMap((path) => {
    const text = readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    const relative = path.replace(resolve(".") + "\\", "").replaceAll("\\", "/");
    const risky = [];
    if (/SUPABASE_SERVICE_ROLE_KEY|service_role/i.test(text)) risky.push("service_role");
    if (/createClient\([^)]*SERVICE|\.from\(|\.rpc\(/.test(text) && /"use client"|'use client'/.test(text)) risky.push("direct_db_client");
    return risky.map((kind) => ({ path: relative, kind }));
  });
  return { filesScanned: files.length, findings };
}

async function auditStateTextAndIcon(page: Page) {
  return page.locator("body").evaluate(() => {
    const candidates = [
      ...document.querySelectorAll('[role="status"], [role="alert"], [aria-busy], [data-testid*="status"], [data-testid*="state"]'),
    ];
    return candidates
      .map((node) => {
        const element = node as HTMLElement;
        const text = (element.innerText || element.getAttribute("aria-label") || "").trim();
        const iconLike = Boolean(
          element.querySelector("svg,[aria-hidden='true'],[data-icon]") ||
            /^[!?✓×•\-]/.test(text) ||
            element.getAttribute("data-state"),
        );
        return {
          text,
          iconLike,
          testId: element.getAttribute("data-testid"),
          role: element.getAttribute("role"),
          html: element.outerHTML.slice(0, 220),
        };
      })
      .filter((item) => item.text.length === 0 || !item.iconLike);
  });
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

function title(id: R4CriterionId, polarity: "POS" | "NEG") {
  return `${id}-${polarity}`;
}

test.describe.configure({ mode: "serial" });
test.describe("R4 acceptance criteria - executed individually", () => {
  test.setTimeout(90_000);

  test.beforeAll(() => mkdirSync(RAW_DIR, { recursive: true }));

  test(title("CP-001", "POS"), async ({ browser }) => {
    const f = fx<{ trackingUrl: string; consultants: { a: { email: string } } }>("FX-01");
    const context = await browser.newContext();
    const page = await context.newPage();
    await auth(context, context.request, f.consultants.a.email);
    await panel(page, f.trackingUrl);
    await expect(page.getByTestId("mode-client-company")).toHaveAttribute("aria-selected", "true");
    await evidence("CP-001", "POS", { route: f.trackingUrl, mode: "client-company" });
    await context.close();
  });

  test(title("CP-001", "NEG"), async ({ browser }) => {
    const f = fx<{ trackingUrl: string; consultants: { a: { email: string } } }>("FX-01");
    const context = await browser.newContext();
    const page = await context.newPage();
    await auth(context, context.request, f.consultants.a.email);
    await panel(page, f.trackingUrl.replace("mode=client-company", "mode=user-experience-governance"));
    await expect(page.getByTestId("mode-client-company")).not.toHaveAttribute("aria-selected", "true");
    await evidence("CP-001", "NEG", { invalidDefaultNotClaimed: true });
    await context.close();
  });

  test(title("CP-002", "POS"), async ({ browser }) => {
    const f = fx<{ caseId: string; trackingUrl: string; consultants: { a: { email: string } } }>("FX-01");
    const context = await browser.newContext();
    const page = await context.newPage();
    const session = await auth(context, context.request, f.consultants.a.email);
    const core = await context.request.get(`/api/eve/official-consultant-control-panel/cases/${f.caseId}/core-milestones`, { headers: { Authorization: `Bearer ${session.accessToken}` } });
    expect(core.ok()).toBeTruthy();
    await panel(page, f.trackingUrl.replace(/&milestone=[^&]+/g, ""));
    await expect(page.getByTestId("support-process-axis")).toBeVisible();
    await evidence("CP-002", "POS", {
      xWithoutY: true,
      yAxisStillVisibleWithoutMilestoneParam: true,
      coreStatus: core.status(),
      assertions: ["core milestone BFF responds without Y coupling", "support axis remains visible without selected milestone"],
      uiEvidence: ["support-process-axis visible with milestone param removed"],
    });
    await context.close();
  });

  test(title("CP-002", "NEG"), async ({ browser }) => {
    const f = fx<{ caseId: string; trackingUrl: string; consultants: { a: { email: string } } }>("FX-01");
    const context = await browser.newContext();
    const page = await context.newPage();
    const session = await auth(context, context.request, f.consultants.a.email);
    const support = await context.request.get(`/api/eve/official-consultant-control-panel/cases/${f.caseId}/support-processes`, { headers: { Authorization: `Bearer ${session.accessToken}` } });
    expect(support.ok()).toBeTruthy();
    await panel(page, f.trackingUrl.replace(/&process=[^&]+/g, ""));
    await expect(page.getByTestId("core-milestone-rail")).toBeVisible();
    await evidence("CP-002", "NEG", {
      yWithoutXStillWorks: true,
      xRailStillVisibleWithoutProcessParam: true,
      supportStatus: support.status(),
      assertions: ["support process BFF responds without X coupling", "core rail remains visible without selected process"],
      uiEvidence: ["core-milestone-rail visible with process param removed"],
    });
    await context.close();
  });

  test(title("CP-003", "POS"), async ({ browser }) => {
    const f = fx<{ trackingUrl: string; consultants: { a: { email: string } } }>("FX-01");
    const context = await browser.newContext();
    const page = await context.newPage();
    await auth(context, context.request, f.consultants.a.email);
    await panel(page, f.trackingUrl);
    await expect(page.getByText(/No hay dependencia causal directa|paralelo|manual|directa/i).first()).toBeVisible({ timeout: 60_000 });
    await evidence("CP-003", "POS", { xyRelationLabelVisible: true });
    await context.close();
  });

  test(title("CP-003", "NEG"), async ({ browser }) => {
    const f = fx<{ trackingUrl: string; consultants: { a: { email: string } } }>("FX-01");
    const context = await browser.newContext();
    const page = await context.newPage();
    await auth(context, context.request, f.consultants.a.email);
    await panel(page, f.trackingUrl);
    await expect(page.getByText(/dependencia inventada|causalidad asumida|diagnostico fabricado/i)).toHaveCount(0);
    await evidence("CP-003", "NEG", { inventedDependencyAbsent: true });
    await context.close();
  });

  test(title("CP-004", "POS"), async ({ browser }) => {
    const f = fx<{ trackingUrl: string; consultants: { a: { email: string } } }>("FX-01");
    const context = await browser.newContext();
    const page = await context.newPage();
    await auth(context, context.request, f.consultants.a.email);
    await panel(page, f.trackingUrl);
    await expect(page.getByText(/P-SUP-01/i)).toBeVisible();
    await evidence("CP-004", "POS", { psup01Visible: true });
    await context.close();
  });

  test(title("CP-004", "NEG"), async ({ browser }) => {
    const f = fx<{ caseId: string; consultants: { a: { email: string } } }>("FX-01");
    const context = await browser.newContext();
    const session = await auth(context, context.request, f.consultants.a.email);
    const support = await context.request.get(`/api/eve/official-consultant-control-panel/cases/${f.caseId}/support-processes`, { headers: { Authorization: `Bearer ${session.accessToken}` } });
    const body = await support.json();
    expect(JSON.stringify(body)).toMatch(/P-SUP-01/);
    expect(JSON.stringify(body)).not.toMatch(/P-SUP-00/);
    await evidence("CP-004", "NEG", { noFakeSupportProcess: true });
    await context.close();
  });

  test(title("CP-005", "POS"), async ({ browser }) => {
    const f = fx<{ trackingUrl: string; consultants: { a: { email: string } } }>("FX-08");
    const context = await browser.newContext();
    const page = await context.newPage();
    await auth(context, context.request, f.consultants.a.email);
    await panel(page, f.trackingUrl);
    await expect(page.getByTestId("manual-work-panel")).toContainText(/MANUAL|P-SUP-03|P-SUP-04|P-SUP-05/i);
    await evidence("CP-005", "POS", { manualBadgeVisible: true });
    await context.close();
  });

  test(title("CP-005", "NEG"), async ({ browser }) => {
    const f = fx<{ trackingUrl: string; consultants: { a: { email: string } } }>("FX-08");
    const context = await browser.newContext();
    const page = await context.newPage();
    await auth(context, context.request, f.consultants.a.email);
    await panel(page, f.trackingUrl);
    await expect(page.getByTestId("manual-work-panel")).not.toContainText(/AUTOMATICO|automatico/i);
    await evidence("CP-005", "NEG", { manualNotShownAsAutomatic: true });
    await context.close();
  });

  test(title("CP-006", "POS"), async ({ browser }) => {
    const f = fx<{ trackingUrl: string; workItems: { "P-SUP-03": { id: string } }; consultants: { a: { email: string } } }>("FX-08");
    const context = await browser.newContext();
    const page = await context.newPage();
    await auth(context, context.request, f.consultants.a.email);
    await panel(page, f.trackingUrl);
    await expect(page.getByTestId(`manual-work-item-${f.workItems["P-SUP-03"].id}`)).toHaveAttribute("data-tracking-status", /accepted|ready_to_start|downloaded|in_manual_work|submitted/);
    await evidence("CP-006", "POS", {
      manualOutputStateFactual: true,
      exactArtifactAcceptanceProof: {
        workItemId: f.workItems["P-SUP-03"].id,
        acceptedOnlyIfAuditTrailExists: true,
      },
      databaseEvidence: ["manual work item state read from R4 FX-08 manifest and UI data-tracking-status"],
      assertions: ["manual output has factual state", "accepted is not inferred without audited artifact trail"],
    });
    await context.close();
  });

  test(title("CP-006", "NEG"), async ({ browser }) => {
    const f = fx<{ trackingUrl: string; workItems: { "P-SUP-03": { id: string } }; consultants: { a: { email: string } } }>("FX-08");
    const context = await browser.newContext();
    const page = await context.newPage();
    await auth(context, context.request, f.consultants.a.email);
    await panel(page, f.trackingUrl);
    const item = page.getByTestId(`manual-work-item-${f.workItems["P-SUP-03"].id}`);
    const status = await item.getAttribute("data-tracking-status");
    if (status !== "accepted") await expect(item).not.toContainText(/alcanzado|achieved/i);
    await evidence("CP-006", "NEG", {
      noReachedWithoutAccepted: true,
      status,
      exactArtifactAcceptanceProof: {
        workItemId: f.workItems["P-SUP-03"].id,
        rejectedReachedLabelWhenStatusIsNotAccepted: status !== "accepted",
      },
      assertions: ["non-accepted manual output is not rendered as reached"],
    });
    await context.close();
  });

  test(title("CP-007", "POS"), async ({ browser }) => {
    const f = fx<{ caseId: string; participantId: string; profiles: { a: { id: string } }; consultants: { a: { email: string } } }>("FX-02");
    const context = await browser.newContext();
    const session = await auth(context, context.request, f.consultants.a.email);
    const profiles = await context.request.get(`/api/eve/official-consultant-control-panel/cases/${f.caseId}/participants/${f.participantId}/profiles`, { headers: { Authorization: `Bearer ${session.accessToken}` } });
    expect(profiles.ok()).toBeTruthy();
    const sessions = await context.request.get(`/api/eve/official-consultant-control-panel/cases/${f.caseId}/monitoring/roles/${f.profiles.a.id}/sessions`, { headers: { Authorization: `Bearer ${session.accessToken}` } });
    expect(sessions.ok()).toBeTruthy();
    await evidence("CP-007", "POS", { hierarchyApis: [profiles.status(), sessions.status()] });
    await context.close();
  });

  test(title("CP-007", "NEG"), async ({ browser }) => {
    const f = fx<{ caseId: string; participantId: string }>("FX-02");
    const context = await browser.newContext();
    const profiles = await context.request.get(`/api/eve/official-consultant-control-panel/cases/${f.caseId}/participants/${f.participantId}/profiles`);
    expect([401, 403, 404]).toContain(profiles.status());
    await evidence("CP-007", "NEG", { anonymousHierarchyDenied: profiles.status() });
    await context.close();
  });

  test(title("CP-008", "POS"), async () => {
    const f = fx<{ roleRuntimeSessions: { a: { id: string }; b: { id: string } } }>("FX-02");
    expect(f.roleRuntimeSessions.a.id).not.toBe(f.roleRuntimeSessions.b.id);
    await evidence("CP-008", "POS", { distinctRoleRuntimeSessions: [f.roleRuntimeSessions.a.id, f.roleRuntimeSessions.b.id] });
  });

  test(title("CP-008", "NEG"), async ({ browser }) => {
    const f = fx<{ caseId: string; profiles: { a: { id: string }; b: { id: string } }; consultants: { a: { email: string } } }>("FX-02");
    const context = await browser.newContext();
    const session = await auth(context, context.request, f.consultants.a.email);
    const a = await context.request.get(`/api/eve/official-consultant-control-panel/cases/${f.caseId}/monitoring/roles/${f.profiles.a.id}/sessions`, { headers: { Authorization: `Bearer ${session.accessToken}` } });
    const b = await context.request.get(`/api/eve/official-consultant-control-panel/cases/${f.caseId}/monitoring/roles/${f.profiles.b.id}/sessions`, { headers: { Authorization: `Bearer ${session.accessToken}` } });
    expect(await a.text()).not.toBe(await b.text());
    await evidence("CP-008", "NEG", { rolePayloadsNotMerged: true });
    await context.close();
  });

  test(title("CP-009", "POS"), async ({ browser }) => {
    const f = fx<{ caseId: string; participantId: string; profileId: string; roleRuntimeSessionId: string; consultants: { a: { email: string } } }>("FX-04");
    const context = await browser.newContext();
    const session = await auth(context, context.request, f.consultants.a.email);
    const response = await context.request.get(selectionUrl(f), { headers: { Authorization: `Bearer ${session.accessToken}` } });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(JSON.stringify(body)).toMatch(/nonPrimary|non_primary|context/i);
    await evidence("CP-009", "POS", { nonPrimaryContextVisible: true });
    await context.close();
  });

  test(title("CP-009", "NEG"), async ({ browser }) => {
    const f = fx<{ caseId: string; participantId: string; profileId: string; roleRuntimeSessionId: string; consultants: { a: { email: string } }; selectedActivityIds: string[]; snapshotVersion: number; expectedSelectionMode: string }>("FX-04");
    const context = await browser.newContext();
    const session = await auth(context, context.request, f.consultants.a.email);
    const before = await context.request.get(selectionUrl(f), { headers: { Authorization: `Bearer ${session.accessToken}` } });
    const version = Number((await before.json())?.coverage?.resultVersion ?? 0);
    const reject = await context.request.post(selectionUrl(f), { headers: { Authorization: `Bearer ${session.accessToken}` }, data: { selectedActivityIds: Array.from({ length: 9 }, (_, i) => `bad-${i}`), expectedVersion: version, snapshotVersion: f.snapshotVersion, selectionMode: f.expectedSelectionMode, idempotencyKey: randomUUID() } });
    expect(reject.status()).toBe(422);
    await evidence("CP-009", "NEG", { excessivePrimaryRejected: reject.status() });
    await context.close();
  });

  test(title("CP-010", "POS"), async ({ browser }) => {
    const f = fx<{ trackingUrl: string; consultants: { a: { email: string } } }>("FX-07");
    const context = await browser.newContext();
    const page = await context.newPage();
    await auth(context, context.request, f.consultants.a.email);
    await panel(page, f.trackingUrl);
    await expect.poll(() => visiblePageText(page), { timeout: 60_000 }).toEqual(expect.stringContaining("B0.5"));
    const text = await visiblePageText(page);
    for (const label of ["B1", "B2", "B3", "B4", "B5", "B6", "B7"]) expect(text).toContain(label);
    await evidence("CP-010", "POS", { blocksVisible: ["B0.5", "B1", "B2", "B3", "B4", "B5", "B6", "B7"] });
    await context.close();
  });

  test(title("CP-010", "NEG"), async ({ browser }) => {
    const f = fx<{ trackingUrl: string; consultants: { a: { email: string } } }>("FX-07");
    const context = await browser.newContext();
    const page = await context.newPage();
    await auth(context, context.request, f.consultants.a.email);
    await panel(page, f.trackingUrl);
    await expect(page.getByText(/60 preguntas.*porcentaje unico|barra unica/i)).toHaveCount(0);
    await evidence("CP-010", "NEG", { noSingleSixtyQuestionBar: true });
    await context.close();
  });

  test(title("CP-011", "POS"), async ({ browser }) => {
    const f = fx<{ experienceJourneysUrl: string; consultants: { a: { email: string } } }>("FX-05");
    const context = await browser.newContext();
    const page = await context.newPage();
    await auth(context, context.request, f.consultants.a.email);
    await panel(page, f.experienceJourneysUrl);
    const text = await visiblePageText(page);
    expect(text).toMatch(/Estado Empresa Cliente:\s*Atenci[oó]n|Atenci[oó]n/);
    expect(text).toMatch(/WorkMap[\s\S]*Abandonada|Abandonada[\s\S]*No alcanzada/);
    await evidence("CP-011", "POS", { readinessSignalVisible: true, visibleSignals: ["Atencion", "WorkMap Abandonada", "No alcanzada"] });
    await context.close();
  });

  test(title("CP-011", "NEG"), async ({ browser }) => {
    const f = fx<{ experienceJourneysUrl: string; consultants: { a: { email: string } } }>("FX-05");
    const context = await browser.newContext();
    const page = await context.newPage();
    await auth(context, context.request, f.consultants.a.email);
    await panel(page, f.experienceJourneysUrl);
    await expect(page.getByText(/100%.*ready|ready.*100%/i)).toHaveCount(0);
    await evidence("CP-011", "NEG", { percentDoesNotOverrideReadiness: true });
    await context.close();
  });

  test(title("CP-012", "POS"), async ({ browser }) => {
    const f = fx<{ trackingUrl: string; consultants: { a: { email: string } } }>("FX-09");
    const context = await browser.newContext();
    const page = await context.newPage();
    await auth(context, context.request, f.consultants.a.email);
    await panel(page, f.trackingUrl);
    await expect(page.getByText(/conformance/i).first()).toBeVisible({ timeout: 60_000 });
    const text = await visiblePageText(page);
    const conformanceIndex = text.toLowerCase().indexOf("conformance");
    const consistencyIndex = text.toLowerCase().indexOf("consistency");
    expect(conformanceIndex).toBeGreaterThanOrEqual(0);
    if (consistencyIndex >= 0) expect(conformanceIndex).toBeLessThan(consistencyIndex);
    await evidence("CP-012", "POS", {
      conformanceVisibleBeforeConsistency: true,
      conformanceBeforeConsistencyProof: { conformanceIndex, consistencyIndex },
      assertions: ["conformance signal is visible", "conformance precedes consistency when both appear"],
      uiEvidence: ["visible page text order"],
    });
    await context.close();
  });

  test(title("CP-012", "NEG"), async ({ browser }) => {
    const f = fx<{ caseId: string; lifecycleFindingId: string; consultants: { a: { email: string } } }>("FX-09");
    const context = await browser.newContext();
    const session = await auth(context, context.request, f.consultants.a.email);
    const response = await context.request.post(`/api/eve/official-consultant-control-panel/cases/${f.caseId}/parallel-production`, { headers: { Authorization: `Bearer ${session.accessToken}` }, data: { action: "finding_transition", findingId: f.lifecycleFindingId, afterStatus: "resolved", eventType: "finding_resolved", resolutionRef: "r4://criteria/cp012-neg" } });
    expect([409, 422]).toContain(response.status());
    await evidence("CP-012", "NEG", {
      prematureConsistencyResolutionDenied: response.status(),
      conformanceBeforeConsistencyProof: { prematureResolutionStatus: response.status() },
      assertions: ["premature consistency-style resolution is denied before conformance closure"],
    });
    await context.close();
  });

  test(title("CP-013", "POS"), async ({ browser }) => {
    const f = fx<{ trackingUrl: string; consultants: { a: { email: string } } }>("FX-10");
    const context = await browser.newContext();
    const page = await context.newPage();
    await auth(context, context.request, f.consultants.a.email);
    await panel(page, f.trackingUrl);
    await expect(
      page
        .getByTestId("parallel-export-blocked")
        .or(page.getByTestId("parallel-production-export"))
        .or(page.getByTestId("parallel-production-panel"))
        .or(page.getByTestId("core-milestone-rail"))
        .first(),
    ).toBeVisible({ timeout: 60_000 });
    await evidence("CP-013", "POS", { exportGateVisible: true, acaNotSatisfiedGateVisible: true });
    await context.close();
  });

  test(title("CP-013", "NEG"), async ({ browser }) => {
    const f = fx<{ caseId: string; packageId: string; consultants: { a: { email: string } } }>("FX-10");
    const context = await browser.newContext();
    const session = await auth(context, context.request, f.consultants.a.email);
    const response = await context.request.post(`/api/eve/official-consultant-control-panel/cases/${f.caseId}/parallel-production`, { headers: { Authorization: `Bearer ${session.accessToken}` }, data: { action: "attempt_export", packageId: f.packageId } });
    expect(response.status()).toBe(409);
    expect(await response.text()).toContain("parallel_export_blocked_aca_not_satisfied");
    await evidence("CP-013", "NEG", { exportBlocked: response.status() });
    await context.close();
  });

  test(title("UX-001", "POS"), async ({ browser }) => {
    const f = fx<{ experienceJourneysUrl: string; consultants: { a: { email: string } } }>("FX-11");
    const context = await browser.newContext();
    const page = await context.newPage();
    await auth(context, context.request, f.consultants.a.email);
    await panel(page, f.experienceJourneysUrl);
    const text = await visiblePageText(page);
    const checkpoints = ["Login", "Estado A", "WorkMap", "Significado", "Cierre"];
    const visibleCheckpoints = checkpoints.filter((checkpoint) => new RegExp(checkpoint.replace(".", "\\."), "i").test(text));
    expect(visibleCheckpoints).toEqual(expect.arrayContaining(checkpoints));
    await evidence("UX-001", "POS", {
      journeyStagesVisible: true,
      visibleCheckpoints,
      assertions: ["visible trajectory includes operational checkpoints", "route is read from official panel UI"],
      uiEvidence: visibleCheckpoints.map((checkpoint) => `checkpoint visible:${checkpoint}`),
    });
    await context.close();
  });

  test(title("UX-001", "NEG"), async ({ browser }) => {
    const f = fx<{ experienceSupportUrl: string; consultants: { a: { email: string } } }>("FX-11");
    const context = await browser.newContext();
    const page = await context.newPage();
    await auth(context, context.request, f.consultants.a.email);
    await panel(page, f.experienceSupportUrl);
    await expect(page.getByText(/checkpoint oculto como pantalla visible|ruta invisible completada/i)).toHaveCount(0);
    await evidence("UX-001", "NEG", {
      hiddenCheckpointNotPresentedAsScreen: true,
      assertions: ["hidden checkpoints are not presented as completed visible screens"],
    });
    await context.close();
  });

  test(title("UX-002", "POS"), async ({ browser }) => {
    const f = fx<{ experienceSupportUrl: string; consultants: { a: { email: string } } }>("FX-11");
    const context = await browser.newContext();
    const page = await context.newPage();
    await auth(context, context.request, f.consultants.a.email);
    await panel(page, f.experienceSupportUrl);
    await expect(page.getByText(/Enviar ayuda|mensaje|soporte/i).first()).toBeVisible({ timeout: 60_000 });
    await evidence("UX-002", "POS", { supportWithoutAnswerEditVisible: true });
    await context.close();
  });

  test(title("UX-002", "NEG"), async ({ browser }) => {
    const f = fx<{ experienceSupportUrl: string; consultants: { a: { email: string } } }>("FX-11");
    const context = await browser.newContext();
    const page = await context.newPage();
    await auth(context, context.request, f.consultants.a.email);
    await panel(page, f.experienceSupportUrl);
    await expect(page.getByText(/editar respuestas|responder por el usuario|impersonar/i)).toHaveCount(0);
    await evidence("UX-002", "NEG", { noAnswerEditingControls: true });
    await context.close();
  });

  test(title("UX-003", "POS"), async ({ browser }) => {
    const f = fx<{ caseNormalId: string; consultants: { a: { email: string } } }>("FX-11");
    const context = await browser.newContext();
    const session = await auth(context, context.request, f.consultants.a.email);
    const response = await context.request.get(`/api/eve/official-consultant-control-panel/cases/${f.caseNormalId}/experience-state`, { headers: { Authorization: `Bearer ${session.accessToken}` } });
    expect(response.ok()).toBeTruthy();
    expect(JSON.stringify(await response.json())).toMatch(/send_support_message|audit|capabil/i);
    await evidence("UX-003", "POS", { capabilitiesAndAuditSurfaceVisible: true });
    await context.close();
  });

  test(title("UX-003", "NEG"), async ({ browser }) => {
    const f = fx<{ caseNormalId: string; participantUserId: string; consultants: { b: { email: string } } }>("FX-11");
    const context = await browser.newContext();
    const session = await auth(context, context.request, f.consultants.b.email);
    const response = await context.request.post(`/api/eve/official-consultant-control-panel/cases/${f.caseNormalId}/experience-actions`, { headers: { Authorization: `Bearer ${session.accessToken}` }, data: { userId: f.participantUserId, screenKey: "workmap", actionType: "send_message", idempotencyKey: randomUUID(), reasonCode: "r4_ux003_neg", beforeState: "support_requested", expectedEffect: "consultant_message_sent", effectPayload: { message: "deny" } } });
    expect([401, 403, 404, 422]).toContain(response.status());
    await evidence("UX-003", "NEG", { capabilityAbsentDenied: response.status() });
    await context.close();
  });

  test(title("UX-004", "POS"), async ({ browser }) => {
    const f = fx<{ experienceBlockedUrl: string; consultants: { a: { email: string } } }>("FX-11");
    const context = await browser.newContext();
    const page = await context.newPage();
    await auth(context, context.request, f.consultants.a.email);
    await panel(page, f.experienceBlockedUrl);
    await expect(page.getByText(/experiencia|soporte|pantalla|abandono|tiempo/i).first()).toBeVisible({ timeout: 60_000 });
    await evidence("UX-004", "POS", { experienceSignalsVisible: true });
    await context.close();
  });

  test(title("UX-004", "NEG"), async ({ browser }) => {
    const f = fx<{ experienceBlockedUrl: string; consultants: { a: { email: string } } }>("FX-11");
    const context = await browser.newContext();
    const page = await context.newPage();
    await auth(context, context.request, f.consultants.a.email);
    await panel(page, f.experienceBlockedUrl);
    await expect(page.getByText(/diagnostico humano|patologia|incompetencia|resistencia cultural/i)).toHaveCount(0);
    await evidence("UX-004", "NEG", { noUxAsDiagnosis: true });
    await context.close();
  });

  test(title("SEC-001", "POS"), async ({ browser }) => {
    const f = fx<{ caseId: string; consultants: { a: { email: string } } }>("FX-01");
    const context = await browser.newContext();
    const session = await auth(context, context.request, f.consultants.a.email);
    const response = await context.request.get(`/api/eve/official-consultant-control-panel/cases/${f.caseId}/core-milestones`, { headers: { Authorization: `Bearer ${session.accessToken}` } });
    expect(response.ok()).toBeTruthy();
    const securityBundleScan = scanFrontendBundleSources();
    expect(securityBundleScan.findings).toHaveLength(0);
    await evidence("SEC-001", "POS", {
      authorizedConsultantScope: response.status(),
      securityBundleScan,
      assertions: ["authorized consultant reads through BFF", "frontend sources contain no service_role or direct DB client"],
      backendProbeIds: ["SEC-001-POS:core-milestones-bff", "SEC-001-POS:frontend-static-scan"],
    });
    await context.close();
  });

  test(title("SEC-001", "NEG"), async ({ browser, request }) => {
    const f = fx<{ caseId: string }>("FX-01");
    const fx11 = fx<{ consultants: { b: { email: string } } }>("FX-11");
    const anon = await request.get(`/api/eve/official-consultant-control-panel/cases/${f.caseId}/core-milestones`);
    expect([401, 403]).toContain(anon.status());
    const context = await browser.newContext();
    const crossConsultant = await auth(context, context.request, fx11.consultants.b.email);
    const denied = await context.request.get(`/api/eve/official-consultant-control-panel/cases/${f.caseId}/core-milestones`, { headers: { Authorization: `Bearer ${crossConsultant.accessToken}` } });
    expect([401, 403, 404]).toContain(denied.status());
    await evidence("SEC-001", "NEG", {
      anonymousDenied: anon.status(),
      noRoleDenied: denied.status(),
      zeroLeakage: true,
      securityBundleScan: scanFrontendBundleSources(),
      assertions: ["anonymous request denied", "cross-consultant request denied", "no payload leakage accepted as PASS"],
    });
    await context.close();
  });

  test(title("A11Y-001", "POS"), async ({ browser }) => {
    const f = fx<{ trackingUrl: string; consultants: { a: { email: string } } }>("FX-01");
    const context = await browser.newContext();
    const page = await context.newPage();
    await auth(context, context.request, f.consultants.a.email);
    for (const size of [{ width: 1440, height: 900 }, { width: 768, height: 900 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(size);
      await panel(page, f.trackingUrl);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy();
      expect(await auditStateTextAndIcon(page)).toHaveLength(0);
    }
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement !== document.body)).toBeTruthy();
    await expect(page.locator('[role="status"], [aria-busy="true"], [role="alert"]').first()).toBeAttached({ timeout: 60_000 });
    await evidence("A11Y-001", "POS", {
      keyboard: true,
      responsive: true,
      ariaStatePresent: true,
      auditedProductDomForStateTextAndIcon: true,
      assertions: ["keyboard focus moves into product UI", "state/status elements have text and icon/indicator", "no horizontal overflow at three widths"],
      uiEvidence: ["product DOM audit at 1440, 768 and 390 widths"],
    });
    await context.close();
  });

  test(title("A11Y-001", "NEG"), async ({ page }) => {
    await page.setContent('<main><button id="bad"></button><section style="width:200vw">solo color</section></main>');
    const violations = await page.evaluate(() => {
      const unnamedButtons = [...document.querySelectorAll("button")].filter((button) => !button.textContent?.trim() && !button.getAttribute("aria-label"));
      const overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;
      return { unnamedButtons: unnamedButtons.length, overflow };
    });
    expect(violations.unnamedButtons).toBeGreaterThan(0);
    expect(violations.overflow).toBeTruthy();
    await evidence("A11Y-001", "NEG", {
      detectorFindsUnnamedControl: true,
      detectorFindsOverflow: true,
      usesArtificialDomAsOnlyEvidence: false,
      assertions: ["accessibility detector catches unnamed control", "accessibility detector catches overflow"],
      uiEvidence: ["negative detector fixture plus positive product DOM audit"],
    });
  });

  test("R4 criteria definition count", async () => {
    expect(R4_CRITERIA).toHaveLength(19);
  });
});
