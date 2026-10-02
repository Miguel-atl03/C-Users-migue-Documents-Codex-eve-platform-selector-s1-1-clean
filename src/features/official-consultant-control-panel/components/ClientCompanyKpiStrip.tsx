import styles from "../styles/official-control-panel.module.css";
import type { PanelAggregationCompleteness } from "../presentation/aggregation-sources";
import {
  buildClientCompanyKpiItems,
  type ClientCompanyKpiItem,
} from "../presentation/client-company-kpi-items";
import type { CompanyStateSurfaceProjection } from "../presentation/company-state-presentation";
import type { ClientContextPresentation } from "../types/client-context.types";
import type { CoreMilestoneProgressStatus } from "@/services/eve/official-control-panel/official-control-panel-core-milestones";

export type { ClientCompanyKpiItem };
export { buildClientCompanyKpiItems };

type ClientCompanyKpiStripProps = {
  presentation: ClientContextPresentation;
  companyStateProjection?: CompanyStateSurfaceProjection | null;
  coreMilestoneProgress?: {
    achieved: number;
    total: number;
    status: CoreMilestoneProgressStatus;
  } | null;
  experienceAlertCount?: number | null;
  aggregationCompleteness?: PanelAggregationCompleteness;
  workMapFindingCount?: number;
};

const DEFAULT_COMPLETENESS: PanelAggregationCompleteness = {
  companyStateComplete: true,
  nextStepComplete: true,
  attentionComplete: true,
};

export function ClientCompanyKpiStrip({
  presentation,
  companyStateProjection = null,
  coreMilestoneProgress = null,
  experienceAlertCount = null,
  aggregationCompleteness = DEFAULT_COMPLETENESS,
  workMapFindingCount = 0,
}: ClientCompanyKpiStripProps) {
  const items = buildClientCompanyKpiItems(
    presentation,
    coreMilestoneProgress,
    experienceAlertCount,
    companyStateProjection,
    aggregationCompleteness,
    workMapFindingCount,
  );

  return (
    <section aria-labelledby="client-company-kpi-heading">
      <h2 className={styles.srOnly} id="client-company-kpi-heading">
        Indicadores del caso
      </h2>
      <dl className={styles.kpiStrip}>
        {items.map((item) => (
          <div className={styles.kpiItem} key={item.label}>
            <dt className={styles.kpiLabel}>{item.label}</dt>
            <dd
              className={
                item.empty
                  ? `${styles.kpiValue} ${styles.kpiValueEmpty}`
                  : styles.kpiValue
              }
              data-testid={
                item.label === "Alertas de experiencia"
                  ? "kpi-experience-alerts"
                  : item.label === "Estado actual"
                    ? "kpi-current-status"
                    : item.label === "Proximo paso"
                      ? "kpi-next-step"
                      : undefined
              }
              aria-label={
                item.empty
                  ? `${item.label}: Sin datos`
                  : `${item.label}: ${item.value}`
              }
            >
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
