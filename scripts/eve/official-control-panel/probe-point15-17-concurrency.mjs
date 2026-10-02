#!/usr/bin/env node
/**
 * Real concurrency probe against POST experience-actions (not sequential).
 * Requires: provision seed already done + Next on EVE_BASE_URL.
 */
import { randomUUID } from "node:crypto";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd());
const MANIFEST = resolve(ROOT, "reports/local/rector-points-15-17/manifest.json");
const OUT = resolve(ROOT, "reports/local/rector-r3-degradation/diagnostics");
const BASE = (process.env.EVE_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");

async function passwordGrant(email, password) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim();
  const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anon, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`password_grant_failed:${email}`);
  const json = await res.json();
  return { token: json.access_token, userId: json.user.id };
}

async function postAction(url, token, payload) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
  const password = (process.env.EVE_UNIT2B_TEST_PASSWORD ?? "").trim();
  if (!password) throw new Error("EVE_UNIT2B_TEST_PASSWORD_missing");

  const authA = await passwordGrant(manifest.consultants.a.email, password);
  const stateUrl = `${BASE}/api/eve/official-consultant-control-panel/cases/${manifest.caseNormalId}/experience-state`;
  const getRes = await fetch(stateUrl, {
    headers: { Authorization: `Bearer ${authA.token}` },
  });
  const getBody = await getRes.json();
  const supportQueue = getBody?.supportQueue ?? getBody?.data?.supportQueue ?? [];
  const supportItem =
    supportQueue.find((item) => item.screenKey === "workmap") ?? supportQueue[0];
  if (!getRes.ok || !supportItem) throw new Error("precondition_get_failed");

  const postUrl = `${BASE}/api/eve/official-consultant-control-panel/cases/${manifest.caseNormalId}/experience-actions`;
  const sameKey = randomUUID();
  const basePayload = {
    userId: supportItem.userId ?? manifest.participantUserId,
    screenKey: supportItem.screenKey,
    actionType: "send_message",
    reasonCode: "help_orientation",
    beforeState: supportItem.beforeState ?? supportItem.source ?? "support_requested",
    expectedEffect: "Orientación concurrente",
    roleRuntimeSessionId: supportItem.roleRuntimeSessionId ?? null,
    activityId: supportItem.activityId ?? null,
    idempotencyKey: sameKey,
  };

  const [r1, r2] = await Promise.all([
    postAction(postUrl, authA.token, basePayload),
    postAction(postUrl, authA.token, basePayload),
  ]);

  const id1 = r1.body?.actionId ?? r1.body?.action?.id;
  const id2 = r2.body?.actionId ?? r2.body?.action?.id;
  const sameOk =
    r1.status === 200 &&
    r2.status === 200 &&
    id1 &&
    id2 &&
    id1 === id2;

  const conflictKey = randomUUID();
  const [c1, c2] = await Promise.all([
    postAction(postUrl, authA.token, {
      ...basePayload,
      idempotencyKey: conflictKey,
      reasonCode: "reason_alpha",
    }),
    postAction(postUrl, authA.token, {
      ...basePayload,
      idempotencyKey: conflictKey,
      reasonCode: "reason_beta",
    }),
  ]);
  const statuses = [c1.status, c2.status].sort((a, b) => a - b);
  const conflictOk =
    statuses.includes(200) &&
    statuses.includes(409) &&
    [c1.body?.code ?? c1.body?.error, c2.body?.code ?? c2.body?.error].includes(
      "IDEMPOTENCY_CONFLICT",
    );

  const report = {
    ok: sameOk && conflictOk,
    samePayloadConcurrent: {
      status1: r1.status,
      status2: r2.status,
      actionId1: id1,
      actionId2: id2,
      sameActionId: id1 === id2,
    },
    differentPayloadConcurrent: {
      status1: c1.status,
      status2: c2.status,
      codes: [
        c1.body?.code ?? c1.body?.error ?? null,
        c2.body?.code ?? c2.body?.error ?? null,
      ],
    },
  };
  writeFileSync(
    resolve(OUT, "08-concurrency-probe.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  if (!report.ok) {
    console.error(JSON.stringify({ ok: false, report }));
    process.exitCode = 1;
    return;
  }
  console.log(JSON.stringify({ ok: true, report }));
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }),
  );
  process.exitCode = 1;
});
