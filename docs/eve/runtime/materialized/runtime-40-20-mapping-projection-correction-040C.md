# Runtime 40/20 mapping projection correction 040-C

## Classification

`staging_mapping_projection_reconciled_local_only`

## Next gap

`corrected_staging_schema_and_boundary_deployment_authorization_required`

## Purpose

Remove loader-only `mapping_ordinal` and `mapping_payload` from CatalogLoader, local PostgreSQL fixture/adapter, and RPC candidate 040-C so the mapping projection matches the eight real columns of `public.runtime_interaction_mapping` captured in 040-A.

## Gates

### Gate 1 — Alias authority

All five aliases remain `explicit_authorized_alias` with no semantic loss:

| Alias | Destination | TR-ID |
| --- | --- | --- |
| interaction_group → interaction_group_source | runtime_interaction_def | TR-002\|TR-003 |
| group_normalized → interaction_group_normalized | runtime_interaction_def | TR-002\|TR-003 |
| function_name → function_label | runtime_interaction_def | TR-002\|TR-003 |
| raw_payload → raw_row_json | runtime_interaction_def | TR-002\|TR-003 |
| subfield_ordinal → ordinal | runtime_subfield_schema | TR-005\|TR-029 |

`raw_payload → raw_row_json` preserves the authorized 031C interaction object by assignment (`raw_payload: interaction`), without reconstructing a new JSON design. This is distinct from the removed `mapping_payload`.

### Gate 2 — Mapping identity uniqueness

Projected 170 lineage relations against `(catalog_version_id, runtime_interaction_id, source_node_ref_id, mapping_role)` with `mapping_role = source_lineage`:

- total expected: 170
- unique keys: 170
- duplicates: 0
- unresolved references: 0

## Persistable mapping row

- catalog_version_id
- runtime_interaction_id
- source_node_ref_id (resolved from source_node_id + source_code)
- mapping_role
- output_variable_name
- route_id

PostgreSQL generates `mapping_id` and `created_at`.

## Exact comparison

Bidirectional EXCEPT ALL resolves `source_node_ref_id` to `source_node_id` / `source_code` and compares:

- catalog_version_id
- runtime_interaction_id
- source_node_id
- source_code
- mapping_role
- output_variable_name
- route_id

Excluded: `mapping_id`, `created_at`, physical UUID as semantic identity.

Lineage authority remains in `runtime-40-20-source-lineage-031.json` and artifact sections.

## RPC candidate 040-C

- File: `supabase/migrations/20260805203000_eve_runtime_40_20_governed_draft_load_rpc_candidate_040C.sql`
- Rollback: `docs/eve/runtime/materialized/runtime-40-20-governed-draft-load-rpc-candidate-040C.rollback.sql`
- Historical 039-A SQL unmodified
- Draft-only, advisory lock, idempotent exact replay, content conflict blocked, service_role EXECUTE only
- Not deployed

## Security

```text
staging consulted: no
staging writes: none
production consulted: no
remote writes: none
catalog loaded: no
catalog activated: no
B0 modified: no
B1 modified: no
Gaby modified: no
commit created: no
```
