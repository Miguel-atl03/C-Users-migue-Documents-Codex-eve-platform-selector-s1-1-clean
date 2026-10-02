"use client";

import { useState } from "react";
import type {
  ConsultantControlPanelState,
  ControlPanelSelectedContext,
} from "@/services/eve/consultant-control-panel/consultant-control-panel-types";
import {
  RunContextHeader,
  selectedContextToHeaderProps,
} from "./RunContextHeader";
import { Runtime40BaseGrid, Runtime20CausalGrid } from "./Runtime40BaseGrid";
import { OperationalTraceTimeline } from "./OperationalTraceTimeline";
import styles from "./ccp.module.css";

type DetailTab = "base40" | "causal20" | "gates" | "evidence";

const TABS: Array<{ id: DetailTab; label: string }> = [
  { id: "base40", label: "Preguntas base" },
  { id: "causal20", label: "Preguntas causales" },
  { id: "gates", label: "Reglas de avance / pendientes" },
  { id: "evidence", label: "Evidencia / trazabilidad" },
];

function statusClass(status: string): string {
  const value = status.toLowerCase();
  if (value.includes("blocked") || value.includes("fail")) return styles.pillError;
  if (value.includes("reentry")) return styles.pillReentry;
  if (value.includes("review")) return styles.pillReview;
  if (value.includes("flag") || value.includes("pending")) return styles.pillWarn;
  if (value.includes("ready") || value.includes("pass")) return styles.pillSuccess;
  return styles.pillNeutral;
}

