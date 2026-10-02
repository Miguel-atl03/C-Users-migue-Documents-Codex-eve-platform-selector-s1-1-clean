# UI-B5 kickoff audit
**Worktree:** `eve-platform-ui-b1-isolated` / companion preview  
**Preview aislado:** `http://localhost:3113/dev/ui-b5`  
**Classification target:** `ui_B5_visual_candidate_ready_for_runtime_binding`
## Rectors (authority hierarchy)
| # | Rector | Path / identity |
|---|---|---|
| 1 | **Madre B5** | `docs/eve/runtime/materialized/madre_b5_authority/` + `src/components/eve-official-canvas/b5-madre-copy.ts` |
| 1a | Madre SHA256 | `43C1D19EC3FD4E50F769DBD60D06685176C946A6364E3010B417CFFFF4266488` |
| 1b | Madre path | `.../Bloques de preguntas/Bloque_5_Documento_Madre_Capa1_v2_1_EVE_rev3.docx` |
| 2 | **Matrix** SHA256 (expected) | `5DC4E7A833A2EB5FE6977D290DDBEA855743AF2E9D167245B5B55BB7C1ED1059` |
| 2a | Matrix workbook | `docs/eve/runtime/materialized/Matriz_Conformance_Runtime_UI_40_20_por_Bloque_v1_0.xlsx` |
| 2b | Matrix gate | **PARTIAL** — binary xlsx currently **ABSENT** in this worktree; expected SHA recorded in `MATRIX_SHA256.txt` and `b5-madre-copy.ts` (`matrix_sha256_expected`). Restore from baseline when available. |
| 2c | Sheets / rows used | `01_Interacciones_60` (B5-Q29–Q33, C15), cross-check via `madre_b4_authority/matrix_01_Interacciones_60.json` |
| 3 | **Methodology** | `METODOLOGIA-fabricacion-UI-Runtime-B1-B7.md` — D4/D5; **no local sequencer** |
| 4 | **VR pattern** | `045-R3A-VR-B1-B7-pattern.md` — Runtime owns next/sequence |
| 5 | **Handoff** | `045-R3A-UI-B05-B7-new-chat-handoff.md` |
| 6 | **Matrix integration (X0R)** | `045-R3A-X0R-runtime-ui-matrix-integration.md` — Matrix = QA transversal, not rector substitute |
## Sequential relation (cross-block)
**B4 (Cadena causal) → B5 (Capacidad) → B6 (Workarounds / shadow)**
- Madre moment: after Bloque 4, before Bloque 6.
- Inherits `dimension_dominante` from **B2** (stub in ViewModel; Runtime supplies in X4).
- Feeds B6 with capacity / residual / sustainability signals (Runtime continuity).
- Cross-block continuity / show-hide = **Runtime X4-5**, not UI local sequencer.
- This wave does **not** integrate B1–B4 or productive canvas.
## Madre
- Block name: **Capacidad y discrecionalidad**
- Mother question: ¿Con qué recursos realmente cuentas, dónde tienes margen de decisión y qué tienes que sacrificar para sostener esta escena?
- Always-visible user capture (D4 production): **5.0, 5.1, 5.2, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11, 5.12, 5.14**
- Excluded from D4 base: **5.0_auto** (internal), **5.3** (derived), **5.13 / 5.14b** (conditionals), **5.A / 5.B / 5.C** (clarifications)
- Conditional / fixtures (D5): **5.13, 5.14b, 5.A, 5.B, 5.C, 5.3** (+ metric_time + causal packs)
## Matrix map (visual QA hints)
| interaction | source_codes |
|---|---|
| B5-Q29 | 5.0, 5.0_auto, 5.1, 5.2, 5.3 |
| B5-Q30 | 5.4, 5.5, 5.6 |
| B5-Q31 | 5.7, 5.8 |
| B5-Q32 | 5.9, 5.10 |
| B5-Q33 | 5.11, 5.12, 5.14 |
| C15 | 5.13, 5.14b, 5.A, 5.B, 5.C |
## Plan UI
- **Misma arquitectura Instrumento B1** (`canvas-b1-instrument.module.css`)
- **D4 base** = always-visible Madre user capture only
- **D5 fixtures** = conditional / clarification / derived / metric_time / causal
- Shell renders any slot in ViewModel; **no** local branching
- Preview `/dev/ui-b5` (+ `?fixture=…`)
- No integración B1–B4 ni lienzo; STOP → X4-5
