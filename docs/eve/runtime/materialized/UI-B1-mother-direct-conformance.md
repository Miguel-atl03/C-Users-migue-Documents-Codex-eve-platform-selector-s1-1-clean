# UI-B1 mother-direct conformance

Authority: Documento Madre Bloque 1 (Disparador). UI visual candidate only.

| elemento_madre | ui_actual | conformant | gap | correccion_ui |
|---|---|---|---|---|
| Propósito Disparador / pregunta madre | frame_line + marquee B1 | yes | — | — |
| 1.1 single_choice + 6 opciones | slot `1.1` Madre options | yes | — | — |
| 1.2 single_choice + 3 opciones | slot `1.2` | yes | — | — |
| 1.3 single_choice + 4 opciones | slot `1.3` | yes | — | — |
| 1.4 single_choice + 6 opciones | slot `1.4` | yes | — | — |
| 1.5 multi_choice + Otro texto | slot `1.5` multi + complementary | yes | — | — |
| 1.6 free_text ≤150 | slot `1.6` max_chars=150 | yes | — | — |
| 1.7 single_choice + 4 opciones | slot `1.7` | yes | — | — |
| 1.8 conditional free_text ≤200 | fixture `exception_visible` only | yes | no local branch show | intentional UI-wave |
| 1.A clarification | fixture `clarification_visible` | yes | no Runtime gate | intentional |
| 1.B clarification | fixture | yes | — | — |
| 1.C hybrid sin enum fijo Madre | clarification free_text | partial | matrix hybrid vs Madre sin opciones fijas | no inventar enum; X4 metadata |
| help_text Madre | presentHelp examples/first sentence | yes | full help trimmed for UI | OK |
| No secuenciador local | section without branch engine | yes | — | — |

**Verdict:** Madre-direct visual conformance PASS for base 1.1–1.7; conditional/clarification as fixtures.
