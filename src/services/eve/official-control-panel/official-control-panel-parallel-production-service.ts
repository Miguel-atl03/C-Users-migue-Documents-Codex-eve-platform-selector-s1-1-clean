import type { OfficialControlPanelContextRepository } from "./official-control-panel-context.types";
import { assertConsultantCaseSupportProcessAccess } from "./official-control-panel-support-process-service";
import type {
  ParallelProductionFindingRow,
  ParallelProductionPackageEventRow,
  ParallelProductionPackageRow,
  ParallelProductionRepository,
} from "./official-control-panel-parallel-production-repository";
import {
  type ParallelProductionAlertView,
  type ParallelProductionEvalStatus,
  type ParallelProductionFindingStatus,
  type ParallelProductionFindingType,
  type ParallelProductionFindingView,
  type ParallelProductionLayerDisplayStatus,
  type ParallelProductionLayerView,
  type ParallelProductionPackageEventView,
  type ParallelProductionPackageStatus,
  type ParallelProductionPackageView,
  type ParallelProductionTrackingResponse,
  type ParallelProductionAcaStatus,
  type ParallelProductionExportEligibility,
  type ParallelProductionReadinessStatus,
} from "./official-control-panel-parallel-production.types";

const CP012_FACTUAL_PRODUCER_BLOCK_REASON =
  "CP-012 BLOQUEADO: el repositorio controla el orden, pero no materializa todavia una evaluacion factual MMABP suficiente.";

const EMPTY_MESSAGE =
  "Aún no iniciada.";

export async function loadParallelProductionForCase(input: {
  contextRepository: OfficialControlPanelContextRepository;
  parallelProductionRepository: ParallelProductionRepository;
  consultantUserId: string;
  caseId: string;
  companyId: string;
  relationshipId: string;
}): Promise<
  | { ok: true; body: ParallelProductionTrackingResponse }
  | { ok: false; status: number; code: string; message: string }
> {
  const access = await assertConsultantCaseSupportProcessAccess(
    input.contextRepository,
    {
      consultantUserId: input.consultantUserId,
      companyId: input.companyId,
      relationshipId: input.relationshipId,
      caseId: input.caseId,
    },
  );
  if (!access.ok) {
    return {
      ok: false,
      status: access.status,
      code: access.code,
      message: access.message,
    };
  }

  try {
    const pkg =
      await input.parallelProductionRepository.getCurrentPackageForCase(
        input.caseId,
      );
    if (!pkg) {
      return {
        ok: true,
        body: {
          caseId: input.caseId,
          companyId: input.companyId,
          dataStatus: "empty",
          emptyMessage: EMPTY_MESSAGE,
          package: null,
          alerts: [],
          generatedAt: new Date().toISOString(),
        },
      };
    }

    const [events, findings] = await Promise.all([
      input.parallelProductionRepository.listEventsForPackage(pkg.id),
      input.parallelProductionRepository.listFindingsForPackage(pkg.id),
    ]);

    const view = buildPackageView(pkg, events, findings);
    const alerts = buildAlerts(view);

    return {
      ok: true,
      body: {
        caseId: input.caseId,
        companyId: input.companyId,
        dataStatus: "available",
        emptyMessage: null,
        package: view,
        alerts,
        generatedAt: new Date().toISOString(),
      },
    };
  } catch {
    console.error("[official-control-panel-parallel-production] degraded", {
      code: "parallel_production_repository_degraded",
      caseId: input.caseId,
    });
    return {
      ok: true,
      body: {
        caseId: input.caseId,
        companyId: input.companyId,
        dataStatus: "error",
        emptyMessage: "No fue posible cargar la produccion paralela del caso.",
        package: null,
        alerts: [],
        generatedAt: new Date().toISOString(),
      },
    };
  }
}

