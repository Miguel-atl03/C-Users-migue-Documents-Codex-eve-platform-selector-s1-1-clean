# Physical Non-Productive Environment Values Declaration

Status: PENDING_PHYSICAL_VALUE

Purpose:
This declaration captures non-secret physical environment values required to complete the remaining evidence fields for non-productive DB/Supabase/schema/snapshot/rollback/approval/risk validation.

Rules:
- Do not include passwords.
- Do not include tokens.
- Do not include service role keys.
- Do not include full connection strings.
- Do not include production secrets.
- Do not include production data.
- Use aliases, masked identifiers, owner names/roles, relative paths, or non-secret references only.
- This declaration does not connect to DB or Supabase.
- This declaration does not execute migration.

## 01 Physical DB Identity
- physical_db_environment_alias: PENDING_PHYSICAL_VALUE
- physical_db_identifier_masked: PENDING_PHYSICAL_VALUE
- physical_db_provider_or_runtime: Docker Desktop local runtime with postgres:16-alpine
- physical_db_owner: PENDING_PHYSICAL_VALUE
- physical_db_purpose: non-productive physical validation target for shadow_outcome migration

## 02 Physical Supabase Exclusion
- production_supabase_project_masked: PENDING_PHYSICAL_VALUE
- non_productive_supabase_project_masked: PENDING_PHYSICAL_VALUE
- supabase_exclusion_basis: PENDING_PHYSICAL_VALUE
- supabase_reviewer: PENDING_PHYSICAL_VALUE

## 03 Migration Target Database
- migration_target_database_alias: PENDING_PHYSICAL_VALUE
- target_is_non_productive: true
- target_owner: PENDING_PHYSICAL_VALUE
- target_reviewer: PENDING_PHYSICAL_VALUE

## 04 Migration Target Schema
- migration_target_schema: PENDING_PHYSICAL_VALUE
- schema_is_non_productive: true
- schema_owner: PENDING_PHYSICAL_VALUE
- schema_reviewer: PENDING_PHYSICAL_VALUE

## 05 Schema Baseline Plan
- schema_baseline_method: capture pre-migration schema definition for the target non-productive database before applying the shadow_outcome migration
- schema_baseline_output_path: docs/audits/evidence/non_productive_db_environment/physical_migration_validation/schema_baseline_before_shadow_outcome.md
- schema_baseline_owner: PENDING_PHYSICAL_VALUE
- schema_baseline_reviewer: PENDING_PHYSICAL_VALUE

## 06 RLS Baseline Plan
- rls_baseline_method: capture pre-migration RLS policy state for the target non-productive database before applying the shadow_outcome migration
- rls_baseline_output_path: docs/audits/evidence/non_productive_db_environment/physical_migration_validation/rls_baseline_before_shadow_outcome.md
- rls_baseline_owner: PENDING_PHYSICAL_VALUE
- rls_baseline_reviewer: PENDING_PHYSICAL_VALUE

## 07 Constraint Baseline Plan
- constraint_baseline_method: capture pre-migration constraints and indexes for the target non-productive database before applying the shadow_outcome migration
- constraint_baseline_output_path: docs/audits/evidence/non_productive_db_environment/physical_migration_validation/constraint_baseline_before_shadow_outcome.md
- constraint_baseline_owner: PENDING_PHYSICAL_VALUE
- constraint_baseline_reviewer: PENDING_PHYSICAL_VALUE

## 08 Snapshot Plan
- snapshot_method: create or verify a non-productive DB snapshot or backup before migration validation
- snapshot_owner: PENDING_PHYSICAL_VALUE
- snapshot_storage_location_without_secret: non-secret reference to non-productive snapshot storage; exact storage reference remains pending if not yet known
- restore_validation_plan: verify that rollback can restore or safely recover the non-productive validation target before any future physical migration validation

## 09 Rollback Plan
- rollback_strategy: restore the non-productive snapshot or use safe-forward remediation in the non-productive environment only
- rollback_owner: PENDING_PHYSICAL_VALUE
- rollback_trigger_conditions: validation failure, unexpected schema drift, migration error, policy/constraint mismatch, or inability to prove non-production boundary
- safe_forward_allowed: false

