#!/usr/bin/env node
/**
 * Create a clean production build copy at C:\eve-ola3-prod (or --dest).
 * Excludes env files, node_modules, .next, reports, bundles.
 * Does NOT write any .env* into the destination.
 *
 * Usage (from eve-platform root):
 *   node scripts/eve/official-control-panel/sync-ola3-clean-copy.mjs
 *   node scripts/eve/official-control-panel/sync-ola3-clean-copy.mjs --dest=C:\\eve-ola3-prod
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../..");
const destArg = process.argv.find((a) => a.startsWith("--dest="));
const dest = destArg ? destArg.slice("--dest=".length) : "C:\\eve-ola3-prod";

const excludeDirs = [
  "node_modules",
  ".next",
  "reports",
  "bundles",
  "Downloads",
  ".git",
  // Historical dumps / local-smoke scripts with Supabase CLI demo JWTs — not panel runtime.
  "docs\\production-activation",
  "scripts\\eve\\production-activation",
];

/** Robocopy /XF patterns — all env variants must be excluded. */
const excludeFiles = [
  ".env",
  ".env.*",
  ".env.local",
  ".env.*.local",
  ".env.production.local",
  ".env.development.local",
  ".env.test.local",
];

if (!existsSync(dest)) {
  mkdirSync(dest, { recursive: true });
}

const xd = excludeDirs.flatMap((d) => ["/XD", d]);
const xf = excludeFiles.flatMap((f) => ["/XF", f]);

const args = [
  root,
  dest,
  "/E",
  "/NFL",
  "/NDL",
  "/NJH",
  "/NJS",
  "/nc",
  "/ns",
  "/np",
  ...xd,
  ...xf,
];

const result = spawnSync("robocopy", args, {
  encoding: "utf8",
  shell: true,
  windowsHide: true,
});

// Robocopy: 0–7 = success family
const code = result.status ?? 1;
if (code >= 8) {
  console.error(result.stdout || result.stderr || "robocopy_failed");
  process.exit(1);
}

// Hard purge any .env* that slipped through
const purge = spawnSync(
  "powershell",
  [
    "-NoProfile",
    "-Command",
    `Get-ChildItem -LiteralPath '${dest.replace(/'/g, "''")}' -Force -Recurse -File -Filter '.env*' -ErrorAction SilentlyContinue | Remove-Item -Force; if (Test-Path -LiteralPath '${dest.replace(/'/g, "''")}\\.next') { Remove-Item -LiteralPath '${dest.replace(/'/g, "''")}\\.next' -Recurse -Force -ErrorAction SilentlyContinue }; (Get-ChildItem -LiteralPath '${dest.replace(/'/g, "''")}' -Force -Recurse -File -Filter '.env*' -ErrorAction SilentlyContinue | Measure-Object).Count`,
  ],
  { encoding: "utf8", windowsHide: true },
);

const envCount = Number((purge.stdout || "").trim().split(/\r?\n/).pop() || "0");
console.log(
  JSON.stringify(
    {
      ok: envCount === 0,
      dest,
      robocopyExit: code,
      envFilesInDest: envCount,
      excludedDirs: excludeDirs,
      excludedFiles: excludeFiles,
    },
    null,
    2,
  ),
);
process.exit(envCount === 0 ? 0 : 1);
