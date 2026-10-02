# Runbook — cierre UI staging Unidad 2

Usar **solo** cuando los tres insumos externos estén cargados en el entorno (no en archivos).

## Preflight (sin imprimir secretos)

```powershell
@('EVE_STAGING_BASE_URL','EVE_STAGING_SUPABASE_URL','EVE_STAGING_SUPABASE_ANON_KEY','EVE_STAGING_SUPABASE_SERVICE_ROLE_KEY','EVE_STAGING_CONSULTANT_A_EMAIL','EVE_STAGING_CONSULTANT_A_PASSWORD','EVE_STAGING_CONSULTANT_B_EMAIL','EVE_STAGING_CONSULTANT_B_PASSWORD') | ForEach-Object {
  if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($_))) { "MISSING:$_" } else { "PRESENT:$_" }
}
```

Abortar si falta cualquiera. **Nunca** escribir service role ni passwords a disco/bundle.

## IDs canónicos (no secretos)

| Rol | UUID |
|---|---|
| Empresa Amber | `5c08029f-15e9-4bbd-b13e-0ff4765e23b8` |
| Caso | `19fc9eff-4219-43f0-854c-e2b3350f23f2` |
| Relación (ya creada) | `7c499a1c-31c6-4fc9-8b20-2fd8cdc57043` |
| Asignación Consultor A | `173bcb79-b607-464e-8180-9b2f7b15432a` |

Label UI esperado: `Cerveceria Ambar Ancestral` (o `EVE_STAGING_AMBER_COMPANY_LABEL`).

## 1. Desplegar Unidad 2B sin flags locales

Variables de runtime staging permitidas:

- `NEXT_PUBLIC_SUPABASE_URL` = URL remota staging
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon staging
- `EVE_OFFICIAL_PANEL_RUNTIME_ENV=staging` (opcional endurecimiento)
- Token de acceso consultor **solo si** el gate de página lo exige en ese entorno

Prohibidas en el despliegue:

- `EVE_CONSULTANT_CONTROL_PANEL_LOCAL_ENABLED=true`
- `EVE_UNIT2B_TEST_PASSWORD`
- cualquier `.env.local` de desarrollo

Salida: URL pública → exportar como `EVE_STAGING_BASE_URL`.

## 2. Validar autenticación real

1. Login password grant Consultor A contra Auth staging.
2. Abrir panel con JWT (no solo cookie `eve_consultant_role`).
3. Confirmar que `POST .../local-session` responde **403** `local_session_unavailable`.
4. Confirmar que cookie sola muestra error de carga de contexto.

## 3. Verificador remoto

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL = $env:EVE_STAGING_SUPABASE_URL
$env:SUPABASE_SERVICE_ROLE_KEY = $env:EVE_STAGING_SUPABASE_SERVICE_ROLE_KEY
node scripts/eve/official-control-panel/verify-unit-2a-integrity.mjs
```

Esperado: `status: fail` por `orphanCases: 80` (o ≥1 legacy). **No** autocorregir.  
Registrar JSON en `docs/eve/panel-control/STAGING_UNIT2A_VERIFICATION_REPORT.md` (sin secretos).

## 4. Aislamiento dos usuarios reales

Prerrequisito: Consultor B existe en `auth.users` staging.

1. A asignado a Amber canónica (ya existe).
2. B **sin** asignación a Amber (o asignado a otra empresa).
3. Login A: ve empresa / relación / caso Amber.
4. Login B: **no** ve Amber ni el caso canónico.

Si B no existe: crear usuario staging controlado **antes** de esta prueba; no inventar fixtures en producción.

## 5–6. Playwright + capturas

```powershell
$env:EVE_STAGING_BASE_URL = '...'   # desde secreto/entorno
$env:EVE_STAGING_SUPABASE_URL = '...'
$env:EVE_STAGING_SUPABASE_ANON_KEY = '...'
$env:EVE_STAGING_CONSULTANT_A_EMAIL = '...'
$env:EVE_STAGING_CONSULTANT_A_PASSWORD = '...'
$env:EVE_STAGING_AMBER_COMPANY_LABEL = 'Cerveceria Ambar Ancestral'
npx playwright test tests/e2e/official-consultant-control-panel-staging-unit2.spec.ts
```

Salida esperada: `reports/staging/unit2/screenshots/` (dominio staging visible).

## 7. Dictamen final UI

Actualizar `STAGING_GATE_DICTAMEN.md`:

- Si pasos 1–6 pasan → **Aprobado staging completo Unidad 2** (deuda 80 huérfanos permanece).
- Si falla alguno → mantener **UI-staging bloqueada** con causa.

Bundle del dictamen: incluir docs + capturas; **excluir** `.env*`, keys, passwords.
