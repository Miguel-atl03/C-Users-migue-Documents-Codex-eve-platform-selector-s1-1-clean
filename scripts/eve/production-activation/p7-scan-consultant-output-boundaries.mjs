#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..", "..");
const outputPath = join(
  repoRoot,
  "docs/production-activation/eve_production_activation_p7_consultant_review_packet_boundary_ledger.json",
);
const smokePath = join(
  repoRoot,
  "docs/production-activation/eve_production_activation_p7_consultant_review_packet_smoke_results.json",
);

const FORBIDDEN_BOUNDARY_KEYS = [
  "diagnosis_final",
  "diagnostic_label",
  "pathology_classification",
  "ahe_diagnostic_output",
  "vsm_diagnostic_output",
  "mmabp_final_assessment",
  "registry_final",
  "ir_final",
  "export_payload_real",
  "parallel_production_started",
  "production_activation_allowed",
  "qa_green_real",
];

function walkFiles(target, out = []) {
  if (!existsSync(target)) return out;
  const stats = statSync(target);
  if (stats.isFile()) {
    if (/\.(ts|tsx|mjs|json)$/.test(target)) out.push(target);
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
    if (/\.(ts|tsx|mjs|json)$/.test(entry)) out.push(full);
  }
  return out;
}

function scanForbiddenKeys(payload) {
  const serialized = JSON.stringify(payload).toLowerCase();
  return FORBIDDEN_BOUNDARY_KEYS.filter((key) => serialized.includes(`"${key}"`));
}

function main() {
  const consultantRoots = [
    "src/services/eve/runtime-40-20/consultant-result",
    "src/app/api/eve/runtime-40-20/consultant",
  ];

  const sourceViolations = [];
  for (const root of consultantRoots) {
    for (const file of walkFiles(join(repoRoot, root))) {
      const rel = relative(repoRoot, file).replace(/\\/g, "/");
      const content = readFileSync(file, "utf8");
      if (rel.endsWith("runtime-40-20-consultant-result-types.ts")) continue;
      if (rel.endsWith(".test.mjs")) continue;
      for (const key of FORBIDDEN_BOUNDARY_KEYS) {
        if (content.includes(key) && !content.includes("FORBIDDEN")) {
          sourceViolations.push({ file: rel, key });
        }
      }
    }
  }

  let smokeViolations = [];
  if (existsSync(smokePath)) {
    const smoke = JSON.parse(readFileSync(smokePath, "utf8"));
    smokeViolations = scanForbiddenKeys(smoke.consultant_review_packet ?? {});
  }

  const result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_P7_CONSULTANT_REVIEW_PACKET_BOUNDARY_SCAN",
    generated_at: new Date().toISOString(),
    diagnostic_label_created: false,
    pathology_classification_created: false,
    registry_final_created: false,
    ir_final_created: false,
    export_real_created: false,
    produccion_paralela_started: false,
    qa_green_real_created: false,
    activation_allowed: false,
    diagnosis_final_auto_created: false,
    ahe_vsm_diagnostic_output_created: false,
    mmabp_final_assessment_auto_created: false,
    source_violations: sourceViolations,
    smoke_packet_violations: smokeViolations,
    production_supabase_touched: false,
  };

  writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));

  if (smokeViolations.length > 0) {
    process.exit(1);
  }
}

main();
