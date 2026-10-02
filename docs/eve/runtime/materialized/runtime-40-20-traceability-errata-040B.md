# Cursor 040-B — Errata de trazabilidad

Soporta la clasificación `mapping_contract_authority_resolved`.  
No inventa TR-ID nuevos. No reescribe el hecho histórico de 040/040-A; corrige controles y literales.

## Correcciones TR

| Errata | Antes | Después | Fuente literal |
| --- | --- | --- | --- |
| 040B-TR-001 mappings | `mapping_ordinal` / `mapping_payload` bajo **TR-004** | **TR-028** | `runtime-40-20-trace-control-031.json` TR-028 `_source_row` 32: «Relación N:M interacción↔nodo» |
| 040B-TR-002 subfields | subfield rows bajo **TR-007** | **TR-005** + **TR-029** | TR-005 UX_Subfield_Structure; TR-029 `runtime_subfield_schema` |
| 040B-TR-003 interacciones | todas las filas `interactionDefinitions` como TR-002 | base **TR-002**, causales **TR-003**; filas genéricas: `TR-002\|TR-003` | trace-control-031 TR-002 / TR-003 |

**TR-004** permanece Restricted Field Model (`Required_Field_Model`).  
**TR-007** permanece Mapa de salida MMABP (`MMABP_Output_Map`). No se reasignan.

## Aliases (evidencia exacta)

Sustituir frases genéricas del tipo «explicit source evidence» por:

| Alias | Autoridad exacta |
| --- | --- |
| `interaction_group` → `interaction_group_source` | `runtime-40-20-staging-core-contract-040A.json` → `public.runtime_interaction_def.columns` → `interaction_group_source`; origen `runtime-40-20-canonical-configuration-031.json` → `interactions[].interaction_group` |
| `group_normalized` → `interaction_group_normalized` | contrato 040-A columna `interaction_group_normalized`; origen 031C `interactions[].group_normalized` |
| `function_name` → `function_label` | contrato 040-A columna `function_label`; origen 031C `interactions[].function_name` |
| `raw_payload` → `raw_row_json` | contrato 040-A columna `raw_row_json`; proyección loader 038-B |
| `subfield_ordinal` → `ordinal` | contrato 040-A `public.runtime_subfield_schema.columns` → `ordinal`; orden TR-005 |

## Framing de mapping (040B-FRAME-001)

**Antes (040-A):** la ausencia de `mapping_ordinal` / `mapping_payload` en staging bloqueaba el órgano de mapping.

**Después (040-B):** esos campos son construcciones técnicas del CatalogLoader 038-B (y espejo 039-A/fixture). La ausencia en staging es conforme con TR-028 y CATID-R1. El JSON 038-B ya excluye `mapping_payload` de `compared_fields`.

La clasificación histórica `blocked_staging_contract_semantic_conflict` se conserva como resultado de la instrucción 040-A; la porción específica de mapping queda supersedida por `mapping_contract_authority_resolved`.

## Integridad documental

| Errata | Corrección |
| --- | --- |
| 040B-UTF8-001 | Restaurar UTF-8 en `runtime-40-20-staging-schema-boundary-conformance-040.md` |
| 040B-HASH-001 | Recalcular SHA256 del bundle manifest 040-A tras las ediciones |

## Artefactos vivos actualizados por esta errata

- `runtime-40-20-staging-core-projection-map-040A.json`
- `runtime-40-20-staging-core-projection-map-040A.md`
- `runtime-40-20-staging-boundary-reconciliation-040A.json`
- `runtime-40-20-staging-boundary-reconciliation-040A.md`
- `runtime-40-20-staging-boundary-reconciliation-040A-bundle-manifest.json`
- `runtime-40-20-staging-schema-boundary-conformance-040.md`
