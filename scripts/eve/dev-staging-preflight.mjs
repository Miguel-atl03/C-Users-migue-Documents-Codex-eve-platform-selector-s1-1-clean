#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const EXPECTED_PROJECT_REF = process.env.EVE_LEGACY_STAGING_EXPECTED_PROJECT_REF;
if (!EXPECTED_PROJECT_REF || EXPECTED_PROJECT_REF === "keqrkyumfyhfivllvdbl") {
  throw new Error("legacy_staging_target_must_be_explicit_and_not_pr3");
}
const SERVER_ONLY_KEYS = [
  "EVE_SUPABASE_LOCAL_SERVICE_ROLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STAGING_SUPABASE_SECRET_KEY",
  "NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY",
];

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const envPath = resolve(root, ".env.local");

function parseEnvFile(contents) {
  const out = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
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

function projectRefFromUrl(rawUrl) {
  try {
    const host = new URL(rawUrl).hostname.toLowerCase();
    return host.endsWith(".supabase.co") ? host.split(".")[0] : null;
  } catch {
    return null;
  }
}

function fail(code, details = {}) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        code,
        ...details,
      },
      null,
      2,
    ),
  );
  process.exit(1);
}

const fileEnv = existsSync(envPath)
  ? parseEnvFile(readFileSync(envPath, "utf8"))
  : {};
const childEnv = { ...process.env, ...fileEnv };

const publicUrl = (childEnv.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const publicAnonKey = (childEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
const serverOnlyKeyName = SERVER_ONLY_KEYS.find((name) =>
  Boolean((childEnv[name] ?? "").trim()),
);
const projectRef = projectRefFromUrl(publicUrl);

if (!publicUrl) fail("missing_env:NEXT_PUBLIC_SUPABASE_URL");
if (!publicAnonKey) fail("missing_env:NEXT_PUBLIC_SUPABASE_ANON_KEY");
if (!serverOnlyKeyName) {
  fail("missing_env:server_only_supabase_secret", {
    accepted_variable_names: SERVER_ONLY_KEYS,
  });
}
if (projectRef !== EXPECTED_PROJECT_REF) {
  fail("staging_project_ref_mismatch", {
    expected_project_ref: EXPECTED_PROJECT_REF,
    actual_project_ref: projectRef,
  });
}

for (const [name, value] of Object.entries(childEnv)) {
  if (!name.startsWith("NEXT_PUBLIC_")) continue;
  if (!/SERVICE|SECRET|ROLE/i.test(name)) continue;
  if (String(value ?? "").trim()) {
    fail("server_secret_exposed_as_public_env", { variable_name: name });
  }
}

console.log(
  JSON.stringify({
    ok: true,
    project_ref: projectRef,
    public_supabase_url: "present",
    public_supabase_key: "present",
    server_only_secret: "present",
    server_only_variable_name: serverOnlyKeyName,
  }),
);

const args = process.argv.slice(2);
const nextBin = resolve(root, "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [nextBin, ...args], {
  cwd: root,
  env: childEnv,
  stdio: "inherit",
  windowsHide: true,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
