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
  const pipeline = runNpmScript("validate:p6");
  const refreshed = readChainContext();
  const p6 = readJsonIfExists(
    join(repoRoot, "docs/production-activation/eve_production_activation_p6_client_safe_result_smoke_results.json"),
  );

  const clientSafe = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING1_CLIENT_SAFE_RESULT",
    generated_at: new Date().toISOString(),
    ring1_scope: "internal_test_tenant_limited_client",
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

  writeFileSync(RING1_ARTIFACT_PATHS.clientSafeResult, `${JSON.stringify(clientSafe, null, 2)}\n`);
  console.log(JSON.stringify(clientSafe, null, 2));
  if (!clientSafe.client_safe_result_passed) process.exit(1);
}

main();
