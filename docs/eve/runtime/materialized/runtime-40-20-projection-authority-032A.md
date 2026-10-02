# Runtime 40/20 projection authority 032A

## Sources

| Source | SHA-256 / identity |
| --- | --- |
| 027 schema contract ZIP | `3b33920cee89b943bf6fff9768fb5e0ee4268ab0557212d418422a2927b01910` |
| 028 semantic contract ZIP | `981b2c45ed76a12796cc4811311ae322ec0a4c0cf6240b41e5b1e51d5e81a7a9` |
| 031C canonical bundle | `78e6942f40712b49197d542cfd58cc47cd13a2be9255d1060c53d3bb45fd1472` |
| Historical SQL blob | `413ee32160c80ddaa3e3b764f9a67e387b5f7d2d` / `01b645bdf36ad3c601259a9ab364115376fc36c96d7561064fe1058835c64e9d` |

## Enum authority

| Enum | Historical labels | Workbook / runtime values | Dictamen |
| --- | --- | --- | --- |
| `eve_runtime_catalog_status` | `draft, active, frozen, superseded, archived` | `Version_Control row 14 status text` | `labels_materialized_from_unreachable_blob` |
| `eve_runtime_group_source` | `base_40, causal_20, internal, clarification, microconfirmation` | `base_40, causal_20` | `labels_materialized_from_unreachable_blob` |
| `eve_runtime_group_normalized` | `base, causal, internal, clarification, microconfirmation` | `` | `labels_materialized_from_unreachable_blob` |
| `eve_runtime_epistemic_status` | `captured_user_evidence, ai_inferred_unconfirmed, user_confirmed_suggestion, user_corrected_evidence, user_confirmed_or_corrected_evidence, canonical_derivation, internal_calculated, derived_internal` | `captured_user_evidence, user_confirmed_or_corrected_evidence, derived_internal` | `labels_materialized_from_unreachable_blob` |

## Projection decisions

