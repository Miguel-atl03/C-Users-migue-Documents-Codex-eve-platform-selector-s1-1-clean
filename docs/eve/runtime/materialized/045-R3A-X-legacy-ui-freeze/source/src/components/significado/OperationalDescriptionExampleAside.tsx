import { OPERATIONAL_DESCRIPTION_UI } from "@/features/significado/operational-description-canon";
import type { OperationalDescriptionIntroGuide } from "@/services/operational-description-coach/types";
import styles from "./significado-de-tu-trabajo.module.css";

type Props = {
  guide: OperationalDescriptionIntroGuide;
};

export function OperationalDescriptionExampleAside({ guide }: Props) {
  return (
    <aside
      aria-label="Ejemplo de descripción operativa"
      className={styles.operationalExampleAside}
    >
      <p className={styles.operationalExampleContrastLead}>
        {guide.contrastLead || OPERATIONAL_DESCRIPTION_UI.introContrastLead}
      </p>
      <p className={styles.operationalExampleLabel}>
        {OPERATIONAL_DESCRIPTION_UI.exampleAsideLabel}
      </p>
      <p className={styles.operationalExampleText}>{guide.exampleNarrative}</p>
    </aside>
  );
}
