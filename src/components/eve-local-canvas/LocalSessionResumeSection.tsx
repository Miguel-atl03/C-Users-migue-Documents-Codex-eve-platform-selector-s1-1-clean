"use client";

import { EveLogo } from "@/components/EveLogo";
import styles from "./local-canvas.module.css";

type Props = {
  userName: string;
  progressPercent: number;
  lastStepLabel: string;
  lastUpdatedLabel: string;
  restoring: boolean;
  onContinue: () => void;
  onSignOut: () => void;
  variant?: "fallback" | "transient-loading";
};

/**
 * Session reentry surface inside LocalCanvasExperience.
 * Preserves continue/restore callbacks — does not restart Estado A.
 */
export function LocalSessionResumeSection({
  userName,
  progressPercent,
  lastStepLabel,
  lastUpdatedLabel,
  restoring,
  onContinue,
  onSignOut,
  variant = "fallback",
}: Props) {
  if (variant === "transient-loading") {
    return (
      <section className={styles.resumeScreen} aria-live="polite">
        <EveLogo className={styles.estadoALogo} size="sm" />
        <p className={styles.resumeMeta}>Hola, {userName}.</p>
        <h2 className={styles.resumeTitle}>Recuperando tu levantamiento…</h2>
        <p className={styles.resumeMeta}>
          Estamos retomando tu último punto de trabajo guardado.
        </p>
      </section>
    );
  }

  const progressValue = Math.min(100, Math.max(0, progressPercent));

  return (
    <section className={styles.resumeScreen} aria-labelledby="resume-title">
      <header className={styles.estadoATopbar}>
        <EveLogo className={styles.estadoALogo} size="sm" />
        <button className={styles.linkButton} onClick={onSignOut} type="button">
          Cerrar sesión
        </button>
      </header>
      <p className={styles.resumeMeta}>Hola, {userName}.</p>
      <h2 className={styles.resumeTitle} id="resume-title">
        Continúa tu levantamiento
      </h2>
      <div className={styles.resumeMeta}>
        <p>Tu avance está guardado ({progressValue}%).</p>
        <p>Último paso: {lastStepLabel}.</p>
        <p>Última actualización: {lastUpdatedLabel}.</p>
      </div>
      <div className={styles.resumeActions}>
        <button
          className={styles.sheetAdvance}
          disabled={restoring}
          onClick={onContinue}
          type="button"
        >
          {restoring ? "Recuperando tu levantamiento…" : "Continuar levantamiento ↓"}
        </button>
      </div>
    </section>
  );
}
