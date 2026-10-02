"use client";

import type { RuntimeViewScopeKey } from "@/services/eve/consultant-control-panel/consultant-control-panel-types";
import styles from "./ccp.module.css";

const OPTIONS: Array<{ value: RuntimeViewScopeKey; label: string }> = [
  { value: "selected_activity", label: "Actividad seleccionada" },
  { value: "role_activities", label: "Todas las actividades de esta función" },
  { value: "user_all_roles", label: "Todas las funciones de este usuario" },
  { value: "case_all", label: "Todo el caso" },
];

export function RuntimeScopeSelector({
  value,
  onChange,
}: {
  value: RuntimeViewScopeKey;
  onChange: (next: RuntimeViewScopeKey) => void;
}) {
  return (
    <div
      className={styles.runtimeScopeSelector}
      data-testid="ccp-runtime-scope-selector"
    >
      <label className={styles.runtimeScopeLabel} htmlFor="ccp-runtime-view-scope">
        Ver datos por
      </label>
      <select
        id="ccp-runtime-view-scope"
        className={styles.runtimeScopeSelect}
        value={value}
        onChange={(event) => onChange(event.target.value as RuntimeViewScopeKey)}
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
