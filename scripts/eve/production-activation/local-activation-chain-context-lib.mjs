#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const repoRoot = join(__dirname, "..", "..", "..");

export const CHAIN_CONTEXT_PATH = join(
  repoRoot,
  "docs/production-activation/eve_local_activation_chain_context.json",
);

export const P9AR2_ARTIFACT_PATHS = {
  chainContext: CHAIN_CONTEXT_PATH,
  chainValidation: join(
    repoRoot,
    "docs/production-activation/eve_production_activation_p9ar2_chain_context_validation.json",
  ),
  p6Results: join(
    repoRoot,
    "docs/production-activation/eve_production_activation_p9ar2_p6_live_read_results.json",
  ),
  p7Results: join(
    repoRoot,
    "docs/production-activation/eve_production_activation_p9ar2_p7_packet_results.json",
  ),
  p8Results: join(
    repoRoot,
    "docs/production-activation/eve_production_activation_p9ar2_p8_rehearsal_results.json",
  ),
  integratedSmoke: join(
    repoRoot,
    "docs/production-activation/eve_production_activation_p9ar2_integrated_runtime_smoke_results.json",
  ),
  noGoPreflight: join(
    repoRoot,
    "docs/production-activation/eve_production_activation_p9ar2_no_go_preflight_results.json",
  ),
  commandResults: join(
    repoRoot,
    "docs/production-activation/eve_production_activation_p9ar2_command_results.json",
  ),
  boundaryLedger: join(
    repoRoot,
    "docs/production-activation/eve_production_activation_p9ar2_boundary_ledger.json",
  ),
  traceability: join(
    repoRoot,
    "docs/production-activation/eve_production_activation_p9ar2_runtime_chain_context_repair_traceability.json",
  ),
  closeout: join(
    repoRoot,
    "docs/production-activation/eve_production_activation_p9ar2_runtime_chain_context_repair_closeout.md",
  ),
  p5Smoke: join(
    repoRoot,
    "docs/production-activation/eve_production_activation_p5_gates_readiness_local_smoke_results.json",
  ),
  p6Smoke: join(
    repoRoot,
    "docs/production-activation/eve_production_activation_p6_client_safe_result_smoke_results.json",
  ),
  p7Smoke: join(
    repoRoot,
    "docs/production-activation/eve_production_activation_p7_consultant_review_packet_smoke_results.json",
  ),
  p8Smoke: join(
    repoRoot,
    "docs/production-activation/eve_production_activation_p8_parallel_payload_smoke_results.json",
  ),
};

export function readJsonIfExists(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

export function readChainContext() {
  return readJsonIfExists(CHAIN_CONTEXT_PATH);
}

export function writeChainContext(context) {
  writeFileSync(CHAIN_CONTEXT_PATH, `${JSON.stringify(context, null, 2)}\n`);
  return context;
}

export function updateChainContext(patch) {
  const current = readChainContext() ?? {};
  const next = {
    ...current,
    ...patch,
    source_trace: [
      ...(Array.isArray(current.source_trace) ? current.source_trace : []),
      ...(Array.isArray(patch.source_trace) ? patch.source_trace : []),
    ],
  };
  return writeChainContext(next);
}

export function buildContextFromP5Smoke(p5Result) {
  const scope = p5Result.scope ?? {};
  const now = new Date().toISOString();
  return {
    context_ref: `eve-local-activation-chain-${scope.run_id ?? "unknown"}`,
    created_at: now,
    updated_at: now,
    source: "P5 runtime/gates/readiness local smoke",
    tenant_id: scope.tenant_id ?? null,
    case_id: scope.case_id ?? null,
    role_id: scope.role_id ?? null,
    activity_id: scope.activity_id ?? null,
    run_id: scope.run_id ?? null,
    role_runtime_session_id: p5Result.role_runtime_session_id ?? null,
    activity_runtime_run_id: scope.run_id ?? null,
    runtime_interaction_instance_ids: p5Result.runtime_interaction_instance_id
      ? [p5Result.runtime_interaction_instance_id]
      : [],
    runtime_subfield_response_ids: [],
    evidence_item_ids: [],
    canonical_variable_record_ids: [],
    readiness_gap_record_ids: p5Result.readiness_gap_record_id
      ? [p5Result.readiness_gap_record_id]
      : [],
    semantic_resolution_event_ids: Array.isArray(p5Result.semantic_resolution_event_ids)
      ? p5Result.semantic_resolution_event_ids
      : [],
    process_state_timer_event_ids: Array.isArray(p5Result.process_state_timer_event_ids)
      ? p5Result.process_state_timer_event_ids
      : [],
    readiness_decision_record_id: p5Result.readiness_decision_record_id ?? null,
    runtime_audit_trail_ids: p5Result.runtime_audit_trail_id
      ? [p5Result.runtime_audit_trail_id]
      : [],
    readiness_state: p5Result.readiness_state ?? null,
    client_visible_state: null,
    consultant_packet_ref: null,
    parallel_rehearsal_ref: null,
    consultant_idempotency_key: null,
    local_server_side_service_access_used: false,
    source_trace: [
      {
        stage: "p5_gates_readiness_local_smoke",
        at: now,
        readiness_decision_record_id: p5Result.readiness_decision_record_id ?? null,
      },
    ],
  };
}

export function validateChainContextPresence(context) {
  const missing = [];
  if (!context) {
    return { valid: false, missing: ["missing_context"] };
  }
  for (const field of [
    "tenant_id",
    "case_id",
    "role_id",
    "activity_id",
    "run_id",
    "readiness_decision_record_id",
  ]) {
    if (!context[field]) missing.push(`missing_${field}`);
  }
  return { valid: missing.length === 0, missing };
}

export function scopesMatchContext(context, scope) {
  if (!context || !scope) return false;
  return (
    context.tenant_id === scope.tenant_id &&
    context.case_id === scope.case_id &&
    context.run_id === scope.run_id
  );
}

export function buildConsultantScopeFromContext(context, overrides = {}) {
  return {
    tenant_id: context.tenant_id,
    case_id: context.case_id,
    role_id: context.role_id,
    activity_id: context.activity_id,
    run_id: context.run_id,
    consultant_user_id: overrides.consultant_user_id ?? `consultant-${Date.now()}`,
    correlation_id: overrides.correlation_id ?? context.source_trace?.[0]?.correlation_id ?? `chain-${Date.now()}`,
    idempotency_key: overrides.idempotency_key ?? `chain-idem-${Date.now()}`,
  };
}
