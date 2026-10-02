#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { BLOCKED_EXIT_CODE, RING3_ARTIFACT_PATHS } from "./ring3-artifact-paths.mjs";
import { assessControlledTarget, writeBlockedArtifact } from "./ring3-controlled-target-lib.mjs";
import { readJsonIfExists } from "./p9a-production-activation-lib.mjs";
import { readChainContext } from "./local-activation-chain-context-lib.mjs";

function main() {
  const assessment = assessControlledTarget();
  if (!assessment.ready_for_execution) {
    const blocked = writeBlockedArtifact(
      RING3_ARTIFACT_PATHS.scopeManifest,
      "EVE_PRODUCTION_ACTIVATION_RING3_CONTROLLED_PRODUCTION_SCOPE_MANIFEST",
      { controlled_production_scope_created: false },
    );
    console.log(JSON.stringify(blocked, null, 2));
    process.exit(BLOCKED_EXIT_CODE);
  }

  const ring2Scope = readJsonIfExists(RING3_ARTIFACT_PATHS.ring2PilotScope);
  const supervisor = readJsonIfExists(RING3_ARTIFACT_PATHS.ring2SupervisorAssignment);
  const chainContext = readChainContext();
  const targetReport = readJsonIfExists(RING3_ARTIFACT_PATHS.targetReport);

  const manifest = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING3_CONTROLLED_PRODUCTION_SCOPE_MANIFEST",
    generated_at: new Date().toISOString(),
    authorization_ref: assessment.authorization_ref,
    target_classification: assessment.target_classification,
    controlled_tenant_id: ring2Scope?.pilot_tenant_id ?? chainContext?.tenant_id,
    controlled_case_id: ring2Scope?.pilot_case_id ?? chainContext?.case_id,
    controlled_run_id: ring2Scope?.pilot_run_id ?? chainContext?.run_id,
    controlled_activity_id: ring2Scope?.pilot_activity_id ?? chainContext?.activity_id,
    supervisor_id: supervisor?.supervisor_id ?? supervisor?.consultant_id,
    supervisor_assignment_ref: "docs/production-activation/ring2_supervisor_assignment.json",
    ring2_pilot_scope_ref: "docs/production-activation/ring2_pilot_scope_manifest.json",
    scope_closed: true,
    scoped_production_data_only: true,
    synthetic_business_data_used: ring2Scope?.synthetic_business_data_used ?? true,
    real_external_client_data_used: false,
    production_public_access_enabled: false,
    broad_production_access_enabled: false,
    diagnosis_allowed: false,
    external_export_allowed: false,
    human_supervision_required: true,
    consultant_review_required: true,
    rollback_ready: true,
    abort_ready: true,
    observability_active: true,
    ring3_scope: "controlled_production_supervised_rollback_ready",
    target_report_ref: "docs/production-activation/ring3_controlled_production_target_report.json",
    primary_activities_selected: ring2Scope?.primary_activities_selected ?? [],
    workmap_scope: ring2Scope?.workmap_scope ?? null,
  };

  writeFileSync(RING3_ARTIFACT_PATHS.scopeManifest, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        controlled_production_scope_created: true,
        controlled_tenant_id: manifest.controlled_tenant_id,
        target_classification: targetReport?.target_classification ?? assessment.target_classification,
      },
      null,
      2,
    ),
  );
}

main();
