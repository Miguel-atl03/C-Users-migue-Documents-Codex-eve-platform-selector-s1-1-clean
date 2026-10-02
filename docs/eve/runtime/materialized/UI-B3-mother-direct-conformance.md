# UI-B3 mother-direct conformance

**Authority:**  
`C:/Users/migue/Downloads/.../Bloque_3_Documento_Madre_Capa1_v2_1_EVE_rev3_alineado.docx`  
**SHA256:** `1A89CFF41291EC47FF29852A4F074DD1B4095FDC3772A8B98F568DC7DE921B8E`  
Parsed: `docs/eve/runtime/materialized/madre_b3_authority/fichas_parsed.json`

## Conformance

| elemento_madre | ui_actual | conformant | gap |
|---|---|---|---|
| Identidad Salida / pregunta madre | B3_BLOCK_META + frame | yes | — |
| 19 fichas 3.1…3.D | `b3-madre-copy` + stub | yes | — |
| question_text / short_ui_label / help | Madre-direct | yes | full help (no truncation) |
| options enums | option grids | yes | stable option_id slugs |
| visibility_rule | stored on slots | yes (wave) | not executed locally |
| D4 always-visible spine | base stub | yes | — |
| D5 conditionals / feedback / clarifications / causal | fixtures | yes | — |
| No local sequencer | section maps ViewModel only | yes | — |
| Continuidad B2 / B0.5 | documented | yes | Runtime owns cross-block |

**Verdict:** PASS_VISUAL_BASE (Madre-direct). Binding / sequence authority = later X4-3.
