#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { BLOCKED_EXIT_CODE, RING4_ARTIFACT_PATHS, RING4_POLICY_PATHS, repoRoot } from "./ring4-artifact-paths.mjs";
import { assessScaleTarget, writeBlockedArtifact } from "./ring4-scale-target-lib.mjs";
import { readJsonIfExists } from "./p9a-production-activation-lib.mjs";
import { readChainContext } from "./local-activation-chain-context-lib.mjs";

function main() {
  const assessment = assessScaleTarget();
  if (!assessment.ready_for_execution) {
    const blocked = writeBlockedArtifact(
      RING4_ARTIFACT_PATHS.scaleExecutionScope,
      "EVE_PRODUCTION_ACTIVATION_RING4_SCALE_EXECUTION_SCOPE_MANIFEST",
      { scale_execution_scope_created: false },
    );
    console.log(JSON.stringify(blocked, null, 2));
    process.exit(BLOCKED_EXIT_CODE);
  }

  const ring3Scope = readJsonIfExists(RING4_ARTIFACT_PATHS.ring3ScopeManifest);
  const supervisor = readJsonIfExists(RING4_ARTIFACT_PATHS.ring2SupervisorAssignment);
  const chainContext = readChainContext();
  const targetReport = readJsonIfExists(RING4_ARTIFACT_PATHS.scaleTargetReport);
  const rampPolicy = readJsonIfExists(RING4_POLICY_PATHS.trafficTenantCaseRamp);

  const manifest = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING4_SCALE_EXECUTION_SCOPE_MANIFEST",
    generated_at: new Date().toISOString(),
    authorization_ref: assessment.authorization_ref,
    target_classification: assessment.target_classification,
    expanded_tenant_id: ring3Scope?.controlled_tenant_id ?? chainContext?.tenant_id,
    expanded_case_id: ring3Scope?.controlled_case_id ?? chainContext?.case_id,
    expanded_run_id: ring3Scope?.controlled_run_id ?? chainContext?.run_id,
    expanded_activity_id: ring3Scope?.controlled_activity_id ?? chainContext?.activity_id,
    supervisor_id: supervisor?.supervisor_id ?? supervisor?.consultant_id,
    supervisor_assignment_ref: "docs/production-activation/ring2_supervisor_assignment.json",
    ring3_scope_ref: "docs/production-activation/ring3_controlled_production_scope_manifest.json",
    scope_closed: true,
    scoped_production_data_only: true,
    synthetic_business_data_used: ring3Scope?.synthetic_business_data_used ?? true,
    real_external_client_data_used: false,
    production_public_access_enabled: false,
    broad_production_access_enabled: false,
    automatic_scale_up_allowed: false,
    diagnosis_allowed: false,
    external_export_allowed: false,
    human_supervision_required: true,
    consultant_review_required: true,
    rollback_ready: true,
    abort_ready: true,
    observability_active: true,
    traffic_ramp_phase: rampPolicy?.ramp_phases?.[1]?.phase ?? "initial_ramp",
    initial_traffic_percentage: 5,
    ring4_scope: "expanded_production_scale_governance",
    target_report_ref: "docs/production-activation/ring4_scale_target_report.json",
    primary_activities_selected: ring3Scope?.primary_activities_selected ?? [],
    workmap_scope: ring3Scope?.workmap_scope ?? null,
  };

  writeFileSync(RING4_ARTIFACT_PATHS.scaleExecutionScope, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        scale_execution_scope_created: true,
        expanded_tenant_id: manifest.expanded_tenant_id,
        target_classification: targetReport?.target_classification ?? assessment.target_classification,
      },
      null,
      2,
    ),
  );
}

main();
