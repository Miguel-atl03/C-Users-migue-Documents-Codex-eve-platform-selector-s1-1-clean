"use client";

import type {
  ConsultantControlPanelState,
  ControlPanelFilterScope,
  RuntimeBudgetByRunItem,
} from "@/services/eve/consultant-control-panel/consultant-control-panel-types";
import styles from "./ccp.module.css";

function readinessTone(state: string): string {
  const value = state.toLowerCase();
  if (value.includes("blocked")) return styles.pillError;
  if (value.includes("reentry")) return styles.pillReentry;
  if (value.includes("flag") || value.includes("pending")) return styles.pillWarn;
  if (value.includes("ready") || value.includes("complete")) return styles.pillSuccess;
  return styles.pillNeutral;
}

function pendingCount(run: RuntimeBudgetByRunItem): number {
  return Math.max(0, run.baseRemaining) + Math.max(0, run.causalRemaining);
}

function dominantGate(
  run: RuntimeBudgetByRunItem,
  state: ConsultantControlPanelState,
): string {
  const blocking = state.gates.find((gate) =>
    /block|fail|critical/i.test(gate.status),
  );
  if (blocking) return blocking.gate_code;
  const fromTrace = state.area_3_operational_trace.gate_summaries.find((gate) =>
    /block|fail|critical|reentry|review/i.test(gate.status),
  );
  if (fromTrace) return fromTrace.gate_code;
  return run.currentBlock || "—";
}

function filterRuns(
  runs: RuntimeBudgetByRunItem[],
  state: ConsultantControlPanelState,
): RuntimeBudgetByRunItem[] {
  const effective = state.meta.effective_scope;
  return runs.filter((run) => {
    if (effective.user_id && run.userId !== effective.user_id) return false;
    if (
      effective.role_runtime_session_id &&
      run.roleRuntimeSessionId !== effective.role_runtime_session_id
    ) {
      return false;
    }
    if (effective.activity_id && run.activityId !== effective.activity_id) {
      // Keep sibling runs visible in role/user/case aggregate lists.
      if (effective.runtime_view_scope === "selected_activity") return false;
    }
    return true;
  });
}

export function RuntimeActivityRunList({
  state,
  onSelectRun,
}: {
  state: ConsultantControlPanelState;
  onSelectRun: (next: Partial<ControlPanelFilterScope>) => void;
}) {
  const source =
    state.runs.length > 0
      ? state.runs
      : state.area_3_operational_trace.runtimeBudget4020.runtimeBudgetByRun;
  const runs = filterRuns(source, state);
  const selected =
    state.meta.effective_scope.run_id ??
    state.selected_context.runId ??
    state.filters.run_id;

  return (
    <section
      className={styles.runtimeActivityList}
      data-testid="ccp-runtime-activity-run-list"
    >
      <div className={styles.panelHead}>
        <div>
          <h3 className={styles.panelTitle}>Actividades primarias / runs</h3>
          <p className={styles.muted}>
            Una fila por run. No se fusionan runs entre usuarios ni entre funciones de
            trabajo.
          </p>
        </div>
      </div>

      {runs.length === 0 ? (
        <p className={styles.muted}>Sin runs en el alcance actual.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.tableDense}>
            <thead>
              <tr>
                <th>Actividad primaria</th>
                <th>Usuario físico</th>
                <th>Función de trabajo</th>
                <th>Run</th>
                <th>Preguntas base</th>
                <th>Preguntas causales</th>
                <th>Pendientes</th>
                <th>Regla de avance</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => {
                const isSelected = selected === run.activityRuntimeRunId;
                return (
                  <tr
                    key={`${run.roleRuntimeSessionId}:${run.activityRuntimeRunId}`}
                    className={isSelected ? styles.rowSelected : undefined}
                    data-role-session={run.roleRuntimeSessionId}
                    data-user-id={run.userId}
                    data-run-id={run.activityRuntimeRunId}
                  >
                    <td>
                      {run.activityCode} · {run.activityName}
                    </td>
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
                      <code>{run.activityRuntimeRunId}</code>
                    </td>
                    <td>
                      {run.baseUsed}/{run.baseLimit}
                    </td>
                    <td>
                      {run.causalUsed}/{run.causalLimit}
                    </td>
                    <td>{pendingCount(run)}</td>
                    <td>{dominantGate(run, state)}</td>
                    <td>
                      <span className={readinessTone(run.runState)}>{run.runState}</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.btnGhost}
                        data-testid={`ccp-ver-run-${run.activityRuntimeRunId}`}
                        onClick={() =>
                          onSelectRun({
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
                        Ver run
                      </button>
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
