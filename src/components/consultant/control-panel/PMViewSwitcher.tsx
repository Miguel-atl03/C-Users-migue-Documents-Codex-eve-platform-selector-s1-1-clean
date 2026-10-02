"use client";

import type { PMViewMode } from "./pm-process-catalog";
import styles from "./ccp-pm.module.css";

const VIEWS: Array<{ key: PMViewMode; label: string }> = [
  { key: "mapa", label: "Mapa de proceso" },
  { key: "tabla", label: "Tabla" },
  { key: "dependencias", label: "Dependencias" },
];

export function PMViewSwitcher({
  value,
  onChange,
}: {
  value: PMViewMode;
  onChange: (next: PMViewMode) => void;
}) {
  return (
    <div className={styles.viewSwitcher} data-testid="ccp-pm-view-switcher">
      <span className={styles.viewSwitcherLabel}>Ver:</span>
      <div className={styles.viewTabs} role="tablist" aria-label="Vista del mapa de procesos">
        {VIEWS.map((view) => {
          const active = view.key === value;
          return (
            <button
              key={view.key}
              type="button"
              role="tab"
              aria-selected={active}
              className={active ? styles.viewTabActive : styles.viewTab}
              onClick={() => onChange(view.key)}
            >
              {view.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
