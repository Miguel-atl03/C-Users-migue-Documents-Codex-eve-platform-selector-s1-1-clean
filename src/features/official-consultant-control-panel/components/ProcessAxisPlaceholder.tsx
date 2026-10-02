import {
  presentClientContextShellCopy,
  type ClientContextErrorKind,
} from "../presentation/client-context-shell-copy";
import styles from "../styles/official-control-panel.module.css";
import type { ClientContextStatus } from "../types/client-context.types";
import type { ClientCompanyView } from "../types/official-control-panel.types";

type ProcessAxisPlaceholderProps = {
  status: ClientContextStatus;
  view: ClientCompanyView;
  caseLabel?: string | null;
  errorKind?: ClientContextErrorKind | null;
};

export function ProcessAxisPlaceholder({
  status,
  view,
  caseLabel,
  errorKind,
}: ProcessAxisPlaceholderProps) {
  const copy = presentClientContextShellCopy({
    status,
    view,
    caseLabel,
    errorKind,
  });

  return (
    <section
      className={styles.processAxisRegion}
      aria-label="Proceso principal"
    >
      <p className={styles.processAxisEmpty}>{copy.processAxisLabel}</p>
    </section>
  );
}
