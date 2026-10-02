"use client";

import type {
  ConsultantControlPanelState,
  ControlPanelFilterScope,
  ControlPanelViewKey,
} from "@/services/eve/consultant-control-panel/consultant-control-panel-types";
import { CaseReadinessSummary } from "./CaseReadinessSummary";
import { CompanyUserRoleMatrix } from "./CompanyUserRoleMatrix";
import { CriticalAlertsStrip } from "./CriticalAlertsStrip";
import { FunctionalHelpPanel } from "./FunctionalHelpPanel";
import { RuntimeOperationalView } from "./RuntimeOperationalView";
import { GateReadinessPanel } from "./GateReadinessPanel";
import { OperationalTraceTimeline } from "./OperationalTraceTimeline";
import { DownloadsPanel } from "./DownloadsPanel";
import { AuditTrailPanel } from "./AuditTrailPanel";
import { StatusLegend } from "./StatusLegend";
import styles from "./ccp.module.css";

export function ControlPanelWorkspace({
  state,
  view,
  onSelect,
  onOpenManualPreview,
  onOpenEvidence,
  pmProcessCode,
}: {
  state: ConsultantControlPanelState;
  view: ControlPanelViewKey;
  onSelect: (next: Partial<ControlPanelFilterScope>) => void;
  onOpenManualPreview: () => void;
  onOpenEvidence: (payload: { title: string; body: string }) => void;
  /** Effective PM process from mother shell (e.g. P-SUP-01). */
  pmProcessCode?: string | null;
}) {
  const selectedRunContext = {
    ...state.selected_context,
    pmProcessCode:
      state.selected_context.pmProcessCode ??
      state.meta.effective_scope.pm_process_code ??
      pmProcessCode ??
      "P-SUP-01",
    effectiveScope:
      state.meta.effective_scope.runtime_view_scope ??
      state.selected_context.effectiveScope ??
      "selected_activity",
  };

  return (
    <div className={styles.workspace} data-testid="ccp-workspace" data-view={view}>
      {view === "cases" ? (
        <div className={styles.stack} data-testid="ccp-init-001">
          <div className={styles.workspaceIntro}>
            <h2 className={styles.workspaceHeading}>Centro de casos</h2>
            <p className={styles.muted}>
              Vista ejecutiva INIT-001 · readiness, matriz multirrol y alertas críticas.
            </p>
          </div>
          <StatusLegend />
          <CaseReadinessSummary state={state} />
          <CompanyUserRoleMatrix state={state} onSelect={onSelect} />
          <CriticalAlertsStrip alerts={state.critical_alerts} />
        </div>
      ) : null}

      {view === "monitoring" || view === "functional-help" ? (
        <div className={styles.stack}>
          <div className={styles.workspaceIntro}>
            <h2 className={styles.workspaceHeading}>Participantes y roles</h2>
            <p className={styles.muted}>
              Cobertura por usuario físico, role_runtime_session y señales funcionales.
            </p>
          </div>
          <CompanyUserRoleMatrix state={state} onSelect={onSelect} />
          <FunctionalHelpPanel state={state} onOpenManualPreview={onOpenManualPreview} />
        </div>
      ) : null}

      {view === "runtime" ? (
        <div className={styles.stack} data-testid="ccp-runtime-module">
          <RuntimeOperationalView
            state={state}
            selectedRunContext={selectedRunContext}
            onSelect={onSelect}
            onOpenEvidence={onOpenEvidence}
          />
        </div>
      ) : null}

      {view === "trace" ? <OperationalTraceTimeline state={state} /> : null}
      {view === "gates" ? <GateReadinessPanel state={state} /> : null}
      {view === "downloads" ? <DownloadsPanel state={state} /> : null}
      {view === "audit" ? <AuditTrailPanel state={state} /> : null}
    </div>
  );
}
