"use client";

import {
  formatResponsibleProcessLabel,
  SELECT_CORE_MILESTONE_MESSAGE,
  UNAVAILABLE_FIELD_LABEL,
} from "../presentation/core-milestone-axis-presentation";
import {
  presentOperationalCompoundLabel,
  presentOperationalTimerPolicyLabel,
} from "../presentation/operational-object-label-presentation";
import styles from "../styles/official-control-panel.module.css";
import type { CoreMilestoneAxisViewModel } from "../types/core-milestone-axis.types";

type CoreMilestoneDetailProps = {
  axis: CoreMilestoneAxisViewModel;
};

/**
 * Tarjeta §8.2 — solo campos factuales / de catálogo. Sin impacto ni bloqueo inventados.
 * Selección efectiva = axis.selectedItem (validada). Nunca URL cruda sola.
 */
export function CoreMilestoneDetail({ axis }: CoreMilestoneDetailProps) {
  if (axis.status === "idle") {
    return (
      <div className={styles.workspaceEmptyState} role="status">
        <p className={styles.workspaceEmptyTitle}>Hitos core del caso</p>
        <p className={styles.workspaceEmptyMessage}>
          Seleccione un caso en curso para consultar el Eje Y.
        </p>
      </div>
    );
  }

  // Carga inicial sin items: solo loading. No detalle ni selección fantasma.
  if (axis.status === "loading") {
    return (
      <div
        className={styles.workspaceEmptyState}
        role="status"
        aria-live="polite"
        data-milestone-loading="initial"
      >
        <p className={styles.workspaceEmptyTitle}>Cargando hitos core…</p>
        <p className={styles.workspaceEmptyMessage}>
          Espere mientras se consulta el catálogo H0-H6.
        </p>
      </div>
    );
  }

  if (axis.status === "error") {
    return (
      <div className={styles.workspaceEmptyState} role="alert">
        <p className={styles.workspaceEmptyTitle}>Hitos no disponibles</p>
        <p className={styles.workspaceEmptyMessage}>
          {axis.errorMessage ??
            "No fue posible abrir los hitos core del caso."}
        </p>
      </div>
    );
  }

  if (!axis.selectedItem) {
    return (
      <div className={styles.workspaceEmptyState} role="status">
        <p className={styles.workspaceEmptyTitle}>Detalle del hito</p>
        <p className={styles.workspaceEmptyMessage}>
          {SELECT_CORE_MILESTONE_MESSAGE}
        </p>
        {axis.refreshing ? (
          <p
            className={styles.workspaceEmptyMessage}
            role="status"
            data-milestone-loading="refresh"
          >
            Actualizando hitos…
          </p>
        ) : null}
      </div>
    );
  }

  const item = axis.selectedItem;

  return (
    <div
      className={styles.milestoneDetail}
      role="region"
      aria-label={`Detalle del hito ${item.code}`}
      data-milestone-detail={item.code}
    >
      {axis.refreshing ? (
        <p
          className={styles.milestoneContextNote}
          role="status"
          data-milestone-loading="refresh"
        >
          Actualizando hitos…
        </p>
      ) : null}
      <h3 className={styles.supportProcessSummaryTitle}>
        {item.code} — {item.label}
      </h3>
      <dl className={styles.milestoneDetailList}>
        <div className={styles.milestoneDetailRow}>
          <dt>Hito</dt>
          <dd>
            {item.code} — {item.label}
          </dd>
        </div>
        <div className={styles.milestoneDetailRow}>
          <dt>Estado</dt>
          <dd>{item.uiStateLabel}</dd>
        </div>
        <div className={styles.milestoneDetailRow}>
          <dt>Condición esperada del caso</dt>
          <dd>{presentOperationalCompoundLabel(item.objectStateLabel)}</dd>
        </div>
        <div className={styles.milestoneDetailRow}>
          <dt>Evento esperado</dt>
          <dd>
            {item.expectedNextEventLabel
              ? presentOperationalCompoundLabel(item.expectedNextEventLabel)
              : UNAVAILABLE_FIELD_LABEL}
          </dd>
        </div>
        <div className={styles.milestoneDetailRow}>
          <dt>Límite de espera</dt>
          <dd>{presentOperationalTimerPolicyLabel(item.timerPolicyName)}</dd>
        </div>
        <div className={styles.milestoneDetailRow}>
          <dt>Proceso responsable</dt>
          <dd>{formatResponsibleProcessLabel(item)}</dd>
        </div>
        <div className={styles.milestoneDetailRow}>
          <dt>Modalidad</dt>
          <dd>{item.modalityLabel ?? UNAVAILABLE_FIELD_LABEL}</dd>
        </div>
      </dl>
    </div>
  );
}
