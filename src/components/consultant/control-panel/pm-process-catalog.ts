/**
 * Static MBA process metadata for the Consultant Control Panel PM shell.
 * Architectural PM labels (name, trigger, target Object[State]) are canonical.
 * Visual status chips may be derived from fixture/BFF operational state separately.
 */

import type {
  ConsultantControlPanelState,
  ControlPanelViewKey,
  SupFinalObjectCard,
} from "@/services/eve/consultant-control-panel/consultant-control-panel-types";
import {
  latestTraceOccurredAt,
  resolveCardWorker,
  traceCausalStepForProcess,
} from "./pm-card-footer";

export type PMProcessCode =
  | "P-CORE-01"
  | "P-SUP-01"
  | "P-SUP-02"
  | "P-SUP-03"
  | "P-SUP-04"
  | "P-SUP-05"
  | "P-SUP-06"
  | "P-SUP-07/08"
  | "P-SUP-09"
  | "P-CLIENT-01";

export type PMViewMode = "mapa" | "tabla" | "dependencias";

/** Existing CCP views + P-CLIENT-01 specialty tabs + read-only placeholders. */
export type PMOperationalViewKey =
  | ControlPanelViewKey
  | "experience"
  | "pre-runtime"
  | "evidence-bundle"
  | "parallel-production"
  | "qa"
  | "blockages"
  | "client-delivery"
  | "manual-actions";

export type PClient01ViewKey = "experience" | "pre-runtime";

/** §2.1 URL aliases oficiales (foco UI; no autorizan). */
export const PCLIENT01_URL_VIEW_ALIASES = {
  "client-experience": "experience",
  "pre-runtime-context": "pre-runtime",
} as const satisfies Record<string, PClient01ViewKey>;

export type PClient01UrlViewAlias = keyof typeof PCLIENT01_URL_VIEW_ALIASES;

export function isPClient01OperationalView(
  key: PMOperationalViewKey,
): key is PClient01ViewKey {
  return key === "experience" || key === "pre-runtime";
}

/** Parsea view=client-experience|pre-runtime-context (o keys internas). */
export function parsePClient01UrlView(
  raw: string | null | undefined,
): PClient01ViewKey | null {
  if (!raw) return null;
  if (raw === "experience" || raw === "pre-runtime") return raw;
  if (raw in PCLIENT01_URL_VIEW_ALIASES) {
    return PCLIENT01_URL_VIEW_ALIASES[raw as PClient01UrlViewAlias];
  }
  return null;
}

export function toPClient01UrlView(tab: PClient01ViewKey): PClient01UrlViewAlias {
  return tab === "experience" ? "client-experience" : "pre-runtime-context";
}

export type PMVisualStatus =
  | "completado"
  | "en_progreso"
  | "pendiente"
  | "no_iniciado"
  | "bloqueado";

export type PMSyncPattern =
  | "trigger_and_wait"
  | "parallel_sync"
  | "wait_only"
  | "fire_and_forget";

export type ProcessExecutionMode = "platform" | "manual" | "governance";

/** Canonical Process Map card architecture (single source for Mapa / Tabla / Dependencias). */
export type EveProcessMapCard = {
  order: number | null;
  processId: PMProcessCode;
  processName: string;
  targetObject: string;
  targetState: string;
  triggerLabel: string;
  /** Optional compact trigger for narrow PM cards; full value stays in triggerLabel. */
  triggerLabelCompact?: string;
  producedState: string;
  executionMode: ProcessExecutionMode;
  scopeLabel: string;
  isGoverning?: boolean;
};

export type PMProcessCardModel = {
  code: PMProcessCode;
  sequence: number | null;
  name: string;
  /** Architectural Object[State] target for the PM card (never an OLC intermediate as target). */
  objectState: string;
  targetObject: string;
  targetState: string;
  /** Full official PM trigger. */
  enablingEvent: string;
  /** Compact trigger for narrow card UI when needed. */
  enablingEventDisplay: string;
  /** Architectural produced / target state shown on the PM card. */
  producedState: string;
  executionMode: ProcessExecutionMode;
  scopeLabel: string;
  /** Operational OLC/phase from BFF/fixture when available — not the PM target. */
  currentOperationalState: string | null;
  visualStatus: PMVisualStatus;
  visualStatusLabel: string;
  isGoverning?: boolean;
  provenanceNote?: string;
  /** ISO instant when current visual/operational status started. */
  statusSinceAt: string | null;
  /** ISO instant when milestone completed (if any). */
  completedAt: string | null;
  /** Who is currently responsible for advancing this subprocess. */
  footerWorkerRole: "Sistema" | "Consultor";
  footerWorkerReason: string;
  /** Operational SUP status string used for worker/time heuristics. */
  operationalStatusSignal: string | null;
  /**
   * Stable observation instant (from BFF generated_at) for SSR-safe elapsed clocks.
   * Client may advance after mount for live elapsed display.
   */
  observationAsOf: string;
};

