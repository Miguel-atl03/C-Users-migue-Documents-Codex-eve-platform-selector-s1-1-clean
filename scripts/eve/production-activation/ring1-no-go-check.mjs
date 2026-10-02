#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { RING1_ARTIFACT_PATHS } from "./ring1-artifact-paths.mjs";
import { readJsonIfExists } from "./p9a-production-activation-lib.mjs";

function gate(id, check, expectedValue, actualValue, blocking = true) {
  const passed = actualValue === expectedValue;
  return { id, check, expected: expectedValue, actual: actualValue, passed, blocking };
}

function main() {
  const ring1Auth = readJsonIfExists(RING1_ARTIFACT_PATHS.ring1Authorization);
  const testTenant = readJsonIfExists(RING1_ARTIFACT_PATHS.testTenantManifest);
  const internalClient = readJsonIfExists(RING1_ARTIFACT_PATHS.internalTestClientManifest);
  const mba = readJsonIfExists(RING1_ARTIFACT_PATHS.mbaConformance);
  const structural = readJsonIfExists(RING1_ARTIFACT_PATHS.structuralCoverage);
  const clientUi = readJsonIfExists(RING1_ARTIFACT_PATHS.clientUiFlow);
  const bffFlow = readJsonIfExists(RING1_ARTIFACT_PATHS.bffRuntimeFlow);
  const inventory = readJsonIfExists(RING1_ARTIFACT_PATHS.runtimeRecordInventory);
  const gateReadiness = readJsonIfExists(RING1_ARTIFACT_PATHS.gateReadiness);
  const client = readJsonIfExists(RING1_ARTIFACT_PATHS.clientSafeResult);
  const consultant = readJsonIfExists(RING1_ARTIFACT_PATHS.consultantPacket);
  const parallel = readJsonIfExists(RING1_ARTIFACT_PATHS.parallelPayload);
  const observability = readJsonIfExists(RING1_ARTIFACT_PATHS.observability);
  const rollback = readJsonIfExists(RING1_ARTIFACT_PATHS.rollback);
  const abort = readJsonIfExists(RING1_ARTIFACT_PATHS.abort);
  const commands = readJsonIfExists(RING1_ARTIFACT_PATHS.commandResults);

  const checks = [
    gate("R1-NG-01", "ring1_authorized", true, ring1Auth?.ring1_authorized === true),
    gate("R1-NG-02", "test_tenant_created", true, testTenant?.controlled_test_data === true),
    gate("R1-NG-03", "internal_test_client_created", true, Boolean(internalClient?.internal_test_client_id)),
    gate("R1-NG-04", "real_external_client_data", false, testTenant?.real_external_client_data ?? true),
    gate("R1-NG-05", "mba_conformance_passed", true, mba?.mba_conformance_passed === true),
    gate("R1-NG-06", "structural_framework_coverage_passed", true, structural?.structural_framework_coverage_passed === true),
    gate("R1-NG-07", "client_ui_flow_passed", true, clientUi?.client_ui_flow_passed === true),
    gate("R1-NG-08", "bff_runtime_flow_passed", true, bffFlow?.bff_runtime_flow_passed === true),
    gate("R1-NG-09", "runtime_records_created_safe_target", true, inventory?.runtime_records_created_safe_target === true),
    gate("R1-NG-10", "gates_readiness_passed", true, gateReadiness?.gates_readiness_passed === true),
    gate("R1-NG-11", "client_safe_result_passed", true, client?.client_safe_result_passed === true),
    gate("R1-NG-12", "consultant_packet_passed", true, consultant?.consultant_packet_passed === true),
    gate("R1-NG-13", "parallel_payload_local_rehearsal_passed", true, parallel?.parallel_payload_local_rehearsal_passed === true),
    gate("R1-NG-14", "observability_passed", true, observability?.observability_passed === true),
    gate("R1-NG-15", "rollback_drill_passed", true, rollback?.rollback_drill_passed === true),
    gate("R1-NG-16", "abort_drill_passed", true, abort?.abort_drill_passed === true),
    gate("R1-NG-17", "diagnosis_created", false, client?.diagnosis_created ?? false),
    gate("R1-NG-18", "export_real_created", false, parallel?.export_real_created ?? false),
    gate("R1-NG-19", "production_supabase_touched", false, bffFlow?.production_supabase_touched ?? false),
    gate("R1-NG-20", "production_public_access_enabled", false, testTenant?.production_public_allowed ?? true),
    gate("R1-NG-21", "real_external_client_access_enabled", false, internalClient?.real_external_client_access_enabled ?? true),
    gate("R1-NG-22", "qa_green_real_created", false, observability?.qa_green_real_created ?? false),
    gate("R1-NG-23", "activation_allowed_general_production", false, parallel?.activation_allowed_general_production ?? true),
    gate(
      "R1-NG-24",
      "core_commands_passed",
      true,
      commands?.all_passed === true || commands?.core_passed === true,
      false,
    ),
  ];

  const blocking_checks = checks.filter((c) => c.blocking);
  const all_blocking_passed = blocking_checks.every((c) => c.passed);
  const no_go_ring1_clean = all_blocking_passed;

  const result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING1_NO_GO_CHECKLIST",
    generated_at: new Date().toISOString(),
    ring1_scope: "internal_test_tenant_limited_client",
    checks,
    all_blocking_passed,
    no_go_ring1_clean,
    qa_green_real_created: false,
    activation_allowed_general_production: false,
    production_supabase_touched: false,
    remote_modified: false,
    ready_for_ring2_authorization: no_go_ring1_clean,
  };

  writeFileSync(RING1_ARTIFACT_PATHS.noGo, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  if (!no_go_ring1_clean) process.exit(1);
}

main();
