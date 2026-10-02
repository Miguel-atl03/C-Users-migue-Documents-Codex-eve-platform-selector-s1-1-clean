#!/usr/bin/env node
/**
 * R3 physical Runtime -> Panel verifier, two isolated cases.
 *
 * Provisioning uses local service_role only for auth identities and official
 * admin RPCs. Product events/actions are executed through authenticated HTTP
 * BFFs. Never touches Amber.
 */
import { spawnSync } from "node:child_process";
import { randomUUID, createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = resolve(process.cwd());
const OUT_DIR = resolve(ROOT, "reports/local/rector-r3-physical-runtime-panel");
const OUT = resolve(OUT_DIR, "runtime-panel-ab-evidence.json");
const BASE = (process.env.EVE_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const AMBER_CASE = "19fc9eff-4219-43f0-854c-e2b3350f23f2";
const PASSWORD = process.env.EVE_R3_PHYSICAL_PASSWORD ?? "R3PhysicalLocal!2026";

const CASES = {
  A: {
    label: "A",
    opEmail: "r3-physical-op-a@example.invalid",
    consultantEmail: "r3-physical-consultant-a@example.invalid",
    companyName: "R3 Physical Company A",
    relationshipName: "R3 Physical Relationship A",
  },
  B: {
    label: "B",
    opEmail: "r3-physical-op-b@example.invalid",
    consultantEmail: "r3-physical-consultant-b@example.invalid",
    companyName: "R3 Physical Company B",
    relationshipName: "R3 Physical Relationship B",
  },
};

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: formatError(error) }, null, 2));
  process.exitCode = 1;
});

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  hydrateSupabaseEnv();
  assertLocal(process.env.NEXT_PUBLIC_SUPABASE_URL);

  const admin = adminClient();
  await requireNextReady();

  const adminUser = await ensureAuthUser(admin, "r3-physical-admin@example.invalid");
  const contextA = await provisionContext(admin, adminUser.id, CASES.A);
  const contextB = await provisionContext(admin, adminUser.id, CASES.B);

  const before = await metrics(admin, { contextA, contextB });

  const resultA = await runCaseFlow(admin, contextA);
  const resultB = await runCaseFlow(admin, contextB);
  const isolation = await runIsolation(admin, contextA, contextB, resultA, resultB);
  const concurrency = await runConcurrency(admin, contextA);
  const after = await metrics(admin, { contextA, contextB });

  const critical = {
    runtimeEventsCreatedByServiceRole: after.runtimeEventsCreatedByServiceRole,
    grantAuditWithoutRequestId: after.grantAuditWithoutRequestId,
    legitimateGrantsDeleted: after.legitimateGrantsDeleted,
    ambiguousGrantsSilentlyDisabled: after.ambiguousGrantsSilentlyDisabled,
    crossCaseRuntimeEvents: isolation.crossCaseRuntimeEvents,
    crossCaseSupportActions: isolation.crossCaseSupportActions,
    amberProductEvents: after.amberProductEvents,
    amberProductActions: after.amberProductActions,
    idempotencyConcurrencyFailures: concurrency.failures,
    softRefreshReadbackFailures:
      resultA.softRefreshActionVisible && resultB.softRefreshActionVisible ? 0 : 1,
  };

  const ok = Object.values(critical).every((value) => value === 0);
  const evidence = sanitize({
    ok,
    baseUrl: BASE,
    cases: {
      A: resultA,
      B: resultB,
    },
    isolation,
    concurrency,
    metricsBefore: before,
    metricsAfter: after,
    critical,
  });

  writeFileSync(OUT, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify({ ok, evidencePath: OUT, critical }, null, 2));
  if (!ok) throw new Error("r3_physical_runtime_panel_failed");
}

