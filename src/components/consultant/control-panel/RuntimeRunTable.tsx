"use client";

import type {
  ConsultantControlPanelState,
  ControlPanelFilterScope,
} from "@/services/eve/consultant-control-panel/consultant-control-panel-types";
import styles from "./ccp.module.css";

function readinessTone(state: string): string {
  const value = state.toLowerCase();
  if (value.includes("blocked")) return styles.pillError;
  if (value.includes("reentry")) return styles.pillReentry;
  if (value.includes("flag")) return styles.pillWarn;
  if (value.includes("ready") || value.includes("complete")) return styles.pillSuccess;
  return styles.pillNeutral;
}

export function RuntimeRunTable({
  state,
  onSelectRun,
}: {
  state: ConsultantControlPanelState;
  onSelectRun?: (next: Partial<ControlPanelFilterScope>) => void;
}) {
  // Prefer BFF runs list; fall back to budget ledger for table browsing.
  const runs =
    state.runs.length > 0
      ? state.runs
      : state.area_3_operational_trace.runtimeBudget4020.runtimeBudgetByRun;
  const selected =
    state.meta.effective_scope.run_id ??
    state.selected_context.runId ??
    state.filters.run_id;
  const caseReadiness = state.area_3_operational_trace.readiness?.state ?? "—";

  return (
    <section className={styles.panel} data-testid="ccp-runtime-run-table">
      <div className={styles.panelHead}>
        <div>
          <h2 className={styles.panelTitle}>RuntimeRunTable</h2>
          <p className={styles.muted}>
            Runs por actividad primaria · presupuesto 40/20 por activity_runtime_run (no
            presupuesto agregado de empresa/caso). Al seleccionar un run se actualiza el
            contexto efectivo del BFF.
          </p>
        </div>
      </div>
      {runs.length === 0 ? (
        <p className={styles.muted}>Sin runs en alcance.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.tableDense}>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Actividad primaria</th>
                <th>Run ID</th>
                <th>Estado run</th>
                <th>Base 40</th>
                <th>Causales 20</th>
                <th>Readiness</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr
                  key={run.activityRuntimeRunId}
                  className={
                    selected === run.activityRuntimeRunId ? styles.rowSelected : undefined
                  }
                >
                  <td>
                    <div>{run.userLabel || run.userId}</div>
                    <div className={styles.cellMeta}>user_id · {run.userId}</div>
                  </td>
                  <td>
                    <div>{run.role}</div>
                    <div className={styles.cellMeta}>
                      role_runtime_session · {run.roleRuntimeSessionId}
                    </div>
                  </td>
                  <td>
                    {run.activityCode} · {run.activityName}
                  </td>
                  <td>
                    <code>{run.activityRuntimeRunId}</code>
                  </td>
                  <td>
                    <span className={readinessTone(run.runState)}>{run.runState}</span>
                  </td>
                  <td>
                    {run.baseUsed}/{run.baseLimit}
                  </td>
                  <td>
                    {run.causalUsed}/{run.causalLimit}
                  </td>
                  <td>
                    <span className={readinessTone(caseReadiness)}>{caseReadiness}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={styles.btnGhost}
                      onClick={() =>
                        onSelectRun?.({
                          run_id: run.activityRuntimeRunId,
                          user_id: run.userId,
                          role_id: run.roleId,
                          role_runtime_session_id: run.roleRuntimeSessionId,
                          activity_id: run.activityId,
                          runtime_view_scope: "selected_activity",
                          view: "runtime",
                        })
                      }
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
