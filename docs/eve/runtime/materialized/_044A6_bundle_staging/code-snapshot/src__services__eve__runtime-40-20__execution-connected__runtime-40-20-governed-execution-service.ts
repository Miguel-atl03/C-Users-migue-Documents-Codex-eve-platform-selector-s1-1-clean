import { randomUUID } from "node:crypto";
import { createRuntimeInteractionViewModels } from "../interaction-renderer/runtime-40-20-interaction-renderer-service";
import { ingestRuntime4020ResponseLocal } from "../response-ingest/runtime-40-20-response-ingest-service";
import { createRuntime4020CanonicalVariableCandidatesLocal } from "../canonical-variable/runtime-40-20-canonical-variable-service";
import { createRuntime4020BranchingCandidatesLocal } from "../branching/runtime-40-20-branching-service";
import {
  classifyCausalEligibility044A4,
  getExactBranchingRulesForSourceInteraction,
  getPendingCausalsForSourceInteraction,
  getUnresolvedCausalRecord,
  getUnresolvedCausalsForSourceInteraction,
  loadBranchingAuthorityCrosswalk044A4R,
} from "../branching/runtime-40-20-branching-authority-crosswalk";
import type { RuntimeBranchingRuleInput } from "../branching/runtime-40-20-branching-types";
import {
  buildSemanticResolutionEventInsert,
  evaluateCriticalRouteGateLocally,
  resolveReadinessEvaluation,
} from "../gates-readiness/runtime-40-20-gates-readiness-service";
import { applyConnectedRunTransition } from "./runtime-40-20-connected-orchestrator-service";
import type {
  ActivityRuntimeRunStagingRow,
  CatalogEpistemicRuleRow,
  CatalogInteractionDefRow,
  CatalogSubfieldSchemaRow,
  JsonObject,
  Runtime40_20PersistencePort,
  RoleRuntimeSessionStagingRow,
} from "./runtime-40-20-staging-persistence-types";
import {
  INSTRUCTION_044_METADATA,
  RUNTIME_40_20_FULL_ACTIVE_CATALOG_VERSION_ID,
} from "./runtime-40-20-staging-persistence-types";
import type { ActivityRuntimeRunState } from "../domain/runtime-40-20-domain-state-types";
import type { RuntimeInteractionDefinitionCandidate } from "../catalog-canonicalization/runtime-40-20-catalog-canonicalization-types";
import type { RuntimeSubfieldSchemaCandidate } from "../catalog-canonicalization/runtime-40-20-catalog-canonicalization-types";
import type { RuntimeInteractionViewModel } from "../interaction-renderer/runtime-40-20-interaction-renderer-types";
import type { RuntimeResponsePayload } from "../response-ingest/runtime-40-20-response-ingest-types";
import {
  getAuthorizedCanonicalMappingsForInteraction,
  getSourceCaptureRelationsForInteraction,
  getSourceCaptureSlotsForInteraction,
  loadSourceCaptureCrosswalk044A3M,
  type SourceCaptureSlot,
} from "../source-capture/runtime-40-20-source-capture-crosswalk";
import {
  evaluateRegulatoryLayer044A5,
  resolveRegulatoryReadinessState,
  type RegulatoryEvidenceBag,
} from "./runtime-40-20-regulatory-layer-044A5-service";
import type { EVEProductionCriticalRouteGateCode } from "../gates-readiness/runtime-40-20-gates-readiness-types";
import {
  buildB7ConfidenceInputFromEvidence,
  evaluateB7Confidence,
} from "../b7-confidence/runtime-40-20-b7-confidence-service";
import type { B7ConfidenceInput } from "../b7-confidence/runtime-40-20-b7-confidence-types";

export type GovernedExecutionAction =
  | "start_synthetic_run"
  | "render_next"
  | "ingest_response"
  | "evaluate_gates"
  | "release_timer"
  | "complete_readiness";

export interface GovernedExecutionAdvanceRequest {
  action: GovernedExecutionAction;
  synthetic_case_token: string;
  run_id?: string;
  interaction_id?: string;
  runtime_interaction_instance_id?: string;
  answers?: Record<string, unknown>;
  /** Optional conditional clarification slots activated for this ingest. */
  active_conditional_source_codes?: string[];
  /** Forbidden — always rejected if present. */
  catalog_version_id?: unknown;
  timer_event_id?: string;
  test_clock?: string;
  state_as_class_detected?: boolean;
  observed_term?: string;
  include_causal_capture?: boolean;
  /** 044-A.5 — structured SEM detection flags (never inferred from free text). */
  sem_signals?: Record<string, unknown>;
  /** 044-A.5 — structured process-state wait evidence. */
  process_state_wait?: Record<string, unknown>;
  /** 044-A.5 — B7 contamination attempts. */
  b7_contamination?: Record<string, unknown>;
  /** 044-A.5B-R — epistemic confidence input overrides. */
  b7_confidence_input?: Record<string, unknown>;
  /** 044-A.5 — forbidden caller-forced ready. */
  force_ready?: boolean;
}

export interface GovernedExecutionContext {
  persistence: Runtime40_20PersistencePort;
  case_id: string;
  role_id: string;
  activity_id: string;
  tenant_id?: string;
  owner_auth_user_id?: string;
  /** In-memory run store for unit tests / same-process orchestration. */
  store?: GovernedRunStore;
}

export interface GovernedRunStore {
  sessions: Map<string, RoleRuntimeSessionStagingRow>;
  runs: Map<string, ActivityRuntimeRunStagingRow & { answered: string[] }>;
  interaction_defs: CatalogInteractionDefRow[];
  subfield_schemas: CatalogSubfieldSchemaRow[];
  epistemic_rules: CatalogEpistemicRuleRow[];
  view_models: Map<string, RuntimeInteractionViewModel>;
  open_instances: Map<string, string>;
  timers: Map<string, { event_id: string; status: string; release_condition: string }>;
  base_visible_count: number;
  causal_visible_count: number;
  /** 044-A.4 — causals already opened for this run (no double-open). */
  opened_causal_ids: Set<string>;
  /** 044-A.5 — persisted canonical variable bag for regulatory evaluation. */
  canonical_variable_bag: Record<string, unknown>;
  /** 044-A.5 — last regulatory layer evaluation. */
  last_regulatory_evaluation?: Record<string, unknown>;
  /** 044-A.5 — runtime phase for state machine. */
  runtime_phase:
    | "intake_main_activities"
    | "questionnaire_main"
    | "causal_evaluation_pending"
    | "active_causal_capture"
    | "readiness_evaluation"
    | "intake_completed";
}

function normalizeGroupSource(
  value: string | null | undefined,
  causal: boolean,
): string {
  const v = String(value ?? "").toLowerCase();
  if (
    v === "base_40" ||
    v === "causal_20" ||
    v === "internal" ||
    v === "clarification" ||
    v === "microconfirmation"
  ) {
    return v;
  }
  if (v.includes("causal")) return "causal_20";
  if (v.includes("base")) return "base_40";
  return causal ? "causal_20" : "base_40";
}

function normalizeGroupNormalized(
  value: string | null | undefined,
  causal: boolean,
): string {
  const v = String(value ?? "").toLowerCase();
  if (
    v === "base" ||
    v === "causal" ||
    v === "internal" ||
    v === "clarification" ||
    v === "microconfirmation"
  ) {
    return v;
  }
  if (v.includes("causal")) return "causal";
  if (v.includes("base")) return "base";
  return causal ? "causal" : "base";
}

function rejectCatalogOverride(body: GovernedExecutionAdvanceRequest): void {
  if (body.catalog_version_id !== undefined) {
    throw new Error("catalog_version_id_override_rejected");
  }
}

function defToInteractionCandidate(
  def: CatalogInteractionDefRow,
): RuntimeInteractionDefinitionCandidate {
  const group =
    String(def.interaction_group_normalized ?? def.interaction_group_source ?? "")
      .toLowerCase()
      .includes("causal")
      ? "causal"
      : "base";
  return {
    runtime_interaction_id: def.runtime_interaction_id,
    interaction_group: group,
    visible_text: def.visible_text ?? def.runtime_interaction_id,
    source_refs: [],
    ui_component: def.ui_component ?? "compound_card",
    counts_as_base: group === "base",
    counts_as_causal: group === "causal",
    source_document:
      "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx" as const,
    source_sheet: "runtime_interaction_def",
    source_row_number: def.runtime_order ?? 0,
    raw_row: def.raw_row_json ?? {},
    canonicalization_status: "normalized",
    warnings: [],
    blockers: [],
  };
}

/**
 * 044-A.3M — Canonical mappings come exclusively from the validated
 * source-capture crosswalk. Prose EAV / invented parsers / var_${n} are forbidden.
 *
 * 044-A.4 — Branching rules come exclusively from the validated branching
 * authority crosswalk. Legacy mapBranchingRules / evaluateCatalogOpenNodesBranching
 * (regex Cxx, answerBlob, is_present defaults, br-${index}) are removed from the
 * executable path.
 */

function mapBranchingRules(_rows: unknown): RuntimeBranchingRuleInput[] {
  // Dead non-executable stub retained only so accidental callers fail closed.
  void _rows;
  return [];
}

function ensureStore(ctx: GovernedExecutionContext): GovernedRunStore {
  if (!ctx.store) {
    ctx.store = {
      sessions: new Map(),
      runs: new Map(),
      interaction_defs: [],
      subfield_schemas: [],
      epistemic_rules: [],
      view_models: new Map(),
      open_instances: new Map(),
      timers: new Map(),
      base_visible_count: 0,
      causal_visible_count: 0,
      opened_causal_ids: new Set(),
      canonical_variable_bag: {},
      runtime_phase: "intake_main_activities",
    };
  }
  if (!ctx.store.opened_causal_ids) {
    ctx.store.opened_causal_ids = new Set();
  }
  if (!ctx.store.canonical_variable_bag) {
    ctx.store.canonical_variable_bag = {};
  }
  if (!ctx.store.runtime_phase) {
    ctx.store.runtime_phase = "intake_main_activities";
  }
  return ctx.store;
}

export async function advanceGovernedExecution(
  ctx: GovernedExecutionContext,
  body: GovernedExecutionAdvanceRequest,
): Promise<Record<string, unknown>> {
  rejectCatalogOverride(body);
  if (!body.synthetic_case_token || typeof body.synthetic_case_token !== "string") {
    throw new Error("synthetic_case_token_required");
  }

  const store = ensureStore(ctx);

  switch (body.action) {
    case "start_synthetic_run":
      return startSyntheticRun(ctx, store, body);
    case "render_next":
      return renderNext(ctx, store, body);
    case "ingest_response":
      return ingestResponse(ctx, store, body);
    case "evaluate_gates":
      return evaluateGates(ctx, store, body);
    case "release_timer":
      return releaseTimer(ctx, store, body);
    case "complete_readiness":
      return completeReadiness(ctx, store, body);
    default:
      throw new Error(`unsupported_action:${String((body as { action?: string }).action)}`);
  }
}

