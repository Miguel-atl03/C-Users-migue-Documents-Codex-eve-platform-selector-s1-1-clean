# Preflight UI staging — Unidad 2

Fecha: 2026-07-15 (reintento cierre definitivo)  
Resultado: **BLOQUEADO**

## Condición de inicio

Comprobado en Process / User / Machine env y presencia de archivos `.env.staging*`:

| Variable | Estado |
|---|---|
| `EVE_STAGING_BASE_URL` | MISSING |
| `EVE_STAGING_SUPABASE_URL` | MISSING |
| `EVE_STAGING_SUPABASE_ANON_KEY` | MISSING |
| `EVE_STAGING_SUPABASE_SERVICE_ROLE_KEY` | MISSING |
| `EVE_STAGING_CONSULTANT_A_EMAIL` | MISSING |
| `EVE_STAGING_CONSULTANT_A_PASSWORD` | MISSING |
| `EVE_STAGING_CONSULTANT_B_EMAIL` | MISSING |
| `EVE_STAGING_CONSULTANT_B_PASSWORD` | MISSING |

**PRESENT_COUNT=0 · ABSENT_COUNT=8**

No existen `.env.staging` ni `.env.staging.local`.  
`.env.local` no contiene nombres `EVE_STAGING_*` (no se leyeron valores).

## Decisión

**Unidad 2 staging bloqueada por insumos externos faltantes.**

No se ejecutó: preflight remoto, despliegue staging, verificador 2A remoto, auth A/B, Playwright staging ni capturas.

## Checks no ejecutados (pendientes al recibir insumos)

- `EVE_STAGING_BASE_URL` apunta a staging (no producción) + HTTPS
- Supabase = proyecto staging autorizado
- `POST /local-session` → 403 en staging
- Cookie `eve_consultant_role` no concede acceso
- Sin flags locales activos en el deploy (`EVE_CONSULTANT_CONTROL_PANEL_LOCAL_ENABLED`, `EVE_UNIT2B_TEST_PASSWORD`)
- Sin `.env.local` empaquetado / sin secretos en bundle
- `cache: "no-store"` en endpoints de contexto

## Canónicos (no secretos)

| Rol | UUID |
|---|---|
| Empresa Amber | `5c08029f-15e9-4bbd-b13e-0ff4765e23b8` |
| Relación | `7c499a1c-31c6-4fc9-8b20-2fd8cdc57043` |
| Caso INC16 | `19fc9eff-4219-43f0-854c-e2b3350f23f2` |

Huérfanos (80): **sin modificar**. Caso `cc983357-…`: **sin resolver**. Producción: **intacta**. Unidad 3: **no iniciada**.
