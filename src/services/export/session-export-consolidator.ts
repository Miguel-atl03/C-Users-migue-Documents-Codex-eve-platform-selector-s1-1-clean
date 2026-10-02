import type { ActivityStructuralScore } from "@/domain/activity";
import type {
  ActivityExportRow,
  ExportProvenance,
  QuestionnaireAnswerExportRow,
  SessionExportPayload,
} from "@/domain/export";
import type { QuestionnaireAnswer } from "@/domain/questionnaire";
import { supabaseServer } from "@/lib/supabase-server";
import { buildSessionDiagnostic } from "@/services/diagnostic-engine";
import { buildSessionFinalOutput } from "@/services/session-closure-engine";
import { selectSupportActivitiesForRecursiveClosure } from "@/services/support-activity-selector";
import {
  activityCollectionExportMap,
  blockByQuestionCode,
  optionLabelByQuestionAndValue,
  questionByCode,
} from "@/services/export/activity-export-template-map";
import {
  buildOperationalDescriptionCoachTraceExports,
  buildSignificadoBlock0AnswerExports,
} from "@/services/export/significado-export-mappers";

const fullQuestionPrefix = "FULL_V03:";

type SessionRow = {
  id: string;
  estado_actual: string | null;
  porcentaje_avance: number | null;
  created_at: string | null;
  updated_at: string | null;
};

type ActivityRow = {
  id: string;
  ancla_narrativa: string;
  origen: string | null;
  aceptada: boolean | null;
  es_critica: boolean | null;
  interconexion_score: number | null;
  created_at: string | null;
};

type AnswerRow = {
  id: string;
  actividad_id: string;
  pregunta_id: string;
  valor_seleccionado: string | null;
  texto_libre: string | null;
  updated_at: string | null;
};

type ScoreRow = {
  actividad_id: string;
  total_score: number | null;
  max_score: number | null;
  coverage_ratio: number | null;
  selection_recommendation: "primary_candidate" | "support_pool" | null;
  dimension_scores_json: Record<string, number> | null;
  detected_signals_json: Record<string, string[]> | null;
  rationale_json: string[] | null;
};

const emptyDimensionScores = {
  object: 0,
  dependency: 0,
  coordination: 0,
  causality: 0,
  vsm_regulation: 0,
  ahe_tension: 0,
  recursion: 0,
};

const emptySignals = {
  object: [],
  dependency: [],
  coordination: [],
  causality: [],
  vsm_regulation: [],
  ahe_tension: [],
  recursion: [],
};

const provenance = ({
  source,
  table,
  field,
  id,
  capturedAt,
  notes,
}: {
  source: ExportProvenance["source"];
  table: string;
  field: string;
  id: string | null;
  capturedAt: string | null;
  notes: string;
}): ExportProvenance => ({
  source,
  sourceTable: table,
  sourceField: field,
  sourceId: id,
  capturedAt,
  notes,
});

const scoreToStructural = (
  score: ScoreRow,
  activityById: Map<string, ActivityRow>,
): ActivityStructuralScore => {
  const activity = activityById.get(score.actividad_id);

  return {
    activityId: score.actividad_id,
    rawText: activity?.ancla_narrativa ?? "",
    totalScore: score.total_score ?? 0,
    maxScore: score.max_score ?? 0,
    coverageRatio: score.coverage_ratio ?? 0,
    dimensionScores: {
      ...emptyDimensionScores,
      ...(score.dimension_scores_json ?? {}),
    },
    detectedSignals: {
      ...emptySignals,
      ...(score.detected_signals_json ?? {}),
    },
    selectionRecommendation:
      score.selection_recommendation === "support_pool"
        ? "support_pool"
        : "primary_candidate",
    rationale: score.rationale_json ?? [],
  };
};

const answerText = (answer: AnswerRow) =>
  [answer.valor_seleccionado, answer.texto_libre]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(" | ");

const activityRole = ({
  activityId,
  primaryIds,
  answeredSupportIds,
}: {
  activityId: string;
  primaryIds: Set<string>;
  answeredSupportIds: Set<string>;
}): ActivityExportRow["role"] => {
  if (primaryIds.has(activityId)) return "principal";
  if (answeredSupportIds.has(activityId)) return "soporte";
  return "capturada_no_usada";
};

