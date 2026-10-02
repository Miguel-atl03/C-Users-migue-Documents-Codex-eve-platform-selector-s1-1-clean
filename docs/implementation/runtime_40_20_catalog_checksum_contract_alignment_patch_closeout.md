# Runtime 40/20 Catalog Checksum Contract Alignment Patch Closeout

## 1. Dictamen

RUNTIME_40_20_CATALOG_CHECKSUM_CONTRACT_ALIGNMENT_PATCH_COMPLETED

## 2. Files created

- `docs/implementation/runtime_40_20_catalog_checksum_contract_alignment_patch_closeout.md`
- `docs/implementation/runtime_40_20_catalog_checksum_contract_alignment_patch_traceability.json`

## 3. Files modified

- `supabase/migrations/20260702121000_eve_runtime_40_20_catalog_core.sql`
- `src/services/eve/runtime-40-20/catalog-persistence/runtime-40-20-catalog-persistence-types.ts`
- `src/services/eve/runtime-40-20/catalog-persistence/runtime-40-20-catalog-persistence-service.ts`
- `src/services/eve/runtime-40-20/catalog-persistence/runtime-40-20-catalog-persistence.test.mjs`
- `docs/implementation/runtime_40_20_catalog_persistence_schema_contract_closeout.md`
- `docs/implementation/runtime_40_20_catalog_persistence_schema_contract_traceability.json`

## 4. Original mismatch

The prior draft used `checksum_runtime_spec`, `checksum_runtime_catalog`, and `checksum_mother_catalog`. The rector contract requires `runtime_spec_checksum`, `runtime_catalog_checksum`, and `mother_catalog_checksum`.

## 5. Contract decision

The checksum contract is now aligned on the rector names and requires all three fields as `text not null`.

## 6. SQL alignment

`eve_runtime_catalog_version` now declares:

```text
runtime_spec_checksum text not null
runtime_catalog_checksum text not null
mother_catalog_checksum text not null
```

## 7. TypeScript alignment

The schema contract includes `RuntimeCatalogChecksumContract` and exposes `checksum_contract_aligned = true`.

## 8. Service alignment

The service manifest uses the exact checksum field names in the catalog version table and keeps the 14 authorized table contracts.

## 9. Test coverage

The local test validates the service contract and the SQL draft text for exact checksum field names, `not null`, and removal of the incorrect names.

## 10. Migration not applied

Migration application remains false.

## 11. Catalog not activated

Catalog activation remains false.

## 12. Runtime 40/20 not started

Runtime 40/20 start remains false.

## 13. Supabase / SQL / Endpoint not touched

Supabase touch, SQL execution, and endpoint creation remain false.

## 14. What remains outside this patch

Applying the migration, activating the catalog, creating runtime execution records, creating business evidence, exports, diagnosis, or Delivered artifacts remain outside this patch.

