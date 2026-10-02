/**
 * Columna vertebral SUP — objetos finales del PM Camunda EVE.
 * Fuente semántica: EVE_PM_Camunda_v0_3_0.bpmn (P-SUP-01…09).
 * Sin exportación productiva. Sin diagnóstico final automático.
 */

import type {
  DownloadAvailability,
  DownloadKind,
  SupDownloadMapping,
  SupEventObjectLink,
  SupFinalObjectCard,
  SupFinalObjectFixtureEntry,
  SupFinalObjectsBackboneState,
} from "./consultant-control-panel-types";

export const SUP_CAUSAL_CHAIN = [
  "SceneCanonicalRecord [Consolidated]",
  "EvidenceBundle [ReadyForTransduction]",
  "InventarioMMABP [Resolved]",
  "ArchitectureConsistencyAssessment [Satisfied]",
  "ExportCodePackage [Generated]",
] as const;

export const SUP_EVENT_TO_OBJECT_LINKS: SupEventObjectLink[] = [
  {
    causal_step: "actor_scene",
    feeds_sup_object: "SceneCanonicalRecord [Consolidated]",
    description:
      "Eventos actor/escena por activity_runtime_run alimentan SceneCanonicalRecord (P-SUP-01). Una o varias escenas candidatas pueden consolidarse; la unidad causal mínima es el run, no el rol aislado.",
  },
  {
    causal_step: "evidence",
    feeds_sup_object: "EvidenceBundle [ReadyForTransduction]",
    description:
      "Evidence items alimentan EvidenceBundle (P-SUP-02) antes de transducción.",
  },
  {
    causal_step: "variable_or_gap",
    feeds_sup_object: "InventarioMMABP [Resolved]",
    description:
      "Variables y gaps alimentan InventarioMMABP (P-SUP-06).",
  },
  {
    causal_step: "gate_or_readiness",
    feeds_sup_object: "ArchitectureConsistencyAssessment [Satisfied]",
    description:
      "Gates y readiness alimentan ArchitectureConsistencyAssessment (P-SUP-07/08).",
  },
  {
    causal_step: "authorized_output",
    feeds_sup_object: "ExportCodePackage [Generated]",
    description:
      "Salida autorizada prepara ExportCodePackage (P-SUP-09) sin exportación productiva.",
  },
];

export const SUP_DOWNLOAD_MAPPINGS: SupDownloadMapping[] = [
  {
    kind: "questions_answers_excel",
    label: "Excel de preguntas y respuestas del cliente",
    maps_to: "insumo auxiliar, no objeto SUP final",
    role: "auxiliary_input",
  },
  {
    kind: "pathology_map_report",
    label: "Reporte de mapa de patología / señales candidatas",
    maps_to: "insumo consultor, no diagnóstico final automático",
    role: "consultant_input",
  },
  {
    kind: "mba_camunda_templates",
    label: "Producción Paralela / Camunda",
    maps_to: "BPMNCodePackage [ReadyForCamunda]",
    role: "sup_final_object",
  },
  {
    kind: "evidence_traceability_bundle",
    label: "Insumo manual Capa 2.0; no ejecuta transducción",
    maps_to: "EvidenceBundle [ReadyForTransduction]",
    role: "sup_final_object",
  },
  {
    kind: "consultant_packet",
    label: "Consultant packet",
    maps_to: "síntesis consultor controlada",
    role: "consultant_synthesis",
  },
  {
    kind: "gate_readiness_report",
    label: "Gate / Readiness Report",
    maps_to: "ArchitectureConsistencyAssessment [Satisfied]",
    role: "sup_final_object",
  },
  {
    kind: "audit_trail",
    label: "Descarga operativa Capa 1.0 / Runtime",
    maps_to: "runtime_audit_trail",
    role: "runtime_audit",
  },
  {
    kind: "canonical_variables_gaps",
    label: "Gaps y reentry; no diagnóstico",
    maps_to: "insumo de InventarioMMABP [Resolved]",
    role: "mmabp_input",
  },
  {
    kind: "capa_2_0_manual_workbook",
    label: "Capa 2.0 — Excel manual",
    maps_to: "plantilla manual Capa 2.0",
    role: "manual_downstream",
  },
  {
    kind: "capa_2_5_manual_workbook",
    label: "Capa 2.5 — Excel manual",
    maps_to: "plantilla manual Capa 2.5",
    role: "manual_downstream",
  },
  {
    kind: "capa_3_0_manual_workbook",
    label: "Capa 3.0 — Paquete manual de síntesis experta",
    maps_to: "plantilla manual Capa 3.0",
    role: "manual_downstream",
  },
  {
    kind: "runtime_audit_xlsx",
    label: "Runtime 40+20 audit trail",
    maps_to: "runtime_audit_trail",
    role: "runtime_audit",
  },
  {
    kind: "gaps_package",
    label: "Paquete de gaps",
    maps_to: "insumo de InventarioMMABP [Resolved]",
    role: "mmabp_input",
  },
  {
    kind: "mdsb_parallel_production",
    label: "Producción Paralela — MDSB / registries / IR",
    maps_to: "InventarioMMABP [Resolved]",
    role: "sup_final_object",
  },
];

