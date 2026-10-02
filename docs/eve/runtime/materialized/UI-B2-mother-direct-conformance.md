# UI-B2 mother-direct conformance

**Authority used in this re-run (user-provided):**  
`C:/Users/migue/Downloads/Diseno Estructural de la Arquitectura de Entrerprise Viability Engine - Strategy and Operations/Bloques de preguntas/Bloque_2_Documento_Madre_Capa1_v2_1_EVE.docx`

**SHA256:** `0E134EE7E73DBB4B5B54A833712E2D15B5F03BCAF84219A50B21AB0E7CCD38CC`  
Parsed fichas: `docs/eve/runtime/materialized/madre_b2_authority/fichas_parsed.json`

## Honesty note (correction)

La ola UI-B2 previa **no** partió de este path de Downloads que acabas de señalar como rector. Usó un extracto secundario (`evidence/.../Bloque_2_....extracted.txt`) y documentó “Madre-direct PASS” demasiado pronto.

Ese extracto coincide en SHA con el docx que diste (`0E134EE7…`), pero la metodología exige **Madre-direct** atado al documento canónico y a su path/SHA explícitos. Este re-run:

1. Verifica el SHA del docx en Downloads.
2. Re-parsea las 26 fichas canónicas.
3. Corrige copy (placeholders `{OBJETO}/{SUJETO}/{ACCIÓN}`, labels 2.4b/2.8/2.10/2.12, help_text drift).
4. Alinea `visibility_rule` del stub con la Madre (sin ejecutar branching local).

## Conformance table (post-correction)

| elemento_madre | ui_actual | conformant | gap | correccion_ui |
|---|---|---|---|---|
| Identidad Transformación / pregunta madre | title + frame_line + B2_BLOCK_META | yes | — | — |
| 26 fichas 2.1…2.C | `b2-madre-copy` + stub surfaces | yes | — | regenerated / checked |
| question_text Madre | `B2_MADRE_QUESTION_TEXT` | yes | — | placeholders restored |
| short_ui_label Madre | `B2_MADRE_SHORT_LABEL` | yes | — | 2.4b/2.8/2.10/2.12 |
| help_text Madre | `B2_MADRE_HELP_TEXT` | yes | — | synced 2.3/2.4b/2.8/2.10–2.12/ABC |
| options fixed enums | option grids | yes | option_id = stable UI ids | OK |
| 2.2_* dynamic options | stub Factura/Proveedor/Coordinar | partial | Madre = dynamic by entity | X4 metadata |
| visibility_rule | stored on slots; **not** executed locally | yes (wave) | Runtime owns show/hide | intentional |
| D4 always-visible spine | base stub | yes | — | — |
| D5 conditionals / causal | fixtures | yes | — | — |
| No local sequencer | section maps ViewModel only | yes | — | — |

**Verdict:** Madre-direct visual conformance **PASS** for fixed copy/controls after this re-run; **PARTIAL** only for dynamic 2.2 catalogs (documented stub until X4).
