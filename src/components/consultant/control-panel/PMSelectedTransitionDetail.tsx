"use client";

import { useState } from "react";
import type { PMProcessCardModel } from "./pm-process-catalog";
import {
  branchLabel,
  connectorKindLabel,
  executionBoundaryLabel,
  getTransition,
  resolveTransitionRuntimeStatus,
  runtimeStatusLabel,
  syncPatternOrNa,
  type PMTransitionModel,
} from "./pm-transitions";
import styles from "./ccp-pm.module.css";

function Cell({
  label,
  value,
  sub,
  wide,
}: {
  label: string;
  value: string;
  sub?: string | null;
  wide?: boolean;
}) {
  return (
    <div className={wide ? `${styles.detailCell} ${styles.detailCellWide}` : styles.detailCell}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue}>{value}</span>
      {sub ? <span className={styles.detailSub}>{sub}</span> : null}
    </div>
  );
}

function processName(processes: PMProcessCardModel[], code: string): string {
  return processes.find((item) => item.code === code)?.name ?? code;
}

function scopeOf(processes: PMProcessCardModel[], code: string): string {
  return processes.find((item) => item.code === code)?.scopeLabel ?? "—";
}

function TransitionDetailBody({
  transition,
  processes,
  manualActionsEnabled,
}: {
  transition: PMTransitionModel;
  processes: PMProcessCardModel[];
  manualActionsEnabled: boolean;
}) {
  const source = processes.find((item) => item.code === transition.visualSourceProcessId);
  const target = processes.find((item) => item.code === transition.visualTargetProcessId);
  const runtime = resolveTransitionRuntimeStatus(transition, {
    sourceOperationalState: source?.currentOperationalState,
    targetOperationalState: target?.currentOperationalState,
    inventoryState: processes.find((item) => item.code === "P-SUP-06")?.currentOperationalState,
    acaState: processes.find((item) => item.code === "P-SUP-07/08")?.currentOperationalState,
  });

  if (transition.connectorKind === "branch_boundary") {
    return (
      <div className={styles.transitionBody} data-detail-kind="branch_boundary">
        <div className={styles.transitionBadges}>
          <span className={styles.patternBadge}>Cambio de rama</span>
          <span className={styles.patternBadgeMuted}>Sin dependencia directa</span>
        </div>
        <p className={styles.transitionMuted}>
          Relación visual: {transition.visualSourceProcessId} · {transition.visualTargetProcessId}
        </p>
        <div className={styles.transitionGrid}>
          <Cell
            label="Tipo"
            value="Cambio de rama"
            sub={`${branchLabel(transition.branchLeaving)} → ${branchLabel(transition.branchEntering)}`}
          />
          <Cell label="Dependencia directa" value="No" />
          <Cell
            label="Origen causal real"
            value={transition.actualSourceObjectState ?? "—"}
          />
          <Cell label="Evento real" value={transition.actualEmittedEvent ?? "—"} />
          <Cell
            label="Destino real"
            value={transition.actualTargetProcessId ?? "P-SUP-06"}
            sub={processName(processes, transition.actualTargetProcessId ?? "P-SUP-06")}
          />
          <Cell label="Trigger real" value={transition.actualTargetTrigger ?? "—"} />
          <Cell
            label="Advertencia"
            value={
              transition.explanation ??
              "P-SUP-06 no depende de DiagnosticoExpertoFinal [Delivered]."
            }
            wide
          />
          <Cell label="Estado runtime" value={runtimeStatusLabel(runtime)} />
        </div>
        <ActionRow
          actions={transition.actions ?? []}
          manualActionsEnabled={manualActionsEnabled}
        />
      </div>
    );
  }

  if (transition.connectorKind === "client_boundary") {
    return (
      <div className={styles.transitionBody} data-detail-kind="client_boundary">
        <div className={styles.transitionBadges}>
          <span className={styles.patternBadge}>Frontera cliente</span>
        </div>
        <p className={styles.transitionMuted}>
          Relación visual: {transition.visualSourceProcessId} ·{" "}
          {transition.visualTargetProcessId} · relación real con{" "}
          {transition.actualRelatedProcessId}
        </p>
        <div className={styles.transitionGrid}>
          <Cell label="Tipo" value="Frontera cliente" sub="Dependencia directa: No" />
          <Cell label="Relación real" value="P-CLIENT-01 ↔ P-CORE-01" />
          {(transition.clientRelations ?? []).map((rel) => (
            <Cell
              key={rel.relation}
              label={rel.relation === "case_start" ? "Inicio de caso" : "Cierre de caso"}
              value={`${rel.sourceState} → ${rel.event} → ${rel.targetProcessId}`}
              sub={`Patrón: ${syncPatternOrNa(rel.pattern)}`}
              wide
            />
          ))}
          <Cell
            label="Advertencia"
            value={
              transition.explanation ??
              "ExportCodePackage [Generated] no cierra el caso ni el engagement."
            }
            wide
          />
        </div>
        <ActionRow
          actions={transition.actions ?? []}
          manualActionsEnabled={manualActionsEnabled}
        />
      </div>
    );
  }

  const dependencyText = transition.sourceWaitsForTarget
    ? `Espera: ${(transition.awaitedFeedback ?? []).join(" / ") || "resultado del destino"}`
    : "El origen no espera el cierre del destino.";

  return (
    <div className={styles.transitionBody} data-detail-kind="synchronization">
      <div className={styles.transitionBadges}>
        <span className={styles.patternBadge}>{syncPatternOrNa(transition.syncPattern)}</span>
        {transition.secondaryBadge ? (
          <span className={styles.patternBadgeMuted}>{transition.secondaryBadge}</span>
        ) : null}
      </div>
      <p className={styles.transitionMuted}>
        {connectorKindLabel(transition.connectorKind)} · {branchLabel(transition.branch)} ·{" "}
        {runtimeStatusLabel(runtime)}
      </p>
      <div className={styles.transitionGrid}>
        <Cell
          label="Origen"
          value={transition.visualSourceProcessId}
          sub={`${processName(processes, transition.visualSourceProcessId)} · ${scopeOf(processes, transition.visualSourceProcessId)}`}
        />
        <Cell label="Milestone Object[State]" value={transition.sourceObjectState ?? "—"} />
        <Cell label="Evento emitido" value={transition.emittedEvent ?? "—"} />
        <Cell
          label="Patrón / tipo"
          value={syncPatternOrNa(transition.syncPattern)}
          sub={connectorKindLabel(transition.connectorKind)}
        />
        <Cell
          label="Destino"
          value={transition.visualTargetProcessId}
          sub={`${processName(processes, transition.visualTargetProcessId)} · ${scopeOf(processes, transition.visualTargetProcessId)}`}
        />
        <Cell label="Trigger receptor" value={transition.targetTrigger ?? "—"} />
        <Cell
          label="Dependencia y feedback"
          value={dependencyText}
          sub={
            transition.directDependency
              ? "Dependencia directa: Sí"
              : "Dependencia directa: No"
          }
        />
        <Cell
          label="Alcance operativo"
          value={executionBoundaryLabel(transition.executionBoundary)}
          sub={
            transition.manualPackageLabel
              ? `Modo destino: ${transition.manualPackageLabel}`
              : transition.targetExecutionMode ?? null
          }
        />
        <Cell
          label="Espera / timer"
          value={
            transition.timerPolicyHint ??
            (transition.sourceWaitsForTarget
              ? "Espera activa del origen"
              : "Sin espera del origen")
          }
        />
        <Cell
          label="Bloqueo actual"
          value={
            transition.guard
              ? `Guard: ${transition.guard.field} ${transition.guard.operator} ${transition.guard.expectedValue}`
              : runtimeStatusLabel(runtime)
          }
        />
        {transition.rework?.enabled ? (
          <Cell
            label="Retorno / rework"
            value={`${transition.rework.sourceState} → ${transition.rework.event} → ${transition.rework.targetProcessId}`}
            wide
          />
        ) : null}
        {transition.explanation ? (
          <Cell label="Nota" value={transition.explanation} wide />
        ) : null}
      </div>
      <ActionRow
        actions={transition.actions ?? []}
        manualActionsEnabled={manualActionsEnabled}
      />
    </div>
  );
}

