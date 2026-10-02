"use client";

import { useEffect, useState } from "react";
import type { PMProcessCardModel, PMVisualStatus } from "./pm-process-catalog";
import { resolveCardStatusClock } from "./pm-card-footer";
import styles from "./ccp-pm.module.css";

function cardToneClass(status: PMVisualStatus, selected: boolean): string {
  const tone =
    status === "completado"
      ? styles.cardCompletado
      : status === "en_progreso"
        ? styles.cardEnProgreso
        : status === "pendiente"
          ? styles.cardPendiente
          : status === "bloqueado"
            ? styles.cardBloqueado
            : styles.cardNoIniciado;
  return selected ? `${tone} ${styles.cardSelected}` : tone;
}

function statusPillClass(status: PMVisualStatus): string {
  switch (status) {
    case "completado":
      return `${styles.statusPill} ${styles.statusCompletado}`;
    case "en_progreso":
      return `${styles.statusPill} ${styles.statusEnProgreso}`;
    case "pendiente":
      return `${styles.statusPill} ${styles.statusPendiente}`;
    case "bloqueado":
      return `${styles.statusPill} ${styles.statusBloqueado}`;
    default:
      return `${styles.statusPill} ${styles.statusNoIniciado}`;
  }
}

function MetaIcon({ kind }: { kind: "object" | "event" | "state" }) {
  if (kind === "object") {
    return (
      <svg className={styles.cardMetaIcon} viewBox="0 0 16 16" aria-hidden="true">
        <path
          fill="currentColor"
          d="M4 1.5h5.5L13 5v9.5H4A1.5 1.5 0 0 1 2.5 13V3A1.5 1.5 0 0 1 4 1.5Zm5 0v3.5H12.5"
        />
      </svg>
    );
  }
  if (kind === "event") {
    return (
      <svg className={styles.cardMetaIcon} viewBox="0 0 16 16" aria-hidden="true">
        <path fill="currentColor" d="M9 1 4.5 9H8l-.5 6L13 7H9.5L11 1H9Z" />
      </svg>
    );
  }
  return (
    <svg className={styles.cardMetaIcon} viewBox="0 0 16 16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 1.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13ZM7.25 4v4.1l2.8 1.7.75-1.2-2.05-1.25V4H7.25Z"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className={styles.cardFooterIcon} viewBox="0 0 16 16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 1.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13ZM7.25 4v4.1l2.8 1.7.75-1.2-2.05-1.25V4H7.25Z"
      />
    </svg>
  );
}

function ActorIcon() {
  return (
    <svg className={styles.cardFooterIcon} viewBox="0 0 16 16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5 5.5c0-2.5 2.2-4 5-4s5 1.5 5 4v.5H3v-.5Z"
      />
    </svg>
  );
}

export function PMProcessCard({
  process,
  selected,
  onSelect,
}: {
  process: PMProcessCardModel;
  selected: boolean;
  onSelect: (code: PMProcessCardModel["code"]) => void;
}) {
  const [nowMs, setNowMs] = useState(() => {
    const asOf = Date.parse(process.observationAsOf);
    return Number.isNaN(asOf) ? 0 : asOf;
  });

  useEffect(() => {
    // Defer live clock to after hydration to avoid SSR/client Date.now() mismatch.
    setNowMs(Date.now());
    const needsTick =
      process.visualStatus === "en_progreso" ||
      process.visualStatus === "pendiente" ||
      process.visualStatus === "bloqueado";
    if (!needsTick || !process.statusSinceAt) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, [process.visualStatus, process.statusSinceAt, process.observationAsOf]);

  const clock = resolveCardStatusClock({
    visualStatus: process.visualStatus,
    completedAt: process.completedAt,
    statusSinceAt: process.statusSinceAt,
    nowMs,
  });

  const ariaLabel = [
    process.code,
    process.name,
    process.objectState,
    `Evento: ${process.enablingEvent}`,
    `Estado producido: ${process.producedState}`,
    process.executionMode === "manual" ? "Manual fuera de plataforma" : process.scopeLabel,
    `Tiempo: ${clock.title}`,
    `Responsable: ${process.footerWorkerRole}`,
  ].join(". ");

  return (
    <button
      type="button"
      className={cardToneClass(process.visualStatus, selected)}
      data-testid={`ccp-pm-card-${process.code}`}
      data-process-code={process.code}
      data-execution-mode={process.executionMode}
      data-footer-worker={process.footerWorkerRole}
      data-footer-clock-kind={clock.kind}
      aria-pressed={selected}
      aria-label={ariaLabel}
      onClick={() => onSelect(process.code)}
    >
      <div className={styles.cardHead}>
        <span className={styles.cardSeq}>{process.sequence ?? "★"}</span>
        <div className={styles.cardTitles}>
          <span className={styles.cardCode}>{process.code}</span>
          <span className={styles.cardName}>{process.name}</span>
        </div>
      </div>

      {process.executionMode === "manual" ? (
        <span className={styles.manualScopeBadge} data-testid="ccp-pm-manual-badge">
          Manual fuera de plataforma
        </span>
      ) : null}

      <dl className={styles.cardMeta}>
        <div className={styles.cardMetaRow}>
          <dt>
            <MetaIcon kind="object" />
            Objeto / Estado
          </dt>
          <dd>{process.objectState}</dd>
        </div>
        <div className={styles.cardMetaRow}>
          <dt>
            <MetaIcon kind="event" />
            Evento que habilita
          </dt>
          <dd title={process.enablingEvent} aria-label={process.enablingEvent}>
            {process.enablingEventDisplay}
          </dd>
        </div>
        <div className={styles.cardMetaRow}>
          <dt>
            <MetaIcon kind="state" />
            Estado producido
          </dt>
          <dd>{process.producedState}</dd>
        </div>
      </dl>

      <span className={statusPillClass(process.visualStatus)}>
        {process.visualStatusLabel}
      </span>

      <div className={styles.cardFooter}>
        <span
          className={styles.cardFooterMeta}
          data-testid="ccp-pm-card-clock"
          title={clock.title}
        >
          <ClockIcon />
          <span className={styles.cardFooterValue}>{clock.text}</span>
        </span>
        <span
          className={styles.cardFooterMeta}
          data-testid="ccp-pm-card-worker"
          title={process.footerWorkerReason}
        >
          <ActorIcon />
          <span className={styles.cardFooterValue}>{process.footerWorkerRole}</span>
        </span>
      </div>
    </button>
  );
}
