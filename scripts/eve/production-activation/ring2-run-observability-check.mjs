#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { BLOCKED_EXIT_CODE, RING2_ARTIFACT_PATHS, repoRoot } from "./ring2-artifact-paths.mjs";
import { assessPilotReadiness, writeBlockedArtifact } from "./ring2-pilot-readiness-lib.mjs";
import {
  createSupabaseLocalClient,
  isSupabaseLocalReachable,
  readJsonIfExists,
} from "./p9a-production-activation-lib.mjs";
import { readChainContext } from "./local-activation-chain-context-lib.mjs";

async function main() {
  const readiness = assessPilotReadiness();
  if (!readiness.ready_for_execution) {
    writeBlockedArtifact(RING2_ARTIFACT_PATHS.observability, "EVE_PRODUCTION_ACTIVATION_RING2_OBSERVABILITY", {
      observability_passed: false,
    });
    process.exit(BLOCKED_EXIT_CODE);
  }

  const supabase = createSupabaseLocalClient();
  const supabase_local_available = await isSupabaseLocalReachable(supabase);
  const chainContext = readChainContext();
  const pilotScope = readJsonIfExists(RING2_ARTIFACT_PATHS.pilotScopeManifest);
  const bffFlow = readJsonIfExists(RING2_ARTIFACT_PATHS.bffRuntimeFlow);
  const gate = readJsonIfExists(RING2_ARTIFACT_PATHS.gateReadiness);
  const client = readJsonIfExists(RING2_ARTIFACT_PATHS.clientSafeResult);
  const consultant = readJsonIfExists(RING2_ARTIFACT_PATHS.consultantPacket);
  const parallel = readJsonIfExists(RING2_ARTIFACT_PATHS.parallelPayload);

  let sampleAudit = null;
  if (supabase_local_available) {
    const { data, error } = await supabase
      .from("runtime_audit_trail")
      .select("id, tenant_id, case_id, run_id, correlation_id, idempotency_key, source_trace, action, metadata")
      .order("created_at", { ascending: false })
      .limit(10);
    sampleAudit = { count: data?.length ?? 0, error: error?.message ?? null, records: data ?? [] };
  }

  const ring2Artifacts = Object.values(RING2_ARTIFACT_PATHS)
    .filter((p) => p.includes("ring2_") && p.endsWith(".json"))
    .map((p) => ({ path: p.replace(repoRoot + "\\", "").replace(repoRoot + "/", ""), present: Boolean(readJsonIfExists(p)) }));

  const runtime_audit_trail_exists = (sampleAudit?.count ?? 0) > 0;
  const correlation_id_present = (sampleAudit?.records ?? []).some((r) => Boolean(r.correlation_id));
  const idempotency_key_present = (sampleAudit?.records ?? []).some((r) => Boolean(r.idempotency_key));
  const source_trace_present = (sampleAudit?.records ?? []).some(
    (r) => Array.isArray(r.source_trace) && r.source_trace.length > 0,
  );
  const scope_tenant_case_run_present =
    Boolean(pilotScope?.pilot_tenant_id && pilotScope?.pilot_case_id && pilotScope?.pilot_run_id) ||
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
    pilotScope?.consent_verified === true;

  const result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING2_OBSERVABILITY",
    generated_at: new Date().toISOString(),
    ring2_scope: "authorized_pilot_client_scoped_supervised",
    supabase_local_available,
    runtime_audit_trail_exists,
    correlation_id_present,
    idempotency_key_present,
    source_trace_present,
    scope_tenant_case_run_present,
    ring2_artifacts: ring2Artifacts,
    sample_audit_trail: sampleAudit,
    observability_passed,
    qa_green_real_created: false,
    activation_allowed_general_production: false,
    production_supabase_touched: false,
  };

  writeFileSync(RING2_ARTIFACT_PATHS.observability, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  if (!observability_passed) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
