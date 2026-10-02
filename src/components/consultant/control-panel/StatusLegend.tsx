"use client";

import styles from "./ccp.module.css";

const LEGEND = [
  { className: "pillSuccess", label: "ready", sense: "Verde · cierre autorizado" },
  {
    className: "pillWarn",
    label: "ready_with_flags",
    sense: "Ámbar · avance con insuficiencia",
  },
  { className: "pillError", label: "blocked", sense: "Rojo · impide avance/export" },
  {
    className: "pillReentry",
    label: "reentry_required",
    sense: "Naranja · reentrada requerida",
  },
  {
    className: "pillReview",
    label: "manual_review_required",
    sense: "Morado · revisión experta",
  },
  { className: "pillDisabled", label: "disabled", sense: "Gris · no ejecutable" },
] as const;

export function StatusLegend() {
  return (
    <section className={styles.legend} data-testid="ccp-status-legend" aria-label="Leyenda de estados">
      <p className={styles.legendTitle}>StatusLegend</p>
      <ul className={styles.legendList}>
        {LEGEND.map((item) => (
          <li key={item.label}>
            <span className={styles[item.className]}>{item.label}</span>
            <span className={styles.legendSense}>{item.sense}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
