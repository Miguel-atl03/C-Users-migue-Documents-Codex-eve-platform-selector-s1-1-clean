#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";

const WRITE_CONFIRMATION = "UNIT2A_ADMIN";
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

  if (command === "report-orphans") {
    await reportOrphans(client);
    return;
  }

  const actorUserId = dryRun ? null : requireUuid("actor", args.actor);
  if (!dryRun) {
    requireWriteConfirmation();
    await requireAuthUser(client, actorUserId, "actor_user_not_found");
  }

  switch (command) {
    case "assign-consultant":
      await assignConsultant(client, actorUserId, dryRun);
      break;
    case "create-relationship":
      await createRelationship(client, actorUserId, dryRun);
      break;
    case "link-case":
      await linkCase(client, actorUserId, dryRun);
      break;
    case "disable-assignment":
      await disableAssignment(client, actorUserId, dryRun);
      break;
    default:
      throw new Error(
        "unknown_command: use assign-consultant, create-relationship, link-case, disable-assignment, or report-orphans",
      );
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

async function assignConsultant(client, actorUserId, dryRun) {
  const consultantUserId = requireUuid("consultant", args.consultant);
  const companyId = requireUuid("company", args.company);
  const validFrom = optionalTimestamp("valid-from", args["valid-from"]);
  const validUntil = optionalTimestamp("valid-until", args["valid-until"]);
  validateWindow(validFrom, validUntil);

  await requireAuthUser(client, consultantUserId, "consultant_user_not_found");
  await requireRow(client, "empresas", companyId, "company_not_found");

  if (dryRun) {
    const { data: existing, error } = await client
      .from("consultant_company_assignments")
      .select("id, valid_from, valid_until")
      .eq("consultant_user_id", consultantUserId)
      .eq("client_company_id", companyId)
      .eq("status", "enabled");
    if (error) throw new Error("assignment_validation_failed");

    const nextFrom = validFrom ?? new Date().toISOString();
    const conflict = (existing ?? []).some((row) =>
      windowsOverlap(
        nextFrom,
        validUntil,
        String(row.valid_from),
        row.valid_until ? String(row.valid_until) : null,
      ),
    );
    if (conflict) throw new Error("overlapping_enabled_assignment");
    printDryRun("consultant_assignment_valid", { consultantUserId, companyId });
    return;
  }

  const { data, error } = await client.rpc(
    "eve_admin_assign_consultant_company",
    {
      p_actor_user_id: actorUserId,
      p_consultant_user_id: consultantUserId,
      p_client_company_id: companyId,
      p_valid_from: validFrom ?? new Date().toISOString(),
      p_valid_until: validUntil,
    },
  );
  if (error) throw new Error("assignment_failed");

  printSuccess("consultant_assigned", { assignmentId: data, companyId });
}

async function createRelationship(client, actorUserId, dryRun) {
  const companyId = requireUuid("company", args.company);
  const displayName = requireText("name", args.name);
  const validFrom = optionalTimestamp("valid-from", args["valid-from"]);
  const validUntil = optionalTimestamp("valid-until", args["valid-until"]);
  validateWindow(validFrom, validUntil);

  await requireRow(client, "empresas", companyId, "company_not_found");

  if (dryRun) {
    printDryRun("relationship_creation_valid", { companyId });
    return;
  }

  const { data, error } = await client.rpc(
    "eve_admin_create_client_relationship",
    {
      p_actor_user_id: actorUserId,
      p_client_company_id: companyId,
      p_display_name: displayName,
      p_valid_from: validFrom ?? new Date().toISOString(),
      p_valid_until: validUntil,
    },
  );
  if (error) throw new Error("relationship_creation_failed");

  printSuccess("relationship_created", { relationshipId: data, companyId });
}

async function linkCase(client, actorUserId, dryRun) {
  const caseId = requireUuid("case", args.case);
  const relationshipId = requireUuid("relationship", args.relationship);
  const companyId = dryRun
    ? optionalUuid("company", args.company)
    : requireUuid("company", args.company);
  const displayName = dryRun ? args.name?.trim() || null : requireText("name", args.name);

  const [{ data: caseRow, error: caseError }, { data: relationship, error: relationshipError }] =
    await Promise.all([
      client
        .from("sesiones_llenado")
        .select("id, client_company_id, client_relationship_id")
        .eq("id", caseId)
        .maybeSingle(),
      client
        .from("client_relationships")
        .select("id, client_company_id")
        .eq("id", relationshipId)
        .maybeSingle(),
    ]);

  if (caseError || !caseRow) throw new Error("case_not_found");
  if (relationshipError || !relationship) throw new Error("relationship_not_found");

  const relationshipCompanyId = String(relationship.client_company_id);
  if (companyId && companyId !== relationshipCompanyId) {
    throw new Error("case_relationship_company_mismatch");
  }
  if (
    caseRow.client_company_id &&
    String(caseRow.client_company_id) !== relationshipCompanyId
  ) {
    throw new Error("case_company_is_already_different");
  }

  if (dryRun) {
    printDryRun("case_link_valid", {
      caseId,
      relationshipId,
      companyId: relationshipCompanyId,
    });
    return;
  }

  const { error } = await client.rpc("eve_admin_link_case_relationship", {
    p_actor_user_id: actorUserId,
    p_case_id: caseId,
    p_client_company_id: companyId,
    p_client_relationship_id: relationshipId,
    p_case_display_name: displayName,
  });
  if (error) throw new Error("case_link_failed");

  printSuccess("case_linked", { caseId, relationshipId });
}

async function disableAssignment(client, actorUserId, dryRun) {
  const assignmentId = requireUuid("assignment", args.assignment);
  const validUntil =
    optionalTimestamp("valid-until", args["valid-until"]) ??
    new Date().toISOString();

  if (dryRun) {
    const { data, error } = await client
      .from("consultant_company_assignments")
      .select("id")
      .eq("id", assignmentId)
      .eq("status", "enabled")
      .maybeSingle();
    if (error || !data) throw new Error("enabled_assignment_not_found");
    printDryRun("assignment_disable_valid", { assignmentId, validUntil });
    return;
  }

  const { error } = await client.rpc(
    "eve_admin_disable_consultant_company",
    {
      p_actor_user_id: actorUserId,
      p_assignment_id: assignmentId,
      p_valid_until: validUntil,
    },
  );
  if (error) throw new Error("assignment_disable_failed");

  printSuccess("assignment_disabled", { assignmentId, validUntil });
}

async function reportOrphans(client) {
  const { data, error } = await client
    .from("sesiones_llenado")
    .select("id, client_company_id, client_relationship_id, estado_actual, created_at")
    .or("client_company_id.is.null,client_relationship_id.is.null")
    .order("created_at", { ascending: true });

  if (error) throw new Error("orphan_report_failed");

  console.log(
    JSON.stringify(
      {
        ok: true,
        report: "unlinked_cases",
        count: data?.length ?? 0,
        cases: data ?? [],
      },
      null,
      2,
    ),
  );
}

async function requireAuthUser(client, userId, errorCode) {
  const { data, error } = await client.auth.admin.getUserById(userId);
  if (error || !data.user) throw new Error(errorCode);
}

async function requireRow(client, table, id, errorCode) {
  const { data, error } = await client
    .from(table)
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) throw new Error(errorCode);
}

