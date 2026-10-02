"use client";

import Link from "next/link";
import styles from "@/components/consultant/control-panel/ccp.module.css";

export default function ConsultantControlPanelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const requestId = error.digest ?? "unavailable";

  return (
    <main className={`${styles.shell} bg-[#f7f7f2] text-neutral-950`}>
      <div className={`${styles.frame} max-w-3xl`}>
        <header>
          <p className={`${styles.brandMark} text-emerald-700`}>Consultoría EVE</p>
          <h1 className={styles.title}>Error en el panel de control</h1>
          <p className={styles.lede}>
            No se pudo cargar la superficie interna del consultor. No se ejecutó export
            productivo ni se reabrió activación.
          </p>
        </header>
        <section className={`${styles.feedback} mt-5`}>
          {error.message || "Error desconocido"}
        </section>
        <p className={styles.muted}>request_id / digest: {requestId}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button className={styles.btnPrimary} onClick={reset} type="button">
            Reintentar
          </button>
          <Link className={styles.btnGhost} href="/admin/runtime-vsm">
            Ir al cuadro VSM
          </Link>
        </div>
      </div>
    </main>
  );
}
