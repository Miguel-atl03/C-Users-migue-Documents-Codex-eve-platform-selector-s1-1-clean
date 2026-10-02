import type { Runtime4020ToL8BridgeResult } from "../runtime-bridge/runtime-40-20-l8-bridge-types";

export type F5CLocalBindingStatus =
  | "materialized"
  | "pending"
  | "blocked"
  | "requires_review"
  | "deferred"
  | "not_applicable";

export type F5CLocalAllowedConsumer =
  | "runtime_only"
  | "evidence_bundle"
  | "mdsb_candidate"
  | "control_plane_summary"
  | "none";

export type F5CLocalContaminationRisk =
  | "free_text_to_structural_fact"
  | "b7_to_diagnostic"
  | "satisfaction_to_feedback"
  | "no_traceability"
  | "delivery_boundary_violation"
  | "export_boundary_violation"
  | "runtime_full_boundary_violation"
  | "none";

export type F5CLocalObjectDefinitionRef =
  | "ActivityDeclaredByUser"
  | "SceneCanonicalRecord"
  | "EvidenceBundle"
  | "ActoObservable"
  | "EscenaEvidencial"
  | "SceneSet"
  | "AggregationIndex"
  | "PeliculaCausalAgregada"
  | "SynthesisCase"
  | "DeliveryBoundary"
  | "OutputHandoffRecord"
  | "ReceiverFeedbackObject"
  | "OperationalExceptionEvidence"
  | "PreclassificationRecord"
  | "NoRenderZone"
  | "B3B7AlignmentDelta"
  | "GovernanceIssue"
  | "GapObject"
  | "CanonicalRouteException"
  | "TransductionBlocker"
  | "ExportBlocker"
  | "ReadinessDecision"
  | "MaterialityMarkerEvaluation";

export interface F5CLocalRuntimeObjectBinding {
  binding_id: string;
  source_stage:
    | "RUNTIME_BRIDGE"
    | "B3"
    | "B7"
    | "PF_SUP_03"
    | "PF_SUP_04"
    | "PF_SUP_05"
    | "MATERIALITY_EVALUATOR";
  source_ref: string;
  object_definition_ref: F5CLocalObjectDefinitionRef;
  object_state: string;
  binding_status: F5CLocalBindingStatus;
  binding_authority:
    | "runtime_gate"
    | "object_inventory_service"
    | "review_control"
    | "methodological_authority"
    | "local_binding_service";
  binding_confidence: "low" | "medium" | "high";
  blocks_handoff: boolean;
  allowed_consumers: F5CLocalAllowedConsumer[];
  contamination_risk: F5CLocalContaminationRisk;
  reason: string;
  governance_issue_refs: string[];
}

export interface F5CLocalObjectMaterializationEvent {
  materialization_event_id: string;
  binding_id: string;
  object_definition_ref: F5CLocalObjectDefinitionRef;
  event_type: "created_or_touched" | "state_checked" | "blocked" | "deferred";
  source_stage: string;
  audit_log: Array<Record<string, unknown>>;
}

export interface F5CLocalBindingInput {
  case_id: string;
  runtime_bridge_result: Runtime4020ToL8BridgeResult;
  options?: {
    version?: string;
  };
}

export interface F5CLocalBindingResult {
  ok: boolean;
  case_id: string;
  bindings: F5CLocalRuntimeObjectBinding[];
  materialization_events: F5CLocalObjectMaterializationEvent[];
  binding_blocks: F5CLocalRuntimeObjectBinding[];
  deferred_bindings: F5CLocalRuntimeObjectBinding[];
  review_required: F5CLocalRuntimeObjectBinding[];
  governance_issue_refs: string[];
  no_go: {
    object_inventory_real_opened: false;
    f5c_real_opened: false;
    runtime_40_20_full_opened: false;
    diagnosis_created: false;
    registry_created: false;
    ir_created: false;
    export_created: false;
    delivered_created: false;
    delivery_authorized: false;
    supabase_touched: false;
    sql_created: false;
    env_read: false;
  };
  materiality: {
    level: "f5c_local_binding_readiness";
    local_only: true;
    production_integration: false;
    object_inventory_real_opened: false;
    f5c_real_opened: false;
    next_authorization_required: true;
  };
}
