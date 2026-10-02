"use client";

import styles from "./ccp.module.css";

export function EvidenceDetailDrawer({
  open,
  title,
  body,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className={styles.drawerScrim} role="presentation" onClick={onClose}>
      <aside
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-label="Detalle de evidencia"
        data-testid="ccp-evidence-drawer"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.drawerHeader}>
          <h2>{title}</h2>
          <button type="button" className={styles.btnGhost} onClick={onClose}>
            Cerrar
          </button>
        </header>
        <p className={styles.muted}>Detalle solo lectura. No edita evidencia ni oculta superseded.</p>
        <pre className={styles.drawerBody}>{body}</pre>
      </aside>
    </div>
  );
}
