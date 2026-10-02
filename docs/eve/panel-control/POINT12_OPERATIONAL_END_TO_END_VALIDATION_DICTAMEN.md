# POINT12 — Validación operacional end-to-end (dictamen)

**Fecha:** 2026-07-17  
**Ambiente:** local únicamente (`127.0.0.1`)  
**Decisión:** **Punto 12 cerrado y validado operacionalmente en local.**  
**§13:** no iniciado.

## Alcance ejecutado

Circuito real validado:

Base de datos → RPC `publish_runtime_causal_evaluation` → `compute_and_publish_runtime_control_snapshot` → RLS → BFF oficial → Panel de Control oficial.

Sin nuevas tablas, migraciones ni componentes de producto. Reutilización exclusiva de la arquitectura ya aprobada.

## Artefactos test-only

| Artefacto | Ruta |
|-----------|------|
| Seed idempotente | `tests/e2e/setup/prepare-point12-runtime-operational-validation.mjs` |
| Playwright oficial | `tests/e2e/official-consultant-control-panel-rector-point-12-operational-validation.spec.ts` |
| Manifest | `reports/local/rector-point-12-operational-validation/manifest.json` |
| Capturas | `reports/local/rector-point-12-operational-validation/screenshots/` |

### Fixtures creados (no Amber)

- Consultor A autorizado: `point12-opval-a@example.invalid`
- Consultor B no autorizado: `point12-opval-b@example.invalid`
- Empresa / relación / caso / participante / perfil / sesión / selección §11 effective
- 4 actividades primarias + 4 `activity_runtime_run` aislados

IDs canónicos (namespace `a1200012-…`): ver `manifest.json`.

### Nota factual de RLS draft_p3 (local)

En el shape local draft_p3, `activity_runtime_run` y tablas P3 usan políticas `eve_can_access_case` + `eve_current_tenant_id` (usuario de caso), mientras el ledger Point 12 usa `eve_consultant_can_access_runtime_run`.

Para habilitar el circuito Panel↔run sin migración nueva, el seed test-only vincula `usuarios.auth_user_id` del participante OpVal al Consultor A. El Consultor B permanece sin assignment y sin vínculo de usuario → aislamiento A/B verificado.

## Publicación causal

Por cada run de escenario (excepto D):

- C01–C20 insertadas en `validated` con evidencia requerida
- publicadas vía RPC real `publish_runtime_causal_evaluation`
- lifecycle `effective`
- catálogo efectivo: `point12-catalog-v1`

Escenario D: solo 5 evaluaciones efectivas.

Cierres válidos usados: `not_triggered_with_evidence` (+ evidencia `non_activation`).  
Abiertas: `triggered_unanswered` (+ evidencia `activation`) para C02 (P1) y C05 (P0).

## Escenarios A–D (snapshots calculados, no insertados)

| Escenario | Run | readiness_state | UI Estado de avance |
|-----------|-----|-----------------|---------------------|
| A ready | `…021` | `ready` | Puede avanzar |
| B ready_with_restrictions | `…022` | `ready_with_restrictions` | Puede avanzar con restricciones |
| C blocked | `…023` | `blocked` | Bloqueado |
| D not_evaluable | `…024` | `not_evaluable` | No evaluable |

Snapshots publicados únicamente con `compute_and_publish_runtime_control_snapshot(...)`.

## Controles P3 (escenario B)

Vinculados por `run_id = activity_runtime_run.id` del run de restricciones:

- gap activo P1 (C02)
- timer vigente (`due_at` 2099) + timer vencido (`due_at` 2020)
- reentry abierto (`reentry_target`)
- revisión manual abierta (`manual_review_required`)

Reconciliación snapshot B: `active_gap_count=1`, `overdue_timer_count=1`, `reentry_required=true`, `manual_review_required=true`.

## Seguridad A/B

### PostgREST (seed)

| Sujeto | Evals effective run ready | Snapshot | Gaps restrict | Runs |
|--------|---------------------------|----------|---------------|------|
| Consultor A | 20 | 1 | ≥1 | 1 |
| Consultor B | 0 | 0 | 0 | 0 |

Mutaciones authenticated bloqueadas (insert ledger + RPC snapshot).

### BFF

- Consultor A: `GET .../control-state` → 200, `readiness.state=ready`
- Consultor B: denegación genérica sin fuga de IDs del run

## Playwright oficial

`npx playwright test tests/e2e/official-consultant-control-panel-rector-point-12-operational-validation.spec.ts`

**3/3 passed** (sin local-ui-fixtures como evidencia).

Incluye: navegación Empresa→Caso→Usuario→Perfil→Sesión→Actividad→Run, matrices Base/Causal, cierres efectivos, estado de avance, Atención y gobernanza, refresh + back/forward, aislamiento B, Amber No evaluable.

## Capturas (13/13)

`reports/local/rector-point-12-operational-validation/screenshots/`

01-ready.png · 02-ready-con-restricciones.png · 03-bloqueado-p0.png · 04-no-evaluable.png · 05-gap-activo.png · 06-timer-vencido.png · 07-reentry.png · 08-revision-manual.png · 09-matriz-causal-cierre-real.png · 10-consultor-b-denegado.png · 11-desktop.png · 12-tablet.png · 13-mobile.png

## Regresión

| Chequeo | Resultado |
|---------|-----------|
| `verify-runtime-causal-evaluation-ledger.mjs` | pass |
| `verify-runtime-control-snapshots.mjs` | pass (4 snapshots OpVal) |
| RLS/PostgREST A/B (seed) | pass |
| §7–§12 node regressions | **67/67** pass |
| Playwright operacional | **3/3** pass |
| legacy freeze (`ccp-legacy-freeze`) | **4/4** pass |
| Amber sin run inventado | 0 `activity_runtime_run` en caso Amber; UI No evaluable |
| Secret scan (artefactos nuevos) | sin secretos embebidos |
| Staging / producción | **sin cambios** |
| TypeScript `tsc --noEmit` | errores **preexistentes** en `client-context-api.ts`, `activity-selection-repository.ts`, `runtime-matrix-repository.ts`, `resolve-causal-factual-overlay.ts` (no introducidos por este dictamen) |
| ESLint (matriz/atención) | warnings/errors de hooks **preexistentes** en fixtures path de `RuntimeActivityMatrixPanel` |
| `supabase db lint --local` | issue preexistente en rama canónica de `publish_runtime_causal_evaluation` (columna `branching_decision_id` en shape draft) — función operativa validada por publicación real C01–C20 |

## Persistencia de fixtures

Fixtures OpVal **permanecen** en local (idempotentes vía el script prepare). No se tocó Amber. Limpieza opcional: re-ejecutar prepare (upsert) o borrar filas `a1200012-%` si se desea reset.

## Confirmaciones de no impacto

- Amber: intacto (sin datos inventados; avance No evaluable).
- Staging: no modificado.
- Producción: no modificado.
- §13: no iniciado.

## Decisión final

**Punto 12 cerrado y validado operacionalmente en local.**
