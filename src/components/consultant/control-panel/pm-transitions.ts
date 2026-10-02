/**
 * Canonical PM transitions between horizontal Process Map cards.
 * Visual adjacency ≠ causal succession. Connectors, Tabla, Dependencias
 * and the lower detail panel MUST consume this source.
 */

import type { PMProcessCode, PMSyncPattern } from "./pm-process-catalog";

export type PMConnectorKind =
  | "synchronization"
  | "branch_boundary"
  | "client_boundary";

export type PMSynchronizationPattern = PMSyncPattern;

export type PMTransitionRuntimeStatus =
  | "not_enabled"
  | "enabled"
  | "waiting"
  | "completed"
  | "blocked"
  | "manual_pending"
  | "rework_required"
  | "not_applicable";

export type PMTransitionAction = {
  id: string;
  label: string;
};

export type PMTransitionModel = {
  transitionId: string;
  visualSourceProcessId: PMProcessCode;
  visualTargetProcessId: PMProcessCode;
  connectorKind: PMConnectorKind;
  syncPattern: PMSynchronizationPattern | null;
  directDependency: boolean;
  visualAdjacencyOnly?: boolean;
  sourceObject?: string;
  sourceTargetState?: string;
  sourceObjectState?: string;
  emittedEvent?: string;
  targetTrigger?: string;
  sourceWaitsForTarget?: boolean;
  awaitedFeedback?: string[];
  branch?: string;
  branchLeaving?: string;
  branchEntering?: string;
  executionBoundary?: string;
  sourceExecutionMode?: string;
  targetExecutionMode?: string;
  manualPackageLabel?: string;
  secondaryBadge?: string;
  actualSourceObjectState?: string;
  actualEmittedEvent?: string;
  actualTargetProcessId?: string;
  actualTargetTrigger?: string;
  actualRelatedProcessId?: string;
  guard?: {
    field: string;
    operator: "equals" | "not_equals";
    expectedValue: string;
  };
  rework?: {
    enabled: boolean;
    sourceProcessId: PMProcessCode;
    sourceState: string;
    event: string;
    targetProcessId: PMProcessCode;
  };
  clientRelations?: Array<{
    relation: string;
    sourceProcessId: PMProcessCode;
    targetProcessId: PMProcessCode;
    sourceState: string;
    event: string;
    pattern: PMSynchronizationPattern;
  }>;
  explanation?: string;
  tooltip?: string;
  detailTitle?: string;
  actions?: PMTransitionAction[];
  timerPolicyHint?: string;
};

