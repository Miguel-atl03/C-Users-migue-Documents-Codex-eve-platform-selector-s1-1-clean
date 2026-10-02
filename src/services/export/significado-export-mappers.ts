import type {
  ActivityExportRow,
  ExportProvenance,
  OperationalDescriptionCoachTraceExport,
  SignificadoBlock0AnswerExportRow,
} from "@/domain/export";
import {
  OPERATIONAL_DESCRIPTION_COACH_EVENT_PREFIX,
  parseCoachEventFromRow,
} from "@/services/operational-description-coach/coach-event";

export const SIGNIFICADO_BLOCK0_ANSWER_PREFIX = "SIGNIFICADO:";

const COACH_EVENT_SUFFIX = OPERATIONAL_DESCRIPTION_COACH_EVENT_PREFIX.slice(
  SIGNIFICADO_BLOCK0_ANSWER_PREFIX.length,
);

function isNonNull<T>(value: T | null): value is T {
  return value !== null;
}

type StructuredAnswerRow = {
  id: string;
  actividad_id: string;
  pregunta_id: string;
  texto_libre: string | null;
  updated_at: string | null;
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

const activityOrderForId = (
  activityId: string | null | undefined,
  activityExports: ActivityExportRow[],
) => {
  if (!activityId) {
    return null;
  }
  return activityExports.find((activity) => activity.activityId === activityId)?.order ?? null;
};

export function isSignificadoBlock0AnswerPreguntaId(preguntaId: string) {
  if (!preguntaId.startsWith(SIGNIFICADO_BLOCK0_ANSWER_PREFIX)) {
    return false;
  }
  if (preguntaId.startsWith(OPERATIONAL_DESCRIPTION_COACH_EVENT_PREFIX)) {
    return false;
  }
  return /^SIGNIFICADO:B0-Q\d{2}(\.[a-z0-9_]+)?$/.test(preguntaId);
}

export function significadoBlock0PreguntaId(questionKey: string) {
  return `${SIGNIFICADO_BLOCK0_ANSWER_PREFIX}${questionKey}`;
}

export function parseSignificadoBlock0QuestionKey(preguntaId: string) {
  if (!isSignificadoBlock0AnswerPreguntaId(preguntaId)) {
    return null;
  }

  const questionKey = preguntaId.slice(SIGNIFICADO_BLOCK0_ANSWER_PREFIX.length);
  const [questionCode, subfieldId] = questionKey.split(".");
  return {
    questionKey,
    questionCode,
    subfieldId: subfieldId ?? null,
  };
}

export function buildOperationalDescriptionCoachTraceExports(input: {
  answerRows: StructuredAnswerRow[];
  activityExports: ActivityExportRow[];
}): OperationalDescriptionCoachTraceExport[] {
  return input.answerRows
    .map((row) => {
      const event = parseCoachEventFromRow(row);
      if (!event) {
        return null;
      }

      const activityId = event.legacyActivityId ?? row.actividad_id ?? null;

      return {
        eventId: event.eventId,
        activityId,
        activityOrder: activityOrderForId(activityId, input.activityExports),
        workMapActivityId: event.workMapActivityId,
        occurredAt: event.occurredAt,
        draftTextSnippet: event.draftTextSnippet,
        draftTextHash: event.draftTextHash,
        coachSource: event.coachSource,
        coachMessage: event.coachMessage,
        exampleFragment: event.exampleFragment,
        sufficiency: event.scan.sufficiency,
        priorityGap: event.scan.priorityGap,
        coachTier: event.scan.coachTier,
        narrativeMode: event.contextSummary.narrativeMode,
        provenance: provenance({
          source: "system_inferred",
          table: "respuestas_estructuradas",
          field: `pregunta_id/${COACH_EVENT_SUFFIX}*`,
          id: row.id,
          capturedAt: row.updated_at ?? event.occurredAt,
          notes:
            "Evento de asistencia inline para B0-Q02 (descripcion operativa).",
        }),
      };
    })
    .filter(isNonNull)
    .sort(
      (left, right) =>
        new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
    );
}

export function buildSignificadoBlock0AnswerExports(input: {
  answerRows: StructuredAnswerRow[];
  activityExports: ActivityExportRow[];
}): SignificadoBlock0AnswerExportRow[] {
  return input.answerRows
    .map((row) => {
      const parsed = parseSignificadoBlock0QuestionKey(row.pregunta_id);
      const answerText = row.texto_libre?.trim() ?? "";
      if (!parsed || !answerText) {
        return null;
      }

      const activityId = row.actividad_id ?? null;

      return {
        questionKey: parsed.questionKey,
        questionCode: parsed.questionCode,
        subfieldId: parsed.subfieldId,
        answerText,
        activityId,
        activityOrder: activityOrderForId(activityId, input.activityExports),
        capturedAt: row.updated_at,
        provenance: provenance({
          source: "user_captured",
          table: "respuestas_estructuradas",
          field: "texto_libre",
          id: row.id,
          capturedAt: row.updated_at,
          notes: "Respuesta Runtime Block 0 capturada en Significado.",
        }),
      };
    })
    .filter(isNonNull)
    .sort((left, right) => left.questionKey.localeCompare(right.questionKey));
}