function ActionRow({
  actions,
  manualActionsEnabled,
}: {
  actions: Array<{ id: string; label: string }>;
  manualActionsEnabled: boolean;
}) {
  return (
    <div className={styles.transitionActionBar}>
      <span className={styles.detailLabel}>Acciones gobernadas</span>
      <div className={styles.transitionActions}>
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            className={styles.actionOutline}
            disabled
            title="AUDITED_ENDPOINT_NOT_AVAILABLE"
          >
            {action.label}
          </button>
        ))}
        <button type="button" className={styles.actionGhost} disabled>
          Ver historial / trazabilidad
        </button>
      </div>
      <span className={styles.pillDisabled}>
        {manualActionsEnabled
          ? "manual_actions=true · acciones con audit trail requerido"
          : "manual_actions=false · AUDITED_ENDPOINT_NOT_AVAILABLE"}
      </span>
    </div>
  );
}

function collapseSummary(
  transition: PMTransitionModel | undefined,
  selectedProcess: PMProcessCardModel | null,
): string {
  if (transition) {
    if (transition.connectorKind === "branch_boundary") {
      return `${transition.detailTitle ?? "T05 · Cambio de rama"} · sin dependencia directa`;
    }
    if (transition.connectorKind === "client_boundary") {
      return `${transition.detailTitle ?? "T08 · Frontera cliente"} · P-CLIENT-01 ↔ P-CORE-01`;
    }
    return [
      transition.detailTitle ??
        `${transition.transitionId} · ${transition.visualSourceProcessId} → ${transition.visualTargetProcessId}`,
      syncPatternOrNa(transition.syncPattern),
      transition.secondaryBadge,
    ]
      .filter(Boolean)
      .join(" · ");
  }
  if (selectedProcess) {
    return `Proceso ${selectedProcess.code} · elige un conector para ver causalidad`;
  }
  return "Selecciona un conector en el mapa";
}

