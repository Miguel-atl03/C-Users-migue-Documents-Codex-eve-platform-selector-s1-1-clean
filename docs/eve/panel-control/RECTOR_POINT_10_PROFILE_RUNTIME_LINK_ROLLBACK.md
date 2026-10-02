# Rollback — Puente perfil ↔ Runtime (§10)

Migración: `20260716170000_eve_official_control_panel_point10_profile_runtime_links.sql`  
Confirmación sugerida: `POINT10_PROFILE_RRS_ROLLBACK`

## Orden de reversión (local)

```sql
-- 1) Drop helper
drop function if exists public.eve_consultant_can_access_profile_rrs_link(uuid, uuid, uuid, uuid, timestamptz);

-- 2) Drop policy + table
drop policy if exists case_profile_rrs_links_consultant_assigned_select
  on public.case_profile_runtime_session_links;
drop trigger if exists trg_case_profile_rrs_link_integrity
  on public.case_profile_runtime_session_links;
drop trigger if exists trg_case_profile_rrs_links_set_updated_at
  on public.case_profile_runtime_session_links;
drop function if exists public.eve_enforce_case_profile_rrs_link_integrity();
drop table if exists public.case_profile_runtime_session_links;

-- 3) Restaurar constraints de auditoría a la lista R2A (sin acciones profile_runtime_session_*)
-- Reaplicar el bloque action_check / scope_check de
-- 20260715200000_eve_official_control_panel_tramo_r2a_case_participants.sql
```

## Validación

1. `supabase db reset` (local)  
2. Migrar hasta R2A + rector8  
3. Aplicar puente → verify script  
4. Rollback SQL → verify falla por tabla ausente  
5. Reaplicar migración  

**No aplicar en staging/producción.**