export type PMOperationalNavItem = {
  key: PMOperationalViewKey;
  label: string;
  hint: string;
  kind: "native" | "placeholder" | "disabled_preview";
  mapsToNative?: ControlPanelViewKey;
};

const NATIVE_LABELS: Record<ControlPanelViewKey, { label: string; hint: string }> = {
  cases: { label: "Centro de casos", hint: "Readiness" },
  "functional-help": { label: "Ayuda funcional", hint: "Señales / gaps" },
  monitoring: { label: "Empresa / usuarios / roles", hint: "Matriz multirrol" },
  runtime: { label: "Runtime 40+20", hint: "Runs activos" },
  trace: { label: "Trazabilidad", hint: "Eventos recientes" },
  gates: { label: "Gates & Readiness", hint: "B0–B7 / SEM / PST" },
  downloads: { label: "Descargas", hint: "Visibles / deshabilitadas" },
  audit: { label: "Audit trail", hint: "Overrides / historial" },
};

const PCLIENT01_LABELS: Record<PClient01ViewKey, { label: string; hint: string }> = {
  experience: { label: "Experiencia usuario", hint: "Vista 1 · jornada" },
  "pre-runtime": { label: "Contexto pre-runtime", hint: "Vista 5 · Estado A / WorkMap" },
};

const PLACEHOLDER_META: Record<
  Exclude<PMOperationalViewKey, ControlPanelViewKey | PClient01ViewKey>,
  { label: string; hint: string; kind: "placeholder" | "disabled_preview" }
> = {
  "evidence-bundle": {
    label: "EvidenceBundle",
    hint: "P-SUP-02 · sin UI dedicada",
    kind: "placeholder",
  },
  "parallel-production": {
    label: "Producción paralela",
    hint: "Inventario / IR / QA",
    kind: "placeholder",
  },
  qa: {
    label: "QA",
    hint: "No automatizado",
    kind: "placeholder",
  },
  blockages: {
    label: "Bloqueos",
    hint: "Observación gobernada",
    kind: "placeholder",
  },
  "client-delivery": {
    label: "Estado de entrega al cliente",
    hint: "P-CLIENT-01",
    kind: "placeholder",
  },
  "manual-actions": {
    label: "Acciones manuales",
    hint: "Deshabilitadas",
    kind: "disabled_preview",
  },
};

/** selectedProcessCode → allowed operational views (secondary nav). */
export const PROCESS_OPERATIONAL_VIEWS: Record<PMProcessCode, PMOperationalViewKey[]> = {
  "P-CORE-01": ["cases", "gates", "trace", "monitoring"],
  "P-SUP-01": ["cases", "monitoring", "runtime", "trace", "gates"],
  "P-SUP-02": ["evidence-bundle", "trace", "gates", "audit"],
  "P-SUP-03": ["downloads", "trace", "manual-actions"],
  "P-SUP-04": ["downloads", "trace", "manual-actions"],
  "P-SUP-05": ["downloads", "gates", "trace", "manual-actions"],
  "P-SUP-06": ["parallel-production", "downloads", "trace"],
  "P-SUP-07/08": ["gates", "qa", "audit", "blockages"],
  "P-SUP-09": ["downloads", "audit"],
  "P-CLIENT-01": ["experience", "pre-runtime"],
};

/**
 * Single architectural source for the nine flow cards (+ governing P-CORE-01).
 * Triggers are official PM solicitations — not internal Process Flow events.
 */
