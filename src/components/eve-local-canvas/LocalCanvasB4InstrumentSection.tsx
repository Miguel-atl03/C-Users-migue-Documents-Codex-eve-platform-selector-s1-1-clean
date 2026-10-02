"use client";

/**
 * Official B4 visual candidate — same Instrumento architecture as B1.
 * Only Madre B4 content / control families adapted. No alternate chrome.
 */

import { useLayoutEffect, useRef, useState } from "react";
import { EveLogo } from "@/components/EveLogo";
import type {
  B4PresentationViewModel,
  B4SlotAnswer,
  B4SlotPresentation,
} from "./b4-presentation-contract";
import styles from "./canvas-b1-instrument.module.css";

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function OptionGrid({
  slot,
  answer,
  disabled,
  onChange,
}: {
  slot: B4SlotPresentation;
  answer: B4SlotAnswer | undefined;
  disabled?: boolean;
  onChange: (patch: Partial<B4SlotAnswer>) => void;
}) {
  const multi = slot.control_family === "multi_choice";
  const selectedIds = multi
    ? new Set(answer?.choiceIds ?? [])
    : new Set(answer?.choiceId ? [answer.choiceId] : []);
  const count = slot.options?.length ?? 0;
  const gridClass =
    count >= 6
      ? styles.optionGridSix
      : count === 5
        ? styles.optionGridFive
        : count === 3
          ? styles.optionGridThree
          : styles.optionGridFour;

  return (
    <div
      aria-label={slot.question_text}
      className={cx(styles.optionGrid, gridClass)}
      data-control-family={slot.control_family}
      data-slot-ref={slot.slot_ref}
      role={multi ? "group" : "radiogroup"}
    >
      {(slot.options ?? []).map((option) => {
        const active = selectedIds.has(option.option_id);
        return (
          <button
            aria-pressed={active}
            className={cx(styles.option, active && styles.optionSelected)}
            data-field-key={slot.field_key}
            data-option-id={option.option_id}
            data-slot-ref={slot.slot_ref}
            disabled={disabled}
            key={option.option_id}
            onClick={() => {
              if (multi) {
                const next = new Set(selectedIds);
                if (active) next.delete(option.option_id);
                else next.add(option.option_id);
                const choiceIds = Array.from(next);
                onChange({
                  choiceIds,
                  complementaryText: choiceIds.includes(slot.free_text_when_option_id ?? "")
                    ? answer?.complementaryText
                    : undefined,
                });
                return;
              }
              onChange({
                choiceId: option.option_id,
                complementaryText:
                  option.option_id === slot.free_text_when_option_id
                    ? answer?.complementaryText
                    : undefined,
              });
            }}
            type="button"
          >
            <span>{option.option_label}</span>
          </button>
        );
      })}
    </div>
  );
}

function SlotBody({
  slot,
  answer,
  disabled,
  onChange,
}: {
  slot: B4SlotPresentation;
  answer: B4SlotAnswer | undefined;
  disabled?: boolean;
  onChange: (patch: Partial<B4SlotAnswer>) => void;
}) {
  if (slot.control_family === "free_text" || slot.control_family === "clarification") {
    return (
      <label className={styles.field}>
        <span>{slot.control_family === "clarification" ? "Aclaración" : "Tu respuesta"}</span>
        <textarea
          data-control-family={slot.control_family}
          data-field-key={slot.field_key}
          data-slot-ref={slot.slot_ref}
          disabled={disabled}
          maxLength={slot.max_chars ?? undefined}
          onChange={(event) => onChange({ text: event.target.value })}
          placeholder="Respuesta breve"
          rows={3}
          value={answer?.text ?? ""}
        />
      </label>
    );
  }

  const showComplementary = slot.free_text_when_option_id
    ? slot.control_family === "multi_choice"
      ? Boolean(answer?.choiceIds?.includes(slot.free_text_when_option_id))
      : answer?.choiceId === slot.free_text_when_option_id
    : false;

  return (
    <>
      <OptionGrid answer={answer} disabled={disabled} onChange={onChange} slot={slot} />
      {showComplementary ? (
        <label className={styles.field}>
          <span>Especifica</span>
          <input
            data-complementary-for={slot.free_text_when_option_id ?? undefined}
            data-control-family="choice_plus_text_complement"
            data-field-key={slot.field_key}
            data-slot-ref={slot.slot_ref}
            disabled={disabled}
            onChange={(event) => onChange({ complementaryText: event.target.value })}
            placeholder="Detalle breve"
            type="text"
            value={answer?.complementaryText ?? ""}
          />
        </label>
      ) : null}
    </>
  );
}

