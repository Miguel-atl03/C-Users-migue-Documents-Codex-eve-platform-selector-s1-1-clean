/**
 * View models for P-CLIENT-01 (Vista 1 Experiencia + Vista 5 Pre-runtime).
 * Fields map to Diseno_Vistas_P_CLIENT_01 §4 / Diseño panel Vista 5.
 * Never elevates context to confirmed MMABP evidence.
 */

import type {
  ConsultantControlPanelState,
  CriticalAlert,
  FunctionalSeparationState,
  RoleRuntimeSessionSummary,
  UserProgressRow,
} from "./consultant-control-panel-types";

export type PClient01TabKey = "experience" | "pre-runtime";

export type JourneyStageId =
  | "login_demo"
  | "estado_a"
  | "workmap"
  | "functional_review"
  | "primary_selector"
  | "significado"
  | "bloque_0"
  | "b05_b7"
  | "activity_close"
  | "post_runtime"
  | "engagement_close";

export type JourneyStageUiStatus =
  | "pending"
  | "active"
  | "completed"
  | "blocked"
  | "review"
  | "context_only";

export type EpistemicStatusLabel =
  | "context_only"
  | "captured_user_context"
  | "inferred_from_workmap"
  | "inferred_unconfirmed"
  | "gap"
  | "unavailable"
  | "confirmed";

export type StageDetailField = {
  key: string;
  label: string;
  value: string | null;
};

export type ActivityRefVM = {
  activity_id: string;
  label: string;
  role_runtime_session_id: string | null;
  run_id: string | null;
  role_label?: string | null;
};

export type PhysicalUserVM = {
  user_id: string;
  user_label: string;
};

export type RoleSessionVM = RoleRuntimeSessionSummary & {
  user_id: string;
  user_label: string;
};

export type UserJourneyStageVM = {
  stage_id: JourneyStageId;
  label: string;
  status: JourneyStageUiStatus;
  reason_code: string | null;
  source_mode: string | null;
  epistemic_status: EpistemicStatusLabel;
  source_object: string | null;
  source_state: string | null;
  started_at: string | null;
  completed_at: string | null;
  last_updated_at: string | null;
  actor_type: "user" | "system" | "consultant" | null;
  actor_id: string | null;
  blocking_condition: string | null;
  recommended_next_step: string | null;
  reentry_target: string | null;
  warnings: string[];
  audit_refs: string[];
  /** Stage-specific payload fields from DOCX §4.3 / §4.6. */
  detail_fields: StageDetailField[];
};

export type ExperienceActionVM = {
  action_id:
    | "view_detail"
    | "open_evidence"
    | "request_reentry"
    | "request_clarification"
    | "open_manual_review"
    | "confirm_delivery";
  label: string;
  visible: boolean;
  enabled: boolean;
  reason_code: string | null;
};

export type HierarchyMatrixRowVM = {
  user_id: string;
  user_label: string;
  role_runtime_session_id: string | null;
  role_label: string | null;
  role_id: string | null;
  responsibility_label: string | null;
  activity_id: string | null;
  activity_label: string | null;
  run_id: string | null;
  run_state: string | null;
  functional_separation_state: FunctionalSeparationState | null;
  alert: string | null;
};

export type UserExperienceVM = {
  screen_state: string | null;
  source_mode: string | null;
  saved_work_map_exists: boolean | null;
  saved_with_warnings: boolean | null;
  flattened_activities_count: number | null;
  eligible_count: number | null;
  selected_count: number | null;
  policy_max_primaries: number;
  selected_primary_activities: ActivityRefVM[];
  non_primary_activity_labels: string[];
  current_activity: ActivityRefVM | null;
  continue_enabled: boolean;
  continue_reason_code: string | null;
  physical_user: PhysicalUserVM | null;
  functional_separation_state: FunctionalSeparationState | null;
  role_sessions: RoleSessionVM[];
  diagnostic_sessions: Array<{ session_id: string; label: string; status: string }>;
  stages: UserJourneyStageVM[];
  runtime_runs_active: number;
  runtime_runs_total: number;
  actions: ExperienceActionVM[];
  hierarchy_rows: HierarchyMatrixRowVM[];
  experience_alerts: CriticalAlert[];
};

export type PreRuntimeContextFieldVM = {
  field_id: string;
  label: string;
  value: string | null;
  epistemic_status: EpistemicStatusLabel;
  source: "estado_a" | "workmap" | "primary_selection" | "system" | "unavailable";
  must_not_be_used_for: string[];
};

export type PreRuntimeContextVM = {
  bundle_available: boolean;
  availability_warning: string | null;
  estado_a: {
    functional_role_context: PreRuntimeContextFieldVM;
    decision_level_context: PreRuntimeContextFieldVM;
  };
  workmap: {
    area_context: PreRuntimeContextFieldVM;
    responsibility_context: PreRuntimeContextFieldVM;
    activities_inventory: PreRuntimeContextFieldVM;
    saved_with_warnings: boolean | null;
  };
  selection: {
    primary_activity_context: PreRuntimeContextFieldVM;
    non_primary_activity_context: PreRuntimeContextFieldVM;
    primary_activity_list: string[];
    policy_max_primaries: number;
  };
  handoff: {
    significado_handoff_allowed: boolean | null;
    b0_prefill_allowed: boolean | null;
    context_must_not_be_saved_as_confirmed_evidence: true;
  };
};

/** §1.1 Contrato arquitectónico — declara frontera; no autoriza ni diagnostica. */
export type PClient01ArchitecturalContract = {
  pm_process_id: "P-CLIENT-01";
  name: "Gestionar relación con cliente";
  trigger: "ClientNeed [Expressed] / necesidad diagnóstica expresada";
  governed_object: "ClientEngagement";
  target_state: "ClientEngagement [ClosedWithDeliveredCase]";
  alternate_final_states: [
    "ClientEngagement [Cancelled]",
    "ClientEngagement [NoDecision]",
  ];
  relation_to_p_core_01: string;
  assigned_view_1: "Experiencia usuario";
  assigned_view_5: "Contexto pre-runtime";
  systemic_boundary: string;
  is_runtime_4020: false;
  replaces_p_core_01: false;
};

