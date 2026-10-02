# UI-B5 mother-direct conformance
**Conformance:** `PASS_VISUAL_BASE`  
**Madre SHA256:** `43C1D19EC3FD4E50F769DBD60D06685176C946A6364E3010B417CFFFF4266488`
## Authority
- Path: `C:/Users/migue/Downloads/Diseno Estructural de la Arquitectura de Entrerprise Viability Engine - Strategy and Operations/Bloques de preguntas/Bloque_5_Documento_Madre_Capa1_v2_1_EVE_rev3.docx`
- Parsed: `docs/eve/runtime/materialized/madre_b5_authority/fichas_parsed.json`
- Bound copy: `src/components/eve-official-canvas/b5-madre-copy.ts` (do not overwrite unless bugs)
## D4 base (production candidate — user capture only)
`5.0, 5.1, 5.2, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11, 5.12, 5.14`
## Excluded from D4 base
- `5.0_auto` — internal inference (never visible)
- `5.3` — derived display (fixture only)
- `5.13`, `5.14b` — conditionals (fixture only)
- `5.A`, `5.B`, `5.C` — clarifications (fixture only)
## D5 fixture-only
`5.13, 5.14b, 5.A, 5.B, 5.C, 5.3` (+ metric_time / causal packs)
## Cross-block
- Madre predecessor: **B4**
- Madre successor: **B6**
- Inherits from B2: `dimension_dominante` (resolves `{X}` on 5.0)
- Local cross-block sequencer: **false**
- Note: B5 continues after B4 causal; Runtime/X4 owns continuity into B6.
## Notes
- `visibility_rule` recorded from Madre; not executed as local sequencer.
- Help text presented as Madre full text (no truncation).
