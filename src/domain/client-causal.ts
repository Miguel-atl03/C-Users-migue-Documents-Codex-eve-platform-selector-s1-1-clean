import type {
  CausalConfidenceLevel,
  CausalEvidenceItem,
  CausalNodeId,
  CausalPath,
  EvidenceBundle,
  NodeActivation,
  PreliminaryDiagnosticOutput,
} from "@/domain/causal";

export type ClientAggregationSchemaVersion =
  "capa2_5_client_causal_aggregation_mvp_v1";

export type RoleObservationPosition = {
  sesion_id: string;
  usuario_id: string | null;
  role_label: string | null;
  observation_scope: "partial_role_lens_on_client_system";
  interpretation_unit: "client_system";
  note: string;
};

export type ClientSessionCausalInput = {
  empresa_id: string;
  sesion_id: string;
  usuario_id: string | null;
  role_label: string | null;
  role_observation_position: RoleObservationPosition;
  session_causal_output_id: string;
  output: PreliminaryDiagnosticOutput;
};

export type ClientNodeAggregationKind =
  | "recurrent"
  | "local"
  | "dominant_transversal"
  | "contradictory"
  | "recursive_echo"
  | "symptom_transversal";

export type ClientCausalNodeKind = "nuclear" | "complementary";

export type ClientAggregationMode =
  | "single_nuclear_root"
  | "nuclear_root_with_complements"
  | "compound_nuclear_configuration";

export type ClientNodeAggregation = {
  node_id: CausalNodeId;
  node_label: string;
  node_kind: ClientCausalNodeKind;
  aggregation_kind: ClientNodeAggregationKind;
  session_count_supporting: number;
  session_count_weakening: number;
  session_coverage_ratio: number;
  weighted_support_score: number;
  weighted_weaken_score: number;
  average_confidence_score: number;
  confidence_level: CausalConfidenceLevel;
  dominant_session_ids: string[];
  local_session_ids: string[];
  evidence_bundle_ids: string[];
  interpretation: string;
};

export type RecursiveRoleContribution = {
  sesion_id: string;
  usuario_id: string | null;
  role_label: string | null;
  contribution_kind:
    | "supports_client_root"
    | "weakens_client_root"
    | "reveals_local_node"
    | "reveals_recursive_echo"
    | "reveals_cross_session_contradiction";
  node_ids: CausalNodeId[];
  evidence_bundle_ids: string[];
  contribution_summary: string;
};

export type CrossSessionSupportMap = {
  node_id: CausalNodeId;
  sessions_that_support: Array<{
    sesion_id: string;
    session_causal_output_id: string;
    role_label: string | null;
    root_in_session: boolean;
    activation: NodeActivation | null;
    dominant_bundles: EvidenceBundle[];
  }>;
  sessions_that_weaken: Array<{
    sesion_id: string;
    role_label: string | null;
    weaken_evidence: CausalEvidenceItem[];
  }>;
};

export type CrossSessionContradiction = {
  id: string;
  contradiction_type:
    | "root_split"
    | "support_vs_weaken"
    | "confidence_mismatch"
    | "local_vs_transversal"
    | "symptom_vs_root";
  node_ids: CausalNodeId[];
  supporting_session_ids: string[];
  weakening_session_ids: string[];
  description: string;
  severity: "low" | "medium" | "high";
  requires_expert_review: boolean;
};

export type ClientReentryDecision = {
  needs_reentry_client: boolean;
  reason_codes: Array<
    | "insufficient_session_coverage"
    | "cross_session_contradiction"
    | "low_confidence_client_root"
    | "missing_role_lens"
    | "symptom_root_ambiguity"
  >;
  suggested_session_ids: string[];
  suggested_focus: string[];
};

export type ClientExpertReviewFlag = {
  needs_expert_review_client: boolean;
  reason_codes: Array<
    | "multi_role_composition_required"
    | "cross_session_conflict"
    | "weak_client_root_margin"
    | "dominant_symptom_pattern"
    | "client_narrative_not_final"
  >;
  severity: "none" | "moderate" | "high";
  reasons: string[];
};

export type PreliminaryClientNarrative = {
  boundary: "preliminary_client_causal_narrative";
  text: string;
  sessions_used: string[];
  sessions_that_tension: string[];
  not_final_client_narrative: true;
  not_expert_judgment: true;
};

export type ClientCausalAggregationOutput = {
  schema_version: ClientAggregationSchemaVersion;
  empresa_id: string;
  client_interpretation_unit: "client_system";
  generated_at: string;
  source: {
    session_causal_output_ids: string[];
    sesion_ids: string[];
    primary_source: "session_causal_outputs";
    fallback_sources: Array<
      "scene_causal_activations" | "causal_rule_executions" | "scene_canonical_records" | "session_intermediate_output"
    >;
  };
  role_perspective_map: RoleObservationPosition[];
  recursive_role_contribution_map: RecursiveRoleContribution[];
  aggregation_mode: ClientAggregationMode;
  client_root_node_probable: ClientNodeAggregation | null;
  primary_nuclear_node: ClientNodeAggregation | null;
  secondary_nuclear_node: ClientNodeAggregation | null;
  complementary_nodes: ClientNodeAggregation[];
  symptom_transversal_nodes: ClientNodeAggregation[];
  local_manifestation_nodes: ClientNodeAggregation[];
  cross_session_nodes_recurrent: ClientNodeAggregation[];
  cross_session_nodes_local: ClientNodeAggregation[];
  cross_session_nodes_dominant_transversal: ClientNodeAggregation[];
  cross_session_nodes_recursive: ClientNodeAggregation[];
  cross_session_nodes_symptom_transversal: ClientNodeAggregation[];
  cross_session_contradictions: CrossSessionContradiction[];
  cross_session_support_map: CrossSessionSupportMap[];
  client_causal_path_probable: CausalPath | null;
  sessions_that_support: Array<{
    sesion_id: string;
    role_label: string | null;
    node_ids: CausalNodeId[];
  }>;
  sessions_that_weaken: Array<{
    sesion_id: string;
    role_label: string | null;
    node_ids: CausalNodeId[];
  }>;
  confidence_level_client: CausalConfidenceLevel;
  confidence_reasoning_client: string;
  needs_reentry_client: boolean;
  reentry_decision_client: ClientReentryDecision;
  needs_expert_review_client: boolean;
  expert_review_flag_client: ClientExpertReviewFlag;
  preliminary_client_narrative: PreliminaryClientNarrative;
  boundary: {
    does_not_produce_final_truth: true;
    does_not_replace_expert_judgment: true;
    does_not_generate_final_inevitability_theorem: true;
    integrates_partial_role_lenses_into_single_client_reading: true;
  };
};
