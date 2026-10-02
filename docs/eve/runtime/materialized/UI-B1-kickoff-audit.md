# UI-B1 kickoff audit

**Worktree:** `eve-platform-ui-b1-isolated` / branch `feature/ui-b1-visual-candidate`  
**Online tests worktree:** `eve-platform-operational-baseline-c312` — **no writes**  
**Preview aislado:** `http://localhost:3113/dev/ui-b1` (also `?preview=b1`; 3112 reserved for online tests)

## Madre

- Canonical: `Bloque_1_Documento_Madre_Capa1_v2_1_EVE.docx` (SHA matrix: `d5d92a1d…8319`)
- Extract used: Codex fixtures `bloque_1_documento_madre_{tables,paragraphs,audit_summary}`
- Block name: **Disparador**
- Always-visible: **1.1–1.7**
- Conditional: **1.8** (if 1.7 = sí*)
- Clarifications: **1.A / 1.B / 1.C** (flag-gated; fixtures only in UI wave)

## Matriz (SHA `5DC4E7A8…1059`)

| interaction | source_codes | control families |
|---|---|---|
| B1-Q08 | 1.1, 1.5 | single_choice, multi_choice (+ Otro texto) |
| B1-Q09 | 1.2, 1.3 | single_choice |
| B1-Q10 | 1.4 | single_choice |
| B1-Q11 | 1.6, 1.7 | free_text, single_choice |
| C03 | 1.8, 1.A, 1.B, 1.C | free_text / clarification / hybrid |

## Plan UI (sync post-aprobación visual)

- **Candidato visual aprobado:** `OfficialCanvasB1InstrumentSection` + `canvas-b1-instrument.module.css`
- Contrato/stub/copy: `b1-presentation-contract.ts`, `b1-visual-stub.ts`, `b1-madre-copy.ts`
- Production candidate = base 1.1–1.7 only
- Fixtures: exception (1.8), clarifications (1.A–C)
- Shells exploratorios deprecados: `OfficialCanvasB1Section`, `OfficialCanvasB1ProposalSection`; rutas `/dev/ui-b1-alt` y `/dev/ui-b1-pro` redirigen a `/dev/ui-b1`
- Preview canónico: `/dev/ui-b1` — no Runtime/BFF/catalog changes
- Integración al lienzo productivo: **pendiente de confirmación explícita**
- STOP after visual classification; X4-1 deferred
