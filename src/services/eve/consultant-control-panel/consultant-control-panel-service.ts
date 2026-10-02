import type {
  ConsultantControlPanelRole,
  ConsultantControlPanelState,
  ControlPanelFilterScope,
  ControlPanelIncludeMode,
  DownloadRequestBody,
  DownloadRequestResponse,
  ManualActionKind,
  ManualActionRequest,
  ManualActionResponse,
  ManualControlAvailability,
  RuntimeViewScopeKey,
} from "./consultant-control-panel-types";
import {
  buildCerveceriaAmbarAncestralFixtureState,
  isAmbarFixtureRequested,
} from "./fixtures/cerveceria-ambar-ancestral-fixture";
import {
  EMPTY_BASE_RESOLUTION_GATE,
  EMPTY_CAUSAL_CLOSURE_GATE,
  OPERATIONAL_SUFFICIENCY_NOTE,
} from "./fixtures/ambar-runtime-4020-operational-ledgers";
import { RUNTIME_40_20_OPERATIONAL_RULES_VERSION } from "@/services/eve/runtime-40-20/operational-rules/base40-operational-rule";
import {
  buildDownloadsWithSupMapping,
  buildSupFinalObjectsBackbone,
  SUP_EVENT_TO_OBJECT_LINKS,
} from "./sup-final-objects-backbone";
import {
  DEFAULT_CONTROL_PANEL_CAPABILITIES,
  DEFAULT_RUNTIME_PM_PROCESS_CODE,
  enrichConsultantControlPanelState,
  normalizeIncludeMode,
  normalizeRuntimeViewScope,
  RUNTIME_CATALOG_VERSION_LABEL,
} from "./consultant-control-panel-enrichment";
import type { ControlPanelViewKey } from "./consultant-control-panel-types";

const AUDITED_ENDPOINT_REASON = "Requiere endpoint auditado";
const PENDING_GENERATOR_REASON = "Pendiente de generador autorizado";

const EMPTY_FILTERS: ControlPanelFilterScope = {
  client_company_id: null,
  case_id: null,
  user_id: null,
  role_id: null,
  role_runtime_session_id: null,
  activity_id: null,
  run_id: null,
  event_type: null,
  gate_code: null,
  status: null,
  view: null,
  runtime_view_scope: null,
};

const VIEW_KEYS = new Set<ControlPanelViewKey>([
  "cases",
  "functional-help",
  "monitoring",
  "runtime",
  "trace",
  "gates",
  "downloads",
  "audit",
]);

export function parseControlPanelFilters(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>,
): ControlPanelFilterScope {
  const get = (key: string): string | null => {
    if (searchParams instanceof URLSearchParams) {
      const value = searchParams.get(key);
      return value && value.trim() ? value.trim() : null;
    }
    const raw = searchParams[key];
    const value = Array.isArray(raw) ? raw[0] : raw;
    return value && value.trim() ? value.trim() : null;
  };

  const viewRaw = get("view");
  const view =
    viewRaw && VIEW_KEYS.has(viewRaw as ControlPanelViewKey)
      ? (viewRaw as ControlPanelViewKey)
      : null;

  const runtimeViewRaw = get("runtime_view_scope") ?? get("runtimeViewScope");
  const runtime_view_scope: RuntimeViewScopeKey | null = runtimeViewRaw
    ? normalizeRuntimeViewScope(runtimeViewRaw)
    : null;

  return {
    client_company_id: get("client_company_id"),
    case_id: get("case_id"),
    user_id: get("user_id"),
    role_id: get("role_id"),
    role_runtime_session_id:
      get("role_runtime_session_id") ?? get("roleSessionId"),
    activity_id: get("activity_id") ?? get("activityId"),
    run_id: get("run_id") ?? get("runId"),
    event_type: get("event_type"),
    gate_code: get("gate_code"),
    status: get("status"),
    view,
    runtime_view_scope,
  };
}

export function parseControlPanelInclude(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>,
): ControlPanelIncludeMode {
  const get = (key: string): string | null => {
    if (searchParams instanceof URLSearchParams) {
      const value = searchParams.get(key);
      return value && value.trim() ? value.trim() : null;
    }
    const raw = searchParams[key];
    const value = Array.isArray(raw) ? raw[0] : raw;
    return value && value.trim() ? value.trim() : null;
  };
  return normalizeIncludeMode(get("include"));
}

