#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { BLOCKED_EXIT_CODE, RING4_ARTIFACT_PATHS, repoRoot } from "./ring4-artifact-paths.mjs";
import { assessScaleTarget, BLOCKED_STATUS } from "./ring4-scale-target-lib.mjs";
import { readJsonIfExists } from "./p9a-production-activation-lib.mjs";

function gate(id, check, expectedValue, actualValue, blocking = true) {
  const passed = actualValue === expectedValue;
  return { id, check, expected: expectedValue, actual: actualValue, passed, blocking };
}

function main() {
  const assessment = assessScaleTarget();
  const ring4Auth = readJsonIfExists(join(repoRoot, "docs/production-activation/ring4_authorization_record.json"));
  const targetReport = readJsonIfExists(RING4_ARTIFACT_PATHS.scaleTargetReport);
  const scope = readJsonIfExists(RING4_ARTIFACT_PATHS.scaleExecutionScope);
  const mba = readJsonIfExists(RING4_ARTIFACT_PATHS.mbaConformance);
  const structural = readJsonIfExists(RING4_ARTIFACT_PATHS.structuralCoverage);
  const clientUi = readJsonIfExists(RING4_ARTIFACT_PATHS.clientUiFlow);
  const bffFlow = readJsonIfExists(RING4_ARTIFACT_PATHS.bffRuntimeFlow);
  const inventory = readJsonIfExists(RING4_ARTIFACT_PATHS.runtimeRecordInventory);
  const gateReadiness = readJsonIfExists(RING4_ARTIFACT_PATHS.gateReadiness);
  const client = readJsonIfExists(RING4_ARTIFACT_PATHS.clientSafeResult);
  const consultant = readJsonIfExists(RING4_ARTIFACT_PATHS.consultantPacket);
  const parallel = readJsonIfExists(RING4_ARTIFACT_PATHS.parallelPayload);
  const observability = readJsonIfExists(RING4_ARTIFACT_PATHS.observabilitySlo);
  const incidentResponse = readJsonIfExists(RING4_ARTIFACT_PATHS.incidentResponse);
  const allowlist = readJsonIfExists(RING4_ARTIFACT_PATHS.trafficTenantCaseAllowlist);
  const rollback = readJsonIfExists(RING4_ARTIFACT_PATHS.rollback);
  const abort = readJsonIfExists(RING4_ARTIFACT_PATHS.abort);
  const commands = readJsonIfExists(RING4_ARTIFACT_PATHS.commandResults);

  const checks = [
    gate("R4-NG-01", "ring4_authorized", true, ring4Auth?.ring4_authorized === true),
    gate("R4-NG-02", "scale_target_verified", true, assessment.scale_target_verified === true),
    gate("R4-NG-03", "target_classification_not_unknown", true, !["unknown", "production_unknown"].includes(assessment.target_classification)),
    gate("R4-NG-04", "scale_execution_scope_created", true, scope?.scope_closed === true),
    gate("R4-NG-05", "supervisor_assigned", true, assessment.supervisor_assigned === true),
    gate("R4-NG-06", "mba_conformance_passed", true, mba?.mba_conformance_passed === true),
    gate("R4-NG-07", "structural_framework_coverage_passed", true, structural?.structural_framework_coverage_passed === true),
    gate("R4-NG-08", "client_ui_flow_passed", true, clientUi?.client_ui_flow_passed === true),
    gate("R4-NG-09", "bff_runtime_flow_passed", true, bffFlow?.bff_runtime_flow_passed === true),
    gate("R4-NG-10", "runtime_records_created_expanded_target", true, inventory?.runtime_records_created_expanded_target === true),
    gate("R4-NG-11", "gates_readiness_passed", true, gateReadiness?.gates_readiness_passed === true),
    gate("R4-NG-12", "client_safe_result_passed", true, client?.client_safe_result_passed === true),
    gate("R4-NG-13", "consultant_packet_supervised", true, consultant?.consultant_packet_supervised === true),
    gate("R4-NG-14", "parallel_payload_controlled_rehearsal_passed", true, parallel?.parallel_payload_controlled_rehearsal_passed === true),
    gate("R4-NG-15", "observability_slo_passed", true, observability?.observability_slo_passed === true),
    gate("R4-NG-16", "incident_response_passed", true, incidentResponse?.incident_response_passed === true),
    gate("R4-NG-17", "traffic_tenant_case_allowlist_created", true, allowlist?.allowlist_created === true),
    gate("R4-NG-18", "rollback_drill_passed", true, rollback?.rollback_drill_passed === true),
    gate("R4-NG-19", "abort_drill_passed", true, abort?.abort_drill_passed === true),
    gate("R4-NG-20", "diagnosis_created", false, client?.diagnosis_created ?? false),
    gate("R4-NG-21", "export_real_created", false, parallel?.export_real_created ?? false),
    gate("R4-NG-22", "production_supabase_touched", false, bffFlow?.production_supabase_touched ?? false),
    gate("R4-NG-23", "unknown_remote_touched", false, bffFlow?.unknown_remote_touched ?? false),
    gate("R4-NG-24", "production_public_access_enabled", false, scope?.production_public_access_enabled ?? true),
    gate("R4-NG-25", "broad_production_access_enabled", false, scope?.broad_production_access_enabled ?? true),
    gate("R4-NG-26", "automatic_scale_up_allowed", false, scope?.automatic_scale_up_allowed ?? true),
    gate("R4-NG-27", "qa_green_real_created", false, observability?.qa_green_real_created ?? false),
    gate("R4-NG-28", "activation_allowed_general_production", false, parallel?.activation_allowed_general_production ?? true),
    gate("R4-NG-29", "core_commands_passed", true, commands?.all_passed === true || commands?.core_passed === true, false),
    gate("R4-NG-30", "rollback_documented", true, assessment.rollback_documented === true),
    gate("R4-NG-31", "abort_documented", true, assessment.abort_documented === true),
    gate("R4-NG-32", "observability_required", true, assessment.observability_required === true),
    gate("R4-NG-33", "incident_owner_defined", true, assessment.incident_owner_defined === true),
    gate("R4-NG-34", "rls_validated", true, assessment.rls_validated === true),
  ];

  const blocking_checks = checks.filter((c) => c.blocking);
  const all_blocking_passed = blocking_checks.every((c) => c.passed);
  const no_go_ring4_clean = all_blocking_passed && assessment.ready_for_execution;

  const result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING4_NO_GO_CHECKLIST",
    generated_at: new Date().toISOString(),
    ring4_scope: "expanded_production_scale_governance",
    target_classification: assessment.target_classification,
    execution_status: assessment.ready_for_execution ? "EXECUTED" : BLOCKED_STATUS,
    checks,
    all_blocking_passed,
    no_go_ring4_clean,
    qa_green_real_created: false,
    activation_allowed_general_production: false,
    production_supabase_touched: false,
    unknown_remote_touched: false,
    remote_modified: false,
    ready_for_ring5_authorization: no_go_ring4_clean,
  };

  writeFileSync(RING4_ARTIFACT_PATHS.noGo, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  if (!no_go_ring4_clean) process.exit(assessment.ready_for_execution ? 1 : BLOCKED_EXIT_CODE);
}

main();
