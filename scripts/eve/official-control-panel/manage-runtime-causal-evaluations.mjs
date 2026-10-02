#!/usr/bin/env node

/**
 * Admin §12: runtime_causal_evaluations ledger (+ optional control snapshots).
 * Commands: inspect|stage|validate|publish|supersede|revoke|show-effective|show-history
 *           stage-snapshot|validate-snapshot|publish-snapshot
 * Writes require --dry-run OR --confirm=POINT12_CAUSAL_LEDGER_ADMIN
 * Local Supabase only. Auto-loads SERVICE_ROLE_KEY from `npx supabase status -o env` when missing.
 * Never invents Amber data.
 */

import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const WRITE_CONFIRMATION = "POINT12_CAUSAL_LEDGER_ADMIN";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

const [command, ...rawArgs] = process.argv.slice(2);
const args = parseArgs(rawArgs);

main().catch((error) => {
  console.error(
    JSON.stringify({
      ok: false,
      error: formatError(error),
    }),
  );
  process.exitCode = 1;
});

async function main() {
  const client = createAdminClient();
  const dryRun = args["dry-run"] === true;

  switch (command) {
    case "inspect":
      await inspect(client);
      return;
    case "show-effective":
      await showEffective(client);
      return;
    case "show-history":
      await showHistory(client);
      return;
    case "stage":
    case "validate":
    case "publish":
    case "supersede":
    case "revoke":
    case "stage-snapshot":
    case "validate-snapshot":
    case "publish-snapshot":
      if (!dryRun) requireWriteConfirmation();
      break;
    default:
      throw new Error(
        "unknown_command: inspect|stage|validate|publish|supersede|revoke|show-effective|show-history|stage-snapshot|validate-snapshot|publish-snapshot",
      );
  }

  switch (command) {
    case "stage":
      await stageEvaluation(client, dryRun);
      break;
    case "validate":
      await validateEvaluation(client, dryRun);
      break;
    case "publish":
    case "supersede":
      await publishEvaluation(client, dryRun, command);
      break;
    case "revoke":
      await revokeEvaluation(client, dryRun);
      break;
    case "stage-snapshot":
      await stageSnapshot(client, dryRun);
      break;
    case "validate-snapshot":
      await validateSnapshot(client, dryRun);
      break;
    case "publish-snapshot":
      await publishSnapshot(client, dryRun);
      break;
    default:
      break;
  }
}

async function inspect(client) {
  const { count: evalCount, error: evalError } = await client
    .from("runtime_causal_evaluations")
    .select("id", { count: "exact", head: true });
  if (evalError) throw evalError;

  const { count: snapCount, error: snapError } = await client
    .from("runtime_run_control_snapshots")
    .select("id", { count: "exact", head: true });
  if (snapError) throw snapError;

  const { data: effectiveRows, error: effectiveError } = await client
    .from("runtime_causal_evaluations")
    .select("activity_runtime_run_id, causal_code, id, closure_state, lifecycle_state")
    .eq("lifecycle_state", "effective")
    .order("created_at", { ascending: false })
    .limit(50);
  if (effectiveError) throw effectiveError;

  console.log(
    JSON.stringify(
      {
        ok: true,
        tables: {
          runtime_causal_evaluations: evalCount ?? 0,
          runtime_run_control_snapshots: snapCount ?? 0,
        },
        effectiveSample: effectiveRows ?? [],
        note: "No inventar datos Amber; solo lectura factual del ledger.",
      },
      null,
      2,
    ),
  );
}

async function showEffective(client) {
  const runId = requireUuid("run-id", args["run-id"]);
  let query = client
    .from("runtime_causal_evaluations")
    .select("*")
    .eq("activity_runtime_run_id", runId)
    .eq("lifecycle_state", "effective");
  if (args["causal-code"]) {
    query = query.eq("causal_code", requireString("causal-code", args["causal-code"]));
  }
  const { data, error } = await query.order("causal_code", { ascending: true });
  if (error) throw error;

  if (args["causal-code"]) {
    const row = (data ?? []).find((r) => r.causal_code === args["causal-code"]) ?? null;
    console.log(JSON.stringify({ ok: true, runId, causalCode: args["causal-code"], effective: row }, null, 2));
    return;
  }

  console.log(JSON.stringify({ ok: true, runId, effective: data ?? [] }, null, 2));
}

async function showHistory(client) {
  const runId = requireUuid("run-id", args["run-id"]);
  let query = client
    .from("runtime_causal_evaluations")
    .select(
      "id, causal_code, evaluation_version, lifecycle_state, closure_state, blocking_state, computed_at, validated_at, effective_at, superseded_at, revoked_at",
    )
    .eq("activity_runtime_run_id", runId)
    .order("causal_code", { ascending: true })
    .order("evaluation_version", { ascending: true });
  if (args["causal-code"]) {
    query = query.eq("causal_code", requireString("causal-code", args["causal-code"]));
  }
  const { data, error } = await query;
  if (error) throw error;
  console.log(JSON.stringify({ ok: true, runId, history: data ?? [] }, null, 2));
}

