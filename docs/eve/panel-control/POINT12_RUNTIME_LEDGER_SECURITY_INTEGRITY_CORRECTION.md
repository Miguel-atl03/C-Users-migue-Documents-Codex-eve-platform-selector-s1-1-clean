# POINT12 — Corrección de seguridad e integridad del ledger Runtime

**Fecha:** 2026-07-17  
**Migraciones:**  
- `20260717190000_eve_point12_runtime_ledger_security_integrity_fix.sql`  
- `20260717190100_eve_point12_causal_catalog_completion.sql`  
- `20260717190200_eve_point12_runtime_control_snapshot_integrity_fix.sql`

## Problemas corregidos

1. RLS `USING (true)` en evaluaciones, resoluciones y snapshots.
2. Catálogo `local-seed-v1` incompleto (C04 operador, C11 subcampos, C13).
3. `publish_runtime_causal_evaluation` débil (cero resoluciones podían pasar sin all_of/one_of).
4. Snapshot publicable con conteos arbitrarios del caller.
5. Códigos técnicos dominantes en Matriz Base.

## Decisiones

| Tema | Decisión |
|------|----------|
| Alcance Consultor | `eve_consultant_can_access_runtime_run(auth.uid(), run_id)` vía case + vínculo perfil–sesión vigente |
| Mutaciones authenticated | Revocadas; solo service_role / admin |
| Catálogo de reglas | Legible authenticated (no sensible); documentado |
| Catálogo efectivo | `point12-catalog-v1` (20 causales) |
| C13 | `explicit_state_only` (condiciones de ruta en B4-Q26) |
| C11 | 6 variables all_of (deadlock + PST) |
| Snapshot | `compute_and_publish_runtime_control_snapshot` calcula desde P3 + ledger |
| Evidencia | `runtime_causal_evaluation_evidence_links` |

## Productor

Runtime / service_role publica. Panel read-only.

## Amber

Sin run → Estado de avance No evaluable. Sin datos inventados.
