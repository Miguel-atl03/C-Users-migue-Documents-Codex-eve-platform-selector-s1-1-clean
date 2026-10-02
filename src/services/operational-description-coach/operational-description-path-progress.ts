import type { OperationalDescriptionPathStepId } from "@/features/significado/operational-description-canon";
import { OPERATIONAL_DESCRIPTION_PATH_STEPS } from "@/features/significado/operational-description-canon";
import type { OperationalCyberneticComponentId } from "@/features/significado/operational-description-cybernetic-components";
import { hasEstablishedActivityContext } from "./narrative-coach-policy.ts";
import { inferCyberneticComponentsFromScan } from "./cybernetic-coach-fallback.ts";
import { scanOperationalDescription } from "./scan-operational-description.ts";
import type { OperationalDescriptionContext } from "./types.ts";

export type OperationalPathStepStatus = "pending" | "active" | "covered";

export const PATH_STEP_TO_CYBERNETIC_COMPONENT: Record<
  OperationalDescriptionPathStepId,
  OperationalCyberneticComponentId
> = {
  trigger: "input_transduction",
  transform: "transformation_algorithm",
  attenuation: "variety_attenuation",
  output: "impact_amplification",
  handoff: "output_transduction",
};

export type OperationalPathProgress = {
  stepStates: Record<OperationalDescriptionPathStepId, OperationalPathStepStatus>;
  componentsCovered: OperationalCyberneticComponentId[];
  nextMissingComponent: OperationalCyberneticComponentId | null;
  isComplete: boolean;
};

function buildDefaultStepStates(
  activeStepId: OperationalDescriptionPathStepId = "trigger",
): Record<OperationalDescriptionPathStepId, OperationalPathStepStatus> {
  const states = {} as Record<
    OperationalDescriptionPathStepId,
    OperationalPathStepStatus
  >;

  for (const step of OPERATIONAL_DESCRIPTION_PATH_STEPS) {
    states[step.id] = step.id === activeStepId ? "active" : "pending";
  }

  return states;
}

function mapCyberneticEvaluationToStepStates(input: {
  componentsCovered: OperationalCyberneticComponentId[];
  nextMissingComponent: OperationalCyberneticComponentId | null;
}): Record<OperationalDescriptionPathStepId, OperationalPathStepStatus> {
  const states = {} as Record<
    OperationalDescriptionPathStepId,
    OperationalPathStepStatus
  >;

  for (const step of OPERATIONAL_DESCRIPTION_PATH_STEPS) {
    const componentId = PATH_STEP_TO_CYBERNETIC_COMPONENT[step.id];

    if (input.componentsCovered.includes(componentId)) {
      states[step.id] = "covered";
      continue;
    }

    if (input.nextMissingComponent === componentId) {
      states[step.id] = "active";
      continue;
    }

    states[step.id] = "pending";
  }

  return states;
}

export function resolveOperationalPathProgress(
  draftText: string,
  context: OperationalDescriptionContext = {},
): OperationalPathProgress {
  const trimmed = draftText.trim();

  if (!trimmed || !hasEstablishedActivityContext(context)) {
    return {
      stepStates: buildDefaultStepStates("trigger"),
      componentsCovered: [],
      nextMissingComponent: "input_transduction",
      isComplete: false,
    };
  }

  const scan = scanOperationalDescription(trimmed);
  const evaluation = inferCyberneticComponentsFromScan(scan, trimmed);

  return {
    stepStates: mapCyberneticEvaluationToStepStates(evaluation),
    componentsCovered: evaluation.componentsCovered,
    nextMissingComponent: evaluation.nextMissingComponent,
    isComplete: evaluation.nextMissingComponent === null,
  };
}
