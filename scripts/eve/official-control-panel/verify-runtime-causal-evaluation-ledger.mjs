#!/usr/bin/env node

/**
 * Verifier §12 — runtime_causal_evaluations ledger integrity.
 * Local only: prefers docker exec psql; falls back to service-role via supabase status.
 */

import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: formatError(error) }));
  process.exitCode = 1;
});

async function main() {
  const { rows, varRows, source } = await loadLedgerRows();
  const checks = [];

  const effectiveGroups = new Map();
  for (const row of rows) {
    if (row.lifecycle_state !== "effective") continue;
    const key = `${row.activity_runtime_run_id}:${row.causal_code}`;
    const list = effectiveGroups.get(key) ?? [];
    list.push(row.id);
    effectiveGroups.set(key, list);
  }

  const multipleEffective = [];
  for (const [key, ids] of effectiveGroups.entries()) {
    if (ids.length > 1) multipleEffective.push({ key, count: ids.length, ids });
  }
  checks.push({
    id: "one_effective_per_run_causal",
    ok: multipleEffective.length === 0,
    violations: multipleEffective,
  });

  const answeredClosedIncomplete = rows.filter(
    (row) =>
      row.closure_state === "answered_closed" &&
      (row.canonical_route_closed !== true || row.evidence_complete !== true),
  );
  checks.push({
    id: "answered_closed_requires_route_and_evidence",
    ok: answeredClosedIncomplete.length === 0,
    violations: answeredClosedIncomplete.map((r) => ({
      id: r.id,
      runId: r.activity_runtime_run_id,
      causalCode: r.causal_code,
      canonical_route_closed: r.canonical_route_closed,
      evidence_complete: r.evidence_complete,
    })),
  });

  const answeredClosedIds = new Set(
    rows.filter((r) => r.closure_state === "answered_closed").map((r) => r.id),
  );
  const badVariables = varRows.filter(
    (v) =>
      answeredClosedIds.has(v.causal_evaluation_id) &&
      v.invalidated_at == null &&
      (v.resolution_state === "unresolved" ||
        v.resolution_state === "contradictory" ||
        v.resolution_state === "unavailable"),
  );
  checks.push({
    id: "answered_closed_variables_resolved",
    ok: badVariables.length === 0,
    violations: badVariables.map((v) => ({
      id: v.id,
      causal_evaluation_id: v.causal_evaluation_id,
      resolution_state: v.resolution_state,
    })),
  });

  // Note: effective + open P0 closure is VALID (drives readiness=blocked).
  // Impossible combos are lifecycle metadata inconsistencies only.
  const impossibleCombos = [];
  for (const row of rows) {
    if (row.lifecycle_state === "effective") {
      if (!row.effective_at) {
        impossibleCombos.push({ id: row.id, issue: "effective_missing_effective_at" });
      }
    }
    if (row.lifecycle_state === "superseded" && !row.superseded_at) {
      impossibleCombos.push({ id: row.id, issue: "superseded_missing_superseded_at" });
    }
    if (row.lifecycle_state === "revoked" && !row.revoked_at) {
      impossibleCombos.push({ id: row.id, issue: "revoked_missing_revoked_at" });
    }
    if (row.lifecycle_state === "effective" && row.revoked_at) {
      impossibleCombos.push({ id: row.id, issue: "effective_with_revoked_at" });
    }
    if (row.lifecycle_state === "effective" && row.superseded_at) {
      impossibleCombos.push({ id: row.id, issue: "effective_with_superseded_at" });
    }
  }
  checks.push({
    id: "no_impossible_lifecycle_closure_combos",
    ok: impossibleCombos.length === 0,
    violations: impossibleCombos,
  });

  // Factual ledger tables must not use USING (true)
  let permissivePolicies = [];
  try {
    permissivePolicies = psqlJson(`
      SELECT tablename, policyname, qual
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename IN (
          'runtime_causal_evaluations',
          'runtime_causal_variable_resolutions',
          'runtime_run_control_snapshots',
          'runtime_causal_evaluation_evidence_links'
        )
        AND cmd = 'SELECT'
        AND qual = 'true'
    `);
  } catch {
    permissivePolicies = [{ error: "policy_probe_failed" }];
  }
  checks.push({
    id: "no_permissive_using_true_on_factual_ledgers",
    ok: Array.isArray(permissivePolicies) && permissivePolicies.length === 0,
    violations: permissivePolicies,
  });

  // Effective catalog must cover C01–C20 with mode declared
  let catalogGaps = [];
  try {
    catalogGaps = psqlJson(`
      WITH codes AS (
        SELECT unnest(ARRAY[
          'C01','C02','C03','C04','C05','C06','C07','C08','C09','C10',
          'C11','C12','C13','C14','C15','C16','C17','C18','C19','C20'
        ]) AS causal_code
      ),
      eff AS (
        SELECT catalog_version_code
        FROM runtime_causal_rule_catalog_versions
        WHERE lifecycle_state = 'effective'
        LIMIT 1
      )
      SELECT c.causal_code
      FROM codes c
      CROSS JOIN eff e
      LEFT JOIN runtime_causal_catalog_causal_defs d
        ON d.catalog_version_code = e.catalog_version_code
       AND d.causal_code = c.causal_code
       AND d.enabled = true
      WHERE d.id IS NULL
    `);
  } catch {
    catalogGaps = [{ error: "catalog_probe_failed" }];
  }
  checks.push({
    id: "effective_catalog_covers_c01_c20",
    ok: Array.isArray(catalogGaps) && catalogGaps.length === 0,
    violations: catalogGaps,
  });

  // C11 must have expanded rules under effective catalog; C13 must be explicit_state_only
  let c11c13 = [];
  try {
    c11c13 = psqlJson(`
      WITH eff AS (
        SELECT catalog_version_code
        FROM runtime_causal_rule_catalog_versions
        WHERE lifecycle_state = 'effective'
        LIMIT 1
      )
      SELECT 'C11_rule_count' AS check_id, count(*)::text AS value
      FROM runtime_causal_required_variable_rules r
      JOIN eff e ON e.catalog_version_code = r.catalog_version_id
      WHERE r.causal_code = 'C11' AND r.enabled
      UNION ALL
      SELECT 'C13_mode', d.closure_validation_mode
      FROM runtime_causal_catalog_causal_defs d
      JOIN eff e ON e.catalog_version_code = d.catalog_version_code
      WHERE d.causal_code = 'C13'
    `);
  } catch {
    c11c13 = [];
  }
  const c11Count = Number(
    (c11c13.find((r) => r.check_id === "C11_rule_count") || {}).value ?? 0,
  );
  const c13Mode = (c11c13.find((r) => r.check_id === "C13_mode") || {}).value;
  checks.push({
    id: "c11_expanded_and_c13_explicit_state_only",
    ok: c11Count >= 6 && c13Mode === "explicit_state_only",
    violations: { c11Count, c13Mode },
  });

  // answered_closed effective must not have zero resolutions when mode=required_variables
  const zeroResClosed = [];
  for (const row of rows) {
    if (
      row.lifecycle_state === "effective" &&
      row.closure_state === "answered_closed"
    ) {
      const resCount = varRows.filter(
        (v) =>
          v.causal_evaluation_id === row.id && v.invalidated_at == null,
      ).length;
      if (resCount === 0) {
        zeroResClosed.push({ id: row.id, causalCode: row.causal_code });
      }
    }
  }
  checks.push({
    id: "answered_closed_not_zero_resolutions",
    ok: zeroResClosed.length === 0,
    violations: zeroResClosed,
  });

  const ok = checks.every((c) => c.ok);
  console.log(JSON.stringify({ ok, source, checks, totalEvaluations: rows.length }, null, 2));
  if (!ok) process.exitCode = 1;
}

