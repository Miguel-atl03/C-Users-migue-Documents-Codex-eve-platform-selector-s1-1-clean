#!/usr/bin/env node

/**
 * Verifier §12 — runtime_run_control_snapshots integrity.
 * Local only: prefers docker exec psql; falls back to service-role via supabase status.
 */

import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const OPEN_P0_CAUSAL = new Set(["C05", "C09", "C11", "C20"]);
const OPEN_CLOSURE_STATES = new Set([
  "triggered_required",
  "triggered_unanswered",
  "route_missing",
  "contradiction_flag",
  "manual_review_required",
  "reentry_required",
  "activation_unknown",
]);

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: formatError(error) }));
  process.exitCode = 1;
});

async function main() {
  const { snapRows, evalRows, runIds, source } = await loadSnapshotRows();
  const checks = [];

  const effectiveByRun = new Map();
  for (const snap of snapRows) {
    if (snap.lifecycle_state !== "effective") continue;
    const list = effectiveByRun.get(snap.activity_runtime_run_id) ?? [];
    list.push(snap.id);
    effectiveByRun.set(snap.activity_runtime_run_id, list);
  }

  const multipleEffectiveSnapshots = [];
  for (const [runId, ids] of effectiveByRun.entries()) {
    if (ids.length > 1) multipleEffectiveSnapshots.push({ runId, count: ids.length, ids });
  }
  checks.push({
    id: "one_effective_snapshot_per_run",
    ok: multipleEffectiveSnapshots.length === 0,
    violations: multipleEffectiveSnapshots,
  });

  const evalsByRun = new Map();
  for (const ev of evalRows) {
    const list = evalsByRun.get(ev.activity_runtime_run_id) ?? [];
    list.push(ev);
    evalsByRun.set(ev.activity_runtime_run_id, list);
  }

  const readyWithOpenP0 = [];
  for (const snap of snapRows) {
    if (snap.lifecycle_state !== "effective" || snap.readiness_state !== "ready") continue;
    const runEvals = evalsByRun.get(snap.activity_runtime_run_id) ?? [];
    for (const ev of runEvals) {
      if (!OPEN_P0_CAUSAL.has(ev.causal_code)) continue;
      if (ev.closure_state && OPEN_CLOSURE_STATES.has(ev.closure_state)) {
        readyWithOpenP0.push({
          snapshotId: snap.id,
          runId: snap.activity_runtime_run_id,
          causalEvaluationId: ev.id,
          causalCode: ev.causal_code,
          closure_state: ev.closure_state,
        });
      }
    }
  }
  checks.push({
    id: "ready_not_while_p0_causal_open",
    ok: readyWithOpenP0.length === 0,
    violations: readyWithOpenP0,
  });

  const missingSourceHash = snapRows.filter(
    (snap) =>
      snap.lifecycle_state === "effective" &&
      (snap.readiness_state === "ready" || snap.readiness_state === "ready_with_restrictions") &&
      (!snap.source_state_hash || !String(snap.source_state_hash).trim()),
  );
  checks.push({
    id: "effective_ready_has_source_state_hash",
    ok: missingSourceHash.length === 0,
    violations: missingSourceHash.map((s) => ({
      id: s.id,
      runId: s.activity_runtime_run_id,
      readiness_state: s.readiness_state,
    })),
  });

  const orphanSnapshots = snapRows.filter((s) => !runIds.has(s.activity_runtime_run_id));
  const orphanEvaluations = evalRows.filter((e) => !runIds.has(e.activity_runtime_run_id));
  checks.push({
    id: "snapshot_and_eval_runs_exist",
    ok: orphanSnapshots.length === 0 && orphanEvaluations.length === 0,
    violations: {
      orphanSnapshots: orphanSnapshots.map((s) => ({ id: s.id, runId: s.activity_runtime_run_id })),
      orphanEvaluations: orphanEvaluations.map((e) => ({
        id: e.id,
        runId: e.activity_runtime_run_id,
      })),
    },
  });

  const ok = checks.every((c) => c.ok);
  console.log(
    JSON.stringify(
      {
        ok,
        source,
        checks,
        totalSnapshots: snapRows.length,
        totalEffectiveCausal: evalRows.length,
      },
      null,
      2,
    ),
  );
  if (!ok) process.exitCode = 1;
}

async function loadSnapshotRows() {
  try {
    const snapRows = psqlJson(`
      SELECT id, activity_runtime_run_id, lifecycle_state, readiness_state, source_state_hash, effective_at
      FROM public.runtime_run_control_snapshots
    `);
    const evalRows = psqlJson(`
      SELECT id, activity_runtime_run_id, causal_code, lifecycle_state, closure_state
      FROM public.runtime_causal_evaluations
      WHERE lifecycle_state = 'effective'
    `);
    const runs = psqlJson(`SELECT id FROM public.activity_runtime_run`);
    return {
      snapRows,
      evalRows,
      runIds: new Set(runs.map((r) => r.id)),
      source: "docker_psql",
    };
  } catch (dockerError) {
    let client;
    try {
      client = createAdminClient();
    } catch (envError) {
      throw new Error(
        `snapshot_load_failed: docker=${formatError(dockerError)}; admin=${formatError(envError)}`,
      );
    }
    const { data: snapshots, error: snapError } = await client
      .from("runtime_run_control_snapshots")
      .select(
        "id, activity_runtime_run_id, lifecycle_state, readiness_state, source_state_hash, effective_at",
      );
    if (snapError) throw snapError;
    const { data: evaluations, error: evalError } = await client
      .from("runtime_causal_evaluations")
      .select("id, activity_runtime_run_id, causal_code, lifecycle_state, closure_state")
      .eq("lifecycle_state", "effective");
    if (evalError) throw evalError;
    const { data: runs, error: runError } = await client.from("activity_runtime_run").select("id");
    if (runError) throw runError;
    return {
      snapRows: snapshots ?? [],
      evalRows: evaluations ?? [],
      runIds: new Set((runs ?? []).map((r) => r.id)),
      source: "supabase_js",
    };
  }
}

function formatError(error) {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === "object") {
    const message = typeof error.message === "string" ? error.message : "";
    const details = typeof error.details === "string" ? error.details : "";
    const hint = typeof error.hint === "string" ? error.hint : "";
    const code = typeof error.code === "string" ? error.code : "";
    const parts = [message, details, hint, code].filter(Boolean);
    if (parts.length) return parts.join(" | ");
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
    // Windows: use cmd /c so npx resolves without shell:true + argv pitfalls.
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

function psqlJson(sql) {
  const wrapped = `SELECT COALESCE(json_agg(row_to_json(q)), '[]'::json) FROM (${sql}) q;`;
  let stdout = "";
  try {
    stdout = execFileSync(
      "docker",
      [
        "exec",
        "supabase_db_eve-platform",
        "psql",
        "-U",
        "postgres",
        "-d",
        "postgres",
        "-t",
        "-A",
        "-c",
        wrapped,
      ],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
  } catch (error) {
    const detail =
      error && typeof error === "object" && typeof error.stderr === "string" && error.stderr.trim()
        ? error.stderr.trim().slice(0, 400)
        : formatError(error);
    throw new Error(`docker_psql_failed: ${detail}`);
  }
  const text = String(stdout).trim();
  if (!text) return [];
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`docker_psql_json_parse_failed: ${formatError(error)}`);
  }
}