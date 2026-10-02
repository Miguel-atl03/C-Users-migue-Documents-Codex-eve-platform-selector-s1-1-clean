"use client";

import { useState } from "react";
import type { SupportProcessAxisViewModel } from "../types/support-process-axis.types";
import {
  formatModalityTooltip,
  formatTargetObjectState,
  UNAVAILABLE_FIELD_LABEL,
} from "../presentation/support-process-axis-presentation";
import {
  presentOperationalCompoundLabel,
  presentOperationalVisibleProse,
} from "../presentation/operational-object-label-presentation";
import styles from "../styles/official-control-panel.module.css";

type SupportProcessWorkspaceSummaryProps = {
  axis: SupportProcessAxisViewModel;
  collapsed?: boolean;
};

export function SupportProcessWorkspaceSummary({
  axis,
  collapsed = false,
}: SupportProcessWorkspaceSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(!collapsed);

  if (axis.status === "idle") {
    return (
      <section
        className={styles.supportProcessSummary}
        id="support-process-workspace-summary"
        role="region"
        aria-labelledby="support-process-axis-heading"
      >
        <p className={styles.supportProcessSummaryMessage} role="status">
          Seleccione un caso en curso para consultar los procesos de soporte.
        </p>
      </section>
    );
  }

  if (axis.status === "loading") {
    return (
      <section
        className={styles.supportProcessSummary}
        id="support-process-workspace-summary"
        role="region"
        aria-labelledby="support-process-axis-heading"
      >
        <p className={styles.supportProcessSummaryMessage} role="status">
          Cargando procesos de soporte…
        </p>
      </section>
    );
  }

  if (axis.status === "error") {
    return (
      <section
        className={styles.supportProcessSummary}
        id="support-process-workspace-summary"
        role="region"
        aria-labelledby="support-process-axis-heading"
      >
        <p className={styles.supportProcessSummaryMessage} role="status">
          {axis.errorMessage}
        </p>
      </section>
    );
  }

  const effectiveItem = axis.selectedItem ?? axis.items[0] ?? null;

  if (!effectiveItem) {
    return (
      <section
        className={[
          styles.supportProcessSummary,
          styles.supportProcessSummaryCollapsed,
        ].join(" ")}
        id="support-process-workspace-summary"
        role="region"
        aria-labelledby="support-process-summary-heading"
        data-collapsed="true"
      >
        <h3
          className={styles.supportProcessSummaryTitle}
          id="support-process-summary-heading"
        >
          Detalle del proceso seleccionado
        </h3>
      </section>
    );
  }


  const item = effectiveItem;
  const hasOperational =
    item.operationalStatusLabel != null || item.dataStatus === "available";
  const isCollapsible = collapsed;
  const showContent = !isCollapsible || isExpanded;

  return (
    <section
      className={[
        styles.supportProcessSummary,
        isCollapsible ? styles.supportProcessSummaryCollapsed : "",
      ]
        .filter(Boolean)
        .join(" ")}
      id="support-process-workspace-summary"
      role="region"
      aria-labelledby={`support-process-tab-${encodeURIComponent(item.code)}`}
      data-collapsed={isCollapsible && !isExpanded ? "true" : undefined}
    >
      {isCollapsible ? (
        <button
          className={styles.supportProcessSummaryToggle}
          type="button"
          aria-expanded={isExpanded}
          aria-controls="support-process-summary-content"
          onClick={() => setIsExpanded((current) => !current)}
        >
          <span className={styles.supportProcessSummaryTitle}>
            Detalle del proceso seleccionado
          </span>
          <span aria-hidden="true">{isExpanded ? "-" : "+"}</span>
        </button>
      ) : (
        <h3 className={styles.supportProcessSummaryTitle}>
          Detalle del proceso seleccionado
        </h3>
      )}
      {showContent ? (
        <div
          className={styles.supportProcessSummaryContent}
          id="support-process-summary-content"
        >
          {!hasOperational ? (
            <p className={styles.supportProcessSummaryMessage} role="status">
              No hay estado operativo registrado para este proceso en el caso
              seleccionado.
            </p>
          ) : null}
          <dl className={styles.supportProcessSummaryList}>
        <div className={styles.supportProcessSummaryRow}>
          <dt>Proceso seleccionado</dt>
          <dd>
            {item.code} · {presentOperationalVisibleProse(item.label)}
          </dd>
        </div>
        <div className={styles.supportProcessSummaryRow}>
          <dt>Modalidad</dt>
          <dd>{formatModalityTooltip(item)}</dd>
        </div>
        <div className={styles.supportProcessSummaryRow}>
          <dt>Estado operativo</dt>
          <dd>{item.operationalStatusLabel ?? UNAVAILABLE_FIELD_LABEL}</dd>
        </div>
        <div className={styles.supportProcessSummaryRow}>
          <dt>Próximo evento</dt>
          <dd>
            {item.nextEventLabel
              ? presentOperationalCompoundLabel(item.nextEventLabel)
              : UNAVAILABLE_FIELD_LABEL}
          </dd>
        </div>
        <div className={styles.supportProcessSummaryRow}>
          <dt>Tiempo de espera</dt>
          <dd>{UNAVAILABLE_FIELD_LABEL}</dd>
        </div>
        <div className={styles.supportProcessSummaryRow}>
          <dt>Atención</dt>
          <dd>
            {item.attentionCount == null
              ? UNAVAILABLE_FIELD_LABEL
              : String(item.attentionCount)}
          </dd>
        </div>
        <div className={styles.supportProcessSummaryRow}>
          <dt>Resultado esperado</dt>
          <dd>
            {formatTargetObjectState(
              item.targetObjectLabel,
              item.targetStateLabel,
            )}
          </dd>
        </div>
        <div className={styles.supportProcessSummaryRow}>
          <dt>Disparador</dt>
          <dd>{item.triggerLabel ?? UNAVAILABLE_FIELD_LABEL}</dd>
        </div>
        <div className={styles.supportProcessSummaryRow}>
          <dt>Dependencia</dt>
          <dd>{item.dependencyLabel ?? UNAVAILABLE_FIELD_LABEL}</dd>
        </div>
          </dl>
        </div>
      ) : null}
    </section>
  );
}
