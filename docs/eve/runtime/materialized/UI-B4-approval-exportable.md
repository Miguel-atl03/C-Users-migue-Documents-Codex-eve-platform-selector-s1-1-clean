# UI-B4 — Aprobación visual / estado exportable

**Fecha aprobación:** 2026-08-14  
**Decisión usuario:** Bloque 4 **aprobado** como candidato visual.  
**Integración:** **no** al lienzo productivo; **no** a B1/B2/B3.

## Classification

```text
ui_B4_visual_approved_exportable_pending_canvas_integration
```

(Supersede de ola: `ui_B4_visual_candidate_ready_for_runtime_binding` → **approved** + **exportable**.)

## Meaning

| Claim | Status |
|---|---|
| Diseño Instrumento B4 aprobado | yes |
| Listo para empaquetar / integrar cuando el lienzo esté listo | yes |
| Montado en lienzo productivo EVE | **no** |
| Integrado con B1/B2/B3 en captura | **no** |
| X4-4 / Runtime binding | **no** (posterior) |
| `presentation_status` | `official_pending` (honesto hasta integración) |
| `local_sequence_authority` | `false` |

## Exportable package (inventario)

### UI shell
- `src/components/eve-official-canvas/OfficialCanvasB4InstrumentSection.tsx`
- `src/components/eve-official-canvas/b4-presentation-contract.ts`
- `src/components/eve-official-canvas/b4-visual-stub.ts`
- `src/components/eve-official-canvas/b4-madre-copy.ts`
- Shared chrome: `src/components/eve-official-canvas/canvas-b1-instrument.module.css`
- Experience companion hook: `OfficialCanvasExperience` mode `"b4"` (unused by productive `page.tsx`)

### Preview companion (no productivo)
- `src/app/dev/ui-b4/page.tsx` → `http://localhost:3113/dev/ui-b4`
- Fixtures: `?fixture=base|conditional|clarification|causal`

### Authority / docs
- Madre SHA `B4DAB985A18B32383FC8BB968CC41CAB2781BBB50F9D53AF834CB40D182D87C6`
- Matrix SHA `5DC4E7A833A2EB5FE6977D290DDBEA855743AF2E9D167245B5B55BB7C1ED1059`
- `docs/eve/runtime/materialized/madre_b4_authority/`
- `docs/eve/runtime/materialized/UI-B4-*`
- Methodology / VR / handoff / X0R referenced in `UI-B4-kickoff-audit.md`

### Tests
- `tests/regression/consultant-control-panel/runtime-40-20-045-R3A-UI-B4-official-canvas.test.mjs`

## Integration gate (future — do not execute now)

When the canvas is ready, integration should be an **explicit** step that:
1. Mounts `OfficialCanvasB4InstrumentSection` on the productive Experience path.
2. Keeps D4 base stub (`4.1–4.13`) until X4-4 supplies Runtime sequence.
3. Does **not** invent local branching for `*b` / `4.A–C`.
4. Updates `presentation_status` only after that mount is intentional.
5. Respects sequential continuity **B3 → B4 → B5** as Runtime-owned, not UI-owned.

Until then: keep companion-only + `official_pending`.
