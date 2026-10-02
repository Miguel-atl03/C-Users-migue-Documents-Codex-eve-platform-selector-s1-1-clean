import styles from "@/features/official-consultant-control-panel/styles/official-control-panel.module.css";
import { OfficialControlPanelLoadingState } from "@/features/official-consultant-control-panel/components/OfficialControlPanelLoadingState";

export default function OfficialConsultantControlPanelLoading() {
  return (
    <main className={styles.shell} aria-busy="true">
      <div className={styles.appShell}>
        <div className={styles.mainColumn}>
          <OfficialControlPanelLoadingState />
        </div>
      </div>
    </main>
  );
}
