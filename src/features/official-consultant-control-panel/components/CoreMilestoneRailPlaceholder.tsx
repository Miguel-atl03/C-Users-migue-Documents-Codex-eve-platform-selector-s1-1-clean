import {
  presentClientContextShellCopy,
  type ClientContextErrorKind,
} from "../presentation/client-context-shell-copy";
import styles from "../styles/official-control-panel.module.css";
import type { ClientContextStatus } from "../types/client-context.types";
import type { ClientCompanyView } from "../types/official-control-panel.types";

type CoreMilestoneRailPlaceholderProps = {
  status: ClientContextStatus;
  view: ClientCompanyView;
  caseLabel?: string | null;
  errorKind?: ClientContextErrorKind | null;
};

export function CoreMilestoneRailPlaceholder({
  status,
  view,
  caseLabel,
  errorKind,
}: CoreMilestoneRailPlaceholderProps) {
  const copy = presentClientContextShellCopy({
    status,
    view,
    caseLabel,
    errorKind,
  });

  return (
    <aside
      className={styles.railY}
      aria-labelledby="core-milestone-rail-heading"
    >
      <h2 className={styles.railYTitle} id="core-milestone-rail-heading">
        {copy.railTitle}
      </h2>
      <p className={styles.milestoneContextNote}>{copy.railNote}</p>
    </aside>
  );
}
