#!/usr/bin/env node
/**
 * Shared helpers for R4 acceptance fixture seeds (test-only).
 * Never touches Amber company/case IDs.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

export const AMBER_COMPANY = "5c08029f-15e9-4bbd-b13e-0ff4765e23b8";
export const AMBER_CASE = "19fc9eff-4219-43f0-854c-e2b3350f23f2";

export const __r4Dir = dirname(fileURLToPath(import.meta.url));
export const projectRoot = resolve(__r4Dir, "../../../..");
export const R4_MANIFEST_DIR = resolve(
  projectRoot,
  "reports/local/rector-r4-acceptance",
);
export const R4_MANIFEST_PATH = resolve(R4_MANIFEST_DIR, "manifest.json");

export function loadEnvLocal() {
  const path = resolve(projectRoot, ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i <= 0) continue;
    const key = trimmed.slice(0, i).trim();
    const value = trimmed.slice(i + 1).trim().replace(/^"|"$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

export function resolveEnv() {
  loadEnvLocal();
  const supabaseUrl = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ""
  ).trim();
  let serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  let anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  if (!serviceRoleKey || !anonKey) {
    const status = spawnSync("npx", ["supabase", "status", "-o", "env"], {
      cwd: projectRoot,
      encoding: "utf8",
      shell: true,
    });
    const out = `${status.stdout || ""}\n${status.stderr || ""}`;
    if (!serviceRoleKey) {
      const m = /SERVICE_ROLE_KEY=(.+)/.exec(out);
      if (m) serviceRoleKey = m[1].trim().replace(/^"|"$/g, "");
    }
    if (!anonKey) {
      const m = /ANON_KEY=(.+)/.exec(out);
      if (m) anonKey = m[1].trim().replace(/^"|"$/g, "");
    }
  }
  const password = (process.env.EVE_UNIT2B_TEST_PASSWORD || "").trim();
  if (!supabaseUrl || !serviceRoleKey || !password) {
    throw new Error("missing_env:supabase_url|service_role|EVE_UNIT2B_TEST_PASSWORD");
  }
  return { supabaseUrl, serviceRoleKey, anonKey, password };
}

export function assertLocal(url) {
  const host = new URL(url).hostname.toLowerCase();
  if (host !== "127.0.0.1" && host !== "localhost") {
    throw new Error("remote_supabase_rejected");
  }
}

export function assertNotAmber(...ids) {
  for (const id of ids) {
    if (id === AMBER_CASE || id === AMBER_COMPANY) {
      throw new Error("amber_seed_forbidden");
    }
  }
}

export function createAdminClient(env) {
  return createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function ensureUser(admin, email, password) {
  const list = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = list.data?.users?.find((u) => u.email === email);
  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    });
    return existing.id;
  }
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (created.error) throw created.error;
  return created.data.user.id;
}

export async function mustGrant(
  admin,
  actorId,
  consultantId,
  companyId,
  capability,
  reason,
) {
  const { error } = await admin.rpc("eve_grant_consultant_panel_capability", {
    p_actor_user_id: actorId,
    p_consultant_user_id: consultantId,
    p_client_company_id: companyId,
    p_capability: capability,
    p_reason: reason,
    p_valid_from: new Date().toISOString(),
    p_valid_until: null,
  });
  if (error) {
    throw new Error(
      `eve_grant_consultant_panel_capability:${capability}:${error.message}`,
    );
  }
}

export async function mustRpc(admin, name, args) {
  const { data, error } = await admin.rpc(name, args);
  if (error) throw new Error(`${name}:${error.message}`);
  return data;
}

export function runSql(sql) {
  const result = spawnSync(
    "docker",
    [
      "exec",
      "-i",
      "supabase_db_eve-platform",
      "psql",
      "-v",
      "ON_ERROR_STOP=1",
      "-U",
      "postgres",
      "-d",
      "postgres",
    ],
    { encoding: "utf8", input: sql },
  );
  if (result.status !== 0) {
    throw new Error(
      `sql_failed:${result.stderr || result.stdout || "unknown"}`,
    );
  }
  return result.stdout;
}

export function trackingUrl({ companyId, relationshipId, caseId, mode, view }) {
  const m = mode ?? "client-company";
  const v = view ?? "tracking";
  return (
    `/admin/official-consultant-control-panel` +
    `?mode=${m}&view=${v}` +
    `&company=${companyId}` +
    `&relationship=${relationshipId}` +
    `&case=${caseId}`
  );
}

export function monitoringUrl(ids) {
  return trackingUrl({ ...ids, view: "monitoring" });
}

export function runNodeScript(scriptRelativePath, env) {
  const scriptPath = resolve(projectRoot, scriptRelativePath);
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: projectRoot,
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) {
    throw new Error(
      `script_failed:${scriptRelativePath}:${result.stderr || result.stdout || "unknown"}`,
    );
  }
  return {
    stdout: result.stdout || "",
    stderr: result.stderr || "",
  };
}

export function runTypeScriptScript(scriptRelativePath, args = [], env = {}) {
  const scriptPath = resolve(projectRoot, scriptRelativePath);
  const result = spawnSync(
    process.execPath,
    ["--experimental-strip-types", scriptPath, ...args],
    {
      cwd: projectRoot,
      encoding: "utf8",
      env: { ...process.env, ...env },
      shell: false,
    },
  );
  if (result.status !== 0) {
    throw new Error(
      "typescript_script_failed:" +
        scriptRelativePath +
        ":" +
        (result.stderr || result.stdout || "unknown"),
    );
  }
  return {
    stdout: result.stdout || "",
    stderr: result.stderr || "",
  };
}

export function readJsonIfExists(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8"));
}

export function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2));
}

export function sqlQuote(value) {
  return String(value).replace(/'/g, "''");
}

/**
 * Deterministic R4 ID: a4f4{fx:02d}{slot:02d}-0000-4000-8000-{seq:012d}
 * Distinct from point15 (a1500015) and fx08 (a2080008).
 */
export function r4Id(fxNumber, slot, seq) {
  const fx = String(fxNumber).padStart(2, "0");
  const sl = String(slot).padStart(2, "0");
  const s = String(seq).padStart(12, "0");
  return `a4f4${fx}${sl}-0000-4000-8000-${s}`;
}

export const EMAIL_CONSULTANT_A = "r4-consultant-a@example.invalid";
export const EMAIL_CONSULTANT_B = "r4-consultant-b@example.invalid";
export const EMAIL_ADMIN = "r4-admin@example.invalid";
