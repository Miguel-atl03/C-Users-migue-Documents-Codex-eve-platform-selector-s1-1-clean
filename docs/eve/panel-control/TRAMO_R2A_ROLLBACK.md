# TRAMO R2A — Rollback

Solo **local**. No staging/producción.

- Migración: `supabase/migrations/20260715200000_eve_official_control_panel_tramo_r2a_case_participants.sql`
- SQL: `scripts/eve/official-control-panel/rollback-tramo-r2a.sql`

Requiere tablas vacías y sin filas de auditoría R2A.

```bash
docker exec -i supabase_db_eve-platform psql -U postgres -d postgres < scripts/eve/official-control-panel/rollback-tramo-r2a.sql
```

Verificar: `node scripts/eve/official-control-panel/inspect-tramo-r2-case-participants.mjs`
