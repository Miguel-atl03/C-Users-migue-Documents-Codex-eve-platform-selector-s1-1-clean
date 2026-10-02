"use client";

import type { ConsultantControlPanelState } from "@/services/eve/consultant-control-panel/consultant-control-panel-types";
import styles from "./ccp.module.css";

export function OperationalTraceTimeline({
  state,
  filterRunId,
  compact = false,
}: {
  state: ConsultantControlPanelState;
  /** When set, only events for this activity_runtime_run are shown. */
  filterRunId?: string | null;
  compact?: boolean;
}) {
  const events = filterRunId
    ? state.area_3_operational_trace.timeline.filter(
        (event) => event.run_id === filterRunId,
      )
    : state.area_3_operational_trace.timeline;
  const links = state.area_3_operational_trace.event_to_sup_links;

  return (
    <section
      className={styles.panel}
      data-testid="ccp-operational-trace"
      data-filter-run-id={filterRunId ?? ""}
      data-compact={compact ? "true" : "false"}
    >
      <div className={styles.panelHead}>
        <div>
          <h2 className={styles.panelTitle}>
            {compact ? "Trazabilidad del run" : "Trazabilidad operativa"}
          </h2>
          <p className={styles.muted}>
            {filterRunId
              ? `Timeline filtrado al run ${filterRunId}.`
              : "Timeline de eventos runtime · vínculo a objetos SUP / Producción Paralela. Sin reconstrucción causal inventada en cliente."}
          </p>
        </div>
      </div>
      {!compact ? (
        <div className={styles.metricStrip}>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Eventos</span>
            <strong className={styles.metricValue}>
              {state.area_3_operational_trace.runtime_events_count}
            </strong>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Evidencias</span>
            <strong className={styles.metricValue}>
              {state.area_3_operational_trace.evidence_items_count}
            </strong>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Gaps</span>
            <strong className={styles.metricValue}>
              {state.area_3_operational_trace.readiness_gaps_count}
            </strong>
          </div>
        </div>
      ) : null}
      {!compact && links.length > 0 ? (
        <div>
          <h3 className={styles.subTitle}>Conexión eventos → objetos SUP / PP</h3>
          <ul className={styles.flagList}>
            {links.map((link) => (
              <li key={`${link.causal_step}-${link.feeds_sup_object}`}>
                {link.causal_step} → {link.feeds_sup_object}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {events.length === 0 ? (
        <p className={styles.muted}>
          {filterRunId
            ? "Sin eventos para el run seleccionado."
            : "Sin eventos para los filtros actuales."}
        </p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.tableDense}>
            <thead>
              <tr>
                <th>Evento</th>
                <th>Origen</th>
                <th>Ejemplo / detalle</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, compact ? 12 : 40).map((event) => (
                <tr key={event.event_id}>
                  <td>
                    <strong>{event.event_type}</strong>
                    <div className={styles.cellMeta}>{event.event_id}</div>
                  </td>
                  <td>{event.causal_step || "runtime"}</td>
                  <td>
                    {event.summary}
                    <div className={styles.cellMeta}>
                      {event.run_id ? `run ${event.run_id}` : "—"}
                      {event.user_id ? ` · user ${event.user_id}` : ""}
                    </div>
                  </td>
                  <td>{event.occurred_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
