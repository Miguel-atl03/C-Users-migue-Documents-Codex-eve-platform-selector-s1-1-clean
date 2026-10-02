"use client";

import {
  UNAVAILABLE_LABEL,
  labelOrUnavailable,
} from "../presentation/process-structure-presentation";
import styles from "../styles/official-control-panel.module.css";
import type { ProcessStructureViewModel } from "../types/process-structure.types";

type CaseMilestoneDetailProps = {
  processStructure: ProcessStructureViewModel;
};

export function CaseMilestoneDetail({
  processStructure,
}: CaseMilestoneDetailProps) {
  if (processStructure.status === "loading") {
    return (
      <div className={styles.workspaceEmptyState} role="status" aria-live="polite">
        <p className={styles.workspaceEmptyTitle}>Cargando estructura…</p>
        <p className={styles.workspaceEmptyMessage}>
          Espere mientras se consulta el proceso y los hitos del caso.
        </p>
      </div>
    );
  }

  if (processStructure.status === "error") {
    return (
      <div className={styles.workspaceEmptyState} role="alert">
        <p className={styles.workspaceEmptyTitle}>Estructura no disponible</p>
        <p className={styles.workspaceEmptyMessage}>
          {processStructure.errorMessage ??
            "No fue posible abrir la estructura del caso."}
        </p>
      </div>
    );
  }

  if (processStructure.status === "empty" || !processStructure.mainProcess) {
    return (
      <div className={styles.workspaceEmptyState} role="status">
        <p className={styles.workspaceEmptyTitle}>
          Estructura de proceso no disponible.
        </p>
        <p className={styles.workspaceEmptyMessage}>
          Este caso no tiene un proceso principal registrado.
        </p>
      </div>
    );
  }

  if (processStructure.milestones.length === 0) {
    return (
      <div className={styles.workspaceEmptyState} role="status">
        <p className={styles.workspaceEmptyTitle}>
          Proceso principal disponible.
        </p>
        <p className={styles.workspaceEmptyMessage}>
          Todavía no hay hitos registrados para este caso.
        </p>
      </div>
    );
  }

  if (!processStructure.selectedMilestone) {
    return (
      <div className={styles.workspaceEmptyState} role="status">
        <p className={styles.workspaceEmptyTitle}>
          Seleccione un hito para consultar su estado.
        </p>
        <p className={styles.workspaceEmptyMessage}>
          {processStructure.currentMilestone
            ? `Hito actual: ${processStructure.currentMilestone.label}`
            : "Hito actual: No disponible"}
        </p>
      </div>
    );
  }

  const milestone = processStructure.selectedMilestone;
  const waitNote =
    milestone.waitCompleteness === "incomplete"
      ? "Espera incompleta. Falta evento esperado o límite temporal."
      : null;

  return (
    <div className={styles.milestoneDetail} role="region" aria-label="Detalle del hito">
      <dl className={styles.milestoneDetailList}>
        <div className={styles.milestoneDetailRow}>
          <dt>Hito</dt>
          <dd>{milestone.label}</dd>
        </div>
        <div className={styles.milestoneDetailRow}>
          <dt>Estado</dt>
          <dd>{labelOrUnavailable(milestone.statusLabel)}</dd>
        </div>
        <div className={styles.milestoneDetailRow}>
          <dt>Evento esperado</dt>
          <dd>
            {milestone.waitCompleteness === "incomplete" &&
            !milestone.expectedEventLabel
              ? UNAVAILABLE_LABEL
              : labelOrUnavailable(milestone.expectedEventLabel)}
          </dd>
        </div>
        <div className={styles.milestoneDetailRow}>
          <dt>Tiempo de espera</dt>
          <dd>
            {milestone.waitCompleteness === "incomplete" && !milestone.timerLabel
              ? UNAVAILABLE_LABEL
              : labelOrUnavailable(milestone.timerLabel)}
          </dd>
        </div>
        <div className={styles.milestoneDetailRow}>
          <dt>Proceso de soporte</dt>
          <dd>{labelOrUnavailable(milestone.supportProcessLabel)}</dd>
        </div>
      </dl>
      {waitNote ? (
        <p className={styles.milestoneIncompleteNote} role="status">
          {waitNote}
        </p>
      ) : null}
      {processStructure.inconsistencyFlags.length > 0 ? (
        <p className={styles.milestoneIncompleteNote} role="status">
          Estructura incompleta: el hito actual declarado no coincide con el
          estado del hito. No se corrige en pantalla.
        </p>
      ) : null}
    </div>
  );
}
