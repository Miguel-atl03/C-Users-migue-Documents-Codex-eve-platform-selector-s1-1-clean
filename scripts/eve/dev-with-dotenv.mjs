#!/usr/bin/env node
/**
 * Start Next with .env.local forcing precedence over inherited process env.
 * Cursor/agent shells sometimes inject NEXT_PUBLIC_SUPABASE_URL to a remote
 * host; Next then ignores .env.local and the official panel local gate fails.
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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

function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

const fileEnv = existsSync(envPath)
  ? parseEnvFile(readFileSync(envPath, "utf8"))
  : {};

const childEnv = { ...process.env, ...fileEnv };

const inheritedHost = hostOf(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
const effectiveHost = hostOf(childEnv.NEXT_PUBLIC_SUPABASE_URL ?? "");
if (inheritedHost && inheritedHost !== effectiveHost) {
  console.log(
    `[eve-dev] Overriding inherited NEXT_PUBLIC_SUPABASE_URL host "${inheritedHost}" → "${effectiveHost || "(from .env.local)"}"`,
  );
}

const args = process.argv.slice(2);
const nextBin = resolve(
  root,
  "node_modules",
  "next",
  "dist",
  "bin",
  "next",
);

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
