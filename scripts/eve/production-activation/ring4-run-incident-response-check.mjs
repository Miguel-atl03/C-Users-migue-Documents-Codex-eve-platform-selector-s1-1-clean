#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { BLOCKED_EXIT_CODE, RING4_ARTIFACT_PATHS, RING4_POLICY_PATHS } from "./ring4-artifact-paths.mjs";
import { assessScaleTarget, writeBlockedArtifact } from "./ring4-scale-target-lib.mjs";
import { readJsonIfExists } from "./p9a-production-activation-lib.mjs";

function main() {
  const assessment = assessScaleTarget();
  if (!assessment.ready_for_execution) {
    writeBlockedArtifact(RING4_ARTIFACT_PATHS.incidentResponse, "EVE_PRODUCTION_ACTIVATION_RING4_INCIDENT_RESPONSE", {
      incident_response_passed: false,
    });
    process.exit(BLOCKED_EXIT_CODE);
  }

  const incidentPolicy = readJsonIfExists(RING4_POLICY_PATHS.incidentResponse);
  const rollbackAbort = readJsonIfExists(RING4_POLICY_PATHS.rollbackAbortRequirements);
  const supervisor = readJsonIfExists(RING4_ARTIFACT_PATHS.ring2SupervisorAssignment);
  const observability = readJsonIfExists(RING4_ARTIFACT_PATHS.observabilitySlo);

  const severity_levels_defined =
    Array.isArray(incidentPolicy?.incident_severity_levels) && incidentPolicy.incident_severity_levels.length >= 4;
  const procedures_defined =
    Array.isArray(incidentPolicy?.incident_response_procedures) &&
    incidentPolicy.incident_response_procedures.length >= 10;
  const escalation_path_defined =
    Boolean(incidentPolicy?.escalation_path?.operator) &&
    Boolean(incidentPolicy?.escalation_path?.supervisor) &&
    Boolean(incidentPolicy?.escalation_path?.consultant);
  const incident_owner_assigned = assessment.supervisor_assigned === true;
  const rollback_on_sev12 = incidentPolicy?.incident_response_procedures?.some(
    (p) => p.procedure === "evaluate_rollback_on_sev1_sev2",
  );
  const abort_on_sev1 = incidentPolicy?.incident_response_procedures?.some(
    (p) => p.procedure === "evaluate_abort_on_sev1",
  );
  const scale_pause_on_incident = incidentPolicy?.incident_severity_levels?.some(
    (s) => s.severity === "critical" && s.scale_pause === true,
  );
  const ring3_drills_passed =
    incidentPolicy?.ring3_baseline?.abort_drill_passed === true &&
    incidentPolicy?.ring3_baseline?.rollback_drill_passed === true;
  const rollback_abort_documented = rollbackAbort?.rollback_required === true && rollbackAbort?.abort_required === true;

  const incident_response_passed =
    severity_levels_defined &&
    procedures_defined &&
    escalation_path_defined &&
    incident_owner_assigned &&
    rollback_on_sev12 &&
    abort_on_sev1 &&
    scale_pause_on_incident &&
    ring3_drills_passed &&
    rollback_abort_documented &&
    (observability?.observability_passed === true || observability == null);

  const result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING4_INCIDENT_RESPONSE",
    generated_at: new Date().toISOString(),
    ring4_scope: "expanded_production_scale_governance",
    target_classification: assessment.target_classification,
    severity_levels_defined,
    procedures_defined,
    escalation_path_defined,
    incident_owner_assigned,
    incident_owner: supervisor?.supervisor_id ?? supervisor?.consultant_id ?? null,
    rollback_on_sev12,
    abort_on_sev1,
    scale_pause_on_incident,
    ring3_drills_passed,
    rollback_abort_documented,
    incident_response_passed,
    incident_response_drill_passed: incident_response_passed,
    activation_allowed_general_production: false,
    automatic_scale_up_allowed: false,
    production_supabase_touched: false,
    unknown_remote_touched: false,
  };

  writeFileSync(RING4_ARTIFACT_PATHS.incidentResponse, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  if (!incident_response_passed) process.exit(1);
}

main();
