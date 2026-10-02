"use client";

import { useEffect, useMemo, useState } from "react";
import type { ActivityStructuralScore } from "@/domain/activity";
import type {
  QuestionnaireAnswer,
  QuestionnaireCondition,
  QuestionnaireQuestion,
} from "@/domain/questionnaire";
import {
  block7RuntimeContract,
  questionAllowsFreeText,
  questionAnswerMode,
  questionFieldType,
  questionFreeTextCondition,
  questionHelpText,
  questionShortLabel,
  runtimeQuestionCatalog,
} from "@/runtime/capa1-runtime-manifest";

type SceneQuestionnaireItem = {
  sceneId: string;
  sceneName: string;
  depthLevel: string;
  activity: ActivityStructuralScore;
};

type Props = {
  disabled?: boolean;
  scenes: SceneQuestionnaireItem[];
  sessionId: string;
  onComplete: () => void;
  onSceneAnswers: (scene: SceneQuestionnaireItem, answers: QuestionnaireAnswer[]) => Promise<void>;
};

type SceneAnswerDraft = {
  selectedValue: string | null;
  selectedValues: string[];
  freeText: string;
};

const catalog = runtimeQuestionCatalog;

const draftKey = (sessionId: string) =>
  `eve:scene-questionnaire-draft:${sessionId}:capa1-v2-1`;

const answerKey = (sceneId: string, questionCode: string) =>
  `${sceneId}:${questionCode}`;

const emptyDraft: SceneAnswerDraft = {
  selectedValue: null,
  selectedValues: [],
  freeText: "",
};

const isUserVisibleQuestion = (question: QuestionnaireQuestion) =>
  !question.internalOnly &&
  questionFieldType(question) !== "internal" &&
  questionFieldType(question) !== "computed" &&
  questionAnswerMode(question) !== "internal_inference" &&
  !(
    questionFieldType(question) === "generated_review" &&
    question.user_can_edit_generated !== true
  );

const readDraft = (sessionId: string) => {
  if (typeof window === "undefined" || !sessionId) return null;

  const raw = window.localStorage.getItem(draftKey(sessionId));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as {
      sceneIndex?: unknown;
      blockIndex?: unknown;
      answers?: unknown;
      completedSceneIds?: unknown;
    };

    return {
      sceneIndex: typeof parsed.sceneIndex === "number" ? parsed.sceneIndex : 0,
      blockIndex: typeof parsed.blockIndex === "number" ? parsed.blockIndex : 0,
      answers:
        parsed.answers && typeof parsed.answers === "object"
          ? (parsed.answers as Record<string, SceneAnswerDraft>)
          : {},
      completedSceneIds: Array.isArray(parsed.completedSceneIds)
        ? (parsed.completedSceneIds as string[])
        : [],
    };
  } catch {
    window.localStorage.removeItem(draftKey(sessionId));
    return null;
  }
};

const valueForQuestion = (
  answers: Record<string, SceneAnswerDraft>,
  sceneId: string,
  questionCode: string,
) => answers[answerKey(sceneId, questionCode)] ?? emptyDraft;

const hasAnyAnswer = (draft: SceneAnswerDraft) =>
  Boolean(
    draft.selectedValue ||
      draft.selectedValues.length ||
      draft.freeText.trim().length,
  );

const optionIsExclusive = (option: { value: string; label: string }) =>
  /^(none|no|never|only_|solo|ninguno|ninguna|not_applicable)/i.test(
    option.value,
  ) || /^(no|solo|ningun|ninguna)/i.test(option.label);

const questionHasSelectedOther = (
  question: QuestionnaireQuestion,
  answer: SceneAnswerDraft,
) => {
  const selected = [answer.selectedValue, ...answer.selectedValues].filter(Boolean);
  return (question.options ?? []).some(
    (option) =>
      selected.includes(option.value) &&
      (option.value === "other" ||
        option.value.endsWith("_other") ||
        /otro|otra|other/i.test(option.label)),
  );
};