const DOWNLOAD_LABEL_BY_KIND: Record<DownloadKind, string> = Object.fromEntries(
  SUP_DOWNLOAD_MAPPINGS.map((item) => [item.kind, item.label]),
) as Record<DownloadKind, string>;

const TAXONOMY_BY_KIND: Partial<
  Record<
    DownloadKind,
    {
      taxonomy: DownloadAvailability["taxonomy"];
      eligibility: DownloadAvailability["eligibility"];
      scope_badge: DownloadAvailability["scope_badge"];
    }
  >
> = {
  capa_2_0_manual_workbook: {
    taxonomy: "manual_downstream_template",
    eligibility: "generator_unavailable",
    scope_badge: "Descargable manual",
  },
  capa_2_5_manual_workbook: {
    taxonomy: "manual_downstream_template",
    eligibility: "pending_manual",
    scope_badge: "Descargable manual",
  },
  capa_3_0_manual_workbook: {
    taxonomy: "manual_downstream_template",
    eligibility: "pending_manual",
    scope_badge: "Descargable manual",
  },
  evidence_traceability_bundle: {
    taxonomy: "platform_manual_input",
    eligibility: "generator_unavailable",
    scope_badge: "Descargable manual",
  },
  mba_camunda_templates: {
    taxonomy: "parallel_production_operational",
    eligibility: "blocked",
    scope_badge: "Operativo",
  },
  mdsb_parallel_production: {
    taxonomy: "parallel_production_operational",
    eligibility: "generator_unavailable",
    scope_badge: "Operativo",
  },
  runtime_audit_xlsx: {
    taxonomy: "platform_manual_input",
    eligibility: "generator_unavailable",
    scope_badge: "Operativo",
  },
  audit_trail: {
    taxonomy: "platform_manual_input",
    eligibility: "generator_unavailable",
    scope_badge: "Operativo",
  },
  gaps_package: {
    taxonomy: "platform_manual_input",
    eligibility: "generator_unavailable",
    scope_badge: "Descargable manual",
  },
};

export function buildDownloadsWithSupMapping(): DownloadAvailability[] {
  return SUP_DOWNLOAD_MAPPINGS.map((item) => {
    const meta = TAXONOMY_BY_KIND[item.kind];
    return {
      kind: item.kind,
      label: item.label,
      enabled: false,
      status: "pending_authorized_generator" as const,
      buttonLabel: "No disponible todavía",
      reason_if_disabled: "Pendiente de generador autorizado",
      requires_authority: true as const,
      requires_audit_trail: true as const,
      finalDiagnosisAutomaticAllowed: false as const,
      productiveExportAllowed: false as const,
      sup_maps_to: item.maps_to,
      sup_mapping_role: item.role,
      taxonomy: meta?.taxonomy ?? "platform_manual_input",
      eligibility: meta?.eligibility ?? "generator_unavailable",
      generator_status: "unavailable" as const,
      non_automatic_execution_flag: true as const,
      scope_badge: meta?.scope_badge ?? "Descargable manual",
    };
  });
}

type BackboneMode = "empty" | "ambar_fixture";

