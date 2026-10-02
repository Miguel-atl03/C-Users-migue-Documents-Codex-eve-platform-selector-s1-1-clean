import { Figtree } from "next/font/google";
import styles from "@/components/consultant/control-panel/ccp.module.css";

const ccpSans = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ccp-sans",
  display: "swap",
});

export default function ConsultantControlPanelLoading() {
  return (
    <main className={`${styles.shell} ${ccpSans.variable} bg-[#f7f7f2] text-neutral-950`}>
      <div className={styles.frameWide}>
        <header>
          <p className={`${styles.brandMark} text-emerald-700`}>Consultoría EVE</p>
          <h1 className={styles.title}>Cargando panel de control…</h1>
          <p className={styles.lede}>
            Preparando CaseHeader, sidebar, readiness, matriz usuario/rol y status bar.
          </p>
        </header>
        <div className="mt-5 grid gap-3 md:grid-cols-[16rem_1fr]">
          <div className={styles.skeleton} />
          <div className="grid gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div className={styles.skeleton} key={index} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
