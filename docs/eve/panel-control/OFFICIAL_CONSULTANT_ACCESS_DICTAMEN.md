# Dictamen: Acceso oficial del Consultor (corrección SSR)

**Fecha:** 2026-07-20  
**Ámbito:** Guarda server-side + identidades reales A/B + evidencia sin mocks

## Veredicto

**ACCESO OFICIAL DEL CONSULTOR APTO PARA PROMOCIÓN A PRODUCCIÓN**

## Criterios cerrados

| Criterio | Estado |
|----------|--------|
| Sesión SSR oficial (`@supabase/ssr` cookies) | PASS |
| `resolveOfficialConsultantAccess` server-only | PASS |
| Redirect HTTP 3xx antes del shell (middleware) | PASS |
| Page no monta shell sin capability | PASS |
| Identidades reales A/B/operativo/sin rol | PASS |
| E2E sin `page.route` / `.fulfill` | PASS |
| BFF denegación A desde B | PASS |
| Runtime creado para Consultor | 0 |
| `/local-session` | 0 |
| JWT demo / service_role browser | 0 |

## Evidencia

- Playwright 6/6 — `reports/local/official-consultant-access/playwright.log`
- Capturas `01`–`06` — identidades reales
- Unit SSR guard — PASS
- `tsc` + build — PASS

## Notas

- La page usa `redirect()` como defensa; el **middleware** emite el 307 observable.
- BFF Bearer permanece obligatorio para datos.
- No se modificó el modelo `consultant_company_assignments` ni §§1–17 / Runtime funcional.
