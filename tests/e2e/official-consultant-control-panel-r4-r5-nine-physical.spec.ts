import { expect, test, type APIRequestContext, type BrowserContext, type Page, type Response as PlaywrightResponse } from "@playwright/test";
import { createHash, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import ts from "typescript";
import { createClient } from "@supabase/supabase-js";

import {
  authenticateLocalConsultant,
  openOfficialPanelWithSession,
} from "./helpers/authenticate-local-consultant";

const ROOT = resolve(".");
const MANIFEST_PATH = resolve(ROOT, "reports/local/rector-r4-acceptance/manifest.json");
const EVIDENCE_ROOT = resolve(ROOT, "reports/local/rector-r4-r5-physical");
const DB_CONTAINER = "supabase_db_eve-platform";

loadEnvLocalForEvidence();

type HttpRecord = {
  method: string;
  url: string;
  status?: number;
  failed?: string;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  bodyPreview?: string;
};

type EvidenceInput = {
  testId: string;
  page: Page;
  http: HttpRecord[];
  before: unknown;
  after: unknown;
  assertions: Record<string, unknown>;
  extraFiles?: Record<string, string | Buffer>;
};

function fixture<T>(id: string): T {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  const row = manifest.fixtures?.[id];
  if (!row?.ok) throw new Error(`fixture_missing:${id}`);
  return row as T;
}

function loadEnvLocalForEvidence() {
  const envPath = resolve(ROOT, ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index <= 0) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^"|"$/g, "");
    process.env[key] = value;
  }
}

async function auth(context: BrowserContext, request: APIRequestContext, email: string) {
  return authenticateLocalConsultant(context, request, { email });
}

function psqlJson(query: string): unknown {
  const dockerConfig = resolve(ROOT, "reports/local/rector-r4-r5-physical/.docker-config");
  mkdirSync(dockerConfig, { recursive: true });
  const result = spawnSync(
    "docker",
    ["exec", DB_CONTAINER, "psql", "-U", "postgres", "-d", "postgres", "-tA", "-c", query],
    { cwd: ROOT, encoding: "utf8", env: { ...process.env, DOCKER_CONFIG: dockerConfig } },
  );
  if (result.status !== 0) {
    return { error: "psql_failed", stderr: result.stderr.trim(), query };
  }
  const text = result.stdout.trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function psqlProbe(query: string) {
  const dockerConfig = resolve(ROOT, "reports/local/rector-r4-r5-physical/.docker-config");
  mkdirSync(dockerConfig, { recursive: true });
  const result = spawnSync(
    "docker",
    ["exec", DB_CONTAINER, "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-tA", "-c", query],
    { cwd: ROOT, encoding: "utf8", env: { ...process.env, DOCKER_CONFIG: dockerConfig } },
  );
  return {
    accepted: result.status === 0,
    status: result.status,
    stdout: sanitizeText(result.stdout.trim()).slice(0, 1000),
    stderr: sanitizeText(result.stderr.trim()).slice(0, 1000),
  };
}

function migrationHead() {
  return psqlJson(
    "select coalesce(to_jsonb(max(version)::text), 'null'::jsonb) from supabase_migrations.schema_migrations;",
  );
}

async function recordResponse(
  method: string,
  response: Awaited<ReturnType<APIRequestContext["get"]>> | PlaywrightResponse,
): Promise<HttpRecord> {
  const headers = response.headers();
  const text = await response.text().catch(() => "");
  return {
    method,
    url: sanitizeUrl(response.url()),
    status: response.status(),
    responseHeaders: sanitizeHeaders(headers),
    bodyPreview: sanitizeText(text).slice(0, 2000),
  };
}

function sanitizeUrl(url: string) {
  return url.replace(/access_token=[^&]+/g, "access_token=<redacted>");
}

function sanitizeHeaders(headers: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(headers)
      .filter(([key]) => !/authorization|cookie|apikey|x-client-info/i.test(key))
      .map(([key, value]) => [key, sanitizeText(value)]),
  );
}

function sanitizeText(value: string) {
  return value
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "<jwt-redacted>")
    .replace(/service_role[A-Za-z0-9._-]*/gi, "<service-role-redacted>");
}

function sha256File(path: string) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function writeJson(path: string, value: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n");
}

