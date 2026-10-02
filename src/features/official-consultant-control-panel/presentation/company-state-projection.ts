/**

 * Apply per-surface aggregation completeness onto the shared company-state

 * projection consumed by KPI, workspace, and Attention drawer.

 */



import type { CompanyControlPanelVM } from "@/services/eve/official-control-panel/official-control-panel-contract.types";

import type { PanelAggregationCompleteness } from "./aggregation-sources";

import { presentCompanyStateFromVm } from "./company-state-from-vm";

import {

  COMPANY_STATE_UNAVAILABLE,

  type CompanyStateSurfaceProjection,

} from "./company-state-presentation";



export function presentCompanyStateProjectionWithCompleteness(input: {

  contextActive: boolean;

  vm: CompanyControlPanelVM | null;

  completeness: PanelAggregationCompleteness;

}): CompanyStateSurfaceProjection {

  const factual = presentCompanyStateFromVm({

    contextActive: input.contextActive,

    vm: input.vm,

  });



  const { companyStateComplete, nextStepComplete } = input.completeness;



  // Both surfaces complete → keep productive coupling rules (e.g. En curso).

  if (companyStateComplete && nextStepComplete) {

    return factual;

  }



  const milestoneNext = input.vm?.nextExpectedEvent?.label?.trim()

    ? input.vm.nextExpectedEvent.label

    : COMPANY_STATE_UNAVAILABLE;



  const currentStatusLabel = companyStateComplete

    ? factual.currentStatusLabel

    : COMPANY_STATE_UNAVAILABLE;



  const nextStepLabel = nextStepComplete

    ? companyStateComplete

      ? factual.nextStepLabel

      : milestoneNext

    : COMPANY_STATE_UNAVAILABLE;



  return {

    currentStatusLabel,

    nextStepLabel,

    evaluable: companyStateComplete && factual.evaluable,

    companyStateLabel: companyStateComplete ? factual.companyStateLabel : null,

  };

}


