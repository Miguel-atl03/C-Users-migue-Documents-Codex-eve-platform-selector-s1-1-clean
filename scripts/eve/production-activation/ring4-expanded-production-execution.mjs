#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  BLOCKED_EXIT_CODE,
  RING4_ARTIFACT_PATHS,
  repoRoot,
} from "./ring4-artifact-paths.mjs";
import {
  assessScaleTarget,
  BLOCKED_STATUS,
  resolveFeatureFlags,
} from "./ring4-scale-target-lib.mjs";
import { readJsonIfExists } from "./p9a-production-activation-lib.mjs";

const MODULE_TESTS = [
  "src/services/eve/runtime-40-20/parallel-production/runtime-40-20-parallel-production.test.mjs",
  "src/services/eve/runtime-40-20/consultant-result/runtime-40-20-consultant-result.test.mjs",
  "src/services/eve/runtime-40-20/client-result/runtime-40-20-client-result.test.mjs",
  "src/services/eve/runtime-40-20/gates-readiness/runtime-40-20-gates-readiness.test.mjs",
  "src/services/eve/runtime-40-20/runtime-real/runtime-40-20-runtime-real.test.mjs",
  "src/services/eve/runtime-40-20/client-bff/runtime-40-20-client-bff.test.mjs",
  "src/services/eve/runtime-40-20/client-membrane/runtime-40-20-client-membrane.test.mjs",
];

const RING4_SCRIPTS = [
  "scripts/eve/production-activation/ring4-validate-scale-target.mjs",
  "scripts/eve/production-activation/ring4-create-scale-execution-scope.mjs",
  "scripts/eve/production-activation/ring4-create-traffic-tenant-case-allowlist.mjs",
  "scripts/eve/production-activation/ring4-validate-mba-conformance.mjs",
  "scripts/eve/production-activation/ring4-validate-structural-framework-coverage.mjs",
  "scripts/eve/production-activation/ring4-run-client-ui-flow.mjs",
  "scripts/eve/production-activation/ring4-run-bff-runtime-flow.mjs",
  "scripts/eve/production-activation/ring4-run-gates-readiness.mjs",
  "scripts/eve/production-activation/ring4-run-client-safe-result.mjs",
  "scripts/eve/production-activation/ring4-run-consultant-packet.mjs",
  "scripts/eve/production-activation/ring4-run-parallel-payload.mjs",
  "scripts/eve/production-activation/ring4-run-observability-slo-check.mjs",
  "scripts/eve/production-activation/ring4-run-incident-response-check.mjs",
  "scripts/eve/production-activation/ring4-run-rollback-drill.mjs",
  "scripts/eve/production-activation/ring4-run-abort-drill.mjs",
];

function run(command, args = [], options = {}) {
  const started = Date.now();
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    shell: true,
    env: { ...process.env, ...options.env },
    ...options,
  });
  return {
    command: [command, ...args].join(" "),
    status: result.status === 0 ? "passed" : result.status === BLOCKED_EXIT_CODE ? "blocked" : "failed",
    exit_code: result.status ?? 1,
    duration_ms: Date.now() - started,
    stdout_tail: (result.stdout ?? "").slice(-2000),
    stderr_tail: (result.stderr ?? "").slice(-2000),
  };
}

function runNodeScript(scriptPath, featureFlags) {
  return run("node", [scriptPath], { env: featureFlags });
}

