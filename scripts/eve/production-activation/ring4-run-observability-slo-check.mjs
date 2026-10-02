#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { BLOCKED_EXIT_CODE, RING4_ARTIFACT_PATHS, RING4_POLICY_PATHS, repoRoot } from "./ring4-artifact-paths.mjs";
import { assessScaleTarget, writeBlockedArtifact } from "./ring4-scale-target-lib.mjs";
import {
  createSupabaseLocalClient,
  isSupabaseLocalReachable,
  readJsonIfExists,
} from "./p9a-production-activation-lib.mjs";
import { readChainContext } from "./local-activation-chain-context-lib.mjs";

async function main() {
  const assessment = assessScaleTarget();
  if (!assessment.ready_for_execution) {
    writeBlockedArtifact(RING4_ARTIFACT_PATHS.observabilitySlo, "EVE_PRODUCTION_ACTIVATION_RING4_OBSERVABILITY_SLO", {
      observability_passed: false,
      observability_slo_passed: false,
    });
    process.exit(BLOCKED_EXIT_CODE);
  }

  const sloPolicy = readJsonIfExists(RING4_POLICY_PATHS.observabilitySlo);
  const allowlist = readJsonIfExists(RING4_ARTIFACT_PATHS.trafficTenantCaseAllowlist);
  const supabase = createSupabaseLocalClient();
  const supabase_local_available = await isSupabaseLocalReachable(supabase);
  const chainContext = readChainContext();
  const scope = readJsonIfExists(RING4_ARTIFACT_PATHS.scaleExecutionScope);
  const bffFlow = readJsonIfExists(RING4_ARTIFACT_PATHS.bffRuntimeFlow);
  const gate = readJsonIfExists(RING4_ARTIFACT_PATHS.gateReadiness);
  const client = readJsonIfExists(RING4_ARTIFACT_PATHS.clientSafeResult);
  const consultant = readJsonIfExists(RING4_ARTIFACT_PATHS.consultantPacket);
  const parallel = readJsonIfExists(RING4_ARTIFACT_PATHS.parallelPayload);

  let sampleAudit = null;
  if (supabase_local_available) {
    const { data, error } = await supabase
      .from("runtime_audit_trail")
      .select("id, tenant_id, case_id, run_id, correlation_id, idempotency_key, source_trace, action, metadata")
      .order("created_at", { ascending: false })
      .limit(10);
    sampleAudit = { count: data?.length ?? 0, error: error?.message ?? null, records: data ?? [] };
  }

  const ring4Artifacts = Object.values(RING4_ARTIFACT_PATHS)
    .filter((p) => p.includes("ring4_") && p.endsWith(".json"))
    .map((p) => ({ path: p.replace(repoRoot + "\\", "").replace(repoRoot + "/", ""), present: Boolean(readJsonIfExists(p)) }));

  const runtime_audit_trail_exists = (sampleAudit?.count ?? 0) > 0;
  const correlation_id_present = (sampleAudit?.records ?? []).some((r) => Boolean(r.correlation_id));
  const idempotency_key_present = (sampleAudit?.records ?? []).some((r) => Boolean(r.idempotency_key));
  const source_trace_present = (sampleAudit?.records ?? []).some(
    (r) => Array.isArray(r.source_trace) && r.source_trace.length > 0,
  );
  const scope_tenant_case_run_present =
    Boolean(scope?.expanded_tenant_id && scope?.expanded_case_id && scope?.expanded_run_id) ||
    Boolean(chainContext?.tenant_id && chainContext?.case_id && chainContext?.run_id);
  const slo_definitions_present = Array.isArray(sloPolicy?.slo_definitions) && sloPolicy.slo_definitions.length >= 5;
  const traffic_ramp_observable = allowlist?.traffic_ramp?.traffic_percentage != null;
  const tenant_allowlist_observable = allowlist?.tenant_allowlist?.enforced === true;
  const case_allowlist_observable = allowlist?.case_allowlist?.enforced === true;
  const error_budget_tracked = sloPolicy?.error_budget_required === true;
  const observability_green_criteria_defined = Boolean(sloPolicy?.observability_green_criteria);

  const observability_passed =
    supabase_local_available &&
    runtime_audit_trail_exists &&
    correlation_id_present &&
    idempotency_key_present &&
    source_trace_present &&
    scope_tenant_case_run_present &&
    bffFlow?.bff_runtime_flow_passed === true &&
    gate?.gates_readiness_passed === true &&
    client?.client_safe_result_passed === true &&
    consultant?.consultant_packet_passed === true &&
    parallel?.parallel_payload_controlled_rehearsal_passed === true &&
    scope?.observability_active === true;

  const observability_slo_passed =
    observability_passed &&
    slo_definitions_present &&
    traffic_ramp_observable &&
    tenant_allowlist_observable &&
    case_allowlist_observable &&
    error_budget_tracked &&
    observability_green_criteria_defined;

  const result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING4_OBSERVABILITY_SLO",
    generated_at: new Date().toISOString(),
    ring4_scope: "expanded_production_scale_governance",
    target_classification: assessment.target_classification,
    supabase_local_available,
    runtime_audit_trail_exists,
    correlation_id_present,
    idempotency_key_present,
    source_trace_present,
    scope_tenant_case_run_present,
    slo_definitions_present,
    traffic_ramp_observable,
    tenant_allowlist_observable,
    case_allowlist_observable,
    error_budget_tracked,
    observability_green_criteria_defined,
    ring4_artifacts: ring4Artifacts,
    sample_audit_trail: sampleAudit,
    observability_passed,
    observability_slo_passed,
    observability_green: observability_slo_passed,
    qa_green_real_created: false,
    activation_allowed_general_production: false,
    automatic_scale_up_allowed: false,
    production_supabase_touched: false,
    unknown_remote_touched: false,
  };

  writeFileSync(RING4_ARTIFACT_PATHS.observabilitySlo, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  if (!observability_slo_passed) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