/** §3.1 Encabezado contextual — Object[State] es el estado principal de negocio. */
export type PClient01ContextHeaderVM = {
  process_label: string;
  read_only: true;
  /** Object[State] de ClientEngagement; null = no capturado (nunca inferido desde WorkMap). */
  engagement_object_state: string | null;
  engagement_object_state_display: string;
  engagement_epistemic_status: EpistemicStatusLabel;
  case_id: string | null;
  case_label: string | null;
  participant_user_id: string | null;
  participant_label: string | null;
  functional_profile_label: string | null;
  role_runtime_session_id: string | null;
  diagnostic_session_id: string | null;
  diagnostic_session_label: string | null;
  active_timer_code: string | null;
  active_timer_remaining_label: string | null;
  timer_epistemic_status: EpistemicStatusLabel;
  freshness_as_of: string;
  freshness_source: string;
};

/** §3 zonas internas del workspace (scaffold; resumen/drawer se llenan en secciones posteriores). */
export type PClient01WorkspaceZoneId =
  | "context_header"
  | "executive_summary"
  | "tabs"
  | "content"
  | "detail_drawer"
  | "status_band";

export type PClient01StatusBandVM = {
  mode: "READ-ONLY";
  request_id: string;
  effective_scope_summary: string;
  freshness_as_of: string;
  freshness_source: string;
  generator_status: string;
  manual_actions_enabled: false | true;
  downloads_enabled: false | true;
  permissions_note: string;
};

export type PClient01WorkspaceVM = {
  process: {
    pm_process_id: "P-CLIENT-01";
    pf_process_id: "PF-CLIENT-01";
    label: string;
    target_object_state: "ClientEngagement [ClosedWithDeliveredCase]";
  };
  architectural_contract: PClient01ArchitecturalContract;
  context_header: PClient01ContextHeaderVM;
  status_band: PClient01StatusBandVM;
  workspace_zones: PClient01WorkspaceZoneId[];
  effective_scope: {
    company_id: string | null;
    case_id: string | null;
    user_id: string | null;
    role_runtime_session_id: string | null;
    activity_id: string | null;
    run_id: string | null;
  };
  experience: UserExperienceVM;
  pre_runtime: PreRuntimeContextVM;
  alerts: CriticalAlert[];
  capabilities: ConsultantControlPanelState["capabilities"];
  freshness: ConsultantControlPanelState["meta"]["freshness"];
  request_id: string;
};

export const P_CLIENT_01_ARCHITECTURAL_CONTRACT: PClient01ArchitecturalContract = {
  pm_process_id: "P-CLIENT-01",
  name: "Gestionar relación con cliente",
  trigger: "ClientNeed [Expressed] / necesidad diagnóstica expresada",
  governed_object: "ClientEngagement",
  target_state: "ClientEngagement [ClosedWithDeliveredCase]",
  alternate_final_states: [
    "ClientEngagement [Cancelled]",
    "ClientEngagement [NoDecision]",
  ],
  relation_to_p_core_01:
    "Aceptación habilita la solicitud diagnóstica; confirmación de entrega/cierre alimenta el cierre del caso.",
  assigned_view_1: "Experiencia usuario",
  assigned_view_5: "Contexto pre-runtime",
  systemic_boundary:
    "P-CLIENT-01 no es Runtime 40+20 ni reemplaza P-CORE-01. Expone contexto, estados, gaps y eventos; nunca infiere autoridad real, diagnóstico o hechos MMABP desde WorkMap no confirmado.",
  is_runtime_4020: false,
  replaces_p_core_01: false,
};

const WORKSPACE_ZONES: PClient01WorkspaceZoneId[] = [
  "context_header",
  "executive_summary",
  "tabs",
  "content",
  "detail_drawer",
  "status_band",
];

const POLICY_MAX_PRIMARIES = 8;

const STAGE_DEFS: Array<{ id: JourneyStageId; label: string }> = [
  { id: "login_demo", label: "Login / Demo" },
  { id: "estado_a", label: "Estado A" },
  { id: "workmap", label: "WorkMap" },
  { id: "functional_review", label: "Revisión funcional" },
  { id: "primary_selector", label: "Selector primario v1.3" },
  { id: "significado", label: "Significado" },
  { id: "bloque_0", label: "Bloque 0" },
  { id: "b05_b7", label: "B0.5–B7" },
  { id: "activity_close", label: "Cierre actividad" },
  { id: "post_runtime", label: "Post-runtime" },
  { id: "engagement_close", label: "Cierre engagement" },
];

function displayOrNull(value: string | null | undefined): string | null {
  if (value == null || value === "") return null;
  return value;
}

function field(
  fieldId: string,
  label: string,
  value: string | null,
  epistemic: EpistemicStatusLabel,
  source: PreRuntimeContextFieldVM["source"],
): PreRuntimeContextFieldVM {
  return {
    field_id: fieldId,
    label,
    value,
    epistemic_status: epistemic,
    source,
    must_not_be_used_for: [
      "confirmed_mmabp_evidence",
      "diagnose_from_context_only",
      "replace_runtime_answer",
    ],
  };
}

function detail(
  key: string,
  label: string,
  value: string | number | boolean | null | undefined,
): StageDetailField {
  if (value === null || value === undefined || value === "") {
    return { key, label, value: null };
  }
  return { key, label, value: String(value) };
}

function resolveSelectedUser(state: ConsultantControlPanelState): UserProgressRow | null {
  const users = state.area_2_client_progress.users;
  const preferred =
    state.filters.user_id ??
    state.selected_context.physicalUserId ??
    state.area_1_functional_help.user_id;
  return users.find((user) => user.user_id === preferred) ?? users[0] ?? null;
}

function buildRoleSessions(state: ConsultantControlPanelState): RoleSessionVM[] {
  const sessions: RoleSessionVM[] = [];
  for (const user of state.area_2_client_progress.users) {
    for (const session of user.role_runtime_sessions ?? []) {
      sessions.push({
        ...session,
        user_id: user.user_id,
        user_label: user.user_label,
      });
    }
  }
  return sessions;
}

