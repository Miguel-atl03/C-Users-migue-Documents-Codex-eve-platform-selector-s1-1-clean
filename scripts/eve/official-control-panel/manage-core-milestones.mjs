#!/usr/bin/env node

/**
 * Administrative management of H0–H6 core milestones (Unit 4A).
 * Never invents Amber achievements. Never activates KPI UI.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const WRITE_CONFIRMATION = "UNIT4A_ADMIN";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CODES = new Set(["H0", "H1", "H2", "H3", "H4", "H5", "H6"]);
const CATALOG_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "core-milestone-h0-h6-catalog.json",
);

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

  switch (command) {
    case "inspect-definitions":
      await inspectDefinitions(client);
      return;
    case "calculate-progress":
      await calculateProgress(client);
      return;
    default:
      break;
  }

  const actorUserId = dryRun ? null : requireUuid("actor", args.actor);
  if (!dryRun) {
    requireWriteConfirmation();
    await requireAuthUser(client, actorUserId, "actor_user_not_found");
  }

  switch (command) {
    case "register-definition":
      await registerDefinition(client, actorUserId, dryRun);
      break;
    case "seed-canonical-definitions":
      await seedCanonicalDefinitions(client, actorUserId, dryRun);
      break;
    case "set-process-core-code":
      await setProcessCoreCode(client, actorUserId, dryRun);
      break;
    case "link-case":
      await linkCase(client, actorUserId, dryRun);
      break;
    case "link-case-h0-h6":
      await linkCaseH0H6(client, actorUserId, dryRun);
      break;
    case "link-operational-milestone":
      await linkOperational(client, actorUserId, dryRun);
      break;
    case "record-achievement":
      await recordAchievement(client, actorUserId, dryRun);
      break;
    case "revoke-achievement":
      await revokeAchievement(client, actorUserId, dryRun);
      break;
    default:
      throw new Error(
        "unknown_command: use inspect-definitions, register-definition, seed-canonical-definitions, set-process-core-code, link-case, link-case-h0-h6, link-operational-milestone, record-achievement, revoke-achievement, calculate-progress",
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

function loadCatalog() {
  return JSON.parse(readFileSync(CATALOG_PATH, "utf8"));
}

async function inspectDefinitions(client) {
  const { data, error } = await client
    .from("core_milestone_definitions")
    .select(
      "id, code, label, sequence, expected_object_name, expected_object_state, enabled",
    )
    .order("sequence", { ascending: true });
  if (error) throw new Error("definition_inspect_failed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        definitions: data ?? [],
        catalogSource: CATALOG_PATH,
        note: "Catalog rows are separate from case links and achievements.",
      },
      null,
      2,
    ),
  );
}

async function calculateProgress(client) {
  const caseId = requireUuid("case", args.case);
  const { data, error } = await client.rpc(
    "eve_calculate_core_milestone_progress",
    { p_case_id: caseId },
  );
  if (error) throw new Error(error.message || "calculate_progress_failed");
  console.log(JSON.stringify({ ok: true, caseId, progress: data }, null, 2));
}

async function registerDefinition(client, actorUserId, dryRun) {
  const code = requireCode(args.code);
  const label = requireLabel("label", args.label);
  const sequence = requireSequence(args.sequence);
  const objectName = requireLabel("object-name", args["object-name"]);
  const objectState = requireLabel("object-state", args["object-state"]);

  if (dryRun) {
    printDryRun("core_definition_register_valid", {
      code,
      label,
      sequence,
      objectName,
      objectState,
    });
    return;
  }

  const { data, error } = await client.rpc(
    "eve_admin_register_core_milestone_definition",
    {
      p_actor_user_id: actorUserId,
      p_code: code,
      p_label: label,
      p_sequence: sequence,
      p_expected_object_name: objectName,
      p_expected_object_state: objectState,
    },
  );
  if (error) throw new Error(error.message || "register_definition_failed");
  console.log(JSON.stringify({ ok: true, definitionId: data, code }));
}

async function seedCanonicalDefinitions(client, actorUserId, dryRun) {
  const catalog = loadCatalog();
  if (dryRun) {
    printDryRun("seed_canonical_definitions_valid", {
      count: catalog.length,
      codes: catalog.map((item) => item.code),
    });
    return;
  }

  const created = [];
  for (const item of catalog) {
    const { data, error } = await client.rpc(
      "eve_admin_register_core_milestone_definition",
      {
        p_actor_user_id: actorUserId,
        p_code: item.code,
        p_label: item.label,
        p_sequence: item.sequence,
        p_expected_object_name: item.expectedObjectName,
        p_expected_object_state: item.expectedObjectState,
      },
    );
    if (error) throw new Error(error.message || `seed_failed_${item.code}`);
    created.push({ code: item.code, definitionId: data });
  }
  console.log(JSON.stringify({ ok: true, created }, null, 2));
}

async function setProcessCoreCode(client, actorUserId, dryRun) {
  const processId = requireUuid("process", args.process);
  const code =
    args["core-code"] === "null" || args["core-code"] == null
      ? null
      : String(args["core-code"]);
  if (code != null && code !== "PF-CORE-01") {
    throw new Error("invalid_core_process_code");
  }
  if (dryRun) {
    printDryRun("set_process_core_code_valid", { processId, code });
    return;
  }
  const { error } = await client.rpc("eve_admin_set_main_process_core_code", {
    p_actor_user_id: actorUserId,
    p_main_process_id: processId,
    p_core_process_code: code,
  });
  if (error) throw new Error(error.message || "set_core_code_failed");
  console.log(JSON.stringify({ ok: true, processId, coreProcessCode: code }));
}

async function linkCase(client, actorUserId, dryRun) {
  const caseId = requireUuid("case", args.case);
  const processId = requireUuid("process", args.process);
  const definitionId = requireUuid("definition", args.definition);
  const applicability = args.applicability
    ? String(args.applicability)
    : "applicable";
  if (dryRun) {
    printDryRun("link_case_valid", {
      caseId,
      processId,
      definitionId,
      applicability,
    });
    return;
  }
  const { data, error } = await client.rpc("eve_admin_link_case_core_milestone", {
    p_actor_user_id: actorUserId,
    p_case_id: caseId,
    p_main_process_id: processId,
    p_core_milestone_definition_id: definitionId,
    p_applicability_status: applicability,
  });
  if (error) throw new Error(error.message || "link_case_failed");
  console.log(JSON.stringify({ ok: true, caseCoreMilestoneId: data }));
}

async function linkCaseH0H6(client, actorUserId, dryRun) {
  const caseId = requireUuid("case", args.case);
  const processId = requireUuid("process", args.process);
  const { data: defs, error } = await client
    .from("core_milestone_definitions")
    .select("id, code")
    .eq("enabled", true)
    .in("code", ["H0", "H1", "H2", "H3", "H4", "H5", "H6"]);
  if (error) throw new Error("definitions_lookup_failed");
  if ((defs ?? []).length !== 7) {
    throw new Error("canonical_definitions_incomplete");
  }
  if (dryRun) {
    printDryRun("link_case_h0_h6_valid", {
      caseId,
      processId,
      codes: (defs ?? []).map((d) => d.code),
    });
    return;
  }
  const linked = [];
  for (const def of defs) {
    const { data, error: linkError } = await client.rpc(
      "eve_admin_link_case_core_milestone",
      {
        p_actor_user_id: actorUserId,
        p_case_id: caseId,
        p_main_process_id: processId,
        p_core_milestone_definition_id: def.id,
        p_applicability_status: "applicable",
      },
    );
    if (linkError) throw new Error(linkError.message || `link_failed_${def.code}`);
    linked.push({ code: def.code, caseCoreMilestoneId: data });
  }
  console.log(JSON.stringify({ ok: true, linked }, null, 2));
}

async function linkOperational(client, actorUserId, dryRun) {
  const caseCoreId = requireUuid("case-core", args["case-core"]);
  const milestoneId = requireUuid("milestone", args.milestone);
  if (dryRun) {
    printDryRun("link_operational_valid", { caseCoreId, milestoneId });
    return;
  }
  const { error } = await client.rpc(
    "eve_admin_link_operational_core_milestone",
    {
      p_actor_user_id: actorUserId,
      p_case_core_milestone_id: caseCoreId,
      p_operational_milestone_id: milestoneId,
    },
  );
  if (error) throw new Error(error.message || "link_operational_failed");
  console.log(JSON.stringify({ ok: true, caseCoreId, milestoneId }));
}

async function recordAchievement(client, actorUserId, dryRun) {
  const caseCoreId = requireUuid("case-core", args["case-core"]);
  const objectName = requireLabel("object-name", args["object-name"]);
  const objectState = requireLabel("object-state", args["object-state"]);
  const achievedAt = optionalTimestamp("achieved-at", args["achieved-at"])
    ?? new Date().toISOString();
  if (dryRun) {
    printDryRun("record_achievement_valid", {
      caseCoreId,
      objectName,
      objectState,
      achievedAt,
    });
    return;
  }
  const { data, error } = await client.rpc(
    "eve_admin_record_core_milestone_achievement",
    {
      p_actor_user_id: actorUserId,
      p_case_core_milestone_id: caseCoreId,
      p_object_name: objectName,
      p_object_state: objectState,
      p_achieved_at: achievedAt,
      p_object_reference_id: optionalTrimmed(args["object-ref"]),
      p_evidence_reference: optionalTrimmed(args["evidence-ref"]),
      p_source_event: optionalTrimmed(args["source-event"]),
    },
  );
  if (error) throw new Error(error.message || "record_achievement_failed");
  console.log(JSON.stringify({ ok: true, achievementId: data }));
}

async function revokeAchievement(client, actorUserId, dryRun) {
  const achievementId = requireUuid("achievement", args.achievement);
  const reason = requireLabel("reason", args.reason);
  if (dryRun) {
    printDryRun("revoke_achievement_valid", { achievementId, reason });
    return;
  }
  const { error } = await client.rpc(
    "eve_admin_revoke_core_milestone_achievement",
    {
      p_actor_user_id: actorUserId,
      p_achievement_id: achievementId,
      p_revocation_reason: reason,
    },
  );
  if (error) throw new Error(error.message || "revoke_failed");
  console.log(JSON.stringify({ ok: true, achievementId, revoked: true }));
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

function requireCode(value) {
  if (!CODES.has(String(value))) throw new Error("invalid_core_code");
  return String(value);
}

function requireLabel(name, value) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name}_required`);
  }
  return value.trim();
}

function requireSequence(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 6) throw new Error("sequence_invalid");
  return n;
}

function optionalTrimmed(value) {
  if (value == null || value === true) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function optionalTimestamp(name, value) {
  if (value == null || value === true) return null;
  const instant = Date.parse(String(value));
  if (!Number.isFinite(instant)) throw new Error(`${name}_invalid`);
  return new Date(instant).toISOString();
}
