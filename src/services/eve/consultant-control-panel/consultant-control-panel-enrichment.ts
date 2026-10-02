import type {
  BaseResolutionStateById,
  CausalClosureStateById,
  ConsultantControlPanelState,
  ControlPanelCapabilities,
  ControlPanelCaseHeader,
  ControlPanelEffectiveScope,
  ControlPanelIncludeMode,
  ControlPanelMeta,
  ControlPanelSelectedContext,
  CriticalAlert,
  RoleRuntimeSessionSummary,
  RuntimeBudgetByRunItem,
  RuntimeViewScopeKey,
  UserProgressRow,
} from "./consultant-control-panel-types";
import { buildDownloadsWithSupMapping } from "./sup-final-objects-backbone";
import { RUNTIME_40_20_OPERATIONAL_RULES_VERSION } from "@/services/eve/runtime-40-20/operational-rules/base40-operational-rule";
import { buildPClient01WorkspaceVM } from "./p-client-01-view-models";

export const DEFAULT_CONTROL_PANEL_CAPABILITIES: ControlPanelCapabilities = {
  read: true,
  manual_actions: {
    enabled: false,
    reason_code: "AUDITED_ENDPOINT_NOT_AVAILABLE",
    allowed_actions: [],
  },
  downloads: {
    enabled: false,
    reason_code: "AUTHORIZED_GENERATOR_NOT_AVAILABLE",
  },
};

/** Canonical Runtime catalog version shown in run context (Ámbar / UI Spec). */
export const RUNTIME_CATALOG_VERSION_LABEL = "1.1.1";

/** Default PM process owning Runtime 40+20 observation (Diseño P-SUP-01). */
export const DEFAULT_RUNTIME_PM_PROCESS_CODE = "P-SUP-01";

const RUNTIME_VIEW_SCOPE_KEYS = new Set<RuntimeViewScopeKey>([
  "selected_activity",
  "role_activities",
  "user_all_roles",
  "case_all",
]);

export function normalizeRuntimeViewScope(
  value: string | null | undefined,
): RuntimeViewScopeKey {
  if (value && RUNTIME_VIEW_SCOPE_KEYS.has(value as RuntimeViewScopeKey)) {
    return value as RuntimeViewScopeKey;
  }
  return "selected_activity";
}

export function normalizeIncludeMode(
  value: string | null | undefined,
): ControlPanelIncludeMode {
  return value === "summary" ? "summary" : "run-detail";
}

function emptySelectedContext(
  scope: RuntimeViewScopeKey = "selected_activity",
): ControlPanelSelectedContext {
  return {
    companyName: null,
    caseId: null,
    caseLabel: null,
    physicalUserId: null,
    physicalUserLabel: null,
    roleRuntimeSessionId: null,
    roleLabel: null,
    roleId: null,
    activityId: null,
    activityTitle: null,
    activityCode: null,
    runId: null,
    pmProcessCode: DEFAULT_RUNTIME_PM_PROCESS_CODE,
    catalogVersion: RUNTIME_CATALOG_VERSION_LABEL,
    runtimeVersion: RUNTIME_40_20_OPERATIONAL_RULES_VERSION,
    runState: null,
    runStateLabel: null,
    effectiveScope: scope,
    isAggregateView: scope !== "selected_activity",
  };
}

function emptyCaseHeader(): ControlPanelCaseHeader {
  return {
    company_name: null,
    case_id: null,
    case_label: null,
    case_status: null,
    catalog_version: RUNTIME_CATALOG_VERSION_LABEL,
    runtime_version: RUNTIME_40_20_OPERATIONAL_RULES_VERSION,
  };
}

function emptyMeta(
  state: Pick<ConsultantControlPanelState, "generated_at" | "capabilities" | "filters">,
  scope: RuntimeViewScopeKey,
  include: ControlPanelIncludeMode,
): ControlPanelMeta {
  return {
    effective_scope: {
      client_company_id: state.filters.client_company_id,
      case_id: state.filters.case_id,
      user_id: state.filters.user_id,
      role_id: state.filters.role_id,
      role_runtime_session_id: state.filters.role_runtime_session_id,
      activity_id: state.filters.activity_id,
      run_id: state.filters.run_id,
      runtime_view_scope: scope,
      include,
      pm_process_code: DEFAULT_RUNTIME_PM_PROCESS_CODE,
    },
    capabilities: state.capabilities,
    freshness: {
      as_of: state.generated_at,
      stale: false,
      source: "empty",
    },
  };
}

