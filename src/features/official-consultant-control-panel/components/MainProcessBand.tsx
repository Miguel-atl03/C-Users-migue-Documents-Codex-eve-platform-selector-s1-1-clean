"use client";

import {
  presentClientContextShellCopy,
  type ClientContextErrorKind,
} from "../presentation/client-context-shell-copy";
import {
  UNAVAILABLE_LABEL,
  labelOrUnavailable,
} from "../presentation/process-structure-presentation";
import styles from "../styles/official-control-panel.module.css";
import type { ClientContextStatus } from "../types/client-context.types";
import type { ClientCompanyView } from "../types/official-control-panel.types";
import type { ProcessStructureViewModel } from "../types/process-structure.types";

type MainProcessBandProps = {
  status: ClientContextStatus;
  view: ClientCompanyView;
  caseStatusLabel?: string | null;
  caseLabel?: string | null;
  errorKind?: ClientContextErrorKind | null;
  processStructure: ProcessStructureViewModel;
};

export function MainProcessBand({
  status,
  view,
  caseStatusLabel,
  caseLabel,
  errorKind,
  processStructure,
}: MainProcessBandProps) {
  const contextCopy = presentClientContextShellCopy({
    status,
    view,
    caseStatusLabel,
    caseLabel,
    errorKind,
  });

  const band = resolveBandCopy(contextCopy, processStructure);

  return (
    <section
      className={styles.coreBand}
      aria-labelledby="core-status-band-heading"
    >
      <h2 className={styles.srOnly} id="core-status-band-heading">
        Resumen auxiliar del caso
      </h2>
      <span className={styles.coreBandBadge}>{band.processLabel}</span>
      <span className={styles.coreBandChip}>
        <span className={styles.coreBandChipLabel}>Caso</span>
        <span className={styles.coreBandChipValue}>{band.caseLabel}</span>
      </span>
      <span className={styles.coreBandChip}>
        <span className={styles.coreBandChipLabel}>Estado</span>
        <span className={styles.coreBandChipValue}>{band.stateLabel}</span>
      </span>
      <span className={styles.coreBandChip}>
        <span className={styles.coreBandChipLabel}>Próximo evento</span>
        <span className={styles.coreBandChipValue}>{band.nextEvent}</span>
      </span>
      <span className={styles.coreBandChip}>
        <span className={styles.coreBandChipLabel}>Tiempo de espera</span>
        <span className={styles.coreBandChipValue}>{band.timer}</span>
      </span>
    </section>
  );
}

function resolveBandCopy(
  contextCopy: ReturnType<typeof presentClientContextShellCopy>,
  processStructure: ProcessStructureViewModel,
) {
  if (processStructure.status === "idle" || processStructure.status === "loading") {
    return {
      processLabel: contextCopy.bandProcessLabel,
      caseLabel: contextCopy.bandCaseLabel,
      stateLabel: contextCopy.bandCaseState,
      nextEvent: contextCopy.bandNextEvent,
      timer: contextCopy.bandTimer,
    };
  }

  if (processStructure.status === "error") {
    return {
      processLabel: "Resumen auxiliar del caso",
      caseLabel: labelOrUnavailable(processStructure.caseLabel),
      stateLabel: UNAVAILABLE_LABEL,
      nextEvent: UNAVAILABLE_LABEL,
      timer: UNAVAILABLE_LABEL,
    };
  }

  if (processStructure.status === "empty" || !processStructure.mainProcess) {
    return {
      processLabel: "Resumen auxiliar del caso",
      caseLabel: labelOrUnavailable(processStructure.caseLabel),
      stateLabel: UNAVAILABLE_LABEL,
      nextEvent: UNAVAILABLE_LABEL,
      timer: UNAVAILABLE_LABEL,
    };
  }

  const process = processStructure.mainProcess;
  return {
    processLabel: `Resumen auxiliar: ${process.label}`,
    caseLabel: labelOrUnavailable(processStructure.caseLabel),
    stateLabel: labelOrUnavailable(process.statusLabel),
    nextEvent: labelOrUnavailable(process.nextEventLabel),
    timer: labelOrUnavailable(process.timerLabel),
  };
}
