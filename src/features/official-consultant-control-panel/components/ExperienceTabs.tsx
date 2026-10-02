"use client";

import styles from "../styles/official-control-panel.module.css";
import type { ExperienceGovernanceView } from "../types/official-control-panel.types";
import { EXPERIENCE_GOVERNANCE_VIEW_COPY } from "../types/official-control-panel.types";

type ExperienceTabsProps = {
  view: ExperienceGovernanceView;
  onViewChange: (view: ExperienceGovernanceView) => void;
};

export function ExperienceTabs({ view, onViewChange }: ExperienceTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Subvistas de gobernanza de experiencia"
      className={styles.experienceTabs}
      data-testid="experience-tabs"
    >
      {(
        Object.keys(EXPERIENCE_GOVERNANCE_VIEW_COPY) as ExperienceGovernanceView[]
      ).map((key) => (
        <button
          key={key}
          type="button"
          role="tab"
          id={`experience-view-${key}`}
          className={styles.chipButton}
          aria-selected={view === key}
          data-testid={`experience-tab-${key}`}
          suppressHydrationWarning
          onClick={() => onViewChange(key)}
        >
          {EXPERIENCE_GOVERNANCE_VIEW_COPY[key].label}
        </button>
      ))}
    </div>
  );
}
