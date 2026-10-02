"use client";

import type {
  MonitoringActivityRow,
  MonitoringActivitiesLinkStatus,
} from "@/services/eve/official-control-panel/official-control-panel-monitoring.types";
import styles from "../styles/official-control-panel.module.css";

type SessionOption = {
  id: string;
  label: string;
  stateLabel: string | null;
};

type MonitoringActivitiesPanelProps = {
  profileLabel: string;
  activities: MonitoringActivityRow[];
  loading: boolean;
  error: boolean;
  message: string | null;
  linkStatus: MonitoringActivitiesLinkStatus | null;
  sessions?: SessionOption[];
  selectedSessionId?: string | null;
  onSelectSession?: (sessionId: string | null) => void;
};

export function MonitoringActivitiesPanel({
  profileLabel,
  activities,
  loading,
  error,
  message,
  linkStatus,
  sessions = [],
  selectedSessionId = null,
  onSelectSession,
}: MonitoringActivitiesPanelProps) {
  return (
    <section
      className={styles.monitoringActivitiesPanel}
      aria-labelledby="monitoring-activities-heading"
      data-testid="recursive-monitoring-activities"
    >
      <h4
        className={styles.monitoringActivitiesTitle}
        id="monitoring-activities-heading"
      >
        Actividades — {profileLabel}
      </h4>

      {linkStatus === "multiple_runtime_sessions" && sessions.length > 0 ? (
        <div className={styles.monitoringSessionSelectWrap}>
          <label
            className={styles.monitoringSessionLabel}
            htmlFor="functional-session-select"
          >
            Sesión funcional
          </label>
          <select
            id="functional-session-select"
            className={styles.monitoringSessionSelect}
            value={selectedSessionId ?? ""}
            onChange={(event) =>
              onSelectSession?.(event.target.value || null)
            }
          >
            <option value="">Seleccionar sesión</option>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.label}
                {session.stateLabel ? ` · ${session.stateLabel}` : ""}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {loading ? (
        <p className={styles.workspaceEmptyMessage} role="status">
          Cargando actividades…
        </p>
      ) : null}

      {error ? (
        <p className={styles.workspaceEmptyMessage} role="alert">
          No fue posible cargar las actividades de este rol.
        </p>
      ) : null}

      {!loading && !error && activities.length === 0 ? (
        <p
          className={styles.workspaceEmptyMessage}
          role="status"
          data-link-status={linkStatus ?? "empty"}
        >
          {message ??
            (linkStatus === "pending_review"
              ? "La vinculación de esta sesión requiere revisión."
              : linkStatus === "multiple_runtime_sessions"
                ? "Seleccione una sesión funcional para consultar actividades."
                : "No hay una sesión funcional vinculada a este rol.")}
        </p>
      ) : null}

      {!loading && !error && activities.length > 0 ? (
        <div className={styles.monitoringUsersScroll}>
          <table className={styles.monitoringUsersTable}>
            <thead>
              <tr>
                <th scope="col">Actividad</th>
                <th scope="col">Sesión funcional</th>
                <th scope="col">Estado del run</th>
                <th scope="col">Razón de selección</th>
                <th scope="col">Base</th>
                <th scope="col">Causales</th>
                <th scope="col">Bloque actual</th>
                <th scope="col">Readiness</th>
                <th scope="col">Ruta crítica</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <tr key={activity.runId}>
                  <td>{activity.label}</td>
                  <td>{activity.roleRuntimeSessionId}</td>
                  <td>{activity.runStateLabel}</td>
                  <td>{activity.selectionReasonLabel}</td>
                  <td>{activity.baseLabel}</td>
                  <td>{activity.causalLabel}</td>
                  <td>{activity.currentBlockLabel}</td>
                  <td>{activity.readinessLabel}</td>
                  <td>{activity.criticalRouteLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
