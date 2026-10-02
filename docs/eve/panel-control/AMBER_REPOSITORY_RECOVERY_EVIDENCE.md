# Cervecería Amber — inventario de evidencia en repositorio

Fecha: 2026-07-15  
Alcance: recuperación canónica local desde evidencia del repo. Sin staging. Sin inferencia por nombre.

## Identidad canónica adoptada

| Rol | UUID | Fuente primaria |
|---|---|---|
| Empresa | `5c08029f-15e9-4bbd-b13e-0ff4765e23b8` | `STAGING_AMBER_CANONICAL.md` (correlación documental con caso) |
| Caso | `19fc9eff-4219-43f0-854c-e2b3350f23f2` | `mba-control-plane.test.mjs`, `run-inc16-runtime-validation-v2.ps1`, matriz auditoría |
| Relación | `7c499a1c-31c6-4fc9-8b20-2fd8cdc57043` | `STAGING_ADMIN_DRY_RUN.md` (auxiliar, in-repo) |
| Asignación consultor | `173bcb79-b607-464e-8180-9b2f7b15432a` | `STAGING_ADMIN_DRY_RUN.md` (auxiliar, local) |

**Excluidos (no canónicos):** empresa `e6cdd265-b0a7-441d-a3b0-e0d7fdc842cf`, caso `cc983357-dd4a-42e9-b2f7-fa54364184df`.

**Estado actual del caso:** No disponible — ningún artefacto canónico declara `estado_actual` para `19fc9eff…`.

---

## Tabla de hallazgos

| Archivo | Línea o sección | Empresa UUID | Caso UUID | Nombre presentado | Relación declarada | Estado declarado | Tipo | Autoridad | Contradicciones |
|---|---|---|---|---|---|---|---|---|---|
| `tests/regression/mba-control-plane/mba-control-plane.test.mjs` | 1015–1016 | — | `19fc9eff-4219-43f0-854c-e2b3350f23f2` | — | — | — | Test | Canónica | No |
| `run-inc16-runtime-validation-v2.ps1` | 14–15 | — | `19fc9eff-4219-43f0-854c-e2b3350f23f2` | prefijo INC16 | — | — | Script | Canónica | No |
| `docs/audits/_eve_organism_real_signal_field_occurrence_matrix_v1.json` | ~55210 | — | `19fc9eff-4219-43f0-854c-e2b3350f23f2` | — | — | — | Matriz auditoría | Canónica | No |
| `docs/eve/panel-control/STAGING_AMBER_CANONICAL.md` | §Empresas duplicadas, §Registro | `5c08029f-15e9-4bbd-b13e-0ff4765e23b8` | `19fc9eff-4219-43f0-854c-e2b3350f23f2` | Cervecería Amber (UI) | — | — | Documento | Canónica | No — documenta exclusión de duplicado |
| `docs/eve/panel-control/STAGING_ADMIN_DRY_RUN.md` | §Resultado dry-run | `5c08029f-15e9-4bbd-b13e-0ff4765e23b8` | `19fc9eff-4219-43f0-854c-e2b3350f23f2` | Caso INC16 Cerveceria Ambar Ancestral | `7c499a1c-31c6-4fc9-8b20-2fd8cdc57043` | — | Documento ops | Auxiliar | No — variante ortográfica Ambar/Ámbar en label |
| `docs/eve/panel-control/STAGING_UNIT2A_VERIFICATION_REPORT.md` | §Caso canónico | — | `19fc9eff-4219-43f0-854c-e2b3350f23f2` | — | — | — | Informe | Auxiliar | No |
| `docs/eve/panel-control/STAGING_UI_CLOSEOUT_RUNBOOK.md` | §IDs Amber | `5c08029f-…` | `19fc9eff-…` | — | `7c499a1c-…` | — | Runbook | Auxiliar | No |
| `docs/eve/panel-control/STAGING_GATE_DICTAMEN.md` | §Amber | `5c08029f-…` | `19fc9eff-…` | — | — | — | Dictamen | Auxiliar | No |
| `docs/eve/panel-control/STAGING_ORPHAN_CASES_MASTER_INVENTORY.md` | §Preservación Amber | `5c08029f-…` | `19fc9eff-…` | — | `7c499a1c-…` | — | Inventario | Auxiliar | No |
| `reports/staging/unit2/orphan-evidence-registry.json` | `canonicalAmber` | `5c08029f-…` | `19fc9eff-…` | — | `7c499a1c-…` | — | Reporte JSON | Auxiliar | No |
| `tests/regression/consultant-control-panel/official-control-panel-unit2c.test.mjs` | clasificación huérfanos | `5c08029f-…` (preservado) | `19fc9eff-…` (no huérfano) | — | — | — | Test | Auxiliar | No |
| `tests/e2e/official-consultant-control-panel-unit2b.spec.ts` | constantes UI | — (antes `12000000-…`) | — | Cervecería Amber | — | Recopilación inicial (fixture viejo) | E2E | Auxiliar → actualizado | Sí — fixture no canónico sustituido por recovery |
| `tests/e2e/setup/prepare-official-control-panel-unit2b.mjs` | seed SQL | `12000000-…` (descartado) | `42000000-…` | Cervecería Amber | Relación Amber | `capa_1_triple` | Script seed | Descartada | Sí — superseded por `official-control-panel-amber-recovery.sql` |
| `docs/eve/panel-control/STAGING_ENVIRONMENT_INSPECTION.md` | §Amber remoto | dos UUID Amber | — | Cerveceria Ambar Ancestral | — | — | Inspección remota | Descartada para local | Sí — describe duplicado remoto, no canoniza local |
| `scripts/eve/official-control-panel/amber-repository-evidence-registry.json` | `canonical` | `5c08029f-…` | `19fc9eff-…` | Cervecería Amber / INC16 | `7c499a1c-…` | `null` | Registro machine | Canónica | No |
| `supabase/seed/official-control-panel-amber-recovery.sql` | INSERT idempotente | `5c08029f-…` | `19fc9eff-…` | Cervecería Amber / INC16 | `7c499a1c-…` | `null` | SQL seed local | Canónica | No |

