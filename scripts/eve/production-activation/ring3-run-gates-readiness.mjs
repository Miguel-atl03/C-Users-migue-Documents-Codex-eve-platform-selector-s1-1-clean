#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { BLOCKED_EXIT_CODE, RING3_ARTIFACT_PATHS, repoRoot } from "./ring3-artifact-paths.mjs";
import { assessControlledTarget, writeBlockedArtifact } from "./ring3-controlled-target-lib.mjs";
import { readJsonIfExists } from "./p9a-production-activation-lib.mjs";
import { readChainContext } from "./local-activation-chain-context-lib.mjs";

function main() {
  const assessment = assessControlledTarget();
  if (!assessment.ready_for_execution) {
    writeBlockedArtifact(RING3_ARTIFACT_PATHS.gateReadiness, "EVE_PRODUCTION_ACTIVATION_RING3_GATE_READINESS", {
      gates_readiness_passed: false,
    });
    process.exit(BLOCKED_EXIT_CODE);
  }

  const refreshed = readChainContext();
  const p5 = readJsonIfExists(
    join(repoRoot, "docs/production-activation/eve_production_activation_p5_gates_readiness_local_smoke_results.json"),
  );
  const bffFlow = readJsonIfExists(RING3_ARTIFACT_PATHS.bffRuntimeFlow);

  const gateReadiness = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING3_GATE_READINESS",
    generated_at: new Date().toISOString(),
    ring3_scope: "controlled_production_supervised_rollback_ready",
    target_classification: assessment.target_classification,
    readiness_state: refreshed?.readiness_state ?? p5?.readiness_state ?? null,
    readiness_decision_record_id: refreshed?.readiness_decision_record_id ?? null,
    critical_route_gates_executed_local: p5?.critical_route_gates_executed_local ?? false,
    gate_evaluations: p5?.critical_route_gate_results ?? p5?.gate_evaluations ?? null,
    b3_c09_executed_local: p5?.b3_c09_executed_local ?? null,
    b7_c20_executed_local: p5?.b7_c20_executed_local ?? null,
    gates_readiness_passed:
      p5?.readiness_decision_record_created === true &&
      p5?.critical_route_gates_executed_local === true &&
      bffFlow?.bff_runtime_flow_passed === true,
    activation_allowed_general_production: false,
    diagnosis_created: false,
  };

  writeFileSync(RING3_ARTIFACT_PATHS.gateReadiness, `${JSON.stringify(gateReadiness, null, 2)}\n`);
  console.log(JSON.stringify(gateReadiness, null, 2));
  if (!gateReadiness.gates_readiness_passed) process.exit(1);
}

main();
