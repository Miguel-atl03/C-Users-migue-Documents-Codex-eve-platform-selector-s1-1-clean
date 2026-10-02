import type { PeliculaCausalAgregada } from "../aggregation/causal-movie-types";

export type SynthesisCaseState =
  | "creating"
  | "traceability_checked"
  | "ready_for_expert_draft"
  | "blocked_by_weak_traceability"
  | "manual_review_required"
  | "authorization_blocked"
  | "superseded"
  | "archived";

export type DeliveryBoundaryState =
  | "created"
  | "authorization_checked"
  | "delivery_blocked"
  | "delivery_authorized"
  | "manual_review_required"
  | "archived";

export interface SynthesisCase {
  synthesis_case_id: string;
  case_id: string;
  pelicula_causal_ref: string;
  traceability_manifest: {
    pelicula_state: string;
    scene_set_ref?: string;
    aggregation_index_ref?: string;
    source_refs_count: number;
    governance_issue_refs_count: number;
  };
  expert_review_required: true;
  weak_traceability_flags: string[];
  authorization_boundary_ref: string;
  governance_issue_refs: string[];
  readiness_decision_ref: string;
  state: SynthesisCaseState;
  version: string;
  audit_log: Array<Record<string, unknown>>;
}

export interface DeliveryBoundary {
  delivery_boundary_id: string;
  case_id: string;
  synthesis_case_ref: string;
  state: DeliveryBoundaryState;
  authorization_checked: true;
  delivery_authorized: false;
  delivery_block_reason: "delivery_not_authorized_in_this_tramo";
  forbidden_outputs: Array<
    | "diagnostico_experto_final_delivered"
    | "client_narrative"
    | "consultive_recommendation"
    | "teorema_inevitabilidad"
    | "export_code_package_generated"
  >;
  governance_issue_refs: string[];
  readiness_decision_ref: string;
  audit_log: Array<Record<string, unknown>>;
}

export interface ExpertSynthesisContractInput {
  case_id: string;
  pelicula_causal_agregada: PeliculaCausalAgregada;
  options?: {
    version?: string;
    require_expert_review?: boolean;
  };
}

export interface ExpertSynthesisContractResult {
  ok: boolean;
  synthesis_case: SynthesisCase;
  delivery_boundary: DeliveryBoundary;
  blocked_reason?: string;
  governance_issue_refs: string[];
  readiness_decision_ref: string;
  no_go: {
    diagnostico_experto_final_delivered_created: false;
    client_narrative_created: false;
    consultive_recommendation_created: false;
    teorema_inevitabilidad_created: false;
    export_code_package_created: false;
    registry_created: false;
    ir_created: false;
    runtime_40_20_full_opened: false;
  };
  materiality: {
    level: "L6 service_present";
    marker_candidate: "PF_SUP_05_MATERIALITY_MARKER";
    implementation_scope: "local_pure_service_only";
  };
}

