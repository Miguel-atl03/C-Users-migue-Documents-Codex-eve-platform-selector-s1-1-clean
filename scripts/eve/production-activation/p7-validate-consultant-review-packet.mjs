#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..", "..");
const smokePath = join(
  repoRoot,
  "docs/production-activation/eve_production_activation_p7_consultant_review_packet_smoke_results.json",
);
const outputPath = join(
  repoRoot,
  "docs/production-activation/eve_production_activation_p7_consultant_review_packet_inventory.json",
);

function main() {
  if (!existsSync(smokePath)) {
    console.error("Missing P7 smoke results. Run p7-consultant-review-packet-local-smoke.mjs first.");
    process.exit(1);
  }

  const smoke = JSON.parse(readFileSync(smokePath, "utf8"));
  const packet = smoke.consultant_review_packet;

  const result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_P7_CONSULTANT_REVIEW_PACKET_VALIDATION",
    generated_at: new Date().toISOString(),
    consultant_review_packet_created: smoke.consultant_review_packet_created === true,
    session_summary_present: smoke.session_summary_present === true,
    activity_summary_present: smoke.activity_summary_present === true,
    evidence_present: smoke.evidence_present === true,
    canonical_variables_present: smoke.canonical_variables_present === true,
    readiness_decision_present: smoke.readiness_decision_present === true,
    audit_trail_present: smoke.audit_trail_present === true,
    packet_safe: packet?.packet_safe === true,
    diagnosis_final_auto_created: false,
    export_real_created: false,
    produccion_paralela_started: false,
    qa_green_real_created: false,
    activation_allowed: false,
    production_supabase_touched: false,
  };

  writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));

  if (
    !result.consultant_review_packet_created ||
    !result.session_summary_present ||
    !result.activity_summary_present ||
    !result.evidence_present ||
    !result.canonical_variables_present ||
    !result.readiness_decision_present ||
    !result.audit_trail_present
  ) {
    process.exit(1);
  }
}

main();
