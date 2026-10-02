/**
 * Single projection from canonical CompanyControlPanelVM.
 * No parallel path from raw experienceData into KPI/workspace/drawer.
 */

import type { CompanyControlPanelVM } from "@/services/eve/official-control-panel/official-control-panel-contract.types";
import type { CompanyStateLabel } from "@/services/eve/official-control-panel/official-control-panel-experience.types";
import {
  COMPANY_STATE_UNAVAILABLE,
  type CompanyStateSurfaceProjection,
} from "./company-state-presentation.ts";

const UPSTREAM_REASON_HINT = /timer|rol|workmap|ruta|proceso|manual|qa|finding/i;

/**
 * Derive KPI / workspace / drawer surface exclusively from the company VM.
 */
export function presentCompanyStateFromVm(input: {
  contextActive: boolean;
  vm: CompanyControlPanelVM | null;
}): CompanyStateSurfaceProjection {
  if (!input.contextActive || !input.vm) {
    return {
      currentStatusLabel: COMPANY_STATE_UNAVAILABLE,
      nextStepLabel: COMPANY_STATE_UNAVAILABLE,
      evaluable: false,
      companyStateLabel: null,
    };
  }

  const vm = input.vm;
  if (!vm.experienceLoadReady || !vm.companyStateAggregation) {
    return {
      currentStatusLabel: COMPANY_STATE_UNAVAILABLE,
      nextStepLabel: COMPANY_STATE_UNAVAILABLE,
      evaluable: false,
      companyStateLabel: null,
    };
  }

  const agg = vm.companyStateAggregation;
  const wire = vm.experienceWireDataStatus;
  const hasUpstreamHint =
    UPSTREAM_REASON_HINT.test(agg.companyStateReason) ||
    (agg.experienceAlertCount != null && agg.experienceAlertCount > 0) ||
    vm.attentionItems.length > 0;

  // Empty experience slice without upstream signals → not evaluable (Amber-safe).
  if (wire === "empty" && !hasUpstreamHint) {
    return {
      currentStatusLabel: COMPANY_STATE_UNAVAILABLE,
      nextStepLabel: COMPANY_STATE_UNAVAILABLE,
      evaluable: false,
      companyStateLabel: null,
    };
  }

  const nextStepLabel = vm.nextExpectedEvent?.label?.trim()
    ? vm.nextExpectedEvent.label
    : COMPANY_STATE_UNAVAILABLE;

  const label = agg.companyState as CompanyStateLabel;

  // En curso without factual next event is not a solid surface.
  if (label === "En curso" && nextStepLabel === COMPANY_STATE_UNAVAILABLE) {
    return {
      currentStatusLabel: COMPANY_STATE_UNAVAILABLE,
      nextStepLabel: COMPANY_STATE_UNAVAILABLE,
      evaluable: false,
      companyStateLabel: null,
    };
  }

  return {
    currentStatusLabel: label,
    nextStepLabel,
    evaluable: true,
    companyStateLabel: label,
  };
}
