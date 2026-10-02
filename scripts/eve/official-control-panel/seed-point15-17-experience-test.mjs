#!/usr/bin/env node
/**
 * §§15–17 OpVal — aprovisionamiento test-only (identidades, casos, grants canónicos).
 * Nunca Amber. Termina escribiendo reports/local/rector-points-15-17/manifest.json.
 *
 * Grants vía RPC administrativa `eve_grant_consultant_panel_capability` (no DML directo).
 * Consultor C: assignment activo SIN `send_support_message` (negativo 403 del verificador).
 *
 * El verificador `verify-point15-17-action-chain.mjs` NO debe llamar este script
 * ni mutar grants — ejecutar este seed primero, luego el verificador.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "../../..");
const MANIFEST_DIR = resolve(projectRoot, "reports/local/rector-points-15-17");
const MANIFEST_PATH = resolve(MANIFEST_DIR, "manifest.json");
const AMBER_CASE = "19fc9eff-4219-43f0-854c-e2b3350f23f2";

const IDS = {
  company: "a1500015-0000-4000-8000-000000000001",
  relationship: "a1500015-0000-4000-8000-000000000002",
  caseNormal: "a1500015-0000-4000-8000-000000000003",
  caseBlocked: "a1500015-0000-4000-8000-000000000004",
  assignA: "a1500015-0000-4000-8000-00000000000b",
  assignC: "a1500015-0000-4000-8000-00000000000c",
  usuario: "a1500015-0000-4000-8000-000000000005",
  participantUser: "a1500015-0000-4000-8000-000000000006",
};

const EMAIL_A = "point15-opval-a@example.invalid";
const EMAIL_B = "point15-opval-b@example.invalid";
const EMAIL_C = "point15-opval-c@example.invalid";
const EMAIL_ADMIN = "point15-opval-admin@example.invalid";

loadEnvLocal();
const env = resolveEnv();
const admin = createClient(env.supabaseUrl, env.serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

main().catch((error) => {
  console.error(
    JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }),
  );
  process.exitCode = 1;
});

async function main() {
  assertLocal(env.supabaseUrl);
  if (
    IDS.caseNormal === AMBER_CASE ||
    IDS.caseBlocked === AMBER_CASE
  ) {
    throw new Error("amber_seed_forbidden");
  }

  const userA = await ensureUser(EMAIL_A, env.password);
  const userB = await ensureUser(EMAIL_B, env.password);
  const userC = await ensureUser(EMAIL_C, env.password);
  const userAdmin = await ensureUser(EMAIL_ADMIN, env.password);
  runSql(buildStructureSql(userA, userB, userC));

  // Explicit capabilities via administrative RPC only (no direct grant DML).
  await mustGrant(userAdmin, userA, IDS.company, "send_support_message", "opval_seed_a_send");
  await mustGrant(userAdmin, userA, IDS.company, "request_reentry", "opval_seed_a_reentry");
  await mustGrant(userAdmin, userA, IDS.company, "mark_manual_review", "opval_seed_a_review");
  await mustGrant(userAdmin, userA, IDS.company, "view_experience_state", "opval_seed_a_view");
  await mustGrant(userAdmin, userC, IDS.company, "view_experience_state", "opval_seed_c_view_only");

  // Wipe prior OpVal experience rows (local test company only)
  runSql(`
begin;
set local session_replication_role = replica;
delete from public.experience_screen_event where company_id = '${IDS.company}';
delete from public.experience_support_action where company_id = '${IDS.company}';
set local session_replication_role = DEFAULT;
commit;
`);

  const sessionRef = `sess://${IDS.participantUser}`;
  const steps = [
    ["login_demo", "screen_entered"],
    ["login_demo", "screen_completed"],
    ["estado_a", "screen_entered"],
    ["estado_a", "screen_completed"],
    ["workmap", "screen_entered"],
    ["workmap", "screen_blocked"],
    ["workmap", "screen_error"],
    ["workmap", "screen_error"],
    ["significado", "screen_entered"],
    ["significado", "screen_abandoned"],
  ];

  for (const [screen, event] of steps) {
    await mustRpc("eve_record_experience_screen_event", {
      p_company_id: IDS.company,
      p_case_id: IDS.caseNormal,
      p_user_id: IDS.participantUser,
      p_screen_key: screen,
      p_event_type: event,
      p_request_id: randomUUID(),
      p_session_reference: sessionRef,
      p_actor_label: "point15_seed",
    });
  }

  await mustRpc("eve_apply_experience_support_action", {
    p_company_id: IDS.company,
    p_case_id: IDS.caseNormal,
    p_user_id: IDS.participantUser,
    p_screen_key: "workmap",
    p_action_type: "send_message",
    p_reason_code: "help_requested",
    p_before_state: "blocked",
    p_expected_effect: "orient_user",
    p_capability: "send_support_message",
    p_actor_id: userA,
    p_audit_ref: "audit://seed/send_message",
    p_request_id: randomUUID(),
  });

  await mustRpc("eve_apply_experience_support_action", {
    p_company_id: IDS.company,
    p_case_id: IDS.caseNormal,
    p_user_id: IDS.participantUser,
    p_screen_key: "workmap",
    p_action_type: "resume_link",
    p_reason_code: "return_link",
    p_before_state: "support_requested",
    p_expected_effect: "resume_same_screen",
    p_capability: "send_support_message",
    p_actor_id: userA,
    p_audit_ref: "audit://seed/resume_link",
    p_request_id: randomUUID(),
  });

  await mustRpc("eve_apply_experience_support_action", {
    p_company_id: IDS.company,
    p_case_id: IDS.caseNormal,
    p_user_id: IDS.participantUser,
    p_screen_key: "workmap",
    p_action_type: "request_reentry",
    p_reason_code: "authorized_reentry",
    p_before_state: "blocked",
    p_expected_effect: "reentry_flow",
    p_capability: "request_reentry",
    p_actor_id: userA,
    p_audit_ref: "audit://seed/reentry",
    p_request_id: randomUUID(),
  });

  await mustRpc("eve_apply_experience_support_action", {
    p_company_id: IDS.company,
    p_case_id: IDS.caseNormal,
    p_user_id: IDS.participantUser,
    p_screen_key: "workmap",
    p_action_type: "mark_manual_review",
    p_reason_code: "needs_review",
    p_before_state: "blocked",
    p_expected_effect: "enqueue_review",
    p_capability: "mark_manual_review",
    p_actor_id: userA,
    p_audit_ref: "audit://seed/review",
    p_request_id: randomUUID(),
  });

  const monitoringNormal =
    `/admin/official-consultant-control-panel?mode=user-experience-governance&view=journeys` +
    `&company=${IDS.company}&relationship=${IDS.relationship}&case=${IDS.caseNormal}`;
  const monitoringSupport =
    `/admin/official-consultant-control-panel?mode=user-experience-governance&view=support` +
    `&company=${IDS.company}&relationship=${IDS.relationship}&case=${IDS.caseNormal}`;
  const monitoringHealth =
    `/admin/official-consultant-control-panel?mode=user-experience-governance&view=screen_health` +
    `&company=${IDS.company}&relationship=${IDS.relationship}&case=${IDS.caseNormal}`;
  const monitoringBlocked =
    `/admin/official-consultant-control-panel?mode=user-experience-governance&view=journeys` +
    `&company=${IDS.company}&relationship=${IDS.relationship}&case=${IDS.caseBlocked}`;
  const monitoringAmber =
    `/admin/official-consultant-control-panel?mode=user-experience-governance&view=journeys` +
    `&company=5c08029f-15e9-4bbd-b13e-0ff4765e23b8&relationship=7c499a1c-31c6-4fc9-8b20-2fd8cdc57043&case=${AMBER_CASE}`;

  // Bloqueado fixture: critical path signals for §17.2 hierarchy
  await mustRpc("eve_record_experience_screen_event", {
    p_company_id: IDS.company,
    p_case_id: IDS.caseBlocked,
    p_user_id: IDS.participantUser,
    p_screen_key: "bloque_3",
    p_event_type: "screen_entered",
    p_request_id: randomUUID(),
    p_session_reference: `${sessionRef}:blocked`,
    p_actor_label: "point15_seed",
  });
  await mustRpc("eve_record_experience_screen_event", {
    p_company_id: IDS.company,
    p_case_id: IDS.caseBlocked,
    p_user_id: IDS.participantUser,
    p_screen_key: "bloque_3",
    p_event_type: "screen_blocked",
    p_request_id: randomUUID(),
    p_session_reference: `${sessionRef}:blocked`,
    p_actor_label: "point15_seed",
  });

  mkdirSync(MANIFEST_DIR, { recursive: true });
  writeFileSync(
    MANIFEST_PATH,
    JSON.stringify(
      {
        companyId: IDS.company,
        relationshipId: IDS.relationship,
        caseNormalId: IDS.caseNormal,
        caseBlockedId: IDS.caseBlocked,
        participantUserId: IDS.participantUser,
        consultants: {
          a: { email: EMAIL_A },
          b: { email: EMAIL_B },
          c: { email: EMAIL_C, note: "assignment_without_send_support_message" },
          admin: { email: EMAIL_ADMIN, note: "grant_actor_only" },
        },
        experienceJourneysUrl: monitoringNormal,
        experienceSupportUrl: monitoringSupport,
        experienceHealthUrl: monitoringHealth,
        experienceBlockedUrl: monitoringBlocked,
        amberExperienceUrl: monitoringAmber,
        amberCaseId: AMBER_CASE,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ ok: true, manifest: MANIFEST_PATH }));
}

async function mustRpc(name, args) {
  const { error } = await admin.rpc(name, args);
  if (error) throw new Error(`${name}:${error.message}`);
}

async function mustGrant(actorId, consultantId, companyId, capability, reason) {
  const { error } = await admin.rpc("eve_grant_consultant_panel_capability", {
    p_actor_user_id: actorId,
    p_consultant_user_id: consultantId,
    p_client_company_id: companyId,
    p_capability: capability,
    p_reason: reason,
    p_valid_from: new Date().toISOString(),
    p_valid_until: null,
  });
  if (error) throw new Error(`eve_grant_consultant_panel_capability:${capability}:${error.message}`);
}

function buildStructureSql(userA, userB, userC) {
  return `
begin;
insert into public.empresas (id, nombre)
values ('${IDS.company}', 'Empresa Point15-17 OpVal')
on conflict (id) do update set nombre = excluded.nombre;

insert into public.usuarios (id, empresa_id, email, auth_user_id)
values (
  '${IDS.usuario}', '${IDS.company}', 'point15-opval-participant@example.invalid', null
)
on conflict (id) do update set empresa_id = excluded.empresa_id, email = excluded.email;

insert into public.consultant_company_assignments (
  id, consultant_user_id, client_company_id, status, valid_from, valid_until, created_by
) values (
  '${IDS.assignA}', '${userA}', '${IDS.company}', 'enabled', now() - interval '1 day', null, '${userA}'
)
on conflict (id) do update set
  consultant_user_id = excluded.consultant_user_id,
  status = 'enabled',
  valid_until = null;

-- Consultor C: scope on company, but without send_support_message (capability-denied fixture).
insert into public.consultant_company_assignments (
  id, consultant_user_id, client_company_id, status, valid_from, valid_until, created_by
) values (
  '${IDS.assignC}', '${userC}', '${IDS.company}', 'enabled', now() - interval '1 day', null, '${userA}'
)
on conflict (id) do update set
  consultant_user_id = excluded.consultant_user_id,
  status = 'enabled',
  valid_until = null;

update public.consultant_company_assignments
set status = 'disabled', valid_until = now()
where consultant_user_id = '${userB}'
  and client_company_id = '${IDS.company}';

insert into public.client_relationships (
  id, client_company_id, display_name, status, valid_from, valid_until, created_by
) values (
  '${IDS.relationship}', '${IDS.company}', 'Relación Point15-17 OpVal', 'enabled',
  now() - interval '1 day', null, '${userA}'
)
on conflict (id) do update set status = 'enabled', display_name = excluded.display_name;

insert into public.sesiones_llenado (
  id, usuario_id, estado_actual, client_company_id, client_relationship_id, display_name
) values
(
  '${IDS.caseNormal}', '${IDS.usuario}', 'en_progreso', '${IDS.company}', '${IDS.relationship}',
  'Caso Point15-17 OpVal Normal'
),
(
  '${IDS.caseBlocked}', '${IDS.usuario}', 'en_progreso', '${IDS.company}', '${IDS.relationship}',
  'Caso Point15-17 OpVal Bloqueado'
)
on conflict (id) do update set
  client_company_id = excluded.client_company_id,
  client_relationship_id = excluded.client_relationship_id,
  display_name = excluded.display_name;

-- Capabilities are granted only via eve_grant_consultant_panel_capability (not SQL DML).

commit;
`;
}

async function ensureUser(email, password) {
  const list = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = list.data?.users?.find((u) => u.email === email);
  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, { password });
    return existing.id;
  }
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (created.error) throw created.error;
  return created.data.user.id;
}

function runSql(sql) {
  const result = spawnSync(
    "docker",
    [
      "exec",
      "-i",
      "supabase_db_eve-platform",
      "psql",
      "-v",
      "ON_ERROR_STOP=1",
      "-U",
      "postgres",
      "-d",
      "postgres",
    ],
    { encoding: "utf8", input: sql },
  );
  if (result.status !== 0) {
    throw new Error(`sql_failed:${result.stderr || result.stdout || "unknown"}`);
  }
}

function resolveEnv() {
  const supabaseUrl = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ""
  ).trim();
  let serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!serviceRoleKey) {
    const status = spawnSync("npx", ["supabase", "status", "-o", "env"], {
      cwd: projectRoot,
      encoding: "utf8",
      shell: true,
    });
    const m = /SERVICE_ROLE_KEY=(.+)/.exec(
      `${status.stdout || ""}\n${status.stderr || ""}`,
    );
    if (!m) throw new Error("missing_service_role_key");
    serviceRoleKey = m[1].trim().replace(/^"|"$/g, "");
  }
  const password = (process.env.EVE_UNIT2B_TEST_PASSWORD || "").trim();
  if (!supabaseUrl || !password) throw new Error("env_incomplete");
  return { supabaseUrl, serviceRoleKey, password };
}

function assertLocal(url) {
  const host = new URL(url).hostname.toLowerCase();
  if (host !== "127.0.0.1" && host !== "localhost") {
    throw new Error("remote_supabase_url_rejected");
  }
}

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(projectRoot, ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
    }
  } catch {
    /* optional */
  }
}