const shouldShowFreeText = (
  question: QuestionnaireQuestion,
  answer: SceneAnswerDraft,
) => {
  if (!questionAllowsFreeText(question)) return false;
  const condition = questionFreeTextCondition(question);
  if (!condition || condition === "always") return true;
  if (typeof condition === "string") {
    if (/other|otro/i.test(condition)) return questionHasSelectedOther(question, answer);
    if (/selected_option\s*!=/.test(condition)) return Boolean(answer.selectedValue);
  }
  return questionHasSelectedOther(question, answer);
};

const conditionQuestionCode = (condition: QuestionnaireCondition) =>
  condition.questionCode ??
  (condition as unknown as { question_code?: string }).question_code;

const conditionMatches = (
  condition: QuestionnaireCondition,
  answers: Record<string, SceneAnswerDraft>,
  sceneId: string,
) => {
  const questionCode = conditionQuestionCode(condition);
  if (!questionCode) return true;

  const draft = valueForQuestion(answers, sceneId, questionCode);
  const candidateValues = [
    draft.selectedValue,
    ...draft.selectedValues,
    draft.freeText.trim() || null,
  ].filter((value): value is string => Boolean(value));
  const conditionValues = Array.isArray(condition.value)
    ? condition.value.map(String)
    : [String(condition.value)];

  switch (condition.operator) {
    case "equals":
      return candidateValues.includes(String(condition.value));
    case "not_equals":
      return !candidateValues.includes(String(condition.value));
    case "in":
      return candidateValues.some((value) => conditionValues.includes(value));
    case "not_in":
      return !candidateValues.some((value) => conditionValues.includes(value));
    case "includes":
      return candidateValues.includes(String(condition.value));
    case "not_includes":
      return !candidateValues.includes(String(condition.value));
    case "includes_all":
      return conditionValues.every((value) => candidateValues.includes(value));
    case "selection_count_equals":
      return draft.selectedValues.length === Number(condition.value);
    case "selection_count_greater_than":
      return draft.selectedValues.length > Number(condition.value);
    case "has_any_selection":
      return candidateValues.length > 0;
    case "has_residual_variety":
      return candidateValues.some((value) => value !== "no" && value !== "none");
    case "greater_or_equal":
      return Number(candidateValues[0] ?? 0) >= Number(condition.value);
    case "less_than":
      return Number(candidateValues[0] ?? 0) < Number(condition.value);
    case "has_multiple_candidates":
    case "has_crossed_signals":
    case "is_ambiguous":
    case "user_rejects_or_low_confidence":
      return candidateValues.length > 0;
    default:
      return true;
  }
};

const isVisible = (
  question: QuestionnaireQuestion,
  answers: Record<string, SceneAnswerDraft>,
  sceneId: string,
) =>
  isUserVisibleQuestion(question) &&
  (!question.visibleIf?.length ||
    question.visibleIf.every((condition) =>
      conditionMatches(condition, answers, sceneId),
    ));

const isBlock7Microconfirmation = (question: QuestionnaireQuestion) =>
  question.code.startsWith("7.") &&
  !["7.0", "7.0a"].includes(question.code) &&
  questionFieldType(question) !== "internal" &&
  questionFieldType(question) !== "computed";

const applyBlock7MicroconfirmationCap = (questions: QuestionnaireQuestion[]) => {
  const maxUserVisibleQuestions = block7RuntimeContract.max_microconfirmations_per_scene;
  let seen = 0;

  return questions.filter((question) => {
    if (!isBlock7Microconfirmation(question)) return true;
    seen += 1;
    return seen <= maxUserVisibleQuestions;
  });
};

const isRequired = (
  question: QuestionnaireQuestion,
  answers: Record<string, SceneAnswerDraft>,
  sceneId: string,
) =>
  isVisible(question, answers, sceneId) &&
  (question.required ||
  Boolean(
    question.requiredIf?.length &&
      question.requiredIf.every((condition) =>
        conditionMatches(condition, answers, sceneId),
      ),
  ));

