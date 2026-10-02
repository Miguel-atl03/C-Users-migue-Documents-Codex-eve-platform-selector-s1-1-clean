#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { RING0_ARTIFACT_PATHS, repoRoot } from "./ring0-artifact-paths.mjs";
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
  const flow = readJsonIfExists(RING0_ARTIFACT_PATHS.uiBffRuntimeFlow);
  const gate = readJsonIfExists(RING0_ARTIFACT_PATHS.gateReadiness);
  const client = readJsonIfExists(RING0_ARTIFACT_PATHS.clientSafeResult);
  const consultant = readJsonIfExists(RING0_ARTIFACT_PATHS.consultantPacket);
  const parallel = readJsonIfExists(RING0_ARTIFACT_PATHS.parallelPayload);
  const fixture = readJsonIfExists(RING0_ARTIFACT_PATHS.fixtureManifest);

  let sampleAudit = null;
  if (supabase_local_available) {
    const { data, error } = await supabase
      .from("runtime_audit_trail")
      .select("id, tenant_id, case_id, run_id, correlation_id, idempotency_key, source_trace, action")
      .order("created_at", { ascending: false })
      .limit(10);
    sampleAudit = { count: data?.length ?? 0, error: error?.message ?? null, records: data ?? [] };
  }

  const ring0Artifacts = [
    RING0_ARTIFACT_PATHS.fixtureManifest,
    RING0_ARTIFACT_PATHS.uiBffRuntimeFlow,
    RING0_ARTIFACT_PATHS.runtimeRecordInventory,
    RING0_ARTIFACT_PATHS.gateReadiness,
    RING0_ARTIFACT_PATHS.clientSafeResult,
    RING0_ARTIFACT_PATHS.consultantPacket,
    RING0_ARTIFACT_PATHS.parallelPayload,
  ].map((p) => ({ path: p.replace(repoRoot + "\\", "").replace(repoRoot + "/", ""), present: Boolean(readJsonIfExists(p)) }));

  const runtime_audit_trail_exists = (sampleAudit?.count ?? 0) > 0;
  const correlation_id_present = (sampleAudit?.records ?? []).some((r) => Boolean(r.correlation_id));
  const idempotency_key_present = (sampleAudit?.records ?? []).some((r) => Boolean(r.idempotency_key));
  const source_trace_present = (sampleAudit?.records ?? []).some(
    (r) => Array.isArray(r.source_trace) && r.source_trace.length > 0,
  );
  const scope_tenant_case_run_present =
    Boolean(chainContext?.tenant_id && chainContext?.case_id && chainContext?.run_id) ||
    (sampleAudit?.records ?? []).some((r) => r.tenant_id && r.case_id && r.run_id);

  const observability_passed =
    supabase_local_available &&
    runtime_audit_trail_exists &&
    correlation_id_present &&
    idempotency_key_present &&
    source_trace_present &&
    scope_tenant_case_run_present &&
    flow?.ui_bff_runtime_local_flow_passed === true &&
    gate?.gates_readiness_local_passed === true &&
    client?.client_safe_result_passed === true &&
    consultant?.consultant_packet_passed === true &&
    parallel?.parallel_payload_local_passed === true &&
    fixture?.controlled_fixture === true &&
    fixture?.real_client_data === false;

  const result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING0_OBSERVABILITY",
    generated_at: new Date().toISOString(),
    supabase_local_available,
    runtime_audit_trail_exists,
    correlation_id_present,
    idempotency_key_present,
    source_trace_present,
    scope_tenant_case_run_present,
    ring0_artifacts: ring0Artifacts,
    sample_audit_trail: sampleAudit,
    observability_passed,
    qa_green_real_created: false,
    activation_allowed_general_production: false,
    production_supabase_touched: false,
  };

  writeFileSync(RING0_ARTIFACT_PATHS.observability, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  if (!observability_passed) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
