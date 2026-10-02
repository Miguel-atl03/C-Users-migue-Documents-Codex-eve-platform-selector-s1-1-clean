#!/usr/bin/env node

/**
 * Admin: case_profile_runtime_session_links (§10 bridge).
 * Commands: inspect|link|confirm|revoke|list-by-profile|list-by-session
 * Requires --dry-run or --confirm=POINT10_PROFILE_RRS_ADMIN
 * Never invents Amber links.
 */

import { createClient } from "@supabase/supabase-js";

const WRITE_CONFIRMATION = "POINT10_PROFILE_RRS_ADMIN";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const [command, ...rawArgs] = process.argv.slice(2);
const args = parseArgs(rawArgs);

main().catch((error) => {
  console.error(
    JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : "admin_operation_failed",
    }),
  );
  process.exitCode = 1;
});

async function main() {
  const client = createAdminClient();
  const dryRun = args["dry-run"] === true;

  if (command === "inspect") {
    await inspect(client);
    return;
  }

  if (command === "list-by-profile") {
    await listByProfile(client);
    return;
  }

  if (command === "list-by-session") {
    await listBySession(client);
    return;
  }

  const actorUserId = dryRun ? null : requireUuid("actor", args.actor);
  if (!dryRun) {
    requireWriteConfirmation();
    await requireAuthUser(client, actorUserId, "actor_user_not_found");
  }

  switch (command) {
    case "link":
      await link(client, actorUserId, dryRun);
      break;
    case "confirm":
      await confirm(client, actorUserId, dryRun);
      break;
    case "revoke":
      await revoke(client, actorUserId, dryRun);
      break;
    default:
      throw new Error(
        "unknown_command: inspect|link|confirm|revoke|list-by-profile|list-by-session",
      );
  }
}

async function inspect(client) {
  const { count: linkCount, error } = await client
    .from("case_profile_runtime_session_links")
    .select("id", { count: "exact", head: true });
  if (error) throw error;

  const amberCase = "19fc9eff-4219-43f0-854c-e2b3350f23f2";
  const { data: amberLinks, error: amberError } = await client
    .from("case_profile_runtime_session_links")
    .select(
      "id, case_participant_profile_id, role_runtime_session_id, link_status, enabled, role_runtime_session!inner(case_id)",
    )
    .eq("role_runtime_session.case_id", amberCase);
  if (amberError) throw amberError;

  console.log(
    JSON.stringify(
      {
        ok: true,
        table: "case_profile_runtime_session_links",
        totalLinks: linkCount ?? 0,
        amberCase,
        amberLinks: amberLinks ?? [],
        note: "No inventar vínculos Amber. Solo evidencia canónica.",
      },
      null,
      2,
    ),
  );
}

