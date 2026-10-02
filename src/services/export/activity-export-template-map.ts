import questionCatalog from "@/rules/question-catalog-v03.json";
import type { QuestionCatalog, QuestionnaireQuestion } from "@/domain/questionnaire";

export const activityCollectionExportMap = {
  featureName: "EXPORT_ACTIVITY_COLLECTION_XLSX",
  requestedTemplateFileName: "Herramienta de Actividades EVE FULL - V04.xlsx",
  currentCanonicalQuestionSource:
    "Herramienta de recopilacion de actividades EVE FULL - V03",
  missingValuePolicy:
    "No se fabrican datos. Los campos no capturados se dejan vacios.",
  templateStrategy:
    "El archivo V04 no esta disponible en el repositorio. Se genera una reconstruccion fiel por secciones semanticas y hojas complementarias de trazabilidad.",
  sheets: [
    {
      name: "RESUMEN_SESION",
      purpose:
        "Encabezado de sesion, estado de cierre, calidad global y supuestos.",
      source: "sesiones_llenado + finalOutput",
    },
    {
      name: "ACTIVIDADES",
      purpose:
        "Listado completo de actividades capturadas, con marca principal/soporte y estado de cierre.",
      source: "actividades + activity_structural_scores + diagnostic",
    },
    {
      name: "CUESTIONARIO",
      purpose:
        "Reconstruccion pregunta por pregunta del instrumento canonico.",
      source: "respuestas_estructuradas FULL_V03:*",
    },
    {
      name: "MISION_INFERIDA",
      purpose:
        "Campos inferidos de 1.2 y evidencia usada para mission_final.",
      source: "diagnostic.activities[].mission",
    },
    {
      name: "CONSISTENCIA",
      purpose:
        "Alertas de consistencia, micro-aclaraciones y calidad de cierre por actividad.",
      source: "diagnostic.activities[].consistency",
    },
    {
      name: "COACH_B0Q02",
      purpose:
        "Trazas de asistencia inline para la descripcion operativa (B0-Q02) en Significado.",
      source: "respuestas_estructuradas SIGNIFICADO:B0-Q02_COACH_EVENT:*",
    },
    {
      name: "SIGNIFICADO_BLOCK0",
      purpose:
        "Respuestas Runtime Block 0 capturadas en Significado antes del cuestionario FULL_V03.",
      source: "respuestas_estructuradas SIGNIFICADO:B0-Q*",
    },
    {
      name: "CIERRE",
      purpose:
        "Salida final del motor de cierre global, gaps residuales y trazabilidad.",
      source: "finalOutput",
    },
    {
      name: "TRAZABILIDAD",
      purpose:
        "Procedencia de valores y decisiones de seleccion de soporte.",
      source: "provenance + supportSelections",
    },
    {
      name: "PROVENIENCIA",
      purpose:
        "Politica de datos faltantes, fuentes y supuestos de reconstruccion.",
      source: "mapping + assumptions",
    },
  ],
} as const;

const catalog = questionCatalog as QuestionCatalog;

export const questionByCode = new Map<string, QuestionnaireQuestion>(
  catalog.blocks.flatMap((block) => block.questions.map((question) => [question.code, question])),
);

export const blockByQuestionCode = new Map(
  catalog.blocks.flatMap((block) =>
    block.questions.map((question) => [
      question.code,
      {
        blockId: block.id,
        blockName: block.name,
        blockPurpose: block.purpose,
      },
    ]),
  ),
);

export const optionLabelByQuestionAndValue = (
  questionCode: string,
  selectedValue: string | null,
) => {
  if (!selectedValue) return null;

  const question = questionByCode.get(questionCode);
  return (
    question?.options?.find((option) => option.value === selectedValue)?.label ??
    selectedValue
  );
};

