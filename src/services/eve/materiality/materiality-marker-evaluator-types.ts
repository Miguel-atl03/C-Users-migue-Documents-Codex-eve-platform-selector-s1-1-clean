export type MaterialityLevel =
  | "L0 absent"
  | "L1 documented_only"
  | "L2 vocabulary_only"
  | "L3 guardrail_only"
  | "L4 contract_defined"
  | "L5 schema_present"
  | "L6 service_present"
  | "L7 tested_materiality"
  | "L8 executable_materiality";

export type MaterialityFamily =
  | "PF_SUP_03"
  | "PF_SUP_04"
  | "PF_SUP_05"
  | "B3"
  | "B7";

export interface MaterialityTraceabilityInput {
  family: MaterialityFamily;
  traceability_id: string;
  implementation_allowed: boolean;
  runtime_40_20_full_allowed: boolean;
  no_go_triggered: boolean;
  files_created: string[];
  files_modified: string[];
  test_execution: {
    command: string;
    status: "passed" | "failed" | "not_run";
    reason?: string;
  };
  materiality: {
    before: MaterialityLevel;
    after: MaterialityLevel;
    marker: string;
  };
  boundary: Record<string, boolean>;
  next_authorization_required: boolean;
}

export interface MaterialityMarkerContractInput {
  marker_id: string;
  scope: MaterialityFamily;
  required_service_contract: string;
  required_schema_contracts: string[];
  required_state_machines: string[];
  required_test_contract: string;
  required_source_refs: boolean;
  required_derivation_refs: boolean;
  required_governance_issue_links: boolean;
  required_readiness_decision: boolean;
  required_allowed_consumers: boolean;
  forbidden_outputs: string[];
  materiality_level_when_absent: "L0 absent";
  materiality_level_when_contract_defined: "L4 contract_defined";
  materiality_level_when_tested: "L7 tested_materiality";
  no_go_if_false_positive: string;
}

export interface MaterialityFamilyEvaluation {
  family: MaterialityFamily;
  marker_id: string;
  accepted_level: "L6 service_present";
  service_present: boolean;
  executable_test_present: boolean;
  executable_test_passed: boolean;
  no_go_triggered: false;
  runtime_40_20_full_opened: false;
  forbidden_outputs_clear: boolean;
  next_authorization_required: true;
  accepted_as_l6_only: true;
  not_l7: true;
  not_l8: true;
  findings: string[];
}

export interface MaterialityMarkerEvaluatorInput {
  traceability_records: MaterialityTraceabilityInput[];
  marker_contracts: MaterialityMarkerContractInput[];
}

export interface MaterialityMarkerEvaluatorResult {
  ok: boolean;
  accepted_level: "L6 service_present";
  families_evaluated: MaterialityFamilyEvaluation[];
  closure_summary: {
    total_families: number;
    accepted_l6_count: number;
    blocked_count: number;
    failed_test_count: number;
    no_go_count: number;
  };
  no_go: {
    runtime_40_20_full_opened: false;
    diagnosis_created: false;
    registry_created: false;
    ir_created: false;
    export_created: false;
    sql_created: false;
    supabase_touched: false;
    env_read: false;
    l7_claimed: false;
    l8_claimed: false;
  };
  materiality: {
    level: "L6 service_present";
    implementation_scope: "local_materiality_evaluator_only";
    next_authorization_required: true;
  };
}
