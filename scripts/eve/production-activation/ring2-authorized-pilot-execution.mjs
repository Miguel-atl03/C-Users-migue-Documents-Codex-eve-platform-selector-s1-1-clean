#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  BLOCKED_EXIT_CODE,
  RING2_ARTIFACT_PATHS,
  RING2_FEATURE_FLAGS,
  repoRoot,
} from "./ring2-artifact-paths.mjs";
import { assessPilotReadiness, BLOCKED_STATUS } from "./ring2-pilot-readiness-lib.mjs";
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

const RING2_SCRIPTS = [
  "scripts/eve/production-activation/ring2-validate-pilot-readiness.mjs",
  "scripts/eve/production-activation/ring2-validate-mba-conformance.mjs",
  "scripts/eve/production-activation/ring2-validate-structural-framework-coverage.mjs",
  "scripts/eve/production-activation/ring2-create-pilot-scope.mjs",
  "scripts/eve/production-activation/ring2-run-client-ui-flow.mjs",
  "scripts/eve/production-activation/ring2-run-bff-runtime-flow.mjs",
  "scripts/eve/production-activation/ring2-run-gates-readiness.mjs",
  "scripts/eve/production-activation/ring2-run-client-safe-result.mjs",
  "scripts/eve/production-activation/ring2-run-consultant-packet.mjs",
  "scripts/eve/production-activation/ring2-run-parallel-payload.mjs",
  "scripts/eve/production-activation/ring2-run-observability-check.mjs",
  "scripts/eve/production-activation/ring2-run-rollback-drill.mjs",
  "scripts/eve/production-activation/ring2-run-abort-drill.mjs",
];

