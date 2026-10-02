# Runtime 40/20 Catalog Persistence Schema Contract

DICTAMEN: RUNTIME_40_20_CATALOG_PERSISTENCE_SCHEMA_CONTRACT_DRAFT

Este tramo crea un contrato local de persistencia y un borrador de migracion para almacenar definiciones del catalogo Runtime 40/20. No aplica la migracion, no toca Supabase, no ejecuta SQL y no activa el catalogo.

## Alcance creado

- Contrato de 14 tablas autorizadas de catalogo.
- Borrador SQL local en `supabase/migrations/20260702121000_eve_runtime_40_20_catalog_core.sql`.
- Contrato de checksums alineado con `runtime_spec_checksum`, `runtime_catalog_checksum` y `mother_catalog_checksum` como `text not null`.
- Servicio puro para construir el contrato desde el resultado de canonicalizacion.
- Frontera de seguridad que bloquea runtime, activacion, SQL, endpoint, evidencia real y tablas de ejecucion.
- Prueba ejecutable local con fixtures inline.

## Tablas soportadas

- `eve_runtime_catalog_version`
- `eve_runtime_source_node_ref`
- `eve_runtime_interaction_def`
- `eve_runtime_interaction_mapping`
- `eve_runtime_subfield_schema`
- `eve_runtime_canonical_variable_map`
- `eve_runtime_branching_rule`
- `eve_runtime_critical_route`
- `eve_runtime_semantic_gate`
- `eve_runtime_process_state_timer_gate`
- `eve_runtime_readiness_rule`
- `eve_runtime_qa_rule`
- `eve_runtime_implementation_dictionary`
- `eve_runtime_catalog_import_audit`

## Fronteras no cruzadas

- Runtime 40/20 no iniciado.
- Catalogo no activado.
- Migracion no aplicada.
- Supabase no tocado.
- SQL no ejecutado.
- Endpoint no creado.
- Tablas de ejecucion runtime no creadas.
- Evidencia de negocio no creada.

## Verificacion

Comando esperado:

```text
node --test src/services/eve/runtime-40-20/catalog-persistence/runtime-40-20-catalog-persistence.test.mjs
```

NEXT_AUTHORIZATION_REQUIRED: true
