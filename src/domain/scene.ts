export type SceneDepthLevel =
  | "A_core"
  | "B_abbreviated"
  | "C_support_reentry";

export type SceneStatus =
  | "scene_intake"
  | "scene_prioritized"
  | "scene_capture_core"
  | "scene_capture_capacity"
  | "scene_capture_compensation"
  | "scene_light_preclassification"
  | "scene_micro_confirmation"
  | "scene_consistency_check"
  | "scene_support_reentry"
  | "scene_canonical_consolidation"
  | "scene_ready_for_transduction";

export type SceneAnswerNature =
  | "captured"
  | "normalized"
  | "derived"
  | "computed"
  | "clarification"
  | "inferred"
  | "state_metadata";

export type SceneProvenanceType =
  | "captured"
  | "normalized"
  | "transduced_from_open_text"
  | "derived"
  | "computed"
  | "clarification"
  | "inferred"
  | "state_metadata";

export type SceneConsistencySeverity = "low" | "medium" | "high" | "critical";

export type SceneConsistencyFlagStatus =
  | "open"
  | "clarification_requested"
  | "resolved"
  | "dismissed";

export type SceneReadinessForTransduction =
  | "not_ready"
  | "partial"
  | "ready_with_flags"
  | "ready";

export type PreclassificationReadiness =
  | "ready_for_transduction"
  | "needs_micro_confirmation"
  | "needs_support_reentry"
  | "needs_manual_review"
  | "insufficient_evidence";

export type SceneRegistryRecord = {
  id: string;
  sessionId: string;
  legacyActivityId: string | null;
  sceneName: string;
  sceneRank: number | null;
  depthLevel: SceneDepthLevel;
  sceneStatus: SceneStatus;
  source: string;
  originalText: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SceneQuestionAnswerRecord = {
  id: string;
  sessionId: string;
  sceneId: string;
  instrumentVersion: "CAPA1_V2_1";
  blockId: string;
  questionCode: string;
  subquestionCode: string | null;
  answerNature: SceneAnswerNature;
  answerType: string;
  selectedValue: string | null;
  selectedValues: string[] | null;
  freeText: string | null;
  answerJson: unknown;
  isUserVisible: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SceneBlockDerivationRecord = {
  id: string;
  sessionId: string;
  sceneId: string;
  instrumentVersion: "CAPA1_V2_1";
  blockId: string;
  derivationKey: string;
  derivationValue: unknown;
  evidenceAnswerIds: string[];
  confidence: number | null;
  derivationVersion: string;
  createdAt: string;
  updatedAt: string;
};

export type SceneCanonicalRecord = {
  id: string;
  sessionId: string;
  sceneId: string;
  instrumentVersion: "CAPA1_V2_1";
  canonicalJson: unknown;
  evidenceAnswerIds: string[];
  consistencyFlagIds: string[];
  readinessForTransduction: SceneReadinessForTransduction;
  createdAt: string;
  updatedAt: string;
};
