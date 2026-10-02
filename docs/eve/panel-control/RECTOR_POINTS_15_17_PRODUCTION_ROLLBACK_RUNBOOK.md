# Ola 3 §§15–17 — Rollback runbook

```bash
psql "$DATABASE_URL" -f scripts/eve/official-control-panel/rollback-point15-17-experience-preserve-data.sql
```

Efectos: `experience_write_control.enabled=false`; REVOKE EXECUTE RPCs; historial intacto; append-only activo; SELECT autorizado.

```bash
psql "$DATABASE_URL" -f scripts/eve/official-control-panel/reapply-point15-17-experience-writes.sql
```

Reaplica solo EXECUTE.
