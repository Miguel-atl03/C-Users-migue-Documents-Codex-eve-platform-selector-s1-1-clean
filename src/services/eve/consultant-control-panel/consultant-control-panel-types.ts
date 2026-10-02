/**
 * Frontend/BFF contract for Panel de Control del Consultor Experto EVE.
 * Read-mode first; manual actions require audited endpoints.
 */

export type ConsultantControlPanelRole =
  | "consultant"
  | "operator"
  | "supervisor"
  | "auditor";

export type ControlPanelViewKey =
  | "cases"
  | "functional-help"
  | "monitoring"
  | "runtime"
  | "trace"
  | "gates"
  | "downloads"
  | "audit";

/**
 * Explicit view mode for Runtime 40/20 grids.
 * Default is selected_activity (one activity_runtime_run).
 * Aggregate modes never reuse Base/Causal grids as a single run.
 */
export type RuntimeViewScopeKey =
  | "selected_activity"
  | "role_activities"
  | "user_all_roles"
  | "case_all";

export type ControlPanelIncludeMode = "summary" | "run-detail";

export type ControlPanelFilterScope = {
  client_company_id: string | null;
  case_id: string | null;
  user_id: string | null;
  role_id: string | null;
  /** Distinct from user_id — functional runtime profile within the same login. */
  role_runtime_session_id: string | null;
  activity_id: string | null;
  run_id: string | null;
  event_type: string | null;
  gate_code: string | null;
  status: string | null;
  view: ControlPanelViewKey | null;
  /** Authoritative Runtime 40/20 view scope (BFF-resolved; UI must not invent). */
  runtime_view_scope: RuntimeViewScopeKey | null;
};

/** Authoritative scope returned by BFF — UI must render from this, not query params. */
export type ControlPanelEffectiveScope = {
  client_company_id: string | null;
  case_id: string | null;
  user_id: string | null;
  role_id: string | null;
  role_runtime_session_id: string | null;
  activity_id: string | null;
  run_id: string | null;
  runtime_view_scope: RuntimeViewScopeKey;
  include: ControlPanelIncludeMode;
  pm_process_code: string | null;
};

export type ControlPanelCaseHeader = {
  company_name: string | null;
  case_id: string | null;
  case_label: string | null;
  case_status: string | null;
  catalog_version: string | null;
  runtime_version: string | null;
};

/**
 * Selected run context for Runtime 40 Base Grid / Causal 20.
 * Always keyed to one activity_runtime_run when runtime_view_scope === selected_activity.
 */
export type ControlPanelSelectedContext = {
  companyName: string | null;
  caseId: string | null;
  caseLabel: string | null;
  physicalUserId: string | null;
  physicalUserLabel: string | null;
  roleRuntimeSessionId: string | null;
  roleLabel: string | null;
  roleId: string | null;
  activityId: string | null;
  activityTitle: string | null;
  activityCode: string | null;
  runId: string | null;
  pmProcessCode: string | null;
  catalogVersion: string | null;
  runtimeVersion: string | null;
  runState: string | null;
  runStateLabel: string | null;
  effectiveScope: RuntimeViewScopeKey;
  isAggregateView: boolean;
};

export type ControlPanelFreshness = {
  as_of: string;
  stale: false;
  source: "fixture" | "bff_read_model" | "empty";
};

export type ControlPanelMeta = {
  effective_scope: ControlPanelEffectiveScope;
  capabilities: ControlPanelCapabilities;
  freshness: ControlPanelFreshness;
};

export type ControlPanelCapabilities = {
  read: true;
  manual_actions: {
    enabled: false;
    reason_code: "AUDITED_ENDPOINT_NOT_AVAILABLE";
    allowed_actions: [];
  };
  downloads: {
    enabled: false;
    reason_code: "AUTHORIZED_GENERATOR_NOT_AVAILABLE";
  };
};

export type FunctionalSeparationState =
  | "single_confirmed"
  | "multi_confirmed"
  | "system_suggested_pending_confirmation"
  | "mixed_unresolved"
  | "reentry_required"
  | "manual_review_required";

