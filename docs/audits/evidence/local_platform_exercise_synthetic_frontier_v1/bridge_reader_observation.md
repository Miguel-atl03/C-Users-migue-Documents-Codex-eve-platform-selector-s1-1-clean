# Bridge Reader Observation

## Bridge Reader ejercitado

true.

## Entrada sintetica

Registros sinteticos locales en memoria adaptados hacia `ShadowOnlyOutboxEventRecord`.

## Salida observada

- Registro sintetico valido aceptado.
- Batch sintetico valido aceptado.
- Divergencia `officialOutcome` vs `shadowOutcome` detectada.
- Registro sin `shadowOutcome` rechazado.
- Registry/export/diagnosis/Gate3/Fase9 intent flags rechazados.

## Tabla real

Sin tabla real.

`shadow_only_outbox_events` real conectado: false.

Real table read: false.
