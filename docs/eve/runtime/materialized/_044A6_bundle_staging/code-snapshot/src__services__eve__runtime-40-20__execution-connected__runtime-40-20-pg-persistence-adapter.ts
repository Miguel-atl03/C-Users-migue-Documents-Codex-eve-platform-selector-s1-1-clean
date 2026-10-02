import { randomUUID } from "node:crypto";
import type {
  ActivityRuntimeRunStagingRow,
  BranchingDecisionStagingRow,
  BudgetLedgerStagingRow,
  CatalogBranchingRuleRow,
  CatalogEpistemicRuleRow,
  CatalogInteractionDefRow,
  CatalogSubfieldSchemaRow,
  CatalogVariableMapRow,
  CreateRunInput,
  CreateSessionInput,
  JsonObject,
  PgQueryClient,
  ProcessStateTimerEventStagingRow,
  ReadinessDecisionStagingRow,
  ReadinessGapStagingRow,
  ResponseBundleInput,
  RoleRuntimeSessionStagingRow,
  Runtime40_20PersistencePort,
  RuntimeAuditTrailStagingRow,
  RuntimeInteractionInstanceStagingRow,
  SemanticResolutionEventStagingRow,
  TransitionRunStateInput,
} from "./runtime-40-20-staging-persistence-types";
import {
  INSTRUCTION_044_METADATA,
  RUNTIME_40_20_FULL_ACTIVE_CATALOG_VERSION_ID,
} from "./runtime-40-20-staging-persistence-types";

const EXECUTION_MODE = "internal_test" as const;

function stampMetadata(extra?: JsonObject): JsonObject {
  return {
    ...INSTRUCTION_044_METADATA,
    ...(extra ?? {}),
  };
}

function assertFullCatalogId(catalogVersionId: string): void {
  if (catalogVersionId !== RUNTIME_40_20_FULL_ACTIVE_CATALOG_VERSION_ID) {
    throw new Error(
      `catalog_version_id_refused: expected FULL active id, got ${catalogVersionId}`,
    );
  }
}

function asRow<T>(row: Record<string, unknown> | undefined): T {
  if (!row) throw new Error("persistence_row_missing");
  return row as unknown as T;
}

