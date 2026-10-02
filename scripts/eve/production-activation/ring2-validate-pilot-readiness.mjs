#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { RING2_ARTIFACT_PATHS } from "./ring2-artifact-paths.mjs";
import { assessPilotReadiness, BLOCKED_STATUS } from "./ring2-pilot-readiness-lib.mjs";

function main() {
  const assessment = assessPilotReadiness();

  const result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING2_PILOT_READINESS",
    generated_at: new Date().toISOString(),
    ring2_scope: "authorized_pilot_client_scoped_supervised",
    execution_status: assessment.ready_for_execution ? "READY" : BLOCKED_STATUS,
    policy_checks: assessment.policy_checks,
    policies_complete: assessment.policies_complete,
    ring2_authorization_verified: assessment.ring2_authorization_verified,
    authorization_ref: assessment.authorization_ref,
    pilot_readiness_verified: assessment.pilot_readiness_verified,
    pilot_consent_verified: assessment.pilot_consent_verified,
    supervisor_assigned: assessment.supervisor_assigned,
    pilot_scope_created: assessment.pilot_scope_created,
    pilot_client_present: assessment.pilot_client_present,
    real_external_client_data_authorized_and_scoped:
      assessment.real_external_client_data_authorized_and_scoped,
    missing_inputs: assessment.missing_inputs,
    blocked_reason: assessment.blocked_reason,
    ready_for_ring2_execution: assessment.ready_for_execution,
    production_public_access_enabled: false,
    activation_allowed_general_production: false,
    pilot_data_invented: false,
    instructions:
      "Provide ring2_pilot_client_manifest.json, ring2_pilot_consent_record.json, and ring2_supervisor_assignment.json with real authorized pilot data before execution.",
  };

  writeFileSync(RING2_ARTIFACT_PATHS.pilotReadiness, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));

  if (!assessment.ready_for_execution) {
    process.exit(2);
  }
}

main();
