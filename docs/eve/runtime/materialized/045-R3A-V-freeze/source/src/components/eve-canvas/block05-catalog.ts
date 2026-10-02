/**
 * Proyección UI del Bloque 0.5 desde fichas canónicas.
 * No es la ficha completa: solo lo que la hoja debe presentar.
 */

import {
  BLOCK05_FICHA_ORDER,
  getBlock05Ficha,
  type Block05AnswerMode,
  type Block05FieldType,
  type Block05Ficha,
  type Block05Option,
  type Block05QuestionCode,
} from "./block05-fichas";

export type {
  Block05AnswerMode,
  Block05FieldType,
  Block05Option,
  Block05QuestionCode,
} from "./block05-fichas";

export {
  BLOCK05_FICHA_ORDER as BLOCK05_BASE_ORDER,
  BLOCK05_SYSTEMIC_BANDS,
  getBlock05Ficha,
} from "./block05-fichas";

/** Vista presentable al usuario (derivada de ficha). */
export type Block05Question = {
  code: Block05QuestionCode;
  shortUiLabel: string;
  questionText: string;
  helpText: string;
  fieldType: Block05FieldType;
  answerMode: Block05AnswerMode;
  options: readonly Block05Option[];
  freeTextWhenOptionId?: string;
  placeholder?: string;
  kind: "base" | "conditional" | "clarification";
  systemicNorth: Block05Ficha["systemic_north"];
  runtimeIds: readonly string[];
  /** Solo lógica interna / trazas; no copy de usuario. */
  canonicalVariableOutput: string;
  provenanceType: string;
};

function freeTextOptionId(ficha: Block05Ficha): string | undefined {
  if (ficha.allows_free_text !== "conditional") return undefined;
  const match = ficha.options.find((option) => option.id === "otro");
  return match?.id;
}

function placeholderFor(ficha: Block05Ficha): string | undefined {
  if (ficha.field_type === "free_text" || ficha.field_type === "clarification") {
    if (ficha.question_code === "0.5.1b") {
      return "Beneficio primero… / daño primero…";
    }
    if (ficha.question_code === "0.5.3") {
      return "Qué se desbloquea para otros";
    }
    return "Respuesta breve";
  }
  if (ficha.allows_free_text === "conditional") {
    return "Especifica";
  }
  return undefined;
}

function kindFor(ficha: Block05Ficha): Block05Question["kind"] {
  if (ficha.visibility === "flag_only") return "clarification";
  if (ficha.visibility === "conditional") return "conditional";
  return "base";
}

export function projectBlock05Question(ficha: Block05Ficha): Block05Question {
  return {
    code: ficha.question_code,
    shortUiLabel: ficha.short_ui_label,
    questionText: ficha.canonical_question_text,
    helpText: ficha.help_text,
    fieldType: ficha.field_type,
    answerMode: ficha.answer_mode,
    options: ficha.options,
    freeTextWhenOptionId: freeTextOptionId(ficha),
    placeholder: placeholderFor(ficha),
    kind: kindFor(ficha),
    systemicNorth: ficha.systemic_north,
    runtimeIds: ficha.runtime_interaction_ids,
    canonicalVariableOutput: ficha.canonical_variable_output,
    provenanceType: ficha.provenance_type,
  };
}

export const BLOCK05_CATALOG: readonly Block05Question[] = BLOCK05_FICHA_ORDER.map(
  (code) => {
    const ficha = getBlock05Ficha(code);
    if (!ficha) {
      throw new Error(`Ficha canónica ausente para ${code}`);
    }
    return projectBlock05Question(ficha);
  },
);

export function getBlock05Question(
  code: Block05QuestionCode,
): Block05Question | undefined {
  return BLOCK05_CATALOG.find((question) => question.code === code);
}
