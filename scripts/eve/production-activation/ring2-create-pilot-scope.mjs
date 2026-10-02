#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { BLOCKED_EXIT_CODE, RING2_ARTIFACT_PATHS } from "./ring2-artifact-paths.mjs";
import { assessPilotReadiness, writeBlockedArtifact } from "./ring2-pilot-readiness-lib.mjs";
import { readJsonIfExists } from "./p9a-production-activation-lib.mjs";

function main() {
  const readiness = assessPilotReadiness();
  if (!readiness.ready_for_execution) {
    const blocked = writeBlockedArtifact(
      RING2_ARTIFACT_PATHS.pilotScopeManifest,
      "EVE_PRODUCTION_ACTIVATION_RING2_PILOT_SCOPE_MANIFEST",
      { pilot_scope_created: false },
    );
    console.log(JSON.stringify(blocked, null, 2));
    process.exit(BLOCKED_EXIT_CODE);
  }

  const pilot = readJsonIfExists(RING2_ARTIFACT_PATHS.pilotClientManifest);
  const consent = readJsonIfExists(RING2_ARTIFACT_PATHS.pilotConsentRecord);
  const supervisor = readJsonIfExists(RING2_ARTIFACT_PATHS.supervisorAssignment);

  const existingScope = readJsonIfExists(RING2_ARTIFACT_PATHS.pilotScopeManifest);

  const manifest = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING2_PILOT_SCOPE_MANIFEST",
    generated_at: new Date().toISOString(),
    authorization_ref: readiness.authorization_ref,
    pilot_tenant_id: pilot.pilot_tenant_id,
    pilot_case_id: pilot.pilot_case_id,
    pilot_run_id: pilot.pilot_run_id ?? crypto.randomUUID(),
    pilot_activity_id: pilot.pilot_activity_id ?? null,
    pilot_client_id: pilot.pilot_client_id,
    pilot_client_name: pilot.pilot_client_name ?? existingScope?.pilot_client_name ?? null,
    pilot_client_type: pilot.pilot_client_type ?? existingScope?.pilot_client_type ?? null,
    is_external_pilot_client: pilot.is_external_pilot_client ?? existingScope?.is_external_pilot_client ?? null,
    is_simulated_external_client:
      pilot.is_simulated_external_client ?? existingScope?.is_simulated_external_client ?? null,
    real_external_client_data_used:
      pilot.real_external_client_data_used ?? existingScope?.real_external_client_data_used ?? false,
    synthetic_business_data_used:
      pilot.synthetic_business_data_used ?? existingScope?.synthetic_business_data_used ?? true,
    consent_record_ref: "docs/production-activation/ring2_pilot_consent_record.json",
    supervisor_assignment_ref: "docs/production-activation/ring2_supervisor_assignment.json",
    scope_closed: true,
    scoped_pilot_data_only: true,
    production_public_access_enabled: false,
    diagnosis_allowed: false,
    external_export_allowed: false,
    supervisor_id: supervisor.supervisor_id ?? supervisor.consultant_id,
    consent_verified: consent.consent_verified === true,
    ring2_execution_mode:
      pilot.ring2_execution_mode ?? existingScope?.ring2_execution_mode ?? "external_simulated_pilot_controlled_execution",
    ring2_scope: "authorized_pilot_client_scoped_supervised",
    workmap_scope: pilot.workmap_scope ?? existingScope?.workmap_scope ?? null,
    primary_activities_selected:
      pilot.primary_activities_selected ?? existingScope?.primary_activities_selected ?? [],
  };

  writeFileSync(RING2_ARTIFACT_PATHS.pilotScopeManifest, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify({ pilot_scope_created: true, pilot_tenant_id: manifest.pilot_tenant_id }, null, 2));
}

main();
