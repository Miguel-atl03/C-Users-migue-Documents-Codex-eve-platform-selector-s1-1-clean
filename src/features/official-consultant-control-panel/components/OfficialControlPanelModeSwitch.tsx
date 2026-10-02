import styles from "../styles/official-control-panel.module.css";
import type {
  ClientCompanyView,
  ExperienceGovernanceView,
  OfficialPanelMode,
} from "../types/official-control-panel.types";
import { WorkspaceSubnav } from "./WorkspaceSubnav";

type OfficialControlPanelModeSwitchProps = {
  mode: OfficialPanelMode;
  view: ClientCompanyView | ExperienceGovernanceView;
  onModeChange: (mode: OfficialPanelMode) => void;
  onViewChange: (view: ClientCompanyView) => void;
  onExperienceViewChange?: (view: ExperienceGovernanceView) => void;
};

export function OfficialControlPanelModeSwitch({
  mode,
  view,
  onModeChange,
  onViewChange,
}: OfficialControlPanelModeSwitchProps) {
  const experienceActive = mode === "user-experience-governance";
  const clientView: ClientCompanyView =
    view === "monitoring" || view === "tracking" || view === "governance"
      ? view
      : "monitoring";

  return (
    <div className={styles.modeBar}>
      <div className={styles.modeGroup}>
        <p className={styles.modeGroupLabel} id="official-mode-group-label">
          Modo
        </p>
        <div
          role="tablist"
          aria-labelledby="official-mode-group-label"
          aria-label="Modo superior del panel"
        >
          <button
            type="button"
            role="tab"
            className={styles.chipButton}
            aria-selected={mode === "client-company"}
            id="official-panel-mode-client-company"
            data-testid="mode-client-company"
            suppressHydrationWarning
            onClick={() => onModeChange("client-company")}
          >
            Empresa Cliente
          </button>{" "}
          <button
            type="button"
            role="tab"
            className={styles.chipButton}
            aria-selected={experienceActive}
            id="official-panel-mode-governance"
            data-testid="mode-experience-governance"
            suppressHydrationWarning
            onClick={() => onModeChange("user-experience-governance")}
          >
            Gobernanza de Experiencia
          </button>
        </div>
      </div>
      <div className={styles.modeBarDivider} aria-hidden="true" />
      {!experienceActive ? (
        <div className={styles.subviewGroup}>
          <p className={styles.modeGroupLabel} id="official-subview-group-label">
            Subvista
          </p>
          <WorkspaceSubnav view={clientView} onViewChange={onViewChange} />
        </div>
      ) : null}
    </div>
  );
}
