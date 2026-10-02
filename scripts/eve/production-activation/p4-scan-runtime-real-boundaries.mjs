#!/usr/bin/env node
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..", "..");
const outputPath = join(
  repoRoot,
  "docs/production-activation/eve_production_activation_p4_runtime_real_boundary_ledger.json",
);

function walkFiles(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      if (entry === "node_modules" || entry === ".next" || entry === ".git") continue;
      walkFiles(full, out);
      continue;
    }
    if (/\.(ts|tsx|js|mjs|json|md)$/i.test(entry)) out.push(full);
  }
  return out;
}

function scanClientInternalLeakage() {
  const roots = ["src/app", "src/components", "src/features"];
  const forbidden = [/runtime-real/i, /SUPABASE_SERVICE_ROLE_KEY/i, /service_role/i];
  const violations = [];
  for (const root of roots) {
    for (const file of walkFiles(join(repoRoot, root))) {
      const rel = relative(repoRoot, file).replace(/\\/g, "/");
      if (rel.startsWith("src/app/api/")) continue;
      const content = readFileSync(file, "utf8");
      for (const rule of forbidden) {
        if (rule.test(content)) {
          violations.push({ file: rel, rule: String(rule) });
          break;
        }
      }
    }
  }
  return violations;
}

function scanRemoteTouchAttempt() {
  const roots = ["src", "scripts"];
  const violations = [];
  for (const root of roots) {
    for (const file of walkFiles(join(repoRoot, root))) {
      const content = readFileSync(file, "utf8");
      if (/toolName["']?\s*:\s*["'](apply_migration|execute_sql)["']/i.test(content)) {
        violations.push(relative(repoRoot, file).replace(/\\/g, "/"));
      }
    }
  }
  return violations;
}

function main() {
  const clientLeakage = scanClientInternalLeakage();
  const remoteTouch = scanRemoteTouchAttempt();
  const result = {
    dictamen:
      "EVE_PRODUCTION_ACTIVATION_P4_RUNTIME_40_20_REAL_BEHIND_SIGNIFICADO_LOCAL_BOUNDARY_SCAN",
    generated_at: new Date().toISOString(),
    production_supabase_touched: false,
    remote_modified: false,
    service_role_exposed: clientLeakage.some((item) => /service_role/i.test(item.rule)),
    client_internal_leakage: clientLeakage.length > 0,
    qa_green_real_created: false,
    activation_allowed: false,
    remote_touch_signals_found: remoteTouch.length > 0,
    leakage_violations: clientLeakage,
  };
  writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  if (result.client_internal_leakage || result.remote_touch_signals_found) process.exit(1);
}

main();
