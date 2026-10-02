#!/usr/bin/env node
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { organimueblesFixture as fixture } from "../../../tests/fixtures/onboarding/organimuebles-e2e-v1.fixture.mjs";

const mode = process.argv.includes("--apply")
  ? "apply"
  : process.argv.includes("--dry-run")
    ? "dry-run"
    : null;

if (!mode) {
  console.error("Use exactly one mode: --dry-run or --apply");
  process.exit(2);
}

const apiUrl = process.env.STAGING_SUPABASE_URL?.replace(/\/$/, "");
const publishableKey = process.env.STAGING_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.STAGING_SUPABASE_SECRET_KEY;

assert.ok(apiUrl, "missing STAGING_SUPABASE_URL");
assert.ok(publishableKey, "missing STAGING_SUPABASE_PUBLISHABLE_KEY");
assert.ok(secretKey, "missing STAGING_SUPABASE_SECRET_KEY");

const expectedUrl = `https://${fixture.projectRef}.supabase.co`;
if (apiUrl !== expectedUrl) {
  throw new Error(`Refusing to run outside staging project ${fixture.projectRef}`);
}

const restUrl = `${apiUrl}/rest/v1`;
const authUrl = `${apiUrl}/auth/v1`;
const password = `Fixture-${randomUUID().slice(0, 8)}-Password-123`;

const serviceHeaders = {
  apikey: secretKey,
  authorization: `Bearer ${secretKey}`,
  "content-type": "application/json",
};

const jsonHeaders = (bearer = null) => ({
  apikey: publishableKey,
  ...(bearer ? { authorization: `Bearer ${bearer}` } : {}),
  "content-type": "application/json",
});

async function request(label, url, options = {}, expected = [200]) {
  const res = await fetch(url, options);
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  assert.ok(
    expected.includes(res.status),
    `${label}: expected ${expected.join("/")} got ${res.status}: ${text}`,
  );
  return body;
}

async function select(table, query = "") {
  return request(
    `select ${table}`,
    `${restUrl}/${table}${query}`,
    { method: "GET", headers: serviceHeaders },
  );
}

async function upsert(table, row, onConflict = "id") {
  return request(
    `upsert ${table}`,
    `${restUrl}/${table}?on_conflict=${encodeURIComponent(onConflict)}`,
    {
      method: "POST",
      headers: {
        ...serviceHeaders,
        prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(row),
    },
    [200, 201],
  );
}

async function insertIfMissing(table, query, row) {
  const existing = await select(table, query);
  if (existing.length) return { row: existing[0], created: false };
  if (mode === "dry-run") return { row, created: true };
  const created = await upsert(table, row);
  return { row: created[0], created: true };
}

async function listAuthUsersByEmail(email) {
  const body = await request(
    `list auth users ${email}`,
    `${authUrl}/admin/users?per_page=1000`,
    { method: "GET", headers: serviceHeaders },
  );
  return (body.users ?? []).filter((user) => user.email?.toLowerCase() === email.toLowerCase());
}

async function ensureAuthUser(email) {
  const existing = await listAuthUsersByEmail(email);
  if (existing.length) {
    if (mode === "apply") {
      await request(
        `update auth user ${email}`,
        `${authUrl}/admin/users/${existing[0].id}`,
        {
          method: "PUT",
          headers: serviceHeaders,
          body: JSON.stringify({ password, email_confirm: true }),
        },
      );
    }
    return { user: existing[0], created: false };
  }
  if (mode === "dry-run") {
    const dryId = email === fixture.seedOperator.email
      ? "a1111111-0000-4000-8000-000000000101"
      : "a1111111-0000-4000-8000-000000000102";
    return { user: { id: dryId, email }, created: true };
  }
  const user = await request(
    `create auth user ${email}`,
    `${authUrl}/admin/users`,
    {
      method: "POST",
      headers: serviceHeaders,
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { fixture: fixture.fixture, test_only: true },
      }),
    },
    [200, 201],
  );
  return { user, created: true };
}

async function signIn(email) {
  const body = await request(
    `sign in ${email}`,
    `${authUrl}/token?grant_type=password`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ email, password }),
    },
  );
  return body.access_token;
}

async function rpc(name, payload, bearer) {
  return request(
    `rpc ${name}`,
    `${restUrl}/rpc/${name}`,
    {
      method: "POST",
      headers: jsonHeaders(bearer),
      body: JSON.stringify(payload),
    },
  );
}

function invitationHash(email) {
  return createHash("sha256")
    .update(`${fixture.projectRef}:${fixture.fixture}:participant:${email.toLowerCase()}`)
    .digest("hex");
}

function mask(id) {
  if (!id || id.startsWith("(")) return id;
  return `${id.slice(0, 4)}...${id.slice(-4)}`;
}