export const evePmTransitions: PMTransitionModel[] = [
  {
    transitionId: "T01",
    visualSourceProcessId: "P-SUP-01",
    visualTargetProcessId: "P-SUP-02",
    connectorKind: "synchronization",
    syncPattern: "fire_and_forget",
    sourceObject: "SceneCanonicalRecord",
    sourceTargetState: "Consolidated",
    sourceObjectState: "SceneCanonicalRecord [Consolidated]",
    emittedEvent: "Solicitud de bundle de transducción",
    targetTrigger: "Solicitud de bundle de transducción",
    directDependency: true,
    sourceWaitsForTarget: false,
    branch: "diagnostic_main",
    executionBoundary: "platform_to_platform",
    tooltip:
      "SceneCanonicalRecord [Consolidated] dispara la solicitud de bundle. P-SUP-01 termina y no espera el cierre de P-SUP-02.",
    detailTitle: "T01 · P-SUP-01 → P-SUP-02",
    actions: [
      { id: "view_scr", label: "Ver SCR" },
      { id: "reentry_c1", label: "Abrir reentry Capa 1.0" },
      { id: "view_conformance", label: "Ver conformance" },
      { id: "history", label: "Ver historial" },
    ],
  },
  {
    transitionId: "T02",
    visualSourceProcessId: "P-SUP-02",
    visualTargetProcessId: "P-SUP-03",
    connectorKind: "synchronization",
    syncPattern: "fire_and_forget",
    sourceObject: "EvidenceBundle",
    sourceTargetState: "ReadyForTransduction",
    sourceObjectState: "EvidenceBundle [ReadyForTransduction]",
    emittedEvent: "Solicitud de transducción causal",
    targetTrigger: "Solicitud de transducción causal",
    directDependency: true,
    sourceWaitsForTarget: false,
    branch: "diagnostic_main",
    executionBoundary: "platform_to_manual",
    targetExecutionMode: "manual_outside_platform",
    manualPackageLabel: "Workbook Capa 2.0",
    secondaryBadge: "Continuidad manual",
    tooltip:
      "EvidenceBundle [ReadyForTransduction] habilita la transducción. La transducción se realiza manualmente fuera de la plataforma actual.",
    detailTitle: "T02 · P-SUP-02 → P-SUP-03",
    explanation:
      "El conector representa habilitación arquitectónica. No representa ejecución automática.",
    actions: [
      { id: "download_bundle", label: "Descargar EvidenceBundle" },
      { id: "download_workbook_2", label: "Descargar Workbook Capa 2.0" },
      { id: "download_gaps", label: "Descargar paquete de gaps" },
      { id: "trace", label: "Ver trazabilidad" },
    ],
  },
  {
    transitionId: "T03",
    visualSourceProcessId: "P-SUP-03",
    visualTargetProcessId: "P-SUP-04",
    connectorKind: "synchronization",
    syncPattern: "fire_and_forget",
    sourceObject: "EscenaEvidencial",
    sourceTargetState: "Validated",
    sourceObjectState: "EscenaEvidencial [Validated]",
    emittedEvent: "Solicitud de agregación empresarial",
    targetTrigger: "Solicitud de agregación empresarial",
    directDependency: true,
    sourceWaitsForTarget: false,
    branch: "diagnostic_main",
    executionBoundary: "manual_to_manual",
    sourceExecutionMode: "manual_outside_platform",
    targetExecutionMode: "manual_outside_platform",
    secondaryBadge: "Manual",
    detailTitle: "T03 · P-SUP-03 → P-SUP-04",
    explanation: "P-SUP-04 requiere escenas evidenciales validadas (suficientes para agregación).",
    actions: [
      { id: "view_scenes", label: "Ver escenas importadas" },
      { id: "download_workbook_25", label: "Descargar Workbook Capa 2.5" },
      { id: "view_gaps", label: "Ver gaps" },
      { id: "history", label: "Ver historial" },
    ],
  },
  {
    transitionId: "T04",
    visualSourceProcessId: "P-SUP-04",
    visualTargetProcessId: "P-SUP-05",
    connectorKind: "synchronization",
    syncPattern: "fire_and_forget",
    sourceObject: "PeliculaCausalAgregada",
    sourceTargetState: "Aggregated",
    sourceObjectState: "PeliculaCausalAgregada [Aggregated]",
    emittedEvent: "Solicitud de síntesis experta",
    targetTrigger: "Solicitud de síntesis experta",
    directDependency: true,
    sourceWaitsForTarget: false,
    branch: "diagnostic_main",
    executionBoundary: "manual_to_manual",
    sourceExecutionMode: "manual_outside_platform",
    targetExecutionMode: "manual_outside_platform",
    secondaryBadge: "Manual",
    detailTitle: "T04 · P-SUP-04 → P-SUP-05",
    explanation:
      "La síntesis exige película causal agregada y trazabilidad defendible.",
    actions: [
      { id: "download_c3", label: "Descargar paquete Capa 3.0" },
      { id: "view_film", label: "Ver película importada" },
      { id: "trace", label: "Ver trazabilidad" },
      { id: "view_gaps", label: "Ver gaps" },
    ],
  },
  {
    transitionId: "T05",
    visualSourceProcessId: "P-SUP-05",
    visualTargetProcessId: "P-SUP-06",
    connectorKind: "branch_boundary",
    syncPattern: null,
    directDependency: false,
    visualAdjacencyOnly: true,
    branchLeaving: "diagnostic_main",
    branchEntering: "parallel_production",
    actualSourceObjectState: "SceneCanonicalRecord [Consolidated]",
    actualEmittedEvent: "mmabp_design_source_bundle disponible",
    actualTargetProcessId: "P-SUP-06",
    actualTargetTrigger:
      "mmabp_design_source_bundle disponible o rework solicitado",
    secondaryBadge: "Producción Paralela",
    explanation:
      "P-SUP-06 pertenece a Producción Paralela y no es sucesor causal de P-SUP-05.",
    tooltip:
      "Cambio de rama. P-SUP-06 no depende de P-SUP-05. Producción Paralela se habilita desde Capa 1.0 cuando está disponible el mmabp_design_source_bundle.",
    detailTitle: "T05 · Cambio de rama",
    actions: [
      { id: "view_mdsb", label: "Ver MDSB" },
      { id: "view_scr_origin", label: "Ver SCR origen" },
      { id: "lateral_trace", label: "Ver trazabilidad lateral" },
      { id: "view_gaps", label: "Ver gaps de fuente" },
    ],
  },
  {
    transitionId: "T06",
    visualSourceProcessId: "P-SUP-06",
    visualTargetProcessId: "P-SUP-07/08",
    connectorKind: "synchronization",
    syncPattern: "trigger_and_wait",
    sourceObject: "InventarioMMABP",
    sourceTargetState: "Resolved",
    sourceObjectState: "InventarioMMABP [Resolved]",
    emittedEvent: "Solicitud de validación estructural",
    targetTrigger: "Solicitud de validación estructural",
    directDependency: true,
    sourceWaitsForTarget: true,
    branch: "parallel_production",
    awaitedFeedback: [
      "ArchitectureConsistencyAssessment [Satisfied]",
      "ArchitectureConsistencyAssessment [WithFindings]",
      "ArchitectureConsistencyAssessment [Blocked]",
    ],
    rework: {
      enabled: true,
      sourceProcessId: "P-SUP-07/08",
      sourceState: "ArchitectureConsistencyAssessment [WithFindings]",
      event: "Solicitud de corrección de inventario/diagramación",
      targetProcessId: "P-SUP-06",
    },
    secondaryBadge: "QA / Rework",
    timerPolicyHint: "max_tiempo_evaluacion_consistencia",
    tooltip:
      "P-SUP-06 solicita validación estructural y espera el resultado de QA. Satisfied habilita exportación. WithFindings devuelve rework. Blocked impide exportar.",
    detailTitle: "T06 · P-SUP-06 → P-SUP-07/08",
    actions: [
      { id: "view_aca", label: "Ver assessment" },
      { id: "open_rework", label: "Abrir rework" },
      { id: "view_findings", label: "Ver findings" },
      { id: "block_export", label: "Bloquear export" },
      { id: "history", label: "Ver historial" },
    ],
  },
  {
    transitionId: "T07",
    visualSourceProcessId: "P-SUP-07/08",
    visualTargetProcessId: "P-SUP-09",
    connectorKind: "synchronization",
    syncPattern: "fire_and_forget",
    sourceObject: "ArchitectureConsistencyAssessment",
    sourceTargetState: "Satisfied",
    sourceObjectState: "ArchitectureConsistencyAssessment [Satisfied]",
    emittedEvent: "Solicitud de generación de código exportable",
    targetTrigger: "Solicitud de generación de código exportable",
    directDependency: true,
    sourceWaitsForTarget: false,
    branch: "parallel_production",
    guard: {
      field: "architectureConsistencyAssessment.currentState",
      operator: "equals",
      expectedValue: "Satisfied",
    },
    tooltip:
      "QA completa con ACA [Satisfied] y habilita exportación. No espera la generación del código.",
    detailTitle: "T07 · P-SUP-07/08 → P-SUP-09",
    explanation:
      "P-SUP-09 no puede iniciar con findings ni estado blocked. ACA debe estar exactamente en [Satisfied].",
    actions: [
      { id: "generate_export", label: "Generar export" },
      { id: "view_aca", label: "Ver ACA" },
      { id: "view_b3_b7", label: "Ver validación B3/B7" },
      { id: "history", label: "Ver historial" },
    ],
  },
  {
    transitionId: "T08",
    visualSourceProcessId: "P-SUP-09",
    visualTargetProcessId: "P-CLIENT-01",
    connectorKind: "client_boundary",
    syncPattern: null,
    directDependency: false,
    visualAdjacencyOnly: true,
    actualRelatedProcessId: "P-CORE-01",
    secondaryBadge: "Sin dependencia directa",
    clientRelations: [
      {
        relation: "case_start",
        sourceProcessId: "P-CLIENT-01",
        targetProcessId: "P-CORE-01",
        sourceState: "ClientEngagement [DiagnosticAccepted]",
        event: "Solicitud diagnóstica aceptada",
        pattern: "trigger_and_wait",
      },
      {
        relation: "case_close",
        sourceProcessId: "P-CLIENT-01",
        targetProcessId: "P-CORE-01",
        sourceState: "ClientEngagement [ClosedWithDeliveredCase]",
        event: "Confirmación de entrega/cierre de caso",
        pattern: "wait_only",
      },
    ],
    explanation:
      "P-CLIENT-01 se sincroniza con P-CORE-01. No depende de P-SUP-09. ExportCodePackage [Generated] no cierra el caso ni el engagement.",
    tooltip:
      "Frontera cliente. P-CLIENT-01 no depende de ExportCodePackage [Generated]. La relación real es con P-CORE-01 durante la aceptación y el cierre.",
    detailTitle: "T08 · Frontera cliente",
    actions: [
      { id: "view_engagement", label: "Ver engagement" },
      { id: "view_acceptance", label: "Ver aceptación" },
      { id: "view_delivery", label: "Ver entrega" },
      { id: "confirm_close", label: "Confirmar cierre" },
      { id: "history", label: "Ver historial" },
    ],
  },
];

