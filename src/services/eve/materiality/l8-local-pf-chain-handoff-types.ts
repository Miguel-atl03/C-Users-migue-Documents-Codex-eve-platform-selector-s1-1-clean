import type { B3ReceiverFeedbackInput } from "../capa1/b3-feedback-types";
import type { B7PreclassificationInput } from "../capa1/b7-preclassification-types";
import type { EvidenceBundleInput } from "../transduction/evidential-scene-types";
import type {
  MaterialityMarkerContractInput,
  MaterialityTraceabilityInput,
} from "./materiality-marker-evaluator-types";

export interface L8LocalPfChainHandoffInput {
  case_id: string;
  b3_inputs: B3ReceiverFeedbackInput[];
  b7_inputs: B7PreclassificationInput[];
  evidence_bundles: EvidenceBundleInput[];
  materiality_traceability_records: MaterialityTraceabilityInput[];
  materiality_marker_contracts: MaterialityMarkerContractInput[];
  options?: {
    minimum_validated_scenes?: number;
    version?: string;
    force_non_aggregated_movie_for_local_test?: boolean;
  };
}

export interface L8LocalStageResult {
  stage:
    | "B3"
    | "B7"
    | "PF_SUP_03"
    | "PF_SUP_04"
    | "PF_SUP_05"
    | "MATERIALITY_EVALUATOR";
  ok: boolean;
  handoff_allowed: boolean;
  produced_refs: string[];
  blocked_reason?: string;
  governance_issue_refs: string[];
}

export interface L8LocalPfChainHandoffResult {
  ok: boolean;
  case_id: string;
  stages: L8LocalStageResult[];
  handoff_chain: Array<{
    from_stage: string;
    to_stage: string;
    object_ref: string;
    allowed: boolean;
    blocked_reason?: string;
  }>;
  final_state:
    | "l8_local_executable_materiality"
    | "blocked_by_stage_failure"
    | "blocked_by_no_go";
  materiality: {
    before: "L7 tested_materiality";
    after: "L8 executable_materiality";
    local_only: true;
    runtime_40_20_full_opened: false;
    production_integration: false;
  };
  no_go: {
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
  next_authorization_required: true;
}
