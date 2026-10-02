"use client";

import styles from "./canvas-block-shell.module.css";

export type LocalBlockShellChromeProps = {
  /** Visible block mark, e.g. "Bloque 0". */
  blockLabel?: string;
  /** Madre help_text routed to the shell void (not the section void). */
  helpText?: string | null;
  visible: boolean;
};

/**
 * Minimal per-block shell chrome.
 * Activates after Guardar on the auto-drafted memoria operativa.
 * User-facing surface: block mark + void slot for help texts.
 */
export function LocalBlockShellChrome({
  blockLabel = "Bloque 0",
  helpText = null,
  visible,
}: LocalBlockShellChromeProps) {
  if (!visible) return null;

  const help = helpText?.trim() || "";

  return (
    <aside
      aria-label="Shell del bloque"
      className={styles.shell}
      data-block-shell="true"
      data-shell-help={help ? "open" : "idle"}
    >
      <p className={styles.blockMark}>{blockLabel}</p>
      <div
        aria-hidden={!help}
        aria-live="polite"
        className={styles.helpVoid}
        data-shell-void="help"
      >
        {help ? (
          <>
            <p className={styles.helpLabel}>Ayuda</p>
            <p className={styles.helpBody}>{help}</p>
          </>
        ) : null}
      </div>
    </aside>
  );
}