export type RoleRuntimeSessionSummary = {
  role_runtime_session_id: string;
  role_id: string;
  role_label: string;
  state: string;
  activity_count: number;
  run_count: number;
};

export type CriticalAlert = {
  alert_id: string;
  severity: "warning" | "review" | "error";
  title: string;
  message: string;
  affected_scope?: {
    case_id?: string | null;
    user_id?: string | null;
    role_runtime_session_id?: string | null;
    activity_id?: string | null;
    run_id?: string | null;
  };
  reentry_target?: string | null;
};

export type DownloadTaxonomy =
  | "platform_manual_input"
  | "manual_downstream_template"
  | "external_manual_result"
  | "parallel_production_operational";

export type DownloadEligibility =
  | "eligible"
  | "eligible_with_flags"
  | "blocked"
  | "pending_manual"
  | "generator_unavailable";

export type ManualActionKind =
  | "continue_block"
  | "restart_block"
  | "reopen_block"
  | "set_questions_manually"
  | "select_activity_manually"
  | "mark_for_review"
  | "request_reentry";

export type ManualControlAvailability = {
  action: ManualActionKind;
  enabled: boolean;
  reason_if_disabled: string | null;
  requires_justification: true;
  requires_audit_trail: true;
};

export type DownloadKind =
  | "questions_answers_excel"
  | "pathology_map_report"
  | "mba_camunda_templates"
  | "evidence_traceability_bundle"
  | "consultant_packet"
  | "gate_readiness_report"
  | "audit_trail"
  | "canonical_variables_gaps"
  | "capa_2_0_manual_workbook"
  | "capa_2_5_manual_workbook"
  | "capa_3_0_manual_workbook"
  | "runtime_audit_xlsx"
  | "gaps_package"
  | "mdsb_parallel_production";

export type DownloadAvailability = {
  kind: DownloadKind;
  label: string;
  enabled: boolean;
  status: "available" | "pending_authorized_generator" | "blocked_no_authority";
  buttonLabel?: string;
  reason_if_disabled: string | null;
  requires_authority: true;
  requires_audit_trail: true;
  finalDiagnosisAutomaticAllowed?: false;
  productiveExportAllowed?: false;
  /** Mapping to SUP final object or auxiliary role (Area 4 ↔ Columna vertebral SUP). */
  sup_maps_to: string;
  sup_mapping_role:
    | "auxiliary_input"
    | "consultant_input"
    | "sup_final_object"
    | "consultant_synthesis"
    | "runtime_audit"
    | "mmabp_input"
    | "manual_downstream";
  taxonomy?: DownloadTaxonomy;
  eligibility?: DownloadEligibility;
  generator_status?: "unavailable" | "pending" | "ready";
  non_automatic_execution_flag?: true;
  scope_badge?: "Operativo" | "Descargable manual" | "No implementado";
};

export type SupFinalObjectCode =
  | "P-SUP-01"
  | "P-SUP-02"
  | "P-SUP-06"
  | "P-SUP-07/08"
  | "P-SUP-09";

export type SupFinalObjectSubObject = {
  name: string;
  state: string;
};

/** Fixture-facing shape for Cervecería Ámbar Ancestral `supFinalObjects`. */
export type SupFinalObjectFixtureEntry = {
  code: SupFinalObjectCode;
  capability: string;
  finalObject: string;
  state: string;
  status: string;
  consultantUse: string;
};

export type SupFinalObjectCard = SupFinalObjectFixtureEntry & {
  previousDependency: string | null;
  blockOrWarning: string | null;
  associatedDownload: string | null;
  authorityRequired: true;
  subObjects?: SupFinalObjectSubObject[];
  /** Instant when the current operational status became active. */
  status_since?: string | null;
  /** Instant when the target Object[State] was reached (completed milestone). */
  completed_at?: string | null;
};

export type SupEventObjectLink = {
  causal_step: string;
  feeds_sup_object: string;
  description: string;
};

