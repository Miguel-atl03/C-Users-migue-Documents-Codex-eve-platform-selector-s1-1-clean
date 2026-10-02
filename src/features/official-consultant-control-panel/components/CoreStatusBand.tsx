import {
  presentClientContextShellCopy,
  type ClientContextErrorKind,
} from "../presentation/client-context-shell-copy";
import styles from "../styles/official-control-panel.module.css";
import type { ClientContextStatus } from "../types/client-context.types";
import type { ClientCompanyView } from "../types/official-control-panel.types";

type CoreStatusBandProps = {
  status: ClientContextStatus;
  view: ClientCompanyView;
  caseStatusLabel?: string | null;
  caseLabel?: string | null;
  errorKind?: ClientContextErrorKind | null;
};

export function CoreStatusBand({
  status,
  view,
  caseStatusLabel,
  caseLabel,
  errorKind,
}: CoreStatusBandProps) {
  const copy = presentClientContextShellCopy({
    status,
    view,
    caseStatusLabel,
    caseLabel,
    errorKind,
  });

  return (
    <section
      className={styles.coreBand}
      aria-labelledby="core-status-band-heading"
    >
      <h2 className={styles.srOnly} id="core-status-band-heading">
        Estado del contexto
      </h2>
      <span className={styles.coreBandBadge}>{copy.bandProcessLabel}</span>
      <span className={styles.coreBandChip}>
        <span className={styles.coreBandChipLabel}>Caso</span>
        <span className={styles.coreBandChipValue}>{copy.bandCaseLabel}</span>
      </span>
      <span className={styles.coreBandChip}>
        <span className={styles.coreBandChipLabel}>Estado</span>
        <span className={styles.coreBandChipValue}>{copy.bandCaseState}</span>
      </span>
      <span className={styles.coreBandChip}>
        <span className={styles.coreBandChipLabel}>Próximo evento</span>
        <span className={styles.coreBandChipValue}>{copy.bandNextEvent}</span>
      </span>
      <span className={styles.coreBandChip}>
        <span className={styles.coreBandChipLabel}>Timer</span>
        <span className={styles.coreBandChipValue}>{copy.bandTimer}</span>
      </span>
    </section>
  );
}
