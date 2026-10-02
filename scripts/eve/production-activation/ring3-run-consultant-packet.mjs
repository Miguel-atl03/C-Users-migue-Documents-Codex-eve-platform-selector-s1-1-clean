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
    writeBlockedArtifact(RING3_ARTIFACT_PATHS.consultantPacket, "EVE_PRODUCTION_ACTIVATION_RING3_CONSULTANT_PACKET", {
      consultant_packet_passed: false,
      consultant_packet_supervised: false,
    });
    process.exit(BLOCKED_EXIT_CODE);
  }

  const featureFlags = resolveFeatureFlags(assessment);
  const supervisor = readJsonIfExists(RING3_ARTIFACT_PATHS.ring2SupervisorAssignment);
  const pipeline = runNpmScript("validate:p7", featureFlags);
  const refreshed = readChainContext();
  const p7 = readJsonIfExists(
    join(repoRoot, "docs/production-activation/eve_production_activation_p7_consultant_review_packet_smoke_results.json"),
  );

  const consultantPacket = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING3_CONSULTANT_PACKET",
    generated_at: new Date().toISOString(),
    ring3_scope: "controlled_production_supervised_rollback_ready",
    target_classification: assessment.target_classification,
    supervisor_id: supervisor?.supervisor_id ?? supervisor?.consultant_id ?? null,
    human_supervision_required: true,
    pipeline,
    consultant_review_packet_created: p7?.consultant_review_packet_created === true,
    consultant_packet_passed:
      pipeline.exit_code === 0 &&
      p7?.consultant_review_packet_created === true &&
      supervisor?.assigned === true,
    consultant_packet_supervised:
      supervisor?.assigned === true &&
      p7?.consultant_review_packet_created === true &&
      p7?.diagnosis_final_created !== true,
    diagnosis_final_created: false,
    activation_allowed_general_production: false,
    consultant_packet_ref: refreshed?.consultant_packet_ref ?? null,
  };

  writeFileSync(RING3_ARTIFACT_PATHS.consultantPacket, `${JSON.stringify(consultantPacket, null, 2)}\n`);
  console.log(JSON.stringify(consultantPacket, null, 2));
  if (!consultantPacket.consultant_packet_passed) process.exit(1);
}

main();
