#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..", "..");
const outputPath = join(
  repoRoot,
  "docs/production-activation/eve_production_activation_p4_runtime_real_local_smoke_results.json",
);

function readEnvLocal() {
  const envPath = join(repoRoot, ".env.local");
  try {
    const raw = readFileSync(envPath, "utf8");
    return Object.fromEntries(
      raw
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#") && line.includes("="))
        .map((line) => {
          const index = line.indexOf("=");
          return [line.slice(0, index), line.slice(index + 1)];
        }),
    );
  } catch {
    return {};
  }
}

function createSupabaseLocalClient() {
  const merged = { ...readEnvLocal(), ...process.env };
  const url = merged.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
  const key =
    merged.EVE_SUPABASE_LOCAL_SERVICE_ROLE_KEY ??
    merged.SUPABASE_SERVICE_ROLE_KEY ??
    "";
  if (!url || !key) {
    throw new Error("Missing local Supabase URL or service role key.");
  }
  if (!/127\.0\.0\.1|localhost/i.test(url)) {
    throw new Error("Unsafe target: NEXT_PUBLIC_SUPABASE_URL is not local.");
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function resolveOrSeedInteractionDef(supabase, tenantId, caseId) {
  const existing = await supabase
    .from("runtime_interaction_def")
    .select("runtime_interaction_id")
    .eq("tenant_id", tenantId)
    .eq("case_id", caseId)
    .limit(1)
    .maybeSingle();
  if (!existing.error && existing.data?.runtime_interaction_id) {
    return {
      runtime_interaction_id: existing.data.runtime_interaction_id,
      seeded: false,
      catalog_version_id: null,
    };
  }

  const catalogVersionId = crypto.randomUUID();
  const catalogInsert = await supabase
    .from("runtime_catalog_version")
    .insert({
      id: catalogVersionId,
      tenant_id: tenantId,
      case_id: caseId,
      catalog_name: "runtime-local-p4",
      runtime_spec_version: "40/20",
      runtime_catalog_version: "local-p4",
      mother_catalog_version: "local-p4",
      runtime_spec_checksum: "local",
      runtime_catalog_checksum: "local",
      mother_catalog_checksum: "local",
      source_trace: [{ stage: "p4_runtime_smoke_seed" }],
      metadata: { seeded_by: "p4-runtime-real-local-smoke" },
    })
    .select("id")
    .single();
  if (catalogInsert.error) throw catalogInsert.error;

  const runtimeInteractionId = "runtime_local_seed_question_1";
  const defInsert = await supabase.from("runtime_interaction_def").insert({
    tenant_id: tenantId,
    case_id: caseId,
    catalog_version_id: catalogVersionId,
    runtime_interaction_id: runtimeInteractionId,
    interaction_group: "base",
    visible_text: "Describe la actividad ejecutada.",
    ui_component: "textarea",
    counts_as_base: true,
    counts_as_causal: false,
    source_document: "P4_LOCAL_SMOKE",
    source_sheet: "seed",
    source_row_number: 1,
    raw_row: { seed: true },
    source_trace: [{ stage: "p4_runtime_smoke_seed" }],
    metadata: { seeded_by: "p4-runtime-real-local-smoke" },
  });
  if (defInsert.error) throw defInsert.error;

  return {
    runtime_interaction_id: runtimeInteractionId,
    seeded: true,
    catalog_version_id: catalogVersionId,
  };
}

async function main() {
  const supabase = createSupabaseLocalClient();
  const tenantId = crypto.randomUUID();
  const caseId = crypto.randomUUID();
  const roleId = crypto.randomUUID();
  const activityId = crypto.randomUUID();
  const correlationId = `p4-local-${Date.now()}`;
  const idempotencyKey = `p4-local-idem-${Date.now()}`;

  const interactionDef = await resolveOrSeedInteractionDef(supabase, tenantId, caseId);

  const provisionalScope = {
    tenant_id: tenantId,
    case_id: caseId,
    role_id: roleId,
    activity_id: activityId,
    run_id: crypto.randomUUID(),
    client_session_id: `client-${Date.now()}`,
    correlation_id: correlationId,
    idempotency_key: idempotencyKey,
  };

  const roleRuntimeSessionId = await insertSingle(
    supabase,
    "role_runtime_session",
    {
      tenant_id: provisionalScope.tenant_id,
      case_id: provisionalScope.case_id,
      role_id: provisionalScope.role_id,
      catalog_version_id: interactionDef.catalog_version_id ?? crypto.randomUUID(),
      state: "active",
      source_trace: [{ stage: "p4_runtime_real_local_smoke" }],
      metadata: { local_only: true },
      correlation_id: correlationId,
      idempotency_key: idempotencyKey,
    },
    "id",
  );

  const activityRuntimeRun = await insertSingle(
    supabase,
    "activity_runtime_run",
    {
      tenant_id: provisionalScope.tenant_id,
      case_id: provisionalScope.case_id,
      role_id: provisionalScope.role_id,
      activity_id: provisionalScope.activity_id,
      role_runtime_session_id: roleRuntimeSessionId,
      catalog_version_id: interactionDef.catalog_version_id ?? crypto.randomUUID(),
      state: "active_base_capture",
      base_visible_count: 0,
      causal_visible_count: 0,
      source_trace: [{ stage: "p4_runtime_real_local_smoke" }],
      metadata: { local_only: true },
      correlation_id: correlationId,
      idempotency_key: idempotencyKey,
    },
    "id,run_id",
  );

  const runtimeScope = {
    ...provisionalScope,
    run_id: activityRuntimeRun.id,
  };

  const interactionInstanceId = await insertSingle(
    supabase,
    "runtime_interaction_instance",
    {
      tenant_id: runtimeScope.tenant_id,
      case_id: runtimeScope.case_id,
      role_id: runtimeScope.role_id,
      activity_id: runtimeScope.activity_id,
      run_id: runtimeScope.run_id,
      runtime_interaction_id: interactionDef.runtime_interaction_id,
      state: "shown",
      shown_at: new Date().toISOString(),
      source_trace: [{ stage: "p4_runtime_real_local_smoke" }],
      metadata: { local_only: true },
      correlation_id: correlationId,
      idempotency_key: idempotencyKey,
    },
    "id",
  );

  const subfieldResponse = await insertSingle(
    supabase,
    "runtime_subfield_response",
    {
      tenant_id: runtimeScope.tenant_id,
      case_id: runtimeScope.case_id,
      role_id: runtimeScope.role_id,
      activity_id: runtimeScope.activity_id,
      run_id: runtimeScope.run_id,
      interaction_id: interactionInstanceId,
      subfield_name: "descripcion_actividad",
      value: "Atiendo solicitud y preparo entregable.",
      epistemic_status: "captured_user_evidence",
      provenance_type: "user_input",
      source_trace: [{ stage: "p4_runtime_real_local_smoke" }],
      metadata: { local_only: true },
      correlation_id: correlationId,
      idempotency_key: idempotencyKey,
    },
    "id",
  );
  const subfieldResponseIds = [subfieldResponse];

  const evidence = await insertSingle(
    supabase,
    "evidence_item",
    {
      tenant_id: runtimeScope.tenant_id,
      case_id: runtimeScope.case_id,
      role_id: runtimeScope.role_id,
      activity_id: runtimeScope.activity_id,
      run_id: runtimeScope.run_id,
      interaction_id: interactionInstanceId,
      subfield_response_id: subfieldResponse,
      literal_value: "Atiendo solicitud y preparo entregable.",
      epistemic_status: "captured_user_evidence",
      provenance_type: "user_input",
      source_trace: [{ stage: "p4_runtime_real_local_smoke" }],
      metadata: { local_only: true },
      correlation_id: correlationId,
      idempotency_key: idempotencyKey,
    },
    "id",
  );

  const canonical = await insertSingle(
    supabase,
    "canonical_variable_record",
    {
      tenant_id: runtimeScope.tenant_id,
      case_id: runtimeScope.case_id,
      role_id: runtimeScope.role_id,
      activity_id: runtimeScope.activity_id,
      run_id: runtimeScope.run_id,
      variable_name: "mission_final",
      variable_value: { option_id: 2, reason: "transformacion_operativa" },
      route_id: "runtime_local_mapping",
      route_status: "closed",
      derived_from: [{ source: "runtime_subfield_response" }],
      gap_flag: false,
      source_trace: [{ stage: "p4_runtime_real_local_smoke" }],
      metadata: { local_only: true },
      correlation_id: correlationId,
      idempotency_key: idempotencyKey,
    },
    "id",
  );

  const gap = { readiness_gap_record_created: false, readiness_gap_record_id: null };

  const audit = await insertSingle(
    supabase,
    "runtime_audit_trail",
    {
      tenant_id: runtimeScope.tenant_id,
      case_id: runtimeScope.case_id,
      role_id: runtimeScope.role_id,
      activity_id: runtimeScope.activity_id,
      run_id: runtimeScope.run_id,
      object_type: "runtime_subfield_response",
      object_id: subfieldResponseIds[0],
      actor_id: runtimeScope.client_session_id,
      actor_type: "system_local_adapter",
      action: "answer_ingested_local",
      reason: "p4_runtime_real_local_capture",
      new_value: { subfield_count: subfieldResponseIds.length },
      source_trace: [{ stage: "p4_runtime_real_local_smoke" }],
      metadata: { local_only: true },
      correlation_id: correlationId,
      idempotency_key: idempotencyKey,
    },
    "id",
  );

  const result = {
    dictamen:
      "EVE_PRODUCTION_ACTIVATION_P4_RUNTIME_40_20_REAL_BEHIND_SIGNIFICADO_LOCAL_SMOKE",
    generated_at: new Date().toISOString(),
    tenant_id: tenantId,
    case_id: caseId,
    role_id: roleId,
    activity_id: activityId,
    role_runtime_session_id: roleRuntimeSessionId,
    activity_runtime_run_id: activityRuntimeRun.id,
    runtime_interaction_instance_id: interactionInstanceId,
    runtime_subfield_response_ids: subfieldResponseIds,
    evidence_item_id: evidence,
    canonical_variable_record_id: canonical,
    readiness_gap_record_id: gap.readiness_gap_record_id,
    runtime_audit_trail_id: audit,
    role_runtime_session_created: true,
    activity_runtime_run_created: true,
    runtime_interaction_instance_created: true,
    runtime_subfield_response_created: subfieldResponseIds.length > 0,
    evidence_item_created: Boolean(evidence),
    canonical_variable_record_created: Boolean(canonical),
    readiness_gap_record_created: gap.readiness_gap_record_created,
    runtime_audit_trail_created: Boolean(audit),
    readiness_decision_record_created: false,
    gates_real_executed: false,
    diagnosis_created: false,
    export_real_created: false,
    produccion_paralela_started: false,
    activation_allowed: false,
    runtime_interaction_def_seeded: interactionDef.seeded,
  };

  writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
}

async function insertSingle(supabase, table, payload, selectFields) {
  const { data, error } = await supabase.from(table).insert(payload).select(selectFields).single();
  if (error) throw error;
  if (typeof selectFields === "string" && !selectFields.includes(",")) return data[selectFields];
  return data;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
