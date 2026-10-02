"use client";

import type { SupportProcessAxisCode } from "@/services/eve/official-control-panel/catalogs/support-process-axis.catalog";
import type { CoreMilestoneCode } from "@/services/eve/official-control-panel/catalogs/core-milestone-axis.catalog";
import {
  formatXyRelationLabel,
  getXyRelationCode,
  presentXyIntersectionMessage,
} from "@/services/eve/official-control-panel/catalogs/xy-interaction-matrix.catalog";
import styles from "../styles/official-control-panel.module.css";

type XyIntersectionPanelProps = {
  processCode: SupportProcessAxisCode | null;
  milestoneCode: CoreMilestoneCode | null;
};

/**
 * Rector §9.1 — celda seleccionada. Arquitectura definida, no ejecución.
 */
export function XyIntersectionPanel({
  processCode,
  milestoneCode,
}: XyIntersectionPanelProps) {
  if (!processCode || !milestoneCode) return null;

  const relation = getXyRelationCode(processCode, milestoneCode);
  if (!relation) return null;

  return (
    <section
      className={styles.xyIntersectionPanel}
      role="region"
      aria-labelledby="xy-intersection-heading"
    >
      <h3
        className={styles.supportProcessSummaryTitle}
        id="xy-intersection-heading"
      >
        Intersección X/Y seleccionada
      </h3>
      <dl className={styles.milestoneDetailList}>
        <div className={styles.milestoneDetailRow}>
          <dt>Proceso seleccionado</dt>
          <dd>{processCode}</dd>
        </div>
        <div className={styles.milestoneDetailRow}>
          <dt>Hito seleccionado</dt>
          <dd>{milestoneCode}</dd>
        </div>
        <div className={styles.milestoneDetailRow}>
          <dt>Código de relación</dt>
          <dd>
            <span className={styles.xyRelationBadge} data-relation={relation}>
              {relation}
            </span>
          </dd>
        </div>
        <div className={styles.milestoneDetailRow}>
          <dt>Significado</dt>
          <dd>{formatXyRelationLabel(relation)}</dd>
        </div>
        <div className={styles.milestoneDetailRow}>
          <dt>Tipo</dt>
          <dd>Relación arquitectónica definida</dd>
        </div>
      </dl>
      <p className={styles.xyIntersectionMessage} role="status">
        {presentXyIntersectionMessage(relation)}
      </p>
    </section>
  );
}
