import { assertRuntimeExecutionCoreSchemaBoundary } from "./runtime-40-20-execution-core-schema-boundary";
import type {
  RuntimeExecutionCoreColumnManifestItem,
  RuntimeExecutionCoreConstraintManifestItem,
  RuntimeExecutionCoreIndexManifestItem,
  RuntimeExecutionCoreNoGoCheck,
  RuntimeExecutionCoreSchemaContract,
  RuntimeExecutionCoreSchemaInput,
  RuntimeExecutionCoreSchemaResult,
  RuntimeExecutionCoreTableManifestItem,
  RuntimeExecutionCoreTableName,
} from "./runtime-40-20-execution-core-schema-types";

export const RUNTIME_40_20_EXECUTION_CORE_TABLES: RuntimeExecutionCoreTableName[] =
  [
    "eve_role_runtime_session",
    "eve_activity_runtime_run",
    "eve_runtime_interaction_instance",
    "eve_runtime_subfield_response",
    "eve_evidence_item",
    "eve_canonical_variable_record",
    "eve_runtime_branching_decision",
    "eve_runtime_budget_ledger",
    "eve_semantic_resolution_event",
    "eve_process_state_timer_event",
    "eve_structural_candidate_record",
    "eve_readiness_gap_record",
    "eve_readiness_decision_record",
    "eve_parallel_export_payload",
    "eve_runtime_audit_trail",
  ];

export const FORBIDDEN_RUNTIME_40_20_CATALOG_CORE_TABLES = [
  "eve_runtime_catalog_version",
  "eve_runtime_source_node_ref",
  "eve_runtime_interaction_def",
  "eve_runtime_interaction_mapping",
  "eve_runtime_subfield_schema",
  "eve_runtime_canonical_variable_map",
  "eve_runtime_branching_rule",
  "eve_runtime_critical_route",
  "eve_runtime_semantic_gate",
  "eve_runtime_process_state_timer_gate",
  "eve_runtime_readiness_rule",
  "eve_runtime_qa_rule",
  "eve_runtime_implementation_dictionary",
  "eve_runtime_catalog_import_audit",
];

const TABLE_PURPOSE: Record<RuntimeExecutionCoreTableName, string> = {
  eve_role_runtime_session:
    "Draft container for one role-level Runtime 40/20 execution session.",
  eve_activity_runtime_run:
    "Draft container for one activity questionnaire execution run.",
  eve_runtime_interaction_instance:
    "Per-run runtime interaction visibility and answer state.",
  eve_runtime_subfield_response:
    "Structured subfield response revisions with epistemic provenance.",
  eve_evidence_item:
    "Atomic evidence items derived from runtime responses.",
  eve_canonical_variable_record:
    "Canonical variable records derived during runtime execution.",
  eve_runtime_branching_decision:
    "Runtime branching and budget decisions for 40/20 flow control.",
  eve_runtime_budget_ledger:
    "Question budget ledger enforcing base and causal limits.",
  eve_semantic_resolution_event:
    "Semantic gate resolution events requiring traceable decisions.",
  eve_process_state_timer_event:
    "Process-state timer gate events and release/timeout paths.",
  eve_structural_candidate_record:
    "Draft structural candidates for later architectural production.",
  eve_readiness_gap_record:
    "Readiness gaps and reentry targets detected before export.",
  eve_readiness_decision_record:
    "Readiness decisions for each runtime run and role session.",
  eve_parallel_export_payload:
    "Draft payload envelope for future parallel production export.",
  eve_runtime_audit_trail:
    "Audit trail for draft execution-core objects and decisions.",
};