async function startSyntheticRun(
  ctx: GovernedExecutionContext,
  store: GovernedRunStore,
  body: GovernedExecutionAdvanceRequest,
): Promise<Record<string, unknown>> {
  await ctx.persistence.assertActiveCatalog(RUNTIME_40_20_FULL_ACTIVE_CATALOG_VERSION_ID);
  const defs =
    (await ctx.persistence.loadCatalogInteractionDefs?.(
      RUNTIME_40_20_FULL_ACTIVE_CATALOG_VERSION_ID,
    )) ??
    (await ctx.persistence.loadCatalogInteractionIds(
      RUNTIME_40_20_FULL_ACTIVE_CATALOG_VERSION_ID,
    )).map(
      (id): CatalogInteractionDefRow => ({
        runtime_interaction_id: id,
        interaction_group_source: id.startsWith("C") ? "causal_20" : "base_40",
        interaction_group_normalized: id.startsWith("C") ? "causal" : "base",
        runtime_order: null,
        visible_text: id,
        ui_component: "compound_card",
        pm_output: null,
        moc_output: null,
        pf_output: null,
        olc_output: null,
        mmabp_ir_target: null,
        readiness_effect: null,
        registry_target: null,
        raw_row_json: { runtime_interaction_id: id },
        active: true,
      }),
    );

  store.interaction_defs = defs;
  store.subfield_schemas =
    (await ctx.persistence.loadCatalogSubfieldSchemas?.(
      RUNTIME_40_20_FULL_ACTIVE_CATALOG_VERSION_ID,
    )) ?? [];
  store.epistemic_rules =
    (await ctx.persistence.loadCatalogEpistemicRules?.(
      RUNTIME_40_20_FULL_ACTIVE_CATALOG_VERSION_ID,
    )) ?? [];

  const sessionId = randomUUID();
  // Staging PK columns are uuid; synthetic case_id remains a text isolation key.
  const runId =
    typeof body.run_id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      body.run_id,
    )
      ? body.run_id
      : randomUUID();
  const sesionId = randomUUID();
  const syntheticMeta = {
    ...INSTRUCTION_044_METADATA,
    synthetic_case_token: body.synthetic_case_token,
    synthetic_case_id: ctx.case_id,
    synthetic_run_id: body.run_id ?? runId,
  };

  const session = await ctx.persistence.createSession({
    role_runtime_session_id: sessionId,
    sesion_id: sesionId,
    case_id: ctx.case_id,
    role_id: ctx.role_id,
    catalog_version_id: RUNTIME_40_20_FULL_ACTIVE_CATALOG_VERSION_ID,
    state: "initialized",
    tenant_id: ctx.tenant_id ?? null,
    owner_auth_user_id: ctx.owner_auth_user_id ?? null,
    metadata_json: syntheticMeta,
  });

  const run = await ctx.persistence.createRun({
    activity_runtime_run_id: runId,
    role_runtime_session_id: sessionId,
    sesion_id: sesionId,
    activity_id: ctx.activity_id,
    catalog_version_id: RUNTIME_40_20_FULL_ACTIVE_CATALOG_VERSION_ID,
    activity_name: ctx.activity_id,
    state: "initialized",
    tenant_id: ctx.tenant_id ?? null,
    owner_auth_user_id: ctx.owner_auth_user_id ?? null,
    metadata_json: syntheticMeta,
  });

  store.sessions.set(sessionId, session);
  store.runs.set(runId, { ...run, answered: [] });

  await applyConnectedRunTransition({
    persistence: ctx.persistence,
    role_runtime_session_id: sessionId,
    activity_runtime_run_id: runId,
    sesion_id: sesionId,
    from: "initialized",
    to: "semantic_preload_loaded",
    cause: "governed_start_synthetic_run",
    actor_auth_user_id: ctx.owner_auth_user_id,
  });
  await applyConnectedRunTransition({
    persistence: ctx.persistence,
    role_runtime_session_id: sessionId,
    activity_runtime_run_id: runId,
    sesion_id: sesionId,
    from: "semantic_preload_loaded",
    to: "b0_confirmation_pending",
    cause: "governed_semantic_preload_loaded",
    actor_auth_user_id: ctx.owner_auth_user_id,
  });
  await applyConnectedRunTransition({
    persistence: ctx.persistence,
    role_runtime_session_id: sessionId,
    activity_runtime_run_id: runId,
    sesion_id: sesionId,
    from: "b0_confirmation_pending",
    to: "active_base_capture",
    cause: "governed_b0_confirmed_synthetic",
    actor_auth_user_id: ctx.owner_auth_user_id,
  });

  const current = store.runs.get(runId)!;
  current.state = "active_base_capture";
  store.runs.set(runId, current);

  return {
    ok: true,
    action: "start_synthetic_run",
    role_runtime_session_id: sessionId,
    activity_runtime_run_id: runId,
    catalog_version_id: RUNTIME_40_20_FULL_ACTIVE_CATALOG_VERSION_ID,
    interaction_def_count: defs.length,
    state: "active_base_capture",
    materiality: {
      local_only: false,
      runtime_40_20_started: true,
      instruction: "044",
    },
  };
}

async function renderNext(
  ctx: GovernedExecutionContext,
  store: GovernedRunStore,
  body: GovernedExecutionAdvanceRequest,
): Promise<Record<string, unknown>> {
  const run = requireRun(store, body.run_id);
  const stateBefore = run.state;
  const instancesBefore = store.open_instances.size;
  const interactionId =
    body.interaction_id ??
    pickNextInteractionId(store, run.answered);
  if (!interactionId) {
    return { ok: true, action: "render_next", done: true, next: null };
  }
  assertInteractionInFullCatalog(store, interactionId);

  await ensureRendererCatalogSources(ctx, store);

  const def = store.interaction_defs.find((d) => d.runtime_interaction_id === interactionId);
  if (!def) throw new Error("interaction_def_missing");

  const interactionDefinitions = store.interaction_defs.map(defToInteractionCandidate);
  if (interactionDefinitions.length !== 60) {
    throw new Error(
      `blocked_real_renderer_path_failed:interaction_definition_count_not_60:${interactionDefinitions.length}`,
    );
  }

  const subfieldSchemas = mapCatalogSubfieldsToRendererCandidates(
    store.subfield_schemas,
    store.epistemic_rules,
  );

  const renderer = createRuntimeInteractionViewModels({
    case_id: ctx.case_id,
    interaction_definitions: interactionDefinitions,
    subfield_schemas: subfieldSchemas,
    orchestrator_result: {
      ok: true,
      case_id: ctx.case_id,
      role_runtime_session_plan: {} as never,
      primary_activity_selection_plan: {} as never,
      activity_runtime_run_plans: [],
      interaction_queue_plans: [],
      next_interaction_decisions: [
        {
          run_plan_id: run.activity_runtime_run_id,
          activity_id: ctx.activity_id,
          decision_type: "semantic_preload_ready",
          next_state_hint: "semantic_preload_loaded",
          next_interaction_hint: interactionId as never,
          ui_rendered: false,
        },
      ],
      budget_ledger_previews: [],
      readiness_precheck: {} as never,
      no_go_check: {
        no_go_triggered: false,
        blockers: [],
        runtime_40_20_started: false,
        catalog_activated: false,
        migration_applied: false,
        supabase_touched: false,
        sql_executed: false,
        endpoint_created: false,
        real_runtime_records_created: false,
        real_interaction_instances_created: false,
        business_evidence_created: false,
        registry_live_db_created: false,
        ir_real_created: false,
        object_inventory_real_opened: false,
        f5c_real_opened: false,
        export_created: false,
        diagnosis_created: false,
        delivered_created: false,
      },
      materiality: {
        level: "runtime_40_20_activity_runtime_orchestrator_local_contract",
        local_only: true,
        runtime_40_20_started: false,
        next_authorization_required: true,
      },
    },
  });

  const viewModel =
    renderer.interaction_view_models.find(
      (vm) => vm.runtime_interaction_id === interactionId,
    ) ?? null;

  if (
    !renderer.ok ||
    !viewModel ||
    viewModel.renderer_status !== "render_model_ready"
  ) {
    throw new Error(
      `blocked_real_renderer_path_failed:${
        renderer.blocked_reason ??
        viewModel?.renderer_status ??
        "missing_view_model"
      }`,
    );
  }

  const boundViewModel = bindSourceCaptureSlotsToViewModel(viewModel);

  const candidate = interactionDefinitions.find(
    (d) => d.runtime_interaction_id === interactionId,
  )!;

  const instance = await ctx.persistence.createInteractionInstance({
    runtime_interaction_instance_id: randomUUID(),
    activity_runtime_run_id: run.activity_runtime_run_id,
    role_runtime_session_id: run.role_runtime_session_id,
    sesion_id: run.sesion_id,
    catalog_version_id: RUNTIME_40_20_FULL_ACTIVE_CATALOG_VERSION_ID,
    runtime_interaction_id: interactionId,
    interaction_group_source: normalizeGroupSource(
      def.interaction_group_source,
      candidate.counts_as_causal === true,
    ),
    interaction_group_normalized: normalizeGroupNormalized(
      def.interaction_group_normalized,
      candidate.counts_as_causal === true,
    ),
    state: "shown",
    visibility_state: "visible",
    runtime_order: def.runtime_order,
    opened_by_branching_decision_id: null,
    skipped_reason: null,
    counts_against_base_budget: candidate.counts_as_base,
    counts_against_causal_budget: candidate.counts_as_causal,
    counts_against_microconfirmation_budget: false,
    is_internal_only: false,
    shown_at: new Date().toISOString(),
    answered_at: null,
    closed_at: null,
    metadata_json: { ...INSTRUCTION_044_METADATA },
  });

  store.view_models.set(interactionId, boundViewModel);
  store.open_instances.set(interactionId, instance.runtime_interaction_instance_id);

  return {
    ok: true,
    action: "render_next",
    runtime_interaction_id: interactionId,
    runtime_interaction_instance_id: instance.runtime_interaction_instance_id,
    view_model_status: boundViewModel.renderer_status,
    renderer_ok: true,
    renderer_path: "createRuntimeInteractionViewModels+source_capture_crosswalk_044A3M",
    fallback_view_model_used: false,
    source_capture_binding: true,
    source_capture_slot_count: (
      boundViewModel as RuntimeInteractionViewModel & {
        source_capture_slots?: SourceCaptureSlot[];
      }
    ).source_capture_slots?.length ?? 0,
    budget_counts_as_one: true,
    state_unchanged: run.state === stateBefore,
    instances_delta: store.open_instances.size - instancesBefore,
  };
}