export const consolidateSessionExportPayload = async (
  sessionId: string,
): Promise<SessionExportPayload> => {
  const { data: session, error: sessionError } = await supabaseServer
    .from("sesiones_llenado")
    .select("id, estado_actual, porcentaje_avance, created_at, updated_at")
    .eq("id", sessionId)
    .maybeSingle<SessionRow>();

  if (sessionError) throw new Error(sessionError.message);
  if (!session) throw new Error("No encontre la sesion solicitada.");

  const { data: activities, error: activitiesError } = await supabaseServer
    .from("actividades")
    .select(
      "id, ancla_narrativa, origen, aceptada, es_critica, interconexion_score, created_at",
    )
    .eq("sesion_id", sessionId)
    .order("created_at", { ascending: true })
    .returns<ActivityRow[]>();

  if (activitiesError) throw new Error(activitiesError.message);

  const { data: answerRows, error: answersError } = await supabaseServer
    .from("respuestas_estructuradas")
    .select(
      "id, actividad_id, pregunta_id, valor_seleccionado, texto_libre, updated_at",
    )
    .eq("sesion_id", sessionId)
    .returns<AnswerRow[]>();

  if (answersError) throw new Error(answersError.message);

  const { data: scoreRows, error: scoresError } = await supabaseServer
    .from("activity_structural_scores")
    .select(
      "actividad_id, total_score, max_score, coverage_ratio, selection_recommendation, dimension_scores_json, detected_signals_json, rationale_json",
    )
    .eq("sesion_id", sessionId)
    .returns<ScoreRow[]>();

  if (scoresError) throw new Error(scoresError.message);

  const activityById = new Map((activities ?? []).map((activity) => [activity.id, activity]));
  const structuralScores = (scoreRows ?? []).map((score) =>
    scoreToStructural(score, activityById),
  );
  const primaryActivities = structuralScores.filter(
    (score) => score.selectionRecommendation === "primary_candidate",
  );
  const supportCandidates = structuralScores.filter(
    (score) => score.selectionRecommendation === "support_pool",
  );
  const primaryIds = new Set(primaryActivities.map((activity) => activity.activityId));
  const answeredActivityIds = new Set(
    (answerRows ?? [])
      .filter((answer) => answer.pregunta_id.startsWith(fullQuestionPrefix))
      .map((answer) => answer.actividad_id),
  );
  const answeredSupportActivityIds = supportCandidates
    .filter((candidate) => answeredActivityIds.has(candidate.activityId))
    .map((candidate) => candidate.activityId);
  const answeredSupportIds = new Set(answeredSupportActivityIds);

  const answers: QuestionnaireAnswer[] = (answerRows ?? [])
    .filter((answer) => answer.pregunta_id.startsWith(fullQuestionPrefix))
    .map((answer) => ({
      activityId: answer.actividad_id,
      questionCode: answer.pregunta_id.replace(fullQuestionPrefix, ""),
      blockId:
        blockByQuestionCode.get(answer.pregunta_id.replace(fullQuestionPrefix, ""))
          ?.blockId ?? "restored",
      selectedValue: answer.valor_seleccionado,
      freeText: answer.texto_libre,
    }));

  const diagnostic = buildSessionDiagnostic({
    sessionId,
    activities: activities ?? [],
    answers,
  });
  const primaryDiagnostics = diagnostic.activities.filter((activity) =>
    primaryIds.has(activity.activityId),
  );
  const supportSelections = selectSupportActivitiesForRecursiveClosure({
    primaryDiagnostics,
    supportCandidates,
    answeredSupportActivityIds,
  });
  const finalOutput = buildSessionFinalOutput({
    diagnostic,
    primaryActivityIds: primaryActivities.map((activity) => activity.activityId),
    supportCandidates,
    answeredSupportActivityIds,
    supportSelections,
  });
  const diagnosticByActivityId = new Map(
    diagnostic.activities.map((activity) => [activity.activityId, activity]),
  );
  const scoreByActivityId = new Map(
    structuralScores.map((score) => [score.activityId, score]),
  );

  const activityExports: ActivityExportRow[] = (activities ?? []).map(
    (activity, index) => {
      const diagnosticActivity = diagnosticByActivityId.get(activity.id);
      const score = scoreByActivityId.get(activity.id);

      return {
        activityId: activity.id,
        order: index + 1,
        text: activity.ancla_narrativa,
        role: activityRole({
          activityId: activity.id,
          primaryIds,
          answeredSupportIds,
        }),
        structuralRecommendation: score?.selectionRecommendation ?? "",
        rankingScore: score?.totalScore ?? null,
        coverageRatio: score?.coverageRatio ?? null,
        closureState: diagnosticActivity?.closure.activity_closure_state ?? null,
        closureQuality: diagnosticActivity?.closure.closure_quality_status ?? null,
        closureConfidence: diagnosticActivity?.closure.confidence ?? null,
        missionFinal: diagnosticActivity?.mission.mission_final ?? null,
        consistencyAlertCount:
          diagnosticActivity?.consistency.consistency_alerts.length ?? 0,
        createdAt: activity.created_at,
        provenance: provenance({
          source: "user_captured",
          table: "actividades",
          field: "ancla_narrativa",
          id: activity.id,
          capturedAt: activity.created_at,
          notes: "Actividad redactada o restaurada desde la sesion.",
        }),
      };
    },
  );

  const questionnaireAnswers: QuestionnaireAnswerExportRow[] = (answerRows ?? [])
    .filter((answer) => answer.pregunta_id.startsWith(fullQuestionPrefix))
    .map((answer) => {
      const questionCode = answer.pregunta_id.replace(fullQuestionPrefix, "");
      const block = blockByQuestionCode.get(questionCode);
      const question = questionByCode.get(questionCode);
      const activityExport = activityExports.find(
        (activity) => activity.activityId === answer.actividad_id,
      );
      const source =
        questionCode === "CONSISTENCY_CLARIFICATION"
          ? "clarification_derived"
          : "user_captured";

      return {
        activityId: answer.actividad_id,
        activityOrder: activityExport?.order ?? 0,
        activityRole: activityExport?.role ?? "capturada_no_usada",
        blockId: block?.blockId ?? "sin_bloque",
        blockName: block?.blockName ?? "Sin bloque canonico",
        questionCode,
        questionText: question?.text ?? questionCode,
        fieldType: question?.fieldType ?? "unknown",
        selectedValue: answer.valor_seleccionado,
        selectedLabel: optionLabelByQuestionAndValue(
          questionCode,
          answer.valor_seleccionado,
        ),
        freeText: answer.texto_libre,
        answerText: answerText(answer),
        provenance: provenance({
          source,
          table: "respuestas_estructuradas",
          field: "valor_seleccionado/texto_libre",
          id: answer.id,
          capturedAt: answer.updated_at,
          notes:
            source === "clarification_derived"
              ? "Respuesta usada para recalculo de consistencia."
              : "Respuesta directa del cuestionario EVE.",
        }),
      };
    });

  const consistencyTraces = diagnostic.activities.flatMap((activity) =>
    activity.consistency.consistency_alerts.map((alert) => ({
      activityId: activity.activityId,
      activityText: activity.activityText,
      alert,
      closureQualityStatus: activity.consistency.closure_quality_status,
      clarificationRequired: activity.consistency.clarification_required,
      clarificationPrompt: activity.consistency.clarification_prompt,
      clarificationReason: activity.consistency.clarification_reason,
      clarificationResponse: activity.consistency.clarification_response,
      provenance: provenance({
        source: "system_inferred",
        table: "diagnostic-engine",
        field: "consistency_alerts",
        id: activity.activityId,
        capturedAt: diagnostic.generatedAt,
        notes: "Alerta calculada por la capa de consistencia.",
      }),
    })),
  );

  const operationalDescriptionCoachTraces = buildOperationalDescriptionCoachTraceExports({
    answerRows: answerRows ?? [],
    activityExports,
  });
  const significadoBlock0Answers = buildSignificadoBlock0AnswerExports({
    answerRows: answerRows ?? [],
    activityExports,
  });

  const allProvenance = [
    ...activityExports.map((activity) => activity.provenance),
    ...questionnaireAnswers.map((answer) => answer.provenance),
    ...consistencyTraces.map((trace) => trace.provenance),
    ...operationalDescriptionCoachTraces.map((trace) => trace.provenance),
    ...significadoBlock0Answers.map((answer) => answer.provenance),
    provenance({
      source: "closure_metadata",
      table: "session-closure-engine",
      field: "finalOutput",
      id: sessionId,
      capturedAt: diagnostic.generatedAt,
      notes: "Cierre global reconstruido al momento de exportar.",
    }),
  ];

  return {
    featureName: "EXPORT_ACTIVITY_COLLECTION_XLSX",
    sessionId,
    exportGeneratedAt: new Date().toISOString(),
    templateStrategy: "real_template_unavailable_faithful_reconstruction",
    templateFileName: activityCollectionExportMap.requestedTemplateFileName,
    sessionMetadata: {
      sessionId,
      estadoActual: session.estado_actual,
      porcentajeAvance: session.porcentaje_avance,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
    },
    activities: activityExports,
    questionnaireAnswers,
    consistencyTraces,
    operationalDescriptionCoachTraces,
    significadoBlock0Answers,
    supportSelections,
    diagnostic: {
      ...diagnostic,
      supportSelections,
      finalOutput,
    },
    finalOutput,
    provenance: allProvenance,
    assumptions: [
      "El archivo Excel V04 no esta presente en el repositorio; se usa reconstruccion semantica fiel.",
      "La fuente canonica de preguntas disponible en codigo es FULL_V03.",
      "Los campos sin respuesta se dejan vacios y no se infieren como captura del usuario.",
      "Los campos de mision, consistencia y cierre se marcan como inferidos o metadatos del sistema.",
      "Las trazas del coach B0-Q02 y las respuestas SIGNIFICADO:B0-* se exportan en hojas complementarias.",
    ],
  };
};
