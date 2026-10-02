"use client";

import { useEffect, useMemo, useState } from "react";
import questionCatalogData from "@/rules/question-catalog-v03.json";
import type { ActivityStructuralScore } from "@/domain/activity";
import type {
  QuestionCatalog,
  MissionOptionId,
  QuestionnaireAnswer,
  QuestionnaireQuestion,
} from "@/domain/questionnaire";
import {
  inferMissionForActivity,
  missionOptions,
} from "@/services/mission-inference";

type Props = {
  selectedActivities: ActivityStructuralScore[];
  sessionId: string;
  draftScope?: string;
  introMessage?: string;
  disabled?: boolean;
  onComplete: (answers: QuestionnaireAnswer[]) => void;
};

type AnswerDraft = {
  selectedValue: string | null;
  freeText: string;
};

const questionCatalog = questionCatalogData as QuestionCatalog;

const makeAnswerKey = (activityId: string, questionCode: string) =>
  `${activityId}:${questionCode}`;

const draftKey = (sessionId: string, draftScope: string) =>
  `eve:questionnaire-draft:${sessionId}:${draftScope}:v1`;

function readQuestionnaireDraft(sessionId: string, draftScope: string) {
  if (typeof window === "undefined" || !sessionId) {
    return null;
  }

  const rawDraft = window.localStorage.getItem(draftKey(sessionId, draftScope));
  if (!rawDraft) return null;

  try {
    const parsed = JSON.parse(rawDraft) as {
      blockIndex?: unknown;
      answers?: unknown;
      missionOverrides?: unknown;
    };

    return {
      blockIndex:
        typeof parsed.blockIndex === "number" ? parsed.blockIndex : 0,
      answers:
        parsed.answers && typeof parsed.answers === "object"
          ? (parsed.answers as Record<string, AnswerDraft>)
          : {},
      missionOverrides:
        parsed.missionOverrides && typeof parsed.missionOverrides === "object"
          ? (parsed.missionOverrides as Record<
              string,
              { status: "confirmed" | "corrected"; value: MissionOptionId }
            >)
          : {},
    };
  } catch {
    window.localStorage.removeItem(draftKey(sessionId, draftScope));
    return null;
  }
}

const userVisibleQuestions = (questions: QuestionnaireQuestion[]) =>
  questions.filter(
    (question) => question.code !== "1.1" && question.code !== "1.2",
  );

