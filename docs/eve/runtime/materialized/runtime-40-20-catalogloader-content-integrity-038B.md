# Runtime 40/20 CatalogLoader Content Integrity 038-B

## Objetivo cerrado

Se corrigio exclusivamente la validacion de reintento del CatalogLoader para detectar diferencias de contenido aunque los conteos sean iguales.

## Defecto anterior

El reintento podia aceptar una version existente cuando los conteos por tabla coincidian, sin demostrar equivalencia exacta de los campos materiales.

## Correccion

El adaptador local calcula diferencias bidireccionales para las nueve tablas autorizadas:

- expected_minus_persisted
- persisted_minus_expected

Si cualquier tabla difiere, el servicio devuelve:

`blocked_catalog_identity_content_conflict`

La transaccion no inicia y las escrituras realizadas son 0.

## Contrato de comparacion

| Tabla | Llave estable | Campos excluidos |
| --- | --- | --- |
| runtime_catalog_version | catalog_version_id | created_at, updated_at |
| runtime_catalog_artifact_section | catalog_version_id, section_key | artifact_section_id, created_at, updated_at |
| source_node_ref | catalog_version_id, source_node_id, source_question_code_intact | source_node_ref_id, created_at, updated_at |
| runtime_interaction_def | catalog_version_id, runtime_interaction_id | created_at, updated_at |
| runtime_interaction_mapping | catalog_version_id, runtime_interaction_id, source_node_id, source_question_code_intact | runtime_interaction_mapping_id, source_node_ref_id, created_at, updated_at |
| runtime_subfield_schema | catalog_version_id, runtime_interaction_id, subfield_key | created_at, updated_at |
| runtime_branching_rule | catalog_version_id, runtime_interaction_id, field_name | created_at, updated_at |
| runtime_epistemic_rule | catalog_version_id, runtime_interaction_id, field_name | created_at, updated_at |
| runtime_variable_map | catalog_version_id, runtime_interaction_id, field_name | created_at, updated_at |

## Pruebas 038-B

| Tabla/caso | Conteos iguales | Conflicto detectado | Escrituras |
| --- | --- | --- | ---: |
| runtime_catalog_version | true | true | 0 |
| runtime_catalog_artifact_section | true | true | 0 |
| source_node_ref | true | true | 0 |
| runtime_interaction_def | true | true | 0 |
| runtime_interaction_mapping | true | true | 0 |
| runtime_subfield_schema | true | true | 0 |
| runtime_branching_rule | true | true | 0 |
| runtime_epistemic_rule | true | true | 0 |
| runtime_variable_map | true | true | 0 |
| runtime_catalog_artifact_section | false | true | 0 |
| runtime_interaction_mapping | false | true | 0 |
| runtime_subfield_schema | false | true | 0 |
| runtime_branching_rule | false | true | 0 |
| runtime_epistemic_rule | false | true | 0 |
| runtime_variable_map | false | true | 0 |
| runtime_catalog_version_root_mutation | false | true | 0 |
| source_node_ref | false | true | 0 |
| runtime_interaction_def | false | true | 0 |

## Resultado

CatalogLoader: implemented_not_connected

Clasificacion final: catalogloader_minimal_materialized_local_only

Brecha siguiente: public_runtime_catalog_draft_governed_staging_boundary_required

## Seguridad

staging consulted: no
staging writes: none
production consulted: no
remote database writes: none
remote migrations: none
RPC/BFF created: no
catalog activated: no
B0 modified: no
B1 modified: no
Gaby modified: no
commit created: no