function buildPrimaryActivities(
  state: ConsultantControlPanelState,
  selectedUser: UserProgressRow | null,
): ActivityRefVM[] {
  if (!selectedUser?.activities?.length) {
    if (state.selected_context.activityId) {
      return [
        {
          activity_id: state.selected_context.activityId,
          label: state.selected_context.activityTitle ?? state.selected_context.activityId,
          role_runtime_session_id: state.selected_context.roleRuntimeSessionId,
          run_id: state.selected_context.runId,
          role_label: state.selected_context.roleLabel,
        },
      ];
    }
    return [];
  }
  return selectedUser.activities.map((activity) => {
    const run = state.runs.find((item) => item.activityId === activity.id) ?? null;
    return {
      activity_id: activity.id,
      label: activity.label,
      role_runtime_session_id:
        run?.roleRuntimeSessionId ??
        selectedUser.role_runtime_sessions?.[0]?.role_runtime_session_id ??
        null,
      run_id: run?.activityRuntimeRunId ?? null,
      role_label: selectedUser.role_label,
    };
  });
}

function buildHierarchyRows(
  state: ConsultantControlPanelState,
): HierarchyMatrixRowVM[] {
  const rows: HierarchyMatrixRowVM[] = [];
  for (const user of state.area_2_client_progress.users) {
    const sessions = user.role_runtime_sessions ?? [];
    const alert =
      user.functional_separation_state === "mixed_unresolved"
        ? "ROLE_ASSIGNMENT_GAP"
        : null;
    if (sessions.length === 0) {
      const activities = user.activities ?? [];
      if (activities.length === 0) {
        rows.push({
          user_id: user.user_id,
          user_label: user.user_label,
          role_runtime_session_id: null,
          role_label: user.role_label,
          role_id: user.role_id,
          responsibility_label: user.role_label,
          activity_id: null,
          activity_label: null,
          run_id: null,
          run_state: null,
          functional_separation_state: user.functional_separation_state ?? null,
          alert: alert ?? "ROLE_ASSIGNMENT_GAP · sin session",
        });
        continue;
      }
      for (const activity of activities) {
        const run = state.runs.find(
          (item) => item.userId === user.user_id && item.activityId === activity.id,
        );
        rows.push({
          user_id: user.user_id,
          user_label: user.user_label,
          role_runtime_session_id: null,
          role_label: user.role_label,
          role_id: user.role_id,
          responsibility_label: user.role_label,
          activity_id: activity.id,
          activity_label: activity.label,
          run_id: run?.activityRuntimeRunId ?? null,
          run_state: run?.runState ?? null,
          functional_separation_state: user.functional_separation_state ?? null,
          alert,
        });
      }
      continue;
    }

    for (const session of sessions) {
      const sessionActivities =
        (user.activities ?? []).filter((activity) => {
          const run = state.runs.find((item) => item.activityId === activity.id);
          return (
            !run ||
            run.roleRuntimeSessionId === session.role_runtime_session_id ||
            run.roleId === session.role_id
          );
        }) ?? [];
      const activities =
        sessionActivities.length > 0 ? sessionActivities : user.activities ?? [];
      if (activities.length === 0) {
        rows.push({
          user_id: user.user_id,
          user_label: user.user_label,
          role_runtime_session_id: session.role_runtime_session_id,
          role_label: session.role_label,
          role_id: session.role_id,
          responsibility_label: session.role_label,
          activity_id: null,
          activity_label: null,
          run_id: null,
          run_state: null,
          functional_separation_state: user.functional_separation_state ?? null,
          alert,
        });
        continue;
      }
      for (const activity of activities) {
        const run =
          state.runs.find(
            (item) =>
              item.activityId === activity.id &&
              (item.roleRuntimeSessionId === session.role_runtime_session_id ||
                item.userId === user.user_id),
          ) ?? null;
        rows.push({
          user_id: user.user_id,
          user_label: user.user_label,
          role_runtime_session_id: session.role_runtime_session_id,
          role_label: session.role_label,
          role_id: session.role_id,
          responsibility_label: session.role_label,
          activity_id: activity.id,
          activity_label: activity.label,
          run_id: run?.activityRuntimeRunId ?? null,
          run_state: run?.runState ?? null,
          functional_separation_state: user.functional_separation_state ?? null,
          alert,
        });
      }
    }
  }
  return rows;
}

function findSupState(
  state: ConsultantControlPanelState,
  objectName: string,
): string | null {
  const needle = objectName.toLowerCase();
  const card = state.sup_final_objects_backbone?.objects?.find(
    (item) =>
      item.finalObject?.toLowerCase().includes(needle) ||
      item.code?.toLowerCase().includes(needle) ||
      item.capability?.toLowerCase().includes(needle),
  );
  return card ? `${card.state} (${card.status})` : null;
}