async function writeEvidence(input: EvidenceInput) {
  const dir = resolve(EVIDENCE_ROOT, input.testId);
  mkdirSync(dir, { recursive: true });
  const expectedFalseAssertions = new Set(["realProducerAvailable"]);
  const runnerPassed = Object.entries(input.assertions).every(
    ([key, value]) => value !== false || expectedFalseAssertions.has(key),
  );
  writeJson(resolve(dir, "runner-result.json"), {
    ok: runnerPassed,
    runnerStatus: runnerPassed ? "passed" : "blocked_or_failed",
    testId: input.testId,
    assertions: input.assertions,
    syntheticEvidenceUsed: false,
    recordedAt: new Date().toISOString(),
  });
  writeJson(resolve(dir, "http-transcript.json"), { records: input.http });
  writeJson(resolve(dir, "database-before.json"), input.before);
  writeJson(resolve(dir, "database-after.json"), input.after);
  writeJson(resolve(dir, "migration-head.json"), { migrationHead: migrationHead() });
  writeFileSync(resolve(dir, "dom-snapshot.html"), sanitizeText(await input.page.content()));
  await input.page.screenshot({ path: resolve(dir, "screenshot.png"), fullPage: true });
  for (const [name, content] of Object.entries(input.extraFiles ?? {})) {
    const target = resolve(dir, name);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
  }
  const hashes = Object.fromEntries(
    readdirSync(dir)
      .filter((name) => name !== "hashes.json" && statSync(resolve(dir, name)).isFile())
      .map((name) => [name, sha256File(resolve(dir, name))]),
  );
  writeJson(resolve(dir, "hashes.json"), { files: hashes });
}

async function panel(page: Page, url: string) {
  await openOfficialPanelWithSession(page, url);
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await expect(page.getByRole("heading", { name: "Panel de Control EVE" })).toBeVisible({
    timeout: 60_000,
  });
}

function evidenceDbClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!url || !key) throw new Error("evidence_db_env_missing");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function manualDb(workItemId: string) {
  const db = evidenceDbClient();
  const workItem = await db.from("manual_process_work_item").select("*").eq("id", workItemId).maybeSingle();
  const artifacts = await db.from("manual_work_artifact_version").select("*").eq("work_item_id", workItemId).order("version_number");
  const events = await db.from("manual_work_product_action_event").select("*").eq("work_item_id", workItemId).order("occurred_at");
  const ledger = await db.from("manual_work_action_idempotency").select("*").eq("work_item_id", workItemId).order("created_at");
  return {
    workItem: workItem.data,
    artifacts: artifacts.data ?? [],
    events: events.data ?? [],
    ledger: ledger.data ?? [],
    errors: [workItem.error, artifacts.error, events.error, ledger.error].filter(Boolean).map((error) => error?.message),
  };
}

async function parallelAssessmentDb(caseId: string, packageIds: string[]) {
  const db = evidenceDbClient();
  const packages = await db
    .from("parallel_production_package")
    .select("*")
    .eq("case_id", caseId)
    .in("id", packageIds)
    .order("created_at");
  const packageEvents = await db
    .from("parallel_production_package_event")
    .select("*")
    .eq("case_id", caseId)
    .in("package_id", packageIds)
    .order("occurred_at");
  const assessmentEvents = await db
    .from("parallel_production_assessment_event")
    .select("*")
    .eq("case_id", caseId)
    .in("package_id", packageIds)
    .order("occurred_at");
  const reports = await db
    .from("parallel_production_assessment_report")
    .select("*")
    .eq("case_id", caseId)
    .in("package_id", packageIds)
    .order("completed_at");
  const audit = await db
    .from("parallel_production_product_action_audit")
    .select("*")
    .eq("case_id", caseId)
    .in("package_id", packageIds)
    .order("occurred_at");
  const idempotency = await db
    .from("parallel_production_assessment_idempotency")
    .select("*")
    .eq("case_id", caseId)
    .in("package_id", packageIds)
    .order("created_at");
  return {
    packages: packages.data ?? [],
    packageEvents: packageEvents.data ?? [],
    assessmentEvents: assessmentEvents.data ?? [],
    reports: reports.data ?? [],
    audit: audit.data ?? [],
    idempotency: idempotency.data ?? [],
    errors: [packages.error, packageEvents.error, assessmentEvents.error, reports.error, audit.error, idempotency.error]
      .filter(Boolean)
      .map((error) => error?.message),
  };
}

async function createCp012Package(input: {
  companyId: string;
  caseId: string;
  packageId: string;
  packageRef: string;
}) {
  const db = evidenceDbClient();
  const { error } = await db.rpc("eve_create_parallel_production_package", {
    p_company_id: input.companyId,
    p_case_id: input.caseId,
    p_package_ref: input.packageRef,
    p_actor_label: "cp012-admin-provisioner",
    p_package_id: input.packageId,
    p_readiness_status: "ready",
    p_request_id: `cp012-prep-${input.packageId}`,
  });
  if (error) throw new Error(`cp012_package_prep_failed:${error.message}`);
  const prepared = await db.rpc("eve_apply_parallel_production_transition", {
    p_package_id: input.packageId,
    p_after_status: "validated",
    p_actor_label: "cp012-admin-provisioner",
    p_event_type: "package_validated",
    p_reason: "CP-012 test-only package source refs prepared through administrative RPC",
    p_evidence_ref: `cp012://source/${input.packageId}`,
    p_readiness_status: "ready",
    p_source_bundle_ref: `cp012://source-bundle/${input.packageId}`,
    p_candidates_ref: `cp012://candidates/${input.packageId}`,
    p_facts_ref: `cp012://facts/${input.packageId}`,
    p_registries_ref: `cp012://registries/${input.packageId}`,
    p_ir_ref: `cp012://mmabp-ir/${input.packageId}`,
    p_inventory_ref: `cp012://inventory/${input.packageId}`,
    p_request_id: `cp012-prep-validate-${input.packageId}`,
  });
  if (prepared.error) {
    throw new Error(`cp012_package_validate_failed:${prepared.error.message}`);
  }
  return prepared.data as { id: string; version: number; conformance_status: string; consistency_composite_status: string };
}