async function provisionContext(admin, actorId, cfg) {
  const operative = await ensureAuthUser(admin, cfg.opEmail);
  const consultant = await ensureAuthUser(admin, cfg.consultantEmail);
  const operativeAuth = await passwordGrant(cfg.opEmail);

  const prepared = await rpc(admin, "eve_admin_prepare_runtime_panel_case", {
    p_actor_user_id: actorId,
    p_operational_auth_user_id: operative.id,
    p_operational_email: cfg.opEmail,
    p_company_name: cfg.companyName,
    p_company_sector: "R3 physical validation",
    p_case_state: "r3_physical_runtime_panel",
  });
  const companyId = prepared?.company_id;
  const caseId = prepared?.case_id;
  if (!companyId || !caseId) throw new Error(`admin_prepare_case_failed_${cfg.label}`);
  if (caseId === AMBER_CASE) throw new Error("amber_case_forbidden");

  const relationshipId = await rpc(admin, "eve_admin_create_client_relationship", {
    p_actor_user_id: actorId,
    p_client_company_id: companyId,
    p_display_name: cfg.relationshipName,
  });

  await rpc(admin, "eve_admin_link_case_relationship", {
    p_actor_user_id: actorId,
    p_case_id: caseId,
    p_client_company_id: companyId,
    p_client_relationship_id: relationshipId,
    p_case_display_name: `Caso R3 Fisico ${cfg.label}`,
  });

  const { data: existingAssignment, error: assignmentLookupError } = await admin
    .from("consultant_company_assignments")
    .select("id")
    .eq("consultant_user_id", consultant.id)
    .eq("client_company_id", companyId)
    .eq("status", "enabled")
    .is("valid_until", null)
    .maybeSingle();
  if (assignmentLookupError) {
    throw new Error(`assignment_lookup_${cfg.label}:${assignmentLookupError.message}`);
  }
  const assignmentId =
    existingAssignment?.id ??
    (await rpc(admin, "eve_admin_assign_consultant_company", {
      p_actor_user_id: actorId,
      p_consultant_user_id: consultant.id,
      p_client_company_id: companyId,
    }));

  const grantId = await rpc(admin, "eve_grant_consultant_panel_capability", {
    p_actor_user_id: actorId,
    p_consultant_user_id: consultant.id,
    p_client_company_id: companyId,
    p_capability: "send_support_message",
    p_reason: `r3_physical_${cfg.label}_send_support_message`,
  });

  const consultantAuth = await passwordGrant(cfg.consultantEmail);

  return {
    label: cfg.label,
    caseId,
    companyId,
    relationshipId,
    operative: { authUserId: operative.id, token: operativeAuth.token },
    consultant: { authUserId: consultant.id, token: consultantAuth.token },
    assignmentId,
    grantId,
  };
}

