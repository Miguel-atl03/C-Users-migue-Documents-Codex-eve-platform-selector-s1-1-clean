"use client";

import { useState } from "react";
import styles from "./ccp-pm.module.css";

const STATUS_ITEMS = [
  { className: styles.statusCompletado, label: "Completado" },
  { className: styles.statusEnProgreso, label: "En progreso" },
  { className: styles.statusBloqueado, label: "Bloqueado" },
  { className: styles.statusNoIniciado, label: "No iniciado" },
  { className: styles.statusPendiente, label: "Pendiente" },
] as const;

const SYNC_ITEMS = [
  { glyph: "↻", label: "Trigger & Wait" },
  { glyph: "⇉", label: "Paralelo sincronizado" },
  { glyph: "⏱", label: "Wait Only" },
  { glyph: "→", label: "Fire & Forget" },
] as const;

const SCOPE_RELATION_ITEMS = [
  { glyph: "¦", label: "Cambio de rama" },
  { glyph: "┊", label: "Frontera cliente" },
] as const;

export function CollapsedStatusLegend() {
  const [open, setOpen] = useState(false);

  return (
    <section
      className={styles.legend}
      data-testid="ccp-pm-collapsed-legend"
      data-collapsed={open ? "false" : "true"}
    >
      <button
        type="button"
        className={styles.legendToggle}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span>
          Leyenda de estado (Object[State]) · Patrones de sincronización (PM) · Relaciones de
          alcance
        </span>
        <span aria-hidden>{open ? "▾" : "▸"}</span>
      </button>

      {open ? (
        <div className={styles.legendBody}>
          <div>
            <p className={styles.legendTitle}>Estados</p>
            <ul className={styles.legendList}>
              {STATUS_ITEMS.map((item) => (
                <li key={item.label}>
                  <span className={`${styles.statusPill} ${item.className}`}>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className={styles.legendTitle}>Patrones de sincronización</p>
            <ul className={styles.legendList}>
              {SYNC_ITEMS.map((item) => (
                <li key={item.label}>
                  <span className={styles.legendSyncMark} aria-hidden>
                    {item.glyph}
                  </span>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className={styles.legendTitle}>Relaciones de alcance</p>
            <ul className={styles.legendList}>
              {SCOPE_RELATION_ITEMS.map((item) => (
                <li key={item.label}>
                  <span className={styles.legendSyncMark} aria-hidden>
                    {item.glyph}
                  </span>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
            <p className={styles.legendHint}>
              No son patrones MMABP; marcan adyacencia visual sin dependencia causal directa.
            </p>
          </div>
        </div>
      ) : (
        <p className={styles.legendCollapsedLine}>
          Completado · En progreso · Bloqueado · No iniciado · Pendiente · Trigger & Wait ·
          Paralelo · Wait Only · Fire & Forget · Cambio de rama · Frontera cliente
        </p>
      )}
    </section>
  );
}
