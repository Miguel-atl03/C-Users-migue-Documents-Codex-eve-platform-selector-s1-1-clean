#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import {
  RING1_ARTIFACT_PATHS,
  RING1_FEATURE_FLAGS,
  repoRoot,
} from "./ring1-artifact-paths.mjs";
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

const RING1_SCRIPTS = [
  "scripts/eve/production-activation/ring1-validate-mba-conformance.mjs",
  "scripts/eve/production-activation/ring1-validate-structural-framework-coverage.mjs",
  "scripts/eve/production-activation/ring1-create-test-tenant-fixture.mjs",
  "scripts/eve/production-activation/ring1-run-client-ui-flow.mjs",
  "scripts/eve/production-activation/ring1-run-bff-runtime-flow.mjs",
  "scripts/eve/production-activation/ring1-run-gates-readiness.mjs",
  "scripts/eve/production-activation/ring1-run-client-safe-result.mjs",
  "scripts/eve/production-activation/ring1-run-consultant-packet.mjs",
  "scripts/eve/production-activation/ring1-run-parallel-payload.mjs",
  "scripts/eve/production-activation/ring1-run-observability-check.mjs",
  "scripts/eve/production-activation/ring1-run-rollback-drill.mjs",
  "scripts/eve/production-activation/ring1-run-abort-drill.mjs",
];

