import { supabaseServer } from "@/lib/supabase-server";
import type {
  QuestionCatalog,
  QuestionnaireQuestion,
} from "@/domain/questionnaire";
import {
  CANONICAL_DERIVATION_VERSION,
  CAPA1_V2_1_INSTRUMENT_VERSION,
  TRANSDUCTION_CANONICAL_ALIASES,
} from "@/domain/canonical-variables";
import { runtimeQuestionCatalog } from "@/runtime/capa1-runtime-manifest";

type SceneQuestionAnswerRow = {
  id: string;
  block_id: string;
  question_code: string;
  answer_nature: string;
  answer_type: string;
  selected_value: string | null;
  selected_values: string[] | null;
  free_text: string | null;
  answer_json: unknown;
};

type CatalogQuestionDefinition = {
  blockId: string;
  question: QuestionnaireQuestion;
};

type DerivationSource =
  | "direct_answer"
  | "text_answer"
  | "alias"
  | "computed";

type CanonicalDerivationValue = {
  value: unknown;
  source: DerivationSource;
  sourceVariable?: string;
  sourceQuestionCode?: string;
  formula?: string;
  inputs?: Record<string, unknown>;
  notes?: string[];
};

type WorkingDerivation = {
  blockId: string;
  derivationKey: string;
  derivationValue: CanonicalDerivationValue;
  evidenceAnswerIds: string[];
  confidence: number;
};

export type DeriveSceneBlockDerivationsInput = {
  sessionId: string;
  sceneId: string;
};

export type DeriveSceneBlockDerivationsResult = {
  generatedDerivations: number;
  savedDerivations: number;
  sourceAnswers: number;
};

const catalog = runtimeQuestionCatalog as QuestionCatalog;

const questionDefinitionsByCode = new Map<string, CatalogQuestionDefinition>(
  catalog.blocks.flatMap((block) =>
    block.questions.map((question) => [
      question.code,
      {
        blockId: block.id,
        question,
      },
    ]),
  ),
);