function buildPackageView(
  pkg: ParallelProductionPackageRow,
  events: ParallelProductionPackageEventRow[],
  findings: ParallelProductionFindingRow[],
): ParallelProductionPackageView {
  const findingViews = findings.map(mapFinding);
  const open = findingViews.filter((f) => f.findingStatus !== "resolved");
  const resolved = findingViews.filter((f) => f.findingStatus === "resolved");

  return {
    id: pkg.id,
    packageRef: pkg.package_ref,
    packageStatus: pkg.package_status as ParallelProductionPackageStatus,
    readinessStatus: (pkg.readiness_status ??
      null) as ParallelProductionReadinessStatus | null,
    acaStatus: (pkg.aca_status ?? null) as ParallelProductionAcaStatus | null,
    conformanceStatus: pkg.conformance_status as ParallelProductionEvalStatus,
    consistencyFactualStatus:
      pkg.consistency_factual_status as ParallelProductionEvalStatus,
    consistencyTemporalStatus:
      pkg.consistency_temporal_status as ParallelProductionEvalStatus,
    consistencyStructuralStatus:
      pkg.consistency_structural_status as ParallelProductionEvalStatus,
    consistencyCompositeStatus:
      pkg.consistency_composite_status as ParallelProductionEvalStatus,
    b3RouteException: pkg.b3_route_exception,
    b7BoundaryViolation: pkg.b7_boundary_violation,
    exportEligibility:
      pkg.export_eligibility as ParallelProductionExportEligibility,
    generatorAvailable: pkg.generator_available,
    exportGenerationStatus: pkg.export_generation_status,
    reworkProcessCode:
      pkg.rework_process_code === "P-SUP-06" ? "P-SUP-06" : null,
    layers: buildLayers(pkg),
    findingsOpen: open,
    findingsResolved: resolved,
    timeline: events.map(mapEvent),
    assessmentActions: buildAssessmentActions(),
    assessmentBlockReason: CP012_FACTUAL_PRODUCER_BLOCK_REASON,
    version: pkg.version,
    lastEventAt: pkg.last_event_at,
  };
}

function buildAssessmentActions(): ParallelProductionPackageView["assessmentActions"] {
  return {
    startConformance: false,
    completeConformance: false,
    startConsistency: false,
    completeConsistency: false,
  };
}

function buildLayers(
  pkg: ParallelProductionPackageRow,
): ParallelProductionLayerView[] {
  return [
    layer("source_bundle", "Paquete fuente", pkg.source_bundle_ref, pkg),
    layer("candidates", "Candidatos", pkg.candidates_ref, pkg),
    layer("facts", "Hechos consolidados", pkg.facts_ref, pkg),
    layer("registries", "Registros arquitectónicos", pkg.registries_ref, pkg),
    layer("ir", "Representación intermedia", pkg.ir_ref, pkg),
    layer("inventory", "Inventario", pkg.inventory_ref, pkg),
    {
      key: "qa",
      label: "QA",
      displayStatus: qaLayerStatus(pkg),
      message: qaLayerMessage(pkg),
      ref: pkg.aca_status,
    },
    {
      key: "export",
      label: "Exportación",
      displayStatus: exportLayerStatus(pkg),
      message: exportLayerMessage(pkg),
      ref: pkg.export_eligibility,
    },
  ];
}

function layer(
  key: ParallelProductionLayerView["key"],
  label: string,
  ref: string | null,
  pkg: ParallelProductionPackageRow,
): ParallelProductionLayerView {
  if (pkg.package_status === "blocked") {
    return {
      key,
      label,
      displayStatus: "blocked",
      message: "Bloqueado por condición factual del paquete.",
      ref,
    };
  }
  if (!ref) {
    if (
      pkg.package_status === "received" ||
      pkg.package_status === "validated"
    ) {
      return {
        key,
        label,
        displayStatus: "not_evaluated",
        message: "Aún no evaluado en este paquete.",
        ref: null,
      };
    }
    return {
      key,
      label,
      displayStatus: "empty",
      message: "Sin registros.",
      ref: null,
    };
  }
  return {
    key,
    label,
    displayStatus: "available",
    message: null,
    ref,
  };
}

function qaLayerStatus(
  pkg: ParallelProductionPackageRow,
): ParallelProductionLayerDisplayStatus {
  if (pkg.package_status === "blocked" || pkg.aca_status === "Blocked") {
    return "blocked";
  }
  if (pkg.conformance_status === "not_evaluated") return "not_evaluated";
  if (
    pkg.aca_status === "WithFindings" ||
    pkg.conformance_status === "failed" ||
    pkg.consistency_composite_status === "failed"
  ) {
    return "incomplete";
  }
  if (pkg.aca_status === "Satisfied") return "available";
  return "incomplete";
}

function qaLayerMessage(pkg: ParallelProductionPackageRow): string | null {
  if (pkg.aca_status === "WithFindings") {
    return "Hay findings abiertos. El rework autorizado es P-SUP-06.";
  }
  if (pkg.aca_status === "Satisfied") {
    return "Evaluación compuesta satisfecha.";
  }
  if (pkg.conformance_status === "not_evaluated") {
    return "Conformidad aún no evaluada (precede a consistencia).";
  }
  return null;
}