function buildStages(state: ConsultantControlPanelState): UserJourneyStageVM[] {
  const help = state.area_1_functional_help;
  const selectedUser = resolveSelectedUser(state);
  const users = state.area_2_client_progress.users;
  const roleGapAlert = state.critical_alerts.find(
    (alert) => alert.alert_id === "ROLE_ASSIGNMENT_GAP",
  );
  const roleGap = Boolean(roleGapAlert);
  const separation = selectedUser?.functional_separation_state ?? null;
  const primaries = buildPrimaryActivities(state, selectedUser);
  const activitiesCount = selectedUser?.activities_count ?? primaries.length;
  const hasUsers = users.length > 0;
  const hasRun = Boolean(state.selected_context.runId) || state.runs.length > 0;
  const blocks = selectedUser?.question_blocks ?? help.question_blocks ?? [];
  const b0Blocks = blocks.filter((block) =>
    /bloque\s*0(?!\.5)|^b0(?!\.5)|bv-0?1/i.test(`${block.blockId} ${block.title}`),
  );
  const deepBlocks = blocks.filter((block) =>
    /0\.5|bloque\s*[1-7]|b[1-7]|bv-0?[2-9]/i.test(`${block.blockId} ${block.title}`),
  );
  const hasBlockers =
    (selectedUser?.blockers.length ?? 0) > 0 || help.errors_or_blocks.length > 0;
  const readyState = state.area_3_operational_trace.readiness?.state ?? null;
  const baseGate = state.area_3_operational_trace.base_resolution_gate;
  const causalGate = state.area_3_operational_trace.causal_closure_gate;
  const selectedRunId = state.selected_context.runId ?? state.filters.run_id;
  const runBase = selectedRunId
    ? state.area_3_operational_trace.baseResolutionByRun.find(
        (entry) => entry.activityRuntimeRunId === selectedRunId,
      )
    : null;
  const runCausal = selectedRunId
    ? state.area_3_operational_trace.causalClosureByRun.find(
        (entry) => entry.activityRuntimeRunId === selectedRunId,
      )
    : null;
  const scr = findSupState(state, "SceneCanonical") ?? findSupState(state, "SCR");
  const evidence = findSupState(state, "EvidenceBundle");
  const mdsb = findSupState(state, "mmabp") ?? findSupState(state, "MDSB");
  const sourceMode = state.fixture?.simulated ? "fixture" : state.meta.freshness.source;
  const nowRef = help.last_interaction_at ?? state.generated_at;

  const currentPrimaryIndex = primaries.findIndex(
    (item) => item.activity_id === (help.current_activity_id ?? state.selected_context.activityId),
  );

  return STAGE_DEFS.map((def) => {
    const base: Omit<UserJourneyStageVM, "status" | "reason_code" | "epistemic_status" | "blocking_condition" | "recommended_next_step" | "reentry_target" | "detail_fields" | "warnings" | "source_object" | "source_state"> = {
      stage_id: def.id,
      label: def.label,
      source_mode: sourceMode,
      started_at: null,
      completed_at: null,
      last_updated_at: nowRef,
      actor_type: "user",
      actor_id: selectedUser?.user_id ?? help.user_id,
      audit_refs: [state.request_id, ...(selectedRunId ? [selectedRunId] : [])],
    };

    switch (def.id) {
      case "login_demo":
        return {
          ...base,
          status: hasUsers ? "completed" : "pending",
          reason_code: hasUsers ? "SESSION_SCOPED" : "NO_PARTICIPANTS",
          epistemic_status: hasUsers ? "captured_user_context" : "unavailable",
          source_object: "ConsultantControlPanelState",
          source_state: state.access.surface,
          blocking_condition: hasUsers ? null : "Sin participantes en alcance",
          recommended_next_step: hasUsers ? "Continuar a Estado A / WorkMap" : null,
          reentry_target: null,
          warnings: [],
          detail_fields: [
            detail("session_id", "session_id", state.request_id),
            detail("actor", "Actor", selectedUser?.user_label ?? help.user_label),
            detail("sourceMode", "sourceMode", sourceMode),
            detail("reset_status", "reset_status", hasUsers ? "scoped" : "empty"),
          ],
        };
      case "estado_a":
        return {
          ...base,
          status: hasUsers ? "context_only" : "pending",
          reason_code: "CONTEXT_ONLY",
          epistemic_status: "context_only",
          source_object: "EstadoAContext",
          source_state: "context_only",
          blocking_condition: null,
          recommended_next_step: "Abrir Vista 5 · Contexto pre-runtime",
          reentry_target: null,
          warnings: ["Contexto gobernado; no autoridad real ni diagnóstico."],
          detail_fields: [
            detail(
              "functional_role_context",
              "functional_role_context",
              help.role_label ?? selectedUser?.role_label,
            ),
            detail(
              "decision_level_context",
              "decision_level_context",
              help.role_purpose,
            ),
          ],
        };
      case "workmap": {
        const companyActivities = users.reduce(
          (sum, user) => sum + (user.activities_count ?? 0),
          0,
        );
        const savedWithWarnings =
          roleGap || hasBlockers || (state.area_3_operational_trace.readiness_gaps_count ?? 0) > 0;
        const status: JourneyStageUiStatus =
          activitiesCount > 0
            ? savedWithWarnings
              ? "review"
              : "completed"
            : hasUsers
              ? "active"
              : "pending";
        return {
          ...base,
          status,
          reason_code:
            activitiesCount > 0
              ? savedWithWarnings
                ? "WORKMAP_SAVED_WITH_WARNINGS"
                : "WORKMAP_SAVED"
              : "WORKMAP_EMPTY_OR_UNSCOPED",
          epistemic_status: activitiesCount > 0 ? "inferred_from_workmap" : "unavailable",
          source_object: "WorkMapSnapshot",
          source_state: activitiesCount > 0 ? (savedWithWarnings ? "saved_with_warnings" : "saved") : "draft",
          blocking_condition: activitiesCount > 0 ? null : "Sin actividades en alcance",
          recommended_next_step: activitiesCount > 0 ? "Revisión funcional" : "Completar WorkMap",
          reentry_target: activitiesCount > 0 ? null : "WorkMap",
          warnings: savedWithWarnings ? ["WorkMap con advertencias / gaps visibles"] : [],
          detail_fields: [
            detail("areas", "areas", state.area_2_client_progress.associated_roles.map((r) => r.role_label).join(", ") || null),
            detail("responsibilities", "responsibilities", selectedUser?.role_label),
            detail("activities_user", "activities (usuario)", activitiesCount),
            detail("activities_case", "activities (caso / WorkMap flattened)", companyActivities),
            detail("savedWithWarnings", "savedWithWarnings", savedWithWarnings),
          ],
        };
      }
      case "functional_review": {
        if (roleGap || separation === "mixed_unresolved") {
          return {
            ...base,
            status: "review",
            reason_code: "ROLE_ASSIGNMENT_GAP",
            epistemic_status: "gap",
            source_object: "RoleRuntimeSession",
            source_state: separation ?? "mixed_unresolved",
            blocking_condition: roleGapAlert?.message ?? "Asignación funcional sin resolver",
            recommended_next_step: "Separar/reasignar perfil (acción futura auditada)",
            reentry_target: roleGapAlert?.reentry_target ?? "WorkMap functional assignment review",
            warnings: ["user_id ≠ role_runtime_session"],
            detail_fields: [
              detail("functional_separation_state", "functional_separation_state", separation),
              detail(
                "role_sessions",
                "role_sessions",
                (selectedUser?.role_runtime_sessions ?? [])
                  .map((s) => s.role_runtime_session_id)
                  .join(", ") || "—",
              ),
              detail("ROLE_ASSIGNMENT_GAP", "ROLE_ASSIGNMENT_GAP", roleGapAlert?.message),
            ],
          };
        }
        if (separation === "reentry_required" || separation === "manual_review_required") {
          return {
            ...base,
            status: "blocked",
            reason_code: separation.toUpperCase(),
            epistemic_status: "gap",
            source_object: "RoleRuntimeSession",
            source_state: separation,
            blocking_condition: separation,
            recommended_next_step: "Revisión gobernada pendiente",
            reentry_target: "Estado A / WorkMap",
            warnings: [],
            detail_fields: [
              detail("functional_separation_state", "functional_separation_state", separation),
              detail(
                "role_sessions",
                "role_sessions count",
                selectedUser?.role_runtime_sessions?.length ?? 0,
              ),
            ],
          };
        }
        return {
          ...base,
          status: separation ? "completed" : hasUsers ? "active" : "pending",
          reason_code: separation ?? "SEPARATION_UNKNOWN",
          epistemic_status: "captured_user_context",
          source_object: "RoleRuntimeSession",
          source_state: separation,
          blocking_condition: null,
          recommended_next_step: "Selector primario v1.3",
          reentry_target: null,
          warnings: [],
          detail_fields: [
            detail("functional_separation_state", "functional_separation_state", separation),
            detail(
              "assignments",
              "assignments",
              `${selectedUser?.role_runtime_sessions?.length ?? 0} RRS · ${activitiesCount} actividades`,
            ),
          ],
        };
      }
      case "primary_selector":
        return {
          ...base,
          status: primaries.length > 0 ? "completed" : "pending",
          reason_code: primaries.length > 0 ? "PRIMARIES_IN_SCOPE" : "NO_PRIMARIES",
          epistemic_status: primaries.length > 0 ? "inferred_from_workmap" : "unavailable",
          source_object: "PrimaryActivitySelection",
          source_state: primaries.length > 0 ? "selected" : "pending",
          blocking_condition: primaries.length > 0 ? null : "Sin primarias en alcance",
          recommended_next_step: primaries.length > 0 ? "Significado" : null,
          reentry_target: null,
          warnings:
            primaries.length >= POLICY_MAX_PRIMARIES
              ? ["Máximo de política 8 alcanzado; no llenar cupos artificialmente."]
              : [],
          detail_fields: [
            detail("eligibleCount", "eligibleCount", activitiesCount),
            detail("selectedCount", "selectedCount", primaries.length),
            detail(
              "selectedPrimaryActivities",
              "selectedPrimaryActivities",
              primaries.map((p) => p.label).join(" · ") || null,
            ),
            detail(
              "nonPrimaryContextActivities",
              "nonPrimaryContextActivities",
              "No disponibles como lista separada en el read model actual (fixture proyecta primarias asignadas).",
            ),
          ],
        };
      case "significado":
        return {
          ...base,
          status: hasRun || help.current_activity_id ? "active" : "pending",
          reason_code: hasRun ? "RUNTIME_RUN_PRESENT" : "SIGNIFICADO_NOT_STARTED",
          epistemic_status: "context_only",
          source_object: "SignificadoHandoff",
          source_state: help.block_status,
          blocking_condition: null,
          recommended_next_step: "Bloque 0 / runtime profundo",
          reentry_target: null,
          warnings: ["Significado consume selección; no selecciona."],
          detail_fields: [
            detail(
              "currentActivityIndex",
              "currentActivityIndex",
              currentPrimaryIndex >= 0 ? currentPrimaryIndex + 1 : null,
            ),
            detail(
              "currentActivityTitle",
              "currentActivityTitle",
              help.current_activity_label ?? state.selected_context.activityTitle,
            ),
            detail(
              "preRuntimeContextBundle",
              "preRuntimeContextBundle",
              state.p_client_01?.pre_runtime ? "proyectado en Vista 5" : "proyección BFF",
            ),
          ],
        };
      case "bloque_0": {
        const b0Status = b0Blocks[0]?.status ?? null;
        const status: JourneyStageUiStatus =
          b0Status === "blocked" || b0Status === "pending_review"
            ? "blocked"
            : b0Status === "completed"
              ? "completed"
              : b0Status === "in_progress" || hasRun
                ? "active"
                : "pending";
        return {
          ...base,
          status,
          reason_code: b0Status ? `B0_${b0Status.toUpperCase()}` : hasRun ? "B0_SCOPED" : "B0_PENDING",
          epistemic_status: "context_only",
          source_object: "QuestionBlock / Prefill",
          source_state: b0Status,
          blocking_condition: b0Blocks[0]?.errorsOrBlockers?.[0] ?? null,
          recommended_next_step: "B0.5–B7",
          reentry_target: status === "blocked" ? "Bloque 0" : null,
          warnings: ["Prefill no confirmado no es evidencia."],
          last_updated_at: b0Blocks[0]?.lastInteractionAt ?? nowRef,
          detail_fields: [
            detail("B0_block", "Bloque ancla", b0Blocks[0] ? `${b0Blocks[0].blockId} · ${b0Blocks[0].title}` : null),
            detail("B0_status", "status", b0Status),
            detail(
              "pending_questions",
              "pending_questions",
              (b0Blocks[0]?.pendingQuestions ?? help.pending_questions).join(" · ") || null,
            ),
            detail(
              "incomplete_answers",
              "incomplete_answers",
              (b0Blocks[0]?.incompleteAnswers ?? help.incomplete_answers).join(" · ") || null,
            ),
          ],
        };
      }
      case "b05_b7": {
        const status: JourneyStageUiStatus = hasBlockers
          ? "blocked"
          : readyState?.includes("ready")
            ? "completed"
            : deepBlocks.length || hasRun
              ? "active"
              : "pending";
        return {
          ...base,
          status,
          reason_code: hasBlockers ? "RUNTIME_BLOCKERS" : readyState ?? "RUNTIME_DEEP",
          epistemic_status: "context_only",
          source_object: "BaseResolutionGate + CausalClosureGate",
          source_state: readyState,
          blocking_condition:
            selectedUser?.blockers[0] ?? help.errors_or_blocks[0] ?? null,
          recommended_next_step: hasBlockers
            ? "Revisar gaps / preview reentry"
            : "Cierre de actividad por readiness",
          reentry_target: hasBlockers ? "Runtime gate / bloque" : null,
          warnings: state.area_3_operational_trace.readiness?.flags ?? [],
          detail_fields: [
            detail(
              "base_summary",
              "Base 40",
              runBase
                ? `${runBase.resolved_count}/${runBase.total_required}`
                : `${baseGate.evaluated_or_resolved_or_explicitly_blocked}/${baseGate.total_required}`,
            ),
            detail(
              "causal_summary",
              "Causales 20",
              runCausal
                ? `${runCausal.triggered_required_count}/${runCausal.total_required_evaluations}`
                : `${causalGate.triggered_required}/${causalGate.total_required_evaluations}`,
            ),
            detail(
              "gaps",
              "gaps",
              state.area_3_operational_trace.readiness_gaps_count,
            ),
            detail(
              "deep_blocks",
              "bloques profundos",
              deepBlocks.map((b) => `${b.blockId}:${b.status}`).join(" · ") || null,
            ),
          ],
        };
      }
      case "activity_close":
        return {
          ...base,
          status: readyState?.toLowerCase().includes("ready")
            ? readyState.includes("flag")
              ? "review"
              : "completed"
            : hasBlockers
              ? "blocked"
              : "pending",
          reason_code: readyState ?? "READINESS_UNKNOWN",
          epistemic_status: "context_only",
          source_object: "activity_runtime_readiness",
          source_state: readyState,
          blocking_condition: hasBlockers ? "Readiness incompleto" : null,
          recommended_next_step: "Post-runtime / objetos SUP",
          reentry_target: hasBlockers ? "Runtime readiness" : null,
          warnings: [],
          detail_fields: [
            detail("activity_runtime_readiness", "activity_runtime_readiness", readyState),
            detail(
              "reentry_target",
              "reentry_target",
              hasBlockers ? "Runtime gate / bloque" : null,
            ),
            detail(
              "current_activity",
              "actividad",
              help.current_activity_label ?? state.selected_context.activityTitle,
            ),
          ],
        };
      case "post_runtime":
        return {
          ...base,
          status: scr || evidence || mdsb ? "active" : "pending",
          reason_code: scr || evidence || mdsb ? "SUP_OBJECTS_VISIBLE" : "POST_RUNTIME_PENDING",
          epistemic_status: "context_only",
          source_object: "SupFinalObjectsBackbone",
          source_state: null,
          blocking_condition: null,
          recommended_next_step: "Observar objetos; no exportar productivo",
          reentry_target: null,
          warnings: ["Capa 1.0 no diagnostica."],
          detail_fields: [
            detail("SCR_state", "SCR state", scr),
            detail("EvidenceBundle_state", "EvidenceBundle state", evidence),
            detail("MDSB_state", "MDSB state", mdsb),
          ],
        };
      case "engagement_close":
        return {
          ...base,
          status: "pending",
          reason_code: "DELIVERY_CONFIRMATION_NOT_ENABLED",
          epistemic_status: "unavailable",
          source_object: "ClientEngagement",
          source_state: null,
          actor_type: "consultant",
          actor_id: null,
          blocking_condition:
            "Confirmación de cierre requiere capability + endpoint auditado",
          recommended_next_step:
            "Mantener DeliveryPending hasta confirmación gobernada (Vista 6 OLC fuera de este alcance)",
          reentry_target: null,
          warnings: [
            "Diagnóstico entregado no cierra por sí solo.",
            "No inventar ClosedWithDeliveredCase desde el front.",
          ],
          detail_fields: [
            detail("ClientEngagement_current_state", "current_state", null),
            detail("confirmation_status", "confirmation_status", "not_enabled_v1"),
            detail(
              "case_status",
              "case_status (observacional)",
              state.area_2_client_progress.case_status,
            ),
          ],
        };
      default:
        return {
          ...base,
          status: "pending",
          reason_code: null,
          epistemic_status: "unavailable",
          source_object: null,
          source_state: null,
          blocking_condition: null,
          recommended_next_step: null,
          reentry_target: null,
          warnings: [],
          detail_fields: [],
        };
    }
  });
}

