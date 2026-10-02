#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  BLOCKED_EXIT_CODE,
  RING3_ARTIFACT_PATHS,
  repoRoot,
} from "./ring3-artifact-paths.mjs";
import {
  assessControlledTarget,
  BLOCKED_STATUS,
  resolveFeatureFlags,
} from "./ring3-controlled-target-lib.mjs";
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

const RING3_SCRIPTS = [
  "scripts/eve/production-activation/ring3-validate-controlled-target.mjs",
  "scripts/eve/production-activation/ring3-create-controlled-production-scope.mjs",
  "scripts/eve/production-activation/ring3-validate-mba-conformance.mjs",
  "scripts/eve/production-activation/ring3-validate-structural-framework-coverage.mjs",
  "scripts/eve/production-activation/ring3-run-client-ui-flow.mjs",
  "scripts/eve/production-activation/ring3-run-bff-runtime-flow.mjs",
  "scripts/eve/production-activation/ring3-run-gates-readiness.mjs",
  "scripts/eve/production-activation/ring3-run-client-safe-result.mjs",
  "scripts/eve/production-activation/ring3-run-consultant-packet.mjs",
  "scripts/eve/production-activation/ring3-run-parallel-payload.mjs",
  "scripts/eve/production-activation/ring3-run-observability-check.mjs",
  "scripts/eve/production-activation/ring3-run-rollback-drill.mjs",
  "scripts/eve/production-activation/ring3-run-abort-drill.mjs",
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
  const ring3Auth = readJsonIfExists(join(repoRoot, "docs/production-activation/ring3_authorization_record.json"));
  if (ring3Auth?.ring3_authorized !== true) {
    console.error("Ring 3 authorization not verified");
    process.exit(1);
  }

  const assessment = assessControlledTarget();
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
  commands.validate_p5 = run("npm", ["run", "validate:p5"]);
  commands.validate_p6 = run("npm", ["run", "validate:p6"]);
  commands.validate_p7 = run("npm", ["run", "validate:p7"]);
  commands.validate_p8 = run("npm", ["run", "validate:p8"]);

  const ring3Results = {};
  if (!targetBlocked) {
    for (const script of RING3_SCRIPTS) {
      const key = script.split("/").pop()?.replace(".mjs", "") ?? script;
      ring3Results[key] = runNodeScript(script, featureFlags);
    }
  }
  commands.ring3_scripts = ring3Results;

  const corePassed =
    commands.typecheck.exit_code === 0 &&
    commands.build_webpack.exit_code === 0 &&
    allModulePassed &&
    commands.validate_ring0.exit_code === 0 &&
    commands.validate_ring1.exit_code === 0 &&
    commands.validate_ring2.exit_code === 0 &&
    commands.validate_p5.exit_code === 0 &&
    commands.validate_p6.exit_code === 0 &&
    commands.validate_p7.exit_code === 0 &&
    commands.validate_p8.exit_code === 0;

  const commandResults = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING3_COMMAND_RESULTS",
    generated_at: new Date().toISOString(),
    project_root: repoRoot,
    ring3_scope: "controlled_production_supervised_rollback_ready",
    ring3_authorization_verified: ring3Auth?.ring3_authorized === true,
    execution_status: targetBlocked ? BLOCKED_STATUS : "EXECUTED",
    controlled_target_verified: assessment.controlled_target_verified,
    target_classification: assessment.target_classification,
    commands,
    core_passed: corePassed,
    ring3_scripts_passed:
      !targetBlocked && Object.values(ring3Results).every((r) => r.exit_code === 0),
    all_passed: false,
    qa_green_real_created: false,
    activation_allowed_general_production: false,
    production_supabase_touched: false,
    unknown_remote_touched: false,
    missing_target_inputs: assessment.missing_inputs,
  };
  writeFileSync(RING3_ARTIFACT_PATHS.commandResults, `${JSON.stringify(commandResults, null, 2)}\n`);

  const noGoRun = targetBlocked
    ? { exit_code: BLOCKED_EXIT_CODE, status: "blocked" }
    : runNodeScript("scripts/eve/production-activation/ring3-no-go-check.mjs", featureFlags);
  commands.ring3_no_go_final = noGoRun;

  const targetReport = readJsonIfExists(RING3_ARTIFACT_PATHS.targetReport);
  const scope = readJsonIfExists(RING3_ARTIFACT_PATHS.scopeManifest);
  const mba = readJsonIfExists(RING3_ARTIFACT_PATHS.mbaConformance);
  const structural = readJsonIfExists(RING3_ARTIFACT_PATHS.structuralCoverage);
  const clientUi = readJsonIfExists(RING3_ARTIFACT_PATHS.clientUiFlow);
  const bffFlow = readJsonIfExists(RING3_ARTIFACT_PATHS.bffRuntimeFlow);
  const observability = readJsonIfExists(RING3_ARTIFACT_PATHS.observability);
  const rollback = readJsonIfExists(RING3_ARTIFACT_PATHS.rollback);
  const abort = readJsonIfExists(RING3_ARTIFACT_PATHS.abort);
  const noGo = readJsonIfExists(RING3_ARTIFACT_PATHS.noGo);
  const gateReadiness = readJsonIfExists(RING3_ARTIFACT_PATHS.gateReadiness);
  const clientSafe = readJsonIfExists(RING3_ARTIFACT_PATHS.clientSafeResult);
  const consultant = readJsonIfExists(RING3_ARTIFACT_PATHS.consultantPacket);
  const parallel = readJsonIfExists(RING3_ARTIFACT_PATHS.parallelPayload);
  const inventory = readJsonIfExists(RING3_ARTIFACT_PATHS.runtimeRecordInventory);

  commandResults.all_passed = corePassed && !targetBlocked && noGo?.no_go_ring3_clean === true;
  writeFileSync(RING3_ARTIFACT_PATHS.commandResults, `${JSON.stringify({ ...commandResults, commands }, null, 2)}\n`);

  const boundaryLedger = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING3_BOUNDARY_LEDGER",
    generated_at: new Date().toISOString(),
    ring3_authorized: ring3Auth?.ring3_authorized === true,
    ring3_scope: "controlled_production_supervised_rollback_ready",
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
    controlled_target_verified: assessment.controlled_target_verified,
    controlled_production_scope_created: scope?.scope_closed === true,
    supervisor_assigned: assessment.supervisor_assigned,
    rollback_documented: assessment.rollback_documented,
    abort_documented: assessment.abort_documented,
    observability_required: assessment.observability_required,
  };
  writeFileSync(RING3_ARTIFACT_PATHS.boundary, `${JSON.stringify(boundaryLedger, null, 2)}\n`);

  const ring3_execution_completed =
    !targetBlocked &&
    commandResults.all_passed &&
    noGoRun.exit_code === 0 &&
    mba?.mba_conformance_passed === true &&
    structural?.structural_framework_coverage_passed === true &&
    assessment.controlled_target_verified === true &&
    scope?.scope_closed === true &&
    clientUi?.client_ui_flow_passed === true &&
    bffFlow?.bff_runtime_flow_passed === true &&
    inventory?.runtime_records_created_controlled_target === true &&
    gateReadiness?.gates_readiness_passed === true &&
    clientSafe?.client_safe_result_passed === true &&
    consultant?.consultant_packet_supervised === true &&
    parallel?.parallel_payload_controlled_rehearsal_passed === true &&
    observability?.observability_passed === true &&
    rollback?.rollback_drill_passed === true &&
    abort?.abort_drill_passed === true &&
    noGo?.no_go_ring3_clean === true;

  const nextRingReadiness = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING3_NEXT_RING_READINESS",
    generated_at: new Date().toISOString(),
    ring3_execution_completed,
    execution_status: targetBlocked ? BLOCKED_STATUS : ring3_execution_completed ? "COMPLETED" : "BLOCKED",
    ready_for_ring4_authorization: ring3_execution_completed,
    ready_for_production_public_activation: false,
    next_authorization_required: true,
    next_tree_point: "Ring 4 authorization — expanded production, scale governance, only after Ring 3 accepted",
    activation_allowed_general_production: false,
    qa_green_real_created: false,
    missing_target_inputs: assessment.missing_inputs,
  };
  writeFileSync(RING3_ARTIFACT_PATHS.nextRingReadiness, `${JSON.stringify(nextRingReadiness, null, 2)}\n`);

  const traceability = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING3_CONTROLLED_PRODUCTION_EXECUTION_TRACEABILITY",
    generated_at: new Date().toISOString(),
    ring3_scope: "controlled_production_supervised_rollback_ready",
    authorization_ref: ring3Auth?.authorization_ref ?? null,
    ring3_authorization_referenced: ring3Auth?.ring3_authorized === true,
    execution_status: targetBlocked ? BLOCKED_STATUS : ring3_execution_completed ? "COMPLETED" : "BLOCKED",
    target_classification: assessment.target_classification,
    controlled_target_verified: assessment.controlled_target_verified,
    controlled_production_scope_created: scope?.scope_closed === true,
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
    no_go_ring3_clean: noGo?.no_go_ring3_clean ?? false,
    ring3_execution_completed,
    production_public_access_enabled: false,
    activation_allowed_general_production: false,
    unknown_remote_touched: false,
    missing_target_inputs: assessment.missing_inputs,
    artifacts: Object.fromEntries(
      Object.entries(RING3_ARTIFACT_PATHS).map(([k, v]) => [
        k,
        v.replace(repoRoot + "\\", "").replace(repoRoot + "/", ""),
      ]),
    ),
  };
  writeFileSync(RING3_ARTIFACT_PATHS.traceability, `${JSON.stringify(traceability, null, 2)}\n`);

  const dictamenLabel = targetBlocked
    ? "EVE_PRODUCTION_ACTIVATION_RING3_CONTROLLED_PRODUCTION_SUPERVISED_ROLLBACK_READY_EXECUTION_BLOCKED_PENDING_CONTROLLED_PRODUCTION_TARGET"
    : ring3_execution_completed
      ? "EVE_PRODUCTION_ACTIVATION_RING3_CONTROLLED_PRODUCTION_SUPERVISED_ROLLBACK_READY_EXECUTION_COMPLETED"
      : "EVE_PRODUCTION_ACTIVATION_RING3_CONTROLLED_PRODUCTION_SUPERVISED_ROLLBACK_READY_EXECUTION_BLOCKED";

  const closeout = `# Ring 3 Controlled Production Supervised Rollback-Ready — Closeout

## Dictamen

${dictamenLabel}

## Scope

- Ring 3 authorized: true
- Scope: controlled_production_supervised_rollback_ready
- Target classification: ${assessment.target_classification}
- Controlled target verified: ${assessment.controlled_target_verified}
- Controlled production scope created: ${scope?.scope_closed === true}
- Supervisor assigned: ${assessment.supervisor_assigned}
- Production public access: false
- Broad production access: false

## Missing Target Inputs

${assessment.missing_inputs.length ? assessment.missing_inputs.map((m) => `- ${m}`).join("\n") : "- none"}

## Execution Summary

| Step | Status |
| --- | --- |
| Ring 3 authorization | ${ring3Auth?.ring3_authorized ? "verified" : "failed"} |
| Controlled target | ${targetBlocked ? "BLOCKED_PENDING_CONTROLLED_PRODUCTION_TARGET" : "verified"} |
| MBA conformance | ${mba?.mba_conformance_passed ? "passed" : targetBlocked ? "blocked" : "failed"} |
| Structural framework coverage | ${structural?.structural_framework_coverage_passed ? "passed" : targetBlocked ? "blocked" : "failed"} |
| Controlled production scope | ${scope?.scope_closed ? "passed" : "blocked"} |
| Client UI flow | ${clientUi?.client_ui_flow_passed ? "passed" : "blocked"} |
| BFF/Runtime flow | ${bffFlow?.bff_runtime_flow_passed ? "passed" : "blocked"} |
| Gates/readiness | ${gateReadiness?.gates_readiness_passed ? "passed" : "blocked"} |
| Client safe result | ${clientSafe?.client_safe_result_passed ? "passed" : "blocked"} |
| Consultant packet supervised | ${consultant?.consultant_packet_supervised ? "passed" : "blocked"} |
| Parallel payload controlled/rehearsal | ${parallel?.parallel_payload_controlled_rehearsal_passed ? "passed" : "blocked"} |
| Observability | ${observability?.observability_passed ? "passed" : "blocked"} |
| Rollback drill | ${rollback?.rollback_drill_passed ? "passed" : "blocked"} |
| Abort drill | ${abort?.abort_drill_passed ? "passed" : "blocked"} |
| No-Go Ring 3 | ${noGo?.no_go_ring3_clean ? "clean" : "blocked"} |

## Boundary

- Production Supabase touched: false
- Unknown remote touched: false
- activation_allowed_general_production: false
- qa_green_real_created: false

## Next Step

${targetBlocked ? "Verify controlled production target classification and policies before re-running Ring 3 execution." : "Ring 4 authorization required — expanded production, scale governance."}
`;
  writeFileSync(RING3_ARTIFACT_PATHS.closeout, closeout);

  if (ring3Auth?.ring3_execution_not_started !== false) {
    const executionReadiness = readJsonIfExists(
      join(repoRoot, "docs/production-activation/ring3_execution_readiness.json"),
    );
    if (executionReadiness) {
      writeFileSync(
        join(repoRoot, "docs/production-activation/ring3_execution_readiness.json"),
        `${JSON.stringify(
          {
            ...executionReadiness,
            ring3_execution_started: true,
            updated_at: new Date().toISOString(),
            execution_status: targetBlocked ? BLOCKED_STATUS : ring3_execution_completed ? "COMPLETED" : "BLOCKED",
          },
          null,
          2,
        )}\n`,
      );
    }
  }

  console.log(JSON.stringify({ ring3_execution_completed, targetBlocked, traceability }, null, 2));
  if (targetBlocked) process.exit(BLOCKED_EXIT_CODE);
  if (!ring3_execution_completed) process.exit(1);
}

main();
