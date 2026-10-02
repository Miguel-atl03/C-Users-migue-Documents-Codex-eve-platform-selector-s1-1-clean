export type ReceiverFeedbackObjectState =
  | "captured"
  | "route_validated"
  | "operationally_relevant"
  | "rejected_as_satisfaction_only"
  | "gap_flagged"
  | "rework_triggered"
  | "blocked_by_missing_canonical_route"
  | "frozen"
  | "archived";

export type OperationalExceptionEvidenceState =
  | "detected"
  | "route_checked"
  | "derived"
  | "unresolved"
  | "classified"
  | "linked_to_issue"
  | "ready_for_bundle"
  | "frozen"
  | "archived";

export type B3IssueType =
  | "CanonicalRouteException"
  | "GapObject"
  | "OperationalExceptionEvidence"
  | "None";

export interface B3ReceiverFeedbackInput {
  case_id: string;
  scene_id: string;
  output_handoff_ref: string;
  receiver_satisfaction_value?: string;
  receiver_feedback_exists?: boolean;
  receiver_feedback_literal?: string;
  receiver_feedback_type?: string;
  receiver_feedback_route_status:
    | "route_validated"
    | "route_missing"
    | "gap_unknown"
    | "satisfaction_only"
    | "absent";
  canonical_route_ref?: "B3/3.13a/receiver_feedback";
  source_ref?: string;
  derivation_ref?: string;
  delivery_failure_known?: boolean;
}

export interface ReceiverFeedbackObject {
  receiver_feedback_id: string;
  case_id: string;
  scene_id: string;
  output_handoff_ref: string;
  receiver_satisfaction_value?: string;
  receiver_feedback_exists: boolean;
  receiver_feedback_literal?: string;
  receiver_feedback_type?: string;
  receiver_feedback_route_status: string;
  canonical_route_ref?: string;
  operational_impact: string[];
  allowed_consumers: string[];
  forbidden_consumers: string[];
  governance_issue_refs: string[];
  state: ReceiverFeedbackObjectState;
  version: string;
  audit_log: Array<Record<string, unknown>>;
}

export interface OperationalExceptionEvidence {
  exception_evidence_id: string;
  subtype: "transformation_exception" | "receiver_feedback";
  case_id: string;
  scene_id: string;
  block_id: "B3";
  route_code: "R9";
  canonical_value: string;
  literal_evidence?: string;
  source_ref?: string;
  derivation_ref?: string;
  issue_links: string[];
  severity: "low" | "medium" | "high" | "critical";
  state: OperationalExceptionEvidenceState;
  version: string;
  audit_log: Array<Record<string, unknown>>;
}

export interface B3B7AlignmentDelta {
  alignment_delta_id: string;
  case_id: string;
  scene_id: string;
  b3_receiver_feedback_ref?: string;
  b3_route_status: string;
  b7_boundary_untouched: true;
  b7_not_promoted_to_oee: true;
  governance_issue_refs: string[];
  state: "created" | "blocked" | "ready_for_bundle";
  audit_log: Array<Record<string, unknown>>;
}

export interface B3ReceiverFeedbackMaterializerInput {
  b3_input: B3ReceiverFeedbackInput;
  options?: {
    version?: string;
  };
}

export interface B3ReceiverFeedbackMaterializerResult {
  ok: boolean;
  receiver_feedback_object?: ReceiverFeedbackObject;
  operational_exception_evidence?: OperationalExceptionEvidence;
  b3_b7_alignment_delta: B3B7AlignmentDelta;
  governance_issue_refs: string[];
  readiness_decision_ref: string;
  blocked_reason?: string;
  issue_type: B3IssueType;
  no_go: {
    satisfaction_promoted_to_feedback: false;
    feedback_created_without_route: false;
    feedback_created_without_source_ref: false;
    feedback_created_without_derivation_ref: false;
    b7_promoted_to_oee: false;
    diagnosis_created: false;
    registry_created: false;
    ir_created: false;
    export_created: false;
    runtime_40_20_full_opened: false;
  };
  materiality: {
    level: "L6 service_present";
    marker_candidate: "B3_FIRST_CLASS_MATERIALITY_MARKER";
    implementation_scope: "local_pure_service_only";
  };
}

