#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { BLOCKED_EXIT_CODE, RING3_ARTIFACT_PATHS, repoRoot } from "./ring3-artifact-paths.mjs";
import { assessControlledTarget, resolveFeatureFlags, writeBlockedArtifact } from "./ring3-controlled-target-lib.mjs";
import { readJsonIfExists } from "./p9a-production-activation-lib.mjs";
import { readChainContext } from "./local-activation-chain-context-lib.mjs";

function runNpmScript(scriptName, featureFlags) {
  const result = spawnSync("npm", ["run", scriptName], {
    cwd: repoRoot,
    encoding: "utf8",
    shell: true,
    env: { ...process.env, ...featureFlags },
  });
  return { script: scriptName, exit_code: result.status ?? 1, status: result.status === 0 ? "passed" : "failed" };
}

function main() {
  const assessment = assessControlledTarget();
  if (!assessment.ready_for_execution) {
    writeBlockedArtifact(RING3_ARTIFACT_PATHS.parallelPayload, "EVE_PRODUCTION_ACTIVATION_RING3_PARALLEL_PAYLOAD", {
      parallel_payload_controlled_rehearsal_passed: false,
    });
    process.exit(BLOCKED_EXIT_CODE);
  }

  const featureFlags = resolveFeatureFlags(assessment);
  const pipeline = runNpmScript("validate:p8", featureFlags);
  const refreshed = readChainContext();
  const p8 = readJsonIfExists(
    join(repoRoot, "docs/production-activation/eve_production_activation_p8_parallel_payload_smoke_results.json"),
  );

  const parallelPayload = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING3_PARALLEL_PAYLOAD",
    generated_at: new Date().toISOString(),
    ring3_scope: "controlled_production_supervised_rollback_ready",
    target_classification: assessment.target_classification,
    pipeline,
    scr_patch_created: p8?.scr_patch_created === true,
    parallel_payload_controlled_rehearsal_passed:
      pipeline.exit_code === 0 &&
      p8?.scr_patch_created === true &&
      p8?.produccion_paralela_productiva_started !== true &&
      p8?.export_real_created !== true,
    produccion_paralela_productiva_started: false,
    export_real_created: false,
    diagnosis_final_created: false,
    activation_allowed_general_production: false,
    parallel_rehearsal_ref: refreshed?.parallel_rehearsal_ref ?? null,
  };

  writeFileSync(RING3_ARTIFACT_PATHS.parallelPayload, `${JSON.stringify(parallelPayload, null, 2)}\n`);
  console.log(JSON.stringify(parallelPayload, null, 2));
  if (!parallelPayload.parallel_payload_controlled_rehearsal_passed) process.exit(1);
}

main();