function main() {
  const ring4Auth = readJsonIfExists(join(repoRoot, "docs/production-activation/ring4_authorization_record.json"));
  if (ring4Auth?.ring4_authorized !== true) {
    console.error("Ring 4 authorization not verified");
    process.exit(1);
  }

  const assessment = assessScaleTarget();
  const featureFlags = resolveFeatureFlags(assessment);
  const targetBlocked = !assessment.ready_for_execution;

  const commands = {};
  commands.typecheck = run("npx", ["tsc", "--noEmit", "--pretty", "false"]);
  commands.build_webpack = run("npx", ["next", "build", "--webpack"]);

  const moduleResults = {};
  let allModulePassed = true;
  for (const testPath of MODULE_TESTS) {
    const key = testPath.split("/").pop()?.replace(".test.mjs", "") ?? testPath;
    const result = run("node", ["--test", testPath]);
    moduleResults[key] = result;
    if (result.exit_code !== 0) allModulePassed = false;
  }
  commands.module_tests = moduleResults;
  commands.all_module_tests_passed = allModulePassed;

  commands.validate_ring0 = run("npm", ["run", "validate:ring0"]);
  commands.validate_ring1 = run("npm", ["run", "validate:ring1"]);
  commands.validate_ring2 = run("npm", ["run", "validate:ring2"]);
  commands.validate_ring3 = run("npm", ["run", "validate:ring3"]);
  commands.validate_p5 = run("npm", ["run", "validate:p5"]);
  commands.validate_p6 = run("npm", ["run", "validate:p6"]);
  commands.validate_p7 = run("npm", ["run", "validate:p7"]);
  commands.validate_p8 = run("npm", ["run", "validate:p8"]);

  const ring4Results = {};
  if (!targetBlocked) {
    for (const script of RING4_SCRIPTS) {
      const key = script.split("/").pop()?.replace(".mjs", "") ?? script;
      ring4Results[key] = runNodeScript(script, featureFlags);
    }
  }
  commands.ring4_scripts = ring4Results;

  const corePassed =
    commands.typecheck.exit_code === 0 &&
    commands.build_webpack.exit_code === 0 &&
    allModulePassed &&
    commands.validate_ring0.exit_code === 0 &&
    commands.validate_ring1.exit_code === 0 &&
    commands.validate_ring2.exit_code === 0 &&
    commands.validate_ring3.exit_code === 0 &&
    commands.validate_p5.exit_code === 0 &&
    commands.validate_p6.exit_code === 0 &&
    commands.validate_p7.exit_code === 0 &&
    commands.validate_p8.exit_code === 0;

  const commandResults = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING4_COMMAND_RESULTS",
    generated_at: new Date().toISOString(),
    project_root: repoRoot,
    ring4_scope: "expanded_production_scale_governance",
    ring4_authorization_verified: ring4Auth?.ring4_authorized === true,
    execution_status: targetBlocked ? BLOCKED_STATUS : "EXECUTED",
    scale_target_verified: assessment.scale_target_verified,
    target_classification: assessment.target_classification,
    commands,
    core_passed: corePassed,
    ring4_scripts_passed:
      !targetBlocked && Object.values(ring4Results).every((r) => r.exit_code === 0),
    all_passed: false,
    qa_green_real_created: false,
    activation_allowed_general_production: false,
    production_supabase_touched: false,
    unknown_remote_touched: false,
    missing_target_inputs: assessment.missing_inputs,
  };
  writeFileSync(RING4_ARTIFACT_PATHS.commandResults, `${JSON.stringify(commandResults, null, 2)}\n`);

  const noGoRun = targetBlocked
    ? { exit_code: BLOCKED_EXIT_CODE, status: "blocked" }
    : runNodeScript("scripts/eve/production-activation/ring4-no-go-check.mjs", featureFlags);
  commands.ring4_no_go_final = noGoRun;

  const targetReport = readJsonIfExists(RING4_ARTIFACT_PATHS.scaleTargetReport);
  const scope = readJsonIfExists(RING4_ARTIFACT_PATHS.scaleExecutionScope);
  const mba = readJsonIfExists(RING4_ARTIFACT_PATHS.mbaConformance);
  const structural = readJsonIfExists(RING4_ARTIFACT_PATHS.structuralCoverage);
  const clientUi = readJsonIfExists(RING4_ARTIFACT_PATHS.clientUiFlow);
  const bffFlow = readJsonIfExists(RING4_ARTIFACT_PATHS.bffRuntimeFlow);
  const observability = readJsonIfExists(RING4_ARTIFACT_PATHS.observabilitySlo);
  const rollback = readJsonIfExists(RING4_ARTIFACT_PATHS.rollback);
  const abort = readJsonIfExists(RING4_ARTIFACT_PATHS.abort);
  const noGo = readJsonIfExists(RING4_ARTIFACT_PATHS.noGo);
  const gateReadiness = readJsonIfExists(RING4_ARTIFACT_PATHS.gateReadiness);
  const clientSafe = readJsonIfExists(RING4_ARTIFACT_PATHS.clientSafeResult);
  const consultant = readJsonIfExists(RING4_ARTIFACT_PATHS.consultantPacket);
  const parallel = readJsonIfExists(RING4_ARTIFACT_PATHS.parallelPayload);
  const incidentResponse = readJsonIfExists(RING4_ARTIFACT_PATHS.incidentResponse);
  const allowlist = readJsonIfExists(RING4_ARTIFACT_PATHS.trafficTenantCaseAllowlist);
  const inventory = readJsonIfExists(RING4_ARTIFACT_PATHS.runtimeRecordInventory);

  commandResults.all_passed = corePassed && !targetBlocked && noGo?.no_go_ring4_clean === true;
  writeFileSync(RING4_ARTIFACT_PATHS.commandResults, `${JSON.stringify({ ...commandResults, commands }, null, 2)}\n`);

  const boundaryLedger = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING4_BOUNDARY_LEDGER",
    generated_at: new Date().toISOString(),
    ring4_authorized: ring4Auth?.ring4_authorized === true,
    ring4_scope: "expanded_production_scale_governance",
    target_classification: assessment.target_classification,
    execution_status: targetBlocked ? BLOCKED_STATUS : commandResults.all_passed ? "COMPLETED" : "BLOCKED",
    production_supabase_touched: false,
    unknown_remote_touched: false,
    remote_modified: false,
    sql_executed_against_uncontrolled_production: false,
    runtime_real_broad_production_started: false,
    gates_real_broad_production_executed: false,
    diagnosis_created: false,
    export_real_created: false,
    produccion_paralela_productiva_started: false,
    production_public_access_enabled: false,
    broad_production_access_enabled: false,
    qa_green_real_created: false,
    activation_allowed_general_production: false,
    scale_target_verified: assessment.scale_target_verified,
    scale_execution_scope_created: scope?.scope_closed === true,
    supervisor_assigned: assessment.supervisor_assigned,
    rollback_documented: assessment.rollback_documented,
    abort_documented: assessment.abort_documented,
    observability_required: assessment.observability_required,
  };
  writeFileSync(RING4_ARTIFACT_PATHS.boundary, `${JSON.stringify(boundaryLedger, null, 2)}\n`);

  const ring4_execution_completed =
    !targetBlocked &&
    commandResults.all_passed &&
    noGoRun.exit_code === 0 &&
    mba?.mba_conformance_passed === true &&
    structural?.structural_framework_coverage_passed === true &&
    assessment.scale_target_verified === true &&
    scope?.scope_closed === true &&
    clientUi?.client_ui_flow_passed === true &&
    bffFlow?.bff_runtime_flow_passed === true &&
    inventory?.runtime_records_created_expanded_target === true &&
    gateReadiness?.gates_readiness_passed === true &&
    clientSafe?.client_safe_result_passed === true &&
    consultant?.consultant_packet_supervised === true &&
    parallel?.parallel_payload_controlled_rehearsal_passed === true &&
    observability?.observability_slo_passed === true &&
    incidentResponse?.incident_response_passed === true &&
    allowlist?.allowlist_created === true &&
    rollback?.rollback_drill_passed === true &&
    abort?.abort_drill_passed === true &&
    noGo?.no_go_ring4_clean === true;

  const finalActivationReadiness = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING4_FINAL_ACTIVATION_READINESS",
    generated_at: new Date().toISOString(),
    ring4_execution_completed,
    execution_status: targetBlocked ? BLOCKED_STATUS : ring4_execution_completed ? "COMPLETED" : "BLOCKED",
    ready_for_ring5_authorization: ring4_execution_completed,
    ready_for_production_public_activation: false,
    next_authorization_required: true,
    next_tree_point: "Ring 4 authorization — expanded production, scale governance, only after Ring 4 accepted",
    activation_allowed_general_production: false,
    qa_green_real_created: false,
    missing_target_inputs: assessment.missing_inputs,
  };
  writeFileSync(RING4_ARTIFACT_PATHS.finalActivationReadiness, `${JSON.stringify(finalActivationReadiness, null, 2)}\n`);

  const scaleDecisionCandidate = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING4_SCALE_DECISION_CANDIDATE",
    generated_at: new Date().toISOString(),
    ring4_scope: "expanded_production_scale_governance",
    target_classification: assessment.target_classification,
    current_traffic_percentage: allowlist?.traffic_ramp?.traffic_percentage ?? scope?.initial_traffic_percentage ?? 5,
    automatic_scale_up_allowed: false,
    scale_up_requires_human_authorization: true,
    scale_up_requires_no_go_clean: noGo?.no_go_ring4_clean === true,
    scale_up_requires_observability_green: observability?.observability_green === true,
    scale_up_requires_incident_response_ready: incidentResponse?.incident_response_passed === true,
    candidate_next_phase: "incremental_ramp",
    candidate_status: ring4_execution_completed ? "eligible_for_human_authorization" : "blocked_pending_ring4_completion",
    activation_allowed_general_production: false,
  };
  writeFileSync(RING4_ARTIFACT_PATHS.scaleDecisionCandidate, `${JSON.stringify(scaleDecisionCandidate, null, 2)}\n`);

  const traceability = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING4_EXPANDED_PRODUCTION_EXECUTION_TRACEABILITY",
    generated_at: new Date().toISOString(),
    ring4_scope: "expanded_production_scale_governance",
    authorization_ref: ring4Auth?.authorization_ref ?? null,
    ring4_authorization_referenced: ring4Auth?.ring4_authorized === true,
    execution_status: targetBlocked ? BLOCKED_STATUS : ring4_execution_completed ? "COMPLETED" : "BLOCKED",
    target_classification: assessment.target_classification,
    scale_target_verified: assessment.scale_target_verified,
    scale_execution_scope_created: scope?.scope_closed === true,
    supervisor_assigned: assessment.supervisor_assigned,
    mba_conformance_passed: mba?.mba_conformance_passed ?? false,
    structural_framework_coverage_passed: structural?.structural_framework_coverage_passed ?? false,
    client_ui_flow_passed: clientUi?.client_ui_flow_passed ?? false,
    bff_runtime_flow_passed: bffFlow?.bff_runtime_flow_passed ?? false,
    gates_readiness_passed: gateReadiness?.gates_readiness_passed ?? false,
    client_safe_result_passed: clientSafe?.client_safe_result_passed ?? false,
    consultant_packet_supervised: consultant?.consultant_packet_supervised ?? false,
    parallel_payload_controlled_rehearsal_passed: parallel?.parallel_payload_controlled_rehearsal_passed ?? false,
    observability_passed: observability?.observability_passed ?? false,
    rollback_drill_passed: rollback?.rollback_drill_passed ?? false,
    abort_drill_passed: abort?.abort_drill_passed ?? false,
    no_go_ring4_clean: noGo?.no_go_ring4_clean ?? false,
    ring4_execution_completed,
    production_public_access_enabled: false,
    activation_allowed_general_production: false,
    unknown_remote_touched: false,
    missing_target_inputs: assessment.missing_inputs,
    artifacts: Object.fromEntries(
      Object.entries(RING4_ARTIFACT_PATHS).map(([k, v]) => [
        k,
        v.replace(repoRoot + "\\", "").replace(repoRoot + "/", ""),
      ]),
    ),
  };
  writeFileSync(RING4_ARTIFACT_PATHS.traceability, `${JSON.stringify(traceability, null, 2)}\n`);

  const dictamenLabel = targetBlocked
    ? "EVE_PRODUCTION_ACTIVATION_RING4_EXPANDED_PRODUCTION_SCALE_GOVERNANCE_EXECUTION_BLOCKED_PENDING_RING4_SCALE_TARGET"
    : ring4_execution_completed
      ? "EVE_PRODUCTION_ACTIVATION_RING4_EXPANDED_PRODUCTION_SCALE_GOVERNANCE_EXECUTION_COMPLETED"
      : "EVE_PRODUCTION_ACTIVATION_RING4_EXPANDED_PRODUCTION_SCALE_GOVERNANCE_EXECUTION_BLOCKED";

  const closeout = `# Ring 4 Expanded Production Scale Governance — Closeout

## Dictamen

${dictamenLabel}

## Scope

- Ring 4 authorized: true
- Scope: expanded_production_scale_governance
- Target classification: ${assessment.target_classification}
- Controlled target verified: ${assessment.scale_target_verified}
- Expanded production scope created: ${scope?.scope_closed === true}
- Supervisor assigned: ${assessment.supervisor_assigned}
- Production public access: false
- Broad production access: false

## Missing Target Inputs

${assessment.missing_inputs.length ? assessment.missing_inputs.map((m) => `- ${m}`).join("\n") : "- none"}

## Execution Summary

| Step | Status |
| --- | --- |
| Ring 4 authorization | ${ring4Auth?.ring4_authorized ? "verified" : "failed"} |
| Controlled target | ${targetBlocked ? "BLOCKED_PENDING_RING4_SCALE_TARGET" : "verified"} |
| MBA conformance | ${mba?.mba_conformance_passed ? "passed" : targetBlocked ? "blocked" : "failed"} |
| Structural framework coverage | ${structural?.structural_framework_coverage_passed ? "passed" : targetBlocked ? "blocked" : "failed"} |
| Expanded production scope | ${scope?.scope_closed ? "passed" : "blocked"} |
| Client UI flow | ${clientUi?.client_ui_flow_passed ? "passed" : "blocked"} |
| BFF/Runtime flow | ${bffFlow?.bff_runtime_flow_passed ? "passed" : "blocked"} |
| Gates/readiness | ${gateReadiness?.gates_readiness_passed ? "passed" : "blocked"} |
| Client safe result | ${clientSafe?.client_safe_result_passed ? "passed" : "blocked"} |
| Consultant packet supervised | ${consultant?.consultant_packet_supervised ? "passed" : "blocked"} |
| Parallel payload controlled/rehearsal | ${parallel?.parallel_payload_controlled_rehearsal_passed ? "passed" : "blocked"} |
| Observability | ${observability?.observability_passed ? "passed" : "blocked"} |
| Rollback drill | ${rollback?.rollback_drill_passed ? "passed" : "blocked"} |
| Abort drill | ${abort?.abort_drill_passed ? "passed" : "blocked"} |
| No-Go Ring 4 | ${noGo?.no_go_ring4_clean ? "clean" : "blocked"} |

## Boundary

- Production Supabase touched: false
- Unknown remote touched: false
- activation_allowed_general_production: false
- qa_green_real_created: false

## Next Step

${targetBlocked ? "Verify expanded production target classification and policies before re-running Ring 4 execution." : "Ring 4 authorization required — expanded production, scale governance."}
`;
  writeFileSync(RING4_ARTIFACT_PATHS.closeout, closeout);

  if (ring4Auth?.ring4_execution_not_started !== false) {
    const executionReadiness = readJsonIfExists(
      join(repoRoot, "docs/production-activation/ring4_execution_readiness.json"),
    );
    if (executionReadiness) {
      writeFileSync(
        join(repoRoot, "docs/production-activation/ring4_execution_readiness.json"),
        `${JSON.stringify(
          {
            ...executionReadiness,
            ring4_execution_started: true,
            updated_at: new Date().toISOString(),
            execution_status: targetBlocked ? BLOCKED_STATUS : ring4_execution_completed ? "COMPLETED" : "BLOCKED",
          },
          null,
          2,
        )}\n`,
      );
    }
  }

  console.log(JSON.stringify({ ring4_execution_completed, targetBlocked, traceability }, null, 2));
  if (targetBlocked) process.exit(BLOCKED_EXIT_CODE);
  if (!ring4_execution_completed) process.exit(1);
}

main();
