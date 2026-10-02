export type CausalNodeId = "N02" | "N03" | "N04" | "N06" | "N10" | "N13";

export type ActiveCausalMvpNodeId = "N03" | "N04" | "N06" | "N10";

export type LegacyCausalMvpNodeCode = "N2" | "N3" | "N4" | "N5";

export type CausalConfidenceLevel = "low" | "medium" | "high";

export type CausalEvidenceTier = "primary" | "secondary" | "inferential";

export type CausalRuleId =
  | "R-N03-ANARQUIA-OPERACIONAL-MVP"
  | "R-N04-VIOLACION-CAUSAL-MVP"
  | "R-N06-TORTURA-CAUSAL-MVP"
  | "R-N10-PROMESA-IMPOSIBLE-MVP";

export type CausalReentryReasonCode =
  | "insufficient_bundle"
  | "strong_contradiction"
  | "cross_scene_conflict"
  | "structural_gaps"
  | "session_requires_clarification";

export type CausalExpertReviewReasonCode =
  | "low_confidence_root"
  | "node_ambiguity"
  | "conflicting_paths"
  | "multi_node_pattern_needs_human_composition"
  | "cross_scene_conflict"
  | "strong_contradiction";

export type CausalReason<TCode extends string> = {
  code: TCode;
  message: string;
  sceneId?: string | null;
  nodeId?: CausalNodeId | null;
};

export type CausalNodeReference = {
  commercialProductNodeCount: 6 | null;
  legacyMvpCode?: LegacyCausalMvpNodeCode;
  commercialNodeCode?: string;
  motorStructuralReference: "MMABP_13_COMPARTMENTS";
  mmabpNodeNumber: 2 | 3 | 4 | 6 | 10 | 13;
  mmabpDecoupling: string;
  mmabpAnchors: string[];
  vsmAnchors: string[];
  aheAnchors: string[];
  sourceArtifacts: string[];
};

export type CausalNodeDefinition = {
  id: CausalNodeId;
  node_code_canonical: CausalNodeId;
  node_name_canonical: string;
  node_name_commercial: string;
  legacy_mvp_code?: LegacyCausalMvpNodeCode;
  motor_node_reference: CausalNodeReference;
  label: string;
  shortName: string;
  epistemicBoundary: string;
};

export type CausalEvidenceNature =
  | "captured"
  | "derived"
  | "computed"
  | "light_inference"
  | "consistency_flag"
  | "session_metadata";

export type CausalEvidenceItem = {
  sceneId: string;
  sceneName: string | null;
  canonicalVariable?: string;
  value?: unknown;
  reason: string;
  nature: CausalEvidenceNature;
  evidenceTier: CausalEvidenceTier;
  weight: number;
  evidenceAnswerIds: string[];
  derivationId?: string | null;
  consistencyFlagId?: string | null;
};

export type ConfidenceComponents = {
  support_score: number;
  weaken_score: number;
  contradiction_penalty: number;
  structural_gap_penalty: number;
  scene_coverage_score: number;
  light_inference_weight: number;
  primary_evidence_ratio: number;
  primary_evidence_count: number;
  secondary_evidence_count: number;
  inferential_evidence_count: number;
  scenes_supporting_count: number;
  scenes_weakening_count: number;
  evaluated_scene_count: number;
  heuristic_score: number;
};

export type EvidenceBundle = {
  id: string;
  ruleId: CausalRuleId;
  nodeId: CausalNodeId;
  node_code_canonical: CausalNodeId;
  node_name_canonical: string;
  node_name_commercial: string;
  sceneId: string;
  sceneName: string | null;
  supportScore: number;
  weakenScore: number;
  confidenceScore: number;
  confidenceLevel: CausalConfidenceLevel;
  confidenceReasoning: string;
  confidenceComponents: ConfidenceComponents;
  supports: CausalEvidenceItem[];
  weakens: CausalEvidenceItem[];
  unresolvedContradictions: string[];
  structuralGaps: string[];
};

export type CausalRule = {
  id: CausalRuleId;
  nodeId: CausalNodeId;
  node_code_canonical: CausalNodeId;
  node_name_canonical: string;
  node_name_commercial: string;
  name: string;
  description: string;
  minimumSupportScore: number;
  strongSupportScore: number;
  evidenceVariables: string[];
  weakeningVariables: string[];
  structuralDiagnosis: string;
  aheTransduction: string;
};

