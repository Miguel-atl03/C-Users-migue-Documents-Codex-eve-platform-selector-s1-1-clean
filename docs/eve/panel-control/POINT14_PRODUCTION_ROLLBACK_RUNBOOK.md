# Point 14 — Production rollback runbook

## Default (no destructivo)

```bash
psql "$DATABASE_URL" -f scripts/eve/official-control-panel/rollback-point14-parallel-production-preserve-data.sql
```

Efectos:

1. `parallel_production_write_control.enabled = false`
2. `REVOKE EXECUTE` sobre RPCs de escritura §14 (firma findings con params de reevaluación)
3. DML directo sigue revocado; `GRANT SELECT` autorizado permanece
4. Triggers append-only **permanecen activos** (UPDATE/DELETE/TRUNCATE de eventos → rechazo)
5. Tablas, eventos, findings e historial **intactos**

Post-condiciones obligatorias:

- RPC escritura → rechazada
- DML directo → rechazado
- mutación de eventos → rechazada
- lectura autorizada → disponible

## Reaplicación (solo EXECUTE)

```bash
psql "$DATABASE_URL" -f scripts/eve/official-control-panel/reapply-point14-parallel-production-writes.sql
```

Restaura `enabled=true` + `GRANT EXECUTE` a `service_role` sobre RPCs. **No** otorga DML directo.

## Físico (opcional, nunca default)

`rollback-point14-parallel-production-physical-optional.sql` — solo con autorización explícita; no es el rollback normal.

## Amber

No tocar el caso Amber `19fc9eff-4219-43f0-854c-e2b3350f23f2` en rollback ni seed.
