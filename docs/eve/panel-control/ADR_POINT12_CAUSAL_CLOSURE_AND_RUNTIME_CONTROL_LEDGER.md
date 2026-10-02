# ADR — Cierre causal factual y ledger de control Runtime (§12)

**ID:** ADR_POINT12_CAUSAL_CLOSURE_AND_RUNTIME_CONTROL_LEDGER  
**Fecha:** 2026-07-17  
**Estado:** Aceptada para implementación local  
**Ámbito:** Entrega B (cierre factual) + Entrega C (gaps/timers/reentry/revisión/readiness)

---

## 1. Problema

La Matriz Causal 20 del Panel puede mostrar catálogo y overlay, pero **no existe una fuente factual publicada** de cierre causal C01–C20 por run.

Riesgos observados:

- inferir cierre desde `epistemic_status` de subcampos;
- usar la primera/última `branching_decision` como proxy de cierre;
- calcular readiness / gaps / timers en React.

El Panel de Control es **solo lectura**.

## 2. Evidencia de ausencia de fuente

Inspección local + remoto:

| Necesidad | Estado |
|-----------|--------|
| Catálogo C01–C20 (`runtime_interaction_def`) | Existe |
| Variables obligatorias normalizadas (una fila = una variable) | **Ausente** (local sin `required_variables`; remoto tiene arrays compuestos `a / b`) |
| Evaluación causal effective por run+causal | **Ausente** |
| Snapshot de control Runtime (readiness/gaps/timers agregados) | **Ausente** como ledger publicado |
| Gaps / timers / readiness P3 | Existen tablas; FK a run en esquema canónico |

## 3. Alternativas evaluadas

| Alternativa | Decisión |
|-------------|---------|
| A. Panel calcula cierre desde subcampos/instancias | **Rechazada** — viola read-only y produce falsos cierres |
| B. Reutilizar `session_causal_outputs` / `closure_results` | **Rechazada** — ontología distinta (sesión/escena comercial) |
| C. Ledger Runtime publicado (`runtime_causal_evaluations` + variables + snapshot) | **Aceptada** |
| D. Backfill heurístico de runs históricos | **Rechazada** — inventaría datos |

## 4. Decisión

### Productor

**El motor Runtime produce y publica los cierres causales.**

El Panel de Control:

- no calcula;
- no reconstruye;
- no infiere;
- no corrige;
- no publica cierres.

También puede escribir: administrador técnico controlado / service role (script `manage-runtime-causal-evaluations.mjs`).

El Consultor autenticado **solo lee**.

### Objetos creados

1. `runtime_causal_required_variable_rules` — universo canónico por causal (all_of / one_of).
2. `runtime_causal_evaluations` — evaluación versionada por run+causal.
3. `runtime_causal_variable_resolutions` — resolución por variable de una evaluación.
4. `runtime_run_control_snapshots` — snapshot published de control (Entrega C).
5. RPC `publish_runtime_causal_evaluation(...)` — publicación transaccional.
6. RPC `publish_runtime_run_control_snapshot(...)` — publicación de snapshot.

### Ciclo de vida (evaluación / snapshot)

`computed` → `validated` → `effective` → (`superseded` | `revoked`)

Corrección = **nueva versión**; no update in-place de `effective`.

### Invariantes

- Un solo `effective` por `(activity_runtime_run_id, causal_code)`.
- Un solo `effective` por `activity_runtime_run_id` en snapshots.
- `answered_closed` solo con variables completas + ruta canónica + evidencia completa + sin contradicción.
- `closed_not_applicable` solo con `not_applicable_with_evidence`.
- Runs sin evaluación publicada: `dataStatus = not_evaluated|unavailable`; **sin backfill**.

## 5. Mapeo de esquema (corrección de repositorio)

### Shape draft local (P3 preview)

| Lógico | Físico local |
|--------|--------------|
| run PK | `activity_runtime_run.id` |
| FK run | `*.run_id` |
| branching PK | `branching_decision.id` |
| opened | `opened_interaction_id` (texto interacción) |
| case | `case_id` en run |

### Shape canónico (objetivo / remoto inspeccionado)

| Lógico | Físico canónico |
|--------|-----------------|
| run PK | `activity_runtime_run.activity_runtime_run_id` |
| FK run | `*.activity_runtime_run_id` |
| branching PK | `branching_decision_id` |
| opened | `opened_interaction_instance_id` → join `runtime_interaction_instance.runtime_interaction_id` |
| case | vía `role_runtime_session.case_id` / `sesion_id` |

**Decisión de implementación:** el repositorio del panel detecta el shape y mapea a un contrato de dominio único (`ActivityRuntimeRunScope`, `BranchingDecisionRow`). Las **tablas nuevas del ledger** usan siempre el nombre de columna `activity_runtime_run_id` (FK al PK real del run en el ambiente).

No se mantienen aliases ficticios en fixtures para ocultar un select incorrecto.

## 6. Relación con Entrega C

P3 local/remoto ya vincula controles al run:

- `readiness_gap_record`
- `process_state_timer_event`
- `readiness_decision_record`
- señales de reentry / manual review en gaps y decisions

Entrega C **lee** esas tablas + el snapshot `effective`.  
El Panel **no** deriva readiness en el browser.

Si el ambiente local no tiene filas P3, Entrega C muestra `not_evaluable` / vacío factual (fixtures test-only para UI).

## 7. Runs anteriores

Sin evaluación/snapshot publicados:

- `closureSource = none`
- matrices: `not_evaluated` / `unavailable`
- footer: `No evaluable`

Solo se completan tras reevaluación del motor o admin autorizado.

## 8. Autor de escritura / auditoría / RLS

- Escritura: service role + RPC SECURITY DEFINER con cheques de integridad.
- Auditoría: columnas `computed_by`, `validated_by`, `published_by`, `revoked_by` + razón.
- RLS: consultor SELECT solo vía `eve_consultant_can_access_runtime_run(auth.uid(), run_id)`; sin INSERT/UPDATE/DELETE.
- Catálogo de reglas: SELECT authenticated permitido (no sensible).
- Corrección 2026-07-17: eliminado `USING (true)` en ledgers factuales; ver `POINT12_RUNTIME_LEDGER_SECURITY_INTEGRITY_CORRECTION.md`.
- Catálogo efectivo: `point12-catalog-v1` (C13 `explicit_state_only`; C11 expandido).
- Snapshot: `compute_and_publish_runtime_control_snapshot` (no conteos arbitrarios del cliente).

## 9. Rollback

Ver `RECTOR_POINT_12_DELIVERY_C_ROLLBACK.md`:

- dropear RPC;
- dropear tablas ledger (orden inverso);
- restaurar lectura panel a overlay sin ledger (modo degradado ya existente).

## 10. Staging / producción

Esta ADR se aplica **solo local**.  
No aplicar migraciones a staging/producción sin autorización explícita.

## 11. Criterio de cierre

1. ADR implementada y verificada localmente.  
2. Entrega B: Matriz Causal conectada a evaluación `effective` cuando existe.  
3. Entrega C: footer + panel contextual + gaps/timers/reentry/review desde fuentes factuales o snapshot.  
4. Amber: sin run → No evaluable, sin inventar datos.