export const eveProcessMapCards: EveProcessMapCard[] = [
  {
    order: null,
    processId: "P-CORE-01",
    processName: "Producir diagnóstico causal EVE trazable",
    targetObject: "CasoDiagnosticoEVE",
    targetState: "InDiagnosticProduction",
    triggerLabel: "Solicitud diagnóstica aceptada",
    producedState: "InDiagnosticProduction",
    executionMode: "governance",
    scopeLabel: "Gobernante · Caso diagnóstico",
    isGoverning: true,
  },
  {
    order: 1,
    processId: "P-SUP-01",
    processName: "Consolidar escena operativa regulada",
    targetObject: "SceneCanonicalRecord",
    targetState: "Consolidated",
    triggerLabel: "Solicitud de consolidación de escena",
    producedState: "Consolidated",
    executionMode: "platform",
    scopeLabel: "Capa 1.0 · Operativo en plataforma",
  },
  {
    order: 2,
    processId: "P-SUP-02",
    processName: "Preparar EvidenceBundle para transducción",
    targetObject: "EvidenceBundle",
    targetState: "ReadyForTransduction",
    triggerLabel: "Solicitud de bundle de transducción",
    producedState: "ReadyForTransduction",
    executionMode: "platform",
    scopeLabel: "Capa 1.0 · Operativo en plataforma",
  },
  {
    order: 3,
    processId: "P-SUP-03",
    processName: "Transducir evidencia por rol funcional",
    targetObject: "EscenaEvidencial",
    targetState: "Validated",
    triggerLabel: "Solicitud de transducción causal",
    producedState: "Validated",
    executionMode: "manual",
    scopeLabel: "Capa 2.0 · Manual fuera de plataforma",
  },
  {
    order: 4,
    processId: "P-SUP-04",
    processName: "Agregar causalidad empresarial",
    targetObject: "PeliculaCausalAgregada",
    targetState: "Aggregated",
    triggerLabel: "Solicitud de agregación empresarial",
    producedState: "Aggregated",
    executionMode: "manual",
    scopeLabel: "Capa 2.5 · Manual fuera de plataforma",
  },
  {
    order: 5,
    processId: "P-SUP-05",
    processName: "Componer síntesis experta",
    targetObject: "DiagnosticoExpertoFinal",
    targetState: "Delivered",
    triggerLabel: "Solicitud de síntesis experta",
    producedState: "Delivered",
    executionMode: "manual",
    scopeLabel: "Capa 3.0 · Manual fuera de plataforma",
  },
  {
    order: 6,
    processId: "P-SUP-06",
    processName: "Producir inventario MMABP y diagramación",
    targetObject: "InventarioMMABP",
    targetState: "Resolved",
    triggerLabel: "mmabp_design_source_bundle disponible o rework solicitado",
    triggerLabelCompact: "MDSB disponible o rework solicitado",
    producedState: "Resolved",
    executionMode: "platform",
    scopeLabel: "Producción Paralela · Operativo en plataforma",
  },
  {
    order: 7,
    processId: "P-SUP-07/08",
    processName: "Resolver gaps y validar conformance/consistency",
    targetObject: "ArchitectureConsistencyAssessment",
    targetState: "Satisfied",
    triggerLabel: "Solicitud de validación estructural",
    producedState: "Satisfied",
    executionMode: "platform",
    scopeLabel: "Producción Paralela · QA arquitectónico",
  },
  {
    order: 8,
    processId: "P-SUP-09",
    processName: "Generar código exportable Camunda / Enterprise Architect",
    targetObject: "ExportCodePackage",
    targetState: "Generated",
    triggerLabel: "Solicitud de generación de código exportable",
    producedState: "Generated",
    executionMode: "platform",
    scopeLabel: "Producción Paralela · Exportación técnica",
  },
  {
    order: 9,
    processId: "P-CLIENT-01",
    processName: "Gestionar relación con cliente",
    targetObject: "ClientEngagement",
    targetState: "ClosedWithDeliveredCase",
    triggerLabel: "ClientNeed [Expressed]",
    triggerLabelCompact: "Necesidad diagnóstica expresada",
    producedState: "ClosedWithDeliveredCase",
    executionMode: "governance",
    scopeLabel: "Relación con cliente · Seguimiento del caso",
  },
];

const STATUS_LABEL: Record<PMVisualStatus, string> = {
  completado: "COMPLETADO",
  en_progreso: "EN PROGRESO",
  pendiente: "PENDIENTE",
  no_iniciado: "NO INICIADO",
  bloqueado: "BLOQUEADO",
};

export const FORBIDDEN_PM_TRIGGERS = [
  "EvidenciaInicialSuficiente",
  "SCRDisponible",
  "BundleConsumido",
  "EscenasAgregablesDisponibles",
  "PeliculaRecibida",
  "ConformanceCompletada",
  "AssessmentConsistencySatisfied",
  "AlcanceDefinido",
] as const;

