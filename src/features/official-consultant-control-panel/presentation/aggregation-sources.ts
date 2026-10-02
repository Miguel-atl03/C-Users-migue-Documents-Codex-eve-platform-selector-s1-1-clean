import type {

  OfficialPanelScreenState,

  PanelDataAvailability,

} from "@/services/eve/official-control-panel/official-control-panel-contract.types";



/**

 * Factual aggregation sources that feed CompanyControlPanelVM surfaces.

 * Extracted from productive compose — no invented dependencies.

 *

 * - experience → companyStateAggregation (Estado), attention alerts

 * - core_milestones → nextExpectedEvent (Próximo paso)

 * - manual_work → Attention overdue / handoff

 * - parallel_production → Attention parallel / QA

 */

export type AggregationSourceKey =

  | "experience"

  | "core_milestones"

  | "manual_work"

  | "parallel_production";



export type AggregationSourceState = {

  key: AggregationSourceKey;

  dataStatus: PanelDataAvailability;

  requiredForCompanyState: boolean;

  requiredForNextStep: boolean;

  requiredForAttention: boolean;

};



export type PanelAggregationCompleteness = {

  companyStateComplete: boolean;

  nextStepComplete: boolean;

  attentionComplete: boolean;

};



/**

 * Map panel screen state to data availability for aggregation gating.

 * Only `available` is complete. `partial` keeps valid data but is incomplete.

 */

export function mapScreenStateToAggregationDataStatus(

  screenState: OfficialPanelScreenState,

): PanelDataAvailability {

  switch (screenState) {

    case "ready":

    case "refreshing":

      return "available";

    case "partial":

      return "partial";

    case "stale":

      return "stale";

    case "loading":

      return "unavailable";

    case "fatal":

    case "forbidden":

    case "not_found":

      return "error";

    default:

      return "unavailable";

  }

}



export function isAggregationSourceComplete(

  dataStatus: PanelDataAvailability,

): boolean {

  return dataStatus === "available";

}



/**

 * Build the fixed contribution matrix. Completeness is view-independent:

 * unloaded sources stay `unavailable` via their factual screen state (idle/loading).

 */

export function buildPanelAggregationSources(input: {

  experience: OfficialPanelScreenState;

  coreMilestones: OfficialPanelScreenState;

  manualWork: OfficialPanelScreenState;

  parallelProduction: OfficialPanelScreenState;

}): AggregationSourceState[] {

  return [

    {

      key: "experience",

      requiredForCompanyState: true,

      requiredForNextStep: false,

      requiredForAttention: true,

      dataStatus: mapScreenStateToAggregationDataStatus(input.experience),

    },

    {

      key: "core_milestones",

      requiredForCompanyState: false,

      requiredForNextStep: true,

      requiredForAttention: false,

      dataStatus: mapScreenStateToAggregationDataStatus(input.coreMilestones),

    },

    {

      key: "manual_work",

      requiredForCompanyState: false,

      requiredForNextStep: false,

      requiredForAttention: true,

      dataStatus: mapScreenStateToAggregationDataStatus(input.manualWork),

    },

    {

      key: "parallel_production",

      requiredForCompanyState: false,

      requiredForNextStep: false,

      requiredForAttention: true,

      dataStatus: mapScreenStateToAggregationDataStatus(

        input.parallelProduction,

      ),

    },

  ];

}



function surfaceComplete(

  sources: AggregationSourceState[],

  predicate: (source: AggregationSourceState) => boolean,

): boolean {

  const required = sources.filter(predicate);

  if (required.length === 0) return false;

  return required.every((source) =>

    isAggregationSourceComplete(source.dataStatus),

  );

}



/** Per-surface completeness — never a single global gate. */

export function resolvePanelAggregationCompleteness(

  sources: AggregationSourceState[],

): PanelAggregationCompleteness {

  return {

    companyStateComplete: surfaceComplete(

      sources,

      (source) => source.requiredForCompanyState,

    ),

    nextStepComplete: surfaceComplete(

      sources,

      (source) => source.requiredForNextStep,

    ),

    attentionComplete: surfaceComplete(

      sources,

      (source) => source.requiredForAttention,

    ),

  };

}



/** Canonical contributor keys — unit tests assert none are dropped. */

export const PANEL_AGGREGATION_SOURCE_KEYS = [

  "experience",

  "core_milestones",

  "manual_work",

  "parallel_production",

] as const;


