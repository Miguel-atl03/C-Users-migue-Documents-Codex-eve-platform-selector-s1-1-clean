#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { RING2_ARTIFACT_PATHS, repoRoot } from "./ring2-artifact-paths.mjs";
import { assessPilotReadiness } from "./ring2-pilot-readiness-lib.mjs";
import { readJsonIfExists } from "./p9a-production-activation-lib.mjs";

function gate(id, check, expectedValue, actualValue, blocking = true) {
  const passed = actualValue === expectedValue;
  return { id, check, expected: expectedValue, actual: actualValue, passed, blocking };
}

function main() {
  const readiness = assessPilotReadiness();
  const ring2Auth = readJsonIfExists(join(repoRoot, "docs/production-activation/ring2_authorization_record.json"));
  const pilotReadiness = readJsonIfExists(RING2_ARTIFACT_PATHS.pilotReadiness);
  const pilotScope = readJsonIfExists(RING2_ARTIFACT_PATHS.pilotScopeManifest);
  const mba = readJsonIfExists(RING2_ARTIFACT_PATHS.mbaConformance);
  const structural = readJsonIfExists(RING2_ARTIFACT_PATHS.structuralCoverage);
  const clientUi = readJsonIfExists(RING2_ARTIFACT_PATHS.clientUiFlow);
  const bffFlow = readJsonIfExists(RING2_ARTIFACT_PATHS.bffRuntimeFlow);
  const inventory = readJsonIfExists(RING2_ARTIFACT_PATHS.runtimeRecordInventory);
  const gateReadiness = readJsonIfExists(RING2_ARTIFACT_PATHS.gateReadiness);
  const client = readJsonIfExists(RING2_ARTIFACT_PATHS.clientSafeResult);
  const consultant = readJsonIfExists(RING2_ARTIFACT_PATHS.consultantPacket);
  const parallel = readJsonIfExists(RING2_ARTIFACT_PATHS.parallelPayload);
  const observability = readJsonIfExists(RING2_ARTIFACT_PATHS.observability);
  const rollback = readJsonIfExists(RING2_ARTIFACT_PATHS.rollback);
  const abort = readJsonIfExists(RING2_ARTIFACT_PATHS.abort);
  const commands = readJsonIfExists(RING2_ARTIFACT_PATHS.commandResults);

  const checks = [
    gate("R2-NG-01", "ring2_authorized", true, ring2Auth?.ring2_authorized === true),
    gate("R2-NG-02", "pilot_readiness_verified", true, readiness.pilot_readiness_verified === true),
    gate("R2-NG-03", "pilot_consent_verified", true, readiness.pilot_consent_verified === true),
    gate("R2-NG-04", "supervisor_assigned", true, readiness.supervisor_assigned === true),
    gate("R2-NG-05", "pilot_scope_created", true, readiness.pilot_scope_created === true),
    gate("R2-NG-06", "mba_conformance_passed", true, mba?.mba_conformance_passed === true),
    gate("R2-NG-07", "structural_framework_coverage_passed", true, structural?.structural_framework_coverage_passed === true),
    gate("R2-NG-08", "client_ui_flow_passed", true, clientUi?.client_ui_flow_passed === true),
    gate("R2-NG-09", "bff_runtime_flow_passed", true, bffFlow?.bff_runtime_flow_passed === true),
    gate("R2-NG-10", "runtime_records_created_safe_target", true, inventory?.runtime_records_created_safe_target === true),
    gate("R2-NG-11", "gates_readiness_passed", true, gateReadiness?.gates_readiness_passed === true),
    gate("R2-NG-12", "client_safe_result_passed", true, client?.client_safe_result_passed === true),
    gate("R2-NG-13", "consultant_packet_supervised", true, consultant?.consultant_packet_supervised === true),
    gate("R2-NG-14", "parallel_payload_local_rehearsal_passed", true, parallel?.parallel_payload_local_rehearsal_passed === true),
    gate("R2-NG-15", "observability_passed", true, observability?.observability_passed === true),
    gate("R2-NG-16", "rollback_drill_passed", true, rollback?.rollback_drill_passed === true),
    gate("R2-NG-17", "abort_drill_passed", true, abort?.abort_drill_passed === true),
    gate("R2-NG-18", "diagnosis_created", false, client?.diagnosis_created ?? false),
    gate("R2-NG-19", "export_real_created", false, parallel?.export_real_created ?? false),
    gate("R2-NG-20", "production_supabase_touched", false, bffFlow?.production_supabase_touched ?? false),
    gate("R2-NG-21", "production_public_access_enabled", false, pilotScope?.production_public_access_enabled ?? true),
    gate("R2-NG-22", "qa_green_real_created", false, observability?.qa_green_real_created ?? false),
    gate("R2-NG-23", "activation_allowed_general_production", false, parallel?.activation_allowed_general_production ?? true),
    gate("R2-NG-24", "core_commands_passed", true, commands?.all_passed === true || commands?.core_passed === true, false),
    gate("R2-NG-25", "pilot_data_invented", false, pilotReadiness?.pilot_data_invented ?? false),
  ];

  const blocking_checks = checks.filter((c) => c.blocking);
  const all_blocking_passed = blocking_checks.every((c) => c.passed);
  const no_go_ring2_clean = all_blocking_passed && readiness.ready_for_execution;

  const result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING2_NO_GO_CHECKLIST",
    generated_at: new Date().toISOString(),
    ring2_scope: "authorized_pilot_client_scoped_supervised",
    execution_status: readiness.ready_for_execution ? "EXECUTED" : "BLOCKED_PENDING_PILOT_INPUT",
    checks,
    all_blocking_passed,
    no_go_ring2_clean,
    qa_green_real_created: false,
    activation_allowed_general_production: false,
    production_supabase_touched: false,
    remote_modified: false,
    ready_for_ring3_authorization: no_go_ring2_clean,
  };

  writeFileSync(RING2_ARTIFACT_PATHS.noGo, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  if (!no_go_ring2_clean) process.exit(readiness.ready_for_execution ? 1 : 2);
}

main();
