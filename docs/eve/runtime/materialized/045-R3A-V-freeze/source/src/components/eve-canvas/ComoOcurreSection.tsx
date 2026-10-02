"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { EveLogo } from "@/components/EveLogo";
import {
  BLOCK05_SYSTEMIC_BANDS,
  getBlock05Question,
  type Block05Question,
  type Block05QuestionCode,
} from "./block05-catalog";
import {
  deriveBlock05InternalFlags,
  isBlock05AnswerComplete,
  resolveBlock05VisibleSequence,
  selectBlock05InitialPlan,
  type Block05Answer,
} from "./block05-selection";
import { SheetMarquee } from "./SheetMarquee";
import { SheetMotion } from "./SheetMotion";
import styles from "./eve-canvas.module.css";

const BLOCK05_FRAME_MARQUEE = [
  "para quién existe",
  "quién gana si sale bien",
  "quién sufre si falla",
  "a qué proceso pertenece",
  "qué habilita",
  "quién marca la prioridad",
] as const;

/** Actividad anclada — objeto principal de estudio. */
export type CanvasAnchoredActivity = {
  area: string;
  activityLiteral: string;
  actionVerb?: string;
  objectText?: string;
  criterion?: string;
  outputText?: string;
  summary?: string;
  frequency?: string;
  typicalContext?: string;
  primaryActor?: string;
  startHint?: string;
  endHint?: string;
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function getActivityHeading(index: number) {
  const words = [
    "Primera",
    "Segunda",
    "Tercera",
    "Cuarta",
    "Quinta",
    "Sexta",
    "Séptima",
    "Octava",
  ];
  return `${words[index] ?? `${index + 1}.`} actividad seleccionada`;
}

/** Help visible: sin texto en 0.5.1_rel / 0.5.1d; si hay ejemplo explícito, solo el ejemplo; si no, resumen. */
function presentBlock05HelpText(code: Block05QuestionCode, helpText: string): string | null {
  if (code === "0.5.1_rel" || code === "0.5.1d") return null;
  const raw = helpText.trim();
  if (!raw) return null;

  const exampleMatch = raw.match(/(?:Ejemplo|Ejemplos)\s*:\s*(.+)$/is);
  if (exampleMatch?.[1]) {
    return exampleMatch[1].trim();
  }

  const firstSentence = raw.split(/(?<=[.!?])\s+/)[0]?.trim() ?? raw;
  if (firstSentence.length <= 140) return firstSentence;
  return `${firstSentence.slice(0, 137).trimEnd()}…`;
}

function bandForQuestion(question: Block05Question) {
  if (question.kind === "clarification") {
    return {
      id: "aclaracion",
      kicker: "UNA PRECISIÓN",
      guide: "Solo aparece cuando algo no nos termina de cuadrar.",
    };
  }

  const match = BLOCK05_SYSTEMIC_BANDS.find((band) =>
    question.runtimeIds.some((id) =>
      (band.runtimeIds as readonly string[]).includes(id),
    ),
  );

  return (
    match ?? {
      id: "general",
      kicker: "PREGUNTA",
      guide: "Responde con lo que pasa en la práctica.",
    }
  );
}

/**
 * Profundizar — Bloque 0.5 desde fichas canónicas.
 * La ficha gobierna lógica; la hoja solo muestra pregunta, help y control.
 */
export function ComoOcurreSection({
  activities,
}: {
  activities: CanvasAnchoredActivity[];
}) {
  const safeActivities =
    activities.length > 0
      ? activities
      : [
          {
            area: "Operaciones / Producción",
            activityLiteral:
              "Analizo desviaciones de headcount contra presupuesto por unidad de negocio para generar alertas tempranas",
            summary:
              "Reviso desviaciones de headcount frente al presupuesto y dejo alertas listas para quien decide.",
            frequency: "Cada cierre de mes",
            primaryActor: "Yo",
          },
        ];

  const initialPlan = useMemo(() => selectBlock05InitialPlan(), []);

  const [activityIndex, setActivityIndex] = useState(0);
  const [answers, setAnswers] = useState<
    Partial<Record<Block05QuestionCode, Block05Answer>>
  >({});
  const [note, setNote] = useState<string | null>(null);
  const [allComplete, setAllComplete] = useState(false);
  const [literalExpanded, setLiteralExpanded] = useState(false);
  const [literalOverflows, setLiteralOverflows] = useState(false);
  const literalRef = useRef<HTMLParagraphElement>(null);

  const safeActivityIndex = Math.min(activityIndex, safeActivities.length - 1);
  const activity = safeActivities[safeActivityIndex];
  const activityHeading = getActivityHeading(safeActivityIndex);
  const activityCount = safeActivities.length;
  const showActivityProgress = activityCount > 1;

  useLayoutEffect(() => {
    setLiteralExpanded(false);
  }, [activity.activityLiteral, safeActivityIndex]);

  useLayoutEffect(() => {
    const el = literalRef.current;
    if (!el || literalExpanded) return;
    setLiteralOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [activity.activityLiteral, literalExpanded, safeActivityIndex]);

  const visibleSequence = useMemo(
    () => resolveBlock05VisibleSequence(answers),
    [answers],
  );

  const internalFlags = useMemo(
    () => deriveBlock05InternalFlags(answers),
    [answers],
  );

  function patchAnswer(code: Block05QuestionCode, patch: Partial<Block05Answer>) {
    setAnswers((prev) => ({
      ...prev,
      [code]: { ...prev[code], ...patch },
    }));
    setNote(null);
  }

  function resetForNextActivity() {
    setAnswers({});
    setNote(null);
  }

  function findFirstIncomplete(): Block05QuestionCode | null {
    for (const code of visibleSequence) {
      const question = getBlock05Question(code);
      if (
        !question ||
        !isBlock05AnswerComplete(code, answers[code], question.freeTextWhenOptionId)
      ) {
        return code;
      }
    }
    return null;
  }

  function handleContinue() {
    const incomplete = findFirstIncomplete();
    if (incomplete) {
      setNote("Completa las preguntas visibles antes de seguir.");
      scrollToId(`block05-${incomplete}`);
      return;
    }

    // Flags internos quedan disponibles para trazas; no se muestran al usuario.
    void internalFlags;

    if (safeActivityIndex < safeActivities.length - 1) {
      setActivityIndex(safeActivityIndex + 1);
      resetForNextActivity();
      scrollToId("como-ocurre");
      return;
    }

    setAllComplete(true);
    setNote("Listo. Ya precisamos las actividades seleccionadas en este tramo.");
  }

  return (
    <div id="como-ocurre">
      <section
        className={styles.comoScreen}
        aria-labelledby="como-ocurre-title"
        id="como-ocurre-stage"
      >
        <header className={styles.comoStageTop}>
          <div className={styles.workmapTopbar}>
            <EveLogo className={styles.estadoALogo} size="sm" />
            <div>
              Strategic & Operational Architecture{"\u00a0"} / Enterprise Viability Engine
            </div>
          </div>
        </header>

        <SheetMotion variant="title">
          <div className={styles.comoStickyRail}>
            <div className={styles.comoActivityAnchor}>
              <div className={styles.comoActivityMetaRow}>
                <div className={styles.workmapKicker}>{activityHeading}</div>
                {activity.area ? (
                  <span className={styles.comoActivityArea}>{activity.area}</span>
                ) : null}
                {showActivityProgress ? (
                  <span className={styles.comoActivityProgress}>
                    {safeActivityIndex + 1} de {activityCount}
                  </span>
                ) : null}
              </div>
              <p
                className={cx(
                  styles.comoActivityLiteral,
                  !literalExpanded && styles.comoActivityLiteralClamped,
                )}
                ref={literalRef}
                title={activity.activityLiteral}
              >
                {activity.activityLiteral}
              </p>
              {literalOverflows || literalExpanded ? (
                <button
                  className={styles.comoActivityLiteralToggle}
                  onClick={() => setLiteralExpanded((prev) => !prev)}
                  type="button"
                >
                  {literalExpanded ? "Recoger" : "Ver completa"}
                </button>
              ) : null}
            </div>
          </div>
        </SheetMotion>

        <SheetMotion delayMs={40}>
          <div className={styles.comoIntro}>
            <h2 id="como-ocurre-title" className={styles.comoIntroVisuallyHidden}>
              {activityHeading}
            </h2>
            <p className={styles.comoFrameLine}>
              Ahora ubicamos esta actividad en el sistema. Responde lo que ves abajo.
            </p>
            <SheetMarquee items={BLOCK05_FRAME_MARQUEE} />
          </div>
        </SheetMotion>

        <div className={styles.comoQuestionStack}>
          {visibleSequence.map((code, index) => {
            const question = getBlock05Question(code);
            if (!question) return null;
            const answer = answers[code];
            const band = bandForQuestion(question);
            const prevCode = index > 0 ? visibleSequence[index - 1] : null;
            const prevQuestion = prevCode ? getBlock05Question(prevCode) : null;
            const showBandIntro =
              !prevQuestion ||
              bandForQuestion(prevQuestion).id !== band.id ||
              question.kind === "clarification";
            const help = presentBlock05HelpText(question.code, question.helpText);
            const answered = isBlock05AnswerComplete(
              code,
              answer,
              question.freeTextWhenOptionId,
            );

            return (
              <SheetMotion delayMs={Math.min(index * 45, 220)} key={code} variant="band">
                <div
                  className={cx(
                    styles.significadoBand,
                    styles.comoCaptureBand,
                    showBandIntro && styles.comoCaptureBandStart,
                    !showBandIntro && styles.comoCaptureBandFollow,
                    answered && styles.comoCaptureBandAnswered,
                  )}
                  id={`block05-${code}`}
                >
                  <aside className={styles.workmapSideMeta}>
                    {showBandIntro ? (
                      <>
                        <div className={styles.workmapKicker}>{band.kicker}</div>
                        <p>{band.guide}</p>
                      </>
                    ) : (
                      <div className={styles.comoCaptureFollowLabel}>
                        {question.shortUiLabel}
                      </div>
                    )}
                  </aside>
                  <div className={styles.significadoBandBody}>
                    {code === "0.5.1_rel" && answers["0.5.1"] && answers["0.5.1a"] ? (
                      <p className={styles.comoEcho}>
                        Beneficio:{" "}
                        {formatAnswerEcho(answers["0.5.1"], getBlock05Question("0.5.1"))}
                        {" · "}
                        Daño:{" "}
                        {formatAnswerEcho(answers["0.5.1a"], getBlock05Question("0.5.1a"))}
                      </p>
                    ) : null}
                    <h3 className={styles.comoQuestionTitle}>{question.questionText}</h3>
                    {help ? <p className={styles.comoStepHelp}>{help}</p> : null}
                    <Block05Input
                      answer={answer}
                      onChange={(patch) => patchAnswer(code, patch)}
                      question={question}
                    />
                  </div>
                </div>
              </SheetMotion>
            );
          })}
        </div>

        <footer className={styles.significadoFooter}>
          <aside className={styles.workmapSideMeta}>
            <div className={styles.workmapKicker}>SIGUIENTE</div>
            <p>
              {allComplete
                ? "Cerramos este tramo de la actividad."
                : safeActivityIndex < safeActivities.length - 1
                  ? "Al completar estas preguntas, pasamos a la siguiente actividad."
                  : "Al completar estas preguntas, cerramos este tramo."}
            </p>
          </aside>
          <p>
            {note ??
              (allComplete
                ? "Listo. Ya precisamos las actividades seleccionadas."
                : "Cuando las preguntas visibles estén claras, seguimos.")}
          </p>
          <span className={styles.comoRuntimeTrace} aria-hidden="true">
            {initialPlan.selectionNotes[0]}
          </span>
          <div className={styles.comoNavRow}>
            <button
              className={styles.sheetAdvanceQuiet}
              disabled={allComplete}
              onClick={handleContinue}
              type="button"
            >
              {allComplete
                ? "Listo"
                : safeActivityIndex >= safeActivities.length - 1
                  ? "Terminar ↓"
                  : "Siguiente actividad ↓"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

function formatAnswerEcho(
  answer: Block05Answer | undefined,
  question: Block05Question | undefined,
) {
  if (!answer) return "—";
  if (answer.choiceId && question?.options) {
    const label =
      question.options.find((o) => o.id === answer.choiceId)?.label ?? answer.choiceId;
    if (answer.choiceId === "otro" && answer.text?.trim()) {
      return answer.text.trim();
    }
    return label;
  }
  return answer.text?.trim() || "—";
}

function Block05Input({
  answer,
  onChange,
  question,
}: {
  answer: Block05Answer | undefined;
  onChange: (patch: Partial<Block05Answer>) => void;
  question: Block05Question;
}) {
  if (question.fieldType === "free_text" || question.fieldType === "clarification") {
    return (
      <label className={styles.significadoField}>
        <span>Tu respuesta</span>
        <textarea
          onChange={(event) => onChange({ text: event.target.value })}
          placeholder={question.placeholder ?? "Respuesta breve"}
          rows={3}
          value={answer?.text ?? ""}
        />
      </label>
    );
  }

  const showFreeText =
    Boolean(answer?.choiceId) &&
    (answer?.choiceId === question.freeTextWhenOptionId || answer?.choiceId === "otro");

  return (
    <div className={styles.comoChoiceStack}>
      <div className={styles.significadoStanceRow} role="group" aria-label={question.questionText}>
        {(question.options ?? []).map((option) => (
          <button
            aria-pressed={answer?.choiceId === option.id}
            className={cx(
              styles.significadoStanceButton,
              answer?.choiceId === option.id && styles.significadoStanceButtonActive,
            )}
            key={option.id}
            onClick={() => onChange({ choiceId: option.id })}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
      {showFreeText ? (
        <label className={styles.significadoField}>
          <span>Especifica</span>
          <textarea
            onChange={(event) => onChange({ text: event.target.value })}
            placeholder={question.placeholder ?? "Detalle breve"}
            rows={2}
            value={answer?.text ?? ""}
          />
        </label>
      ) : null}
    </div>
  );
}
