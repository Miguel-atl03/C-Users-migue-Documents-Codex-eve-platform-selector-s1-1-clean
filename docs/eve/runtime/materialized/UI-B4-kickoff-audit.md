# UI-B4 kickoff audit
**Worktree:** `eve-platform-ui-b1-isolated` / companion preview  
**Preview aislado:** `http://localhost:3113/dev/ui-b4`  
**Classification target:** `ui_B4_visual_candidate_ready_for_runtime_binding`
## Rectors (authority hierarchy)
| # | Rector | Path / identity |
|---|---|---|
| 1 | **Madre B4** | `docs/eve/runtime/materialized/madre_b4_authority/` + `src/components/eve-official-canvas/b4-madre-copy.ts` |
| 1a | Madre SHA256 | `B4DAB985A18B32383FC8BB968CC41CAB2781BBB50F9D53AF834CB40D182D87C6` |
| 1b | Madre path | `.../Bloques de preguntas/Bloque_4_Documento_Madre_Capa1_v2_1_EVE.docx` |
| 2 | **Matrix** SHA256 | `5DC4E7A833A2EB5FE6977D290DDBEA855743AF2E9D167245B5B55BB7C1ED1059` |
| 2a | Matrix workbook | `docs/eve/runtime/materialized/Matriz_Conformance_Runtime_UI_40_20_por_Bloque_v1_0.xlsx` |
| 2b | Sheets used | `01_Interacciones_60` (B4-Q23–Q28, C11–C14), `03_Bloques_UI`, `04_Tipos_Control`; rows in `madre_b4_authority/matrix_b4_rows.json` |
| 3 | **Methodology** | `METODOLOGIA-fabricacion-UI-Runtime-B1-B7.md` — D4/D5; **no local sequencer** |
| 4 | **VR pattern** | `045-R3A-VR-B1-B7-pattern.md` — Runtime owns next/sequence |
| 5 | **Handoff** | `045-R3A-UI-B05-B7-new-chat-handoff.md` |
| 6 | **Matrix integration (X0R)** | `045-R3A-X0R-runtime-ui-matrix-integration.md` — Matrix = QA transversal, not rector substitute |
| 7 | **V pattern (superseded note)** | `045-R3A-V-B1-B7-pattern.md` → canonical **VR** above |
## Sequential relation
**B3 (Salida) → B4 (Cadena causal) → B5 (Capacidad)**
- Madre moment: after Bloque 3 (salida/receptor), before Bloque 5 (capacidad).
- Cross-block continuity / show-hide = **Runtime X4-4**, not UI local sequencer.
- This wave does **not** integrate B1/B2/B3 or productive canvas.
## Madre
- Block name: **Cadena causal y normalización del flujo**
- Mother question: ¿Cómo fluye de verdad esta escena y dónde se bloquea, espera, rebota o cambia de camino?
- Always-visible (D4 production): **4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11, 4.12, 4.13**
- Conditional / fixtures (D5): **4.5b, 4.6b, 4.7b, 4.9b, 4.10b, 4.A, 4.B, 4.C** (+ causal pack)
## Matrix map (visual QA hints)
| interaction | source_codes |
|---|---|
| B4-Q23 | 4.1, 4.2, 4.A |
| B4-Q24 | 4.3, 4.4, 4.5 |
| B4-Q25 | 4.6 |
| B4-Q26 | 4.7 |
| B4-Q27 | 4.8, 4.9 |
| B4-Q28 | 4.10–4.13 |
| C11 | 4.5b |
| C12 | 4.6b |
| C13 | 4.7b |
| C14 | 4.9b, 4.10b, 4.B, 4.C |
## Plan UI
- **Misma arquitectura Instrumento B1** (`canvas-b1-instrument.module.css`)
- **D4 base** = always-visible Madre only
- **D5 fixtures** = conditional / clarification / causal
- Shell renders any slot in ViewModel; **no** local branching
- Preview `/dev/ui-b4` (+ `?fixture=…`)
- No integración B1/B2/B3 ni lienzo; STOP → X4-4