export function createRuntimeExecutionCoreSchemaContract(
  input: RuntimeExecutionCoreSchemaInput,
): RuntimeExecutionCoreSchemaResult {
  const boundary = assertRuntimeExecutionCoreSchemaBoundary({
    ...input.boundary_flags,
    catalog_activated:
      input.boundary_flags?.catalog_activated ?? input.catalog_activated,
    runtime_40_20_started:
      input.boundary_flags?.runtime_40_20_started ??
      input.runtime_40_20_started,
  });

  const blockers = [...boundary.blockers];
  if (!input.catalog_import_dry_run_ready) {
    blockers.push("catalog_import_dry_run_not_ready");
  }
  if (input.catalog_migration_applied) {
    blockers.push("catalog_migration_already_applied_forbidden_in_this_tramo");
  }
  if (input.catalog_activated) {
    blockers.push("catalog_activated_forbidden");
  }
  if (input.runtime_40_20_started) {
    blockers.push("runtime_40_20_started_forbidden");
  }

  const noGoCheck: RuntimeExecutionCoreNoGoCheck = {
    ...boundary.flags,
    no_go_triggered: blockers.length > 0,
    blockers,
  };

  const ok = blockers.length === 0;

  return {
    ok,
    case_id: input.case_id,
    status: ok ? "ready" : "blocked",
    schema_contract: createSchemaContract(),
    no_go_check: noGoCheck,
    blocked_reason: ok ? undefined : blockers.join("; "),
    materiality: {
      level: "runtime_40_20_execution_core_schema_contract",
      local_only: true,
      migration_creation_allowed: true,
      migration_application_allowed: false,
      catalog_activation_allowed: false,
      runtime_40_20_started: false,
      next_authorization_required: true,
    },
  };
}

export function createSchemaContract(): RuntimeExecutionCoreSchemaContract {
  return {
    migration_file:
      "supabase/migrations/20260702122000_eve_runtime_40_20_execution_core.sql",
    migration_created: true,
    migration_applied: false,
    migration_creation_allowed: true,
    migration_application_allowed: false,
    catalog_core_dependency_declared: true,
    catalog_migration_required_before_runtime_start: true,
    catalog_activation_required_before_runtime_start: true,
    catalog_activation_allowed: false,
    runtime_40_20_start_allowed: false,
    execution_core_tables_supported: 15,
    authorized_tables: RUNTIME_40_20_EXECUTION_CORE_TABLES,
    forbidden_catalog_core_tables: FORBIDDEN_RUNTIME_40_20_CATALOG_CORE_TABLES,
    tables: createTableManifest(),
    columns: createColumnManifest(),
    indexes: createIndexManifest(),
    constraints: createConstraintManifest(),
    rls_required_before_production_use: true,
    ownership_policy_required_before_production_use: true,
  };
}

function createTableManifest(): RuntimeExecutionCoreTableManifestItem[] {
  return RUNTIME_40_20_EXECUTION_CORE_TABLES.map((tableName) => ({
    table_name: tableName,
    purpose: TABLE_PURPOSE[tableName],
    creates_catalog_core_table: false,
    creates_real_runtime_record: false,
    creates_business_evidence: false,
  }));
}