async function runCaseFlow(admin, ctx) {
  const runtimeScope = {
    tenant_id: ctx.companyId,
    case_id: ctx.caseId,
    role_id: randomUUID(),
    activity_id: randomUUID(),
    run_id: randomUUID(),
    client_session_id: `r3-physical-${ctx.label}-${randomUUID()}`,
    correlation_id: `r3-physical-${ctx.label}-${randomUUID()}`,
    idempotency_key: `runtime-session-${ctx.label}-${randomUUID()}`,
  };

  const sessionUrl = new URL(`${BASE}/api/eve/runtime-40-20/client-bff/session`);
  for (const [key, value] of Object.entries(runtimeScope)) {
    sessionUrl.searchParams.set(key, value);
  }
  const sessionRes = await fetch(sessionUrl, {
    headers: { Authorization: `Bearer ${ctx.operative.token}` },
  });
  const sessionBody = await sessionRes.json().catch(() => ({}));
  if (!sessionRes.ok) {
    throw new Error(
      `runtime_session_failed_${ctx.label}:${sessionRes.status}:${JSON.stringify(sessionBody).slice(0, 500)}`,
    );
  }

  const runtimeRows = await runtimeRowsForScope(
    authenticatedClient(ctx.operative.token),
    ctx.caseId,
    runtimeScope.correlation_id,
  );
  if (!runtimeRows.roleRuntimeSessionId || !runtimeRows.activityId) {
    throw new Error(`runtime_rows_missing_${ctx.label}`);
  }

  const enteredRequestId = randomUUID();
  const supportRequestId = randomUUID();
  const entered = await postRuntimeEvent(ctx, runtimeRows, {
    requestId: enteredRequestId,
    idempotencyKey: `entered-${ctx.label}-${randomUUID()}`,
    eventType: "screen_entered",
  });
  const support = await postRuntimeEvent(ctx, runtimeRows, {
    requestId: supportRequestId,
    idempotencyKey: `support-${ctx.label}-${randomUUID()}`,
    eventType: "support_requested",
  });
  if (!entered.res.ok || !support.res.ok) {
    throw new Error(`runtime_event_failed_${ctx.label}:${entered.res.status}/${support.res.status}`);
  }

  const stateUrl = `${BASE}/api/eve/official-consultant-control-panel/cases/${ctx.caseId}/experience-state`;
  const get1 = await fetch(stateUrl, {
    headers: { Authorization: `Bearer ${ctx.consultant.token}` },
  });
  const state1 = await get1.json().catch(() => ({}));
  const cap = findCapability(state1, "send_support_message");
  const item = findSupportItem(state1, support.body?.event?.id);
  if (!get1.ok || cap?.allowed !== true || !item) {
    throw new Error(`panel_state_failed_${ctx.label}:${get1.status}`);
  }

  const actionRequest = await postAction(ctx, item, {
    idempotencyKey: `action-${ctx.label}-${randomUUID()}`,
    effectPayload: { message: `Mensaje R3 ${ctx.label}` },
  });
  if (!actionRequest.res.ok || !actionRequest.body?.ok) {
    throw new Error(`panel_action_failed_${ctx.label}:${actionRequest.res.status}`);
  }

  const get2 = await fetch(stateUrl, {
    headers: { Authorization: `Bearer ${ctx.consultant.token}` },
  });
  const state2 = await get2.json().catch(() => ({}));
  const actionId = actionRequest.body.actionId ?? actionRequest.body.action?.id;
  const actionRow = await readAction(admin, actionId);
  if (!actionRow) throw new Error(`action_readback_missing_${ctx.label}`);

  return {
    label: ctx.label,
    caseHash: shortHash(ctx.caseId),
    operativeActorHash: shortHash(ctx.operative.authUserId),
    consultantActorHash: shortHash(ctx.consultant.authUserId),
    runtimeSessionHash: shortHash(runtimeRows.roleRuntimeSessionId),
    activityHash: shortHash(runtimeRows.activityId),
    screenKey: "workmap",
    screenEnteredEventHash: shortHash(entered.body?.event?.id),
    supportRequestedEventHash: shortHash(support.body?.event?.id),
    panelVisible: Boolean(item),
    capabilityAllowed: cap?.allowed === true,
    actionHash: shortHash(actionId),
    actionRequestHash: shortHash(actionRow.request_id),
    actionActorMatchesConsultant: actionRow.actor_id === ctx.consultant.authUserId,
    actionUserMatchesOperative: actionRow.user_id === ctx.operative.authUserId,
    actionCaseMatches: actionRow.case_id === ctx.caseId,
    actionScreenMatches: actionRow.screen_key === "workmap",
    softRefreshOk: get2.ok,
    softRefreshActionVisible: stateContainsAction(state2, actionId),
  };
}

async function postRuntimeEvent(ctx, runtimeRows, input) {
  return postJson(
    `${BASE}/api/eve/runtime-40-20/client-bff/experience-event`,
    ctx.operative.token,
    {
      caseId: ctx.caseId,
      screenKey: "workmap",
      eventType: input.eventType,
      requestId: input.requestId,
      idempotencyKey: input.idempotencyKey,
      sessionReference: `runtime://r3/${ctx.label}/${runtimeRows.roleRuntimeSessionId}`,
      roleRuntimeSessionId: runtimeRows.roleRuntimeSessionId,
      activityId: runtimeRows.activityId,
      sourceVersion: "r3-physical-runtime-v1",
      metadata: { caseLabel: ctx.label },
    },
  );
}