function bindSourceCaptureSlotsToViewModel(
  viewModel: RuntimeInteractionViewModel,
): RuntimeInteractionViewModel {
  loadSourceCaptureCrosswalk044A3M();
  const slots = getSourceCaptureSlotsForInteraction(viewModel.runtime_interaction_id);
  const relations = getSourceCaptureRelationsForInteraction(
    viewModel.runtime_interaction_id,
  );
  if (slots.length === 0) {
    throw new Error(
      `blocked_source_capture_binding_missing:no_slots:${viewModel.runtime_interaction_id}`,
    );
  }

  const relationByCode = new Map(relations.map((r) => [r.source_code, r]));
  const captureSubfields = slots
    .filter((slot) => slot.capture_slot_kind !== "control_metadata")
    .map((slot) => {
      const relation = relationByCode.get(slot.source_code);
      const required =
        slot.capture_slot_kind === "conditional_clarification"
          ? false
          : slot.capture_slot_kind === "internal"
            ? false
            : /required|obligat|sí|si\b/i.test(String(slot.required_rule ?? "")) ||
              slot.capture_slot_kind === "visible_capture" ||
              slot.capture_slot_kind === "confirmation_or_correction";
      return {
        name: slot.source_code,
        label: relation?.source_question_text ?? slot.source_code,
        type: "text",
        required,
        value: null as null,
        help_text: slot.help_text ?? undefined,
        source_node_id: slot.source_node_id,
        source_code: slot.source_code,
        capture_slot_kind: slot.capture_slot_kind,
        runtime_interaction_id: slot.runtime_interaction_id,
        source_trace: {
          source_document: viewModel.source_trace.source_document,
          source_sheet: "source_capture_crosswalk_044A3M",
          source_row_number: relation?.ordinal_in_interaction ?? 0,
        },
      };
    });

  if (captureSubfields.length === 0) {
    throw new Error(
      `blocked_source_capture_binding_missing:no_capturable_slots:${viewModel.runtime_interaction_id}`,
    );
  }

  return {
    ...viewModel,
    subfields: captureSubfields,
    source_codes: slots.map((s) => s.source_code),
    help_text: slots.find((s) => s.visible && s.help_text)?.help_text ?? viewModel.help_text,
    source_capture_slots: slots,
    source_capture_binding: true,
    ux_subfields_superseded_by_source_capture: viewModel.subfields.map((s) => s.name),
    epistemic_policy: {
      ...viewModel.epistemic_policy,
      explicit_policy_present: true,
      confirmation_policy:
        viewModel.epistemic_policy.confirmation_policy ??
        "source_capture_crosswalk_044A3M",
    },
  } as RuntimeInteractionViewModel;
}

async function ensureRendererCatalogSources(
  ctx: GovernedExecutionContext,
  store: GovernedRunStore,
): Promise<void> {
  if (store.interaction_defs.length !== 60) {
    const defs = await ctx.persistence.loadCatalogInteractionDefs?.(
      RUNTIME_40_20_FULL_ACTIVE_CATALOG_VERSION_ID,
    );
    if (!defs || defs.length !== 60) {
      throw new Error(
        `blocked_renderer_contract_incomplete:full_defs_${defs?.length ?? 0}`,
      );
    }
    store.interaction_defs = defs;
  }

  if (store.subfield_schemas.length === 0) {
    store.subfield_schemas =
      (await ctx.persistence.loadCatalogSubfieldSchemas?.(
        RUNTIME_40_20_FULL_ACTIVE_CATALOG_VERSION_ID,
      )) ?? [];
  }

  if (store.epistemic_rules.length === 0) {
    store.epistemic_rules =
      (await ctx.persistence.loadCatalogEpistemicRules?.(
        RUNTIME_40_20_FULL_ACTIVE_CATALOG_VERSION_ID,
      )) ?? [];
  }

  // 044-A.6 / A.3M: FULL UX_Subfield_Structure is incomplete for many
  // interactions. Source-capture crosswalk is the capture authority and
  // supplies renderer epistemic scaffolding without inventing slots.
  store.subfield_schemas = supplementSubfieldSchemasFromSourceCapture(
    store.subfield_schemas,
    store.interaction_defs,
  );
}

function supplementSubfieldSchemasFromSourceCapture(
  existing: CatalogSubfieldSchemaRow[],
  defs: CatalogInteractionDefRow[],
): CatalogSubfieldSchemaRow[] {
  loadSourceCaptureCrosswalk044A3M();
  const covered = new Set(existing.map((r) => r.runtime_interaction_id));
  const out = [...existing];
  let ordinal = existing.length;
  for (const def of defs) {
    if (covered.has(def.runtime_interaction_id)) continue;
    const slots = getSourceCaptureSlotsForInteraction(def.runtime_interaction_id);
    for (const slot of slots) {
      if (slot.capture_slot_kind === "control_metadata") continue;
      ordinal += 1;
      out.push({
        subfield_schema_id: `044a6-sc-${def.runtime_interaction_id}-${slot.source_code}`,
        catalog_version_id: RUNTIME_40_20_FULL_ACTIVE_CATALOG_VERSION_ID,
        runtime_interaction_id: def.runtime_interaction_id,
        subfield_name: slot.source_code,
        subfield_label: slot.source_code,
        subfield_type: "text",
        required:
          slot.capture_slot_kind !== "conditional_clarification" &&
          slot.capture_slot_kind !== "internal",
        ordinal,
        storage_rule: "requires_user_confirmation",
        ui_component: def.ui_component ?? "compound_card",
        raw_row_json: {
          type: "text",
          label: slot.source_code,
          source_reference: {
            source_sheet: "source_capture_crosswalk_044A3M",
            source_row: ordinal,
          },
          provenance: "source_capture_crosswalk_044A3M_renderer_scaffold",
        },
      } as CatalogSubfieldSchemaRow);
    }
  }
  return out;
}

function mapCatalogSubfieldsToRendererCandidates(
  rows: CatalogSubfieldSchemaRow[],
  epistemicRules: CatalogEpistemicRuleRow[],
): RuntimeSubfieldSchemaCandidate[] {
  const mustNotInferByInteraction = new Map<string, string[]>();
  for (const rule of epistemicRules) {
    if (rule.field_name !== "must_not_infer" || !rule.runtime_interaction_id) continue;
    if (!rule.raw_literal) continue;
    const list = mustNotInferByInteraction.get(rule.runtime_interaction_id) ?? [];
    list.push(rule.raw_literal);
    mustNotInferByInteraction.set(rule.runtime_interaction_id, list);
  }

  return rows.map((row, index) => {
    const sourceRef =
      row.raw_row_json &&
      typeof row.raw_row_json === "object" &&
      row.raw_row_json.source_reference &&
      typeof row.raw_row_json.source_reference === "object"
        ? (row.raw_row_json.source_reference as Record<string, unknown>)
        : {};
    const mustNotInfer =
      mustNotInferByInteraction.get(row.runtime_interaction_id) ?? [];
    return {
      runtime_interaction_id: row.runtime_interaction_id,
      subfield_name: row.subfield_name,
      required: row.required === true,
      epistemic_policy: row.storage_rule ?? undefined,
      source_document:
        "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx" as const,
      source_sheet: String(sourceRef.source_sheet ?? "UX_Subfield_Structure"),
      source_row_number:
        typeof sourceRef.source_row === "number"
          ? sourceRef.source_row
          : row.ordinal ?? index + 1,
      raw_row: {
        ...(row.raw_row_json ?? {}),
        storage_rule: row.storage_rule,
        must_not_infer: mustNotInfer,
        subfield_name: row.subfield_name,
        ui_component: row.ui_component,
      },
      canonicalization_status: "normalized" as const,
      warnings: [],
      blockers: [],
    };
  });
}

