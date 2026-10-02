"use client";

/**
 * Posición cuadrantes — visual candidate (mock v4 authorized).
 * Productive intake_sheet: LocalEstadoAPositionCuadrantesSection.
 * Preview: /dev/ui-posicion · combined: /dev/ui-posicion-workmap
 */

import {
  commitPosicionCuadrantes,
  getPosicionTraceStatus,
  POSICION_CUADRANTES_OPTIONS,
  POSICION_DECISION_QUESTION,
  POSICION_ROLE_QUESTION,
  resolveRoleMarkLabel,
  touchPosicionCuadrantes,
  type PosicionCuadrantesState,
  type PosicionMarkLayout,
  type PosicionOption,
} from "./posicion-cuadrantes-copy";
import styles from "./canvas-posicion-cuadrantes.module.css";

export type LocalEstadoAPositionCuadrantesProposalProps = {
  greetingName?: string;
  state: PosicionCuadrantesState;
  onStateChange: (state: PosicionCuadrantesState) => void;
  onSave?: () => void;
  onSignOut?: () => void;
  /** @deprecated Session chrome lives on the monumental header; kept for API compat. */
  showSessionChrome?: boolean;
  saveNote?: string | null;
  saving?: boolean;
  /**
   * pending — visible, sin animar aún
   * enter — fade + rise quieto (primera vez)
   * continues — memoria: marcas ya grabadas, sin entrada
   */
  life?: "pending" | "enter" | "continues";
};

const LAYOUT_CLASS: Record<PosicionMarkLayout, string> = {
  nwM1: styles.nwM1,
  nwM2: styles.nwM2,
  nwM3: styles.nwM3,
  swM1: styles.swM1,
  swM2: styles.swM2,
  swM3: styles.swM3,
  swM4: styles.swM4,
  neM1: styles.neM1,
  neM2: styles.neM2,
  neM3: styles.neM3,
  seM1: styles.seM1,
  seM2: styles.seM2,
  seM3: styles.seM3,
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function LocalEstadoAPositionCuadrantesProposal({
  state,
  onStateChange,
  onSave,
  saveNote,
  saving = false,
  life = "enter",
}: LocalEstadoAPositionCuadrantesProposalProps) {
  const traceStatus = getPosicionTraceStatus(state);
  const canSave = traceStatus === "ready";
  const otherEditing = state.role === "other" && !state.otherEngraved;

  const roleOptions = POSICION_CUADRANTES_OPTIONS.filter((option) => option.group === "role");
  const decisionOptions = POSICION_CUADRANTES_OPTIONS.filter(
    (option) => option.group === "decision",
  );

  const selectRole = (id: string) => {
    if (id === "other" && state.role === "other" && state.otherEngraved) {
      // Reabrir traza: quitar grabado y volver a la línea (exige Guardar de nuevo).
      onStateChange(
        touchPosicionCuadrantes(state, {
          otherEngraved: false,
        }),
      );
      return;
    }

    onStateChange(
      touchPosicionCuadrantes(state, {
        role: id,
        roleOther: id === "other" ? state.roleOther : "",
        otherEngraved: false,
      }),
    );
  };

  const renderMark = (
    option: PosicionOption,
    selectedId: string,
    onSelect: (id: string) => void,
    groupLabel: string,
    label = option.label,
  ) => {
    const selected = selectedId === option.id;
    const dimmed = Boolean(selectedId) && !selected;

    return (
      <button
        aria-label={`${groupLabel}: ${label}`}
        aria-pressed={selected}
        className={cx(
          styles.mark,
          LAYOUT_CLASS[option.layout],
          selected && styles.markSelected,
          dimmed && styles.markDimmed,
          option.id === "other" && state.otherEngraved && selected && styles.markEngraved,
        )}
        key={option.id}
        onClick={() => onSelect(option.id)}
        type="button"
      >
        {label}
      </button>
    );
  };

  return (
    <section
      aria-labelledby="posicion-cuadrantes-title"
      className={cx(
        styles.screen,
        styles.screenAfterGate,
        life === "enter" && styles.enter,
        life === "continues" && styles.continues,
        otherEditing && styles.otherOpen,
      )}
      id="posicion-cuadrantes"
    >
      <h1 className={styles.srOnly} id="posicion-cuadrantes-title">
        Posición — comienza tu levantamiento
      </h1>

      <div className={styles.roomBlock}>
        <p className={styles.room}>[ Comienza tu levantamiento ]</p>
      </div>

      <aside aria-hidden="true" className={styles.signal}>
        <span className={styles.signalGlyph} />
        <p className={styles.signalCopy}>
          <span>Elige la opción que más</span>
          <span>se parece a tu</span>
          <span>día a día.</span>
        </p>
      </aside>

      <div className={styles.field}>
        <section className={cx(styles.column, styles.columnLeft)}>
          <div className={styles.columnHead}>
            <h2 className={styles.columnQ}>{POSICION_ROLE_QUESTION}</h2>
          </div>
          <div aria-label={POSICION_ROLE_QUESTION} role="radiogroup">
            {roleOptions.map((option) =>
              renderMark(
                option,
                state.role,
                selectRole,
                POSICION_ROLE_QUESTION,
                resolveRoleMarkLabel(option, state),
              ),
            )}
          </div>
          {otherEditing ? (
            <label className={styles.otherWrap}>
              <span className="sr-only">Especifica tu papel</span>
              <input
                autoFocus
                className={styles.otherInput}
                onChange={(event) =>
                  onStateChange(
                    touchPosicionCuadrantes(state, {
                      roleOther: event.target.value,
                      otherEngraved: false,
                    }),
                  )
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" && canSave) {
                    event.preventDefault();
                    onStateChange(commitPosicionCuadrantes(state));
                    onSave?.();
                  }
                }}
                placeholder="Especifica"
                type="text"
                value={state.roleOther}
              />
            </label>
          ) : null}
        </section>

        <section className={cx(styles.column, styles.columnRight)}>
          <h2 className={styles.columnQ}>{POSICION_DECISION_QUESTION}</h2>
          <div aria-label={POSICION_DECISION_QUESTION} role="radiogroup">
            {decisionOptions.map((option) =>
              renderMark(
                option,
                state.decision,
                (id) => {
                  onStateChange(touchPosicionCuadrantes(state, { decision: id }));
                },
                POSICION_DECISION_QUESTION,
              ),
            )}
          </div>
        </section>
      </div>

      <div className={styles.traceWrap}>
        <button
          aria-disabled={!canSave || saving}
          className={cx(
            styles.trace,
            canSave && styles.traceReady,
            traceStatus === "saved" && styles.traceSaved,
          )}
          disabled={saving}
          onClick={() => {
            if (!canSave || saving) return;
            onStateChange(commitPosicionCuadrantes(state));
            onSave?.();
          }}
          type="button"
        >
          {saving ? "Preparando…" : traceStatus === "saved" ? "Guardado" : "Guardar"}
        </button>
      </div>

      {saveNote ? <p className={styles.previewNote}>{saveNote}</p> : null}
    </section>
  );
}
