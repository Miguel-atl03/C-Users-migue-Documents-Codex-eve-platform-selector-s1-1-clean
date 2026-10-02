#!/usr/bin/env node
import { existsSync, writeFileSync } from "node:fs";
import {
  RING2_ARTIFACT_PATHS,
  RING2_POLICY_PATHS,
  repoRoot,
} from "./ring2-artifact-paths.mjs";
import { readJsonIfExists } from "./p9a-production-activation-lib.mjs";

export const BLOCKED_STATUS = "BLOCKED_PENDING_PILOT_INPUT";

export function assessPilotReadiness() {
  const policyChecks = Object.entries(RING2_POLICY_PATHS).map(([key, path]) => ({
    key,
    path: path.replace(repoRoot, "").replace(/\\/g, "/").replace(/^\//, ""),
    exists: existsSync(path),
  }));

  const policiesComplete = policyChecks.every((c) => c.exists);

  const ring2Auth = readJsonIfExists(RING2_POLICY_PATHS.authorization);
  const ring2Authorized = ring2Auth?.ring2_authorized === true;

  const pilotManifest = readJsonIfExists(RING2_ARTIFACT_PATHS.pilotClientManifest);
  const consentRecord = readJsonIfExists(RING2_ARTIFACT_PATHS.pilotConsentRecord);
  const supervisorAssignment = readJsonIfExists(RING2_ARTIFACT_PATHS.supervisorAssignment);
  const pilotScope = readJsonIfExists(RING2_ARTIFACT_PATHS.pilotScopeManifest);

  const pilotClientPresent =
    Boolean(pilotManifest?.pilot_client_id) &&
    pilotManifest?.authorized_pilot_client === true &&
    !pilotManifest?.invented;

  const consentVerified =
    consentRecord?.consent_verified === true &&
    consentRecord?.data_boundary_acknowledged === true &&
    !consentRecord?.invented;

  const supervisorAssigned =
    Boolean(supervisorAssignment?.supervisor_id || supervisorAssignment?.consultant_id) &&
    supervisorAssignment?.assigned === true &&
    !supervisorAssignment?.invented;

  const pilotScopeCreated =
    Boolean(pilotScope?.pilot_tenant_id && pilotScope?.pilot_case_id && pilotScope?.pilot_run_id) &&
    pilotScope?.scope_closed === true;

  const missing = [];
  if (!policiesComplete) {
    missing.push(...policyChecks.filter((c) => !c.exists).map((c) => c.key));
  }
  if (!ring2Authorized) missing.push("ring2_authorization");
  if (!pilotClientPresent) missing.push("pilot_client_manifest");
  if (!consentVerified) missing.push("pilot_consent_record");
  if (!supervisorAssigned) missing.push("supervisor_assignment");
  if (!pilotScopeCreated) missing.push("pilot_scope_manifest");

  const pilot_readiness_verified = pilotClientPresent && consentVerified && supervisorAssigned;
  const ready_for_execution =
    policiesComplete && ring2Authorized && pilot_readiness_verified && pilotScopeCreated;

  const status = ready_for_execution ? "READY" : BLOCKED_STATUS;

  return {
    status,
    ready_for_execution,
    policies_complete: policiesComplete,
    policy_checks: policyChecks,
    ring2_authorization_verified: ring2Authorized,
    authorization_ref: ring2Auth?.authorization_ref ?? null,
    pilot_readiness_verified,
    pilot_consent_verified: consentVerified,
    supervisor_assigned: supervisorAssigned,
    pilot_scope_created: pilotScopeCreated,
    pilot_client_present: pilotClientPresent,
    real_external_client_data_authorized_and_scoped:
      pilotClientPresent && consentVerified && pilotScopeCreated,
    missing_inputs: missing,
    blocked_reason: ready_for_execution
      ? null
      : "Missing authorized pilot client, documented consent, or assigned supervisor. Pilot manifests must be provided externally; system will not invent pilot data.",
    production_public_access_enabled: false,
    activation_allowed_general_production: false,
  };
}

export function writeBlockedArtifact(path, dictamen, extra = {}) {
  const readiness = assessPilotReadiness();
  const payload = {
    dictamen,
    generated_at: new Date().toISOString(),
    ring2_scope: "authorized_pilot_client_scoped_supervised",
    execution_status: BLOCKED_STATUS,
    blocked: true,
    blocked_reason: readiness.blocked_reason,
    missing_inputs: readiness.missing_inputs,
    pilot_readiness_verified: false,
    ...extra,
  };
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`);
  return payload;
}