function buildSupCards(mode: BackboneMode): SupFinalObjectCard[] {
  const isFixture = mode === "ambar_fixture";
  // Fixture timeline anchored to Ámbar operational trace / panel observation window.
  const t = {
    scrDone: "2026-07-10T15:20:00.000Z",
    bundleFlagsSince: "2026-07-10T16:05:00.000Z",
    inventarioPartialSince: "2026-07-11T10:30:00.000Z",
    qaFlagsSince: "2026-07-11T14:15:00.000Z",
    exportReady: "2026-07-11T18:40:00.000Z",
  };

  return [
    {
      code: "P-SUP-01",
      capability: "Consolidar escena operativa regulada",
      finalObject: "SceneCanonicalRecord",
      state: isFixture ? "Consolidated" : "Pending",
      status: isFixture ? "ready" : "pending_scope",
      consultantUse:
        "SceneCanonicalRecord puede consolidar una o varias escenas candidatas. La unidad causal mínima es el activity_runtime_run, no el rol aislado.",
      previousDependency: null,
      blockOrWarning: isFixture
        ? "Escenas candidatas A4 / B1 / C3 alimentan consolidación multi-run (sin diagnóstico final automático)."
        : null,
      associatedDownload: null,
      authorityRequired: true,
      status_since: isFixture ? t.scrDone : null,
      completed_at: isFixture ? t.scrDone : null,
    },
    {
      code: "P-SUP-02",
      capability: "Preparar EvidenceBundle para transducción",
      finalObject: "EvidenceBundle",
      state: isFixture ? "ReadyForTransduction" : "Pending",
      status: isFixture ? "ready_with_flags" : "pending_scope",
      consultantUse: "ver evidencia trazable antes de transducción causal",
      previousDependency: "SceneCanonicalRecord [Consolidated]",
      blockOrWarning: isFixture
        ? "Flags de evidencia incompleta en algunas actividades (revisión consultor)."
        : null,
      associatedDownload: DOWNLOAD_LABEL_BY_KIND.evidence_traceability_bundle,
      authorityRequired: true,
      status_since: isFixture ? t.bundleFlagsSince : null,
      completed_at: null,
    },
    {
      code: "P-SUP-06",
      capability: "Producir inventario MMABP y diagramación",
      finalObject: "InventarioMMABP",
      state: isFixture ? "Resolved" : "Pending",
      status: isFixture ? "partial_ready" : "pending_scope",
      consultantUse: "revisar objetos, procesos, estados y candidates MMABP",
      previousDependency: "EvidenceBundle [ReadyForTransduction]",
      blockOrWarning: isFixture
        ? "Inventario parcial: gaps abiertos alimentan P-SUP-07/08."
        : null,
      associatedDownload: DOWNLOAD_LABEL_BY_KIND.canonical_variables_gaps,
      authorityRequired: true,
      status_since: isFixture ? t.inventarioPartialSince : null,
      completed_at: null,
    },
    {
      code: "P-SUP-07/08",
      capability: "Resolver gaps y validar consistencia",
      finalObject: "ArchitectureConsistencyAssessment",
      state: isFixture ? "Satisfied" : "Pending",
      status: isFixture ? "satisfied_with_flags" : "pending_scope",
      consultantUse:
        "ver conformance, consistencia factual, temporal, estructural y compuesta",
      previousDependency: "InventarioMMABP [Resolved]",
      blockOrWarning: isFixture
        ? "Satisfied with flags: B3/C09 warning · B7/C20 blocked (sin diagnóstico final automático)."
        : null,
      associatedDownload: DOWNLOAD_LABEL_BY_KIND.gate_readiness_report,
      authorityRequired: true,
      status_since: isFixture ? t.qaFlagsSince : null,
      completed_at: null,
    },
    {
      code: "P-SUP-09",
      capability: "Generar código exportable Camunda / Enterprise Architect",
      finalObject: "ExportCodePackage",
      state: isFixture ? "Generated" : "Pending",
      status: isFixture ? "generated_but_export_disabled" : "pending_scope",
      consultantUse: "preparar salida Camunda/EA sin exportación productiva",
      previousDependency: "ArchitectureConsistencyAssessment [Satisfied]",
      blockOrWarning:
        "Exportación productiva bloqueada · BPMN/PlantUML solo preparación consultor.",
      associatedDownload: DOWNLOAD_LABEL_BY_KIND.mba_camunda_templates,
      authorityRequired: true,
      status_since: isFixture ? t.exportReady : null,
      completed_at: isFixture ? t.exportReady : null,
      subObjects: [
        {
          name: "BPMNCodePackage",
          state: "ReadyForCamunda",
        },
        {
          name: "PlantUMLCodePackage",
          state: "ReadyForEnterpriseArchitect",
        },
      ],
    },
  ];
}

function toFixtureEntries(cards: SupFinalObjectCard[]): SupFinalObjectFixtureEntry[] {
  return cards.map((card) => ({
    code: card.code,
    capability: card.capability,
    finalObject: card.finalObject,
    state: card.state,
    status: card.status,
    consultantUse: card.consultantUse,
  }));
}

export function buildSupFinalObjectsBackbone(
  mode: BackboneMode = "empty",
): SupFinalObjectsBackboneState {
  const objects = buildSupCards(mode);
  return {
    title: "Columna vertebral SUP — objetos finales para consultor experto",
    causal_purpose:
      "Cadena causal de objetos finales del PM Camunda EVE (P-SUP) para gobernanza consultor, sin exportación productiva ni diagnóstico final automático.",
    causal_chain: [...SUP_CAUSAL_CHAIN],
    objects,
    supFinalObjects: toFixtureEntries(objects),
    event_to_sup_links: SUP_EVENT_TO_OBJECT_LINKS,
    download_to_sup_mappings: SUP_DOWNLOAD_MAPPINGS,
    productive_export_blocked: true,
    final_diagnosis_automatic_blocked: true,
  };
}
