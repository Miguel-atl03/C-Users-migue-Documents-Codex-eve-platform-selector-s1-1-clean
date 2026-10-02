"use client";

import type { KeyboardEvent } from "react";
import type { PMSyncPattern } from "./pm-process-catalog";
import {
  connectorKindLabel,
  syncPatternOrNa,
  type PMTransitionModel,
  type PMTransitionRuntimeStatus,
} from "./pm-transitions";
import styles from "./ccp-pm.module.css";

function SyncIcon({ pattern }: { pattern: PMSyncPattern }) {
  if (pattern === "parallel_sync") {
    return (
      <svg viewBox="0 0 28 28" fill="none">
        <path
          d="M18.5 7.2a7.2 7.2 0 0 0-10.4.8l-1.4-1.4V12h5.4L10.5 10.4a4.8 4.8 0 0 1 6.9-.5l1.1-2.7Z"
          fill="currentColor"
        />
        <path
          d="M9.5 20.8a7.2 7.2 0 0 0 10.4-.8l1.4 1.4V16h-5.4l1.6 1.6a4.8 4.8 0 0 1-6.9.5l-1.1 2.7Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (pattern === "wait_only") {
    return (
      <svg viewBox="0 0 36 20" fill="none">
        <path
          d="M2 10h18"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeDasharray="3.5 3"
          strokeLinecap="round"
        />
        <path d="M20 10l6-3.8V13.8L20 10Z" fill="currentColor" />
        <circle cx="30.5" cy="10" r="4.2" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M30.5 7.8v2.4l1.5.9"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (pattern === "fire_and_forget") {
    return (
      <svg viewBox="0 0 36 20" fill="none">
        <circle cx="5" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9 10h16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M24 10l7-4.4V14.4L24 10Z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 36 20" fill="none">
      <path d="M3 10h20" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M22 10l8-5V15l-8-5Z" fill="currentColor" />
    </svg>
  );
}

export function PMTransitionConnector({
  transition,
  selected,
  runtimeStatus,
  onSelect,
}: {
  transition: PMTransitionModel;
  selected: boolean;
  runtimeStatus: PMTransitionRuntimeStatus;
  onSelect: (transitionId: string) => void;
}) {
  const isBoundary = transition.connectorKind !== "synchronization";
  const primaryLabel = isBoundary
    ? connectorKindLabel(transition.connectorKind)
    : syncPatternOrNa(transition.syncPattern);
  const ariaLabel = [
    transition.transitionId,
    primaryLabel,
    transition.visualSourceProcessId,
    "a",
    transition.visualTargetProcessId,
    transition.secondaryBadge,
  ]
    .filter(Boolean)
    .join(" · ");

  const blocked =
    runtimeStatus === "blocked" || runtimeStatus === "not_enabled";

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(transition.transitionId);
    }
  };

  return (
    <button
      type="button"
      className={[
        styles.syncBridge,
        selected ? styles.syncBridgeSelected : "",
        isBoundary ? styles.syncBridgeBoundary : "",
        blocked ? styles.syncBridgeBlocked : "",
        transition.secondaryBadge ? styles.syncBridgeWithBadge : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-pattern={transition.syncPattern ?? transition.connectorKind}
      data-connector-kind={transition.connectorKind}
      data-transition-id={transition.transitionId}
      data-runtime-status={runtimeStatus}
      data-testid="ccp-pm-sync-bridge"
      aria-label={ariaLabel}
      aria-pressed={selected}
      title={transition.tooltip ?? primaryLabel}
      onClick={() => onSelect(transition.transitionId)}
      onKeyDown={onKeyDown}
    >
      {isBoundary ? (
        <span className={styles.boundaryDivider} aria-hidden="true" />
      ) : (
        <span className={styles.syncBridgeIcon} aria-hidden="true">
          <SyncIcon pattern={transition.syncPattern!} />
        </span>
      )}
      <span className={styles.syncBridgeLabel}>{primaryLabel}</span>
      {transition.secondaryBadge ? (
        <span className={styles.connectorSecondaryBadge}>{transition.secondaryBadge}</span>
      ) : null}
    </button>
  );
}
