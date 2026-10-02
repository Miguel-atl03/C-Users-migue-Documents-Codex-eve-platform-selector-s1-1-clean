# Safe Shadow Source Provisioning Required - Gate 2

## Dictamen
GATE_2_SAFE_SHADOW_SOURCE_PROVISIONING_BLOCKED_BY_OWNER_OR_CREDENTIALS_REQUIRED

## Existing contract
- source: shadow_only_outbox_events
- ddl: sql/migrations/2026-06-27-create-shadow-only-outbox-events.sql
- ddl extension: sql/migrations/2026-06-28-add_shadow_outcome_to_shadow_only_outbox_events.sql

## Owner action required
- provide non-productive DB / safe shadow mirror / read replica target
- apply existing DDL in non-productive target
- create separate read-only credential or role
- expose read path to adapter without secret values in repo
- provide verifiable write_count guard
- confirm service_role is not used for read-only execution

## Minimum readiness fields
- sourceConnected=true
- realTableRead=true
- localInMemoryRecordsOnly=false
- write_count=0 verifiable
- tenant/correlation/idempotency/provenance/outcome metadata mapped

## No-Go
- no productive DB
- no service_role productive credential
- no writes
- no registry/export/diagnosis
- no Gate 3
- no Fase 9

## Next step
OWNER_PROVISION_SAFE_SHADOW_SOURCE_TARGET_AND_READONLY_CREDENTIALS_V1
