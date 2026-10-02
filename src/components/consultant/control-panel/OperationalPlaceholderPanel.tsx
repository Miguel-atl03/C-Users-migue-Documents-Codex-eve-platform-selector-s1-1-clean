"use client";

import type { PMOperationalViewKey } from "./pm-process-catalog";
import styles from "./ccp.module.css";

const PLACEHOLDER_COPY: Record<
  Exclude<
    PMOperationalViewKey,
    | "cases"
    | "functional-help"
    | "monitoring"
    | "runtime"
    | "trace"
    | "gates"
    | "downloads"
    | "audit"
    | "experience"
    | "pre-runtime"
  >,
  { title: string; body: string; disabledNote: string }
> = {
  "evidence-bundle": {
    title: "EvidenceBundle",
    body: "Vista de observación para el objeto EvidenceBundle (P-SUP-02). La cabina no inventa contenido diagnóstico ni reescribe evidencia.",
    disabledNote: "Sin UI dedicada productiva · solo placeholder read-only.",
  },
  "parallel-production": {
    title: "Producción paralela",
    body: "Línea operativa de inventario / IR / diagramación (P-SUP-06). Capa 2.0 / 2.5 / 3.0 no se ejecutan automáticamente desde esta cabina.",
    disabledNote: "No automatizado · sin generador autorizado.",
  },
  qa: {
    title: "QA",
    body: "Observación de señales de QA asociadas a P-SUP-07/08. No se abre un motor de QA productivo aquí.",
    disabledNote: "Placeholder · sin automatización.",
  },
  blockages: {
    title: "Bloqueos",
    body: "Listado observacional de bloqueos gobernados. La intervención manual (bloquear / reentry / aclaración) permanece deshabilitada.",
    disabledNote: "manual_actions.enabled=false · AUDITED_ENDPOINT_NOT_AVAILABLE",
  },
  "client-delivery": {
    title: "Estado de entrega al cliente",
    body: "Seguimiento observacional de P-CLIENT-01. No implica entrega productiva ni exportación autorizada.",
    disabledNote: "Sin exportación productiva · productive_export bloqueado.",
  },
  "manual-actions": {
    title: "Acciones manuales deshabilitadas",
    body: "Reentry, aclaración, bloqueo, corrección de ruta y revisión manual son reentradas futuras gobernadas. En modo inicial solo se muestra el contrato, sin ejecución.",
    disabledNote: "manual_actions.enabled=false · AUDITED_ENDPOINT_NOT_AVAILABLE",
  },
};

export function OperationalPlaceholderPanel({
  viewKey,
}: {
  viewKey: Exclude<
    PMOperationalViewKey,
    | "cases"
    | "functional-help"
    | "monitoring"
    | "runtime"
    | "trace"
    | "gates"
    | "downloads"
    | "audit"
    | "experience"
    | "pre-runtime"
  >;
}) {
  const copy = PLACEHOLDER_COPY[viewKey];
  return (
    <section
      className={styles.panel}
      data-testid="ccp-pm-placeholder"
      data-placeholder-view={viewKey}
    >
      <p className={styles.areaLabel}>Vista operativa · placeholder</p>
      <h3 className={styles.panelTitle}>{copy.title}</h3>
      <p className={styles.panelCopy}>{copy.body}</p>
      <p className={styles.muted}>{copy.disabledNote}</p>
      <div className={styles.capabilityRow} style={{ marginTop: "0.75rem" }}>
        <span className={styles.pillDisabled}>READ-ONLY</span>
        <span className={styles.pillDisabled}>sin diagnóstico automático</span>
        <span className={styles.pillDisabled}>descargas=false</span>
      </div>
    </section>
  );
}
