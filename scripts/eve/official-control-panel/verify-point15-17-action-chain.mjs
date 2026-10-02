#!/usr/bin/env node
/**
 * §§15–17 action-chain verifier (read-only wrt grants).
 *
 * Preconditions (must already exist — do NOT create/modify grants here):
 *   1. Migration 20260720130300_eve_experience_action_idempotency applied
 *   2. seed-point15-17-experience-test.mjs already run (manifest + A grants + C without send_support_message)
 *   3. Next on EVE_BASE_URL (default http://127.0.0.1:3000) with productive build
 *
 * Flow: GET experience-state → POST experience-actions → readback by actionId/requestId
 *        → idempotency replay / IDEMPOTENCY_CONFLICT → negatives (422 / no-grant 403 / Consultor B)
 */
import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = resolve(process.cwd());
const MANIFEST = resolve(ROOT, "reports/local/rector-points-15-17/manifest.json");
const DIAG_DIR = resolve(ROOT, "reports/local/rector-r3-degradation/diagnostics");
const BASE = (process.env.EVE_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");

function writeJson(name, value) {
  writeFileSync(resolve(DIAG_DIR, name), `${JSON.stringify(value, null, 2)}\n`);
}

function assertLocalSupabaseUrl() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/i.test(url)) {
    throw new Error("non_local_supabase_url");
  }
}

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
  if (!json.access_token || !json.user?.id) throw new Error("access_token_missing");
  return { token: json.access_token, userId: json.user.id };
}

