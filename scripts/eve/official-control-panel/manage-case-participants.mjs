#!/usr/bin/env node

/**
 * Administrative management of case participants + functional profiles (R2A).
 * Never invents Amber participants. Never activates UI/KPI.
 */

import { createClient } from "@supabase/supabase-js";

const WRITE_CONFIRMATION = "R2A_ADMIN";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PARTICIPATION_STATUSES = new Set([
  "active",
  "inactive",
  "pending_review",
]);
const RESOLUTION_STATUSES = new Set([
  "resolved",
  "mixed_unresolved",
  "reentry_required",
  "manual_review_required",
  "unavailable",
]);

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

  const actorUserId = dryRun ? null : requireUuid("actor", args.actor);
  if (!dryRun) {
    requireWriteConfirmation();
    await requireAuthUser(client, actorUserId, "actor_user_not_found");
  }

  switch (command) {
    case "add-participant":
      await addParticipant(client, actorUserId, dryRun);
      break;
    case "disable-participant":
      await disableParticipant(client, actorUserId, dryRun);
      break;
    case "add-profile":
      await addProfile(client, actorUserId, dryRun);
      break;
    case "update-profile-resolution":
      await updateResolution(client, actorUserId, dryRun);
      break;
    case "reassign-profile":
      await reassignProfile(client, actorUserId, dryRun);
      break;
    case "disable-profile":
      await disableProfile(client, actorUserId, dryRun);
      break;
    default:
      throw new Error(
        "unknown_command: inspect|add-participant|disable-participant|add-profile|update-profile-resolution|reassign-profile|disable-profile",
      );
  }
}

async function inspect(client) {
  const caseId = optionalUuid("case", args.case);
  let participantsQuery = client
    .from("case_participants")
    .select(
      "id, case_id, user_id, display_label, participation_status, enabled, created_at",
    )
    .eq("enabled", true)
    .order("created_at", { ascending: true });
  if (caseId) participantsQuery = participantsQuery.eq("case_id", caseId);

  const { data: participants, error } = await participantsQuery;
  if (error) throw new Error(error.message);

  const list = participants ?? [];
  const profilesByParticipant = {};
  for (const p of list) {
    const { data: profiles, error: pErr } = await client
      .from("case_participant_profiles")
      .select(
        "id, case_participant_id, display_label, resolution_status, enabled",
      )
      .eq("case_participant_id", p.id)
      .eq("enabled", true);
    if (pErr) throw new Error(pErr.message);
    profilesByParticipant[p.id] = profiles ?? [];
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        caseId: caseId ?? null,
        participantCount: list.length,
        participants: list.map((p) => ({
          id: p.id,
          caseId: p.case_id,
          userId: p.user_id,
          label: p.display_label,
          status: p.participation_status,
          profiles: (profilesByParticipant[p.id] ?? []).map((pr) => ({
            id: pr.id,
            label: pr.display_label,
            resolutionStatus: pr.resolution_status,
          })),
        })),
        note: "sesiones_llenado.usuario_id is not listed here",
      },
      null,
      2,
    ),
  );
}

async function addParticipant(client, actorUserId, dryRun) {
  const caseId = requireUuid("case", args.case);
  const userId = requireUuid("user", args.user);
  const label = requireLabel("label", args.label);
  const status = optionalParticipationStatus(args.status) ?? "active";
  if (dryRun) {
    printDryRun("add_participant_valid", { caseId, userId, label, status });
    return;
  }
  const { data, error } = await client.rpc("eve_admin_add_case_participant", {
    p_actor_user_id: actorUserId,
    p_case_id: caseId,
    p_user_id: userId,
    p_display_label: label,
    p_participation_status: status,
    p_valid_from: args["valid-from"] ?? null,
    p_valid_until: args["valid-until"] ?? null,
  });
  if (error) throw new Error(error.message || "add_participant_failed");
  console.log(JSON.stringify({ ok: true, participantId: data }));
}

async function disableParticipant(client, actorUserId, dryRun) {
  const participantId = requireUuid("participant", args.participant);
  const reason = requireLabel("reason", args.reason);
  if (dryRun) {
    printDryRun("disable_participant_valid", { participantId, reason });
    return;
  }
  const { error } = await client.rpc("eve_admin_disable_case_participant", {
    p_actor_user_id: actorUserId,
    p_participant_id: participantId,
    p_reason: reason,
  });
  if (error) throw new Error(error.message || "disable_participant_failed");
  console.log(JSON.stringify({ ok: true, participantId, disabled: true }));
}