| Target | Source | Type relation | Status |
| --- | --- | --- | --- |
| `public.runtime_catalog_version.catalog_version_id` | Version_Control searched; no literal catalog_version_id. | absent -> text | `blocked_catalog_version_identity_missing` |
| `public.runtime_catalog_version.version_label` | Version_Control row 2 has package name, but no field explicitly named version_label; projection would require semantic relabeling. | string -> text | `blocked_projection_semantics_incomplete` |
| `public.runtime_catalog_version.status` | Unreachable historical blob 413ee32160c80ddaa3e3b764f9a67e387b5f7d2d contains enum eve_runtime_catalog_status labels; remote 027/028 references the same enum type. | enum label -> eve_runtime_catalog_status | `direct_literal` |
| `public.runtime_catalog_artifact_section.catalog_version_id` | Depends on runtime_catalog_version.catalog_version_id root identity. | referential key -> text | `blocked_catalog_version_identity_missing` |
| `public.runtime_catalog_artifact_section.payload_json` | none | None -> jsonb | `blocked_missing_source` |
| `public.source_node_ref.catalog_version_id` | Depends on runtime_catalog_version.catalog_version_id root identity. | referential key -> text | `blocked_catalog_version_identity_missing` |
| `public.source_node_ref.block_id` | 031 source preserved literally; transformation not authorized. | would require parsing from source code -> text | `blocked_unauthorized_transformation` |
| `public.runtime_interaction_def.catalog_version_id` | Depends on runtime_catalog_version.catalog_version_id root identity. | referential key -> text | `blocked_catalog_version_identity_missing` |
| `public.runtime_interaction_def.interaction_group_source` | Unreachable historical blob 413ee32160c80ddaa3e3b764f9a67e387b5f7d2d contains enum eve_runtime_group_source labels; remote 027/028 references the same enum type. | enum label -> eve_runtime_group_source | `direct_literal` |
| `public.runtime_interaction_def.interaction_group_normalized` | Unreachable historical blob 413ee32160c80ddaa3e3b764f9a67e387b5f7d2d contains enum eve_runtime_group_normalized labels; remote 027/028 references the same enum type. | enum label -> eve_runtime_group_normalized | `direct_literal` |
| `public.runtime_interaction_def.opens_nodes` | 031 source preserved literally; transformation not authorized. | descriptive text -> text[] | `blocked_schema_source_semantic_mismatch` |
| `public.runtime_interaction_def.closes_nodes` | 031 source preserved literally; transformation not authorized. | descriptive text -> text[] | `blocked_schema_source_semantic_mismatch` |
| `public.runtime_interaction_def.mutual_exclusion_policy` | 031 source preserved literally; transformation not authorized. | descriptive text -> jsonb | `blocked_schema_source_semantic_mismatch` |
| `public.runtime_interaction_def.free_text_weight` | 031 source preserved literally; transformation not authorized. | qualitative text -> numeric(8,2) | `blocked_schema_source_semantic_mismatch` |
| `public.runtime_interaction_def.fatigue_policy` | 031 source preserved literally; transformation not authorized. | descriptive text -> jsonb | `blocked_schema_source_semantic_mismatch` |
| `public.runtime_interaction_def.epistemic_status_default` | Unreachable historical blob 413ee32160c80ddaa3e3b764f9a67e387b5f7d2d contains enum eve_runtime_epistemic_status labels; remote 027/028 references the same enum type. | enum label -> eve_runtime_epistemic_status | `direct_literal` |
| `public.runtime_interaction_def.must_not_infer` | 031 source preserved literally; transformation not authorized. | descriptive text -> boolean | `blocked_schema_source_semantic_mismatch` |
| `public.runtime_interaction_def.canonical_variables` | 031 source preserved literally; transformation not authorized. | literal text -> text[] | `blocked_schema_source_semantic_mismatch` |
| `public.runtime_interaction_def.required_variables` | 031 source preserved literally; transformation not authorized. | literal text -> text[] | `blocked_schema_source_semantic_mismatch` |
| `public.runtime_interaction_def.derived_variables` | 031 source preserved literally; transformation not authorized. | literal text -> text[] | `blocked_schema_source_semantic_mismatch` |
| `public.runtime_interaction_def.optional_variables` | 031 source preserved literally; transformation not authorized. | literal text -> text[] | `blocked_schema_source_semantic_mismatch` |
| `public.runtime_interaction_def.confirmation_weight` | 031 source preserved literally; transformation not authorized. | qualitative text -> numeric(8,2) | `blocked_schema_source_semantic_mismatch` |
| `public.runtime_interaction_def.can_be_inferred_from` | 031 source preserved literally; transformation not authorized. | descriptive text -> text[] | `blocked_schema_source_semantic_mismatch` |
| `public.runtime_interaction_mapping.catalog_version_id` | Depends on runtime_catalog_version.catalog_version_id root identity. | referential key -> text | `blocked_catalog_version_identity_missing` |
| `public.runtime_interaction_mapping.runtime_interaction_id` | runtime-40-20-source-lineage-031.json lineage_relations[].interaction_id | string -> text | `direct_literal` |
| `public.runtime_interaction_mapping.source_node_ref_id` | 027 remote constraints: source_node_ref_id default plus unique catalog/source constraints and mapping FK. | uuid -> uuid | `database_generated_identity_resolution` |
| `public.runtime_subfield_schema.catalog_version_id` | Depends on runtime_catalog_version.catalog_version_id root identity. | referential key -> text | `blocked_catalog_version_identity_missing` |

## Lineage and identity

- Lineage mappings: `170`
- `runtime_interaction_id`: direct literal from lineage relation records.
- `source_node_ref_id`: database generated UUID resolved by exact unique constraints and FK in 027.
- `catalog_version_id`: not invented; root remains blocked.

## Final

`blocked_schema_source_semantic_mismatch`
