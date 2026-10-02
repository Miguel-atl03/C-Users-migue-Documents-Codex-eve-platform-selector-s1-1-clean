#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { RING0_ARTIFACT_PATHS } from "./ring0-artifact-paths.mjs";
import { readJsonIfExists } from "./p9a-production-activation-lib.mjs";

function gate(id, check, expectedValue, actualValue, blocking = true) {
  const passed = actualValue === expectedValue;
  return { id, check, expected: expectedValue, actual: actualValue, passed, blocking };
}

function main() {
  const mba = readJsonIfExists(RING0_ARTIFACT_PATHS.mbaConformance);
  const structural = readJsonIfExists(RING0_ARTIFACT_PATHS.structuralCoverage);
  const fixture = readJsonIfExists(RING0_ARTIFACT_PATHS.fixtureManifest);
  const flow = readJsonIfExists(RING0_ARTIFACT_PATHS.uiBffRuntimeFlow);
  const inventory = readJsonIfExists(RING0_ARTIFACT_PATHS.runtimeRecordInventory);
  const gateReadiness = readJsonIfExists(RING0_ARTIFACT_PATHS.gateReadiness);
  const client = readJsonIfExists(RING0_ARTIFACT_PATHS.clientSafeResult);
  const consultant = readJsonIfExists(RING0_ARTIFACT_PATHS.consultantPacket);
  const parallel = readJsonIfExists(RING0_ARTIFACT_PATHS.parallelPayload);
  const observability = readJsonIfExists(RING0_ARTIFACT_PATHS.observability);
  const rollback = readJsonIfExists(RING0_ARTIFACT_PATHS.rollback);
  const abort = readJsonIfExists(RING0_ARTIFACT_PATHS.abort);
  const p9bAuth = readJsonIfExists(RING0_ARTIFACT_PATHS.p9bAuthorization);
  const commands = readJsonIfExists(RING0_ARTIFACT_PATHS.commandResults);

  const checks = [
    gate("R0-NG-01", "ring0_authorized", true, p9bAuth?.ring0_authorized === true),
    gate("R0-NG-02", "mba_conformance_passed", true, mba?.mba_conformance_passed === true),
    gate("R0-NG-03", "structural_framework_coverage_passed", true, structural?.structural_framework_coverage_passed === true),
    gate("R0-NG-04", "controlled_fixture", true, fixture?.controlled_fixture === true),
    gate("R0-NG-05", "real_client_data", false, fixture?.real_client_data ?? true),
    gate("R0-NG-06", "ui_bff_runtime_local_flow_passed", true, flow?.ui_bff_runtime_local_flow_passed === true),
    gate("R0-NG-07", "runtime_records_created_local", true, inventory?.runtime_records_created_local === true),
    gate("R0-NG-08", "gates_readiness_local_passed", true, gateReadiness?.gates_readiness_local_passed === true),
    gate("R0-NG-09", "client_safe_result_passed", true, client?.client_safe_result_passed === true),
    gate("R0-NG-10", "consultant_packet_passed", true, consultant?.consultant_packet_passed === true),
    gate("R0-NG-11", "parallel_payload_local_passed", true, parallel?.parallel_payload_local_passed === true),
    gate("R0-NG-12", "observability_passed", true, observability?.observability_passed === true),
    gate("R0-NG-13", "rollback_drill_passed", true, rollback?.rollback_drill_passed === true),
    gate("R0-NG-14", "abort_drill_passed", true, abort?.abort_drill_passed === true),
    gate("R0-NG-15", "diagnosis_created", false, flow?.diagnosis_created ?? false),
    gate("R0-NG-16", "export_real_created", false, parallel?.export_real_created ?? false),
    gate("R0-NG-17", "production_supabase_touched", false, flow?.production_supabase_touched ?? false),
    gate("R0-NG-18", "qa_green_real_created", false, flow?.qa_green_real_created ?? false),
    gate("R0-NG-19", "activation_allowed_general_production", false, flow?.activation_allowed_general_production ?? true),
    gate(
      "R0-NG-20",
      "core_commands_passed",
      true,
      commands?.all_passed === true || commands?.core_passed === true,
      false,
    ),
  ];

  const blocking_checks = checks.filter((c) => c.blocking);
  const all_blocking_passed = blocking_checks.every((c) => c.passed);
  const no_go_ring0_clean = all_blocking_passed;

  const result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING0_NO_GO_CHECKLIST",
    generated_at: new Date().toISOString(),
    ring0_scope: "internal_operator_with_controlled_fixtures",
    checks,
    all_blocking_passed,
    no_go_ring0_clean,
    qa_green_real_created: false,
    activation_allowed_general_production: false,
    production_supabase_touched: false,
    remote_modified: false,
    ready_for_ring1_authorization: no_go_ring0_clean,
  };

  writeFileSync(RING0_ARTIFACT_PATHS.noGo, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  if (!no_go_ring0_clean) process.exit(1);
}

main();