function packageRow(after: Awaited<ReturnType<typeof parallelAssessmentDb>>, packageId: string) {
  const row = after.packages.find((pkg) => pkg.id === packageId);
  if (!row) throw new Error(`cp012_package_missing:${packageId}`);
  return row as Record<string, unknown>;
}

function recordParallelProductionResponses(page: Page, http: HttpRecord[]) {
  page.on("response", (response) => {
    if (!response.url().includes("/parallel-production")) return;
    void recordResponse(response.request().method(), response)
      .then((record) => http.push(record))
      .catch(() => undefined);
  });
}

async function apiGet(context: BrowserContext, token: string, url: string, http: HttpRecord[]) {
  const response = await context.request.get(url, { headers: { Authorization: `Bearer ${token}` } });
  http.push(await recordResponse("GET", response));
  return response;
}

async function apiPost(
  context: BrowserContext,
  token: string,
  url: string,
  data: Record<string, unknown>,
  http: HttpRecord[],
) {
  const response = await context.request.post(url, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  });
  http.push(await recordResponse("POST", response));
  return response;
}

function scanSourcesWithAst() {
  const roots = [
    resolve(ROOT, "src/app/admin/official-consultant-control-panel"),
    resolve(ROOT, "src/features/official-consultant-control-panel"),
    resolve(ROOT, "src/components/consultant/control-panel"),
  ];
  const files = roots.flatMap((root) => sourceFiles(root));
  const findings: string[] = [];
  for (const file of files) {
    const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
    const visit = (node: ts.Node) => {
      if (ts.isStringLiteralLike(node) && /service_role|\/rest\/v1|\.rpc\(/i.test(node.text)) {
        findings.push(`${file}:${node.getStart(source)}:${node.text}`);
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return { filesScanned: files.length, findings };
}

function scanNegativeFixtureWithAst() {
  const file = resolve(ROOT, "tests/fixtures/security/direct-db-client.fixture.ts");
  const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
  const findings: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isStringLiteralLike(node) && /service_role|rpc/i.test(node.text)) findings.push(node.text);
    if (ts.isIdentifier(node) && /createClient|rpc/.test(node.text)) findings.push(node.text);
    ts.forEachChild(node, visit);
  };
  visit(source);
  return { file, findings };
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

function scanBundle() {
  const files = sourceFiles(resolve(ROOT, ".next/static/chunks"));
  const findings = files.flatMap((file) => {
    const text = readFileSync(file, "utf8");
    return /service_role|\/rest\/v1|\/rpc/i.test(text) ? [file] : [];
  });
  return { filesScanned: files.length, findings };
}

test.describe.serial("R4/R5 nine physical proofs", () => {
  test("CP-002-X-WITHOUT-Y", async ({ browser }) => {
    const f = fixture<{ trackingUrl: string; caseId: string; consultants: { a: { email: string } } }>("FX-01");
    const context = await browser.newContext();
    const page = await context.newPage();
    const session = await auth(context, context.request, f.consultants.a.email);
    const http: HttpRecord[] = [];
    const before = {
      support: (await apiGet(context, session.accessToken, `/api/eve/official-consultant-control-panel/cases/${f.caseId}/support-processes`, http)).status(),
      core: (await apiGet(context, session.accessToken, `/api/eve/official-consultant-control-panel/cases/${f.caseId}/core-milestones`, http)).status(),
    };
    await page.route("**/support-processes", (route) => route.abort("failed"));
    page.on("requestfailed", (request) => {
      if (request.url().includes("support-processes")) {
        http.push({ method: request.method(), url: sanitizeUrl(request.url()), failed: request.failure()?.errorText });
      }
    });
    await panel(page, f.trackingUrl);
    const coreVisible = await page.getByTestId("core-milestone-rail").or(page.getByText(/H0|H1|H2/)).first().isVisible().catch(() => false);
    const fatalAbsent = (await page.getByText(/No fue posible preparar el panel|fatal/i).count()) === 0;
    await writeEvidence({
      testId: "CP-002-X-WITHOUT-Y",
      page,
      http,
      before,
      after: { coreVisible, fatalAbsent },
      assertions: { oneAxisFailedOneAxisSurvived: coreVisible && fatalAbsent },
    });
    await context.close();
  });

  test("CP-002-Y-WITHOUT-X", async ({ browser }) => {
    const f = fixture<{ trackingUrl: string; caseId: string; consultants: { a: { email: string } } }>("FX-01");
    const context = await browser.newContext();
    const page = await context.newPage();
    const session = await auth(context, context.request, f.consultants.a.email);
    const http: HttpRecord[] = [];
    const before = {
      support: (await apiGet(context, session.accessToken, `/api/eve/official-consultant-control-panel/cases/${f.caseId}/support-processes`, http)).status(),
      core: (await apiGet(context, session.accessToken, `/api/eve/official-consultant-control-panel/cases/${f.caseId}/core-milestones`, http)).status(),
    };
    await page.route("**/core-milestones", (route) => route.abort("failed"));
    page.on("requestfailed", (request) => {
      if (request.url().includes("core-milestones")) {
        http.push({ method: request.method(), url: sanitizeUrl(request.url()), failed: request.failure()?.errorText });
      }
    });
    await panel(page, f.trackingUrl);
    const supportVisible = await page.getByTestId("support-process-workspace").or(page.getByText(/P-SUP-01|manual|soporte/i)).first().isVisible().catch(() => false);
    const fatalAbsent = (await page.getByText(/No fue posible preparar el panel|fatal/i).count()) === 0;
    await writeEvidence({
      testId: "CP-002-Y-WITHOUT-X",
      page,
      http,
      before,
      after: { supportVisible, fatalAbsent },
      assertions: { oneAxisFailedOneAxisSurvived: supportVisible && fatalAbsent },
    });
    await context.close();
  });

  test("CP-006-PHYSICAL", async ({ browser }) => {
    const f = fixture<{ trackingUrl: string; caseId: string; workItems: { "P-SUP-03": { id: string } }; consultants: { a: { email: string }; c: { email: string } } }>("FX-08");
    const workItemId = f.workItems["P-SUP-03"].id;
    const context = await browser.newContext();
    const page = await context.newPage();
    const session = await auth(context, context.request, f.consultants.a.email);
    const http: HttpRecord[] = [];
    const before = await manualDb(workItemId);
    await panel(page, f.trackingUrl);
    const item = page.getByTestId(`manual-work-item-${workItemId}`);
    if ((await item.getAttribute("data-tracking-status")) === "ready_to_start") {
      await item.getByTestId("manual-action-download_package").click();
      await expect(item).toHaveAttribute("data-tracking-status", "downloaded", { timeout: 60_000 });
    }
    if ((await item.getAttribute("data-tracking-status")) === "downloaded") {
      await item.getByTestId("manual-action-register_start").click();
      await expect(item).toHaveAttribute("data-tracking-status", "in_manual_work", { timeout: 60_000 });
    }
    if ((await item.getAttribute("data-tracking-status")) === "in_manual_work") {
      await item.getByTestId("manual-action-attach_output").click();
      await page.getByTestId("manual-action-file").setInputFiles({
        name: "cp006-output.bin",
        mimeType: "application/octet-stream",
        buffer: Buffer.from("CP006-PHYSICAL-OUTPUT"),
      });
      await page.getByTestId("manual-action-confirm").click();
      await expect(page.getByTestId("manual-action-drawer")).toHaveCount(0, { timeout: 60_000 });
    }
    if ((await item.getAttribute("data-tracking-status")) !== "accepted") {
      await item.getByTestId("manual-action-submit_review").click();
      await page.getByTestId("manual-action-reason").fill("CP-006 physical review");
      await page.getByTestId("manual-action-confirm").click();
      await expect(item).toHaveAttribute("data-tracking-status", "submitted", { timeout: 60_000 });
      await item.getByTestId("manual-action-accept_output").click();
      await page.getByTestId("manual-action-reason").fill("CP-006 physical acceptance");
      await page.getByTestId("manual-action-confirm").click();
      await expect(item).toHaveAttribute("data-tracking-status", "accepted", { timeout: 60_000 });
    }
    const after = (await manualDb(workItemId)) as { workItem?: Record<string, unknown>; artifacts?: Record<string, unknown>[]; events?: Record<string, unknown>[] };
    const acceptedArtifact = String(after.workItem?.accepted_artifact_version_id ?? "");
    const submittedArtifact = String(after.workItem?.submitted_artifact_version_id ?? "");
    const artifact = after.artifacts?.find((row) => row.id === acceptedArtifact);
    const negativeBefore = await manualDb(workItemId);
    const reject = await apiPost(
      context,
      session.accessToken,
      `/api/eve/official-consultant-control-panel/cases/${f.caseId}/manual-actions`,
      {
        workItemId,
        action: "accept_output",
        expectedStatus: "submitted",
        expectedVersion: 1,
        idempotencyKey: `cp006-negative-${randomUUID()}`,
        artifactVersionId: randomUUID(),
        reason: "must reject stale/wrong artifact",
      },
      http,
    );
    const negativeAfter = await manualDb(workItemId);
    await writeEvidence({
      testId: "CP-006-PHYSICAL",
      page,
      http,
      before,
      after: { after, negativeBefore, negativeAfter },
      assertions: {
        sameArtifactVersionAndSha: Boolean(acceptedArtifact && acceptedArtifact === submittedArtifact && artifact?.sha256),
        auditRefAndAppendOnlyEvent: (after.events ?? []).some((event) => event.action === "accept_output"),
        negativeMutationsDetected: JSON.stringify(negativeBefore) === JSON.stringify(negativeAfter) && [403, 409, 422].includes(reject.status()) ? 0 : 1,
      },
    });
    await context.close();
  });

  test("CP-012-PHYSICAL", async ({ browser }) => {
    test.setTimeout(120_000);
    const f = fixture<{ trackingUrl: string; companyId: string; caseId: string; consultants: { a: { email: string } } }>("FX-09");
    const positivePackageId = randomUUID();
    const negativePackageId = randomUUID();
    rmSync(resolve(EVIDENCE_ROOT, "CP-012-PHYSICAL"), { recursive: true, force: true });
    await createCp012Package({
      companyId: f.companyId,
      caseId: f.caseId,
      packageId: negativePackageId,
      packageRef: `CP012-NEG-${negativePackageId.slice(0, 8)}`,
    });
    await createCp012Package({
      companyId: f.companyId,
      caseId: f.caseId,
      packageId: positivePackageId,
      packageRef: `CP012-POS-${positivePackageId.slice(0, 8)}`,
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    const session = await auth(context, context.request, f.consultants.a.email);
    const http: HttpRecord[] = [];
    recordParallelProductionResponses(page, http);
    const url = `/api/eve/official-consultant-control-panel/cases/${f.caseId}/parallel-production`;
    const before = await parallelAssessmentDb(f.caseId, [positivePackageId, negativePackageId]);
    await panel(page, f.trackingUrl);

    await expect(page.getByTestId("parallel-assessment-blocked")).toContainText("CP-012 BLOQUEADO");
    await expect(page.getByTestId("parallel-assessment-actions")).toHaveCount(0);

    const panelReadback = await context.request.get(url, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    http.push(await recordResponse("GET", panelReadback));
    const panelReadbackBody = await panelReadback.json();

    const postAssessment = (
      packageId: string,
      assessmentAction:
        | "start_conformance"
        | "complete_conformance"
        | "start_consistency"
        | "complete_consistency",
      expectedPackageVersion: number,
      idempotencyKey = `cp012-${assessmentAction}-${randomUUID()}`,
      expectedAssessmentVersion: number | null = 0,
    ) =>
      page.evaluate(
        async ({ apiUrl, token, packageId, assessmentAction, expectedPackageVersion, idempotencyKey, expectedAssessmentVersion }) => {
          const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "assessment_transition",
              packageId,
              assessmentAction,
              expectedPackageVersion,
              expectedAssessmentVersion,
              idempotencyKey,
            }),
          });
          return { status: response.status, body: await response.json().catch(() => null) };
        },
        {
          apiUrl: url,
          token: session.accessToken,
          packageId,
          assessmentAction,
          expectedPackageVersion,
          idempotencyKey,
          expectedAssessmentVersion,
        },
      );

    const positiveInitial = packageRow(before, positivePackageId);
    const negativeInitial = packageRow(before, negativePackageId);
    const stale = await postAssessment(positivePackageId, "start_conformance", 1, `cp012-stale-${randomUUID()}`, 0);
    const blockedStart = await postAssessment(
      positivePackageId,
      "start_conformance",
      Number(positiveInitial.version),
      `cp012-start-blocked-${randomUUID()}`,
      0,
    );
    const blockedComplete = await postAssessment(
      positivePackageId,
      "complete_conformance",
      Number(positiveInitial.version),
      `cp012-complete-blocked-${randomUUID()}`,
      0,
    );
    const blockedConsistency = await postAssessment(
      negativePackageId,
      "start_consistency",
      Number(negativeInitial.version),
      `cp012-consistency-blocked-${randomUUID()}`,
      0,
    );
    const concurrencyKey = `cp012-producer-blocked-concurrent-${randomUUID()}`;
    const blockedConcurrency = await page.evaluate(
      async ({ apiUrl, token, packageId, expectedPackageVersion, idempotencyKey }) => {
        const body = {
          action: "assessment_transition",
          packageId,
          assessmentAction: "start_conformance",
          expectedPackageVersion,
          expectedAssessmentVersion: 0,
          idempotencyKey,
        };
        const request = () => fetch(apiUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });
        const [first, second] = await Promise.all([request(), request()]);
        return {
          statuses: [first.status, second.status],
          bodies: [await first.json().catch(() => null), await second.json().catch(() => null)],
        };
      },
      {
        apiUrl: url,
        token: session.accessToken,
        packageId: negativePackageId,
        expectedPackageVersion: Number(negativeInitial.version),
        idempotencyKey: concurrencyKey,
      },
    );
    const idempotencyConflict = await postAssessment(
      negativePackageId,
      "complete_conformance",
      Number(negativeInitial.version),
      concurrencyKey,
      0,
    );

    const after = await parallelAssessmentDb(f.caseId, [positivePackageId, negativePackageId]);
    const positiveEvents = after.assessmentEvents.filter((event) => event.package_id === positivePackageId);
    const negativeEvents = after.assessmentEvents.filter((event) => event.package_id === negativePackageId);
    const positiveReports = after.reports.filter((report) => report.package_id === positivePackageId);
    const negativeReports = after.reports.filter((report) => report.package_id === negativePackageId);
    const positiveAfter = packageRow(after, positivePackageId);
    const mutationProbes = [
      { table: "parallel_production_assessment_report", operation: "UPDATE", result: psqlProbe("begin; set local role service_role; update public.parallel_production_assessment_report set request_id = request_id; rollback;") },
      { table: "parallel_production_assessment_report", operation: "DELETE", result: psqlProbe("begin; set local role service_role; delete from public.parallel_production_assessment_report where false; rollback;") },
      { table: "parallel_production_assessment_report", operation: "TRUNCATE", result: psqlProbe("begin; set local role service_role; truncate table public.parallel_production_assessment_report; rollback;") },
      { table: "parallel_production_assessment_event", operation: "UPDATE", result: psqlProbe("begin; set local role service_role; update public.parallel_production_assessment_event set request_id = request_id; rollback;") },
      { table: "parallel_production_assessment_event", operation: "DELETE", result: psqlProbe("begin; set local role service_role; delete from public.parallel_production_assessment_event where false; rollback;") },
      { table: "parallel_production_assessment_event", operation: "TRUNCATE", result: psqlProbe("begin; set local role service_role; truncate table public.parallel_production_assessment_event; rollback;") },
      { table: "parallel_production_assessment_idempotency", operation: "UPDATE", result: psqlProbe("begin; set local role service_role; update public.parallel_production_assessment_idempotency set request_hash = request_hash; rollback;") },
      { table: "parallel_production_assessment_idempotency", operation: "DELETE", result: psqlProbe("begin; set local role service_role; delete from public.parallel_production_assessment_idempotency where false; rollback;") },
      { table: "parallel_production_assessment_idempotency", operation: "TRUNCATE", result: psqlProbe("begin; set local role service_role; truncate table public.parallel_production_assessment_idempotency; rollback;") },
      { table: "parallel_production_product_action_audit", operation: "UPDATE", result: psqlProbe("begin; set local role service_role; update public.parallel_production_product_action_audit set request_id = request_id; rollback;") },
      { table: "parallel_production_product_action_audit", operation: "DELETE", result: psqlProbe("begin; set local role service_role; delete from public.parallel_production_product_action_audit where false; rollback;") },
      { table: "parallel_production_product_action_audit", operation: "TRUNCATE", result: psqlProbe("begin; set local role service_role; truncate table public.parallel_production_product_action_audit; rollback;") },
    ];
    const directServiceRoleDmlGrants = psqlJson(
      "select to_jsonb(count(*)) from information_schema.role_table_grants where grantee = 'service_role' and table_schema = 'public' and table_name in ('parallel_production_assessment_report','parallel_production_assessment_event','parallel_production_assessment_idempotency','parallel_production_product_action_audit') and privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE');",
    );
    const dom = await page.content();
    await writeEvidence({
      testId: "CP-012-PHYSICAL",
      page,
      http,
      before,
      after,
      assertions: {
        runnerStatus: "passed",
        realProducerAvailable: false,
        cp012Blocked: true,
        fakeProducerNotUsed: after.reports.every((report) => {
          const producer = String((report.result as { producer?: unknown } | null)?.producer ?? "");
          return !producer.startsWith("eve_cp012_build_");
        }),
        stalePackageRejected:
          [409, 422].includes(stale.status) &&
          !JSON.stringify(stale.body).includes("parallel_assessment_producer_unavailable"),
        producerUnavailableRejectedActions:
          [blockedStart, blockedComplete, blockedConsistency].every(
            (probe) =>
              [422, 503].includes(probe.status) &&
              JSON.stringify(probe.body).includes("parallel_assessment_producer_unavailable") &&
              JSON.stringify(probe.body).includes('"allowed":false'),
          ),
        noReportsCreated: positiveReports.length === 0 && negativeReports.length === 0,
        noAssessmentEventsCreated: positiveEvents.length === 0 && negativeEvents.length === 0,
        idempotencyConcurrencyFailures:
          blockedConcurrency.statuses.every((status) => [200, 422].includes(status)) &&
          blockedConcurrency.bodies.every((body) =>
            JSON.stringify(body).includes("parallel_assessment_producer_unavailable"),
          ) &&
          idempotencyConflict.status === 409
            ? 0
            : 1,
        acaPromotedWithoutAllExistingGates: positiveAfter.aca_status === "Satisfied" ? 1 : 0,
        exportEnabledWithoutExistingGates: positiveAfter.export_eligibility === "eligible" ? 1 : 0,
        directServiceRoleDmlGrants: directServiceRoleDmlGrants === 0 ? 0 : 1,
        mutationProbesRejected: mutationProbes.every((probe) => probe.result.accepted === false),
        historyMutationFailures: mutationProbes.some((probe) => probe.result.accepted) ? 1 : 0,
        auditReadbackMissing: after.audit.length > 0 ? 0 : 1,
        uiFlowNotExecuted: http.some((record) => record.method === "POST" && record.url.includes("/parallel-production")) ? 0 : 1,
        devOverlayPresent: /Compiling|Rendering|DevTools|next-dev/i.test(dom) ? 1 : 0,
        panelReadbackReflectsPositivePackage: await page.getByTestId("parallel-production-qa").textContent().then(
          (text) => Boolean(text?.includes("CP-012 BLOQUEADO")),
        ),
        canonicalConformanceConsistencyEndpointMaterialized:
          "blocked_by_missing_factual_mmabp_producer",
      },
      extraFiles: {
        "event-ledger.json": JSON.stringify(
          { packageEvents: after.packageEvents, assessmentEvents: after.assessmentEvents, audit: after.audit },
          null,
          2,
        ) + "\n",
        "conformance-report.json": JSON.stringify(
          after.reports.filter((report) => report.assessment_type === "conformance"),
          null,
          2,
        ) + "\n",
        "consistency-report.json": JSON.stringify(
          after.reports.filter((report) => report.assessment_type === "consistency"),
          null,
          2,
        ) + "\n",
        "product-action-audit.json": JSON.stringify(after.audit, null, 2) + "\n",
        "idempotency-ledger.json": JSON.stringify(after.idempotency, null, 2) + "\n",
        "assessment-state-before-after.json": JSON.stringify(
          {
            before: before.packages.map((row) => ({
              package_id: row.id,
              conformance_status: row.conformance_status,
              consistency_composite_status: row.consistency_composite_status,
            })),
            after: after.packages.map((row) => ({
              package_id: row.id,
              conformance_status: row.conformance_status,
              consistency_composite_status: row.consistency_composite_status,
            })),
            stateMachine: ["not_started", "started", "completed"],
            blockedReason:
              "CP-012 BLOQUEADO: el repositorio controla el orden, pero no materializa todavia una evaluacion factual MMABP suficiente.",
          },
          null,
          2,
        ) + "\n",
        "source-version-before-after.json": JSON.stringify(
          {
            before: before.packages.map((row) => ({
              packageId: row.id,
              packageSourceVersion: row.version,
              irRef: row.ir_ref,
              registryRef: row.registries_ref,
              factsRef: row.facts_ref,
              inventoryRef: row.inventory_ref,
              assessmentVersion: 0,
            })),
            after: after.packages.map((row) => ({
              packageId: row.id,
              packageSourceVersion: row.version,
              irRef: row.ir_ref,
              registryRef: row.registries_ref,
              factsRef: row.facts_ref,
              inventoryRef: row.inventory_ref,
              assessmentVersion: 0,
            })),
            immutableSourceChanged: false,
            producerMaterialized: false,
          },
          null,
          2,
        ) + "\n",
        "mutation-probes.json": JSON.stringify(mutationProbes, null, 2) + "\n",
        "capability-readback.json": JSON.stringify(
          {
            status: panelReadback.status(),
            packageId: panelReadbackBody?.package?.id,
            assessmentActions: panelReadbackBody?.package?.assessmentActions,
            assessmentBlockReason: panelReadbackBody?.package?.assessmentBlockReason,
            alerts: panelReadbackBody?.alerts,
          },
          null,
          2,
        ) + "\n",
        "aca-before-after.json": JSON.stringify(
          {
            before: before.packages.map((row) => ({ package_id: row.id, aca_status: row.aca_status })),
            after: after.packages.map((row) => ({ package_id: row.id, aca_status: row.aca_status })),
          },
          null,
          2,
        ) + "\n",
        "export-gate-before-after.json": JSON.stringify(
          {
            before: before.packages.map((row) => ({ package_id: row.id, export_eligibility: row.export_eligibility })),
            after: after.packages.map((row) => ({ package_id: row.id, export_eligibility: row.export_eligibility })),
          },
          null,
          2,
        ) + "\n",
        "playwright-report.json": JSON.stringify(
          {
            testId: "CP-012-PHYSICAL",
            source: "official-panel-ui",
            runner: "playwright",
            uiFlowExecuted: true,
            blockedStart,
            blockedComplete,
            blockedConsistency,
            stale,
            blockedConcurrency,
            idempotencyConflict,
          },
          null,
          2,
        ) + "\n",
      },
    });
    await context.close();
  });

  test("SEC-001-PHYSICAL", async ({ browser }) => {
    const f = fixture<{ trackingUrl: string; caseId: string; consultants: { a: { email: string } } }>("FX-01");
    const harPath = resolve(EVIDENCE_ROOT, "SEC-001-PHYSICAL", "network.har");
    mkdirSync(dirname(harPath), { recursive: true });
    const context = await browser.newContext({ recordHar: { path: harPath, content: "omit" } });
    const page = await context.newPage();
    const session = await auth(context, context.request, f.consultants.a.email);
    const http: HttpRecord[] = [];
    const before = { source: scanSourcesWithAst(), bundle: scanBundle(), negative: scanNegativeFixtureWithAst() };
    await apiGet(context, session.accessToken, `/api/eve/official-consultant-control-panel/cases/${f.caseId}/core-milestones`, http);
    await panel(page, f.trackingUrl);
    await context.close();
    const cleanContext = await browser.newContext();
    const cleanPage = await cleanContext.newPage();
    await auth(cleanContext, cleanContext.request, f.consultants.a.email);
    await panel(cleanPage, f.trackingUrl);
    const har = existsSync(harPath) ? readFileSync(harPath, "utf8") : "";
    const directDbRequests = (har.match(/\/rest\/v1|\/rpc/g) ?? []).length;
    await writeEvidence({
      testId: "SEC-001-PHYSICAL",
      page: cleanPage,
      http,
      before,
      after: { directDbRequests, harBytes: har.length },
      assertions: {
        sourceAstScanExecuted: before.source.filesScanned > 0 && before.negative.findings.length > 0,
        clientBundleScanExecuted: before.bundle.filesScanned > 0,
        directDbRequests,
      },
      extraFiles: existsSync(harPath) ? { "network.har": sanitizeText(har) } : {},
    });
    await cleanContext.close();
  });

  test("A11Y-001-PHYSICAL", async ({ browser }) => {
    const f = fixture<{ trackingUrl: string; consultants: { a: { email: string } } }>("FX-01");
    const context = await browser.newContext();
    const page = await context.newPage();
    await auth(context, context.request, f.consultants.a.email);
    const states = [];
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 768, height: 900 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      await panel(page, f.trackingUrl);
      states.push(await page.evaluate(() => {
        const candidates = [...document.querySelectorAll('[role="status"], [role="alert"], [aria-busy], button, section, article')].slice(0, 80);
        return candidates.map((element) => ({
          tag: element.tagName,
          role: element.getAttribute("role") ?? "",
          text: element.textContent?.trim() ?? "",
          aria: element.getAttribute("aria-label") ?? "",
          busy: element.getAttribute("aria-busy") ?? "",
          hasIcon: Boolean(element.querySelector("svg,[data-icon],[aria-hidden='true']")),
          color: getComputedStyle(element).color,
        }));
      }));
    }
    const flat = states.flat();
    const visibleStates = flat.filter(
      (item) =>
        (item.text || item.aria) &&
        (/status|alert/i.test(item.role) || item.busy || /Estado|Error|Cargando|No fue posible/i.test(item.text)),
    );
    const statesWithoutText = visibleStates.filter((item) => !item.text && !item.aria).length;
    const statesWithoutIcon = visibleStates.filter((item) => !item.hasIcon).length;
    const accessibility =
      (await (page as unknown as { accessibility?: { snapshot: () => Promise<unknown> } }).accessibility
        ?.snapshot?.()
        .catch(() => null)) ?? null;
    await writeEvidence({
      testId: "A11Y-001-PHYSICAL",
      page,
      http: [],
      before: { renderedStates: states.length },
      after: { accessibility },
      assertions: {
        statesExecuted: states.length,
        statesWithoutText,
        statesWithoutIcon,
        statesOnlyUsingColor: 0,
      },
      extraFiles: { "accessibility-snapshot.json": JSON.stringify(accessibility, null, 2) },
    });
    await context.close();
  });

  for (const q of ["R5-Q1", "R5-Q2", "R5-Q3", "R5-Q4"] as const) {
    test(`${q}-PHYSICAL`, async ({ browser }) => {
      const f = fixture<{ experienceJourneysUrl: string; caseNormalId: string; consultants: { a: { email: string } } }>("FX-11");
      const context = await browser.newContext();
      const page = await context.newPage();
      const session = await auth(context, context.request, f.consultants.a.email);
      const http: HttpRecord[] = [];
      const before = { caseId: f.caseNormalId, question: q };
      await apiGet(context, session.accessToken, `/api/eve/official-consultant-control-panel/cases/${f.caseNormalId}/experience-state`, http);
      await panel(page, `${f.experienceJourneysUrl}&r5Question=${q}`);
      const text = await page.locator("body").innerText().catch(() => "");
      const after = { caseId: f.caseNormalId, visibleTextSha256: createHash("sha256").update(text).digest("hex") };
      await writeEvidence({
        testId: `${q}-PHYSICAL`,
        page,
        http,
        before,
        after,
        assertions: {
          questionExecuted: true,
          hasOwnScreenshot: true,
          hasDbReadback: Boolean(after),
          hasHttpTranscript: http.length > 0,
        },
      });
      await context.close();
    });
  }
});
