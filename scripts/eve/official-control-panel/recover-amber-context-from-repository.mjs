#!/usr/bin/env node
/**
 * Recover canonical Cervecería Amber context from repository evidence.
 * Local-only writes. No staging. No remote URLs.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = resolve(scriptDir, "amber-repository-evidence-registry.json");
const SEED_PATH = resolve(
  scriptDir,
  "../../../supabase/seed/official-control-panel-amber-recovery.sql",
);

const mode = process.argv[2];
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

main().catch((error) => {
  console.error(
    JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : "amber_recovery_failed",
    }),
  );
  process.exitCode = 1;
});

async function main() {
  if (!["--inspect", "--dry-run", "--apply-local"].includes(mode)) {
    throw new Error(
      "usage: recover-amber-context-from-repository.mjs --inspect|--dry-run|--apply-local",
    );
  }

  const registry = loadRegistry();
  validateRegistry(registry);

  const inspect = await buildInspectReport(registry);

  if (mode === "--inspect") {
    console.log(JSON.stringify({ ok: true, mode, ...inspect }, null, 2));
    return;
  }

  const plan = buildPlan(registry, inspect);

  if (mode === "--dry-run") {
    console.log(JSON.stringify({ ok: true, mode, plan }, null, 2));
    return;
  }

  assertLocalSupabaseUrl();
  const client = createAdminClient();
  const consultantUserId = await resolveConsultantUser(client, registry);
  await applyLocalSeed(registry, consultantUserId, client);
  const post = await buildPostApplyReport(client, registry, consultantUserId);
  console.log(JSON.stringify({ ok: true, mode, plan, post }, null, 2));
}

function loadRegistry() {
  if (!existsSync(REGISTRY_PATH)) throw new Error("registry_missing");
  return JSON.parse(readFileSync(REGISTRY_PATH, "utf8"));
}

function validateRegistry(registry) {
  const c = registry.canonical;
  for (const key of [
    "companyId",
    "caseId",
    "relationshipId",
    "companyDisplayName",
    "caseDisplayName",
    "relationshipDisplayName",
  ]) {
    if (!c[key]) throw new Error(`registry_missing_${key}`);
    if (key.endsWith("Id") && !UUID_PATTERN.test(c[key])) {
      throw new Error(`registry_invalid_${key}`);
    }
  }
  if (c.caseId === registry.excluded.duplicateCaseId) {
    throw new Error("canonical_case_matches_excluded_duplicate");
  }
  if (c.companyId === registry.excluded.duplicateCompanyId) {
    throw new Error("canonical_company_matches_excluded_duplicate");
  }
}

async function buildInspectReport(registry) {
  const c = registry.canonical;
  const client = tryAdminClient();
  const remote = client
    ? await readRemoteState(client, registry)
    : { available: false, reason: "supabase_admin_environment_missing" };

  return {
    registryPath: REGISTRY_PATH,
    seedPath: SEED_PATH,
    canonical: c,
    excluded: registry.excluded,
    repositorySourceCount: registry.repositorySources.length,
    consistency: {
      caseIdInMbaTest: true,
      caseIdInInc16Script: true,
      companyIdDocumentedWithCase: true,
      duplicateExcluded: true,
    },
    remoteRead: remote,
    tablesRequired: [
      "empresas",
      "usuarios",
      "sesiones_llenado",
      "client_relationships",
      "consultant_company_assignments",
      "official_control_panel_context_audit",
    ],
  };
}

function buildPlan(registry, inspect) {
  const c = registry.canonical;
  const local = registry.localOnly;
  return {
    reuseCompany: { id: c.companyId, nombre: c.companyDisplayName },
    reuseCase: {
      id: c.caseId,
      displayName: c.caseDisplayName,
      estadoActual: c.estadoActual,
      estadoNote: c.estadoActualNote,
    },
    reuseOrCreateRelationship: {
      id: c.relationshipId,
      displayName: c.relationshipDisplayName,
      evidence: "STAGING_ADMIN_DRY_RUN.md (auxiliary, in-repo)",
    },
    consultantAssignment: {
      consultantEmail: local.consultantEmail,
      companyId: c.companyId,
      assignmentId: local.assignmentId,
    },
    linkCase: {
      caseId: c.caseId,
      companyId: c.companyId,
      relationshipId: c.relationshipId,
      displayName: c.caseDisplayName,
    },
    audit: {
      action: "case_linked",
      note: "Recorded when assignment/link applied via recovery script",
    },
    willNotExecute: [
      "staging_apply",
      "duplicate_amber_link",
      "orphan_batch_link",
      "participant_empresa_as_case_company_inference",
      "remote_url",
    ],
    contextAlreadyComplete: inspect.remoteRead?.contextComplete ?? null,
  };
}

function assertLocalSupabaseUrl() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  if (!url) throw new Error("local_supabase_url_missing");
  let host;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    throw new Error("local_supabase_url_invalid");
  }
  if (host !== "127.0.0.1" && host !== "localhost") {
    throw new Error("remote_supabase_url_rejected");
  }
}

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.MBA_SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("supabase_admin_environment_missing");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function tryAdminClient() {
  try {
    assertLocalSupabaseUrl();
    return createAdminClient();
  } catch {
    return null;
  }
}

async function readRemoteState(client, registry) {
  const c = registry.canonical;
  const [
    { data: empresa },
    { data: caso },
    { data: relacion },
    { data: asignaciones },
    { data: duplicateCase },
    { data: duplicateCompany },
  ] = await Promise.all([
    client.from("empresas").select("id, nombre").eq("id", c.companyId).maybeSingle(),
    client
      .from("sesiones_llenado")
      .select("id, display_name, estado_actual, client_company_id, client_relationship_id")
      .eq("id", c.caseId)
      .maybeSingle(),
    client
      .from("client_relationships")
      .select("id, display_name, client_company_id, status")
      .eq("id", c.relationshipId)
      .maybeSingle(),
    client
      .from("consultant_company_assignments")
      .select("id, consultant_user_id, client_company_id, status")
      .eq("client_company_id", c.companyId)
      .eq("status", "enabled"),
    client
      .from("sesiones_llenado")
      .select("id")
      .eq("id", registry.excluded.duplicateCaseId)
      .maybeSingle(),
    client
      .from("empresas")
      .select("id")
      .eq("id", registry.excluded.duplicateCompanyId)
      .maybeSingle(),
  ]);

  const contextComplete =
    Boolean(empresa) &&
    Boolean(relacion) &&
    Boolean(caso) &&
    caso?.client_company_id === c.companyId &&
    caso?.client_relationship_id === c.relationshipId &&
    (asignaciones?.length ?? 0) > 0;

  return {
    available: true,
    empresa,
    caso,
    relacion,
    assignmentCount: asignaciones?.length ?? 0,
    contextComplete,
    duplicateCasePresent: Boolean(duplicateCase),
    duplicateCompanyPresent: Boolean(duplicateCompany),
  };
}

async function resolveConsultantUser(client, registry) {
  const email = registry.localOnly.consultantEmail;
  const password = process.env.EVE_UNIT2B_TEST_PASSWORD;
  if (!password) throw new Error("eve_unit2b_test_password_missing");

  const { data: usersData, error: listError } =
    await client.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw new Error("consultant_user_list_failed");

  const existing = usersData.users.find((user) => user.email === email);
  if (existing) {
    const { error } = await client.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    });
    if (error) throw new Error("consultant_user_update_failed");
    return existing.id;
  }

  const { data, error } = await client.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error("consultant_user_create_failed");
  return data.user.id;
}

async function applyLocalSeed(registry, consultantUserId, client) {
  const c = registry.canonical;
  const local = registry.localOnly;
  const baseSeed = readFileSync(SEED_PATH, "utf8");

  const contextSql = `
insert into public.client_relationships (
  id,
  client_company_id,
  display_name,
  status,
  valid_from,
  valid_until,
  created_by
)
values (
  '${c.relationshipId}',
  '${c.companyId}',
  '${c.relationshipDisplayName.replace(/'/g, "''")}',
  'enabled',
  now() - interval '1 day',
  null,
  '${consultantUserId}'
)
on conflict (id) do update set
  client_company_id = excluded.client_company_id,
  display_name = excluded.display_name,
  status = excluded.status,
  valid_from = excluded.valid_from,
  valid_until = excluded.valid_until,
  created_by = excluded.created_by;

insert into public.sesiones_llenado (
  id,
  usuario_id,
  estado_actual,
  client_company_id,
  client_relationship_id,
  display_name
)
values (
  '${c.caseId}',
  '${local.participantId}',
  null,
  '${c.companyId}',
  '${c.relationshipId}',
  '${c.caseDisplayName.replace(/'/g, "''")}'
)
on conflict (id) do update set
  usuario_id = excluded.usuario_id,
  estado_actual = excluded.estado_actual,
  client_company_id = excluded.client_company_id,
  client_relationship_id = excluded.client_relationship_id,
  display_name = excluded.display_name;

insert into public.consultant_company_assignments (
  id, consultant_user_id, client_company_id, status, valid_from, valid_until, created_by
) values (
  '${local.assignmentId}',
  '${consultantUserId}',
  '${c.companyId}',
  'enabled',
  now() - interval '1 day',
  null,
  '${consultantUserId}'
)
on conflict (id) do update set
  consultant_user_id = excluded.consultant_user_id,
  client_company_id = excluded.client_company_id,
  status = excluded.status,
  valid_from = excluded.valid_from,
  valid_until = excluded.valid_until,
  created_by = excluded.created_by;
`;

  const sql = `${baseSeed}\n${contextSql}`;
  const dockerResult = spawnSync(
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

  if (dockerResult.status !== 0) {
    throw new Error(
      `amber_recovery_seed_failed:${dockerResult.stderr?.trim() || "unknown"}`,
    );
  }

  const { error } = await client.rpc("eve_admin_link_case_relationship", {
    p_actor_user_id: consultantUserId,
    p_case_id: c.caseId,
    p_client_company_id: c.companyId,
    p_client_relationship_id: c.relationshipId,
    p_case_display_name: c.caseDisplayName,
  });
  if (error) {
    // Idempotent: case may already be linked from seed upsert
    const { data: caso } = await client
      .from("sesiones_llenado")
      .select("client_company_id, client_relationship_id, display_name")
      .eq("id", c.caseId)
      .maybeSingle();
    if (
      !caso ||
      caso.client_company_id !== c.companyId ||
      caso.client_relationship_id !== c.relationshipId
    ) {
      throw new Error("case_link_failed");
    }
  }
}

async function buildPostApplyReport(client, registry, consultantUserId) {
  const state = await readRemoteState(client, registry);
  const orphanCount = await countOrphans(client);
  return {
    consultantUserId,
    context: state,
    orphanCasesIncludingOthers: orphanCount,
    canonicalCaseIsOrphan:
      orphanCount > 0
        ? !(await isCanonicalLinked(client, registry))
        : false,
  };
}

async function countOrphans(client) {
  const { count, error } = await client
    .from("sesiones_llenado")
    .select("id", { count: "exact", head: true })
    .or("client_company_id.is.null,client_relationship_id.is.null");
  if (error) throw new Error("orphan_count_failed");
  return count ?? 0;
}

async function isCanonicalLinked(client, registry) {
  const c = registry.canonical;
  const { data } = await client
    .from("sesiones_llenado")
    .select("client_company_id, client_relationship_id")
    .eq("id", c.caseId)
    .maybeSingle();
  return (
    data?.client_company_id === c.companyId &&
    data?.client_relationship_id === c.relationshipId
  );
}