export type LocalCanvasB4InstrumentSectionProps = {
  viewModel: B4PresentationViewModel;
  answers: Record<string, B4SlotAnswer>;
  onChange: (fieldKey: string, patch: Partial<B4SlotAnswer>) => void;
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  note?: string | null;
  disabled?: boolean;
};

export function LocalCanvasB4InstrumentSection({
  viewModel,
  answers,
  onChange,
  onContinue,
  continueLabel = "Seguir en la hoja ↓",
  continueDisabled = false,
  note = null,
  disabled = false,
}: LocalCanvasB4InstrumentSectionProps) {
  const activity = viewModel.activity;
  const [literalExpanded, setLiteralExpanded] = useState(false);
  const [literalOverflows, setLiteralOverflows] = useState(false);
  const [literalActivityKey, setLiteralActivityKey] = useState(activity.activityLiteral);
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

  return (
    <section
      aria-labelledby="b4-instrument-title"
      className={styles.screen}
      data-official-section="B4"
      data-presentation-kind={viewModel.presentation_kind}
      data-presentation-variant="instrumento"
      id="official-b4"
    >
      <header className={styles.topbar}>
        <EveLogo className={styles.logo} size="sm" />
        <div className={styles.topbarRight}>
          <div className={styles.slogan}>
            Strategic & Operational Architecture{"\u00a0"} / Enterprise Viability Engine
          </div>
          <p className={styles.instrumentTag}>Bloque 04 · Cadena causal</p>
        </div>
      </header>

      <div className={styles.intro}>
        <h2 className={styles.title} id="b4-instrument-title">
          Cómo fluye
          <br />
          y dónde se bloquea esta memoria operativa
        </h2>
        <p className={styles.subtitle}>{viewModel.frame_line}</p>
      </div>

      <div className={styles.activitySticky} data-activity-anchor="sticky">
        <div className={styles.activityRow}>
          <span className={styles.activityRowMeta}>
            / {activity.area?.trim() || activity.heading || "Actividad"}
          </span>
          <div className={styles.activityRowMain}>
            <p
              className={cx(
                styles.activityLiteral,
                !literalExpanded && styles.activityLiteralClamped,
              )}
              ref={literalRef}
              title={activity.activityLiteral}
            >
              {activity.activityLiteral}
            </p>
            {literalOverflows || literalExpanded ? (
              <button
                className={styles.literalToggle}
                onClick={() => setLiteralExpanded((prev) => !prev)}
                type="button"
              >
                {literalExpanded ? "Recoger" : "Ver completa"}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className={styles.questions}>
        {viewModel.slots.map((slot, index) => (
          <section
            className={styles.question}
            data-field-key={slot.field_key}
            data-slot-ref={slot.slot_ref}
            data-source-code={slot.source_code}
            id={`b4-slot-${slot.source_code}`}
            key={slot.field_key}
          >
            <aside className={styles.meta}>
              <div className={styles.number}>
                {String(index + 1).padStart(2, "0")} / {slot.source_code} /{" "}
                {slot.short_ui_label.toUpperCase()}
              </div>
              <p>{slot.band.guide}</p>
            </aside>
            <div className={styles.body}>
              <h3>{slot.question_text}</h3>
              {slot.help_text ? (
                <p className={styles.help} data-assistance="runtime_help_text">
                  {slot.help_text}
                </p>
              ) : null}
              <SlotBody
                answer={answers[slot.field_key]}
                disabled={disabled}
                onChange={(patch) => onChange(slot.field_key, patch)}
                slot={slot}
              />
            </div>
          </section>
        ))}
      </div>

      <footer className={styles.footer} id="b4-footer">
        <aside className={styles.footerMeta}>
          <div className={styles.number}>SIGUIENTE</div>
          <p>
            Esta pantalla no decide la siguiente interacción. La conexión Runtime queda
            fuera de esta materialidad visual.
          </p>
        </aside>
        <p className={styles.footerNote}>
          {note ??
            "Candidato visual B4 (Instrumento / Cadena causal) listo para binding posterior."}
        </p>
        <button
          className={styles.advance}
          disabled={disabled || continueDisabled || !onContinue}
          onClick={onContinue}
          type="button"
        >
          {continueLabel}
        </button>
      </footer>
    </section>
  );
}
