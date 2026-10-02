"use client";

import type { PClient01StatusBandVM } from "@/services/eve/consultant-control-panel/p-client-01-view-models";
import styles from "../ccp-pm.module.css";

/** §3 zona Banda de estado — límites de autoridad y degradaciones. */
export function PClient01StatusBand({ band }: { band: PClient01StatusBandVM }) {
  return (
    <footer
      className={styles.pClientStatusBand}
      data-testid="ccp-pclient01-status-band"
      data-zone="status_band"
      aria-label="Banda de estado P-CLIENT-01"
    >
      <span className={styles.pillDisabled}>{band.mode}</span>
      <span className={styles.pClientStatusItem} title={band.request_id}>
        request_id
      </span>
      <span className={styles.pClientStatusItem} title={band.effective_scope_summary}>
        effective_scope · {band.effective_scope_summary}
      </span>
      <span className={styles.pClientStatusItem} title={band.freshness_source}>
        freshness · {band.freshness_source}
      </span>
      <span className={styles.pClientStatusItem}>generator · {band.generator_status}</span>
      <span className={styles.pClientStatusItem}>
        capabilities · manual_actions=
        {String(band.manual_actions_enabled)} · downloads=
        {String(band.downloads_enabled)}
      </span>
      <span className={styles.pClientStatusNote}>{band.permissions_note}</span>
    </footer>
  );
}
