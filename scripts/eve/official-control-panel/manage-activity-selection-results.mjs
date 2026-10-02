#!/usr/bin/env node

/**
 * Admin §11: activity_selection_results lifecycle.
 * Commands: inspect|calculate-and-stage|validate|publish|supersede|revoke|show-effective|show-history
 * Requires --dry-run or --confirm=POINT11_SELECTION_ADMIN
 * Never invents Amber selection results.
 * Only calculate-and-stage may run the policy (outside the panel).
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { pathToFileURL } from "node:url";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { register } from "node:module";
import { tmpdir } from "node:os";
import { writeFileSync, existsSync } from "node:fs";

const WRITE_CONFIRMATION = "POINT11_SELECTION_ADMIN";
const POLICY_CODE = "PRIMARY_ACTIVITY_SELECTION";
const POLICY_VERSION = "PRIMARY_ACTIVITY_SELECTION_V1_3";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const hookPath = resolve(tmpdir(), "eve-point11-admin-path-hook.mjs");
writeFileSync(
  hookPath,
  `import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";
import { existsSync } from "node:fs";
const root = ${JSON.stringify(projectRoot)};
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const base = resolvePath(root, "src", specifier.slice(2));
    for (const candidate of [base, base + ".ts", base + ".tsx"]) {
      if (existsSync(candidate)) return { shortCircuit: true, url: pathToFileURL(candidate).href };
    }
  }
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL) {
    const base = resolvePath(dirname(fileURLToPath(context.parentURL)), specifier);
    for (const candidate of [base, base + ".ts", base + ".tsx"]) {
      if (existsSync(candidate)) return { shortCircuit: true, url: pathToFileURL(candidate).href };
    }
  }
  return nextResolve(specifier, context);
}
`,
);
register(pathToFileURL(hookPath).href);

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
  if (command === "show-effective") {
    await showEffective(client);
    return;
  }
  if (command === "show-history") {
    await showHistory(client);
    return;
  }

  const actorUserId = dryRun ? null : requireUuid("actor", args.actor);
  if (!dryRun) {
    requireWriteConfirmation();
    await requireAuthUser(client, actorUserId, "actor_user_not_found");
  }

  switch (command) {
    case "calculate-and-stage":
      await calculateAndStage(client, actorUserId, dryRun);
      break;
    case "validate":
      await validateResult(client, actorUserId, dryRun);
      break;
    case "publish":
      await publishResult(client, actorUserId, dryRun);
      break;
    case "supersede":
      await publishResult(client, actorUserId, dryRun);
      break;
    case "revoke":
      await revokeResult(client, actorUserId, dryRun);
      break;
    default:
      throw new Error(
        "unknown_command: inspect|calculate-and-stage|validate|publish|supersede|revoke|show-effective|show-history",
      );
  }
}

async function inspect(client) {
  const { count, error } = await client
    .from("activity_selection_results")
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  const amberCase = "19fc9eff-4219-43f0-854c-e2b3350f23f2";
  const { data: amberRows, error: amberError } = await client
    .from("activity_selection_results")
    .select("id, lifecycle_state, selection_mode, role_runtime_session_id")
    .eq("case_id", amberCase);
  if (amberError) throw amberError;
  console.log(
    JSON.stringify(
      {
        ok: true,
        table: "activity_selection_results",
        totalResults: count ?? 0,
        amberCase,
        amberResults: amberRows ?? [],
        note: "No inventar resultados Amber.",
      },
      null,
      2,
    ),
  );
}

async function showEffective(client) {
  const sessionId = requireUuid("session", args.session);
  const { data, error } = await client
    .from("activity_selection_results")
    .select("*")
    .eq("role_runtime_session_id", sessionId)
    .eq("lifecycle_state", "effective")
    .maybeSingle();
  if (error) throw error;
  console.log(JSON.stringify({ ok: true, sessionId, effective: data }, null, 2));
}

async function showHistory(client) {
  const sessionId = requireUuid("session", args.session);
  const { data, error } = await client
    .from("activity_selection_results")
    .select(
      "id, result_version, lifecycle_state, selection_mode, eligible_count, selected_count, computed_at, effective_from",
    )
    .eq("role_runtime_session_id", sessionId)
    .order("result_version", { ascending: true });
  if (error) throw error;
  console.log(JSON.stringify({ ok: true, sessionId, history: data ?? [] }, null, 2));
}

async function calculateAndStage(client, actorUserId, dryRun) {
  const caseId = requireUuid("case", args.case);
  const participantId = requireUuid("participant", args.participant);
  const profileId = requireUuid("profile", args.profile);
  const sessionId = requireUuid("session", args.session);
  const workmapPath = requireString("workmap", args.workmap);

  const workMap = JSON.parse(readFileSync(workmapPath, "utf8"));
  const { selectPrimaryActivitiesFromWorkMap } = await import(
    pathToFileURL(
      resolve(projectRoot, "src/services/primary-activity-selector.ts"),
    ).href
  );
  const result = selectPrimaryActivitiesFromWorkMap(workMap);
  const snapshotJson = JSON.stringify(result.workMapSnapshot);
  const snapshotHash = createHash("sha256").update(snapshotJson).digest("hex");
  const snapshotRef = `workmap-file:${workmapPath}`;

  const primaryItems = result.selectedPrimaryActivities.map((item) => ({
    activity_id: item.activityId,
    display_label: item.activityLiteral || item.activityId,
    classification: "primary",
    selected_slot: item.selectedSlot,
    selection_reason_code: item.selectionReasonCode,
    source_reference: item.sourcePath || "workmap",
    promotion_condition_code: null,
  }));
  const nonPrimaryItems = result.nonPrimaryContextActivities.map((item) => ({
    activity_id: item.activityId,
    display_label: item.activityTitle || item.activityLiteral || item.activityId,
    classification: "non_primary",
    selected_slot: null,
    selection_reason_code: null,
    source_reference: item.sourcePath || "workmap",
    promotion_condition_code: item.promotionCondition || null,
  }));
  const pendingItems = (result.excludedActivities || [])
    .filter((item) =>
      ["granularity_review", "insufficient_semantics"].includes(
        item.exclusionReason,
      ),
    )
    .map((item) => ({
      activity_id: item.activityId,
      display_label: item.activityLiteral || item.activityId,
      classification: "pending",
      selected_slot: null,
      selection_reason_code: item.exclusionReason,
      source_reference: item.sourcePath || "workmap",
      promotion_condition_code: null,
    }));

  const items = [...primaryItems, ...nonPrimaryItems, ...pendingItems];
  const promotion =
    nonPrimaryItems.find((item) => item.promotion_condition_code)
      ?.promotion_condition_code ?? null;

  const { data: versions, error: versionError } = await client
    .from("activity_selection_results")
    .select("result_version")
    .eq("role_runtime_session_id", sessionId)
    .order("result_version", { ascending: false })
    .limit(1);
  if (versionError) throw versionError;
  const nextVersion = (versions?.[0]?.result_version ?? 0) + 1;

  const header = {
    case_id: caseId,
    participant_id: participantId,
    profile_id: profileId,
    role_runtime_session_id: sessionId,
    policy_code: POLICY_CODE,
    policy_version: POLICY_VERSION,
    source_snapshot_reference: snapshotRef,
    source_snapshot_hash: snapshotHash,
    result_version: nextVersion,
    lifecycle_state: "computed",
    selection_mode: result.mode,
    eligible_count: result.runLog.eligibleActivityCount,
    selected_count: result.runLog.selectedActivityCount,
    non_primary_context_count: result.nonPrimaryContextActivities.length,
    workmap_coverage_gap: null,
    promotion_condition_code: promotion,
    computed_by: actorUserId,
  };

  if (dryRun) {
    console.log(
      JSON.stringify(
        { ok: true, dryRun: true, header, itemCount: items.length, mode: result.mode },
        null,
        2,
      ),
    );
    return;
  }

  const { data: inserted, error: insertError } = await client
    .from("activity_selection_results")
    .insert(header)
    .select("*")
    .single();
  if (insertError) throw insertError;

  const rows = items.map((item) => ({ ...item, result_id: inserted.id }));
  if (rows.length > 0) {
    const { error: itemsError } = await client
      .from("activity_selection_result_items")
      .insert(rows);
    if (itemsError) throw itemsError;
  }

  await writeAudit(client, {
    action: "activity_selection_result_computed",
    caseId,
    actorUserId,
    detail: { resultId: inserted.id, resultVersion: nextVersion, mode: result.mode },
  });

  console.log(
    JSON.stringify(
      { ok: true, resultId: inserted.id, resultVersion: nextVersion, mode: result.mode },
      null,
      2,
    ),
  );
}

async function validateResult(client, actorUserId, dryRun) {
  const resultId = requireUuid("result", args.result);
  if (dryRun) {
    console.log(JSON.stringify({ ok: true, dryRun: true, resultId, action: "validate" }, null, 2));
    return;
  }
  const { data, error } = await client.rpc("eve_validate_activity_selection_result", {
    p_result_id: resultId,
    p_actor: actorUserId,
  });
  if (error) throw error;
  await writeAudit(client, {
    action: "activity_selection_result_validated",
    caseId: data.case_id,
    actorUserId,
    detail: { resultId },
  });
  console.log(JSON.stringify({ ok: true, validated: data }, null, 2));
}

async function publishResult(client, actorUserId, dryRun) {
  const resultId = requireUuid("result", args.result);
  if (dryRun) {
    console.log(JSON.stringify({ ok: true, dryRun: true, resultId, action: "publish" }, null, 2));
    return;
  }
  const { data, error } = await client.rpc("eve_publish_activity_selection_result", {
    p_result_id: resultId,
    p_actor: actorUserId,
  });
  if (error) throw error;
  await writeAudit(client, {
    action: "activity_selection_result_published",
    caseId: data.case_id,
    actorUserId,
    detail: { resultId },
  });
  console.log(JSON.stringify({ ok: true, published: data }, null, 2));
}

async function revokeResult(client, actorUserId, dryRun) {
  const resultId = requireUuid("result", args.result);
  const reason = requireString("reason", args.reason);
  if (dryRun) {
    console.log(
      JSON.stringify({ ok: true, dryRun: true, resultId, action: "revoke", reason }, null, 2),
    );
    return;
  }
  const { data, error } = await client.rpc("eve_revoke_activity_selection_result", {
    p_result_id: resultId,
    p_actor: actorUserId,
    p_reason: reason,
  });
  if (error) throw error;
  await writeAudit(client, {
    action: "activity_selection_result_revoked",
    caseId: data.case_id,
    actorUserId,
    detail: { resultId, reason },
  });
  console.log(JSON.stringify({ ok: true, revoked: data }, null, 2));
}

async function writeAudit(client, input) {
  const { data: sessionCase, error: caseError } = await client
    .from("sesiones_llenado")
    .select("id, client_company_id, client_relationship_id")
    .eq("id", input.caseId)
    .maybeSingle();
  if (caseError) throw caseError;
  if (!sessionCase?.client_company_id || !sessionCase?.client_relationship_id) {
    console.warn(
      JSON.stringify({ warning: "audit_skipped_missing_company_or_relationship" }),
    );
    return;
  }
  const { error } = await client.from("official_control_panel_context_audit").insert({
    actor_user_id: input.actorUserId,
    action: input.action,
    client_company_id: sessionCase.client_company_id,
    client_relationship_id: sessionCase.client_relationship_id,
    case_id: input.caseId,
    metadata: input.detail ?? {},
  });
  if (error) throw error;
}

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || process.env.API_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("missing_supabase_admin_env");
  return createClient(url, key, { auth: { persistSession: false } });
}

async function requireAuthUser(client, userId, code) {
  const { data, error } = await client.auth.admin.getUserById(userId);
  if (error || !data?.user) throw new Error(code);
}

function requireWriteConfirmation() {
  if (args.confirm !== WRITE_CONFIRMATION) {
    throw new Error(`confirm_required:${WRITE_CONFIRMATION}`);
  }
}

function requireUuid(name, value) {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new Error(`invalid_${name}`);
  }
  return value;
}

function requireString(name, value) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`missing_${name}`);
  return value.trim();
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const body = token.slice(2);
    if (body === "dry-run") {
      out["dry-run"] = true;
      continue;
    }
    const eq = body.indexOf("=");
    if (eq >= 0) {
      out[body.slice(0, eq)] = body.slice(eq + 1);
    } else {
      out[body] = argv[i + 1];
      i += 1;
    }
  }
  return out;
}
