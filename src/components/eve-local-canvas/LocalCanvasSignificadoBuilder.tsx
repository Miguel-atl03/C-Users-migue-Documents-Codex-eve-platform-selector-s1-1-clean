"use client";

import { useEffect, useMemo, useState } from "react";
import { SheetMotion } from "@/components/eve-worksheet/SheetMotion";
import { EveLogo } from "@/components/EveLogo";
import type {
  SignificadoDeTuTrabajoProps as SignificadoEditorProps,
  SignificadoVisualDraft,
} from "@/components/significado/SignificadoDeTuTrabajo";
import {
  OPERATIONAL_DESCRIPTION_PATH_STEPS,
  OPERATIONAL_DESCRIPTION_UI,
} from "@/features/significado/operational-description-canon";
import {
  acknowledgeSavedWithWarnings,
  buildDraftSubmitPayload,
  evaluateDraftReadiness as evaluateSignificadoSubmitGate,
  hydrateDraftFromWorkMap,
  type SignificadoLocalDraft,
} from "@/features/significado/significado-draft-state";
import {
  buildBlock0AnswerKey,
  createEmptyBlock0Answers,
  enhanceSignificadoActivityBoundaryReview,
  RUNTIME_BLOCK0_CANONICAL_QUESTIONS,
  type RuntimeBlock0CanonicalQuestion,
} from "@/features/significado/runtime-block0-canonical";
import {
  deriveShortActivityName,
  formatActivityProgress,
  SIGNIFICADO_BLOCK0_INCOMPLETE_NOTICE,
  SIGNIFICADO_CONTINUE_CONFIRMATION_NOTICE,
  SIGNIFICADO_SAVE_REQUIRED_NOTICE,
  SIGNIFICADO_SAVED_WITH_WARNINGS_NOTICE,
} from "@/features/significado/significado-copy";
import {
  useOperationalDescriptionCoach,
} from "@/hooks/use-operational-description-coach";
import { useOperationalDescriptionIntroGuide } from "@/hooks/use-operational-description-intro-guide";
import type { OperationalDescriptionContext } from "@/services/operational-description-coach/evaluate-operational-description-coach";
import {
  buildBoundarySectionAcceptPatch,
  getBoundarySectionValue,
  inferActivityBoundaryReview,
  isActivityBoundaryQuestionComplete,
  type ActivityBoundarySectionId,
} from "@/services/operational-description-coach/infer-activity-boundary";
import { buildRuntimeBlock0ResponseBundle } from "@/services/runtime-block0-response-model";
import {
  clearSignificadoDraft,
  readSignificadoDraftOrEmpty,
  writeSignificadoDraft,
} from "@/services/significado-draft";
import {
  buildInitialBlock0VisualDraftFromWorkMap,
  mergeBlock0InitialVisualDraft,
} from "@/services/workmap-to-block0-prefill";
import styles from "./canvas-significado.module.css";

export type LocalCanvasSignificadoBuilderProps = SignificadoEditorProps;

type AnchorStance = "pending" | "confirmed" | "correcting" | "reconstructing";

/**
 * Freeze SignificadoC variation foreshadow.
 * Runtime matrix binding (not B0 base):
 * - causal C01 / source 0.8 → activity_variation_mode / scene_variation_mode
 * - causal C01 / source 0.8a → activity_exception_signature / scene_exception_signature
 * UI-only until Runtime opens C01; do not invent B0 catalog keys.
 */
type VariationChoice = "yes" | "no" | null;

const VARIATION_QUESTION =
  "¿A veces cambia según el caso o la urgencia?";
const VARIATION_YES_LABEL = "Sí, a veces cambia";
const VARIATION_NO_LABEL = "No, casi siempre es igual";
const VARIATION_NOTE_LABEL = "Qué suele cambiar";
const VARIATION_NOTE_PLACEHOLDER =
  "Ej. Si hay urgencia, salto pasos o lo hago con menos revisión";
const VARIATION_REQUIRED_HINT =
  "Indica si esta actividad a veces cambia o si casi siempre es igual.";
const VARIATION_NOTE_REQUIRED_HINT =
  "Cuéntanos qué suele cambiar cuando no es el caso normal.";

const Q01_SUBFIELD_IDS = [
  "action_verb",
  "input_or_object",
  "procedure_or_standard",
  "output_or_result",
] as const;

const Q01_FIELD_META: Record<
  (typeof Q01_SUBFIELD_IDS)[number],
  { label: string; placeholder: string }
