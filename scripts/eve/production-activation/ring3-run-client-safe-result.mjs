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
    writeBlockedArtifact(RING3_ARTIFACT_PATHS.clientSafeResult, "EVE_PRODUCTION_ACTIVATION_RING3_CLIENT_SAFE_RESULT", {
      client_safe_result_passed: false,
    });
    process.exit(BLOCKED_EXIT_CODE);
  }

  const featureFlags = resolveFeatureFlags(assessment);
  const pipeline = runNpmScript("validate:p6", featureFlags);
  const refreshed = readChainContext();
  const p6 = readJsonIfExists(
    join(repoRoot, "docs/production-activation/eve_production_activation_p6_client_safe_result_smoke_results.json"),
  );

  const clientSafe = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING3_CLIENT_SAFE_RESULT",
    generated_at: new Date().toISOString(),
    ring3_scope: "controlled_production_supervised_rollback_ready",
    target_classification: assessment.target_classification,
    pipeline,
    client_visible_state: refreshed?.client_visible_state ?? p6?.client_visible_state ?? null,
    client_safe_result_dto_valid: p6?.client_safe_result_dto_valid === true,
    client_visible_result_safe: p6?.client_visible_result_safe === true,
    client_safe_result_passed:
      pipeline.exit_code === 0 &&
      p6?.client_safe_result_dto_valid === true &&
      p6?.client_visible_result_safe === true,
    diagnosis_created: false,
    activation_allowed_general_production: false,
  };

  writeFileSync(RING3_ARTIFACT_PATHS.clientSafeResult, `${JSON.stringify(clientSafe, null, 2)}\n`);
  console.log(JSON.stringify(clientSafe, null, 2));
  if (!clientSafe.client_safe_result_passed) process.exit(1);
}

main();