function buildManualControls(): ManualControlAvailability[] {
  const actions: ManualActionKind[] = [
    "continue_block",
    "restart_block",
    "reopen_block",
    "set_questions_manually",
    "select_activity_manually",
    "mark_for_review",
    "request_reentry",
  ];

  return actions.map((action) => ({
    action,
    enabled: false,
    reason_if_disabled: AUDITED_ENDPOINT_REASON,
    requires_justification: true,
    requires_audit_trail: true,
  }));
}

export function resolveControlPanelFixtureQuery(
  searchParams?: URLSearchParams | Record<string, string | string[] | undefined> | null,
): string | null {
  if (!searchParams) return null;
  if (searchParams instanceof URLSearchParams) {
    const value = searchParams.get("fixture");
    return value && value.trim() ? value.trim() : null;
  }
  const raw = searchParams.fixture;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value && value.trim() ? value.trim() : null;
}

/**
 * Local non-production guard: when fixture=ambar (or env fixture) is requested,
 * the generated state must be populated. When fixture was not requested, returns
 * { requested: false, ok: true }.
 */
export function validateAmbarFixtureState(input: {
  fixtureQuery?: string | null;
  state: ConsultantControlPanelState;
  env?: NodeJS.ProcessEnv;
}): {
  requested: boolean;
  ok: boolean;
  failures: string[];
} {
  const env = input.env ?? process.env;
  const requested = isAmbarFixtureRequested(env, input.fixtureQuery ?? null);
  if (!requested) {
    return { requested: false, ok: true, failures: [] };
  }

  const state = input.state;
  const failures: string[] = [];
  if (!state.fixture) failures.push("state.fixture === null");
  if (state.area_2_client_progress.client_company_name !== "Cervecería Ámbar Ancestral") {
    failures.push('client_company_name !== "Cervecería Ámbar Ancestral"');
  }
  if (state.area_2_client_progress.users.length < 1 || state.area_2_client_progress.users.length > 3) {
    failures.push(`users.length === ${state.area_2_client_progress.users.length}`);
  }
  if (
    state.area_2_client_progress.users.some(
      (user) => user.activities_count < 1 || user.activities_count > 8,
    )
  ) {
    failures.push("activities_count must be between 1 and 8 per user");
  }
  if (state.area_3_operational_trace.timeline.length < 10) {
    failures.push(
      `timeline.length === ${state.area_3_operational_trace.timeline.length} (< 10)`,
    );
  }
  if (state.area_3_operational_trace.gate_summaries.length !== 6) {
    failures.push(
      `gate_summaries.length === ${state.area_3_operational_trace.gate_summaries.length}`,
    );
  }
  if (state.area_3_operational_trace.runtimeBlockCoverageByRun.length < 1) {
    failures.push(
      `runtimeBlockCoverageByRun.length === ${state.area_3_operational_trace.runtimeBlockCoverageByRun.length}`,
    );
  }
  const expectedBlockIds = ["0", "0.5", "1", "2", "3", "4", "5", "6", "7"];
  const expectedBlockLabels = [
    "Bloque 0",
    "Bloque 0.5",
    "Bloque 1",
    "Bloque 2",
    "Bloque 3",
    "Bloque 4",
    "Bloque 5",
    "Bloque 6",
    "Bloque 7",
  ];
  for (const run of state.area_3_operational_trace.runtimeBlockCoverageByRun) {
    const actualBlockIds = run.blocks.map((block) => block.blockId);
    const actualBlockLabels = run.blocks.map((block) => block.blockLabel);
    if (expectedBlockIds.some((id, index) => actualBlockIds[index] !== id)) {
      failures.push(
        `runtimeBlockCoverageByRun[${run.activityCode}] blockIds !== [${expectedBlockIds.join(", ")}]`,
      );
    }
    if (expectedBlockLabels.some((label, index) => actualBlockLabels[index] !== label)) {
      failures.push(
        `runtimeBlockCoverageByRun[${run.activityCode}] blockLabels incomplete`,
      );
    }
  }
  if (state.area_3_operational_trace.sceneCandidatesByRun.length < 1) {
    failures.push(
      `sceneCandidatesByRun.length === ${state.area_3_operational_trace.sceneCandidatesByRun.length}`,
    );
  }
  if (state.area_3_operational_trace.runtimeBudget4020.runtimeBudgetByRun.length < 1) {
    failures.push(
      `runtimeBudgetByRun.length === ${state.area_3_operational_trace.runtimeBudget4020.runtimeBudgetByRun.length}`,
    );
  }
  const budgetRuns = state.area_3_operational_trace.runtimeBudget4020.runtimeBudgetByRun;
  const allRunsHaveIndependent4020 = budgetRuns.every(
    (run) => run.baseLimit === 40 && run.causalLimit === 20,
  );
  if (!allRunsHaveIndependent4020) {
    failures.push("runtimeBudgetByRun limits !== 40/20 per run");
  }
  if (
    !String(state.area_3_operational_trace.runtimeBudget4020.note).includes(
      "No es un presupuesto agregado",
    )
  ) {
    failures.push("runtimeBudget4020.note missing non-aggregate scope text");
  }
  if (
    state.area_3_operational_trace.runtimeBudget4020.caseAggregate.informationalLabel !==
    "Agregado informativo — no límite de presupuesto"
  ) {
    failures.push("caseAggregate missing informational-only label");
  }
  if (state.area_3_operational_trace.runtimeBudget4020.consumptionByBlockByRun.length !== 3) {
    failures.push(
      `consumptionByBlockByRun.length === ${state.area_3_operational_trace.runtimeBudget4020.consumptionByBlockByRun.length}`,
    );
  }
  if (state.area_3_operational_trace.baseResolutionByRun.length !== 3) {
    failures.push(
      `baseResolutionByRun.length === ${state.area_3_operational_trace.baseResolutionByRun.length}`,
    );
  }
  for (const run of state.area_3_operational_trace.baseResolutionByRun) {
    if (run.records.length !== 40) {
      failures.push(`baseResolutionByRun[${run.activityCode}] records.length !== 40`);
    }
    if (run.skipped_silently_count !== 0) {
      failures.push(`baseResolutionByRun[${run.activityCode}] skipped_silently_count !== 0`);
    }
  }
  if (state.area_3_operational_trace.causalClosureByRun.length !== 3) {
    failures.push(
      `causalClosureByRun.length === ${state.area_3_operational_trace.causalClosureByRun.length}`,
    );
  }
  for (const run of state.area_3_operational_trace.causalClosureByRun) {
    if (run.records.length !== 20) {
      failures.push(`causalClosureByRun[${run.activityCode}] records.length !== 20`);
    }
  }
  if (!state.area_3_operational_trace.base_resolution_gate) {
    failures.push("base_resolution_gate missing");
  }
  if (!state.area_3_operational_trace.causal_closure_gate) {
    failures.push("causal_closure_gate missing");
  }
  if (
    !String(state.area_3_operational_trace.runtimeBudget4020.operationalSufficiencyNote ?? "").includes(
      "40 base obligatorias por resolución",
    )
  ) {
    failures.push("operationalSufficiencyNote missing mandatory 40/20 text");
  }
  if (!String(state.area_3_operational_trace.runtime_40_20_operational_rules_version ?? "")) {
    failures.push("runtime_40_20_operational_rules_version missing");
  }
  if (!String(state.area_2_client_progress.case_label ?? "").includes("Diagnóstico de coordinación")) {
    failures.push("case_label missing Diagnóstico de coordinación");
  }
  if (!(state.area_2_client_progress.overall_progress_pct > 0)) {
    failures.push("overall_progress_pct <= 0");
  }
  if (state.sup_final_objects_backbone.supFinalObjects.length !== 5) {
    failures.push(
      `supFinalObjects.length === ${state.sup_final_objects_backbone.supFinalObjects.length}`,
    );
  }
  if (
    !state.sup_final_objects_backbone.objects.some(
      (object) => object.code === "P-SUP-09" && object.status === "generated_but_export_disabled",
    )
  ) {
    failures.push("P-SUP-09 missing generated_but_export_disabled");
  }

  return { requested: true, ok: failures.length === 0, failures };
}