function buildActions(
  state: ConsultantControlPanelState,
  selectedStage: UserJourneyStageVM | undefined,
): ExperienceActionVM[] {
  const deliveryPending = false;
  return [
    {
      action_id: "view_detail",
      label: "Ver detalle",
      visible: true,
      enabled: true,
      reason_code: null,
    },
    {
      action_id: "open_evidence",
      label: "Abrir evidencia relacionada",
      visible: true,
      enabled: true,
      reason_code: null,
    },
    {
      action_id: "request_reentry",
      label: "Solicitar reentry",
      visible: true,
      enabled: false,
      reason_code:
        state.capabilities.manual_actions.reason_code ?? "AUDITED_ENDPOINT_NOT_AVAILABLE",
    },
    {
      action_id: "request_clarification",
      label: "Solicitar aclaración",
      visible: true,
      enabled: false,
      reason_code: "AUDITED_ENDPOINT_NOT_AVAILABLE",
    },
    {
      action_id: "open_manual_review",
      label: "Abrir manual review",
      visible: true,
      enabled: false,
      reason_code: "AUDITED_ENDPOINT_NOT_AVAILABLE",
    },
    {
      action_id: "confirm_delivery",
      label: "Confirmar entrega/cierre",
      visible: deliveryPending || selectedStage?.stage_id === "engagement_close",
      enabled: false,
      reason_code: "AUDITED_ENDPOINT_NOT_AVAILABLE",
    },
  ];
}

