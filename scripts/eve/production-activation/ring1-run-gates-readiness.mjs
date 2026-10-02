#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { RING1_ARTIFACT_PATHS, repoRoot } from "./ring1-artifact-paths.mjs";
import { readJsonIfExists } from "./p9a-production-activation-lib.mjs";
import { readChainContext } from "./local-activation-chain-context-lib.mjs";

function main() {
  const refreshed = readChainContext();
  const p5 = readJsonIfExists(
    join(repoRoot, "docs/production-activation/eve_production_activation_p5_gates_readiness_local_smoke_results.json"),
  );
  const bffFlow = readJsonIfExists(RING1_ARTIFACT_PATHS.bffRuntimeFlow);

  const gateReadiness = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING1_GATE_READINESS",
    generated_at: new Date().toISOString(),
    ring1_scope: "internal_test_tenant_limited_client",
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

  writeFileSync(RING1_ARTIFACT_PATHS.gateReadiness, `${JSON.stringify(gateReadiness, null, 2)}\n`);
  console.log(JSON.stringify(gateReadiness, null, 2));
  if (!gateReadiness.gates_readiness_passed) process.exit(1);
}

main();