async function stageEvaluation(client, dryRun) {
  const runId = requireUuid("run-id", args["run-id"]);
  const causalCode = requireString("causal-code", args["causal-code"]);
  const closureState = requireString("closure-state", args["closure-state"]);
  const catalogVersionId = optionalString(args["catalog-version-id"]);

  const { data: versions, error: versionError } = await client
    .from("runtime_causal_evaluations")
    .select("evaluation_version")
    .eq("activity_runtime_run_id", runId)
    .eq("causal_code", causalCode)
    .order("evaluation_version", { ascending: false })
    .limit(1);
  if (versionError) throw versionError;
  const nextVersion = (versions?.[0]?.evaluation_version ?? 0) + 1;

  const row = {
    activity_runtime_run_id: runId,
    causal_code: causalCode,
    closure_state: closureState,
    catalog_version_id: catalogVersionId,
    lifecycle_state: "computed",
    evaluation_version: nextVersion,
    computed_at: new Date().toISOString(),
    computed_by: optionalString(args.publisher) ?? "point12-admin-cli",
  };

  if (dryRun) {
    console.log(JSON.stringify({ ok: true, dryRun: true, action: "stage", row }, null, 2));
    return;
  }

  const { data, error } = await client.from("runtime_causal_evaluations").insert(row).select("*").single();
  if (error) throw error;
  console.log(JSON.stringify({ ok: true, staged: data }, null, 2));
}

async function validateEvaluation(client, dryRun) {
  const evaluationId = requireUuid("evaluation-id", args["evaluation-id"]);
  const validatedBy = optionalString(args.publisher) ?? "point12-admin-cli";

  if (dryRun) {
    console.log(
      JSON.stringify({ ok: true, dryRun: true, action: "validate", evaluationId, validatedBy }, null, 2),
    );
    return;
  }

  const { data, error } = await client
    .from("runtime_causal_evaluations")
    .update({
      lifecycle_state: "validated",
      validated_at: new Date().toISOString(),
      validated_by: validatedBy,
      updated_at: new Date().toISOString(),
    })
    .eq("id", evaluationId)
    .select("*")
    .single();
  if (error) throw error;
  console.log(JSON.stringify({ ok: true, validated: data }, null, 2));
}

async function publishEvaluation(client, dryRun, action) {
  const evaluationId = requireUuid("evaluation-id", args["evaluation-id"]);
  const publisher = requireString("publisher", args.publisher);

  if (dryRun) {
    console.log(
      JSON.stringify({ ok: true, dryRun: true, action, evaluationId, publisher }, null, 2),
    );
    return;
  }

  const { data, error } = await client.rpc("publish_runtime_causal_evaluation", {
    p_evaluation_id: evaluationId,
    p_publisher: publisher,
  });
  if (error) throw error;
  console.log(JSON.stringify({ ok: true, [action === "supersede" ? "supersededViaPublish" : "published"]: data }, null, 2));
}