async function main() {
  const operator = await ensureAuthUser(fixture.seedOperator.email);
  const operatorToken = mode === "apply" ? await signIn(fixture.seedOperator.email) : "(dry-run-token)";

  await insertIfMissing(
    "empresas",
    `?id=eq.${fixture.ids.empresa}`,
    {
      id: fixture.ids.empresa,
      nombre: fixture.company.nombre,
      sector: fixture.company.sector,
    },
  );

  await insertIfMissing(
    "usuarios",
    `?id=eq.${fixture.ids.sponsorUsuario}`,
    {
      id: fixture.ids.sponsorUsuario,
      empresa_id: fixture.ids.empresa,
      nombre: fixture.sponsor.nombre,
      rol_declarado: "Sponsor",
      email: fixture.sponsor.email,
      auth_user_id: null,
    },
  );

  await insertIfMissing(
    "consultant_company_assignments",
    `?consultant_user_id=eq.${operator.user.id}&client_company_id=eq.${fixture.ids.empresa}`,
    {
      consultant_user_id: operator.user.id,
      client_company_id: fixture.ids.empresa,
      status: "enabled",
      created_by: operator.user.id,
    },
  );

  await insertIfMissing(
    "client_relationships",
    `?id=eq.${fixture.ids.clientRelationship}`,
    {
      id: fixture.ids.clientRelationship,
      client_company_id: fixture.ids.empresa,
      display_name: fixture.engagement.displayName,
      status: fixture.engagement.status,
      created_by: operator.user.id,
    },
  );

  await insertIfMissing(
    "versiones_herramienta",
    `?id=eq.${fixture.ids.version}`,
    {
      id: fixture.ids.version,
      numero_version: fixture.fixture,
      activa: false,
    },
  );

  await insertIfMissing(
    "sesiones_llenado",
    `?id=eq.${fixture.ids.case}`,
    {
      id: fixture.ids.case,
      usuario_id: fixture.ids.sponsorUsuario,
      version_herramienta_id: fixture.ids.version,
      estado_actual: fixture.case.initialStatus,
      client_company_id: fixture.ids.empresa,
      client_relationship_id: fixture.ids.clientRelationship,
      display_name: fixture.case.displayName,
    },
  );

  await insertIfMissing(
    "case_sponsors",
    `?case_id=eq.${fixture.ids.case}&usuario_id=eq.${fixture.ids.sponsorUsuario}`,
    {
      empresa_id: fixture.ids.empresa,
      client_relationship_id: fixture.ids.clientRelationship,
      case_id: fixture.ids.case,
      usuario_id: fixture.ids.sponsorUsuario,
      status: fixture.sponsor.status,
      is_primary: fixture.sponsor.isPrimary,
      created_by: operator.user.id,
      metadata: {
        fixture: fixture.fixture,
        source: fixture.source,
        test_only: true,
        sponsor_role: "primary_case_sponsor",
      },
    },
  );

  const expiresAt = new Date(Date.now() + fixture.invitation.expiresInDays * 86400000).toISOString();
  const invitationResults = [];
  for (const participant of fixture.participants) {
    const metadata = {
      ...fixture.invitation.metadata,
      requested_profiles: participant.profiles,
      requested_profile_count: participant.profiles.length,
    };
    if (mode === "apply") {
      const result = await rpc(
        "create_participant_invitation",
        {
          p_empresa_id: fixture.ids.empresa,
          p_client_relationship_id: fixture.ids.clientRelationship,
          p_case_id: fixture.ids.case,
          p_invited_email: participant.email,
          p_token_hash: invitationHash(participant.email),
          p_expires_at: expiresAt,
          p_invited_name: participant.name,
          p_invitation_kind: "participant",
          p_metadata: metadata,
        },
        operatorToken,
      );
      invitationResults.push(result[0]);
    } else {
      const existing = await select(
        "participant_invitations",
        `?case_id=eq.${fixture.ids.case}&invited_email=eq.${encodeURIComponent(participant.email)}&invitation_kind=eq.participant&select=id,status,invited_email,invitation_kind`,
      );
      invitationResults.push(existing[0] ?? {
        invitation_id: "(new-invitation)",
        status: "pending",
        invited_email: participant.email,
        invitation_kind: "participant",
      });
    }
  }

  const invitations = await select(
    "participant_invitations",
    `?case_id=eq.${fixture.ids.case}&metadata->>fixture=eq.${fixture.fixture}&select=id,status,accepted_at,invitation_kind,metadata`,
  );
  const sponsors = await select(
    "case_sponsors",
    `?case_id=eq.${fixture.ids.case}&metadata->>fixture=eq.${fixture.fixture}&select=id,status,is_primary`,
  );
  const runtime = await select(
    "role_runtime_session",
    `?sesion_id=eq.${fixture.ids.case}&select=role_runtime_session_id`,
  );
  const audit = await select(
    "participant_invitation_audit_events",
    `?after_state->>case_id=eq.${fixture.ids.case}&event_type=eq.created&select=id`,
  );

  const requestedProfileCount = invitations.reduce(
    (sum, invitation) => sum + (invitation.metadata?.requested_profiles?.length ?? 0),
    0,
  );

  const summary = {
    mode,
    project_ref: fixture.projectRef,
    company_id_masked: mask(fixture.ids.empresa),
    engagement_id_masked: mask(fixture.ids.clientRelationship),
    case_id_masked: mask(fixture.ids.case),
    participants_planned: fixture.participants.length,
    invitations_pending: invitations.filter((item) => item.status === "pending").length,
    invitations_accepted: invitations.filter((item) => item.accepted_at !== null).length,
    requested_profile_count: requestedProfileCount,
    primary_active_sponsors: sponsors.filter((item) => item.status === "active" && item.is_primary).length,
    runtime_sessions: runtime.length,
    audit_created_events: audit.length,
    plain_tokens_persisted: 0,
    emails_sent_by_script: 0,
    invitation_results: invitationResults.map((item) => ({
      email: item.invited_email,
      status: item.status,
      kind: item.invitation_kind,
    })),
  };

  console.log(JSON.stringify(summary, null, 2));
}

await main();
