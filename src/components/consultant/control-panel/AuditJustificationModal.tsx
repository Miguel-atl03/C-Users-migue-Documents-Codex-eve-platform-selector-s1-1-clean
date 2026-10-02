"use client";

import { useState } from "react";
import styles from "./ccp.module.css";

export function AuditJustificationModal({
  open,
  title,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: (justification: string) => void;
}) {
  const [justification, setJustification] = useState("");

  if (!open) return null;

  return (
    <div className={styles.modalScrim}>
      <div className={styles.modalCard}>
        <p className={styles.areaLabel}>Auditoría obligatoria</p>
        <h3 className={styles.panelTitle}>{title}</h3>
        <p className={styles.panelCopy}>
          Toda intervención manual exige justificación, consultor responsable y audit trail.
        </p>
        <label className="mt-4 block text-sm font-medium text-[var(--ccp-ink)]">
          Justificación
          <textarea
            className={`${styles.input} min-h-28`}
            onChange={(event) => setJustification(event.target.value)}
            placeholder="Describa la causa válida de la intervención…"
            value={justification}
          />
        </label>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            className={styles.btnGhost}
            onClick={() => {
              setJustification("");
              onCancel();
            }}
            type="button"
          >
            Cancelar
          </button>
          <button
            className={styles.btnPrimary}
            disabled={!justification.trim()}
            onClick={() => {
              onConfirm(justification.trim());
              setJustification("");
            }}
            type="button"
          >
            Registrar justificación
          </button>
        </div>
      </div>
    </div>
  );
}
