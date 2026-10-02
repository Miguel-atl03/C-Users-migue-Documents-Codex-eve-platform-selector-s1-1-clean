# POINT15_17_PRODUCT_ARTIFACT_CLEANUP

Fecha: 2026-07-18  
Checkpoint: git tag `pre-point15-17-production-purge`  
Backup ZIP: `%USERPROFILE%\Downloads\pre_point15_17_production_purge_checkpoint.zip`

## Archivos borrados

- `src/app/api/eve/official-consultant-control-panel/local-session/route.ts`
- `src/features/official-consultant-control-panel/components/OfficialPanelLocalAccessHelper.tsx`
- `src/services/eve/official-control-panel/official-panel-local-development.ts`
- `tests/e2e/fixtures/official-panel/LocalCoverageFixturesClient.tsx`
- `tests/e2e/fixtures/official-panel/README.md`
- Renombrado: `data/local-session-bootstrap.ts` → `data/session-bootstrap.ts` (sin fetch a ruta local)

## Fallbacks / bypass eliminados

- JWT demo Supabase CLI (`LOCAL_SUPABASE_DEMO_SERVICE_ROLE_KEY`)
- Loopback service-role fallback
- Modo `local_enabled` (role-header-only) en `consultant-control-panel-access.ts`
- Bypass de shell por `isOfficialPanelLocalDevelopment`
- Heurística `fixtureBlocked` por `display_name` /bloqueado/i
- `playwright.config.ts` ya no fuerza `EVE_CONSULTANT_CONTROL_PANEL_LOCAL_ENABLED`

## Rutas ausentes (producto)

- `/api/.../local-session` → no existe
- `/admin/.../local-ui-fixtures` → no existe
- Botón “Acceder como Consultor” → no existe

## Autenticación productiva

- Página: rechaza superficie cliente; datos vía BFF + Bearer JWT
- BFF: `authenticateOfficialControlPanelConsultant`
- Service role: `server-only` + fail-closed si falta env key
- E2E: password grant vía SDK/HTTP de Playwright (fuera del producto)

## Dependencias eliminadas del producto

- Ningún endpoint de password-grant en App Router
- Ningún JWT embebido funcional para privilegios

## Nota operativa para pruebas

- Playwright / BFF privilegiados requieren `SUPABASE_SERVICE_ROLE_KEY` (o `EVE_SUPABASE_LOCAL_SERVICE_ROLE_KEY`) en el runtime del servidor.
- Tras fail-closed, **no** hay fallback demo: sin esa clave, §16/instrumentación fallan cerrados (comportamiento esperado).
- No persistir service-role en bundles ni documentación.

## Copia limpia de build (`C:\eve-ola3-prod`)

Procedimiento: `scripts/eve/official-control-panel/sync-ola3-clean-copy.mjs`

Exclusiones obligatorias:
- `.env`, `.env.*`, `.env.local`, `.env.*.local`
- `.env.production.local`, `.env.development.local`, `.env.test.local`
- `.next`, `node_modules`, `reports`, `bundles`
- dumps históricos `docs/production-activation` y smokes `scripts/eve/production-activation` (JWT demo CLI embebidos; fuera del runtime del panel)

Build: variables públicas **solo por proceso** (placeholders). **Cero archivos `.env*`** en la copia. Log sin `Environments: .env*`.

Evidencia: `reports/local/rector-points-15-17/results/clean-build-final.txt`