async function revokeEvaluation(client, dryRun) {
  const evaluationId = requireUuid("evaluation-id", args["evaluation-id"]);
  const reason = requireString("reason", args.reason);
  const revokedBy = optionalString(args.publisher) ?? "point12-admin-cli";

  if (dryRun) {
    console.log(
      JSON.stringify({ ok: true, dryRun: true, action: "revoke", evaluationId, reason, revokedBy }, null, 2),
    );
    return;
  }

  const { data, error } = await client
    .from("runtime_causal_evaluations")
    .update({
      lifecycle_state: "revoked",
      revoked_at: new Date().toISOString(),
      revoked_by: revokedBy,
      revocation_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", evaluationId)
    .select("*")
    .single();
  if (error) throw error;
  console.log(JSON.stringify({ ok: true, revoked: data }, null, 2));
}

async function stageSnapshot(client, dryRun) {
  const runId = requireUuid("run-id", args["run-id"]);
  const readinessState = requireString("readiness-state", args["readiness-state"]);

  const { data: versions, error: versionError } = await client
    .from("runtime_run_control_snapshots")
    .select("snapshot_version")
    .eq("activity_runtime_run_id", runId)
    .order("snapshot_version", { ascending: false })
    .limit(1);
  if (versionError) throw versionError;
  const nextVersion = (versions?.[0]?.snapshot_version ?? 0) + 1;

  const row = {
    activity_runtime_run_id: runId,
    snapshot_version: nextVersion,
    lifecycle_state: "computed",
    readiness_state: readinessState,
    source_state_hash: optionalString(args["source-state-hash"]),
    active_gap_count: parseOptionalInt(args["active-gap-count"], 0),
    blocking_gap_count: parseOptionalInt(args["blocking-gap-count"], 0),
    active_timer_count: parseOptionalInt(args["active-timer-count"], 0),
    overdue_timer_count: parseOptionalInt(args["overdue-timer-count"], 0),
    reentry_required: args["reentry-required"] === "true",
    manual_review_required: args["manual-review-required"] === "true",
    computed_at: new Date().toISOString(),
    computed_by: optionalString(args.publisher) ?? "point12-admin-cli",
  };

  if (dryRun) {
    console.log(JSON.stringify({ ok: true, dryRun: true, action: "stage-snapshot", row }, null, 2));
    return;
  }

  const { data, error } = await client.from("runtime_run_control_snapshots").insert(row).select("*").single();
  if (error) throw error;
  console.log(JSON.stringify({ ok: true, stagedSnapshot: data }, null, 2));
}

async function validateSnapshot(client, dryRun) {
  const snapshotId = requireUuid("snapshot-id", args["snapshot-id"]);

  if (dryRun) {
    console.log(JSON.stringify({ ok: true, dryRun: true, action: "validate-snapshot", snapshotId }, null, 2));
    return;
  }

  const { data, error } = await client
    .from("runtime_run_control_snapshots")
    .update({ lifecycle_state: "validated", updated_at: new Date().toISOString() })
    .eq("id", snapshotId)
    .select("*")
    .single();
  if (error) throw error;
  console.log(JSON.stringify({ ok: true, validatedSnapshot: data }, null, 2));
}

async function publishSnapshot(client, dryRun) {
  const snapshotId = requireUuid("snapshot-id", args["snapshot-id"]);
  const publisher = requireString("publisher", args.publisher);

  if (dryRun) {
    console.log(
      JSON.stringify({ ok: true, dryRun: true, action: "publish-snapshot", snapshotId, publisher }, null, 2),
    );
    return;
  }

  const { data, error } = await client.rpc("publish_runtime_run_control_snapshot", {
    p_snapshot_id: snapshotId,
    p_publisher: publisher,
  });
  if (error) throw error;
  console.log(JSON.stringify({ ok: true, publishedSnapshot: data }, null, 2));
}

function formatError(error) {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === "object") {
    if (typeof error.message === "string" && error.message) return error.message;
    if (typeof error.details === "string" && error.details) {
      return `${error.message || "error"}: ${error.details}`;
    }
    if (typeof error.hint === "string" && error.hint) {
      return `${error.message || "error"} (${error.hint})`;
    }
    try {
      return JSON.stringify(error);
    } catch {
      /* fall through */
    }
  }
  return String(error ?? "unknown_error");
}

function loadEnvLocal() {
  const envPath = resolve(projectRoot, ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function parseEnvExport(text) {
  const out = {};
  for (const line of String(text).split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function loadServiceRoleFromSupabaseStatus() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  let stdout = "";
  try {
    if (process.platform === "win32") {
      stdout = execFileSync("cmd.exe", ["/d", "/s", "/c", "npx supabase status -o env"], {
        cwd: projectRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
    } else {
      stdout = execFileSync("npx", ["supabase", "status", "-o", "env"], {
        cwd: projectRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
    }
  } catch (error) {
    const detail =
      error && typeof error === "object" && typeof error.stderr === "string" && error.stderr.trim()
        ? error.stderr.trim().slice(0, 400)
        : formatError(error);
    throw new Error(`supabase_status_failed: ${detail}`);
  }
  const parsed = parseEnvExport(stdout);
  const serviceRole = parsed.SERVICE_ROLE_KEY || parsed.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRole) {
    throw new Error("supabase_status_missing_SERVICE_ROLE_KEY");
  }
  process.env.SUPABASE_SERVICE_ROLE_KEY = serviceRole;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL && parsed.API_URL) {
    process.env.NEXT_PUBLIC_SUPABASE_URL = parsed.API_URL;
  }
}

function resolveLocalAdminEnv() {
  loadEnvLocal();
  loadServiceRoleFromSupabaseStatus();
}

function createAdminClient() {
  resolveLocalAdminEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
  assertLocalSupabase(url);
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("missing_supabase_admin_env: SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

function assertLocalSupabase(url) {
  let hostname;
  try {
    hostname = new URL(url).hostname;
  } catch {
    throw new Error("invalid_supabase_url");
  }
  if (hostname !== "127.0.0.1" && hostname !== "localhost") {
    throw new Error(`remote_supabase_forbidden:${hostname}`);
  }
}

function requireWriteConfirmation() {
  if (args.confirm !== WRITE_CONFIRMATION) {
    throw new Error(`confirm_required:${WRITE_CONFIRMATION}`);
  }
}

function requireUuid(name, value) {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new Error(`invalid_${name.replace(/-/g, "_")}`);
  }
  return value;
}

function requireString(name, value) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`missing_${name.replace(/-/g, "_")}`);
  return value.trim();
}

function optionalString(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  return value.trim();
}

function parseOptionalInt(value, fallback) {
  if (value === undefined || value === "") return fallback;
  const n = Number.parseInt(String(value), 10);
  if (Number.isNaN(n)) throw new Error("invalid_integer_arg");
  return n;
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