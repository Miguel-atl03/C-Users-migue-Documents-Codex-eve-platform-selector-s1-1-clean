# Dictamen — Recuperación canónica Cervecería Amber desde repositorio

Fecha: 2026-07-15  
Alcance: contexto operativo local reproducible desde evidencia del repo. **Sin staging. Sin producción. Sin Unidad 3.**

## Identidad confirmada

| Rol | UUID | Estado |
|---|---|---|
| Empresa canónica | `5c08029f-15e9-4bbd-b13e-0ff4765e23b8` | Confirmada en repo + persistida local |
| Caso canónico | `19fc9eff-4219-43f0-854c-e2b3350f23f2` | Confirmado (INC16 Cervecería Amber Ancestral) |
| Relación | `7c499a1c-31c6-4fc9-8b20-2fd8cdc57043` | Recuperada desde `STAGING_ADMIN_DRY_RUN.md` |
| Asignación consultor | `173bcb79-b607-464e-8180-9b2f7b15432a` | Creada local para `unit2b-consultant@example.invalid` |
| Duplicado excluido | `cc983357-dd4a-42e9-b2f7-fa54364184df` | No presente en local |

**Estado actual del caso:** No disponible (`estado_actual = null`, sin contradicción documental).

## Evidencia repositorio

Inventario completo: `docs/eve/panel-control/AMBER_REPOSITORY_RECOVERY_EVIDENCE.md`

Fuentes canónicas primarias:
- `tests/regression/mba-control-plane/mba-control-plane.test.mjs` (1015–1016)
- `run-inc16-runtime-validation-v2.ps1` (14–15)
- `docs/audits/_eve_organism_real_signal_field_occurrence_matrix_v1.json` (~55210)
- `docs/eve/panel-control/STAGING_AMBER_CANONICAL.md`

## Artefactos entregados

| Artefacto | Ruta |
|---|---|
| Registro machine-readable | `scripts/eve/official-control-panel/amber-repository-evidence-registry.json` |
| Script recuperación | `scripts/eve/official-control-panel/recover-amber-context-from-repository.mjs` |
| Seed idempotente (empresa + participante) | `supabase/seed/official-control-panel-amber-recovery.sql` |
| Smoke BFF local | `scripts/eve/official-control-panel/verify-amber-bff-local.mjs` |
| Pruebas regresión | `tests/regression/consultant-control-panel/official-control-panel-amber-recovery.test.mjs` |
| E2E alineado a UUID canónicos | `tests/e2e/setup/prepare-official-control-panel-unit2b.mjs`, `tests/e2e/official-consultant-control-panel-unit2b.spec.ts` |

## Resultados de ejecución local

### `--inspect`
- UUID canónicos consistentes
- Tablas requeridas identificadas
- Duplicado no presente en local
- Contexto incompleto antes de apply (esperado)

### `--dry-run`
- Plan: reutilizar empresa/caso/relación canónicos
- Asignación consultor única a Amber
- Sin staging, sin huérfanos, sin inferencia por nombre

### `--apply-local`
- `contextComplete: true`
- Empresa: Cervecería Amber
- Caso vinculado con `client_company_id` + `client_relationship_id`
- `duplicateCasePresent: false`
- Idempotente en segunda ejecución (`contextAlreadyComplete: true`)

### Verificador 2A (`verify-unit-2a-integrity.mjs`)
```json
{
  "status": "pass",
  "orphanCases": 0,
  "crossCompanyCases": 0,
  "invalidAssignments": 0,
  "missingPolicies": [],
  "missingConstraints": []
}
```

### BFF local (`verify-amber-bff-local.mjs`)
- `GET /client-companies` → Cervecería Amber (`5c08029f-…`)
- `GET /client-companies/{id}/relationships` → Relación activa de Cervecería Amber
- `GET /relationships/{id}/cases` → Caso INC16 canónico
- Duplicado `cc983357-…` **no visible**

### UI / Playwright
- BFF con JWT de consultor local: **pass** (cascada completa sin duplicado)
- Navegador sin sesión consultor: gate de carga (fail-closed esperado)
- Playwright unit2b: requiere sesión inyectada; en esta sesión quedó bloqueado en `loading-companies` por abort del efecto React al montar (mejora opcional en `use-client-context.ts`)
- URL canónica validada:  
  `/admin/official-consultant-control-panel?mode=client-company&view=monitoring&company=5c08029f-15e9-4bbd-b13e-0ff4765e23b8&relationship=7c499a1c-31c6-4fc9-8b20-2fd8cdc57043&case=19fc9eff-4219-43f0-854c-e2b3350f23f2`

## Pruebas

- `official-control-panel-amber-recovery.test.mjs`: **8/8**
- Verificador 2A post-apply: **pass**
- BFF smoke: **pass**

## Prohibiciones respetadas

- Cero cambios en staging
- Cero cambios en producción
- Sin variables `EVE_STAGING_*`
- Sin resolver `cc983357-…`
- Sin vincular 80 huérfanos
- Unidad 3 no iniciada
- Sin KPIs / eje X / rail Y poblados

## Consultor local

- Email: `unit2b-consultant@example.invalid`
- Asignación exclusiva a empresa canónica Amber (no todas las empresas)

## Archivos modificados en este dictamen

1. `scripts/eve/official-control-panel/recover-amber-context-from-repository.mjs` (nuevo)
2. `scripts/eve/official-control-panel/amber-repository-evidence-registry.json` (nuevo)
3. `scripts/eve/official-control-panel/verify-amber-bff-local.mjs` (nuevo)
4. `supabase/seed/official-control-panel-amber-recovery.sql` (nuevo)
5. `docs/eve/panel-control/AMBER_REPOSITORY_RECOVERY_EVIDENCE.md` (nuevo)
6. `docs/eve/panel-control/AMBER_REPOSITORY_RECOVERY_DICTAMEN.md` (este archivo)
7. `tests/regression/consultant-control-panel/official-control-panel-amber-recovery.test.mjs` (nuevo)
8. `tests/e2e/setup/prepare-official-control-panel-unit2b.mjs` (UUID canónicos Amber)
9. `tests/e2e/official-consultant-control-panel-unit2b.spec.ts` (UUID canónicos + estado No disponible)
10. `playwright.config.ts` (carga `.env.local` para e2e)
