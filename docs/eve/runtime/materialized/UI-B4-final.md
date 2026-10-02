# UI-B4-final

**Classification:** `ui_B4_visual_approved_exportable_pending_canvas_integration`  
**Approval:** 2026-08-14 (user)  
**Visual candidate:** **Instrumento** (same architecture as B1/B2/B3; B4 Madre Cadena causal)

## Approval / exportable

- Bloque 4 **aprobado** como materialidad visual.
- Empaquetado exportable: `UI-B4-approval-exportable.{md,json}`.
- **No** integrado al lienzo productivo.
- **No** integrado con B1 / B2 / B3.
- `presentation_status` permanece `official_pending` hasta integración explícita futura.

## Authority (full hierarchy — not Madre alone)

1. **Madre B4** docx + SHA `B4DAB985…87C6` → copy / options / visibility / clarifications  
2. **Semantics/UX** from Madre fichas (Matrix slots as QA cross-check)  
3. **Matriz** SHA `5DC4E7A8…1059` → B4-Q23–Q28 + C11–C14 control/interaction QA (no binding PASS)  
4. **Methodology** `METODOLOGIA-fabricacion-UI-Runtime-B1-B7.md` → D4/D5, no local sequencer  
5. **VR pattern** + **handoff** + **X0R matrix integration** → Runtime owns next/sequence; Matrix ≠ rector substitute  
6. UI Instrumento shell under `eve-official-canvas`

## Isolation (current)

- Preview companion only: `http://localhost:3113/dev/ui-b4`
- Fixtures: `?fixture=base|conditional|clarification|causal`
- Productive `page.tsx` capture flow: **not wired**
- `local_sequence_authority = false`

## Delivered

- D4 base = always-visible spine (`4.1–4.13`)
- D5 fixtures = conditional / clarification / causal
- `visibility_rule` on slots; **not** executed locally
- Full Madre help (assistance_loss = 0)
- Sequential relation documented: B3 → B4 → B5 (Runtime owns continuity)

## Explicit non-goals (STOP)

- No X4-4 / Renderer / BFF / catalog / ingest
- No local branching authority
- No B1 / B2 / B3 / lienzo integration **until canvas is ready and user orders it**
- No commit unless requested

## Next (when canvas is ready)

1. Explicit integration task (user-approved) — mount B4 section only.
2. Keep D4 stub until Runtime sequence arrives.
3. Then authorize `045-R3A-X4-4`.
