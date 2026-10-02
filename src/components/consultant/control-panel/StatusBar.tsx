"use client";

import type { ConsultantControlPanelState } from "@/services/eve/consultant-control-panel/consultant-control-panel-types";
import styles from "./ccp.module.css";

export function StatusBar({ state }: { state: ConsultantControlPanelState }) {
  return (
    <footer className={styles.statusBar} data-testid="ccp-status-bar" role="status">
      <span className={styles.accessChip}>READ-ONLY</span>
      <span>request_id: {state.request_id}</span>
      <span>contract: {state.contract_version}</span>
      <span>freshness: {state.generated_at}</span>
      <span>
        manual_actions: {String(state.capabilities.manual_actions.enabled)} (
        {state.capabilities.manual_actions.reason_code || "AUDITED_ENDPOINT_NOT_AVAILABLE"})
      </span>
      <span>
        downloads: {String(state.capabilities.downloads.enabled)} (
        {state.capabilities.downloads.reason_code || "AUTHORIZED_GENERATOR_NOT_AVAILABLE"})
      </span>
      <span>{state.consultant_safe_message}</span>
    </footer>
  );
}