export type SupDownloadMapping = {
  kind: DownloadKind;
  label: string;
  maps_to: string;
  role: DownloadAvailability["sup_mapping_role"];
};

/**
 * Columna vertebral SUP — objetos finales del PM Camunda EVE
 * (entre Área 3 Trazabilidad y Área 4 Descargas).
 */
export type SupFinalObjectsBackboneState = {
  title: string;
  causal_purpose: string;
  causal_chain: string[];
  objects: SupFinalObjectCard[];
  /** Alias explícito pedido por fixture Ámbar. */
  supFinalObjects: SupFinalObjectFixtureEntry[];
  event_to_sup_links: SupEventObjectLink[];
  download_to_sup_mappings: SupDownloadMapping[];
  productive_export_blocked: true;
  final_diagnosis_automatic_blocked: true;
};

export type QuestionBlockStatus =
  | "completed"
  | "in_progress"
  | "blocked"
  | "pending_review";

export type QuestionBlockSnapshot = {
  blockId: string;
  title: string;
  status: QuestionBlockStatus;
  currentQuestion: string | null;
  pendingQuestions: string[];
  incompleteAnswers: string[];
  errorsOrBlockers: string[];
  lastInteractionAt: string;
};

export type ReadinessSummary = {
  state: string;
  flags: string[];
  consultantReviewRequired: boolean;
  publicSelfServiceAllowed: boolean;
  finalDiagnosisAutomaticAllowed: boolean;
  productiveExportAllowed: boolean;
};

export type InterventionHistoryItem = {
  intervention_id: string;
  consultant_id: string;
  timestamp: string;
  action: ManualActionKind | string;
  justification: string;
  previous_state: string | null;
  new_state: string | null;
};

export type FunctionalUserHelpState = {
  client_company_name: string | null;
  case_id: string | null;
  case_label?: string | null;
  user_id: string | null;
  user_label: string | null;
  role_id: string | null;
  role_label: string | null;
  role_purpose?: string | null;
  current_activity_id: string | null;
  current_activity_label: string | null;
  current_question_block: string | null;
  block_status: string | null;
  pending_questions: string[];
  incomplete_answers: string[];
  errors_or_blocks: string[];
  last_interaction_at: string | null;
  question_blocks?: QuestionBlockSnapshot[];
  intervention_history: InterventionHistoryItem[];
  manual_controls: ManualControlAvailability[];
  causal_purpose: string;
};

export type UserProgressRow = {
  user_id: string;
  user_label: string;
  role_id: string | null;
  role_label: string | null;
  /** Actividades primarias asignadas (máx. 8 por rol). */
  activities_count: number;
  /** Primarias con todos los bloques Runtime 0/0.5/1–7 completados. */
  primary_activities_completed: number;
  /**
   * Avance Runtime sobre runs de primarias abiertas:
   * bloques Runtime completados ÷ (completados + pendientes).
   * Separado de primary_activities_completed (primarias con todos sus bloques).
   */
  progress_pct: number;
  /** Bloques Runtime (0, 0.5, 1–7) completados en runs de primarias. */
  blocks_completed: number;
  /** Bloques Runtime aún no completados en esos runs. */
  blocks_pending: number;
  blockers: string[];
  last_activity_at: string | null;
  active: boolean;
  question_blocks?: QuestionBlockSnapshot[];
  activities?: Array<{ id: string; label: string }>;
  /** Functional profiles under the same physical login (user_id ≠ role_runtime_session). */
  role_runtime_sessions?: RoleRuntimeSessionSummary[];
  functional_separation_state?: FunctionalSeparationState;
};

export type ClientCompanyProgressState = {
  client_company_id: string | null;
  client_company_name: string | null;
  client_company_type?: string | null;
  industry?: string | null;
  service_context?: string | null;
  contract_unit?: string | null;
  case_id: string | null;
  case_label?: string | null;
  case_status: string | null;
  case_mode?: string | null;
  critical_blockers_count?: number;
  overall_progress_pct: number;
  users: UserProgressRow[];
  associated_roles: Array<{ role_id: string; role_label: string }>;
  causal_purpose: string;
};