async function listByProfile(client) {
  const profileId = requireUuid("profile", args.profile);
  const { data, error } = await client
    .from("case_profile_runtime_session_links")
    .select("*")
    .eq("case_participant_profile_id", profileId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  console.log(JSON.stringify({ ok: true, profileId, links: data ?? [] }, null, 2));
}

async function listBySession(client) {
  const sessionId = requireUuid("session", args.session);
  const { data, error } = await client
    .from("case_profile_runtime_session_links")
    .select("*")
    .eq("role_runtime_session_id", sessionId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  console.log(JSON.stringify({ ok: true, sessionId, links: data ?? [] }, null, 2));
}

async function link(client, actorUserId, dryRun) {
  const profileId = requireUuid("profile", args.profile);
  const sessionId = requireUuid("session", args.session);
  const sourceReference =
    typeof args["source-reference"] === "string"
      ? args["source-reference"]
      : null;

  const profile = await loadProfile(client, profileId);
  const session = await loadSession(client, sessionId);
  if (profile.caseId !== session.case_id) {
    throw new Error("profile_runtime_session_case_mismatch");
  }

  const payload = {
    case_participant_profile_id: profileId,
    role_runtime_session_id: sessionId,
    link_status: "pending_review",
    enabled: true,
    source_reference: sourceReference,
    created_by: actorUserId,
    updated_by: actorUserId,
  };

  if (dryRun) {
    console.log(JSON.stringify({ ok: true, dryRun: true, wouldInsert: payload }, null, 2));
    return;
  }

  const { data, error } = await client
    .from("case_profile_runtime_session_links")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;

  await writeAudit(client, {
    actorUserId,
    action: "profile_runtime_session_link_created",
    caseId: profile.caseId,
    companyId: profile.companyId,
    relationshipId: profile.relationshipId,
    reason: sourceReference ?? "admin_link",
    before: null,
    after: data,
  });

  console.log(JSON.stringify({ ok: true, link: data }, null, 2));
}

async function confirm(client, actorUserId, dryRun) {
  const linkId = requireUuid("link", args.link);
  const { data: existing, error } = await client
    .from("case_profile_runtime_session_links")
    .select("*")
    .eq("id", linkId)
    .single();
  if (error) throw error;
  if (existing.link_status === "revoked") {
    throw new Error("cannot_confirm_revoked_link");
  }

  if (dryRun) {
    console.log(
      JSON.stringify(
        { ok: true, dryRun: true, wouldConfirm: linkId },
        null,
        2,
      ),
    );
    return;
  }

  const { data, error: updateError } = await client
    .from("case_profile_runtime_session_links")
    .update({
      link_status: "confirmed",
      enabled: true,
      updated_by: actorUserId,
    })
    .eq("id", linkId)
    .select("*")
    .single();
  if (updateError) throw updateError;

  const profile = await loadProfile(client, existing.case_participant_profile_id);
  await writeAudit(client, {
    actorUserId,
    action: "profile_runtime_session_link_confirmed",
    caseId: profile.caseId,
    companyId: profile.companyId,
    relationshipId: profile.relationshipId,
    reason: "admin_confirm",
    before: existing,
    after: data,
  });

  console.log(JSON.stringify({ ok: true, link: data }, null, 2));
}

async function revoke(client, actorUserId, dryRun) {
  const linkId = requireUuid("link", args.link);
  const reason =
    typeof args.reason === "string" ? args.reason : "admin_revoke";
  const { data: existing, error } = await client
    .from("case_profile_runtime_session_links")
    .select("*")
    .eq("id", linkId)
    .single();
  if (error) throw error;

  if (dryRun) {
    console.log(
      JSON.stringify({ ok: true, dryRun: true, wouldRevoke: linkId }, null, 2),
    );
    return;
  }

  const { data, error: updateError } = await client
    .from("case_profile_runtime_session_links")
    .update({
      link_status: "revoked",
      enabled: false,
      updated_by: actorUserId,
    })
    .eq("id", linkId)
    .select("*")
    .single();
  if (updateError) throw updateError;

  const profile = await loadProfile(client, existing.case_participant_profile_id);
  await writeAudit(client, {
    actorUserId,
    action: "profile_runtime_session_link_revoked",
    caseId: profile.caseId,
    companyId: profile.companyId,
    relationshipId: profile.relationshipId,
    reason,
    before: existing,
    after: data,
  });

  console.log(JSON.stringify({ ok: true, link: data }, null, 2));
}

async function loadProfile(client, profileId) {
  const { data: profile, error } = await client
    .from("case_participant_profiles")
    .select("id, case_participant_id, enabled")
    .eq("id", profileId)
    .single();
  if (error) throw error;
  if (!profile.enabled) throw new Error("disabled_profile_cannot_receive_new_link");

  const { data: participant, error: pError } = await client
    .from("case_participants")
    .select("id, case_id, enabled")
    .eq("id", profile.case_participant_id)
    .single();
  if (pError) throw pError;

  const { data: sessionCase, error: cError } = await client
    .from("sesiones_llenado")
    .select("id, client_company_id, client_relationship_id")
    .eq("id", participant.case_id)
    .maybeSingle();
  if (cError) throw cError;

  return {
    profileId: profile.id,
    caseId: participant.case_id,
    companyId: sessionCase?.client_company_id ?? null,
    relationshipId: sessionCase?.client_relationship_id ?? null,
  };
}

async function loadSession(client, sessionId) {
  const { data, error } = await client
    .from("role_runtime_session")
    .select("id, case_id, state")
    .eq("id", sessionId)
    .single();
  if (error) throw error;
  return data;
}

async function writeAudit(client, input) {
  if (!input.companyId || !input.relationshipId) {
    console.warn(
      JSON.stringify({
        warning: "audit_skipped_missing_company_or_relationship",
      }),
    );
    return;
  }
  const { error } = await client.from("official_control_panel_context_audit").insert({
    actor_user_id: input.actorUserId,
    action: input.action,
    client_company_id: input.companyId,
    client_relationship_id: input.relationshipId,
    case_id: input.caseId,
    reason: input.reason,
    before_state: input.before,
    after_state: input.after,
  });
  if (error) throw error;
}

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("missing_supabase_admin_env");
  return createClient(url, key, { auth: { persistSession: false } });
}

function requireWriteConfirmation() {
  if (args.confirm !== WRITE_CONFIRMATION) {
    throw new Error(`confirm_required:${WRITE_CONFIRMATION}`);
  }
}

async function requireAuthUser(client, userId, code) {
  const { data, error } = await client.auth.admin.getUserById(userId);
  if (error || !data?.user) throw new Error(code);
}

function requireUuid(name, value) {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new Error(`invalid_${name}_uuid`);
  }
  return value;
}

function parseArgs(raw) {
  const out = {};
  for (let i = 0; i < raw.length; i += 1) {
    const token = raw[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = raw[i + 1];
    if (!next || next.startsWith("--")) {
      out[key] = true;
    } else {
      out[key] = next;
      i += 1;
    }
  }
  return out;
}