/**
 * Read-mode adapter for the consultant control panel.
 * Does not touch production, does not use service_role, does not invent diagnosis.
 * Optional local fixture (Cervecería Ámbar Ancestral) only when NODE_ENV !== production
 * and EVE_CONSULTANT_CONTROL_PANEL_FIXTURE or ?fixture=ambar is set.
 */
export function buildConsultantControlPanelState(input: {
  filters?: Partial<ControlPanelFilterScope>;
  role?: ConsultantControlPanelRole | null;
  fixtureQuery?: string | null;
  env?: NodeJS.ProcessEnv;
  include?: ControlPanelIncludeMode | null;
}): ConsultantControlPanelState {
  const env = input.env ?? process.env;
  const include = normalizeIncludeMode(input.include ?? "run-detail");
  const runtimeViewScope = normalizeRuntimeViewScope(
    input.filters?.runtime_view_scope ?? "selected_activity",
  );

  if (isAmbarFixtureRequested(env, input.fixtureQuery ?? null)) {
    return enrichConsultantControlPanelState(
      buildCerveceriaAmbarAncestralFixtureState({
        filters: input.filters,
        role: input.role,
      }),
      {
        include,
        runtime_view_scope: runtimeViewScope,
      },
    );
  }

  const filters: ControlPanelFilterScope = {
    ...EMPTY_FILTERS,
    ...input.filters,
    runtime_view_scope: runtimeViewScope,
  };

  return enrichConsultantControlPanelState({
    panel_id: "consultant_expert_control_panel",
    request_id: `REQ-CCP-EMPTY-${Date.now()}`,
    contract_version: "1.0",
    generated_at: new Date().toISOString(),
    access: {
      surface: "consultant_internal",
      client_access_blocked: true,
      consultant_role: input.role ?? null,
    },
    capabilities: DEFAULT_CONTROL_PANEL_CAPABILITIES,
    critical_alerts: [],
    filters,
    filter_options: {
      client_companies: [],
      cases: [],
      users: [],
      roles: [],
      role_runtime_sessions: [],
      activities: [],
      runs: [],
    },
    case_header: {
      company_name: null,
      case_id: filters.case_id,
      case_label: null,
      case_status: null,
      catalog_version: RUNTIME_CATALOG_VERSION_LABEL,
      runtime_version: RUNTIME_40_20_OPERATIONAL_RULES_VERSION,
    },
    selected_context: {
      companyName: null,
      caseId: filters.case_id,
      caseLabel: null,
      physicalUserId: filters.user_id,
      physicalUserLabel: null,
      roleRuntimeSessionId: filters.role_runtime_session_id,
      roleLabel: null,
      roleId: filters.role_id,
      activityId: filters.activity_id,
      activityTitle: null,
      activityCode: null,
      runId: filters.run_id,
      pmProcessCode: DEFAULT_RUNTIME_PM_PROCESS_CODE,
      catalogVersion: RUNTIME_CATALOG_VERSION_LABEL,
      runtimeVersion: RUNTIME_40_20_OPERATIONAL_RULES_VERSION,
      runState: null,
      runStateLabel: null,
      effectiveScope: runtimeViewScope,
      isAggregateView: runtimeViewScope !== "selected_activity",
    },
    runs: [],
    base_items: null,
    causal_items: null,
    gates: [],
    meta: {
      effective_scope: {
        client_company_id: filters.client_company_id,
        case_id: filters.case_id,
        user_id: filters.user_id,
        role_id: filters.role_id,
        role_runtime_session_id: filters.role_runtime_session_id,
        activity_id: filters.activity_id,
        run_id: filters.run_id,
        runtime_view_scope: runtimeViewScope,
        include,
        pm_process_code: DEFAULT_RUNTIME_PM_PROCESS_CODE,
      },
      capabilities: DEFAULT_CONTROL_PANEL_CAPABILITIES,
      freshness: {
        as_of: new Date().toISOString(),
        stale: false,
        source: "empty",
      },
    },
    area_1_functional_help: {
      client_company_name: null,
      case_id: filters.case_id,
      user_id: filters.user_id,
      user_label: null,
      role_id: filters.role_id,
      role_label: null,
      current_activity_id: filters.activity_id,
      current_activity_label: null,
      current_question_block: null,
      block_status: "Sin datos en alcance",
      pending_questions: [],
      incomplete_answers: [],
      errors_or_blocks: [],
      last_interaction_at: null,
      intervention_history: [],
      manual_controls: buildManualControls(),
      causal_purpose:
        "Permitir al consultor intervenir cuando un usuario cliente se bloquea, se desvía, necesita reentrada o requiere selección manual de actividad/preguntas.",
    },
    area_2_client_progress: {
      client_company_id: filters.client_company_id,
      client_company_name: null,
      case_id: filters.case_id,
      case_status: "Sin datos en alcance",
      overall_progress_pct: 0,
      users: [],
      associated_roles: [],
      causal_purpose:
        "El usuario no es cliente aislado; pertenece a una empresa cliente. El consultor debe ver avance por empresa, caso, rol y usuario.",
    },
    area_3_operational_trace: {
      timeline: [],
      runtime_events_count: 0,
      interactions_count: 0,
      answers_processed_count: 0,
      subfields_count: 0,
      evidence_items_count: 0,
      canonical_variables_count: 0,
      readiness_gaps_count: 0,
      runtimeBlockCoverageByRun: [],
      sceneCandidatesByRun: [],
      runtimeBudget4020: {
        scopeTitle: "Presupuesto Runtime 40/20 por usuario / rol / actividad primaria",
        note: "El presupuesto 40/20 se calcula por activity_runtime_run de una actividad primaria dentro de una role_runtime_session. No es un presupuesto agregado de la empresa cliente ni del caso completo.",
        operationalSufficiencyNote: OPERATIONAL_SUFFICIENCY_NOTE,
        caseAggregate: {
          usersInScope: 0,
          rolesInScope: 0,
          primaryActivitiesSelected: 0,
          activeRuns: 0,
          totalBaseInteractionsObserved: 0,
          totalCausalInteractionsObserved: 0,
          informationalLabel: "Agregado informativo — no límite de presupuesto",
        },
        budgetByUserRole: [],
        runtimeBudgetByRun: [],
        consumptionByBlockByRun: [],
      },
      baseResolutionByRun: [],
      causalClosureByRun: [],
      base_resolution_gate: EMPTY_BASE_RESOLUTION_GATE,
      causal_closure_gate: EMPTY_CAUSAL_CLOSURE_GATE,
      runtime_40_20_operational_rules_version: RUNTIME_40_20_OPERATIONAL_RULES_VERSION,
      gate_summaries: [],
      transduction_status: "Sin datos en alcance",
      actor_scene_company_relation:
        "actor → escena → empresa cliente (pendiente de datos de runtime en alcance filtrado)",
      causal_purpose:
        "Materializar la operación interna de EVE: información del usuario → actor/escena → transducción → empresa cliente → evidencia → variables/gaps → gates/readiness.",
      event_to_sup_links: SUP_EVENT_TO_OBJECT_LINKS,
    },
    sup_final_objects_backbone: buildSupFinalObjectsBackbone("empty"),
    area_4_downloads: {
      downloads: buildDownloadsWithSupMapping(),
      causal_purpose:
        "Permitir al consultor descargar información útil para análisis, revisión y traslado controlado, sin exportaciones productivas no autorizadas.",
    },
    boundary: {
      production_touched: false,
      service_role_in_frontend: false,
      diagnosis_final_automatic: false,
      productive_export_executed: false,
      activation_reopened: false,
      ring_5_recreated: false,
    },
    consultant_safe_message:
      "Panel de control en modo lectura. Controles manuales y descargas requieren autoridad y generadores auditados.",
    fixture: null,
  }, {
    include,
    runtime_view_scope: runtimeViewScope,
  });
}

