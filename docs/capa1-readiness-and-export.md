# Capa 1 Readiness and Export

## Bloque 7

`src/services/scene-light-preclassification-engine.ts` calcula:

- `preclassification_scene_type`
- `preclassification_chain_position`
- `preclassification_vsm_role`
- `preclassification_ahe_signal`
- `preclassification_ahe_level_dominant`
- `preclassification_interpersonal_signal`
- `preclassification_interpersonal_note`
- `preclassification_mission_suggested`
- `confidence_level`, `confidence_score`, `confidence_reasoning`
- `questions_triggered`
- `preclassification_gap_flag`
- `flagged_for_manual_review`
- `preclassification_readiness`

Los estados validos son `ready_for_transduction`, `needs_micro_confirmation`, `needs_support_reentry`, `needs_manual_review` e `insufficient_evidence`.

## Bundle para transduccion

`evidence_bundle_for_transduction` contiene secciones machine-readable:

- `scene_identity`
- `systemic_framing`
- `trigger_evidence`
- `transformation_evidence`
- `handoff_evidence`
- `flow_evidence`
- `capacity_evidence`
- `compensation_evidence`
- `ahe_evidence`
- `supporting_interpersonal_patterns`
- `preclassification`
- `confidence`
- `flags`
- `gaps`
- `provenance_summary`

## Readiness de sesion

`src/services/session-intermediate-output-builder.ts` calcula `session_ready_for_transduction`. Solo es `true` cuando hay al menos una escena profunda consolidada, las escenas profundas tienen bundle, no hay gaps criticos, no hay revision manual/reentrada pendiente y la salida conserva version de instrumento.

## Lo que no exporta Capa 1

Capa 1 no exporta `diagnostic_finding`, `root_cause`, `closed_ahe_reading`, `closed_vsm_classification`, `capa_2_node_assignment` ni teorema de inevitabilidad.
