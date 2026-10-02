#!/usr/bin/env node
/**
 * §13 operational seed (NOT Amber). Idempotent.
 * Creates Consultants A/B, case chain, and P-SUP-03/04/05 work items
 * exclusively via eve_apply_manual_work_transition after initial not_ready insert.
 *
 * Writes: reports/local/rector-point-13/manifest.json
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "../../..");
const MANIFEST_DIR = resolve(projectRoot, "reports/local/rector-point-13");
const MANIFEST_PATH = resolve(MANIFEST_DIR, "manifest.json");

const AMBER_CASE = "19fc9eff-4219-43f0-854c-e2b3350f23f2";

const IDS = {
  company: "a1300013-0000-4000-8000-000000000001",
  relationship: "a1300013-0000-4000-8000-000000000002",
  caseId: "a1300013-0000-4000-8000-000000000003",
  assignA: "a1300013-0000-4000-8000-00000000000b",
  assignB: "a1300013-0000-4000-8000-00000000000c",
  work03: "a1300013-0000-4000-8000-000000000031",
  work04: "a1300013-0000-4000-8000-000000000041",
  work05: "a1300013-0000-4000-8000-000000000051",
};

const EMAIL_A = "point13-opval-a@example.invalid";
const EMAIL_B = "point13-opval-b@example.invalid";

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
  if (IDS.caseId === AMBER_CASE) throw new Error("amber_seed_forbidden");

  const userA = await ensureUser(EMAIL_A, env.password);
  const userB = await ensureUser(EMAIL_B, env.password);
  runSql(buildStructureSql(userA, userB));

  // Append-only history: deactivate prior current rows and open fresh starters
  // via postgres + governed GUC (service_role has no direct DML).
  const work03 = cryptoRandomUuid();
  const work04 = cryptoRandomUuid();
  const work05 = cryptoRandomUuid();
  IDS.work03 = work03;
  IDS.work04 = work04;
  IDS.work05 = work05;

  runSql(`
begin;
select set_config('eve.manual_work_rpc', '1', true);
update public.manual_process_work_item
set is_current = false, updated_at = now()
where case_id = '${IDS.caseId}' and is_current;
${starterInsertSql(work03, "P-SUP-03", "EvidenceBundle", "ReadyForTransduction", "EscenaEvidencial", "Validated")}
${starterInsertSql(work04, "P-SUP-04", "EscenaEvidencial", "Validated", "PeliculaCausalAgregada", "Aggregated")}
${starterInsertSql(work05, "P-SUP-05", "PeliculaCausalAgregada", "Aggregated", "DiagnosticoExpertoFinal", "Delivered")}
commit;
`);

  const futureDue = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
  const overdueDue = new Date(Date.now() - 36 * 3600 * 1000).toISOString();

  // P-SUP-03 → in_manual_work (with review detour in history)
  await transition(IDS.work03, "ready_to_start", "work_ready");
  await transition(IDS.work03, "downloaded", "artifact_downloaded");
  await transition(IDS.work03, "in_manual_work", "manual_work_started");
  await transition(IDS.work03, "submitted", "output_submitted", {
    p_artifact_ref: "artifact://p-sup-03/v1",
  });
  await transition(IDS.work03, "review_required", "review_requested", {
    p_reason: "Ajuste de cobertura por rol",
  });
  await transition(IDS.work03, "in_manual_work", "manual_work_started", {
    p_reason: "Reanudación tras ajuste",
  });

  // P-SUP-04 → submitted + handoff pending (future)
  await transition(IDS.work04, "ready_to_start", "work_ready");
  await transition(IDS.work04, "downloaded", "artifact_downloaded");
  await transition(IDS.work04, "in_manual_work", "manual_work_started");
  await transition(IDS.work04, "submitted", "output_submitted", {
    p_artifact_ref: "artifact://p-sup-04/v1",
    p_after_handoff_status: "pending",
    p_expected_event: "handoff_agregacion_causal",
    p_expected_handoff_at: futureDue,
    p_handoff_origin: "Experto transducción",
    p_handoff_destination: "Experto agregación",
  });

  // P-SUP-05 → submitted + handoff overdue
  await transition(IDS.work05, "ready_to_start", "work_ready");
  await transition(IDS.work05, "downloaded", "artifact_downloaded");
  await transition(IDS.work05, "in_manual_work", "manual_work_started");
  await transition(IDS.work05, "submitted", "output_submitted", {
    p_artifact_ref: "artifact://p-sup-05/v1",
    p_after_handoff_status: "pending",
    p_expected_event: "handoff_sintesis_experta",
    p_expected_handoff_at: overdueDue,
    p_handoff_origin: "Experto agregación",
    p_handoff_destination: "Experto síntesis",
  });

  // Amber must remain empty
  const { data: amberRows } = await admin
    .from("manual_process_work_item")
    .select("id")
    .eq("case_id", AMBER_CASE)
    .eq("is_current", true);

  const manifest = {
    ok: true,
    companyId: IDS.company,
    relationshipId: IDS.relationship,
    caseId: IDS.caseId,
    workItems: {
      "P-SUP-03": IDS.work03,
      "P-SUP-04": IDS.work04,
      "P-SUP-05": IDS.work05,
    },
    consultants: {
      a: { email: EMAIL_A, userId: userA },
      b: { email: EMAIL_B, userId: userB },
    },
    amberCurrentCount: amberRows?.length ?? 0,
    trackingUrl:
      `/admin/official-consultant-control-panel` +
      `?mode=client-company&view=tracking` +
      `&company=${IDS.company}` +
      `&relationship=${IDS.relationship}` +
      `&case=${IDS.caseId}`,
  };

  mkdirSync(MANIFEST_DIR, { recursive: true });
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify(manifest));
}

function starterInsertSql(
  id,
  processCode,
  sourceObject,
  sourceState,
  expectedObject,
  expectedState,
) {
  return `
insert into public.manual_process_work_item (
  id, company_id, case_id, process_code,
  manual_tracking_status, handoff_status, is_current, opened_at,
  responsible_label, version,
  source_object_label, source_state_label,
  expected_output_object_label, expected_output_state_label
) values (
  '${id}', '${IDS.company}', '${IDS.caseId}', '${processCode}',
  'not_ready', 'not_applicable', true, now(),
  'Experto EVE (test)', 1,
  '${sourceObject}', '${sourceState}',
  '${expectedObject}', '${expectedState}'
);`;
}

function cryptoRandomUuid() {
  return globalThis.crypto.randomUUID();
}

async function transition(workItemId, afterStatus, eventType, extra = {}) {
  const { error } = await admin.rpc("eve_apply_manual_work_transition", {
    p_work_item_id: workItemId,
    p_after_status: afterStatus,
    p_actor_label: "point13_seed_producer",
    p_event_type: eventType,
    p_reason: extra.p_reason ?? null,
    p_artifact_ref: extra.p_artifact_ref ?? null,
    p_acceptance_result_ref: extra.p_acceptance_result_ref ?? null,
    p_after_handoff_status: extra.p_after_handoff_status ?? null,
    p_expected_handoff_at: extra.p_expected_handoff_at ?? null,
    p_expected_event: extra.p_expected_event ?? null,
    p_request_id: `seed_${eventType}`,
    p_handoff_origin: extra.p_handoff_origin ?? null,
    p_handoff_destination: extra.p_handoff_destination ?? null,
  });
  if (error) {
    throw new Error(`transition_${eventType}_${afterStatus}:${error.message}`);
  }
}

function buildStructureSql(userA, userB) {
  const usuarioId = "a1300013-0000-4000-8000-000000000004";
  return `
begin;

insert into public.empresas (id, nombre)
values ('${IDS.company}', 'Empresa Point13 OpVal')
on conflict (id) do update set nombre = excluded.nombre;

insert into public.usuarios (id, empresa_id, email, auth_user_id)
values (
  '${usuarioId}', '${IDS.company}', 'point13-opval-participant@example.invalid', null
)
on conflict (id) do update set
  empresa_id = excluded.empresa_id,
  email = excluded.email,
  auth_user_id = null;

insert into public.consultant_company_assignments (
  id, consultant_user_id, client_company_id, status, valid_from, valid_until, created_by
) values (
  '${IDS.assignA}', '${userA}', '${IDS.company}', 'enabled', now() - interval '1 day', null, '${userA}'
)
on conflict (id) do update set
  consultant_user_id = excluded.consultant_user_id,
  status = 'enabled',
  valid_from = excluded.valid_from,
  valid_until = null;

update public.consultant_company_assignments
set status = 'disabled', valid_until = now()
where consultant_user_id = '${userB}'
  and client_company_id = '${IDS.company}';

insert into public.client_relationships (
  id, client_company_id, display_name, status, valid_from, valid_until, created_by
) values (
  '${IDS.relationship}', '${IDS.company}', 'Relación Point13 OpVal', 'enabled',
  now() - interval '1 day', null, '${userA}'
)
on conflict (id) do update set
  display_name = excluded.display_name,
  status = 'enabled';

insert into public.sesiones_llenado (
  id, usuario_id, estado_actual, client_company_id, client_relationship_id, display_name
) values (
  '${IDS.caseId}', '${usuarioId}', 'en_progreso', '${IDS.company}', '${IDS.relationship}',
  'Caso Point13 OpVal'
)
on conflict (id) do update set
  client_company_id = excluded.client_company_id,
  client_relationship_id = excluded.client_relationship_id,
  display_name = excluded.display_name;

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
    throw new Error(
      `sql_failed:${result.stderr || result.stdout || "unknown"}`,
    );
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
    const match = /SERVICE_ROLE_KEY=(.+)/.exec(status.stdout || "");
    if (match) serviceRoleKey = match[1].trim().replace(/^"|"$/g, "");
  }
  const password = (process.env.EVE_UNIT2B_TEST_PASSWORD || "").trim();
  if (!supabaseUrl || !serviceRoleKey || !password) {
    throw new Error("missing_env");
  }
  return { supabaseUrl, serviceRoleKey, password };
}

function assertLocal(url) {
  const host = new URL(url).hostname.toLowerCase();
  if (host !== "127.0.0.1" && host !== "localhost") {
    throw new Error("remote_supabase_rejected");
  }
}

function loadEnvLocal() {
  const path = resolve(projectRoot, ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i <= 0) continue;
    process.env[trimmed.slice(0, i).trim()] = trimmed.slice(i + 1).trim();
  }
}