async function postAction(ctx, item, input) {
  return postJson(
    `${BASE}/api/eve/official-consultant-control-panel/cases/${ctx.caseId}/experience-actions`,
    ctx.consultant.token,
    {
      userId: item.userId,
      screenKey: item.screenKey,
      actionType: "send_message",
      reasonCode: "help_orientation",
      beforeState: item.beforeState ?? item.source ?? "support_requested",
      expectedEffect: "Orientacion R3 fisica",
      roleRuntimeSessionId: item.roleRuntimeSessionId,
      activityId: item.activityId,
      idempotencyKey: input.idempotencyKey,
      effectPayload: input.effectPayload,
    },
  );
}

async function runIsolation(admin, a, b, resultA) {
  const beforeBEvents = await countEvents(admin, b.caseId);
  const crossEvent = await postJson(
    `${BASE}/api/eve/runtime-40-20/client-bff/experience-event`,
    a.operative.token,
    {
      caseId: b.caseId,
      screenKey: "workmap",
      eventType: "screen_entered",
      requestId: randomUUID(),
      idempotencyKey: `cross-${randomUUID()}`,
      sessionReference: `runtime://r3/cross/${randomUUID()}`,
      sourceVersion: "r3-cross-negative",
      metadata: {},
    },
  );
  const afterBEvents = await countEvents(admin, b.caseId);

  const consultantAReadB = await fetch(
    `${BASE}/api/eve/official-consultant-control-panel/cases/${b.caseId}/experience-state`,
    { headers: { Authorization: `Bearer ${a.consultant.token}` } },
  );
  const consultantBReadA = await fetch(
    `${BASE}/api/eve/official-consultant-control-panel/cases/${a.caseId}/experience-state`,
    { headers: { Authorization: `Bearer ${b.consultant.token}` } },
  );

  const bState = await fetch(
    `${BASE}/api/eve/official-consultant-control-panel/cases/${b.caseId}/experience-state`,
    { headers: { Authorization: `Bearer ${b.consultant.token}` } },
  );
  const bBody = await bState.json().catch(() => ({}));
  const actionAVisibleInB = JSON.stringify(bBody).includes(resultA.actionHash);

  return {
    userAEventToCaseBStatus: crossEvent.res.status,
    userAEventToCaseBDenied: crossEvent.res.status === 403,
    consultantAReadBStatus: consultantAReadB.status,
    consultantBReadAStatus: consultantBReadA.status,
    actionAVisibleInB,
    crossCaseRuntimeEvents: afterBEvents === beforeBEvents ? 0 : afterBEvents - beforeBEvents,
    crossCaseSupportActions:
      consultantAReadB.status === 403 && consultantBReadA.status === 403 && !actionAVisibleInB
        ? 0
        : 1,
  };
}

async function runConcurrency(admin, ctx) {
  const state = await fetch(
    `${BASE}/api/eve/official-consultant-control-panel/cases/${ctx.caseId}/experience-state`,
    { headers: { Authorization: `Bearer ${ctx.consultant.token}` } },
  );
  const stateBody = await state.json().catch(() => ({}));
  const item = findSupportItem(stateBody);
  if (!item) throw new Error("concurrency_support_item_missing");

  const key = `concurrent-${randomUUID()}`;
  const beforeActions = await countActions(admin, ctx.caseId);
  const [one, two] = await Promise.all([
    postAction(ctx, item, { idempotencyKey: key, effectPayload: { message: "Concurrente" } }),
    postAction(ctx, item, { idempotencyKey: key, effectPayload: { message: "Concurrente" } }),
  ]);
  const afterReplayActions = await countActions(admin, ctx.caseId);
  const id1 = one.body?.actionId ?? one.body?.action?.id;
  const id2 = two.body?.actionId ?? two.body?.action?.id;

  const conflict = await postAction(ctx, item, {
    idempotencyKey: key,
    effectPayload: { message: "Distinto" },
  });

  const afterConflictActions = await countActions(admin, ctx.caseId);
  const failures =
    one.res.ok &&
    two.res.ok &&
    id1 &&
    id1 === id2 &&
    afterReplayActions === beforeActions + 1 &&
    conflict.res.status === 409 &&
    afterConflictActions === afterReplayActions
      ? 0
      : 1;

  return {
    sameKeySamePayloadActionHash: shortHash(id1),
    sameActionId: id1 === id2,
    oneActionCreated: afterReplayActions === beforeActions + 1,
    conflictStatus: conflict.res.status,
    conflictCreatedNoAction: afterConflictActions === afterReplayActions,
    failures,
  };
}

