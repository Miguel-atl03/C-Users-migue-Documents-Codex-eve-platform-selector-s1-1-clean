"use client";

import type { ConsultantControlPanelState } from "@/services/eve/consultant-control-panel/consultant-control-panel-types";
import styles from "./ccp.module.css";

function readinessTone(state: string | null | undefined): string {
  const value = (state ?? "").toLowerCase();
  if (value.includes("blocked")) return styles.pillError;
  if (value.includes("reentry")) return styles.pillReentry;
  if (value.includes("manual_review")) return styles.pillReview;
  if (value.includes("flag")) return styles.pillWarn;
  if (value.includes("ready") || value.includes("progress")) return styles.pillSuccess;
  return styles.pillNeutral;
}

export function CaseHeader({
  state,
  isPending,
  filterError,
}: {
  state: ConsultantControlPanelState;
  isPending?: boolean;
  filterError?: string | null;
}) {
  const progress = state.area_2_client_progress;
  const readiness = state.area_3_operational_trace.readiness;
  const caseState = progress.case_status ?? readiness?.state ?? "pending";
  const caseLabel = progress.case_label ?? progress.case_id ?? state.filters.case_id ?? "—";

  return (
    <header className={styles.appHeader} data-testid="ccp-case-header">
      <div className={styles.appHeaderBrand}>
        <p className={styles.brandMark}>EVE · Panel de Control Consultor</p>
        <h1 className={styles.appHeaderTitle}>
          {progress.client_company_name ?? "Empresa cliente"}
        </h1>
        <p className={styles.appHeaderSub}>
          Caso {caseLabel}
          {isPending ? " · actualizando…" : ""}
        </p>
        {filterError ? <p className={styles.headerError}>{filterError}</p> : null}
      </div>

      <div className={styles.appHeaderFacts}>
        <div>
          <span className={styles.factLabel}>Estado del caso</span>
          <span className={readinessTone(caseState)}>{caseState}</span>
        </div>
        <div>
          <span className={styles.factLabel}>Consultor</span>
          <strong>{state.access.consultant_role ?? "consultant"}</strong>
        </div>
        <div>
          <span className={styles.factLabel}>Última actualización</span>
          <strong>{state.generated_at}</strong>
        </div>
        <div>
          <span className={styles.factLabel}>Capabilities</span>
          <div className={styles.capabilityRow}>
            <span className={styles.pillDisabled}>manual_actions=false</span>
            <span className={styles.pillDisabled}>downloads=false</span>
            <span className={styles.pillNeutral}>READ-ONLY</span>
          </div>
        </div>
      </div>
    </header>
  );
}