function run(command, args = [], options = {}) {
  const started = Date.now();
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    shell: true,
    env: { ...process.env, ...RING1_FEATURE_FLAGS, ...options.env },
    ...options,
  });
  return {
    command: [command, ...args].join(" "),
    status: result.status === 0 ? "passed" : "failed",
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
  const ring1Auth = readJsonIfExists(RING1_ARTIFACT_PATHS.ring1Authorization);
  if (ring1Auth?.ring1_authorized !== true) {
    console.error("Ring 1 authorization not verified");
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
  commands.validate_p5 = run("npm", ["run", "validate:p5"]);
  commands.validate_p6 = run("npm", ["run", "validate:p6"]);
  commands.validate_p7 = run("npm", ["run", "validate:p7"]);
  commands.validate_p8 = run("npm", ["run", "validate:p8"]);

  const ring1Results = {};
  for (const script of RING1_SCRIPTS) {
    const key = script.split("/").pop()?.replace(".mjs", "") ?? script;
    ring1Results[key] = runNodeScript(script);
  }
  commands.ring1_scripts = ring1Results;

  const corePassed =
    commands.typecheck.exit_code === 0 &&
    commands.build_webpack.exit_code === 0 &&
    allModulePassed &&
    commands.validate_ring0.exit_code === 0 &&
    commands.validate_p5.exit_code === 0 &&
    commands.validate_p6.exit_code === 0 &&
    commands.validate_p7.exit_code === 0 &&
    commands.validate_p8.exit_code === 0;

  const ring1ScriptsPassed = Object.values(ring1Results).every((r) => r.exit_code === 0);
  const all_passed = corePassed && ring1ScriptsPassed;

  const commandResults = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING1_COMMAND_RESULTS",
    generated_at: new Date().toISOString(),
    project_root: repoRoot,
    ring1_scope: "internal_test_tenant_limited_client",
    ring1_authorization_verified: ring1Auth?.ring1_authorized === true,
    commands,
    core_passed: corePassed,
    ring1_scripts_passed: ring1ScriptsPassed,
    all_passed,
    qa_green_real_created: false,
    activation_allowed_general_production: false,
    production_supabase_touched: false,
  };
  writeFileSync(RING1_ARTIFACT_PATHS.commandResults, `${JSON.stringify(commandResults, null, 2)}\n`);

  const noGoRun = runNodeScript("scripts/eve/production-activation/ring1-no-go-check.mjs");
  commands.ring1_no_go_final = noGoRun;

  const mba = readJsonIfExists(RING1_ARTIFACT_PATHS.mbaConformance);
  const structural = readJsonIfExists(RING1_ARTIFACT_PATHS.structuralCoverage);
  const testTenant = readJsonIfExists(RING1_ARTIFACT_PATHS.testTenantManifest);
  const internalClient = readJsonIfExists(RING1_ARTIFACT_PATHS.internalTestClientManifest);
  const clientUi = readJsonIfExists(RING1_ARTIFACT_PATHS.clientUiFlow);
  const bffFlow = readJsonIfExists(RING1_ARTIFACT_PATHS.bffRuntimeFlow);
  const observability = readJsonIfExists(RING1_ARTIFACT_PATHS.observability);
  const rollback = readJsonIfExists(RING1_ARTIFACT_PATHS.rollback);
  const abort = readJsonIfExists(RING1_ARTIFACT_PATHS.abort);
  const noGo = readJsonIfExists(RING1_ARTIFACT_PATHS.noGo);
  const gateReadiness = readJsonIfExists(RING1_ARTIFACT_PATHS.gateReadiness);
  const clientSafe = readJsonIfExists(RING1_ARTIFACT_PATHS.clientSafeResult);
  const consultant = readJsonIfExists(RING1_ARTIFACT_PATHS.consultantPacket);
  const parallel = readJsonIfExists(RING1_ARTIFACT_PATHS.parallelPayload);
  const inventory = readJsonIfExists(RING1_ARTIFACT_PATHS.runtimeRecordInventory);

  writeFileSync(RING1_ARTIFACT_PATHS.commandResults, `${JSON.stringify({ ...commandResults, commands }, null, 2)}\n`);

  const boundaryLedger = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING1_BOUNDARY_LEDGER",
    generated_at: new Date().toISOString(),
    ring1_authorized: ring1Auth?.ring1_authorized === true,
    ring1_scope: "internal_test_tenant_limited_client",
    production_supabase_touched: false,
    remote_modified: false,
    sql_executed_against_production: false,
    runtime_real_production_started: false,
    gates_real_executed_in_production: false,
    diagnosis_created: false,
    export_real_created: false,
    produccion_paralela_productiva_started: false,
    real_external_client_access_enabled: false,
    production_public_access_enabled: false,
    real_external_client_data_used: false,
    qa_green_real_created: false,
    activation_allowed_general_production: false,
    test_tenant_created: testTenant?.controlled_test_data === true,
    internal_test_client_created: Boolean(internalClient?.internal_test_client_id),
  };
  writeFileSync(RING1_ARTIFACT_PATHS.boundary, `${JSON.stringify(boundaryLedger, null, 2)}\n`);

  const ring1_execution_completed =
    all_passed &&
    noGoRun.exit_code === 0 &&
    mba?.mba_conformance_passed === true &&
    structural?.structural_framework_coverage_passed === true &&
    testTenant?.controlled_test_data === true &&
    Boolean(internalClient?.internal_test_client_id) &&
    clientUi?.client_ui_flow_passed === true &&
    bffFlow?.bff_runtime_flow_passed === true &&
    inventory?.runtime_records_created_safe_target === true &&
    gateReadiness?.gates_readiness_passed === true &&
    clientSafe?.client_safe_result_passed === true &&
    consultant?.consultant_packet_passed === true &&
    parallel?.parallel_payload_local_rehearsal_passed === true &&
    observability?.observability_passed === true &&
    rollback?.rollback_drill_passed === true &&
    abort?.abort_drill_passed === true &&
    noGo?.no_go_ring1_clean === true;

  const nextRingReadiness = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING1_NEXT_RING_READINESS",
    generated_at: new Date().toISOString(),
    ring1_execution_completed,
    ready_for_ring2_authorization: ring1_execution_completed && noGo?.ready_for_ring2_authorization === true,
    ready_for_production_public_activation: false,
    next_authorization_required: true,
    next_tree_point: "Ring 2 authorization — authorized pilot client, scoped, supervised",
    activation_allowed_general_production: false,
    qa_green_real_created: false,
  };
  writeFileSync(RING1_ARTIFACT_PATHS.nextRingReadiness, `${JSON.stringify(nextRingReadiness, null, 2)}\n`);

  const traceability = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING1_INTERNAL_TEST_TENANT_EXECUTION_TRACEABILITY",
    generated_at: new Date().toISOString(),
    ring1_scope: "internal_test_tenant_limited_client",
    authorization_ref: ring1Auth?.authorization_ref ?? null,
    ring1_authorization_referenced: ring1Auth?.ring1_authorized === true,
    mba_conformance_passed: mba?.mba_conformance_passed ?? false,
    structural_framework_coverage_passed: structural?.structural_framework_coverage_passed ?? false,
    test_tenant_created: testTenant?.controlled_test_data === true,
    internal_test_client_created: Boolean(internalClient?.internal_test_client_id),
    client_ui_flow_passed: clientUi?.client_ui_flow_passed ?? false,
    bff_runtime_flow_passed: bffFlow?.bff_runtime_flow_passed ?? false,
    gates_readiness_passed: gateReadiness?.gates_readiness_passed ?? false,
    client_safe_result_passed: clientSafe?.client_safe_result_passed ?? false,
    consultant_packet_passed: consultant?.consultant_packet_passed ?? false,
    parallel_payload_local_rehearsal_passed: parallel?.parallel_payload_local_rehearsal_passed ?? false,
    observability_passed: observability?.observability_passed ?? false,
    rollback_drill_passed: rollback?.rollback_drill_passed ?? false,
    abort_drill_passed: abort?.abort_drill_passed ?? false,
    no_go_ring1_clean: noGo?.no_go_ring1_clean ?? false,
    ring1_execution_completed,
    real_external_client_data_used: false,
    production_public_access_enabled: false,
    activation_allowed_general_production: false,
    artifacts: Object.fromEntries(
      Object.entries(RING1_ARTIFACT_PATHS).map(([k, v]) => [
        k,
        v.replace(repoRoot + "\\", "").replace(repoRoot + "/", ""),
      ]),
    ),
  };
  writeFileSync(RING1_ARTIFACT_PATHS.traceability, `${JSON.stringify(traceability, null, 2)}\n`);

  const closeout = `# Ring 1 Internal/Test Tenant Limited Client — Closeout

## Dictamen

${ring1_execution_completed ? "EVE_PRODUCTION_ACTIVATION_RING1_INTERNAL_TEST_TENANT_LIMITED_CLIENT_EXECUTION_COMPLETED" : "EVE_PRODUCTION_ACTIVATION_RING1_INTERNAL_TEST_TENANT_LIMITED_CLIENT_EXECUTION_BLOCKED"}

## Scope

- Ring 1 authorized: true
- Scope: internal_test_tenant_limited_client
- Test tenant created: ${testTenant?.controlled_test_data ? "true" : "false"}
- Internal test client created: ${internalClient?.internal_test_client_id ? "true" : "false"}
- Real external client data used: false
- Production public access: false

## Execution Summary

| Step | Status |
| --- | --- |
| Ring 1 authorization | ${ring1Auth?.ring1_authorized ? "verified" : "failed"} |
| MBA conformance | ${mba?.mba_conformance_passed ? "passed" : "failed"} |
| Structural framework coverage | ${structural?.structural_framework_coverage_passed ? "passed" : "failed"} |
| Test tenant fixture | ${testTenant?.controlled_test_data ? "passed" : "failed"} |
| Client UI flow | ${clientUi?.client_ui_flow_passed ? "passed" : "failed"} |
| BFF/Runtime flow | ${bffFlow?.bff_runtime_flow_passed ? "passed" : "failed"} |
| Gates/readiness | ${gateReadiness?.gates_readiness_passed ? "passed" : "failed"} |
| Client safe result | ${clientSafe?.client_safe_result_passed ? "passed" : "failed"} |
| Consultant packet | ${consultant?.consultant_packet_passed ? "passed" : "failed"} |
| Parallel payload local/rehearsal | ${parallel?.parallel_payload_local_rehearsal_passed ? "passed" : "failed"} |
| Observability | ${observability?.observability_passed ? "passed" : "failed"} |
| Rollback drill | ${rollback?.rollback_drill_passed ? "passed" : "failed"} |
| Abort drill | ${abort?.abort_drill_passed ? "passed" : "failed"} |
| No-Go Ring 1 | ${noGo?.no_go_ring1_clean ? "clean" : "blocked"} |

## Boundary

- Production Supabase touched: false
- activation_allowed_general_production: false
- qa_green_real_created: false

## Next Step

Ring 2 authorization required — authorized pilot client, scoped, supervised.
`;
  writeFileSync(RING1_ARTIFACT_PATHS.closeout, closeout);

  console.log(JSON.stringify({ ring1_execution_completed, all_passed, traceability }, null, 2));
  if (!ring1_execution_completed) process.exit(1);
}

main();
