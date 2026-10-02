import { test, expect, type APIRequestContext, type BrowserContext } from "@playwright/test";
import { resolve } from "node:path";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { authenticateLocalConsultant } from "./helpers/authenticate-local-consultant";

const SHOT_DIR = resolve("reports/local/rector-r2-fx08/screenshots");
const MANIFEST = resolve("reports/local/rector-r2-fx08/manifest.json");
const RESULTS = resolve("reports/local/rector-r2-fx08/results");

type Fx08Manifest = {
  caseId: string;
  caseIdB: string;
  companyFx08Id: string;
  trackingUrl: string;
  workItems: {
    "P-SUP-03": { id: string; inputPackageArtifactId: string };
  };
  workItemsCaseB: {
    "P-SUP-03": { id: string; inputPackageArtifactId: string };
  };
  consultants: {
    a: { email: string; userId: string };
    b: { email: string; userId: string };
    c: { email: string; userId: string };
  };
};

function seedManifest(): Fx08Manifest {
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
  return JSON.parse(readFileSync(MANIFEST, "utf8")) as Fx08Manifest;
}

async function bearerFor(
  context: BrowserContext,
  request: APIRequestContext,
  email: string,
): Promise<string> {
  const auth = await authenticateLocalConsultant(context, request, { email });
  return auth.accessToken;
}

