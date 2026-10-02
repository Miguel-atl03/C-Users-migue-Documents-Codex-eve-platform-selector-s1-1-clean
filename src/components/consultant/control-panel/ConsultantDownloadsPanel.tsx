"use client";

import { useState } from "react";
import type {
  ConsultantDownloadsState,
  DownloadKind,
} from "@/services/eve/consultant-control-panel/consultant-control-panel-types";
import { AuditJustificationModal } from "./AuditJustificationModal";
import { AreaLabel, PanelCopy, PanelSection, PanelTitle } from "./PanelChrome";
import styles from "./ccp.module.css";

export function ConsultantDownloadsPanel({
  state,
}: {
  state: ConsultantDownloadsState;
}) {
  const [pendingKind, setPendingKind] = useState<DownloadKind | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  return (
    <PanelSection>
      <div>
        <AreaLabel>Área 4</AreaLabel>
        <PanelTitle>Descargas consultor</PanelTitle>
        <PanelCopy>{state.causal_purpose}</PanelCopy>
      </div>

      <div className={styles.downloadList}>
        {state.downloads.map((download) => (
          <article className={styles.downloadRow} key={download.kind}>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[var(--ccp-ink)]">{download.label}</h3>
              <p className="mt-0.5 text-xs text-[var(--ccp-faint)]">
                Autoridad obligatoria · audit trail obligatorio · sin diagnóstico final automático
              </p>
              <p className={styles.supMapNote}>
                Mapeo SUP: {download.sup_maps_to}
                {download.sup_mapping_role ? ` · rol ${download.sup_mapping_role}` : ""}
              </p>
              {!download.enabled && download.reason_if_disabled ? (
                <p className="mt-1 text-xs text-[var(--ccp-warn-ink)]">
                  {download.reason_if_disabled}
                </p>
              ) : null}
            </div>
            <button
              className={`${styles.btnPrimary} shrink-0`}
              disabled={!download.enabled}
              onClick={() => {
                if (!download.enabled) {
                  setFeedback(
                    download.reason_if_disabled ?? "Pendiente de generador autorizado",
                  );
                  return;
                }
                setPendingKind(download.kind);
              }}
              type="button"
            >
              {download.enabled ? "Solicitar descarga" : "No disponible todavía"}
            </button>
          </article>
        ))}
      </div>

      {feedback ? <p className={styles.feedback}>{feedback}</p> : null}

      <AuditJustificationModal
        open={pendingKind !== null}
        title="Descarga bajo autoridad"
        onCancel={() => setPendingKind(null)}
        onConfirm={() => {
          setFeedback("Pendiente de generador autorizado");
          setPendingKind(null);
        }}
      />
    </PanelSection>
  );
}