function requireWriteConfirmation() {
  if (args.confirm !== WRITE_CONFIRMATION) {
    throw new Error(`write_confirmation_required: --confirm=${WRITE_CONFIRMATION}`);
  }
}

function parseArgs(values) {
  const parsed = {};
  for (const value of values) {
    if (!value.startsWith("--")) {
      throw new Error(`invalid_argument:${value}`);
    }
    if (!value.includes("=")) {
      parsed[value.slice(2)] = true;
      continue;
    }
    const [key, ...rest] = value.slice(2).split("=");
    parsed[key] = rest.join("=");
  }
  return parsed;
}

function requireUuid(name, value) {
  if (!value || !UUID_PATTERN.test(value)) {
    throw new Error(`invalid_${name}_uuid`);
  }
  return value;
}

function optionalUuid(name, value) {
  if (!value) return null;
  return requireUuid(name, value);
}

function requireText(name, value) {
  const normalized = value?.trim();
  if (!normalized) throw new Error(`${name}_required`);
  return normalized;
}

function optionalTimestamp(name, value) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) throw new Error(`invalid_${name}`);
  return new Date(timestamp).toISOString();
}

function validateWindow(validFrom, validUntil) {
  if (
    validFrom &&
    validUntil &&
    Date.parse(validUntil) < Date.parse(validFrom)
  ) {
    throw new Error("invalid_validity_window");
  }
}

function windowsOverlap(fromA, untilA, fromB, untilB) {
  const startA = Date.parse(fromA);
  const endA = untilA ? Date.parse(untilA) : Number.POSITIVE_INFINITY;
  const startB = Date.parse(fromB);
  const endB = untilB ? Date.parse(untilB) : Number.POSITIVE_INFINITY;
  return startA <= endB && startB <= endA;
}

function printSuccess(action, scope) {
  console.log(JSON.stringify({ ok: true, action, ...scope }, null, 2));
}

function printDryRun(action, scope) {
  console.log(JSON.stringify({ ok: true, dryRun: true, action, ...scope }, null, 2));
}
