"use client";

import { LEGACY_CONSULTANT_CONTROL_PANEL_STATUS } from "@/services/eve/consultant-control-panel/legacy-consultant-control-panel-status";
import styles from "./ccp-pm.module.css";

export function PMCaseHeader({
  company,
  caseLabel,
  caseStateLabel,
  progressPct,
  criticalPending,
  blockages,
  consultantRole,
  isPending: _isPending,
  filterError,
}: {
  company: string;
  caseLabel: string;
  caseStateLabel: string;
  progressPct: number;
  criticalPending: number;
  blockages: number;
  consultantRole?: string | null;
  isPending?: boolean;
  filterError?: string | null;
}) {
  void _isPending;
  const clamped = Math.max(0, Math.min(100, progressPct));

  return (
    <header data-testid="ccp-pm-case-header">
      <div className={styles.topBar}>
        <div className={styles.topBarBrandRow}>
          <p className={styles.topBarBrand}>EVE - Panel de Control.</p>
          <span
            className={styles.legacyDraftBadge}
            data-testid="ccp-legacy-draft-badge"
            title="Esta pantalla se conserva únicamente como referencia histórica. No representa el diseño oficial vigente del Panel de Control EVE."
          >
            {LEGACY_CONSULTANT_CONTROL_PANEL_STATUS.label}
          </span>
        </div>
        <div className={styles.topBarRight}>
          <p className={styles.topBarRole}>Rol: {consultantRole ?? "Consultor"}</p>
          <button type="button" className={styles.topBarAction} disabled aria-label="Notificaciones">
            <span className={styles.topBarBell} aria-hidden />
          </button>
          <button type="button" className={styles.topBarFilter} disabled>
            Filtros
          </button>
        </div>
      </div>

      <div className={styles.caseStrip}>
        <div className={styles.caseFact}>
          <span className={styles.caseFactLabel}>Empresa cliente</span>
          <strong className={styles.caseFactValue}>{company}</strong>
        </div>
        <div className={styles.caseFact}>
          <span className={styles.caseFactLabel}>Caso</span>
          <strong className={styles.caseFactValue}>{caseLabel}</strong>
        </div>
        <div className={styles.caseFact}>
          <span className={styles.caseFactLabel}>Estado general del caso</span>
          <span className={styles.caseStatePill}>{caseStateLabel}</span>
        </div>
        <div className={styles.caseFact}>
          <span className={styles.caseFactLabel}>Progreso general</span>
          <div className={styles.progressRow}>
            <strong className={styles.progressPct}>{clamped}%</strong>
            <div className={styles.progressTrack} aria-hidden>
              <div className={styles.progressFill} style={{ width: `${clamped}%` }} />
            </div>
          </div>
        </div>
        <div className={styles.caseFact}>
          <span className={styles.caseFactLabel}>Pendientes críticos</span>
          <strong className={styles.factCritical}>{criticalPending}</strong>
        </div>
        <div className={styles.caseFact}>
          <span className={styles.caseFactLabel}>Bloqueos</span>
          <strong className={styles.factBlock}>{blockages}</strong>
        </div>
      </div>

      {filterError ? <p className={styles.headerError}>{filterError}</p> : null}
    </header>
  );
}
