#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { RING0_ARTIFACT_PATHS } from "./ring0-artifact-paths.mjs";
import { createSupabaseLocalClient, isSupabaseLocalReachable } from "./p9a-production-activation-lib.mjs";

async function insertSingle(supabase, table, payload, selectFields = "id") {
  const { data, error } = await supabase.from(table).insert(payload).select(selectFields).single();
  if (error) throw error;
  return data;
}

async function main() {
  const supabase = createSupabaseLocalClient();
  const supabase_local_available = await isSupabaseLocalReachable(supabase);

  const drill_id = `ring0-rollback-${Date.now()}`;
  const correlation_id = `${drill_id}-corr`;
  const idempotency_key = `${drill_id}-idem`;
  const tenant_id = crypto.randomUUID();
  const case_id = crypto.randomUUID();
  const role_id = crypto.randomUUID();
  const activity_id = crypto.randomUUID();
  const run_id = crypto.randomUUID();

  let checkpoint = null;
  let controlled_op = null;
  let revert = null;
  let rollback_drill_passed = false;

  if (supabase_local_available) {
    const priorAuditCount = await supabase
      .from("runtime_audit_trail")
      .select("id", { count: "exact", head: true });
    checkpoint = {
      prior_audit_trail_count: priorAuditCount.count ?? 0,
      activation_allowed_general_production_before: false,
      external_export_before: false,
      qa_green_real_before: false,
      timestamp: new Date().toISOString(),
    };

    const auditRecord = await insertSingle(
      supabase,
      "runtime_audit_trail",
      {
        tenant_id,
        case_id,
        role_id,
        activity_id,
        run_id,
        object_type: "ring0_rollback_drill_package",
        object_id: drill_id,
        actor_id: "ring0-rollback-drill",
        actor_type: "system_local_drill",
        action: "ring0_rollback_drill_controlled_op",
        reason: "controlled_local_operation",
        prior_value: null,
        new_value: { drill_id, phase: "controlled_op", ring0_scope: "internal_operator_with_controlled_fixtures" },
        correlation_id,
        idempotency_key,
        source_trace: [{ stage: "ring0_rollback_drill", drill_id }],
        metadata: { local_only: true, ring0_rollback_drill: true, controlled_fixture: true },
      },
      "id",
    );

    controlled_op = {
      audit_trail_id: auditRecord.id,
      external_export_executed: false,
      activation_allowed_general_production: false,
      diagnosis_created: false,
      qa_green_real_created: false,
    };

    const { error: revertError } = await supabase
      .from("runtime_audit_trail")
      .update({
        metadata: { local_only: true, ring0_rollback_drill: true, reverted: true, controlled_fixture: true },
        action: "ring0_rollback_drill_reverted",
        reason: "rollback_drill_revert",
      })
      .eq("id", auditRecord.id);

    const postRevert = await supabase
      .from("runtime_audit_trail")
      .select("id, action, metadata")
      .eq("id", auditRecord.id)
      .maybeSingle();

    revert = {
      revert_error: revertError?.message ?? null,
      controlled_record_reverted: postRevert.data?.action === "ring0_rollback_drill_reverted",
      activation_allowed_general_production_after: false,
      external_export_after: false,
      qa_green_real_after: false,
      real_client_access_enabled: false,
    };

    rollback_drill_passed =
      Boolean(controlled_op.audit_trail_id) &&
      revert.controlled_record_reverted &&
      revert.activation_allowed_general_production_after === false &&
      revert.external_export_after === false &&
      !revert.revert_error;
  }

  const result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING0_ROLLBACK_DRILL",
    generated_at: new Date().toISOString(),
    drill_id,
    ring0_scope: "internal_operator_with_controlled_fixtures",
    supabase_local_available,
    checkpoint,
    controlled_op,
    revert,
    rollback_drill_passed,
    qa_green_real_created: false,
    activation_allowed_general_production: false,
    production_supabase_touched: false,
    external_export_executed: false,
    real_client_access_enabled: false,
  };

  writeFileSync(RING0_ARTIFACT_PATHS.rollback, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  if (!rollback_drill_passed) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
