import type { EscenaEvidencial } from "../transduction/evidential-scene-types";

export type SceneSetState =
  | "collecting"
  | "aggregation_eligible"
  | "blocked_by_insufficient_scenes"
  | "superseded"
  | "archived";

export type AggregationIndexState =
  | "building"
  | "built"
  | "rejected"
  | "superseded"
  | "archived";

export type PeliculaCausalAgregadaState =
  | "scenes_received"
  | "aggregation_eligible"
  | "index_built"
  | "pattern_identified"
  | "loss_estimated"
  | "composed"
  | "aggregated"
  | "blocked_by_insufficient_scenes"
  | "manual_review_required"
  | "superseded"
  | "archived";

export interface SceneSet {
  scene_set_id: string;
  case_id: string;
  escena_evidencial_refs: string[];
  inclusion_rule: string;
  minimum_scene_rule: number;
  excluded_scene_refs: string[];
  governance_issue_refs: string[];
  state: SceneSetState;
  version: string;
  audit_log: Array<Record<string, unknown>>;
}

export interface AggregationIndex {
  aggregation_index_id: string;
  scene_set_id: string;
  indexed_dimensions: string[];
  actor_role_index: Record<string, string[]>;
  object_index: Record<string, string[]>;
  event_index: Record<string, string[]>;
  state_index: Record<string, string[]>;
  inconsistency_index: Record<string, string[]>;
  feedback_index: Record<string, string[]>;
  b7_boundary_index: Record<string, string[]>;
  state: AggregationIndexState;
  audit_log: Array<Record<string, unknown>>;
}

export interface PeliculaCausalAgregada {
  pelicula_id: string;
  case_id: string;
  scene_set_ref: string;
  aggregation_index_ref: string;
  pattern_refs: string[];
  monetizable_signal_refs: string[];
  loss_estimate_refs: string[];
  ahe_blockage_refs: string[];
  governance_issue_refs: string[];
  readiness_decision_ref: string;
  state: PeliculaCausalAgregadaState;
  version: string;
  audit_log: Array<Record<string, unknown>>;
  b7_boundary: {
    preserved_as_non_diagnostic: boolean;
    no_diagnostic_outputs_created: false;
  };
}

export interface CausalMovieAggregationRunnerInput {
  case_id: string;
  escenas_evidenciales: EscenaEvidencial[];
  options?: {
    minimum_validated_scenes?: number;
    version?: string;
  };
}

export interface CausalMovieAggregationRunnerResult {
  ok: boolean;
  scene_set: SceneSet;
  aggregation_index?: AggregationIndex;
  pelicula_causal_agregada?: PeliculaCausalAgregada;
  blocked_reason?: string;
  governance_issue_refs: string[];
  readiness_decision_ref: string;
  no_go: {
    diagnosis_created: false;
    client_narrative_created: false;
    registry_created: false;
    ir_created: false;
    export_created: false;
    b7_promoted_to_diagnosis: false;
    monetizable_signal_promoted_to_final: false;
  };
  materiality: {
    level: "L6 service_present";
    marker_candidate: "PF_SUP_04_MATERIALITY_MARKER";
    implementation_scope: "local_pure_service_only";
  };
}