export const FORBIDDEN_PM_TARGET_STATES = ["ExpertReviewed", "DeliveryPending"] as const;

function mapSupStatusToVisual(status: string | undefined, state: string | undefined): PMVisualStatus {
  const s = (status ?? "").toLowerCase();
  const st = (state ?? "").toLowerCase();
  if (s.includes("blocked") || st.includes("blocked")) return "bloqueado";
  if (
    s.includes("generated_but_export") ||
    s === "ready" ||
    st === "consolidated" ||
    st === "generated" ||
    st === "resolved" ||
    st === "satisfied"
  ) {
    return "completado";
  }
  if (
    s.includes("flag") ||
    s.includes("partial") ||
    s.includes("satisfied_with") ||
    s.includes("progress") ||
    st.includes("pending") ||
    st.includes("evaluating") ||
    st.includes("expertreviewed")
  ) {
    return "en_progreso";
  }
  if (s.includes("pending") || s.includes("scope")) return "no_iniciado";
  return "pendiente";
}

function findSupCard(
  objects: SupFinalObjectCard[] | undefined,
  code: string,
  targetObject: string,
): SupFinalObjectCard | undefined {
  return (
    objects?.find((item) => item.code === code) ??
    objects?.find((item) => item.finalObject === targetObject)
  );
}

/**
 * Build PM card models from architectural metadata + optional operational SUP/BFF state.
 * Architectural target Object[State] and PM triggers are never replaced by PF events or OLC phases.
 */
export function buildPMProcessCards(state: ConsultantControlPanelState): PMProcessCardModel[] {
  const objects = state.sup_final_objects_backbone?.objects;
  const caseStatus = (state.area_2_client_progress.case_status ?? "").toLowerCase();
  const hasCaseScope = Boolean(
    state.area_2_client_progress.client_company_name || state.filters.case_id,
  );
  const traceEvents = state.area_3_operational_trace?.timeline;

  return eveProcessMapCards.map((meta) => {
    const objectState = `${meta.targetObject} [${meta.targetState}]`;
    const producedState = meta.producedState;
    const enablingEvent = meta.triggerLabel;
    const enablingEventDisplay = meta.triggerLabelCompact ?? meta.triggerLabel;

    let visualStatus: PMVisualStatus = "no_iniciado";
    let currentOperationalState: string | null = null;
    let provenanceNote: string | undefined;
    let statusSinceAt: string | null = null;
    let completedAt: string | null = null;
    let operationalStatusSignal: string | null = null;

    const sup = findSupCard(objects, meta.processId, meta.targetObject);
    if (sup) {
      visualStatus = mapSupStatusToVisual(sup.status, sup.state);
      currentOperationalState = sup.state;
      operationalStatusSignal = sup.status;
      statusSinceAt = sup.status_since ?? null;
      completedAt = sup.completed_at ?? null;
      provenanceNote = "Estado operativo derivado de columna vertebral SUP / fixture";
    } else if (meta.processId === "P-CORE-01" && hasCaseScope) {
      visualStatus = caseStatus.includes("block")
        ? "bloqueado"
        : caseStatus.includes("progress") || caseStatus.includes("ready")
          ? "en_progreso"
          : "pendiente";
      currentOperationalState = state.area_2_client_progress.case_status ?? "Pending";
      statusSinceAt = state.generated_at ?? null;
      provenanceNote = "Estado operativo derivado de caso BFF (sin diagnóstico inventado)";
    } else if (meta.processId === "P-CLIENT-01" && hasCaseScope) {
      visualStatus = "pendiente";
      statusSinceAt = state.generated_at ?? null;
      provenanceNote = "Sin entrega productiva; observación de engagement únicamente";
    } else if (meta.executionMode === "manual") {
      visualStatus = "no_iniciado";
      provenanceNote = "Manual fuera de plataforma · sin ejecución automática";
    }

    if (!statusSinceAt) {
      const fromTrace = latestTraceOccurredAt(
        traceEvents,
        traceCausalStepForProcess(meta.processId),
      );
      if (fromTrace) statusSinceAt = fromTrace;
    }

    if (visualStatus === "completado" && !completedAt && statusSinceAt) {
      completedAt = statusSinceAt;
    }

    const worker = resolveCardWorker({
      processCode: meta.processId,
      executionMode: meta.executionMode,
      visualStatus,
      operationalStatus: operationalStatusSignal,
    });

    return {
      code: meta.processId,
      sequence: meta.order,
      name: meta.processName,
      objectState,
      targetObject: meta.targetObject,
      targetState: meta.targetState,
      enablingEvent,
      enablingEventDisplay,
      producedState,
      executionMode: meta.executionMode,
      scopeLabel: meta.scopeLabel,
      currentOperationalState,
      visualStatus,
      visualStatusLabel: STATUS_LABEL[visualStatus],
      isGoverning: meta.isGoverning,
      provenanceNote,
      statusSinceAt,
      completedAt,
      footerWorkerRole: worker.role,
      footerWorkerReason: worker.reason,
      operationalStatusSignal,
      observationAsOf: state.generated_at,
    };
  });
}

