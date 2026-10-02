# Rollback — §14 Parallel Production & QA

Ver runbook: `POINT14_PRODUCTION_ROLLBACK_RUNBOOK.md`

## Predeterminado (preserva datos)

```bash
psql "$DATABASE_URL" -f scripts/eve/official-control-panel/rollback-point14-parallel-production-preserve-data.sql
```

## Reaplicación de escrituras (RPC only)

```bash
psql "$DATABASE_URL" -f scripts/eve/official-control-panel/reapply-point14-parallel-production-writes.sql
```

## Retirada física opcional

`rollback-point14-parallel-production-physical-optional.sql` — nunca como rollback normal.