export type OperationalTraceEvent = {
  event_id: string;
  occurred_at: string;
  event_type: string;
  causal_step:
    | "user_input"
    | "actor_scene"
    | "transduction"
    | "client_company"
    | "evidence"
    | "variable_or_gap"
    | "gate_or_readiness"
    | "audit";
  summary: string;
  actor_ref: string | null;
  scene_ref: string | null;
  run_id: string | null;
  gate_code: string | null;
  status: string | null;
  /** Usuario dueño del tramo temporal (para agrupar inicio/fin por usuario). */
  user_id?: string | null;
  user_label?: string | null;
};

/** Estados de cobertura de bloques Runtime / Capa 1 (captura, no gates). */
export type RuntimeBlockCoverageStatus =
  | "pending"
  | "active"
  | "completed"
  | "blocked"
  | "review_required";

export type RuntimeBlockId =
  | "0"
  | "0.5"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7";

export type RuntimeBlockCode =
  | "BLOQUE_0"
  | "BLOQUE_0_5"
  | "BLOQUE_1"
  | "BLOQUE_2"
  | "BLOQUE_3"
  | "BLOQUE_4"
  | "BLOQUE_5"
  | "BLOQUE_6"
  | "BLOQUE_7";

/**
 * Bloque de captura dentro de un activity_runtime_run.
 * Cada run recorre Bloque 0, 0.5 y 1–7; no se reparte globalmente entre actividades.
 */
export type RuntimeBlockCoverageBlockInRun = {
  blockCode: RuntimeBlockCode;
  blockLabel: string;
  blockId: RuntimeBlockId;
  status: RuntimeBlockCoverageStatus;
  baseUsed: number;
  causalUsed: number;
  questionsAssigned: number;
  questionsAnswered: number;
  /** Ids/numeración de preguntas asignadas en el bloque (solo id). */
  questionIds: string[];
  evidence: string[];
  variablesOrGaps: string[];
  /** Gate regulatorio relacionado si aplica; null cuando el bloque no mapea a un gate. */
  relatedGate: string | null;
};

/**
 * Cobertura de bloques Runtime / Capa 1 agrupada por activity_runtime_run.
 * Un run = una actividad primaria seleccionada con su propio recorrido 0 / 0.5 / 1–7.
 */
export type RuntimeBlockCoverageByRun = {
  roleRuntimeSessionId: string;
  activityRuntimeRunId: string;
  userId: string;
  role: string;
  activityCode: string;
  activityName: string;
  blocks: RuntimeBlockCoverageBlockInRun[];
};

/**
 * Escena candidata emergente de un activity_runtime_run.
 * No nace del rol aislado; alimenta SceneCanonicalRecord sin diagnóstico final automático.
 */
export type SceneCandidateByRun = {
  activityCode: string;
  role: string;
  activityRuntimeRunId: string;
  sceneCandidateTitle: string;
  originSummary: string;
  feedsSupObject: "SceneCanonicalRecord [Consolidated]";
  status: string;
};

/**
 * @deprecated Prefer RuntimeBlockCoverageByRun — cobertura global bloque→actividad es incorrecta.
 * Conservado solo para compatibilidad de tipos legacy; no usar en UI.
 */
export type RuntimeBlockCoverageItem = {
  block_id: RuntimeBlockId;
  block_name: string;
  status: RuntimeBlockCoverageStatus;
  questions_assigned: number;
  questions_answered: number;
  budget_consumed: number;
  evidence_generated: string[];
  variables_or_gaps_generated: string[];
  related_gate: string | null;
  user_label: string | null;
  role_label: string | null;
  activity_label: string | null;
};

/**
 * Agregado informativo de caso — NO es límite de presupuesto 40/20.
 * El 40/20 aplica por activity_runtime_run, no por empresa ni caso.
 */
