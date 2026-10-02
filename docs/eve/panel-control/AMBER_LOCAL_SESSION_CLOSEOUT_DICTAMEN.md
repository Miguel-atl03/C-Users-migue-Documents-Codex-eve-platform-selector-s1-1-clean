# Dictamen — Cierre de sesión local para Cervecería Amber

Fecha: 2026-07-15  
Alcance: JWT real de Consultor en navegador/Playwright. Sin tocar datos Amber canónicos ni staging/producción. Sin Unidad 3.

## Causa exacta de la pérdida de sesión

1. **`ensureLocalConsultantAccessToken` evaluaba el gate local (`EVE_CONSULTANT_CONTROL_PANEL_LOCAL_ENABLED`) en el cliente antes de leer `getSession()`.** Esa variable no es `NEXT_PUBLIC_*`, así que en el navegador el gate fallaba y se descartaba la sesión inyectada en `localStorage` sin intentar usarla.
2. **El hook arrancaba en `loading-companies` y pedía empresas sin un estado explícito de autenticación.** Ante abortos de Strict Mode o sesión indeterminada, la UI podía quedar en “Cargando empresas…”.
3. **Playwright dependía de `eve_consultant_role` como atajo de página** y no verificaba bearer en el primer fetch BFF.
4. **La página exigía cookie de rol** aunque el BFF ya usa JWT Bearer; en local eso acoplaba mal shell y datos.

## Flujo corregido

```
Playwright helper (signInWithPassword local)
  → localStorage sb-127-auth-token (sesión Supabase real)
  → onAuthStateChange INITIAL_SESSION
  → AuthReadiness = authenticated
  → GET /client-companies con Authorization: Bearer <JWT>
  → cascada Amber
```

Fallback local (solo host localhost/127.0.0.1): `POST /local-session` → `setSession` (el servidor aplica el gate estricto).

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `data/local-session-bootstrap.ts` | Lee sesión primero; AuthReadiness; gate solo para bootstrap local |
| `hooks/use-client-context.ts` | AuthReadiness + onAuthStateChange; no fetch en `checking` |
| `data/client-context-api.ts` | Bearer obligatorio; 401/403 vs red |
| `page.tsx` (panel oficial) | Shell local sin cookie de rol; staging/prod fail-closed |
| `tests/e2e/helpers/authenticate-local-consultant.ts` | Helper local-only con rechazo remoto |
| `tests/e2e/official-consultant-control-panel-unit2b.spec.ts` | Sesión real + URL canónica + capturas |
| `tests/e2e/setup/prepare-official-control-panel-unit2b.mjs` | Desactiva fixture Amber legacy duplicado |
| `official-control-panel-local-session.test.mjs` | Pruebas de sesión |
| staging-gate / unit2b / amber-recovery tests | Ajustes de contrato |

## Resultados

| Chequeo | Resultado |
|---|---|
| Playwright unit2b | **10/10** |
| BFF Amber | pass (empresa/relación/caso canónicos; sin duplicado) |
| Verificador 2A | pass (`orphanCases: 0`, crosses 0) |
| Regresión sesión + gates + amber | pass |
| Bearer en primer fetch | presente (`Bearer ` + JWT); valor no logueado |
| KPIs / eje X / rail Y | inactivos |
| Staging / producción | sin cambios |
| Unidad 3 | no iniciada |

## URL canónica validada

`/admin/official-consultant-control-panel?mode=client-company&view=monitoring&company=5c08029f-15e9-4bbd-b13e-0ff4765e23b8&relationship=7c499a1c-31c6-4fc9-8b20-2fd8cdc57043&case=19fc9eff-4219-43f0-854c-e2b3350f23f2`

- Empresa: Cervecería Amber  
- Relación: Relación activa de Cervecería Amber  
- Caso: Caso INC16 Cervecería Amber Ancestral  
- Estado actual: No disponible  

## Capturas

`reports/local/amber-recovery/screenshots/`

- `01-login-local.png`
- `02-amber-activa.png`
- `03-url-canonica.png`
- `04-refresh.png`
- `05-desktop.png`
- `06-tablet.png`
- `07-mobile.png`

## Evidencia de bearer (sin exponer token)

Playwright `openOfficialPanelWithSession` espera el request a `/client-companies` y afirma:

- header `Authorization` empieza por `Bearer `
- longitud > 20 caracteres tras el prefijo
- no es `Bearer null`