export function QuestionnaireRunner({
  selectedActivities,
  sessionId,
  draftScope = "main",
  introMessage,
  disabled = false,
  onComplete,
}: Props) {
  const savedDraft = readQuestionnaireDraft(sessionId, draftScope);
  const [blockIndex, setBlockIndex] = useState(
    () => savedDraft?.blockIndex ?? 0,
  );
  const [answers, setAnswers] = useState<Record<string, AnswerDraft>>(
    () => savedDraft?.answers ?? {},
  );
  const [validationMessage, setValidationMessage] = useState("");
  const [missionOverrides, setMissionOverrides] = useState<
    Record<
      string,
      {
        status: "confirmed" | "corrected";
        value: MissionOptionId;
      }
    >
  >(() => savedDraft?.missionOverrides ?? {});
  const [showMissionReview, setShowMissionReview] = useState(false);
  const [draftRestored, setDraftRestored] = useState(() => savedDraft !== null);

  const currentBlock = questionCatalog.blocks[blockIndex];
  const currentQuestions = userVisibleQuestions(currentBlock.questions);

  useEffect(() => {
    if (!sessionId) return;

    window.localStorage.setItem(
      draftKey(sessionId, draftScope),
      JSON.stringify({
        blockIndex,
        answers,
        missionOverrides,
        updatedAt: new Date().toISOString(),
      }),
    );
  }, [answers, blockIndex, draftScope, missionOverrides, sessionId]);

  const blockAnswers = useMemo(() => {
    if (!selectedActivities.length) return {};

    return Object.fromEntries(
      selectedActivities.flatMap((activity) =>
        currentQuestions.map((question) => {
          const key = makeAnswerKey(activity.activityId, question.code);
          const existing = answers[key];
          if (existing) return [key, existing];

          return [
            key,
            {
              selectedValue: null,
              freeText: question.code === "1.1" ? activity.rawText : "",
            },
          ];
        }),
      ),
    );
  }, [answers, currentQuestions, selectedActivities]);

  if (!selectedActivities.length) {
    return (
      <section className="rounded-md border border-amber-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-neutral-950">
          Necesitamos una actividad seleccionada
        </h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          Regresa al paso anterior y confirma al menos una actividad para poder
          responder las preguntas.
        </p>
      </section>
    );
  }

  const updateAnswer = (
    activity: ActivityStructuralScore,
    question: QuestionnaireQuestion,
    partial: Partial<AnswerDraft>,
  ) => {
    const key = makeAnswerKey(activity.activityId, question.code);
    const current = blockAnswers[key] ?? {
      selectedValue: null,
      freeText: question.code === "1.1" ? activity.rawText : "",
    };

    setAnswers((previous) => ({
      ...previous,
      [key]: {
        ...current,
        ...partial,
      },
    }));
  };

  const validateCurrentBlock = () => {
    const missing = selectedActivities.flatMap((activity) =>
      currentQuestions
        .filter((question) => {
          if (!question.required) return false;

          const key = makeAnswerKey(activity.activityId, question.code);
          const answer = blockAnswers[key];

          if (
            question.fieldType === "guided_short_text" ||
            question.fieldType === "number"
          ) {
            return !answer?.freeText.trim();
          }

          return !answer?.selectedValue;
        })
        .map((question) => ({ activity, question })),
    );

    if (missing.length) {
      const firstMissing = missing[0];
      setValidationMessage(
        `Falta responder ${firstMissing.question.code} en una actividad: ${firstMissing.activity.rawText}`,
      );
      return false;
    }

    setValidationMessage("");
    return true;
  };

  const buildPayload = () => {
    const activityDescriptionAnswers = selectedActivities.map((activity) => ({
      activityId: activity.activityId,
      questionCode: "1.1",
      blockId: "block_1",
      selectedValue: null,
      freeText: activity.rawText,
    }));
    const visibleAnswers = selectedActivities.flatMap((activity) =>
      questionCatalog.blocks.flatMap((block) =>
        userVisibleQuestions(block.questions).map((question) => {
          const key = makeAnswerKey(activity.activityId, question.code);
          const fallbackText = question.code === "1.1" ? activity.rawText : "";
          const draft = answers[key] ?? {
            selectedValue: null,
            freeText: fallbackText,
          };

          return {
            activityId: activity.activityId,
            questionCode: question.code,
            blockId: block.id,
            selectedValue: draft.selectedValue,
            freeText: draft.freeText.trim() || null,
          };
        }),
      ),
    );
    const missionConfirmationAnswers = Object.entries(missionOverrides).map(
      ([activityId, override]) => ({
        activityId,
        questionCode: "MISSION_USER_OVERRIDE",
        blockId: "mission_inference",
        selectedValue: override.value,
        freeText: override.status,
      }),
    );

    return [
      ...activityDescriptionAnswers,
      ...visibleAnswers,
      ...missionConfirmationAnswers,
    ];
  };

  const missionReviewItems = () => {
    const payload = buildPayload();

    return selectedActivities
      .map((activity) => ({
        activity,
        inference: inferMissionForActivity({
          activityId: activity.activityId,
          answers: payload,
          missionUserOverride: missionOverrides[activity.activityId]?.value,
          missionUserConfirmationStatus:
            missionOverrides[activity.activityId]?.status,
        }),
      }))
      .filter(
        (item) =>
          item.inference.mission_confidence !== "high" &&
          !missionOverrides[item.activity.activityId],
      );
  };

  const goNext = () => {
    if (!validateCurrentBlock()) return;

    const lastBlock = blockIndex === questionCatalog.blocks.length - 1;

    if (lastBlock) {
      const pendingMissionReview = missionReviewItems();

      if (pendingMissionReview.length) {
        setShowMissionReview(true);
        setValidationMessage(
          "Antes de guardar, confirma o corrige la mision funcional de las actividades marcadas.",
        );
        return;
      }

      onComplete(buildPayload());
      window.localStorage.removeItem(draftKey(sessionId, draftScope));
      setDraftRestored(false);
      return;
    }

    setBlockIndex((current) => current + 1);
  };

  const goBack = () => {
    setValidationMessage("");
    if (showMissionReview) {
      setShowMissionReview(false);
      return;
    }

    if (blockIndex > 0) setBlockIndex((current) => current - 1);
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          {draftRestored && (
            <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
              Recuperamos respuestas guardadas de este cuestionario en este
              navegador.
            </div>
          )}
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
            Preguntas guiadas
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-neutral-950">
            Responde por bloque en formato matriz
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-600">
            {introMessage ??
              "Contesta con lo que ocurre en la realidad. No busques la respuesta ideal: aqui importa entender como se sostiene el trabajo."}
          </p>
        </div>

        <div className="rounded-md border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 shadow-sm">
          Bloque {blockIndex + 1} de {questionCatalog.blocks.length}
        </div>
      </div>

      <div className="rounded-md border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-200 px-4 py-3">
          <p className="text-sm font-semibold text-neutral-950">
            {showMissionReview
              ? "Confirmacion funcional"
              : currentBlock.name}
          </p>
          <p className="mt-1 text-xs leading-5 text-neutral-500">
            {showMissionReview
              ? "Solo aparecen actividades donde la plataforma requiere confirmacion o correccion."
              : "Responde cada pregunta del bloque para todas las actividades. Puedes desplazarte horizontalmente para avanzar por las preguntas."}
          </p>
        </div>

        {showMissionReview ? (
          <MissionReviewBoard
            items={missionReviewItems()}
            missionOverrides={missionOverrides}
            onChange={(activityId, value, status) =>
              setMissionOverrides((current) => ({
                ...current,
                [activityId]: {
                  status,
                  value,
                },
              }))
            }
          />
        ) : (
          <div className="overflow-x-auto bg-neutral-50 p-4">
          <div
            className="grid min-w-max gap-3"
            style={{
              gridTemplateColumns: `18rem repeat(${currentQuestions.length}, minmax(18rem, 18rem))`,
            }}
          >
            <div className="sticky left-0 z-20 rounded-md border border-neutral-200 bg-white p-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Actividades
              </p>
              <p className="mt-2 text-xs leading-5 text-neutral-600">
                Cada fila corresponde a una actividad seleccionada.
              </p>
            </div>
            {currentQuestions.map((question) => (
              <div
                className="rounded-md border border-neutral-200 bg-white p-3 shadow-sm"
                key={question.code}
              >
                <span className="text-[11px] font-semibold text-emerald-700">
                  {question.code}
                </span>
                <p className="mt-1 text-xs font-semibold leading-5 text-neutral-950">
                  {question.text}
                </p>
              </div>
            ))}

            {selectedActivities.map((activity, activityRowIndex) => (
              <ActivityResponseRow
                activity={activity}
                activityRowIndex={activityRowIndex}
                blockAnswers={blockAnswers}
                currentBlockQuestions={currentQuestions}
                key={activity.activityId}
                onChange={updateAnswer}
              />
            ))}
          </div>
        </div>
        )}

        {validationMessage && (
          <p className="mx-4 mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {validationMessage}
          </p>
        )}

        <div className="flex flex-col gap-3 border-t border-neutral-200 p-4 sm:flex-row sm:justify-between">
          <button
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 disabled:cursor-not-allowed disabled:text-neutral-400"
            disabled={disabled || blockIndex === 0}
            onClick={goBack}
            type="button"
          >
            Regresar
          </button>
          <button
            className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-neutral-400"
            disabled={disabled}
            onClick={goNext}
            type="button"
          >
            {disabled
              ? "Guardando..."
              : blockIndex === questionCatalog.blocks.length - 1
                ? showMissionReview
                  ? "Guardar respuestas"
                  : "Revisar clasificacion funcional"
                : "Continuar"}
          </button>
        </div>
      </div>
    </section>
  );
}

