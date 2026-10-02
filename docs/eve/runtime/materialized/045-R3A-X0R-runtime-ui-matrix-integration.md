# 045-R3A-X0-R — Runtime↔UI matrix integration

## Classification target

`canvas_productization_runtime_ui_conformance_control_ready`

## Materiality

| Field | Value |
|---|---|
| source | `C:\Users\migue\Downloads\Matriz_Conformance_Runtime_UI_40_20_por_Bloque_v1_0.xlsx` |
| worktree | `docs/eve/runtime/materialized/Matriz_Conformance_Runtime_UI_40_20_por_Bloque_v1_0.xlsx` |
| SHA256 | `5DC4E7A833A2EB5FE6977D290DDBEA855743AF2E9D167245B5B55BB7C1ED1059` |
| size | 142868 bytes |
| modified | 2026-08-10T20:02:21.5471778-06:00 |
| copies compared | 1 (no SHA conflict) |

## Role / authority

- **role:** `transversal_conformance_QA`
- **NOT_RUNTIME_AUTHORITY**
- **NOT_RECTOR_SUBSTITUTE**

Flow:

rectores + Runtime → contrato de interacción → componente UI → binding → ingest → QA (matriz)

## Sheets preserved (Gate 4)

- `00_Resumen`
- `01_Interacciones_60`
- `02_Slots_170`
- `03_Bloques_UI`
- `04_Tipos_Control`
- `05_QA_60`
- `06_Fuentes_Gobierno`
- `07_Contrato_Integracion`
- `99_Listas`

No rename / no delete.

## Column policy (Gate 3)

**A — do not rewrite for UX:** runtime_interaction_id, block, visible_text, source_*, help_text, field_type, answer_mode, options, required/visibility/branching rules, capture_slot_kind, canonical_variable_names, provenance_type, control_family, ui_behavior_required, payload_value_shape, options_authority, binding_rule, mapping_authority, TR_refs.

**B — operational conformance updatable:** pantalla_objetivo, ruta_componente_real, estado_desarrollo_control, estado_binding_renderer, estado_submit_ingest, estado_prueba, conformance_slot, compatibilidad_runner_R3AT, evidencia_prueba, bloqueador, responsable (+ 03/05 equivalents).

Rule: UI conforms to Runtime — matrix is not rewritten to justify UI.

## Control types (Gate 6)

From `03_Bloques_UI` + `02_Slots_170` — do **not** collapse to textarea:

Texto libre · Selección única · Selección múltiple · Selección + texto · Confirmación + corrección · Aclaración condicional · Ordenamiento/ranking · Decisión binaria + texto · Control dinámico catálogo · Escala + texto · controles internos no visibles.

If Renderer metadata missing → `blocked_runtime_presentation_metadata_contract` (exact interaction/slot).

## Integration contract (Gate 7)

`07_Contrato_Integracion` checklist:

| Concern | Authority |
|---|---|
| catalog_version_id | run-pinned |
| interaction_instance_id | server-issued |
| slot_ref | server-issued |
| answer value | human only |
| source_node/source_code | server |
| provenance / source_trace | server |
| canonical variable | server |
| next interaction | Runtime |

## QA 60 (Gate 8)

`05_QA_60` is the functional certification board. Visual existence ≠ PASS.

Functional PASS requires: Renderer → control semantics → help_text → required/visibility → slot_ref → human payload → server semantics → ingest → advance → next from Runtime → negatives → idempotency.

Until then: **No ejecutado** or **Parcial**.

## X1–X5 usage (Gate 5 / 9)

| Phase | Matrix usage |
|---|---|
| X1 LOGIN/ESTADO_A | not Runtime rows; auth/session contracts |
| X2 WORKMAP | not Runtime rows; WorkMap/finalize contracts |
| X3 SIGNIFICADO/B0 | use B0 rows when Runtime/UI contract applies |
| X4 B0.5–B7 | **matrix mandatory**, incremental per block |
| X5 READINESS | real Readiness contract; no invented questions |

X4 incremental: visual ready ≠ binding ready ≠ ingest ready ≠ E2E certified.

## Assistance cross-control (Gate 10)

Cross `045-R3A-X-assistance-inventory` with matrix. Assistance may help draft/understand; must not alter slot_ref, options authority, branching, provenance, canonical variable, next interaction. Losing a necessary assistance → FAIL.