export type RuntimeBudgetCaseAggregate = {
  usersInScope: number;
  rolesInScope: number;
  primaryActivitiesSelected: number;
  activeRuns: number;
  totalBaseInteractionsObserved: number;
  totalCausalInteractionsObserved: number;
  /** Etiqueta obligatoria: agregado informativo, no límite. */
  informationalLabel: "Agregado informativo — no límite de presupuesto";
};

/** Presupuesto 40/20 de una actividad primaria con run, bajo un usuario/rol. */
export type RuntimeBudgetUserRoleActivity = {
  activityId: string;
  activityCode: string;
  activityName: string;
  activityRuntimeRunId: string;
  baseUsed: number;
  baseLimit: 40;
  causalUsed: number;
  causalLimit: 20;
  runState: string;
};

/** Nivel B: presupuesto por usuario / rol (cada actividad primaria con su propio 40/20). */
export type RuntimeBudgetByUserRole = {
  userId: string;
  userLabel: string;
  roleId: string;
  roleLabel: string;
  primaryActivitiesWithRun: RuntimeBudgetUserRoleActivity[];
};

/**
 * Nivel C: presupuesto por activity_runtime_run.
 * El límite 40/20 vive aquí — no a nivel empresa ni caso.
 */
export type RuntimeBudgetByRunItem = {
  roleRuntimeSessionId: string;
  userId: string;
  roleId: string;
  activityId: string;
  activityRuntimeRunId: string;
  role: string;
  userLabel: string;
  activityCode: string;
  activityName: string;
  baseUsed: number;
  baseLimit: 40;
  causalUsed: number;
  causalLimit: 20;
  baseRemaining: number;
  causalRemaining: number;
  currentBlock: string;
  runState: string;
};

/** Consumo por bloque agrupado dentro de un activity_runtime_run (no global). */
export type RuntimeBudgetBlockConsumptionInRun = {
  blockId: string;
  blockName: string;
  baseUsed: number;
  causalUsed: number;
};

export type RuntimeBudgetConsumptionByBlockByRun = {
  activityRuntimeRunId: string;
  roleLabel: string;
  activityCode: string;
  blocks: RuntimeBudgetBlockConsumptionInRun[];
};

/**
 * Presupuesto Runtime 40/20 scoped por activity_runtime_run
 * dentro de role_runtime_session — no agregado de empresa/caso.
 */
export type RuntimeBudget4020Summary = {
  scopeTitle: "Presupuesto Runtime 40/20 por usuario / rol / actividad primaria";
  /**
   * Texto obligatorio de alcance:
   * el 40/20 se calcula por activity_runtime_run, no es presupuesto agregado.
   */
  note: string;
  /**
   * Texto operativo obligatorio: 40/20 = suficiencia por resolución, no consumo opcional.
   */
  operationalSufficiencyNote: string;
  caseAggregate: RuntimeBudgetCaseAggregate;
  budgetByUserRole: RuntimeBudgetByUserRole[];
  runtimeBudgetByRun: RuntimeBudgetByRunItem[];
  consumptionByBlockByRun: RuntimeBudgetConsumptionByBlockByRun[];
};

/** Estado de resolución de una base B0-Q01…B7-Q40. */
export type BaseResolutionStateById = {
  base_id: string;
  state: string;
  canonical_variable?: string | null;
  provenance?: string | null;
  mmabp_or_readiness_output?: string | null;
};

/** Snapshot BASE-40 por activity_runtime_run. */
export type BaseResolutionByRun = {
  activityRuntimeRunId: string;
  activityCode: string;
  role: string;
  total_required: 40;
  records: BaseResolutionStateById[];
  skipped_silently_count: number;
  inferred_unconfirmed_count: number;
  reentry_count: number;
  manual_review_count: number;
  resolved_count: number;
  blocking_base_ids: string[];
  gate_summary: {
    passed_for_ready_full: boolean;
    allowed_next_state: string;
  };
};

