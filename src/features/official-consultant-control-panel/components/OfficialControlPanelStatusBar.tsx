import styles from "../styles/official-control-panel.module.css";
import type {
  ClientCompanyView,
  ExperienceGovernanceView,
  OfficialPanelMode,
  OfficialPanelShellState,
} from "../types/official-control-panel.types";

type OfficialControlPanelStatusBarProps = {
  mode: OfficialPanelMode;
  view: ClientCompanyView | ExperienceGovernanceView;
  shellState: OfficialPanelShellState;
};

export function OfficialControlPanelStatusBar({
  mode,
  view,
  shellState,
}: OfficialControlPanelStatusBarProps) {
  return (
    <footer className={styles.statusBar} role="contentinfo">
      <span className={styles.statusBarItem}>
        <strong>READ-ONLY</strong>
      </span>
      <span className={styles.statusBarItem}>
        <strong>effective_scope:</strong> unit-1-shell
      </span>
      <span className={styles.statusBarItem}>
        <strong>request_id:</strong> —
      </span>
      <span className={styles.statusBarItem}>
        <strong>freshness:</strong> —
      </span>
      <span className={styles.statusBarItem}>
        <strong>capabilities:</strong> —
      </span>
      <span className={styles.statusBarItem}>
        <strong>modo:</strong> {mode}
      </span>
      <span className={styles.statusBarItem}>
        <strong>vista:</strong> {view}
      </span>
      <span className={styles.statusBarItem}>
        <strong>shell:</strong> {shellState}
      </span>
      <span className={styles.statusBarItem}>
        <strong>última actualización:</strong> —
      </span>
    </footer>
  );
}
