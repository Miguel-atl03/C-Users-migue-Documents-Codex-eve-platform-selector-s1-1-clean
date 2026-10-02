# UNIT 4A — Rollback controlado

Solo **local**. No staging. No producción.

## Archivos

- Migración: `supabase/migrations/20260715190000_eve_official_control_panel_unit4a_core_milestones.sql`
- Fix: `supabase/migrations/20260715190100_eve_official_control_panel_unit4a_fix_code_ambiguity.sql`
- SQL: `scripts/eve/official-control-panel/rollback-unit-4a.sql`

## Precondiciones

Falla si existen filas en:

- `core_milestone_achievements`
- `case_core_milestones`
- `core_milestone_definitions`
- auditoría con acciones `core_*` / `main_process_core_code_set`

Vaciar primero o usar snapshot.

## Procedimiento

```bash
docker exec -i supabase_db_eve-platform psql -U postgres -d postgres < scripts/eve/official-control-panel/rollback-unit-4a.sql
```

O `npx supabase db reset` (borra datos locales).

Verificar Unit 3A:

```bash
node scripts/eve/official-control-panel/verify-unit-2a-integrity.mjs
node scripts/eve/official-control-panel/verify-unit-3a-integrity.mjs
```

## Qué revierte

Tablas/RPC/RLS Unit 4A y columna `core_process_code`.  
Checklist de auditoría vuelve al set Unit 3A.

## Qué no toca

Amber contexto Unit 2, UI KPI, staging/producción, Runtime.
