#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import {
  P9A_ARTIFACT_PATHS,
  createSupabaseLocalClient,
  isSupabaseLocalReachable,
  readJsonIfExists,
} from "./p9a-production-activation-lib.mjs";

const PHASE_ARTIFACTS = [
  { phase: "P4", path: P9A_ARTIFACT_PATHS.p4Smoke, auditField: "runtime_audit_trail_created" },
  { phase: "P5", path: P9A_ARTIFACT_PATHS.p5Smoke, auditField: "runtime_audit_trail_created" },
  { phase: "P6", path: P9A_ARTIFACT_PATHS.p6Smoke, auditField: "client_visible_result_safe" },
  { phase: "P7", path: P9A_ARTIFACT_PATHS.p7Smoke, auditField: "audit_trail_present" },
  { phase: "P8", path: P9A_ARTIFACT_PATHS.p8Smoke, auditField: "no_forbidden_fields" },
];

function hasCorrelationAndIdempotency(doc) {
  if (!doc) return false;
  const scope = doc.scope ?? doc;
  const correlation =
    scope.correlation_id ??
    doc.correlation_id ??
  null;
  const idempotency =
    scope.idempotency_key ??
    doc.idempotency_key ??
  null;
  return Boolean(correlation) && Boolean(idempotency);
}

function hasScope(doc) {
  if (!doc) return false;
  const scope = doc.scope ?? doc;
  return Boolean(scope.tenant_id && scope.case_id && (scope.run_id || doc.activity_runtime_run_id));
}

async function main() {
  const supabase = createSupabaseLocalClient();
  const supabase_local_available = await isSupabaseLocalReachable(supabase);

  const tableExists = supabase_local_available;
  let sampleAudit = null;
  if (supabase_local_available) {
    const { data, error } = await supabase
      .from("runtime_audit_trail")
      .select("id, tenant_id, case_id, run_id, correlation_id, idempotency_key, source_trace, metadata, action")
      .order("created_at", { ascending: false })
      .limit(5);
    sampleAudit = { count: data?.length ?? 0, error: error?.message ?? null, records: data ?? [] };
  }

  const phase_checks = PHASE_ARTIFACTS.map(({ phase, path, auditField }) => {
    const doc = readJsonIfExists(path);
    return {
      phase,
      artifact_present: Boolean(doc),
      audit_signal_present: doc ? doc[auditField] === true : false,
      correlation_id_present: hasCorrelationAndIdempotency(doc),
      scope_present: hasScope(doc),
      activation_allowed_false: doc ? doc.activation_allowed === false : false,
    };
  });

  const runtime_audit_trail_exists = tableExists && (sampleAudit?.count ?? 0) > 0;
  const correlation_id_present = phase_checks.every((c) => c.correlation_id_present) ||
    (sampleAudit?.records ?? []).some((r) => Boolean(r.correlation_id));
  const idempotency_key_present = (sampleAudit?.records ?? []).some((r) => Boolean(r.idempotency_key)) ||
    phase_checks.some((c) => c.correlation_id_present);
  const source_trace_present = (sampleAudit?.records ?? []).some(
    (r) => Array.isArray(r.source_trace) && r.source_trace.length > 0,
  );
  const scope_tenant_case_run_present =
    (sampleAudit?.records ?? []).some((r) => r.tenant_id && r.case_id && r.run_id) ||
    phase_checks.every((c) => c.scope_present);
  const manual_review_reentry_observable = Boolean(
    readJsonIfExists(P9A_ARTIFACT_PATHS.p5Smoke)?.readiness_state === "ready_with_flags" ||
      readJsonIfExists(P9A_ARTIFACT_PATHS.p7Smoke)?.consultant_review_packet?.readiness_decision
        ?.manual_review_required !== undefined,
  );
  const no_go_checklist_traceable = Boolean(readJsonIfExists(P9A_ARTIFACT_PATHS.p8Smoke));

  const phase_audit_ok = (c) => {
    if (c.audit_signal_present) return true;
    if (c.phase === "P6") return c.artifact_present && c.activation_allowed_false;
    if (c.phase === "P7") return c.artifact_present && c.activation_allowed_false;
    return c.artifact_present && c.audit_signal_present;
  };

  const observability_audit_passed =
    runtime_audit_trail_exists &&
    phase_checks.every((c) => phase_audit_ok(c)) &&
    correlation_id_present &&
    idempotency_key_present &&
    source_trace_present &&
    scope_tenant_case_run_present;

  const result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_P9A_OBSERVABILITY_AUDIT_CHECK",
    generated_at: new Date().toISOString(),
    supabase_local_available,
    runtime_audit_trail_exists,
    phase_audit_coverage: phase_checks,
    correlation_id_present,
    idempotency_key_present,
    source_trace_present,
    scope_tenant_case_run_present,
    manual_review_reentry_observable,
    no_go_checklist_traceable,
    sample_audit_trail: sampleAudit,
    observability_audit_passed,
    qa_green_real_created: false,
    activation_allowed: false,
    production_supabase_touched: false,
  };

  writeFileSync(P9A_ARTIFACT_PATHS.observability, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));

  if (!observability_audit_passed) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
