"use client";

/**
 * Official B3 visual candidate — same Instrumento architecture as B1.
 * Only Madre B3 content / control families adapted. No alternate chrome.
 */

import { useLayoutEffect, useRef, useState } from "react";
import { EveLogo } from "@/components/EveLogo";
import type {
  B3PresentationViewModel,
  B3SlotAnswer,
  B3SlotPresentation,
} from "./b3-presentation-contract";
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
  slot: B3SlotPresentation;
  answer: B3SlotAnswer | undefined;
  disabled?: boolean;
  onChange: (patch: Partial<B3SlotAnswer>) => void;
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

function RankingControl({
  slot,
  answer,
  disabled,
  onChange,
}: {
  slot: B3SlotPresentation;
  answer: B3SlotAnswer | undefined;
  disabled?: boolean;
  onChange: (patch: Partial<B3SlotAnswer>) => void;
}) {
  const options = slot.options ?? [];
  const ranked =
    answer?.rankedIds && answer.rankedIds.length === options.length
      ? answer.rankedIds
      : options.map((option) => option.option_id);
  const labelById = new Map(options.map((option) => [option.option_id, option.option_label]));

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= ranked.length) return;
    const next = [...ranked];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange({ rankedIds: next });
  };

  return (
    <div
      aria-label={slot.question_text}
      className={styles.optionGrid}
      data-control-family="ranking"
      data-slot-ref={slot.slot_ref}
      role="list"
    >
      {ranked.map((id, index) => (
        <div key={id} role="listitem" style={{ display: "grid", gap: 6 }}>
          <button
            className={cx(styles.option, styles.optionSelected)}
            disabled={disabled}
            type="button"
          >
            <span>
              {String(index + 1).padStart(2, "0")} · {labelById.get(id) ?? id}
            </span>
          </button>
          <div style={{ display: "flex", gap: 16 }}>
            <button
              className={styles.literalToggle}
              disabled={disabled || index === 0}
              onClick={() => move(index, -1)}
              type="button"
            >
              Subir
            </button>
            <button
              className={styles.literalToggle}
              disabled={disabled || index === ranked.length - 1}
              onClick={() => move(index, 1)}
              type="button"
            >
              Bajar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function SlotBody({
  slot,
  answer,
  disabled,
  onChange,
}: {
  slot: B3SlotPresentation;
  answer: B3SlotAnswer | undefined;
  disabled?: boolean;
  onChange: (patch: Partial<B3SlotAnswer>) => void;
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

  if (slot.control_family === "ranking") {
    return (
      <RankingControl answer={answer} disabled={disabled} onChange={onChange} slot={slot} />
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

export type LocalCanvasB3InstrumentSectionProps = {
  viewModel: B3PresentationViewModel;
  answers: Record<string, B3SlotAnswer>;
  onChange: (fieldKey: string, patch: Partial<B3SlotAnswer>) => void;
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  note?: string | null;
  disabled?: boolean;
};

export function LocalCanvasB3InstrumentSection({
  viewModel,
  answers,
  onChange,
  onContinue,
  continueLabel = "Seguir en la hoja ↓",
  continueDisabled = false,
  note = null,
  disabled = false,
}: LocalCanvasB3InstrumentSectionProps) {
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
      aria-labelledby="b3-instrument-title"
      className={styles.screen}
      data-official-section="B3"
      data-presentation-kind={viewModel.presentation_kind}
      data-presentation-variant="instrumento"
      id="official-b2"
    >
      <header className={styles.topbar}>
        <EveLogo className={styles.logo} size="sm" />
        <div className={styles.topbarRight}>
          <div className={styles.slogan}>
            Strategic & Operational Architecture{"\u00a0"} / Enterprise Viability Engine
          </div>
          <p className={styles.instrumentTag}>Bloque 03 · Salida</p>
        </div>
      </header>

      <div className={styles.intro}>
        <h2 className={styles.title} id="b3-instrument-title">
          Qué sale<br />
          de esta memoria operativa y a quién llega
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
            id={`b3-slot-${slot.source_code}`}
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

      <footer className={styles.footer} id="b3-footer">
        <aside className={styles.footerMeta}>
          <div className={styles.number}>SIGUIENTE</div>
          <p>
            Esta pantalla no decide la siguiente interacción. La conexión Runtime queda
            fuera de esta materialidad visual.
          </p>
        </aside>
        <p className={styles.footerNote}>
          {note ??
            "Candidato visual B3 (Instrumento / Salida) listo para binding posterior."}
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
