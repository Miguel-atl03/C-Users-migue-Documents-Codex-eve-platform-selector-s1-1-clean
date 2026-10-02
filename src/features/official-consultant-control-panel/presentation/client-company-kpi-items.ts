import type { ClientContextPresentation } from "../types/client-context.types";
import type { PanelAggregationCompleteness } from "./aggregation-sources";
import { resolveAggregationStatusLabels } from "./aggregation-status-labels";
import type { CompanyStateSurfaceProjection } from "./company-state-presentation";
import { formatCoreMilestoneKpiValue } from "./core-milestone-axis-presentation";
import type { CoreMilestoneProgressStatus } from "@/services/eve/official-control-panel/official-control-panel-core-milestones";

export type ClientCompanyKpiItem = {
  label:
    | "Estado actual"
    | "Proximo paso"
    | "Atencion requerida"
    | "Hitos core alcanzados"
    | "Alertas de experiencia";
  value: string;
  /** Metric shells without factual source stay as empty dash. */
  empty: boolean;
};

export { resolveAggregationStatusLabels };

const DEFAULT_COMPLETENESS: PanelAggregationCompleteness = {
  companyStateComplete: true,
  nextStepComplete: true,
  attentionComplete: true,
};

export function buildClientCompanyKpiItems(
  presentation: ClientContextPresentation,
  coreMilestoneProgress?: {
    achieved: number;
    total: number;
    status: CoreMilestoneProgressStatus;
  } | null,
  experienceAlertCount?: number | null,
  companyStateProjection?: CompanyStateSurfaceProjection | null,
  completeness: PanelAggregationCompleteness = DEFAULT_COMPLETENESS,
  workMapFindingCount = 0,
): ClientCompanyKpiItem[] {
  const coreKpi = formatCoreMilestoneKpiValue(
    coreMilestoneProgress ?? {
      achieved: 0,
      total: 0,
      status: "unavailable",
    },
  );

  const aggregated = resolveAggregationStatusLabels({
    companyStateComplete:
      completeness.companyStateComplete || companyStateProjection?.evaluable === true,
    nextStepComplete:
      completeness.nextStepComplete || companyStateProjection?.evaluable === true,
    statusLabel:
      companyStateProjection?.currentStatusLabel ??
      presentation.currentStatusLabel,
    nextStepLabel:
      companyStateProjection?.nextStepLabel ?? presentation.nextStepLabel,
  });

  const attentionCountComplete =
    completeness.attentionComplete && typeof experienceAlertCount === "number";
  const attentionValue =
    workMapFindingCount > 0
      ? `${workMapFindingCount} pendiente${
          workMapFindingCount === 1 ? "" : "s"
        }`
      : completeness.attentionComplete
        ? presentation.attentionLabel
        : "-";

  return [
    {
      label: "Estado actual",
      value: aggregated.statusLabel,
      empty: aggregated.statusEmpty,
    },
    {
      label: "Proximo paso",
      value: aggregated.nextStepLabel,
      empty: aggregated.nextStepEmpty,
    },
    {
      label: "Atencion requerida",
      value: attentionValue,
      empty: workMapFindingCount > 0 ? false : !completeness.attentionComplete,
    },
    {
      label: "Hitos core alcanzados",
      value: coreKpi.value,
      empty: coreKpi.empty,
    },
    {
      label: "Alertas de experiencia",
      value: attentionCountComplete ? String(experienceAlertCount) : "-",
      empty: !attentionCountComplete,
    },
  ];
}
