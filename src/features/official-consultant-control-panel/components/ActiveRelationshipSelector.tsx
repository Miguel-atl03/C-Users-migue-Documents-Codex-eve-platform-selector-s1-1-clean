"use client";

import { forwardRef } from "react";

import type { ClientRelationshipOption } from "@/services/eve/official-control-panel/official-control-panel-context.types";
import styles from "../styles/official-control-panel.module.css";

type ActiveRelationshipSelectorProps = {
  options: ClientRelationshipOption[];
  value: string | null;
  companySelected: boolean;
  loading: boolean;
  onChange: (relationshipId: string | null) => void;
};

export const ActiveRelationshipSelector = forwardRef<
  HTMLSelectElement,
  ActiveRelationshipSelectorProps
>(function ActiveRelationshipSelector(
  { options, value, companySelected, loading, onChange },
  ref,
) {
  const disabled = !companySelected || loading;
  const placeholder = !companySelected
    ? "Seleccione primero una empresa"
    : loading
      ? "Cargando relaciones…"
      : "Seleccionar relación";

  return (
    <div className={styles.contextSelectorField}>
      <label className={styles.contextSelectorLabel} htmlFor="active-relationship">
        Relación activa
      </label>
      <select
        className={styles.contextSelect}
        id="active-relationship"
        ref={ref}
        value={value ?? ""}
        disabled={disabled}
        aria-describedby="active-relationship-help"
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
      <span className={styles.srOnly} id="active-relationship-help">
        {!companySelected
          ? "Seleccione primero una empresa."
          : "Relaciones vigentes y autorizadas para la empresa seleccionada."}
      </span>
    </div>
  );
});
