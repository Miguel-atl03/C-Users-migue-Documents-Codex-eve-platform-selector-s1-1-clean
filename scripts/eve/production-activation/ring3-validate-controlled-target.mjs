#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { BLOCKED_EXIT_CODE, RING3_ARTIFACT_PATHS } from "./ring3-artifact-paths.mjs";
import { assessControlledTarget, BLOCKED_STATUS } from "./ring3-controlled-target-lib.mjs";

function main() {
  const assessment = assessControlledTarget();

  const result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING3_CONTROLLED_PRODUCTION_TARGET_REPORT",
    generated_at: new Date().toISOString(),
    ring3_scope: "controlled_production_supervised_rollback_ready",
    execution_status: assessment.ready_for_execution ? "VERIFIED" : BLOCKED_STATUS,
    ring3_authorization_verified: assessment.ring3_authorization_verified,
    authorization_ref: assessment.authorization_ref,
    ring2_accepted: assessment.ring2_accepted,
    target_classification: assessment.target_classification,
    target_permitted: assessment.target_permitted,
    controlled_target_verified: assessment.controlled_target_verified,
    supabase_url: assessment.supabase_url,
    policy_checks: assessment.policy_checks,
    policies_complete: assessment.policies_complete,
    supervisor_assigned: assessment.supervisor_assigned,
    rollback_documented: assessment.rollback_documented,
    abort_documented: assessment.abort_documented,
    observability_required: assessment.observability_required,
    rls_validated: assessment.rls_validated,
    production_public_access_enabled: assessment.production_public_access_enabled,
    broad_production_access_enabled: assessment.broad_production_access_enabled,
    unknown_remote_touched: false,
    missing_inputs: assessment.missing_inputs,
    blocked_reason: assessment.blocked_reason,
    ready_for_ring3_execution: assessment.ready_for_execution,
    activation_allowed_general_production: false,
    qa_green_real_created: false,
  };

  writeFileSync(RING3_ARTIFACT_PATHS.targetReport, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));

  if (!assessment.ready_for_execution) {
    process.exit(BLOCKED_EXIT_CODE);
  }
}

main();