function run(command, args = [], options = {}) {
  const started = Date.now();
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    shell: true,
    env: { ...process.env, ...RING2_FEATURE_FLAGS, ...options.env },
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

function runNodeScript(scriptPath) {
  return run("node", [scriptPath]);
}

function main() {
  const ring2Auth = readJsonIfExists(join(repoRoot, "docs/production-activation/ring2_authorization_record.json"));
  if (ring2Auth?.ring2_authorized !== true) {
    console.error("Ring 2 authorization not verified");
    process.exit(1);
  }

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
  commands.validate_p5 = run("npm", ["run", "validate:p5"]);
  commands.validate_p6 = run("npm", ["run", "validate:p6"]);
  commands.validate_p7 = run("npm", ["run", "validate:p7"]);
  commands.validate_p8 = run("npm", ["run", "validate:p8"]);

  const ring2Results = {};
  for (const script of RING2_SCRIPTS) {
    const key = script.split("/").pop()?.replace(".mjs", "") ?? script;
    ring2Results[key] = runNodeScript(script);
  }
  commands.ring2_scripts = ring2Results;

  const corePassed =
    commands.typecheck.exit_code === 0 &&
    commands.build_webpack.exit_code === 0 &&
    allModulePassed &&
    commands.validate_ring0.exit_code === 0 &&
    commands.validate_ring1.exit_code === 0 &&
    commands.validate_p5.exit_code === 0 &&
    commands.validate_p6.exit_code === 0 &&
    commands.validate_p7.exit_code === 0 &&
    commands.validate_p8.exit_code === 0;

  const readiness = assessPilotReadiness();
  const pilotBlocked = !readiness.ready_for_execution;

  const commandResults = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING2_COMMAND_RESULTS",
    generated_at: new Date().toISOString(),
    project_root: repoRoot,
    ring2_scope: "authorized_pilot_client_scoped_supervised",
    ring2_authorization_verified: ring2Auth?.ring2_authorized === true,
    execution_status: pilotBlocked ? BLOCKED_STATUS : "EXECUTED",
    pilot_readiness_verified: readiness.pilot_readiness_verified,
    commands,
    core_passed: corePassed,
    ring2_scripts_passed: !pilotBlocked && Object.values(ring2Results).every((r) => r.exit_code === 0),
    all_passed: false,
    qa_green_real_created: false,
    activation_allowed_general_production: false,
    production_supabase_touched: false,
    missing_pilot_inputs: readiness.missing_inputs,
  };
  writeFileSync(RING2_ARTIFACT_PATHS.commandResults, `${JSON.stringify(commandResults, null, 2)}\n`);

  const noGoRun = runNodeScript("scripts/eve/production-activation/ring2-no-go-check.mjs");
  commands.ring2_no_go_final = noGoRun;

  const pilotReadiness = readJsonIfExists(RING2_ARTIFACT_PATHS.pilotReadiness);
  const mba = readJsonIfExists(RING2_ARTIFACT_PATHS.mbaConformance);
  const structural = readJsonIfExists(RING2_ARTIFACT_PATHS.structuralCoverage);
  const pilotScope = readJsonIfExists(RING2_ARTIFACT_PATHS.pilotScopeManifest);
  const clientUi = readJsonIfExists(RING2_ARTIFACT_PATHS.clientUiFlow);
  const bffFlow = readJsonIfExists(RING2_ARTIFACT_PATHS.bffRuntimeFlow);
  const observability = readJsonIfExists(RING2_ARTIFACT_PATHS.observability);
  const rollback = readJsonIfExists(RING2_ARTIFACT_PATHS.rollback);
  const abort = readJsonIfExists(RING2_ARTIFACT_PATHS.abort);
  const noGo = readJsonIfExists(RING2_ARTIFACT_PATHS.noGo);
  const gateReadiness = readJsonIfExists(RING2_ARTIFACT_PATHS.gateReadiness);
  const clientSafe = readJsonIfExists(RING2_ARTIFACT_PATHS.clientSafeResult);
  const consultant = readJsonIfExists(RING2_ARTIFACT_PATHS.consultantPacket);
  const parallel = readJsonIfExists(RING2_ARTIFACT_PATHS.parallelPayload);
  const inventory = readJsonIfExists(RING2_ARTIFACT_PATHS.runtimeRecordInventory);

  commandResults.all_passed = corePassed && !pilotBlocked && noGo?.no_go_ring2_clean === true;
  writeFileSync(RING2_ARTIFACT_PATHS.commandResults, `${JSON.stringify({ ...commandResults, commands }, null, 2)}\n`);

  const boundaryLedger = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING2_BOUNDARY_LEDGER",
    generated_at: new Date().toISOString(),
    ring2_authorized: ring2Auth?.ring2_authorized === true,
    ring2_scope: "authorized_pilot_client_scoped_supervised",
    execution_status: pilotBlocked ? BLOCKED_STATUS : commandResults.all_passed ? "COMPLETED" : "BLOCKED",
    production_supabase_touched: false,
    remote_modified: false,
    sql_executed_against_production: false,
    runtime_real_production_started: false,
    gates_real_executed_in_production: false,
    diagnosis_created: false,
    export_real_created: false,
    produccion_paralela_productiva_started: false,
    production_public_access_enabled: false,
    real_external_client_data_authorized_and_scoped: readiness.real_external_client_data_authorized_and_scoped,
    pilot_data_invented: false,
    qa_green_real_created: false,
    activation_allowed_general_production: false,
    pilot_readiness_verified: readiness.pilot_readiness_verified,
    pilot_consent_verified: readiness.pilot_consent_verified,
    supervisor_assigned: readiness.supervisor_assigned,
    pilot_scope_created: readiness.pilot_scope_created,
  };
  writeFileSync(RING2_ARTIFACT_PATHS.boundary, `${JSON.stringify(boundaryLedger, null, 2)}\n`);

  const ring2_execution_completed =
    !pilotBlocked &&
    commandResults.all_passed &&
    noGoRun.exit_code === 0 &&
    mba?.mba_conformance_passed === true &&
    structural?.structural_framework_coverage_passed === true &&
    readiness.pilot_readiness_verified === true &&
    readiness.pilot_consent_verified === true &&
    readiness.supervisor_assigned === true &&
    readiness.pilot_scope_created === true &&
    clientUi?.client_ui_flow_passed === true &&
    bffFlow?.bff_runtime_flow_passed === true &&
    inventory?.runtime_records_created_safe_target === true &&
    gateReadiness?.gates_readiness_passed === true &&
    clientSafe?.client_safe_result_passed === true &&
    consultant?.consultant_packet_supervised === true &&
    parallel?.parallel_payload_local_rehearsal_passed === true &&
    observability?.observability_passed === true &&
    rollback?.rollback_drill_passed === true &&
    abort?.abort_drill_passed === true &&
    noGo?.no_go_ring2_clean === true;

  const nextRingReadiness = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING2_NEXT_RING_READINESS",
    generated_at: new Date().toISOString(),
    ring2_execution_completed,
    execution_status: pilotBlocked ? BLOCKED_STATUS : ring2_execution_completed ? "COMPLETED" : "BLOCKED",
    ready_for_ring3_authorization: ring2_execution_completed,
    ready_for_production_public_activation: false,
    next_authorization_required: true,
    next_tree_point: "Ring 3 authorization — controlled production, supervised, rollback-ready",
    activation_allowed_general_production: false,
    qa_green_real_created: false,
    missing_pilot_inputs: readiness.missing_inputs,
  };
  writeFileSync(RING2_ARTIFACT_PATHS.nextRingReadiness, `${JSON.stringify(nextRingReadiness, null, 2)}\n`);

  const traceability = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING2_AUTHORIZED_PILOT_EXECUTION_TRACEABILITY",
    generated_at: new Date().toISOString(),
    ring2_scope: "authorized_pilot_client_scoped_supervised",
    authorization_ref: ring2Auth?.authorization_ref ?? null,
    ring2_authorization_referenced: ring2Auth?.ring2_authorized === true,
    execution_status: pilotBlocked ? BLOCKED_STATUS : ring2_execution_completed ? "COMPLETED" : "BLOCKED",
    pilot_readiness_verified: readiness.pilot_readiness_verified,
    pilot_consent_verified: readiness.pilot_consent_verified,
    supervisor_assigned: readiness.supervisor_assigned,
    pilot_scope_created: readiness.pilot_scope_created,
    mba_conformance_passed: mba?.mba_conformance_passed ?? false,
    structural_framework_coverage_passed: structural?.structural_framework_coverage_passed ?? false,
    client_ui_flow_passed: clientUi?.client_ui_flow_passed ?? false,
    bff_runtime_flow_passed: bffFlow?.bff_runtime_flow_passed ?? false,
    gates_readiness_passed: gateReadiness?.gates_readiness_passed ?? false,
    client_safe_result_passed: clientSafe?.client_safe_result_passed ?? false,
    consultant_packet_supervised: consultant?.consultant_packet_supervised ?? false,
    parallel_payload_local_rehearsal_passed: parallel?.parallel_payload_local_rehearsal_passed ?? false,
    observability_passed: observability?.observability_passed ?? false,
    rollback_drill_passed: rollback?.rollback_drill_passed ?? false,
    abort_drill_passed: abort?.abort_drill_passed ?? false,
    no_go_ring2_clean: noGo?.no_go_ring2_clean ?? false,
    ring2_execution_completed,
    pilot_data_invented: false,
    production_public_access_enabled: false,
    activation_allowed_general_production: false,
    missing_pilot_inputs: readiness.missing_inputs,
    artifacts: Object.fromEntries(
      Object.entries(RING2_ARTIFACT_PATHS).map(([k, v]) => [
        k,
        v.replace(repoRoot + "\\", "").replace(repoRoot + "/", ""),
      ]),
    ),
  };
  writeFileSync(RING2_ARTIFACT_PATHS.traceability, `${JSON.stringify(traceability, null, 2)}\n`);

  const dictamenLabel = pilotBlocked
    ? "EVE_PRODUCTION_ACTIVATION_RING2_AUTHORIZED_PILOT_CLIENT_SCOPED_SUPERVISED_EXECUTION_BLOCKED_PENDING_PILOT_INPUT"
    : ring2_execution_completed
      ? "EVE_PRODUCTION_ACTIVATION_RING2_AUTHORIZED_PILOT_CLIENT_SCOPED_SUPERVISED_EXECUTION_COMPLETED"
      : "EVE_PRODUCTION_ACTIVATION_RING2_AUTHORIZED_PILOT_CLIENT_SCOPED_SUPERVISED_EXECUTION_BLOCKED";

  const closeout = `# Ring 2 Authorized Pilot Client Scoped Supervised — Closeout

## Dictamen

${dictamenLabel}

## Scope

- Ring 2 authorized: true
- Scope: authorized_pilot_client_scoped_supervised
- Pilot readiness verified: ${readiness.pilot_readiness_verified}
- Pilot consent verified: ${readiness.pilot_consent_verified}
- Supervisor assigned: ${readiness.supervisor_assigned}
- Pilot scope created: ${readiness.pilot_scope_created}
- Real external client data authorized and scoped: ${readiness.real_external_client_data_authorized_and_scoped}
- Production public access: false
- Pilot data invented: false

## Missing Pilot Inputs

${readiness.missing_inputs.length ? readiness.missing_inputs.map((m) => `- ${m}`).join("\n") : "- none"}

## Execution Summary

| Step | Status |
| --- | --- |
| Ring 2 authorization | ${ring2Auth?.ring2_authorized ? "verified" : "failed"} |
| Pilot readiness | ${pilotBlocked ? "BLOCKED_PENDING_PILOT_INPUT" : "verified"} |
| MBA conformance | ${mba?.mba_conformance_passed ? "passed" : pilotBlocked ? "blocked" : "failed"} |
| Structural framework coverage | ${structural?.structural_framework_coverage_passed ? "passed" : pilotBlocked ? "blocked" : "failed"} |
| Pilot scope | ${pilotScope?.scope_closed ? "passed" : "blocked"} |
| Client UI flow | ${clientUi?.client_ui_flow_passed ? "passed" : "blocked"} |
| BFF/Runtime flow | ${bffFlow?.bff_runtime_flow_passed ? "passed" : "blocked"} |
| Gates/readiness | ${gateReadiness?.gates_readiness_passed ? "passed" : "blocked"} |
| Client safe result | ${clientSafe?.client_safe_result_passed ? "passed" : "blocked"} |
| Consultant packet supervised | ${consultant?.consultant_packet_supervised ? "passed" : "blocked"} |
| Parallel payload local/rehearsal | ${parallel?.parallel_payload_local_rehearsal_passed ? "passed" : "blocked"} |
| Observability | ${observability?.observability_passed ? "passed" : "blocked"} |
| Rollback drill | ${rollback?.rollback_drill_passed ? "passed" : "blocked"} |
| Abort drill | ${abort?.abort_drill_passed ? "passed" : "blocked"} |
| No-Go Ring 2 | ${noGo?.no_go_ring2_clean ? "clean" : "blocked"} |

## Boundary

- Production Supabase touched: false
- activation_allowed_general_production: false
- qa_green_real_created: false

## Next Step

${pilotBlocked ? "Provide authorized pilot client manifest, consent record, and supervisor assignment before re-running Ring 2 execution." : "Ring 3 authorization required — controlled production, supervised, rollback-ready."}
`;
  writeFileSync(RING2_ARTIFACT_PATHS.closeout, closeout);

  if (ring2Auth?.ring2_execution_not_started !== false) {
    const executionReadiness = readJsonIfExists(
      join(repoRoot, "docs/production-activation/ring2_execution_readiness.json"),
    );
    if (executionReadiness) {
      writeFileSync(
        join(repoRoot, "docs/production-activation/ring2_execution_readiness.json"),
        `${JSON.stringify(
          {
            ...executionReadiness,
            ring2_execution_started: true,
            updated_at: new Date().toISOString(),
            execution_status: pilotBlocked ? BLOCKED_STATUS : ring2_execution_completed ? "COMPLETED" : "BLOCKED",
          },
          null,
          2,
        )}\n`,
      );
    }
  }

  console.log(JSON.stringify({ ring2_execution_completed, pilotBlocked, traceability }, null, 2));
  if (pilotBlocked) process.exit(BLOCKED_EXIT_CODE);
  if (!ring2_execution_completed) process.exit(1);
}

main();
