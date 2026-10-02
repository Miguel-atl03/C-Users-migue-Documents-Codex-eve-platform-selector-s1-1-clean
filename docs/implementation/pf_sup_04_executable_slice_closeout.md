# PF-SUP-04 Executable Slice Closeout

## 1. Dictamen

DICTAMEN: PF_SUP_04_EXECUTABLE_SLICE_FROM_PF_SUP_03_L6_COMPLETED

El corte PF-SUP-04 autorizado fue implementado como servicio puro local para materializar:

EscenaEvidencial [validated] x N -> PeliculaCausalAgregada [aggregated | blocked_by_insufficient_scenes]

Materiality moved: L4 contract_defined -> L6 service_present.

## 2. Files created

- src/services/eve/aggregation/causal-movie-types.ts
- src/services/eve/aggregation/causal-movie-aggregation-runner.ts
- src/services/eve/aggregation/causal-movie-aggregation-runner.test.mjs
- docs/implementation/pf_sup_04_executable_slice_closeout.md
- docs/implementation/pf_sup_04_executable_slice_traceability.json

## 3. Files modified

- none

## 4. Boundary preserved

- No P-SUP-05 implementation.
- No Runtime 40/20 full activation.
- No DB, Supabase, SQL or migrations.
- No endpoint or API route.
- No registry, IR, export, diagnosis, client narrative or Delivered output.

## 5. EscenaEvidencial input rule

Only EscenaEvidencial records with state validated are included in the SceneSet.

Non-validated scenes are excluded into excluded_scene_refs. If validated scenes are below the configured minimum, the result blocks with PF_SUP_04_INSUFFICIENT_SCENES and PF_SUP_04_REWORK_TO_PF_SUP_03_REQUIRED.

## 6. SceneSet materiality

SceneSet is materialized from validated scene ids only:

- state = aggregation_eligible when enough validated scenes exist.
- state = blocked_by_insufficient_scenes when the minimum scene rule is not met.
- inclusion_rule = state == validated.

## 7. AggregationIndex materiality

AggregationIndex is built only from structured EscenaEvidencial fields:

- observable_act_refs.
- mmabp_element_refs.
- source_scene_refs.
- state.
- mmabp_inconsistency_refs.
- governance_issue_refs.
- b7_boundary metadata.

It does not use summaries or free text as primary source.

## 8. PeliculaCausalAgregada state machine

PeliculaCausalAgregada is emitted as aggregated only when:

- SceneSet is aggregation_eligible.
- AggregationIndex is built.
- Forbidden outputs remain false.

Candidate refs are kept as candidate/boundary only:

- monetizable_signal_refs.
- loss_estimate_refs.
- ahe_blockage_refs.

## 9. B7 non-diagnostic preservation

B7 is preserved only as boundary metadata. If any validated scene contains B7 signals, the aggregated movie sets preserved_as_non_diagnostic = true and no_diagnostic_outputs_created = false.

## 10. No-Go verification

No-Go fields are always explicit:

- diagnosis_created: false
- client_narrative_created: false
- registry_created: false
- ir_created: false
- export_created: false
- b7_promoted_to_diagnosis: false
- monetizable_signal_promoted_to_final: false

## 11. Test execution

Command:

```text
node --test src/services/eve/aggregation/causal-movie-aggregation-runner.test.mjs
```

Status: passed.

Result: 16 tests passed, 0 failed.

## 12. Materiality level reached

Before: L4 contract_defined.

After: L6 service_present.

Marker candidate: PF_SUP_04_MATERIALITY_MARKER.

Implementation scope: local_pure_service_only.

## 13. What remains outside this tramo

- P-SUP-05 synthesis.
- Runtime 40/20 full integration.
- DB/Supabase persistence.
- Endpoint/API exposure.
- Registry, IR, export, diagnosis, client narrative, recommendation, TeoremaInevitabilidad and Delivered.

