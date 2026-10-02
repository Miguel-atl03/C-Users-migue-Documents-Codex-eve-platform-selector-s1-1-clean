/**
 * Orquestación Bloque 0.5 desde fichas canónicas.
 * Decide qué entra a la hoja según visibility/branching de ficha;
 * no expone IDs Runtime ni variables al usuario.
 */

import {
  BLOCK05_FICHA_ORDER,
  getBlock05Ficha,
  type Block05QuestionCode,
} from "./block05-fichas";
import { getBlock05Question } from "./block05-catalog";

export type Block05Answer = {
  choiceId?: string;
  text?: string;
};

export type Block05SelectionPlan = {
  runtimeBaseIds: readonly string[];
  sequence: Block05QuestionCode[];
  selectionNotes: string[];
};

const LOCAL_TASK_HINTS = [
  "entrego",
  "envio",
  "envío",
  "termino",
  "archivo",
  "reporte",
  "documento",
  "reviso",
  "lleno",
  "cargo",
];

function isLowClarity(choiceId?: string) {
  return choiceId === "poco_claro" || choiceId === "no_claro";
}

function looksLocalTask(text?: string) {
  const value = (text ?? "").trim().toLowerCase();
  if (value.length === 0) return false;
  if (value.length < 18) return true;
  return LOCAL_TASK_HINTS.some((hint) => value.includes(hint));
}

function looksVagueProcess(choiceId?: string, text?: string) {
  if (choiceId === "no_seguro") return true;
  if (choiceId === "otro" && (text?.trim().length ?? 0) < 8) return true;
  const value = (text ?? "").trim().toLowerCase();
  return (
    value === "operacion" ||
    value === "operación" ||
    value === "mi trabajo" ||
    value === "revisar pagos"
  );
}

/**
 * Plan Runtime: B05-Q05 / Q06 / Q07 siempre.
 * La secuencia visible la resuelve resolveBlock05VisibleSequence con fichas.
 */
export function selectBlock05InitialPlan(): Block05SelectionPlan {
  return {
    runtimeBaseIds: ["B05-Q05", "B05-Q06", "B05-Q07"],
    sequence: BLOCK05_FICHA_ORDER.filter(
      (code) => getBlock05Ficha(code)?.visibility === "always" || code === "0.5.1_rel",
    ),
    selectionNotes: [
      "Fuente: fichas canónicas Bloque 0.5 (documento madre)",
      "Norte: cliente funcional → proceso contenedor → hito + prioridad",
      "0.5.1b / 0.5.A–C solo por branching_rule o flag",
    ],
  };
}

/**
 * Secuencia visible según visibility_rule + branching_rule de cada ficha.
 */
export function resolveBlock05VisibleSequence(
  answers: Partial<Record<Block05QuestionCode, Block05Answer>>,
): Block05QuestionCode[] {
  const visible: Block05QuestionCode[] = [];
  const answered = (code: Block05QuestionCode) =>
    Boolean(answers[code]?.choiceId || answers[code]?.text?.trim());

  for (const code of BLOCK05_FICHA_ORDER) {
    const ficha = getBlock05Ficha(code);
    if (!ficha) continue;

    if (ficha.visibility === "flag_only") {
      continue;
    }

    if (code === "0.5.1" || code === "0.5.1a") {
      visible.push(code);
      continue;
    }

    if (code === "0.5.1_rel") {
      if (answered("0.5.1") && answered("0.5.1a")) {
        visible.push(code);
      }
      continue;
    }

    if (code === "0.5.1b") {
      if (answers["0.5.1_rel"]?.choiceId === "distintos") {
        visible.push(code);
      }
      continue;
    }

    if (code === "0.5.1c" || code === "0.5.1d") {
      if (answered("0.5.1_rel")) {
        visible.push(code);
      }
      continue;
    }

    if (code === "0.5.2") {
      if (answered("0.5.1c") && answered("0.5.1d")) {
        visible.push(code);
      }
      continue;
    }

    if (code === "0.5.3") {
      if (answered("0.5.2")) {
        visible.push(code);
      }
      continue;
    }

    if (code === "0.5.4") {
      if (answered("0.5.3")) {
        visible.push(code);
      }
      continue;
    }

    if (code === "0.5.4a") {
      if (answered("0.5.4")) {
        visible.push(code);
      }
      continue;
    }
  }

  // Flags de aclaración (nunca en flujo base vacío)
  const clarityLow =
    isLowClarity(answers["0.5.1c"]?.choiceId) ||
    isLowClarity(answers["0.5.1d"]?.choiceId);
  const relUnsure = answers["0.5.1_rel"]?.choiceId === "no_seguro";
  const needA =
    answered("0.5.1c") &&
    answered("0.5.1d") &&
    (clarityLow || relUnsure);

  if (needA && !answers["0.5.A"]?.text?.trim()) {
    const insertAt = Math.max(visible.indexOf("0.5.1d") + 1, 0);
    if (!visible.includes("0.5.A")) {
      visible.splice(insertAt, 0, "0.5.A");
    }
  }

  if (answers["0.5.2"] && looksVagueProcess(answers["0.5.2"].choiceId, answers["0.5.2"].text)) {
    const insertAt = visible.indexOf("0.5.2") + 1;
    if (!visible.includes("0.5.B")) {
      visible.splice(insertAt, 0, "0.5.B");
    }
  }

  if (answers["0.5.3"] && looksLocalTask(answers["0.5.3"].text)) {
    const insertAt = visible.indexOf("0.5.3") + 1;
    if (!visible.includes("0.5.C")) {
      visible.splice(insertAt, 0, "0.5.C");
    }
  }

  return visible;
}

export function isBlock05AnswerComplete(
  code: Block05QuestionCode,
  answer: Block05Answer | undefined,
  freeTextWhenOptionId?: string,
): boolean {
  if (!answer) return false;

  const question = getBlock05Question(code);
  const freeTextId = freeTextWhenOptionId ?? question?.freeTextWhenOptionId;

  if (
    question?.fieldType === "free_text" ||
    question?.fieldType === "clarification" ||
    code === "0.5.1b" ||
    code === "0.5.3" ||
    code === "0.5.A" ||
    code === "0.5.B" ||
    code === "0.5.C"
  ) {
    return Boolean(answer.text?.trim());
  }

  if (!answer.choiceId) return false;

  if (freeTextId && answer.choiceId === freeTextId) {
    return Boolean(answer.text?.trim());
  }

  if (answer.choiceId === "otro") {
    return Boolean(answer.text?.trim());
  }

  return true;
}

/** Derivaciones internas (nunca UI). */
export function deriveBlock05InternalFlags(
  answers: Partial<Record<Block05QuestionCode, Block05Answer>>,
) {
  const flags: string[] = [];

  if (answers["0.5.4"]?.choiceId === "yo") {
    flags.push("possible_regulatory_vacuum_or_inverted_subsidiarity");
  }

  if (
    answers["0.5.4"]?.choiceId &&
    answers["0.5.4a"]?.choiceId &&
    answers["0.5.4"].choiceId !== answers["0.5.4a"].choiceId &&
    answers["0.5.4a"].choiceId !== "casi_nunca"
  ) {
    flags.push("scene_priority_pattern:fragmented_or_competitive_displacement");
  }

  if (answers["0.5.4a"]?.choiceId === "casi_nunca") {
    flags.push("scene_priority_pattern:relative_stability");
  }

  if (isLowClarity(answers["0.5.1c"]?.choiceId) || isLowClarity(answers["0.5.1d"]?.choiceId)) {
    flags.push("scene_frame_confidence:lowered");
  }

  return flags;
}
