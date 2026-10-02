# Canon Runtime Contract

El contrato canon-runtime se valida con `scripts/validate-platform-against-manifest.mjs`.

## Manifest

El manifest versionado incluye:

- metadata de version, hash y compatibilidad;
- bloques y preguntas;
- `field_type`, `answer_mode`, opciones, free text, reglas de branching y required;
- outputs canonicos, `stored_in`, proveniencia y rol epistemico;
- contrato de Bloque 7, escala 0-100 de confidence y estados de `preclassification_readiness`;
- bundles obligatorios: `compensation_bundle`, `ahe_observation_bundle`, `evidence_bundle_for_transduction`.

## Runtime

El renderer debe consumir `field_type` y `answer_mode`; no debe mostrar `internal_inference` ni `generated_review` no editable. La persistencia debe mantener separadas evidencia original, aclaracion, derivacion canonica, inferencia ligera y salida consolidada.

## Validacion cruzada

La validacion falla si hay drift de hash, falta renderer, falta persistencia, falta bundle, falta output esperado por Bloque 7, o si no existe `session_ready_for_transduction` en la salida de sesion.
