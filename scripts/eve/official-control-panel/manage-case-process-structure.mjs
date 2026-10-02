#!/usr/bin/env node

/**
 * Administrative management of Case → Main process → Milestones (Unit 3A).
 * Local / controlled service-role only. Never invents Amber process from case name.
 *
 * Commands:
 *   inspect
 *   create-main-process
 *   add-milestone
 *   set-current-milestone
 *   update-milestone
 *   disable-milestone
 *
 * Always supports --dry-run. Writes require --confirm=UNIT3A_ADMIN.
 */

import { createClient } from "@supabase/supabase-js";

const WRITE_CONFIRMATION = "UNIT3A_ADMIN";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const STATUSES = new Set([
  "not_started",
  "available",
  "current",
  "waiting",
  "completed",
  "blocked",
  "unknown",
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
    case "create-main-process":
      await createMainProcess(client, actorUserId, dryRun);
      break;
    case "add-milestone":
      await addMilestone(client, actorUserId, dryRun);
      break;
    case "set-current-milestone":
      await setCurrentMilestone(client, actorUserId, dryRun);
      break;
    case "update-milestone":
      await updateMilestone(client, actorUserId, dryRun);
      break;
    case "disable-milestone":
      await disableMilestone(client, actorUserId, dryRun);
      break;
    default:
      throw new Error(
        "unknown_command: use inspect, create-main-process, add-milestone, set-current-milestone, update-milestone, or disable-milestone",
      );
  }
}

function createAdminClient() {
  const url =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.MBA_SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) throw new Error("supabase_admin_environment_missing");

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function inspect(client) {
  const caseId = optionalUuid("case", args.case);
  const companyId = optionalUuid("company", args.company);
  const relationshipId = optionalUuid("relationship", args.relationship);

  let caseQuery = client
    .from("sesiones_llenado")
    .select("id, display_name, client_company_id, client_relationship_id");

  if (caseId) caseQuery = caseQuery.eq("id", caseId);
  if (companyId) caseQuery = caseQuery.eq("client_company_id", companyId);
  if (relationshipId) {
    caseQuery = caseQuery.eq("client_relationship_id", relationshipId);
  }

  const { data: cases, error: caseError } = await caseQuery.limit(20);
  if (caseError) throw new Error("case_inspect_failed");

  const caseIds = (cases ?? []).map((row) => row.id);
  let processes = [];
  let milestones = [];

  if (caseIds.length > 0) {
    const { data: processRows, error: processError } = await client
      .from("case_main_processes")
      .select(
        "id, case_id, label, status, current_milestone_id, enabled, created_at",
      )
      .in("case_id", caseIds);
    if (processError) throw new Error("process_inspect_failed");
    processes = processRows ?? [];

    const processIds = processes.map((row) => row.id);
    if (processIds.length > 0) {
      const { data: milestoneRows, error: milestoneError } = await client
        .from("case_milestones")
        .select(
          "id, main_process_id, label, sequence, status, expected_event_label, timer_due_at, support_process_label, enabled",
        )
        .in("main_process_id", processIds)
        .order("sequence", { ascending: true });
      if (milestoneError) throw new Error("milestone_inspect_failed");
      milestones = milestoneRows ?? [];
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        cases: cases ?? [],
        mainProcesses: processes,
        milestones,
        note: "Absence of process/milestones is factual emptiness, not an error.",
      },
      null,
      2,
    ),
  );
}

async function createMainProcess(client, actorUserId, dryRun) {
  const caseId = requireUuid("case", args.case);
  const label = requireLabel("label", args.label);
  const status = optionalStatus(args.status, "unknown");

  const linkedCase = await requireLinkedCase(client, caseId);
  await assertNoEnabledProcess(client, caseId);

  if (dryRun) {
    printDryRun("main_process_create_valid", {
      caseId,
      companyId: linkedCase.client_company_id,
      relationshipId: linkedCase.client_relationship_id,
      label,
      status,
    });
    return;
  }

  const { data, error } = await client.rpc("eve_admin_create_case_main_process", {
    p_actor_user_id: actorUserId,
    p_case_id: caseId,
    p_label: label,
    p_status: status,
  });
  if (error) throw new Error(error.message || "main_process_create_failed");

  console.log(
    JSON.stringify({
      ok: true,
      mainProcessId: data,
      caseId,
      label,
      status,
    }),
  );
}

