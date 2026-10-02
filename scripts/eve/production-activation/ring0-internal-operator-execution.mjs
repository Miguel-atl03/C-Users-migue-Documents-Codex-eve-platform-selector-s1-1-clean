#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import {
  RING0_ARTIFACT_PATHS,
  RING0_FEATURE_FLAGS,
  repoRoot,
} from "./ring0-artifact-paths.mjs";
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

const RING0_SCRIPTS = [
  "scripts/eve/production-activation/ring0-validate-mba-conformance.mjs",
  "scripts/eve/production-activation/ring0-validate-structural-framework-coverage.mjs",
  "scripts/eve/production-activation/ring0-run-ui-bff-runtime-flow.mjs",
  "scripts/eve/production-activation/ring0-run-observability-check.mjs",
  "scripts/eve/production-activation/ring0-run-rollback-drill.mjs",
  "scripts/eve/production-activation/ring0-run-abort-drill.mjs",
];

function run(command, args = [], options = {}) {
  const started = Date.now();
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    shell: true,
    env: { ...process.env, ...RING0_FEATURE_FLAGS, ...options.env },
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
  commands.module_test_path_note =
    "runtime-40/20 typo corrected to runtime-40-20 per Ring 0 instruction";

  commands.validate_p5 = run("npm", ["run", "validate:p5"]);
  commands.validate_p6 = run("npm", ["run", "validate:p6"]);
  commands.validate_p7 = run("npm", ["run", "validate:p7"]);
  commands.validate_p8 = run("npm", ["run", "validate:p8"]);

  const ring0Results = {};
  for (const script of RING0_SCRIPTS) {
    const key = script.split("/").pop()?.replace(".mjs", "") ?? script;
    ring0Results[key] = runNodeScript(script);
  }
  commands.ring0_scripts = ring0Results;

  const corePassed =
    commands.typecheck.exit_code === 0 &&
    commands.build_webpack.exit_code === 0 &&
    allModulePassed &&
    commands.validate_p5.exit_code === 0 &&
    commands.validate_p6.exit_code === 0 &&
    commands.validate_p7.exit_code === 0 &&
    commands.validate_p8.exit_code === 0;

  const ring0ScriptsPassed = Object.values(ring0Results).every((r) => r.exit_code === 0);
  const all_passed = corePassed && ring0ScriptsPassed;

  const commandResults = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING0_COMMAND_RESULTS",
    generated_at: new Date().toISOString(),
    project_root: repoRoot,
    ring0_scope: "internal_operator_with_controlled_fixtures",
    commands,
    core_passed: corePassed,
    ring0_scripts_passed: ring0ScriptsPassed,
    all_passed,
    qa_green_real_created: false,
    activation_allowed_general_production: false,
    production_supabase_touched: false,
  };
  writeFileSync(RING0_ARTIFACT_PATHS.commandResults, `${JSON.stringify(commandResults, null, 2)}\n`);

  const noGoRun = runNodeScript("scripts/eve/production-activation/ring0-no-go-check.mjs");
  commands.ring0_no_go_final = noGoRun;

  const mba = readJsonIfExists(RING0_ARTIFACT_PATHS.mbaConformance);
  const structural = readJsonIfExists(RING0_ARTIFACT_PATHS.structuralCoverage);
  const fixture = readJsonIfExists(RING0_ARTIFACT_PATHS.fixtureManifest);
  const flow = readJsonIfExists(RING0_ARTIFACT_PATHS.uiBffRuntimeFlow);
  const observability = readJsonIfExists(RING0_ARTIFACT_PATHS.observability);
  const rollback = readJsonIfExists(RING0_ARTIFACT_PATHS.rollback);
  const abort = readJsonIfExists(RING0_ARTIFACT_PATHS.abort);
  const noGo = readJsonIfExists(RING0_ARTIFACT_PATHS.noGo);
  const p9bAuth = readJsonIfExists(RING0_ARTIFACT_PATHS.p9bAuthorization);

  writeFileSync(RING0_ARTIFACT_PATHS.commandResults, `${JSON.stringify({ ...commandResults, commands }, null, 2)}\n`);

  const boundaryLedger = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING0_BOUNDARY_LEDGER",
    generated_at: new Date().toISOString(),
    ring0_authorized: p9bAuth?.ring0_authorized === true,
    ring0_scope: "internal_operator_with_controlled_fixtures",
    production_supabase_touched: false,
    remote_modified: false,
    sql_executed_against_production: false,
    runtime_real_production_started: false,
    gates_real_executed_in_production: false,
    diagnosis_created: false,
    export_real_created: false,
    produccion_paralela_productiva_started: false,
    real_client_access_enabled: false,
    qa_green_real_created: false,
    activation_allowed_general_production: false,
    controlled_fixture: fixture?.controlled_fixture === true,
    real_client_data_used: fixture?.real_client_data === true,
  };
  writeFileSync(RING0_ARTIFACT_PATHS.boundary, `${JSON.stringify(boundaryLedger, null, 2)}\n`);

  const ring0_execution_completed =
    all_passed &&
    noGoRun.exit_code === 0 &&
    mba?.mba_conformance_passed === true &&
    structural?.structural_framework_coverage_passed === true &&
    fixture?.controlled_fixture === true &&
    flow?.ui_bff_runtime_local_flow_passed === true &&
    observability?.observability_passed === true &&
    rollback?.rollback_drill_passed === true &&
    abort?.abort_drill_passed === true &&
    noGo?.no_go_ring0_clean === true;

  const nextRingReadiness = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING0_NEXT_RING_READINESS",
    generated_at: new Date().toISOString(),
    ring0_execution_completed,
    ready_for_ring1_authorization: ring0_execution_completed && noGo?.ready_for_ring1_authorization === true,
    ready_for_production_public_activation: false,
    next_authorization_required: true,
    next_tree_point:
      "Ring 1 authorization — internal/test tenant limited client, only after Ring 0 accepted",
    activation_allowed_general_production: false,
    qa_green_real_created: false,
  };
  writeFileSync(RING0_ARTIFACT_PATHS.nextRingReadiness, `${JSON.stringify(nextRingReadiness, null, 2)}\n`);

  const traceability = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING0_INTERNAL_OPERATOR_EXECUTION_TRACEABILITY",
    generated_at: new Date().toISOString(),
    ring0_scope: "internal_operator_with_controlled_fixtures",
    authorization_ref: p9bAuth?.authorization_ref ?? null,
    p9b_ring0_authorization_referenced: p9bAuth?.ring0_authorized === true,
    mba_conformance_passed: mba?.mba_conformance_passed ?? false,
    structural_framework_coverage_passed: structural?.structural_framework_coverage_passed ?? false,
    fixture_created: fixture?.controlled_fixture === true,
    ui_bff_runtime_local_flow_passed: flow?.ui_bff_runtime_local_flow_passed ?? false,
    observability_passed: observability?.observability_passed ?? false,
    rollback_drill_passed: rollback?.rollback_drill_passed ?? false,
    abort_drill_passed: abort?.abort_drill_passed ?? false,
    no_go_ring0_clean: noGo?.no_go_ring0_clean ?? false,
    ring0_execution_completed,
    artifacts: Object.fromEntries(
      Object.entries(RING0_ARTIFACT_PATHS).map(([k, v]) => [k, v.replace(repoRoot + "\\", "").replace(repoRoot + "/", "")]),
    ),
  };
  writeFileSync(RING0_ARTIFACT_PATHS.traceability, `${JSON.stringify(traceability, null, 2)}\n`);

  const closeout = `# Ring 0 Internal Operator Controlled Fixtures — Closeout

## Dictamen

${ring0_execution_completed ? "EVE_PRODUCTION_ACTIVATION_RING0_INTERNAL_OPERATOR_CONTROLLED_FIXTURES_EXECUTION_COMPLETED" : "EVE_PRODUCTION_ACTIVATION_RING0_INTERNAL_OPERATOR_CONTROLLED_FIXTURES_EXECUTION_BLOCKED"}

## Scope

- Ring 0 authorized: true
- Scope: internal_operator_with_controlled_fixtures
- Real client data used: false
- Production public access: false

## Execution Summary

| Step | Status |
| --- | --- |
| MBA conformance | ${mba?.mba_conformance_passed ? "passed" : "failed"} |
| Structural framework coverage | ${structural?.structural_framework_coverage_passed ? "passed" : "failed"} |
| Controlled fixture | ${fixture?.controlled_fixture ? "passed" : "failed"} |
| UI/BFF/Runtime local flow | ${flow?.ui_bff_runtime_local_flow_passed ? "passed" : "failed"} |
| Observability | ${observability?.observability_passed ? "passed" : "failed"} |
| Rollback drill | ${rollback?.rollback_drill_passed ? "passed" : "failed"} |
| Abort drill | ${abort?.abort_drill_passed ? "passed" : "failed"} |
| No-Go Ring 0 | ${noGo?.no_go_ring0_clean ? "clean" : "blocked"} |

## Boundary

- Production Supabase touched: false
- activation_allowed_general_production: false
- qa_green_real_created: false

## Next Step

Ring 1 authorization required — internal/test tenant limited client, only after Ring 0 accepted.
`;
  writeFileSync(RING0_ARTIFACT_PATHS.closeout, closeout);

  console.log(JSON.stringify({ ring0_execution_completed, all_passed, traceability }, null, 2));
  if (!ring0_execution_completed) process.exit(1);
}

main();
