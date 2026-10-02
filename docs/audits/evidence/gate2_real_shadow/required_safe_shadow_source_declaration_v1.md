# Required Safe Shadow Source Declaration - Gate 2

## Dictamen
GATE_2_REAL_SHADOW_ENVIRONMENT_DECLARATION_REQUIRED

## Missing fields
- safe_shadow_mirror_or_outbox
- separate_read_only_credentials
- source_connected
- real_table_read_path
- verifiable_write_count_guard

## Required source contract
- source_name:
- source_type: non_productive_shadow_only_outbox_events | read_replica | safe_shadow_mirror
- production_data_scope: none | sanitized_copy | shadow_events_only
- read_only_credentials: required
- write_permissions: forbidden
- service_role_allowed: false
- event_table_or_view:
- read_path:
- write_guard:
- tenant_scope_field:
- correlation_field:
- idempotency_field:
- provenance_field:
- official_outcome_field:
- shadow_outcome_field:
- replay_key_field:
- created_or_occurred_at_field:

## No-Go
- no productive DB connection
- no service_role productive credential
- no writes
- no registry/export/diagnosis
- no Gate 3
- no Fase 9

## Next step
WAIT_FOR_OR_PROVISION_SAFE_SHADOW_SOURCE_V1
