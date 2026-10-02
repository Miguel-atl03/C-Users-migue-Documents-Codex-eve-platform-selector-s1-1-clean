#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { BLOCKED_EXIT_CODE, RING3_ARTIFACT_PATHS, repoRoot } from "./ring3-artifact-paths.mjs";
import { assessControlledTarget, writeBlockedArtifact } from "./ring3-controlled-target-lib.mjs";
import {
  createSupabaseLocalClient,
  isSupabaseLocalReachable,
  readJsonIfExists,
} from "./p9a-production-activation-lib.mjs";
import { readChainContext } from "./local-activation-chain-context-lib.mjs";

async function main() {
  const assessment = assessControlledTarget();
  if (!assessment.ready_for_execution) {
    writeBlockedArtifact(RING3_ARTIFACT_PATHS.observability, "EVE_PRODUCTION_ACTIVATION_RING3_OBSERVABILITY", {
      observability_passed: false,
    });
    process.exit(BLOCKED_EXIT_CODE);
  }

  const supabase = createSupabaseLocalClient();
  const supabase_local_available = await isSupabaseLocalReachable(supabase);
  const chainContext = readChainContext();
  const scope = readJsonIfExists(RING3_ARTIFACT_PATHS.scopeManifest);
  const bffFlow = readJsonIfExists(RING3_ARTIFACT_PATHS.bffRuntimeFlow);
  const gate = readJsonIfExists(RING3_ARTIFACT_PATHS.gateReadiness);
  const client = readJsonIfExists(RING3_ARTIFACT_PATHS.clientSafeResult);
  const consultant = readJsonIfExists(RING3_ARTIFACT_PATHS.consultantPacket);
  const parallel = readJsonIfExists(RING3_ARTIFACT_PATHS.parallelPayload);

  let sampleAudit = null;
  if (supabase_local_available) {
    const { data, error } = await supabase
      .from("runtime_audit_trail")
      .select("id, tenant_id, case_id, run_id, correlation_id, idempotency_key, source_trace, action, metadata")
      .order("created_at", { ascending: false })
      .limit(10);
    sampleAudit = { count: data?.length ?? 0, error: error?.message ?? null, records: data ?? [] };
  }

  const ring3Artifacts = Object.values(RING3_ARTIFACT_PATHS)
    .filter((p) => p.includes("ring3_") && p.endsWith(".json"))
    .map((p) => ({ path: p.replace(repoRoot + "\\", "").replace(repoRoot + "/", ""), present: Boolean(readJsonIfExists(p)) }));

  const runtime_audit_trail_exists = (sampleAudit?.count ?? 0) > 0;
  const correlation_id_present = (sampleAudit?.records ?? []).some((r) => Boolean(r.correlation_id));
  const idempotency_key_present = (sampleAudit?.records ?? []).some((r) => Boolean(r.idempotency_key));
  const source_trace_present = (sampleAudit?.records ?? []).some(
    (r) => Array.isArray(r.source_trace) && r.source_trace.length > 0,
  );
  const scope_tenant_case_run_present =
    Boolean(scope?.controlled_tenant_id && scope?.controlled_case_id && scope?.controlled_run_id) ||
    Boolean(chainContext?.tenant_id && chainContext?.case_id && chainContext?.run_id);

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

  const result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING3_OBSERVABILITY",
    generated_at: new Date().toISOString(),
    ring3_scope: "controlled_production_supervised_rollback_ready",
    target_classification: assessment.target_classification,
    supabase_local_available,
    runtime_audit_trail_exists,
    correlation_id_present,
    idempotency_key_present,
    source_trace_present,
    scope_tenant_case_run_present,
    ring3_artifacts: ring3Artifacts,
    sample_audit_trail: sampleAudit,
    observability_passed,
    qa_green_real_created: false,
    activation_allowed_general_production: false,
    production_supabase_touched: false,
    unknown_remote_touched: false,
  };

  writeFileSync(RING3_ARTIFACT_PATHS.observability, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  if (!observability_passed) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
