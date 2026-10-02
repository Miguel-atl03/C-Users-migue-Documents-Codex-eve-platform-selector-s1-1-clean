"use client";

import type {
  ConsultantControlPanelState,
  DownloadTaxonomy,
} from "@/services/eve/consultant-control-panel/consultant-control-panel-types";
import styles from "./ccp.module.css";

const TAXONOMY_LABEL: Record<DownloadTaxonomy, string> = {
  platform_manual_input: "Insumo manual",
  manual_downstream_template: "Plantilla manual",
  external_manual_result: "Resultado manual externo",
  parallel_production_operational: "Exportable técnico",
};

export function DownloadsPanel({ state }: { state: ConsultantControlPanelState }) {
  const downloads = state.area_4_downloads.downloads;
  const capaKinds = new Set([
    "capa_2_0_manual_workbook",
    "capa_2_5_manual_workbook",
    "capa_3_0_manual_workbook",
  ]);

  return (
    <section className={styles.panel} data-testid="ccp-downloads">
      <div className={styles.panelHead}>
        <div>
          <h2 className={styles.panelTitle}>Descargas</h2>
          <p className={styles.muted}>
            Plataforma operativa: Capa 1.0 + Producción Paralela. Capa 2.0 / 2.5 / 3.0 solo como
            descargas manuales deshabilitadas (no ejecución automática).
          </p>
        </div>
        <span className={styles.pillDisabled}>Visible / deshabilitado</span>
      </div>
      <p className={styles.alertWarn}>
        capabilities.downloads.enabled = {String(state.capabilities.downloads.enabled)} ·{" "}
        {state.capabilities.downloads.reason_code}
      </p>
      <div className={styles.tableWrap}>
        <table className={styles.tableDense}>
          <thead>
            <tr>
              <th>Artefacto</th>
              <th>Tipo</th>
              <th>Estado inicial</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {downloads.map((item) => {
              const taxonomyLabel = item.taxonomy
                ? TAXONOMY_LABEL[item.taxonomy]
                : item.scope_badge ?? "Descargable manual";
              return (
                <tr key={item.kind}>
                  <td>
                    <strong>{item.label}</strong>
                    <div className={styles.cellMeta}>
                      maps_to: {item.sup_maps_to}
                      {capaKinds.has(item.kind) ? " · non_automatic_execution_flag" : ""}
                    </div>
                  </td>
                  <td>
                    <span className={styles.pillNeutral}>{taxonomyLabel}</span>
                    {capaKinds.has(item.kind) ? (
                      <div className={styles.cellMeta}>manual / non_automatic_execution_flag</div>
                    ) : null}
                  </td>
                  <td>
                    <span className={styles.pillDisabled}>Visible / deshabilitado</span>
                    <div className={styles.cellMeta}>
                      eligibility: {item.eligibility ?? "generator_unavailable"}
                    </div>
                  </td>
                  <td>
                    <button type="button" className={styles.btnPrimary} disabled>
                      {item.buttonLabel ?? "Descargar"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <h3 className={styles.subTitle}>Producción Paralela (estados)</h3>
      <ul className={styles.flagList}>
        {state.sup_final_objects_backbone.causal_chain.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ul>
    </section>
  );
}
