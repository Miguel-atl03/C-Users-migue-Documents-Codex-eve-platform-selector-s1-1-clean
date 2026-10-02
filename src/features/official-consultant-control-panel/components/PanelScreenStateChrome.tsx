"use client";

import { useEffect, useRef } from "react";

import styles from "../styles/official-control-panel.module.css";
import type { OfficialPanelScreenState } from "@/services/eve/official-control-panel/official-control-panel-contract.types";

export function PanelRefreshNotice({
  sourceObservedAt,
}: {
  sourceObservedAt?: string | null;
}) {
  return (
    <p
      className={styles.panelNotice}
      role="status"
      aria-live="polite"
      data-testid="panel-refresh-notice"
    >
      <span aria-hidden="true">!</span>{" "}
      Actualizando información…
      {sourceObservedAt ? (
        <span className={styles.panelNoticeMeta}>
          {" "}
          Última observación: {formatObservedAt(sourceObservedAt)}
        </span>
      ) : null}
    </p>
  );
}

export function PanelPartialNotice({ onRetry }: { onRetry?: () => void }) {
  return (
    <div
      className={styles.panelNoticePartial}
      role="status"
      data-testid="panel-partial-notice"
    >
      <p className={styles.panelNotice}>
        <span aria-hidden="true">!</span>{" "}
        Parte de la información no pudo actualizarse.
      </p>
      {onRetry ? (
        <button
          type="button"
          className={styles.contextRetryButton}
          onClick={onRetry}
        >
          Reintentar
        </button>
      ) : null}
    </div>
  );
}

export function PanelStaleNotice({ onRetry }: { onRetry?: () => void }) {
  return (
    <div
      className={styles.panelNoticeStale}
      role="status"
      data-testid="panel-stale-notice"
    >
      <p className={styles.panelNotice}>
        <span aria-hidden="true">!</span>{" "}
        La información cambió desde la última actualización. Actualice antes de
        realizar esta acción.
      </p>
      {onRetry ? (
        <button
          type="button"
          className={styles.contextRetryButton}
          onClick={onRetry}
          data-testid="panel-stale-retry"
        >
          Actualizar
        </button>
      ) : null}
    </div>
  );
}

export function PanelForbiddenState() {
  return (
    <section
      className={styles.statePanel}
      role="alert"
      data-testid="panel-forbidden-state"
    >
      <span aria-hidden="true">!</span>
      <h2>Acceso no disponible</h2>
      <p>No tiene acceso a este recurso.</p>
    </section>
  );
}

export function PanelNotFoundState({
  message,
}: {
  message?: string;
}) {
  return (
    <section
      className={styles.workspaceEmptyState}
      role="status"
      data-testid="panel-not-found-state"
    >
      <span aria-hidden="true">!</span>
      <p className={styles.workspaceEmptyTitle}>Sin información</p>
      <p className={styles.workspaceEmptyMessage}>
        {message ??
          "No se encontró información para la selección actual."}
      </p>
    </section>
  );
}

export function PanelFatalState({
  requestId,
  onRetry,
  message,
}: {
  requestId: string | null;
  onRetry: () => void;
  message?: string;
}) {
  const summaryRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    summaryRef.current?.focus();
  }, [requestId]);

  return (
    <section
      className={styles.statePanel}
      role="alert"
      data-testid="panel-fatal-state"
    >
      <span aria-hidden="true">!</span>
      <h2 ref={summaryRef} tabIndex={-1}>
        No fue posible cargar esta sección.
      </h2>
      <p>
        {message ??
          "Ocurrió un error al consultar la información. Intente de nuevo."}
      </p>
      {requestId ? (
        <p data-testid="panel-fatal-request-ref">
          Referencia: <span>{requestId}</span>
        </p>
      ) : null}
      <button
        type="button"
        className={styles.retryButton}
        onClick={onRetry}
        data-testid="panel-fatal-retry"
      >
        Reintentar
      </button>
    </section>
  );
}

export function PanelSectionLoading({ label }: { label: string }) {
  return (
    <div
      className={styles.panelSectionSkeleton}
      aria-busy="true"
      role="status"
      data-testid="panel-section-loading"
    >
      <span aria-hidden="true">!</span>
      <p className={styles.workspaceEmptyMessage}>{label}</p>
    </div>
  );
}

/** Renders the non-content chrome for a screen state (notices / blockers). */
export function PanelScreenStateChrome({
  screenState,
  requestId,
  sourceObservedAt,
  onRetry,
  domainNotFoundMessage,
}: {
  screenState: OfficialPanelScreenState;
  requestId?: string | null;
  sourceObservedAt?: string | null;
  onRetry?: () => void;
  domainNotFoundMessage?: string;
}) {
  if (screenState === "forbidden") return <PanelForbiddenState />;
  if (screenState === "not_found") {
    return <PanelNotFoundState message={domainNotFoundMessage} />;
  }
  if (screenState === "fatal") {
    return (
      <PanelFatalState
        requestId={requestId ?? null}
        onRetry={onRetry ?? (() => undefined)}
      />
    );
  }
  if (screenState === "loading") {
    return <PanelSectionLoading label="Cargando información…" />;
  }
  return (
    <>
      {screenState === "refreshing" ? (
        <PanelRefreshNotice sourceObservedAt={sourceObservedAt} />
      ) : null}
      {screenState === "partial" ? (
        <PanelPartialNotice onRetry={onRetry} />
      ) : null}
      {screenState === "stale" ? <PanelStaleNotice onRetry={onRetry} /> : null}
    </>
  );
}

function formatObservedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  });
}
