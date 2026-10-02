# RECTOR §12 — Entrega C Implementation

**Fecha:** 2026-07-17  
**Estado:** Implementada localmente (Ledger + UI + BFF)  
**Autoridad:** ADR_POINT12_CAUSAL_CLOSURE_AND_RUNTIME_CONTROL_LEDGER + plan matrices

## Alcance

Integración factual de:

- Gaps (`readiness_gap_record.run_id`)
- Timers (`process_state_timer_event.run_id`)
- Reentry / revisión manual (desde `readiness_decision_record` + flags en gaps)
- Readiness (`runtime_run_control_snapshots` effective)

El Panel **solo lee**. No calcula readiness ni publica cierres.

## Fuentes P3

| Control | Tabla | Vínculo run |
|---------|-------|-------------|
| Gaps | `readiness_gap_record` | `run_id` → `activity_runtime_run(id)` |
| Timers | `process_state_timer_event` | `run_id` |
| Readiness decision / reentry / review | `readiness_decision_record` | `run_id` |
| Snapshot publicado | `runtime_run_control_snapshots` | `activity_runtime_run_id` |

No se creó `runtime_control_event_links`: el FK a run es inequívoco.

Timers: `due_at` no existe como columna; solo se marca overdue si `metadata.due_at` es comparable. Sin timestamp → `unavailable` (no se inventa vencido).

## BFF

`GET .../runs/:runId/runtime/control-state`

Respuesta: `RuntimeControlStateView` (readiness del snapshot; listas P3; sin evidencia completa).

## UI

- Footer operativo bajo matrices: Estado de avance (valor del snapshot / No evaluable).
- Atención y gobernanza: brechas, timers, reentry, revisión, bloqueos Base/Causal.
- Badges factuales en filas Base/Causal.
- Sin botones de ejecución.
- Sin KPI globales nuevos.
- Amber sin run: **No evaluable** (sin inventar datos Amber).

## Fixtures test-only

`control-ready`, `control-ready-restrictions`, `control-blocked-p0`, `control-not-evaluable`, `control-gap-active`, `control-timer-overdue`, `control-reentry`, `control-manual-review`.

## Verificadores

- `verify-runtime-causal-evaluation-ledger.mjs`
- `verify-runtime-control-snapshots.mjs`

## Admin

`manage-runtime-causal-evaluations.mjs` con `--dry-run` o `--confirm=POINT12_CAUSAL_LEDGER_ADMIN`.

## Fuera de alcance

§13 no iniciado.
