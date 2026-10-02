#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { RING1_ARTIFACT_PATHS, repoRoot } from "./ring1-artifact-paths.mjs";
import {
  createSupabaseLocalClient,
  isSupabaseLocalReachable,
  readJsonIfExists,
} from "./p9a-production-activation-lib.mjs";
import { readChainContext } from "./local-activation-chain-context-lib.mjs";

async function main() {
  const supabase = createSupabaseLocalClient();
  const supabase_local_available = await isSupabaseLocalReachable(supabase);
  const chainContext = readChainContext();
  const testTenant = readJsonIfExists(RING1_ARTIFACT_PATHS.testTenantManifest);
  const bffFlow = readJsonIfExists(RING1_ARTIFACT_PATHS.bffRuntimeFlow);
  const gate = readJsonIfExists(RING1_ARTIFACT_PATHS.gateReadiness);
  const client = readJsonIfExists(RING1_ARTIFACT_PATHS.clientSafeResult);
  const consultant = readJsonIfExists(RING1_ARTIFACT_PATHS.consultantPacket);
  const parallel = readJsonIfExists(RING1_ARTIFACT_PATHS.parallelPayload);

  let sampleAudit = null;
  if (supabase_local_available) {
    const { data, error } = await supabase
      .from("runtime_audit_trail")
      .select("id, tenant_id, case_id, run_id, correlation_id, idempotency_key, source_trace, action, metadata")
      .order("created_at", { ascending: false })
      .limit(10);
    sampleAudit = { count: data?.length ?? 0, error: error?.message ?? null, records: data ?? [] };
  }

  const ring1Artifacts = [
    RING1_ARTIFACT_PATHS.testTenantManifest,
    RING1_ARTIFACT_PATHS.internalTestClientManifest,
    RING1_ARTIFACT_PATHS.bffRuntimeFlow,
    RING1_ARTIFACT_PATHS.runtimeRecordInventory,
    RING1_ARTIFACT_PATHS.gateReadiness,
    RING1_ARTIFACT_PATHS.clientSafeResult,
    RING1_ARTIFACT_PATHS.consultantPacket,
    RING1_ARTIFACT_PATHS.parallelPayload,
  ].map((p) => ({ path: p.replace(repoRoot + "\\", "").replace(repoRoot + "/", ""), present: Boolean(readJsonIfExists(p)) }));

  const runtime_audit_trail_exists = (sampleAudit?.count ?? 0) > 0;
  const correlation_id_present = (sampleAudit?.records ?? []).some((r) => Boolean(r.correlation_id));
  const idempotency_key_present = (sampleAudit?.records ?? []).some((r) => Boolean(r.idempotency_key));
  const source_trace_present = (sampleAudit?.records ?? []).some(
    (r) => Array.isArray(r.source_trace) && r.source_trace.length > 0,
  );
  const scope_tenant_case_run_present =
    Boolean(testTenant?.test_tenant_id && testTenant?.test_case_id && testTenant?.test_run_id) ||
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
    parallel?.parallel_payload_local_rehearsal_passed === true &&
    testTenant?.controlled_test_data === true &&
    testTenant?.real_external_client_data === false;

  const result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING1_OBSERVABILITY",
    generated_at: new Date().toISOString(),
    ring1_scope: "internal_test_tenant_limited_client",
    supabase_local_available,
    runtime_audit_trail_exists,
    correlation_id_present,
    idempotency_key_present,
    source_trace_present,
    scope_tenant_case_run_present,
    ring1_artifacts: ring1Artifacts,
    sample_audit_trail: sampleAudit,
    observability_passed,
    qa_green_real_created: false,
    activation_allowed_general_production: false,
    production_supabase_touched: false,
  };

  writeFileSync(RING1_ARTIFACT_PATHS.observability, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  if (!observability_passed) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
