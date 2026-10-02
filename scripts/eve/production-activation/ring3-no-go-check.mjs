#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { BLOCKED_EXIT_CODE, RING3_ARTIFACT_PATHS, repoRoot } from "./ring3-artifact-paths.mjs";
import { assessControlledTarget, BLOCKED_STATUS } from "./ring3-controlled-target-lib.mjs";
import { readJsonIfExists } from "./p9a-production-activation-lib.mjs";

function gate(id, check, expectedValue, actualValue, blocking = true) {
  const passed = actualValue === expectedValue;
  return { id, check, expected: expectedValue, actual: actualValue, passed, blocking };
}

function main() {
  const assessment = assessControlledTarget();
  const ring3Auth = readJsonIfExists(join(repoRoot, "docs/production-activation/ring3_authorization_record.json"));
  const targetReport = readJsonIfExists(RING3_ARTIFACT_PATHS.targetReport);
  const scope = readJsonIfExists(RING3_ARTIFACT_PATHS.scopeManifest);
  const mba = readJsonIfExists(RING3_ARTIFACT_PATHS.mbaConformance);
  const structural = readJsonIfExists(RING3_ARTIFACT_PATHS.structuralCoverage);
  const clientUi = readJsonIfExists(RING3_ARTIFACT_PATHS.clientUiFlow);
  const bffFlow = readJsonIfExists(RING3_ARTIFACT_PATHS.bffRuntimeFlow);
  const inventory = readJsonIfExists(RING3_ARTIFACT_PATHS.runtimeRecordInventory);
  const gateReadiness = readJsonIfExists(RING3_ARTIFACT_PATHS.gateReadiness);
  const client = readJsonIfExists(RING3_ARTIFACT_PATHS.clientSafeResult);
  const consultant = readJsonIfExists(RING3_ARTIFACT_PATHS.consultantPacket);
  const parallel = readJsonIfExists(RING3_ARTIFACT_PATHS.parallelPayload);
  const observability = readJsonIfExists(RING3_ARTIFACT_PATHS.observability);
  const rollback = readJsonIfExists(RING3_ARTIFACT_PATHS.rollback);
  const abort = readJsonIfExists(RING3_ARTIFACT_PATHS.abort);
  const commands = readJsonIfExists(RING3_ARTIFACT_PATHS.commandResults);

  const checks = [
    gate("R3-NG-01", "ring3_authorized", true, ring3Auth?.ring3_authorized === true),
    gate("R3-NG-02", "controlled_target_verified", true, assessment.controlled_target_verified === true),
    gate("R3-NG-03", "target_classification_not_unknown", true, !["unknown", "production_unknown"].includes(assessment.target_classification)),
    gate("R3-NG-04", "controlled_production_scope_created", true, scope?.scope_closed === true),
    gate("R3-NG-05", "supervisor_assigned", true, assessment.supervisor_assigned === true),
    gate("R3-NG-06", "mba_conformance_passed", true, mba?.mba_conformance_passed === true),
    gate("R3-NG-07", "structural_framework_coverage_passed", true, structural?.structural_framework_coverage_passed === true),
    gate("R3-NG-08", "client_ui_flow_passed", true, clientUi?.client_ui_flow_passed === true),
    gate("R3-NG-09", "bff_runtime_flow_passed", true, bffFlow?.bff_runtime_flow_passed === true),
    gate("R3-NG-10", "runtime_records_created_controlled_target", true, inventory?.runtime_records_created_controlled_target === true),
    gate("R3-NG-11", "gates_readiness_passed", true, gateReadiness?.gates_readiness_passed === true),
    gate("R3-NG-12", "client_safe_result_passed", true, client?.client_safe_result_passed === true),
    gate("R3-NG-13", "consultant_packet_supervised", true, consultant?.consultant_packet_supervised === true),
    gate("R3-NG-14", "parallel_payload_controlled_rehearsal_passed", true, parallel?.parallel_payload_controlled_rehearsal_passed === true),
    gate("R3-NG-15", "observability_passed", true, observability?.observability_passed === true),
    gate("R3-NG-16", "rollback_drill_passed", true, rollback?.rollback_drill_passed === true),
    gate("R3-NG-17", "abort_drill_passed", true, abort?.abort_drill_passed === true),
    gate("R3-NG-18", "diagnosis_created", false, client?.diagnosis_created ?? false),
    gate("R3-NG-19", "export_real_created", false, parallel?.export_real_created ?? false),
    gate("R3-NG-20", "production_supabase_touched", false, bffFlow?.production_supabase_touched ?? false),
    gate("R3-NG-21", "unknown_remote_touched", false, bffFlow?.unknown_remote_touched ?? false),
    gate("R3-NG-22", "production_public_access_enabled", false, scope?.production_public_access_enabled ?? true),
    gate("R3-NG-23", "broad_production_access_enabled", false, scope?.broad_production_access_enabled ?? true),
    gate("R3-NG-24", "qa_green_real_created", false, observability?.qa_green_real_created ?? false),
    gate("R3-NG-25", "activation_allowed_general_production", false, parallel?.activation_allowed_general_production ?? true),
    gate("R3-NG-26", "core_commands_passed", true, commands?.all_passed === true || commands?.core_passed === true, false),
    gate("R3-NG-27", "rollback_documented", true, assessment.rollback_documented === true),
    gate("R3-NG-28", "abort_documented", true, assessment.abort_documented === true),
    gate("R3-NG-29", "observability_required", true, assessment.observability_required === true),
    gate("R3-NG-30", "rls_validated", true, assessment.rls_validated === true),
  ];

  const blocking_checks = checks.filter((c) => c.blocking);
  const all_blocking_passed = blocking_checks.every((c) => c.passed);
  const no_go_ring3_clean = all_blocking_passed && assessment.ready_for_execution;

  const result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING3_NO_GO_CHECKLIST",
    generated_at: new Date().toISOString(),
    ring3_scope: "controlled_production_supervised_rollback_ready",
    target_classification: assessment.target_classification,
    execution_status: assessment.ready_for_execution ? "EXECUTED" : BLOCKED_STATUS,
    checks,
    all_blocking_passed,
    no_go_ring3_clean,
    qa_green_real_created: false,
    activation_allowed_general_production: false,
    production_supabase_touched: false,
    unknown_remote_touched: false,
    remote_modified: false,
    ready_for_ring4_authorization: no_go_ring3_clean,
  };

  writeFileSync(RING3_ARTIFACT_PATHS.noGo, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  if (!no_go_ring3_clean) process.exit(assessment.ready_for_execution ? 1 : BLOCKED_EXIT_CODE);
}

main();
