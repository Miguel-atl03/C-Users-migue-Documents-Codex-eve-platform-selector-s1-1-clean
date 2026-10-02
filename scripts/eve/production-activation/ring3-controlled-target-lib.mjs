#!/usr/bin/env node
import { existsSync, writeFileSync } from "node:fs";
import {
  RING3_ARTIFACT_PATHS,
  RING3_POLICY_PATHS,
  repoRoot,
} from "./ring3-artifact-paths.mjs";
import { readEnvLocal, readJsonIfExists } from "./p9a-production-activation-lib.mjs";

export const BLOCKED_STATUS = "BLOCKED_PENDING_CONTROLLED_PRODUCTION_TARGET";

export function classifyTarget(env = {}) {
  const explicit = env.EVE_RING3_TARGET_CLASSIFICATION ?? "";
  if (explicit) return explicit;

  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL ?? "";
  if (!url) return "local";
  if (/127\.0\.0\.1|localhost/i.test(url)) return "local";
  if (/staging/i.test(url)) return "staging_explicit";
  if (/preview|vercel\.app/i.test(url)) return "preview_explicit";
  if (env.EVE_RING3_CONTROLLED_PRODUCTION_TARGET_APPROVED === "true") {
    return "controlled_production_explicit";
  }
  if (/supabase\.co/i.test(url)) return "production_unknown";
  return "unknown";
}

export function isTargetPermitted(classification, env = {}) {
  switch (classification) {
    case "local":
      return /127\.0\.0\.1|localhost/i.test(
        env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL ?? "http://127.0.0.1:54321",
      );
    case "staging_explicit":
    case "preview_explicit":
      return true;
    case "controlled_production_explicit":
      return env.EVE_RING3_CONTROLLED_PRODUCTION_TARGET_APPROVED === "true";
    case "production_unknown":
    case "unknown":
    default:
      return false;
  }
}

export function assessControlledTarget() {
  const env = { ...readEnvLocal(), ...process.env };
  const policyChecks = Object.entries(RING3_POLICY_PATHS).map(([key, path]) => ({
    key,
    path: path.replace(repoRoot, "").replace(/\\/g, "/").replace(/^\//, ""),
    exists: existsSync(path),
  }));
  const policiesComplete = policyChecks.every((c) => c.exists);

  const ring3Auth = readJsonIfExists(RING3_POLICY_PATHS.authorization);
  const ring3Authorized = ring3Auth?.ring3_authorized === true;
  const ring2Readiness = readJsonIfExists(RING3_ARTIFACT_PATHS.ring2NextRingReadiness);
  const ring2Accepted = ring2Readiness?.ring2_execution_completed === true;
  const supervisor = readJsonIfExists(RING3_ARTIFACT_PATHS.ring2SupervisorAssignment);
  const rollbackReq = readJsonIfExists(RING3_POLICY_PATHS.rollbackAbortRequirements);
  const observabilityReq = readJsonIfExists(RING3_POLICY_PATHS.observabilityRequirements);

  const target_classification = classifyTarget(env);
  const target_permitted = isTargetPermitted(target_classification, env);
  const rollback_documented = rollbackReq?.rollback_required === true;
  const abort_documented = rollbackReq?.abort_required === true;
  const observability_required = observabilityReq?.observability_required === true;
  const supervisor_assigned =
    Boolean(supervisor?.supervisor_id || supervisor?.consultant_id) &&
    supervisor?.assigned === true;
  const rls_validated =
    readJsonIfExists(RING3_POLICY_PATHS.productionDataBoundary)?.rls_required === true;
  const public_access_enabled = ring3Auth?.production_public_access_enabled === true;

  const missing = [];
  if (!policiesComplete) missing.push(...policyChecks.filter((c) => !c.exists).map((c) => c.key));
  if (!ring3Authorized) missing.push("ring3_authorization");
  if (!ring2Accepted) missing.push("ring2_execution_accepted");
  if (!target_permitted) missing.push(`target_not_permitted:${target_classification}`);
  if (!rollback_documented) missing.push("rollback_requirements");
  if (!abort_documented) missing.push("abort_requirements");
  if (!observability_required) missing.push("observability_requirements");
  if (!supervisor_assigned) missing.push("supervisor_assignment");
  if (!rls_validated) missing.push("rls_boundary_policy");
  if (public_access_enabled) missing.push("production_public_access_must_be_false");

  const controlled_target_verified =
    policiesComplete &&
    ring3Authorized &&
    ring2Accepted &&
    target_permitted &&
    rollback_documented &&
    abort_documented &&
    observability_required &&
    supervisor_assigned &&
    rls_validated &&
    !public_access_enabled;

  const ready_for_execution = controlled_target_verified;

  return {
    status: ready_for_execution ? "READY" : BLOCKED_STATUS,
    ready_for_execution,
    policies_complete: policiesComplete,
    policy_checks: policyChecks,
    ring3_authorization_verified: ring3Authorized,
    authorization_ref: ring3Auth?.authorization_ref ?? null,
    ring2_accepted: ring2Accepted,
    target_classification,
    target_permitted,
    controlled_target_verified,
    supervisor_assigned,
    rollback_documented,
    abort_documented,
    observability_required,
    rls_validated,
    production_public_access_enabled: public_access_enabled,
    broad_production_access_enabled: ring3Auth?.production_broad_access_enabled === true,
    unknown_remote_touched: false,
    missing_inputs: missing,
    blocked_reason: ready_for_execution
      ? null
      : `Controlled production target not verified. Classification: ${target_classification}. Missing: ${missing.join(", ")}`,
    activation_allowed_general_production: false,
    supabase_url: env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL ?? "http://127.0.0.1:54321",
  };
}

export function writeBlockedArtifact(path, dictamen, extra = {}) {
  const assessment = assessControlledTarget();
  const payload = {
    dictamen,
    generated_at: new Date().toISOString(),
    ring3_scope: "controlled_production_supervised_rollback_ready",
    execution_status: BLOCKED_STATUS,
    blocked: true,
    blocked_reason: assessment.blocked_reason,
    missing_inputs: assessment.missing_inputs,
    target_classification: assessment.target_classification,
    controlled_target_verified: false,
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
    EVE_RING3_CONTROLLED_PRODUCTION_ENABLED: "true",
    EVE_RING3_SUPERVISED_MODE: "true",
    EVE_RING3_ROLLBACK_READY: "true",
    EVE_RING3_ABORT_READY: "true",
  };
  if (assessment.target_classification === "staging_explicit") {
    flags.EVE_RING3_SAFE_STAGING_ENABLED = "true";
  }
  if (assessment.target_classification === "controlled_production_explicit") {
    flags.EVE_RING3_CONTROLLED_PRODUCTION_TARGET_APPROVED = "true";
  }
  if (assessment.target_classification === "local") {
    flags.EVE_RING3_CONTROLLED_PRODUCTION_ENABLED = "true";
  }
  return flags;
}
