#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { BLOCKED_EXIT_CODE, RING4_ARTIFACT_PATHS } from "./ring4-artifact-paths.mjs";
import { assessScaleTarget, BLOCKED_STATUS } from "./ring4-scale-target-lib.mjs";

function main() {
  const assessment = assessScaleTarget();

  const result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING4_SCALE_TARGET_REPORT",
    generated_at: new Date().toISOString(),
    ring4_scope: "expanded_production_scale_governance",
    execution_status: assessment.ready_for_execution ? "VERIFIED" : BLOCKED_STATUS,
    ring4_authorization_verified: assessment.ring4_authorization_verified,
    authorization_ref: assessment.authorization_ref,
    ring3_accepted: assessment.ring3_accepted,
    ring3_no_go_clean: assessment.ring3_no_go_clean,
    target_classification: assessment.target_classification,
    target_permitted: assessment.target_permitted,
    scale_target_verified: assessment.scale_target_verified,
    supabase_url: assessment.supabase_url,
    policy_checks: assessment.policy_checks,
    policies_complete: assessment.policies_complete,
    supervisor_assigned: assessment.supervisor_assigned,
    rollback_documented: assessment.rollback_documented,
    abort_documented: assessment.abort_documented,
    observability_required: assessment.observability_required,
    slo_defined: assessment.slo_defined,
    incident_owner_defined: assessment.incident_owner_defined,
    allowlists_required: assessment.allowlists_required,
    scale_governance_defined: assessment.scale_governance_defined,
    rls_validated: assessment.rls_validated,
    production_public_access_enabled: assessment.production_public_access_enabled,
    broad_production_access_enabled: assessment.broad_production_access_enabled,
    automatic_scale_up_allowed: assessment.automatic_scale_up_allowed,
    unknown_remote_touched: false,
    missing_inputs: assessment.missing_inputs,
    blocked_reason: assessment.blocked_reason,
    ready_for_ring4_execution: assessment.ready_for_execution,
    activation_allowed_general_production: false,
    qa_green_real_created: false,
  };

  writeFileSync(RING4_ARTIFACT_PATHS.scaleTargetReport, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));

  if (!assessment.ready_for_execution) {
    process.exit(BLOCKED_EXIT_CODE);
  }
}

main();
