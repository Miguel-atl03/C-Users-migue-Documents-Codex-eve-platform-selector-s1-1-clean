# Exercise Plan

## Objetivo

Ejecutar un ejercicio local no productivo usando registros sinteticos in-memory para verificar Adapter local/in-memory + Bridge Reader sin tocar entorno fisico.

## Comando candidato

`node --test tests/regression/eve-organism-bridge-reader-real-source-adapter-local-e2e.test.ts`

## Precondiciones

- Test existente en `tests/regression/`.
- Fixture sintetico construido dentro del test.
- Servicio local sin conexion productiva.
- Contrato reporta `localInMemoryRecordsOnly: true`.
- Contrato reporta `sourceConnected: false`.
- Contrato reporta `realTableRead: false`.
- Contrato reporta `migrationExecuted: false`.

## No-Go pre-ejecucion

Bloquear si se detecta requerimiento de `.env`, DB real, Supabase, service_role, connection string, migracion, SQL edit, observer real, tabla real, produccion o credenciales.

Resultado: No-Go pre-ejecucion no activado.

## Evidencia esperada

- Comando ejecutado.
- Log sanitizado.
- Tests passed.
- Autoridad productiva false.
- DB/Supabase false.
- Migration false.
- Gate 2/Gate 3/Fase 9 false.