export function RuntimeSelectedRunPanel({
  state,
  selectedRunContext,
  onOpenEvidence,
}: {
  state: ConsultantControlPanelState;
  selectedRunContext: ControlPanelSelectedContext;
  onOpenEvidence: (payload: { title: string; body: string }) => void;
}) {
  const [tab, setTab] = useState<DetailTab>("base40");
  const runId =
    selectedRunContext.runId ?? state.meta.effective_scope.run_id ?? null;

  if (!runId) {
    return (
      <aside
        className={styles.runtimeSelectedPanel}
        data-testid="ccp-runtime-selected-run-panel"
        data-empty="true"
      >
        <div className={styles.panelHead}>
          <div>
            <h3 className={styles.panelTitle}>Detalle del run</h3>
            <p className={styles.muted}>
              Selecciona una actividad primaria en el alcance operativo para ver preguntas
              base, causales, pendientes y evidencia.
            </p>
          </div>
        </div>
      </aside>
    );
  }

  const gates =
    state.gates.length > 0
      ? state.gates
      : state.area_3_operational_trace.gate_summaries;
  const openGaps =
    state.area_3_operational_trace.readiness?.flags ??
    state.critical_alerts
      .filter((alert) => alert.affected_scope?.run_id === runId || !alert.affected_scope?.run_id)
      .map((alert) => alert.title);
  const reentryTarget =
    state.critical_alerts.find((alert) => alert.reentry_target)?.reentry_target ??
    null;
  const selectedRun =
    state.runs.find((run) => run.activityRuntimeRunId === runId) ??
    state.area_3_operational_trace.runtimeBudget4020.runtimeBudgetByRun.find(
      (run) => run.activityRuntimeRunId === runId,
    );

  return (
    <aside
      className={styles.runtimeSelectedPanel}
      data-testid="ccp-runtime-selected-run-panel"
      data-run-id={runId}
    >
      <RunContextHeader {...selectedContextToHeaderProps(selectedRunContext)} />

      <div className={styles.runtimeRunSummary}>
        <div>
          <span className={styles.runtimeFilterLabel}>
            Resumen del run
            {selectedRunContext.activityCode
              ? ` ${selectedRunContext.activityCode}`
              : selectedRunContext.activityTitle
                ? ` ${selectedRunContext.activityTitle}`
                : ""}
            {selectedRunContext.roleLabel
              ? ` · ${selectedRunContext.roleLabel}`
              : ""}
          </span>
          <strong>{selectedRunContext.activityTitle ?? runId}</strong>
        </div>
        <div className={styles.runtimeRunSummaryMetrics}>
          <span>
            Base {selectedRun ? `${selectedRun.baseUsed}/${selectedRun.baseLimit}` : "—"}
          </span>
          <span>
            Causales{" "}
            {selectedRun
              ? `${selectedRun.causalUsed}/${selectedRun.causalLimit}`
              : "—"}
          </span>
          <span className={statusClass(selectedRunContext.runStateLabel ?? selectedRunContext.runState ?? "")}>
            {selectedRunContext.runStateLabel ?? selectedRunContext.runState ?? "—"}
          </span>
        </div>
      </div>

      <div className={styles.runtimeDetailTabs} role="tablist" aria-label="Detalle del run">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={
              tab === item.id
                ? styles.runtimeDetailTabActive
                : styles.runtimeDetailTab
            }
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className={styles.runtimeDetailTabBody} role="tabpanel">
        {tab === "base40" ? (
          <Runtime40BaseGrid
            state={state}
            selectedRunContext={selectedRunContext}
            onOpenDetail={onOpenEvidence}
            embedInSelectedPanel
          />
        ) : null}

        {tab === "causal20" ? (
          <Runtime20CausalGrid
            state={state}
            selectedRunContext={selectedRunContext}
            onOpenDetail={onOpenEvidence}
            allowDetail
            embedInSelectedPanel
          />
        ) : null}

        {tab === "gates" ? (
          <div data-testid="ccp-runtime-run-gates">
            <h4 className={styles.subTitle}>Reglas de avance del run</h4>
            {gates.length === 0 ? (
              <p className={styles.muted}>Sin reglas de avance asociadas al run.</p>
            ) : (
              <ul className={styles.flagList}>
                {gates.map((gate) => (
                  <li key={gate.gate_code}>
                    <strong>{gate.gate_code}</strong>{" "}
                    <span className={statusClass(gate.status)}>{gate.status}</span>
                    {gate.reason ? ` · ${gate.reason}` : ""}
                  </li>
                ))}
              </ul>
            )}

            <h4 className={styles.subTitle}>Pendientes / gaps abiertos</h4>
            {openGaps.length === 0 ? (
              <p className={styles.muted}>Sin pendientes abiertos para este run.</p>
            ) : (
              <ul className={styles.flagList}>
                {openGaps.map((gap) => (
                  <li key={gap}>{gap}</li>
                ))}
              </ul>
            )}

            {reentryTarget ? (
              <p className={styles.panelCopy}>
                Reentrada sugerida: <code>{reentryTarget}</code>
              </p>
            ) : null}
          </div>
        ) : null}

        {tab === "evidence" ? (
          <div data-testid="ccp-runtime-run-evidence">
            <p className={styles.muted}>
              Evidencia y trazabilidad filtradas al run seleccionado. Usa “Detalle” en
              preguntas base/causales para abrir el drawer de evidencia.
            </p>
            <button
              type="button"
              className={styles.btnGhost}
              onClick={() =>
                onOpenEvidence({
                  title: `Evidencia · ${runId}`,
                  body: [
                    `run_id: ${runId}`,
                    `activity_runtime_run: ${runId}`,
                    `user_id: ${selectedRunContext.physicalUserId ?? "—"}`,
                    `role_runtime_session_id: ${selectedRunContext.roleRuntimeSessionId ?? "—"}`,
                    `activity_id: ${selectedRunContext.activityId ?? "—"}`,
                    `estado: ${selectedRunContext.runStateLabel ?? selectedRunContext.runState ?? "—"}`,
                    `BaseResolutionStatus items: ${state.base_items?.length ?? 0}`,
                    `CausalClosureStatus items: ${state.causal_items?.length ?? 0}`,
                  ].join("\n"),
                })
              }
            >
              Abrir EvidenceDetailDrawer
            </button>
            <OperationalTraceTimeline state={state} filterRunId={runId} compact />
          </div>
        ) : null}
      </div>
    </aside>
  );
}