export function PMSelectedTransitionDetail({
  processes,
  selectedTransitionId,
  selectedProcess,
  manualActionsEnabled,
}: {
  processes: PMProcessCardModel[];
  selectedTransitionId: string | null;
  selectedProcess: PMProcessCardModel | null;
  manualActionsEnabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const transition = selectedTransitionId
    ? getTransition(selectedTransitionId)
    : undefined;

  const titlePrefix =
    transition && transition.connectorKind !== "synchronization"
      ? "Detalle de la relación seleccionada"
      : "Detalle de la transición seleccionada";
  const summary = collapseSummary(transition, selectedProcess);

  return (
    <section
      className={
        open ? styles.transitionDetail : `${styles.transitionDetail} ${styles.transitionDetailCollapsed}`
      }
      data-testid="ccp-pm-transition-detail"
      data-collapsed={open ? "false" : "true"}
      data-transition-id={transition?.transitionId}
      data-empty={transition ? undefined : selectedProcess ? "process-only" : "true"}
    >
      <button
        type="button"
        className={styles.transitionCollapseToggle}
        aria-expanded={open}
        aria-controls="ccp-pm-transition-detail-body"
        onClick={() => setOpen((value) => !value)}
      >
        <div className={styles.transitionCollapseText}>
          <span className={styles.transitionTitle}>{titlePrefix}</span>
          <span className={styles.transitionCollapsedSummary}>{summary}</span>
        </div>
        <span className={styles.transitionCollapseChevron} aria-hidden>
          {open ? "▾" : "▸"}
        </span>
      </button>

      {open ? (
        <div id="ccp-pm-transition-detail-body" className={styles.transitionExpandArea}>
          {transition ? (
            <TransitionDetailBody
              transition={transition}
              processes={processes}
              manualActionsEnabled={manualActionsEnabled}
            />
          ) : (
            <p className={styles.transitionMuted}>
              {selectedProcess
                ? `Proceso ${selectedProcess.code} seleccionado. Elige un conector entre cards para ver causalidad, feedback, rework o frontera.`
                : "Selecciona un conector en el mapa para ver el detalle."}
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
