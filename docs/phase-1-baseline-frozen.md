# Fase 1 Baseline Congelada

Fecha de congelamiento: 2026-05-20

## Estado

Fase 1 de EVE queda congelada como baseline operativa de Capa 1 v2.1. La plataforma ejecuta captura, derivacion, consistencia, preclasificacion ligera, consolidacion canonica y salida intermedia de sesion sin producir diagnostico fuerte.

## Validacion contra DB activa

La migracion `sql/migrations/2026-05-19-runtime-manifest-contract.sql` fue aplicada en Supabase y validada contra la DB activa. El smoke runtime paso con columnas nativas, no por fallback de columnas faltantes.

Smoke ejecutado:

```text
node scripts/runtime-contract-e2e-smoke.mjs
```

Resultado:

- `status`: `passed`
- `scene_answers_saved`: 150 respuestas
- `scene_block_derivations_ready`: 173 derivaciones
- `scene_light_preclassification_ready`: Bloque 7 ampliado persistido
- `scene_canonical_record_ready`: record canonico generado
- `session_intermediate_output_ready`: salida intermedia generada

Campos nativos verificados en `scene_light_inferences`:

- `preclassification_ahe_level_dominant`
- `preclassification_interpersonal_signal`
- `preclassification_interpersonal_note`
- `questions_triggered`
- `preclassification_gap_flag`
- `flagged_for_manual_review`

Bundles verificados en `scene_answer_bundles`:

- `ahe_observation_bundle`
- `compensation_bundle`
- `evidence_bundle_for_transduction`

Todos los bundles deben permanecer con `not_diagnostic = true`.

## Contrato de consumo para Fase 2

Fase 2 solo puede iniciar desde:

- `evidence_bundle_for_transduction`
- `session_intermediate_output`

Fase 2 no debe reconstruir causalidad desde preguntas crudas ni usar `scene_question_answers` como fuente primaria diagnostica. Las respuestas crudas quedan como trazabilidad y evidencia auditable de Capa 1.

## Frontera metodologica

Capa 1 no produce:

- `diagnostic_finding`
- `root_cause`
- `closed_ahe_reading`
- `closed_vsm_classification`
- `capa_2_node_assignment`
- caminos de inevitabilidad
- teorema de inevitabilidad

Si falta evidencia, la salida debe conservar gaps, flags, `preclassification_gap_flag`, `flagged_for_manual_review` y `session_ready_for_transduction = false`.
