# POINT12 — Rollback corrección ledger

Solo local. No tocar staging/producción desde este tramo.

## Orden

1. Retirar UI de presentación Base (adaptador) si se revierte solo lenguaje.
2. Dropear funciones nuevas: `compute_and_publish_runtime_control_snapshot`, `eve_consultant_can_access_runtime_run` (tras restaurar políticas).
3. Restaurar `publish_runtime_causal_evaluation` / `publish_runtime_run_control_snapshot` desde migración `202607171801/802`.
4. Dropear tablas: `runtime_causal_evaluation_evidence_links`, `runtime_causal_catalog_causal_defs`, `runtime_causal_rule_catalog_versions`.
5. Eliminar filas `point12-catalog-v1` de rules; reinstaurar políticas SELECT `using (true)` solo si se vuelve al estado pre-corrección (no recomendado).

Preferible: `supabase db reset` local y reaplicar hasta `20260717180200` si se necesita el estado previo exacto.

## Amber

No insertar ni borrar Amber en el rollback.