async function addProfile(client, actorUserId, dryRun) {
  const participantId = requireUuid("participant", args.participant);
  const label = requireLabel("label", args.label);
  const resolution =
    optionalResolutionStatus(args.resolution) ?? "unavailable";
  if (dryRun) {
    printDryRun("add_profile_valid", { participantId, label, resolution });
    return;
  }
  const { data, error } = await client.rpc(
    "eve_admin_add_case_participant_profile",
    {
      p_actor_user_id: actorUserId,
      p_case_participant_id: participantId,
      p_display_label: label,
      p_resolution_status: resolution,
      p_valid_from: args["valid-from"] ?? null,
      p_valid_until: args["valid-until"] ?? null,
    },
  );
  if (error) throw new Error(error.message || "add_profile_failed");
  console.log(JSON.stringify({ ok: true, profileId: data }));
}

async function updateResolution(client, actorUserId, dryRun) {
  const profileId = requireUuid("profile", args.profile);
  const resolution = requireResolutionStatus(args.resolution);
  const reason = requireLabel("reason", args.reason);
  if (dryRun) {
    printDryRun("update_resolution_valid", { profileId, resolution, reason });
    return;
  }
  const { error } = await client.rpc(
    "eve_admin_update_case_participant_profile_resolution",
    {
      p_actor_user_id: actorUserId,
      p_profile_id: profileId,
      p_resolution_status: resolution,
      p_reason: reason,
    },
  );
  if (error) throw new Error(error.message || "update_resolution_failed");
  console.log(JSON.stringify({ ok: true, profileId, resolution }));
}

async function reassignProfile(client, actorUserId, dryRun) {
  const profileId = requireUuid("profile", args.profile);
  const label = requireLabel("label", args.label);
  const resolution =
    optionalResolutionStatus(args.resolution) ?? "unavailable";
  const reason = requireLabel("reason", args.reason);
  if (dryRun) {
    printDryRun("reassign_profile_valid", {
      profileId,
      label,
      resolution,
      reason,
    });
    return;
  }
  const { data, error } = await client.rpc(
    "eve_admin_reassign_case_participant_profile",
    {
      p_actor_user_id: actorUserId,
      p_profile_id: profileId,
      p_new_display_label: label,
      p_resolution_status: resolution,
      p_reason: reason,
    },
  );
  if (error) throw new Error(error.message || "reassign_failed");
  console.log(
    JSON.stringify({
      ok: true,
      previousProfileId: profileId,
      newProfileId: data,
    }),
  );
}

async function disableProfile(client, actorUserId, dryRun) {
  const profileId = requireUuid("profile", args.profile);
  const reason = requireLabel("reason", args.reason);
  if (dryRun) {
    printDryRun("disable_profile_valid", { profileId, reason });
    return;
  }
  const { error } = await client.rpc(
    "eve_admin_disable_case_participant_profile",
    {
      p_actor_user_id: actorUserId,
      p_profile_id: profileId,
      p_reason: reason,
    },
  );
  if (error) throw new Error(error.message || "disable_profile_failed");
  console.log(JSON.stringify({ ok: true, profileId, disabled: true }));
}

function createAdminClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.MBA_SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("supabase_admin_environment_missing");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function requireAuthUser(client, userId, code) {
  const { data, error } = await client.auth.admin.getUserById(userId);
  if (error || !data?.user) throw new Error(code);
}

function requireWriteConfirmation() {
  if (args.confirm !== WRITE_CONFIRMATION) {
    throw new Error(`write_confirmation_required: --confirm=${WRITE_CONFIRMATION}`);
  }
}

function printDryRun(code, payload) {
  console.log(JSON.stringify({ ok: true, dryRun: true, code, ...payload }, null, 2));
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const body = token.slice(2);
    if (body.includes("=")) {
      const eq = body.indexOf("=");
      out[body.slice(0, eq)] = body.slice(eq + 1);
      continue;
    }
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) out[body] = true;
    else {
      out[body] = next;
      i += 1;
    }
  }
  return out;
}

function requireUuid(name, value) {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new Error(`${name}_uuid_required`);
  }
  return value;
}

function optionalUuid(name, value) {
  if (value == null || value === true) return null;
  return requireUuid(name, value);
}

function requireLabel(name, value) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name}_required`);
  }
  return value.trim();
}

function optionalParticipationStatus(value) {
  if (value == null || value === true) return null;
  if (!PARTICIPATION_STATUSES.has(String(value))) {
    throw new Error("invalid_participation_status");
  }
  return String(value);
}

function optionalResolutionStatus(value) {
  if (value == null || value === true) return null;
  return requireResolutionStatus(value);
}

function requireResolutionStatus(value) {
  if (!RESOLUTION_STATUSES.has(String(value))) {
    throw new Error("invalid_resolution_status");
  }
  return String(value);
}