export function getTransition(transitionId: string): PMTransitionModel | undefined {
  return evePmTransitions.find((item) => item.transitionId === transitionId);
}

export function findTransitionBetween(
  visualSourceProcessId: string,
  visualTargetProcessId: string,
): PMTransitionModel | undefined {
  return evePmTransitions.find(
    (item) =>
      item.visualSourceProcessId === visualSourceProcessId &&
      item.visualTargetProcessId === visualTargetProcessId,
  );
}

export function hasDirectDependency(
  sourceProcessId: string,
  targetProcessId: string,
): boolean {
  return evePmTransitions.some(
    (item) =>
      item.visualSourceProcessId === sourceProcessId &&
      item.visualTargetProcessId === targetProcessId &&
      item.directDependency === true,
  );
}

export function connectorKindLabel(kind: PMConnectorKind): string {
  switch (kind) {
    case "synchronization":
      return "Sincronización";
    case "branch_boundary":
      return "Cambio de rama";
    case "client_boundary":
      return "Frontera cliente";
    default:
      return kind;
  }
}

export function branchLabel(branch: string | undefined): string {
  switch (branch) {
    case "diagnostic_main":
      return "Cadena diagnóstica";
    case "parallel_production":
      return "Producción Paralela";
    case "client_governance":
      return "Cliente / Core";
    default:
      return branch ?? "—";
  }
}

