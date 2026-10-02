#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { BLOCKED_EXIT_CODE, RING4_ARTIFACT_PATHS } from "./ring4-artifact-paths.mjs";
import { assessScaleTarget, writeBlockedArtifact } from "./ring4-scale-target-lib.mjs";
import { readJsonIfExists } from "./p9a-production-activation-lib.mjs";
import { readChainContext } from "./local-activation-chain-context-lib.mjs";

function main() {
  const assessment = assessScaleTarget();
  if (!assessment.ready_for_execution) {
    const blocked = writeBlockedArtifact(
      RING4_ARTIFACT_PATHS.trafficTenantCaseAllowlist,
      "EVE_PRODUCTION_ACTIVATION_RING4_TRAFFIC_TENANT_CASE_ALLOWLIST",
      { allowlist_created: false },
    );
    console.log(JSON.stringify(blocked, null, 2));
    process.exit(BLOCKED_EXIT_CODE);
  }

  const scope = readJsonIfExists(RING4_ARTIFACT_PATHS.scaleExecutionScope);
  const chainContext = readChainContext();
  const supervisor = readJsonIfExists(RING4_ARTIFACT_PATHS.ring2SupervisorAssignment);

  const tenant_id = scope?.expanded_tenant_id ?? chainContext?.tenant_id;
  const case_id = scope?.expanded_case_id ?? chainContext?.case_id;

  const allowlist = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING4_TRAFFIC_TENANT_CASE_ALLOWLIST",
    generated_at: new Date().toISOString(),
    authorization_ref: assessment.authorization_ref,
    ring4_scope: "expanded_production_scale_governance",
    target_classification: assessment.target_classification,
    allowlist_created: true,
    traffic_ramp: {
      current_phase: scope?.traffic_ramp_phase ?? "initial_ramp",
      traffic_percentage: scope?.initial_traffic_percentage ?? 5,
      automatic_scale_up_allowed: false,
      scale_up_requires_human_authorization: true,
    },
    tenant_allowlist: {
      enforced: true,
      tenants: [
        {
          tenant_id,
          status: "approved",
          approved_by: supervisor?.supervisor_id ?? supervisor?.consultant_id ?? "supervisor",
          approved_at: new Date().toISOString(),
          ring3_baseline_inherited: true,
        },
      ],
      cross_tenant_access_forbidden: true,
      automatic_tenant_expansion_allowed: false,
    },
    case_allowlist: {
      enforced: true,
      cases: [
        {
          case_id,
          tenant_id,
          status: "approved",
          approved_by: supervisor?.supervisor_id ?? supervisor?.consultant_id ?? "supervisor",
          approved_at: new Date().toISOString(),
          ring3_baseline_inherited: true,
        },
      ],
      cross_case_access_forbidden: true,
      automatic_case_expansion_allowed: false,
    },
    operator_monitoring_required: true,
    production_public_access_enabled: false,
    activation_allowed_general_production: false,
  };

  writeFileSync(RING4_ARTIFACT_PATHS.trafficTenantCaseAllowlist, `${JSON.stringify(allowlist, null, 2)}\n`);
  console.log(JSON.stringify({ allowlist_created: true, tenant_count: 1, case_count: 1 }, null, 2));
}

main();
