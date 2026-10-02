#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..", "..");
const outputPath = join(
  repoRoot,
  "docs/production-activation/eve_production_activation_p5_gates_readiness_boundary_ledger.json",
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
  const forbidden = [
    /runtime-real/i,
    /SUPABASE_SERVICE_ROLE_KEY/i,
    /service_role/i,
    /readiness_decision_record/i,
    /readiness_gap_record/i,
  ];
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

function scanRemoteTouchSignals() {
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
  const remoteTouchSignals = scanRemoteTouchSignals();

  const result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_P5_GATES_READINESS_REAL_LOCAL_BOUNDARY_SCAN",
    generated_at: new Date().toISOString(),
    production_supabase_touched: false,
    remote_modified: false,
    diagnosis_created: false,
    export_real_created: false,
    produccion_paralela_started: false,
    qa_green_real_created: false,
    activation_allowed: false,
    client_internal_leakage: clientLeakage.length > 0,
    remote_touch_signals_found: remoteTouchSignals.length > 0,
    leakage_violations: clientLeakage,
  };
  writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  if (result.client_internal_leakage || result.remote_touch_signals_found) process.exit(1);
}

main();