async function ingestResponse(
  ctx: GovernedExecutionContext,
  store: GovernedRunStore,
  body: GovernedExecutionAdvanceRequest,
): Promise<Record<string, unknown>> {
  const run = requireRun(store, body.run_id);
  const stateBefore = run.state;
  const responsesBefore = 0;
  void responsesBefore;
  const interactionId = body.interaction_id;
  if (!interactionId) throw new Error("interaction_id_required");
  assertInteractionInFullCatalog(store, interactionId);

  if (run.answered.includes(interactionId)) {
    throw new Error("blocked_real_ingest_path_failed:double_ingest_not_authorized");
  }

  const viewModel = store.view_models.get(interactionId);
  if (!viewModel) throw new Error("render_next_required_before_ingest");

  const instanceId = store.open_instances.get(interactionId);
  if (!instanceId) {
    throw new Error("blocked_real_ingest_path_failed:interaction_instance_missing");
  }
  if (
    body.runtime_interaction_instance_id &&
    body.runtime_interaction_instance_id !== instanceId
  ) {
    throw new Error(
      "blocked_real_ingest_path_failed:interaction_instance_run_mismatch",
    );
  }

  const answersInput = body.answers ?? {};
  const activeConditional = new Set(body.active_conditional_source_codes ?? []);
  const schemaAnswers = buildSourceCaptureBoundAnswers(
    viewModel,
    answersInput,
    activeConditional,
  );
  const payload: RuntimeResponsePayload = {
    runtime_interaction_id: interactionId,
    interaction_instance_id_preview: viewModel.interaction_instance_id_preview,
    case_id: ctx.case_id,
    run_id: run.activity_runtime_run_id,
    idempotency_key: `044:${run.activity_runtime_run_id}:${interactionId}`,
    response_revision_number: 1,
    answers: schemaAnswers,
    subfield_answers: schemaAnswers,
    confirmation_status: "confirmed",
    correction_status: "no_correction",
    source_trace: {
      source_document: viewModel.source_trace.source_document,
      source_sheet: viewModel.source_trace.source_sheet,
      source_row_number: viewModel.source_trace.source_row_number,
      ...(viewModel.source_trace.raw_row
        ? { raw_row: viewModel.source_trace.raw_row }
        : {}),
    },
  };

  let ingest: {
    ok: boolean;
    ingest_status?: string;
    blocked_reason?: string;
    subfield_response_candidates?: Array<{
      subfield_name: string;
      value?: unknown;
      subfield_value?: unknown;
      epistemic_status?: string;
      provenance_type?: string;
    }>;
    evidence_item_candidates?: Array<{
      subfield_name: string;
      literal_value?: unknown;
      literal_answer?: unknown;
      normalized_value?: unknown;
      epistemic_status?: string;
      provenance_type?: string;
      confidence?: number | string | null;
    }>;
  };
  try {
    ingest = ingestRuntime4020ResponseLocal({
      case_id: ctx.case_id,
      interaction_view_model: viewModel,
      response_payload: payload,
    }) as typeof ingest;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`blocked_real_ingest_path_failed:${message}`);
  }

  if (!ingest.ok) {
    throw new Error(
      `blocked_real_ingest_path_failed:${
        ingest.blocked_reason ?? ingest.ingest_status ?? "ingest_not_ok"
      }`,
    );
  }

  const ingestSubfields = ingest.subfield_response_candidates ?? [];
  const ingestEvidence = ingest.evidence_item_candidates ?? [];
  const nonEmptyAnswerCount = schemaAnswers.filter((a) =>
    a.value !== null && a.value !== undefined && String(a.value).length > 0,
  ).length;
  if (nonEmptyAnswerCount > 0 && ingestEvidence.length === 0) {
    throw new Error("blocked_real_ingest_evidence_path_incomplete");
  }

  // Canonical: crosswalk-authorized mappings only (044-A.3M).
  // Never invent from answers / var_${n} / prose EAV / fuzzy / NLP.
  let canonical: {
    ok?: boolean;
    status?: string;
    blocked_reason?: string;
    canonical_variable_record_candidates?: Array<{
      variable_name: string;
      variable_value?: unknown;
      route_id?: string;
    }>;
  } = { ok: true, canonical_variable_record_candidates: [] };
  const variableMaps = getAuthorizedCanonicalMappingsForInteraction(interactionId);
  if (variableMaps.length === 0 && ingestSubfields.length > 0) {
    // Restricted interactions (e.g. algorithm-not-closed only) may have no
    // authorized mappings; capture remains, canonical stays empty without inventing.
    canonical = {
      ok: true,
      status: "canonical_unresolved_no_authorized_mapping",
      canonical_variable_record_candidates: [],
    };
  } else if (variableMaps.length > 0) {
    try {
      const canonicalResult = createRuntime4020CanonicalVariableCandidatesLocal({
        case_id: ctx.case_id,
        ingest_result: ingest,
        canonical_variable_mappings: variableMaps,
      } as never) as typeof canonical;
      if (!canonicalResult?.ok) {
        throw new Error(
          `blocked_real_canonical_variable_path_failed:${
            canonicalResult?.blocked_reason ??
            canonicalResult?.status ??
            "canonical_not_ok"
          }`,
        );
      }
      canonical = canonicalResult;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.startsWith("blocked_real_canonical_variable_path_failed")) {
        throw error;
      }
      throw new Error(`blocked_real_canonical_variable_path_failed:${message}`);
    }
  }

  // 044-A.5B-R / A.6 — materialize epistemic confidence before branching on B7-Q39
  // so C20 consumes a real governed signal (score remains null / non-authoritative).
  let b7ConfidenceEcho: Record<string, unknown> | null = null;
  if (interactionId === "B7-Q39" || body.b7_confidence_input) {
    const override = (body.b7_confidence_input ?? {}) as Partial<B7ConfidenceInput>;
    const b7Input = buildB7ConfidenceInputFromEvidence({
      evidence_completeness_status:
        override.evidence_completeness_status ??
        (run.answered.length + 1 > 0 ? "complete" : "missing"),
      provenance_status: override.provenance_status ?? "closed",
      canonical_route_status: override.canonical_route_status ?? "closed",
      epistemic_ambiguity_status: override.epistemic_ambiguity_status ?? "none",
      epistemic_contradiction_status:
        override.epistemic_contradiction_status ?? "none",
      microconfirmation_state: override.microconfirmation_state ?? "not_required",
      required_signal_status: override.required_signal_status ?? "present",
      capture_gap_refs: override.capture_gap_refs,
      business_structural_inconsistency_observed:
        override.business_structural_inconsistency_observed === true,
      business_structural_inconsistency_refs:
        override.business_structural_inconsistency_refs,
      diagnostic_candidate_refs: override.diagnostic_candidate_refs,
      injected_pathology_names: override.injected_pathology_names,
      forbidden_feature_bag: override.forbidden_feature_bag,
    });
    const b7 = evaluateB7Confidence(b7Input);
    b7ConfidenceEcho = b7 as unknown as Record<string, unknown>;
    const confidenceRows = [
      {
        canonical_variable_id: "confidence_level",
        canonical_variable_name: "confidence_level",
        variable_name: "confidence_level",
        value: b7.confidence_level,
        variable_value: b7.confidence_level,
        route_id: "B7",
      },
      {
        canonical_variable_id: "confidence_score",
        canonical_variable_name: "confidence_score",
        variable_name: "confidence_score",
        value: b7.confidence_score,
        variable_value: b7.confidence_score,
        route_id: "B7",
      },
      {
        canonical_variable_id: "confidence_reasoning",
        canonical_variable_name: "confidence_reasoning",
        variable_name: "confidence_reasoning",
        value: b7.confidence_reasoning,
        variable_value: b7.confidence_reasoning,
        route_id: "B7",
      },
    ];
    canonical.canonical_variable_record_candidates = [
      ...(canonical.canonical_variable_record_candidates ?? []),
      ...confidenceRows,
    ];
    for (const row of confidenceRows) {
      store.canonical_variable_bag[row.variable_name] = row.value;
    }
  }

  // 044-A.4R — typed branching crosswalk only. No prose EAV / answerBlob / regex / truthiness.
  loadBranchingAuthorityCrosswalk044A4R();
  const branchingRules = getExactBranchingRulesForSourceInteraction(interactionId);
  const interactionDefs = (store.interaction_defs ?? []).map(defToInteractionCandidate);
  type BranchingLocalResult = {
    ok?: boolean;
    decision_candidates?: Array<Record<string, unknown>>;
    rule_evaluations?: Array<Record<string, unknown>>;
    branching_decision_candidates?: Array<Record<string, unknown>>;
  };
  let branching: BranchingLocalResult | null = null;
  const branchingOutcomes: Array<{
    target_causal_interaction_id: string;
    result:
      | "opened"
      | "not_opened"
      | "unresolved_missing_governed_signal"
      | "pending_governed_signal"
      | "unresolved_authority"
      | "blocked_authority_missing"
      | "blocked_double_open";
    trigger_canonical_variable?: string;
    reason?: string;
    eligibility?: string;
    critical_route_ref?: string | null;
  }> = [];

  if (branchingRules.length > 0) {
    try {
      branching = createRuntime4020BranchingCandidatesLocal({
        case_id: ctx.case_id,
        canonical_variable_result: canonical,
        branching_rules: branchingRules,
        interaction_definitions: interactionDefs,
      } as never) as unknown as BranchingLocalResult;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`blocked_real_branching_path_failed:${message}`);
    }
  }

  const matchedBranching = (
    branching?.branching_decision_candidates ??
    branching?.decision_candidates ??
    []
  ).filter(
    (d: Record<string, unknown>) =>
      d.decision_status === "causal_activation_candidate_ready",
  );

  for (const decision of matchedBranching) {
    const target = String(decision.target_causal_interaction_id ?? "");
    if (!target) continue;
    if (store.opened_causal_ids.has(target)) {
      branchingOutcomes.push({
        target_causal_interaction_id: target,
        result: "blocked_double_open",
        reason: "same_causal_already_opened_for_run",
      });
      continue;
    }
    const unresolved = getUnresolvedCausalRecord(target);
    if (unresolved) {
      branchingOutcomes.push({
        target_causal_interaction_id: target,
        result: "blocked_authority_missing",
        reason: unresolved.reason,
      });
      continue;
    }
    store.opened_causal_ids.add(target);
    branchingOutcomes.push({
      target_causal_interaction_id: target,
      result: "opened",
      trigger_canonical_variable: String(
        decision.trigger_canonical_variable_id ?? "",
      ),
      eligibility: classifyCausalEligibility044A4(target, true),
    });
    await ctx.persistence.createBranchingDecision({
      branching_decision_id: randomUUID(),
      activity_runtime_run_id: run.activity_runtime_run_id,
      role_runtime_session_id: run.role_runtime_session_id,
      sesion_id: run.sesion_id,
      source_interaction_instance_id: instanceId,
      target_runtime_interaction_id: target,
      opened_interaction_instance_id: null,
      closed_interaction_instance_id: null,
      decision_type: "open_causal",
      trigger_signal: String(
        decision.trigger_canonical_variable_id ?? interactionId,
      ),
      causal_score: null,
      reason: "exact_authorized_branching_rule",
      budget_effect: {
        bucket: "causal_20",
        source: "branching_authority_crosswalk_044A4",
      },
      route_id: null,
    });
  }

  // Exact rules that did not match → not_opened / pending (never silent false for pending A5).
  for (const rule of branchingRules) {
    const target = rule.target_causal_interaction_id;
    const already = branchingOutcomes.some(
      (o) => o.target_causal_interaction_id === target,
    );
    if (already) continue;
    const evals = (branching?.rule_evaluations ?? []) as Array<{
      branching_rule_id?: string;
      evaluation_status?: string;
      matched?: boolean;
    }>;
    const ev = evals.find((e) => e.branching_rule_id === rule.branching_rule_id);
    if (ev?.evaluation_status === "pending_governed_signal") {
      branchingOutcomes.push({
        target_causal_interaction_id: target,
        result: "pending_governed_signal",
        trigger_canonical_variable: rule.trigger_canonical_variable_id,
        reason: "exact_predicate_signal_pending_A5",
        eligibility: classifyCausalEligibility044A4(target, false),
      });
    } else if (ev?.evaluation_status === "blocked_missing_variable_candidate") {
      branchingOutcomes.push({
        target_causal_interaction_id: target,
        result: "unresolved_missing_governed_signal",
        trigger_canonical_variable: rule.trigger_canonical_variable_id,
        reason: "missing_canonical_variable_for_exact_predicate",
        eligibility: classifyCausalEligibility044A4(target, false),
      });
    } else {
      branchingOutcomes.push({
        target_causal_interaction_id: target,
        result: "not_opened",
        trigger_canonical_variable: rule.trigger_canonical_variable_id,
        reason: "exact_typed_predicate_not_matched",
        eligibility: classifyCausalEligibility044A4(target, false),
      });
    }
  }

  // Pending A5 signal causals linked to this source — not false.
  for (const pending of getPendingCausalsForSourceInteraction(interactionId)) {
    const already = branchingOutcomes.some(
      (o) => o.target_causal_interaction_id === pending.causal_interaction_id,
    );
    if (already) continue;
    branchingOutcomes.push({
      target_causal_interaction_id: pending.causal_interaction_id,
      result: "pending_governed_signal",
      reason: pending.reason,
      eligibility: pending.eligibility,
      critical_route_ref: pending.critical_route,
    });
  }

  // Truly unresolved authority — fail closed.
  for (const unresolved of getUnresolvedCausalsForSourceInteraction(interactionId)) {
    const already = branchingOutcomes.some(
      (o) => o.target_causal_interaction_id === unresolved.causal_interaction_id,
    );
    if (already) continue;
    branchingOutcomes.push({
      target_causal_interaction_id: unresolved.causal_interaction_id,
      result: "unresolved_authority",
      reason: unresolved.reason,
      eligibility: unresolved.eligibility,
      critical_route_ref: unresolved.critical_route,
    });
  }

  for (const outcome of branchingOutcomes) {
    if (outcome.result === "opened" && !outcome.eligibility) {
      outcome.eligibility = classifyCausalEligibility044A4(
        outcome.target_causal_interaction_id,
        true,
      );
    }
  }

  const def = store.interaction_defs.find(
    (d) => d.runtime_interaction_id === interactionId,
  )!;
  const countsAsBase = !String(def.interaction_group_normalized ?? "").includes(
    "causal",
  );
  const countsAsCausal = !countsAsBase;

  if (countsAsBase) store.base_visible_count += 1;
  if (countsAsCausal) store.causal_visible_count += 1;

  if (store.base_visible_count > 40 || store.causal_visible_count > 20) {
    throw new Error(
      `budget_exceeded:base=${store.base_visible_count},causal=${store.causal_visible_count}`,
    );
  }

  const responseId = randomUUID();
  const subfields = ingestSubfields.map((sf) => {
    const value = sf.value ?? sf.subfield_value ?? null;
    return {
      subfield_response_id: randomUUID(),
      response_id: responseId,
      runtime_interaction_instance_id: instanceId,
      activity_runtime_run_id: run.activity_runtime_run_id,
      role_runtime_session_id: run.role_runtime_session_id,
      sesion_id: run.sesion_id,
      scene_id: null as null,
      subfield_name: sf.subfield_name,
      subfield_value: typeof value === "string" ? value : null,
      subfield_value_json: { value },
      canonical_variable_name: null,
      epistemic_status: sf.epistemic_status ?? "captured_user_evidence",
      provenance_type: sf.provenance_type ?? "user_answer",
      confidence: null,
    };
  });

  const evidence = ingestEvidence.map((item) => {
    const matchingSubfield = subfields.find(
      (sf) => sf.subfield_name === item.subfield_name,
    );
    const literal =
      item.literal_value ?? item.literal_answer ?? matchingSubfield?.subfield_value ?? null;
    return {
      evidence_item_id: randomUUID(),
      activity_runtime_run_id: run.activity_runtime_run_id,
      role_runtime_session_id: run.role_runtime_session_id,
      runtime_interaction_instance_id: instanceId,
      response_id: responseId,
      subfield_response_id: matchingSubfield?.subfield_response_id ?? null,
      sesion_id: run.sesion_id,
      scene_id: null as null,
      literal_value: typeof literal === "string" ? literal : null,
      normalized_value:
        typeof item.normalized_value === "string"
          ? item.normalized_value
          : typeof literal === "string"
            ? literal
            : null,
      evidence_kind: "participant_statement",
      epistemic_status: item.epistemic_status ?? "captured_user_evidence",
      provenance_type: item.provenance_type ?? "user_answer",
      source_node_ref_id: null,
      source_question_code: interactionId,
      response_revision_number: 1,
      supersedes_evidence_item_id: null,
      confidence:
        typeof item.confidence === "number" ? item.confidence : null,
      flags_json: {
        ...INSTRUCTION_044_METADATA,
        evidence_source: "response_ingest_evidence_item_candidates",
      },
    };
  });

  const canonicalRows = (
    canonical.canonical_variable_record_candidates ?? []
  ).map(
    (cv: {
      variable_name?: string;
      canonical_variable_name?: string;
      variable_value?: unknown;
      value?: unknown;
      route_id?: string;
    }) => ({
      canonical_variable_id: randomUUID(),
      activity_runtime_run_id: run.activity_runtime_run_id,
      role_runtime_session_id: run.role_runtime_session_id,
      sesion_id: run.sesion_id,
      scene_id: null as null,
      variable_name: String(cv.variable_name ?? cv.canonical_variable_name ?? ""),
      variable_value: cv.variable_value ?? cv.value ?? null,
      variable_type: "runtime_40_20",
      route_id: cv.route_id ?? null,
      route_status: "open",
      source_evidence_item_ids: evidence.map((e) => e.evidence_item_id),
      derived_from_response_ids: [responseId],
      gap_flag: false,
      gap_type: "none",
      required_if_condition: null,
      confidence: null,
      object_binding_status: "pending_object_inventory_phase",
      diagnostic_status: "non_diagnostic",
      invalidated_at: null,
      invalidation_reason: null,
    }),
  );

  // 044-A.5 — stash canonical bag for regulatory evaluation.
  for (const row of canonicalRows) {
    if (row.variable_name) {
      store.canonical_variable_bag[row.variable_name] = row.variable_value;
    }
  }
  if (store.opened_causal_ids.size > 0) {
    store.runtime_phase = "active_causal_capture";
  } else {
    store.runtime_phase = "questionnaire_main";
  }

  if (ctx.persistence.markInteractionInstanceAnswered) {
    await ctx.persistence.markInteractionInstanceAnswered(instanceId);
  }

  await ctx.persistence.createResponseBundle({
    response: {
      response_id: responseId,
      runtime_interaction_instance_id: instanceId,
      activity_runtime_run_id: run.activity_runtime_run_id,
      role_runtime_session_id: run.role_runtime_session_id,
      sesion_id: run.sesion_id,
      scene_id: null,
      selected_value: null,
      selected_values: null,
      free_text:
        typeof answersInput.free_text === "string" ? answersInput.free_text : null,
      raw_answer_json: answersInput as JsonObject,
      epistemic_status: "captured_user_evidence",
      provenance_type: "user_answer",
      confidence: null,
      idempotency_key: `044:${run.activity_runtime_run_id}:${interactionId}`,
      response_revision_number: 1,
      supersedes_response_id: null,
      invalidated_at: null,
      invalidation_reason: null,
      created_by_auth_user_id: ctx.owner_auth_user_id ?? null,
    },
    subfields,
    evidence,
    canonical_variables: canonicalRows,
  });

  await ctx.persistence.createBudgetLedgerEntry({
    budget_ledger_id: randomUUID(),
    role_runtime_session_id: run.role_runtime_session_id,
    activity_runtime_run_id: run.activity_runtime_run_id,
    runtime_interaction_instance_id: instanceId,
    sesion_id: run.sesion_id,
    event_type: "interaction_answered",
    bucket: countsAsBase ? "base_40" : "causal_20",
    base_count_delta: countsAsBase ? 1 : 0,
    causal_count_delta: countsAsCausal ? 1 : 0,
    microconfirmation_count_delta: 0,
    internal_count_delta: 0,
    base_visible_count: store.base_visible_count,
    causal_visible_count: store.causal_visible_count,
    estimated_seconds_added: 0,
    event_ref: interactionId,
    metadata_json: {
      ...INSTRUCTION_044_METADATA,
      instruction: "044-A.5",
      interaction_id: interactionId,
      instance_id: instanceId,
      reason: countsAsBase ? "base_visible_answered" : "causal_visible_answered",
      compound_cost: 1,
      subfield_additional_cost: 0,
      internal_inference_cost: 0,
      base_used: store.base_visible_count,
      base_remaining: Math.max(0, 40 - store.base_visible_count),
      causal_used: store.causal_visible_count,
      causal_remaining: Math.max(0, 20 - store.causal_visible_count),
      timestamp: new Date().toISOString(),
    },
  });

  await ctx.persistence.createAuditTrail({
    runtime_audit_id: randomUUID(),
    role_runtime_session_id: run.role_runtime_session_id,
    activity_runtime_run_id: run.activity_runtime_run_id,
    runtime_interaction_instance_id: instanceId,
    sesion_id: run.sesion_id,
    scene_id: null,
    actor_type: "system",
    actor_auth_user_id: null,
    event_type: "budget_consumed",
    entity_table: "budget_ledger",
    entity_id: instanceId,
    event_summary: countsAsBase
      ? `base+1 remaining=${40 - store.base_visible_count}`
      : `causal+1 remaining=${20 - store.causal_visible_count}`,
    before_json: null,
    after_json: {
      base_used: store.base_visible_count,
      causal_used: store.causal_visible_count,
      interaction_id: interactionId,
    },
    metadata_json: { ...INSTRUCTION_044_METADATA },
  });

  await ctx.persistence.transitionRunState({
    activity_runtime_run_id: run.activity_runtime_run_id,
    from_state: run.state,
    to_state: run.state,
    cause: "budget_counter_sync",
    base_visible_count: store.base_visible_count,
    causal_visible_count: store.causal_visible_count,
  });

  run.answered.push(interactionId);
  store.runs.set(run.activity_runtime_run_id, run);

  const openedCount = branchingOutcomes.filter((o) => o.result === "opened").length;

  return {
    ok: true,
    action: "ingest_response",
    ingest_ok: true,
    ingest_status: ingest.ingest_status,
    ingest_path: "ingestRuntime4020ResponseLocal",
    fallback_ingest_used: false,
    subfield_source: "runtime_subfield_schema+ingest_candidates",
    evidence_source: "ingest_evidence_item_candidates",
    canonical_ok: canonical.ok === true,
    branching_matched: openedCount,
    branching_outcomes: branchingOutcomes,
    branching_path: "typed_authority_crosswalk_044A4R",
    b7_confidence: b7ConfidenceEcho,
    base_visible_count: store.base_visible_count,
    causal_visible_count: store.causal_visible_count,
    response_id: responseId,
    subfield_count: subfields.length,
    evidence_count: evidence.length,
    state_unchanged: run.state === stateBefore,
  };
}