function MissionReviewBoard({
  items,
  missionOverrides,
  onChange,
}: {
  items: Array<{
    activity: ActivityStructuralScore;
    inference: ReturnType<typeof inferMissionForActivity>;
  }>;
  missionOverrides: Record<
    string,
    { status: "confirmed" | "corrected"; value: MissionOptionId }
  >;
  onChange: (
    activityId: string,
    value: MissionOptionId,
    status: "confirmed" | "corrected",
  ) => void;
}) {
  if (!items.length) {
    return (
      <div className="bg-neutral-50 p-4">
        <p className="rounded-md border border-emerald-200 bg-white p-4 text-sm text-emerald-950">
          Todas las misiones funcionales quedaron listas para guardarse.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 bg-neutral-50 p-4">
      {items.map(({ activity, inference }) => {
        const inferred = inference.mission_inferred_by_ai;
        const selected =
          missionOverrides[activity.activityId]?.value ?? inferred ?? "";

        return (
          <div
            className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm"
            key={activity.activityId}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Actividad
            </p>
            <p className="mt-1 text-sm font-medium leading-6 text-neutral-950">
              {activity.rawText}
            </p>
            <p className="mt-3 text-sm text-neutral-700">
              Detectamos que esta actividad probablemente aporta a:{" "}
              <strong>
                {inferred ? missionOptions[inferred] : "una mision no clara"}
              </strong>
              .
            </p>
            <p className="mt-2 text-xs leading-5 text-neutral-500">
              {inference.mission_confidence_reason}
            </p>
            {inference.mission_conflict_flags.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-800">
                {inference.mission_conflict_flags.map((flag) => (
                  <li key={flag}>{flag}</li>
                ))}
              </ul>
            )}
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
              <select
                className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                onChange={(event) =>
                  onChange(
                    activity.activityId,
                    event.target.value as MissionOptionId,
                    event.target.value === inferred ? "confirmed" : "corrected",
                  )
                }
                value={selected}
              >
                <option value="">Selecciona una mision...</option>
                {Object.entries(missionOptions).map(([value, label]) => (
                  <option key={value} value={value}>
                    {value}. {label}
                  </option>
                ))}
              </select>
              {inferred && (
                <button
                  className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white"
                  onClick={() =>
                    onChange(activity.activityId, inferred, "confirmed")
                  }
                  type="button"
                >
                  Confirmar
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActivityResponseRow({
  activity,
  activityRowIndex,
  blockAnswers,
  currentBlockQuestions,
  onChange,
}: {
  activity: ActivityStructuralScore;
  activityRowIndex: number;
  blockAnswers: Record<string, AnswerDraft>;
  currentBlockQuestions: QuestionnaireQuestion[];
  onChange: (
    activity: ActivityStructuralScore,
    question: QuestionnaireQuestion,
    partial: Partial<AnswerDraft>,
  ) => void;
}) {
  return (
    <>
      <div className="sticky left-0 z-10 rounded-md border border-neutral-200 bg-white p-3 shadow-sm">
        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
          Actividad {activityRowIndex + 1}
        </span>
        <p className="text-xs font-medium leading-5 text-neutral-950">
          {activity.rawText}
        </p>
      </div>
      {currentBlockQuestions.map((question) => {
        const key = makeAnswerKey(activity.activityId, question.code);
        const answer = blockAnswers[key];

        return (
          <div
            className="rounded-md border border-neutral-200 bg-white p-2 shadow-sm"
            key={question.code}
          >
            <QuestionCell
              answer={answer}
              onChange={(partial) => onChange(activity, question, partial)}
              question={question}
            />
          </div>
        );
      })}
    </>
  );
}

function QuestionCell({
  answer,
  onChange,
  question,
}: {
  answer: AnswerDraft;
  onChange: (partial: Partial<AnswerDraft>) => void;
  question: QuestionnaireQuestion;
}) {
  return (
    <div>
      {question.fieldType === "guided_short_text" ||
      question.fieldType === "number" ? (
        <textarea
          aria-label={question.text}
          inputMode={question.fieldType === "number" ? "decimal" : undefined}
          className="min-h-28 w-full resize-y rounded-md border border-neutral-300 bg-white px-2 py-2 text-xs leading-5 text-neutral-950 outline-none focus:border-emerald-600"
          onChange={(event) => onChange({ freeText: event.target.value })}
          placeholder={
            question.fieldType === "number"
              ? "Escribe el tiempo aproximado en horas..."
              : ""
          }
          value={answer.freeText}
        />
      ) : (
        <select
          aria-label={question.text}
          className="min-h-11 w-full rounded-md border border-neutral-300 bg-white px-2 py-2 text-xs leading-5 text-neutral-950 outline-none focus:border-emerald-600"
          onChange={(event) =>
            onChange({ selectedValue: event.target.value || null })
          }
          value={answer.selectedValue ?? ""}
        >
          <option value="">Selecciona...</option>
          {(question.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.value}. {option.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