function buildRoleSessionsForUser(
  user: UserProgressRow,
  state: ConsultantControlPanelState,
): RoleRuntimeSessionSummary[] {
  if (user.role_runtime_sessions && user.role_runtime_sessions.length > 0) {
    return user.role_runtime_sessions;
  }

  const runs = state.area_3_operational_trace.runtimeBudget4020.runtimeBudgetByRun.filter(
    (run) => run.userId === user.user_id,
  );
  const bySession = new Map<string, RoleRuntimeSessionSummary>();
  for (const run of runs) {
    const existing = bySession.get(run.roleRuntimeSessionId);
    if (existing) {
      existing.run_count += 1;
      existing.activity_count += 1;
      continue;
    }
    bySession.set(run.roleRuntimeSessionId, {
      role_runtime_session_id: run.roleRuntimeSessionId,
      role_id: run.roleId,
      role_label: run.role || user.role_label || run.roleId,
      state: run.runState,
      activity_count: 1,
      run_count: 1,
    });
  }

  if (bySession.size > 0) {
    return Array.from(bySession.values());
  }

  if (user.role_id) {
    return [
      {
        role_runtime_session_id: `rrs-from-role-${user.role_id}`,
        role_id: user.role_id,
        role_label: user.role_label ?? user.role_id,
        state: user.active ? "in_progress" : "idle",
        activity_count: user.activities_count,
        run_count: 0,
      },
    ];
  }

  return [];
}

export function buildCriticalAlerts(
  state: ConsultantControlPanelState,
): CriticalAlert[] {
  const alerts: CriticalAlert[] = [];

  for (const user of state.area_2_client_progress.users) {
    const sessions = buildRoleSessionsForUser(user, state);
    const separation =
      user.functional_separation_state ??
      (sessions.length > 1 ? "multi_confirmed" : "single_confirmed");

    if (separation === "mixed_unresolved") {
      alerts.push({
        alert_id: "ROLE_ASSIGNMENT_GAP",
        severity: "warning",
        title: "ROLE_ASSIGNMENT_GAP",
        message:
          "Hay responsabilidades o actividades sin asignación estable a un role_runtime_session.",
        affected_scope: {
          case_id: state.area_2_client_progress.case_id,
          user_id: user.user_id,
        },
        reentry_target: "WorkMap functional assignment review",
      });
    }
  }

  for (const gate of state.area_3_operational_trace.gate_summaries) {
    if (gate.status === "blocked" || gate.status === "warning") {
      const isB3 = gate.gate_code.includes("B3");
      const isPst = gate.gate_code.includes("PST");
      const isSem = gate.gate_code.includes("SEM");
      alerts.push({
        alert_id: isB3
          ? "B3_ROUTE_MISSING"
          : isPst
            ? "PST_TIMER"
            : isSem
              ? "SEM_UNRESOLVED"
              : `GATE_${gate.gate_code}`,
        severity: gate.status === "blocked" ? "error" : "warning",
        title: gate.gate_code,
        message: gate.reason ?? `Gate ${gate.gate_code} en estado ${gate.status}`,
        affected_scope: {
          case_id: state.area_2_client_progress.case_id,
        },
      });
    }
  }

  const aca = state.sup_final_objects_backbone.objects.find(
    (object) => object.code === "P-SUP-07/08",
  );
  if (aca && aca.state !== "Satisfied") {
    alerts.push({
      alert_id: "ACA_EXPORT_BLOCKED",
      severity: "warning",
      title: "Export bloqueado por ACA",
      message:
        "Camunda/BPMN permanece no elegible mientras ArchitectureConsistencyAssessment no esté Satisfied.",
    });
  }

  if (state.boundary.productive_export_executed === false) {
    const hasExportDisabled = state.sup_final_objects_backbone.objects.some(
      (object) => object.status === "generated_but_export_disabled",
    );
    if (hasExportDisabled) {
      alerts.push({
        alert_id: "EXPORT_DISABLED",
        severity: "review",
        title: "Export productivo deshabilitado",
        message:
          "Hay paquete de export preparado, pero la frontera impide exportación productiva.",
      });
    }
  }

  return alerts;
}

