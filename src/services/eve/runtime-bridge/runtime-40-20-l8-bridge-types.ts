import type { L8LocalPfChainHandoffResult } from "../materiality/l8-local-pf-chain-handoff-types";
import type {
  MaterialityMarkerContractInput,
  MaterialityTraceabilityInput,
} from "../materiality/materiality-marker-evaluator-types";

export type RuntimeSourceEntityType =
  | "evidence_item"
  | "canonical_variable_record"
  | "readiness_gap_record"
  | "readiness_decision_record"
  | "structural_candidate_record";

export interface RuntimeLikeEntity {
  runtime_entity_id: string;
  entity_type: RuntimeSourceEntityType;
  case_id: string;
  scene_id?: string;
  source_ref: string;
  derivation_ref: string;
  route_id?: string;
  variable_name?: string;
  literal_value?: string;
  normalized_value?: string;
  state?: string;
  metadata?: Record<string, unknown>;
}

export interface Runtime4020ToL8BridgeInput {
  case_id: string;
  runtime_entities: RuntimeLikeEntity[];
  materiality_traceability_records: MaterialityTraceabilityInput[];
  materiality_marker_contracts: MaterialityMarkerContractInput[];
  options?: {
    minimum_validated_scenes?: number;
    version?: string;
  };
}

export interface Runtime4020BridgeHandoff {
  from: "RuntimeLikeEntity";
  to: "B3" | "B7" | "EvidenceBundle" | "L8LocalPfChainHandoff";
  source_runtime_entity_ids: string[];
  allowed: boolean;
  blocked_reason?: string;
}

export interface Runtime4020ToL8BridgeResult {
  ok: boolean;
  case_id: string;
  handoffs: Runtime4020BridgeHandoff[];
  l8_result?: L8LocalPfChainHandoffResult;
  blocked_reason?: string;
  governance_issue_refs: string[];
  no_go: {
    runtime_40_20_full_opened: false;
    object_inventory_real_opened: false;
    f5c_real_opened: false;
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
    level: "runtime_bridge_local_readiness";
    consumes_l8_local_chain: true;
    production_integration: false;
    runtime_40_20_full_opened: false;
    next_authorization_required: true;
  };
}
