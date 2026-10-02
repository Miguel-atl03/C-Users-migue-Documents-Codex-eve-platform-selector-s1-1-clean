# Inspección de entorno — staging Unidad 2

Fecha: 2026-07-15  
**No se modificó producción.**

## Proyecto Supabase destino

| Campo | Valor |
|---|---|
| URL | `https://bwflscplkjohdhkiqqoc.supabase.co` |
| Clasificación | Remoto no-local (staging / desarrollo remoto autorizado) |
| Migraciones registradas (MCP) | **0** — Unidad 2A **pendiente de aplicar** |

## Esquema previo a migración Unidad 2A

| Elemento | Estado |
|---|---|
| `consultant_company_assignments` | **No existe** |
| `client_relationships` | **No existe** |
| `official_control_panel_context_audit` | **No existe** |
| `sesiones_llenado.client_company_id` | **No existe** |
| `empresas` | Existe con RLS habilitado |
| `sesiones_llenado` | Existe con RLS habilitado |

## Volumen y calidad de datos

| Recurso | Observación |
|---|---|
| Empresas | Múltiples registros; **duplicado detectado**: dos filas `Cerveceria Ambar Ancestral` (`e6cdd265-…`, `5c08029f-…`) |
| Sesiones (`sesiones_llenado`) | Existen sesiones legacy **sin vínculo explícito** caso–empresa (columnas aún ausentes) |
| Asignaciones Consultor–Empresa | **0** (tabla no creada) |
| Relaciones activas | **0** (tabla no creada) |
| Casos sin relación | N/A hasta aplicar migración y script administrativo |
| Relaciones sin empresa | N/A |

## RLS remoto

- **23 tablas** `public` sin RLS — ver `STAGING_RLS_RISK_REGISTER.md`.
- Unidad 2A agregará RLS forzado en tablas nuevas y políticas consultor en `empresas` / `sesiones_llenado`.

## Secretos y variables requeridas (staging)

| Variable | Uso | Notas |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente + BFF | URL remota staging |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente + BFF | Publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` / `MBA_SUPABASE_SERVICE_ROLE_KEY` | Scripts admin + verificador | Solo server-side |
| `EVE_CONSULTANT_CONTROL_PANEL_ACCESS_TOKEN` | Gate página (opcional) | Si se configura, sustituye bypass local |
| `EVE_CONSULTANT_CONTROL_PANEL_LOCAL_ENABLED` | **Debe ser `false` o ausente** | |
| `EVE_UNIT2B_TEST_PASSWORD` | **No desplegar** | Solo local |
| `.env.local` | **No desplegar** | |

## Next.js

| Campo | Valor |
|---|---|
| Versión repo | 16.2.5 (Webpack) |
| Versión desplegada staging | Pendiente de despliegue de rama validada |
| Caché BFF | `Cache-Control: private, no-store` |

## Cervecería Amber — evidencia remota

| Requisito | Estado |
|---|---|
| Empresa cliente | **Parcial** — existe como `Cerveceria Ambar Ancestral` (nombre distinto al seed local `Cervecería Amber`; **dos UUID duplicados**) |
| Asignación Consultor | **Pendiente** (post-migración + `manage-client-context.mjs`) |
| Relación activa | **Pendiente** |
| Caso en curso vinculado | **Pendiente** |
| Estado real del caso | **Pendiente** |

No se crearon fixtures ficticios en staging durante esta compuerta.

## Estrategia de rollback

Ver `STAGING_ROLLBACK_UNIT2.md`.

## Estado post-aplicación (2026-07-15)

1. Migración Unidad 2A **aplicada** en remoto (con correctiva).
2. Amber canónico vinculado; **80** huérfanos legacy quedan como deuda (sin autocorrección).
3. UI staging **bloqueada** hasta `EVE_STAGING_BASE_URL` + credenciales Consultor A/B + service role staging por secreto.
4. Ver `STAGING_GATE_DICTAMEN.md` y `STAGING_UI_CLOSEOUT_RUNBOOK.md`.
