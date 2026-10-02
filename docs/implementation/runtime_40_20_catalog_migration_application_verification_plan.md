# Runtime 40/20 Catalog Migration Application Verification Plan

## 1. Catalog Tables

Confirm manually that the 14 catalog tables exist:

- `eve_runtime_catalog_version`
- `eve_runtime_source_node_ref`
- `eve_runtime_interaction_def`
- `eve_runtime_interaction_mapping`
- `eve_runtime_subfield_schema`
- `eve_runtime_canonical_variable_map`
- `eve_runtime_branching_rule`
- `eve_runtime_critical_route`
- `eve_runtime_semantic_gate`
- `eve_runtime_process_state_timer_gate`
- `eve_runtime_readiness_rule`
- `eve_runtime_qa_rule`
- `eve_runtime_implementation_dictionary`
- `eve_runtime_catalog_import_audit`

## 2. Runtime Execution Tables

Confirm manually that these Runtime execution tables do not exist:

- `role_runtime_session`
- `activity_runtime_run`
- `runtime_interaction_instance`
- `runtime_subfield_response`
- `evidence_item`
- `canonical_variable_record`
- `branching_decision`
- `budget_ledger`
- `readiness_decision_record`
- `parallel_export_payload`
- `runtime_audit_trail`

## 3. Checksum Columns

Confirm the required checksum columns:

- `runtime_spec_checksum text not null`
- `runtime_catalog_checksum text not null`
- `mother_catalog_checksum text not null`

## 4. Activation Guards

Confirm:

- `catalog_activation_allowed default false`
- `catalog_activation_allowed check false`
- `qa_passed default false`

## 5. Catalog State

Confirm that no catalog is active.

## 6. Runtime State

Confirm that Runtime 40/20 did not start.

## 7. Catalog Inserts

Confirm that no catalog rows have been inserted yet.

## 8. Business Evidence

Confirm that no business evidence exists.

