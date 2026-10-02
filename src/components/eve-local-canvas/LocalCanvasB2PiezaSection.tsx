"use client";

/**
 * Bloque 2 · La pieza — React port of deliverables/design/eve-b2-la-pieza-v1.html.
 *
 * Same presentation contract as LocalCanvasB2InstrumentSection: the ViewModel decides
 * which slots exist; this shell only places them on the plano (cota + tramos + islas).
 * Copy comes from the slots (Madre B2 v2.1), never from the design exploration.
 * Tramo navigation is visual pagination, not a next-interaction sequencer.
 */

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { B2_BLOCK_META } from "./b2-madre-copy";
import type {
  B2PresentationViewModel,
  B2SlotAnswer,
  B2SlotPresentation,
} from "./b2-presentation-contract";
import { scrollToLocalCanvasSection } from "./scroll-to-section";
import styles from "./canvas-b2-pieza.module.css";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type TramoId = "foco" | "antes" | "haces" | "queda" | "magnitud" | "sombra" | "limita" | "otros";
type IslePos = "up" | "down" | "far" | "top" | "l" | "c2" | "r" | "w34" | "w40" | "w44";
type IsleLayout = { key: string; pos: readonly IslePos[]; codes: readonly string[] };
type TramoLayout = { id: TramoId; isles: readonly IsleLayout[] };

const TRAMO_LAYOUT: readonly TramoLayout[] = [
  {
    id: "foco",
    isles: [
      { key: "foco-up", pos: ["up", "l", "w44"], codes: ["2.1"] },
      { key: "foco-down", pos: ["down", "l", "w44"], codes: ["2.1a", "2.1b", "2.1c"] },
    ],
  },
  { id: "antes", isles: [{ key: "antes", pos: ["down", "l", "w34"], codes: ["2.5"] }] },
  { id: "haces", isles: [{ key: "haces", pos: ["down", "c2", "w34"], codes: ["2.4a", "2.4b"] }] },
  {
    id: "queda",
    isles: [
      {
        key: "queda",
        pos: ["down", "r", "w34"],
        codes: ["2.6", "2.2_obj", "2.2_suj", "2.2_acc"],
      },
    ],
  },
  {
    id: "magnitud",
    isles: [
      { key: "mag-top", pos: ["top", "l", "w40"], codes: ["2.3"] },
      { key: "mag-27", pos: ["down", "far", "l", "w40"], codes: ["2.7"] },
      { key: "mag-28", pos: ["down", "far", "r", "w34"], codes: ["2.8"] },
    ],
  },
  {
    id: "sombra",
    isles: [
      { key: "sombra-l", pos: ["down", "l", "w40"], codes: ["2.9", "2.10", "2.B"] },
      { key: "sombra-r", pos: ["down", "r", "w40"], codes: ["2.11", "2.12", "2.C"] },
    ],
  },
  {
    id: "limita",
    isles: [
      {
        key: "limita-l",
        pos: ["down", "l", "w40"],
        codes: [
          "2.1_AB_Relacion",
          "2.1_AC_Relacion",
          "2.1_BC_Relacion",
          "2.1_ABC_Relacion",
          "2.A",
        ],
      },
      { key: "limita-r", pos: ["down", "r", "w34"], codes: ["2.1_ABC_Prioridad"] },
    ],
  },
];

const OTHER_ISLE_POS: readonly IslePos[] = ["down", "l", "w44"];
const STORY_SOURCE: Record<"antes" | "haces" | "queda", string> = {
  antes: "2.5",
  haces: "2.4a",
  queda: "2.6",
};
const SCALE_SOURCE = "2.3";
const REFERENT_SOURCES = ["2.1a", "2.1b", "2.1c"] as const;
const PLACEHOLDER_SOURCE: Record<string, string> = {
  OBJETO: "2.1a",
  SUJETO: "2.1b",
  "ACCIÓN": "2.1c",
  ACCION: "2.1c",
};
const ROW_LABEL_MAX = 18;

type PlacedIsle = { key: string; pos: readonly IslePos[]; slots: B2SlotPresentation[] };
type PlacedTramo = { id: TramoId; isles: PlacedIsle[]; slots: B2SlotPresentation[] };

