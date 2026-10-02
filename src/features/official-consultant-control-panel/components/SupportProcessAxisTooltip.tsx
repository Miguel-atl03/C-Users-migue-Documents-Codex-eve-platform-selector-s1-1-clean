"use client";

import type { SupportProcessAxisItem } from "@/services/eve/official-control-panel/official-control-panel-support-process.types";
import {
  formatModalityTooltip,
  formatTargetObjectState,
  UNAVAILABLE_FIELD_LABEL,
} from "../presentation/support-process-axis-presentation";
import { presentOperationalCompoundLabel } from "../presentation/operational-object-label-presentation";
import styles from "../styles/official-control-panel.module.css";

type SupportProcessAxisTooltipProps = {
  item: SupportProcessAxisItem;
  id: string;
};

export function SupportProcessAxisTooltip({
  item,
  id,
}: SupportProcessAxisTooltipProps) {
  const operational =
    item.operationalStatusLabel ?? UNAVAILABLE_FIELD_LABEL;
  const attention =
    item.attentionCount == null
      ? UNAVAILABLE_FIELD_LABEL
      : String(item.attentionCount);

  return (
    <div className={styles.supportProcessTooltip} id={id} role="tooltip">
      <p className={styles.supportProcessTooltipRow}>
        <span className={styles.supportProcessTooltipKey}>Modalidad</span>
        <span>{formatModalityTooltip(item)}</span>
      </p>
      <p className={styles.supportProcessTooltipRow}>
        <span className={styles.supportProcessTooltipKey}>Disparador</span>
        <span>{item.triggerLabel ?? UNAVAILABLE_FIELD_LABEL}</span>
      </p>
      <p className={styles.supportProcessTooltipRow}>
        <span className={styles.supportProcessTooltipKey}>
          Resultado esperado
        </span>
        <span>
          {formatTargetObjectState(
            item.targetObjectLabel,
            item.targetStateLabel,
          )}
        </span>
      </p>
      <p className={styles.supportProcessTooltipRow}>
        <span className={styles.supportProcessTooltipKey}>Siguiente evento</span>
        <span>{item.nextEventLabel
          ? presentOperationalCompoundLabel(item.nextEventLabel)
          : UNAVAILABLE_FIELD_LABEL}</span>
      </p>
      <p className={styles.supportProcessTooltipRow}>
        <span className={styles.supportProcessTooltipKey}>Dependencia</span>
        <span>{item.dependencyLabel ?? UNAVAILABLE_FIELD_LABEL}</span>
      </p>
      <p className={styles.supportProcessTooltipRow}>
        <span className={styles.supportProcessTooltipKey}>Estado operativo</span>
        <span>{operational}</span>
      </p>
      <p className={styles.supportProcessTooltipRow}>
        <span className={styles.supportProcessTooltipKey}>Atención</span>
        <span>{attention}</span>
      </p>
    </div>
  );
}
