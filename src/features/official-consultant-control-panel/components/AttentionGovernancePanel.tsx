"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";

import { presentClientContextShellCopy } from "../presentation/client-context-shell-copy";
import {
  resolveAttentionSectionDisplay,
  shouldShowAttentionPartialNotice,
} from "../presentation/attention-section-display";
import { useRuntimeControlState } from "../state/runtime-control-state-context";
import styles from "../styles/official-control-panel.module.css";
import type { ClientContextStatus } from "../types/client-context.types";
import type {
  ClientCompanyView,
  ContextDrawerState,
} from "../types/official-control-panel.types";
import { presentRuntimeAdvanceLabel } from "@/services/eve/official-control-panel/official-control-panel-runtime-control.types";
import type { ManualHandoffOverdueAlertView } from "@/services/eve/official-control-panel/official-control-panel-manual-work.types";
import type { ParallelProductionAlertView } from "@/services/eve/official-control-panel/official-control-panel-parallel-production.types";
import type { CompanyAttentionAlertView } from "@/services/eve/official-control-panel/official-control-panel-experience.types";
import type { OfficialPanelScreenState } from "@/services/eve/official-control-panel/official-control-panel-contract.types";
import { PanelPartialNotice } from "./PanelScreenStateChrome";

type AttentionGovernancePanelProps = {
  status: ClientContextStatus;
  view: ClientCompanyView;
  caseLabel?: string | null;
  errorKind?: import("../presentation/client-context-shell-copy").ClientContextErrorKind | null;
  /** Fixtures locales: fuerza el estado de control sin depender del context. */
  controlOverride?: import("@/services/eve/official-control-panel/official-control-panel-runtime-control.types").RuntimeControlStateView | null;
  initiallyExpanded?: boolean;
  manualOverdueAlerts?: ManualHandoffOverdueAlertView[];
  parallelProductionAlerts?: ParallelProductionAlertView[];
  companyAlerts?: CompanyAttentionAlertView[];
  /** Unified §17 surface label for the attention drawer. */
  companyStateLabel?: string | null;
  /**
   * Canonical gate from resolvePanelAggregationCompleteness.
   * Drawer must not recalculate completeness from sourceStates/view/tabs.
   */
  attentionComplete: boolean;
  /** Localization + retry only — not used to decide completeness. */
  sourceStates?: {
    experience: OfficialPanelScreenState;
    manualWork: OfficialPanelScreenState;
    parallelProduction: OfficialPanelScreenState;
  };
  onRetryExperience?: () => void;
  onRetryManualWork?: () => void;
  onRetryParallelProduction?: () => void;
  onOpenTrajectory?: () => void;
  onOpenSupport?: () => void;
};

