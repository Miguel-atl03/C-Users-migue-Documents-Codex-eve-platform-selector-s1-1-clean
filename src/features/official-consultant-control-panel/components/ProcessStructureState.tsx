"use client";

import styles from "../styles/official-control-panel.module.css";
import type { ProcessStructureViewModel } from "../types/process-structure.types";

type ProcessStructureStateProps = {
  processStructure: ProcessStructureViewModel;
  onRetry?: () => void;
};

export function ProcessStructureState({
  processStructure,
  onRetry,
}: ProcessStructureStateProps) {
  if (processStructure.status === "loading") {
    return (
      <p
        className={styles.milestoneContextNote}
        aria-live="polite"
        role="status"
      >
        Cargando estructura de proceso…
      </p>
    );
  }

  if (processStructure.status === "error") {
    return (
      <div className={styles.contextStateError} role="alert">
        <span>
          {processStructure.errorMessage ??
            "No fue posible abrir la estructura del caso."}
        </span>
        {onRetry ? (
          <button
            className={styles.contextRetryButton}
            type="button"
            onClick={onRetry}
          >
            Reintentar
          </button>
        ) : null}
      </div>
    );
  }

  if (
    processStructure.status === "partial" &&
    processStructure.inconsistencyFlags.length > 0
  ) {
    return (
      <p className={styles.milestoneIncompleteNote} role="status">
        Estructura incompleta: hay una inconsistencia entre el hito actual y su
        estado. No se corrige en pantalla.
      </p>
    );
  }

  return null;
}
