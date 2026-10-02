export type RuntimeInteractionGroup =
  | "base"
  | "causal"
  | "internal"
  | "clarification"
  | "microconfirmation";

export type RuntimeResponseKind =
  | "text"
  | "textarea"
  | "single_choice"
  | "compound";

export type RuntimeHelpTextKind =
  | "canonical"
  | "fallback_no_canonico"
  | "none";

export type CanonicalHelpStatus =
  | "present"
  | "CANONICAL_HELP_MISSING";

export type RuntimeOptionViewModel = {
  id: string;
  label: string;
  value: string;
};

export type RuntimeSubfieldViewModel = {
  id: string;
  label: string;
  responseKind: Exclude<RuntimeResponseKind, "compound">;
  sourceCode?: string;
  canonicalVariable?: string;
};

export type RuntimeSourceSheetRef = {
  sourceSheet: string;
  sourceRow?: number;
  sourceColumns: string[];
  sourceRuntimeInteractionId?: string;
};

export type RuntimeInteractionViewModel = {
  runtimeInteractionId: string;
  sourceRuntimeInteractionId: string;
  interactionGroup: RuntimeInteractionGroup;
  block: string;
  runtimeOrder: number;
  questionText: string;
  helpText: string;
  helpTextKind: RuntimeHelpTextKind;
  helpTextSource?: string;
  canonicalHelpStatus: CanonicalHelpStatus;
  technicalLabel?: string;
  uiComponent: string;
  responseKind: RuntimeResponseKind;
  subfields: RuntimeSubfieldViewModel[];
  options?: RuntimeOptionViewModel[];
  canonicalVariables: string[];
  requiredVariables: string[];
  optionalVariables: string[];
  derivedVariables: string[];
  sourceCodes: string[];
  sourceNodes: string[];
  sourceSheetRefs: RuntimeSourceSheetRef[];
  routeOrGate?: string;
  displayRule?: string;
  storageRule?: string;
  riskIfSingleTextbox?: string;
  readinessEffect?: string;
};
