# UI-B2 kickoff audit

**Worktree:** `eve-platform-ui-b1-isolated` / branch `feature/ui-b1-visual-candidate`  
**Online tests / lienzo en reparación:** no writes; B1 no se integra  
**Preview aislado:** `http://localhost:3113/dev/ui-b2`

## Madre

- Canonical (user path, this re-run):  
  `.../Bloques de preguntas/Bloque_2_Documento_Madre_Capa1_v2_1_EVE.docx`
- SHA256: `0E134EE7E73DBB4B5B54A833712E2D15B5F03BCAF84219A50B21AB0E7CCD38CC`
- Parsed fichas: `docs/eve/runtime/materialized/madre_b2_authority/fichas_parsed.json`
- Block name: **Transformación**
- Mother question: ¿Qué cambia realmente en esta escena?
- Always-visible (D4): **2.1, 2.3, 2.4a, 2.4b, 2.5, 2.6, 2.7, 2.9, 2.11**
- Conditional / fixtures (D5): dimension paths, relations/ranking, exceptions, clarifications, causal pack

## Matriz (SHA `5DC4E7A8…1059`)

| interaction | source_codes | control families |
|---|---|---|
| B2-Q12 | 2.1, 2.1a, 2.1b, 2.1c | multi / single (+ Otro) |
| B2-Q13 | 2.2_obj, 2.2_suj, 2.2_acc | multi dinámico (+ Otro) |
| B2-Q14 | 2.4a, 2.4b | single (+ Otra/Otro) |
| B2-Q15 | 2.5, 2.6 | free_text |
| B2-Q16 | 2.3, 2.7 | single / magnitude |
| B2-Q17 | 2.9, 2.11 | single |
| C04 | relations + ranking + 2.A | single / ranking / clarification |
| C05–C07 | 2.8, 2.10, 2.12 + 2.B/C | single / free_text / clarification |

## Plan UI

- **Misma arquitectura Instrumento B1** (`canvas-b1-instrument.module.css`)
- **D4 base** = always-visible Madre only (`2.1, 2.3, 2.4a, 2.4b, 2.5, 2.6, 2.7, 2.9, 2.11`)
- **D5 fixtures** = objeto / sujeto / acción / relations / exception / clarification / causal
- Shell renders any slot in ViewModel; **no** local branching (Runtime decides visibility in X4-2)
- Preview `/dev/ui-b2` (+ `?fixture=…` for reference surfaces)
- No integración B1 ni lienzo; STOP → X4-2
