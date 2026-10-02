import styles from "../styles/official-control-panel.module.css";



export function OfficialControlPanelLoadingState() {

  return (

    <div aria-busy="true" aria-live="polite" role="status">
      <span aria-hidden="true">!</span>

      <p className={styles.srOnly}>Cargando panel de control oficial…</p>

      <div className={styles.panelHeader}>

        <div className={`${styles.skeletonBlock} ${styles.skeletonMedium}`} style={{ width: "40%" }} />

        <div className={styles.skeletonBlock} style={{ width: "60%", marginTop: 8 }} />

      </div>

      <div className={styles.kpiStrip} style={{ marginTop: 12 }}>

        {Array.from({ length: 7 }).map((_, index) => (

          <div className={styles.kpiItem} key={`kpi-skeleton-${index}`}>

            <div className={styles.skeletonBlock} style={{ width: "70%" }} />

            <div className={styles.skeletonBlock} style={{ width: "40%", marginTop: 6 }} />

          </div>

        ))}

      </div>

      <div className={styles.modeBar} style={{ marginTop: 12 }}>

        <div className={`${styles.skeletonBlock} ${styles.skeletonMedium}`} />

      </div>

      <div className={`${styles.skeletonBlock} ${styles.skeletonTall}`} style={{ marginTop: 12 }} />

      <div className={`${styles.skeletonBlock} ${styles.skeletonMedium}`} style={{ marginTop: 12, width: "80%" }} />

      <div className={styles.matrix} style={{ marginTop: 12 }}>

        <div className={`${styles.skeletonBlock} ${styles.skeletonTall}`} />

        <div className={`${styles.skeletonBlock} ${styles.skeletonTall}`} />

        <div className={`${styles.skeletonBlock} ${styles.skeletonTall}`} />

      </div>

    </div>

  );

}


