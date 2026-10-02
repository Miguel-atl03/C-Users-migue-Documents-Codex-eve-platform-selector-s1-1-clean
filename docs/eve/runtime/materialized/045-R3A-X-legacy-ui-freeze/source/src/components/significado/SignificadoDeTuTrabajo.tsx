"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ClientFlowHeader } from "@/components/client/ClientFlowHeader";
import { EveLogo } from "@/components/EveLogo";
import workMapStyles from "@/components/work-map-intake.module.css";
import type { SignificadoSubmitPayload } from "@/domain/significado-de-trabajo";
import type { PreRuntimeContextBundle } from "@/domain/pre-runtime-context-bundle.v1.0";
import type { PrimaryActivitySelectionResult } from "@/domain/primary-activity-selection-policy";
import type { WorkMapData } from "@/domain/work-map";
import { OPERATIONAL_DESCRIPTION_UI } from "@/features/significado/operational-description-canon";
import {
  useOperationalDescriptionCoach,
  type OperationalCoachStatusKind,
} from "@/hooks/use-operational-description-coach";
import { useOperationalDescriptionIntroGuide } from "@/hooks/use-operational-description-intro-guide";
import { ActivityBoundaryConfirmationPanel } from "@/components/significado/ActivityBoundaryConfirmationPanel";
import { OperationalDescriptionExampleAside } from "@/components/significado/OperationalDescriptionExampleAside";
import { OperationalDescriptionPromptCopy } from "@/components/significado/OperationalDescriptionPromptCopy";
import type { OperationalDescriptionContext } from "@/services/operational-description-coach/evaluate-operational-description-coach";
import {
  buildBoundarySectionAcceptPatch,
  buildBoundarySectionCorrectionPatch,
  buildBoundarySectionDraftValuePatch,
  buildBoundarySectionResetPatch,
  getBoundarySectionDraftValue,
  getBoundarySectionStatus,
  getBoundarySectionValue,
  inferActivityBoundaryReview,
  isActivityBoundaryQuestionComplete,
  shouldResetBoundarySections,
  type ActivityBoundarySectionId,
  type ActivityBoundaryReview,
} from "@/services/operational-description-coach/infer-activity-boundary";
import type { OperationalPathProgress } from "@/services/operational-description-coach/operational-description-path-progress";
import type { OperationalDescriptionIntroGuide } from "@/services/operational-description-coach/types";
import {
  SIGNIFICADO_CARD_TITLE,
  SIGNIFICADO_BLOCK0_INCOMPLETE_NOTICE,
  SIGNIFICADO_CONTINUE_CONFIRMATION_NOTICE,
  SIGNIFICADO_CTA_BACK,
  SIGNIFICADO_JOURNEY_STEPS,
  SIGNIFICADO_SAVED_WITH_WARNINGS_NOTICE,
  SIGNIFICADO_SAVE_REQUIRED_NOTICE,
  SIGNIFICADO_SCREEN_SUBTITLE,
  SIGNIFICADO_SCREEN_TITLE,
  SIGNIFICADO_SIDE_CARD_BODY,
  SIGNIFICADO_SIDE_CARD_TITLE,
  SIGNIFICADO_SIDEBAR_FOOTER_LEAD,
  SIGNIFICADO_SIDEBAR_FOOTER_SUB,
  SIGNIFICADO_TABLE_HEADER_CONTENT,
  SIGNIFICADO_TABLE_HEADER_SECTION,
  deriveShortActivityName,
  formatActivityProgress,
  formatBlock0QuestionProgress,
  resolveContinueCta,
  resolveUserInitials,
} from "@/features/significado/significado-copy";
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
  type RuntimeBlock0EpistemicState,
  type RuntimeBlock0ResponseKind,
} from "@/features/significado/runtime-block0-canonical";
import {
  clearSignificadoDraft,
  readSignificadoDraftOrEmpty,
  writeSignificadoDraft,
} from "@/services/significado-draft";
import { buildRuntimeBlock0ResponseBundle } from "@/services/runtime-block0-response-model";
import {
  buildInitialBlock0VisualDraftFromWorkMap,
  mergeBlock0InitialVisualDraft,
} from "@/services/workmap-to-block0-prefill";
import styles from "./significado-de-tu-trabajo.module.css";

