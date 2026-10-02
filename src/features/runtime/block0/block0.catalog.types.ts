export type Block0CatalogHelpTextKind =
  | "canonical"
  | "fallback_no_canonico"
  | "none";

export type Block0CatalogCanonicalHelpStatus =
  | "present"
  | "CANONICAL_HELP_MISSING";

export type Block0CatalogResponseKind =
  | "text"
  | "textarea"
  | "single_choice"
  | "compound";

export type Block0CatalogSubfield = {
  id: string;
  label: string;
  responseKind: Exclude<Block0CatalogResponseKind, "compound">;
  sourceCode?: string;
  canonicalVariable?: string;
};

export type Block0CatalogSourceSheetRef = {
  sourceSheet: string;
  sourceRow?: number;
  sourceRuntimeInteractionId?: string;
  sourceColumns: string[];
};

export type Block0CatalogInteraction = {
  runtimeInteractionId: string;
  sourceRuntimeInteractionId: string;
  interactionGroup: "base";
  block: "0";
  runtimeOrder: number;
  questionText: string;
  helpText: string;
  helpTextKind: Block0CatalogHelpTextKind;
  helpTextSource?: string;
  canonicalHelpStatus: Block0CatalogCanonicalHelpStatus;
  technicalLabel?: string;
  uiComponent: string;
  responseKind: Block0CatalogResponseKind;
  subfields: Block0CatalogSubfield[];
  canonicalVariables: string[];
  requiredVariables: string[];
  optionalVariables: string[];
  derivedVariables: string[];
  sourceCodes: string[];
  sourceNodes: string[];
  sourceSheetRefs: Block0CatalogSourceSheetRef[];
  routeOrGate?: string;
  displayRule?: string;
  storageRule?: string;
  riskIfSingleTextbox?: string;
  readinessEffect?: string;
};

export type Block0Catalog = {
  schemaVersion: "runtime-block0-catalog.v1";
  sourceSnapshot: string;
  runtimeAuthority: string;
  adapter: string;
  interactions: Block0CatalogInteraction[];
};

export type Block0CatalogValidationResult = {
  valid: boolean;
  errors: string[];
};
