#!/usr/bin/env node
/**
 * Test-only: provision local Auth identities for official Panel access tests.
 *
 * Modes:
 *   (default) single consultant assignment (legacy)
 *   --access-identities  Consultor A/B + operativo + sin rol
 *
 * Required env (ephemeral — never hardcode):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   MBA_SUPABASE_SERVICE_ROLE_KEY | SUPABASE_SERVICE_ROLE_KEY
 *   EVE_UNIT2B_TEST_PASSWORD | EVE_PROVISION_CONSULTANT_PASSWORD
 *   EVE_PROVISION_CONFIRM=UNIT2A_ADMIN
 *
 * Optional company overrides:
 *   EVE_PROVISION_COMPANY_A_ID (default Amber canonical)
 *   EVE_PROVISION_COMPANY_B_ID (default Empresa Múltiple fixture)
 *   EVE_PROVISION_ACTOR_USER_ID (defaults to Consultor A after ensure)
 *
 * Rejects non-localhost. Does NOT create Runtime sessions.
 * Does NOT create Next.js endpoints.
 */

import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const WRITE_CONFIRMATION = "UNIT2A_ADMIN";

const DEFAULT_COMPANY_A = "5c08029f-15e9-4bbd-b13e-0ff4765e23b8";
const DEFAULT_COMPANY_B = "a1200012-0000-4000-8000-000000000001";

const IDENTITY = {
  consultantA: {
    email: "unit2b-consultant@example.invalid",
    name: "Consultor A Access",
  },
  consultantB: {
    email: "access-consultant-b@example.invalid",
    name: "Consultor B Access",
  },
  operative: {
    email: "access-operative@example.invalid",
    name: "Usuario Operativo Access",
  },
  noRole: {
    email: "access-norole@example.invalid",
    name: "Usuario Sin Rol Access",
  },
};

function assertLocalSupabaseUrl(url) {
  let host;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    throw new Error("invalid_supabase_url");
  }
  if (host !== "127.0.0.1" && host !== "localhost") {
    throw new Error("remote_supabase_url_rejected");
  }
}

function requireEnv(name) {
  const value = (process.env[name] ?? "").trim();
  if (!value) throw new Error(`missing_env:${name}`);
  return value;
}

function readPassword() {
  return (
    (process.env.EVE_PROVISION_CONSULTANT_PASSWORD ?? "").trim() ||
    (process.env.EVE_UNIT2B_TEST_PASSWORD ?? "").trim()
  );
}

function createAdminClient() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  assertLocalSupabaseUrl(url);
  const key = (
    process.env.MBA_SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    ""
  ).trim();
  if (!key) throw new Error("supabase_admin_environment_missing");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function findAuthUserByEmail(client, email) {
  const normalized = email.trim().toLowerCase();
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`list_users_failed:${error.message}`);
    const match = (data?.users ?? []).find(
      (user) => (user.email ?? "").trim().toLowerCase() === normalized,
    );
    if (match) return match;
    if (!data?.users?.length || data.users.length < perPage) return null;
    page += 1;
    if (page > 50) throw new Error("list_users_page_limit");
  }
}

async function ensureAuthUser(client, email, password, displayName) {
  const existing = await findAuthUserByEmail(client, email);
  if (existing?.id) {
    const { error } = await client.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { name: displayName },
    });
    if (error) throw new Error(`update_user_failed:${error.message}`);
    return { userId: existing.id, created: false };
  }

  const { data, error } = await client.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: displayName },
  });
  if (error || !data?.user?.id) {
    throw new Error(
      `create_user_failed:${error?.message ?? "user_id_missing"}`,
    );
  }
  return { userId: data.user.id, created: true };
}

async function disableAssignmentsForUser(consultantUserId) {
  const sql = `
update public.consultant_company_assignments
set status = 'disabled',
    valid_until = greatest(valid_from, now())
where consultant_user_id = '${consultantUserId}'
  and status = 'enabled';
`;
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
      `disable_assignments_failed:${(result.stderr || result.stdout || "").trim()}`,
    );
  }
}

async function assignCompany(client, actorUserId, consultantUserId, companyId) {
  const { data, error } = await client.rpc("eve_admin_assign_consultant_company", {
    p_actor_user_id: actorUserId,
    p_consultant_user_id: consultantUserId,
    p_client_company_id: companyId,
    p_valid_from: new Date().toISOString(),
    p_valid_until: null,
  });
  if (error) throw new Error(`assignment_failed:${error.message}`);
  return data;
}

