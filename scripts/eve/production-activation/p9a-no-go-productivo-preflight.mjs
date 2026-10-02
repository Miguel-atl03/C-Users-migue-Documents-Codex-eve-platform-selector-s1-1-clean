#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import {
  P9AR2_ARTIFACT_PATHS,
  readJsonIfExists,
} from "./local-activation-chain-context-lib.mjs";
import { P9A_ARTIFACT_PATHS } from "./p9a-production-activation-lib.mjs";

function gate(id, check, expectedValue, actualValue, blocking = true) {
  const passed = actualValue === expectedValue;
  return { id, check, expected: expectedValue, actual: actualValue, passed, blocking };
}

function main() {
  const commands =
    readJsonIfExists(P9AR2_ARTIFACT_PATHS.commandResults) ??
    readJsonIfExists(P9A_ARTIFACT_PATHS.commandResults);
  const integrated =
    readJsonIfExists(P9AR2_ARTIFACT_PATHS.integratedSmoke) ??
    readJsonIfExists(P9A_ARTIFACT_PATHS.integratedSmoke);
  const chainValidation = readJsonIfExists(P9AR2_ARTIFACT_PATHS.chainValidation);
  const p6Leakage = readJsonIfExists(P9A_ARTIFACT_PATHS.p6Leakage);
  const p9ar2P6 = readJsonIfExists(P9AR2_ARTIFACT_PATHS.p6Results);

  const cmd = commands?.commands ?? {};
  const checks = [
    gate("P9AR2-NG-01", "typecheck_passed", true, cmd.typecheck?.status === "passed"),
    gate("P9AR2-NG-02", "build_passed", true, cmd.build_webpack?.status === "passed"),
    gate("P9AR2-NG-03", "all_module_tests_passed", true, cmd.all_module_tests_passed === true),
    gate(
      "P9AR2-NG-04",
      "supabase_local_available",
      true,
      cmd.supabase_status?.supabase_local_available === true,
    ),
    gate("P9AR2-NG-05", "validate_p5_passed", true, cmd.validate_p5?.status === "passed"),
    gate("P9AR2-NG-06", "validate_p6_passed", true, cmd.validate_p6?.status === "passed"),
    gate("P9AR2-NG-07", "validate_p7_passed", true, cmd.validate_p7?.status === "passed"),
    gate("P9AR2-NG-08", "validate_p8_passed", true, cmd.validate_p8?.status === "passed"),
    gate(
      "P9AR2-NG-09",
      "chain_context_validation_passed",
      true,
      chainValidation?.validation_passed === true,
    ),
    gate(
      "P9AR2-NG-10",
      "integrated_runtime_smoke_passed",
      true,
      integrated?.integrated_runtime_smoke_passed === true,
    ),
    gate(
      "P9AR2-NG-11",
      "p6_local_read_valid",
      true,
      p9ar2P6?.local_read_valid === true,
    ),
    gate("P9AR2-NG-12", "no_internal_leakage", false, p6Leakage?.client_internal_leakage === true),
    gate("P9AR2-NG-13", "activation_allowed", false, integrated?.activation_allowed ?? false),
    gate(
      "P9AR2-NG-14",
      "qa_green_real_created",
      false,
      integrated?.qa_green_real_created ?? false,
    ),
    gate("P9AR2-NG-15", "S5_operator_signoff_present", false, false),
    gate(
      "P9AR2-NG-16",
      "production_supabase_touched",
      false,
      integrated?.production_supabase_touched ?? false,
    ),
  ];

  const blocking_checks = checks.filter((c) => c.blocking);
  const all_blocking_passed = blocking_checks.every((c) => c.passed);
  const no_go_productivo_technical_clean = all_blocking_passed;
  const qa_green_technical_candidate_created = all_blocking_passed;
  const ready_for_p9b_human_signoff = all_blocking_passed;

  const result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_P9AR2_NO_GO_PRODUCTIVO_PREFLIGHT",
    generated_at: new Date().toISOString(),
    checks,
    all_blocking_passed,
    no_go_productivo_technical_clean,
    qa_green_technical_candidate_created,
    qa_green_real_created: false,
    activation_allowed: false,
    S5_operator_signoff_present: false,
    ready_for_p9b_human_signoff,
    production_supabase_touched: false,
    remote_modified: false,
  };

  writeFileSync(P9AR2_ARTIFACT_PATHS.noGoPreflight, `${JSON.stringify(result, null, 2)}\n`);
  writeFileSync(
    P9A_ARTIFACT_PATHS.noGo,
    `${JSON.stringify({ ...result, dictamen: "EVE_PRODUCTION_ACTIVATION_P9A_NO_GO_PRODUCTIVO_PREFLIGHT" }, null, 2)}\n`,
  );
  console.log(JSON.stringify(result, null, 2));

  if (!no_go_productivo_technical_clean) {
    process.exitCode = 1;
    return;
  }
}

main();
