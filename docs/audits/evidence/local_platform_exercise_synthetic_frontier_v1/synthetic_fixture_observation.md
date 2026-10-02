# Synthetic Fixture Observation

## Fixture usado

El test construye registros sinteticos `ShadowOnlyOutboxEventsSourceRecord` en memoria mediante `syntheticRecord()`.

## Datos sinteticos observados

- tenant: `tenant-local`
- session: `session-local`
- activity: `activity-local`
- sourceReadMode: `local_memory`
- sourceKind: `shadow_outbox`
- producer: `local-e2e-fixture`

## Produccion

- Produccion usada: false.
- Datos productivos usados: false.
- Credenciales productivas usadas: false.

## Resultado

Fixtures validos alcanzaron Bridge Reader y fixtures invalidos fueron rechazados antes del Bridge Reader.