function resolveCapability(matrix, key) {
  if (!Array.isArray(matrix)) return { found: false, allowed: null, row: null };
  const hit = matrix.find((c) => c && c.key === key);
  return {
    found: Boolean(hit),
    allowed: hit?.allowed === true,
    row: hit
      ? { key: hit.key, allowed: hit.allowed, reasonCode: hit.reasonCode ?? null }
      : null,
  };
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

function adminClientReadOnly() {
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

async function countActions(admin, caseId) {
  const { data, error } = await admin
    .from("experience_support_action")
    .select("id, request_id, action_type, actor_id, user_id, screen_key, created_at")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`count_actions_failed:${error.message}`);
  return data ?? [];
}

async function main() {
  mkdirSync(DIAG_DIR, { recursive: true });
  assertLocalSupabaseUrl();

  if (!existsSync(MANIFEST)) {
    throw new Error(
      "manifest_missing:run_seed-point15-17-experience-test.mjs_first",
    );
  }

  const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
  const password = (process.env.EVE_UNIT2B_TEST_PASSWORD ?? "").trim();
  if (!password) throw new Error("EVE_UNIT2B_TEST_PASSWORD_missing");
  if (!manifest?.consultants?.a?.email || !manifest?.consultants?.b?.email) {
    throw new Error("manifest_consultants_incomplete");
  }
  if (!manifest?.consultants?.c?.email) {
    throw new Error(
      "manifest_consultants_c_missing:re-run_seed-point15-17-experience-test.mjs",
    );
  }

  // Admin client is used ONLY for readback counts. Grant/ledger DML denial is
  // verified from versioned migration text so this verifier remains pure.
  const admin = adminClientReadOnly();
  const authA = await passwordGrant(manifest.consultants.a.email, password);
  const authB = await passwordGrant(manifest.consultants.b.email, password);
  const authC = await passwordGrant(manifest.consultants.c.email, password);

  const r3PermanentMigration = readFileSync(
    resolve(
      ROOT,
      "supabase/migrations/20260721173000_eve_r3_permanent_wiring_closure.sql",
    ),
    "utf8",
  );
  const grantsClosed =
    /revoke all on function public\.eve_consultant_has_panel_capability_for\(uuid, uuid, text\)[\s\S]{0,160}from public, anon, authenticated, service_role/i.test(
      r3PermanentMigration,
    ) &&
    !/delete\s+from\s+public\.eve_consultant_panel_capability_grant[\s\S]{0,300}capability\s+in/i.test(
      r3PermanentMigration,
    );
  const ledgerClosed =
    /revoke insert, update, delete, truncate[\s\S]{0,120}experience_action_idempotency/i.test(
      readFileSync(
        resolve(
          ROOT,
          "supabase/migrations/20260721160000_eve_r3_experience_capability_idempotency_hardening.sql",
        ),
        "utf8",
      ),
    );
  writeJson("01-dml-denial-probes.json", {
    serviceRoleDirectDmlGrants: grantsClosed ? 0 : 1,
    serviceRoleDirectDmlIdempotency: ledgerClosed ? 0 : 1,
    grantsMutatedByVerifier: false,
    ledgerMutatedByVerifier: false,
  });
  if (!grantsClosed || !ledgerClosed) {
    throw new Error("service_role_direct_dml_contract_not_closed");
  }

  const stateUrl = `${BASE}/api/eve/official-consultant-control-panel/cases/${manifest.caseNormalId}/experience-state`;
  const getRes = await fetch(stateUrl, {
    headers: { Authorization: `Bearer ${authA.token}` },
  });
  const getBody = await getRes.json();
  const supportQueue = getBody?.supportQueue ?? getBody?.data?.supportQueue ?? [];
  const supportItem =
    supportQueue.find((item) => item.screenKey === "workmap") ?? supportQueue[0];
  const capabilityMatrix = getBody?.capabilities ?? getBody?.data?.capabilities ?? null;
  const sendCap = resolveCapability(capabilityMatrix, "send_support_message");

  writeJson("02-get-experience-state.json", {
    httpStatus: getRes.status,
    supportItemPresent: Boolean(supportItem),
    capabilitySendSupportMessage: sendCap,
    canonicalLocation: "GET experience-state.capabilities (CapabilityVM[])",
    grantsMutatedByVerifier: false,
  });

  if (!getRes.ok || !supportItem) throw new Error("precondition_get_failed");
  if (!sendCap.found || sendCap.allowed !== true) {
    throw new Error(
      "capability_send_support_message_not_allowed:re-run_seed_provisioning",
    );
  }

  const priorActions = await countActions(admin, manifest.caseNormalId);
  const preActionCount = priorActions.length;
  const lastActionId = priorActions[0]?.id ?? null;
  const lastOccurredAt = priorActions[0]?.created_at ?? null;

  writeJson("03-pre-state.json", {
    preActionCount,
    lastActionId,
    lastOccurredAt,
  });

  const idempotencyKey = randomUUID();
  const postPayload = {
    userId: supportItem.userId ?? manifest.participantUserId,
    screenKey: supportItem.screenKey,
    actionType: "send_message",
    reasonCode: "help_orientation",
    beforeState: supportItem.beforeState ?? supportItem.source ?? "support_requested",
    expectedEffect: "Orientación sin cambio de evidencia",
    roleRuntimeSessionId: supportItem.roleRuntimeSessionId ?? null,
    activityId: supportItem.activityId ?? null,
    idempotencyKey,
  };

  const postUrl = `${BASE}/api/eve/official-consultant-control-panel/cases/${manifest.caseNormalId}/experience-actions`;
  const postRes = await postAction(postUrl, authA.token, postPayload);
  writeJson("04-post-experience-actions.json", {
    httpStatus: postRes.status,
    ok: Boolean(postRes.body?.ok),
    actionId: postRes.body?.actionId ?? postRes.body?.action?.id ?? null,
    requestId: postRes.body?.requestId ?? null,
    code: postRes.body?.code ?? null,
  });

  if (postRes.status < 200 || postRes.status >= 300 || postRes.body?.ok !== true) {
    throw new Error(`post_failed:${postRes.status}:${postRes.body?.code ?? "unknown"}`);
  }

  const actionId = postRes.body?.actionId ?? postRes.body?.action?.id;
  const responseRequestId = postRes.body?.requestId;
  if (!actionId || !responseRequestId) throw new Error("post_missing_action_or_request_id");

  const afterActions = await countActions(admin, manifest.caseNormalId);
  const matched = afterActions.find(
    (row) =>
      row.id === actionId &&
      row.request_id === responseRequestId &&
      row.action_type === "send_message" &&
      row.actor_id === authA.userId &&
      row.user_id === (supportItem.userId ?? manifest.participantUserId) &&
      row.screen_key === supportItem.screenKey,
  );
  writeJson("05-post-readback.json", {
    postActionCount: afterActions.length,
    expectedCount: preActionCount + 1,
    matchedActionId: Boolean(matched),
    matchedRequestId: matched?.request_id === responseRequestId,
    timestampAfterPrior:
      !lastOccurredAt ||
      (matched?.created_at && matched.created_at >= lastOccurredAt),
  });

  if (!matched) throw new Error("action_not_found_by_actionId_requestId");
  if (afterActions.length !== preActionCount + 1) {
    throw new Error(`action_count_not_plus_one:${afterActions.length}`);
  }

  const replay = await postAction(postUrl, authA.token, postPayload);
  const afterReplay = await countActions(admin, manifest.caseNormalId);
  writeJson("05b-idempotency-replay.json", {
    httpStatus: replay.status,
    sameActionId:
      (replay.body?.actionId ?? replay.body?.action?.id) === actionId,
    countUnchanged: afterReplay.length === afterActions.length,
  });
  if (replay.status !== 200) throw new Error(`idempotent_replay_failed:${replay.status}`);
  if ((replay.body?.actionId ?? replay.body?.action?.id) !== actionId) {
    throw new Error("idempotent_replay_action_id_mismatch");
  }
  if (afterReplay.length !== afterActions.length) {
    throw new Error("idempotent_replay_created_extra_action");
  }

  const conflict = await postAction(postUrl, authA.token, {
    ...postPayload,
    reasonCode: "different_reason_for_conflict",
  });
  writeJson("05c-idempotency-conflict.json", {
    httpStatus: conflict.status,
    code: conflict.body?.code ?? conflict.body?.error ?? null,
  });
  const conflictCode = conflict.body?.code ?? conflict.body?.error;
  if (conflict.status !== 409 || conflictCode !== "IDEMPOTENCY_CONFLICT") {
    throw new Error(
      `expected_idempotency_conflict:${conflict.status}:${conflictCode}`,
    );
  }

  const badBefore = await postAction(postUrl, authA.token, {
    ...postPayload,
    idempotencyKey: randomUUID(),
    beforeState: "not_a_valid_machine_state_xyz",
    reasonCode: "bad_before",
  });

  // No-grant principal (Consultor C): provisioned with assignment but without send_support_message.
  // Verifier must not disable grants — C is pre-seeded without the cap.
  const deniedCap = await postAction(postUrl, authC.token, {
    ...postPayload,
    idempotencyKey: randomUUID(),
    reasonCode: "cap_absent_c",
  });

  const asB = await postAction(postUrl, authB.token, {
    ...postPayload,
    idempotencyKey: randomUUID(),
  });

  writeJson("06-negatives.json", {
    incompatibleBeforeState: {
      httpStatus: badBefore.status,
      code: badBefore.body?.code ?? badBefore.body?.error ?? null,
      expected: "422",
    },
    capabilityAbsentConsultorC: {
      httpStatus: deniedCap.status,
      code: deniedCap.body?.code ?? deniedCap.body?.error ?? null,
      expected: "403",
      note: "pre-provisioned without send_support_message; verifier did not mutate grants",
    },
    consultantB: {
      httpStatus: asB.status,
      code: asB.body?.code ?? asB.body?.error ?? null,
      expected: "403 or 404",
    },
  });

  if (badBefore.status !== 422) {
    throw new Error(`unexpected_bad_before_status:${badBefore.status}`);
  }
  if (deniedCap.status !== 403) {
    throw new Error(`unexpected_capability_denied_status:${deniedCap.status}`);
  }
  if (![403, 404].includes(asB.status)) {
    throw new Error(`unexpected_consultant_b_status:${asB.status}`);
  }

  writeJson("07-chain-summary.json", {
    ok: true,
    capabilityExplicit: true,
    readbackByActionIdRequestId: true,
    idempotency: true,
    grantsMutatedByVerifier: false,
    serviceRoleDirectDmlGrants: 0,
    automaticMutationCapabilityGrants: 0,
    hashProbe: createHash("sha256").update(idempotencyKey).digest("hex").slice(0, 8),
  });

  console.log(JSON.stringify({ ok: true, diagnostics: DIAG_DIR }));
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
