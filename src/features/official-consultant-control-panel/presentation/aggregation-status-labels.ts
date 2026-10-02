import type { PanelAggregationCompleteness } from "./aggregation-sources";



/**

 * Shared factual labels for Estado / Próximo across KPI, workspace, drawer.

 * Each surface is gated independently.

 */

export function resolveAggregationStatusLabels(input: {

  companyStateComplete: boolean;

  nextStepComplete: boolean;

  statusLabel: string;

  nextStepLabel: string;

}): {

  statusLabel: string;

  nextStepLabel: string;

  statusEmpty: boolean;

  nextStepEmpty: boolean;

} {

  return {

    statusLabel: input.companyStateComplete

      ? input.statusLabel

      : "No disponible",

    nextStepLabel: input.nextStepComplete

      ? input.nextStepLabel

      : "No disponible",

    statusEmpty: !input.companyStateComplete,

    nextStepEmpty: !input.nextStepComplete,

  };

}



/** Convenience when a full completeness object is already resolved. */

export function resolveAggregationStatusLabelsFromCompleteness(input: {

  completeness: PanelAggregationCompleteness;

  statusLabel: string;

  nextStepLabel: string;

}) {

  return resolveAggregationStatusLabels({

    companyStateComplete: input.completeness.companyStateComplete,

    nextStepComplete: input.completeness.nextStepComplete,

    statusLabel: input.statusLabel,

    nextStepLabel: input.nextStepLabel,

  });

}


