import styles from "../styles/official-control-panel.module.css";
import type { ClientCompanyView } from "../types/official-control-panel.types";
import { CLIENT_COMPANY_VIEW_COPY } from "../types/official-control-panel.types";

type WorkspaceSubnavProps = {
  view: ClientCompanyView;
  onViewChange: (view: ClientCompanyView) => void;
};

export function WorkspaceSubnav({ view, onViewChange }: WorkspaceSubnavProps) {
  const views: ClientCompanyView[] = ["monitoring", "tracking", "governance"];

  return (
    <div
      role="tablist"
      aria-label="Subvistas de Empresa Cliente"
    >
      {views.map((item) => (
        <button
          key={item}
          type="button"
          role="tab"
          id={`official-panel-view-${item}`}
          className={styles.chipButton}
          aria-selected={view === item}
          aria-controls={`official-panel-panel-${item}`}
          suppressHydrationWarning
          onClick={() => onViewChange(item)}
        >
          {CLIENT_COMPANY_VIEW_COPY[item].label}
        </button>
      ))}
    </div>
  );
}
