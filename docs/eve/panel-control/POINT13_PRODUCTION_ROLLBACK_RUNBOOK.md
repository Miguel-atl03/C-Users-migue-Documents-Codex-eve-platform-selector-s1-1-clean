# Point 13 — Production rollback runbook (non-destructive, non-writable)

## Default rollback (preserve data + block ALL writes)

1. Stop the producer that calls `eve_apply_manual_work_transition`.
2. Apply:

```bash
psql "$DATABASE_URL" -f scripts/eve/official-control-panel/rollback-point13-manual-work-preserve-data.sql
```

3. Deploy application build **without** §13 BFF/UI surfaces (or feature-flag off).
4. Verify:
   - tables and events still present;
   - consultant SELECT still RLS-scoped;
   - `manual_work_write_control.enabled = false`;
   - `EXECUTE` on `eve_apply_manual_work_transition` revoked for `service_role`;
   - direct DML for `service_role` remains revoked;
   - RPC transition attempt fails;
   - direct insert of work item / event fails;
   - authorized read still works.

## Before / after matrix

| Acción | Antes del rollback | Después del rollback |
|--------|--------------------|----------------------|
| DML directo `service_role` | Rechazado | Rechazado |
| RPC `eve_apply_manual_work_transition` | Aceptada (si triple válido) | Rechazada |
| Insert directo de evento | Rechazado | Rechazado |
| Lectura consultor autorizado | Disponible | Disponible |
| Historial de eventos | Intact | Intact |

## Reaplicación (restaurar operación gobernada)

```bash
psql "$DATABASE_URL" -f scripts/eve/official-control-panel/reapply-point13-manual-work-writes.sql
```

Efectos:

- `manual_work_write_control.enabled = true`
- `GRANT EXECUTE` solo sobre la RPC gobernada
- DML directo permanece revocado
- Verificar transición válida + correr `verify-point13-manual-work-integrity.mjs`

## Optional physical retirement

Only after verified backup + restore drill:

`scripts/eve/official-control-panel/rollback-point13-manual-work-physical-optional.sql`

**Never** treat `DROP TABLE` as the normal production rollback.
