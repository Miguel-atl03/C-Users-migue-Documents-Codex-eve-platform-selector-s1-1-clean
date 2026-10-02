"use client";

import type { PMProcessCardModel, PMProcessCode, PMViewMode } from "./pm-process-catalog";
import { PMProcessCard } from "./PMProcessCard";
import { PMTransitionConnector } from "./PMTransitionConnector";
import { PMViewSwitcher } from "./PMViewSwitcher";
import {
  PM_DEPENDENCY_GROUPS,
  branchLabel,
  connectorKindLabel,
  evePmTransitions,
  executionBoundaryLabel,
  findTransitionBetween,
  getTransition,
  resolveTransitionRuntimeStatus,
  runtimeStatusLabel,
  syncPatternOrNa,
} from "./pm-transitions";
import styles from "./ccp-pm.module.css";

function byCode(processes: PMProcessCardModel[], code: PMProcessCode) {
  return processes.find((item) => item.code === code);
}

export function PMProcessMap({
  processes,
  selectedProcessCode,
  selectedTransitionId,
  selectedPMView,
  onSelectProcess,
  onSelectTransition,
  onChangeView,
}: {
  processes: PMProcessCardModel[];
  selectedProcessCode: PMProcessCode | null;
  selectedTransitionId: string | null;
  selectedPMView: PMViewMode;
  onSelectProcess: (code: PMProcessCode) => void;
  onSelectTransition: (id: string) => void;
  onChangeView: (view: PMViewMode) => void;
}) {
  const governing = processes.find((item) => item.isGoverning);
  const flow = processes.filter((item) => !item.isGoverning);

  return (
    <section className={styles.pmBoard} data-testid="ccp-pm-process-map">
      <div className={styles.pmBoardHead}>
        <div className={styles.pmBoardTitleBlock}>
          <h2 className={styles.pmBoardTitle}>MAPA DE PROCESOS EVE (PM)</h2>
          <p className={styles.pmBoardSubtitle}>
            Monitoreo de sincronizaciones, transiciones y milestones de soporte.
          </p>
        </div>
        <PMViewSwitcher value={selectedPMView} onChange={onChangeView} />
      </div>

      {governing ? (
        <button
          type="button"
          className={
            selectedProcessCode === governing.code && !selectedTransitionId
              ? styles.governingBarSelected
              : styles.governingBar
          }
          data-testid="ccp-pm-governing"
          onClick={() => onSelectProcess(governing.code)}
        >
          <span className={styles.governingMark} aria-hidden>
            ★
          </span>
          <span className={styles.governingText}>
            <strong>{governing.code}</strong> — {governing.name}
          </span>
          <span className={styles.governingBadge}>
            <span className={styles.governingDot} aria-hidden />
            Gobernante
          </span>
        </button>
      ) : null}

      {selectedPMView === "mapa" ? (
        <div className={styles.processFlow} role="list" data-layout="horizontal-cards">
          {flow.map((process, index) => {
            const next = flow[index + 1];
            const transition = next
              ? findTransitionBetween(process.code, next.code)
              : undefined;
            const runtimeStatus = transition
              ? resolveTransitionRuntimeStatus(transition, {
                  sourceOperationalState: process.currentOperationalState,
                  targetOperationalState: next
                    ? byCode(processes, next.code)?.currentOperationalState
                    : null,
                  inventoryState: byCode(processes, "P-SUP-06")?.currentOperationalState,
                  acaState: byCode(processes, "P-SUP-07/08")?.currentOperationalState,
                })
              : "not_applicable";

            return (
              <div key={process.code} className={styles.processFlowItem} role="listitem">
                <PMProcessCard
                  process={process}
                  selected={
                    selectedProcessCode === process.code && !selectedTransitionId
                  }
                  onSelect={onSelectProcess}
                />
                {transition ? (
                  <PMTransitionConnector
                    transition={transition}
                    selected={selectedTransitionId === transition.transitionId}
                    runtimeStatus={runtimeStatus}
                    onSelect={onSelectTransition}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {selectedPMView === "tabla" ? (
        <div className={styles.tableWrap}>
          <table className={styles.tableDense} data-testid="ccp-pm-table">
            <thead>
              <tr>
                <th>ID relación</th>
                <th>Origen visual</th>
                <th>Destino visual</th>
                <th>Tipo de conector</th>
                <th>Patrón PM</th>
                <th>Object[State] origen</th>
                <th>Evento emitido</th>
                <th>Trigger receptor</th>
                <th>Dependencia directa</th>
                <th>Feedback esperado</th>
                <th>Rama</th>
                <th>Alcance operativo</th>
                <th>Estado runtime</th>
              </tr>
            </thead>
            <tbody>
              {evePmTransitions.map((transition) => {
                const source = byCode(processes, transition.visualSourceProcessId);
                const target = byCode(processes, transition.visualTargetProcessId);
                const runtime = resolveTransitionRuntimeStatus(transition, {
                  sourceOperationalState: source?.currentOperationalState,
                  targetOperationalState: target?.currentOperationalState,
                  inventoryState: byCode(processes, "P-SUP-06")?.currentOperationalState,
                  acaState: byCode(processes, "P-SUP-07/08")?.currentOperationalState,
                });
                return (
                  <tr
                    key={transition.transitionId}
                    className={
                      selectedTransitionId === transition.transitionId
                        ? styles.rowSelected
                        : undefined
                    }
                    onClick={() => onSelectTransition(transition.transitionId)}
                    style={{ cursor: "pointer" }}
                    data-transition-id={transition.transitionId}
                  >
                    <td>{transition.transitionId}</td>
                    <td>{transition.visualSourceProcessId}</td>
                    <td>{transition.visualTargetProcessId}</td>
                    <td>{connectorKindLabel(transition.connectorKind)}</td>
                    <td>{syncPatternOrNa(transition.syncPattern)}</td>
                    <td>
                      {transition.sourceObjectState ??
                        transition.actualSourceObjectState ??
                        "—"}
                    </td>
                    <td>{transition.emittedEvent ?? transition.actualEmittedEvent ?? "—"}</td>
                    <td>
                      {transition.targetTrigger ?? transition.actualTargetTrigger ?? "—"}
                    </td>
                    <td>{transition.directDependency ? "Sí" : "No"}</td>
                    <td>
                      {transition.awaitedFeedback?.join(" · ") ??
                        (transition.sourceWaitsForTarget ? "Sí" : "—")}
                    </td>
                    <td>
                      {transition.branch
                        ? branchLabel(transition.branch)
                        : transition.branchEntering
                          ? `${branchLabel(transition.branchLeaving)} → ${branchLabel(transition.branchEntering)}`
                          : "—"}
                    </td>
                    <td>
                      {executionBoundaryLabel(transition.executionBoundary) !== "—"
                        ? executionBoundaryLabel(transition.executionBoundary)
                        : connectorKindLabel(transition.connectorKind)}
                    </td>
                    <td>{runtimeStatusLabel(runtime)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {selectedPMView === "dependencias" ? (
        <div className={styles.dependencyGroups} data-testid="ccp-pm-dependencies">
          {PM_DEPENDENCY_GROUPS.map((group) => (
            <div key={group.id} className={styles.dependencyGroup}>
              <h3 className={styles.dependencyGroupTitle}>{group.title}</h3>
              <p className={styles.dependencyChainSummary}>{group.summary}</p>
              {"note" in group && group.note ? (
                <p className={styles.dependencyNote}>{group.note}</p>
              ) : null}
              <ul className={styles.dependencyList}>
                {group.transitionIds.map((id) => {
                  const transition = getTransition(id);
                  if (!transition) return null;
                  if ("focus" in group && group.focus === "rework" && transition.rework) {
                    return (
                      <li key={`${id}-rework`}>
                        <button
                          type="button"
                          className={
                            selectedTransitionId === id
                              ? styles.dependencyItemActive
                              : styles.dependencyItem
                          }
                          onClick={() => onSelectTransition(id)}
                        >
                          <strong>
                            {transition.rework.sourceProcessId} →{" "}
                            {transition.rework.targetProcessId}
                          </strong>
                          <span>Rework · {transition.rework.event}</span>
                          <span>{transition.rework.sourceState}</span>
                        </button>
                      </li>
                    );
                  }
                  if (transition.connectorKind === "client_boundary") {
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          className={
                            selectedTransitionId === id
                              ? styles.dependencyItemActive
                              : styles.dependencyItem
                          }
                          onClick={() => onSelectTransition(id)}
                        >
                          <strong>P-CLIENT-01 ↔ P-CORE-01</strong>
                          <span>Frontera cliente · sin dependencia con P-SUP-09</span>
                          <span>
                            {transition.clientRelations
                              ?.map((rel) => `${rel.relation}: ${rel.event}`)
                              .join(" · ")}
                          </span>
                        </button>
                      </li>
                    );
                  }
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        className={
                          selectedTransitionId === id
                            ? styles.dependencyItemActive
                            : styles.dependencyItem
                        }
                        onClick={() => onSelectTransition(id)}
                      >
                        <strong>
                          {transition.visualSourceProcessId} →{" "}
                          {transition.visualTargetProcessId}
                        </strong>
                        <span>
                          {syncPatternOrNa(transition.syncPattern)} ·{" "}
                          {connectorKindLabel(transition.connectorKind)}
                        </span>
                        <span>
                          {(transition.sourceObjectState ?? "—") +
                            ` · ${transition.emittedEvent ?? "—"}`}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