## 10 Evidence Ledger Path
- evidence_ledger_path: docs/audits/evidence/non_productive_db_environment/physical_migration_validation/evidence_ledger.md
- ledger_owner: PENDING_PHYSICAL_VALUE
- ledger_write_policy: write sanitized evidence only; no secrets, no full connection strings, no tokens, no passwords, no service role keys
- ledger_reviewer: PENDING_PHYSICAL_VALUE

## 11 Execution Approval Path
- approval_required_before_execution: true
- approver_name_or_role: PENDING_PHYSICAL_VALUE
- approval_scope: one-time non-productive physical migration validation for shadow_outcome only
- approval_record_path: docs/audits/evidence/non_productive_db_environment/physical_migration_validation/execution_approval_record.md

## 12 Risk Owner
- risk_owner_name: PENDING_PHYSICAL_VALUE
- risk_owner_role: PENDING_PHYSICAL_VALUE
- risk_scope: risk ownership for non-productive physical migration validation of shadow_outcome only
- approval_required_before_execution: true

## 13 Human No Production Attestation
- attestation_statement: I attest that this physical validation path does not use production DB, production Supabase, production credentials, or production data.
- attested_by: PENDING_PHYSICAL_VALUE
- attestation_date: PENDING_PHYSICAL_VALUE
- production_db_used: false
- production_supabase_used: false
- production_credentials_used: false
- production_data_used: false

## 14 Owner Reviewer Dates
- default_owner: PENDING_PHYSICAL_VALUE
- default_reviewer: PENDING_PHYSICAL_VALUE
- confirmation_date: PENDING_PHYSICAL_VALUE
- review_date: PENDING_PHYSICAL_VALUE

## Authority Flags
- environment_created: false
- db_connected: false
- supabase_connected: false
- migration_executed: false
- sql_modified: false
- observer_created: false
- source_connected: false
- real_table_read: false
- gate2_real_shadow_closed: false
- gate3_ready: false
- fase9_started: false
- registry_written: false
- export_generated: false
- diagnosis_enabled: false

## Completion Rule
Status remains PENDING_PHYSICAL_VALUE until all fields are completed with non-secret confirmed values.

## Unresolved Physical Values Register

Status: UNRESOLVED_VALUES_REMAIN

Purpose:
This register lists physical values that remain unresolved after Category 1 fixed values, Category 2 operational declarative values, and Category 3 repo-derivable values.

Rules:
- Do not replace unresolved values without explicit non-secret confirmation.
- Do not infer physical DB alias, Supabase project, schema, owner, reviewer, approver, risk owner, or dates.
- Do not use secrets.
- Do not use `.env`.
- Do not use production credentials.
- Do not connect DB or Supabase.

### Pending Group 01 Physical DB Identity

- physical_db_environment_alias: PENDING_PHYSICAL_VALUE
  - required_value_type: non-secret alias for the local Docker/Postgres validation environment
  - why_pending: not explicitly declared yet

- physical_db_identifier_masked: PENDING_PHYSICAL_VALUE
  - required_value_type: masked non-secret identifier; no host, no credentials, no connection string
  - why_pending: not explicitly declared yet

- physical_db_owner: PENDING_PHYSICAL_VALUE
  - required_value_type: owner name or role
  - why_pending: not explicitly declared yet

### Pending Group 02 Physical Supabase Exclusion

- production_supabase_project_masked: PENDING_PHYSICAL_VALUE
  - required_value_type: masked production Supabase reference or "not applicable if no Supabase is used"
  - why_pending: not explicitly declared yet

- non_productive_supabase_project_masked: PENDING_PHYSICAL_VALUE
  - required_value_type: masked non-production Supabase reference or "not applicable if no Supabase is used"
  - why_pending: not explicitly declared yet

- supabase_exclusion_basis: PENDING_PHYSICAL_VALUE
  - required_value_type: explicit statement explaining Supabase is not used or production Supabase is excluded
  - why_pending: not explicitly declared yet

- supabase_reviewer: PENDING_PHYSICAL_VALUE
  - required_value_type: reviewer name or role
  - why_pending: not explicitly declared yet

### Pending Group 03 Migration Target Database

- migration_target_database_alias: PENDING_PHYSICAL_VALUE
  - required_value_type: non-secret alias for target validation database
  - why_pending: not explicitly declared yet

