# UI-B3 — Aprobación visual / estado exportable

**Fecha aprobación:** 2026-08-14  
**Decisión usuario:** Bloque 3 **aprobado** como candidato visual.  
**Integración:** **no** al lienzo productivo; **no** a B1/B2; ninguna integración de ningún tipo todavía.

## Classification

```text
ui_B3_visual_approved_exportable_pending_canvas_integration
```

## Meaning

| Claim | Status |
|---|---|
| Diseño Instrumento B3 aprobado | yes |
| Empaquetado exportable para cuando el lienzo esté listo | yes |
| Montado en lienzo productivo EVE | **no** |
| Integrado con B1 / B2 en captura | **no** |
| X4-3 / Runtime binding | **no** (posterior a integración UI) |
| `presentation_status` | `official_pending` |
| `local_sequence_authority` | `false` |
| `fixture_authority` | `false` |

## Exportable package (inventario)

### UI shell
- `src/components/eve-official-canvas/OfficialCanvasB3InstrumentSection.tsx`
- `src/components/eve-official-canvas/b3-presentation-contract.ts`
- `src/components/eve-official-canvas/b3-visual-stub.ts`
- `src/components/eve-official-canvas/b3-madre-copy.ts`
- Shared chrome: `src/components/eve-official-canvas/canvas-b1-instrument.module.css`
- Experience hook (dormant): `mode="b3"` in `OfficialCanvasExperience` — **unused by productive page**

### Preview companion (no productivo)
- `src/app/dev/ui-b3/page.tsx` → `http://localhost:3113/dev/ui-b3`
- Fixtures: `?fixture=exception|feedback|clarification|causal`

### Authority / docs
- Madre SHA `1A89CFF41291EC47FF29852A4F074DD1B4095FDC3772A8B98F568DC7DE921B8E`
- `docs/eve/runtime/materialized/madre_b3_authority/`
- `docs/eve/runtime/materialized/UI-B3-*`

### Tests
- `tests/regression/consultant-control-panel/runtime-40-20-045-R3A-UI-B3-official-canvas.test.mjs`

## Integration prep (for later stage — do not execute now)

When canvas integration is authorized, the task should:

1. Mount `OfficialCanvasB3InstrumentSection` on the productive Experience path only after explicit user order.
2. Keep D4 base stub until X4-3 supplies Runtime sequence / cross-block continuity from B2 (and upstream B0.5 context).
3. Use D5 fixtures only as reference — never as local show/hide authority.
4. Flip `presentation_status` to `official` only when the productive mount is intentional and accepted.
5. Do **not** invent local branching or hardcode B2→B3 next interaction.

Until then: companion-only + `official_pending`.

## Forbidden now

- Mount B3 into productive `page.tsx` capture flow
- Merge B3 into B1/B2 questionnaire
- Local sequencer / answer-based show-hide
- X4-3 binding without separate authorization
