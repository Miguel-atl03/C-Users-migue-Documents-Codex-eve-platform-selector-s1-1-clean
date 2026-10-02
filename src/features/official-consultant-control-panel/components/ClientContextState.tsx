"use client";

import type { ClientContextViewModel } from "../types/client-context.types";
import styles from "../styles/official-control-panel.module.css";

type ClientContextStateProps = {
  context: ClientContextViewModel;
  onRetry: () => void;
};

export function ClientContextState({
  context,
  onRetry,
}: ClientContextStateProps) {
  if (context.status === "error") {
    return (
      <div className={styles.contextStateError} role="alert">
        <span>
          {context.errorMessage ?? "No fue posible cargar el contexto."}
        </span>
        <button
          className={styles.contextRetryButton}
          type="button"
          onClick={onRetry}
        >
          Reintentar
        </button>
      </div>
    );
  }

  let message = "";

  // Active context must never show company-loading copy.
  if (context.status === "active") {
    message = "";
  } else if (
    context.status === "loading-companies" ||
    (context.companiesLoading && !context.selectedCompany)
  ) {
    message = "Cargando empresas…";
  } else if (context.companies.length === 0 && context.companiesLoading) {
    message = "Cargando empresas…";
  } else if (context.companies.length === 0) {
    message = "No hay empresas disponibles.";
  } else if (context.status === "loading-relationships") {
    message = "Cargando relaciones…";
  } else if (context.status === "loading-cases") {
    message = "Cargando casos…";
  } else if (context.errorMessage) {
    message = context.errorMessage;
  } else if (
    context.status === "no-relationship" &&
    context.selectedCompany &&
    context.relationships.length === 0
  ) {
    message = "Esta empresa no tiene una relación activa disponible.";
  } else if (context.status === "no-relationship") {
    message = "Seleccione una relación activa.";
  } else if (
    context.status === "no-case" &&
    context.selectedRelationship &&
    context.cases.length === 0
  ) {
    message = "No hay un caso disponible para esta relación.";
  } else if (context.status === "no-case") {
    message = "Seleccione un caso en curso.";
  }

  if (!message) return null;

  return (
    <p className={styles.contextStateMessage} aria-live="polite" role="status">
      <span aria-hidden="true">!</span>{" "}
      {message}
    </p>
  );
}