const BLOCK0_QUESTION_SECTION_TITLES: Record<string, string> = {
  "B0-Q01": "Confirmar actividad",
  "B0-Q02": "Descripción operativa de tu actividad",
  "B0-Q03": "Frecuencia y contexto en el que la actividad se presenta",
  "B0-Q04": "Inicio y cierre",
};

type GuideStepIconProps = {
  className?: string;
};

export type SignificadoVisualDraft = Record<string, string>;

export type SignificadoBlock0ReviewProgress = {
  prepared: number;
  total: number;
  canContinue: boolean;
};

type ParticipantActivityProgressView = {
  activity: {
    id: string;
    label: string;
    ordinal: number;
    total: number;
    status: "pending" | "active" | "completed" | "blocked";
    isCurrent: boolean;
  } | null;
};

type SignificadoDeTuTrabajoProps = {
  workMap: WorkMapData;
  sessionId: string;
  primaryActivitySelectionResult?: PrimaryActivitySelectionResult | null;
  participantActivityProgress?: ParticipantActivityProgressView | null;
  preRuntimeContextBundle?: PreRuntimeContextBundle;
  disabled?: boolean;
  layout?: "standalone" | "embedded";
  userDisplayName?: string;
  initialVisualDraft?: Partial<SignificadoVisualDraft>;
  sessionMode?: "commercial" | "demo";
  coachRequestHeaders?: Record<string, string>;
  onBlock0ReviewProgressChange?: (progress: SignificadoBlock0ReviewProgress) => void;
  onContinue?: (payload: SignificadoSubmitPayload) => void;
  onBack?: () => void;
};

function DocumentIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
      <path
        d="M8 3h6l4 4v14a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function InfoIcon({ className }: GuideStepIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="14"
      viewBox="0 0 24 24"
      width="14"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 11v5M12 8h.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function GuideIconCheck({ className }: GuideStepIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="12"
      viewBox="0 0 24 24"
      width="12"
    >
      <path
        d="m5 12 4 4 10-10"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function GuideIconMapPin({ className }: GuideStepIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16"
    >
      <path
        d="M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function GuideIconUserRound({ className }: GuideStepIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16"
    >
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M5.5 19.5c1.2-3 3.7-4.5 6.5-4.5s5.3 1.5 6.5 4.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function GuideIconCheckSquare({ className }: GuideStepIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16"
    >
      <rect
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.75"
        width="14"
        x="5"
        y="5"
      />
      <path
        d="m9 12 2 2 4-4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function GuideIconSave({ className }: GuideStepIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16"
    >
      <path
        d="M5 20h14a1 1 0 0 0 1-1V6.5L15.5 3H5a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
      <path d="M15 3v5h4.5" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.75" />
      <path d="M8 13h8M8 17h5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.75" />
    </svg>
  );
}

const SIGNIFICADO_GUIDE_STEP_ICONS = {
  ubicar: GuideIconMapPin,
  responsabilidad: GuideIconUserRound,
  actividades: GuideIconCheckSquare,
  guardar: GuideIconSave,
  significado: DocumentIcon,
} as const;

function SignificadoJourneySteps() {
  return (
    <nav aria-label="Progreso del levantamiento" className={workMapStyles.guideNav}>
      {SIGNIFICADO_JOURNEY_STEPS.map((step) => {
        const StepIcon =
          SIGNIFICADO_GUIDE_STEP_ICONS[
            step.id as keyof typeof SIGNIFICADO_GUIDE_STEP_ICONS
          ];
        const isActive = step.status === "active";
        const isCompleted = step.status === "completed";

        return (
          <div
            aria-current={isActive ? "step" : undefined}
            aria-label={isCompleted ? `${step.label} (completado)` : step.label}
            className={[
              workMapStyles.guideStep,
              isActive ? workMapStyles.guideStepActive : "",
              isCompleted ? workMapStyles.guideStepCompleted : "",
            ]
              .filter(Boolean)
              .join(" ")}
            key={step.id}
          >
            <span aria-hidden="true" className={workMapStyles.guideStepIcon}>
              <StepIcon />
            </span>
            <span className={workMapStyles.guideStepLabel}>{step.label}</span>
            {isCompleted && !isActive ? (
              <span aria-hidden="true" className={workMapStyles.guideStepCheck}>
                <GuideIconCheck />
              </span>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

function SignificadoUserPill({
  displayName,
  initials,
}: {
  displayName: string;
  initials: string;
}) {
  return (
    <div className={styles.userPill}>
      <span aria-hidden="true" className={styles.userAvatar}>
        {initials}
      </span>
      <span>{displayName}</span>
      <span aria-hidden="true" className={styles.userChevron}>
        ▾
      </span>
    </div>
  );
}

function FrequencyOption({
  checked,
  label,
  name,
  onChange,
  value,
}: {
  checked: boolean;
  label: string;
  name: string;
  onChange: () => void;
  value: string;
}) {
  return (
    <label
      className={[
        styles.radioOption,
        checked ? styles.radioOptionChecked : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <input
        checked={checked}
        className={styles.radioInput}
        name={name}
        onChange={onChange}
        type="radio"
        value={value}
      />
      <span aria-hidden="true" className={styles.radioDot}>
        <span className={styles.radioDotInner} />
      </span>
      {label}
    </label>
  );
}

function isQuestionPrepared(
  question: RuntimeBlock0CanonicalQuestion,
  answers: SignificadoVisualDraft,
): boolean {
  if (question.id === "B0-Q04") {
    return isActivityBoundaryQuestionComplete(answers);
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

function isB0Q01UnchangedWorkMapPrefill(
  answers: SignificadoVisualDraft,
  initialAnswers: SignificadoVisualDraft,
): boolean {
  const subfieldIds = [
    "action_verb",
    "input_or_object",
    "procedure_or_standard",
    "output_or_result",
  ] as const;

  let hasPrefill = false;

  for (const subfieldId of subfieldIds) {
    const answerKey = buildBlock0AnswerKey("B0-Q01", subfieldId);
    const currentValue = answers[answerKey]?.trim() ?? "";
    const initialValue = initialAnswers[answerKey]?.trim() ?? "";

    if (initialValue) {
      hasPrefill = true;
    }

    if (currentValue !== initialValue) {
      return false;
    }
  }

  return hasPrefill;
}

function isQuestionConfirmedByUser(
  question: RuntimeBlock0CanonicalQuestion,
  answers: SignificadoVisualDraft,
  initialAnswers: SignificadoVisualDraft,
): boolean {
  if (!isQuestionPrepared(question, answers)) {
    return false;
  }

  if (question.id === "B0-Q01") {
    return !isB0Q01UnchangedWorkMapPrefill(answers, initialAnswers);
  }

  return true;
}

function countBlock0PreparedProgress(
  answers: SignificadoVisualDraft,
): {
  prepared: number;
  total: number;
} {
  const total = RUNTIME_BLOCK0_CANONICAL_QUESTIONS.length;
  const prepared = RUNTIME_BLOCK0_CANONICAL_QUESTIONS.filter((question) =>
    isQuestionPrepared(question, answers),
  ).length;

  return { prepared, total };
}

function QuestionRow({
  children,
  helpText,
  helpTextKind,
  isComplete = false,
  label,
  leftAsideContent,
  questionId,
  rowClassName,
}: {
  children: ReactNode;
  helpText: string;
  helpTextKind?: RuntimeBlock0CanonicalQuestion["helpTextKind"];
  isComplete?: boolean;
  label: string;
  leftAsideContent?: ReactNode;
  questionId: string;
  rowClassName?: string;
}) {
  const sectionTitle = BLOCK0_QUESTION_SECTION_TITLES[questionId] ?? label;
  const presentationHelpKind =
    helpTextKind === "canonical" ? "primary" : "supporting";

  return (
    <div
      className={[
        workMapStyles.workMapRow,
        styles.questionRow,
        rowClassName,
      ]
        .filter(Boolean)
        .join(" ")}
      data-row-state={isComplete ? "complete" : "pending"}
    >
      <div className={workMapStyles.sectionCell}>
        <div className={`${workMapStyles.sectionCellTitles} ${styles.sectionPromptCopy}`}>
          <p className={workMapStyles.sectionTitle}>{sectionTitle}</p>
          {questionId === "B0-Q01" ? (
            <>
              <p className={workMapStyles.sectionSubtitle}>{label}</p>
              <p
                className={styles.questionHelp}
                data-help-kind={presentationHelpKind}
              >
                {helpText}
              </p>
            </>
          ) : null}
          {questionId === "B0-Q02" ? (
            leftAsideContent ?? (
              <p
                className={styles.questionHelp}
                data-help-kind={presentationHelpKind}
              >
                {helpText}
              </p>
            )
          ) : null}
          {questionId === "B0-Q03" ? (
            <>
              <p className={workMapStyles.sectionSubtitle}>{label}</p>
              <p
                className={styles.questionHelp}
                data-help-kind={presentationHelpKind}
              >
                {helpText}
              </p>
            </>
          ) : null}
          {questionId === "B0-Q04" ? (
            <p className={styles.boundaryLeftIntro}>
              Revisamos con qué empiezas la actividad y qué queda listo cuando
              la terminas.
            </p>
          ) : null}
        </div>
      </div>
      <div className={`${workMapStyles.contentCell} ${styles.answerPanel}`}>
        <div className={workMapStyles.fieldGroup}>{children}</div>
      </div>
    </div>
  );
}

function isPrefilledValue(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

function resolveFieldInputClass(
  epistemicState: RuntimeBlock0EpistemicState | undefined,
  value: string,
  baseClass: string,
): string {
  if (!isPrefilledValue(value) || !epistemicState) {
    return baseClass;
  }
  if (
    epistemicState === "inferred_from_workmap" ||
    epistemicState === "context_from_workmap"
  ) {
    return `${baseClass} ${styles.prefilledInput}`;
  }
  return baseClass;
}

function renderAnswerField({
  answerKey,
  coachStatusHint,
  coachStatusKind,
  disabled,
  epistemicState,
  onBlur,
  onChange,
  onFocus,
  options,
  placeholder,
  responseKind,
  value,
}: {
  answerKey: string;
  coachStatusHint?: string | null;
  coachStatusKind?: "guide" | "complete" | null;
  disabled: boolean;
  epistemicState?: RuntimeBlock0EpistemicState;
  onBlur?: () => void;
  onChange: (value: string) => void;
  onFocus?: () => void;
  options?: string[];
  placeholder?: string;
  responseKind: RuntimeBlock0ResponseKind;
  value: string;
}) {
  if (responseKind === "single_choice" && options?.length) {
    return (
      <div className={styles.frequencyGrid}>
        {options.map((option) => (
          <FrequencyOption
            checked={value === option}
            key={option}
            label={option}
            name={answerKey}
            onChange={() => onChange(option)}
            value={option}
          />
        ))}
      </div>
    );
  }

  if (responseKind === "textarea") {
    return (
      <>
        <textarea
          className={resolveFieldInputClass(epistemicState, value, styles.textareaInput)}
          disabled={disabled}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          onFocus={onFocus}
          placeholder={placeholder}
          value={value}
        />
        {coachStatusHint ? (
          <p
            className={
              coachStatusKind === "complete"
                ? styles.operationalCoachComplete
                : styles.operationalCoachHint
            }
            role="status"
          >
            {coachStatusHint}
          </p>
        ) : null}
      </>
    );
  }

  return (
    <input
      className={resolveFieldInputClass(epistemicState, value, styles.textInput)}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      type="text"
      value={value}
    />
  );
}

function RuntimeBlock0Question({
  activityBoundary,
  answers,
  disabled,
  initialAnswers,
  onAnswerChange,
  operationalDescriptionCoach,
  operationalDescriptionIntroGuide,
  question,
}: {
  activityBoundary?: {
    getSectionStatus: (sectionId: ActivityBoundarySectionId) => ReturnType<
      typeof getBoundarySectionStatus
    >;
    getSectionValue: (sectionId: ActivityBoundarySectionId) => string;
    onSectionConfirm: (sectionId: ActivityBoundarySectionId) => void;
    onSectionManualChange: (
      sectionId: ActivityBoundarySectionId,
      value: string,
    ) => void;
    onSectionRequestCorrection: (sectionId: ActivityBoundarySectionId) => void;
    review: ActivityBoundaryReview;
  };
  answers: SignificadoVisualDraft;
  disabled: boolean;
  initialAnswers: SignificadoVisualDraft;
  onAnswerChange: (answerKey: string, value: string) => void;
  operationalDescriptionCoach?: {
    coachMessage: string | null;
    handleBlur: () => void;
    handleFocus: () => void;
    pathStepStates: OperationalPathProgress["stepStates"];
    statusHint: string | null;
    statusHintKind: OperationalCoachStatusKind;
  };
  operationalDescriptionIntroGuide?: {
    guide: OperationalDescriptionIntroGuide;
    showLeftExample: boolean;
  };
  question: RuntimeBlock0CanonicalQuestion;
}) {
  const questionRowProps = {
    helpText: question.helpText,
    helpTextKind: question.helpTextKind,
    isComplete: isQuestionConfirmedByUser(question, answers, initialAnswers),
    label: question.questionText,
    questionId: question.id,
  };

  const visibleSubfields =
    question.subfields?.filter((subfield) => subfield.id !== "user_correction_note") ??
    [];

  if (question.responseKind === "compound" && visibleSubfields.length) {
    return (
      <QuestionRow {...questionRowProps}>
        <div className={styles.compoundFields}>
          {visibleSubfields.map((subfield) => {
            const answerKey = buildBlock0AnswerKey(question.id, subfield.id);
            const fieldValue = answers[answerKey] ?? "";
            return (
              <div className={styles.compoundField} key={answerKey}>
                <p className={styles.compoundFieldLabel}>{subfield.label}</p>
                {renderAnswerField({
                  answerKey,
                  disabled,
                  epistemicState: subfield.epistemicState,
                  onChange: (value) => onAnswerChange(answerKey, value),
                  options: subfield.options,
                  responseKind: subfield.responseKind,
                  value: fieldValue,
                })}
              </div>
            );
          })}
        </div>
      </QuestionRow>
    );
  }

  const answerKey = buildBlock0AnswerKey(question.id);
  const fieldValue = answers[answerKey] ?? "";
  const isOperationalDescription = question.id === "B0-Q02";
  const isActivityBoundary = question.id === "B0-Q04";
  const showLeftExample = Boolean(
    isOperationalDescription && operationalDescriptionIntroGuide?.showLeftExample,
  );

  if (isActivityBoundary && activityBoundary) {
    return (
      <QuestionRow
        {...questionRowProps}
        rowClassName={styles.boundaryQuestionRow}
      >
        <ActivityBoundaryConfirmationPanel
          disabled={disabled}
          getSectionStatus={activityBoundary.getSectionStatus}
          getSectionValue={activityBoundary.getSectionValue}
          onSectionConfirm={activityBoundary.onSectionConfirm}
          onSectionManualChange={activityBoundary.onSectionManualChange}
          onSectionRequestCorrection={activityBoundary.onSectionRequestCorrection}
          review={activityBoundary.review}
        />
      </QuestionRow>
    );
  }

  return (
    <QuestionRow
      {...questionRowProps}
      leftAsideContent={
        showLeftExample ? (
          <OperationalDescriptionExampleAside
            guide={operationalDescriptionIntroGuide!.guide}
          />
        ) : undefined
      }
      rowClassName={
        showLeftExample ? styles.operationalDescriptionRow : undefined
      }
    >
      {showLeftExample ? (
        <OperationalDescriptionPromptCopy
          stepStates={
            operationalDescriptionCoach?.pathStepStates ?? {
              trigger: "active",
              transform: "pending",
              attenuation: "pending",
              output: "pending",
              handoff: "pending",
            }
          }
        />
      ) : null}
      {renderAnswerField({
        answerKey,
        coachStatusHint: isOperationalDescription
          ? operationalDescriptionCoach?.statusHint
          : null,
        coachStatusKind: isOperationalDescription
          ? operationalDescriptionCoach?.statusHintKind
          : null,
        disabled,
        epistemicState: question.epistemicState,
        onBlur: isOperationalDescription
          ? () => {
              operationalDescriptionCoach?.handleBlur();
            }
          : undefined,
        onChange: (value) => onAnswerChange(answerKey, value),
        onFocus: isOperationalDescription
          ? () => {
              operationalDescriptionCoach?.handleFocus();
            }
          : undefined,
        options: question.options,
        placeholder: isOperationalDescription
          ? OPERATIONAL_DESCRIPTION_UI.textareaPlaceholder
          : undefined,
        responseKind: question.responseKind,
        value: fieldValue,
      })}
    </QuestionRow>
  );
}

export function SignificadoDeTuTrabajo({
  workMap,
  sessionId,
  primaryActivitySelectionResult,
  participantActivityProgress,
  preRuntimeContextBundle,
  disabled = false,
  layout = "embedded",
  userDisplayName = "Usuario",
  initialVisualDraft,
  sessionMode = "demo",
  coachRequestHeaders,
  onBlock0ReviewProgressChange,
  onContinue,
  onBack,
}: SignificadoDeTuTrabajoProps) {
  const [draft, setDraft] = useState<SignificadoLocalDraft>(() =>
    hydrateDraftFromWorkMap(readSignificadoDraftOrEmpty(sessionId), workMap),
  );
  const [statusMessage, setStatusMessage] = useState("");

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
        total: effectivePrimaryActivitySelectionResult.selectedPrimaryActivities.length,
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

  const workMapBlock0Prefill = useMemo(
    () =>
      buildInitialBlock0VisualDraftFromWorkMap({
        workMap,
        primaryActivity:
          participantActivityProgress?.activity
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
  const continueLabel = resolveContinueCta(currentActivity.total > 1);
  const userInitials = resolveUserInitials(userDisplayName);
  const block0Progress = useMemo(
    () => countBlock0PreparedProgress(visualDraft),
    [visualDraft],
  );
  const isBlock0ReviewComplete =
    block0Progress.prepared === block0Progress.total;
  const hasRuntimeProgressActivity = Boolean(participantActivityProgress?.activity);
  const canContinue =
    (Boolean(effectivePrimaryActivitySelectionResult) || hasRuntimeProgressActivity) &&
    isWorkMapSaved &&
    submitGate.canSubmit &&
    isBlock0ReviewComplete;
  const continueHint = isBlock0ReviewComplete
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
      inputOrObject: visualDraft[
        buildBlock0AnswerKey("B0-Q01", "input_or_object")
      ],
      procedureOrStandard: visualDraft[
        buildBlock0AnswerKey("B0-Q01", "procedure_or_standard")
      ],
      outputOrResult: visualDraft[
        buildBlock0AnswerKey("B0-Q01", "output_or_result")
      ],
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

  const activityBoundaryReview = useMemo(
    () =>
      enhanceSignificadoActivityBoundaryReview(
        inferActivityBoundaryReview(
          operationalDescriptionText,
          operationalDescriptionContextBase,
        ),
        operationalDescriptionText,
      ),
    [operationalDescriptionContextBase, operationalDescriptionText],
  );

  const boundarySourceDraft =
    visualDraft["B0-Q04.boundary_source_draft"] ?? "";

  useEffect(() => {
    setVisualDraft((current) => {
      if (!shouldResetBoundarySections(current, operationalDescriptionText)) {
        return current;
      }

      return {
        ...current,
        ...buildBoundarySectionResetPatch(),
      };
    });
  }, [boundarySourceDraft, operationalDescriptionText]);

  const handleActivityBoundarySectionConfirm = (
    sectionId: ActivityBoundarySectionId,
  ) => {
    const section = activityBoundaryReview.sections.find(
      (item) => item.id === sectionId,
    );
    if (!section) {
      return;
    }

    setVisualDraft((current) => {
      const value =
        getBoundarySectionValue(current, sectionId) ||
        section.inferredSnippet ||
        "";
      if (!value.trim()) {
        return current;
      }

      return {
        ...current,
        ...buildBoundarySectionAcceptPatch({
          sectionId,
          value,
          inferredSnippet: section.inferredSnippet,
          operationalDescriptionText,
          currentAnswers: current,
        }),
      } as SignificadoVisualDraft;
    });
  };

  const handleActivityBoundarySectionRequestCorrection = (
    sectionId: ActivityBoundarySectionId,
  ) => {
    const section = activityBoundaryReview.sections.find(
      (item) => item.id === sectionId,
    );
    if (!section) {
      return;
    }

    setVisualDraft((current) => ({
      ...current,
      ...buildBoundarySectionCorrectionPatch({
        section,
        currentAnswers: current,
      }),
    }));
  };

  const handleActivityBoundarySectionManualChange = (
    sectionId: ActivityBoundarySectionId,
    value: string,
  ) => {
    setVisualDraft((current) => ({
      ...current,
      ...buildBoundarySectionDraftValuePatch({
        sectionId,
        value,
        currentAnswers: current,
      }),
    }));
  };

  useEffect(() => {
    if (!sessionId) return;
    writeSignificadoDraft(draft, sessionId);
  }, [draft, sessionId]);

  const handleAcknowledgeWarnings = () => {
    setStatusMessage("");
    setDraft((current) => acknowledgeSavedWithWarnings(current));
  };

  const handleContinue = () => {
    if (!isWorkMapSaved) {
      setStatusMessage(SIGNIFICADO_SAVE_REQUIRED_NOTICE);
      return;
    }

    if (!isBlock0ReviewComplete) {
      setStatusMessage(SIGNIFICADO_BLOCK0_INCOMPLETE_NOTICE);
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

    const runtimeBlock0ResponseBundle = buildRuntimeBlock0ResponseBundle({
      activityId: currentActivity.id,
      activityLabel: currentActivity.title,
      answers: visualDraft,
      initialAnswers: resolvedInitialVisualDraft,
    });

    clearSignificadoDraft(sessionId);
    onContinue?.({
      ...payload,
      block0Answers: visualDraft,
      runtimeBlock0ResponseBundle,
    });
  };

  const showWarningsBanner =
    workMap.savedWithWarnings && draft.global.savedWithWarningsAcknowledged !== true;

  const mainContent = (
    <>
      <ClientFlowHeader
        className={workMapStyles.pageHeader}
        subtitle={SIGNIFICADO_SCREEN_SUBTITLE}
        title={SIGNIFICADO_SCREEN_TITLE}
        userMenu={
          <SignificadoUserPill displayName={userDisplayName} initials={userInitials} />
        }
      />

      <section className={`${workMapStyles.workMapCard} ${styles.significadoSurface}`}>
        <div className={`${workMapStyles.workMapCardHeader} ${styles.significadoCardHeader}`}>
          <h3>{SIGNIFICADO_CARD_TITLE}</h3>
          <div className={workMapStyles.cardHeaderActions}>
            <span className={workMapStyles.draftSavedIndicator}>
              {formatActivityProgress(currentActivity.index, currentActivity.total)}
            </span>
            <span
              className={[
                workMapStyles.draftSavedIndicator,
                styles.progressBadge,
                block0Progress.prepared === block0Progress.total
                  ? styles.progressBadgeComplete
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {formatBlock0QuestionProgress(block0Progress.prepared, block0Progress.total)}
            </span>
          </div>
        </div>

        <div className={`${workMapStyles.cardTopNotice} ${styles.activityBanner}`}>
          <span
            aria-hidden="true"
            className={`${workMapStyles.cardTopNoticeIcon} ${styles.activityBannerIcon}`}
          >
            <InfoIcon />
          </span>
          <div className={workMapStyles.cardTopNoticeCopy}>
            <p className={workMapStyles.cardTopNoticeLead}>{currentActivity.title}</p>
          </div>
        </div>

        {!isWorkMapSaved ? (
          <div className={workMapStyles.cardTopNotice} role="alert">
            <span aria-hidden="true" className={workMapStyles.cardTopNoticeIcon}>
              <InfoIcon />
            </span>
            <div className={workMapStyles.cardTopNoticeCopy}>
              <p className={workMapStyles.cardTopNoticeLead}>
                {SIGNIFICADO_SAVE_REQUIRED_NOTICE}
              </p>
            </div>
          </div>
        ) : null}

        {showWarningsBanner ? (
          <div className={workMapStyles.cardTopNotice} role="status">
            <span aria-hidden="true" className={workMapStyles.cardTopNoticeIcon}>
              <InfoIcon />
            </span>
            <div className={workMapStyles.cardTopNoticeCopy}>
              <p className={workMapStyles.cardTopNoticeLead}>
                {SIGNIFICADO_SAVED_WITH_WARNINGS_NOTICE}
              </p>
              <button
                className={workMapStyles.backButton}
                disabled={disabled}
                onClick={handleAcknowledgeWarnings}
                style={{ marginTop: 10 }}
                type="button"
              >
                Entendido, continuar
              </button>
            </div>
          </div>
        ) : null}

        {statusMessage ? (
          <div className={workMapStyles.cardTopNotice} role="alert">
            <span aria-hidden="true" className={workMapStyles.cardTopNoticeIcon}>
              <InfoIcon />
            </span>
            <div className={workMapStyles.cardTopNoticeCopy}>
              <p className={workMapStyles.cardTopNoticeLead}>{statusMessage}</p>
            </div>
          </div>
        ) : null}

        <div className={`${workMapStyles.workTable} ${styles.significadoWorkTable}`}>
          <div
            className={`${workMapStyles.workMapTableHeader} ${styles.tableHeaderMuted}`}
            aria-hidden="true"
          >
            <div>{SIGNIFICADO_TABLE_HEADER_SECTION}</div>
            <div>{SIGNIFICADO_TABLE_HEADER_CONTENT}</div>
          </div>
          {RUNTIME_BLOCK0_CANONICAL_QUESTIONS.map((question) => (
            <RuntimeBlock0Question
              activityBoundary={
                question.id === "B0-Q04"
                  ? {
                      getSectionStatus: (sectionId) =>
                        getBoundarySectionStatus(visualDraft, sectionId),
                      getSectionValue: (sectionId) =>
                        getBoundarySectionDraftValue(visualDraft, sectionId),
                      onSectionConfirm: handleActivityBoundarySectionConfirm,
                      onSectionManualChange:
                        handleActivityBoundarySectionManualChange,
                      onSectionRequestCorrection:
                        handleActivityBoundarySectionRequestCorrection,
                      review: activityBoundaryReview,
                    }
                  : undefined
              }
              answers={visualDraft}
              disabled={disabled}
              initialAnswers={resolvedInitialVisualDraft}
              key={question.id}
              onAnswerChange={(answerKey, value) =>
                setVisualDraft((current) => ({
                  ...current,
                  [answerKey]: value,
                }))
              }
              operationalDescriptionCoach={operationalDescriptionCoach}
              operationalDescriptionIntroGuide={operationalDescriptionIntroGuide}
              question={question}
            />
          ))}
        </div>

        <div className={`${workMapStyles.workMapCardFooter} ${styles.significadoCardFooter}`}>
          {onBack ? (
            <button
              className={workMapStyles.backButton}
              disabled={disabled}
              onClick={onBack}
              type="button"
            >
              {SIGNIFICADO_CTA_BACK}
            </button>
          ) : (
            <span />
          )}
          <div className={`${workMapStyles.footerRight} ${styles.footerActions}`}>
            <p
              className={`${workMapStyles.reviewContinueHint} ${styles.footerContinueHint} ${
                !isBlock0ReviewComplete ? styles.footerContinueHintPending : ""
              }`}
            >
              {continueHint}
            </p>
            <button
              className={`${workMapStyles.continueButton} ${styles.continueButtonAccent} ${styles.continueButtonMobile}`}
              disabled={disabled || !canContinue}
              onClick={handleContinue}
              type="button"
            >
              {continueLabel}
            </button>
          </div>
        </div>
      </section>
    </>
  );

  if (layout === "embedded") {
    return <div className={`${workMapStyles.main} ${styles.significadoMain}`}>{mainContent}</div>;
  }

  return (
    <div className={workMapStyles.workMapOuter}>
      <div className={`${workMapStyles.appShell} ${styles.significadoShell}`}>
        <aside className={`${workMapStyles.sidebar} ${styles.significadoSidebar}`}>
          <div className={workMapStyles.sidebarLogo}>
            <EveLogo size="sm" variant="muted" />
          </div>

          <SignificadoJourneySteps />

          <section
            aria-labelledby="significado-guide-heading"
            className={workMapStyles.guideCard}
          >
            <div aria-hidden="true" className={workMapStyles.guideCardIcon}>
              <DocumentIcon />
            </div>
            <h2 className={workMapStyles.guideCardTitle} id="significado-guide-heading">
              {SIGNIFICADO_SIDE_CARD_TITLE}
            </h2>
            <div className={workMapStyles.guideCognitiveBody}>
              <p className={workMapStyles.guideCognitiveText}>{SIGNIFICADO_SIDE_CARD_BODY}</p>
              <p className={workMapStyles.guideCognitiveText}>
                {formatActivityProgress(currentActivity.index, currentActivity.total)}
              </p>
              <p className={workMapStyles.guideCognitiveExample}>
                {currentActivity.shortName || currentActivity.title}
              </p>
            </div>
          </section>

          <div className={workMapStyles.sidebarFooter}>
            <p className={workMapStyles.sidebarFooterText}>
              {SIGNIFICADO_SIDEBAR_FOOTER_LEAD}
              <br />
              {SIGNIFICADO_SIDEBAR_FOOTER_SUB}
            </p>
          </div>
        </aside>

        <main className={`${workMapStyles.main} ${styles.significadoMain}`}>{mainContent}</main>
      </div>
    </div>
  );
}