/** Flow cards only (excludes governing P-CORE-01). Used by validation tests. */
export function getEveProcessMapFlowCards(): EveProcessMapCard[] {
  return eveProcessMapCards.filter((card) => !card.isGoverning);
}

export function getOperationalNavItems(
  processCode: PMProcessCode,
): PMOperationalNavItem[] {
  const keys = PROCESS_OPERATIONAL_VIEWS[processCode] ?? ["cases"];
  return keys.map((key) => {
    if (isPClient01OperationalView(key)) {
      return {
        key,
        label: PCLIENT01_LABELS[key].label,
        hint: PCLIENT01_LABELS[key].hint,
        kind: "native" as const,
      };
    }
    if (key in NATIVE_LABELS) {
      const native = key as ControlPanelViewKey;
      return {
        key,
        label: NATIVE_LABELS[native].label,
        hint: NATIVE_LABELS[native].hint,
        kind: "native" as const,
        mapsToNative: native,
      };
    }
    const placeholder = PLACEHOLDER_META[key as Exclude<PMOperationalViewKey, ControlPanelViewKey | PClient01ViewKey>];
    return {
      key,
      label: placeholder.label,
      hint: placeholder.hint,
      kind: placeholder.kind,
    };
  });
}

export function isNativeOperationalView(key: PMOperationalViewKey): key is ControlPanelViewKey {
  return key in NATIVE_LABELS;
}

export function defaultOperationalView(processCode: PMProcessCode): PMOperationalViewKey {
  return PROCESS_OPERATIONAL_VIEWS[processCode]?.[0] ?? "cases";
}

export function syncPatternLabel(pattern: PMSyncPattern): string {
  switch (pattern) {
    case "trigger_and_wait":
      return "Trigger & Wait";
    case "parallel_sync":
      return "Paralelo sincronizado";
    case "wait_only":
      return "Wait Only";
    case "fire_and_forget":
      return "Fire & Forget";
    default:
      return pattern;
  }
}

export function executionModeLabel(mode: ProcessExecutionMode): string {
  switch (mode) {
    case "platform":
      return "Operativo en plataforma";
    case "manual":
      return "Manual fuera de plataforma";
    case "governance":
      return "Seguimiento y gobernanza del caso";
    default:
      return mode;
  }
}

/** Download CTA label for manual capas (never auto-execute motors). */
export function manualPackageDownloadLabel(processId: PMProcessCode): string | null {
  switch (processId) {
    case "P-SUP-03":
      return "Descargar paquete Capa 2.0";
    case "P-SUP-04":
      return "Descargar paquete Capa 2.5";
    case "P-SUP-05":
      return "Descargar paquete Capa 3.0";
    default:
      return null;
  }
}

export function caseProgressSummary(state: ConsultantControlPanelState): {
  company: string;
  caseLabel: string;
  caseStateLabel: string;
  progressPct: number;
  criticalPending: number;
  blockages: number;
} {
  const progress = state.area_2_client_progress;
  const alerts = state.critical_alerts ?? [];
  const criticalPending = alerts.filter(
    (alert) => alert.severity === "error" || alert.severity === "review",
  ).length;
  const blockages = alerts.filter((alert) => alert.severity === "error").length;
  const caseState = progress.case_status ?? state.area_3_operational_trace.readiness?.state ?? "—";
  const caseStateLabel =
    typeof caseState === "string" && caseState.toLowerCase().includes("progress")
      ? "En progreso con pendientes"
      : String(caseState);

  return {
    company: progress.client_company_name ?? "Empresa cliente",
    caseLabel: progress.case_label ?? progress.case_id ?? state.filters.case_id ?? "—",
    caseStateLabel,
    progressPct: Math.round(progress.overall_progress_pct ?? 0),
    criticalPending: criticalPending || alerts.length,
    blockages,
  };
}
