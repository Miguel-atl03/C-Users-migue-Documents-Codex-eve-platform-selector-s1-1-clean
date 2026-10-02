import type {
  ParallelProductionEvalStatus,
  ParallelProductionFindingStatus,
  ParallelProductionFindingType,
  ParallelProductionLayerDisplayStatus,
  ParallelProductionPackageStatus,
  ParallelProductionReadinessStatus,
} from "@/services/eve/official-control-panel/official-control-panel-parallel-production.types";

export const PP_INTRO_COPY =
  "Este panel observa el estado factual de Producción Paralela y QA. No crea diagnóstico ni corrige semántica.";

export function presentPackageStatus(
  status: ParallelProductionPackageStatus,
): string {
  const map: Record<ParallelProductionPackageStatus, string> = {
    received: "Recibido",
    validated: "Validado",
    processing: "En procesamiento",
    with_findings: "Con findings",
    in_rework: "En rework",
    satisfied: "Satisfecho",
    blocked: "Bloqueado",
    export_eligible: "Elegible para exportación",
    export_not_eligible: "No elegible para exportación",
  };
  return map[status] ?? status;
}

export function presentReadinessStatus(
  status: ParallelProductionReadinessStatus | null,
): string {
  if (!status) return "Sin readiness";
  const map: Record<ParallelProductionReadinessStatus, string> = {
    ready: "Listo",
    ready_with_flags: "Listo con banderas",
    blocked_by_missing_evidence: "Bloqueado por evidencia faltante",
    blocked_by_contradiction: "Bloqueado por contradicción",
    blocked_by_missing_canonical_route: "Bloqueado por ruta canónica faltante",
    manual_review_required: "Requiere revisión manual",
    reentry_required: "Requiere reentry",
  };
  return map[status] ?? status;
}

export function presentEvalStatus(status: ParallelProductionEvalStatus): string {
  const map: Record<ParallelProductionEvalStatus, string> = {
    not_evaluated: "No evaluado",
    passed: "Aprobado",
    failed: "Fallido",
    blocked: "Bloqueado",
  };
  return map[status] ?? status;
}

export function presentFindingType(type: ParallelProductionFindingType): string {
  const map: Record<ParallelProductionFindingType, string> = {
    conformance: "Conformidad",
    factual_consistency: "Consistencia factual",
    temporal_consistency: "Consistencia temporal",
    structural_consistency: "Consistencia estructural",
    composite_consistency: "Consistencia compuesta",
    b3_route_exception: "Excepción de ruta B3",
    b7_boundary_violation: "Violación de frontera B7",
  };
  return map[type] ?? type;
}

export function presentFindingStatus(
  status: ParallelProductionFindingStatus,
): string {
  const map: Record<ParallelProductionFindingStatus, string> = {
    open: "Abierto",
    rework_requested: "Rework solicitado",
    rework_started: "Rework iniciado",
    rework_submitted: "Rework enviado",
    reevaluation_started: "Reevaluación iniciada",
    reevaluation_completed: "Reevaluación completada",
    resolved: "Resuelto",
    reopened: "Reabierto",
  };
  return map[status] ?? status;
}

export function presentLayerDisplayStatus(
  status: ParallelProductionLayerDisplayStatus,
): string {
  const map: Record<ParallelProductionLayerDisplayStatus, string> = {
    empty: "Sin registros",
    not_evaluated: "No evaluado",
    incomplete: "Datos incompletos",
    blocked: "Bloqueado",
    available: "Disponible",
    error: "Error técnico",
  };
  return map[status] ?? status;
}

export function presentAcaStatus(status: string | null): string {
  if (!status) return "Sin evaluación compuesta";
  if (status === "Satisfied") return "Satisfecho";
  if (status === "WithFindings") return "Con findings";
  if (status === "Blocked") return "Bloqueado";
  return status;
}

export function presentPackageEventType(eventType: string): string {
  const map: Record<string, string> = {
    package_received: "Paquete recibido",
    package_validated: "Paquete validado",
    processing_started: "Procesamiento iniciado",
    candidates_extracted: "Candidatos extraídos",
    facts_consolidated: "Hechos consolidados",
    registries_built: "Registros construidos",
    ir_projected: "Representación intermedia proyectada",
    inventory_resolved: "Inventario resuelto",
    conformance_started: "Conformidad iniciada",
    conformance_completed: "Conformidad completada",
    conformance_blocked: "Conformidad bloqueada",
    conformance_evaluated: "Conformidad evaluada",
    consistency_started: "Consistencia iniciada",
    consistency_completed: "Consistencia completada",
    consistency_blocked: "Consistencia bloqueada",
    consistency_evaluated: "Consistencia evaluada",
    composite_evaluated: "Evaluación compuesta",
    findings_opened: "Findings abiertos",
    rework_requested: "Rework solicitado",
    rework_started: "Rework iniciado",
    rework_submitted: "Rework enviado",
    reevaluation_started: "Reevaluación iniciada",
    reevaluation_completed: "Reevaluación completada",
    qa_satisfied: "QA satisfecha",
    package_blocked: "Paquete bloqueado",
    export_eligible: "Exportación elegible",
    export_blocked: "Exportación bloqueada",
    b3_route_exception: "Excepción de ruta B3",
    b7_boundary_violation: "Violación de frontera B7",
  };
  return map[eventType] ?? eventType;
}
