# R2 — Rollback runbook (preserve data)

## Objetivo

Retirar la capa de acciones producto autenticadas **sin borrar** work items, eventos ni versiones de adjunto.

## Script

`scripts/eve/official-control-panel/rollback-r2-manual-actions-preserve-data.sql`

## Efectos

1. DROP wrapper `eve_apply_manual_work_product_action_as_consultant`
2. DROP fetch blob consultant
3. DROP helpers de capability
4. Revoke authenticated DML/SELECT extras en tablas R2 (filas intactas)
5. Core RPC permanece service_role-only

## App

1. Quitar/deshabilitar ruta `POST .../manual-actions`
2. Revertir botones de acción en `ManualWorkPanel`
3. Redeploy

## No hacer

- `DROP TABLE` de `manual_work_artifact_version` / blob / idempotency en rollback operativo
- `db reset` como procedimiento de rollback
- Inventar filas Amber para “limpiar” visualmente
