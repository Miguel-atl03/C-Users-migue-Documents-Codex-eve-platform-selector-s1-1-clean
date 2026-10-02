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
  const pipeline = runNpmScript("validate:p7");
  const refreshed = readChainContext();
  const p7 = readJsonIfExists(
    join(repoRoot, "docs/production-activation/eve_production_activation_p7_consultant_review_packet_smoke_results.json"),
  );

  const consultantPacket = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING1_CONSULTANT_PACKET",
    generated_at: new Date().toISOString(),
    ring1_scope: "internal_test_tenant_limited_client",
    pipeline,
    consultant_packet_ref: refreshed?.consultant_packet_ref ?? p7?.consultant_packet_ref ?? null,
    consultant_review_packet_created: p7?.consultant_review_packet_created === true,
    consultant_packet_passed:
      pipeline.exit_code === 0 && p7?.consultant_review_packet_created === true,
    diagnosis_final_created: false,
    activation_allowed_general_production: false,
  };

  writeFileSync(RING1_ARTIFACT_PATHS.consultantPacket, `${JSON.stringify(consultantPacket, null, 2)}\n`);
  console.log(JSON.stringify(consultantPacket, null, 2));
  if (!consultantPacket.consultant_packet_passed) process.exit(1);
}

main();
