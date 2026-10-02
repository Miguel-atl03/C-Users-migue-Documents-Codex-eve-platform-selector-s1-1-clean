#!/usr/bin/env node
/**
 * Permanent Runtime → Panel wiring (test-only, never Amber).
 * Operative path: official screen-event RPC → consultant GET → explicit capability → POST → audit.
 * Does not mutate grants. Requires prior provision-point15-17.
 */
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = resolve(process.cwd());
const MANIFEST = resolve(ROOT, "reports/local/rector-points-15-17/manifest.json");
const OUT = resolve(ROOT, "reports/local/rector-r3-degradation/diagnostics");
const BASE = (process.env.EVE_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const AMBER_CASE = "19fc9eff-4219-43f0-854c-e2b3350f23f2";

function adminClient() {
  let serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!serviceRoleKey) {
    const status = spawnSync("npx", ["supabase", "status", "-o", "env"], {
      encoding: "utf8",
      shell: true,
    });
    const m = /SERVICE_ROLE_KEY=(.+)/.exec(`${status.stdout || ""}\n${status.stderr || ""}`);
    if (!m) throw new Error("missing_service_role_key");
    serviceRoleKey = m[1].trim().replace(/^"|"$/g, "");
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL.trim(), serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function passwordGrant(email, password) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL.trim()}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    },
  );
  if (!res.ok) throw new Error(`password_grant_failed:${email}`);
  const json = await res.json();
  return { token: json.access_token, userId: json.user.id };
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
  if (manifest.caseNormalId === AMBER_CASE) throw new Error("amber_forbidden");
  const password = (process.env.EVE_UNIT2B_TEST_PASSWORD ?? "").trim();
  if (!password) throw new Error("EVE_UNIT2B_TEST_PASSWORD_missing");

  const admin = adminClient();
  const screenKey = "workmap";
  const requestId = randomUUID();

  // Operative runtime signal via official RPC (not DML, not Amber).
  const { error: evErr } = await admin.rpc("eve_record_experience_screen_event", {
    p_company_id: manifest.companyId,
    p_case_id: manifest.caseNormalId,
    p_user_id: manifest.participantUserId,
    p_screen_key: screenKey,
    p_event_type: "support_requested",
    p_request_id: requestId,
    p_session_reference: `runtime://panel-wiring/${requestId}`,
    p_actor_label: "runtime_to_panel_probe",
  });
  if (evErr) throw new Error(`record_event_failed:${evErr.message}`);

  const authA = await passwordGrant(manifest.consultants.a.email, password);
  const stateUrl = `${BASE}/api/eve/official-consultant-control-panel/cases/${manifest.caseNormalId}/experience-state`;
  const get1 = await fetch(stateUrl, {
    headers: { Authorization: `Bearer ${authA.token}` },
  });
  const body1 = await get1.json();
  const caps = body1?.capabilities ?? body1?.data?.capabilities ?? [];
  const sendCap = Array.isArray(caps)
    ? caps.find((c) => c?.key === "send_support_message")
    : null;
  const queue = body1?.supportQueue ?? body1?.data?.supportQueue ?? [];
  const item =
    queue.find((q) => q.screenKey === screenKey) ?? queue[0] ?? null;

  if (!get1.ok || sendCap?.allowed !== true || !item) {
    throw new Error("get_capability_or_support_item_failed");
  }

  const postUrl = `${BASE}/api/eve/official-consultant-control-panel/cases/${manifest.caseNormalId}/experience-actions`;
  const postRes = await fetch(postUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authA.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: item.userId ?? manifest.participantUserId,
      screenKey: item.screenKey,
      actionType: "send_message",
      reasonCode: "help_orientation",
      beforeState: item.beforeState ?? item.source ?? "support_requested",
      expectedEffect: "Runtime→Panel wiring",
      idempotencyKey: randomUUID(),
    }),
  });
  const postBody = await postRes.json();
  if (postRes.status < 200 || postRes.status >= 300 || !postBody?.ok) {
    throw new Error(`post_failed:${postRes.status}`);
  }

  const get2 = await fetch(stateUrl, {
    headers: { Authorization: `Bearer ${authA.token}` },
  });
  const body2 = await get2.json();

  // Amber must remain empty of product mutations from this probe.
  const { count: amberActions } = await admin
    .from("experience_support_action")
    .select("id", { count: "exact", head: true })
    .eq("case_id", AMBER_CASE);

  const report = {
    ok: true,
    runtimeEventRequestId: requestId,
    getAllowed: sendCap.allowed === true,
    supportItemPresent: Boolean(item),
    postActionId: postBody.actionId ?? postBody.action?.id ?? null,
    softRefreshOk: get2.ok,
    amberProductActions: amberActions ?? 0,
  };
  writeFileSync(
    resolve(OUT, "09-runtime-to-panel.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  if ((amberActions ?? 0) !== 0) throw new Error("amber_not_empty");
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
