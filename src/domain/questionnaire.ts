export type QuestionnaireFieldType =
  | "guided_short_text"
  | "number"
  | "select"
  | "multi_select"
  | "select_with_text"
  | "multi_select_with_text"
  | "number_with_unit"
  | "dynamic_capacity"
  | "computed"
  | "internal"
  | "clarification"
  | "confirmation"
  | "ranking"
  | "boolean_with_text"
  | "scale_with_text"
  | "free_text"
  | "single_choice"
  | "single_choice_with_text"
  | "multi_choice"
  | "multi_choice_with_text"
  | "multi_choice_dynamic"
  | "hybrid_choice_text"
  | "scale"
  | "generated_review";

export type QuestionnaireAnswerMode =
  | "free_text"
  | "single_choice"
  | "multi_choice"
  | "multi_choice_with_text"
  | "hybrid_choice_text"
  | "numeric"
  | "numeric_with_unit"
  | "ranking"
  | "scale"
  | "clarification"
  | "confirmation"
  | "internal_inference"
  | "generated_review";

export type QuestionnaireOption = {
  value: string;
  label: string;
};

export type QuestionnaireAnswerNature =
  | "captured"
  | "normalized"
  | "derived"
  | "computed"
  | "clarification"
  | "inferred"
  | "state_metadata";

export type QuestionnaireConditionOperator =
  | "equals"
  | "not_equals"
  | "in"
  | "not_in"
  | "includes"
  | "not_includes"
  | "includes_all"
  | "selection_count_equals"
  | "selection_count_greater_than"
  | "has_any_selection"
  | "has_residual_variety"
  | "has_multiple_candidates"
  | "has_crossed_signals"
  | "is_ambiguous"
  | "user_rejects_or_low_confidence"
  | "less_than"
  | "greater_or_equal";

export type QuestionnaireCondition = {
  questionCode: string;
  operator: QuestionnaireConditionOperator;
  value: string | number | boolean | string[] | number[];
};

export type QuestionnaireScaleBand = {
  range: string;
  label: string;
};

export type QuestionnaireScale = {
  min: number;
  max: number;
  bands?: QuestionnaireScaleBand[];
};

export type QuestionnaireFormula =
  | string
  | {
      repetitive?: string;
      discretionary_or_mixed?: string;
      [key: string]: string | undefined;
    };

export type QuestionnaireTimeScale = Record<string, number>;

export type QuestionnaireDynamicTemplates = Record<string, string>;

export type QuestionnaireQuestion = {
  code: string;
  question_code?: string;
  text: string;
  canonical_question_text?: string;
  fieldType: QuestionnaireFieldType;
  field_type?: QuestionnaireFieldType;
  answerMode?: QuestionnaireAnswerMode;
  answer_mode?: QuestionnaireAnswerMode;
  required: boolean;
  architecturalPurpose?: string;
  options?: QuestionnaireOption[];
  allows_free_text?: boolean;
  free_text_condition?: unknown;
  branching_rule?: unknown;
  depends_on?: string[];
  generated_from?: string[];
  help_text?: string;
  short_ui_label?: string;
  answerNature?: QuestionnaireAnswerNature;
  canonicalVariable?: string;
  canonicalVariables?: string[];
  canonical_variable_output?: string | string[] | null;
  textCanonicalVariable?: string;
  visibleIf?: QuestionnaireCondition[];
  requiredIf?: QuestionnaireCondition[];
  derivedFrom?: string[];
  computedFrom?: string[];
  triggeredBy?: string[];
  internalOnly?: boolean;
  minSelections?: number;
  maxSelections?: number;
  maxLength?: number;
  unitDependsOn?: string;
  mirrorsQuestion?: string;
  formula?: QuestionnaireFormula;
  timeScaleDays?: QuestionnaireTimeScale;
  scale?: QuestionnaireScale;
  dynamicTemplates?: QuestionnaireDynamicTemplates;
  examplesDependOn?: string[];
  [metadataKey: string]: unknown;
};

export type SceneDepthLevel =
  | "A_core"
  | "B_abbreviated"
  | "C_support_reentry";

export type QuestionnaireBlock = {
  id: string;
  code?: string;
  name: string;
  purpose: string;
  questions: QuestionnaireQuestion[];
  depthLevelApplicability?: SceneDepthLevel[];
  dependsOn?: string[];
  canonicalVariables?: string[];
  recursiveLogic?: unknown;
  internalByDefault?: boolean;
  maxUserVisibleQuestions?: number;
};

export type QuestionCatalogCompatibilityMode = {
  replaces?: string;
  doesNotReplaceAtRuntimeYet?: boolean;
  legacyCatalog?: string;
};

export type QuestionCatalog = {
  version: string;
  source: string;
  unit?: "activity" | "scene";
  purpose?: string;
  compatibilityMode?: QuestionCatalogCompatibilityMode;
  principles?: string[];
  depthLevels?: Array<{
    id: SceneDepthLevel;
    label: string;
    description?: string;
    blocks?: string[];
    triggeredBy?: string[];
  }>;
  answerNatures?: QuestionnaireAnswerNature[];
  enrichmentFromDetailedCatalog?: unknown;
  blocks: QuestionnaireBlock[];
  canonicalOutput?: unknown;
};

export type QuestionnaireAnswer = {
  activityId: string;
  sceneId?: string;
  questionCode: string;
  blockId: string;
  selectedValue: string | null;
  selectedValues?: string[] | null;
  freeText: string | null;
  answerJson?: unknown;
  instrumentVersion?: string;
  answerNature?: QuestionnaireAnswerNature;
  canonicalVariable?: string;
  provenanceType?: QuestionnaireAnswerNature;
  originalAnswerId?: string | null;
  clarificationAnswerId?: string | null;
  consolidatedValue?: unknown;
  provenanceChain?: unknown[];
  readiness?: unknown;
  confidence?: unknown;
  flags?: unknown[];
  bundles?: Record<string, unknown>;
};

export type MissionOptionId =
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9";

export type MissionConfidence = "high" | "medium" | "low";

export type MissionEvidence = {
  questionCode: string;
  fragment: string;
  inferredOption: MissionOptionId;
  weight: number;
  reason: string;
};

export type MissionInferenceResult = {
  mission_inferred_by_ai: MissionOptionId | null;
  mission_score_by_option: Record<MissionOptionId, number>;
  mission_conflict_flags: string[];
  mission_confidence: MissionConfidence;
  mission_confidence_reason: string;
  mission_evidence: MissionEvidence[];
  mission_user_confirmation_status:
    | "not_requested"
    | "confirmed"
    | "corrected";
  mission_user_override: MissionOptionId | null;
  mission_final: MissionOptionId | null;
};
