import type {
  MotherGenericSheetExtract,
  RuntimeBaseInteractionExtract,
  RuntimeCatalogLoaderResult,
  RuntimeCausalInteractionExtract,
  RuntimeGenericSheetExtract,
  SourceRowTrace,
} from "../catalog-loader/runtime-40-20-rector-catalog-loader-types";

export type RuntimeCanonicalizationStatus =
  | "normalized"
  | "normalized_with_warnings"
  | "blocked_missing_required_field"
  | "blocked_invalid_reference"
  | "manual_review_required";

export type RuntimeInteractionGroup = "base" | "causal";

export interface RuntimeCanonicalTrace extends SourceRowTrace {
  canonicalization_status: RuntimeCanonicalizationStatus;
  warnings: string[];
  blockers: string[];
}

export interface RuntimeInteractionDefinitionCandidate
  extends RuntimeCanonicalTrace {
  runtime_interaction_id: string;
  interaction_group: RuntimeInteractionGroup;
  visible_text: string;
  source_refs: string[];
  ui_component?: string;
  trigger_condition?: string;
  canonical_variables?: string[];
  counts_as_base: boolean;
  counts_as_causal: boolean;
}

export interface RuntimeSourceNodeRegistryCandidate
  extends RuntimeCanonicalTrace {
  source_node_ref: string;
  source_code?: string;
  source_block?: string;
  source_question_code?: string;
  node_label?: string;
  source_document_version?: string;
}

export interface RuntimeInteractionSourceMappingCandidate
  extends RuntimeCanonicalTrace {
  runtime_interaction_id: string;
  source_node_ref: string;
  mapping_role:
    | "primary"
    | "secondary"
    | "critical_route"
    | "clarification"
    | "derivation"
    | "unknown";
}

export interface RuntimeSubfieldSchemaCandidate extends RuntimeCanonicalTrace {
  runtime_interaction_id: string;
  subfield_name: string;
  required: boolean;
  epistemic_policy?: string;
}

export interface RuntimeCanonicalVariableMapCandidate
  extends RuntimeCanonicalTrace {
  runtime_interaction_id?: string;
  variable_name: string;
  route_id?: string;
  required: boolean;
  derived: boolean;
}

export interface RuntimeBranchingRuleCandidate extends RuntimeCanonicalTrace {
  rule_id?: string;
  runtime_interaction_id?: string;
  trigger_signal?: string;
  reentry_target?: string;
  budget_effect?: string;
}

export interface RuntimeCriticalRouteCandidate extends RuntimeCanonicalTrace {
  route_id: string;
  route_family: "B0" | "B2" | "B3" | "B7" | "CrossRoute" | "unknown";
  required_variables: string[];
}

export interface RuntimeSemanticGateCandidate extends RuntimeCanonicalTrace {
  gate_id: string;
  gate_family: "SEM";
  target_term?: string;
}

export interface RuntimeProcessStateTimerGateCandidate
  extends RuntimeCanonicalTrace {
  gate_id: string;
  gate_family: "PST";
  awaited_event?: string;
  release_condition?: string;
  timer_rule?: string;
}

export interface RuntimeReadinessRuleCandidate extends RuntimeCanonicalTrace {
  readiness_rule_id?: string;
  readiness_state?: string;
  reentry_target?: string;
  manual_review_required?: boolean;
}

export interface RuntimeQARuleCandidate extends RuntimeCanonicalTrace {
  qa_id?: string;
  qa_name?: string;
  blocking: boolean;
}

export interface RuntimeImplementationDictionaryCandidate
  extends RuntimeCanonicalTrace {
  dictionary_name?: string;
  key?: string;
  value?: string;
}

export type RuntimeCatalogIntegrityGateId =
  | "T-003"
  | "T-004"
  | "T-005"
  | "T-006"
  | "T-007"
  | "T-008"
  | "T-009"
  | "T-010"
  | "T-011"
  | "T-012"
  | "T-013"
  | "T-015"
  | "T-018";

export interface RuntimeCatalogIntegrityGateResult {
  gate_id: RuntimeCatalogIntegrityGateId;
  gate_name: string;
  passed: boolean;
  severity: "blocking" | "warning";
  reason: string;
  affected_refs: string[];
}

export interface RuntimeCatalogCanonicalModel {
  interaction_definitions: RuntimeInteractionDefinitionCandidate[];
  source_node_registry: RuntimeSourceNodeRegistryCandidate[];
  interaction_source_mappings: RuntimeInteractionSourceMappingCandidate[];
  subfield_schemas: RuntimeSubfieldSchemaCandidate[];
  canonical_variable_maps: RuntimeCanonicalVariableMapCandidate[];
  branching_rules: RuntimeBranchingRuleCandidate[];
  critical_routes: RuntimeCriticalRouteCandidate[];
  semantic_gates: RuntimeSemanticGateCandidate[];
  process_state_timer_gates: RuntimeProcessStateTimerGateCandidate[];
  readiness_rules: RuntimeReadinessRuleCandidate[];
  qa_rules: RuntimeQARuleCandidate[];
  implementation_dictionaries: RuntimeImplementationDictionaryCandidate[];
}

export interface RuntimeCatalogCanonicalizationReport {
  base_interaction_count: number;
  causal_interaction_count: number;
  source_node_count: number;
  mapping_count: number;
  subfield_schema_count: number;
  canonical_variable_count: number;
  critical_route_count: number;
  semantic_gate_count: number;
  process_state_timer_gate_count: number;
  qa_rule_count: number;
  blocking_gate_failure_count: number;
  warning_count: number;
  catalog_activation_allowed: false;
}

export interface RuntimeCatalogCanonicalizationNoGoCheck {
  no_go_triggered: boolean;
  blockers: string[];
  runtime_40_20_started: false;
  catalog_activated: false;
  supabase_touched: false;
  sql_executed: false;
  endpoint_created: false;
  registry_live_db_created: false;
  ir_real_created: false;
  object_inventory_real_opened: false;
  f5c_real_opened: false;
  export_created: false;
  diagnosis_created: false;
  delivered_created: false;
}

export interface RuntimeCatalogCanonicalizationInput {
  case_id: string;
  loader_result: RuntimeCatalogLoaderResult;
  options?: {
    version?: string;
  };
}

export interface RuntimeCatalogCanonicalizationResult {
  ok: boolean;
  case_id: string;
  canonical_model: RuntimeCatalogCanonicalModel;
  integrity_gate_results: RuntimeCatalogIntegrityGateResult[];
  canonicalization_report: RuntimeCatalogCanonicalizationReport;
  no_go_check: RuntimeCatalogCanonicalizationNoGoCheck;
  blocked_reason?: string;
  materiality: {
    level: "runtime_40_20_catalog_canonicalization_and_integrity_qa";
    local_only: true;
    catalog_activation_allowed: false;
    runtime_40_20_started: false;
    next_authorization_required: true;
  };
}

export type RuntimeCanonicalizationLoaderExtract =
  | RuntimeBaseInteractionExtract
  | RuntimeCausalInteractionExtract
  | RuntimeGenericSheetExtract
  | MotherGenericSheetExtract;
