#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  P9A_ARTIFACT_PATHS,
  repoRoot,
} from "./p9a-production-activation-lib.mjs";

const MODULE_TESTS = [
  "src/services/eve/runtime-40-20/parallel-production/runtime-40-20-parallel-production.test.mjs",
  "src/services/eve/runtime-40-20/consultant-result/runtime-40-20-consultant-result.test.mjs",
  "src/services/eve/runtime-40-20/client-result/runtime-40-20-client-result.test.mjs",
  "src/services/eve/runtime-40-20/gates-readiness/runtime-40-20-gates-readiness.test.mjs",
  "src/services/eve/runtime-40-20/runtime-real/runtime-40-20-runtime-real.test.mjs",
  "src/services/eve/runtime-40-20/client-bff/runtime-40-20-client-bff.test.mjs",
  "src/services/eve/runtime-40-20/client-membrane/runtime-40-20-client-membrane.test.mjs",
];

const P9A_SCRIPTS = [
  "scripts/eve/production-activation/p9a-client-ui-browser-qa.mjs",
  "scripts/eve/production-activation/p9a-integrated-runtime-smoke.mjs",
  "scripts/eve/production-activation/p9a-rollback-drill-local.mjs",
  "scripts/eve/production-activation/p9a-abort-path-drill-local.mjs",
  "scripts/eve/production-activation/p9a-observability-audit-check.mjs",
];

function run(command, args = [], options = {}) {
  const started = Date.now();
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    shell: true,
    env: process.env,
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
  commands.build_npm = run("npm", ["run", "build"]);
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

  const supabaseStatus = run("npx", ["supabase", "status"]);
  commands.supabase_status = {
    ...supabaseStatus,
    supabase_local_available: supabaseStatus.exit_code === 0,
  };

  commands.validate_p5 = run("npm", ["run", "validate:p5"]);
  commands.validate_p6 = run("npm", ["run", "validate:p6"]);
  commands.validate_p7 = run("npm", ["run", "validate:p7"]);
  commands.validate_p8 = run("npm", ["run", "validate:p8"]);

  const p9aResults = {};
  for (const script of P9A_SCRIPTS) {
    const key = script.split("/").pop()?.replace(".mjs", "") ?? script;
    p9aResults[key] = runNodeScript(script);
  }
  commands.p9a_scripts = p9aResults;

  commands.p9a_no_go_preflight = runNodeScript(
    "scripts/eve/production-activation/p9a-no-go-productivo-preflight.mjs",
  );

  const corePassed =
    commands.typecheck.exit_code === 0 &&
    commands.build_webpack.exit_code === 0 &&
    allModulePassed &&
    commands.supabase_status.supabase_local_available &&
    commands.validate_p5.exit_code === 0 &&
    commands.validate_p6.exit_code === 0 &&
    commands.validate_p7.exit_code === 0 &&
    commands.validate_p8.exit_code === 0;

  commands.build_passed = commands.build_webpack.status === "passed";
  commands.build_note =
    "npm run build (Turbopack) may fail on Windows long paths; webpack build is authoritative.";

  const p9aPassed = Object.values(p9aResults).every((r) => r.exit_code === 0) &&
    commands.p9a_no_go_preflight.exit_code === 0;

  const commandResults = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_P9A_COMMAND_RESULTS",
    generated_at: new Date().toISOString(),
    project_root: repoRoot,
    project_root_note:
      "Authoritative root is external-consumers/eve-platform (production-activation scripts P0-P8 present). C:/eve/platform is a separate clone.",
    commands,
    all_passed: corePassed && p9aPassed,
    qa_green_real_created: false,
    activation_allowed: false,
    production_supabase_touched: false,
  };

  writeFileSync(P9A_ARTIFACT_PATHS.commandResults, `${JSON.stringify(commandResults, null, 2)}\n`);

  const boundaryLedger = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_P9A_BOUNDARY_LEDGER",
    generated_at: new Date().toISOString(),
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
    activation_allowed: false,
    S5_operator_signoff_present: false,
    qa_green_technical_candidate_created: p9aPassed && corePassed,
    ready_for_p9b_human_signoff: p9aPassed && corePassed,
  };
  writeFileSync(P9A_ARTIFACT_PATHS.boundary, `${JSON.stringify(boundaryLedger, null, 2)}\n`);

  const humanSignoff = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_P9A_HUMAN_SIGNOFF_REQUIRED",
    generated_at: new Date().toISOString(),
    S5_operator_signoff_present: false,
    signoff_simulated: false,
    qa_green_real_created: false,
    activation_allowed: false,
    ready_for_p9b_human_signoff: p9aPassed && corePassed,
    next_authorization: "P9-B — Human S5/operator signoff and Ring 0 authorization",
    note: "P9-A deliberately does not simulate human signoff. Real QA green requires P9-B.",
  };
  writeFileSync(P9A_ARTIFACT_PATHS.humanSignoff, `${JSON.stringify(humanSignoff, null, 2)}\n`);

  const traceability = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_P9A_TECHNICAL_QA_GREEN_NO_GO_PREFLIGHT_LOCAL_TRACEABILITY",
    generated_at: new Date().toISOString(),
    entry_conditions: {
      p0_p1r_accepted: true,
      p2_bff_accepted: true,
      p3_p3r_accepted: true,
      p4_accepted: true,
      p5_accepted: true,
      p6_p6r_accepted: true,
      p7_accepted: true,
      p8_accepted: true,
      ready_for_p9: true,
    },
    artifacts: Object.fromEntries(
      Object.entries(P9A_ARTIFACT_PATHS).map(([key, path]) => [key, path.replace(/\\/g, "/")]),
    ),
    orchestration: {
      core_regression_passed: corePassed,
      p9a_drills_passed: p9aPassed,
      qa_green_technical_candidate_created: p9aPassed && corePassed,
      no_go_productivo_technical_clean: commands.p9a_no_go_preflight.exit_code === 0,
      qa_green_real_created: false,
      activation_allowed: false,
      ready_for_p9b_human_signoff: p9aPassed && corePassed,
    },
  };
  writeFileSync(P9A_ARTIFACT_PATHS.traceability, `${JSON.stringify(traceability, null, 2)}\n`);

  console.log(JSON.stringify({ commandResults, boundaryLedger, humanSignoff, traceability }, null, 2));

  if (!corePassed || !p9aPassed) process.exit(1);
}

main();
