import type { ActivityParts } from "@/services/local-work-map-activity-validation";

export type OperationalDimension =
  | "trigger_input"
  | "transformation_core"
  | "standard_or_rule"
  | "attenuation"
  | "escalation"
  | "handoff_output";

export type DimensionStatus = "missing" | "weak" | "present";

export type OperationalSufficiency =
  | "empty"
  | "insufficient"
  | "operational"
  | "mastery";

export type CoachTier = "silent" | "hint" | "nudge";

import type { OperationalCyberneticComponentId } from "@/features/significado/operational-description-cybernetic-components";

export type OperationalDescriptionContext = {
  activityTitle?: string;
  actionVerb?: string;
  inputOrObject?: string;
  procedureOrStandard?: string;
  outputOrResult?: string;
  introExampleNarrative?: string;
};

export type OperationalDimensionScan = {
  status: DimensionStatus;
  evidence?: string;
};

export type OperationalDescriptionScan = {
  structuralParts: ActivityParts;
  dimensions: Record<OperationalDimension, OperationalDimensionScan>;
  sufficiency: OperationalSufficiency;
  priorityGap: OperationalDimension | null;
  coachTier: CoachTier;
};

export type OperationalDescriptionCoachResult = {
  scan: OperationalDescriptionScan;
  message: string | null;
  exampleFragment: string | null;
  coachSource?: "deterministic" | "llm";
  cyberneticEvaluation?: {
    componentsCovered: OperationalCyberneticComponentId[];
    nextMissingComponent: OperationalCyberneticComponentId | null;
  };
};

export type OperationalDescriptionIntroPathStep = {
  id: string;
  label: string;
  shortLabel: string;
  hint: string;
};

export type OperationalDescriptionExampleBeat = {
  stepId: string;
  text: string;
};

export type OperationalDescriptionIntroGuide = {
  contrastLead: string;
  activityAnchorSnippet: string;
  pathSteps: OperationalDescriptionIntroPathStep[];
  exampleBeats: OperationalDescriptionExampleBeat[];
  exampleNarrative: string;
  exampleLead: string;
  exampleSource?: "deterministic" | "llm";
};