/** Evaluación de una causal C01–C20. */
export type CausalClosureStateById = {
  causal_id: string;
  activation_state: string;
  condition_evidence?: string | null;
  priority?: "P0" | "P1" | "P2" | "P3";
};

/** Snapshot CAUSAL-20 por activity_runtime_run. */
export type CausalClosureByRun = {
  activityRuntimeRunId: string;
  activityCode: string;
  role: string;
  total_required_evaluations: 20;
  records: CausalClosureStateById[];
  triggered_required_count: number;
  answered_closed_count: number;
  not_triggered_with_evidence_count: number;
  activation_unknown_count: number;
  route_missing_count: number;
  reentry_count: number;
  manual_review_count: number;
  p0_blockers: string[];
  gate_summary: {
    passed_for_ready_full: boolean;
    allowed_next_state: string;
  };
};

export type BaseResolutionGatePanelSummary = {
  total_required: 40;
  evaluated_or_resolved_or_explicitly_blocked: number;
  skipped_silently: number;
  inferred_unconfirmed: number;
  reentry: number;
  manual_review: number;
  blocking_bases: string[];
  passed_for_ready_full: boolean;
};

export type CausalClosureGatePanelSummary = {
  total_required_evaluations: 20;
  evaluated: number;
  triggered_required: number;
  answered_closed: number;
  not_triggered_with_evidence: number;
  activation_unknown: number;
  route_missing: number;
  reentry: number;
  manual_review: number;
  p0_blockers: string[];
  passed_for_ready_full: boolean;
};

export type OperationalTraceState = {
  timeline: OperationalTraceEvent[];
  runtime_events_count: number;
  interactions_count: number;
  answers_processed_count: number;
  subfields_count: number;
  evidence_items_count: number;
  canonical_variables_count: number;
  readiness_gaps_count: number;
  /**
   * Cobertura de bloques Runtime / Capa 1 por activity_runtime_run.
   * Cada run recorre Bloque 0, 0.5 y 1–7; no distribución global bloque→actividad.
   */
  runtimeBlockCoverageByRun: RuntimeBlockCoverageByRun[];
  /**
   * Escenas candidatas por activity_runtime_run.
   * Emergen de rol + actividad primaria + run + contexto + evidencia/gaps/eventos.
   */
  sceneCandidatesByRun: SceneCandidateByRun[];
  /** Presupuesto 40/20 scoped por activity_runtime_run (no agregado empresa/caso). */
  runtimeBudget4020: RuntimeBudget4020Summary;
  /** BASE-40 resolution ledger por run (40 estados obligatorios). */
  baseResolutionByRun: BaseResolutionByRun[];
  /** CAUSAL-20 evaluation ledger por run (20 evaluaciones obligatorias). */
  causalClosureByRun: CausalClosureByRun[];
  /** Agregado visible del Base Resolution Gate. */
  base_resolution_gate: BaseResolutionGatePanelSummary;
  /** Agregado visible del Causal Closure Gate. */
  causal_closure_gate: CausalClosureGatePanelSummary;
  runtime_40_20_operational_rules_version: string;
  gate_summaries: Array<{ gate_code: string; status: string; reason: string | null }>;
  transduction_status: string;
  actor_scene_company_relation: string;
  readiness?: ReadinessSummary | null;
  causal_purpose: string;
  /** Conexión Área 3 → objetos SUP (no solo eventos runtime). */
  event_to_sup_links: SupEventObjectLink[];
};

export type ConsultantDownloadsState = {
  downloads: DownloadAvailability[];
  causal_purpose: string;
};

/**
 * P-CLIENT-01 workspace payload (Vista 1 Experiencia + Vista 5 Pre-runtime).
 * Built by enrichment from p-client-01-view-models.
 */
