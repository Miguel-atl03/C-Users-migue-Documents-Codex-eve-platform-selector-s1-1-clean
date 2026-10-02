"use client";

import styles from "../styles/official-control-panel.module.css";
import type { ProcessStructureViewModel } from "../types/process-structure.types";

type MainProcessAxisProps = {
  processStructure: ProcessStructureViewModel;
};

/**
 * Secondary line under the status band for the operative process name
 * or factual unavailability. Auxiliary — not rector §7 Eje X.
 */
export function MainProcessAxis({ processStructure }: MainProcessAxisProps) {
  let label = "Resumen auxiliar del caso";

  if (processStructure.status === "loading") {
    label = "Cargando resumen auxiliar del caso…";
  } else if (processStructure.status === "error") {
    label = "Resumen auxiliar del caso no disponible";
  } else if (
    processStructure.status === "empty" ||
    !processStructure.mainProcess
  ) {
    if (processStructure.status === "idle") {
      label = "Resumen auxiliar del caso";
    } else {
      label = "Resumen auxiliar del caso: No disponible";
    }
  } else {
    label = `Resumen auxiliar: ${processStructure.mainProcess.label}`;
  }

  return (
    <section
      className={styles.processAxisRegion}
      aria-label="Resumen auxiliar del caso"
    >
      <p className={styles.processAxisEmpty} role="status">
        {label}
      </p>
    </section>
  );
}
