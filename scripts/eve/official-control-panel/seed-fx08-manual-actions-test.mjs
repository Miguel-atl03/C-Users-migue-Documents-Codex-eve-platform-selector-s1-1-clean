#!/usr/bin/env node
/**
 * FX-08 R2 seed (test-only). Starting state only — no happy-path transitions.
 * Transitions must go UI → BFF → RPC (eve_apply_manual_work_product_action_as_consultant).
 *
 * Consultants:
 *   A — manage + accept (can_accept_manual_output=true)
 *   B — other company (no access to FX08 case)
 *   C — manage but can_accept_manual_output=false
 *
 * Writes: reports/local/rector-r2-fx08/manifest.json
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "../../..");
const MANIFEST_DIR = resolve(projectRoot, "reports/local/rector-r2-fx08");
const MANIFEST_PATH = resolve(MANIFEST_DIR, "manifest.json");

const AMBER_CASE = "19fc9eff-4219-43f0-854c-e2b3350f23f2";

const IDS = {
  companyFx08: "a2080008-0000-4000-8000-000000000001",
  companyOther: "a2080008-0000-4000-8000-000000000010",
  relationship: "a2080008-0000-4000-8000-000000000002",
  relationshipB: "a2080008-0000-4000-8000-000000000012",
  caseId: "a2080008-0000-4000-8000-000000000003",
  caseIdB: "a2080008-0000-4000-8000-000000000013",
  usuarioId: "a2080008-0000-4000-8000-000000000004",
  usuarioIdB: "a2080008-0000-4000-8000-000000000014",
  assignA: "a2080008-0000-4000-8000-00000000000b",
  assignB: "a2080008-0000-4000-8000-00000000000c",
  assignC: "a2080008-0000-4000-8000-00000000000d",
  work03: "a2080008-0000-4000-8000-000000000031",
  inputPackage: "a2080008-0000-4000-8000-000000000032",
  work03B: "a2080008-0000-4000-8000-000000000033",
  inputPackageB: "a2080008-0000-4000-8000-000000000034",
};

const EMAIL_A = "fx08-r2-consultant-a@example.invalid";
const EMAIL_B = "fx08-r2-consultant-b@example.invalid";
const EMAIL_C = "fx08-r2-consultant-c@example.invalid";

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
  const userC = await ensureUser(EMAIL_C, env.password);

  runSql(buildStructureSql(userA, userB, userC));
  await mustGrant(userB, userA, IDS.companyFx08, "manage_manual_work", "fx08_seed_a_manage");
  await mustGrant(userB, userA, IDS.companyFx08, "accept_manual_output", "fx08_seed_a_accept");
  await mustGrant(userA, userB, IDS.companyOther, "manage_manual_work", "fx08_seed_b_manage_other");
  await mustGrant(userA, userB, IDS.companyOther, "accept_manual_output", "fx08_seed_b_accept_other");
  await mustGrant(userA, userC, IDS.companyFx08, "manage_manual_work", "fx08_seed_c_manage_only");

  IDS.work03 = cryptoRandomUuid();
  IDS.inputPackage = cryptoRandomUuid();
  IDS.work03B = cryptoRandomUuid();
  IDS.inputPackageB = cryptoRandomUuid();
  runSql(buildWorkItemSeedSql(userA));

  const { data: amberRows } = await admin
    .from("manual_process_work_item")
    .select("id")
    .eq("case_id", AMBER_CASE)
    .eq("is_current", true);

  const manifest = {
    ok: true,
    fixture: "FX-08",
    note:
      "Starting state only. Execute transitions via UI → BFF POST manual-actions → authenticated RPC. Consultant A is authorized on case A and case B (same company) for cross-path denial probes.",
    companyFx08Id: IDS.companyFx08,
    companyOtherId: IDS.companyOther,
    relationshipId: IDS.relationship,
    relationshipBId: IDS.relationshipB,
    caseId: IDS.caseId,
    caseIdB: IDS.caseIdB,
    workItems: {
      "P-SUP-03": {
        id: IDS.work03,
        status: "ready_to_start",
        inputPackageArtifactId: IDS.inputPackage,
      },
    },
    workItemsCaseB: {
      "P-SUP-03": {
        id: IDS.work03B,
        status: "ready_to_start",
        inputPackageArtifactId: IDS.inputPackageB,
      },
    },
    consultants: {
      a: {
        email: EMAIL_A,
        userId: userA,
        canManage: true,
        canAccept: true,
        authorizedCases: [IDS.caseId, IDS.caseIdB],
      },
      b: {
        email: EMAIL_B,
        userId: userB,
        canManage: false,
        canAccept: false,
        note: "Assigned to other company only",
      },
      c: {
        email: EMAIL_C,
        userId: userC,
        canManage: true,
        canAccept: false,
        note: "manage grant only; no accept_manual_output grant",
      },
    },
    amberCurrentCount: amberRows?.length ?? 0,
    trackingUrl:
      `/admin/official-consultant-control-panel` +
      `?mode=client-company&view=tracking` +
      `&company=${IDS.companyFx08}` +
      `&relationship=${IDS.relationship}` +
      `&case=${IDS.caseId}`,
    expectedFlow: [
      "download_package",
      "register_start",
      "attach_output",
      "submit_review",
      "accept_output",
    ],
  };

  mkdirSync(MANIFEST_DIR, { recursive: true });
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify(manifest));
}

function buildStructureSql(userA, userB, userC) {
  return `
begin;

insert into public.empresas (id, nombre)
values
  ('${IDS.companyFx08}', 'Empresa FX-08 R2 Manual Actions'),
  ('${IDS.companyOther}', 'Empresa FX-08 Other (Consultant B)')
on conflict (id) do update set nombre = excluded.nombre;

insert into public.usuarios (id, empresa_id, email, auth_user_id)
values (
  '${IDS.usuarioId}', '${IDS.companyFx08}', 'fx08-participant@example.invalid', null
)
on conflict (id) do update set
  empresa_id = excluded.empresa_id,
  email = excluded.email,
  auth_user_id = null;

-- Consultant A: manage + accept
insert into public.consultant_company_assignments (
  id, consultant_user_id, client_company_id, status, valid_from, valid_until,
  created_by
) values (
  '${IDS.assignA}', '${userA}', '${IDS.companyFx08}', 'enabled',
  now() - interval '1 day', null, '${userA}'
)
on conflict (id) do update set
  consultant_user_id = excluded.consultant_user_id,
  status = 'enabled',
  valid_from = excluded.valid_from,
  valid_until = null;

-- Consultant B: other company only
insert into public.consultant_company_assignments (
  id, consultant_user_id, client_company_id, status, valid_from, valid_until,
  created_by
) values (
  '${IDS.assignB}', '${userB}', '${IDS.companyOther}', 'enabled',
  now() - interval '1 day', null, '${userB}'
)
on conflict (id) do update set
  consultant_user_id = excluded.consultant_user_id,
  status = 'enabled',
  client_company_id = excluded.client_company_id;

-- Consultant C: manage but cannot accept on FX08
insert into public.consultant_company_assignments (
  id, consultant_user_id, client_company_id, status, valid_from, valid_until,
  created_by
) values (
  '${IDS.assignC}', '${userC}', '${IDS.companyFx08}', 'enabled',
  now() - interval '1 day', null, '${userC}'
)
on conflict (id) do update set
  consultant_user_id = excluded.consultant_user_id,
  status = 'enabled';

insert into public.client_relationships (
  id, client_company_id, display_name, status, valid_from, valid_until, created_by
) values (
  '${IDS.relationship}', '${IDS.companyFx08}', 'Relación FX-08 R2', 'enabled',
  now() - interval '1 day', null, '${userA}'
)
on conflict (id) do update set
  display_name = excluded.display_name,
  status = 'enabled';

insert into public.sesiones_llenado (
  id, usuario_id, estado_actual, client_company_id, client_relationship_id, display_name
) values (
  '${IDS.caseId}', '${IDS.usuarioId}', 'en_progreso', '${IDS.companyFx08}',
  '${IDS.relationship}', 'Caso FX-08 R2 Manual Actions'
)
on conflict (id) do update set
  client_company_id = excluded.client_company_id,
  client_relationship_id = excluded.client_relationship_id,
  display_name = excluded.display_name;

-- Case B (same company): Consultant A authorized on both A and B for cross-path probes
insert into public.usuarios (id, empresa_id, email, auth_user_id)
values (
  '${IDS.usuarioIdB}', '${IDS.companyFx08}', 'fx08-participant-b@example.invalid', null
)
on conflict (id) do update set
  empresa_id = excluded.empresa_id,
  email = excluded.email,
  auth_user_id = null;

insert into public.client_relationships (
  id, client_company_id, display_name, status, valid_from, valid_until, created_by
) values (
  '${IDS.relationshipB}', '${IDS.companyFx08}', 'Relación FX-08 R2 Case B', 'enabled',
  now() - interval '1 day', null, '${userA}'
)
on conflict (id) do update set
  display_name = excluded.display_name,
  status = 'enabled';

insert into public.sesiones_llenado (
  id, usuario_id, estado_actual, client_company_id, client_relationship_id, display_name
) values (
  '${IDS.caseIdB}', '${IDS.usuarioIdB}', 'en_progreso', '${IDS.companyFx08}',
  '${IDS.relationshipB}', 'Caso FX-08 R2 Case B Cross-Path'
)
on conflict (id) do update set
  client_company_id = excluded.client_company_id,
  client_relationship_id = excluded.client_relationship_id,
  display_name = excluded.display_name;

commit;
`;
}

function buildWorkItemSeedSql(userA) {
  const storageRef = `test-only://fx08/input-package/${IDS.inputPackage}`;
  const content = "FX08-REAL-INPUT-PACKAGE-CONTENT-V1";
  return `
begin;
select set_config('eve.manual_work_rpc', '1', true);

update public.manual_process_work_item
set is_current = false, updated_at = now()
where case_id = '${IDS.caseId}' and is_current;

insert into public.manual_process_work_item (
  id, company_id, case_id, process_code,
  manual_tracking_status, handoff_status, is_current, opened_at,
  responsible_label, version, artifact_ref,
  source_object_label, source_state_label,
  expected_output_object_label, expected_output_state_label
) values (
  '${IDS.work03}', '${IDS.companyFx08}', '${IDS.caseId}', 'P-SUP-03',
  'ready_to_start', 'not_applicable', true, now(),
  'Experto EVE (FX-08 seed)', 1, '${storageRef}',
  'EvidenceBundle', 'ReadyForTransduction',
  'EscenaEvidencial', 'Validated'
);

insert into public.manual_work_artifact_version (
  id, work_item_id, company_id, case_id, process_code,
  artifact_kind, version_number, storage_reference, sanitized_filename,
  content_type, size_bytes, sha256, uploaded_by
) values (
  '${IDS.inputPackage}', '${IDS.work03}', '${IDS.companyFx08}', '${IDS.caseId}', 'P-SUP-03',
  'input_package', 1, '${storageRef}', 'fx08-evidence-bundle.bin',
  'application/octet-stream', octet_length(convert_to('${content}', 'UTF8')),
  encode(digest(convert_to('${content}', 'UTF8'), 'sha256'), 'hex'),
  '${userA}'
)
on conflict (id) do nothing;

insert into public.manual_work_artifact_blob (artifact_version_id, content)
values ('${IDS.inputPackage}', convert_to('${content}', 'UTF8'))
on conflict (artifact_version_id) do nothing;

-- Case B work item + input package (Consultant A can access; cross-path with case A URL must deny)
update public.manual_process_work_item
set is_current = false, updated_at = now()
where case_id = '${IDS.caseIdB}' and is_current;

insert into public.manual_process_work_item (
  id, company_id, case_id, process_code,
  manual_tracking_status, handoff_status, is_current, opened_at,
  responsible_label, version, artifact_ref,
  source_object_label, source_state_label,
  expected_output_object_label, expected_output_state_label
) values (
  '${IDS.work03B}', '${IDS.companyFx08}', '${IDS.caseIdB}', 'P-SUP-03',
  'ready_to_start', 'not_applicable', true, now(),
  'Experto EVE (FX-08 case B seed)', 1, 'test-only://fx08/input-package/${IDS.inputPackageB}',
  'EvidenceBundle', 'ReadyForTransduction',
  'EscenaEvidencial', 'Validated'
);

insert into public.manual_work_artifact_version (
  id, work_item_id, company_id, case_id, process_code,
  artifact_kind, version_number, storage_reference, sanitized_filename,
  content_type, size_bytes, sha256, uploaded_by
) values (
  '${IDS.inputPackageB}', '${IDS.work03B}', '${IDS.companyFx08}', '${IDS.caseIdB}', 'P-SUP-03',
  'input_package', 1, 'test-only://fx08/input-package/${IDS.inputPackageB}',
  'fx08-evidence-bundle-b.bin',
  'application/octet-stream', octet_length(convert_to('${content}-B', 'UTF8')),
  encode(digest(convert_to('${content}-B', 'UTF8'), 'sha256'), 'hex'),
  '${userA}'
)
on conflict (id) do nothing;

insert into public.manual_work_artifact_blob (artifact_version_id, content)
values ('${IDS.inputPackageB}', convert_to('${content}-B', 'UTF8'))
on conflict (artifact_version_id) do nothing;

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
  if (error) {
    throw new Error(
      `eve_grant_consultant_panel_capability:${capability}:${error.message}`,
    );
  }
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

function cryptoRandomUuid() {
  return globalThis.crypto.randomUUID();
}