function buildSourceCaptureBoundAnswers(
  viewModel: RuntimeInteractionViewModel,
  answers: Record<string, unknown>,
  activeConditionalSourceCodes: Set<string>,
): Array<{
  subfield_name: string;
  value: unknown;
  epistemic_status: "captured_user_evidence";
  provenance_type: "user_answer";
  confirmation_reference: string;
  source_trace: Record<string, unknown>;
  expected_type?: string;
  required?: boolean;
  source_node_id?: string;
  source_code?: string;
  runtime_interaction_id?: string;
}> {
  const slots =
    (
      viewModel as RuntimeInteractionViewModel & {
        source_capture_slots?: SourceCaptureSlot[];
      }
    ).source_capture_slots ??
    getSourceCaptureSlotsForInteraction(viewModel.runtime_interaction_id);

  if (!slots.length) {
    throw new Error("blocked_source_capture_binding_missing:no_slots");
  }

  const slotByCode = new Map(slots.map((s) => [s.source_code, s]));
  const schemaNames = new Set(viewModel.subfields.map((sf) => sf.name));

  for (const key of Object.keys(answers)) {
    if (key === "free_text") {
      throw new Error("blocked_real_ingest_path_failed:arbitrary_answer_key_rejected");
    }
    const slot = slotByCode.get(key);
    if (!slot) {
      throw new Error(
        `blocked_source_capture_binding_missing:foreign_or_unknown_source_code:${key}`,
      );
    }
    if (slot.capture_slot_kind === "control_metadata") {
      throw new Error(
        `blocked_source_capture_binding_missing:control_metadata_not_capturable:${key}`,
      );
    }
    if (
      slot.capture_slot_kind === "conditional_clarification" &&
      !activeConditionalSourceCodes.has(key)
    ) {
      throw new Error(
        `blocked_real_ingest_path_failed:inactive_conditional_slot:${key}`,
      );
    }
    if (!schemaNames.has(key)) {
      throw new Error(
        `blocked_source_capture_binding_missing:slot_not_in_view_model:${key}`,
      );
    }
  }

  const built = [];
  for (const sf of viewModel.subfields) {
    if (!(sf.name in answers)) continue;
    const slot = slotByCode.get(sf.name);
    if (!slot) {
      throw new Error(
        `blocked_source_capture_binding_missing:view_model_slot_unbound:${sf.name}`,
      );
    }
    built.push({
      subfield_name: sf.name,
      value: answers[sf.name],
      epistemic_status: "captured_user_evidence" as const,
      provenance_type: "user_answer" as const,
      confirmation_reference: "044-user-confirm",
      source_trace: (sf.source_trace ?? {
        source_document: viewModel.source_trace.source_document,
        source_sheet: viewModel.source_trace.source_sheet,
        source_row_number: viewModel.source_trace.source_row_number,
      }) as Record<string, unknown>,
      expected_type: sf.type,
      required: sf.required,
      source_node_id: slot.source_node_id,
      source_code: slot.source_code,
      runtime_interaction_id: viewModel.runtime_interaction_id,
    });
  }

  // Redistribution of one aggregate answer into multiple slots is forbidden.
  // Each present key must already be an exact source_code identity.
  return built;
}


