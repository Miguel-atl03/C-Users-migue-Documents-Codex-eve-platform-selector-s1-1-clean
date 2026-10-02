# UI-B05 — Madre direct conformance

## Classification

`Documento_Madre_directly_validated = true` (visual; gaps documented)

Source: `Bloque_0_5_Documento_Madre_Capa1_v2_1_EVE.docx`  
Assist: `block05-fichas.ts` (not sole authority)  
UI: `OfficialCanvasB05Section` + `b05-madre-copy.ts`

## Gate 1 table

| elemento_madre | ui_actual | conformant | gap | correccion_ui |
|---|---|---|---|---|
| Propósito Encuadre — ¿dónde vive la escena? | Frame line + bands cliente/proceso/hito | yes | — | — |
| 0.5.1 beneficiario (siempre, single_choice) | Field `0.5.1`, dyad_role=benefit, Madre text | yes | — | Madre copy override vs ficha corta |
| 0.5.1a afectado (siempre, single_choice) | Field `0.5.1a`, dyad_role=harm, Madre text | yes | — | Madre copy override |
| Relación visual/conceptual díada | Echo Beneficio·Daño before 0.5.1_rel; independent answers | yes | — | — |
| 0.5.1_rel (después de díada) | Present in base shell | yes | Visibility sequencing is Runtime’s job later | No local branch |
| 0.5.1b (si actores distintos) | Causal fixture only | partial | Not in production base (Madre conditional) | `createB05CausalPreviewViewModel` reference |
| 0.5.1c / 0.5.1d claridad | In base shell; 0.5.1d Madre wording | yes | Help hidden for 0.5.1d (freeze UX) | Documented |
| 0.5.2 proceso | Base shell + Otro | yes | — | — |
| 0.5.3 hito free_text | Base shell | yes | — | — |
| 0.5.4 / 0.5.4a prioridad | Base shell + Otro | yes | — | — |
| 0.5.A / 0.5.B / 0.5.C (por flag) | Clarification control + reference fixtures | partial | Not auto-shown in production | Fixtures only; no local activation |
| C02 (matrix name; Madre causal need) | Causal preview fixture | partial | No productive C02 surface | Fixture `causal_visible` |
| Otro (especificar) | choice + complementaryText | yes | — | Separated fields |
| help_text | Shown when Madre/ficha provide | yes | Truncation to example/first sentence (freeze) | Preserved pattern |
| Ecos contextuales | Dyad echo on 0.5.1_rel | yes | — | — |
| Incertidumbre (No estoy seguro) | Options from ficha/Madre fallbacks | yes | — | — |

## Gate 2 — Madre vs fichas vs UI

| topic | Madre | fichas | UI | resolution |
|---|---|---|---|---|
| 0.5.1a wording | Full “Independientemente…” | Shorter “¿quién es…” | **Madre** via `b05-madre-copy` | Prefer Madre |
| 0.5.1d wording | “¿Qué tan claro tienes quién sufre realmente…” | “¿Y tienes claro quién sufre…” | **Madre** | Prefer Madre |
| Options / Otro | Declared fallbacks | Static option lists | Ficha options (aligned) | Assist OK |
| Flag clarifications | Por flag only | visibility flag_only | Not in base candidate | No invented always-on |

No convenience merge of 0.5.1 + 0.5.1a. No blocker that blocks visual candidate readiness.
