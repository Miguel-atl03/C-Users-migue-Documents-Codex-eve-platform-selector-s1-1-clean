# Consultant Control Panel — test report (cutover v3)

**Fecha:** 2026-07-12  
**Suite:** `tests/regression/consultant-control-panel/consultant-control-panel.test.mjs`  
**Resultado:** 12/12 pass

## Cobertura ejercida

- Ruta oficial única + alias redirect + sin `/v2`
- INIT-001 (cases + readiness + matrix + alerts + status bar)
- ROLE-001/002 (`user_id` ≠ `role_runtime_session`, `ROLE_ASSIGNMENT_GAP`)
- Runtime 40/20 por `activity_runtime_run`
- Capa 2.0/2.5/3.0 solo descargas manuales disabled
- Capabilities hard-disabled + ACTION-001
- Acceso cliente bloqueado / sin service_role / sin Supabase browser
- Fixture Ámbar 40/20 + enrichment
- Legacy conservado offline; SUP data en state

## Typecheck

`tsc --noEmit` filtrado a paths CCP: sin errores pendientes tras fix de `mergeFixtureFilters` (view tipado).

## No ejecutado en esta pasada

- Build Next.js completo de producción
- E2E browser
- Habilitación real de downloads/manual actions
