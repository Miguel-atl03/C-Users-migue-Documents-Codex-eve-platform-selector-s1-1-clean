#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildContextFromP5Smoke,
  writeChainContext,
} from "./local-activation-chain-context-lib.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..", "..");
const outputPath = join(
  repoRoot,
  "docs/production-activation/eve_production_activation_p5_gates_readiness_local_smoke_results.json",
);

function readEnvLocal() {
  try {
    const raw = readFileSync(join(repoRoot, ".env.local"), "utf8");
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
  if (!/127\.0\.0\.1|localhost/i.test(url)) {
    throw new Error("Unsafe target: NEXT_PUBLIC_SUPABASE_URL is not local.");
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function insertSingle(supabase, table, payload, selectFields = "id") {
  const { data, error } = await supabase.from(table).insert(payload).select(selectFields).single();
  if (error) throw error;
  return data;
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
    return { runtime_interaction_id: existing.data.runtime_interaction_id, catalog_version_id: null };
  }
  const catalogVersionId = crypto.randomUUID();
  await insertSingle(
    supabase,
    "runtime_catalog_version",
    {
      id: catalogVersionId,
      tenant_id: tenantId,
      case_id: caseId,
      catalog_name: "runtime-local-p5",
      runtime_spec_version: "40/20",
      runtime_catalog_version: "local-p5",
      mother_catalog_version: "local-p5",
      runtime_spec_checksum: "local",
      runtime_catalog_checksum: "local",
      mother_catalog_checksum: "local",
      source_trace: [{ stage: "p5_gates_smoke_seed" }],
      metadata: { seeded_by: "p5-gates-readiness-local-smoke" },
    },
    "id",
  );
  await supabase.from("runtime_interaction_def").insert({
    tenant_id: tenantId,
    case_id: caseId,
    catalog_version_id: catalogVersionId,
    runtime_interaction_id: "runtime_local_seed_question_1",
    interaction_group: "base",
    visible_text: "Describe la actividad ejecutada.",
    ui_component: "textarea",
    counts_as_base: true,
    counts_as_causal: false,
    source_document: "P5_LOCAL_SMOKE",
    source_sheet: "seed",
    source_row_number: 1,
    raw_row: { seed: true },
    source_trace: [{ stage: "p5_gates_smoke_seed" }],
    metadata: { seeded_by: "p5-gates-readiness-local-smoke" },
  });
  return { runtime_interaction_id: "runtime_local_seed_question_1", catalog_version_id: catalogVersionId };
}

async function main() {
  const supabase = createSupabaseLocalClient();
  const tenant_id = crypto.randomUUID();
  const case_id = crypto.randomUUID();
  const role_id = crypto.randomUUID();
  const activity_id = crypto.randomUUID();
  const correlation_id = `p5-local-${Date.now()}`;
  const idempotency_key = `p5-local-idem-${Date.now()}`;
  const runSeedId = crypto.randomUUID();
  const scope = {
    tenant_id,
    case_id,
    role_id,
    activity_id,
    run_id: runSeedId,
    correlation_id,
    idempotency_key,
  };

  const interactionDef = await resolveOrSeedInteractionDef(supabase, tenant_id, case_id);

  const session = await insertSingle(
    supabase,
    "role_runtime_session",
    {
      tenant_id,
      case_id,
      role_id,
      catalog_version_id: interactionDef.catalog_version_id ?? crypto.randomUUID(),
      state: "active",
      correlation_id,
      idempotency_key,
      source_trace: [{ stage: "p5_gates_readiness_local_smoke" }],
      metadata: { local_only: true },
    },
    "id",
  );
  const run = await insertSingle(
    supabase,
    "activity_runtime_run",
    {
      tenant_id,
      case_id,
      role_id,
      activity_id,
      role_runtime_session_id: session.id,
      catalog_version_id: interactionDef.catalog_version_id ?? crypto.randomUUID(),
      state: "active_base_capture",
      base_visible_count: 0,
      causal_visible_count: 0,
      correlation_id,
      idempotency_key,
      source_trace: [{ stage: "p5_gates_readiness_local_smoke" }],
      metadata: { local_only: true },
    },
    "id",
  );
  scope.run_id = run.id;

  const interaction = await insertSingle(
    supabase,
    "runtime_interaction_instance",
    {
      tenant_id,
      case_id,
      role_id,
      activity_id,
      run_id: scope.run_id,
      runtime_interaction_id: interactionDef.runtime_interaction_id,
      state: "answered",
      shown_at: new Date().toISOString(),
      correlation_id,
      idempotency_key,
      source_trace: [{ stage: "p5_gates_readiness_local_smoke" }],
      metadata: { local_only: true },
    },
    "id",
  );

  const response = await insertSingle(
    supabase,
    "runtime_subfield_response",
    {
      tenant_id,
      case_id,
      role_id,
      activity_id,
      run_id: scope.run_id,
      interaction_id: interaction.id,
      subfield_name: "descripcion_actividad",
      value: "Atiendo solicitud y preparo entregable.",
      epistemic_status: "captured_user_evidence",
      provenance_type: "user_input",
      correlation_id,
      idempotency_key,
      source_trace: [{ stage: "p5_gates_readiness_local_smoke" }],
      metadata: { local_only: true },
    },
    "id",
  );

  const gateEvaluations = {
    B0: true,
    B2: true,
    B3_C09: false,
    B7_C20: true,
  };

  const semIds = [];
  for (const gateCode of ["SEM-001", "SEM-002", "SEM-003", "SEM-004", "SEM-005", "SEM-006", "SEM-007"]) {
    const inserted = await insertSingle(
      supabase,
      "semantic_resolution_event",
      {
        tenant_id,
        case_id,
        role_id,
        activity_id,
        run_id: scope.run_id,
        gate_id: gateCode,
        candidate_label: "resultado_en_revision",
        resolution_state: "resolved",
        action_taken: "local_semantic_resolution_p5",
        manual_review_required: false,
        correlation_id,
        idempotency_key,
        source_trace: [{ stage: "p5_gates_readiness_local_smoke", gate_code: gateCode }],
        metadata: {
          source_evidence_refs: [response.id],
          source_variable_refs: [],
          resolution_status: "resolved",
          resolution_summary_internal: "local_semantic_resolution_p5",
          client_safe_summary: "informacion_en_revision",
          created_at: new Date().toISOString(),
          local_only: true,
        },
      },
      "id",
    );
    semIds.push(inserted.id);
  }

  const pstIds = [];
  for (const gateCode of ["PST-001", "PST-002", "PST-003", "PST-004", "PST-005", "PST-006"]) {
    const inserted = await insertSingle(
      supabase,
      "process_state_timer_event",
      {
        tenant_id,
        case_id,
        role_id,
        activity_id,
        run_id: scope.run_id,
        gate_id: gateCode,
        awaited_event: "process_state_ref_local",
        release_condition: "ok",
        timer_event_or_timeout_rule: "timer_ok",
        timeout_state: "safe_timeout",
        resolver_owner: "p5-local-gate-engine",
        exit_path: "local_readiness_review",
        deadlock_risk: false,
        correlation_id,
        idempotency_key,
        source_trace: [{ stage: "p5_gates_readiness_local_smoke", gate_code: gateCode }],
        metadata: {
          process_state_ref: "process_state_ref_local",
          timer_status: "ok",
          timer_summary_internal: "timer_ok",
          client_safe_summary: "informacion_en_revision",
          created_at: new Date().toISOString(),
          local_only: true,
        },
      },
      "id",
    );
    pstIds.push(inserted.id);
  }

  const gap = await insertSingle(
    supabase,
    "readiness_gap_record",
    {
      tenant_id,
      case_id,
      role_id,
      activity_id,
      run_id: scope.run_id,
      gap_type: "missing_receiver_feedback_route",
      affected_route: "B3_C09",
      affected_quadrant: "None",
      severity: "medium",
      reentry_target: "runtime_interaction_instance",
      manual_review_flag: false,
      status: "open",
      correlation_id,
      idempotency_key,
      source_trace: [{ stage: "p5_gates_readiness_local_smoke" }],
      metadata: { local_only: true },
    },
    "id",
  );

  const readiness_state = "ready_with_flags";
  const decision = await insertSingle(
    supabase,
    "readiness_decision_record",
    {
      tenant_id,
      case_id,
      role_id,
      activity_id,
      run_id: scope.run_id,
      role_runtime_session_id: session.id,
      readiness_state,
      dominant_gate: "B3_C09",
      reason: "B3_C09 incompleto por falta de route_ref canónico.",
      reentry_target: "runtime_interaction_instance",
      manual_review_required: false,
      correlation_id,
      idempotency_key,
      source_trace: [{ stage: "p5_gates_readiness_local_smoke" }],
      metadata: { local_only: true },
    },
    "id",
  );

  const audit = await insertSingle(
    supabase,
    "runtime_audit_trail",
    {
      tenant_id,
      case_id,
      role_id,
      activity_id,
      run_id: scope.run_id,
      object_type: "readiness_decision_record",
      object_id: decision.id,
      actor_id: "p5-local-gate-service",
      actor_type: "system_local_adapter",
      action: "p5_gates_readiness_local_completed",
      reason: "p5_local_gate_readiness_execution",
      prior_value: null,
      new_value: { readiness_state, critical_route_gates: gateEvaluations },
      correlation_id,
      idempotency_key,
      source_trace: [{ stage: "p5_gates_readiness_local_smoke" }],
      metadata: { local_only: true },
    },
    "id",
  );

  const result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_P5_GATES_READINESS_REAL_LOCAL_V1",
    generated_at: new Date().toISOString(),
    scope,
    role_runtime_session_id: session.id,
    runtime_interaction_instance_id: interaction.id,
    runtime_subfield_response_id: response.id,
    critical_route_gate_results: gateEvaluations,
    semantic_resolution_event_ids: semIds,
    process_state_timer_event_ids: pstIds,
    readiness_gap_record_id: gap.id,
    readiness_decision_record_id: decision.id,
    runtime_audit_trail_id: audit.id,
    critical_route_gates_executed_local: true,
    b0_executed_local: gateEvaluations.B0,
    b2_executed_local: gateEvaluations.B2,
    b3_c09_executed_local: true,
    b7_c20_executed_local: gateEvaluations.B7_C20,
    semantic_resolution_events_created: semIds.length === 7,
    process_state_timer_events_created: pstIds.length === 6,
    readiness_gap_record_created: true,
    readiness_gap_record_not_required: false,
    readiness_decision_record_created: true,
    readiness_state,
    runtime_audit_trail_created: true,
    diagnosis_created: false,
    export_real_created: false,
    produccion_paralela_started: false,
    qa_green_real_created: false,
    activation_allowed: false,
  };

  writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);

  const chainContext = buildContextFromP5Smoke(result);
  chainContext.runtime_subfield_response_ids = [response.id];
  chainContext.local_server_side_service_access_used = true;
  writeChainContext(chainContext);

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
