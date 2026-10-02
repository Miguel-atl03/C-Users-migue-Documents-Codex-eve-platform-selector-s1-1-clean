# Capa 1 Persistence Schema

La arquitectura v2 vive en `sql/architecture_v02_capa1_scene.sql`.

## Entidades

- `scene_registry`: escena por `sesion_id` y `scene_id`, prioridad, profundidad, estado y version.
- `scene_question_answers`: respuestas por bloque/pregunta, texto literal, opciones, texto libre, `original_answer_id`, `clarification_answer_id`, `consolidated_value` y `provenance_chain`.
- `scene_answer_provenance`: fuente de cada dato capturado, aclarado, derivado o inferido.
- `scene_block_derivations`: variables canonicas derivadas con inputs, evidencia y confidence local.
- `scene_clarifications`: microaclaraciones sin sobrescribir evidencia original.
- `scene_consistency_flags`: contradicciones, gaps y acciones recomendadas.
- `scene_light_inferences`: Bloque 7, preclasificacion ligera, AHE/interpersonal ampliado, confidence, readiness y manual review.
- `scene_answer_bundles`: `compensation_bundle`, `ahe_observation_bundle` y `evidence_bundle_for_transduction`.
- `scene_canonical_records`: expediente canonico consolidado por escena.
- `session_intermediate_output`: salida agregada por sesion.

## Invariante

Ninguna inferencia ligera reemplaza evidencia capturada. La salida consolidada conserva referencias a respuestas, derivaciones, aclaraciones, flags, bundles y version de instrumento.
