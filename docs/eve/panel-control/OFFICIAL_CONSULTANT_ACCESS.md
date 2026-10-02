# Acceso oficial del Consultor al Panel de Control

## Veredicto de arquitectura

Autenticación oficial (Supabase Auth + cookies `@supabase/ssr`) y autorización factual (`consultant_company_assignments`) se resuelven **antes** de montar `OfficialControlPanelShell`.

## Sesión SSR oficial

| Pieza | Ubicación |
|-------|-----------|
| Browser client (cookies) | `src/lib/supabase.ts` → `createBrowserClient` |
| Middleware refresh + gate HTTP 3xx | `src/middleware.ts` |
| Server helper | `resolveOfficialConsultantAccess()` (`server-only`) |
| Page defense-in-depth | `src/app/admin/official-consultant-control-panel/page.tsx` |

Prohibido y ausente: `/local-session`, JWT demo, cookie de rol, service_role en browser, autorización solo en localStorage.

## Resolución server-side

`resolveOfficialConsultantAccess()`:

1. Lee usuario desde sesión cookie (anon key).
2. Consulta asignaciones vigentes bajo RLS.
3. Devuelve `anonymous` | `forbidden` | `authorized{ companyIds }`.

## Redirección anterior al shell

Middleware (HTTP real):

- sin sesión → `307 /?next=<panel>`
- sesión sin asignación → `307 /access-denied`
- autorizado → continúa; la page solo entonces monta el shell

La page repite la resolución como defensa en profundidad.

## Identidades reales (test-only)

Script: `scripts/eve/official-control-panel/provision-official-consultant.mjs --access-identities`

| Identidad | Email | Scope |
|-----------|-------|-------|
| Consultor A | `unit2b-consultant@example.invalid` | Empresa A (Amber) |
| Consultor B | `access-consultant-b@example.invalid` | Empresa B (Point12 OpVal) |
| Operativo | `access-operative@example.invalid` | sin assignments |
| Sin rol | `access-norole@example.invalid` | sin assignments |

Credenciales vía `EVE_UNIT2B_TEST_PASSWORD` (env efímero). `runtime_session_created: false`.

## Pruebas

- Playwright: `tests/e2e/official-consultant-access-login-panel.spec.ts` — **sin** `page.route` / `.fulfill`
- Unit SSR: `official-control-panel-ssr-access-guard.test.mjs`
- BFF A/B: Consultor B → relationships de A ≥400; UI sin Amber
- Capturas `01`–`06` en `reports/local/official-consultant-access/`

## Defensa en profundidad

BFFs siguen con Bearer + `authenticateOfficialControlPanelConsultant` + RLS. La guarda SSR no sustituye autorización de datos.