export function buildUserExperienceVM(state: ConsultantControlPanelState): UserExperienceVM {
  const help = state.area_1_functional_help;
  const selectedUser = resolveSelectedUser(state);
  const users = state.area_2_client_progress.users;
  const primaries = buildPrimaryActivities(state, selectedUser);
  const companyFlattened = users.reduce(
    (sum, user) => sum + (user.activities_count ?? 0),
    0,
  );
  const roleGap = state.critical_alerts.some(
    (alert) => alert.alert_id === "ROLE_ASSIGNMENT_GAP",
  );
  const hasBlockers =
    (selectedUser?.blockers.length ?? 0) > 0 || help.errors_or_blocks.length > 0;
  const continueEnabled = Boolean(selectedUser) && !roleGap && !hasBlockers;
  const activeRuns = state.runs.filter((run) =>
    String(run.runState ?? "").toLowerCase().includes("progress"),
  ).length;
  const stages = buildStages(state);
  const experienceAlerts = state.critical_alerts.filter(
    (alert) =>
      alert.alert_id === "ROLE_ASSIGNMENT_GAP" ||
      alert.severity === "error" ||
      alert.severity === "review" ||
      /timer|workmap|reentry|manual/i.test(`${alert.alert_id} ${alert.title}`),
  );

  return {
    screen_state: help.block_status ?? state.selected_context.runState ?? state.area_2_client_progress.case_status,
    source_mode: state.fixture?.simulated ? "fixture" : state.meta.freshness.source,
    saved_work_map_exists:
      companyFlattened > 0 ? true : users.length > 0 ? false : null,
    saved_with_warnings:
      roleGap || hasBlockers || (state.area_3_operational_trace.readiness_gaps_count ?? 0) > 0
        ? true
        : companyFlattened > 0
          ? false
          : null,
    flattened_activities_count: users.length > 0 ? companyFlattened : null,
    eligible_count: selectedUser ? selectedUser.activities_count : companyFlattened || null,
    selected_count: users.length > 0 ? primaries.length : null,
    policy_max_primaries: POLICY_MAX_PRIMARIES,
    selected_primary_activities: primaries,
    non_primary_activity_labels: [],
    current_activity: help.current_activity_id
      ? {
          activity_id: help.current_activity_id,
          label: help.current_activity_label ?? help.current_activity_id,
          role_runtime_session_id: state.selected_context.roleRuntimeSessionId,
          run_id: state.selected_context.runId,
          role_label: help.role_label ?? state.selected_context.roleLabel,
        }
      : primaries[0] ?? null,
    continue_enabled: continueEnabled,
    continue_reason_code: continueEnabled
      ? null
      : roleGap
        ? "ROLE_ASSIGNMENT_GAP"
        : hasBlockers
          ? "RUNTIME_BLOCKERS"
          : "NO_PARTICIPANT_IN_SCOPE",
    physical_user: selectedUser
      ? { user_id: selectedUser.user_id, user_label: selectedUser.user_label }
      : help.user_id
        ? { user_id: help.user_id, user_label: help.user_label ?? help.user_id }
        : null,
    functional_separation_state: selectedUser?.functional_separation_state ?? null,
    role_sessions: buildRoleSessions(state),
    diagnostic_sessions: [],
    stages,
    runtime_runs_active: activeRuns || (state.selected_context.runId ? 1 : 0),
    runtime_runs_total: state.runs.length,
    actions: buildActions(state, stages.find((s) => s.status === "active")),
    hierarchy_rows: buildHierarchyRows(state),
    experience_alerts: experienceAlerts.length ? experienceAlerts : state.critical_alerts,
  };
}