- target_owner: PENDING_PHYSICAL_VALUE
  - required_value_type: owner name or role
  - why_pending: not explicitly declared yet

- target_reviewer: PENDING_PHYSICAL_VALUE
  - required_value_type: reviewer name or role
  - why_pending: not explicitly declared yet

### Pending Group 04 Migration Target Schema

- migration_target_schema: PENDING_PHYSICAL_VALUE
  - required_value_type: explicit schema name, only if confirmed; do not assume public
  - why_pending: SQL did not explicitly qualify schema

- schema_owner: PENDING_PHYSICAL_VALUE
  - required_value_type: owner name or role
  - why_pending: not explicitly declared yet

- schema_reviewer: PENDING_PHYSICAL_VALUE
  - required_value_type: reviewer name or role
  - why_pending: not explicitly declared yet

### Pending Groups 05 to 10 Owners and Reviewers

- schema_baseline_owner: PENDING_PHYSICAL_VALUE
  - required_value_type: owner/reviewer name or role
  - why_pending: not explicitly declared yet

- schema_baseline_reviewer: PENDING_PHYSICAL_VALUE
  - required_value_type: owner/reviewer name or role
  - why_pending: not explicitly declared yet

- rls_baseline_owner: PENDING_PHYSICAL_VALUE
  - required_value_type: owner/reviewer name or role
  - why_pending: not explicitly declared yet

- rls_baseline_reviewer: PENDING_PHYSICAL_VALUE
  - required_value_type: owner/reviewer name or role
  - why_pending: not explicitly declared yet

- constraint_baseline_owner: PENDING_PHYSICAL_VALUE
  - required_value_type: owner/reviewer name or role
  - why_pending: not explicitly declared yet

- constraint_baseline_reviewer: PENDING_PHYSICAL_VALUE
  - required_value_type: owner/reviewer name or role
  - why_pending: not explicitly declared yet

- snapshot_owner: PENDING_PHYSICAL_VALUE
  - required_value_type: owner/reviewer name or role
  - why_pending: not explicitly declared yet

- rollback_owner: PENDING_PHYSICAL_VALUE
  - required_value_type: owner/reviewer name or role
  - why_pending: not explicitly declared yet

- ledger_owner: PENDING_PHYSICAL_VALUE
  - required_value_type: owner/reviewer name or role
  - why_pending: not explicitly declared yet

- ledger_reviewer: PENDING_PHYSICAL_VALUE
  - required_value_type: owner/reviewer name or role
  - why_pending: not explicitly declared yet

### Pending Group 11 Execution Approval

- approver_name_or_role: PENDING_PHYSICAL_VALUE
  - required_value_type: approver name or role
  - why_pending: not explicitly declared yet

### Pending Group 12 Risk Owner

- risk_owner_name: PENDING_PHYSICAL_VALUE
  - required_value_type: risk owner name
  - why_pending: not explicitly declared yet

- risk_owner_role: PENDING_PHYSICAL_VALUE
  - required_value_type: risk owner role
  - why_pending: not explicitly declared yet

### Pending Group 13 Human No Production Attestation

- attested_by: PENDING_PHYSICAL_VALUE
  - required_value_type: person/role making no-production attestation
  - why_pending: not explicitly declared yet

- attestation_date: PENDING_PHYSICAL_VALUE
  - required_value_type: YYYY-MM-DD
  - why_pending: not explicitly declared yet

### Pending Group 14 Owner Reviewer Dates

- default_owner: PENDING_PHYSICAL_VALUE
  - required_value_type: owner/reviewer/date values
  - why_pending: not explicitly declared yet

- default_reviewer: PENDING_PHYSICAL_VALUE
  - required_value_type: owner/reviewer/date values
  - why_pending: not explicitly declared yet

- confirmation_date: PENDING_PHYSICAL_VALUE
  - required_value_type: owner/reviewer/date values
  - why_pending: not explicitly declared yet

- review_date: PENDING_PHYSICAL_VALUE
  - required_value_type: owner/reviewer/date values
  - why_pending: not explicitly declared yet

### Completion Boundary
This declaration remains incomplete until the unresolved values above are completed with non-secret confirmed values.
This declaration still does not accept the environment.
This declaration still does not authorize physical migration validation execution.
