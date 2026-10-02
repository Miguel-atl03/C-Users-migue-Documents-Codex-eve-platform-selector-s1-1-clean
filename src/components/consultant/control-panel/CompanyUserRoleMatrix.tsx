"use client";

import type {
  ConsultantControlPanelState,
  ControlPanelFilterScope,
  RoleRuntimeSessionSummary,
  UserProgressRow,
} from "@/services/eve/consultant-control-panel/consultant-control-panel-types";
import styles from "./ccp.module.css";

type MatrixRow = {
  user: UserProgressRow;
  session: RoleRuntimeSessionSummary | null;
  alert: string | null;
};

export function CompanyUserRoleMatrix({
  state,
  onSelect,
}: {
  state: ConsultantControlPanelState;
  onSelect?: (next: Partial<ControlPanelFilterScope>) => void;
}) {
  const users = state.area_2_client_progress.users;
  const rows: MatrixRow[] = [];

  for (const user of users) {
    const sessions = user.role_runtime_sessions ?? [];
    if (sessions.length === 0) {
      rows.push({
        user,
        session: null,
        alert:
          user.functional_separation_state === "mixed_unresolved"
            ? "ROLE_ASSIGNMENT_GAP"
            : "ROLE_ASSIGNMENT_GAP · sin session",
      });
      continue;
    }
    for (const session of sessions) {
      rows.push({
        user,
        session,
        alert:
          user.functional_separation_state === "mixed_unresolved"
            ? "ROLE_ASSIGNMENT_GAP"
            : null,
      });
    }
  }

  return (
    <section className={styles.panel} data-testid="ccp-company-user-role-matrix">
      <div className={styles.panelHead}>
        <div>
          <h2 className={styles.panelTitle}>CompanyUserRoleMatrix</h2>
          <p className={styles.muted}>
            Usuario físico × rol funcional × cobertura. user_id ≠ role_runtime_session.
          </p>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className={styles.muted}>Sin usuarios en alcance. Seleccione empresa y caso.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.tableDense}>
            <thead>
              <tr>
                <th>Usuario físico</th>
                <th>Rol funcional</th>
                <th>Área</th>
                <th>Actividades</th>
                <th>Runs</th>
                <th>Estado</th>
                <th>Alertas</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const sessionId = row.session?.role_runtime_session_id ?? "none";
                return (
                  <tr key={`${row.user.user_id}-${sessionId}`}>
                    <td>
                      <button
                        type="button"
                        className={styles.linkButton}
                        onClick={() =>
                          onSelect?.({
                            user_id: row.user.user_id,
                            role_runtime_session_id: null,
                          })
                        }
                      >
                        {row.user.user_label}
                      </button>
                      <div className={styles.cellMeta}>{row.user.user_id}</div>
                    </td>
                    <td>
                      {row.session ? (
                        <button
                          type="button"
                          className={styles.linkButton}
                          onClick={() =>
                            onSelect?.({
                              user_id: row.user.user_id,
                              role_runtime_session_id: row.session!.role_runtime_session_id,
                              role_id: row.session!.role_id,
                            })
                          }
                        >
                          {row.session.role_label}
                        </button>
                      ) : (
                        "—"
                      )}
                      <div className={styles.cellMeta}>
                        {row.session?.role_runtime_session_id ?? "sin role_runtime_session"}
                      </div>
                    </td>
                    <td>{row.session?.role_label ?? row.user.role_label ?? "—"}</td>
                    <td>{row.session?.activity_count ?? row.user.activities_count}</td>
                    <td>{row.session?.run_count ?? 0}</td>
                    <td>
                      <span className={styles.pillNeutral}>
                        {row.session?.state ??
                          row.user.functional_separation_state ??
                          "pending"}
                      </span>
                    </td>
                    <td>
                      {row.alert ? (
                        <span
                          className={styles.pillWarn}
                          data-testid={
                            row.alert.includes("ROLE_ASSIGNMENT_GAP")
                              ? "ccp-role-assignment-gap"
                              : undefined
                          }
                        >
                          {row.alert}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
