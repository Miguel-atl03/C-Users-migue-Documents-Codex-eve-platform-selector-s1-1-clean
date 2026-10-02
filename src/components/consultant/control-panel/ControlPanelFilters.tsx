"use client";

import { useSyncExternalStore } from "react";
import type { ControlPanelFilterScope } from "@/services/eve/consultant-control-panel/consultant-control-panel-types";
import styles from "./ccp.module.css";

type FilterOptions = {
  client_companies: Array<{ id: string; label: string }>;
  cases: Array<{ id: string; label: string }>;
  users: Array<{ id: string; label: string }>;
  roles: Array<{ id: string; label: string }>;
  activities: Array<{ id: string; label: string }>;
  runs: Array<{ id: string; label: string }>;
};

const FILTER_FIELDS: Array<{
  key: keyof ControlPanelFilterScope;
  label: string;
  optionsKey: keyof FilterOptions | null;
}> = [
  { key: "client_company_id", label: "Empresa cliente", optionsKey: "client_companies" },
  { key: "case_id", label: "Caso", optionsKey: "cases" },
  { key: "user_id", label: "Usuario", optionsKey: "users" },
  { key: "role_id", label: "Rol", optionsKey: "roles" },
  { key: "activity_id", label: "Actividad", optionsKey: "activities" },
  { key: "run_id", label: "Run", optionsKey: "runs" },
];

const emptySubscribe = () => () => {};

function useHasHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export function ControlPanelFilters({
  filters,
  options,
  onChange,
}: {
  filters: ControlPanelFilterScope;
  options: FilterOptions;
  onChange: (next: ControlPanelFilterScope) => void;
}) {
  // Defer interactive controls until after hydration so browser extensions that
  // inject attributes (e.g. fdprocessedid) cannot cause SSR/client mismatches.
  const hydrated = useHasHydrated();

  return (
    <section className={styles.scopeBar} aria-label="Filtros globales de alcance">
      <p className={styles.scopeLabel}>Alcance · Empresa cliente · Caso · Usuario · Rol · Actividad · Run</p>
      <div className={styles.scopeGrid}>
        {FILTER_FIELDS.map((field) => {
          const optionsList = field.optionsKey ? options[field.optionsKey] : [];
          const value = filters[field.key] ?? "";
          return (
            <label key={field.key} className={styles.scopeField}>
              {field.label}
              {!hydrated ? (
                <div
                  aria-hidden
                  className="mt-1 h-9 w-full rounded-lg border border-[var(--ccp-line)] bg-[var(--ccp-soft)]"
                />
              ) : optionsList.length > 0 ? (
                <select
                  autoComplete="off"
                  className={styles.input}
                  onChange={(event) => {
                    const nextValue = event.target.value || null;
                    const next: ControlPanelFilterScope = {
                      ...filters,
                      [field.key]: nextValue,
                    };
                    if (field.key === "user_id" || field.key === "role_id") {
                      next.activity_id = null;
                      next.run_id = null;
                    }
                    if (field.key === "activity_id") {
                      next.run_id = null;
                    }
                    onChange(next);
                  }}
                  value={value}
                >
                  <option value="">Todos</option>
                  {optionsList.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  autoComplete="off"
                  className={styles.input}
                  onChange={(event) =>
                    onChange({
                      ...filters,
                      [field.key]: event.target.value.trim() || null,
                    })
                  }
                  placeholder="Filtrar…"
                  value={value}
                />
              )}
            </label>
          );
        })}
      </div>
    </section>
  );
}
