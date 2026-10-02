"use client";

import type { CriticalAlert } from "@/services/eve/consultant-control-panel/consultant-control-panel-types";
import styles from "./ccp.module.css";

export function CriticalAlertsStrip({ alerts }: { alerts: CriticalAlert[] }) {
  return (
    <section className={styles.panel} data-testid="ccp-critical-alerts">
      <div className={styles.panelHead}>
        <div>
          <h2 className={styles.panelTitle}>CriticalAlertsPanel</h2>
          <p className={styles.muted}>
            Alertas del caso, incluyendo ROLE_ASSIGNMENT_GAP cuando aplica.
          </p>
        </div>
        <span className={styles.pillNeutral}>{alerts.length} visibles</span>
      </div>
      {alerts.length === 0 ? (
        <p className={styles.muted}>Sin alertas críticas en el alcance actual.</p>
      ) : (
        <ul className={styles.alertGrid}>
          {alerts.map((alert) => (
            <li
              key={`${alert.alert_id}-${alert.title}-${alert.message}`}
              className={
                alert.severity === "error"
                  ? styles.alertError
                  : alert.severity === "review"
                    ? styles.alertReview
                    : styles.alertWarn
              }
            >
              <div className={styles.alertTop}>
                <strong>{alert.alert_id}</strong>
                <span>{alert.title}</span>
              </div>
              <p>{alert.message}</p>
              {alert.reentry_target ? (
                <p className={styles.muted}>Reentry: {alert.reentry_target}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
