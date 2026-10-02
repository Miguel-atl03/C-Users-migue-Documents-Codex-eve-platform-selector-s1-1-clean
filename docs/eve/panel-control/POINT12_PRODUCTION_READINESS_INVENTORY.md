# POINT12 — Inventario de preparación para producción

**Fecha:** 2026-07-17  
**Alcance:** Punto 12 Runtime 40+20 (matrices, ledger, control)  
**Nota:** Rutas relativas a `external-consumers/eve-platform`.

## Migraciones

| Artefacto | Ruta exacta |
|-----------|-------------|
| Required variable rules | `supabase/migrations/20260717180000_eve_point12_causal_required_variable_rules.sql` |
| Causal evaluation ledger | `supabase/migrations/20260717180100_eve_point12_runtime_causal_evaluation_ledger.sql` |
| Control snapshots | `supabase/migrations/20260717180200_eve_point12_runtime_control_snapshots.sql` |
| Ledger security/integrity fix | `supabase/migrations/20260717190000_eve_point12_runtime_ledger_security_integrity_fix.sql` |
| Catalog completion | `supabase/migrations/20260717190100_eve_point12_causal_catalog_completion.sql` |
| Snapshot integrity fix | `supabase/migrations/20260717190200_eve_point12_runtime_control_snapshot_integrity_fix.sql` |
| Consultant runtime/P3 RLS (correctiva producción) | `supabase/migrations/20260717190300_eve_point12_consultant_runtime_p3_rls.sql` |
| Publish branching_decision.run_id (db-lint safe) | `supabase/migrations/20260717190400_eve_point12_publish_branching_decision_run_id_fix.sql` |
| Publish branching_decision.run_id (lint-safe) | `supabase/migrations/20260717190400_eve_point12_publish_branching_decision_run_id_fix.sql` |

## Tablas

| Tabla | Origen |
|-------|--------|
| `runtime_causal_required_variable_rules` | 180000 |
| `runtime_causal_evaluations` | 180100 |
| `runtime_causal_variable_resolutions` | 180100 |
| `runtime_run_control_snapshots` | 180200 |
| `runtime_causal_evaluation_evidence_links` | 190000 |
| `runtime_causal_rule_catalog_versions` | 190100 |
| `runtime_causal_catalog_causal_defs` | 190100 |
| P3: `activity_runtime_run`, `role_runtime_session`, `readiness_gap_record`, `process_state_timer_event`, `readiness_decision_record` | previa; RLS consultor en 190300 |

## RPC / funciones

| Función | Ruta de definición |
|---------|-------------------|
| `publish_runtime_causal_evaluation` | 180100 + endurecida 190000 + draft_p3 190300 + lint-safe run_id 190400 |
| `publish_runtime_run_control_snapshot` | 180200 + 190200 |
| `compute_and_publish_runtime_control_snapshot` | 190200 |
| `eve_consultant_can_access_runtime_run` | 190000 |

## RLS

| Objeto | Política / helper | Ruta |
|--------|-------------------|------|
| Ledger evaluations/resolutions/evidence/snapshots | `eve_consultant_can_access_runtime_run` | 190000 |
| Rules + catalog defs | SELECT authenticated (catálogo no sensible) | 180000 / 190100 |
| `activity_runtime_run` + P3 + `role_runtime_session` | SELECT consultor acumulativo | 190300 |

## BFF

| Endpoint | Ruta exacta |
|----------|-------------|
| base-matrix | `src/app/api/eve/official-consultant-control-panel/cases/[caseId]/participants/[participantId]/profiles/[profileId]/sessions/[sessionId]/activities/[activityId]/runs/[runId]/runtime/base-matrix/route.ts` |
| causal-matrix | `…/runtime/causal-matrix/route.ts` |
| base detail | `…/runtime/base/[baseId]/route.ts` |
| causal detail | `…/runtime/causal/[causalId]/route.ts` |
| control-state | `…/runtime/control-state/route.ts` |
| authorize helper | `src/services/eve/official-control-panel/authorize-runtime-matrix-scope.ts` |

## Front-end

