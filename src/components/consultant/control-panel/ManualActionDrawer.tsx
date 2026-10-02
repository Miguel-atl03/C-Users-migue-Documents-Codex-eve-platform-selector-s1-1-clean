"use client";

import type { ControlPanelCapabilities } from "@/services/eve/consultant-control-panel/consultant-control-panel-types";
import styles from "./ccp.module.css";

const FUTURE_ACTIONS = [
  "Forzar reentry",
  "Reabrir bloque",
  "Agregar pregunta manual",
  "Cambiar causal",
  "Solicitar descarga",
] as const;

/**
 * Preview contractual no ejecutable (ACTION-001 / UI-009).
 */
export function ManualActionDrawer({
  open,
  capabilities,
  onClose,
}: {
  open: boolean;
  capabilities: ControlPanelCapabilities;
  onClose: () => void;
}) {
  if (!open) return null;

  const enabled = capabilities.manual_actions.enabled;

  return (
    <div className={styles.drawerScrim} role="presentation" onClick={onClose}>
      <aside
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-label="Acción manual futura"
        data-testid="ccp-manual-action-drawer"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.drawerHeader}>
          <h2>Acciones manuales</h2>
          <button type="button" className={styles.btnGhost} onClick={onClose}>
            Cerrar
          </button>
        </header>
        <p className={styles.alertWarn}>
          Preview contractual. enabled={String(enabled)} · reason_code=
          {capabilities.manual_actions.reason_code || "AUDITED_ENDPOINT_NOT_AVAILABLE"}
        </p>
        <ul className={styles.controlList}>
          {FUTURE_ACTIONS.map((action) => (
            <li key={action}>
              <button type="button" className={styles.btnGhost} disabled>
                {action}
              </button>
              <span className={styles.pillDisabled}>Deshabilitada</span>
            </li>
          ))}
        </ul>
        <label className={styles.field}>
          Justificación futura (requiere actor + audit trail)
          <textarea disabled rows={4} placeholder="No aceptada sin endpoint auditado" />
        </label>
        <button type="button" className={styles.btnPrimary} disabled>
          Ejecutar acción (disabled)
        </button>
        <p className={styles.muted}>
          ACTION-001 / UI-009: sin submit real ni handlers mock en producción.
        </p>
      </aside>
    </div>
  );
}
