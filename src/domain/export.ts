import type {
  ConsistencyAlert,
  SessionDiagnostic,
  SessionFinalOutput,
  SupportActivitySelection,
} from "@/domain/diagnostics";

export type ExportValueSource =
  | "user_captured"
  | "system_inferred"
  | "clarification_derived"
  | "system_metadata"
  | "closure_metadata";

export type ExportProvenance = {
  source: ExportValueSource;
  sourceTable: string;
  sourceField: string;
  sourceId: string | null;
  capturedAt: string | null;
  notes: string;
};

export type QuestionnaireAnswerExportRow = {
  activityId: string;
  activityOrder: number;
  activityRole: "principal" | "soporte" | "capturada_no_usada";
  blockId: string;
  blockName: string;
  questionCode: string;
  questionText: string;
  fieldType: string;
  selectedValue: string | null;
  selectedLabel: string | null;
  freeText: string | null;
  answerText: string;
  provenance: ExportProvenance;
};

export type ActivityExportRow = {
  activityId: string;
  order: number;
  text: string;
  role: "principal" | "soporte" | "capturada_no_usada";
  structuralRecommendation: string;
  rankingScore: number | null;
  coverageRatio: number | null;
  closureState: string | null;
  closureQuality: string | null;
  closureConfidence: number | null;
  missionFinal: string | null;
  consistencyAlertCount: number;
  createdAt: string | null;
  provenance: ExportProvenance;
};

export type ConsistencyTrace = {
  activityId: string;
  activityText: string;
  alert: ConsistencyAlert;
  closureQualityStatus: string;
  clarificationRequired: boolean;
  clarificationPrompt: string | null;
  clarificationReason: string | null;
  clarificationResponse: string | null;
  provenance: ExportProvenance;
};

export type OperationalDescriptionCoachTraceExport = {
  eventId: string;
  activityId: string | null;
  activityOrder: number | null;
  workMapActivityId: string | null;
  occurredAt: string;
  draftTextSnippet: string;
  draftTextHash: string;
  coachSource: "deterministic" | "llm";
  coachMessage: string | null;
  exampleFragment: string | null;
  sufficiency: string;
  priorityGap: string | null;
  coachTier: string;
  narrativeMode: boolean;
  provenance: ExportProvenance;
};

export type SignificadoBlock0AnswerExportRow = {
  questionKey: string;
  questionCode: string;
  subfieldId: string | null;
  answerText: string;
  activityId: string | null;
  activityOrder: number | null;
  capturedAt: string | null;
  provenance: ExportProvenance;
};

export type SessionExportPayload = {
  featureName: "EXPORT_ACTIVITY_COLLECTION_XLSX";
  sessionId: string;
  exportGeneratedAt: string;
  templateStrategy:
    | "real_template_v04_preserved"
    | "real_template_unavailable_faithful_reconstruction";
  templateFileName: string;
  sessionMetadata: {
    sessionId: string;
    estadoActual: string | null;
    porcentajeAvance: number | null;
    createdAt: string | null;
    updatedAt: string | null;
  };
  activities: ActivityExportRow[];
  questionnaireAnswers: QuestionnaireAnswerExportRow[];
  consistencyTraces: ConsistencyTrace[];
  operationalDescriptionCoachTraces: OperationalDescriptionCoachTraceExport[];
  significadoBlock0Answers: SignificadoBlock0AnswerExportRow[];
  supportSelections: SupportActivitySelection[];
  diagnostic: SessionDiagnostic;
  finalOutput: SessionFinalOutput;
  provenance: ExportProvenance[];
  assumptions: string[];
};