export type NodeActivation = {
  nodeId: CausalNodeId;
  node_code_canonical: CausalNodeId;
  node_name_canonical: string;
  node_name_commercial: string;
  motor_node_reference: CausalNodeReference;
  nodeLabel: string;
  activated: boolean;
  activationScore: number;
  confidenceScore: number;
  confidenceLevel: CausalConfidenceLevel;
  confidenceReasoning: string;
  confidenceComponents: ConfidenceComponents;
  evidenceBundleIds: string[];
  rulesActivated: CausalRuleId[];
  scenesThatSupport: string[];
  scenesThatWeaken: string[];
};

export type SceneNodeActivation = {
  sceneId: string;
  sceneName: string | null;
  canonicalRecordId: string;
  scene_confidence_level: CausalConfidenceLevel;
  scene_confidence_reasoning: string;
  scene_reentry_reason: CausalReason<CausalReentryReasonCode>[];
  scene_expert_review_reason: CausalReason<CausalExpertReviewReasonCode>[];
  node_activations: NodeActivation[];
  evidence_bundle_ids: string[];
  unresolved_contradictions: string[];
  structural_gaps: string[];
  evidence_that_supports: CausalEvidenceItem[];
  evidence_that_weakens: CausalEvidenceItem[];
};

export type CausalPath = {
  id: string;
  nodeIds: CausalNodeId[];
  label: string;
  confidenceScore: number;
  confidenceLevel: CausalConfidenceLevel;
  confidenceReasoning: string;
  rationale: string;
};

export type NarrativeAudience =
  | "expert_internal"
  | "consultant_preparation"
  | "client_safe_preview";

export type NarrativeVariantSelection = {
  variantId: string;
  templateId: string;
  selectedForNode: CausalNodeId | null;
  selectedForPath: string | null;
  audience: NarrativeAudience;
  severity: "low" | "medium" | "high";
  recursionDetected: boolean;
  causalConfidence: CausalConfidenceLevel;
  trenchQuote: string | null;
  boundary: "preliminary_auditable_narrative";
  reason: string;
};

export type ReentryDecision = {
  needsReentry: boolean;
  reasonCodes: CausalReason<CausalReentryReasonCode>[];
  reasons: string[];
  suggestedFocus: string[];
};

export type ExpertReviewFlag = {
  needsExpertReview: boolean;
  reasonCodes: CausalReason<CausalExpertReviewReasonCode>[];
  reasons: string[];
  severity: "none" | "moderate" | "high";
};

export type CausalPersistenceContract = {
  prepared: boolean;
  tables: string[];
  sqlFile: string;
  routePersistsOutput: boolean;
  note: string;
};

export type CausalPersistenceResult = {
  persisted: boolean;
  session_causal_output_id: string | null;
  scene_causal_activation_count: number;
  causal_rule_execution_count: number;
};

export type PreliminaryDiagnosticOutput = {
  schema_version: "capa2_preliminary_diagnostic_mvp_v3";
  session_id: string;
  generated_at: string;
  source: {
    session_intermediate_output_id: string | null;
    canonical_record_ids: string[];
    scene_ids: string[];
    instrument_version: string | null;
  };
  selected_nodes_scope: CausalNodeId[];
  node_equivalence_map: CausalNodeDefinition[];
  mvp_scope_note: string;
  root_node_probable: NodeActivation | null;
  root_node_probable_within_mvp_scope: NodeActivation | null;
  secondary_nodes_activated: NodeActivation[];
  scene_node_activations: SceneNodeActivation[];
  causal_path_probable: CausalPath | null;
  evidence_bundle_used: EvidenceBundle[];
  evidence_that_supports: CausalEvidenceItem[];
  evidence_that_weakens: CausalEvidenceItem[];
  scenes_that_support: Array<{ sceneId: string; sceneName: string | null }>;
  scenes_that_weaken: Array<{ sceneId: string; sceneName: string | null }>;
  rules_activated: CausalRule[];
  unresolved_contradictions: string[];
  relevant_structural_gaps: string[];
  confidence_level: CausalConfidenceLevel;
  confidence_reasoning: string;
  confidence_components: ConfidenceComponents;
  needs_reentry: boolean;
  reentry_reason: CausalReason<CausalReentryReasonCode>[];
  reentry_decision: ReentryDecision;
  needs_expert_review: boolean;
  expert_review_reason: CausalReason<CausalExpertReviewReasonCode>[];
  expert_review_flag: ExpertReviewFlag;
  narrative_variant_selection: NarrativeVariantSelection;
  preliminary_narrative: string;
  persistence_contract: CausalPersistenceContract;
  boundary: {
    does_not_produce_final_truth: true;
    does_not_replace_expert_judgment: true;
    does_not_generate_final_inevitability_theorem: true;
    root_node_is_limited_to_mvp_scope: true;
  };
};