| Artefacto | Ruta exacta |
|-----------|-------------|
| ActivityRuntimePanel | `src/features/official-consultant-control-panel/components/ActivityRuntimePanel.tsx` |
| RuntimeActivityMatrixPanel + footer | `src/features/official-consultant-control-panel/components/RuntimeActivityMatrixPanel.tsx` |
| AttentionGovernancePanel | `src/features/official-consultant-control-panel/components/AttentionGovernancePanel.tsx` |
| Runtime control context | `src/features/official-consultant-control-panel/state/runtime-control-state-context.tsx` |
| Availability | `src/features/official-consultant-control-panel/presentation/runtime-availability.ts` |
| Matrix service/repo/types | `src/services/eve/official-control-panel/official-control-panel-runtime-matrix-*.ts` |
| Control service/types | `src/services/eve/official-control-panel/official-control-panel-runtime-control-*.ts` |
| Causal overlay | `src/services/eve/official-control-panel/resolve-causal-factual-overlay.ts` |
| Catalogs Base/Causal | `src/services/eve/official-control-panel/catalogs/runtime-*-matrix.catalog.ts` |
| Local fixtures (solo local) | `src/app/admin/official-consultant-control-panel/local-ui-fixtures/` |

## Scripts

| Artefacto | Ruta exacta |
|-----------|-------------|
| Manage evaluations | `scripts/eve/official-control-panel/manage-runtime-causal-evaluations.mjs` |
| Verify ledger | `scripts/eve/official-control-panel/verify-runtime-causal-evaluation-ledger.mjs` |
| Verify snapshots | `scripts/eve/official-control-panel/verify-runtime-control-snapshots.mjs` |
| Write BFF routes | `scripts/eve/official-control-panel/write-point12-runtime-matrix-bff-routes.mjs` |
| Generate catalogs | `scripts/eve/official-control-panel/generate-runtime-matrix-catalogs-from-complement.mjs` |
| Seed operacional test-only | `tests/e2e/setup/prepare-point12-runtime-operational-validation.mjs` |
| Rollback SQL producción | `scripts/eve/official-control-panel/rollback-point12-production.sql` |

## Pruebas

| Artefacto | Ruta exacta |
|-----------|-------------|
| E2E §12 | `tests/e2e/official-consultant-control-panel-rector-point-12.spec.ts` |
| E2E matrices | `tests/e2e/official-consultant-control-panel-rector-point-12-runtime-matrices.spec.ts` |
| E2E delivery C | `tests/e2e/official-consultant-control-panel-rector-point-12-delivery-c.spec.ts` |
| E2E operacional | `tests/e2e/official-consultant-control-panel-rector-point-12-operational-validation.spec.ts` |
| Regression 12a | `tests/regression/consultant-control-panel/official-control-panel-rector-point-12a.test.mjs` |
| Regression matrices | `tests/regression/consultant-control-panel/official-control-panel-rector-point-12-runtime-matrices.test.mjs` |

## Documentación

| Artefacto | Ruta exacta |
|-----------|-------------|
| ADR | `docs/eve/panel-control/ADR_POINT12_CAUSAL_CLOSURE_AND_RUNTIME_CONTROL_LEDGER.md` |
| Implementaciones RECTOR_POINT_12_* | `docs/eve/panel-control/RECTOR_POINT_12_*.md` |
| Auditorías / corrección ledger | `docs/eve/panel-control/POINT12_*.md` |
| Inventario (este archivo) | `docs/eve/panel-control/POINT12_PRODUCTION_READINESS_INVENTORY.md` |
| Checklist readiness | `docs/eve/panel-control/POINT12_PRODUCTION_READINESS_CHECKLIST.md` |
| Deploy runbook | `docs/eve/panel-control/POINT12_PRODUCTION_DEPLOYMENT_RUNBOOK.md` |
| Rollback runbook | `docs/eve/panel-control/POINT12_PRODUCTION_ROLLBACK_RUNBOOK.md` |

## Local-only (debe permanecer fuera de producción)

| Artefacto | Ruta | Gate |
|-----------|------|------|
| local-session | `src/app/api/eve/official-consultant-control-panel/local-session/route.ts` | `isOfficialPanelLocalDevelopment()` → 403 |
| local-ui-fixtures | `src/app/admin/official-consultant-control-panel/local-ui-fixtures/` | mismo gate |
| Flag | `EVE_CONSULTANT_CONTROL_PANEL_LOCAL_ENABLED` | solo localhost + development |

## Observabilidad

| Artefacto | Ruta exacta |
|-----------|-------------|
| Logger estructurado panel | `src/services/eve/official-control-panel/official-control-panel-observability.ts` |
