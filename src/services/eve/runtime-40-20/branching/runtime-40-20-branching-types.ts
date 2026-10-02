import type {
  RuntimeCanonicalVariableRecordCandidate,
  RuntimeCanonicalVariableServiceLocalResult,
} from "../canonical-variable/runtime-40-20-canonical-variable-types";
import type { RuntimeInteractionDefinitionCandidate } from "../catalog-canonicalization/runtime-40-20-catalog-canonicalization-types";

export type RuntimeBranchingEngineStatus =
  | "branching_candidates_ready"
  | "blocked_canonical_variables_not_ready"
  | "blocked_missing_explicit_branching_rule"
  | "blocked_unauthorized_inference_required"
  | "blocked_causal_budget_exceeded"
  | "blocked_missing_target_causal_interaction"
  | "manual_review_required_unknown_operator";

export type RuntimeBranchingRuleOperator =
  | "equals"
  | "not_equals"
  | "is_present"
  | "is_absent"
  | "contains_exact"
  | "greater_than"
  | "less_than"
  | "in_set";

export interface RuntimeBranchingRuleInput {
  branching_rule_id: string;
  source_node_ref: string;
  source_document: string;
  source_sheet: string;
  source_row_number: number;
  raw_row: Record<string, unknown>;
  trigger_canonical_variable_id: string;
  trigger_operator: RuntimeBranchingRuleOperator | string;
  trigger_value?: unknown;
  target_causal_interaction_id: string;
  budget_bucket: "causal_20";
}

export interface RuntimeBranchingRuleEvaluation {
  evaluation_id: string;
  branching_rule_id: string;
  trigger_canonical_variable_id: string;
  trigger_operator: string;
  evaluated: boolean;
  matched: boolean;
  evaluation_status:
    | "evaluation_ready"
    | "blocked_missing_variable_candidate"
    | "manual_review_required_unknown_operator";
  source_trace: {
    source_node_ref: string;
    source_document: string;
    source_sheet: string;
    source_row_number: number;
    raw_row: Record<string, unknown>;
  };
  free_inference_used: false;
  semantic_fallback_used: false;
  fuzzy_match_used: false;
}

export interface RuntimeBranchingDecisionCandidate {
  branching_decision_ref: string;
  branching_rule_id: string;
  trigger_canonical_variable_id: string;
  target_causal_interaction_id: string;
  decision_status:
    | "causal_activation_candidate_ready"
    | "blocked_missing_target_causal_interaction"
    | "blocked_causal_budget_exceeded"
    | "blocked_missing_explicit_branching_rule";
  rule_evaluation_ref: string;
  exact_rule_used: boolean;
  free_inference_used: false;
  semantic_fallback_used: false;
  fuzzy_match_used: false;
  real_branching_decision_created: false;
}

export interface RuntimeCausalInteractionActivationCandidate {
  activation_candidate_ref: string;
  target_causal_interaction_id: string;
  source_branching_decision_ref: string;
  source_branching_rule_id: string;
  activation_status: "activation_candidate_ready";
  runtime_interaction_instance_real_created: false;
  budget_consumed_real: false;
}

export interface RuntimeBranchingBudgetPreview {
  causal_limit: 20;
  causal_already_planned: number;
  causal_newly_activated: number;
  causal_activation_attempted: number;
  causal_remaining: number;
  causal_budget_exceeded: boolean;
  budget_ledger_real_created: false;
  budget_consumed_real: false;
}

export interface RuntimeBranchingAuditCandidate {
  branching_audit_ref: string;
  action: "branching_candidates_created" | "branching_blocked";
  rule_evaluations_created: number;
  decision_candidates_created: number;
  activation_candidates_created: number;
  real_audit_record_created: false;
  metadata: Record<string, unknown>;
}

export interface RuntimeBranchingNoGoCheck {
  no_go_triggered: boolean;
  blockers: string[];
  runtime_40_20_started: false;
  catalog_activated: false;
  migration_applied: false;
  supabase_touched: false;
  sql_executed: false;
  endpoint_created: false;
  real_branching_decision_created: false;
  real_budget_ledger_created: false;
  real_interaction_instance_created: false;
  real_response_persisted: false;
  real_subfield_response_created: false;
  real_evidence_item_created: false;
  real_canonical_variable_record_created: false;
  real_audit_record_created: false;
  real_runtime_records_created: false;
  business_evidence_created: false;
  registry_live_db_created: false;
  ir_real_created: false;
  object_inventory_real_opened: false;
  f5c_real_opened: false;
  export_created: false;
  diagnosis_created: false;
  delivered_created: false;
}

export interface RuntimeBranchingEngineLocalInput {
  case_id: string;
  canonical_variable_result: RuntimeCanonicalVariableServiceLocalResult;
  branching_rules: RuntimeBranchingRuleInput[];
  interaction_definitions: RuntimeInteractionDefinitionCandidate[];
  causal_already_planned?: number;
  options?: {
    version?: string;
  };
}

export interface RuntimeBranchingEngineLocalResult {
  ok: boolean;
  case_id: string;
  branching_status: RuntimeBranchingEngineStatus;
  rule_evaluations: RuntimeBranchingRuleEvaluation[];
  decision_candidates: RuntimeBranchingDecisionCandidate[];
  activation_candidates: RuntimeCausalInteractionActivationCandidate[];
  budget_preview: RuntimeBranchingBudgetPreview;
  audit_candidate: RuntimeBranchingAuditCandidate;
  no_go_check: RuntimeBranchingNoGoCheck;
  blocked_reason?: string;
  packaging_hygiene: {
    empty_windows_path_entries_removed_or_absent: boolean;
    material_files_only_required_for_next_bundle: true;
    posix_paths_required_for_next_bundle: true;
  };
  materiality: {
    level: "runtime_40_20_branching_engine_local_contract";
    local_only: true;
    real_branching_decision_created: false;
    real_budget_ledger_created: false;
    real_interaction_instance_created: false;
    runtime_40_20_started: false;
    next_authorization_required: true;
  };
}

export type RuntimeBranchingVariableCandidate =
  RuntimeCanonicalVariableRecordCandidate;