export function handleManualActionRequest(
  body: ManualActionRequest,
): ManualActionResponse {
  const justification = body.justification?.trim() ?? "";
  if (!justification) {
    return {
      status: "rejected",
      error: "justification_required",
      consultant_safe_message: "Toda acción manual exige justificación obligatoria.",
    };
  }

  if (!body.consultant_user_id?.trim()) {
    return {
      status: "rejected",
      error: "consultant_user_id_required",
      consultant_safe_message: "Se requiere identificar al consultor responsable.",
    };
  }

  return {
    status: "disabled_requires_audited_endpoint",
    consultant_safe_message: AUDITED_ENDPOINT_REASON,
    reason: AUDITED_ENDPOINT_REASON,
  };
}

export function handleDownloadRequest(
  body: DownloadRequestBody,
): DownloadRequestResponse {
  const justification = body.justification?.trim() ?? "";
  if (!justification) {
    return {
      status: "blocked",
      error: "justification_required",
      consultant_safe_message: "Toda descarga exige justificación y autoridad.",
    };
  }

  if (!body.consultant_user_id?.trim()) {
    return {
      status: "blocked",
      error: "consultant_user_id_required",
      consultant_safe_message: "Se requiere identificar al consultor responsable.",
    };
  }

  return {
    status: "authorized_pending_generator",
    consultant_safe_message: PENDING_GENERATOR_REASON,
    reason: PENDING_GENERATOR_REASON,
  };
}

export const MANUAL_ACTION_LABELS: Record<ManualActionKind, string> = {
  continue_block: "Continuar bloque",
  restart_block: "Reiniciar bloque",
  reopen_block: "Reabrir bloque",
  set_questions_manually: "Poner preguntas manualmente",
  select_activity_manually: "Escoger actividad manualmente",
  mark_for_review: "Marcar para revisión",
  request_reentry: "Solicitar reentry",
};
