#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { RING1_ARTIFACT_PATHS, RING1_FEATURE_FLAGS, repoRoot } from "./ring1-artifact-paths.mjs";
import { readJsonIfExists } from "./p9a-production-activation-lib.mjs";
import { readChainContext } from "./local-activation-chain-context-lib.mjs";

function runNpmScript(scriptName) {
  const result = spawnSync("npm", ["run", scriptName], {
    cwd: repoRoot,
    encoding: "utf8",
    shell: true,
    env: { ...process.env, ...RING1_FEATURE_FLAGS },
  });
  return { script: scriptName, exit_code: result.status ?? 1, status: result.status === 0 ? "passed" : "failed" };
}

function main() {
  const pipeline = runNpmScript("validate:p8");
  const refreshed = readChainContext();
  const p8 = readJsonIfExists(
    join(repoRoot, "docs/production-activation/eve_production_activation_p8_parallel_payload_smoke_results.json"),
  );

  const parallelPayload = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING1_PARALLEL_PAYLOAD",
    generated_at: new Date().toISOString(),
    ring1_scope: "internal_test_tenant_limited_client",
    pipeline,
    parallel_rehearsal_ref: refreshed?.parallel_rehearsal_ref ?? p8?.parallel_rehearsal_ref ?? null,
    scr_patch_created: p8?.scr_patch_created === true,
    evidence_bundle_patch_created: p8?.evidence_bundle_patch_created === true,
    mdsb_patch_created: p8?.mdsb_patch_created === true,
    parallel_payload_local_rehearsal_passed:
      pipeline.exit_code === 0 && p8?.scr_patch_created === true && p8?.no_forbidden_fields === true,
    export_real_created: false,
    produccion_paralela_productiva_started: false,
    activation_allowed_general_production: false,
  };

  writeFileSync(RING1_ARTIFACT_PATHS.parallelPayload, `${JSON.stringify(parallelPayload, null, 2)}\n`);
  console.log(JSON.stringify(parallelPayload, null, 2));
  if (!parallelPayload.parallel_payload_local_rehearsal_passed) process.exit(1);
}

main();
