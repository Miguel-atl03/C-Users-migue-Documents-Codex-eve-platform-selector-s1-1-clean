"use client";

import type {
  ConsultantControlPanelState,
  ControlPanelFilterScope,
  ControlPanelSelectedContext,
} from "@/services/eve/consultant-control-panel/consultant-control-panel-types";
import styles from "./ccp.module.css";

/**
 * Aggregate Runtime summary — never reuse base/causal grids as if they were one run.
 */
export function RuntimeAggregateSummary({
  state,
  selectedRunContext,
  onSelectRun,
}: {
  state: ConsultantControlPanelState;
  selectedRunContext: ControlPanelSelectedContext;
  onSelectRun?: (next: Partial<ControlPanelFilterScope>) => void;
}) {
  const runs = state.runs;
  const users = new Set(runs.map((run) => run.userId));
  const roles = new Set(runs.map((run) => run.roleRuntimeSessionId));
  const activities = new Set(runs.map((run) => run.activityId));
  const complete = runs.filter((run) =>
    /ready|complete/i.test(run.runState),
  ).length;
  const withPending = runs.filter(
    (run) => run.baseRemaining > 0 || run.causalRemaining > 0,
  ).length;
  const blocked = runs.filter((run) => /block/i.test(run.runState)).length;

  const causalP0 = state.area_3_operational_trace.causalClosureByRun.reduce(
    (acc, entry) => acc + (entry.p0_blockers?.length ?? 0),
    0,
  );
  const criticalGates = [
    ...state.gates,
    ...state.area_3_operational_trace.gate_summaries,
  ].filter((gate) => /block|fail|critical/i.test(gate.status)).length;

  const scopeLabel =
    selectedRunContext.effectiveScope === "role_activities"
      ? "Todas las actividades de esta función"
      : selectedRunContext.effectiveScope === "user_all_roles"
        ? "Todas las funciones de este usuario"
        : "Todo el caso";

  return (
    <section
      className={styles.panel}
      data-testid="ccp-runtime-aggregate-summary"
      data-aggregate="true"
    >
      <div className={styles.aggregateBanner} role="status">
        Vista agregada: no representa un único run. Selecciona una actividad para ver 40
        base y 20 causales.
      </div>
      <div className={styles.panelHead}>
        <div>
          <h2 className={styles.panelTitle}>Resumen agregado</h2>
          <p className={styles.muted}>
            {scopeLabel}. Totales informativos — no sustituyen el detalle de un run.
          </p>
        </div>
      </div>

      <div className={styles.metricStrip} data-testid="ccp-runtime-aggregate-metrics">
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Usuarios</span>
          <strong className={styles.metricValue}>{users.size}</strong>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Funciones de trabajo</span>
          <strong className={styles.metricValue}>{roles.size}</strong>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Actividades primarias</span>
          <strong className={styles.metricValue}>{activities.size}</strong>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Runs</span>
          <strong className={styles.metricValue}>{runs.length}</strong>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Runs completos</span>
          <strong className={styles.metricValue}>{complete}</strong>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Con pendientes</span>
          <strong className={styles.metricValue}>{withPending}</strong>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Bloqueados</span>
          <strong className={styles.metricValue}>{blocked}</strong>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Causales P0 abiertas</span>
          <strong className={styles.metricValue}>{causalP0}</strong>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Reglas críticas abiertas</span>
          <strong className={styles.metricValue}>{criticalGates}</strong>
        </div>
      </div>

      {runs.length === 0 ? (
        <p className={styles.muted}>Sin runs en el alcance agregado.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.tableDense}>
            <thead>
              <tr>
                <th>Usuario físico</th>
                <th>Función de trabajo</th>
                <th>Actividad primaria</th>
                <th>Run</th>
                <th>Preguntas base</th>
                <th>Preguntas causales</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={`${run.roleRuntimeSessionId}:${run.activityRuntimeRunId}`}>
                  <td>
                    <code>{run.userId}</code>
                  </td>
                  <td>{run.role}</td>
                  <td>
                    {run.activityCode} · {run.activityName}
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
                  <td>{run.runState}</td>
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
                      Ver run
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className={styles.panelCopy}>
        El resumen agregado no abre grids de 40 base ni 20 causales. Selecciona un run
        para pasar al detalle.
      </p>
    </section>
  );
}
