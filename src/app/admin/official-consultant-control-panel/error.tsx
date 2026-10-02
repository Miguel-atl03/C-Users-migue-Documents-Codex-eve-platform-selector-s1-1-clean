"use client";

import Link from "next/link";
import styles from "@/features/official-consultant-control-panel/styles/official-control-panel.module.css";

export default function OfficialConsultantControlPanelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const requestId = error.digest ?? "unavailable";

  return (
    <main className={styles.shell}>
      <div className={styles.appShell}>
        <div className={styles.mainColumn}>
          <header className={styles.panelHeader}>
            <div>
              <h1 className={styles.panelTitle}>Panel de Control EVE</h1>
              <p className={styles.panelContext}>
                No fue posible preparar el panel. No se consultaron servicios
                remotos ni se alteró el legacy.
              </p>
            </div>
          </header>
          <section className={styles.statePanel} role="alert">
            <h2>No fue posible preparar el panel.</h2>
            <p>{error.message || "Error desconocido"}</p>
            <p className={styles.srOnly}>request_id: {requestId}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              <button className={styles.retryButton} onClick={reset} type="button">
                Reintentar
              </button>
              <Link className={styles.retryButton} href="/">
                Volver al inicio
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
