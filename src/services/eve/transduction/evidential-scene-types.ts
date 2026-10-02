export type EvidenceBundleState =
  | "ready_for_transduction"
  | "frozen"
  | "ready_with_flags"
  | "blocked"
  | "draft"
  | "assembled"
  | "traceability_checked"
  | "conformance_checked"
  | "consistency_checked"
  | "archived";

export type ActoObservableState =
  | "captured"
  | "evidence_linked"
  | "accepted"
  | "rejected"
  | "requires_review"
  | "archived";

export type EscenaEvidencialState =
  | "constructing"
  | "with_observable_acts"
  | "with_mmabp_elements"
  | "with_vsm_primary_hypothesis"
  | "with_mmabp_inconsistency"
  | "with_eve_manifestation"
  | "ahe_situated"
  | "validated"
  | "blocked_by_insufficient_causality"
  | "manual_review_required"
  | "superseded"
  | "archived";

export interface EvidenceBundleInput {
  bundle_id: string;
  case_id: string;
  state: EvidenceBundleState;
  source_ref: string;
  derivation_ref: string;
  evidence_items: EvidenceItemInput[];
  governance_issue_refs?: string[];
  readiness_decision_ref?: string;
  b7_preclassification_evidence?: B7PreclassificationEvidence[];
}

export interface EvidenceItemInput {
  evidence_item_id: string;
  source_ref: string;
  derivation_ref: string;
  literal_value: string;
  normalized_value?: string;
  actor_role_ref?: string;
  object_ref?: string;
  event_ref?: string;
  epistemic_status?: string;
}

export interface B7PreclassificationEvidence {
  source_ref: string;
  derivation_ref: string;
  signal: string;
  interpretation_limit: "non_diagnostic_preclassification_only";
}

export interface ActoObservable {
  acto_observable_id: string;
  source_evidence_ref: string;
  source_scene_ref?: string;
  actor_role_ref?: string;
  observed_action: string;
  observed_object?: string;
  material_trace: string;
  epistemic_status: string;
  state: ActoObservableState;
  issue_refs: string[];
}

export interface EscenaEvidencial {
  escena_evidencial_id: string;
  case_id: string;
  evidence_bundle_id: string;
  source_scene_refs: string[];
  observable_act_refs: string[];
  mmabp_element_refs: string[];
  vsm_hypothesis_primary_refs: string[];
  mmabp_inconsistency_refs: string[];
  eve_local_node_refs: string[];
  ahe_translation_refs: string[];
  governance_issue_refs: string[];
  readiness_decision_ref: string;
  state: EscenaEvidencialState;
  version: string;
  audit_log: Array<Record<string, unknown>>;
  b7_boundary: {
    preserved_as_non_diagnostic: boolean;
    signals_count: number;
    forbidden_outputs_created: false;
  };
}

export interface EvidentialSceneRunnerInput {
  evidence_bundle: EvidenceBundleInput;
  options?: {
    minimum_observable_acts?: number;
    version?: string;
  };
}

export interface EvidentialSceneRunnerResult {
  ok: boolean;
  escena_evidencial?: EscenaEvidencial;
  actos_observables: ActoObservable[];
  blocked_reason?: string;
  governance_issue_refs: string[];
  readiness_decision_ref: string;
  no_go: {
    diagnosis_created: false;
    registry_created: false;
    ir_created: false;
    export_created: false;
    b7_promoted_to_diagnosis: false;
  };
  materiality: {
    level: "L6 service_present";
    marker_candidate: "PF_SUP_03_MATERIALITY_MARKER";
    implementation_scope: "local_pure_service_only";
  };
}