async function loadLedgerRows() {
  try {
    const rows = psqlJson(`
      SELECT id, activity_runtime_run_id, causal_code, lifecycle_state, closure_state,
             canonical_route_closed, evidence_complete, effective_at, superseded_at, revoked_at
      FROM public.runtime_causal_evaluations
    `);
    const varRows = psqlJson(`
      SELECT id, causal_evaluation_id, resolution_state, invalidated_at
      FROM public.runtime_causal_variable_resolutions
    `);
    return { rows, varRows, source: "docker_psql" };
  } catch (dockerError) {
    let client;
    try {
      client = createAdminClient();
    } catch (envError) {
      throw new Error(
        `ledger_load_failed: docker=${formatError(dockerError)}; admin=${formatError(envError)}`,
      );
    }
    const { data: evaluations, error: evalError } = await client
      .from("runtime_causal_evaluations")
      .select(
        "id, activity_runtime_run_id, causal_code, lifecycle_state, closure_state, canonical_route_closed, evidence_complete, effective_at, superseded_at, revoked_at",
      );
    if (evalError) throw evalError;
    const { data: variables, error: varError } = await client
      .from("runtime_causal_variable_resolutions")
      .select("id, causal_evaluation_id, resolution_state, invalidated_at");
    if (varError) throw varError;
    return { rows: evaluations ?? [], varRows: variables ?? [], source: "supabase_js" };
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