# 045-R3A-X3-P — Final

## Classification

`runtime_full_run_catalog_pinning_conformant_local_only`

## Fix

Real Runtime application service no longer treats `RUNTIME_40_20_FULL_ACTIVE_CATALOG_VERSION_ID` as execution authority.

- `readRun` validates pinned catalog identity + executable status (`active`|`superseded`) + session/run consistency
- `readCatalog(service, run.catalog_version_id)` scopes all catalog reads
- Boundary returns `run.catalog_version_id`
- Governed execution stamps instances / renderer catalog reloads from the run pin
- Persistence execution writes use `assertExecutablePinnedCatalog` (creation still requires active FULL)

## Demonstrated

| Flag | Value |
|---|---|
| catalog_at_creation | single_active |
| catalog_during_execution | run.catalog_version_id |
| current_active_relookup_during_execution | false |
| superseded_pinned_run_supported | true |
| mid_run_catalog_upgrade | false |
| cross_catalog_resolution | false |
| X3R_regression | PASS |

## Status

`045-R3A-X3P` = **CLOSED**

`X4` = **waiting_for_specific_runtime_ui_materiality**

Do **not** start X4-05 until B0.5 UI is visually materialized on the official canvas.

## Next

`wait_for_specific_runtime_UI_materiality_then_X4_incremental`

### Sequence (post-X3P)

During visual development of B0.5–B7:

1. Use obligatorily `Matriz_Conformance_Runtime_UI_40_20_por_Bloque_v1_0.xlsx`
2. Per block consult: `01_Interacciones_60`, `02_Slots_170`, `03_Bloques_UI`, `04_Tipos_Control`, `07_Contrato_Integracion`
3. No local sequence/branching
4. Do not promote `fallback_textarea` to official design
5. Do not invent controls from question prose
6. Design each section to later consume `InteractionViewModel` + `slot_ref` + authorized presentation metadata
7. Preserve user-assistance mechanisms
8. Do not modify Runtime to fit incomplete UI

When a section is visually ready:

| UI ready | Then execute |
|---|---|
| B0.5 | X4-05 |
| B1 | X4-1 |
| … | … |
| B7 | X4-7 |

Each X4 certifies: Renderer → specific UI → slot_ref → assistance → answer → BFF → Runtime next.