export function createRuntime4020PgPersistenceAdapter(
  client: PgQueryClient,
): Runtime40_20PersistencePort {
  async function assertActiveCatalog(catalogVersionId: string): Promise<void> {
    assertFullCatalogId(catalogVersionId);
    const result = await client.query(
      `select catalog_version_id, status
       from public.runtime_catalog_version
       where catalog_version_id = $1
       limit 1`,
      [catalogVersionId],
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error("catalog_version_not_found");
    }
    if (String(row.status) !== "active") {
      throw new Error(`catalog_version_not_active: ${String(row.status)}`);
    }
  }

  async function createSession(input: CreateSessionInput): Promise<RoleRuntimeSessionStagingRow> {
    await assertActiveCatalog(input.catalog_version_id);
    const metadata = stampMetadata(input.metadata_json);
    const result = await client.query(
      `insert into public.role_runtime_session (
         role_runtime_session_id, sesion_id, case_id, role_id, role_label,
         catalog_version_id, state, primary_activity_limit, primary_activity_count,
         secondary_activity_count, backlog_activity_count, total_estimated_minutes,
         total_elapsed_seconds, tenant_id, organization_id, owner_auth_user_id,
         execution_mode, metadata_json, created_at, updated_at
       ) values (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18::jsonb, now(), now()
       )
       returning *`,
      [
        input.role_runtime_session_id,
        input.sesion_id,
        input.case_id,
        input.role_id,
        input.role_label ?? null,
        input.catalog_version_id,
        input.state ?? "initialized",
        input.primary_activity_limit ?? 8,
        input.primary_activity_count ?? 1,
        0,
        0,
        0,
        0,
        input.tenant_id ?? null,
        input.organization_id ?? null,
        input.owner_auth_user_id ?? null,
        EXECUTION_MODE,
        JSON.stringify(metadata),
      ],
    );
    return asRow<RoleRuntimeSessionStagingRow>(result.rows[0]);
  }

  async function createRun(input: CreateRunInput): Promise<ActivityRuntimeRunStagingRow> {
    await assertActiveCatalog(input.catalog_version_id);
    const metadata = stampMetadata(input.metadata_json);
    const result = await client.query(
      `insert into public.activity_runtime_run (
         activity_runtime_run_id, role_runtime_session_id, sesion_id, activity_id,
         legacy_actividad_id, scene_id, catalog_version_id, activity_name, activity_rank,
         is_primary_activity, state, base_visible_count, causal_visible_count,
         microconfirmation_visible_count, internal_interaction_count, readiness_state,
         current_runtime_interaction_id, tenant_id, organization_id, owner_auth_user_id,
         execution_mode, metadata_json, started_at, created_at, updated_at
       ) values (
         $1,$2,$3,$4,null,null,$5,$6,$7,$8,$9,0,0,0,0,'not_started'::eve_runtime_readiness_state,null,$10,$11,$12,$13,$14::jsonb, now(), now(), now()
       )
       returning *`,
      [
        input.activity_runtime_run_id,
        input.role_runtime_session_id,
        input.sesion_id,
        input.activity_id,
        input.catalog_version_id,
        input.activity_name ?? null,
        input.activity_rank ?? 1,
        input.is_primary_activity ?? true,
        input.state ?? "initialized",
        input.tenant_id ?? null,
        input.organization_id ?? null,
        input.owner_auth_user_id ?? null,
        EXECUTION_MODE,
        JSON.stringify(metadata),
      ],
    );
    return asRow<ActivityRuntimeRunStagingRow>(result.rows[0]);
  }

  async function transitionRunState(
    input: TransitionRunStateInput,
  ): Promise<ActivityRuntimeRunStagingRow> {
    const existing = await client.query(
      `select *
       from public.activity_runtime_run
       where activity_runtime_run_id = $1
         and metadata_json->>'instruction' = '044'
         and (metadata_json->>'synthetic')::boolean = true
       limit 1`,
      [input.activity_runtime_run_id],
    );
    const current = asRow<ActivityRuntimeRunStagingRow>(existing.rows[0]);
    assertFullCatalogId(String(current.catalog_version_id));
    if (String(current.state) !== input.from_state) {
      throw new Error(
        `run_state_mismatch: expected ${input.from_state}, got ${String(current.state)}`,
      );
    }

    const result = await client.query(
      `update public.activity_runtime_run
       set state = $2::eve_runtime_run_state,
           readiness_state = coalesce($3::eve_runtime_readiness_state, readiness_state),
           current_runtime_interaction_id = coalesce($4, current_runtime_interaction_id),
           base_visible_count = coalesce($5, base_visible_count),
           causal_visible_count = coalesce($6, causal_visible_count),
           metadata_json = coalesce(metadata_json, '{}'::jsonb) || $7::jsonb,
           updated_at = now(),
           completed_at = case
             when $2::text in ('ready','ready_with_flags','blocked','reentry_required','manual_review_required')
             then now() else completed_at end
       where activity_runtime_run_id = $1
         and metadata_json->>'instruction' = '044'
         and (metadata_json->>'synthetic')::boolean = true
       returning *`,
      [
        input.activity_runtime_run_id,
        input.to_state,
        input.readiness_state ?? null,
        input.current_runtime_interaction_id ?? null,
        input.base_visible_count ?? null,
        input.causal_visible_count ?? null,
        JSON.stringify(
          stampMetadata({
            last_transition_cause: input.cause,
            last_transition_from: input.from_state,
            last_transition_to: input.to_state,
          }),
        ),
      ],
    );
    return asRow<ActivityRuntimeRunStagingRow>(result.rows[0]);
  }

  async function createInteractionInstance(
    row: Omit<RuntimeInteractionInstanceStagingRow, "scene_id" | "metadata_json"> & {
      metadata_json?: JsonObject;
    },
  ): Promise<RuntimeInteractionInstanceStagingRow> {
    assertFullCatalogId(row.catalog_version_id);
    const metadata = stampMetadata(row.metadata_json);
    const id = row.runtime_interaction_instance_id || randomUUID();
    const result = await client.query(
      `insert into public.runtime_interaction_instance (
         runtime_interaction_instance_id, activity_runtime_run_id, role_runtime_session_id,
         sesion_id, scene_id, catalog_version_id, runtime_interaction_id,
         interaction_group_source, interaction_group_normalized, state, visibility_state,
         runtime_order, opened_by_branching_decision_id, skipped_reason,
         counts_against_base_budget, counts_against_causal_budget,
         counts_against_microconfirmation_budget, is_internal_only,
         shown_at, answered_at, closed_at, metadata_json, created_at, updated_at
       ) values (
         $1,$2,$3,$4,null,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21::jsonb, now(), now()
       )
       returning *`,
      [
        id,
        row.activity_runtime_run_id,
        row.role_runtime_session_id,
        row.sesion_id,
        row.catalog_version_id,
        row.runtime_interaction_id,
        row.interaction_group_source,
        row.interaction_group_normalized,
        row.state,
        row.visibility_state,
        row.runtime_order,
        row.opened_by_branching_decision_id,
        row.skipped_reason,
        row.counts_against_base_budget,
        row.counts_against_causal_budget,
        row.counts_against_microconfirmation_budget,
        row.is_internal_only,
        row.shown_at,
        row.answered_at,
        row.closed_at,
        JSON.stringify(metadata),
      ],
    );
    return asRow<RuntimeInteractionInstanceStagingRow>(result.rows[0]);
  }

  async function createResponseBundle(bundle: ResponseBundleInput): Promise<ResponseBundleInput> {
    const responseResult = await client.query(
      `insert into public.response_record (
         response_id, runtime_interaction_instance_id, activity_runtime_run_id,
         role_runtime_session_id, sesion_id, scene_id, selected_value, selected_values,
         free_text, raw_answer_json, epistemic_status, provenance_type, confidence,
         idempotency_key, response_revision_number, supersedes_response_id,
         invalidated_at, invalidation_reason, created_by_auth_user_id, created_at, updated_at
       ) values (
         $1,$2,$3,$4,$5,null,$6,$7::text[],$8,$9::jsonb,$10,$11,$12,$13,$14,$15,$16,$17,$18, now(), now()
       )
       returning *`,
      [
        bundle.response.response_id,
        bundle.response.runtime_interaction_instance_id,
        bundle.response.activity_runtime_run_id,
        bundle.response.role_runtime_session_id,
        bundle.response.sesion_id,
        bundle.response.selected_value,
        Array.isArray(bundle.response.selected_values)
          ? bundle.response.selected_values
          : bundle.response.selected_values == null
            ? null
            : [String(bundle.response.selected_values)],
        bundle.response.free_text,
        JSON.stringify(bundle.response.raw_answer_json ?? {}),
        bundle.response.epistemic_status,
        bundle.response.provenance_type,
        bundle.response.confidence,
        bundle.response.idempotency_key,
        bundle.response.response_revision_number,
        bundle.response.supersedes_response_id,
        bundle.response.invalidated_at,
        bundle.response.invalidation_reason,
        bundle.response.created_by_auth_user_id,
      ],
    );

    const subfields = [];
    for (const sub of bundle.subfields) {
      const r = await client.query(
        `insert into public.runtime_subfield_response (
           subfield_response_id, response_id, runtime_interaction_instance_id,
           activity_runtime_run_id, role_runtime_session_id, sesion_id, scene_id,
           subfield_name, subfield_value, subfield_value_json, canonical_variable_name,
           epistemic_status, provenance_type, confidence, created_at, updated_at
         ) values (
           $1,$2,$3,$4,$5,$6,null,$7,$8,$9::jsonb,$10,$11,$12,$13, now(), now()
         )
         returning *`,
        [
          sub.subfield_response_id,
          sub.response_id,
          sub.runtime_interaction_instance_id,
          sub.activity_runtime_run_id,
          sub.role_runtime_session_id,
          sub.sesion_id,
          sub.subfield_name,
          sub.subfield_value,
          JSON.stringify(sub.subfield_value_json ?? {}),
          sub.canonical_variable_name,
          sub.epistemic_status,
          sub.provenance_type,
          sub.confidence,
        ],
      );
      subfields.push(asRow(r.rows[0]));
    }

    const evidence = [];
    for (const item of bundle.evidence) {
      const r = await client.query(
        `insert into public.evidence_item (
           evidence_item_id, activity_runtime_run_id, role_runtime_session_id,
           runtime_interaction_instance_id, response_id, subfield_response_id,
           sesion_id, scene_id, literal_value, normalized_value, evidence_kind,
           epistemic_status, provenance_type, source_node_ref_id, source_question_code,
           response_revision_number, supersedes_evidence_item_id, confidence,
           flags_json, created_at
         ) values (
           $1,$2,$3,$4,$5,$6,$7,null,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18::jsonb, now()
         )
         returning *`,
        [
          item.evidence_item_id,
          item.activity_runtime_run_id,
          item.role_runtime_session_id,
          item.runtime_interaction_instance_id,
          item.response_id,
          item.subfield_response_id,
          item.sesion_id,
          item.literal_value,
          JSON.stringify(item.normalized_value ?? item.literal_value ?? null),
          item.evidence_kind,
          item.epistemic_status,
          item.provenance_type,
          item.source_node_ref_id,
          item.source_question_code,
          item.response_revision_number,
          item.supersedes_evidence_item_id,
          item.confidence,
          JSON.stringify(
            stampMetadata((item.flags_json as JsonObject | null) ?? undefined),
          ),
        ],
      );
      evidence.push(asRow(r.rows[0]));
    }

    const canonical_variables = [];
    for (const cv of bundle.canonical_variables) {
      const r = await client.query(
        `insert into public.canonical_variable_record (
           canonical_variable_id, activity_runtime_run_id, role_runtime_session_id,
           sesion_id, scene_id, variable_name, variable_value, variable_type, route_id,
           route_status, source_evidence_item_ids, derived_from_response_ids,
           gap_flag, gap_type, required_if_condition, confidence, object_binding_status,
           diagnostic_status, invalidated_at, invalidation_reason, created_at, updated_at
         ) values (
           $1,$2,$3,$4,null,$5,$6::jsonb,$7,$8,$9,$10::uuid[],$11::uuid[],
           $12,$13,$14,$15,$16,$17,$18,$19, now(), now()
         )
         returning *`,
        [
          cv.canonical_variable_id,
          cv.activity_runtime_run_id,
          cv.role_runtime_session_id,
          cv.sesion_id,
          cv.variable_name,
          JSON.stringify(cv.variable_value ?? null),
          cv.variable_type,
          cv.route_id,
          cv.route_status,
          cv.source_evidence_item_ids ?? [],
          cv.derived_from_response_ids ?? [],
          cv.gap_flag,
          cv.gap_type,
          cv.required_if_condition,
          cv.confidence,
          cv.object_binding_status ?? "pending_object_inventory_phase",
          cv.diagnostic_status ?? "non_diagnostic",
          cv.invalidated_at,
          cv.invalidation_reason,
        ],
      );
      canonical_variables.push(asRow(r.rows[0]));
    }

    return {
      response: asRow(responseResult.rows[0]),
      subfields: subfields as ResponseBundleInput["subfields"],
      evidence: evidence as ResponseBundleInput["evidence"],
      canonical_variables: canonical_variables as ResponseBundleInput["canonical_variables"],
    };
  }

  async function createBranchingDecision(
    row: BranchingDecisionStagingRow,
  ): Promise<BranchingDecisionStagingRow> {
    const result = await client.query(
      `insert into public.branching_decision (
         branching_decision_id, activity_runtime_run_id, role_runtime_session_id, sesion_id,
         source_interaction_instance_id, target_runtime_interaction_id,
         opened_interaction_instance_id, closed_interaction_instance_id,
         decision_type, trigger_signal, causal_score, reason, budget_effect, route_id, created_at
       ) values (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14, now()
       )
       returning *`,
      [
        row.branching_decision_id,
        row.activity_runtime_run_id,
        row.role_runtime_session_id,
        row.sesion_id,
        row.source_interaction_instance_id,
        row.target_runtime_interaction_id,
        row.opened_interaction_instance_id,
        row.closed_interaction_instance_id,
        row.decision_type,
        row.trigger_signal,
        row.causal_score,
        row.reason,
        typeof row.budget_effect === "string"
          ? JSON.stringify({ bucket: row.budget_effect })
          : JSON.stringify(row.budget_effect ?? { bucket: "causal_20" }),
        row.route_id,
      ],
    );
    return asRow(result.rows[0]);
  }

  async function createBudgetLedgerEntry(
    row: BudgetLedgerStagingRow,
  ): Promise<BudgetLedgerStagingRow> {
    const result = await client.query(
      `insert into public.budget_ledger (
         budget_ledger_id, role_runtime_session_id, activity_runtime_run_id,
         runtime_interaction_instance_id, sesion_id, event_type, bucket,
         base_count_delta, causal_count_delta, microconfirmation_count_delta,
         internal_count_delta, base_visible_count, causal_visible_count,
         estimated_seconds_added, event_ref, metadata_json, created_at
       ) values (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb, now()
       )
       returning *`,
      [
        row.budget_ledger_id,
        row.role_runtime_session_id,
        row.activity_runtime_run_id,
        row.runtime_interaction_instance_id,
        row.sesion_id,
        row.event_type,
        row.bucket,
        row.base_count_delta,
        row.causal_count_delta,
        row.microconfirmation_count_delta,
        row.internal_count_delta,
        row.base_visible_count,
        row.causal_visible_count,
        row.estimated_seconds_added ?? 0,
        row.event_ref,
        JSON.stringify(stampMetadata(row.metadata_json)),
      ],
    );
    return asRow(result.rows[0]);
  }

  async function createSemanticResolutionEvent(
    row: SemanticResolutionEventStagingRow,
  ): Promise<SemanticResolutionEventStagingRow> {
    const result = await client.query(
      `insert into public.semantic_resolution_event (
         semantic_resolution_event_id, activity_runtime_run_id, role_runtime_session_id,
         runtime_interaction_instance_id, response_id, sesion_id, scene_id,
         gate_code, observed_term, proposed_resolution, resolution_status,
         blocks_projection, reason, event_json, created_at
       ) values (
         $1,$2,$3,$4,$5,$6,null,$7,$8,$9,$10,$11,$12,$13::jsonb, now()
       )
       returning *`,
      [
        row.semantic_resolution_event_id,
        row.activity_runtime_run_id,
        row.role_runtime_session_id,
        row.runtime_interaction_instance_id,
        row.response_id,
        row.sesion_id,
        row.gate_code,
        row.observed_term,
        row.proposed_resolution,
        row.resolution_status,
        row.blocks_projection,
        row.reason,
        JSON.stringify(
          stampMetadata((row.event_json as JsonObject | null) ?? undefined),
        ),
      ],
    );
    return asRow(result.rows[0]);
  }

  async function createProcessStateTimerEvent(
    row: ProcessStateTimerEventStagingRow,
  ): Promise<ProcessStateTimerEventStagingRow> {
    const result = await client.query(
      `insert into public.process_state_timer_event (
         process_state_timer_event_id, activity_runtime_run_id, role_runtime_session_id,
         runtime_interaction_instance_id, response_id, sesion_id, scene_id,
         gate_code, awaited_event, release_condition, timer_or_timeout_rule,
         timeout_state, resolver_owner, exit_path, deadlock_risk, event_status,
         event_json, created_at
       ) values (
         $1,$2,$3,$4,$5,$6,null,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb, now()
       )
       returning *`,
      [
        row.process_state_timer_event_id,
        row.activity_runtime_run_id,
        row.role_runtime_session_id,
        row.runtime_interaction_instance_id,
        row.response_id,
        row.sesion_id,
        row.gate_code,
        row.awaited_event,
        row.release_condition,
        row.timer_or_timeout_rule,
        row.timeout_state,
        row.resolver_owner,
        row.exit_path,
        row.deadlock_risk,
        row.event_status,
        JSON.stringify(
          stampMetadata((row.event_json as JsonObject | null) ?? undefined),
        ),
      ],
    );
    return asRow(result.rows[0]);
  }

  async function updateProcessStateTimerEvent(
    eventId: string,
    patch: Partial<ProcessStateTimerEventStagingRow>,
  ): Promise<ProcessStateTimerEventStagingRow> {
    const result = await client.query(
      `update public.process_state_timer_event
       set event_status = coalesce($2, event_status),
           release_condition = coalesce($3, release_condition),
           timeout_state = coalesce($4, timeout_state),
           event_json = coalesce(event_json, '{}'::jsonb) || $5::jsonb
       where process_state_timer_event_id = $1
         and (event_json->>'instruction' = '044' or event_json->>'synthetic' = 'true')
       returning *`,
      [
        eventId,
        patch.event_status ?? null,
        patch.release_condition ?? null,
        patch.timeout_state ?? null,
        JSON.stringify(stampMetadata((patch.event_json as JsonObject | null) ?? undefined)),
      ],
    );
    return asRow(result.rows[0]);
  }

  async function markInteractionInstanceAnswered(
    runtimeInteractionInstanceId: string,
  ): Promise<void> {
    await client.query(
      `update public.runtime_interaction_instance
       set state = 'answered'::eve_runtime_interaction_state,
           answered_at = coalesce(answered_at, now()),
           updated_at = now(),
           metadata_json = coalesce(metadata_json, '{}'::jsonb) || $2::jsonb
       where runtime_interaction_instance_id = $1
         and metadata_json->>'instruction' = '044'`,
      [runtimeInteractionInstanceId, JSON.stringify(stampMetadata({ answered: true }))],
    );
  }

  async function createReadinessGap(
    row: ReadinessGapStagingRow,
  ): Promise<ReadinessGapStagingRow> {
    const result = await client.query(
      `insert into public.readiness_gap_record (
         readiness_gap_id, activity_runtime_run_id, role_runtime_session_id, sesion_id,
         scene_id, gap_type, gap_code, severity, description, route_id,
         related_variable_name, related_interaction_instance_id, requires_reentry,
         reentry_target, manual_review_required, status, created_at, updated_at, metadata_json
       ) values (
         $1,$2,$3,$4,null,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15, now(), now(), $16::jsonb
       )
       returning *`,
      [
        row.readiness_gap_id,
        row.activity_runtime_run_id,
        row.role_runtime_session_id,
        row.sesion_id,
        row.gap_type,
        row.gap_code,
        row.severity,
        row.description,
        row.route_id,
        row.related_variable_name,
        row.related_interaction_instance_id,
        row.requires_reentry,
        row.reentry_target,
        row.manual_review_required,
        row.status,
        JSON.stringify(stampMetadata(row.metadata_json)),
      ],
    );
    return asRow(result.rows[0]);
  }

  async function createReadinessDecision(
    row: ReadinessDecisionStagingRow,
  ): Promise<ReadinessDecisionStagingRow> {
    const result = await client.query(
      `insert into public.readiness_decision_record (
         readiness_decision_id, role_runtime_session_id, activity_runtime_run_id,
         sesion_id, scene_id, decision_scope, readiness_state, gap_ids,
         manual_review_required, reentry_required, reentry_target, decision_reason,
         decision_json, decided_by, created_at
       ) values (
         $1,$2,$3,$4,null,$5,$6,$7::uuid[],$8,$9,$10,$11,$12::jsonb,$13, now()
       )
       returning *`,
      [
        row.readiness_decision_id,
        row.role_runtime_session_id,
        row.activity_runtime_run_id,
        row.sesion_id,
        row.decision_scope,
        row.readiness_state,
        row.gap_ids ?? [],
        row.manual_review_required,
        row.reentry_required,
        row.reentry_target,
        row.decision_reason,
        JSON.stringify(
          stampMetadata((row.decision_json as JsonObject | null) ?? undefined),
        ),
        row.decided_by,
      ],
    );
    return asRow(result.rows[0]);
  }

  async function createAuditTrail(
    row: RuntimeAuditTrailStagingRow,
  ): Promise<RuntimeAuditTrailStagingRow> {
    const result = await client.query(
      `insert into public.runtime_audit_trail (
         runtime_audit_id, role_runtime_session_id, activity_runtime_run_id,
         runtime_interaction_instance_id, sesion_id, scene_id, actor_type,
         actor_auth_user_id, event_type, entity_table, entity_id, event_summary,
         before_json, after_json, metadata_json, created_at
       ) values (
         $1,$2,$3,$4,$5,null,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb,$14::jsonb, now()
       )
       returning *`,
      [
        row.runtime_audit_id,
        row.role_runtime_session_id,
        row.activity_runtime_run_id,
        row.runtime_interaction_instance_id,
        row.sesion_id,
        row.actor_type,
        row.actor_auth_user_id,
        row.event_type,
        row.entity_table,
        row.entity_id,
        row.event_summary,
        JSON.stringify(row.before_json ?? {}),
        JSON.stringify(row.after_json ?? {}),
        JSON.stringify(stampMetadata(row.metadata_json)),
      ],
    );
    return asRow(result.rows[0]);
  }

  async function loadCatalogInteractionIds(catalogVersionId: string): Promise<string[]> {
    await assertActiveCatalog(catalogVersionId);
    const result = await client.query(
      `select runtime_interaction_id
       from public.runtime_interaction_def
       where catalog_version_id = $1
         and coalesce(active, true) = true
       order by runtime_order nulls last, runtime_interaction_id`,
      [catalogVersionId],
    );
    return result.rows.map((row) => String(row.runtime_interaction_id));
  }

  async function loadCatalogInteractionDefs(
    catalogVersionId: string,
  ): Promise<CatalogInteractionDefRow[]> {
    await assertActiveCatalog(catalogVersionId);
    const result = await client.query(
      `select runtime_interaction_id, interaction_group_source, interaction_group_normalized,
              runtime_order, visible_text, ui_component, pm_output, moc_output, pf_output,
              olc_output, mmabp_ir_target, readiness_effect, registry_target, raw_row_json, active
       from public.runtime_interaction_def
       where catalog_version_id = $1
         and coalesce(active, true) = true
       order by runtime_order nulls last, runtime_interaction_id`,
      [catalogVersionId],
    );
    return result.rows as unknown as CatalogInteractionDefRow[];
  }

  async function loadBranchingRules(
    catalogVersionId: string,
  ): Promise<CatalogBranchingRuleRow[]> {
    await assertActiveCatalog(catalogVersionId);
    const result = await client.query(
      `select catalog_version_id, runtime_interaction_id, field_name, raw_literal,
              source_file, source_sheet, source_row, source_column, trace_id, source_checksum
       from public.runtime_branching_rule
       where catalog_version_id = $1`,
      [catalogVersionId],
    );
    return result.rows as unknown as CatalogBranchingRuleRow[];
  }

  async function loadVariableMaps(
    catalogVersionId: string,
  ): Promise<CatalogVariableMapRow[]> {
    await assertActiveCatalog(catalogVersionId);
    const result = await client.query(
      `select catalog_version_id, runtime_interaction_id, field_name, raw_literal,
              source_file, source_sheet, source_row, source_column, trace_id, source_checksum
       from public.runtime_variable_map
       where catalog_version_id = $1`,
      [catalogVersionId],
    );
    return result.rows as unknown as CatalogVariableMapRow[];
  }

  async function loadCatalogSubfieldSchemas(
    catalogVersionId: string,
  ): Promise<CatalogSubfieldSchemaRow[]> {
    await assertActiveCatalog(catalogVersionId);
    const result = await client.query(
      `select subfield_schema_id, catalog_version_id, runtime_interaction_id,
              subfield_name, subfield_label, subfield_type, required, ordinal,
              storage_rule, ui_component, raw_row_json
       from public.runtime_subfield_schema
       where catalog_version_id = $1
       order by runtime_interaction_id, ordinal nulls last, subfield_name`,
      [catalogVersionId],
    );
    return result.rows as unknown as CatalogSubfieldSchemaRow[];
  }

  async function loadCatalogEpistemicRules(
    catalogVersionId: string,
  ): Promise<CatalogEpistemicRuleRow[]> {
    await assertActiveCatalog(catalogVersionId);
    const result = await client.query(
      `select catalog_version_id, runtime_interaction_id, field_name, raw_literal,
              source_file, source_sheet, source_row, trace_id
       from public.runtime_epistemic_rule
       where catalog_version_id = $1`,
      [catalogVersionId],
    );
    return result.rows as unknown as CatalogEpistemicRuleRow[];
  }

  return {
    createSession,
    createRun,
    transitionRunState,
    createInteractionInstance,
    createResponseBundle,
    createBranchingDecision,
    createBudgetLedgerEntry,
    createSemanticResolutionEvent,
    createProcessStateTimerEvent,
    createReadinessGap,
    createReadinessDecision,
    createAuditTrail,
    assertActiveCatalog,
    loadCatalogInteractionIds,
    loadBranchingRules,
    loadVariableMaps,
    loadCatalogInteractionDefs,
    loadCatalogSubfieldSchemas,
    loadCatalogEpistemicRules,
    updateProcessStateTimerEvent,
    markInteractionInstanceAnswered,
  };
}
