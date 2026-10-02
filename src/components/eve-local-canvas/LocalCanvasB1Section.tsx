"use client";

/**
 * @deprecated UI-B1 visual candidate is `LocalCanvasB1InstrumentSection`.
 * Kept only as archived shell reference — do not mount in product or new previews.
 */

import { useLayoutEffect, useRef, useState } from "react";
import { EveLogo } from "@/components/EveLogo";
import type {
  B1PresentationViewModel,
  B1SlotAnswer,
  B1SlotPresentation,
} from "./b1-presentation-contract";
import styles from "./canvas-b1.module.css";

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function B1FrameMarquee({ items }: { items: readonly string[] }) {
  const track = [...items, ...items];
  return (
    <div aria-hidden="true" className={styles.sheetMarquee}>
      <div className={styles.sheetMarqueeTrack}>
        {track.map((item, index) => (
          <span className={styles.sheetMarqueeItem} key={`${item}-${index}`}>
            <span className={styles.sheetMarqueeDot} />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function SlotControl({
  slot,
  answer,
  disabled,
  onChange,
}: {
  slot: B1SlotPresentation;
  answer: B1SlotAnswer | undefined;
  disabled?: boolean;
  onChange: (patch: Partial<B1SlotAnswer>) => void;
}) {
  if (slot.control_family === "free_text" || slot.control_family === "clarification") {
    return (
      <label className={styles.significadoField}>
        <span>{slot.control_family === "clarification" ? "Aclaración" : "Tu respuesta"}</span>
        <textarea
          data-control-family={slot.control_family}
          data-field-key={slot.field_key}
          data-slot-ref={slot.slot_ref}
          disabled={disabled}
          id={`b1-${slot.field_key}`}
          maxLength={slot.max_chars ?? undefined}
          onChange={(event) => onChange({ text: event.target.value })}
          placeholder="Respuesta breve"
          rows={3}
          value={answer?.text ?? ""}
        />
      </label>
    );
  }

  if (slot.control_family === "multi_choice") {
    const selected = new Set(answer?.choiceIds ?? []);
    const showComplementary =
      Boolean(slot.free_text_when_option_id) &&
      selected.has(slot.free_text_when_option_id!);

    return (
      <div className={styles.comoChoiceStack}>
        <div
          aria-label={slot.question_text}
          className={styles.significadoStanceRow}
          data-control-family="multi_choice"
          role="group"
        >
          {(slot.options ?? []).map((option) => {
            const pressed = selected.has(option.option_id);
            return (
              <button
                aria-pressed={pressed}
                className={cx(
                  styles.significadoStanceButton,
                  pressed && styles.significadoStanceButtonActive,
                )}
                data-field-key={slot.field_key}
                data-option-id={option.option_id}
                data-slot-ref={slot.slot_ref}
                disabled={disabled}
                key={option.option_id}
                onClick={() => {
                  const next = new Set(selected);
                  if (pressed) next.delete(option.option_id);
                  else next.add(option.option_id);
                  const choiceIds = Array.from(next);
                  onChange({
                    choiceIds,
                    complementaryText: choiceIds.includes(
                      slot.free_text_when_option_id ?? "",
                    )
                      ? answer?.complementaryText
                      : undefined,
                  });
                }}
                type="button"
              >
                {option.option_label}
              </button>
            );
          })}
        </div>
        {showComplementary ? (
          <label className={styles.significadoField}>
            <span>Especifica</span>
            <textarea
              data-complementary-for={slot.free_text_when_option_id ?? undefined}
              data-control-family="choice_plus_text_complement"
              data-field-key={slot.field_key}
              data-slot-ref={slot.slot_ref}
              disabled={disabled}
              onChange={(event) => onChange({ complementaryText: event.target.value })}
              placeholder="Detalle breve del canal"
              rows={2}
              value={answer?.complementaryText ?? ""}
            />
          </label>
        ) : null}
      </div>
    );
  }

  const showComplementary =
    Boolean(answer?.choiceId) &&
    Boolean(slot.free_text_when_option_id) &&
    answer?.choiceId === slot.free_text_when_option_id;

  return (
    <div className={styles.comoChoiceStack}>
      <div
        aria-label={slot.question_text}
        className={styles.significadoStanceRow}
        data-control-family={slot.control_family}
        role="group"
      >
        {(slot.options ?? []).map((option) => (
          <button
            aria-pressed={answer?.choiceId === option.option_id}
            className={cx(
              styles.significadoStanceButton,
              answer?.choiceId === option.option_id && styles.significadoStanceButtonActive,
            )}
            data-field-key={slot.field_key}
            data-option-id={option.option_id}
            data-slot-ref={slot.slot_ref}
            disabled={disabled}
            key={option.option_id}
            onClick={() =>
              onChange({
                choiceId: option.option_id,
                complementaryText:
                  option.option_id === slot.free_text_when_option_id
                    ? answer?.complementaryText
                    : undefined,
              })
            }
            type="button"
          >
            {option.option_label}
          </button>
        ))}
      </div>
      {showComplementary ? (
        <label className={styles.significadoField}>
          <span>Especifica</span>
          <textarea
            data-complementary-for={slot.free_text_when_option_id ?? undefined}
            data-control-family="choice_plus_text_complement"
            data-field-key={slot.field_key}
            data-slot-ref={slot.slot_ref}
            disabled={disabled}
            onChange={(event) => onChange({ complementaryText: event.target.value })}
            placeholder="Detalle breve"
            rows={2}
            value={answer?.complementaryText ?? answer?.text ?? ""}
          />
        </label>
      ) : null}
    </div>
  );
}

function isSlotAnswered(slot: B1SlotPresentation, answer: B1SlotAnswer | undefined) {
  if (!answer) return false;
  if (slot.control_family === "free_text" || slot.control_family === "clarification") {
    return Boolean(answer.text?.trim());
  }
  if (slot.control_family === "multi_choice") {
    if (!answer.choiceIds?.length) return false;
    if (
      slot.free_text_when_option_id &&
      answer.choiceIds.includes(slot.free_text_when_option_id)
    ) {
      return Boolean(answer.complementaryText?.trim());
    }
    return true;
  }
  if (!answer.choiceId) return false;
  if (
    slot.free_text_when_option_id &&
    answer.choiceId === slot.free_text_when_option_id
  ) {
    return Boolean(answer.complementaryText?.trim() || answer.text?.trim());
  }
  return true;
}

export type LocalCanvasB1SectionProps = {
  viewModel: B1PresentationViewModel;
  answers: Record<string, B1SlotAnswer>;
  onChange: (fieldKey: string, patch: Partial<B1SlotAnswer>) => void;
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  note?: string | null;
  disabled?: boolean;
};

/**
 * @deprecated Use `LocalCanvasB1InstrumentSection` (approved UI-B1 visual candidate).
 * Archived ComoOcurre-style shell — no product mount.
 */
export function LocalCanvasB1Section({
  viewModel,
  answers,
  onChange,
  onContinue,
  continueLabel = "Continuar ↓",
  continueDisabled = false,
  note = null,
  disabled = false,
}: LocalCanvasB1SectionProps) {
  const activity = viewModel.activity;
  const [literalExpanded, setLiteralExpanded] = useState(false);
  const [literalOverflows, setLiteralOverflows] = useState(false);
  const [literalActivityKey, setLiteralActivityKey] = useState(
    activity.activityLiteral,
  );
  const literalRef = useRef<HTMLParagraphElement>(null);

  if (literalActivityKey !== activity.activityLiteral) {
    setLiteralActivityKey(activity.activityLiteral);
    setLiteralExpanded(false);
  }

  useLayoutEffect(() => {
    const el = literalRef.current;
    if (!el || literalExpanded) return;
    setLiteralOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [activity.activityLiteral, literalExpanded]);

  const slots = viewModel.slots;

  return (
    <section
      aria-labelledby="official-b1-title"
      className={styles.b1Screen}
      data-official-section="B1"
      data-presentation-kind={viewModel.presentation_kind}
      data-presentation-surface={viewModel.presentation_surface}
      id="official-b1"
    >
      <header>
        <div className={styles.workmapTopbar}>
          <EveLogo className={styles.workmapTopbarLogo} size="sm" />
          <div>
            Strategic & Operational Architecture{"\u00a0"} / Enterprise Viability Engine
          </div>
        </div>
      </header>

      <div className={styles.comoStickyRail}>
        <div className={styles.comoActivityAnchor}>
          <div className={styles.comoActivityMetaRow}>
            <div className={styles.workmapKicker}>
              {activity.heading ?? "Actividad seleccionada"}
            </div>
            {activity.area ? (
              <span className={styles.comoActivityArea}>{activity.area}</span>
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
          {viewModel.presentation_kind === "runtime_bound" ? (
            <p className={styles.stubBadge} role="status">
              B1 conectado a Runtime
            </p>
          ) : viewModel.presentation_kind === "visual_candidate" ? (
            <p className={styles.stubBadge} role="status">
              Candidato visual B1 — sin binding Runtime
            </p>
          ) : (
            <p className={styles.stubBadge} role="status">
              Fixture de referencia ({viewModel.presentation_surface}) — no productivo
            </p>
          )}
        </div>
      </div>

      <div className={styles.comoIntro}>
        <h2 className={styles.comoIntroVisuallyHidden} id="official-b1-title">
          Disparador — Bloque 1
        </h2>
        <p className={styles.comoFrameLine}>{viewModel.frame_line}</p>
        <B1FrameMarquee items={viewModel.frame_marquee} />
      </div>

      <div className={styles.comoQuestionStack}>
        {slots.map((slot, index) => {
          const prev = index > 0 ? slots[index - 1] : null;
          const showBandIntro = !prev || prev.band.id !== slot.band.id;
          const answered = isSlotAnswered(slot, answers[slot.field_key]);
          const answer = answers[slot.field_key];

          return (
            <div
              className={cx(
                styles.comoCaptureBand,
                showBandIntro && styles.comoCaptureBandStart,
                !showBandIntro && styles.comoCaptureBandFollow,
                answered && styles.comoCaptureBandAnswered,
              )}
              data-band-id={slot.band.id}
              data-field-key={slot.field_key}
              data-matrix-interaction={slot.matrix_interaction_hint ?? undefined}
              data-slot-ref={slot.slot_ref}
              data-source-code={slot.source_code}
              id={`b1-slot-${slot.source_code}`}
              key={slot.field_key}
            >
              <aside className={styles.workmapSideMeta}>
                {showBandIntro ? (
                  <>
                    <div className={styles.workmapKicker}>{slot.band.kicker}</div>
                    <p>{slot.band.guide}</p>
                  </>
                ) : (
                  <div className={styles.comoCaptureFollowLabel}>{slot.short_ui_label}</div>
                )}
              </aside>
              <div className={styles.significadoBandBody}>
                <h3 className={styles.comoQuestionTitle}>{slot.question_text}</h3>
                {slot.help_text ? (
                  <p className={styles.comoStepHelp} data-assistance="runtime_help_text">
                    {slot.help_text}
                  </p>
                ) : null}
                <SlotControl
                  answer={answer}
                  disabled={disabled}
                  onChange={(patch) => onChange(slot.field_key, patch)}
                  slot={slot}
                />
              </div>
            </div>
          );
        })}
      </div>

      <footer className={styles.significadoFooter}>
        <aside className={styles.workmapSideMeta}>
          <div className={styles.workmapKicker}>SIGUIENTE</div>
          <p>
            Esta pantalla no decide la siguiente interacción. La conexión Runtime queda
            fuera de esta materialidad visual.
          </p>
        </aside>
        <p>
          {note ??
            "Candidato visual B1 listo para binding posterior (sin Renderer / BFF en esta ola)."}
        </p>
        <button
          className={styles.sheetAdvanceQuiet}
          disabled={disabled || continueDisabled || !onContinue}
          onClick={onContinue}
          type="button"
        >
          {continueLabel}
        </button>
      </footer>

      <span className={styles.visuallyHidden} aria-hidden="true">
        block={viewModel.block}; surface={viewModel.presentation_surface}; slots=
        {slots.length}
      </span>
    </section>
  );
}