function createColumnManifest(): RuntimeExecutionCoreColumnManifestItem[] {
  const columns: RuntimeExecutionCoreColumnManifestItem[] = [];
  const add = (
    table_name: RuntimeExecutionCoreTableName,
    column_name: string,
    column_type: string,
    nullable = false,
    default_expression?: string,
  ) => columns.push({ table_name, column_name, column_type, nullable, default_expression });

  for (const table of RUNTIME_40_20_EXECUTION_CORE_TABLES) {
    add(table, "case_id", "text");
    add(table, "metadata", "jsonb", false, "'{}'::jsonb");
    add(table, "created_at", "timestamptz", false, "now()");
  }

  add("eve_role_runtime_session", "role_runtime_session_id", "uuid", false, "gen_random_uuid()");
  add("eve_role_runtime_session", "role_id", "text");
  add("eve_role_runtime_session", "catalog_version_id", "uuid");
  add("eve_role_runtime_session", "primary_activity_limit", "integer", false, "8");
  add("eve_role_runtime_session", "selected_primary_activity_count", "integer", false, "0");
  add("eve_role_runtime_session", "secondary_activity_count", "integer", false, "0");
  add("eve_role_runtime_session", "total_estimated_minutes", "integer", false, "0");
  add("eve_role_runtime_session", "total_elapsed_minutes", "integer", false, "0");
  add("eve_role_runtime_session", "state", "text");
  add("eve_role_runtime_session", "updated_at", "timestamptz", false, "now()");

  add("eve_activity_runtime_run", "run_id", "uuid", false, "gen_random_uuid()");
  add("eve_activity_runtime_run", "role_runtime_session_id", "uuid");
  add("eve_activity_runtime_run", "role_id", "text");
  add("eve_activity_runtime_run", "activity_id", "text");
  add("eve_activity_runtime_run", "catalog_version_id", "uuid");
  add("eve_activity_runtime_run", "state", "text");
  add("eve_activity_runtime_run", "base_visible_count", "integer", false, "0");
  add("eve_activity_runtime_run", "causal_visible_count", "integer", false, "0");
  add("eve_activity_runtime_run", "readiness_state", "text", true);
  add("eve_activity_runtime_run", "updated_at", "timestamptz", false, "now()");

  add("eve_runtime_interaction_instance", "interaction_instance_id", "uuid", false, "gen_random_uuid()");
  add("eve_runtime_interaction_instance", "run_id", "uuid");
  add("eve_runtime_interaction_instance", "runtime_interaction_id", "text");
  add("eve_runtime_interaction_instance", "state", "text");
  add("eve_runtime_interaction_instance", "shown_at", "timestamptz", true);
  add("eve_runtime_interaction_instance", "answered_at", "timestamptz", true);
  add("eve_runtime_interaction_instance", "skipped_reason", "text", true);
  add("eve_runtime_interaction_instance", "updated_at", "timestamptz", false, "now()");

  add("eve_runtime_subfield_response", "subfield_response_id", "uuid", false, "gen_random_uuid()");
  add("eve_runtime_subfield_response", "run_id", "uuid");
  add("eve_runtime_subfield_response", "interaction_instance_id", "uuid");
  add("eve_runtime_subfield_response", "subfield_name", "text");
  add("eve_runtime_subfield_response", "value", "jsonb");
  add("eve_runtime_subfield_response", "epistemic_status", "text");
  add("eve_runtime_subfield_response", "provenance_type", "text");
  add("eve_runtime_subfield_response", "confidence", "numeric", true);
  add("eve_runtime_subfield_response", "response_revision_number", "integer", false, "1");
  add("eve_runtime_subfield_response", "supersedes_subfield_response_id", "uuid", true);

  add("eve_evidence_item", "evidence_item_id", "uuid", false, "gen_random_uuid()");
  add("eve_evidence_item", "run_id", "uuid");
  add("eve_evidence_item", "interaction_instance_id", "uuid", true);
  add("eve_evidence_item", "subfield_response_id", "uuid", true);
  add("eve_evidence_item", "literal_value", "text", true);
  add("eve_evidence_item", "epistemic_status", "text");
  add("eve_evidence_item", "provenance_type", "text");
  add("eve_evidence_item", "confidence", "numeric", true);
  add("eve_evidence_item", "response_revision_number", "integer", false, "1");
  add("eve_evidence_item", "supersedes_evidence_item_id", "uuid", true);

  add("eve_canonical_variable_record", "canonical_variable_id", "uuid", false, "gen_random_uuid()");
  add("eve_canonical_variable_record", "run_id", "uuid");
  add("eve_canonical_variable_record", "variable_name", "text");
  add("eve_canonical_variable_record", "variable_value", "jsonb");
  add("eve_canonical_variable_record", "route_id", "text", true);
  add("eve_canonical_variable_record", "route_status", "text");
  add("eve_canonical_variable_record", "derived_from", "jsonb", false, "'[]'::jsonb");
  add("eve_canonical_variable_record", "gap_flag", "boolean", false, "false");

  add("eve_runtime_branching_decision", "branching_decision_id", "uuid", false, "gen_random_uuid()");
  add("eve_runtime_branching_decision", "run_id", "uuid");
  add("eve_runtime_branching_decision", "decision_type", "text");
  add("eve_runtime_branching_decision", "opened_interaction_id", "text", true);
  add("eve_runtime_branching_decision", "closed_interaction_id", "text", true);
  add("eve_runtime_branching_decision", "trigger_signal", "text", true);
  add("eve_runtime_branching_decision", "causal_score", "integer", true);
  add("eve_runtime_branching_decision", "reason", "text");
  add("eve_runtime_branching_decision", "budget_effect", "text", true);

  add("eve_runtime_budget_ledger", "budget_ledger_id", "uuid", false, "gen_random_uuid()");
  add("eve_runtime_budget_ledger", "run_id", "uuid");
  add("eve_runtime_budget_ledger", "role_runtime_session_id", "uuid", true);
  add("eve_runtime_budget_ledger", "base_visible_count", "integer");
  add("eve_runtime_budget_ledger", "causal_visible_count", "integer");
  add("eve_runtime_budget_ledger", "estimated_seconds_added", "integer", false, "0");
  add("eve_runtime_budget_ledger", "event_ref", "text", true);

  add("eve_semantic_resolution_event", "semantic_resolution_event_id", "uuid", false, "gen_random_uuid()");
  add("eve_semantic_resolution_event", "run_id", "uuid");
  add("eve_semantic_resolution_event", "gate_id", "text");
  add("eve_semantic_resolution_event", "candidate_label", "text", true);
  add("eve_semantic_resolution_event", "resolution_state", "text");
  add("eve_semantic_resolution_event", "action_taken", "text");
  add("eve_semantic_resolution_event", "manual_review_required", "boolean", false, "false");

  add("eve_process_state_timer_event", "process_state_timer_event_id", "uuid", false, "gen_random_uuid()");
  add("eve_process_state_timer_event", "run_id", "uuid");
  add("eve_process_state_timer_event", "gate_id", "text");
  add("eve_process_state_timer_event", "awaited_event", "text", true);
  add("eve_process_state_timer_event", "release_condition", "text", true);
  add("eve_process_state_timer_event", "timer_event_or_timeout_rule", "text", true);
  add("eve_process_state_timer_event", "timeout_state", "text", true);
  add("eve_process_state_timer_event", "resolver_owner", "text", true);
  add("eve_process_state_timer_event", "exit_path", "text", true);
  add("eve_process_state_timer_event", "deadlock_risk", "boolean", false, "false");

  add("eve_structural_candidate_record", "structural_candidate_id", "uuid", false, "gen_random_uuid()");
  add("eve_structural_candidate_record", "run_id", "uuid");
  add("eve_structural_candidate_record", "quadrant_hint", "text");
  add("eve_structural_candidate_record", "candidate_type", "text");
  add("eve_structural_candidate_record", "candidate_label", "text");
  add("eve_structural_candidate_record", "source_variable", "text", true);
  add("eve_structural_candidate_record", "source_evidence_item_id", "uuid", true);
  add("eve_structural_candidate_record", "conformance_checkpoint", "text", true);
  add("eve_structural_candidate_record", "consistency_checkpoint", "text", true);
  add("eve_structural_candidate_record", "candidate_state", "text", false, "'candidate'");

  add("eve_readiness_gap_record", "gap_id", "uuid", false, "gen_random_uuid()");
  add("eve_readiness_gap_record", "run_id", "uuid");
  add("eve_readiness_gap_record", "gap_type", "text");
  add("eve_readiness_gap_record", "affected_route", "text", true);
  add("eve_readiness_gap_record", "affected_quadrant", "text", true);
  add("eve_readiness_gap_record", "severity", "text");
  add("eve_readiness_gap_record", "reentry_target", "text", true);
  add("eve_readiness_gap_record", "manual_review_flag", "boolean", false, "false");
  add("eve_readiness_gap_record", "status", "text", false, "'open'");

  add("eve_readiness_decision_record", "readiness_decision_id", "uuid", false, "gen_random_uuid()");
  add("eve_readiness_decision_record", "run_id", "uuid");
  add("eve_readiness_decision_record", "role_runtime_session_id", "uuid", true);
  add("eve_readiness_decision_record", "readiness_state", "text");
  add("eve_readiness_decision_record", "dominant_gate", "text", true);
  add("eve_readiness_decision_record", "reason", "text");
  add("eve_readiness_decision_record", "reentry_target", "text", true);
  add("eve_readiness_decision_record", "manual_review_required", "boolean", false, "false");

  add("eve_parallel_export_payload", "parallel_export_payload_id", "uuid", false, "gen_random_uuid()");
  add("eve_parallel_export_payload", "run_id", "uuid");
  add("eve_parallel_export_payload", "payload_type", "text");
  add("eve_parallel_export_payload", "payload_json", "jsonb");
  add("eve_parallel_export_payload", "payload_state", "text");
  add("eve_parallel_export_payload", "checksum", "text", true);

  add("eve_runtime_audit_trail", "audit_trail_id", "uuid", false, "gen_random_uuid()");
  add("eve_runtime_audit_trail", "object_type", "text");
  add("eve_runtime_audit_trail", "object_id", "text");
  add("eve_runtime_audit_trail", "actor_id", "text", true);
  add("eve_runtime_audit_trail", "actor_type", "text");
  add("eve_runtime_audit_trail", "action", "text");
  add("eve_runtime_audit_trail", "reason", "text", true);
  add("eve_runtime_audit_trail", "prior_value", "jsonb", true);
  add("eve_runtime_audit_trail", "new_value", "jsonb", true);

  return columns;
}

