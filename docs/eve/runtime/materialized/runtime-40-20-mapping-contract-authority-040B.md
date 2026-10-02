# Cursor 040-B — Autoridad del contrato de mapping

## Clasificación final

`mapping_contract_authority_resolved`

HEAD: `8becedf4940b9bd19ec9d9968b9308d34070b555`  
Rama: `release/eve-c312-production`

## Resultado requerido

| Pregunta | Respuesta |
| --- | --- |
| ¿`mapping_ordinal` debe existir en staging? | **No** |
| ¿`mapping_payload` debe existir en staging? | **No** |
| Evidencia que lo demuestra | TR-028 (N:M sin ordinal/payload); CATID-R1 identidad `(catalog_version_id, runtime_interaction_id, source_node_id, mapping_role)`; contrato staging 040-A (8 columnas, UNIQUE sin ordinal); mapa 032 sin proyección de esos campos; lineage-031 con identidad por tupla y orden solo en explosión `source_nodes[i]`/`source_codes[i]` |
| Parte introducida técnicamente por el loader | `mapping_ordinal = index + 1` y `mapping_payload = relation` en CatalogLoader 038-B; fixture local y RPC 039-A los espejan |
| Corrección mínima siguiente | Alinear RPC/load a la tupla TR-028/CATID sin ordinal/payload; conservar lineage en `runtime-40-20-source-lineage-031.json` y artifact sections; desacoplar EXCEPT ALL local de columnas loader-only |

## Fuentes integradas

1. Catálogo Runtime 40/20 v1.1.1  
2. Catálogo Madre Capa 1 v1.0  
3. Configuración y lineage 031C  
4. Especificación Técnica Ejecutable  
5. Marco Estructural Maestro  
6. EVE-RUNTIME-CATID-R1  
7. EVE-RUNTIME-SEMPERSIST-R1  
8. Matriz_Trazabilidad_Rectora_Runtime_40_20_v1.xlsx (control transversal; no sustituye)  
9. CatalogLoader 038-B  
10. Frontera 039-A  
11. Snapshots y reconciliación 040/040-A  
12. Contrato real de staging capturado en 040-A  

## Tarea 1 — Inventario (síntesis)

| Naturaleza | Apariciones clave |
| --- | --- |
| `rector_explicit` | lineage-031 `ordered source_nodes[i] + source_codes[i]`; 031C `source_nodes`/`source_codes`; staging `runtime_interaction_def` arrays; TR-028; CATID InteractionMapping |
| `technical_derived` | loader `index+1` / `mapping_payload: relation`; adapter EXCEPT ALL; RPC 039-A INSERT |
| `test_only` | fixture local DDL con `mapping_ordinal` / `mapping_payload` |
| `evidence_preservation` | contrato staging 040-A: columnas ausentes |
| `unsupported` (como campo rector) | XLSX Runtime, Madre, Spec, Matriz, SEMPERSIST, mapa 032 — cero literales `mapping_ordinal` / `mapping_payload` |

Inventario completo: `runtime-40-20-mapping-contract-authority-040B.json` → `evidence_inventory`.

## Tarea 2 — `mapping_ordinal`

1. **Literal en rectores:** no.  
2. **Orden de 170 relaciones:** significado estructural solo como emparejamiento paralelo al explotar arrays; no como ordinal persistido causal.  
3. **Serialización:** sí — `index + 1` es orden de serialización del loader, no autoridad rectora.  
4. **Consumidor material:** staging/032/TR-028/CATID no dependen del ordinal; fixture local y RPC 039-A sí.  
5. **Reconstruible sin pérdida:** sí, desde lineage-031 + arrays pareados + UNIQUE staging / identidad CATID.

**Clasificación:** `technical_serialization_order`

No se acepta `index + 1` como autoridad rectora.

## Tarea 3 — `mapping_payload`

1. **Contenido:** objeto completo de relación de lineage-031 (`trace_id`, ids, provenance, resolución, flags).  
2. **Literal en rectores:** no.  
3. **Duplica lineage 031:** sí.  
4. **Duplica artifact sections:** parcialmente (filas de interacción con arrays; no la relación explotada).  
5. **Duplica `raw_row_json`:** no (ese guarda la fila de interacción).  
6. **Consumidor material:** staging no; EXCEPT ALL local y RPC 039-A sí; contrato JSON 038-B **excluye** `mapping_payload` de `compared_fields`.  
7. **Función:** snapshot de integridad técnica del loader, no órgano de persistencia rector.

**Clasificación:** `redundant_technical_payload` (también califica como `technical_integrity_snapshot` local).

## Corrección de lectura 040-A

040-A trató la ausencia de `mapping_ordinal` / `mapping_payload` en staging como conflicto semántico bloqueante.  
040-B determina que esa ausencia es **conforme** con TR-028, CATID-R1 y el contrato capturado.

El bloqueo residual, si persiste, está en otros drifts (artifact / interaction_def / subfield provenance / acoplamiento del adapter local), no en la obligación de materializar ordinal/payload en staging.

Ver errata: `runtime-40-20-traceability-errata-040B.md`.

## Nota de cierre local 040-C

La corrección mínima de proyección (`align_governed_rpc_and_local_loader_diff_to_TR028_tuple_without_mapping_ordinal_or_mapping_payload`) quedó materializada en local por 040-C. El dictamen de autoridad 040-B no cambia. No hay despliegue.

## Seguridad

```text
staging consulted: no
production consulted: no
remote writes: none
code functional modified: no
SQL modified: no
B0 modified: no
B1 modified: no
Gaby modified: no
commit created: no
```