async function addMilestone(client, actorUserId, dryRun) {
  const mainProcessId = requireUuid("process", args.process);
  const label = requireLabel("label", args.label);
  const sequence = requireSequence(args.sequence);
  const status = optionalStatus(args.status, "not_started");
  const expectedEvent = optionalTrimmed(args["expected-event"]);
  const timerDueAt = optionalTimestamp("timer-due-at", args["timer-due-at"]);
  const supportProcess = optionalTrimmed(args["support-process"]);

  if (status === "waiting" && !expectedEvent && !timerDueAt) {
    throw new Error("waiting_requires_event_or_timer");
  }

  const process = await requireEnabledProcess(client, mainProcessId);
  await assertSequenceAvailable(client, mainProcessId, sequence);

  if (dryRun) {
    printDryRun("milestone_add_valid", {
      mainProcessId,
      caseId: process.case_id,
      label,
      sequence,
      status,
      expectedEvent,
      timerDueAt,
      supportProcess,
    });
    return;
  }

  const { data, error } = await client.rpc("eve_admin_add_case_milestone", {
    p_actor_user_id: actorUserId,
    p_main_process_id: mainProcessId,
    p_label: label,
    p_sequence: sequence,
    p_status: status,
    p_expected_event_label: expectedEvent,
    p_timer_due_at: timerDueAt,
    p_support_process_label: supportProcess,
  });
  if (error) throw new Error(error.message || "milestone_add_failed");

  console.log(
    JSON.stringify({
      ok: true,
      milestoneId: data,
      mainProcessId,
      sequence,
      label,
      status,
    }),
  );
}

async function setCurrentMilestone(client, actorUserId, dryRun) {
  const mainProcessId = requireUuid("process", args.process);
  const milestoneId =
    args.milestone === null || args.milestone === "null"
      ? null
      : requireUuid("milestone", args.milestone);

  await requireEnabledProcess(client, mainProcessId);

  if (milestoneId) {
    const milestone = await requireEnabledMilestone(client, milestoneId);
    if (milestone.main_process_id !== mainProcessId) {
      throw new Error("current_milestone_process_mismatch");
    }
  }

  if (dryRun) {
    printDryRun("current_milestone_set_valid", {
      mainProcessId,
      milestoneId,
    });
    return;
  }

  const { error } = await client.rpc("eve_admin_set_current_case_milestone", {
    p_actor_user_id: actorUserId,
    p_main_process_id: mainProcessId,
    p_milestone_id: milestoneId,
  });
  if (error) throw new Error(error.message || "current_milestone_set_failed");

  console.log(
    JSON.stringify({
      ok: true,
      mainProcessId,
      currentMilestoneId: milestoneId,
    }),
  );
}

async function updateMilestone(client, actorUserId, dryRun) {
  const milestoneId = requireUuid("milestone", args.milestone);
  const label = args.label != null ? requireLabel("label", args.label) : null;
  const status = args.status != null ? optionalStatus(args.status) : null;
  const clearExpected = args["clear-expected-event"] === true;
  const clearTimer = args["clear-timer"] === true;
  const clearSupport = args["clear-support-process"] === true;
  const expectedEvent = clearExpected
    ? null
    : optionalTrimmed(args["expected-event"]);
  const timerDueAt = clearTimer
    ? null
    : optionalTimestamp("timer-due-at", args["timer-due-at"]);
  const supportProcess = clearSupport
    ? null
    : optionalTrimmed(args["support-process"]);

  const milestone = await requireEnabledMilestone(client, milestoneId);
  const nextStatus = status ?? milestone.status;
  const nextEvent = clearExpected
    ? null
    : expectedEvent !== null && expectedEvent !== undefined
      ? expectedEvent
      : milestone.expected_event_label;
  const nextTimer = clearTimer
    ? null
    : timerDueAt !== null && timerDueAt !== undefined
      ? timerDueAt
      : milestone.timer_due_at;

  if (nextStatus === "waiting" && !nextEvent && !nextTimer) {
    throw new Error("waiting_requires_event_or_timer");
  }

  if (dryRun) {
    printDryRun("milestone_update_valid", {
      milestoneId,
      label,
      status: nextStatus,
      expectedEvent: nextEvent,
      timerDueAt: nextTimer,
      supportProcess,
    });
    return;
  }

  const { error } = await client.rpc("eve_admin_update_case_milestone", {
    p_actor_user_id: actorUserId,
    p_milestone_id: milestoneId,
    p_label: label,
    p_status: status,
    p_expected_event_label: expectedEvent,
    p_clear_expected_event: clearExpected,
    p_timer_due_at: timerDueAt,
    p_clear_timer: clearTimer,
    p_support_process_label: supportProcess,
    p_clear_support_process: clearSupport,
  });
  if (error) throw new Error(error.message || "milestone_update_failed");

  console.log(JSON.stringify({ ok: true, milestoneId }));
}