function createIndexManifest(): RuntimeExecutionCoreIndexManifestItem[] {
  return [
    index("eve_role_runtime_session_case_role_idx", "eve_role_runtime_session", ["case_id", "role_id"]),
    index("eve_role_runtime_session_catalog_idx", "eve_role_runtime_session", ["catalog_version_id"]),
    index("eve_activity_runtime_run_session_idx", "eve_activity_runtime_run", ["role_runtime_session_id"]),
    index("eve_activity_runtime_run_activity_idx", "eve_activity_runtime_run", ["case_id", "activity_id"]),
    index("eve_runtime_interaction_instance_run_idx", "eve_runtime_interaction_instance", ["run_id"]),
    index("eve_runtime_subfield_response_instance_idx", "eve_runtime_subfield_response", ["interaction_instance_id"]),
    index("eve_evidence_item_run_idx", "eve_evidence_item", ["run_id"]),
    index("eve_canonical_variable_record_route_idx", "eve_canonical_variable_record", ["run_id", "route_id"]),
    index("eve_runtime_branching_decision_run_idx", "eve_runtime_branching_decision", ["run_id"]),
    index("eve_runtime_budget_ledger_run_idx", "eve_runtime_budget_ledger", ["run_id"]),
    index("eve_semantic_resolution_event_gate_idx", "eve_semantic_resolution_event", ["run_id", "gate_id"]),
    index("eve_process_state_timer_event_gate_idx", "eve_process_state_timer_event", ["run_id", "gate_id"]),
    index("eve_structural_candidate_record_run_idx", "eve_structural_candidate_record", ["run_id"]),
    index("eve_readiness_gap_record_run_idx", "eve_readiness_gap_record", ["run_id", "status"]),
    index("eve_readiness_decision_record_session_idx", "eve_readiness_decision_record", ["role_runtime_session_id"]),
    index("eve_parallel_export_payload_run_idx", "eve_parallel_export_payload", ["run_id", "payload_state"]),
    index("eve_runtime_audit_trail_object_idx", "eve_runtime_audit_trail", ["object_type", "object_id"]),
  ];
}

