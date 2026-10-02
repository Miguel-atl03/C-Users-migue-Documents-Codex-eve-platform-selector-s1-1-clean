import type { L8LocalPfChainHandoffResult } from "../materiality/l8-local-pf-chain-handoff-types";
import type { F5CLocalBindingResult } from "../object-binding/f5c-local-binding-types";

export type F6LocalMembraneState =
  | "draft"
  | "inputs_validated"
  | "snapshot_created"
  | "handoff_ready_local"
  | "handoff_blocked"
  | "export_blocked"
  | "review_required"
  | "archived";

export type F6LocalBoundaryDecision =
  | "local_handoff_ready"
  | "local_handoff_ready_with_restrictions"
  | "handoff_blocked"
  | "manual_review_required";

export interface F6LocalIntegrationMembraneOutbox {
  outbox_id: string;
  case_id: string;
  source_l8_ref: string;
  source_f5c_ref: string;
  target_consumer:
    | "future_parallel_production_candidate"
    | "control_plane_summary"
    | "none";
  state: F6LocalMembraneState;
  allowed_to_leave_membrane: boolean;
  restrictions: string[];
  governance_issue_refs: string[];
  audit_log: Array<Record<string, unknown>>;
}

export interface F6LocalIntegrationMembraneSnapshot {
  snapshot_id: string;
  case_id: string;
  source_l8_ref: string;
  source_f5c_ref: string;
  local_only: true;
  bindings_count: number;
  materialization_events_count: number;
  binding_blocks_count: number;
  deferred_bindings_count: number;
  review_required_count: number;
  restrictions: string[];
  checksum_like_ref: string;
  state: "created" | "blocked" | "archived";
  audit_log: Array<Record<string, unknown>>;
}

export interface F6LocalHandoffBoundaryDecision {
  decision_id: string;
  case_id: string;
  decision: F6LocalBoundaryDecision;
  allowed_consumers: Array<
    "future_parallel_production_candidate" | "control_plane_summary" | "none"
  >;
  blocked_consumers: Array<
    | "registry"
    | "IR"
    | "export"
    | "diagnosis"
    | "runtime_40_20_full"
    | "production_integration"
  >;
  reason: string;
  governance_issue_refs: string[];
}

export interface F6LocalExportBoundaryCheck {
  export_boundary_check_id: string;
  case_id: string;
  export_allowed: false;
  export_code_package_created: false;
  reason: "export_not_authorized_in_local_membrane";
  blocked_targets: Array<
    | "ExportCodePackage"
    | "DiagrammingExportPackage"
    | "IR"
    | "registry"
    | "diagnosis"
  >;
  governance_issue_refs: string[];
}

export interface F6LocalReviewControlRecord {
  review_control_id: string;
  case_id: string;
  review_required: boolean;
  reason: string;
  linked_binding_blocks: string[];
  linked_restrictions: string[];
  state: "not_required" | "required" | "archived";
  audit_log: Array<Record<string, unknown>>;
}

export interface F6LocalMembraneProjectionSummary {
  projection_summary_id: string;
  case_id: string;
  summary_only: true;
  l8_local_materiality_confirmed: boolean;
  f5c_local_binding_confirmed: boolean;
  handoff_decision: F6LocalBoundaryDecision;
  export_allowed: false;
  diagnosis_allowed: false;
  production_integration_allowed: false;
  runtime_40_20_full_allowed: false;
}

export interface F6LocalIntegrationMembraneInput {
  case_id: string;
  l8_result: L8LocalPfChainHandoffResult;
  f5c_result: F5CLocalBindingResult;
  options?: {
    version?: string;
  };
}

export interface F6LocalIntegrationMembraneResult {
  ok: boolean;
  case_id: string;
  outbox: F6LocalIntegrationMembraneOutbox;
  snapshot: F6LocalIntegrationMembraneSnapshot;
  handoff_boundary_decision: F6LocalHandoffBoundaryDecision;
  export_boundary_check: F6LocalExportBoundaryCheck;
  review_control_record: F6LocalReviewControlRecord;
  membrane_projection_summary: F6LocalMembraneProjectionSummary;
  blocked_reason?: string;
  governance_issue_refs: string[];
  no_go: {
    runtime_40_20_full_opened: false;
    object_inventory_real_opened: false;
    f5c_real_opened: false;
    integration_membrane_real_opened: false;
    production_integration_opened: false;
    control_plane_real_opened: false;
    sg_shadow_real_opened: false;
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
    level: "f6_local_membrane_readiness";
    local_only: true;
    production_integration: false;
    next_authorization_required: true;
  };
}