export function buildPreRuntimeContextVM(
  state: ConsultantControlPanelState,
): PreRuntimeContextVM {
  const help = state.area_1_functional_help;
  const selectedUser = resolveSelectedUser(state);
  const roles = state.area_2_client_progress.associated_roles;
  const roleLabel =
    displayOrNull(help.role_label) ??
    displayOrNull(selectedUser?.role_label) ??
    displayOrNull(roles[0]?.role_label);
  const activities = selectedUser?.activities ?? [];
  const primaryLabels = activities.slice(0, POLICY_MAX_PRIMARIES).map((item) => item.label);
  const hasAnyContext = Boolean(roleLabel || activities.length || state.area_2_client_progress.users.length);

  return {
    bundle_available: hasAnyContext,
    availability_warning: !hasAnyContext
      ? "Sin PreRuntimeContextBundle persistido; proyección read-only desde alcance BFF (no evidencia confirmada)."
      : state.fixture?.simulated
        ? "Proyección desde fixture Ámbar — epistemic_status=context_only / inferred; no evidencia MMABP confirmada."
        : "Proyección consultor desde read model; contexto ≠ evidencia confirmada.",
    estado_a: {
      functional_role_context: field(
        "functional_role_context",
        "Lugar / rol funcional (Estado A)",
        roleLabel,
        roleLabel ? "context_only" : "unavailable",
        roleLabel ? "estado_a" : "unavailable",
      ),
      decision_level_context: field(
        "decision_level_context",
        "Cercanía a decisiones",
        displayOrNull(help.role_purpose),
        help.role_purpose ? "context_only" : "unavailable",
        help.role_purpose ? "estado_a" : "unavailable",
      ),
    },
    workmap: {
      area_context: field(
        "workmap_area_context",
        "Área WorkMap",
        roleLabel,
        roleLabel ? "inferred_from_workmap" : "unavailable",
        roleLabel ? "workmap" : "unavailable",
      ),
      responsibility_context: field(
        "responsibility_context",
        "Responsabilidades",
        roles.length
          ? roles.map((role) => role.role_label).join(", ")
          : displayOrNull(selectedUser?.role_label),
        roles.length || selectedUser?.role_label ? "inferred_from_workmap" : "unavailable",
        roles.length || selectedUser?.role_label ? "workmap" : "unavailable",
      ),
      activities_inventory: field(
        "activities_inventory",
        "Inventario de actividades",
        activities.length
          ? activities.map((item) => item.label).join(" · ")
          : selectedUser
            ? `${selectedUser.activities_count} en conteo`
            : null,
        activities.length || (selectedUser?.activities_count ?? 0) > 0
          ? "inferred_from_workmap"
          : "unavailable",
        activities.length || (selectedUser?.activities_count ?? 0) > 0
          ? "workmap"
          : "unavailable",
      ),
      saved_with_warnings:
        state.critical_alerts.some((alert) => alert.alert_id === "ROLE_ASSIGNMENT_GAP") ||
        (selectedUser?.blockers.length ?? 0) > 0
          ? true
          : activities.length > 0
            ? false
            : null,
    },
    selection: {
      primary_activity_context: field(
        "primary_activity_context",
        "Actividades primarias",
        primaryLabels.length ? `${primaryLabels.length} / ${POLICY_MAX_PRIMARIES}` : null,
        primaryLabels.length ? "inferred_from_workmap" : "unavailable",
        primaryLabels.length ? "primary_selection" : "unavailable",
      ),
      non_primary_activity_context: field(
        "non_primary_activity_context",
        "Actividades no primarias (contexto)",
        "Lista no-primaria no materializada en el read model del panel; el fixture entrega primarias asignadas.",
        "context_only",
        "workmap",
      ),
      primary_activity_list: primaryLabels,
      policy_max_primaries: POLICY_MAX_PRIMARIES,
    },
    handoff: {
      significado_handoff_allowed: primaryLabels.length > 0 ? true : null,
      b0_prefill_allowed: primaryLabels.length > 0 ? true : null,
      context_must_not_be_saved_as_confirmed_evidence: true,
    },
  };
}