export function runStateToLabel(runState: string | null | undefined): string | null {
  if (!runState) return null;
  const value = runState.toLowerCase();
  if (value.includes("manual_review") || value.includes("pending")) {
    return "En progreso con pendientes";
  }
  if (value.includes("blocked")) return "Bloqueado";
  if (value.includes("active") || value.includes("in_progress") || value.includes("causal")) {
    return "En progreso";
  }
  if (value.includes("ready") || value.includes("complete")) return "Completado con flags";
  return runState;
}

function resolveSelectedRun(
  runs: RuntimeBudgetByRunItem[],
  filters: ConsultantControlPanelState["filters"],
): RuntimeBudgetByRunItem | null {
  if (runs.length === 0) return null;
  if (filters.run_id) {
    return runs.find((run) => run.activityRuntimeRunId === filters.run_id) ?? null;
  }
  if (filters.activity_id) {
    const byActivity = runs.find((run) => run.activityId === filters.activity_id);
    if (byActivity) return byActivity;
  }
  if (filters.role_runtime_session_id) {
    const bySession = runs.find(
      (run) => run.roleRuntimeSessionId === filters.role_runtime_session_id,
    );
    if (bySession) return bySession;
  }
  if (filters.user_id) {
    const byUser = runs.find((run) => run.userId === filters.user_id);
    if (byUser) return byUser;
  }
  return runs[0] ?? null;
}

function filterRunsForAggregateScope(
  runs: RuntimeBudgetByRunItem[],
  selected: RuntimeBudgetByRunItem | null,
  scope: RuntimeViewScopeKey,
): RuntimeBudgetByRunItem[] {
  if (scope === "selected_activity") {
    return selected
      ? runs.filter((run) => run.activityRuntimeRunId === selected.activityRuntimeRunId)
      : [];
  }
  if (!selected) return runs;
  if (scope === "role_activities") {
    return runs.filter(
      (run) => run.roleRuntimeSessionId === selected.roleRuntimeSessionId,
    );
  }
  if (scope === "user_all_roles") {
    return runs.filter((run) => run.userId === selected.userId);
  }
  return runs;
}

function buildCaseHeader(state: ConsultantControlPanelState): ControlPanelCaseHeader {
  return {
    company_name: state.area_2_client_progress.client_company_name,
    case_id: state.area_2_client_progress.case_id,
    case_label: state.area_2_client_progress.case_label ?? null,
    case_status: state.area_2_client_progress.case_status,
    catalog_version: RUNTIME_CATALOG_VERSION_LABEL,
    runtime_version:
      state.area_3_operational_trace.runtime_40_20_operational_rules_version ??
      RUNTIME_40_20_OPERATIONAL_RULES_VERSION,
  };
}

function buildSelectedContext(input: {
  state: ConsultantControlPanelState;
  selectedRun: RuntimeBudgetByRunItem | null;
  scope: RuntimeViewScopeKey;
  caseHeader: ControlPanelCaseHeader;
}): ControlPanelSelectedContext {
  const { state, selectedRun, scope, caseHeader } = input;
  const activityTitle = selectedRun
    ? `${selectedRun.activityCode} · ${selectedRun.role}`
    : state.area_1_functional_help.current_activity_label;

  return {
    companyName: caseHeader.company_name,
    caseId: caseHeader.case_id,
    caseLabel: caseHeader.case_label,
    physicalUserId: selectedRun?.userId ?? state.filters.user_id,
    physicalUserLabel: selectedRun?.userLabel ?? state.area_1_functional_help.user_label,
    roleRuntimeSessionId:
      selectedRun?.roleRuntimeSessionId ?? state.filters.role_runtime_session_id,
    roleLabel: selectedRun?.role ?? state.area_1_functional_help.role_label,
    roleId: selectedRun?.roleId ?? state.filters.role_id,
    activityId: selectedRun?.activityId ?? state.filters.activity_id,
    activityTitle,
    activityCode: selectedRun?.activityCode ?? null,
    runId: selectedRun?.activityRuntimeRunId ?? state.filters.run_id,
    pmProcessCode: DEFAULT_RUNTIME_PM_PROCESS_CODE,
    catalogVersion: caseHeader.catalog_version,
    runtimeVersion: caseHeader.runtime_version,
    runState: selectedRun?.runState ?? null,
    runStateLabel: runStateToLabel(selectedRun?.runState),
    effectiveScope: scope,
    isAggregateView: scope !== "selected_activity",
  };
}

