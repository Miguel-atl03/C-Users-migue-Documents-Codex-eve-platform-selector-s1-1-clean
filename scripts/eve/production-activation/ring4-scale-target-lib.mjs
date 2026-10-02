#!/usr/bin/env node
import { existsSync, writeFileSync } from "node:fs";
import {
  RING4_ARTIFACT_PATHS,
  RING4_POLICY_PATHS,
  repoRoot,
} from "./ring4-artifact-paths.mjs";
import { readEnvLocal, readJsonIfExists } from "./p9a-production-activation-lib.mjs";

export const BLOCKED_STATUS = "BLOCKED_PENDING_RING4_SCALE_TARGET";

export function classifyScaleTarget(env = {}) {
  const explicit = env.EVE_RING4_TARGET_CLASSIFICATION ?? "";
  if (explicit) return explicit;

  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL ?? "";
  if (!url) return "local";
  if (/127\.0\.0\.1|localhost/i.test(url)) return "local";
  if (/staging/i.test(url)) return "staging_explicit";
  if (/preview|vercel\.app/i.test(url)) return "preview_explicit";
  if (env.EVE_RING4_EXPANDED_PRODUCTION_TARGET_APPROVED === "true") {
    return "expanded_production_explicit";
  }
  if (env.EVE_RING4_CONTROLLED_PRODUCTION_TARGET_APPROVED === "true") {
    return "controlled_production_explicit";
  }
  if (/supabase\.co/i.test(url)) return "production_unknown";
  return "unknown";
}

export function isScaleTargetPermitted(classification, env = {}) {
  switch (classification) {
    case "local":
      return /127\.0\.0\.1|localhost/i.test(
        env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL ?? "http://127.0.0.1:54321",
      );
    case "staging_explicit":
    case "preview_explicit":
    case "controlled_production_explicit":
    case "expanded_production_explicit":
      return true;
    case "production_unknown":
    case "unknown":
    default:
      return false;
  }
}