async function evaluateGates(
  ctx: GovernedExecutionContext,
  store: GovernedRunStore,
  body: GovernedExecutionAdvanceRequest,
): Promise<Record<string, unknown>> {
  const run = requireRun(store, body.run_id);
  const scope = {
    tenant_id: ctx.tenant_id ?? "synthetic-tenant",
    case_id: ctx.case_id,
    role_id: ctx.role_id,
    activity_id: ctx.activity_id,
    run_id: run.activity_runtime_run_id,
    correlation_id: body.synthetic_case_token,
    idempotency_key: `044-gates:${run.activity_runtime_run_id}`,
  };

  // Merge optional test/structured signals into canonical bag without inventing values.
  if (body.answers && typeof body.answers === "object") {
    for (const [k, v] of Object.entries(body.answers)) {
      if (k.startsWith("canonical:")) {
        store.canonical_variable_bag[k.slice("canonical:".length)] = v;
      }
    }
  }

  const answeredDefs = store.interaction_defs.filter((d) =>
    run.answered.includes(d.runtime_interaction_id),
  );

  const evidenceBag: RegulatoryEvidenceBag = {
    case_id: ctx.case_id,
    canonical_variables: { ...store.canonical_variable_bag },
    answered_interaction_ids: [...run.answered],
    opened_causal_ids: [...store.opened_causal_ids],
    answered_interaction_defs: answeredDefs.map((d) => ({
      runtime_interaction_id: d.runtime_interaction_id,
      raw_row_json: d.raw_row_json,
      pm_output: d.pm_output,
      moc_output: d.moc_output,
      pf_output: d.pf_output,
      olc_output: d.olc_output,
      mmabp_ir_target: d.mmabp_ir_target,
      readiness_effect: d.readiness_effect,
      registry_target: d.registry_target,
    })),
    sem_signals: {
      ...(body.sem_signals as RegulatoryEvidenceBag["sem_signals"]),
      ...(typeof body.state_as_class_detected === "boolean"
        ? { state_as_class_detected: body.state_as_class_detected }
        : {}),
      ...(body.observed_term ? { observed_term: body.observed_term } : {}),
    },
    process_state_wait: body.process_state_wait as RegulatoryEvidenceBag["process_state_wait"],
    b7_contamination: body.b7_contamination as RegulatoryEvidenceBag["b7_contamination"],
    b7_confidence_input:
      body.b7_confidence_input as RegulatoryEvidenceBag["b7_confidence_input"],
    caller_forced_ready: body.force_ready === true,
  };

  const layer = evaluateRegulatoryLayer044A5(evidenceBag);
  store.last_regulatory_evaluation = layer as unknown as Record<string, unknown>;
  store.runtime_phase =
    store.opened_causal_ids.size > 0 &&
    [...store.opened_causal_ids].some((id) => !run.answered.includes(id))
      ? "causal_evaluation_pending"
      : "readiness_evaluation";

  // Persist SEM events for every SEM with structured outcome (not pending).
  const semEventIds: string[] = [];
  for (const sem of layer.sem) {
    if (sem.outcome === "pending_resolution" || sem.outcome === "not_applicable") {
      continue;
    }
    const semInsert = buildSemanticResolutionEventInsert({
      scope,
      gate_code: String(sem.gate) as "SEM-001",
      resolution_status: sem.outcome === "blocked" ? "not_safe" : "resolved",
      resolution_summary_internal: sem.reason ?? sem.outcome,
      client_safe_summary: "Evaluacion semantica interna",
      source_trace: { instruction: "044-A.5", gate: sem.gate },
    });
    const semEvent = await ctx.persistence.createSemanticResolutionEvent({
      semantic_resolution_event_id: randomUUID(),
      activity_runtime_run_id: run.activity_runtime_run_id,
      role_runtime_session_id: run.role_runtime_session_id,
      runtime_interaction_instance_id: null,
      response_id: null,
      sesion_id: run.sesion_id,
      scene_id: null,
      gate_code: sem.gate,
      observed_term: body.observed_term ?? String(sem.gate),
      proposed_resolution: String(semInsert.resolution_state),
      resolution_status: String(semInsert.resolution_state),
      blocks_projection: sem.outcome === "blocked",
      reason: sem.reason ?? sem.outcome,
      event_json: { ...INSTRUCTION_044_METADATA, local_insert: semInsert, sem },
    });
    semEventIds.push(semEvent.semantic_resolution_event_id);
  }

  // PST: create timer event only when strong wait applies and fields are present;
  // never hardcode PST-001 as pass.
  let timerId: string | null = null;
  const pstFailed = layer.pst.some((p) => p.outcome === "failed");
  const strongWait = body.process_state_wait?.strong_wait === true;
  if (strongWait && !pstFailed) {
    timerId = randomUUID();
    const wait = body.process_state_wait as Record<string, unknown>;
    await ctx.persistence.createProcessStateTimerEvent({
      process_state_timer_event_id: timerId,
      activity_runtime_run_id: run.activity_runtime_run_id,
      role_runtime_session_id: run.role_runtime_session_id,
      runtime_interaction_instance_id: null,
      response_id: null,
      sesion_id: run.sesion_id,
      scene_id: null,
      gate_code: "PST-001",
      awaited_event: String(wait.awaited_event ?? ""),
      release_condition: String(wait.release_condition ?? ""),
      timer_or_timeout_rule: String(wait.timer_or_timeout_rule ?? ""),
      timeout_state: String(wait.timeout_state ?? "waiting"),
      resolver_owner: String(wait.resolver_owner ?? ""),
      exit_path: String(wait.exit_path ?? ""),
      deadlock_risk: false,
      event_status: "awaiting_release",
      event_json: { ...INSTRUCTION_044_METADATA, pst: layer.pst },
    });
    store.timers.set(timerId, {
      event_id: timerId,
      status: "awaiting_release",
      release_condition: String(wait.release_condition ?? ""),
    });
  }

  await ctx.persistence.createAuditTrail({
    runtime_audit_id: randomUUID(),
    role_runtime_session_id: run.role_runtime_session_id,
    activity_runtime_run_id: run.activity_runtime_run_id,
    runtime_interaction_instance_id: null,
    sesion_id: run.sesion_id,
    scene_id: null,
    actor_type: "system",
    actor_auth_user_id: null,
    event_type: "regulatory_layer_evaluated",
    entity_table: "activity_runtime_run",
    entity_id: run.activity_runtime_run_id,
    event_summary: "critical_gate_sem_pst_budget_readiness_inputs_evaluated",
    before_json: null,
    after_json: {
      instruction: "044-A.5",
      classification_hint: layer.classification_hint,
      blocking_reasons: layer.blocking_reasons,
      runtime_phase: store.runtime_phase,
    },
    metadata_json: { ...INSTRUCTION_044_METADATA },
  });

  const thinCritical = {
    B0: evaluateCriticalRouteGateLocally({
      scope,
      gate_code: "B0",
      local_block_signals: {
        missing_semantic_entry: layer.critical_routes.find((c) => c.gate === "CR-B0")
          ?.outcome === "failed",
      },
    }),
    B2: evaluateCriticalRouteGateLocally({
      scope,
      gate_code: "B2",
      local_block_signals: {
        missing_transformation_exception_route:
          layer.critical_routes.find((c) => c.gate === "CR-B2")?.outcome === "failed",
      },
    }),
    B3_C09: evaluateCriticalRouteGateLocally({
      scope,
      gate_code: "B3_C09",
      route_ref:
        layer.critical_routes.find((c) => c.gate === "CR-B3")?.outcome === "failed"
          ? ""
          : "C09",
    }),
    B7_C20: evaluateCriticalRouteGateLocally({
      scope,
      gate_code: "B7_C20",
      local_block_signals: {
        b7_boundary_violation_attempted:
          layer.critical_routes.find((c) => c.gate === "CR-B7")?.outcome === "blocked",
      },
    }),
  };

  return {
    ok: true,
    action: "evaluate_gates",
    instruction: "044-A.5",
    critical_routes: thinCritical,
    regulatory_layer: layer,
    semantic_resolution_event_ids: semEventIds,
    process_state_timer_event_id: timerId,
    timer_requires_explicit_release: timerId != null,
    runtime_phase: store.runtime_phase,
    writes_scene: false,
    writes_mba: false,
    parallel_production: false,
  };
}

async function releaseTimer(
  ctx: GovernedExecutionContext,
  store: GovernedRunStore,
  body: GovernedExecutionAdvanceRequest,
): Promise<Record<string, unknown>> {
  const eventId = body.timer_event_id;
  if (!eventId) throw new Error("timer_event_id_required");
  if (!body.test_clock) throw new Error("test_clock_required_for_timer_release");

  const existing = store.timers.get(eventId);
  if (!existing) throw new Error("timer_event_not_found");

  const updated = ctx.persistence.updateProcessStateTimerEvent
    ? await ctx.persistence.updateProcessStateTimerEvent(eventId, {
        event_status: "released",
        release_condition: `released_at_test_clock:${body.test_clock}`,
        timeout_state: "released",
        event_json: {
          ...INSTRUCTION_044_METADATA,
          released_by: "releaseTimer",
          test_clock: body.test_clock,
        },
      })
    : {
        process_state_timer_event_id: eventId,
        event_status: "released",
        release_condition: `released_at_test_clock:${body.test_clock}`,
      };

  store.timers.set(eventId, {
    event_id: eventId,
    status: "released",
    release_condition: String(updated.release_condition),
  });

  return {
    ok: true,
    action: "release_timer",
    process_state_timer_event_id: eventId,
    event_status: "released",
    test_clock: body.test_clock,
  };
}