async function disableMilestone(client, actorUserId, dryRun) {
  const milestoneId = requireUuid("milestone", args.milestone);
  await requireEnabledMilestone(client, milestoneId);

  if (dryRun) {
    printDryRun("milestone_disable_valid", { milestoneId });
    return;
  }

  const { error } = await client.rpc("eve_admin_disable_case_milestone", {
    p_actor_user_id: actorUserId,
    p_milestone_id: milestoneId,
  });
  if (error) throw new Error(error.message || "milestone_disable_failed");

  console.log(JSON.stringify({ ok: true, milestoneId, enabled: false }));
}

async function requireLinkedCase(client, caseId) {
  const { data, error } = await client
    .from("sesiones_llenado")
    .select("id, client_company_id, client_relationship_id, display_name")
    .eq("id", caseId)
    .maybeSingle();
  if (error) throw new Error("case_lookup_failed");
  if (!data) throw new Error("case_not_found");
  if (!data.client_company_id || !data.client_relationship_id) {
    throw new Error("case_missing_explicit_context");
  }
  return data;
}

async function assertNoEnabledProcess(client, caseId) {
  const { data, error } = await client
    .from("case_main_processes")
    .select("id")
    .eq("case_id", caseId)
    .eq("enabled", true)
    .limit(1);
  if (error) throw new Error("process_lookup_failed");
  if ((data ?? []).length > 0) throw new Error("case_already_has_active_main_process");
}

async function requireEnabledProcess(client, processId) {
  const { data, error } = await client
    .from("case_main_processes")
    .select("id, case_id, enabled")
    .eq("id", processId)
    .eq("enabled", true)
    .maybeSingle();
  if (error) throw new Error("process_lookup_failed");
  if (!data) throw new Error("main_process_not_found");
  return data;
}

async function requireEnabledMilestone(client, milestoneId) {
  const { data, error } = await client
    .from("case_milestones")
    .select(
      "id, main_process_id, status, expected_event_label, timer_due_at, enabled",
    )
    .eq("id", milestoneId)
    .eq("enabled", true)
    .maybeSingle();
  if (error) throw new Error("milestone_lookup_failed");
  if (!data) throw new Error("milestone_not_found");
  return data;
}

async function assertSequenceAvailable(client, processId, sequence) {
  const { data, error } = await client
    .from("case_milestones")
    .select("id")
    .eq("main_process_id", processId)
    .eq("sequence", sequence)
    .limit(1);
  if (error) throw new Error("sequence_lookup_failed");
  if ((data ?? []).length > 0) throw new Error("duplicate_milestone_sequence");
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
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      out[key] = true;
    } else {
      out[key] = next;
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

function optionalTrimmed(value) {
  if (value == null || value === true) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function requireSequence(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) throw new Error("sequence_invalid");
  return n;
}

function optionalStatus(value, fallback) {
  if (value == null || value === true) {
    if (fallback == null) throw new Error("status_required");
    return fallback;
  }
  if (!STATUSES.has(String(value))) throw new Error("invalid_status");
  return String(value);
}

function optionalTimestamp(name, value) {
  if (value == null || value === true) return null;
  const instant = Date.parse(String(value));
  if (!Number.isFinite(instant)) throw new Error(`${name}_invalid`);
  return new Date(instant).toISOString();
}
