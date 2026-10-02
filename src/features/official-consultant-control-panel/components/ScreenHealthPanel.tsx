"use client";

import styles from "../styles/official-control-panel.module.css";
import type { ExperienceScreenHealthView } from "@/services/eve/official-control-panel/official-control-panel-experience.types";

type ScreenHealthPanelProps = {
  screens: ExperienceScreenHealthView[];
  emptyMessage: string;
};

export function ScreenHealthPanel({
  screens,
  emptyMessage,
}: ScreenHealthPanelProps) {
  const hasActivity = screens.some(
    (s) =>
      s.enteredCount +
        s.completedCount +
        s.blockedCount +
        s.supportCount +
        s.abandonedCount +
        s.errorCount >
      0,
  );

  if (!hasActivity) {
    return (
      <p
        className={styles.workspaceEmptyMessage}
        role="status"
        data-testid="experience-health-empty"
      >
        {emptyMessage}
      </p>
    );
  }

  return (
    <div
      className={styles.experienceHealthGrid}
      data-testid="screen-health-panel"
    >
      {screens.map((screen) => (
        <article
          key={screen.screenKey}
          className={styles.experienceHealthCard}
          data-testid={`screen-health-${screen.screenKey}`}
        >
          <h4 className={styles.manualProcessCode}>
            {screen.screenLabel}
            {screen.visibility === "checkpoint" ? " · checkpoint" : ""}
          </h4>
          <dl className={styles.manualWorkFacts}>
            <div className={styles.manualWorkFact}>
              <dt>Entradas</dt>
              <dd>{screen.enteredCount}</dd>
            </div>
            <div className={styles.manualWorkFact}>
              <dt>Completadas</dt>
              <dd>{screen.completedCount}</dd>
            </div>
            <div className={styles.manualWorkFact}>
              <dt>Bloqueos</dt>
              <dd>{screen.blockedCount}</dd>
            </div>
            <div className={styles.manualWorkFact}>
              <dt>Soporte</dt>
              <dd>{screen.supportCount}</dd>
            </div>
            <div className={styles.manualWorkFact}>
              <dt>Abandonos</dt>
              <dd>{screen.abandonedCount}</dd>
            </div>
            <div className={styles.manualWorkFact}>
              <dt>Errores</dt>
              <dd>{screen.errorCount}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}
