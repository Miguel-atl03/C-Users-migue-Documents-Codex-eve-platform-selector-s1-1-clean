# Runtime 40/20 schema-source conformance 032B

## Final classification

`blocked_complementary_source_unavailable`

## Source status

| Source | Status | Evidence |
| --- | --- | --- |
| Fase 2 matrix | historical blob found | `94b0fa7ef550a3c2c3a5fd6da0f2e5b8dd655799` / `a086b161fef5602d48cf09925b32cfefc44d337b16c8e407067752732798059e` |
| 2026-06-04 phase1 SQL | historical blob found | `413ee32160c80ddaa3e3b764f9a67e387b5f7d2d` / `01b645bdf36ad3c601259a9ab364115376fc36c96d7561064fe1058835c64e9d` |
| 001_runtime_40_20_schema.sql | not found | visible files, zips, git history, unreachable blobs exhausted |

## Decisions

| Target | TR-ID | F2-AUD-ID | Status | Dictamen |
| --- | --- | --- | --- | --- |
| `public.runtime_catalog_version.catalog_version_id` | `None` | `F2-AUD-025, F2-AUD-028, F2-AUD-035` | `blocked_catalog_identity_governance_missing` | blocked_catalog_identity_governance_missing |
| `public.runtime_catalog_version.version_label` | `None` | `F2-AUD-028` | `direct_literal` | direct_literal |
| `public.runtime_catalog_version.status` | `None` | `` | `provisional_historical_enum_evidence` | provisional_historical_enum_evidence |
| `public.runtime_catalog_artifact_section.catalog_version_id` | `None` | `F2-AUD-025, F2-AUD-028, F2-AUD-035` | `blocked_catalog_identity_governance_missing` | blocked_catalog_identity_governance_missing |
| `public.runtime_catalog_artifact_section.payload_json` | `TR-001` | `F2-AUD-001, F2-AUD-019, F2-AUD-029, F2-AUD-031` | `authorized_exact_sheet_payload_preservation` | authorized_exact_sheet_payload_preservation |
| `public.source_node_ref.catalog_version_id` | `None` | `F2-AUD-025, F2-AUD-028, F2-AUD-035` | `blocked_catalog_identity_governance_missing` | blocked_catalog_identity_governance_missing |
| `public.source_node_ref.block_id` | `TR-019` | `F2-AUD-026` | `direct_literal` | direct_literal |
| `public.runtime_interaction_def.catalog_version_id` | `None` | `F2-AUD-025, F2-AUD-028, F2-AUD-035` | `blocked_catalog_identity_governance_missing` | blocked_catalog_identity_governance_missing |
| `public.runtime_interaction_def.interaction_group_source` | `None` | `F2-AUD-006, F2-AUD-008` | `provisional_historical_enum_evidence` | provisional_historical_enum_evidence |
| `public.runtime_interaction_def.interaction_group_normalized` | `None` | `F2-AUD-006, F2-AUD-008` | `provisional_historical_enum_evidence` | provisional_historical_enum_evidence |
| `public.runtime_interaction_def.opens_nodes` | `TR-002/TR-003` | `F2-AUD-006, F2-AUD-008` | `blocked_no_transformation_authority` | schema conforms but projection blocked |
| `public.runtime_interaction_def.closes_nodes` | `TR-002/TR-003` | `F2-AUD-006, F2-AUD-008` | `blocked_no_transformation_authority` | schema conforms but projection blocked |
| `public.runtime_interaction_def.mutual_exclusion_policy` | `TR-002/TR-003` | `F2-AUD-006, F2-AUD-008` | `blocked_no_transformation_authority` | schema conforms but projection blocked |
| `public.runtime_interaction_def.free_text_weight` | `TR-002/TR-003` | `F2-AUD-006, F2-AUD-008` | `blocked_no_transformation_authority` | schema conforms but projection blocked |
| `public.runtime_interaction_def.fatigue_policy` | `TR-002/TR-003` | `F2-AUD-006, F2-AUD-008` | `blocked_no_transformation_authority` | schema conforms but projection blocked |
| `public.runtime_interaction_def.epistemic_status_default` | `None` | `F2-AUD-006, F2-AUD-008` | `provisional_historical_enum_evidence` | provisional_historical_enum_evidence |
| `public.runtime_interaction_def.must_not_infer` | `TR-002/TR-003` | `F2-AUD-006, F2-AUD-008` | `blocked_no_transformation_authority` | schema conforms but projection blocked |
| `public.runtime_interaction_def.canonical_variables` | `TR-008` | `F2-AUD-006, F2-AUD-008` | `blocked_no_transformation_authority` | schema conforms but projection blocked |
| `public.runtime_interaction_def.required_variables` | `TR-008` | `F2-AUD-006, F2-AUD-008` | `blocked_no_transformation_authority` | schema conforms but projection blocked |
| `public.runtime_interaction_def.derived_variables` | `TR-008` | `F2-AUD-006, F2-AUD-008` | `blocked_no_transformation_authority` | schema conforms but projection blocked |
| `public.runtime_interaction_def.optional_variables` | `TR-008` | `F2-AUD-006, F2-AUD-008` | `blocked_no_transformation_authority` | schema conforms but projection blocked |
| `public.runtime_interaction_def.confirmation_weight` | `TR-002/TR-003` | `F2-AUD-006, F2-AUD-007` | `blocked_no_transformation_authority` | schema conforms but projection blocked |
| `public.runtime_interaction_def.can_be_inferred_from` | `TR-002/TR-003` | `F2-AUD-006, F2-AUD-007` | `blocked_no_transformation_authority` | schema conforms but projection blocked |
| `public.runtime_interaction_mapping.catalog_version_id` | `None` | `F2-AUD-025, F2-AUD-028, F2-AUD-035` | `blocked_catalog_identity_governance_missing` | blocked_catalog_identity_governance_missing |
| `public.runtime_subfield_schema.catalog_version_id` | `None` | `F2-AUD-025, F2-AUD-028, F2-AUD-035` | `blocked_catalog_identity_governance_missing` | blocked_catalog_identity_governance_missing |

## Security

```text
staging consulted: no
staging writes: none
production consulted: no
remote writes: none
loader created: no
BFF/RPC created: no
catalog activated: no
B0 modified: no
Gaby modified: no
commit created: no
```
