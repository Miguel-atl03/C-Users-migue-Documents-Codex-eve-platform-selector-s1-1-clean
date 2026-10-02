"use client";

import { useEffect, useRef } from "react";

import styles from "../styles/official-control-panel.module.css";
import type { ProcessStructureMilestoneView } from "../types/process-structure.types";
import type { ProcessStructureViewModel } from "../types/process-structure.types";
import { ProcessStructureState } from "./ProcessStructureState";

type CaseMilestonesRailProps = {
  processStructure: ProcessStructureViewModel;
  onSelectMilestone: (milestoneId: string | null) => void;
  onRetry?: () => void;
};

export function CaseMilestonesRail({
  processStructure,
  onSelectMilestone,
  onRetry,
}: CaseMilestonesRailProps) {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!processStructure.selectedMilestoneId || !listRef.current) return;
    const selected = listRef.current.querySelector<HTMLElement>(
      `[data-milestone-id="${processStructure.selectedMilestoneId}"]`,
    );
    selected?.focus();
  }, [processStructure.selectedMilestoneId]);

  return (
    <nav
      className={styles.railY}
      aria-labelledby="case-milestones-rail-heading"
    >
      <h2 className={styles.railYTitle} id="case-milestones-rail-heading">
        Hitos auxiliares del caso
      </h2>
      <p className={styles.milestoneContextNote} role="note">
        Hitos auxiliares del caso
      </p>

      {processStructure.status === "empty" ? (
        <p className={styles.milestoneContextNote} role="status">
          No hay hitos auxiliares registrados.
        </p>
      ) : null}

      {processStructure.status === "partial" &&
      processStructure.mainProcess &&
      processStructure.milestones.length === 0 ? (
        <p className={styles.milestoneContextNote} role="status">
          No hay hitos auxiliares registrados.
        </p>
      ) : null}

      {processStructure.status === "idle" ? (
        <p className={styles.milestoneContextNote} role="status">
          Seleccione un caso en curso para consultar hitos auxiliares.
        </p>
      ) : null}

      <ProcessStructureState
        processStructure={processStructure}
        onRetry={onRetry}
      />

      {processStructure.milestones.length > 0 ? (
        <ul className={styles.milestoneList} ref={listRef}>
          {processStructure.milestones.map((milestone) => (
            <CaseMilestoneItem
              key={milestone.id}
              milestone={milestone}
              selected={processStructure.selectedMilestoneId === milestone.id}
              onSelect={() => onSelectMilestone(milestone.id)}
            />
          ))}
        </ul>
      ) : null}

      {processStructure.mainProcess ? (
        <p className={styles.milestoneContextNote} role="status">
          Hito actual:{" "}
          {processStructure.currentMilestone
            ? processStructure.currentMilestone.label
            : "No disponible"}
        </p>
      ) : null}
    </nav>
  );
}

type CaseMilestoneItemProps = {
  milestone: ProcessStructureMilestoneView;
  selected: boolean;
  onSelect: () => void;
};

export function CaseMilestoneItem({
  milestone,
  selected,
  onSelect,
}: CaseMilestoneItemProps) {
  const className = [
    styles.milestoneItemButton,
    milestone.isCurrent ? styles.milestoneItemCurrent : "",
    milestone.status === "completed" ? styles.milestoneItemCompleted : "",
    selected ? styles.milestoneItemSelected : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <li>
      <button
        type="button"
        className={className}
        data-milestone-id={milestone.id}
        aria-current={selected ? "true" : undefined}
        aria-pressed={selected}
        onClick={onSelect}
      >
        <span
          className={
            milestone.isCurrent
              ? styles.milestoneIndicatorCurrent
              : styles.milestoneIndicator
          }
          aria-hidden="true"
        />
        <span className={styles.milestoneItemBody}>
          <span className={styles.milestoneItemLabel}>{milestone.label}</span>
          <span className={styles.milestoneItemMeta}>
            {milestone.statusLabel ?? "No disponible"}
            {milestone.isCurrent ? " · Hito actual" : ""}
          </span>
          {milestone.waitCompleteness === "incomplete" ? (
            <span className={styles.milestoneIncompleteBadge}>
              Espera incompleta
            </span>
          ) : null}
          {milestone.waitCompleteness === "complete" ? (
            <span className={styles.milestoneCompleteWaitBadge}>
              En espera (completa)
            </span>
          ) : null}
        </span>
      </button>
    </li>
  );
}