const buildAnswer = (
  scene: SceneQuestionnaireItem,
  blockId: string,
  question: QuestionnaireQuestion,
  draft: SceneAnswerDraft,
): QuestionnaireAnswer => ({
  activityId: scene.activity.activityId,
  sceneId: scene.sceneId,
  questionCode: question.code,
  blockId,
  selectedValue: draft.selectedValue,
  selectedValues: draft.selectedValues.length ? draft.selectedValues : null,
  freeText: draft.freeText.trim() || null,
  instrumentVersion: "CAPA1_V2_1",
  answerNature: question.answerNature ?? "captured",
  canonicalVariable: question.canonicalVariable,
});

export function SceneQuestionnaireRunner({
  disabled = false,
  scenes,
  sessionId,
  onComplete,
  onSceneAnswers,
}: Props) {
  const savedDraft = readDraft(sessionId);
  const [sceneIndex, setSceneIndex] = useState(() => savedDraft?.sceneIndex ?? 0);
  const [blockIndex, setBlockIndex] = useState(() => savedDraft?.blockIndex ?? 0);
  const [answers, setAnswers] = useState<Record<string, SceneAnswerDraft>>(
    () => savedDraft?.answers ?? {},
  );
  const [completedSceneIds, setCompletedSceneIds] = useState<string[]>(
    () => savedDraft?.completedSceneIds ?? [],
  );
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const activeScene = scenes[sceneIndex];
  const activeBlock = catalog.blocks[blockIndex];
  const visibleQuestions = useMemo(
    () =>
      activeScene
        ? applyBlock7MicroconfirmationCap(activeBlock.questions.filter((question) =>
            isVisible(question, answers, activeScene.sceneId),
          ))
        : [],
    [activeBlock.questions, activeScene, answers],
  );

  useEffect(() => {
    if (!sessionId) return;

    window.localStorage.setItem(
      draftKey(sessionId),
      JSON.stringify({
        sceneIndex,
        blockIndex,
        answers,
        completedSceneIds,
        updatedAt: new Date().toISOString(),
      }),
    );
  }, [answers, blockIndex, completedSceneIds, sceneIndex, sessionId]);

  if (!scenes.length || !activeScene) {
    return (
      <section className="rounded-md border border-amber-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-neutral-950">
          Falta preparar escenas
        </h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          Primero guarda actividades y permite que EVE prepare las escenas de esta etapa del levantamiento.
        </p>
      </section>
    );
  }

  const updateAnswer = (
    question: QuestionnaireQuestion,
    partial: Partial<SceneAnswerDraft>,
  ) => {
    const key = answerKey(activeScene.sceneId, question.code);
    const current = answers[key] ?? emptyDraft;

    setAnswers((previous) => ({
      ...previous,
      [key]: {
        ...current,
        ...partial,
      },
    }));
  };

  const validateBlock = () => {
    const missing = visibleQuestions.find((question) => {
      if (!isRequired(question, answers, activeScene.sceneId)) return false;
      return !hasAnyAnswer(
        valueForQuestion(answers, activeScene.sceneId, question.code),
      );
    });

    if (missing) {
      setMessage(`Falta responder ${missing.code}: ${missing.text}`);
      return false;
    }

    setMessage("");
    return true;
  };

  const sceneAnswers = () =>
    catalog.blocks.flatMap((block) =>
      block.questions
        .filter((question) => isVisible(question, answers, activeScene.sceneId))
        .map((question) =>
          buildAnswer(
            activeScene,
            block.id,
            question,
            valueForQuestion(answers, activeScene.sceneId, question.code),
          ),
        )
        .filter((answer) =>
          Boolean(
            answer.selectedValue ||
              answer.selectedValues?.length ||
              answer.freeText,
          ),
        ),
    );

  const completeCurrentScene = async () => {
    setSaving(true);
    setMessage("Guardando escena y actualizando el resumen de trabajo...");

    try {
      await onSceneAnswers(activeScene, sceneAnswers());
      const nextCompleted = [...new Set([...completedSceneIds, activeScene.sceneId])];
      setCompletedSceneIds(nextCompleted);

      if (sceneIndex === scenes.length - 1) {
        window.localStorage.removeItem(draftKey(sessionId));
        onComplete();
        return;
      }

      setSceneIndex((current) => current + 1);
      setBlockIndex(0);
      setMessage("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la escena.",
      );
    } finally {
      setSaving(false);
    }
  };

  const goNext = async () => {
    if (!validateBlock()) return;

    if (blockIndex < catalog.blocks.length - 1) {
      setBlockIndex((current) => current + 1);
      return;
    }

    await completeCurrentScene();
  };

  const goBack = () => {
    setMessage("");

    if (blockIndex > 0) {
      setBlockIndex((current) => current - 1);
      return;
    }

    if (sceneIndex > 0) {
      setSceneIndex((current) => current - 1);
      setBlockIndex(catalog.blocks.length - 1);
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
            Levantamiento
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-neutral-950">
            Captura estructural por escena
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-600">
            Responde solo lo que aplica a esta escena. Las preguntas se abren o se ocultan segun tus respuestas.
          </p>
        </div>
        <div className="rounded-md border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 shadow-sm">
          Escena {sceneIndex + 1} de {scenes.length} · Bloque {blockIndex + 1} de {catalog.blocks.length}
        </div>
      </div>

      <div className="rounded-md border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-200 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {activeScene.depthLevel}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-neutral-950">
            {activeScene.sceneName}
          </h2>
          <p className="mt-3 text-sm font-semibold text-neutral-950">
            {activeBlock.name}
          </p>
          <p className="mt-1 text-xs leading-5 text-neutral-500">
            {activeBlock.purpose}
          </p>
        </div>

        <div className="space-y-4 bg-neutral-50 p-4">
          {visibleQuestions.length ? (
            visibleQuestions.map((question) => (
              <QuestionPanel
                answer={valueForQuestion(answers, activeScene.sceneId, question.code)}
                key={question.code}
                onChange={(partial) => updateAnswer(question, partial)}
                question={question}
                required={isRequired(question, answers, activeScene.sceneId)}
              />
            ))
          ) : (
            <div className="rounded-md border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
              Este bloque no requiere preguntas visibles con las respuestas actuales.
            </div>
          )}
        </div>

        {message && (
          <p className="mx-4 mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {message}
          </p>
        )}

        <div className="flex flex-col gap-3 border-t border-neutral-200 p-4 sm:flex-row sm:justify-between">
          <button
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 disabled:cursor-not-allowed disabled:text-neutral-400"
            disabled={disabled || saving || (sceneIndex === 0 && blockIndex === 0)}
            onClick={goBack}
            type="button"
          >
            Regresar
          </button>
          <button
            className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-neutral-400"
            disabled={disabled || saving}
            onClick={goNext}
            type="button"
          >
            {saving
              ? "Guardando..."
              : blockIndex === catalog.blocks.length - 1
                ? sceneIndex === scenes.length - 1
                  ? "Cerrar captura"
                  : "Guardar escena"
                : "Continuar"}
          </button>
        </div>
      </div>
    </section>
  );
}

function QuestionPanel({
  answer,
  onChange,
  question,
  required,
}: {
  answer: SceneAnswerDraft;
  onChange: (partial: Partial<SceneAnswerDraft>) => void;
  question: QuestionnaireQuestion;
  required: boolean;
}) {
  const helpText = questionHelpText(question);
  const shortLabel = questionShortLabel(question);

  return (
    <div
      className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm"
      data-canonical-allows_free_text={questionAllowsFreeText(question)}
      data-canonical-help_text={helpText}
      data-canonical-short_ui_label={shortLabel}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="text-xs font-semibold text-emerald-700">
            {shortLabel}
          </span>
          <p className="mt-1 text-sm font-semibold leading-6 text-neutral-950">
            {question.text}
          </p>
          {helpText && (
            <p className="mt-2 text-xs leading-5 text-neutral-500">
              {helpText}
            </p>
          )}
        </div>
        {required && (
          <span className="w-fit rounded-md bg-neutral-100 px-2 py-1 text-xs text-neutral-600">
            Requerida
          </span>
        )}
      </div>
      <div className="mt-4">
        <QuestionInput answer={answer} onChange={onChange} question={question} />
      </div>
    </div>
  );
}

function QuestionInput({
  answer,
  onChange,
  question,
}: {
  answer: SceneAnswerDraft;
  onChange: (partial: Partial<SceneAnswerDraft>) => void;
  question: QuestionnaireQuestion;
}) {
  if (
    questionFieldType(question) === "guided_short_text" ||
    questionFieldType(question) === "free_text" ||
    questionFieldType(question) === "number" ||
    questionFieldType(question) === "number_with_unit" ||
    questionFieldType(question) === "scale_with_text" ||
    questionAnswerMode(question) === "free_text" ||
    questionAnswerMode(question) === "numeric" ||
    questionAnswerMode(question) === "numeric_with_unit"
  ) {
    return (
      <textarea
        aria-label={question.text}
        className="min-h-28 w-full resize-y rounded-md border border-neutral-300 bg-white px-3 py-3 text-sm leading-6 text-neutral-950 outline-none focus:border-emerald-600"
        inputMode={
          questionFieldType(question) === "number" || questionFieldType(question) === "number_with_unit"
            ? "decimal"
            : undefined
        }
        onChange={(event) => onChange({ freeText: event.target.value })}
        value={answer.freeText}
      />
    );
  }

  if (
    questionFieldType(question) === "multi_select" ||
    questionFieldType(question) === "multi_select_with_text" ||
    questionFieldType(question) === "multi_choice" ||
    questionFieldType(question) === "multi_choice_with_text" ||
    questionAnswerMode(question) === "multi_choice" ||
    questionAnswerMode(question) === "multi_choice_with_text"
  ) {
    return (
      <div className="space-y-2">
        {(question.options ?? []).map((option) => {
          const checked = answer.selectedValues.includes(option.value);
          const exclusive = optionIsExclusive(option);

          return (
            <label
              className="flex items-start gap-3 rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-800"
              key={option.value}
            >
              <input
                checked={checked}
                className="mt-1"
                onChange={(event) => {
                  if (!event.target.checked) {
                    onChange({
                      selectedValues: answer.selectedValues.filter(
                        (value) => value !== option.value,
                      ),
                    });
                    return;
                  }

                  if (exclusive) {
                    onChange({ selectedValues: [option.value], freeText: "" });
                    return;
                  }

                  const exclusiveValues = (question.options ?? [])
                    .filter(optionIsExclusive)
                    .map((item) => item.value);
                  onChange({
                    selectedValues: [
                      ...answer.selectedValues.filter(
                        (value) => !exclusiveValues.includes(value),
                      ),
                      option.value,
                    ],
                  });
                }}
                type="checkbox"
              />
              <span>{option.label}</span>
            </label>
          );
        })}
        {shouldShowFreeText(question, answer) && (
          <textarea
            aria-label={`${question.text} texto adicional`}
            className="mt-3 min-h-20 w-full resize-y rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-emerald-600"
            onChange={(event) => onChange({ freeText: event.target.value })}
            value={answer.freeText}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <select
        aria-label={question.text}
        className="min-h-11 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950 outline-none focus:border-emerald-600"
        onChange={(event) =>
          onChange({ selectedValue: event.target.value || null })
        }
        value={answer.selectedValue ?? ""}
      >
        <option value="">Selecciona...</option>
        {(question.options ?? []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {(questionFieldType(question) === "select_with_text" ||
        questionFieldType(question) === "single_choice_with_text" ||
        questionFieldType(question) === "hybrid_choice_text" ||
        questionFieldType(question) === "boolean_with_text" ||
        questionFieldType(question) === "confirmation" ||
        questionFieldType(question) === "clarification" ||
        questionAnswerMode(question) === "hybrid_choice_text" ||
        shouldShowFreeText(question, answer)) && (
        <textarea
          aria-label={`${question.text} texto adicional`}
          className="min-h-20 w-full resize-y rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-emerald-600"
          onChange={(event) => onChange({ freeText: event.target.value })}
          value={answer.freeText}
        />
      )}
    </div>
  );
}
