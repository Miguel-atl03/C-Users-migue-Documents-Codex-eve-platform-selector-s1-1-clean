"use client";

import { forwardRef } from "react";

import type { ClientCaseOption } from "@/services/eve/official-control-panel/official-control-panel-context.types";
import styles from "../styles/official-control-panel.module.css";

type CurrentCaseSelectorProps = {
  options: ClientCaseOption[];
  value: string | null;
  relationshipSelected: boolean;
  loading: boolean;
  onChange: (caseId: string | null) => void;
};

export const CurrentCaseSelector = forwardRef<
  HTMLSelectElement,
  CurrentCaseSelectorProps
>(function CurrentCaseSelector(
  { options, value, relationshipSelected, loading, onChange },
  ref,
) {
  const disabled = !relationshipSelected || loading;
  const placeholder = !relationshipSelected
    ? "Seleccione primero una relación"
    : loading
      ? "Cargando casos…"
      : "Seleccionar caso";

  return (
    <div className={styles.contextSelectorField}>
      <label className={styles.contextSelectorLabel} htmlFor="current-case">
        Caso en curso
      </label>
      <select
        className={styles.contextSelect}
        id="current-case"
        ref={ref}
        value={value ?? ""}
        disabled={disabled}
        aria-describedby="current-case-help"
        suppressHydrationWarning
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <span className={styles.srOnly} id="current-case-help">
        {!relationshipSelected
          ? "Seleccione primero una relación."
          : "Casos vinculados a la relación seleccionada."}
      </span>
    </div>
  );
});
