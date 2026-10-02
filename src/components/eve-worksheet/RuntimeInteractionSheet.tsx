"use client";

import { SheetMotion } from "./SheetMotion";
import { WorksheetShell } from "./WorksheetShell";
import type { RuntimePresentationViewModel } from "./presentation-contract";
import styles from "./worksheet.module.css";

/**
 * Presentational Runtime adapter / fallback.
 * Not a generic replacement for block-specific shells (B0.5–B7).
 * Answers keyed by opaque slot_ref only.
 */
export function RuntimeInteractionSheet({
  activityTitle,
  viewModel,
  answers,
  message,
  saving,
  disabled,
  preferSlotOptions = false,
  onChange,
  onSubmit,
}: {
  activityTitle?: string;
  viewModel: RuntimePresentationViewModel | null;
  answers: Record<string, string>;
  message?: string;
  saving?: boolean;
  disabled?: boolean;
  /** PR3-only: use exact per-slot authorized option domains. Defaults false to preserve legacy renderer behavior. */
  preferSlotOptions?: boolean;
  onChange: (slotRef: string, value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <WorksheetShell
      kicker="Levantamiento"
      title="Captura estructural por actividad"
      lead="Responde lo que el Runtime presenta. La siguiente pregunta la decide el sistema."
    >
      <SheetMotion variant="band">
        <div className={styles.runtimeBand}>
          <aside className={styles.runtimeSideMeta}>
            <div className={styles.worksheetKicker}>ACTIVIDAD</div>
            <p>{activityTitle ?? "Actividad en curso"}</p>
            {viewModel?.block ? (
              <p className={styles.runtimeMetaLine}>Bloque: {viewModel.block}</p>
            ) : null}
            {viewModel?.ui_component ? (
              <p className={styles.runtimeMetaLine}>UI: {viewModel.ui_component}</p>
            ) : null}
          </aside>
          <div className={styles.runtimeBandBody}>
            <h2 className={styles.runtimeQuestion}>
              {viewModel?.visible_text ?? "Preparando pregunta…"}
            </h2>
            {viewModel?.help_text ? (
              <p className={styles.runtimeHelp}>{viewModel.help_text}</p>
            ) : null}
            {viewModel?.presentation_mode === "fallback_textarea" ? (
              <p className={styles.runtimeFallbackNote}>
                Presentación: fallback textarea (sin metadata de choice autorizada en
                ViewModel).
              </p>
            ) : null}
            <div className={styles.runtimeSlots}>
              {(viewModel?.slots ?? []).map((slot) => {
                // Prefer the exact server-authorized choices for this slot. The
                // legacy aggregate choice_options is only safe for a single-slot
                // interaction; using it across multiple slots would invent/cross
                // option domains.
                const slotChoices = preferSlotOptions
                  ? (slot.options?.length
                      ? slot.options
                      : viewModel?.slots.length === 1
                        ? viewModel.choice_options
                        : undefined)
                  : viewModel?.choice_options;
                return (
                  <div className={styles.runtimeField} key={slot.slot_ref}>
                    <span>{slot.label ?? slot.name}</span>
                    {viewModel?.presentation_mode === "authorized_choice" &&
                    slotChoices?.length ? (
                      <select
                        aria-label={slot.label ?? slot.name}
                        data-slot-ref={slot.slot_ref}
                        id={`runtime-${slot.slot_ref}`}
                        onChange={(event) => onChange(slot.slot_ref, event.target.value)}
                        value={answers[slot.slot_ref] ?? ""}
                      >
                        <option value="">Selecciona…</option>
                        {slotChoices.map((option) => (
                          <option key={option.option_id} value={option.option_id}>
                            {option.option_label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <textarea
                        aria-label={slot.label ?? slot.name}
                        data-slot-ref={slot.slot_ref}
                        id={`runtime-${slot.slot_ref}`}
                        onChange={(event) => onChange(slot.slot_ref, event.target.value)}
                        rows={4}
                        value={answers[slot.slot_ref] ?? ""}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            {message ? <p className={styles.runtimeMessage}>{message}</p> : null}
            <div className={styles.runtimeActions}>
              <button
                className={styles.sheetAdvanceQuiet}
                disabled={disabled || saving || !viewModel}
                onClick={onSubmit}
                type="button"
              >
                {saving ? "Guardando…" : "Continuar ↓"}
              </button>
            </div>
          </div>
        </div>
      </SheetMotion>
    </WorksheetShell>
  );
}