export function assessScaleTarget() {
  const env = { ...readEnvLocal(), ...process.env };
  const policyChecks = Object.entries(RING4_POLICY_PATHS).map(([key, path]) => ({
    key,
    path: path.replace(repoRoot, "").replace(/\\/g, "/").replace(/^\//, ""),
    exists: existsSync(path),
  }));
  const policiesComplete = policyChecks.every((c) => c.exists);

  const ring4Auth = readJsonIfExists(RING4_POLICY_PATHS.authorization);
  const ring4Authorized = ring4Auth?.ring4_authorized === true;
  const ring3Readiness = readJsonIfExists(RING4_ARTIFACT_PATHS.ring3NextRingReadiness);
  const ring3Accepted =
    ring3Readiness?.ring3_execution_completed === true &&
    ring3Readiness?.ready_for_ring4_authorization === true;
  const ring3NoGo = readJsonIfExists(RING4_ARTIFACT_PATHS.ring3NoGo);
  const ring3NoGoClean = ring3NoGo?.no_go_ring3_clean === true || ring4Auth?.ring3_no_go_clean === true;
  const supervisor = readJsonIfExists(RING4_ARTIFACT_PATHS.ring2SupervisorAssignment);
  const rollbackReq = readJsonIfExists(RING4_POLICY_PATHS.rollbackAbortRequirements);
  const observabilitySlo = readJsonIfExists(RING4_POLICY_PATHS.observabilitySlo);
  const incidentResponse = readJsonIfExists(RING4_POLICY_PATHS.incidentResponse);
  const rampPolicy = readJsonIfExists(RING4_POLICY_PATHS.trafficTenantCaseRamp);
  const scaleGovernance = readJsonIfExists(RING4_POLICY_PATHS.scaleGovernance);

  const target_classification = classifyScaleTarget(env);
  const target_permitted = isScaleTargetPermitted(target_classification, env);
  const rollback_documented = rollbackReq?.rollback_required === true;
  const abort_documented = rollbackReq?.abort_required === true;
  const observability_required = observabilitySlo?.observability_required === true;
  const slo_defined = observabilitySlo?.slo_required === true;
  const incident_owner_defined =
    Boolean(incidentResponse?.escalation_path?.operator) &&
    Boolean(incidentResponse?.escalation_path?.supervisor) &&
    incidentResponse?.incident_response_required === true;
  const allowlists_required =
    rampPolicy?.tenant_allowlist_required === true && rampPolicy?.case_allowlist_required === true;
  const scale_governance_defined = scaleGovernance?.gradual_scale_required === true;
  const supervisor_assigned =
    Boolean(supervisor?.supervisor_id || supervisor?.consultant_id) &&
    supervisor?.assigned === true;
  const rls_validated =
    readJsonIfExists(RING4_POLICY_PATHS.productionDataBoundary)?.rls_required === true;
  const public_access_enabled = ring4Auth?.public_broad_access_enabled === true;
  const automatic_scale_up = rampPolicy?.automatic_scale_up_allowed === true;

  const missing = [];
  if (!policiesComplete) missing.push(...policyChecks.filter((c) => !c.exists).map((c) => c.key));
  if (!ring4Authorized) missing.push("ring4_authorization");
  if (!ring3Accepted) missing.push("ring3_execution_accepted");
  if (!ring3NoGoClean) missing.push("ring3_no_go_clean");
  if (!target_permitted) missing.push(`target_not_permitted:${target_classification}`);
  if (!rollback_documented) missing.push("rollback_requirements");
  if (!abort_documented) missing.push("abort_requirements");
  if (!observability_required) missing.push("observability_slo_policy");
  if (!slo_defined) missing.push("slo_definitions");
  if (!incident_owner_defined) missing.push("incident_response_owner");
  if (!allowlists_required) missing.push("traffic_tenant_case_allowlist_policy");
  if (!scale_governance_defined) missing.push("scale_governance_policy");
  if (!supervisor_assigned) missing.push("supervisor_assignment");
  if (!rls_validated) missing.push("rls_boundary_policy");
  if (public_access_enabled) missing.push("public_broad_access_must_be_false");
  if (automatic_scale_up) missing.push("automatic_scale_up_must_be_false");

  const scale_target_verified =
    policiesComplete &&
    ring4Authorized &&
    ring3Accepted &&
    ring3NoGoClean &&
    target_permitted &&
    rollback_documented &&
    abort_documented &&
    observability_required &&
    slo_defined &&
    incident_owner_defined &&
    allowlists_required &&
    scale_governance_defined &&
    supervisor_assigned &&
    rls_validated &&
    !public_access_enabled &&
    !automatic_scale_up;

  const ready_for_execution = scale_target_verified;

  return {
    status: ready_for_execution ? "READY" : BLOCKED_STATUS,
    ready_for_execution,
    policies_complete: policiesComplete,
    policy_checks: policyChecks,
    ring4_authorization_verified: ring4Authorized,
    authorization_ref: ring4Auth?.authorization_ref ?? null,
    ring3_accepted: ring3Accepted,
    ring3_no_go_clean: ring3NoGoClean,
    target_classification,
    target_permitted,
    scale_target_verified,
    supervisor_assigned,
    rollback_documented,
    abort_documented,
    observability_required,
    slo_defined,
    incident_owner_defined,
    allowlists_required,
    scale_governance_defined,
    rls_validated,
    production_public_access_enabled: public_access_enabled,
    broad_production_access_enabled: ring4Auth?.broad_production_access_enabled === true,
    automatic_scale_up_allowed: automatic_scale_up,
    unknown_remote_touched: false,
    missing_inputs: missing,
    blocked_reason: ready_for_execution
      ? null
      : `Ring 4 scale target not verified. Classification: ${target_classification}. Missing: ${missing.join(", ")}`,
    activation_allowed_general_production: false,
    supabase_url: env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL ?? "http://127.0.0.1:54321",
  };
}

export function writeBlockedArtifact(path, dictamen, extra = {}) {
  const assessment = assessScaleTarget();
  const payload = {
    dictamen,
    generated_at: new Date().toISOString(),
    ring4_scope: "expanded_production_scale_governance",
    execution_status: BLOCKED_STATUS,
    blocked: true,
    blocked_reason: assessment.blocked_reason,
    missing_inputs: assessment.missing_inputs,
    target_classification: assessment.target_classification,
    scale_target_verified: false,
    ...extra,
  };
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`);
  return payload;
}

export function resolveFeatureFlags(assessment) {
  const flags = {
    EVE_RUNTIME_40_20_LOCAL_ENABLED: "true",
    EVE_GATES_READINESS_LOCAL_ENABLED: "true",
    EVE_CLIENT_SAFE_RESULT_LOCAL_ENABLED: "true",
    EVE_CONSULTANT_REVIEW_PACKET_LOCAL_ENABLED: "true",
    EVE_PARALLEL_PRODUCTION_LOCAL_ENABLED: "true",
    EVE_RING4_EXPANDED_PRODUCTION_ENABLED: "true",
    EVE_RING4_SUPERVISED_MODE: "true",
    EVE_RING4_ROLLBACK_READY: "true",
    EVE_RING4_ABORT_READY: "true",
    EVE_RING4_SCALE_GOVERNANCE_ENABLED: "true",
  };
  if (assessment.target_classification === "staging_explicit") {
    flags.EVE_RING4_SAFE_STAGING_ENABLED = "true";
  }
  if (assessment.target_classification === "expanded_production_explicit") {
    flags.EVE_RING4_EXPANDED_PRODUCTION_TARGET_APPROVED = "true";
  }
  if (assessment.target_classification === "controlled_production_explicit") {
    flags.EVE_RING4_CONTROLLED_PRODUCTION_TARGET_APPROVED = "true";
  }
  return flags;
}
