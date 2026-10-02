"use client";

import type { ConsultantControlPanelState } from "@/services/eve/consultant-control-panel/consultant-control-panel-types";
import styles from "./ccp.module.css";

export function CaseReadinessSummary({ state }: { state: ConsultantControlPanelState }) {
  const readiness = state.area_3_operational_trace.readiness;
  const users = state.area_2_client_progress.users;
  const roleSessions = users.reduce(
    (sum, user) => sum + (user.role_runtime_sessions?.length ?? 0),
    0,
  );
  const activities = users.reduce((sum, user) => sum + user.activities_count, 0);
  const runs = state.area_3_operational_trace.runtimeBudget4020.runtimeBudgetByRun.length;
  const base = state.area_3_operational_trace.base_resolution_gate;
  const causal = state.area_3_operational_trace.causal_closure_gate;
  const selectedRun = state.filters.run_id;
  const runBase = selectedRun
    ? state.area_3_operational_trace.baseResolutionByRun.find(
        (entry) => entry.activityRuntimeRunId === selectedRun,
      )
    : null;
  const runCausal = selectedRun
    ? state.area_3_operational_trace.causalClosureByRun.find(
        (entry) => entry.activityRuntimeRunId === selectedRun,
      )
    : null;

  const kpis = [
    { label: "Usuarios físicos", value: String(users.length) },
    { label: "Roles funcionales", value: String(roleSessions) },
    { label: "Actividades WorkMap", value: String(activities) },
    { label: "Runs Runtime", value: String(runs) },
    {
      label: "Bases resueltas",
      value: runBase
        ? `${runBase.resolved_count}/${runBase.total_required}`
        : `${base.evaluated_or_resolved_or_explicitly_blocked}/${base.total_required}`,
    },
    {
      label: "Causales activadas",
      value: runCausal
        ? `${runCausal.triggered_required_count}/${runCausal.total_required_evaluations}`
        : `${causal.triggered_required}/${causal.total_required_evaluations}`,
    },
    {
      label: "Gaps abiertos",
      value: String(state.area_3_operational_trace.readiness_gaps_count),
    },
    {
      label: "Readiness global",
      value: readiness?.state ?? state.area_2_client_progress.case_status ?? "pending",
    },
  ];

  return (
    <section className={styles.panel} data-testid="ccp-case-readiness">
      <div className={styles.panelHead}>
        <div>
          <h2 className={styles.panelTitle}>CaseReadinessSummary</h2>
          <p className={styles.muted}>
            KPIs del caso · readiness proviene del BFF, no se calcula en cliente.
          </p>
        </div>
      </div>
      <div className={styles.kpiGrid}>
        {kpis.map((kpi) => (
          <article key={kpi.label} className={styles.kpiCard}>
            <span className={styles.kpiLabel}>{kpi.label}</span>
            <strong className={styles.kpiValue}>{kpi.value}</strong>
          </article>
        ))}
      </div>
      {readiness?.flags?.length ? (
        <ul className={styles.flagList}>
          {readiness.flags.map((flag) => (
            <li key={flag}>{flag}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
