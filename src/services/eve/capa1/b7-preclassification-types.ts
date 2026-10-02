export type PreclassificationRecordState =
  | "captured"
  | "boundary_checked"
  | "signal_only_accepted"
  | "rejected"
  | "contamination_blocked"
  | "manual_review_required"
  | "frozen"
  | "archived";

export type NoRenderZoneState =
  | "created"
  | "attached_to_ir_or_export_boundary"
  | "active"
  | "superseded"
  | "archived";

export type B7ContaminationAttempt =
  | "none"
  | "structural_fact"
  | "registry"
  | "IR"
  | "export"
  | "diagnosis"
  | "OperationalExceptionEvidence";

export interface B7PreclassificationInput {
  case_id: string;
  scene_id: string;
  source_b7_ref: string;
  derivation_ref: string;
  preclassification_ahe_level_dominant?: string;
  preclassification_interpersonal_signal?: string;
  preclassification_interpersonal_note?: string;
  preclassification_interpersonal_confirmation?: string;
  preclassification_ahe_bundle_refined?: string;
  interpretation_limit?: "non_diagnostic_preclassification_only";
  attempted_consumer?: B7ContaminationAttempt;
}

export interface PreclassificationRecord {
  preclassification_id: string;
  case_id: string;
  scene_id: string;
  source_b7_ref: string;
  derivation_ref: string;
  preclassification_ahe_level_dominant?: string;
  preclassification_interpersonal_signal?: string;
  preclassification_interpersonal_note?: string;
  preclassification_interpersonal_confirmation?: string;
  preclassification_ahe_bundle_refined?: string;
  interpretation_limit: "non_diagnostic_preclassification_only";
  allowed_consumers: string[];
  forbidden_consumers: string[];
  no_render_zone: string;
  governance_issue_refs: string[];
  state: PreclassificationRecordState;
  version: string;
  audit_log: Array<Record<string, unknown>>;
}

export interface NoRenderZone {
  no_render_zone_id: string;
  case_id: string;
  scene_id: string;
  source_b7_ref: string;
  blocked_targets: Array<
    | "B7_to_structural_fact"
    | "B7_to_registry"
    | "B7_to_IR"
    | "B7_to_export"
    | "B7_to_diagnosis"
    | "B7_to_OperationalExceptionEvidence"
  >;
  state: NoRenderZoneState;
  active: true;
  governance_issue_refs: string[];
  audit_log: Array<Record<string, unknown>>;
}

export interface B7BoundaryIssue {
  issue_id: string;
  issue_type: "TransductionBlocker" | "ExportBlocker" | "GovernanceIssue" | "None";
  severity: "low" | "medium" | "high" | "critical";
  affected_gate:
    | "transduction"
    | "export"
    | "registry"
    | "IR"
    | "diagnosis"
    | "operational_exception"
    | "none";
  reason: string;
}

export interface B3B7AlignmentDeltaForB7 {
  alignment_delta_id: string;
  case_id: string;
  scene_id: string;
  b7_preclassification_ref: string;
  b7_boundary_status: "signal_only" | "contamination_blocked" | "manual_review_required";
  b3_untouched: true;
  b7_not_promoted_to_oee: true;
  governance_issue_refs: string[];
  state: "created" | "blocked" | "ready_for_bundle";
  audit_log: Array<Record<string, unknown>>;
}

export interface B7PreclassificationBoundaryInput {
  b7_input: B7PreclassificationInput;
  options?: {
    version?: string;
  };
}

export interface B7PreclassificationBoundaryResult {
  ok: boolean;
  preclassification_record: PreclassificationRecord;
  no_render_zone: NoRenderZone;
  b3_b7_alignment_delta: B3B7AlignmentDeltaForB7;
  issue: B7BoundaryIssue;
  governance_issue_refs: string[];
  readiness_decision_ref: string;
  blocked_reason?: string;
  no_go: {
    b7_promoted_to_structural_fact: false;
    b7_promoted_to_registry: false;
    b7_promoted_to_ir: false;
    b7_promoted_to_export: false;
    b7_promoted_to_diagnosis: false;
    b7_promoted_to_oee: false;
    b3_modified: false;
    diagnosis_created: false;
    registry_created: false;
    ir_created: false;
    export_created: false;
    runtime_40_20_full_opened: false;
  };
  materiality: {
    level: "L6 service_present";
    marker_candidate: "B7_FIRST_CLASS_MATERIALITY_MARKER";
    implementation_scope: "local_pure_service_only";
  };
}