function placeSlots(slots: readonly B2SlotPresentation[]): PlacedTramo[] {
  const used = new Set<string>();
  const tramos: PlacedTramo[] = [];
  for (const layout of TRAMO_LAYOUT) {
    const isles: PlacedIsle[] = [];
    for (const isle of layout.isles) {
      const isleSlots = isle.codes.flatMap((code) =>
        slots.filter((slot) => slot.source_code === code),
      );
      isleSlots.forEach((slot) => used.add(slot.field_key));
      if (isleSlots.length > 0) isles.push({ key: isle.key, pos: isle.pos, slots: isleSlots });
    }
    if (isles.length > 0) {
      tramos.push({ id: layout.id, isles, slots: isles.flatMap((isle) => isle.slots) });
    }
  }
  const rest = slots.filter((slot) => !used.has(slot.field_key));
  if (rest.length > 0) {
    tramos.push({
      id: "otros",
      isles: [{ key: "otros", pos: OTHER_ISLE_POS, slots: rest }],
      slots: rest,
    });
  }
  return tramos;
}

function isleClass(pos: readonly IslePos[]) {
  return cx(styles.isle, ...pos.map((p) => styles[p]));
}

function needsComplement(slot: B2SlotPresentation, answer: B2SlotAnswer | undefined) {
  const ft = slot.free_text_when_option_id;
  if (!ft) return false;
  return slot.control_family === "multi_choice"
    ? Boolean(answer?.choiceIds?.includes(ft))
    : answer?.choiceId === ft;
}

function isAnswered(slot: B2SlotPresentation, answer: B2SlotAnswer | undefined) {
  if (!answer) return false;
  switch (slot.control_family) {
    case "free_text":
    case "clarification":
      return Boolean(answer.text?.trim());
    case "ranking": {
      const total = slot.options?.length ?? 0;
      return total > 0 && (answer.rankedIds?.length ?? 0) === total;
    }
    case "multi_choice":
      if (!answer.choiceIds?.length) return false;
      return needsComplement(slot, answer) ? Boolean(answer.complementaryText?.trim()) : true;
    default:
      if (!answer.choiceId) return false;
      return needsComplement(slot, answer) ? Boolean(answer.complementaryText?.trim()) : true;
  }
}

function answerLiteral(slot: B2SlotPresentation | undefined, answer: B2SlotAnswer | undefined) {
  if (!slot || !answer) return "";
  const labelOf = (id: string) =>
    slot.options?.find((option) => option.option_id === id)?.option_label ?? id;
  const complement = answer.complementaryText?.trim();
  switch (slot.control_family) {
    case "free_text":
    case "clarification":
      return answer.text?.trim() ?? "";
    case "ranking":
      return (answer.rankedIds ?? []).map(labelOf).join(" › ");
    case "multi_choice":
      return (answer.choiceIds ?? [])
        .map((id) => (id === slot.free_text_when_option_id && complement ? complement : labelOf(id)))
        .join(" · ");
    default:
      if (!answer.choiceId) return "";
      return answer.choiceId === slot.free_text_when_option_id && complement
        ? complement
        : labelOf(answer.choiceId);
  }
}

function isRowLayout(slot: B2SlotPresentation) {
  const options = slot.options ?? [];
  return options.length > 0 && options.every((o) => o.option_label.length <= ROW_LABEL_MAX);
}

function AutoTextarea({
  value,
  ariaLabel,
  disabled,
  maxLength,
  onChange,
  dataAttrs,
}: {
  value: string;
  ariaLabel: string;
  disabled: boolean;
  maxLength?: number;
  onChange: (value: string) => void;
  dataAttrs: Record<string, string | undefined>;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      aria-label={ariaLabel}
      className={styles.qValue}
      disabled={disabled}
      maxLength={maxLength}
      onChange={(event) => onChange(event.target.value)}
      ref={ref}
      rows={2}
      value={value}
      {...dataAttrs}
    />
  );
}

export type LocalCanvasB2PiezaBlockMark = {
  label: string;
  targetId?: string;
  current?: boolean;
};

const DEFAULT_BLOCK_MARKS: readonly LocalCanvasB2PiezaBlockMark[] = [
  { label: "Bloque 0", targetId: "b0-memoria-operativa" },
  { label: "Bloque 0.5", targetId: "official-b05" },
  { label: "Bloque 1", targetId: "official-b1" },
  { label: "Bloque 2", current: true },
];