const keyFor = (blockId: string, derivationKey: string) =>
  `${blockId}:${derivationKey}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseJsonIfNeeded = (value: unknown) => {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
};

const answerValue = (answer: SceneQuestionAnswerRow) => {
  const parsedJson = parseJsonIfNeeded(answer.answer_json);

  if (parsedJson !== null && parsedJson !== undefined) return parsedJson;
  if (answer.selected_values?.length) return answer.selected_values;
  if (answer.selected_value && answer.free_text) {
    return {
      selectedValue: answer.selected_value,
      freeText: answer.free_text,
    };
  }
  if (answer.selected_value) return answer.selected_value;
  if (answer.free_text) return answer.free_text;

  return null;
};

const coerceNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const match = value.replace(",", ".").match(/-?\d+(\.\d+)?/);
    if (!match) return null;

    const parsed = Number(match[0]);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (isRecord(value)) {
    const candidates = [
      value.value,
      value.amount,
      value.number,
      value.selectedValue,
      value.freeText,
    ];

    for (const candidate of candidates) {
      const parsed = coerceNumber(candidate);
      if (parsed !== null) return parsed;
    }
  }

  return null;
};

const selectedOptionValue = (value: unknown): string | null => {
  if (typeof value === "string") return value;

  if (isRecord(value)) {
    for (const candidate of [
      value.selectedValue,
      value.value,
      value.answer,
      value.option,
    ]) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate;
      }
    }
  }

  return null;
};

const transformationExceptionExistsFromType = (
  value: unknown,
): boolean | "unresolved" => {
  const option = selectedOptionValue(value)?.trim().toLowerCase();
  if (!option) return "unresolved";

  if (
    [
      "no",
      "never",
      "none",
      "always_correct",
      "no_exception",
      "no_failure",
    ].includes(option) ||
    option.includes("siempre se transforma correctamente")
  ) {
    return false;
  }

  if (
    [
      "yes",
      "sometimes",
      "often",
      "regular",
      "frequent",
      "constant",
      "rare_yes",
      "regular_yes",
      "frequent_yes",
    ].includes(option) ||
    option.startsWith("si") ||
    option.startsWith("sí") ||
    option.includes("falla")
  ) {
    return true;
  }

  return "unresolved";
};

const isExceptionLike = (value: unknown): boolean | null => {
  if (typeof value !== "string") return null;

  if (["often", "sometimes", "yes", "high", "constant"].includes(value)) {
    return true;
  }

  if (["no", "never", "rare", "low"].includes(value)) {
    return false;
  }

  return null;
};

const receiverFeedbackExistsFromFeedback = (
  value: unknown,
): boolean | "unresolved" => {
  const text =
    typeof value === "string"
      ? value
      : isRecord(value) && typeof value.freeText === "string"
        ? value.freeText
        : null;

  const normalized = text?.trim().toLowerCase();
  if (!normalized) return "unresolved";

  if (
    [
      "nadie avisa",
      "no se detecta",
      "no hay señal",
      "no hay senal",
      "no responde",
      "no hay aviso",
    ].some((phrase) => normalized.includes(phrase))
  ) {
    return false;
  }

  if (
    [
      "avisa",
      "rechaza",
      "devuelve",
      "corrige",
      "pide cambio",
      "recontacta",
      "actualiza",
      "bloquea",
      "escala",
      "incompleta",
      "duplicada",
      "no coincide",
      "error",
      "retras",
    ].some((term) => normalized.includes(term))
  ) {
    return true;
  }

  return "unresolved";
};

const putDerivation = (
  target: Map<string, WorkingDerivation>,
  derivation: WorkingDerivation,
) => {
  target.set(keyFor(derivation.blockId, derivation.derivationKey), derivation);
};

const buildDirectDerivations = (answers: SceneQuestionAnswerRow[]) => {
  const derivations = new Map<string, WorkingDerivation>();

  for (const answer of answers) {
    const definition = questionDefinitionsByCode.get(answer.question_code);
    if (!definition) continue;

    const value = answerValue(answer);
    const { question } = definition;

    if (question.canonicalVariable && value !== null) {
      putDerivation(derivations, {
        blockId: definition.blockId,
        derivationKey: question.canonicalVariable,
        derivationValue: {
          value,
          source: "direct_answer",
          sourceQuestionCode: answer.question_code,
        },
        evidenceAnswerIds: [answer.id],
        confidence: 1,
      });
    }

    if (question.textCanonicalVariable && answer.free_text) {
      putDerivation(derivations, {
        blockId: definition.blockId,
        derivationKey: question.textCanonicalVariable,
        derivationValue: {
          value: answer.free_text,
          source: "text_answer",
          sourceQuestionCode: answer.question_code,
        },
        evidenceAnswerIds: [answer.id],
        confidence: 1,
      });
    }

    if (question.canonicalVariables?.length && isRecord(value)) {
      for (const variable of question.canonicalVariables) {
        if (!(variable in value)) continue;

        putDerivation(derivations, {
          blockId: definition.blockId,
          derivationKey: variable,
          derivationValue: {
            value: value[variable],
            source: "direct_answer",
            sourceQuestionCode: answer.question_code,
          },
          evidenceAnswerIds: [answer.id],
          confidence: 1,
        });
      }
    }
  }

  return derivations;
};

const addAliasDerivations = (derivations: Map<string, WorkingDerivation>) => {
  for (const alias of TRANSDUCTION_CANONICAL_ALIASES) {
    const source = [...derivations.values()].find(
      (derivation) => derivation.derivationKey === alias.sourceVariable,
    );

    if (!source) continue;

    const targetKey = keyFor(alias.blockId, alias.targetVariable);
    if (derivations.has(targetKey)) continue;

    putDerivation(derivations, {
      blockId: alias.blockId,
      derivationKey: alias.targetVariable,
      derivationValue: {
        value: source.derivationValue.value,
        source: "alias",
        sourceVariable: alias.sourceVariable,
        notes: [alias.reason],
      },
      evidenceAnswerIds: source.evidenceAnswerIds,
      confidence: 0.95,
    });
  }
};

const findByVariable = (
  derivations: Map<string, WorkingDerivation>,
  variable: string,
) => [...derivations.values()].find((item) => item.derivationKey === variable);

const addCompositeDerivations = (
  derivations: Map<string, WorkingDerivation>,
) => {
  const directAction = findByVariable(
    derivations,
    "transformation_direct_action",
  );
  const changeCause = findByVariable(
    derivations,
    "transformation_change_cause",
  );

  if (directAction || changeCause) {
    putDerivation(derivations, {
      blockId: "block_2",
      derivationKey: "transformation_causality",
      derivationValue: {
        value: {
          directAction: directAction?.derivationValue.value ?? null,
          changeCause: changeCause?.derivationValue.value ?? null,
        },
        source: "computed",
        formula: "combine(transformation_direct_action, transformation_change_cause)",
      },
      evidenceAnswerIds: [
        ...(directAction?.evidenceAnswerIds ?? []),
        ...(changeCause?.evidenceAnswerIds ?? []),
      ],
      confidence: 0.9,
    });
  }

  const exceptionType = findByVariable(
    derivations,
    "transformation_exception_type",
  );
  const exceptionExists = transformationExceptionExistsFromType(
    exceptionType?.derivationValue.value,
  );

  if (exceptionType && exceptionExists !== "unresolved") {
    putDerivation(derivations, {
      blockId: "block_2",
      derivationKey: "transformation_exception_exists",
      derivationValue: {
        value: exceptionExists,
        source: "computed",
        sourceVariable: "transformation_exception_type",
        formula: "exceptionExists(transformation_exception_type)",
        inputs: {
          transformation_exception_type: exceptionType.derivationValue.value,
        },
      },
      evidenceAnswerIds: exceptionType.evidenceAnswerIds,
      confidence: 0.9,
    });
  }

  const failureFrequency = findByVariable(
    derivations,
    "transformation_failure_frequency",
  );
  const aliasExceptionExists = isExceptionLike(
    failureFrequency?.derivationValue.value,
  );

  if (
    !findByVariable(derivations, "transformation_exception_exists") &&
    failureFrequency &&
    aliasExceptionExists !== null
  ) {
    putDerivation(derivations, {
      blockId: "block_2",
      derivationKey: "transformation_exception_exists",
      derivationValue: {
        value: aliasExceptionExists,
        source: "computed",
        sourceVariable: "transformation_failure_frequency",
        formula: "exceptionExists(transformation_failure_frequency)",
        inputs: {
          transformation_failure_frequency:
            failureFrequency.derivationValue.value,
        },
        notes: [
          "Backward-compatible alias only; transformation_exception_type is the canonical route.",
        ],
      },
      evidenceAnswerIds: failureFrequency.evidenceAnswerIds,
      confidence: 0.8,
    });
  }

  const failureDescription = findByVariable(
    derivations,
    "transformation_failure_description",
  );

  if (failureDescription) {
    putDerivation(derivations, {
      blockId: "block_2",
      derivationKey: "transformation_exception_type",
      derivationValue: {
        value: failureDescription.derivationValue.value,
        source: "alias",
        sourceVariable: "transformation_failure_description",
      },
      evidenceAnswerIds: failureDescription.evidenceAnswerIds,
      confidence: 0.9,
    });
  }

  const receiverFeedback = findByVariable(derivations, "receiver_feedback");
  const receiverFeedbackExists = receiverFeedbackExistsFromFeedback(
    receiverFeedback?.derivationValue.value,
  );

  if (receiverFeedback && receiverFeedbackExists !== "unresolved") {
    putDerivation(derivations, {
      blockId: "block_3",
      derivationKey: "receiver_feedback_exists",
      derivationValue: {
        value: receiverFeedbackExists,
        source: "computed",
        sourceVariable: "receiver_feedback",
        formula: "feedbackExists(receiver_feedback)",
        inputs: {
          receiver_feedback: receiverFeedback.derivationValue.value,
        },
      },
      evidenceAnswerIds: receiverFeedback.evidenceAnswerIds,
      confidence: 0.9,
    });
  }

  const nominal = findByVariable(derivations, "capacidad_nominal_5_1");
  const real = findByVariable(derivations, "capacidad_real_5_2");
  const nominalNumber = coerceNumber(nominal?.derivationValue.value);
  const realNumber = coerceNumber(real?.derivationValue.value);

  if (nominalNumber !== null && realNumber !== null && nominalNumber > 0) {
    const gap = Number(
      (((nominalNumber - realNumber) / nominalNumber) * 100).toFixed(2),
    );

    putDerivation(derivations, {
      blockId: "block_5",
      derivationKey: "brecha_capacidad_5_3",
      derivationValue: {
        value: gap,
        source: "computed",
        formula: "(capacidad_nominal - capacidad_real) / capacidad_nominal * 100",
        inputs: {
          capacidad_nominal_5_1: nominalNumber,
          capacidad_real_5_2: realNumber,
        },
        notes: ["Temporal metrics must already be normalized before this step."],
      },
      evidenceAnswerIds: [
        ...(nominal?.evidenceAnswerIds ?? []),
        ...(real?.evidenceAnswerIds ?? []),
      ],
      confidence: 1,
    });
  }
};

export async function deriveSceneBlockDerivations({
  sessionId,
  sceneId,
}: DeriveSceneBlockDerivationsInput): Promise<DeriveSceneBlockDerivationsResult> {
  const { data: answers, error: answersError } = await supabaseServer
    .from("scene_question_answers")
    .select(
      [
        "id",
        "block_id",
        "question_code",
        "answer_nature",
        "answer_type",
        "selected_value",
        "selected_values",
        "free_text",
        "answer_json",
      ].join(","),
    )
    .eq("sesion_id", sessionId)
    .eq("scene_id", sceneId)
    .eq("instrument_version", CAPA1_V2_1_INSTRUMENT_VERSION);

  if (answersError) {
    throw new Error(answersError.message);
  }

  const answerRows = (answers ?? []) as unknown as SceneQuestionAnswerRow[];
  const derivations = buildDirectDerivations(answerRows);

  addAliasDerivations(derivations);
  addCompositeDerivations(derivations);

  const rows = [...derivations.values()].map((derivation) => ({
    sesion_id: sessionId,
    scene_id: sceneId,
    instrument_version: CAPA1_V2_1_INSTRUMENT_VERSION,
    block_id: derivation.blockId,
    derivation_key: derivation.derivationKey,
    derivation_value: derivation.derivationValue,
    evidence_answer_ids: [...new Set(derivation.evidenceAnswerIds)],
    confidence: derivation.confidence,
    derivation_version: CANONICAL_DERIVATION_VERSION,
    updated_at: new Date().toISOString(),
  }));

  if (!rows.length) {
    return {
      generatedDerivations: 0,
      savedDerivations: 0,
      sourceAnswers: answerRows.length,
    };
  }

  const { data: savedRows, error: upsertError } = await supabaseServer
    .from("scene_block_derivations")
    .upsert(rows, {
      onConflict: "scene_id,instrument_version,block_id,derivation_key",
    })
    .select("id");

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  return {
    generatedDerivations: rows.length,
    savedDerivations: savedRows?.length ?? 0,
    sourceAnswers: answerRows.length,
  };
}