async function completeReadiness(
  ctx: GovernedExecutionContext,
  store: GovernedRunStore,
  body: GovernedExecutionAdvanceRequest,
): Promise<Record<string, unknown>> {
  const run = requireRun(store, body.run_id);

  if (body.force_ready === true) {
    throw new Error("caller_forced_ready_rejected");
  }

  const openUnanswered = [...store.opened_causal_ids].filter(
    (id) => !run.answered.includes(id),
  );
  if (openUnanswered.length > 0) {
    store.runtime_phase = "causal_evaluation_pending";
    throw new Error(
      `blocked_runtime_state_machine:causal_evaluation_pending:${openUnanswered.join(",")}`,
    );
  }

  let layer = store.last_regulatory_evaluation as ReturnType<
    typeof evaluateRegulatoryLayer044A5
  > | undefined;
  if (!layer) {
    const answeredDefs = store.interaction_defs.filter((d) =>
      run.answered.includes(d.runtime_interaction_id),
    );
    layer = evaluateRegulatoryLayer044A5({
      case_id: ctx.case_id,
      canonical_variables: { ...store.canonical_variable_bag },
      answered_interaction_ids: [...run.answered],
      opened_causal_ids: [...store.opened_causal_ids],
      answered_interaction_defs: answeredDefs.map((d) => ({
        runtime_interaction_id: d.runtime_interaction_id,
        raw_row_json: d.raw_row_json,
        pm_output: d.pm_output,
        moc_output: d.moc_output,
        pf_output: d.pf_output,
        olc_output: d.olc_output,
        mmabp_ir_target: d.mmabp_ir_target,
        readiness_effect: d.readiness_effect,
        registry_target: d.registry_target,
      })),
      sem_signals: body.sem_signals as RegulatoryEvidenceBag["sem_signals"],
      process_state_wait:
        body.process_state_wait as RegulatoryEvidenceBag["process_state_wait"],
      b7_contamination:
        body.b7_contamination as RegulatoryEvidenceBag["b7_contamination"],
      caller_forced_ready: false,
    });
    store.last_regulatory_evaluation = layer as unknown as Record<string, unknown>;
  }

  store.runtime_phase = "readiness_evaluation";
  const resolved = resolveRegulatoryReadinessState(layer);
  const scope = {
    tenant_id: ctx.tenant_id ?? "synthetic-tenant",
    case_id: ctx.case_id,
    role_id: ctx.role_id,
    activity_id: ctx.activity_id,
    run_id: run.activity_runtime_run_id,
    correlation_id: body.synthetic_case_token,
    idempotency_key: `044-readiness:${run.activity_runtime_run_id}`,
  };

  const readiness = resolveReadinessEvaluation({
    scope,
    dominant_gate_code: "B7_C20" as EVEProductionCriticalRouteGateCode,
    critical_route_results: [
      {
        gate_code: "B0" as EVEProductionCriticalRouteGateCode,
        passed:
          layer.critical_routes.find((c) => c.gate === "CR-B0")?.outcome === "passed" ||
          layer.critical_routes.find((c) => c.gate === "CR-B0")?.outcome ===
            "not_applicable",
      },
      {
        gate_code: "B2" as EVEProductionCriticalRouteGateCode,
        passed:
          layer.critical_routes.find((c) => c.gate === "CR-B2")?.outcome === "passed" ||
          layer.critical_routes.find((c) => c.gate === "CR-B2")?.outcome ===
            "not_applicable",
      },
      {
        gate_code: "B3_C09" as EVEProductionCriticalRouteGateCode,
        passed:
          layer.critical_routes.find((c) => c.gate === "CR-B3")?.outcome === "passed" ||
          layer.critical_routes.find((c) => c.gate === "CR-B3")?.outcome ===
            "not_applicable",
      },
      {
        gate_code: "B7_C20" as EVEProductionCriticalRouteGateCode,
        passed:
          layer.critical_routes.find((c) => c.gate === "CR-B7")?.outcome === "passed",
      },
    ],
    runtime_deep_capture_required: false,
    missing_critical_evidence: layer.readiness_inputs.missing_critical_evidence,
    b3_incomplete: layer.readiness_inputs.b3_incomplete,
    b7_boundary_blocked: layer.readiness_inputs.b7_boundary_blocked,
    manual_review_required: layer.readiness_inputs.manual_review_required,
    reentry_required: layer.readiness_inputs.reentry_required,
  });

  const finalState = resolved.readiness_state;
  const gapIds: string[] = [];
  if (finalState !== "ready") {
    const gapId = randomUUID();
    gapIds.push(gapId);
    const gapType =
      layer.c20_confidence.status === "pending_governed_signal"
        ? "missing_canonical_route"
        : layer.pst.some((p) => p.outcome === "failed")
          ? "process_state_without_timer"
          : layer.sem.some((s) => s.outcome === "blocked" || s.outcome === "pending_resolution")
            ? "semantic_ambiguity"
            : layer.readiness_inputs.manual_review_required
              ? "manual_review"
              : "missing_evidence";
    await ctx.persistence.createReadinessGap({
      readiness_gap_id: gapId,
      activity_runtime_run_id: run.activity_runtime_run_id,
      role_runtime_session_id: run.role_runtime_session_id,
      sesion_id: run.sesion_id,
      scene_id: null,
      gap_type: gapType,
      gap_code: resolved.reason ?? finalState,
      severity: finalState === "blocked" ? "high" : "medium",
      description: resolved.reason ?? finalState,
      route_id: resolved.dominant_gate,
      related_variable_name:
        layer.c20_confidence.status === "pending_governed_signal"
          ? "confidence_level"
          : null,
      related_interaction_instance_id: null,
      requires_reentry: finalState === "reentry_required",
      reentry_target: null,
      manual_review_required: finalState === "manual_review_required",
      status: "open",
      metadata_json: {
        ...INSTRUCTION_044_METADATA,
        instruction: "044-A.5",
        regulatory_blocking: layer.blocking_reasons,
      },
    });
  }

  const decision = await ctx.persistence.createReadinessDecision({
    readiness_decision_id: randomUUID(),
    role_runtime_session_id: run.role_runtime_session_id,
    activity_runtime_run_id: run.activity_runtime_run_id,
    sesion_id: run.sesion_id,
    scene_id: null,
    decision_scope: "activity_runtime_run",
    readiness_state: finalState,
    gap_ids: gapIds,
    manual_review_required: finalState === "manual_review_required",
    reentry_required: finalState === "reentry_required",
    reentry_target: null,
    decision_reason: resolved.reason ?? finalState,
    decision_json: {
      ...INSTRUCTION_044_METADATA,
      instruction: "044-A.5",
      dominant_gate: resolved.dominant_gate,
      classification_hint: layer.classification_hint,
      c20: layer.c20_confidence,
      regulatory_layer: {
        critical_routes: layer.critical_routes,
        sem: layer.sem,
        pst: layer.pst,
        mmabp: layer.mmabp,
      },
      legacy_readiness_echo: readiness.readiness_state,
      ready_for_parallel_production: false,
    },
    decided_by: "instruction_044A5_regulatory_readiness",
  });

  await ctx.persistence.createAuditTrail({
    runtime_audit_id: randomUUID(),
    role_runtime_session_id: run.role_runtime_session_id,
    activity_runtime_run_id: run.activity_runtime_run_id,
    runtime_interaction_instance_id: null,
    sesion_id: run.sesion_id,
    scene_id: null,
    actor_type: "system",
    actor_auth_user_id: null,
    event_type: "readiness_evaluated",
    entity_table: "readiness_decision_record",
    entity_id: decision.readiness_decision_id,
    event_summary: `readiness_state=${finalState}`,
    before_json: null,
    after_json: {
      readiness_state: finalState,
      dominant_gate: resolved.dominant_gate,
      gap_ids: gapIds,
    },
    metadata_json: { ...INSTRUCTION_044_METADATA },
  });

  const terminal = mapReadinessToTerminal(finalState);
  const from = run.state as ActivityRuntimeRunState;
  if (from === "active_base_capture") {
    await applyConnectedRunTransition({
      persistence: ctx.persistence,
      role_runtime_session_id: run.role_runtime_session_id,
      activity_runtime_run_id: run.activity_runtime_run_id,
      sesion_id: run.sesion_id,
      from: "active_base_capture",
      to: "base_complete",
      cause: "governed_base_complete",
    });
    await applyConnectedRunTransition({
      persistence: ctx.persistence,
      role_runtime_session_id: run.role_runtime_session_id,
      activity_runtime_run_id: run.activity_runtime_run_id,
      sesion_id: run.sesion_id,
      from: "base_complete",
      to: "causal_evaluation_pending",
      cause: "governed_causal_eval",
    });
    // Only advance to readiness when no open unanswered causals remain.
    await applyConnectedRunTransition({
      persistence: ctx.persistence,
      role_runtime_session_id: run.role_runtime_session_id,
      activity_runtime_run_id: run.activity_runtime_run_id,
      sesion_id: run.sesion_id,
      from: "causal_evaluation_pending",
      to: "readiness_evaluation",
      cause: "governed_causals_resolved_to_readiness",
    });
    await applyConnectedRunTransition({
      persistence: ctx.persistence,
      role_runtime_session_id: run.role_runtime_session_id,
      activity_runtime_run_id: run.activity_runtime_run_id,
      sesion_id: run.sesion_id,
      from: "readiness_evaluation",
      to: terminal,
      cause: `governed_readiness:${finalState}`,
    });
    await ctx.persistence.transitionRunState({
      activity_runtime_run_id: run.activity_runtime_run_id,
      from_state: terminal,
      to_state: terminal,
      cause: "readiness_state_sync",
      readiness_state: finalState,
    });
  }

  run.state = terminal;
  store.runs.set(run.activity_runtime_run_id, run);

  return {
    ok: true,
    action: "complete_readiness",
    readiness_state: finalState,
    readiness_decision_id: decision.readiness_decision_id,
    terminal_state: terminal,
    dominant_gate: resolved.dominant_gate,
    classification_hint: layer.classification_hint,
    gap_ids: gapIds,
    writes_scene: false,
    writes_mba: false,
    parallel_production: false,
    ready_for_parallel_production: false,
  };
}

function mapReadinessToTerminal(
  state: string,
): Extract<
  ActivityRuntimeRunState,
  "ready" | "ready_with_flags" | "blocked" | "reentry_required" | "manual_review_required"
> {
  if (state === "ready_with_flags") return "ready_with_flags";
  if (state === "blocked") return "blocked";
  if (state === "reentry_required") return "reentry_required";
  if (state === "manual_review_required") return "manual_review_required";
  return "ready";
}