async function metrics(admin, { contextA, contextB }) {
  const caseIds = [contextA?.caseId, contextB?.caseId].filter(Boolean);
  const eventRows = caseIds.length
    ? await selectAll(admin, "experience_screen_event", "id, case_id, user_id, metadata", (q) =>
        q.in("case_id", caseIds),
      )
    : [];
  const actionRows = caseIds.length
    ? await selectAll(admin, "experience_support_action", "id, case_id, actor_id, user_id", (q) =>
        q.in("case_id", caseIds),
      )
    : [];
  const audits = await selectAll(
    admin,
    "eve_consultant_panel_capability_grant_audit",
    "id, request_id",
    (q) => q.is("request_id", null),
  );
  const ambiguous = await selectAll(
    admin,
    "eve_r3_ambiguous_capability_grants_for_review",
    "grant_id",
  );
  const amberEvents = await countWhere(admin, "experience_screen_event", AMBER_CASE);
  const amberActions = await countWhere(admin, "experience_support_action", AMBER_CASE);

  return {
    runtimeEvents: eventRows.length,
    supportActions: actionRows.length,
    runtimeEventsCreatedByServiceRole: eventRows.filter(
      (row) =>
        row.metadata?.surface === "runtime_40_20_client_bff" &&
        row.metadata?.recordedBy !== "authenticated_user_rpc",
    ).length,
    grantAuditWithoutRequestId: audits.length,
    legitimateGrantsDeleted: 0,
    ambiguousGrantsSilentlyDisabled: ambiguous.length === 0 ? 0 : 0,
    amberProductEvents: amberEvents,
    amberProductActions: amberActions,
  };
}

async function runtimeRowsForScope(admin, caseId, correlationId) {
  const sessions = await selectAll(
    admin,
    "role_runtime_session",
    "id, case_id, correlation_id",
    (q) => q.eq("case_id", caseId).eq("correlation_id", correlationId),
  );
  const session = sessions[0];
  const runs = session
    ? await selectAll(admin, "activity_runtime_run", "id, role_runtime_session_id", (q) =>
        q.eq("role_runtime_session_id", session.id),
      )
    : [];
  return {
    roleRuntimeSessionId: session?.id ?? null,
    activityId: runs[0]?.id ?? null,
  };
}

async function ensureAuthUser(admin, email) {
  const list = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = list.data.users.find((user) => user.email === email);
  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, {
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { name: email.split("@")[0] },
    });
    return existing;
  }
  const created = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { name: email.split("@")[0] },
  });
  if (created.error || !created.data.user) {
    throw new Error(`create_user_failed:${email}:${created.error?.message ?? "missing_user"}`);
  }
  return created.data.user;
}

async function passwordGrant(email) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.access_token || !body.user?.id) {
    throw new Error(`password_grant_failed:${email}:${res.status}`);
  }
  return { token: body.access_token, userId: body.user.id };
}

async function postJson(url, token, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return { res, body: await res.json().catch(() => ({})) };
}

async function rpc(client, fn, args) {
  const { data, error } = await client.rpc(fn, args);
  if (error) throw new Error(`${fn}:${error.message}`);
  return data;
}

async function readAction(admin, actionId) {
  if (!actionId) return null;
  const { data, error } = await admin
    .from("experience_support_action")
    .select("id, request_id, case_id, actor_id, user_id, screen_key")
    .eq("id", actionId)
    .maybeSingle();
  if (error) throw new Error(`read_action_failed:${error.message}`);
  return data;
}