function createConstraintManifest(): RuntimeExecutionCoreConstraintManifestItem[] {
  return [
    constraint("eve_role_runtime_session_primary_limit_check", "eve_role_runtime_session", "primary_activity_limit = 8"),
    constraint("eve_role_runtime_session_selected_count_check", "eve_role_runtime_session", "selected_primary_activity_count <= primary_activity_limit"),
    constraint("eve_role_runtime_session_state_check", "eve_role_runtime_session", "state in (draft, active, in_progress, ready_with_flags, completed, blocked, archived)"),
    constraint("eve_activity_runtime_run_base_count_check", "eve_activity_runtime_run", "base_visible_count <= 40"),
    constraint("eve_activity_runtime_run_causal_count_check", "eve_activity_runtime_run", "causal_visible_count <= 20"),
    constraint("eve_activity_runtime_run_state_check", "eve_activity_runtime_run", "state in (initialized, semantic_preload_loaded, b0_confirmation_pending, active_base_capture, base_complete, causal_evaluation_pending, active_causal_capture, readiness_evaluation, ready, ready_with_flags, blocked, reentry_required, manual_review_required, exported_to_parallel_production, archived)"),
    constraint("eve_runtime_interaction_instance_state_check", "eve_runtime_interaction_instance", "state in (pending, shown, answered, confirmed, corrected, inferred_unconfirmed, skipped_by_rule, closed_by_other, blocked, reopened)"),
    constraint("eve_runtime_subfield_response_epistemic_status_check", "eve_runtime_subfield_response", "epistemic_status in (captured_user_evidence, ai_inferred_unconfirmed, user_confirmed_suggestion, user_corrected_evidence, canonical_derivation, internal_calculated)"),
    constraint("eve_evidence_item_epistemic_status_check", "eve_evidence_item", "epistemic_status in (captured_user_evidence, ai_inferred_unconfirmed, user_confirmed_suggestion, user_corrected_evidence, canonical_derivation, internal_calculated)"),
    constraint("eve_canonical_variable_record_route_status_check", "eve_canonical_variable_record", "route_status in (not_applicable, open, closed, closed_with_flags, blocked_by_missing_canonical_route, route_missing, superseded)"),
    constraint("eve_runtime_budget_ledger_base_count_check", "eve_runtime_budget_ledger", "base_visible_count <= 40"),
    constraint("eve_runtime_budget_ledger_causal_count_check", "eve_runtime_budget_ledger", "causal_visible_count <= 20"),
    constraint("eve_semantic_resolution_event_state_check", "eve_semantic_resolution_event", "resolution_state in (resolved, ambiguous, contradictory, not_safe, unsupported)"),
    constraint("eve_structural_candidate_record_quadrant_check", "eve_structural_candidate_record", "quadrant_hint in (PM, MoC, PF, OLC, CrossQuadrant, GovernanceReadiness, VSM_AHE_Prep, None)"),
    constraint("eve_parallel_export_payload_type_check", "eve_parallel_export_payload", "payload_type in (scr_patch, evidence_bundle_patch, mdsb_patch, combined_preview)"),
    constraint("eve_parallel_export_payload_state_check", "eve_parallel_export_payload", "payload_state in (draft, ready, sent, superseded, blocked)"),
  ];
}

function index(
  index_name: string,
  table_name: RuntimeExecutionCoreTableName,
  columns: string[],
): RuntimeExecutionCoreIndexManifestItem {
  return { index_name, table_name, columns };
}

function constraint(
  constraint_name: string,
  table_name: RuntimeExecutionCoreTableName,
  expression: string,
): RuntimeExecutionCoreConstraintManifestItem {
  return { constraint_name, table_name, expression };
}