function buildPClient01ContextHeaderVM(
  state: ConsultantControlPanelState,
  experience: UserExperienceVM,
  effectiveScope: PClient01WorkspaceVM["effective_scope"],
): PClient01ContextHeaderVM {
  const ctx = state.selected_context;
  const caseId =
    effectiveScope.case_id ??
    displayOrNull(state.area_2_client_progress.case_id) ??
    displayOrNull(ctx.caseId);
  const caseLabel =
    displayOrNull(state.area_2_client_progress.case_label) ??
    displayOrNull(ctx.caseLabel);
  const participantId =
    effectiveScope.user_id ??
    displayOrNull(ctx.physicalUserId) ??
    experience.physical_user?.user_id ??
    null;
  const participantLabel =
    experience.physical_user?.user_label ??
    displayOrNull(ctx.physicalUserLabel) ??
    participantId;
  const roleSessionId =
    effectiveScope.role_runtime_session_id ??
    displayOrNull(ctx.roleRuntimeSessionId) ??
    experience.role_sessions[0]?.role_runtime_session_id ??
    null;
  const functionalProfile =
    displayOrNull(ctx.roleLabel) ??
    experience.role_sessions.find((s) => s.role_runtime_session_id === roleSessionId)
      ?.role_label ??
    experience.role_sessions[0]?.role_label ??
    null;
  const diagnosticSession = experience.diagnostic_sessions[0] ?? null;

  // Object[State] must not be invented from WorkMap, UX stages, or case diagnóstico status.
  const engagementObjectState: string | null = null;

  return {
    process_label: "P-CLIENT-01 · Gestionar relación con cliente",
    read_only: true,
    engagement_object_state: engagementObjectState,
    engagement_object_state_display: engagementObjectState
      ? `ClientEngagement [${engagementObjectState}]`
      : "ClientEngagement [estado no capturado]",
    engagement_epistemic_status: engagementObjectState ? "confirmed" : "unavailable",
    case_id: caseId,
    case_label: caseLabel,
    participant_user_id: participantId,
    participant_label: participantLabel,
    functional_profile_label: functionalProfile,
    role_runtime_session_id: roleSessionId,
    diagnostic_session_id: diagnosticSession?.session_id ?? null,
    diagnostic_session_label: diagnosticSession?.label ?? null,
    active_timer_code: null,
    active_timer_remaining_label: null,
    timer_epistemic_status: "unavailable",
    freshness_as_of: state.meta.freshness.as_of,
    freshness_source: state.meta.freshness.source,
  };
}

function buildPClient01StatusBandVM(
  state: ConsultantControlPanelState,
  effectiveScope: PClient01WorkspaceVM["effective_scope"],
): PClient01StatusBandVM {
  const scopeParts = [
    effectiveScope.case_id ? `case_id=${effectiveScope.case_id}` : null,
    effectiveScope.user_id ? `user_id=${effectiveScope.user_id}` : null,
    effectiveScope.role_runtime_session_id
      ? `role_runtime_session_id=${effectiveScope.role_runtime_session_id}`
      : null,
  ].filter(Boolean);

  return {
    mode: "READ-ONLY",
    request_id: state.request_id,
    effective_scope_summary: scopeParts.length
      ? scopeParts.join(" → ")
      : "effective_scope parcial",
    freshness_as_of: state.meta.freshness.as_of,
    freshness_source: state.meta.freshness.source,
    generator_status: state.capabilities.downloads.enabled
      ? "generator_available"
      : "generator_unavailable",
    manual_actions_enabled: state.capabilities.manual_actions.enabled,
    downloads_enabled: state.capabilities.downloads.enabled,
    permissions_note:
      "Acciones futuras visibles y deshabilitadas si capability.enabled = false",
  };
}

export function buildPClient01WorkspaceVM(
  state: ConsultantControlPanelState,
): PClient01WorkspaceVM {
  const experience = buildUserExperienceVM(state);
  const effective_scope = {
    company_id:
      state.meta.effective_scope.client_company_id ??
      state.area_2_client_progress.client_company_id,
    case_id: state.meta.effective_scope.case_id ?? state.area_2_client_progress.case_id,
    user_id: state.meta.effective_scope.user_id ?? state.filters.user_id,
    role_runtime_session_id:
      state.meta.effective_scope.role_runtime_session_id ??
      state.filters.role_runtime_session_id,
    activity_id: state.meta.effective_scope.activity_id ?? state.filters.activity_id,
    run_id: state.meta.effective_scope.run_id ?? state.filters.run_id,
  };

  return {
    process: {
      pm_process_id: "P-CLIENT-01",
      pf_process_id: "PF-CLIENT-01",
      label: "Gestionar relación con cliente",
      target_object_state: "ClientEngagement [ClosedWithDeliveredCase]",
    },
    architectural_contract: P_CLIENT_01_ARCHITECTURAL_CONTRACT,
    context_header: buildPClient01ContextHeaderVM(state, experience, effective_scope),
    status_band: buildPClient01StatusBandVM(state, effective_scope),
    workspace_zones: WORKSPACE_ZONES,
    effective_scope,
    experience,
    pre_runtime: buildPreRuntimeContextVM(state),
    alerts: state.critical_alerts,
    capabilities: state.capabilities,
    freshness: state.meta.freshness,
    request_id: state.request_id,
  };
}

export function separationLabel(state: FunctionalSeparationState | null): string {
  switch (state) {
    case "single_confirmed":
      return "Perfil único";
    case "multi_confirmed":
      return "Multirol";
    case "mixed_unresolved":
      return "Mixto sin resolver";
    case "system_suggested_pending_confirmation":
      return "Sugerido · pendiente";
    case "reentry_required":
      return "Reentry requerida";
    case "manual_review_required":
      return "Revisión manual";
    default:
      return "—";
  }
}
