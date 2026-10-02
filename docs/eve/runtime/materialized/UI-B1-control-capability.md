# UI-B1 control capability

Canonical shell: `OfficialCanvasB1InstrumentSection`.

| control_family | used_by | ui_ready | notes |
|---|---|---|---|
| single_choice | 1.1, 1.2, 1.3, 1.4, 1.7 | ready | Instrumento option grid |
| multi_choice | 1.5 | ready | multi-select buttons |
| choice_plus_text (complement) | 1.5 Otro | ready | complementaryText separable |
| free_text | 1.6, 1.8 | ready | max_chars Madre |
| clarification | 1.A, 1.B, 1.C | ready (fixture) | not in production base |
| fallback_textarea | — | forbidden | not present |

`estado_desarrollo_control = ready` (visual only).  
Passthrough attrs: `data-field-key`, `data-slot-ref` (unset until X4-1).