function exportLayerStatus(
  pkg: ParallelProductionPackageRow,
): ParallelProductionLayerDisplayStatus {
  if (pkg.export_eligibility === "blocked") return "blocked";
  if (pkg.export_eligibility === "eligible") {
    return pkg.generator_available ? "available" : "incomplete";
  }
  return "not_evaluated";
}

function exportLayerMessage(pkg: ParallelProductionPackageRow): string | null {
  if (pkg.export_eligibility === "eligible" && !pkg.generator_available) {
    return "Elegible para exportación. Generador no disponible.";
  }
  if (pkg.export_eligibility === "blocked") {
    return "Exportación bloqueada por QA o excepciones de ruta/frontera.";
  }
  return null;
}

function mapFinding(row: ParallelProductionFindingRow): ParallelProductionFindingView {
  return {
    id: row.id,
    findingType: row.finding_type as ParallelProductionFindingType,
    affectedModel: row.affected_model,
    severity: row.severity,
    evidenceRef: row.evidence_ref,
    origin: row.origin,
    findingStatus: row.finding_status as ParallelProductionFindingStatus,
    reworkProcessCode: "P-SUP-06",
    blocking: row.blocking,
    resolutionRef: row.resolution_ref,
    openedAt: row.opened_at,
    resolvedAt: row.resolved_at,
  };
}

function mapEvent(
  row: ParallelProductionPackageEventRow,
): ParallelProductionPackageEventView {
  return {
    id: row.id,
    eventType: row.event_type,
    actorLabel: row.actor_label,
    occurredAt: row.occurred_at,
    beforeStatus: row.before_status,
    afterStatus: row.after_status,
    reason: row.reason,
    evidenceRef: row.evidence_ref,
  };
}

function buildAlerts(
  pkg: ParallelProductionPackageView,
): ParallelProductionAlertView[] {
  const alerts: ParallelProductionAlertView[] = [];
  if (pkg.acaStatus === "WithFindings" || pkg.findingsOpen.length > 0) {
    alerts.push({
      code: "qa_with_findings",
      title: "QA con findings",
      packageId: pkg.id,
      packageRef: pkg.packageRef,
      detail: `${pkg.findingsOpen.length} finding(s) abiertos. Rework: P-SUP-06.`,
      blocking: pkg.findingsOpen.some((f) => f.blocking),
    });
  }
  if (pkg.b3RouteException) {
    alerts.push({
      code: "b3_route_exception",
      title: "Excepción de ruta B3",
      packageId: pkg.id,
      packageRef: pkg.packageRef,
      detail: "Falta ruta canónica para feedback operativo.",
      blocking: true,
    });
  }
  if (pkg.b7BoundaryViolation) {
    alerts.push({
      code: "b7_boundary_violation",
      title: "Violación de frontera B7",
      packageId: pkg.id,
      packageRef: pkg.packageRef,
      detail: "Señal no diagnóstica de frontera. No habilita exportación.",
      blocking: true,
    });
  }
  if (pkg.packageStatus === "in_rework" || pkg.reworkProcessCode === "P-SUP-06") {
    if (pkg.findingsOpen.length > 0) {
      alerts.push({
        code: "rework_required",
        title: "Rework requerido",
        packageId: pkg.id,
        packageRef: pkg.packageRef,
        detail: "Findings de diseño regresan a P-SUP-06.",
        blocking: false,
      });
    }
  }
  if (pkg.exportEligibility === "blocked") {
    alerts.push({
      code: "export_blocked",
      title: "Exportación bloqueada",
      packageId: pkg.id,
      packageRef: pkg.packageRef,
      detail: "La exportación solo procede con QA satisfecha y sin excepciones.",
      blocking: true,
    });
  }
  if (
    pkg.conformanceStatus === "not_evaluated" &&
    pkg.packageStatus !== "received"
  ) {
    alerts.push({
      code: "qa_pending",
      title: "QA pendiente",
      packageId: pkg.id,
      packageRef: pkg.packageRef,
      detail: "Conformidad aún no evaluada.",
      blocking: false,
    });
  }
  if (pkg.assessmentBlockReason) {
    alerts.push({
      code: "cp012_factual_producer_unavailable",
      title: "CP-012 bloqueado",
      packageId: pkg.id,
      packageRef: pkg.packageRef,
      detail: pkg.assessmentBlockReason,
      blocking: true,
    });
  }
  return alerts;
}