export type PClient01PanelBlock = {
  process: {
    pm_process_id: "P-CLIENT-01";
    pf_process_id: "PF-CLIENT-01";
    label: string;
    target_object_state: "ClientEngagement [ClosedWithDeliveredCase]";
  };
  architectural_contract: import("./p-client-01-view-models").PClient01ArchitecturalContract;
  context_header: import("./p-client-01-view-models").PClient01ContextHeaderVM;
  status_band: import("./p-client-01-view-models").PClient01StatusBandVM;
  workspace_zones: import("./p-client-01-view-models").PClient01WorkspaceZoneId[];
  experience: import("./p-client-01-view-models").UserExperienceVM;
  pre_runtime: import("./p-client-01-view-models").PreRuntimeContextVM;
};

export type ConsultantControlPanelState = {
  panel_id: "consultant_expert_control_panel";
  request_id: string;
  contract_version: "1.0";
  generated_at: string;
  access: {
    surface: "consultant_internal";
    client_access_blocked: true;
    consultant_role: ConsultantControlPanelRole | null;
  };
  capabilities: ControlPanelCapabilities;
  critical_alerts: CriticalAlert[];
  filters: ControlPanelFilterScope;
  filter_options: {
    client_companies: Array<{ id: string; label: string }>;
    cases: Array<{ id: string; label: string }>;
    users: Array<{ id: string; label: string }>;
    roles: Array<{ id: string; label: string }>;
    role_runtime_sessions: Array<{ id: string; label: string }>;
    activities: Array<{ id: string; label: string }>;
    runs: Array<{ id: string; label: string }>;
  };
  /**
   * BFF GET /state envelope fields (UI Spec §9.6).
   * Front-end must render Runtime context from these, not from query params.
   */
  case_header: ControlPanelCaseHeader;
  selected_context: ControlPanelSelectedContext;
  /** Runs in effective scope (not merged across roles). */
  runs: RuntimeBudgetByRunItem[];
  /**
   * Exactly 40 BaseResolutionStatus for the selected run when include=run-detail
   * and runtime_view_scope=selected_activity; otherwise null (never a silent partial).
   */
  base_items: BaseResolutionStateById[] | null;
  /**
   * Exactly 20 CausalClosureStatus for the selected run when include=run-detail
   * and runtime_view_scope=selected_activity; otherwise null.
   */
  causal_items: CausalClosureStateById[] | null;
  gates: Array<{ gate_code: string; status: string; reason: string | null }>;
  meta: ControlPanelMeta;
  area_1_functional_help: FunctionalUserHelpState;
  area_2_client_progress: ClientCompanyProgressState;
  area_3_operational_trace: OperationalTraceState;
  /** Columna vertebral SUP — entre Área 3 y Área 4. */
  sup_final_objects_backbone: SupFinalObjectsBackboneState;
  area_4_downloads: ConsultantDownloadsState;
  /** Read models for P-CLIENT-01 Vista 1 / Vista 5 (derived; never invents evidence). */
  p_client_01?: PClient01PanelBlock | null;
  boundary: {
    production_touched: false;
    service_role_in_frontend: false;
    diagnosis_final_automatic: false;
    productive_export_executed: false;
    activation_reopened: false;
    ring_5_recreated: false;
  };
  consultant_safe_message: string;
  fixture?: {
    id: string;
    source: string;
    simulated: true;
    production_data_used: false;
  } | null;
};

export type ManualActionRequest = {
  action: ManualActionKind;
  justification: string;
  scope: ControlPanelFilterScope;
  previous_state: string | null;
  new_state: string | null;
  consultant_user_id: string;
};

export type ManualActionResponse =
  | {
      status: "accepted";
      audit_trail_id: string;
      consultant_safe_message: string;
    }
  | {
      status: "disabled_requires_audited_endpoint";
      consultant_safe_message: string;
      reason: string;
    }
  | {
      status: "rejected";
      error: string;
      consultant_safe_message: string;
    };

export type DownloadRequestBody = {
  kind: DownloadKind;
  justification: string;
  scope: ControlPanelFilterScope;
  consultant_user_id: string;
};

export type DownloadRequestResponse =
  | {
      status: "authorized_pending_generator";
      consultant_safe_message: string;
      reason: string;
    }
  | {
      status: "blocked";
      error: string;
      consultant_safe_message: string;
    };