function requireRun(
  store: GovernedRunStore,
  runId?: string,
): ActivityRuntimeRunStagingRow & { answered: string[] } {
  if (!runId) throw new Error("run_id_required");
  const run = store.runs.get(runId);
  if (!run) throw new Error("run_not_found");
  return run;
}

function assertInteractionInFullCatalog(
  store: GovernedRunStore,
  interactionId: string,
): void {
  const found = store.interaction_defs.some(
    (d) => d.runtime_interaction_id === interactionId,
  );
  if (!found) {
    throw new Error(`interaction_id_not_in_full_catalog:${interactionId}`);
  }
}

function buildDefaultFullCatalogDefs(): CatalogInteractionDefRow[] {
  const defs: CatalogInteractionDefRow[] = [];
  defs.push({
    runtime_interaction_id: "B0-Q01",
    interaction_group_source: "base_40",
    interaction_group_normalized: "base",
    runtime_order: 1,
    visible_text: "Esto es lo que entendimos de esta actividad. ¿Está correcto?",
    ui_component: "confirmation_card_with_correction",
    pm_output: "process_map_signal",
    moc_output: null,
    pf_output: null,
    olc_output: null,
    mmabp_ir_target: null,
    readiness_effect: "none",
    registry_target: null,
    raw_row_json: {
      runtime_interaction_id: "B0-Q01",
      pm_output: "process_map_signal",
      source_code: "SRC-B0-Q01",
      source_question_code: "B0-Q01",
      block: "B0",
      help_text: "Confirma o corrige la actividad.",
    },
    active: true,
  });
  for (let index = 2; index <= 40; index += 1) {
    const id = `B0-Q${String(index).padStart(2, "0")}`;
    defs.push({
      runtime_interaction_id: id,
      interaction_group_source: "base_40",
      interaction_group_normalized: "base",
      runtime_order: index,
      visible_text: `Visible text ${id}`,
      ui_component: "compound_card",
      pm_output: null,
      moc_output: null,
      pf_output: null,
      olc_output: null,
      mmabp_ir_target: null,
      readiness_effect: null,
      registry_target: null,
      raw_row_json: {
        runtime_interaction_id: id,
        source_code: `SRC-${id}`,
        source_question_code: id,
        block: "B0",
        help_text: `Help ${id}`,
      },
      active: true,
    });
  }
  for (let index = 1; index <= 20; index += 1) {
    const id = `C${String(index).padStart(2, "0")}`;
    defs.push({
      runtime_interaction_id: id,
      interaction_group_source: "causal_20",
      interaction_group_normalized: "causal",
      runtime_order: 40 + index,
      visible_text: `Visible text ${id}`,
      ui_component: "causal_probe_card",
      pm_output: null,
      moc_output: null,
      pf_output: null,
      olc_output: null,
      mmabp_ir_target: null,
      readiness_effect: null,
      registry_target: null,
      raw_row_json: {
        runtime_interaction_id: id,
        source_code: `SRC-${id}`,
        source_question_code: id,
        block: "Causal",
        help_text: `Help ${id}`,
        explicit_trigger_authorized: true,
        authorized_trigger_ref: `TRIGGER-${id}`,
        target_causal_interaction_id: id,
        trigger_source_document:
          "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
        trigger_source_sheet: "Semantic_Resolution_Gates",
        trigger_source_row_number: 700 + index,
      },
      active: true,
    });
  }
  return defs;
}

function pickNextInteractionId(
  store: GovernedRunStore,
  answered: string[],
): string | null {
  const next = store.interaction_defs.find(
    (d) => !answered.includes(d.runtime_interaction_id),
  );
  return next?.runtime_interaction_id ?? null;
}

export function createInMemoryPersistencePort(seed?: {
  interaction_defs?: CatalogInteractionDefRow[];
  subfield_schemas?: CatalogSubfieldSchemaRow[];
  epistemic_rules?: CatalogEpistemicRuleRow[];
  branching_rules?: Awaited<
    ReturnType<Runtime40_20PersistencePort["loadBranchingRules"]>
  >;
  variable_maps?: Awaited<ReturnType<Runtime40_20PersistencePort["loadVariableMaps"]>>;
}): Runtime40_20PersistencePort & {
  _tables: Record<string, Array<Record<string, unknown>>>;
} {
  const tables: Record<string, Array<Record<string, unknown>>> = {
    role_runtime_session: [],
    activity_runtime_run: [],
    runtime_interaction_instance: [],
    response_record: [],
    runtime_subfield_response: [],
    evidence_item: [],
    canonical_variable_record: [],
    branching_decision: [],
    budget_ledger: [],
    semantic_resolution_event: [],
    process_state_timer_event: [],
    readiness_gap_record: [],
    readiness_decision_record: [],
    runtime_audit_trail: [],
  };

  const interactionDefs = seed?.interaction_defs ?? buildDefaultFullCatalogDefs();
  const defaultSubfields =
    seed?.subfield_schemas ??
    ([
      "action_verb",
      "input_or_object",
      "procedure_or_standard",
      "output_or_result",
      "user_correction_note",
    ].map((name, index) => ({
      subfield_schema_id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      catalog_version_id: RUNTIME_40_20_FULL_ACTIVE_CATALOG_VERSION_ID,
      runtime_interaction_id: "B0-Q01",
      subfield_name: name,
      subfield_label: null,
      subfield_type: "text",
      required: true,
      ordinal: index + 1,
      storage_rule: "requires_user_confirmation",
      ui_component: "confirmation_card_with_correction",
      raw_row_json: {
        type: "text",
        label: name,
        source_reference: {
          source_sheet: "UX_Subfield_Structure",
          source_row: 2 + index,
        },
      },
    })) as CatalogSubfieldSchemaRow[]);
  const defaultEpistemic =
    seed?.epistemic_rules ??
    ([
      {
        catalog_version_id: RUNTIME_40_20_FULL_ACTIVE_CATALOG_VERSION_ID,
        runtime_interaction_id: "B0-Q01",
        field_name: "must_not_infer",
        raw_literal: "action_verb",
        source_file: "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
        source_sheet: "Runtime_Interactions_Base_40",
        source_row: 2,
        trace_id: "TR-002",
      },
    ] as CatalogEpistemicRuleRow[]);

  return {
    _tables: tables,
    async assertActiveCatalog(catalogVersionId) {
      if (catalogVersionId !== RUNTIME_40_20_FULL_ACTIVE_CATALOG_VERSION_ID) {
        throw new Error("catalog_version_id_refused");
      }
    },
    async createSession(input) {
      const row = {
        ...input,
        role_label: input.role_label ?? null,
        state: input.state ?? "active",
        primary_activity_limit: input.primary_activity_limit ?? 8,
        primary_activity_count: input.primary_activity_count ?? 1,
        secondary_activity_count: 0,
        backlog_activity_count: 0,
        total_estimated_minutes: null,
        total_elapsed_seconds: null,
        tenant_id: input.tenant_id ?? null,
        organization_id: input.organization_id ?? null,
        owner_auth_user_id: input.owner_auth_user_id ?? null,
        execution_mode: "internal_test" as const,
        metadata_json: { ...INSTRUCTION_044_METADATA, ...(input.metadata_json ?? {}) },
      };
      tables.role_runtime_session.push(row);
      return row as never;
    },
    async createRun(input) {
      const row = {
        ...input,
        legacy_actividad_id: null,
        scene_id: null,
        activity_name: input.activity_name ?? null,
        activity_rank: input.activity_rank ?? 1,
        is_primary_activity: input.is_primary_activity ?? true,
        state: input.state ?? "initialized",
        base_visible_count: 0,
        causal_visible_count: 0,
        microconfirmation_visible_count: 0,
        internal_interaction_count: 0,
        readiness_state: null,
        current_runtime_interaction_id: null,
        tenant_id: input.tenant_id ?? null,
        organization_id: input.organization_id ?? null,
        owner_auth_user_id: input.owner_auth_user_id ?? null,
        execution_mode: "internal_test" as const,
        metadata_json: { ...INSTRUCTION_044_METADATA, ...(input.metadata_json ?? {}) },
      };
      tables.activity_runtime_run.push(row);
      return row as never;
    },
    async transitionRunState(input) {
      const row = tables.activity_runtime_run.find(
        (r) => r.activity_runtime_run_id === input.activity_runtime_run_id,
      );
      if (!row) throw new Error("run_missing");
      if (row.state !== input.from_state) {
        throw new Error(`run_state_mismatch:${String(row.state)}!=${input.from_state}`);
      }
      row.state = input.to_state;
      row.metadata_json = {
        ...INSTRUCTION_044_METADATA,
        last_transition_cause: input.cause,
      };
      return row as never;
    },
    async createInteractionInstance(row) {
      const full = {
        ...row,
        scene_id: null,
        metadata_json: { ...INSTRUCTION_044_METADATA, ...(row.metadata_json ?? {}) },
      };
      tables.runtime_interaction_instance.push(full);
      return full as never;
    },
    async createResponseBundle(bundle) {
      tables.response_record.push(bundle.response as never);
      tables.runtime_subfield_response.push(...(bundle.subfields as never[]));
      tables.evidence_item.push(...(bundle.evidence as never[]));
      tables.canonical_variable_record.push(...(bundle.canonical_variables as never[]));
      return bundle;
    },
    async createBranchingDecision(row) {
      tables.branching_decision.push(row as never);
      return row;
    },
    async createBudgetLedgerEntry(row) {
      const full = {
        ...row,
        metadata_json: { ...INSTRUCTION_044_METADATA, ...(row.metadata_json ?? {}) },
      };
      tables.budget_ledger.push(full);
      return full as never;
    },
    async createSemanticResolutionEvent(row) {
      tables.semantic_resolution_event.push(row as never);
      return row;
    },
    async createProcessStateTimerEvent(row) {
      tables.process_state_timer_event.push(row as never);
      return row;
    },
    async updateProcessStateTimerEvent(eventId, patch) {
      const row = tables.process_state_timer_event.find(
        (r) => r.process_state_timer_event_id === eventId,
      );
      if (!row) throw new Error("timer_missing");
      Object.assign(row, patch);
      return row as never;
    },
    async createReadinessGap(row) {
      tables.readiness_gap_record.push(row as never);
      return row;
    },
    async createReadinessDecision(row) {
      tables.readiness_decision_record.push(row as never);
      return row;
    },
    async createAuditTrail(row) {
      tables.runtime_audit_trail.push(row as never);
      return row;
    },
    async loadCatalogInteractionIds() {
      return interactionDefs.map((d) => d.runtime_interaction_id);
    },
    async loadCatalogInteractionDefs() {
      return interactionDefs;
    },
    async loadCatalogSubfieldSchemas() {
      return defaultSubfields;
    },
    async loadCatalogEpistemicRules() {
      return defaultEpistemic;
    },
    async loadBranchingRules() {
      return seed?.branching_rules ?? [];
    },
    async loadVariableMaps() {
      return seed?.variable_maps ?? [];
    },
  };
}