export type LocalCanvasB2PiezaSectionProps = {
  viewModel: B2PresentationViewModel;
  answers: Record<string, B2SlotAnswer>;
  onChange: (fieldKey: string, patch: Partial<B2SlotAnswer>) => void;
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  note?: string | null;
  disabled?: boolean;
  /** La pieza help gate: “Abre + antes de responder” (only for slots with help_text). */
  helpGate?: boolean;
  showCodes?: boolean;
  blockMarks?: readonly LocalCanvasB2PiezaBlockMark[];
  sectionId?: string;
};

export function LocalCanvasB2PiezaSection({
  viewModel,
  answers,
  onChange,
  onContinue,
  continueLabel = "Guardar Bloque 2",
  continueDisabled = false,
  note = null,
  disabled = false,
  helpGate = true,
  showCodes = true,
  blockMarks = DEFAULT_BLOCK_MARKS,
  sectionId = "official-b2",
}: LocalCanvasB2PiezaSectionProps) {
  const tramos = placeSlots(viewModel.slots);
  const [tramoId, setTramoId] = useState<TramoId | null>(null);
  const [helpOpen, setHelpOpen] = useState<string | null>(null);
  const [helpSeen, setHelpSeen] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [flashField, setFlashField] = useState<string | null>(null);
  const stageRef = useRef<HTMLElement>(null);
  const flashTimer = useRef<number | null>(null);

  const tramoIndex = Math.max(
    0,
    tramos.findIndex((tramo) => tramo.id === tramoId),
  );
  const tramo = tramos[tramoIndex];
  const isLast = tramoIndex >= tramos.length - 1;

  const slotBySource = (code: string) => viewModel.slots.find((s) => s.source_code === code);
  const literalOf = (code: string) => {
    const slot = slotBySource(code);
    return slot ? answerLiteral(slot, answers[slot.field_key]) : "";
  };

  const resolvePrompt = (text: string) =>
    text.replace(/\{(OBJETO|SUJETO|ACCIÓN|ACCION)\}/g, (_match, key: string) => {
      const literal = literalOf(PLACEHOLDER_SOURCE[key] ?? "");
      return literal || key.toLowerCase();
    });

  const canAnswer = (slot: B2SlotPresentation) =>
    !disabled && (!helpGate || !slot.help_text || Boolean(helpSeen[slot.field_key]));

  const toggleHelp = (slot: B2SlotPresentation) => {
    setHelpOpen((prev) => (prev === slot.field_key ? null : slot.field_key));
    setHelpSeen((prev) => (prev[slot.field_key] ? prev : { ...prev, [slot.field_key]: true }));
  };

  const flashGate = (slot: B2SlotPresentation) => {
    if (canAnswer(slot) || disabled) return;
    setFlashField(slot.field_key);
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlashField(null), 900);
  };

  const fitStage = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.style.height = "";
    stage.style.removeProperty("--cota-y");
    if (window.innerWidth <= 900) return;
    const base = stage.offsetHeight;
    stage.style.setProperty("--cota-y", `${Math.round(base * 0.4)}px`);
    const top = stage.getBoundingClientRect().top;
    let needed = base;
    stage.querySelectorAll<HTMLElement>("[data-pieza-isle]").forEach((isle) => {
      if (isle.offsetParent) needed = Math.max(needed, isle.getBoundingClientRect().bottom - top + 48);
    });
    stage.style.height = `${Math.ceil(needed)}px`;
  }, []);

  useLayoutEffect(() => {
    fitStage();
  });

  useLayoutEffect(() => {
    window.addEventListener("resize", fitStage);
    return () => {
      window.removeEventListener("resize", fitStage);
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
    };
  }, [fitStage]);

  if (!tramo) return null;

  const tramoReady = tramo.slots.every(
    (slot) =>
      !(slot.required || slot.control_family === "clarification") ||
      isAnswered(slot, answers[slot.field_key]),
  );
  const pendingClarification = tramo.slots.some(
    (slot) => slot.control_family === "clarification" && !isAnswered(slot, answers[slot.field_key]),
  );

  const goTo = (index: number) => {
    const next = tramos[index];
    if (!next) return;
    setTramoId(next.id);
    setHelpOpen(null);
    scrollToLocalCanvasSection(sectionId);
  };

  const advance = () => {
    if (!tramoReady) return;
    if (isLast) {
      onContinue?.();
      return;
    }
    goTo(tramoIndex + 1);
  };

  const isStory = tramo.id === "antes" || tramo.id === "haces" || tramo.id === "queda";
  const story = {
    antes: literalOf(STORY_SOURCE.antes),
    haces: literalOf(STORY_SOURCE.haces),
    queda: literalOf(STORY_SOURCE.queda),
  };
  const referents = REFERENT_SOURCES.map((code) => literalOf(code)).filter(Boolean);
  const casoText = referents.length > 0 ? referents.join(" · ") : literalOf("2.1");
  const showCaso = Boolean(casoText) && tramo.id !== "foco" && tramo.id !== "magnitud";

  const scaleSlot =
    tramo.id === "magnitud"
      ? tramo.slots.find(
          (slot) =>
            slot.source_code === SCALE_SOURCE &&
            slot.control_family === "single_choice" &&
            (slot.options?.length ?? 0) > 0,
        )
      : undefined;

  const helpSlot = helpOpen ? viewModel.slots.find((s) => s.field_key === helpOpen) : undefined;
  const kicker = tramo.slots[0]?.short_ui_label ?? "";

  const advanceDisabled =
    disabled || !tramoReady || (isLast && (continueDisabled || !onContinue));
  const closureHint = note ?? (pendingClarification ? "Nos falta una precisión antes de seguir" : "");

  const dataFor = (slot: B2SlotPresentation) => ({
    "data-field-key": slot.field_key,
    "data-slot-ref": slot.slot_ref,
    "data-source-code": slot.source_code,
    "data-control-family": slot.control_family,
  });

  const renderOptions = (slot: B2SlotPresentation) => {
    const answer = answers[slot.field_key];
    const allowed = canAnswer(slot);
    const options = slot.options ?? [];
    const multi = slot.control_family === "multi_choice";
    const ranking = slot.control_family === "ranking";
    const selected = multi
      ? new Set(answer?.choiceIds ?? [])
      : new Set(answer?.choiceId ? [answer.choiceId] : []);
    const ranked = answer?.rankedIds ?? [];
    const committed =
      !multi && !ranking && Boolean(answer?.choiceId) && !expanded[slot.field_key];

    return (
      <>
        <div
          aria-label={slot.short_ui_label}
          className={cx(
            styles.optList,
            isRowLayout(slot) && styles.isRow,
            committed && styles.isCommitted,
            !allowed && styles.isLocked,
          )}
          role={multi || ranking ? "group" : "radiogroup"}
          {...dataFor(slot)}
        >
          {options.map((option) => {
            const rankPos = ranking ? ranked.indexOf(option.option_id) : -1;
            const active = ranking ? rankPos >= 0 : selected.has(option.option_id);
            return (
              <button
                aria-checked={!multi && !ranking ? active : undefined}
                aria-pressed={multi || ranking ? active : undefined}
                className={cx(styles.opt, active && styles.isActive)}
                data-option-id={option.option_id}
                disabled={!allowed}
                key={option.option_id}
                onClick={() => {
                  if (ranking) {
                    const next =
                      rankPos >= 0
                        ? ranked.slice(0, rankPos)
                        : [...ranked, option.option_id];
                    onChange(slot.field_key, { rankedIds: next });
                    return;
                  }
                  if (multi) {
                    const next = new Set(selected);
                    if (active) next.delete(option.option_id);
                    else next.add(option.option_id);
                    const choiceIds = Array.from(next);
                    onChange(slot.field_key, {
                      choiceIds,
                      complementaryText: choiceIds.includes(slot.free_text_when_option_id ?? "")
                        ? answer?.complementaryText
                        : undefined,
                    });
                    return;
                  }
                  setExpanded((prev) => ({ ...prev, [slot.field_key]: false }));
                  onChange(slot.field_key, {
                    choiceId: option.option_id,
                    complementaryText:
                      option.option_id === slot.free_text_when_option_id
                        ? answer?.complementaryText
                        : undefined,
                  });
                }}
                role={!multi && !ranking ? "radio" : undefined}
                type="button"
              >
                {ranking && rankPos >= 0 ? (
                  <span className={styles.rankNo}>{rankPos + 1}</span>
                ) : null}
                {option.option_label}
              </button>
            );
          })}
        </div>
        {committed ? (
          <button
            aria-label="Ver todas las opciones"
            className={styles.choiceBack}
            onClick={() => setExpanded((prev) => ({ ...prev, [slot.field_key]: true }))}
            type="button"
          >
            ←
          </button>
        ) : null}
        {needsComplement(slot, answer) ? (
          <div
            className={cx(
              styles.answerField,
              styles.isFollowup,
              !answer?.complementaryText && styles.isEmpty,
              !allowed && styles.isLocked,
            )}
          >
            <AutoTextarea
              ariaLabel={`${slot.short_ui_label} · especifica`}
              dataAttrs={{
                "data-field-key": slot.field_key,
                "data-slot-ref": slot.slot_ref,
                "data-control-family": "choice_plus_text_complement",
                "data-complementary-for": slot.free_text_when_option_id ?? undefined,
              }}
              disabled={!allowed}
              onChange={(value) => onChange(slot.field_key, { complementaryText: value })}
              value={answer?.complementaryText ?? ""}
            />
          </div>
        ) : null}
      </>
    );
  };

  const renderText = (slot: B2SlotPresentation) => {
    const answer = answers[slot.field_key];
    const allowed = canAnswer(slot);
    const value = answer?.text ?? "";
    const max = slot.max_chars ?? undefined;
    return (
      <>
        <div
          className={cx(styles.answerField, !value && styles.isEmpty, !allowed && styles.isLocked)}
        >
          <AutoTextarea
            ariaLabel={slot.short_ui_label}
            dataAttrs={dataFor(slot)}
            disabled={!allowed}
            maxLength={max}
            onChange={(next) => onChange(slot.field_key, { text: next })}
            value={value}
          />
        </div>
        {max && value.length > max * 0.8 ? (
          <p className={styles.charCount}>
            {value.length}/{max}
          </p>
        ) : null}
      </>
    );
  };

  const renderSlot = (slot: B2SlotPresentation) => {
    const allowed = canAnswer(slot);
    const isScale = scaleSlot?.field_key === slot.field_key;
    const isText = slot.control_family === "free_text" || slot.control_family === "clarification";
    return (
      <article
        className={styles.qBlock}
        data-capture-slot-kind={slot.capture_slot_kind}
        data-field-key={slot.field_key}
        data-matrix-hint={slot.matrix_interaction_hint ?? undefined}
        data-slot-ref={slot.slot_ref}
        data-source-code={slot.source_code}
        id={`b2-pieza-slot-${slot.field_key}`}
        key={slot.field_key}
        onClick={() => flashGate(slot)}
      >
        {showCodes ? (
          <p className={styles.qCode}>
            {slot.source_code} · {slot.short_ui_label}
          </p>
        ) : null}
        <div className={styles.qHead}>
          <p className={styles.qLabel}>{resolvePrompt(slot.question_text)}</p>
          {slot.help_text ? (
            <button
              aria-expanded={helpOpen === slot.field_key}
              aria-label="Abrir ayuda"
              className={cx(
                styles.helpPlus,
                helpOpen === slot.field_key && styles.isOpen,
                Boolean(helpSeen[slot.field_key]) && helpOpen !== slot.field_key && styles.isSeen,
              )}
              data-assistance="runtime_help_text"
              onClick={(event) => {
                event.stopPropagation();
                toggleHelp(slot);
              }}
              type="button"
            >
              +
            </button>
          ) : null}
        </div>
        {helpGate && slot.help_text ? (
          <p
            className={cx(
              styles.gateHint,
              !allowed && !disabled && styles.isVisible,
              flashField === slot.field_key && styles.isFlash,
            )}
          >
            Abre + antes de responder
          </p>
        ) : null}
        {isScale ? (
          story.antes || story.queda ? (
            <p className={styles.qWhisper}>
              Al empezar: “{story.antes || "—"}” · Al terminar: “{story.queda || "—"}”
            </p>
          ) : null
        ) : isText ? (
          renderText(slot)
        ) : (
          renderOptions(slot)
        )}
      </article>
    );
  };

  const renderScale = (slot: B2SlotPresentation) => {
    const options = slot.options ?? [];
    const value = answers[slot.field_key]?.choiceId;
    const xOf = (index: number) => ((index + 0.5) / options.length) * 100;
    const activeIndex = options.findIndex((o) => o.option_id === value);
    return (
      <div
        aria-label={slot.short_ui_label}
        className={cx(styles.scale, !canAnswer(slot) && styles.isLocked)}
        role="radiogroup"
        {...dataFor(slot)}
      >
        <span
          className={styles.scaleFill}
          style={{ width: activeIndex >= 0 ? `${xOf(activeIndex)}%` : 0 }}
        />
        {options.map((option, index) => {
          const on = option.option_id === value;
          return (
            <button
              aria-checked={on}
              className={cx(styles.scaleMark, on && styles.isActive)}
              data-option-id={option.option_id}
              disabled={!canAnswer(slot)}
              key={option.option_id}
              onClick={() => onChange(slot.field_key, { choiceId: option.option_id })}
              role="radio"
              style={{ left: `${xOf(index)}%` }}
              type="button"
            >
              <span className={styles.scaleTick} />
              <span className={styles.scaleLabel}>{option.option_label}</span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <section
      aria-label="Bloque 2 · Transformación"
      className={styles.screen}
      data-official-section="B2"
      data-presentation-kind={viewModel.presentation_kind}
      data-presentation-surface={viewModel.presentation_surface}
      data-presentation-variant="la_pieza"
      data-tramo={tramo.id}
      id={sectionId}
    >
      <nav aria-label="Navegación del levantamiento" className={styles.shellNav}>
        <button
          aria-label="Tramo anterior"
          className={styles.phaseArrow}
          disabled={tramoIndex === 0}
          onClick={() => goTo(tramoIndex - 1)}
          type="button"
        >
          ←
        </button>
        <div className={styles.blockMarks}>
          {blockMarks.map((mark) =>
            mark.current ? (
              <span aria-current="step" className={cx(styles.blockMark, styles.isCurrent)} key={mark.label}>
                {mark.label}
              </span>
            ) : (
              <button
                className={styles.blockMark}
                key={mark.label}
                onClick={() => mark.targetId && scrollToLocalCanvasSection(mark.targetId)}
                type="button"
              >
                {mark.label}
              </button>
            ),
          )}
        </div>
      </nav>

      <header className={styles.kickerBand}>
        <p className={styles.blockMeta}>
          {B2_BLOCK_META.canonical_name} · {B2_BLOCK_META.mother_question}
        </p>
        <p className={styles.kicker}>{kicker}</p>
        <div aria-live="polite" className={cx(styles.madreHelp, helpSlot && styles.isOpen)}>
          {helpSlot?.help_text ? <p>{helpSlot.help_text}</p> : null}
        </div>
      </header>

      <section
        aria-label="Plano del caso"
        className={cx(
          styles.stage,
          isStory && styles.isStory,
          tramo.id === "sombra" && styles.isShadow,
        )}
        ref={stageRef}
      >
        <div aria-hidden="true" className={styles.cota} />
        <span aria-hidden="true" className={cx(styles.partTick, story.haces && styles.isOn)} data-at="haces" />
        <span aria-hidden="true" className={cx(styles.partTick, story.queda && styles.isOn)} data-at="queda" />
        {(["antes", "haces", "queda"] as const).map((part) => (
          <p
            className={cx(styles.partLabel, tramo.id === part && styles.isCurrent)}
            data-part={part}
            key={part}
          >
            {part === "antes" ? "Antes" : part === "haces" ? "Lo que haces" : "Cómo queda"}
          </p>
        ))}
        <div aria-live="polite" className={styles.storyCols}>
          {(["antes", "haces", "queda"] as const).map((part) =>
            story[part] ? (
              <p className={styles.storyCol} data-part={part} key={part} title={story[part]}>
                <span className={styles.storyText}>{story[part]}</span>
              </p>
            ) : null,
          )}
        </div>

        {showCaso ? (
          <p className={styles.caso} title={casoText}>
            <span className={styles.casoMeta}>El caso</span>
            <span className={styles.casoText}>{casoText}</span>
          </p>
        ) : null}

        <div className={styles.band} data-band={tramo.id} key={tramo.id}>
          {tramo.isles.map((isle) => (
            <div className={isleClass(isle.pos)} data-pieza-isle="" key={isle.key}>
              {isle.slots.map((slot) => renderSlot(slot))}
            </div>
          ))}
          {scaleSlot ? renderScale(scaleSlot) : null}
        </div>
      </section>

      <footer className={styles.sheetFoot}>
        <div className={styles.rotulo}>
          <span className={styles.rotuloMeta}>Memoria operativa</span>
          <p className={styles.rotuloText}>{viewModel.activity.activityLiteral}</p>
        </div>
        <div className={styles.closure}>
          {closureHint ? <p className={styles.closureHint}>{closureHint}</p> : null}
          <button
            className={cx(styles.sceneToggle, !advanceDisabled && styles.isReady)}
            disabled={advanceDisabled}
            onClick={advance}
            type="button"
          >
            {isLast ? continueLabel : "Continuar"}
          </button>
        </div>
      </footer>
    </section>
  );
}
