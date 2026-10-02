import {
  OPERATIONAL_DESCRIPTION_PATH_STEPS,
  OPERATIONAL_DESCRIPTION_UI,
} from "@/features/significado/operational-description-canon";
import type { OperationalPathStepStatus } from "@/services/operational-description-coach/operational-description-path-progress";
import styles from "./significado-de-tu-trabajo.module.css";

type Props = {
  stepStates: Record<
    (typeof OPERATIONAL_DESCRIPTION_PATH_STEPS)[number]["id"],
    OperationalPathStepStatus
  >;
};

export function OperationalDescriptionPromptCopy({ stepStates }: Props) {
  return (
    <div className={styles.operationalPromptCopy}>
      <p className={styles.operationalPromptLead}>
        {OPERATIONAL_DESCRIPTION_UI.promptLead}
      </p>
      <ul
        aria-label="Recorrido de la descripción operativa"
        className={styles.operationalPromptFieldList}
      >
        {OPERATIONAL_DESCRIPTION_PATH_STEPS.map((field) => {
          const status = stepStates[field.id] ?? "pending";

          return (
            <li
              aria-current={status === "active" ? "step" : undefined}
              className={[
                styles.operationalPromptField,
                status === "covered"
                  ? styles.operationalPromptFieldCovered
                  : "",
                status === "active" ? styles.operationalPromptFieldActive : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={field.id}
            >
              {status === "covered" ? (
                <span aria-hidden="true" className={styles.operationalPromptFieldMark}>
                  ✓
                </span>
              ) : null}
              <span>{field.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
