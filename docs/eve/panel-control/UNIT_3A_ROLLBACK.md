# UNIT 3A — Rollback controlado

Solo entorno **local** autorizado. No staging. No producción.

## Archivos

- Migración: `supabase/migrations/20260715180000_eve_official_control_panel_unit3a_process_structure.sql`
- SQL de rollback: `scripts/eve/official-control-panel/rollback-unit-3a.sql`

## Precondiciones

El rollback **falla** si existen:

- filas en `case_milestones` o `case_main_processes`;
- filas de auditoría con acciones Unit 3A (`main_process_*`, `milestone_*`, `current_milestone_set`).

Vaciar primero (admin controlado) o restaurar desde snapshot local.

## Procedimiento recomendado

1. Confirmar que solo corre contra Supabase local (`127.0.0.1` / contenedor `supabase_db_eve-platform`).
2. Vaciar estructura de prueba si existe.
3. Ejecutar:

```bash
docker exec -i supabase_db_eve-platform psql -U postgres -d postgres < scripts/eve/official-control-panel/rollback-unit-3a.sql
```

4. Alternativa limpia de desarrollo: `npx supabase db reset` (reaplica migraciones restantes; **borra datos locales**).
5. Verificar Unit 2A:

```bash
node scripts/eve/official-control-panel/verify-unit-2a-integrity.mjs
```

6. Confirmar ausencia de tablas 3A o re-aplicar migración si se desea reinstalar.

## Qué revierte

- Tablas `case_main_processes`, `case_milestones`
- Políticas RLS asociadas
- RPCs admin Unit 3A + verificador
- Triggers de integridad
- Extensión de acciones de auditoría → checklist Unit 2A

## Qué no toca

- Empresa / relación / caso Amber
- Asignaciones consultor
- UI del panel
- Staging / producción
- Runtime 40+20
