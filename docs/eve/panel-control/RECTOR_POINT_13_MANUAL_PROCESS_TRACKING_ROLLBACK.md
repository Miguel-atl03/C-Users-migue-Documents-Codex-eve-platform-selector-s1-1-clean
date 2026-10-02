# Rollback — §13 Manual process tracking

## Procedimiento predeterminado (producción / staging con datos)

**No destructivo y no escritural.** Conserva tablas, eventos e historial; bloquea RPC y DML.

Seguir: `POINT13_PRODUCTION_ROLLBACK_RUNBOOK.md`

```bash
psql "$DATABASE_URL" -f scripts/eve/official-control-panel/rollback-point13-manual-work-preserve-data.sql
```

Efectos:

- `manual_work_write_control.enabled = false`
- Revoca `EXECUTE` de `eve_apply_manual_work_transition`
- Conserva tablas e historial
- Mantiene RLS SELECT
- Requiere retirar BFF/UI §13 en el deploy de aplicación

## Reaplicación

```bash
psql "$DATABASE_URL" -f scripts/eve/official-control-panel/reapply-point13-manual-work-writes.sql
```

## Retirada física opcional

Solo con backup verificable: `rollback-point13-manual-work-physical-optional.sql`  
**Nunca** usar `DROP TABLE` como rollback normal.