async function provisionAccessIdentities(client, password) {
  const companyA =
    (process.env.EVE_PROVISION_COMPANY_A_ID ?? "").trim() || DEFAULT_COMPANY_A;
  const companyB =
    (process.env.EVE_PROVISION_COMPANY_B_ID ?? "").trim() || DEFAULT_COMPANY_B;

  const a = await ensureAuthUser(
    client,
    IDENTITY.consultantA.email,
    password,
    IDENTITY.consultantA.name,
  );
  const b = await ensureAuthUser(
    client,
    IDENTITY.consultantB.email,
    password,
    IDENTITY.consultantB.name,
  );
  const operative = await ensureAuthUser(
    client,
    IDENTITY.operative.email,
    password,
    IDENTITY.operative.name,
  );
  const noRole = await ensureAuthUser(
    client,
    IDENTITY.noRole.email,
    password,
    IDENTITY.noRole.name,
  );

  const actorUserId =
    (process.env.EVE_PROVISION_ACTOR_USER_ID ?? "").trim() || a.userId;

  // Preserve Consultor A existing scope (e.g. Unit 2B multi-company); only
  // ensure Company A is assigned. Isolate B / operative / no-role.
  await disableAssignmentsForUser(b.userId);
  await disableAssignmentsForUser(operative.userId);
  await disableAssignmentsForUser(noRole.userId);

  let assignmentA = null;
  try {
    assignmentA = await assignCompany(
      client,
      actorUserId,
      a.userId,
      companyA,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/assignment_failed|overlapping/i.test(message)) throw error;
    assignmentA = "existing_or_conflict_ignored";
  }

  const assignmentB = await assignCompany(
    client,
    actorUserId,
    b.userId,
    companyB,
  );

  console.log(
    JSON.stringify({
      ok: true,
      mode: "access-identities",
      runtime_session_created: false,
      company_a: companyA,
      company_b: companyB,
      consultant_a: {
        user_id: a.userId,
        email: IDENTITY.consultantA.email,
        created: a.created,
        assignment_id: assignmentA,
      },
      consultant_b: {
        user_id: b.userId,
        email: IDENTITY.consultantB.email,
        created: b.created,
        assignment_id: assignmentB,
      },
      operative: {
        user_id: operative.userId,
        email: IDENTITY.operative.email,
        created: operative.created,
        assignments: 0,
      },
      no_role: {
        user_id: noRole.userId,
        email: IDENTITY.noRole.email,
        created: noRole.created,
        assignments: 0,
      },
      note: "Credentials were read from process env only; not printed.",
    }),
  );
}

async function provisionSingleConsultant(client, password) {
  const email = requireEnv("EVE_PROVISION_CONSULTANT_EMAIL");
  const companyId = requireEnv("EVE_PROVISION_COMPANY_ID");
  const actorUserId = requireEnv("EVE_PROVISION_ACTOR_USER_ID");
  const displayName =
    (process.env.EVE_PROVISION_CONSULTANT_NAME ?? "").trim() ||
    "Official Consultant";
  const relationshipId = (process.env.EVE_PROVISION_RELATIONSHIP_ID ?? "").trim();
  const caseId = (process.env.EVE_PROVISION_CASE_ID ?? "").trim();
  const caseName = (process.env.EVE_PROVISION_CASE_NAME ?? "").trim();

  const { userId, created } = await ensureAuthUser(
    client,
    email,
    password,
    displayName,
  );

  const { data: assignmentId, error: assignError } = await client.rpc(
    "eve_admin_assign_consultant_company",
    {
      p_actor_user_id: actorUserId,
      p_consultant_user_id: userId,
      p_client_company_id: companyId,
      p_valid_from: new Date().toISOString(),
      p_valid_until: null,
    },
  );
  if (assignError) {
    throw new Error(`assignment_failed:${assignError.message}`);
  }

  let linkedCaseId = null;
  if (relationshipId && caseId && caseName) {
    const { error: linkError } = await client.rpc(
      "eve_admin_link_case_relationship",
      {
        p_actor_user_id: actorUserId,
        p_case_id: caseId,
        p_client_relationship_id: relationshipId,
        p_client_company_id: companyId,
        p_display_name: caseName,
      },
    );
    if (linkError) {
      throw new Error(`case_link_failed:${linkError.message}`);
    }
    linkedCaseId = caseId;
  }

  console.log(
    JSON.stringify({
      ok: true,
      mode: "single",
      consultant_user_id: userId,
      email,
      auth_user_created: created,
      company_id: companyId,
      assignment_id: assignmentId,
      case_linked: linkedCaseId,
      runtime_session_created: false,
      note: "Credentials were read from process env only; not printed.",
    }),
  );
}

async function main() {
  if ((process.env.EVE_PROVISION_CONFIRM ?? "").trim() !== WRITE_CONFIRMATION) {
    throw new Error(`confirm_required:${WRITE_CONFIRMATION}`);
  }

  const password = readPassword();
  if (!password) throw new Error("missing_env:EVE_UNIT2B_TEST_PASSWORD");

  const client = createAdminClient();
  const accessIdentities = process.argv.includes("--access-identities");

  if (accessIdentities) {
    await provisionAccessIdentities(client, password);
    return;
  }

  await provisionSingleConsultant(client, password);
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : "provision_failed",
    }),
  );
  process.exit(1);
});
