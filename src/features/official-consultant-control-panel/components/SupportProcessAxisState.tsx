"use client";

import type { SupportProcessAxisViewModel } from "../types/support-process-axis.types";
import { axisStatusMessage } from "../presentation/support-process-axis-presentation";
import styles from "../styles/official-control-panel.module.css";

type SupportProcessAxisStateProps = {
  axis: SupportProcessAxisViewModel;
  onRetry?: () => void;
};

export function SupportProcessAxisState({
  axis,
  onRetry,
}: SupportProcessAxisStateProps) {
  const message = axisStatusMessage(axis.status);
  if (!message && axis.status !== "error") return null;

  return (
    <div className={styles.supportProcessAxisState} role="status">
      <p className={styles.supportProcessSummaryMessage}>
        {axis.status === "error" ? axis.errorMessage : message}
      </p>
      {axis.status === "error" && onRetry ? (
        <button
          type="button"
          className={styles.supportProcessRetry}
          onClick={onRetry}
        >
          Reintentar
        </button>
      ) : null}
    </div>
  );
}