---

## Contrato de persistencia (`sesiones_llenado` como caso)

Verificado en migraciones Unit 2A y seed de recovery:

| Campo | Rol |
|---|---|
| `id` (PK) | Identificador del caso = sesión de llenado |
| `usuario_id` | Participante (FK `usuarios`) — no sustituye `client_company_id` |
| `client_company_id` | Empresa cliente explícita del panel |
| `client_relationship_id` | Relación activa explícita |
| `display_name` | Etiqueta visible del caso |
| `estado_actual` | Estado operativo nullable — **no inventado** en recovery |
| `created_at` / timestamps | Metadatos de fila |

**Regla:** caso ≠ empresa del participante; el vínculo operativo es `client_company_id` + `client_relationship_id`.

---

## Trazabilidad repositorio → persistencia local

```
mba test + INC16 script + matriz  →  case UUID 19fc9eff…
STAGING_AMBER_CANONICAL.md        →  company UUID 5c08029f… (correlación documental)
STAGING_ADMIN_DRY_RUN.md          →  relationship 7c499a1c…, assignment 173bcb79…
amber-repository-evidence-registry.json
        ↓
official-control-panel-amber-recovery.sql (idempotente)
        ↓
recover-amber-context-from-repository.mjs --apply-local
        ↓
consultant_company_assignments + eve_admin_link_case_relationship (auditoría)
```

---

## Artefactos de recuperación

| Artefacto | Ruta |
|---|---|
| Registro evidencia | `scripts/eve/official-control-panel/amber-repository-evidence-registry.json` |
| Script recuperación | `scripts/eve/official-control-panel/recover-amber-context-from-repository.mjs` |
| Seed local | `supabase/seed/official-control-panel-amber-recovery.sql` |
| Pruebas regresión | `tests/regression/consultant-control-panel/official-control-panel-amber-recovery.test.mjs` |
