# Runtime 40/20 - Gaby Runtime Ownership 045-R2A

## Dictamen

Clasificacion final: client_boundary_minimal_field_gap

R2 comparo en exceso el contrato del cliente contra el contrato interno de Runtime. Gaby no debe enviar catalog_version_id, source_trace, provenance_type, source_node_id, source_code ni capture_slot_kind como autoridad. Esos datos pertenecen al servidor, al run, al renderer y al crosswalk 044-A.3M.

La brecha real es mas pequena: el flujo vivo de Gaby necesita transportar una referencia opaca emitida por el servidor para identificar el run/interaccion/slot visible, o el backend debe poder resolverla de forma unica desde session + actividad + estado. Eso aun no esta acoplado al endpoint vivo /api/scenes/answers.

## Dos contratos

### A. Gaby client contract

Minimo: sessionId, sceneId o referencia de escena, valores de respuesta, y cuando la pregunta venga del Runtime, eco de una referencia opaca emitida previamente por el servidor.

### B. Runtime internal ingest contract

Incluye identidad de catalogo, run, interaccion, instancia, source slot, source trace, provenance, revision e idempotencia. Ese contrato debe armarlo la frontera server-side.

## Tabla campo por campo

| FIELD | CLIENT? | SERVER? | SOURCE OF AUTHORITY | CURRENTLY AVAILABLE? | GAP? |
| --- | --- | --- | --- | --- | --- |
| organization_id / tenant_id | False | True | runtime_run | True | no true authority gap |
| user/participant identity | False | True | authenticated_client_context | True | no true authority gap |
| sessionId | True | False | server_request_boundary | True | no true authority gap |
| case_id | False | True | runtime_run | True | no true authority gap |
| roleRuntimeSessionId | opaque_reference_allowed_but_not_semantic_authority | True | runtime_run | True | no true authority gap |
| activityRuntimeRunId | opaque_reference_gap_currently_not_carried | True | runtime_run | True | minimal opaque reference gap / binding gap |
| catalog_version_id | False | True | catalog_version | True | no true authority gap |
| runtime_interaction_id | opaque_reference_emitted_by_server_or_server_resolved_current | True | rendered_interaction_instance | True | minimal opaque reference gap / binding gap |
| interaction_instance_id | opaque_echo_optional_for_mismatch_check | True | rendered_interaction_instance | True | minimal opaque reference gap / binding gap |
| source_node_id | False | True | source_capture_crosswalk | True | no true authority gap |
| source_code | opaque_visible_control_ref_or answer key mapped to slot, not semantic authority | True | source_capture_crosswalk | True | minimal opaque reference gap / binding gap |
| capture_slot_kind | False | True | source_capture_crosswalk | True | no true authority gap |
| source_trace | False | True | rendered_interaction_instance | True | no true authority gap |
| provenance_type | False | True | source_capture_crosswalk | True | no true authority gap |
| response_revision_number | False | True | persistence_state | True | no true authority gap |
| idempotency_key | not as semantic Runtime authority; an opaque request token may be allowed in future | True | server_request_boundary | True | no true authority gap |
| answer value(s) | True | False | user_answer | True | no true authority gap |

## Decision

No hay 	rue_authoritative_identity_gap amplio. Hay materialidad para resolver la mayoria de los campos en servidor: finalize crea ole_runtime_session y ctivity_runtime_run; el renderer produce untime_interaction_id e instancia; 044-A.3M resuelve source slots; ingest_response arma payload interno con source trace, revision e idempotency.

Lo que falta es el contrato minimo/opaco entre la pregunta visible de Gaby y esa frontera gobernada.

## Seguridad

- cliente no controla lineage
- cliente no controla catalog authority
- cliente no controla provenance
- cliente no controla readiness
- cliente no controla canonical identity
- staging consulted: no
- production consulted: no
- code modified: no
- UI modified: no
- commit created: no
