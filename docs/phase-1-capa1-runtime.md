# Fase 1 Capa 1 v2.1 Runtime

EVE Capa 1 captura escenas operativas reguladas. No diagnostica, no cierra AHE/VSM y no genera caminos de inevitabilidad. Su trabajo termina cuando la escena queda persistida, trazable, consolidada y lista o no lista para transduccion causal operacional.

## Separacion canon-runtime

- `eve-canonical-system` define el canon metodologico: bloques 0, 0.5, 1, 2, 3, 4, 5, 6 y 7, preguntas, variables, gates, epistemic boundaries, diccionario y manifest.
- `eve-platform` consume `src/runtime/capa-1-v2-1-runtime-manifest.json` y `src/runtime/platform-consumption-contract.json`.
- El runtime no mantiene un catalogo divergente para Capa 1 v2.1. El loader estricto esta en `src/runtime/capa1-runtime-manifest.ts`.

## Flujo ejecutable

El flujo de Fase 1 es:

`session_bootstrap -> scene_intake -> scene_prioritization -> scene_capture_core -> scene_capture_capacity -> scene_capture_compensation -> scene_light_preclassification -> scene_micro_confirmation/support_reentry si aplica -> scene_canonical_consolidation -> session_intermediate_ready`.

Los endpoints operativos son:

- `/api/session/bootstrap`
- `/api/scenes/bootstrap`
- `/api/scenes/answers`
- `/api/scenes/derive`
- `/api/scenes/consistency`
- `/api/scenes/preclassify`
- `/api/scenes/canonicalize`
- `/api/session/intermediate-output`

## Regla de frontera

Capa 1 solo entrega evidencia, derivaciones, inferencias ligeras, flags, gaps y readiness. Capa 2 consume `evidence_bundle_for_transduction`; el consultor experto EVE cierra el analisis final.