> = {
  action_verb: {
    label: "Qué haces",
    placeholder: "Por ejemplo: reviso, preparo, cruzo…",
  },
  input_or_object: {
    label: "Sobre qué trabajas",
    placeholder: "Sobre qué o con qué trabajas",
  },
  procedure_or_standard: {
    label: "Con qué criterio lo haces",
    placeholder: "Regla, checklist o forma habitual",
  },
  output_or_result: {
    label: "Qué queda listo",
    placeholder: "Qué queda listo al terminar",
  },
};

const Q03_FIELD_META: Record<
  "frequency_base" | "typical_context" | "primary_actor_scope",
  { label: string; placeholder: string }
> = {
  frequency_base: {
    label: "Con qué frecuencia",
    placeholder: "Ej. Todos los días, cada semana, en cada cierre de mes…",
  },
  typical_context: {
    label: "En qué situación suele pasar",
    placeholder:
      "Ej. Cuando cierra el reporte, al recibir una solicitud, en la reunión del área…",
  },
  primary_actor_scope: {
    label: "Quién hace esta actividad",
    placeholder: "Ej. Yo, yo con mi equipo, otra área me lo pide y yo lo hago…",
  },
};

const OPERATIONAL_DRAFT_HINTS = OPERATIONAL_DESCRIPTION_PATH_STEPS.slice(0, 3).map(
  (step) => step.hint,
);

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function isPrefilledValue(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

function isQuestionPrepared(
  question: RuntimeBlock0CanonicalQuestion,
  answers: SignificadoVisualDraft,
): boolean {
  // Official canvas no longer shows Inicio/cierre confirmation UI.
  // B0-Q04 is materialized silently from B0-Q02 (+ Q01 fallbacks) on continue.
  if (question.id === "B0-Q04") {
    return (
      isActivityBoundaryQuestionComplete(answers) ||
      isPrefilledValue(answers[buildBlock0AnswerKey("B0-Q02")])
    );
  }

  if (question.responseKind === "compound" && question.subfields?.length) {
    return question.subfields
      .filter((subfield) => subfield.id !== "user_correction_note")
      .every((subfield) => {
        const answerKey = buildBlock0AnswerKey(question.id, subfield.id);
        return isPrefilledValue(answers[answerKey]);
      });
  }

  const answerKey = buildBlock0AnswerKey(question.id);
  return isPrefilledValue(answers[answerKey]);
}

function materializeSilentBoundaryAnswers(
  answers: SignificadoVisualDraft,
  operationalDescriptionText: string,
  context: OperationalDescriptionContext,
): SignificadoVisualDraft {
  if (isActivityBoundaryQuestionComplete(answers)) {
    return answers;
  }

  const review = enhanceSignificadoActivityBoundaryReview(
    inferActivityBoundaryReview(operationalDescriptionText, context),
    operationalDescriptionText,
  );

  let next: SignificadoVisualDraft = { ...answers };
  const sectionIds: ActivityBoundarySectionId[] = [
    "input_transduction",
    "output_transduction",
  ];

  for (const sectionId of sectionIds) {
    const section = review.sections.find((item) => item.id === sectionId);
    const fallback =
      sectionId === "input_transduction"
        ? context.inputOrObject
        : context.outputOrResult;
    const value =
      getBoundarySectionValue(next, sectionId) ||
      section?.inferredSnippet ||
      fallback ||
      "";
    if (!value.trim()) {
      continue;
    }

    next = {
      ...next,
      ...buildBoundarySectionAcceptPatch({
        sectionId,
        value: value.trim(),
        inferredSnippet: section?.inferredSnippet,
        operationalDescriptionText,
        currentAnswers: next,
      }),
    } as SignificadoVisualDraft;
  }

  return next;
}

function countBlock0PreparedProgress(answers: SignificadoVisualDraft): {
  prepared: number;
  total: number;
} {
  const total = RUNTIME_BLOCK0_CANONICAL_QUESTIONS.length;
  const prepared = RUNTIME_BLOCK0_CANONICAL_QUESTIONS.filter((question) =>
    isQuestionPrepared(question, answers),
  ).length;

  return { prepared, total };
}

function clearQ01AndQ02(answers: SignificadoVisualDraft): SignificadoVisualDraft {
  const next = { ...answers };
  for (const subfieldId of Q01_SUBFIELD_IDS) {
    next[buildBlock0AnswerKey("B0-Q01", subfieldId)] = "";
  }
  next[buildBlock0AnswerKey("B0-Q02")] = "";
  return next;
}

function restoreQ01FromInitial(
  answers: SignificadoVisualDraft,
  initial: SignificadoVisualDraft,
): SignificadoVisualDraft {
  const next = { ...answers };
  for (const subfieldId of Q01_SUBFIELD_IDS) {
    const key = buildBlock0AnswerKey("B0-Q01", subfieldId);
    next[key] = initial[key] ?? "";
  }
  return next;
}

function resolveActivityArea(
  workMap: SignificadoEditorProps["workMap"],
  activityId: string,
  activityTitle: string,
): string | null {
  for (const responsibility of workMap.responsibilities) {
    const match = responsibility.activities.find(
      (activity) =>
        (activityId && activity.id === activityId) ||
        activity.text.trim() === activityTitle.trim(),
    );
    if (match && responsibility.primaryArea?.trim()) {
      return responsibility.primaryArea.trim();
    }
  }
  return null;
}

function scrollToBand(id: string) {
  if (typeof document === "undefined") return;
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function SignificadoField({
  disabled = false,
  incomplete = false,
  label,
  labelTone = "quiet",
  locked = false,
  onBlur,
  onChange,
  onFocus,
  placeholder,
  rows = 2,
  value,
}: {
  disabled?: boolean;
  incomplete?: boolean;
  label: string;
  labelTone?: "quiet" | "strong";
  locked?: boolean;
  onBlur?: () => void;
  onChange: (value: string) => void;
  onFocus?: () => void;
  placeholder: string;
  rows?: number;
  value: string;
}) {
  return (
    <label
      className={cx(
        styles.significadoField,
        labelTone === "strong" && styles.significadoFieldStrong,
        incomplete && styles.significadoFieldIncomplete,
        locked && styles.significadoFieldLocked,
      )}
    >
      <span>{label}</span>
      <textarea
        disabled={disabled || locked}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        readOnly={locked}
        rows={rows}
        value={value}
      />
    </label>
  );
}

/**
 * Official Significado / B0 continuous-canvas bands (freeze SignificadoC visual).
 * Authority remains SignificadoEditor contracts: B0 keys, prefill, coach,
 * draft submit payload, and page onContinue → /api/significado/block0.
 * Inicio/cierre confirmation panel is not shown; B0-Q04 is silent on continue.
 */
export function LocalCanvasSignificadoBuilder({
  workMap,
  sessionId,
  primaryActivitySelectionResult,
  participantActivityProgress,
  preRuntimeContextBundle,
  disabled = false,
  initialVisualDraft,
  sessionMode = "demo",
  coachRequestHeaders,
  onBlock0ReviewProgressChange,
  onContinue,
}: LocalCanvasSignificadoBuilderProps) {
  const [draft, setDraft] = useState<SignificadoLocalDraft>(() =>
    hydrateDraftFromWorkMap(readSignificadoDraftOrEmpty(sessionId), workMap),
  );
  const [statusMessage, setStatusMessage] = useState("");
  const [stance, setStance] = useState<AnchorStance>("pending");
  const [variationChoice, setVariationChoice] = useState<VariationChoice>(null);
  const [variationNote, setVariationNote] = useState("");
  const [advanceAttempted, setAdvanceAttempted] = useState(false);

  const effectivePrimaryActivitySelectionResult = useMemo(
    () => primaryActivitySelectionResult ?? null,
    [primaryActivitySelectionResult],
  );

  const currentActivity = useMemo(() => {
    const progressActivity = participantActivityProgress?.activity;
    if (progressActivity) {
      return {
        id: progressActivity.id,
        title: progressActivity.label.trim(),
        shortName: deriveShortActivityName(progressActivity.label),
        index: progressActivity.ordinal,
        total: progressActivity.total,
      };
    }

    const selected =
      effectivePrimaryActivitySelectionResult?.selectedPrimaryActivities[0];
    if (selected) {
      return {
        id: selected.activityId,
        title: selected.activityLiteral.trim(),
        shortName: deriveShortActivityName(selected.activityLiteral),
        index: selected.runtimeOrder,
        total:
          effectivePrimaryActivitySelectionResult.selectedPrimaryActivities.length,
      };
    }

    const fallbackActivity = workMap.responsibilities
      .flatMap((responsibility) => responsibility.activities)
      .find((activity) => activity.text.trim());

    const title = fallbackActivity?.text.trim() ?? "Tu actividad actual";
    return {
      id: fallbackActivity?.id ?? "",
      title,
      shortName: deriveShortActivityName(title),
      index: 1,
      total: 1,
    };
  }, [effectivePrimaryActivitySelectionResult, participantActivityProgress, workMap]);

  const activityArea = useMemo(
    () => resolveActivityArea(workMap, currentActivity.id, currentActivity.title),
    [currentActivity.id, currentActivity.title, workMap],
  );

  const workMapBlock0Prefill = useMemo(
    () =>
      buildInitialBlock0VisualDraftFromWorkMap({
        workMap,
        primaryActivity: participantActivityProgress?.activity
          ? null
          : effectivePrimaryActivitySelectionResult?.selectedPrimaryActivities[0] ??
            null,
        currentActivityTitle: currentActivity.title,
      }),
    [
      currentActivity.title,
      effectivePrimaryActivitySelectionResult,
      participantActivityProgress,
      workMap,
    ],
  );

  const resolvedInitialVisualDraft = useMemo(
    () =>
      mergeBlock0InitialVisualDraft(
        createEmptyBlock0Answers(),
        workMapBlock0Prefill.visualDraft,
        initialVisualDraft,
      ),
    [initialVisualDraft, workMapBlock0Prefill.visualDraft],
  );

  const [visualDraft, setVisualDraft] = useState<SignificadoVisualDraft>(() =>
    mergeBlock0InitialVisualDraft(
      createEmptyBlock0Answers(),
      buildInitialBlock0VisualDraftFromWorkMap({
        workMap,
        primaryActivity:
          primaryActivitySelectionResult?.selectedPrimaryActivities[0] ?? null,
      }).visualDraft,
      initialVisualDraft,
    ),
  );

  useEffect(() => {
    // Keep local visual draft aligned with WorkMap / override prefill (same as SignificadoEditor).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional draft merge on prefill source change
    setVisualDraft((current) => {
      const next = mergeBlock0InitialVisualDraft(
        createEmptyBlock0Answers(),
        workMapBlock0Prefill.visualDraft,
        initialVisualDraft,
      );

      for (const [key, value] of Object.entries(current)) {
        const trimmed = value.trim();
        if (!trimmed) {
          continue;
        }

        const prefillValue = workMapBlock0Prefill.visualDraft[key]?.trim() ?? "";
        const overrideValue = initialVisualDraft?.[key]?.trim() ?? "";
        if (trimmed !== prefillValue && trimmed !== overrideValue) {
          next[key] = value;
        }
      }

      return next;
    });
  }, [initialVisualDraft, workMapBlock0Prefill.visualDraft]);

  const submitGate = useMemo(
    () => evaluateSignificadoSubmitGate(workMap, draft),
    [draft, workMap],
  );
  const isWorkMapSaved = workMap.isSaved === true;
  const block0Progress = useMemo(
    () => countBlock0PreparedProgress(visualDraft),
    [visualDraft],
  );
  const isBlock0ReviewComplete =
    block0Progress.prepared === block0Progress.total;
  const hasRuntimeProgressActivity = Boolean(
    participantActivityProgress?.activity,
  );
  const structureStarted = stance !== "pending";
  const variationAnswered =
    variationChoice === "no" ||
    (variationChoice === "yes" && variationNote.trim().length > 0);
  const canContinue =
    structureStarted &&
    variationAnswered &&
    (Boolean(effectivePrimaryActivitySelectionResult) ||
      hasRuntimeProgressActivity) &&
    isWorkMapSaved &&
    submitGate.canSubmit &&
    isBlock0ReviewComplete;

  const continueHint = !structureStarted
    ? "Primero confirma si así ocurre la actividad, o corrígela."
    : !variationAnswered
      ? VARIATION_REQUIRED_HINT
      : isBlock0ReviewComplete
        ? SIGNIFICADO_CONTINUE_CONFIRMATION_NOTICE
        : SIGNIFICADO_BLOCK0_INCOMPLETE_NOTICE;

  useEffect(() => {
    onBlock0ReviewProgressChange?.({
      prepared: block0Progress.prepared,
      total: block0Progress.total,
      canContinue,
    });
  }, [
    block0Progress.prepared,
    block0Progress.total,
    canContinue,
    onBlock0ReviewProgressChange,
  ]);

  const operationalDescriptionText =
    visualDraft[buildBlock0AnswerKey("B0-Q02")] ?? "";

  const operationalDescriptionContextBase = useMemo<OperationalDescriptionContext>(
    () => ({
      activityTitle: currentActivity.title,
      actionVerb: visualDraft[buildBlock0AnswerKey("B0-Q01", "action_verb")],
      inputOrObject: visualDraft[buildBlock0AnswerKey("B0-Q01", "input_or_object")],
      procedureOrStandard:
        visualDraft[buildBlock0AnswerKey("B0-Q01", "procedure_or_standard")],
      outputOrResult: visualDraft[buildBlock0AnswerKey("B0-Q01", "output_or_result")],
    }),
    [currentActivity.title, visualDraft],
  );

  const operationalDescriptionIntroGuide = useOperationalDescriptionIntroGuide({
    context: operationalDescriptionContextBase,
    draftText: operationalDescriptionText,
    enabled: isWorkMapSaved && !disabled,
    requestHeaders: coachRequestHeaders,
    sessionId,
    sessionMode,
  });

  const operationalDescriptionContext = useMemo<OperationalDescriptionContext>(
    () => ({
      ...operationalDescriptionContextBase,
      introExampleNarrative:
        operationalDescriptionIntroGuide.guide.exampleNarrative,
    }),
    [
      operationalDescriptionContextBase,
      operationalDescriptionIntroGuide.guide.exampleNarrative,
    ],
  );

  const operationalDescriptionCoach = useOperationalDescriptionCoach({
    context: operationalDescriptionContext,
    enabled:
      isWorkMapSaved &&
      !disabled &&
      (!operationalDescriptionIntroGuide.showLeftExample ||
        operationalDescriptionText.trim().length > 0),
    requestHeaders: coachRequestHeaders,
    sessionId,
    sessionMode,
    text: operationalDescriptionText,
    workMapActivityId: currentActivity.id || null,
  });

  useEffect(() => {
    if (!sessionId) return;
    writeSignificadoDraft(draft, sessionId);
  }, [draft, sessionId]);

  const q01Locked = stance === "pending";
  const q01HasPrefillValues = Q01_SUBFIELD_IDS.some((subfieldId) =>
    isPrefilledValue(
      visualDraft[buildBlock0AnswerKey("B0-Q01", subfieldId)],
    ),
  );

  const handleAnswerChange = (answerKey: string, value: string) => {
    setVisualDraft((current) => ({
      ...current,
      [answerKey]: value,
    }));
  };

  const handleStance = (next: Exclude<AnchorStance, "pending">) => {
    setStance(next);
    setAdvanceAttempted(false);
    setStatusMessage("");

    if (next === "reconstructing") {
      setVisualDraft((current) => clearQ01AndQ02(current));
      scrollToBand("significado-structure");
      return;
    }

    setVisualDraft((current) =>
      restoreQ01FromInitial(current, resolvedInitialVisualDraft),
    );
    scrollToBand("significado-structure");
  };

  const handleAcknowledgeWarnings = () => {
    setStatusMessage("");
    setDraft((current) => acknowledgeSavedWithWarnings(current));
  };

  const handleContinue = () => {
    setAdvanceAttempted(true);

    if (!structureStarted) {
      setStatusMessage("Primero confirma si así ocurre la actividad, o corrígela.");
      scrollToBand("significado-anchor");
      return;
    }

    if (!isWorkMapSaved) {
      setStatusMessage(SIGNIFICADO_SAVE_REQUIRED_NOTICE);
      return;
    }

    if (!isBlock0ReviewComplete) {
      setStatusMessage(SIGNIFICADO_BLOCK0_INCOMPLETE_NOTICE);
      if (!isQuestionPrepared(RUNTIME_BLOCK0_CANONICAL_QUESTIONS[0]!, visualDraft)) {
        scrollToBand("significado-structure");
      } else {
        scrollToBand("significado-border");
      }
      return;
    }

    if (!variationAnswered) {
      setStatusMessage(
        variationChoice === "yes"
          ? VARIATION_NOTE_REQUIRED_HINT
          : VARIATION_REQUIRED_HINT,
      );
      scrollToBand("significado-border");
      return;
    }

    if (!effectivePrimaryActivitySelectionResult && !hasRuntimeProgressActivity) {
      setStatusMessage(
        "Necesitamos preparar internamente tus actividades antes de continuar.",
      );
      return;
    }

    const payload = buildDraftSubmitPayload(
      workMap,
      draft,
      effectivePrimaryActivitySelectionResult ?? undefined,
      preRuntimeContextBundle,
    );
    if (!payload) {
      const firstGap = submitGate.gaps.find((gap) => gap.severity === "blocking");
      setStatusMessage(
        firstGap?.message ??
          "Necesitamos que el mapa quede listo antes de abrir las preguntas.",
      );
      return;
    }

    // Stance "Así es" / any completed stance confirms unchanged WorkMap prefills
    // as user_confirmed_suggestion via confirmPrefillsOnSubmit (default true).
    // B0-Q04 has no canvas UI: materialize silently from Q02 (+ Q01 fallbacks).
    const answersForSubmit = materializeSilentBoundaryAnswers(
      visualDraft,
      operationalDescriptionText,
      operationalDescriptionContextBase,
    );
    if (answersForSubmit !== visualDraft) {
      setVisualDraft(answersForSubmit);
    }

    const runtimeBlock0ResponseBundle = buildRuntimeBlock0ResponseBundle({
      activityId: currentActivity.id,
      activityLabel: currentActivity.title,
      answers: answersForSubmit,
      initialAnswers: resolvedInitialVisualDraft,
      confirmPrefillsOnSubmit: true,
    });

    clearSignificadoDraft(sessionId);
    onContinue?.({
      ...payload,
      block0Answers: answersForSubmit,
      runtimeBlock0ResponseBundle,
    });
  };

  const showWarningsBanner =
    workMap.savedWithWarnings &&
    draft.global.savedWithWarningsAcknowledged !== true;

  const detailHeading = !structureStarted
    ? "Qué hace esta actividad, pieza por pieza"
    : stance === "confirmed"
      ? "¿Queda así de clara?"
      : stance === "correcting"
        ? "Ajusta lo que no cuadra"
        : "Escríbela otra vez, pieza por pieza";

  const activityHeading =
    currentActivity.total > 1
      ? formatActivityProgress(currentActivity.index, currentActivity.total)
      : "Actividad principal";

  return (
    <section
      aria-labelledby="official-canvas-significado-title"
      className={styles.significadoScreen}
      data-significado-builder="official-canvas"
      id="significado-b0"
    >
      <div id="significado-anchor">
        <header className={styles.workmapTopbar}>
          <EveLogo className={styles.workmapTopbarLogo} size="sm" />
          <div>
            Strategic & Operational Architecture{"\u00a0"} / Enterprise Viability
            Engine
          </div>
        </header>

        <SheetMotion variant="title">
          <div className={styles.significadoIntro}>
            <h2 id="official-canvas-significado-title">{activityHeading}</h2>
            <p>
              Confirma si así ocurre. Si no cuadra, corrígela o vuelve a
              escribirla. Después profundizamos con más preguntas sobre ella
              {currentActivity.total > 1
                ? ` (${currentActivity.index} de ${currentActivity.total}).`
                : "."}
            </p>
          </div>
        </SheetMotion>

        {!isWorkMapSaved ? (
          <p className={styles.significadoStatusAlert} role="alert">
            {SIGNIFICADO_SAVE_REQUIRED_NOTICE}
          </p>
        ) : null}

        {showWarningsBanner ? (
          <div className={styles.significadoStatusAlert} role="status">
            <p>{SIGNIFICADO_SAVED_WITH_WARNINGS_NOTICE}</p>
            <div className={styles.significadoStatusActions}>
              <button
                className={styles.significadoQuietLink}
                disabled={disabled}
                onClick={handleAcknowledgeWarnings}
                type="button"
              >
                Entendido, continuar
              </button>
            </div>
          </div>
        ) : null}

        {statusMessage ? (
          <p className={styles.significadoStatusAlert} role="alert">
            {statusMessage}
          </p>
        ) : null}

        <SheetMotion delayMs={60} variant="band">
          <div className={styles.significadoBand}>
            <aside className={styles.workmapSideMeta}>
              <div className={styles.workmapKicker}>01 / ACTIVIDAD</div>
              <p>
                Di si así es, si hay que corregirla o si prefieres volver a
                escribirla.
              </p>
            </aside>
            <div className={styles.significadoBandBody}>
              <h3>¿Confirma si así ocurre esta actividad?</h3>
              {activityArea ? (
                <div className={styles.significadoContextLine}>
                  <span>{activityArea}</span>
                </div>
              ) : null}
              <p className={styles.significadoLiteral}>{currentActivity.title}</p>
              <div
                aria-label="Revisión de la actividad"
                className={styles.significadoStanceRow}
                role="group"
              >
                <button
                  aria-pressed={stance === "confirmed"}
                  className={cx(
                    styles.significadoStanceButton,
                    stance === "confirmed" && styles.significadoStanceButtonActive,
                  )}
                  disabled={disabled}
                  onClick={() => handleStance("confirmed")}
                  type="button"
                >
                  Así es
                </button>
                <button
                  aria-pressed={stance === "correcting"}
                  className={cx(
                    styles.significadoStanceButton,
                    stance === "correcting" && styles.significadoStanceButtonActive,
                  )}
                  disabled={disabled}
                  onClick={() => handleStance("correcting")}
                  type="button"
                >
                  Corregir
                </button>
                <button
                  aria-pressed={stance === "reconstructing"}
                  className={cx(
                    styles.significadoStanceButton,
                    stance === "reconstructing" &&
                      styles.significadoStanceButtonActive,
                  )}
                  disabled={disabled}
                  onClick={() => handleStance("reconstructing")}
                  type="button"
                >
                  Volver a escribirla
                </button>
              </div>
            </div>
          </div>
        </SheetMotion>

        <SheetMotion delayMs={90} variant="band">
          <div className={styles.significadoBand} id="significado-structure">
            <aside className={styles.workmapSideMeta}>
              <div className={styles.workmapKicker}>02 / DETALLE</div>
              <p>
                Se rellena solo desde lo que escribiste en el mapa. Revísalo y
                corrige lo que no cuadre.
              </p>
            </aside>
            <div className={styles.significadoBandBody}>
              <h3>{detailHeading}</h3>
              {q01HasPrefillValues && stance !== "reconstructing" ? (
                <p className={styles.significadoPrefillNote}>
                  Tomado de tu actividad del mapa. Puedes editar cada parte.
                </p>
              ) : null}
              {stance === "pending" ? (
                <p className={styles.significadoPrefillNote}>
                  Confirma la actividad arriba para desbloquear o ajustar el
                  detalle.
                </p>
              ) : null}
              <div className={styles.significadoFieldGrid}>
                {Q01_SUBFIELD_IDS.map((subfieldId) => {
                  const answerKey = buildBlock0AnswerKey("B0-Q01", subfieldId);
                  const meta = Q01_FIELD_META[subfieldId];
                  const value = visualDraft[answerKey] ?? "";
                  return (
                    <SignificadoField
                      disabled={disabled}
                      incomplete={advanceAttempted && !value.trim()}
                      key={answerKey}
                      label={meta.label}
                      locked={q01Locked}
                      onChange={(nextValue) =>
                        handleAnswerChange(answerKey, nextValue)
                      }
                      placeholder={meta.placeholder}
                      value={value}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </SheetMotion>

        <SheetMotion delayMs={120} variant="band">
          <div className={styles.significadoBand} id="significado-border">
            <aside className={styles.workmapSideMeta}>
              <div className={styles.workmapKicker}>03 / DÍA A DÍA</div>
              <p>Cuéntanos cómo suele ocurrir, de punta a punta.</p>
            </aside>
            <div className={styles.significadoBandBody}>
              <h3>Cómo ocurre normalmente</h3>
              <p className={styles.significadoOpContrast}>
                {operationalDescriptionIntroGuide.guide.contrastLead ||
                  OPERATIONAL_DESCRIPTION_UI.introContrastLead}
              </p>

              {operationalDescriptionIntroGuide.showLeftExample ? (
                <div className={styles.significadoOpGuide}>
                  <p className={styles.significadoOpGuideLabel}>
                    {OPERATIONAL_DESCRIPTION_UI.exampleAsideLabel} con tu
                    actividad
                  </p>
                  <p className={styles.significadoOpGuideExample}>
                    {operationalDescriptionIntroGuide.guide.exampleNarrative}
                  </p>
                  <p className={styles.significadoOpStructureLabel}>
                    Estructura que buscamos en tu redacción
                  </p>
                  <ul
                    aria-label="Estructura semántica"
                    className={styles.significadoOpHints}
                  >
                    {(operationalDescriptionIntroGuide.guide.pathSteps.length
                      ? operationalDescriptionIntroGuide.guide.pathSteps.map(
                          (step) => step.hint,
                        )
                      : OPERATIONAL_DRAFT_HINTS
                    ).map((hint) => (
                      <li key={hint}>
                        <span
                          aria-hidden="true"
                          className={styles.significadoOpCheck}
                        >
                          ✓
                        </span>
                        <span>{hint}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className={styles.significadoFieldStack}>
                <div>
                  <SignificadoField
                    disabled={disabled}
                    incomplete={
                      advanceAttempted && !operationalDescriptionText.trim()
                    }
                    label="Redacta como ocurre esta actividad normalmente"
                    labelTone="strong"
                    onBlur={() => operationalDescriptionCoach.handleBlur()}
                    onChange={(value) =>
                      handleAnswerChange(buildBlock0AnswerKey("B0-Q02"), value)
                    }
                    onFocus={() => operationalDescriptionCoach.handleFocus()}
                    placeholder={OPERATIONAL_DESCRIPTION_UI.textareaPlaceholder}
                    rows={4}
                    value={operationalDescriptionText}
                  />
                  {operationalDescriptionCoach.statusHint ? (
                    <p
                      className={
                        operationalDescriptionCoach.statusHintKind === "complete"
                          ? styles.significadoCoachComplete
                          : styles.significadoCoachHint
                      }
                      role="status"
                    >
                      {operationalDescriptionCoach.statusHint}
                    </p>
                  ) : null}
                </div>

                <div className={styles.significadoFieldGrid}>
                  {(
                    Object.keys(Q03_FIELD_META) as Array<
                      keyof typeof Q03_FIELD_META
                    >
                  ).map((subfieldId) => {
                    const answerKey = buildBlock0AnswerKey("B0-Q03", subfieldId);
                    const meta = Q03_FIELD_META[subfieldId];
                    const value = visualDraft[answerKey] ?? "";
                    return (
                      <SignificadoField
                        disabled={disabled}
                        incomplete={advanceAttempted && !value.trim()}
                        key={answerKey}
                        label={meta.label}
                        onChange={(nextValue) =>
                          handleAnswerChange(answerKey, nextValue)
                        }
                        placeholder={meta.placeholder}
                        value={value}
                      />
                    );
                  })}
                </div>

                <div className={styles.significadoVariationBlock}>
                  <p className={styles.significadoVariationQuestion}>
                    {VARIATION_QUESTION}
                  </p>
                  <div
                    aria-label="Si la actividad a veces cambia"
                    className={styles.significadoStanceRow}
                    role="group"
                  >
                    <button
                      aria-pressed={variationChoice === "yes"}
                      className={[
                        styles.significadoStanceButton,
                        variationChoice === "yes"
                          ? styles.significadoStanceButtonActive
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      disabled={disabled}
                      onClick={() => setVariationChoice("yes")}
                      type="button"
                    >
                      {VARIATION_YES_LABEL}
                    </button>
                    <button
                      aria-pressed={variationChoice === "no"}
                      className={[
                        styles.significadoStanceButton,
                        variationChoice === "no"
                          ? styles.significadoStanceButtonActive
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      disabled={disabled}
                      onClick={() => {
                        setVariationChoice("no");
                        setVariationNote("");
                      }}
                      type="button"
                    >
                      {VARIATION_NO_LABEL}
                    </button>
                  </div>
                  {variationChoice === "yes" ? (
                    <SignificadoField
                      disabled={disabled}
                      incomplete={
                        advanceAttempted && !variationNote.trim()
                      }
                      label={VARIATION_NOTE_LABEL}
                      onChange={setVariationNote}
                      placeholder={VARIATION_NOTE_PLACEHOLDER}
                      rows={2}
                      value={variationNote}
                    />
                  ) : null}
                  {variationChoice === null ? (
                    <p className={styles.significadoPrefillNote}>
                      Elige una opción para continuar.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </SheetMotion>

        <footer className={styles.significadoFooter}>
          <aside className={styles.workmapSideMeta}>
            <div className={styles.workmapKicker}>04 / SIGUIENTE</div>
            <p>
              {canContinue
                ? "Con esto el ancla queda lista y seguimos."
                : "Revisa la actividad y completa lo pedido antes de seguir."}
            </p>
          </aside>
          <p>{continueHint}</p>
          <button
            className={styles.sheetAdvanceQuiet}
            disabled={disabled || !canContinue}
            onClick={handleContinue}
            type="button"
          >
            Seguir en la hoja ↓
          </button>
        </footer>
      </div>
    </section>
  );
}
