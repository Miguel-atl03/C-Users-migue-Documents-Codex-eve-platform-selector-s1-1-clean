# RECTOR §12 — Entrega C Rollback

**Fecha:** 2026-07-17  
**Ámbito:** solo entorno local / preview. No aplicar a staging/producción desde este tramo.

## Objetos a revertir (si se deshace Entrega C)

1. UI footer `runtime-advance-footer`, badges, panel Atención control lists.
2. BFF `.../runtime/control-state`.
3. Lecturas P3 en repositorio (`listReadinessGapsByRun`, timers, reentries, reviews, snapshot).
4. Tablas (solo si se revierte también el ledger ADR):
   - `runtime_run_control_snapshots`
   - `runtime_causal_variable_resolutions`
   - `runtime_causal_evaluations`
   - `runtime_causal_required_variable_rules`
5. RPCs: `publish_runtime_run_control_snapshot`, `publish_runtime_causal_evaluation`.

## Orden sugerido

1. Retirar UI/BFF (sin tocar datos).
2. Verificar que Matriz Causal sigue leyendo ledger effective (Entrega B factual).
3. Solo entonces dropear snapshots / ledger vía migración de rollback dedicada.

## Amber

No insertar ni borrar datos Amber. El estado sin run permanece No evaluable.

## Confirmación

No ejecutar rollback destructivo sin instrucción explícita del usuario.
