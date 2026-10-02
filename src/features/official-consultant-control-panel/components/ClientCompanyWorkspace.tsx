import {
  presentClientContextShellCopy,
  type ClientContextErrorKind,
} from "../presentation/client-context-shell-copy";
import styles from "../styles/official-control-panel.module.css";
import type { ClientContextStatus } from "../types/client-context.types";
import type { ClientCompanyView } from "../types/official-control-panel.types";
import { CLIENT_COMPANY_VIEW_COPY } from "../types/official-control-panel.types";

type ClientCompanyWorkspaceProps = {
  view: ClientCompanyView;
  status: ClientContextStatus;
  caseLabel?: string | null;
  errorKind?: ClientContextErrorKind | null;
};

export function ClientCompanyWorkspace({
  view,
  status,
  caseLabel,
  errorKind,
}: ClientCompanyWorkspaceProps) {
  const viewCopy = CLIENT_COMPANY_VIEW_COPY[view];
  const copy = presentClientContextShellCopy({
    status,
    view,
    caseLabel,
    errorKind,
  });

  return (
    <section
      className={styles.workspace}
      aria-labelledby="client-company-workspace-heading"
    >
      <h2 className={styles.workspaceTitle} id="client-company-workspace-heading">
        {viewCopy.title}
      </h2>
      <div
        role="tabpanel"
        id={`official-panel-panel-${view}`}
        aria-labelledby={`official-panel-view-${view}`}
      >
        <div className={styles.workspaceEmptyState} role="status">
          <p className={styles.workspaceEmptyTitle}>{copy.workspaceTitle}</p>
          <p className={styles.workspaceEmptyMessage}>{copy.workspaceMessage}</p>
        </div>
      </div>
    </section>
  );
}