test.describe("R2 FX-08 — governed manual actions", () => {
  test.setTimeout(300_000);

  test.beforeAll(() => {
    mkdirSync(SHOT_DIR, { recursive: true });
    mkdirSync(RESULTS, { recursive: true });
  });

  test("happy path UI→BFF→RPC + negativos A/B/C + capturas 01–09", async ({
    browser,
  }) => {
    const manifest = seedManifest();
    const workId = manifest.workItems["P-SUP-03"].id;
    const inputArt = manifest.workItems["P-SUP-03"].inputPackageArtifactId;
    const workB = manifest.workItemsCaseB["P-SUP-03"].id;
    const artB = manifest.workItemsCaseB["P-SUP-03"].inputPackageArtifactId;

    // ---- Consultant A happy path (UI) ----
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    const tokenA = await bearerFor(ctxA, ctxA.request, manifest.consultants.a.email);

    await pageA.goto(manifest.trackingUrl, { waitUntil: "domcontentloaded" });
    await expect(pageA.getByTestId("manual-work-panel")).toBeVisible({
      timeout: 60_000,
    });
    const item = pageA.getByTestId(`manual-work-item-${workId}`);
    await expect(item).toHaveAttribute("data-tracking-status", "ready_to_start");
    await pageA.screenshot({
      path: resolve(SHOT_DIR, "01-ready-to-start.png"),
      fullPage: true,
    });

    // Download package (binary endpoint)
    const downloadPromise = pageA.waitForEvent("download").catch(() => null);
    await item.getByTestId("manual-action-download_package").click();
    await downloadPromise;
    await expect(item).toHaveAttribute("data-tracking-status", "downloaded", {
      timeout: 60_000,
    });
    await pageA.screenshot({
      path: resolve(SHOT_DIR, "02-downloaded.png"),
      fullPage: true,
    });

    // Register start
    await item.getByTestId("manual-action-register_start").click();
    await expect(item).toHaveAttribute("data-tracking-status", "in_manual_work", {
      timeout: 60_000,
    });
    await pageA.screenshot({
      path: resolve(SHOT_DIR, "03-in-manual-work.png"),
      fullPage: true,
    });

    // Attach output
    await item.getByTestId("manual-action-attach_output").click();
    await expect(pageA.getByTestId("manual-action-drawer")).toBeVisible();
    await pageA.getByTestId("manual-action-file").setInputFiles({
      name: "salida-fx08.bin",
      mimeType: "application/octet-stream",
      buffer: Buffer.from("FX08-MANUAL-OUTPUT-V1"),
    });
    await pageA.getByTestId("manual-action-confirm").click();
    await expect(pageA.getByTestId("manual-action-drawer")).toHaveCount(0, {
      timeout: 60_000,
    });
    await expect(item).toContainText(/salida-fx08\.bin/i, { timeout: 60_000 });
    await pageA.screenshot({
      path: resolve(SHOT_DIR, "04-attached-output.png"),
      fullPage: true,
    });

    // Submit review
    await item.getByTestId("manual-action-submit_review").click();
    await expect(pageA.getByTestId("manual-action-drawer")).toBeVisible();
    await pageA.getByTestId("manual-action-reason").fill("Envío FX-08 E2E");
    await pageA.getByTestId("manual-action-confirm").click();
    await expect(item).toHaveAttribute("data-tracking-status", "submitted", {
      timeout: 60_000,
    });
    await pageA.screenshot({
      path: resolve(SHOT_DIR, "05-submitted.png"),
      fullPage: true,
    });

    // Accept
    await item.getByTestId("manual-action-accept_output").click();
    await expect(pageA.getByTestId("manual-action-drawer")).toBeVisible();
    await pageA.getByTestId("manual-action-reason").fill("Aceptación FX-08 E2E");
    await pageA.getByTestId("manual-action-confirm").click();
    await expect(item).toHaveAttribute("data-tracking-status", "accepted", {
      timeout: 60_000,
    });
    await pageA.screenshot({
      path: resolve(SHOT_DIR, "06-accepted.png"),
      fullPage: true,
    });

    await expect(pageA.getByTestId(`manual-timeline-${workId}`)).toContainText(
      "→",
    );
    await pageA.screenshot({
      path: resolve(SHOT_DIR, "07-timeline-accepted.png"),
      fullPage: true,
    });

    // ---- BFF negatives: Consultant B (other company) ----
    const ctxB = await browser.newContext();
    const tokenB = await bearerFor(ctxB, ctxB.request, manifest.consultants.b.email);
    const deniedB = await ctxB.request.post(
      `/api/eve/official-consultant-control-panel/cases/${manifest.caseId}/manual-actions`,
      {
        headers: {
          Authorization: `Bearer ${tokenB}`,
          "Content-Type": "application/json",
        },
        data: {
          workItemId: workId,
          action: "register_start",
          expectedStatus: "downloaded",
          expectedVersion: 1,
          idempotencyKey: randomUUID(),
        },
      },
    );
    expect([403, 404]).toContain(deniedB.status());

    // Cross-path: case A URL + work item B (Consultant A authorized on both)
    const cross = await ctxA.request.post(
      `/api/eve/official-consultant-control-panel/cases/${manifest.caseId}/manual-actions`,
      {
        headers: {
          Authorization: `Bearer ${tokenA}`,
          "Content-Type": "application/json",
        },
        data: {
          workItemId: workB,
          action: "register_start",
          expectedStatus: "ready_to_start",
          expectedVersion: 1,
          idempotencyKey: randomUUID(),
        },
      },
    );
    expect([403, 404, 422]).toContain(cross.status());

    const crossDl = await ctxA.request.post(
      `/api/eve/official-consultant-control-panel/cases/${manifest.caseId}/manual-artifacts/${artB}/download`,
      {
        headers: {
          Authorization: `Bearer ${tokenA}`,
          "Content-Type": "application/json",
        },
        data: {
          workItemId: workB,
          expectedStatus: "ready_to_start",
          expectedVersion: 1,
          idempotencyKey: randomUUID(),
        },
      },
    );
    expect([403, 404, 422]).toContain(crossDl.status());

    // ---- Consultant C: manage ok, accept denied ----
    // Reseed first (password updates invalidate sessions), then auth C.
    const seedC = seedManifest();
    const workC = seedC.workItems["P-SUP-03"].id;
    const artC = seedC.workItems["P-SUP-03"].inputPackageArtifactId;

    const ctxC = await browser.newContext();
    const pageC = await ctxC.newPage();
    const tokenC = await bearerFor(ctxC, ctxC.request, seedC.consultants.c.email);

    const dlC = await ctxC.request.post(
      `/api/eve/official-consultant-control-panel/cases/${seedC.caseId}/manual-artifacts/${artC}/download`,
      {
        headers: {
          Authorization: `Bearer ${tokenC}`,
          "Content-Type": "application/json",
        },
        data: {
          workItemId: workC,
          expectedStatus: "ready_to_start",
          expectedVersion: 1,
          idempotencyKey: randomUUID(),
        },
      },
    );
    if (!dlC.ok()) {
      throw new Error(
        `consultant_c_download_failed:${dlC.status()}:${await dlC.text()}`,
      );
    }
    expect(dlC.ok()).toBeTruthy();
    const versionAfterDownload = Number(
      dlC.headers()["x-manual-work-version"] || "2",
    );

    const startC = await ctxC.request.post(
      `/api/eve/official-consultant-control-panel/cases/${seedC.caseId}/manual-actions`,
      {
        headers: {
          Authorization: `Bearer ${tokenC}`,
          "Content-Type": "application/json",
        },
        data: {
          workItemId: workC,
          action: "register_start",
          expectedStatus: "downloaded",
          expectedVersion: versionAfterDownload,
          idempotencyKey: randomUUID(),
        },
      },
    );
    expect(startC.ok()).toBeTruthy();
    const startBody = await startC.json();
    const versionAfterStart = Number(startBody?.actionResult?.version);

    const outBytes = Buffer.from("FX08-C-OUTPUT");
    const sha = createHash("sha256").update(outBytes).digest("hex");
    const attachC = await ctxC.request.post(
      `/api/eve/official-consultant-control-panel/cases/${seedC.caseId}/manual-actions`,
      {
        headers: {
          Authorization: `Bearer ${tokenC}`,
          "Content-Type": "application/json",
        },
        data: {
          workItemId: workC,
          action: "attach_output",
          expectedStatus: "in_manual_work",
          expectedVersion: versionAfterStart,
          idempotencyKey: randomUUID(),
          attachFilename: "salida-c.bin",
          attachContentType: "application/octet-stream",
          attachSha256: sha,
          attachContentBase64: outBytes.toString("base64"),
        },
      },
    );
    expect(attachC.ok()).toBeTruthy();
    const attachBody = await attachC.json();
    const artifactId = attachBody?.actionResult?.artifactVersionId as string;
    const versionAfterAttach = attachBody?.actionResult?.version as number;

    const submitC = await ctxC.request.post(
      `/api/eve/official-consultant-control-panel/cases/${seedC.caseId}/manual-actions`,
      {
        headers: {
          Authorization: `Bearer ${tokenC}`,
          "Content-Type": "application/json",
        },
        data: {
          workItemId: workC,
          action: "submit_review",
          expectedStatus: "in_manual_work",
          expectedVersion: versionAfterAttach,
          artifactVersionId: artifactId,
          idempotencyKey: randomUUID(),
          reason: "submit by C",
        },
      },
    );
    expect(submitC.ok()).toBeTruthy();
    const submitBody = await submitC.json();
    const versionAfterSubmit = submitBody?.actionResult?.version as number;

    const acceptC = await ctxC.request.post(
      `/api/eve/official-consultant-control-panel/cases/${seedC.caseId}/manual-actions`,
      {
        headers: {
          Authorization: `Bearer ${tokenC}`,
          "Content-Type": "application/json",
        },
        data: {
          workItemId: workC,
          action: "accept_output",
          expectedStatus: "submitted",
          expectedVersion: versionAfterSubmit,
          artifactVersionId: artifactId,
          idempotencyKey: randomUUID(),
          reason: "accept by C should fail",
        },
      },
    );
    expect(acceptC.status()).toBe(403);

    await pageC.goto(seedC.trackingUrl, { waitUntil: "domcontentloaded" });
    await expect(pageC.getByTestId("manual-work-panel")).toBeVisible({
      timeout: 60_000,
    });
    const itemC = pageC.getByTestId(`manual-work-item-${workC}`);
    await expect(itemC.getByTestId("manual-action-accept_output")).toHaveAttribute(
      "data-allowed",
      "false",
    );
    await pageC.screenshot({
      path: resolve(SHOT_DIR, "08-consultant-c-accept-denied.png"),
      fullPage: true,
    });

    await pageA.setViewportSize({ width: 1440, height: 900 });
    await pageA.goto(manifest.trackingUrl, { waitUntil: "domcontentloaded" });
    await pageA.screenshot({
      path: resolve(SHOT_DIR, "09-desktop-final.png"),
      fullPage: true,
    });

    writeFileSync(
      resolve(RESULTS, "fx08-e2e.json"),
      JSON.stringify(
        {
          ok: true,
          workItemHappyPath: workId,
          inputArtifact: inputArt,
          crossPathDenied: true,
          consultantBDenied: true,
          consultantCAcceptDenied: true,
          screenshots: 9,
        },
        null,
        2,
      ),
    );

    await ctxA.close();
    await ctxB.close();
    await ctxC.close();
  });
});