function buildBaseAndCausalItems(input: {
  state: ConsultantControlPanelState;
  selectedRun: RuntimeBudgetByRunItem | null;
  scope: RuntimeViewScopeKey;
  include: ControlPanelIncludeMode;
}): {
  base_items: BaseResolutionStateById[] | null;
  causal_items: CausalClosureStateById[] | null;
} {
  const { state, selectedRun, scope, include } = input;
  if (include !== "run-detail" || scope !== "selected_activity" || !selectedRun) {
    return { base_items: null, causal_items: null };
  }

  const baseEntry = state.area_3_operational_trace.baseResolutionByRun.find(
    (entry) => entry.activityRuntimeRunId === selectedRun.activityRuntimeRunId,
  );
  const causalEntry = state.area_3_operational_trace.causalClosureByRun.find(
    (entry) => entry.activityRuntimeRunId === selectedRun.activityRuntimeRunId,
  );

  return {
    base_items: baseEntry?.records ?? [],
    causal_items: causalEntry?.records ?? [],
  };
}

function buildMeta(input: {
  state: ConsultantControlPanelState;
  selectedRun: RuntimeBudgetByRunItem | null;
  scope: RuntimeViewScopeKey;
  include: ControlPanelIncludeMode;
}): ControlPanelMeta {
  const { state, selectedRun, scope, include } = input;
  const effective_scope: ControlPanelEffectiveScope = {
    client_company_id:
      state.area_2_client_progress.client_company_id ?? state.filters.client_company_id,
    case_id: state.area_2_client_progress.case_id ?? state.filters.case_id,
    user_id: selectedRun?.userId ?? state.filters.user_id,
    role_id: selectedRun?.roleId ?? state.filters.role_id,
    role_runtime_session_id:
      selectedRun?.roleRuntimeSessionId ?? state.filters.role_runtime_session_id,
    activity_id: selectedRun?.activityId ?? state.filters.activity_id,
    run_id: selectedRun?.activityRuntimeRunId ?? state.filters.run_id,
    runtime_view_scope: scope,
    include,
    pm_process_code: DEFAULT_RUNTIME_PM_PROCESS_CODE,
  };

  return {
    effective_scope,
    capabilities: state.capabilities,
    freshness: {
      as_of: state.generated_at,
      stale: false,
      source: state.fixture?.simulated
        ? "fixture"
        : state.area_3_operational_trace.runtimeBudget4020.runtimeBudgetByRun.length > 0
          ? "bff_read_model"
          : "empty",
    },
  };
}

/**
 * Applies UI Spec v1.1 contract fields without mutating upstream fixture builders.
 * Builds case_header / selected_context / base_items / causal_items / meta from BFF scope.
 */