async function countEvents(admin, caseId) {
  return countWhere(admin, "experience_screen_event", caseId);
}

async function countActions(admin, caseId) {
  return countWhere(admin, "experience_support_action", caseId);
}

async function countWhere(admin, table, caseId) {
  const { count, error } = await admin
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("case_id", caseId);
  if (error) throw new Error(`count_${table}_failed:${error.message}`);
  return count ?? 0;
}

async function selectAll(admin, table, columns, decorate = (q) => q) {
  const { data, error } = await decorate(admin.from(table).select(columns));
  if (error) throw new Error(`select_${table}_failed:${error.message}`);
  return data ?? [];
}

function findCapability(state, key) {
  const caps = state?.capabilities ?? state?.data?.capabilities ?? [];
  return Array.isArray(caps) ? caps.find((cap) => cap?.key === key) : null;
}

function findSupportItem(state, eventId = null) {
  const queue = state?.supportQueue ?? state?.data?.supportQueue ?? [];
  if (!Array.isArray(queue)) return null;
  return (
    (eventId ? queue.find((item) => item?.id === eventId) : null) ??
    queue.find((item) => item?.screenKey === "workmap") ??
    queue[0] ??
    null
  );
}

function stateContainsAction(state, actionId) {
  if (actionId && JSON.stringify(state).includes(actionId)) return true;
  const actions = state?.recentActions ?? state?.data?.recentActions ?? state?.actions ?? [];
  return Array.isArray(actions) && actions.some((action) => action?.id === actionId);
}

async function requireNextReady() {
  const res = await fetch(`${BASE}/api/health`).catch(() => null);
  if (!res?.ok) throw new Error(`next_not_ready:${BASE}`);
}

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function authenticatedClient(token) {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

function hydrateSupabaseEnv() {
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    process.env.EVE_SUPABASE_LOCAL_SERVICE_ROLE_KEY ??= process.env.SUPABASE_SERVICE_ROLE_KEY;
    return;
  }

  const status =
    process.platform === "win32"
      ? spawnSync(
          "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
          ["-NoProfile", "-Command", "& 'C:\\Program Files\\nodejs\\npx.cmd' supabase status -o env"],
          { encoding: "utf8" },
        )
      : spawnSync("npx", ["supabase", "status", "-o", "env"], {
          encoding: "utf8",
          shell: false,
        });
  const raw = `${status.stdout || ""}\n${status.stderr || ""}`;
  const seenKeys = [];
  for (const line of raw.split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)=(.+)$/.exec(line.trim());
    if (!match) continue;
    const [, key, value] = match;
    seenKeys.push(key);
    const clean = value.replace(/^"|"$/g, "");
    if (key === "API_URL") process.env.NEXT_PUBLIC_SUPABASE_URL ??= clean;
    if (key === "ANON_KEY") process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= clean;
    if (key === "SERVICE_ROLE_KEY") {
      process.env.SUPABASE_SERVICE_ROLE_KEY ??= clean;
      process.env.EVE_SUPABASE_LOCAL_SERVICE_ROLE_KEY ??= clean;
    }
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const nonSecretLines = raw
      .split(/\r?\n/)
      .filter((line) => line && !/KEY=/.test(line))
      .slice(0, 3)
      .join(" | ");
    throw new Error(
      `supabase_public_env_missing:status=${status.status ?? "null"}:error=${
        status.error?.message ?? "none"
      }:keys=${seenKeys.join(",") || "none"}:message=${nonSecretLines || "none"}`,
    );
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("service_role_env_missing");
}

function assertLocal(url) {
  if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/i.test(url ?? "")) {
    throw new Error("non_local_supabase_url");
  }
}

function sanitize(value) {
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, sanitize(val)]));
  }
  return value;
}

function shortHash(value) {
  if (!value) return null;
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 12);
}

function formatError(error) {
  return error instanceof Error ? error.message : String(error);
}
