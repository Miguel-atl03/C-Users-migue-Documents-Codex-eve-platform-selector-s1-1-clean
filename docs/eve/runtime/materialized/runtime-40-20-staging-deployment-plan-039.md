# Runtime 40/20 Staging Deployment Plan 039

## Estado

Plan creado para ejecucion futura. No desplegado en esta instruccion.

## Precondiciones

1. Confirmar autorizacion humana explicita para desplegar en `eve-staging-onboarding`.
2. Verificar nuevamente project ref `shrpiwkxcdgvbqymjecx`.
3. Ejecutar solo contra staging; produccion permanece prohibida.
4. Aplicar primero la migracion candidata de organos semanticos.
5. Validar RLS, policies y grants antes de cualquier carga.
6. Ejecutar la frontera gobernada con actor tecnico que tenga `load_runtime_catalog_draft`.
7. Cargar solo status `draft`.
8. No activar catalogo.

## Archivos Candidatos

- `supabase/migrations/20260805173000_eve_runtime_40_20_semantic_organs_candidate_039.sql`
- `docs/eve/runtime/materialized/runtime-40-20-semantic-organs-candidate-039.rollback.sql`
- `src/services/eve/runtime-40-20/catalog-loader/runtime-40-20-governed-catalog-draft-load-service.ts`
- `src/services/eve/runtime-40-20/catalog-loader/runtime-40-20-governed-catalog-draft-load-postgres-server-adapter.ts`
- `supabase/migrations/20260805174500_eve_runtime_40_20_governed_draft_load_rpc_candidate_039A.sql`
- `docs/eve/runtime/materialized/runtime-40-20-governed-draft-load-rpc-candidate-039A.rollback.sql`

## Riesgos A Controlar

- Diferencia futura del contrato staging.
- Ausencia de grants reales para `load_runtime_catalog_draft`.
- Intento de carga con status distinto de draft.
- Intento de usar la frontera desde cliente.
- Reintento con misma identidad y contenido divergente.

## Confirmacion 039

staging consulted: SELECT only
staging writes: none
remote migrations: none
catalog activated: no

## Correccion 039-A

Antes de cualquier despliegue futuro, aplicar y validar tambien el RPC candidato 039-A. La frontera debe invocarse con `targetEnvironment=governed_staging`, autorizacion previa `load_runtime_catalog_draft` y actor server-side.
## Trazabilidad 039-B

Gate rector agregado el 2026-08-05. Matriz verificada: `Matriz_Trazabilidad_Rectora_Runtime_40_20_v1.xlsx`, SHA-256 `1936369a01dcf46d8453d48788685055234b3ce2daf0ffa179a204f4076950e5`.

Resultado: todos los componentes 039/039-A quedan vinculados a TR-ID existentes; no se crean TR-ID nuevos; produccion y activacion permanecen prohibidas.
