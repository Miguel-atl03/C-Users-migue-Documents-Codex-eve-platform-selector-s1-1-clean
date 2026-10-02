#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..", "..");
const smokePath = join(
  repoRoot,
  "docs/production-activation/eve_production_activation_p8_parallel_payload_smoke_results.json",
);
const outputPath = join(
  repoRoot,
  "docs/production-activation/eve_production_activation_p8_parallel_payload_inventory.json",
);

function main() {
  if (!existsSync(smokePath)) {
    console.error(
      "Missing P8 smoke results. Run p8-controlled-parallel-production-local-smoke.mjs first.",
    );
    process.exit(1);
  }

  const smoke = JSON.parse(readFileSync(smokePath, "utf8"));
  const rehearsal = smoke.rehearsal;

  const exportAllowed = rehearsal?.export_preparation_allowed === true;
  const parallel_export_payload_local_created_if_allowed =
    !exportAllowed || Boolean(rehearsal?.parallel_export_payload);

  const consultant_review_required_when_flags =
    smoke.readiness_state === "ready_with_flags"
      ? smoke.requires_consultant_review === true
      : true;

  const result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_P8_PARALLEL_PAYLOAD_VALIDATION",
    generated_at: new Date().toISOString(),
    scr_patch_created: smoke.scr_patch_created === true,
    evidence_bundle_patch_created: smoke.evidence_bundle_patch_created === true,
    mdsb_patch_created: smoke.mdsb_patch_created === true,
    parallel_export_payload_local_created_if_allowed,
    production_export_allowed: false,
    external_export_executed: false,
    consultant_review_required_when_flags,
    diagnosis_final_created: false,
    registry_final_created: false,
    ir_final_created: false,
    export_real_created: false,
    produccion_paralela_started: false,
    qa_green_real_created: false,
    activation_allowed: false,
    production_supabase_touched: false,
  };

  writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));

  if (
    !result.scr_patch_created ||
    !result.evidence_bundle_patch_created ||
    !result.mdsb_patch_created ||
    !result.consultant_review_required_when_flags
  ) {
    process.exit(1);
  }
}

main();
