"use client";

import type { ConsultantControlPanelState } from "@/services/eve/consultant-control-panel/consultant-control-panel-types";
import styles from "./ccp.module.css";

export function AuditTrailPanel({ state }: { state: ConsultantControlPanelState }) {
  const interventions = state.area_1_functional_help.intervention_history;
  const timeline = state.area_3_operational_trace.timeline.filter(
    (event) =>
      event.event_type.toLowerCase().includes("audit") ||
      event.causal_step === "audit" ||
      event.event_type.toLowerCase().includes("recompute") ||
      event.event_type.toLowerCase().includes("operator"),
  );
  const roleGap = state.critical_alerts.find((alert) => alert.alert_id === "ROLE_ASSIGNMENT_GAP");

  const rows = [
    ...interventions.map((item) => ({
      id: item.intervention_id,
      date: item.timestamp,
      actor: "consultant",
      action: item.action,
      object: `${item.previous_state ?? "—"} → ${item.new_state ?? "—"}`,
      result: item.justification || "ok",
    })),
    ...timeline.slice(0, 20).map((event) => ({
      id: event.event_id,
      date: event.occurred_at,
      actor: "system",
      action: event.event_type,
      object: event.run_id ?? event.causal_step ?? "—",
      result: event.summary || "ok",
    })),
  ];

  return (
    <section className={styles.panel} data-testid="ccp-audit-trail">
      <div className={styles.panelHead}>
        <div>
          <h2 className={styles.panelTitle}>Audit Trail</h2>
          <p className={styles.muted}>
            Bitácora append-only. Sin delete ni rewrite. Acciones futuras requieren actor, reason e
            idempotency.
          </p>
        </div>
      </div>
      {roleGap ? (
        <p className={styles.alertWarn}>ROLE_ASSIGNMENT_GAP visible para trazabilidad funcional</p>
      ) : null}
      {rows.length === 0 ? (
        <p className={styles.muted}>Sin eventos auditables en el alcance.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.tableDense}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Actor</th>
                <th>Acción</th>
                <th>Objeto</th>
                <th>Resultado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.date}</td>
                  <td>{row.actor}</td>
                  <td>{row.action}</td>
                  <td>{row.object}</td>
                  <td>{row.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
