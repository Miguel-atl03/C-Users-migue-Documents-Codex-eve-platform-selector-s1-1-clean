# Runtime 40/20 staging boundary reconciliation 040-A

## Scope

Project: `eve-staging-onboarding` / `shrpiwkxcdgvbqymjecx`.  
Mode: SELECT only against staging. No staging writes, no production access, no catalog load, no activation.

## Result (histórico 040-A)

The boundary remained blocked before RPC 040-A creation under the framing that mapping ordinal/payload lacked staging storage.

The real staging contract was captured in `runtime-40-20-staging-core-contract-040A.json`. The field projection map was materialized in `runtime-40-20-staging-core-projection-map-040A.json` and `runtime-40-20-staging-core-projection-map-040A.md`.

Classification histórica: `blocked_staging_contract_semantic_conflict`

## Errata 040-B

Documentación corregida sin reescribir el hecho histórico de la instrucción 040-A.

| Tema | Corrección |
| --- | --- |
| Mappings | Control **TR-028** (no TR-004). |
| Subfields | Controles **TR-005** y **TR-029** (no TR-007). |
| Interacciones | Base **TR-002**; causales **TR-003**. |
| `mapping_ordinal` | `technical_serialization_order`; **no** debe existir en staging. |
| `mapping_payload` | `redundant_technical_payload`; **no** debe existir en staging; el JSON 038-B ya lo excluye de `compared_fields`. |
| Clasificación mapping | `mapping_contract_authority_resolved` |

Detalle: `runtime-40-20-traceability-errata-040B.md`, `runtime-40-20-mapping-contract-authority-040B.md`.

## Reconciled safely

- `interaction_group` → `interaction_group_source`  
  Autoridad: `runtime-40-20-staging-core-contract-040A.json` → `public.runtime_interaction_def.columns` → `interaction_group_source`; origen `runtime-40-20-canonical-configuration-031.json` → `interactions[].interaction_group`.
- `group_normalized` → `interaction_group_normalized`  
  Autoridad: contrato 040-A columna `interaction_group_normalized`; origen 031C `interactions[].group_normalized`.
- `function_name` → `function_label`  
  Autoridad: contrato 040-A columna `function_label`; origen 031C `interactions[].function_name`.
- `raw_payload` → `raw_row_json`  
  Autoridad: contrato 040-A columna `raw_row_json`; proyección CatalogLoader 038-B.
- `subfield_ordinal` → `ordinal`  
  Autoridad: contrato 040-A `public.runtime_subfield_schema.columns` → `ordinal`; orden TR-005.
- Artifact sheet metadata can be preserved in `payload_json`/`metadata_json` under exact sheet payload preservation.
- Subfield provenance and raw payload can be preserved in `raw_row_json` (TR-005|TR-029).

## Mapping difference (relectura 040-B)

`runtime_interaction_mapping` in staging has no `mapping_ordinal` and no `mapping_payload`.

040-A treated this as a blocking semantic conflict because CatalogLoader 038-B creates `mapping_ordinal = index + 1`, the local adapter EXCEPT ALL includes `mapping_payload`, and the 039-A RPC candidate inserted both.

040-B resolves that those fields are **loader technical constructs**, not rector staging organs. The staging UNIQUE `(catalog_version_id, runtime_interaction_id, source_node_ref_id, mapping_role)` matches TR-028 / CATID-R1. Lineage authority remains in `runtime-40-20-source-lineage-031.json` and paired `source_nodes`/`source_codes` arrays.

Creating a corrected RPC must align to that tuple **without** inventing staging columns for ordinal/payload.

## Validation

- Staging contract captured with SELECT only.
- No RPC 040-A created.
- No local PostgreSQL fixture created because the projection map contained blocking rows under the 040-A framing.
- No SQL, code, schema, B0, B1, Gaby, sessions, runs, or catalog data modified by 040-A or 040-B documentation work.

## Next gap (040-B)

`align_governed_rpc_and_local_loader_diff_to_TR028_tuple_without_mapping_ordinal_or_mapping_payload`

## Closure note (040-C)

040-C completed the local alignment named above: loader / local adapter / fixture / RPC candidate 040-C project only the eight real staging mapping columns. Historical 039-A SQL was left untouched. Not deployed.

Next gap: `corrected_staging_schema_and_boundary_deployment_authorization_required`
