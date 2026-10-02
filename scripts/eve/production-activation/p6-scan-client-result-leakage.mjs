#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..", "..");
const outputPath = join(
  repoRoot,
  "docs/production-activation/eve_production_activation_p6_client_safe_result_leakage_scan.json",
);

const SCAN_ROOTS = [
  "src/services/eve/runtime-40-20/client-result",
  "src/services/eve/runtime-40-20/client-bff",
  "src/app/api/eve/runtime-40-20/client-bff/review",
  "src/components/client",
  "src/app/page.tsx",
];

const FORBIDDEN_TERMS = [
  { key: "MMABP", pattern: /\bMMABP\b/i },
  { key: "VSM", pattern: /\bVSM\b/i },
  { key: "AHE", pattern: /\bAHE\b/i },
  { key: "Gate", pattern: /\bGate\b/ },
  { key: "Chip", pattern: /\bChip\b/ },
  { key: "Runtime table", pattern: /Runtime table/i },
  { key: "Diagnosis", pattern: /diagn[oó]stico final/i },
  { key: "Pathology", pattern: /patolog[ií]a/i },
  { key: "Export", pattern: /export payload/i },
  { key: "Registry", pattern: /\bregistry\b/i },
  { key: "IR", pattern: /\bIR\b/ },
  { key: "readiness_decision_record", pattern: /readiness_decision_record/i },
  { key: "readiness_gap_record", pattern: /readiness_gap_record/i },
  { key: "readiness_state", pattern: /readiness_state/i },
];

function walkFiles(target, out = []) {
  if (!existsSync(target)) return out;
  const stats = statSync(target);
  if (stats.isFile()) {
    if (/\.(ts|tsx|mjs)$/.test(target)) out.push(target);
    return out;
  }
  for (const entry of readdirSync(target)) {
    const full = join(target, entry);
    const entryStats = statSync(full);
    if (entryStats.isDirectory()) {
      if (entry === "node_modules" || entry === ".next") continue;
      walkFiles(full, out);
      continue;
    }
    if (/\.(ts|tsx|mjs)$/.test(entry)) out.push(full);
  }
  return out;
}

function isClientSurfaceFile(relPath) {
  if (relPath.includes("client-result-service.ts")) return false;
  if (relPath.includes("client-bff-service.ts")) return false;
  if (relPath.includes("client-result-types.ts")) return false;
  if (relPath.includes("client-bff-types.ts")) return false;
  if (relPath.includes("review/route.ts")) return false;
  if (relPath.endsWith(".test.mjs")) return false;
  return true;
}

function scanSurfaceLeakage() {
  const violations = [];
  const exposure = Object.fromEntries(FORBIDDEN_TERMS.map((term) => [term.key, false]));

  for (const root of SCAN_ROOTS) {
    const target = join(repoRoot, root);
    for (const file of walkFiles(target)) {
      const rel = relative(repoRoot, file).replace(/\\/g, "/");
      const content = readFileSync(file, "utf8");
      const clientSurface = isClientSurfaceFile(rel);

      for (const term of FORBIDDEN_TERMS) {
        if (!term.pattern.test(content)) continue;
        if (
          clientSurface ||
          (term.key === "readiness_state" && rel.includes("client-result"))
        ) {
          if (clientSurface) exposure[term.key] = true;
          violations.push({ file: rel, term: term.key, client_surface: clientSurface });
        }
      }
    }
  }

  return { violations, exposure };
}

function main() {
  const { violations, exposure } = scanSurfaceLeakage();
  const clientSurfaceViolations = violations.filter((v) => v.client_surface);

  const result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_P6_CLIENT_SAFE_RESULT_LEAKAGE_SCAN",
    generated_at: new Date().toISOString(),
    MMABP_exposed: exposure.MMABP,
    VSM_exposed: exposure.VSM,
    AHE_exposed: exposure.AHE,
    Gate_exposed: exposure.Gate,
    Chip_exposed: exposure.Chip,
    "Runtime table_exposed": exposure["Runtime table"],
    Diagnosis_exposed: exposure.Diagnosis,
    Pathology_exposed: exposure.Pathology,
    Export_exposed: exposure.Export,
    Registry_exposed: exposure.Registry,
    IR_exposed: exposure.IR,
    internal_organs_exposed: clientSurfaceViolations.length > 0,
    client_internal_leakage: clientSurfaceViolations.length > 0,
    violations: clientSurfaceViolations,
    production_supabase_touched: false,
    activation_allowed: false,
  };

  writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));

  if (result.client_internal_leakage) process.exit(1);
}

main();
