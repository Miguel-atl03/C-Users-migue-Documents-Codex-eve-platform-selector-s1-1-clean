# RECTOR R4 - Test Implementation

## Cadena ejecutada

1. `supabase db reset` aplica exclusivamente migraciones oficiales.
2. `provision-r4-acceptance-fixtures.mjs` prepara 12 contextos test-only.
3. `official-consultant-control-panel-rector-r4-acceptance.spec.ts` usa autenticación real y BFF/RPC productivos.
4. El spec ejecuta FX-01...FX-12, pruebas +/- de 19 criterios y produce 12 capturas.
5. `verify-r4-fixtures-and-acceptance.mjs` cruza manifests, hashes, código productivo, DB, seguridad y append-only.

## Correcciones permanentes

- Selección: snapshot server-side, lock transaccional, versión esperada, hash PostgreSQL, idempotencia concurrente y ledger append-only.
- Producción paralela: transiciones e intento de exportación autenticados, auditados y con scope/capability.
- Final alternativo: evento autenticado append-only que proyecta el estado canónico existente.
- FX-07 y FX-11: el usuario operativo produce el evento; `service_role` termina al finalizar el aprovisionamiento.
- El componente de Producción Paralela consume el BFF mediante el cliente de datos oficial, sin red embebida en la vista.

## Negativos físicos

- misma key/payload mediante `Promise.all`: mismo resultado y una versión;
- misma key/payload semántico distinto: `IDEMPOTENCY_CONFLICT`;
- selección >8 aportada por cliente: rechazo y cero mutación;
- resolución P-SUP-06 antes de reevaluación: 422;
- exportación ACA no satisfecha: 409;
- cruces caso/empresa/consultor: 403/404 y cero filtración;
- DML directo y mutación de ledgers/historial: denegados.

## Evidencia

- `reports/local/rector-r4-acceptance/manifest.json`
- `reports/local/rector-r4-acceptance/results/e2e-r4.json`
- `reports/local/rector-r4-acceptance/diagnostics/verify-summary.json`
- `reports/local/rector-r3-physical-runtime-panel/runtime-panel-ab-evidence.json`
