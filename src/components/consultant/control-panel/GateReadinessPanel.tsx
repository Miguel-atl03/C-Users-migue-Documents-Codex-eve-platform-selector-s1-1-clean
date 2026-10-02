"use client";

import type { ConsultantControlPanelState } from "@/services/eve/consultant-control-panel/consultant-control-panel-types";
import styles from "./ccp.module.css";

const STRUCTURAL = ["B0", "B2", "B3", "B7"] as const;
const SEM_CODES = ["SEM-001", "SEM-002", "SEM-003", "SEM-004", "SEM-005", "SEM-006", "SEM-007"];
const PST_CODES = ["PST-001", "PST-002", "PST-003", "PST-004", "PST-005", "PST-006"];

function findGate(
  gates: Array<{ gate_code: string; status: string; reason: string | null }>,
  code: string,
) {
  return (
    gates.find((item) => item.gate_code === code) ??
    gates.find((item) => item.gate_code.toUpperCase().includes(code.replace("-", ""))) ??
    gates.find((item) => item.gate_code.toUpperCase().startsWith(code.split("-")[0] ?? code))
  );
}

function statusClass(status: string): string {
  const value = status.toLowerCase();
  if (value.includes("blocked") || value.includes("fail")) return styles.pillError;
  if (value.includes("reentry")) return styles.pillReentry;
  if (value.includes("review")) return styles.pillReview;
  if (value.includes("flag") || value.includes("pending")) return styles.pillWarn;
  if (value.includes("ready") || value.includes("pass")) return styles.pillSuccess;
  return styles.pillNeutral;
}

export function GateReadinessPanel({ state }: { state: ConsultantControlPanelState }) {
  const gates = state.area_3_operational_trace.gate_summaries;
  const readiness = state.area_3_operational_trace.readiness;
  const roleGap = state.critical_alerts.find((alert) => alert.alert_id === "ROLE_ASSIGNMENT_GAP");
  const decision =
    readiness?.state ?? state.area_2_client_progress.case_status ?? "pending";

  return (
    <section className={styles.panel} data-testid="ccp-gate-readiness">
      <div className={styles.panelHead}>
        <div>
          <h2 className={styles.panelTitle}>Gates y Readiness</h2>
          <p className={styles.muted}>
            B0/B2/B3/B7 · SEM-001…007 · PST-001…006 · gaps y decisión consolidada (BFF).
          </p>
        </div>
        <span className={statusClass(decision)}>{decision}</span>
      </div>

      {roleGap ? (
        <p className={styles.alertWarn}>ROLE_ASSIGNMENT_GAP (warning no diagnóstico)</p>
      ) : null}

      <div className={styles.gateGroups}>
        <article className={styles.gateGroup}>
          <h3 className={styles.subTitle}>B0 / B2 / B3 / B7</h3>
          <ul className={styles.gateList}>
            {STRUCTURAL.map((code) => {
              const gate = findGate(gates, code);
              return (
                <li key={code} className={styles.gateItem}>
                  <strong>{code}</strong>
                  <span className={statusClass(gate?.status ?? "pending")}>
                    {gate?.status ?? "pending"}
                  </span>
                  <p>{gate?.reason ?? "Sin evaluación aún"}</p>
                </li>
              );
            })}
          </ul>
        </article>

        <article className={styles.gateGroup}>
          <h3 className={styles.subTitle}>SEM-001 a SEM-007</h3>
          <ul className={styles.gateListCompact}>
            {SEM_CODES.map((code) => {
              const gate = findGate(gates, code) ?? findGate(gates, "SEM");
              return (
                <li key={code}>
                  <strong>{code}</strong>
                  <span className={statusClass(gate?.status ?? "pending")}>
                    {gate?.status ?? "pending"}
                  </span>
                </li>
              );
            })}
          </ul>
        </article>

        <article className={styles.gateGroup}>
          <h3 className={styles.subTitle}>PST-001 a PST-006</h3>
          <ul className={styles.gateListCompact}>
            {PST_CODES.map((code) => {
              const gate = findGate(gates, code) ?? findGate(gates, "PST");
              return (
                <li key={code}>
                  <strong>{code}</strong>
                  <span className={statusClass(gate?.status ?? "pending")}>
                    {gate?.status ?? "pending"}
                  </span>
                </li>
              );
            })}
          </ul>
        </article>
      </div>

      <div className={styles.metricStrip}>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Readiness Gaps</span>
          <strong className={styles.metricValue}>
            {state.area_3_operational_trace.readiness_gaps_count}
          </strong>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Readiness Decision</span>
          <strong className={styles.metricValue}>{decision}</strong>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Base Resolution Gate</span>
          <strong className={styles.metricValue}>
            {state.area_3_operational_trace.base_resolution_gate.passed_for_ready_full
              ? "pass"
              : "blocked/flags"}
          </strong>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Causal Closure Gate</span>
          <strong className={styles.metricValue}>
            {state.area_3_operational_trace.causal_closure_gate.passed_for_ready_full
              ? "pass"
              : "blocked/flags"}
          </strong>
        </div>
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