export function enrichConsultantControlPanelState(
  state: ConsultantControlPanelState,
  options?: {
    include?: ControlPanelIncludeMode | null;
    runtime_view_scope?: RuntimeViewScopeKey | null;
  },
): ConsultantControlPanelState {
  const scope = normalizeRuntimeViewScope(
    options?.runtime_view_scope ??
      state.filters?.runtime_view_scope ??
      "selected_activity",
  );
  const include = normalizeIncludeMode(options?.include ?? "run-detail");

  const users = state.area_2_client_progress.users.map((user) => {
    const role_runtime_sessions = buildRoleSessionsForUser(user, state);
    const functional_separation_state =
      user.functional_separation_state ??
      (role_runtime_sessions.length > 1 ? "multi_confirmed" : "single_confirmed");
    return {
      ...user,
      role_runtime_sessions,
      functional_separation_state,
    };
  });

  const roleSessionOptions = users.flatMap((user) =>
    (user.role_runtime_sessions ?? []).map((session) => ({
      id: session.role_runtime_session_id,
      label: `${user.user_label} · ${session.role_label}`,
    })),
  );

  const allRuns = state.area_3_operational_trace.runtimeBudget4020.runtimeBudgetByRun;
  const selectedRun = resolveSelectedRun(allRuns, {
    ...state.filters,
    runtime_view_scope: scope,
  });
  const scopedRuns = filterRunsForAggregateScope(allRuns, selectedRun, scope);

  const withUsers: ConsultantControlPanelState = {
    ...state,
    request_id: state.request_id || `REQ-CCP-${Date.now()}`,
    contract_version: "1.0",
    capabilities: DEFAULT_CONTROL_PANEL_CAPABILITIES,
    area_2_client_progress: {
      ...state.area_2_client_progress,
      users,
    },
    filters: {
      ...state.filters,
      role_runtime_session_id:
        selectedRun?.roleRuntimeSessionId ??
        state.filters.role_runtime_session_id ??
        null,
      user_id: selectedRun?.userId ?? state.filters.user_id ?? null,
      role_id: selectedRun?.roleId ?? state.filters.role_id ?? null,
      activity_id: selectedRun?.activityId ?? state.filters.activity_id ?? null,
      run_id: selectedRun?.activityRuntimeRunId ?? state.filters.run_id ?? null,
      runtime_view_scope: scope,
      view: state.filters.view ?? null,
    },
    filter_options: {
      ...state.filter_options,
      role_runtime_sessions:
        state.filter_options.role_runtime_sessions &&
        state.filter_options.role_runtime_sessions.length > 0
          ? state.filter_options.role_runtime_sessions
          : roleSessionOptions,
    },
    area_4_downloads: {
      ...state.area_4_downloads,
      downloads: (() => {
        const current = state.area_4_downloads.downloads ?? [];
        const hasCapa = current.some((item) => item.kind.startsWith("capa_"));
        return hasCapa ? current : buildDownloadsWithSupMapping();
      })(),
    },
    critical_alerts: [],
    case_header: state.case_header ?? emptyCaseHeader(),
    selected_context: state.selected_context ?? emptySelectedContext(scope),
    runs: state.runs ?? [],
    base_items: state.base_items ?? null,
    causal_items: state.causal_items ?? null,
    gates: state.gates ?? [],
    meta: state.meta ?? emptyMeta(state, scope, include),
  };

  const case_header = buildCaseHeader(withUsers);
  const selected_context = buildSelectedContext({
    state: withUsers,
    selectedRun,
    scope,
    caseHeader: case_header,
  });
  const { base_items, causal_items } = buildBaseAndCausalItems({
    state: withUsers,
    selectedRun,
    scope,
    include,
  });
  const meta = buildMeta({
    state: withUsers,
    selectedRun,
    scope,
    include,
  });

  const critical_alerts = buildCriticalAlerts(withUsers);
  const enrichedBase: ConsultantControlPanelState = {
    ...withUsers,
    case_header,
    selected_context,
    runs: scope === "selected_activity" ? allRuns : scopedRuns,
    base_items,
    causal_items,
    gates: withUsers.area_3_operational_trace.gate_summaries,
    meta,
    critical_alerts,
  };
  const workspace = buildPClient01WorkspaceVM(enrichedBase);

  return {
    ...enrichedBase,
    p_client_01: {
      process: workspace.process,
      architectural_contract: workspace.architectural_contract,
      context_header: workspace.context_header,
      status_band: workspace.status_band,
      workspace_zones: workspace.workspace_zones,
      experience: workspace.experience,
      pre_runtime: workspace.pre_runtime,
    },
  };
}