export function AttentionGovernancePanel({
  status,
  view,
  caseLabel,
  errorKind,
  controlOverride = null,
  initiallyExpanded = false,
  manualOverdueAlerts = [],
  parallelProductionAlerts = [],
  companyAlerts = [],
  companyStateLabel = null,
  attentionComplete,
  sourceStates,
  onRetryExperience,
  onRetryManualWork,
  onRetryParallelProduction,
  onOpenTrajectory,
  onOpenSupport,
}: AttentionGovernancePanelProps) {
  const [drawerState, setDrawerState] = useState<ContextDrawerState>(
    initiallyExpanded ? "expanded" : "collapsed",
  );
  const panelId = useId();
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const isExpanded = drawerState === "expanded";
  const copy = presentClientContextShellCopy({
    status,
    view,
    caseLabel,
    errorKind,
  });
  const { controlState: contextControl } = useRuntimeControlState();
  const controlState = controlOverride ?? contextControl;

  const openDrawer = useCallback(() => {
    setDrawerState("expanded");
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerState("collapsed");
    requestAnimationFrame(() => {
      openButtonRef.current?.focus();
    });
  }, []);

  useEffect(() => {
    if (!isExpanded) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDrawer();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeDrawer, isExpanded]);

  const activeGaps = controlState.gaps.filter(
    (g) => g.operationalStatus === "active",
  );
  const relevantTimers = controlState.timers.filter(
    (t) =>
      t.operationalStatus === "overdue" ||
      t.operationalStatus === "upcoming" ||
      t.operationalStatus === "active",
  );
  const openReentries = controlState.reentries.filter((r) => !r.resolvedAt);
  const openReviews = controlState.manualReviews.filter((r) => !r.resolvedAt);

  const experienceDisplay = resolveAttentionSectionDisplay({
    attentionComplete,
    sourceScreenState: sourceStates?.experience ?? null,
    itemCount: companyAlerts.length,
  });
  const manualDisplay = resolveAttentionSectionDisplay({
    attentionComplete,
    sourceScreenState: sourceStates?.manualWork ?? null,
    itemCount: manualOverdueAlerts.length,
  });
  const parallelDisplay = resolveAttentionSectionDisplay({
    attentionComplete,
    sourceScreenState: sourceStates?.parallelProduction ?? null,
    itemCount: parallelProductionAlerts.length,
  });

  const showPartialNotice = shouldShowAttentionPartialNotice(attentionComplete);

  const hasControlSignals =
    activeGaps.length > 0 ||
    relevantTimers.length > 0 ||
    openReentries.length > 0 ||
    openReviews.length > 0 ||
    controlState.blockingBaseIds.length > 0 ||
    controlState.blockingCausalIds.length > 0 ||
    controlState.readiness.sourceVersion != null ||
    experienceDisplay !== "none" ||
    manualDisplay !== "none" ||
    parallelDisplay !== "none" ||
    showPartialNotice;

  return (
    <>
      {isExpanded ? (
        <div
          className={styles.contextDrawerScrim}
          role="presentation"
          onClick={closeDrawer}
        />
      ) : null}
      <aside
        className={`${styles.contextDrawer} ${
          isExpanded
            ? styles.contextDrawerExpanded
            : styles.contextDrawerCollapsed
        }`}
        data-drawer-state={drawerState}
        data-testid="attention-governance-panel"
        data-attention-complete={attentionComplete ? "true" : "false"}
      >
        {isExpanded ? (
          <>
            <div className={styles.contextDrawerHeader}>
              <h2
                className={styles.attentionTitle}
                id="attention-governance-heading"
              >
                Atención y Gobernanza
              </h2>
              <button
                type="button"
                className={styles.contextDrawerToggle}
                aria-expanded="true"
                aria-controls={panelId}
                suppressHydrationWarning
                onClick={closeDrawer}
              >
                Cerrar panel contextual
              </button>
            </div>
            <div
              id={panelId}
              className={styles.contextDrawerBody}
              role="region"
              aria-labelledby="attention-governance-heading"
            >
              {status === "active" && companyStateLabel ? (
                <p
                  className={styles.attentionEmptyMessage}
                  data-testid="attention-company-state"
                >
                  Estado Empresa Cliente: {companyStateLabel}
                </p>
              ) : null}
              {showPartialNotice ? (
                <div data-testid="attention-partial-notice">
                  <PanelPartialNotice
                    onRetry={
                      experienceDisplay === "unavailable"
                        ? onRetryExperience
                        : manualDisplay === "unavailable"
                          ? onRetryManualWork
                          : parallelDisplay === "unavailable"
                            ? onRetryParallelProduction
                            : onRetryExperience
                    }
                  />
                </div>
              ) : null}
              {hasControlSignals ? (
                <div
                  className={styles.attentionControlState}
                  data-testid="attention-runtime-control"
                >
                  <p className={styles.attentionEmptyTitle}>
                    Estado de avance:{" "}
                    {presentRuntimeAdvanceLabel(controlState.readiness.state)}
                  </p>
                  {controlState.readiness.message ? (
                    <p className={styles.attentionEmptyMessage}>
                      {controlState.readiness.message}
                    </p>
                  ) : null}

                  <ControlList
                    title="Brechas activas"
                    testId="attention-active-gaps"
                    items={activeGaps.map(
                      (g) =>
                        `${g.gapCode ?? g.gapId}${g.severity ? ` · ${g.severity}` : ""}`,
                    )}
                    emptyMode={attentionComplete ? "none" : "dash"}
                  />
                  <ControlList
                    title="Timers próximos o vencidos"
                    testId="attention-timers"
                    items={relevantTimers.map(
                      (t) =>
                        `${t.expectedEvent ?? t.timerEventId} · ${t.operationalStatus}`,
                    )}
                    emptyMode={attentionComplete ? "none" : "dash"}
                  />
                  <ControlList
                    title="Reentry requerido"
                    testId="attention-reentries"
                    items={openReentries.map(
                      (r) => `${r.targetBlock ?? r.id}${r.reason ? ` · ${r.reason}` : ""}`,
                    )}
                    emptyMode={attentionComplete ? "none" : "dash"}
                  />
                  <ControlList
                    title="Revisión manual"
                    testId="attention-manual-reviews"
                    items={openReviews.map(
                      (r) =>
                        `${r.reviewReason ?? r.id}${r.reviewStatus ? ` · ${r.reviewStatus}` : ""}`,
                    )}
                    emptyMode={attentionComplete ? "none" : "dash"}
                  />
                  <ControlList
                    title="Bloqueos Base"
                    testId="attention-blocking-base"
                    items={controlState.blockingBaseIds}
                    emptyMode={attentionComplete ? "none" : "dash"}
                  />
                  <ControlList
                    title="Bloqueos Causales"
                    testId="attention-blocking-causal"
                    items={controlState.blockingCausalIds}
                    emptyMode={attentionComplete ? "none" : "dash"}
                  />
                  <section
                    className={styles.attentionControlGroup}
                    data-testid="attention-manual-handoff-overdue"
                  >
                    <h3 className={styles.attentionControlGroupTitle}>
                      Entrega manual vencida
                    </h3>
                    <AttentionSectionBody
                      display={manualDisplay}
                      onRetry={onRetryManualWork}
                      emptyLabel="Ninguno"
                    >
                      <ul className={styles.attentionControlList}>
                        {manualOverdueAlerts.map((alert) => (
                          <li key={`${alert.workItemId}-${alert.dueAt}`}>
                            {alert.processCode} · {alert.expectedEvent} ·{" "}
                            {alert.overdueDurationLabel}
                            {alert.responsibleLabel
                              ? ` · ${alert.responsibleLabel}`
                              : ""}
                          </li>
                        ))}
                      </ul>
                    </AttentionSectionBody>
                  </section>
                  <section
                    className={styles.attentionControlGroup}
                    data-testid="attention-parallel-production"
                  >
                    <h3 className={styles.attentionControlGroupTitle}>
                      Producción Paralela y QA
                    </h3>
                    <AttentionSectionBody
                      display={parallelDisplay}
                      onRetry={onRetryParallelProduction}
                      emptyLabel="Ninguno"
                    >
                      <ul className={styles.attentionControlList}>
                        {parallelProductionAlerts.map((alert) => (
                          <li
                            key={`${alert.code}-${alert.packageId}`}
                            data-testid={`attention-pp-${alert.code}`}
                          >
                            {alert.title} · {alert.detail}
                          </li>
                        ))}
                      </ul>
                    </AttentionSectionBody>
                  </section>
                  <section
                    className={styles.attentionControlGroup}
                    data-testid="attention-company-alerts"
                  >
                    <h3 className={styles.attentionControlGroupTitle}>
                      Alertas prioritarias
                    </h3>
                    <AttentionSectionBody
                      display={experienceDisplay}
                      onRetry={onRetryExperience}
                      emptyLabel="Sin alertas activas para el caso."
                    >
                      <ul className={styles.attentionControlList}>
                        {companyAlerts.map((alert) => (
                          <li
                            key={alert.alertId}
                            data-testid={`attention-alert-${alert.alertType}`}
                          >
                            <p>
                              {alert.title} · {alert.detail}
                            </p>
                            <p className={styles.attentionEmptyMessage}>
                              {alert.responseHint}
                            </p>
                            <div className={styles.attentionAlertActions}>
                              {alert.capabilities.includes("open_detail") ? (
                                <button
                                  type="button"
                                  className={styles.contextRetryButton}
                                  data-testid={`attention-open-detail-${alert.alertId}`}
                                  onClick={() => {
                                    if (
                                      alert.alertType ===
                                        "experience_support_requested" ||
                                      alert.alertType ===
                                        "screen_error_recurrent"
                                    ) {
                                      onOpenSupport?.();
                                    }
                                  }}
                                >
                                  Abrir soporte
                                </button>
                              ) : null}
                              {alert.capabilities.includes("view_trajectory") ? (
                                <button
                                  type="button"
                                  className={styles.contextRetryButton}
                                  data-testid={`attention-view-trajectory-${alert.alertId}`}
                                  onClick={() => onOpenTrajectory?.()}
                                >
                                  Ver trayectoria
                                </button>
                              ) : null}
                              {alert.capabilities.includes("governed_action") ? (
                                <button
                                  type="button"
                                  className={styles.contextRetryButton}
                                  data-testid={`attention-governed-action-${alert.alertId}`}
                                  onClick={() => onOpenSupport?.()}
                                >
                                  Acción gobernada
                                </button>
                              ) : null}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </AttentionSectionBody>
                  </section>
                </div>
              ) : (
                <div
                  className={styles.attentionEmptyState}
                  role="status"
                  data-testid="attention-empty-factual"
                >
                  {status === "active" && attentionComplete ? (
                    <p className={styles.attentionEmptyMessage}>
                      Sin alertas activas para el caso.
                    </p>
                  ) : status === "active" && !attentionComplete ? (
                    <p className={styles.attentionEmptyMessage}>
                      Parte de la información de atención no pudo evaluarse.
                    </p>
                  ) : (
                    <>
                      <p className={styles.attentionEmptyTitle}>
                        {copy.drawerTitle}
                      </p>
                      <p className={styles.attentionEmptyMessage}>
                        {copy.drawerMessage}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div
            className={styles.contextDrawerCollapsedRail}
            data-testid="attention-collapsed-rail"
          >
            <h2
              className={styles.railYTitle}
              id="attention-collapsed-heading"
              data-testid="attention-collapsed-label"
            >
              Atención y Gobernanza
            </h2>
            <button
              ref={openButtonRef}
              type="button"
              className={`${styles.contextDrawerToggle} ${styles.contextDrawerCollapsedToggle}`}
              data-testid="attention-open-drawer"
              aria-label="Abrir panel contextual"
              aria-expanded="false"
              aria-controls={panelId}
              suppressHydrationWarning
              onClick={openDrawer}
            >
              <span data-testid="attention-open-drawer-label" aria-hidden="true">
                Abrir panel contextual
              </span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

function AttentionSectionBody(props: {
  display: ReturnType<typeof resolveAttentionSectionDisplay>;
  onRetry?: () => void;
  emptyLabel: string;
  children: ReactNode;
}) {
  if (props.display === "unavailable") {
    return (
      <>
        <p className={styles.attentionEmptyMessage}>
          <span aria-hidden="true">!</span> No disponible
        </p>
        {props.onRetry ? <PanelPartialNotice onRetry={props.onRetry} /> : null}
      </>
    );
  }
  if (props.display === "dash") {
    return (
      <p className={styles.attentionEmptyMessage}>
        <span aria-hidden="true">!</span> —
      </p>
    );
  }
  if (props.display === "none") {
    return (
      <p className={styles.attentionEmptyMessage}>
        <span aria-hidden="true">!</span> {props.emptyLabel}
      </p>
    );
  }
  return <>{props.children}</>;
}

function ControlList(props: {
  title: string;
  testId: string;
  items: string[];
  emptyMode: "none" | "dash";
}) {
  return (
    <section className={styles.attentionControlGroup} data-testid={props.testId}>
      <h3 className={styles.attentionControlGroupTitle}>{props.title}</h3>
      {props.items.length === 0 ? (
        <p className={styles.attentionEmptyMessage}>
          <span aria-hidden="true">!</span>{" "}
          {props.emptyMode === "dash" ? "—" : "Ninguno"}
        </p>
      ) : (
        <ul className={styles.attentionControlList}>
          {props.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
