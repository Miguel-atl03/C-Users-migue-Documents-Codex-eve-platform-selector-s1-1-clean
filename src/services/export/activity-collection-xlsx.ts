import type { SessionExportPayload } from "@/domain/export";
import {
  activityCollectionExportMap,
} from "@/services/export/activity-export-template-map";
import { createXlsxWorkbook, type XlsxSheet } from "@/services/export/minimal-xlsx";
import { consolidateSessionExportPayload } from "@/services/export/session-export-consolidator";
import { populateActivityCollectionTemplate } from "@/services/export/xlsx-template";

const joinList = (items: string[]) => items.filter(Boolean).join("\n");

const safeFilePart = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "-");

const keyValueRows = (items: [string, string | number | null | undefined][]) => [
  ["Campo", "Valor"],
  ...items.map(([key, value]) => [key, value ?? ""]),
];

const buildSheets = (payload: SessionExportPayload): XlsxSheet[] => [
  {
    name: "RESUMEN_SESION",
    rows: keyValueRows([
      ["feature", payload.featureName],
      ["sessionId", payload.sessionId],
      ["exportGeneratedAt", payload.exportGeneratedAt],
      ["templateFileName", payload.templateFileName],
      ["templateStrategy", payload.templateStrategy],
      ["sessionStatus", payload.finalOutput.session_status],
      ["closureQuality", payload.finalOutput.session_closure_quality],
      ["totalSupportIterations", payload.finalOutput.total_support_iterations],
      ["mainActivitiesUsed", payload.finalOutput.main_activities_used.length],
      ["supportActivitiesUsed", payload.finalOutput.support_activities_used.length],
      ["consistencyAlerts", payload.finalOutput.consistency_alerts_global.length],
      ["coachB0Q02Events", payload.operationalDescriptionCoachTraces.length],
      ["significadoBlock0Answers", payload.significadoBlock0Answers.length],
      ["unresolvedGaps", joinList(payload.finalOutput.unresolved_gaps_global)],
      ["sessionCreatedAt", payload.sessionMetadata.createdAt],
      ["sessionUpdatedAt", payload.sessionMetadata.updatedAt],
      ["assumptions", joinList(payload.assumptions)],
    ]),
  },
  {
    name: "ACTIVIDADES",
    rows: [
      [
        "Orden",
        "Tipo",
        "Actividad",
        "Recomendacion estructural",
        "Score",
        "Cobertura",
        "Estado de cierre",
        "Calidad de cierre",
        "Confianza",
        "Mision final",
        "Alertas",
        "Creada en",
      ],
      ...payload.activities.map((activity) => [
        activity.order,
        activity.role,
        activity.text,
        activity.structuralRecommendation,
        activity.rankingScore,
        activity.coverageRatio,
        activity.closureState,
        activity.closureQuality,
        activity.closureConfidence,
        activity.missionFinal,
        activity.consistencyAlertCount,
        activity.createdAt,
      ]),
    ],
  },
  {
    name: "CUESTIONARIO",
    rows: [
      [
        "Actividad",
        "Tipo actividad",
        "Bloque",
        "Codigo",
        "Pregunta",
        "Tipo campo",
        "Valor seleccionado",
        "Etiqueta seleccionada",
        "Texto libre",
        "Respuesta reconstruida",
        "Procedencia",
        "Fecha fuente",
      ],
      ...payload.questionnaireAnswers.map((answer) => [
        answer.activityOrder,
        answer.activityRole,
        answer.blockName,
        answer.questionCode,
        answer.questionText,
        answer.fieldType,
        answer.selectedValue,
        answer.selectedLabel,
        answer.freeText,
        answer.answerText,
        answer.provenance.source,
        answer.provenance.capturedAt,
      ]),
    ],
  },
  {
    name: "MISION_INFERIDA",
    rows: [
      [
        "Actividad",
        "Texto",
        "Mision inferida",
        "Mision final",
        "Confianza",
        "Razon de confianza",
        "Evidencia",
        "Conflictos",
        "Confirmacion usuario",
        "Override usuario",
      ],
      ...payload.diagnostic.activities.map((activity, index) => [
        index + 1,
        activity.activityText,
        activity.mission.mission_inferred_by_ai,
        activity.mission.mission_final,
        activity.mission.mission_confidence,
        activity.mission.mission_confidence_reason,
        joinList(
          activity.mission.mission_evidence.map(
            (evidence) =>
              `${evidence.questionCode}: ${evidence.fragment} (${evidence.reason})`,
          ),
        ),
        joinList(activity.mission.mission_conflict_flags),
        activity.mission.mission_user_confirmation_status,
        activity.mission.mission_user_override,
      ]),
    ],
  },
  {
    name: "CONSISTENCIA",
    rows: [
      [
        "Actividad",
        "Texto",
        "Nivel",
        "Titulo",
        "Mensaje",
        "Evidencia",
        "Calidad cierre",
        "Requiere aclaracion",
        "Prompt aclaracion",
        "Razon aclaracion",
        "Respuesta aclaracion",
      ],
      ...payload.consistencyTraces.map((trace) => [
        payload.activities.find((activity) => activity.activityId === trace.activityId)
          ?.order ?? "",
        trace.activityText,
        trace.alert.level,
        trace.alert.title,
        trace.alert.message,
        joinList(trace.alert.evidence),
        trace.closureQualityStatus,
        trace.clarificationRequired,
        trace.clarificationPrompt,
        trace.clarificationReason,
        trace.clarificationResponse,
      ]),
    ],
  },
  {
    name: "COACH_B0Q02",
    rows: [
      [
        "Actividad",
        "WorkMap activityId",
        "Fecha",
        "Fuente coach",
        "Borrador (snippet)",
        "Hash borrador",
        "Mensaje coach",
        "Ejemplo incremental",
        "Suficiencia",
        "Brecha prioritaria",
        "Nivel coach",
        "Modo narrativo",
        "EventId",
      ],
      ...payload.operationalDescriptionCoachTraces.map((trace) => [
        trace.activityOrder,
        trace.workMapActivityId,
        trace.occurredAt,
        trace.coachSource,
        trace.draftTextSnippet,
        trace.draftTextHash,
        trace.coachMessage,
        trace.exampleFragment,
        trace.sufficiency,
        trace.priorityGap,
        trace.coachTier,
        trace.narrativeMode,
        trace.eventId,
      ]),
    ],
  },
  {
    name: "SIGNIFICADO_BLOCK0",
    rows: [
      [
        "Actividad",
        "Pregunta",
        "Subcampo",
        "Respuesta",
        "Fecha fuente",
        "Procedencia",
      ],
      ...payload.significadoBlock0Answers.map((answer) => [
        answer.activityOrder,
        answer.questionCode,
        answer.subfieldId,
        answer.answerText,
        answer.capturedAt,
        answer.provenance.source,
      ]),
    ],
  },
  {
    name: "CIERRE",
    rows: [
      [
        "Tipo",
        "Paso",
        "Estado",
        "Detalle",
        "Evidencia",
      ],
      ...payload.finalOutput.closure_trace.map((trace) => [
        "closure_trace",
        trace.step,
        trace.status,
        trace.detail,
        joinList(trace.evidence),
      ]),
      ["key_dependencies", "", "", joinList(payload.finalOutput.key_dependencies), ""],
      ["key_tensions", "", "", joinList(payload.finalOutput.key_tensions), ""],
      ["key_sacrifices", "", "", joinList(payload.finalOutput.key_sacrifices), ""],
      ["vsm_summary", "", "", JSON.stringify(payload.finalOutput.vsm_signals_summary), ""],
      ["mmabp_summary", "", "", JSON.stringify(payload.finalOutput.mmabp_closure_summary), ""],
      ["ahe_summary", "", "", JSON.stringify(payload.finalOutput.ahe_summary), ""],
    ],
  },
  {
    name: "TRAZABILIDAD",
    rows: [
      [
        "Fuente",
        "Tabla o motor",
        "Campo",
        "ID fuente",
        "Fecha fuente",
        "Notas",
      ],
      ...payload.provenance.map((item) => [
        item.source,
        item.sourceTable,
        item.sourceField,
        item.sourceId,
        item.capturedAt,
        item.notes,
      ]),
      ...payload.supportSelections.map((selection) => [
        "system_metadata",
        "support-activity-selector",
        "support_activity_selected",
        selection.support_activity_selected?.activityId ?? "",
        payload.exportGeneratedAt,
        `${selection.support_activity_selection_reason} | score=${selection.support_activity_marginal_closure_score ?? ""} | redundancy=${selection.support_activity_redundancy_score ?? ""}`,
      ]),
    ],
  },
  {
    name: "PROVENIENCIA",
    rows: [
      ["Elemento", "Valor"],
      ["Politica de datos faltantes", activityCollectionExportMap.missingValuePolicy],
      ["Fuente canonica disponible", activityCollectionExportMap.currentCanonicalQuestionSource],
      ["Estrategia de plantilla", activityCollectionExportMap.templateStrategy],
      ...activityCollectionExportMap.sheets.map((sheet) => [
        `Hoja ${sheet.name}`,
        `${sheet.purpose} Fuente: ${sheet.source}`,
      ]),
    ],
  },
];

export const exportActivityCollectionXlsx = async (sessionId: string) => {
  const payload = await consolidateSessionExportPayload(sessionId);
  const templateBytes = populateActivityCollectionTemplate({
    ...payload,
    templateStrategy: "real_template_v04_preserved",
    assumptions: [
      "Se uso la plantilla real V04 cuando estuvo disponible en el entorno local.",
      "Sheet1 se pobla como matriz original: preguntas en columnas y actividades en filas.",
      "Sheet2 se preserva como catalogo/opciones de la plantilla.",
      "Se agrega TRAZABILIDAD_EVE como hoja complementaria conservadora.",
      "Los campos sin respuesta se dejan vacios y no se infieren como captura del usuario.",
    ],
  });
  const bytes = templateBytes ?? createXlsxWorkbook(buildSheets(payload));
  const timestamp = new Date().toISOString().slice(0, 10);

  return {
    bytes,
    payload,
    contentType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    fileName: `EVE_levantamiento_${safeFilePart(sessionId)}_${timestamp}.xlsx`,
  };
};