export function executionBoundaryLabel(boundary: string | undefined): string {
  switch (boundary) {
    case "platform_to_platform":
      return "Capa 1.0 · Plataforma";
    case "platform_to_manual":
      return "Plataforma → ejecución manual";
    case "manual_to_manual":
      return "Manual → Manual";
    default:
      return boundary ?? "—";
  }
}

export function syncPatternOrNa(pattern: PMSynchronizationPattern | null): string {
  if (!pattern) return "No aplica";
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

const ACA_BLOCKING = new Set([
  "ConformanceEvaluating",
  "ConsistencyEvaluating",
  "CompositeEvaluating",
  "WithFindings",
  "Blocked",
]);

export function resolveTransitionRuntimeStatus(
  transition: PMTransitionModel,
  hints?: {
    sourceOperationalState?: string | null;
    targetOperationalState?: string | null;
    acaState?: string | null;
    inventoryState?: string | null;
  },
): PMTransitionRuntimeStatus {
  if (transition.connectorKind !== "synchronization") {
    return "not_applicable";
  }

  if (
    transition.transitionId === "T02" ||
    transition.transitionId === "T03" ||
    transition.transitionId === "T04"
  ) {
    return "manual_pending";
  }

  if (transition.transitionId === "T06") {
    const inventory = hints?.inventoryState ?? hints?.sourceOperationalState ?? "";
    const aca = hints?.acaState ?? hints?.targetOperationalState ?? "";
    if (/WithFindings/i.test(aca)) return "rework_required";
    if (/Blocked/i.test(aca)) return "blocked";
    if (/Evaluating/i.test(aca)) return "waiting";
    if (/Satisfied/i.test(aca)) return "completed";
    if (/Resolved/i.test(inventory)) return "enabled";
    return "not_enabled";
  }

  if (transition.transitionId === "T07") {
    const aca = hints?.acaState ?? hints?.sourceOperationalState ?? "";
    const normalized = aca
      .replace(/^ArchitectureConsistencyAssessment\s*/i, "")
      .replace(/[\[\]]/g, "")
      .trim();
    if (/Satisfied/i.test(aca) || normalized === "Satisfied") return "enabled";
    if (ACA_BLOCKING.has(normalized) || /Evaluating|WithFindings|Blocked/i.test(aca)) {
      return "blocked";
    }
    return "not_enabled";
  }

  return "enabled";
}

export function runtimeStatusLabel(status: PMTransitionRuntimeStatus): string {
  switch (status) {
    case "not_enabled":
      return "No habilitada";
    case "enabled":
      return "Habilitada";
    case "waiting":
      return "En espera";
    case "completed":
      return "Completada";
    case "blocked":
      return "Bloqueada";
    case "manual_pending":
      return "Pendiente manual";
    case "rework_required":
      return "Rework requerido";
    case "not_applicable":
      return "No aplica";
    default:
      return status;
  }
}

export const PM_DEPENDENCY_GROUPS = [
  {
    id: "diagnostic_main",
    title: "Cadena diagnóstica",
    summary: "P-SUP-01 → P-SUP-02 → P-SUP-03 → P-SUP-04 → P-SUP-05",
    transitionIds: ["T01", "T02", "T03", "T04"] as const,
  },
  {
    id: "parallel_production",
    title: "Producción Paralela",
    summary: "SCR / MDSB → P-SUP-06 → P-SUP-07/08 → P-SUP-09",
    transitionIds: ["T06", "T07"] as const,
    note: "Origen lateral: SceneCanonicalRecord [Consolidated] → mmabp_design_source_bundle → P-SUP-06 (ver T05).",
  },
  {
    id: "rework",
    title: "Rework",
    summary: "P-SUP-07/08 → P-SUP-06",
    transitionIds: ["T06"] as const,
    focus: "rework" as const,
  },
  {
    id: "client",
    title: "Cliente",
    summary: "P-CLIENT-01 ↔ P-CORE-01",
    transitionIds: ["T08"] as const,
  },
] as const;
