"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import type { ClientCompanyOption } from "@/services/eve/official-control-panel/official-control-panel-context.types";
import styles from "../styles/official-control-panel.module.css";

type ClientCompanySelectorProps = {
  options: ClientCompanyOption[];
  value: string | null;
  loading: boolean;
  disabled?: boolean;
  onChange: (companyId: string | null) => void;
};

export function ClientCompanySelector({
  options,
  value,
  loading,
  disabled = false,
  onChange,
}: ClientCompanySelectorProps) {
  const listboxId = useId();
  const inputId = "client-company";
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  const selected = useMemo(
    () => options.find((option) => option.id === value) ?? null,
    [options, value],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    if (!normalized) return options;
    return options.filter((option) =>
      option.label.toLocaleLowerCase("es").includes(normalized),
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) {
      setQuery(selected?.label ?? "");
      setActiveIndex(-1);
    }
  }, [open, selected]);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(filtered.length > 0 ? 0 : -1);
  }, [filtered, open]);

  const commit = useCallback(
    (next: ClientCompanyOption | null) => {
      onChange(next?.id ?? null);
      setQuery(next?.label ?? "");
      setOpen(false);
      inputRef.current?.focus();
    },
    [onChange],
  );

  const clear = useCallback(() => {
    setQuery("");
    onChange(null);
    setOpen(true);
    setActiveIndex(options.length > 0 ? 0 : -1);
    inputRef.current?.focus();
  }, [onChange, options.length]);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (disabled || loading) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActiveIndex((current) =>
        filtered.length === 0 ? -1 : (current + 1) % filtered.length,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActiveIndex((current) =>
        filtered.length === 0
          ? -1
          : current <= 0
            ? filtered.length - 1
            : current - 1,
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const option = filtered[activeIndex];
      if (option) commit(option);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      if (open) {
        setOpen(false);
        setQuery(selected?.label ?? "");
        return;
      }
      if (selected || query) clear();
      return;
    }

    if (event.key === "Tab") {
      setOpen(false);
    }
  };

  const statusText = loading
    ? "Cargando empresas…"
    : options.length === 0
      ? "No hay empresas disponibles."
      : filtered.length === 0
        ? "No hay empresas que coincidan con la búsqueda."
        : `${filtered.length} empresas disponibles.`;

  return (
    <div className={styles.contextSelectorField}>
      <label className={styles.contextSelectorLabel} htmlFor={inputId}>
        Empresa cliente
      </label>
      <div className={styles.contextCombobox}>
        <input
          ref={inputRef}
          className={styles.contextComboboxInput}
          id={inputId}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={
            open && activeIndex >= 0
              ? `${listboxId}-option-${activeIndex}`
              : undefined
          }
          aria-describedby="client-company-help"
          autoComplete="off"
          suppressHydrationWarning
          placeholder={
            loading ? "Cargando empresas…" : "Buscar o seleccionar empresa"
          }
          value={open || !selected ? query : selected.label}
          disabled={disabled || loading}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (!disabled && !loading) setOpen(true);
          }}
          onBlur={() => {
            window.setTimeout(() => {
              if (!listRef.current?.contains(document.activeElement)) {
                setOpen(false);
                setQuery(selected?.label ?? "");
              }
            }, 0);
          }}
          onKeyDown={onKeyDown}
        />
        <div className={styles.contextComboboxActions}>
          {selected && !loading && !disabled ? (
            <button
              type="button"
              className={styles.contextComboboxClear}
              aria-label="Limpiar empresa cliente"
              onMouseDown={(event) => event.preventDefault()}
              onClick={clear}
            >
              ×
            </button>
          ) : null}
          <span className={styles.contextComboboxChevron} aria-hidden="true">
            ▼
          </span>
        </div>
        {open ? (
          <ul
            ref={listRef}
            className={styles.contextComboboxList}
            id={listboxId}
            role="listbox"
            aria-label="Empresas cliente autorizadas"
          >
            {filtered.length === 0 ? (
              <li className={styles.contextComboboxEmpty} role="presentation">
                {loading
                  ? "Cargando empresas…"
                  : options.length === 0
                    ? "No hay empresas disponibles."
                    : "No hay empresas que coincidan."}
              </li>
            ) : (
              filtered.map((option, index) => {
                const isActive = index === activeIndex;
                const isSelected = option.id === value;
                return (
                  <li
                    key={option.id}
                    id={`${listboxId}-option-${index}`}
                    className={`${styles.contextComboboxOption}${
                      isActive ? ` ${styles.contextComboboxOptionActive}` : ""
                    }${
                      isSelected
                        ? ` ${styles.contextComboboxOptionSelected}`
                        : ""
                    }`}
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => commit(option)}
                  >
                    {option.label}
                  </li>
                );
              })
            )}
          </ul>
        ) : null}
      </div>
      <span className={styles.srOnly} id="client-company-help" aria-live="polite">
        Solo se muestran empresas autorizadas. {statusText}
      </span>
    </div>
  );
}
